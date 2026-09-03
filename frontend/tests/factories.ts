import type { CategoriaDTO, EtiquetaDTO, PaginatedResponse, TareaDTO } from '@todo/shared';
import type { UseFilters } from '../src/hooks/useFilters.js';
import type { UseTodos } from '../src/hooks/useTodos.js';

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

export function makeFilters(over: Partial<UseFilters> = {}): UseFilters {
  return {
    filtros: {},
    set: vi.fn(),
    toggleEtiqueta: vi.fn(),
    clear: vi.fn(),
    activos: 0,
    ...over,
  };
}

export function makeTodos(over: Partial<UseTodos> = {}): UseTodos {
  return {
    tareas: [],
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
    orden: 'created_at',
    direccion: 'desc',
    status: 'ready',
    error: null,
    setPage: vi.fn(),
    setSort: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    crear: vi.fn().mockResolvedValue(undefined),
    actualizar: vi.fn().mockResolvedValue(undefined),
    eliminar: vi.fn().mockResolvedValue(undefined),
    toggleCompletada: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}
