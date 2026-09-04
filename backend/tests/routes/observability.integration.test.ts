import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeRedis } from '../../src/config/redis.js';
import { pool } from '../../src/db/client.js';

const app = createApp();

afterAll(async () => {
  await pool.end();
  await closeRedis();
});

describe('GET /health/ready', () => {
  it('reports both dependencies up when Postgres and Redis are reachable', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ready', postgres: 'up', redis: 'up' });
  });
});

describe('GET /metrics (integration)', () => {
  it('is served and counts real requests', async () => {
    await request(app).get('/api/v1/health');
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_request_duration_seconds_count');
  });
});
