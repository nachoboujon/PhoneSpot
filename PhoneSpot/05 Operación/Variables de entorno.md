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
