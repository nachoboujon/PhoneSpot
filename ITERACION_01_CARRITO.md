# Iteración 1 — Agregar al carrito

## Cambios realizados

- Estados junto al botón: «Agregando…», «Agregado» y errores con una acción clara. La confirmación incluye un enlace a la página del carrito.
- Bloqueo inmediato del botón y de los selectores de variante mientras se confirma la reserva. Los clics repetidos y el breve intervalo posterior a la confirmación no agregan unidades accidentales.
- Cola compartida para actualizar cantidades: operaciones de tarjetas diferentes no compiten entre sí. El incremento se calcula al ejecutar la operación, usando el carrito sincronizado.
- Las variantes vacías se comparan igual tanto si llegan como `null` o como una cadena vacía. Se conserva el nombre completo del producto, incluidos puntos.
- Respuestas perdidas: se consulta el carrito para comprobar si el servidor ya aplicó el cambio; no se reenvía automáticamente la escritura. La escritura tiene un límite de espera de 15 segundos.
- Una reserva confirmada seguida de un error al leer el carrito se muestra como «Agregado. Estamos actualizando el carrito». La siguiente operación exige sincronizar antes de calcular otra cantidad.
- La confirmación y el contador no esperan a que termine la animación decorativa. El botón conserva su estado de falta de stock cuando se actualiza la disponibilidad.
- Mensajes accesibles con `role="status"`, `aria-live`, `aria-busy`, foco visible y contraste adaptado al panel oscuro de producto. Al elegir otra variante se limpia el mensaje anterior.

## Justificación técnica y de diseño

Se mantuvieron HTML, CSS y JavaScript nativos. Esta mejora no necesita React, un compilador ni una librería de animación: añadirlos aumentaría el tamaño y el alcance sin resolver mejor el problema.

`public/cart-actions.js` concentra el bloqueo, los estados visuales y la cola. `public/cart-actions.css` contiene estilos pequeños y específicos; `public/script.js` conserva la integración con los endpoints existentes. Esta separación permite extraer otras partes del flujo progresivamente, sin reescribir la tienda.

El servidor sigue siendo la autoridad para reservar stock. La interfaz no aumenta cantidades de forma optimista antes de recibir confirmación: esto evita mostrar como comprado un equipo que ya no está disponible. La consulta de recuperación distingue una respuesta perdida de una reserva rechazada.

El feedback aparece en el contexto del producto y conserva el carrito lateral existente. La paleta neutral, los textos breves y el enlace «Ver carrito» mantienen la línea minimalista y facilitan continuar la compra. Los archivos nuevos se versionan por contenido para que el navegador reciba la actualización.

## Verificación

Prueba de navegador con respuestas simuladas en escritorio (1440 px) y móvil (390 px):

- Tres clics rápidos generan una sola escritura.
- Estado de carga y bloqueo de selectores mientras la respuesta tarda.
- Rechazo por stock sin aumentar cantidades; el botón permite corregir la selección.
- Recuperación de una respuesta perdida sin duplicar el producto.
- Reserva confirmada seguida de fallo de sincronización, con mensaje correcto.
- Operaciones en productos diferentes, conservando las cantidades.
- Color y capacidad seleccionados conservan la variante y su precio.
- Sin errores de JavaScript ni desbordamiento en la página de producto.

Comando: `npm run test:cart-ui`, con el servidor local iniciado y `AUDIT_URL` apuntando a su URL. Las solicitudes de API del navegador se interceptan: no se crean reservas, pedidos ni cambios de stock reales. Las capturas quedan en `artifacts/audit/add-to-cart`.

También se verificaron la sintaxis, el diff y los estilos nuevos con el detector de UI.

## Alcance

Esta iteración modifica exclusivamente el frontend, sus recursos y las herramientas de pruebas/versionado. No modifica la base de datos, los endpoints del backend, el checkout ni la home. Los cambios están en el proyecto local y no se publicaron.

El bloqueo evita duplicaciones en esta pestaña. Operaciones de otras pestañas o dispositivos siguen dependiendo del comportamiento del servidor existente; esta fase no cambia ese contrato.
