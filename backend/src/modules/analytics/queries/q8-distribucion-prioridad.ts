import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q8 — Análisis de Distribución de Prioridad.
 * ¿Cuál es la distribución de tareas a través de los niveles de prioridad
 * para usuarios activos (usuarios que han iniciado sesión en los últimos
 * 7 días)?
 *
 * Actividad = usuarios.ultimo_acceso >= ahora - 7 días.
 */
export const Q8_SQL = /* sql */ `
WITH activos AS (
  SELECT id FROM usuarios
  WHERE deleted_at IS NULL
    AND ultimo_acceso >= now() - interval '7 days'
)
SELECT
  t.prioridad,
  count(*)                                                       AS total_tareas,
  round(100.0 * count(*) / sum(count(*)) OVER (), 1)             AS porcentaje,
  count(DISTINCT t.usuario_id)                                   AS usuarios,
  count(*) FILTER (WHERE t.completada)                           AS completadas,
  count(*) FILTER (WHERE NOT t.completada AND t.fecha_vencimiento < now()) AS vencidas
FROM tareas t
JOIN activos a ON a.id = t.usuario_id
WHERE t.deleted_at IS NULL
GROUP BY t.prioridad
ORDER BY array_position(
  ARRAY['urgente','alta','normal','baja']::varchar[], t.prioridad::varchar
);
`;

export interface Q8Row {
  prioridad: string;
  total_tareas: number;
  porcentaje: string;
  usuarios: number;
  completadas: number;
  vencidas: number;
}

export const q8DistribucionPrioridad = (db: Database): Promise<Q8Row[]> =>
  runQuery<Q8Row>(db, Q8_SQL);
