# Full-Stack Todo App

Aplicación de lista de tareas: **React + TypeScript** (frontend), **Node.js + Express + TypeScript + Drizzle** (backend), **PostgreSQL 16** + **Redis 7**.

Monorepo con npm workspaces:

```
.
├── backend/            API Express + Drizzle ORM
│   ├── src/db/schema/  10 tablas Drizzle
│   ├── src/db/seed/    seed determinista (faker)
│   └── drizzle/        migraciones SQL (versionadas)
├── frontend/           Cliente React + Vite
├── packages/shared/    Tipos y esquemas Zod compartidos (@todo/shared)
└── docker-compose.yml  PostgreSQL + Redis para desarrollo
```

## Requisitos

- Node.js >= 20 (ver `.nvmrc`)
- Docker + Docker Compose

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Dependencias (+ compilar @todo/shared)
npm install
npm run build:shared

# 3. Base de datos y cache  (Postgres → localhost:5544, Redis → localhost:6399)
npm run db:up

# 4. Migraciones + datos de ejemplo
npm run db:migrate --workspace backend
npm run db:seed    --workspace backend
npm run db:verify  --workspace backend   # comprueba schema + datos

# 5. Servidores de desarrollo (en dos terminales)
npm run dev:backend    # http://localhost:4000   (health: /health)
npm run dev:frontend   # http://localhost:5173
```

Cuenta demo tras el seed: `demo@todo.app` / `Password123!`

## Scripts (raíz)

| Script | Descripción |
|---|---|
| `npm run lint` / `lint:fix` | ESLint sobre todo el repo |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm test` | Tests (Jest en backend, Vitest en frontend) |
| `npm run build` | Compila shared + backend + frontend |
| `npm run db:up` / `db:down` / `db:logs` | Ciclo de vida de PostgreSQL + Redis |

### Base de datos (`--workspace backend`)

| Script | Descripción |
|---|---|
| `db:generate` | Genera migración SQL a partir de cambios en `src/db/schema/` |
| `db:migrate` | Aplica migraciones |
| `db:seed` | Carga ~780 tareas de ejemplo (determinista) |
| `db:verify` | Verifica tablas, índices, constraints y forma de los datos para las queries de la Fase 2 |
| `db:reset` | Vacía todas las tablas |
| `db:studio` | Drizzle Studio |

Un solo test backend: `npm test --workspace backend -- health`.
Tests de integración (necesitan Postgres): `npm run test:integration --workspace backend`.

## Estado

- [x] **Fase 0** — Setup: monorepo, TypeScript strict, ESLint + Prettier + Husky + commitlint, Docker Compose, CI base.
- [x] **Fase 1** — Base de datos: 10 tablas Drizzle + migración inicial, seed determinista (500+ tareas), script de verificación.
- [x] **Fase 2** — 10 queries de analítica (BI): `backend/src/modules/analytics/`, documentadas con salida de ejemplo en [`BI-QUERIES.md`](BI-QUERIES.md). `npm run analytics --workspace backend`.
- [ ] Fases 3-8 — ver `PLANIFICACION.md`.

Documentación de arquitectura y plan: `CLAUDE.md`, `ARQUITECTURA.md`, `PLANIFICACION.md`, `PLAN_COMMITS.md`.
