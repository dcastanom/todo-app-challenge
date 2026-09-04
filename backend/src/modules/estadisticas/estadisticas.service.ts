import type { EstadisticasDTO, EstadisticasQuery } from '@todo/shared';
import type { Database } from '../../db/client.js';
import { withUserCache } from '../../lib/cache.js';
import { TAREAS_CACHE } from '../tareas/tareas.service.js';
import { EstadisticasRepository } from './estadisticas.repository.js';

export class EstadisticasService {
  private readonly repo: EstadisticasRepository;

  constructor(db: Database) {
    this.repo = new EstadisticasRepository(db);
  }

  /**
   * Cached under the same `tareas` namespace/version as the task list, so it
   * rides the exact invalidation every task/category/tag mutation already
   * triggers (`TareaService.invalidate`, `categorias`/`etiquetas` services) —
   * no separate cache-busting wiring needed.
   */
  resumen(usuarioId: string, query: EstadisticasQuery): Promise<EstadisticasDTO> {
    return withUserCache(
      TAREAS_CACHE.ns,
      usuarioId,
      { tipo: 'estadisticas', ...query },
      TAREAS_CACHE.ttl,
      async () => {
        const [totales, porPrioridad, porCategoria, actividad] = await Promise.all([
          this.repo.totales(usuarioId),
          this.repo.porPrioridad(usuarioId),
          this.repo.porCategoria(usuarioId),
          this.repo.actividad(usuarioId, query.dias),
        ]);

        return {
          total: totales.total,
          completadas: totales.completadas,
          pendientes: totales.total - totales.completadas,
          vencidas: totales.vencidas,
          tasaCompletado: totales.total > 0 ? totales.completadas / totales.total : 0,
          porPrioridad,
          porCategoria,
          actividad,
        };
      },
    );
  }
}
