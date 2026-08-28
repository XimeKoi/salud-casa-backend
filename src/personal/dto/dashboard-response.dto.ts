// src/personal/dto/dashboard-response.dto.ts

export class ResumenGeneralResponse {
    visitasHoy: number;
    metaDiaria: number;
    coberturaTotal: number;
    metaTotal: number;
}

export class VisitaDiariaResponse {
    fecha: string;
    realizadas: number;
    meta: number;
    cumplimiento: number;
}

export class RendimientoZonaResponse {
    zona: string;
    visitasProgramadas: number;
    visitasRealizadas: number;
    cumplimiento: number;
    aceptacion: number;
    rechazo: number;
}

export class HistoricoQuincenalResponse {
    periodo: string;
    visitas: number;
    promedio: number;
}

export class HorarioZonaResponse {
    zona: string;
    horario: string;
    pacientes: number;
}

export class AceptacionRechazoResponse {
    mayorAceptacion: { zona: string; porcentaje: number }[];
    mayorRechazo: { zona: string; porcentaje: number }[];
}