// src/geocode/geocode.module.ts

import { Module } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';
import { AwsGeocodeService } from '../services/aws-geocode.service';

@Module({
    controllers: [GeocodeController],
    providers: [AwsGeocodeService],
    exports: [AwsGeocodeService]
})
export class GeocodeModule { }