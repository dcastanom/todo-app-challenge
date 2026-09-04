import type { ReactNode } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../src/context/ThemeProvider.js';
import { useTheme } from '../../src/hooks/useTheme.js';

type MqListener = (e: MediaQueryListEvent) => void;

let systemDark = false;
let listeners: MqListener[] = [];

function mockMatchMedia(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? systemDark : false,
      media: query,
      addEventListener: (_: string, cb: MqListener) => listeners.push(cb),
      removeEventListener: (_: string, cb: MqListener) => {
        listeners = listeners.filter((l) => l !== cb);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => {
  systemDark = false;
  listeners = [];
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  mockMatchMedia();
});

afterEach(() => vi.unstubAllGlobals());

describe('ThemeProvider', () => {
  it('defaults to system and resolves against the OS setting', () => {
    systemDark = true;
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.preference).toBe('system');
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('toggle pins an explicit preference and sets data-theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.preference).toBe('dark');
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('todo:theme')).toContain('dark');
  });

  it('restores a stored preference on mount', () => {
    localStorage.setItem('todo:theme', JSON.stringify('dark'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('reacts to an OS theme change while on system', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');
    act(() => {
      systemDark = true;
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
    });
    expect(result.current.theme).toBe('dark');
  });

  it('useTheme throws without a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Bare />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });
});

function Bare(): React.JSX.Element {
  useTheme();
  return <div />;
}

describe('theme toggle via UI', () => {
  it('flips back to light from dark', async () => {
    const user = userEvent.setup();
    function Probe(): React.JSX.Element {
      const { theme, toggle } = useTheme();
      return (
        <button type="button" onClick={toggle}>
          {theme}
        </button>
      );
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('light');
    await user.click(btn);
    expect(btn).toHaveTextContent('dark');
    await user.click(btn);
    expect(btn).toHaveTextContent('light');
  });
});
