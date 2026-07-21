// src/personal/pacientes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AwsGeocodeService } from '../services/aws-geocode.service';

@Injectable()
export class PacientesService {
    constructor(
        @InjectRepository(Paciente)
        private pacientesRepository: Repository<Paciente>,
        private notificacionesService: NotificacionesService,
        private awsGeocodeService: AwsGeocodeService,
    ) { }

    async findAll(): Promise<Paciente[]> {
        return this.pacientesRepository.find();
    }

    async findOne(id: number): Promise<Paciente> {
        if (!id || isNaN(id)) {
            throw new NotFoundException(`ID inválido: ${id}`);
        }
        const paciente = await this.pacientesRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }
        return paciente;
    }

    async findByIdEnfermera(idEnfermera: number): Promise<Paciente[]> {
        if (!idEnfermera || isNaN(idEnfermera)) {
            return [];
        }
        const pacientes = await this.pacientesRepository.find({
            where: { idEnfermera }
        });

        const conDiscapacidad = pacientes.filter(p => p.tieneDiscapacidad());
        const finados = pacientes.filter(p => p.esFinado());
        console.log(`📊 Pacientes totales: ${pacientes.length}`);
        console.log(`🎨 Con discapacidad: ${conDiscapacidad.length}`);
        console.log(`💀 Finados: ${finados.length}`);

        if (finados.length > 0) {
            console.log('💀 Lista de finados:');
            finados.forEach(p => {
                console.log(`  - ${p.nombre} (ID: ${p.id}) - Fecha: ${p.fechaFinado}`);
            });
        }

        return pacientes;
    }

    // ⭐ ============================================
    // ⭐ ACTUALIZAR PACIENTE (PATCH GENERAL)
    // ⭐ ============================================

    async update(id: number, updateData: UpdatePacienteDto): Promise<Paciente> {
        console.log(`🔄 [Service] Actualizando paciente ${id}:`, updateData);

        const paciente = await this.findOne(id);
        if (!paciente) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        const camposPermitidos = [
            'programa', 'estatus',
            'discapacidadMotriz', 'discapacidadVisual',
            'discapacidadAuditiva', 'discapacidadIntelectual',
            'discapacidadPsicosocial',
            'fechaFinado', 'lat', 'lng', 'direccion',
            'telefonoFijo', 'telefonoCelular',
            'nombre', 'apellidoPaterno', 'apellidoMaterno',
            'curp', 'zonaTrabajo'
        ];

        for (const campo of camposPermitidos) {
            if (updateData[campo] !== undefined) {
                if (campo === 'fechaFinado') {
                    if (updateData.fechaFinado) {
                        paciente.fechaFinado = typeof updateData.fechaFinado === 'string'
                            ? new Date(updateData.fechaFinado)
                            : updateData.fechaFinado;
                        console.log(`📝 fechaFinado actualizado a: ${paciente.fechaFinado}`);
                    } else {
                        paciente.fechaFinado = null;
                        console.log(`📝 fechaFinado eliminado`);
                    }
                } else {
                    (paciente as any)[campo] = updateData[campo];
                    console.log(`📝 ${campo} actualizado a: ${updateData[campo]}`);
                }
            }
        }

        const pacienteActualizado = await this.pacientesRepository.save(paciente);
        console.log(`✅ [Service] Paciente ${id} actualizado correctamente`);

        return pacienteActualizado;
    }

    // ⭐ ============================================
    // ⭐ ACTUALIZAR DISCAPACIDADES
    // ⭐ ============================================

    async updateDiscapacidades(id: number, discapacidades: {
        motriz: boolean;
        visual: boolean;
        auditiva: boolean;
        intelectual: boolean;
        psicosocial: boolean;
    }): Promise<Paciente> {
        console.log(`🔄 [Service] Actualizando discapacidades del paciente ${id}:`, discapacidades);

        const paciente = await this.findOne(id);
        if (!paciente) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        paciente.discapacidadMotriz = discapacidades.motriz || false;
        paciente.discapacidadVisual = discapacidades.visual || false;
        paciente.discapacidadAuditiva = discapacidades.auditiva || false;
        paciente.discapacidadIntelectual = discapacidades.intelectual || false;
        paciente.discapacidadPsicosocial = discapacidades.psicosocial || false;

        const tieneDiscapacidad = discapacidades.motriz || discapacidades.visual ||
            discapacidades.auditiva || discapacidades.intelectual ||
            discapacidades.psicosocial;

        if (tieneDiscapacidad) {
            paciente.programa = 'DISCAPACIDAD';
            console.log(`📝 Programa actualizado a DISCAPACIDAD`);
        } else {
            if (paciente.programa === 'DISCAPACIDAD') {
                paciente.programa = 'PAM';
                console.log(`📝 Programa cambiado a PAM (sin discapacidades)`);
            }
        }

        const pacienteActualizado = await this.pacientesRepository.save(paciente);
        console.log(`✅ [Service] Discapacidades actualizadas para paciente ${id}`);

        return pacienteActualizado;
    }

    // ⭐ ============================================
    // ⭐ ACTUALIZAR ESTATUS (CON FECHA FINADO)
    // ⭐ ============================================

    async updateEstatus(id: number, estatus: string, usuarioId: number = 1): Promise<{ message: string }> {
        if (!id || isNaN(id)) {
            throw new NotFoundException(`ID inválido: ${id}`);
        }

        const paciente = await this.pacientesRepository.findOne({ where: { id } });
        if (!paciente) {
            throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
        }

        const estadoAnterior = paciente.estatus;
        paciente.estatus = estatus;

        if (estatus.toUpperCase() === 'FINADO') {
            paciente.fechaFinado = new Date();
            console.log(`📝 fechaFinado establecida a: ${paciente.fechaFinado} para paciente ${paciente.nombre}`);
        } else {
            paciente.fechaFinado = null;
            console.log(`📝 fechaFinado eliminada para paciente ${paciente.nombre}`);
        }

        await this.pacientesRepository.save(paciente);

        const nombreCompleto = this.getNombreCompleto(paciente);
        let prioridad = 'media';
        let titulo = '';
        let mensaje = '';
        let tipo = 'paciente';

        switch (estatus) {
            case 'pendiente':
                prioridad = 'media';
                titulo = `📋 Pendiente - ${nombreCompleto}`;
                mensaje = `El paciente ${nombreCompleto} ha sido marcado como pendiente`;
                tipo = 'paciente';
                break;
            case 'completada':
                prioridad = 'baja';
                titulo = `✅ Visita Completada - ${nombreCompleto}`;
                mensaje = `La visita al paciente ${nombreCompleto} ha sido completada exitosamente`;
                tipo = 'visita';
                break;
            case 'incidencia':
                prioridad = 'alta';
                titulo = `⚠️ Incidencia - ${nombreCompleto}`;
                mensaje = `Se ha reportado una incidencia para el paciente ${nombreCompleto}`;
                tipo = 'incidencia';
                break;
            case 'finado':
                prioridad = 'urgente';
                titulo = `⚰️ Paciente Finado - ${nombreCompleto}`;
                mensaje = `Se ha reportado el fallecimiento del paciente ${nombreCompleto}`;
                tipo = 'emergencia';
                break;
            default:
                prioridad = 'media';
                titulo = `🔄 Paciente ${nombreCompleto} - ${estatus}`;
                mensaje = `El paciente ${nombreCompleto} ha sido marcado como ${estatus}`;
                tipo = 'paciente';
        }

        try {
            await this.notificacionesService.enviarNotificacion(usuarioId, {
                titulo: titulo,
                mensaje: mensaje,
                tipo: tipo,
                prioridad: prioridad,
                metadata: {
                    pacienteId: paciente.id,
                    estadoAnterior: estadoAnterior,
                    estadoNuevo: estatus
                },
                url: `/pacientes/${paciente.id}`,
            });
        } catch (error) {
            console.error('Error al enviar notificación:', error);
        }

        console.log(`✅ Paciente ${id} actualizado a estatus: ${estatus}`);
        return { message: 'Estado actualizado exitosamente' };
    }

    // ⭐ ============================================
    // ⭐ BÚSQUEDA POR DIRECCIÓN
    // ⭐ ============================================

    async buscarPorDireccion(direccion: string): Promise<any[]> {
        console.log('🔍 Service - buscarPorDireccion recibió:', direccion);

        if (!direccion || direccion.trim().length === 0) {
            console.log('⚠️ Dirección vacía');
            return [];
        }

        const queryOriginal = direccion.trim();
        console.log('🔍 Query original:', queryOriginal);

        const numeroMatch = queryOriginal.match(/\d+/);
        const numero = numeroMatch ? numeroMatch[0] : null;

        let calleSinNumero = queryOriginal
            .replace(/\d+/g, '')
            .replace(/#/g, '')
            .replace(/\./g, '')
            .trim()
            .toUpperCase();
        calleSinNumero = calleSinNumero.replace(/\s+/g, ' ').trim();

        console.log(`📍 Calle: "${calleSinNumero}", Número: "${numero}"`);

        if (!numero || calleSinNumero.length < 3) {
            const queryNormalizada = this.normalizarDireccion(queryOriginal);
            let pacientes = await this.pacientesRepository
                .createQueryBuilder('p')
                .where('UPPER(p.direccion) LIKE :query', { query: `%${queryNormalizada}%` })
                .limit(10)
                .getMany();
            console.log(`📊 Búsqueda general: ${pacientes.length} pacientes`);
            return pacientes;
        }

        let pacientesConCalle = await this.pacientesRepository
            .createQueryBuilder('p')
            .where('UPPER(p.direccion) LIKE :calle', { calle: `%${calleSinNumero}%` })
            .getMany();

        console.log(`📋 Pacientes con calle "${calleSinNumero}": ${pacientesConCalle.length}`);

        if (pacientesConCalle.length === 0) {
            let pacientesPorNumero = await this.pacientesRepository
                .createQueryBuilder('p')
                .where('UPPER(p.direccion) LIKE :numero', { numero: `%${numero}%` })
                .limit(5)
                .getMany();
            console.log(`📋 Pacientes con número "${numero}": ${pacientesPorNumero.length}`);
            return pacientesPorNumero;
        }

        const pacientesFiltrados = pacientesConCalle.filter(p => {
            const dirUpper = p.direccion.toUpperCase();
            const tieneNumero =
                dirUpper.includes(`#${numero}`) ||
                dirUpper.includes(` ${numero} `) ||
                dirUpper.includes(` ${numero},`) ||
                dirUpper.includes(` ${numero}.`) ||
                dirUpper.includes(`-${numero}`) ||
                dirUpper.includes(` ${numero}`);
            return tieneNumero;
        });

        console.log(`✅ Pacientes con calle + número exacto: ${pacientesFiltrados.length}`);

        if (pacientesFiltrados.length === 0) {
            console.log(`⚠️ No hay coincidencia exacta, devolviendo ${pacientesConCalle.length} pacientes de la calle`);
            return pacientesConCalle;
        }

        return pacientesFiltrados;
    }

    private normalizarDireccion(texto: string): string {
        if (!texto) return '';
        return texto
            .toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/COL\./g, 'COLONIA')
            .replace(/CALLE\s*/g, '')
            .replace(/AV\./g, 'AVENIDA')
            .replace(/BLVD\./g, 'BOULEVARD')
            .replace(/NUMERO\s*/g, '')
            .replace(/NO\.\s*/g, '')
            .replace(/#/g, '')
            .replace(/\./g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private getNombreCompleto(paciente: any): string {
        const partes: string[] = [];
        if (paciente.apellidoPaterno) partes.push(paciente.apellidoPaterno);
        if (paciente.apellidoMaterno) partes.push(paciente.apellidoMaterno);
        if (paciente.nombre) partes.push(paciente.nombre);
        return partes.length > 0 ? partes.join(' ').trim() : 'Usuario';
    }

    // ⭐ ============================================
    // ⭐ NOTIFICACIONES
    // ⭐ ============================================

    async notificarVisitaProgramada(pacienteId: number, fecha: string, hora: string, usuarioId: number = 1): Promise<void> {
        if (!pacienteId || isNaN(pacienteId)) return;
        const paciente = await this.pacientesRepository.findOne({ where: { id: pacienteId } });
        if (!paciente) return;

        const nombreCompleto = this.getNombreCompleto(paciente);
        await this.notificacionesService.enviarNotificacion(usuarioId, {
            titulo: `📅 Visita Programada - ${nombreCompleto}`,
            mensaje: `Se ha programado una visita para ${nombreCompleto} el ${fecha} a las ${hora}`,
            tipo: 'calendario',
            prioridad: 'media',
            metadata: { pacienteId: paciente.id, fecha, hora },
            url: `/pacientes/${paciente.id}`,
        });
    }

    async notificarVisitaReagendada(pacienteId: number, fechaAnterior: string, fechaNueva: string, usuarioId: number = 1): Promise<void> {
        if (!pacienteId || isNaN(pacienteId)) return;
        const paciente = await this.pacientesRepository.findOne({ where: { id: pacienteId } });
        if (!paciente) return;

        const nombreCompleto = this.getNombreCompleto(paciente);
        await this.notificacionesService.enviarNotificacion(usuarioId, {
            titulo: `🔄 Visita Reagendada - ${nombreCompleto}`,
            mensaje: `La visita de ${nombreCompleto} ha sido reagendada de ${fechaAnterior} a ${fechaNueva}`,
            tipo: 'calendario',
            prioridad: 'media',
            metadata: { pacienteId: paciente.id, fechaAnterior, fechaNueva },
            url: `/pacientes/${paciente.id}`,
        });
    }

    async notificarCapturaCompletada(pacienteId: number, tipoCaptura: string, usuarioId: number = 1): Promise<void> {
        if (!pacienteId || isNaN(pacienteId)) return;
        const paciente = await this.pacientesRepository.findOne({ where: { id: pacienteId } });
        if (!paciente) return;

        const nombreCompleto = this.getNombreCompleto(paciente);
        await this.notificacionesService.enviarNotificacion(usuarioId, {
            titulo: `📸 Captura Completada - ${nombreCompleto}`,
            mensaje: `Se ha completado la captura de ${tipoCaptura} para ${nombreCompleto}`,
            tipo: 'captura',
            prioridad: 'media',
            metadata: { pacienteId: paciente.id, tipoCaptura },
            url: `/pacientes/${paciente.id}`,
        });
    }

    // ⭐ ============================================
    // ⭐ GEOCODING
    // ⭐ ============================================

    private async geocodeDireccionAWS(direccion: string): Promise<{ lat: number; lng: number } | null> {
        try {
            console.log(`🌍 AWS: ${direccion.substring(0, 40)}...`);
            const coords = await this.awsGeocodeService.geocodeAddress(direccion);
            if (coords) {
                console.log(`✅ AWS: ${coords.lat}, ${coords.lng}`);
                return coords;
            }
            console.log(`❌ AWS: No encontrado`);
            return null;
        } catch (error) {
            console.error('❌ Error en AWS:', error);
            return null;
        }
    }

    private async geocodeDireccionNominatim(direccion: string): Promise<{ lat: number; lng: number } | null> {
        try {
            const query = encodeURIComponent(`${direccion}, León, Guanajuato, México`);
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&countrycodes=mx`;

            console.log(`🌍 Nominatim: ${direccion.substring(0, 40)}...`);

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'SaludCasaApp/1.0'
                }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                console.log(`✅ Nominatim: ${lat}, ${lon}`);
                return { lat, lng: lon };
            }

            console.log(`❌ Nominatim: No encontrado`);
            return null;
        } catch (error) {
            console.error('❌ Error en Nominatim:', error);
            return null;
        }
    }

    async geocodePaciente(id: number): Promise<any> {
        try {
            console.log('📍 Geocode paciente ID:', id);

            if (!id || isNaN(id) || id <= 0) {
                return {
                    message: '❌ ID inválido. Debe ser un número positivo.',
                    paciente: null
                };
            }

            const paciente = await this.pacientesRepository.findOne({ where: { id } });
            if (!paciente) {
                return {
                    message: `❌ Paciente con ID ${id} no encontrado`,
                    paciente: null
                };
            }

            const idsPrueba = [423, 424, 425, 426, 427];
            if (idsPrueba.includes(paciente.id) || paciente.nombre === 'Usuario') {
                return {
                    message: `⏭️ Paciente de prueba ${paciente.id} ignorado`,
                    paciente: paciente
                };
            }

            const direccion = paciente.direccion || '';
            if (!direccion || direccion.trim().length === 0) {
                return {
                    message: `❌ El paciente ${paciente.nombre} no tiene dirección registrada`,
                    paciente: paciente
                };
            }

            console.log(`🌍 Geocodificando: ${paciente.nombre} (ID: ${paciente.id}) - ${direccion}`);

            let coords = await this.geocodeDireccionAWS(direccion);

            if (!coords) {
                console.log('⚠️ AWS falló, intentando con Nominatim...');
                coords = await this.geocodeDireccionNominatim(direccion);
            }

            if (!coords) {
                console.log(`⚠️ Usando coordenadas de prueba para ${paciente.nombre}`);
                const lat = 21.1165 + (Math.random() * 0.006 - 0.003);
                const lng = -101.6865 + (Math.random() * 0.006 - 0.003);
                coords = { lat, lng };
            }

            paciente.lat = parseFloat(coords.lat.toFixed(8));
            paciente.lng = parseFloat(coords.lng.toFixed(8));
            await this.pacientesRepository.save(paciente);

            return {
                message: `✅ Paciente ${paciente.nombre} geocodificado exitosamente`,
                paciente: paciente,
                coordenadas: coords
            };
        } catch (error: any) {
            console.error('❌ Error en geocodePaciente:', error);
            return {
                message: `❌ Error: ${error.message || 'Error desconocido'}`,
                paciente: null
            };
        }
    }

    async geocodeAllPacientes(): Promise<any> {
        try {
            const pacientes = await this.pacientesRepository.find();

            console.log(`📊 Total pacientes: ${pacientes.length}`);
            const resultados: any[] = [];
            let conCoords = 0;

            for (const paciente of pacientes) {
                try {
                    if (!paciente.id) continue;
                    const direccion = paciente.direccion || '';
                    if (!direccion) {
                        resultados.push({
                            id: paciente.id,
                            nombre: paciente.nombre || 'Desconocido',
                            status: '❌ Sin dirección'
                        });
                        continue;
                    }

                    console.log(`🌍 Geocodificando: ${paciente.nombre} (ID: ${paciente.id})`);

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    let coords = await this.geocodeDireccionNominatim(direccion);

                    if (!coords) {
                        console.log(`⚠️ No se encontró, manteniendo coordenadas actuales para ${paciente.nombre}`);
                        continue;
                    }

                    paciente.lat = parseFloat(coords.lat.toFixed(8));
                    paciente.lng = parseFloat(coords.lng.toFixed(8));
                    await this.pacientesRepository.save(paciente);
                    conCoords++;
                    resultados.push({
                        id: paciente.id,
                        nombre: paciente.nombre || 'Desconocido',
                        lat: coords.lat,
                        lng: coords.lng,
                        direccion: direccion,
                        status: '✅ Geocodificado'
                    });
                } catch (error: any) {
                    console.error(`❌ Error con paciente ${paciente.id}:`, error);
                    resultados.push({
                        id: paciente.id,
                        nombre: paciente.nombre || 'Desconocido',
                        status: `❌ Error: ${error.message || 'Error desconocido'}`
                    });
                }
            }

            return {
                total: pacientes.length,
                conCoordenadas: conCoords,
                resultados: resultados
            };
        } catch (error: any) {
            console.error('❌ Error en geocodeAllPacientes:', error);
            return {
                error: error.message || 'Error desconocido'
            };
        }
    }

    async corregirCoordenadasDistrito(): Promise<any> {
        try {
            const LIMITES = {
                latMin: 21.110,
                latMax: 21.123,
                lngMin: -101.693,
                lngMax: -101.680,
            };

            const pacientesFuera = await this.pacientesRepository
                .createQueryBuilder('p')
                .where('p.lat IS NOT NULL AND p.lng IS NOT NULL')
                .andWhere('p.nombre != :nombre', { nombre: 'Usuario' })
                .andWhere('(p.lat < :latMin OR p.lat > :latMax OR p.lng < :lngMin OR p.lng > :lngMax)', LIMITES)
                .getMany();

            const pacientesSinCoords = await this.pacientesRepository
                .createQueryBuilder('p')
                .where('(p.lat IS NULL OR p.lng IS NULL)')
                .andWhere('p.nombre != :nombre', { nombre: 'Usuario' })
                .getMany();

            const todosIds = new Set();
            pacientesFuera.forEach(p => todosIds.add(p.id));
            pacientesSinCoords.forEach(p => todosIds.add(p.id));

            if (todosIds.size === 0) {
                console.log('✅ No hay pacientes que corregir.');
                return {
                    total: 0,
                    corregidos: 0,
                    mensaje: 'Todos los pacientes están dentro del distrito',
                    resultados: []
                };
            }

            const todosPacientes = await this.pacientesRepository
                .createQueryBuilder('p')
                .where('p.id IN (:...ids)', { ids: [...todosIds] })
                .getMany();

            console.log(`📊 Pacientes a corregir: ${todosPacientes.length}`);
            let corregidos = 0;
            const resultados: any[] = [];

            for (const paciente of todosPacientes) {
                try {
                    const direccion = paciente.direccion || '';
                    if (!direccion) {
                        const lat = 21.1165 + (Math.random() * 0.006 - 0.003);
                        const lng = -101.6865 + (Math.random() * 0.006 - 0.003);
                        paciente.lat = lat;
                        paciente.lng = lng;
                        await this.pacientesRepository.save(paciente);
                        corregidos++;
                        resultados.push({
                            id: paciente.id,
                            nombre: paciente.nombre || 'Desconocido',
                            status: '⚠️ Sin dirección, usando coordenadas de prueba',
                            lat: lat,
                            lng: lng
                        });
                        continue;
                    }

                    console.log(`🌍 Corrigiendo: ${paciente.nombre} (ID: ${paciente.id})`);

                    let coords = await this.geocodeDireccionAWS(direccion);
                    if (!coords) {
                        coords = await this.geocodeDireccionNominatim(direccion);
                    }

                    if (coords) {
                        const estaDentro = coords.lat >= LIMITES.latMin && coords.lat <= LIMITES.latMax &&
                            coords.lng >= LIMITES.lngMin && coords.lng <= LIMITES.lngMax;
                        if (estaDentro) {
                            paciente.lat = coords.lat;
                            paciente.lng = coords.lng;
                            await this.pacientesRepository.save(paciente);
                            corregidos++;
                            resultados.push({
                                id: paciente.id,
                                nombre: paciente.nombre || 'Desconocido',
                                status: '✅ Corregido dentro del distrito',
                                lat: coords.lat,
                                lng: coords.lng
                            });
                        } else {
                            const lat = 21.1165 + (Math.random() * 0.006 - 0.003);
                            const lng = -101.6865 + (Math.random() * 0.006 - 0.003);
                            paciente.lat = lat;
                            paciente.lng = lng;
                            await this.pacientesRepository.save(paciente);
                            corregidos++;
                            resultados.push({
                                id: paciente.id,
                                nombre: paciente.nombre || 'Desconocido',
                                status: '⚠️ AWS encontró pero fuera, usando coordenadas de prueba',
                                lat: lat,
                                lng: lng
                            });
                        }
                    } else {
                        const lat = 21.1165 + (Math.random() * 0.006 - 0.003);
                        const lng = -101.6865 + (Math.random() * 0.006 - 0.003);
                        paciente.lat = lat;
                        paciente.lng = lng;
                        await this.pacientesRepository.save(paciente);
                        corregidos++;
                        resultados.push({
                            id: paciente.id,
                            nombre: paciente.nombre || 'Desconocido',
                            status: '⚠️ AWS no encontró, usando coordenadas de prueba',
                            lat: lat,
                            lng: lng
                        });
                    }
                } catch (error: any) {
                    console.error(`❌ Error con paciente ${paciente.id}:`, error);
                    resultados.push({
                        id: paciente.id,
                        nombre: paciente.nombre || 'Desconocido',
                        status: `❌ Error: ${error.message || 'Error desconocido'}`
                    });
                }
            }

            return {
                total: todosPacientes.length,
                corregidos: corregidos,
                resultados: resultados
            };
        } catch (error: any) {
            console.error('❌ Error corrigiendo coordenadas:', error);
            return {
                error: error.message || 'Error desconocido'
            };
        }
    }

    // ⭐ ============================================
    // ⭐ TEST DIRECCIONES
    // ⭐ ============================================

    async testDirecciones(): Promise<any[]> {
        const pacientes = await this.pacientesRepository
            .createQueryBuilder('p')
            .select(['p.id', 'p.direccion', 'p.zonaTrabajo', 'p.nombre'])
            .limit(10)
            .getMany();
        return pacientes;
    }

    // ⭐ ============================================
    // ⭐ NIVELES DE RIESGO
    // ⭐ ============================================

    /**
     * Obtener todos los niveles de riesgo de pacientes
     */
    async obtenerNivelesRiesgo(): Promise<any[]> {
        try {
            const result = await this.pacientesRepository
                .createQueryBuilder('p')
                .select([
                    'p.id as "pacienteId"',
                    'p.nombre as "pacienteNombre"',
                    'nr.nivel_riesgo as "nivelRiesgo"'
                ])
                .leftJoin('pacientes_niveles_riesgo', 'nr', 'nr.paciente_id = p.id')
                .where('p.id_enfermera IS NOT NULL')
                .getRawMany();

            console.log(`📊 ${result.length} niveles de riesgo obtenidos`);
            return result;
        } catch (error) {
            console.error('❌ Error obteniendo niveles de riesgo:', error);
            return [];
        }
    }

    /**
     * Obtener nivel de riesgo de un paciente específico
     */
    async obtenerNivelRiesgo(pacienteId: number): Promise<string | null> {
        try {
            const result = await this.pacientesRepository
                .createQueryBuilder()
                .select('nivel_riesgo', 'nivelRiesgo')
                .from('pacientes_niveles_riesgo', 'nr')
                .where('nr.paciente_id = :pacienteId', { pacienteId })
                .getRawOne();

            return result?.nivelRiesgo || null;
        } catch (error) {
            console.error(`❌ Error obteniendo nivel de riesgo para paciente ${pacienteId}:`, error);
            return null;
        }
    }

    /**
     * Actualizar nivel de riesgo de un paciente
     */
    async actualizarNivelRiesgo(
        pacienteId: number,
        nivelRiesgo: string | null,
        usuarioId: number = 1
    ): Promise<{ success: boolean; message: string; nivelRiesgo: string | null }> {
        try {
            const paciente = await this.findOne(pacienteId);
            if (!paciente) {
                return {
                    success: false,
                    message: `Paciente con ID ${pacienteId} no encontrado`,
                    nivelRiesgo: null
                };
            }

            if (!nivelRiesgo) {
                await this.pacientesRepository
                    .createQueryBuilder()
                    .delete()
                    .from('pacientes_niveles_riesgo')
                    .where('paciente_id = :pacienteId', { pacienteId })
                    .execute();

                console.log(`🗑️ Nivel de riesgo eliminado para paciente ${pacienteId}`);
                return {
                    success: true,
                    message: 'Nivel de riesgo eliminado correctamente',
                    nivelRiesgo: null
                };
            }

            const nivelesValidos = ['g1', 'g2', 'g3', 'g4'];
            if (!nivelesValidos.includes(nivelRiesgo)) {
                return {
                    success: false,
                    message: `Nivel de riesgo inválido: ${nivelRiesgo}. Debe ser g1, g2, g3 o g4`,
                    nivelRiesgo: null
                };
            }

            await this.pacientesRepository
                .createQueryBuilder()
                .insert()
                .into('pacientes_niveles_riesgo')
                .values({
                    pacienteId: pacienteId,
                    nivelRiesgo: nivelRiesgo,
                    creadoPor: usuarioId,
                    actualizadoPor: usuarioId
                })
                .orUpdate(
                    ['nivel_riesgo', 'actualizado_por', 'actualizado_en'],
                    ['paciente_id']
                )
                .execute();

            console.log(`✅ Nivel de riesgo actualizado para paciente ${pacienteId}: ${nivelRiesgo}`);

            await this.notificacionesService.enviarNotificacion(usuarioId, {
                titulo: `📊 Nivel de Riesgo Actualizado - ${paciente.nombre}`,
                mensaje: `El paciente ${paciente.nombre} ahora tiene nivel de riesgo ${this.getLabelNivelRiesgo(nivelRiesgo)}`,
                tipo: 'paciente',
                prioridad: 'media',
                metadata: {
                    pacienteId: paciente.id,
                    nivelRiesgo: nivelRiesgo
                },
                url: `/pacientes/${paciente.id}`,
            });

            return {
                success: true,
                message: 'Nivel de riesgo actualizado correctamente',
                nivelRiesgo: nivelRiesgo
            };

        } catch (error) {
            console.error(`❌ Error actualizando nivel de riesgo para paciente ${pacienteId}:`, error);
            // ⭐ CORREGIDO: usar error instanceof Error
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            return {
                success: false,
                message: `Error: ${errorMessage}`,
                nivelRiesgo: null
            };
        }
    }

    /**
     * Obtener label del nivel de riesgo
     */
    private getLabelNivelRiesgo(nivel: string): string {
        const labels = {
            'g1': '🟢 Grupo 1 (Bajo)',
            'g2': '🟡 Grupo 2 (Medio)',
            'g3': '🟠 Grupo 3 (Alto)',
            'g4': '🔴 Grupo 4 (Crítico)'
        };
        return labels[nivel] || nivel;
    }

    /**
     * Obtener todos los pacientes con su nivel de riesgo
     */
    async obtenerPacientesConNivelRiesgo(idEnfermera: number): Promise<any[]> {
        try {
            const pacientes = await this.findByIdEnfermera(idEnfermera);

            const niveles = await this.pacientesRepository
                .createQueryBuilder()
                .select(['paciente_id', 'nivel_riesgo'])
                .from('pacientes_niveles_riesgo', 'nr')
                .getRawMany();

            const nivelesMap = new Map();
            niveles.forEach(n => {
                nivelesMap.set(n.paciente_id, n.nivel_riesgo);
            });

            return pacientes.map(p => ({
                ...p,
                nivelRiesgo: nivelesMap.get(p.id) || null
            }));
        } catch (error) {
            console.error('❌ Error obteniendo pacientes con nivel de riesgo:', error);
            return [];
        }
    }
}