import type { Server } from 'socket.io';
import type { RealtimeEvent, RealtimeEventPayloads } from '@todo/shared';

/**
 * Module-level handle to the running Socket.IO server, set once by
 * `createRealtimeServer` (see `socket-server.ts`) when the real HTTP server
 * boots (`src/index.ts`). Route handlers import `emitToUser` without caring
 * whether realtime is wired up — in tests (supertest, no real server) `io`
 * stays `null` and every emit is a no-op.
 */
let io: Server | null = null;

export function setIo(server: Server): void {
  io = server;
}

/** Test-only: reset the module singleton between suites. */
export function resetIo(): void {
  io = null;
}

/**
 * Broadcasts one event to every socket of `usuarioId` (its private
 * `usuario:<id>` room), except the socket named by `exceptClientId` — the
 * tab that made the change already applied it optimistically, so it doesn't
 * need to receive its own echo.
 */
export function emitToUser<E extends RealtimeEvent>(
  usuarioId: string,
  event: E,
  payload: RealtimeEventPayloads[E],
  exceptClientId?: string,
): void {
  if (!io) return;
  const room = `usuario:${usuarioId}`;
  const target = exceptClientId ? io.to(room).except(exceptClientId) : io.to(room);
  target.emit(event, payload);
}
