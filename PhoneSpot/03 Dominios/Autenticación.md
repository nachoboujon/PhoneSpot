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
- El acceso y registro comparten una paleta monocroma y una transición de panel al alternar entre ambas pantallas. La transición respeta `prefers-reduced-motion`.

## Verificación de Google

- La configuración se publica en `/api/auth/google/config`.
- El servidor valida la credencial recibida en `/api/auth/google` antes de crear una sesión.
- La cabecera `Cross-Origin-Opener-Policy` usa `same-origin-allow-popups`: conserva el aislamiento del sitio y permite que Google Identity Services devuelva la credencial desde su popup.
- El dominio productivo debe figurar como origen autorizado en Google Cloud para completar el selector de cuentas.
- Para desarrollo local, el origen exacto `http://localhost:3000` también debe estar autorizado. Si falta alguno, Google devuelve `Error 400: origin_mismatch`.
- Configuración aplicada en Google Cloud: `https://phonespot.up.railway.app`, `http://localhost`, `http://localhost:3000` y `https://www.phonespot.site`. Google puede demorar unos minutos en propagar el cambio.

## Relacionado

- [[02 Arquitectura/API HTTP]]
- [[Pedidos y checkout]]
- [[Administración]]
- [[05 Operación/Variables de entorno]]
# Cuenta y acceso móvil

- Después de iniciar sesión con email o Google, los clientes son dirigidos a `perfil.html`; se respeta `?redirect=perfil.html` al llegar desde una ruta protegida.
- El menú móvil ofrece un acceso textual a **Mi cuenta** (o al panel si es administrador), además del ícono de cabecera.
- El perfil obtiene y actualiza únicamente el registro identificado por el JWT mediante `GET /api/me` y `PUT /api/me`. El email se mantiene bloqueado para evitar cambios sin verificación.
- El email verificado de esa cuenta es el que se usa para confirmar compras; no se admite sustituirlo por otro email desde el checkout.
