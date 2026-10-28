import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigin: string;

  constructor(private readonly configService: ConfigService) {
    this.allowedOrigin = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:3000',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Apply strict CSRF defenses to state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // 1. Content-Type check: reject non-JSON payloads (blocks plain HTML form submissions)
      const contentType = request.headers['content-type'];
      const contentLength = request.headers['content-length'];
      const hasBody = contentLength ? parseInt(contentLength, 10) > 0 : false;

      if (contentType && !contentType.toLowerCase().includes('application/json')) {
        throw new BadRequestException('Content-Type must be application/json');
      }

      if (hasBody && (!contentType || !contentType.toLowerCase().includes('application/json'))) {
        throw new BadRequestException('Content-Type must be application/json');
      }

      // 2. Origin header validation if present
      const origin = request.headers['origin'];
      if (origin && origin !== this.allowedOrigin) {
        throw new ForbiddenException('Cross-origin request blocked');
      }
    }

    return true;
  }
}
