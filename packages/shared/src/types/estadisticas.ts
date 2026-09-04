import type { Prioridad } from '../constants.js';

/** Counts for one priority bucket in the stats summary. */
export interface EstadisticaPrioridad {
  prioridad: Prioridad;
  total: number;
  completadas: number;
}

/** Counts for one category bucket (or "sin categoría" when `categoriaId` is null). */
export interface EstadisticaCategoria {
  categoriaId: string | null;
  nombre: string;
  color: string | null;
  total: number;
  completadas: number;
}

/** One day of activity in the trend window. */
export interface EstadisticaActividadDia {
  fecha: string; // YYYY-MM-DD
  creadas: number;
  completadas: number;
}

/** `GET /api/v1/estadisticas` response — a per-user stats snapshot. */
export interface EstadisticasDTO {
  total: number;
  completadas: number;
  pendientes: number;
  vencidas: number;
  /** `completadas / total`, 0 when there are no tasks. */
  tasaCompletado: number;
  porPrioridad: EstadisticaPrioridad[];
  porCategoria: EstadisticaCategoria[];
  /** Daily creation/completion counts for the last `dias` days, oldest first. */
  actividad: EstadisticaActividadDia[];
}
