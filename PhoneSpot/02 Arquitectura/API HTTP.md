---
tags: [arquitectura, api]
---

# API HTTP

`server.js` contiene el servidor Express. Sirve el frontend y expone `/api/*` para la aplicación web.

## Familias de endpoints

- Cuenta: registro, login, Google, verificación y restablecimiento.
- Catálogo: productos, variantes, reseñas y alertas de stock.
- Administración: productos, pedidos, reseñas, settings, archivos y analítica.
- Compra: cotización de envío y creación/seguimiento de pedidos.

## Controles

- JWT para rutas autenticadas.
- Rol `admin` para cambios operativos.
- CORS limitado por `CORS_ORIGINS`.
- Límite de carga de imágenes y validación de entradas.

## Relacionado

- [[Arquitectura del sistema]]
- [[03 Dominios/Autenticación]]
- [[04 Datos/Base de datos]]
- [[05 Operación/Variables de entorno]]
# Perfil de cuenta

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| `GET` | `/api/me` | Usuario autenticado | Devuelve sus datos públicos de cuenta. |
| `PUT` | `/api/me` | Usuario autenticado | Actualiza sólo su nombre validado. |
