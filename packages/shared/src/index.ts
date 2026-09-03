/**
 * @todo/shared — contract shared by backend and frontend.
 *
 * Phase 0 exposes only primitives and the API envelope. Domain types
 * (Tarea, Categoria, Etiqueta, Usuario) and their Zod schemas are added
 * in Phase 1 (DB schema) and Phase 3+ (feature phases).
 */
export * from './constants.js';
export * from './types/api.js';
export * from './schemas/common.js';
