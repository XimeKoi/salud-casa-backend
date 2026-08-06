// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PacientesService } from './personal/pacientes.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // ⭐ CORS - PERMITIR NETLIFY Y LOCALHOST
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isNetlify = /\.netlify\.app$/.test(origin) ||
        /\.netlify\.com$/.test(origin) ||
        origin.includes('netlify.app') ||
        origin.includes('netlify.com');

      const isLocal = origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('192.168.');

      if (isNetlify || isLocal || nodeEnv === 'development') {
        callback(null, true);
      } else {
        logger.warn(`CORS bloqueado para: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  logger.log(`🚀 Servidor iniciado en puerto ${port}`);
  logger.log(`🌍 Entorno: ${nodeEnv}`);

  await app.listen(port, '0.0.0.0');

  // ⭐ GEOCODIFICADO SOLO EN DESARROLLO
  if (nodeEnv !== 'production') {
    try {
      logger.log('🌍 Iniciando geocodificación automática...');
      const pacientesService = app.get(PacientesService);
      const resultado = await pacientesService.geocodeAllPacientes();
      logger.log(`✅ Geocodificado completado: ${resultado?.conCoordenadas || 0} pacientes procesados`);
    } catch (error: any) {
      logger.error('❌ Error en geocodificación automática:', error.message);
    }
  }
}
bootstrap();