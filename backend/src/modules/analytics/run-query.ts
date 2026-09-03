import { sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';

/**
 * Executes a raw analytics SQL string. Analytics is the one place the
 * project uses hand-written SQL instead of the Drizzle query builder
 * (see CLAUDE.md) — the queries are also a graded deliverable and must
 * be runnable as-is in psql, so they take no bound parameters.
 */
export async function runQuery<T>(db: Database, query: string): Promise<T[]> {
  const result = await db.execute(sql.raw(query));
  return result.rows as T[];
}
