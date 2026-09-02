# Publicar PhoneSpot en Railway

1. Ejecuta `migration_schema_sync.sql` en el SQL Editor de Supabase.
2. Crea un servicio desde este repositorio en Railway. El comando de inicio es `npm start`; Railway asigna `PORT` automáticamente.
3. Configura estas variables en Railway:

   - `NODE_ENV=production`
   - `SUPABASE_URL` y `SUPABASE_KEY`
   - `JWT_SECRET` (un valor largo, aleatorio y privado)
   - `ADMIN_EMAIL`
   - `ORDER_NOTIFICATION_EMAIL` (correo que recibe cada pedido; si se omite se usa `ADMIN_EMAIL`)
   - `DOLLAR_RATE` (cotización usada para convertir los precios USD del catálogo a ARS)
   - Correo: usa **una** alternativa:
     - Resend: `RESEND_API_KEY` y `EMAIL_FROM` (por ejemplo, `PhoneSpot <ventas@phonespot.site>`)
     - Brevo SMTP: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER`, `SMTP_PASS` y opcionalmente `EMAIL_FROM`.

4. Si el frontend queda servido por este mismo servicio, no configures `CORS_ORIGINS`. Si lo alojas en otro dominio, define `CORS_ORIGINS` con ese origen exacto, por ejemplo `https://tienda.ejemplo.com`.
5. Abre la URL pública de Railway y registra una cuenta de prueba. Debe llegar el correo de verificación antes de poder completar el recorrido de usuario.

No se usan Vercel ni Mercado Pago. Al aceptar un pedido, el sitio crea el pedido, envía las notificaciones por correo y redirige al cliente a WhatsApp para coordinar el pago.
