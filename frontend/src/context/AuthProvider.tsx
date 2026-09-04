import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { LoginInput, RegisterInput, UsuarioPublico } from '@todo/shared';
import { authApi } from '../services/auth.service.js';
import { HttpError, SESSION_EXPIRED_EVENT } from '../services/http.js';
import { connect, disconnect } from '../services/socket.service.js';
import { tokenStorage } from '../services/token-storage.js';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context.js';

interface State {
  user: UsuarioPublico | null;
  status: AuthStatus;
  error: string | null;
}

type Action =
  | { type: 'AUTHENTICATED'; user: UsuarioPublico }
  | { type: 'UNAUTHENTICATED' }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'AUTHENTICATED':
      return { user: action.user, status: 'authenticated', error: null };
    case 'UNAUTHENTICATED':
      return { user: null, status: 'unauthenticated', error: state.error };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
  }
}

const message = (err: unknown, fallback: string): string =>
  err instanceof HttpError ? err.message : fallback;

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    status: 'loading',
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.getAccess()) {
      dispatch({ type: 'UNAUTHENTICATED' });
      return;
    }
    authApi
      .profile()
      .then((user) => {
        if (!cancelled) dispatch({ type: 'AUTHENTICATED', user });
      })
      .catch(() => {
        tokenStorage.clear();
        if (!cancelled) dispatch({ type: 'UNAUTHENTICATED' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keeps the realtime socket's lifecycle tied to the session: connect once
  // authenticated (with the current access token), disconnect otherwise.
  useEffect(() => {
    if (state.status !== 'authenticated') return;
    const token = tokenStorage.getAccess();
    if (token) connect(token);
    return () => disconnect();
  }, [state.status]);

  useEffect(() => {
    const onExpired = (): void => {
      tokenStorage.clear();
      dispatch({ type: 'ERROR', message: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
      dispatch({ type: 'UNAUTHENTICATED' });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    try {
      dispatch({ type: 'AUTHENTICATED', user: await authApi.login(input) });
    } catch (err) {
      dispatch({ type: 'ERROR', message: message(err, 'No se pudo iniciar sesión') });
      throw err;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<void> => {
    try {
      dispatch({ type: 'AUTHENTICATED', user: await authApi.register(input) });
    } catch (err) {
      dispatch({ type: 'ERROR', message: message(err, 'No se pudo crear la cuenta') });
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout();
    dispatch({ type: 'UNAUTHENTICATED' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === 'authenticated',
      error: state.error,
      login,
      register,
      logout,
      clearError,
    }),
    [state, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
