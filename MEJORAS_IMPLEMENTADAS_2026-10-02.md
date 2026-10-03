# Mejoras implementadas en PhoneSpot

Trabajo iniciado el 2 de octubre de 2026 y cerrado el 3 de octubre. Se conservaron los cambios previos del espacio de trabajo.

## Experiencia de compra

- Instagram y WhatsApp siguen flotando. Usan gris grafito y blanco; en celulares tienen un espacio lateral reservado para evitar cubrir tarjetas y controles de compra.
- Portada más compacta en celular, categorías ampliadas y productos antes de preguntas frecuentes. Cabecera adaptada a 360 y 390 píxeles.
- Buscador con coincidencias sin tildes, varias palabras, navegación por teclado y acceso a todos los resultados. Comparte la descarga del catálogo.
- Catálogo con precio mínimo/máximo, disponibilidad, capacidad y RAM. Filtros persistentes en la URL y carga progresiva de 24 productos.
- Ficha con variantes antes de la compra, cantidad seleccionable, referencia en USD, precios por volumen y formulario para agregar distintas configuraciones.
- Checkout como invitado, borrador de formulario y recuperación de pedidos ante respuestas perdidas. La confirmación conserva el enlace de coordinación por WhatsApp.
- Historial con importes registrados y opción de volver a pedir, sujeta al precio y stock actuales.

## Integridad y rendimiento

- Precio, descuentos y envío se validan en el servidor. Se mantienen los niveles existentes de descuento: 3, 5 y 10 equipos.
- Creación de pedidos y consumo de reservas en una transacción. Reintentar el mismo pedido usa una clave para evitar duplicados.
- Cancelación con reposición de stock una sola vez para los pedidos creados con el nuevo mecanismo. Se restringen transiciones de estado.
- Restablecimiento de contraseña de un solo uso con revocación de sesiones anteriores.
- Código de administración separado de la tienda. Datos estructurados y enlaces de productos conservan el tipo comercial y la variante seleccionada.
- Medición de LCP, INP y CLS por dispositivo, contactos y búsquedas vacías. La consulta de eventos usa como máximo los 10.000 eventos más recientes del período.
- Recursos estáticos con versiones actualizadas para renovar la caché.

## Validación

- Pruebas unitarias de descuentos, búsquedas y datos estructurados; pruebas de API de compra como invitado, precios, envío, reintentos y revocación de sesión.
- Regresión de 20 recorridos, incluida la administración: sin errores JavaScript, desbordamiento horizontal, identificadores duplicados ni imágenes cargadas rotas en los escenarios comprobados.
- Navegador a 1440, 390 y 360 píxeles: portada, catálogo, redes, variantes, cantidad, compra simulada y recuperación de pedido. También se comprobaron los tipos comerciales americano/garantía Apple.
- Compresión, caché y carrusel aprobados. La prueba de transferencia mostró entre 77% y 80% de ahorro por compresión en los recursos principales; no constituye una medición de velocidad real de usuarios.
- Prueba SQL con datos temporales y ROLLBACK: compra atómica, reintento, cancelación, conservación de reserva ante precio inválido y cambio de contraseña.
- Detector de diseño revisado: corregida la jerarquía de títulos del pie del catálogo y simplificada la animación del aviso de cookies. Las animaciones de ancho restantes representan progreso de envío; los avisos estéticos sobre fondos y sombras corresponden al diseño existente y no implican fallas funcionales observadas.

Capturas y resultados: `artifacts/audit/improvements-2026-10-02/`. Ejecutores nuevos: `npm run test:store-unit`, `npm run test:store-api` y `npm run test:store-ui`.

## Estado y límites

El código web está modificado localmente y **no se publicó**. Las migraciones aditivas de integridad y métricas sí se aplicaron al proyecto Supabase de PhoneSpot; su fuente está en `database/migrations/`.

Las pruebas no crearon clientes ni pedidos persistentes ni enviaron correos reales. Los correos y las mutaciones de navegador se simularon. Falta comprobar SMTP y métricas de usuarios después del despliegue; no hay todavía una comparación real antes/después de Core Web Vitals.

Los pedidos históricos no reciben reposición automática de stock, porque no se puede inferir si ya fue contabilizada. Los enlaces anteriores de restablecimiento de contraseña deben solicitarse nuevamente. `public/vendor/web-vitals.js` es una copia local de la dependencia; una actualización de esa dependencia debe actualizar también la copia pública.
