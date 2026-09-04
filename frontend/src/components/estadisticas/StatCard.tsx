import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'danger';
}

export function StatCard({ label, value, tone = 'default' }: Props): React.JSX.Element {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
