import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchActionBar } from '../../../src/components/tareas/BatchActionBar.js';
import { makeCategoria } from '../../factories.js';

function setup() {
  const onBatch = vi.fn().mockResolvedValue(undefined);
  const onClear = vi.fn();
  render(
    <BatchActionBar
      ids={['t1', 't2']}
      categorias={[makeCategoria({ id: 'c1', nombre: 'Trabajo' })]}
      onBatch={onBatch}
      onClear={onClear}
    />,
  );
  return { onBatch, onClear };
}

describe('<BatchActionBar />', () => {
  it('shows the selection count', () => {
    setup();
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
  });

  it('completes the selection and then clears it', async () => {
    const user = userEvent.setup();
    const { onBatch, onClear } = setup();
    await user.click(screen.getByRole('button', { name: 'Completar' }));
    await waitFor(() =>
      expect(onBatch).toHaveBeenCalledWith({
        ids: ['t1', 't2'],
        accion: { tipo: 'completar', completada: true },
      }),
    );
    expect(onClear).toHaveBeenCalled();
  });

  it('sets priority from the dropdown', async () => {
    const user = userEvent.setup();
    const { onBatch } = setup();
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'Urgente');
    await waitFor(() =>
      expect(onBatch).toHaveBeenCalledWith({
        ids: ['t1', 't2'],
        accion: { tipo: 'prioridad', prioridad: 'urgente' },
      }),
    );
  });

  it('moves to a category and supports "sin categoría"', async () => {
    const user = userEvent.setup();
    const { onBatch } = setup();
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Sin categoría');
    await waitFor(() =>
      expect(onBatch).toHaveBeenCalledWith({
        ids: ['t1', 't2'],
        accion: { tipo: 'categoria', categoriaId: null },
      }),
    );
  });

  it('deletes the selection', async () => {
    const user = userEvent.setup();
    const { onBatch } = setup();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() =>
      expect(onBatch).toHaveBeenCalledWith({ ids: ['t1', 't2'], accion: { tipo: 'eliminar' } }),
    );
  });

  it('cancel button clears without a batch call', async () => {
    const user = userEvent.setup();
    const { onBatch, onClear } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClear).toHaveBeenCalled();
    expect(onBatch).not.toHaveBeenCalled();
  });
});
