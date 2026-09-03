import { sql } from 'drizzle-orm';
import { index, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from './_shared.js';
import { usuarios } from './usuarios.js';

/** US-004 — user-owned tags (M:N with tareas via tarea_etiquetas). */
export const etiquetas = pgTable(
  'etiquetas',
  {
    id: pk(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    nombre: varchar({ length: 50 }).notNull(),
    color: varchar({ length: 7 }).notNull().default('#95a5a6'),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    index('idx_etiquetas_usuario_id').on(table.usuarioId),
    index('idx_etiquetas_deleted_at').on(table.deletedAt),
    uniqueIndex('uq_etiquetas_usuario_nombre')
      .on(table.usuarioId, table.nombre)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type Etiqueta = typeof etiquetas.$inferSelect;
export type NuevaEtiqueta = typeof etiquetas.$inferInsert;
