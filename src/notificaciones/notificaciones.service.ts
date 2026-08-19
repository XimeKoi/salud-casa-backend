// src/notificaciones/notificaciones.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { In } from 'typeorm';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private notificacionesRepository: Repository<Notificacion>,
    ) { }

    // ⭐ ==========================================
    // ⭐ MÉTODOS EXISTENTES
    // ⭐ ==========================================

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

    async toggleEstado(id: number, usuarioId: number, leida: boolean): Promise<void> {
        const updateData: any = { leida: leida };
        if (leida) {
            updateData.leidaAt = new Date();
        } else {
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

    // ⭐ ==========================================
    // ⭐ NUEVOS MÉTODOS PARA JEFES
    // ⭐ ==========================================

    // ⭐ 1. OBTENER TODAS LAS NOTIFICACIONES
    async findAllNotificaciones(limit: number = 100, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificacionesRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        // Obtener nombres de usuarios para cada notificación
        const userIds = data.map(n => n.usuarioId).filter(id => id !== null);
        let usuariosMap = {};

        if (userIds.length > 0) {
            const usuarios = await this.notificacionesRepository.query(`
                SELECT u.id_usuario as id, u.usuario, pe.nombre_completo as nombre
                FROM usuario u
                LEFT JOIN personal_enfermeria pe ON u.id_personal_enfermeria = pe.id
                WHERE u.id_usuario IN (${userIds.join(',')})
            `);

            usuariosMap = {};
            usuarios.forEach(u => {
                usuariosMap[u.id] = {
                    usuario: u.usuario,
                    nombre: u.nombre || u.usuario
                };
            });
        }

        const dataConUsuarios = data.map(n => ({
            ...n,
            usuario: n.usuarioId ? usuariosMap[n.usuarioId] || null : null
        }));

        return { data: dataConUsuarios, total };
    }

    // ⭐ 2. OBTENER NOTIFICACIONES POR ROL
    async findNotificacionesByRol(rol: string, limit: number = 100, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        // Primero obtener los usuarios con ese rol
        const usuarios = await this.notificacionesRepository.query(`
            SELECT id_usuario FROM usuario WHERE rol = $1
        `, [rol]);

        const userIds = usuarios.map(u => u.id_usuario);

        if (userIds.length === 0) {
            return { data: [], total: 0 };
        }

        const [data, total] = await this.notificacionesRepository.findAndCount({
            where: { usuarioId: In(userIds) },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        return { data, total };
    }

    // ⭐ 3. ESTADÍSTICAS DE NOTIFICACIONES
    async getEstadisticasNotificaciones(): Promise<any> {
        const total = await this.notificacionesRepository.count();
        const noLeidas = await this.notificacionesRepository.count({
            where: { leida: false }
        });
        const urgentes = await this.notificacionesRepository.count({
            where: { leida: false, prioridad: 'urgente' }
        });

        const porTipo = await this.notificacionesRepository
            .createQueryBuilder('n')
            .select('n.tipo, COUNT(*) as total')
            .groupBy('n.tipo')
            .getRawMany();

        const porPrioridad = await this.notificacionesRepository
            .createQueryBuilder('n')
            .select('n.prioridad, COUNT(*) as total')
            .groupBy('n.prioridad')
            .getRawMany();

        return {
            total,
            noLeidas,
            urgentes,
            porTipo,
            porPrioridad,
            fechaActualizacion: new Date()
        };
    }
}