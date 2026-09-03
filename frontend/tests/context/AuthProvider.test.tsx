import { render, screen, waitFor } from '@testing-library/react';
import type { UsuarioPublico } from '@todo/shared';
import { AuthProvider } from '../../src/context/AuthProvider.js';
import { useAuth } from '../../src/hooks/useAuth.js';

const profile = vi.fn();
vi.mock('../../src/services/auth.service.js', () => ({
  authApi: {
    profile: (): Promise<UsuarioPublico> => profile() as Promise<UsuarioPublico>,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const demo: UsuarioPublico = {
  id: '1',
  email: 'demo@todo.app',
  username: 'demo',
  nombreCompleto: 'Demo',
  fotoPerfilUrl: null,
  createdAt: new Date().toISOString(),
};

function Probe(): React.JSX.Element {
  const { status, user } = useAuth();
  return <div>{status === 'authenticated' ? `hi ${user?.username}` : status}</div>;
}

beforeEach(() => {
  localStorage.clear();
  profile.mockReset();
});

describe('<AuthProvider />', () => {
  it('is unauthenticated when there is no stored token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(profile).not.toHaveBeenCalled();
  });

  it('hydrates the session from a stored token', async () => {
    localStorage.setItem('todo.accessToken', 'stored');
    profile.mockResolvedValue(demo);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('hi demo')).toBeInTheDocument();
  });

  it('clears an invalid stored token', async () => {
    localStorage.setItem('todo.accessToken', 'bad');
    profile.mockRejectedValue(new Error('401'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('unauthenticated')).toBeInTheDocument();
    });
    expect(localStorage.getItem('todo.accessToken')).toBeNull();
  });
});
