import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit, type Options } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { API_PREFIX, type ApiError } from '@todo/shared';
import { env, isTest } from './config/env.js';
import { logger } from './config/logger.js';
import { docsRouter } from './docs/docs.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { metricsHandler, metricsMiddleware } from './observability/metrics.js';
import { healthRouter } from './routes/health.route.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { tareasRouter } from './modules/tareas/tareas.routes.js';
import { categoriasRouter } from './modules/categorias/categorias.routes.js';
import { estadisticasRouter } from './modules/estadisticas/estadisticas.routes.js';
import { etiquetasRouter } from './modules/etiquetas/etiquetas.routes.js';

/**
 * Builds the Express application without binding a port — so tests can
 * drive it with supertest and `src/index.ts` owns the lifecycle.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  if (env.METRICS_ENABLED) {
    app.use(metricsMiddleware);
    app.get('/metrics', metricsHandler);
  }

  const rateLimitHandler: Options['handler'] = (_req, res) => {
    const body: ApiError = {
      error: { code: 'RATE_LIMIT', message: 'Demasiadas peticiones, inténtalo más tarde' },
    };
    res.status(429).json(body);
  };
  // Skipped under `test` (supertest + Playwright E2E).
  const skipRateLimit = (): boolean => isTest;

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: skipRateLimit,
      handler: rateLimitHandler,
    }),
  );

  // Stricter limit on credential endpoints (brute-force mitigation).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipRateLimit,
    handler: rateLimitHandler,
  });

  app.use('/health', healthRouter);
  app.use(`${API_PREFIX}/health`, healthRouter);

  // API docs: Swagger UI at /api/v1/docs, spec at /api/v1/openapi.json.
  app.use(API_PREFIX, docsRouter);
  app.get('/api/docs', (_req, res) => res.redirect(`${API_PREFIX}/docs`));
  app.use(`${API_PREFIX}/auth/login`, authLimiter);
  app.use(`${API_PREFIX}/auth/register`, authLimiter);
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/tareas`, tareasRouter);
  app.use(`${API_PREFIX}/categorias`, categoriasRouter);
  app.use(`${API_PREFIX}/etiquetas`, etiquetasRouter);
  app.use(`${API_PREFIX}/estadisticas`, estadisticasRouter);

  // The analytics router is mounted in a later phase.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
