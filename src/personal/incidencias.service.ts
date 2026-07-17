import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from './entities/incidencia.entity';
import { Paciente } from './entities/paciente.entity';
import { CreateIncidenciaDto, UpdateIncidenciaDto } from './dto/incidencia.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class IncidenciasService {
    constructor(
        @InjectRepository(Incidencia)
        private incidenciasRepository: Repository<Incidencia>,
        @InjectRepository(Paciente)
        private pacientesRepository: Repository<Paciente>,
        private notificacionesService: NotificacionesService,
    ) { }

    async findAll(): Promise<any[]> {
        const incidencias = await this.incidenciasRepository.find({
            relations: ['paciente'],
            order: { fecha: 'DESC' },
        });

        return (incidencias as any[]).map(inc => this.mapToResponseDto(inc));
    }

    async findOne(id: number): Promise<any> {
        const incidencia = await this.incidenciasRepository.findOne({
            where: { id },
            relations: ['paciente'],
        });

        if (!incidencia) {
            throw new NotFoundException(`Incidencia con ID ${id} no encontrada`);
        }

        return this.mapToResponseDto(incidencia);
    }

    async create(createIncidenciaDto: CreateIncidenciaDto, usuarioId: number = 1): Promise<{ id: number; message: string }> {
        const incidenciaData: any = {
            tipo: createIncidenciaDto.tipo,
            descripcion: createIncidenciaDto.descripcion,
            direccion: createIncidenciaDto.direccion,
            fecha: createIncidenciaDto.fecha || new Date(),
            fotos: createIncidenciaDto.fotos || [],
            resuelta: createIncidenciaDto.resuelta || false,
            pacienteId: createIncidenciaDto.pacienteId || null,
        };

        if (createIncidenciaDto.tipo === 'otro') {
            incidenciaData.otroTexto = createIncidenciaDto.descripcion;
        }

        const incidencia = this.incidenciasRepository.create(incidenciaData);
        const saved: any = await this.incidenciasRepository.save(incidencia);

        if (createIncidenciaDto.pacienteId) {
            try {
                const paciente = await this.pacientesRepository.findOne({
                    where: { id: createIncidenciaDto.pacienteId }
                });

                if (paciente) {
                    const nombreCompleto = this.getNombreCompleto(paciente);
                    let prioridad = 'alta';
                    let titulo = `⚠️ Nueva Incidencia - ${nombreCompleto}`;
                    let mensaje = `Se registró una incidencia para ${nombreCompleto}: ${createIncidenciaDto.descripcion}`;
                    let tipo = 'incidencia';

                    if (createIncidenciaDto.tipo === 'emergencia_medica') {
                        prioridad = 'urgente';
                        titulo = `🚨 EMERGENCIA MÉDICA - ${nombreCompleto}`;
                        mensaje = `¡EMERGENCIA! Se reportó una situación médica crítica para ${nombreCompleto}`;
                        tipo = 'emergencia';
                    }

                    await this.notificacionesService.enviarNotificacion(usuarioId, {
                        titulo: titulo,
                        mensaje: mensaje,
                        tipo: tipo,
                        prioridad: prioridad,
                        metadata: {
                            incidenciaId: saved.id,
                            pacienteId: paciente.id,
                            tipo: createIncidenciaDto.tipo
                        },
                        url: `/incidencias/${saved.id}`,
                    });
                }
            } catch (error) {
                console.error('Error al enviar notificación:', error);
            }
        }

        return {
            id: saved.id,
            message: 'Incidencia creada exitosamente'
        };
    }

    async update(id: number, updateIncidenciaDto: UpdateIncidenciaDto, usuarioId: number = 1): Promise<{ message: string }> {
        const incidencia = await this.incidenciasRepository.findOne({
            where: { id },
            relations: ['paciente']
        });

        if (!incidencia) {
            throw new NotFoundException(`Incidencia con ID ${id} no encontrada`);
        }

        if (updateIncidenciaDto.resuelta !== undefined) {
            incidencia.resuelta = updateIncidenciaDto.resuelta;

            if (incidencia.resuelta && incidencia.paciente) {
                const nombreCompleto = this.getNombreCompleto(incidencia.paciente);
                await this.notificacionesService.enviarNotificacion(usuarioId, {
                    titulo: `✅ Incidencia Resuelta - ${nombreCompleto}`,
                    mensaje: `La incidencia para ${nombreCompleto} ha sido resuelta`,
                    tipo: 'incidencia',
                    prioridad: 'media',
                    metadata: {
                        incidenciaId: id,
                        pacienteId: incidencia.pacienteId
                    },
                    url: `/incidencias/${id}`,
                });
            }
        }
        incidencia.updatedAt = new Date();

        await this.incidenciasRepository.save(incidencia);

        return { message: 'Incidencia actualizada exitosamente' };
    }

    async remove(id: number): Promise<void> {
        const result = await this.incidenciasRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Incidencia con ID ${id} no encontrada`);
        }
    }

    private getNombreCompleto(paciente: any): string {
        const partes: string[] = [];
        if (paciente.apellidoPaterno) partes.push(paciente.apellidoPaterno);
        if (paciente.apellidoMaterno) partes.push(paciente.apellidoMaterno);
        if (paciente.nombre) partes.push(paciente.nombre);
        return partes.length > 0 ? partes.join(' ').trim() : 'Usuario';
    }

    private mapToResponseDto(incidencia: any): any {
        const response: any = {
            id: incidencia.id,
            tipo: incidencia.tipo,
            descripcion: incidencia.descripcion,
            direccion: incidencia.direccion,
            fecha: incidencia.fecha,
            fotos: incidencia.fotos || [],
            resuelta: incidencia.resuelta,
            pacienteId: incidencia.pacienteId,
            otroTexto: incidencia.otroTexto || '',
            createdAt: incidencia.createdAt,
            updatedAt: incidencia.updatedAt,
        };

        if (incidencia.paciente) {
            const p = incidencia.paciente;
            const nombreParts: string[] = [];
            if (p.apellidoPaterno) nombreParts.push(p.apellidoPaterno);
            if (p.apellidoMaterno) nombreParts.push(p.apellidoMaterno);
            if (p.nombre) nombreParts.push(p.nombre);

            response.datosPaciente = {
                id: p.id,
                nombre: nombreParts.length > 0 ? nombreParts.join(' ').trim() : 'Nombre no disponible',
                direccion: p.direccion || 'No disponible',
                telefono: p.telefonoCelular || p.telefonoFijo || 'No disponible',
                colonia: p.zonaTrabajo || 'No disponible',
                seccion: p.zonaTrabajo?.split('-').pop() || 'No disponible',
            };
        }

        return response;
    }
}