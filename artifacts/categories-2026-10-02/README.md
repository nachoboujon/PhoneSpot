# Nueva tanda: tablets, parlantes, smartwatch y consolas

Estado: preparación en curso; estos archivos no acreditan publicación en el sitio.

## Precios

- Tablets: precio mayorista + USD 30, redondeado a la decena más cercana.
- iPad: precio mayorista + USD 35, redondeado a la decena más cercana.
- Parlantes: precio mayorista multiplicado por 1,5, redondeado hacia arriba a la decena para mantener como mínimo el aumento del 50%.
- Smartwatch: precio mayorista + USD 25, redondeado a la decena más cercana.
- Consolas: precio mayorista + USD 55, redondeado a la decena más cercana.
- En todos los casos: stock inicial previsto de 10 por variante. No se reinicia el stock de productos existentes.

## Fuentes y preparación

Se extrajeron 96 tarjetas de TABLETS MAYORISTA.pdf, 96 de PARLANTES MAYORISTA.pdf, 88 de SMARTWATCH MAYORISTA.pdf y 40 de PRODUCTOS GAMER MAYORISTA.pdf. Este último contiene accesorios que no corresponden a la selección de consolas.

Los archivos `*-source.json` conservan página, columna y texto del proveedor. Los archivos `*-draft.json` son borradores: los modelos, atributos y galerías requieren revisión antes de una importación. Los precios y stock previstos se calcularon para las 320 tarjetas; ello no implica que se vaya a publicar todo su contenido.

`photo-sets.json` registra páginas y URLs de fabricantes encontradas durante la investigación. Las imágenes descargadas deben pasar revisión visual por modelo y color; encontrar una URL no valida por sí solo una galería.

## Decisiones pendientes solicitadas al usuario

1. Incluir o excluir referencias NSG/genéricas, distinguiéndolas de los productos originales.
2. Alcance de consolas: Nintendo Switch, PlayStation 5 y Xbox, o también Game Stick y realidad virtual. PlayStation Portal es un reproductor remoto.

Hay tres iPad NSG, dieciocho parlantes NSG y cinco Apple Watch marcados genéricos. Además, las Smart Band 6/7/9 con precios de USD 3,60/4,60/5,30 requieren confirmar la identificación antes de utilizar fotos oficiales o presentarlas como Xiaomi.

La foto de la tarjeta Xbox corresponde a Xbox One X, tal como indica su texto. No debe reemplazarse por una Xbox Series X.

## Reproducir la preparación

1. `extract-category-lists.py`: extracción de tarjetas.
2. `prepare-category-lists.js`: nombres provisionales, variantes y precios.
3. `research-category-photos.js`: investigación de galerías oficiales.
4. `download-category-photos.js`: descarga con validación de contenido y rechazo de archivos vacíos.
5. `prepare-category-photos.py`: conversión a WebP sin alterar colores del producto.

Antes de publicar: revisar cada referencia y galería, resolver decisiones pendientes, agrupar todas las variantes de un mismo modelo y comprobar que no falten colores, fotos o datos de identificación.
