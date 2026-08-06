// src/services/twilio-sms.service.ts

import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class TwilioSMSService {
    private readonly logger = new Logger(TwilioSMSService.name);
    private client: twilio.Twilio;
    private enabled: boolean;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        this.enabled = !!(accountSid && authToken && accountSid.startsWith('AC'));

        if (this.enabled) {
            try {
                this.client = twilio(accountSid, authToken);
                this.logger.log('✅ Twilio SMS Service inicializado');
                // ⭐ USAR TWILIO_WHATSAPP_NUMBER O TWILIO_PHONE_NUMBER
                this.logger.log(`📱 Número de envío: ${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`❌ Error: ${errorMessage}`);
                this.enabled = false;
            }
        } else {
            this.logger.warn('⚠️ Twilio no configurado - modo simulación');
        }
    }

    async enviarSMS(telefono: string, mensaje: string): Promise<boolean> {
        if (!this.enabled || !this.client) {
            this.logger.log(`📱 [SIMULACIÓN] SMS a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        try {
            const numeroFormateado = this.formatearNumero(telefono);
            // ⭐ USAR TWILIO_WHATSAPP_NUMBER O TWILIO_PHONE_NUMBER
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+18777804236';

            this.logger.log(`📤 Enviando SMS:`);
            this.logger.log(`   FROM: ${fromNumber}`);
            this.logger.log(`   TO: ${numeroFormateado}`);

            const message = await this.client.messages.create({
                body: mensaje,
                from: fromNumber,
                to: numeroFormateado
            });

            this.logger.log(`✅ SMS enviado: ${message.sid}`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`❌ Error enviando SMS: ${errorMessage}`);
            return false;
        }
    }

    async enviarConfirmacionVisita(
        telefono: string,
        nombrePaciente: string,
        fecha: string,
        hora: string,
        direccion: string
    ): Promise<boolean> {
        const mensaje = this.generarMensajeConfirmacion(nombrePaciente, fecha, hora, direccion);
        return this.enviarSMS(telefono, mensaje);
    }

    async enviarRecordatorioVisita(
        telefono: string,
        nombrePaciente: string,
        fecha: string,
        hora: string,
        direccion: string
    ): Promise<boolean> {
        const mensaje = this.generarMensajeRecordatorio(nombrePaciente, fecha, hora, direccion);
        return this.enviarSMS(telefono, mensaje);
    }

    private formatearNumero(telefono: string): string {
        let limpio = telefono.replace(/\D/g, '');
        if (limpio.length === 10) {
            return `+52${limpio}`;
        }
        if (limpio.length === 11 && limpio.startsWith('1')) {
            return `+52${limpio.substring(1)}`;
        }
        return `+${limpio}`;
    }

    private generarMensajeConfirmacion(nombre: string, fecha: string, hora: string, direccion: string): string {
        return `
CONFIRMACIÓN DE VISITA

Estimado(a) ${nombre},

Su visita ha sido programada:
📅 ${fecha}
⏰ ${hora}
📍 ${direccion}

Recibirá un recordatorio un día antes.

Salud Casa por Casa
        `.trim();
    }

    private generarMensajeRecordatorio(nombre: string, fecha: string, hora: string, direccion: string): string {
        return `
RECORDATORIO DE VISITA

Estimado(a) ${nombre},

MAÑANA tiene una visita programada:
📅 ${fecha}
⏰ ${hora}
📍 ${direccion}

Salud Casa por Casa
        `.trim();
    }
}