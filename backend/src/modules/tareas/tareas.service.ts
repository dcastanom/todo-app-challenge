import type {
  ActualizarTareaInput,
  CrearTareaInput,
  ListarTareasQuery,
  PaginatedResponse,
  TareaDTO,
} from '@todo/shared';
import type { Database } from '../../db/client.js';
import type { NuevaTarea, Tarea } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.js';
import { TareasRepository } from './tareas.repository.js';

export function toTareaDTO(t: Tarea): TareaDTO {
  return {
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    prioridad: t.prioridad,
    completada: t.completada,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    completadaEn: t.completadaEn?.toISOString() ?? null,
    categoriaId: t.categoriaId,
    posicion: t.posicion,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export class TareaService {
  private readonly repo: TareasRepository;

  constructor(db: Database) {
    this.repo = new TareasRepository(db);
  }

  private async assertCategoria(
    usuarioId: string,
    categoriaId: string | null | undefined,
  ): Promise<void> {
    if (categoriaId && !(await this.repo.categoriaPertenece(usuarioId, categoriaId))) {
      throw new AppError(422, 'CATEGORIA_INVALIDA', 'La categoría no existe o no te pertenece');
    }
  }

  private async getOwned(usuarioId: string, id: string): Promise<Tarea> {
    const tarea = await this.repo.findById(usuarioId, id);
    if (!tarea) throw new AppError(404, 'TAREA_NO_ENCONTRADA', 'Tarea no encontrada');
    return tarea;
  }

  async list(usuarioId: string, query: ListarTareasQuery): Promise<PaginatedResponse<TareaDTO>> {
    const { rows, total } = await this.repo.list(usuarioId, query);
    return {
      data: rows.map(toTareaDTO),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async get(usuarioId: string, id: string): Promise<TareaDTO> {
    return toTareaDTO(await this.getOwned(usuarioId, id));
  }

  async create(usuarioId: string, input: CrearTareaInput): Promise<TareaDTO> {
    await this.assertCategoria(usuarioId, input.categoriaId);
    const data: NuevaTarea = {
      usuarioId,
      titulo: input.titulo,
      descripcion: input.descripcion,
      prioridad: input.prioridad,
      categoriaId: input.categoriaId,
      fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : null,
    };
    return toTareaDTO(await this.repo.create(data));
  }

  async update(usuarioId: string, id: string, input: ActualizarTareaInput): Promise<TareaDTO> {
    await this.getOwned(usuarioId, id);
    if ('categoriaId' in input) await this.assertCategoria(usuarioId, input.categoriaId);

    const patch: Partial<NuevaTarea> = {};
    if (input.titulo !== undefined) patch.titulo = input.titulo;
    if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
    if (input.prioridad !== undefined) patch.prioridad = input.prioridad;
    if (input.categoriaId !== undefined) patch.categoriaId = input.categoriaId;
    if (input.fechaVencimiento !== undefined) {
      patch.fechaVencimiento = input.fechaVencimiento ? new Date(input.fechaVencimiento) : null;
    }

    const updated = await this.repo.update(usuarioId, id, patch);
    if (!updated) throw new AppError(404, 'TAREA_NO_ENCONTRADA', 'Tarea no encontrada');
    return toTareaDTO(updated);
  }

  /** `completada` omitted → toggle the current state. */
  async setCompletada(usuarioId: string, id: string, completada?: boolean): Promise<TareaDTO> {
    const current = await this.getOwned(usuarioId, id);
    const next = completada ?? !current.completada;
    const updated = await this.repo.update(usuarioId, id, {
      completada: next,
      completadaEn: next ? new Date() : null,
    });
    if (!updated) throw new AppError(404, 'TAREA_NO_ENCONTRADA', 'Tarea no encontrada');
    return toTareaDTO(updated);
  }

  async remove(usuarioId: string, id: string): Promise<void> {
    if (!(await this.repo.softDelete(usuarioId, id))) {
      throw new AppError(404, 'TAREA_NO_ENCONTRADA', 'Tarea no encontrada');
    }
  }
}
