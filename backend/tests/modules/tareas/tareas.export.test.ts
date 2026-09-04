import type { TareaDTO } from '@todo/shared';
import { serializeExport } from '../../../src/modules/tareas/tareas.export.js';

const tarea = (over: Partial<TareaDTO> = {}): TareaDTO => ({
  id: 't1',
  titulo: 'Comprar café',
  descripcion: null,
  prioridad: 'alta',
  completada: false,
  fechaVencimiento: null,
  completadaEn: null,
  categoriaId: null,
  categoria: null,
  etiquetas: [],
  posicion: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('serializeExport', () => {
  it('produces CSV with a header and one line per task', () => {
    const { body, contentType, filename } = serializeExport(
      [
        tarea(),
        tarea({
          id: 't2',
          titulo: 'Título, con coma',
          completada: true,
          categoria: { id: 'c1', nombre: 'Casa', color: '#000' },
          etiquetas: [{ id: 'e1', nombre: 'urgente', color: '#f00' }],
        }),
      ],
      'csv',
    );
    const lines = body.split('\r\n');
    expect(lines[0]).toContain('titulo');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('Comprar café');
    expect(lines[2]).toContain('"Título, con coma"');
    expect(lines[2]).toContain('Casa');
    expect(lines[2]).toContain('urgente');
    expect(contentType).toMatch(/text\/csv/);
    expect(filename).toMatch(/^tareas-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('produces pretty JSON with an envelope', () => {
    const { body, contentType, filename } = serializeExport([tarea()], 'json');
    const parsed = JSON.parse(body) as { total: number; tareas: TareaDTO[]; exportadoEn: string };
    expect(parsed.total).toBe(1);
    expect(parsed.tareas[0]?.id).toBe('t1');
    expect(parsed.exportadoEn).toBeTruthy();
    expect(contentType).toMatch(/application\/json/);
    expect(filename).toMatch(/\.json$/);
  });
});
