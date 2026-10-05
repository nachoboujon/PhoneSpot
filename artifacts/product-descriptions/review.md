# PhoneSpot: banners y descripciones

Revisión local del 5 de octubre de 2026. Sin despliegue ni modificación de precios, stock o variantes.

Carrusel principal: iPhone 18, Xiaomi 17 y JBL. El banner JBL usa las fotos comerciales del Charge 6 y Tune 770NC y enlaza al catálogo de audio de JBL. Los dos videos continúan reproduciéndose durante los cambios de slide.

332 productos: 286 descripciones resumidas a partir de fuentes oficiales y 46 fichas con datos del catálogo. Se conserva la condición comercial original. No se copiaron especificaciones de modelos con nombres parecidos.

Las fuentes por producto están en public/product-descriptions.json. La API pública y la vista de productos aplican estas descripciones; la base de datos del administrador mantiene sus textos originales.

## Fichas pendientes de validar

- 510: Blulory RTS
- 491: Itel Fit 020
- 454: Audisat X88 Boom
- 453: Audisat X80 Plus
- 452: Audisat X5 Power
- 451: Audisat X5 Play
- 450: Audisat X10
- 411: Atouch WE6 5G WiFi
- 409: MOX pro MO-TP1082
- 402: Cidea CM86
- 399: Cidea CM10000 Plus
- 397: Cidea CM516
- 382: Lenovo Tab K9
- 381: Keen KN90
- 379: Hotwav Tab R10 Pro
- 375: Amazon Kindle 11
- 339: HP Victus 15-fb3093dx
- 338: HP Victus 15-fa2013dx
- 337: HP OmniBook 3 15-fn0505nr
- 336: HP Victus 15-fb3113dx
- 330: HP Laptop 15-fd2050wm
- 329: HP Laptop 15-fd0182wn
- 328: HP Laptop 15-fd0173wm
- 327: HP Laptop 15-fd0153wm
- 326: HP Laptop 15-fd0150wn
- 325: HP Laptop 15-fd0133wm
- 324: HP Laptop 15-fd0084wm
- 323: HP Laptop 15-fc0146dx
- 322: HP Laptop 15-dy5009la
- 321: HP Laptop 14-ep0355cl
- 320: HP Laptop 14-dq6105dx
- 319: Dell Alienware 15 DA15265
- 318: Dell 15 D15260
- 315: Dell Inspiron 16 5640
- 313: Dell 16 DC16250
- 311: Audisat X99
- 300: Acer EtBook Yoga CWI557
- 292: Nokia 5310 4G
- 291: CAT B68 4G
- 290: CAT B28
- 289: Redmi 15R 5G
- 288: Oukitel C65
- 287: Oukitel C26
- 285: Blackview BV9300 Pro Plus
- 188: Tecno Spark 30
- 187: Tecno Spark 20 Pro

Para completar estas fichas se necesita identificar la referencia exacta y obtener su documentación oficial. Los nombres ambiguos incluyen Acer EtBook Yoga CWI557, Nokia 5310 4G y Blackview BV9300 Pro Plus; no se les asignaron especificaciones de otro modelo.

## Validación

- Sintaxis JavaScript correcta.
- 332 IDs y nombres coinciden con el catálogo, fuentes HTTPS en las fichas verificadas, condición conservada y textos genéricos retirados.
- Comprobación visual en escritorio y celular; botón JBL muestra 45 productos.
- No se publicaron cambios en el sitio de producción.