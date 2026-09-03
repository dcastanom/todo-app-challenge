import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error-handler.js';
import { verifyAccessToken } from './jwt.js';
import { isBlacklisted } from './token-store.js';

function extractBearer(header: string | undefined): string {
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'NO_AUTENTICADO', 'Falta el token de acceso');
  }
  return header.slice('Bearer '.length).trim();
}

/** Populates `req.user` or rejects with 401. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  void (async () => {
    const token = extractBearer(req.headers.authorization);
    const payload = verifyAccessToken(token);
    if (await isBlacklisted(payload.jti)) {
      throw new AppError(401, 'TOKEN_REVOCADO', 'La sesión fue cerrada');
    }
    req.user = { id: payload.sub, email: payload.email, jti: payload.jti, exp: payload.exp };
    next();
  })().catch(next);
};
