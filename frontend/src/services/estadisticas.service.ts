import type { ApiResponse, EstadisticasDTO } from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';

export class EstadisticasApi {
  constructor(private readonly http: HttpClient) {}

  async resumen(dias?: number): Promise<EstadisticasDTO> {
    const res = await this.http.get<ApiResponse<EstadisticasDTO>>('/estadisticas', {
      params: dias ? { dias } : undefined,
    });
    return res.data;
  }
}

export const estadisticasApi = new EstadisticasApi(httpClient);
