import { useState } from 'react';
import type { FormatoExport, TareaFiltros } from '@todo/shared';
import { descargarBlob } from '../../lib/download.js';
import { HttpError } from '../../services/http.js';
import { tareasApi } from '../../services/tareas.service.js';
import styles from './ExportMenu.module.css';

export interface ExportMenuProps {
  filtros: TareaFiltros;
}

/** Downloads the current (filtered) task list as CSV or JSON. */
export function ExportMenu({ filtros }: ExportMenuProps): React.JSX.Element {
  const [busy, setBusy] = useState<FormatoExport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportar = async (formato: FormatoExport): Promise<void> => {
    setBusy(formato);
    setError(null);
    try {
      const { blob, filename } = await tareasApi.exportar(formato, filtros);
      descargarBlob(blob, filename);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'No se pudo exportar');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Exportar:</span>
      <button
        type="button"
        className={styles.btn}
        disabled={busy !== null}
        onClick={() => void exportar('csv')}
      >
        {busy === 'csv' ? '…' : 'CSV'}
      </button>
      <button
        type="button"
        className={styles.btn}
        disabled={busy !== null}
        onClick={() => void exportar('json')}
      >
        {busy === 'json' ? '…' : 'JSON'}
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
