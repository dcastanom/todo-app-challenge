import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q4 — Patrones de Productividad del Usuario.
 * ¿Cuáles son las horas pico y días de la semana cuando los usuarios crean
 * más tareas, y cuándo las completan?
 *
 * Devuelve las distribuciones marginales: por hora del día (0-23) y por día
 * de la semana (1=lunes..7=domingo), para cada evento (creación / completado).
 * `total DESC` deja las horas/días pico arriba.
 *
 * Hora/día se extraen en UTC para reproducibilidad; en producción se
 * parametrizaría con la zona del usuario: `ts AT TIME ZONE :tz`.
 */
export const Q4_SQL = /* sql */ `
WITH eventos AS (
  SELECT 'creacion'::text  AS evento, created_at    AS ts FROM tareas
    WHERE deleted_at IS NULL
  UNION ALL
  SELECT 'completado'::text AS evento, completada_en AS ts FROM tareas
    WHERE deleted_at IS NULL AND completada AND completada_en IS NOT NULL
),
dias AS (
  SELECT ARRAY['lunes','martes','miércoles','jueves','viernes','sábado','domingo'] AS nombres
)
SELECT
  e.evento,
  'hora_del_dia'                                     AS dimension,
  EXTRACT(HOUR FROM e.ts)::int                       AS valor,
  lpad(EXTRACT(HOUR FROM e.ts)::int::text, 2, '0') || ':00' AS etiqueta,
  count(*)                                           AS total,
  round(100.0 * count(*) / sum(count(*)) OVER (PARTITION BY e.evento), 2) AS pct_del_evento
FROM eventos e
GROUP BY e.evento, EXTRACT(HOUR FROM e.ts)
UNION ALL
SELECT
  e.evento,
  'dia_semana'                                       AS dimension,
  EXTRACT(ISODOW FROM e.ts)::int                     AS valor,
  (SELECT nombres FROM dias)[EXTRACT(ISODOW FROM e.ts)::int] AS etiqueta,
  count(*)                                           AS total,
  round(100.0 * count(*) / sum(count(*)) OVER (PARTITION BY e.evento), 2) AS pct_del_evento
FROM eventos e
GROUP BY e.evento, EXTRACT(ISODOW FROM e.ts)
ORDER BY evento, dimension, total DESC;
`;

export interface Q4Row {
  evento: 'creacion' | 'completado';
  dimension: 'hora_del_dia' | 'dia_semana';
  valor: number;
  etiqueta: string;
  total: number;
  pct_del_evento: string;
}

export const q4PatronesProductividad = (db: Database): Promise<Q4Row[]> =>
  runQuery<Q4Row>(db, Q4_SQL);
