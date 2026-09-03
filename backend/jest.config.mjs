/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/db/migrate.ts',
    '!src/db/reset.ts',
    '!src/db/verify.ts',
    '!src/db/seed/index.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  clearMocks: true,
};
