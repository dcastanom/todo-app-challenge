import { useCallback, useEffect, useReducer, useState } from 'react';
import { REALTIME_EVENTS, type EstadisticasDTO } from '@todo/shared';
import { estadisticasApi } from '../services/estadisticas.service.js';
import { HttpError } from '../services/http.js';
import { on as onRealtime } from '../services/socket.service.js';

const REALTIME_RELOAD_DEBOUNCE_MS = 200;

interface State {
  data: EstadisticasDTO | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
}

type Action =
  | { type: 'LOADING' }
  | { type: 'LOADED'; data: EstadisticasDTO }
  | { type: 'ERROR'; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', error: null };
    case 'LOADED':
      return { data: action.data, status: 'ready', error: null };
    case 'ERROR':
      return { ...state, status: 'error', error: action.message };
  }
}

const msg = (err: unknown, fallback: string): string =>
  err instanceof HttpError ? err.message : fallback;

export interface UseEstadisticas extends State {
  dias: number;
  setDias: (dias: number) => void;
  refresh: () => Promise<void>;
}

/** Fetches the per-user stats summary and keeps it live: refetches on any
 *  task/category/tag realtime event (own-tab changes included — unlike the
 *  task list, this dashboard has no optimistic local copy to protect). */
export function useEstadisticas(diasInicial = 14): UseEstadisticas {
  const [dias, setDias] = useState(diasInicial);
  const [state, dispatch] = useReducer(reducer, { data: null, status: 'loading', error: null });

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      dispatch({ type: 'LOADED', data: await estadisticasApi.resumen(dias) });
    } catch (err) {
      dispatch({ type: 'ERROR', message: msg(err, 'No se pudieron cargar las estadísticas') });
    }
  }, [dias]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleReload = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), REALTIME_RELOAD_DEBOUNCE_MS);
    };
    const unsubscribers = [
      onRealtime(REALTIME_EVENTS.TAREA_CREADA, scheduleReload),
      onRealtime(REALTIME_EVENTS.TAREA_ACTUALIZADA, scheduleReload),
      onRealtime(REALTIME_EVENTS.TAREA_ELIMINADA, scheduleReload),
      onRealtime(REALTIME_EVENTS.TAREAS_REORDENADAS, scheduleReload),
      onRealtime(REALTIME_EVENTS.TAREAS_CAMBIO_MASIVO, scheduleReload),
      onRealtime(REALTIME_EVENTS.CATEGORIAS_CAMBIARON, scheduleReload),
    ];
    return () => {
      clearTimeout(timer);
      unsubscribers.forEach((off) => off());
    };
  }, [load]);

  return { ...state, dias, setDias, refresh: load };
}
