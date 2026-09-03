/** The user shape safe to return to clients (no password hash). */
export interface UsuarioPublico {
  id: string;
  email: string;
  username: string;
  nombreCompleto: string | null;
  fotoPerfilUrl: string | null;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthResponse {
  usuario: UsuarioPublico;
  tokens: TokenPair;
}

/** Decoded JWT payload used by both tokens. */
export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}
