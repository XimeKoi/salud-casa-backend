// src/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppController } from './whatsapp.controller';
import { SMSService } from '../services/sms.service';
import { Paciente } from '../personal/entities/paciente.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Paciente])],
    controllers: [WhatsAppController],
    providers: [SMSService],
    exports: [SMSService],
})
export class WhatsAppModule { }