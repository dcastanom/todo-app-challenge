import { useTheme } from '../../hooks/useTheme.js';
import styles from './ThemeToggle.module.css';

export function ThemeToggle(): React.JSX.Element {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'claro' : 'oscuro';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Cambiar a modo ${next}`}
      aria-pressed={theme === 'dark'}
      title={`Cambiar a modo ${next}`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}
