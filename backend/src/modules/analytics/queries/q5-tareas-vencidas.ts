import type { Database } from '../../../db/client.js';
import { runQuery } from '../run-query.js';

/**
 * Q5 — Análisis de Tareas Vencidas.
 * ¿Cuántas tareas están actualmente vencidas, agrupadas por usuario y
 * categoría, y cuál es el promedio de días que están vencidas?
 *
 * Vencida = no completada, no borrada, fecha_vencimiento < ahora.
 * ROLLUP añade subtotales por usuario y un total general.
 * `nivel`: 'detalle' | 'subtotal_usuario' | 'total_general' — desambigua
 * las filas de subtotal de las categorías realmente nulas.
 */
export const Q5_SQL = /* sql */ `
SELECT
  CASE GROUPING(u.username, c.nombre)
    WHEN 0 THEN 'detalle'
    WHEN 1 THEN 'subtotal_usuario'
    ELSE 'total_general'
  END                                                              AS nivel,
  u.username                                                       AS usuario,
  CASE
    WHEN GROUPING(c.nombre) = 1 THEN NULL
    ELSE coalesce(c.nombre, '(sin categoría)')
  END                                                              AS categoria,
  count(*)                                                         AS tareas_vencidas,
  round(avg(EXTRACT(EPOCH FROM (now() - t.fecha_vencimiento)) / 86400), 1)
                                                                   AS dias_promedio_vencida,
  round(max(EXTRACT(EPOCH FROM (now() - t.fecha_vencimiento)) / 86400), 1)
                                                                   AS dias_max_vencida
FROM tareas t
JOIN usuarios u ON u.id = t.usuario_id AND u.deleted_at IS NULL
LEFT JOIN categorias c ON c.id = t.categoria_id
WHERE t.deleted_at IS NULL
  AND t.completada = false
  AND t.fecha_vencimiento < now()
GROUP BY ROLLUP (u.username, c.nombre)
ORDER BY GROUPING(u.username), u.username, GROUPING(c.nombre), tareas_vencidas DESC;
`;

export interface Q5Row {
  nivel: 'detalle' | 'subtotal_usuario' | 'total_general';
  usuario: string | null;
  categoria: string | null;
  tareas_vencidas: number;
  dias_promedio_vencida: string;
  dias_max_vencida: string;
}

export const q5TareasVencidas = (db: Database): Promise<Q5Row[]> => runQuery<Q5Row>(db, Q5_SQL);
