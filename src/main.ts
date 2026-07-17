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

  // ⭐ CORS CONFIGURADO PARA PRODUCCIÓN
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
    'https://salud-casa-por-casa.netlify.app',
    'https://*.netlify.app',
    /\.netlify\.app$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          if (allowed.includes('*')) {
            const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
            return regex.test(origin);
          }
          return origin === allowed;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });

      if (isAllowed || nodeEnv === 'development') {
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

  // ⭐ LOGS DE INICIO
  logger.log(`🚀 Servidor iniciado en puerto ${port}`);
  logger.log(`🌍 Entorno: ${nodeEnv}`);
  logger.log(`📊 Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

  // ⭐⭐⭐ LA CLAVE: ESCUCHAR EN 0.0.0.0 ⭐⭐⭐
  await app.listen(port, '0.0.0.0');

  // ⭐ GEOCODIFICADO SOLO EN DESARROLLO
  if (nodeEnv !== 'production') {
    try {
      logger.log('🌍 Iniciando geocodificación automática...');
      const pacientesService = app.get(PacientesService);
      const resultado = await pacientesService.geocodeAllPacientes();
      logger.log(`✅ Geocodificado completado: ${resultado?.conCoordenadas || 0} pacientes procesados`);

      logger.log('📍 Corrigiendo coordenadas fuera del distrito...');
      const correccion = await pacientesService.corregirCoordenadasDistrito();
      if (correccion && correccion.corregidos !== undefined) {
        logger.log(`✅ Corrección completada: ${correccion.corregidos} pacientes corregidos`);
      }
    } catch (error: any) {
      logger.error('❌ Error en geocodificación automática:', error.message);
    }
  }
}
bootstrap();