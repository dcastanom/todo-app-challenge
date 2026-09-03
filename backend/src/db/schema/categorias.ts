import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from './_shared.js';
import { usuarios } from './usuarios.js';

/** US-002 — user-owned task categories (1:N with tareas). */
export const categorias = pgTable(
  'categorias',
  {
    id: pk(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    nombre: varchar({ length: 100 }).notNull(),
    descripcion: text(),
    color: varchar({ length: 7 }).notNull().default('#3498db'),
    orden: integer().notNull().default(0),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    index('idx_categorias_usuario_id').on(table.usuarioId),
    index('idx_categorias_deleted_at').on(table.deletedAt),
    // One active category name per user; soft-deleted rows are exempt.
    uniqueIndex('uq_categorias_usuario_nombre')
      .on(table.usuarioId, table.nombre)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type Categoria = typeof categorias.$inferSelect;
export type NuevaCategoria = typeof categorias.$inferInsert;
