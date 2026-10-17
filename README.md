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

## Arquitectura de los módulos

El juego se concatena en el orden de `ORDER` (en `build.py`). Desde la 2.5, las versiones añaden módulos que **envuelven** funciones del motor en vez de editarlas (`mgrFinish = function () { … _orig.apply(this, arguments) … }`). El último módulo cargado es el más externo. Las funciones más envueltas y sus módulos, por orden de carga:

| Función | Módulos que la envuelven |
|---|---|
| `mgrPrepFixture` | engine-extra, week29 (preparación), club30 (presidente), story33 (relaciones) |
| `mgrFinish` | club30 (taquilla y premios), chal32 (rivalidades, récords, diario) |
| `mgrBlockDone` / `mgrSeasonEnd` / `mgrStartSeason` | club30 (finanzas), chal32 (crisis, desafíos), edit35 (carrera rápida) |
| `blockDone` / `seasonEnd` (jugador) | life, pets, chal32 (diario), story33 (amistades) |
| `mgrScoutList` | market26, chal32 (solo cantera) |

Reglas: cada envoltorio llama siempre al original, no cambia su firma y protege su parte con `try` cuando no es esencial. Los datos nuevos viven en campos propios (`S.m.wk`, `S.m.fin`, `S.m.facs`, `S.ch`, `S.diary`, `S.ed`, `S.quick`…) y se crean al vuelo, así las partidas antiguas siguen cargando.

## Pruebas

`node test/audit.js [carreras de jugador] [carreras de míster]` simula carreras largas y avisa de valores fuera de rango, decisiones atascadas, duplicados en la plantilla, excepciones, eventos repetidos y nombres duplicados. `node test/langqa.js` busca restos de castellano en los otros idiomas.

## Hoja de ruta

Una versión nueva cada día; el plan y el estado de cada versión están en la hoja de ruta del proyecto.

## Web

Versión para jugar en el navegador con GitHub Pages: ver [web/LEEME.md](web/LEEME.md).
