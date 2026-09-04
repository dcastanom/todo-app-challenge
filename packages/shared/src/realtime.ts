import type { TareaDTO } from './types/tareas.js';

/**
 * Socket.IO event names, shared verbatim by server (`realtime/`) and client
 * (`services/socket.service.ts`) so a typo can't silently desync them.
 *
 * Every task/category/tag mutation broadcasts to the owner's private room
 * (`usuario:<id>`), so other tabs/devices of the same user stay in sync —
 * this is deliberately per-user, not a shared/collaborative room.
 */
export const REALTIME_EVENTS = {
  TAREA_CREADA: 'tarea:creada',
  TAREA_ACTUALIZADA: 'tarea:actualizada',
  TAREA_ELIMINADA: 'tarea:eliminada',
  TAREAS_REORDENADAS: 'tareas:reordenadas',
  TAREAS_CAMBIO_MASIVO: 'tareas:cambio-masivo',
  CATEGORIAS_CAMBIARON: 'categorias:cambiaron',
  ETIQUETAS_CAMBIARON: 'etiquetas:cambiaron',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface TareaEliminadaPayload {
  id: string;
}

export interface TareasReordenadasPayload {
  ids: string[];
}

export interface TareasCambioMasivoPayload {
  afectadas: number;
}

/** Handshake payload the client sends when connecting the socket. */
export interface RealtimeAuth {
  token: string;
}

/** Per-event payload map, used to type the client's `socket.on` listeners. */
export interface RealtimeEventPayloads {
  [REALTIME_EVENTS.TAREA_CREADA]: TareaDTO;
  [REALTIME_EVENTS.TAREA_ACTUALIZADA]: TareaDTO;
  [REALTIME_EVENTS.TAREA_ELIMINADA]: TareaEliminadaPayload;
  [REALTIME_EVENTS.TAREAS_REORDENADAS]: TareasReordenadasPayload;
  [REALTIME_EVENTS.TAREAS_CAMBIO_MASIVO]: TareasCambioMasivoPayload;
  [REALTIME_EVENTS.CATEGORIAS_CAMBIARON]: Record<string, never>;
  [REALTIME_EVENTS.ETIQUETAS_CAMBIARON]: Record<string, never>;
}
