import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { CrearTareaInput } from '@todo/shared';
import { TodoForm } from '../../../src/components/tareas/TodoForm.js';
import { makeCategoria, makeEtiqueta, makeTarea } from '../../factories.js';

const categorias = [makeCategoria({ id: 'c1', nombre: 'Trabajo' })];
const etiquetas = [
  makeEtiqueta({ id: 'e1', nombre: 'urgente' }),
  makeEtiqueta({ id: 'e2', nombre: 'revisar' }),
];

function renderForm(props: Partial<React.ComponentProps<typeof TodoForm>> = {}) {
  const onSubmit = vi.fn<(input: CrearTareaInput) => Promise<void>>().mockResolvedValue(undefined);
  render(
    <TodoForm
      categorias={categorias}
      etiquetas={etiquetas}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      {...props}
    />,
  );
  return { onSubmit };
}

describe('<TodoForm />', () => {
  it('requires a title', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(await screen.findByText(/el título es obligatorio/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a normalised payload with category and selected tags', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText('Título'), 'Pagar servicios');
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'alta');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'c1');
    await user.click(screen.getByRole('checkbox', { name: /urgente/i }));
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        titulo: 'Pagar servicios',
        descripcion: null,
        prioridad: 'alta',
        fechaVencimiento: null,
        categoriaId: 'c1',
        etiquetaIds: ['e1'],
      });
    });
  });

  it('prefills from an existing task when editing, including its tags', () => {
    renderForm({
      initial: makeTarea({
        titulo: 'Ya existe',
        descripcion: 'con detalle',
        prioridad: 'urgente',
        categoriaId: 'c1',
        etiquetas: [makeEtiqueta({ id: 'e2', nombre: 'revisar' })],
      }),
    });

    expect(screen.getByLabelText('Título')).toHaveValue('Ya existe');
    expect(screen.getByLabelText('Categoría')).toHaveValue('c1');
    expect(screen.getByRole('checkbox', { name: /revisar/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /urgente/i })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });
});
