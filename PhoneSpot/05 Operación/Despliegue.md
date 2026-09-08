---
tags: [operacion, despliegue]
---

# Despliegue

La guía operativa está en `DEPLOY_RAILWAY.md`. El servicio se inicia con `npm start` y usa el puerto entregado por la plataforma.

## Antes de publicar

1. Ejecutar [[Pruebas y calidad|las comprobaciones locales]].
2. Aplicar las migraciones necesarias de [[04 Datos/Base de datos|Supabase]].
3. Revisar [[Variables de entorno|variables productivas]].
4. Verificar registro, catálogo, checkout y administración.

## Relacionado

- [[02 Arquitectura/Arquitectura del sistema]]
- [[06 Decisiones/ADR-001 Arquitectura actual]]
