/**
 * Drizzle schema barrel — the single entry point referenced by
 * `drizzle.config.ts` and the runtime client.
 *
 * 10 tables (US-001..US-010):
 *   Core:   usuarios, categorias, tareas, etiquetas, tarea_etiquetas
 *   P2:     audit_logs
 *   P1:     notificaciones, notificacion_preferencias
 *   P3:     tarea_permisos, tarea_comentarios
 */
export * from './usuarios.js';
export * from './categorias.js';
export * from './tareas.js';
export * from './etiquetas.js';
export * from './tarea-etiquetas.js';
export * from './audit-logs.js';
export * from './notificaciones.js';
export * from './notificacion-preferencias.js';
export * from './tarea-permisos.js';
export * from './tarea-comentarios.js';
export * from './relations.js';
