import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TareaDTO } from '@todo/shared';
import { TodoItem } from '../../../src/components/tareas/TodoItem.js';
import { makeTarea } from '../../factories.js';

function setup(tarea: TareaDTO) {
  const handlers = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<TodoItem tarea={tarea} {...handlers} />);
  return handlers;
}

describe('<TodoItem />', () => {
  it('shows the title, description and priority badge', () => {
    setup(makeTarea({ titulo: 'Comprar café', descripcion: 'del bueno', prioridad: 'alta' }));
    expect(screen.getByText('Comprar café')).toBeInTheDocument();
    expect(screen.getByText('del bueno')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('renders the category and tags', () => {
    setup(
      makeTarea({
        categoria: { id: 'c1', nombre: 'Trabajo', color: '#3498db' },
        etiquetas: [
          { id: 'e1', nombre: 'urgente', color: '#c0392b' },
          { id: 'e2', nombre: 'revisar', color: '#f39c12' },
        ],
      }),
    );
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('urgente')).toBeInTheDocument();
    expect(screen.getByText('revisar')).toBeInTheDocument();
  });

  it('fires the callbacks for its controls', async () => {
    const user = userEvent.setup();
    const tarea = makeTarea({ id: 't7' });
    const h = setup(tarea);

    // The button's accessible name is its aria-label ("Marcar … como
    // completada"), not the shorter visible text ("Completar").
    await user.click(screen.getByRole('button', { name: /como completada/i }));
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(h.onToggle).toHaveBeenCalledWith('t7');
    expect(h.onEdit).toHaveBeenCalledWith(tarea);
    expect(h.onDelete).toHaveBeenCalledWith('t7');
  });

  it('shows "Marcar pendiente" instead of "Completar" once the task is done', () => {
    setup(makeTarea({ completada: true }));
    expect(screen.getByText('Marcar pendiente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /como pendiente/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /como completada/i })).not.toBeInTheDocument();
  });

  it('flags an overdue, uncompleted task', () => {
    setup(makeTarea({ fechaVencimiento: '2020-01-01T00:00:00.000Z' }));
    expect(screen.getByText(/venció/i)).toBeInTheDocument();
  });

  it('does not flag a completed task as overdue', () => {
    setup(makeTarea({ completada: true, fechaVencimiento: '2020-01-01T00:00:00.000Z' }));
    expect(screen.queryByText(/venció/i)).not.toBeInTheDocument();
  });

  it('renders a selection checkbox and reports toggles', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TodoItem
        tarea={makeTarea({ id: 't1', titulo: 'Elegir' })}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        selection={{ selected: false, onToggle: onSelect }}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: /seleccionar "elegir"/i }));
    expect(onSelect).toHaveBeenCalledWith('t1');
  });

  it('becomes draggable and wires the drag callbacks', () => {
    const drag = {
      onDragStart: vi.fn(),
      onDragEnter: vi.fn(),
      onDragEnd: vi.fn(),
      dragging: false,
    };
    render(
      <TodoItem
        tarea={makeTarea({ titulo: 'Mover' })}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        drag={drag}
      />,
    );
    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(item);
    fireEvent.dragEnter(item);
    fireEvent.dragEnd(item);
    expect(drag.onDragStart).toHaveBeenCalled();
    expect(drag.onDragEnter).toHaveBeenCalled();
    expect(drag.onDragEnd).toHaveBeenCalled();
  });
});
