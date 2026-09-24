// src/notificaciones/notificaciones.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { Notificacion } from './entities/notificacion.entity';
import { Usuario } from '../personal/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notificacion, Usuario])
    ],
    controllers: [NotificacionesController],
    providers: [NotificacionesService],
    exports: [NotificacionesService],
})
export class NotificacionesModule { }