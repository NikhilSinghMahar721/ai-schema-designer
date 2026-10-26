import { Injectable } from '@nestjs/common';
import type { Schema, Dialect } from '../schema/schema.types.js';
import { generateSql } from './sql.generator.js';

/**
 * Injectable wrapper around the pure generateSql function.
 * Keeps the generator testable as a standalone function while making it
 * available via NestJS DI.
 */
@Injectable()
export class SqlService {
  generate(schema: Schema, dialect: Dialect): string {
    return generateSql(schema, dialect);
  }
}
