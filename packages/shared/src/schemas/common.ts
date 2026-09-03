import { z } from 'zod';
import { PAGINACION } from '../constants.js';

/** UUID v4 path/param validator. */
export const uuidSchema = z.string().uuid();

/** Shared pagination query params. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINACION.LIMIT_MAX)
    .default(PAGINACION.LIMIT_DEFAULT),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
