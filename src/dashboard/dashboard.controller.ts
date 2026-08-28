// src/dashboard/dashboard.controller.ts

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
    ResumenGeneralResponse,
    VisitaDiariaResponse,
    RendimientoZonaResponse,
    HistoricoQuincenalResponse,
    HorarioZonaResponse,
    AceptacionRechazoResponse
} from '../personal/dto/dashboard-response.dto';

@Controller('dashboard')
export class DashboardController {

    constructor(private readonly dashboardService: DashboardService) { }

    // ⭐ ============================================
    // ⭐ ENDPOINTS
    // ⭐ ============================================

    @Get('resumen')
    @HttpCode(HttpStatus.OK)
    async getResumenGeneral(): Promise<ResumenGeneralResponse> {
        try {
            return await this.dashboardService.getResumenGeneral();
        } catch (error) {
            console.error('Error en getResumenGeneral:', error);
            return this.dashboardService.getResumenGeneralFallback();
        }
    }

    @Get('visitas-diarias')
    @HttpCode(HttpStatus.OK)
    async getVisitasDiarias(): Promise<VisitaDiariaResponse[]> {
        try {
            return await this.dashboardService.getVisitasDiarias();
        } catch (error) {
            console.error('Error en getVisitasDiarias:', error);
            return this.dashboardService.getVisitasDiariasFallback();
        }
    }

    @Get('rendimiento-zonas')
    @HttpCode(HttpStatus.OK)
    async getRendimientoZonas(): Promise<RendimientoZonaResponse[]> {
        try {
            return await this.dashboardService.getRendimientoZonas();
        } catch (error) {
            console.error('Error en getRendimientoZonas:', error);
            return this.dashboardService.getRendimientoZonasFallback();
        }
    }

    @Get('historico-quincenal')
    @HttpCode(HttpStatus.OK)
    async getHistoricoQuincenal(): Promise<HistoricoQuincenalResponse[]> {
        try {
            return await this.dashboardService.getHistoricoQuincenal();
        } catch (error) {
            console.error('Error en getHistoricoQuincenal:', error);
            return this.dashboardService.getHistoricoQuincenalFallback();
        }
    }

    @Get('horarios-zonas')
    @HttpCode(HttpStatus.OK)
    async getHorariosZonas(): Promise<HorarioZonaResponse[]> {
        try {
            return await this.dashboardService.getHorariosZonas();
        } catch (error) {
            console.error('Error en getHorariosZonas:', error);
            return this.dashboardService.getHorariosZonasFallback();
        }
    }

    @Get('aceptacion-rechazo')
    @HttpCode(HttpStatus.OK)
    async getZonasAceptacionRechazo(): Promise<AceptacionRechazoResponse> {
        try {
            return await this.dashboardService.getZonasAceptacionRechazo();
        } catch (error) {
            console.error('Error en getZonasAceptacionRechazo:', error);
            return this.dashboardService.getZonasAceptacionRechazoFallback();
        }
    }
}