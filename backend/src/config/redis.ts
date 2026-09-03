import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Shared Redis client. `lazyConnect` so importing this module never blocks
 * boot; the first command opens the connection.
 */
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: true,
});

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis error');
});

export async function closeRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connecting') {
    await redis.quit();
  }
}
