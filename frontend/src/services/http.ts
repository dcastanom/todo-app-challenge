import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiResponse, AuthResponse } from '@todo/shared';
import { tokenStorage } from './token-storage.js';

/** Fired when a refresh attempt fails — AuthContext listens and logs out. */
export const SESSION_EXPIRED_EVENT = 'todo:session-expired';

/**
 * Adapter Pattern: the app depends on this interface, never on axios
 * directly. Swapping the transport is a one-file change and services stay
 * testable with a fake implementation.
 */
/** A response where the caller needs the headers/body envelope (e.g. file downloads). */
export interface RawResponse<T> {
  data: T;
  headers: Record<string, unknown>;
}

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  /** GET that resolves to the full `{ data, headers }` — used for downloads. */
  getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<RawResponse<T>>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as Partial<ApiError> | undefined;
    return new HttpError(
      status,
      body?.error?.code ?? 'NETWORK_ERROR',
      body?.error?.message ?? error.message,
      body?.error?.details,
    );
  }
  return new HttpError(0, 'UNKNOWN', error instanceof Error ? error.message : 'Error desconocido');
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export class AxiosHttpClient implements HttpClient {
  private readonly axios: AxiosInstance;
  private refreshing: Promise<string | null> | null = null;

  constructor(baseURL: string) {
    this.axios = axios.create({ baseURL, timeout: 15_000 });

    this.axios.interceptors.request.use((config) => {
      const token = tokenStorage.getAccess();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.axios.interceptors.response.use(
      (r) => r,
      async (error: unknown) => {
        if (!(error instanceof AxiosError) || error.response?.status !== 401) {
          return Promise.reject(toHttpError(error));
        }
        const original = error.config as RetriableConfig | undefined;
        if (!original || original._retried || original.url?.includes('/auth/')) {
          return Promise.reject(toHttpError(error));
        }
        const fresh = await this.refreshAccessToken();
        if (!fresh) {
          return Promise.reject(toHttpError(error));
        }
        original._retried = true;
        original.headers.Authorization = `Bearer ${fresh}`;
        return this.axios(original);
      },
    );
  }

  private refreshAccessToken(): Promise<string | null> {
    this.refreshing ??= (async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return null;
      try {
        const { data } = await axios.post<ApiResponse<AuthResponse>>(
          `${this.axios.defaults.baseURL ?? ''}/auth/refresh`,
          { refreshToken },
        );
        tokenStorage.save(data.data.tokens);
        return data.data.tokens.accessToken;
      } catch {
        tokenStorage.clear();
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        return null;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axios.request<T>(config);
      return response.data;
    } catch (error) {
      throw error instanceof HttpError ? error : toHttpError(error);
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }
  async getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<RawResponse<T>> {
    try {
      const response = await this.axios.request<T>({ ...config, method: 'GET', url });
      const headers: Record<string, unknown> = { ...response.headers };
      return { data: response.data, headers };
    } catch (error) {
      throw error instanceof HttpError ? error : toHttpError(error);
    }
  }
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data: body });
  }
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data: body });
  }
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data: body });
  }
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const httpClient: HttpClient = new AxiosHttpClient(
  import.meta.env.VITE_API_BASE_URL || '/api/v1',
);
