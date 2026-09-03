import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { FilterPanel } from '../../../src/components/tareas/FilterPanel.js';
import { makeCategoria, makeEtiqueta, makeFilters } from '../../factories.js';

const categorias = [makeCategoria({ id: 'c1', nombre: 'Trabajo' })];
const etiquetas = [makeEtiqueta({ id: 'e1', nombre: 'urgente' })];

describe('<FilterPanel />', () => {
  it('sets the completion filter', async () => {
    const user = userEvent.setup();
    const filters = makeFilters();
    render(<FilterPanel filters={filters} categorias={categorias} etiquetas={etiquetas} />);

    await user.selectOptions(screen.getByLabelText('Estado'), 'Completadas');
    expect(filters.set).toHaveBeenCalledWith('completada', true);
  });

  it('maps the "Sin categoría" option to sinCategoria', async () => {
    const user = userEvent.setup();
    const filters = makeFilters();
    render(<FilterPanel filters={filters} categorias={categorias} etiquetas={etiquetas} />);

    await user.selectOptions(screen.getByLabelText('Categoría'), 'Sin categoría');
    expect(filters.set).toHaveBeenCalledWith('sinCategoria', true);
    expect(filters.set).toHaveBeenCalledWith('categoria', undefined);
  });

  it('toggles a tag filter', async () => {
    const user = userEvent.setup();
    const filters = makeFilters();
    render(<FilterPanel filters={filters} categorias={categorias} etiquetas={etiquetas} />);

    await user.click(screen.getByRole('button', { name: 'urgente' }));
    expect(filters.toggleEtiqueta).toHaveBeenCalledWith('urgente');
  });

  it('shows a clear button with the active count', async () => {
    const user = userEvent.setup();
    const filters = makeFilters({ activos: 2 });
    render(<FilterPanel filters={filters} categorias={categorias} etiquetas={etiquetas} />);

    const clear = screen.getByRole('button', { name: /limpiar filtros \(2\)/i });
    await user.click(clear);
    expect(filters.clear).toHaveBeenCalled();
  });
});
