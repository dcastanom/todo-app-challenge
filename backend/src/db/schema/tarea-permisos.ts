import { sql } from 'drizzle-orm';
import { check, index, pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_shared.js';
import { tareas } from './tareas.js';
import { usuarios } from './usuarios.js';

/**
 * US-009 (P3) — task sharing / collaboration grants. Designed now;
 * enforced in Fase OPT-3.
 */
export const tareaPermisos = pgTable(
  'tarea_permisos',
  {
    id: pk(),
    tareaId: uuid()
      .notNull()
      .references(() => tareas.id, { onDelete: 'cascade' }),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    nivel: varchar({ length: 20 }).notNull(),
    concedidoPor: uuid().references(() => usuarios.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => [
    check('chk_tarea_permisos_nivel', sql`${table.nivel} in ('lectura', 'escritura', 'admin')`),
    uniqueIndex('uq_tarea_permisos_tarea_usuario').on(table.tareaId, table.usuarioId),
    index('idx_tarea_permisos_usuario_id').on(table.usuarioId),
  ],
);

export type TareaPermiso = typeof tareaPermisos.$inferSelect;
export type NuevoTareaPermiso = typeof tareaPermisos.$inferInsert;
