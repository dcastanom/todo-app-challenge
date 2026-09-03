import type { Prioridad } from '@todo/shared';
import styles from './PriorityBadge.module.css';

const LABEL: Record<Prioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export function PriorityBadge({ prioridad }: { prioridad: Prioridad }): React.JSX.Element {
  return <span className={`${styles.badge} ${styles[prioridad]}`}>{LABEL[prioridad]}</span>;
}
