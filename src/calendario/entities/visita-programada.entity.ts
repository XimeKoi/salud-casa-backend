// src/calendario/entities/visita-programada.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Paciente } from '../../personal/entities/paciente.entity';

@Entity('visitas_programadas')
export class VisitaProgramada {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id' })
    pacienteId: number;

    @Column({ name: 'paciente_nombre', nullable: true })
    pacienteNombre: string;

    @Column({ name: 'paciente_curp', nullable: true })
    pacienteCurp: string;

    @Column({ name: 'paciente_direccion', type: 'text', nullable: true })
    pacienteDireccion: string;

    @Column({ name: 'paciente_telefono', nullable: true })
    pacienteTelefono: string;

    @Column({ nullable: true })
    colonia: string;

    @Column({ type: 'date' })
    fecha: Date;

    @Column({ type: 'time' })
    hora: string;

    @Column({ default: 'media' })
    prioridad: string;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @Column({ default: 'pendiente' })
    estado: string;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'paciente_id' })
    paciente: Paciente;
}