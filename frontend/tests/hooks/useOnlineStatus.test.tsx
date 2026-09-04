import { act, renderHook } from '@testing-library/react';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus.js';

describe('useOnlineStatus', () => {
  let online = true;

  beforeEach(() => {
    online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  });

  it('reflects the initial navigator state', () => {
    online = false;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('updates on offline / online events', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      online = false;
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      online = true;
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
