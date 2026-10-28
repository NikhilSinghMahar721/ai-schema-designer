import {
  Injectable,
  NotFoundException,
  ConflictException,
  PayloadTooLargeException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SchemaZ, type Schema } from '../schema/schema.types.js';
import {
  validateSemantics,
  SchemaValidationError,
} from '../schema/schema.validator.js';
import type { CreateSavedSchemaDto } from './dto/create-saved-schema.dto.js';
import type { UpdateSavedSchemaDto } from './dto/update-saved-schema.dto.js';
import type { Prisma } from '@prisma/client';

const MAX_SAVED_SCHEMAS_PER_USER = 50;
const MAX_SCHEMA_BYTES = 200 * 1024; // 200 KB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidUuid(id: string): void {
  if (!UUID_REGEX.test(id)) {
    // Return 404 so IDs cannot be probed
    throw new NotFoundException('Saved schema not found');
  }
}

export interface SavedSchemaListItem {
  id: string;
  name: string;
  dialect: string;
  updatedAt: Date;
}

export interface SavedSchemaDetail {
  id: string;
  name: string;
  dialect: string;
  schema: Schema;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SavedSchemasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Re-validates a schema (Zod structure + semantic rules + size limit).
   * Used both on save and on load (Security V24 / T10.3).
   */
  validateSchema(schema: unknown): Schema {
    const jsonStr = JSON.stringify(schema);
    const byteLength = Buffer.byteLength(jsonStr, 'utf8');

    if (byteLength > MAX_SCHEMA_BYTES) {
      throw new PayloadTooLargeException(
        'Schema exceeds maximum allowed size of 200 KB',
      );
    }

    const parseResult = SchemaZ.safeParse(schema);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(`Invalid schema structure: ${issueMsg}`);
    }

    try {
      validateSemantics(parseResult.data);
    } catch (err) {
      if (err instanceof SchemaValidationError) {
        throw new BadRequestException(
          `Invalid schema semantics: ${err.errors.join('; ')}`,
        );
      }
      throw err;
    }

    return parseResult.data;
  }

  async list(userId: string): Promise<{ items: SavedSchemaListItem[] }> {
    const items = await this.prisma.savedSchema.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        dialect: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { items };
  }

  async get(userId: string, id: string): Promise<{ item: SavedSchemaDetail }> {
    assertValidUuid(id);

    const record = await this.prisma.savedSchema.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Saved schema not found');
    }

    // Re-validate schema on load (V24 / T10.3)
    const schema = this.validateSchema(record.schemaJson);

    return {
      item: {
        id: record.id,
        name: record.name,
        dialect: record.dialect,
        schema,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  async create(
    userId: string,
    dto: CreateSavedSchemaDto,
  ): Promise<{ item: SavedSchemaDetail }> {
    // 1. Enforce max 50 schemas per user limit (T10.4 / Security V24)
    const count = await this.prisma.savedSchema.count({
      where: { userId },
    });
    if (count >= MAX_SAVED_SCHEMAS_PER_USER) {
      throw new ConflictException('Maximum limit of 50 saved schemas reached');
    }

    // 2. Validate schema on save (structure, semantics, size limit)
    const validatedSchema = this.validateSchema(dto.schema);

    // 3. Persist record strictly associated with authenticated userId
    const record = await this.prisma.savedSchema.create({
      data: {
        userId,
        name: dto.name,
        dialect: dto.dialect,
        schemaJson: validatedSchema as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      item: {
        id: record.id,
        name: record.name,
        dialect: record.dialect,
        schema: validatedSchema,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSavedSchemaDto,
  ): Promise<{ item: SavedSchemaDetail }> {
    assertValidUuid(id);

    // Always filter by both id and userId (IDOR prevention / Security V19)
    const existing = await this.prisma.savedSchema.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Saved schema not found');
    }

    const updateData: Prisma.SavedSchemaUpdateInput = {};
    let returnedSchema: Schema = existing.schemaJson as unknown as Schema;

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.dialect !== undefined) {
      updateData.dialect = dto.dialect;
    }
    if (dto.schema !== undefined) {
      const validated = this.validateSchema(dto.schema);
      updateData.schemaJson = validated as unknown as Prisma.InputJsonValue;
      returnedSchema = validated;
    }

    const updated = await this.prisma.savedSchema.update({
      where: { id },
      data: updateData,
    });

    return {
      item: {
        id: updated.id,
        name: updated.name,
        dialect: updated.dialect,
        schema: returnedSchema,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async delete(userId: string, id: string): Promise<void> {
    assertValidUuid(id);

    const existing = await this.prisma.savedSchema.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Saved schema not found');
    }

    await this.prisma.savedSchema.delete({
      where: { id },
    });
  }
}
