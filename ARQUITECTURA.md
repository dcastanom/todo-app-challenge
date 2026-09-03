# Arquitectura de Software - Reto Técnico Full-Stack Todo List

## 1. Introducción Arquitectónica

Este documento define la arquitectura completa de la aplicación de lista de tareas, considerando requerimientos funcionales, no funcionales, y mejores prácticas de ingeniería de software. La solución está diseñada siguiendo principios de escalabilidad, mantenibilidad y confiabilidad, con visión hacia crecimiento futuro.

**Principios Arquitectónicos:**
- **Separation of Concerns:** Capas bien definidas sin acoplamiento
- **Single Responsibility:** Cada componente tiene una responsabilidad única
- **Open/Closed Principle:** Extensible sin modificar código existente
- **Stateless Backend:** Escalable horizontalmente
- **API-First Design:** Frontend y backend débilmente acoplados
- **Progressive Enhancement:** Funcionalidad base + mejoras opcionales

---

## 2. Arquitectura de Alto Nivel (4+1 Views)

### 2.1 Vista de Contexto (Context View)

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET / USUARIO                      │
└───────────────┬──────────────────────────────────────────────────┘
                │
                │ HTTPS
                │
    ┌───────────┴─────────────────────────────────────────┐
    │                                                       │
    ▼                                                       ▼
┌─────────────────┐                             ┌──────────────────┐
│   React App     │                             │  Mobile Browser  │
│  (SPA / PWA)    │◄───────API REST───────────►│  (Responsive)    │
│   JavaScript    │       JSON/JWT              │                  │
└─────────────────┘                             └──────────────────┘
    │
    │ HTTP Requests
    │
    ▼
┌──────────────────────────────────┐
│   Express.js Backend             │
│   (Node.js Runtime)              │
│   - Auth Service                 │
│   - Todo Business Logic          │
│   - Category Management          │
│   - Tag Management               │
│                                  │
└────────────┬─────────────────────┘
             │
             │ TCP Port 5432
             │ SQL Protocol
             ▼
    ┌────────────────────────┐
    │  PostgreSQL 14+        │
    │  - Usuarios            │
    │  - Tareas              │
    │  - Categorías          │
    │  - Etiquetas           │
    │  - Audit Logs          │
    └────────────────────────┘
```

### 2.2 Vista de Componentes (Container View)

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTE WEB                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  UI Layer          │  │  State Management  │                  │
│  │  - Login Form      │  │  - AuthContext     │                  │
│  │  - Todo CRUD UI    │  │  - useAuth hook    │                  │
│  │  - Filter/Sort UI  │  │  - useTask hook    │                  │
│  │  - Dashboard       │  │  - useCategory hook│                  │
│  └────────┬───────────┘  └────────┬───────────┘                  │
│           │                       │                               │
│           └───────────┬───────────┘                               │
│                       │                                           │
│           ┌───────────▼────────────┐                             │
│           │  API Client Service    │                             │
│           │  - Axios + Interceptors│                             │
│           │  - Token Management    │                             │
│           │  - Error Handling      │                             │
│           │  - Request/Response    │                             │
│           │    Transformation      │                             │
│           └───────────┬────────────┘                             │
│                       │                                           │
│                       │ HTTPS REST API                            │
│                       │                                           │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ PORT 3000
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                  EXPRESS.JS SERVER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE STACK                            │    │
│  │  1. CORS Handler                                         │    │
│  │  2. Body Parser (JSON)                                   │    │
│  │  3. Request Logging (Winston)                            │    │
│  │  4. Rate Limiter                                         │    │
│  │  5. Auth Validator (JWT Middleware)                      │    │
│  │  6. Error Handler                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ Auth Service     │  │ Todo Service     │  │ Category     │   │
│  │                  │  │                  │  │ Service      │   │
│  │ - Register       │  │ - Create Task    │  │              │   │
│  │ - Login          │  │ - Update Task    │  │ - CRUD Ops   │   │
│  │ - Validate JWT   │  │ - Delete Task    │  │ - Validation │   │
│  │ - Refresh Token  │  │ - Get Tasks      │  │              │   │
│  │ - Get Profile    │  │ - Filter/Sort    │  └──────────────┘   │
│  └────────┬─────────┘  │ - Permissions    │                     │
│           │             └─────────┬────────┘                     │
│           │                       │                              │
│           │             ┌─────────▼────────┐                    │
│           │             │ Tag Service      │                    │
│           └─────────────┤                  │                    │
│                         │ - CRUD Tags      │                    │
│                         │ - Relation Mgmt  │                    │
│                         └──────────────────┘                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DATA ACCESS LAYER                                       │   │
│  │  - Knex.js Query Builder                                 │   │
│  │  - Repository Pattern (DAOs)                             │   │
│  │  - Connection Pool                                       │   │
│  │  - Transaction Management                                │   │
│  │  - Query Optimization                                    │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────┐   │
│  │  INFRASTRUCTURE SERVICES                                │   │
│  │  - Cache (Redis) - Optional                             │   │
│  │  - Email Service (NodeMailer) - Optional                │   │
│  │  - Task Queue (Bull) - Optional                         │   │
│  │  - Logging (Pino)                                       │   │
│  │  - Metrics (Prometheus) - Optional                      │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                 │
└─────────────────┼────────────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────┐
        │                    │              │
        ▼                    ▼              ▼
    ┌─────────┐        ┌──────────┐   ┌────────┐
    │PostgreSQL│        │  Redis   │   │ S3/CDN │
    │ (Primary)│        │ (Cache)  │   │(Assets)│
    └─────────┘        └──────────┘   └────────┘
```

---

## 3. Arquitectura de Capas (Layered Architecture)

### 3.1 Representación por Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                             │
│  • React Components (UI)                                          │
│  • Page Layout Components                                         │
│  • Form Components                                                │
│  • Error Boundaries                                               │
│  └─ Responsibility: Rendering UI, User Interaction               │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (Frontend)                     │
│  • React Hooks (useAuth, useTask, useCategory)                   │
│  • State Management (Context API)                                │
│  • Form Validation Logic                                         │
│  • Data Transformation                                           │
│  └─ Responsibility: Business rules, State management            │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│               INTEGRATION LAYER (Frontend)                        │
│  • API Client Service                                             │
│  • Axios Interceptors                                             │
│  • Token Management                                               │
│  • Request/Response Transformation                                │
│  └─ Responsibility: API communication                            │
└──────────────────────────────────────────────────────────────────┘
                           │
                    REST API (HTTPS)
                           │
┌──────────────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER (Backend)                         │
│  • Express Route Handlers                                         │
│  • Request Validation (Zod Schema)                                │
│  • Response Serialization                                         │
│  • HTTP Status Code Mapping                                       │
│  └─ Responsibility: HTTP protocol handling                       │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│            APPLICATION LAYER (Business Logic)                    │
│  • Service Classes                                                │
│  │  • AuthService (Authentication, JWT)                          │
│  │  • TodoService (CRUD, Filtering, Sorting)                     │
│  │  • CategoryService (Category operations)                       │
│  │  • TagService (Tag operations, M:M relations)                  │
│  │  • AnalyticsService (BI queries)                              │
│  │                                                                │
│  • Authorization checks                                           │
│  • Business rule validation                                       │
│  • Transaction orchestration                                      │
│  └─ Responsibility: Business logic, domain rules                │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│            DATA ACCESS LAYER (Repository/DAO)                    │
│  • UserRepository                                                 │
│  • TodoRepository                                                 │
│  • CategoryRepository                                             │
│  • TagRepository                                                  │
│  • AuditRepository                                                │
│  │                                                                │
│  • Query building with Knex.js                                    │
│  • Connection pooling                                             │
│  • Transaction management                                         │
│  └─ Responsibility: Data persistence abstraction                │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                          │
│  • Relational data persistence                                    │
│  • ACID transactions                                              │
│  • Indexes and query optimization                                 │
│  • Foreign key constraints                                        │
│  │  └─ Responsibility: Data durability, ACID guarantees         │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Definición de Responsabilidades por Capa

| Capa | Componentes | Responsabilidades | Dependencias |
|---|---|---|---|
| **Presentation** | Components, Pages, Forms | Renderizado, eventos usuario | State, Services |
| **Business Logic** | Hooks, Context, Validators | Reglas de negocio, estado | API Client |
| **Integration** | API Client, Interceptors | Comunicación HTTP, transformación | Backend API |
| **Controllers** | Route handlers | Mapeo HTTP → Services | Services |
| **Application** | Services | Orquestación, validación negocio | Repositories |
| **Data Access** | Repositories, DAOs | Abstracción de persistencia | Database |
| **Database** | PostgreSQL | Durabilidad, integridad | (Ninguna) |

---

## 4. Diseño de Datos (Database Schema)

### 4.1 Modelo Entidad-Relación (ER Diagram)

```
┌─────────────────┐
│    USUARIOS     │
├─────────────────┤
│ id (UUID) (PK)  │◄──────────────┐
│ email (UNIQUE)  │               │ 1:N
│ username        │               │
│ password_hash   │               │
│ created_at      │               │
│ updated_at      │               │
│ deleted_at      │               │
└─────────────────┘               │
                                  │
                  ┌───────────────┴────────────┐
                  │                             │
                  ▼                             ▼
         ┌────────────────┐         ┌──────────────────┐
         │    TAREAS      │         │  CATEGORÍAS      │
         ├────────────────┤         ├──────────────────┤
         │ id (PK)        │         │ id (PK)          │
         │ usuario_id (FK)├────────►│ usuario_id (FK)  │
         │ categoría_id   │         │ nombre           │
         │ (FK)           │         │ descripción      │
         │ titulo         │         │ color            │
         │ descripción    │         │ created_at       │
         │ prioridad      │         │ updated_at       │
         │ completada     │         │ deleted_at       │
         │ fecha_creación │         └──────────────────┘
         │ fecha_vencm.   │
         │ created_at     │
         │ updated_at     │
         │ deleted_at     │
         └────┬───────────┘
              │
              │ N:M
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
┌──────────────────┐  ┌──────────────┐
│ TAREA_ETIQUETAS  │  │  ETIQUETAS   │
├──────────────────┤  ├──────────────┤
│ tarea_id (FK+PK) │─►│ id (PK)      │
│ etiqueta_id      │  │ usuario_id   │
│ (FK+PK)          │  │ (FK)         │
│ created_at       │  │ nombre       │
└──────────────────┘  │ color        │
                      │ created_at   │
                      │ updated_at   │
                      │ deleted_at   │
                      └──────────────┘

┌─────────────────┐
│  AUDIT_LOGS     │  (Propuesta adicional)
├─────────────────┤
│ id (PK)         │
│ usuario_id (FK) │
│ entidad_tipo    │
│ entidad_id      │
│ accion          │
│ cambios_antes   │
│ cambios_despues │
│ timestamp       │
│ ip_address      │
│ user_agent      │
└─────────────────┘
```

### 4.2 Definición Detallada de Tablas

```sql
-- USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255),
    foto_perfil_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,  -- Soft delete
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_deleted_at (deleted_at)
);

-- CATEGORÍAS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3498db',  -- Hex color
    orden INT DEFAULT 0,  -- Para ordenamiento personalizado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_deleted_at (deleted_at),
    UNIQUE KEY unique_usuario_categoria (usuario_id, nombre, deleted_at)
);

-- TAREAS
CREATE TABLE tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    prioridad VARCHAR(20) DEFAULT 'normal'  -- 'baja', 'normal', 'alta', 'urgente'
        CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    completada BOOLEAN DEFAULT FALSE,
    fecha_vencimiento TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completada_en TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    
    -- Índices para filtrado y ordenamiento
    INDEX idx_usuario_completada (usuario_id, completada),
    INDEX idx_usuario_categoria (usuario_id, categoria_id),
    INDEX idx_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_prioridad (prioridad),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_created_at (created_at),
    -- Índice compuesto para filtrado complejo
    INDEX idx_usuario_prioridad_completada (usuario_id, prioridad, completada)
);

-- ETIQUETAS
CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#95a5a6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_deleted_at (deleted_at),
    UNIQUE KEY unique_usuario_etiqueta (usuario_id, nombre, deleted_at)
);

-- TAREA_ETIQUETAS (Junction table para relación M:M)
CREATE TABLE tarea_etiquetas (
    tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (tarea_id, etiqueta_id),
    INDEX idx_etiqueta_id (etiqueta_id)
);

-- AUDIT_LOGS (Propuesta adicional P2)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    entidad_tipo VARCHAR(50) NOT NULL,  -- 'usuario', 'tarea', 'categoría', etc.
    entidad_id UUID NOT NULL,
    accion VARCHAR(20) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE'
    cambios_antes JSONB,
    cambios_despues JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Índices
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_entidad_tipo (entidad_tipo),
    INDEX idx_timestamp (timestamp)
);
```

### 4.3 Justificación de Decisiones de Datos

| Decisión | Razón | Trade-off | Justificación Final |
|---|---|---|---|
| **Soft Deletes** | Auditoría, recuperación, compliance | Queries más complejas con WHERE deleted_at IS NULL | Beneficio (auditoría) > Costo (queries). Índices mitiguen overhead. |
| **UUID (no BIGSERIAL)** | Privacidad: no revelar cantidad de usuarios | +16 bytes vs 8, +lookup time negligible | Estándar moderno. Privacidad crítica. Zero cost en performance (índices mitigan). |
| **Índices compuestos** | Filtrado multidimensional eficiente | +Storage (~50MB por índice), +overhead INSERT/UPDATE | Beneficio (queries 100x+ rápido) >> Costo (storage barato). INSERT overhead microsegundos. |
| **JSONB para audit** | Flexibilidad, evolución de schema | Queries JSONB más complejas | Solo usado en auditoría, no en queries hot-path. Benefit >> Cost. |
| **ON DELETE CASCADE** | Integridad referencial automática | Riesgo de eliminar accidentalmente datos | Soft deletes mitigan. Usar CASCADE solo en relaciones seguras (user→tareas si user deleted). |
| **Índices en lugar de denormalización** | Evitar JOINs innecesarios pero con control | JOINs cuando necesarios, pero optimizados | Mejor que denormalización. Control fino: JOIN + índices solo en queries frecuentes. Consistency garantizada. |
| **Check constraint (prioridad)** | Validación en BD, data integrity | +~1ms overhead por INSERT | Microsegundos. Aplicación también valida con Zod. Defense-in-depth. Costo negligible. |

---

## 5. Arquitectura de API REST

### 5.1 Principios RESTful

```
┌──────────────────────────────────────────────────────────────┐
│           RESTful Design Principles Applied                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 1. RESOURCE-BASED URLS                                       │
│    /api/usuarios           → Recurso usuarios               │
│    /api/tareas             → Recurso tareas                 │
│    /api/tareas/1/etiquetas → Sub-recurso etiquetas         │
│                                                               │
│ 2. MÉTODOS HTTP ESTÁNDAR                                    │
│    GET    → Obtener (safe, idempotente)                    │
│    POST   → Crear (no-idempotente)                         │
│    PUT    → Reemplazar (idempotente)                       │
│    PATCH  → Actualizar parcial (idempotente)               │
│    DELETE → Eliminar (idempotente)                         │
│                                                               │
│ 3. CÓDIGOS DE ESTADO ESTÁNDAR                              │
│    200 OK, 201 Created, 204 No Content                     │
│    400 Bad Request, 401 Unauthorized, 403 Forbidden         │
│    404 Not Found, 409 Conflict, 422 Unprocessable Entity   │
│    500 Internal Server Error, 503 Service Unavailable       │
│                                                               │
│ 4. VERSIONADO DE API                                        │
│    /api/v1/tareas          → Versión 1 (actual)            │
│    /api/v2/tareas          → Versión 2 (futura)            │
│                                                               │
│ 5. FORMATO DE RESPUESTA ESTÁNDAR                            │
│    {                                                         │
│      "success": true,                                        │
│      "data": {...},                                          │
│      "error": null,                                          │
│      "meta": { "timestamp": "...", "version": "1.0" }       │
│    }                                                         │
│                                                               │
│ 6. PAGINACIÓN                                                │
│    GET /api/tareas?page=1&limit=20&offset=0                │
│    Response incluye { total, page, limit, hasMore }         │
│                                                               │
│ 7. FILTRADO Y BÚSQUEDA                                       │
│    GET /api/tareas?completada=false&prioridad=alta          │
│    GET /api/tareas?busqueda=importante                      │
│                                                               │
│ 8. ORDENAMIENTO                                              │
│    GET /api/tareas?sort=fecha_vencimiento:asc               │
│    GET /api/tareas?sort=prioridad:desc,fecha_creacion:asc   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Catálogo de Endpoints

```
╔═══════════════════════════════════════════════════════════════════╗
║                   AUTHENTICATION ENDPOINTS                        ║
╠═══════════════════════════════════════════════════════════════════╣
║ POST   /api/v1/auth/register           │ Registro de usuario      ║
║ POST   /api/v1/auth/login              │ Login + JWT              ║
║ POST   /api/v1/auth/logout             │ Logout (blacklist token) ║
║ POST   /api/v1/auth/refresh            │ Refresh token            ║
║ GET    /api/v1/auth/profile            │ Perfil usuario (auth)    ║
╠═══════════════════════════════════════════════════════════════════╣
║                    TAREAS ENDPOINTS                               ║
╠═══════════════════════════════════════════════════════════════════╣
║ GET    /api/v1/tareas                  │ Listar tareas (con filtro)║
║ POST   /api/v1/tareas                  │ Crear tarea              ║
║ GET    /api/v1/tareas/:id              │ Obtener tarea            ║
║ PUT    /api/v1/tareas/:id              │ Actualizar tarea         ║
║ DELETE /api/v1/tareas/:id              │ Eliminar tarea           ║
║ PATCH  /api/v1/tareas/:id/completar   │ Marcar completada        ║
║ PATCH  /api/v1/tareas/:id/incompletar │ Marcar incompleta        ║
║ POST   /api/v1/tareas/:id/etiquetas    │ Agregar etiqueta         ║
║ DELETE /api/v1/tareas/:id/etiquetas/:eid │ Remover etiqueta      ║
╠═══════════════════════════════════════════════════════════════════╣
║                 CATEGORÍAS ENDPOINTS                              ║
╠═══════════════════════════════════════════════════════════════════╣
║ GET    /api/v1/categorias              │ Listar categorías        ║
║ POST   /api/v1/categorias              │ Crear categoría          ║
║ GET    /api/v1/categorias/:id          │ Obtener categoría        ║
║ PUT    /api/v1/categorias/:id          │ Actualizar categoría     ║
║ DELETE /api/v1/categorias/:id          │ Eliminar categoría       ║
╠═══════════════════════════════════════════════════════════════════╣
║                   ETIQUETAS ENDPOINTS                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ GET    /api/v1/etiquetas               │ Listar etiquetas         ║
║ POST   /api/v1/etiquetas               │ Crear etiqueta           ║
║ GET    /api/v1/etiquetas/:id           │ Obtener etiqueta         ║
║ PUT    /api/v1/etiquetas/:id           │ Actualizar etiqueta      ║
║ DELETE /api/v1/etiquetas/:id           │ Eliminar etiqueta        ║
╠═══════════════════════════════════════════════════════════════════╣
```

### 5.3 Flujos de API Principales

#### **Flujo: Crear Tarea**
```
Cliente                          Backend                      BD
  │                               │                            │
  ├──POST /api/tareas──────────►│                            │
  │ {titulo, descripción,        │                            │
  │  prioridad, fecha_vencm}     │                            │
  │                               │                            │
  │                        ┌──────┴──────┐                    │
  │                        │ Validar JWT  │                    │
  │                        └──────┬──────┘                    │
  │                               │                            │
  │                        ┌──────┴──────────────┐           │
  │                        │ Validar Schema Zod  │           │
  │                        └──────┬──────────────┘           │
  │                               │                            │
  │                        ┌──────┴──────┐                    │
  │                        │ Crear tarea │                    │
  │                        │ en service  │                    │
  │                        └──────┬──────┘                    │
  │                               │                            │
  │                        ┌──────┴──────────────┐           │
  │                        │ INSERT tarea        │           │
  │                        │ Retorna id, ...     │◄──────────┤
  │                        └──────┬──────────────┘           │
  │                               │                            │
  │                        ┌──────┴──────┐                    │
  │                        │ Log evento   │                    │
  │                        │ en audit_log │                    │
  │                        └──────┬──────┘                    │
  │                               │                            │
  │◄──201 Created────────────────┤                            │
  │ {id, titulo, ...,             │                            │
  │  created_at, ...}             │                            │
```

#### **Flujo: Filtrar Tareas**
```
Cliente                          Backend                      BD
  │                               │                            │
  ├─GET /api/tareas?─────────────►│                            │
  │  completada=false&             │                            │
  │  prioridad=alta&               │                            │
  │  sort=fecha_vencimiento        │                            │
  │                                │                            │
  │                        ┌───────┴────────┐                 │
  │                        │ Validar JWT    │                 │
  │                        └───────┬────────┘                 │
  │                                │                            │
  │                        ┌───────┴──────────────────┐       │
  │                        │ Construir query con Knex│       │
  │                        │ WHERE usuario_id = ?    │       │
  │                        │ AND completada = false  │       │
  │                        │ AND prioridad = 'alta'  │       │
  │                        │ ORDER BY fecha_venc ASC │       │
  │                        │ LIMIT 20, OFFSET 0      │       │
  │                        └───────┬──────────────────┘       │
  │                                │                            │
  │                                │ SELECT * FROM tareas...   │
  │                                │◄───────────────────────────┤
  │                        ┌───────┴──────────────────┐       │
  │                        │ Incluir etiquetas para   │       │
  │                        │ cada tarea (LEFT JOIN)   │       │
  │                        └───────┬──────────────────┘       │
  │                                │                            │
  │◄──200 OK──────────────────────┤                            │
  │ {                              │                            │
  │   data: [{id, titulo, ...      │                            │
  │           etiquetas: [...]},    │                            │
  │          ...],                  │                            │
  │   meta: {total: 15, page: 1}    │                            │
  │ }                              │                            │
```

---

## 6. Patrones de Diseño Implementados

### 6.1 Patrones de Creacionales

#### **Service Locator / Dependency Injection**
```javascript
// services/Container.js
class ServiceContainer {
  constructor() {
    this.services = {};
  }
  
  register(name, service) {
    this.services[name] = service;
  }
  
  get(name) {
    return this.services[name];
  }
}

// En app.js
const container = new ServiceContainer();
container.register('authService', new AuthService(database));
container.register('todoService', new TodoService(database));
```

#### **Repository Pattern (Data Access Abstraction)**
```javascript
// repositories/TodoRepository.js
class TodoRepository {
  async findByUserId(userId, filters) { ... }
  async create(userId, data) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
}

// services/TodoService.js
class TodoService {
  constructor(todoRepository, tagRepository) {
    this.todoRepository = todoRepository;
    this.tagRepository = tagRepository;
  }
}
```

### 6.2 Patrones Estructurales

#### **Middleware Pattern**
```javascript
// Middleware stack
app.use(corsMiddleware());
app.use(bodyParserMiddleware());
app.use(requestLoggingMiddleware());
app.use(rateLimitMiddleware());
app.use(authMiddleware());
app.use(errorHandlerMiddleware());

// Custom middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({error: 'No token'});
  
  try {
    req.user = jwt.verify(token.split(' ')[1], SECRET);
    next();
  } catch (err) {
    res.status(401).json({error: 'Invalid token'});
  }
}
```

#### **Adapter Pattern (API Client con Axios)**

**Propósito:** Abstracción de HTTP client (Axios) para desacoplamiento. Si cambiamos de Axios a otra librería, solo cambiamos el adapter.

```typescript
// adapters/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Interfaz define contrato (independiente de Axios)
export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

// Implementación con Axios
export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: agregar token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: refresh token si expira
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, refrescar
          const newToken = await this.refreshToken();
          if (newToken) {
            // Reintentar request original
            return this.client(error.config);
          }
        }
        throw error;
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(url, config).then(res => res.data);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T>(url, data, config).then(res => res.data);
  }

  // ... otros métodos similares

  private async refreshToken(): Promise<string | null> {
    try {
      const response = await axios.post('/api/v1/auth/refresh', {
        refreshToken: localStorage.getItem('refreshToken')
      });
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }
}

// Uso: inyectar HttpClient en servicios
export class TodoService {
  constructor(private http: HttpClient) {}

  async getTodos(): Promise<Todo[]> {
    return this.http.get<Todo[]>('/todos');
  }

  async createTodo(data: CreateTodoDto): Promise<Todo> {
    return this.http.post<Todo>('/todos', data);
  }
}
```

**Beneficios del Adapter Pattern aquí:**
- ✅ Desacoplamiento: Si cambiar de Axios a Fetch o swr, solo cambiar implementación
- ✅ Testing: Mockear HttpClient en tests sin usar HTTP real
- ✅ Consistencia: Todos los calls HTTP siguen mismo patrón (interceptores, error handling)
- ✅ Type-safety: Con TypeScript, errores atrapados en compile-time

### 6.3 Patrones de Comportamiento

#### **Observer Pattern (Context API) - Type-Safe con TypeScript**

**Justificación de Context API para Autenticación:**
- ✅ Necesidad: Estado global de auth (usuario, token, loading, error)
- ✅ Razón: Evitar prop drilling a través de toda la app
- ✅ Alternativas: Redux (overkill), Zustand (buena opción pero más setup)
- ✅ Decisión: Context API porque es built-in React, no agrega dependencias

```typescript
// contexts/AuthContext.tsx

// Interfaz explícita para type-safety
interface AuthContextType {
  // Estado
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}

// Crear contexto con tipo seguro
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.user);
      setToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', data);
      setUser(response.user);
      setToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const refreshAccessToken = async () => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      setToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
    } catch (err) {
      logout();
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshAccessToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook con validación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Uso en componentes
function LoginForm() {
  const { login, isLoading, error } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Navigate to dashboard
    } catch (err) {
      // Error ya está en context
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {isLoading && <Spinner />}
      {/* form fields */}
    </form>
  );
}
```

**Ventajas de este approach:**
- ✅ **Type-safe:** TypeScript garantiza que solo se acceden propiedades válidas
- ✅ **Error handling centralizado:** Todos los errores en un lugar
- ✅ **Loading states:** Sincronizados en toda la app
- ✅ **Token management:** Refresh automático, logout limpio
- ✅ **Composable:** Fácil de testear, fácil de extender
- ✅ **No prop drilling:** Acceso desde cualquier componente dentro de AuthProvider

#### **Strategy Pattern (Filtrado)**
```javascript
// strategies/TodoFilterStrategy.js
class TodoFilterStrategy {
  byPriority(query, priority) { ... }
  byDate(query, date) { ... }
  byStatus(query, status) { ... }
  
  apply(query, filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (this[`by${capitalize(key)}`]) {
        this[`by${capitalize(key)}`](query, value);
      }
    });
  }
}
```

#### **WebSockets - Comunicación en Tiempo Real**

**Uso en la Aplicación:**

```typescript
// Backend: Socket.io para colaboración real-time
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  // Subscribirse a actualizaciones de tarea
  socket.on('task:subscribe', (taskId: number) => {
    socket.join(`task:${taskId}`);
  });

  // Cuando usuario edita tarea
  socket.on('task:update', async (taskId: number, updates: Record<string, any>) => {
    // Validar permiso
    const hasAccess = await checkTaskAccess(userId, taskId);
    if (!hasAccess) return socket.emit('error', { message: 'Access denied' });

    // Actualizar en BD
    const updatedTask = await todoService.update(taskId, userId, updates);

    // Emitir a todos conectados a esa tarea
    io.to(`task:${taskId}`).emit('task:updated', {
      taskId,
      updates,
      updatedBy: userId,
      timestamp: new Date(),
    });

    // Crear notificación para otros colaboradores
    await notificationService.notifyTaskUpdate(taskId, userId);
  });

  // Comentarios en tiempo real
  socket.on('comment:create', async (taskId: number, content: string) => {
    const comment = await commentService.create(taskId, userId, content);
    io.to(`task:${taskId}`).emit('comment:created', comment);
  });

  // Unsubscribe
  socket.on('task:unsubscribe', (taskId: number) => {
    socket.leave(`task:${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Frontend: React Hook para sincronización real-time
import { useEffect, useState, useContext } from 'react';
import { SocketContext } from './contexts/SocketContext';

export function useTaskUpdates(taskId: number) {
  const [task, setTask] = useState<Task | null>(null);
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (!socket) return;

    // Subscribirse a cambios
    socket.emit('task:subscribe', taskId);

    const handleTaskUpdate = (data: {
      taskId: number;
      updates: Record<string, any>;
      updatedBy: number;
      timestamp: Date;
    }) => {
      setTask((prev) => {
        if (!prev) return prev;
        return { ...prev, ...data.updates };
      });

      // Mostrar notificación inline
      showNotification(`Task updated by User ${data.updatedBy}`);
    };

    const handleCommentCreated = (comment: Comment) => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comentarios: [...(prev.comentarios || []), comment],
        };
      });
    };

    socket.on('task:updated', handleTaskUpdate);
    socket.on('comment:created', handleCommentCreated);

    return () => {
      socket.off('task:updated', handleTaskUpdate);
      socket.off('comment:created', handleCommentCreated);
      socket.emit('task:unsubscribe', taskId);
    };
  }, [taskId, socket]);

  return task;
}
```

**Sincronización Multi-Tab:**

```typescript
// Cuando usuario abre app en tab 2, sincronizar con tab 1
useEffect(() => {
  // Usar BroadcastChannel API para comunicación entre tabs
  const channel = new BroadcastChannel('todolist:updates');

  channel.onmessage = (event) => {
    const { type, data } = event.data;
    if (type === 'task:updated') {
      setTask(data);
    }
  };

  return () => channel.close();
}, []);

// Cuando tarea se actualiza, broadcast a otros tabs
const updateTask = async (id: number, updates: Record<string, any>) => {
  const updated = await api.put(`/tasks/${id}`, updates);
  
  // Broadcast a otros tabs
  const channel = new BroadcastChannel('todolist:updates');
  channel.postMessage({
    type: 'task:updated',
    data: updated,
  });

  return updated;
};
```

---

## 7. Seguridad (Security by Design)

### 7.1 Capas de Seguridad

```
┌────────────────────────────────────────────────────────────────┐
│                  CAPA 1: TRANSPORT (HTTPS)                     │
│  • TLS 1.2+ obligatorio                                        │
│  • Certificados válidos                                        │
│  • HSTS headers                                                │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│            CAPA 2: SECURITY HEADERS & RATE LIMITING             │
│  • Helmet.js: CSP, X-Frame-Options, HSTS, etc                 │
│  • Rate limiter por IP (10 req/min, 100 req/hora)             │
│  • CORS restringida a dominios permitidos                      │
│  • CSRF protection (tokens)                                    │
│  • WAF rules (ngx_http_modsecurity en Nginx)                  │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│           CAPA 3: AUTENTICACIÓN & AUTORIZACIÓN                 │
│  • JWT con expiración (15 min access, 7 días refresh)         │
│  • Verificación de propiedad de recurso                        │
│  • Role-based access control (RBAC) - futuro                  │
│  • Token blacklist en Redis                                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│         CAPA 4: VALIDACIÓN & SANITIZACIÓN                      │
│  • Schema validation (Zod + runtime type checking)            │
│  • Input sanitization (DOMPurify)                              │
│  • Type checking en BD (CHECK constraints)                     │
│  • Parametrized queries (SQL injection prevention)             │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│            CAPA 5: DATA LAYER SECURITY                          │
│  • Foreign key constraints                                     │
│  • Encryption of PII at rest (bcrypt passwords)               │
│  • Soft deletes (data recovery)                                │
│  • Audit logging de todos los cambios                          │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Amenazas y Mitigaciones

| Amenaza OWASP | Riesgo | Mitigación Implementada |
|---|---|---|
| **A1: Injection** | SQL injection | Parametrized queries, Knex.js |
| **A2: Broken Auth** | Session hijacking, token theft | JWT con expiración, HTTPS |
| **A3: Sensitive Data** | Exposure de PII | Bcrypt para passwords, HTTPS |
| **A4: Broken Access Control** | Acceso no autorizado a datos | Verificación de propiedad en endpoints |
| **A5: Security Config** | Misconfigurations | Environment vars, secrets management |
| **A6: XSS** | Script injection | React sanitization, CSP headers |
| **A7: CSRF** | Cross-site requests | CSRF tokens, SameSite cookies |
| **A8: Deserialization** | Remote code execution | Input validation, no eval() |
| **A9: Logging** | Falta de auditoría | Audit logs en todas operaciones |
| **A10: XXE** | XML external entity | No procesamiento de XML |

### 7.3 Variables de Entorno y Secrets

```bash
# .env.local (Development)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/todolist_dev
JWT_SECRET=dev-secret-only-for-dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug

# .env.production (Production - NUNCA en git)
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@secure-prod-db.aws.rds.amazonaws.com:5432/todolist_prod
JWT_SECRET=<64-char-cryptographic-secret>
JWT_REFRESH_SECRET=<64-char-cryptographic-secret>
REDIS_URL=redis://:password@redis-cluster.aws.elasticache.amazonaws.com:6379
LOG_LEVEL=warn
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

---

## 8. Rendimiento y Escalabilidad

### 8.1 Estrategia de Caching

```
┌──────────────────────────────────────────────────────────────┐
│                    CACHING STRATEGY                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Browser Cache (Cliente)                                      │
│  • Static assets (CSS, JS): 1 año                           │
│  • HTML: no-cache, must-revalidate                          │
│                                                               │
│ HTTP Cache (Headers)                                         │
│  • Cache-Control: public, max-age=3600                       │
│  • ETag para validación                                      │
│  • Last-Modified para resources                              │
│                                                               │
│ Redis Cache (Backend)                                        │
│  • Sesiones de usuarios: TTL 7 días                         │
│  • Token blacklist: TTL 15 minutos                           │
│  • Query cache (tareas frecuentes): TTL 5 minutos           │
│  • User profile: TTL 1 hora                                  │
│  • Categorías por usuario: TTL 6 horas                       │
│  • Etiquetas por usuario: TTL 6 horas                        │
│                                                               │
│ Database Cache (Query Plan)                                  │
│  • Prepared statements reutilizados                          │
│  • Índices en columnas filtradas                             │
│  • Statistics actualizadas (ANALYZE)                         │
│                                                               │
│ Cache Invalidation Strategy                                  │
│  • Time-based (TTL)                                          │
│  • Event-based (invalidar después de UPDATE)                │
│  • Manual (admin panel)                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Optimización de Queries

#### **Índices Recomendados**

```sql
-- Índices en TAREAS (tabla más consultada)
CREATE INDEX idx_usuario_completada 
  ON tareas(usuario_id, completada) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_usuario_categoria 
  ON tareas(usuario_id, categoria_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_usuario_prioridad_completada 
  ON tareas(usuario_id, prioridad, completada) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_fecha_vencimiento 
  ON tareas(fecha_vencimiento) 
  WHERE deleted_at IS NULL;

-- Índices en ETIQUETAS
CREATE INDEX idx_usuario_etiqueta_nombre 
  ON etiquetas(usuario_id, nombre) 
  WHERE deleted_at IS NULL;

-- Índice en TAREA_ETIQUETAS para búsqueda por etiqueta
CREATE INDEX idx_etiqueta_id_tarea_id 
  ON tarea_etiquetas(etiqueta_id, tarea_id);
```

#### **Query Optimization Pattern**

```javascript
// ❌ Malo: N+1 queries
const tareas = await todoRepo.findAll(userId);
const tareasConEtiquetas = tareas.map(async tarea => {
  tarea.etiquetas = await etiquetaRepo.findByTareaId(tarea.id);
  return tarea;
});

// ✅ Bueno: Single query con JOIN
const tareasConEtiquetas = await knex('tareas')
  .where('usuario_id', userId)
  .leftJoin('tarea_etiquetas', 'tareas.id', '=', 'tarea_etiquetas.tarea_id')
  .leftJoin('etiquetas', 'tarea_etiquetas.etiqueta_id', '=', 'etiquetas.id')
  .select(
    'tareas.*',
    knex.raw('json_agg(etiquetas.*) as etiquetas')
  )
  .groupBy('tareas.id');
```

### 8.3 Escalabilidad Horizontal

```
┌─────────────────────────────────────────────────────────────┐
│                ARQUITECTURA ESCALABLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│             ┌─────────────────────────────┐                │
│             │   Load Balancer (Nginx)     │                │
│             │   • Round-robin             │                │
│             │   • Health checks           │                │
│             │   • SSL termination         │                │
│             └──────────┬────────────────┬─┘                │
│                        │                │                  │
│          ┌─────────────┘                └──────────┐       │
│          │                                         │        │
│          ▼                                         ▼        │
│     ┌──────────────┐                         ┌──────────────┐
│     │ App Server 1 │                         │ App Server 2 │
│     │ Node.js      │                         │ Node.js      │
│     │ PORT 3000    │                         │ PORT 3000    │
│     │ (Stateless)  │                         │ (Stateless)  │
│     └──────────────┘                         └──────────────┘
│              │                                       │
│              └──────────────┬──────────────────────┘
│                             │
│                      Shared Redis Cluster
│                   (Sessions, Token Blacklist)
│                             │
│              ┌──────────────┴──────────────┐
│              │                             │
│              ▼                             ▼
│        ┌──────────────┐           ┌─────────────────┐
│        │Primary DB    │◄──────────┤Secondary DB     │
│        │(Read/Write)  │           │(Read-only)      │
│        │PostgreSQL    │           │Replica          │
│        └──────────────┘           └─────────────────┘
│              │
│              ▼
│        ┌──────────────┐
│        │ Backups      │
│        │ Daily        │
│        │ Point-in-time│
│        └──────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Propuestas de Extensión Arquitectónica

### 9.1 Arquitectura para Propuesta P3: Colaboración y Compartir Tareas

```
┌──────────────────────────────────────────────────────────────┐
│           TAREAS COMPARTIDAS - MODELO DE DATOS                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Tabla existente: TAREAS                                      │
│   ├─ id                                                       │
│   ├─ usuario_id (propietario)                               │
│   ├─ ...                                                     │
│                                                               │
│ Nueva tabla: TAREA_PERMISOS (N:N usuarios-tareas)           │
│   ├─ tarea_id (FK)                                          │
│   ├─ usuario_id (FK)                                        │
│   ├─ rol ('owner', 'editor', 'viewer')                      │
│   ├─ granted_at                                             │
│   └─ granted_by_id (FK) → usuario que concedió acceso       │
│                                                               │
│ Nueva tabla: TAREA_COMENTARIOS                              │
│   ├─ id                                                      │
│   ├─ tarea_id (FK)                                          │
│   ├─ usuario_id (FK)                                        │
│   ├─ contenido                                              │
│   ├─ created_at                                             │
│   └─ actualizado_at                                         │
│                                                               │
│ Nueva tabla: NOTIFICACIONES_TAREA                           │
│   ├─ id                                                      │
│   ├─ usuario_id (FK)                                        │
│   ├─ tarea_id (FK)                                          │
│   ├─ tipo ('shared', 'commented', 'completed')             │
│   ├─ leida (boolean)                                        │
│   └─ created_at                                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘

Endpoints nuevos:
  POST   /api/v1/tareas/:id/compartir      → Compartir con usuario
  GET    /api/v1/tareas/:id/permisos       → Listar usuarios con acceso
  DELETE /api/v1/tareas/:id/compartir/:uid → Revocar acceso
  POST   /api/v1/tareas/:id/comentarios    → Comentar en tarea
  GET    /api/v1/notificaciones            → Listar notificaciones
  PATCH  /api/v1/notificaciones/:id/leer   → Marcar como leída

Cambios en autorización:
  • Verificar permisos en cada endpoint
  • Middleware checkTaskAccess(minRole)
  • Rol-based operations (solo owner puede eliminar)
```

### 9.2 Arquitectura para Propuesta P6: Sincronización Offline

```
┌──────────────────────────────────────────────────────────────┐
│          OFFLINE-FIRST ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Cliente                                                      │
│   ├─ Service Worker (intercepción de requests)              │
│   ├─ IndexedDB (almacén local)                              │
│   ├─ Sync Manager (cola de cambios pendientes)              │
│   └─ Conflict resolver (merge de cambios)                   │
│                                                               │
│ Cuando está ONLINE:                                          │
│   1. Operación se guarda en IndexedDB                       │
│   2. Se envía al servidor inmediatamente                    │
│   3. Si servidor acepta, se marca como synced              │
│   4. Si hay error, entra en cola de retry                  │
│                                                               │
│ Cuando está OFFLINE:                                         │
│   1. Operación se guarda en IndexedDB                       │
│   2. UI muestra estado "pendiente sincronización"           │
│   3. Service Worker las mantiene en cola                    │
│                                                               │
│ Cuando vuelve ONLINE:                                        │
│   1. Service Worker sincroniza cambios pendientes           │
│   2. Si hay conflictos (servidor modificó también):        │
│      a) Merge automático (cambios no conflictivos)         │
│      b) Pedir resolución manual al usuario                │
│   3. Actualizar IndexedDB con versión definitiva           │
│                                                               │
│ Base datos local (IndexedDB):                               │
│   {                                                         │
│     usuarios: [...],                                        │
│     tareas: [...],                                          │
│     categorias: [...],                                      │
│     etiquetas: [...],                                       │
│     sync_queue: [                                           │
│       {                                                      │
│         operation: 'create_task',                           │
│         data: {...},                                        │
│         status: 'pending',                                  │
│         timestamp: ...,                                     │
│         clientId: '...'  // Para reconciliación            │
│       }                                                      │
│     ]                                                        │
│   }                                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Arquitectura para Propuesta P8: Mobile App

```
┌────────────────────────────────────────────────────────────┐
│      MONOREPO ARCHITECTURE (Código compartido)             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ /root                                                       │
│ ├── packages/                                               │
│ │   ├── api/              → Backend Express.js             │
│ │   ├── web/              → React Web (SPA)               │
│ │   ├── mobile/           → React Native (iOS/Android)    │
│ │   ├── shared/           → Código compartido             │
│ │   │   ├── types/        → TypeScript types              │
│ │   │   ├── utils/        → Funciones utilitarias         │
│ │   │   ├── hooks/        → Hooks compartidos             │
│ │   │   └── services/     → Clientes API                 │
│ │   └── e2e/              → Tests end-to-end             │
│ │                                                           │
│ Estrategia:                                                 │
│   • Mismo cliente API en web y mobile                      │
│   • Misma lógica de validación compartida                  │
│   • Types TypeScript reutilizables                         │
│   • Hooks React compartidos (useTasks, useAuth, etc)      │
│   • Build separado para cada plataforma                    │
│                                                             │
│ Mobile-specific:                                            │
│   • Push notifications (FCM para Android, APN para iOS)   │
│   • Native module para biometría                           │
│   • Offline sync con SQLite                                │
│   • Camera para foto de tareas (bonus)                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 10. Modelo de Despliegue

### 10.1 Ambiente de Desarrollo

```
├── Local Development
│   ├── Docker Compose
│   │   ├── PostgreSQL
│   │   ├── Redis
│   │   └── pgAdmin (UI para BD)
│   ├── Node.js dev server (hot reload)
│   ├── React dev server (Vite/Webpack)
│   └── .env.local con credenciales dev
```

### 10.2 Ambiente de Staging

```
├── AWS/GCP/Azure
│   ├── App servers (2 instancias)
│   ├── PostgreSQL RDS (Multi-AZ)
│   ├── Redis ElastiCache
│   ├── Load Balancer
│   ├── CDN (CloudFront)
│   └── Monitoring (CloudWatch/Datadog)
```

### 10.3 Ambiente de Producción

```
├── Kubernetes Cluster
│   ├── Deployment: api (3 replicas)
│   ├── Deployment: nginx (2 replicas)
│   ├── StatefulSet: PostgreSQL (primary + replica)
│   ├── StatefulSet: Redis Cluster
│   ├── ConfigMaps y Secrets
│   └── HPA (Auto-scaling basado en CPU)
│
├── Persistencia
│   ├── PostgreSQL backups automáticos (daily)
│   ├── Point-in-time recovery (7 días)
│   └── S3 para datos históricos
│
├── Monitoreo
│   ├── Prometheus + Grafana
│   ├── Jaeger (Distributed tracing)
│   ├── Sentry (Error tracking)
│   └── PagerDuty (Alerting)
```

---

## 11. Decisiones Arquitectónicas Registradas (ADRs)

### ADR-001: Usar JWT sobre Sessions

**Estado:** ACEPTADO

**Contexto:** Necesidad de escalabilidad horizontal sin estado compartido

**Decisión:** Usar JWT con refresh tokens en lugar de sesiones en servidor

**Justificación:**
- Permite escalabilidad sin servidor de sesiones central
- Mejor para SPAs y aplicaciones distribuidas
- Menor carga en servidor (stateless)

**Trade-offs:**
- Token theft es posible (mitiga con HTTPS y storage seguro)
- Tamaño de payload en cada request
- No se puede revocar instantáneamente (mitiga con blacklist en Redis)

---

### ADR-002: PostgreSQL sobre NoSQL

**Estado:** ACEPTADO

**Contexto:** Datos altamente relacionales con requerimientos ACID

**Decisión:** Usar PostgreSQL como base de datos primaria

**Justificación:**
- ACID transactions garantiza consistencia
- Soporte para relaciones complejas (1:N, N:M)
- Full-text search integrado
- JSON support (JSONB) para flexibilidad
- Mejor para datos estructurados

**Trade-offs:**
- Menor escalabilidad horizontal que NoSQL
- Schema rígido requiere migrations
- Overhead de relaciones vs. NoSQL desnormalizado

---

### ADR-003: Drizzle ORM (Type-Safe Query Builder)

**Estado:** ACEPTADO

**Contexto:** Necesidad de type-safety + control fino sobre queries + evitar overhead innecesario

**Decisión:** Usar Drizzle ORM como query builder tipado en lugar de Knex.js (menos tipado) o ORMs pesados (TypeORM, Prisma)

**Justificación:**
- Type-safe: 100% TypeScript, validación en compile-time
- Zero runtime overhead: Genera SQL limpio, sin abstracción pesada
- Control fino: Acceso directo a SQL cuando necesario, pero con tipos
- Migrations: Soporte nativo con migrations versionadas
- Performance: Benchmarks comparables a raw SQL
- Moderno: ESM, tree-shakeable, <10KB

**Trade-offs:**
- Comunidad menor que Prisma/TypeORM (pero growing)
- Menos integrations que ORMs completos
- Curva de aprendizaje media (pero documentación buena)

**Alternativas Consideradas:**
- Knex.js: Menos type-safe, requiere tipos manuales
- Sequelize: Heavyweight, lento para queries complejas
- TypeORM: Type-safe pero overhead, lento
- Prisma: Type-safe pero query limitations, vendor lock-in

**Por qué Drizzle:**
Drizzle = "Type-safe Knex.js" → Lo mejor de ambos mundos

---

### ADR-004: Context API sobre Redux

**Estado:** ACEPTADO (MVP)

**Contexto:** Gestión de estado en React para aplicación mediana

**Decisión:** Usar Context API + useReducer para estado global

**Justificación:**
- Suficiente para complejidad actual
- Menos boilerplate que Redux
- Integración nativa con React 18

**Trade-offs:**
- Si crece mucho, migrar a Redux será necesario
- Menos dev tools que Redux
- Performance si estado cambia muy frecuentemente

**Migración futura:** Si app crece, hay path claro a Redux/Zustand

---

### ADR-005: Usar UUID como Identificador Primario (No BIGSERIAL)

**Estado:** ACEPTADO

**Contexto:** Privacidad y seguridad al exponer IDs en URLs públicas

**Decisión:** Usar UUID (v4 random) en lugar de BIGSERIAL secuencial para todas las claves primarias

**Justificación:**
- **Privacidad:** IDs secuenciales revelan cantidad de recursos (`/users/1, /users/2, /users/3` indica 3 usuarios)
- **Seguridad:** Imposible enumerar recursos por incrementar ID
- **Estándar moderno:** UUID es práctica estándar en aplicaciones modernas
- **Performance:** Índices B-tree en UUIDs son eficientes; PostgreSQL optimizado para esto
- **No conflictos:** Generado en aplicación, cero colisiones (probabilística)

**Trade-offs:**
- **Storage:** 16 bytes vs 8 bytes (BIGSERIAL). +100% por ID pero negligible en práctica (~50MB por millón de registros)
- **Speed:** Lookup UUID ~5% más lento que BIGSERIAL (pero mitigado con índices modernos)
- **Queryability:** Imposible predecir IDs (ventaja de seguridad, desventaja en testing)

**Mitigación:**
- Generar UUIDs con `gen_random_uuid()` en PostgreSQL (nativo, rápido)
- Crear índices agresivos en UUIDs para queries frecuentes
- En testing, usar UUIDs predeterminados (hardcoded) o factories

**Alternativas consideradas:**
- SNOWFLAKE IDs: Más complejos, overkill para este MVP
- ULID: Good alternative pero UUID estándar en industria

---

## 12. Matriz de Decisiones Resumida

| Componente | Decisión | Razón | Alternativa |
|---|---|---|---|
| **Runtime** | Node.js 18+ | Ecosistema JS unificado | Python, Go |
| **Framework** | Express | Simplicidad + control | Fastify, Koa |
| **BD** | PostgreSQL 14+ | ACID + relaciones | MySQL, MongoDB |
| **Primary Keys** | UUID (v4) | Privacidad, seguridad, estándar moderno | BIGSERIAL (expone cantidad), Snowflake |
| **ORM/Query Builder** | Drizzle ORM | Type-safe, zero overhead, control fino | Knex (less type-safe), Prisma (overhead), TypeORM (heavyweight) |
| **Auth** | JWT + refresh | Stateless scaling | Sessions Redis |
| **Frontend** | React 18 | Componentes reutilizables | Vue, Angular |
| **State** | Context API | Suficiente para MVP | Redux |
| **Validación** | Zod | Type-safe, runtime + compile-time | Joi, Yup |
| **Logging** | Pino | High performance | Winston |
| **Testing** | Jest + Testing Library | Estándar industria | Mocha, Vitest |
| **Cache** | Redis | Distributed, fast | Memcached |
| **Containers** | Docker | Reproducibilidad | Podman |
| **Orquestación** | Kubernetes | Production-ready | Docker Compose |

---

## 13. Conclusiones y Siguientes Pasos

Esta arquitectura proporciona:

✅ **Escalabilidad:** Stateless, horizontal scaling ready
✅ **Seguridad:** Multiple layers, OWASP coverage
✅ **Mantenibilidad:** Capas claras, separation of concerns
✅ **Performance:** Caching strategy, query optimization
✅ **Reliability:** ACID transactions, error handling
✅ **Extensibilidad:** Patrones abiertos para propuestas adicionales

**Próximos documentos:**
- Planificación detallada con historias de usuario
- Estructura SDD para especificaciones
- Plan de commits por feature

---

**Arquitectura completada:** Septiembre 2024
**Estado:** Listo para Planificación & Implementación
**Revisor:** Senior Architect
