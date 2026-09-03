import { act, renderHook, waitFor } from '@testing-library/react';
import { useTodos } from '../../src/hooks/useTodos.js';
import { makePage as page, makeTarea as tarea } from '../factories.js';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setCompletada: vi.fn(),
  remove: vi.fn(),
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
});
