/**
 * Runs the 10 BI queries against DATABASE_URL, printing results, row counts
 * and latency. `--explain` also prints the EXPLAIN ANALYZE plan for each.
 *
 *   npm run analytics --workspace backend
 *   npm run analytics --workspace backend -- --explain
 */
import { sql } from 'drizzle-orm';
import { db, pool } from '../../db/client.js';
import { ANALYTICS_QUERIES } from './analytics.service.js';

const explain = process.argv.includes('--explain');
const SLOW_MS = 1000;

interface Timing {
  id: string;
  ms: number;
  filas: number;
  usaIndice?: boolean;
}

const timings: Timing[] = [];

for (const q of ANALYTICS_QUERIES) {
  const started = performance.now();
  const rows = await q.run(db);
  const ms = performance.now() - started;
  timings.push({ id: q.id, ms, filas: rows.length });

  console.warn(`\n${'='.repeat(72)}`);
  console.warn(`${q.id} — ${q.titulo}   (${ms.toFixed(1)} ms, ${String(rows.length)} filas)`);
  console.warn('='.repeat(72));
  console.table(rows.slice(0, 12));

  if (explain) {
    const plan = await db.execute(sql.raw(`EXPLAIN (ANALYZE, BUFFERS) ${q.sql}`));
    const text = (plan.rows as { 'QUERY PLAN': string }[]).map((r) => r['QUERY PLAN']).join('\n');
    const usaIndice = /Index (Only )?Scan|Bitmap Index Scan/.test(text);
    timings[timings.length - 1]!.usaIndice = usaIndice;
    console.warn(text);
  }
}

console.warn(`\n${'='.repeat(72)}`);
console.warn('RESUMEN');
console.warn('='.repeat(72));
console.table(
  timings.map((t) => ({
    query: t.id,
    ms: Number(t.ms.toFixed(1)),
    filas: t.filas,
    ...(explain ? { usa_indice: t.usaIndice } : {}),
    ok: t.ms < SLOW_MS,
  })),
);

const lentas = timings.filter((t) => t.ms >= SLOW_MS);
if (lentas.length > 0) {
  console.error(
    `\n${String(lentas.length)} query(s) sobre ${String(SLOW_MS)} ms:`,
    lentas.map((t) => t.id).join(', '),
  );
  process.exitCode = 1;
} else {
  console.warn(`\nTodas las queries < ${String(SLOW_MS)} ms.`);
}

await pool.end();
