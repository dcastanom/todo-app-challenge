/** Task priority levels — mirrors the CHECK constraint on `tareas.prioridad`. */
export const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

/** Allowed sort fields for `GET /api/v1/tareas`. */
export const CAMPOS_ORDEN = ['created_at', 'fecha_vencimiento', 'prioridad', 'titulo'] as const;
export type CampoOrden = (typeof CAMPOS_ORDEN)[number];

export const DIRECCIONES_ORDEN = ['asc', 'desc'] as const;
export type DireccionOrden = (typeof DIRECCIONES_ORDEN)[number];

export const API_PREFIX = '/api/v1';

export const PAGINACION = {
  LIMIT_DEFAULT: 20,
  LIMIT_MAX: 100,
} as const;
