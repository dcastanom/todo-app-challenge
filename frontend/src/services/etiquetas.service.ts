import type {
  ActualizarEtiquetaInput,
  ApiResponse,
  CrearEtiquetaInput,
  EtiquetaDTO,
} from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';

export class EtiquetasApi {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<EtiquetaDTO[]> {
    return (await this.http.get<ApiResponse<EtiquetaDTO[]>>('/etiquetas')).data;
  }

  async create(input: CrearEtiquetaInput): Promise<EtiquetaDTO> {
    return (await this.http.post<ApiResponse<EtiquetaDTO>>('/etiquetas', input)).data;
  }

  async update(id: string, input: ActualizarEtiquetaInput): Promise<EtiquetaDTO> {
    return (await this.http.put<ApiResponse<EtiquetaDTO>>(`/etiquetas/${id}`, input)).data;
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`/etiquetas/${id}`);
  }
}

export const etiquetasApi = new EtiquetasApi(httpClient);
