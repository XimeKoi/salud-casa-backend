// src/notificaciones/notificaciones.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('notificaciones')
export class NotificacionesController {
    constructor(private notificacionesService: NotificacionesService) { }

    // ⭐ ==========================================
    // ⭐ ENDPOINTS PARA USUARIOS NORMALES
    // ⭐ ==========================================

    @Get('usuario/:usuarioId')
    async getByUsuario(
        @Param('usuarioId') usuarioId: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        return this.notificacionesService.findByUsuario(
            parseInt(usuarioId),
            limit ? parseInt(limit) : 50,
            page ? parseInt(page) : 1
        );
    }

    @Get('contador/:usuarioId')
    async getContador(@Param('usuarioId') usuarioId: string) {
        return this.notificacionesService.getContador(parseInt(usuarioId));
    }

    @Patch(':id/leida')
    async marcarLeida(@Param('id') id: string, @Body('usuarioId') usuarioId: number) {
        return this.notificacionesService.marcarLeida(parseInt(id), usuarioId);
    }

    @Patch(':id/estado')
    async toggleEstado(
        @Param('id') id: string,
        @Body('leida') leida: boolean,
        @Body('usuarioId') usuarioId: number
    ) {
        return this.notificacionesService.toggleEstado(parseInt(id), usuarioId, leida);
    }

    @Patch('usuario/:usuarioId/leidas')
    async marcarTodasLeidas(@Param('usuarioId') usuarioId: string) {
        return this.notificacionesService.marcarTodasLeidas(parseInt(usuarioId));
    }

    @Delete(':id')
    async eliminar(@Param('id') id: string, @Body('usuarioId') usuarioId: number) {
        return this.notificacionesService.eliminar(parseInt(id), usuarioId);
    }

    @Post()
    async crear(@Body() data: any) {
        return this.notificacionesService.crearNotificacion(data);
    }

    // ⭐ ==========================================
    // ⭐ NUEVOS ENDPOINTS PARA JEFES (CON API KEY)
    // ⭐ ==========================================

    // ⭐ 1. OBTENER TODAS LAS NOTIFICACIONES (TODOS LOS USUARIOS)
    @UseGuards(ApiKeyGuard)
    @Get('todas')
    async getAllNotificaciones(
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        console.log('📊 [Controller] Obteniendo todas las notificaciones');
        return this.notificacionesService.findAllNotificaciones(
            limit ? parseInt(limit) : 100,
            page ? parseInt(page) : 1
        );
    }

    // ⭐ 2. OBTENER NOTIFICACIONES POR ROL (ENFERMERAS, ADMIN, ETC)
    @UseGuards(ApiKeyGuard)
    @Get('por-rol/:rol')
    async getNotificacionesByRol(
        @Param('rol') rol: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        console.log(`📊 [Controller] Obteniendo notificaciones para rol: ${rol}`);
        return this.notificacionesService.findNotificacionesByRol(
            rol,
            limit ? parseInt(limit) : 100,
            page ? parseInt(page) : 1
        );
    }

    // ⭐ 3. OBTENER ESTADÍSTICAS DE NOTIFICACIONES
    @UseGuards(ApiKeyGuard)
    @Get('estadisticas')
    async getEstadisticasNotificaciones() {
        console.log('📊 [Controller] Obteniendo estadísticas de notificaciones');
        return this.notificacionesService.getEstadisticasNotificaciones();
    }

    // ⭐ 4. OBTENER NOTIFICACIONES DE UNA ENFERMERA ESPECÍFICA (PARA JEFES)
    @UseGuards(ApiKeyGuard)
    @Get('enfermera/:enfermeraId')
    async getNotificacionesByEnfermera(
        @Param('enfermeraId') enfermeraId: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        console.log(`📊 [Controller] Obteniendo notificaciones para enfermera: ${enfermeraId}`);
        return this.notificacionesService.findByUsuario(
            parseInt(enfermeraId),
            limit ? parseInt(limit) : 50,
            page ? parseInt(page) : 1
        );
    }
}