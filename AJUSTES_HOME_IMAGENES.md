# Ajustes de home e imágenes

## Cambios realizados

- Eliminados por completo los bloques «Tecnología para tu negocio» y «Armá tu ecosistema». La home comienza con el carrusel.
- Carrusel sin rotaciones, filtros de color ni la capa oscura sobre las fotografías. Se separa el texto de la zona principal de la imagen; en móvil la foto ocupa la parte superior y el contenido la inferior.
- Corregida la altura heredada de las diapositivas móviles para mantener visible el enlace al catálogo.
- Fotografías de las tarjetas de la home con proporciones conservadas, mayor espacio y sin perspectiva, sombras superpuestas ni mezcla de colores.
- Eliminadas las reglas de `home-ui.css` correspondientes a los bloques retirados. Se mantienen los estilos compartidos utilizados por otros enlaces y las configuraciones existentes del administrador.

## Decisiones técnicas

Se reutilizan las imágenes existentes, sin generar representaciones nuevas de productos. Los banners PNG originales y sus JPG comprimidos tienen 1672 × 941 píxeles: el PNG evita la compresión con pérdida, pero no aumenta la resolución. En pantallas con densidad superior a 1 se usa el PNG original; en las demás se conserva el JPG ligero. Solo se solicita la imagen de la diapositiva activa. Las imágenes personalizadas no se reemplazan.

Los cambios en CSS corrigen la presentación, sin modificar las fotos ni los datos de productos. Una fotografía de origen pequeña o desenfocada necesita un original de mayor calidad para recuperar detalle real. No se afirma haber restaurado detalle ausente en las fotos del proveedor.

## Validación y alcance

Pruebas de sintaxis y `git diff --check`. Prueba de navegador en 1440 px y 390 px, con densidad 1 y 2 respectivamente, movimiento normal y reducido. Verifica bloques ausentes, selección del banner según densidad, proporciones y ausencia de transformaciones en las fotos, botón del carrusel dentro del contenedor, menú, contacto y carrito sin duplicar escrituras por doble clic. APIs simuladas: no se modifican datos reales. Capturas en `artifacts/audit/home-iteration/`.

Cambios locales pendientes de publicación. Base de datos intacta. Los PNG originales pesan más que los JPG; se prioriza calidad en pantallas densas y se conserva la carga por diapositiva. No se agregaron dependencias.

## Revisión posterior de alertas

Se declaró explícitamente texto blanco sobre el fondo oscuro del carrusel, evitando heredar negro en su encabezado accesible. La alerta de padding corresponde al contenedor exterior de la imagen: el texto visible tiene 24 px de padding en escritorio y 20 px en móvil, comprobados en los estilos y las capturas. Se registró una excepción de `cramped-padding` limitada a `public/index.html`, con esta evidencia, mediante la herramienta del detector.
