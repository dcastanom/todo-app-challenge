import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

/** Shared connection pool. Closed on shutdown / after one-off scripts. */
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema, casing: 'snake_case' });

export type Database = typeof db;
export { schema };
