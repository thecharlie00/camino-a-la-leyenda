# Camino a la Leyenda (React Edition)

Aplicación web React moderna de carrera futbolística: carrera de jugador o jugadora, carrera de míster (DT) y «Crea tu club», con 87 ligas reales parodiadas, fútbol femenino, motor de partido 2D con física en tiempo real, simulación táctica, mercado de fichajes, ruedas de prensa, redes sociales, mascotas, salón de la fama GOAT y trofeos.

## Tecnologías

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Iconografía:** Lucide React
- **Estilos:** Dark stadium night theme (Big Shoulders Display, Archivo, Doto)
- **Persistencia:** LocalStorage (compatible con importación/exportación de copias de seguridad en JSON)
- **Idiomas:** Español (ES), English (EN), Deutsch (DE), Italiano (IT), Français (FR)

## Estructura del Proyecto

- `src/main.tsx`: Punto de entrada de la aplicación React.
- `src/App.tsx`: Enrutador de pestañas y gestor global de estado e idioma.
- `src/components/GameContainer.tsx`: Contenedor del motor de juego completo y barra rápida de guardado.
- `src/components/PitchDemo.tsx`: Simulador 2D interactivo con 22 jugadores, pases dinámicos, disparos y comentarios en vivo.
- `src/components/Header.tsx`: Barra superior con selector de idioma, navegación, pantalla completa y enlace a la página GOAT LADDER del idioma elegido (el ranking vive en `goat-ladder.js`).
- `src/components/GuideView.tsx`: Manual de estrategia y guía de tácticas, atributos y modos.
- `src/components/Footer.tsx`: Pie de página y enlaces rápidos.
- `src/translations.ts`: Diccionario de traducciones en 5 idiomas.
- `public/camino-engine.js`: Motor de simulación y bases de datos parodiadas de clubes y jugadores.
- `legacy-game/src/goat.js` y `legacy-game/src/ui-goat.js`: cliente e interfaz del ranking online GOAT LADDER.
- `goat-ladder.js`: tablero público del ranking (palmarés, historial, buscador, paginación, enlaces compartidos y borrado).
- `web/config.json`: origen del servicio del ranking que se incrusta en cada compilación.
- `public/img/`: Recursos gráficos, iconos y capturas.

El funcionamiento del ranking online —servicio, API, qué se publica y cómo se prueba— está en
[`docs/GOAT_LADDER.md`](docs/GOAT_LADDER.md).

## Ejecución en Desarrollo

```bash
npm run dev
```

La aplicación se ejecutará en `http://0.0.0.0:3000`.

## Compilación de Producción

```bash
npm run build
```
