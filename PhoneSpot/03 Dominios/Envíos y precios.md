---
tags: [dominio, envios]
---

# Envíos y precios

La cotización usa una regla de zonas por código postal. Para ciertas zonas locales se ofrece cadetería; para el resto se calculan alternativas de Correo Argentino y Andreani.

El servidor consulta una cotización de dólar blue, conserva una caché y usa una tarifa personalizada o de respaldo cuando el servicio externo no responde.

## Puntos de configuración

- `DOLLAR_RATE`: valor de respaldo.
- Settings de tienda: costos base de Correo y Andreani.
- Códigos postales locales definidos en la API.

## Relacionado

- [[Pedidos y checkout]]
- [[04 Datos/Settings y archivos]]
- [[05 Operación/Variables de entorno]]
