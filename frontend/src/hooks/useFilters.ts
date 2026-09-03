import { useCallback, useMemo, useState } from 'react';
import type { TareaFiltros } from '@todo/shared';

export interface UseFilters {
  filtros: TareaFiltros;
  set: <K extends keyof TareaFiltros>(key: K, value: TareaFiltros[K] | undefined) => void;
  toggleEtiqueta: (nombre: string) => void;
  clear: () => void;
  /** Number of active (non-empty) filters. */
  activos: number;
}

function limpiar(filtros: TareaFiltros): TareaFiltros {
  const out: TareaFiltros = {};
  for (const [k, v] of Object.entries(filtros)) {
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function useFilters(initial: TareaFiltros = {}): UseFilters {
  const [filtros, setFiltros] = useState<TareaFiltros>(() => limpiar(initial));

  const set = useCallback<UseFilters['set']>((key, value) => {
    setFiltros((prev) => limpiar({ ...prev, [key]: value }));
  }, []);

  const toggleEtiqueta = useCallback((nombre: string) => {
    setFiltros((prev) => {
      const current = prev.etiquetas ?? [];
      const next = current.includes(nombre)
        ? current.filter((n) => n !== nombre)
        : [...current, nombre];
      return limpiar({ ...prev, etiquetas: next });
    });
  }, []);

  const clear = useCallback(() => setFiltros({}), []);

  const activos = useMemo(() => Object.keys(filtros).length, [filtros]);

  return { filtros, set, toggleEtiqueta, clear, activos };
}
