# Auditoría de PhoneSpot — 1 de octubre de 2026

## Resultado y alcance

Se revisaron el servidor Express, frontend compartido, páginas públicas y administración, reservas e integración con Supabase, dependencias, configuración de despliegue y scripts de diagnóstico. Se aplicaron las correcciones locales descritas abajo. Quedan problemas importantes de consistencia de pedidos e inventario; esta revisión no certifica que todos los recorridos posibles estén libres de errores.

La verificación del navegador cubrió 20 escenarios a 1440 × 900 y 390 × 844: inicio, catálogo, producto 73, producto inexistente, carrito, checkout, sesión vencida, perfil normal/error/sesión vencida, comparación, login, registro, recuperación, restablecimiento, garantías, términos, administrador sin acceso/con datos simulados y confirmación de pedido. Se comprobaron también variantes, galerías, descuentos excesivos, favoritos, mensajes y formularios administrativos.

Los datos públicos del catálogo se leyeron del servidor local. Se simularon las escrituras, usuarios, pedidos y carrito en el navegador. Las pruebas del servidor emplearon Supabase simulado y correo en memoria. La revisión del proyecto Supabase y sus funciones fue de lectura: no se crearon pedidos reales, enviaron correos, modificaron productos ni aplicaron migraciones a producción. La lectura del catálogo puede ejecutar la limpieza habitual de reservas ya vencidas del servidor.

## Errores corregidos

| Área | Problema y corrección |
| --- | --- |
| Administración | El HTML de envíos estaba incompleto: faltaban formulario y campo de Correo. Se reconstruyeron y se ubicaron WhatsApp y cupones dentro de su pestaña. |
| Administración | Guardar WhatsApp o cupones invocaba una función fuera de su alcance. Ahora usa el guardado disponible para esos manejadores. Se probaron altas y guardados con solicitudes simuladas. |
| Administración | La navegación dependía de un `event` implícito. Ahora recibe el evento explícitamente y activa correctamente las cinco pestañas. |
| Envíos | Valores configurados en cero se reemplazaban por precios predeterminados al cargar o guardar. Se respeta cero tanto en frontend como en servidor. |
| Producto | El cálculo de envío utilizaba el precio general aunque se eligiera una variante diferente. Ahora utiliza el precio seleccionado. |
| Checkout | Un cupón mayor que el subtotal podía producir un importe negativo en pantalla. Se limita el descuento al subtotal y los porcentajes al rango válido. |
| Favoritos | “Agregar” no contenía los datos ni la variante necesarios. Ahora conduce a la ficha para seleccionar y comprar el producto correcto. |
| Sesiones | Checkout no trataba correctamente una sesión vencida. Ahora limpia las credenciales vencidas y conduce al login. |
| Perfil | Un error de red o servidor cerraba la sesión. Ahora se conserva y se muestra el error; únicamente un 401 invalida la sesión. |
| Historial | Totales guardados en dólares se mostraban con un `$` ambiguo. Ahora se identifica explícitamente USD. |
| Confirmación | Se interpretaba información de la URL como HTML y se aceptaba un enlace arbitrario para WhatsApp. Se validan identificador, importe y enlace HTTPS de `wa.me`. |
| Confirmación | El texto sugería pago confirmado y la redirección automática interrumpía la coordinación. Ahora informa “Pedido registrado” y permite permanecer en la página. Se corrigió además contraste visual. |
| Mensajes | Los toast y la confirmación de registro interpretaban contenido variable como HTML. Se muestra como texto o se escapa. |
| Catálogo | Se mostraba una valoración fija sin respaldo y quedaba código de valoraciones aleatorias. Se retiró. |
| API | Consultar un producto inexistente devolvía 500. Ahora devuelve 404; identificadores inválidos devuelven 400. |
| API | Cantidades fraccionarias se truncaban; las variantes admitían estructuras o valores inválidos. Se validan enteros, stock, precios finitos y estructura antes de escribir. |
| API | JSON inválido y cuerpos demasiado grandes terminaban como errores genéricos. Ahora responden 400 y 413 respectivamente. |
| Correos | Un envío pendiente de coordinación se anunciaba como gratis. Ahora indica “Costo a confirmar”. La caducidad informada del enlace de registro coincide con su hora de vigencia. |
| Reservas | La migración local no incluía la condición en el nombre de variante, aunque la función desplegada sí. Se sincronizó el archivo fuente; no se ejecutó SQL de escritura. |
| SEO | El sitemap incluía productos archivados. Ahora los filtra. |
| Diagnósticos | Dos scripts podían modificar la base habitual. Ahora requieren autorización por variable y credenciales de un proyecto de pruebas distinto. |
| Dependencias | Se actualizaron Multer a 2.4.0 y Nodemailer a 10.0.9. `npm audit` pasó de dos avisos a cero. |

Los avisos de dependencias se contrastaron con las publicaciones de [Multer](https://github.com/advisories/GHSA-3pph-fpjx-jg34) y [Nodemailer](https://github.com/advisories/GHSA-prgh-xp8r-p3m5). La actualización no implica que se haya demostrado explotación en este sitio; por ejemplo, su configuración usa almacenamiento de archivos en memoria.

Las mejoras de ficha de producto y deduplicación de imágenes de la etapa anterior se conservaron y se verificaron: galería del color elegido, imágenes únicas y distribución de escritorio. No se reasignaron imágenes del catálogo durante esta auditoría.

## Problemas pendientes, por prioridad

### Alta: integridad de pedidos y cuentas

1. **Crear pedido y consumir reservas no es una sola transacción.** `server.js` inserta pedido, inserta artículos y luego llama a `consume_cart_reservations` (aproximadamente líneas 1189–1234). Hay borrados compensatorios ante algunos errores, pero una interrupción entre pasos puede dejar datos incompletos. Hace falta una función PostgreSQL transaccional que incluya todo y una clave de idempotencia. Hallazgo por revisión de código y funciones desplegadas; no se provocó una caída contra producción.
2. **Cancelar un pedido no devuelve el inventario.** La ruta de cambio de estado, `server.js:1430`, solo actualiza la orden. La consulta de triggers no encontró uno que compense esta operación. Debe diseñarse una devolución de stock una sola vez, con transiciones válidas y bloqueo transaccional. Aplicarla sin controlar pedidos históricos puede duplicar existencias.
3. **La recuperación de contraseña no consume un token de un solo uso y no revoca sesiones existentes.** Revisar `server.js:829` y el middleware de autenticación. Se necesita persistir y consumir un identificador de recuperación, además de invalidar sesiones al cambiar la contraseña. No se ensayó con cuentas reales.

### Media: importes, contenido y operación

4. **El costo de envío llega del cliente.** `server.js:1088` valida el rango, pero no lo recalcula a partir de una cotización del servidor. Para modalidades con precio fijo debe derivarse del método/destino o de una cotización verificable. La modalidad “a coordinar” necesita mantenerse explícita.
5. **Falta conservar el importe histórico en pesos y su cotización.** La orden persiste `total` en USD; `total_ars` y `dollar_rate` se calculan para la respuesta, pero no se guardan. Mostrar USD corrige la ambigüedad, pero no permite reconstruir el importe original en pesos. Agregar ambos campos en una migración.
6. **Persisten inserciones de contenido del catálogo con `innerHTML`.** Se corrigieron toast, registro y recibo, pero nombres/descripciones y otras plantillas necesitan una revisión sistemática de escape. Definir primero si las descripciones permiten HTML y, en ese caso, sanitizarlo mediante una lista permitida.
7. **Los límites de solicitudes mantienen mapas en memoria sin purga global.** `rateLimitBuckets` y `analyticsRateBuckets` conservan claves antiguas y no comparten límites entre instancias. Incorporar limpieza y almacenamiento compartido si el despliegue tiene varias instancias.
8. **El stock visible en la ficha puede quedar desactualizado después de reservar.** La actualización de stock visible está ligada al catálogo. El servidor sigue siendo la autoridad y puede rechazar con 409; la ficha debería actualizar su disponibilidad tras una reserva.

### Condicionales y verificaciones adicionales

- `vercel.json` dirige las rutas API al servidor y el resto a archivos estáticos. Si se usa Vercel, revisar que sitemap y renderizado de metadatos de productos pasen por Express. El despliegue documentado actual es Railway.
- Los datos estructurados declaran siempre `NewCondition` (`server.js:222`). Representar la condición real cuando esté definida, sin inferirla del nombre comercial.
- Investigar clics rápidos simultáneos al agregar al carrito: el cálculo de cantidad a partir del estado anterior puede perder incrementos. Es una hipótesis de concurrencia, pendiente de reproducción controlada.
- Los diagnósticos antiguos de galerías esperan cantidades anteriores al filtrado por color y no aíslan todas las escrituras. Se documentó que no deben usarse como comprobación segura actual.

Estos puntos estructurales no se modificaron en la base activa. Necesitan migraciones, datos de prueba y casos de concurrencia/cancelación antes de considerarlos corregidos.

## Evidencia y comandos

- `npm test`: sintaxis de servidor y frontend, aprobado.
- `npm run test:api`: validaciones de API, precios de envío cero y renderizado de correo, aprobado sin escrituras externas.
- `npm run test:storefront`: 20 escenarios revisados, sin errores JavaScript capturados, desbordamiento horizontal, identificadores duplicados ni imágenes cargadas rotas en los estados comprobados; referencias locales HTML sin recursos faltantes.
- Revisión adicional de administración después de su corrección: cinco pestañas y guardados simulados de envío, WhatsApp y cupón, aprobados.
- `npm audit`: cero avisos al cerrar la revisión. Informes anterior y posterior en `artifacts/audit/`.
- `git diff --check`: sin errores de espacios en los cambios.

Resultados y capturas: `artifacts/audit/storefront-2026-10-01/results.json`, `results-focused.json` y archivos PNG de esa carpeta. Instrucciones de pruebas seguras en `scripts/README.md`.

La inspección de Supabase confirmó RLS en las tablas revisadas. La ausencia de políticas públicas en `cart_reservations` es coherente con el acceso reservado al servidor; no se abrió esa tabla a usuarios anónimos.

## Diseño y límites

Se registró en Impeccable una excepción limitada al aviso `clipped-overflow-container` de `public/admin.html`: el recorte de la raíz corresponde a paneles laterales cerrados fuera de pantalla, y los controles y pestañas se comprobaron en ambos tamaños. Las demás reglas siguen activas.

En la revisión final del detector se eliminó la tarjeta anidada del formulario de variantes del administrador: se reemplazó por una sección con separador. Se registraron excepciones limitadas para Inter en producto, administración y confirmación, manteniendo la tipografía compartida según el pedido de coherencia con el sitio; Arial y Helvetica en `server.js` se conservaron por compatibilidad de las plantillas de correo. También se exceptuó el recorte intencional de paneles cerrados en producto, verificado en ambos tamaños. Las demás reglas siguen activas.

Las pruebas de navegador con respuestas simuladas no sustituyen una compra real ni verifican entrega de correo, OAuth de Google, concurrencia de PostgreSQL, proveedores de envío o despliegue remoto. Los cambios están en el espacio local, sin publicación ni migraciones de producción.
