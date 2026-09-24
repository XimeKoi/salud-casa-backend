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
            // ⭐ DEVOLVER TODAS LAS ENFERMERAS
            // ⭐ ============================================
            if (usuario.rol === 'distrital' || usuario.rol === 'admin') {
                const todasLasEnfermeras = await this.personalRepository.find();

                console.log('Enfermeras encontradas para distrital:', todasLasEnfermeras.length);

                return {
                    success: true,
                    user: {
                        id: usuario.id_usuario,
                        username: usuario.usuario,
                        role: usuario.rol,
                        id_personal_enfermeria: null,
                        nombre: usuario.usuario,
                        enfermeras: todasLasEnfermeras  // ← TODAS LAS ENFERMERAS
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