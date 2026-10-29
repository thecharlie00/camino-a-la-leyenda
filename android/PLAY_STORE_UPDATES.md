# Aviso de actualización de Google Play

La app Android comprueba `https://futbolroadtolegend.com/play-store-version.json` al volver al primer plano. Si `versionCode` es superior al instalado y `packageName` coincide con `com.caminoleyenda.app`, el juego muestra el aviso traducido que ya incluye el botón **Actualizar**; el botón abre la ficha de Google Play y conserva la alternativa web si la app Play Store no está disponible.

`public/play-store-version.json` es el puntero de versiones publicadas en Play, no el número del último AAB compilado. Actualiza `versionCode` y `versionName` ahí **solo cuando esa versión esté disponible para los usuarios en Google Play**. Así, publicar el sitio o compilar un AAB antes de completar el despliegue no dispara un aviso prematuro. Mantén `packageName` igual al `package` de `android/AndroidManifest.xml`.

El chequeo usa HTTPS en segundo plano, tiene límites de tiempo y tamaño, y falla de forma silenciosa si no hay conexión o el feed no responde; no bloquea el arranque ni el juego.
