import { Router } from 'express';
import { sql } from 'drizzle-orm';
import type { ApiResponse } from '@todo/shared';
import { redis } from '../config/redis.js';
import { db } from '../db/client.js';

export const healthRouter: Router = Router();

interface HealthPayload {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
}

/** Liveness — the process is up. Cheap, no dependencies touched. */
healthRouter.get('/', (_req, res) => {
  const body: ApiResponse<HealthPayload> = {
    data: {
      status: 'ok',
      service: 'todo-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };
  res.json(body);
});

/** Readiness — Postgres and Redis are reachable. 503 if either is down. */
healthRouter.get('/ready', async (_req, res) => {
  const checks = await Promise.allSettled([db.execute(sql`select 1`), redis.ping()]);
  const [postgres, cache] = checks.map((c) => (c.status === 'fulfilled' ? 'up' : 'down'));
  const ready = postgres === 'up' && cache === 'up';
  res.status(ready ? 200 : 503).json({
    data: { status: ready ? 'ready' : 'degraded', postgres, redis: cache },
  });
});
