// src/whatsapp/whatsapp.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { SMSService } from '../services/sms.service';

@Controller('whatsapp')
export class WhatsAppController {
    constructor(private smsService: SMSService) { }

    @Post('confirmacion')
    async enviarConfirmacion(@Body() data: {
        telefono: string;
        nombrePaciente: string;
        fecha: string;
        hora: string;
        direccion: string;
    }) {
        console.log('📥 [Confirmación] Recibida petición:');
        console.log(`   📱 Teléfono: ${data.telefono}`);
        console.log(`   👤 Paciente: ${data.nombrePaciente}`);

        try {
            const enviado = await this.smsService.enviarConfirmacionCita(
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
        } catch (error) {
            // ⭐ CORREGIDO: manejar error de tipo unknown
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('❌ Error en confirmación:', errorMessage);
            return {
                success: false,
                message: `Error: ${errorMessage}`
            };
        }
    }

    @Post('recordatorio')
    async enviarRecordatorio(@Body() data: {
        telefono: string;
        nombrePaciente: string;
        fecha: string;
        hora: string;
        direccion: string;
    }) {
        console.log('📥 [Recordatorio] Recibida petición:');
        console.log(`   📱 Teléfono: ${data.telefono}`);
        console.log(`   👤 Paciente: ${data.nombrePaciente}`);

        try {
            const enviado = await this.smsService.enviarRecordatorioCita(
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
        } catch (error) {
            // ⭐ CORREGIDO: manejar error de tipo unknown
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('❌ Error en recordatorio:', errorMessage);
            return {
                success: false,
                message: `Error: ${errorMessage}`
            };
        }
    }
}