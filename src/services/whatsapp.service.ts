// src/services/whatsapp.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsAppService implements OnModuleInit {
    private readonly logger = new Logger(WhatsAppService.name);
    private client: Client;
    private isReady = false;

    async onModuleInit() {
        this.logger.log('🚀 Iniciando WhatsApp...');

        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.client.on('qr', (qr) => {
            this.logger.log('📱 ESCANEA ESTE QR CON TU WHATSAPP:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            this.isReady = true;
            this.logger.log('✅ WhatsApp conectado exitosamente!');
            this.logger.log(`📱 Número conectado: ${this.client.info?.wid?.user}`);
        });

        this.client.on('auth_failure', () => {
            this.logger.error('❌ Error de autenticación. Escanea el QR nuevamente.');
            this.isReady = false;
        });

        this.client.on('disconnected', () => {
            this.logger.warn('⚠️ WhatsApp desconectado');
            this.isReady = false;
        });

        await this.client.initialize();
    }

    async enviarMensaje(telefono: string, mensaje: string): Promise<boolean> {
        if (!this.isReady) {
            this.logger.warn('⚠️ WhatsApp no está listo');
            this.logger.log(`📱 [SIMULACIÓN] Mensaje a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        try {
            const numero = this.formatearNumero(telefono);
            const chatId = `${numero}@c.us`;

            await this.client.sendMessage(chatId, mensaje);
            this.logger.log(`✅ Mensaje enviado a ${telefono}`);
            return true;
        } catch (error) {
            // ⭐ CORREGIDO - Manejo seguro de error
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