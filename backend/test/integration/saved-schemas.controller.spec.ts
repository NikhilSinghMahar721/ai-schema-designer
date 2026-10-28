import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { SavedSchemasModule } from '../../src/saved-schemas/saved-schemas.module.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import { UsersService } from '../../src/users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { ZodValidationPipe } from '../../src/common/pipes/zod-validation.pipe.js';
import { validMinimal } from '../fixtures/schemas.js';
import type { User } from '@prisma/client';

describe('SavedSchemasController (integration & IDOR)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const userA: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'usera@example.com',
    passwordHash: '$argon2id$v=19$somehash1',
    createdAt: new Date(),
  };

  const userB: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'userb@example.com',
    passwordHash: '$argon2id$v=19$somehash2',
    createdAt: new Date(),
  };

  interface StoredSavedSchema {
    id: string;
    userId: string;
    name: string;
    dialect: string;
    schemaJson: any;
    createdAt: Date;
    updatedAt: Date;
  }

  let dbSchemas: StoredSavedSchema[];

  const mockUsersService = {
    findById: vi.fn(async (id: string) => {
      if (id === userA.id) return userA;
      if (id === userB.id) return userB;
      return null;
    }),
  };

  const mockPrismaService = {
    savedSchema: {
      findMany: vi.fn(async (args: { where: { userId: string } }) => {
        return dbSchemas
          .filter((s) => s.userId === args.where.userId)
          .map((s) => ({
            id: s.id,
            name: s.name,
            dialect: s.dialect,
            updatedAt: s.updatedAt,
          }));
      }),
      findFirst: vi.fn(
        async (args: { where: { id: string; userId: string } }) => {
          return (
            dbSchemas.find(
              (s) =>
                s.id === args.where.id && s.userId === args.where.userId,
            ) || null
          );
        },
      ),
      count: vi.fn(async (args: { where: { userId: string } }) => {
        return dbSchemas.filter((s) => s.userId === args.where.userId).length;
      }),
      create: vi.fn(async (args: { data: any }) => {
        const newRecord: StoredSavedSchema = {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          userId: args.data.userId,
          name: args.data.name,
          dialect: args.data.dialect,
          schemaJson: args.data.schemaJson,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbSchemas.push(newRecord);
        return newRecord;
      }),
      update: vi.fn(async (args: { where: { id: string }; data: any }) => {
        const idx = dbSchemas.findIndex((s) => s.id === args.where.id);
        if (idx === -1) throw new Error('Not found');
        const updated = {
          ...dbSchemas[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        dbSchemas[idx] = updated;
        return updated;
      }),
      delete: vi.fn(async (args: { where: { id: string } }) => {
        const idx = dbSchemas.findIndex((s) => s.id === args.where.id);
        if (idx === -1) throw new Error('Not found');
        const deleted = dbSchemas[idx];
        dbSchemas.splice(idx, 1);
        return deleted;
      }),
    },
  };

  let userACookie: string;
  let userBCookie: string;

  beforeEach(async () => {
    dbSchemas = [];
    vi.clearAllMocks();

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
        SavedSchemasModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(express.json({ limit: '256kb' }));
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Generate valid session cookies
    const tokenA = await jwtService.signAsync(
      { sub: userA.id },
      { algorithm: 'HS256' },
    );
    userACookie = `session=${tokenA}`;

    const tokenB = await jwtService.signAsync(
      { sub: userB.id },
      { algorithm: 'HS256' },
    );
    userBCookie = `session=${tokenB}`;

    // Seed one schema belonging to User A
    dbSchemas.push({
      id: '33333333-3333-3333-3333-333333333333',
      userId: userA.id,
      name: "User A's Schema",
      dialect: 'postgresql',
      schemaJson: validMinimal,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Unauthenticated access (401)', () => {
    it('rejects GET /api/saved-schemas without cookie', async () => {
      const res = await request(app.getHttpServer()).get('/api/saved-schemas');
      expect(res.status).toBe(401);
    });

    it('rejects POST /api/saved-schemas without cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .send({
          name: 'Test',
          dialect: 'postgresql',
          schema: validMinimal,
        });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/saved-schemas (list)', () => {
    it('returns only schemas belonging to authenticated user', async () => {
      // User A should see 1 item
      const resA = await request(app.getHttpServer())
        .get('/api/saved-schemas')
        .set('Cookie', userACookie);

      expect(resA.status).toBe(200);
      expect(resA.body.items).toHaveLength(1);
      expect(resA.body.items[0].name).toBe("User A's Schema");

      // User B should see 0 items
      const resB = await request(app.getHttpServer())
        .get('/api/saved-schemas')
        .set('Cookie', userBCookie);

      expect(resB.status).toBe(200);
      expect(resB.body.items).toHaveLength(0);
    });
  });

  describe('POST /api/saved-schemas (create)', () => {
    it('creates a new schema for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .set('Cookie', userBCookie)
        .send({
          name: 'My New Database',
          dialect: 'postgresql',
          schema: validMinimal,
        });

      expect(res.status).toBe(201);
      expect(res.body.item.name).toBe('My New Database');
      expect(res.body.item.schema).toEqual(validMinimal);
    });

    it('rejects attempts to inject userId in body (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .set('Cookie', userBCookie)
        .send({
          name: 'Hacked Schema',
          dialect: 'postgresql',
          schema: validMinimal,
          userId: userA.id, // Forbidden field
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('enforces limit of 50 schemas per user (409 Conflict)', async () => {
      // Fill user A's count to 50
      mockPrismaService.savedSchema.count.mockResolvedValueOnce(50);

      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .set('Cookie', userACookie)
        .send({
          name: 'Schema 51',
          dialect: 'postgresql',
          schema: validMinimal,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('limit of 50 saved schemas reached');
    });

    it('rejects payload exceeding 200 KB size limit (413 Payload Too Large)', async () => {
      // Create a schema that is ~210 KB (between 200 KB schema limit and 256 KB express body limit)
      const bigColumns = Array.from({ length: 35 }, (_, i) => ({
        id: `c_tbl_col_${i}`,
        name: `col_${i}`,
        type: 'VARCHAR' as const,
        length: 500,
        primaryKey: i === 0,
        nullable: i !== 0,
        unique: i === 0,
        defaultValue: 'd'.repeat(180),
      }));

      const hugeSchema = {
        tables: Array.from({ length: 20 }, (_, ti) => ({
          id: `t_table_${ti}`,
          name: `table_${ti}`,
          columns: bigColumns,
        })),
        relationships: [],
      };

      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .set('Cookie', userACookie)
        .send({
          name: 'Huge Schema',
          dialect: 'postgresql',
          schema: hugeSchema,
        });

      expect(res.status).toBe(413);
      expect(res.body.error.message).toContain('exceeds maximum allowed size of 200 KB');
    });

    it('rejects semantically invalid schema (400 Bad Request)', async () => {
      const invalidSemantics = {
        tables: [
          {
            id: 't_table1',
            name: 'table1',
            columns: [
              {
                id: 'c_col1',
                name: 'col1',
                type: 'INTEGER',
                primaryKey: false, // No primary key!
                nullable: false,
                unique: false,
              },
            ],
          },
        ],
        relationships: [],
      };

      const res = await request(app.getHttpServer())
        .post('/api/saved-schemas')
        .set('Cookie', userACookie)
        .send({
          name: 'Invalid Schema',
          dialect: 'postgresql',
          schema: invalidSemantics,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('primary key');
    });
  });

  describe('IDOR Protection on GET /api/saved-schemas/:id', () => {
    it('allows User A to view their own schema', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.item.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(res.body.item.name).toBe("User A's Schema");
    });

    it("returns 404 when User B tries to view User A's schema (IDOR blocked)", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Saved schema not found');
    });

    it('returns 404 for invalid non-UUID IDs without DB lookup', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/saved-schemas/invalid-uuid-string')
        .set('Cookie', userACookie);

      expect(res.status).toBe(404);
      expect(mockPrismaService.savedSchema.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('IDOR Protection on PUT /api/saved-schemas/:id', () => {
    it('allows User A to update their own schema name', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userACookie)
        .send({
          name: 'Renamed Schema',
        });

      expect(res.status).toBe(200);
      expect(res.body.item.name).toBe('Renamed Schema');
    });

    it("returns 404 when User B tries to update User A's schema (IDOR blocked)", async () => {
      const res = await request(app.getHttpServer())
        .put('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userBCookie)
        .send({
          name: "User B Hacked User A's Schema",
        });

      expect(res.status).toBe(404);
    });

    it('rejects empty update body (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userACookie)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('IDOR Protection on DELETE /api/saved-schemas/:id', () => {
    it("returns 404 when User B tries to delete User A's schema (IDOR blocked)", async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
      expect(dbSchemas).toHaveLength(1);
    });

    it('allows User A to delete their own schema (204 No Content)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/saved-schemas/33333333-3333-3333-3333-333333333333')
        .set('Cookie', userACookie);

      expect(res.status).toBe(204);
      expect(dbSchemas).toHaveLength(0);
    });
  });
});
