import type {
  ActualizarCategoriaInput,
  ApiResponse,
  CategoriaDTO,
  CrearCategoriaInput,
} from '@todo/shared';
import type { HttpClient } from './http.js';
import { httpClient } from './http.js';

export class CategoriasApi {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<CategoriaDTO[]> {
    return (await this.http.get<ApiResponse<CategoriaDTO[]>>('/categorias')).data;
  }

  async create(input: CrearCategoriaInput): Promise<CategoriaDTO> {
    return (await this.http.post<ApiResponse<CategoriaDTO>>('/categorias', input)).data;
  }

  async update(id: string, input: ActualizarCategoriaInput): Promise<CategoriaDTO> {
    return (await this.http.put<ApiResponse<CategoriaDTO>>(`/categorias/${id}`, input)).data;
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`/categorias/${id}`);
  }
}

export const categoriasApi = new CategoriasApi(httpClient);
