// src/notificaciones/notificaciones.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { Usuario } from '../personal/entities/user.entity';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private notificacionesRepository: Repository<Notificacion>,
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
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

        // ⭐ AGREGAR EL NOMBRE DE LA ENFERMERA
        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

    // ⭐ ==========================================
    // ⭐ MÉTODO PARA DISTRITALES
    // ⭐ VE NOTIFICACIONES DE TODOS LOS USUARIOS DE SU DISTRITO
    // ⭐ ==========================================

    async findByUsuarioConDistrito(usuarioId: number, limit: number = 50, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        // 1. Buscar al usuario
        const usuario = await this.usuarioRepository.findOne({
            where: { id_usuario: usuarioId }
        });

        if (!usuario) {
            return { data: [], total: 0 };
        }

        console.log(`Buscando notificaciones para: ${usuario.usuario} (${usuario.rol})`);

        // 2. Si es distrital o admin, ver notificaciones de TODOS los usuarios de su distrito
        if (usuario.rol === 'distrital' || usuario.rol === 'admin') {
            const usuariosDelDistrito = await this.usuarioRepository.find({
                where: { distrito: usuario.distrito }
            });

            const idsUsuarios = usuariosDelDistrito.map(u => u.id_usuario);

            console.log(`Distrito ${usuario.distrito} - Usuarios:`, idsUsuarios);

            const [data, total] = await this.notificacionesRepository.findAndCount({
                where: { usuarioId: In(idsUsuarios) },
                order: { createdAt: 'DESC' },
                take: limit,
                skip: skip,
            });

            // ⭐ AGREGAR EL NOMBRE DE LA ENFERMERA
            const dataConEnfermera = await this.agregarNombreEnfermera(data);

            return { data: dataConEnfermera, total };
        }

        // 3. Si es enfermera, solo sus notificaciones
        const [data, total] = await this.notificacionesRepository.findAndCount({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        // ⭐ AGREGAR EL NOMBRE DE LA ENFERMERA
        const dataConEnfermera = await this.agregarNombreEnfermera(data);

        return { data: dataConEnfermera, total };
    }

    // ⭐ ==========================================
    // ⭐ MÉTODO AUXILIAR: AGREGAR NOMBRE DE ENFERMERA
    // ⭐ Hace el JOIN: notificaciones → usuario → personal_enfermeria
    // ⭐ ==========================================
    private async agregarNombreEnfermera(notificaciones: Notificacion[]): Promise<any[]> {
        if (notificaciones.length === 0) return [];

        // 1. Obtener todos los usuarioIds únicos (sin nulls)
        const usuarioIds = [...new Set(
            notificaciones
                .map(n => n.usuarioId)
                .filter(id => id !== null && id !== undefined)
        )];

        if (usuarioIds.length === 0) {
            return notificaciones.map(n => ({ ...n, nombreEnfermera: null }));
        }

        // 2. Obtener los usuarios con sus id_personal_enfermeria
        const usuarios = await this.usuarioRepository.find({
            where: { id_usuario: In(usuarioIds) }
        });

        // 3. Obtener los id_personal_enfermeria
        const personalIds = [...new Set(
            usuarios
                .map(u => u.id_personal_enfermeria)
                .filter(id => id !== null && id !== undefined)
        )];

        // 4. Obtener los nombres de las enfermeras
        let enfermeras: any[] = [];
        if (personalIds.length > 0) {
            enfermeras = await this.notificacionesRepository.query(
                `SELECT id, nombre_completo FROM personal_enfermeria WHERE id IN (${personalIds.join(',')})`
            );
        }

        // 5. Crear mapas para búsqueda rápida
        const usuariosMap = new Map<number, any>();
        usuarios.forEach(u => {
            usuariosMap.set(u.id_usuario, u);
        });

        const enfermerasMap = new Map<number, string>();
        enfermeras.forEach(e => {
            enfermerasMap.set(e.id, e.nombre_completo);
        });

        // 6. Agregar el nombre de la enfermera a cada notificación
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
    // ⭐ MÉTODOS PARA JEFES
    // ⭐ ==========================================

    async findAllNotificaciones(limit: number = 100, page: number = 1): Promise<any> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificacionesRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        // ⭐ AGREGAR EL NOMBRE DE LA ENFERMERA
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

        // ⭐ AGREGAR EL NOMBRE DE LA ENFERMERA
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