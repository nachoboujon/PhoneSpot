# Proyecto PhoneSpot

## Vista general

Tienda web de tecnología con frontend estático, API Node.js/Express y base de datos Supabase.

## Dónde está cada cosa

- [[00 Inicio|Centro de proyecto]]
- La guía técnica principal está en `../README.md`.
- `public/`: páginas, estilos, JavaScript e imágenes públicas.
- `server.js`: servidor y API.
- `database/`: esquema y migraciones de Supabase.
- `scripts/tests/`: pruebas y diagnósticos manuales.
- `scripts/maintenance/`: parches históricos; no se ejecutan automáticamente.
- `artifacts/audit/`: capturas de pruebas visuales.

## Trabajo diario

1. Para levantar el sitio: `npm start`.
2. Para comprobar sintaxis: `npm test`.
3. Para desplegar: consultar `DEPLOY_RAILWAY.md`.

## Notas importantes

- Las credenciales están en `.env` y no se suben al repositorio.
- Antes de actualizar una base existente, revisar `database/migrations/migration_schema_sync.sql`.
- La configuración de la tienda se lee desde Supabase Storage y tiene una copia pública en `public/data/settings.json`.
