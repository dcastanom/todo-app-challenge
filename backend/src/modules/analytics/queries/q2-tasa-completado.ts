import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q2 — Tendencias de Tasa de Completado.
 * ¿Cuál es la tasa de completado diaria de tareas en los últimos 90 días,
 * agrupada por nivel de prioridad?
 *
 * Cohorte por día de creación: de las tareas creadas el día D con prioridad P,
 * qué porcentaje está completado hoy.
 */
export const Q2_SQL = /* sql */ `
SELECT
  date_trunc('day', created_at)::date            AS dia,
  prioridad,
  count(*)                                       AS tareas_creadas,
  count(*) FILTER (WHERE completada)             AS tareas_completadas,
  round(
    count(*) FILTER (WHERE completada)::numeric / count(*) * 100
  , 1)                                           AS tasa_completado_pct
FROM tareas
WHERE deleted_at IS NULL
  AND created_at >= now() - interval '90 days'
GROUP BY 1, 2
ORDER BY 1 DESC, array_position(
  ARRAY['urgente','alta','normal','baja']::varchar[], prioridad::varchar
);
`;

export interface Q2Row {
  dia: string;
  prioridad: string;
  tareas_creadas: number;
  tareas_completadas: number;
  tasa_completado_pct: string;
}

export const q2TasaCompletado = (db: Database): Promise<Q2Row[]> => runQuery<Q2Row>(db, Q2_SQL);
