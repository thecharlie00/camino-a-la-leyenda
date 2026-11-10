# Prompt de dirección artística — Modo Épocas

## Prompt para copiar y usar

Actúa como **director/a de arte y artista visual senior especializado/a en videojuegos de fútbol y gestión deportiva**. Tu misión es dar al **Modo Épocas** una identidad visual inmediatamente reconocible, evocadora y propia, como un viaje por la memoria del fútbol, sin convertirlo en una aplicación distinta ni sacrificar claridad, legibilidad o rendimiento.

### Concepto rector

Diseña el Modo Épocas como un **archivo vivo del fútbol**: una colección de temporadas que parece conservar las huellas del tiempo. Cada periodo debe sentirse de su década, pero la experiencia completa tiene que leerse como un mismo juego y como una misma colección. La nostalgia debe surgir de materiales, composición, tipografía, color, fotografía/ilustración y pequeños detalles gráficos; nunca de dificultar la lectura ni de aplicar un filtro sepia indiscriminado.

La emoción buscada es: **“Estoy abriendo una temporada de otra época y voy a dejar mi propia huella en ella.”** No imites directamente la interfaz, los escudos, las camisetas ni la identidad de un juego comercial existente.

### Contexto real del proyecto que debes respetar

- El juego comparte motor e interfaz entre web y Android. Diseña dentro de la experiencia actual: no propongas una aplicación separada, una segunda interfaz React ni un HUD alternativo que rompa la navegación existente.
- El Modo Épocas cubre seis perfiles: **1970s, 1980s, 1990s, 2000s, 2010s y 2020s**, con elección de año. La identidad visual puede evolucionar entre periodos, pero los controles y la estructura básica deben seguir siendo familiares.
- Los nombres y la cantidad de clubes proceden del mundo compartido: **consérvalos**. No inventes clubes históricos ni alteres la base moderna. Los futbolistas de Épocas son perfiles generados; no los presentes como figuras históricas reales.
- Hay presentación y kits 3D generados de forma procedural. Si propones cambios para ellos, conserva la identidad cromática del club y respeta las prendas que el jugador ya haya elegido o equipado. No inventes beneficios estadísticos para una variación exclusivamente visual.
- El catálogo de decisiones y el historial forman parte de la experiencia. El aspecto debe ayudar a entender el año, el contexto y las consecuencias, sin insinuar que una ilustración decorativa es una mecánica jugable.
- Antes de 2010 no deben aparecer redes sociales como si ya existieran. La prensa, la radio, la televisión, la web y las redes deben representarse de forma coherente con el periodo, sin afirmar como hechos históricos detalles no verificados.
- Prioriza accesibilidad para público casual y PEGI 3: contraste suficiente, texto claro, iconos comprensibles, animación moderada y ninguna información esencial comunicada solo por color.

### Dirección visual

Construye un sistema artístico coherente con tres capas:

1. **Identidad común del juego:** estructura, navegación, jerarquía, botones y patrones de interacción existentes. Debe seguir siendo reconocible en todos los modos.
2. **Identidad de Épocas:** lenguaje de archivo deportivo —fichas de temporada, sellos de fecha, márgenes editoriales, etiquetas de competición, texturas impresas sutiles, numeración de colección— integrado en pantallas reales del modo, no como un menú independiente.
3. **Firma de cada década:** un conjunto pequeño y deliberado de recursos visuales que cambia con el perfil activo. Usa proporciones, tipografía de apoyo, paleta secundaria, tratamiento de imágenes, textura y detalles de interfaz. No cambies la paleta de identidad de los clubes.

Evita convertir las décadas en caricaturas. No hagas que los setenta sean solo marrón, los ochenta solo neón o los noventa solo estética arcade. Basa cada lenguaje en referencias visuales del fútbol, el diseño editorial y la tecnología de su periodo. Usa referencias verificables cuando se hagan afirmaciones históricas; cuando no se puedan verificar, presenta las decisiones como interpretación artística.

### Exploración por décadas

Propón una interpretación visual distinta para cada perfil. Para cada una, define:

- una frase de intención artística;
- paleta de apoyo y materiales/texturas, indicando qué elementos son comunes y cuáles cambian;
- tipografía de titulares y de lectura, priorizando las fuentes ya disponibles y evitando depender de fuentes remotas;
- tratamiento de fotografías, ilustraciones, tarjetas, cifras y gráficos;
- un detalle distintivo de época que no interfiera con la información;
- elementos que **no** se deben usar para evitar clichés o anacronismos.

Como punto de partida —no como receta obligatoria— investiga cómo traducir al diseño actual señales como impresión y papel de programa en los setenta, geometrías y contraste en los ochenta, composición editorial y televisión en los noventa, transición digital en los dos mil, cultura de datos y móvil en los dos mil diez y sistemas de emisión contemporáneos en los dos mil veinte. Verifica el contexto antes de llamar “histórico” a cualquier elemento.

### Piezas que deben formar una experiencia, no una colección de mockups

Diseña el lenguaje visual aplicado a estas pantallas y estados reales:

1. Selector de década y año: comparación atractiva y clara, con el año activo inequívoco.
2. Inicio de carrera de jugador o míster: contexto visual breve sin inventar plantillas históricas ni datos biográficos.
3. Panel/HUD de Épocas: año, reglas activas, canal de medios correspondiente y situación del club, distinguiendo dato, aproximación y decoración.
4. Tarjeta de decisión: situación, opciones, coste/consecuencia y confirmación; debe funcionar bien en móvil y no inducir una elección por jerarquía engañosa.
5. Historial y legado: línea temporal legible de temporadas y decisiones guardadas, sin fabricar títulos, hitos o hechos históricos.
6. Presentación 3D de partido: detalles contextuales de entorno y uniformes que complementen la simulación y no alteren la disposición funcional del campo.
7. Estados sin contenido, carga, error, pausa y confirmación: coherentes con el archivo vivo y fáciles de entender.

### Reglas de interacción y accesibilidad

- Mantén controles, navegación y patrones compartidos con el juego actual. La identidad de Épocas debe venir del arte y de una presentación contextual, no de esconder o mover funciones esenciales.
- Asegura contraste, tamaños legibles, áreas táctiles adecuadas, navegación por teclado y estados de foco visibles. Comprueba móvil vertical y horizontal, escritorio y pantallas pequeñas.
- Usa movimiento corto y opcional cuando aporte contexto —por ejemplo, cambio de ficha o transición de temporada—, con alternativa reducida y sin retrasar el juego.
- Texturas, grano, marcas de impresión y adornos deben ser sutiles; nunca comprometer lectura, rendimiento ni compresión del HTML autocontenido.
- No introduzcas logos, fotografías, escudos, equipaciones exactas ni tipografías con licencia dudosa. Si falta un recurso autorizado, usa arte original, formas abstractas o generación procedural respetuosa con los colores del club.
- No dibujes controles que no existan ni presentes una función decorativa como interactiva. No uses el arte para afirmar que una regla, entorno o retransmisión está implementada si el código no lo confirma.

### Entregables

Entrega una propuesta que incluya:

1. **Manifiesto visual**: concepto, emoción y reglas de consistencia.
2. **Matriz de arte por década** con paleta, materiales, tipografía, imagen, motivo distintivo y clichés que evitar.
3. **Aplicación a las siete piezas** enumeradas arriba, señalando qué puede resolverse con estilos/componentes ya existentes y qué requeriría arte nuevo.
4. **Especificación de componentes**: tokens de color, escala tipográfica, espaciado, bordes, sombras, texturas, iconografía y estados de interacción; diferencia tokens globales de tokens exclusivos de Épocas.
5. **Propuesta para kits y entorno 3D**: cambios procedurales posibles, límites técnicos y garantías de colores del club, equipo elegido y continuidad de la simulación.
6. **Plan de producción por prioridad**: primero los cambios de mayor impacto visual y bajo riesgo; después assets/animaciones; por último refinamientos.
7. **Criterios de QA visual** en web y Android, incluyendo contraste, lectura, rendimiento, escalado, orientación y consistencia con el modo moderno.

### Criterio de éxito

El resultado debe reconocerse como **Modo Épocas** en pocos segundos, hacer que cada década tenga carácter propio y, al mismo tiempo, sentirse inequívocamente como **el mismo juego**. Debe ser evocador sin falsificar la historia, original sin copiar marcas, accesible sin perder personalidad y viable con la arquitectura existente.

Antes de afirmar que una pieza está implementada, inspecciona el código y ejecútala. Separa claramente **propuesta artística**, **cambio visual ya realizado** y **funcionalidad jugable verificada**. Si no puedes hacer pruebas visuales en dispositivo, dilo expresamente.
