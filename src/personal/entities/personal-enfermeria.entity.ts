import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('personal_enfermeria')
export class PersonalEnfermeria {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    entidad: string;

    @Column({ nullable: true })
    region: string;

    @Column({ nullable: true })
    municipio: string;

    @Column({ nullable: true })
    zona: string;

    @Column({ nullable: true })
    zs: number;

    @Column({ name: 'nombre_completo', nullable: true })
    nombre_completo: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ nullable: true })
    curp: string;

    @Column({ name: 'no_cedula', nullable: true })
    no_cedula: string;

    @Column({ name: 'id_interno', nullable: true })
    id_interno: string;

    @Column({ name: 'nivel_academico', nullable: true })
    nivel_academico: string;
}