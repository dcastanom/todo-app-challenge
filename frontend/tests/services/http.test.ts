import { AxiosError, AxiosHeaders } from 'axios';
import type * as Axios from 'axios';
import { HttpError } from '../../src/services/http.js';
import { tokenStorage } from '../../src/services/token-storage.js';

type Fn = ReturnType<typeof vi.fn>;
type RequestHandler = (config: { headers: AxiosHeaders }) => { headers: AxiosHeaders };
type ErrorHandler = (error: unknown) => Promise<unknown>;

interface FakeInstance extends Fn {
  request: Fn;
  interceptors: {
    request: { use: Fn; handler?: RequestHandler };
    response: { use: Fn; onError?: ErrorHandler };
  };
  defaults: { baseURL: string };
}

const hoisted = vi.hoisted(() => {
  const post = vi.fn();
  const instanceRef: { current?: unknown } = {};
  return { post, instanceRef };
});

function buildInstance(): FakeInstance {
  const instance = vi.fn() as unknown as FakeInstance;
  instance.request = vi.fn();
  instance.interceptors = {
    request: {
      use: vi.fn((h: RequestHandler) => {
        instance.interceptors.request.handler = h;
      }),
    },
    response: {
      use: vi.fn((_ok: unknown, err: ErrorHandler) => {
        instance.interceptors.response.onError = err;
      }),
    },
  };
  instance.defaults = { baseURL: '/api/v1' };
  hoisted.instanceRef.current = instance;
  return instance;
}

vi.mock('axios', async (orig) => {
  const actual = await orig<typeof Axios>();
  return {
    ...actual,
    default: { ...actual.default, create: buildInstance, post: hoisted.post },
  };
});

const { AxiosHttpClient } = await import('../../src/services/http.js');
const inst = (): FakeInstance => hoisted.instanceRef.current as FakeInstance;

function axiosError(status: number, code: string, config: object = {}): AxiosError {
  return new AxiosError('boom', 'ERR', config as never, undefined, {
    status,
    data: { error: { code, message: `msg-${code}` } },
    statusText: '',
    headers: {},
    config: config as never,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AxiosHttpClient', () => {
  it('returns response data on success', async () => {
    const client = new AxiosHttpClient('/api/v1');
    inst().request.mockResolvedValue({ data: { ok: 1 } });
    await expect(client.get('/x')).resolves.toEqual({ ok: 1 });
  });

  it('maps an error response to HttpError with the body code', async () => {
    const client = new AxiosHttpClient('/api/v1');
    inst().request.mockRejectedValue(axiosError(422, 'VALIDATION_ERROR'));
    await expect(client.post('/x', {})).rejects.toMatchObject({
      name: 'HttpError',
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('maps a 429 with no envelope to a RATE_LIMIT-less generic HttpError', async () => {
    const client = new AxiosHttpClient('/api/v1');
    const err = new AxiosError('rate', 'ERR', {} as never, undefined, {
      status: 429,
      data: 'Too many requests',
      statusText: '',
      headers: {},
      config: {} as never,
    });
    inst().request.mockRejectedValue(err);
    await expect(client.get('/x')).rejects.toMatchObject({ status: 429, code: 'NETWORK_ERROR' });
  });

  it('attaches the stored access token to requests', () => {
    tokenStorage.save({ accessToken: 'tok', refreshToken: 'r' });
    new AxiosHttpClient('/api/v1');
    const cfg = inst().interceptors.request.handler?.({ headers: new AxiosHeaders() });
    expect(cfg?.headers.Authorization).toBe('Bearer tok');
  });

  it('refreshes once on a 401 and retries the original request', async () => {
    tokenStorage.save({ accessToken: 'old', refreshToken: 'refresh-1' });
    hoisted.post.mockResolvedValue({
      data: { data: { tokens: { accessToken: 'new', refreshToken: 'refresh-2' } } },
    });
    new AxiosHttpClient('/api/v1');
    inst().mockResolvedValue({ data: { retried: true } });

    const result = await inst().interceptors.response.onError?.(
      axiosError(401, 'NO_AUTENTICADO', { url: '/tareas', headers: new AxiosHeaders() }),
    );

    expect(hoisted.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      refreshToken: 'refresh-1',
    });
    expect(tokenStorage.getAccess()).toBe('new');
    expect(result).toEqual({ data: { retried: true } });
  });

  it('clears the session and rejects when refresh fails', async () => {
    tokenStorage.save({ accessToken: 'old', refreshToken: 'bad' });
    hoisted.post.mockRejectedValue(new Error('401'));
    new AxiosHttpClient('/api/v1');

    await expect(
      inst().interceptors.response.onError?.(
        axiosError(401, 'NO_AUTENTICADO', { url: '/tareas', headers: new AxiosHeaders() }),
      ),
    ).rejects.toBeInstanceOf(HttpError);
    expect(tokenStorage.getAccess()).toBeNull();
  });
});
