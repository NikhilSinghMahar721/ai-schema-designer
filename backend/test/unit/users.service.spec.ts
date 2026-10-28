import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService, toSafeUser } from '../../src/users/users.service.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import type { User } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  const sampleUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
    createdAt: new Date('2026-10-28T12:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new UsersService(mockPrisma as unknown as PrismaService);
  });

  describe('findByEmail', () => {
    it('normalizes email (lowercases and trims) before query', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      const result = await service.findByEmail('  Test@Example.COM  ');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(sampleUser);
    });

    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('queries user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(sampleUser);

      const result = await service.findById(sampleUser.id);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: sampleUser.id },
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('create', () => {
    it('normalizes email and persists user with passwordHash', async () => {
      mockPrisma.user.create.mockResolvedValue(sampleUser);

      const result = await service.create({
        email: '  Test@Example.COM  ',
        passwordHash: sampleUser.passwordHash,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: sampleUser.passwordHash,
        },
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('delete', () => {
    it('deletes user by id', async () => {
      mockPrisma.user.delete.mockResolvedValue(sampleUser);

      const result = await service.delete(sampleUser.id);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: sampleUser.id },
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('toSafeUser', () => {
    it('strips passwordHash from the user object', () => {
      const safe = toSafeUser(sampleUser);
      expect(safe).toEqual({
        id: sampleUser.id,
        email: sampleUser.email,
        createdAt: sampleUser.createdAt,
      });
      expect((safe as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });
});
