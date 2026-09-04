import { useCallback, useMemo, useState } from 'react';

export interface UseSeleccion {
  seleccionados: Set<string>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Adds every id in `ids`, or clears them all if they are already selected. */
  toggleTodos: (ids: string[]) => void;
  clear: () => void;
}

/** Tracks a set of selected task ids for batch operations. */
export function useSeleccion(): UseSeleccion {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTodos = useCallback((ids: string[]) => {
    setSeleccionados((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }, []);

  const clear = useCallback(() => setSeleccionados(new Set()), []);

  const isSelected = useCallback((id: string) => seleccionados.has(id), [seleccionados]);

  return useMemo(
    () => ({ seleccionados, count: seleccionados.size, isSelected, toggle, toggleTodos, clear }),
    [seleccionados, isSelected, toggle, toggleTodos, clear],
  );
}
