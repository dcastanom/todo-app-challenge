import { act, renderHook } from '@testing-library/react';
import { useFilters } from '../../src/hooks/useFilters.js';

describe('useFilters', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useFilters());
    expect(result.current.filtros).toEqual({});
    expect(result.current.activos).toBe(0);
  });

  it('sets and clears individual filters', () => {
    const { result } = renderHook(() => useFilters());

    act(() => result.current.set('prioridad', 'alta'));
    expect(result.current.filtros.prioridad).toBe('alta');
    expect(result.current.activos).toBe(1);

    act(() => result.current.set('prioridad', undefined));
    expect(result.current.filtros.prioridad).toBeUndefined();
    expect(result.current.activos).toBe(0);
  });

  it('drops empty strings and empty arrays', () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.set('busqueda', ''));
    expect(result.current.activos).toBe(0);
  });

  it('toggles tag names on and off', () => {
    const { result } = renderHook(() => useFilters());

    act(() => result.current.toggleEtiqueta('urgente'));
    expect(result.current.filtros.etiquetas).toEqual(['urgente']);

    act(() => result.current.toggleEtiqueta('revisar'));
    expect(result.current.filtros.etiquetas).toEqual(['urgente', 'revisar']);

    act(() => result.current.toggleEtiqueta('urgente'));
    expect(result.current.filtros.etiquetas).toEqual(['revisar']);
  });

  it('clears everything at once', () => {
    const { result } = renderHook(() => useFilters());
    act(() => {
      result.current.set('prioridad', 'alta');
      result.current.set('vencidas', true);
    });
    expect(result.current.activos).toBe(2);
    act(() => result.current.clear());
    expect(result.current.filtros).toEqual({});
  });
});
