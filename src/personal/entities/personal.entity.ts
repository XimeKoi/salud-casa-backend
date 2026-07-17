import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from './user.entity';

@Entity('personal')
export class Personal {
    @PrimaryGeneratedColumn()
    id_persona: number;

    @Column({ nullable: false, type: 'varchar', length: 100 })
    nombre: string;

    @Column({ nullable: false, type: 'varchar', length: 100 })
    apellidoPaterno: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    apellidoMaterno: string;

    @Column({ nullable: false, type: 'varchar', length: 12 })
    telefonoPrincipal: string;

    @Column({ nullable: true, type: 'varchar', length: 12 })
    telefonoSecundario: string;

    @Column({ nullable: false, type: 'varchar', length: 255 })
    domicilio: string;

    // Elimina esta relación si da error
    // @OneToOne(() => Usuario, usuario => usuario.personal)
    // @JoinColumn()
    // usuario: Usuario;

    @Column({ default: true, type: 'boolean' })
    activo: boolean;

    @Column({ nullable: true, type: 'int' })
    creado_por: number;
}