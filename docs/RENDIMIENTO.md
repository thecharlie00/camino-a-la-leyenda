# Rendimiento y estructura

Notas de las optimizaciones aplicadas al motor y al arranque web. Sirven para no
volver a introducir los mismos costes y para saber qué invariantes hay que respetar
al tocar estas zonas.

## 1. Arranque de la web (`dist/jugar/juego.html`)

El juego viaja en **una sola página**. Todo lo que no se usa en el primer segundo
se guarda como texto inerte (`<script type="text/plain">` o `<template>`) y solo se
evalúa cuando hace falta:

| Bloque | Antes | Ahora |
| --- | --- | --- |
| Catálogos de idioma (5) | dentro del JS | plantillas `camino-i18n-*`, se evalúa el idioma activo |
| Paquete 3D (GLB) | `var P3D_ASSET_PACK = {...}` | plantilla `pitch3d-asset-pack`, se parsea al abrir el 3D |

Medido en jsdom sobre el mismo equipo: el código que el motor compila al arrancar
baja de **10,61 MB a 5,84 MB** (y a 4,28 MB con el paquete 3D fuera), la compilación
de 54 a **25-30 ms** y el heap estable tras el arranque de 65 a **56 MB**. El tiempo
de arranque completo en jsdom baja de ~2,9 s a ~2,7 s (el resto es trabajo del DOM
de jsdom, no del motor).

Regla: los catálogos de idioma y los modelos no deben volver al código ejecutable.
`test/build-smoke.js` comprueba que siguen siendo plantillas y que los cinco idiomas
y los modelos clave están presentes.

## 2. Simulación de temporada

Dos costes dominaban una temporada completa en carrera moderna:

- **Épocas**: `tblAdd` y `simGoals` llamaban a `eraContextForYear()` por cada fila de
  tabla y cada gol aunque no hubiera época activa. Ahora `eraContextForYear()` sale
  con `null` en cuanto sabe que no hay época y las envolturas comprueban
  `eraIsActive()` antes de tocar nada. De **168.866 llamadas a 732** (y
  `eraCareerScope` de 168.729 a 0).
- **Plantillas por liga**: `teamsOfLeague()` recorría los ~19.000 clubes del mundo
  cada vez que se pedía la lista. Ahora hay un índice cacheado (`TOL_CACHE`) que se
  construye una vez por liga. De **67,7 ms a 0,86 ms** por temporada.

Resultado: la temporada medida en jsdom pasa de **1317 ms a ~820-950 ms**.

### Invariante del índice de plantillas

`TOL_CACHE` solo es válido mientras nadie mueva clubes de división. Hay que llamar a
`teamsOfLeagueReset()` después de:

- cerrar la temporada (ascensos, descensos y reestructuraciones) — ya se hace en
  `seasonEndWorld()`;
- ampliar el array de clubes del jugador en `engine-player.js` — ya se hace (con guarda `typeof`, porque el índice puede no existir en pruebas aisladas);
- cualquier nueva escritura directa a `S.cl[i]` (hoy solo existen en esas zonas).

Si se olvida, el índice devuelve clubes en su división anterior hasta el siguiente
cierre de temporada.

## 3. Una sola copia del código

`legacy-game/src` es la única fuente del juego. La antigua copia de 91 módulos en
`src/` se eliminó porque ni Vite ni TypeScript la importaban; los tests leen ya
`legacy-game/src`. Cualquier módulo nuevo del motor va solo ahí y en `ORDER` de
`build_legacy_game.py`.

## 4. Cómo comprobarlo

```bash
npm run build        # tsc + vite + build_legacy_game.py
npm run test:build   # suite completa, incluye build-smoke y runtime-smoke
```

`test/build-smoke.js` valida el HTML generado y `test/runtime-smoke.js` arranca el
juego, cambia de idioma, recorre los 50 logros de Épocas y crea carreras en los tres
modos.
