// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonalModule } from './personal/personal.module';
import { ComunicacionModule } from './comunicacion/comunicacion.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AuthController } from './auth/auth.controller';
import { Usuario } from './personal/entities/user.entity';
import { PersonalEnfermeria } from './personal/entities/personal-enfermeria.entity';
import { Personal } from './personal/entities/personal.entity';
import { Rol } from './personal/entities/rol.entity';
import { Paciente } from './personal/entities/paciente.entity';
import { Incidencia } from './personal/entities/incidencia.entity';
import { Notificacion } from './notificaciones/entities/notificacion.entity';
import { GeocodeModule } from './geocode/geocode.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'saludcasa',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      extra: {
        max: 20,
        connectionTimeoutMillis: 30000,
      },
    }),

    TypeOrmModule.forFeature([
      Usuario,
      PersonalEnfermeria,
      Personal,
      Rol,
      Paciente,
      Incidencia,
      Notificacion,
    ]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mi_clave_secreta_dev',
      signOptions: { expiresIn: '7d' },
    }),

    PersonalModule,
    ComunicacionModule,
    NotificacionesModule,
    GeocodeModule,
    WhatsAppModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule { }