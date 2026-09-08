# Seguridad

## Controles implementados

- Cabeceras HTTP defensivas: CSP, HSTS en producción, anti-clickjacking, `nosniff`, política de referer y permisos del navegador mínimos.
- CORS limitado al dominio público y a los orígenes declarados en `CORS_ORIGINS`.
- Límites de intentos para registro, inicio de sesión, acceso con Google y recuperación de contraseña.
- JWT firmados con HS256, emisor y audiencia definidos; las sesiones vencen en un día por defecto.
- Las contraseñas nuevas deben tener 10 o más caracteres, con letras y números.
- Los enlaces de verificación y recuperación se construyen desde `PUBLIC_APP_URL`, nunca desde la cabecera `Host` de una petición.
- Las cargas de imágenes de administración aceptan únicamente PNG, JPEG y WebP de hasta 5 MB, validando firma binaria y tipo declarado.
- RLS está documentado en [[04 Datos/Base de datos]] y las migraciones de políticas viven en `database/migrations/migration_rls_policies.sql`.

## Operación segura

- Configurar en Railway `PUBLIC_APP_URL=https://www.phonespot.site` y un `JWT_SECRET` aleatorio largo; no reutilizarlo entre proyectos.
- Mantener `SUPABASE_SERVICE_ROLE_KEY`, SMTP y Resend sólo como variables del servidor: jamás en `public/` ni en Git.
- Revisar mensualmente `npm audit` y el Security Advisor de Supabase. Rotar secretos si se sospecha exposición.
- Antes de abrir nuevas tablas al Data API de Supabase, habilitar RLS y diseñar políticas de mínimo privilegio.

## Verificaciones

Después del endurecimiento de septiembre de 2026: `npm audit --omit=dev` no reportó vulnerabilidades y las pruebas de sintaxis y compra controlada pasaron.

Relacionados: [[Autenticación]], [[Variables de entorno]], [[Pruebas y calidad]], [[04 Datos/Base de datos]].
