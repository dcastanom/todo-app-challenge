import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

// Parse int8 (bigint) as a JS number — every count/sum in this app is well
// under 2^53. `numeric` stays a string (arbitrary precision), which is what
// the analytics row types expect for rounded ratios.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => (value === null ? null : Number(value)));

const { Pool } = pg;

/** Shared connection pool. Closed on shutdown / after one-off scripts. */
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema, casing: 'snake_case' });

export type Database = typeof db;
export { schema };
