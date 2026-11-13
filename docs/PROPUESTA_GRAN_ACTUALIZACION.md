# Propuesta de gran actualización — Universo Vivo

**Documento de diseño de producto, contenido e implementación**  
**Estado:** propuesta con implementación parcial en curso; no representa una entrega completa.  
**Objetivo:** ampliar la profundidad de las tres carreras, la variedad de ligas y la personalización, y añadir una forma nueva de jugar secuencias de fútbol con control directo.

---

## 1. Visión

La actualización debe hacer que cada carrera parezca una historia deportiva propia y que el jugador tenga más formas de expresarse: elegir cómo actuar fuera del campo, descubrir ligas con identidades diferentes, crear un estilo visual para su mascota y, cuando quiera, **dibujar y ejecutar una jugada** en vez de limitarse a ver su resolución.

La promesa no es «más cosas en todos los menús», sino un ciclo con variedad y consecuencias legibles:

> **Elige un camino → afronta una situación → juega o decide → ve qué cambió → prepara el siguiente reto.**

### Nombre de trabajo

**Universo Vivo** es el nombre interno del paquete. Los nombres visibles de cada función pueden ser:

- **Decisiones:** *Tu carrera, tus reglas*.
- **Partido de jugadas:** *Jugada Maestra*.
- **Mascotas:** *La banda también juega*.
- **Expansión de competiciones:** *Nuevos caminos*.

La denominación final debe comprobarse con la identidad visual y las cadenas existentes antes de publicarse.

### Qué se considera una gran actualización

1. Añadir decisiones en **Jugador/a, Míster y Crea tu club**, comprobadas para carrera masculina y femenina.
2. Añadir competiciones seleccionadas con profundidad jugable, no solo más nombres en un selector.
3. Ampliar las mascotas con especies, animaciones, accesorios y actividades que se integren con el mundo 3D actual.
4. Diseñar un nuevo modo de control de jugadas: trazas pases y tiros, se mueven compañeros y rivales, y el resultado sale de una simulación determinista.
5. Mantener continuidad de guardados, offline, localización, rendimiento móvil y las diferencias entre fútbol moderno y Épocas.

---

## Estado de implementación en este checkout (2026-10-27)

Esta lista distingue el trabajo nuevo de los sistemas que ya existían. Es una fotografía del checkout, no una afirmación de que la propuesta esté terminada.

| Área | Implementado en esta rama | Pendiente para cumplir la propuesta |
|---|---|---|
| Decisiones | 108 familias nuevas con IDs propios: treinta y seis de Jugador/a, treinta y seis de Míster y treinta y seis exclusivas de Crea tu club. Incluyen formación y recuperación, comunicación y concentración deportiva, táctica, transporte local, reducción de residuos y uso comunitario de instalaciones. Seis decisiones tienen seguimientos encadenados por flags guardables y se cierran al resolverlos. Las condiciones de carrera no excluyen el fútbol femenino; las historias del club propio requieren una partida creada. Textos añadidos a ES/EN/DE/IT/FR; pruebas de registro, elegibilidad contextual, efectos admitidos, cierre de arcos, catálogo runtime y traducciones en ambas copias. | Se alcanzan las 108 familias y, por catálogo, al menos 30 historias pertinentes en cada modo y en ambos géneros (las condiciones no dependen del género). `test/decision-balance.cjs` mide el ritmo real del motor (5 bloques, 4 huecos, 2–3 decisiones por hueco, dificultad normal) y deja el informe en `real-f/decision-balance.json`: el sorteo del motor pesa 2,6× las familias que la carrera nunca ha visto (sin añadir estado al guardado: reaprovecha el cooldown ya guardado). Con ese sesgo, en dos temporadas aparecen **21–22 familias distintas de 22 ofertas** por modo: la variedad ya toca el techo del ritmo y casi no hay repeticiones. El criterio estricto de «30 familias distintas en dos temporadas» sigue sin cumplirse y exigiría más huecos o más decisiones por hueco, no un sorteo mejor; hoy no se anuncia como cumplido. |
| Ligas | Veinte competiciones nuevas (diez por género): seis segundas divisiones con ruta completa —Austria, Suiza, Dinamarca, Noruega, Suecia y República Checa, en masculino y femenino— y cuatro primeras divisiones en países que no tenían liga —Finlandia, Islandia, Gales e Irlanda del Norte, en masculino y femenino—. Todas se añaden al final de cada mundo con la marca `xl` para no mover índices de clubes guardados; las seis primeras divisiones que estrenan segunda reciben `down` + `rel`. Las listas masculinas de segunda son participantes verificados de la temporada 2026/27 (o 2026 en países de año natural); las primeras nuevas, ocho, también tienen página de temporada identificable. En femenino, Elitettan y las cuatro primeras nuevas son verificadas y las otras cinco segundas están declaradas `curated-pool`. Se excluyen los clubes que ya existían en otra liga del mismo mundo y se documenta cada exclusión, incluida la colisión «Derry City» resuelta como «Derry City Ladies» en el pool norirlandés. Además, corregí los nombres femeninos de España (Liga F, Copa de la Reina, Supercopa Femenina y Primera Federación Fútbol Femenino) según reglamentos RFEF, y `real-f/sources.json` registra AFFA AZ1 2025/26 y RFEF ESP2 2026/27. `erascene/clubs-history.json` añade la historia de nombres de las cuatro primeras nuevas, con serie femenina propia, para que Épocas no muestre marcas actuales en años antiguos. El inventario país/división/género está en `docs/INVENTARIO_LIGAS.md` y `test/league-expansion.cjs` cubre datos, paridad, procedencia, enlazado real del motor en los dos mundos, dos carreras jugables y el aislamiento de Épocas. | La pertenencia del pool ESP2 en los datos servidos al juego coincide con la lista RFEF 2026/27 usando nombres de pantalla abreviados; las valoraciones siguen siendo estimaciones. Se implementan el ascenso directo y el playoff 2.º–5.º a ida y vuelta con desempate por mejor puesto. Las cuatro primeras divisiones nuevas no tienen segunda simulada, así que no ofrecen descenso. La historia de nombres de Épocas solo cubre lo declarado con fuente: en NIR1 y WAL1 la nomenclatura anterior a 2003/2016 no se modela y se usa el nombre actual como respaldo; las plantillas y los clubes de Épocas no proceden de estas listas modernas. Suiza queda con nueve clubes y varios países con segunda división no reproducen el calendario ni los play-off oficiales. No se simula la reestructuración 2027/28 y falta la revisión de progresión en dispositivo Android, que hará el usuario. |
| Mascotas | Cuatro opciones nuevas no exóticas (cobaya, periquito rescatado, hurón doméstico y gato de refugio), con perfiles 3D/sonido/cuidado; 26 accesorios nuevos en el catálogo 3D; cuatro microactividades opcionales (búsqueda en tres rondas, devolución de balón, pose para foto y circuito de tres conos), con salida sin penalización y recuerdos persistentes, sin tocar vínculo ni rendimiento futbolístico. | QA visual de cada rig/accesorio/actividad en especies compatibles, resoluciones y Android de gama baja; comprobar ritmos y persistencia en sesiones reales. |
| Leyendas del GOAT Ladder | Catorce leyendas ficticias (ocho jugadoras/es y seis entrenadoras/es) que comparten universo con las carreras: sus clubes existen en el mundo del juego, sus nombres salen del propio generador y sus marcas se comparan con tu carrera. Pestaña «Leyendas» en la ficha del GOAT Ladder con orden por métrica, aviso de ficción y sin red; noticias de fin de temporada cuando superas un récord del club (una sola vez por leyenda y partida); gancho «Legado del club» en la ficha de carrera; y referencia en el Anuario de Épocas a las leyendas de esa década. Al cambiar entre Jugador y Míster la métrica se reajusta a una válida del nuevo modo y el catálogo cerrado oculta el buscador (no aporta con 14 fichas). Textos en ES/EN/DE/IT/FR y pruebas de datos, comparación, noticias, pestaña y funcionamiento sin red. | Revisión visual de la pestaña en Android de gama baja; no hay leyendas en la página web del ranking (solo en el juego); la exposición de las leyendas en Épocas depende de que la carrera llegue al Anuario. |
| Jugada Maestra | Campaña autónoma de 30 escenarios en cinco capítulos, progreso secuencial, medallas y controles de pase/tiro asistidos o por trazo. La campaña sigue aislada de las estadísticas de carrera. **Integración a partidos, optativa en los tres modos y en ambos géneros:** antes de la carrera o en Ajustes, con la misma mecánica de trazos y una pausa propia. En la carrera de míster la ocasión se juega dentro del partido en directo: el resultado entra en marcador, tiros, xG, goleadores y crónica como el tiro que el modelo ya había decidido. En la carrera de jugador/a no hay partido minuto a minuto, así que la ocasión sale del partido ya simulado: el juego se detiene en el minuto del gol previsto con una tarjeta «Momento clave» («Jugar la jugada» o «Dejar que decida el equipo»), la secuencia decide si ese gol es tuyo y nunca inventa ni quita goles al equipo; lo convertido suma en tus goles, valoración y crónica. En ambos casos la jugada queda sellada con su semilla y se resuelve una sola vez (sin reintento hasta marcar). Con la opción apagada el partido conserva su equilibrio anterior, comprobado por digest del motor previo a la integración en las dos carreras. | Revisión de equilibrio/accesibilidad en dispositivos (la hará el usuario) y producción de las recompensas y ayudas completas de la campaña. La carrera de jugador/a no tiene repetición 3D de la jugada: el panel dibuja el campo táctico, igual que el resto de la integración. |
| Épocas, guardados y datos históricos | Expansión de cobertura verificable y honesta: quince competiciones con año de fundación añadido (catorce posteriores a 1970 y NIR1 desde 1890) y serie de nombres de época cuando la fuente la documenta, para que una carrera no pueda empezar en una liga antes de existir; series femeninas de nombres para las cuatro primeras divisiones nuevas; límite de historia real declarado en 2024 con etiqueta «Sin referencia histórica» en el HUD, el diálogo de Reglas y el Anuario; política explícita de futuro simulado (reglas congeladas, sin comparación con campeones inexistentes); documento `docs/EPOCAS_COBERTURA.md` y prueba `test/eras-coverage.cjs` sobre el bundle Android real. Los perfiles, las 1.000 decisiones, los 18 momentos y los guardados de Épocas no cambian de formato; las partidas de Épocas aparecen además en el menú normal de carga, con su década, año y club, y se pueden continuar o borrar desde ahí. | No hay carreras femeninas en Épocas ni plantillas históricas: siguen siendo arquetipos generados y el archivo de clubes cubre 239 de los más de 1.500 nombres del mundo; los clubes sin entrada conservan su nombre actual. La nomenclatura anterior a la fundación de algunas ligas sin serie documentada usa el nombre actual como respaldo. No se simulan calendarios, play-off ni reestructuraciones oficiales, y el tramo posterior a 2029 se marca como simulación. Falta la revisión visual del HUD y del Anuario en dispositivo Android, que hará el usuario. |

`npm run build` y `npm run test:build` pasan tras completar las 108 familias, la expansión de competiciones (veinte competiciones nuevas: seis segundas divisiones con ruta y cuatro primeras por género, procedencia declarada y enlazado comprobado en el bundle) y la expansión de cobertura de Épocas (fundaciones y nombres de liga, límite de historia real en 2024 y etiqueta de simulación), el **sesgo de novedad** del sorteo de decisiones (2,6× para familias jamás vistas, apoyado en el cooldown ya guardado: no cambia el formato del guardado), el playoff de promoción a dos partidos, la sincronización del bundle legacy de datos femeninos y las leyendas del GOAT Ladder. El sesgo se comprobó también en el bundle Android real (`novelty(null)` = 2,6; `novelty(2024)` = 1) y una guardia del test falla si algún motor deja de aplicarlo. La integración de Jugada Maestra en la carrera de jugador/a se verificó con una sonda DOM sobre el bundle real (tarjeta, panel, auto, gol y vuelta al partido) y con el bloque §5c de `test/jugada-maestra-match.cjs`; la paridad con la opción apagada se mide por digest en las dos carreras y el modo asistido convierte cerca del xG sellado (0,05 → 6 %; 0,16 → 15 %; 0,25 → 27 %; 0,40 → 44 % en 300 ensayos por nivel). La suite registra un `D1 down` simulado en una prueba de contingencia, pero termina con código 0. Esto no equivale a revisión visual exhaustiva ni a prueba en dispositivo Android.

---

## 2. Lectura del proyecto y decisiones de alcance

El juego ya tiene sistemas a los que conviene dar más recorrido, no sustituir:

- El jugador cuenta con decisiones/eventos, carrera internacional, contratos, agente, familia, prensa, vida personal, entrenamientos y partido.
- El míster tiene decisiones de vestuario, directiva, prensa, mercado y semana de trabajo.
- *Crea tu club* reutiliza parte de la carrera de míster, pero añade identidad, presupuesto y decisiones de proyecto.
- El motor de partidos de míster ya conserva estado, tácticas, marcador y eventos en vivo. Los minijuegos 3D de faltas y penaltis ya tienen gestos táctiles, simulación física determinista, repeticiones y accesibilidad base.
- Las mascotas ya crecen, tienen necesidades, cuidados, accesorios por ranura, concursos y un entorno 3D. El registro de objetos está separado de la lógica de adopción y de la interfaz.
- La carga empaquetada usa `legacy-game/src`; hay implementaciones paralelas en `src`. Se debe mantener su sincronía.

### Tamaño del catálogo actual: lectura, no afirmación de cobertura

Una ejecución local de los datos incluidos en este checkout encontró:

| Catálogo cargado | Entradas de liga | Nombres de clubes en esas entradas |
|---|---:|---:|
| Masculino (`DATA.leagues`) | 84 | 1.390 |
| Femenino de mundo `f` (`DATA.leaguesF`) | 88 | 1.305 |
| Femenino de mundo `f2` (`DATA.leaguesF2`) | 93 | 1.283 |

Son recuentos de listas del código, **no** una medida de ligas del mundo, de disponibilidad real en todos los niveles ni de verificación histórica. Hay clubes compartidos entre listas, divisiones simuladas y diferencias entre mundos femeninos por compatibilidad con partidas antiguas. Por eso la expansión debe priorizar huecos jugables y consistencia antes que anunciar «todas las ligas».

### Límites de diseño

- El fútbol masculino y femenino recibe el mismo cuidado de producto, claridad, pulido y cantidad mínima de contenido nuevo accesible.
- Las historias y nombres de jugadores generados siguen siendo ficticios, estables y diferenciados de personas reales.
- No se inventan resultados ni participantes históricos verificados. La simulación moderna se identifica como simulación; las Épocas solo incorporan datos cuando existe un snapshot apropiado.
- La lista de clubes, sus divisiones y el nombre de una competición se validan para un ciclo de datos definido. Si no se puede verificar un conjunto, no se etiqueta como histórico ni se sustituye silenciosamente por uno moderno.
- No se añaden cuentas, red, permisos Android, notificaciones del sistema ni compras obligatorias. El paquete funciona offline.
- No se altera la identidad o la estructura de guardados existentes; las nuevas piezas son opcionales y migrables.
- La referencia a *Score! Hero* se limita al principio general de dibujar y resolver secuencias. No se copian su marca, interfaz, iconografía, niveles, textos, escenas ni composición visual.

---

## 3. El núcleo de la actualización: decisiones con más agencia

### 3.1 Volumen recomendado

Publicar aproximadamente **108 nuevas familias de decisión** en la primera gran entrega, compartidas de forma inteligente entre contextos y no duplicadas como cartas casi idénticas:

| Modo | Familias nuevas | Ejes principales |
|---|---:|---|
| Jugador/a | 36 | Partido, minutos, crecimiento, contrato, selección, vida pública y descanso |
| Míster | 36 | Vestuario, táctica, plantilla, calendario, directiva y prensa |
| Crea tu club | 36 | Identidad, instalaciones, cantera, presupuesto, comunidad y ambición |
| **Total** | **108** | Familias con texto/condiciones adaptables por carrera y género |

Como criterio de aceptación de contenido, cada una de las seis combinaciones **(tres modos × masculino/femenino)** debe poder acceder a, como mínimo, **30 familias nuevas pertinentes** en una carrera normal de dos temporadas, sin depender de una liga concreta ni de una secuencia improbable de resultados. Las condiciones especiales aportan variedad; no deben ser el único camino a la mayoría del contenido.

La cantidad final se ajustará después de medir frecuencia, repetición y longitud de carrera en pruebas. La meta es dar diversidad real, no forzar eventos para alcanzar una cifra.

### 3.2 Reglas para que una decisión sea divertida

Cada evento nuevo debe incluir:

1. **Un conflicto reconocible** con dos o tres opciones que expresen prioridades distintas.
2. **Costes y beneficios legibles antes de elegir**, al nivel de precisión que el motor pueda justificar.
3. **Consecuencias persistentes y proporcionadas**: minutos, forma, confianza, presupuesto, reputación, relación con afición o progreso de un proyecto.
4. **Una salida narrativa para cada desenlace**, incluida una derrota o un resultado neutro; el juego no debe burlarse del jugador por una mala tirada.
5. **Protección contra bucles:** enfriamiento, límite de apariciones y condiciones de resolución.
6. **Una razón para volver:** relación con decisiones anteriores, no una cadena de elecciones cosméticas inconexas.

Las probabilidades se calculan al preparar el evento y deben coincidir con lo mostrado en la vista previa. No se vuelve a sortear al confirmar. Se evita que un evento temprano pueda bloquear la carrera, despedir al míster sin aviso o arruinar un guardado por una elección irreversible mal señalizada.

### 3.3 Matriz de contenido: las seis experiencias

#### A. Carrera de Jugador/a

- **Masculina:** debut y minutos, adaptación a otro país, rol en el vestuario, relación con el agente, recuperación, capitanía, objetivos internacionales, derechos de imagen y liderazgo de una iniciativa.
- **Femenina:** exactamente los mismos sistemas de carrera y profundidad. Contextos de competición, calendario, viaje, prensa, infraestructura o negociación pueden aparecer cuando correspondan al club/torneo de esa partida; no se asume que toda jugadora vive el mismo conflicto ni se reduce el contenido a desigualdad o apariencia.
- **Ambas:** elección de foco entre titularidad, desarrollo individual o bienestar; disputa deportiva por el dorsal; promesa de minutos; decisión de volver antes de una lesión; gestión de una campaña de afición; conversación con una compañera o compañero que pierde confianza.

#### B. Carrera de Míster

- **Masculina y femenina:** el mismo sistema de planificación de plantilla, táctica, ambiente, cantera, calendario, prensa y directiva. La lógica usa las competiciones, disponibilidad y nombres del mundo elegido, no textos pegados a un único universo.
- Situaciones: rotar antes de una eliminatoria; integrar una promesa sin prometerle un puesto; decidir entre bloquear una cesión o acordar minutos; responder a una petición de cambio táctico; conversar con una capitana/capitán por el liderazgo; elegir analítica o scouting local; proteger el descanso ante semanas congestionadas.
- Diferenciar una respuesta pública (prensa/afición) de una conversación privada (moral/química), con efectos explicados para que no parezcan aleatorios.

#### C. Crea tu club

- **Masculino y femenino:** elección explícita del proyecto y de sus prioridades, con el mismo número de decisiones y opciones viables. El género define el universo competitivo, no la calidad del club ni el abanico de agencia.
- Situaciones: academia o estadio; identidad visual tradicional o audaz; fichaje de referencia o plantilla equilibrada; invertir ahora o reservar colchón financiero; acuerdo comunitario para compartir instalaciones; torneo de pretemporada propio; uso del presupuesto para fútbol base; decidir cómo responder a la afición si el equipo no asciende.
- Ninguna opción debe ser una trampa. «Difícil» puede cambiar el reto, pero no esconder información esencial.

### 3.4 Tres cartas de ejemplo

#### Jugador/a — «Te quieren cambiar de rol»

El cuerpo técnico te propone actuar en una posición vecina durante el siguiente bloque.

- **Aceptar el reto:** aumenta la versatilidad y la confianza del cuerpo técnico; durante el primer partido puede bajar la calidad de tus decisiones por adaptación.
- **Pedir una prueba en entrenamiento:** coste de energía/tiempo, oportunidad de conservar el rol si te va bien y sin penalización automática si no.
- **Negarte con una alternativa:** proteges tu especialidad; el entrenador puede valorar la claridad, pero la relación depende de tu situación real y de la forma reciente.

La carta aparece solo si la posición es compatible, el jugador tiene minutos y el partido está en una fase válida. No asigna roles con nombres o pronombres incorrectos.

#### Míster — «Dos partidos en cinco días»

El análisis de carga detecta cansancio en titulares antes de una eliminatoria.

- **Rotación amplia:** gana frescura y minutos de plantilla; reduce cohesión/experiencia del once por un margen pequeño y visible.
- **Mantener el bloque:** conserva automatismos; eleva el riesgo de cansancio, no una lesión inevitable.
- **Rotar por líneas:** opción de control, con una breve selección de prioridades (defensa, medio, ataque); permite proteger el punto débil.

La condición usa el calendario real de la simulación, no la fecha del dispositivo.

#### Crea tu club — «El primer gran ingreso»

Una temporada fuerte atrae una propuesta de patrocinio local con condiciones.

- **Contrato estable:** ingreso moderado y presupuesto predecible.
- **Apuesta por resultados:** ingreso mayor si se alcanza el objetivo anunciado; si no, el club no queda endeudado ni pierde la licencia.
- **Socios y comercios del barrio:** menor ingreso inmediato, pero mejora comunidad y asistencia durante varios bloques.

El objetivo del contrato se ve antes de aceptar; no se basa en cifras financieras opacas.

### 3.5 Arquitectura narrativa

- Catalogar IDs por modo, arco, temporada, fase y condición; no derivar el ID del texto traducido.
- Reutilizar la misma familia con variaciones gramaticales/contextuales; no clonar cuatro cartas para cambiar solo el género.
- Añadir pequeños arcos de 2–4 escenas: promesa de cantera, disputa de minutos, proyecto comunitario o adaptación a una nueva liga.
- Los eventos en español son la fuente de clave. Completar ES/EN/DE/IT/FR antes de dar por terminado un arco.
- Incluir pruebas que comprueben elegibilidad, repetición, probabilidades visibles, efectos, idioma y variante femenina.

---

## 4. Más ligas: profundidad antes que una lista interminable

### 4.1 Objetivo de catálogo

Objetivo orientativo para el primer año: **12–20 nuevas competiciones de liga**, incluyendo al menos:

- nuevas rutas femeninas con divisiones conectadas o ligas regionales que tengan clubes y calendario suficientes;
- más profundidad en países donde la carrera ya permite ascender, pero la ruta inferior termina pronto;
- representación selectiva de regiones hoy con menos opciones jugables;
- una selección de ligas de nivel medio para que una carrera pueda empezar abajo y progresar hacia copas y competiciones continentales.

La selección concreta no se fija en este documento como dato factual. Primero se hace un inventario país/división/género, se priorizan huecos y se verifica cada ciclo de clubes con fuentes identificables. No se anunciará una liga como «completa» por añadir solo su primera división.

### 4.2 Filtro para admitir una competición

Una propuesta de liga pasa a producción solo si responde afirmativamente a:

1. ¿Tenemos una lista de clubes coherente para un ciclo de datos y género definidos?
2. ¿Hay tamaño suficiente para calendario y competición con la lógica actual, o se ha diseñado explícitamente otro formato?
3. ¿Son claros ascensos, descensos, play-off y plazas continentales, si existen?
4. ¿Se han separado clubes B/filiales, equipos duplicados y reservas sin inventar una jerarquía?
5. ¿Se puede nombrar torneo y copa correctamente, sin reutilizar sin más la marca de otro país?
6. ¿Hay una representación razonable de fuerza, presupuesto y desarrollo para que sea jugable?
7. ¿Se puede sostener en las cinco traducciones y, si procede, en años posteriores sin pedir conexión?

Cada paquete registra: fuente, fecha/ciclo, ámbito, denominación usada, reglas adaptadas, clubes omitidos y limitaciones. Si los datos son una aproximación para simulación, se identifica internamente como tal y nunca se etiqueta «histórico verificado».

### 4.3 Integración con el juego y guardados

- Añadir las ligas nuevas al final de las estructuras que asignan índices; no insertar ni reordenar IDs que ya se guardan.
- Usar identificadores permanentes y metadatos separados para país, división, género, confederación y reglas.
- Probar ascenso/descenso, clasificación a copas, generación de calendarios, empate, descanso, fin de temporada y cambio de club.
- El selector debe agrupar por país y división, permitir búsqueda/filtro y mostrar género, nivel y ruta de ascenso; mostrar la carga antes de iniciar una carrera si el mundo se vuelve pesado.
- No cargar clubes modernos en Épocas para llenar huecos. Épocas conserva sus snapshots y sus avisos sobre años con cobertura incompleta; si un año carece de snapshot, cualquier conjunto de juego debe marcarse como fallback de simulación.
- Las ligas femeninas no son una traducción de un fixture masculino. Sus listas, reglas y calendarios se validan de forma independiente.

---

## 5. Mascotas y accesorios: expansión con personalidad

### 5.1 Mascotas

Añadir **cuatro nuevas opciones de compañía** en la primera entrega, seleccionadas después de una revisión de bienestar, cuidado y viabilidad de animación. Candidatas a evaluar: cobaya, periquito rescatado, hurón bajo cuidado informado y una variante de gato/perro de refugio con pelaje y carácter propios. La selección final debe evitar promover captura de fauna, especies amenazadas o tenencia irresponsable.

Cada nueva especie necesita:

- icono y silueta legibles en tamaño de tarjeta y en 3D;
- etapas de crecimiento y un perfil de animación viable;
- necesidades y cuidados específicos, pero que no exijan entrar todos los días;
- al menos tres interacciones reconocibles y una reacción a gol/derrota;
- traducción de nombre, carácter, necesidades y textos de cuidado;
- precio/coste de mantenimiento y efecto cosmético/de ánimo medido frente a mascotas existentes.

El diseño mantiene el principio actual: la mascota no muere, no castiga al usuario por ausentarse, y no crea una ventaja deportiva que fuerce a adoptar. Los efectos de ánimo se mantienen suaves; nada de boosts exclusivos de pago.

### 5.2 Accesorios y escena

Añadir en torno a **24 accesorios** con silueta distinta, repartidos por ranuras existentes:

- 6 de cabeza/cara;
- 4 de cuello/medallas;
- 5 de cuerpo o espalda;
- 4 para patas/cola;
- 5 objetos de celebración y utilería interactiva.

Ideas visuales: bufanda reversible con colores del club, chubasquero de lluvia, pañuelo de capitán, gafas de celebración, botitas de portero, mini balón con animación de patadita, banderín, cono de entrenamiento y una copa con reacción al acercarse. El catálogo mezcla compra con moneda de carrera, logro y descubrimiento; ningún accesorio esencial queda detrás de un reto de élite.

- Usar ranuras actuales siempre que sea posible. Una ranura nueva requiere una migración compatible y revisión de combinaciones visuales.
- Probar con cada rig/especie nueva, de frente y perfil, movimiento, escenarios oscuros y baja calidad gráfica.
- Dar previsualización 3D, botón de deshacer y guardado inmediato; ningún cambio debe perder un accesorio anterior.
- Separar decoraciones de casa de equipamiento puesto. Las piezas estéticas no tienen estadísticas.

### 5.3 Actividades breves de vínculo

Añadir cuatro microactividades opcionales de 15–30 segundos en el mundo 3D: buscar el juguete, seguir una pelota lenta, posar para una foto y circuito de conos. Deben poder completarse con toque sencillo, no exigir reflejos, ofrecer control alternativo y tener descanso. La implementación de esta rama guarda recuerdos; no altera vínculo ni desbloquea una ventaja competitiva acumulable.

---

## 6. Nuevo sistema jugable: «Jugada Maestra»

### 6.1 Referencia de interacción y diferenciación

La inspiración es la claridad de una jugada construida con trazos: el usuario dibuja por dónde pasa o dispara el balón y ve al equipo resolverlo. La identidad propia de *Camino a la Leyenda* se construye con sus campos 3D vóxel, compañeros y rivales que leen espacios, táctica, clima, mascota en banda, consecuencias de carrera y una física de balón coherente. No se replican pantallas, niveles, personajes, interfaz ni recursos de *Score! Hero*.

### 6.2 Dos puertas de entrada, con límites claros

**A. Desafíos de jugadas — modo autónomo.**  
Una campaña corta de secuencias diseñadas/parametrizadas, partidas de 1–3 minutos. Es el MVP: no cambia marcador, calendario ni estadísticas de una carrera principal. Desbloquea medallas, recuerdos de carrera y cosméticos no competitivos.

**B. Momentos de partido — integración optativa.**  
Antes de iniciar una carrera o en ajustes, el usuario puede activar que algunos momentos decisivos de un partido sean controlables. Cuando surge una ocasión elegible, el partido se pausa claramente, se abre la secuencia y su resultado genera el evento real de partido (gol, parada, despeje o pérdida) en el marcador y en las estadísticas. La opción apagada conserva el partido actual sin interrupciones.

La integración cubre los tres modos y los dos géneros, con una diferencia de contexto que el panel explica con sus propios textos:

- **Míster y Crea tu club:** la ocasión ocurre dentro del partido en directo. Se juega una o dos veces por encuentro, solo cuando el marcador y el minuto lo permiten, y el panel pausa el reloj hasta cerrarlo.
- **Jugador/a:** esa carrera no tiene partido minuto a minuto, así que el motor toma el partido ya simulado. Si hay un gol del equipo dentro de tus minutos y la cuota de ese gol para ti supera el mínimo, el juego se detiene en ese minuto con una tarjeta «Momento clave». La secuencia decide si ese gol es tuyo; el marcador del equipo no cambia nunca (el gol ya estaba) y solo lo convertido entra en tus goles, valoración y crónica. La tarjeta permite jugar la secuencia o «Dejar que decida el equipo», que resuelve con el mismo xG y sin premio ni castigo.

En ambos contextos la jugada se sella con semilla y se resuelve una sola vez; apagada, el partido se comporta exactamente como antes (comprobado por digest del motor previo en las dos carreras).

No se ofrece un modo de «reintentar hasta marcar» en partidos oficiales. En Desafíos el reintento es libre; en carrera, la secuencia queda sellada al aceptar y se resuelve una vez con su semilla guardada.

### 6.3 Bucle de una secuencia

1. **Contexto:** objetivo breve y comprensible («rompe la presión», «encuentra a la jugadora libre», «marca antes de que llegue la cobertura»).
2. **Lectura:** se muestran balón, compañero, rival, portería y zonas bloqueadas. Un toque puede activar flechas de carrera accesibles.
3. **Trazado:** el jugador dibuja un pase sobre el césped o una trayectoria de tiro. La línea tiene previsualización de dirección y un indicador discreto de riesgo, no una solución garantizada.
4. **Resolución:** compañeros hacen desmarques y rivales cierran líneas; pase/tiro se simula con atributos y contexto. Hay rebotes, intercepciones, controles imperfectos y decisiones de portero coherentes.
5. **Siguiente acción:** si el receptor controla, puede haber otra decisión; la mayoría de secuencias dura 2–4 acciones. Un primer pase malo no debe terminar siempre en fracaso: puede producir una segunda pelota o una salida de presión.
6. **Cierre:** repetición breve y resultado explicado («el pase llegó, pero el segundo defensor cerró el tiro»), progreso y sugerencia útil para probar otra solución.

### 6.4 Controles

- **Pase:** deslizar desde el balón hasta un compañero o espacio. La velocidad y curvatura del trazo influyen en el balón, con límites suaves para que el control sea predecible.
- **Desmarque:** trazar desde un compañero hacia una zona antes de pasar; en el primer tutorial se enseña con un solo gesto.
- **Tiro:** trazar desde el balón hacia la portería. Longitud = potencia aproximada, curva lateral = efecto, elevación controlada con gesto vertical opcional. Mostrar límites y opción de calibrar sensibilidad.
- **Acciones asistidas:** tocar a un compañero y elegir «pase al pie», «al espacio» o «pared»; permite jugar sin precisión de dibujo.
- **Portero/defensa:** en retos especiales, controlar una salida o barrida con gesto, sin añadir esto a todos los niveles.
- **Cancelar/deshacer:** botón visible antes de confirmar la acción. Tras confirmar, la jugada se resuelve; no exigir mantener el dedo a la vez que se toca un botón pequeño.

Es compatible con ratón y teclado en web. Trazos tienen un grosor de asistencia; se usa `pointer capture`, se evita el scroll accidental y hay sensibilidad y modo de un toque. Los objetivos no dependen únicamente del color. Movimiento reducido elimina cámara lenta larga, vibración y sacudida; háptica y sonido se pueden apagar.

### 6.5 Dificultad justa y motor

La dificultad procede de presión, distancia, ángulos, apoyos y calidad de decisión, no de esconder los controles. Una oportunidad muy estrecha se presenta como reto experto y nunca como tutorial. El juego no muestra atributos en forma de números durante la acción; explica los factores después.

Reutilizar, donde sea compatible:

- `SP3` para escena, cámara, estadio, balón y repetición;
- `SpPhys` para el vuelo y clasificación de tiros;
- `SpPlay` como referencia de patrones de gesto, cierre de interfaz, sonido y replay;
- `Pitch3D`/`Pitch` para superficies/representación del campo;
- atributos, alineación, clima, fatiga y presión existentes para contextualizar el rendimiento.

Crear un resolvedor nuevo de pase/recepción e intercepción determinista, sin alterar el resolvedor de faltas/penaltis. Si la física de pase requiere una modificación a `SpPhys`, añadirla de manera aditiva y probar regresión. El mismo `seed + inputs` produce la misma jugada y repetición.

### 6.6 Campaña inicial

Propuesta de estreno: **5 capítulos × 6 retos = 30 secuencias**, con tutorial de 3 pasos y retos libres diarios locales (sin servidor, basados en semilla/calendario interno opcional). Cada capítulo enseña una habilidad:

1. Pase y orientación corporal.
2. Desmarque y pase al espacio.
3. Pared y tercer jugador.
4. Tiro colocado, potencia y curva.
5. Secuencias mixtas con presión y objetivo táctico.

Variantes visuales y de plantilla reflejan el modo y el género seleccionado. Los retos son originales, no reconstrucciones de partidos reales ni jugadas históricas verificadas. La primera versión permite completar la campaña con cualquiera de las dos carreras, usando fútbol masculino o femenino según el save.

### 6.7 Recompensas y relación con la carrera

- Desafíos autónomos: medallas, recuerdos en la vitrina, animación de celebración, pelota/accesorio para mascota y nuevos campos visuales.
- Modo carrera integrado futuro: las recompensas son la estadística real del evento y progresión normal; no dinero grande ni un bonus oculto de atributos.
- Las recompensas de primera campaña son alcanzables sin perfección: bronce por completar, plata por objetivo principal, oro por objetivo opcional.
- No hay vidas, energía de pago, anuncios obligatorios ni temporizadores que expiren.

---

## 7. Propuesta de arquitectura y datos

### 7.1 Decisiones

Mantener el formato actual de eventos para que sigan funcionando los previews y efectos. Añadir metadatos opcionales con IDs estables, `modes`, `genderContext`, `cooldown`, `arc`, `requires`, `exclude`, `priority` y `sourceNote`. Las condiciones usan funciones ya disponibles del contexto (fase, competición, posición, calendario, estado); evitar lógica narrativa nueva dentro de la interfaz.

Una decisión nueva debe poder probarse como una unidad pura: preparar contexto → calcular opciones/desenlaces → aplicar efecto → comprobar el save resultante. El registro de una elección se guarda en un namespace versionado y pequeño.

### 7.2 Jugadas

Separar:

- `sequence-data.js`: catálogo de retos/parametrización, sin UI;
- `sequence-engine.js`: estado de balón, receptores, defensores, reglas y semilla;
- `sequence-ui.js`: entrada, ayudas, HUD y accesibilidad;
- `sequence-campaign.js`: desbloqueos y recompensas cosméticas;
- pruebas puras para la semilla y simulación, pruebas DOM para gestos y pruebas de integración con escena.

Esquema orientativo:

```js
{
  id: "pass-through-press-01", v: 1,
  mode: ["player", "manager", "club"], gender: ["m", "f"],
  objective: "reach-zone", maxActions: 3,
  seed: 41827, pitch: "training", weather: "clear",
  actors: [{role: "user", pos: [52, 34]}, {role: "teammate", pos: [65, 25]}],
  opponents: [{pos: [59, 31], behavior: "close-lane"}],
  targets: [{zone: [74, 19], optional: true}],
  rewards: {bronze: "complete", silver: "reach-zone", gold: "score-under-pressure"}
}
```

Es un contrato conceptual, no una decisión final de serialización. No guarda coordenadas de dispositivo ni una repetición completa dentro de una partida; guarda ID, estado de campaña, mejor medalla y, si el usuario acepta integración a carrera, semilla/inputs mínimos para reproducir el momento.

### 7.3 Competiciones y assets

- Mantener el orden de carga empaquetado y sincronizar `src` con `legacy-game/src`.
- Reservar IDs de ligas y clubes, no reciclar IDs borrados.
- Registrar fuentes y fecha de los datos por pack, sin requerir internet en ejecución.
- La identidad de las Épocas usa su módulo/snapshot y no recibe ligas modernas por herencia automática.

### 7.4 Mascotas

Ampliar los registros de especie/animación y objeto con claves que no dependan del idioma. Migrar datos de accesorios nuevos como cosmética opcional; mascota, nombre, vínculo, monedas y partida antigua deben permanecer intactos. Si una especie no tiene animación, aplicar fallback visual seguro sin mostrar un modelo roto.

---

## 8. Economía, progresión y ritmo

- No subir precios ni añadir una moneda premium.
- Las nuevas decisiones no deben convertirse en una ruta explotable para farmear dinero, fama o moral.
- El jugador siempre ve los posibles costes. Los contratos y presupuestos usan unidades/formato actuales y tienen límites.
- Las mascotas nuevas no exigen una rutina diaria y sus microactividades son optativas.
- La expansión de ligas no debe multiplicar de forma descontrolada los calendarios: medir tiempo de generación, memoria, tamaño del HTML Android y consumo en móvil.
- La campaña de jugadas funciona en sesiones cortas y permite continuar; abandonar una secuencia autónoma no castiga una carrera.
- La primera experiencia debe enseñar una mecánica por vez y dar una oportunidad segura antes de introducir presión.

---

## 9. Plan de entrega recomendado

### Fase 0 — Auditoría y prototipo (1 sprint de diseño/ingeniería)

- Inventariar decisiones por modo, fase, condición y frecuencia; localizar solapamientos y falta de variantes.
- Inventariar datos de ligas por país/división/género y separar listas curadas, simuladas y verificadas.
- Prototipo táctil de un pase y un tiro en una escena de entrenamiento; confirmar rendimiento y accesibilidad.
- Probar dos modelos de mascota nuevos y definir presupuesto de memoria/animación.

**Salida:** decisión de alcance cerrada, prueba de control aprobada, lista de datos con fuente y deuda de QA conocida.

### Fase 1 — Contenido y fundamentos

- Añadir primero una selección representativa de decisiones (12 familias por modo) y el sistema común de condiciones, vista previa y resultados.
- Construir el catálogo de liga por bloques pequeños, validando progresión y clubs/torneos.
- Incorporar 2 mascotas, 12 accesorios y previsualización completa.
- Publicar el primer capítulo de Jugada Maestra (6 retos) como beta interna/offline.

**Puerta de calidad:** todas las traducciones, guardados viejos, modo femenino y masculino, móvil de gama baja y compilación Android/Web pasan pruebas.

### Fase 2 — Gran lanzamiento

- Completar la meta de hasta 108 familias de decisión y arcos de 2–4 escenas.
- Liberar el bloque aprobado de 12–20 ligas en etapas; no hay que lanzar el máximo si los datos no alcanzan el estándar.
- Completar las 4 nuevas opciones de mascota, el paquete de aproximadamente 24 accesorios y 4 actividades.
- Lanzar los 30 retos de Jugada Maestra con tutorial, repeticiones y recompensas.

### Fase 3 — Integración al partido (actualización posterior)

- **Hecho en esta rama:** activación optativa antes de la carrera y en los ajustes de la partida, solo con ritmo Intenso (el que tiene partidos en directo). Como máximo dos momentos controlables por encuentro, dentro de una ventana de minutos y con un xG mínimo, para que la pausa no rompa el ritmo del partido.
- Integrar con el estado de partido y los guardados. En una misma partida, un momento se resuelve una sola vez.
- Probar comparativamente resultados esperados, duración, goles, lesiones, clasificación y ritmo en liga/copa y en ambas ramas de género.
- Solo se publica si apagar la función reproduce la experiencia y equilibrio previos.

---

## 10. Pruebas y criterios de aceptación

### Decisiones

- El usuario encuentra nuevas decisiones en Jugador/a, Míster y Crea tu club; contenido nuevo es elegible en carreras masculinas y femeninas.
- Se prueban al menos 30 familias pertinentes por combinación modo/género. Medido con el ritmo real (`real-f/decision-balance.json`): 34–36 pertinentes en catálogo y 21–22 distintas en dos temporadas (22 ofertas). **Criterio de exposición pendiente**: como cada oferta ya es casi siempre una familia nueva, llegar a 30 distintas exige más huecos de decisión o más decisiones por hueco.
- No aparecen cartas incompatibles con club/torneo/edad/posición/fase; ninguna opción se queda sin texto o desenlace.
- Probabilidad en UI = probabilidad usada; semilla igual reproduce el mismo desenlace.
- Los efectos pueden deshacerse en pruebas, no se apilan indebidamente y no bloquean progresión.

### Ligas

- IDs antiguos permanecen iguales; progresión de ascenso/descenso y torneos se comprueba desde cada división nueva.
- No se presentan datos modernos como históricos; no se inventan campeones, clubes participantes o reglas oficiales para Épocas.
- El modo femenino tiene rutas y fuentes propias; las ligas no introducen plantillas masculinas silenciosamente.
- El usuario puede continuar un save creado antes de la expansión, y el save no cambia si no entra a una competición nueva.

### Mascotas

- Accesorios y modelos quedan en su sitio en casa, campo 2D/3D, diferentes rigs y resoluciones.
- Las acciones pueden omitirse sin pérdida; no hay muerte, paywall, castigo de retorno ni mejora deportiva obligatoria.
- Los objetos nuevos tienen IDs únicos y se guardan/cargan en cinco idiomas.

### Jugada Maestra

- Reproducibilidad con semilla e inputs; las entradas táctiles fuera del campo se ignoran correctamente.
- La línea no salta al rotar la pantalla; ratón, stylus y dedos funcionan; objetivo viable con modo asistido.
- Ningún reto es imposible por un resultado aleatorio oculto; los fracasos se explican y ofrecen una nueva estrategia.
- FPS, memoria, tamaño de paquete y consumo se miden en WebView Android, Android modesto y web de escritorio.
- Los minijuegos existentes de penalti/falta mantienen resultados y comportamiento: regresión obligatoria.
- Integración a partidos: con la opción apagada el partido reproduce el motor anterior (contraste por digest), y encendida la jugada no se repite, su desenlace es el evento real del partido y el guardado conserva la semilla.

### Calidad global

- `npm run build` y `npm run test:build` pasan.
- Smoke test con saves antiguos de cada modo y género; carga, juego de una jornada, cambio de temporada y reinicio de app.
- Auditoría de accesibilidad: foco visible, lector de pantalla para objetivos y resultados, contraste, tamaño de toque, movimiento reducido y control sin arrastre.
- Revisión editorial para no afirmar cobertura completa o historicidad no demostrada.
- Sin conexión de red, permisos nuevos ni anuncios intrusivos durante un partido.

---

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Añadir volumen de eventos que se repiten o parecen genéricos | Diseñar arcos, medir frecuencia real en simulaciones largas y usar enfriamientos/condiciones claras |
| Expansión de ligas con clubes o reglas dudosos | Paquetes con fuentes/ciclo/limitaciones; publicar menos antes que completar con datos fabricados |
| Desbalance de contenido entre fútbol masculino y femenino | Matriz de seis celdas, mínimo de familias elegibles, QA editorial y de runtime independiente |
| Jugada interactiva altera el equilibrio de un partido | Lanzar primero como campaña aislada; integración optativa posterior y comparación estadística |
| Gestos frustrantes o poco accesibles | Ayuda de pase/tiro, sensibilidad, trazos asistidos, alternativa de toque y tutorial gradual |
| Más mascotas disparan complejidad de rig y necesidades | Gate de arte/animación y cuidados; no aprobar especie sin modelo y actividades completos |
| Paquete crece demasiado en Android | Reutilizar assets, atlas comprimidos, carga diferida de escena y budget por recurso |
| Guardados rotos por IDs o campos nuevos | IDs append-only, migraciones aditivas, valores por defecto y fixtures de saves viejos |
| Falsa impresión de historia verificada | Etiquetas de procedencia; mundo moderno y Épocas aislados; no añadir hechos de temporada sin fuente |

---

## 12. Resultado que debería sentir el jugador

Al cabo de una temporada, el jugador debería recordar **al menos tres decisiones que cambiaron su historia**, una ruta competitiva nueva que tenga sentido para su carrera y una escena de fútbol que sintió que resolvió con sus propias manos. Su club puede ser masculino o femenino, creado o heredado; sus compañeros son ficticios y estables; su mascota reacciona y viste como quiere; y los nuevos retos se juegan sin red, sin castigos diarios y sin desordenar un guardado antiguo.

Ese es el estándar para decir que la actualización está completa: no contar botones añadidos, sino más carreras distintas, más caminos que se pueden recorrer y más jugadas que apetece volver a intentar.
