// src/notificaciones/notificaciones.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionOculta } from './entities/notificacion-oculta.entity';  // ⭐ AGREGAR
import { Usuario } from '../personal/entities/user.entity';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private notificacionesRepository: Repository<Notificacion>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        @InjectRepository(NotificacionOculta)  // ⭐ AGREGAR
        private notificacionOcultaRepository: Repository<NotificacionOculta>,  // ⭐ AGREGAR
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

    // ⭐ ==========================================
    // ⭐ MÉTODO AUXILIAR: OBTENER IDs OCULTOS PARA UN USUARIO
    // ⭐ ==========================================
    private async obtenerIdsOcultos(usuarioId: number): Promise<number[]> {
        const ocultas = await this.notificacionOcultaRepository.find({
            where: { usuario_id: usuarioId },
            select: ['notificacion_id']
        });
        return ocultas.map(o => o.notificacion_id);
    }

    async findByUsuario(usuarioId: number, limit: number = 50, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        // ⭐ OBTENER IDs OCULTOS
        const idsOcultos = await this.obtenerIdsOcultos(usuarioId);

        const queryBuilder = this.notificacionesRepository.createQueryBuilder('n')
            .where('n.usuarioId = :usuarioId', { usuarioId })
            .orderBy('n.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        // ⭐ EXCLUIR LAS OCULTAS
        if (idsOcultos.length > 0) {
            queryBuilder.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

    // ⭐ ==========================================
    // ⭐ MÉTODO PARA DISTRITALES
    // ⭐ ==========================================

    async findByUsuarioConDistrito(usuarioId: number, limit: number = 50, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        const usuario = await this.usuarioRepository.findOne({
            where: { id_usuario: usuarioId }
        });

        if (!usuario) {
            return { data: [], total: 0 };
        }

        console.log(`Buscando notificaciones para: ${usuario.usuario} (${usuario.rol})`);

        // ⭐ OBTENER IDs OCULTOS
        const idsOcultos = await this.obtenerIdsOcultos(usuarioId);

        if (usuario.rol === 'distrital' || usuario.rol === 'admin') {
            const usuariosDelDistrito = await this.usuarioRepository.find({
                where: { distrito: usuario.distrito }
            });

            const idsUsuarios = usuariosDelDistrito.map(u => u.id_usuario);

            console.log(`Distrito ${usuario.distrito} - Usuarios:`, idsUsuarios);

            const queryBuilder = this.notificacionesRepository.createQueryBuilder('n')
                .where('n.usuarioId IN (:...idsUsuarios)', { idsUsuarios })
                .orderBy('n.createdAt', 'DESC')
                .take(limit)
                .skip(skip);

            // ⭐ EXCLUIR LAS OCULTAS
            if (idsOcultos.length > 0) {
                queryBuilder.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
            }

            const [data, total] = await queryBuilder.getManyAndCount();

            const dataConEnfermera = await this.agregarNombreEnfermera(data);

            return { data: dataConEnfermera, total };
        }

        // Enfermera
        const queryBuilder = this.notificacionesRepository.createQueryBuilder('n')
            .where('n.usuarioId = :usuarioId', { usuarioId })
            .orderBy('n.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        if (idsOcultos.length > 0) {
            queryBuilder.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

    // ⭐ ==========================================
    // ⭐ MÉTODO AUXILIAR: AGREGAR NOMBRE DE ENFERMERA
    // ⭐ ==========================================
    private async agregarNombreEnfermera(notificaciones: Notificacion[]): Promise<any[]> {
        if (notificaciones.length === 0) return [];

        const usuarioIds = [...new Set(
            notificaciones
                .map(n => n.usuarioId)
                .filter(id => id !== null && id !== undefined)
        )];

        if (usuarioIds.length === 0) {
            return notificaciones.map(n => ({ ...n, nombreEnfermera: null }));
        }

        const usuarios = await this.usuarioRepository.find({
            where: { id_usuario: In(usuarioIds) }
        });

        const personalIds = [...new Set(
            usuarios
                .map(u => u.id_personal_enfermeria)
                .filter(id => id !== null && id !== undefined)
        )];

        let enfermeras: any[] = [];
        if (personalIds.length > 0) {
            enfermeras = await this.notificacionesRepository.query(
                `SELECT id, nombre_completo FROM personal_enfermeria WHERE id IN (${personalIds.join(',')})`
            );
        }

        const usuariosMap = new Map<number, any>();
        usuarios.forEach(u => {
            usuariosMap.set(u.id_usuario, u);
        });

        const enfermerasMap = new Map<number, string>();
        enfermeras.forEach(e => {
            enfermerasMap.set(e.id, e.nombre_completo);
        });

        return notificaciones.map(n => {
            const usuario = n.usuarioId ? usuariosMap.get(n.usuarioId) : null;
            const nombreEnfermera = usuario && usuario.id_personal_enfermeria
                ? enfermerasMap.get(usuario.id_personal_enfermeria) || null
                : null;

            return {
                ...n,
                nombreEnfermera: nombreEnfermera
            };
        });
    }

    async getContador(usuarioId: number): Promise<any> {
        // ⭐ EXCLUIR LAS OCULTAS
        const idsOcultos = await this.obtenerIdsOcultos(usuarioId);

        const queryBuilder = this.notificacionesRepository.createQueryBuilder('n')
            .where('n.usuarioId = :usuarioId', { usuarioId });

        if (idsOcultos.length > 0) {
            queryBuilder.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
        }

        const total = await queryBuilder.getCount();

        const noLeidasQuery = this.notificacionesRepository.createQueryBuilder('n')
            .where('n.usuarioId = :usuarioId', { usuarioId })
            .andWhere('n.leida = :leida', { leida: false });

        if (idsOcultos.length > 0) {
            noLeidasQuery.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
        }

        const noLeidas = await noLeidasQuery.getCount();

        const urgentesQuery = this.notificacionesRepository.createQueryBuilder('n')
            .where('n.usuarioId = :usuarioId', { usuarioId })
            .andWhere('n.leida = :leida', { leida: false })
            .andWhere('n.prioridad = :prioridad', { prioridad: 'urgente' });

        if (idsOcultos.length > 0) {
            urgentesQuery.andWhere('n.id NOT IN (:...idsOcultos)', { idsOcultos });
        }

        const urgentes = await urgentesQuery.getCount();

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

    // ⭐ ==========================================
    // ⭐ MÉTODO ELIMINAR - AHORA OCULTA POR USUARIO
    // ⭐ ==========================================
    async eliminar(id: number, usuarioId: number): Promise<void> {
        // ⭐ En lugar de borrar, ocultar para ese usuario
        const existente = await this.notificacionOcultaRepository.findOne({
            where: { notificacion_id: id, usuario_id: usuarioId }
        });

        if (!existente) {
            await this.notificacionOcultaRepository.save({
                notificacion_id: id,
                usuario_id: usuarioId
            });
            console.log(`✅ Notificación ${id} oculta para usuario ${usuarioId}`);
        } else {
            console.log(`ℹ️ Notificación ${id} ya estaba oculta para usuario ${usuarioId}`);
        }
    }

    // ⭐ ==========================================
    // ⭐ MÉTODOS PARA JEFES
    // ⭐ ==========================================

    async findAllNotificaciones(limit: number = 100, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificacionesRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

    async findNotificacionesByRol(rol: string, limit: number = 100, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

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

        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

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