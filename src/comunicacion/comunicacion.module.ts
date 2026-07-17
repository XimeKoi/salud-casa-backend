import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunicacionController } from './comunicacion.controller';
import { ComunicacionService } from './comunicacion.service';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Personal])],
    controllers: [ComunicacionController],
    providers: [ComunicacionService],
    exports: [ComunicacionService],
})
export class ComunicacionModule { }