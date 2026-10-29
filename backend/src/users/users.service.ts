import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { LocalStorageService } from '../database/local-storage.service.js';
import type { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly localStorage?: LocalStorageService,
  ) {}

  private get useLocal(): boolean {
    return (
      (this.prisma.isConnected === false || !this.prisma.user) &&
      !!this.localStorage
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.useLocal && this.localStorage) {
      return this.localStorage.users.findByEmail(normalizedEmail);
    }
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  async findById(id: string): Promise<User | null> {
    if (this.useLocal && this.localStorage) {
      return this.localStorage.users.findById(id);
    }
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (this.useLocal && this.localStorage) {
      return this.localStorage.users.create({
        email: normalizedEmail,
        passwordHash: data.passwordHash,
      });
    }
    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: data.passwordHash,
      },
    });
  }

  async delete(id: string): Promise<User> {
    if (this.useLocal && this.localStorage) {
      return this.localStorage.users.delete(id);
    }
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
