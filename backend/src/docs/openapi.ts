import { API_PREFIX } from '@todo/shared';

/**
 * Hand-maintained OpenAPI 3.1 description of the public API. Served at
 * `GET /api/v1/openapi.json` and rendered by Swagger UI at `GET /api/docs`.
 */
export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Todo App API',
    version: '1.1.0',
    description:
      'API REST de la aplicación de tareas: autenticación JWT, CRUD de tareas, ' +
      'categorías y etiquetas, filtrado multidimensional, operaciones en lote y exportación.',
  },
  servers: [{ url: API_PREFIX, description: 'Versioned API' }],
  tags: [
    { name: 'auth', description: 'Registro, sesión y perfil' },
    { name: 'tareas', description: 'CRUD, filtros, reorden, lote y exportación' },
    { name: 'categorias', description: 'CRUD de categorías' },
    { name: 'etiquetas', description: 'CRUD de etiquetas' },
    { name: 'estadisticas', description: 'Resumen de estadísticas del usuario' },
    { name: 'health', description: 'Liveness / readiness' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
            },
            required: ['code', 'message'],
          },
        },
        required: ['error'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      UsuarioPublico: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          nombreCompleto: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer', description: 'segundos' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          usuario: { $ref: '#/components/schemas/UsuarioPublico' },
          tokens: { $ref: '#/components/schemas/TokenPair' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 100 },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Al menos una letra y un dígito',
          },
          nombreCompleto: { type: 'string', maxLength: 255 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      CategoriaResumen: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          color: { type: 'string', example: '#3498db' },
        },
      },
      EtiquetaResumen: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          color: { type: 'string' },
        },
      },
      Tarea: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          titulo: { type: 'string' },
          descripcion: { type: 'string', nullable: true },
          prioridad: { type: 'string', enum: ['baja', 'normal', 'alta', 'urgente'] },
          completada: { type: 'boolean' },
          fechaVencimiento: { type: 'string', format: 'date-time', nullable: true },
          completadaEn: { type: 'string', format: 'date-time', nullable: true },
          categoriaId: { type: 'string', format: 'uuid', nullable: true },
          categoria: {
            oneOf: [{ $ref: '#/components/schemas/CategoriaResumen' }, { type: 'null' }],
          },
          etiquetas: { type: 'array', items: { $ref: '#/components/schemas/EtiquetaResumen' } },
          posicion: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CrearTareaInput: {
        type: 'object',
        required: ['titulo'],
        properties: {
          titulo: { type: 'string', minLength: 1, maxLength: 255 },
          descripcion: { type: 'string', nullable: true, maxLength: 5000 },
          prioridad: { type: 'string', enum: ['baja', 'normal', 'alta', 'urgente'] },
          fechaVencimiento: { type: 'string', format: 'date-time', nullable: true },
          categoriaId: { type: 'string', format: 'uuid', nullable: true },
          etiquetaIds: { type: 'array', items: { type: 'string', format: 'uuid' }, maxItems: 20 },
        },
      },
      BatchInput: {
        type: 'object',
        required: ['ids', 'accion'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 200,
          },
          accion: {
            oneOf: [
              {
                type: 'object',
                required: ['tipo', 'completada'],
                properties: {
                  tipo: { const: 'completar' },
                  completada: { type: 'boolean' },
                },
              },
              {
                type: 'object',
                required: ['tipo', 'prioridad'],
                properties: {
                  tipo: { const: 'prioridad' },
                  prioridad: { type: 'string', enum: ['baja', 'normal', 'alta', 'urgente'] },
                },
              },
              {
                type: 'object',
                required: ['tipo'],
                properties: {
                  tipo: { const: 'categoria' },
                  categoriaId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
              {
                type: 'object',
                required: ['tipo'],
                properties: { tipo: { const: 'eliminar' } },
              },
            ],
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Falta o es inválido el token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Cuerpo o query inválidos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Crear cuenta',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Cuenta creada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/AuthResponse' } },
                },
              },
            },
          },
          '409': { description: 'Email o usuario ya en uso' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          '200': {
            description: 'Sesión iniciada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/AuthResponse' } },
                },
              },
            },
          },
          '401': { description: 'Credenciales incorrectas' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['auth'],
        summary: 'Renovar tokens (rotación)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Nuevos tokens' },
          '401': { description: 'Refresh inválido' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['auth'],
        summary: 'Cerrar sesión (revoca el access + refresh actuales)',
        responses: {
          '204': { description: 'Sesión cerrada' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['auth'],
        summary: 'Perfil del usuario autenticado',
        responses: {
          '200': {
            description: 'Perfil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/UsuarioPublico' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/tareas': {
      get: {
        tags: ['tareas'],
        summary: 'Listar tareas (paginado, filtrable, ordenable)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          {
            name: 'orden',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['created_at', 'fecha_vencimiento', 'prioridad', 'titulo', 'posicion'],
            },
          },
          { name: 'direccion', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'completada', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'prioridad',
            in: 'query',
            schema: { type: 'string', enum: ['baja', 'normal', 'alta', 'urgente'] },
          },
          { name: 'categoria', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'sinCategoria', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'etiquetas',
            in: 'query',
            description: 'Nombres separados por coma',
            schema: { type: 'string' },
          },
          { name: 'fechaDesde', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'fechaHasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'vencidas', in: 'query', schema: { type: 'boolean' } },
          { name: 'busqueda', in: 'query', schema: { type: 'string', maxLength: 120 } },
        ],
        responses: {
          '200': {
            description: 'Página de tareas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Tarea' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['tareas'],
        summary: 'Crear tarea',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CrearTareaInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Tarea creada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Tarea' } },
                },
              },
            },
          },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/tareas/export': {
      get: {
        tags: ['tareas'],
        summary: 'Exportar tareas (CSV o JSON) respetando los filtros',
        parameters: [
          {
            name: 'formato',
            in: 'query',
            schema: { type: 'string', enum: ['csv', 'json'], default: 'csv' },
          },
        ],
        responses: {
          '200': {
            description: 'Descarga',
            content: { 'text/csv': {}, 'application/json': {} },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/tareas/reorder': {
      patch: {
        tags: ['tareas'],
        summary: 'Persistir el orden manual (lista completa de ids)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: { ids: { type: 'array', items: { type: 'string', format: 'uuid' } } },
              },
            },
          },
        },
        responses: {
          '204': { description: 'Orden guardado' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/tareas/batch': {
      patch: {
        tags: ['tareas'],
        summary: 'Acción en lote sobre varias tareas',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchInput' } } },
        },
        responses: {
          '200': {
            description: 'Nº de tareas afectadas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { afectadas: { type: 'integer' } },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/tareas/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['tareas'],
        summary: 'Obtener una tarea',
        responses: {
          '200': {
            description: 'Tarea',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/Tarea' } },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['tareas'],
        summary: 'Actualizar una tarea (campos parciales)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CrearTareaInput' } },
          },
        },
        responses: {
          '200': { description: 'Tarea actualizada' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['tareas'],
        summary: 'Eliminar (soft-delete) una tarea',
        responses: {
          '204': { description: 'Eliminada' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/tareas/{id}/completar': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['tareas'],
        summary: 'Marcar completada / pendiente (sin cuerpo → alterna)',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { completada: { type: 'boolean' } } },
            },
          },
        },
        responses: { '200': { description: 'Tarea actualizada' } },
      },
    },
    '/categorias': {
      get: {
        tags: ['categorias'],
        summary: 'Listar categorías',
        responses: { '200': { description: 'Lista' } },
      },
      post: {
        tags: ['categorias'],
        summary: 'Crear categoría',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre'],
                properties: {
                  nombre: { type: 'string', maxLength: 100 },
                  descripcion: { type: 'string', nullable: true },
                  color: { type: 'string', example: '#3498db' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Creada' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/categorias/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['categorias'],
        summary: 'Obtener categoría',
        responses: {
          '200': { description: 'Categoría' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['categorias'],
        summary: 'Actualizar categoría',
        responses: { '200': { description: 'Actualizada' } },
      },
      delete: {
        tags: ['categorias'],
        summary: 'Eliminar categoría',
        responses: { '204': { description: 'Eliminada' } },
      },
    },
    '/etiquetas': {
      get: {
        tags: ['etiquetas'],
        summary: 'Listar etiquetas',
        responses: { '200': { description: 'Lista' } },
      },
      post: {
        tags: ['etiquetas'],
        summary: 'Crear etiqueta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre'],
                properties: {
                  nombre: { type: 'string', maxLength: 50 },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Creada' }, '409': { description: 'Nombre duplicado' } },
      },
    },
    '/etiquetas/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['etiquetas'],
        summary: 'Obtener etiqueta',
        responses: {
          '200': { description: 'Etiqueta' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['etiquetas'],
        summary: 'Actualizar etiqueta',
        responses: { '200': { description: 'Actualizada' } },
      },
      delete: {
        tags: ['etiquetas'],
        summary: 'Eliminar etiqueta',
        responses: { '204': { description: 'Eliminada' } },
      },
    },
    '/estadisticas': {
      get: {
        tags: ['estadisticas'],
        summary: 'Resumen de estadísticas del usuario autenticado',
        parameters: [
          {
            name: 'dias',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 7, maximum: 90, default: 14 },
            description: 'Tamaño de la ventana de la serie diaria de actividad',
          },
        ],
        responses: {
          '200': {
            description:
              'Totales, tasa de completado, desglose por prioridad/categoría y actividad diaria',
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Liveness',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['health'],
        summary: 'Readiness (Postgres + Redis)',
        security: [],
        responses: { '200': { description: 'Listo' }, '503': { description: 'Degradado' } },
      },
    },
  },
} as const;
