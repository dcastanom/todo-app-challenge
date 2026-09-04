import type { HttpClient } from '../../src/services/http.js';
import { AuthApi } from '../../src/services/auth.service.js';
import { CategoriasApi } from '../../src/services/categorias.service.js';
import { EtiquetasApi } from '../../src/services/etiquetas.service.js';
import { TareasApi } from '../../src/services/tareas.service.js';
import { tokenStorage } from '../../src/services/token-storage.js';
import { makeCategoria, makeEtiqueta, makeTarea } from '../factories.js';

type MockHttp = { [K in keyof HttpClient]: ReturnType<typeof vi.fn> };

function mockHttp(): HttpClient & MockHttp {
  const noBody = (): Promise<unknown> => Promise.resolve({ data: undefined });
  return {
    get: vi.fn(noBody),
    post: vi.fn(noBody),
    put: vi.fn(noBody),
    patch: vi.fn(noBody),
    delete: vi.fn(noBody),
    getRaw: vi.fn(() => Promise.resolve({ data: new Blob(['x']), headers: {} })),
  } as unknown as HttpClient & MockHttp;
}

beforeEach(() => {
  localStorage.clear();
});

describe('AuthApi', () => {
  it('logs in, persists tokens and fetches the profile', async () => {
    const http = mockHttp();
    http.post.mockResolvedValue({
      data: { usuario: { id: '1' }, tokens: { accessToken: 'a', refreshToken: 'r' } },
    });
    http.get.mockResolvedValue({ data: { id: '1', email: 'x@y.z' } });
    const api = new AuthApi(http);

    await api.login({ email: 'x@y.z', password: 'p' });
    expect(tokenStorage.getAccess()).toBe('a');

    await api.profile();
    expect(http.get).toHaveBeenCalledWith('/auth/profile');
  });

  it('clears tokens on logout even if the request fails', async () => {
    tokenStorage.save({ accessToken: 'a', refreshToken: 'r' });
    const http = mockHttp();
    http.post.mockRejectedValue(new Error('network'));
    await new AuthApi(http).logout();
    expect(tokenStorage.getAccess()).toBeNull();
  });
});

describe('resource API clients hit the right endpoints', () => {
  it('TareasApi', async () => {
    const http = mockHttp();
    http.get.mockResolvedValue({ data: makeTarea() });
    http.post.mockResolvedValue({ data: makeTarea() });
    http.put.mockResolvedValue({ data: makeTarea() });
    http.patch.mockResolvedValue({ data: makeTarea() });
    const api = new TareasApi(http);

    await api.list({ page: 2 });
    await api.get('t1');
    await api.create({
      titulo: 'x',
      descripcion: null,
      prioridad: 'normal',
      fechaVencimiento: null,
      categoriaId: null,
    });
    await api.update('t1', { titulo: 'y' });
    await api.setCompletada('t1');
    await api.remove('t1');

    expect(http.get).toHaveBeenCalledWith('/tareas', { params: { page: 2 } });
    expect(http.get).toHaveBeenCalledWith('/tareas/t1');
    expect(http.patch).toHaveBeenCalledWith('/tareas/t1/completar', { completada: undefined });
    expect(http.delete).toHaveBeenCalledWith('/tareas/t1');
  });

  it('TareasApi — reorder, batch and export', async () => {
    const http = mockHttp();
    http.patch.mockResolvedValue({ data: { afectadas: 2 } });
    http.getRaw.mockResolvedValue({
      data: new Blob(['id\n1']),
      headers: { 'content-disposition': 'attachment; filename="tareas-2026-01-01.csv"' },
    });
    const api = new TareasApi(http);

    await api.reorder(['b', 'a']);
    expect(http.patch).toHaveBeenCalledWith('/tareas/reorder', { ids: ['b', 'a'] });

    const res = await api.batch({ ids: ['a'], accion: { tipo: 'eliminar' } });
    expect(http.patch).toHaveBeenCalledWith('/tareas/batch', {
      ids: ['a'],
      accion: { tipo: 'eliminar' },
    });
    expect(res).toEqual({ afectadas: 2 });

    const exp = await api.exportar('csv', { prioridad: 'alta' });
    expect(http.getRaw).toHaveBeenCalledWith('/tareas/export', {
      params: { prioridad: 'alta', formato: 'csv' },
      responseType: 'blob',
    });
    expect(exp.filename).toBe('tareas-2026-01-01.csv');
  });

  it('CategoriasApi and EtiquetasApi', async () => {
    const http = mockHttp();
    http.get.mockResolvedValue({ data: [] });
    http.post.mockResolvedValue({ data: makeCategoria() });
    http.put.mockResolvedValue({ data: makeEtiqueta() });
    const cats = new CategoriasApi(http);
    const tags = new EtiquetasApi(http);

    await cats.list();
    await cats.create({ nombre: 'x', descripcion: null, color: '#3498db' });
    await cats.update('c1', { nombre: 'y' });
    await cats.remove('c1');
    await tags.list();
    await tags.create({ nombre: 'z', color: '#95a5a6' });
    await tags.update('e1', { color: '#000000' });
    await tags.remove('e1');

    expect(http.get).toHaveBeenCalledWith('/categorias');
    expect(http.get).toHaveBeenCalledWith('/etiquetas');
    expect(http.put).toHaveBeenCalledWith('/categorias/c1', { nombre: 'y' });
    expect(http.put).toHaveBeenCalledWith('/etiquetas/e1', { color: '#000000' });
  });
});
