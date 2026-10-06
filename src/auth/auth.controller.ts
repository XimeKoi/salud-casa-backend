// src/auth/auth.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../personal/entities/user.entity';
import { PersonalEnfermeria } from '../personal/entities/personal-enfermeria.entity';

@Controller('auth')
export class AuthController {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        @InjectRepository(PersonalEnfermeria)
        private personalRepository: Repository<PersonalEnfermeria>,
    ) { }

    @Post('login')
    async login(@Body() body: { usuario: string; password: string }) {
        try {
            console.log('Login intento:', body.usuario);

            const usuario = await this.usuarioRepository.findOne({
                where: { usuario: body.usuario }
            });

            if (!usuario) {
                return { success: false, message: 'Usuario no encontrado' };
            }

            if (usuario.psswrd !== body.password) {
                return { success: false, message: 'Contraseña incorrecta' };
            }

            // ⭐ ============================================
            // ⭐ SI EL ROL ES DISTRITAL O ADMIN
            // ⭐ DEVOLVER SOLO LAS ENFERMERAS DE SU DISTRITO
            // ⭐ + DATOS DE LA TABLA personal
            // ⭐ ============================================
            if (usuario.rol === 'distrital' || usuario.rol === 'admin') {
                // ⭐ OBTENER DATOS DE personal
                let datosPersonal: any = null;
                if (usuario.id_personal) {
                    const result = await this.usuarioRepository.query(
                        `SELECT id_persona, nombre, "apellidoPaterno", "apellidoMaterno", 
                                "telefonoPrincipal", "telefonoSecundario", domicilio, curp, rfc 
                         FROM personal WHERE id_persona = $1`,
                        [usuario.id_personal]
                    );
                    datosPersonal = result[0] || null;
                }

                // ⭐ OBTENER ENFERMERAS DEL DISTRITO
                const enfermerasDelDistrito = await this.personalRepository.find({
                    where: { distrito: usuario.distrito }
                });

                console.log(`Distrital ${usuario.usuario} - Distrito: ${usuario.distrito} - Enfermeras: ${enfermerasDelDistrito.length}`);

                return {
                    success: true,
                    user: {
                        id: usuario.id_usuario,
                        username: usuario.usuario,
                        role: usuario.rol,
                        distrito: usuario.distrito,
                        id_personal_enfermeria: null,
                        id_personal: usuario.id_personal,
                        nombre: datosPersonal?.nombre || usuario.usuario,
                        apellidoPaterno: datosPersonal?.apellidoPaterno || null,
                        apellidoMaterno: datosPersonal?.apellidoMaterno || null,
                        telefonoPrincipal: datosPersonal?.telefonoPrincipal || null,
                        telefonoSecundario: datosPersonal?.telefonoSecundario || null,
                        domicilio: datosPersonal?.domicilio || null,
                        curp: datosPersonal?.curp || null,
                        rfc: datosPersonal?.rfc || null,
                        enfermeras: enfermerasDelDistrito
                    }
                };
            }

            // ⭐ ============================================
            // ⭐ SI EL ROL ES ENFERMERA
            // ⭐ DEVOLVER SOLO SUS DATOS
            // ⭐ ============================================
            let datosPersonales: PersonalEnfermeria | null = null;

            if (usuario.id_personal_enfermeria) {
                datosPersonales = await this.personalRepository.findOne({
                    where: { id: usuario.id_personal_enfermeria }
                });
            }

            console.log('Datos personales encontrados:', datosPersonales);

            return {
                success: true,
                user: {
                    id: usuario.id_usuario,
                    username: usuario.usuario,
                    role: usuario.rol || 'enfermera',
                    id_personal_enfermeria: usuario.id_personal_enfermeria,
                    nombre: datosPersonales?.nombre_completo || null,
                    entidad: datosPersonales?.entidad || null,
                    region: datosPersonales?.region || null,
                    municipio: datosPersonales?.municipio || null,
                    zona: datosPersonales?.zona || null,
                    zs: datosPersonales?.zs || null,
                    distrito: datosPersonales?.distrito || null,
                    zona_apoyo: datosPersonales?.zona_apoyo || null,
                    idInterno: datosPersonales?.id_interno || null,
                    telefono: datosPersonales?.telefono || null,
                    curp: datosPersonales?.curp || null,
                    noCedula: datosPersonales?.no_cedula || null,
                    nivelAcademico: datosPersonales?.nivel_academico || null
                }
            };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
}