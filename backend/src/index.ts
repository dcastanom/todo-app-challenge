import { startTracing } from './observability/tracing.js';

// Tracing must patch http/express/pg before they are imported.
await startTracing();

const { createApp } = await import('./app.js');
const { env } = await import('./config/env.js');
const { logger } = await import('./config/logger.js');
const { pool } = await import('./db/client.js');
const { closeRedis } = await import('./config/redis.js');

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on http://localhost:${String(env.PORT)} (${env.NODE_ENV})`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    void Promise.allSettled([pool.end(), closeRedis()]).then(() => {
      logger.info('Connections closed');
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
