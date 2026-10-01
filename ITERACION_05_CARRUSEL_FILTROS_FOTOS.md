# Iteración 05: carrusel, filtros, carrito y fotos por color

## Cambios

- Recuperado el carrusel con tarjetas superpuestas, profundidad y panel translúcido. Se ajustó el encuadre móvil para mostrar el equipo y conservar el enlace al catálogo.
- Filtros con hover neutro, sin desplazamiento ni sombras heredadas de los botones de compra. Las opciones seleccionadas tienen fondo propio y foco visible. Se retiraron las transiciones de altura y padding al plegar los filtros para evitar recalcular el layout durante la animación.
- Cierre de carrito circular de 44 px, sin saltos al pasar el cursor. Su cruz usa SVG y permanece visible sin depender de una fuente externa. Corregido también el color del hover de los controles de cantidad.
- Galería con una foto representativa por color. Cambiar capacidad, batería o condición mantiene esa foto y sigue actualizando precio y stock. Los botones de color muestran su nombre, sin repetir la fotografía; las miniaturas se ocultan cuando existe una sola foto del color seleccionado.
- Eliminada la mezcla de colores de las fotografías del catálogo y detalle para conservar el aspecto original. Se mantienen los banners originales en pantallas de alta densidad y la carga por diapositiva.

## Conversión USD a ARS

Se comprobó el endpoint local `/api/dollar-rate`, que respondió `{ "success": true, "rate": 1565 }`. Durante la revisión, DolarAPI informó venta blue de 1560, actualizada el 1 de octubre de 2026 a las 13:44 UTC: https://dolarapi.com/v1/dolares/blue.

La regla existente del servidor es venta blue + 5, con caché de cinco minutos. El frontend consulta al cargar la página; no hay refresco periódico de cotización en una pestaña que permanece abierta. La prueba verificó que 100 USD se muestran como $156.500 con tasa 1565, y como $166.500 al recargar con tasa 1665. El backend calcula el total del pedido con su propia cotización.

Si la consulta externa falla, el servidor tiene respaldos configurados. No se cambió esta regla ni se modificó el backend. El endpoint publicado en `www.phonespot.site` no fue accesible desde la herramienta web; la comprobación del servidor corresponde al entorno local, no certifica el despliegue.

## Calidad de las imágenes

La inspección encontró fotografías del proveedor de 230 × 230 px. Quitar efectos y evitar fotos repetidas mejora la presentación, pero no recupera detalle ausente. Para lograr fotografías nítidas a mayor tamaño se requieren originales de más resolución del equipo y color correctos. No se fabricaron imágenes de productos ni se aumentó artificialmente su resolución.

## Decisiones y validación

CSS y DOM nativos, sin dependencias nuevas. La agrupación por color se hace en la presentación y conserva variantes, stock y precios. No se modificó la base de datos ni su estructura.

- `npm test` y `git diff --check`.
- `test-product-images.js`: 19 modelos, 154 variantes; una foto por color y conservación de precios y stock.
- `test-home-ui.js`: home en escritorio/móvil, movimiento reducido, enlace del carrusel dentro del contenedor y carrito sin duplicación por doble clic.
- `test-shopping-experience.js`: filtros plegables y selección, hover estable, apertura/cierre real del carrito, botón de 44 px, foto estable al cambiar capacidad y precios recalculados tras recarga.
- APIs de las pruebas interceptadas: no se crearon pedidos, no se escribieron datos ni se enviaron mensajes. Capturas en `artifacts/audit/home-iteration/` y `artifacts/audit/shopping-experience/`.

El detector conserva Inter como excepción por la identidad vigente. En el catálogo se documentaron excepciones para el contenedor de portada sin padding y el recorte horizontal de raíz: las capturas y pruebas muestran espacio suficiente para su texto y filtros/carrito operables, sin desbordamiento. No se desactivó el detector. Los avisos heredados de transición del header y jerarquía del footer quedan fuera de esta reparación.

Cambios locales, pendientes de publicación.
