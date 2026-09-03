import type { TareaConRelaciones } from '../../../src/modules/tareas/tareas.repository.js';
import { toTareaDTO } from '../../../src/modules/tareas/tareas.service.js';

const base: TareaConRelaciones = {
  id: 'a1',
  usuarioId: 'u1',
  categoriaId: 'c1',
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
  categoria: { id: 'c1', nombre: 'Compras', color: '#1abc9c' },
  etiquetas: [{ etiqueta: { id: 'e1', nombre: 'urgente', color: '#c0392b' } }],
};

describe('toTareaDTO', () => {
  it('serialises dates, embeds categoria/etiquetas and drops server-only fields', () => {
    const dto = toTareaDTO(base);
    expect(dto).toEqual({
      id: 'a1',
      titulo: 'Comprar café',
      descripcion: null,
      prioridad: 'alta',
      completada: true,
      fechaVencimiento: '2026-01-02T03:04:05.000Z',
      completadaEn: '2026-01-03T00:00:00.000Z',
      categoriaId: 'c1',
      categoria: { id: 'c1', nombre: 'Compras', color: '#1abc9c' },
      etiquetas: [{ id: 'e1', nombre: 'urgente', color: '#c0392b' }],
      posicion: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    expect(dto).not.toHaveProperty('usuarioId');
    expect(dto).not.toHaveProperty('deletedAt');
  });

  it('handles a task with no category and no tags', () => {
    const dto = toTareaDTO({
      ...base,
      categoriaId: null,
      categoria: null,
      etiquetas: [],
      fechaVencimiento: null,
      completadaEn: null,
    });
    expect(dto.categoria).toBeNull();
    expect(dto.etiquetas).toEqual([]);
    expect(dto.fechaVencimiento).toBeNull();
  });
});
