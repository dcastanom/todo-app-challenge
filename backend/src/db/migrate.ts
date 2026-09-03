import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

try {
  console.warn(`Applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.warn('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
