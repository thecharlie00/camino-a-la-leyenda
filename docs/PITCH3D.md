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
4. **Balón y jugadas**: estados `dead`, `held`, `flight` y `loose`; pases visuales en juego abierto, tiros con enrosque, paradas, postes y saques. El saque de puerta usa una secuencia de presentación con impacto sincronizado.
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

`ui.js` envía al 3D la posesión, la posición narrativa del balón (`bx`), la velocidad, la mentalidad, las tácticas del equipo local, el clima (`wx`), el marcador (`score`) y el minuto (`min`). Los eventos (`goal`, `save`, `post`, `miss`, `half`, `end`, tarjetas, `pass`, `tackle`, etc.) solo generan la representación visual; el marcador y las estadísticas los actualiza el motor del partido. `pass`/`tackle` se descartan en el adaptador cuando no hay 3D montado.

### Autoridad y sincronización

- `state.bx` siempre se interpreta desde la perspectiva del equipo local. El 3D aplica el lado de ataque (`sim.attack`) y lo espeja al descanso.
- `bx` es una posición física continua: al perder la posesión el balón se queda donde estaba y solo cambia el equipo que ataca. Los saques de centro, de puerta, de banda y los córners son las únicas reanudaciones que lo colocan en una posición fija.
- La salida por la línea de fondo se resuelve por el último toque: saque de puerta para el equipo que defiende esa portería si el balón lo sacó el atacante, y córner para el atacante si lo desvió el defensor.
- El adaptador no lanza pases de reconciliación de un campo a otro: si el portador está lejos del objetivo, corre hacia él. Un cambio de posesión suelta el balón en su sitio y el nuevo equipo lo persigue.
- Los jugadores se identifican por `id` estable, no por identidad de objeto: `ui.js` recrea la lista cada minuto y el 3D reutiliza sus actores.
- Si llega un evento mientras hay una acción en curso, se encola. La UI puede esperar con `Pitch.busy()`.
- Al descanso se intercambian lados, se reinicia el saque y se conserva el roster.
- Al final se congela la simulación visual, pero la cámara y el render siguen activos.
- `Pitch.reset()` conserva el roster y recoloca el partido para el reinicio de la simulación.

### Entrada, descanso y despedida

La puesta en escena es una capa puramente visual dentro de `sim.cinema`. No cambia `conv`, `bigR`, `xgPerGoal`, el marcador, el minuto ni la posesión de `match41.js`. `ui.js` deja de pedir minutos mientras hay una secuencia y las sondea con `Pitch.cinema()` y `Pitch.busy()`.

```text
Inicio:    walkout → greet → coinCall → coinFlip → coinResult
           → choose / rivalChoice → choiceResult → lineup
Descanso:  off → switch → enter → greetHalf
Final:     whistle → line → walkoff
```

- **Inicio**: cada equipo sale del túnel en **una sola fila**, con el capitán al frente y el resto detrás en su carril; la fila avanza junta hasta el borde del círculo central y solo entonces se abre a las posiciones. Los capitanes y el árbitro se saludan y se juega el cara o cruz. La secuencia solo se reproduce en el arranque real del directo (`cinematics: !L.min`); al volver a 3D con el partido ya empezado no se repite.
- **Descanso**: los jugadores abandonan el campo hacia el túnel, se intercambian lados y vuelven a entrar; capitanes y árbitro repiten el saludo antes de reanudar. Si el directo estaba pausado, la secuencia se ve igual y el 3D queda congelado al terminar hasta que el usuario reanude.
- **Final**: el árbitro pita, los equipos forman una línea, se saludan y caminan hacia el vestuario. `sim.ended` queda activo desde el principio, pero el bucle sigue animando mientras haya cine; después se ocultan jugadores y balón y la simulación visual queda congelada.
- **Cámara**: el túnel, el círculo central y la línea final tienen encuadres propios. Las transiciones suavizan posición, altura y objetivo; no modifican la cámara normal del partido.
- **Fallback**: sin GLB se usan las poses procedurales; sin WebGL se conserva el campo 2D y el adaptador no crea secuencias.

Para depuración, `Pitch3D.cinema()` devuelve `{type, stage, t, stageT, coin}` o `null`, y `Pitch3D.skipCinema()` completa la secuencia actual. El adaptador `Pitch` expone ambos métodos.

### Cara o cruz

El sorteo se dibuja como un panel DOM sobre el canvas 3D, con botones `data-p3d-coin` y `data-p3d-choice`. La moneda y el lanzamiento son geometría procedural; no se descarga ningún asset nuevo.

- **Llamada**: el jugador elige `cara` o `cruz`; si no responde en 9 s de partido, el árbitro llama por él.
- **Resultado**: la moneda gira 1,15 s, se resuelve y se anuncia el ganador.
- **Elección**: si gana el jugador, elige **campo** o **pelota**. **Campo** invierte el lado de ataque visual del 3D; **pelota** mantiene el saque que ya indicó `match41.js`. Si gana el rival, elige campo y el 3D invierte el lado.
- La decisión no cambia la posesión autoritativa: el saque inicial sigue viniendo del primer `state.own`. El descanso vuelve a invertir los lados.
- El panel es exclusivo de la vista 3D; el campo 2D y el APK sin WebGL siguen funcionando sin sorteo y sin tocar el resultado.

### Saque de puerta

El saque de puerta ya no es un pase instantáneo tras una espera fija. `pitch3d.js` representa una secuencia de presentación de **5,76 s de partido** (comprimida por la velocidad del directo), sin tocar el resultado ni el estado de `match41`:

```text
prepare → scan → shield → windup → plant → impact → follow → recover
 1,35     0,80    1,00      0,90     0,16     0,10     0,75     0,70
```

- **prepare**: el portero sale de su área, llega al balón y lo coloca. El balón permanece `dead` en el punto de saque.
- **scan**: otea ambas bandas; la orientación del cuerpo barre a izquierda y derecha.
- **shield**: el rival más cercano presiona y el portero protege el balón con el cuerpo. El atacante se detiene fuera del radio de choque; no hay solapamientos.
- **windup**: retrocede mirando al balón y arranca la carrera de golpeo.
- **plant / impact**: la pose de golpeo llega al contacto y **solo entonces** se llama a `launchBall`; no hay un temporizador paralelo. La marca de impacto y el lanzamiento quedan registrados en `sim.lastGoalKick`.
- **follow / recover**: acompañamiento, vuelta a la posición y fin de la acción. `busy()` cubre la secuencia completa y, si el envío es largo, también la recepción.

La secuencia elige dos opciones reales (apoyo corto y salida larga), mueve a los receptores a sus zonas y conserva la continuidad física del balón. Si no hay GLB, la pose procedural dispone de brazos de portero y pierna de golpeo; los actores con GLB reutilizan `idle`, `run` y `kick`. La IA se pausa durante la coreografía y se reanuda al terminar, salvo que el evento autoritativo haya cambiado la posesión.

Para depuración, `Pitch3D.debug().goalkick` expone la fase activa, el registro de fases, `impactAt`, `launchT`, si se lanzó y el receptor. Tras finalizar, se conserva el resumen en `sim.lastGoalKick`.

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
- **Clima**: `ui.js` transmite `wx` desde el motor. El 3D tiñe cielo y niebla, ajusta la distancia de niebla y dibuja lluvia o nieve procedimental. Con `prefers-reduced-motion` o calidad baja se reduce o se omite.
- **Marcador**: `ui.js` transmite `score` y `min`; el 3D muestra un marcador compacto sobre el canvas con los colores de cada equipo. Sigue siendo un reflejo del motor, nunca una fuente de verdad.
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

### Prueba aislada del 3D

`test/pitch3d.js` monta `src/pitch3d.js` en una página mínima con un stub de `Pitch`, sin depender de toda la interfaz. Comprueba WebGL, roster, carga y skinning de los GLB, balón GLB, ausencia de NaN o triángulos desgarrados, entrada desde el túnel en fila con el capitán al frente, saque inicial, posesión, inclinación de carrera acotada y finita, pase visual con vuelo/recepción sin teletransporte, tackle sin `dive`, árbitro y asistentes, tiro, parada con `dive` exclusivo del portero, secuencia de saque de puerta (fases, balón inmóvil antes del impacto y lanzamiento sincronizado), descanso en secuencia con espejado de asistentes, despedida final, tarjeta roja, replay, reset, marcador, clima y destroy. Una página aparte fuerza el resultado del cara o cruz y recorre llamada, elección de campo, cierre del panel y saque, y comprueba que el árbitro termina sin gesto congelado. También monta una página sin `P3D_ASSET_PACK` para validar el fallback procedural, incluida la barrida de campo, y otra sin WebGL para validar el retorno al campo 2D y que `pass`/`tackle` no generan eventos fantasma. Son 44 comprobaciones.

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
3. Comprueba el toggle 2D/3D, pausa, velocidad, descanso, final y repetición.
4. Repite en un Android real y en un dispositivo sin WebGL para validar el fallback.

## Límites conocidos

- Las animaciones son clips cortos generados para el proyecto; no hay captura de movimiento ni retargeting externo. La tarjeta reutiliza la pose de `idle`.
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
- Clips `idle`, `run`, `kick`, `dive` y `celebrate`; la tarjeta reutiliza `idle`.
- LOD1/LOD2 para jugadores y LOD1 para el balón. Los LOD0 del manifiesto no se incrustan en el juego para no aumentar el HTML.
- Materiales con nombres estables (`kit_shirt`, `kit_shorts`, `kit_socks`, `kit_trim`, `skin`, `hair`, `boots`, `gloves`) y colores por vértice; sin texturas de imagen.
- GLB 2.0 binario, sin dependencias de runtime. El parser debe ser pequeño, testeado y opcional: si no carga, el partido sigue con mallas procedurales.
- El pack se genera en `build.py` y se incrusta como base64; nunca se usa `fetch` en runtime.

## Compilación

`build.py` incluye `src/pitch3d-assets.js`, `src/pitch3d.js` y los GLB de `assets/` en el HTML empaquetado (`dist/index.html`, `dist/index-noads.html` y `dist/camino.html`). Los GLB se convierten a base64 dentro de `P3D_ASSET_PACK`; no se copian como archivos sueltos ni se solicitan por red. El directorio `dist/` está ignorado por Git y se regenera en cada build.
