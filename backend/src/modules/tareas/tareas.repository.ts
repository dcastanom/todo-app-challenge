import { and, asc, count, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { ListarTareasQuery } from '@todo/shared';
import type { Database } from '../../db/client.js';
import { categorias, tareas, type NuevaTarea, type Tarea } from '../../db/schema/index.js';

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

export class TareasRepository {
  constructor(private readonly db: Database) {}

  private scope(usuarioId: string): SQL | undefined {
    return and(eq(tareas.usuarioId, usuarioId), isNull(tareas.deletedAt));
  }

  async list(
    usuarioId: string,
    query: ListarTareasQuery,
  ): Promise<{ rows: Tarea[]; total: number }> {
    const where = this.scope(usuarioId);
    const dir = query.direccion === 'asc' ? asc : desc;
    const orderExpr = ORDEN_COLUMN[query.orden];

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select()
        .from(tareas)
        .where(where)
        .orderBy(dir(orderExpr), desc(tareas.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.db.select({ value: count() }).from(tareas).where(where),
    ]);

    return { rows, total: totalRow?.value ?? 0 };
  }

  findById(usuarioId: string, id: string): Promise<Tarea | undefined> {
    return this.db.query.tareas.findFirst({
      where: and(eq(tareas.id, id), this.scope(usuarioId)),
    });
  }

  async create(data: NuevaTarea): Promise<Tarea> {
    const [row] = await this.db.insert(tareas).values(data).returning();
    return row!;
  }

  async update(
    usuarioId: string,
    id: string,
    data: Partial<NuevaTarea>,
  ): Promise<Tarea | undefined> {
    const [row] = await this.db
      .update(tareas)
      .set(data)
      .where(and(eq(tareas.id, id), this.scope(usuarioId)))
      .returning();
    return row;
  }

  async softDelete(usuarioId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .update(tareas)
      .set({ deletedAt: new Date() })
      .where(and(eq(tareas.id, id), this.scope(usuarioId)))
      .returning({ id: tareas.id });
    return row !== undefined;
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
}
