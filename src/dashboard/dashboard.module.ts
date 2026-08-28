// src/dashboard/dashboard.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Paciente } from '../personal/entities/paciente.entity';
import { Incidencia } from '../personal/entities/incidencia.entity';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Paciente, Incidencia, Personal])
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }