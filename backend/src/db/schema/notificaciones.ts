import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk } from './_shared.js';
import { tareas } from './tareas.js';
import { usuarios } from './usuarios.js';

/**
 * US-007 (P1) — in-app notifications. Designed now; delivery/triggers
 * are implemented in Fase OPT-1.
 */
export const notificaciones = pgTable(
  'notificaciones',
  {
    id: pk(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    tareaId: uuid().references(() => tareas.id, { onDelete: 'set null' }),
    tipo: varchar({ length: 50 }).notNull(),
    titulo: varchar({ length: 255 }).notNull(),
    mensaje: text().notNull(),
    leida: boolean().notNull().default(false),
    leidaEn: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'chk_notificaciones_tipo',
      sql`${table.tipo} in ('tarea_vencida', 'tarea_proxima', 'tarea_compartida', 'comentario', 'sistema')`,
    ),
    index('idx_notificaciones_usuario_leida').on(table.usuarioId, table.leida),
    index('idx_notificaciones_created_at').on(table.createdAt),
  ],
);

export type Notificacion = typeof notificaciones.$inferSelect;
export type NuevaNotificacion = typeof notificaciones.$inferInsert;
