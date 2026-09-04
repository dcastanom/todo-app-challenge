import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../../../src/components/common/ThemeToggle.js';
import { ThemeContext, type ThemeContextValue } from '../../../src/context/theme-context.js';

function renderToggle(over: Partial<ThemeContextValue> = {}) {
  const value: ThemeContextValue = {
    preference: 'system',
    theme: 'light',
    setPreference: vi.fn(),
    toggle: vi.fn(),
    ...over,
  };
  render(
    <ThemeContext.Provider value={value}>
      <ThemeToggle />
    </ThemeContext.Provider>,
  );
  return value;
}

describe('<ThemeToggle />', () => {
  it('labels the action by the target theme and reflects pressed state', () => {
    renderToggle({ theme: 'light' });
    const btn = screen.getByRole('button', { name: /modo oscuro/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows pressed when dark is active', () => {
    renderToggle({ theme: 'dark' });
    expect(screen.getByRole('button', { name: /modo claro/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('calls toggle on click', async () => {
    const user = userEvent.setup();
    const value = renderToggle();
    await user.click(screen.getByRole('button'));
    expect(value.toggle).toHaveBeenCalled();
  });
});
