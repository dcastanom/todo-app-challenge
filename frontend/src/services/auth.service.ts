import type {
  ApiResponse,
  AuthResponse,
  LoginInput,
  RegisterInput,
  UsuarioPublico,
} from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';
import { tokenStorage } from './token-storage.js';

export class AuthApi {
  constructor(private readonly http: HttpClient) {}

  private async authenticate(
    url: string,
    body: LoginInput | RegisterInput,
  ): Promise<UsuarioPublico> {
    const { data } = await this.http.post<ApiResponse<AuthResponse>>(url, body);
    tokenStorage.save(data.tokens);
    return data.usuario;
  }

  register(input: RegisterInput): Promise<UsuarioPublico> {
    return this.authenticate('/auth/register', input);
  }

  login(input: LoginInput): Promise<UsuarioPublico> {
    return this.authenticate('/auth/login', input);
  }

  async profile(): Promise<UsuarioPublico> {
    const { data } = await this.http.get<ApiResponse<UsuarioPublico>>('/auth/profile');
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();
    try {
      await this.http.post('/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clear();
    }
  }
}

export const authApi = new AuthApi(httpClient);
