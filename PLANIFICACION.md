# Plan de Implementación - Reto Técnico Full-Stack Todo List v2.1 CORRECTO

## 1. Introducción Ejecutiva

**Estructura Correcta:**
- **MVP v1.0 (CRÍTICO):** Fases 0-8 incluyendo **Features Bonus**
- **Premium (OPCIONAL):** Fases OPT-1-3 (P1, P2, P3) si hay tiempo

**Timeline:** 8-9 semanas para MVP completo, +3 semanas si hay tiempo para propuestas

---

## 2. Fases Reorganizadas (8 CRÍTICAS + 3 OPCIONALES)

```
FASES CRÍTICAS (MVP v1.0 - Semanas 1-8):
├─ Fase 0: Setup
├─ Fase 1: Database Design & Verification ⭐
├─ Fase 2: Analytics BI Queries (P5) ⭐
├─ Fase 3: Autenticación
├─ Fase 4: CRUD Tareas
├─ Fase 5: Categorías & Etiquetas
├─ Fase 6: Filtrado Multidimensional
├─ Fase 7: Testing Completo
└─ Fase 8: Infraestructura (I1-I3) + Features Bonus + Polish & QA

FASES OPCIONALES (Semana 9+ - SI DA TIEMPO):
├─ Fase OPT-1: Notificaciones (P1)
├─ Fase OPT-2: Auditoría (P2)
└─ Fase OPT-3: Colaboración (P3)
```

---

## FASE 0: Setup Inicial (2-3 commits)

- [ ] **T-001: Crear repositorio GitHub**
- [ ] **T-002: Estructura de directorios**
- [ ] **T-003: Configurar TypeScript**
- [ ] **T-004: Setup ESLint + Prettier + Husky**
- [ ] **T-005: Setup Docker Compose (dev)**
- [ ] **T-006: Crear variables de entorno**

**Commits:** 5-7

---

## FASE 1: Database Design & Verification (7-10 días)

### 1.1 Schema Design

- [ ] **US-001: Diseñar tabla USUARIOS**
- [ ] **US-002: Diseñar tabla CATEGORÍAS**
- [ ] **US-003: Diseñar tabla TAREAS**
- [ ] **US-004: Diseñar tabla ETIQUETAS**
- [ ] **US-005: Diseñar tabla TAREA_ETIQUETAS (M:M)**
- [ ] **US-006: Diseñar tabla AUDIT_LOGS (P2)**
- [ ] **US-007: Diseñar tabla NOTIFICACIONES (P1)**
- [ ] **US-008: Diseñar tabla NOTIFICACION_PREFERENCIAS (P1)**
- [ ] **US-009: Diseñar tabla TAREA_PERMISOS (P3)**
- [ ] **US-010: Diseñar tabla TAREA_COMENTARIOS (P3)**

### 1.2 Seed Data Creation

- [ ] **US-011: Crear seed data - Usuarios**
- [ ] **US-012: Crear seed data - Categorías**
- [ ] **US-013: Crear seed data - Tareas (500+ records)** ⭐
- [ ] **US-014: Crear seed data - Etiquetas & Relaciones**
- [ ] **US-015: Crear script seed completo**

### 1.3 Verification

- [ ] **US-016: Verificar schema Drizzle**
- [ ] **US-017: Crear conexión PostgreSQL + Drizzle**
- [ ] **US-018: Verificar índices están creados**

**Commits:** 12-15

---

## FASE 2: Analytics BI Queries (P5) (5-7 días)

- [ ] **US-019: Implementar Q1 - Participación de Usuarios**
- [ ] **US-020: Implementar Q2 - Tasa de Completado**
- [ ] **US-021: Implementar Q3 - Rendimiento por Categoría**
- [ ] **US-022: Implementar Q4 - Patrones de Productividad**
- [ ] **US-023: Implementar Q5 - Tareas Vencidas**
- [ ] **US-024: Implementar Q6 - Estadísticas de Etiquetas**
- [ ] **US-025: Implementar Q7 - Retención de Usuarios**
- [ ] **US-026: Implementar Q8 - Distribución de Prioridades**
- [ ] **US-027: Implementar Q9 - Tendencias Estacionales**
- [ ] **US-028: Implementar Q10 - Benchmarking Top Users**
- [ ] **US-029: Validar todos 10 queries contra seed data**
- [ ] **US-030: Crear índices si es necesario**
- [ ] **US-031: Documentar queries analytics**

**Commits:** 12-15

---

## FASE 3: Autenticación (5-6 días)

### Backend
- [ ] **US-032: Implementar Password Hashing**
- [ ] **US-033: Implementar JWT Service**
- [ ] **US-034: Endpoint POST /auth/register**
- [ ] **US-035: Endpoint POST /auth/login**
- [ ] **US-036: Endpoint POST /auth/refresh**
- [ ] **US-037: Middleware de Autenticación**
- [ ] **US-038: Tests auth backend**

### Frontend
- [ ] **US-039: AuthContext en React**
- [ ] **US-040: useAuth custom hook**
- [ ] **US-041: LoginForm component**
- [ ] **US-042: RegisterForm component**
- [ ] **US-043: ProtectedRoute wrapper**

**Commits:** 15-18

---

## FASE 4: CRUD Tareas (5-6 días)

### Backend
- [ ] **US-044: Create TodoService**
- [ ] **US-045: POST /todos**
- [ ] **US-046: GET /todos (con paginación)**
- [ ] **US-047: GET /todos/:id**
- [ ] **US-048: PUT /todos/:id**
- [ ] **US-049: PATCH /todos/:id/complete**
- [ ] **US-050: DELETE /todos/:id (soft delete)**
- [ ] **US-051: Tests backend**

### Frontend
- [ ] **US-052: TodoList component**
- [ ] **US-053: TodoForm component**
- [ ] **US-054: TodoItem component**
- [ ] **US-055: useTodos hook**
- [ ] **US-056: Paginación controls**

**Commits:** 15-18

---

## FASE 5: Categorías & Etiquetas (4-5 días)

### Backend
- [ ] **US-057: CRUD Categorías**
- [ ] **US-058: CRUD Etiquetas**
- [ ] **US-059: Asignar etiquetas a tareas**
- [ ] **US-060: Tests**

### Frontend
- [ ] **US-061: CategoryManager component**
- [ ] **US-062: TagManager component**
- [ ] **US-063: Integración en TodoForm**

**Commits:** 12-15

---

## FASE 6: Filtrado Multidimensional (5-6 días)

### Backend
- [ ] **US-064: Query Builder dinámico**
- [ ] **US-065: Filtro prioridad**
- [ ] **US-066: Filtro completada**
- [ ] **US-067: Filtro fecha vencimiento**
- [ ] **US-068: Filtro categoría**
- [ ] **US-069: Filtro etiquetas**
- [ ] **US-070: Ordenamiento flexible**
- [ ] **US-071: Búsqueda de texto**
- [ ] **US-072: Redis Caching**
- [ ] **US-073: Optimización de índices**

### Frontend
- [ ] **US-074: FilterPanel component**
- [ ] **US-075: SearchBar component**
- [ ] **US-076: useFilters hook**
- [ ] **US-077: Integración en TodoList**

**Commits:** 18-22

---

## FASE 7: Testing Completo (5-6 días)

### Backend Tests
- [ ] **US-078: Auth service unit tests**
- [ ] **US-079: Auth endpoints integration tests**
- [ ] **US-080: Todos service tests**
- [ ] **US-081: Filtering tests**
- [ ] **US-082: Setup Jest CI**

### Frontend Tests
- [ ] **US-083: Auth components tests**
- [ ] **US-084: Todo components tests**
- [ ] **US-085: Filter tests**
- [ ] **US-086: Setup Vitest CI**

### E2E Tests
- [ ] **US-087: Registration flow**
- [ ] **US-088: Login flow**
- [ ] **US-089: CRUD flow**
- [ ] **US-090: Filtering flow**
- [ ] **US-091: Setup Playwright CI**

**Commits:** 15-18

---

## FASE 8: Infraestructura + Features Bonus + Polish & QA (10-12 días) ⭐

### Infrastructure (I1-I3)

- [x] **US-092: Docker Setup (I1)**
  - AC: `backend/Dockerfile` (multi-stage, tini, migra+arranca) + `frontend/Dockerfile` (nginx)
  - AC: `docker-compose.prod.yml` (imágenes construidas + Postgres/Redis)
  - DoD: ambas imágenes construyen; el backend arranca contra Postgres/Redis (migra, `/health` 200) ✅

- [x] **US-093: CI/CD Pipeline (I2)**
  - AC: workflow de GitHub Actions
  - AC: stages lint / test / build / **docker** (build en PR, push a GHCR en `main`) / **deploy** (gated, entorno `staging`)
  - DoD: pipeline con jobs `verify` / `integration` / `e2e` / `docker` / `deploy` ✅

- [x] **US-094: Observability (I3)**
  - AC: Pino logging (ya en Fase 0, con id de request vía `pino-http`)
  - AC: Prometheus metrics → `GET /metrics` (colectores Node + histograma `http_request_duration_seconds`)
  - AC: Jaeger tracing → OpenTelemetry (http+express+pg) por OTLP, activo con `OTEL_EXPORTER_OTLP_ENDPOINT`
  - AC: Grafana dashboards → `observability/grafana/` (datasource + dashboard "Todo Backend" provisionados)
  - DoD: `docker-compose.observability.yml` (Prometheus + Grafana + Jaeger) ✅

### Features Bonus (OBLIGATORIOS) 🎁

- [x] **US-095: Drag & Drop Reordenar**
  - AC: ~~React-beautiful-dnd~~ → HTML5 Drag & Drop nativo (sin dependencia; RBD está sin mantenimiento)
  - AC: Persist order a BD → `PATCH /api/v1/tareas/reorder` + columna `posicion` + índice `(usuario_id, posicion)`
  - AC: Smooth UX → reordenamiento optimista con revert en error, orden "Manual (arrastrar)"
  - DoD: Feature + tests (`moverItem`, `useTodos.mover`, integración endpoint, E2E) ✅

- [x] **US-096: Dark Mode Toggle**
  - AC: CSS variables → tokens en `:root`, `[data-theme='dark']` y `@media (prefers-color-scheme)`
  - AC: Persist en localStorage (`todo:theme`)
  - AC: Accessible → `aria-pressed`, `aria-label`, tres estados (system/light/dark)
  - DoD: Feature + tests (`ThemeProvider`, `ThemeToggle`, E2E persistencia) ✅

- [x] **US-097: Exportar CSV/JSON**
  - AC: `GET /api/v1/tareas/export?formato=csv|json`
  - AC: Respeta filtros (reusa `listarTareasQuerySchema` sin paginación, tope `EXPORT_MAX_ROWS`)
  - DoD: Feature + tests (serializador CSV, `serializeExport`, integración, `ExportMenu`, E2E descarga) ✅

- [x] **US-098: Atajos de Teclado**
  - AC: ⌘/Ctrl+K (buscar), N (nueva — Ctrl/Cmd+N está reservado por el navegador para "nueva ventana" a nivel de shell, no interceptable con `preventDefault`), ⌘/Ctrl+D (tema), ? (ayuda), Esc (cerrar)
  - AC: Help modal (`ShortcutsHelpModal`)
  - DoD: Feature + tests (`useKeyboardShortcuts`, modal, E2E) ✅

- [x] **US-099: Batch Operations**
  - AC: Select múltiples (`useSeleccion`, modo selección en `TodoList`)
  - AC: Batch actions: completar / prioridad / mover categoría / eliminar
  - AC: `PATCH /api/v1/tareas/batch` (discriminated union, ownership-checked)
  - DoD: Feature + tests (`useSeleccion`, `BatchActionBar`, integración, E2E) ✅

- [x] **US-100: Offline Mode Básico**
  - AC: LocalStorage draft (`useFormDraft` — guarda la tarea nueva en progreso, se limpia al enviar)
  - AC: Sync cuando online → el borrador persiste; se reenvía al reconectar
  - AC: Offline indicator (`OfflineIndicator` + `useOnlineStatus`)
  - DoD: Feature + tests (`useOnlineStatus`, `useFormDraft`, `OfflineIndicator`) ✅

- [x] **US-125: Dashboard de Estadísticas**
  - AC: `GET /api/v1/estadisticas?dias=` — totales, tasa de completado, desglose por prioridad/categoría y actividad diaria (todo escopado al usuario, cacheado bajo el mismo namespace/versión que `tareas`)
  - AC: `EstadisticasPage` (`/estadisticas`) — tarjetas de stats, barras por prioridad/categoría, gráfico de actividad; sin dependencia de charts, CSS Modules puro
  - AC: Se actualiza sola ante cualquier evento realtime de tareas/categorías (US-126)
  - DoD: Feature + tests (`estadisticas.repository`/`.service` integration, `useEstadisticas`, `StatCard`/`BarraLista`/`ActividadChart`, E2E) ✅

- [x] **US-126: Actualizaciones en Tiempo Real (WebSockets)**
  - AC: Socket.IO server (`backend/src/realtime/`) montado sobre el mismo `http.Server`; autenticado con el JWT de acceso (mismo `verifyAccessToken` + blacklist que `requireAuth`), cada socket se une a su room privado `usuario:<id>`
  - AC: Toda mutación de tareas/categorías/etiquetas emite al room del usuario (`tarea:creada/actualizada/eliminada`, `tareas:reordenadas`, `tareas:cambio-masivo`, `categorias:cambiaron`, `etiquetas:cambiaron`) — sincroniza otras pestañas/dispositivos del mismo usuario, nunca entre usuarios distintos
  - AC: La pestaña que originó el cambio no recibe su propio eco (`X-Client-Id` = `socket.id`, `io.to(room).except(clientId)`)
  - DoD: Feature + tests (`emitter`, socket-server integration con `socket.io-client` real sobre HTTP real, `useTodos`/`useCrudColeccion`/`useEstadisticas` realtime, E2E multi-pestaña) ✅

### Polish & Documentation

- [x] **US-101: API Documentation (Swagger)**
  - AC: OpenAPI 3.1 spec (`backend/src/docs/openapi.ts`, `GET /api/v1/openapi.json`)
  - AC: Swagger UI (`GET /api/v1/docs`, assets cdnjs, CSP relajado por ruta)
  - DoD: `/api/docs` → 302 a `/api/v1/docs` ✅

- [x] **US-102: README & Setup Docs**
  - AC: Setup local (README + `docs/COMMANDS.md`)
  - AC: Deployment (`docs/DEPLOYMENT.md` — imágenes, compose, env, health, rollback)
  - AC: Troubleshooting (tabla en el README)
  - DoD: README completo ✅

- [x] **US-103: QA Final & Security Audit**
  - AC: Smoke tests → 4 E2E de features bonus + 14 E2E en total, gate de cobertura CI
  - AC: OWASP audit → `docs/SECURITY.md` (Top 10 2021 mapeado al código)
  - AC: Performance → índices verificados (`db:verify`), 10 queries BI < 1s, caché Redis, code-splitting
  - AC: Browser compat → Playwright (Chromium); CSS con tokens y `prefers-color-scheme`
  - DoD: 0 bugs críticos; `npm audit --omit=dev` limpio (4 moderate sólo en devDeps) ✅

- [x] **US-104: Release v1.0.0**
  - AC: Version bumped → todos los workspaces a `1.0.0`
  - AC: Docker tagged → CI publica `ghcr.io/…-{backend,frontend}:{latest,<sha>}` en `main`
  - AC: Deployed → job `deploy` gated al entorno `staging` (stub para el host concreto)
  - AC: Monitoring active → `/metrics` + dashboard Grafana + `/health/ready`
  - DoD: `CHANGELOG.md`, production ready ✅

**Commits Fase 8:** 30-40

---

## TOTAL MVP v1.0 CRÍTICO

**Fases:** 0-8
**Total Commits:** 140-160
**Total Timeline:** 8-9 semanas
**Total Horas:** ~200 horas

**Qué tienes:**
✅ Auth + CRUD + Filtrado
✅ 10 queries analytics
✅ Tests >80% coverage
✅ Docker prod-ready
✅ CI/CD automatizado
✅ Observability (Pino + Prometheus + Jaeger)
✅ API documentada
✅ **Features Bonus completos** (Drag & Drop, Dark Mode, Export, Atajos, Batch, Offline)

**Status:** 🎉 **LISTO PARA RELEASE v1.0**

---

## 🎁 FASES OPCIONALES (SI DA TIEMPO)

### FASE OPT-1: Notificaciones (P1) (6-8 días)

- [ ] **US-105: Notificaciones En-app (WebSockets)**
- [ ] **US-106: Email Digest (Cron)**
- [ ] **US-107: Preferencias de Notificación**
- [ ] **US-108: Trigger Notificaciones**
- [ ] **US-109: NotificationBell component**
- [ ] **US-110: NotificationCenter component**
- [ ] **US-111: Toast notifications**

**Commits:** 15-20

---

### FASE OPT-2: Auditoría (P2) (3-4 días)

- [ ] **US-112: Audit Logging Middleware**
- [ ] **US-113: Captura antes/después**
- [ ] **US-114: Historial de cambios UI**
- [ ] **US-115: ChangeHistory component**
- [ ] **US-116: Tests auditoría**

**Commits:** 8-10

---

### FASE OPT-3: Colaboración (P3) (8-10 días)

- [ ] **US-117: Compartir tareas con permisos**
- [ ] **US-118: Comentarios en tareas**
- [ ] **US-119: Colaboración real-time (WebSockets)**
- [ ] **US-120: Multi-tab sync (BroadcastChannel)**
- [ ] **US-121: ShareTaskModal component**
- [ ] **US-122: PermissionsList component**
- [ ] **US-123: CommentSection component**
- [ ] **US-124: Tests colaboración**

**Commits:** 20-25

---

## TOTAL OPCIONALES

**Fases:** OPT-1 a OPT-3
**Total Commits:** 43-55
**Total Timeline:** 3-4 semanas
**Cuándo:** Si hay tiempo después de v1.0

**Qué agregas:**
✅ Notificaciones en-app + email
✅ Auditoría y historial
✅ Compartir tareas + colaboración real-time

---

## 📊 Cronograma Final

```
SEMANA 1:  Setup + DB Design       (5-7 + 12-15 = 20 commits)
SEMANA 2:  Analytics BI            (12-15 commits)
SEMANA 3:  Auth + CRUD             (30-36 commits)
SEMANA 4:  Categorías + Filtrado   (30-37 commits)
SEMANA 5:  Testing                 (15-18 commits)
SEMANA 6:  Infraestructura + Bonus (30-40 commits)
           ────────────────────────────────────
SEMANA 8:  v1.0 LISTO ✅ (140-160 commits total)

SEMANA 9:  Notificaciones (OPT-1)  (15-20 commits)
SEMANA 10: Auditoría (OPT-2)       (8-10 commits)
SEMANA 11: Colaboración (OPT-3)    (20-25 commits)
           ────────────────────────────────────
SEMANA 11: v1.3 Premium (210-235 commits total)
```

---

## 💡 Resumen

```
MVP v1.0 (CRÍTICO):      140-160 commits → 8-9 semanas
├─ Fases 0-8 completas
├─ Features Bonus incluidos
└─ Production ready ✅

v1.1+ (OPCIONAL):        +43-55 commits → +3-4 semanas
├─ Notificaciones (P1)
├─ Auditoría (P2)
└─ Colaboración (P3)
```

---

**Plan v2.1 CORRECTO Completado**
**MVP Crítico (8 semanas) + Propuestas Opcionales (3-4 semanas)**
**Listo para Implementación**
