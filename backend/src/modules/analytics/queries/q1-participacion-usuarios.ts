import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q1 — Análisis de Participación de Usuarios.
 * ¿Cuál es el promedio de tareas creadas por usuario en los últimos 30 días,
 * y cómo se compara con los 30 días anteriores?
 *
 * Denominador: usuarios que crearon al menos una tarea en la ventana de 60 días.
 */
export const Q1_SQL = /* sql */ `
WITH ventana AS (
  SELECT
    usuario_id,
    count(*) FILTER (
      WHERE created_at >= now() - interval '30 days'
    ) AS creadas_ultimos_30,
    count(*) FILTER (
      WHERE created_at >= now() - interval '60 days'
        AND created_at <  now() - interval '30 days'
    ) AS creadas_previos_30
  FROM tareas
  WHERE deleted_at IS NULL
    AND created_at >= now() - interval '60 days'
  GROUP BY usuario_id
)
SELECT
  count(*)                                              AS usuarios_activos_60d,
  sum(creadas_ultimos_30)                               AS total_ultimos_30,
  sum(creadas_previos_30)                               AS total_previos_30,
  round(avg(creadas_ultimos_30), 2)                     AS promedio_ultimos_30,
  round(avg(creadas_previos_30), 2)                     AS promedio_previos_30,
  round(avg(creadas_ultimos_30) - avg(creadas_previos_30), 2) AS variacion_absoluta,
  round(
    (avg(creadas_ultimos_30) - avg(creadas_previos_30))
    / NULLIF(avg(creadas_previos_30), 0) * 100
  , 1)                                                  AS variacion_porcentual
FROM ventana;
`;

export interface Q1Row {
  usuarios_activos_60d: number;
  total_ultimos_30: number;
  total_previos_30: number;
  promedio_ultimos_30: string;
  promedio_previos_30: string;
  variacion_absoluta: string;
  variacion_porcentual: string | null;
}

export const q1ParticipacionUsuarios = (db: Database): Promise<Q1Row[]> =>
  runQuery<Q1Row>(db, Q1_SQL);
