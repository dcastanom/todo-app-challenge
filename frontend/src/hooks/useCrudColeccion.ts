import { useCallback, useEffect, useReducer } from 'react';
import type { RealtimeEvent } from '@todo/shared';
import { HttpError } from '../services/http.js';
import { on as onRealtime } from '../services/socket.service.js';

/** Debounce window for realtime-triggered reloads. */
const REALTIME_RELOAD_DEBOUNCE_MS = 200;

export interface CrudApi<T extends { id: string }, C, U> {
  list: () => Promise<T[]>;
  create: (input: C) => Promise<T>;
  update: (id: string, input: U) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

interface State<T> {
  items: T[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
}

type Action<T> =
  | { type: 'LOADING' }
  | { type: 'LOADED'; items: T[] }
  | { type: 'ERROR'; message: string }
  | { type: 'UPSERT'; item: T }
  | { type: 'REMOVE'; id: string };

function reducer<T extends { id: string }>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', error: null };
    case 'LOADED':
      return { items: action.items, status: 'ready', error: null };
    case 'ERROR':
      return { ...state, status: 'error', error: action.message };
    case 'UPSERT': {
      const exists = state.items.some((i) => i.id === action.item.id);
      return {
        ...state,
        items: exists
          ? state.items.map((i) => (i.id === action.item.id ? action.item : i))
          : [...state.items, action.item],
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
  }
}

const msg = (err: unknown, fallback: string): string =>
  err instanceof HttpError ? err.message : fallback;

export interface CrudColeccion<T, C, U> {
  items: T[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  crear: (input: C) => Promise<T>;
  actualizar: (id: string, input: U) => Promise<T>;
  eliminar: (id: string) => Promise<void>;
}

export function useCrudColeccion<T extends { id: string }, C, U>(
  api: CrudApi<T, C, U>,
  onChange?: () => void,
  /** Realtime event that means "another tab changed this collection" —
   *  e.g. `categorias:cambiaron`. Omit for collections with no realtime feed. */
  realtimeEvent?: RealtimeEvent,
): CrudColeccion<T, C, U> {
  const [state, dispatch] = useReducer(reducer<T>, { items: [], status: 'loading', error: null });

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      dispatch({ type: 'LOADED', items: await api.list() });
    } catch (err) {
      dispatch({ type: 'ERROR', message: msg(err, 'No se pudo cargar') });
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!realtimeEvent) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onRealtime(realtimeEvent, () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), REALTIME_RELOAD_DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [realtimeEvent, refresh]);

  const crear = useCallback(
    async (input: C) => {
      const item = await api.create(input);
      dispatch({ type: 'UPSERT', item });
      onChange?.();
      return item;
    },
    [api, onChange],
  );

  const actualizar = useCallback(
    async (id: string, input: U) => {
      const item = await api.update(id, input);
      dispatch({ type: 'UPSERT', item });
      onChange?.();
      return item;
    },
    [api, onChange],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await api.remove(id);
      dispatch({ type: 'REMOVE', id });
      onChange?.();
    },
    [api, onChange],
  );

  return { ...state, refresh, crear, actualizar, eliminar };
}
