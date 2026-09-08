---
tags: [dominio, pedidos]
---

# Pedidos y checkout

El checkout valida el carrito, solicita una opción de envío y crea un pedido asociado al usuario autenticado. Luego se notifica por correo y se abre WhatsApp para coordinar el pago.

## Datos del pedido

- Cliente y dirección de entrega.
- Productos, variantes, cantidad y total.
- Método de pago, envío, estado y código de seguimiento.

## Estados

`pending` → `confirmed` / `preparing` → `shipped` → `delivered`.

También existen `completed` y `cancelled`. Los cambios se realizan desde [[Administración]] y pueden disparar correo al cliente.

## Relacionado

- [[Catálogo y productos]]
- [[Envíos y precios]]
- [[04 Datos/Base de datos]]
- [[05 Operación/Pruebas y calidad]]
