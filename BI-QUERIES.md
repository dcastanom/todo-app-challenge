# Consultas de Inteligencia de Negocio

Las 10 consultas SQL que responden la sección **"Preguntas de Inteligencia de Negocio"**
de `fullstack-todo-challenge-1.md`.

- **Dónde vive el código:** `backend/src/modules/analytics/queries/` — un archivo por consulta,
  con el SQL exacto (constante `Qn_SQL`) y su ejecutor tipado.
- **SQL puro:** las consultas no llevan parámetros ligados; se pueden copiar y pegar
  directamente en `psql` contra la base migrada y poblada.
- **Ejecutar todas con resultados y latencia:**
  ```bash
  npm run db:migrate --workspace backend
  npm run db:seed    --workspace backend
  npm run analytics  --workspace backend            # resultados + tiempos
  npm run analytics  --workspace backend -- --explain   # + plan EXPLAIN ANALYZE
  ```
- **Tests:** `npm run test:integration --workspace backend`
  (`backend/tests/modules/analytics/analytics.integration.test.ts`) valida forma y
  latencia (< 1 s) de cada consulta contra los datos de ejemplo.

## Conjunto de datos de ejemplo

El seed (`faker`, determinista salvo por el "ahora" de cada corrida) genera ~20 usuarios,
~100 categorías, ~180 etiquetas y **~730 tareas** repartidas en 365 días, con sesgo hacia
fechas recientes, estacionalidad mensual suave, horas laborables (UTC) y días de semana.
Los números de los ejemplos de salida **varían en cada corrida del seed**; se muestran para
ilustrar el formato.

## Resumen de rendimiento

Medido contra los ~730 registros de ejemplo (`npm run analytics -- --explain`):

| Consulta | Filas | Tiempo de ejecución | Índice(s) relevante(s) a escala |
|---|---|---|---|
| Q1  Participación de usuarios      | 1   | ~0.3 ms | `idx_tareas_created_at` |
| Q2  Tasa de completado diaria      | ~150 | ~0.7 ms | `idx_tareas_created_at` |
| Q3  Rendimiento por categoría      | ≤10 | ~0.5 ms | `idx_tareas_usuario_categoria`, PK `categorias` |
| Q4  Patrones de productividad      | ~60 | ~1.8 ms | — (escaneo completo; agrega toda la tabla) |
| Q5  Tareas vencidas               | ~120 | ~0.9 ms | `idx_tareas_fecha_vencimiento`, `idx_tareas_usuario_completada` |
| Q6  Estadísticas de etiquetas      | ~14 | ~1.4 ms | `idx_tarea_etiquetas_etiqueta_id`, PK junction |
| Q7  Retención de usuarios          | 4   | ~0.4 ms | `idx_tareas_created_at` |
| Q8  Distribución de prioridad      | 4   | ~0.5 ms | `idx_tareas_usuario_prioridad_completada` |
| Q9  Tendencias estacionales        | 12  | ~2.8 ms | `idx_tareas_created_at`, `idx_tareas_completada_en` |
| Q10 Benchmarking top 10%          | ~2  | ~0.5 ms | `idx_tareas_usuario_completada` |

> **Nota sobre índices:** con ~730 filas el planificador de PostgreSQL elige *Seq Scan*
> para la mayoría de las consultas porque recorrer 33 páginas es más barato que el acceso
> por índice. Los índices compuestos (definidos en `backend/src/db/schema/`, ver
> `ARQUITECTURA.md` §8.2) entran en juego a volumen de producción (decenas de miles de
> filas). Todas las consultas se mantienen **muy por debajo de 1 s** en ambos escenarios.

> **Zona horaria:** Q4 y Q9 extraen hora/mes en **UTC** para que el resultado sea
> reproducible. En producción se parametrizaría con la zona del usuario
> (`ts AT TIME ZONE :tz`).

---

## Q1 — Análisis de Participación de Usuarios

> **Pregunta:** ¿Cuál es el promedio de tareas creadas por usuario en los últimos 30 días,
> y cómo se compara con los 30 días anteriores?

**Interpretación.** Denominador = usuarios que crearon al menos una tarea en la ventana de
60 días. Se compara el promedio de tareas creadas por usuario en `[hoy-30, hoy]` contra
`[hoy-60, hoy-30]`, en valor absoluto y porcentual.

```sql
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
```

**Salida** (fila única):

| usuarios_activos_60d | total_ultimos_30 | total_previos_30 | promedio_ultimos_30 | promedio_previos_30 | variacion_absoluta | variacion_porcentual |
|---|---|---|---|---|---|---|
| 20 | 53 | 82 | 2.65 | 4.10 | -1.45 | -35.4 |

---

## Q2 — Tendencias de Tasa de Completado

> **Pregunta:** ¿Cuál es la tasa de completado diaria de tareas en los últimos 90 días,
> agrupada por nivel de prioridad?

**Interpretación.** Cohorte por día de creación: de las tareas creadas el día D con
prioridad P, qué porcentaje está completado hoy. Una fila por (día, prioridad).

```sql
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
```

**Salida** (una fila por día × prioridad; muestra):

| dia | prioridad | tareas_creadas | tareas_completadas | tasa_completado_pct |
|---|---|---|---|---|
| 2026-09-03 | alta   | 2 | 1 | 50.0 |
| 2026-09-03 | normal | 2 | 1 | 50.0 |
| 2026-09-03 | baja   | 1 | 1 | 100.0 |
| 2026-09-02 | alta   | 1 | 1 | 100.0 |
| 2026-09-01 | normal | 1 | 1 | 100.0 |
| 2026-09-01 | baja   | 2 | 1 | 50.0 |

---

## Q3 — Rendimiento por Categoría

> **Pregunta:** ¿Qué categorías tienen las tasas de completado más altas y más bajas,
> y cuál es el tiempo promedio de completado para cada categoría?

**Interpretación.** Agregado por **nombre** de categoría (las categorías son por-usuario
pero comparten catálogo). El `ORDER BY tasa_completado_pct DESC` deja la mejor categoría
arriba y la peor abajo. `dias_promedio_completado` = media de `completada_en - created_at`
sobre las tareas completadas.

```sql
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
```

**Salida** (ranking completo; primera = mejor, última = peor):

| categoria | total_tareas | completadas | tasa_completado_pct | dias_promedio_completado |
|---|---|---|---|---|
| Estudio   | 61 | 45 | 73.8 | 14.17 |
| Viajes    | 81 | 57 | 70.4 | 13.07 |
| Finanzas  | 33 | 23 | 69.7 | 12.22 |
| Hogar     | 35 | 24 | 68.6 | 11.92 |
| Familia   | 43 | 27 | 62.8 | 13.01 |
| Salud     | 77 | 43 | 55.8 | 11.31 |
| Compras   | 74 | 41 | 55.4 | 12.41 |
| Personal  | 50 | 27 | 54.0 | 14.21 |
| Proyectos | 47 | 25 | 53.2 | 12.43 |
| Trabajo   | 83 | 44 | 53.0 | 12.15 |

---

## Q4 — Patrones de Productividad del Usuario

> **Pregunta:** ¿Cuáles son las horas pico y días de la semana cuando los usuarios crean
> más tareas, y cuándo las completan?

**Interpretación.** Distribuciones **marginales**: por hora del día (0-23) y por día de la
semana (1=lunes … 7=domingo), para cada evento (`creacion` / `completado`). Ordenado por
`total DESC` dentro de cada bloque, así las horas/días pico quedan arriba.

```sql
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
```

**Salida** (muestra — horas y días pico de creación):

| evento | dimension | valor | etiqueta | total | pct_del_evento |
|---|---|---|---|---|---|
| creacion | hora_del_dia | 10 | 10:00 | 76 | 10.43 |
| creacion | hora_del_dia | 9  | 09:00 | 74 | 10.15 |
| creacion | hora_del_dia | 15 | 15:00 | 74 | 10.15 |
| creacion | dia_semana   | 1  | lunes   | 154 | 21.12 |
| creacion | dia_semana   | 5  | viernes | 149 | 20.44 |
| completado | hora_del_dia | 10 | 10:00 | 47 | 10.88 |
| completado | hora_del_dia | 15 | 15:00 | 45 | 10.42 |

Pico de creación y de completado: media mañana (09-11 h) y media tarde (15-16 h), de lunes a viernes.

---

## Q5 — Análisis de Tareas Vencidas

> **Pregunta:** ¿Cuántas tareas están actualmente vencidas, agrupadas por usuario y
> categoría, y cuál es el promedio de días que están vencidas?

**Interpretación.** Vencida = `completada = false` AND `deleted_at IS NULL` AND
`fecha_vencimiento < now()`. `ROLLUP` añade subtotales por usuario y un total general;
la columna `nivel` (vía `GROUPING`) desambigua las filas de subtotal de las categorías
realmente nulas.

```sql
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
```

**Salida** (muestra):

| nivel | usuario | categoria | tareas_vencidas | dias_promedio_vencida | dias_max_vencida |
|---|---|---|---|---|---|
| detalle          | anita_padronrosales | (sin categoría) | 2 | 137.2 | 175.0 |
| detalle          | anita_padronrosales | Trabajo         | 1 | 168.5 | 168.5 |
| subtotal_usuario | anita_padronrosales | *(null)*        | 5 | 145.2 | 175.0 |
| detalle          | antonia.trejogodinez | (sin categoría) | 3 | 150.7 | 220.8 |
| …                | …                    | …               | … | …     | …     |
| total_general    | *(null)*             | *(null)*        | … | …     | …     |

---

## Q6 — Estadísticas de Uso de Etiquetas

> **Pregunta:** ¿Cuáles son las etiquetas más frecuentemente utilizadas, y qué etiquetas
> están asociadas con las tasas de completado más altas?

**Interpretación.** Agregado por nombre de etiqueta. `veces_usada` (y `rank_uso`) responde
la primera parte; ordenar por `tasa_completado_pct` responde la segunda.

```sql
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
```

**Salida** (muestra):

| etiqueta | veces_usada | en_tareas_completadas | tasa_completado_pct | dias_promedio_completado | rank_uso |
|---|---|---|---|---|---|
| urgente       | 162 | 96 | 59.3 | 13.45 | 1 |
| documentacion | 150 | 84 | 56.0 | 12.24 | 2 |
| idea          | 128 | 81 | 63.3 | 12.92 | 3 |
| seguimiento   | 118 | 65 | 55.1 | 14.31 | 4 |
| …             | …   | …  | …    | …     | … |
| bug           | 85  | 58 | 68.2 | 14.10 | 10 |

Mayor tasa de completado: `bug` (68 %), `cliente` (64 %), `idea` (63 %).

---

## Q7 — Métricas de Retención de Usuarios

> **Pregunta:** ¿Cuántos usuarios han creado al menos una tarea en cada una de las últimas
> 4 semanas, y cuál es la tasa de retención semana a semana?

**Interpretación.** `usuarios_activos` = usuarios distintos con ≥ 1 tarea creada esa semana
ISO. `retencion_semana_anterior_pct` = activos(semana) / activos(semana previa).
`usuarios_retenidos_4_semanas` (constante en todas las filas) = usuarios activos en las 4
semanas completas.

```sql
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
```

**Salida** (4 filas; `semana_offset` 0 = semana en curso):

| semana_offset | semana_inicio | usuarios_activos | usuarios_semana_previa | retencion_semana_anterior_pct | usuarios_retenidos_4_semanas |
|---|---|---|---|---|---|
| 0 | 2026-08-31 | 7 | 8 | 87.5 | 1 |
| 1 | 2026-08-24 | 8 | 8 | 100.0 | 1 |
| 2 | 2026-08-17 | 8 | 8 | 100.0 | 1 |
| 3 | 2026-08-10 | 8 | *(null)* | *(null)* | 1 |

---

## Q8 — Análisis de Distribución de Prioridad

> **Pregunta:** ¿Cuál es la distribución de tareas a través de los niveles de prioridad
> para usuarios activos (usuarios que han iniciado sesión en los últimos 7 días)?

**Interpretación.** Usuario activo = `usuarios.ultimo_acceso >= now() - interval '7 days'`.
Se cuenta la distribución de sus tareas (no borradas) por prioridad, con % del total,
usuarios distintos, completadas y vencidas.

```sql
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
```

**Salida** (4 filas):

| prioridad | total_tareas | porcentaje | usuarios | completadas | vencidas |
|---|---|---|---|---|---|
| urgente | 38  | 9.9  | 10 | 25  | 6  |
| alta    | 86  | 22.5 | 10 | 48  | 28 |
| normal  | 173 | 45.3 | 10 | 104 | 50 |
| baja    | 85  | 22.3 | 10 | 52  | 27 |

---

## Q9 — Tendencias Estacionales

> **Pregunta:** ¿Cómo varía la creación y completado de tareas por mes en el último año,
> y hay algún patrón estacional?

**Interpretación.** Serie mensual de los últimos 12 meses. `indice_estacional` = tareas
creadas del mes / promedio mensual del período (1.0 = media; > 1.0 = mes por encima de la
media). El mes en curso aparece parcial (bajo) por definición.

```sql
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
```

**Salida** (12 filas):

| mes | mes_nombre | creadas | completadas | ratio_completado_pct | indice_estacional |
|---|---|---|---|---|---|
| 2025-10 | octubre    | 50 | 20 | 40.0  | 0.84 |
| 2025-11 | noviembre  | 46 | 28 | 60.9  | 0.77 |
| 2025-12 | diciembre  | 42 | 28 | 66.7  | 0.70 |
| 2026-01 | enero      | 69 | 22 | 31.9  | 1.16 |
| 2026-02 | febrero    | 81 | 58 | 71.6  | 1.36 |
| 2026-03 | marzo      | 82 | 44 | 53.7  | 1.37 |
| 2026-04 | abril      | 67 | 36 | 53.7  | 1.12 |
| 2026-05 | mayo       | 66 | 52 | 78.8  | 1.11 |
| 2026-06 | junio      | 67 | 30 | 44.8  | 1.12 |
| 2026-07 | julio      | 87 | 48 | 55.2  | 1.46 |
| 2026-08 | agosto     | 50 | 50 | 100.0 | 0.84 |
| 2026-09 | septiembre | 9  | 14 | 155.6 | 0.15 |

Pico de actividad en febrero-marzo y julio; valle en el último trimestre del año anterior.

---

## Q10 — Benchmarking de Rendimiento

> **Pregunta:** ¿Qué usuarios están en el 10% superior por tasa de completado de tareas,
> y cuál es el número promedio de tareas que manejan simultáneamente?

**Interpretación.** `tareas_simultaneas_promedio` = suma de la duración "abierta" de cada
tarea (`created_at` → `completada_en` o ahora) dividida entre la ventana de observación del
usuario; es una media temporal de cuántas tareas tiene abiertas a la vez. Sólo usuarios con
≥ 10 tareas; el 10 % superior se obtiene con `percent_rank()` sobre la tasa de completado.

```sql
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
```

**Salida** (top 10 %):

| username | total_tareas | completadas | tasa_completado_pct | tareas_simultaneas_promedio | percentil_tasa |
|---|---|---|---|---|---|
| anita_padronrosales   | 37 | 27 | 72.97 | 9.96  | 100.0 |
| sancho.paredesrodarte | 42 | 28 | 66.67 | 12.17 | 94.7 |
