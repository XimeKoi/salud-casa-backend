// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PacientesService } from './personal/pacientes.service';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ⭐ AUMENTAR LÍMITE DE PAYLOAD PARA SUBIDA DE FOTOS Y EVIDENCIAS EN BASE64 (50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // ⭐ CORS - PERMITIR DOMINIOS (VERCEL, NETLIFY, LOCAL, PWA Y MÓVILES)
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir siempre: Vercel, Netlify, localhost, PWAs móviles o llamadas directas
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    // ⭐ AGREGAR x-api-key Y api-key A LOS HEADERS PERMITIDOS
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'x-api-key',
      'api-key'
    ],
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