# Auditoría del sitio PhoneSpot — 29/09/2026

## Alcance y resultado

Se probaron las 15 rutas HTML en escritorio (1440 × 900) y móvil (390 × 844), la navegación pública, catálogo, filtros, ordenamiento, ficha de producto, carrito y búsqueda. `npm test` pasó. Las rutas públicas cargaron; checkout, perfil y administración redirigen al inicio de sesión sin autenticación. No se detectó desbordamiento horizontal del documento ni imágenes de producto rotas. El catálogo consultado mostró 19 productos, todos en la categoría celulares.

No se completaron registro, inicio de sesión, pago ni pedidos: el entorno local usa una base Supabase que puede contener datos reales. El intento de agregar un producto al carrito no produjo un carrito visible; faltan datos para atribuirlo al frontend o al backend. Las respuestas 429 aparecieron tras muchas visitas automáticas rápidas y no se consideran un fallo confirmado de uso normal.

## Salud técnica: 10/20 (aceptable, requiere mejoras importantes)

| Dimensión | Nota /4 | Evidencia principal |
|---|---:|---|
| Accesibilidad | 2 | Los títulos de filtros son `div` con `onclick`, sin rol ni activación por teclado; búsquedas sin etiqueta visible. |
| Rendimiento | 2 | Imágenes promocionales PNG pesadas; falta medir Core Web Vitals con datos reales antes de cuantificar el impacto. |
| Diseño adaptable | 2 | No hay desbordamiento horizontal, pero el contenido principal queda muy abajo y los accesos flotantes lo cubren. |
| Temas y tokens | 2 | Existen variables CSS y ajustes de movimiento; persisten numerosos colores y estilos en línea, con lenguaje visual dispar. |
| Integridad de implementación | 2 | El diseño sirve para vender tecnología, pero la propuesta mayorista del negocio apenas se refleja en jerarquía, mensajes y catálogo. |

**Veredicto de integridad:** hay una base visual reconocible (blanco, negro, fotografía de producto), pero la experiencia no expresa de forma consistente la compra mayorista ni la atención inmediata que diferencia a PhoneSpot. El detector de Impeccable arrojó 156 coincidencias brutas, incluidas repeticiones y falsos positivos. Por ejemplo, contó como imágenes sin texto alternativo 19 GIF ocultos de 1 × 1 usados por tarjetas; no se reportan como problema visual. Se priorizaron solo hallazgos revisados en código y navegador.

## Hallazgos priorizados

### P1 — El catálogo móvil demora el acceso a los productos

La primera pantalla contiene encabezado, banner, cuatro grupos de filtros y ordenamiento antes de la primera tarjeta. La tarea principal del comprador, ver productos y precios, queda fuera de la pantalla inicial. Véase [captura del catálogo móvil](./catalogo-mobile.png) y `public/catalogo.html`.

**Acción:** reducir la altura del encabezado comercial y presentar filtros en un único botón o panel móvil; mostrar título, conteo y primeras tarjetas en la primera pantalla.

### P1 — Accesos flotantes cubren contenido en móvil

Instagram y WhatsApp ocupan ambos extremos inferiores y se superponen con títulos, formularios y tarjetas, especialmente en la [portada móvil](./index-mobile.png), el [producto móvil](./producto-real-mobile.png) y la [pantalla de acceso móvil](./checkout-mobile.png). Los estilos están en `public/style.css` (`.instagram-follow-cta`, `.whatsapp-float`).

**Acción:** reservar espacio inferior cuando haga falta y simplificar a un acceso de contacto prioritario en móvil; evitar superposición sobre campos y botones.

### P1 — Filtros no operables de forma semántica por teclado

En `public/catalogo.html:141,162,172,192`, los controles desplegables son `div.filter-title` con `onclick`. Un usuario que navega con teclado no recibe un botón enfocable ni un estado expandido anunciado. Afecta accesibilidad y compatibilidad con ayudas técnicas.

**Acción:** usar `<button>` con `aria-expanded` y `aria-controls`, y conservar un foco visible. Corresponde a WCAG 2.1.1 (teclado) y 4.1.2 (nombre, función, valor).

### P1 — La propuesta mayorista queda relegada

El negocio, según el contexto aportado, atiende a compradores que revenden y compiten por precio, y se diferencia por responder enseguida. La portada habla de tecnología “premium” y “para vos”; las fichas no colocan condiciones de compra mayorista ni canales de respuesta en la zona principal. El catálogo muestra categorías vacías (notebooks, tablets y accesorios) mientras los 19 productos actuales son celulares. Véanse [portada](./index-desktop.png) y [catálogo](./catalogo-desktop.png).

**Acción:** reescribir título, subtítulo y beneficios para compra de negocio; mostrar claramente precios, stock, condiciones de volumen verificadas y contacto inmediato. Ocultar o desactivar categorías sin productos hasta contar con inventario. Validar reglas comerciales antes de publicar precios por volumen.

### P2 — Ficha de producto extensa antes de precio y acción

En móvil, la imagen ocupa casi toda la primera pantalla; título, precio y botón de compra quedan por debajo. En escritorio hay espacio vacío considerable arriba y una imagen relativamente pequeña dentro de varios contenedores. Véanse [producto móvil](./producto-real-mobile.png) y [producto de escritorio](./producto-real-desktop.png).

**Acción:** compactar galería y márgenes, y acercar título, precio, stock, variantes y acción principal. Considerar barra de compra fija móvil solo después de resolver la superposición de accesos flotantes.

### P2 — La búsqueda puede perder la primera consulta

`public/script.js:2839` carga productos al recibir foco; `public/script.js:2848` oculta sugerencias si la descarga todavía no terminó. Si alguien escribe antes de la respuesta, no se vuelve a ejecutar la búsqueda al llegar los datos hasta que escriba otra tecla. La prueba rápida reprodujo sugerencias ocultas. Es un problema de sincronización corroborado por el código.

**Acción:** al terminar la descarga, ejecutar la búsqueda usando el valor actual del campo; añadir estado de carga y manejar errores.

### P2 — Carrito vacío con resumen y pago activos

`public/carrito.html:45-55` muestra “Envío Gratis”, total `$0` y “Proceder al Pago” incluso cuando aparece “Tu carrito está vacío”. La pantalla sugiere un siguiente paso que aún no corresponde. Véanse [carrito móvil](./carrito-mobile.png) y [carrito de escritorio](./carrito-desktop.png).

**Acción:** ocultar resumen y pago hasta que haya artículos; dar prioridad a “Ver productos”. Mostrar el cálculo de envío cuando se conozca el carrito y el destino.

### P2 — Recursos de Google bloqueados por la política de contenido

La consola indica bloqueo de `https://accounts.google.com/gsi/style` en acceso y registro. La política `style-src` en `server.js:69` no incluye ese origen. El botón de Google se dibuja, pero se debe verificar su funcionamiento con una cuenta de prueba antes de afirmar que el acceso está roto.

**Acción:** permitir únicamente el origen requerido por Google Identity Services y hacer una prueba de inicio de sesión controlada.

### P2 — Imágenes promocionales grandes y estilos dispares

`hero-graphite-accessories-v1.png` pesa 1,96 MB y `phones-3d-showcase-v1.png` 1,43 MB; otras imágenes promocionales superan 1 MB. Hay carga diferida en al menos una imagen, pero conviene ofrecer tamaños móviles y formatos WebP/AVIF. La portada usa fotografía oscura y sobria, mientras la pantalla de acceso usa una ilustración caricaturesca; además aparecen acentos azules, verdes y naranjas sin una regla visual clara.

**Acción:** generar variantes responsivas de imágenes y unificar paleta, ilustraciones, estados y jerarquía tipográfica en tokens reutilizables. Medir LCP antes y después.

## Aspectos que funcionan

- Todas las rutas públicas respondieron y las páginas móviles no generaron desplazamiento horizontal del documento.
- El ordenamiento por precio funcionó en la prueba; las tarjetas llevan a una ficha real con precio, stock y variantes.
- Hay etiquetas alternativas descriptivas para imágenes visibles de portada y ajustes CSS para movimiento reducido.
- El encabezado y la marca mantienen una base visual sobria y clara.

## Orden de trabajo sugerido

1. `$impeccable adapt`: catálogo y producto móvil; despejar accesos flotantes.
2. `$impeccable harden`: filtros con teclado, buscador, carrito vacío y política CSP.
3. `$impeccable clarify`: mensajes y jerarquía para comprador mayorista, con condiciones comerciales validadas.
4. `$impeccable optimize`: imágenes promocionales y medición de rendimiento.
5. `$impeccable polish`: coherencia visual final y revisión de todos los tamaños.

Repetir `$impeccable audit` después de los cambios para comprobar la mejora.
