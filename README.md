# Camino a la Leyenda (React Edition)

Aplicación web React moderna de carrera futbolística: carrera de jugador o jugadora, carrera de míster (DT) y «Crea tu club», con 87 ligas reales parodiadas, fútbol femenino, motor de partido 2D con física en tiempo real, simulación táctica, mercado de fichajes, ruedas de prensa, redes sociales, mascotas, salón de la fama GOAT y trofeos.

## Tecnologías

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite (solo compila el sitio estático y la página del juego)
- **Estilos:** Dark stadium night theme (Big Shoulders Display, Archivo, Doto)
- **Persistencia:** LocalStorage (compatible con importación/exportación de copias de seguridad en JSON)
- **Idiomas:** Español (ES), English (EN), Deutsch (DE), Italiano (IT), Français (FR)

## Estructura del Proyecto

- `index.html`, `site.css` y `site.js`: portada estática por idioma (`en/`, `de/`, `it/`, `fr/`), sin framework.
- `jugar/index.html` y `jugar/juego.html`: página de juego que carga el motor en un iframe; `juego.html` es la única página del motor.
- `legacy-game/src/`: **única fuente** del motor (motores de carrera, Épocas, 3D, interfaz y textos). `build_legacy_game.py` la empaqueta en un solo HTML.
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
