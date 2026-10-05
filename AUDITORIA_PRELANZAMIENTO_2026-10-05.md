# Auditoría de lanzamiento de PhoneSpot — 5 de octubre de 2026

La tienda pasó las verificaciones funcionales realizadas. No recomiendo dar por cerrado el lanzamiento con la configuración local actual: SMTP rechazó la autenticación, hay una variante del catálogo que necesita confirmar su color y falta completar la identificación legal del proveedor. No se desplegaron cambios ni se modificaron pedidos, cuentas, stock o configuración de Supabase.

## Pendientes antes de lanzar

1. **Correo:** la conexión de Nodemailer al SMTP configurado en `.env` terminó con `EAUTH`. No se envió ningún correo. Revisar las credenciales y el remitente del proveedor; volver a validar la conexión y después comprobar la entrega real de verificación, recuperación y notificaciones en un entorno de prueba. Esto demuestra un fallo de la configuración local, no de las variables privadas de Railway, que no se inspeccionaron. Los tests de correo simulado no comprueban entrega.
2. **Secreto JWT:** el valor local tiene menos de 32 caracteres. Su longitud no demuestra por sí sola su entropía; usar un secreto largo, aleatorio y exclusivo de producción. Cambiarlo invalidará las sesiones existentes. No se mostraron ni guardaron los valores de las credenciales.
3. **Color de producto:** el producto 61, iPhone 13 Pro Max, tiene una variante Americano de 512 GB registrada como Rosa, con stock 10. El manifiesto de imágenes la marca como pendiente. Rosa no aparece entre los acabados originales que [Apple documenta para este modelo](https://support.apple.com/en-euro/111870). Confirmar el equipo y su foto con el proveedor; podría ser un error del catálogo o una carcasa modificada. No se sustituyó su color por otro supuesto.
4. **Configuración de producción:** confirmar en Railway `NODE_ENV=production`, URL pública HTTPS, secreto JWT, correo, destinatarios y cotización. La configuración local no declara todas esas variables y usa valores por defecto. No se consultaron las variables privadas del despliegue.

## Aviso Legal — revisión adicional

**Estado: pendiente.** No existe una página de Aviso Legal ni un enlace con ese nombre en `public/`. Los términos y garantías existentes no identifican al titular legal de PhoneSpot con nombre o razón social, CUIT y domicilio completo. El footer publica marca, email, WhatsApp y una zona de atención en Entre Ríos; esa zona no identifica un domicilio físico completo.

Para ventas a consumidores, la [Resolución 270/2020, anexo, punto 2](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-270-2020-341933/texto) exige información del proveedor fácilmente visible antes de contratar, incluyendo nombre comercial y social, dirección física y electrónica e identificación tributaria. El requisito es la información accesible; el nombre «Aviso Legal» por sí solo no satisface esa obligación ni es una página obligatoriamente separada.

Para completar el contenido faltan datos confirmados del negocio: nombre del titular o razón social, CUIT, domicilio completo y contacto para comunicaciones legales. No se inventaron ni se publicaron esos datos. Una página final debería enlazarse desde el pie del sitio y describir el titular, objeto de la web y contactos, con referencias claras a condiciones de compra y privacidad. La declaración de marcas que ya existe en el footer puede integrarse sin atribuir a PhoneSpot derechos de terceros.

Se detectaron además aspectos vinculados que requieren revisión:

- `terminos.html` exige para el arrepentimiento un producto sin uso y empaque original sellado. Revisar esa restricción para que no suprima derechos legales. El artículo 34 de la [Ley 24.240 actualizada](https://www.argentina.gob.ar/normativa/nacional/638/actualizacion) establece diez días desde la entrega o celebración del contrato, lo último que ocurra, y los gastos de devolución a cargo del vendedor. El texto actual sólo cuenta desde la recepción y no explica quién paga la devolución.
- No se encontró un botón de arrepentimiento ni un circuito asociado en el código público revisado. Para ventas a consumidores a distancia, la [Disposición 954/2025](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-954-2025-417152/texto) exige el enlace visible y destacado desde el primer acceso, sin registro previo. La Resolución 424/2020 fue derogada por esta disposición; no debe usarse como referencia vigente aislada.
- El banner anuncia una política de privacidad pero enlaza a `terminos.html`, que no describe el tratamiento de datos. El aviso legal no reemplaza esa información.
- El texto de garantías promete doce meses de garantía oficial para todos los equipos nuevos y originalidad total de los usados. Confirmar que esas promesas correspondan a cada producto y proveedor; las pruebas técnicas no las acreditan.

Esta revisión identifica ausencias y textos a corregir; no certifica cumplimiento legal integral. La aplicación concreta depende también de si la compra es de consumo final o para reventa. No se modificaron las condiciones comerciales ni se creó una página pública con datos pendientes.

## Política de privacidad — revisión adicional

**Estado: pendiente.** No se encontró una página de privacidad en `public/`. El banner de `public/script.js` anuncia una política pero su enlace lleva a `terminos.html`, que no informa sobre el tratamiento de datos. Tampoco se encontró información equivalente en los formularios revisados.

### Tratamientos observados en el código

| Contexto | Datos y uso observado |
| --- | --- |
| Cuenta y autenticación | Nombre, email, contraseña protegida con bcrypt, rol y versión de sesión. Google puede aportar nombre y email al iniciar sesión. El token de sesión se conserva en el navegador. |
| Perfil y pedidos | Teléfono, DNI, dirección, localidad, provincia, código postal, productos, cantidades, importes y estado. El checkout incorpora el DNI y teléfono al texto de dirección que llega al pedido. |
| Correo | Verificación, recuperación, bienvenida, confirmación y cambios de estado. El pedido genera notificaciones al comprador y al destinatario administrativo configurado. |
| WhatsApp | El enlace de confirmación contiene nombre, dirección, total y productos del pedido; el cliente decide abrirlo para coordinar la compra. |
| Alertas de stock | Email asociado al producto solicitado; el código elimina la alerta después de enviar el aviso con éxito. No se identificó una baja anticipada en la interfaz. |
| Reseñas | Usuario, nombre, comentario y valoración. Las aprobadas se consultan públicamente; debe informarse qué se publica. |
| Métricas propias | Eventos, ruta de página, producto, longitud de búsqueda y métricas de rendimiento. El flujo normal no envía el texto buscado ni guarda IP en `site_events`; sí usa IP temporalmente en memoria para limitar solicitudes. Esto no acredita anonimato de los logs del alojamiento ni de servicios externos. |
| Navegador | `localStorage`: sesión, rol, identificador del carrito, favoritos, comparación y aviso leído. `sessionStorage`: datos del formulario, claves de pedido, confirmación y control de vistas. No equivalen todos a cookies ni tienen necesariamente la misma duración. |

Supabase almacena datos del servidor. El despliegue documentado utiliza Railway; correo admite SMTP o Resend según configuración. Google participa en el login y WhatsApp en el contacto. También hay recursos cargados desde CDN externos. Deben verificarse proveedores efectivos, regiones, contratos y registros técnicos de producción; la autorización de un dominio en CSP no demuestra que se utilice.

### Contenido y decisiones que faltan

- Identidad y domicilio del responsable, contacto para privacidad y descripción de datos, finalidades, destinatarios, campos obligatorios/opcionales y consecuencias de no proporcionarlos. El deber de informar previamente aparece en el artículo 6 de la [Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion).
- Canal operativo de acceso, rectificación, actualización y supresión, con verificación de identidad y gestión de solicitudes. El perfil permite leer y modificar ciertos campos, pero no reemplaza ese procedimiento. Según los artículos 14 y 16, los plazos son diez días corridos para acceso y cinco días hábiles para rectificación, actualización o supresión, con las excepciones legales correspondientes. [Orientación de la AAIP](https://www.argentina.gob.ar/aaip/datospersonales/derechos).
- Criterios de conservación por finalidad y obligaciones aplicables. No se encontraron plazos generales de eliminación de usuarios, pedidos, reseñas y métricas; no se debe prometer un borrado automático inexistente. El artículo 4 exige eliminar datos cuando dejan de ser necesarios o pertinentes. [Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion).
- Destinos y garantías de eventuales transferencias internacionales, después de confirmar la infraestructura real. No se verificaron regiones ni contratos de tratamiento. [Guía de la AAIP sobre transferencias](https://www.argentina.gob.ar/transferencias-internacionales).
- Justificación de solicitar DNI en todas las compras y perfiles de entrega, aplicando minimización; no se comprobó que sea necesario en todos los casos.

### Hallazgos que requieren cambios de funcionamiento

1. **Promociones sin preferencias de baja identificadas:** `POST /api/marketing/offers` selecciona todos los usuarios y permite enviarles publicidad por estar registrados. No se encontraron campos de preferencia, lista de exclusión ni enlace de baja en el correo generado. No se ejecutó este endpoint ni se comprobó si se enviaron campañas. Revisar la legitimación de ese uso y ofrecer un mecanismo efectivo de retiro/bloqueo antes de utilizarlo; el artículo 27 reconoce ese derecho. [Ley 25.326](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion).
2. **Banner sin control del tratamiento:** «Entendido» guarda `cookies_accepted` y oculta el mensaje. Las métricas propias se envían antes de esa acción, que no las activa ni desactiva. El texto sobre aceptación por continuar navegando y ofertas relevantes no describe con precisión el comportamiento observado. Separar información, funciones necesarias y tratamientos opcionales según su fundamento, sin atribuir al banner un consentimiento que no implementa.
3. **Aviso previo en formularios:** incorporar un enlace accesible a la política y la información pertinente antes de recoger datos en registro, checkout y alertas. Una página aislada no corrige por sí sola estos flujos.

No se publicaron textos con datos inventados ni se cambiaron consentimientos, campañas o datos de clientes. Para cerrar este punto faltan el titular y domicilio confirmados, contacto de privacidad, criterios de conservación y decisión sobre promociones, junto con la revisión de proveedores efectivos. Una política final debe describir el funcionamiento que realmente se implemente.

## Aviso de cookies — revisión adicional

**Estado: existe un banner, pero necesita corregirse antes del lanzamiento.** Se revisaron el frontend y el servidor. No se identificaron escrituras explícitas de cookies mediante `document.cookie` o cabeceras `Set-Cookie` en el código de aplicación; sí se utiliza almacenamiento del navegador. No se realizó una captura completa de cookies y solicitudes de terceros en una sesión real de Google, por lo que no se puede declarar que el sitio nunca use cookies.

### Funcionamiento comprobado por código

- El banner aparece si no existe `localStorage.cookies_accepted`, aproximadamente 1,5 segundos después de cargar la página.
- El texto anuncia cookies propias y de terceros, ofertas relevantes y aceptación por continuar navegando. No se encontraron implementaciones de seguimiento publicitario que justifiquen esa descripción en el código revisado.
- «Entendido» escribe `cookies_accepted=true` y oculta el aviso. No cambia qué recursos se cargan ni qué métricas se envían.
- «Ver Políticas» enlaza a `terminos.html`, que no contiene una política de cookies ni explica el almacenamiento del navegador.
- No hay opciones de rechazo, selección de categorías o reapertura de preferencias, ni caducidad o versión para la marca del banner.
- Las vistas y métricas propias de rendimiento pueden registrarse sin que el usuario pulse «Entendido»; el código no consulta esa marca para decidir su envío.

### Inventario que debe explicar la información publicada

| Tecnología | Uso observado | Duración observada |
| --- | --- | --- |
| `localStorage` | Token y rol de sesión, identificador del carrito, favoritos, productos comparados y aviso leído. | Sin caducidad propia en las claves; se conserva hasta que el código o el usuario lo elimina. La validez del token es independiente de que siga almacenado. |
| `sessionStorage` | Borrador de checkout con datos de contacto y entrega, claves de reintento, confirmación del pedido, transición de autenticación y control de páginas visitadas. | Vinculado a la sesión de la pestaña, con eliminaciones explícitas en algunos flujos. No se debe prometer borrado inmediato de todo el contenido al salir de una página. |
| Recursos externos | Google Sign-In, fuentes de Google, iconos desde CDN y recursos externos de producto cuando corresponde. | Cookies y almacenamiento efectivos de terceros pendientes de inventario en navegador; no se deducen solamente de CSP. |
| Métricas propias | Solicitudes a `/api/events`; la aplicación normal no incorpora texto de búsqueda ni una cookie publicitaria a esas métricas. | Retención de eventos en base de datos no definida en el código revisado. El permiso del banner no controla su envío. |

### Corrección propuesta

1. Publicar información de cookies y tecnologías similares con finalidad, responsable, proveedor, duración y cómo eliminarlas o configurar las preferencias pertinentes. Enlazarla desde el banner y el pie del sitio.
2. Ajustar el texto a los usos reales: sesión, carrito, preferencias y medición. No afirmar publicidad personalizada ni consentimiento por seguir navegando sin un fundamento y funcionamiento que lo respalden.
3. Decidir y documentar el fundamento de cada tratamiento. Si un tratamiento opcional se basa en consentimiento, implementar selección efectiva, no iniciarlo antes de obtenerlo y permitir cambiar la decisión. «Entendido» no prueba por sí solo un consentimiento libre, expreso e informado. La [Ley 25.326, artículos 5 y 6](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion) distingue el consentimiento, sus excepciones y el deber de información; no se presume que todas las funciones técnicas requieran la misma autorización.
4. Comprobar en navegador, con almacenamiento limpio, qué se guarda y qué solicitudes salen antes y después de cada opción. Incluir login Google y terceros realmente usados. Si se incorpora consentimiento, verificar persistencia, modificación de preferencias y mantenimiento del carrito y autenticación.

No se cambió el banner ni se bloqueó funcionalidad de la tienda durante esta revisión. No se aplicó automáticamente un modelo de consentimiento europeo a un negocio argentino; la configuración final depende de los tratamientos efectivos y del ámbito territorial aplicable.

## Forzar HTTPS — revisión adicional

**Estado: aprobado en los dominios públicos probados.** Se hicieron peticiones reales sin seguir automáticamente las redirecciones:

| Petición | Respuesta observada |
| --- | --- |
| `http://phonespot.site/` | HTTP 301 a `https://phonespot.site/`. |
| `http://www.phonespot.site/` | HTTP 301 a `https://www.phonespot.site/`. |
| `http://www.phonespot.site/catalogo.html?cat=all` | HTTP 301 a la misma ruta y consulta bajo HTTPS. |
| `https://phonespot.site/` | HTTP 301 al dominio canónico `https://www.phonespot.site/`. |
| `https://www.phonespot.site/` | HTTP 200 y `Strict-Transport-Security: max-age=31536000; includeSubDomains`. |

No se observó un bucle de redirección. El dominio sin `www` necesita dos saltos al acceder por HTTP: primero HTTPS y después el dominio canónico. Esto no impide el acceso seguro.

La conexión TLS a `www.phonespot.site` validó el certificado con comprobación de confianza y hostname, negoció TLS 1.3 y mostró vencimiento el 2 de diciembre de 2026. No se encontraron recursos HTTP inseguros en los HTML/CSS/JS revisados: las coincidencias eran un comentario de localhost y el namespace de un SVG embebido. Esto no sustituye una inspección completa de contenido dinámico desde navegador.

El código de Express añade HSTS en producción y redirige el dominio sin `www`; no contiene una redirección general basada en `req.secure` para todos los hosts. La redirección HTTP a HTTPS observada corresponde a la infraestructura pública delante de la aplicación. No se modificó esa infraestructura ni se agregó una regla redundante al servidor.

Si cambia el alojamiento, verificar nuevamente esa redirección, el certificado y la conservación de rutas y consultas. Si se traslada el control a Express, debe configurarse la confianza del proxy de acuerdo con la topología real para interpretar `X-Forwarded-Proto` sin permitir falsificación ni causar bucles. [Documentación de Express](https://expressjs.com/en/guide/behind-proxies/).

HSTS refuerza HTTPS después de una visita segura; no reemplaza la redirección HTTP del primer acceso. No se comprobó inclusión en una lista HSTS preload. La configuración local permite `PUBLIC_APP_URL` con HTTP, por lo que su valor de producción debe confirmarse como HTTPS para enlaces de correo y recuperación.

## Meta títulos y descripciones — revisión adicional

**Estado: parcial; faltan ajustes de SEO antes del lanzamiento.** Se extrajeron metadatos de los quince HTML locales y de seis respuestas HTML del dominio público, sin renderizado JavaScript. Evidencia reproducible: `.tmp/meta-audit.cjs` y `artifacts/audit/prelaunch-2026-10-05/meta-results.json`.

### Hallazgos

- Los quince HTML tienen exactamente un `<title>` y sus títulos estáticos son distintos entre páginas. Inicio, catálogo y las páginas informativas tienen títulos comprensibles, aunque el catálogo puede describir mejor su contenido.
- **Catorce de quince HTML no tienen `<meta name="description">`.** Sólo `comparar.html` la incluye. Falta en inicio, catálogo, ficha de producto, términos y garantías; también en páginas operativas que conviene evaluar para exclusión de resultados, en lugar de priorizar su promoción.
- Inicio tiene `og:description`, pero no una descripción SEO estándar. Su título Open Graph difiere del título principal y el texto promocional promete mejores precios, cotización al dólar blue y envíos a todo el país. El código admite cotización configurada; confirmar las afirmaciones comerciales antes de conservarlas.
- **Las fichas entregan `Detalle del Producto | PhoneSpot` en el HTML inicial**, tanto para el iPhone 14 Pro Americano probado como para una ficha real con garantía Apple. `public/script.js` modifica después `document.title` con el nombre del producto. No se debe afirmar que Google nunca lo ejecuta, pero el título genérico inicial hace depender la identificación de producto del renderizado y se repite entre fichas.
- El servidor agrega Open Graph y datos estructurados a las fichas, pero no reemplaza el `<title>` ni agrega `meta description`. La descripción Open Graph se toma del registro original, conserva marcadores como `[Condición: ...]` y se corta a 160 caracteres aunque deje una frase incompleta.
- `productSeo()` selecciona el tipo comercial y variante para canonical, imagen y schema; los títulos y descripciones Open Graph usan `data.name` y `data.description`, sin derivarse de `seo.selected`. Para productos con varias condiciones, revisar que esos textos describan la opción solicitada. La revisión no encontró una contradicción de condición en las dos fichas válidas usadas como muestra.
- No se encontraron etiquetas `meta robots` ni cabeceras `X-Robots-Tag` en el código revisado. Evaluar `noindex` en administración, cuenta, carrito, checkout, confirmación y recuperación. `robots.txt` bloquea algunas rutas, pero no garantiza su exclusión del índice y puede impedir que Google lea un `noindex` si se combina incorrectamente.

### Corrección propuesta

1. Priorizar títulos y descripciones propias para las páginas públicas que se desea indexar: inicio, catálogo, fichas y contenido informativo.
2. Generar en el servidor el título y la descripción de cada producto, incluyendo su condición comercial cuando corresponda. Mantener coherencia entre `<title>`, `meta description`, Open Graph, encabezado visible y contenido; conservar el escape de atributos HTML.
3. Limpiar marcadores de importación y resumir textos completos, sin anunciar precio, stock o garantía que no coincidan con la ficha. No rellenar con listas de palabras clave.
4. Preparar metadatos de Aviso Legal, Privacidad y Cookies cuando esas páginas se creen, y comprobar títulos/descripciones duplicados en las URLs de productos y categorías que se decida indexar.

Ejemplos propuestos, no publicados:

| Página | Título propuesto | Descripción propuesta |
| --- | --- | --- |
| Inicio | `Celulares y tecnología para tu negocio | PhoneSpot` | `Explorá celulares, notebooks y accesorios en PhoneSpot. Compará modelos y variantes, armá tu pedido y coordiná el pago y la entrega por WhatsApp.` |
| Catálogo | `Catálogo de celulares, notebooks y accesorios | PhoneSpot` | `Encontrá equipos por categoría, marca y especificaciones. Consultá precios y disponibilidad, elegí variantes y agregá productos a tu pedido.` |
| Ficha del producto 73 | `iPhone 14 Pro Americano | PhoneSpot` | `Consultá las variantes disponibles del iPhone 14 Pro Americano. Elegí color, almacenamiento y batería, revisá el precio y armá tu pedido.` |

Google recomienda títulos descriptivos y distintos y descripciones útiles para cada página. No establece un límite rígido de caracteres ni garantiza usar el texto escrito: puede generar otro título o snippet según la consulta y el contenido. [Títulos](https://developers.google.com/search/docs/appearance/title-link), [descripciones](https://developers.google.com/search/docs/appearance/snippet).

No se cambiaron metadatos ni reglas de indexación durante esta revisión. No se consultó Search Console ni se comprobó cómo aparecen hoy todas las URLs en resultados de búsqueda.

## Datos estructurados — revisión adicional

**Estado: implementados, con inconsistencias y validación externa pendientes.** Se revisaron `lib/product-seo.js`, la inyección de JSON-LD del servidor y el marcado del inicio. Se analizó la respuesta HTML pública de inicio y tres fichas; también se generó marcado local desde los 332 productos del catálogo público. Evidencia: `.tmp/schema-audit.cjs` y `artifacts/audit/prelaunch-2026-10-05/schema-results.json`.

### Lo que funciona

- Inicio publica JSON-LD `Store` con nombre, URL, teléfono, imagen, provincia/país y perfil de Instagram.
- Las fichas incluyen `Product` o `ProductGroup` desde el servidor, sin depender de JavaScript para insertar el JSON-LD. Los grupos incluyen `hasVariant`, `productGroupID`, nombres e identificadores de variantes y ofertas con precio, moneda y disponibilidad.
- Todos los bloques de las respuestas públicas examinadas se pudieron parsear. La generación local de los 332 productos no produjo errores ni ítems sin nombre, imagen o precio positivo finito en las comprobaciones básicas realizadas.
- En las fichas 73, 350 y 279, los precios y disponibilidad de los 21 ítems del marcado coincidieron con los derivados de la API pública. Esto no valida cambios concurrentes ni todas las respuestas de las 332 fichas.
- La prueba unitaria de condiciones y SEO comercial pasó. Distingue condiciones usadas, nuevas y reacondicionadas cuando el texto se reconoce; no deduce que una garantía Apple implique un equipo nuevo.

### Hallazgos a corregir

1. **Variantes:** los grupos declaran siempre `color`, `size` e `itemCondition` en `variesBy`. Google no incluye `itemCondition` entre las propiedades admitidas en esa lista, y los veinte ítems de las dos fichas con `ProductGroup` examinadas no tienen `size`. Ajustar los ejes a las diferencias reales y propiedades compatibles; documentar capacidad, RAM y configuración mediante propiedades apropiadas, sin convertir automáticamente almacenamiento en talla. [Guía de variantes de Google](https://developers.google.com/search/docs/appearance/structured-data/product-variants).
2. **Condición de equipos americanos:** los dieciséis ítems de la ficha 73 carecen de `offers.itemCondition`. Sus variantes usan un código como `ASLY`; la función prueba ese texto primero y no vuelve a la etiqueta comercial reconocida cuando el código no se interpreta. Por tanto, el test con la palabra «Americano» no cubre este dato real. Normalizar por una condición confirmada del producto, manteniendo separado estado de uso y garantía. No inventar condición nueva para resolver un aviso.
3. **Imágenes:** las dieciséis variantes de la ficha 73 usan en el JSON-LD fotografías originales del proveedor, mientras la API normalizada que alimenta la ficha entrega imágenes oficiales distintas. La comparación detecta URLs diferentes, no demuestra que las fotografías sean de otro modelo. El servidor construye SEO directamente del registro sin aplicar la normalización de imágenes que sí usa la API. Unificar ese criterio y comprobar modelo/color y acceso a cada imagen.
4. **Canonical del grupo:** el servidor puede agregar el selector `variant` al canonical y a `ProductGroup.url`. Para el modelo de una sola página con selectores, Google indica un canonical común del grupo y un `ProductGroup.url` sin selector de variante. Definir coherentemente ese modelo para `tipo` y `variant`; no cambiar todas las URLs a canonicals de variante por defecto. [Guía de variantes](https://developers.google.com/search/docs/appearance/structured-data/product-variants).
5. **Negocio:** `Store` no incluye domicilio completo ni identidad legal confirmada. Si se busca elegibilidad de negocio local, verificar los datos requeridos y la existencia real de un establecimiento; no inventar una dirección física para completar el marcado. Evaluar `Organization` cuando represente mejor al negocio. [Negocios locales](https://developers.google.com/search/docs/appearance/structured-data/local-business), [organizaciones](https://developers.google.com/search/docs/appearance/structured-data/organization).
6. **Moneda y políticas:** las ofertas declaran USD y la interfaz calcula precios en ARS. Confirmar que el precio USD de cada oferta esté claramente visible y corresponda a esa variante, especialmente en categorías sin tabla de descuento. El uso de USD no es por sí solo un error. No se incluyen políticas estructuradas de devoluciones o envíos; añadirlas sólo tras corregir y confirmar las políticas comerciales, sin afirmar plazos o costos inexistentes.

### Verificación pendiente

Validar muestras de producto simple, grupos, sin stock, americano, nuevo y reacondicionado en Rich Results Test y, después, en Inspección de URL de Search Console. Revisar la preselección de cada URL con `variant`, su imagen, precio, disponibilidad y posibilidad de agregar al carrito. El frontend contiene lógica de preselección, pero esta auditoría del marcado no recorrió cada URL de variante.

No se ejecutó Rich Results Test ni se accedió a Search Console en este punto. Parsear JSON y comparar campos no certifica elegibilidad. La ausencia de valoraciones no invalida automáticamente un producto que contiene ofertas; no deben añadirse estrellas ficticias. [Guía de snippets de producto](https://developers.google.com/search/docs/appearance/structured-data/product-snippet). Google no garantiza mostrar resultados enriquecidos por incluir marcado válido.

No se modificaron los datos estructurados ni el catálogo durante esta revisión.

## Verificaciones completadas

| Área | Evidencia y resultado |
| --- | --- |
| JavaScript | `npm test` y comprobación de los 16 archivos de aplicación con `node --check`: sin errores de sintaxis. |
| Dependencias | `npm audit --json` y auditoría de dependencias de producción: cero vulnerabilidades reportadas en esta ejecución. |
| Reglas comerciales | Descuentos por cantidad, exclusiones por categoría, búsqueda normalizada y SEO de condiciones: pruebas unitarias aprobadas. |
| API | Validación de entrada, JSON inválido, cantidades fraccionarias, envíos gratuitos, precios confiables, pedidos como invitado, idempotencia y revocación de sesiones: pruebas aisladas aprobadas. |
| Administración | Permisos de ofertas, booleanos estrictos, reintentos, errores, preservación de stock/precios/fotos y edición de configuración de notebooks: aprobados con base simulada. |
| Navegador | Pruebas de carrito, checkout, portada, filtros, favoritos, ofertas, imágenes y configuración de notebooks aprobadas en escritorio y celular. El recorrido ampliado también pasó a 360 px. |
| Carrito y checkout | Dobles clics, rechazo de stock, pérdida de respuesta, cambio de carrito antes de confirmar, totales del servidor, reintento con la misma clave, sesión vencida y confirmación por WhatsApp: aprobados con APIs interceptadas. |
| Pantallas | 20 rutas/estados revisados a 1440 y 390 px: sin errores JavaScript, desbordamiento horizontal, IDs duplicados ni imágenes cargadas rotas en los escenarios observados. Sin recursos locales referenciados faltantes. |
| Imágenes | 73 imágenes oficiales validadas; 19 modelos y 154 variantes revisados con fixtures, conservando precios y stock y filtrando galerías por color. Esto no prueba visualmente cada imagen remota del catálogo real. |
| Rendimiento | Compresión gzip/Brotli y caché aprobadas; ahorro transferido de aproximadamente 77–80 % en los tres recursos medidos. No se midieron Core Web Vitals de visitantes reales. |
| Supabase real | Lecturas de metadatos: las ocho tablas públicas tienen RLS; seis funciones críticas no permiten ejecución a `anon` ni `authenticated` y usan SECURITY INVOKER. `users.session_version` y las funciones actuales existen. |
| Catálogo real | 332 productos activos y 741 variantes: cero precios de producto nulos/no positivos, stock de producto nulo/negativo, stock de variante inválido, imágenes principales vacías o identidades de variantes duplicadas. No se comprobó la disponibilidad física del stock. |
| Dominio público | Inicio, catálogo, checkout, productos, cotización, sitemap y robots respondieron HTTP 200 mediante HTTPS y devolvieron HSTS y CSP. Seis archivos JS/CSS comprobados coinciden con el código local al normalizar saltos de línea. |

El asesor de seguridad de Supabase devolvió solamente un aviso informativo: `cart_reservations` tiene RLS y ninguna política. Las lecturas de permisos confirman que `anon` y `authenticated` no tienen privilegios sobre esa tabla; el acceso se realiza desde el servidor. No se agregó una política pública para eliminar el aviso. [Referencia del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Ajustes realizados en las verificaciones

Se actualizaron tres pruebas desactualizadas y el ejecutor del navegador; no se cambió código de producto:

- La prueba de ofertas simula ahora la consulta de la cuenta y su rol que exige la autenticación actual.
- La prueba móvil comprueba que los contactos permanezcan en el footer y que sus rectángulos no cubran tarjetas. La expectativa anterior exigía un carril lateral para controles flotantes que ya no se usan en celular.
- La prueba de checkout simula el resultado de pedido no encontrado con HTTP 404 y verifica el reintento con la misma clave después de perder una respuesta. Antes devolvía un array vacío con HTTP 200 para ese endpoint y esperaba un bloqueo permanente que ya no corresponde al flujo actual.
- `run-browser-check.js` comunica a la prueba la URL del servidor que inicia; antes una prueba buscaba el puerto 3100 mientras el ejecutor iniciaba el 3000.

Todas las comprobaciones funcionales enumeradas pasaron tras esos ajustes. `git diff --check` también pasó.

## Sitemap y robots.txt — revisión adicional

Estado: ambos publicados y accesibles; ajustes pendientes de coherencia SEO.

- `/robots.txt`: HTTP 200, `text/plain`, permite las páginas públicas y recursos; bloquea administración, perfil, checkout y carrito. Declara correctamente `https://www.phonespot.site/sitemap.xml`.
- `/sitemap.xml`: HTTP 200, `application/xml`, XML parseado correctamente. Contiene 336 URLs: cuatro páginas fijas y los 332 productos del catálogo público consultado. No se encontraron duplicados, URLs fuera del dominio HTTPS, fechas inválidas/futuras ni productos de esa respuesta ausentes.
- Se comprobaron por HTTP las cuatro páginas fijas y cinco fichas: todas respondieron 200. No se rastrearon individualmente las 332 fichas.
- Las 332 URLs de producto del sitemap omiten `tipo`, mientras la función de SEO genera canónicas con ese parámetro. Cinco fichas públicas confirmaron esa diferencia. Ejemplo: el sitemap incluye `producto.html?id=73`, pero la ficha declara `producto.html?id=73&tipo=americano`. Unificar primero el modelo canónico de condiciones/variantes y generar el sitemap con las URLs finales elegidas; valorar cobertura de grupos comerciales si tienen páginas canónicas separadas. [Google recomienda incluir las URLs canónicas](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- `lastmod` se genera desde `created_at`, no desde la última actualización significativa del producto. Registrar y usar una fecha real de modificación o quitar `lastmod` cuando no pueda determinarse. `changefreq` y `priority` no solucionan esto: Google ignora esos dos campos. [Documentación de sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- Las páginas legales nuevas deberán incorporarse cuando existan. El sitemap actual incluye términos y garantías; aviso legal y privacidad todavía no tienen páginas.
- Los `Disallow` actuales controlan rastreo, pero no garantizan exclusión del índice ni protegen datos privados. Para las páginas operativas, definir `noindex` y permitir que el crawler pueda leerlo; mantener autenticación en los datos privados. Revisar también confirmación de compra, login, registro y recuperación, que no están bloqueados actualmente. [Límites de robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).
- No se comprobó envío/lectura del sitemap en Search Console ni indexación efectiva. Evidencia: `artifacts/audit/prelaunch-2026-10-05/sitemap-results.json` y copia del XML consultado en esa carpeta. No se modificaron sitemap, robots ni configuración de producción.

## Ficha de Google — revisión adicional

Estado: pendiente de identificar la ficha y confirmar elegibilidad.

- No se encontraron enlaces a Google Maps, `g.page` o una ficha de empresa en el HTML/JS público revisado. El `sameAs` del inicio solo declara Instagram. Las búsquedas por marca, dominio, cuenta de Instagram y teléfono no permitieron identificar inequívocamente una ficha de este negocio; esto no demuestra que no exista.
- Datos disponibles: PhoneSpot, `https://www.phonespot.site/`, WhatsApp `+5493447416011`, Instagram `phonespotsj`, Entre Ríos y menciones de San José, Colón, Villa Elisa y Concepción del Uruguay. Esas localidades no acreditan un domicilio comercial ni atención presencial. No se encontró dirección completa u horario comercial para contrastar con una ficha.
- Google exige contacto presencial con clientes para los negocios elegibles; una tienda exclusivamente online no es elegible. Confirmar si existe un local donde se atiende o si el negocio visita a los clientes. No asumir que el envío por transportistas convierte la tienda en un negocio de servicios locales. [Requisitos oficiales](https://support.google.com/business/answer/13763036?hl=es).
- Si ya existe una ficha, revisar titularidad/verificación desde la cuenta del propietario, nombre real, categoría principal, teléfono, sitio HTTPS, dirección o zona de servicio apropiada, ubicación, horarios y festivos, fotos reales y posibles duplicados. La dirección de un negocio de servicios locales sin atención en el domicilio debe ocultarse según las reglas aplicables. [Directrices de Google](https://support.google.com/business/answer/3038177?hl=es).
- Falta el enlace de la ficha y la confirmación del modelo de atención. No se verificaron reseñas, estado de verificación, titularidad ni datos dentro de Google Business Profile. No se creó ni modificó ninguna ficha.

## Favicon — revisión adicional

Estado: existe y se sirve correctamente; formato visual y cobertura pendientes de ajustar.

- Doce de las quince páginas HTML declaran `rel="icon"` apuntando a `uploads/PhoneSpot-trans.png`. Inicio, catálogo y una ficha pública confirmaron la declaración en producción.
- El archivo público responde HTTP 200 con `image/png`, es un PNG válido de 341 × 409 píxeles (51.759 bytes) y coincide exactamente con el archivo local por SHA-256. No está bloqueado por el robots revisado.
- No es cuadrado. Google exige proporción 1:1 para el favicon en búsquedas. Preparar un archivo dedicado cuadrado que preserve la proporción del símbolo, con margen apropiado y comprobar legibilidad en 16/32 píxeles; Google recomienda superar 48 × 48. [Requisitos de Google](https://developers.google.com/search/docs/appearance/favicon-in-search).
- Inspección visual del original: símbolo oscuro con forma de manzana/engranaje. No se verificó su renderizado efectivo en pestañas a 16/32 píxeles; queda pendiente comprobar contraste sobre los fondos del navegador.
- `compra-exitosa.html`, `recuperar.html` y `restablecer.html` no tienen una declaración de favicon. Unificarla en las quince páginas.
- `/favicon.ico` responde 404. No invalida el PNG declarado explícitamente, pero puede añadirse como alternativa para clientes que solicitan esa ruta. No se encontraron `apple-touch-icon` ni manifest de aplicación: son mejoras opcionales para accesos guardados en móviles, no requisitos para que funcione el favicon de pestaña.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/favicon-results.json`. No se modificó el logo compartido, no se generaron nuevos iconos y no se comprobó aparición en resultados de Google.

## Texto alternativo de imágenes — revisión adicional

Estado: atributo presente en los elementos revisados; mejoras de descripción y redundancia pendientes.

- Se inspeccionaron las etiquetas `<img>` en todos los HTML/JS públicos y las dos construcciones de imágenes por DOM detectadas en `script.js` (miniaturas y clon de animación). No se encontraron etiquetas sin `alt` en ese código. Se contrastaron el HTML servido de inicio, catálogo y ficha 73, y el JavaScript público; tampoco aparecieron atributos ausentes. Esta comprobación de código no equivale a probar todos los estados con lector de pantalla.
- Las imágenes de productos en tarjetas, carrito, ficha principal, relacionados, favoritos, asesor y comparación usan el nombre del producto como alternativa. Es una base útil; para la foto principal conviene describir el color/vista cuando aporten información relevante y se hayan comprobado contra la imagen real. La función `setProductImage()` cambia `src` sin actualizar el `alt`, que permanece como nombre genérico al cambiar foto/variante. No inventar colores ni características a partir de datos inconsistentes del catálogo.
- Los `alt=""` en miniaturas no son automáticamente errores: sus botones tienen `aria-label` para ver la foto. También las imágenes de resultados de búsqueda e historial de pedidos tienen el nombre del producto contiguo. El clon animado del carrito tiene `alt=""` y `aria-hidden="true"`, coherente con su finalidad decorativa.
- Mejorar las etiquetas de botones de miniatura: cuando hay color actualmente anuncian solo «Ver foto N de [color]»; pueden incluir también el producto y, si procede, una vista conocida. Mantener una etiqueta accesible única sin repetir el mismo contenido en imagen y botón.
- Los logos de marca del carrusel tienen alternativas con su nombre. La segunda serie de doce logos repite la primera para el movimiento y no está oculta a tecnologías de asistencia en el HTML revisado. Ocultar esa copia decorativa para evitar una lectura duplicada.
- El logo de cabecera suele anunciar «PhoneSpot Logo» seguido del texto visible «PhoneSpot». Cuando ambos pertenecen al mismo enlace, considerar `alt=""` para la imagen redundante y asegurar que el enlace conserva un nombre comprensible. No vaciar la alternativa de un enlace compuesto exclusivamente por una imagen.
- Aplicar alternativas según función: describir imágenes informativas, expresar la acción/destino si la imagen es el único contenido del control y dejar vacías las decorativas o redundantes. No rellenar todas con palabras clave SEO. [Árbol de decisión de W3C WAI](https://www.w3.org/WAI/tutorials/images/decision-tree/).
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/alt-results.json`. No se modificaron alternativas ni se hizo una revisión visual individual de todas las fotos o una prueba con lector de pantalla.

## Imágenes comprimidas — revisión adicional

Estado: optimización ya implementada para buena parte del catálogo; mejoras de entrega y subidas pendientes.

- El manifest de las 73 imágenes oficiales declara originales JPEG de 1600 × 1600 y miniaturas de 640 × 640. Peso de originales: 106.276–382.995 bytes, mediana 134.261. Miniaturas: 21.821–47.574 bytes, mediana 28.331. La suma de miniaturas es un 81,7 % menor que la suma de originales; esto compara ambas colecciones, no implica ese ahorro en todas las visitas.
- Las tarjetas principales usan `cardImageUrl()` para sustituir los originales oficiales por esas miniaturas. La ficha conserva la imagen completa. Una pareja pública verificada devolvió JPEG 200 con 230.845 bytes y 32.572 bytes respectivamente, conforme al manifest.
- El catálogo público de 332 productos referencia 1.483 URLs de imagen únicas, contando galerías: 1.409 terminan en WebP y 74 en JPG. La extensión no demuestra por sí sola calidad/peso óptimos. Cuatro imágenes importadas muestreadas devolvieron WebP 200 y pesaron 9.986–113.220 bytes; no se descargaron las 1.483 imágenes.
- Los tres banners JPEG v2 declarados en la configuración local y como valores por defecto pesan en producción 111.197, 92.128 y 167.105 bytes. Hay PNG antiguos de 1,4–2 MB en disco, pero no se detectaron referencias activas directas a ellos en las plantillas revisadas. No atribuir su peso a las visitas actuales sin una captura de red.
- Las miniaturas de galería usan URLs completas, pese a mostrarse pequeñas; aprovechar versiones pequeñas también allí. Carrito, búsqueda, relacionados y otros componentes pueden usar las originales. La transformación `cardImageUrl()` solo cubre la colección oficial; evaluar miniaturas para otras fotos cuando su peso/resolución lo justifiquen.
- No se encontraron `srcset` o `<picture>` en el código público revisado. Evaluar tamaños adaptados a la pantalla y formatos alternativos comparando calidad visual; el JPEG actual ya es comprimido y WebP/AVIF no garantizan por sí solos un resultado mejor.
- La subida administrativa permite hasta 5 MB por archivo y `storeProductImage()` valida y almacena los bytes sin redimensionar/recomprimir. Crear versiones de entrega optimizadas para nuevas fotos conservando un original útil; no recomprimir reiteradamente el mismo archivo.
- Las imágenes locales muestreadas tienen caché de un día; las de Supabase muestreadas, un año. Hay carga diferida en tarjetas fuera de las primeras seis y en parte de las miniaturas; la foto principal tiene prioridad alta. El ahorro por compresión gzip/Brotli de HTML/JS no debe presentarse como ahorro de imágenes.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/compression-results.json`. No se cambiaron archivos ni se realizó una comparación visual de nuevas conversiones o una nueva medición de LCP con red móvil.

## Velocidad de carga — revisión adicional

Estado: optimizaciones técnicas confirmadas; rendimiento visual móvil y Core Web Vitals todavía sin certificar.

- Se realizaron tres GET HTTPS por ruta desde el equipo de auditoría, sin navegador, limitación móvil ni ejecución de JavaScript. Todos devolvieron 200. Son muestras puntuales de respuesta/transferencia, no tiempo hasta que la página queda visible o utilizable.
- Brotli activo en producción: inicio 29.310 → 6.957 bytes (76,3 % menos); catálogo 23.434 → 5.822 (75,2 %); ficha 73 26.731 → 4.663 (82,6 %); `script.js` 241.385 → 51.458 (78,7 %); CSS principal 106.734 → 22.920 (78,5 %).
- Tiempos hasta cabeceras en esas muestras: inicio 281–306 ms; catálogo 284–369 ms; ficha 377–432 ms; API de productos 494–656 ms. La primera petición preliminar a inicio no forma parte de esos intervalos. No representan percentiles de visitantes reales ni una prueba con caché/servidor fríos.
- El catálogo completo ocupa 933.446 bytes descomprimidos, aunque viaja en 37.396 bytes Brotli. La transferencia ya es compacta; investigar coste de JSON/render y cantidad de tarjetas antes de justificar paginación o respuestas más pequeñas. El script compartido también contiene lógica de numerosas páginas; evaluar división/minificación a partir de cobertura y perfil de CPU, sin eliminar código por su tamaño solamente.
- La API declara `no-store`, apropiado para evitar precios/stock obsoletos. El JS versionado declara caché de un día. No aplicar caché larga indiscriminadamente al catálogo o datos personales. La respuesta de inicio consultada no incluyó ETag, por lo que no se confirmó revalidación 304 en producción en esta muestra; la prueba local anterior sí la había verificado.
- Imágenes de tarjetas optimizadas y carga diferida ya descritas en el apartado anterior. La ficha da prioridad alta a la imagen principal, pero la descubre al generar su contenido con JavaScript: el servidor inyecta SEO, no la ficha visual completa.
- El render inicial de la ficha espera conjuntamente cotización, producto y reseñas. Separar la presentación esencial de respuestas no esenciales, especialmente reseñas, puede reducir esperas; falta cuantificarlo con una traza de navegador. Inicio/catálogo también esperan la cotización para presentar precios. Hay skeletons y solicitudes de catálogo compartidas en una promesa para evitar duplicaciones dentro de la página.
- Hay CSS externo de Font Awesome en el `<head>` y varios scripts compartidos al final del documento. No se midió su impacto de bloqueo/CPU; no se recomienda cambiar orden o añadir `async` sin respetar dependencias y probar el resultado.
- Existe instrumentación `web-vitals` para LCP, INP y CLS y agregación de p75 por dispositivo en el endpoint administrativo. No se consultaron muestras reales ni Search Console/CrUX. Los objetivos buenos son LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1, evaluados en p75 por móvil/escritorio. [Criterios actuales](https://web.dev/articles/vitals).
- La habilidad `web-perf` se consultó, pero su flujo de trazas Chrome DevTools MCP no pudo ejecutarse porque esas herramientas no están disponibles en esta sesión. Se completó la revisión con HTTP y código. Falta una medición de navegador con red/CPU móvil, LCP/CLS/TBT, interacciones y datos reales; no hay puntuación Lighthouse ni certificación de Core Web Vitals en este apartado.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/speed-results.json`. No se modificó la aplicación ni se publicaron cambios.

## Contraste de colores — revisión adicional

Estado: dos problemas medidos; cumplimiento global todavía no certificado.

- Se revisaron en Chrome sin ventana seis rutas públicas (inicio, catálogo, ficha 73, garantías, login y checkout) a 1440 y 390 píxeles. Se bloquearon las peticiones distintas de GET para evitar escrituras. Se midieron colores calculados por navegador y fondos sólidos, incluyendo composición de transparencias; se excluyeron fondos con imágenes/degradados y opacidad de ancestros que requerían análisis visual.
- Criterio usado: texto normal ≥ 4,5:1; texto grande ≥ 3:1 (24 CSS px, o aproximadamente 18,67 px con peso ≥ 700). Comparación sin redondear; las cifras mostradas se redondean solo para lectura. [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **Garantías, botón «Consultar por WhatsApp»:** blanco `#fff` sobre verde `#25d366`, ratio **1,983:1**. Falla en escritorio (16 px, peso 600) y móvil (15 px, peso 600), que necesitan 4,5:1. Oscurecer el verde o usar texto oscuro; contrastar también el icono y estados hover/foco tras el ajuste.
- **Login móvil, «o usa tu email»:** `rgb(139,145,166)` sobre blanco, ratio **3,135:1**; 12,16 px y peso 700, por lo que necesita 4,5:1. Usar un gris más oscuro que cumpla sobre el fondo real; negrita por sí sola no resuelve este caso.
- En los otros textos medidos sobre fondos sólidos no se detectaron ratios inferiores al umbral aplicado. Esto es una muestra de páginas/estados, no prueba de todo el sitio o todas las variantes del catálogo.
- No se encontró un selector funcional de tema oscuro; existen algunas reglas residuales `.dark-mode` y `[data-theme="dark"]`, pero no acreditan un tema disponible. No se forzó un tema artificial ni se certificó contraste oscuro.
- Falta revisar placeholders, pseudo-elementos, iconos, bordes necesarios para identificar controles, foco, hover, errores y estados activos. Los elementos gráficos/controles esenciales requieren contraste 3:1 contra colores adyacentes según el criterio aplicable; no todo borde decorativo debe cumplirlo. [WCAG, contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/contrast-results.json`. No se cambiaron colores ni se publicó nada.

## Visualización móvil — revisión adicional

Estado: buena adaptación en las páginas muestreadas a 390/430 px; defecto confirmado en checkout a 320 px.

- Se recorrieron seis rutas públicas (inicio, catálogo, ficha 73, carrito vacío, checkout sin pedido y login) a 320, 390 y 430 CSS px, con emulación táctil y móvil en Chrome. Son 18 combinaciones. Se bloquearon peticiones distintas de GET; no se crearon pedidos, cuentas o reservas.
- No hubo errores JavaScript ni imágenes visibles cargadas con error en esas muestras. Todas declaran viewport. No se encontraron botones/input/select visibles con alguna dimensión inferior a 24 px; no se midió exhaustivamente el espaciado de todos los enlaces o elementos personalizados, por lo que esto no certifica WCAG 2.5.8.
- A 390/430 px, el ancho de documento y viewport coincidió con el configurado. A 320 px ocurrió lo mismo salvo checkout. Las capturas de inicio, catálogo, ficha y checkout a 390 muestran contenido ajustado; el catálogo usa dos columnas y la ficha/formulario se apilan. El aviso de cookies aparece sobre contenido en la primera visita y puede cerrarse: revisar ese estado junto con los cambios de consentimiento ya pendientes.
- El menú del inicio se abrió/cerró y actualizó `aria-expanded`. Una captura inicial durante la animación no era representativa; se repitió tras 700 ms y se confirmó que muestra navegación legible, categorías y acceso a cuenta dentro de la pantalla de 390 px.
- **Checkout a 320 px:** `innerWidth`/ancho de documento fue 380 px pese a que `visualViewport.width` permaneció en 320 y escala 1. La fila de cupón deja el botón «Aplicar» entre x=263,6 y x=380,1, fuera del ancho visible. El aviso de cookies también se extiende hasta x=360 en ese estado. No es suficiente comprobar `scrollWidth <= innerWidth`, porque ambos reflejan el área ampliada. Ajustar el flex del cupón (`min-width: 0` en el input y/o apilado en pantalla estrecha), y volver a comprobar que todo cabe sin recortes. El formulario superior sí se ve adaptado en la captura de 320 px; el defecto está en contenido posterior.
- Comprobar el reflujo a 320 CSS px ayuda también con usuarios que amplían contenido. [WCAG, reflujo](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Los objetivos táctiles mínimos tienen reglas y excepciones de tamaño/espaciado; 44 px puede ser una mejora de comodidad, pero no se presentó como mínimo universal AA. [WCAG, tamaño de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Las pruebas aisladas anteriores cubrieron carrito con productos y confirmación de checkout a 360/390 px. Este recorrido público no completó compra ni probó teclado virtual, orientación horizontal, Safari/iOS o un dispositivo físico. Mantener esas verificaciones pendientes, junto con contraste y rendimiento móvil ya documentados.
- Evidencia y capturas: `artifacts/audit/prelaunch-2026-10-05/mobile/results.json`, `detail-results.json` y PNG de esa carpeta. No se modificó CSS ni se publicó nada.

## Página 404 personalizada — revisión adicional

Estado: falta página personalizada y corregir el HTTP de fichas inexistentes.

- Tres rutas públicas inexistentes, incluida `/404.html`, respondieron **404** con la página predeterminada de Express: título «Error», idioma inglés y `Cannot GET ...`. El código es correcto, pero no hay diseño PhoneSpot ni enlaces para continuar navegando. No existe archivo 404 dedicado en `public` ni manejador final personalizado de rutas desconocidas en el servidor revisado.
- Una ficha con ID inexistente (`/producto.html?id=2147483647`) y la ficha sin ID devolvieron **200** con la plantilla genérica. En el código, la ausencia de producto pasa a la plantilla estática (`next()`); el JavaScript muestra luego un error. Debe responderse 404 desde el servidor para productos ausentes, evitando una posible soft 404. No presentar fallos temporales de base de datos como productos inexistentes: conservar tratamiento 5xx para errores del servicio. [Google y estados HTTP](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes).
- La API de producto inexistente devuelve 404 JSON correctamente. Una ruta API desconocida devuelve 404 HTML genérico; conviene conservar respuestas JSON coherentes en API al agregar la página para navegación humana.
- Preparar una página ligera en español con «No encontramos esta página», identidad PhoneSpot y enlaces a inicio/catálogo, adaptable a móvil. Servirla con `res.status(404)` manteniendo la URL solicitada; no redirigir todos los errores a inicio ni devolver 200 por usar una plantilla personalizada. Si usa recursos locales, usar rutas absolutas para que funcionen también desde rutas anidadas.
- Los productos archivados ya tienen una rama 404, pero con texto plano «Producto no disponible». Puede reutilizar la presentación personalizada sin perder ese estado. No se consultó una ficha archivada en producción en esta muestra.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/notfound-results.json`. No se creó una página ni se modificaron rutas o despliegue.

## Enlaces rotos — revisión adicional y corrección local

Estado: no se encontraron 404 en los destinos de navegación comprobados; enlace de correo desactualizado corregido localmente y destinos legales pendientes.

- Se extrajeron 140 referencias de enlaces literales de los HTML/JS públicos y del carrusel devuelto por `/api/settings`. Hay 28 destinos únicos; se comprobaron 25 por GET: los 23 internos y una muestra por cada uno de los dos hosts externos. Los tres destinos restantes son otras variantes de Instagram/WhatsApp. Se excluyeron `mailto`, `tel`, acciones `javascript`, `#` de control y expresiones dinámicas de plantilla.
- Los 23 destinos internos devolvieron 200, incluyendo categorías, login, registro, recuperación, carrito, checkout, comparación y plantillas de cuenta/administración. El 200 de una plantilla privada no comprueba autorización o sus datos: aquí solo se comprobó navegación.
- No se encontraron anclas estáticas a IDs ausentes en los destinos locales revisados. El informe anterior de sitemap comprobó por HTTP cinco fichas; no se rastrearon individualmente todos los enlaces dinámicos de productos/variantes. El problema de productos inexistentes con respuesta 200 está en el apartado 404.
- Instagram `phonespotsj` devolvió 200 con título del perfil, y `wa.me/5493447416011` redirigió a la página de compartir WhatsApp con 200. Esto confirma acceso al destino, no titularidad o disponibilidad del número; no se enviaron mensajes.
- **Corrección realizada en `server.js`:** el enlace por defecto del endpoint de correos de ofertas apuntaba a `https://phonespot.com.ar/catalogo.html`, distinto del dominio público de la tienda. Ahora se deriva de `publicAppUrl` y termina en `/catalogo.html`. Se conserva el enlace explícito proporcionado por el administrador. La disponibilidad del dominio viejo no pudo confirmarse con el navegador web de investigación; la corrección evita depender de ese destino ajeno a la configuración actual.
- Se comprobó `node --check server.js` y `git diff --check`, ambos correctos. No se invocó el endpoint de marketing ni se enviaron correos, y la corrección todavía no está desplegada. Confirmar el `PUBLIC_APP_URL` de producción, ya pendiente en HTTPS.
- El botón «Ver Políticas» abre términos, no privacidad. El destino responde 200, pero no cumple lo que promete el texto. No se inventó ni enlazó una página inexistente: resolverlo junto con la política real de privacidad/cookies. Los enlaces a aviso legal y privacidad deberán añadirse cuando estén preparadas.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/links-results.json`. No se certificó la totalidad de enlaces configurables, contenido de cuentas, variantes de catálogo o destinos externos.

## Formularios protegidos contra spam — revisión adicional

Estado: protección parcial; no marcar este punto como completamente resuelto.

### Controles existentes

| Operación | Límite local por IP |
|---|---|
| Registro | 5 solicitudes/hora |
| Login | 10/15 minutos |
| Login Google | 15/15 minutos |
| Solicitud de recuperación | 5/hora |
| Restablecimiento | 8/hora |
| Creación de pedidos | 12/15 minutos |
| Consulta de resultado de pedido | 30/minuto |
| Actualización de carrito | 90/15 minutos |
| Actualización de perfil autenticado | 20/15 minutos |
| Eventos/telemetría | 30/minuto mediante limitador específico |

- El middleware devuelve 429 con `Retry-After`. Prueba aislada de su código: cinco solicitudes permitidas, sexta rechazada, otra IP independiente y restablecimiento al vencer la ventana; todo correcto. No se enviaron ráfagas a producción.
- Hay validación en servidor, límite de JSON de 1 MB, verificación de email para completar el registro, tokens temporales de recuperación, autenticación para reseñas y controles de rol para formularios administrativos. Las reseñas requieren un pedido relacionado y se insertan con `approved: false`. Son controles útiles, pero no sustituyen límites de abuso específicos.
- La deduplicación de alertas por producto/email y la idempotencia de pedidos evitan ciertas repeticiones; no impiden spam con direcciones o claves diferentes.

### Pendientes

- **El deslizador de registro no constituye una verificación anti-bot:** `isHuman` solo se modifica durante la animación; el manejador de submit no lo consulta y envía nombre/email/contraseña sin token. El servidor tampoco valida una prueba humana. No se considera protección efectiva aunque visualmente muestre «Verificado».
- **Alertas de stock públicas:** sin limitador por IP/email en la ruta. Pueden generar suscripciones no solicitadas a terceros. Añadir control de frecuencia y confirmar el correo antes de activar la alerta cuando corresponda; valorar una verificación anti-bot real según el abuso esperado.
- **Reseñas:** autenticación, compra y moderación presentes, pero no limitador explícito por usuario/producto ni deduplicación en el manejador. Revisar también restricciones reales de la tabla antes de afirmar que una cuenta puede crear duplicados ilimitados.
- **Cotización de envío:** sin límite explícito; aunque hoy usa tarifas locales/configuración y no un transportista externo, puede generar carga repetida. Aplicar límites proporcionados a su uso.
- **Límites en memoria:** los buckets son `Map` del proceso, con limpieza periódica. Se pierden al reiniciar y no se comparten entre réplicas. Para producción con múltiples instancias, usar un contador compartido o una capa de borde; combinar límites por IP y destinatario/cuenta según operación para evitar abuso distribuido y bloqueos excesivos a usuarios de redes compartidas. Verificar que `trust proxy: 1` coincide con la cadena real de proxies. [OWASP, controles de abuso y recursos](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html).
- No se encontró integración Turnstile/reCAPTCHA validada en servidor ni honeypot. Un CAPTCHA no es obligatorio para toda operación, pero si se incorpora debe validarse del lado servidor antes de crear cuentas, enviar correos o guardar suscripciones. [Validación oficial de Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
- CORS y CSP no son controles anti-bot suficientes: un cliente automatizado puede llamar directamente a la API sin depender del formulario del navegador. No se comprobó una protección adicional de bots/WAF en el hosting.

Evidencia: código de rutas y formularios, y `artifacts/audit/prelaunch-2026-10-05/spam-results.json`. No se modificaron formularios ni se crearon cuentas, alertas, reseñas, pedidos o correos durante esta comprobación. La prueba del limitador es local, no certifica su funcionamiento detrás del proxy en producción.

## Botón de WhatsApp visible — revisión adicional

Estado: visible y accesible en escritorio; en móvil solo se encuentra tras desplazarse al contacto/pie de página.

- Se comprobó el acceso generado `.social-dock__whatsapp` en inicio, catálogo y ficha 73 a 1440 y 390 px. Existe en las seis combinaciones, con `aria-label="Consultar por WhatsApp"`, destino `wa.me/5493447416011`, mensaje prellenado y apertura en nueva pestaña con `noopener noreferrer`. Coincide con el número de contacto mostrado en la web. No se envió ningún mensaje ni se confirmó titularidad del número.
- Escritorio: acceso fijo inferior derecho de 50 × 50 px, completamente dentro del viewport y con su centro alcanzable en las tres rutas. En el inicio tampoco quedó tapado por el aviso de cookies en el estado medido.
- Móvil: una regla `@media (max-width: 768px)` lo convierte en acceso estático del footer, con icono y texto «WhatsApp», aproximadamente 126 × 44 px. Al entrar no está en pantalla: posición vertical inicial de unos 5.655 px en inicio, 8.600 px en catálogo y 3.640 px en ficha en las muestras. No confundir que exista en DOM con que sea visible inmediatamente.
- Tras desplazarse hasta el botón, quedó completamente visible y su centro alcanzable en las tres rutas móviles. El inicio además tiene un botón «Consultar por WhatsApp» en la sección de contacto y enlaces adicionales en el footer, pero no un acceso de WhatsApp en la primera pantalla de móvil.
- Si el requisito es disponibilidad inmediata en móvil, incorporar un acceso en cabecera/menú o un botón flotante compacto cuya posición respete carrito, compra y aviso de cookies. La versión estática evita solapamientos, pero requiere llegar al final: este punto no está totalmente resuelto para ese requisito.
- La prueba móvil reutilizó almacenamiento del navegador tras cerrar el aviso en el recorrido de escritorio; no se volvió a comprobar una primera visita móvil con cookies visibles. El problema de contraste del botón verde de garantías sigue pendiente por separado.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/whatsapp-results.json` y capturas `whatsapp-1440.png`/`whatsapp-390.png`. No se modificó ubicación, número o estilos.

## Analítica instalada — revisión adicional

Estado: analítica propia instalada y con eventos almacenados; calidad del embudo y privacidad pendientes de ajustar.

- No se encontró instalación GA4/GTM en el código público revisado ni etiquetas de esos servicios en el HTML del inicio servido. Permitir un dominio en CSP no acredita una instalación de ese servicio. No es necesario instalar Google Analytics para afirmar que existe analítica: la tienda implementa la suya mediante `/api/events` y `site_events`.
- Consulta agregada de solo lectura en Supabase, últimos 30 días: **653 `page_view`, 579 `product_view`, 32 `add_to_cart`, 9 `checkout_started`, 2 `search_empty`, 145 `web_vital`**. No hubo eventos `search`, `contact_click` u `order_created` en esa consulta. Su ausencia no prueba por sí sola un fallo: puede no haber actividad o eventos aún no emitidos. No se interpretaron estos recuentos como visitantes únicos o sesiones.
- La librería pública `/vendor/web-vitals.js` responde 200. El endpoint `/api/admin/analytics` responde 401 sin autenticación; el servidor exige cuenta administradora. El panel está implementado y resume 30 días, con pedidos confirmados e importes derivados de pedidos, pero no se abrió una sesión administradora durante esta revisión.
- Hay datos de rendimiento agregados, ampliando la comprobación previa de velocidad: escritorio p75 LCP 864 ms (29 muestras), INP 70 ms (20), CLS 0,0145 (30); móvil LCP 763 ms (34), INP 40 ms (5), CLS 0,0816 (27). Son muestras pequeñas y mezcladas de rutas; no se comprobó representatividad, exclusión de bots/pruebas, instrumentación completa o CrUX. No certifican cumplimiento general de Core Web Vitals. El panel usa un percentil por posición; esta consulta SQL usa `percentile_cont`, que puede interpolar.
- **Corregir semántica del embudo:** `add_to_cart` se emite antes de confirmar la operación y antes de ciertas validaciones; puede contar intentos fallidos. Las adiciones por cantidad de variantes usan otra ruta y no pasan por ese emisor. `checkout_started` se emite tanto al navegar a checkout como al enviar el formulario; puede contar dos veces o aumentar por reintentos. Separar intentos de éxitos y definir claramente qué se considera inicio/compra.
- `contact_click` solo escucha enlaces dentro del dock social y agrupa Instagram con WhatsApp. No cubre todos los botones de contacto del sitio ni distingue canal. Registrar los accesos relevantes de forma coherente si se necesita medir contactos por canal.
- Las vistas de página se deduplican en `sessionStorage` por ruta y query de la pestaña; el evento guarda solo pathname. No hay identificador de visitante/sesión ni atribución por UTM/referrer en el esquema del emisor revisado, por lo que no se puede reconstruir un embudo individual, usuarios únicos o rendimiento de campañas a partir de esos conteos.
- El endpoint recibe eventos públicos y acepta tipos operativos como `order_created`; esos conteos no deben usarse como comprobante de venta. El panel ya deriva pedidos de la tabla de pedidos, lo cual evita depender de un evento de cliente para los totales comerciales. Limitar y separar emisores según confianza, y comprobar exclusión de pruebas/tráfico interno. El p75 y contactos/búsquedas usan hasta 10.000 eventos recientes y, al superar ese límite, dejan de representar todo el periodo de 30 días.
- La analítica se inicia sin esperar el botón de cookies y usa almacenamiento de sesión. Actualizar la información de privacidad y el modelo de consentimiento según los tratamientos reales, como ya consta en esos apartados; no añadir GA4 u otros proveedores automáticamente.
- Evidencia: `artifacts/audit/prelaunch-2026-10-05/analytics-aggregate-results.json` y `analytics-http-results.json`. Se usó la habilidad Supabase para las consultas agregadas. No se consultaron identidades de visitantes, enviaron eventos nuevos ni modificó la instrumentación.

## Evidencias y límites

- Resultados de nueve recorridos aislados: `artifacts/audit/prelaunch-2026-10-05/fixture-results.json`.
- Revisión de las 20 rutas: `artifacts/audit/improvements-2026-10-02/regression/results.json`, regenerado en esta auditoría. La fecha del directorio pertenece al ejecutor original.
- Capturas: carpetas de auditoría de carrito, checkout, portada, ofertas e imágenes bajo `artifacts/audit/`.
- Ejecutor local auxiliar: `.tmp/prelaunch-fixtures.cjs`; inicia un servidor de archivos estáticos y ejecuta pruebas con APIs simuladas.

No se ejecutaron las pruebas que crean pedidos o cuentas en Supabase. La integridad transaccional y concurrencia del SQL se revisaron por código y metadatos; falta ejercitarlas en una base de prueba. No se enviaron correos reales, no se verificó un login Google interactivo y no se validó entrega de notificaciones. Las comprobaciones del dominio público fueron lecturas y no equivalen a completar una compra real en producción.
