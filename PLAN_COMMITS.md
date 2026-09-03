# Plan de Commits v2.1 CORRECTO - MVP + Propuestas Opcionales

## Estructura de Commits

### MVP v1.0 (CRÍTICO): 140-160 commits
**Timeline:** 8-9 semanas
**Result:** Aplicación completa, funcional, lista para producción

### Propuestas Opcionales (P1-P3): 43-55 commits
**Timeline:** 3-4 semanas adicionales (si hay tiempo)
**Result:** Features premium

**MÁXIMO POSIBLE:** 183-215 commits

---

## COMMITS CRÍTICOS (140-160)

### FASE 0: Setup (5-7 commits)

```
1. chore(project): initialize project structure
2. chore(config): setup TypeScript, ESLint, Prettier, Husky
3. chore(docker): initial docker-compose setup dev
4. chore(git): setup git flow and branch protection
5. chore(env): create .env.example with all variables
```

**Cumulative:** 5-7

---

### FASE 1: Database Design & Verification (12-15 commits)

```
6. feat(db): create usuarios table with UUID PK
7. feat(db): create categorias table
8. feat(db): create tareas table (core entity)
9. feat(db): create etiquetas table
10. feat(db): create tarea_etiquetas junction table
11. feat(db): create audit_logs table (for P2)
12. feat(db): create notificaciones table (for P1)
13. feat(db): create notificacion_preferencias table (for P1)
14. feat(db): create tarea_permisos table (for P3)
15. feat(db): create tarea_comentarios table (for P3)
16. feat(db): create seed script - usuarios
17. feat(db): create seed script - categorias
18. feat(db): create seed script - tareas (500+ records)
19. feat(db): create seed script - etiquetas
20. feat(db): create comprehensive seed runner script
```

**Cumulative:** 20

---

### FASE 2: Analytics BI Queries (P5) (12-15 commits)

```
21. feat(analytics): implement Q1 - user participation
22. feat(analytics): implement Q2 - completion rate trends
23. feat(analytics): implement Q3 - category performance
24. feat(analytics): implement Q4 - productivity patterns
25. feat(analytics): implement Q5 - overdue tasks
26. feat(analytics): implement Q6 - tag statistics
27. feat(analytics): implement Q7 - user retention
28. feat(analytics): implement Q8 - priority distribution
29. feat(analytics): implement Q9 - seasonal trends
30. feat(analytics): implement Q10 - user benchmarking
31. perf(analytics): optimize indexes for queries
32. test(analytics): comprehensive query performance tests
33. docs(analytics): document all 10 queries
```

**Cumulative:** 33

---

### FASE 3: Autenticación (15-18 commits)

```
34. feat(auth): password hashing with bcrypt utility
35. feat(auth): JWT token generation service
36. feat(auth): authentication middleware
37. feat(api): POST /auth/register endpoint
38. feat(api): POST /auth/login endpoint
39. feat(api): POST /auth/refresh endpoint
40. feat(api): POST /auth/logout endpoint
41. test(auth): auth service unit tests
42. test(auth): auth endpoints integration tests
43. feat(auth): create AuthContext with TypeScript
44. feat(auth): create useAuth custom hook
45. feat(ui): create LoginForm component
46. feat(ui): create RegisterForm component
47. feat(ui): create ProtectedRoute wrapper
48. test(auth): AuthContext and components tests
```

**Cumulative:** 48

---

### FASE 4: CRUD Tareas (15-18 commits)

```
49. feat(todos): create TodoService
50. feat(api): POST /todos (create)
51. feat(api): GET /todos (list with pagination)
52. feat(api): GET /todos/:id (get single)
53. feat(api): PUT /todos/:id (update)
54. feat(api): PATCH /todos/:id/complete (toggle)
55. feat(api): DELETE /todos/:id (soft delete)
56. test(todos): service unit tests
57. test(todos): endpoints integration tests
58. feat(ui): create TodoList component
59. feat(ui): create TodoForm component
60. feat(ui): create TodoItem component
61. feat(hooks): create useTodos hook
62. feat(ui): implement pagination controls
63. test(todos): component tests
```

**Cumulative:** 63

---

### FASE 5: Categorías & Etiquetas (12-15 commits)

```
64. feat(categories): create CategoryService
65. feat(api): category CRUD endpoints
66. feat(tags): create TagService
67. feat(api): tag CRUD endpoints
68. feat(todos): add category relationships
69. feat(todos): add tag M:M relationships
70. test(categories): category tests
71. test(tags): tag tests
72. feat(ui): create CategoryManager component
73. feat(ui): create TagManager component
74. feat(ui): update TodoForm with category/tags
75. test(categories-tags): component tests
```

**Cumulative:** 75

---

### FASE 6: Filtrado Multidimensional (18-22 commits)

```
76. feat(todos): create dynamic query builder
77. feat(todos): add filter validation with Zod
78. feat(todos): implement priority filter
79. feat(todos): implement completion status filter
80. feat(todos): implement date range filter
81. feat(todos): implement category filter
82. feat(todos): implement tag filter
83. feat(todos): implement sorting
84. feat(todos): implement text search
85. feat(db): add composite indexes for queries
86. feat(cache): implement Redis caching for queries
87. perf(todos): profile and optimize slow queries
88. test(filtering): comprehensive filter tests
89. feat(ui): create FilterPanel component
90. feat(ui): create SearchBar component
91. feat(hooks): create useFilters hook
92. feat(ui): integrate filters into TodoList
93. test(filtering): UI and state tests
```

**Cumulative:** 93

---

### FASE 7: Testing Completo (15-18 commits)

```
94. test(backend): auth service comprehensive tests
95. test(backend): todos service comprehensive tests
96. test(backend): filtering logic tests
97. ci(github-actions): setup Jest CI pipeline
98. ci(github-actions): setup integration test pipeline
99. test(frontend): auth components tests
100. test(frontend): todo components tests
101. test(frontend): filter components tests
102. test(frontend): hooks comprehensive tests
103. ci(github-actions): setup Vitest CI pipeline
104. test(e2e): user registration flow
105. test(e2e): user login flow
106. test(e2e): CRUD operations flow
107. test(e2e): filtering flow
108. ci(github-actions): setup Playwright E2E pipeline
```

**Cumulative:** 108

---

### FASE 8: Infraestructura + Features Bonus + Polish & QA (30-40 commits)

#### Infrastructure (I1-I3)
```
109. feat(docker): create Dockerfile for backend
110. feat(docker): create Dockerfile for frontend
111. feat(docker): create nginx.conf
112. feat(docker): create docker-compose.yml production
113. chore(docker): create .dockerignore files
114. ci(github-actions): create main CI workflow
115. ci(github-actions): setup lint stage
116. ci(github-actions): setup test stage
117. ci(github-actions): setup build and push stage
118. ci(github-actions): setup deploy to staging
119. feat(logging): integrate Pino logger
120. feat(logging): create Pino configuration
121. feat(metrics): integrate Prometheus
122. feat(metrics): create metrics configuration
123. feat(tracing): integrate Jaeger tracing
124. feat(docker): add observability services to compose
125. feat(grafana): create Grafana dashboards
126. test(observability): logging and metrics tests
```

#### Features Bonus (OBLIGATORIOS)
```
127. feat(todos): implement drag and drop reordering
128. feat(db): add orden field to tareas
129. feat(ui): implement dark mode toggle
130. feat(ui): add dark theme CSS
131. feat(export): implement CSV export
132. feat(export): implement JSON export
133. feat(ui): create export button
134. feat(ui): implement keyboard shortcuts
135. feat(ui): add keyboard shortcuts help modal
136. feat(ui): implement batch selection
137. feat(api): implement batch update endpoint
138. feat(ui): create batch action dropdown
139. feat(offline): implement LocalStorage persistence
140. feat(offline): implement offline indicator
141. test(bonus): UI tests for all features
142. perf(bundle): code splitting and lazy loading
```

#### Documentation & QA
```
143. docs(api): create OpenAPI specification
144. docs(api): setup Swagger UI
145. docs(readme): create comprehensive README
146. docs(setup): create developer setup guide
147. docs(deployment): create deployment guide
148. docs(architecture): create architecture documentation
149. feat(error-handling): improve error messages
150. feat(error-boundaries): add React error boundaries
151. test(lighthouse): run and document Lighthouse audit
152. test(smoke): smoke tests on staging
153. perf(load-test): performance testing results
154. security(audit): OWASP Top 10 audit results
155. test(accessibility): WCAG 2.1 compliance check
156. docs(changelog): create CHANGELOG.md
157. release(version): bump to v1.0.0
158. release(docker): tag and push production images
```

**Cumulative: 140-158 commits**

---

## ✅ MVP v1.0 LISTO EN COMMITS 1-158

**En este punto:**
- ✅ Auth completo
- ✅ CRUD tareas
- ✅ Filtrado avanzado
- ✅ 10 queries analytics
- ✅ Testing >80% coverage
- ✅ Docker + CI/CD
- ✅ Observability completo
- ✅ **Features Bonus todos incluidos**
- ✅ API documentada
- ✅ v1.0.0 lista para release

**Timeline:** 8-9 semanas
**Status:** 🎉 **PRODUCTO COMPLETO Y LISTO**

---

## 🎁 COMMITS OPCIONALES (43-55) - SI DA TIEMPO

### FASE OPT-1: Notificaciones (P1) (15-20 commits)

```
159. feat(notifications): create NotificationService
160. feat(api): notification endpoints (GET, POST, PATCH, DELETE)
161. feat(api): notification preferences endpoints
162. feat(notifications): implement WebSocket events
163. feat(notifications): cron job for task vencimiento
164. feat(notifications): email digest worker with Bull
165. feat(notifications): Nodemailer configuration
166. feat(notifications): trigger on task share
167. test(notifications): service tests
168. feat(ui): create NotificationBell component
169. feat(ui): create NotificationCenter component
170. feat(ui): create NotificationPreferences component
171. feat(ui): implement Toast notifications
172. feat(websocket): setup Socket.io notifications
173. test(notifications): UI tests
```

**Cumulative: 173**

---

### FASE OPT-2: Auditoría (P2) (8-10 commits)

```
174. feat(audit): create AuditMiddleware
175. feat(audit): integrate audit into all CRUD
176. feat(api): audit log endpoints
177. test(audit): middleware tests
178. feat(ui): create ChangeHistory component
179. feat(ui): integrate ChangeHistory into TodoItem
180. test(audit): UI tests
181. docs(audit): audit logging documentation
```

**Cumulative: 181**

---

### FASE OPT-3: Colaboración (P3) (20-25 commits)

```
182. feat(collaboration): create permission checking middleware
183. feat(api): share task endpoint
184. feat(api): get/update/delete permissions endpoints
185. feat(api): comment CRUD endpoints
186. feat(collaboration): add assignment support
187. test(collaboration): middleware tests
188. test(collaboration): endpoint tests
189. feat(websocket): implement collaborative editing
190. feat(websocket): implement multi-tab sync (BroadcastChannel)
191. feat(notifications): trigger on task share
192. feat(ui): create ShareTaskModal component
193. feat(ui): create PermissionsList component
194. feat(ui): create CommentSection component
195. feat(hooks): create useTaskPermissions hook
196. feat(hooks): create useComments hook
197. feat(websocket): setup connection management
198. feat(hooks): create useTaskUpdates hook
199. feat(ui): integrate real-time updates
200. feat(ui): implement multi-tab sync
201. test(collaboration): UI tests
202. test(collaboration): real-time update tests
```

**Cumulative: 202**

---

## 📊 Resumen Total de Commits

```
CRÍTICOS (MVP v1.0):
  Fase 0: Setup                  5-7 commits
  Fase 1: DB Design & Verify    12-15 commits
  Fase 2: Analytics (P5)        12-15 commits
  Fase 3: Auth                  15-18 commits
  Fase 4: CRUD Tareas           15-18 commits
  Fase 5: Categorías & Tags     12-15 commits
  Fase 6: Filtrado              18-22 commits
  Fase 7: Testing               15-18 commits
  Fase 8: Infra + Bonus + QA    30-40 commits
  ───────────────────────────────────────
  TOTAL CRÍTICOS:              140-160 commits ✅

OPCIONALES (Si da tiempo):
  OPT-1: Notificaciones (P1)    15-20 commits
  OPT-2: Auditoría (P2)          8-10 commits
  OPT-3: Colaboración (P3)      20-25 commits
  ───────────────────────────────────────
  TOTAL OPCIONALES:             43-55 commits

MÁXIMO POSIBLE:                183-215 commits
```

---

## 🎯 Puntos de Release

### Release v1.0.0 (Commits 1-158)
**Cuándo:** Fin Semana 8
**Qué tienes:** MVP completo + Features Bonus + Infraestructura
**Status:** 🎉 **PRODUCTO LISTO PARA PRODUCCIÓN**

### Release v1.1.0 (Commits 1-173)
**Cuándo:** Fin Semana 9 (si hay tiempo)
**Qué tienes:** + Notificaciones (P1)
**Status:** Premium features

### Release v1.2.0 (Commits 1-181)
**Cuándo:** Fin Semana 10 (si hay tiempo)
**Qué tienes:** + Auditoría (P2)
**Status:** Audit-ready

### Release v1.3.0 (Commits 1-202)
**Cuándo:** Fin Semana 11 (si hay tiempo)
**Qué tienes:** + Colaboración (P3)
**Status:** Fully collaborative

---

## 💡 Estrategia de Commits

### MVP First (Commits 1-158)
- Enfoque en core funcional
- Features Bonus incluidos como requerimiento
- No se negocia con v1.0
- Release garantizado en semana 8

### Propuestas Opcionales (Commits 159-202)
- Solo si v1.0 está completo
- Agregadas secuencialmente: P1 → P2 → P3
- Cada una es un release separado
- No bloquean v1.0

---

## 🚀 Uso Práctico

### Semanas 1-8: Commits 1-158
```bash
# Empieza
git checkout -b develop

# Sigue fases 0-8 en orden
# Cada fase = múltiples feature branches

# Semana 8: Release v1.0.0
git tag v1.0.0
git push origin v1.0.0
```

### Semana 9+ (Si hay tiempo): Commits 159-202
```bash
# Opción 1: Solo notificaciones
# Commits 159-173 → Release v1.1.0

# Opción 2: Notif + Auditoría
# Commits 159-181 → Release v1.2.0

# Opción 3: Todo
# Commits 159-202 → Release v1.3.0
```

---

**Plan Commits v2.1 CORRECTO Completo**
**MVP Crítico: 140-160 commits (8-9 semanas)**
**Propuestas Opcionales: +43-55 commits (3-4 semanas)**
**Status:** ✅ Listo para Implementación
