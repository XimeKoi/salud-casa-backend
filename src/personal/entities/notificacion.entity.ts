import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    titulo: string;

    @Column({ type: 'text' })
    mensaje: string;

    @Column({ type: 'varchar', length: 50 })
    tipo: string;

    @Column({ type: 'varchar', length: 20, default: 'media' })
    prioridad: string;

    @Column({ type: 'boolean', default: false })
    leida: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ name: 'usuarioId', nullable: true })
    usuarioId: number;

    @Column({ type: 'varchar', nullable: true })
    url: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'leida_at', nullable: true })
    leidaAt: Date;
}