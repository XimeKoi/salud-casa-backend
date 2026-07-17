import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from './paciente.entity';

@Entity('incidencias')
export class Incidencia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50 })
    tipo: string;

    @Column({ type: 'text' })
    descripcion: string;

    @Column({ type: 'varchar', length: 255 })
    direccion: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha: Date;

    @Column({ type: 'jsonb', nullable: true })
    fotos: string[];

    @Column({ type: 'boolean', default: false })
    resuelta: boolean;

    @Column({ name: 'pacienteId', nullable: true, type: 'int' })
    pacienteId: number | null;

    @Column({ name: 'otroTexto', type: 'text', nullable: true })
    otroTexto: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Paciente, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'pacienteId' })
    paciente: Paciente | null;
}