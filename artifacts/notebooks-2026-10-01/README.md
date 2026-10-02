# Importación de notebooks — 1 de octubre de 2026

Fuente comercial: `NOTEBOOK MAYORISTA.pdf`, 4 páginas, 66 registros.
Condición de todos los equipos: **nuevos y sellados**, confirmada por el usuario.

## Carga

- 56 productos, 66 variantes; un producto por modelo.
- Precio por variante: sumar USD 45 y redondear a USD 10, con los empates hacia arriba.
- Fórmula: `Math.floor((wholesaleUsd + 50) / 10) * 10`.
- Ejemplo: USD 815 → USD 860. Stock inicial: 10 por variante, 660 unidades en total.
- Procesador, pantalla táctil y GPU forman la configuración; RAM, almacenamiento, color y condición tienen sus campos propios.
- La identidad de carrito incluye la configuración para distinguir variantes con igual RAM y almacenamiento.
- Las especificaciones proceden del proveedor. Las fotos no se utilizan para inferir capacidades o procesadores.
- Dos datos atípicos se conservaron como información del proveedor: RAM «16+32 GB» en Acer AG15-42P-R6GZ y procesador «Ryzen 5 40» en una variante Lenovo 15AMN8. No se inventó una corrección técnica.

## Fotos

275 fotos WebP reales, entre 2 y 6 por modelo/acabado, máximo 1200 px, aproximadamente 10,8 MiB en total.
Se revisaron visualmente las galerías; se rechazaron imágenes vacías y se eliminaron exportaciones repetidas del mismo ángulo.
42 modelos usan fuentes del fabricante y 14 fuentes comerciales como alternativa autorizada por el usuario.
No se publicaron imágenes extraídas del PDF. `photo-sets.json` e `image-manifest.json` registran las fuentes de cada foto.
Las imágenes se alojan en Supabase Storage, carpeta `wholesale-notebooks-2026-10-01`, con caché de un año.

Los nombres de acabado se ajustaron a las fotografías y referencias del fabricante: ASUS UX3405C azul oscuro, HP 14-dq6105dx rosa dorado, Victus gris, Dell 7455 gris, Lenovo 15IRU8 gris y MSI Thin A15 gris. Las familias con el mismo chasis pueden compartir fotografías oficiales.
El idioma del teclado y las etiquetas de referencia pueden variar por región; esto se aclara en las descripciones.

## Verificación

- Importador idempotente: conserva precios y stock existentes al repetir la carga.
- Lectura posterior de los 66 precios, condiciones, configuraciones, galerías y stocks.
- Comprobación HTTP de todas las fotos públicas, tipo WebP y tamaño válido.
- Los productos anteriores conservan nombre, precio, descripción e imágenes.
- Navegador: selección de CPU/pantalla táctil, precios y descuento de stock en escritorio y móvil mediante fixtures sin escrituras externas.
- Administración: edición de dos precios con igual RAM/almacenamiento conserva configuración y galería individual, mediante API simulada.
- Catálogo y ficha publicados comprobados en 1440 y 390 px, sin desbordamiento horizontal ni errores JavaScript.
- SQL: las 66 variantes incorporan la configuración en `cart_variant_name`.

Resultado de la carga: `import-result.json`. Verificación de base de datos y fotos: `verification.json`.

## Herramientas

`prepare-wholesale-notebooks.js` transforma los registros del proveedor.
`photo-sets.json` contiene las galerías seleccionadas; `download-notebook-photos.js` descarga sus archivos y `prepare-notebook-photos.py` genera WebP.
La investigación intermedia y las imágenes locales quedan fuera de Git.
`import-wholesale-notebooks.js` hace una simulación por defecto; `--apply` publica.
`verify-wholesale-notebooks.js` realiza verificaciones de lectura. Los stocks iniciales se comprueban inmediatamente después de la carga; pueden cambiar con compras posteriores.
