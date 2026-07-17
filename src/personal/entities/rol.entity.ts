import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm';

@Entity('rol')
export class Rol{
    @PrimaryGeneratedColumn()
    id_rol: number;

    @Column({nullable:false, type: 'varchar', length:100})
    nombre:string;
    
}