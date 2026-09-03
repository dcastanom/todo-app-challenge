import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with an ok status envelope', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('todo-backend');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('is also reachable under the versioned API prefix', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('unknown routes', () => {
  it('returns a 404 error envelope', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
