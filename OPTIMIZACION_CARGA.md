# Optimización de carga — 2026-10-01

Cambios realizados y verificados en el entorno local. Todavía no se publicaron.

## Mejoras

- Compresión negociada gzip/Brotli en Express mediante `compression`. Se comprobó que descomprimir la respuesta produce exactamente los bytes originales.
- Caché de imágenes durante 24 horas y de CSS/JS versionados durante 24 horas. HTML y archivos sin versión se revalidan. Las respuestas de la API usan `no-store` para mantener actualizados precios, stock y datos de cuentas.
- URLs de CSS/JS con hash de contenido. `npm start` ejecuta automáticamente `npm run assets:version`; también se puede ejecutar ese comando antes de una publicación que use otro comando de arranque.
- Los tres banners locales conocidos usan las versiones JPG, incluso si los ajustes conservan sus nombres PNG. Las imágenes remotas personalizadas no se sustituyen. Los PNG antiguos siguen disponibles para conservar enlaces existentes.
- El carrusel carga la imagen activa cuando se acerca a la pantalla y pausa la rotación cuando queda fuera de ella. Conserva botones, gestos y navegación.
- Se retiraron `jimp` y `mysql2`, sin usos encontrados en el código local. `puppeteer` pasó a dependencias de desarrollo. Para excluirlo de producción, instalar con `npm ci --omit=dev`.
- Nuevas capturas y registros de auditoría se ignoran en Git. Esto no retira los archivos que ya estaban versionados.

## Tamaños medidos

Medición HTTP directa contra el servidor local, sin atribuir estos porcentajes al tiempo total de apertura del sitio.

| Recurso | Original (bytes) | gzip (bytes) | Reducción |
| --- | ---: | ---: | ---: |
| `index.html` | 33.525 | 7.028 | 79,0 % |
| `script.js` | 279.846 | 57.249 | 79,5 % |
| `style.css` | 102.805 | 20.658 | 79,9 % |

Los tres banners JPG suman 370.430 bytes frente a 5.043.189 bytes de los PNG: **92,7 % menos transferencia** para esas imágenes. Se inspeccionó visualmente el banner de teléfono y se comprobó que los tres JPG se decodifican en el navegador.

Las dependencias locales pasaron de aproximadamente 71,97 MiB a 47,24 MiB. La cifra actual todavía incluye las herramientas de desarrollo instaladas.

## Verificación

- `npm test`: sintaxis del servidor y del JavaScript del cliente correcta.
- `npm run test:api`: validaciones de API, envío con costo cero y renderizado de correo; sin escribir en servicios externos.
- `AUDIT_URL=http://localhost:3100 npm run test:storefront`: 20 páginas y estados en escritorio y móvil; sin errores de JavaScript, imágenes rotas, recursos locales faltantes, IDs duplicados ni desbordamiento horizontal. Consulta el catálogo público real; simula cuentas, carrito, pedidos y escrituras de administración.
- `AUDIT_URL=http://localhost:3100 npm run test:performance`: gzip/Brotli, equivalencia de contenido, cabeceras de caché, respuestas 304, compatibilidad con nombres antiguos de banners, decodificación de imágenes y pausa del carrusel fuera de pantalla.
- `npm ls --omit=dev --depth=0`: dependencias de producción resueltas.
- `git diff --check`: sin errores de espacios en el diff.

En PowerShell, establecer el destino antes de las pruebas con `$env:AUDIT_URL='http://localhost:3100'`. El servidor debe estar iniciado en ese puerto.

## Alcance pendiente

Estas pruebas no certifican una compra real ni la entrega de correos por el proveedor. El test de compra que modifica stock requiere una base de pruebas separada y variables `TEST_SUPABASE_*`; no se ejecutó sobre la base real. Después de publicar, comprobar compresión/caché del dominio desplegado y el recorrido con una compra controlada en un entorno de pruebas. No se midieron Core Web Vitals de producción.

Referencias de implementación: [compression](https://expressjs.com/en/resources/middleware/compression/) y [serve-static](https://expressjs.com/en/resources/middleware/serve-static/).
