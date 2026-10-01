# Importación de celulares — 1 de octubre de 2026

Alcance: únicamente celulares de las doce listas mayoristas. Se excluyeron relojes, tablets, notebooks, auriculares, cargadores y demás accesorios. Los Android se cargaron como nuevos sellados; las variantes Apple mantienen la condición de garantía o CPO de su lista.

## Resultado

- 238 variantes nuevas, agrupadas en 100 modelos; nueve modelos iPhone ya existían y recibieron variantes adicionales.
- Precio por variante: `floor((precioMayoristaUSD + 35) / 10) * 10`, equivalente a sumar USD 30 y redondear a la decena más cercana, con empates hacia arriba.
- Stock inicial: 10 por variante; el stock del producto suma sus variantes.
- Fotos provenientes de fabricantes, convertidas a WebP y alojadas en Supabase. Se conservaron las fotos, precios y existencias de las variantes anteriores.
- 27 variantes pendientes: ver [PENDIENTES.md](PENDIENTES.md). No se publicaron con fotos de otro modelo o color.

## Evidencia y fuentes

`source-cards.json` conserva la transcripción del proveedor; `phones.json` contiene los 265 registros normalizados de celulares. `image-manifest.json` identifica la página oficial, URL original, color del fabricante, archivo alojado, dimensiones y tamaño de cada fotografía. `import-result.json` registra las altas y ampliaciones; `verification.json` documenta la comprobación posterior con lectura de la base y de los archivos públicos.

Los alias de colores Hotwav rojo/Rose, Oukitel C72 lavanda/Pink y Doogee V Max 2 marrón oscuro/Black se cotejaron visualmente con las fotos de referencia del proveedor y del fabricante; se conserva el nombre usado por el proveedor y el nombre oficial en el manifiesto.

## Mantenimiento

Los scripts `map-wholesale-*` generan las correspondencias desde catálogos oficiales descargados. Los catálogos, ZIP y originales son archivos de trabajo locales, ignorados en Git. Los manifiestos compactos se conservan para reproducibilidad y revisión.

1. Preparar las correspondencias y revisar manualmente cada modelo/color.
2. Para Cubot, obtener el ZIP enlazado por el soporte oficial y ejecutar `extract-cubot-official.py` antes del descargador.
3. `node scripts/maintenance/download-wholesale-assets.js`
4. Ejecutar `scripts/maintenance/prepare-wholesale-assets.py` con Python y Pillow.
5. `node scripts/maintenance/import-wholesale-phones.js` muestra la previsualización; `--apply` escribe en la base configurada en `.env`.
6. `node scripts/maintenance/audit-wholesale-import.js` verifica sin escrituras. La comprobación de stock inicial debe ejecutarse antes de ventas o reservas; no restablece existencias consumidas.

El importador evita variantes duplicadas, conserva productos anteriores y rechaza una actualización si el stock o las variantes cambiaron desde su lectura. Las imágenes se suben sin reemplazar archivos existentes.

Pruebas de interfaz: `test-wholesale-gallery.js`, `test-shopping-experience.js` y `test-admin-variant-photos.js`. Los cambios de carrito y de administración de esas pruebas usan respuestas simuladas.
