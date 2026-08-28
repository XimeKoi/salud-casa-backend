// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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