import request from 'supertest';
import { createApp } from '../../src/app.js';
import { openapiSpec } from '../../src/docs/openapi.js';

const app = createApp();

describe('API docs', () => {
  it('serves the OpenAPI spec as JSON', async () => {
    const res = await request(app).get('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe('Todo App API');
    const paths = Object.keys(res.body.paths as Record<string, unknown>);
    expect(paths).toEqual(expect.arrayContaining(['/tareas', '/auth/login']));
  });

  it('serves Swagger UI HTML with a docs-friendly CSP', async () => {
    const res = await request(app).get('/api/v1/docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
    expect(res.headers['content-security-policy']).toContain('cdnjs.cloudflare.com');
  });

  it('redirects /api/docs to the versioned path', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/api/v1/docs');
  });

  it('documents every mandatory bonus endpoint', () => {
    for (const path of ['/tareas/export', '/tareas/reorder', '/tareas/batch']) {
      expect(openapiSpec.paths).toHaveProperty([path]);
    }
  });
});
