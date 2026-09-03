import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@todo/shared';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

/** Application error with an HTTP status and a stable machine code. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
};

// Express identifies an error handler by its 4-argument signature.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const body: ApiError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues,
      },
    };
    res.status(422).json(body);
    return;
  }

  if (err instanceof AppError) {
    const body: ApiError = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  const body: ApiError = {
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Internal server error' : String(err),
    },
  };
  res.status(500).json(body);
};
