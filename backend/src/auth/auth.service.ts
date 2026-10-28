import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, type SafeUser } from '../users/users.service.js';
import {
  hashPassword,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
} from './password.util.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { DeleteAccountDto } from './dto/delete-account.dto.js';
import type { Response, CookieOptions } from 'express';

function parseExpiresInMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 3600 * 1000;
    case 'd':
      return amount * 24 * 3600 * 1000;
    default:
      return 3600 * 1000;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getSessionCookieOptions(): CookieOptions {
    const isSecure = this.configService.get<boolean>('COOKIE_SECURE', false);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: parseExpiresInMs(expiresIn),
    };
  }

  async register(
    dto: RegisterDto,
    res: Response,
  ): Promise<{ user: { id: string; email: string } }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      { algorithm: 'HS256' },
    );

    res.cookie('session', token, this.getSessionCookieOptions());

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(
    dto: LoginDto,
    res: Response,
  ): Promise<{ user: { id: string; email: string } }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // Execute dummy verify to protect against timing-based user enumeration (V21)
      await verifyPassword(DUMMY_PASSWORD_HASH, dto.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await verifyPassword(user.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      { algorithm: 'HS256' },
    );

    res.cookie('session', token, this.getSessionCookieOptions());

    return {
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  logout(res: Response): void {
    const isSecure = this.configService.get<boolean>('COOKIE_SECURE', false);
    res.clearCookie('session', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });
  }

  async deleteAccount(
    currentUser: SafeUser,
    dto: DeleteAccountDto,
    res: Response,
  ): Promise<void> {
    const fullUser = await this.usersService.findById(currentUser.id);
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await verifyPassword(fullUser.passwordHash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersService.delete(currentUser.id);
    this.logout(res);
  }
}
