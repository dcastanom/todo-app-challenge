import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { PaginatedResponse, TareaDTO } from '@todo/shared';
import { TodoList } from '../../../src/components/tareas/TodoList.js';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setCompletada: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../../../src/services/tareas.service.js', () => ({ tareasApi: api }));

const page = (rows: TareaDTO[]): PaginatedResponse<TareaDTO> => ({
  data: rows,
  meta: { page: 1, limit: 20, total: rows.length, totalPages: 1 },
});

const tarea: TareaDTO = {
  id: 'a',
  titulo: 'Regar las plantas',
  descripcion: null,
  prioridad: 'normal',
  completada: false,
  fechaVencimiento: null,
  completadaEn: null,
  categoriaId: null,
  posicion: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => vi.clearAllMocks());

describe('<TodoList />', () => {
  it('renders the tasks from the API', async () => {
    api.list.mockResolvedValue(page([tarea]));
    render(<TodoList />);
    expect(await screen.findByText('Regar las plantas')).toBeInTheDocument();
  });

  it('shows an empty state when there are no tasks', async () => {
    api.list.mockResolvedValue(page([]));
    render(<TodoList />);
    expect(await screen.findByText(/no tienes tareas/i)).toBeInTheDocument();
  });

  it('opens the new-task form on demand', async () => {
    const user = userEvent.setup();
    api.list.mockResolvedValue(page([]));
    render(<TodoList />);
    await screen.findByText(/no tienes tareas/i);

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    expect(screen.getByRole('form', { name: /nueva tarea/i })).toBeInTheDocument();
  });

  it('surfaces a load error with a retry', async () => {
    api.list.mockRejectedValueOnce(new Error('down'));
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
