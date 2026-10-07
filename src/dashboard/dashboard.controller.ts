// src/dashboard/dashboard.controller.ts

import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
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
    // ⭐ ENDPOINTS EXISTENTES
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

    // ⭐ ============================================
    // ⭐ ⭐ ⭐ NUEVOS ENDPOINTS DE RENDIMIENTO
    // ⭐ ============================================

    // ⭐ RENDIMIENTO POR DÍA Y ENFERMERA
    // GET /dashboard/rendimiento-completo
    // GET /dashboard/rendimiento-completo?fechaInicio=2026-10-01&fechaFin=2026-10-07
    // GET /dashboard/rendimiento-completo?fechaInicio=2026-10-01&fechaFin=2026-10-07&idEnfermera=1
    @Get('rendimiento-completo')
    @HttpCode(HttpStatus.OK)
    async getRendimientoCompleto(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Query('idEnfermera') idEnfermera?: string,
    ) {
        try {
            return await this.dashboardService.getRendimientoCompleto(
                fechaInicio,
                fechaFin,
                idEnfermera ? parseInt(idEnfermera) : undefined,
            );
        } catch (error) {
            console.error('Error en getRendimientoCompleto:', error);
            return { rango: { inicio: fechaInicio, fin: fechaFin }, total_registros: 0, data: [] };
        }
    }

    // ⭐ RENDIMIENTO POR ENFERMERA (RANGO COMPLETO)
    // GET /dashboard/rendimiento-enfermera
    // GET /dashboard/rendimiento-enfermera?fechaInicio=2026-10-01&fechaFin=2026-10-07
    @Get('rendimiento-enfermera')
    @HttpCode(HttpStatus.OK)
    async getRendimientoPorEnfermera(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
    ) {
        try {
            return await this.dashboardService.getRendimientoPorEnfermera(
                fechaInicio,
                fechaFin,
            );
        } catch (error) {
            console.error('Error en getRendimientoPorEnfermera:', error);
            return { rango: { inicio: fechaInicio, fin: fechaFin }, data: [] };
        }
    }
}