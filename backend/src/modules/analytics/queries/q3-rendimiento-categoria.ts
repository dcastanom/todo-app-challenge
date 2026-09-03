import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q3 — Rendimiento por Categoría.
 * ¿Qué categorías tienen las tasas de completado más altas y más bajas,
 * y cuál es el tiempo promedio de completado para cada categoría?
 *
 * Agregado por nombre de categoría (las categorías son por-usuario pero
 * comparten catálogo de nombres). Fila superior = mejor tasa, inferior = peor.
 */
export const Q3_SQL = /* sql */ `
SELECT
  c.nombre                                          AS categoria,
  count(*)                                          AS total_tareas,
  count(*) FILTER (WHERE t.completada)              AS completadas,
  round(
    count(*) FILTER (WHERE t.completada)::numeric / count(*) * 100
  , 1)                                              AS tasa_completado_pct,
  round(
    avg(EXTRACT(EPOCH FROM (t.completada_en - t.created_at)) / 86400)
      FILTER (WHERE t.completada AND t.completada_en IS NOT NULL)
  , 2)                                              AS dias_promedio_completado
FROM tareas t
JOIN categorias c ON c.id = t.categoria_id
WHERE t.deleted_at IS NULL
  AND c.deleted_at IS NULL
GROUP BY c.nombre
HAVING count(*) >= 5
ORDER BY tasa_completado_pct DESC, total_tareas DESC;
`;

export interface Q3Row {
  categoria: string;
  total_tareas: number;
  completadas: number;
  tasa_completado_pct: string;
  dias_promedio_completado: string | null;
}

export const q3RendimientoCategoria = (db: Database): Promise<Q3Row[]> =>
  runQuery<Q3Row>(db, Q3_SQL);
