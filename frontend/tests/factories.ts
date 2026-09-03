import type { CategoriaDTO, EtiquetaDTO, PaginatedResponse, TareaDTO } from '@todo/shared';

export function makeTarea(over: Partial<TareaDTO> = {}): TareaDTO {
  return {
    id: 't1',
    titulo: 'Tarea',
    descripcion: null,
    prioridad: 'normal',
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
  };
}

export function makeCategoria(over: Partial<CategoriaDTO> = {}): CategoriaDTO {
  return {
    id: 'c1',
    nombre: 'Trabajo',
    descripcion: null,
    color: '#3498db',
    orden: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

export function makeEtiqueta(over: Partial<EtiquetaDTO> = {}): EtiquetaDTO {
  return {
    id: 'e1',
    nombre: 'urgente',
    color: '#c0392b',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

export function makePage(rows: TareaDTO[]): PaginatedResponse<TareaDTO> {
  return { data: rows, meta: { page: 1, limit: 20, total: rows.length, totalPages: 1 } };
}
