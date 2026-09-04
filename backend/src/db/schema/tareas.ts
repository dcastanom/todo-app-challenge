import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { Prioridad } from '@todo/shared';
import { pk, softDelete, timestamps } from './_shared.js';
import { categorias } from './categorias.js';
import { usuarios } from './usuarios.js';

/** US-003 — the core entity. */
export const tareas = pgTable(
  'tareas',
  {
    id: pk(),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    categoriaId: uuid().references(() => categorias.id, { onDelete: 'set null' }),
    titulo: varchar({ length: 255 }).notNull(),
    descripcion: text(),
    prioridad: varchar({ length: 20 }).$type<Prioridad>().notNull().default('normal'),
    completada: boolean().notNull().default(false),
    fechaVencimiento: timestamp({ withTimezone: true }),
    completadaEn: timestamp({ withTimezone: true }),
    // Manual ordering for the drag & drop bonus (Fase 8); persisted per user.
    posicion: integer().notNull().default(0),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    check('chk_tareas_prioridad', sql`${table.prioridad} in ('baja', 'normal', 'alta', 'urgente')`),
    // Multidimensional filtering (Fase 6) + analytics (Fase 2).
    index('idx_tareas_usuario_completada').on(table.usuarioId, table.completada),
    index('idx_tareas_usuario_categoria').on(table.usuarioId, table.categoriaId),
    index('idx_tareas_usuario_prioridad_completada').on(
      table.usuarioId,
      table.prioridad,
      table.completada,
    ),
    index('idx_tareas_fecha_vencimiento').on(table.fechaVencimiento),
    index('idx_tareas_created_at').on(table.createdAt),
    index('idx_tareas_completada_en').on(table.completadaEn),
    index('idx_tareas_deleted_at').on(table.deletedAt),
    // Manual drag & drop order (Fase 8 bonus): sort by (usuario, posicion).
    index('idx_tareas_usuario_posicion').on(table.usuarioId, table.posicion),
    // Trigram indexes for `busqueda` (ILIKE '%term%'). Needs the pg_trgm
    // extension — the migration creates it.
    index('idx_tareas_titulo_trgm').using('gin', sql`${table.titulo} gin_trgm_ops`),
    index('idx_tareas_descripcion_trgm').using('gin', sql`${table.descripcion} gin_trgm_ops`),
  ],
);

export type Tarea = typeof tareas.$inferSelect;
export type NuevaTarea = typeof tareas.$inferInsert;
