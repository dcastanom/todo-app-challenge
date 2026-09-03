import request from 'supertest';
import type { Express } from 'express';

export const rnd = (): string => Math.random().toString(36).slice(2, 10);

/** Prefix used so tests can clean up their users with a single LIKE. */
export const TEST_EMAIL_PREFIX = 'authtest-';

export interface TestUser {
  token: string;
  id: string;
  email: string;
}

export async function registerUser(app: Express): Promise<TestUser> {
  const id = rnd();
  const email = `${TEST_EMAIL_PREFIX}${id}@example.com`;
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, username: `u_${id}`, password: 'Passw0rd!' })
    .expect(201);
  return {
    token: res.body.data.tokens.accessToken as string,
    id: res.body.data.usuario.id as string,
    email,
  };
}

export const auth = (token: string): [string, string] => ['Authorization', `Bearer ${token}`];
