import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { etiquetas } from './etiquetas.js';
import { tareas } from './tareas.js';

/** US-005 — junction table for the tareas <-> etiquetas M:N relationship. */
export const tareaEtiquetas = pgTable(
  'tarea_etiquetas',
  {
    tareaId: uuid()
      .notNull()
      .references(() => tareas.id, { onDelete: 'cascade' }),
    etiquetaId: uuid()
      .notNull()
      .references(() => etiquetas.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tareaId, table.etiquetaId] }),
    index('idx_tarea_etiquetas_etiqueta_id').on(table.etiquetaId),
  ],
);

export type TareaEtiqueta = typeof tareaEtiquetas.$inferSelect;
export type NuevaTareaEtiqueta = typeof tareaEtiquetas.$inferInsert;
