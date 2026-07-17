import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from '../personal/entities/personal.entity';

@Injectable()
export class ComunicacionService {
    constructor(
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>,
    ) { }

    // Datos que compartes con ella (solo lo necesario)
    async getNotificacionesParaDistrital() {
        // Simulación de notificaciones (puedes adaptarlo a tu BD real)
        return [
            {
                id: 1,
                titulo: 'Nueva visita registrada',
                mensaje: 'Se ha registrado una nueva visita domiciliaria',
                fecha: new Date(),
                enfermera: 'María López',
                zona: 'Norte'
            },
            {
                id: 2,
                titulo: 'Paciente en seguimiento',
                mensaje: 'Paciente requiere atención especial',
                fecha: new Date(),
                enfermera: 'Ana García',
                zona: 'Centro'
            }
        ];
    }

    async getVisitasParaDistrital() {
        // Obtener visitas activas (solo las que quieres compartir)
        const visitas = await this.personalRepository.find({
            where: { activo: true },
            select: ['id_persona', 'nombre', 'apellidoPaterno', 'telefonoPrincipal', 'domicilio'],
            take: 20,
            order: { id_persona: 'DESC' }
        });

        return visitas.map(v => ({
            id: v.id_persona,
            nombre: `${v.nombre} ${v.apellidoPaterno || ''}`,
            telefono: v.telefonoPrincipal,
            domicilio: v.domicilio
        }));
    }

    async getEstadisticas() {
        const total = await this.personalRepository.count({ where: { activo: true } });
        const hoy = await this.personalRepository.count({
            where: { activo: true }
        });

        return {
            total_registros: total,
            visitas_hoy: hoy,
            ultima_actualizacion: new Date()
        };
    }
}