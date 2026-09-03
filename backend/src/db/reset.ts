import { sql } from 'drizzle-orm';
import { db, pool } from './client.js';

/** Drops all data (keeps the schema). Useful before a fresh seed. */
try {
  await db.execute(sql`
    TRUNCATE TABLE
      tarea_etiquetas, tarea_comentarios, tarea_permisos,
      notificaciones, notificacion_preferencias, audit_logs,
      tareas, etiquetas, categorias, usuarios
    RESTART IDENTITY CASCADE
  `);
  console.warn('All tables truncated.');
} catch (err) {
  console.error('Reset failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
