import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker/locale/es';
import type {
  NuevaEtiqueta,
  NuevaCategoria,
  NuevaTarea,
  NuevaTareaEtiqueta,
  NuevoUsuario,
} from '../schema/index.js';
import { COUNTS, HISTORY_DAYS, PRIORIDAD_PESOS, RATIOS } from './config.js';
import {
  addDays,
  atWorkingHour,
  biasToWeekday,
  chance,
  DAY_MS,
  intBetween,
  notFuture,
  randomCreatedAt,
  weightedPick,
} from './helpers.js';

interface BuildResult {
  tareas: NuevaTarea[];
  tareaEtiquetas: NuevaTareaEtiqueta[];
}

function groupByUsuario<T extends { usuarioId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.usuarioId) ?? [];
    list.push(row);
    map.set(row.usuarioId, list);
  }
  return map;
}

/** US-013 — 28-46 tareas per user (~600-800 total) + their tag links. */
export function buildTareas(
  usuarios: NuevoUsuario[],
  categorias: NuevaCategoria[],
  etiquetas: NuevaEtiqueta[],
): BuildResult {
  const categoriasByUsuario = groupByUsuario(categorias);
  const etiquetasByUsuario = groupByUsuario(etiquetas);

  const tareas: NuevaTarea[] = [];
  const tareaEtiquetas: NuevaTareaEtiqueta[] = [];

  for (const usuario of usuarios) {
    const usuarioId = usuario.id!;
    const usuarioCreado = usuario.createdAt ?? new Date(Date.now() - HISTORY_DAYS * 86_400_000);
    const misCategorias = categoriasByUsuario.get(usuarioId) ?? [];
    const misEtiquetas = etiquetasByUsuario.get(usuarioId) ?? [];
    const count = intBetween(COUNTS.tareasPorUsuario);
    let posicion = 0;

    for (let i = 0; i < count; i++) {
      let createdAt = randomCreatedAt(HISTORY_DAYS);
      if (createdAt < usuarioCreado) {
        createdAt = atWorkingHour(addDays(usuarioCreado, faker.number.float({ min: 0, max: 5 })));
      }
      createdAt = notFuture(createdAt);

      const completada = chance(RATIOS.tareaCompletada);
      let completadaEn: Date | null = null;
      if (completada) {
        // completadaEn must fall in (createdAt + 5min, now - 1min].
        const lo = createdAt.getTime() + 5 * 60_000;
        const hi = Date.now() - 60_000;
        if (lo >= hi) {
          completadaEn = new Date(Math.min(createdAt.getTime() + 60_000, Date.now()));
        } else {
          const spanDays = (hi - lo) / DAY_MS;
          const offset = Math.min(
            faker.number.float({ min: 0.02, max: 25 }),
            spanDays * faker.number.float({ min: 0.15, max: 0.98 }),
          );
          let done = biasToWeekday(atWorkingHour(new Date(lo + offset * DAY_MS)));
          if (done.getTime() < lo || done.getTime() > hi) {
            done = atWorkingHour(new Date(lo + faker.number.float({ min: 0, max: 1 }) * (hi - lo)));
          }
          completadaEn = new Date(Math.min(Math.max(done.getTime(), lo), hi));
        }
      }

      const eliminada = chance(RATIOS.tareaEliminada);
      const deletedAt = eliminada
        ? notFuture(addDays(createdAt, faker.number.float({ min: 1, max: 30 })))
        : null;

      const categoria =
        misCategorias.length > 0 && chance(RATIOS.tareaConCategoria)
          ? faker.helpers.arrayElement(misCategorias)
          : null;

      const lastTouch = [createdAt, completadaEn, deletedAt]
        .filter((d): d is Date => d instanceof Date)
        .reduce((a, b) => (a > b ? a : b));

      const tarea: NuevaTarea = {
        id: randomUUID(),
        usuarioId,
        categoriaId: categoria?.id ?? null,
        titulo: faker.hacker.phrase().slice(0, 255),
        descripcion: chance(RATIOS.tareaConDescripcion)
          ? faker.lorem.sentences({ min: 1, max: 3 })
          : null,
        prioridad: weightedPick(PRIORIDAD_PESOS),
        completada,
        fechaVencimiento: chance(RATIOS.tareaConVencimiento)
          ? addDays(createdAt, faker.number.float({ min: -3, max: 40 }))
          : null,
        completadaEn,
        posicion: deletedAt ? 0 : posicion++,
        createdAt,
        updatedAt: lastTouch,
        deletedAt,
      };
      tareas.push(tarea);

      const numTags = Math.min(intBetween(COUNTS.etiquetasPorTarea), misEtiquetas.length);
      const tags = faker.helpers.arrayElements(misEtiquetas, numTags);
      for (const tag of tags) {
        tareaEtiquetas.push({ tareaId: tarea.id!, etiquetaId: tag.id!, createdAt });
      }
    }
  }

  return { tareas, tareaEtiquetas };
}
