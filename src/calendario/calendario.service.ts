// src/calendario/calendario.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitaProgramada } from './entities/visita-programada.entity';

@Injectable()
export class CalendarioService {
    constructor(
        @InjectRepository(VisitaProgramada)
        private visitaRepository: Repository<VisitaProgramada>,
    ) { }

    async findAll(): Promise<VisitaProgramada[]> {
        return this.visitaRepository.find({
            order: { fecha: 'ASC', hora: 'ASC' },
        });
    }

    async crearMultiples(visitas: any[], usuarioId: number = 1): Promise<any> {
        const nuevas = visitas.map(v =>
            this.visitaRepository.create({
                pacienteId: v.pacienteId,
                pacienteNombre: v.pacienteNombre,
                pacienteCurp: v.pacienteCurp,
                pacienteDireccion: v.pacienteDireccion,
                pacienteTelefono: v.pacienteTelefono,
                colonia: v.colonia,
                fecha: v.fecha,
                hora: v.hora,
                prioridad: v.prioridad || 'media',
                notas: v.notas || '',
                estado: 'pendiente',
                usuarioId,
            }),
        );

        await this.visitaRepository.save(nuevas);
        return { success: true, creadas: nuevas.length, visitas: nuevas };
    }

    async actualizarEstado(id: number, estado: string): Promise<any> {
        await this.visitaRepository.update(id, { estado });
        return { success: true };
    }

    async eliminar(id: number): Promise<any> {
        await this.visitaRepository.delete(id);
        return { success: true };
    }
}