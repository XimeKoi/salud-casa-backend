// src/notificaciones/notificaciones.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
    constructor(private notificacionesService: NotificacionesService) { }

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

    // ⭐ NUEVO: Endpoint para toggle (leída / no leída)
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
}