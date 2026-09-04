import type { DragEvent } from 'react';
import type { TareaDTO } from '@todo/shared';
import { PriorityBadge } from './PriorityBadge.js';
import styles from './TodoItem.module.css';

const fmtFecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

export interface TodoItemDragProps {
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export interface TodoItemProps {
  tarea: TareaDTO;
  onToggle: (id: string) => void;
  onEdit: (tarea: TareaDTO) => void;
  onDelete: (id: string) => void;
  /** When set, a selection checkbox is shown for batch operations. */
  selection?: { selected: boolean; onToggle: (id: string) => void };
  /** When set, the row becomes draggable for manual reordering. */
  drag?: TodoItemDragProps;
}

export function TodoItem({
  tarea,
  onToggle,
  onEdit,
  onDelete,
  selection,
  drag,
}: TodoItemProps): React.JSX.Element {
  const vencida =
    !tarea.completada &&
    tarea.fechaVencimiento !== null &&
    new Date(tarea.fechaVencimiento).getTime() < Date.now();

  const dragHandlers = drag
    ? {
        draggable: true,
        onDragStart: (e: DragEvent) => {
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          drag.onDragStart();
        },
        onDragEnter: () => drag.onDragEnter(),
        onDragOver: (e: DragEvent) => e.preventDefault(),
        onDragEnd: () => drag.onDragEnd(),
      }
    : {};

  return (
    <li
      className={styles.item}
      data-completed={tarea.completada}
      data-dragging={drag?.dragging ? 'true' : undefined}
      {...dragHandlers}
    >
      {drag && (
        <span className={styles.handle} aria-hidden="true" title="Arrastrar para reordenar">
          ⠿
        </span>
      )}

      {selection && (
        <input
          type="checkbox"
          className={styles.select}
          checked={selection.selected}
          onChange={() => selection.onToggle(tarea.id)}
          aria-label={`Seleccionar "${tarea.titulo}"`}
        />
      )}

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
          {tarea.categoria && (
            <span className={styles.categoria}>
              <span className={styles.dot} style={{ background: tarea.categoria.color }} />
              {tarea.categoria.nombre}
            </span>
          )}
          {tarea.fechaVencimiento && (
            <span className={vencida ? styles.overdue : styles.due}>
              {vencida ? 'Venció ' : 'Vence '}
              {fmtFecha.format(new Date(tarea.fechaVencimiento))}
            </span>
          )}
        </div>

        {tarea.etiquetas.length > 0 && (
          <div className={styles.tags}>
            {tarea.etiquetas.map((e) => (
              <span
                key={e.id}
                className={styles.tag}
                style={{ borderColor: e.color, color: e.color }}
              >
                {e.nombre}
              </span>
            ))}
          </div>
        )}
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
