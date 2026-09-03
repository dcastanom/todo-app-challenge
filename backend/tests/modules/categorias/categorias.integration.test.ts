import { like } from 'drizzle-orm';
import request from 'supertest';
import type { ApiResponse, CategoriaDTO } from '@todo/shared';
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

async function crear(token: string, body: Record<string, unknown>): Promise<CategoriaDTO> {
  const res = await request(app)
    .post('/api/v1/categorias')
    .set(...auth(token))
    .send(body)
    .expect(201);
  return (res.body as ApiResponse<CategoriaDTO>).data;
}

describe('categorias CRUD', () => {
  it('creates, lists, updates and deletes a category', async () => {
    const { token } = await registerUser(app);

    const cat = await crear(token, { nombre: 'Trabajo', color: '#3498db' });
    expect(cat.nombre).toBe('Trabajo');

    const list = await request(app)
      .get('/api/v1/categorias')
      .set(...auth(token))
      .expect(200);
    expect((list.body as ApiResponse<CategoriaDTO[]>).data).toHaveLength(1);

    const upd = await request(app)
      .put(`/api/v1/categorias/${cat.id}`)
      .set(...auth(token))
      .send({ nombre: 'Trabajo remoto', color: '#2ecc71' })
      .expect(200);
    expect((upd.body as ApiResponse<CategoriaDTO>).data.nombre).toBe('Trabajo remoto');

    await request(app)
      .delete(`/api/v1/categorias/${cat.id}`)
      .set(...auth(token))
      .expect(204);
    await request(app)
      .get('/api/v1/categorias')
      .set(...auth(token))
      .expect(200)
      .then((r) => expect((r.body as ApiResponse<CategoriaDTO[]>).data).toHaveLength(0));
  });

  it('rejects a duplicate name with 409', async () => {
    const { token } = await registerUser(app);
    await crear(token, { nombre: 'Personal' });
    const res = await request(app)
      .post('/api/v1/categorias')
      .set(...auth(token))
      .send({ nombre: 'Personal' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORIA_DUPLICADA');
  });

  it('allows reusing a name after the original is deleted', async () => {
    const { token } = await registerUser(app);
    const cat = await crear(token, { nombre: 'Efímera' });
    await request(app)
      .delete(`/api/v1/categorias/${cat.id}`)
      .set(...auth(token))
      .expect(204);
    await crear(token, { nombre: 'Efímera' });
  });

  it('rejects an invalid hex color with 422', async () => {
    const { token } = await registerUser(app);
    await request(app)
      .post('/api/v1/categorias')
      .set(...auth(token))
      .send({ nombre: 'X', color: 'blue' })
      .expect(422);
  });

  it('isolates categories per user', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);
    const cat = await crear(a.token, { nombre: 'De A' });

    await request(app)
      .get(`/api/v1/categorias/${cat.id}`)
      .set(...auth(b.token))
      .expect(404);
    await request(app)
      .put(`/api/v1/categorias/${cat.id}`)
      .set(...auth(b.token))
      .send({ nombre: 'hack' })
      .expect(404);
  });

  it('requires authentication', async () => {
    await request(app).get('/api/v1/categorias').expect(401);
  });
});
