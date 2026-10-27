/**
 * Application bootstrap.
 * Sets up: ConfigModule validation, helmet, CORS, JSON body limit,
 * global exception filter, and cookie-parser.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import express from 'express';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Use NestJS built-in logger; never log sensitive data
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN')!;

  // Security headers
  app.use(helmet());

  // Cookie parser (needed for session cookies in later phases)
  app.use(cookieParser());

  // Strict CORS: only the frontend origin is allowed
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  // JSON body size limit — prevents oversized payloads (413 if exceeded)
  app.use(express.json({ limit: '256kb' }));

  // Global validation pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filter — safe error responses, no stack traces
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server running on port ${port}`);
}

await bootstrap();
