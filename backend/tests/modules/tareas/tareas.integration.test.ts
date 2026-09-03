import { like } from 'drizzle-orm';
import request from 'supertest';
import type { ApiResponse, PaginatedResponse, TareaDTO } from '@todo/shared';
import { createApp } from '../../../src/app.js';
import { closeRedis } from '../../../src/config/redis.js';
import { db, pool } from '../../../src/db/client.js';
import { usuarios } from '../../../src/db/schema/index.js';

const app = createApp();
const rnd = (): string => Math.random().toString(36).slice(2, 10);

async function makeUser(): Promise<{ token: string; id: string }> {
  const id = rnd();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `authtest-t-${id}@example.com`, username: `tt_${id}`, password: 'Passw0rd!' })
    .expect(201);
  return {
    token: res.body.data.tokens.accessToken as string,
    id: res.body.data.usuario.id as string,
  };
}

const bearer = (t: string): [string, string] => ['Authorization', `Bearer ${t}`];

async function createTarea(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<TareaDTO> {
  const res = await request(app)
    .post('/api/v1/tareas')
    .set(...bearer(token))
    .send({ titulo: 'Tarea de prueba', ...overrides })
    .expect(201);
  return (res.body as ApiResponse<TareaDTO>).data;
}

afterAll(async () => {
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-t-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('POST /api/v1/tareas', () => {
  it('creates a task with defaults', async () => {
    const { token } = await makeUser();
    const tarea = await createTarea(token, { descripcion: 'algo' });

    expect(tarea.titulo).toBe('Tarea de prueba');
    expect(tarea.prioridad).toBe('normal');
    expect(tarea.completada).toBe(false);
    expect(tarea.completadaEn).toBeNull();
  });

  it('rejects a missing title with 422', async () => {
    const { token } = await makeUser();
    await request(app)
      .post('/api/v1/tareas')
      .set(...bearer(token))
      .send({})
      .expect(422);
  });

  it('rejects a categoriaId the user does not own with 422', async () => {
    const { token } = await makeUser();
    const res = await request(app)
      .post('/api/v1/tareas')
      .set(...bearer(token))
      .send({ titulo: 'x', categoriaId: '11111111-1111-1111-1111-111111111111' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CATEGORIA_INVALIDA');
  });

  it('requires authentication', async () => {
    await request(app).post('/api/v1/tareas').send({ titulo: 'x' }).expect(401);
  });
});

describe('GET /api/v1/tareas', () => {
  it('paginates and reports meta', async () => {
    const { token } = await makeUser();
    await createTarea(token, { titulo: 'A' });
    await createTarea(token, { titulo: 'B' });
    await createTarea(token, { titulo: 'C' });

    const page1 = await request(app)
      .get('/api/v1/tareas?limit=2&page=1')
      .set(...bearer(token))
      .expect(200);
    const body = page1.body as PaginatedResponse<TareaDTO>;
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(2);

    const page2 = await request(app)
      .get('/api/v1/tareas?limit=2&page=2')
      .set(...bearer(token))
      .expect(200);
    expect((page2.body as PaginatedResponse<TareaDTO>).data).toHaveLength(1);
  });

  it('only returns the caller’s own tasks', async () => {
    const a = await makeUser();
    const b = await makeUser();
    await createTarea(a.token, { titulo: 'de A' });

    const res = await request(app)
      .get('/api/v1/tareas')
      .set(...bearer(b.token))
      .expect(200);
    expect((res.body as PaginatedResponse<TareaDTO>).data).toHaveLength(0);
  });

  it('sorts by priority when asked', async () => {
    const { token } = await makeUser();
    await createTarea(token, { titulo: 'baja', prioridad: 'baja' });
    await createTarea(token, { titulo: 'urgente', prioridad: 'urgente' });

    const res = await request(app)
      .get('/api/v1/tareas?orden=prioridad&direccion=desc')
      .set(...bearer(token))
      .expect(200);
    expect((res.body as PaginatedResponse<TareaDTO>).data[0]?.prioridad).toBe('urgente');
  });
});

describe('GET /api/v1/tareas/:id', () => {
  it('returns a task by id', async () => {
    const { token } = await makeUser();
    const created = await createTarea(token);
    const res = await request(app)
      .get(`/api/v1/tareas/${created.id}`)
      .set(...bearer(token))
      .expect(200);
    expect((res.body as ApiResponse<TareaDTO>).data.id).toBe(created.id);
  });

  it('404s for another user’s task', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const tarea = await createTarea(a.token);
    await request(app)
      .get(`/api/v1/tareas/${tarea.id}`)
      .set(...bearer(b.token))
      .expect(404);
  });

  it('422s for a non-uuid id', async () => {
    const { token } = await makeUser();
    await request(app)
      .get('/api/v1/tareas/not-a-uuid')
      .set(...bearer(token))
      .expect(422);
  });
});

describe('PUT /api/v1/tareas/:id', () => {
  it('updates provided fields only', async () => {
    const { token } = await makeUser();
    const created = await createTarea(token, { descripcion: 'original' });

    const res = await request(app)
      .put(`/api/v1/tareas/${created.id}`)
      .set(...bearer(token))
      .send({ titulo: 'nuevo título' })
      .expect(200);

    const updated = (res.body as ApiResponse<TareaDTO>).data;
    expect(updated.titulo).toBe('nuevo título');
    expect(updated.descripcion).toBe('original');
  });

  it('404s when updating another user’s task', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const tarea = await createTarea(a.token);
    await request(app)
      .put(`/api/v1/tareas/${tarea.id}`)
      .set(...bearer(b.token))
      .send({ titulo: 'hack' })
      .expect(404);
  });
});

describe('PATCH /api/v1/tareas/:id/completar', () => {
  it('toggles completion when no body is sent', async () => {
    const { token } = await makeUser();
    const created = await createTarea(token);

    const done = await request(app)
      .patch(`/api/v1/tareas/${created.id}/completar`)
      .set(...bearer(token))
      .send({})
      .expect(200);
    expect((done.body as ApiResponse<TareaDTO>).data.completada).toBe(true);
    expect((done.body as ApiResponse<TareaDTO>).data.completadaEn).not.toBeNull();

    const undone = await request(app)
      .patch(`/api/v1/tareas/${created.id}/completar`)
      .set(...bearer(token))
      .send({})
      .expect(200);
    expect((undone.body as ApiResponse<TareaDTO>).data.completada).toBe(false);
    expect((undone.body as ApiResponse<TareaDTO>).data.completadaEn).toBeNull();
  });

  it('sets an explicit state when given one', async () => {
    const { token } = await makeUser();
    const created = await createTarea(token);
    const res = await request(app)
      .patch(`/api/v1/tareas/${created.id}/completar`)
      .set(...bearer(token))
      .send({ completada: true })
      .expect(200);
    expect((res.body as ApiResponse<TareaDTO>).data.completada).toBe(true);
  });
});

describe('DELETE /api/v1/tareas/:id', () => {
  it('soft-deletes so the task disappears from reads', async () => {
    const { token } = await makeUser();
    const created = await createTarea(token);

    await request(app)
      .delete(`/api/v1/tareas/${created.id}`)
      .set(...bearer(token))
      .expect(204);
    await request(app)
      .get(`/api/v1/tareas/${created.id}`)
      .set(...bearer(token))
      .expect(404);

    const list = await request(app)
      .get('/api/v1/tareas')
      .set(...bearer(token))
      .expect(200);
    expect((list.body as PaginatedResponse<TareaDTO>).data).toHaveLength(0);
  });

  it('404s deleting another user’s task', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const tarea = await createTarea(a.token);
    await request(app)
      .delete(`/api/v1/tareas/${tarea.id}`)
      .set(...bearer(b.token))
      .expect(404);
  });
});
