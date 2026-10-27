import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata?: ArgumentMetadata): unknown {
    const schema =
      this.schema ??
      (metadata?.metatype && 'schema' in metadata.metatype
        ? (metadata.metatype as { schema: ZodSchema }).schema
        : undefined);

    if (!schema) {
      return value;
    }

    if (value === null || typeof value !== 'object') {
      throw new BadRequestException(['body: Request body must be a JSON object']);
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
      );
      throw new BadRequestException(messages);
    }
    return result.data;
  }
}
