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
3. **Animación procedural**: carrera, tiro, celebración, tarjeta y estirada del portero.
4. **Balón y jugadas**: estados `dead`, `held`, `flight` y `loose`; pases, tiros, paradas, postes y saques.
5. **Cámara**: seguimiento suave del balón, acercamiento en jugadas y encuadre de celebración.
6. **WebGL 1**: shaders propios, un VBO estático para el campo y un VBO dinámico reutilizado para jugadores y balón.
7. **Adaptador `Pitch`**: conserva la API del campo 2D y permite alternar 2D/3D sin reiniciar el directo.

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
- Los jugadores son mallas humanoides procedurales de baja poligonización. La distancia reduce segmentos y detalles (LOD aproximado).
- Calidad adaptativa: si los FPS bajan, se reducen detalles y sombras; si se recuperan, vuelven gradualmente.
- `devicePixelRatio` se limita a 1.5 para no disparar el coste en móviles de alta densidad.
- El render se pausa cuando la pestaña queda oculta y respeta `prefers-reduced-motion` para la sacudida de cámara.
- Las matrices de cámara, los uniformes y los buffers se reutilizan para evitar asignaciones por frame.

## Pruebas

### Prueba aislada del 3D

`test/pitch3d.js` monta `src/pitch3d.js` en una página mínima con un stub de `Pitch`, sin depender de toda la interfaz. Comprueba WebGL, roster, saque inicial, posesión, tiro, parada, descanso, tarjeta roja, replay, reset, final y destroy.

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

- Los modelos son procedurales y no usan todavía un esqueleto glTF, animaciones capturadas ni retargeting. El pipeline de modelos y assets se desarrolla por separado y se integrará con un contrato de carga documentado.
- Las acciones de tiro, parada y gol son representaciones aproximadas basadas en eventos; no reproducen la física exacta de cada jugada.
- La repetición es visual (historial de posiciones del render), no una repetición sincronizada de los eventos de `match41`.
- No hay nombres, dorsales, celebraciones personalizadas ni multitud animada.
- El rendimiento en Android WebView, dispositivos de gama baja y navegadores sin WebGL sigue pendiente de validación real; el HUD de FPS existe para medirlo.
- La cámara es de retransmisión y puede recortar parte del campo durante las jugadas; se prioriza la acción y el balón.

## Contrato para futuros assets

Cuando se integren modelos glTF/GLB se mantendrá el renderer sin dependencias de runtime y se conservarán estas reglas:

- Y arriba, metros, origen en los pies, frente hacia +Z.
- Nombres de huesos humanoides estables y compatibles entre jugador y jugadora.
- Materiales de camiseta, pantalón, piel y pelo separados para poder recolorear local/visitante/portero.
- LOD0/LOD1/LOD2 con presupuestos móviles y una textura atlas pequeña o colores por vértice.
- Clips `idle`, `run`, `kick`, `dive`, `celebrate` y `card`, con el mismo rig para hombre y mujer.
- Carga y render sin frameworks externos; si el formato final requiere un decodificador, debe ser pequeño, testeado y opcional.

## Compilación

`build.py` incluye `src/pitch3d.js` en el HTML empaquetado (`dist/index.html` y `dist/index-noads.html`). El directorio `dist/` está ignorado por Git y se regenera en cada build.
