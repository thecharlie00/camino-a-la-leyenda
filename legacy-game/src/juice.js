/* «Juice»: respuesta visual a lo que hace el jugador, con las herramientas de Anim (partículas de píxel, pop, temblor,
   textos flotantes, cuenta de números). No cambia nada del juego: solo cómo se siente. Respeta «reducir movimiento». */
(function () {
  if (typeof window === "undefined" || typeof Anim === "undefined" || !window.UIX || !window.UIX.add) return;
  var GOLD = ["#ffb21e", "#fff0b8", "#ffffff"], GREEN = ["#3fcf7c", "#b8ffd2", "#ffb21e"], RED = ["#ff5a4f", "#ffb0a8", "#5a1a16"];
  var tap = null, lastId = null, lastTab = null, lastView = null, lastTro = null, lastUid = null;

  function rectOf(el) { var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; return r && r.width ? r : null; }
  /* chispas donde tocas al elegir */
  function spark(x, y, cols, n) { Anim.burst(x, y, {n: n || 8, colors: cols || GOLD, speed: 170, gravity: 380, life: 0.5, size: 4, keep: false}); }

  document.addEventListener("pointerdown", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-a="choose"], [data-a="advance"], .go, .btn.primary') : null;
    if (!b || b.disabled) return;
    tap = {t: Date.now(), x: ev.clientX, y: ev.clientY, a: b.getAttribute("data-a")};
    if (tap.a === "choose") spark(ev.clientX, ev.clientY, GOLD, 14);
  }, true);

  /* textos de los chips del resultado subiendo desde su sitio, uno tras otro */
  function floatChips(card, max) {
    var chips = card.querySelectorAll(".chips .chip, .chips span");
    var n = 0;
    Array.prototype.forEach.call(chips, function (c, i) {
      if (n >= max) return;
      var r = rectOf(c); if (!r) return;
      var cls = /\bdown\b|\bbad\b|\bneg\b/.test(c.className) ? "bad" : /\bup\b|\bgood\b|\bpos\b/.test(c.className) ? "good" : "";
      if (!cls) return;
      n++;
      setTimeout(function () { Anim.floatText(c.textContent.trim(), r.left + r.width / 2, r.top, cls + " fxchip"); }, 160 + i * 150);
      Anim.pop(c, {from: 0.5, dur: 340, delay: 120 + i * 80});
    });
  }
  function good(card, r, big) {
    Anim.pop(card, {from: 0.92, dur: 380});
    Anim.burst(r.left + r.width / 2, r.top + 24, {n: big ? 34 : 20, confetti: true, colors: GREEN, speed: big ? 300 : 230, gravity: 520, life: 0.9, size: 5});
  }
  function bad(card, r) {
    Anim.shake(card, {amp: 9, n: 7, dur: 320});
    var app = document.getElementById("app"); if (app) Anim.shake(app, {amp: 3, n: 4, dur: 200});
    Anim.burst(r.left + r.width / 2, r.top + 24, {n: 12, colors: RED, speed: 160, gravity: 640, life: 0.6, size: 4});
  }
  function mood(c) {
    if (!c) return null;
    if (c.t === "decision" || c.t === "moment") return c.good === true ? "good" : c.good === false ? "bad" : "neutral";
    if (c.t === "mblock" && c.st) return c.st.w > c.st.l ? "good" : c.st.w < c.st.l ? "bad" : "neutral";
    if (c.t === "block" && c.st && c.st.rn) { var avg = c.st.rs / c.st.rn; return avg >= 7 ? "good" : avg < 6 ? "bad" : "neutral"; }
    if (c.t === "transfer" || c.t === "mjob") return "good";
    if (c.t === "msacked") return "bad";
    return "neutral";
  }
  /* la tarjeta nueva de la portada: cómo ha salido lo que acabas de hacer */
  function juiceCard() {
    var el = document.querySelector("#main .card.flash");
    if (!el || !S || !S.feed || !S.feed[0]) return;
    var c = S.feed[0];
    if (c.id === lastId) return;
    var r = rectOf(el); if (!r) return;
    lastId = c.id;
    var m = mood(c), fresh = tap && Date.now() - tap.t < 2500;
    if (!fresh) return; /* solo como respuesta a algo que acabas de hacer, no al cargar una partida */
    /* si la tarjeta del resultado queda fuera de la pantalla (otra decisión encima), el resultado sale donde tocaste */
    var vh = window.innerHeight || 800;
    if (r.top > vh - 40 || r.bottom < 60) {
      var x = tap.x || window.innerWidth / 2, y = Math.max(90, Math.min(vh - 120, tap.y || vh / 2));
      if (m === "good") Anim.burst(x, y, {n: 22, confetti: true, colors: GREEN, speed: 240, gravity: 520, life: 0.9, size: 5});
      else if (m === "bad") { Anim.burst(x, y, {n: 12, colors: RED, speed: 160, gravity: 640, life: 0.6, size: 4}); var ap = document.getElementById("app"); if (ap) Anim.shake(ap, {amp: 3, n: 4, dur: 200}); }
      var k = 0;
      (c.chips || []).forEach(function (ch) {
        if (k >= 3 || !ch) return;
        var tmp = document.createElement("div"); tmp.innerHTML = window.UIX.chipHtml ? window.UIX.chipHtml(ch) : "";
        var t = tmp.textContent.trim(), cn = tmp.firstChild && tmp.firstChild.className || "";
        var cls = /\bup\b/.test(cn) ? "good" : /\bdown\b/.test(cn) ? "bad" : ""; if (!t || !cls) return;
        var i = k++;
        setTimeout(function () { Anim.floatText(t, x, y - i * 34, cls + " fxchip"); }, 140 + i * 150);
      });
      tap = null; return;
    }
    if (m === "good") { good(el, r, c.t === "transfer" || c.t === "mjob"); floatChips(el, 3); }
    else if (m === "bad") { bad(el, r); floatChips(el, 3); }
    else Anim.pop(el, {from: 0.95, dur: 300});
    /* resultado de un tramo: los números del marcador cuentan hacia arriba */
    if ((c.t === "block" || c.t === "mblock") && fresh) {
      var nums = el.querySelectorAll(".num, b");
      Array.prototype.forEach.call(nums, function (n, i) {
        var v = +n.textContent.replace(/[^\d]/g, ""); if (!v || v > 999 || /[^\d\s]/.test(n.textContent.trim())) return;
        Anim.countUp(n, 0, v, {dur: 500 + i * 60, delay: 150, bounce: false});
      });
    }
    tap = null;
  }
  /* al cambiar de pestaña, el contenido entra en cascada */
  function juiceTab() {
    var ui = window.UIX.ui ? window.UIX.ui() : null; if (!ui) return;
    var key = ui.view + "|" + (ui.tab || "");
    if (key === lastTab) return;
    var first = lastTab === null; lastTab = key;
    if (first) return;
    var stack = document.querySelector("#main .stack") || document.getElementById("main");
    if (stack) Anim.stagger(stack.children, {max: 8, step: 40, dy: 12});
  }
  /* título nuevo: golpe de pantalla y lluvia dorada desde la cabecera (el sonido y el modal ya existen) */
  function juiceTrophy() {
    if (!S) { lastUid = null; return; }
    var who = S.mode === "mgr" ? S.m : S.p, n = who && who.trophies ? who.trophies.length : 0;
    if (lastUid !== S.uid) { lastUid = S.uid; lastTro = n; return; }
    if (n > lastTro) {
      Anim.hitStop(120);
      var app = document.getElementById("app"); if (app) Anim.shake(app, {amp: 6, n: 6, dur: 300});
      var h = rectOf(document.querySelector("header.top"));
      if (h) { Anim.burst(h.left + h.width / 2, h.bottom, {n: 40, confetti: true, colors: GOLD, speed: 340, gravity: 600, life: 1.1, size: 6, angle: Math.PI / 2, spread: Math.PI * 0.9}); }
    }
    lastTro = n;
  }
  /* la media de la cabecera (jugador): al subir, rig.js ya cuenta y lanza confeti; aquí sumamos el «+N».
     Al bajar no había nada: cuenta hacia abajo, temblor y «−N». */
  var lastOvr = null, lastOvrUid = null;
  function juiceOvr() {
    var el = document.querySelector("header.top .ovr .num");
    if (!S || S.mode === "mgr" || !S.p || !el || typeof ovrInt !== "function") { lastOvrUid = null; return; }
    var v = ovrInt(), key = S.uid;
    if (lastOvrUid !== key) { lastOvrUid = key; lastOvr = v; return; }
    if (v === lastOvr) return;
    var from = lastOvr, r = rectOf(el.parentNode); lastOvr = v;
    if (!r) return;
    var d = v - from, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (d > 0) Anim.floatText("+" + d, cx + r.width * 0.8, cy, "good");
    else {
      Anim.countUp(el, from, v, {dur: 520, bounce: false});
      Anim.shake(el.parentNode, {amp: 5, n: 6, dur: 300});
      Anim.burst(cx, cy, {n: 10, colors: RED, speed: 140, gravity: 500, life: 0.5, size: 3});
      Anim.floatText("−" + Math.abs(d), cx + r.width * 0.8, cy, "bad");
    }
  }
  function run() { [juiceCard, juiceTrophy, juiceOvr].forEach(function (f) { try { f(); } catch (e) { if (window.console && console.warn) console.warn("juice", e && e.message); } }); }
  window.UIX.add("after", function () {
    try { juiceTab(); } catch (e) {}
    try { if (window.requestAnimationFrame) requestAnimationFrame(function () { run(); }); else run(); } catch (e) {}
  });
})();
