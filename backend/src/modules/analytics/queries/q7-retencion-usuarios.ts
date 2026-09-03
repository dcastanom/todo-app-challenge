import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q7 — Métricas de Retención de Usuarios.
 * ¿Cuántos usuarios han creado al menos una tarea en cada una de las últimas
 * 4 semanas, y cuál es la tasa de retención semana a semana?
 *
 * `usuarios_activos` = usuarios distintos con >=1 tarea creada esa semana ISO.
 * `retencion_semana_anterior_pct` = activos_semana / activos_semana_previa.
 * `usuarios_retenidos_4_semanas` (constante en todas las filas) = usuarios
 * activos en las 4 semanas completas.
 */
export const Q7_SQL = /* sql */ `
WITH limites AS (
  SELECT date_trunc('week', now()) AS semana_actual
),
semanas AS (
  SELECT
    g                                                   AS semana_offset,
    (SELECT semana_actual FROM limites) - make_interval(weeks => g)     AS inicio,
    (SELECT semana_actual FROM limites) - make_interval(weeks => g - 1) AS fin
  FROM generate_series(0, 3) g
),
actividad AS (
  SELECT
    s.semana_offset,
    s.inicio::date AS semana_inicio,
    count(DISTINCT t.usuario_id) AS usuarios_activos
  FROM semanas s
  LEFT JOIN tareas t
    ON t.deleted_at IS NULL
   AND t.created_at >= s.inicio
   AND t.created_at <  s.fin
  GROUP BY s.semana_offset, s.inicio
),
cohorte_4 AS (
  SELECT count(*) AS n FROM (
    SELECT usuario_id
    FROM tareas
    WHERE deleted_at IS NULL
      AND created_at >= (SELECT semana_actual FROM limites) - interval '4 weeks'
      AND created_at <  (SELECT semana_actual FROM limites)
    GROUP BY usuario_id
    HAVING count(DISTINCT date_trunc('week', created_at)) = 4
  ) x
)
SELECT
  a.semana_offset,
  a.semana_inicio,
  a.usuarios_activos,
  lead(a.usuarios_activos) OVER (ORDER BY a.semana_offset) AS usuarios_semana_previa,
  round(
    a.usuarios_activos::numeric
    / NULLIF(lead(a.usuarios_activos) OVER (ORDER BY a.semana_offset), 0) * 100
  , 1) AS retencion_semana_anterior_pct,
  (SELECT n FROM cohorte_4) AS usuarios_retenidos_4_semanas
FROM actividad a
ORDER BY a.semana_offset;
`;

export interface Q7Row {
  semana_offset: number;
  semana_inicio: string;
  usuarios_activos: number;
  usuarios_semana_previa: number | null;
  retencion_semana_anterior_pct: string | null;
  usuarios_retenidos_4_semanas: number;
}

export const q7RetencionUsuarios = (db: Database): Promise<Q7Row[]> => runQuery<Q7Row>(db, Q7_SQL);
