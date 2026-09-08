# Base de datos

- `schema.supabase.sql`: esquema base para una instalación nueva en Supabase.
- `migrations/`: migraciones para actualizar bases ya existentes. Aplicalas según su propósito; `migration_schema_sync.sql` es la migración de alineación principal y es idempotente.
- `legacy/database.mysql.sql`: esquema MySQL anterior, conservado solo como referencia. La aplicación actual usa Supabase/Postgres.

No guardes credenciales ni exportaciones reales de producción en esta carpeta.
