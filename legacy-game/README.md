# Motor completo del juego (base 5.7)

Este árbol conserva el motor vanilla completo de la versión 5.7 (código 57) que se perdió durante la migración parcial a React/Vite. Incluye la simulación 3D con modelos GLB, el mundo y los rigs 3D de la mascota, vestuario/accesorios, audio y la interfaz de juego.

`npm run build` usa `build_legacy_game.py` para empaquetar estos módulos y los modelos en un único `dist/jugar/juego.html`. El documento generado toma la versión y el código actuales de `android/AndroidManifest.xml`; así, el código de juego sigue siendo el de 5.7 con la etiqueta de versión 5.18 (68), en vez de publicar el bundle público antiguo 5.2 (42). El HTML web y Android muestran una pantalla de carga antes de iniciar el juego; Android ejecuta los módulos por turnos para que el WebView pueda responder, y difiere los catálogos de idioma y los modelos 3D hasta que se necesitan.

La música de fondo añadida posteriormente se integra en `src/pitch.js` y `src/ui.js` de este motor para conservar el botón y la reproducción por Web Audio junto a las funciones 3D.
