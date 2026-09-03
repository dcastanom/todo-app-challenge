import { Router } from 'express';
import type { ApiResponse } from '@todo/shared';

export const healthRouter: Router = Router();

interface HealthPayload {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
}

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
