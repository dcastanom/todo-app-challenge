import { Router } from 'express';
import { z } from 'zod';
import {
  actualizarTareaSchema,
  crearTareaSchema,
  listarTareasQuerySchema,
  type ActualizarTareaInput,
  type ApiResponse,
  type CrearTareaInput,
  type ListarTareasQuery,
  type TareaDTO,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { idParam, validateBody, validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { TareaService } from './tareas.service.js';

export const tareasRouter: Router = Router();
const tareas = new TareaService(db);

tareasRouter.use(requireAuth);

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  return req.user.id;
}

tareasRouter.get('/', validateQuery(listarTareasQuerySchema), async (req, res) => {
  res.json(await tareas.list(userId(req), req.validatedQuery as ListarTareasQuery));
});

tareasRouter.post('/', validateBody(crearTareaSchema), async (req, res) => {
  const body: ApiResponse<TareaDTO> = {
    data: await tareas.create(userId(req), req.body as CrearTareaInput),
  };
  res.status(201).json(body);
});

tareasRouter.get('/:id', async (req, res) => {
  const body: ApiResponse<TareaDTO> = { data: await tareas.get(userId(req), idParam(req)) };
  res.json(body);
});

tareasRouter.put('/:id', validateBody(actualizarTareaSchema), async (req, res) => {
  const body: ApiResponse<TareaDTO> = {
    data: await tareas.update(userId(req), idParam(req), req.body as ActualizarTareaInput),
  };
  res.json(body);
});

const completarSchema = z.object({ completada: z.boolean().optional() });

tareasRouter.patch('/:id/completar', validateBody(completarSchema), async (req, res) => {
  const { completada } = req.body as z.infer<typeof completarSchema>;
  const body: ApiResponse<TareaDTO> = {
    data: await tareas.setCompletada(userId(req), idParam(req), completada),
  };
  res.json(body);
});

tareasRouter.delete('/:id', async (req, res) => {
  await tareas.remove(userId(req), idParam(req));
  res.status(204).send();
});
