/**
 * Global HTTP exception filter.
 * All errors pass through here and are mapped to the contract:
 *   { "error": { "code": string, "message": string } }
 * No stack traces or internal details are ever exposed.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let code: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      // NestJS validation pipes return { message: string | string[] }
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const obj = exResponse as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          message = obj.message.join('; ');
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }

      // Friendly rate limit message
      if (status === 429) {
        message = 'Too many requests. Please try again later.';
      }

      code = this.statusToCode(status);
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      ('status' in exception || 'statusCode' in exception)
    ) {
      const err = exception as {
        status?: number;
        statusCode?: number;
        message?: string;
        type?: string;
      };
      status = err.status ?? err.statusCode ?? 500;
      code = this.statusToCode(status);

      if (status === 413 || err.type === 'entity.too.large') {
        status = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Payload too large. Maximum body size is 256kb.';
      } else {
        message = err.message || 'Error processing request';
      }
    } else {
      // Unexpected errors — log the real error, return a generic message
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      code = 'INTERNAL_ERROR';

      // Log safely: never log passwords, API keys, emails, or full prompts
      const errMessage =
        exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.error(`Unhandled exception: ${errMessage}`);
    }

    response.status(status).json({
      error: { code, message },
    });
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 404:
        return 'NOT_FOUND';
      case 408:
        return 'TIMEOUT';
      case 409:
        return 'CONFLICT';
      case 413:
        return 'PAYLOAD_TOO_LARGE';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'RATE_LIMITED';
      case 502:
        return 'BAD_GATEWAY';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
