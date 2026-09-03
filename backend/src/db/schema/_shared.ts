import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** UUID v4 primary key — `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` (ADR-005). */
export const pk = () => uuid().primaryKey().defaultRandom();

/**
 * Audit timestamps present on almost every table.
 * `deletedAt` implements soft deletes — every read must filter
 * `deletedAt IS NULL` (see repositories in later phases).
 */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const softDelete = {
  deletedAt: timestamp({ withTimezone: true }),
};
