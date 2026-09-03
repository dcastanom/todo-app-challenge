import { boolean, integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { pk, timestamps } from './_shared.js';
import { usuarios } from './usuarios.js';

/**
 * US-008 (P1) — per-user notification settings (1:1 with usuarios).
 * Designed now; consumed in Fase OPT-1.
 */
export const notificacionPreferencias = pgTable('notificacion_preferencias', {
  id: pk(),
  usuarioId: uuid()
    .notNull()
    .unique('uq_notificacion_preferencias_usuario')
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  emailHabilitado: boolean().notNull().default(true),
  pushHabilitado: boolean().notNull().default(true),
  recordatorioVencimiento: boolean().notNull().default(true),
  horasAntesRecordatorio: integer().notNull().default(24),
  digestDiario: boolean().notNull().default(false),
  ...timestamps,
});

export type NotificacionPreferencia = typeof notificacionPreferencias.$inferSelect;
export type NuevaNotificacionPreferencia = typeof notificacionPreferencias.$inferInsert;
