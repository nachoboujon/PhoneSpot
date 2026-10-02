# Auriculares mayoristas — 1 de octubre de 2026

Fuente de precios: `AURICULARES MAYORISTA.pdf`, cinco páginas, 88 registros.

## Alcance confirmado por el usuario

Solo marcas principales. Se cargaron **24 modelos, 41 variantes de color**: JBL, Redmi, Samsung y Sony.
Se excluyeron las marcas económicas y referencias genéricas, incluidos los EarPods identificados solo como «iPhone».

No se publicaron, por indicación expresa del usuario:

- Apple AirPods 3ra generación, USD 9.
- Samsung Galaxy Buds 3 Pro, USD 13.
- JBL Tune 710BT, USD 1.
- Redmi AirDotsPro: falta identificar el modelo exacto.
- JBL Soundgear Frames: falta confirmar la forma de la montura.

`excluded.json` registra los 47 registros descartados o pendientes con su razón.

## Reglas de carga

- Sumar **USD 18** por variante, reemplazando el margen inicial de USD 15 corregido por el usuario.
- Mantener el redondeo anterior a la decena más cercana, con empates hacia arriba: `Math.floor((wholesaleUsd + 23) / 10) * 10`.
- Ejemplos: USD 32 → USD 50; USD 82 → USD 100; USD 185 → USD 200.
- Stock inicial de **10 por variante**, 410 unidades en total.
- Un producto por modelo, sin color ni características añadidas al título.
- Categoría existente: `accesorios`. Condición: `Nuevo`, sin afirmar un sellado u originalidad que no documenta esta lista.
- RAM, capacidad y condición de batería vacías: no son características aplicables a estos productos.

Los dos Sony se agruparon como **Sony PULSE Explore**, identificados mediante la caja y foto de referencia del proveedor y las galerías de PlayStation.
El acabado del JBL Tune Flex 2 indicado como «Celeste» por el proveedor se presenta como **Turquesa**, según su nombre y fotos oficiales.

## Fotografías

**176 imágenes oficiales WebP**, máximo 1200 px, unos 8,1 MiB en total, con caché de un año.
Se revisaron visualmente todas las galerías y se eliminaron exportaciones repetidas de la misma vista.
Cada color tiene fotografías propias. El Tune 110 rojo dispone de una vista oficial; el producto incluye nueve fotos en sus cuatro colores.
No se publicaron imágenes extraídas del PDF.

Fuentes: JBL Argentina y otros sitios regionales de JBL, catálogos oficiales Xiaomi, tienda Samsung y PlayStation.
Las rutas originales y páginas de referencia están en `photo-sets.json` e `image-manifest.json`.
Los archivos públicos se alojan en Supabase Storage, carpeta `wholesale-earphones-2026-10-01`.

## Verificación y reproducción

- `prepare-wholesale-earphones.js` filtra y transforma los registros extraídos del PDF.
- `research-earphone-photos.js` obtiene las galerías; a continuación, `map-earphone-extra-photos.js` completa y cura la selección.
- `download-earphone-photos.js` descarga; `prepare-earphone-photos.py` comprime a WebP.
- `import-wholesale-earphones.js` simula por defecto. `--apply` publica de forma idempotente, conservando variantes existentes.
- `verify-wholesale-earphones.js` comprueba precios, stock inicial, condición, galerías y disponibilidad HTTP de todas las fotos. Confirma que los productos anteriores conservan sus datos.
- `test-earphones-published.js` revisa el catálogo y las galerías por color en 1440 y 390 px. Intercepta escrituras y peticiones de carrito para evitar operaciones reales.

`import-result.json` contiene los productos publicados. `verification.json` registra la verificación posterior.
La comprobación de stock inicial corresponde al momento de la carga; las compras posteriores pueden modificarlo.
Los HTML de investigación, originales, imágenes locales y láminas de revisión se conservan fuera de Git.
