export class CreateIncidenciaDto {
    tipo: string;
    descripcion: string;
    direccion: string;
    fecha?: Date;
    fotos?: string[];
    resuelta?: boolean;
    pacienteId?: number | null;
    datosPaciente?: {
        id: number;
        nombre: string;
        direccion: string;
        telefono: string;
        colonia: string;
        seccion: string;
    };
}

export class UpdateIncidenciaDto {
    resuelta?: boolean;
}