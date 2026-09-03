import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validates `req.body` against a Zod schema, replacing it with the parsed
 * (and transformed) value. A ZodError bubbles to the error handler → 422.
 */
export function validateBody<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body) as z.infer<S>;
    next();
  };
}

export function validateQuery<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    Object.defineProperty(req, 'validatedQuery', {
      value: schema.parse(req.query) as z.infer<S>,
      configurable: true,
    });
    next();
  };
}
