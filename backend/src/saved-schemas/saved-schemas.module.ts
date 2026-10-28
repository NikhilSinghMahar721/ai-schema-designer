import { Module } from '@nestjs/common';
import { SavedSchemasService } from './saved-schemas.service.js';
import { SavedSchemasController } from './saved-schemas.controller.js';
import { AuthModule } from '../auth/auth.module.js';

import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SavedSchemasController],
  providers: [SavedSchemasService],
  exports: [SavedSchemasService],
})
export class SavedSchemasModule {}
