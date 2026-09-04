import { render, screen } from '@testing-library/react';
import { App } from '../src/App.js';

vi.mock('../src/services/auth.service.js', () => ({
  authApi: {
    profile: vi.fn().mockRejectedValue(new Error('no session')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('<App />', () => {
  it('redirects an anonymous visitor to the login page', async () => {
    render(<App />);
    // Pages are lazy-loaded, so allow a little longer for the chunk + auth check.
    expect(
      await screen.findByRole('heading', { name: /iniciar sesión/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
