# Motor de partido en directo (versión 4.1)

Este documento describe cómo funciona la simulación de los partidos en directo del modo míster y «Crea tu club». El código está en `src/engine-extra.js` (el bucle original), `src/match41.js` (modelo de tiros, duelos, cansancio, momentum, zonas, clima y estados) y `src/ui-41.js` (lo que se ve en pantalla).

## Bucle

- **Tick:** un minuto de partido equivale a una llamada a `liveStep()`.
- **Ritmo:** la interfaz llama al tick con un temporizador según la velocidad (⏸ ▶ ▶▶ ▶▶▶).
- **Simular lo que queda:** `liveSimRest()` encadena ticks hasta el final.
- **Envoltorio de `match41.js`:**
  - **Antes de cada tick:** ajusta las tasas de ocasión con el momentum y el cansancio (`liveLambdas`, `liveRating`).
  - **Después de cada tick:** actualiza la resistencia, las zonas, el momentum y el estado.
- **Ritmo de ocasiones:** sigue siendo el del modelo de Poisson del juego (`mLambdas`). Las fórmulas nuevas están centradas para no cambiar la media de goles, solo quién y cómo genera el peligro.

## Estados (FSM)

Los estados posibles son `KICKOFF`, `OPEN_PLAY`, `SET_PIECE`, `HALF_TIME` y `FULL_TIME`.

| Estado | Cuándo se activa |
|---|---|
| `KICKOFF` | Después de un gol y al volver del descanso |
| `SET_PIECE` | En faltas con tarjeta |
| `HALF_TIME` | Al llegar al minuto 45 |
| `FULL_TIME` | En el pitido final |
| `OPEN_PLAY` | En el resto de minutos |

## Rejilla espacial

- **Forma:** 6 columnas (de tu portería a la rival) × 3 carriles = 18 zonas.
- **Cada minuto:** se suma 1 a la zona donde está el balón. La columna sale de `L.bx` y el carril depende de la amplitud táctica.
- **Cada tiro:** suma también en su zona.

## Duelo atacante contra defensor

```
resolveAction(att, def, ctx) = sigmoide((att − def) / 7 + ctx + N(0; 0,35))
```

- **`att` y `def`:** niveles relativos a la media del equipo (0 = media), así que la fuerza global del equipo no se cuenta dos veces.
- **`ctx`:** mentalidad (Encerrarse −0,25 … Presión alta +0,15) más momentum / 250.
- **Uso:** decide si un tiro es ocasión clarísima, con probabilidad `0,66 × p`, que da una media ≈ 35 % como antes.

## Goles esperados (xG)

```
z = a + 1,6 · ángulo − 0,11 · distancia − 1,1 · (presión − 0,5) + 0,045 · definición
xG = sigmoide(z)
```

| Variable | Valor |
|---|---|
| `a` en ocasión clarísima | −0,70 |
| `a` en el resto de tiros | −0,57 |
| Distancia en ocasión clarísima | 6 a 13 m |
| Distancia en el resto de tiros | 12 a 30 m |
| Ángulo | Ángulo visible de la portería (7,32 m) |
| Presión (0-1) | Sale de vuestra defensa (calidad relativa menos cansancio) y de la táctica |
| Definición | Media del rematador respecto a su equipo, más una bonificación por posición, menos su cansancio |

- **Calibración:** con estos valores las medias son 0,36 y 0,12, las mismas tasas de gol que el motor anterior. En las pruebas (`test/match41.js`) los goles por tiro salen en torno a 0,21 y los xG acumulados por gol en torno a 1,0.
- **Resultado del tiro:** si un número aleatorio queda por debajo del xG, es gol. El resto se reparte como antes: 49 % parada, 8 % palo y 43 % fuera.

## Cansancio por minuto

```
desgaste = 0,24 × trabajo(posición) × intensidad × clima × (1,2 − resistencia / 250) × ruido(0,85-1,15)
```

| Factor | Valores |
|---|---|
| Trabajo | Laterales y medios 1,1-1,15 · centrales 0,85 · portero 0,3 |
| Intensidad | Encerrarse 0,86 … Presión alta 1,3, más el ritmo y la línea defensiva |
| Clima | Calor 1,16 · lluvia 1,06 · frío 0,95 · resto 1 |

- **Clima:** cada partido tiene un clima fijo que depende de la jornada y de la época del año.
- **Penalización de nivel:** media de `max(0, desgaste acumulado − 8) × 0,07` sobre los que están en el campo.
- **Cambios:** el que entra llega fresco.

## Momentum (−100 a 100)

- **Por minuto:** se multiplica por 0,9.
- **Ocasiones:** suman a favor de quien las tiene: gol +26, parada o palo +6 (u +11 si el xG pasaba de 0,3), tiro fuera +4.
- **Tarjetas:** restan 3.
- **Efecto:** las tasas de ocasión se multiplican por `1 ± momentum / 600`, con un máximo de ±16 %.

## Esquemas de datos

`S.live` (L):

```json
{
  "fi": 3, "min": 57, "gu": 1, "gt": 0, "ment": 2, "form": "4-3-3",
  "xg": [1.34, 0.62], "mom": 18.4, "st": "OPEN_PLAY", "wx": "rain",
  "fit": {"12": 71.5, "15": 80.2}, "fit0": {"12": 92, "15": 95},
  "zn": [3, 5, 8, 9, 6, 2, 4, 7, 10, 8, 5, 3, 2, 4, 6, 7, 3, 1],
  "shots": [7, 4], "on": [3, 2], "big": [2, 1], "poss": [31, 26]
}
```

Evento del comentario (`L.ev[i]`):

```json
{"t": "save", "min": 57, "us": 1, "pid": 15, "xg": 0.41, "zn": 11, "st": "OPEN_PLAY", "txt": "¡Paradón del portero…!"}
```

- **`t`:** `goal`, `save`, `post`, `miss`, `com`, `yellow`, `red`, `inj`, `sub`, `tac`, `half` o `end`.
- **Autor:** `pid` (jugador tuyo) u `ox` (índice del rival).

Al terminar, el partido guarda `f.xg = [nuestro, rival]`.

## Sin pausas de decisión

El partido no se detiene para que el jugador elija tirar, pasar o regatear. Así se decidió en la versión 4.0, y solo se mantienen los minijuegos de penaltis y faltas.

## Campo 2D («las bolitas»)

El código está en `src/pitch.js`. Se simula en metros (105 × 68).

- **Bucle:**
  - **Física:** avanza a paso fijo de 30 por segundo. A velocidad 2x o 3x se parte en subpasos para no perder colisiones.
  - **Dibujo:** se pinta con `requestAnimationFrame` interpolando entre los dos últimos estados, así el movimiento es igual de suave a 60 o a 120 Hz y no depende de los FPS.
- **Destino de cada jugador** (`shape`):
  - posición base de la formación;
  - altura de la línea y anchura según la táctica;
  - desplazamiento hacia el balón;
  - marca al rival más cercano sin romper la línea;
  - límite del fuera de juego;
  - presión de uno a tres jugadores según el bloque.
- **Movimiento** (`move`):
  - **«arrive»:** frena con `v = √(2·a·d)`.
  - **Giro:** la aceleración se limita a lo largo y de lado, con un radio de giro que crece con la velocidad y la masa.
  - **Separación de Reynolds:** cada jugador guarda unos 2,3 m de espacio personal, con peso 1 frente a los compañeros y 0,45 frente a los rivales. El que lleva el balón, el que presiona y las jugadas guionizadas pueden llegar al contacto.
- **Atributos de cada jugador:**
  - **Ritmo:** viene de «fuerza y ritmo» en tus jugadores; en los rivales se estima con la media y la edad.
  - **Agilidad:** depende de la posición, la media y la edad. Afecta a la aceleración, al giro y al alcance para cortar pases.
  - **Resistencia en directo:** baja la velocidad máxima y la aceleración.
  - **Calidad de pase:** los buenos pasadores mandan el balón más rápido.
- **Balón:**
  - curva de Bézier con efecto y tres perfiles: raso, bombeado y disparo;
  - gravedad y rebotes con pérdida de energía;
  - rozamiento al rodar de 3,4 m/s²;
  - frenado en el aire y la red de la portería.
- **Intercepción:** en un pase raso de juego abierto, el rival que queda al alcance (0,95 m + 0,6 m × agilidad) puede tocarlo y desviarlo. La posesión la sigue marcando el motor del partido, así que el balón suelto lo recupera quien manda en ese minuto.

## Balance y auditoría del campo 2D (versión 4.2)

Las fórmulas están en `src/bolas.js`, un módulo sin DOM que usa `pitch.js` y que se prueba en Node (`test/bolas42.js`). La prueba en un partido real es `test/pitch42.js`.

### Matriz de impacto visual, riesgo y recompensa

| Atributo o táctica | Qué se ve en el campo | Contrapartida táctica | Riesgo de QA y cómo se evita |
|---|---|---|---|
| Fuerza y ritmo | El rápido se escapa: en 30 m, un 90 saca unos 8 m a un 40 | Los rápidos se cansan igual; con poca resistencia pierden la punta | Teletransporte: tope de 10,2 m/s para todos, también en el esprint de remate |
| Agilidad | Giros más cerrados y cambios de ritmo | Centrales y veteranos giran peor | Giros bruscos: la aceleración lateral está limitada según velocidad y masa |
| Pase | Cono de error estrecho: con 25 m, 0,7 m de desvío para un 95 y 3 m para un 40; el rival corta menos | Nadie es perfecto: un 99 sigue fallando algo | Pase imposible de cortar: el error nunca es cero y el corte mínimo es del 2 % |
| Entrada | Más alcance para cortar (1,1 m → 1,9 m) y para robar en el uno contra uno | Los delanteros apenas roban | Robo a distancia: alcance máximo 2,1 m |
| Colocación | El defensor reacciona antes (0,29 s → 0,15 s) | El cansancio alarga la reacción | Inmovilidad: la reacción nunca baja de 0,1 s |
| Línea defensiva | Del bloque bajo al alto, la línea sube unos 20 m | Deja espacio a la espalda para los balones largos | Líneas cruzadas: se comprueba que portero, defensa, medio y delantero no se cruzan nunca |
| Presión | Radio de presión de 10 m (encerrarse) a 38 m (presión alta): el rival se queda a 2–3 m del balón en lugar de 13 | Más desgaste por minuto (un 50 % más que encerrarse) | Todos a por el balón: presionan como mucho tres, y la separación abre los montones |
| Cansancio | Bajan la velocidad punta, la aceleración, el pase y la reacción | Hay que hacer cambios | Valores negativos o NaN: el castigo está acotado entre 0 y 1 |

### Fórmulas

**Curva de atributo con rendimientos decrecientes** (r de 1 a 99):

```
c(r) = (σ((r − 62) / 14) − σ(−61/14)) / (σ(37/14) − σ(−61/14))
```

- Pasa de 0 en r = 1 a 1 en r = 99.
- Subir de 60 a 80 da el doble que subir de 80 a 99.

**Cansancio** (st de 0 a 1):

```
fatiga(st) = 1                                si st ≥ 0,9
           = 1 − 0,32 · ((0,9 − st) / 0,9)^1,3  en otro caso
```

**Impacto del atributo:**

```
calculateAttributeImpact(base, r, st) = base · (0,80 + 0,36 · c(r)) · fatiga(st)
```

**Movimiento:**

- vmáx = (2,2 + 6,2 · intensidad) · ritmo · fatiga, con un tope de 10,2 m/s.
- aceleración = acc · (0,6 + 0,4 · fatiga).
- Llegada con v = √(1,5 · a · d).
- Zona de reposo con histéresis: se queda quieto por debajo de 0,3 m y vuelve a moverse por encima de 0,65 m.

**Cono de pase** (ángulo en radianes y peso como fracción de la distancia, ambos acotados a ±2,2σ):

```
σ_ángulo = (0,012 + 0,07 · (1 − c)^1,2 + 0,12 · (1 − fatiga) + 0,025 · presión) · (0,8 + d / 60)
σ_peso   = 0,02 + 0,10 · (1 − c) + 0,15 · (1 − fatiga)
```

**Entrada y colocación:**

- Alcance de corte = 1,0 + 0,9 · c(entrada) + 0,4 · (agilidad − 0,95).
- Robo = (0,95 + 0,7 · c(entrada)) · (0,85 + 0,15 · st).
- Reacción = 0,30 − 0,16 · c(colocación) + 0,1 · (1 − fatiga).
- Probabilidad de corte = 0,3 · (0,75 + 0,5 · c(entrada)) · agilidad · forma · (1,25 − 0,5 · c(pase del rival)).

**Separación:**

- Empuje = (R − d) / R, más un núcleo duro de 1,6 · (1,2 − d) por debajo de 1,2 m.
- El tope crece un 22 % por compañero cercano, hasta el doble.
- Si dos bolitas caen en el mismo punto exacto, cada pareja recibe una dirección fija y opuesta (antes no se separaban nunca).

**Balón rodando:**

- Rozamiento de Coulomb de 3,4 m/s², integrado dentro del paso.
- Se para exactamente en v²/(2·3,4) metros, sin restos de coma flotante y sin depender de los FPS.

### Pruebas automáticas

**`test/bolas42.js` (Node):**

- `test_pitch_boundary_containment`: 66.000 pasos con objetivos absurdos, NaN, infinitos y pasos de tiempo raros.
- `test_separation_force_no_clumping`: 6 bolitas en el mismo punto se separan en 0,6 s; 11 bolitas en 0,8 m, en 1 s.
- `test_ball_friction_and_stop`: frenada con un error inferior al 2 % con pasos de 1/30, 1/60 y 1/120 s.
- Llegada sin temblor, incluso con un objetivo que oscila ±0,2 m.
- Ritmo, tácticas, pase, entrada y colocación.

**`test/pitch42.js` (navegador):**

- En un partido real: ningún NaN y nadie fuera de los límites.
- El error de pase está en rango.
- La presión alta adelanta la línea, acerca al defensor y cansa más.

**Fallos que encontraron estas pruebas y quedaron corregidos:**

- Un jugador colocado fuera del campo seguía fuera si el paso de tiempo era cero.
- Dos bolitas en el mismo punto exacto no se separaban.
- En un montón de 11, el empuje no bastaba para abrirlo.
