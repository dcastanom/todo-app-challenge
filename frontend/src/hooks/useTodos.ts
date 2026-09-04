import { useCallback, useEffect, useReducer } from 'react';
import type {
  ActualizarTareaInput,
  BatchTareasInput,
  CampoOrden,
  CrearTareaInput,
  DireccionOrden,
  TareaDTO,
  TareaFiltros,
} from '@todo/shared';
import { PAGINACION } from '@todo/shared';
import { moverItem } from '../lib/reordenar.js';
import { HttpError } from '../services/http.js';
import { tareasApi } from '../services/tareas.service.js';

interface State {
  tareas: TareaDTO[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  orden: CampoOrden;
  direccion: DireccionOrden;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
}

type Action =
  | { type: 'LOADING' }
  | { type: 'LOADED'; tareas: TareaDTO[]; total: number; totalPages: number; page: number }
  | { type: 'ERROR'; message: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_SORT'; orden: CampoOrden; direccion: DireccionOrden }
  | { type: 'UPSERT'; tarea: TareaDTO }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_TAREAS'; tareas: TareaDTO[] };

const initialState: State = {
  tareas: [],
  total: 0,
  totalPages: 1,
  page: 1,
  limit: PAGINACION.LIMIT_DEFAULT,
  orden: 'created_at',
  direccion: 'desc',
  status: 'loading',
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', error: null };
    case 'LOADED':
      return {
        ...state,
        status: 'ready',
        error: null,
        tareas: action.tareas,
        total: action.total,
        totalPages: action.totalPages,
        page: action.page,
      };
    case 'ERROR':
      return { ...state, status: 'error', error: action.message };
    case 'SET_PAGE':
      return { ...state, page: action.page };
    case 'SET_SORT':
      return { ...state, orden: action.orden, direccion: action.direccion, page: 1 };
    case 'UPSERT':
      return {
        ...state,
        tareas: state.tareas.map((t) => (t.id === action.tarea.id ? action.tarea : t)),
      };
    case 'REMOVE':
      return {
        ...state,
        tareas: state.tareas.filter((t) => t.id !== action.id),
        total: state.total - 1,
      };
    case 'SET_TAREAS':
      return { ...state, tareas: action.tareas };
  }
}

const msg = (err: unknown, fallback: string): string =>
  err instanceof HttpError ? err.message : fallback;

export interface UseTodos extends State {
  setPage: (page: number) => void;
  setSort: (orden: CampoOrden, direccion: DireccionOrden) => void;
  refresh: () => Promise<void>;
  crear: (input: CrearTareaInput) => Promise<void>;
  actualizar: (id: string, input: ActualizarTareaInput) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  toggleCompletada: (id: string) => Promise<void>;
  /** Moves the visible task at `from` to `to` and persists the new order. */
  mover: (from: number, to: number) => Promise<void>;
  /** Applies a bulk action, then refetches the current page. */
  batch: (input: BatchTareasInput) => Promise<void>;
}

export function useTodos(filtros: TareaFiltros = {}): UseTodos {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { page, limit, orden, direccion } = state;
  const filtrosKey = JSON.stringify(filtros);

  // A filter change always sends the user back to page 1.
  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 1 });
  }, [filtrosKey]);

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await tareasApi.list({ page, limit, orden, direccion, ...filtros });
      dispatch({
        type: 'LOADED',
        tareas: res.data,
        total: res.meta.total,
        totalPages: res.meta.totalPages,
        page: res.meta.page,
      });
    } catch (err) {
      dispatch({ type: 'ERROR', message: msg(err, 'No se pudieron cargar las tareas') });
    }
    // `filtrosKey` (a JSON string) is the stable dependency that stands in
    // for the `filtros` object read in the body.
  }, [page, limit, orden, direccion, filtrosKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const crear = useCallback(
    async (input: CrearTareaInput) => {
      await tareasApi.create(input);
      await load();
    },
    [load],
  );

  const actualizar = useCallback(async (id: string, input: ActualizarTareaInput) => {
    const updated = await tareasApi.update(id, input);
    dispatch({ type: 'UPSERT', tarea: updated });
  }, []);

  const eliminar = useCallback(
    async (id: string) => {
      dispatch({ type: 'REMOVE', id });
      try {
        await tareasApi.remove(id);
        await load();
      } catch (err) {
        dispatch({ type: 'ERROR', message: msg(err, 'No se pudo eliminar la tarea') });
        await load();
      }
    },
    [load],
  );

  const mover = useCallback(
    async (from: number, to: number) => {
      const previo = state.tareas;
      const siguiente = moverItem(previo, from, to);
      if (siguiente === previo) return;
      dispatch({ type: 'SET_TAREAS', tareas: siguiente });
      try {
        await tareasApi.reorder(siguiente.map((t) => t.id));
      } catch (err) {
        dispatch({ type: 'SET_TAREAS', tareas: previo });
        dispatch({ type: 'ERROR', message: msg(err, 'No se pudo reordenar') });
      }
    },
    [state.tareas],
  );

  const batch = useCallback(
    async (input: BatchTareasInput) => {
      try {
        await tareasApi.batch(input);
        await load();
      } catch (err) {
        dispatch({ type: 'ERROR', message: msg(err, 'No se pudo aplicar la acción') });
      }
    },
    [load],
  );

  const toggleCompletada = useCallback(
    async (id: string) => {
      const current = state.tareas.find((t) => t.id === id);
      if (!current) return;
      dispatch({
        type: 'UPSERT',
        tarea: { ...current, completada: !current.completada },
      });
      try {
        const updated = await tareasApi.setCompletada(id);
        dispatch({ type: 'UPSERT', tarea: updated });
      } catch (err) {
        dispatch({ type: 'UPSERT', tarea: current });
        dispatch({ type: 'ERROR', message: msg(err, 'No se pudo actualizar la tarea') });
      }
    },
    [state.tareas],
  );

  return {
    ...state,
    setPage: (p) => dispatch({ type: 'SET_PAGE', page: p }),
    setSort: (o, d) => dispatch({ type: 'SET_SORT', orden: o, direccion: d }),
    refresh: load,
    crear,
    actualizar,
    eliminar,
    toggleCompletada,
    mover,
    batch,
  };
}
