// src/personal/pacientes.controller.ts

import { Controller, Get, Post, Patch, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PacientesService } from './pacientes.service';

@Controller('pacientes')
export class PacientesController {
    constructor(private readonly pacientesService: PacientesService) { }

    // ⭐ ==========================================
    // ⭐ RUTAS ESPECÍFICAS - DEBEN IR ANTES DE :id
    // ⭐ ==========================================

    @Get()
    async findAll() {
        return this.pacientesService.findAll();
    }

    @Get('test-direcciones')
    async testDirecciones() {
        return this.pacientesService.testDirecciones();
    }

    @Get('buscar')
    async buscarPorDireccion(@Query('direccion') direccion: string) {
        console.log('🔍 Buscando en BD - Parámetro recibido:', direccion);

        if (!direccion || direccion.trim().length === 0) {
            console.log('⚠️ Dirección vacía, retornando array vacío');
            return [];
        }

        let decodedDireccion = direccion;
        try {
            decodedDireccion = decodeURIComponent(direccion);
        } catch (e) {
            console.log('⚠️ No se pudo decodificar, usando original');
        }

        console.log('🔍 Dirección decodificada:', decodedDireccion);

        try {
            const result = await this.pacientesService.buscarPorDireccion(decodedDireccion);
            console.log(`✅ Encontrados ${result.length} pacientes`);
            return result;
        } catch (error) {
            console.error('❌ Error en buscarPorDireccion:', error);
            throw error;
        }
    }

    @Get('enfermera/:idEnfermera')
    async findByIdEnfermera(@Param('idEnfermera') idEnfermera: string) {
        console.log('📍 findByIdEnfermera recibió:', idEnfermera);
        const idNumber = parseInt(idEnfermera, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            return [];
        }
        return this.pacientesService.findByIdEnfermera(idNumber);
    }

    // ⭐ ==========================================
    // ⭐ RUTA DINÁMICA - DEBE IR AL FINAL
    // ⭐ ==========================================

    @Get(':id')
    async findOne(@Param('id') id: string) {
        console.log('📍 findOne recibió:', id);

        const rutasEspecificas = ['buscar', 'enfermera', 'test-direcciones', 'geocode-all', 'corregir-distrito'];
        if (rutasEspecificas.includes(id)) {
            throw new HttpException(`Ruta no válida: ${id}`, HttpStatus.BAD_REQUEST);
        }

        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException(`ID inválido: ${id}`, HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.findOne(idNumber);
    }

    // ⭐ ==========================================
    // ⭐ PATCH - ACTUALIZACIONES
    // ⭐ ==========================================

    @Patch(':id')
    async updatePaciente(
        @Param('id') id: string,
        @Body() updateData: any
    ) {
        console.log(`📥 [Controller] PATCH general para paciente ${id}:`, updateData);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.update(idNumber, updateData);
    }

    @Patch(':id/discapacidades')
    async updateDiscapacidades(
        @Param('id') id: string,
        @Body() discapacidades: {
            motriz: boolean;
            visual: boolean;
            auditiva: boolean;
            intelectual: boolean;
            psicosocial: boolean;
        }
    ) {
        console.log(`📥 [Controller] PATCH discapacidades para paciente ${id}:`, discapacidades);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.updateDiscapacidades(idNumber, discapacidades);
    }

    @Patch(':id/programa')
    async updatePrograma(
        @Param('id') id: string,
        @Body() body: { programa: string }
    ) {
        console.log(`📥 [Controller] PATCH programa para paciente ${id}: ${body.programa}`);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.update(idNumber, { programa: body.programa });
    }

    @Patch(':id/estatus')
    async updateEstatus(
        @Param('id') id: string,
        @Body() body: { estatus: string; usuarioId?: number }
    ) {
        console.log(`📥 [Controller] PATCH estatus para paciente ${id}: ${body.estatus}`);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.updateEstatus(idNumber, body.estatus, body.usuarioId || 1);
    }

    // ⭐ ==========================================
    // ⭐ POST - NOTIFICACIONES Y GEOCODING
    // ⭐ ==========================================

    @Post(':id/visita/programar')
    async programarVisita(
        @Param('id') id: string,
        @Body() body: { fecha: string; hora: string; usuarioId?: number }
    ) {
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.notificarVisitaProgramada(idNumber, body.fecha, body.hora, body.usuarioId || 1);
    }

    @Post(':id/visita/reagendar')
    async reagendarVisita(
        @Param('id') id: string,
        @Body() body: { fechaAnterior: string; fechaNueva: string; usuarioId?: number }
    ) {
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.notificarVisitaReagendada(idNumber, body.fechaAnterior, body.fechaNueva, body.usuarioId || 1);
    }

    @Post(':id/captura/completada')
    async capturaCompletada(
        @Param('id') id: string,
        @Body() body: { tipoCaptura: string; usuarioId?: number }
    ) {
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.notificarCapturaCompletada(idNumber, body.tipoCaptura, body.usuarioId || 1);
    }

    @Post(':id/geocode')
    async geocodePaciente(@Param('id') id: string) {
        console.log('📍 Geocode paciente ID recibido:', id);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            return {
                message: '❌ ID inválido. Debe ser un número positivo.',
                error: 'Bad Request',
                statusCode: 400
            };
        }
        return this.pacientesService.geocodePaciente(idNumber);
    }

    @Post('geocode-all')
    async geocodeAllPacientes() {
        return this.pacientesService.geocodeAllPacientes();
    }

    @Post('corregir-distrito')
    async corregirCoordenadasDistrito() {
        return this.pacientesService.corregirCoordenadasDistrito();
    }
    // src/personal/pacientes.controller.ts

    // ⭐ ==========================================
    // ⭐ NIVELES DE RIESGO - ENDPOINTS
    // ⭐ ==========================================

    @Get('niveles-riesgo')
    async obtenerNivelesRiesgo() {
        console.log('📊 [Controller] Obteniendo todos los niveles de riesgo');
        return this.pacientesService.obtenerNivelesRiesgo();
    }

    @Get(':id/nivel-riesgo')
    async obtenerNivelRiesgo(@Param('id') id: string) {
        console.log(`📊 [Controller] Obteniendo nivel de riesgo para paciente ${id}`);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        const nivel = await this.pacientesService.obtenerNivelRiesgo(idNumber);
        return { pacienteId: idNumber, nivelRiesgo: nivel };
    }

    @Patch(':id/nivel-riesgo')
    async actualizarNivelRiesgo(
        @Param('id') id: string,
        @Body() body: { nivelRiesgo: string | null; usuarioId?: number }
    ) {
        console.log(`📊 [Controller] Actualizando nivel de riesgo para paciente ${id}:`, body);
        const idNumber = parseInt(id, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
        }
        return this.pacientesService.actualizarNivelRiesgo(
            idNumber,
            body.nivelRiesgo,
            body.usuarioId || 1
        );
    }

    @Get('enfermera/:idEnfermera/con-riesgo')
    async obtenerPacientesConNivelRiesgo(@Param('idEnfermera') idEnfermera: string) {
        console.log(`📊 [Controller] Obteniendo pacientes con nivel de riesgo para enfermera ${idEnfermera}`);
        const idNumber = parseInt(idEnfermera, 10);
        if (isNaN(idNumber) || idNumber <= 0) {
            return [];
        }
        return this.pacientesService.obtenerPacientesConNivelRiesgo(idNumber);
    }
}