---
tags: [decision, arquitectura]
status: aceptada
---

# ADR-001 · Frontend estático + Express + Supabase

## Contexto

PhoneSpot necesita una tienda rápida de mantener, con páginas públicas simples y una API capaz de controlar autenticación, pedidos, correo, contenido y datos.

## Decisión

Conservar el frontend estático en `public/`, centralizar la API en `server.js` y usar Supabase para Postgres y Storage.

## Consecuencias

- Despliegue sencillo de una única aplicación.
- Menos duplicación entre interfaz y API.
- `server.js` concentra varias responsabilidades; cuando el volumen aumente, convendrá separar rutas y servicios en módulos.

## Enlaces

- [[02 Arquitectura/Arquitectura del sistema]]
- [[02 Arquitectura/API HTTP]]
- [[04 Datos/Base de datos]]
- [[01 Producto/Roadmap]]
