// src/personal/personal.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { AwsGeocodeService } from '../services/aws-geocode.service';
import { Usuario } from './entities/user.entity';
import { PersonalEnfermeria } from './entities/personal-enfermeria.entity';
import { Personal } from './entities/personal.entity';
import { Rol } from './entities/rol.entity';
import { Paciente } from './entities/paciente.entity';
import { Incidencia } from './entities/incidencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      PersonalEnfermeria,
      Personal,
      Rol,
      Paciente,
      Incidencia,
    ]),
    NotificacionesModule,
  ],
  controllers: [
    PersonalController,
    PacientesController,
    IncidenciasController,
  ],
  providers: [
    PersonalService,
    PacientesService,
    IncidenciasService,
    AwsGeocodeService,
  ],
  exports: [
    PersonalService,
    PacientesService,
    IncidenciasService,
  ],
})
export class PersonalModule { }