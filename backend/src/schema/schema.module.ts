import { Module } from '@nestjs/common';
import { SchemaController } from './schema.controller.js';
import { SchemaService } from './schema.service.js';
import { AiModule } from '../ai/ai.module.js';
import { SqlModule } from '../sql/sql.module.js';

@Module({
  imports: [AiModule, SqlModule],
  controllers: [SchemaController],
  providers: [SchemaService],
})
export class SchemaModule {}
