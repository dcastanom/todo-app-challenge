import { like } from 'drizzle-orm';
import request from 'supertest';
import type { PaginatedResponse, TareaDTO } from '@todo/shared';
import { createApp } from '../../../src/app.js';
import { closeRedis } from '../../../src/config/redis.js';
import { db, pool } from '../../../src/db/client.js';
import { usuarios } from '../../../src/db/schema/index.js';
import { auth, registerUser } from '../../helpers/api.js';

const app = createApp();
let token: string;

const post = (path: string, body: Record<string, unknown>): request.Test =>
  request(app)
    .post(path)
    .set(...auth(token))
    .send(body);

async function id(path: string, body: Record<string, unknown>): Promise<string> {
  const res = await post(path, body).expect(201);
  return res.body.data.id as string;
}

const listar = async (qs: string): Promise<TareaDTO[]> => {
  const res = await request(app)
    .get(`/api/v1/tareas?${qs}`)
    .set(...auth(token))
    .expect(200);
  return (res.body as PaginatedResponse<TareaDTO>).data;
};

const ayer = new Date(Date.now() - 864e5).toISOString();
const manana = new Date(Date.now() + 864e5).toISOString();
const enUnaSemana = new Date(Date.now() + 7 * 864e5).toISOString();

beforeAll(async () => {
  token = (await registerUser(app)).token;
  const trabajo = await id('/api/v1/categorias', { nombre: 'Trabajo' });
  await id('/api/v1/categorias', { nombre: 'Casa' });
  const urgente = await id('/api/v1/etiquetas', { nombre: 'urgente' });
  const revisar = await id('/api/v1/etiquetas', { nombre: 'revisar' });

  await post('/api/v1/tareas', {
    titulo: 'Preparar informe trimestral',
    prioridad: 'alta',
    categoriaId: trabajo,
    etiquetaIds: [urgente],
    fechaVencimiento: manana,
  }).expect(201);

  const vencida = await id('/api/v1/tareas', {
    titulo: 'Llamar al banco',
    prioridad: 'urgente',
    etiquetaIds: [urgente, revisar],
    fechaVencimiento: ayer,
  });

  await post('/api/v1/tareas', {
    titulo: 'Comprar leche',
    prioridad: 'baja',
    fechaVencimiento: enUnaSemana,
  }).expect(201);

  const hecha = await id('/api/v1/tareas', { titulo: 'Regar plantas', prioridad: 'normal' });
  await request(app)
    .patch(`/api/v1/tareas/${hecha}/completar`)
    .set(...auth(token))
    .send({ completada: true })
    .expect(200);

  // keep a reference so lint doesn't flag it unused
  expect(vencida).toBeTruthy();
});

afterAll(async () => {
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('GET /api/v1/tareas — filtros', () => {
  it('filtra por estado de completado', async () => {
    expect((await listar('completada=true')).map((t) => t.titulo)).toEqual(['Regar plantas']);
    expect((await listar('completada=false')).length).toBe(3);
  });

  it('filtra por prioridad', async () => {
    expect((await listar('prioridad=urgente')).map((t) => t.titulo)).toEqual(['Llamar al banco']);
  });

  it('filtra por categoría y por "sin categoría"', async () => {
    const [porCat] = await listar('completada=false&prioridad=alta');
    const cat = porCat?.categoriaId ?? '';
    expect((await listar(`categoria=${cat}`)).map((t) => t.titulo)).toEqual([
      'Preparar informe trimestral',
    ]);
    expect((await listar('sinCategoria=true')).map((t) => t.titulo).sort()).toEqual(
      ['Comprar leche', 'Llamar al banco', 'Regar plantas'].sort(),
    );
  });

  it('filtra por etiquetas (OR por nombre)', async () => {
    expect((await listar('etiquetas=urgente')).length).toBe(2);
    expect((await listar('etiquetas=revisar')).map((t) => t.titulo)).toEqual(['Llamar al banco']);
    expect((await listar('etiquetas=urgente,revisar')).length).toBe(2);
  });

  it('filtra por rango de fecha de vencimiento', async () => {
    const desde = new Date(Date.now() - 2 * 864e5).toISOString();
    const hasta = new Date(Date.now() + 2 * 864e5).toISOString();
    const titulos = (await listar(`fechaDesde=${desde}&fechaHasta=${hasta}`)).map((t) => t.titulo);
    expect(titulos.sort()).toEqual(['Llamar al banco', 'Preparar informe trimestral'].sort());
  });

  it('filtra tareas vencidas', async () => {
    expect((await listar('vencidas=true')).map((t) => t.titulo)).toEqual(['Llamar al banco']);
  });

  it('busca en título y descripción', async () => {
    expect((await listar('busqueda=informe')).map((t) => t.titulo)).toEqual([
      'Preparar informe trimestral',
    ]);
    expect((await listar('busqueda=LECHE')).map((t) => t.titulo)).toEqual(['Comprar leche']);
    expect((await listar('busqueda=noexiste')).length).toBe(0);
  });

  it('combina filtros', async () => {
    const titulos = (await listar('completada=false&etiquetas=urgente&prioridad=urgente')).map(
      (t) => t.titulo,
    );
    expect(titulos).toEqual(['Llamar al banco']);
  });

  it('rechaza un valor de filtro inválido con 422', async () => {
    await request(app)
      .get('/api/v1/tareas?prioridad=altisima')
      .set(...auth(token))
      .expect(422);
  });

  it('refleja mutaciones inmediatamente (invalidación de caché)', async () => {
    const antes = (await listar('busqueda=cacheprobe')).length;
    expect(antes).toBe(0);
    await post('/api/v1/tareas', { titulo: 'cacheprobe item' }).expect(201);
    expect((await listar('busqueda=cacheprobe')).map((t) => t.titulo)).toEqual(['cacheprobe item']);
  });
});
