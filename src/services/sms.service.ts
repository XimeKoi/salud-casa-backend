// src/services/sms.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../personal/entities/paciente.entity';

@Injectable()
export class SMSService {
    private readonly logger = new Logger(SMSService.name);
    private readonly DEVICE_ID: string;
    private readonly API_KEY: string;
    private readonly API_URL = 'https://api.textbee.dev/api/v1/gateway/devices';

    constructor(
        @InjectRepository(Paciente)
        private pacienteRepository: Repository<Paciente>,
    ) {
        this.DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || '';
        this.API_KEY = process.env.TEXTBEE_API_KEY || '';

        if (!this.DEVICE_ID || !this.API_KEY) {
            this.logger.warn('⚠️ TextBee no configurado - modo simulación');
        } else {
            this.logger.log('✅ TextBee Service inicializado');
            this.logger.log(`📱 Device ID: ${this.DEVICE_ID}`);
        }
    }

    async enviarSMS(telefono: string, mensaje: string): Promise<boolean> {
        if (!this.DEVICE_ID || !this.API_KEY) {
            this.logger.log(`📱 [SIMULACIÓN] SMS a ${telefono}: ${mensaje.substring(0, 50)}...`);
            return true;
        }

        try {
            const numeroFormateado = this.formatearNumero(telefono);

            this.logger.log(`📤 Enviando SMS a: ${numeroFormateado}`);

            const response = await fetch(
                `${this.API_URL}/${this.DEVICE_ID}/send-sms`,
                {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.API_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients: [numeroFormateado],
                        message: mensaje,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.logger.log(`✅ SMS enviado correctamente`);
                return true;
            } else {
                const errorMsg = data?.message || data?.error || 'Error desconocido';
                this.logger.error(`❌ Error: ${errorMsg}`);
                return false;
            }
        } catch (error) {
            // ⭐ CORREGIDO: manejar error de tipo unknown
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`❌ Error enviando SMS: ${errorMessage}`);
            return false;
        }
    }

    private formatearNumero(telefono: string): string {
        const limpio = telefono.replace(/\D/g, '');
        if (limpio.length === 10) {
            return `+52${limpio}`;
        }
        if (limpio.length === 11 && limpio.startsWith('1')) {
            return `+52${limpio.substring(1)}`;
        }
        return `+${limpio}`;
    }

    generarMensajeConfirmacion(nombre: string, fecha: string, hora: string, direccion: string): string {
        return `
🏥 SALUD CASA POR CASA

Hola ${nombre}, 

Su visita ha sido agendada:
📅 Fecha: ${fecha}
⏰ Hora: ${hora}


💚 Su salud es nuestra prioridad.
        `.trim();
    }

    generarMensajeRecordatorio(nombre: string, fecha: string, hora: string, direccion: string): string {
        return `
🏥 SALUD CASA POR CASA

Hola ${nombre}! ⏰

🔔 RECUERDE que MAÑANA tiene su visita:

📅 Fecha: ${fecha}
⏰ Hora: ${hora}
📍 Dirección: ${direccion}

📌 Prepare:
- Identificación oficial
- CURP

¡Le esperamos! 💚
        `.trim();
    }

    async enviarConfirmacionCita(
        telefono: string,
        nombre: string,
        fecha: string,
        hora: string,
        direccion: string
    ): Promise<boolean> {
        const mensaje = this.generarMensajeConfirmacion(nombre, fecha, hora, direccion);
        return this.enviarSMS(telefono, mensaje);
    }

    async enviarRecordatorioCita(
        telefono: string,
        nombre: string,
        fecha: string,
        hora: string,
        direccion: string
    ): Promise<boolean> {
        const mensaje = this.generarMensajeRecordatorio(nombre, fecha, hora, direccion);
        return this.enviarSMS(telefono, mensaje);
    }
}