import { and, asc, count, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import type { ListarTareasQuery } from '@todo/shared';
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
} as const;

const withRelaciones = {
  categoria: { columns: { id: true, nombre: true, color: true } },
  etiquetas: {
    columns: {},
    with: { etiqueta: { columns: { id: true, nombre: true, color: true } } },
  },
} as const;

export type TareaConRelaciones = NonNullable<Awaited<ReturnType<TareasRepository['findById']>>>;

export class TareasRepository {
  constructor(private readonly db: Database) {}

  private scope(usuarioId: string): SQL | undefined {
    return and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt));
  }

  async list(usuarioId: string, query: ListarTareasQuery) {
    const where = this.scope(usuarioId);
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

  findById(usuarioId: string, id: string) {
    return this.db.query.tareas.findFirst({
      where: and(eq(tareas.id, id), this.scope(usuarioId)),
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
      .where(and(eq(tareas.id, id), this.scope(usuarioId)))
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
