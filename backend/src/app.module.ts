import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation.js';
import { SchemaModule } from './schema/schema.module.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    // Validated env config — app refuses to start if env is invalid
    ConfigModule.forRoot({
      validate: (config) => validateEnv(config),
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    // Global rate limiting — per-IP
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.RATE_LIMIT_TTL_SECONDS || '60', 10) * 1000,
          limit: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
        },
      ],
    }),
    SchemaModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
