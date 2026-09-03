import { Router } from 'express';
import { z } from 'zod';
import { loginSchema, refreshSchema, registerSchema } from '@todo/shared';
import type {
  ApiResponse,
  AuthResponse,
  LoginInput,
  RefreshInput,
  RegisterInput,
  UsuarioPublico,
} from '@todo/shared';
import { db } from '../../db/client.js';
import { AppError } from '../../middleware/error-handler.js';
import { validateBody } from '../../middleware/validate.js';
import { requireAuth } from './auth.middleware.js';
import { AuthService } from './auth.service.js';

export const authRouter: Router = Router();
const auth = new AuthService(db);

const logoutSchema = z.object({ refreshToken: z.string().optional() });

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const body: ApiResponse<AuthResponse> = { data: await auth.register(req.body as RegisterInput) };
  res.status(201).json(body);
});

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const body: ApiResponse<AuthResponse> = { data: await auth.login(req.body as LoginInput) };
  res.json(body);
});

authRouter.post('/refresh', validateBody(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body as RefreshInput;
  const body: ApiResponse<AuthResponse> = { data: await auth.refresh(refreshToken) };
  res.json(body);
});

authRouter.post('/logout', requireAuth, validateBody(logoutSchema), async (req, res) => {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  const { refreshToken } = req.body as z.infer<typeof logoutSchema>;
  await auth.logout(req.user.jti, req.user.exp, refreshToken);
  res.status(204).send();
});

authRouter.get('/profile', requireAuth, async (req, res) => {
  if (!req.user) throw new AppError(401, 'NO_AUTENTICADO', 'No autenticado');
  const body: ApiResponse<UsuarioPublico> = { data: await auth.me(req.user.id) };
  res.json(body);
});
