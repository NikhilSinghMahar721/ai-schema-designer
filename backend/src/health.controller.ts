/**
 * Health check endpoint.
 * GET /api/health → { "status": "ok" }
 */

import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api')
export class HealthController {
  @Get('health')
  @SkipThrottle()
  health() {
    return { status: 'ok' };
  }
}
