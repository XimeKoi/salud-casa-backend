// src/personal/dto/update-paciente.dto.ts

export class UpdatePacienteDto {
    programa?: string;
    estatus?: string;
    discapacidadMotriz?: boolean;
    discapacidadVisual?: boolean;
    discapacidadAuditiva?: boolean;
    discapacidadIntelectual?: boolean;
    discapacidadPsicosocial?: boolean;
    fechaFinado?: Date | string;
    lat?: number;
    lng?: number;
    direccion?: string;
    telefonoFijo?: string;
    telefonoCelular?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    curp?: string;
    zonaTrabajo?: string;
}