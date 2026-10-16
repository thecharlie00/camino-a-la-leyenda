# Camino a la Leyenda

Juego de carrera futbolística para móvil: carrera de jugador o jugadora, carrera de míster y «Crea tu club», con 87 ligas, fútbol femenino, campo 2D, mercado, prensa, redes sociales y mascotas. Funciona sin conexión; solo usa internet para los anuncios y para avisar de actualizaciones.

Está escrito en JavaScript (ES5) sin dependencias y se publica en Google Play como app Android que carga el juego en un WebView (`com.caminoleyenda.app`).

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/` | Código del juego: motor (`engine-*.js`, `events*.js`), interfaz (`ui*.js`), campo 2D (`pitch.js`), datos (`data*.js`, `names.js`) y estilos (`style.css`) |
| `real/`, `real-f/` | Plantillas reales (masculinas y femeninas) con nombres parodiados |
| `i18n/` | Traducciones (en, de, it, fr) y textos del modo femenino (`i18n/fem/`) |
| `fonts/` | Tipografías incluidas en el juego |
| `test/` | Pruebas automáticas (simulación en Node y recorridos con Playwright) |
| `tools/` | Herramientas de traducción y de datos |
| `android/` | Proyecto Android mínimo para compilar el `.aab` desde la línea de comandos |
| `android-studio/` | El mismo proyecto para Android Studio (variantes con y sin anuncios) |
| `store/` | Material de la ficha de Google Play |

## Compilar el juego

```bash
python3 build.py          # genera dist/index.html, dist/index-noads.html y dist/camino.html
```

Tras añadir o cambiar textos:

```bash
cd tools && npm install && cd ..
node tools/i18n.js keys      # extrae los textos
node tools/i18n.js check     # muestra lo que falta por traducir
node tools/i18n.js build     # genera src/lang-*.js
```

## Pruebas

```bash
npm install --prefix tools playwright   # si no está instalado
node test/sim.js                        # carreras completas simuladas
node test/modes.js                      # míster y «Crea tu club»
FEM=1 node test/sim.js                  # lo mismo en fútbol femenino
node test/patch2.js /tmp/capturas       # recorrido de la interfaz con capturas
```

## Android

1. Copia `android/signing.env.example` a `android/signing.env` y pon la contraseña del keystore.
2. Coloca `camino.keystore` en `android/` (y en `android-studio/` si usas Android Studio, junto a `signing.properties`, a partir de `signing.properties.example`).
3. Descarga [bundletool](https://github.com/google/bundletool/releases) en `tools/bt/bundletool.jar`.
4. `python3 build.py && bash android/build_aab.sh`

Para Android Studio, consulta `android-studio/LEEME.md`.

**El keystore y las contraseñas no están en el repositorio a propósito.** Guárdalos aparte: sin ellos no se pueden publicar actualizaciones en Google Play.

## Hoja de ruta

Una versión nueva cada día; el plan y el estado de cada versión están en la hoja de ruta del proyecto.
