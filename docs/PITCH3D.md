# Partido 3D experimental

El partido 3D es una representación visual del directo. **`match41.js` sigue siendo la autoridad** del marcador, el minuto, las estadísticas y los eventos; `pitch3d.js` no simula resultados ni modifica el estado del partido. El campo 2D continúa siendo la opción por defecto y el 3D se activa desde el propio partido.

## Activación y controles

- En el directo, pulsa **Probar vista 3D**. El botón cambia a **3D · volver a 2D** para regresar.
- También se puede arrancar en 3D con `?pitch3d=1`.
- La preferencia se guarda en `localStorage` con la clave `camino.pitch3d` (`"1"` o `"0"`).
- El botón **↺** del campo lanza una repetición visual de los últimos segundos. No altera el partido.
- Si WebGL no está disponible, falla la inicialización o se pierde el contexto, el adaptador vuelve automáticamente al campo 2D.
- El indicador inferior muestra FPS y jugadores activos. La cámara y la calidad se adaptan al rendimiento.

## Arquitectura

`src/pitch3d.js` se divide en bloques independientes:

1. **Estado y simulación visual**: posesión, balón, jugadores, saques, descanso, final y cola de acciones.
2. **IA y movimiento**: posiciones base por formación, pressing, ayudas, separación, porteros y velocidades.
3. **Animación y skinning**: lectura de clips GLB, evaluación de la jerarquía de 22 huesos, deformación en CPU con hasta cuatro influencias por vértice y cross-fade de 0,18 s entre clips.
4. **Balón y jugadas**: estados `dead`, `held`, `flight` y `loose`; pases visuales en juego abierto, tiros con enrosque, paradas, postes, saques, córners, faltas y penaltis. El saque de puerta usa una secuencia de presentación con impacto sincronizado y sin presión rival.
5. **Ambientación**: graderío procedural, cubierta, túnel, focos, árbitro, asistentes, clima y marcador de retransmisión.
6. **Cámara**: seguimiento suave del balón, acercamiento en jugadas, cortes de tiro/gol y encuadre de celebración.
7. **WebGL 1**: shaders propios, un VBO estático para el campo y un VBO dinámico reutilizado para jugadores y balón.
8. **Adaptador `Pitch`**: conserva la API del campo 2D y permite alternar 2D/3D sin reiniciar el directo. Los eventos visuales `pass`/`tackle` nunca llegan al campo 2D.

### Assets 3D

Los modelos viven en `assets/` y se describen en `assets/manifest.json`:

- `assets/players/male`, `female` y `goalkeeper`: dos LOD de jugador (LOD1 y LOD2) con el mismo esqueleto de 22 huesos y los clips `idle`, `run`, `kick`, `dive` y `celebrate`.
- `assets/ball/ball_lod1.glb`: balón de 80 triángulos y 0,11 m de radio. El render lo dibuja a escala 2 para conservar la legibilidad del balón procedural anterior en móvil y a distancia de retransmisión.
- `assets/stadium`: portería, banderín, valla, banquillo y barrera. Están incluidos en el pack de runtime, pero **el campo sigue usando sus porterías, vallas y gradas procedurales**; estos props quedan preparados para una sustitución posterior sin duplicar geometría.

El repositorio del juego incluye el subconjunto de runtime (LOD1/LOD2, balón y props). Los LOD0 y las previsualizaciones que aparecen en `assets/manifest.json` permanecen en el repositorio de assets; no se incrustan en el HTML.

`src/pitch3d-assets.js` es un parser GLB 2.0 sin dependencias: lee posiciones, colores por vértice, materiales, jerarquía, matrices de bind e inversas, clips y pesos. En tiempo de ejecución no se descarga nada:

```text
build.py ──> assets/**/*.glb ──> base64 ──> P3D_ASSET_PACK ──> Pitch3DAssets.load()
                                                                      │
                                        Pitch3D: LOD1/LOD2, skinning CPU, VBO dinámico
```

`build.py` incrusta los GLB en `dist/index.html`, de modo que el archivo único sigue funcionando desde `file://` y dentro de la APK sin `fetch`, CORS ni red. Si falta un GLB, el parser falla o WebGL no está disponible, el render usa el jugador/balón procedural y el adaptador conserva el campo 2D.

La variante se elige por actor: `goalkeeper` para porteros, `female` cuando la carrera envía `fem` y `male` en el resto. `ui.js` transmite `fem: S.g === "f"` al montar y al actualizar el estado. La distancia a cámara decide LOD1/LOD2; la calidad adaptativa puede forzar LOD2.

Flujo de integración:

```text
match41.js ──> ui.js (livePitchFeed) ──> Pitch.state / Pitch.event
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                        Pitch 2D (pitch.js)          Pitch3D (pitch3d.js)
                              │                             │
                              └──────── canvas del directo ─┘
```

`ui.js` envía al 3D la posesión, la posición narrativa del balón (`bx`), la velocidad, la mentalidad, las tácticas del equipo local, el clima (`wx`), el marcador (`score`), el minuto (`min`) y el contexto del sorteo (`toss`: nombres, nivel, estilo rival). El marcador viaja **siempre como `[local, visitante]`**, se juegue en casa o fuera, para que el chip izquierdo y el derecho del HUD 3D no se intercambien. Los eventos (`goal`, `save`, `post`, `miss`, `half`, `end`, tarjetas, `pass`, `tackle`, etc.) solo generan la representación visual; el marcador y las estadísticas los actualiza el motor del partido. `pass`/`tackle` se descartan en el adaptador cuando no hay 3D montado.

### Autoridad y sincronización

- `state.bx` siempre se interpreta desde la perspectiva del equipo local. El 3D aplica el lado de ataque (`sim.attack`) y lo espeja al descanso.
- `bx` es una posición física continua: al perder la posesión el balón se queda donde estaba y solo cambia el equipo que ataca. Los saques de centro, de puerta, de banda, los córners, las faltas y los penaltis son las reanudaciones que lo colocan en una posición fija.
- La salida por la línea de fondo se resuelve por el último toque: saque de puerta para el equipo que defiende esa portería si el balón lo sacó el atacante, y córner para el atacante si lo desvió el defensor.
- El adaptador no lanza pases de reconciliación de un campo a otro: si el portador está lejos del objetivo, corre hacia él. Un cambio de posesión suelta el balón en su sitio y el nuevo equipo lo persigue.
- Los jugadores se identifican por `id` estable, no por identidad de objeto: `ui.js` recrea la lista cada minuto y el 3D reutiliza sus actores.
- Si llega un evento mientras hay una acción en curso, se encola. La UI puede esperar con `Pitch.busy()`.
- Al descanso se intercambian lados, se reinicia el saque y se conserva el roster.
- Al final se congela la simulación visual, pero la cámara y el render siguen activos.
- **Marcador autoritativo**: `state.score` fija el objetivo canónico, pero el HUD no lo muestra al instante. Un evento `goal` marca `scorePending`; el marcador visible solo sube cuando el balón cruza la línea y `resolveShot` llama a `commitGoal`. Si un gol se queda sin confirmar, `reconcileScore` adopta el objetivo a los 25 s de tiempo visual. El HUD nunca se adelanta al vuelo ni retrocede.
- `Pitch.reset()` conserva el roster y recoloca el partido para el reinicio de la simulación.

### Entrada, descanso y despedida

La puesta en escena es una capa puramente visual dentro de `sim.cinema`. No cambia `conv`, `bigR`, `xgPerGoal`, el marcador, el minuto ni la posesión de `match41.js`. `ui.js` deja de pedir minutos mientras hay una secuencia y las sondea con `Pitch.cinema()` y `Pitch.busy()`.

```text
Inicio:    walkout → greet → coinCall → coinFlip → coinResult
           → choose / rivalChoice → choiceResult → lineup
Descanso:  off → switch → enter → greetHalf
Final:     whistle → line → walkoff
```

- **Inicio**: cada equipo sale del túnel en **una sola fila**, con el capitán al frente y el resto detrás en su carril; la fila avanza junta hasta el borde del círculo central y solo entonces se abre a las posiciones. Los capitanes y el árbitro se saludan y se juega el cara o cruz. La secuencia solo se reproduce en el arranque real del directo (`cinematics: !L.min`); al volver a 3D con el partido ya empezado no se repite. Si se cambia de vista **en plena entrada**, la ceremonia continúa en el otro modo: el 2D hereda fase, progreso y estado del sorteo, y el 3D reinicia su salida desde el túnel.
- **Paridad 2D**: cuando el directo arranca en el campo de bolitas, `pitch.js` reproduce la misma secuencia con un túnel y un panel DOM, sin WebGL ni assets. La salida en fila, el saludo, la llamada, la moneda dibujada en canvas, el resultado, la elección y la formación usan el mismo contrato de tiempos y dejan el motor bloqueado hasta terminar.
- **Descanso**: los jugadores abandonan el campo hacia el túnel, se intercambian lados y vuelven a entrar; capitanes y árbitro repiten el saludo antes de reanudar. Si el directo estaba pausado, la secuencia se ve igual y el 3D queda congelado al terminar hasta que el usuario reanude.
- **Final**: el árbitro pita, los equipos forman una línea, se saludan y caminan hacia el vestuario. `sim.ended` queda activo desde el principio, pero el bucle sigue animando mientras haya cine; después se ocultan jugadores y balón y la simulación visual queda congelada.
- **Cámara**: el túnel, el círculo central y la línea final tienen encuadres propios. Las transiciones suavizan posición, altura y objetivo; no modifican la cámara normal del partido.
- **Fallback**: sin GLB se usan las poses procedurales; sin WebGL se conserva el campo 2D y el adaptador no crea secuencias.

Para depuración, `Pitch3D.cinema()` devuelve `{type, stage, t, stageT, coin}` o `null`, y `Pitch3D.skipCinema()` completa la secuencia actual. El adaptador `Pitch` expone ambos métodos en 3D y en 2D. `busy()` devuelve 620 ms mientras hay ceremonia y `ui.js` limita el sondeo a 420 ms para no pedir minutos hasta que la secuencia termina.

### Audio compartido

- `pitch.js` construye el ambiente de grada procedural con Web Audio y lo expone como `window.PitchAudio`. El 2D y el 3D montan y liberan el mismo motor; ya no depende de que exista un canvas `P` concreto.
- Al destruir una vista, `PitchAudio.stop()` baja el volumen y retrasa la suspensión **260 ms**. El montaje de la otra vista cancela esa pausa, de modo que el ambiente sobrevive al cambio 2D↔3D sin un corte audible.
- El 3D usa el mismo motor para el rugido de peligro, gol, ocasión fallida, golpeo, silbato de descanso/final, tarjetas y balones parados. El estado de silencio y el `localStorage` son los mismos en ambas vistas.
- `Pitch.sound()` y `Pitch3D.sound()` respetan el botón de sonido. `PitchAudio.state()` devuelve `{on, active, ready, context, calls, lastCue}` para depurar el motor sin exponer los nodos de Web Audio; sigue sin usar ficheros ni dependencias.

### Cara o cruz

El sorteo se dibuja como un panel DOM sobre el canvas 3D, con botones `data-p3d-coin` y `data-p3d-choice`. La moneda y el lanzamiento son geometría procedural; no se descarga ningún asset nuevo. El campo 2D replica el mismo panel con atributos `data-p2d-*`.

- **Llamada**: el jugador elige `cara` o `cruz`; si no responde en **10 s de partido**, el árbitro llama por él. Si gana, la decisión **campo/pelota** dispone de **20 s** antes de la elección automática. El tiempo restante se actualiza cada frame en `data-p3d-timer` (3D) y `data-p2d-timer` (2D), tanto en la llamada como en la elección.
- **Resultado**: la moneda gira 1,15 s, se resuelve y se anuncia el ganador.
- **Elección del jugador**: el panel muestra **campo** y **pelota** como tarjetas con pros y contras explícitos (`data-p3d-pro`, `data-p3d-con`; en 2D, `data-p2d-pro` y `data-p2d-con`). El texto se calcula al vuelo según el nivel del rival, su estilo (`Posesión`, `Juego directo`, `Presión alta`, `Contragolpe`) y el clima. **Campo** invierte el lado de ataque visual; **pelota** conserva la orientación y el saque. En ambos casos el saque de centro sigue siendo el que fijó `match41.js`.
- **Decisión rival**: si gana el rival, `chooseRivalToss` simula su elección con el mismo contexto: un rival de presión o posesión tiende a elegir campo, y un rival claramente superior puede dejar el campo como está porque confía en su nivel. El panel muestra primero el motivo (`data-p3d-rival-why`, `data-p2d-rival-why`) y después aplica la consecuencia (`data-p3d-choice-result`, `data-p2d-choice-result`).
- **Contexto visible**: bajo las tarjetas, `data-p3d-toss-meta` y `data-p2d-toss-meta` resumen clima (icono, nombre, efecto y multiplicador de fatiga), rival, nivel y estilo. La fatiga que se muestra es la que aplica `match41.js`; el sorteo no la modifica.
- La decisión no cambia la posesión autoritativa: el saque inicial sigue viniendo del primer `state.own`. El descanso vuelve a invertir los lados.
- El panel ya no es exclusivo del 3D: el campo 2D muestra el mismo sorteo y los mismos datos. En 2D **campo** invierte `P.flip` (solo dibujo) y **pelota** lo conserva; el APK sin WebGL sigue funcionando sin assets y sin tocar el resultado.

#### Ceremonia 2D

`pitch.js` monta un túnel y un overlay DOM sobre el canvas de bolitas. La secuencia es `walkout 4,2 s → greet 2,6 s → coinCall (máx. 10 s) → coinFlip 1,15 s → coinResult 1,25 s → choose/rivalChoice (máx. 20 s si decide el jugador) → choiceResult 1,25 s → lineup 1,5 s`. Los tiempos se escalan con la velocidad del directo y el motor no avanza minutos mientras `P.cine` exista.

- La salida 2D usa dos carriles (`LEN/2 ± 2,35 m`), una columna por equipo y el capitán del `slot 9` al frente. Cada jugador entra escalonado (`delay = rank × 0,09 s`, `2,9 s`) y espera en la fila hasta que el saludo lo lleva a su posición; los capitanes terminan en el círculo central para el sorteo. El saludo dibuja brazo y mano con un desfase por jugador, igual que la puesta en escena 3D. Al terminar, `finishIntro2D()` llama a `kickoff(P.own)` para conservar el saque autoritativo.
- La moneda 2D se dibuja en el canvas con halo, canto, sombra y giro a partir de `coin.angle`; la cara `C`/`X` se revela después del lanzamiento. `P.coinVisual` expone `{visible, stage, angle, spin, face, radius}` para pruebas y depuración.
- **Cambio de vista durante la entrada**: al pasar de 3D a 2D, el puente captura `Pitch3D.cinema()` antes de destruir el 3D y lo pasa como `intro` al montaje 2D. `resumeIntro2D()` retoma la misma fase y `stageT`, conserva llamada, cara, ganador, elección, motivo rival, `waitT` y el ángulo de la moneda, y aplica el campo si el 3D ya lo había cambiado. Si la ceremonia había terminado, `introSeen` evita repetirla.
- La lluvia, la nieve y el calor se dibujan con partículas deterministas de canvas, sin assets. El balón y su sombra se ocultan durante la ceremonia.
- `Pitch.cinema()` y `Pitch.skipCinema()` funcionan también en 2D; las pruebas que no quieren la intro llaman a `Pitch.skipCinema()`.

### Saque de puerta

El saque de puerta ya no es un pase instantáneo tras una espera fija. `pitch3d.js` representa una secuencia de presentación de **4,76 s de partido** (comprimida por la velocidad del directo), sin tocar el resultado ni el estado de `match41`:

```text
prepare → scan → windup → plant → impact → follow → recover
 1,35     0,80    0,90     0,16     0,10     0,75     0,70
```

- **prepare**: el portero llega al balón y lo coloca. El balón permanece `dead` en el punto de saque.
- **scan**: otea ambas bandas; la orientación del cuerpo barre a izquierda y derecha.
- **windup**: retrocede mirando al balón y arranca la carrera de golpeo.
- **plant / impact**: la pose de golpeo llega al contacto y **solo entonces** se llama a `launchBall`; no hay un temporizador paralelo. La marca de impacto y el lanzamiento quedan registrados en `sim.lastGoalKick`.
- **follow / recover**: acompañamiento, vuelta a la posición y fin de la acción. `busy()` cubre la secuencia completa y, si el envío es largo, también la recepción.

**Ningún rival puede pisar el área ni acercarse al portero durante el saque.** Antes de colocar a los receptores, `placeGoalKickOpponents` saca del área a todo rival que esté dentro (con 0,45 m de margen) y garantiza una separación de protección de `GK_SAFE_DIST` (13,5 m); una segunda pasada radial corrige cualquier caso de banda. La IA queda congelada hasta que el balón sale, de modo que no hay un jugador rival esperando al lado del guardameta. `minPressureDist` mide la separación real y `pressure` queda siempre en `false`; las pruebas exigen 0 rivales dentro del área, `playersInsideArea === 0` y al menos 12,5 m del portero. En la última ejecución el rival más cercano estuvo a 22,66 m en preparación y a 19,149 m al completar el saque.

La secuencia elige dos opciones reales (apoyo corto y salida larga), mueve a los receptores a sus zonas y conserva la continuidad física del balón. Si no hay GLB, la pose procedural dispone de brazos de portero y pierna de golpeo; los actores con GLB reutilizan `idle`, `run` y `kick`. La IA se pausa durante la coreografía y se reanuda al terminar, salvo que el evento autoritativo haya cambiado la posesión.

Para depuración, `Pitch3D.debug().goalkick` expone la fase activa, el registro de fases, `impactAt`, `launchT`, si se lanzó, el receptor, `minPressureDist`, `opponentsOutside`, `playersInsideArea`, `opponentsMoved` y `safeDist`. Tras finalizar, se conserva el resumen en `sim.lastGoalKick`.

### Córners, faltas y penaltis

Los balones parados se representan como una puesta en escena completa: se colocan los actores, se respeta la distancia reglamentaria y el balón se envía al área o se lanza a portería. No se reutiliza el pase corto al compañero más cercano ni se deja al receptor con su tarea táctica.

- **Córner**: el sacador va a la esquina; un rematador espera en el segundo palo (10,5 m de la línea de gol), otro en el palo corto y otro en la frontal. Los defensores ocupan las marcas, el portero se sitúa bajo la portería y todos los rivales quedan fuera de **9,15 m** del balón. El centro sale con arco hacia el punto de remate y el receptor ataca la caída.
- **Falta cerca del área** (hasta 34 m de la portería): el sacador se coloca detrás del balón y la barrera de tres defensores se forma a **9,15 m** en dirección a la portería atacada; el resto de la defensa se reparte entre la barrera y su área. Los atacantes esperan en el área y el saque se dirige al punto de remate, no a un compañero cercano.
- **Falta lejana**: se respeta también la distancia de 9,15 m, pero no se monta barrera ni se llena el área; el sacador reanuda con un pase raso a un compañero adelantado, como en un partido normal.
- **Penalti**: el balón va al punto de penalti (11 m), el sacador se coloca detrás, el portero en la línea y **todos los demás jugadores fuera del área**, por detrás de la frontal. El lanzamiento reutiliza la acción de tiro con resultado `goal`, `save`, `post` o `miss`; si no se indica, se usa `save`.
- Durante la colocación y la espera, la IA está pausada y un cambio de posesión del motor no cancela el saque. Al lanzarse, el 3D vuelve al juego normal.
- `sim.lastSetPiece` conserva el tipo, el receptor, el punto de remate y, en las faltas, la posición y distancia de la barrera. Los eventos manuales `corner`, `free`/`freekick`/`free-kick` y `penalty` permiten reproducir la puesta en escena sin tocar el marcador.

### Tarjetas del árbitro

- La tarjeta detiene el balón y cualquier saque pendiente. El árbitro se acerca al infractor; si estaba a más de 8 m, el corte de cámara lo coloca ya en el lugar para que el gesto no se pierda fuera de plano.
- En la fase `approach` camina hacia el jugador; en `show` se detiene, lo encara y levanta la tarjeta durante 1,75 s. La cámara baja a un plano cercano de 12,5 m de distancia y 6,8 m de altura.
- La tarjeta es geometría procedural orientada a cámara, con borde claro y color **amarillo** o **rojo**. El árbitro reutiliza el clip `celebrate` para el gesto de brazos (o la pose procedural de mano en alto sin GLB); la tarjeta se dibuja aparte y se retira al terminar.
- La roja marca al jugador como expulsado y lo oculta. Si la tarjeta llega con `k: "foul"`, al terminar la acción se prepara una falta para el equipo contrario.
- `Pitch3D.debug().card` expone `side`, `res`, `player`, si hay árbitro y si la tarjeta ya es visible. `sim.lastCard` conserva el resumen tras la acción.

### Locomoción

- La velocidad se aproxima al objetivo con una aceleración máxima de 16 m/s² y la fase de zancada avanza según la velocidad real, no según el reloj. Al detenerse, la zancada se congela.
- La inclinación frontal acompaña la aceleración y el banco lateral acompaña el giro. Son deformaciones cosméticas suavizadas y acotadas (`lean` ±0,065, `bank` ±0,05): no cambian la posición, el balón ni el marcador.
- Los actores GLB aplican la inclinación sobre la malla ya deformada; la pose procedural aplica la misma inclinación y añade elevación de pie y rodilla durante la zancada. Los clips GLB conservan su propio ciclo de carrera.
- Al quedarse sin carrera, el jugador gira la mirada y el cuerpo hacia el balón; la pose procedural incorpora una oscilación de espera. Durante el saque de puerta manda `faceLock` y la coreografía no se altera.
- La inclinación se anula al caer en una parada, al terminar el partido, al volver a la posición base y durante la repetición visual.

### Pases y robos visuales

- `engine-extra.js` emite `pass` y `tackle` como eventos **solo visuales** después de calcular el resultado del minuto. No modifican `conv`, `bigR`, `xgPerGoal`, el marcador ni las estadísticas.
- El evento `pass` elige un receptor coherente entre los compañeros (prefiere al jugador sugerido por el motor si está cerca), limita la ventaja a unos 1,2 m y hace que el receptor ataque el punto de recepción durante el vuelo. También los saques y reinicios fijan ese punto; antes el receptor seguía su tarea táctica y el balón acababa encima de él.
- El 3D distingue pase raso, largo, bombeado y centro; calcula arco, duración y enrosque, y recorta la curva para que el balón no salga del campo. Si la posesión cambia antes de la llegada, el vuelo se cancela y el pase pendiente se ejecuta cuando el nuevo bando controla el balón.
- La recepción solo entrega el balón si el receptor está a menos de 1,75 m del punto de caída. Si se ha quedado atrás, el balón queda suelto, rueda hacia él y el jugador lo persigue; no se teletransporta. Los tiros que llegan durante un pase se encolan y arrancan al terminar el vuelo.
- El evento `tackle` anima al jugador del bando que recupera el balón. En el campo 2D se descarta: no crea filas vacías en el comentario ni jugadas fantasma.
- Los clips GLB existentes (`kick` y `dive`) se reutilizan con animaciones procedurales para pase, robo, tiro y parada; el cross-fade de 0,18 s suaviza idle→carrera→acción. El tackle de un jugador de campo usa `kick` y una pose de barrida propia; `dive` queda reservado a porteros y paradas.

### Ambientación y retransmisión

- **Grada**: quads verticales baratos para cuerpo y cabeza, con colores de afición y detalles del club local; cubierta, vigas, focos y boca de túnel completan el estadio sin texturas ni instancing.
- **Oficiales**: árbitro y dos asistentes son actores visuales fuera de `sim.players`, por lo que el contrato de 22 jugadores no cambia. El árbitro acompaña la jugada y los asistentes recorren su banda; al descanso se espejan con el resto del campo. Sus gestos (saludo, pito) caducan con el mismo reloj que los jugadores y la locomoción manda mientras caminan, así que nunca se quedan congelados en `celebrate`.
- **Clima**: `ui.js` transmite `wx` desde el motor y muestra una franja con icono, nombre, efecto y multiplicador de fatiga. El 3D tiñe cielo y niebla, ajusta la distancia de niebla y dibuja lluvia inclinada o nieve procedimental. La rodadura y el rebote del balón suelto cambian de forma **solo visual** para que el clima se note; la fatiga real la sigue aplicando `match41.js` con `MX_WX` y la calibración no se toca. Con `prefers-reduced-motion` o calidad baja se reduce o se omite.
- **Marcador**: `ui.js` transmite `score` como `[local, visitante]` y `min`; el 3D muestra un marcador compacto con los colores de cada equipo. El HUD 3D difiere el cambio hasta que el balón cruza la línea (`scorePending`/`commitGoal`) y reconcilia a los 25 s si el evento se pierde. Sigue siendo un reflejo del motor, nunca una fuente de verdad.
- **Cámara**: los cortes de tiro, gol y repetición son visuales; el estado del partido no se congela ni cambia por ellos.

## Renderizado y rendimiento

- WebGL 1, sin frameworks ni dependencias de runtime.
- Campo, líneas, porterías, vallas, gradas y torres se construyen una vez en un buffer estático.
- Jugadores, sombras de contacto, aro del portador y balón se reconstruyen en un buffer dinámico que se reutiliza; no se crean buffers por frame.
- Los jugadores usan los GLB LOD1/LOD2, con el jugador cercano a LOD1 y el resto a LOD2. Si un modelo no está disponible, se usa la malla procedural de reserva.
- El balón GLB se dibuja con rotación de rodadura derivada de su velocidad; si falta, se usa el balón procedural. La sombra de contacto y el aro del portador siguen siendo geometría propia.
- La luz es plana por triángulo: clave cálida desde arriba, relleno frío y ambiental hemisférica. Los materiales claros y poco saturados (balón, medias, guantes) reciben un especular barato calculado en CPU; las equipaciones y la piel quedan mate.
- Cada jugador proyecta dos elipses de contacto alargadas en sentido contrario a la luz. A distancia se sustituyen por un disco de pocos segmentos para no gastar triángulos.
- Calidad adaptativa: si los FPS bajan, se reducen detalles, sombras y el especular dinámico; si se recuperan, vuelven gradualmente.
- `devicePixelRatio` se limita a 1.5 para no disparar el coste en móviles de alta densidad.
- El render se pausa cuando la pestaña queda oculta y respeta `prefers-reduced-motion` para la sacudida de cámara.
- Las matrices de cámara, los uniformes y los buffers se reutilizan para evitar asignaciones por frame.

## Pruebas

### Prueba aislada del 3D y de la ceremonia 2D

`test/pitch3d.js` monta `src/pitch3d.js` en una página mínima con un stub de `Pitch`, sin depender de toda la interfaz, y añade una página real con `bolas.js` + `pitch.js` para la ceremonia 2D. Comprueba WebGL, roster, carga y skinning de los GLB, balón GLB, ausencia de NaN o triángulos desgarrados, entrada desde el túnel en fila con el capitán al frente, saque inicial, posesión, inclinación de carrera acotada y finita, pase visual con vuelo/recepción sin teletransporte, tackle sin `dive`, árbitro y asistentes, tiro, parada con `dive` exclusivo del portero, secuencia de saque de puerta (fases, balón inmóvil antes del impacto, lanzamiento sincronizado, 0 rivales dentro del área y rival más cercano a más de 12,5 m), córner con formación y centro al área, falta con barrera a 9,15 m, penalti con el área despejada y tiro real, descanso en secuencia con espejado de asistentes, despedida final, tarjeta roja con gesto visible del árbitro y falta lejana posterior a la tarjeta, replay, reset y destroy. También verifica el marcador diferido (el HUD no se adelanta al gol pendiente y confirma al cruzar la línea), la etiqueta y la física visual del clima, y las guardas del puente UI→3D (`[local, visitante]`, `toss`, franja de clima). Una página aparte fuerza el resultado del cara o cruz y recorre llamada, temporizador visible, pros/contras, contexto de rival/clima/fatiga, elección de campo, cierre del panel y saque; otra deja ganar al rival y comprueba que su decisión (pelota) y su motivo se explican y se aplican sin tocar el saque. El test comprueba que el árbitro termina sin gesto congelado. Además monta una página sin `P3D_ASSET_PACK` para validar el fallback procedural, incluida la barrida de campo, y otra sin WebGL para validar el retorno al campo 2D y que `pass`/`tackle` no generan eventos fantasma. Una página nueva carga `bolas.js` + `pitch.js` de verdad (con un stub de `tr`) y valida la ceremonia 2D: túnel, fila con capitán al frente, saludo, datos del sorteo, temporizador de 10 s en la llamada, moneda animada visible y girando, victoria del jugador, espera de 20 s, pros/contras, elección de campo, `P.flip`, cierre y saque. Otra página monta 3D y 2D reales, cambia a 2D en plena salida y comprueba que el túnel, el sorteo y el audio continúan en vez de saltarse la ceremonia. El 3D del sorteo se monta con el motor de audio real para verificar que alimenta `PitchAudio`. Son **71 comprobaciones**.

Requiere Node y Playwright (o `playwright-core`) con Chrome/Chromium. Si no está instalado:

```powershell
cd tools
npm install --no-save --no-package-lock playwright
npx playwright install chromium
```

Después, desde la raíz del proyecto:

```powershell
$env:NODE_PATH="ruta\a\node_modules"
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
node test/pitch3d.js
```

En CI se instala Playwright y Chromium y se ejecuta el mismo archivo. El test falla si hay errores de página, errores de WebGL o comprobaciones incumplidas.

### Prueba manual del juego completo

1. Compila con `py -3 build.py` (en Windows, `PYTHONUTF8=1`).
2. Abre `dist/index.html?pitch3d=1` y entra en un partido en directo.
3. Comprueba la salida del túnel, el sorteo con temporizador, el toggle 2D/3D, pausa, velocidad, descanso, final y repetición.
4. Repite en un Android real y en un dispositivo sin WebGL para validar el fallback.

## Límites conocidos

- Las animaciones son clips cortos generados para el proyecto; no hay captura de movimiento ni retargeting externo. La tarjeta reutiliza `celebrate` para el gesto de brazos y añade una tarjeta procedural amarilla o roja.
- Las acciones de tiro, parada y gol son representaciones aproximadas basadas en eventos; no reproducen la física exacta de cada jugada.
- La iluminación sigue siendo plana por triángulo, pero el especular ya usa rugosidad y metalicidad de los materiales GLB (modelo GGX/Fresnel simplificado). No hay texturas PBR, mapas de oclusión ambiental ni sombras proyectadas.
- La repetición es visual (historial de posiciones del render), no una repetición sincronizada de los eventos de `match41`.
- La grada es estática (quads de cuerpo y cabeza); no hay multitud animada, nombres, dorsales ni celebraciones personalizadas.
- Los props de estadio (portería, banderín, valla, banquillo y barrera) se integran en el campo estático cuando sus GLB están disponibles; si faltan, se conserva la geometría procedural anterior.
- El balón GLB se dibuja a escala 2 respecto a su tamaño real para mantener la legibilidad del balón anterior; la física del partido no cambia.
- El rendimiento en Android WebView, dispositivos de gama baja y navegadores sin WebGL sigue pendiente de validación real; el HUD de FPS existe para medirlo.
- La cámara es de retransmisión y puede recortar parte del campo durante las jugadas; se prioriza la acción y el balón.

## Contrato de assets

El contrato vigente está en `assets/manifest.json`:

- Y arriba, metros, origen del jugador entre los pies a nivel del suelo y frente hacia +Z.
- Esqueleto humanoide de 22 huesos, compartido por hombre, mujer y portero.
- Clips `idle`, `run`, `kick`, `dive` y `celebrate`; la tarjeta reutiliza `celebrate`.
- LOD1/LOD2 para jugadores y LOD1 para el balón. Los LOD0 del manifiesto no se incrustan en el juego para no aumentar el HTML.
- Materiales con nombres estables (`kit_shirt`, `kit_shorts`, `kit_socks`, `kit_trim`, `skin`, `hair`, `boots`, `gloves`) y colores por vértice; sin texturas de imagen.
- GLB 2.0 binario, sin dependencias de runtime. El parser debe ser pequeño, testeado y opcional: si no carga, el partido sigue con mallas procedurales.
- El pack se genera en `build.py` y se incrusta como base64; nunca se usa `fetch` en runtime.

## Compilación

`build.py` incluye `src/pitch3d-assets.js`, `src/pitch3d.js` y los GLB de `assets/` en el HTML empaquetado (`dist/index.html`, `dist/index-noads.html` y `dist/camino.html`). Los GLB se convierten a base64 dentro de `P3D_ASSET_PACK`; no se copian como archivos sueltos ni se solicitan por red. El directorio `dist/` está ignorado por Git y se regenera en cada build.
