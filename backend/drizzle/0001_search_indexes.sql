CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_tareas_titulo_trgm" ON "tareas" USING gin ("titulo" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_tareas_descripcion_trgm" ON "tareas" USING gin ("descripcion" gin_trgm_ops);
