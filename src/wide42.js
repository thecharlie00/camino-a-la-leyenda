/* wide42.js — modo horizontal para la web en ordenador (versión 4.2).
   Detecta el tamaño de la pantalla (la ventana del juego y la resolución del monitor) y, si es ancha y apaisada,
   pone <html class="wide" data-cols="2|3">: menú en un lateral, botón de avanzar abajo a la derecha,
   contenido repartido en columnas y ventanas emergentes centradas. En el móvil y en la app de Android no cambia nada. */
(function () {
  var WEB_BUILD = false; /* build_web.py lo pone a true en la web pública */
  if (!WEB_BUILD) return;
  var de = document.documentElement, last = "";
  function apply() {
    var w = window.innerWidth || de.clientWidth, h = window.innerHeight || de.clientHeight;
    var sw = (window.screen && screen.width) || w, sh = (window.screen && screen.height) || h;
    var coarse = false;
    try { coarse = window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(any-pointer: fine)").matches; } catch (e) {}
    /* ancho, apaisado y no es un móvil en horizontal */
    var wide = w >= 1000 && h >= 540 && w > h * 1.2 && !(coarse && Math.min(sw, sh) < 600);
    var cols = wide ? Math.max(2, Math.min(3, Math.floor((w - 280) / 470))) : 1;
    var key = wide + "|" + cols;
    if (key === last) return;
    last = key;
    de.classList.toggle("wide", wide);
    de.setAttribute("data-cols", String(cols));
  }
  apply();
  var t = 0;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(apply, 120); });
})();
