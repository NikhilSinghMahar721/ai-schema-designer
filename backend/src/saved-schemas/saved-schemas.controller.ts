import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SavedSchemasService } from './saved-schemas.service.js';
import type { CreateSavedSchemaDto } from './dto/create-saved-schema.dto.js';
import { CreateSavedSchemaDtoZ } from './dto/create-saved-schema.dto.js';
import type { UpdateSavedSchemaDto } from './dto/update-saved-schema.dto.js';
import { UpdateSavedSchemaDtoZ } from './dto/update-saved-schema.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { SafeUser } from '../users/users.service.js';

@Controller('api/saved-schemas')
@UseGuards(JwtAuthGuard, CsrfGuard)
export class SavedSchemasController {
  constructor(private readonly savedSchemasService: SavedSchemasService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@CurrentUser() user: SafeUser) {
    return this.savedSchemasService.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(CreateSavedSchemaDtoZ))
    dto: CreateSavedSchemaDto,
  ) {
    return this.savedSchemasService.create(user.id, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async get(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.savedSchemasService.get(user.id, id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSavedSchemaDtoZ))
    dto: UpdateSavedSchemaDto,
  ) {
    return this.savedSchemasService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    await this.savedSchemasService.delete(user.id, id);
  }
}
