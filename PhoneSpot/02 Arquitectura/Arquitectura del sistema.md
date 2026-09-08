---
tags: [arquitectura]
---

# Arquitectura del sistema

```text
Navegador
  └─ public/ (HTML + CSS + JavaScript)
       └─ /api/*
            └─ server.js (Express)
                 ├─ Supabase Postgres
                 ├─ Supabase Storage
                 ├─ Resend o SMTP
                 └─ servicios externos de cotización y logística
```

## Capas

| Capa | Responsabilidad | Fuente |
| --- | --- | --- |
| Interfaz | Páginas públicas y administrativas | `public/` |
| API | Reglas de negocio, auth, correo y SEO | `server.js` |
| Datos | Productos, usuarios, órdenes y eventos | Supabase |
| Operación | Variables, despliegue y diagnósticos | `.env`, `database/`, `scripts/` |

## Puentes importantes

- [[Frontend]] consume [[API HTTP]].
- [[API HTTP]] protege operaciones con [[03 Dominios/Autenticación|autenticación]] y persiste en [[04 Datos/Base de datos|Supabase]].
- [[03 Dominios/Pedidos y checkout|Pedidos]] combina productos, envío, correo y WhatsApp.
- [[05 Operación/Despliegue|Despliegue]] entrega frontend y backend en un mismo servicio.

## Relacionado

- [[06 Decisiones/ADR-001 Arquitectura actual]]
- [[05 Operación/Variables de entorno]]
