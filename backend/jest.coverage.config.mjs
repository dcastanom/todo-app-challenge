/**
 * Full-suite coverage — unit + integration in one pass against the real
 * .env database (needs Postgres + Redis, migrated + seeded). Serial so the
 * DB-backed suites don't race. Used by CI's `integration` job and locally
 * via `npm run test:coverage --workspace backend`.
 */
import { base } from './jest.config.mjs';

/** @type {import('jest').Config} */
export default {
  ...base,
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/tests/setup-coverage.ts'],
  maxWorkers: 1,
  testTimeout: 30_000,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/db/migrate.ts',
    '!src/db/reset.ts',
    '!src/db/verify.ts',
    '!src/db/seed/index.ts',
    '!src/modules/analytics/run.ts',
    '!src/config/logger.ts',
    '!src/observability/tracing.ts',
  ],
  coverageReporters: ['text-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: { branches: 75, functions: 80, lines: 80, statements: 80 },
  },
};
