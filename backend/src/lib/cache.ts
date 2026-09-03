import { createHash } from 'node:crypto';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Version-tagged per-user cache. Each namespace/user has a version counter;
 * cache keys embed the current version, so bumping it (on any mutation)
 * instantly invalidates every entry without SCAN/DEL. Stale keys expire on
 * their own TTL.
 *
 * Every Redis call is best-effort — if Redis is unavailable the app still
 * works, just uncached.
 */

const versionKey = (namespace: string, userId: string): string => `ver:${namespace}:${userId}`;

async function currentVersion(namespace: string, userId: string): Promise<string> {
  try {
    return (await redis.get(versionKey(namespace, userId))) ?? '0';
  } catch {
    return 'nocache';
  }
}

export async function invalidateUser(namespace: string, userId: string): Promise<void> {
  try {
    await redis.incr(versionKey(namespace, userId));
  } catch (err) {
    logger.warn({ err }, 'cache invalidate failed');
  }
}

export function hashPayload(payload: unknown): string {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

/**
 * Returns the cached value for `(namespace, userId, payload)` or computes,
 * stores (TTL) and returns it.
 */
export async function withUserCache<T>(
  namespace: string,
  userId: string,
  payload: unknown,
  ttlSeconds: number,
  produce: () => Promise<T>,
): Promise<T> {
  const version = await currentVersion(namespace, userId);
  const key = `${namespace}:${userId}:v${version}:${hashPayload(payload)}`;

  try {
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch {
    /* miss / redis down → fall through */
  }

  const value = await produce();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err }, 'cache write failed');
  }

  return value;
}
