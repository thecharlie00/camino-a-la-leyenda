# Cobertura del Modo Épocas

**Qué es este documento.** El límite declarado del Modo Épocas: qué datos históricos existen en el juego, qué se simula y cómo lo dice la interfaz. No es una lista de todo el fútbol histórico ni una promesa de plantillas reales.

**Fecha:** 2026-10-27. **Rama:** `arena/cd3c936f-camino-a-la-leyenda`.

---

## 1. Qué hay

| Pieza | Cantidad | Qué significa |
|---|---:|---|
| Perfiles de época | 6 | 1970s, 1980s, 1990s, 2000s, 2010s y 2020s, con reglas, economía, medios y presentación propios. |
| Decisiones jugables | 1.000 | 100 por década como mínimo; 400 ancladas a 40 hechos históricos y 600 originales. Los dilemas y sus efectos son ficción; el hecho solo da contexto. |
| Temporadas con campeones reales | 56 | De 1950 a 2024 en `erascene/history.json`. Son campeones de liga y competiciones continentales, no plantillas. |
| Clubes con historia de nombre o fundación | 239 | `erascene/clubs-history.json`; un club sin entrada existe con su nombre actual para cualquier año. |
| Competiciones con historia de nombre | 39 | 25 tenían datos antes de esta tanda; 14 se añadieron aquí (ver §2). |
| Competiciones continentales y nacionales | 14 + 8 + 2 | Club, selecciones y torneos domésticos de época con nombres y formatos por año. |
| Momentos de leyenda | 18 | Tres por década, en `erascene/moments.json`. |

Las partidas de Épocas guardadas **también aparecen en el menú normal de carga** («Cargar partida»), con la etiqueta «Modo Épocas», la década, el año y el club. Se pueden continuar o borrar desde ahí sin entrar antes al selector de Épocas; el guardado moderno se conserva y no se mezcla con `camino.slots`.

## 2. Competiciones con año de fundación añadido

Se añadió `since` (y una serie de nombres cuando la fuente la documenta) a catorce competiciones que **no existían en 1970** y a NIR1 (1890). La tabla incluye también WAL1, que ya tenía año de fundación desde la expansión de ligas y se revisó en esta tanda, para que una carrera no pueda empezar en ellas antes de su fundación. La comprobación es `eraLeagueExists` y se aplica al selector de club de Épocas.

| ID | Desde | Nombres de época documentados | Fuente |
|---|---:|---|---|
| NGA1 | 1972 | Nigeria Premier Football League | Wikipedia, *Nigeria Premier Football League* |
| UAE1 | 1973 | UAE Football League → UAE Pro League (2007) | Wikipedia, *UAE Pro League* |
| VIE1 | 1980 | National A1 League → National Elite Football Championship (1990) → National First Division (1997) → V-League (2001) → V.League 1 (2012) | Wikipedia, *V.League 1* |
| UKR1 | 1991 | Vyshcha Liha → Ukrainian Premier League (2008) | Wikipedia, *Ukrainian Premier League* |
| WAL1 | 1992 | League of Wales → Welsh Premier League (2002) → Cymru Premier (2019) | Wikipedia, *Cymru Premier* |
| CRO1 | 1992 | Croatian First Football League | Wikipedia, *1992 Croatian First Football League* |
| RUS1 | 1992 | Russian Football Championship → Russian Premier League (2002) | Wikipedia, *Russian Premier League* |
| KAZ1 | 1992 | Kazakhstan Premier League | Wikipedia, *Kazakhstan Premier League* |
| AZ1 | 1992 | Yüksək Liqa → Azerbaijan Premier League (2007) | Wikipedia, *Azerbaijan Premier League* |
| CZE1 | 1993 | Czech First League | Wikipedia, *Czech First League* |
| SVK1 | 1993 | Slovak First Football League | Wikipedia, *Slovak First Football League* |
| THA1 | 1996 | Thailand Premier League → Thai League 1 (2017) | Wikipedia, *Thai League 1* |
| MYS1 | 2004 | Malaysia Super League | Wikipedia, *Malaysia Super League* |
| IDN1 | 2008 | Indonesia Super League → Liga 1 (2017) | Wikipedia, *2017 Liga 1 (Indonesia)* |
| SRB1 | 2005 | Serbian SuperLiga | Wikipedia, *Serbian SuperLiga* |

También se añadió `since` a **NIR1 (1890)** y las series femeninas de **FI1, IS1, WAL1 y NIR1**, porque esas cuatro primeras divisiones entraron en la expansión de ligas y Épocas debe mostrar el nombre de la época, no la marca actual. La serie femenina solo se usa si el motor construye un mundo femenino; las carreras de Épocas siguen siendo masculinas (ver §4).

**Límite importante:** un año de fundación no inventa una plantilla. Las carreras de Épocas usan arquetipos generados (`rosterMode: "generated-archetypes"`) y los clubes del mundo compartido, no participantes históricos verificados. Cuando un club no tiene entrada histórica, existe con su nombre actual y esa ausencia **no** se presenta como prueba de que existiera o dejara de existir.

## 3. Dónde termina la historia real

Los campeones reales registrados terminan en **2024** (temporada de clubes) y 2024 en los torneos de selecciones. A partir de ahí:

- el Anuario deja de comparar porque no hay campeón real que mostrar;
- la interfaz del HUD marca **«Sin referencia histórica»** en cuanto la temporada supera 2024;
- el diálogo de Reglas explica que se conservan congeladas las reglas de la última temporada documentada y que la competición es una simulación;
- el Anuario añade la misma advertencia en su cabecera.

No hay un «futuro oficial» inventado: las temporadas posteriores son simulación del juego y así se etiquetan. La comprobación se hace en `eraHistoryLastSeason()` / `eraUndocumentedSeason()` / `eraCoverageNotice()` y se prueba en el bundle Android real.

## 4. Qué queda fuera, a propósito

- **Carreras femeninas en Épocas.** El modo crea carreras masculinas (`g: "m"`) porque no existe un archivo histórico femenino con temporadas y clubes verificables. Las series de nombres femeninas añadidas no simulan plantillas ni temporadas. El fútbol femenino completo sigue en el modo moderno.
- **Plantillas por año.** No hay snapshots de jugadores: los futbolistas son ficticios y estables, generados por arquetipos.
- **Más de 1.500 clubes sin historia de nombre ni fundación.** Añadirlos exigiría una fuente por club; hoy solo se documentan los 239 con fuente.
- **Nombres de competición anteriores a la fundación de ligas sin serie.** Cuando no hay fuente para la denominación de la época se conserva el nombre actual como respaldo; la liga nueva solo se ofrece a partir de su año de fundación.
- **Calendarios, play-off y reestructuraciones oficiales.** El motor aplica su propia mecánica; no se reproduce el calendario real.
- **Futuro posterior a 2029.** Se congela el perfil 2020s y todo se marca como simulación; no se extrapolan normas nuevas.

## 5. Verificación automática

- `test/eras-mode.js`: años de fundación de las 15 competiciones, nombres por año, cobertura 2024/2025 y guardias de la interfaz.
- `test/eras-coverage.cjs` (nuevo): fuentes de los años posteriores a 1970, series femeninas, arranque real de una carrera 2024 sin etiqueta y 2026 con etiqueta, aviso del Anuario, guardado visible y continuable desde el menú normal de carga, borrado, y salida limpia del modo moderno.
- El build valida el historial de ligas: series cronológicas, fuente para la serie femenina y estructura de los perfiles.
