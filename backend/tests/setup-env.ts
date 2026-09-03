/**
 * Runs before any module is imported by a test file.
 * Provides a deterministic environment so `src/config/env.ts` validates.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = 'postgresql://todo:todo@localhost:5432/todolist_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-access-secret-000000000000000000000000';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-00000000000000000000000';
process.env.CORS_ORIGIN = 'http://localhost:5173';
