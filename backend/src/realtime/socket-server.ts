import type { Server as HttpServer } from 'node:http';
import { Server, type DefaultEventsMap } from 'socket.io';
import type { RealtimeAuth } from '@todo/shared';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../modules/auth/jwt.js';
import { isBlacklisted } from '../modules/auth/token-store.js';
import { setIo } from './emitter.js';

interface SocketData {
  usuarioId: string;
}

type RealtimeServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

/** `usuario:<id>` — the private room every one of a user's tabs/devices joins. */
export const userRoom = (usuarioId: string): string => `usuario:${usuarioId}`;

/**
 * Wires a Socket.IO server onto the same HTTP server Express listens on
 * (`src/index.ts`), authenticated the same way HTTP requests are: a JWT
 * access token, checked against the logout blacklist. Each socket joins its
 * owner's private room so task/category/tag mutations can be broadcast to
 * every other tab/device of that same user (see `emitter.ts`) — this is
 * per-user sync, not shared/collaborative real-time.
 */
export function createRealtimeServer(httpServer: HttpServer): RealtimeServer {
  const io: RealtimeServer = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    void (async () => {
      const { token } = (socket.handshake.auth ?? {}) as Partial<RealtimeAuth>;
      if (!token) throw new Error('NO_AUTENTICADO');
      const payload = verifyAccessToken(token);
      if (await isBlacklisted(payload.jti)) throw new Error('TOKEN_REVOCADO');
      socket.data = { usuarioId: payload.sub };
      next();
    })().catch((err: unknown) => {
      next(err instanceof Error ? err : new Error('AUTH_ERROR'));
    });
  });

  io.on('connection', (socket) => {
    const { usuarioId } = socket.data;
    void socket.join(userRoom(usuarioId));
    logger.debug({ usuarioId, socketId: socket.id }, 'realtime: socket connected');

    socket.on('disconnect', (reason) => {
      logger.debug({ usuarioId, socketId: socket.id, reason }, 'realtime: socket disconnected');
    });
  });

  setIo(io);
  logger.info('realtime: Socket.IO server ready');
  return io;
}
