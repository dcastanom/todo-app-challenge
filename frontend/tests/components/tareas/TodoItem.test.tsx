import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { TareaDTO } from '@todo/shared';
import { TodoItem } from '../../../src/components/tareas/TodoItem.js';

const base: TareaDTO = {
  id: 't1',
  titulo: 'Comprar café',
  descripcion: 'del bueno',
  prioridad: 'alta',
  completada: false,
  fechaVencimiento: null,
  completadaEn: null,
  categoriaId: null,
  posicion: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function setup(tarea: TareaDTO) {
  const handlers = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(<TodoItem tarea={tarea} {...handlers} />);
  return handlers;
}

describe('<TodoItem />', () => {
  it('shows the title, description and priority badge', () => {
    setup(base);
    expect(screen.getByText('Comprar café')).toBeInTheDocument();
    expect(screen.getByText('del bueno')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('fires the callbacks for its controls', async () => {
    const user = userEvent.setup();
    const h = setup(base);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(h.onToggle).toHaveBeenCalledWith('t1');
    expect(h.onEdit).toHaveBeenCalledWith(base);
    expect(h.onDelete).toHaveBeenCalledWith('t1');
  });

  it('reflects completion with a checked box', () => {
    setup({ ...base, completada: true, completadaEn: base.createdAt });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('flags an overdue, uncompleted task', () => {
    setup({ ...base, fechaVencimiento: '2020-01-01T00:00:00.000Z' });
    expect(screen.getByText(/venció/i)).toBeInTheDocument();
  });

  it('does not flag a completed task as overdue', () => {
    setup({ ...base, completada: true, fechaVencimiento: '2020-01-01T00:00:00.000Z' });
    expect(screen.queryByText(/venció/i)).not.toBeInTheDocument();
  });
});
