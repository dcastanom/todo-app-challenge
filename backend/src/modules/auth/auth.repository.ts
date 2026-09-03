import { and, eq, isNull, or } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { usuarios, type NuevoUsuario, type Usuario } from '../../db/schema/index.js';

export class AuthRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<Usuario | undefined> {
    return this.db.query.usuarios.findFirst({
      where: and(eq(usuarios.email, email), isNull(usuarios.deletedAt)),
    });
  }

  async findById(id: string): Promise<Usuario | undefined> {
    return this.db.query.usuarios.findFirst({
      where: and(eq(usuarios.id, id), isNull(usuarios.deletedAt)),
    });
  }

  async existsEmailOrUsername(email: string, username: string): Promise<boolean> {
    const row = await this.db.query.usuarios.findFirst({
      columns: { id: true },
      where: and(
        or(eq(usuarios.email, email), eq(usuarios.username, username)),
        isNull(usuarios.deletedAt),
      ),
    });
    return row !== undefined;
  }

  async create(data: NuevoUsuario): Promise<Usuario> {
    const [row] = await this.db.insert(usuarios).values(data).returning();
    return row!;
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.db.update(usuarios).set({ ultimoAcceso: new Date() }).where(eq(usuarios.id, id));
  }
}
