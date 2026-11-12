# Propuesta de actualización: Temporada Viva

**Objetivo:** reducir el tiempo que el jugador dedica a encontrar su siguiente acción y hacer que cada carrera genere historias nuevas a partir de lo que ocurre en su propia partida.

## Lectura del estado actual

El juego ya ofrece una base amplia, así que conviene conectar y enriquecer sistemas existentes en vez de apilar más menús:

- Hay tres carreras principales: jugador/a, míster y Crea tu club; también hay modo femenino y Épocas.
- La pantalla de Inicio muestra fase y progreso de temporada, estado, avisos pendientes y noticias. Jugador/a ve sus objetivos; míster ve objetivos y disponibilidad de plantilla.
- En la carrera de míster ya existe **La semana de trabajo**, con próximo rival, preparación, carga de entrenamiento y cuerpo técnico. También hay aviso y corrección automática de bajas en el once.
- En «Más» ya están notificaciones, competición, historial, mundo, logros, diario, guía y ajustes/partidas. Hay retos cerrados con medallas, eventos con decisiones, redes sociales, prensa y reconocimientos de fin de temporada.
- El runtime que empaqueta `build_legacy_game.py` está en `legacy-game/src`. El repositorio mantiene módulos paralelos en `src`; toda implementación debe respetar ese flujo, el guardado local y las partidas existentes.
- La cobertura automatizada es amplia para sistemas aislados, pero los informes del repositorio identifican falta de recorridos E2E de carrera completa, especialmente partido, progresión y guardar/cargar. El QA de la propuesta debe cerrar esa brecha.

## Dirección del producto

Una actualización en dos pilares, con nombre de trabajo **Temporada Viva**:

1. **Foco de jornada (QoL):** un resumen contextual y accionable en Inicio para saber qué conviene hacer ahora.
2. **Crónicas de carrera (contenido):** relatos breves, persistentes y distintos en cada partida, derivados exclusivamente de sus resultados y decisiones simulados.

No añadiría otra pestaña principal ni otro sistema de moneda, rachas diarias o conexión obligatoria. El contenido funciona sin conexión.

## Pilar 1 — Foco de jornada

Una tarjeta compacta de Inicio que prioriza una sola acción y ofrece hasta dos accesos secundarios. Se actualiza con el estado real de la carrera y nunca bloquea el botón de avanzar.

**Prioridad sugerida:** decisión pendiente → partido próximo → baja que afecta al once → objetivo de temporada → actividad de mercado/pretemporada → resumen del tramo. Cada elemento explica por qué aparece y desaparece cuando deja de ser relevante.

**Contenido por modo:**

- **Jugador/a:** próximo partido y competición, progreso de objetivos existentes, disponibilidad/estado y enlace a ficha, plantilla o competición.
- **Míster:** reutiliza «La semana de trabajo» en vez de duplicarla; añade el recordatorio más urgente (por ejemplo, una baja en el once o un mercado que va a cerrar) y acceso directo al ajuste correspondiente.
- **Crea tu club:** utiliza el mismo resumen de míster, con la situación del club, objetivo y siguiente rival.

**UX:** tarjeta plegable, con acciones de destino claras y sin confirmaciones extra para avanzar. Mantener avisos urgentes accesibles para lector de pantalla; respetar movimiento reducido y tamaños de pantalla pequeños. Los avisos son dentro del juego: no pedir permisos ni añadir notificaciones del sistema.

## Pilar 2 — Crónicas de carrera

Una capa narrativa sobre el calendario, noticias y diario existentes; no un generador de noticias sueltas sin continuidad. Cada temporada puede mantener hasta **tres hilos** activos, con dos o tres apariciones cada uno y una resolución al cierre del tramo/temporada.

**Ejemplos de hilos posibles, condicionados a eventos reales de la partida:**

- **La carrera por el ascenso:** surge cuando varios clubes están disputándose los puestos de promoción y se cierra con el resultado final de la tabla.
- **Una oportunidad en el once:** un/a joven ficticio/a gana minutos, entra en objetivos y puede llegar a debutar; solo aparece si la plantilla y los minutos lo permiten.
- **El pulso del vestuario:** una racha, una lesión o una decisión del míster cambia el ánimo; puede generar una decisión corta con consecuencias moderadas.

Cada hilo tiene una condición de inicio verificable en `S`, un identificador guardado, un máximo de apariciones, condición de cierre y textos localizados. Si el jugador cambia de club, se retira o el hilo deja de tener sentido, se cierra con naturalidad; nunca obliga a completar contenido opcional.

Al terminar la temporada, el Inicio muestra una **crónica de 3 momentos**: logro personal, giro de la competición y una historia que queda abierta o se resuelve. El Diario conserva el archivo para volver a leerlo. Esto aprovecha estadísticas, calendario, noticias y diario ya presentes, y aporta frescura sin producir otra tabla o colección de premios.

## Reglas de contenido y compatibilidad

- Las crónicas describen **la simulación de esa carrera**, no hechos históricos ni participantes/resultados reales. No se inventan fechas, historia de clubes o noticias externas.
- Jugadores y entrenadores creados por el motor siguen siendo ficticios, estables dentro de la partida y distintos de personas reales.
- En Épocas, solo se usan denominaciones y canales de comunicación coherentes con la década seleccionada. Las historias siguen siendo resultados simulados, nunca un registro histórico verificado.
- Todo texto nuevo se localiza en ES/EN/DE/IT/FR y se revisan placeholders y las variantes femeninas necesarias.
- El estado nuevo es opcional y versionado (por ejemplo, `story.v1`); si no existe en un guardado antiguo, se inicializa vacío. No cambiar IDs de clubes, índices o resultados ya guardados.
- No añadir llamadas de red, permisos Android, anuncios dentro del partido ni telemetría inventada.

## Alcance recomendado para el primer lanzamiento

**Incluido:** Foco de jornada para los tres modos; hilos narrativos con datos de la partida; crónica de temporada; traducciones; persistencia compatible; pruebas unitarias y E2E críticas.

**Fuera de alcance:** nuevas ligas, fichajes en vivo, noticias reales, modo multijugador, cambios de reglas o balance, notificaciones del sistema, progresión diaria obligatoria y nuevos activos 3D. Esto limita el riesgo y concentra el trabajo en legibilidad y rejugabilidad.

## Criterios de aceptación

1. En una carrera nueva de cada modo, Inicio identifica la siguiente acción correcta sin ocultar accesos existentes ni bloquear «Avanzar».
2. El contenido de la tarjeta coincide con calendario, objetivos, plantilla y fase de temporada; al resolver una baja/decisión/mercado no queda un aviso obsoleto.
3. Las crónicas se derivan de hechos de la partida, no se repiten dentro de una temporada y pueden cerrarse aunque el usuario no elija sus decisiones opcionales.
4. La misma partida/semilla produce los mismos disparadores; carreras distintas pueden generar combinaciones diferentes.
5. Partidas antiguas cargan sin migración destructiva; guardar y cargar después conserva el foco y los hilos activos.
6. Todas las cadenas nuevas pasan las comprobaciones de cinco idiomas y placeholders.
7. Pruebas E2E recorren Inicio → jornada/partido → guardar → cargar en jugador/a, míster y Crea tu club, en navegador móvil emulado y escritorio. Esto no sustituye la prueba física Android, que se reportaría por separado si se realizara.
8. `npm run build` y `npm run test:build` pasan; el HTML empaquetado incluye la función y no deja dependencias de red nuevas.

## Secuencia de trabajo

1. **Especificación de disparadores y datos:** enumerar estados de `S` que alimentan foco e hilos; preparar fixtures deterministas.
2. **QoL primero:** implementar y probar la tarjeta en Inicio, reutilizando avisos y «La semana de trabajo».
3. **Contenido:** añadir el registro versionado de hilos, integración con noticias/diario y crónica de fin de temporada.
4. **Localización y regresión:** cinco idiomas, modo femenino, salvados viejos, Épocas y pruebas E2E.

**Decisión recomendada:** empezar por una versión vertical pequeña con tres hilos genéricos por modo y el Foco de jornada. Ampliar el catálogo solo después de comprobar que las historias se perciben como distintas, pertinentes y no intrusivas.
