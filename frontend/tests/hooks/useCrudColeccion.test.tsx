import { act, renderHook, waitFor } from '@testing-library/react';
import { useCrudColeccion, type CrudApi } from '../../src/hooks/useCrudColeccion.js';

interface Item {
  id: string;
  nombre: string;
}
type ItemApi = CrudApi<Item, { nombre: string }, { nombre?: string }>;

function makeApi(initial: Item[]): ItemApi {
  const store = [...initial];
  return {
    list: vi.fn().mockImplementation(() => Promise.resolve([...store])),
    create: vi.fn().mockImplementation((input: { nombre: string }) => {
      const item = { id: `id-${String(store.length + 1)}`, nombre: input.nombre };
      store.push(item);
      return Promise.resolve(item);
    }),
    update: vi.fn().mockImplementation((id: string, input: { nombre?: string }) => {
      const item = { id, nombre: input.nombre ?? 'x' };
      return Promise.resolve(item);
    }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe('useCrudColeccion', () => {
  it('loads items on mount', async () => {
    const api = makeApi([{ id: '1', nombre: 'uno' }]);
    const { result } = renderHook(() => useCrudColeccion(api));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(1);
  });

  it('adds a created item and calls onChange', async () => {
    const api = makeApi([]);
    const onChange = vi.fn();
    const { result } = renderHook(() => useCrudColeccion(api, onChange));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.crear({ nombre: 'nuevo' });
    });

    expect(result.current.items).toEqual([{ id: 'id-1', nombre: 'nuevo' }]);
    expect(onChange).toHaveBeenCalled();
  });

  it('updates and removes items', async () => {
    const api = makeApi([{ id: '1', nombre: 'viejo' }]);
    const { result } = renderHook(() => useCrudColeccion(api));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.actualizar('1', { nombre: 'nuevo' });
    });
    expect(result.current.items[0]?.nombre).toBe('nuevo');

    await act(async () => {
      await result.current.eliminar('1');
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('reports a load error', async () => {
    const api = makeApi([]);
    vi.mocked(api.list).mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useCrudColeccion(api));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeTruthy();
  });
});
