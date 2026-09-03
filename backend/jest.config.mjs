/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  // Tests live outside src/, mirroring the src/ hierarchy under tests/.
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  transform: {
    '^.+\\.ts$': ['@swc/jest'],
  },
  // NodeNext source uses explicit .js extensions; strip them for Jest's resolver.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@todo/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  clearMocks: true,
};
