import type { TareaDTO } from '@todo/shared';
import { PriorityBadge } from './PriorityBadge.js';
import styles from './TodoItem.module.css';

const fmtFecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

export interface TodoItemProps {
  tarea: TareaDTO;
  onToggle: (id: string) => void;
  onEdit: (tarea: TareaDTO) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ tarea, onToggle, onEdit, onDelete }: TodoItemProps): React.JSX.Element {
  const vencida =
    !tarea.completada &&
    tarea.fechaVencimiento !== null &&
    new Date(tarea.fechaVencimiento).getTime() < Date.now();

  return (
    <li className={styles.item} data-completed={tarea.completada}>
      <input
        type="checkbox"
        className={styles.check}
        checked={tarea.completada}
        onChange={() => onToggle(tarea.id)}
        aria-label={`Marcar "${tarea.titulo}" como ${tarea.completada ? 'pendiente' : 'completada'}`}
      />

      <div className={styles.body}>
        <p className={styles.title}>{tarea.titulo}</p>
        {tarea.descripcion && <p className={styles.desc}>{tarea.descripcion}</p>}
        <div className={styles.meta}>
          <PriorityBadge prioridad={tarea.prioridad} />
          {tarea.fechaVencimiento && (
            <span className={vencida ? styles.overdue : styles.due}>
              {vencida ? 'Venció ' : 'Vence '}
              {fmtFecha.format(new Date(tarea.fechaVencimiento))}
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => onEdit(tarea)} aria-label={`Editar ${tarea.titulo}`}>
          Editar
        </button>
        <button
          type="button"
          className={styles.delete}
          onClick={() => onDelete(tarea.id)}
          aria-label={`Eliminar ${tarea.titulo}`}
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
