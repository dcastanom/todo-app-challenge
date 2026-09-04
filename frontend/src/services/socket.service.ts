import { io, type Socket } from 'socket.io-client';
import type { RealtimeAuth, RealtimeEvent, RealtimeEventPayloads } from '@todo/shared';

/** The backend's plain origin (no `/api/v1` suffix) — sockets connect
 *  directly to it, same-origin deployments included (nginx also proxies
 *  `/socket.io/`, see `frontend/nginx.conf`). */
function resolveOrigin(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api/v1';
  try {
    return new URL(base).origin;
  } catch {
    return window.location.origin;
  }
}

type Listener = (payload: unknown) => void;

let socket: Socket | null = null;
// Subscriptions are kept in our own registry (not on the socket instance
// directly) so `on()` works regardless of call order relative to
// `connect()` — a component can subscribe before the socket exists, or
// across a disconnect/reconnect, and never miss a wire-up.
const listeners = new Map<string, Set<Listener>>();

function dispatch(event: string, payload: unknown): void {
  listeners.get(event)?.forEach((fn) => fn(payload));
}

/**
 * Connects (or reconnects with a fresh token) the realtime socket. Calling
 * it again while already connected just swaps the auth token for the next
 * reconnection — safe to call after every login and token refresh.
 */
export function connect(token: string): Socket {
  if (socket) {
    socket.auth = { token } satisfies RealtimeAuth;
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(resolveOrigin(), {
    path: '/socket.io',
    auth: { token } satisfies RealtimeAuth,
    withCredentials: true,
    reconnectionAttempts: Infinity,
  });
  socket.onAny(dispatch);
  return socket;
}

export function disconnect(): void {
  socket?.disconnect();
  socket = null;
}

/** This tab's socket id — sent as `X-Client-Id` on write requests (see
 *  `services/http.ts`) so the backend can exclude this tab from its own
 *  broadcast (it already applied the change optimistically). `undefined`
 *  until the handshake completes. */
export function getClientId(): string | undefined {
  return socket?.connected ? socket.id : undefined;
}

/** Subscribes to one realtime event; returns an unsubscribe function. */
export function on<E extends RealtimeEvent>(
  event: E,
  handler: (payload: RealtimeEventPayloads[E]) => void,
): () => void {
  const set = listeners.get(event) ?? new Set<Listener>();
  set.add(handler as Listener);
  listeners.set(event, set);
  return () => {
    listeners.get(event)?.delete(handler as Listener);
  };
}
