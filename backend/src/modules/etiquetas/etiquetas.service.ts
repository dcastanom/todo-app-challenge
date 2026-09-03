import type { ActualizarEtiquetaInput, CrearEtiquetaInput, EtiquetaDTO } from '@todo/shared';
import type { Database } from '../../db/client.js';
import type { Etiqueta } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.js';
import { EtiquetasRepository } from './etiquetas.repository.js';

export function toEtiquetaDTO(e: Etiqueta): EtiquetaDTO {
  return { id: e.id, nombre: e.nombre, color: e.color, createdAt: e.createdAt.toISOString() };
}

export class EtiquetaService {
  private readonly repo: EtiquetasRepository;

  constructor(db: Database) {
    this.repo = new EtiquetasRepository(db);
  }

  async list(usuarioId: string): Promise<EtiquetaDTO[]> {
    return (await this.repo.list(usuarioId)).map(toEtiquetaDTO);
  }

  private async getOwned(usuarioId: string, id: string): Promise<Etiqueta> {
    const row = await this.repo.findById(usuarioId, id);
    if (!row) throw new AppError(404, 'ETIQUETA_NO_ENCONTRADA', 'Etiqueta no encontrada');
    return row;
  }

  async get(usuarioId: string, id: string): Promise<EtiquetaDTO> {
    return toEtiquetaDTO(await this.getOwned(usuarioId, id));
  }

  async create(usuarioId: string, input: CrearEtiquetaInput): Promise<EtiquetaDTO> {
    if (await this.repo.nombreEnUso(usuarioId, input.nombre)) {
      throw new AppError(409, 'ETIQUETA_DUPLICADA', 'Ya tienes una etiqueta con ese nombre');
    }
    return toEtiquetaDTO(
      await this.repo.create({ usuarioId, nombre: input.nombre, color: input.color }),
    );
  }

  async update(
    usuarioId: string,
    id: string,
    input: ActualizarEtiquetaInput,
  ): Promise<EtiquetaDTO> {
    await this.getOwned(usuarioId, id);
    if (input.nombre !== undefined && (await this.repo.nombreEnUso(usuarioId, input.nombre, id))) {
      throw new AppError(409, 'ETIQUETA_DUPLICADA', 'Ya tienes una etiqueta con ese nombre');
    }
    const updated = await this.repo.update(usuarioId, id, {
      ...(input.nombre !== undefined && { nombre: input.nombre }),
      ...(input.color !== undefined && { color: input.color }),
    });
    if (!updated) throw new AppError(404, 'ETIQUETA_NO_ENCONTRADA', 'Etiqueta no encontrada');
    return toEtiquetaDTO(updated);
  }

  async remove(usuarioId: string, id: string): Promise<void> {
    if (!(await this.repo.softDelete(usuarioId, id))) {
      throw new AppError(404, 'ETIQUETA_NO_ENCONTRADA', 'Etiqueta no encontrada');
    }
  }
}
