import { useState } from 'react';
import {
  PRIORIDADES,
  type BatchTareasInput,
  type CategoriaDTO,
  type Prioridad,
} from '@todo/shared';
import styles from './BatchActionBar.module.css';

const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export interface BatchActionBarProps {
  ids: string[];
  categorias: CategoriaDTO[];
  onBatch: (input: BatchTareasInput) => Promise<void>;
  onClear: () => void;
}

/** Floating bar shown while one or more tasks are selected. */
export function BatchActionBar({
  ids,
  categorias,
  onBatch,
  onClear,
}: BatchActionBarProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const run = async (accion: BatchTareasInput['accion']): Promise<void> => {
    setBusy(true);
    try {
      await onBatch({ ids, accion });
      onClear();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.bar} role="region" aria-label="Acciones en lote">
      <span className={styles.count}>{ids.length} seleccionadas</span>

      <button
        type="button"
        disabled={busy}
        onClick={() => void run({ tipo: 'completar', completada: true })}
      >
        Completar
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run({ tipo: 'completar', completada: false })}
      >
        Marcar pendiente
      </button>

      <label className={styles.select}>
        Prioridad
        <select
          disabled={busy}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value)
              void run({ tipo: 'prioridad', prioridad: e.target.value as Prioridad });
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            —
          </option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD_LABEL[p]}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.select}>
        Categoría
        <select
          disabled={busy}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) void run({ tipo: 'categoria', categoriaId: v === '__none' ? null : v });
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            —
          </option>
          <option value="__none">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={styles.delete}
        disabled={busy}
        onClick={() => void run({ tipo: 'eliminar' })}
      >
        Eliminar
      </button>

      <button type="button" className={styles.cancel} onClick={onClear}>
        Cancelar
      </button>
    </div>
  );
}
