// src/services/whatsapp.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsAppService implements OnModuleInit {
    private readonly logger = new Logger(WhatsAppService.name);
    private client: Client;
    private isReady = false;
    private isProduction = process.env.NODE_ENV === 'production';

    async onModuleInit() {
        // ⭐ EN PRODUCCIÓN (RAILWAY) - MODO SIMULACIÓN
        if (this.isProduction) {
            this.logger.warn('⚠️ Modo producción: WhatsApp en modo simulación');
            this.logger.warn('📱 Los mensajes se mostrarán en los logs pero no se enviarán');
            return;
        }

        // ⭐ EN DESARROLLO (LOCAL) - CONEXIÓN REAL POR QR
        this.logger.log('🚀 Iniciando WhatsApp...');

        try {
            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`❌ Error al inicializar WhatsApp: ${errorMessage}`);
            this.logger.warn('⚠️ El sistema continuará funcionando en modo simulación');
        }
    }

    async enviarMensaje(telefono: string, mensaje: string): Promise<boolean> {
        // ⭐ EN PRODUCCIÓN: Solo simular
        if (this.isProduction) {
            this.logger.log(`📱 [SIMULACIÓN] Mensaje a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        // ⭐ EN DESARROLLO: Enviar realmente
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