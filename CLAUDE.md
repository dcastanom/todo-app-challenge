# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Current state of the repo

**This repo currently contains only planning documents — there is no application code yet.**

- No `package.json`, no `backend/` or `frontend/` directories, no Docker files, no migrations.
- Not a git repository yet (Phase 0 task T-001 is "create GitHub repo" / `git init`).
- The next concrete step is **Phase 0: Setup** (see phase order below).

The documents in the root are the source of truth for what to build:

| Doc | Use it for |
|---|---|
| `fullstack-todo-challenge-1.md` | The original challenge spec — exact requirements, required endpoints, bonus features, the 10 BI query questions, evaluation criteria |
| `ANALISIS.md` | Requirements analysis, risks, complexity assessment, rationale for the extended scope |
| `ARQUITECTURA.md` | Architecture: DB schema (SQL), API catalog, design patterns, security layers, caching, ADRs |
| `PLANIFICACION.md` | 8 critical phases + 3 optional, ~124 user stories (US-001…US-124) with checkboxes, AC/DoD |
| `PLAN_COMMITS.md` | Ordered list of ~140–215 conventional-commit messages by phase |

When a doc conflicts with the challenge spec, ask; the challenge spec (`fullstack-todo-challenge-1.md`) defines the graded deliverable.

---

## Commands

npm workspaces monorepo. Run from the repo root unless noted.

```bash
# Setup
cp .env.example .env
npm install
npm run build:shared            # compile @todo/shared to dist/ (backend/frontend depend on it)

# Infra (Docker) — ports offset to avoid clashes: PG 5544, Redis 6399
npm run db:up                   # docker compose up postgres + redis
npm run db:down

# Dev servers
npm run dev:backend             # http://localhost:4000  (health: /health, /api/v1/health)
npm run dev:frontend            # http://localhost:5173

# Database (run in backend/, or `npm run <script> --workspace backend`)
npm run db:generate --workspace backend   # drizzle-kit: SQL migration from schema changes
npm run db:migrate  --workspace backend   # apply migrations to DATABASE_URL
npm run db:seed     --workspace backend   # deterministic faker seed (~780 tareas)
npm run db:verify   --workspace backend   # assert schema + seed support the Fase 2 queries
npm run db:reset    --workspace backend   # truncate all tables
npm run db:studio   --workspace backend   # drizzle-kit studio

# Analytics (Fase 2 — needs a seeded DB)
npm run analytics --workspace backend                 # run the 10 BI queries + timings
npm run analytics --workspace backend -- --explain    # + EXPLAIN ANALYZE plans

# Quality (root = all workspaces)
npm run lint | lint:fix
npm run format | format:check
npm run typecheck
npm test                                   # unit only: backend Jest + frontend Vitest (no DB)
npm test --workspace backend -- health      # single backend test by path/name
npm run test:integration --workspace backend  # DB-backed suites (*.integration.test.ts)
npm run test:coverage --workspace backend   # coverage (target >80%)
```

Tests split: `*.test.ts` = unit (no DB, runs in CI `verify` job); `*.integration.test.ts` = needs Postgres at `DATABASE_URL` (CI `integration` job spins up a service container).

---

## Stack (decided — do not substitute)

**Backend:** Node.js 18+ LTS · Express · TypeScript strict (no `any`) · PostgreSQL 16 · **Drizzle ORM** · Zod · JWT + refresh tokens · Helmet · Pino · Redis (caching) · Socket.io/ws (real-time, optional phases) · Jest + Supertest

**Frontend:** React 18 · TypeScript strict · Context API + `useReducer` · React Hook Form + Zod · Axios behind an **Adapter Pattern** (`HttpClient` interface) · CSS Modules · dark mode via CSS variables · `react-beautiful-dnd` · Vitest + React Testing Library · Playwright (E2E)

**Infra:** Docker + Docker Compose · GitHub Actions (lint → test → build → deploy) · Pino + Prometheus + Jaeger + Grafana

Key ADRs in `ARQUITECTURA.md` §11: UUID primary keys (`gen_random_uuid()`), JWT over sessions, PostgreSQL over NoSQL, Drizzle over Knex/Prisma/TypeORM.

---

## Architecture essentials

**Layering (both ends):** Presentation → Business logic → Integration/Data access → DB. Backend services (`AuthService`, `TodoService`, `CategoryService`, `TagService`, `AnalyticsService`) hold business logic; repositories/DAOs wrap Drizzle; route handlers only do HTTP + Zod validation. Backend is stateless (horizontally scalable); JWT revocation via a Redis blacklist.

**Database — 10 tables** (built in Fase 1, `backend/src/db/schema/`, one file per table + `relations.ts`), all with `id UUID PK` (`gen_random_uuid()`), `created_at`/`updated_at` (`timestamptz`), and — where soft-deletable — `deleted_at` (every read filters `deleted_at IS NULL`):
`usuarios`, `categorias`, `tareas` (core), `etiquetas`, `tarea_etiquetas` (M:M junction, composite PK), `audit_logs` (JSONB before/after, P2), `notificaciones` + `notificacion_preferencias` (P1), `tarea_permisos` + `tarea_comentarios` (P3).
Drizzle uses `casing: 'snake_case'` — TS fields are camelCase Spanish (`usuarioId`, `fechaVencimiento`), DB columns snake_case Spanish. Additions beyond `ARQUITECTURA.md` SQL: `usuarios.ultimo_acceso` (for analytics Q8), `tareas.posicion` (drag & drop). Enum-like columns are `varchar` + a `chk_*` CHECK constraint, typed in TS via `.$type<Prioridad>()` from `@todo/shared`. Composite indexes drive multidimensional filtering (`idx_tareas_usuario_prioridad_completada`, etc.). Validation is defense-in-depth: Zod in the app **and** CHECK constraints in the DB.
Migrations live in `backend/drizzle/` (committed). Seed is deterministic (`faker.seed`), ~780 tareas over 365 days, demo login `demo@todo.app` / `Password123!`. `npm run db:verify --workspace backend` asserts the schema + data support all 10 Fase 2 queries.

**API:** REST under `/api/v1/...`, JWT bearer auth, ownership check on every resource. Full endpoint catalog in `ARQUITECTURA.md` §5.2. `GET /api/v1/tareas` supports filters `completada`, `categoria`, `prioridad`, `fecha_vencimiento` (range), `busqueda` (title+description), `etiquetas`, plus `sort=field:asc|desc` (multi-key) and pagination. Filter results are Redis-cached (Phase 6).

**Design patterns to apply** (`ARQUITECTURA.md` §6): Adapter (API client), Observer (Context API), Repository/DAO, dynamic Query Builder for filters, Strategy for sorting.

**The 10 BI queries** (`fullstack-todo-challenge-1.md` bottom) are a graded deliverable, built in Fase 2: `backend/src/modules/analytics/queries/q1..q10*.ts` (each exports the raw `Qn_SQL` string + a typed executor), aggregated by `AnalyticsService`. Raw SQL is allowed here (the one exception to "use Drizzle"). SQL is copy-paste-runnable in psql (no bound params); documented with sample output in `BI-QUERIES.md`. `npm run analytics --workspace backend [-- --explain]` runs them all with timings; `npm run test:integration --workspace backend` validates them against the seed. All execute in single-digit ms on the seed; `int8`/count columns come back as numbers (pg type parser in `db/client.ts`), rounded ratios as strings.

---

## Phase order (do not reorder)

Database-first, analytics-second. `0` Setup → `1` DB schema + 500+ row seed → `2` 10 analytics queries → `3` Auth → `4` Tarea CRUD → `5` Categorías & Etiquetas → `6` Multidimensional filtering + Redis cache → `7` Full testing + CI → `8` Infra + **bonus features + polish**. Optional after v1.0: `OPT-1` notifications, `OPT-2` audit, `OPT-3` collaboration.

The **bonus features in Phase 8 are mandatory** for this project: drag & drop reorder (persisted), dark mode (localStorage), CSV/JSON export (respects active filters), keyboard shortcuts (Cmd+K/N/D…), batch operations (`PATCH /todos/batch`), basic offline (localStorage draft + sync).

Work a phase's user stories in order; flip `[ ]`→`[x]` in `PLANIFICACION.md` only when AC + DoD (tests >80% included) are met.

---

## Conventions

- **TypeScript strict, never `any`.** Define interfaces. `tsconfig` strict mode on.
- **Drizzle for all queries** except the Phase 2 analytics SQL.
- **Conventional Commits**, atomic and frequent: `feat(scope): …`, `fix(scope): …`, `test(scope): …`, `docs(scope): …`, `refactor(scope): …`, `chore(scope): …`. `PLAN_COMMITS.md` lists the intended messages per phase.
- **Feature branches:** one per phase (`feature/fase-N-...`); atomic commits per `PLAN_COMMITS.md`; no push/PR unless asked; stop for review at each phase boundary.
- **Tests live outside `src/`**, in a sibling `tests/` dir per workspace (`backend/tests/`, `frontend/tests/`), mirroring the `src/` folder hierarchy (`src/routes/health.route.ts` → `tests/routes/health.route.test.ts`). Global test setup (`setup-env.ts`, `setup.ts`) sits at the `tests/` root. Written alongside the code, not after. Coverage target >80% backend and frontend.
- React: functional components + hooks; `useContext` + `useReducer` for state; optimistic updates where it helps UX; error boundaries.
- Frontend component tree follows `fullstack-todo-challenge-1.md` §"Estructura de Componentes" — but in **TypeScript** (`.tsx`), adapting the Spanish `.jsx` names in that doc.

---

## Known inconsistencies in the docs (resolve as you hit them)

- **ORM:** `ARQUITECTURA.md` prose and code samples still mention **Knex.js** in several places; the decision (ADR-003 + `RESPUESTAS_ARQUITECTURA_FINALES.md`) is **Drizzle ORM**. Drizzle wins.
- **API prefix:** challenge spec uses `/api/...`, `ARQUITECTURA.md` uses `/api/v1/...`, older CLAUDE text used `/auth/...`. Use `/api/v1/...`.
- **Endpoint naming:** `PATCH /api/v1/tareas/:id/completar` (architecture) vs `PATCH /api/tareas/:id/completar` (spec) — same intent, versioned path.
- **Language:** challenge spec shows JavaScript `.jsx` with Spanish component names; this project mandates TypeScript. Keep DB/domain terms Spanish, write code in TypeScript.
- **`audit_logs` etc.:** tables for P1/P2/P3 are designed in Phase 1 but only wired up in the optional phases.
- Doc footers are dated 2024; treat the plan as current.
