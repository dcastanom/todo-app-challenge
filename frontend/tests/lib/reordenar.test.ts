import { moverItem } from '../../src/lib/reordenar.js';

describe('moverItem', () => {
  it('moves an item forward', () => {
    expect(moverItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward', () => {
    expect(moverItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns the same reference for a no-op move', () => {
    const list = ['a', 'b', 'c'];
    expect(moverItem(list, 1, 1)).toBe(list);
  });

  it('clamps out-of-range indices', () => {
    expect(moverItem(['a', 'b', 'c'], -5, 99)).toEqual(['b', 'c', 'a']);
  });

  it('handles an empty list', () => {
    const empty: string[] = [];
    expect(moverItem(empty, 0, 1)).toBe(empty);
  });

  it('does not mutate the input', () => {
    const list = ['a', 'b', 'c'];
    moverItem(list, 0, 2);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});
