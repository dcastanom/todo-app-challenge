# Full-Stack Todo App

Aplicación de lista de tareas: **React + TypeScript** (frontend), **Node.js + Express + TypeScript + Drizzle** (backend), **PostgreSQL 16** + **Redis 7**.

Monorepo con npm workspaces:

```
.
├── backend/            API Express + Drizzle
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

# 2. Dependencias (instala todos los workspaces y compila @todo/shared)
npm install
npm run build:shared

# 3. Base de datos y cache
npm run db:up          # levanta PostgreSQL (5432) y Redis (6379)

# 4. Servidores de desarrollo (en dos terminales)
npm run dev:backend    # http://localhost:3000  (health: /health)
npm run dev:frontend   # http://localhost:5173
```

## Scripts (raíz)

| Script | Descripción |
|---|---|
| `npm run lint` / `lint:fix` | ESLint sobre todo el repo |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm test` | Tests de todos los workspaces (Jest en backend, Vitest en frontend) |
| `npm run build` | Compila shared + backend + frontend |
| `npm run db:up` / `db:down` / `db:logs` | Ciclo de vida de PostgreSQL + Redis |

Backend: `npm test -- health` (un archivo) · `npm run test:coverage`.
Frontend: `npm run test:watch --workspace frontend`.

## Estado

- [x] **Fase 0** — Setup: monorepo, TypeScript strict, ESLint + Prettier + Husky + commitlint, Docker Compose, CI base, esqueleto de servidor y cliente.
- [ ] **Fase 1** — Diseño de base de datos (10 tablas) + seed (500+ tareas).
- [ ] Fases 2-8 — ver `PLANIFICACION.md`.

Documentación de arquitectura y plan: `CLAUDE.md`, `ARQUITECTURA.md`, `PLANIFICACION.md`, `PLAN_COMMITS.md`.
