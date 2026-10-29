import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { LocalStorageService } from './local-storage.service.js';

@Global()
@Module({
  providers: [PrismaService, LocalStorageService],
  exports: [PrismaService, LocalStorageService],
})
export class DatabaseModule {}
