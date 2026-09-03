CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"nombre_completo" varchar(255),
	"foto_perfil_url" varchar(500),
	"ultimo_acceso" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"color" varchar(7) DEFAULT '#3498db' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"categoria_id" uuid,
	"titulo" varchar(255) NOT NULL,
	"descripcion" text,
	"prioridad" varchar(20) DEFAULT 'normal' NOT NULL,
	"completada" boolean DEFAULT false NOT NULL,
	"fecha_vencimiento" timestamp with time zone,
	"completada_en" timestamp with time zone,
	"posicion" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chk_tareas_prioridad" CHECK ("tareas"."prioridad" in ('baja', 'normal', 'alta', 'urgente'))
);
--> statement-breakpoint
CREATE TABLE "etiquetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#95a5a6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tarea_etiquetas" (
	"tarea_id" uuid NOT NULL,
	"etiqueta_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tarea_etiquetas_tarea_id_etiqueta_id_pk" PRIMARY KEY("tarea_id","etiqueta_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"entidad_tipo" varchar(50) NOT NULL,
	"entidad_id" uuid NOT NULL,
	"accion" varchar(20) NOT NULL,
	"cambios_antes" jsonb,
	"cambios_despues" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_audit_logs_accion" CHECK ("audit_logs"."accion" in ('CREATE', 'UPDATE', 'DELETE'))
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tarea_id" uuid,
	"tipo" varchar(50) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"mensaje" text NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"leida_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_notificaciones_tipo" CHECK ("notificaciones"."tipo" in ('tarea_vencida', 'tarea_proxima', 'tarea_compartida', 'comentario', 'sistema'))
);
--> statement-breakpoint
CREATE TABLE "notificacion_preferencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"email_habilitado" boolean DEFAULT true NOT NULL,
	"push_habilitado" boolean DEFAULT true NOT NULL,
	"recordatorio_vencimiento" boolean DEFAULT true NOT NULL,
	"horas_antes_recordatorio" integer DEFAULT 24 NOT NULL,
	"digest_diario" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_notificacion_preferencias_usuario" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE "tarea_permisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarea_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nivel" varchar(20) NOT NULL,
	"concedido_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_tarea_permisos_nivel" CHECK ("tarea_permisos"."nivel" in ('lectura', 'escritura', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "tarea_comentarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarea_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"contenido" text NOT NULL,
	"editado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_etiquetas" ADD CONSTRAINT "tarea_etiquetas_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_etiquetas" ADD CONSTRAINT "tarea_etiquetas_etiqueta_id_etiquetas_id_fk" FOREIGN KEY ("etiqueta_id") REFERENCES "public"."etiquetas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacion_preferencias" ADD CONSTRAINT "notificacion_preferencias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_permisos" ADD CONSTRAINT "tarea_permisos_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_permisos" ADD CONSTRAINT "tarea_permisos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_permisos" ADD CONSTRAINT "tarea_permisos_concedido_por_usuarios_id_fk" FOREIGN KEY ("concedido_por") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_comentarios" ADD CONSTRAINT "tarea_comentarios_tarea_id_tareas_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tareas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarea_comentarios" ADD CONSTRAINT "tarea_comentarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_usuarios_deleted_at" ON "usuarios" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_categorias_usuario_id" ON "categorias" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_categorias_deleted_at" ON "categorias" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categorias_usuario_nombre" ON "categorias" USING btree ("usuario_id","nombre") WHERE "categorias"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_tareas_usuario_completada" ON "tareas" USING btree ("usuario_id","completada");--> statement-breakpoint
CREATE INDEX "idx_tareas_usuario_categoria" ON "tareas" USING btree ("usuario_id","categoria_id");--> statement-breakpoint
CREATE INDEX "idx_tareas_usuario_prioridad_completada" ON "tareas" USING btree ("usuario_id","prioridad","completada");--> statement-breakpoint
CREATE INDEX "idx_tareas_fecha_vencimiento" ON "tareas" USING btree ("fecha_vencimiento");--> statement-breakpoint
CREATE INDEX "idx_tareas_created_at" ON "tareas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tareas_completada_en" ON "tareas" USING btree ("completada_en");--> statement-breakpoint
CREATE INDEX "idx_tareas_deleted_at" ON "tareas" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_etiquetas_usuario_id" ON "etiquetas" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_etiquetas_deleted_at" ON "etiquetas" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_etiquetas_usuario_nombre" ON "etiquetas" USING btree ("usuario_id","nombre") WHERE "etiquetas"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_tarea_etiquetas_etiqueta_id" ON "tarea_etiquetas" USING btree ("etiqueta_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_usuario_id" ON "audit_logs" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entidad" ON "audit_logs" USING btree ("entidad_tipo","entidad_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_notificaciones_usuario_leida" ON "notificaciones" USING btree ("usuario_id","leida");--> statement-breakpoint
CREATE INDEX "idx_notificaciones_created_at" ON "notificaciones" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tarea_permisos_tarea_usuario" ON "tarea_permisos" USING btree ("tarea_id","usuario_id");--> statement-breakpoint
CREATE INDEX "idx_tarea_permisos_usuario_id" ON "tarea_permisos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_tarea_comentarios_tarea_created" ON "tarea_comentarios" USING btree ("tarea_id","created_at");