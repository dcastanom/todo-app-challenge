/**
 * localStorage that never throws (private mode, disabled storage, quota) and
 * transparently JSON-encodes values. A missing/corrupt entry reads as `null`.
 */
export const safeStorage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore — feature degrades to in-memory only */
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
