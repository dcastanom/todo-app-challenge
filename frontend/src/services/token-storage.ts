import type { TokenPair } from '@todo/shared';

const ACCESS = 'todo.accessToken';
const REFRESH = 'todo.refreshToken';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccess: (): string | null => safeGet(ACCESS),
  getRefresh: (): string | null => safeGet(REFRESH),

  save(tokens: Pick<TokenPair, 'accessToken' | 'refreshToken'>): void {
    try {
      localStorage.setItem(ACCESS, tokens.accessToken);
      localStorage.setItem(REFRESH, tokens.refreshToken);
    } catch {
      /* private mode / storage disabled — session stays in memory only */
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
    } catch {
      /* ignore */
    }
  },
};
