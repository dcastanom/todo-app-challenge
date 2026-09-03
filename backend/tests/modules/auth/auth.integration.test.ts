import { like } from 'drizzle-orm';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import { db, pool } from '../../../src/db/client.js';
import { closeRedis } from '../../../src/config/redis.js';
import { usuarios } from '../../../src/db/schema/index.js';

const app = createApp();
const rnd = (): string => Math.random().toString(36).slice(2, 10);

function newUser(): { email: string; username: string; password: string } {
  const id = rnd();
  return { email: `authtest-${id}@example.com`, username: `authtest_${id}`, password: 'Passw0rd!' };
}

afterAll(async () => {
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns tokens without leaking the hash', async () => {
    const u = newUser();
    const res = await request(app).post('/api/v1/auth/register').send(u);

    expect(res.status).toBe(201);
    expect(res.body.data.usuario.email).toBe(u.email);
    expect(res.body.data.usuario).not.toHaveProperty('passwordHash');
    expect(res.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(res.body.data.tokens.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.tokens.expiresIn).toBeGreaterThan(0);
  });

  it('rejects a duplicate email with 409', async () => {
    const u = newUser();
    await request(app).post('/api/v1/auth/register').send(u).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...u, username: `other_${rnd()}` });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USUARIO_EXISTE');
  });

  it('rejects a weak password with 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...newUser(), password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const u = newUser();
    await request(app).post('/api/v1/auth/register').send(u).expect(201);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: u.email, password: u.password });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    const u = newUser();
    await request(app).post('/api/v1/auth/register').send(u).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: u.email, password: 'WrongPass9!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('CREDENCIALES_INVALIDAS');
  });

  it('rejects an unknown email with 401 (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `nope-${rnd()}@example.com`, password: 'Passw0rd!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/profile', () => {
  it('returns the current user with a valid access token', async () => {
    const u = newUser();
    const reg = await request(app).post('/api/v1/auth/register').send(u).expect(201);
    const token = reg.body.data.tokens.accessToken as string;

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(u.email);
  });

  it('rejects a missing token with 401', async () => {
    await request(app).get('/api/v1/auth/profile').expect(401);
  });

  it('rejects a garbage token with 401', async () => {
    await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer not.a.jwt')
      .expect(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the token pair and invalidates the used refresh token', async () => {
    const u = newUser();
    const reg = await request(app).post('/api/v1/auth/register').send(u).expect(201);
    const refreshToken = reg.body.data.tokens.refreshToken as string;

    const first = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.tokens.refreshToken).not.toBe(refreshToken);

    // The original refresh token is now single-use / spent.
    const replay = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(replay.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the access token so further calls 401', async () => {
    const u = newUser();
    const reg = await request(app).post('/api/v1/auth/register').send(u).expect(201);
    const { accessToken, refreshToken } = reg.body.data.tokens as {
      accessToken: string;
      refreshToken: string;
    };

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(204);

    await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(app).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
