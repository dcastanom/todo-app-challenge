import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../../src/components/common/ErrorBoundary.js';

function Boom({ crash }: { crash: boolean }): React.JSX.Element {
  if (crash) throw new Error('kaboom');
  return <p>contenido ok</p>;
}

describe('<ErrorBoundary />', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Boom crash={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('contenido ok')).toBeInTheDocument();
  });

  it('shows the fallback UI with the error message on a crash', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom crash />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/algo salió mal/i);
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('re-renders the subtree when reset is clicked', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    let shouldCrash = true;
    function Flaky(): React.JSX.Element {
      if (shouldCrash) throw new Error('kaboom');
      return <p>contenido ok</p>;
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldCrash = false;
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(screen.getByText('contenido ok')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('uses a custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={(err) => <span>custom: {err.message}</span>}>
        <Boom crash />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom: kaboom')).toBeInTheDocument();
    spy.mockRestore();
  });
});
