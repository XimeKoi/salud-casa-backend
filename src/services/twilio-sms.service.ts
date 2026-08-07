// src/services/twilio-sms.service.ts

import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class TwilioSMSService {
    private readonly logger = new Logger(TwilioSMSService.name);
    private client: twilio.Twilio;
    private enabled: boolean;

    // ⭐ CONFIGURACIÓN
    private readonly usarWhatsApp: boolean = true;
    private readonly whatsappNumber: string = 'whatsapp:+14155238886';
    private readonly sandboxCode: string = 'join cage-further'; // ⭐ ACTUALIZADO

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        this.enabled = !!(accountSid && authToken && accountSid.startsWith('AC'));

        if (this.enabled) {
            try {
                this.client = twilio(accountSid, authToken);
                this.logger.log('✅ Twilio Service inicializado');
                this.logger.log(`📱 Modo: ${this.usarWhatsApp ? 'WHATSAPP SANDBOX' : 'SMS'}`);
                if (this.usarWhatsApp) {
                    this.logger.log(`📱 WhatsApp Sandbox: ${this.whatsappNumber}`);
                    this.logger.log(`📱 Código de activación: "${this.sandboxCode}"`);
                } else {
                    this.logger.log(`📱 Número de envío: ${process.env.TWILIO_PHONE_NUMBER || '+524931720063'}`);
                }
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
            this.logger.log(`📱 [SIMULACIÓN] Mensaje a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        try {
            const numeroFormateado = this.formatearNumero(telefono);

            if (this.usarWhatsApp) {
                const fromNumber = this.whatsappNumber;
                const toNumber = `whatsapp:${numeroFormateado}`;

                this.logger.log(`📤 Enviando WhatsApp (Sandbox):`);
                this.logger.log(`   FROM: ${fromNumber}`);
                this.logger.log(`   TO: ${toNumber}`);
                this.logger.log(`   📌 El paciente debe enviar "${this.sandboxCode}" a ${fromNumber} UNA SOLA VEZ`);

                const message = await this.client.messages.create({
                    body: mensaje,
                    from: fromNumber,
                    to: toNumber
                });

                this.logger.log(`✅ WhatsApp enviado: ${message.sid}`);
                return true;
            } else {
                const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+524931720063';

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
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`❌ Error enviando mensaje: ${errorMessage}`);
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