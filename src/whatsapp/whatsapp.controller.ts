// src/whatsapp/whatsapp.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { TwilioSMSService } from '../services/twilio-sms.service';

@Controller('whatsapp')
export class WhatsAppController {
    constructor(private smsService: TwilioSMSService) { }

    @Post('confirmacion')
    async enviarConfirmacion(@Body() data: {
        telefono: string;
        nombrePaciente: string;
        fecha: string;
        hora: string;
        direccion: string;
    }) {
        const enviado = await this.smsService.enviarConfirmacionVisita(
            data.telefono,
            data.nombrePaciente,
            data.fecha,
            data.hora,
            data.direccion
        );

        return {
            success: enviado,
            message: enviado ? 'Confirmación enviada por SMS' : 'Error al enviar'
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
        const enviado = await this.smsService.enviarRecordatorioVisita(
            data.telefono,
            data.nombrePaciente,
            data.fecha,
            data.hora,
            data.direccion
        );

        return {
            success: enviado,
            message: enviado ? 'Recordatorio enviado por SMS' : 'Error al enviar'
        };
    }
}