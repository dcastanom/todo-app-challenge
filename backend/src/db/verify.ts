/**
 * US-016 / US-018 — verifies that the migrated database matches the design
 * and can support the Fase 2 analytics queries. Run after db:migrate + db:seed.
 */
import { sql } from 'drizzle-orm';
import { db, pool } from './client.js';

const EXPECTED_TABLES = [
  'usuarios',
  'categorias',
  'tareas',
  'etiquetas',
  'tarea_etiquetas',
  'audit_logs',
  'notificaciones',
  'notificacion_preferencias',
  'tarea_permisos',
  'tarea_comentarios',
];

const EXPECTED_INDEXES = [
  'idx_usuarios_deleted_at',
  'idx_categorias_usuario_id',
  'uq_categorias_usuario_nombre',
  'idx_tareas_usuario_completada',
  'idx_tareas_usuario_categoria',
  'idx_tareas_usuario_prioridad_completada',
  'idx_tareas_fecha_vencimiento',
  'idx_tareas_created_at',
  'idx_tareas_completada_en',
  'idx_tareas_deleted_at',
  'idx_etiquetas_usuario_id',
  'uq_etiquetas_usuario_nombre',
  'idx_tarea_etiquetas_etiqueta_id',
  'idx_audit_logs_entidad',
  'idx_audit_logs_timestamp',
  'idx_notificaciones_usuario_leida',
  'uq_tarea_permisos_tarea_usuario',
  'idx_tarea_comentarios_tarea_created',
];

const EXPECTED_CHECKS = [
  'chk_tareas_prioridad',
  'chk_audit_logs_accion',
  'chk_notificaciones_tipo',
  'chk_tarea_permisos_nivel',
];

let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  const mark = ok ? 'PASS' : 'FAIL';
  if (!ok) failures++;
  console.warn(`  [${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
}

async function rows<T = Record<string, unknown>>(query: ReturnType<typeof sql>): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

async function num(query: ReturnType<typeof sql>): Promise<number> {
  const [row] = await rows<{ n: string | number }>(query);
  return Number(row?.n ?? 0);
}

async function main(): Promise<void> {
  console.warn('\n1. Schema objects\n');

  const tables = await rows<{ table_name: string }>(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const tableNames = new Set(tables.map((t) => t.table_name));
  for (const t of EXPECTED_TABLES) {
    check(`table ${t}`, tableNames.has(t));
  }
  check(
    'no unexpected tables',
    [...tableNames].every((t) => EXPECTED_TABLES.includes(t) || t === '__drizzle_migrations'),
    [...tableNames]
      .filter((t) => !EXPECTED_TABLES.includes(t) && t !== '__drizzle_migrations')
      .join(', '),
  );

  const indexes = await rows<{ indexname: string }>(sql`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
  `);
  const indexNames = new Set(indexes.map((i) => i.indexname));
  for (const idx of EXPECTED_INDEXES) {
    check(`index ${idx}`, indexNames.has(idx));
  }

  const checks = await rows<{ conname: string }>(sql`
    SELECT conname FROM pg_constraint WHERE contype = 'c'
  `);
  const checkNames = new Set(checks.map((c) => c.conname));
  for (const c of EXPECTED_CHECKS) {
    check(`check constraint ${c}`, checkNames.has(c));
  }

  console.warn('\n2. Seed data volume\n');

  const counts = {
    usuarios: await num(sql`SELECT count(*) n FROM usuarios`),
    categorias: await num(sql`SELECT count(*) n FROM categorias`),
    etiquetas: await num(sql`SELECT count(*) n FROM etiquetas`),
    tareas: await num(sql`SELECT count(*) n FROM tareas`),
    tarea_etiquetas: await num(sql`SELECT count(*) n FROM tarea_etiquetas`),
    notificacion_preferencias: await num(sql`SELECT count(*) n FROM notificacion_preferencias`),
  };
  console.warn(`  counts: ${JSON.stringify(counts)}`);
  check('usuarios >= 15', counts.usuarios >= 15);
  check(
    'tareas >= 500 (challenge requirement)',
    counts.tareas >= 500,
    `got ${String(counts.tareas)}`,
  );
  check('categorias > 0', counts.categorias > 0);
  check('etiquetas > 0', counts.etiquetas > 0);
  check('tarea_etiquetas > 0', counts.tarea_etiquetas > 0);
  check(
    'notificacion_preferencias == usuarios',
    counts.notificacion_preferencias === counts.usuarios,
  );

  console.warn('\n3. Data shape for analytics (Fase 2)\n');

  check(
    'every completed task has completada_en',
    (await num(sql`SELECT count(*) n FROM tareas WHERE completada AND completada_en IS NULL`)) ===
      0,
  );
  check(
    'overdue tasks exist (Q5)',
    (await num(sql`
      SELECT count(*) n FROM tareas
      WHERE NOT completada AND deleted_at IS NULL AND fecha_vencimiento < now()
    `)) > 0,
  );
  check(
    'soft-deleted tasks exist',
    (await num(sql`SELECT count(*) n FROM tareas WHERE deleted_at IS NOT NULL`)) > 0,
  );
  check(
    'active users in last 7 days exist (Q8)',
    (await num(
      sql`SELECT count(*) n FROM usuarios WHERE ultimo_acceso >= now() - interval '7 days'`,
    )) > 0,
  );
  const spanDays = await num(sql`
    SELECT EXTRACT(DAY FROM (max(created_at) - min(created_at))) n FROM tareas
  `);
  check('task history spans >= 300 days (Q9)', spanDays >= 300, `${String(spanDays)} days`);
  const priorities = await rows<{ prioridad: string; n: string }>(sql`
    SELECT prioridad, count(*) n FROM tareas GROUP BY prioridad ORDER BY prioridad
  `);
  check('all 4 priority levels present', priorities.length === 4, JSON.stringify(priorities));

  console.warn('\n4. Index usage + latency\n');

  const started = performance.now();
  const plan = await rows<{ 'QUERY PLAN': string }>(sql`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT t.id, t.titulo, t.prioridad, c.nombre AS categoria
    FROM tareas t
    LEFT JOIN categorias c ON c.id = t.categoria_id
    WHERE t.usuario_id = (SELECT id FROM usuarios ORDER BY created_at LIMIT 1)
      AND t.completada = false
      AND t.deleted_at IS NULL
    ORDER BY t.fecha_vencimiento NULLS LAST
    LIMIT 20
  `);
  const elapsed = performance.now() - started;
  const planText = plan.map((r) => r['QUERY PLAN']).join('\n');
  check(
    'filtered tareas query uses an index',
    /Index (Only )?Scan|Bitmap Index Scan/.test(planText),
  );
  check('filtered tareas query < 1s', elapsed < 1000, `${elapsed.toFixed(1)} ms`);

  console.warn(
    `\n${failures === 0 ? 'ALL CHECKS PASSED' : `${String(failures)} CHECK(S) FAILED`}\n`,
  );
  if (failures > 0) process.exitCode = 1;
}

try {
  await main();
} catch (err) {
  console.error('Verify failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
