/* anim.js — utilidades de animación compartidas (5.6).
   Todo va por tiempo real (delta time), nunca por fotogramas: igual a 30, 60 o 120 Hz.
   - Anim.ease.*            curvas (salida, entrada/salida, retroceso, rebote, elástica)
   - Anim.tween(o)          interpola un valor; o = {from, to, dur, ease, delay, update(v, k), done}
   - Anim.loop(fn)          bucle continuo fn(dt, t); devuelve una función para pararlo
   - Anim.seq(steps, done)  secuencia de pasos [dur, fn(k)] o funciones instantáneas
   - Anim.shake(el, o)      sacudida corta de un elemento (se omite con animaciones reducidas)
   - Anim.countUp(el, a, b, o) número que sube con rebote final
   - Anim.pop(el, o)        entrada con escala y overshoot
   - Anim.stagger(els, o)   aparición escalonada
   - Anim.burst(x, y, o)    partículas en una capa compartida con pool fijo (sin objetos por fotograma)
   - Anim.floatText(t, x, y, cls) texto flotante que sube y se desvanece
   - Anim.hitStop(ms)       congela por unos instantes los tweens que lo respetan
   - Anim.haptic(kind)      vibración corta ("tap", "ok", "bad", "big"): Android nativo, navegador si hay, nada si no
   - Anim.reduced()         animaciones reducidas (ajuste del juego o preferencia del sistema)
   Las animaciones decorativas nunca bloquean: se pueden saltar o se apagan solas. */
var Anim = (function () {
  "use strict";
  var PI = Math.PI;
  var ease = {
    linear: function (k) { return k; },
    inQuad: function (k) { return k * k; },
    outQuad: function (k) { return k * (2 - k); },
    inOutQuad: function (k) { return k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k; },
    outCubic: function (k) { k -= 1; return k * k * k + 1; },
    inCubic: function (k) { return k * k * k; },
    inOutCubic: function (k) { return k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1; },
    outQuart: function (k) { k -= 1; return 1 - k * k * k * k; },
    inOutSine: function (k) { return -(Math.cos(PI * k) - 1) / 2; },
    outBack: function (k) { var s = 1.70158; k -= 1; return k * k * ((s + 1) * k + s) + 1; },
    inBack: function (k) { var s = 1.70158; return k * k * ((s + 1) * k - s); },
    outElastic: function (k) { if (k === 0 || k === 1) return k; return Math.pow(2, -10 * k) * Math.sin((k - 0.075) * (2 * PI) / 0.3) + 1; },
    outBounce: function (k) {
      if (k < 1 / 2.75) return 7.5625 * k * k;
      if (k < 2 / 2.75) { k -= 1.5 / 2.75; return 7.5625 * k * k + 0.75; }
      if (k < 2.5 / 2.75) { k -= 2.25 / 2.75; return 7.5625 * k * k + 0.9375; }
      k -= 2.625 / 2.75; return 7.5625 * k * k + 0.984375;
    }
  };
  /* curvas CSS equivalentes para la Web Animations API */
  var CSS = {out: "cubic-bezier(.22,1,.36,1)", back: "cubic-bezier(.34,1.56,.64,1)", inOut: "cubic-bezier(.65,0,.35,1)", in: "cubic-bezier(.55,0,1,.45)"};

  /* ---------- preferencias ---------- */
  var mq = null;
  try { mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null; } catch (e) {}
  function pref() { try { return JSON.parse(localStorage.getItem("camino.a11y") || "{}"); } catch (e) { return {}; } }
  var prefCache = null, prefAt = 0;
  function prefs() { var n = Date.now(); if (!prefCache || n - prefAt > 1500) { prefCache = pref(); prefAt = n; } return prefCache; }
  function reduced() { var o = prefs(); if (o.rm === 1) return true; if (o.rm === 2) return false; return !!(mq && mq.matches); }
  function invalidate() { prefCache = null; }

  /* ---------- reloj compartido ---------- */
  var tasks = [], running = false, last = 0, frozenUntil = 0, raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function frame(t) {
    var tn = now(), dt = Math.min(0.1, Math.max(0, (tn - last) / 1000)); last = tn;
    var frozen = tn < frozenUntil;
    for (var i = tasks.length - 1; i >= 0; i--) {
      var k = tasks[i];
      if (k.dead) { tasks.splice(i, 1); continue; }
      if (frozen && k.stops) continue;
      try { if (k.fn(dt, tn) === false) { k.dead = true; tasks.splice(i, 1); } } catch (e) { k.dead = true; tasks.splice(i, 1); }
    }
    if (tasks.length) raf(frame); else running = false;
  }
  function add(fn, stops) {
    var k = {fn: fn, dead: false, stops: stops !== false};
    tasks.push(k);
    if (!running) { running = true; last = now(); raf(frame); }
    return function () { k.dead = true; };
  }
  function loop(fn, opts) { return add(function (dt, t) { return fn(dt, t); }, !(opts && opts.noStop === true)); }
  function tween(o) {
    var from = o.from == null ? 0 : o.from, to = o.to == null ? 1 : o.to, dur = Math.max(1, o.dur == null ? 300 : o.dur) / 1000,
      e = typeof o.ease === "function" ? o.ease : (ease[o.ease] || ease.outCubic), el = -(o.delay || 0) / 1000, done = false;
    if (o.update) o.update(from, 0);
    var stop = add(function (dt) {
      el += dt;
      if (el < 0) return true;
      var k = Math.min(1, el / dur), v = from + (to - from) * e(k);
      if (o.update) o.update(v, k);
      if (k >= 1) { done = true; if (o.done) o.done(); return false; }
      return true;
    }, o.hitStop !== false);
    return {stop: function (finish) { stop(); if (finish && !done && o.update) { o.update(to, 1); if (o.done) o.done(); } }};
  }
  function seq(steps, done) {
    var i = 0, cur = null, killed = false;
    function next() {
      if (killed) return;
      if (i >= steps.length) { if (done) done(); return; }
      var s = steps[i++];
      if (typeof s === "function") { s(); next(); return; }
      cur = tween({dur: s[0], ease: s[2] || "linear", update: function (v, k) { if (s[1]) s[1](k); }, done: next});
    }
    next();
    return {stop: function () { killed = true; if (cur) cur.stop(); }};
  }
  function wait(ms, fn) { return tween({dur: ms, done: fn}); }
  function hitStop(ms) { if (reduced()) return; frozenUntil = Math.max(frozenUntil, now() + Math.min(ms, 160)); }

  /* ---------- elementos ---------- */
  var canAnimate = typeof Element !== "undefined" && !!Element.prototype.animate;
  function animate(el, kf, o) {
    if (!el) return null;
    if (!canAnimate) { var lastK = kf[kf.length - 1]; for (var p in lastK) if (p !== "offset" && p !== "easing") try { el.style[p] = lastK[p]; } catch (e) {} if (o && o.onfinish) setTimeout(o.onfinish, 0); return null; }
    var a = el.animate(kf, {duration: o.dur || 300, delay: o.delay || 0, easing: o.easing || CSS.out, fill: o.fill || "none", iterations: o.iterations || 1});
    if (o.onfinish) a.onfinish = o.onfinish;
    return a;
  }
  function shake(el, o) {
    o = o || {};
    if (!el || reduced()) return;
    var a = o.amp || 6, n = o.n || 6, kf = [];
    for (var i = 0; i <= n; i++) { var d = i === n ? 0 : a * (1 - i / n) * (i % 2 ? -1 : 1); kf.push({transform: "translate(" + d.toFixed(1) + "px," + (d * 0.4).toFixed(1) + "px)"}); }
    animate(el, kf, {dur: o.dur || 260, easing: "linear"});
  }
  function pop(el, o) {
    o = o || {};
    if (!el) return null;
    if (reduced()) return animate(el, [{opacity: 0}, {opacity: 1}], {dur: 140, delay: o.delay});
    return animate(el, [{transform: "scale(" + (o.from || 0.6) + ")", opacity: 0}, {transform: "scale(1.06)", opacity: 1, offset: 0.65}, {transform: "scale(1)", opacity: 1}], {dur: o.dur || 360, delay: o.delay || 0, easing: CSS.out, fill: "backwards"});
  }
  function stagger(els, o) {
    o = o || {};
    var step = o.step == null ? 45 : o.step, max = o.max || 12, dy = o.dy == null ? 10 : o.dy;
    var list = Array.prototype.slice.call(els || []);
    if (reduced()) return;
    list.forEach(function (el, i) {
      if (i >= max) return;
      animate(el, o.scale ? [{transform: "scale(.85)", opacity: 0}, {transform: "scale(1)", opacity: 1}] : [{transform: "translateY(" + dy + "px)", opacity: 0}, {transform: "none", opacity: 1}],
        {dur: o.dur || 320, delay: (o.delay || 0) + i * step, easing: o.scale ? CSS.back : CSS.out, fill: "backwards"});
    });
  }
  function fmtInt(v) { return String(Math.round(v)); }
  function countUp(el, a, b, o) {
    o = o || {};
    if (!el) return null;
    var fmt = o.fmt || fmtInt;
    if (reduced() || a === b) { el.textContent = fmt(b); return null; }
    el.style.fontVariantNumeric = "tabular-nums";
    return tween({from: a, to: b, dur: o.dur || Math.min(900, 300 + Math.abs(b - a) * 40), ease: "outCubic", delay: o.delay,
      update: function (v) { el.textContent = fmt(v); },
      done: function () { el.textContent = fmt(b); if (o.bounce !== false) animate(el, [{transform: "scale(1)"}, {transform: "scale(1.28)"}, {transform: "scale(1)"}], {dur: 320, easing: CSS.back}); if (o.done) o.done(); }});
  }

  /* ---------- partículas: una capa compartida con pool fijo ---------- */
  var MAXP = 140, P = [], cv = null, cx = null, alive = 0, stopP = null, dpr = 1;
  for (var pi = 0; pi < MAXP; pi++) P.push({on: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, s: 3, c: "#fff", sq: 0, rot: 0, vr: 0});
  function layer() {
    if (cv && cv.isConnected) return cv;
    cv = document.createElement("canvas"); cv.className = "fxlayer"; cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(cv); cx = cv.getContext("2d");
    return cv;
  }
  function sizeLayer() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  }
  function stepP(dt) {
    if (!cx) return false;
    cx.clearRect(0, 0, cv.width, cv.height);
    alive = 0;
    for (var i = 0; i < MAXP; i++) {
      var q = P[i]; if (!q.on) continue;
      q.life += dt;
      if (q.life >= q.max) { q.on = false; continue; }
      alive++;
      q.vy += q.g * dt; q.vx *= 1 - 1.6 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
      var k = q.life / q.max, a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, s = q.s * dpr * (1 - k * 0.4);
      cx.globalAlpha = a; cx.fillStyle = q.c;
      /* cuadrados de píxel, como el resto del arte */
      var px = Math.round(q.x * dpr), py = Math.round(q.y * dpr);
      if (q.sq) { cx.save(); cx.translate(px, py); cx.rotate(q.rot); cx.fillRect(-s / 2, -s * 0.3, s, s * 0.6); cx.restore(); }
      else cx.fillRect(px - s / 2, py - s / 2, s, s);
    }
    cx.globalAlpha = 1;
    if (!alive) { cx.clearRect(0, 0, cv.width, cv.height); stopP = null; return false; }
    return true;
  }
  function burst(x, y, o) {
    o = o || {};
    if (typeof document === "undefined" || !document.body) return;
    var n = o.n || 18;
    if (reduced()) n = Math.min(n, o.keep ? 6 : 0);
    if (!n) return;
    layer(); sizeLayer();
    var cols = o.colors || ["#ffb21e", "#ffffff", "#3fcf7c"], sp = o.speed || 220, made = 0;
    for (var i = 0; i < MAXP && made < n; i++) {
      var q = P[i]; if (q.on) continue;
      var ang = (o.angle == null ? -PI / 2 : o.angle) + (Math.random() - 0.5) * (o.spread == null ? PI * 2 : o.spread), v = sp * (0.45 + Math.random() * 0.75);
      q.on = true; q.x = x; q.y = y; q.vx = Math.cos(ang) * v; q.vy = Math.sin(ang) * v; q.g = o.gravity == null ? 520 : o.gravity;
      q.life = 0; q.max = (o.life || 0.8) * (0.7 + Math.random() * 0.6); q.s = (o.size || 4) * (0.7 + Math.random() * 0.6); q.c = cols[(Math.random() * cols.length) | 0];
      q.sq = o.confetti ? 1 : 0; q.rot = Math.random() * PI; q.vr = (Math.random() - 0.5) * 12;
      made++;
    }
    if (!stopP) stopP = add(stepP, false);
  }
  function burstAt(el, o) { if (!el) return; var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, o); }
  function floatText(text, x, y, cls) {
    if (typeof document === "undefined" || !document.body) return;
    var d = document.createElement("div");
    d.className = "fxfloat" + (cls ? " " + cls : ""); d.textContent = text; d.setAttribute("aria-hidden", "true");
    d.style.left = x + "px"; d.style.top = y + "px";
    document.body.appendChild(d);
    var fin = function () { if (d.parentNode) d.parentNode.removeChild(d); };
    if (reduced()) { animate(d, [{opacity: 0}, {opacity: 1, offset: 0.2}, {opacity: 1, offset: 0.8}, {opacity: 0}], {dur: 900, onfinish: fin}); }
    else animate(d, [{transform: "translate(-50%,-50%) scale(.4)", opacity: 0}, {transform: "translate(-50%,-80%) scale(1.15)", opacity: 1, offset: 0.25},
      {transform: "translate(-50%,-100%) scale(1)", opacity: 1, offset: 0.7}, {transform: "translate(-50%,-150%) scale(.95)", opacity: 0}], {dur: 1000, easing: "linear", onfinish: fin});
    setTimeout(fin, 1400);
  }

  /* ---------- háptica ---------- */
  function haptic(kind) {
    var o = prefs(); if (o.vib === 0) return;
    try { if (window.AndroidBridge && window.AndroidBridge.haptic) { window.AndroidBridge.haptic(kind || "tap"); return; } } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(kind === "big" ? [30, 40, 30] : kind === "bad" ? [20, 50, 20] : kind === "ok" ? 18 : 8); } catch (e) {}
  }

  return {ease: ease, css: CSS, reduced: reduced, invalidate: invalidate, tween: tween, loop: loop, seq: seq, wait: wait, hitStop: hitStop,
    animate: animate, shake: shake, pop: pop, stagger: stagger, countUp: countUp, burst: burst, burstAt: burstAt, floatText: floatText, haptic: haptic,
    rnd: function (a, b) { return a + Math.random() * (b - a); }};
})();
