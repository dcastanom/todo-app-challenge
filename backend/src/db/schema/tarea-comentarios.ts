import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from './_shared.js';
import { tareas } from './tareas.js';
import { usuarios } from './usuarios.js';

/**
 * US-010 (P3) — threaded comments on tasks. Designed now; exposed in
 * Fase OPT-3.
 */
export const tareaComentarios = pgTable(
  'tarea_comentarios',
  {
    id: pk(),
    tareaId: uuid()
      .notNull()
      .references(() => tareas.id, { onDelete: 'cascade' }),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    contenido: text().notNull(),
    editado: boolean().notNull().default(false),
    ...timestamps,
    ...softDelete,
  },
  (table) => [index('idx_tarea_comentarios_tarea_created').on(table.tareaId, table.createdAt)],
);

export type TareaComentario = typeof tareaComentarios.$inferSelect;
export type NuevoTareaComentario = typeof tareaComentarios.$inferInsert;
