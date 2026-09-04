import { safeStorage } from '../../src/lib/safe-storage.js';

beforeEach(() => localStorage.clear());

describe('safeStorage', () => {
  it('round-trips a JSON value', () => {
    safeStorage.set('k', { a: 1, b: ['x'] });
    expect(safeStorage.get<{ a: number; b: string[] }>('k')).toEqual({ a: 1, b: ['x'] });
  });

  it('returns null for a missing key', () => {
    expect(safeStorage.get('nope')).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('bad', '{not json');
    expect(safeStorage.get('bad')).toBeNull();
  });

  it('removes a key', () => {
    safeStorage.set('k', 1);
    safeStorage.remove('k');
    expect(safeStorage.get('k')).toBeNull();
  });

  it('never throws when setItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => safeStorage.set('k', 1)).not.toThrow();
    spy.mockRestore();
  });
});
