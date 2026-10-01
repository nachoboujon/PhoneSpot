# Iteración 03: home de PhoneSpot

## Cambios

- Hero con fondo neutro y texto secundario legible; tarjetas con bordes definidos y sin ampliación de las imágenes al pasar el cursor.
- Transparencia y desenfoque suaves en navegación, con fondo sólido cuando el navegador no admite `backdrop-filter`.
- Aparición al entrar en pantalla para categorías, tarjetas y bloques de ayuda. El contenido inicial queda visible inmediatamente.
- Feedback de foco, botones y búsqueda; controles del carrusel de al menos 44 px y nombres accesibles.
- Categorías con enlaces directos y sin las tres imágenes remotas decorativas anteriores.
- El formulario de newsletter, que mostraba una confirmación sin guardar suscripciones, se reemplazó por enlaces reales a WhatsApp y correo.
- Corregidos el contraste del botón del asesor en hover y el espaciado de marcas y menú móvil.

## Justificación técnica y de diseño

- `home-ui.css` y `home-ui.js` limitan los cambios a la home y permiten iteraciones pequeñas. Se conserva la tipografía e identidad existente.
- CSS, `IntersectionObserver` y Web Animations resuelven los efectos sin incorporar dependencias. Las animaciones usan opacidad y transformación, duran 360 ms y se ejecutan una vez por elemento.
- Un observador acotado al contenido incorpora las tarjetas que carga el catálogo y libera los elementos retirados. Se evita duplicar los observadores de animación anteriores en esta página.
- Se respeta `prefers-reduced-motion`, incluido el cambio de preferencia durante la sesión. Sin soporte de animaciones, el contenido permanece visible.
- El desenfoque se reserva a navegación; las tarjetas mantienen fondos sólidos para favorecer lectura y limitar efectos costosos.
- Quitar imágenes decorativas externas reduce solicitudes de esa sección. No se afirma una mejora porcentual de velocidad ni de Core Web Vitals sin mediciones en producción.
- Los recursos tienen versiones por contenido para renovar la caché después de cambios.

## Verificación

`npm run test:home-ui` permite verificar la home con APIs interceptadas: no modifica datos reales. Cubre 1440 y 390 px, movimiento normal y reducido, visibilidad inicial, menú móvil, ausencia de desbordamiento horizontal, destinos de contacto y carrito con doble clic sin duplicar la escritura. También verifica los espaciados y el contraste calculado del botón del asesor. Comprueba que hero y contacto permanezcan visibles sin JavaScript; el catálogo dinámico sigue requiriéndolo.

Capturas de la prueba: `artifacts/audit/home-iteration/`. Se revisaron visualmente escritorio y móvil. Se verificaron sintaxis JavaScript y formato del diff.

## Revisión del detector

Se conservaron excepciones específicas en `public/index.html` para Inter (identidad vigente) y el recorte horizontal de raíz (contención de los paneles laterales existentes, comprobada en ambos tamaños). El detector no incorpora correctamente todos los estilos externos al analizar HTML: el padding del menú se valida mediante estilos calculados en el navegador. Las excepciones quedan documentadas en `.impeccable/config.json`; no se desactivó el detector.

## Alcance

Cambios locales, pendientes de publicación. Esta iteración no modifica la base de datos ni su estructura. Los enlaces abren los canales de contacto: no envían correos automáticamente ni registran suscripciones. La validación usa datos simulados y no certifica todos los servicios externos en producción.
