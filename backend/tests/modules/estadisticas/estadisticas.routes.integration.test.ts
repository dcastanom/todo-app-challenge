import { like } from 'drizzle-orm';
import request from 'supertest';
import type { ApiResponse, CategoriaDTO, EstadisticasDTO, TareaDTO } from '@todo/shared';
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
    .send({
      email: `authtest-stats-${id}@example.com`,
      username: `stats_${id}`,
      password: 'Passw0rd!',
    })
    .expect(201);
  return res.body.data.tokens.accessToken as string;
}

async function createCategoria(token: string, nombre: string): Promise<CategoriaDTO> {
  const res = await request(app)
    .post('/api/v1/categorias')
    .set(...bearer(token))
    .send({ nombre, color: '#336699' })
    .expect(201);
  return (res.body as ApiResponse<CategoriaDTO>).data;
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
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-stats-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('GET /api/v1/estadisticas', () => {
  it('requires auth', async () => {
    await request(app).get('/api/v1/estadisticas').expect(401);
  });

  it('aggregates totals, priority, category and daily activity for the caller only', async () => {
    const token = await makeUser();
    const otherToken = await makeUser();
    const categoria = await createCategoria(token, 'Trabajo');

    const urgente = await createTarea(token, { titulo: 'U', prioridad: 'urgente' });
    await createTarea(token, { titulo: 'N1', prioridad: 'normal', categoriaId: categoria.id });
    await createTarea(token, { titulo: 'N2', prioridad: 'normal', categoriaId: categoria.id });
    await createTarea(otherToken, { titulo: 'Otro usuario', prioridad: 'urgente' });

    await request(app)
      .patch(`/api/v1/tareas/${urgente.id}/completar`)
      .set(...bearer(token))
      .send({ completada: true })
      .expect(200);

    const res = await request(app)
      .get('/api/v1/estadisticas')
      .set(...bearer(token))
      .expect(200);
    const data = (res.body as ApiResponse<EstadisticasDTO>).data;

    expect(data.total).toBe(3);
    expect(data.completadas).toBe(1);
    expect(data.pendientes).toBe(2);
    expect(data.tasaCompletado).toBeCloseTo(1 / 3);

    const urgentBucket = data.porPrioridad.find((p) => p.prioridad === 'urgente');
    expect(urgentBucket).toEqual({ prioridad: 'urgente', total: 1, completadas: 1 });
    const normalBucket = data.porPrioridad.find((p) => p.prioridad === 'normal');
    expect(normalBucket).toEqual({ prioridad: 'normal', total: 2, completadas: 0 });

    const categoriaBucket = data.porCategoria.find((c) => c.categoriaId === categoria.id);
    expect(categoriaBucket).toMatchObject({ nombre: 'Trabajo', total: 2, completadas: 0 });
    const sinCategoria = data.porCategoria.find((c) => c.categoriaId === null);
    expect(sinCategoria).toMatchObject({ nombre: 'Sin categoría', total: 1, completadas: 1 });

    // Today is always the last entry in the (default 14-day) activity window.
    expect(data.actividad).toHaveLength(14);
    const hoy = data.actividad.at(-1)!;
    expect(hoy.fecha).toBe(new Date().toISOString().slice(0, 10));
    expect(hoy.creadas).toBe(3);
    expect(hoy.completadas).toBe(1);
  });

  it('validates the `dias` window (7-90)', async () => {
    const token = await makeUser();
    await request(app)
      .get('/api/v1/estadisticas?dias=3')
      .set(...bearer(token))
      .expect(422);

    const res = await request(app)
      .get('/api/v1/estadisticas?dias=30')
      .set(...bearer(token))
      .expect(200);
    expect((res.body as ApiResponse<EstadisticasDTO>).data.actividad).toHaveLength(30);
  });
});
