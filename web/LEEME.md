# Web para jugar en el navegador

La web se genera con `python3 build.py && python3 build_web.py` en `dist/site` y se publica en GitHub Pages
(rama `gh-pages`) con el flujo `.github/workflows/web.yml`. Solo se publica a mano (Actions → Web → Run workflow)
o con un commit en `main` que lleve `[web]` en el mensaje.

- `index.html`: portada. `jugar.html`: el juego a pantalla completa. `privacidad.html`: política de la web.
- `site.css` y `site.js`: estilos, anuncios y el partido animado de la portada.
- `img/`: iconos, capturas e imagen para redes (las capturas se regeneran con `node tools/web_shots.js`).
- `config.json`: AdSense, dominio y enlaces.
- `i18n.json`: los textos de la web en los cinco idiomas del juego. El castellano va en la raíz y el resto en `/en/`, `/de/`,
  `/it/` y `/fr/`, con enlaces `hreflang`. En la primera visita a la portada se abre el idioma del navegador; el selector
  recuerda la elección y el juego arranca en el idioma de la página. Las capturas y la imagen para redes se generan por idioma
  con `LG=en node tools/web_shots.js`.

## Activar los anuncios de AdSense

1. Crea la cuenta en adsense.google.com y añade el sitio.
2. Copia tu ID de editor (`ca-pub-…`) en `adsense_client`.
3. En AdSense → Anuncios → Por bloque de anuncio, crea bloques de display:
   - `inicio` e `inicio_final`: adaptables (portada);
   - `juego_movil`: tamaño fijo 320 × 50 (encima del juego en el móvil);
   - `juego_lateral`: tamaño fijo 300 × 600 (laterales en pantallas anchas).
   Copia el número de cada bloque (`data-ad-slot`) en `slots`. Un hueco vacío no se muestra.
4. En AdSense → Privacidad y mensajes, activa el mensaje de consentimiento del RGPD (obligatorio en Europa).
5. Publica con un commit que lleve `[web]`. Con el ID puesto, la web genera `ads.txt` y la etiqueta de verificación.

Los anuncios nunca van dentro del juego: el juego está en un iframe sin acceso a internet (su CSP lo bloquea) y los
anuncios solo están en la página que lo rodea, separados de los botones del juego.

## Dominio propio

Pon el dominio en `domain` (por ejemplo `caminoalaleyenda.com`). La web crea el archivo `CNAME`; en tu proveedor de
dominio apunta los registros a GitHub Pages y en Settings → Pages escribe el mismo dominio.
