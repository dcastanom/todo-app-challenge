import type { AuthResponse, LoginInput, RegisterInput, UsuarioPublico } from '@todo/shared';
import type { Database } from '../../db/client.js';
import type { Usuario } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.js';
import { AuthRepository } from './auth.repository.js';
import { signTokenPair, verifyRefreshToken } from './jwt.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  blacklist,
  forgetRefreshToken,
  isRefreshTokenActive,
  rememberRefreshToken,
  secondsUntil,
} from './token-store.js';

function toPublic(u: Usuario): UsuarioPublico {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    nombreCompleto: u.nombreCompleto,
    fotoPerfilUrl: u.fotoPerfilUrl,
    createdAt: u.createdAt.toISOString(),
  };
}

export class AuthService {
  private readonly repo: AuthRepository;

  constructor(db: Database) {
    this.repo = new AuthRepository(db);
  }

  private async issueSession(user: Usuario): Promise<AuthResponse> {
    const pair = signTokenPair(user);
    await rememberRefreshToken(pair.refresh.jti, user.id, pair.refresh.expiresInSeconds);
    await this.repo.touchLastLogin(user.id);
    return {
      usuario: toPublic(user),
      tokens: {
        accessToken: pair.access.token,
        refreshToken: pair.refresh.token,
        expiresIn: pair.access.expiresInSeconds,
      },
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    if (await this.repo.existsEmailOrUsername(input.email, input.username)) {
      throw new AppError(409, 'USUARIO_EXISTE', 'El email o usuario ya está registrado');
    }
    const user = await this.repo.create({
      email: input.email,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      nombreCompleto: input.nombreCompleto ?? null,
    });
    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repo.findByEmail(input.email);
    const ok = user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos');
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = verifyRefreshToken(refreshToken);
    if (!(await isRefreshTokenActive(payload.jti, payload.sub))) {
      throw new AppError(401, 'REFRESH_INVALIDO', 'Sesión expirada, vuelve a iniciar sesión');
    }
    const user = await this.repo.findById(payload.sub);
    if (!user) throw new AppError(401, 'REFRESH_INVALIDO', 'Usuario no encontrado');

    // Rotate: the presented refresh token is single-use.
    await forgetRefreshToken(payload.jti);
    await blacklist(payload.jti, secondsUntil(payload.exp));
    return this.issueSession(user);
  }

  async logout(accessJti: string, accessExp: number, refreshToken?: string): Promise<void> {
    await blacklist(accessJti, secondsUntil(accessExp));
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await forgetRefreshToken(payload.jti);
        await blacklist(payload.jti, secondsUntil(payload.exp));
      } catch {
        // A malformed/expired refresh token on logout is not an error.
      }
    }
  }

  async me(userId: string): Promise<UsuarioPublico> {
    const user = await this.repo.findById(userId);
    if (!user) throw new AppError(404, 'NO_ENCONTRADO', 'Usuario no encontrado');
    return toPublic(user);
  }
}
