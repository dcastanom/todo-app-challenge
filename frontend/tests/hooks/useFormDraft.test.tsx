import { renderHook } from '@testing-library/react';
import { useFormDraft } from '../../src/hooks/useFormDraft.js';

beforeEach(() => localStorage.clear());

interface Draft {
  titulo: string;
}

describe('useFormDraft', () => {
  it('starts with no draft', () => {
    const { result } = renderHook(() => useFormDraft<Draft>('x'));
    expect(result.current.initial).toBeNull();
  });

  it('persists saved values and restores them on the next mount', () => {
    const first = renderHook(() => useFormDraft<Draft>('tarea'));
    first.result.current.save({ titulo: 'a medias' });

    const second = renderHook(() => useFormDraft<Draft>('tarea'));
    expect(second.result.current.initial).toEqual({ titulo: 'a medias' });
  });

  it('clear() drops the draft and blocks further saves', () => {
    const { result } = renderHook(() => useFormDraft<Draft>('tarea'));
    result.current.save({ titulo: 'algo' });
    result.current.clear();
    result.current.save({ titulo: 'después' });

    const next = renderHook(() => useFormDraft<Draft>('tarea'));
    expect(next.result.current.initial).toBeNull();
  });

  it('keys drafts independently', () => {
    renderHook(() => useFormDraft<Draft>('a')).result.current.save({ titulo: 'A' });
    const b = renderHook(() => useFormDraft<Draft>('b'));
    expect(b.result.current.initial).toBeNull();
  });
});
