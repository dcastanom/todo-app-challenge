import { renderHook, waitFor } from '@testing-library/react';
import { useCategorias } from '../../src/hooks/useCategorias.js';
import { useEtiquetas } from '../../src/hooks/useEtiquetas.js';
import { makeCategoria, makeEtiqueta } from '../factories.js';

const cat = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
const tag = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../../src/services/categorias.service.js', () => ({ categoriasApi: cat }));
vi.mock('../../src/services/etiquetas.service.js', () => ({ etiquetasApi: tag }));

describe('taxonomy hooks wire useCrudColeccion to their API', () => {
  it('useCategorias loads categories', async () => {
    cat.list.mockResolvedValue([makeCategoria({ nombre: 'Salud' })]);
    const { result } = renderHook(() => useCategorias());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items[0]?.nombre).toBe('Salud');
  });

  it('useEtiquetas loads tags', async () => {
    tag.list.mockResolvedValue([makeEtiqueta({ nombre: 'bug' })]);
    const { result } = renderHook(() => useEtiquetas());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items[0]?.nombre).toBe('bug');
  });
});
