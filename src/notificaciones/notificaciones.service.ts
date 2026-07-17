// src/notificaciones/notificaciones.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private notificacionesRepository: Repository<Notificacion>,
    ) { }

    async crearNotificacion(data: any): Promise<Notificacion> {
        const notificacion = this.notificacionesRepository.create({
            titulo: data.titulo,
            mensaje: data.mensaje,
            tipo: data.tipo || 'sistema',
            prioridad: data.prioridad || 'media',
            usuarioId: data.usuarioId || null,
            metadata: data.metadata || {},
            url: data.url || null,
        });
        return this.notificacionesRepository.save(notificacion);
    }

    async enviarNotificacion(usuarioId: number, datos: any): Promise<Notificacion> {
        return this.crearNotificacion({
            ...datos,
            usuarioId,
        });
    }

    async enviarNotificacionMultiple(usuariosIds: number[], datos: any): Promise<Notificacion[]> {
        const notificaciones: Notificacion[] = [];
        for (const usuarioId of usuariosIds) {
            const notif = await this.enviarNotificacion(usuarioId, datos);
            notificaciones.push(notif);
        }
        return notificaciones;
    }

    async findByUsuario(usuarioId: number, limit: number = 50, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificacionesRepository.findAndCount({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        return { data, total };
    }

    async getContador(usuarioId: number): Promise<any> {
        const total = await this.notificacionesRepository.count({
            where: { usuarioId }
        });
        const noLeidas = await this.notificacionesRepository.count({
            where: { usuarioId, leida: false }
        });
        const urgentes = await this.notificacionesRepository.count({
            where: { usuarioId, leida: false, prioridad: 'urgente' }
        });

        return { total, noLeidas, urgentes };
    }

    async marcarLeida(id: number, usuarioId: number): Promise<void> {
        await this.notificacionesRepository.update(
            { id, usuarioId },
            { leida: true, leidaAt: new Date() }
        );
    }

    // ⭐ NUEVO: Método para toggle (leída / no leída) - CORREGIDO
    async toggleEstado(id: number, usuarioId: number, leida: boolean): Promise<void> {
        const updateData: any = { leida: leida };

        // ⭐ Si es leída, asignamos la fecha actual, si no, usamos undefined (no actualizar)
        if (leida) {
            updateData.leidaAt = new Date();
        } else {
            // ⭐ En lugar de null, usamos undefined para que no intente actualizar el campo
            updateData.leidaAt = undefined;
        }

        await this.notificacionesRepository.update(
            { id, usuarioId },
            updateData
        );
    }

    async marcarTodasLeidas(usuarioId: number): Promise<void> {
        await this.notificacionesRepository.update(
            { usuarioId, leida: false },
            { leida: true, leidaAt: new Date() }
        );
    }

    async eliminar(id: number, usuarioId: number): Promise<void> {
        await this.notificacionesRepository.delete({ id, usuarioId });
    }
}