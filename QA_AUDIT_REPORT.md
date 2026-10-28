# QA_AUDIT_REPORT.md — Camino a la Leyenda

**Fecha:** 2026-10-28
**Estado:** Fase 1 parcial; auditoría interactiva bloqueada por el entorno. No se inicia Fase 2 hasta recibir aprobación explícita de hallazgos.
**Build/commit de referencia:** Android `5.8` / `versionCode 58`; workspace en `9ad5a99`.
**Rama:** `arena/63ee066d-camino-a-la-leyenda` (fijada por Arena; no se crea ni cambia a una rama `qa/…`).

## 1. Resumen ejecutivo

La compilación de producción y las pruebas automatizadas disponibles pasan. El juego se empaqueta como HTML autocontenido de **10.575.128 bytes** (aprox. 10,33 MiB); el servidor local respondió `HTTP 200` a `/jugar/juego.html` con TTFB de 74 ms y transferencia local total de 87 ms. Esas cifras son del build/servidor local, no una medición de carga real en dispositivo.

No se pudo arrancar una sesión interactiva de Chromium: el binario headless disponible no encuentra `libnspr4.so` ni `libnss3.so`. Por ello no hay evidencia visual/de interacción sobre recorridos, controles, colisiones, accesibilidad, audio audible ni FPS. No se afirma que esos recorridos hayan pasado.

**Salud comprobada:** build y contenido autocontenido presentes; los módulos/modelos requeridos están en el paquete; pruebas Node de build, GOAT y respuestas sociales pasan.
**Salud jugable:** no determinada. Se requiere una sesión en navegador/dispositivo para completar el smoke test y la cobertura.

### Riesgos principales pendientes (no son fallos confirmados salvo donde se indica)

1. Sin prueba interactiva de inicio, avance y salida de los modos de jugador, entrenador y Crea tu club.
2. El renderer WebGL, GLB y mascota 3D no se inspeccionaron visualmente en navegador.
3. No se comprobó la reproducción audible de música, efectos ni mezcla.
4. No hay FPS medio/p1, memoria de navegador ni métricas de frame-time por sección.
5. No hay tiempos de completar los recorridos ni muertes/bloqueos por zona; el juego no tiene niveles tradicionales.
6. No se validó un AAB ni se ejecutó una prueba en dispositivo Android en esta auditoría.
7. No se probó paridad web/móvil con interacción táctil y orientación en dispositivo real.
8. **QA-001:** el historial de analytics puede poblarse con 120 eventos sintéticos; no usar ese historial como telemetría real.
9. No se probó accesibilidad con lector de pantalla, teclado, contraste o preferencias de movimiento reducido.
10. La suite actual no reproduce flujos completos de carrera, guardado/carga y salida en un navegador; ver **QA-002**.

## 2. Preparación y evidencia de baseline

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Dependencias | PASS | `npm ci`: 79 paquetes instalados; 0 vulnerabilidades informadas por npm audit. |
| Build web/juego | PASS | `npm run build`: Vite completó; script generó `dist/jugar/juego.html` como build 5.8/code 58. Duración observada: 3,7 s. |
| Smoke build | PASS | `npm run test:build`: `Build smoke test passed: v5.8 (58), music, 3D players, 3D pet, 10327 KB`; `Social reply tests passed`. |
| Cliente GOAT | PASS | `node test/goat-client.js`: “Todo correcto”; prueba deliberadamente errores/red simulados, no disponibilidad del servicio real. |
| Sintaxis JS | PASS | `node --check` en `legacy-game/src/*.js`. |
| Servicio local | PASS estático | `GET /jugar/juego.html`: HTTP 200, 10.575.128 bytes, TTFB 0,074 s, total 0,087 s en loopback. No equivale a carga hasta pantalla interactiva. |
| Navegador interactivo | BLOQUEADO | Chromium headless no inicia por bibliotecas del sistema ausentes: `libnspr4.so` y `libnss3.so`. No se obtuvieron capturas ni logs de ejecución del juego. |
| Tamaño del sitio | Medido | `dist/index.html`: 14.997 bytes. `dist/jugar/juego.html`: 10.575.128 bytes. |
| FPS / memoria / tiempos por modo | SIN MEDICIÓN | Requiere navegador ejecutable y perfil/dispositivo objetivo; no inferirlos del tiempo de build o `curl`. |
| Tag/rama QA | No creado | La sesión Arena fija la rama; auditoría de código en lectura y el reporte se mantiene en la rama activa. |

La salida de build incluye dos avisos de Vite sobre scripts clásicos `site.js` sin `type="module"`; el build termina correctamente y el plugin copia ese runtime. No se registran como fallo de juego sin evidencia de regresión.

## 3. Inventario de recorridos

No hay archivos de niveles o escenas de Unity/Unreal/Godot. Para cobertura QA se sustituyen por estos modos/recorridos:

1. Carrera de jugador/a: creación, progreso, decisiones/eventos, partidos, mercado, guardado/carga y retiro.
2. Carrera de entrenador: inicio, objetivos, plantilla/táctica, mercado, decisiones, partido en directo y cierre de temporada.
3. Crea tu club: creación/gestión, plantilla, competición, simulación y guardado/carga.
4. Flujos de partido: simulación de campo 2D y presentación/render 3D; minijuegos de penaltis y faltas.
5. Sistemas transversales: redes sociales, prensa/eventos, tienda/vestuario, mascota 3D, audio y accesibilidad.

## 4. Matriz de cobertura

`U` = sin prueba interactiva/evidencia visual en esta ejecución. Las pruebas de build comprueban presencia del bundle y módulos, pero no cambian `U` a “pasó”. `N/A` se reservaría para una categoría realmente no aplicable; aquí no se usa porque falta evidencia para decidirlo.

| Modo/recorrido | Funcional | Geometría/colisiones | Flujo/pacing | Signposting | Dificultad/economía | Controles/UX | Rendimiento | Accesibilidad | Narrativa/audio |
|---|---|---|---|---|---|---|---|---|---|
| Carrera de jugador/a | U | U | U | U | U | U | U | U | U |
| Carrera de entrenador | U | U | U | U | U | U | U | U | U |
| Crea tu club | U | U | U | U | U | U | U | U | U |
| Partido 2D / directo | U | U | U | U | U | U | U | U | U |
| Situaciones 3D / penaltis / faltas | U | U | U | U | U | U | U | U | U |
| Vestuario, tienda y mascota 3D | U | U | U | U | U | U | U | U | U |
| Redes, prensa y eventos | U | U | U | U | U | U | U | U | U |

## 5. Hallazgos con evidencia

### QA-001 — Historial analítico sintético puede confundirse con telemetría real

- **Nivel / zona:** sitio React, capa de analytics/panel de administración.
- **Severidad:** Minor; puede inducir a error en métricas del panel, sin impacto demostrado en la partida.
- **Frecuencia:** Always cuando `camino.analytics_events` está vacío o no contiene una lista válida.
- **Pasos de repro deterministas:**
  1. Borrar `localStorage['camino.analytics_events']`.
  2. Cargar el sitio React en una sesión nueva; el montaje registra un pageview (`src/App.tsx`, líneas 47–50).
  3. Revisar `localStorage['camino.analytics_events']` o el panel analítico.
- **Esperado:** un historial vacío/declarado como demo hasta recibir eventos reales, o una separación visible entre datos demo y producción.
- **Observado (evidencia de código):** `getOrSeedEvents()` genera 120 eventos históricos aleatorios cuando el almacenamiento está vacío (`src/analytics/tracker.ts`, líneas 67–113), y `logAnalyticsEvent()` usa esa función antes de guardar un evento (`líneas 125–127`).
- **Evidencia:** `src/analytics/tracker.ts:67–113,125–127`; `src/App.tsx:47–50`. El repro de UI no se ejecutó porque Chromium no arranca; el flujo estático está demostrado por el código.
- **Hipótesis de causa raíz:** se añadió historial ficticio para dar contenido al panel y el fixture comparte la misma clave/flujo que los eventos reales.
- **Fix propuesto:** separar datos demo de producción y no sembrar eventos sintéticos en el almacenamiento operativo ni enviarlos a analytics.
- **Alcance de regresión:** primera visita con almacenamiento vacío, panel admin, navegación/eventos reales, nueva visita con datos existentes y configuración GA4.

### QA-002 — No hay smoke test E2E de los recorridos principales

- **Nivel / zona:** cobertura de QA de todos los modos.
- **Severidad:** Minor (deuda de cobertura; no es fallo jugable confirmado).
- **Frecuencia:** Always en la suite del repositorio actual.
- **Pasos de repro deterministas:**
  1. Inspeccionar `package.json` y `test/`.
  2. Ejecutar `npm run test:build`.
  3. Comprobar que las pruebas validan bundle/modelos/marcadores y lógica aislada, pero no abren el juego para completar una carrera/partido.
- **Esperado:** smoke E2E reproducible para iniciar, avanzar, guardar/cargar y salir en cada modo; prueba móvil de gestos/viewport.
- **Observado:** `test/build-smoke.js`, `test/goat-client.js` y `test/social-replies.js` existen; no hay Playwright/Cypress/Selenium en dependencias y no se ejecutan flujos end-to-end.
- **Evidencia:** inventario de `test/`, `package.json`; Chromium no disponible por `libnspr4.so`/`libnss3.so` ausentes.
- **Hipótesis de causa raíz:** regresión y extracción de contenido se validan mayoritariamente por build/smoke estático, sin un harness de navegador.
- **Fix propuesto:** añadir E2E de navegador para los flujos críticos y ejecutarlo en CI con backend/almacenamiento controlados.
- **Alcance de regresión:** los cinco recorridos de la matriz, viewport táctil, WebGL fallback y carga/guardado.

## 6. Métricas baseline y límites

| Métrica | Baseline disponible |
|---|---|
| Build completo | 3,7 s observado en este entorno; no es tiempo de carga del juego. |
| Juego autocontenido | 10.575.128 bytes (aprox. 10,33 MiB). |
| Respuesta local del HTML | TTFB 74 ms; transferencia total 87 ms por loopback, no representa red/dispositivo real. |
| FPS medio / p1% | No medido: no arrancó un navegador interactivo. |
| Memoria | No medida. |
| Tiempo de carga hasta juego interactivo | No medido; solo se midió la descarga del HTML estático. |
| Tiempo de completar/muertes por zona | No aplicable a niveles convencionales y no medido en recorridos de carrera. |
| Heatmap / bloqueos por zona | No disponible en telemetría identificada. |

## Estado del gate

Fase 2 **bloqueada** hasta que el usuario revise y apruebe/rechace `QA-001` y `QA-002`. Además, antes de considerar la auditoría completa hace falta completar la matriz interactiva en navegador/dispositivo: el informe no afirma que haya cero blockers ni que los recorridos hayan pasado.
