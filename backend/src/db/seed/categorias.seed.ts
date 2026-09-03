import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker/locale/es';
import type { NuevaCategoria, NuevoUsuario } from '../schema/index.js';
import { CATEGORIA_POOL, COUNTS } from './config.js';
import { intBetween } from './helpers.js';

/** US-012 — 4-7 categories per user, drawn from a realistic pool. */
export function buildCategorias(usuarios: NuevoUsuario[]): NuevaCategoria[] {
  const categorias: NuevaCategoria[] = [];

  for (const usuario of usuarios) {
    const count = intBetween(COUNTS.categoriasPorUsuario);
    const chosen = faker.helpers.arrayElements(CATEGORIA_POOL, count);

    chosen.forEach((cat, orden) => {
      categorias.push({
        id: randomUUID(),
        usuarioId: usuario.id!,
        nombre: cat.nombre,
        descripcion:
          faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }) ?? null,
        color: cat.color,
        orden,
        createdAt: usuario.createdAt,
        updatedAt: usuario.createdAt,
      });
    });
  }

  return categorias;
}
