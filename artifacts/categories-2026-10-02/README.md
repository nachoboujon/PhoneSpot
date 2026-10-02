# Importación de tablets, parlantes, smartwatch y consolas

Carga realizada: 151 modelos, 229 variantes nuevas. Stock inicial: 10 por variante.

## Precios en USD

- Tablets: mayorista +30; iPad +35.
- Smartwatch: mayorista +25.
- Consolas, Game Stick y realidad virtual: mayorista +55.
- Aumentos fijos redondeados a la decena más cercana; empates hacia arriba.
- Parlantes: mayorista ×1,5, redondeado hacia arriba a la decena para garantizar el aumento mínimo del 50%.

## Datos y fotos

- Un producto por modelo; capacidad, RAM, color y edición en variantes.
- Condición Nuevo. No se afirmó que estén sellados sin confirmación para esta tanda.
- Fotos de fabricantes y comercios, revisadas por modelo y acabado; ninguna imagen extraída del PDF se utiliza en el sitio.
- WebP de hasta 1200px; imágenes duplicadas eliminadas dentro de cada galería.
- Galerías separadas por variante, incluso para ediciones y tamaños del mismo color.
- Se conservaron precios, stock y variantes previas. before-import.json contiene el respaldo y verification.json la comprobación posterior.

## Decisiones y pendientes

- 20 variantes sin fotos verificadas, pendientes por decisión del usuario; detalle en PENDIENTES.md.
- 3 Smart Band 6/7/9 pendientes de identificación original, según confirmación del usuario.
- 68 filas excluidas por alcance, genéricos o modelos descartados expresamente.
- Redmi Watch 6 Active Rosa se sustituyó por Naranja; Smart Band 11 Active Blanco por Gris, con autorización del usuario.

Fuentes: *-source.json y photo-sets.json. Precios seleccionados: selected.json. Resultado aplicado: import-result.json.

## Verificación final

Se verificaron 558 imágenes almacenadas por tipo y tamaño, todos los precios y stocks nuevos, y las variantes anteriores de 207 productos. La prueba en móvil pasó en producción para PS5, Redmi Pad 2, Apple Watch Series 11 y Redmi Watch 6 Active, incluidas las cargas de imágenes y los cambios de galería.

Durante el cierre, otro trabajo archivó 21 modelos de esta tanda (Ecopower, Aiwa y UR). Se respetó ese cambio: quedan visibles 130 modelos y 208 variantes de la tanda. La importación evita recrear modelos archivados al volver a ejecutarse.
