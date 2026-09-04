import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { like } from 'drizzle-orm';
import request from 'supertest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { REALTIME_EVENTS, type TareaDTO } from '@todo/shared';
import { createApp } from '../../src/app.js';
import { closeRedis } from '../../src/config/redis.js';
import { db, pool } from '../../src/db/client.js';
import { usuarios } from '../../src/db/schema/index.js';
import { resetIo } from '../../src/realtime/emitter.js';
import { createRealtimeServer } from '../../src/realtime/socket-server.js';

const app = createApp();
const httpServer: HttpServer = createServer(app);
createRealtimeServer(httpServer);

const rnd = (): string => Math.random().toString(36).slice(2, 10);
const bearer = (t: string): [string, string] => ['Authorization', `Bearer ${t}`];
let baseUrl = '';

async function makeUser(): Promise<{ token: string }> {
  const id = rnd();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `authtest-ws-${id}@example.com`, username: `ws_${id}`, password: 'Passw0rd!' })
    .expect(201);
  return { token: res.body.data.tokens.accessToken as string };
}

function connectSocket(token: string): ClientSocket {
  return ioClient(baseUrl, { path: '/socket.io', auth: { token }, forceNew: true });
}

/** Resolves with the next payload for `event`, or rejects after `ms`. */
function waitForEvent<T>(socket: ClientSocket, event: string, ms = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${event}"`)), ms);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** Resolves `true` if `event` does NOT fire within `ms` (a negative assertion). */
function expectNoEvent(socket: ClientSocket, event: string, ms = 400): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    socket.once(event, () => {
      clearTimeout(timer);
      reject(new Error(`unexpected "${event}"`));
    });
  });
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', resolve);
  });
  const address = httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  resetIo();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await db.delete(usuarios).where(like(usuarios.email, 'authtest-ws-%@example.com'));
  await pool.end();
  await closeRedis();
});

describe('Realtime Socket.IO server', () => {
  it('rejects a connection with no token', async () => {
    const socket = connectSocket('');
    try {
      await expect(
        new Promise((_resolve, reject) => {
          socket.once('connect_error', reject);
          socket.once('connect', () => reject(new Error('should not connect')));
        }),
      ).rejects.toThrow();
    } finally {
      socket.disconnect();
    }
  });

  it('rejects a connection with an invalid token', async () => {
    const socket = connectSocket('not-a-real-jwt');
    try {
      await expect(
        new Promise((_resolve, reject) => {
          socket.once('connect_error', reject);
          socket.once('connect', () => reject(new Error('should not connect')));
        }),
      ).rejects.toThrow();
    } finally {
      socket.disconnect();
    }
  });

  it('broadcasts task mutations to the owner’s other tabs, not the originating one', async () => {
    const { token } = await makeUser();

    const tabA = connectSocket(token);
    const tabB = connectSocket(token);
    await Promise.all([
      new Promise<void>((resolve) => tabA.once('connect', resolve)),
      new Promise<void>((resolve) => tabB.once('connect', resolve)),
    ]);

    try {
      const [creada] = await Promise.all([
        waitForEvent<TareaDTO>(tabB, REALTIME_EVENTS.TAREA_CREADA),
        expectNoEvent(tabA, REALTIME_EVENTS.TAREA_CREADA),
        request(app)
          .post('/api/v1/tareas')
          .set(...bearer(token))
          .set('X-Client-Id', tabA.id!)
          .send({ titulo: 'Sincronizada' })
          .expect(201),
      ]);

      expect(creada.titulo).toBe('Sincronizada');
    } finally {
      tabA.disconnect();
      tabB.disconnect();
    }
  });

  it('never delivers another user’s events', async () => {
    const { token: ownerToken } = await makeUser();
    const { token: strangerToken } = await makeUser();

    const stranger = connectSocket(strangerToken);
    await new Promise<void>((resolve) => stranger.once('connect', resolve));

    try {
      await Promise.all([
        expectNoEvent(stranger, REALTIME_EVENTS.TAREA_CREADA),
        request(app)
          .post('/api/v1/tareas')
          .set(...bearer(ownerToken))
          .send({ titulo: 'Privada' })
          .expect(201),
      ]);
    } finally {
      stranger.disconnect();
    }
  });
});
