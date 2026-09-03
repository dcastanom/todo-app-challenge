import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
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

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(h.onToggle).toHaveBeenCalledWith('t7');
    expect(h.onEdit).toHaveBeenCalledWith(tarea);
    expect(h.onDelete).toHaveBeenCalledWith('t7');
  });

  it('flags an overdue, uncompleted task', () => {
    setup(makeTarea({ fechaVencimiento: '2020-01-01T00:00:00.000Z' }));
    expect(screen.getByText(/venció/i)).toBeInTheDocument();
  });

  it('does not flag a completed task as overdue', () => {
    setup(makeTarea({ completada: true, fechaVencimiento: '2020-01-01T00:00:00.000Z' }));
    expect(screen.queryByText(/venció/i)).not.toBeInTheDocument();
  });
});
