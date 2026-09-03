import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from './_shared.js';

/** US-001 — application users / account owners. */
export const usuarios = pgTable(
  'usuarios',
  {
    id: pk(),
    email: varchar({ length: 255 }).notNull().unique(),
    username: varchar({ length: 100 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),
    nombreCompleto: varchar({ length: 255 }),
    fotoPerfilUrl: varchar({ length: 500 }),
    // Consumed by analytics Q8 (priority distribution for users active in the last 7 days).
    ultimoAcceso: timestamp({ withTimezone: true }),
    ...timestamps,
    ...softDelete,
  },
  (table) => [index('idx_usuarios_deleted_at').on(table.deletedAt)],
);

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
