import { renderHook } from '@testing-library/react';
import { AuthContext } from '../../src/context/auth-context.js';
import { useAuth } from '../../src/hooks/useAuth.js';
import { makeAuthValue } from '../test-utils.js';

describe('useAuth', () => {
  it('throws when used outside <AuthProvider>', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it('returns the context value when inside a provider', () => {
    const value = makeAuthValue({ status: 'authenticated', isAuthenticated: true });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      ),
    });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
