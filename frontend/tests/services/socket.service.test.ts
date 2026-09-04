const socketMock = vi.hoisted(() => ({
  id: 'socket-1',
  connected: false,
  auth: {},
  connect: vi.fn(),
  disconnect: vi.fn(),
  onAny: vi.fn(),
}));
const ioFactory = vi.hoisted(() => vi.fn(() => socketMock));
vi.mock('socket.io-client', () => ({ io: ioFactory }));

import { connect, disconnect, getClientId, on } from '../../src/services/socket.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  socketMock.connected = false;
  disconnect();
});

describe('socket.service', () => {
  it('creates one socket and reuses it on subsequent connect() calls', () => {
    connect('token-a');
    connect('token-b');
    expect(ioFactory).toHaveBeenCalledTimes(1);
    expect(socketMock.auth).toEqual({ token: 'token-b' });
  });

  it('reconnects an existing disconnected socket instead of recreating it', () => {
    connect('token-a');
    socketMock.connected = false;
    connect('token-b');
    expect(socketMock.connect).toHaveBeenCalled();
  });

  it('getClientId is undefined until the socket reports connected', () => {
    connect('token-a');
    expect(getClientId()).toBeUndefined();
    socketMock.connected = true;
    expect(getClientId()).toBe('socket-1');
  });

  it('disconnect() tears down the socket and clears the client id', () => {
    connect('token-a');
    socketMock.connected = true;
    disconnect();
    expect(socketMock.disconnect).toHaveBeenCalled();
    expect(getClientId()).toBeUndefined();
  });

  it('on() delivers events dispatched via onAny, and unsubscribe stops delivery', () => {
    connect('token-a');
    const dispatch = socketMock.onAny.mock.calls[0]?.[0] as (e: string, p: unknown) => void;

    const handler = vi.fn();
    const unsubscribe = on('tarea:creada', handler);

    dispatch('tarea:creada', { id: 't1' });
    expect(handler).toHaveBeenCalledWith({ id: 't1' });

    unsubscribe();
    dispatch('tarea:creada', { id: 't2' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('on() registered before connect() still receives events', () => {
    const handler = vi.fn();
    on('tareas:reordenadas', handler);

    connect('token-a');
    const dispatch = socketMock.onAny.mock.calls[0]?.[0] as (e: string, p: unknown) => void;
    dispatch('tareas:reordenadas', { ids: ['a'] });

    expect(handler).toHaveBeenCalledWith({ ids: ['a'] });
  });
});
