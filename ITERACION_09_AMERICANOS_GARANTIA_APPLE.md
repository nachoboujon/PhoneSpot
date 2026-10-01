# Iteración 09: americanos y garantía oficial de Apple separados

## Cambios

Los modelos que contenían ambos tipos de venta ahora aparecen en tarjetas y fichas separadas: **Americano** y **Garantía oficial de Apple**. Cada opción contiene únicamente sus variantes, fotografías por color, precios y stock. Una ficha puede enlazar a la otra opción del mismo modelo, sin juntarlas en el selector de compra.

El catálogo incorpora un filtro específico para garantía oficial de Apple. La home, búsqueda, productos relacionados, recomendaciones, favoritos y comparador usan la misma separación. Los favoritos y las comparaciones distinguen ambas opciones. Al actualizar el stock del catálogo se mantiene la separación.

El carrito conserva el ID y el nombre de la variante original del backend: no se inventan productos ni se pierde la condición seleccionada al comprar.

## Decisiones técnicas

La separación está centralizada en `public/product-commercial-types.js`, un módulo sin dependencias que crea vistas independientes del producto. Se conserva el registro existente para administración y backend; no se cambia la estructura ni se reescriben productos en la base de datos.

Una variante se muestra con garantía Apple únicamente cuando su condición lo indica expresamente. «Sin activar» por sí solo no demuestra garantía y no se convierte en garantía oficial. La descripción general de un producto importado como americano no se usa para ocultar la condición específica de una variante con garantía Apple.

Los enlaces incluyen el tipo de venta para abrir la ficha correcta. Los favoritos existentes se conservan para la opción americana; guardar la opción con garantía utiliza una clave independiente cuando ambas comparten un registro. Los productos que ya tienen un único tipo conservan su identidad de favorito.

Las galerías mantienen la calidad y el encuadre de la iteración anterior. La selección de imágenes se limita a las variantes de cada opción.

## Validación

Pruebas con datos interceptados en escritorio y celular: tarjetas separadas, filtro, fichas, favoritos independientes, comparación, actualización de stock y compra de ambas condiciones. Se comprueba que cada envío al carrito identifica una variante real y diferente del backend. No se hacen escrituras reales.

También se revisan las galerías por color de los modelos importados y la sintaxis de los módulos modificados.

Los cambios están preparados localmente; todavía no están publicados.

## Ajuste visual solicitado

Los nombres vuelven a mostrar únicamente el modelo. La condición se presenta debajo de la marca en las tarjetas y en la ficha, conservando la separación entre ambos tipos de venta.

El enlace para ver la otra opción es compacto: tipografía de 0,8 rem, borde discreto, fondo transparente, altura mínima de 36 px y foco visible. Se quitó el encabezado redundante y el estilo del botón principal de compra. Se usa un contenedor de navegación propio para evitar que las reglas del menú móvil oculten el enlace.
