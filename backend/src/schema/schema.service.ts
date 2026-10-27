/**
 * Schema service — orchestrates AI generation/refinement + validation + SQL export.
 * This is the core business logic layer for the schema endpoints.
 */

import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { SqlService } from '../sql/sql.service.js';
import type { Schema, Dialect } from '../schema/schema.types.js';

@Injectable()
export class SchemaService {
  constructor(
    private readonly aiService: AiService,
    private readonly sqlService: SqlService,
  ) {}

  /**
   * Generate a new schema from a natural-language description.
   * The AiService handles parsing, Zod validation, semantic validation, and retries.
   */
  async generate(description: string): Promise<Schema> {
    return this.aiService.generate(description);
  }

  /**
   * Refine an existing schema with a user instruction.
   * The incoming schema has already been Zod-validated by the controller pipe.
   * The AiService re-validates the AI's output.
   */
  async refine(schema: Schema, instruction: string): Promise<Schema> {
    return this.aiService.refine(schema, instruction);
  }

  /**
   * Export a validated schema as SQL for the given dialect.
   * The incoming schema has already been Zod-validated by the controller pipe.
   */
  export(schema: Schema, dialect: Dialect): string {
    return this.sqlService.generate(schema, dialect);
  }
}
