/**
 * Unit test config — no database, safe for CI without services.
 * DB-backed suites are `*.integration.test.ts` (see jest.integration.config.mjs).
 */

/** @type {import('jest').Config} */
export const base = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.[cm]?[jt]sx?$': ['@swc/jest'],
  },
  // Most of node_modules ships CJS and needs no transform; a few deps are
  // ESM-only (faker) and must be transpiled.
  transformIgnorePatterns: ['/node_modules/(?!(?:@faker-js)/)'],
  // NodeNext source uses explicit .js extensions; strip them for Jest's resolver.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@todo/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
  clearMocks: true,
};

/** @type {import('jest').Config} */
export default {
  ...base,
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.test\\.ts$'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/db/migrate.ts',
    '!src/db/reset.ts',
    '!src/db/verify.ts',
    '!src/db/seed/index.ts',
    '!src/modules/analytics/run.ts',
    '!src/observability/tracing.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};
