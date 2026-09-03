import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../src/context/auth-context.js';

export function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'unauthenticated',
    isAuthenticated: false,
    error: null,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    ...overrides,
  };
}

export function renderWithAuth(
  ui: ReactElement,
  { auth, route = '/' }: { auth?: Partial<AuthContextValue>; route?: string } = {},
) {
  const value = makeAuthValue(auth);
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </MemoryRouter>
  );
  return { value, ...render(ui, { wrapper }) };
}
