import { act, renderHook } from '@testing-library/react';
import { useSeleccion } from '../../src/hooks/useSeleccion.js';

describe('useSeleccion', () => {
  it('toggles a single id on and off', () => {
    const { result } = renderHook(() => useSeleccion());

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('selects all, then clears all when already selected', () => {
    const { result } = renderHook(() => useSeleccion());

    act(() => result.current.toggleTodos(['a', 'b', 'c']));
    expect(result.current.count).toBe(3);

    act(() => result.current.toggleTodos(['a', 'b', 'c']));
    expect(result.current.count).toBe(0);
  });

  it('clear() empties the selection', () => {
    const { result } = renderHook(() => useSeleccion());
    act(() => result.current.toggleTodos(['a', 'b']));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
