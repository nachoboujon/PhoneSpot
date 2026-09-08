---
tags: [operacion, configuracion]
---

# Variables de entorno

La plantilla vive en `.env.example`; los valores reales solo deben existir en `.env` o en el proveedor de despliegue.

## Grupos

- Aplicación: `NODE_ENV`, `PORT`, `CORS_ORIGINS`.
- Supabase: `SUPABASE_URL`, `SUPABASE_KEY` o `SUPABASE_SERVICE_ROLE_KEY`.
- Seguridad: `JWT_SECRET`, `ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`.
- Correo: `RESEND_API_KEY` y `EMAIL_FROM`, o configuración SMTP.
- Operación: `ORDER_NOTIFICATION_EMAIL`, `DOLLAR_RATE`.

## Relacionado

- [[02 Arquitectura/API HTTP]]
- [[Autenticación]]
- [[Despliegue]]
# Seguridad de variables

`PUBLIC_APP_URL` define el dominio canónico usado por los correos de verificación y recuperación; para producción debe ser `https://www.phonespot.site`.

`JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, claves SMTP y `RESEND_API_KEY` son secretos de servidor y sólo deben existir en Railway o en el archivo local `.env` ignorado por Git.
