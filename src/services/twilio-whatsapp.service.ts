// src/services/twilio-whatsapp.service.ts

import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio'; // ⭐ CAMBIAR: import por defecto

@Injectable()
export class TwilioWhatsAppService {
    private readonly logger = new Logger(TwilioWhatsAppService.name);
    private client: twilio.Twilio;
    private enabled: boolean;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        // ⭐ VERIFICACIÓN MEJORADA
        this.enabled = !!(accountSid && authToken &&
            accountSid !== 'ACxxxxxxxx' &&
            accountSid.startsWith('AC'));

        if (this.enabled) {
            try {
                this.client = twilio(accountSid, authToken);
                this.logger.log('✅ Twilio WhatsApp Service inicializado');
                this.logger.log(`📱 Número de envío: ${process.env.TWILIO_WHATSAPP_NUMBER || 'No configurado'}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`❌ Error inicializando Twilio: ${errorMessage}`);
                this.enabled = false;
            }
        } else {
            this.logger.warn('⚠️ Twilio no configurado - modo simulación');
            this.logger.warn('📌 TWILIO_ACCOUNT_SID debe comenzar con "AC"');
            this.logger.warn('📌 TWILIO_AUTH_TOKEN no debe estar vacío');
        }
    }

    async enviarMensaje(telefono: string, mensaje: string): Promise<boolean> {
        if (!this.enabled || !this.client) {
            this.logger.log(`📱 [SIMULACIÓN] Mensaje a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        try {
            const numeroFormateado = this.formatearNumero(telefono);
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

            this.logger.log(`📤 Enviando WhatsApp a ${numeroFormateado} desde ${fromNumber}`);

            const message = await this.client.messages.create({
                body: mensaje,
                from: `whatsapp:${fromNumber}`,
                to: `whatsapp:${numeroFormateado}`
            });

            this.logger.log(`✅ WhatsApp enviado a ${telefono}: ${message.sid}`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`❌ Error enviando WhatsApp: ${errorMessage}`);

            // ⭐ Si el error es de autenticación, deshabilitar Twilio
            if (errorMessage.includes('authenticate') || errorMessage.includes('Auth')) {
                this.logger.warn('⚠️ Error de autenticación - deshabilitando Twilio');
                this.enabled = false;
            }

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
        return this.enviarMensaje(telefono, mensaje);
    }

    async enviarRecordatorioVisita(
        telefono: string,
        nombrePaciente: string,
        fecha: string,
        hora: string,
        direccion: string
    ): Promise<boolean> {
        const mensaje = this.generarMensajeRecordatorio(nombrePaciente, fecha, hora, direccion);
        return this.enviarMensaje(telefono, mensaje);
    }

    private formatearNumero(telefono: string): string {
        let limpio = telefono.replace(/\D/g, '');
        if (limpio.length === 10) {
            return `52${limpio}`;
        }
        if (limpio.length === 11 && limpio.startsWith('1')) {
            return `52${limpio.substring(1)}`;
        }
        return limpio;
    }

    private generarMensajeConfirmacion(nombre: string, fecha: string, hora: string, direccion: string): string {
        return `
🩺 CONFIRMACIÓN DE VISITA

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
🩺 RECORDATORIO DE VISITA

Estimado(a) ${nombre},

MAÑANA tiene una visita programada:
📅 ${fecha}
⏰ ${hora}
📍 ${direccion}

Salud Casa por Casa
        `.trim();
    }
}