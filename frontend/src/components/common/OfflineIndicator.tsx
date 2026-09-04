import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import styles from './OfflineIndicator.module.css';

/** A sticky banner shown only while the browser reports no connection. */
export function OfflineIndicator(): React.JSX.Element | null {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span aria-hidden="true">⚠️</span> Sin conexión — tus cambios se guardan y se enviarán al
      reconectar.
    </div>
  );
}
