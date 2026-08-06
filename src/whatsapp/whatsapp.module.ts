// src/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { TwilioWhatsAppService } from '../services/twilio-whatsapp.service';

@Module({
    controllers: [WhatsAppController],
    providers: [TwilioWhatsAppService],
    exports: [TwilioWhatsAppService],
})
export class WhatsAppModule { }