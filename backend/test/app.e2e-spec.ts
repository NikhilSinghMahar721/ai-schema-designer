import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.GEMINI_API_KEY = 'test-key-for-e2e';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterAll(async () => {
    await app.close();
  });
});
