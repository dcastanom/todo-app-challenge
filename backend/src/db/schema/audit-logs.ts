import { sql } from 'drizzle-orm';
import {
  check,
  index,
  inet,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk } from './_shared.js';
import { usuarios } from './usuarios.js';

/**
 * US-006 (P2) — append-only audit trail. Designed now; the write path
 * is wired up in Fase OPT-2.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: pk(),
    usuarioId: uuid().references(() => usuarios.id, { onDelete: 'set null' }),
    entidadTipo: varchar({ length: 50 }).notNull(),
    entidadId: uuid().notNull(),
    accion: varchar({ length: 20 }).notNull(),
    cambiosAntes: jsonb(),
    cambiosDespues: jsonb(),
    ipAddress: inet(),
    userAgent: text(),
    timestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_audit_logs_accion', sql`${table.accion} in ('CREATE', 'UPDATE', 'DELETE')`),
    index('idx_audit_logs_usuario_id').on(table.usuarioId),
    index('idx_audit_logs_entidad').on(table.entidadTipo, table.entidadId),
    index('idx_audit_logs_timestamp').on(table.timestamp),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NuevoAuditLog = typeof auditLogs.$inferInsert;
