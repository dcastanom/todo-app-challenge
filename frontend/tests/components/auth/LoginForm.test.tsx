import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { LoginForm } from '../../../src/components/auth/LoginForm.js';
import { renderWithAuth } from '../../test-utils.js';

describe('<LoginForm />', () => {
  it('marks fields invalid and does not call login on an empty submit', async () => {
    const user = userEvent.setup();
    const { value } = renderWithAuth(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
    });
    expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute('aria-invalid', 'true');
    expect(value.login).not.toHaveBeenCalled();
  });

  it('calls login with the entered credentials and fires onSuccess', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { value } = renderWithAuth(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email/i), 'demo@todo.app');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(value.login).toHaveBeenCalledWith({
        email: 'demo@todo.app',
        password: 'Password123!',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('renders a server error from the auth context', () => {
    renderWithAuth(<LoginForm />, { auth: { error: 'Email o contraseña incorrectos' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/incorrectos/i);
  });
});
