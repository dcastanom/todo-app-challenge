import { faker } from '@faker-js/faker/locale/es';
import { PRIORIDADES } from '@todo/shared';
import { COUNTS, SEED } from '../../src/db/seed/config.js';
import { buildUsuarios } from '../../src/db/seed/usuarios.seed.js';
import { buildCategorias } from '../../src/db/seed/categorias.seed.js';
import { buildEtiquetas } from '../../src/db/seed/etiquetas.seed.js';
import { buildTareas } from '../../src/db/seed/tareas.seed.js';

describe('seed builders', () => {
  beforeEach(() => {
    faker.seed(SEED);
  });

  it('builds the configured number of users with a demo login account', async () => {
    const usuarios = await buildUsuarios();

    expect(usuarios).toHaveLength(COUNTS.usuarios);
    expect(usuarios[0]?.email).toBe('demo@todo.app');
    expect(usuarios.every((u) => u.passwordHash.startsWith('$2'))).toBe(true);
    expect(new Set(usuarios.map((u) => u.email)).size).toBe(usuarios.length);
  });

  it('assigns every category and tag to a real user', async () => {
    const usuarios = await buildUsuarios();
    const userIds = new Set(usuarios.map((u) => u.id));

    const categorias = buildCategorias(usuarios);
    const etiquetas = buildEtiquetas(usuarios);

    expect(categorias.length).toBeGreaterThan(0);
    expect(categorias.every((c) => userIds.has(c.usuarioId))).toBe(true);
    expect(etiquetas.every((e) => userIds.has(e.usuarioId))).toBe(true);
  });

  it('produces >= 500 tareas with coherent completion and dates', async () => {
    const usuarios = await buildUsuarios();
    const categorias = buildCategorias(usuarios);
    const etiquetas = buildEtiquetas(usuarios);

    const { tareas, tareaEtiquetas } = buildTareas(usuarios, categorias, etiquetas);
    const now = Date.now();

    expect(tareas.length).toBeGreaterThanOrEqual(500);
    for (const t of tareas) {
      expect(PRIORIDADES).toContain(t.prioridad);
      expect((t.createdAt as Date).getTime()).toBeLessThanOrEqual(now + 1000);
      if (t.completada) {
        expect(t.completadaEn).toBeInstanceOf(Date);
        expect((t.completadaEn as Date).getTime()).toBeGreaterThanOrEqual(
          (t.createdAt as Date).getTime(),
        );
      } else {
        expect(t.completadaEn).toBeNull();
      }
    }

    const tareaIds = new Set(tareas.map((t) => t.id));
    const etiquetaIds = new Set(etiquetas.map((e) => e.id));
    expect(
      tareaEtiquetas.every((te) => tareaIds.has(te.tareaId) && etiquetaIds.has(te.etiquetaId)),
    ).toBe(true);
  });
});
