import { Router } from 'express';
import {
  estadisticasQuerySchema,
  type ApiResponse,
  type EstadisticasDTO,
  type EstadisticasQuery,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { EstadisticasService } from './estadisticas.service.js';

export const estadisticasRouter: Router = Router();
const estadisticas = new EstadisticasService(db);

estadisticasRouter.use(requireAuth);

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  return req.user.id;
}

estadisticasRouter.get('/', validateQuery(estadisticasQuerySchema), async (req, res) => {
  const body: ApiResponse<EstadisticasDTO> = {
    data: await estadisticas.resumen(userId(req), req.validatedQuery as EstadisticasQuery),
  };
  res.json(body);
});
