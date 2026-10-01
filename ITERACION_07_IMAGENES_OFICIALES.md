# Iteración 7: imágenes oficiales de productos

## Resultado

Se incorporan 73 imágenes oficiales de Apple de **1200 × 1200 píxeles**, para las combinaciones de modelo y color de los 19 modelos de iPhone del catálogo revisado. La galería conserva una sola foto por color y la misma foto al cambiar almacenamiento. Los archivos y la trazabilidad de sus fuentes quedan en `public/uploads/official-products/manifest.json`.

## Decisiones técnicas y de presentación

- Las imágenes anteriores del proveedor medían 230 × 230. Se sustituyen en la respuesta de presentación por recursos oficiales; no se amplían esos archivos pequeños ni se generan detalles mediante IA.
- Los archivos se sirven desde el propio sitio, sin depender de que el fabricante conserve sus enlaces públicos. No se agregan dependencias.
- `lib/official-product-images.js` limita los reemplazos al proveedor y carpeta conocidos, además del modelo y color. Una nueva foto propia subida por Administración conserva su prioridad.
- La normalización no modifica los datos de entrada ni escribe en la base de datos. La lista de Administración solicita las referencias originales para impedir que editar precios o stock guarde accidentalmente las referencias de presentación. No hay cambios de esquema.
- La imagen principal recibe prioridad de carga y decodificación asíncrona. La galería mantiene su selección y no descarga una imagen por cada capacidad.
- La leyenda identifica las imágenes oficiales como referencia; la condición del equipo se consulta en su descripción y variantes.

## Límites pendientes

- **iPhone 13 Pro Max / Rosa:** falta confirmar el color/modelo correcto. Se conserva su foto original para no sustituirla por un dispositivo distinto. Ese caso todavía no cumple 1080 × 1080.
- **TECNO:** los recursos individuales revisados de Spark 30, Spark 40, Spark 50, Spark Go 1, Spark Go 1S y Spark Go 3 son de 800 × 800. No se encontró un PNG individual en la página de especificaciones revisada de Spark 20 Pro. Las fotos de TECNO no se sustituyeron en esta iteración; requieren originales oficiales de mayor resolución para cumplir el mínimo. Evidencia en `artifacts/tecno-official-resolution-audit.json`.
- La integración es local y requiere publicar los cambios para que aparezcan en el sitio público.

## Verificación

- `node scripts/tests/test-official-image-assets.js`: archivos JPEG, resolución mínima, fuentes, correspondencia con modelo/color, conservación de datos y prioridad de fotos propias.
- `node scripts/tests/test-product-images.js http://localhost:3100`: 19 modelos y 154 variantes con API simulada; una foto por color, resolución de las imágenes oficiales, conservación de precios/stock, ausencia de desbordamiento y capturas a 1440 y 390 píxeles.
- `npm run test:syntax` y `npm run test:api`: aprobados, sin escrituras externas en las pruebas.
- Revisión visual conjunta de escritorio y celular: imagen nítida, proporciones conservadas y leyenda legible.

## Excepción del verificador de diseño

Se registra una excepción acotada de `broken-image` para `scripts/maintenance/audit-tecno-official-images.js`: el detector interpreta la expresión regular que lee etiquetas HTML como una imagen de interfaz sin `src`. El script solo audita recursos del fabricante y no renderiza elementos.
