// src/personal/entities/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn()
    id_usuario: number;

    @Column({ unique: true, nullable: false })
    usuario: string;

    @Column({ nullable: false })
    psswrd: string;

    @Column({ nullable: true, default: 'enfermera' })
    rol: string;
    @Column({ name: 'id_personal', nullable: true })
    id_personal: number;
    // ✅ SOLO ESTA COLUMNA - elimina id_personal
    @Column({ nullable: true, name: 'id_personal_enfermeria' })
    id_personal_enfermeria: number;

    // ⭐ AGREGAR ESTO
    @Column({ nullable: true })
    distrito: string;
}