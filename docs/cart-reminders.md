# Recordatorios de reservas del carrito

El servidor revisa cada minuto las reservas de cuentas registradas asociadas a un carrito. El plazo actual sigue siendo 24 horas; el aviso se prepara cuando faltan 60 minutos, configurable entre 5 y 240 minutos. Puede llegar más tarde si el servidor o el proveedor de correo estuvieron indisponibles. No se envían avisos después del vencimiento.

Se usa el correo de la cuenta del cliente, sin aceptar destinatarios arbitrarios desde el navegador. Los invitados necesitan iniciar sesión para vincular el carrito. El registro actual confirma el correo mediante enlace o Google; no existe una columna independiente de verificación para cuentas históricas.

El mensaje enumera los productos próximos a vencer y permite recuperar el carrito desde otro dispositivo, iniciando sesión con la misma cuenta. El enlace vence con la primera reserva. La casilla del carrito permite desactivar el recordatorio y la sincronización automática respeta esa preferencia.

## Activación

1. Aplicar una sola vez `supabase/migrations/20261005150722_cart_expiry_reminders.sql` al mismo proyecto usado por el servidor, mediante una migración revisada. Fue creada con `supabase migration new`. No ejecutar `db push` indiscriminadamente sobre la base existente: el proyecto también tiene migraciones históricas en `database/migrations`.
2. Validar Resend o SMTP y el remitente. La verificación local anterior devolvió `EAUTH` para SMTP; las credenciales de producción no se comprobaron. No activar hasta corregir y probar el proveedor.
3. Configurar `PUBLIC_APP_URL` con el dominio HTTPS público, `JWT_SECRET`, `CART_REMINDER_LEAD_MINUTES=60` y `CART_REMINDERS_ENABLED=true` en el hosting, y desplegar el código.
4. Railway con un proceso persistente inicia automáticamente el chequeo al arrancar. En hosting sin proceso persistente, configurar un scheduler que haga POST a `/api/internal/cart-reminders` cada minuto, con `Authorization: Bearer <CART_REMINDER_CRON_SECRET>`. El secreto debe tener al menos 32 caracteres; no se publica en el frontend. Sin scheduler externo, la modalidad serverless no envía recordatorios automáticamente.
5. Validar con una cuenta de prueba y una reserva de prueba antes de habilitar envíos a clientes. Confirmar recepción, recuperación del carrito y ausencia de un segundo aviso. Los tests del repositorio no envían mensajes reales.

Por defecto la función está desactivada. Cambiar `CART_REMINDERS_ENABLED=false` y reiniciar desactiva el proceso y oculta la preferencia de correo.

## Entrega y límites

Las reservas retiradas, compradas, vencidas o de productos archivados se excluyen. Se agrupan los productos que entran en la ventana del aviso; cada reserva entregada queda marcada. Los errores se reintentan después de cinco minutos conservando el contenido y la identidad del envío. Una concesión de diez minutos y bloqueos en PostgreSQL impiden que procesos simultáneos reclamen el mismo aviso.

Resend usa una clave de idempotencia estable para los reintentos ([documentación del proveedor](https://resend.com/docs/dashboard/emails/idempotency-keys)). Con SMTP, una caída entre la aceptación del proveedor y el registro en la base puede producir un duplicado. Ningún proveedor confirma que el mensaje llegue a la bandeja de entrada: el estado enviado indica aceptación del envío. Una compra concurrente justo después de la última comprobación también puede cruzarse con el aviso.

Las tablas de destinatarios y entregas son privadas, con RLS y acceso limitado a `service_role`. Las entregas finalizadas se purgan después de 30 días y los contactos sin reservas activas se purgan tras 30 días sin actividad, al procesar la siguiente tanda.

## Pruebas locales

`npm run test:cart-reminders` valida contenido, tokens, reintentos, autenticación, preferencias y endpoint del scheduler con datos simulados. `npm run test:cart-reminders-ui` inicia su servidor estático de prueba y verifica escritorio, móvil y recuperación de carrito. Chrome debe poder ejecutarse.

La migración se prueba en PostgreSQL embebido, sin conexión a Supabase:

```powershell
npm install --prefix .tmp/reminder-test-runtime --no-save --no-package-lock @electric-sql/pglite@0.5.8
npm run test:cart-reminders-sql
```

La dependencia de prueba se instala en `.tmp`, que está ignorada; no se agrega al servidor de producción. También se puede indicar otra ruta de instalación con `PGLITE_MODULE_PATH`.
