// src/calendario/calendario.controller.ts

import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CalendarioService } from './calendario.service';

@Controller('calendario')
export class CalendarioController {
    constructor(private readonly calendarioService: CalendarioService) { }

    @Get('visitas')
    findAll() {
        return this.calendarioService.findAll();
    }

    @Post('visitas')
    crear(@Body() body: { visitas: any[] }) {
        return this.calendarioService.crearMultiples(body.visitas);
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