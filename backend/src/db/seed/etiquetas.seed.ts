import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker/locale/es';
import type { NuevaEtiqueta, NuevoUsuario } from '../schema/index.js';
import { COUNTS, ETIQUETA_POOL } from './config.js';
import { intBetween } from './helpers.js';

/** US-014 (part 1) — 6-12 tags per user. */
export function buildEtiquetas(usuarios: NuevoUsuario[]): NuevaEtiqueta[] {
  const etiquetas: NuevaEtiqueta[] = [];

  for (const usuario of usuarios) {
    const count = Math.min(intBetween(COUNTS.etiquetasPorUsuario), ETIQUETA_POOL.length);
    const nombres = faker.helpers.arrayElements(ETIQUETA_POOL, count);

    for (const nombre of nombres) {
      etiquetas.push({
        id: randomUUID(),
        usuarioId: usuario.id!,
        nombre,
        color: faker.color.rgb({ format: 'hex' }),
        createdAt: usuario.createdAt,
        updatedAt: usuario.createdAt,
      });
    }
  }

  return etiquetas;
}
