# Sincronización de Mayoristas Misiones — 5 de octubre de 2026

Única fuente de WhatsApp autorizada: **Mayoristas Misiones Electrónica 1**, archivado. No leer otros chats ni enviar mensajes. Antes de leer contenido o adjuntos, verificar por consulta DOM que el encabezado del chat contenga el título exacto permitido; evitar snapshots globales de WhatsApp.

## Resultado aplicado

- 219 filas de PDFs transcritas por posición de texto; 159 variantes existentes con coincidencia exacta.
- 134 precios actualizados: 87 variantes de celulares y 47 de notebooks. Precio mayorista +30 y +50 USD, respectivamente, sin redondeo.
- Los 134 cambios se comprobaron con lectura posterior. La segunda previsualización produjo cero actualizaciones adicionales.
- Se preservaron existencias, fotos y atributos de cada variante. Se guardaron respaldos `before-*.json`, cambios en `applied.json` y lecturas en `verification.json`.
- No se modificaron indicadores de oferta en esta tanda: estos PDFs contienen precios normales.

## Fuentes

`source-lists.json` conserva evidencia del grupo autorizado: Infinix (texto, aún sin filas por coordenadas), notebooks (29/9) y Samsung, Xiaomi/Redmi/Realme/Poco y Motorola (5/10). Los PDFs se leen desde el visor de WhatsApp, iframe `https://webtp.whatsapp.net/pdf-viewer/?locale=es_LA`; `p.acc_text` expone textos y coordenadas. Asociar cada precio al bloque de nombre inmediatamente anterior de su misma columna; no usar el orden del texto, que puede ubicar precios al final de una página.

`recent-posts.txt` contiene publicaciones parciales recientes para revisión; todavía no se aplicaron. No se deben tratar sus modelos ambiguos como identificación verificada.

## Pendientes

`preview.json` contiene 60 filas pendientes: principalmente modelos Samsung todavía sin producto existente y una variante Motorola por cotejar; Audisat queda fuera de las marcas aprobadas. Falta completar las fuentes de las demás categorías, las nuevas altas con fotos verificadas y las ofertas vigentes. El importador actual solo actualiza variantes existentes con normalización revisada; no crea productos.

La lectura se detuvo al detectar un cambio inesperado del navegador a otro chat. No consultar sus mensajes; volver exclusivamente al grupo autorizado antes de continuar. La automatización horaria `listas-de-mayoristas-misiones-para-phonespot` quedó activa en este mismo chat, con esa restricción y el alcance pendiente explícitos. Su ejecución con navegador todavía debe comprobarse.

## Reglas y ejecución

Las reglas autorizadas están en `config/misiones-supplier-policy.json`. Conservar celulares Tecno y similares existentes. JBL queda para manejo manual. La autorización posterior incluye únicamente TV de 32 pulgadas (+50 USD), 43 pulgadas (+60 USD) y 55 pulgadas (+80 USD), con diagonal verificada, marcas de primer nivel y sin redondeo. Otras medidas quedan fuera. La automatización horaria fue actualizada con estas reglas; todavía no se incorporaron TV, porque la pestaña anterior de WhatsApp dejó de estar accesible y no hay fuentes de TV en la evidencia ya extraída. Perfumes: marcas de cualquier origen comercial indicadas por el usuario, únicamente perfumes árabes originales. No importar categorías adicionales ni borrar productos existentes automáticamente.

```
node scripts/maintenance/sync-misiones-supplier.js --batch artifacts/misiones-sync-2026-10-05
node scripts/maintenance/sync-misiones-supplier.js --batch artifacts/misiones-sync-2026-10-05 --apply
node scripts/tests/test-misiones-supplier.js
```

Una tanda requiere `sourceChat` exacto y `sourceAt` real por lista. `artifacts/misiones-supplier-state.json` conserva la última fuente aplicada por variante y evita cotizaciones anteriores. Guardar tandas nuevas en directorios fechados. El proceso usa comparación de precio, stock, variantes y fecha de modificación para rechazar ediciones concurrentes; respeta productos archivados.

PC encendida, aplicación abierta y sesión de WhatsApp vinculada son dependencias del proceso local. Si no puede garantizarse acceso limitado al grupo, detener la lectura y informar la acción necesaria.
