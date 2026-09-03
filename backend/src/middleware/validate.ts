import type { Request, RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';

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

/** Parsed query lands on `req.validatedQuery` (req.query is read-only in Express 5). */
export function validateQuery<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    Object.defineProperty(req, 'validatedQuery', {
      value: schema.parse(req.query) as z.infer<S>,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}

const idParamSchema = z.string().uuid('Identificador inválido');

/** Reads and UUID-validates `:id` (throws ZodError → 422 on a bad value). */
export function idParam(req: Request): string {
  return idParamSchema.parse(req.params.id);
}
