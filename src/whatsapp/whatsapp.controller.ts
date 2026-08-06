// src/whatsapp/whatsapp.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { WhatsAppService } from '../services/whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
    constructor(private whatsappService: WhatsAppService) { }

    @Post('confirmacion')
    async enviarConfirmacion(@Body() data: {
        telefono: string;
        nombrePaciente: string;
        fecha: string;
        hora: string;
        direccion: string;
    }) {
        const enviado = await this.whatsappService.enviarConfirmacionVisita(
            data.telefono,
            data.nombrePaciente,
            data.fecha,
            data.hora,
            data.direccion
        );

        return {
            success: enviado,
            message: enviado ? 'Confirmación enviada' : 'Error al enviar'
        };
    }

    @Post('recordatorio')
    async enviarRecordatorio(@Body() data: {
        telefono: string;
        nombrePaciente: string;
        fecha: string;
        hora: string;
        direccion: string;
    }) {
        const enviado = await this.whatsappService.enviarRecordatorioVisita(
            data.telefono,
            data.nombrePaciente,
            data.fecha,
            data.hora,
            data.direccion
        );

        return {
            success: enviado,
            message: enviado ? 'Recordatorio enviado' : 'Error al enviar'
        };
    }
}