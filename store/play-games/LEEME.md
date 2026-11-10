# Logros en Google Play Juegos

Los 282 logros del juego (los mismos de la pantalla de Trofeos) se publican también en Google Play Juegos.
La app los desbloquea en Play con la misma clave que usa el juego: cada logro conseguido en cualquier
partida se envía una vez, también los que ya tenías antes de activar Play Juegos.

## 1. Crear el proyecto de Play Juegos (Play Console)

1. Play Console → tu app → **Crecer usuarios → Servicios de juego de Play → Configuración**.
2. «¿Tu juego usa APIs de Google?» → **No, mi juego no usa APIs de Google** → crea el proyecto de Play Juegos.
3. Idioma predeterminado: **Español (España) – es-ES**. En **Editar propiedades → Gestionar traducciones**
   añade **Inglés (EE. UU.) en-US, Alemán de-DE, Italiano it-IT y Francés fr-FR**.
4. **Credenciales → Añadir credencial → Android**: elige el cliente OAuth con el paquete
   `com.caminoleyenda.app` y la huella SHA-1 de la **clave de firma de apps** (Configuración → Integridad
   de la app → Firma de apps). Si pruebas versiones firmadas con tu clave de subida, añade también su SHA-1.

## 2. Importar los logros

**Logros → Importar logros** y sube `play-games-logros-1.zip` (282 logros, 1.795 puntos, iconos incluidos,
traducciones a 4 idiomas). Los logros secretos del juego se importan como ocultos.

## 3. Vincular los IDs

1. En **Logros**, pulsa **Obtener recursos** → **Android** y guarda el XML (por ejemplo `games-ids.xml`).
2. Ejecuta `python3 tools/pgs_map.py games-ids.xml`. Escribe
   `android/res/raw/pgs_achievements.json` (clave del juego → ID de Play) y el ID del proyecto en
   `android/res/values/pgs.xml`. Si algún logro no se vincula, lo lista.
3. Sube de versión, compila el AAB y publícalo. Mientras el ID del proyecto esté vacío, la app no activa Play Juegos.

## 4. Probar y publicar

- Añade tu cuenta como **tester** en Play Juegos → Probadores y prueba con una versión de prueba interna.
- Cuando todo funcione, **Revisar y publicar** los cambios de Play Juegos (los logros no se pueden borrar
  después de publicarlos).

## Si cambian los logros del juego

```
npm run build
node tools/pgs-export.cjs build/pgs-export
python3 tools/pgs_bundle.py build/pgs-export store/play-games
```

El zip trae todos los logros: para añadir solo los nuevos, créalos en Play Console con el nombre, la descripción
y el icono que indica `logros.json` (o importa un zip que solo los contenga) y repite el paso 3.
La prueba `test/pgs.js` falla si hay logros del juego que no están en `store/play-games/logros.json`.
