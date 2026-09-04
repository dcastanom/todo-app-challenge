import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import type { UseSeleccion } from '../../../src/hooks/useSeleccion.js';
import type { UseTodos } from '../../../src/hooks/useTodos.js';
import type { UseFilters } from '../../../src/hooks/useFilters.js';
import { TodoList } from '../../../src/components/tareas/TodoList.js';
import { makeFilters, makeSeleccion, makeTarea, makeTodos } from '../../factories.js';

function renderList(
  todos: UseTodos,
  filters: UseFilters = makeFilters(),
  seleccion: UseSeleccion = makeSeleccion(),
) {
  render(
    <TodoList
      todos={todos}
      filters={filters}
      seleccion={seleccion}
      categorias={[]}
      etiquetas={[]}
    />,
  );
}

describe('<TodoList />', () => {
  it('renders the given tasks', () => {
    renderList(makeTodos({ tareas: [makeTarea({ titulo: 'Regar las plantas' })], total: 1 }));
    expect(screen.getByText('Regar las plantas')).toBeInTheDocument();
  });

  it('shows an empty state when there are no tasks', () => {
    renderList(makeTodos());
    expect(screen.getByText(/no tienes tareas/i)).toBeInTheDocument();
  });

  it('shows a filtered empty state when filters are active', () => {
    renderList(makeTodos(), makeFilters({ activos: 2 }));
    expect(screen.getByText(/ninguna tarea coincide/i)).toBeInTheDocument();
  });

  it('opens the new-task form on demand', async () => {
    const user = userEvent.setup();
    renderList(makeTodos());

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    expect(screen.getByRole('form', { name: /nueva tarea/i })).toBeInTheDocument();
  });

  it('toggles the filter panel and shows the active count', async () => {
    const user = userEvent.setup();
    renderList(makeTodos(), makeFilters({ activos: 3 }));

    const btn = screen.getByRole('button', { name: /filtros \(3\)/i });
    expect(screen.queryByLabelText('Filtros')).not.toBeInTheDocument();
    await user.click(btn);
    expect(screen.getByLabelText('Filtros')).toBeInTheDocument();
  });

  it('surfaces a load error with a retry', async () => {
    const user = userEvent.setup();
    const todos = makeTodos({ status: 'error', error: 'Servidor caído' });
    renderList(todos);

    expect(screen.getByRole('alert')).toHaveTextContent(/servidor caído/i);
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(todos.refresh).toHaveBeenCalled();
  });

  it('changes the sort order', async () => {
    const user = userEvent.setup();
    const todos = makeTodos();
    renderList(todos);

    await user.selectOptions(screen.getByLabelText(/ordenar por/i), 'Prioridad');
    expect(todos.setSort).toHaveBeenCalledWith('prioridad', 'desc');
  });

  it('persists a drag reorder when sorting manually', () => {
    const todos = makeTodos({
      orden: 'posicion',
      direccion: 'asc',
      tareas: [makeTarea({ id: 't1', titulo: 'Uno' }), makeTarea({ id: 't2', titulo: 'Dos' })],
      total: 2,
    });
    renderList(todos);

    const [first, second] = screen.getAllByRole('listitem');
    fireEvent.dragStart(first!);
    fireEvent.dragEnter(second!);
    fireEvent.dragEnd(first!);

    expect(todos.mover).toHaveBeenCalledWith(0, 1);
  });

  it('reveals the batch bar once tasks are selected', async () => {
    const user = userEvent.setup();
    const seleccion = makeSeleccion({ count: 2, seleccionados: new Set(['t1', 't2']) });
    renderList(
      makeTodos({ tareas: [makeTarea({ id: 't1' })], total: 1 }),
      makeFilters(),
      seleccion,
    );

    expect(screen.queryByText('2 seleccionadas')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /seleccionar/i }));
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
  });
});
