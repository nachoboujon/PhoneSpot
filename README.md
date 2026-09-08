# PhoneSpot

Tienda web de tecnología. El backend es Node.js/Express, el frontend son archivos estáticos y la persistencia se realiza con Supabase.

## Inicio rápido

1. Copiá `.env.example` a `.env` y completá las variables requeridas.
2. Instalá dependencias con `npm install`.
3. Ejecutá `npm start`.
4. Abrí `http://localhost:3000`.

Antes de conectar una base existente, aplicá `database/migrations/migration_schema_sync.sql` desde el SQL Editor de Supabase. Para el despliegue productivo, consultá [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md).

## Estructura

```text
public/                 Frontend: páginas HTML, estilos, JavaScript y recursos estáticos
server.js               API Express, autenticación, pedidos, correo, SEO y envíos
database/
  schema.supabase.sql   Esquema inicial para Supabase
  migrations/           Cambios incrementales e idempotentes del esquema
  legacy/               Esquema histórico MySQL; no usar con Supabase
scripts/
  tests/                Pruebas y diagnósticos manuales
  maintenance/          Scripts históricos de parche; no se ejecutan en producción
artifacts/audit/        Capturas de verificaciones visuales
PhoneSpot/              Bóveda de documentación de Obsidian
```

## Verificación

```bash
npm test
```

Los comandos `npm run test:purchase-flow` y `npm run test:supabase` pueden consultar o modificar datos de Supabase; usalos únicamente contra un entorno de prueba.

## Convenciones

- Las variables sensibles permanecen solo en `.env`; ese archivo no se versiona.
- Las migraciones nuevas van en `database/migrations/` con un nombre descriptivo.
- Los cambios permanentes se hacen en el código fuente. Los scripts de `scripts/maintenance/` son referencia histórica.
