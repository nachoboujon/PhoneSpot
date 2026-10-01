# Auditoría de espacio — 2026-10-01

Inspección local de toda la carpeta, incluidos archivos ocultos. Se midió el tamaño lógico de los archivos, no el espacio físico asignado en disco ni el almacenamiento remoto. No se borraron archivos, no se modificó la aplicación y no se consultó la base de datos.

## Distribución

Total: **119.306.558 bytes (113,78 MiB), 8.489 archivos**, antes de crear este informe.

| Carpeta | MiB | Interpretación |
| --- | ---: | --- |
| `node_modules` | 71,97 | Dependencias instaladas; no son archivos descargados por el navegador. |
| `.git` | 25,62 | Historial del repositorio; conservar. |
| `public` | 7,39 | Recursos públicos de la web; principal área para optimizar transferencias. |
| `artifacts` | 5,73 | Auditorías, capturas y material de importación; no eliminar todo indiscriminadamente. |
| `output` | 1,47 | Capturas y scripts de diagnóstico. |
| `.playwright-cli` | 1,27 | Capturas, snapshots y logs de automatización. |

Las carpetas `.tmp`, `audit-artifacts` y `tools` no contienen archivos: eliminarlas no libera espacio significativo.

## Archivos prescindibles para ejecutar la web

`artifacts/audit`, `output/playwright` y `.playwright-cli` suman **7.331.382 bytes (6,99 MiB), 102 archivos**. Son evidencia de pruebas: se pueden archivar o limpiar si ya no se necesita comparar resultados. Algunos son recientes y otros están versionados; su eliminación modificaría el repositorio. Los scripts pueden regenerar parte de estos resultados.

`artifacts/history` ocupa 0,20 MiB y `artifacts/legacy` 0,09 MiB. No se encontraron referencias desde la aplicación. Conservar únicamente si interesa su valor histórico.

No borrar `artifacts/iphone-list-images`, `artifacts/iphone-list-source.json` ni `artifacts/iphone-import-preview.json` sin retirar o adaptar los scripts asociados. Se utilizan en importación, reparación y pruebas de galerías.

## Imágenes públicas

Los tres `public/uploads/hero-graphite-*-v1.png` suman **5.043.189 bytes (4,81 MiB)**. Sus alternativas `hero-graphite-*-v2.jpg` suman **370.430 bytes (0,35 MiB)**: una diferencia del **92,7 %** en tamaño de archivo. No se verificó equivalencia visual.

El fallback del carrusel en `public/script.js` ya usa los JPG. Sin embargo, `public/data/settings.json` todavía referencia los PNG. La ruta `/api/settings` lee configuración remota: hay que comprobar también esa configuración antes de sustituir o eliminar imágenes. El ahorro de transferencia depende de cuáles esté cargando realmente el navegador.

`public/uploads/phones-3d-showcase-v1.png` pesa **1,36 MiB** y no tiene referencias encontradas en el código local de la aplicación. Es candidato a retirar, pendiente de comprobar referencias remotas del catálogo o de ajustes.

Estos cuatro WebP son **idénticos por SHA-256**:

- `1787253940741-389787359.webp`
- `1787253946252-615899904.webp`
- `1787254259341-449246353.webp`
- `1787265352950-665529402.webp`

Conservar uno y actualizar todas las referencias permitiría ahorrar **75.576 bytes (73,8 KiB)**. No basta con borrar tres: sus nombres pueden estar guardados en datos remotos.

`PhoneSpot.jpeg` es entrada del script `make-transparent.py`; el logo `PhoneSpot-trans.png` se utiliza en la web. Eliminar el logo rompería recursos visibles.

## Dependencias

`jimp` y `mysql2` están declaradas en `package.json`, pero no se encontraron usos en el código local fuera del manifiesto y del lockfile. Son candidatas a desinstalar, actualizando ambos archivos y comprobando el arranque y los comandos de mantenimiento.

`puppeteer` se utiliza en pruebas, no en `server.js`. Es candidato a pasar a `devDependencies` y excluir de instalaciones de producción. Sus dependencias incluyen paquetes grandes como `chromium-bidi` (9,06 MiB) y `puppeteer-core` (5,57 MiB); los tamaños no representan un ahorro total calculado porque puede haber dependencias compartidas.

No limpiar manualmente archivos internos de `node_modules`: los cambios se perderían al reinstalar y podrían romper paquetes. No eliminar `.git`: contiene el historial y no se sirve al navegador.

## Prioridad

1. Comprobar las imágenes efectivas del carrusel y sustituir los PNG grandes por versiones optimizadas cuando corresponda: esto puede mejorar la carga de la portada.
2. Retirar dependencias sin uso y separar las herramientas de pruebas de las dependencias de producción.
3. Archivar o limpiar los 6,99 MiB de capturas y registros; excluir estos resultados de futuras entregas según el método de despliegue.
4. Comprobar referencias remotas antes de retirar imágenes públicas huérfanas o duplicadas.

La limpieza de capturas libera espacio local, pero no acelera por sí sola la descarga de la página: Express sirve `public`, y estos resultados están fuera de esa carpeta. `.gitignore` actualmente solo excluye `node_modules`, `.env` y `.DS_Store`; agregar patrones no elimina archivos ya versionados ni garantiza su exclusión de todos los métodos de despliegue.
