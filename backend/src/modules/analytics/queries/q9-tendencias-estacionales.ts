import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q9 — Tendencias Estacionales.
 * ¿Cómo varía la creación y completado de tareas por mes en el último año,
 * y hay algún patrón estacional?
 *
 * `indice_estacional` = tareas creadas del mes / promedio mensual del período
 * (1.0 = media; > 1.0 = mes por encima de la media).
 */
export const Q9_SQL = /* sql */ `
WITH meses AS (
  SELECT date_trunc('month', gs) AS mes
  FROM generate_series(
    date_trunc('month', now()) - interval '11 months',
    date_trunc('month', now()),
    interval '1 month'
  ) gs
),
datos AS (
  SELECT
    m.mes,
    count(t.*) FILTER (
      WHERE date_trunc('month', t.created_at) = m.mes
    ) AS creadas,
    (
      SELECT count(*) FROM tareas c
      WHERE c.deleted_at IS NULL
        AND c.completada
        AND date_trunc('month', c.completada_en) = m.mes
    ) AS completadas
  FROM meses m
  LEFT JOIN tareas t
    ON t.deleted_at IS NULL
   AND date_trunc('month', t.created_at) = m.mes
  GROUP BY m.mes
)
SELECT
  to_char(mes, 'YYYY-MM')                                       AS mes,
  (ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
         'septiembre','octubre','noviembre','diciembre'])[EXTRACT(MONTH FROM mes)::int]
                                                               AS mes_nombre,
  creadas,
  completadas,
  round(completadas::numeric / NULLIF(creadas, 0) * 100, 1)     AS ratio_completado_pct,
  round(creadas::numeric / NULLIF(avg(creadas) OVER (), 0), 2)  AS indice_estacional
FROM datos
ORDER BY mes;
`;

export interface Q9Row {
  mes: string;
  mes_nombre: string;
  creadas: number;
  completadas: number;
  ratio_completado_pct: string | null;
  indice_estacional: string | null;
}

export const q9TendenciasEstacionales = (db: Database): Promise<Q9Row[]> =>
  runQuery<Q9Row>(db, Q9_SQL);
