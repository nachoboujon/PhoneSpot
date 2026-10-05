# Scripts auxiliares

- `tests/`: diagnósticos manuales. Algunos usan servicios externos, correo temporal o Supabase; revisá el archivo antes de ejecutarlo.
- `maintenance/`: parches puntuales usados durante la evolución del proyecto. No son parte del arranque ni del despliegue y deben tratarse como material histórico.

Para comprobaciones seguras de sintaxis usá `npm test` desde la raíz.

Las pruebas aisladas de recordatorios están documentadas en `../docs/cart-reminders.md`: `test:cart-reminders`, `test:cart-reminders-sql` y `test:cart-reminders-ui`. No envían correos ni escriben en Supabase.

## Auditoría local

- `npm run test:api`: validaciones del servidor con Supabase simulado y correo en memoria. No escribe en servicios externos.
- `npm run test:storefront`: revisión de páginas a 1440 y 390 píxeles. Requiere el servidor local iniciado con `npm start`; lee el catálogo público y simula carrito, usuarios, pedidos y cambios del administrador. Guarda resultados y capturas en `artifacts/audit/storefront-2026-10-01/`.
- `AUDIT_ROUTES` permite limitar la revisión del navegador a rutas separadas por comas; los resultados parciales se guardan aparte.

`test:purchase-flow` y `test:supabase` modifican datos. Se bloquean por defecto: requieren `ALLOW_DATABASE_MUTATIONS=1`, `TEST_SUPABASE_URL` distinto del proyecto habitual y `TEST_SUPABASE_SERVICE_ROLE_KEY`. Usarlos únicamente contra una base de prueba preparada para eso.

Los antiguos diagnósticos de galerías de iPhone tienen expectativas anteriores al filtrado por color y no aíslan todas las llamadas de escritura; no forman parte de esta auditoría segura.
