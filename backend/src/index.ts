import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/client.js';
import { closeRedis } from './config/redis.js';

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
