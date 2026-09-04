import { tokenStorage } from '../../src/services/token-storage.js';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('tokenStorage', () => {
  it('saves, reads and clears the token pair', () => {
    tokenStorage.save({ accessToken: 'a', refreshToken: 'r' });
    expect(tokenStorage.getAccess()).toBe('a');
    expect(tokenStorage.getRefresh()).toBe('r');

    tokenStorage.clear();
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('returns null when reading throws (storage disabled)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(tokenStorage.getAccess()).toBeNull();
  });

  it('swallows write errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => tokenStorage.save({ accessToken: 'a', refreshToken: 'r' })).not.toThrow();
  });
});
