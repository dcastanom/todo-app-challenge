/** Task priority levels — mirrors the CHECK constraint on `tareas.prioridad`. */
export const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

/** Allowed sort fields for `GET /api/v1/tareas`. `posicion` is the manual
 *  drag & drop order (Fase 8 bonus). */
export const CAMPOS_ORDEN = [
  'created_at',
  'fecha_vencimiento',
  'prioridad',
  'titulo',
  'posicion',
] as const;
export type CampoOrden = (typeof CAMPOS_ORDEN)[number];

/** Bulk action kinds for `PATCH /api/v1/tareas/batch` (Fase 8 bonus). */
export const ACCIONES_BATCH = ['completar', 'prioridad', 'categoria', 'eliminar'] as const;
export type AccionBatch = (typeof ACCIONES_BATCH)[number];

/** Export formats for `GET /api/v1/tareas/export` (Fase 8 bonus). */
export const FORMATOS_EXPORT = ['csv', 'json'] as const;
export type FormatoExport = (typeof FORMATOS_EXPORT)[number];

/** Hard cap on rows returned by the export endpoint. */
export const EXPORT_MAX_ROWS = 5000;

export const DIRECCIONES_ORDEN = ['asc', 'desc'] as const;
export type DireccionOrden = (typeof DIRECCIONES_ORDEN)[number];

export const API_PREFIX = '/api/v1';

export const PAGINACION = {
  LIMIT_DEFAULT: 20,
  LIMIT_MAX: 100,
} as const;
