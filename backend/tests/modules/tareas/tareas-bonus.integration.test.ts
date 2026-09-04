import { like } from 'drizzle-orm';
import request from 'supertest';
import type { ApiResponse, BatchResultado, PaginatedResponse, TareaDTO } from '@todo/shared';
import { createApp } from '../../../src/app.js';
import { closeRedis } from '../../../src/config/redis.js';
import { db, pool } from '../../../src/db/client.js';
import { usuarios } from '../../../src/db/schema/index.js';

const app = createApp();
const rnd = (): string => Math.random().toString(36).slice(2, 10);
const bearer = (t: string): [string, string] => ['Authorization', `Bearer ${t}`];

async function makeUser(): Promise<string> {
  const id = rnd();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `authtest-b8-${id}@example.com`, username: `b8_${id}`, password: 'Passw0rd!' })
    .expect(201);
  return res.body.data.tokens.accessToken as string;
}

async function createTarea(token: string, over: Record<string, unknown> = {}): Promise<TareaDTO> {
  const res = await request(app)
    .post('/api/v1/tareas')
    .set(...bearer(token))
    .send({ titulo: 'Tarea', ...over })
    .expect(201);
  return (res.body as ApiResponse<TareaDTO>).data;
}

afterAll(async () => {
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-b8-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('PATCH /api/v1/tareas/reorder', () => {
  it('persists a manual order visible with orden=posicion', async () => {
    const token = await makeUser();
    const a = await createTarea(token, { titulo: 'A' });
    const b = await createTarea(token, { titulo: 'B' });
    const c = await createTarea(token, { titulo: 'C' });

    await request(app)
      .patch('/api/v1/tareas/reorder')
      .set(...bearer(token))
      .send({ ids: [c.id, a.id, b.id] })
      .expect(204);

    const res = await request(app)
      .get('/api/v1/tareas?orden=posicion&direccion=asc')
      .set(...bearer(token))
      .expect(200);
    expect((res.body as PaginatedResponse<TareaDTO>).data.map((t) => t.titulo)).toEqual([
      'C',
      'A',
      'B',
    ]);
  });

  it('404s when an id is not owned', async () => {
    const token = await makeUser();
    const other = await makeUser();
    const mine = await createTarea(token);
    const theirs = await createTarea(other);

    await request(app)
      .patch('/api/v1/tareas/reorder')
      .set(...bearer(token))
      .send({ ids: [mine.id, theirs.id] })
      .expect(404);
  });
});

describe('PATCH /api/v1/tareas/batch', () => {
  it('completes many tasks at once', async () => {
    const token = await makeUser();
    const a = await createTarea(token);
    const b = await createTarea(token);

    const res = await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({ ids: [a.id, b.id], accion: { tipo: 'completar', completada: true } })
      .expect(200);
    expect((res.body as ApiResponse<BatchResultado>).data.afectadas).toBe(2);

    const list = await request(app)
      .get('/api/v1/tareas?completada=true')
      .set(...bearer(token))
      .expect(200);
    expect((list.body as PaginatedResponse<TareaDTO>).data).toHaveLength(2);
  });

  it('sets a priority on many tasks', async () => {
    const token = await makeUser();
    const a = await createTarea(token);
    const b = await createTarea(token);

    const res = await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({ ids: [a.id, b.id], accion: { tipo: 'prioridad', prioridad: 'urgente' } })
      .expect(200);
    expect((res.body as ApiResponse<BatchResultado>).data.afectadas).toBe(2);

    const list = await request(app)
      .get('/api/v1/tareas?prioridad=urgente')
      .set(...bearer(token))
      .expect(200);
    expect((list.body as PaginatedResponse<TareaDTO>).data).toHaveLength(2);
  });

  it('moves many tasks to one of the caller’s categories', async () => {
    const token = await makeUser();
    const a = await createTarea(token);
    const cat = await request(app)
      .post('/api/v1/categorias')
      .set(...bearer(token))
      .send({ nombre: 'Destino' })
      .expect(201);

    await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({ ids: [a.id], accion: { tipo: 'categoria', categoriaId: cat.body.data.id as string } })
      .expect(200);

    const got = await request(app)
      .get(`/api/v1/tareas/${a.id}`)
      .set(...bearer(token))
      .expect(200);
    expect((got.body as ApiResponse<TareaDTO>).data.categoria?.nombre).toBe('Destino');
  });

  it('soft-deletes many tasks', async () => {
    const token = await makeUser();
    const a = await createTarea(token);
    const b = await createTarea(token);

    await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({ ids: [a.id, b.id], accion: { tipo: 'eliminar' } })
      .expect(200);

    const list = await request(app)
      .get('/api/v1/tareas')
      .set(...bearer(token))
      .expect(200);
    expect((list.body as PaginatedResponse<TareaDTO>).data).toHaveLength(0);
  });

  it('rejects a foreign category with 422', async () => {
    const token = await makeUser();
    const other = await makeUser();
    const a = await createTarea(token);
    const foreignCat = await request(app)
      .post('/api/v1/categorias')
      .set(...bearer(other))
      .send({ nombre: 'de otro' })
      .expect(201);

    await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({
        ids: [a.id],
        accion: { tipo: 'categoria', categoriaId: foreignCat.body.data.id as string },
      })
      .expect(422);
  });

  it('404s when any id is not owned', async () => {
    const token = await makeUser();
    const other = await makeUser();
    const theirs = await createTarea(other);
    await request(app)
      .patch('/api/v1/tareas/batch')
      .set(...bearer(token))
      .send({ ids: [theirs.id], accion: { tipo: 'completar', completada: true } })
      .expect(404);
  });
});

describe('GET /api/v1/tareas/export', () => {
  it('exports CSV honouring the filters', async () => {
    const token = await makeUser();
    await createTarea(token, { titulo: 'Urgente', prioridad: 'urgente' });
    await createTarea(token, { titulo: 'Normal', prioridad: 'normal' });

    const res = await request(app)
      .get('/api/v1/tareas/export?formato=csv&prioridad=urgente')
      .set(...bearer(token))
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="tareas-/);
    // Browsers can only read Content-Disposition cross-origin when it is exposed.
    expect(res.headers['access-control-expose-headers']).toMatch(/content-disposition/i);
    const lines = res.text.trim().split('\r\n');
    expect(lines).toHaveLength(2); // header + 1 match
    expect(lines[1]).toContain('Urgente');
  });

  it('exports JSON', async () => {
    const token = await makeUser();
    await createTarea(token, { titulo: 'Solo una' });
    const res = await request(app)
      .get('/api/v1/tareas/export?formato=json')
      .set(...bearer(token))
      .expect(200);
    const body = res.body as { total: number; tareas: TareaDTO[] };
    expect(body.total).toBe(1);
    expect(body.tareas[0]?.titulo).toBe('Solo una');
  });

  it('requires authentication', async () => {
    await request(app).get('/api/v1/tareas/export').expect(401);
  });
});
