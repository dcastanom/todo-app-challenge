import { useState } from 'react';
import type { CampoOrden, CrearTareaInput, DireccionOrden, TareaDTO } from '@todo/shared';
import { useTodos } from '../../hooks/useTodos.js';
import { ErrorMessage } from '../common/ErrorMessage.js';
import { Spinner } from '../common/Spinner.js';
import { Pagination } from './Pagination.js';
import { TodoForm } from './TodoForm.js';
import { TodoItem } from './TodoItem.js';
import styles from './TodoList.module.css';

const SORTS: { label: string; orden: CampoOrden; direccion: DireccionOrden }[] = [
  { label: 'Más recientes', orden: 'created_at', direccion: 'desc' },
  { label: 'Más antiguas', orden: 'created_at', direccion: 'asc' },
  { label: 'Prioridad', orden: 'prioridad', direccion: 'desc' },
  { label: 'Fecha de vencimiento', orden: 'fecha_vencimiento', direccion: 'asc' },
  { label: 'Título (A-Z)', orden: 'titulo', direccion: 'asc' },
];

type Editing = TareaDTO | 'new' | null;

export function TodoList(): React.JSX.Element {
  const todos = useTodos();
  const [editing, setEditing] = useState<Editing>(null);

  const sortIndex = SORTS.findIndex(
    (s) => s.orden === todos.orden && s.direccion === todos.direccion,
  );

  const handleSubmit = async (input: CrearTareaInput): Promise<void> => {
    if (editing === 'new') await todos.crear(input);
    else if (editing) await todos.actualizar(editing.id, input);
    setEditing(null);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.toolbar}>
        <label className={styles.sort}>
          Ordenar por{' '}
          <select
            value={sortIndex === -1 ? 0 : sortIndex}
            onChange={(e) => {
              const s = SORTS[Number(e.target.value)];
              if (s) todos.setSort(s.orden, s.direccion);
            }}
          >
            {SORTS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.new}
          onClick={() => setEditing('new')}
          disabled={editing === 'new'}
        >
          + Nueva tarea
        </button>
      </div>

      {editing !== null && (
        <div className={styles.formPanel}>
          {editing === 'new' ? (
            <TodoForm onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
          ) : (
            <TodoForm initial={editing} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
          )}
        </div>
      )}

      {todos.error && <ErrorMessage message={todos.error} onRetry={() => void todos.refresh()} />}

      {todos.status === 'loading' && todos.tareas.length === 0 ? (
        <Spinner label="Cargando tareas…" />
      ) : todos.tareas.length === 0 ? (
        <p className={styles.empty}>No tienes tareas todavía. Crea la primera.</p>
      ) : (
        <ul className={styles.list}>
          {todos.tareas.map((tarea) => (
            <TodoItem
              key={tarea.id}
              tarea={tarea}
              onToggle={(id) => void todos.toggleCompletada(id)}
              onEdit={(t) => setEditing(t)}
              onDelete={(id) => void todos.eliminar(id)}
            />
          ))}
        </ul>
      )}

      <Pagination
        page={todos.page}
        totalPages={todos.totalPages}
        total={todos.total}
        onPageChange={todos.setPage}
      />
    </section>
  );
}
