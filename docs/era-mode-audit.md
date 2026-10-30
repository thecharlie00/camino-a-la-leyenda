# Auditoría inicial del Modo Épocas y adaptación de pantalla

**Fecha:** 2026-10-29 · **Checkout:** `arena/cfcb4237-camino-a-la-leyenda` · **Commit auditado:** `9d0e36d`

**Alcance:** auditoría de solo lectura del estado previo a esta solicitud. No se añadieron ligas, temporadas, clubes ni plantillas históricas. Los conteos se derivan de los scripts cargados por el juego; no prueban exactitud histórica.

## Dictamen ejecutivo

El Modo Épocas actual es un perfil de ambientación/reglas y una capa sobre el motor moderno; **no es un archivo de temporadas históricas**. Hay seis perfiles por década, 14 cambios cronológicos globales y decisiones contextualizadas, pero no un manifiesto temporada–competición–clubes, roster snapshots por año, calendario por competición ni referencias/licencias para verificar esos datos. No es posible afirmar paridad histórica mundial de 107 ligas. Hoy hay **0 temporadas históricas completas representadas como instantáneas verificables** en los datos de Épocas. La funcionalidad actual permite iniciar años entre 1970 y 2029 con equipos del mundo compartido actual; eso no equivale a que cada año sea una temporada documentada.

El objetivo de 107 se ha recalculado correctamente para el modo masculino normal: **107 entradas y 1.821 asignaciones equipo–liga**, en 61 códigos de territorio/federación. El conteo de referencia del usuario coincide con el runtime local en este commit. Se mantiene como cifra del modo moderno, no como cobertura histórica.

La recomendación es bloquear cualquier publicación de plantillas/ligas históricas presentadas como verificadas hasta completar la Fase B y disponer de fuentes con licencias comprobadas. Se puede mejorar ahora la adaptación visual responsiva de la interfaz común, sin alterar el modo moderno ni inventar datos.

## Estado de la rama y método reproducible

`git status --short --branch` mostró la rama `arena/cfcb4237-camino-a-la-leyenda` limpia, en `9d0e36d`. El conteo masculino se reproduce evaluando en contexto aislado las mismas extensiones que empaqueta `build_legacy_game.py` (`data.js`, `data-es.js`, `data-45.js`, `data-48.js`) y sumando los nombres no vacíos de `league.clubs.split('|')`:

```sh
node --input-type=commonjs <<'JS'
const fs = require('fs'), vm = require('vm');
const c = { DATA: {} }; vm.createContext(c);
for (const f of ['data.js','data-es.js','data-45.js','data-48.js'])
  vm.runInContext(fs.readFileSync('legacy-game/src/' + f, 'utf8'), c, { filename: f });
const leagues = c.DATA.leagues;
console.log({ leagues: leagues.length,
  clubAssignments: leagues.reduce((n,l) => n + (l.clubs || '').split('|').filter(Boolean).length, 0),
  uniqueClubNames: new Set(leagues.flatMap(l => (l.clubs || '').split('|').filter(Boolean))).size });
JS
```

Resultado: `107`, `1.821`, `1.821`. Tier: 61 nivel 1, 14 nivel 2, 8 nivel 3, 6 nivel 4 y 18 nivel 5. Hay 61 códigos distintos en `c`; son códigos de territorio/competición y no deben interpretarse sin más como 61 países soberanos. Los clubes de `DATA.leagues` son cadenas de nombres; no hay `historicalClubId`, vínculo histórico–moderno ni fechas de fundación/cambio en esas entradas. El motor construye referencias internas a partir del mundo (`W`) y de los nombres.

### Inventario completo de ligas del modo masculino normal

El número final es la cantidad de asignaciones de nombres de club en cada entrada; una asignación no es evidencia de participación en una temporada histórica.

| Nivel | ID | Código | Nombre en el modo normal | Asignaciones de clubes |
|---:|---|---|---|---:|
| 1 | `ENG1` | ENG | Premier League | 20 |
| 2 | `ENG2` | ENG | EFL Championship | 24 |
| 3 | `ENG3` | ENG | EFL League One | 24 |
| 1 | `ESP1` | ES | LaLiga EA Sports | 20 |
| 2 | `ESP2` | ES | LaLiga Hypermotion | 22 |
| 1 | `ITA1` | IT | Serie A | 20 |
| 2 | `ITA2` | IT | Serie B | 20 |
| 1 | `GER1` | DE | Bundesliga | 18 |
| 2 | `GER2` | DE | 2. Bundesliga | 18 |
| 1 | `FRA1` | FR | Ligue 1 | 18 |
| 2 | `FRA2` | FR | Ligue 2 | 18 |
| 1 | `POR1` | PT | Liga Portugal | 18 |
| 1 | `NED1` | NL | Eredivisie | 18 |
| 1 | `BEL1` | BE | Jupiler Pro League | 16 |
| 1 | `TUR1` | TR | Süper Lig | 18 |
| 1 | `SCO1` | SCO | Scottish Premiership | 12 |
| 1 | `AUT1` | AT | Bundesliga austriaca | 12 |
| 1 | `SUI1` | CH | Super League suiza | 12 |
| 1 | `DEN1` | DK | Superliga danesa | 12 |
| 1 | `NOR1` | NO | Eliteserien | 16 |
| 1 | `SWE1` | SE | Allsvenskan | 16 |
| 1 | `CZE1` | CZ | Chance Liga | 16 |
| 1 | `GRE1` | GR | Super League Grecia | 14 |
| 1 | `POL1` | PL | Ekstraklasa | 18 |
| 1 | `CRO1` | HR | SuperSport HNL | 10 |
| 1 | `SRB1` | RS | SuperLiga serbia | 16 |
| 1 | `UKR1` | UA | Premier League ucraniana | 16 |
| 1 | `RUS1` | RU | Premier League rusa | 16 |
| 1 | `ROU1` | RO | SuperLiga rumana | 16 |
| 1 | `HUN1` | HU | NB I | 12 |
| 1 | `CYP1` | CY | Liga chipriota | 14 |
| 1 | `KAZ1` | KZ | Premier League de Kazajistán | 14 |
| 1 | `BUL1` | BG | Efbet Liga | 16 |
| 1 | `SVK1` | SK | Niké Liga | 12 |
| 1 | `IRL1` | IE | League of Ireland | 10 |
| 1 | `ARG1` | AR | Liga Profesional | 30 |
| 1 | `BRA1` | BR | Brasileirão Série A | 20 |
| 1 | `URU1` | UY | Primera División uruguaya | 16 |
| 1 | `COL1` | CO | Liga BetPlay | 20 |
| 1 | `CHI1` | CL | Liga de Primera | 16 |
| 1 | `ECU1` | EC | LigaPro | 16 |
| 1 | `PAR1` | PY | Primera División paraguaya | 12 |
| 1 | `PER1` | PE | Liga 1 | 18 |
| 1 | `BOL1` | BO | División Profesional | 12 |
| 1 | `VEN1` | VE | Liga FUTVE | 12 |
| 1 | `MLS` | US | MLS | 30 |
| 1 | `MEX1` | MX | Liga MX | 18 |
| 1 | `CRC1` | CR | Primera División de Costa Rica | 10 |
| 1 | `KSA1` | SA | Saudi Pro League | 18 |
| 1 | `JPN1` | JP | J1 League | 20 |
| 1 | `KOR1` | KR | K League 1 | 12 |
| 1 | `QAT1` | QA | Stars League | 12 |
| 1 | `UAE1` | AE | UAE Pro League | 14 |
| 1 | `CHN1` | CN | Chinese Super League | 16 |
| 1 | `AUS1` | AU | A-League | 12 |
| 1 | `IRN1` | IR | Persian Gulf Pro League | 16 |
| 1 | `IND1` | IN | Indian Super League | 13 |
| 1 | `EGY1` | EG | Egyptian Premier League | 18 |
| 1 | `MAR1` | MA | Botola Pro | 16 |
| 1 | `RSA1` | ZA | Betway Premiership | 16 |
| 1 | `TUN1` | TN | Ligue Professionnelle 1 | 16 |
| 1 | `ALG1` | DZ | Ligue 1 argelina | 16 |
| 3 | `ESP301` | ES | Primera Federación · Grupo 1 | 20 |
| 3 | `ESP302` | ES | Primera Federación · Grupo 2 | 20 |
| 4 | `ESP401` | ES | Segunda Federación · Grupo 1 | 18 |
| 4 | `ESP402` | ES | Segunda Federación · Grupo 2 | 18 |
| 4 | `ESP403` | ES | Segunda Federación · Grupo 3 | 18 |
| 4 | `ESP404` | ES | Segunda Federación · Grupo 4 | 18 |
| 4 | `ESP405` | ES | Segunda Federación · Grupo 5 | 18 |
| 5 | `ESP501` | ES | Tercera Federación · Grupo 1 | 18 |
| 5 | `ESP502` | ES | Tercera Federación · Grupo 2 | 18 |
| 5 | `ESP503` | ES | Tercera Federación · Grupo 3 | 18 |
| 5 | `ESP504` | ES | Tercera Federación · Grupo 4 | 18 |
| 5 | `ESP505` | ES | Tercera Federación · Grupo 5 | 18 |
| 5 | `ESP506` | ES | Tercera Federación · Grupo 6 | 18 |
| 5 | `ESP507` | ES | Tercera Federación · Grupo 7 | 18 |
| 5 | `ESP508` | ES | Tercera Federación · Grupo 8 | 18 |
| 5 | `ESP509` | ES | Tercera Federación · Grupo 9 | 18 |
| 5 | `ESP510` | ES | Tercera Federación · Grupo 10 | 18 |
| 5 | `ESP511` | ES | Tercera Federación · Grupo 11 | 18 |
| 5 | `ESP512` | ES | Tercera Federación · Grupo 12 | 18 |
| 5 | `ESP513` | ES | Tercera Federación · Grupo 13 | 18 |
| 5 | `ESP514` | ES | Tercera Federación · Grupo 14 | 18 |
| 5 | `ESP515` | ES | Tercera Federación · Grupo 15 | 18 |
| 5 | `ESP516` | ES | Tercera Federación · Grupo 16 | 18 |
| 5 | `ESP517` | ES | Tercera Federación · Grupo 17 | 18 |
| 5 | `ESP518` | ES | Tercera Federación · Grupo 18 | 18 |
| 4 | `ENG4` | ENG | EFL League Two | 24 |
| 3 | `GER3` | DE | 3. Liga | 19 |
| 3 | `ITA301` | IT | Serie C · Girone A | 20 |
| 3 | `ITA302` | IT | Serie C · Girone B | 18 |
| 3 | `ITA303` | IT | Serie C · Girone C | 19 |
| 3 | `FRA3` | FR | National | 16 |
| 2 | `POR2` | PT | Liga Portugal 2 | 17 |
| 2 | `NED2` | NL | Keuken Kampioen Divisie | 17 |
| 2 | `BEL2` | BE | Challenger Pro League | 16 |
| 2 | `TUR2` | TR | TFF 1. Lig | 20 |
| 2 | `SCO2` | SCO | Scottish Championship | 10 |
| 2 | `ARG2` | AR | Primera Nacional | 19 |
| 2 | `BRA2` | BR | Brasileirão Série B | 20 |
| 2 | `JPN2` | JP | J2 League | 17 |
| 1 | `THA1` | TH | Thai League 1 | 16 |
| 2 | `THA2` | TH | Thai League 2 | 18 |
| 1 | `MYS1` | MY | Malaysia Super League | 12 |
| 1 | `NGA1` | NG | Nigeria Premier Football League | 20 |
| 1 | `IDN1` | ID | Liga 1 Indonesia | 18 |
| 1 | `VIE1` | VN | V.League 1 | 14 |

Los campos opcionales `cup` y `sc` de las entradas codifican 54 nombres distintos de copa y 12 de supercopa. Son metadatos del mundo actual, no temporadas/catálogos históricos autónomos, y el conteo no certifica que cada edición se modele con reglas y participantes correctos. El motor contiene además competiciones generadas/procedurales; requieren una auditoría específica antes de publicar un total de «todas las competiciones».

### Variantes femeninas (conteo separado)

El Modo Épocas fuerza `g: "m"` al iniciar jugador o entrenador. No se debe atribuir paridad femenina al 107 masculino. La ejecución de los archivos actuales dio:

| Dataset runtime | Entradas | Asignaciones equipo–liga | Nota |
|---|---:|---:|---|
| `DATA.leaguesF` | 87 | 1.293 | Con `data-f.js`, `data-45.js` y `data-48.js` |
| `DATA.leaguesF2` | 92 | 1.271 | Variante seleccionada por `buildWorld("f2")`; no sumar a `leaguesF` |

No se inspeccionó su cobertura histórica, y las temporadas femeninas no son intercambiables con las masculinas.

## Datos de clubes, plantillas y temporadas actuales

- `legacy-game/src/data.js` + extensiones crean el mundo actual mediante nombres y reglas de liga; clubes no llevan metadatos históricos por temporada.
- `legacy-game/src/real.js` declara `REAL.y = 2026`: 270 clubes, 4.669 filas de jugadores y 17 plantillas vacías. `real-f.js` declara también 2026: 84 clubes y 1.906 filas. Los comentarios de ambos archivos describen nombres versionados/alterados «estilo PES», no una base de identidades licenciadas. No se encontró en esos registros procedencia por jugador/club, licencia, alias estable o control de colisiones. Por tanto, contar filas no significa plantillas verificadas, ni deben tratarse como datos históricos.
- En la ruta Épocas, `eraStartCareer()` llama a `buildWorld("m")`, fija temporalmente `START_YEAR`, y desactiva la consulta de la base `REAL` (`realDB` devuelve `null` con época activa). `S.era.playerNames` indica `generated-archetypes`. La plantilla es generada, no una alineación histórica fechada.
- El calendario común del motor declara bloques Ago–Sep, Oct–Nov, Dic–Ene, Feb–Mar y Abr–May. No hay tipo de calendario por liga (natural, cruzado u otro), ni fecha de corte de plantilla. Esto no soporta correctamente ligas primavera–otoño por temporada sin una extensión de modelo y pruebas.

## Inventario real del Modo Épocas existente

| Área | Presente | Límite observado |
|---|---|---|
| Décadas | 6 packs: 1970s–2020s; 10 años cada uno (60 opciones de año, 1970–2029). En 1990s, el `startYear` inicial es 1992, aunque el rango del pack incluye 1990–1999. | Perfiles por década, no instantáneas por temporada; se permiten años sin una ficha verificable. 2027–2029 son futuros respecto a esta auditoría. |
| Clubes de referencia | 60 menciones en listas de pack, 18 nombres únicos. | Son seleccionados de la base moderna compartida; no una lista de participantes de cada temporada. No existe vínculo histórico–moderno. |
| Reglas | Timeline schema 1 con 14 hitos, combinados globalmente por año. | No hay fuente, alcance territorial/competitivo, vigencia, excepción ni confianza por registro. Los hitos globales no modelan adopción distinta por liga. Algunas reglas solo aparecen en perfil/UI; por ejemplo, el test existente confirma que el setup no presenta el pase atrás como regla jugable. |
| Decisiones | `decisions.json` schema 2: 1.000 registros (600 decisiones base + 400 contextualizadas con 40 anclas). La interfaz declara que el dilema/efectos son ficticios y que el hecho es solo contexto. | No hay referencias bibliográficas/citación o metadatos de confianza para las 40 anclas; no se deben elevar a hechos verificados hasta revisar y citar sus fuentes. |
| Partidas | `EraStore`, schema 1, prefijo aislado `camino.eras.v1.`; la suite prueba que las partidas modernas se vacían/guardan antes de sustituir estado y se conservan aisladas. | No hay esquema versionado de snapshot histórico ni migración de estas temporadas inexistentes. Mantener separación actual. |
| Idiomas | ES/EN/DE/IT/FR en UI y catálogo. | Ninguna etiqueta actual diferencia de manera sistemática temporada histórica verificada, parcial, simulada o no disponible. |
| Paquete | `build_legacy_game.py` incluye perfiles, timeline, decisiones y traducciones dentro de `ERAS_DATA` del HTML integrado. JSON fuente sumado: 258.743 bytes; el HTML de web antes del cambio responsive: 10.871.609 bytes (tras esta mejora CSS: 10.872.965 bytes). | No hay carga bajo demanda. No se añadieron datos en esta auditoría; el tamaño de `dist` refleja build preexistente y no se usa como prueba funcional. |
| Pruebas | `test/eras-mode.js`, `test/runtime-smoke.js`, `test/build-smoke.js`; `npm run build`, `npm run test:build`. | Las pruebas existentes validan estructura, textos, saves/aislamiento y hooks, no la exactitud histórica de ligas, clubes, plantillas o reglas. |

### Mapa de arquitectura auditado

- Entrada/build: `build_legacy_game.py`, `legacy-game/src/ui-boot.js`; genera HTML único y empaqueta Android.
- Ligas y mundo: `data.js`, `data-es.js`, `data-45.js`, `data-48.js`; `engine-core.js` construye `W`.
- Plantillas normales: `real.js`, `real-f.js`; jugadores generados y plantillas de clubes son compartidos por los sistemas modernos, pero Épocas deshabilita `realDB`.
- Modo Épocas: `erascene/packs/*.json`, `rules-timeline.json`, `decisions.json`, `translations.json`; `eras-core.js`, `ui-eras.js`.
- Persistencia/localización: `EraStore` en `eras-core.js`; idiomas ES/EN/DE/IT/FR; claves requeridas por el empaquetador y tests.
- No se identificó un dataset de temporada histórica real ni manifests de participantes entre las rutas de datos auditadas.

## Exactitud histórica, fuentes y licencias: riesgos/bloqueos

1. No hay un campo de fuente/procedencia, versión, fecha de consulta, licencia, estado o confianza en packs/timeline/decisiones. Solo se hizo un chequeo preliminar de metadatos, licencias declaradas, README y rutas GitHub (29-10-2026); no se verificaron hechos concretos de temporada contra fuentes oficiales ni se copió ningún dato externo. Las afirmaciones históricas existentes no quedan verificadas por esta auditoría de código.
2. Revisión preliminar de las fuentes GitHub sugeridas: [OpenFootball World](https://github.com/openfootball/world), [football.json](https://github.com/openfootball/football.json) e [Internationals](https://github.com/openfootball/internationals) declaran CC0 en `LICENSE.md` y metadatos del repositorio. World y football.json no muestran archivos de temporada 1992 en sus árboles revisados; Internationals sí tiene resultados de selecciones de 1992, pero no resuelve plantillas de clubes ni pirámides domésticas. [RSSSF clubs](https://github.com/rsssf/clubs) contiene, por ejemplo, una ruta de Bundesliga 1992–93, pero no declara licencia (`license` del API nulo y sin archivo LICENSE/COPYING); [engsoccerdata](https://github.com/jalapic/engsoccerdata) tampoco declara licencia en los metadatos/árbol inspeccionado y su README reconoce cobertura incompleta o datos pendientes de comprobación en algunas colecciones. Ninguno de esos dos se redistribuirá hasta verificar condiciones originales/upstream. Este es solo un chequeo de repositorio, no validación histórica de temporadas.
3. No hay fuente/permiso por dato en los archivos actuales. La búsqueda local no encontró un archivo `LICENSE`/`COPYING` ni un inventario de fuentes en las rutas revisadas; esto no determina por sí solo los derechos del juego, pero bloquea asumir permiso de redistribución de datos históricos de terceros.
4. `REAL` contiene nombres alterados muy parecidos a identidades actuales; una alteración tipográfica no acredita licencia ni sirve como política segura de alias históricos. No trasladar estos nombres a décadas anteriores.
5. Las reglas por timeline se difunden por año, no por competición/territorio/categoría. El año de una reforma no prueba la fecha efectiva en cada competición.
6. No hay registros de temporada de participantes, ascenso/descenso, fusiones, cambios de nombre ni ligas que aún no existían. Usar el nombre actual o los clubes de referencia de un pack como sustituto histórico produciría anacronismos.
7. No hay calendario primavera–otoño versus temporada cruzada, fecha de corte para plantilla ni transición entre temporadas históricas.
8. El requisito de 107 es meta de paridad del producto, no evidencia de disponibilidad: **conteo normal 107; histórico verificable actual 0; brecha de referencia 107**. No se crearán 107 registros ficticios para cerrar la brecha.

## Evaluación de adaptación de pantalla (interfaz web y WebView común)

El layout principal usa `100dvh`, un `#app` de ancho máximo 720 px y `main` desplazable; el mismo CSS sirve al web y al Android WebView. Ya hay media queries puntuales para ancho, pero no un conjunto coherente de perfiles para orientación y altura corta. Los avisos `.ntfs` son `position:fixed`; empiezan a 80 px desde arriba y no limitaban la altura de la pila al alto visible. El historial implementado previamente está dentro del juego y tiene lista desplazable; un toast temporal aún podía cubrir controles en una pantalla baja.

Android dibuja edge-to-edge, y `MainActivity` aplica el inset superior al WebView, pero no transmite explícitamente el inset inferior/lateral al CSS. No se probó en un dispositivo Android; la lectura de CSS aquí no demuestra cómo se comportan todos los WebViews, barras de navegación o teclados. La mejora segura es usar el viewport real (ancho, alto dinámico y orientación) en CSS común, mantener contenido desplazable y limitar/permitir desplazar la pila de avisos. No hace falta crear otra interfaz React ni forzar capas gráficas. La prueba real en Android sigue pendiente.

## Decisión y plan por fases

### A — Inventario (completado en esta auditoría)

- Recalculado el modo masculino: 107/1.821; registrado el conteo separado femenino.
- Mapeados motor, perfiles, reglas, decisiones, localización, saves, empaquetado y pruebas.
- Límite principal: sin snapshots históricos verificables; inventario histórico de ligas/clubes = cero.

### B — Especificación (siguiente; antes de datos de juego)

1. Definir IDs separados para temporada, competición, territorio y club; esquema de temporada y estados `verified`, `partial`, `unavailable`, `did_not_exist`, `not_yet_researched`.
2. Añadir metadatos obligatorios de fuente concreta, autor/organizador, versión/fecha, alcance, licencia/atribución y nivel de confianza. Rechazar registros seleccionables sin mínimos verificables.
3. Definir `startYear/endYear/calendarType`, fecha de corte, formatos y ámbitos de reglas; especificar alias deterministas que sean suficientemente transformados y sin afirmar identidades reales.
4. Publicar matriz de fronteras de las competiciones (creación, desaparición, reforma) solo después de investigación y revisión de fuentes oficiales/independientes.
5. Estimar el volumen tras elegir la muestra; no prometer 107 por temporada. Todo déficit debe figurar por confederación/país/nivel y razón.

### C — Muestra vertical (bloqueada por datos/fuentes)

Elegir después de la Fase B una temporada y un conjunto acotado de ligas existentes en la base (candidato de planificación: una temporada 1992–93 con niveles en Inglaterra, pero **aún no seleccionado ni investigado**). Entregar roster sintético o alias únicamente con política aprobada; temporada debe permitir iniciar, simular, guardar, cargar y completar. No llamar «histórico verificado» a equipos/plantillas sin fuente y licencia comprobadas.

### D — Expansión

Importar de forma incremental solo datasets con derechos/atribución compatibles. Manifiesto automático con conteos reales por año, continente, país, nivel y estado; tests de fronteras, participantes, fechas, calendario, reglas, IDs, alias, saves, modo moderno y tamaño/offline. El número histórico mostrado será el verificado, y la brecha hacia 107 permanecerá explicada mientras exista.

### Prioridad de implementación ahora

Se puede mejorar la adaptación responsiva y la visibilidad de avisos sobre el CSS común, sin tocar los datos normales ni los datos históricos. No se añadirá aún ninguna liga, club, temporada o regla histórica. No se ha ejecutado Android Studio ni dispositivo real.

## Verificaciones de esta auditoría

- Conteo runtime masculino: **107 ligas / 1.821 asignaciones / 1.821 nombres de club únicos**.
- Conteo runtime femenino: **87 / 1.293** (`leaguesF`) y **92 / 1.271** (`leaguesF2`), reportado por separado.
- Perfiles: 6; menciones de clubes: 60/18 únicos; timeline: 14; decisiones: 1.000/40 anclas.
- Tras documentar la auditoría y aplicar el ajuste responsivo, `npm run build`, `npm run test:build` (suite completa, incluidos asserts de viewport/toasts) y `git diff --check` pasaron. La rama estaba limpia al empezar la auditoría.
- No se probó el layout en un dispositivo Android real ni en todas las combinaciones de viewport/teclado; esa validación manual sigue pendiente.
