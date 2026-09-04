import { Router } from 'express';
import { z } from 'zod';
import {
  actualizarTareaSchema,
  batchTareasSchema,
  crearTareaSchema,
  exportTareasQuerySchema,
  listarTareasQuerySchema,
  reordenarTareasSchema,
  type ActualizarTareaInput,
  type ApiResponse,
  type BatchResultado,
  type BatchTareasInput,
  type CrearTareaInput,
  type ExportTareasQuery,
  type ListarTareasQuery,
  type ReordenarTareasInput,
  type TareaDTO,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { idParam, uuidParam, validateBody, validateQuery } from '../../middleware/validate.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { serializeExport } from './tareas.export.js';
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

tareasRouter.get('/export', validateQuery(exportTareasQuerySchema), async (req, res) => {
  const query = req.validatedQuery as ExportTareasQuery;
  const tareasList = await tareas.listForExport(userId(req), query);
  const { body, contentType, filename } = serializeExport(tareasList, query.formato);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
});

tareasRouter.patch('/reorder', validateBody(reordenarTareasSchema), async (req, res) => {
  const { ids } = req.body as ReordenarTareasInput;
  await tareas.reorder(userId(req), ids);
  res.status(204).send();
});

tareasRouter.patch('/batch', validateBody(batchTareasSchema), async (req, res) => {
  const body: ApiResponse<BatchResultado> = {
    data: await tareas.batch(userId(req), req.body as BatchTareasInput),
  };
  res.json(body);
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

const etiquetaBodySchema = z.object({ etiquetaId: z.string().uuid() });

tareasRouter.post('/:id/etiquetas', validateBody(etiquetaBodySchema), async (req, res) => {
  const { etiquetaId } = req.body as z.infer<typeof etiquetaBodySchema>;
  const body: ApiResponse<TareaDTO> = {
    data: await tareas.addEtiqueta(userId(req), idParam(req), etiquetaId),
  };
  res.json(body);
});

tareasRouter.delete('/:id/etiquetas/:eid', async (req, res) => {
  const body: ApiResponse<TareaDTO> = {
    data: await tareas.removeEtiqueta(userId(req), idParam(req), uuidParam(req, 'eid')),
  };
  res.json(body);
});

tareasRouter.delete('/:id', async (req, res) => {
  await tareas.remove(userId(req), idParam(req));
  res.status(204).send();
});
