// src/calendario/calendario.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CalendarioService } from './calendario.service';

@Controller('calendario')
export class CalendarioController {
    constructor(private readonly calendarioService: CalendarioService) { }

    @Get('visitas')
    findAll(
        @Query('usuarioId') usuarioId?: string,
        @Query('enfermeraId') enfermeraId?: string,
    ) {
        return this.calendarioService.findAll(
            usuarioId ? parseInt(usuarioId, 10) : undefined,
            enfermeraId ? parseInt(enfermeraId, 10) : undefined,
        );
    }

    @Post('visitas')
    crear(@Body() body: { visitas: any[]; usuarioId?: number }) {
        return this.calendarioService.crearMultiples(body.visitas, body.usuarioId);
    }

    @Patch('visitas/:id')
    actualizarEstado(@Param('id') id: string, @Body() body: { estado: string }) {
        return this.calendarioService.actualizarEstado(+id, body.estado);
    }

    @Delete('visitas/:id')
    eliminar(@Param('id') id: string) {
        return this.calendarioService.eliminar(+id);
    }
}
