import { Controller, Get, Post, Body } from '@nestjs/common';
import { ComunicacionService } from './comunicacion.service';

@Controller('api/compartir')
export class ComunicacionController {
    constructor(private comunicacionService: ComunicacionService) { }

    // Endpoint que ella va a consumir para ver tus notificaciones
    @Get('notificaciones')
    async getNotificaciones() {
        return this.comunicacionService.getNotificacionesParaDistrital();
    }

    // Endpoint para compartir tus visitas
    @Get('visitas')
    async getVisitas() {
        return this.comunicacionService.getVisitasParaDistrital();
    }

    // Endpoint para ver estadísticas (opcional)
    @Get('estadisticas')
    async getEstadisticas() {
        return this.comunicacionService.getEstadisticas();
    }
}