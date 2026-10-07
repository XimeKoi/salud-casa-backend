// src/calendario/calendario.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarioController } from './calendario.controller';
import { CalendarioService } from './calendario.service';
import { VisitaProgramada } from './entities/visita-programada.entity';

@Module({
    imports: [TypeOrmModule.forFeature([VisitaProgramada])],
    controllers: [CalendarioController],
    providers: [CalendarioService],
    exports: [CalendarioService],
})
export class CalendarioModule { }