---
tags: [dominio, seguridad]
---

# Autenticación

Los clientes se registran con correo y contraseña, verifican su dirección y reciben un JWT al iniciar sesión. También existe autenticación con Google.

## Roles

- `client`: compra, consulta pedidos y escribe reseñas de productos adquiridos.
- `admin`: opera productos, pedidos, reseñas, contenido, cargas y analítica.

## Flujos

- Registro → correo de verificación → cuenta activa.
- Inicio de sesión → JWT guardado en el cliente.
- Recuperación → enlace temporal → nueva contraseña.
- Google Sign-In → verificación del ID token en el servidor → JWT local. La experiencia visual compartida de acceso y registro vive en `public/auth-premium.css`; el botón sigue siendo el control oficial de Google.

## Verificación de Google

- La configuración se publica en `/api/auth/google/config`.
- El servidor valida la credencial recibida en `/api/auth/google` antes de crear una sesión.
- El dominio productivo debe figurar como origen autorizado en Google Cloud para completar el selector de cuentas.

## Relacionado

- [[02 Arquitectura/API HTTP]]
- [[Pedidos y checkout]]
- [[Administración]]
- [[05 Operación/Variables de entorno]]
