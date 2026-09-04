import { renderHook, waitFor } from '@testing-library/react';
import { REALTIME_EVENTS } from '@todo/shared';
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

const realtime = vi.hoisted(() => ({ on: vi.fn() }));
vi.mock('../../src/services/socket.service.js', () => ({ on: realtime.on }));

beforeEach(() => {
  vi.clearAllMocks();
  api.list.mockResolvedValue(page([tarea({ id: 'a' })]));
});

describe('useTodos realtime sync', () => {
  it('subscribes to every task realtime event and refetches when one fires', async () => {
    const handlers: Record<string, () => void> = {};
    realtime.on.mockImplementation((event: string, h: () => void) => {
      handlers[event] = h;
      return vi.fn();
    });

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    for (const event of [
      REALTIME_EVENTS.TAREA_CREADA,
      REALTIME_EVENTS.TAREA_ACTUALIZADA,
      REALTIME_EVENTS.TAREA_ELIMINADA,
      REALTIME_EVENTS.TAREAS_REORDENADAS,
      REALTIME_EVENTS.TAREAS_CAMBIO_MASIVO,
    ]) {
      expect(handlers[event]).toBeInstanceOf(Function);
    }

    api.list.mockClear();
    handlers[REALTIME_EVENTS.TAREA_ACTUALIZADA]?.();
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(1));
  });

  it('unsubscribes every listener on unmount', async () => {
    const unsubscribers = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    let i = 0;
    realtime.on.mockImplementation(() => unsubscribers[i++]);

    const { result, unmount } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    unmount();

    unsubscribers.forEach((off) => expect(off).toHaveBeenCalled());
  });
});
