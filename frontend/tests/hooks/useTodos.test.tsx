import { act, renderHook, waitFor } from '@testing-library/react';
import { useTodos } from '../../src/hooks/useTodos.js';
import { makePage as page, makeTarea as tarea } from '../factories.js';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setCompletada: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
  batch: vi.fn(),
}));
vi.mock('../../src/services/tareas.service.js', () => ({ tareasApi: api }));

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue(page([tarea({ id: 'a' }), tarea({ id: 'b', titulo: 'B' })]));
});

describe('useTodos', () => {
  it('loads the first page on mount', async () => {
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.tareas).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('optimistically toggles completion and keeps the server result', async () => {
    api.setCompletada.mockResolvedValue(tarea({ id: 'a', completada: true, completadaEn: 'x' }));
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.toggleCompletada('a');
    });

    expect(api.setCompletada).toHaveBeenCalledWith('a');
    expect(result.current.tareas.find((t) => t.id === 'a')?.completada).toBe(true);
  });

  it('reverts an optimistic toggle when the request fails', async () => {
    api.setCompletada.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.toggleCompletada('a');
    });

    expect(result.current.tareas.find((t) => t.id === 'a')?.completada).toBe(false);
    expect(result.current.error).toMatch(/no se pudo/i);
  });

  it('creates a task and refetches', async () => {
    api.create.mockResolvedValue(tarea({ id: 'c' }));
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    api.list.mockClear();

    await act(async () => {
      await result.current.crear({
        titulo: 'nueva',
        descripcion: null,
        prioridad: 'normal',
        fechaVencimiento: null,
        categoriaId: null,
      });
    });

    expect(api.create).toHaveBeenCalled();
    expect(api.list).toHaveBeenCalled();
  });

  it('removes a task optimistically', async () => {
    api.remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.eliminar('a');
    });

    expect(api.remove).toHaveBeenCalledWith('a');
  });

  it('reorders optimistically and persists the new id order', async () => {
    api.reorder.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.mover(0, 1);
    });

    expect(result.current.tareas.map((t) => t.id)).toEqual(['b', 'a']);
    expect(api.reorder).toHaveBeenCalledWith(['b', 'a']);
  });

  it('reverts the order when the reorder request fails', async () => {
    api.reorder.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.mover(0, 1);
    });

    expect(result.current.tareas.map((t) => t.id)).toEqual(['a', 'b']);
    expect(result.current.error).toMatch(/reordenar/i);
  });

  it('applies a batch action and refetches', async () => {
    api.batch.mockResolvedValue({ afectadas: 2 });
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    api.list.mockClear();

    await act(async () => {
      await result.current.batch({ ids: ['a', 'b'], accion: { tipo: 'eliminar' } });
    });

    expect(api.batch).toHaveBeenCalledWith({ ids: ['a', 'b'], accion: { tipo: 'eliminar' } });
    expect(api.list).toHaveBeenCalled();
  });

  it('surfaces a batch failure as an error', async () => {
    api.batch.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.batch({ ids: ['a'], accion: { tipo: 'completar', completada: true } });
    });
    expect(result.current.error).toMatch(/no se pudo aplicar/i);
  });

  it('passes filters to the API and resets to page 1 when they change', async () => {
    const { result, rerender } = renderHook(
      ({ f }: { f: Record<string, unknown> }) => useTodos(f),
      { initialProps: { f: {} } },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    rerender({ f: { prioridad: 'alta', busqueda: 'x' } });

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, prioridad: 'alta', busqueda: 'x' }),
      );
    });
    expect(result.current.page).toBe(1);
  });
});
