---
tags: [datos, supabase]
---

# Base de datos

Supabase/Postgres persiste usuarios, productos, pedidos, líneas de pedido, reseñas, alertas de stock y eventos de sitio.

## Fuentes de verdad

- Esquema inicial: `database/schema.supabase.sql`.
- Actualizaciones: `database/migrations/`.
- Alineación de una instalación existente: `migration_schema_sync.sql`.

## Entidades conectadas

- [[03 Dominios/Autenticación|Usuarios]] crean [[03 Dominios/Pedidos y checkout|pedidos]].
- Los pedidos contienen productos y variantes de [[03 Dominios/Catálogo y productos|catálogo]].
- Las reseñas están ligadas a compras confirmadas.
- Los eventos alimentan [[Analítica]].

## Relacionado

- [[Settings y archivos]]
- [[05 Operación/Despliegue]]
- [[05 Operación/Pruebas y calidad]]
