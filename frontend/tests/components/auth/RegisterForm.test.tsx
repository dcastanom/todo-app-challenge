import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { RegisterForm } from '../../../src/components/auth/RegisterForm.js';
import { renderWithAuth } from '../../test-utils.js';

describe('<RegisterForm />', () => {
  it('flags invalid fields and does not submit', async () => {
    const user = userEvent.setup();
    const { value } = renderWithAuth(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true');
    });
    expect(value.register).not.toHaveBeenCalled();
  });

  it('submits the account details and calls onSuccess', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { value } = renderWithAuth(<RegisterForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('Usuario'), 'nuevo_user');
    await user.type(screen.getByLabelText('Email'), 'nuevo@todo.app');
    await user.type(screen.getByLabelText(/nombre completo/i), 'Nueva Persona');
    await user.type(screen.getByLabelText('Contraseña'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(value.register).toHaveBeenCalledWith({
        username: 'nuevo_user',
        email: 'nuevo@todo.app',
        nombreCompleto: 'Nueva Persona',
        password: 'Passw0rd!',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows a server error from the context', () => {
    renderWithAuth(<RegisterForm />, { auth: { error: 'El email ya está registrado' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/ya está registrado/i);
  });
});
