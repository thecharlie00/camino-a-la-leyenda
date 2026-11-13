# Inventario de competiciones y expansión 5.33

**Qué es este documento.** El inventario país/división/género que pedía la propuesta de gran actualización antes de tocar datos, más el registro de lo que se ha añadido en esta rama y de lo que sigue pendiente. No es una lista de «todas las ligas»: cada fila describe lo que existe en el **mundo simulado del juego**, no la estructura oficial de un país.

**Fecha de la fotografía:** 2026-10-27. **Rama:** `arena/cd3c936f-camino-a-la-leyenda`.

---

## 1. Método

1. Se contaron las competiciones cargadas por `DATA.leagues` (masculino), `DATA.leaguesF` (femenino, mundo `f`) y `DATA.leaguesF2` (femenino, mundo `f2`) con los ficheros `data*.js` reales, no con documentación.
2. Se localizaron los **huecos de ruta**: países con primera división y **sin** segunda, es decir, carreras que no pueden descender ni ascender dentro de ese país.
3. Se priorizaron diez países europeos con cobertura verificable y se añadió **la misma competición en ambos géneros**: seis segundas divisiones para países que solo tenían primera y cuatro primeras divisiones para países que no tenían ninguna (Finlandia, Islandia, Gales e Irlanda del Norte).
4. Cada competición nueva se documenta en `real/sources.json` (masculino) o `real-f/sources.json` (femenino) con estado, fuente, cobertura y límites. El estado `verified-season-participants` significa que la lista de clubes se copió de una página de temporada identificable; `curated-pool` significa **que no se verificó una plantilla oficial** y que solo sirve para simular una categoría.
5. `test/league-expansion.cjs` comprueba el catálogo, la procedencia declarada, la paridad, la ausencia de colisiones de nombres y, en el bundle Android compilado, que el motor enlaza las rutas en los dos mundos.

## 2. Inventario antes de la expansión

| Mundo | Competiciones | Países | Países con ruta completa (primera y segunda división) |
|---|---:|---:|---|
| Masculino (`DATA.leagues`) | 109 | 62 | ENG, ES, IT, DE, FR, PT, NL, BE, TR, SCO, AR, BR, JP, TH, AZ |
| Femenino `f` (`DATA.leaguesF`) | 88 | 57 | ENG, ES, IT, DE, FR |
| Femenino `f2` (`DATA.leaguesF2`) | 93 | 61 | ENG, ES, IT, DE, FR |

Son recuentos de listas del código. No miden ligas reales, ni cobertura de todos los niveles, ni verifican ninguna temporada; hay clubes compartidos entre listas y divisiones simuladas.

Los huecos relevantes: Austria, Suiza, Dinamarca, Noruega, Suecia y la República Checa tenían **solo primera división** en el mundo masculino, y exactamente lo mismo en el femenino. Una carrera en esos países no podía bajar ni subir de categoría.

## 3. Competiciones añadidas (20: 10 por género)

Cada una se añade **al final** del mundo correspondiente con la marca `xl`, para que los índices de clubes de las partidas guardadas no se muevan, y su primera división recibe `down` + `rel` para cerrar la ruta.

| País | Masculino | Clubes | Femenino | Clubes | Ruta |
|---|---|---:|---|---:|---|
| Austria | 2. Liga austriaca | 15 | 2. Liga femenina austriaca | 10 | AUT1 ⇄ AUT2 (1 ascenso/descenso) |
| Suiza | Challenge League suiza | 9 | Women's Challenge League | 10 | SUI1 ⇄ SUI2 (1) |
| Dinamarca | 1. Division danesa | 10 | Kvinde 1. division | 10 | DEN1 ⇄ DEN2 (2) |
| Noruega | 1. divisjon noruega | 16 | 1. divisjon femenina noruega | 13 | NOR1 ⇄ NOR2 (2) |
| Suecia | Superettan | 16 | Elitettan | 14 | SWE1 ⇄ SWE2 (2) |
| República Checa | Chance Národní liga | 14 | 2. liga femenina checa | 10 | CZE1 ⇄ CZE2 (2) |
| Finlandia | Veikkausliiga | 12 | Kansallinen Liiga | 8 | Solo primera división (sin segunda simulada) |
| Islandia | Besta deild karla | 12 | Besta deild kvenna | 10 | Solo primera división |
| Gales | Cymru Premier | 16 | Adran Premier | 8 | Solo primera división |
| Irlanda del Norte | NIFL Premiership | 12 | Women's Premiership | 8 | Solo primera división |

**Procedencia real de cada lista**

- **Masculino, las seis:** `verified-season-participants`. Las listas se copiaron de las páginas de temporada 2026/27 (Austria, Suiza, Dinamarca, la República Checa) y de las temporadas de año natural 2026 (Noruega, Suecia). Cuando un club de la lista ya existía en la primera división del juego, **se ha excluido del pool** y así consta en los límites del registro: Blau-Weiß Linz (Austria), Winterthur (Suiza), Vejle y Fredericia (Dinamarca), Karviná y Dukla Praga (República Checa). Por eso Suiza queda con 9 clubes: el calendario del juego se adapta a ida y vuelta y no reproduce el calendario oficial.
- **Primeras divisiones nuevas, ocho:** las cuatro masculinas y las cuatro femeninas están respaldadas por una página de temporada identificable (`verified-season-participants`): Veikkausliiga 2026, Besta deild karla 2026, Cymru Premier 2026/27, NIFL Premiership 2026/27, Kansallinen Liiga 2026, Besta deild kvenna 2026 (Wikipedia islandesa), Adran Premier 2026/27 y Women's Premiership 2026. Cuando el club ya existía en otra liga del mismo mundo, se ha mantenido el nombre de la fuente y **no** se ha duplicado: es el caso de «Derry City Ladies» en la liga norirlandesa femenina, renombrado en el juego para no chocar con el Derry City del campeonato irlandés ya presente. Los registros conservan el nombre real en `participants` y el nombre del juego en `gameParticipants`, y lo declaran en sus límites.
- **Femenino, una segunda verificada:** Elitettan 2026 (Suecia), con los 14 clubes de la página de temporada.
- **Femenino, cinco segundas curadas:** Austria, Suiza, Dinamarca, Noruega y la República Checa. Los registros declaran `curated-pool`, explican la base del pool y llevan el límite literal «This is not a verified 2026/27 roster». **No deben leerse como la plantilla oficial de la temporada** y la interfaz no las presenta como tal. Suiza y la República Checa usan filiales `II` de clubes que ya existen en la primera división femenina del juego.

**Lo que estas listas no son**

- No son datos históricos ni sirven para Épocas.
- No son valoraciones oficiales: `top`/`bot` son estimaciones de simulación.
- No reproducen el calendario, las reglas de ascenso ni los play-off oficiales de cada país; el motor aplica su propia mecánica (ascenso directo de los primeros y descenso de los últimos).
- No se ha simulado la reestructuración 2027/28 de ninguna federación.

## 4. Verificación automática

`node test/league-expansion.cjs` (dentro de `npm run test:build`):

1. Los ficheros `legacy-game/src/data-49.js` y `src/data-49.js` son idénticos y el build los carga justo después de `data-48.js`.
2. Veinte competiciones nuevas (diez por mundo): seis segundas divisiones y cuatro primeras, con al menos 8 clubes, sin clubes repetidos dentro de la competición y sin reutilizar ningún club ya presente en su mundo. Las primeras divisiones nuevas no declaran descenso a una segunda inexistente.
3. Ninguna liga existente desaparece; los recuentos suben exactamente en diez por mundo (109 → 119, 88 → 98, 93 → 103). La liga femenina norirlandesa queda con 8 clubes tras resolver la colisión de nombres.
4. Paridad: los mismos diez países y el mismo número de clubes en los dos mundos femeninos (`leaguesF` y `leaguesF2`).
5. Procedencia: cada identificador tiene registro; las verificadas declaran fuente y clubes que coinciden **literalmente** con el pool del juego; las curadas declaran su base y que no son una plantilla verificada.
6. Una simulación de la rutina real de fin de temporada (extraída de `engine-core.js`) mueve el campeón de la segunda división a la primera y el último de la primera a la segunda, sin tocar al resto.
7. Bundle Android real en JSDOM: `buildWorld('m')` y `buildWorld('f2')` crean las veinte ligas, la primera división apunta a la segunda (`downI`), la segunda asciende a la primera (`upI`) y `lgUpN` coincide con las plazas de descenso de la categoría superior; las primeras nuevas se construyen con su número real de clubes.
8. Dos carreras reales: una en una segunda división nueva (Admira Wacker, 2. Liga austriaca, con una plaza de ascenso) y otra en una primera nueva (The New Saints, Cymru Premier, 16 clubes).
9. Los paquetes de Épocas no mencionan ninguno de los identificadores nuevos, así que la expansión no se cuela en el modo histórico. Además, `erascene/clubs-history.json` declara el nombre histórico de las cuatro primeras ligas nuevas —con su propia serie femenina— para que Épocas no muestre nombres comerciales actuales sobre un año antiguo.
10. El historial de ligas de Épocas se valida en el build: series cronológicas, sin fechas anteriores a la fundación declarada y con fuente propia para la serie femenina.

## 5. Límites y siguiente bloque

- El objetivo de 20 competiciones de esta tanda está cubierto (10 por género, 20 si se cuentan las dos ramas). No significa «todas las ligas»: siguen existiendo países sin segunda división simulada y las cuatro primeras nuevas no tienen ruta de descenso.
- Las cinco segundas femeninas curadas siguen siendo eso, curadas: **no se presentan como plantillas verificadas** y no deben contarse en el total de ligas verificadas.
- Las competiciones nuevas están en el mundo moderno; Épocas solo recibe sus nombres históricos, no sus clubes ni sus plantillas actuales.
- Repetir el ciclo para países sin segunda división fuera de Europa (por ejemplo, ligas de América), respetando la transición estructural 2027/28 cuando afecte.
- Revisión visual y de progresión en dispositivo Android: la QA en dispositivo queda en manos del usuario.
