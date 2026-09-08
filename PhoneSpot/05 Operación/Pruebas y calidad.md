---
tags: [operacion, calidad]
---

# Pruebas y calidad

## Comprobaciones seguras

`npm test` revisa la sintaxis de `server.js` y `public/script.js`.

## Diagnósticos manuales

`scripts/tests/` contiene pruebas de correo, Supabase y compra. Algunas consultan servicios externos o pueden modificar datos; ejecutarlas solo con un entorno de prueba.

## Checklist de entrega

- Catálogo carga productos y variantes.
- Registro, login y recuperación responden correctamente.
- Checkout calcula envío y crea el pedido esperado.
- Administración exige rol administrador.
- No hay secretos en archivos versionados.

## Relacionado

- [[Despliegue]]
- [[04 Datos/Base de datos]]
- [[01 Producto/Roadmap]]
