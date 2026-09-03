import type { ActualizarCategoriaInput, CategoriaDTO, CrearCategoriaInput } from '@todo/shared';
import type { Database } from '../../db/client.js';
import type { Categoria } from '../../db/schema/index.js';
import { invalidateUser } from '../../lib/cache.js';
import { AppError } from '../../middleware/error-handler.js';
import { CategoriasRepository } from './categorias.repository.js';

export function toCategoriaDTO(c: Categoria): CategoriaDTO {
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    color: c.color,
    orden: c.orden,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export class CategoriaService {
  private readonly repo: CategoriasRepository;

  constructor(db: Database) {
    this.repo = new CategoriasRepository(db);
  }

  async list(usuarioId: string): Promise<CategoriaDTO[]> {
    return (await this.repo.list(usuarioId)).map(toCategoriaDTO);
  }

  private async getOwned(usuarioId: string, id: string): Promise<Categoria> {
    const row = await this.repo.findById(usuarioId, id);
    if (!row) throw new AppError(404, 'CATEGORIA_NO_ENCONTRADA', 'Categoría no encontrada');
    return row;
  }

  async get(usuarioId: string, id: string): Promise<CategoriaDTO> {
    return toCategoriaDTO(await this.getOwned(usuarioId, id));
  }

  async create(usuarioId: string, input: CrearCategoriaInput): Promise<CategoriaDTO> {
    void invalidateUser('tareas', usuarioId);
    if (await this.repo.nombreEnUso(usuarioId, input.nombre)) {
      throw new AppError(409, 'CATEGORIA_DUPLICADA', 'Ya tienes una categoría con ese nombre');
    }
    return toCategoriaDTO(
      await this.repo.create({
        usuarioId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        color: input.color,
      }),
    );
  }

  async update(
    usuarioId: string,
    id: string,
    input: ActualizarCategoriaInput,
  ): Promise<CategoriaDTO> {
    void invalidateUser('tareas', usuarioId);
    await this.getOwned(usuarioId, id);
    if (input.nombre !== undefined && (await this.repo.nombreEnUso(usuarioId, input.nombre, id))) {
      throw new AppError(409, 'CATEGORIA_DUPLICADA', 'Ya tienes una categoría con ese nombre');
    }
    const updated = await this.repo.update(usuarioId, id, {
      ...(input.nombre !== undefined && { nombre: input.nombre }),
      ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
      ...(input.color !== undefined && { color: input.color }),
    });
    if (!updated) throw new AppError(404, 'CATEGORIA_NO_ENCONTRADA', 'Categoría no encontrada');
    return toCategoriaDTO(updated);
  }

  async remove(usuarioId: string, id: string): Promise<void> {
    void invalidateUser('tareas', usuarioId);
    if (!(await this.repo.softDelete(usuarioId, id))) {
      throw new AppError(404, 'CATEGORIA_NO_ENCONTRADA', 'Categoría no encontrada');
    }
  }
}
