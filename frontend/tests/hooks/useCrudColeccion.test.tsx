import { renderHook, waitFor } from '@testing-library/react';
import { REALTIME_EVENTS } from '@todo/shared';
import { useCrudColeccion, type CrudApi } from '../../src/hooks/useCrudColeccion.js';

const realtime = vi.hoisted(() => ({ on: vi.fn() }));
vi.mock('../../src/services/socket.service.js', () => ({ on: realtime.on }));

interface Item {
  id: string;
  nombre: string;
}

function makeApi(): CrudApi<Item, { nombre: string }, { nombre: string }> {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCrudColeccion realtime refresh', () => {
  it('refetches when the given realtime event fires (debounced)', async () => {
    const api = makeApi();
    let handler: (() => void) | undefined;
    const unsubscribe = vi.fn();
    realtime.on.mockImplementation((_event: string, h: () => void) => {
      handler = h;
      return unsubscribe;
    });

    const { result } = renderHook(() =>
      useCrudColeccion(api, undefined, REALTIME_EVENTS.CATEGORIAS_CAMBIARON),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(realtime.on).toHaveBeenCalledWith(
      REALTIME_EVENTS.CATEGORIAS_CAMBIARON,
      expect.any(Function),
    );
    (api.list as ReturnType<typeof vi.fn>).mockClear();

    handler?.();
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(1));
  });

  it('does not subscribe to anything when no realtime event is given', async () => {
    const api = makeApi();
    const { result } = renderHook(() => useCrudColeccion(api));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(realtime.on).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', async () => {
    const api = makeApi();
    const unsubscribe = vi.fn();
    realtime.on.mockReturnValue(unsubscribe);

    const { result, unmount } = renderHook(() =>
      useCrudColeccion(api, undefined, REALTIME_EVENTS.ETIQUETAS_CAMBIARON),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
