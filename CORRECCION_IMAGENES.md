# Corrección de imágenes — 2026-10-01

Se revisaron los 19 modelos del catálogo y las fotos de sus 154 variantes. Se encontraron 43 entradas redundantes dentro de las galerías de cada modelo: diferentes nombres de archivo contenían los mismos bytes. El total pasa de 154 entradas a 111 fotos únicas por modelo; las 154 variantes se conservan.

La API ahora unifica las URLs de fotos idénticas al entregar productos y elimina entradas repetidas de `images`. El índice usa SHA-256 del contenido de las fotos originales, reemplazando las huellas visuales aproximadas que podían confundir fotos parecidas. Las URLs personalizadas fuera del lote conocido se conservan. Cada producto mantiene su propia colección, sin mezclar fotos entre modelos.

La galería del cliente también deduplica por identidad de foto. Los selectores de color y las fotos disponibles para cada variante siguen funcionando. No se modificaron precio, stock, capacidad, batería ni condición; tampoco se borraron fotos o se escribieron registros en la base de datos.

Verificación completada:

- `test:images`: los 19 modelos, todos sus colores, navegación de miniaturas y catálogo; escritorio y móvil; sin errores de JavaScript.
- Comparación del catálogo servido por la API con la captura inicial: variantes, precios y stock conservados; ninguna galería contiene fotos idénticas repetidas.
- `test:api`, sintaxis y `git diff --check`: correctos.
- URLs del JavaScript actualizadas mediante su hash para evitar que el navegador conserve la versión anterior.

Algunos colores comparten una misma foto porque así aparecen en la lista original del proveedor. Esos casos siguen indicando que la foto es compartida; reemplazarlos por imágenes del tono exacto requiere fotografías verificadas de esos equipos. No se inventaron asociaciones ni se sustituyeron modelos por imágenes genéricas.

Cambios locales, pendientes de publicación. No hace falta modificar el catálogo remoto: la normalización se aplica al leerlo con el servidor actualizado. Si se reimportan las fotos del proveedor, regenerar el índice con `node scripts/maintenance/index-iphone-photos.js`.
