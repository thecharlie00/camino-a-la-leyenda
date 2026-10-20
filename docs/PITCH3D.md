# Prototipo experimental de partido 3D

## Activación

El parche conserva el campo 2D como opción predeterminada. En el partido en directo, pulsa **Probar vista 3D** para probar el renderizador WebGL ligero; pulsa **3D · volver a 2D** para regresar al campo existente. La selección se guarda en `localStorage` (`camino.pitch3d`). También se puede iniciar en 3D con `?pitch3d=1`.

## Qué incluye

- Campo 3D con líneas, áreas, círculo central, porterías estilizadas y franjas de césped.
- Representación geométrica provisional de los 22 jugadores y el balón.
- Cámara de retransmisión fija y movimiento del balón hacia la posición de posesión comunicada por el motor actual.
- Adaptador de la API `Pitch`; no modifica `match41.js` ni los cálculos del resultado del partido.
- Alternancia 2D/3D dentro del partido y fallback a 2D si WebGL no está disponible.

## Límites conocidos

Esto es una **prueba de integración**, no la versión final con modelos humanos. Los jugadores son figuras geométricas, no hay todavía esqueleto, clips glTF, animación real de pases/tiros, sombras ni repetición 3D sincronizada. El objetivo es verificar que WebGL funciona en la WebView y medir rendimiento antes de importar modelos y animaciones.

## Compilación

`build.py` incluye `src/pitch3d.js` en el HTML empaquetado. Ejecuta el flujo habitual de compilación del proyecto y prueba en un dispositivo Android real; no des por validado el rendimiento basándote solo en el navegador de escritorio.
