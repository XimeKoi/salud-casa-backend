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
        console.log('📥 [WhatsAppController] Recibida petición de confirmación:');
        console.log('  📱 Teléfono:', data.telefono);
        console.log('  👤 Paciente:', data.nombrePaciente);
        console.log('  📅 Fecha:', data.fecha);
        console.log('  ⏰ Hora:', data.hora);
        console.log('  📍 Dirección:', data.direccion);

        const enviado = await this.smsService.enviarConfirmacionVisita(
            data.telefono,
            data.nombrePaciente,
            data.fecha,
            data.hora,
            data.direccion
        );

        console.log('📤 [WhatsAppController] Resultado:', enviado ? '✅ Enviado' : '❌ Error');

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
        console.log('📥 [WhatsAppController] Recibida petición de recordatorio:');
        console.log('  📱 Teléfono:', data.telefono);
        console.log('  👤 Paciente:', data.nombrePaciente);

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