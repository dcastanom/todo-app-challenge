import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { UseTodos } from '../../../src/hooks/useTodos.js';
import { TodoList } from '../../../src/components/tareas/TodoList.js';
import { makeTarea } from '../../factories.js';

function makeTodos(over: Partial<UseTodos> = {}): UseTodos {
  return {
    tareas: [],
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
    orden: 'created_at',
    direccion: 'desc',
    status: 'ready',
    error: null,
    setPage: vi.fn(),
    setSort: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    crear: vi.fn().mockResolvedValue(undefined),
    actualizar: vi.fn().mockResolvedValue(undefined),
    eliminar: vi.fn().mockResolvedValue(undefined),
    toggleCompletada: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function renderList(todos: UseTodos) {
  render(<TodoList todos={todos} categorias={[]} etiquetas={[]} />);
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

  it('opens the new-task form on demand', async () => {
    const user = userEvent.setup();
    renderList(makeTodos());

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    expect(screen.getByRole('form', { name: /nueva tarea/i })).toBeInTheDocument();
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
});
