import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../../src/auth/auth.module.js';
import { UsersService } from '../../src/users/users.service.js';
import { ConfigModule } from '@nestjs/config';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { ZodValidationPipe } from '../../src/common/pipes/zod-validation.pipe.js';
import { hashPassword } from '../../src/auth/password.util.js';
import type { User } from '@prisma/client';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let usersDb: Map<string, User>;

  const mockUsersService = {
    findByEmail: vi.fn(async (email: string) => {
      const normalized = email.trim().toLowerCase();
      return usersDb.get(normalized) || null;
    }),
    findById: vi.fn(async (id: string) => {
      for (const user of usersDb.values()) {
        if (user.id === id) return user;
      }
      return null;
    }),
    create: vi.fn(
      async (data: { email: string; passwordHash: string }) => {
        const normalized = data.email.trim().toLowerCase();
        const newUser: User = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          email: normalized,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
        };
        usersDb.set(normalized, newUser);
        return newUser;
      },
    ),
    delete: vi.fn(async (id: string) => {
      for (const [email, user] of usersDb.entries()) {
        if (user.id === id) {
          usersDb.delete(email);
          return user;
        }
      }
      throw new Error('User not found');
    }),
  };

  const defaultPassword = 'validPassword123!';
  let seededUser: User;

  beforeEach(async () => {
    usersDb = new Map();
    vi.clearAllMocks();

    const hashedPassword = await hashPassword(defaultPassword);
    seededUser = {
      id: 'existing-user-uuid-1',
      email: 'existing@example.com',
      passwordHash: hashedPassword,
      createdAt: new Date(),
    };
    usersDb.set(seededUser.email, seededUser);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              CORS_ORIGIN: 'http://localhost:3000',
              JWT_SECRET: 'test_jwt_secret_at_least_32_characters_long_12345',
              JWT_EXPIRES_IN: '1h',
              COOKIE_SECURE: false,
              AUTH_RATE_LIMIT_MAX: 10,
            }),
          ],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(express.json({ limit: '256kb' }));
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a new user, sets session cookie, and returns safe user data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'strongPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) => c.startsWith('session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('SameSite=Lax');
      expect(sessionCookie).toContain('Path=/');
    });

    it('rejects registration with already registered email (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'EXISTING@example.com',
          password: 'strongPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already registered');
    });

    it('rejects password shorter than 10 characters (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('at least 10 characters');
    });

    it('rejects password longer than 128 characters (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'a'.repeat(129),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('at most 128 characters');
    });

    it('rejects unknown fields (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'validPassword123!',
          extraField: 'not allowed',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('successfully logs in with valid credentials and sets session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(seededUser.email);
      expect(res.body.user.id).toBe(seededUser.id);
      expect(res.body.user.passwordHash).toBeUndefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) => c.startsWith('session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
    });

    it('rejects invalid password with generic error message (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: seededUser.email,
          password: 'wrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects unknown email with identical generic error message (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'somePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user profile when session cookie is present', async () => {
      // First login to obtain cookie
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      const sessionCookie = loginRes.headers['set-cookie'][0];

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(seededUser.id);
      expect(res.body.user.email).toBe(seededUser.email);
    });

    it('returns 401 when no session cookie is provided', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Not authenticated');
    });

    it('returns 401 when session cookie is invalid or forged', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', 'session=invalid-jwt-token-content');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or expired session');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 204 and clears session cookie', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/logout');

      expect(res.status).toBe(204);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) => c.startsWith('session='));
      expect(sessionCookie).toBeDefined();
      // Clearing cookie sets expires in the past or empty value
      expect(sessionCookie).toMatch(/session=;|Expires=Thu, 01 Jan 1970/);
    });
  });

  describe('DELETE /api/auth/me', () => {
    it('deletes account with correct password confirmation', async () => {
      // Login first
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      const sessionCookie = loginRes.headers['set-cookie'][0];

      const res = await request(app.getHttpServer())
        .delete('/api/auth/me')
        .set('Cookie', sessionCookie)
        .send({
          password: defaultPassword,
        });

      expect(res.status).toBe(204);

      // Verify user deleted
      expect(usersDb.get(seededUser.email)).toBeUndefined();

      // Subsequent call to /me should fail
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);

      expect(meRes.status).toBe(401);
    });

    it('rejects account deletion when password confirmation fails (401)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      const sessionCookie = loginRes.headers['set-cookie'][0];

      const res = await request(app.getHttpServer())
        .delete('/api/auth/me')
        .set('Cookie', sessionCookie)
        .send({
          password: 'incorrectPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid password');
      expect(usersDb.get(seededUser.email)).toBeDefined();
    });
  });

  describe('CSRF protection (CsrfGuard)', () => {
    it('blocks request with foreign Origin header (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://malicious-attacker-site.com')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Cross-origin request blocked');
    });

    it('allows request with matching allowed Origin header', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: seededUser.email,
          password: defaultPassword,
        });

      expect(res.status).toBe(200);
    });

    it('blocks state-changing requests with non-JSON Content-Type (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test@example.com&password=password123!');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Content-Type must be application/json');
    });
  });
});
