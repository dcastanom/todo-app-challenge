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

No build tooling exists yet. Once Phase 0 scaffolds the project, this section should be updated with the real commands. The stack below implies these will exist:

```bash
# Backend (Node.js + Express + TypeScript)
npm run dev                      # dev server with hot reload
npm run build                    # tsc build
npm run lint                     # ESLint
npm test                         # Jest
npm test -- path/to/file.test.ts # single test file
npm test -- -t "test name"       # single test by name
npm run test:coverage            # coverage report (target >80%)
npx drizzle-kit generate         # generate migration from schema
npx drizzle-kit migrate          # apply migrations
npm run seed                     # load seed data (500+ tareas)

# Frontend (React + TypeScript + Vite)
npm run dev
npm run build
npm test                         # Vitest
npm run test:e2e                 # Playwright

# Infra
docker compose up -d             # Postgres 16 + Redis 7 (+ observability stack)
```

Decide during Phase 0 whether backend and frontend are two folders in one repo (`backend/`, `frontend/`) or npm workspaces, and record that choice here. The monorepo `packages/` layout in `ARQUITECTURA.md` §9.3 is only for the optional future mobile proposal (P8), not the MVP.

---

## Stack (decided — do not substitute)

**Backend:** Node.js 18+ LTS · Express · TypeScript strict (no `any`) · PostgreSQL 16 · **Drizzle ORM** · Zod · JWT + refresh tokens · Helmet · Pino · Redis (caching) · Socket.io/ws (real-time, optional phases) · Jest + Supertest

**Frontend:** React 18 · TypeScript strict · Context API + `useReducer` · React Hook Form + Zod · Axios behind an **Adapter Pattern** (`HttpClient` interface) · CSS Modules · dark mode via CSS variables · `react-beautiful-dnd` · Vitest + React Testing Library · Playwright (E2E)

**Infra:** Docker + Docker Compose · GitHub Actions (lint → test → build → deploy) · Pino + Prometheus + Jaeger + Grafana

Key ADRs in `ARQUITECTURA.md` §11: UUID primary keys (`gen_random_uuid()`), JWT over sessions, PostgreSQL over NoSQL, Drizzle over Knex/Prisma/TypeORM.

---

## Architecture essentials

**Layering (both ends):** Presentation → Business logic → Integration/Data access → DB. Backend services (`AuthService`, `TodoService`, `CategoryService`, `TagService`, `AnalyticsService`) hold business logic; repositories/DAOs wrap Drizzle; route handlers only do HTTP + Zod validation. Backend is stateless (horizontally scalable); JWT revocation via a Redis blacklist.

**Database — 10 tables**, all with `id UUID PK`, `created_at`/`updated_at`, and `deleted_at` (soft delete — every query filters `deleted_at IS NULL`):
`usuarios`, `categorias`, `tareas` (core), `etiquetas`, `tarea_etiquetas` (M:M junction, composite PK), `audit_logs` (JSONB before/after, P2), `notificaciones` + `notificacion_preferencias` (P1), `tarea_permisos` + `tarea_comentarios` (P3).
Column names and enum values are **Spanish** (`usuario_id`, `titulo`, `completada`, `fecha_vencimiento`, `prioridad IN ('baja','normal','alta','urgente')`). Composite indexes drive multidimensional filtering (`idx_usuario_prioridad_completada`, etc.) — see `ARQUITECTURA.md` §8.2. Validation is defense-in-depth: Zod in the app **and** CHECK constraints in the DB.

**API:** REST under `/api/v1/...`, JWT bearer auth, ownership check on every resource. Full endpoint catalog in `ARQUITECTURA.md` §5.2. `GET /api/v1/tareas` supports filters `completada`, `categoria`, `prioridad`, `fecha_vencimiento` (range), `busqueda` (title+description), `etiquetas`, plus `sort=field:asc|desc` (multi-key) and pagination. Filter results are Redis-cached (Phase 6).

**Design patterns to apply** (`ARQUITECTURA.md` §6): Adapter (API client), Observer (Context API), Repository/DAO, dynamic Query Builder for filters, Strategy for sorting.

**The 10 BI queries** (`fullstack-todo-challenge-1.md` bottom) are a graded deliverable. Implement them in Phase 2, verified against seed data, each <1s. Raw SQL is allowed here (the one exception to "use Drizzle, not raw SQL").

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
- **Feature branches:** `feature/US-XXX-descripcion`.
- **Tests live beside code** (`x.service.ts` + `tests/x.service.test.ts`), written alongside the code, not after. Coverage target >80% backend and frontend.
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
