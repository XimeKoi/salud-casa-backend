// src/notificaciones/entities/notificacion-oculta.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('notificaciones_ocultas')
@Unique(['notificacion_id', 'usuario_id'])
export class NotificacionOculta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'notificacion_id' })
    notificacion_id: number;

    @Column({ name: 'usuario_id' })
    usuario_id: number;

    @CreateDateColumn({ name: 'oculta_en' })
    oculta_en: Date;
}