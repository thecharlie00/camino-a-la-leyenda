/* ===== MINIJUEGOS: penalti y falta directa (como tirador y como portero) =====
   Tirador (skill = tu tiro, gk = portero rival):
     Minigame.penalty({skill, gk, pressure, rand}, done) · Minigame.freekick({skill, gk, dist, rand}, done)
     → done({p: 0.71, scored: true})            p = probabilidad de gol mostrada al final
   Portero (gk = tu valoración 40-95, skill = tirador rival 40-95):
     Minigame.gkPenalty({gk, skill, pressure, rand}, done)   elige una de 6 zonas (3×2) y el momento de tirarte
     Minigame.gkFreekick({gk, skill, dist, rand}, done)      barrera (0-6 jugadores y posición), tu posición y reacción
     → done({p: 0.38, saved: true, scored: false})
       p = probabilidad de no encajar mostrada tras el último paso (parada + fuera/palo/barrera); saved solo si es parada.
   press 0..1 opcional (tanda de penaltis: barra aún más rápida, zona ideal más estrecha y marcador que tiembla),
   pressure 0..1 (acelera la barra), dist en metros (16-35), rand = RNG opcional (Math.random por defecto; todo el azar
   pasa por él, así una semilla reproduce la jugada). Todos devuelven {close()} para cerrar sin llamar a done.
   Superposición a pantalla completa, SVG/CSS puro, sin dependencias.
   Inyecta su propio CSS y reutiliza las variables de :root de style.css (con valores de reserva). */
var Minigame = (function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", uid = 0;
  var IDEAL0 = 0.42, IDEAL1 = 0.68;           /* zona verde de la barra de potencia */
  /* presión de la tanda (opt.press 0..1, patch 2.5): barra más rápida, zona ideal más estrecha y marcador que tiembla */
  var PRESS = 0;
  function setPress(v) {
    PRESS = clamp(+v || 0, 0, 1);
    var hw = 0.13 * (1 - 0.5 * PRESS);
    IDEAL0 = 0.55 - hw; IDEAL1 = 0.55 + hw;
  }
  function withPress(fn) { return function (opt, done) { setPress(opt && opt.press); return fn(opt, done); }; }

  /* ---------- utilidades ---------- */
  function t(s, p) {
    if (typeof tr === "function") return tr(s, p);
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? p[k] : m; });
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function num(x, d) { x = +x; return isFinite(x) ? x : d; }
  function easeOut(k) { return 1 - (1 - k) * (1 - k); }
  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function sv(tag, at, parent) {
    var e = document.createElementNS(NS, tag), k;
    for (k in at) if (at.hasOwnProperty(k)) e.setAttribute(k, at[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function hv(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function reduced() {
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function raf(f) { return window.requestAnimationFrame ? window.requestAnimationFrame(f) : setTimeout(f, 16); }
  function tween(ms, fn, end, delay) {
    if (reduced()) { ms = ms * 0.25; delay = (delay || 0) * 0.25; }
    var t0 = 0;
    function fr() {
      var k = ms > 0 ? clamp((now() - t0) / ms, 0, 1) : 1;
      fn(k);
      if (k < 1) raf(fr); else if (end) end();
    }
    function go() { t0 = now(); raf(fr); }
    if (delay) setTimeout(go, delay); else go();
  }
  function wait(ms, f) { setTimeout(f, reduced() ? Math.min(ms, 150) : ms); }
  function chanceColor(p) {
    var h = clamp((p - 0.12) / 0.55, 0, 1) * 135;
    return "hsl(" + Math.round(h) + ",78%,52%)";
  }
  function pct(p) { return Math.round(clamp(p, 0, 1) * 100); }
  function powerWord(v) { return v < IDEAL0 ? t("Floja") : v > IDEAL1 ? t("Demasiado fuerte") : t("Ideal"); }
  /* factor de potencia: zona ideal ≈ ×1; floja → el portero para más; fuerte → por encima del larguero (más arriba, peor) */
  function powerFx(v, h) {
    if (v < IDEAL0) { var w = 0.5 + 0.5 * Math.pow(v / IDEAL0, 1.4); return {f: w, weak: 1 - w, over: 0}; }
    if (v > IDEAL1) { var o = clamp((v - IDEAL1) / (1 - IDEAL1) * (0.3 + 0.62 * h), 0, 0.95); return {f: 1 - o, weak: 0, over: o}; }
    var mid = (IDEAL0 + IDEAL1) / 2;
    return {f: 1 - 0.04 * Math.abs(v - mid) / (mid - IDEAL0), weak: 0, over: 0};
  }

  /* ---------- CSS ---------- */
  var CSS = [
    ".mg-ov{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;overflow-y:auto;overscroll-behavior:contain;",
    "background:radial-gradient(140% 55% at 50% -8%,#1d3b33 0%,rgba(11,20,23,0) 70%),var(--night,#0b1417);color:var(--chalk,#edf1e8);",
    "font:15px/1.4 var(--f-body,system-ui,sans-serif);-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;animation:mg-in .22s ease-out}",
    ".mg-ov *{box-sizing:border-box}",
    ".mg-box{width:100%;max-width:460px;min-height:100%;display:flex;flex-direction:column;justify-content:center;gap:10px;",
    "padding:max(14px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom))}",
    ".mg-head{display:flex;flex-direction:column;align-items:flex-start;gap:9px}",
    ".mg-kick{font:800 11px/1 var(--f-body,sans-serif);letter-spacing:.16em;text-transform:uppercase;color:var(--led,#ffb21e)}",
    ".mg-title{font:800 36px/.95 var(--f-disp,Impact,sans-serif);margin:5px 0 0;text-transform:uppercase;letter-spacing:.01em;color:var(--chalk,#edf1e8)}",
    ".mg-chips{display:flex;gap:6px;flex-wrap:wrap}",
    ".mg-chip{font:600 12px/1 var(--f-body,sans-serif);padding:6px 9px;border-radius:999px;background:var(--tunnel,#18292f);border:1px solid var(--line,#24393f);color:var(--mist,#91a4a6);white-space:nowrap}",
    ".mg-chip b{color:var(--chalk,#edf1e8);font-weight:800;margin-left:3px}",
    ".mg-step{display:flex;align-items:center;gap:9px;min-height:36px}",
    ".mg-stepn{flex:none;font:800 11px/1 var(--f-body,sans-serif);letter-spacing:.06em;text-transform:uppercase;color:var(--led-ink,#1d1404);background:var(--led,#ffb21e);border-radius:6px;padding:5px 7px}",
    ".mg-hint{font-size:14px;line-height:1.3;color:var(--chalk,#edf1e8)}",
    ".mg-stage{position:relative;border-radius:var(--r,12px);overflow:hidden;border:1px solid var(--line,#24393f);background:var(--stand,#111e22);flex:none}",
    ".mg-stage svg{display:block;width:100%;height:auto;max-height:62vh;margin:0 auto}",
    ".mg-fk svg{touch-action:none;cursor:crosshair}",
    ".mg-cell{cursor:pointer;transition:fill-opacity .15s,stroke .15s}",
    ".mg-cell:hover{fill-opacity:.5}",
    ".mg-cell.on{fill-opacity:.62;stroke:var(--led,#ffb21e);stroke-width:3}",
    ".mg-cells.off .mg-cell{cursor:default;pointer-events:none}",
    ".mg-gk,.mg-ball,.mg-deco{pointer-events:none}",
    ".mg-lab{font:800 13px/1 var(--f-body,sans-serif);fill:#fff;paint-order:stroke;stroke:rgba(5,12,14,.78);stroke-width:3.2px;stroke-linejoin:round;pointer-events:none}",
    ".mg-lab.on{font-size:16px;fill:var(--led,#ffb21e)}",
    ".mg-prob{position:absolute;top:8px;right:8px;display:flex;align-items:baseline;gap:6px;background:rgba(11,20,23,.88);border:1px solid var(--line,#24393f);border-radius:10px;",
    "padding:5px 10px 4px;font:700 12px/1 var(--f-body,sans-serif);color:var(--mist,#91a4a6);pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.35)}",
    ".mg-prob b{font:800 24px/1 var(--f-disp,Impact,sans-serif);color:var(--led,#ffb21e);min-width:2.2em;text-align:right}",
    ".mg-pen .mg-prob{top:6px;right:auto;left:8px}",
    ".mg-prob.pop{animation:mg-pop .32s ease-out}",
    ".mg-res{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(6,12,14,.38);pointer-events:none}",
    ".mg-res.on{display:flex}",
    ".mg-res-t{font:800 66px/1 var(--f-disp,Impact,sans-serif);letter-spacing:.02em;text-shadow:0 4px 0 rgba(0,0,0,.45),0 0 30px currentColor;animation:mg-big .45s cubic-bezier(.2,1.6,.4,1)}",
    ".mg-res-p{font:700 13px/1 var(--f-body,sans-serif);color:var(--chalk,#edf1e8);background:rgba(11,20,23,.8);padding:6px 10px;border-radius:999px}",
    ".mg-gol .mg-res-t{color:var(--grass,#3fcf7c)}.mg-parada .mg-res-t{color:var(--sky,#66b9ff)}.mg-fuera .mg-res-t,.mg-barrera .mg-res-t{color:var(--red,#ff5b66)}",
    ".mg-barrera .mg-res-t{font-size:50px}",
    ".mg-pow{background:var(--stand,#111e22);border:1px solid var(--line,#24393f);border-radius:var(--r,12px);padding:10px 14px 9px;transition:opacity .2s}",
    ".mg-pow.is-off{opacity:.45}",
    ".mg-powl{display:flex;justify-content:space-between;align-items:baseline;font:800 11px/1 var(--f-body,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:var(--mist,#91a4a6);margin-bottom:9px}",
    ".mg-powv{color:var(--led,#ffb21e);letter-spacing:.04em}",
    ".mg-bar{position:relative;height:24px;border-radius:12px;margin:0 6px;",
    "background:linear-gradient(90deg,#f4f6f0 0%,#cfe9d7 24%,var(--grass,#3fcf7c) 42%,var(--grass,#3fcf7c) 68%,var(--led,#ffb21e) 80%,var(--red,#ff5b66) 92%);",
    "box-shadow:inset 0 2px 4px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.4)}",
    ".mg-zone{position:absolute;top:-4px;bottom:-4px;left:42%;width:26%;border:2px solid rgba(237,241,232,.9);border-radius:6px;pointer-events:none}",
    ".mg-mark{position:absolute;top:50%;left:0;width:34px;height:34px;margin:-17px 0 0 -17px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6));pointer-events:none}",
    ".mg-mark svg{display:block;width:100%;height:100%}",
    ".mg-pow.is-done .mg-mark{animation:mg-pop .3s ease-out}",
    ".mg-barl{position:relative;height:14px;margin:7px 6px 0;font:600 11px/14px var(--f-body,sans-serif);color:var(--dim,#5f7477)}",
    ".mg-barl span{position:absolute;top:0}.mg-barl span:nth-child(1){left:0}.mg-barl span:nth-child(2){left:55%;transform:translateX(-50%);color:var(--grass,#3fcf7c)}.mg-barl span:nth-child(3){right:0}",
    ".mg-btns{display:flex;gap:8px;padding-top:4px}",
    ".mg-btn{flex:1;min-height:54px;border-radius:var(--r,12px);border:1px solid var(--line,#24393f);background:var(--tunnel,#18292f);color:var(--chalk,#edf1e8);",
    "font:800 15px/1.1 var(--f-body,sans-serif);letter-spacing:.01em;padding:0 12px;white-space:nowrap;cursor:pointer;transition:transform .12s,opacity .2s,background-color .2s}",
    ".mg-btn:active{transform:scale(.97)}",
    ".mg-btn:focus-visible{outline:2px solid var(--led,#ffb21e);outline-offset:2px}",
    ".mg-btn.pri{flex:1.3;background:var(--led,#ffb21e);border-color:var(--led,#ffb21e);color:var(--led-ink,#1d1404);font-size:18px;box-shadow:0 6px 22px rgba(255,178,30,.25)}",
    ".mg-btn[disabled]{opacity:.38;cursor:not-allowed;box-shadow:none}",
    ".mg-hit{animation:mg-flash .6s ease-out}",
    /* portero */
    ".mg-palo .mg-res-t{color:var(--led,#ffb21e)}",
    ".mg-gkm .mg-gol .mg-res-t{color:var(--red,#ff5b66)}.mg-gkm .mg-parada .mg-res-t{color:var(--grass,#3fcf7c)}",
    ".mg-gkm .mg-fuera .mg-res-t,.mg-gkm .mg-barrera .mg-res-t{color:var(--sky,#66b9ff)}",
    ".mg-gkm .mg-bar{background:linear-gradient(90deg,#ff8a3d 0%,var(--led,#ffb21e) 26%,var(--grass,#3fcf7c) 42%,var(--grass,#3fcf7c) 68%,#ff8a5c 80%,var(--red,#ff5b66) 94%)}",
    ".mg-scout{display:flex;align-items:center;gap:8px;max-width:100%;font:600 13px/1.25 var(--f-body,sans-serif);color:var(--chalk,#edf1e8);",
    "background:rgba(255,178,30,.08);border:1px solid rgba(255,178,30,.38);border-radius:10px;padding:7px 10px}",
    ".mg-scout i{flex:none;font:800 10px/1 var(--f-body,sans-serif);font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:var(--led,#ffb21e)}",
    ".mg-you{font:800 10px/1 var(--f-body,sans-serif);letter-spacing:.1em;fill:var(--led,#ffb21e);paint-order:stroke;stroke:rgba(5,12,14,.8);stroke-width:3px;stroke-linejoin:round;pointer-events:none}",
    ".mg-gkf svg{touch-action:none;cursor:ew-resize}",
    ".mg-set{flex:none;display:flex;flex-direction:column;gap:9px;background:var(--stand,#111e22);border:1px solid var(--line,#24393f);border-radius:var(--r,12px);padding:10px 12px;min-height:76px;justify-content:center}",
    ".mg-row{display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".mg-rowl{font:800 11px/1.2 var(--f-body,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:var(--mist,#91a4a6)}",
    ".mg-stp{display:flex;align-items:center;gap:4px}",
    ".mg-sb{width:44px;height:40px;border-radius:10px;border:1px solid var(--line,#24393f);background:var(--tunnel,#18292f);color:var(--chalk,#edf1e8);font:800 22px/1 var(--f-body,sans-serif);cursor:pointer;padding:0}",
    ".mg-sb:active{transform:scale(.95)}.mg-sb[disabled]{opacity:.35;cursor:not-allowed}",
    ".mg-sv{min-width:42px;text-align:center;font:800 26px/1 var(--f-disp,Impact,sans-serif);color:var(--led,#ffb21e)}",
    ".mg-seg{display:flex;gap:3px;flex:1;background:var(--night,#0b1417);border-radius:10px;padding:3px}",
    ".mg-seg button{flex:1;min-height:38px;border:0;border-radius:8px;background:transparent;color:var(--mist,#91a4a6);font:700 13px/1.1 var(--f-body,sans-serif);cursor:pointer;padding:0 4px;white-space:nowrap}",
    ".mg-seg button.on{background:var(--tunnel,#18292f);color:var(--led,#ffb21e);box-shadow:inset 0 0 0 1px var(--led,#ffb21e)}",
    ".mg-seg button[disabled]{opacity:.35;cursor:not-allowed}",
    ".mg-sb:focus-visible,.mg-seg button:focus-visible{outline:2px solid var(--led,#ffb21e);outline-offset:1px}",
    ".mg-tense .mg-pow.is-on .mg-mark svg{animation:mg-shake .09s linear infinite}",
    ".mg-tense .mg-pow.is-on{box-shadow:0 0 0 1px rgba(255,91,102,.45),0 0 22px rgba(255,91,102,.18)}",
    ".mg-tense .mg-kick::after{content:\" · \" attr(data-p);color:var(--red,#ff5b66)}",
    "@keyframes mg-shake{0%{transform:translate(0,0)}25%{transform:translate(var(--mg-amp,2px),calc(var(--mg-amp,2px) * -.5))}50%{transform:translate(calc(var(--mg-amp,2px) * -.7),calc(var(--mg-amp,2px) * .6))}75%{transform:translate(calc(var(--mg-amp,2px) * .4),var(--mg-amp,2px))}100%{transform:translate(0,0)}}",
    "@keyframes mg-in{from{opacity:0}to{opacity:1}}",
    "@keyframes mg-pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}",
    "@keyframes mg-big{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}",
    "@keyframes mg-flash{0%{fill-opacity:.95}100%{fill-opacity:.3}}",
    "@media (min-height:820px){.mg-box{padding-top:max(22px,env(safe-area-inset-top));gap:12px}}",
    "@media (prefers-reduced-motion:reduce){.mg-tense .mg-pow.is-on .mg-mark svg{animation:none}.mg-ov,.mg-res-t,.mg-prob.pop,.mg-hit,.mg-pow.is-done .mg-mark{animation-duration:.01s}.mg-btn,.mg-cell{transition:none}}"
  ].join("");
  function injectCss() {
    if (document.getElementById("mg-css")) return;
    var s = document.createElement("style");
    s.id = "mg-css";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- dibujo común ---------- */
  function ballSvg() { return '<svg viewBox="-10 -10 20 20" aria-hidden="true">' + ballMarkup(9) + "</svg>"; }
  function pentagon(r, rot) {
    var s = [], k, a;
    for (k = 0; k < 5; k++) { a = (rot - 90 + 72 * k) * Math.PI / 180; s.push((r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2)); }
    return s.join(" ");
  }
  /* balón: esfera con sombreado, pentágonos negros y costuras, recortado al círculo */
  var ballN = 0;
  function ballMarkup(r) {
    var id = "mgb" + (++ballN), sw = (r * 0.045).toFixed(2), m = "", k, a, cx, cy, ix, iy, ox, oy, b2;
    function f(v) { return v.toFixed(2); }
    m += '<defs><radialGradient id="' + id + 'g" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef0ea"/><stop offset=".85" stop-color="#b9c0bb"/><stop offset="1" stop-color="#7f8984"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><circle r="' + r + '"/></clipPath></defs>';
    m += '<circle r="' + r + '" fill="url(#' + id + 'g)"/><g clip-path="url(#' + id + 'c)">';
    /* costuras: del vértice del pentágono central al del pentágono exterior, y entre exteriores */
    for (k = 0; k < 5; k++) {
      a = (-90 + 72 * k + 8) * Math.PI / 180;
      ix = r * 0.34 * Math.cos(a); iy = r * 0.34 * Math.sin(a); ox = r * 0.66 * Math.cos(a); oy = r * 0.66 * Math.sin(a);
      m += '<path d="M' + f(ix) + " " + f(iy) + " L" + f(ox) + " " + f(oy) + '" stroke="#8d9691" stroke-width="' + sw + '"/>';
      b2 = a + 36 * Math.PI / 180;
      m += '<path d="M' + f(r * 0.62 * Math.cos(b2)) + " " + f(r * 0.62 * Math.sin(b2)) + " L" + f(r * 1.05 * Math.cos(b2)) + " " + f(r * 1.05 * Math.sin(b2)) + '" stroke="#8d9691" stroke-width="' + sw + '"/>';
      m += '<path d="M' + f(r * 0.66 * Math.cos(a)) + " " + f(r * 0.66 * Math.sin(a)) + " L" + f(r * 0.62 * Math.cos(b2)) + " " + f(r * 0.62 * Math.sin(b2)) + " L" + f(r * 0.66 * Math.cos(a + 72 * Math.PI / 180)) + " " + f(r * 0.66 * Math.sin(a + 72 * Math.PI / 180)) + '" fill="none" stroke="#8d9691" stroke-width="' + sw + '"/>';
    }
    m += '<polygon points="' + pentagon(r * 0.34, 8) + '" fill="#1e2427"/>';
    for (k = 0; k < 5; k++) {
      a = -90 + 72 * k + 8; cx = r * 0.98 * Math.cos(a * Math.PI / 180); cy = r * 0.98 * Math.sin(a * Math.PI / 180);
      m += '<polygon transform="translate(' + f(cx) + " " + f(cy) + ')" points="' + pentagon(r * 0.33, a - 90) + '" fill="#1e2427"/>';
    }
    /* sombra propia y brillo */
    m += '<circle cx="' + f(r * 0.35) + '" cy="' + f(r * 0.4) + '" r="' + f(r * 1.05) + '" fill="#0b1417" opacity=".18"/>';
    m += "</g>";
    m += '<ellipse cx="' + f(-r * 0.36) + '" cy="' + f(-r * 0.42) + '" rx="' + f(r * 0.3) + '" ry="' + f(r * 0.2) + '" transform="rotate(-30 ' + f(-r * 0.36) + " " + f(-r * 0.42) + ')" fill="#fff" opacity=".7"/>';
    m += '<circle r="' + f(r - r * 0.04) + '" fill="none" stroke="#1e2427" stroke-opacity=".55" stroke-width="' + f(r * 0.08) + '"/>';
    return m;
  }
  function ballG(parent, r) {
    var g = sv("g", {"class": "mg-ball"}, parent);
    g.innerHTML = ballMarkup(r);
    return g;
  }
  /* grada de noche con focos y valla LED, de y=0 a y=hy */
  function stadium(svg, defs, id, w, hy) {
    var gr = sv("linearGradient", {id: id + "sk", x1: 0, y1: 0, x2: 0, y2: 1}, defs);
    sv("stop", {offset: "0", "stop-color": "#060c0e"}, gr);
    sv("stop", {offset: "1", "stop-color": "#15282c"}, gr);
    var pat = sv("pattern", {id: id + "cr", width: 14, height: 10, patternUnits: "userSpaceOnUse"}, defs);
    sv("circle", {cx: 3, cy: 3, r: 2.1, fill: "#5a6b6e", opacity: ".55"}, pat);
    sv("circle", {cx: 10, cy: 4, r: 2.1, fill: "#8a6f57", opacity: ".45"}, pat);
    sv("circle", {cx: 6.5, cy: 8, r: 2.1, fill: "#3f5357", opacity: ".6"}, pat);
    sv("circle", {cx: 13, cy: 9, r: 2.1, fill: "#7d4a4f", opacity: ".35"}, pat);
    var gl = sv("radialGradient", {id: id + "fl", cx: ".5", cy: ".5", r: ".5"}, defs);
    sv("stop", {offset: "0", "stop-color": "#fff6dc", "stop-opacity": ".55"}, gl);
    sv("stop", {offset: "1", "stop-color": "#fff6dc", "stop-opacity": "0"}, gl);
    sv("rect", {x: 0, y: 0, width: w, height: hy, fill: "url(#" + id + "sk)"}, svg);
    sv("rect", {x: 0, y: hy * 0.18, width: w, height: hy * 0.72, fill: "url(#" + id + "cr)"}, svg);
    sv("rect", {x: 0, y: 0, width: w, height: hy * 0.3, fill: "#060c0e", opacity: ".55"}, svg);
    sv("ellipse", {cx: w * 0.12, cy: hy * 0.08, rx: 70, ry: 34, fill: "url(#" + id + "fl)"}, svg);
    sv("ellipse", {cx: w * 0.88, cy: hy * 0.08, rx: 70, ry: 34, fill: "url(#" + id + "fl)"}, svg);
    /* valla LED */
    sv("rect", {x: 0, y: hy - 9, width: w, height: 9, fill: "#0d1a1d"}, svg);
    var k;
    for (k = 6; k < w; k += 46) sv("rect", {x: k, y: hy - 6.5, width: 30, height: 4, rx: 1, fill: "#ffb21e", opacity: k % 92 < 46 ? ".85" : ".35"}, svg);
  }
  /* portero agachado; origen = pies, cadera en (0,-35), guantes en (±38,-64) */
  function keeperFig(parent) {
    var g = sv("g", {"class": "mg-gk"}, parent);
    var kit = "#c9ef3d", shade = "#9cbf26", deep = "#7f9e1c", pants = "#1d2a20", pantsL = "#2b3b2e", skin = "#d6a27a", skinD = "#b98760",
      hair = "#2b1d14", boot = "#15191b", glove = "#f4f6f0", gloveD = "#c9d0cc", cuff = "#1d2a20";
    function P(d, fill, extra) { var a = {d: d, fill: fill}, k; if (extra) for (k in extra) a[k] = extra[k]; return sv("path", a, g); }
    function L(d, c, w) { return sv("path", {d: d, stroke: c, "stroke-width": w, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round"}, g); }
    sv("ellipse", {cx: 0, cy: 1, rx: 28, ry: 3.8, fill: "#000", opacity: ".3"}, g);
    /* piernas: muslo (pantalón), rodilla flexionada, espinilla con media y bota */
    [-1, 1].forEach(function (d) {
      P("M" + 3 * d + " -37 L" + 13 * d + " -37 L" + 23 * d + " -21 L" + 15 * d + " -17 Z", d < 0 ? pants : pantsL);
      P("M" + 15.5 * d + " -19 L" + 23.5 * d + " -21.5 L" + 22.5 * d + " -4 L" + 16.5 * d + " -4 Z", d < 0 ? shade : kit);
      P("M" + 15.8 * d + " -16 L" + 23.2 * d + " -17.5 L" + 23.1 * d + " -14.8 L" + 15.9 * d + " -13.4 Z", pants);
      P("M" + 15 * d + " -4.5 L" + 23 * d + " -4.5 Q" + 25.5 * d + " -2.5 " + 28 * d + " -1.6 Q" + 29.5 * d + " 0.6 " + 26 * d + " 0.8 L" + 15.5 * d + " 0.8 Q" + 14 * d + " -1 " + 15 * d + " -4.5 Z", boot);
      L("M" + 18 * d + " -2 L" + 24 * d + " -2", "#ffb21e", 1.1);
    });
    /* pantalón */
    P("M-13 -40 L13 -40 L15.5 -30.5 L1.5 -29.5 L0 -31.5 L-1.5 -29.5 L-15.5 -30.5 Z", pants);
    L("M15 -31 L1.6 -30 M-15 -31 L-1.6 -30", kit, 1);
    /* brazos: hombro → codo → guante, con manga larga */
    [-1, 1].forEach(function (d) {
      L("M" + 12 * d + " -59 L" + 26 * d + " -51 L" + 35 * d + " -60", d < 0 ? shade : kit, 7);
      L("M" + 13 * d + " -56.5 L" + 25.5 * d + " -48.5", deep, 1.4);
      P("M" + 31.5 * d + " -57 L" + 35.5 * d + " -61.5 L" + 37.5 * d + " -59.5 L" + 33.5 * d + " -55 Z", cuff);
    });
    /* torso: hombros anchos, cintura estrecha, panel en sombra y cuello */
    P("M-15 -61 Q0 -65 15 -61 L13 -48 L11.5 -39 L-11.5 -39 L-13 -48 Z", kit);
    P("M-15 -61 Q-9 -63 -6 -63.5 L-7 -39 L-11.5 -39 L-13 -48 Z", shade);
    P("M-11.6 -42 L11.6 -42 L11.5 -39 L-11.5 -39 Z", deep);
    P("M-5 -63.4 L0 -58.5 L5 -63.4 Q0 -64.6 -5 -63.4 Z", pants);
    sv("text", {x: 2.5, y: -46, "text-anchor": "middle", "font-size": 11, "font-weight": 900, fill: pants, opacity: ".85", "font-family": "var(--f-disp,Impact,sans-serif)"}, g).textContent = "1";
    /* guantes: palma con dedos y pulgar */
    [-1, 1].forEach(function (d) {
      var x = 38 * d, y = -64;
      P("M" + (x - 5.2 * d) + " " + (y + 4.5) + " Q" + (x - 6.5 * d) + " " + (y - 1) + " " + (x - 4.5 * d) + " " + (y - 5.5) + " L" + (x + 1.5 * d) + " " + (y - 7.2) + " Q" + (x + 6 * d) + " " + (y - 6.5) + " " + (x + 6.2 * d) + " " + (y - 1) + " L" + (x + 5 * d) + " " + (y + 4) + " Q" + x + " " + (y + 7) + " " + (x - 5.2 * d) + " " + (y + 4.5) + " Z", glove, {stroke: "#8c9a9c", "stroke-width": 0.9});
      L("M" + (x - 1.5 * d) + " " + (y - 6.2) + " L" + (x - 1 * d) + " " + (y - 1.5) + " M" + (x + 1.6 * d) + " " + (y - 6.6) + " L" + (x + 1.8 * d) + " " + (y - 1.2) + " M" + (x + 4.4 * d) + " " + (y - 5.6) + " L" + (x + 4.4 * d) + " " + (y - 1), gloveD, 0.9);
      P("M" + (x - 5.2 * d) + " " + (y + 1) + " Q" + (x - 8.6 * d) + " " + (y - 1) + " " + (x - 8 * d) + " " + (y - 4.5) + " Q" + (x - 6.2 * d) + " " + (y - 4.8) + " " + (x - 4.4 * d) + " " + (y - 2) + " Z", gloveD);
      P("M" + (x - 5 * d) + " " + (y + 3) + " L" + (x + 5 * d) + " " + (y + 2.6) + " L" + (x + 4.4 * d) + " " + (y + 5.6) + " L" + (x - 4.4 * d) + " " + (y + 6) + " Z", kit);
    });
    /* cuello y cabeza */
    P("M-3.6 -66.5 L3.6 -66.5 L4 -62 L-4 -62 Z", skinD);
    sv("ellipse", {cx: 0, cy: -72.5, rx: 7.6, ry: 8.8, fill: skin}, g);
    sv("ellipse", {cx: -7.6, cy: -72, rx: 1.6, ry: 2.4, fill: skinD}, g);
    sv("ellipse", {cx: 7.6, cy: -72, rx: 1.6, ry: 2.4, fill: skinD}, g);
    P("M-8 -73.5 Q-8.6 -82.5 0 -82.4 Q8.4 -82.6 8 -73.5 Q6.6 -77.8 2 -78.2 Q-1 -76.4 -5 -77.2 Q-7.2 -76 -8 -73.5 Z", hair);
    L("M-4.2 -73.6 L-1.6 -74.1 M1.6 -74.1 L4.2 -73.6", hair, 1.1);
    sv("circle", {cx: -2.8, cy: -71.6, r: 0.95, fill: "#1a1410"}, g);
    sv("circle", {cx: 2.8, cy: -71.6, r: 0.95, fill: "#1a1410"}, g);
    L("M-2 -67.6 Q0 -66.8 2 -67.6", skinD, 0.9);
    return g;
  }
  /* posición del guante (local) tras girar 'rot' grados alrededor de la cadera */
  function gloveAt(side, rot) {
    var vx = side * 38, vy = -64 + 35, a = rot * Math.PI / 180;
    return {x: vx * Math.cos(a) - vy * Math.sin(a), y: vx * Math.sin(a) + vy * Math.cos(a) - 35};
  }
  function setGk(g, x, y, s, rot) {
    g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + s.toFixed(3) + ") rotate(" + rot.toFixed(1) + " 0 -35)");
  }
  function setBall(g, x, y, s) {
    g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + s.toFixed(3) + ")");
  }

  /* ---------- armazón de la superposición ---------- */
  function shell(o) {
    injectCss();
    var ui = {alive: true, state: "aim", pc: null, steps: o.steps || 2};
    var ov = hv("div", "mg-ov" + (o.gk ? " mg-gkm" : ""));
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", o.title);
    var box = hv("div", "mg-box", ov);
    var head = hv("div", "mg-head", box), hl = hv("div", "", head);
    ui.kickEl = hv("div", "mg-kick", hl, o.kicker);
    hv("h2", "mg-title", hl, o.title);
    var chips = hv("div", "mg-chips", head), i, c;
    for (i = 0; i < o.chips.length; i++) {
      c = hv("span", "mg-chip", chips, o.chips[i][0]);
      hv("b", "", c, String(o.chips[i][1]));
    }
    var step = hv("div", "mg-step", box);
    ui.stepN = hv("span", "mg-stepn", step);
    ui.hint = hv("span", "mg-hint", step);
    ui.stage = hv("div", "mg-stage " + o.cls, box);
    ui.prob = hv("div", "mg-prob", ui.stage);
    ui.prob.setAttribute("aria-live", "polite");
    ui.res = hv("div", "mg-res", ui.stage);
    ui.pow = hv("div", "mg-pow is-off", box);
    var pl = hv("div", "mg-powl", ui.pow);
    hv("span", "", pl, o.barTitle || t("Potencia"));
    ui.powv = hv("span", "mg-powv", pl, "");
    ui.bar = hv("div", "mg-bar", ui.pow);
    var zone = hv("i", "mg-zone", ui.bar);
    zone.style.left = (IDEAL0 * 100).toFixed(1) + "%"; zone.style.width = ((IDEAL1 - IDEAL0) * 100).toFixed(1) + "%";
    ui.press = PRESS;
    if (PRESS > 0) ov.setAttribute("data-press", PRESS.toFixed(2));
    if (PRESS >= 0.3) { ov.className += " mg-tense"; ov.style.setProperty("--mg-amp", (0.8 + 3.2 * PRESS).toFixed(1) + "px");
      ui.kickEl.setAttribute("data-p", PRESS >= 0.85 ? t("Presión máxima") : PRESS >= 0.5 ? t("Penalti decisivo") : t("Presión")); }
    ui.mark = hv("span", "mg-mark", ui.bar);
    ui.mark.innerHTML = ballSvg();
    var lab = hv("div", "mg-barl", ui.pow), bl = o.barLabs || [t("Floja"), t("Ideal"), t("Fuerte")];
    hv("span", "", lab, bl[0]); hv("span", "", lab, bl[1]); hv("span", "", lab, bl[2]);
    ui.head = head;
    ui.box = box;
    var btns = hv("div", "mg-btns", box);
    ui.btns = btns;
    if (o.sec) { ui.sec = hv("button", "mg-btn sec", btns, o.sec); ui.sec.type = "button"; }
    ui.pri = hv("button", "mg-btn pri", btns, o.priText || t("Elegir potencia"));
    ui.pri.type = "button";
    ui.pri.disabled = true;
    ui.ov = ov;
    /* durante la barra de potencia, tocar en cualquier sitio la para */
    ov.addEventListener("pointerdown", function (e) {
      if (ui.state === "power" && ui.pc && ui.pc.stop()) e.preventDefault();
    });
    ui.onKey = function (e) {
      if (ui.state === "power" && ui.pc && (e.key === " " || e.key === "Enter" || e.keyCode === 32 || e.keyCode === 13)) {
        if (ui.pc.stop()) { e.preventDefault(); e.stopPropagation(); }
      }
    };
    document.addEventListener("keydown", ui.onKey, true);
    ui.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.appendChild(ov);
    return ui;
  }
  function setStep(ui, n, hint) {
    ui.stepN.textContent = ui.steps === 3 ? t("Paso {n} de 3", {n: n}) : t("Paso {n} de 2", {n: n});
    ui.hint.textContent = hint;
  }
  function setProb(ui, label, p, pop) {
    ui.prob.innerHTML = "";
    var parts = t(label, {p: "\u0001"}).split("\u0001");
    ui.prob.appendChild(document.createTextNode(parts[0].replace(/\s+$/, "")));
    var b = hv("b", "", ui.prob, p == null ? "–" : String(pct(p)));
    if (parts[1] != null) b.appendChild(document.createTextNode(parts[1].replace(/^\s+/, " ")));
    if (pop) { ui.prob.className = "mg-prob"; void ui.prob.offsetWidth; ui.prob.className = "mg-prob pop"; }
  }
  /* cfg opcional: {btn: texto del botón, word: fn(v) → texto del resultado} (por defecto, potencia de tiro) */
  function startPower(ui, pressure, onStop, cfg) {
    cfg = cfg || {};
    var word = cfg.word || powerWord;
    var pos = 0, dir = 1, last = now(), started = now(), running = true;
    var sweep = (0.62 - 0.27 * clamp(pressure, 0, 1)) * (1 - 0.4 * (ui.press || 0)); /* segundos por recorrido completo (más rápido = más difícil) */
    ui.state = "power";
    ui.pow.className = "mg-pow is-on";
    ui.powv.textContent = "";
    ui.pri.textContent = cfg.btn || t("¡Lanzar!");
    ui.pri.disabled = false;
    if (ui.sec) ui.sec.disabled = true;
    function place() { ui.mark.style.left = (pos * 100).toFixed(2) + "%"; }
    function frame() {
      if (!running || !ui.alive) return;
      var tm = now(), dt = Math.min(0.05, (tm - last) / 1000);
      last = tm;
      pos += dir * dt / sweep;
      if (pos >= 1) { pos = 2 - pos; dir = -1; }
      if (pos <= 0) { pos = -pos; dir = 1; }
      place();
      raf(frame);
    }
    place();
    raf(frame);
    ui.pc = {stop: function () {
      if (!running || now() - started < 200) return false;
      running = false;
      ui.state = "shot";
      ui.pri.disabled = true;
      ui.pow.className = "mg-pow is-done";
      ui.powv.textContent = word(pos);
      onStop(pos);
      return true;
    }};
    try { ui.pri.focus({preventScroll: true}); } catch (e) {}
  }
  function showResult(ui, how, p, probLabel, then) {
    var txt = {gol: t("¡GOL!"), parada: t("¡PARADA!"), fuera: t("¡FUERA!"), barrera: t("¡A LA BARRERA!"), palo: t("¡AL PALO!")}[how];
    ui.res.innerHTML = "";
    ui.res.className = "mg-res on mg-" + how;
    hv("div", "mg-res-t", ui.res, txt);
    hv("div", "mg-res-p", ui.res, t(probLabel, {p: pct(p)}));
    setTimeout(then, 1200);
  }
  function finish(ui, res, done) {
    if (!ui.alive) return;
    ui.alive = false;
    document.removeEventListener("keydown", ui.onKey, true);
    document.body.style.overflow = ui.bodyOverflow || "";
    try { if (typeof done === "function") done(res); }
    finally { if (ui.ov.parentNode) ui.ov.parentNode.removeChild(ui.ov); }
  }

  /* ================= PENALTI ================= */
  var GX0 = 30, GX1 = 330, GY0 = 46, GY1 = 186, PEN_X = 180, PEN_Y = 270;
  /* probabilidad base de una casilla (r: 0 arriba..2 abajo, c: 0..4) */
  function penCell(r, c, skill, gk, pressure) {
    var sN = clamp((skill - 40) / 55, 0, 1), gN = clamp((gk - 40) / 55, 0, 1);
    var x = (c - 2) / 2, h = (2 - r) / 2;
    var edge = (c === 0 || c === 4 ? 1 : c === 1 || c === 3 ? 0.28 : 0) + (r === 0 ? 0.85 : r === 1 ? 0.1 : 0);
    var miss = clamp(edge * (0.135 - 0.095 * sN) * (1 + 0.5 * pressure), 0, 0.6);
    var d2 = x * x + Math.pow((h - 0.15) * 1.5, 2), sg = 0.4 + 0.2 * gN;
    var lo = 0.08 + 0.12 * gN, hi = 0.62 + 0.26 * gN;
    var save = clamp(lo + (hi - lo) * Math.exp(-d2 / (2 * sg * sg)) + (c === 2 ? 0.08 + 0.08 * gN : 0.16 * (1 - Math.abs(x))), 0, 0.93);
    var p = (1 - miss) * (1 - save) * (1 - 0.05 * pressure);
    return {p: clamp(p, 0.03, 0.95), miss: miss, save: save, h: h};
  }
  /* grada, césped, líneas, punto de penalti y portería con red vista de frente; devuelve la red del fondo */
  function penScene(svg, defs, id) {
    stadium(svg, defs, id, 360, GY1 - 8);
    var bands = [178, 186, 198, 212, 228, 247, 270, 300], k;
    for (k = 0; k < bands.length - 1; k++) sv("rect", {x: 0, y: bands[k], width: 360, height: bands[k + 1] - bands[k] + 0.5, fill: k % 2 ? "#1a4a31" : "#163f2a"}, svg);
    sv("path", {d: "M-5 " + GY1 + " H365 M14 " + GY1 + " L-4 220 M346 " + GY1 + " L364 220 M-4 220 H364", stroke: "rgba(237,241,232,.55)", "stroke-width": 2, fill: "none"}, svg);
    sv("ellipse", {cx: PEN_X, cy: PEN_Y + 4, rx: 5, ry: 2, fill: "rgba(237,241,232,.8)"}, svg);
    var net = sv("pattern", {id: id + "net", width: 10, height: 10, patternUnits: "userSpaceOnUse"}, defs);
    sv("path", {d: "M0 5 L5 0 L10 5 L5 10 Z", fill: "none", stroke: "rgba(237,241,232,.32)", "stroke-width": 0.8}, net);
    var netG = sv("g", {}, svg);
    var BX0 = 46, BX1 = 314, BY0 = 58, BY1 = 176;
    sv("rect", {x: GX0, y: GY0, width: GX1 - GX0, height: GY1 - GY0, fill: "#0a1513"}, netG);
    sv("polygon", {points: GX0 + "," + GY1 + " " + GX1 + "," + GY1 + " " + BX1 + "," + BY1 + " " + BX0 + "," + BY1, fill: "#143a26"}, netG);
    var netBack = sv("rect", {x: BX0, y: BY0, width: BX1 - BX0, height: BY1 - BY0, fill: "url(#" + id + "net)"}, netG);
    sv("polygon", {points: GX0 + "," + GY0 + " " + BX0 + "," + BY0 + " " + BX0 + "," + BY1 + " " + GX0 + "," + GY1, fill: "url(#" + id + "net)", opacity: ".8"}, netG);
    sv("polygon", {points: GX1 + "," + GY0 + " " + BX1 + "," + BY0 + " " + BX1 + "," + BY1 + " " + GX1 + "," + GY1, fill: "url(#" + id + "net)", opacity: ".8"}, netG);
    sv("polygon", {points: GX0 + "," + GY0 + " " + GX1 + "," + GY0 + " " + BX1 + "," + BY0 + " " + BX0 + "," + BY0, fill: "url(#" + id + "net)", opacity: ".8"}, netG);
    sv("path", {d: "M" + BX0 + " " + BY1 + " V" + BY0 + " H" + BX1 + " V" + BY1, fill: "none", stroke: "rgba(237,241,232,.35)", "stroke-width": 1.5}, netG);
    return netBack;
  }
  function penPosts(svg) {
    sv("path", {d: "M" + GX0 + " " + (GY1 + 2) + " V" + GY0 + " H" + GX1 + " V" + (GY1 + 2), "class": "mg-deco", fill: "none", stroke: "rgba(0,0,0,.35)", "stroke-width": 7, transform: "translate(2 2)"}, svg);
    sv("path", {d: "M" + GX0 + " " + (GY1 + 2) + " V" + GY0 + " H" + GX1 + " V" + (GY1 + 2), "class": "mg-deco", fill: "none", stroke: "#f4f6f0", "stroke-width": 6.5, "stroke-linejoin": "miter"}, svg);
  }

  function penalty(opt, done) {
    opt = opt || {};
    var skill = num(opt.skill, 70), gk = num(opt.gk, 70), pressure = clamp(num(opt.pressure, 0.5), 0, 1);
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random;
    var LBL = "Probabilidad de gol: {p} %";
    var ui = shell({cls: "mg-pen", kicker: t("Desde los once metros"), title: t("Penalti"), chips: [[t("Tiro"), skill], [t("Portero"), gk]]});
    var id = "mg" + (++uid);
    var svg = sv("svg", {viewBox: "0 0 360 300", role: "img", "aria-label": t("Portería")});
    ui.stage.insertBefore(svg, ui.stage.firstChild);
    var defs = sv("defs", {}, svg), k;
    var netBack = penScene(svg, defs, id);
    /* casillas */
    var cellsG = sv("g", {"class": "mg-cells"}, svg), cw = (GX1 - GX0) / 5, ch = (GY1 - GY0) / 3, cells = [], r, c, info, rect;
    for (r = 0; r < 3; r++) for (c = 0; c < 5; c++) {
      info = penCell(r, c, skill, gk, pressure);
      info.r = r; info.c = c; info.x = GX0 + c * cw; info.y = GY0 + r * ch; info.w = cw; info.h2 = ch;
      rect = sv("rect", {"class": "mg-cell", x: info.x + 0.5, y: info.y + 0.5, width: cw - 1, height: ch - 1, fill: chanceColor(info.p), "fill-opacity": ".3", stroke: "rgba(237,241,232,.14)", "stroke-width": 1, tabindex: 0, role: "button", "data-i": cells.length, "aria-label": t("Probabilidad de gol: {p} %", {p: pct(info.p)})}, cellsG);
      info.el = rect;
      cells.push(info);
    }
    var gkG = keeperFig(svg), gkX = 180, gkY = GY1 - 1;
    setGk(gkG, gkX, gkY, 1, 0);
    penPosts(svg);
    /* etiquetas % */
    var labs = [];
    for (k = 0; k < cells.length; k++) {
      labs.push(sv("text", {"class": "mg-lab", x: cells[k].x + cw / 2, y: cells[k].y + ch / 2 + 4.5, "text-anchor": "middle"}, svg));
      labs[k].textContent = pct(cells[k].p) + "%";
    }
    sv("ellipse", {cx: PEN_X, cy: PEN_Y + 9, rx: 12, ry: 3.5, fill: "#000", opacity: ".35"}, svg);
    var ball = ballG(svg, 11);
    setBall(ball, PEN_X, PEN_Y, 1);

    var sel = -1;
    function pick(i) {
      if (ui.state !== "aim") return;
      if (sel >= 0) { cells[sel].el.setAttribute("class", "mg-cell"); labs[sel].setAttribute("class", "mg-lab"); }
      sel = i;
      cells[i].el.setAttribute("class", "mg-cell on");
      labs[i].setAttribute("class", "mg-lab on");
      setProb(ui, LBL, cells[i].p, true);
      ui.pri.disabled = false;
    }
    cellsG.addEventListener("click", function (e) {
      var i = e.target && e.target.getAttribute && e.target.getAttribute("data-i");
      if (i != null) pick(+i);
    });
    cellsG.addEventListener("keydown", function (e) {
      var i = e.target.getAttribute("data-i");
      if (i != null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(+i); }
    });
    setStep(ui, 1, t("Toca la zona de la portería donde quieres chutar"));
    setProb(ui, LBL, null);
    ui.pri.addEventListener("click", function () {
      if (ui.state === "aim" && sel >= 0) {
        cellsG.setAttribute("class", "mg-cells off");
        setStep(ui, 2, t("Para la barra en la zona verde: toca la pantalla o pulsa Lanzar"));
        startPower(ui, pressure, shoot);
      } else if (ui.state === "power" && ui.pc) ui.pc.stop();
    });

    function shoot(v) {
      var cell = cells[sel], pf = powerFx(v, cell.h);
      var p = clamp(cell.p * pf.f, 0.02, 0.97);
      var off = 1 - (1 - cell.miss) * (1 - pf.over), fail = 1 - p, missShare = fail > 0 ? clamp(off / fail, 0, 1) : 0;
      var roll = rand(), sideR = rand();
      var scored = roll < p, how = "gol";
      if (!scored) how = (roll - p) / fail < missShare ? "fuera" : "parada";
      setProb(ui, LBL, p, true);
      setStep(ui, 2, t("¡Allá va!"));
      wait(750, function () { animate(how, cell, sideR, pf, function () {
        showResult(ui, how, p, LBL, function () { finish(ui, {p: Math.round(p * 100) / 100, scored: scored}, done); });
      }); });
    }

    function animate(how, cell, sideR, pf, then) {
      var cx = cell.x + cell.w / 2 + (Math.random() - 0.5) * cell.w * 0.45;
      var cy = cell.y + cell.h2 / 2 + (Math.random() - 0.5) * cell.h2 * 0.4;
      var tx = cx, ty = cy, side = sideR < 0.5 ? -1 : 1, kdx, kdy, rot, gl;
      if (how === "fuera") {
        if (pf.over >= cell.miss || cell.c === 2 || (cell.r === 0 && Math.random() < 0.5)) { ty = GY0 - 20 - Math.random() * 12; tx = cx + (cx - 180) * 0.15; }
        else { tx = cell.c < 2 ? GX0 - 18 : GX1 + 18; }
      }
      if (how === "parada") side = cell.c < 2 ? -1 : cell.c > 2 ? 1 : 0;
      if (side === 0) { rot = 0; kdx = 0; kdy = -clamp(GY1 - cy - 62, 0, 70); }
      else if (how === "parada") {
        rot = side * (28 + 52 * clamp((cy - GY0) / (GY1 - GY0), 0, 1));
        gl = gloveAt(side, rot);
        kdx = cx - gkX - gl.x; kdy = Math.min(0, cy - gkY - gl.y);
      } else {
        rot = side * 66;
        kdx = side * (cell.c === 2 ? 60 : (side === (cell.c < 2 ? -1 : 1) ? 38 : 75));
        kdy = -14;
      }
      tween(430, function (k) {
        var e = easeOut(k);
        setGk(gkG, gkX + kdx * e, gkY + kdy * Math.sin(e * Math.PI * 0.6) / Math.sin(Math.PI * 0.6), 1, rot * e);
      }, null, 110);
      var sx = PEN_X, sy = PEN_Y, mx = (sx + tx) / 2, my = Math.min(sy, ty) - 26;
      tween(560, function (k) {
        var e = 1 - Math.pow(1 - k, 1.6), a = 1 - e;
        setBall(ball, a * a * sx + 2 * a * e * mx + e * e * tx, a * a * sy + 2 * a * e * my + e * e * ty, lerp(1, 0.6, e));
      }, function () {
        if (how === "gol") {
          cell.el.setAttribute("class", "mg-cell on mg-hit");
          netBack.setAttribute("transform", "translate(" + ((tx - 180) * 0.02).toFixed(1) + " -2)");
          tween(220, function (k) { setBall(ball, tx + (180 - tx) * 0.05 * k, ty + 6 * k, lerp(0.6, 0.52, k)); }, then);
        } else if (how === "parada") {
          var dx = (side || (cx < 180 ? -1 : 1)) * 85;
          tween(320, function (k) { var e = easeOut(k); setBall(ball, tx + dx * e, ty - 60 * e + 40 * k * k, lerp(0.6, 0.5, k)); }, then);
        } else {
          tween(200, function (k) { setBall(ball, tx + (tx - 180) * 0.1 * k, ty - 8 * k, lerp(0.6, 0.48, k)); }, then);
        }
      });
    }
    return {close: function () { finish(ui, null, null); }};
  }

  /* ================= FALTA DIRECTA ================= */
  var FK_W = 360, FK_H = 404, CAM = 6, HZ = 70, BALL_Y = 378, PXM = 140;
  function yAt(z) { return HZ + (BALL_Y - HZ) * CAM / (CAM + z); }
  function sAt(z) { return PXM * CAM / (CAM + z); }
  function chaikin(pts, it) {
    var out = pts, i, j, a, b, n;
    for (j = 0; j < it; j++) {
      if (out.length < 3) return out;
      n = [out[0]];
      for (i = 0; i < out.length - 1; i++) {
        a = out[i]; b = out[i + 1];
        n.push({x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y}, {x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y});
      }
      n.push(out[out.length - 1]);
      out = n;
    }
    return out;
  }
  function resample(pts, n) {
    var L = [0], i, tot, out = [], j = 1, target, seg, k;
    for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.sqrt(Math.pow(pts[i].x - pts[i - 1].x, 2) + Math.pow(pts[i].y - pts[i - 1].y, 2)));
    tot = L[L.length - 1];
    if (tot <= 0) return {pts: [pts[0]], len: 0};
    for (i = 0; i < n; i++) {
      target = tot * i / (n - 1);
      while (j < pts.length - 1 && L[j] < target) j++;
      seg = L[j] - L[j - 1];
      k = seg > 0 ? (target - L[j - 1]) / seg : 0;
      out.push({x: lerp(pts[j - 1].x, pts[j].x, clamp(k, 0, 1)), y: lerp(pts[j - 1].y, pts[j].y, clamp(k, 0, 1))});
    }
    return {pts: out, len: tot};
  }
  function polyD(pts) {
    var d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1), i;
    for (i = 1; i < pts.length; i++) d += " L" + pts[i].x.toFixed(1) + " " + pts[i].y.toFixed(1);
    return d;
  }

  /* grada, césped en perspectiva, líneas del área y portería a 'dist' metros; devuelve la red del fondo */
  function fkScene(svg, defs, id, dist) {
    var gs = sAt(dist), gw = 7.32 * gs, gh = 2.44 * gs, gy1 = yAt(dist), gy0 = gy1 - gh, gx0 = 180 - gw / 2;
    stadium(svg, defs, id, FK_W, HZ);
    var z0 = -2, z1, band = 0;
    sv("rect", {x: 0, y: HZ, width: FK_W, height: FK_H - HZ, fill: "#163f2a"}, svg);
    for (z1 = 60; z1 > z0; z1 -= 3.2) {
      if (band++ % 2) sv("rect", {x: 0, y: yAt(z1).toFixed(1), width: FK_W, height: (yAt(Math.max(z1 - 3.2, z0)) - yAt(z1)).toFixed(1), fill: "#1a4a31"}, svg);
    }
    var lines = "M0 " + gy1.toFixed(1) + " H" + FK_W, zb = dist - 16.5, ya, yb;
    if (zb > -1.5) {
      ya = yAt(zb); yb = gy1;
      lines += " M" + (180 - 20.16 * sAt(zb)).toFixed(1) + " " + ya.toFixed(1) + " H" + (180 + 20.16 * sAt(zb)).toFixed(1);
      lines += " M" + (180 - 20.16 * sAt(zb)).toFixed(1) + " " + ya.toFixed(1) + " L" + (180 - 20.16 * gs).toFixed(1) + " " + yb.toFixed(1);
      lines += " M" + (180 + 20.16 * sAt(zb)).toFixed(1) + " " + ya.toFixed(1) + " L" + (180 + 20.16 * gs).toFixed(1) + " " + yb.toFixed(1);
    }
    var z6 = dist - 5.5;
    lines += " M" + (180 - 9.16 * sAt(z6)).toFixed(1) + " " + yAt(z6).toFixed(1) + " H" + (180 + 9.16 * sAt(z6)).toFixed(1);
    lines += " M" + (180 - 9.16 * sAt(z6)).toFixed(1) + " " + yAt(z6).toFixed(1) + " L" + (180 - 9.16 * gs).toFixed(1) + " " + gy1.toFixed(1);
    lines += " M" + (180 + 9.16 * sAt(z6)).toFixed(1) + " " + yAt(z6).toFixed(1) + " L" + (180 + 9.16 * gs).toFixed(1) + " " + gy1.toFixed(1);
    sv("path", {d: lines, stroke: "rgba(237,241,232,.5)", "stroke-width": 1.6, fill: "none"}, svg);
    var net = sv("pattern", {id: id + "net", width: 7, height: 7, patternUnits: "userSpaceOnUse"}, defs);
    sv("path", {d: "M0 3.5 L3.5 0 L7 3.5 L3.5 7 Z", fill: "none", stroke: "rgba(237,241,232,.34)", "stroke-width": 0.6}, net);
    var dep = 0.06 * gw;
    sv("rect", {x: gx0, y: gy0, width: gw, height: gh, fill: "#0a1513"}, svg);
    var netBack = sv("rect", {x: gx0 + dep, y: gy0 + dep * 0.5, width: gw - 2 * dep, height: gh - dep * 0.6, fill: "url(#" + id + "net)"}, svg);
    sv("rect", {x: gx0, y: gy0, width: gw, height: gh, fill: "url(#" + id + "net)", opacity: ".55"}, svg);
    return netBack;
  }
  /* jugador de la barrera, de espaldas; (px, wy) = pies, pw = ancho, wh = alto de referencia, i = índice (dorsal/altura) */
  var WALL_H = [0.97, 1, 0.94, 1.02, 0.96, 0.99], WALL_N = [4, 8, 5, 6, 14, 10];
  function wallMan(parent, px, wy, pw, wh, i) {
    var ph = wh * WALL_H[i % 6], pg = sv("g", {}, parent);
    sv("ellipse", {cx: px, cy: wy + 1, rx: pw * 0.45, ry: 2.5, fill: "#000", opacity: ".3"}, pg);
    sv("path", {d: "M" + (px - pw * 0.2) + " " + wy + " V" + (wy - ph * 0.42) + " M" + (px + pw * 0.2) + " " + wy + " V" + (wy - ph * 0.42), stroke: "#e9e3d6", "stroke-width": pw * 0.22, "stroke-linecap": "round"}, pg);
    sv("rect", {x: px - pw * 0.4, y: wy - ph * 0.5, width: pw * 0.8, height: ph * 0.14, rx: 2, fill: "#1b2340"}, pg);
    sv("path", {d: "M" + (px - pw * 0.44) + " " + (wy - ph * 0.42) + " L" + (px - pw * 0.47) + " " + (wy - ph * 0.8) + " Q" + px + " " + (wy - ph * 0.9) + " " + (px + pw * 0.47) + " " + (wy - ph * 0.8) + " L" + (px + pw * 0.44) + " " + (wy - ph * 0.42) + " Z", fill: "#d8434e"}, pg);
    sv("text", {x: px, y: wy - ph * 0.56, "text-anchor": "middle", "font-size": (pw * 0.42).toFixed(1), "font-weight": 800, fill: "rgba(255,255,255,.85)", "font-family": "var(--f-disp,Impact,sans-serif)"}, pg).textContent = String(WALL_N[i % 6]);
    sv("circle", {cx: px, cy: wy - ph * 0.9, r: pw * 0.21, fill: "#2b1d14"}, pg);
    return pg;
  }

  function freekick(opt, done) {
    opt = opt || {};
    var skill = num(opt.skill, 70), gk = num(opt.gk, 70), dist = clamp(num(opt.dist, 22), 16, 35), pressure = clamp(num(opt.pressure, 0.4), 0, 1);
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random;
    var LBL = "Probabilidad: {p} %";
    var ui = shell({cls: "mg-fk", kicker: t("Balón parado"), title: t("Falta directa"), sec: t("Volver a dibujar"),
      chips: [[t("Tiro"), skill], [t("Portero"), gk], [t("Distancia"), t("{n} m", {n: Math.round(dist)})]]});
    var id = "mg" + (++uid), k;
    /* geometría en perspectiva (cámara detrás del balón) */
    var gs = sAt(dist), gw = 7.32 * gs, gh = 2.44 * gs, gy1 = yAt(dist), gy0 = gy1 - gh, gx0 = 180 - gw / 2, gx1 = 180 + gw / 2;
    var wy = yAt(9.15), wsc = sAt(9.15), nW = dist <= 23 ? 5 : 4, pw = 0.5 * wsc, wh = 1.16 * wsc;
    var wx0 = 180 + (gx0 - 180) * (BALL_Y - wy) / (BALL_Y - gy1) - 10, wx1 = wx0 + nW * pw, wTop = wy - wh;
    var ku = 0.62, kx = gx0 + gw * ku, ks = gs / 57;
    var svg = sv("svg", {viewBox: "0 0 " + FK_W + " " + FK_H, role: "img", "aria-label": t("Campo"),
      "data-goal": [gx0, gy0, gx1, gy1].map(function (v) { return v.toFixed(1); }).join(","),
      "data-wall": [wx0, wTop, wx1, wy].map(function (v) { return v.toFixed(1); }).join(",")});
    ui.stage.insertBefore(svg, ui.stage.firstChild);
    var defs = sv("defs", {}, svg);
    var netBack = fkScene(svg, defs, id, dist);
    var gkG = keeperFig(svg), kY = gy1 - 0.5;
    setGk(gkG, kx, kY, ks, 0);
    var pst = Math.max(3, gs * 0.12);
    sv("path", {d: "M" + gx0.toFixed(1) + " " + (gy1 + 1).toFixed(1) + " V" + gy0.toFixed(1) + " H" + gx1.toFixed(1) + " V" + (gy1 + 1).toFixed(1), fill: "none", stroke: "#f4f6f0", "stroke-width": pst.toFixed(1)}, svg);
    /* línea de spray y barrera (de espaldas) */
    sv("path", {d: "M" + (wx0 - 14).toFixed(1) + " " + (wy + 3).toFixed(1) + " H" + (wx1 + 14).toFixed(1), stroke: "rgba(255,255,255,.75)", "stroke-width": 2, "stroke-dasharray": "1 3", "stroke-linecap": "round"}, svg);
    var wallG = sv("g", {}, svg), i;
    for (i = 0; i < nW; i++) wallMan(wallG, wx0 + pw * (i + 0.5), wy, pw, wh, i);
    /* trayectoria */
    var trail = sv("g", {}, svg);
    var pathGlow = sv("path", {d: "", fill: "none", stroke: "rgba(255,178,30,.35)", "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round"}, trail);
    var pathEl = sv("path", {d: "", fill: "none", stroke: "#f4f6f0", "stroke-width": 3, "stroke-dasharray": "8 7", "stroke-linecap": "round", "stroke-linejoin": "round"}, trail);
    var wallDot = sv("circle", {r: 6, fill: "none", "stroke-width": 3, opacity: 0}, trail);
    var endDot = sv("g", {opacity: 0}, trail);
    var endC = sv("circle", {r: 8, fill: "none", "stroke-width": 2.5}, endDot);
    var endX = sv("path", {d: "M-4 0 H4 M0 -4 V4", "stroke-width": 2}, endDot);
    sv("ellipse", {cx: 180, cy: BALL_Y + 10, rx: 13, ry: 4, fill: "#000", opacity: ".35"}, svg);
    var ball = ballG(svg, 12);
    setBall(ball, 180, BALL_Y, 1);
    var hand = sv("g", {opacity: ".9", "pointer-events": "none"}, svg);
    sv("path", {d: "M180 " + (BALL_Y - 22) + " C 150 " + (BALL_Y - 120) + ", 120 " + (BALL_Y - 210) + ", " + (gx0 + gw * 0.14).toFixed(1) + " " + (gy0 + gh * 0.25).toFixed(1), fill: "none", stroke: "rgba(255,178,30,.75)", "stroke-width": 2.5, "stroke-dasharray": "2 7", "stroke-linecap": "round"}, hand);

    var raw = [], ev = null, drawing = false, pid = null;
    function toSvg(e) {
      var m = svg.getScreenCTM(), pt;
      if (!m) return {x: 0, y: 0};
      pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      pt = pt.matrixTransform(m.inverse());
      return {x: clamp(pt.x, -20, FK_W + 20), y: clamp(pt.y, -20, FK_H)};
    }
    function render() {
      var sm = chaikin(raw, 2), d = sm.length > 1 ? polyD(sm) : "";
      pathEl.setAttribute("d", d);
      pathGlow.setAttribute("d", d);
    }
    function evaluate(pts) {
      var sm = chaikin(pts, 2), rs = resample(sm, 90), P = rs.pts, E = P[P.length - 1];
      var o = {pts: P, len: rs.len, E: E};
      if (rs.len < 60 || E.y > wy) { o.ok = false; return o; }
      o.ok = true;
      var sw = (BALL_Y - wy) / (BALL_Y - gy1), iw = Math.round(sw * (P.length - 1)), Pw = P[iw];
      o.iw = iw; o.Pw = Pw;
      o.inside = E.x > gx0 + pst * 0.5 && E.x < gx1 - pst * 0.5 && E.y > gy0 + pst * 0.5 && E.y < gy1;
      o.overM = wTop - Pw.y;
      o.sideM = Math.max(wx0 - Pw.x, Pw.x - wx1);
      o.clearsOver = o.overM > 3;
      o.around = o.sideM > 7;
      o.blocked = !(o.clearsOver || o.around);
      var u = (E.x - gx0) / gw, v = (gy1 - E.y) / gh;
      o.u = u; o.v = v;
      /* curva: desviación máxima respecto a la cuerda */
      var dx = E.x - 180, dy = E.y - BALL_Y, cl = Math.sqrt(dx * dx + dy * dy) || 1, maxDev = 0, j, dv;
      for (j = 0; j < P.length; j++) { dv = Math.abs((P[j].x - 180) * dy - (P[j].y - BALL_Y) * dx) / cl; if (dv > maxDev) maxDev = dv; }
      o.curve = maxDev / cl;
      var sN = clamp((skill - 40) / 55, 0, 1), gN = clamp((gk - 40) / 55, 0, 1);
      var distF = 1 - 0.5 * clamp((dist - 18) / 12, 0, 1.2);
      var kd2 = Math.pow((u - ku) * 1.6, 2) + Math.pow(v - 0.4, 2), sg = 0.3 + 0.12 * gN;
      o.save = clamp((0.1 + 0.1 * gN) + (0.5 + 0.3 * gN) * Math.exp(-kd2 / (2 * sg * sg)), 0, 0.93);
      var edge = Math.min(u, 1 - u, 1 - v);
      o.edge = clamp(1 - edge / 0.14, 0, 1) * (0.45 - 0.3 * sN);
      o.wallF = o.blocked ? 0.04 : o.clearsOver ? clamp(0.72 + o.overM / 45, 0.72, 1) : clamp(0.8 + o.sideM / 50, 0.8, 1);
      if (o.clearsOver && o.around) o.wallF = Math.max(o.wallF, clamp(0.8 + o.sideM / 50, 0.8, 1));
      var cd = Math.min(Math.sqrt(u * u + Math.pow(1 - v, 2)), Math.sqrt(Math.pow(1 - u, 2) + Math.pow(1 - v, 2)));
      var bonus = cd < 0.38 ? (0.38 - cd) / 0.38 * 0.07 * (o.curve > 0.06 ? 1.6 : 1) : 0;
      var p;
      if (!o.inside) p = 0.02;
      else if (o.blocked) p = 0.03;
      else p = (0.45 + 0.55 * sN) * distF * (1 - o.save) * (1 - o.edge) * o.wallF * (1 - 0.05 * pressure) + bonus;
      o.p = clamp(p, 0.01, 0.95);
      return o;
    }
    function markers(o) {
      if (!o || !o.ok) { wallDot.setAttribute("opacity", 0); endDot.setAttribute("opacity", 0); return; }
      wallDot.setAttribute("cx", o.Pw.x.toFixed(1)); wallDot.setAttribute("cy", o.Pw.y.toFixed(1));
      wallDot.setAttribute("stroke", o.blocked ? "#ff5b66" : "#3fcf7c");
      wallDot.setAttribute("opacity", 1);
      endDot.setAttribute("transform", "translate(" + o.E.x.toFixed(1) + " " + o.E.y.toFixed(1) + ")");
      var col = o.inside ? "#3fcf7c" : "#ff5b66";
      endC.setAttribute("stroke", col); endX.setAttribute("stroke", col);
      endDot.setAttribute("opacity", 1);
    }
    function clearPath() {
      raw = []; ev = null; render(); markers(null);
      setProb(ui, LBL, null);
      ui.pri.disabled = true;
      if (ui.sec) ui.sec.disabled = true;
      setStep(ui, 1, t("Dibuja la trayectoria desde el balón con el dedo"));
    }
    svg.addEventListener("pointerdown", function (e) {
      if (ui.state !== "aim") return;
      e.preventDefault();
      drawing = true; pid = e.pointerId;
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      if (hand.parentNode) hand.parentNode.removeChild(hand);
      raw = [{x: 180, y: BALL_Y}];
      var q = toSvg(e);
      if (Math.abs(q.x - 180) + Math.abs(q.y - BALL_Y) > 4) raw.push(q);
      render(); markers(null);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!drawing || e.pointerId !== pid) return;
      var q = toSvg(e), l = raw[raw.length - 1];
      if (Math.abs(q.x - l.x) + Math.abs(q.y - l.y) < 4) return;
      raw.push(q);
      render();
      if (raw.length > 4) markers(evaluate(raw));
    });
    function up(e) {
      if (!drawing || e.pointerId !== pid) return;
      drawing = false;
      ev = raw.length > 2 ? evaluate(raw) : null;
      if (!ev || !ev.ok) {
        raw = []; render(); markers(null); setProb(ui, LBL, null);
        ui.pri.disabled = true;
        setStep(ui, 1, t("Dibuja una trayectoria más larga, del balón hacia la portería"));
        return;
      }
      markers(ev);
      setProb(ui, LBL, ev.p, true);
      ui.pri.disabled = false;
      if (ui.sec) ui.sec.disabled = false;
      setStep(ui, 1, ev.blocked ? t("¡Da en la barrera! Pasa por encima o por un lado") : !ev.inside ? t("Va fuera: termina la trayectoria dentro de la portería") : t("Puedes volver a dibujar o elegir la potencia"));
    }
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    ui.sec.disabled = true;
    ui.sec.addEventListener("click", function () { if (ui.state === "aim") clearPath(); });
    ui.pri.addEventListener("click", function () {
      if (ui.state === "aim" && ev && ev.ok) {
        setStep(ui, 2, t("Para la barra en la zona verde: toca la pantalla o pulsa Lanzar"));
        startPower(ui, pressure, shoot);
      } else if (ui.state === "power" && ui.pc) ui.pc.stop();
    });
    clearPath();

    function shoot(v) {
      var pf = powerFx(v, clamp(ev.v, 0, 1)), p, how = "gol";
      if (!ev.inside || ev.blocked) p = ev.p;
      else p = clamp((ev.p) * pf.f * (ev.clearsOver && pf.weak > 0 ? 1 - pf.weak * 0.5 : 1), 0.01, 0.95);
      var roll = rand(), scored = roll < p;
      if (!scored) {
        if (!ev.inside) how = "fuera";
        else if (ev.blocked) how = "barrera";
        else {
          var wS = (1 - ev.wallF) + (ev.clearsOver ? pf.weak * 0.6 : 0);
          var oS = 1 - (1 - ev.edge) * (1 - pf.over);
          var sS = ev.save + pf.weak * (ev.clearsOver ? 0.4 : 1);
          var tot = wS + oS + sS || 1, q = (roll - p) / (1 - p) * tot;
          how = q < wS ? "barrera" : q < wS + oS ? "fuera" : "parada";
        }
      }
      setProb(ui, LBL, p, true);
      setStep(ui, 2, t("¡Allá va!"));
      wait(750, function () { animate(how, pf, function () {
        showResult(ui, how, p, "Probabilidad de gol: {p} %", function () { finish(ui, {p: Math.round(p * 100) / 100, scored: scored}, done); });
      }); });
    }

    function animate(how, pf, then) {
      var P = ev.pts, n = P.length, E = ev.E, last = n - 1, ox = 0, oy = 0, endScale = clamp(gs / 70, 0.3, 0.55);
      wallDot.setAttribute("opacity", 0); endDot.setAttribute("opacity", 0);
      pathEl.setAttribute("opacity", ".45"); pathGlow.setAttribute("opacity", ".25");
      if (how === "barrera") last = ev.iw;
      if (how === "fuera" && ev.inside) {
        if (pf.over > 0.02 || (1 - ev.v) <= Math.min(ev.u, 1 - ev.u)) oy = Math.min(0, gy0 - 14 - gs * 0.4 - E.y);
        else ox = (E.x < kx ? gx0 - 12 - E.x : gx1 + 12 - E.x);
      }
      var wallLift = how === "barrera" && !ev.blocked ? Math.max(0, wTop + wh * 0.25 - ev.Pw.y) : 0;
      function at(k) {
        var f = k * last, i0 = Math.floor(f), i1 = Math.min(last, i0 + 1), a = f - i0, x = lerp(P[i0].x, P[i1].x, a), y = lerp(P[i0].y, P[i1].y, a);
        var g = clamp((k - 0.45) / 0.55, 0, 1), e = easeInOut(g);
        x += ox * e; y += oy * e;
        y += wallLift * easeInOut(k);
        return {x: x, y: y};
      }
      /* portero */
      var tgt = how === "fuera" ? {x: clamp(E.x, gx0 + 10, gx1 - 10), y: clamp(E.y, gy0 + 8, gy1)} : at(1), side = tgt.x < kx ? -1 : 1, cyN = clamp((tgt.y - gy0) / gh, 0, 1), rot = side * (28 + 52 * cyN), gl = gloveAt(side, rot);
      var kdx = tgt.x - kx - gl.x * ks, kdy = Math.min(0, tgt.y - kY - gl.y * ks), reach = how === "parada" ? 1 : how === "barrera" ? 0.15 : how === "fuera" ? 0.45 : 0.6;
      if (Math.abs(tgt.x - kx) < gw * 0.08 && how === "parada") { rot = 0; kdx = tgt.x - kx; kdy = Math.min(0, tgt.y - kY + 60 * ks); }
      var dur = 980 * (how === "barrera" ? 0.6 : 1);
      tween(dur * 0.55, function (kk) {
        var e = easeOut(kk);
        setGk(gkG, kx + kdx * reach * e, kY + kdy * reach * Math.sin(e * 2) / Math.sin(2), ks, rot * reach * e);
      }, null, dur * 0.45);
      tween(dur, function (kk) {
        var e = Math.pow(kk, 0.85), q = at(e);
        setBall(ball, q.x, q.y, lerp(1, endScale, Math.pow(e, 0.6) * (last / (n - 1))));
      }, function () {
        var q = at(1), s0 = lerp(1, endScale, last / (n - 1));
        if (how === "gol") {
          netBack.setAttribute("class", "mg-hit");
          netBack.setAttribute("transform", "translate(0 -1.5)");
          tween(220, function (kk) { setBall(ball, q.x, q.y + 4 * kk, lerp(s0, s0 * 0.85, kk)); }, then);
        } else if (how === "parada") {
          var dx = (q.x < 180 ? -1 : 1) * 60;
          tween(340, function (kk) { var e = easeOut(kk); setBall(ball, q.x + dx * e, q.y - 30 * e + 45 * kk * kk, s0); }, then);
        } else if (how === "barrera") {
          var bx = (q.x < 180 ? -1 : 1) * 25;
          tween(120, function (kk) { wallG.setAttribute("transform", "translate(0 " + (-5 * Math.sin(kk * Math.PI)).toFixed(1) + ")"); });
          tween(420, function (kk) { var e = easeOut(kk); setBall(ball, q.x + bx * e, q.y + 110 * e - 40 * Math.sin(kk * Math.PI), lerp(s0, 0.8, e)); }, then);
        } else {
          tween(200, function (kk) { setBall(ball, q.x + ox * 0.08 * kk, q.y + (oy < 0 ? -10 : 0) * kk, s0 * (1 - 0.15 * kk)); }, then);
        }
      });
    }
    return {close: function () { finish(ui, null, null); }};
  }

  /* ================= PORTERO: comunes ================= */
  var GK_LBL = "Probabilidad de parada: {p} %";
  /* rematador rival de espaldas (cámara detrás); origen = pies, altura ≈ 98 */
  function shooterFig(parent) {
    var g = sv("g", {"class": "mg-deco"}, parent);
    var kit = "#d8434e", kitD = "#a92f3a", shorts = "#1b2340", skin = "#c98e66", skinD = "#a8714f", hair = "#2b1d14", boot = "#15191b";
    function P(d, fill) { return sv("path", {d: d, fill: fill}, g); }
    function L(d, c, w) { return sv("path", {d: d, stroke: c, "stroke-width": w, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round"}, g); }
    sv("ellipse", {cx: 0, cy: 1, rx: 22, ry: 4, fill: "#000", opacity: ".32"}, g);
    [-1, 1].forEach(function (d) {
      L("M" + 6 * d + " -40 L" + 8 * d + " -24", skin, 8);
      L("M" + 8 * d + " -24 L" + 9 * d + " -5", d < 0 ? kitD : kit, 7);
      L("M" + 8.2 * d + " -20 L" + 8.6 * d + " -17", "#f4f6f0", 7.2);
      sv("ellipse", {cx: 9.5 * d, cy: -2, rx: 5.6, ry: 3.2, fill: boot}, g);
    });
    P("M-14 -54 L14 -54 L16 -33 L2 -32 L0 -35 L-2 -32 L-16 -33 Z", shorts);
    [-1, 1].forEach(function (d) {
      L("M" + 13.5 * d + " -74 L" + 17.5 * d + " -61", d < 0 ? kitD : kit, 7.5);
      L("M" + 17.5 * d + " -61 L" + 19 * d + " -48", skin, 5.4);
      sv("circle", {cx: 19.2 * d, cy: -46, r: 3.1, fill: skinD}, g);
    });
    P("M-15 -77 Q0 -80.5 15 -77 L13.5 -52 L-13.5 -52 Z", kit);
    P("M6 -79.3 Q11 -78.6 15 -77 L13.5 -52 L8 -52 Z", kitD);
    P("M-13.6 -55 L13.6 -55 L13.5 -52 L-13.5 -52 Z", kitD);
    sv("text", {x: 0, y: -58, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: "#fff", opacity: ".9", "font-family": "var(--f-disp,Impact,sans-serif)"}, g).textContent = "9";
    P("M-3.8 -84 L3.8 -84 L4.2 -78.5 L-4.2 -78.5 Z", skinD);
    sv("ellipse", {cx: -7.4, cy: -88, rx: 1.6, ry: 2.4, fill: skinD}, g);
    sv("ellipse", {cx: 7.4, cy: -88, rx: 1.6, ry: 2.4, fill: skinD}, g);
    sv("ellipse", {cx: 0, cy: -88.5, rx: 7.4, ry: 8.6, fill: skin}, g);
    P("M-7.6 -88 Q-8.2 -97.6 0 -97.7 Q8.2 -97.6 7.6 -88 Q7 -82.8 3 -82 L-3 -82 Q-7 -82.8 -7.6 -88 Z", hair);
    return g;
  }
  /* marca «TÚ» bajo el portero: aro ámbar en los pies y rótulo */
  function youTag(parent, s) {
    var g = sv("g", {"class": "mg-deco"}, parent);
    sv("ellipse", {cx: 0, cy: 0, rx: 30 * s, ry: 4.6 * s, fill: "rgba(255,178,30,.16)", stroke: "#ffb21e", "stroke-width": 1.6, opacity: ".9"}, g);
    sv("text", {"class": "mg-you", x: 0, y: 6 + 10 * Math.max(s, 0.6), "text-anchor": "middle"}, g).textContent = t("TÚ");
    return g;
  }
  function scoutLine(ui, text) {
    var d = hv("div", "mg-scout", ui.head);
    hv("i", "", d, t("Informe"));
    hv("span", "", d, text);
  }
  /* efecto del momento de la estirada (v = posición de la barra):
     pronto → el tirador te ve venir y puede cambiar de lado (sw); justo → algo más de alcance; tarde → menos alcance */
  var TF0 = {reach: 1, sameF: 1, sw: 0, late: 0};
  function timingFx(v, sN, waits) {
    var mid = (IDEAL0 + IDEAL1) / 2;
    if (v < IDEAL0) {
      var e = (IDEAL0 - v) / IDEAL0;
      return {reach: 1, sameF: 1, sw: clamp(0.7 * Math.pow(e, 0.8) * (0.6 + 0.4 * sN) * (waits ? 1.5 : 1), 0, 0.92), late: 0};
    }
    if (v > IDEAL1) { var l = (v - IDEAL1) / (1 - IDEAL1); return {reach: 1 - 0.5 * l, sameF: 1 - 0.45 * l, sw: 0, late: l}; }
    var c = 1 - Math.abs(v - mid) / (mid - IDEAL0);
    return {reach: 1 + 0.08 * c, sameF: 1 + 0.05 * c, sw: 0, late: 0};
  }
  function timingWord(v) { return v < IDEAL0 ? t("Pronto") : v > IDEAL1 ? t("Tarde") : t("Justo"); }
  function pickW(ws, r) {
    var i, acc = 0;
    for (i = 0; i < ws.length; i++) { acc += ws[i]; if (r < acc) return i; }
    return ws.length - 1;
  }
  /* color de una probabilidad de parada: escala propia (las paradas rondan 15-50 %) */
  function saveColor(p) { return chanceColor(0.12 + clamp((p - 0.15) / 0.35, 0, 1) * 0.55); }
  function round2(p) { return clamp(Math.round(p * 100) / 100, 0.01, 0.99); }

  /* ================= PORTERO: PENALTI ================= */
  /* zonas 0-2 arriba (izq, centro, der), 3-5 abajo; «izquierda» = la del lanzador, que se ve de espaldas */
  function gkPenalty(opt, done) {
    opt = opt || {};
    var gk = num(opt.gk, 70), skill = num(opt.skill, 70), pressure = clamp(num(opt.pressure, 0.5), 0, 1);
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random;
    var sN = clamp((skill - 40) / 55, 0, 1), gN = clamp((gk - 40) / 55, 0, 1), LBL = GK_LBL;
    /* tendencia oculta: multiplica el peso de cada zona; el informe la delata, pero no la garantiza */
    var hp = 1 + 1.6 * pressure;
    var TEND = [
      {k: "izq", txt: t("Suele tirar a su izquierda"), m: [2.6, 1, 1, 2.6, 1, 1]},
      {k: "der", txt: t("Suele tirar a su derecha"), m: [1, 1, 2.6, 1, 1, 2.6]},
      {k: "esc", txt: t("Busca la escuadra"), m: [3.2, 0.6, 3.2, 0.8, 0.6, 0.8]},
      {k: "raso", txt: t("Le gusta abrir el pie y tirar raso"), m: [0.45, 0.5, 0.45, 1.7, 0.8, 1.7]},
      {k: "cen", txt: t("Le gusta tirar fuerte al centro"), m: [1, 3.4, 1, 1, 3.4, 1]},
      {k: "duda", txt: t("Duda en los penaltis decisivos"), m: [1, hp, 1, 1, hp, 1]},
      {k: "esp", txt: t("Espera a que te tires"), m: [1, 1, 1, 1, 1, 1]}
    ];
    var tend = TEND[Math.min(TEND.length - 1, Math.floor(rand() * TEND.length))];
    var W0 = [0.09, 0.05, 0.08, 0.27, 0.15, 0.24], w = [], miss = [], z, sum = 0, edge;
    for (z = 0; z < 6; z++) { w[z] = W0[z] * tend.m[z]; sum += w[z]; }
    for (z = 0; z < 6; z++) {
      w[z] /= sum;
      edge = (z % 3 !== 1 ? 0.6 : 0.1) + (z < 3 ? 0.9 : 0.1);
      miss[z] = clamp(edge * (0.11 - 0.07 * sN) * (1 + 0.6 * pressure) * (tend.k === "duda" ? 1 + 1.5 * pressure : 1), 0, 0.5);
    }
    var q = 1 - 0.22 * sN + 0.08 * pressure;                      /* calidad del lanzamiento (menos = más parable) */
    function rc(i) { return {r: i < 3 ? 0 : 1, c: i % 3}; }
    function saveIf(d, tz, tf) {
      var a = rc(d), b = rc(tz), dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c), base;
      if (d === tz) return clamp((0.5 + 0.35 * gN + (b.c === 1 ? 0.08 : b.r === 0 ? -0.1 : 0)) * q * tf.sameF, 0, 0.95);
      if (dc === 0) base = 0.18 + 0.25 * gN;                      /* lado bueno, altura equivocada */
      else if (dc === 1 && dr === 0) base = 0.1 + 0.25 * gN;      /* zona contigua */
      else if (dc === 1) base = 0.05 + 0.1 * gN;                  /* diagonal */
      else return 0;
      return clamp(base * q * tf.reach, 0, 0.9);
    }
    function distFor(d, tf) {                                     /* si te tiras pronto, puede cambiar de lado */
      if (!tf.sw) return w;
      var a = [], s = 0, i, out = [];
      for (i = 0; i < 6; i++) { a[i] = w[i] * (i === d ? 0 : Math.abs(rc(i).c - rc(d).c) <= 1 ? 0.2 : 1); s += a[i]; }
      for (i = 0; i < 6; i++) out[i] = (1 - tf.sw) * w[i] + tf.sw * a[i] / (s || 1);
      return out;
    }
    function probFor(d, tf) {                                     /* P(no encajar) = fuera/palo + parada */
      var D = distFor(d, tf), p = 0, i;
      for (i = 0; i < 6; i++) p += D[i] * (miss[i] + (1 - miss[i]) * saveIf(d, i, tf));
      return clamp(p, 0.02, 0.97);
    }

    var ui = shell({cls: "mg-pen", gk: true, kicker: t("Bajo palos"), title: t("Penalti en contra"), chips: [[t("Portero"), gk], [t("Tirador"), skill]],
      barTitle: t("Reacción"), barLabs: [t("Pronto"), t("Justo"), t("Tarde")], priText: t("Elegir momento")});
    scoutLine(ui, tend.txt);
    var id = "mg" + (++uid), k;
    var svg = sv("svg", {viewBox: "0 0 360 300", role: "img", "aria-label": t("Portería"), "data-tend": tend.k});
    ui.stage.insertBefore(svg, ui.stage.firstChild);
    var defs = sv("defs", {}, svg);
    var netBack = penScene(svg, defs, id);
    var cellsG = sv("g", {"class": "mg-cells"}, svg), cw = (GX1 - GX0) / 3, ch = (GY1 - GY0) / 2, cells = [], info;
    for (z = 0; z < 6; z++) {
      info = {p: probFor(z, TF0), r: rc(z).r, c: rc(z).c};
      info.x = GX0 + info.c * cw; info.y = GY0 + info.r * ch; info.w = cw; info.h2 = ch;
      info.el = sv("rect", {"class": "mg-cell", x: info.x + 0.5, y: info.y + 0.5, width: cw - 1, height: ch - 1, fill: saveColor(info.p), "fill-opacity": ".3", stroke: "rgba(237,241,232,.14)", "stroke-width": 1, tabindex: 0, role: "button", "data-i": z,
        "aria-label": t("Probabilidad de parada: {p} %", {p: pct(info.p)})}, cellsG);
      cells.push(info);
    }
    var gkX = 180, gkY = GY1 - 1;
    var you = youTag(svg, 1);
    setBall(you, gkX, gkY + 1, 1);
    var gkG = keeperFig(svg);
    setGk(gkG, gkX, gkY, 1, 0);
    penPosts(svg);
    var labs = [];
    for (k = 0; k < 6; k++) {
      labs.push(sv("text", {"class": "mg-lab", x: cells[k].x + cw / 2, y: cells[k].r === 0 ? cells[k].y + ch / 2 + 4.5 : cells[k].y + ch - 9, "text-anchor": "middle"}, svg));
      labs[k].textContent = pct(cells[k].p) + "%";
    }
    sv("ellipse", {cx: PEN_X, cy: PEN_Y + 9, rx: 12, ry: 3.5, fill: "#000", opacity: ".35"}, svg);
    var ball = ballG(svg, 11);
    setBall(ball, PEN_X, PEN_Y, 1);
    var SH_X = 146, SH_Y = 297, shooter = shooterFig(svg);
    setBall(shooter, SH_X, SH_Y, 1.04);

    var sel = -1;
    function pick(i) {
      if (ui.state !== "aim") return;
      if (sel >= 0) { cells[sel].el.setAttribute("class", "mg-cell"); labs[sel].setAttribute("class", "mg-lab"); }
      sel = i;
      cells[i].el.setAttribute("class", "mg-cell on");
      labs[i].setAttribute("class", "mg-lab on");
      setProb(ui, LBL, cells[i].p, true);
      ui.pri.disabled = false;
    }
    cellsG.addEventListener("click", function (e) {
      var i = e.target && e.target.getAttribute && e.target.getAttribute("data-i");
      if (i != null) pick(+i);
    });
    cellsG.addEventListener("keydown", function (e) {
      var i = e.target.getAttribute("data-i");
      if (i != null && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(+i); }
    });
    setStep(ui, 1, t("Toca la zona a la que te vas a tirar"));
    setProb(ui, LBL, null);
    ui.pri.addEventListener("click", function () {
      if (ui.state === "aim" && sel >= 0) {
        cellsG.setAttribute("class", "mg-cells off");
        setStep(ui, 2, t("Tírate a tiempo: para la barra en la zona verde"));
        startPower(ui, pressure, dive, {btn: t("¡Tirarse!"), word: timingWord});
      } else if (ui.state === "power" && ui.pc) ui.pc.stop();
    });

    function dive(v) {
      var tf = timingFx(v, sN, tend.k === "esp"), p = probFor(sel, tf);
      var tz = pickW(distFor(sel, tf), rand()), how;
      if (rand() < miss[tz]) how = rand() < 0.35 ? "palo" : "fuera";
      else how = rand() < saveIf(sel, tz, tf) ? "parada" : "gol";
      setProb(ui, LBL, p, true);
      setStep(ui, 2, t("¡Atento!"));
      wait(650, function () { animate(how, sel, tz, v, tf, function () {
        showResult(ui, how, p, LBL, function () { finish(ui, {p: round2(p), saved: how === "parada", scored: how === "gol"}, done); });
      }); });
    }

    function animate(how, d, tz, v, tf, then) {
      var tc = cells[tz], dc = cells[d], col = tc.c;
      var tx = tc.x + tc.w / 2 + (rand() - 0.5) * tc.w * 0.5, ty = tc.y + tc.h2 / 2 + (rand() - 0.5) * tc.h2 * 0.45;
      if (how === "parada" && tz !== d) { tx = lerp(tx, dc.x + dc.w / 2, 0.45); ty = lerp(ty, dc.y + dc.h2 / 2, 0.45); }
      if (how === "gol" && tz === d) {                            /* te tiraste bien, pero la pone en el rincón */
        tx = tc.x + tc.w * (col === 0 ? 0.16 : col === 2 ? 0.84 : (rand() < 0.5 ? 0.2 : 0.8));
        ty = tc.y + tc.h2 * (tc.r === 0 ? 0.24 : 0.8);
      }
      if (how === "fuera") {
        if (tc.r === 0 || col === 1) { ty = GY0 - 18 - rand() * 10; tx += (tx - 180) * 0.15; }
        else tx = col === 0 ? GX0 - 20 : GX1 + 20;
      }
      var bar = how === "palo" && (col === 1 || (tc.r === 0 && rand() < 0.5));
      if (how === "palo") { if (bar) ty = GY0; else tx = col === 0 ? GX0 : GX1; }
      /* estirada: hacia el balón si paras; si no, hacia la zona elegida (más corta si llegas tarde) */
      var aim = how === "parada" ? {x: tx, y: ty} : {x: dc.x + dc.w / 2, y: dc.y + dc.h2 / 2};
      var side = how === "parada" ? (Math.abs(aim.x - 180) < 34 ? 0 : aim.x < 180 ? -1 : 1) : dc.c - 1;
      var reachV = how === "parada" ? 1 : (1 - 0.35 * tf.late) * (how === "gol" && tz === d ? 0.86 : 1);
      var rot, kdx, kdy, gl;
      if (side === 0) { rot = 0; kdx = clamp(aim.x - gkX, -24, 24); kdy = aim.y < GY0 + ch ? -clamp(GY1 - aim.y - 62, 0, 70) : 0; }
      else {
        rot = side * (28 + 52 * clamp((aim.y - GY0) / (GY1 - GY0), 0, 1));
        gl = gloveAt(side, rot);
        kdx = aim.x - gkX - gl.x; kdy = Math.min(0, aim.y - gkY - gl.y);
      }
      kdx *= reachV; kdy *= reachV;
      var RUN = 300, kDelay = 110 + 440 * v;                      /* pronto: te mueves antes del golpeo */
      tween(RUN, function (kk) { setBall(shooter, lerp(SH_X, SH_X + 20, easeOut(kk)), lerp(SH_Y, SH_Y - 5, kk), 1.04); });
      tween(430, function (kk) {
        var e = easeOut(kk);
        you.setAttribute("opacity", (1 - e).toFixed(2));
        setGk(gkG, gkX + kdx * e, gkY + kdy * Math.sin(e * Math.PI * 0.6) / Math.sin(Math.PI * 0.6), 1, rot * reachV * e);
      }, null, kDelay);
      var sx = PEN_X, sy = PEN_Y, mx = (sx + tx) / 2, my = Math.min(sy, ty) - 26;
      tween(540, function (kk) {
        var e = 1 - Math.pow(1 - kk, 1.6), a = 1 - e;
        setBall(ball, a * a * sx + 2 * a * e * mx + e * e * tx, a * a * sy + 2 * a * e * my + e * e * ty, lerp(1, 0.6, e));
      }, function () {
        if (how === "gol") {
          tc.el.setAttribute("class", "mg-cell mg-hit");
          netBack.setAttribute("transform", "translate(" + ((tx - 180) * 0.02).toFixed(1) + " -2)");
          tween(220, function (kk) { setBall(ball, tx + (180 - tx) * 0.05 * kk, ty + 6 * kk, lerp(0.6, 0.52, kk)); }, then);
        } else if (how === "parada") {
          var dx = (side || (tx < 180 ? -1 : 1)) * 85;
          tween(320, function (kk) { var e = easeOut(kk); setBall(ball, tx + dx * e, ty - 60 * e + 40 * kk * kk, lerp(0.6, 0.5, kk)); }, then);
        } else if (how === "palo") {
          var px = bar ? (tx - 180) * 0.3 : (tx < 180 ? -34 : 34);
          tween(420, function (kk) { var e = easeOut(kk); setBall(ball, tx + px * e, ty + (bar ? 95 : 70) * e - 30 * Math.sin(kk * Math.PI), lerp(0.6, 0.78, e)); }, then);
        } else {
          tween(200, function (kk) { setBall(ball, tx + (tx - 180) * 0.1 * kk, ty - 8 * kk, lerp(0.6, 0.48, kk)); }, then);
        }
      }, RUN);
    }
    return {close: function () { finish(ui, null, null); }};
  }

  /* ================= PORTERO: FALTA DIRECTA ================= */
  function gkFreekick(opt, done) {
    opt = opt || {};
    var gk = num(opt.gk, 70), skill = num(opt.skill, 70), dist = clamp(num(opt.dist, 22), 16, 35), pressure = clamp(num(opt.pressure, 0.4), 0, 1);
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random;
    var sN = clamp((skill - 40) / 55, 0, 1), gN = clamp((gk - 40) / 55, 0, 1), LBL = GK_LBL;
    var ui = shell({cls: "mg-fk mg-gkf", gk: true, steps: 3, kicker: t("Bajo palos"), title: t("Falta en contra"), sec: t("Atrás"),
      chips: [[t("Portero"), gk], [t("Tirador"), skill], [t("Distancia"), t("{n} m", {n: Math.round(dist)})]],
      barTitle: t("Reacción"), barLabs: [t("Pronto"), t("Justo"), t("Tarde")], priText: t("Colocarme")});
    var id = "mg" + (++uid);
    var gs = sAt(dist), gw = 7.32 * gs, gh = 2.44 * gs, gy1 = yAt(dist), gy0 = gy1 - gh, gx0 = 180 - gw / 2, gx1 = 180 + gw / 2;
    var wy = yAt(9.15), wsc = sAt(9.15), pw = 0.5 * wsc, wh = 1.16 * wsc, wTop = wy - wh;
    var kf = (BALL_Y - gy1) / (BALL_Y - wy), ks = gs / 57, kY = gy1 - 0.5;
    function proj(x) { return 180 + (x - 180) * kf; }           /* x de la barrera → x en la línea de gol (sombra) */
    function unproj(x) { return 180 + (x - 180) / kf; }
    var st = {n: 4, mode: "L", wc: 180, uk: 0.5};
    function wallEdges() {
      var ww = st.n * pw, x0;
      if (st.mode === "L") x0 = unproj(gx0) - 10;
      else if (st.mode === "R") x0 = unproj(gx1) + 10 - ww;
      else if (st.mode === "C") x0 = 180 - ww / 2;
      else x0 = st.wc - ww / 2;
      return {x0: x0, x1: x0 + ww};
    }
    var svg = sv("svg", {viewBox: "0 0 " + FK_W + " " + FK_H, role: "img", "aria-label": t("Campo"),
      "data-goal": [gx0, gy0, gx1, gy1].map(function (v) { return v.toFixed(1); }).join(",")});
    ui.stage.insertBefore(svg, ui.stage.firstChild);
    var defs = sv("defs", {}, svg);
    var netBack = fkScene(svg, defs, id, dist);
    var clip = sv("clipPath", {id: id + "gc"}, defs);
    sv("rect", {x: gx0, y: gy0, width: gw, height: gh}, clip);
    var covG = sv("g", {"clip-path": "url(#" + id + "gc)", "class": "mg-deco"}, svg);
    var band = sv("rect", {x: 0, y: (gy1 - gh * 0.5).toFixed(1), width: 0, height: (gh * 0.5).toFixed(1), fill: "rgba(102,185,255,.22)", stroke: "rgba(102,185,255,.75)", "stroke-width": 1.2, "stroke-dasharray": "3 3"}, covG);
    var reachE = sv("ellipse", {cx: 180, cy: (gy1 - 0.3 * gh).toFixed(1), rx: 10, ry: 10, fill: "rgba(63,207,124,.16)", stroke: "rgba(63,207,124,.7)", "stroke-width": 1.2, "stroke-dasharray": "4 3"}, covG);
    var you = youTag(svg, ks * 1.15);
    you.lastChild.setAttribute("y", (-86 * ks - 3).toFixed(1));   /* rótulo sobre la cabeza: la barrera tapa los pies */
    var gkG = keeperFig(svg);
    var pst = Math.max(3, gs * 0.12);
    sv("path", {d: "M" + gx0.toFixed(1) + " " + (gy1 + 1).toFixed(1) + " V" + gy0.toFixed(1) + " H" + gx1.toFixed(1) + " V" + (gy1 + 1).toFixed(1), fill: "none", stroke: "#f4f6f0", "stroke-width": pst.toFixed(1), "class": "mg-deco"}, svg);
    var spray = sv("path", {d: "", stroke: "rgba(255,255,255,.75)", "stroke-width": 2, "stroke-dasharray": "1 3", "stroke-linecap": "round"}, svg);
    var wallG = sv("g", {"class": "mg-deco"}, svg);
    sv("ellipse", {cx: 180, cy: BALL_Y + 10, rx: 13, ry: 4, fill: "#000", opacity: ".35"}, svg);
    var ball = ballG(svg, 12);
    setBall(ball, 180, BALL_Y, 1);
    var SH_X = 142, SH_Y = 401, shooter = shooterFig(svg);
    setBall(shooter, SH_X, SH_Y, 1);

    /* ---- modelo: el tirador elige entre 12 puntos (6 × raso/alto) el que mejor le sale ---- */
    var US = [0.07, 0.24, 0.41, 0.59, 0.76, 0.93], VS = [0.2, 0.78];
    var distF = 1 - 0.5 * clamp((dist - 18) / 12, 0, 1.2), qf = (0.5 + 0.5 * sN) * distF;
    var R0 = (1.45 + 1.2 * gN) * (0.85 + 0.35 * clamp((dist - 16) / 19, 0, 1));
    function model(tf) {
      var e = wallEdges(), u0 = st.n ? (proj(e.x0) - gx0) / gw : 9, u1 = st.n ? (proj(e.x1) - gx0) / gw : -9;
      /* más jugadores: tapan más pero te quitan visión (screen) y dejan rivales libres para el rechace (unm);
         sin barrera el tirador elige rincón y le pega limpio (qN) */
      var screen = 1 - 0.01 * st.n - 0.006 * st.n * st.n, unm = 1 - 0.035 * Math.max(0, st.n - 3), T = 0.15 - 0.07 * sN;
      var qN = st.n ? qf : Math.min(1, qf * 1.3);
      var list = [], i, j, o, tot = 0, p = 0;
      for (j = 0; j < VS.length; j++) for (i = 0; i < US.length; i++) {
        o = {u: US[i], v: VS[j], hi: j === 1};
        o.inS = o.u >= u0 - 0.02 && o.u <= u1 + 0.02;
        var near = !o.inS && o.u >= u0 - 0.08 && o.u <= u1 + 0.08;
        o.blk = o.inS ? (o.hi ? 0.32 - 0.1 * sN : 0.88) : near ? (o.hi ? 0.05 : 0.22) : 0;
        var edge = clamp(1 - Math.min(o.u, 1 - o.u, 1 - o.v) / 0.14, 0, 1) * (0.45 - 0.3 * sN);
        var overW = o.inS && o.hi ? 0.22 * (1 - 0.5 * sN) : 0, far = 0.08 * clamp((dist - 20) / 15, 0, 1);
        o.miss = 1 - (1 - edge) * (1 - overW) * (1 - far);
        var R = R0 * screen * (o.inS && o.hi ? 1 - 0.03 * st.n : 1) * tf.reach;
        var dx = (o.u - st.uk) * 7.32, dy = Math.max(0, o.v - 0.3) * 2.44 * 0.9, d = Math.sqrt(dx * dx + dy * dy);
        var s0 = clamp((0.78 + 0.15 * gN) * Math.exp(-0.5 * (d / R) * (d / R)) * tf.sameF * unm, 0, 0.95);
        o.save = 1 - (1 - s0) * qN;
        o.pg = (1 - o.blk) * (1 - o.miss) * (1 - o.save);
        o.w = Math.exp(o.pg / T); tot += o.w;
        list.push(o);
      }
      for (i = 0; i < list.length; i++) list[i].w /= tot;
      if (tf.sw) {                                                /* pronto: busca el lado contrario a donde vas */
        var a = [], s = 0;
        for (i = 0; i < list.length; i++) { a[i] = list[i].w * Math.pow(clamp(Math.abs(list[i].u - st.uk) / 0.45, 0.05, 1), 2); s += a[i]; }
        for (i = 0; i < list.length; i++) list[i].w = (1 - tf.sw) * list[i].w + tf.sw * a[i] / (s || 1);
      }
      for (i = 0; i < list.length; i++) p += list[i].w * (1 - list[i].pg);
      return {p: clamp(p, 0.02, 0.97), list: list, u0: u0, u1: u1, R: R0 * screen * tf.reach};
    }

    /* ---- panel de colocación ---- */
    var set = hv("div", "mg-set");
    ui.box.insertBefore(set, ui.pow);
    ui.pow.style.display = "none";
    var rowN = hv("div", "mg-row", set);
    hv("span", "mg-rowl", rowN, t("Jugadores en barrera"));
    var stp = hv("div", "mg-stp", rowN);
    var minus = hv("button", "mg-sb", stp, "−"), nVal = hv("span", "mg-sv", stp, ""), plus = hv("button", "mg-sb", stp, "+");
    minus.type = plus.type = "button";
    minus.setAttribute("aria-label", t("Quitar jugador"));
    plus.setAttribute("aria-label", t("Añadir jugador"));
    nVal.setAttribute("aria-live", "polite");
    var rowP = hv("div", "mg-row", set), posL = hv("span", "mg-rowl", rowP, t("Barrera")), seg = hv("div", "mg-seg", rowP);
    var segB = [t("Palo izq."), t("Centro"), t("Palo der.")].map(function (txt, i) {
      var b = hv("button", "", seg, txt);
      b.type = "button";
      b.addEventListener("click", function () { segPick(i); });
      return b;
    });

    function drawWall() {
      while (wallG.firstChild) wallG.removeChild(wallG.firstChild);
      var e = wallEdges(), i;
      for (i = 0; i < st.n; i++) wallMan(wallG, e.x0 + pw * (i + 0.5), wy, pw, wh, i);
      spray.setAttribute("d", st.n ? "M" + (e.x0 - 14).toFixed(1) + " " + (wy + 3).toFixed(1) + " H" + (e.x1 + 14).toFixed(1) : "");
      var b0 = clamp(proj(e.x0), gx0, gx1), b1 = clamp(proj(e.x1), gx0, gx1);
      band.setAttribute("x", b0.toFixed(1));
      band.setAttribute("width", st.n ? Math.max(0, b1 - b0).toFixed(1) : 0);
    }
    function refresh(pop) {
      drawWall();
      var kx = gx0 + st.uk * gw, m = model(TF0), rr = m.R * gs;
      setGk(gkG, kx, kY, ks, 0);
      setBall(you, kx, kY + 1, 1);
      reachE.setAttribute("cx", kx.toFixed(1));
      reachE.setAttribute("rx", rr.toFixed(1));
      reachE.setAttribute("ry", (rr / 0.9).toFixed(1));
      nVal.textContent = String(st.n);
      minus.disabled = ui.state !== "wall" || st.n <= 0;
      plus.disabled = ui.state !== "wall" || st.n >= 6;
      var cur = ui.state === "pos" ? (st.uk < 0.3 ? 0 : st.uk > 0.7 ? 2 : Math.abs(st.uk - 0.5) < 0.03 ? 1 : -1) : {L: 0, C: 1, R: 2}[st.mode];
      segB.forEach(function (b, i) { b.className = i === cur ? "on" : ""; b.disabled = ui.state === "wall" && !st.n; });
      setProb(ui, LBL, m.p, pop);
      return m;
    }
    function segPick(i) {
      if (ui.state === "wall") { if (!st.n) return; st.mode = ["L", "C", "R"][i]; }
      else if (ui.state === "pos") st.uk = [0.2, 0.5, 0.8][i];
      else return;
      refresh(true);
    }
    minus.addEventListener("click", function () { if (ui.state === "wall" && st.n > 0) { st.n--; refresh(true); } });
    plus.addEventListener("click", function () { if (ui.state === "wall" && st.n < 6) { st.n++; refresh(true); } });
    function moveBy(dir) {
      if (ui.state === "wall" && st.n) { var e = wallEdges(); st.wc = clamp((e.x0 + e.x1) / 2 + dir * 8, unproj(gx0) - pw * 2, unproj(gx1) + pw * 2); st.mode = null; }
      else if (ui.state === "pos") st.uk = clamp(st.uk + dir * 0.05, 0.05, 0.95);
      else return false;
      refresh(false);
      return true;
    }
    ui.ov.addEventListener("keydown", function (e) {
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && moveBy(e.key === "ArrowLeft" ? -1 : 1)) e.preventDefault();
    });
    /* arrastrar en el campo: mueve la barrera (paso 1) o al portero (paso 2) */
    var dragging = false, pid = null;
    function svgX(e) {
      var m = svg.getScreenCTM(), pt;
      if (!m) return 180;
      pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(m.inverse()).x;
    }
    function applyX(x) {
      if (ui.state === "wall") { if (!st.n) return; st.mode = null; st.wc = clamp(x, unproj(gx0) - pw * 2, unproj(gx1) + pw * 2); }
      else if (ui.state === "pos") st.uk = clamp((x - gx0) / gw, 0.05, 0.95);
      refresh(false);
    }
    svg.addEventListener("pointerdown", function (e) {
      if (ui.state !== "wall" && ui.state !== "pos") return;
      e.preventDefault();
      dragging = true; pid = e.pointerId;
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      applyX(svgX(e));
    });
    svg.addEventListener("pointermove", function (e) { if (dragging && e.pointerId === pid) applyX(svgX(e)); });
    function up(e) { if (!dragging || e.pointerId !== pid) return; dragging = false; refresh(true); }
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);

    function toWall() {
      ui.state = "wall";
      rowN.style.display = "";
      posL.textContent = t("Barrera");
      setStep(ui, 1, t("Monta la barrera: jugadores y posición"));
      ui.pri.textContent = t("Colocarme");
      ui.pri.disabled = false;
      ui.sec.disabled = true;
      refresh(true);
    }
    function toPos() {
      ui.state = "pos";
      rowN.style.display = "none";
      posL.textContent = t("Tu posición");
      setStep(ui, 2, t("Colócate: arrastra por la portería"));
      ui.pri.textContent = t("Elegir momento");
      ui.sec.disabled = false;
      refresh(true);
    }
    ui.sec.addEventListener("click", function () { if (ui.state === "pos") toWall(); });
    ui.pri.addEventListener("click", function () {
      if (ui.state === "wall") toPos();
      else if (ui.state === "pos") {
        set.style.display = "none";
        ui.pow.style.display = "";
        setStep(ui, 3, t("Tírate a tiempo: para la barra en la zona verde"));
        startPower(ui, pressure, dive, {btn: t("¡Tirarse!"), word: timingWord});
      } else if (ui.state === "power" && ui.pc) ui.pc.stop();
    });
    toWall();

    function dive(v) {
      var tf = timingFx(v, sN, false), m = model(tf), p = m.p;
      var ws = m.list.map(function (o) { return o.w; }), o = m.list[pickW(ws, rand())], r = rand(), how;
      var a = o.blk, b = a + (1 - o.blk) * o.miss, c = b + (1 - o.blk) * (1 - o.miss) * o.save;
      how = r < a ? "barrera" : r < b ? "fuera" : r < c ? "parada" : "gol";
      setProb(ui, LBL, p, true);
      setStep(ui, 3, t("¡Atento!"));
      wait(650, function () { animate(how, o, v, m, function () {
        showResult(ui, how, p, LBL, function () { finish(ui, {p: round2(p), saved: how === "parada", scored: how === "gol"}, done); });
      }); });
    }

    function animate(how, o, v, m, then) {
      var u = clamp(o.u + (rand() - 0.5) * 0.1, 0.04, 0.96), vv = clamp(o.v + (rand() - 0.5) * 0.16, 0.08, 0.9);
      var A = {x: 180, y: BALL_Y}, E = {x: gx0 + u * gw, y: gy1 - vv * gh}, s = (BALL_Y - wy) / (BALL_Y - gy1), e = wallEdges();
      var wc = (e.x0 + e.x1) / 2, Lx = lerp(A.x, E.x, s);
      var curl = (st.n && !o.inS ? (Lx < wc ? -1 : 1) : (E.x < 180 ? 1 : -1)) * (8 + 8 * rand());
      var Wp = {x: Lx + curl, y: lerp(A.y, E.y, s) - 14};
      if (st.n && o.inS) Wp.y = Math.min(Wp.y, wTop - 7 - rand() * 5);   /* por encima de la barrera */
      if (how === "fuera") { if (o.hi) E.y = gy0 - 10 - gs * 0.35; else E.x = u < 0.5 ? gx0 - 14 : gx1 + 14; }
      if (how === "barrera") {                                     /* golpea en la barrera: arriba (saltan) o abajo */
        E = {x: clamp(Lx, e.x0 + pw * 0.3, e.x1 - pw * 0.3), y: o.hi ? wTop + wh * 0.14 : wy - wh * 0.55};
        Wp = {x: lerp(A.x, E.x, 0.5) + curl * 0.5, y: lerp(A.y, E.y, 0.5) - 18};
        s = 0.5;
      }
      var C = {x: (Wp.x - (1 - s) * (1 - s) * A.x - s * s * E.x) / (2 * s * (1 - s)), y: (Wp.y - (1 - s) * (1 - s) * A.y - s * s * E.y) / (2 * s * (1 - s))};
      function at(k) { var a = 1 - k; return {x: a * a * A.x + 2 * a * k * C.x + k * k * E.x, y: a * a * A.y + 2 * a * k * C.y + k * k * E.y}; }
      var endScale = how === "barrera" ? lerp(1, clamp(gs / 70, 0.3, 0.55), (BALL_Y - wy) / (BALL_Y - gy1)) : clamp(gs / 70, 0.3, 0.55);
      var dur = how === "barrera" ? 620 : 980, RUN = 300;
      /* portero */
      var kx = gx0 + st.uk * gw, tgt = {x: clamp(E.x, gx0 + 8, gx1 - 8), y: clamp(E.y, gy0 + 6, gy1)}, side = tgt.x < kx ? -1 : 1;
      var rot = side * (28 + 52 * clamp((tgt.y - gy0) / gh, 0, 1)), gl = gloveAt(side, rot);
      var kdx = tgt.x - kx - gl.x * ks, kdy = Math.min(0, tgt.y - kY - gl.y * ks);
      var reach = how === "parada" ? 1 : how === "barrera" ? 0.12 : how === "fuera" ? 0.5 : clamp(m.R * gs * 1.1 / Math.max(1, Math.abs(tgt.x - kx)), 0.25, 0.85);
      if (how === "parada" && Math.abs(tgt.x - kx) < gw * 0.07) { rot = 0; kdx = tgt.x - kx; kdy = Math.min(0, tgt.y - kY + 60 * ks); }
      tween(RUN, function (kk) { setBall(shooter, lerp(SH_X, SH_X + 22, easeOut(kk)), lerp(SH_Y, SH_Y - 6, kk), 1); });
      tween(dur * 0.5, function (kk) {
        var ee = easeOut(kk);
        you.setAttribute("opacity", (1 - ee).toFixed(2));
        setGk(gkG, kx + kdx * reach * ee, kY + kdy * reach * Math.sin(ee * 2) / Math.sin(2), ks, rot * reach * ee);
      }, null, RUN + dur * (0.12 + 0.5 * v));
      tween(dur, function (kk) {
        var ee = Math.pow(kk, 0.85), q = at(ee);
        setBall(ball, q.x, q.y, lerp(1, endScale, Math.pow(ee, 0.6)));
      }, function () {
        var q = at(1), s0 = endScale;
        if (how === "gol") {
          netBack.setAttribute("class", "mg-hit");
          netBack.setAttribute("transform", "translate(0 -1.5)");
          tween(220, function (kk) { setBall(ball, q.x, q.y + 4 * kk, lerp(s0, s0 * 0.85, kk)); }, then);
        } else if (how === "parada") {
          var dx = (q.x < kx ? -1 : 1) * 60;
          tween(340, function (kk) { var ee = easeOut(kk); setBall(ball, q.x + dx * ee, q.y - 30 * ee + 45 * kk * kk, s0); }, then);
        } else if (how === "barrera") {
          var bx = (q.x < 180 ? -1 : 1) * 25;
          tween(120, function (kk) { wallG.setAttribute("transform", "translate(0 " + (-5 * Math.sin(kk * Math.PI)).toFixed(1) + ")"); });
          tween(420, function (kk) { var ee = easeOut(kk); setBall(ball, q.x + bx * ee, q.y + 110 * ee - 40 * Math.sin(kk * Math.PI), lerp(s0, 0.8, ee)); }, then);
        } else {
          var ox = q.x < gx0 ? -1 : q.x > gx1 ? 1 : 0;
          tween(200, function (kk) { setBall(ball, q.x + ox * 10 * kk, q.y - (ox ? 0 : 10) * kk, s0 * (1 - 0.15 * kk)); }, then);
        }
      }, RUN);
    }
    return {close: function () { finish(ui, null, null); }};
  }

  return {penalty: withPress(penalty), freekick: withPress(freekick), gkPenalty: withPress(gkPenalty), gkFreekick: withPress(gkFreekick)};
})();
