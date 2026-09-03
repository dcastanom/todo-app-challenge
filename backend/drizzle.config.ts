import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadDotenv({
  path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')].filter(existsSync),
});

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required for drizzle-kit');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
