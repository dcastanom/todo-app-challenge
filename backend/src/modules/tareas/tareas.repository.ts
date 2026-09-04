import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { ListarTareasQuery } from '@todo/shared';

/** The filter + sort slice — `buildWhere`/export don't need pagination. */
type TareaConsulta = Omit<ListarTareasQuery, 'page' | 'limit'>;
import type { Database } from '../../db/client.js';
import {
  categorias,
  etiquetas,
  tareaEtiquetas,
  tareas,
  type NuevaTarea,
} from '../../db/schema/index.js';

/** Priority rank so `orden=prioridad` sorts urgente → baja, not alphabetically. */
const prioridadRank = sql`
  CASE ${tareas.prioridad}
    WHEN 'urgente' THEN 4 WHEN 'alta' THEN 3 WHEN 'normal' THEN 2 ELSE 1
  END`;

const ORDEN_COLUMN = {
  created_at: tareas.createdAt,
  fecha_vencimiento: tareas.fechaVencimiento,
  titulo: tareas.titulo,
  prioridad: prioridadRank,
  posicion: tareas.posicion,
} as const;

const withRelaciones = {
  categoria: { columns: { id: true, nombre: true, color: true } },
  etiquetas: {
    columns: {},
    with: { etiqueta: { columns: { id: true, nombre: true, color: true } } },
  },
} as const;

export type TareaConRelaciones = NonNullable<Awaited<ReturnType<TareasRepository['findById']>>>;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export class TareasRepository {
  constructor(private readonly db: Database) {}

  /** Composes the WHERE clause from ownership + every active filter. */
  private buildWhere(usuarioId: string, q: TareaConsulta): SQL {
    const parts: (SQL | undefined)[] = [eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt)];

    if (q.completada !== undefined) parts.push(eq(tareas.completada, q.completada));
    if (q.prioridad) parts.push(eq(tareas.prioridad, q.prioridad));
    if (q.categoria) parts.push(eq(tareas.categoriaId, q.categoria));
    if (q.sinCategoria) parts.push(isNull(tareas.categoriaId));
    if (q.fechaDesde) parts.push(gte(tareas.fechaVencimiento, new Date(q.fechaDesde)));
    if (q.fechaHasta) parts.push(lte(tareas.fechaVencimiento, new Date(q.fechaHasta)));

    if (q.vencidas) {
      parts.push(
        eq(tareas.completada, false),
        isNotNull(tareas.fechaVencimiento),
        lt(tareas.fechaVencimiento, sql`now()`),
      );
    }

    if (q.busqueda) {
      const term = `%${escapeLike(q.busqueda)}%`;
      parts.push(or(ilike(tareas.titulo, term), ilike(tareas.descripcion, term)));
    }

    if (q.etiquetas && q.etiquetas.length > 0) {
      parts.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(tareaEtiquetas)
            .innerJoin(etiquetas, eq(etiquetas.id, tareaEtiquetas.etiquetaId))
            .where(
              and(
                eq(tareaEtiquetas.tareaId, tareas.id),
                isNull(etiquetas.deletedAt),
                inArray(etiquetas.nombre, q.etiquetas),
              ),
            ),
        ),
      );
    }

    return and(...parts) as SQL;
  }

  async list(usuarioId: string, query: ListarTareasQuery) {
    const where = this.buildWhere(usuarioId, query);
    const dir = query.direccion === 'asc' ? asc : desc;

    const [rows, [totalRow]] = await Promise.all([
      this.db.query.tareas.findMany({
        where,
        with: withRelaciones,
        orderBy: [dir(ORDEN_COLUMN[query.orden]), desc(tareas.createdAt)],
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
      }),
      this.db.select({ value: count() }).from(tareas).where(where),
    ]);

    return { rows, total: totalRow?.value ?? 0 };
  }

  /** Filtered rows with no pagination — for CSV/JSON export (hard-capped). */
  listForExport(usuarioId: string, query: TareaConsulta, limit: number) {
    const where = this.buildWhere(usuarioId, query);
    const dir = query.direccion === 'asc' ? asc : desc;
    return this.db.query.tareas.findMany({
      where,
      with: withRelaciones,
      orderBy: [dir(ORDEN_COLUMN[query.orden]), desc(tareas.createdAt)],
      limit,
    });
  }

  /** The subset of `ids` that are live tasks owned by the user. */
  async ownedIds(usuarioId: string, ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ id: tareas.id })
      .from(tareas)
      .where(
        and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt), inArray(tareas.id, ids)),
      );
    return rows.map((r) => r.id);
  }

  /** Writes `posicion = index` for every id, in one statement. */
  async reorder(usuarioId: string, ids: string[]): Promise<void> {
    const whenClauses = sql.join(
      ids.map((id, i) => sql`when ${tareas.id} = ${id} then ${i}`),
      sql.raw(' '),
    );
    await this.db
      .update(tareas)
      .set({
        posicion: sql`case ${whenClauses} else ${tareas.posicion} end`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt), inArray(tareas.id, ids)),
      );
  }

  /** Applies one patch to many owned tasks; returns the row count touched. */
  async bulkUpdate(usuarioId: string, ids: string[], patch: Partial<NuevaTarea>): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db
      .update(tareas)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt), inArray(tareas.id, ids)),
      )
      .returning({ id: tareas.id });
    return rows.length;
  }

  /** Soft-deletes many owned tasks; returns the row count touched. */
  async bulkSoftDelete(usuarioId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db
      .update(tareas)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt), inArray(tareas.id, ids)),
      )
      .returning({ id: tareas.id });
    return rows.length;
  }

  findById(usuarioId: string, id: string) {
    return this.db.query.tareas.findFirst({
      where: and(eq(tareas.id, id), eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt)),
      with: withRelaciones,
    });
  }

  async create(data: NuevaTarea, etiquetaIds: string[]): Promise<string> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.insert(tareas).values(data).returning({ id: tareas.id });
      const id = row!.id;
      if (etiquetaIds.length > 0) {
        await tx
          .insert(tareaEtiquetas)
          .values(etiquetaIds.map((etiquetaId) => ({ tareaId: id, etiquetaId })));
      }
      return id;
    });
  }

  async update(
    usuarioId: string,
    id: string,
    data: Partial<NuevaTarea>,
    etiquetaIds?: string[],
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const where = and(
        eq(tareas.id, id),
        eq(tareas.usuarioId, usuarioId),
        isNull(tareas.deletedAt),
      );

      // An update with only a tag change still touches updatedAt.
      const set = Object.keys(data).length > 0 ? data : { updatedAt: new Date() };
      const [row] = await tx.update(tareas).set(set).where(where).returning({ id: tareas.id });
      if (!row) return false;

      if (etiquetaIds !== undefined) {
        await tx.delete(tareaEtiquetas).where(eq(tareaEtiquetas.tareaId, id));
        if (etiquetaIds.length > 0) {
          await tx
            .insert(tareaEtiquetas)
            .values(etiquetaIds.map((etiquetaId) => ({ tareaId: id, etiquetaId })));
        }
      }
      return true;
    });
  }

  async softDelete(usuarioId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .update(tareas)
      .set({ deletedAt: new Date() })
      .where(and(eq(tareas.id, id), eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt)))
      .returning({ id: tareas.id });
    return row !== undefined;
  }

  async addEtiqueta(tareaId: string, etiquetaId: string): Promise<void> {
    await this.db.insert(tareaEtiquetas).values({ tareaId, etiquetaId }).onConflictDoNothing();
  }

  async removeEtiqueta(tareaId: string, etiquetaId: string): Promise<void> {
    await this.db
      .delete(tareaEtiquetas)
      .where(and(eq(tareaEtiquetas.tareaId, tareaId), eq(tareaEtiquetas.etiquetaId, etiquetaId)));
  }

  async categoriaPertenece(usuarioId: string, categoriaId: string): Promise<boolean> {
    const row = await this.db.query.categorias.findFirst({
      columns: { id: true },
      where: and(
        eq(categorias.id, categoriaId),
        eq(categorias.usuarioId, usuarioId),
        isNull(categorias.deletedAt),
      ),
    });
    return row !== undefined;
  }

  /** Returns the subset of `ids` that are live tags owned by the user. */
  async etiquetasValidas(usuarioId: string, ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(
        and(
          eq(etiquetas.usuarioId, usuarioId),
          isNull(etiquetas.deletedAt),
          inArray(etiquetas.id, ids),
        ),
      );
    return rows.map((r) => r.id);
  }
}
