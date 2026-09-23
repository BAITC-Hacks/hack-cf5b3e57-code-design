import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { HealthController } from '../src/health/health.controller';

describe('GET /api/v1/health (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = {
    MOCK: process.env.MOCK,
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    app = moduleRef.createNestApplication<INestApplication<App>>();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports a usable health response', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    const body = response.body as { ok: unknown; mock: unknown };
    expect(body.ok).toBe(true);
    expect(typeof body.mock).toBe('boolean');
  });

  it('reports mock mode when MOCK=1 even if an OpenAI key exists', async () => {
    process.env.MOCK = '1';
    process.env.OPENAI_API_KEY = 'test-key';
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect((response.body as { mock: unknown }).mock).toBe(true);
  });

  it('reports live mode with an OpenAI key', async () => {
    delete process.env.MOCK;
    delete process.env.NVIDIA_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect((response.body as { mock: unknown }).mock).toBe(false);
  });
});
