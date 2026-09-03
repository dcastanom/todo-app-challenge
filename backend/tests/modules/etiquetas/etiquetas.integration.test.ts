import { like } from 'drizzle-orm';
import request from 'supertest';
import type { ApiResponse, EtiquetaDTO } from '@todo/shared';
import { createApp } from '../../../src/app.js';
import { closeRedis } from '../../../src/config/redis.js';
import { db, pool } from '../../../src/db/client.js';
import { usuarios } from '../../../src/db/schema/index.js';
import { auth, registerUser } from '../../helpers/api.js';

const app = createApp();

afterAll(async () => {
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('etiquetas CRUD', () => {
  it('creates, lists, updates and deletes a tag', async () => {
    const { token } = await registerUser(app);

    const res = await request(app)
      .post('/api/v1/etiquetas')
      .set(...auth(token))
      .send({ nombre: 'urgente', color: '#c0392b' })
      .expect(201);
    const tag = (res.body as ApiResponse<EtiquetaDTO>).data;
    expect(tag.nombre).toBe('urgente');

    await request(app)
      .put(`/api/v1/etiquetas/${tag.id}`)
      .set(...auth(token))
      .send({ color: '#e74c3c' })
      .expect(200)
      .then((r) => expect((r.body as ApiResponse<EtiquetaDTO>).data.color).toBe('#e74c3c'));

    await request(app)
      .delete(`/api/v1/etiquetas/${tag.id}`)
      .set(...auth(token))
      .expect(204);
    await request(app)
      .get('/api/v1/etiquetas')
      .set(...auth(token))
      .expect(200)
      .then((r) => expect((r.body as ApiResponse<EtiquetaDTO[]>).data).toHaveLength(0));
  });

  it('rejects a duplicate name with 409', async () => {
    const { token } = await registerUser(app);
    await request(app)
      .post('/api/v1/etiquetas')
      .set(...auth(token))
      .send({ nombre: 'dup' })
      .expect(201);
    await request(app)
      .post('/api/v1/etiquetas')
      .set(...auth(token))
      .send({ nombre: 'dup' })
      .expect(409);
  });

  it('rejects an invalid name with 422', async () => {
    const { token } = await registerUser(app);
    await request(app)
      .post('/api/v1/etiquetas')
      .set(...auth(token))
      .send({ nombre: '  ' })
      .expect(422);
  });

  it('isolates tags per user', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);
    const res = await request(app)
      .post('/api/v1/etiquetas')
      .set(...auth(a.token))
      .send({ nombre: 'de-a' })
      .expect(201);
    const tag = (res.body as ApiResponse<EtiquetaDTO>).data;
    await request(app)
      .get(`/api/v1/etiquetas/${tag.id}`)
      .set(...auth(b.token))
      .expect(404);
  });
});
