import { REALTIME_EVENTS } from '@todo/shared';
import { emitToUser, resetIo, setIo } from '../../src/realtime/emitter.js';

describe('realtime emitter', () => {
  afterEach(() => {
    resetIo();
  });

  it('is a no-op when no Socket.IO server is wired up (e.g. under supertest)', () => {
    expect(() =>
      emitToUser('user-1', REALTIME_EVENTS.TAREA_CREADA, { id: 'x' } as never),
    ).not.toThrow();
  });

  it('broadcasts to the user room, excluding the originating client', () => {
    const emit = jest.fn();
    const except = jest.fn(() => ({ emit }));
    const to = jest.fn(() => ({ except, emit }));
    setIo({ to } as never);

    const payload = { id: 't1' };
    emitToUser('user-1', REALTIME_EVENTS.TAREA_ELIMINADA, payload, 'socket-abc');

    expect(to).toHaveBeenCalledWith('usuario:user-1');
    expect(except).toHaveBeenCalledWith('socket-abc');
    expect(emit).toHaveBeenCalledWith(REALTIME_EVENTS.TAREA_ELIMINADA, payload);
  });

  it('broadcasts to the whole room when no client is excluded', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    setIo({ to } as never);

    emitToUser('user-2', REALTIME_EVENTS.CATEGORIAS_CAMBIARON, {});

    expect(to).toHaveBeenCalledWith('usuario:user-2');
    expect(emit).toHaveBeenCalledWith(REALTIME_EVENTS.CATEGORIAS_CAMBIARON, {});
  });
});
