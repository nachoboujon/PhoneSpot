# Base de datos

- `schema.supabase.sql`: esquema base para una instalación nueva en Supabase.
- `migrations/`: migraciones para actualizar bases ya existentes. Aplicalas según su propósito; `migration_schema_sync.sql` es la migración de alineación principal y es idempotente.
- `legacy/database.mysql.sql`: esquema MySQL anterior, conservado solo como referencia. La aplicación actual usa Supabase/Postgres.

No guardes credenciales ni exportaciones reales de producción en esta carpeta.

Los recordatorios de carrito agregan una migración creada por la CLI en `../supabase/migrations/20261005150722_cart_expiry_reminders.sql`. Ver activación y pruebas en `../docs/cart-reminders.md`; no mezclar automáticamente el historial nuevo con las migraciones anteriores.
