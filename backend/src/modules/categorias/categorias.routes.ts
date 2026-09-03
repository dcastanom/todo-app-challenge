import { Router } from 'express';
import {
  actualizarCategoriaSchema,
  crearCategoriaSchema,
  type ActualizarCategoriaInput,
  type ApiResponse,
  type CategoriaDTO,
  type CrearCategoriaInput,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { idParam, validateBody } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { CategoriaService } from './categorias.service.js';

export const categoriasRouter: Router = Router();
const categorias = new CategoriaService(db);

categoriasRouter.use(requireAuth);

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  return req.user.id;
}

categoriasRouter.get('/', async (req, res) => {
  const body: ApiResponse<CategoriaDTO[]> = { data: await categorias.list(userId(req)) };
  res.json(body);
});

categoriasRouter.post('/', validateBody(crearCategoriaSchema), async (req, res) => {
  const body: ApiResponse<CategoriaDTO> = {
    data: await categorias.create(userId(req), req.body as CrearCategoriaInput),
  };
  res.status(201).json(body);
});

categoriasRouter.get('/:id', async (req, res) => {
  const body: ApiResponse<CategoriaDTO> = { data: await categorias.get(userId(req), idParam(req)) };
  res.json(body);
});

categoriasRouter.put('/:id', validateBody(actualizarCategoriaSchema), async (req, res) => {
  const body: ApiResponse<CategoriaDTO> = {
    data: await categorias.update(userId(req), idParam(req), req.body as ActualizarCategoriaInput),
  };
  res.json(body);
});

categoriasRouter.delete('/:id', async (req, res) => {
  await categorias.remove(userId(req), idParam(req));
  res.status(204).send();
});
