import { sql } from 'drizzle-orm';
import { faker } from '@faker-js/faker/locale/es';
import { db, pool } from '../client.js';
import {
  categorias,
  etiquetas,
  notificacionPreferencias,
  tareaEtiquetas,
  tareas,
  usuarios,
} from '../schema/index.js';
import { SEED } from './config.js';
import { buildCategorias } from './categorias.seed.js';
import { buildEtiquetas } from './etiquetas.seed.js';
import { buildTareas } from './tareas.seed.js';
import { buildUsuarios } from './usuarios.seed.js';

const CHUNK = 500;

async function insertAll<T>(
  label: string,
  rows: T[],
  insertChunk: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insertChunk(rows.slice(i, i + CHUNK));
  }
  console.warn(`  ${label.padEnd(26)} ${String(rows.length)}`);
}

async function truncateAll(): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE
      tarea_etiquetas, tarea_comentarios, tarea_permisos,
      notificaciones, notificacion_preferencias, audit_logs,
      tareas, etiquetas, categorias, usuarios
    RESTART IDENTITY CASCADE
  `);
}

async function main(): Promise<void> {
  faker.seed(SEED);

  console.warn('Building dataset...');
  const usuariosRows = await buildUsuarios();
  const categoriasRows = buildCategorias(usuariosRows);
  const etiquetasRows = buildEtiquetas(usuariosRows);
  const { tareas: tareasRows, tareaEtiquetas: tareaEtiquetasRows } = buildTareas(
    usuariosRows,
    categoriasRows,
    etiquetasRows,
  );
  const preferenciasRows = usuariosRows.map((u) => ({ usuarioId: u.id ?? '' }));

  console.warn('Truncating tables...');
  await truncateAll();

  console.warn('Inserting:');
  await insertAll('usuarios', usuariosRows, (c) => db.insert(usuarios).values(c));
  await insertAll('categorias', categoriasRows, (c) => db.insert(categorias).values(c));
  await insertAll('etiquetas', etiquetasRows, (c) => db.insert(etiquetas).values(c));
  await insertAll('notificacion_preferencias', preferenciasRows, (c) =>
    db.insert(notificacionPreferencias).values(c),
  );
  await insertAll('tareas', tareasRows, (c) => db.insert(tareas).values(c));
  await insertAll('tarea_etiquetas', tareaEtiquetasRows, (c) =>
    db.insert(tareaEtiquetas).values(c),
  );

  console.warn('\nSeed complete.');
}

try {
  await main();
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
