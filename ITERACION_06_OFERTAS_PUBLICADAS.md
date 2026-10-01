# Iteración 6: ofertas en productos publicados

## Cambios

- Cada producto de Administración → Productos Actuales incorpora **Poner en oferta / Quitar oferta**, con estado visible y confirmación de guardado.
- Funciona para cualquier categoría. La acción actualiza el producto existente: conserva fotos, variantes, stock, descripción y precios.
- La actualización no recarga la lista, por lo que conserva los cambios pendientes en otros campos. Durante el guardado bloquea clics repetidos y comunica errores en la misma tarjeta.
- El producto marcado aparece en las ofertas del catálogo y puede mostrarse en Ofertas del Día de la Home, cuyo límite de tarjetas se conserva.
- Se eliminó el precio anterior ficticio calculado como un 20% adicional. Solo se muestra un precio tachado cuando existe un precio anterior real válido.

## Cómo utilizarlo

1. Abrir Administración → Productos Actuales.
2. Para rebajar el importe, editar Precio (USD) y usar Guardar Info. En equipos con precios por variante, editar y guardar desde Variantes/Colores.
3. Pulsar Poner en oferta. Para retirar el producto de las ofertas, pulsar Quitar oferta.

El botón cambia la clasificación de oferta; no aplica una rebaja ni restaura precios automáticamente. Los importes se gestionan mediante los controles existentes.

## Decisiones técnicas y de diseño

- Se reutiliza `is_offer`, que ya existe en la base de datos. No se agregan columnas, tablas ni migraciones.
- La API de edición conserva la autenticación y los permisos de administrador, valida un booleano estricto y comprueba que el producto exista y no esté archivado.
- Se envía el estado deseado, en lugar de invertirlo en el servidor: un reintento por pérdida de conexión es idempotente.
- Los cambios exclusivos de oferta no disparan avisos de reposición de stock.
- La lógica y el estilo están aislados en `public/admin-offers.js` y `public/admin-offers.css`, sin dependencias nuevas. Botones de al menos 44 px, foco visible y mensajes accesibles permiten operar en celular y con teclado.
- Se versionan los recursos estáticos para evitar que el navegador conserve una interfaz incompatible con la API actualizada.

## Validación

- `npm run test:syntax`: aprobado.
- `npm run test:api`: aprobado.
- `npm run test:admin-offers-api`: aprobado; permisos, validación, activación/desactivación, reintentos, producto ausente y errores.
- `npm run test:admin-offers-ui`: aprobado a 1440 y 390 px; clics repetidos, errores, pérdida de respuesta, conservación de cambios pendientes, distintas categorías y visibilidad en catálogo/Home.
- Revisión visual en escritorio y celular: botón y estado legibles, separación consistente y sin desbordamientos del control nuevo.
- Las pruebas usan datos simulados y solicitudes interceptadas; no cambian productos reales. Esta iteración no incluye publicación en producción.
