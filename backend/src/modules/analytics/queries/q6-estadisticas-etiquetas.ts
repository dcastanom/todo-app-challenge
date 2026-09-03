import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q6 — Estadísticas de Uso de Etiquetas.
 * ¿Cuáles son las etiquetas más frecuentemente utilizadas, y qué etiquetas
 * están asociadas con las tasas de completado más altas?
 *
 * Agregado por nombre de etiqueta. `veces_usada` responde la primera parte;
 * ordenar por `tasa_completado_pct` responde la segunda.
 */
export const Q6_SQL = /* sql */ `
SELECT
  e.nombre                                          AS etiqueta,
  count(*)                                          AS veces_usada,
  count(*) FILTER (WHERE t.completada)              AS en_tareas_completadas,
  round(
    count(*) FILTER (WHERE t.completada)::numeric / count(*) * 100
  , 1)                                              AS tasa_completado_pct,
  round(
    avg(EXTRACT(EPOCH FROM (t.completada_en - t.created_at)) / 86400)
      FILTER (WHERE t.completada AND t.completada_en IS NOT NULL)
  , 2)                                              AS dias_promedio_completado,
  rank() OVER (ORDER BY count(*) DESC)              AS rank_uso
FROM tarea_etiquetas te
JOIN etiquetas e ON e.id = te.etiqueta_id AND e.deleted_at IS NULL
JOIN tareas    t ON t.id = te.tarea_id    AND t.deleted_at IS NULL
GROUP BY e.nombre
ORDER BY veces_usada DESC;
`;

export interface Q6Row {
  etiqueta: string;
  veces_usada: number;
  en_tareas_completadas: number;
  tasa_completado_pct: string;
  dias_promedio_completado: string | null;
  rank_uso: number;
}

export const q6EstadisticasEtiquetas = (db: Database): Promise<Q6Row[]> =>
  runQuery<Q6Row>(db, Q6_SQL);
