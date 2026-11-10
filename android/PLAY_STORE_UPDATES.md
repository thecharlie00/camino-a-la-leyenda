# Aviso de actualización de Google Play

Al volver al primer plano, la app Android consulta directamente Google Play mediante Play Core (`AppUpdateManager`). Si Play informa de una versión más nueva disponible para esa instalación —incluidos lanzamientos de prueba a los que la cuenta tenga acceso—, el juego muestra el aviso traducido con el botón **Actualizar**, que abre la ficha de la app en Google Play.

Play Core solo puede confirmar actualizaciones para instalaciones reconocidas por Google Play y elegibles para esa versión. Si la consulta no puede completarse (por ejemplo, por una instalación externa o un fallo del servicio), Android usa como alternativa `https://futbolroadtolegend.com/play-store-version.json`. Ese feed debe reflejar una versión ya disponible en Play, no el último AAB compilado; actualiza sus campos solo tras completar la publicación. Mantén `packageName` igual al paquete de `android/AndroidManifest.xml`.

Las consultas se limitan a una cada dos minutos, usan red en segundo plano y fallan de forma silenciosa si no hay conexión; nunca bloquean el arranque ni el juego. El aviso se muestra dentro de la app, no como notificación del sistema.
