import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto, UpdateIncidenciaDto } from './dto/incidencia.dto';

@Controller('incidencias')
export class IncidenciasController {
    constructor(private readonly incidenciasService: IncidenciasService) { }

    @Get()
    async findAll() {
        return this.incidenciasService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.incidenciasService.findOne(+id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createIncidenciaDto: CreateIncidenciaDto) {
        return this.incidenciasService.create(createIncidenciaDto, 1);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateIncidenciaDto: UpdateIncidenciaDto) {
        return this.incidenciasService.update(+id, updateIncidenciaDto, 1);
    }
    // ⭐ NUEVO ENDPOINT: Geocodificar pacientes específicos por IDs


    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        return this.incidenciasService.remove(+id);
    }
}