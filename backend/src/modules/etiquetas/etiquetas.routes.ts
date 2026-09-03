import { Router } from 'express';
import {
  actualizarEtiquetaSchema,
  crearEtiquetaSchema,
  type ActualizarEtiquetaInput,
  type ApiResponse,
  type CrearEtiquetaInput,
  type EtiquetaDTO,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { idParam, validateBody } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { EtiquetaService } from './etiquetas.service.js';

export const etiquetasRouter: Router = Router();
const etiquetas = new EtiquetaService(db);

etiquetasRouter.use(requireAuth);

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  return req.user.id;
}

etiquetasRouter.get('/', async (req, res) => {
  const body: ApiResponse<EtiquetaDTO[]> = { data: await etiquetas.list(userId(req)) };
  res.json(body);
});

etiquetasRouter.post('/', validateBody(crearEtiquetaSchema), async (req, res) => {
  const body: ApiResponse<EtiquetaDTO> = {
    data: await etiquetas.create(userId(req), req.body as CrearEtiquetaInput),
  };
  res.status(201).json(body);
});

etiquetasRouter.get('/:id', async (req, res) => {
  const body: ApiResponse<EtiquetaDTO> = { data: await etiquetas.get(userId(req), idParam(req)) };
  res.json(body);
});

etiquetasRouter.put('/:id', validateBody(actualizarEtiquetaSchema), async (req, res) => {
  const body: ApiResponse<EtiquetaDTO> = {
    data: await etiquetas.update(userId(req), idParam(req), req.body as ActualizarEtiquetaInput),
  };
  res.json(body);
});

etiquetasRouter.delete('/:id', async (req, res) => {
  await etiquetas.remove(userId(req), idParam(req));
  res.status(204).send();
});
