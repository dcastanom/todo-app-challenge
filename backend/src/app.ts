import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { API_PREFIX } from '@todo/shared';
import { env, isTest } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.route.js';
import { authRouter } from './modules/auth/auth.routes.js';

/**
 * Builds the Express application without binding a port — so tests can
 * drive it with supertest and `src/index.ts` owns the lifecycle.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: () => isTest,
    }),
  );

  // Stricter limit on credential endpoints (brute-force mitigation).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
  });

  app.use('/health', healthRouter);
  app.use(`${API_PREFIX}/health`, healthRouter);
  app.use(`${API_PREFIX}/auth/login`, authLimiter);
  app.use(`${API_PREFIX}/auth/register`, authLimiter);
  app.use(`${API_PREFIX}/auth`, authRouter);

  // Feature routers (tareas, categorias, etiquetas, analytics) mount here
  // in later phases.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
