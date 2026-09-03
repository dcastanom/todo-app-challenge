import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/es';
import type { NuevoUsuario } from '../schema/index.js';
import { COUNTS, RATIOS, SEED_PASSWORD } from './config.js';
import { chance, daysAgo, DAY_MS } from './helpers.js';

/** US-011 — build the user rows. Row 0 is a stable demo/login account. */
export async function buildUsuarios(): Promise<NuevoUsuario[]> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const usuarios: NuevoUsuario[] = [];

  for (let i = 0; i < COUNTS.usuarios; i++) {
    const createdAt = daysAgo(faker.number.int({ min: 30, max: 400 }));
    const isDemo = i === 0;
    const nombre = faker.person.fullName();

    const ultimoAcceso = chance(RATIOS.usuarioActivoUltimos7Dias)
      ? new Date(Date.now() - faker.number.float({ min: 0, max: 7 }) * DAY_MS)
      : chance(0.8)
        ? new Date(Date.now() - faker.number.float({ min: 7, max: 60 }) * DAY_MS)
        : null;

    usuarios.push({
      id: randomUUID(),
      email: isDemo
        ? 'demo@todo.app'
        : faker.internet.email({ firstName: `user${String(i)}` }).toLowerCase(),
      username: isDemo ? 'demo' : faker.internet.username().toLowerCase().slice(0, 100),
      passwordHash,
      nombreCompleto: isDemo ? 'Demo User' : nombre,
      fotoPerfilUrl: chance(0.4) ? faker.image.avatarGitHub() : null,
      ultimoAcceso,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return usuarios;
}
