# Sistema de animación detallado para el partido 3D

Documento de diseño técnico para las cuatro áreas críticas de animación del motor visual 3D.  
El partido sigue siendo autoritativo en `match41.js`; este sistema es solo representación visual.

> **Implementación actual (prototipo):** los clips GLB existentes (`idle`, `run`, `kick`, `dive`, `celebrate`) cubren la base y las acciones principales. Pases, robos, tiros, paradas y las secuencias de vestuario, saludos y cara o cruz se resuelven con animaciones procedurales que reutilizan esos clips, sin depender de nuevos GLB. El cross-fade implementado es de **0,18 s**. Las tablas siguientes describen el catálogo objetivo para una fase posterior con captura de movimiento y clips dedicados.

## 1. Arquitectura común

### Capas

| Capa | Prioridad | Contenido |
|---|---:|---|
| Base | 0 | Idle, run, sprint, backpedal, strafe |
| Action | 1 | Tackle, pass, shot, save, header |
| Additive | 2 | Orientación de cadera, mirada, preparación de brazos |
| IK | 3 | Pies, manos, torso, cabeza |
| Reaction | 4 | Tropezones, caídas, frustración |

### Eventos

- `OnActionStart`
- `OnWindupComplete`
- `OnBallContact`
- `OnTackleContact`
- `OnSaveContact`
- `OnIKEngage`
- `OnIKRelease`
- `OnRootMotionStart` / `OnRootMotionEnd`
- `OnRecoveryStart`
- `OnActionEnd`
- `OnCancelWindow`

### Reglas generales

- Los tiros, pases y paradas estándar usan **in-place**.
- Las acciones acrobáticas, segadas y paradas de portero usan **root motion**.
- El contacto con el balón ocurre siempre en `OnBallContact`, nunca por posición implícita.
- La cancelación solo es válida antes de `OnWindupComplete`.

---

## 2. Robos y disputas físicas

### Catálogo

| Clip | Duración | Contacto | Uso |
|---|---:|---:|---|
| `TACKLE_STAND_BLOCK` | 0.60 s | 0.24 s | Pisotón/bloqueo |
| `TACKLE_STAND_POKE_DOM` | 0.50 s | 0.18 s | Metida dominante |
| `TACKLE_STAND_POKE_WEAK` | 0.55 s | 0.20 s | Metida no dominante |
| `TACKLE_STAND_SHOULDER_L/R` | 0.70 s | 0.28 s | Choque de hombro |
| `TACKLE_SLIDE_FRONT_CLEAN` | 1.10 s | 0.36 s | Segada frontal limpia |
| `TACKLE_SLIDE_FRONT_FOUL` | 1.25 s | 0.33 s | Segada frontal con falta |
| `TACKLE_SLIDE_SIDE_CLEAN` | 1.00 s | 0.30 s | Segada lateral limpia |
| `TACKLE_SLIDE_SIDE_FOUL` | 1.15 s | 0.28 s | Segada lateral con falta |
| `TACKLE_SLIDE_REAR_CLEAN` | 1.15 s | 0.38 s | Segada por detrás limpia |
| `TACKLE_SLIDE_REAR_FOUL` | 1.30 s | 0.35 s | Segada por detrás con falta |
| `REACT_STUMBLE_RECOVER` | 0.70 s | — | Tropezón con recuperación |
| `REACT_LOSE_BALANCE` | 0.90 s | — | Pérdida de equilibrio |
| `REACT_FALL_CLEAN` | 1.20 s | — | Caída limpia |
| `REACT_SPIN_FRUSTRATED` | 0.80 s | — | Giro frustrado |
| `REACT_SHOULDER_BUMP` | 0.60 s | — | Reacción a choque |

### IK y resolución

- Pie de apoyo clavado al suelo.
- Pie de entrada ajustado a la altura del balón (`0.0–0.25 m`).
- Torso inclinado hasta `25°`.
- Robo si el balón está a menos de `0.45 m` y el ángulo de entrada es menor de `60°`.
- Falta si el rival está a menos de `0.35 m` y el ángulo es mayor de `90°`.

---

## 3. Pases y distribución

### Catálogo

| Clip | Duración | Contacto | Uso |
|---|---:|---:|---|
| `PASS_SHORT_INSIDE_DOM` | 0.55 s | 0.22 s | Pase corto dominante |
| `PASS_SHORT_INSIDE_WEAK` | 0.60 s | 0.24 s | Pase corto no dominante |
| `PASS_ONE_TOUCH` | 0.35 s | 0.12 s | Pase de primera |
| `PASS_BACKHEEL` | 0.50 s | 0.20 s | Espuela/tacón |
| `PASS_CHIP_SHORT` | 0.65 s | 0.25 s | Pase picado corto |
| `PASS_LONG_DRIVE` | 0.85 s | 0.30 s | Desplazamiento largo |
| `PASS_CROSS_FLOAT` | 0.90 s | 0.32 s | Centro bombeado |
| `PASS_CROSS_LOW` | 0.75 s | 0.28 s | Centro raso |
| `PASS_CROSS_CURL` | 0.95 s | 0.34 s | Centro con rosca |
| `PASS_FALLING` | 0.70 s | 0.24 s | Pase mientras se cae |
| `PASS_OFF_BALANCE` | 0.60 s | 0.22 s | Pase en desequilibrio |
| `PASS_CANCEL_RECOVER` | 0.25 s | — | Recuperación tras cancelación |

### Blend y targeting

- Blend 1D por potencia: corto → picado → largo → rosca.
- Blend 2D por potencia × ángulo del cuerpo.
- Orientación procedural:
  - planta del pie hacia el objetivo
  - cadera hasta `±45°`
  - columna hasta `±20°`
  - mirada al receptor
- Cancelación válida hasta `OnWindupComplete`.

---

## 4. Remates y chutes

### Catálogo

| Clip | Duración | Contacto | Root motion | Uso |
|---|---:|---:|---|---|
| `SHOT_DRIVE` | 0.90 s | 0.42 s | No | Tiro potente de empeine |
| `SHOT_FINESSE` | 1.00 s | 0.45 s | No | Tiro con rosca |
| `SHOT_MISKICK` | 0.95 s | 0.40 s | No | Tiro mordido |
| `SHOT_VOLLEY` | 1.10 s | 0.38 s | 0.80 m | Volea frontal |
| `SHOT_HALF_VOLLEY` | 1.00 s | 0.35 s | 0.60 m | Semivolea |
| `SHOT_BICYCLE` | 1.60 s | 0.62 s | Vertical + horizontal | Chilena/tijera |
| `HEADER_STANDING` | 0.80 s | 0.30 s | No | Cabezazo estático |
| `HEADER_DIVING` | 1.00 s | 0.35 s | 1.00 m | Cabezazo en plancha |
| `HEADER_GLANCE` | 0.75 s | 0.28 s | No | Cabezazo de control |

### Biomecánica

- El impulso al balón se aplica solo en `OnBallContact`.
- El pie debe estar a menos de `0.15 m` del centro del balón.
- Transferencia de peso: pie de apoyo, cadera abierta, torso inclinado hasta `30°`, brazo contrario elevado.
- IK de pie de apoyo, pie de golpeo y cabeza en cabezazos.

---

## 5. Porteros y paradas

### Catálogo

| Clip | Duración | Contacto | Uso |
|---|---:|---:|---|
| `GK_SAVE_LOW_DIVE_LEFT/RIGHT` | 1.00 s | 0.32 s | Estirada baja lateral |
| `GK_SAVE_LOW_BLOCK` | 0.80 s | 0.24 s | Bloqueo bajo |
| `GK_SAVE_MID_PARRY_LEFT/RIGHT` | 0.85 s | 0.28 s | Parada media |
| `GK_SAVE_MID_PUNCH` | 0.75 s | 0.26 s | Despeje de puños |
| `GK_SAVE_HIGH_TOP_LEFT/RIGHT` | 1.10 s | 0.35 s | Palomita al ángulo |
| `GK_SAVE_HIGH_CATCH` | 0.95 s | 0.30 s | Atrapada alta |
| `GK_SAVE_KBLOCK` | 0.70 s | 0.22 s | Achique 1 contra 1 |
| `GK_SAVE_SPREAD_EAGLE` | 0.85 s | 0.28 s | Tapado con cuerpo |
| `GK_SAVE_SLIDE_FEET` | 1.00 s | 0.35 s | Barrida a pies |
| `GK_POPUP_FAST` | 0.45 s | — | Levantarse rápido |
| `GK_SECOND_SAVE` | 0.60 s | — | Segunda parada a bocajarro |

### Selección por vector del tiro

| Condición | Animación |
|---|---|
| Elevación < 0.5 m y velocidad < 12 m/s | `GK_SAVE_LOW_BLOCK` |
| Elevación < 0.5 m y velocidad >= 12 m/s | `GK_SAVE_LOW_DIVE_*` |
| Elevación 0.5–1.5 m | `GK_SAVE_MID_PARRY_*` |
| Elevación > 1.5 m | `GK_SAVE_HIGH_TOP_*` |
| Delantero a menos de 5 m | `GK_SAVE_KBLOCK` o `GK_SAVE_SPREAD_EAGLE` |
| Balón a menos de 2 m | `GK_SAVE_SLIDE_FEET` |

### IK de manos

- Predicción 0.15 s antes del contacto.
- Engage de IK hacia el punto de intersección.
- Límite de desplazamiento: `0.35 m`.
- Límite de rotación de muñeca: `45°`.

---

## 6. Secuencias de vestuario, saludos y cara o cruz

`sim.cinema` es un reloj independiente de la simulación autoritativa. Mientras está activo, `pitch3d.js` no ejecuta la IA de partido: mueve a los actores hacia posiciones de puesta en escena y actualiza sus animaciones.

### Guion procedural

| Secuencia | Fases | Duración base |
|---|---|---:|
| Entrada | `walkout` 4,2 s → `greet` 2,6 s → `coinCall` (espera máx. 9 s) → `coinFlip` 1,15 s → `coinResult` 1,25 s → elección → `lineup` 1,5 s | variable |
| Descanso | `off` 2,7 s → `switch` 0,85 s → `enter` 2,7 s → `greetHalf` 1,35 s | 7,6 s |
| Final | `whistle` 1,15 s → `line` 3,4 s → `walkoff` 2,8 s | 7,35 s |

Los tiempos se escalan con la velocidad del directo. Las cámaras de túnel, círculo central y línea final usan posiciones propias y no interfieren con la cámara de juego.

### Saludos y gestos

- **Salida**: cada equipo avanza en una sola fila, con el capitán (`slot 9`) al frente; el resto conserva su orden detrás en el mismo carril. La fila se detiene escalonada y solo se abre a las posiciones después del sorteo.
- **Capitanes**: se aproximan al centro, se orientan y extienden el brazo con `anim: greet, hand: true`; el árbitro acompaña el gesto. Si aún están caminando, el clip de locomoción (`run`) manda sobre el gesto para no deslizarse.
- **Equipos**: el resto de actores encadena saludos con un desfase de 0,45 s para evitar que todos levanten el brazo a la vez. Un saludo sin mano no se representa como celebración.
- **Final**: los equipos forman dos líneas enfrentadas y encadenan los saludos antes de caminar al túnel.
- **Sin GLB**: la pose procedural mueve hombro, brazo y mano; con GLB se conserva el clip base (`idle`/`run`) y el gesto queda en la pose procedural.
- **Árbitro**: sus gestos comparten el reloj de `updateAnimations` y caducan; al terminar una secuencia se limpian explícitamente. Nunca queda congelado en `celebrate`.
- La animación de saludo es cosmética: no crea contacto físico, faltas ni eventos de partido.

### Cara o cruz

- La moneda es geometría procedural (dos caras y canto) y gira durante 1,15 s.
- El panel DOM solo aparece en la vista 3D y ofrece `Cara`/`Cruz` y después `Campo`/`Pelota`.
- **Campo** invierte el lado de ataque visual; **Pelota** mantiene el saque que ya fijó `match41.js`.
- La posesión autoritativa no se toca: el 3D captura el primer `state.own` y lo usa al cerrar la entrada.
- Si gana el rival, elige campo automáticamente. Si el jugador no responde, el árbitro llama y elige por él.
- `busy()` añade 620 ms mientras hay cine para que la UI no pida el siguiente minuto. `freeze()` se difiere hasta el final de la secuencia.

---

## 7. Integración con el motor actual

- `Pitch3D` ya soporta `anim` por actor, `runPhase`, `facing`, `lean` y `bank`.
- Los eventos de partido (`goal`, `save`, `miss`, etc.) generan representación visual.
- La sincronización se hace con `OnBallContact`, alineado con `launchBall` y `launchGoalKickBall`.
- El IK se aplica sobre la malla ya deformada, sin alterar el estado de `match41.js`.
- **Implementado:** `pass` y `tackle` llegan desde `engine-extra.js` como eventos visuales; el adaptador los bloquea en 2D. `startVisualPass` elige receptor, calcula tipo/arco/duración/enrosque, limita la curva al campo y usa `pendingPass` si la posesión aún no coincide. Los reinicios fijan también el punto de recepción; `changePossession` cancela vuelos y ejecuta el pase pendiente.
- **Implementado:** la recepción solo entrega el balón si el receptor está a menos de 1,75 m; si no, queda suelto y lo persigue. Los tiros que llegan durante un pase se encolan hasta que el balón aterriza.
- **Implementado:** cross-fade de 0,18 s entre clips en `evalModel`; el clip anterior se evalúa en un segundo buffer y se interpola con smoothstep.
- **Implementado:** paradas con `dive` exclusivamente para porteros; los robos de campo usan `kick` y una pose de barrida propia, nunca `dive`. Pases y tiros usan `kick`. La pose procedural de reserva mantiene las mismas acciones sin GLB.
- **Implementado:** entrada, descanso y despedida con `sim.cinema`, saludos procedurales, moneda 3D y panel de cara o cruz. `Pitch3D.cinema()` y `Pitch3D.skipCinema()` permiten observar o completar la secuencia sin tocar `match41.js`.

---

## 8. Rendimiento

1. Activar IK solo en los 2–4 jugadores más cercanos al balón.
2. Usar LOD de animación: lejos solo Base + Action simplificada; cerca todas las capas.
3. Reutilizar eventos y objetos de animación.
4. Compartir clips entre variantes.
5. Limitar transiciones a `0.18 s` como máximo (valor actual del prototipo).
6. Precomputar root motion en los clips.
7. No evaluar huesos no usados en la acción actual.
