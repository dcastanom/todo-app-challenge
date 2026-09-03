import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from '@todo/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';

type Duration = NonNullable<SignOptions['expiresIn']>;

export interface SignedToken {
  token: string;
  jti: string;
  expiresInSeconds: number;
}

export interface SignedPair {
  access: SignedToken;
  refresh: SignedToken;
}

/** Parse `30s` / `15m` / `2h` / `7d` into seconds. */
export function durationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const n = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  return n * { s: 1, m: 60, h: 3600, d: 86400 }[unit];
}

function sign(
  payload: Pick<JwtPayload, 'sub' | 'email' | 'type'>,
  secret: string,
  expiresIn: string,
): SignedToken {
  const jti = randomUUID();
  const token = jwt.sign(payload, secret, { expiresIn: expiresIn as Duration, jwtid: jti });
  return { token, jti, expiresInSeconds: durationToSeconds(expiresIn) };
}

export function signTokenPair(user: { id: string; email: string }): SignedPair {
  return {
    access: sign(
      { sub: user.id, email: user.email, type: 'access' },
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN,
    ),
    refresh: sign(
      { sub: user.id, email: user.email, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN,
    ),
  };
}

export interface VerifiedToken extends JwtPayload {
  jti: string;
  exp: number;
  iat: number;
}

function verify(token: string, secret: string, expectedType: JwtPayload['type']): VerifiedToken {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Token inválido o expirado');
  }
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('sub' in decoded) ||
    !('jti' in decoded) ||
    (decoded as { type?: unknown }).type !== expectedType
  ) {
    throw new AppError(401, 'INVALID_TOKEN', 'Token con formato inesperado');
  }
  return decoded as VerifiedToken;
}

export const verifyAccessToken = (token: string): VerifiedToken =>
  verify(token, env.JWT_SECRET, 'access');

export const verifyRefreshToken = (token: string): VerifiedToken =>
  verify(token, env.JWT_REFRESH_SECRET, 'refresh');
