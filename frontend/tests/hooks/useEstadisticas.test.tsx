import { act, renderHook, waitFor } from '@testing-library/react';
import { REALTIME_EVENTS } from '@todo/shared';
import { useEstadisticas } from '../../src/hooks/useEstadisticas.js';
import { makeEstadisticas } from '../factories.js';

const api = vi.hoisted(() => ({ resumen: vi.fn() }));
vi.mock('../../src/services/estadisticas.service.js', () => ({ estadisticasApi: api }));

const realtime = vi.hoisted(() => ({ on: vi.fn() }));
vi.mock('../../src/services/socket.service.js', () => ({ on: realtime.on }));

beforeEach(() => {
  vi.clearAllMocks();
  realtime.on.mockReturnValue(vi.fn());
  api.resumen.mockResolvedValue(makeEstadisticas());
});

describe('useEstadisticas', () => {
  it('loads the summary for the default 14-day window', async () => {
    const { result } = renderHook(() => useEstadisticas());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.resumen).toHaveBeenCalledWith(14);
    expect(result.current.data?.total).toBe(3);
  });

  it('refetches with the new window when setDias changes it', async () => {
    const { result } = renderHook(() => useEstadisticas());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.setDias(30));

    await waitFor(() => expect(api.resumen).toHaveBeenLastCalledWith(30));
  });

  it('surfaces a load failure', async () => {
    api.resumen.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useEstadisticas());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/no se pudieron cargar/i);
  });

  it('refetches when a task/category realtime event fires', async () => {
    const handlers: (() => void)[] = [];
    realtime.on.mockImplementation((_event: string, h: () => void) => {
      handlers.push(h);
      return vi.fn();
    });

    const { result } = renderHook(() => useEstadisticas());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(realtime.on).toHaveBeenCalledWith(
      REALTIME_EVENTS.CATEGORIAS_CAMBIARON,
      expect.any(Function),
    );

    api.resumen.mockClear();
    handlers.forEach((h) => h());
    await waitFor(() => expect(api.resumen).toHaveBeenCalled());
  });
});
