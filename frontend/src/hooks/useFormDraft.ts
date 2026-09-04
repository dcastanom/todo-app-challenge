import { useCallback, useEffect, useRef, useState } from 'react';
import { safeStorage } from '../lib/safe-storage.js';

const PREFIX = 'todo:draft:';

export interface FormDraft<T> {
  /** The persisted draft found on mount, if any. */
  initial: T | null;
  /** Debounced-ish: call on every change to persist the latest values. */
  save: (values: T) => void;
  /** Call after a successful submit (or explicit discard). */
  clear: () => void;
}

/**
 * Persists an in-progress form to localStorage so a reload — or going offline
 * mid-edit — doesn't lose work. Keyed by `key`; pass a stable key per form.
 */
export function useFormDraft<T>(key: string): FormDraft<T> {
  const storageKey = PREFIX + key;
  const [initial] = useState<T | null>(() => safeStorage.get<T>(storageKey));
  const cleared = useRef(false);

  const save = useCallback(
    (values: T) => {
      if (cleared.current) return;
      safeStorage.set(storageKey, values);
    },
    [storageKey],
  );

  const clear = useCallback(() => {
    cleared.current = true;
    safeStorage.remove(storageKey);
  }, [storageKey]);

  // Reset the "cleared" latch if the key changes (different form instance).
  useEffect(() => {
    cleared.current = false;
  }, [storageKey]);

  return { initial, save, clear };
}
