---
tags: [dominio, pedidos]
---

# Pedidos y checkout

El checkout valida el carrito, solicita una opción de envío y crea un pedido asociado al usuario autenticado. Luego se notifica por correo y se abre WhatsApp para coordinar el pago.

## Datos del pedido

- Cliente y dirección de entrega.
- Productos, variantes, cantidad y total.
- Método de pago, envío, estado y código de seguimiento.

## Validación de contacto y entrega

- El email de compra se completa desde la cuenta autenticada y el servidor exige que coincida con su email verificado. Aplica por igual a cuentas con contraseña y a Google Sign-In.
- Se valida el formato de teléfono argentino, el DNI (7 u 8 dígitos), nombre, ciudad y código postal antes de crear un pedido. Estas comprobaciones también se repiten en el servidor.
- La provincia es una selección obligatoria de las 24 jurisdicciones argentinas; la ciudad se ingresa por separado para evitar direcciones ambiguas.
- La verificación de propiedad del teléfono por SMS/WhatsApp requiere integrar un proveedor de mensajería y no se simula como una validación real.
- El carrito lateral presenta cada producto en una tarjeta con imagen, variante, precio, controles de cantidad y acción de quitar separada; en móvil los controles pasan a una fila inferior para conservar la legibilidad.

## Estados

`pending` → `confirmed` / `preparing` → `shipped` → `delivered`.

También existen `completed` y `cancelled`. Los cambios se realizan desde [[Administración]] y pueden disparar correo al cliente.

## Relacionado

- [[Catálogo y productos]]
- [[Envíos y precios]]
- [[04 Datos/Base de datos]]
- [[05 Operación/Pruebas y calidad]]
