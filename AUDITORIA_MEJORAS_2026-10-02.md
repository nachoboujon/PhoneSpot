# Investigación de mejoras de PhoneSpot — 2 de octubre de 2026

## Conclusión

La prioridad es facilitar la compra para negocios: encontrar productos, comparar variantes, entender el precio por cantidad y completar el pedido con claridad. La página tiene una base funcional; las mejoras con más valor están en el recorrido comercial, la experiencia móvil y la integridad de pedidos.

Esto es una investigación, no una implementación. No se modificaron archivos de la aplicación ni se publicaron cambios. Se agregaron este informe y evidencias locales.

## Alcance y evidencia

- Revisión del código local actual, PRODUCT.md, documentación y auditoría del 1 de octubre. Hay cambios previos del usuario en el espacio de trabajo; se conservaron.
- Navegador a 1440 × 900 y 390 × 844 en portada, catálogo, una ficha de iPhone 14 Pro y checkout.
- Lecturas del catálogo y configuración existentes. Carrito, cuenta, eventos y pedidos se interceptaron con respuestas simuladas; no se crearon pedidos ni cuentas reales.
- Sin errores JavaScript, desbordamiento horizontal, IDs duplicados ni imágenes cargadas rotas en esos escenarios. Los recursos HTML locales referenciados existen. Esto no prueba todo el catálogo ni todos los estados posibles.
- Detector técnico de Impeccable sobre cuatro páginas. Los avisos de fondos y transformaciones de imágenes son sugerencias estéticas; no demuestran por sí solos un defecto de usabilidad y no tienen prioridad sobre los hallazgos comprobados.
- Evidencia: `artifacts/audit/research-2026-10-02/results-focused.json` y capturas de escritorio/celular en esa carpeta.
- La prueba heredada esperaba un enlace de favoritos sin el parámetro comercial `tipo`. Se adaptó esa expectativa únicamente en el ejecutor de esta investigación, conservando la comprobación del identificador del producto. El enlace actual no se consideró defectuoso por incluir ese parámetro.
- No se pudo consultar el dominio público con la herramienta web. Las conclusiones sobre PhoneSpot corresponden al proyecto ejecutado localmente, no a una comprobación del despliegue remoto.

## Mejoras por prioridad

### 1. P1 — Evitar que los botones de redes tapen productos en celular

**Evidencia:** `catalogo-mobile.png` muestra Instagram sobre parte del precio de PlayStation 5 y WhatsApp sobre un selector de variante. El dock usa posición fija, `public/style.css:1–28`.

**Impacto:** información y controles quedan parcialmente ocultos, aunque no haya desbordamiento horizontal.

**Propuesta:** agrupar el contacto en un control que se pueda contraer o reservarle un espacio propio. Comprobar precio, variantes, carrito y controles inferiores durante el desplazamiento.

**Criterio de aceptación:** ningún elemento flotante cubre precio, selección de variante o acción de compra a 360 y 390 píxeles de ancho.

### 2. P1 — Mostrar productos y condiciones comerciales antes en la portada

**Evidencia:** en la captura móvil, el primer bloque está dominado por el carrusel. El inicio de preguntas frecuentes está en y=1155, el asesor en y=1417 y Nuevos ingresos en y=2519. El orden está en `public/index.html`.

**Impacto:** quien llega a reponer mercadería debe atravesar varios bloques antes de evaluar productos desde la portada. Puede acceder por navegación, pero el contenido principal tarda en aparecer.

**Propuesta:** portada con propuesta comercial clara, acceso a categorías y productos destacados; luego asesor, preguntas y ayuda. Conservar la identidad visual existente, reduciendo el espacio del carrusel móvil.

**Criterio de aceptación:** las categorías y una primera selección de productos aparecen antes que las preguntas frecuentes; el CTA explica a qué catálogo lleva.

### 3. P1 — Hacer visible y validar el precio mayorista

**Evidencia:** PRODUCT.md dice que las condiciones mayoristas siguen sin definir, pero `server.js:1194` y varias funciones de `public/script.js` aplican descuentos por equipos elegibles: desde 3 unidades, USD 5 por unidad; desde 5, USD 7; desde 10, USD 10. La ficha muestra principalmente un precio en ARS y las ventajas por cantidad aparecen en el carrito. Son reglas observadas en el código, no condiciones comerciales confirmadas por el negocio.

**Impacto:** el comprador no conoce el beneficio al comparar productos. La documentación y la implementación pueden conducir a decisiones distintas.

**Propuesta:** confirmar qué reglas son válidas, documentar categorías y combinaciones elegibles y explicar el precio por unidad y el total desde ficha y catálogo. Mostrar USD y ARS con la cotización aplicada, aclarando cuándo se fija el importe. Centralizar las reglas para evitar divergencias entre ficha, carrito y servidor.

**Criterio de aceptación:** ejemplos de pedidos de 1, 3, 5 y 10 unidades producen los mismos importes en todas las pantallas y en el servidor; las exclusiones se entienden antes de comprar.

### 4. P1 — Mejorar búsqueda y filtros para un catálogo amplio

**Evidencia:** el catálogo mostró 345 entradas en la sesión. La búsqueda de `public/script.js:2539` coincide por nombre, marca o categoría y corta a cinco resultados. No incluye una acción para ver todas las coincidencias ni manejo específico de Enter, flechas y Escape. `public/catalogo.html:140–214` ofrece categoría, marca, condición y promoción; no ofrece rango de precio, disponibilidad, memoria o RAM. Consolas y otros productos conviven con cuatro categorías principales.

**Impacto:** se ocultan coincidencias y comparar especificaciones exige abrir fichas o recorrer tarjetas.

**Propuesta:** página de resultados con consulta en la URL, contador y filtros combinables; cinco sugerencias pueden mantenerse como acceso rápido. Añadir precio y disponibilidad, y filtros de especificaciones por categoría. Revisar la clasificación de consolas, audio y relojes con el catálogo real. Agregar teclado y comunicación accesible de las sugerencias.

**Criterio de aceptación:** buscar un modelo o marca permite ver todas las coincidencias; Enter abre resultados; Escape cierra sugerencias; filtros y búsqueda sobreviven a volver desde una ficha.

**Referencia:** [patrón de combobox de W3C](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### 5. P2 — Ordenar variantes antes de agregar y acelerar pedidos por cantidad

**Evidencia:** `producto-desktop.png` muestra precio y Agregar al carrito antes que color, almacenamiento, batería y condición. La plantilla coloca `${variantsHTML}` después del panel de compra, `public/script.js:1723`. La acción agrega una unidad; el carrito ofrece incrementos.

**Impacto:** el comprador puede pasar por alto la configuración seleccionada. Pedir varias unidades o configuraciones demanda acciones repetidas.

**Propuesta:** ordenar selección de variante → disponibilidad y precio → cantidad → agregar. Mostrar un resumen inequívoco de la variante que se agregará. Para compradores recurrentes, evaluar una tabla con variantes, stock y cantidad, y repetir un pedido anterior.

**Criterio de aceptación:** antes de agregar se distinguen color, memoria, condición y cantidad; se pueden pedir varias unidades sin repetir el botón una vez por unidad.

### 6. P2 — Reducir fricción del checkout y mejorar confianza

**Evidencia:** `public/script.js:188–198` exige iniciar sesión para finalizar; `server.js:1092` también autentica la creación del pedido. El formulario solicita contacto y dirección. El pago y envío se coordinan posteriormente por WhatsApp. La portada remite consultas de garantía a WhatsApp y utiliza la expresión «al instante» sin tiempos de atención medidos en PRODUCT.md.

**Impacto:** registrarse agrega pasos antes de enviar una intención de compra; algunas condiciones se conocen recién consultando.

**Propuesta:** evaluar pedido como invitado o presupuesto con datos mínimos y cuenta opcional posterior. Es una decisión de producto con cambios de API, reservas y seguimiento, no solo un cambio visual. Aclarar reserva, pago, vigencia del precio y envío pendiente. Publicar horarios de atención y cobertura real de garantía por condición cuando el negocio aporte esos datos.

**Criterio de aceptación:** se entiende qué confirma el botón y qué falta coordinar; una interrupción conserva los datos; no se prometen tiempos o garantías sin respaldo.

### 7. P1 — Corregir metadatos de productos y variantes para Google

**Evidencia:** `server.js:211–224` construye un único Product con precio y stock generales y siempre `NewCondition`. El frontend distingue americano/swap, reacondicionado y otras opciones; los metadatos no distinguen el parámetro comercial `tipo`.

**Impacto:** buscadores y vistas previas pueden recibir una condición o precio que no coincide con la opción que el visitante está viendo.

**Propuesta:** hacer coincidir precio, condición y disponibilidad con la variante comercial; usar ProductGroup/hasVariant cuando corresponda; revisar canonical y URLs de variantes. La condición debe derivarse de datos explícitos, sin inferirla solamente del nombre comercial.

**Criterio de aceptación:** una ficha de americano no declara nuevo; precio y stock estructurados coinciden con la opción visible y pasan la validación pertinente.

**Referencia:** [documentación oficial de variantes de Google](https://developers.google.com/search/docs/appearance/structured-data/product-variants). El marcado ayuda a interpretar variantes; no garantiza resultados enriquecidos ni posiciones.

### 8. P2 — Medir ventas y rendimiento para decidir con datos

**Evidencia:** existen eventos de visita, producto, carrito, búsqueda, inicio de checkout y pedido creado. `/api/admin/analytics`, `server.js:1545`, devuelve visitas, agregados, inicios y vistas de producto; no resume pedidos creados ni confirmados. El archivo común `script.js` pesa 290.760 bytes y `style.css` 106.163 bytes sin compresión e incluyen múltiples superficies, incluida administración.

**Propuesta comercial:** medir el recorrido hasta pedido confirmado, búsquedas sin resultados, clics de contacto y productos consultados sin stock. Definir sesiones o identificadores adecuados: dividir eventos brutos no da automáticamente una tasa de conversión fiable. Distinguir pedido registrado de venta confirmada por WhatsApp.

**Propuesta técnica:** medir primero en dispositivos y redes representativos; después dividir código de administración/autenticación, reducir CSS duplicado y compartir la descarga del catálogo entre búsqueda y tarjetas. El peso observado es una oportunidad de revisión, no una medición de lentitud.

**Objetivos de referencia:** LCP ≤2,5 s, INP ≤200 ms y CLS ≤0,1 al percentil 75, según [Web Vitals de Google](https://web.dev/articles/vitals). Esta investigación no midió esos indicadores ni un puntaje Lighthouse.

### 9. P2 — Completar accesibilidad de controles secundarios

**Evidencia:** el botón Quitar del resumen de checkout mide 58 × 19 píxeles en el escenario móvil. La búsqueda no implementa el patrón de sugerencias accesibles descrito arriba. Sí existen etiquetas en varios campos, foco visible compartido, estados de variantes y tratamiento de movimiento reducido.

**Propuesta:** aumentar el área de los controles pequeños, etiquetar cerrar favoritos, completar navegación de teclado y verificar contraste con una herramienta apropiada. Para uso cómodo en celular, apuntar a 44 × 44 píxeles donde sea viable.

**Límite:** el mínimo AA de WCAG 2.2 es 24 × 24 con excepciones de espaciado y otras; medir 19 píxeles de alto no basta por sí solo para declarar incumplimiento. [Criterio de tamaño de objetivo de W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). No se certificó conformidad WCAG completa.

### 10. P1 — Cerrar pendientes de integridad de pedidos antes de escalar

La auditoría del 1 de octubre ya documentó estos puntos. La revisión del código actual confirma que siguen presentes los caminos relevantes:

- Creación de pedido, artículos y consumo de reservas en pasos separados: consolidar en una operación transaccional e idempotente.
- Cambio a cancelado mediante actualización del estado: diseñar restitución de stock exactamente una vez. La ausencia de triggers se constató en la auditoría anterior; no se volvió a inspeccionar la base en esta investigación.
- Envío recibido desde el cliente: calcular o validar en servidor contra una cotización propia.
- Orden sin cotización e importe histórico en ARS persistidos en el insert revisado: guardar ambos para reconstruir lo acordado.
- Recuperación de contraseña mediante JWT sin consumo persistido de un solo uso ni revocación de sesiones en ese camino: agregar ambas protecciones.

**Impacto:** pedidos incompletos, stock incorrecto, importes difíciles de reconstruir y protección insuficiente tras un cambio de contraseña.

**Validación requerida:** entorno de pruebas con concurrencia, reintentos, cancelaciones repetidas y recuperación de cuenta. No se provocaron fallas ni se hicieron modificaciones en producción.

## Orden de trabajo sugerido

1. Corregir superposición móvil; ordenar portada y ficha; validar condiciones mayoristas y mostrarlas con claridad.
2. Ampliar búsqueda y filtros; resolver metadatos de condición y variantes.
3. Fortalecer pedidos, stock e importes mediante pruebas y migraciones controladas.
4. Completar medición del embudo y rendimiento; usarla para priorizar checkout como invitado, compra por lotes y recompra.
5. Terminar cada intervención con una revisión de consistencia visual y accesibilidad.

No se estiman aumentos de ventas ni porcentajes de abandono sin datos reales. Las propuestas comerciales deben validarse por uso y resultados, además de pruebas técnicas.
