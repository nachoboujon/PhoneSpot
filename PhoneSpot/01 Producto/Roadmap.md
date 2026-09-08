---
tags: [producto, roadmap]
---

# Roadmap

## Estabilizar

- Mantener las migraciones de Supabase documentadas.
- Ejecutar [[05 Operación/Pruebas y calidad|verificaciones]] antes de desplegar.
- Revisar las variables de entorno de producción.

## Evolucionar

- Consolidar estilos y componentes reutilizables del frontend.
- Mantener el sistema de microinteracciones: entradas escalonadas de contenido, respuesta de botones y confirmación visual del carrito, respetando `prefers-reduced-motion`.
- Mantener una navegación con jerarquía visible: encabezado compacto al desplazarse, indicador de avance y enlaces de sección con estado activo.
- Conservar la animación de compra de producto a carrito como feedback de confirmación; debe degradar a una respuesta simple si el usuario reduce movimiento.
- Agregar pruebas automatizadas para los flujos de compra y autenticación.
- Definir métricas de conversión y un tablero operativo.

## Relacionado

- [[Visión de producto]]
- [[03 Dominios/Administración]]
- [[04 Datos/Analítica]]
- [[06 Decisiones/ADR-001 Arquitectura actual]]
