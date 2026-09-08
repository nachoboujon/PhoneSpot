---
tags: [phonespot, indice]
---

# PhoneSpot · Centro de proyecto

> Punto de entrada para comprender, operar y evolucionar la tienda.

## Mapa rápido

- [[01 Producto/Visión de producto|Producto]] — propósito, alcance y prioridades.
- [[02 Arquitectura/Arquitectura del sistema|Arquitectura]] — cómo se conectan interfaz, API y datos.
- [[03 Dominios/Catálogo y productos|Dominios de negocio]] — catálogo, cuentas, pedidos y administración.
- [[04 Datos/Base de datos|Datos]] — Supabase, Storage y modelos persistentes.
- [[05 Operación/Despliegue|Operación]] — entorno, despliegue y pruebas.
- [[06 Decisiones/ADR-001 Arquitectura actual|Decisiones]] — por qué el proyecto está organizado así.

## Flujos principales

1. [[03 Dominios/Catálogo y productos|Explorar catálogo]] → [[03 Dominios/Pedidos y checkout|crear pedido]] → [[03 Dominios/Envíos y precios|cotizar envío]].
2. [[03 Dominios/Autenticación|Crear o iniciar sesión]] → [[03 Dominios/Pedidos y checkout|consultar pedidos]].
3. [[03 Dominios/Administración|Administrar]] → [[04 Datos/Settings y archivos|actualizar contenido]] → [[04 Datos/Analítica|medir resultado]].

## Cómo usar el grafo

Abrí **Vista de grafo** y dejá visibles los enlaces. Cada carpeta representa una capa del sistema; las notas más conectadas son los centros de decisión y de operación. Para explorar una zona concreta, buscá una etiqueta como `#arquitectura`, `#dominio`, `#datos` u `#operacion`.

## Referencias del repositorio

- [[Proyecto PhoneSpot]]
- [[05 Operación/Pruebas y calidad]]
- [[05 Operación/Variables de entorno]]
