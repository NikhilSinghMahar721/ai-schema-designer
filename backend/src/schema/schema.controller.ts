/**
 * Schema controller — REST endpoints for generate, refine, and export.
 * All endpoints work for guests (no auth required).
 *
 * Routes:
 *   POST /api/schema/generate
 *   POST /api/schema/refine
 *   POST /api/schema/export
 */

import {
  Controller,
  Post,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SchemaService } from './schema.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { GenerateDtoZ, type GenerateDto } from './dto/generate.dto.js';
import { RefineDtoZ, type RefineDto } from './dto/refine.dto.js';
import { ExportDtoZ, type ExportDto } from './dto/export.dto.js';

@Controller('api/schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(GenerateDtoZ))
  async generate(@Body() dto: GenerateDto) {
    const schema = await this.schemaService.generate(dto.description);
    return { schema };
  }

  @Post('refine')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(RefineDtoZ))
  async refine(@Body() dto: RefineDto) {
    const schema = await this.schemaService.refine(dto.schema, dto.instruction);
    return { schema };
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ExportDtoZ))
  exportSql(@Body() dto: ExportDto) {
    const sql = this.schemaService.export(dto.schema, dto.dialect);
    return { sql };
  }
}
