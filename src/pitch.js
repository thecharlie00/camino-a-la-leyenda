/* ===== CAMPO EN DIRECTO 2.5: 22 bolitas con dorsal que juegan lo que cuenta el comentario =====
   Pitch.mount(el, {cols: [colLocal, colVisitante], lab}) · Pitch.teams(home, away, fixedNums) con [{id, pos, gone, ovr, age, st}] (11 por equipo)
   Pitch.state({own: 0|1 (0 = local con balón), bx: 0..100 (visto desde el local), speed, tac: [tacLocal, tacVisitante]})
     tac = {ment: "bus"|0|1|2|"press", line, width, pass, tempo (0..2)}
   Pitch.event({t, k, side: 0|1, who, cue}) → cue() se llama cuando en el campo empieza la acción que describe el texto
   Pitch.busy() → ms de jugada pendiente · Pitch.reset() · Pitch.freeze(v) · Pitch.destroy()
   Todo se simula en metros (105 × 68): balón con altura, efecto y rebotes; jugadores con aceleración, giro e inercia;
   cámara con zoom suave; ambiente de grada con Web Audio (sin ficheros).
   4.1: atributos de ritmo y agilidad por jugador, separación (espacio personal), intercepciones en los pases rasos
   y paso fijo a 30 Hz con interpolación al pintar. */
var Pitch = (function () {
  "use strict";
  var LEN = 105, WID = 68, MIDY = 34, PH = 3.66, BAR = 2.44, GRAV = 9.8, PI2 = Math.PI * 2;
  var P = null, RM = false, SPEEDK = 1.35;
  /* posición base de cada demarcación para un equipo que ataca hacia la derecha (x: 0 propia portería → 1 rival; y: 0 arriba → 1 abajo) */
  var BASE = {POR: [0.045, 0.5], LD: [0.24, 0.84], LI: [0.24, 0.16], DFC: [0.2, 0.5], MCD: [0.36, 0.5], MC: [0.46, 0.5], MCO: [0.58, 0.5],
    MD: [0.52, 0.86], MI: [0.52, 0.14], ED: [0.7, 0.84], EI: [0.7, 0.16], DC: [0.76, 0.5]};
  var SPREAD = {DFC: [0.36, 0.64, 0.5], MCD: [0.42, 0.58, 0.5], MC: [0.33, 0.67, 0.5], DC: [0.4, 0.6, 0.5], MCO: [0.38, 0.62, 0.5]};
  var STD_NUM = {POR: [1, 13], LD: [2], LI: [3], DFC: [4, 5, 15], MCD: [6, 16], MC: [8, 14, 18], MCO: [10, 20], MD: [7, 17], MI: [11, 21], ED: [7, 17], EI: [11, 21], DC: [9, 19, 22]};
  var WIDE = {LD: 1, LI: 1, MD: 1, MI: 1, ED: 1, EI: 1};
  var BACK = {LD: 1, LI: 1, DFC: 1};
  var MASS = {DFC: 1.14, DC: 1.1, MCD: 1.06, POR: 1.08};
  var BLK = {bus: -2, 0: -1, 1: 0, 2: 1, press: 2};

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function wrapA(a) { while (a > Math.PI) a -= PI2; while (a < -Math.PI) a += PI2; return a; }
  function lum(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c || ""); if (!m) return 0.5;
    var n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  function ink(c) { return lum(c) > 0.6 ? "#141414" : "#ffffff"; }
  function shade(c, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c || ""); if (!m) return "rgba(0,0,0,.5)";
    var n = parseInt(m[1], 16), r = (n >> 16) * k, g = ((n >> 8) & 255) * k, b = (n & 255) * k;
    return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
  }

  /* ---------- sonido de grada (Web Audio, sin ficheros) ---------- */
  var Snd = (function () {
    var KEY = "camino.pitch.snd", VOL = 0.32;
    var ac = null, master = null, bedG = null, roarG = null, roarF = null, on = true, loaded = false, lastExc = -1, unlock = null;
    function load() { if (loaded) return; loaded = true; try { if (window.localStorage && localStorage.getItem(KEY) === "0") on = false; } catch (e) {} }
    function save() { try { if (window.localStorage) localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {} }
    function noiseSrc(buf, rate, off, dest) {
      var s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(0, off); return s;
    }
    function init() {
      if (ac) return true;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try { ac = new AC(); } catch (e) { ac = null; return false; }
      try {
        /* ruido rosa de 3 s (filtro de Paul Kellet) que se repite */
        var n = Math.floor(ac.sampleRate * 3), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, i, w;
        for (i = 0; i < n; i++) {
          w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
        for (i = 0; i < 2000; i++) { var k = i / 2000; d[i] *= k; d[n - 1 - i] *= k; }
        master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
        /* murmullo de fondo que respira despacio */
        var bedF = ac.createBiquadFilter(); bedF.type = "bandpass"; bedF.frequency.value = 480; bedF.Q.value = 0.7;
        bedG = ac.createGain(); bedG.gain.value = 0.55; bedF.connect(bedG); bedG.connect(master);
        noiseSrc(buf, 1, 0, bedF); noiseSrc(buf, 0.83, 1.3, bedF);
        var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.16; lfo.connect(lg); lg.connect(bedG.gain); lfo.start();
        /* rugido: sube con el peligro y explota en los goles */
        roarF = ac.createBiquadFilter(); roarF.type = "bandpass"; roarF.frequency.value = 750; roarF.Q.value = 0.55;
        roarG = ac.createGain(); roarG.gain.value = 0; roarF.connect(roarG); roarG.connect(master);
        noiseSrc(buf, 1.19, 0.6, roarF); noiseSrc(buf, 0.94, 2.1, roarF);
      } catch (e2) { ac = null; return false; }
      return true;
    }
    function t() { return ac.currentTime; }
    function apply() {
      if (!ac || !master) return;
      master.gain.cancelScheduledValues(t()); master.gain.setTargetAtTime(on && P && !document.hidden ? VOL : 0, t(), 0.25);
    }
    function mount() {
      load();
      if (!on) return;
      if (!init()) return;
      if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} }
      if (!unlock) {
        unlock = function () { if (ac && ac.state === "suspended" && on && P) { try { ac.resume(); } catch (e) {} } };
        document.addEventListener("pointerdown", unlock, true); document.addEventListener("touchstart", unlock, true);
      }
      lastExc = -1; apply();
    }
    function stop() {
      if (!ac) return;
      master.gain.cancelScheduledValues(t()); master.gain.setTargetAtTime(0, t(), 0.12);
      setTimeout(function () { if (ac && !P) { try { ac.suspend(); } catch (e) {} } }, 500);
    }
    function vis() {
      if (!ac) return;
      if (document.hidden) { try { ac.suspend(); } catch (e) {} }
      else if (on && P) { try { ac.resume(); } catch (e2) {} apply(); }
    }
    function exc(x) {
      if (!ac || !on || Math.abs(x - lastExc) < 0.03) return;
      lastExc = x;
      roarG.gain.setTargetAtTime(x * x * 0.85, t(), 0.45);
      roarF.frequency.setTargetAtTime(650 + x * 650, t(), 0.5);
    }
    /* gol: explosión de la grada (más grande si marca el local) */
    function cheer(big) {
      if (!ac || !on) return;
      var g = roarG.gain, f = roarF.frequency, n = t();
      g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(big ? 2.1 : 0.9, n + 0.3); g.setTargetAtTime(0.18, n + 1.6, 1.3);
      f.cancelScheduledValues(n); f.setValueAtTime(f.value, n); f.linearRampToValueAtTime(big ? 1500 : 1000, n + 0.3); f.setTargetAtTime(800, n + 1.6, 1.4);
      lastExc = -1;
    }
    /* «¡uy!»: subida corta y caída */
    function ooh() {
      if (!ac || !on) return;
      var g = roarG.gain, f = roarF.frequency, n = t();
      g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(1.1, n + 0.18); g.setTargetAtTime(0.15, n + 0.4, 0.5);
      f.cancelScheduledValues(n); f.setValueAtTime(f.value, n); f.linearRampToValueAtTime(1150, n + 0.18); f.setTargetAtTime(520, n + 0.4, 0.45);
      lastExc = -1;
    }
    function kick(pw) {
      if (!ac || !on) return;
      try {
        var o = ac.createOscillator(), g = ac.createGain(), n = t();
        o.type = "sine"; o.frequency.setValueAtTime(140, n); o.frequency.exponentialRampToValueAtTime(55, n + 0.09);
        g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.25 * pw, n + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.12);
        o.connect(g); g.connect(master); o.start(n); o.stop(n + 0.14);
      } catch (e) {}
    }
    /* silbato de bolita: tono agudo con trino */
    function whistle(pat) {
      if (!ac || !on) return;
      try {
        var n = t() + 0.02;
        for (var i = 0; i < pat.length; i++) {
          var dur = pat[i], o = ac.createOscillator(), fm = ac.createOscillator(), fg = ac.createGain(), g = ac.createGain();
          o.type = "triangle"; o.frequency.value = 2750; fm.frequency.value = 34; fg.gain.value = 150;
          fm.connect(fg); fg.connect(o.frequency);
          g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.16, n + 0.02); g.gain.setValueAtTime(0.16, n + dur - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
          o.connect(g); g.connect(master); o.start(n); fm.start(n); o.stop(n + dur + 0.02); fm.stop(n + dur + 0.02);
          n += dur + 0.14;
        }
      } catch (e) {}
    }
    function toggle() { load(); on = !on; save(); if (on) mount(); else apply(); return on; }
    function isOn() { load(); return on; }
    return {mount: mount, stop: stop, vis: vis, exc: exc, cheer: cheer, ooh: ooh, kick: kick, whistle: whistle, toggle: toggle, isOn: isOn};
  })();

  /* posiciones base de un once (demarcaciones de su sistema) */
  function layout(list) {
    var count = {}, seen = {};
    list.forEach(function (p) { if (p) count[p.pos] = (count[p.pos] || 0) + 1; });
    return list.map(function (p) {
      if (!p) return null;
      var b = BASE[p.pos] || [0.5, 0.5], k = seen[p.pos] = (seen[p.pos] || 0) + 1, sp = SPREAD[p.pos], y = b[1];
      if (sp && count[p.pos] === 2) y = sp[k - 1];
      else if (sp && count[p.pos] >= 3) y = [0.28, 0.5, 0.72][Math.min(2, k - 1)];
      return [b[0], y];
    });
  }
  function numbers(list, fixed) {
    var used = {}, out = [];
    list.forEach(function (p, i) { if (p && fixed && fixed[p.id]) { out[i] = fixed[p.id]; used[out[i]] = 1; } });
    list.forEach(function (p, i) {
      if (!p || out[i]) return;
      var c = (STD_NUM[p.pos] || []).filter(function (n) { return !used[n]; })[0];
      if (!c) { c = 2; while (used[c]) c++; }
      out[i] = c; used[c] = 1;
    });
    return out;
  }
  function defTac() { return {blk: 0, press: false, ret: false, width: 1, pass: 1, tempo: 1}; }
  function mapTac(t) {
    var o = defTac(); if (!t) return o;
    var line = t.line == null ? 1 : +t.line, b = BLK[t.ment] != null ? BLK[t.ment] : 0;
    o.blk = clamp(b + (line - 1), -2, 2);
    o.press = t.ment === "press" || line === 2;
    o.ret = t.ment === "bus" || line === 0;
    o.width = t.width == null ? 1 : clamp(+t.width, 0, 2);
    o.pass = t.pass == null ? 1 : clamp(+t.pass, 0, 2);
    o.tempo = t.tempo == null ? 1 : clamp(+t.tempo, 0, 2);
    return o;
  }

  function mount(el, o) {
    destroy();
    var cv = document.createElement("canvas");
    cv.className = "lpitch";
    el.appendChild(cv);
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "lsnd";
    el.appendChild(btn);
    var tk = document.createElement("div"); tk.className = "ptick"; tk.setAttribute("aria-live", "polite"); el.appendChild(tk);
    var sp = document.createElement("div"); sp.className = "pspd"; sp.setAttribute("role", "group");
    sp.innerHTML = [1, 2, 3].map(function (n) { return '<button type="button" data-ps="' + n + '">' + n + "x</button>"; }).join("");
    var rb = document.createElement("button"); rb.type = "button"; rb.className = "prp"; rb.textContent = "↺"; rb.setAttribute("aria-label", o.rpLabel || "Repetición");
    rb.addEventListener("click", function (ev) { ev.stopPropagation(); replay(); });
    sp.appendChild(rb);
    el.appendChild(sp);
    RM = reduced();
    P = {el: el, cv: cv, ctx: cv.getContext("2d"), btn: btn, cols: o.cols || ["#ffb21e", "#66b9ff"], lab: o.lab || {goal: "GOL", post: "¡PALO!", half: "DESCANSO", end: "FINAL"},
      frozen: false, T: [[], []], own: 0, bxw: LEN / 2, speed: 1, rate: SPEEDK, ck: 0, last: now(), run: true,
      ball: {x: LEN / 2, y: MIDY, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, m: 2, hs: -1, hi: -1, fl: null, px: LEN / 2, py: MIDY, pz: 0},
      q: [], cues: [], hardUntil: 0, softUntil: 0, sid: 0, soft: 0, passAt: 0, cards: [], cele: null, msg: null,
      tac: [defTac(), defTac()], line: [22, 22], steal: -1, stealUntil: 0, chase: -1, cp: [0, 0], ret: [0, 0], trap: [0, 0], stopUntil: 0, pendOwn: null, recv: null,
      cam: {x: LEN / 2, y: MIDY, z: 1}, focus: null, shake: 0, exc: 0, excT: 0, excAt: 0, sndAt: 0, net: null, flag: null, font: "", fontR: 0,
      trails: [], icons: [], fx: [], offLine: null, lt: -1, flip: false, ko0: 0, half2: false, camN: 0, hiUntil: 0, onSpeed: o.onSpeed || null, tickTxt: ""};
    btn.addEventListener("click", function (ev) { ev.stopPropagation(); Snd.toggle(); sndBtn(); });
    P.tk = tk; P.sp = sp;
    sp.setAttribute("aria-label", o.spdLabel || "Velocidad");
    sp.addEventListener("click", function (ev) { var b0 = ev.target.closest && ev.target.closest("[data-ps]"); if (!b0 || !P) return; ev.stopPropagation(); var n = +b0.getAttribute("data-ps"); if (P.onSpeed) P.onSpeed(n); P.speed = n; P.rate = SPEEDK / ([1, 1, 0.62, 0.42][n] || 1); spdBtns(); });
    spdBtns();
    sndBtn();
    resize();
    P.onResize = function () { resize(); };
    P.onVis = function () { Snd.vis(); if (P) P.last = now(); };
    window.addEventListener("resize", P.onResize);
    document.addEventListener("visibilitychange", P.onVis);
    Snd.mount();
    loop();
  }
  function spdBtns() {
    if (!P || !P.sp) return;
    var bs = P.sp.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(+bs[i].getAttribute("data-ps") === P.speed));
  }
  function sndBtn() {
    if (!P) return;
    var on = Snd.isOn();
    P.btn.setAttribute("aria-pressed", on ? "true" : "false");
    P.btn.setAttribute("aria-label", on ? tr("Silenciar el ambiente del estadio") : tr("Activar el ambiente del estadio"));
    P.btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>' +
      (on ? '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>') + "</svg>";
  }
  function resize() {
    if (!P) return;
    var w = P.el.clientWidth || 340, h = Math.round(w * 0.6), d = window.devicePixelRatio || 1;
    P.w = w; P.h = h; P.dpr = d; P.cv.width = Math.round(w * d); P.cv.height = Math.round(h * d);
    P.cv.style.width = w + "px"; P.cv.style.height = h + "px";
    P.m = 9; P.sx = (w - P.m * 2) / LEN; P.sy = (h - P.m * 2) / WID;
    P.r = Math.max(6.5, w * 0.021);
  }
  function destroy() {
    if (!P) return;
    flushCues();
    P.run = false;
    window.removeEventListener("resize", P.onResize);
    document.removeEventListener("visibilitychange", P.onVis);
    if (P.cv.parentNode) P.cv.parentNode.removeChild(P.cv);
    if (P.btn.parentNode) P.btn.parentNode.removeChild(P.btn);
    if (P.tk && P.tk.parentNode) P.tk.parentNode.removeChild(P.tk);
    if (P.sp && P.sp.parentNode) P.sp.parentNode.removeChild(P.sp);
    P = null;
    Snd.stop();
  }

  /* equipos: home ataca hacia la derecha */
  function teams(home, away, fixedNums) {
    if (!P) return;
    [home, away].forEach(function (list, s) {
      var base = layout(list), nums = numbers(list, fixedNums && fixedNums[s]), old = P.T[s];
      P.T[s] = list.map(function (p, i) {
        if (!p) return null;
        var b = base[i], hu = b[0] * LEN, hy = (s === 0 ? b[1] : 1 - b[1]) * WID, wx = s === 0 ? hu : LEN - hu;
        var prev = old[i] && old[i].id === p.id ? old[i] : null;
        var o = prev || {x: wx, y: hy, vx: 0, vy: 0, fa: s === 0 ? 0 : Math.PI, ph: Math.random() * 6.28, tx: wx, ty: hy, lag: 0, jx: 0, jy: 0, jt: 0, mk: -1, mkT: 0, ov: null, dive: null, sp: 0.5};
        o.id = p.id; o.n = nums[i]; o.pos = p.pos; o.nm = p.nm || ""; o.hu = hu; o.hy = hy; o.gk = p.pos === "POR";
        if (p.gone && prev && !prev.gone) { if (!prev.off) sendOff(o); } else o.gone = p.gone || false;
        o.st = p.st == null ? 1 : clamp(+p.st, 0.05, 1);
        var ovr = p.ovr == null ? 70 : +p.ovr, age = p.age == null ? 26 : +p.age;
        o.mass = MASS[p.pos] || 1;
        /* ritmo: si llega el atributo de fuerza y ritmo (0-100) manda él; si no, se estima con la media y la edad */
        var fz = p.fza == null ? null : +p.fza;
        o.pace = fz != null ? clamp(0.8 + (fz - 50) * 0.0075 + (WIDE[p.pos] ? 0.03 : 0) - (o.gk ? 0.08 : 0), 0.74, 1.16)
          : clamp(0.92 + (ovr - 70) * 0.009 - Math.max(0, age - 29) * 0.013 + (WIDE[p.pos] ? 0.04 : 0) - (o.gk ? 0.08 : 0), 0.76, 1.14);
        /* agilidad: giros y cambios de ritmo (extremos y mediapuntas más ágiles; centrales y veteranos menos) */
        o.agi = clamp((p.agi != null ? 0.8 + (+p.agi - 50) * 0.006 : 0.96 + (ovr - 70) * 0.006) + ({ED: 0.07, EI: 0.07, MCO: 0.06, MD: 0.04, MI: 0.04, DFC: -0.06, POR: -0.04}[p.pos] || 0) - Math.max(0, age - 30) * 0.012, 0.72, 1.18);
        o.q = clamp((ovr - 60) / 30, 0, 1.2);
        o.acc = 5.6 * o.pace * (1.1 - (o.mass - 1) * 0.7) * (0.92 + clamp((ovr - 60) / 200, 0, 0.18)) * (0.9 + 0.1 * o.agi);
        if (!prev && old[i]) { o.x = old[i].x; o.y = old[i].y; o.vx = 0; o.vy = 0; o.fa = old[i].fa; o.flash = P.ck; }
        return o;
      });
    });
    var b = P.ball;
    if (b.m === 0 && !pl(b.hs, b.hi)) b.m = 2;
    if (b.m === 2 && !scripted() && P.chase < 0 && Math.abs(b.vx) + Math.abs(b.vy) < 0.1) giveTo(P.own, mid(P.own));
  }
  function pl(s, i) { if (s !== 0 && s !== 1 || i == null || i < 0) return null; var p = P.T[s][i]; return p && !p.gone && !p.off ? p : null; }
  function alive(s) { var out = []; for (var i = 0; i < P.T[s].length; i++) if (pl(s, i)) out.push(i); return out; }
  function byPos(s, re, excl) { return alive(s).filter(function (i) { return i !== excl && re.test(P.T[s][i].pos); }); }
  function anyOf(l) { return l.length ? l[Math.floor(Math.random() * l.length)] : -1; }
  function mid(s) { var l = byPos(s, /^(MC|MCD|MCO)$/); return l.length ? l[0] : alive(s)[1] || 0; }
  function keeper(s) { var l = byPos(s, /^POR$/); return l.length ? l[0] : -1; }
  function attacker(s, excl) { var l = byPos(s, /^(DC|ED|EI|MCO)$/, excl); if (!l.length) l = byPos(s, /^(?!POR)/, excl); return anyOf(l); }
  function nearestTo(s, x, y, noGK, excl, excl2) {
    var best = -1, bd = 1e9;
    for (var i = 0; i < P.T[s].length; i++) {
      var p = pl(s, i); if (!p || i === excl || i === excl2 || (noGK && p.gk)) continue;
      var dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function U(s, u) { return s === 0 ? u : LEN - u; }
  function scripted() { return P.ck < P.hardUntil || P.ck < P.softUntil; }

  /* ---------- balón ---------- */
  function giveTo(s, i) {
    var p = pl(s, i), b = P.ball; if (!p) return;
    b.m = 0; b.hs = s; b.hi = i; b.fl = null; b.z = 0; b.vz = 0; b.spin = 0; P.recv = null; P.lt = s;
    P.chase = -1;
    var tc = P.tac[s], base = [1.5, 0.95, 0.5][tc.tempo], var0 = [0.9, 0.6, 0.3][tc.tempo];
    P.passAt = P.ck + (base + Math.random() * var0) * (tc.pass === 0 ? 0.85 : 1);
  }
  /* golpeo: trayectoria (curva de Bézier con efecto) con perfil de velocidad según el tipo
     prof 0 = raso (frena por rozamiento) · 1 = bombeado (se frena en el punto más alto) · 2 = disparo */
  function kick(x1, y1, o) {
    var b = P.ball, dx = x1 - b.x, dy = y1 - b.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    var prof = o.prof || 0, d = o.d || (prof === 0 ? 0.25 + dist / 17 : prof === 1 ? 0.5 + dist / 21 : 0.12 + dist / 27);
    var nx = -dy / dist, ny = dx / dist, cv = o.curve || 0;
    b.fl = {x0: b.x, y0: b.y, x1: x1, y1: y1, c1x: b.x + dx / 3, c1y: b.y + dy / 3, c2x: b.x + dx * 2 / 3 + nx * cv * 1.5, c2y: b.y + dy * 2 / 3 + ny * cv * 1.5,
      z0: b.z, z1: o.z1 || 0, h: o.h || 0, d: d, t: 0, prof: prof, then: o.then || null};
    if (b.hs === 0 || b.hs === 1) P.lt = b.hs;
    b.m = 1; b.hs = -1; b.hi = -1;
    if (prof === 2 || (o.h || 0) > 5) Snd.kick(prof === 2 ? 1 : 0.6);
    if (dist > 4) P.trails.push({x0: b.x, y0: b.y, x1: x1, y1: y1, at: now(), shot: prof === 2, s: P.lt});
    return d;
  }
  function pathPos(f, k, out) {
    var s1;
    if (f.prof === 0) s1 = (k - 0.31 * k * k) / 0.69;
    else if (f.prof === 1) { var q = k + 0.3 * Math.sin(PI2 * k) / PI2; s1 = (q - 0.12 * q * q) / 0.88; }
    else s1 = (k - 0.08 * k * k) / 0.92;
    var u = 1 - s1, a = u * u * u, bb = 3 * u * u * s1, c = 3 * u * s1 * s1, e = s1 * s1 * s1;
    out.x = a * f.x0 + bb * f.c1x + c * f.c2x + e * f.x1;
    out.y = a * f.y0 + bb * f.c1y + c * f.c2y + e * f.y1;
    out.z = Math.max(0, f.z0 + (f.z1 - f.z0) * k + 4 * f.h * k * (1 - k));
  }
  var TMP = {x: 0, y: 0, z: 0};
  function ballTick(sdt) {
    var b = P.ball;
    b.px = b.x; b.py = b.y; b.pz = b.z;
    if (b.m === 1) {
      var f = b.fl; f.t += sdt;
      var k = Math.min(1, f.t / f.d);
      pathPos(f, k, TMP); b.x = TMP.x; b.y = TMP.y; b.z = TMP.z;
      if (k >= 1) {
        if (sdt > 0) { b.vx = (b.x - b.px) / sdt; b.vy = (b.y - b.py) / sdt; b.vz = (b.z - b.pz) / sdt; }
        b.m = 2; b.fl = null; b.spin = 0;
        if (f.then) f.then();
      }
    } else if (b.m === 2) {
      if (b.z > 0 || b.vz > 0) {
        b.vz -= GRAV * sdt; b.z += b.vz * sdt;
        var dr = 1 - 0.1 * sdt; b.vx *= dr; b.vy *= dr;
        if (b.spin) { var svx = b.vx; b.vx -= b.vy * b.spin * sdt; b.vy += svx * b.spin * sdt; b.spin *= 1 - 0.9 * sdt; }
        if (b.z <= 0) {
          b.z = 0;
          if (b.vz < -1.4) { b.vz = -b.vz * 0.48; b.vx *= 0.82; b.vy *= 0.82; } else b.vz = 0;
        }
      } else {
        var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (sp > 0) { var ns = Math.max(0, sp - 3.4 * sdt) / sp; b.vx *= ns; b.vy *= ns; }
      }
      b.x += b.vx * sdt; b.y += b.vy * sdt;
      /* red de la portería: frena el balón dentro */
      if ((b.x > LEN || b.x < 0) && Math.abs(b.y - MIDY) < PH && b.z < BAR) {
        var gl = b.x > LEN ? LEN : 0, depth = Math.abs(b.x - gl);
        if (!P.net || P.ck - P.net.t0 > 1.5) P.net = {gx: gl, y: b.y, t0: P.ck};
        if (depth > 1.7) { b.x = gl + (gl ? 1.7 : -1.7); b.vx *= -0.12; b.vy *= 0.3; b.vz = 0; b.z = Math.min(b.z, 0.4); }
      }
      if (b.x < -6 || b.x > LEN + 6) { b.vx = 0; b.vy = 0; }
      if (b.y < -4 || b.y > WID + 4) { b.vx = 0; b.vy = 0; }
    } else {
      var hp = pl(b.hs, b.hi);
      if (!hp) { b.m = 2; b.vx = 0; b.vy = 0; }
      else {
        var spd = Math.sqrt(hp.vx * hp.vx + hp.vy * hp.vy), off = 0.55 + 0.6 * Math.abs(Math.sin(P.ck * 5.5 + hp.ph)) * Math.min(1, spd / 3);
        var kk = Math.min(1, sdt * 16);
        b.x = lerp(b.x, hp.x + Math.cos(hp.fa) * off, kk); b.y = lerp(b.y, hp.y + Math.sin(hp.fa) * off, kk); b.z = 0;
      }
    }
  }
  /* recibir un pase: si el que llega está cansado, a veces se le escapa el control */
  function receive(s, i) {
    var p = pl(s, i), b = P.ball; P.recv = null;
    if (!p) { P.chase = s; return; }
    var dx = p.x - b.x, dy = p.y - b.y;
    if (dx * dx + dy * dy > 16) { P.chase = s; return; }
    if (s !== P.own && !scripted()) { bump(2.5); P.chase = P.own; return; }
    var miss = p.st < 0.55 ? (0.55 - p.st) * 0.7 : 0.01;
    if (!p.gk && Math.random() < miss) { bump(3.5); P.chase = s; p.lag = P.ck + 0.25; return; }
    giveTo(s, i);
  }
  function bump(v) {
    var b = P.ball, a = Math.random() * PI2;
    b.m = 2; b.hs = -1; b.hi = -1; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.vz = 0.8; b.z = 0.05;
  }

  /* ---------- estado del minuto: quién tiene el balón y dónde ---------- */
  function state(o) {
    if (!P) return;
    if (o.speed) { P.speed = o.speed; P.rate = SPEEDK / ([1, 1, 0.62, 0.42][o.speed] || 1); spdBtns(); }
    P.bxw = clamp((o.bx == null ? 50 : o.bx) / 100, 0.05, 0.95) * LEN;
    if (o.tac) { P.tac[0] = mapTac(o.tac[0]); P.tac[1] = mapTac(o.tac[1]); }
    if (o.own != null && o.own !== P.own) {
      if (scripted() || P.cele) P.pendOwn = o.own;
      else turnover(o.own);
    }
  }
  function turnover(s) {
    var lost = 1 - s;
    P.own = s; P.pendOwn = null;
    P.steal = s; P.stealUntil = P.ck + 1.7;
    if (P.tac[lost].press) P.cp[lost] = P.ck + 2.6;
    if (P.tac[lost].ret) P.ret[lost] = P.ck + 3.5;
    if (P.ball.m === 2) P.chase = s;
  }

  /* ---------- guion de jugadas ---------- */
  function flushCues() {
    if (!P || !P.cues.length) return;
    var l = P.cues; P.cues = [];
    setTimeout(function () { l.forEach(function (c) { try { c.fn(); } catch (e) {} }); }, 0);
  }
  function cueAt(at, fn) { if (typeof fn === "function") P.cues.push({at: at, fn: fn}); }
  function clearOv() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var p = P.T[s][i]; if (p) { p.ov = null; p.lag = 0; } }
  }
  function cancelSoft() {
    if (P.ck >= P.softUntil) return;
    P.q = P.q.filter(function (x) { return x.hard; });
    P.softUntil = 0; P.soft++; P.focus = null; P.stopUntil = 0;
    clearOv();
    if (P.ball.m === 1 && P.ball.fl) P.ball.fl.then = function () { P.chase = P.own; };
  }
  /* steps: [[segundos hasta el siguiente, fn], …]; devuelve los instantes de inicio de cada paso */
  function run(steps, hard) {
    var t0 = hard ? Math.max(P.ck, P.hardUntil) : P.ck, t = t0, at = [], tok = P.soft;
    if (hard) cancelSoft(); else { cancelSoft(); tok = P.soft; }
    steps.forEach(function (st) {
      var fn = st[1];
      at.push(t);
      P.q.push({at: t, hard: hard, go: hard ? fn : function () { if (P.soft === tok) fn(); }});
      t += st[0];
    });
    P.q.sort(function (a, b) { return a.at - b.at; });
    if (hard) P.hardUntil = t; else P.softUntil = t;
    return at;
  }
  /* guarda para callbacks de jugadas suaves (si otra jugada la corta, el balón queda suelto) */
  function sg(fn) { var tok = P.soft; return function () { if (P.soft === tok) fn(); else P.chase = P.own; }; }
  function finish() {
    clearOv(); P.focus = null; P.excT = 0;
    if (P.pendOwn != null && P.pendOwn !== P.own) turnover(P.pendOwn);
    P.pendOwn = null;
    if (P.ball.m === 2) P.chase = P.own;
  }
  function setOv(p, x, y, sp) { if (p) p.ov = {x: clamp(x, -1, LEN + 1), y: clamp(y, 1, WID - 1), sp: sp == null ? 1 : sp}; }
  function focus(x, y, z) { P.focus = {x: x, y: y, z: z}; }
  function ensureBall(s, i) {
    var b = P.ball;
    if (b.m === 0 && b.hs === s) return;
    var j = i != null && pl(s, i) ? i : nearestTo(s, b.x, b.y, true);
    if (j >= 0) { giveTo(s, j); var p = pl(s, j); if (p && b.m === 0) { b.x = lerp(b.x, p.x, 0.5); b.y = lerp(b.y, p.y, 0.5); } }
  }
  /* pase a un punto: bombeado si es largo */
  function passTo(x, y, d, then, o) {
    var b = P.ball, dx = x - b.x, dy = y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
    o = o || {};
    var lob = o.lob != null ? o.lob : dist > 30;
    return kick(x, y, {prof: lob ? 1 : 0, h: lob ? Math.min(11, 2 + dist * 0.11) : 0, d: d, curve: o.curve || 0, z1: o.z1 || 0, then: then});
  }
  function dive(p, x, y, dur) {
    if (!p) return;
    p.dive = {t0: P.ck, d: dur, x0: p.x, y0: p.y, x1: x, y1: y, a: Math.atan2(y - p.y, x - p.x), lie: 0.6};
  }

  /* ---------- ocasión: goal | save | miss | post ---------- */
  var SHOT_KINDS = {pass: 1, oneone: 1, cross: 1, long: 1, dribble: 1, volley: 1, rebound: 1};
  function shotEvent(e) {
    var s = e.side, d = 1 - s, dir = s === 0 ? 1 : -1, gx = s === 0 ? LEN : 0, res = e.t;
    var k = e.k === "head" ? "cross" : e.k === "through" ? "oneone" : e.k === "combo" ? "pass" : e.k === "corner" ? (res === "save" ? "pass" : "cross") : e.k;
    if (!SHOT_KINDS[k]) k = ["pass", "pass", "oneone", "cross", "long", "dribble"][Math.floor(Math.random() * 6)];
    if (k === "rebound" && res !== "goal") k = "pass";
    var tip = e.k === "corner" && res === "save";
    var who = pl(s, e.who) && !P.T[s][e.who].gk ? e.who : attacker(s);
    var A = anyOf(byPos(s, /^(MC|MCO|MCD|MD|MI|ED|EI)$/, who)); if (A < 0) A = attacker(s, who);
    var lane = rnd(-1, 1), st = [], gk = keeper(d);
    var su = k === "long" ? rnd(24, 28) : k === "oneone" ? rnd(10, 13) : k === "cross" ? rnd(7, 10) : k === "volley" ? rnd(14, 17) : k === "dribble" ? rnd(12, 15) : rnd(11, 16);
    var sy = MIDY + (k === "cross" ? lane * 4 : lane * (k === "long" ? 9 : 8));
    /* 4.1: si el motor dice desde dónde fue el tiro (distancia y desvío lateral del cálculo de xG), se chuta exactamente desde ahí */
    if (e.d != null && !isNaN(+e.d)) {
      var ed = +e.d, el = e.ly != null && !isNaN(+e.ly) ? +e.ly : 0;
      su = k === "cross" ? clamp(ed, 5.5, 11) : k === "oneone" || k === "rebound" ? clamp(ed, 6, 13) : clamp(ed, 6, 32);
      lane = clamp(el / 8, -1, 1);
      sy = MIDY + (k === "cross" ? clamp(el, -5, 5) : clamp(el, -13, 13)) * (s === 0 ? 1 : -1);
    }
    var SX = U(s, LEN - su), SY = sy, shotZ = k === "cross" ? 2.1 : k === "volley" ? 0.8 : 0.15;
    var wy = lane > 0 ? WID - 5 : 5, W = -1;
    if (k === "cross") { var wl = byPos(s, lane > 0 ? (s === 0 ? /^(ED|MD|LD)$/ : /^(EI|MI|LI)$/) : (s === 0 ? /^(EI|MI|LI)$/ : /^(ED|MD|LD)$/), who); W = wl.length ? wl[0] : A; }
    /* 0) recuperar/asegurar el balón; la grada se levanta */
    st.push([0.2, function () { P.own = s; P.pendOwn = null; P.steal = -1; ensureBall(s, null); P.excT = 0.4; P.shooter = {s: s, i: who, until: P.ck + 9}; }]);
    if (k === "cross") {
      st.push([0.8, function () {
        var w = pl(s, W); setOv(w, U(s, LEN - 26), wy, 1); setOv(pl(s, who), U(s, LEN - 22), MIDY - lane * 3, 0.8);
        passTo(U(s, LEN - 27), wy, 0.75, function () { receive(s, W); });
      }]);
      st.push([1.0, function () {
        var w = pl(s, W); if (w && P.ball.m !== 0) giveTo(s, W);
        setOv(w, U(s, LEN - 7), wy + (lane > 0 ? -2 : 2), 1); setOv(pl(s, who), SX, SY, 1);
        focus(U(s, LEN - 18), MIDY + lane * 6, 1.6); P.excT = 0.6;
      }]);
      st.push([1.0, function () {
        P.excT = 0.75;
        kick(SX, SY, {prof: 1, h: 3.4, z1: 2.1, d: 1.0, curve: lane > 0 ? 3 * dir : -3 * dir});
        var df = nearestTo(d, SX, SY, true); if (df >= 0) { setOv(pl(d, df), SX + dir * 0.9, SY + 1.2, 1); P.T[d][df].lag = P.ck + 0.6; }
      }]);
    } else if (k === "long") {
      st.push([0.8, function () { setOv(pl(s, who), SX, SY, 1); passTo(SX - dir * 1.2, SY, 0.75, function () { receive(s, who); }); }]);
      st.push([0.45, function () { var p = pl(s, who); if (p && P.ball.m !== 0) giveTo(s, who); setOv(p, SX + dir * 1.2, SY, 0.6); focus(U(s, LEN - 17), MIDY + lane * 4, 1.5); P.excT = 0.6; }]);
    } else if (k === "oneone") {
      var AX = U(s, LEN - 36), AY = MIDY + lane * 10;
      st.push([0.75, function () { icon(s, who, "⚡"); setOv(pl(s, A), AX, AY, 1); setOv(pl(s, who), U(s, LEN - 31), SY + lane * 5, 0.7); passTo(AX, AY, 0.7, function () { receive(s, A); }); }]);
      st.push([0.95, function () {
        if (pl(s, A) && P.ball.m !== 0) giveTo(s, A);
        P.trap[d] = P.ck + 0.6;
        focus(U(s, LEN - 20), MIDY + lane * 4, 1.45); P.excT = 0.65;
        setOv(pl(s, who), SX, SY, 1);
        kick(SX + dir * 1.5, SY, {prof: 0, d: 0.95, curve: lane > 0 ? -2 : 2, then: function () { receive(s, who); }});
        for (var j = 0; j < 2; j++) { var df = nearestTo(d, SX, SY, true, j ? P._df : -1); if (df >= 0) { P._df = df; var q = P.T[d][df]; q.lag = P.ck + 0.35; setOv(q, SX - dir * 1.5, SY + (j ? 3 : -2), 1); } }
        var g = pl(d, gk); if (g) setOv(g, U(s, LEN - 6.5), MIDY + (SY - MIDY) * 0.5, 1);
      }]);
      st.push([0.2, function () {}]);
    } else if (k === "dribble") {
      st.push([0.75, function () { setOv(pl(s, who), U(s, LEN - 24), SY, 1); passTo(U(s, LEN - 24), SY, 0.7, function () { receive(s, who); }); }]);
      st.push([0.7, function () {
        var p = pl(s, who); if (p && P.ball.m !== 0) giveTo(s, who);
        setOv(p, U(s, LEN - 17), SY, 0.75); focus(U(s, LEN - 17), MIDY + lane * 4, 1.5); P.excT = 0.6;
        var df = nearestTo(d, U(s, LEN - 17), SY, true); if (df >= 0) { P._df = df; setOv(pl(d, df), U(s, LEN - 18.5), SY, 1); }
      }]);
      /* amago: el defensor se come el recorte y tarda en reaccionar */
      st.push([0.6, function () {
        var p = pl(s, who), q = pl(d, P._df), cut = lane > 0 ? -4.5 : 4.5;
        setOv(p, SX, SY + cut * 0.4, 1);
        SY = SY + cut * 0.4;
        if (q) { q.lag = P.ck + 0.55; q.ov = {x: q.x + dir * 0.5, y: q.y - cut * 0.6, sp: 1}; }
      }]);
    } else if (k === "volley") {
      var VX = U(s, LEN - 40), VY = MIDY - lane * 12;
      st.push([0.75, function () { setOv(pl(s, A), VX, VY, 1); passTo(VX, VY, 0.7, function () { receive(s, A); }); }]);
      st.push([0.3, function () { if (pl(s, A) && P.ball.m !== 0) giveTo(s, A); setOv(pl(s, who), SX, SY, 1); }]);
      st.push([1.15, function () { focus(U(s, LEN - 18), MIDY + lane * 4, 1.5); P.excT = 0.65; kick(SX, SY, {prof: 1, h: 6, z1: 0.8, d: 1.15, curve: lane * 2}); }]);
    } else {
      var PX = U(s, LEN - 28), PY = MIDY - lane * 11;
      st.push([0.75, function () { setOv(pl(s, A), PX, PY, 1); setOv(pl(s, who), SX - dir * 6, SY, 0.8); passTo(PX, PY, 0.7, function () { receive(s, A); }); }]);
      st.push([0.3, function () { if (pl(s, A) && P.ball.m !== 0) giveTo(s, A); focus(U(s, LEN - 18), MIDY + lane * 4, 1.5); P.excT = 0.55; }]);
      st.push([0.62, function () { setOv(pl(s, who), SX, SY, 1); kick(SX, SY, {prof: 0, d: 0.6, curve: lane * 1.2, then: function () { receive(s, who); }}); }]);
      st.push([k === "rebound" ? 0.15 : 0.22, function () { var p = pl(s, who); if (p && P.ball.m !== 0 && !P.ball.fl) giveTo(s, who); }]);
    }
    /* rechace: primer remate de otro, el portero lo escupe y nuestro hombre empuja */
    if (k === "rebound") {
      var R2 = attacker(s, who) >= 0 ? attacker(s, who) : who;
      st.push([0.65, function () {
        var g = pl(d, gk), py = MIDY + rnd(-1.5, 1.5);
        if (pl(s, R2)) { var r2 = P.T[s][R2]; r2.ov = null; }
        kick(U(s, LEN - 0.9), py, {prof: 2, d: 0.5, z1: 0.6});
        if (g) dive(g, U(s, LEN - 1), py, 0.45);
        setOv(pl(s, who), U(s, LEN - 7), py + (py > MIDY ? 4 : -4), 1);
        Snd.ooh();
      }]);
      st.push([0.6, function () {
        var b = P.ball; b.m = 2; b.fl = null; b.vx = -dir * 9; b.vy = (b.y > MIDY ? 1 : -1) * 4; b.vz = 2;
        SX = U(s, LEN - 6.5); SY = b.y + (b.y > MIDY ? 3.5 : -3.5); shotZ = 0.3;
        setOv(pl(s, who), SX, SY, 1);
      }]);
    }
    /* el disparo */
    var shotT = res === "goal" ? 0.55 : 0.5, shotIdx = st.length;
    /* si el rematador está lejos de su punto de remate, la jugada espera a que llegue corriendo (máx. 4 s) */
    var sp0 = pl(s, who);
    if (sp0) {
      var need = Math.sqrt((SX - sp0.x) * (SX - sp0.x) + (SY - sp0.y) * (SY - sp0.y)) / (7.4 * sp0.pace), pre = shotT * 0.4;
      for (var si = 0; si < st.length; si++) pre += st[si][0];
      if (need > pre) st.splice(1, 0, [Math.min(4, need - pre), function () { var q = pl(s, who); if (q) setOv(q, SX - dir * 2.5, SY, 1); }]);
    }
    st.push([shotT, function () { shoot(s, who, res, k, SX, SY, shotZ, shotT, tip); }]);
    /* desenlace */
    if (res === "goal") {
      st.push([0.6, function () { /* el balón entra y la red se mueve */ }]);
      st.push([1.5, function () { celebrate(s, who); }]);
      /* tras la celebración, los 22 vuelven a su sitio y saca de centro quien ha encajado */
      st.push([0.6, function () { P.cele = null; walkKickoff(d, true); P.camN = P.ck + 1.6; }]);
      st.push([0.05, function () { snapKickoff(d); finish(); kickoff(d); }]);
    } else if (res === "save") {
      st.push([1.0, function () {}]);
      st.push([0.7, function () {
        var b = P.ball, g = pl(d, gk);
        if (b.m === 0 && b.hs === d && b.hi === gk && g) { var tg = nearestTo(d, U(s, LEN - 30), g.y, true); if (tg >= 0) { var q = P.T[d][tg]; kick(q.x, q.y, {prof: 1, h: 3, d: 0.9, then: function () { receive(d, tg); }}); } }
        else if (b.m === 2) P.chase = d;
      }]);
      st.push([0.05, function () { finish(); }]);
    } else if (res === "post") {
      st.push([1.05, function () { P.chase = d; }]);
      st.push([0.55, function () { var b = P.ball, c = nearestTo(d, b.x, b.y, true); if (c >= 0 && b.m !== 1) { giveTo(d, c); passTo(U(s, rnd(42, 56)), rnd(10, 58), 1.1, null, {lob: true}); P.chase = d; } }]);
      st.push([0.05, function () { finish(); }]);
    } else {
      st.push([0.95, function () {}]);
      st.push([0.6, function () {
        var b = P.ball, g = pl(d, gk); b.m = 2; b.fl = null; b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0; b.x = U(s, LEN - 5.5); b.y = MIDY + (Math.random() < 0.5 ? -9 : 9);
        if (g) { setOv(g, b.x + dir * 0.6, b.y, 0.7); }
        P.focus = null; P.excT = 0;
      }]);
      st.push([0.5, function () {
        var g = pl(d, gk); if (g) { giveTo(d, gk); var tg = nearestTo(d, U(s, 50), MIDY, true); if (tg >= 0) { var q = P.T[d][tg]; passTo(U(s, rnd(48, 62)), q.y, 1.2, function () { P.chase = d; }, {lob: true}); } }
      }]);
      st.push([0.05, function () { finish(); }]);
    }
    var at0 = run(st, true)[shotIdx];
    P.hiUntil = P.hardUntil;
    return at0;
  }
  function shoot(s, who, res, k, SX, SY, z0, T, tip) {
    var d = 1 - s, dir = s === 0 ? 1 : -1, gx = s === 0 ? LEN : 0, b = P.ball, g = pl(d, keeper(d)), p = pl(s, who);
    P.shooter = null;
    /* el tiro sale desde donde dice el motor (y el comentario): si el rematador no ha llegado, se coloca */
    if (p) {
      var ddx = SX - p.x, ddy = SY - p.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
      /* muy lejos (no le dio tiempo): remata el compañero que está en esa zona */
      if (dd > 10) { var alt = nearestTo(s, SX, SY, true); if (alt >= 0 && pl(s, alt)) { who = alt; p = pl(s, alt); ddx = SX - p.x; ddy = SY - p.y; dd = Math.sqrt(ddx * ddx + ddy * ddy); } }
      P.snaps = (P.snaps || []).concat([Math.round(dd)]).slice(-30);
      /* si desde donde está el tiro sigue encajando con el comentario (lejano / dentro del área), no se le mueve */
      var dg = Math.sqrt((gx - p.x) * (gx - p.x) + (MIDY - p.y) * (MIDY - p.y));
      var fits = k === "long" ? dg >= 17 : (k === "oneone" || k === "rebound" || k === "cross") ? dg <= 14 : dg <= 23;
      if (dd > 3.5 && !(fits && dd <= 8)) { var kk = (dd - 1.5) / dd; p.x += ddx * kk; p.y += ddy * kk; p.vx = ddx / dd * 3; p.vy = ddy / dd * 3; }
    }
    if (p) { b.m = 0; b.hs = s; b.hi = who; }
    b.x = p ? p.x + dir * 0.6 : SX; b.y = p ? p.y : SY; b.z = z0; b.fl = null;
    var curl = k === "long" ? (SY > MIDY ? -1 : 1) * rnd(2.5, 4) : k === "cross" || k === "volley" ? 0 : rnd(-1, 1);
    P.excT = 1; focus(U(s, LEN - 14), MIDY + (SY - MIDY) * 0.4, 1.7);
    if (p) p.ov = {x: p.x + dir * 1.2, y: p.y, sp: 0.4};
    var ty, tz;
    if (res === "goal") {
      ty = MIDY + (Math.random() < 0.5 ? -1 : 1) * rnd(1.4, 3.1); tz = k === "long" ? rnd(1.6, 2.2) : k === "cross" ? rnd(0.3, 1.6) : rnd(0.15, 1.8);
      kick(gx, ty, {prof: 2, d: T, z1: tz, curve: curl, h: k === "long" ? 0.8 : 0.25});
      if (g) setTimeout2(0.16, function () { dive(g, gx - dir * 1.2, g.y + (ty - g.y) * 0.55, T * 0.85); });
      setTimeout2(T + 0.02, function () {
        var bb = P.ball; bb.vx = dir * Math.max(10, Math.abs(bb.vx) * 0.6); bb.spin = 0;
        P.msg = {t: goalLabel(s, who), s: s, at: P.ck, long: true}; P.net = {gx: gx, y: bb.y, t0: P.ck};
        if (!RM && P.speed < 3 && P.autoRp !== false) P.rpAt = {at: P.ck + 2.4, from: P.ck - T - 3.6, to: P.ck + 0.7};
        if (!RM) P.shake = P.ck;
        Snd.cheer(s === 0); P.excT = 0.2;
      });
    } else if (res === "save") {
      ty = MIDY + rnd(-2.6, 2.6); tz = rnd(0.2, 1.7);
      var cx = gx - dir * 1;
      kick(cx, ty, {prof: 2, d: T, z1: tz, curve: curl, then: function () {
        var bb = P.ball, hold = !tip && Math.random() < 0.45 && tz < 1.4;
        icon(d, keeper(d), "🧤");
        if (hold && g) { giveTo(d, keeper(d)); P.chase = -2; }
        else {
          var sp = Math.sqrt(bb.vx * bb.vx + bb.vy * bb.vy) * rnd(0.22, 0.4), side = ty > MIDY ? 1 : -1;
          var a = tip ? Math.atan2(side * 0.9, dir * 0.35) : Math.atan2(rnd(-0.9, 0.9), -dir);
          bb.vx = Math.cos(a) * sp; bb.vy = Math.sin(a) * sp; bb.vz = tip ? 2.5 : rnd(1, 4); bb.spin = 0;
          P.chase = d;
        }
        Snd.ooh(); P.excT = 0.25;
      }});
      if (g) setTimeout2(0.08, function () { dive(g, cx, ty, T * 0.88); });
    } else if (res === "post") {
      var bar = Math.random() < 0.3, sd = Math.random() < 0.5 ? -1 : 1;
      ty = bar ? MIDY + rnd(-2.5, 2.5) : MIDY + sd * PH; tz = bar ? BAR : rnd(0.3, 1.9);
      kick(gx, ty, {prof: 2, d: T, z1: tz, curve: curl, then: function () {
        var bb = P.ball;
        if (bar) { bb.vx = -bb.vx * 0.4; bb.vz = rnd(2.5, 4); bb.vy *= 0.6; }
        else { bb.vx = -bb.vx * 0.5; bb.vy = bb.vy * 0.5 + (bb.y > MIDY ? 1 : -1) * rnd(2, 5); bb.vz = Math.max(0, bb.vz) * 0.3; }
        bb.spin = 0; bb.x = gx - dir * 0.15; P.chase = -2;
        Snd.ooh(); P.excT = 0.3;
        P.msg = {t: P.lab.post, s: s, at: P.ck};
      }});
      if (g) setTimeout2(0.14, function () { dive(g, gx - dir * 1.3, g.y + (ty - g.y) * 0.5, T * 0.85); });
    } else {
      var over = Math.random() < 0.45;
      ty = over ? MIDY + rnd(-3, 3) : MIDY + (Math.random() < 0.5 ? -1 : 1) * rnd(4.4, 8); tz = over ? rnd(2.9, 4.2) : rnd(0.2, 1.5);
      kick(gx + dir * 0.3, ty, {prof: 2, d: T, z1: tz, curve: curl, h: over ? 0.6 : 0.2, then: function () { var bb = P.ball; bb.vx *= 0.5; bb.vy *= 0.5; P.chase = -2; Snd.ooh(); P.excT = 0.15; }});
      if (g && !over) setTimeout2(0.12, function () { dive(g, gx - dir * 1, g.y + (ty - g.y) * 0.35, T * 0.8); });
    }
  }
  /* temporizador en tiempo de partido (se para con la pausa) */
  function setTimeout2(sec, fn) { P.q.push({at: P.ck + sec, hard: true, go: fn}); P.q.sort(function (a, b) { return a.at - b.at; }); }
  function celebrate(s, who) {
    var p = pl(s, who); if (!p) return;
    var cy = p.y < MIDY ? 2.5 : WID - 2.5, cx = s === 0 ? LEN - 3 : 3;
    P.cele = {s: s, who: who, x: cx, y: cy};
    P.focus = null; P.excT = 0.3;
  }
  /* posición de saque de centro: cada uno en su campo, a su altura de formación */
  function koSpot(t, p) { return {x: U(t, Math.min(p.hu * 0.62, 49)), y: p.hy}; }
  function walkKickoff(s, fast) {
    for (var t = 0; t < 2; t++) for (var i = 0; i < P.T[t].length; i++) {
      var p = pl(t, i); if (!p) continue;
      var k = koSpot(t, p);
      setOv(p, k.x, k.y, fast ? 1 : 0.7);
    }
  }
  /* recolocación inmediata: nadie arrastra la inercia de la jugada anterior */
  function snapKickoff() {
    for (var t = 0; t < 2; t++) for (var i = 0; i < P.T[t].length; i++) {
      var p = pl(t, i); if (!p) continue;
      var k = koSpot(t, p); p.x = k.x; p.y = k.y; p.tx = k.x; p.ty = k.y; p.vx = 0; p.vy = 0; p.ov = null; p.dive = null; p.lag = 0;
      p.fa = t === 0 ? 0 : Math.PI;
    }
  }
  function kickoff(s) {
    P.cele = null;
    var b = P.ball; b.x = LEN / 2; b.y = MIDY; b.z = 0; b.m = 2; b.fl = null; b.vx = 0; b.vy = 0; b.vz = 0;
    var c = byPos(s, /^DC$/)[0]; if (c == null) c = mid(s);
    var cp = pl(s, c); if (cp) { cp.x = LEN / 2 + (s === 0 ? -0.9 : 0.9); cp.y = MIDY; cp.vx = 0; cp.vy = 0; }
    giveTo(s, c); P.own = s; P.steal = -1; P.chase = -1;
    /* pase inicial hacia atrás a un medio */
    var mm = mid(s), mp0 = pl(s, mm);
    if (mp0 && mm !== c) setTimeout2(0.35, function () { var bb = P.ball; if (bb.m === 0 && bb.hs === s) { var q = pl(s, mm); if (q) kick(q.x, q.y, {prof: 0, d: 0.45, then: function () { receive(s, mm); }}); } });
  }
  function goalLabel(s, who) {
    var p = P.T[s] && P.T[s][who], n = p && p.nm ? p.nm : "";
    return n && P.lab.goalOf ? P.lab.goalOf.replace("{n}", n.toUpperCase()) : P.lab.goal;
  }
  function icon(s, i, ic) { if (pl(s, i)) P.icons.push({s: s, i: i, ic: ic, at: now()}); }
  function ticker(t) { if (!P || !P.tk || !t) return; P.tk.textContent = t; P.tk.classList.remove("on"); void P.tk.offsetWidth; P.tk.classList.add("on"); }

  /* ---------- reanudaciones: banda, córner y saque de puerta ---------- */
  function outOfPlay(b) { return b.x < -0.3 || b.x > LEN + 0.3 || b.y < -0.3 || b.y > WID + 0.3; }
  function restartOut() {
    var b = P.ball, lt = P.lt;
    if (b.y < 0 || b.y > WID) throwIn(lt === 0 ? 1 : lt === 1 ? 0 : 1 - P.own, clamp(b.x, 3, LEN - 3), b.y < 0 ? 0.3 : WID - 0.3);
    else {
      var D = b.x > LEN ? 1 : 0, A = 1 - D;
      if (lt === D) playEvent({t: "com", k: "corner", side: A, lane: b.y > MIDY ? 1 : -1, real: true});
      else goalKick(D, b.y > MIDY ? 1 : -1);
    }
  }
  function placeBall(x, y) { var b = P.ball; b.m = 2; b.fl = null; b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0; b.x = x; b.y = y; b.hs = -1; b.hi = -1; }
  function throwIn(T, x, y) {
    var st = [], th = -1, rc = -1, inside = y < MIDY ? 1 : -1, dir = T === 0 ? 1 : -1;
    st.push([0.5, function () {
      placeBall(x, y); P.own = T; P.pendOwn = null; P.steal = -1; P.chase = -2; P.camN = P.ck + 2.4;
      th = nearestTo(T, x, y, true); setOv(pl(T, th), x, y - inside * 0.4, 1);
      rc = nearestTo(T, x + dir * 6, y + inside * 9, true, th); setOv(pl(T, rc), x + dir * rnd(4, 9), y + inside * rnd(7, 12), 0.8);
      P.msg = {t: P.lab.thr || "", s: -1, at: P.ck, small: true};
    }]);
    st.push([0.55, function () { var p = pl(T, th); if (p) { p.x = x; p.y = y - inside * 0.4; p.vx = 0; p.vy = 0; giveTo(T, th); P.ball.x = x; P.ball.y = y; } }]);
    st.push([0.75, function () { var q = pl(T, rc); if (q && P.ball.m === 0) kick(q.x, q.y, {prof: 1, h: 1.7, d: 0.75, then: sg(function () { receive(T, rc); })}); }]);
    st.push([0.4, function () { finish(); }]);
    run(st, false);
  }
  function goalKick(D, side) {
    var st = [], dir = D === 0 ? 1 : -1, gx = U(D, 5.5), gy = MIDY + side * 8, g = keeper(D), shortK = Math.random() < 0.5, cb = -1;
    st.push([0.6, function () {
      placeBall(gx, gy); P.own = D; P.pendOwn = null; P.steal = -1; P.chase = -2; P.camN = P.ck + 3;
      setOv(pl(D, g), gx - dir * 0.7, gy, 1);
      if (shortK) { cb = anyOf(byPos(D, /^(DFC|LD|LI)$/)); setOv(pl(D, cb), U(D, 16), MIDY + side * 18, 1); }
      P.msg = {t: P.lab.gk || "", s: -1, at: P.ck, small: true};
    }]);
    st.push([0.7, function () { var p = pl(D, g); if (p) { p.x = gx - dir * 0.7; p.y = gy; p.vx = 0; p.vy = 0; giveTo(D, g); P.ball.x = gx; P.ball.y = gy; } }]);
    st.push([0.5, function () {
      if (P.ball.m !== 0) return;
      var q = pl(D, cb);
      if (shortK && q) kick(q.x, q.y, {prof: 0, d: 0.9, then: sg(function () { receive(D, cb); })});
      else { var tx = U(D, rnd(55, 68)), ty = MIDY + rnd(-16, 16); passTo(tx, ty, 1.5, sg(function () { var c = nearestTo(D, tx, ty, true); if (Math.random() < 0.55 && c >= 0) receive(D, c); else clearance(1 - D, 6); }), {lob: true}); }
    }]);
    st.push([0.8, function () { finish(); }]);
    run(st, false);
  }

  /* ---------- faltas: destello, balón parado, barrera y lanzador ---------- */
  function foulPlay(fs, fi, card) {
    var T = 1 - fs, b = P.ball, dirT = T === 0 ? 1 : -1, st = [], kk = -1, wall = [];
    var fp = (P.T[fs] && fi >= 0 && P.T[fs][fi]) || null, x = b.m === 0 && b.hs === T ? b.x : fp ? fp.x : b.x, y = b.m === 0 && b.hs === T ? b.y : fp ? fp.y : b.y;
    x = clamp(x, 2, LEN - 2); y = clamp(y, 2, WID - 2);
    var gxT = U(T, LEN), dist = Math.sqrt((gxT - x) * (gxT - x) + (MIDY - y) * (MIDY - y)), danger = dist < 34;
    st.push([0.05, function () {
      Snd.whistle([0.26]); placeBall(x, y); P.own = T; P.pendOwn = null; P.steal = -1; P.chase = -2;
      P.fx.push({x: x, y: y, at: now(), red: card === "red"});
      P.msg = {t: P.lab.foul || "", s: -1, at: P.ck, small: true};
      if (card && fp) { P.cards.push({s: fs, i: fi, red: card === "red", at: P.ck + 0.3, pop: true}); if (card === "yellow") fp.yc = true; }
      if (danger) focus(lerp(x, gxT, 0.4), lerp(y, MIDY, 0.4), 1.45); else P.camN = P.ck + 3.4;
      P.excT = danger ? 0.45 : 0.1;
    }]);
    st.push([0.9, function () {
      if (card === "red" && fp) sendOff(fp);
      kk = nearestTo(T, x - dirT * 2, y, true);
      setOv(pl(T, kk), x - dirT * 1.3, y, 1);
      /* barrera entre el balón y la portería */
      var ux = gxT - x, uy = MIDY - y, ul = Math.sqrt(ux * ux + uy * uy) || 1; ux /= ul; uy /= ul;
      var n = dist < 26 ? 4 : dist < 34 ? 3 : 2, wx = x + ux * 9.15, wy = y + uy * 9.15, used = -1;
      for (var j = 0; j < n; j++) {
        var c = nearestTo(fs, wx, wy, true, used, wall.length ? wall[wall.length - 1] : -1);
        if (c < 0 || wall.indexOf(c) >= 0) break;
        wall.push(c); used = wall[0];
        var off = (j - (n - 1) / 2) * 0.9;
        setOv(pl(fs, c), wx - uy * off, wy + ux * off, 1);
      }
      if (danger) { var g = pl(fs, keeper(fs)); if (g) setOv(g, U(T, LEN - 1.5), MIDY + clamp((y - MIDY) * 0.25, -2.5, 2.5), 0.8); }
    }]);
    st.push([1.3, function () {
      var p = pl(T, kk); if (!p) return;
      p.x = x - dirT * 0.8; p.y = y; p.vx = 0; p.vy = 0; p.fa = Math.atan2(MIDY - y, gxT - x);
      giveTo(T, kk); P.ball.x = x; P.ball.y = y;
      for (var j = 0; j < wall.length; j++) { var q = pl(fs, wall[j]); if (q && q.ov) { q.x = q.ov.x; q.y = q.ov.y; q.vx = 0; q.vy = 0; } }
    }]);
    st.push([0.25, function () {
      if (!(P.ball.m === 0 && P.ball.hs === T)) return;
      if (danger) {
        var at = attacker(T, kk), tx = U(T, LEN - rnd(6, 10)), ty = MIDY + rnd(-5, 5);
        if (at >= 0) setOv(pl(T, at), tx, ty, 1);
        P.excT = 0.6;
        kick(tx, ty, {prof: 1, h: 3.8, z1: 2, d: 1.0, curve: rnd(-3, 3), then: sg(function () { clearance(fs, 9); })});
      } else {
        var r0 = nearestTo(T, x + dirT * 14, y + rnd(-10, 10), true, kk);
        var r = pl(T, r0); if (r) kick(r.x, r.y, {prof: Math.abs(r.x - x) > 22 ? 1 : 0, h: 3, d: 0.8, then: sg(function () { receive(T, r0); })});
      }
    }]);
    st.push([1.1, function () { finish(); }]);
    var t = run(st, !!card);
    P.stopUntil = P.ck + 2.4;
    return t[0];
  }
  /* expulsado: rojo oscuro, parpadea y se va por la banda */
  function sendOff(p) { if (!p || p.off) return; p.off = {t0: P.ck, y: p.y > MIDY ? WID + 3 : -3}; p.ov = null; }

  /* ---------- jugadas de los comentarios (suaves: no frenan el minuto) ---------- */
  function playEvent(e) {
    var s = e.side, d = 1 - s, dir = s === 0 ? 1 : -1, k = e.k, st = [], b = P.ball, lane = e.lane || (Math.random() < 0.5 ? -1 : 1);
    var who = pl(s, e.who) ? e.who : -1;
    if (e.t === "offside") {
      var off = who >= 0 && !P.T[s][who].gk ? who : attacker(s), pas = mid(s);
      st.push([0.35, function () { P.own = s; ensureBall(s, pas); P.trap[d] = P.ck + 1.7; focus(U(s, LEN - 30), MIDY, 1.25); }]);
      st.push([0.5, function () { var p = pl(s, off); setOv(p, U(s, LEN - 14), MIDY + lane * 6, 1); }]);
      var offX = 0, offY = 0;
      st.push([0.75, function () { var p = pl(s, off); offX = p ? p.x : U(s, LEN - 20); offY = p ? p.y : MIDY; passTo(U(s, LEN - 14), MIDY + lane * 6, 0.8); }]);
      st.push([1.1, function () {
        P.flag = {x: offX, y: lane > 0 ? WID + 0.6 : -0.6, t0: P.ck};
        P.offLine = {x: offX, at: now()};
        Snd.whistle([0.28]); P.stopUntil = P.ck + 2.2; P.msg = {t: P.lab.off || tr("FUERA DE JUEGO"), s: -1, at: P.ck, small: true};
        P.camN = P.ck + 2.4;
      }]);
      /* libre indirecto del equipo que defendía, desde la misma línea */
      var tk = -1;
      st.push([0.9, function () { placeBall(offX, clamp(offY, 3, WID - 3)); P.own = d; P.pendOwn = null; tk = nearestTo(d, offX, offY, true); setOv(pl(d, tk), offX + dir * 0.8, offY, 1); }]);
      st.push([0.7, function () { var q = pl(d, tk); if (q) { q.x = offX + dir * 0.8; q.y = clamp(offY, 3, WID - 3); q.vx = 0; q.vy = 0; giveTo(d, tk); P.ball.x = offX; P.ball.y = q.y; } }]);
      st.push([0.3, function () { var r0 = nearestTo(d, offX - dir * 12, MIDY, true, tk), r = pl(d, r0); if (r && P.ball.m === 0) kick(r.x, r.y, {prof: 0, d: 0.7, then: sg(function () { receive(d, r0); })}); }]);
      st.push([0.6, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (e.t === "yellow" || e.t === "red") {
      var i = e.who != null && pl(s, e.who) ? e.who : anyOf(byPos(s, /^(?!POR)/));
      return foulPlay(s, i, e.t);
    }
    if (e.t === "inj") { P.stopUntil = P.ck + 1.2; Snd.whistle([0.22]); return P.ck; }
    if (e.t !== "com") return P.ck;
    if (k === "block") { P.ret[1 - P.own] = P.ck + 4; return P.ck; }
    if (k === "foul") {
      var fsd = 1 - P.own;
      return foulPlay(fsd, nearestTo(fsd, b.x, b.y, true), null);
    }
    if (k === "wing" || k === "wide" || k === "cross") {
      var W = anyOf(byPos(s, lane > 0 ? (s === 0 ? /^(ED|MD|LD)$/ : /^(EI|MI|LI)$/) : (s === 0 ? /^(EI|MI|LI)$/ : /^(ED|MD|LD)$/)));
      if (W < 0) W = attacker(s);
      var wy = lane > 0 ? WID - 3.5 : 3.5, start = k === "cross" ? LEN - 30 : 52;
      st.push([0.7, function () { P.own = s; ensureBall(s, null); setOv(pl(s, W), U(s, start), wy, 1); passTo(U(s, start), wy, 0.65, sg(function () { receive(s, W); })); }]);
      st.push([k === "cross" ? 0.7 : 1.3, function () { if (pl(s, W) && b.m !== 0 && b.m !== 1) giveTo(s, W); setOv(pl(s, W), U(s, LEN - 9), wy + (lane > 0 ? -1.5 : 1.5), 1); P.excT = 0.35; }]);
      st.push([1.0, function () {
        if (!(b.m === 0 && b.hs === s)) return;
        focus(U(s, LEN - 17), MIDY + lane * 5, 1.4); P.excT = 0.55;
        var tx = U(s, LEN - rnd(7, 11)), ty = MIDY + rnd(-5, 5), df = nearestTo(d, tx, ty, true);
        var at = attacker(s, W); if (at >= 0) setOv(pl(s, at), tx, ty + 1, 1);
        if (df >= 0) setOv(pl(d, df), tx + dir * 0.8, ty, 1);
        kick(tx, ty, {prof: 1, h: 3.6, z1: 2, d: 0.95, curve: lane > 0 ? 3 * dir : -3 * dir, then: sg(function () { clearance(d, 9); })});
      }]);
      st.push([1.0, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (k === "corner") {
      var cy = lane > 0 ? WID - 0.4 : 0.4, cx = U(s, LEN - 0.4), tk = anyOf(byPos(s, /^(MC|MCO|ED|EI|MI|MD)$/));
      st.push([1.1, function () {
        P.own = s; b.m = 2; b.fl = null; b.vx = 0; b.vy = 0; b.vz = 0; b.z = 0; b.x = cx; b.y = cy; P.chase = -2;
        if (e.real) P.msg = {t: P.lab.cor || "", s: -1, at: P.ck, small: true};
        var dl = byPos(d, /^(DFC|LD|LI|MCD)$/); for (var jj = 0; jj < dl.length && jj < 5; jj++) setOv(pl(d, dl[jj]), U(s, LEN - rnd(3, 11)), MIDY + rnd(-7, 7), 0.9);
        var tp = pl(s, tk); if (tp) { tp.x = lerp(tp.x, cx, 0.6); tp.y = lerp(tp.y, cy, 0.6); setOv(tp, cx - dir * 0.6, cy + (lane > 0 ? 0.6 : -0.6), 1); }
        var l = byPos(s, /^(DC|DFC|MCO|ED|EI)$/, tk);
        for (var j = 0; j < l.length && j < 5; j++) setOv(pl(s, l[j]), U(s, LEN - rnd(6, 13)), MIDY + rnd(-8, 8), 0.8);
        focus(U(s, LEN - 14), MIDY + lane * 6, 1.45); P.excT = 0.45;
      }]);
      st.push([1.1, function () {
        if (pl(s, tk)) giveTo(s, tk);
        var tx = U(s, LEN - rnd(5.5, 9)), ty = MIDY + rnd(-4, 4), df = nearestTo(d, tx, ty, true);
        if (df >= 0) setOv(pl(d, df), tx, ty, 1);
        P.excT = 0.6;
        kick(tx, ty, {prof: 1, h: 4.6, z1: 2.2, d: 1.05, curve: (lane > 0 ? 1 : -1) * dir * -4, then: sg(function () { clearance(d, 10); })});
      }]);
      st.push([1.2, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (k === "long" || k === "counter") {
      var df0 = anyOf(byPos(s, k === "counter" ? /^(MCD|MC|DFC)$/ : /^(DFC|LD|LI)$/)), fw = attacker(s);
      st.push([0.35, function () { P.own = s; ensureBall(s, df0 >= 0 ? df0 : null); if (k === "counter") { P.cp[d] = 0; P.ret[d] = P.ck + 2.5; } }]);
      st.push([0.25, function () {
        var tx = U(s, LEN - rnd(22, 30)), ty = MIDY + rnd(-12, 12), q = nearestTo(d, tx, ty, true);
        setOv(pl(s, fw), tx, ty, 1); if (q >= 0) setOv(pl(d, q), tx - dir * 1, ty + 0.8, 1); icon(s, fw, "⚡");
        P.excT = 0.4;
        passTo(tx, ty, 1.5, sg(function () { if (Math.random() < 0.5) receive(s, fw); else clearance(Math.random() < 0.5 ? d : s, 6); }), {lob: true});
      }]);
      st.push([1.6, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (k === "through" || k === "turn") {
      var fw2 = who >= 0 && !P.T[s][who].gk ? who : attacker(s), am = anyOf(byPos(s, /^(MCO|MC|MCD)$/, fw2));
      st.push([0.4, function () { P.own = s; ensureBall(s, am >= 0 ? am : null); setOv(pl(s, fw2), U(s, LEN - 28), MIDY + lane * 5, 0.8); icon(s, fw2, "⚡"); }]);
      if (k === "turn") {
        st.push([0.7, function () { passTo(U(s, LEN - 28), MIDY + lane * 5, 0.6, sg(function () { receive(s, fw2); })); }]);
        st.push([0.6, function () { var p = pl(s, fw2); if (p) { p.fa = s === 0 ? Math.PI : 0; setOv(p, U(s, LEN - 19), MIDY + lane * 2, 1); } }]);
      } else {
        st.push([0.9, function () {
          var tx = U(s, LEN - 12), ty = MIDY + lane * 4, g = pl(d, keeper(d));
          setOv(pl(s, fw2), tx, ty, 1);
          kick(tx, ty, {prof: 0, d: 0.9, curve: lane * -2, then: sg(function () { var gi = keeper(d); if (pl(d, gi) && Math.random() < 0.6) giveTo(d, gi); else receive(s, fw2); })});
          if (g) setOv(g, U(s, LEN - 9), ty, 1);
          P.excT = 0.45;
        }]);
      }
      st.push([1.0, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (k === "press") {
      var vic = anyOf(byPos(d, /^(DFC|LD|LI|MCD)$/));
      st.push([0.3, function () { if (vic >= 0) { P.own = d; ensureBall(d, vic); } P.cp[s] = P.ck + 2; }]);
      st.push([1.0, function () {
        var l = []; for (var j = 0; j < 3; j++) { var c = nearestTo(s, b.x, b.y, true, l.length ? l[l.length - 1] : -1); if (c >= 0 && l.indexOf(c) < 0) { l.push(c); setOv(pl(s, c), b.x - dir * 0.5 + rnd(-1, 1), b.y + rnd(-1.5, 1.5), 1); } }
        P.excT = 0.35;
      }]);
      st.push([0.4, function () { var c = nearestTo(s, b.x, b.y, true); if (c >= 0) { giveTo(s, c); P.own = s; icon(s, c, "👟"); } }]);
      st.push([0.6, function () { finish(); }]);
      return run(st, false)[0];
    }
    if (k === "combo" || k === "tri" || k === "fast" || k === "slow") {
      var slow = k === "slow", n = slow ? 3 : 4, cur = -1;
      st.push([0.2, function () { P.own = s; ensureBall(s, null); cur = b.hs === s ? b.hi : -1; }]);
      for (var j = 0; j < n; j++) st.push([slow ? 0.8 : 0.32, function () {
        if (!(b.m === 0 && b.hs === s)) return;
        cur = b.hi;
        var p = pl(s, cur); if (!p) return;
        var best = -1, bw = -1;
        for (var q = 0; q < P.T[s].length; q++) {
          var o = pl(s, q); if (!o || q === cur || o.gk) continue;
          var dx = o.x - p.x, dy = o.y - p.y, dd = Math.sqrt(dx * dx + dy * dy);
          var w = slow ? (Math.abs(dx) < 10 && dd > 8 && dd < 28 ? 2 : 0.2) : (dd > 6 && dd < 18 ? 1.5 + dx * dir * 0.05 : 0.1);
          w *= 0.5 + Math.random(); if (w > bw) { bw = w; best = q; }
        }
        if (best < 0) return;
        var r = P.T[s][best], tx = r.x + (slow ? 0 : dir * 2), ty = r.y;
        setOv(r, tx, ty, slow ? 0.5 : 1);
        if (!slow) setOv(p, p.x + dir * 6, p.y + (p.y > MIDY ? -3 : 3), 1);
        kick(tx, ty, {prof: 0, d: slow ? 0.85 : 0.36, then: sg(function () { receive(s, best); })});
      }]);
      st.push([0.3, function () { finish(); }]);
      return run(st, false)[0];
    }
    return P.ck;
  }
  /* despeje de cabeza o de pie del equipo s: el balón sale rebotado a un lado */
  function clearance(s, h) {
    P.lt = s;
    var b = P.ball, dir = s === 0 ? 1 : -1, a = Math.atan2(rnd(-1, 1), dir * rnd(0.6, 1.2)), v = rnd(11, 16);
    b.m = 2; b.fl = null; b.hs = -1; b.hi = -1; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.vz = h * 0.9; b.z = Math.max(b.z, 1.8); b.spin = rnd(-0.3, 0.3);
    P.chase = -1; P.excT = 0.2;
  }

  /* jugadas que cuentan los comentarios */
  function event(e) {
    if (!P) return;
    if (P.rp) { P.rp.ev.push(e); return; }
    /* arranca la segunda parte: fuera el cartel del descanso */
    if (e.t !== "half" && e.t !== "end") clearHalf();
    var t0 = P.ck, cue = e.cue;
    if (e.t === "goal" || e.t === "save" || e.t === "miss" || e.t === "post") t0 = shotEvent(e);
    else if (e.t === "half" || e.t === "end") {
      P.q = []; P.cele = null; P.hardUntil = 0; P.softUntil = 0; P.focus = null; clearOv(); P.excT = 0;
      P.msg = {t: e.t === "half" ? P.lab.half : P.lab.end, s: -1, at: P.ck, keep: true};
      Snd.whistle(e.t === "half" ? [0.32, 0.9] : [0.3, 0.3, 1.2]);
      /* segunda parte: se cambian los campos y saca el otro equipo */
      if (e.t === "half") { P.flip = !P.flip; P.half2 = true; snapKickoff(); kickoff(1 - P.ko0); P.cam.x = LEN / 2; P.cam.y = MIDY; P.cam.z = 1; }
    } else if (P.ck < P.hardUntil) {
      /* durante una ocasión, el comentario previo no interrumpe: sale ya */
      /* tarjeta durante una ocasión: la falta se juega en cuanto acaba la jugada */
      if (e.t === "yellow" || e.t === "red") {
        var rs = e.side, ri = e.who != null && pl(e.side, e.who) ? e.who : anyOf(byPos(e.side, /^(?!POR)/)), ct = e.t;
        t0 = P.hardUntil + 0.25;
        setTimeout2(P.hardUntil - P.ck + 0.25, function () { foulPlay(rs, pl(rs, ri) ? ri : anyOf(byPos(rs, /^(?!POR)/)), ct); });
      }
    } else t0 = playEvent(e);
    var at0 = t0 == null ? P.ck : t0, txt = e.txt;
    cueAt(at0, function () { if (cue) cue(); ticker(txt); });
  }
  function effRate() { return P.speed >= 3 && P.ck < P.hiUntil ? SPEEDK : P.rate; }
  function busy() {
    if (!P) return 0;
    var b = Math.max(0, P.hardUntil - P.ck) / effRate() * 1000;
    if (P.rp) b += (P.rp.fr[P.rp.fr.length - 1].ck - P.rp.ck) / 0.42 * 1000;
    if (P.rpAt) b += Math.max(0, P.rpAt.at - P.ck) / effRate() * 1000 + (P.rpAt.to - P.rpAt.from) / 0.42 * 1000;
    return b;
  }
  function reset() {
    if (!P) return;
    flushCues();
    P.q = []; P.cele = null; P.hardUntil = 0; P.softUntil = 0; P.msg = null; P.focus = null; P.stopUntil = 0;
    clearOv(); kickoff(P.own);
  }

  /* ---------- simulación de cada fotograma ---------- */
  function tick(dt) {
    var sdt = dt * effRate(), ck, s, i;
    P.ck += sdt; ck = P.ck;
    while (P.q.length && P.q[0].at <= ck) { var st = P.q.shift(); try { st.go(); } catch (e) { if (window.console) console.error(e); } }
    for (i = P.cues.length - 1; i >= 0; i--) if (P.cues[i].at <= ck + 0.01) { var c = P.cues[i]; P.cues.splice(i, 1); try { c.fn(); } catch (e2) {} }
    ballTick(sdt);
    P.lastSdt = sdt;
    interceptCheck();
    var b = P.ball, scr = scripted();
    /* balón fuera: se para y se reanuda con banda, córner o saque de puerta */
    if (!scr && !P.cele && b.m === 2 && ck > P.stopUntil && outOfPlay(b)) { restartOut(); scr = scripted(); }
    for (s = 0; s < 2; s++) for (i = 0; i < P.T[s].length; i++) { var po = P.T[s][i]; if (po && po.off && !po.gone && ck - po.off.t0 > 3.2) { po.gone = true; if (b.m === 0 && b.hs === s && b.hi === i) b.m = 2; } }
    /* robo tras cambio de posesión */
    if (P.steal >= 0 && !scr) {
      if (ck > P.stealUntil) {
        if (!(b.m === 0 && b.hs === P.steal)) { var n0 = nearestTo(P.steal, b.x, b.y, true); if (n0 >= 0) { var q0 = P.T[P.steal][n0]; kick(q0.x, q0.y, {prof: 0, d: 0.5, then: (function (ss, nn) { return function () { receive(ss, nn); }; })(P.steal, n0)}); } }
        P.steal = -1;
      } else if (b.m === 0 && b.hs === P.steal) P.steal = -1;
    }
    for (s = 0; s < 2; s++) shape(s, sdt, ck, scr);
    for (s = 0; s < 2; s++) for (i = 0; i < P.T[s].length; i++) { var p = P.T[s][i]; if (p) move(p, s, sdt, ck); }
    /* entradas y balón suelto */
    if (b.m === 0 && P.steal >= 0 && !scr && b.hs !== P.steal) {
      var ns = nearestTo(P.steal, b.x, b.y, true);
      if (ns >= 0) { var sp0 = P.T[P.steal][ns], dx0 = sp0.x - b.x, dy0 = sp0.y - b.y; if (dx0 * dx0 + dy0 * dy0 < 1.8) { var lostP = pl(b.hs, b.hi); if (lostP) lostP.lag = ck + 0.5; giveTo(P.steal, ns); if (Math.random() < 0.35) icon(P.steal, ns, "👟"); P.steal = -1; } }
    }
    if (b.m === 2 && P.chase !== -2) {
      var cs = P.chase >= 0 ? P.chase : scr ? -1 : P.own;
      if (cs >= 0 && b.z < 1.3) {
        var nc = nearestTo(cs, b.x, b.y, false);
        if (nc >= 0) { var cp = P.T[cs][nc], dx1 = cp.x - b.x, dy1 = cp.y - b.y; if (dx1 * dx1 + dy1 * dy1 < 1.3) giveTo(cs, nc); }
      }
    }
    /* pases en juego abierto */
    if (b.m === 0 && !scr && !P.cele && P.steal < 0 && ck > P.passAt && ck > P.stopUntil) openPass();
    for (i = P.cards.length - 1; i >= 0; i--) if (ck - P.cards[i].at > 2.6) P.cards.splice(i, 1);
    if (P.flag && ck - P.flag.t0 > 2.6) P.flag = null;
    /* emoción de la grada: peligro cerca del área */
    var hs = b.m === 0 ? b.hs : P.own, du = hs === 0 ? LEN - b.x : b.x, base = du < 30 ? (30 - du) / 30 * 0.45 : 0;
    var tgt = Math.max(base, P.excT);
    P.exc += (tgt - P.exc) * Math.min(1, dt * 2.5);
    if (now() - P.sndAt > 120) { P.sndAt = now(); Snd.exc(P.exc); }
    /* cámara */
    camera(dt);
  }
  /* forma del equipo: bloque alto/bajo, amplitud, marcas, presión */
  function shape(s, sdt, ck, scr) {
    var team = P.T[s], d = 1 - s, dir = s === 0 ? 1 : -1, b = P.ball, tac = P.tac[s];
    var att = (b.m === 0 ? b.hs : P.own) === s, bu = s === 0 ? b.x : LEN - b.x, Ld, span, wk, k;
    var blk = tac.blk, stop = ck < P.stopUntil;
    if (att) { Ld = clamp(bu - 36, 13, 50) + blk * 2.5; span = 0.95; wk = [0.8, 1, 1.12][tac.width]; }
    else {
      Ld = clamp(bu - (25 - blk * 2.5), [8, 12, 17, 23, 31][blk + 2], [19, 27, 36, 44, 52][blk + 2]);
      span = [0.42, 0.5, 0.56, 0.6, 0.64][blk + 2]; wk = blk <= -2 ? 0.6 : 0.72;
      if (ck < P.ret[s] || (tac.ret && bu < 45)) { Ld = Math.min(Ld, 15); span = Math.min(span, 0.46); }
    }
    if (ck < P.trap[s]) Ld += 6.5;
    P.line[s] = Ld;
    var offU = Math.max(LEN - P.line[d], bu) + 1;
    var press1 = -1, press2 = -1, press3 = -1;
    if (!att && !scr && !P.cele && !stop) {
      press1 = nearestTo(s, b.x, b.y, true);
      if (blk >= 1 || tac.press || ck < P.cp[s] || P.steal === s) press2 = nearestTo(s, b.x, b.y, true, press1);
      if (ck < P.cp[s] && press2 >= 0) press3 = nearestTo(s, b.x, b.y, true, press1, press2);
    }
    var chaseI = -1;
    if (b.m === 2 && P.chase !== -2 && !P.cele) { var cs = P.chase >= 0 ? P.chase : P.own; if (cs === s || !scr) chaseI = nearestTo(s, b.x, b.y, false); }
    for (var i = 0; i < team.length; i++) {
      var p = team[i]; if (!p) continue;
      var tx, ty, sp = 0.55;
      if (p.gone) { tx = p.x; ty = p.off ? p.off.y : p.y; sp = 0.3; }
      else if (p.off) { tx = p.x; ty = p.off.y; sp = 0.45; }
      else if (P.cele && P.cele.s === s) {
        var c = P.cele; tx = i === c.who ? c.x : lerp(p.x, c.x, p.gk ? 0 : 0.55); ty = i === c.who ? c.y : lerp(p.y, c.y, p.gk ? 0 : 0.5); sp = 0.9;
        if (i !== c.who) { tx += Math.cos(p.ph) * 2.2; ty += Math.sin(p.ph) * 2.2; }
      } else if (p.ov) { tx = p.ov.x; ty = p.ov.y; sp = p.ov.sp; }
      else if (stop) { tx = p.x; ty = p.y; sp = 0.3; }
      else if (b.m === 0 && b.hs === s && b.hi === i && p.gk) { tx = p.x; ty = p.y; sp = 0.3; }
      else if (b.m === 0 && b.hs === s && b.hi === i) {
        /* conduce: avanza hacia donde el motor dice que está el juego */
        var goalDir = clamp((P.bxw - p.x) * dir, -4, 10) * dir;
        tx = p.x + (Math.abs(goalDir) > 1 ? goalDir : dir * 2); ty = p.y + Math.sin(ck * 0.9 + p.ph) * 3 + (MIDY - p.y) * 0.08; sp = 0.62 * [0.85, 1, 1.15][tac.tempo];
      } else if (P.recv && P.recv.s === s && P.recv.i === i) { tx = P.recv.x; ty = P.recv.y; sp = 1; }
      else if (i === chaseI || i === press1 || i === press2 || i === press3) {
        tx = b.x - dir * 0.6; ty = b.y; sp = i === press1 || i === chaseI ? 0.95 : 0.85;
        if (!att && (i === press2 || i === press3)) { ty += i === press2 ? 2 : -2; tx -= dir * 1.5; }
      } else if (p.gk) {
        var gu = att ? clamp(10 + (bu - 50) * 0.18, 4, 22) : clamp(3 + Math.max(0, bu - 30) * 0.11 + (blk >= 1 ? 2.5 : 0), 1.2, 15);
        tx = U(s, gu); ty = MIDY + clamp((b.y - MIDY) * 0.3, -5, 5); sp = 0.6;
      } else {
        var u = Ld + (p.hu - 21) * span, oy = p.hy - MIDY;
        if (att) {
          if (WIDE[p.pos] && tac.width === 2 && p.hu > 40) oy = (oy > 0 ? 1 : -1) * 31;
          else if (WIDE[p.pos] && tac.width === 0) oy *= 0.62;
          else oy *= wk;
          if (tac.width === 0 || tac.pass === 0) oy += (b.y - MIDY) * 0.22;
          if (tac.pass === 2 && p.hu > 60) u += 4;
          if (!BACK[p.pos]) u = Math.min(u, offU);
        } else {
          oy = oy * wk + (b.y - MIDY) * 0.36;
        }
        u = clamp(u, 3, LEN - 3);
        tx = U(s, u); ty = MIDY + oy;
        /* marca: los de atrás se ajustan al rival más cercano sin romper la línea */
        if (!att && !scr) {
          if (ck > p.mkT) { p.mkT = ck + 0.4 + Math.random() * 0.2; p.mk = nearestTo(d, tx, ty, true); }
          var mkp = pl(d, p.mk);
          if (mkp) {
            var mdx = mkp.x - tx, mdy = mkp.y - ty;
            if (mdx * mdx + mdy * mdy < 180) {
              if (BACK[p.pos]) ty = lerp(ty, mkp.y, 0.5);
              else { tx = lerp(tx, mkp.x - dir * 1.8, 0.4); ty = lerp(ty, mkp.y, 0.45); }
            }
          }
        }
        /* pasos de ajuste */
        if (ck > p.jt) { p.jt = ck + 1.1 + Math.random() * 1.7; p.jx = rnd(-1.4, 1.4); p.jy = rnd(-1.6, 1.6); }
        tx += p.jx; ty += p.jy;
        if (att) sp = 0.55 * [0.85, 1, 1.18][tac.tempo];
        if (ck < P.trap[s] && BACK[p.pos]) sp = 1;
      }
      /* percepción con retardo: los que defienden reaccionan algo tarde; el que se come el amago, mucho más */
      if (p.lag > ck) { /* sigue con el objetivo viejo */ }
      else {
        k = Math.min(1, sdt / (p.ov ? 0.05 : att ? 0.1 : 0.2));
        p.tx += (tx - p.tx) * k; p.ty += (ty - p.ty) * k;
      }
      p.sp = sp;
    }
  }
  /* movimiento con inercia: aceleración, frenada y radio de giro según velocidad y masa */
  function move(p, s, sdt, ck) {
    if (p.dive) {
      var dv = p.dive, k = (ck - dv.t0) / dv.d;
      if (k < 1) { var e = 1 - (1 - k) * (1 - k); p.x = lerp(dv.x0, dv.x1, e); p.y = lerp(dv.y0, dv.y1, e); p.vx = 0; p.vy = 0; p.fa = dv.a; return; }
      if (ck - dv.t0 - dv.d < dv.lie) { p.vx = 0; p.vy = 0; return; }
      p.dive = null; p.tx = p.x; p.ty = p.y;
    }
    var fat = 0.7 + 0.3 * p.st, vmax = (2.2 + 6.2 * p.sp) * p.pace * fat, acc = p.acc * (0.75 + 0.25 * p.st);
    /* el rematador de una jugada narrada esprinta para llegar a tiempo a su punto de remate */
    if (P.shooter && P.shooter.s === s && P.T[s][P.shooter.i] === p && ck < P.shooter.until) {
      vmax *= 1.35; acc *= 1.4;
    }
    var sep = separation(p, s), tx0 = p.tx + sep.x, ty0 = p.ty + sep.y;
    var dx = clamp(tx0, p.gone ? -8 : -1, p.gone ? LEN + 8 : LEN + 1) - p.x, dy = clamp(ty0, p.off ? -4 : 0.8, p.off ? WID + 4 : WID - 0.8) - p.y, dist = Math.sqrt(dx * dx + dy * dy);
    var want = dist > 0.12 ? Math.min(vmax, Math.sqrt(2 * acc * 0.75 * dist)) : 0;
    var wx = dist > 0.12 ? dx / dist * want : 0, wy = dist > 0.12 ? dy / dist * want : 0;
    var ax = wx - p.vx, ay = wy - p.vy, spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (spd > 0.6) {
      var ux = p.vx / spd, uy = p.vy / spd, al = ax * ux + ay * uy, ap = -ax * uy + ay * ux;
      var lat = acc * 1.15 * (p.agi || 1) / (1 + spd * 0.2 * p.mass);
      al = clamp(al, -acc * 1.5 * sdt, acc * sdt); ap = clamp(ap, -lat * sdt, lat * sdt);
      ax = al * ux - ap * uy; ay = al * uy + ap * ux;
    } else {
      var am = Math.sqrt(ax * ax + ay * ay), lim = acc * sdt;
      if (am > lim) { ax *= lim / am; ay *= lim / am; }
    }
    p.vx += ax; p.vy += ay; p.x += p.vx * sdt; p.y += p.vy * sdt;
    /* orientación del cuerpo: hacia donde corre, o hacia el balón si está quieto (el portero, siempre al balón) */
    var b = P.ball, ta;
    spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (p.gk || spd < 1.1) ta = Math.atan2(b.y - p.y, b.x - p.x);
    else ta = Math.atan2(p.vy, p.vx);
    var da = wrapA(ta - p.fa), wmax = (p.gk ? 9 : 6.5) * (0.7 + 0.3 * p.st) * sdt;
    p.fa = wrapA(p.fa + clamp(da, -wmax, wmax));
  }
  /* separación de Reynolds adaptada: cada uno guarda unos 2 m de espacio personal (más con los compañeros);
     el que lleva el balón, el que presiona y las jugadas guionizadas pueden llegar al contacto */
  var SEP_R = 2.3;
  function separation(p, s) {
    var out = {x: 0, y: 0}, b = P.ball;
    if (p.dive || p.gone || p.off || p.ov || P.cele) return out;
    var holder = b.m === 0 && b.hs === s && P.T[s][b.hi] === p, presser = !holder && b.m !== 1 && Math.abs(p.tx - b.x) < 2.5 && Math.abs(p.ty - b.y) < 2.5;
    for (var t = 0; t < 2; t++) {
      if (t !== s && (holder || presser)) continue;
      var w = t === s ? 1 : 0.45;
      for (var j = 0; j < P.T[t].length; j++) {
        var q = P.T[t][j]; if (!q || q === p || q.gone || q.off) continue;
        var dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 >= SEP_R * SEP_R) continue;
        var d = Math.sqrt(d2) || 0.01, f = (SEP_R - d) / SEP_R * w;
        out.x += dx / d * f; out.y += dy / d * f;
      }
    }
    var m = Math.sqrt(out.x * out.x + out.y * out.y), lim = p.gk ? 0.6 : 1.6;
    if (m > 0) { var k = Math.min(lim, m * 1.8) / m; out.x *= k; out.y *= k; }
    return out;
  }
  /* intercepción: un pase raso que pasa al alcance de un rival puede tocarlo y desviarse (la posesión la sigue
     marcando el motor del partido, así que el balón suelto lo recupera quien manda en ese minuto) */
  function interceptCheck() {
    var b = P.ball, f = b.fl;
    if (b.m !== 1 || !f || f.prof !== 0 || b.z > 0.9 || scripted() || P.cele || P.lt < 0) return;
    if (!f.cnt) { f.cnt = 1; P.npass = (P.npass || 0) + 1; }
    var d = 1 - P.lt; f.tried = f.tried || {};
    var k = f.t / f.d; if (k < 0.18 || k > 0.92) return;
    for (var j = 0; j < P.T[d].length; j++) {
      var q = pl(d, j); if (!q || q.gk || f.tried[j]) continue;
      var dx = q.x - b.x, dy = q.y - b.y, reach = 0.95 + 0.6 * (q.agi || 1);
      if (dx * dx + dy * dy > reach * reach) continue;
      f.tried[j] = 1; P.icpt = P.icpt || {n: 0, ok: 0}; P.icpt.n++;
      if (Math.random() < 0.3 * (q.agi || 1) * (0.6 + 0.4 * q.st)) {
        P.icpt.ok++;
        var vx = (b.x - b.px) / Math.max(0.001, P.lastSdt || 0.033), vy = (b.y - b.py) / Math.max(0.001, P.lastSdt || 0.033), a = Math.random() * PI2;
        b.m = 2; b.fl = null; b.hs = -1; b.hi = -1; P.recv = null;
        b.vx = vx * 0.3 + Math.cos(a) * 3; b.vy = vy * 0.3 + Math.sin(a) * 3; b.vz = 1.2; b.z = 0.1; b.spin = 0;
        q.lag = P.ck + 0.3; P.chase = P.own; icon(d, j, "🦶");
        return;
      }
    }
  }
  function openPass() {
    var b = P.ball, s = b.hs, me = b.hi, hp = pl(s, me); if (!hp) return;
    var tac = P.tac[s], dir = s === 0 ? 1 : -1, d = 1 - s, best = -1, bw = -1, bfwd = 0, bdist = 0;
    for (var i = 0; i < P.T[s].length; i++) {
      var q = pl(s, i); if (!q || i === me) continue;
      if (q.gk && Math.random() > 0.12) continue;
      var dx = q.x - hp.x, dy = q.y - hp.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < 6) continue;
      var fwd = dx * dir, open = 99;
      for (var j = 0; j < P.T[d].length; j++) { var o = pl(d, j); if (!o) continue; var ox = o.x - q.x, oy = o.y - q.y, od = ox * ox + oy * oy; if (od < open) open = od; }
      open = Math.sqrt(open);
      var w = 0.5 + clamp(open / 8, 0, 1.2);
      w *= tac.pass === 2 ? (fwd > 12 ? 2.4 : 0.6) : tac.pass === 0 ? (dist < 22 ? 1.6 : 0.25) : (dist < 34 ? 1 : 0.35);
      w *= tac.tempo === 0 ? (Math.abs(fwd) < 8 ? 1.8 : 0.6) : tac.tempo === 2 ? (fwd > 0 ? 1.6 : 0.7) : (fwd > -6 ? 1.3 : 0.75);
      w /= 1 + Math.abs(q.x - P.bxw) / 22;
      if (dist > 45) w *= 0.3;
      w *= 0.55 + Math.random();
      if (w > bw) { bw = w; best = i; bfwd = fwd; bdist = dist; }
    }
    if (best < 0) { P.passAt = P.ck + 0.6; return; }
    var r = P.T[s][best], lead = bfwd > 5 && !BACK[r.pos] && !r.gk ? 3.5 : 0.6, tx = r.x + dir * lead + r.vx * 0.3, ty = r.y + r.vy * 0.3;
    var lob = bdist > 30 || (tac.pass === 2 && bfwd > 22);
    P.recv = {s: s, i: best, x: tx, y: ty};
    var dur = (lob ? 0.55 + bdist / 22 : 0.2 + bdist / ([13, 16, 20][tac.tempo])) * (1.06 - 0.12 * (hp.q || 0.5)), tok = best;
    kick(tx, ty, {prof: lob ? 1 : 0, h: lob ? Math.min(10, 1.8 + bdist * 0.1) : 0, d: dur, curve: lob ? rnd(-1.5, 1.5) : 0, then: function () { receive(s, tok); }});
    P.passAt = P.ck + 99;
  }
  function camera(dt) {
    var cam = P.cam, f = P.focus, b = P.ball, tz = 1, tx = LEN / 2, ty = MIDY;
    if (f) { tz = f.z; tx = lerp(f.x, b.x, 0.3); ty = lerp(f.y, b.y, 0.3); }
    else if (P.cele) { tz = 1.25; tx = P.cele.x; ty = P.cele.y; }
    else if (P.ck >= P.camN) {
      /* sigue la acción: neutro en el medio, se acerca al llegar al área */
      var at = b.m === 0 ? b.hs : P.own, du = at === 0 ? LEN - b.x : b.x;
      tz = du < 20 ? 1.4 : du < 34 ? 1.2 : 1;
      tx = lerp(LEN / 2, b.x, tz > 1 ? 0.9 : 0.4); ty = lerp(MIDY, b.y, tz > 1 ? 0.75 : 0.25);
    }
    if (RM) tz = 1 + (tz - 1) * 0.3;
    var kz = Math.min(1, dt * 1.8), kp = Math.min(1, dt * 2.6);
    cam.z += (tz - cam.z) * kz; cam.x += (tx - cam.x) * kp; cam.y += (ty - cam.y) * kp;
    /* que no se vea fuera del campo */
    var hw = (P.w / 2) / (cam.z * P.sx), hh = (P.h / 2) / (cam.z * P.sy), mx = P.m / P.sx, my = P.m / P.sy;
    cam.x = clamp(cam.x, hw - mx, LEN + mx - hw); cam.y = clamp(cam.y, hh - my, WID + my - hh);
    if (hw * 2 >= LEN + 2 * mx) cam.x = LEN / 2;
    if (hh * 2 >= WID + 2 * my) cam.y = MIDY;
  }

  /* ---------- dibujo ---------- */
  function draw() {
    var c = P.ctx, w = P.w, h = P.h, dp = P.dpr, m = P.m, sx = P.sx, sy = P.sy, cam = P.cam, z = cam.z, ck = P.ck, i, s;
    c.setTransform(dp, 0, 0, dp, 0, 0);
    var ox = w / 2 - (m + (P.flip ? LEN - cam.x : cam.x) * sx) * z, oy = h / 2 - (m + cam.y * sy) * z;
    if (P.shake && ck - P.shake < 0.45) { var sa = (0.45 - (ck - P.shake)) * 9; ox += Math.sin(ck * 90) * sa; oy += Math.cos(ck * 77) * sa; }
    c.setTransform(dp * z, 0, 0, dp * z, dp * ox, dp * oy);
    /* segunda parte: los equipos cambian de campo (se dibuja en espejo) */
    if (P.flip) c.transform(-1, 0, 0, 1, 2 * m + LEN * sx, 0);
    var txt = function (t, x, y) { if (P.flip) { c.save(); c.translate(x, y); c.scale(-1, 1); c.fillText(t, 0, 0); c.restore(); } else c.fillText(t, x, y); };
    /* césped a franjas */
    c.fillStyle = "#16472f"; c.fillRect(-20, -20, w + 40, h + 40);
    c.fillStyle = "#1a5236";
    for (i = 1; i < 14; i += 2) c.fillRect(m + i * LEN / 14 * sx, m, LEN / 14 * sx + 0.3, WID * sy);
    c.strokeStyle = "rgba(237,241,232,.72)"; c.lineWidth = 1.3;
    c.strokeRect(m, m, LEN * sx, WID * sy);
    c.beginPath(); c.moveTo(m + LEN / 2 * sx, m); c.lineTo(m + LEN / 2 * sx, m + WID * sy); c.stroke();
    c.beginPath(); c.ellipse(m + LEN / 2 * sx, m + MIDY * sy, 9.15 * sx, 9.15 * sy, 0, 0, PI2); c.stroke();
    c.fillStyle = "rgba(237,241,232,.8)"; c.beginPath(); c.arc(m + LEN / 2 * sx, m + MIDY * sy, 1.6, 0, PI2); c.fill();
    for (s = 0; s < 2; s++) {
      var gx = s === 0 ? 0 : LEN, dd = s === 0 ? 1 : -1, X0 = m + gx * sx;
      c.strokeRect(Math.min(X0, X0 + dd * 16.5 * sx), m + 13.84 * sy, 16.5 * sx, 40.32 * sy);
      c.strokeRect(Math.min(X0, X0 + dd * 5.5 * sx), m + 24.84 * sy, 5.5 * sx, 18.32 * sy);
      c.beginPath(); c.arc(X0 + dd * 11 * sx, m + MIDY * sy, 1.4, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(X0 + dd * 11 * sx, m + MIDY * sy, 9.15 * sx, 9.15 * sy, 0, s === 0 ? -0.927 : Math.PI - 0.927, s === 0 ? 0.927 : Math.PI + 0.927); c.stroke();
      /* portería con red (se mueve al marcar) */
      var nb = 0, nyy = MIDY;
      if (P.net && P.net.gx === gx && ck - P.net.t0 < 1.2) { var nk = ck - P.net.t0; nb = Math.sin(nk * 18) * Math.exp(-nk * 3.2) * 4; nyy = P.net.y; }
      var depth = 2 * sx, y1 = m + (MIDY - PH) * sy, y2 = m + (MIDY + PH) * sy, back = X0 - dd * depth;
      c.save();
      c.fillStyle = "rgba(255,255,255,.08)";
      c.beginPath(); c.moveTo(X0, y1); c.lineTo(back, y1); c.quadraticCurveTo(back - dd * Math.abs(nb), m + nyy * sy, back, y2); c.lineTo(X0, y2); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.22)"; c.lineWidth = 0.6;
      for (var nl = 1; nl < 5; nl++) { var ny = y1 + (y2 - y1) * nl / 5; c.beginPath(); c.moveTo(X0, ny); c.lineTo(back - dd * Math.abs(nb) * Math.sin(Math.PI * nl / 5), ny); c.stroke(); }
      c.strokeStyle = "#f4f6f0"; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(X0, y1); c.lineTo(back, y1); c.quadraticCurveTo(back - dd * Math.abs(nb), m + nyy * sy, back, y2); c.lineTo(X0, y2); c.stroke();
      c.restore();
    }
    /* sombras primero (sol desde arriba a la izquierda) */
    var r = P.r, b = P.ball;
    c.fillStyle = "rgba(0,0,0,.3)";
    for (s = 0; s < 2; s++) for (i = 0; i < P.T[s].length; i++) {
      var p = P.T[s][i]; if (!p || p.gone) continue;
      c.globalAlpha = 1;
      c.beginPath(); c.ellipse(m + p.x * sx + 1.5, m + p.y * sy + r * 0.72, r * 0.95, r * 0.4, 0, 0, PI2); c.fill();
    }
    c.globalAlpha = 1;
    /* sombra del balón: más pequeña, más tenue y desplazada cuanto más alto va */
    var br = Math.max(3.2, r * 0.44), bx = m + b.x * sx, by = m + b.y * sy, bz = b.z;
    c.fillStyle = "rgba(0,0,0," + (0.38 * (1 - Math.min(0.65, bz * 0.07))).toFixed(3) + ")";
    c.beginPath(); c.ellipse(bx + 1 + bz * sx * 0.32, by + br * 0.55 + bz * sy * 0.12, br * (1 - Math.min(0.35, bz * 0.04)), br * 0.45 * (1 - Math.min(0.35, bz * 0.04)), 0, 0, PI2); c.fill();
    /* estela de pases y tiros (0,3 s) */
    var tn = now();
    for (i = P.trails.length - 1; i >= 0; i--) {
      var tl = P.trails[i], ta = (tn - tl.at) / (tl.shot ? 450 : 300);
      if (ta >= 1) { P.trails.splice(i, 1); continue; }
      var tcl = tl.shot ? "255,240,160" : "255,255,255";
      var gr = c.createLinearGradient(m + tl.x0 * sx, m + tl.y0 * sy, m + tl.x1 * sx, m + tl.y1 * sy);
      gr.addColorStop(0, "rgba(" + tcl + ",0)"); gr.addColorStop(1, "rgba(" + tcl + "," + ((1 - ta) * (tl.shot ? 0.75 : 0.45)).toFixed(3) + ")");
      c.strokeStyle = gr; c.lineWidth = tl.shot ? 2.6 : 1.8; c.lineCap = "round";
      c.beginPath(); c.moveTo(m + tl.x0 * sx, m + tl.y0 * sy); c.lineTo(m + tl.x1 * sx, m + tl.y1 * sy); c.stroke();
    }
    if (P.trails.length > 12) P.trails.splice(0, P.trails.length - 12);
    /* línea del fuera de juego */
    if (P.offLine) {
      var oa = (tn - P.offLine.at) / 2600;
      if (oa >= 1) P.offLine = null;
      else {
        var lx = m + P.offLine.x * sx, al = oa < 0.1 ? oa / 0.1 : oa > 0.75 ? (1 - oa) / 0.25 : 1;
        c.save(); c.setLineDash([6, 5]); c.lineDashOffset = -tn / 40;
        c.strokeStyle = "rgba(255,236,120," + (0.95 * al).toFixed(3) + ")"; c.lineWidth = 2.2; c.shadowColor = "rgba(255,236,120,.9)"; c.shadowBlur = 8;
        c.beginPath(); c.moveTo(lx, m); c.lineTo(lx, m + WID * sy); c.stroke(); c.restore();
      }
    }
    /* destello en el punto de la falta */
    for (i = P.fx.length - 1; i >= 0; i--) {
      var fe = P.fx[i], fa2 = (tn - fe.at) / 900;
      if (fa2 >= 1) { P.fx.splice(i, 1); continue; }
      var fxx = m + fe.x * sx, fyy = m + fe.y * sy, rad = r * (1 + fa2 * 3.2), cl = fe.red ? "255,59,72" : "255,210,58";
      var rg = c.createRadialGradient(fxx, fyy, 0, fxx, fyy, rad);
      rg.addColorStop(0, "rgba(" + cl + "," + (0.85 * (1 - fa2)).toFixed(3) + ")"); rg.addColorStop(1, "rgba(" + cl + ",0)");
      c.fillStyle = rg; c.beginPath(); c.arc(fxx, fyy, rad, 0, PI2); c.fill();
      c.strokeStyle = "rgba(" + cl + "," + (1 - fa2).toFixed(3) + ")"; c.lineWidth = 2; c.beginPath(); c.arc(fxx, fyy, r * (0.6 + fa2 * 2.4), 0, PI2); c.stroke();
    }
    /* jugadores */
    if (P.fontR !== r) { P.fontR = r; P.font = "800 " + Math.round(r * 1.02) + "px Archivo, system-ui, sans-serif"; }
    c.textAlign = "center"; c.textBaseline = "middle"; c.font = P.font;
    for (s = 0; s < 2; s++) {
      var col = P.cols[s], tcol = ink(col), gcol = shade(col, 0.68), gink = ink(gcol), edge = lum(col) > 0.6 ? shade(col, 0.55) : "rgba(255,255,255,.85)";
      for (i = 0; i < P.T[s].length; i++) {
        var q = P.T[s][i]; if (!q || q.gone) continue;
        var x = m + q.x * sx, y = m + q.y * sy, hold = b.m === 0 && b.hs === s && b.hi === i, fill = q.gk ? gcol : col;
        c.globalAlpha = 1;
        if (q.off) { fill = "#6e0f18"; var oA = ck - q.off.t0; c.globalAlpha = Math.max(0, Math.min(1, 3.2 - oA)) * (0.55 + 0.45 * Math.abs(Math.sin(oA * 7))); }
        var fx = Math.cos(q.fa) * sx, fy = Math.sin(q.fa) * sy, fl = Math.sqrt(fx * fx + fy * fy) || 1; fx /= fl; fy /= fl;
        if (hold) { c.strokeStyle = "rgba(255,178,30,.9)"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 3, 0, PI2); c.stroke(); }
        if (q.dive) {
          /* estirada del portero: cuerpo alargado hacia el balón */
          var dk = clamp((ck - q.dive.t0) / q.dive.d, 0, 1), len = r * (0.4 + 1.1 * Math.min(1, dk * 1.6));
          var ang = Math.atan2(Math.sin(q.dive.a) * sy, Math.cos(q.dive.a) * sx);
          c.save(); c.translate(x, y); c.rotate(ang);
          c.fillStyle = fill; c.beginPath(); c.ellipse(len * 0.35, 0, r + len * 0.5, r * 0.78, 0, 0, PI2); c.fill();
          c.lineWidth = 1.5; c.strokeStyle = edge; c.stroke();
          c.fillStyle = "#e9f4d0"; c.beginPath(); c.arc(len * 0.35 + r + len * 0.42, -r * 0.35, r * 0.28, 0, PI2); c.arc(len * 0.35 + r + len * 0.42, r * 0.35, r * 0.28, 0, PI2); c.fill();
          c.restore();
        } else {
          c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, PI2); c.fill();
          c.lineWidth = 1.5; c.strokeStyle = edge; c.stroke();
          /* muesca de orientación del cuerpo */
          c.fillStyle = edge; c.beginPath();
          c.moveTo(x + fx * (r + 3.6), y + fy * (r + 3.6));
          c.lineTo(x + (fx * 0.88 - fy * 0.48) * r, y + (fy * 0.88 + fx * 0.48) * r);
          c.lineTo(x + (fx * 0.88 + fy * 0.48) * r, y + (fy * 0.88 - fx * 0.48) * r);
          c.closePath(); c.fill();
        }
        c.fillStyle = q.off ? "#ffd7da" : q.gk ? gink : tcol;
        txt(String(q.n), x, y + 0.5);
        /* amonestado: contorno amarillo fijo */
        if (q.yc && !q.off) { c.strokeStyle = "#ffd23a"; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, r + 2.2, 0, PI2); c.stroke(); }
        if (q.off) { c.strokeStyle = "#ff3b48"; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, r + 2.2, 0, PI2); c.stroke(); }
        /* agotado: pulso */
        if (q.st < 0.3 && !q.off && !q.gk) { var pu = 0.5 + 0.5 * Math.sin(ck * 6 + q.ph); c.globalAlpha = 0.45 + 0.5 * pu; c.font = Math.round(r * 0.95) + "px sans-serif"; txt("💓", x + r * 0.95, y - r * 1.05); c.font = P.font; c.globalAlpha = 1; }
        /* cansancio: arco rojo/ámbar que se vacía */
        if (q.st < 0.5 && !q.gone) {
          c.strokeStyle = q.st < 0.3 ? "rgba(255,80,80,.95)" : "rgba(255,178,30,.9)"; c.lineWidth = 1.6;
          c.beginPath(); c.arc(x, y, r + 1.6, -Math.PI / 2, -Math.PI / 2 + PI2 * q.st); c.stroke();
        }
        if (q.flash != null && ck - q.flash < 1.6) { c.strokeStyle = "rgba(102,185,255," + (1 - (ck - q.flash) / 1.6).toFixed(2) + ")"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 5, 0, PI2); c.stroke(); }
        c.globalAlpha = 1;
      }
    }
    /* tarjetas */
    for (i = 0; i < P.cards.length; i++) {
      var kd = P.cards[i], cp = pl(kd.s, kd.i) || (P.T[kd.s] && P.T[kd.s][kd.i]); if (!cp || ck < kd.at) continue;
      var ka = ck - kd.at, kp = kd.pop ? (ka < 0.25 ? 0.4 + ka / 0.25 * 1.0 : ka < 0.4 ? 1.4 - (ka - 0.25) / 0.15 * 0.4 : 1) : 1;
      var kw = r * 0.95 * kp, kh = r * 1.35 * kp, kx = m + cp.x * sx - kw / 2, ky = m + cp.y * sy - r * 1.5 - kh - Math.min(5, ka * 6);
      c.save(); c.globalAlpha = ka > 2.1 ? Math.max(0, 1 - (ka - 2.1) / 0.5) : 1;
      c.fillStyle = kd.red ? "#ff3b48" : "#ffd23a"; c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = 1.2; c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 6;
      c.fillRect(kx, ky, kw, kh); c.shadowBlur = 0; c.strokeRect(kx, ky, kw, kh); c.restore();
    }
    /* banderín de fuera de juego */
    if (P.flag && Math.floor(now() / 200) % 2 === 0) {
      var fxp = m + P.flag.x * sx, fyp = m + P.flag.y * sy, up = P.flag.y > MIDY ? -1 : 1;
      c.strokeStyle = "#f4f6f0"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(fxp, fyp); c.lineTo(fxp, fyp + up * 12); c.stroke();
      c.fillStyle = "#ffd23a"; c.fillRect(fxp, fyp + up * 12 - (up < 0 ? 0 : 6), 7, 6);
      c.fillStyle = "#ff3b48"; c.fillRect(fxp + 3.5, fyp + up * 12 - (up < 0 ? 0 : 6), 3.5, 3);
    }
    /* balón (crece con la altura) */
    var lift = bz * sy * 0.55, rr = br * (1 + Math.min(1.4, bz * 0.085));
    c.fillStyle = "#fbfbf6"; c.strokeStyle = "#20262a"; c.lineWidth = 1.1;
    c.beginPath(); c.arc(bx, by - lift, rr, 0, PI2); c.fill(); c.stroke();
    c.fillStyle = "#20262a"; c.beginPath(); c.arc(bx, by - lift, rr * 0.36, 0, PI2); c.fill();
    /* iconos flotantes sobre las fichas */
    c.font = Math.round(r * 1.25) + "px sans-serif";
    for (i = P.icons.length - 1; i >= 0; i--) {
      var ic = P.icons[i], ia = (tn - ic.at) / 1500, ip = P.T[ic.s] && P.T[ic.s][ic.i];
      if (ia >= 1 || !ip || ip.gone) { P.icons.splice(i, 1); continue; }
      c.globalAlpha = ia < 0.15 ? ia / 0.15 : ia > 0.7 ? (1 - ia) / 0.3 : 1;
      txt(ic.ic, m + ip.x * sx, m + ip.y * sy - r * 2 - ia * r * 1.2);
    }
    c.globalAlpha = 1; c.font = P.font;
    /* rótulos (sin cámara) */
    c.setTransform(dp, 0, 0, dp, 0, 0);
    if (P.msg) {
      var age = ck - P.msg.at, life = P.msg.small ? 1.4 : P.msg.long ? 2.3 : 1.9;
      if (!P.msg.keep && age > life + 0.4) P.msg = null;
      else {
        var a = P.msg.keep ? 0.92 : Math.min(1, age / 0.16) * (age > life ? Math.max(0, 1 - (age - life) / 0.4) : 1), hh = P.msg.small ? h * 0.15 : h * 0.26;
        c.globalAlpha = a;
        c.fillStyle = "rgba(6,12,14,.55)"; c.fillRect(0, h / 2 - hh / 2, w, hh);
        c.fillStyle = P.msg.s < 0 ? "#edf1e8" : P.cols[P.msg.s];
        var fs0 = Math.round(P.msg.small ? h * 0.1 : h * 0.18);
        c.font = "900 " + fs0 + "px 'Big Shoulders Display', Impact, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        var mw = c.measureText(P.msg.t).width; if (mw > w * 0.92) { fs0 = Math.floor(fs0 * w * 0.92 / mw); c.font = "900 " + fs0 + "px 'Big Shoulders Display', Impact, sans-serif"; }
        c.strokeStyle = "rgba(0,0,0,.6)"; c.lineWidth = 4; c.strokeText(P.msg.t, w / 2, h / 2 + 2); c.fillText(P.msg.t, w / 2, h / 2 + 2);
        c.globalAlpha = 1;
      }
    }
  }
  /* ---------- repeticiones (versión 3.1): se graban los últimos segundos y se reproducen a cámara lenta ---------- */
  function rpRec() {
    var f = P.rpF = P.rpF || [], ck = P.ck;
    if (f.length && ck - f[f.length - 1].ck < 0.05) return;
    var b = P.ball, t = [[], []];
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var o = P.T[s][i]; t[s].push(o ? [o.x, o.y, o.fa] : null); }
    f.push({ck: ck, b: [b.x, b.y, b.z], t: t, fl: P.flip});
    while (f.length && ck - f[0].ck > 9) f.shift();
  }
  function rpStart(from, to) {
    var fr = (P.rpF || []).filter(function (x) { return x.ck >= from && x.ck <= to; });
    if (fr.length < 8) return false;
    var save = {b: [P.ball.x, P.ball.y, P.ball.z], t: [[], []], cam: {x: P.cam.x, y: P.cam.y, z: P.cam.z}, msg: P.msg, flip: P.flip};
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var o = P.T[s][i]; save.t[s].push(o ? [o.x, o.y, o.fa] : null); }
    P.rp = {fr: fr, k: 0, ck: fr[0].ck, save: save, ev: []}; P.msg = null;
    return true;
  }
  function rpApply(a, b, k) {
    var bl = P.ball; bl.x = lerp(a.b[0], b.b[0], k); bl.y = lerp(a.b[1], b.b[1], k); bl.z = lerp(a.b[2], b.b[2], k); P.flip = a.fl;
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var o = P.T[s][i], pa = a.t[s][i], pb = b.t[s][i]; if (o && pa && pb) { o.x = lerp(pa[0], pb[0], k); o.y = lerp(pa[1], pb[1], k); o.fa = pa[2]; } }
  }
  function rpStep(dt) {
    var R = P.rp, fr = R.fr;
    R.ck += dt * 0.42;
    while (R.k < fr.length - 2 && fr[R.k + 1].ck <= R.ck) R.k++;
    var a = fr[R.k], b = fr[Math.min(R.k + 1, fr.length - 1)], k = b.ck > a.ck ? clamp((R.ck - a.ck) / (b.ck - a.ck), 0, 1) : 1;
    rpApply(a, b, k);
    /* otro ángulo: cámara cerrada sobre el balón */
    var cam = P.cam, bl = P.ball, kz = Math.min(1, dt * 2.2);
    cam.z += (1.75 - cam.z) * kz; cam.x += (bl.x - cam.x) * kz; cam.y += (bl.y - cam.y) * kz;
    if (R.ck >= fr[fr.length - 1].ck) rpEnd();
  }
  function rpEnd() {
    var R = P.rp, sv = R.save; if (!R) return;
    P.ball.x = sv.b[0]; P.ball.y = sv.b[1]; P.ball.z = sv.b[2]; P.flip = sv.flip;
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var o = P.T[s][i], q = sv.t[s][i]; if (o && q) { o.x = q[0]; o.y = q[1]; o.fa = q[2]; } }
    P.cam.x = sv.cam.x; P.cam.y = sv.cam.y; P.cam.z = sv.cam.z;
    P.rp = null; P.last = now();
    R.ev.forEach(function (e) { try { event(e); } catch (er) {} });
  }
  function rpBadge() {
    var c = P.ctx, dp = P.dpr, t = "↺ " + (P.lab.replay || "REPETICIÓN");
    c.setTransform(dp, 0, 0, dp, 0, 0);
    c.font = "800 12px 'Archivo', sans-serif"; c.textAlign = "left"; c.textBaseline = "middle";
    var w = c.measureText(t).width + 26, x0 = P.w - w - 8;
    c.fillStyle = "rgba(11,20,23,.78)"; c.fillRect(x0, 8, w, 22);
    c.fillStyle = "#ffb21e"; c.fillText(t, x0 + 8, 19);
    if (Math.floor(now() / 500) % 2) { c.fillStyle = "#ff5b66"; c.beginPath(); c.arc(x0 + w - 9, 19, 3.5, 0, 6.3); c.fill(); }
  }
  function replay() { if (!P || P.rp || P.frozen) return false; return rpStart(P.ck - 6, P.ck); }
  /* bucle: la física avanza a paso fijo (30 por segundo, con subpasos a velocidad alta) y el dibujo interpola
     entre los dos últimos estados, así se ve igual de suave en cualquier pantalla y la simulación no depende de los FPS */
  var STEP = 1 / 30;
  function snap() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < P.T[s].length; i++) { var p = P.T[s][i]; if (p) { p.ix = p.x; p.iy = p.y; } }
    var b = P.ball; b.ix = b.x; b.iy = b.y; b.iz = b.z;
  }
  function drawLerp(a) {
    var L = [], b = P.ball, s, i, p;
    for (s = 0; s < 2; s++) for (i = 0; i < P.T[s].length; i++) { p = P.T[s][i]; if (p && p.ix != null) { L.push(p, p.x, p.y); p.x = lerp(p.ix, p.x, a); p.y = lerp(p.iy, p.y, a); } }
    var bx = b.x, by = b.y, bz = b.z;
    if (b.ix != null) { b.x = lerp(b.ix, b.x, a); b.y = lerp(b.iy, b.y, a); b.z = lerp(b.iz, b.z, a); }
    try { draw(); } finally {
      for (i = 0; i < L.length; i += 3) { L[i].x = L[i + 1]; L[i].y = L[i + 2]; }
      b.x = bx; b.y = by; b.z = bz;
    }
  }
  function loop() {
    if (!P || !P.run) return;
    var t = now(), dt = Math.min(0.1, (t - P.last) / 1000);
    P.last = t;
    if (!document.hidden) {
      if (P.rp) { rpStep(dt); draw(); rpBadge(); }
      else if (P.frozen) draw();
      else {
        P.acc = (P.acc || 0) + dt;
        var n = 0;
        while (P.acc >= STEP && n < 6) {
          P.acc -= STEP; n++;
          snap();
          var sub = Math.max(1, Math.ceil(effRate() / 1.25));
          for (var k = 0; k < sub; k++) tick(STEP / sub);
          rpRec();
          if (P.rpAt && P.ck >= P.rpAt.at) { var ra = P.rpAt; P.rpAt = null; rpStart(ra.from, ra.to); break; }
        }
        if (n >= 6) P.acc = 0;
        if (P.rp) draw(); else drawLerp(clamp(P.acc / STEP, 0, 1));
      }
    }
    requestAnimationFrame(loop);
  }
  function clearMsg() { if (P) P.msg = null; }
  function clearHalf() { if (P && P.msg && P.msg.keep && P.msg.t === P.lab.half) P.msg = null; }
  function freeze(v) { if (P) { if (v && !P.frozen) flushCues(); P.frozen = !!v; if (!v) { P.last = now(); if (P.half2) clearHalf(); } } }
  return {mount: mount, destroy: destroy, teams: teams, state: state, event: event, busy: busy, reset: reset, clearMsg: clearMsg, freeze: freeze, replay: replay,
    active: function () { return !!P; }, sound: function () { return Snd.isOn(); }, debug: function () { return P; }};
})();
