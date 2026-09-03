import type {
  ActualizarTareaInput,
  ApiResponse,
  CrearTareaInput,
  ListarTareasQuery,
  PaginatedResponse,
  TareaDTO,
} from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';

export type ListarTareasParams = Partial<ListarTareasQuery>;

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
}

export const tareasApi = new TareasApi(httpClient);
