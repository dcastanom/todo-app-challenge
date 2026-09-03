import { useState } from 'react';
import { HttpError } from '../../services/http.js';
import { ErrorMessage } from '../common/ErrorMessage.js';
import { Spinner } from '../common/Spinner.js';
import styles from './TaxonomyManager.module.css';

interface Item {
  id: string;
  nombre: string;
  color: string;
  descripcion?: string | null;
}

interface Payload {
  nombre: string;
  color: string;
  descripcion: string | null;
}

interface Coleccion<I extends Item> {
  items: I[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
  crear: (input: Payload) => Promise<unknown>;
  actualizar: (id: string, input: Payload) => Promise<unknown>;
  eliminar: (id: string) => Promise<void>;
}

export interface TaxonomyManagerProps<I extends Item> {
  titulo: string;
  coleccion: Coleccion<I>;
  colorPorDefecto: string;
  conDescripcion?: boolean;
  emptyText: string;
}

export function TaxonomyManager<I extends Item>({
  titulo,
  coleccion,
  colorPorDefecto,
  conDescripcion = false,
  emptyText,
}: TaxonomyManagerProps<I>): React.JSX.Element {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ nombre: '', color: colorPorDefecto, descripcion: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startCreate = (): void => {
    setEditId('new');
    setDraft({ nombre: '', color: colorPorDefecto, descripcion: '' });
    setFormError(null);
  };
  const startEdit = (item: I): void => {
    setEditId(item.id);
    setDraft({ nombre: item.nombre, color: item.color, descripcion: item.descripcion ?? '' });
    setFormError(null);
  };
  const cancel = (): void => {
    setEditId(null);
    setFormError(null);
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setFormError(null);
    try {
      const payload: Payload = {
        nombre: draft.nombre.trim(),
        color: draft.color,
        descripcion: conDescripcion ? draft.descripcion.trim() || null : null,
      };
      if (editId === 'new') await coleccion.crear(payload);
      else if (editId) await coleccion.actualizar(editId, payload);
      setEditId(null);
    } catch (err) {
      setFormError(err instanceof HttpError ? err.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel}>
      <header className={styles.head}>
        <h2>{titulo}</h2>
        <button type="button" onClick={startCreate} disabled={editId === 'new'}>
          + Añadir
        </button>
      </header>

      {coleccion.error && (
        <ErrorMessage message={coleccion.error} onRetry={() => void coleccion.refresh()} />
      )}

      {editId === 'new' && (
        <Form
          draft={draft}
          setDraft={setDraft}
          conDescripcion={conDescripcion}
          onSave={() => void save()}
          onCancel={cancel}
          busy={busy}
          error={formError}
        />
      )}

      {coleccion.status === 'loading' && coleccion.items.length === 0 ? (
        <Spinner label={`Cargando ${titulo.toLowerCase()}…`} />
      ) : coleccion.items.length === 0 && editId !== 'new' ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {coleccion.items.map((item) =>
            editId === item.id ? (
              <li key={item.id}>
                <Form
                  draft={draft}
                  setDraft={setDraft}
                  conDescripcion={conDescripcion}
                  onSave={() => void save()}
                  onCancel={cancel}
                  busy={busy}
                  error={formError}
                />
              </li>
            ) : (
              <li key={item.id} className={styles.row}>
                <span className={styles.swatch} style={{ background: item.color }} />
                <span className={styles.name}>{item.nombre}</span>
                <button type="button" onClick={() => startEdit(item)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.del}
                  onClick={() => void coleccion.eliminar(item.id)}
                >
                  Eliminar
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

interface FormProps {
  draft: { nombre: string; color: string; descripcion: string };
  setDraft: React.Dispatch<
    React.SetStateAction<{ nombre: string; color: string; descripcion: string }>
  >;
  conDescripcion: boolean;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
}

function Form({
  draft,
  setDraft,
  conDescripcion,
  onSave,
  onCancel,
  busy,
  error,
}: FormProps): React.JSX.Element {
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.formRow}>
        <input
          aria-label="Nombre"
          placeholder="Nombre"
          value={draft.nombre}
          onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
          autoFocus
        />
        <input
          type="color"
          aria-label="Color"
          value={draft.color}
          onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
        />
      </div>
      {conDescripcion && (
        <input
          aria-label="Descripción"
          placeholder="Descripción (opcional)"
          value={draft.descripcion}
          onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
        />
      )}
      <div className={styles.formActions}>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={busy || draft.nombre.trim().length === 0}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
