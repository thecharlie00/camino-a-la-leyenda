# Prompt revisado: evolucionar el Modo Épocas a una experiencia propia

> Versión contextualizada con la implementación observada en este repositorio. Antes de tocar código, vuelve a comprobar los archivos y `git status`: este documento no sustituye la inspección de la rama de trabajo.

## Contexto verificado del proyecto

- El juego se ejecuta con el motor vanilla JavaScript de `legacy-game/src/`; `build_legacy_game.py` lo empaqueta como HTML autocontenido para web y Android. No crear una segunda experiencia React ni cambiar el modo moderno para implementar Épocas.
- El Modo Épocas ya está integrado en el selector de modos de **Jugar → Nueva partida → Elige un modo** y también en el acceso de la portada. Comparte el motor y la interfaz actuales.
- Hay seis perfiles JSON (`legacy-game/erascene/packs/`): 1970–79, 1980–89, 1990–99, 2000–09, 2010–19 y 2020–29. Se puede elegir año exacto dentro del periodo; el formulario inicial usa 1992 como año por defecto. El motor aplica el perfil del año y fusiona los eventos anteriores de `rules-timeline.json`. Para años posteriores al último perfil, `eraPackForYear` devuelve el perfil más reciente: no presentar esos años como historia documentada sin revisar esa conducta.
- La configuración actual permite carrera de jugador o míster. La creación fuerza el mundo masculino (`g: "m"`). El míster elige club de una lista filtrada de clubes de referencia existentes; el jugador empieza como arquetipo generado, con nombre editable, sin plantilla histórica licenciada. No hay una base de plantillas históricas verificadas en este modo.
- Los guardados de Épocas son independientes: prefijo `camino.eras.v1.`, índice separado, esquema 1 y hasta diez entradas. No deben modificar `camino.slots` ni los guardados del modo moderno. `test/eras-mode.js` comprueba esta separación y que no se acepten guardados de esquema futuro.
- Ya hay efectos jugables conectados al motor: puntos por victoria, gol de oro, límites de sustituciones, ventanas/mercado anual, algunas escalas de salario/valor/presupuesto y de atributos/entrenamiento, ocultación de la pestaña social antes de 2010 y comprobación de VAR para Premier League/La Liga. El modo también muestra el año, puntos por victoria y un canal de medios en su HUD.
- **No asumir que todos los campos JSON ya tienen efecto.** En los perfiles hay metadatos de Bosman, pase atrás, patrocinio, récord de traspaso, agentes, `pressingScale`, clima/terreno, equipaciones, balón, vallas, anuncios y personal. La inspección actual no demuestra que todos estén conectados a sistemas jugables: algunos se muestran como resumen o skin, y otros parecen ser solo datos. Auditar cada campo antes de describirlo como mecánica.
- La cronología codifica, entre otros, estos hitos: tres puntos desde 1981; cambios de presentación desde 1990; reglas de 1992–95; ventanas obligatorias desde 2002; canales web en 2004; redes, analistas y ciencia deportiva desde 2010; tecnología de línea de gol desde 2013; VAR por competiciones desde 2018/2019; cinco cambios/calendario COVID desde 2020 y fin del calendario comprimido en 2022. Son **datos actuales del proyecto, no fuentes históricas por sí mismos**. Verificar fechas, ámbito y efecto antes de conservarlos o ampliarlos. La lógica actual de VAR solo resuelve expresamente Premier League y La Liga.
- Las pruebas relevantes son `test/eras-mode.js`, `test/runtime-smoke.js` y `test/build-smoke.js`, dentro de `npm run test:build`. La documentación de `legacy-game/README.md` identifica la base del motor como 5.7. No tratar `public/camino-engine.js` (bundle antiguo 5.2/build 42) como fuente recuperable del modo; solo afirmar recuperación de material legacy si se encuentra y se verifica.

---

## Prompt para copiar y usar

Actúa como **Game Designer Senior y desarrollador/a de sistemas para juegos de gestión futbolística**, con experiencia en cronologías históricas, economía deportiva y diseño de carreras rejugables. Trabaja directamente sobre el Modo Épocas existente de este proyecto.

### Misión

Audita y evoluciona el Modo Épocas para que la fantasía de **construir un legado mientras el fútbol cambia** produzca decisiones y consecuencias jugables, no solo skins, cifras o fechas antiguas. No lo reconstruyas desde cero: distingue lo que ya funciona, lo que solo está descrito en datos, lo que falta y lo que sería una propuesta nueva. Implementa una primera experiencia completa y viable dentro de la arquitectura real del juego.

### Hechos y límites que debes respetar

1. La fuente principal del motor es `legacy-game/src/`; `build_legacy_game.py` empaqueta el mismo juego para web y Android. Integra el trabajo en los módulos, slots, guardados y UI existentes. No crees una experiencia React paralela.
2. El modo moderno, sus reglas, tablas, clubes, carreras y guardados deben permanecer intactos. Mantén Épocas aislado mediante `S.era` y `EraStore`; no migres ni reutilices `camino.slots`.
3. Los seis perfiles de década y la cronología anual ya existen. El jugador ya puede elegir un año exacto de 1970 a 2029 y carrera de jugador/míster. Empieza desde el código actual, no presentes esas funciones como propuestas nuevas.
4. El modo fuerza fútbol masculino y utiliza perfiles de jugadores generados. Conserva los nombres de clubes de la base compartida; no inventes plantillas históricas exactas ni atribuyas nombres reales de jugadores sin fuente y derechos. Si no hay una fuente legacy verificable o licencia, conserva o amplía arquetipos originales generados.
5. Conserva el esquema de guardado actual (`camino.eras.v1`, esquema 1) salvo que una necesidad demostrable exija una migración compatible. Prueba siempre partidas antiguas, nuevas y el índice moderno.
6. Verifica el estado real del árbol de trabajo y de las pruebas antes de modificar. No restaures el bundle antiguo 5.2/build 42 ni afirmes haber recuperado código/contenido histórico sin localizarlo y comprobarlo.
7. Distingue explícitamente **hechos del código**, **hechos históricos verificados**, **aproximaciones del juego**, **hipótesis** y **propuestas de diseño**. Si no puedes verificar una fecha o ámbito, no lo codifiques como verdad universal: documenta la aproximación y limita su aplicación.

### Fase 1 — Diagnóstico de implementación

Inspecciona `legacy-game/erascene/packs/*.json`, `legacy-game/erascene/rules-timeline.json`, `legacy-game/src/eras-core.js`, `legacy-game/src/ui-eras.js`, `legacy-game/src/ui.js`, el motor de transferencias, creación de carreras, temporadas, clubes, medios, jugadores y guardado, además de `test/eras-mode.js`, `test/runtime-smoke.js` y `test/build-smoke.js`.

Entrega una matriz breve con columnas **sistema/campo**, **efecto real en el motor**, **año/contexto aplicable**, **prueba existente**, **brecha/riesgo**. Como mínimo comprueba: puntos, sustituciones, pase atrás, gol de oro, Bosman, ventanas, VAR, cinco cambios, calendario 2020–22, salarios, valores de mercado, presupuestos, ojeo, entrenamiento, atributos, medios, redes, vestuario, cantera y presentación.

No basta con que un atributo exista en JSON, se vea en el panel de selección o cambie una etiqueta para considerarlo implementado. Confirma el flujo de datos hasta una decisión, regla o resultado observable.

### Fase 2 — Diseña un bucle propio y completo

Diseña un bucle viable que se repita por bloque y temporada:

1. **Leer el contexto:** año, liga/club, reglas aplicables, recursos y grado de incertidumbre.
2. **Fijar una prioridad del club:** resultados, cantera, prudencia financiera, profesionalización o innovación, solo si se pueden expresar con sistemas reales o con cambios acotados.
3. **Resolver un dilema de época:** opciones con coste, riesgo, beneficio y consecuencias para el campo y, cuando proceda, economía, plantilla, directiva o afición.
4. **Jugar y observar:** que el partido/temporada refleje la decisión a través de reglas o sistemas demostrables.
5. **Adaptarse:** al comienzo de cada temporada, señalar cambios que ya entraron en vigor y permitir responder; no activar una década entera de efectos de golpe.
6. **Registrar el legado:** guardar títulos, temporadas, decisiones importantes y transformaciones realmente ocurridas. No enviar ni alterar el save moderno.

Incluye un ejemplo concreto de una temporada completa (por ejemplo, míster de club de referencia en 1992) que compare el flujo de decisiones con el modo moderno y muestre cómo se aplicaría una transición posterior. No fijes resultados deportivos ni fuerces un guion histórico.

### Fase 3 — Identidad jugable y transiciones

Para cada periodo 1970s, 1980s, 1990s, 2000s, 2010s y 2020s, define en una tabla:

- fantasía del jugador y condiciones que **sí** aplican en el código;
- tres retos jugables, dos oportunidades y decisiones diferenciadas;
- recursos relevantes y coste/beneficio observable;
- diferencias respecto del periodo anterior;
- cambios que son cosméticos, aproximaciones o pendientes de verificación.

El alcance de contenido aprobado es **100 decisiones por década (600 en total)**. Diseña un catálogo de cien decisiones distintas para cada perfil; no tienen que aparecer todas en una sola carrera. Evita inflar el recuento con textos duplicados o cambios de nombres: cada decisión debe tener contexto/condición, opciones reales y efectos comprobables, y el sistema debe controlar repetición, frecuencia y compatibilidad con guardados. Prioriza una muestra vertical completa y validada y luego amplía el catálogo manteniendo ese objetivo.

Usa la temática sugerida —redes de ojeo locales, profesionalización, preparación, medios, datos, redes, analítica, calendario— como hipótesis, no como estereotipo de todos los países o clubes. Los perfiles actuales globalizan algunos parámetros por década; antes de añadir más, decide qué diferencias necesitan región, competición o club, y modela solo las que el motor pueda aplicar de forma fiable.

Construye una cronología de transiciones con **año, competición/región, regla o sistema, fecha de inicio/fin, efecto en juego, evidencia o nivel de confianza y prueba de regresión**. Prueba al menos un año anterior, el año de transición y uno posterior. No extrapoles una norma inglesa a todas las ligas. En particular, inspecciona la cobertura actual de VAR y las reglas del calendario/sustituciones antes de ampliar sus fechas.

Para 2020s usa fechas reales disponibles hasta el año presente del proyecto. Si la carrera avanza más allá de 2029, define una política explícita de futuro simulado (qué datos se congelan, qué reglas continúan y cómo se comunica); no presentes ese tramo como historia real.

### Fase 4 — Mecánicas: pocas, conectadas y funcionales

Propón y selecciona un conjunto pequeño de sistemas y ejecútalos de extremo a extremo. Prioriza primero cerrar los campos existentes que prometen un efecto y aún no lo tienen; después añade una mecánica nueva solo si completa el bucle. El catálogo aprobado de cien decisiones por década es contenido del sistema de decisiones, no cien mecánicas independientes. Considera:

- **Información de ojeo con incertidumbre:** la capacidad del club determina qué conoce sobre el jugador, sin confundir conocimiento con calidad. No cambies las bases compartidas ni añadas plantillas licenciadas.
- **Tradición frente a innovación:** inversión, adaptación del vestuario y riesgo a cambio de un efecto que se pueda medir. La innovación no debe quedar bloqueada arbitrariamente por década.
- **Prioridad e identidad de club:** que afecte objetivos o confianza a través de sistemas existentes; evita una barra/menú decorativo sin consecuencias.
- **Medios contextuales:** antes de 2010 ocultar la pestaña social como ahora; usar canales de época y hacer que sus efectos cambien solo si hay una acción de jugador/entrenador conectada. Evita mensajes repetitivos obligatorios.
- **Legado/cronología de carrera:** un registro local de hitos y decisiones, derivado del save Épocas, con gestión de tamaño y pruebas de compatibilidad.
- **Eventos opcionales y situacionales:** usar las colas de decisión existentes; evitar duplicación, frecuencia excesiva, castigos arbitrarios o opciones sin salida.
- **Prendas de época y presentación 3D contextual:** generar variaciones visuales procedurales según década (corte, cuello, mangas, franjas y detalles) respetando siempre los colores y la identidad de cada club existente. No renombrar clubes ni contaminar sus datos compartidos; adaptar también el entorno 3D al contexto cuando haya un sistema real que lo soporte. Mantener los partidos y la simulación al cambiar el HUD. No afirmar que la generación es funcional hasta comprobarla en pantalla. El vestuario/equipamiento que ya tenga efecto estadístico debe seguir pasando por su sistema real; no inventar bonificaciones por una prenda visual.

Para cada mecánica seleccionada documenta: objetivo, disparador/año/contexto, datos de entrada, acción visible, coste y consecuencia, sistemas conectados, frecuencia, forma de salir, interfaz y pruebas. No anuncies botones o funciones que no tengan acción implementada.

### Fase 5 — Arquitectura y plan de implementación

- Reutiliza `ERAS_DATA`, perfiles/timeline, `eraContextForYear`, los wrappers actuales y UIX donde sea seguro. Añade variantes por año/competición/región solo cuando exista una ruta clara hasta el motor.
- Mantén los perfiles JSON validados por el build; añade esquema y validaciones a campos nuevos. Evita bifurcar `ui.js` o la base de datos moderna.
- Separa cambios en tres prioridades:
  - **P0:** corregir campos anunciados pero no aplicados; reglas/transiciones correctas; guardados compatibles; modo jugable completo en años disponibles; pruebas modernas sin regresión.
  - **P1:** bucle de decisiones/innovación e información imperfecta con consecuencias conectadas; legado básico; variación por liga o club cuando el motor la soporte.
  - **P2:** profundidad adicional de eventos, ambientación y presentación una vez probada la jugabilidad.
- Implementa de extremo a extremo una porción completa y compartida entre web/Android; después extiende los seis periodos. Si la capacidad es limitada, deja claro qué no se implementó y por qué.

### QA y aceptación

Ejecuta `npm run build` y `npm run test:build`, más pruebas específicas nuevas. Añade cobertura para:

- iniciar jugador y míster en cada uno de los seis perfiles, incluyendo el primer/último año;
- reglas anteriores/durante/después de varias transiciones;
- campos de perfil que cambian el resultado de una acción real, no solo la UI;
- consecuencias de opciones alternativas y más de una estrategia viable;
- validación de que el catálogo contiene cien decisiones distintas por perfil (seiscientas en total), con condiciones/opciones/efectos válidos, y de que no se repiten de forma abusiva en una carrera;
- guardados Épocas existentes, cargas, borrados, máximo de diez, esquema 1 y aislamiento de `camino.slots`;
- regresión del modo moderno (incluidas sus reglas y guardados);
- trayectorias que cruzan varias décadas y el paso desde 2029 al futuro simulado;
- web y Android usando el mismo motor/UI.

No afirmes pruebas manuales en dispositivo si no hay dispositivo o emulador. No afirmes verificaciones históricas si no hay fuentes disponibles; documenta qué queda por confirmar. Evita resultados falsos o “hechos” inferidos de un JSON sin efecto de código.

### Entregables

1. Diagnóstico con hechos observados y matriz de campos conectados/no conectados.
2. Diseño final: bucle, tabla por década, transiciones documentadas, equilibrio y ejemplo de temporada.
3. Cambios funcionales integrados, con sus límites y datos/supuestos documentados.
4. Informe de pruebas reales, regresiones, limitaciones de entorno y trabajo pendiente.
5. Resumen de qué cambió en el modo, qué ya existía y qué material legacy se recuperó realmente (o confirma que no se encontró).
