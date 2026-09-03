import styles from './Spinner.module.css';

export function Spinner({ label = 'Cargando…' }: { label?: string }): React.JSX.Element {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.dot} />
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );
}
