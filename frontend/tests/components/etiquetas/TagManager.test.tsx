import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { UseEtiquetas } from '../../../src/hooks/useEtiquetas.js';
import { TagManager } from '../../../src/components/etiquetas/TagManager.js';
import { makeEtiqueta } from '../../factories.js';

function makeColeccion(over: Partial<UseEtiquetas> = {}): UseEtiquetas {
  return {
    items: [],
    status: 'ready',
    error: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    crear: vi.fn().mockResolvedValue(makeEtiqueta()),
    actualizar: vi.fn().mockResolvedValue(makeEtiqueta()),
    eliminar: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('<TagManager />', () => {
  it('lists tags and their empty state', () => {
    const { rerender } = render(<TagManager coleccion={makeColeccion()} />);
    expect(screen.getByText(/sin etiquetas/i)).toBeInTheDocument();

    rerender(
      <TagManager coleccion={makeColeccion({ items: [makeEtiqueta({ nombre: 'bug' })] })} />,
    );
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('creates a tag (no description field)', async () => {
    const user = userEvent.setup();
    const coleccion = makeColeccion();
    render(<TagManager coleccion={coleccion} />);

    await user.click(screen.getByRole('button', { name: /añadir/i }));
    expect(screen.queryByLabelText('Descripción')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), 'idea');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(coleccion.crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'idea' }));
    });
  });

  it('edits a tag inline', async () => {
    const user = userEvent.setup();
    const coleccion = makeColeccion({ items: [makeEtiqueta({ id: 't1', nombre: 'viejo' })] });
    render(<TagManager coleccion={coleccion} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    const input = screen.getByLabelText('Nombre');
    await user.clear(input);
    await user.type(input, 'nuevo');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(coleccion.actualizar).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ nombre: 'nuevo' }),
      );
    });
  });
});
