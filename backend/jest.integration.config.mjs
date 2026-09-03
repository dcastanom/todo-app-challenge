/**
 * Integration test config — needs a live PostgreSQL at DATABASE_URL,
 * migrated and seeded (npm run db:migrate && npm run db:seed).
 * Env comes from the real .env (no setup-env stub).
 */
import { base } from './jest.config.mjs';

/** @type {import('jest').Config} */
export default {
  ...base,
  testMatch: ['**/*.integration.test.ts'],
  testTimeout: 20_000,
};
