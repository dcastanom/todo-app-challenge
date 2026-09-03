import { redis } from '../../config/redis.js';

/**
 * Redis-backed token lifecycle:
 * - `refresh:<jti>` allow-list — a refresh token is only usable while its
 *   jti is present (enables rotation + server-side revocation).
 * - `bl:<jti>` deny-list — access/refresh jtis invalidated by logout.
 * Every key carries a TTL matching the token's remaining lifetime, so the
 * store self-cleans.
 */

const refreshKey = (jti: string): string => `refresh:${jti}`;
const blacklistKey = (jti: string): string => `bl:${jti}`;

export async function rememberRefreshToken(
  jti: string,
  userId: string,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(refreshKey(jti), userId, 'EX', ttlSeconds);
}

export async function isRefreshTokenActive(jti: string, userId: string): Promise<boolean> {
  const stored = await redis.get(refreshKey(jti));
  return stored === userId;
}

export async function forgetRefreshToken(jti: string): Promise<void> {
  await redis.del(refreshKey(jti));
}

export async function blacklist(jti: string, ttlSeconds: number): Promise<void> {
  if (ttlSeconds <= 0) return;
  await redis.set(blacklistKey(jti), '1', 'EX', ttlSeconds);
}

export async function isBlacklisted(jti: string): Promise<boolean> {
  return (await redis.exists(blacklistKey(jti))) === 1;
}

/** Seconds until a JWT `exp` (unix seconds), floored at 0. */
export function secondsUntil(exp: number): number {
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}
