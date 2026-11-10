# Revisión de novedades del juego

**Fecha:** 2026-10-28  
**Rama:** `arena/888e77f9-camino-a-la-leyenda`  
**Build del juego:** 5.8 / código 58  
**Tipo de revisión:** auditoría estática, build, pruebas disponibles y revisión de cobertura. No es una certificación en dispositivo físico.

## Resumen ejecutivo

El juego empaqueta correctamente su motor legacy autocontenido, y las comprobaciones disponibles pasan. El smoke de build confirma que el artefacto incluye los sistemas de música, render de partido 3D, mascota 3D, catálogo de ropa, bonificaciones de equipamiento, logros y el código de interacciones sociales. Las pruebas de respuesta social y del cliente GOAT también pasan.

**Eso no demuestra que todos esos sistemas funcionen de extremo a extremo.** En esta rama no hay una suite de navegador E2E, y el informe de QA previo deja sin comprobar partidos completos, guardado/carga, accesorios en 3D, audio audible, rendimiento y dispositivo Android.

Hay defectos confirmados en el panel de analytics: fabrica eventos y métricas, adivina países a partir de la zona horaria y usa una puerta de acceso solo cliente con clave predeterminada pública en el bundle. También encontré plantillas de la red social que siguen mostrándose en inglés en otros idiomas.

**Desfase importante de alcance:** en la rama activa no están los módulos de épocas 70/80 ni sus decisiones, prendas o plantillas históricas. Por tanto, no se pueden validar esas novedades desde este checkout. Los clubes del juego actual se cargan de `DATA.leagues` y `clubName()` los muestra tal cual, sin alias de época.

## Qué se revisó

- Carrera de jugador, carrera de míster y «Crea tu club».
- Eventos, decisiones y logros añadidos al motor.
- Equipaciones, armario/tienda y bonificaciones de atributos.
- Red social del juego, publicaciones y respuestas.
- Partido 2D/3D, modelos GLB, música y mascota 3D.
- Publicación de carreras al servicio GOAT LADDER.
- Diccionarios de traducción y placeholders.
- Panel de analytics del sitio, por su relación con las nuevas métricas y su uso de datos del juego.

## Verificaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm ci` | Correcto; 79 paquetes, 0 vulnerabilidades informadas por npm. |
| `npm run build` | Correcto; genera sitio y juego autocontenido 5.8/58. Vite deja dos avisos no bloqueantes por los scripts clásicos `site.js` sin `type="module"`. |
| `npm run test:build` | Correcto: smoke del bundle, regresión de respuestas sociales y localización de 13 plantillas; comprobación de claves/placeholders para las 897 claves sociales. |
| `node test/goat-client.js` | Correcto: pasa validaciones de URL, serialización, errores/reintentos, carreras largas y preservación de datos. Los errores de red en stderr son simulaciones previstas por esa prueba. |
| `node --check legacy-game/src/*.js` | Correcto para todos los módulos JavaScript del motor. |
| Auditoría estática de traducciones | EN/DE/IT/FR contienen 10.009 claves cada uno; 0 discrepancias de placeholders en diccionarios. En las 897 claves sociales, 0 claves ausentes y 0 placeholders discordantes. Se corrigieron 13 plantillas sociales en cinco idiomas. Es una comprobación estructural, no una revisión humana de las 10.009 traducciones. |
| Navegador y dispositivo físico | No ejecutados en esta pasada. El informe `QA_AUDIT_REPORT.md` conserva el smoke headless anterior, limitado a creación e inicio de los tres modos. |

## Hallazgos

### QA-001 — Analytics genera eventos y cifras ficticias

**Severidad: alta para la integridad de datos.**

`src/analytics/tracker.ts` crea 120 eventos sintéticos cuando el almacenamiento está vacío (`getOrSeedEvents`). El resumen de tráfico aplica multiplicadores y valores constantes; los desgloses de dispositivo, país y modo de juego, la tendencia horaria, la duración media y los visitantes activos también son valores codificados o simulados. Por ello el panel puede presentar estimaciones inventadas como si fueran telemetría real y su exportación tampoco representa tráfico medido.

**Impacto:** las métricas del panel no son fiables para tomar decisiones y se pueden confundir con actividad real. No se ha observado que esto afecte a una partida.

**Evidencia:** `src/analytics/tracker.ts`, `getOrSeedEvents()` y `getTrafficSummary()` (aprox. líneas 68–201), además de `getDeviceBreakdown()`, `getCountryBreakdown()`, `getGameModeBreakdown()` y `getHourlyTrendData()`.

### QA-002 — El país de analytics se infiere sin evidencia

**Severidad: media; privacidad y calidad de datos.**

`detectCountry()` deduce un país a partir de la zona horaria y devuelve «España» si no reconoce la zona. Una zona horaria no identifica la ubicación del usuario y el fallback clasifica como español a quien no pudo clasificarse.

**Impacto:** desgloses geográficos falsos. Se recomienda registrar «No disponible» salvo que exista una fuente explícita y consentida.

**Evidencia:** `src/analytics/tracker.ts`, `detectCountry()` (aprox. líneas 16–36).

### QA-003 — La clave del panel admin no protege el acceso

**Severidad: media, condicionada a que el panel se considere privado.**

La clave por defecto `leyenda2026`, el email autorizado y la comprobación de autenticación están en código cliente. La sesión se representa con un valor de `sessionStorage`; no hay validación de credenciales en servidor. Cualquier usuario que inspeccione el bundle o modifique el almacenamiento puede saltarse esa pantalla.

**Impacto:** no debe tratarse como control de acceso ni como protección de secretos. El riesgo de exposición de datos centralizados no se ha demostrado aquí porque el panel mostrado se alimenta principalmente de almacenamiento del navegador y datos sintéticos.

**Evidencia:** `src/components/AdminAnalyticsView.tsx`, constantes de autenticación y `handleLogin()` (aprox. líneas 49–118).

### QA-004 — Plantillas sociales sin localización

**Estado: corregido en esta rama; verificado por prueba de regresión.**

Se detectaron 13 plantillas sociales con texto fuente en inglés, lo que dejaba inglés visible en español y sin traducción en otros idiomas. Se cambiaron a claves fuente en español y se añadieron traducciones EN/DE/IT/FR, conservando los placeholders. Se actualizaron también los catálogos de traducción y las variantes femeninas del Balón de Oro y la despedida.

**Verificación:** `test/social-localization.js` valida las 13 plantillas en español, inglés, alemán, italiano y francés, los placeholders y las dos variantes femeninas.

### QA-005 — Cobertura funcional incompleta

**Severidad: riesgo de regresión; no es un fallo jugable confirmado.**

La suite estándar contiene smoke de bundle y respuestas sociales. El smoke comprueba que algunos marcadores/catálogos/modelos están empaquetados, pero no ejecuta una carrera completa. No hay prueba automatizada del navegador en el `package.json` actual. El informe anterior registra un recorrido headless básico de los tres modos, pero no cubre temporada completa, partidos, carga/guardado, 3D visual, audio audible, accesibilidad ni Android físico.

**Evidencia:** `package.json`, `test/build-smoke.js`, `test/social-replies.js` y `QA_AUDIT_REPORT.md`.

## Estado por sistema nuevo

| Sistema | Qué sí queda verificado | Qué queda pendiente |
|---|---|---|
| Motor y publicación 5.8/58 | Build, versión y bundle autocontenido. | Prueba de instalación/arranque en Android real. |
| Tres modos de carrera | Evidencia previa de creación e inicio en navegador. | Avance, partido, economía, fin de temporada y guardado/carga en cada modo. |
| Equipaciones y ropa | Smoke confirma 260 diseños disponibles y código de bonificaciones de atributos. | Compra/desbloqueo, aplicación de bonificación en partida y coherencia visual 2D/3D. |
| Social | Prueba unitaria confirma publicación/respuesta y cooldown independiente. | Recorrido de UI, persistencia y revisión completa de traducciones del feed. |
| Partido 3D / GLB | Presencia de renderer y activos en el bundle. | Inspección visual, colisiones, entradas, fallbacks y rendimiento en dispositivos objetivo. |
| Música/sonido | Presencia del sistema de música y control en el bundle. | Reproducción audible, pausa, cambio de pantalla, volumen y derechos/licencia del archivo. |
| Mascota 3D | Presencia de mundo, modelos y audio de mascota en el bundle. | Interacciones visuales completas, rendimiento y persistencia en dispositivo. |
| GOAT LADDER | Pruebas aisladas de payload, fallos de red, reintentos y límites de tamaño. | Servicio real y flujo visual completo en entorno publicado. |
| Épocas 70/80 | No está el código correspondiente en esta rama. | Portar primero las épocas; solo entonces auditar sus textos, plantillas y prendas. |

## Conclusión

El empaquetado y las pruebas disponibles son satisfactorios, pero **no bastan para afirmar que todas las novedades están verificadas funcionalmente**. Los riesgos prioritarios son la integridad del panel de analytics y la cobertura E2E. La estructura de los diccionarios conserva las claves/placeholders; las 13 plantillas sociales inglesas identificadas quedaron localizadas con prueba de regresión y las 897 claves sociales pasan las comprobaciones estructurales. No se ha realizado una revisión humana exhaustiva de las 10.009 entradas de cada idioma. Se añadieron cambios de localización y pruebas durante esta revisión.
