import type { Tarea } from '../../../src/db/schema/index.js';
import { toTareaDTO } from '../../../src/modules/tareas/tareas.service.js';

describe('toTareaDTO', () => {
  const base: Tarea = {
    id: 'a1',
    usuarioId: 'u1',
    categoriaId: null,
    titulo: 'Comprar café',
    descripcion: null,
    prioridad: 'alta',
    completada: true,
    fechaVencimiento: new Date('2026-01-02T03:04:05.000Z'),
    completadaEn: new Date('2026-01-03T00:00:00.000Z'),
    posicion: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    deletedAt: null,
  };

  it('serialises dates to ISO strings and drops server-only fields', () => {
    const dto = toTareaDTO(base);
    expect(dto).toEqual({
      id: 'a1',
      titulo: 'Comprar café',
      descripcion: null,
      prioridad: 'alta',
      completada: true,
      fechaVencimiento: '2026-01-02T03:04:05.000Z',
      completadaEn: '2026-01-03T00:00:00.000Z',
      categoriaId: null,
      posicion: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    expect(dto).not.toHaveProperty('usuarioId');
    expect(dto).not.toHaveProperty('deletedAt');
  });

  it('keeps null dates as null', () => {
    const dto = toTareaDTO({ ...base, fechaVencimiento: null, completadaEn: null });
    expect(dto.fechaVencimiento).toBeNull();
    expect(dto.completadaEn).toBeNull();
  });
});
