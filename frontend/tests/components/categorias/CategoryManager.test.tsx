import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { UseCategorias } from '../../../src/hooks/useCategorias.js';
import { CategoryManager } from '../../../src/components/categorias/CategoryManager.js';
import { makeCategoria } from '../../factories.js';

function makeColeccion(over: Partial<UseCategorias> = {}): UseCategorias {
  return {
    items: [],
    status: 'ready',
    error: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    crear: vi.fn().mockResolvedValue(makeCategoria()),
    actualizar: vi.fn().mockResolvedValue(makeCategoria()),
    eliminar: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('<CategoryManager />', () => {
  it('lists categories with a colour swatch', () => {
    render(
      <CategoryManager
        coleccion={makeColeccion({ items: [makeCategoria({ nombre: 'Salud' })] })}
      />,
    );
    expect(screen.getByText('Salud')).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    render(<CategoryManager coleccion={makeColeccion()} />);
    expect(screen.getByText(/sin categorías/i)).toBeInTheDocument();
  });

  it('creates a category through the add form', async () => {
    const user = userEvent.setup();
    const coleccion = makeColeccion();
    render(<CategoryManager coleccion={coleccion} />);

    await user.click(screen.getByRole('button', { name: /añadir/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Finanzas');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(coleccion.crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Finanzas' }));
    });
  });

  it('deletes a category', async () => {
    const user = userEvent.setup();
    const coleccion = makeColeccion({ items: [makeCategoria({ id: 'c9', nombre: 'Vieja' })] });
    render(<CategoryManager coleccion={coleccion} />);

    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(coleccion.eliminar).toHaveBeenCalledWith('c9');
  });
});
