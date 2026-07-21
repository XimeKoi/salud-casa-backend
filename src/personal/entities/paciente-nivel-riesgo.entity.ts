// src/personal/entities/paciente-nivel-riesgo.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pacientes_niveles_riesgo')
export class PacienteNivelRiesgo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'paciente_id', type: 'int' })
    pacienteId: number;

    @Column({ name: 'nivel_riesgo', type: 'varchar', length: 10 })
    nivelRiesgo: string; // 'g1', 'g2', 'g3', 'g4'

    @Column({ name: 'creado_por', type: 'int', nullable: true })
    creadoPor: number;

    @Column({ name: 'actualizado_por', type: 'int', nullable: true })
    actualizadoPor: number;

    @CreateDateColumn({ name: 'creado_en' })
    creadoEn: Date;

    @UpdateDateColumn({ name: 'actualizado_en' })
    actualizadoEn: Date;
}