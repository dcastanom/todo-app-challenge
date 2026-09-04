import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
  EstadisticaActividadDia,
  EstadisticaCategoria,
  EstadisticaPrioridad,
} from '@todo/shared';
import type { Database } from '../../db/client.js';
import { categorias, tareas } from '../../db/schema/index.js';

interface ActividadRow {
  fecha: string;
  creadas: number;
  completadas: number;
}

/** Aggregate counts backing `GET /api/v1/estadisticas` — every query is
 *  scoped to the owning user and ignores soft-deleted rows. */
export class EstadisticasRepository {
  constructor(private readonly db: Database) {}

  private base(usuarioId: string) {
    return and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt));
  }

  async totales(
    usuarioId: string,
  ): Promise<{ total: number; completadas: number; vencidas: number }> {
    const [row] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        completadas: sql<number>`count(*) filter (where ${tareas.completada})::int`,
        vencidas: sql<number>`count(*) filter (
          where not ${tareas.completada}
            and ${tareas.fechaVencimiento} is not null
            and ${tareas.fechaVencimiento} < now()
        )::int`,
      })
      .from(tareas)
      .where(this.base(usuarioId));
    return row ?? { total: 0, completadas: 0, vencidas: 0 };
  }

  porPrioridad(usuarioId: string): Promise<EstadisticaPrioridad[]> {
    return this.db
      .select({
        prioridad: tareas.prioridad,
        total: sql<number>`count(*)::int`,
        completadas: sql<number>`count(*) filter (where ${tareas.completada})::int`,
      })
      .from(tareas)
      .where(this.base(usuarioId))
      .groupBy(tareas.prioridad);
  }

  async porCategoria(usuarioId: string): Promise<EstadisticaCategoria[]> {
    const rows = await this.db
      .select({
        categoriaId: tareas.categoriaId,
        nombre: categorias.nombre,
        color: categorias.color,
        total: sql<number>`count(*)::int`,
        completadas: sql<number>`count(*) filter (where ${tareas.completada})::int`,
      })
      .from(tareas)
      .leftJoin(categorias, eq(categorias.id, tareas.categoriaId))
      .where(this.base(usuarioId))
      .groupBy(tareas.categoriaId, categorias.nombre, categorias.color);

    return rows.map((r) => ({
      categoriaId: r.categoriaId,
      nombre: r.categoriaId ? (r.nombre ?? 'Sin categoría') : 'Sin categoría',
      color: r.color,
      total: r.total,
      completadas: r.completadas,
    }));
  }

  /**
   * Daily creation/completion counts for the last `dias` days (today
   * inclusive). `generate_series` has no typed Drizzle builder equivalent,
   * so this is raw SQL — still fully parameterized via the `sql` tag (same
   * technique as the reorder `CASE WHEN` in `tareas.repository.ts`), not
   * string concatenation.
   */
  async actividad(usuarioId: string, dias: number): Promise<EstadisticaActividadDia[]> {
    const result = await this.db.execute(sql`
      select
        dia::date::text as fecha,
        count(*) filter (where t.creado = dia)::int as creadas,
        count(*) filter (where t.completado = dia)::int as completadas
      from generate_series(
        current_date - (${dias}::int - 1) * interval '1 day', current_date, interval '1 day'
      ) as dia
      left join (
        select
          date_trunc('day', ${tareas.createdAt})::date as creado,
          date_trunc('day', ${tareas.completadaEn})::date as completado
        from ${tareas}
        where ${tareas.usuarioId} = ${usuarioId} and ${tareas.deletedAt} is null
      ) t on t.creado = dia or t.completado = dia
      group by dia
      order by dia
    `);
    return (result.rows as unknown as ActividadRow[]).map((r) => ({
      fecha: r.fecha,
      creadas: Number(r.creadas),
      completadas: Number(r.completadas),
    }));
  }
}
