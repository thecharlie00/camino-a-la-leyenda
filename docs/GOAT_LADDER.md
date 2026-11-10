# GOAT LADDER (online)

Cómo funciona el ranking online de Camino a la Leyenda: qué se publica, qué servicio hay detrás
y cómo se despliega, se prueba y se depura.

## Piezas

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Servicio | Cloudflare Worker (`server/goat-ladder/worker.mjs`) | Guarda, valida y devuelve las entradas del ranking |
| Cliente del juego | `legacy-game/src/goat.js` | Captura la gesta/temporada y publica (o borra) desde la app |
| Interfaz en el juego | `legacy-game/src/ui-goat.js` | Ficha del ranking, filtros, buscador, publicación y borrado |
| Tablero de la web | `goat-ladder.js` + `goat-ladder/index.html` | Ranking público: palmarés, historial, buscador, paginación y enlaces compartidos |
| Configuración | `web/config.json` | `goat_api_url`: origen HTTPS del servicio, sin ruta |

Las páginas del tablero están en los cinco idiomas: `/goat-ladder/` (español), `/en/`, `/de/`,
`/it/` y `/fr/goat-ladder/`. Las cinco comparten `goat-ladder.js`, que se adapta al idioma de
`<body data-lang>` y crea por sí solo el buscador, el aviso de actualización y los controles de
paginación (el HTML no necesita repetirlos).

## Cómo se ve el tablero

- Tarjetas con la misma ficha que en el juego: puesto, métrica elegida, alias y club, métricas
  agregadas, palmarés y historial de temporadas desplegable.
- **Trofeos con su icono**: el palmarés y cada temporada del historial pintan el trofeo pixelado de
  `pixel.js` (clave `trophy_keys`/`award_keys` del servicio o deducida del nombre). Sin `pixel.js`
  los nombres se muestran como texto, así que la página nunca se queda sin información.
- Las cinco páginas cargan `pixel.js` antes de `goat-ladder.js` (`trophies.js` no hace falta: los
  iconos los dibuja pixel).
- Filtros por tablero (carreras/gestas), modo (jugador/míster), periodo (todo/30/7 días) y métrica.
- Buscador en el dispositivo por alias, club, título, competición o rival. No hace ninguna petición:
  filtra lo que ya está cargado y muestra «n de total» mientras hay búsqueda.
- 12 tarjetas por página con «Ver más».
- Estado en la URL (`board`, `mode`, `period`, `metric`, `q`, `entry`): los enlaces son
  compartibles y `?entry=<id>` abre el ranking en esa entrada, resaltada.
- Botón de compartir en cada tarjeta y de eliminar en las entradas publicadas desde ese navegador.
- Esqueletos mientras carga, aviso de última actualización, mensajes concretos por tipo de fallo y
  aviso flotante para copiar o borrar.

## Configuración del servicio

`web/config.json` define el origen que se incrusta en el juego en cada compilación:

```json
{ "goat_api_url": "https://camino-goat-ladder.…workers.dev" }
```

- Se puede sobreescribir con la variable de entorno `CAMINO_GOAT_API_URL` (útil para un entorno
  de pruebas: el script valida que sea un origen HTTPS sin ruta).
- Si está vacío, el juego y el tablero avisan de que el ranking no está configurado y no hacen
  ninguna petición.
- El valor también fija el `connect-src` de la CSP del juego: si el servicio cambia de origen hay
  que recompilar, o el navegador bloqueará las peticiones.
- Las páginas del tablero llevan su propio `window.GOAT_API_URL` en el HTML. `test/build-smoke.js`
  comprueba que las cinco páginas, el juego y la CSP apuntan al mismo servicio.

## API que usa el cliente

| Método y ruta | Uso |
| --- | --- |
| `GET /api/goat-ladder/careers?mode=&timeframe=&metric=` | Ranking de carreras (`mode`: `player` o `manager`) |
| `GET /api/goat-ladder?mode=&timeframe=` | Ranking de gestas |
| `POST /api/goat-ladder/careers` | Publicar una carrera (devuelve `id` y `delete_token`) |
| `POST /api/goat-ladder` | Publicar una gesta |
| `DELETE /api/goat-ladder/careers?id=` | Borrar una carrera con `Authorization: Bearer <token>` |
| `DELETE /api/goat-ladder?id=` | Borrar una gesta |

El servicio debe responder a `OPTIONS` con `Access-Control-Allow-Origin` para el origen desde el
que se juega (`https://futbolroadtolegend.com`, `https://localhost` en la app Android). Si no lo
hace, el cliente reintenta el envío con `Content-Type: text/plain`, que no dispara la petición
previa de CORS, y vuelve a JSON si el servicio lo exige (`415`, `400`, `405`).
En la app Android las carreras se envían por el puente `AndroidBridge`, porque la WebView se sirve
desde `file://` y no puede hacer CORS.

## Qué se envía al publicar

- Alias (2–32 caracteres) y título (hasta 64), elegidos por el usuario, con consentimiento explícito.
- Métricas agregadas de la carrera y el historial de temporadas (clubes, competiciones, títulos,
  premios). Nunca la partida guardada.
- Si el resumen supera 100 KB se recortan las temporadas más antiguas; las métricas no cambian.
- El alias se recuerda en `localStorage` (`camino.goat.alias`), compartido por el juego y la web,
  para no tener que escribirlo en cada envío.

## Comportamiento ante fallos

| Problema | Qué hace el cliente | Qué ve el usuario |
| --- | --- | --- |
| Corte de red o preflight bloqueado | Reintenta una vez sin preflight | «No se pudo conectar con el ranking…» |
| Sin conexión | No lanza la petición | «Parece que no hay conexión…» |
| Servicio lento | Aborta a los 15 s (25 s en carreras) | «El ranking está tardando demasiado…» |
| Respuesta no JSON | Descarta la respuesta | «El ranking devolvió una respuesta no válida…» |
| Error 5xx | Muestra el aviso | «El ranking no está disponible en este momento…» |
| Error 4xx | Conserva el mensaje del servicio | El texto que devuelva el servicio |
| Envío fallido desde la ficha | Marca el error y cambia el botón | «Reintentar envío» |

El tablero guarda la última respuesta en `sessionStorage` (2 minutos de validez) y la pinta al
instante; si la red falla con datos en pantalla, avisa sin borrar el ranking. Al cambiar de modo,
periodo, métrica o tablero no se reutilizan las filas anteriores: se vacían antes de pedir las nuevas.

## Pruebas

```bash
npm run test:online     # solo el ranking online
npm run test:build      # build completo (incluye estas suites)
```

- `test/goat-client.js`: cliente del juego (URL, reintentos, errores, recortes de tamaño, puente Android).
- `test/goat-worker.cjs`: validación, rankings, puntuación, CORS y endpoints del Worker.
- `test/goat-player-season.js`: captura de la temporada de jugador.
- `test/goat-page.js`: la página publicada con jsdom (reintento, timeout, filtros, pintado real).
- `test/goat-web.js`: lógica del tablero (estado en la URL, rutas, caché, traducciones).
- `test/goat-web-dom.js`: pintado, buscador, filtros, paginación, enlaces compartidos, borrado, caché
  y los iconos de trofeo del historial (carga el `pixel.js` real).
- `test/goat-game-ui.js`: ficha dentro del juego (buscador, compartir, alias recordado, reintentos de
  envío y aviso cuando el servicio no está configurado).

También se pueden lanzar por separado: `npm run test:goat-web-dom`, `npm run test:goat-game-ui`…

## Depurar

1. Abrir el tablero y mirar la consola: el cliente registra `GOAT LADDER ranking request failed` con la URL.
2. Comprobar el servicio a mano:
   `curl "https://<servicio>/api/goat-ladder/careers?mode=player&timeframe=all-time&metric=appearances"`
3. Si el ranking carga pero publicar falla, el problema está en el `POST` (preflight, tamaño o
   validación del servicio).
4. El token de borrado se guarda en `localStorage` con la clave `camino.goat.deleteTokens`, que
   comparten el juego y la web: quien publicó desde la app también puede borrar desde el navegador.
5. El tablero expone `window.GoatBoard` (`state()`, `entries()`, `select()`, `refresh()`) para
   inspeccionarlo desde la consola.
