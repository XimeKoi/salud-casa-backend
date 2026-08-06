// src/whatsapp/whatsapp.module.ts

import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { TwilioSMSService } from '../services/twilio-sms.service';

@Module({
    controllers: [WhatsAppController],
    providers: [TwilioSMSService],
    exports: [TwilioSMSService],
})
export class WhatsAppModule { }