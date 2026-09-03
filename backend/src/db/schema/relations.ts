import { relations } from 'drizzle-orm';
import { auditLogs } from './audit-logs.js';
import { categorias } from './categorias.js';
import { etiquetas } from './etiquetas.js';
import { notificacionPreferencias } from './notificacion-preferencias.js';
import { notificaciones } from './notificaciones.js';
import { tareaComentarios } from './tarea-comentarios.js';
import { tareaEtiquetas } from './tarea-etiquetas.js';
import { tareaPermisos } from './tarea-permisos.js';
import { tareas } from './tareas.js';
import { usuarios } from './usuarios.js';

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  categorias: many(categorias),
  tareas: many(tareas),
  etiquetas: many(etiquetas),
  notificaciones: many(notificaciones),
  preferenciasNotificacion: one(notificacionPreferencias),
  comentarios: many(tareaComentarios),
}));

export const categoriasRelations = relations(categorias, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [categorias.usuarioId], references: [usuarios.id] }),
  tareas: many(tareas),
}));

export const tareasRelations = relations(tareas, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [tareas.usuarioId], references: [usuarios.id] }),
  categoria: one(categorias, { fields: [tareas.categoriaId], references: [categorias.id] }),
  etiquetas: many(tareaEtiquetas),
  comentarios: many(tareaComentarios),
  permisos: many(tareaPermisos),
}));

export const etiquetasRelations = relations(etiquetas, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [etiquetas.usuarioId], references: [usuarios.id] }),
  tareas: many(tareaEtiquetas),
}));

export const tareaEtiquetasRelations = relations(tareaEtiquetas, ({ one }) => ({
  tarea: one(tareas, { fields: [tareaEtiquetas.tareaId], references: [tareas.id] }),
  etiqueta: one(etiquetas, { fields: [tareaEtiquetas.etiquetaId], references: [etiquetas.id] }),
}));

export const notificacionesRelations = relations(notificaciones, ({ one }) => ({
  usuario: one(usuarios, { fields: [notificaciones.usuarioId], references: [usuarios.id] }),
  tarea: one(tareas, { fields: [notificaciones.tareaId], references: [tareas.id] }),
}));

export const notificacionPreferenciasRelations = relations(notificacionPreferencias, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [notificacionPreferencias.usuarioId],
    references: [usuarios.id],
  }),
}));

export const tareaPermisosRelations = relations(tareaPermisos, ({ one }) => ({
  tarea: one(tareas, { fields: [tareaPermisos.tareaId], references: [tareas.id] }),
  usuario: one(usuarios, { fields: [tareaPermisos.usuarioId], references: [usuarios.id] }),
}));

export const tareaComentariosRelations = relations(tareaComentarios, ({ one }) => ({
  tarea: one(tareas, { fields: [tareaComentarios.tareaId], references: [tareas.id] }),
  usuario: one(usuarios, { fields: [tareaComentarios.usuarioId], references: [usuarios.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  usuario: one(usuarios, { fields: [auditLogs.usuarioId], references: [usuarios.id] }),
}));
