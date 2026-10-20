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
3. **Animación y skinning**: lectura de clips GLB, evaluación de la jerarquía de 22 huesos y deformación en CPU con hasta cuatro influencias por vértice.
4. **Balón y jugadas**: estados `dead`, `held`, `flight` y `loose`; pases, tiros, paradas, postes y saques.
5. **Cámara**: seguimiento suave del balón, acercamiento en jugadas y encuadre de celebración.
6. **WebGL 1**: shaders propios, un VBO estático para el campo y un VBO dinámico reutilizado para jugadores y balón.
7. **Adaptador `Pitch`**: conserva la API del campo 2D y permite alternar 2D/3D sin reiniciar el directo.

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

`ui.js` envía al 3D la posesión, la posición narrativa del balón (`bx`), la velocidad, la mentalidad y las tácticas del equipo local. Los eventos (`goal`, `save`, `post`, `miss`, `half`, `end`, tarjetas, etc.) solo generan la representación visual; el marcador y las estadísticas los actualiza el motor del partido.

### Autoridad y sincronización

- `state.bx` siempre se interpreta desde la perspectiva del equipo local. El 3D aplica el lado de ataque (`sim.attack`) y lo espeja al descanso.
- Los jugadores se identifican por `id` estable, no por identidad de objeto: `ui.js` recrea la lista cada minuto y el 3D reutiliza sus actores.
- Si llega un evento mientras hay una acción en curso, se encola. La UI puede esperar con `Pitch.busy()`.
- Al descanso se intercambian lados, se reinicia el saque y se conserva el roster.
- Al final se congela la simulación visual, pero la cámara y el render siguen activos.
- `Pitch.reset()` conserva el roster y recoloca el partido para el reinicio de la simulación.

## Renderizado y rendimiento

- WebGL 1, sin frameworks ni dependencias de runtime.
- Campo, líneas, porterías, vallas, gradas y torres se construyen una vez en un buffer estático.
- Jugadores, sombras de contacto, aro del portador y balón se reconstruyen en un buffer dinámico que se reutiliza; no se crean buffers por frame.
- Los jugadores usan los GLB LOD1/LOD2, con el jugador cercano a LOD1 y el resto a LOD2. Si un modelo no está disponible, se usa la malla procedural de reserva.
- El balón GLB se dibuja con rotación de rodadura derivada de su velocidad; si falta, se usa el balón procedural. La sombra de contacto y el aro del portador siguen siendo geometría propia.
- Calidad adaptativa: si los FPS bajan, se reducen detalles y sombras; si se recuperan, vuelven gradualmente.
- `devicePixelRatio` se limita a 1.5 para no disparar el coste en móviles de alta densidad.
- El render se pausa cuando la pestaña queda oculta y respeta `prefers-reduced-motion` para la sacudida de cámara.
- Las matrices de cámara, los uniformes y los buffers se reutilizan para evitar asignaciones por frame.

## Pruebas

### Prueba aislada del 3D

`test/pitch3d.js` monta `src/pitch3d.js` en una página mínima con un stub de `Pitch`, sin depender de toda la interfaz. Comprueba WebGL, roster, carga y skinning de los GLB, balón GLB, ausencia de NaN o triángulos desgarrados, saque inicial, posesión, tiro, parada, descanso, tarjeta roja, replay, reset, final y destroy. También monta una página sin `P3D_ASSET_PACK` para validar el fallback procedural y otra sin WebGL para validar el retorno al campo 2D.

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
- La repetición es visual (historial de posiciones del render), no una repetición sincronizada de los eventos de `match41`.
- No hay nombres, dorsales, celebraciones personalizadas ni multitud animada.
- Los props de estadio del pack todavía no sustituyen al campo procedural; hacerlo requiere quitar primero las porterías/vallas actuales para no duplicar geometría.
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
