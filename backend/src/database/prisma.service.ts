import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isDbConnected = false;

  get isConnected(): boolean {
    return this.isDbConnected;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isDbConnected = true;
      this.logger.log('Successfully connected to PostgreSQL database');
    } catch {
      this.isDbConnected = false;
      this.logger.warn(
        'Could not reach PostgreSQL database at DATABASE_URL. Running in local file-storage mode.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isDbConnected) {
      try {
        await this.$disconnect();
      } catch {
        // Ignored during shutdown
      }
    }
  }
}
