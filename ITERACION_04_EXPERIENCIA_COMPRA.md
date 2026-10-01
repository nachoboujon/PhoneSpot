# Iteración 04: experiencia de compra

## Cambios

- Errores persistentes junto a cada campo, asociados mediante `aria-describedby`, con foco en el primer dato incorrecto. Al editar el campo se retira el mensaje anterior; al continuar se vuelve a validar.
- Enlace visible para volver al carrito y botón «Editar datos» en el paso de revisión. Volver al primer paso conserva lo ingresado y dirige el foco al encabezado del formulario.
- Autocompletado de nombre, apellido, dirección y código postal. Inputs y selects de al menos 16 px en móvil para reducir el zoom automático al escribir.
- Eliminada la contradicción del resumen que indicaba «Envío Local (Sin Cargo)» junto a «A confirmar»: las entregas a coordinar mantienen su etiqueta, sin aplicarles etiquetas de gratuidad.

## Justificación

Se priorizó el checkout después de revisar el recorrido existente. No se cambió el diseño general, las reglas de pago ni la estructura de datos. Mensajes locales y navegación explícita ayudan a corregir información sin buscarla ni comenzar de nuevo. Se reutilizó `checkout-ui.js/css`, con DOM y CSS nativos, sin dependencias nuevas.

El texto de errores se inserta con `textContent`. Los IDs de descripción preservan cualquier ayuda previa del campo. Los datos permanecen en el formulario durante la navegación entre pasos; no se agregaron borradores con información personal al almacenamiento del navegador.

La corrección de envío afecta las etiquetas del resumen para métodos a coordinar. No modifica tarifas, promociones ni los cálculos del backend.

## Validación

- `npm test`, comprobación de sintaxis de `checkout-ui.js` y `git diff --check`.
- Prueba de navegador `test:checkout-ui` en 1440 y 390 px: mensajes accesibles, foco, limpieza del error al editar, autocompletado, tamaño de input móvil y conservación de datos al regresar.
- Confirmación de las protecciones existentes: doble envío, carrito modificado, reserva rechazada, resultado incierto, sesión expirada, total cero autorizado por servidor y enlace a WhatsApp.
- APIs interceptadas: no se crearon pedidos reales, no se enviaron emails ni se modificó stock.
- Capturas de errores y revisión en `artifacts/audit/checkout-iteration/`, revisadas en escritorio y móvil. El detector no reportó advertencias de contraste o espaciado en los archivos del checkout; no se agregaron excepciones nuevas.

## Alcance

Cambios locales pendientes de publicación. Base de datos y estructura intactas. Las pruebas simuladas verifican la interfaz y sus ramas de error; no certifican todos los servicios de producción ni miden conversión.
