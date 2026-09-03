import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { CrearTareaInput, TareaDTO } from '@todo/shared';
import { TodoForm } from '../../../src/components/tareas/TodoForm.js';

describe('<TodoForm />', () => {
  it('requires a title', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<(input: CrearTareaInput) => Promise<void>>()
      .mockResolvedValue(undefined);
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(await screen.findByText(/el título es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a normalised payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<(input: CrearTareaInput) => Promise<void>>()
      .mockResolvedValue(undefined);
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Título'), 'Pagar servicios');
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'alta');
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        titulo: 'Pagar servicios',
        descripcion: null,
        prioridad: 'alta',
        fechaVencimiento: null,
        categoriaId: null,
      });
    });
  });

  it('prefills from an existing task when editing', () => {
    const tarea: TareaDTO = {
      id: 't1',
      titulo: 'Ya existe',
      descripcion: 'con detalle',
      prioridad: 'urgente',
      completada: false,
      fechaVencimiento: null,
      completadaEn: null,
      categoriaId: null,
      posicion: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    render(<TodoForm initial={tarea} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Título')).toHaveValue('Ya existe');
    expect(screen.getByLabelText('Descripción')).toHaveValue('con detalle');
    expect(screen.getByLabelText('Prioridad')).toHaveValue('urgente');
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });
});
