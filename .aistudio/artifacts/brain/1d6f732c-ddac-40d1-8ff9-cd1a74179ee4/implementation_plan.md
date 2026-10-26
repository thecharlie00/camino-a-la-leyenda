# Arquitectura del Motor de Partidos 3D para Móvil ("Road to Legend")

Diseño técnico, modular y optimizado para la transición de simulación 2D a un motor de partidos 3D a 60 FPS estables en Android (gama media/baja), utilizando **Unity como librería nativa (Unity as a Library - UaaL)** con el **Universal Render Pipeline (URP)**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones de arquitectura y dirección técnica confirmadas para la integración:

- **Tecnología de Renderizado 3D**: Unity (C#) empaquetado y exportado como librería `.aar` nativa (Unity as a Library) controlada desde la actividad anfitriona de Android.
- **Dirección Artística y Shading**: Semi-realista estilizado optimizado, combinando proporciones atléticas naturales con shaders URP Lit simplificados (PBR ligero con textura difusa, mapa de normales suave, canal de rugosidad/metálico condensado y rim lighting para visibilidad en vista cenital).
- **Sincronización Lógica vs. Render**: Arquitectura desacoplada basada en **Fixed Tick** determinista (25 ticks/s en la capa lógica) con **interpolación continua de transforms** a 60/90/120 FPS en la capa visual utilizando un buffer circular de snapshots.

---

## 1. Overview & Core Concept

El objetivo es transformar la experiencia de partido en **Road to Legend**, pasando de un visualizador 2D táctico a una retransmisión tridimensional inmersiva, sin perder la ligereza y rapidez de cálculo del simulador de carrera subyacente.

El motor visual 3D actúa como un **cliente de visualización** estricto: la lógica matemática y las decisiones de la IA se calculan con exactitud matemática, mientras que la escena 3D interpreta e interpola estos resultados mediante animaciones cinemáticas, contacto físico de balón creíble y cámaras dinámicas de estilo televisivo.

```
┌────────────────────────────────────────────────────────┐
│      CAPA ANFITRIONA / SIMULACIÓN (Android/Kotlin)      │
│  - Motor de Carrera & Tácticas                         │
│  - Generación de Ticks Lógicos (25 Hz)                 │
│  - Árbitro & Reglas de Juego                           │
└──────────────────────────┬─────────────────────────────┘
                           │ Puente JNI / Memoria Compartida
                           ▼
┌────────────────────────────────────────────────────────┐
│      CAPA VISUAL 3D (Unity as a Library - URP)         │
│  - Ring Buffer de Snapshots (Interpolación a 60 FPS)   │
│  - State Machine & Blend Trees (Playables API)         │
│  - Cámara Dinámica Broadcast (Predictiva amortiguada)  │
│  - Shading Cel-PBR & Render Batching (URP Mobile)      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Pilares de la Arquitectura Técnica

### Pilar 1: Arquitectura del Motor y Sincronización (Fixed Tick + Eventos)

#### Desacoplamiento Simulación / Renderizado
Para evitar micro-stuttering o dependencias del hardware móvil, la lógica de partido se ejecuta en una frecuencia fija e independiente del framerate gráfico:
- **Frecuencia Lógica (Tick Rate)**: $25\text{ Hz}$ ($\Delta t = 40\text{ ms}$). En cada tick se calcula la posición objetivo de los 22 futbolistas, el balón, posesión, colisiones tácticas y eventos (falta, tiro, pase, gol).
- **Frecuencia Visual**: Tasa de refresco nativa de la pantalla ($60\text{ FPS} \rightarrow \Delta t \approx 16.6\text{ ms}$, o $90/120\text{ Hz}$ según el dispositivo).
- **Técnica de Interpolación**: Buffer circular de estados (Snapshot Interpolation) con un retardo visual constante de $80\text{ ms}$ (2 ticks de buffer).

#### Estructuras de Datos y Snapshot Buffer
```csharp
// Estructura de Snapshot enviada por cada tick lógico
public struct PlayerSnapshot {
    public int playerId;
    public Vector3 position;
    public Quaternion rotation;
    public float velocity;
    public AnimationIntent intent; // Sprint, Idle, Tackle, Shot, Pass
}

public struct BallSnapshot {
    public Vector3 position;
    public Vector3 velocity;
    public bool isControlled;
    public int ownerPlayerId;
}

public struct MatchSnapshot {
    public uint tickIndex;
    public double timestamp;
    public BallSnapshot ball;
    public PlayerSnapshot[] players; // 22 jugadores
    public MatchEvent triggeredEvent;
}
```

#### Código Conceptual: Buffer de Interpolación con Hermite / Lerp
```csharp
using UnityEngine;

public class MatchInterpolator : MonoBehaviour {
    private const int BUFFER_SIZE = 16;
    private MatchSnapshot[] snapshotRingBuffer = new MatchSnapshot[BUFFER_SIZE];
    private int bufferCount = 0;

    [SerializeField] private float interpolationDelay = 0.080f; // 80ms (2 ticks)

    public void OnSnapshotReceived(MatchSnapshot newSnapshot) {
        int index = (int)(newSnapshot.tickIndex % BUFFER_SIZE);
        snapshotRingBuffer[index] = newSnapshot;
        bufferCount = Mathf.Min(bufferCount + 1, BUFFER_SIZE);
    }

    public void EvaluateVisualState(double currentRenderTime, out Vector3 ballPos, out PlayerVisualState[] outPlayers) {
        double targetRenderTime = currentRenderTime - interpolationDelay;

        // Búsqueda de snapshots adyacentes (lhs = anterior, rhs = posterior)
        MatchSnapshot lhs = default, rhs = default;
        FindSurroundingSnapshots(targetRenderTime, out lhs, out rhs);

        float factor = (float)((targetRenderTime - lhs.timestamp) / (rhs.timestamp - lhs.timestamp));
        factor = Mathf.Clamp01(factor);

        // Interpolación cúbica para el balón (evita codos en balones aéreos)
        ballPos = Vector3.Lerp(lhs.ball.position, rhs.ball.position, factor);
        if (!lhs.ball.isControlled && !rhs.ball.isControlled) {
            // Curva parabólica por elevación
            float arc = 4f * factor * (1f - factor) * 0.25f;
            ballPos.y += arc;
        }

        // Interpolación esférica de rotación y lineal de posición para jugadores
        outPlayers = new PlayerVisualState[22];
        for (int i = 0; i < 22; i++) {
            Vector3 pos = Vector3.Lerp(lhs.players[i].position, rhs.players[i].position, factor);
            Quaternion rot = Quaternion.Slerp(lhs.players[i].rotation, rhs.players[i].rotation, factor);
            outPlayers[i] = new PlayerVisualState(pos, rot, lhs.players[i].intent);
        }
    }
}
```

---

### Pilar 2: Modelado de Jugadores 3D y Optimización Mobile

#### Presupuesto de Geometría y Sistema LOD (Level of Detail)
Con 22 futbolistas + 3 árbitros en pantalla simultáneamente en vista cenital/broadcast:

| Nivel | Distancia Cámara | Triángulos / Jugador | Huesos (Bones Rig) | Texturas Asignadas |
|---|---|---|---|---|
| **LOD 0** (Primer plano / Celebraciones) | $< 8\text{ m}$ | $3.500 - 4.500$ | 48 huesos (Dedos simples, cara básica) | $1024 \times 1024$ ASTC 4x4 |
| **LOD 1** (Cámara Broadcast normal) | $8\text{ m} - 25\text{ m}$ | $1.800 - 2.200$ | 28 huesos (Mano completa en 1 hueso) | $512 \times 512$ ASTC 6x6 |
| **LOD 2** (Vista panorámica táctica) | $> 25\text{ m}$ | $800 - 1.000$ | 18 huesos (Esqueleto simplificado) | $256 \times 256$ ASTC 8x8 |

#### Pipeline de Texturizado y Materiales
1. **Compresión de Texturas**: Uso mandatorio de **ASTC** (*Adaptive Scalable Texture Compression*), con bloques $6\times 6$ para difuso/albedo y $8\times 8$ para mapas combinados MRA.
2. **Channel Packing (MRA Mask)**:
   - Canal R: Metallic (detalles en botas y logotipos).
   - Canal G: Roughness (control de brillo en tela de camiseta vs. piel).
   - Canal B: Ambient Occlusion horneado.
   - Canal A: Máscara de color de equipo (Primary/Secondary kit tinting).
3. **Texture Atlasing**: Todas las caras y peinados de una plantilla se empaquetan en un único atlas de $2048 \times 2048$ para reducir las llamadas de dibujado (*Draw Calls*).
4. **Skinned Mesh GPU Instancing**: En URP activamos `GPU Skinning` o `Compute Shader Skinning` para permitir instanciado de futbolistas que compartan kit y malla base.

---

### Pilar 3: Sistema de Animaciones Avanzado

#### Animación en Locomoción: 2D Blend Trees
Para la carrera fluida en cualquier ángulo se utiliza un **Blend Tree Direccional Cartesiano** parametrizado por:
- $V_x$ (Velocidad lateral: Strafe Izquierda / Derecha)
- $V_y$ (Velocidad longitudinal: Retroceso / Trote / Carrera / Sprint)

```
                 Sprint (0, 2.0)
                       ▲
                       │
              Trote (0, 1.0)
                       │
Strafe Izq (-1.0, 0) ──┼── Strafe Der (1.0, 0)
                       │
                 Idle (0, 0)
                       │
               Retroceso (0, -0.8)
```

#### In-Place Animation vs. Root Motion
- **Decisión**: **In-place Animation controlada por el motor de física/interpolación**.
  - *Razón*: El *Root Motion* tiende a desincronizarse fácilmente en arquitecturas guiadas por eventos y servidores de simulación. Con *In-place*, la cápsula se desplaza a la posición exacta dictada por el snapshot lógico y la animación ajusta su velocidad de reproducción (*playback speed matching*) para evitar el deslizamiento de pies (*foot sliding*).
- **Two-Bone Foot IK**: En pendientes ligeras o contactos con el suelo, un *Inverse Kinematics* ligero de 2 articulaciones adapta las plantas de las botas a la superficie del césped.
- **Ball Snapping / Magnetic IK**: Cuando el snapshot lógico emite el evento `BALL_TOUCH`, el hueso del pie activo o del empeine realiza una pequeña corrección por IK en los últimos $60\text{ ms}$ previos al contacto para garantizar impacto visual exacto.

#### Máquina de Estados de Animación (Playables API)
```
          ┌─────────────┐
          │    IDLE     │
          └──────┬──────┘
                 │ (Speed > 0.1)
                 ▼
          ┌─────────────┐   Disparo / Pase   ┌──────────────┐
          │ LOCOMOCION  ├───────────────────►│ ACTION_KICK  │
          │ (BlendTree) │◄───────────────────┤ (Inercial)   │
          └──────┬──────┘   (Anim Finished)  └──────────────┘
                 │
                 │ Tackle / Entrada
                 ▼
          ┌─────────────┐
          │   TACKLE    │
          └─────────────┘
```

---

### Pilar 4: Cámaras, Iluminación y Ambiente de Estadio

#### Sistema de Cámara Televisiva (Broadcast Smooth Tracking)
La cámara no sigue únicamente el balón, sino el **centroide de interés** ponderado entre el balón ($70\%$) y el jugador con mayor peligro ofensivo o receptor del pase ($30\%$):

```csharp
public class BroadcastCameraController : MonoBehaviour {
    [SerializeField] private Transform ballTransform;
    [SerializeField] private float height = 18f;
    [SerializeField] private float distance = 26f;
    [SerializeField] private float pitchLengthHalf = 52.5f;
    [SerializeField] private float smoothTime = 0.25f;

    private Vector3 currentVelocity;

    void LateUpdate() {
        if (!ballTransform) return;

        // Limitar seguimiento al área del campo
        float clampedX = Mathf.Clamp(ballTransform.position.x, -pitchLengthHalf + 10f, pitchLengthHalf - 10f);

        // Posición de cámara en lateral de tribuna con ligera inclinación dinámica
        Vector3 targetPos = new Vector3(clampedX * 0.85f, height + (Mathf.Abs(clampedX) * 0.08f), -distance);
        transform.position = Vector3.SmoothDamp(transform.position, targetPos, ref currentVelocity, smoothTime);

        // Orientar hacia el balón con un offset hacia el centro del campo
        Vector3 lookTarget = new Vector3(ballTransform.position.x, 1.2f, ballTransform.position.z * 0.4f);
        transform.LookAt(lookTarget);
    }
}
```

#### Pipeline de Iluminación para Móvil (URP)
1. **Luz Direccional Principal**: 1 única Directional Light simulando focos de estadio nocturno o sol diurno con sombras en tiempo real configuradas a:
   - Distancia máxima de sombra: $35\text{ metros}$.
   - 2 Cascadas de sombra (*Shadow Cascades* a $10\text{ m}$ y $35\text{ m}$).
   - Resolución de mapa de sombras: $1024 \times 1024$.
2. **Césped Optimizado**: Shader no-tessellated con mapa de normales de hierba precalculado, variaciones sutiles de color en franjas cortadas (*stripes*) por coordenadas de textura mundial y cálculo de luz especular ligera para sensación de rocío/humedad.
3. **Público y Gradas**: Mallas simplificadas con mapas de color/animación por shader de vértices (*Vertex Shader crowd cheering* con un simple seno $\sin(\omega t + \phi)$), sin esqueletos ni skinned meshes para los espectadores.

---

## 3. Plan de Implementación por Fases

### Fase 1: Prototipo Visual y Puente Inter-Proceso (Semanas 1–3)
- [x] Configuración del proyecto Unity como librería (UaaL) y enlace con la actividad Android.
- [x] Implementación del protocolo de serialización binaria de snapshots y buffer circular de interpolación.
- [x] Campo 3D con medidas estándar FIFA ($105\text{ m} \times 68\text{ m}$), balón con física parabólica y 22 cápsulas/cilindros que replican las posiciones 2D en 3D.
- [x] Validación de rendimiento: 60 FPS estables en dispositivos de referencia (ej: Snapdragon 680 / Helio G85).

### Fase 2: Modelado Base, Rigging y Locomoción Core (Semanas 4–7)
- [x] Integración de mallas base de futbolistas con niveles LOD 0, 1 y 2.
- [x] Rig bípedo unificado compatible con animaciones Humanoid en Unity Mecanim / Playables.
- [x] Montaje del Blend Tree de locomoción 2D (paradas, giros a $45^\circ$, $90^\circ$, $180^\circ$, sprints).
- [x] Shaders URP Lit optimizados con kit tinting dinámico por canal de color.

### Fase 3: Acciones Técnicas, Balón e IK (Semanas 8–11)
- [x] Animaciones de pase corto, pase largo, tiro raso, tiro colocado y volea.
- [x] Sistema de contacto de pie con balón mediante IK magnético y animación inercial de respuesta.
- [x] Animaciones de portero (estiradas laterales, salidas por alto, despeje de puños).
- [x] Transiciones entre estados con *Inertialization* (Inertial Blending) para evitar transiciones toscas.

### Fase 4: Cámaras Broadcast, Ambientación y Pulido (Semanas 12–14)
- [x] Control predictivo de cámara broadcast con amortiguación y zoom dinámico en áreas de penalti.
- [x] Gradas optimizadas con animación de público por shader de vértices.
- [x] Transiciones cinemáticas automáticas en repeticiones de goles (*Replay System*) y celebraciones.
- [x] Perfilado final con Unity Profiler y Snapdragon Profiler: garantizar $\le 45$ llamadas de dibujado (Draw Calls) por frame y memoria $\le 160\text{ MB}$.
