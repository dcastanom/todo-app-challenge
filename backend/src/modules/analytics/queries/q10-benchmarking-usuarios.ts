import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q10 — Benchmarking de Rendimiento.
 * ¿Qué usuarios están en el 10% superior por tasa de completado de tareas,
 * y cuál es el número promedio de tareas que manejan simultáneamente?
 *
 * `tareas_simultaneas_promedio` = suma de la duración abierta de cada tarea
 * (created_at → completada_en / ahora) dividido entre la ventana de
 * observación del usuario. Es una media temporal de tareas abiertas a la vez.
 * Sólo usuarios con >= 10 tareas; percentil por percent_rank sobre la tasa.
 */
export const Q10_SQL = /* sql */ `
WITH stats AS (
  SELECT
    t.usuario_id,
    count(*)                                                    AS total_tareas,
    count(*) FILTER (WHERE t.completada)                        AS completadas,
    round(count(*) FILTER (WHERE t.completada)::numeric / count(*) * 100, 2)
                                                               AS tasa_completado_pct,
    sum(EXTRACT(EPOCH FROM (COALESCE(t.completada_en, now()) - t.created_at)))
                                                               AS segundos_abiertas,
    EXTRACT(EPOCH FROM (max(COALESCE(t.completada_en, now())) - min(t.created_at)))
                                                               AS segundos_observados
  FROM tareas t
  WHERE t.deleted_at IS NULL
  GROUP BY t.usuario_id
  HAVING count(*) >= 10
),
ranked AS (
  SELECT
    *,
    round(segundos_abiertas / NULLIF(segundos_observados, 0), 2) AS tareas_simultaneas_promedio,
    percent_rank() OVER (ORDER BY tasa_completado_pct)           AS percentil
  FROM stats
)
SELECT
  u.username,
  r.total_tareas,
  r.completadas,
  r.tasa_completado_pct,
  r.tareas_simultaneas_promedio,
  round(r.percentil::numeric * 100, 1)                           AS percentil_tasa
FROM ranked r
JOIN usuarios u ON u.id = r.usuario_id
WHERE r.percentil >= 0.9
ORDER BY r.tasa_completado_pct DESC;
`;

export interface Q10Row {
  username: string;
  total_tareas: number;
  completadas: number;
  tasa_completado_pct: string;
  tareas_simultaneas_promedio: string | null;
  percentil_tasa: string;
}

export const q10BenchmarkingUsuarios = (db: Database): Promise<Q10Row[]> =>
  runQuery<Q10Row>(db, Q10_SQL);
