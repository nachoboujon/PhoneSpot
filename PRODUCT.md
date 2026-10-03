# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El público principal son personas que compran tecnología al por mayor para sus negocios. Buscan productos al mejor precio posible para su actividad comercial.

## Product Purpose

PhoneSpot permite explorar productos tecnológicos y hacer pedidos en línea. Para el público principal, el éxito consiste en encontrar con facilidad productos adecuados para su negocio, entender el precio y recibir atención rápida durante la compra.

## Positioning

PhoneSpot busca diferenciarse por la calidad y rapidez de su atención ante consultas y necesidades del cliente. La atención inmediata es una intención del negocio; no hay un tiempo de respuesta medido o garantizado en el repositorio.

## Operating Context

El sitio actual ofrece un catálogo público, búsqueda, filtros, variantes, carrito, cuentas de cliente, pedidos y seguimiento. Al finalizar un pedido, la coordinación del pago y del envío continúa por WhatsApp. Existe un área administrativa para gestionar catálogo y pedidos.

## Capabilities and Constraints

- El sitio es una aplicación web con frontend estático, API Node.js/Express y persistencia en Supabase.
- El pago no se procesa dentro del sitio. Se crea el pedido y se coordina por WhatsApp.
- Los precios se conservan en USD y se convierten a ARS según la cotización configurada.
- El sitio admite pedidos como invitado y con cuenta. Conserva las reglas existentes de descuento en equipos elegibles: desde 3 unidades USD 5 c/u, desde 5 USD 7 c/u y desde 10 USD 10 c/u. La elegibilidad y los tramos se comparten entre tienda y servidor; no se agregaron descuentos ni condiciones comerciales nuevas.
- La claridad y el orden del contenido son prioridades para que los clientes encuentren y entiendan los productos.

## Brand Commitments

El nombre existente es PhoneSpot. La comunicación del sitio usa español de Argentina y trato directo de «vos». El usuario confirmó la calidad y rapidez de atención como compromiso central.

## Evidence on Hand

- `README.md` y `PhoneSpot/01 Producto/Visión de producto.md` describen la arquitectura y las capacidades actuales.
- `public/` contiene el sitio y los recursos de producto; `public/uploads/PhoneSpot-trans.png` es el logotipo utilizado.
- La afirmación sobre el público mayorista y el diferencial de atención proviene de la respuesta del usuario durante esta inicialización.
- No hay evidencia aportada de tiempos de respuesta, testimonios ni condiciones mayoristas concretas.

## Product Principles

1. Priorizar la búsqueda y evaluación de productos para clientes que compran para su negocio.
2. Presentar información comercial clara y fácil de encontrar.
3. Facilitar el contacto y la continuidad de la atención durante el pedido.
4. Mantener visibles las condiciones reales de compra sin inventar promesas ni reglas mayoristas.
