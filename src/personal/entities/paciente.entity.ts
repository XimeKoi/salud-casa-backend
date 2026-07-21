// src/personal/entities/paciente.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { PacienteNivelRiesgo } from './paciente-nivel-riesgo.entity';

@Entity('pacientes')
export class Paciente {
    @PrimaryGeneratedColumn()
    id: number;

    // ... (tus columnas existentes)

    @Column({ nullable: true })
    numero: number;

    @Column({ nullable: true })
    region: number;

    @Column({ nullable: true })
    municipio: string;

    @Column({ name: 'zona_trabajo', nullable: true })
    zonaTrabajo: string;

    @Column({ name: 'apellido_paterno', nullable: true })
    apellidoPaterno: string;

    @Column({ name: 'apellido_materno', nullable: true })
    apellidoMaterno: string;

    @Column({ nullable: true })
    nombre: string;

    @Column({ nullable: true })
    curp: string;

    @Column({ name: 'telefono_fijo', nullable: true })
    telefonoFijo: string;

    @Column({ name: 'telefono_celular', nullable: true })
    telefonoCelular: string;

    @Column({ nullable: true })
    estatus: string;

    @Column({ nullable: true })
    programa: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ name: 'id_enfermera', nullable: true })
    idEnfermera: number;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    lat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    lng: number;

    // ⭐ DISCAPACIDADES
    @Column({ name: 'discapacidad_motriz', type: 'boolean', default: false, nullable: true })
    discapacidadMotriz: boolean;

    @Column({ name: 'discapacidad_visual', type: 'boolean', default: false, nullable: true })
    discapacidadVisual: boolean;

    @Column({ name: 'discapacidad_auditiva', type: 'boolean', default: false, nullable: true })
    discapacidadAuditiva: boolean;

    @Column({ name: 'discapacidad_intelectual', type: 'boolean', default: false, nullable: true })
    discapacidadIntelectual: boolean;

    @Column({ name: 'discapacidad_psicosocial', type: 'boolean', default: false, nullable: true })
    discapacidadPsicosocial: boolean;

    // ⭐ FECHA FINADO
    @Column({ name: 'fecha_finado', type: 'date', nullable: true })
    fechaFinado: Date | null;

    // ⭐ RELACIÓN CON NIVEL DE RIESGO (NO SE GUARDA EN LA MISMA TABLA)
    // Este campo se llenará desde la tabla pacientes_niveles_riesgo
    nivelRiesgo?: string | null;

    // ⭐ MÉTODOS DE UTILIDAD
    tieneDiscapacidad(): boolean {
        return this.discapacidadMotriz || this.discapacidadVisual ||
            this.discapacidadAuditiva || this.discapacidadIntelectual ||
            this.discapacidadPsicosocial;
    }

    esFinado(): boolean {
        return this.estatus?.toUpperCase() === 'FINADO' || this.fechaFinado !== null;
    }
}