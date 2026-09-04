import { Router, type Request } from 'express';
import {
  actualizarEtiquetaSchema,
  crearEtiquetaSchema,
  REALTIME_EVENTS,
  type ActualizarEtiquetaInput,
  type ApiResponse,
  type CrearEtiquetaInput,
  type EtiquetaDTO,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { idParam, validateBody } from '../../middleware/validate.js';
import { emitToUser } from '../../realtime/emitter.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { EtiquetaService } from './etiquetas.service.js';

export const etiquetasRouter: Router = Router();
const etiquetas = new EtiquetaService(db);

etiquetasRouter.use(requireAuth);

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  return req.user.id;
}

function clientId(req: Request): string | undefined {
  const value = req.header('x-client-id');
  return value && value.length > 0 ? value : undefined;
}

function notifyCambiaron(req: Request): void {
  emitToUser(userId(req), REALTIME_EVENTS.ETIQUETAS_CAMBIARON, {}, clientId(req));
}

etiquetasRouter.get('/', async (req, res) => {
  const body: ApiResponse<EtiquetaDTO[]> = { data: await etiquetas.list(userId(req)) };
  res.json(body);
});

etiquetasRouter.post('/', validateBody(crearEtiquetaSchema), async (req, res) => {
  const body: ApiResponse<EtiquetaDTO> = {
    data: await etiquetas.create(userId(req), req.body as CrearEtiquetaInput),
  };
  notifyCambiaron(req);
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
  notifyCambiaron(req);
  res.json(body);
});

etiquetasRouter.delete('/:id', async (req, res) => {
  await etiquetas.remove(userId(req), idParam(req));
  notifyCambiaron(req);
  res.status(204).send();
});
