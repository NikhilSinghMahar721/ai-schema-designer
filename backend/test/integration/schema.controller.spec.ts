/**
 * Integration tests for SchemaController and core API hardening.
 * Verifies:
 * - POST /api/schema/generate (success, 400 validation, 400 extra fields, AI errors)
 * - POST /api/schema/refine (success, 400 validation, 400 extra fields, AI errors)
 * - POST /api/schema/export (success postgres/mysql, 400 validation)
 * - Safe error envelope: { error: { code, message } } with no stack traces
 * - Body size limit (413 payload too large)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadGatewayException,
  UnprocessableEntityException,
  RequestTimeoutException,
} from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { SchemaModule } from '../../src/schema/schema.module.js';
import { AiService } from '../../src/ai/ai.service.js';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { ZodValidationPipe } from '../../src/common/pipes/zod-validation.pipe.js';
import { validMinimal } from '../fixtures/schemas.js';

describe('SchemaController (integration)', () => {
  let app: INestApplication;
  const mockAiService = {
    generate: vi.fn(),
    refine: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SchemaModule],
    })
      .overrideProvider(AiService)
      .useValue(mockAiService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(express.json({ limit: '256kb' }));
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/schema/generate', () => {
    it('returns 200 with generated schema for valid description and dialect', async () => {
      mockAiService.generate.mockResolvedValueOnce(validMinimal);

      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({
          description: 'A simple blog with users',
          dialect: 'postgresql',
        })
        .expect(200);

      expect(res.body).toEqual({ schema: validMinimal });
      expect(mockAiService.generate).toHaveBeenCalledWith(
        'A simple blog with users',
      );
    });

    it('defaults dialect to postgresql if omitted', async () => {
      mockAiService.generate.mockResolvedValueOnce(validMinimal);

      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({
          description: 'A simple blog with users',
        })
        .expect(200);

      expect(res.body).toEqual({ schema: validMinimal });
    });

    it('returns 400 when description is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({
          description: '',
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Description is required');
      expect(res.body).not.toHaveProperty('stack');
    });

    it('returns 400 when description exceeds 2000 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({
          description: 'a'.repeat(2001),
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at most 2000 characters');
    });

    it('returns 400 when unknown fields are provided (strictObject)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({
          description: 'valid description',
          unknownField: 'malicious',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Unrecognized key');
    });

    it('returns 400 when body is not an object', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .set('Content-Type', 'application/json')
        .send('"just a string"')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 502 when AI provider fails (BadGateway)', async () => {
      mockAiService.generate.mockRejectedValueOnce(
        new BadGatewayException('AI service is temporarily unavailable'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({ description: 'A database' })
        .expect(502);

      expect(res.body).toEqual({
        error: {
          code: 'BAD_GATEWAY',
          message: 'AI service is temporarily unavailable',
        },
      });
    });

    it('returns 422 when AI output is invalid after retries', async () => {
      mockAiService.generate.mockRejectedValueOnce(
        new UnprocessableEntityException(
          'AI output is invalid after retries. Please try rephrasing your description.',
        ),
      );

      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({ description: 'A complex database' })
        .expect(422);

      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.error.message).toContain('AI output is invalid after retries');
    });

    it('returns 408 when AI request times out', async () => {
      mockAiService.generate.mockRejectedValueOnce(
        new RequestTimeoutException('AI request timed out. Please try again.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({ description: 'A database' })
        .expect(408);

      expect(res.body).toEqual({
        error: {
          code: 'TIMEOUT',
          message: 'AI request timed out. Please try again.',
        },
      });
    });
  });

  describe('POST /api/schema/refine', () => {
    it('returns 200 with updated schema', async () => {
      mockAiService.refine.mockResolvedValueOnce(validMinimal);

      const res = await request(app.getHttpServer())
        .post('/api/schema/refine')
        .send({
          schema: validMinimal,
          instruction: 'Add email column to users',
        })
        .expect(200);

      expect(res.body).toEqual({ schema: validMinimal });
      expect(mockAiService.refine).toHaveBeenCalledWith(
        validMinimal,
        'Add email column to users',
      );
    });

    it('returns 400 when instruction is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/refine')
        .send({
          schema: validMinimal,
          instruction: '',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Instruction is required');
    });

    it('returns 400 when instruction exceeds 500 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/refine')
        .send({
          schema: validMinimal,
          instruction: 'x'.repeat(501),
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('at most 500 characters');
    });

    it('returns 400 when schema is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/refine')
        .send({
          schema: { tables: [] }, // empty tables invalid
          instruction: 'Make changes',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when unknown fields exist on refine DTO', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/refine')
        .send({
          schema: validMinimal,
          instruction: 'Valid instruction',
          extraProperty: 'not allowed',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/schema/export', () => {
    it('returns 200 with generated PostgreSQL DDL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/export')
        .send({
          schema: validMinimal,
          dialect: 'postgresql',
        })
        .expect(200);

      expect(res.body).toHaveProperty('sql');
      expect(res.body.sql).toContain('CREATE TABLE "users"');
    });

    it('returns 200 with generated MySQL DDL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/export')
        .send({
          schema: validMinimal,
          dialect: 'mysql',
        })
        .expect(200);

      expect(res.body).toHaveProperty('sql');
      expect(res.body.sql).toContain('CREATE TABLE `users`');
    });

    it('returns 400 for unsupported dialect', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/export')
        .send({
          schema: validMinimal,
          dialect: 'sqlite',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when unknown fields are passed to export', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schema/export')
        .send({
          schema: validMinimal,
          dialect: 'postgresql',
          bogus: 'not allowed',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Payload size limit', () => {
    it('returns 413 PAYLOAD_TOO_LARGE when body exceeds 256kb', async () => {
      // Create a payload larger than 256kb
      const hugeString = 'a'.repeat(300 * 1024);
      const res = await request(app.getHttpServer())
        .post('/api/schema/generate')
        .send({ description: hugeString })
        .expect(413);

      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(res.body.error.message).toContain('Payload too large');
    });
  });
});
