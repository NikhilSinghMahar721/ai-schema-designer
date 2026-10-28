import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import { RegisterDtoZ } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { LoginDtoZ } from './dto/login.dto.js';
import type { DeleteAccountDto } from './dto/delete-account.dto.js';
import { DeleteAccountDtoZ } from './dto/delete-account.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CsrfGuard } from './csrf.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { SafeUser } from '../users/users.service.js';

@Controller('api/auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(
    @Body(new ZodValidationPipe(RegisterDtoZ)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body(new ZodValidationPipe(LoginDtoZ)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.authService.logout(res);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SafeUser) {
    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(DeleteAccountDtoZ)) dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.deleteAccount(user, dto, res);
  }
}
