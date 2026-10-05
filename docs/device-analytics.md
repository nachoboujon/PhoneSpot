# Visitas por dispositivo

El administrador encuentra el panel en **Panel de Control → Estadísticas → Visitas por dispositivo**. Muestra las entradas registradas en los últimos 30 días desde celulares, tablets y computadoras, con cantidad y porcentaje. Las entradas que no se pueden clasificar aparecen como «Sin identificar». El botón «Actualizar visitas» vuelve a consultar los datos sin recargar la página.

El servidor protege `/api/admin/analytics` con autenticación y comprueba el rol vigente de la cuenta en la base, además de validar la versión de sesión. Los clientes comunes no pueden consultar los números aunque cambien el rol guardado en el navegador. La tabla existente `site_events` tiene RLS y una política exclusiva para `service_role`; no se agregan políticas de lectura públicas.

Una visita agrupa páginas abiertas en una misma pestaña y comienza otra después de 30 minutos de inactividad. Recargar o pasar de inicio al catálogo no suma otra entrada dentro de esa ventana. Otra pestaña o una sesión del navegador distinta puede sumar otra visita. Son entradas registradas, no personas ni dispositivos físicos únicos. La administración se excluye del registro de visitas públicas.

Se clasifica el dispositivo a partir del agente de usuario recibido en la petición. El navegador aporta una indicación táctil únicamente para reconocer iPadOS cuando se presenta como una Mac. La clasificación es aproximada: navegadores que oculten o alteren esa información pueden aparecer en otro grupo. Se guardan solo la categoría y si la página inicia una visita; no se guarda un identificador de visitante, el agente de usuario completo ni el tamaño de pantalla. `sessionStorage` mantiene localmente el momento de la última actividad.

El servidor usa recuentos exactos filtrados en la base; no calcula estos totales a partir de una lista truncada de eventos. Si la consulta falla, el panel muestra un error y permite reintentar, en lugar de presentar un cero como resultado válido.

Los registros anteriores no tenían clasificación ni inicio de visita. El nuevo desglose comienza tras desplegar conjuntamente frontend y servidor; no se inventa información histórica. El total histórico de páginas vistas sigue disponible en la sección «Interés del sitio» y ahora se etiqueta como páginas vistas.

No hace falta una nueva migración ni configurar otro proveedor: se utiliza la columna JSONB `metadata` existente. La recogida es la analítica propia de la tienda y puede perder eventos si el navegador bloquea las peticiones o no tiene conexión; no constituye una medición de visitantes únicos.

Pruebas aisladas: `npm run test:device-analytics` comprueba clasificación, acceso privado, cantidades superiores al límite de filas y saneamiento de datos. `npm run test:device-analytics-ui` verifica navegación, nueva visita tras inactividad, exclusión del administrador, cantidades y porcentajes, estados vacío/error/reintento y diseño a 1440, 390 y 320 píxeles. No escriben en Supabase ni envían correos.
