import type {
  ActualizarTareaInput,
  ApiResponse,
  BatchResultado,
  BatchTareasInput,
  CrearTareaInput,
  FormatoExport,
  ListarTareasQuery,
  PaginatedResponse,
  TareaDTO,
  TareaFiltros,
} from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';

export type ListarTareasParams = Partial<ListarTareasQuery>;

export interface ExportBlob {
  blob: Blob;
  filename: string;
}

const FILENAME_RE = /filename="?([^"]+)"?/i;

export class TareasApi {
  constructor(private readonly http: HttpClient) {}

  list(params: ListarTareasParams = {}): Promise<PaginatedResponse<TareaDTO>> {
    return this.http.get<PaginatedResponse<TareaDTO>>('/tareas', { params });
  }

  async get(id: string): Promise<TareaDTO> {
    return (await this.http.get<ApiResponse<TareaDTO>>(`/tareas/${id}`)).data;
  }

  async create(input: CrearTareaInput): Promise<TareaDTO> {
    return (await this.http.post<ApiResponse<TareaDTO>>('/tareas', input)).data;
  }

  async update(id: string, input: ActualizarTareaInput): Promise<TareaDTO> {
    return (await this.http.put<ApiResponse<TareaDTO>>(`/tareas/${id}`, input)).data;
  }

  async setCompletada(id: string, completada?: boolean): Promise<TareaDTO> {
    return (await this.http.patch<ApiResponse<TareaDTO>>(`/tareas/${id}/completar`, { completada }))
      .data;
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`/tareas/${id}`);
  }

  /** Persists the manual drag & drop order (full ordered id list). */
  reorder(ids: string[]): Promise<void> {
    return this.http.patch<void>('/tareas/reorder', { ids });
  }

  /** Applies one bulk action to many tasks. */
  async batch(input: BatchTareasInput): Promise<BatchResultado> {
    return (await this.http.patch<ApiResponse<BatchResultado>>('/tareas/batch', input)).data;
  }

  /** Downloads the filtered task list as a CSV/JSON blob. */
  async exportar(formato: FormatoExport, filtros: TareaFiltros = {}): Promise<ExportBlob> {
    const res = await this.http.getRaw('/tareas/export', {
      params: { ...filtros, formato },
      responseType: 'blob',
    });
    const disposition =
      typeof res.headers?.['content-disposition'] === 'string'
        ? res.headers['content-disposition']
        : '';
    const filename = FILENAME_RE.exec(disposition)?.[1] ?? `tareas.${formato}`;
    return { blob: res.data as Blob, filename };
  }
}

export const tareasApi = new TareasApi(httpClient);
