import { z } from 'zod';

/** `GET /api/v1/estadisticas` — window size for the activity trend, in days. */
export const estadisticasQuerySchema = z.object({
  dias: z.coerce.number().int().min(7).max(90).default(14),
});

export type EstadisticasQuery = z.infer<typeof estadisticasQuerySchema>;
