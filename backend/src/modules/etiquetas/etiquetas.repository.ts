import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import {
  etiquetas,
  tareaEtiquetas,
  type Etiqueta,
  type NuevaEtiqueta,
} from '../../db/schema/index.js';

export class EtiquetasRepository {
  constructor(private readonly db: Database) {}

  private scope(usuarioId: string) {
    return and(eq(etiquetas.usuarioId, usuarioId), isNull(etiquetas.deletedAt));
  }

  list(usuarioId: string): Promise<Etiqueta[]> {
    return this.db.query.etiquetas.findMany({
      where: this.scope(usuarioId),
      orderBy: [asc(etiquetas.nombre)],
    });
  }

  findById(usuarioId: string, id: string): Promise<Etiqueta | undefined> {
    return this.db.query.etiquetas.findFirst({
      where: and(eq(etiquetas.id, id), this.scope(usuarioId)),
    });
  }

  async nombreEnUso(usuarioId: string, nombre: string, exceptoId?: string): Promise<boolean> {
    const row = await this.db.query.etiquetas.findFirst({
      columns: { id: true },
      where: and(
        eq(etiquetas.usuarioId, usuarioId),
        eq(etiquetas.nombre, nombre),
        isNull(etiquetas.deletedAt),
        exceptoId ? ne(etiquetas.id, exceptoId) : undefined,
      ),
    });
    return row !== undefined;
  }

  async create(data: NuevaEtiqueta): Promise<Etiqueta> {
    const [row] = await this.db.insert(etiquetas).values(data).returning();
    return row!;
  }

  async update(
    usuarioId: string,
    id: string,
    data: Partial<NuevaEtiqueta>,
  ): Promise<Etiqueta | undefined> {
    const [row] = await this.db
      .update(etiquetas)
      .set(data)
      .where(and(eq(etiquetas.id, id), this.scope(usuarioId)))
      .returning();
    return row;
  }

  async softDelete(usuarioId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(etiquetas)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(etiquetas.id, id),
            eq(etiquetas.usuarioId, usuarioId),
            isNull(etiquetas.deletedAt),
          ),
        )
        .returning({ id: etiquetas.id });
      if (!row) return false;
      await tx.delete(tareaEtiquetas).where(eq(tareaEtiquetas.etiquetaId, id));
      return true;
    });
  }
}
