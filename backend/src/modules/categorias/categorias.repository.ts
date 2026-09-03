import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { categorias, tareas, type Categoria, type NuevaCategoria } from '../../db/schema/index.js';

export class CategoriasRepository {
  constructor(private readonly db: Database) {}

  private scope(usuarioId: string) {
    return and(eq(categorias.usuarioId, usuarioId), isNull(categorias.deletedAt));
  }

  list(usuarioId: string): Promise<Categoria[]> {
    return this.db.query.categorias.findMany({
      where: this.scope(usuarioId),
      orderBy: [asc(categorias.orden), asc(categorias.nombre)],
    });
  }

  findById(usuarioId: string, id: string): Promise<Categoria | undefined> {
    return this.db.query.categorias.findFirst({
      where: and(eq(categorias.id, id), this.scope(usuarioId)),
    });
  }

  async nombreEnUso(usuarioId: string, nombre: string, exceptoId?: string): Promise<boolean> {
    const row = await this.db.query.categorias.findFirst({
      columns: { id: true },
      where: and(
        eq(categorias.usuarioId, usuarioId),
        eq(categorias.nombre, nombre),
        isNull(categorias.deletedAt),
        exceptoId ? ne(categorias.id, exceptoId) : undefined,
      ),
    });
    return row !== undefined;
  }

  async create(data: NuevaCategoria): Promise<Categoria> {
    const [row] = await this.db.insert(categorias).values(data).returning();
    return row!;
  }

  async update(
    usuarioId: string,
    id: string,
    data: Partial<NuevaCategoria>,
  ): Promise<Categoria | undefined> {
    const [row] = await this.db
      .update(categorias)
      .set(data)
      .where(and(eq(categorias.id, id), this.scope(usuarioId)))
      .returning();
    return row;
  }

  async softDelete(usuarioId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(categorias)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(categorias.id, id),
            eq(categorias.usuarioId, usuarioId),
            isNull(categorias.deletedAt),
          ),
        )
        .returning({ id: categorias.id });
      if (!row) return false;
      // Tasks keep existing but lose the (now gone) category.
      await tx.update(tareas).set({ categoriaId: null }).where(eq(tareas.categoriaId, id));
      return true;
    });
  }
}
