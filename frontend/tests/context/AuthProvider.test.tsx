import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { UsuarioPublico } from '@todo/shared';
import { AuthProvider } from '../../src/context/AuthProvider.js';
import { useAuth } from '../../src/hooks/useAuth.js';
import { HttpError, SESSION_EXPIRED_EVENT } from '../../src/services/http.js';

const api = vi.hoisted(() => ({
  profile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('../../src/services/auth.service.js', () => ({ authApi: api }));

// Keeps this suite hermetic — without this, becoming "authenticated" would
// spin up a real socket.io-client connection attempt as a side effect.
const socketService = vi.hoisted(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
vi.mock('../../src/services/socket.service.js', () => socketService);

const demo: UsuarioPublico = {
  id: '1',
  email: 'demo@todo.app',
  username: 'demo',
  nombreCompleto: 'Demo',
  fotoPerfilUrl: null,
  createdAt: new Date().toISOString(),
};

function Probe(): React.JSX.Element {
  const { status, user, error, login, register, logout, clearError } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.username ?? '-'}</span>
      <span data-testid="error">{error ?? '-'}</span>
      <button onClick={() => void login({ email: 'a@b.c', password: 'p' })}>login</button>
      <button
        onClick={() =>
          void register({ email: 'a@b.c', username: 'u', password: 'Passw0rd!' }).catch(() => {})
        }
      >
        register
      </button>
      <button onClick={() => void logout()}>logout</button>
      <button onClick={clearError}>clear</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('<AuthProvider />', () => {
  it('is unauthenticated with no stored token', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(api.profile).not.toHaveBeenCalled();
  });

  it('hydrates from a stored token and connects the realtime socket', async () => {
    localStorage.setItem('todo.accessToken', 'stored');
    api.profile.mockResolvedValue(demo);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('demo'));
    expect(socketService.connect).toHaveBeenCalledWith('stored');
  });

  it('clears an invalid stored token', async () => {
    localStorage.setItem('todo.accessToken', 'bad');
    api.profile.mockRejectedValue(new Error('401'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(localStorage.getItem('todo.accessToken')).toBeNull();
  });

  it('login sets the user; a failed register surfaces the error', async () => {
    const user = userEvent.setup();
    api.profile.mockRejectedValue(new Error('no session'));
    api.login.mockResolvedValue(demo);
    api.register.mockRejectedValue(new HttpError(409, 'DUP', 'El email ya está registrado'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));

    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await user.click(screen.getByText('register'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(/ya está registrado/i),
    );
    await user.click(screen.getByText('clear'));
    expect(screen.getByTestId('error')).toHaveTextContent('-');
  });

  it('logout returns to unauthenticated', async () => {
    const user = userEvent.setup();
    localStorage.setItem('todo.accessToken', 'stored');
    api.profile.mockResolvedValue(demo);
    api.logout.mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('demo'));

    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(socketService.disconnect).toHaveBeenCalled();
  });

  it('reacts to the session-expired event', async () => {
    localStorage.setItem('todo.accessToken', 'stored');
    api.profile.mockResolvedValue(demo);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('demo'));

    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('error')).toHaveTextContent(/expiró/i);
  });
});
