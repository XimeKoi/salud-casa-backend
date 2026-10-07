// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Paciente } from '../personal/entities/paciente.entity';
import { Incidencia } from '../personal/entities/incidencia.entity';
import { Personal } from '../personal/entities/personal.entity';
import {
    ResumenGeneralResponse,
    VisitaDiariaResponse,
    RendimientoZonaResponse,
    HistoricoQuincenalResponse,
    HorarioZonaResponse,
    AceptacionRechazoResponse
} from '../personal/dto/dashboard-response.dto';

@Injectable()
export class DashboardService {

    private readonly META_DIARIA = 15;
    private readonly META_TOTAL = 300;

    constructor(
        @InjectRepository(Paciente)
        private pacienteRepository: Repository<Paciente>,
        @InjectRepository(Incidencia)
        private incidenciaRepository: Repository<Incidencia>,
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>,
        private dataSource: DataSource,  // ⭐ NUEVO
    ) { }

    // ⭐ ============================================
    // ⭐ RESUMEN GENERAL
    // ⭐ ============================================

    async getResumenGeneral(): Promise<ResumenGeneralResponse> {
        try {
            const coberturaTotal = await this.pacienteRepository.count();

            const visitasHoy = await this.pacienteRepository.count({
                where: {
                    estatus: 'VISITADO'
                }
            });

            return {
                visitasHoy: visitasHoy || 0,
                metaDiaria: this.META_DIARIA,
                coberturaTotal: coberturaTotal || 0,
                metaTotal: this.META_TOTAL
            };
        } catch (error) {
            console.error('Error en getResumenGeneral:', error);
            return this.getResumenGeneralFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ VISITAS DIARIAS (ÚLTIMOS 7 DÍAS)
    // ⭐ ============================================

    async getVisitasDiarias(): Promise<VisitaDiariaResponse[]> {
        try {
            const resultado: VisitaDiariaResponse[] = [];
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);

                const visitas = await this.pacienteRepository.count({
                    where: {
                        estatus: 'VISITADO'
                    }
                });

                const cumplimiento = this.META_DIARIA > 0
                    ? Math.round((visitas / this.META_DIARIA) * 100)
                    : 0;

                resultado.push({
                    fecha: diasSemana[fecha.getDay()],
                    realizadas: visitas || 0,
                    meta: this.META_DIARIA,
                    cumplimiento: Math.min(cumplimiento, 100)
                });
            }

            return resultado;
        } catch (error) {
            console.error('Error en getVisitasDiarias:', error);
            return this.getVisitasDiariasFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ RENDIMIENTO POR ZONA
    // ⭐ ============================================

    async getRendimientoZonas(): Promise<RendimientoZonaResponse[]> {
        try {
            const zonas = await this.pacienteRepository
                .createQueryBuilder('p')
                .select('DISTINCT p.zonaTrabajo', 'zona')
                .where('p.zonaTrabajo IS NOT NULL')
                .andWhere('p.zonaTrabajo != :empty', { empty: '' })
                .getRawMany();

            const resultado: RendimientoZonaResponse[] = [];

            for (const zonaRaw of zonas) {
                const zonaNombre = zonaRaw.zona;
                if (!zonaNombre) continue;

                const pacientes = await this.pacienteRepository.find({
                    where: {
                        zonaTrabajo: zonaNombre
                    }
                });

                const programadas = pacientes.length;
                if (programadas === 0) continue;

                const pacienteIds = pacientes.map(p => p.id);

                const realizadas = pacientes.filter(p =>
                    p.estatus === 'VISITADO' || p.estatus === 'COMPLETADA'
                ).length;

                const rechazos = await this.incidenciaRepository
                    .createQueryBuilder('i')
                    .where('i.pacienteId IN (:...ids)', { ids: pacienteIds })
                    .andWhere('i.tipo = :tipo', { tipo: 'usuario_rechazo' })
                    .getCount();

                const cumplimiento = programadas > 0 ? Math.round((realizadas / programadas) * 100) : 0;
                const aceptacion = programadas > 0 ? Math.round(((programadas - rechazos) / programadas) * 100) : 0;
                const rechazo = programadas > 0 ? Math.round((rechazos / programadas) * 100) : 0;

                resultado.push({
                    zona: zonaNombre,
                    visitasProgramadas: programadas,
                    visitasRealizadas: realizadas,
                    cumplimiento: Math.min(cumplimiento, 100),
                    aceptacion: Math.min(aceptacion, 100),
                    rechazo: Math.min(rechazo, 100)
                });
            }

            return resultado.sort((a, b) => b.cumplimiento - a.cumplimiento);
        } catch (error) {
            console.error('Error en getRendimientoZonas:', error);
            return this.getRendimientoZonasFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ HISTÓRICO QUINCENAL
    // ⭐ ============================================

    async getHistoricoQuincenal(): Promise<HistoricoQuincenalResponse[]> {
        try {
            const resultado: HistoricoQuincenalResponse[] = [];
            const hoy = new Date();

            for (let i = 4; i >= 0; i--) {
                const finQuincena = new Date(hoy);
                finQuincena.setDate(finQuincena.getDate() - (i * 15));

                const inicioQuincena = new Date(finQuincena);
                inicioQuincena.setDate(inicioQuincena.getDate() - 14);

                const visitas = await this.pacienteRepository
                    .createQueryBuilder('p')
                    .where('p.estatus IN (:...estatus)', {
                        estatus: ['VISITADO', 'COMPLETADA']
                    })
                    .getCount();

                const diaInicio = inicioQuincena.getDate();
                const mesFin = this.getMesAbreviado(finQuincena);
                const diaFin = finQuincena.getDate();

                const periodo = `${diaInicio}-${diaFin} ${mesFin}`;

                resultado.push({
                    periodo,
                    visitas: visitas || 0,
                    promedio: Math.round((visitas || 0) / 15)
                });
            }

            return resultado;
        } catch (error) {
            console.error('Error en getHistoricoQuincenal:', error);
            return this.getHistoricoQuincenalFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ HORARIOS POR ZONA
    // ⭐ ============================================

    async getHorariosZonas(): Promise<HorarioZonaResponse[]> {
        try {
            const zonas = await this.pacienteRepository
                .createQueryBuilder('p')
                .select('p.zonaTrabajo', 'zona')
                .addSelect('COUNT(p.id)', 'total')
                .where('p.zonaTrabajo IS NOT NULL')
                .andWhere('p.zonaTrabajo != :empty', { empty: '' })
                .groupBy('p.zonaTrabajo')
                .orderBy('total', 'DESC')
                .limit(5)
                .getRawMany();

            const horariosMap: { [key: string]: string } = {
                'LOS MANANTIALES': '9:00 - 12:00',
                'LOS NARANJOS': '14:00 - 17:00',
                'SANTA ROSA': '10:00 - 13:00',
                'REAL DE SAN JOSE': '8:00 - 11:00',
                'MISION DE SAN JOSE': '11:00 - 14:00',
                'REAL SAN JOSE': '8:00 - 11:00',
                'MISION SAN JOSE': '11:00 - 14:00',
                'JARDINES NARANJOS': '9:00 - 12:00',
                'EL MANANTIAL': '9:00 - 12:00',
                'RESIDENCIAL VICTORIA': '10:00 - 13:00',
                'VICTORIA': '10:00 - 13:00',
                'SAN JOSE C.': '8:00 - 11:00',
                'VALLE SEÑORA II': '11:00 - 14:00',
                'SAN PABLO SUR': '14:00 - 17:00'
            };

            const horarioDefault = '9:00 - 14:00';

            return zonas.map(z => {
                const zonaNombre = (z.zona || '').toUpperCase().trim();
                let horario = horariosMap[zonaNombre] || horarioDefault;

                if (!horariosMap[zonaNombre]) {
                    for (const [key, value] of Object.entries(horariosMap)) {
                        if (zonaNombre.includes(key) || key.includes(zonaNombre)) {
                            horario = value;
                            break;
                        }
                    }
                }

                return {
                    zona: z.zona || 'Sin zona',
                    horario,
                    pacientes: parseInt(z.total) || 0
                };
            });
        } catch (error) {
            console.error('Error en getHorariosZonas:', error);
            return this.getHorariosZonasFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ ZONAS CON MAYOR ACEPTACIÓN/RECHAZO
    // ⭐ ============================================

    async getZonasAceptacionRechazo(): Promise<AceptacionRechazoResponse> {
        try {
            const rendimiento = await this.getRendimientoZonas();

            const mayorAceptacion = [...rendimiento]
                .sort((a, b) => b.aceptacion - a.aceptacion)
                .slice(0, 3)
                .map(z => ({
                    zona: z.zona,
                    porcentaje: z.aceptacion
                }));

            const mayorRechazo = [...rendimiento]
                .sort((a, b) => b.rechazo - a.rechazo)
                .slice(0, 3)
                .map(z => ({
                    zona: z.zona,
                    porcentaje: z.rechazo
                }));

            return { mayorAceptacion, mayorRechazo };
        } catch (error) {
            console.error('Error en getZonasAceptacionRechazo:', error);
            return this.getZonasAceptacionRechazoFallback();
        }
    }

    // ⭐ ============================================
    // ⭐ ⭐ ⭐ NUEVO: RENDIMIENTO COMPLETO POR DÍA Y ENFERMERA
    // ⭐ Combina visitas_programadas (programadas) + pacientes.fecha_visita (realizadas)
    // ⭐ ============================================

    async getRendimientoCompleto(
        fechaInicio?: string,
        fechaFin?: string,
        idEnfermera?: number
    ): Promise<any> {
        try {
            const hoy = new Date();
            const hace7 = new Date();
            hace7.setDate(hoy.getDate() - 6);

            const fin = fechaFin || hoy.toISOString().split('T')[0];
            const inicio = fechaInicio || hace7.toISOString().split('T')[0];

            const filtroEnfermeraV = idEnfermera ? `AND v.usuario_id = ${idEnfermera}` : '';
            const filtroEnfermeraP = idEnfermera ? `AND p.id_enfermera = ${idEnfermera}` : '';

            // 1. PROGRAMADAS
            const programadas = await this.dataSource.query(`
                SELECT 
                    v.fecha::text AS dia,
                    v.usuario_id AS id_enfermera,
                    u.usuario AS usuario,
                    pe.nombre_completo AS nombre_enfermera,
                    COUNT(*) AS programadas
                FROM visitas_programadas v
                LEFT JOIN usuario u ON v.usuario_id = u.id_usuario
                LEFT JOIN personal_enfermeria pe ON u.id_personal_enfermeria = pe.id
                WHERE v.fecha BETWEEN $1 AND $2
                ${filtroEnfermeraV}
                GROUP BY v.fecha, v.usuario_id, u.usuario, pe.nombre_completo
                ORDER BY v.fecha DESC, programadas DESC
            `, [inicio, fin]);

            // 2. REALIZADAS
            const realizadas = await this.dataSource.query(`
                SELECT 
                    p.fecha_visita::date::text AS dia,
                    p.id_enfermera AS id_enfermera,
                    u.usuario AS usuario,
                    pe.nombre_completo AS nombre_enfermera,
                    COUNT(*) AS realizadas
                FROM pacientes p
                LEFT JOIN usuario u ON p.id_enfermera = u.id_usuario
                LEFT JOIN personal_enfermeria pe ON u.id_personal_enfermeria = pe.id
                WHERE p.fecha_visita IS NOT NULL
                  AND p.fecha_visita::date BETWEEN $1 AND $2
                  AND UPPER(p.estatus) IN ('VISITADO', 'COMPLETADA')
                ${filtroEnfermeraP}
                GROUP BY p.fecha_visita::date, p.id_enfermera, u.usuario, pe.nombre_completo
                ORDER BY p.fecha_visita::date DESC, realizadas DESC
            `, [inicio, fin]);

            // 3. COMBINAR
            const mapa = new Map<string, any>();

            programadas.forEach((p: any) => {
                const key = `${p.dia}|${p.id_enfermera || 'null'}`;
                mapa.set(key, {
                    dia: p.dia,
                    id_enfermera: p.id_enfermera,
                    usuario: p.usuario,
                    nombre_enfermera: p.nombre_enfermera,
                    programadas: parseInt(p.programadas) || 0,
                    realizadas: 0,
                });
            });

            realizadas.forEach((r: any) => {
                const key = `${r.dia}|${r.id_enfermera || 'null'}`;
                if (mapa.has(key)) {
                    mapa.get(key).realizadas = parseInt(r.realizadas) || 0;
                } else {
                    mapa.set(key, {
                        dia: r.dia,
                        id_enfermera: r.id_enfermera,
                        usuario: r.usuario,
                        nombre_enfermera: r.nombre_enfermera,
                        programadas: 0,
                        realizadas: parseInt(r.realizadas) || 0,
                    });
                }
            });

            // 4. CALCULAR PENDIENTES Y CUMPLIMIENTO
            const resultado = Array.from(mapa.values()).map((item: any) => {
                const pendientes = Math.max(0, item.programadas - item.realizadas);
                const cumplimiento = item.programadas > 0
                    ? Math.round((item.realizadas / item.programadas) * 100)
                    : 0;

                return {
                    ...item,
                    pendientes,
                    cumplimiento,
                };
            });

            resultado.sort((a, b) => (a.dia < b.dia ? 1 : -1));

            return {
                rango: { inicio, fin },
                total_registros: resultado.length,
                data: resultado,
            };
        } catch (error) {
            console.error('Error en getRendimientoCompleto:', error);
            return { rango: { inicio: fechaInicio, fin: fechaFin }, total_registros: 0, data: [] };
        }
    }

    // ⭐ ============================================
    // ⭐ ⭐ ⭐ NUEVO: RENDIMIENTO POR ENFERMERA (RANGO COMPLETO)
    // ⭐ ============================================

    async getRendimientoPorEnfermera(
        fechaInicio?: string,
        fechaFin?: string
    ): Promise<any> {
        try {
            const hoy = new Date();
            const hace30 = new Date();
            hace30.setDate(hoy.getDate() - 29);

            const fin = fechaFin || hoy.toISOString().split('T')[0];
            const inicio = fechaInicio || hace30.toISOString().split('T')[0];

            const result = await this.dataSource.query(`
                SELECT 
                    u.id_usuario AS id_enfermera,
                    u.usuario,
                    pe.nombre_completo,
                    pe.zona_apoyo,
                    COALESCE(prog.total, 0) AS programadas,
                    COALESCE(reali.total, 0) AS realizadas
                FROM usuario u
                LEFT JOIN personal_enfermeria pe ON u.id_personal_enfermeria = pe.id
                LEFT JOIN (
                    SELECT usuario_id, COUNT(*) AS total
                    FROM visitas_programadas
                    WHERE fecha BETWEEN $1 AND $2
                    GROUP BY usuario_id
                ) prog ON prog.usuario_id = u.id_usuario
                LEFT JOIN (
                    SELECT id_enfermera, COUNT(*) AS total
                    FROM pacientes
                    WHERE fecha_visita IS NOT NULL
                      AND fecha_visita::date BETWEEN $1 AND $2
                      AND UPPER(estatus) IN ('VISITADO', 'COMPLETADA')
                    GROUP BY id_enfermera
                ) reali ON reali.id_enfermera = u.id_usuario
                WHERE u.rol = 'enfermera'
                ORDER BY realizadas DESC
            `, [inicio, fin]);

            return {
                rango: { inicio, fin },
                data: result.map((r: any) => {
                    const programadas = parseInt(r.programadas) || 0;
                    const realizadas = parseInt(r.realizadas) || 0;
                    return {
                        id_enfermera: r.id_enfermera,
                        usuario: r.usuario,
                        nombre_completo: r.nombre_completo,
                        zona_apoyo: r.zona_apoyo,
                        programadas,
                        realizadas,
                        pendientes: Math.max(0, programadas - realizadas),
                        cumplimiento: programadas > 0
                            ? Math.round((realizadas / programadas) * 100)
                            : 0,
                    };
                }),
            };
        } catch (error) {
            console.error('Error en getRendimientoPorEnfermera:', error);
            return { rango: { inicio: fechaInicio, fin: fechaFin }, data: [] };
        }
    }

    // ⭐ ============================================
    // ⭐ MÉTODOS AUXILIARES
    // ⭐ ============================================

    private getMesAbreviado(fecha: Date): string {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return meses[fecha.getMonth()];
    }

    // ⭐ ============================================
    // ⭐ DATOS DE RESPALDO (PARA PRUEBAS)
    // ⭐ ============================================

    getResumenGeneralFallback(): ResumenGeneralResponse {
        return {
            visitasHoy: 13,
            metaDiaria: 15,
            coberturaTotal: 200,
            metaTotal: 300
        };
    }

    getVisitasDiariasFallback(): VisitaDiariaResponse[] {
        return [
            { fecha: 'Lun', realizadas: 12, meta: 15, cumplimiento: 80 },
            { fecha: 'Mar', realizadas: 14, meta: 15, cumplimiento: 93 },
            { fecha: 'Mié', realizadas: 13, meta: 15, cumplimiento: 87 },
            { fecha: 'Jue', realizadas: 15, meta: 15, cumplimiento: 100 },
            { fecha: 'Vie', realizadas: 11, meta: 15, cumplimiento: 73 },
            { fecha: 'Sáb', realizadas: 9, meta: 12, cumplimiento: 75 },
            { fecha: 'Dom', realizadas: 6, meta: 10, cumplimiento: 60 }
        ];
    }

    getRendimientoZonasFallback(): RendimientoZonaResponse[] {
        return [
            { zona: 'Los Manantiales', visitasProgramadas: 20, visitasRealizadas: 19, cumplimiento: 95, aceptacion: 95, rechazo: 5 },
            { zona: 'Los Naranjos', visitasProgramadas: 18, visitasRealizadas: 15, cumplimiento: 83, aceptacion: 80, rechazo: 20 },
            { zona: 'Santa Rosa', visitasProgramadas: 15, visitasRealizadas: 12, cumplimiento: 80, aceptacion: 75, rechazo: 25 },
            { zona: 'Real San José', visitasProgramadas: 12, visitasRealizadas: 11, cumplimiento: 92, aceptacion: 90, rechazo: 10 },
            { zona: 'Misión San José', visitasProgramadas: 10, visitasRealizadas: 8, cumplimiento: 80, aceptacion: 70, rechazo: 30 }
        ];
    }

    getHistoricoQuincenalFallback(): HistoricoQuincenalResponse[] {
        return [
            { periodo: '1-15 Jul', visitas: 180, promedio: 12 },
            { periodo: '16-31 Jul', visitas: 200, promedio: 13 },
            { periodo: '1-15 Ago', visitas: 190, promedio: 13 },
            { periodo: '16-31 Ago', visitas: 210, promedio: 14 },
            { periodo: '1-15 Sep', visitas: 195, promedio: 13 }
        ];
    }

    getHorariosZonasFallback(): HorarioZonaResponse[] {
        return [
            { zona: 'Los Manantiales', horario: '9:00 - 12:00', pacientes: 20 },
            { zona: 'Los Naranjos', horario: '14:00 - 17:00', pacientes: 18 },
            { zona: 'Santa Rosa', horario: '10:00 - 13:00', pacientes: 15 },
            { zona: 'Real San José', horario: '8:00 - 11:00', pacientes: 12 },
            { zona: 'Misión San José', horario: '11:00 - 14:00', pacientes: 10 }
        ];
    }

    getZonasAceptacionRechazoFallback(): AceptacionRechazoResponse {
        return {
            mayorAceptacion: [
                { zona: 'Los Manantiales', porcentaje: 95 },
                { zona: 'Real San José', porcentaje: 90 },
                { zona: 'Los Naranjos', porcentaje: 80 }
            ],
            mayorRechazo: [
                { zona: 'Misión San José', porcentaje: 30 },
                { zona: 'Santa Rosa', porcentaje: 25 },
                { zona: 'Los Naranjos', porcentaje: 20 }
            ]
        };
    }
}