/* sp-modes.js — minijuegos de balón parado en 3D (5.6).
   - Clásicos (penalti y parar penalti): misma mecánica, reglas, azar y puntuación que minigame.js; aquí solo
     cambia la presentación (escena vóxel, física visual del balón y la red, animaciones, cámara, sonido).
   - Nuevos: falta directa como lanzador y como portero (barrera), penalti avanzado por gestos y parada avanzada.
   - Ajustes, estadísticas, logros, recompensas, retos y entrenamiento. */
var SpModes = (function () {
  "use strict";
  if (typeof SP3 === "undefined" || !SP3 || typeof SpPhys === "undefined") return null;
  var PI = Math.PI, HW = SpPhys.HW, GH = SpPhys.GH, R = SpPhys.R, D = SP_DATA;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function t(s, p) { return typeof tr === "function" ? tr(s, p) : String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? p[k] : m; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function hap(k) { try { Anim.haptic(k); } catch (e) {} }
  function red() { try { return Anim.reduced(); } catch (e) { return false; } }

  /* ---------- ajustes (camino.sp) ---------- */
  var KEY = "camino.sp";
  function prefs() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return {ctrl: o.ctrl || "classic", gkcam: o.gkcam || "behind", skip: !!o.skip, q: o.q || "auto", shake: o.shake !== false}; } catch (e) { return {ctrl: "classic", gkcam: "behind", skip: false, q: "auto", shake: true}; } }
  function setPref(k, v) { var o = prefs(); o[k] = v; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function enabled() { try { return SP3.supported() && !window.__SP_OFF; } catch (e) { return false; } }

  /* ---------- sonido sintetizado ---------- */
  var AU = (function () {
    var ac = null, out = null, noise = null, crowdG = null, crowdF = null, beatT = 0;
    function vol() { try { return localStorage.getItem("camino.snd") === "0" ? 0 : 0.8; } catch (e) { return 0.8; } }
    function init() {
      if (ac) return !!ac; var A = window.AudioContext || window.webkitAudioContext; if (!A) return false;
      try { ac = new A(); out = ac.createGain(); out.gain.value = vol() * 0.6; out.connect(ac.destination); var n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noise = b; } catch (e) { ac = null; return false; }
      return true;
    }
    function ok() { if (!vol() || !init()) return false; if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} } return true; }
    function env(g, t0, a, p, d) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(p, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
    function tone(type, f0, f1, dur, p, dl) { var t0 = ac.currentTime + (dl || 0), o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); o.connect(g); g.connect(out); env(g, t0, 0.005, p, dur); o.start(t0); o.stop(t0 + dur + 0.05); }
    function hiss(dur, fc, q, p, dl, type) { var t0 = ac.currentTime + (dl || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; f.type = type || "bandpass"; f.frequency.value = fc; f.Q.value = q; s.connect(f); f.connect(g); g.connect(out); env(g, t0, 0.01, p, dur); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05); }
    return {
      fx: function (n, k) {
        if (!ok()) return; k = k || 1;
        if (n === "kick") { tone("sine", 140 * k, 50, 0.12, 0.6); hiss(0.05, 1400, 1, 0.3); }
        else if (n === "kickSoft") { tone("sine", 220, 90, 0.09, 0.35); hiss(0.04, 1800, 1, 0.15); }
        else if (n === "post") { [523, 1046, 1568, 2350].forEach(function (f, i) { tone("triangle", f, f * 0.995, 0.9 - i * 0.15, 0.22 / (i + 1)); }); }
        else if (n === "net") { hiss(0.45, 2400, 0.7, 0.3); hiss(0.3, 900, 1, 0.2, 0.05); }
        else if (n === "whistle") { tone("square", 2600, 2700, 0.35, 0.1); tone("sine", 2650, 2600, 0.4, 0.12); }
        else if (n === "dive") { hiss(0.12, 500, 0.8, 0.35); tone("sine", 90, 50, 0.15, 0.3, 0.02); }
        else if (n === "catch") { tone("sine", 180, 120, 0.08, 0.5); hiss(0.06, 1200, 1.5, 0.25); }
        else if (n === "parry") { tone("sine", 260, 140, 0.08, 0.45); hiss(0.05, 2200, 1, 0.3); }
        else if (n === "wall") { tone("sine", 120, 70, 0.1, 0.5); hiss(0.08, 700, 1, 0.3); }
        else if (n === "bounce") { tone("sine", 200, 110, 0.06, 0.25 * k); }
        else if (n === "beat") { tone("sine", 60, 45, 0.12, 0.4); tone("sine", 55, 40, 0.12, 0.3, 0.18); }
        else if (n === "cheer") { hiss(1.6, 1100, 0.4, 0.4); hiss(1.3, 2400, 0.6, 0.2, 0.1); }
        else if (n === "ooh") { hiss(1.0, 700, 0.8, 0.3); tone("sine", 220, 180, 0.8, 0.05); }
        else if (n === "spray") { hiss(0.5, 4500, 0.8, 0.1); }
      },
      crowd: function (level) { if (!ok()) return; if (!crowdG) { var s = ac.createBufferSource(); s.buffer = noise; s.loop = true; crowdF = ac.createBiquadFilter(); crowdF.type = "bandpass"; crowdF.frequency.value = 700; crowdF.Q.value = 0.5; crowdG = ac.createGain(); crowdG.gain.value = 0; s.connect(crowdF); crowdF.connect(crowdG); crowdG.connect(out); s.start(); } crowdG.gain.setTargetAtTime(level * 0.22, ac.currentTime, 0.3); crowdF.frequency.setTargetAtTime(600 + level * 500, ac.currentTime, 0.3); },
      heart: function (dt, on, rate) { if (!on) return; beatT -= dt; if (beatT <= 0) { beatT = 60 / rate; this.fx("beat"); } },
      stop: function () { if (crowdG && ac) crowdG.gain.setTargetAtTime(0, ac.currentTime, 0.2); }
    };
  })();

  /* ---------- estadísticas y logros (S.p.sp, versión 1) ---------- */
  function stats() {
    if (typeof S === "undefined" || !S || !S.p) return null;
    var s = S.p.sp; if (!s || s.v !== 1) s = S.p.sp = {v: 1, pen: {n: 0, g: 0, s: 0, post: 0, out: 0}, fk: {n: 0, g: 0, s: 0, post: 0, out: 0, wall: 0}, gkpen: {n: 0, s: 0}, gkfk: {n: 0, s: 0}, zones: {}, streak: 0, best: 0, ach: {}, celeb: "arms", mem: {}, ch: {}, tr: {y: 0, n: 0}, miss: 0};
    return s;
  }
  function record(kind, res, o) {
    var s = stats(); if (!s) return [];
    var b = s[kind], got = []; if (!b) return got;
    b.n++;
    if (kind === "pen" || kind === "fk") {
      if (res.scored) { b.g++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
      if (/post/.test(res.how)) b.post++; if (res.saved) b.s++; if (/wide|over/.test(res.how)) b.out++; if (res.how === "wall") b.wall = (b.wall || 0) + 1;
      if (o && o.zone != null) s.zones[kind + o.zone] = (s.zones[kind + o.zone] || 0) + 1;
    } else if (!res.scored) b.s++;
    if (o && o.team != null) { var m = s.mem[o.team] || (s.mem[o.team] = {L: 0, C: 0, R: 0}); if (o.side) m[o.side] = (m[o.side] || 0) + 1; }
    function ach(k) { if (s.ach[k]) return; s.ach[k] = Date.now(); var A = D.ach.filter(function (a) { return a.k === k; })[0]; if (A) { got.push(A); if (S.p) S.p.money += A.money; } }
    if (kind === "pen" && res.scored && o && o.panenka) ach("panenka");
    if (kind === "fk" && res.scored && o && o.top) ach("fktop");
    if (kind === "fk" && s.fk.g >= 3) ach("hattrickfk");
    if (res.how === "postin") ach("postin");
    if (kind === "gkpen" && !res.scored && o && o.final) ach("savefinal");
    if (kind === "gkfk" && !res.scored && o && o.wallClean) ach("wallwin");
    if (s.streak >= 5) ach("shoot5");
    return got;
  }
  function celebOf() { var s = stats(); var k = s ? s.celeb : "arms"; var c = D.celebs.filter(function (x) { return x.k === k; })[0]; return c && (!c.un || (s && s.ach[c.un])) ? k : "arms"; }

  /* ---------- colores y aspecto de los jugadores ---------- */
  function myKit() {
    var o = {shirt: "#c8312f", shorts: "#f2f2f2", num: 9, skin: "#b8855e", hair: "#2a1a10", boots: "#141414", hairStyle: 0, fem: false};
    try {
      var cc = clubColors(W.clubs[S.p.club].n); o.shirt = cc[0]; o.shorts = cc[1] || "#f2f2f2"; o.socks = cc[0]; o.trim = cc[1];
      if (S.p.num) o.num = S.p.num; o.fem = S.g === "f";
      var L = S.p.life || {}; if (L.look) { if (L.look.skin) o.skin = L.look.skin; if (L.look.hair) o.hair = L.look.hair; }
      var eq = L.eq || {}; if (eq.boots) o.boots = eq.boots.c || o.boots;
    } catch (e) {}
    return o;
  }
  function rivalKit(gk) {
    var o = {shirt: "#2a5bd7", shorts: "#111827", num: gk ? 1 : 10, skin: ["#f2c09a", "#c88a62", "#8a5a34", "#5a3a20"][Math.floor(Math.random() * 4)], hair: "#1a1410", hairStyle: Math.floor(Math.random() * 5), gk: !!gk};
    try { var f = S.cur && S.cur.pm && S.cur.pm[0]; } catch (e) {}
    if (gk) { o.shirt = ["#2ad15a", "#f6c83a", "#7a3ad8", "#ff7a1a"][Math.floor(Math.random() * 4)]; o.gloves = "#f8f8f8"; }
    return o;
  }
  function colsNow() { try { var cc = clubColors(W.clubs[S.p.club].n); return [cc[0], cc[1]]; } catch (e) { return ["#c8312f", "#2a5bd7"]; } }
  function petNow() { try { return typeof petOf === "function" ? petOf() : null; } catch (e) { return null; } }
  function ctxFor(press) { return press >= 0.95 ? "final" : press >= 0.6 ? "big" : press >= 0.3 ? "small" : "barrio"; }
  function todNow() { var h = new Date().getHours(); return h >= 20 || h < 7 ? "night" : h >= 18 ? "dusk" : "day"; }

  /* ---------- ejecutar un tiro: simula (determinista) y lo reproduce en la escena ---------- */
  /* spec: {b0, env, onEvent(e), done(res, sim)} — el balón sigue la trayectoria simulada; los sucesos disparan efectos */
  function runShot(S3, spec) {
    /* paso fijo en vivo: el portero que controlas puede cambiar su plan durante el vuelo (misma entrada = mismo resultado) */
    var env = spec.env || {}, b = SpPhys.ball(spec.b0), ev = [], fired = 0, acc = 0, done = false, endT = null, DT = SpPhys.DT;
    if (env.wall) env.wall.forEach(function (w) { w.hit = false; });
    S3.ball.show = true; S3.liveBall = b;
    var prev = S3.onFrame;
    S3.onFrame = function (dt) {
      if (prev) prev(dt);
      if (done) return;
      acc += dt;
      var px = b.x, pz = b.z;
      while (acc >= DT) {
        acc -= DT; SpPhys.step(b, env, ev);
        if (endT == null && (b.held || b.dead || (b.crossed && !b.goal) || (b.inNet && b.t - (b.netT || (b.netT = b.t)) > 0.8) || b.t > (spec.tmax || 3))) endT = b.t + (b.held || b.inNet ? 0.15 : 0.5);
        if (endT != null && b.t >= endT) break;
      }
      S3.ball.x = b.x; S3.ball.y = b.y; S3.ball.z = b.z;
      var vx = b.vx, vz = b.vz, wx = b.wx, wy = b.wy, wz = b.wz;
      if (b.y < R + 0.02) { wx += vz / R; wz -= vx / R; }
      if (!b.held) S3.ballSpin(wx * 0.35 + vz * 0.6, wy, wz * 0.35 - vx * 0.6, dt);
      if (b.held && spec.holdAt) { var h = spec.holdAt(); S3.ball.x = h[0]; S3.ball.y = h[1]; S3.ball.z = h[2]; }
      while (fired < ev.length) { var e = ev[fired++]; fxFor(S3, e); if (spec.onEvent) spec.onEvent(e); }
      if (endT != null && b.t >= endT) { done = true; S3.liveBall = null; S3.onFrame = prev; var res = SpPhys.classify(ev, b); if (spec.done) spec.done(res, {ev: ev, end: b, res: res}); }
    };
  }
  function fxFor(S3, e) {
    if (e.k === "post" || e.k === "bar") { AU.fx("post"); S3.fx("spark", 0, e.y, e.k === "bar" ? e.z : e.z, 10); S3.kick(0.6); S3.hitstop(70); hap("big"); S3.ball.sq = 1; }
    else if (e.k === "net") { AU.fx("net"); S3.net.hit(e.x, e.y, e.z, e.v); S3.ball.sq = 0.6; }
    else if (e.k === "bounce") { AU.fx("bounce", Math.min(1, e.v / 6)); S3.fx("grass", e.x, 0, e.z, 6); if (S3.wx === "rain") S3.fx("drop", e.x, 0.05, e.z, 8); S3.ball.sq = Math.min(1, e.v / 8); }
    else if (e.k === "catch") { AU.fx("catch"); S3.hitstop(90); S3.kick(0.3); hap("ok"); }
    else if (e.k === "parry") { AU.fx("parry"); S3.hitstop(80); S3.kick(0.5); hap("big"); S3.ball.sq = 1; }
    else if (e.k === "wall") { AU.fx("wall"); S3.kick(0.35); hap("tap"); S3.ball.sq = 1; }
  }

  /* ---------- presentación común: carrera, golpeo, portero, resolución, repetición ---------- */
  /* p: {S3, shooter, keeper, b0, env, kickType, keeperPlan (para el rig), onResult(res), mine (true si el lanzador eres tú), important} */
  function shotSequence(p) {
    var S3 = p.S3, sh = p.shooter, gk = p.keeper, ran = false;
    var bx = S3.ball.x, bz = S3.ball.z, ang = p.runAng == null ? 0.35 : p.runAng, dist = p.runDist || 2.4;
    /* carrera: desde atrás y en ángulo hacia el balón */
    if (!p.fromCurrent) S3.place(sh, bx + Math.cos(ang) * dist, bz - Math.sin(ang) * dist * (sh.foot === "A" ? -1 : 1), true);
    S3.faceTo(sh, bx, bz);
    var runT = p.runT || 0.85, x0 = sh.x, z0 = sh.z, tgt = S3.L(bx + 0.18, 0, bz + (sh.foot === "A" ? -0.25 : 0.25)), tt = 0;
    S3.record(true);
    sh.play("approach", {d: runT, steps: 4});
    if (p.onRun) p.onRun();
    var prev = S3.onFrame;
    S3.onFrame = function (dt) {
      if (prev) prev(dt);
      if (ran) return;
      tt += dt; var k = cl(tt / runT, 0, 1), e = k;
      sh.x = lerp(x0, tgt[0], e); sh.z = lerp(z0, tgt[2], e);
      if (k >= 1) {
        ran = true; S3.onFrame = prev;
        sh.play("kick", {type: p.kickType || "laces", d: 0.7, ev: {"0.55": function () {
          AU.fx(p.kickType === "chip" ? "kickSoft" : "kick", p.kickPow || 1); hap("tap"); S3.ball.sq = 1; S3.fx("grass", bx, 0, bz, 8); S3.hitstop(p.important ? 60 : 30);
          if (p.important) S3.slow(0.35, 0.35);
          if (gk && p.gkGo) p.gkGo();
          if (p.afterKick) setTimeout(p.afterKick, 120);
          runShot(S3, {b0: p.b0, env: p.env, onEvent: p.onEvent, holdAt: gk ? function () { var q = gk.at("handA", [0, -0.12, 0.08]), q2 = gk.at("handB", [0, -0.12, 0.08]); return [SP3.GLX - (q[0] + q2[0]) / 2, (q[1] + q2[1]) / 2, -(q[2] + q2[2]) / 2]; } : null, done: function (res, sim) { finishSeq(p, res, sim); }});
        }}});
      }
    };
  }
  function finishSeq(p, res, sim) {
    var S3 = p.S3;
    S3.record(false);
    var goal = res.scored;
    S3.crowdT = goal === !!p.homeShoots ? 1 : 0.5;
    if (goal === !!p.homeShoots) AU.fx("cheer"); else AU.fx("ooh");
    AU.crowd(goal ? 1 : 0.4);
    if (goal && S3.ctx === "final" && p.homeShoots) S3.fx("confetti", 4, 6, 0, 80);
    if (S3.petReact) S3.petReact(goal === !!p.homeShoots);
    if (p.onResult) p.onResult(res, sim);
  }
  /* cámara lateral o desde detrás de la portería para la repetición */
  function replayCams(res) {
    var z = res && res.z || 0;
    var cams = [{eye: [5.5, 1.3, -10], tgt: [1, 1, 0], fov: 34}, {eye: [-6, 2.2, 0.5], tgt: [6, 0.9, 0], fov: 40}, {eye: [2, 0.6, 5.5], tgt: [0, 1.1, -1], fov: 46}];
    /* jugadas ajustadas en la línea: plano de «tecnología de gol», alineado con la línea */
    if (res && /postin|touchin|post/.test(res.how)) cams.unshift({eye: [-0.12, 0.9, 9.5], tgt: [-0.12, 0.6, 0], fov: 24});
    return cams;
  }
  /* celebración o lamento tras el resultado */
  function react(p, res) {
    var sh = p.shooter, gk = p.keeper, S3 = p.S3, goal = res.scored;
    if (p.mineShoots) { if (goal) { var c = celebOf(); sh.play(c === "silence" ? "silence" : c === "slide" ? "slide" : c === "plane" ? "plane" : c === "jump" ? "jump" : c === "flip" ? "flip" : "arms"); } else sh.play(/post|bar/.test(res.how) ? "punch" : "headhands"); }
    else { if (goal) sh.play(["arms", "jump", "plane"][Math.floor(Math.random() * 3)]); else sh.play("headhands"); }
    if (gk && !goal && res.saved) { setTimeout(function () { if (gk) gk.play("arms", {d: 1.8}); }, 500); }
    else if (gk && goal) setTimeout(function () { gk.play("crouchsad"); }, 700);
  }

  /* =============== ADAPTADOR DE LOS CLÁSICOS =============== */
  /* stage3d: monta la escena dentro del escenario del minijuego clásico y deja visibles solo sus casillas */
  function stage3d(ui, svg, mode, o) {
    if (!enabled()) return null;
    var host = ui.stage, S3;
    try { S3 = SP3.create(host, {ctx: ctxFor(ui.press || o.pressure * 0.6 || 0), cols: colsNow(), tod: todNow(), wx: o.wx, pet: petNow()}); } catch (e) { return null; }
    host.classList.add("sp3-host");
    var isGk = mode === "gkpen", me = myKit(), rv = rivalKit(!isGk);
    var shooter = S3.man(isGk ? rv : Object.assign({}, me, {foot: o.foot}));
    var keeper = S3.man(isGk ? Object.assign({}, me, {gk: true, gloves: "#f07a24", num: 1, shirt: "#2ad15a", shorts: "#111"}) : rivalKit(true));
    var ref = S3.man({shirt: "#111", shorts: "#111", socks: "#111", official: true, skin: "#c88a62", hairStyle: 1});
    S3.place(keeper, 0.25, 0, false); keeper.play("gkready", {amp: 0.06});
    S3.place(shooter, isGk ? 18.6 : 13.2, isGk ? 1.2 : -2.9, true); shooter.play("idle");
    S3.place(ref, 9.5, 9, true); S3.faceTo(ref, 11, 0);
    S3.ball.x = 11; S3.ball.y = R; S3.ball.z = 0;
    S3.crowdT = S3.crowdBase * 0.5; AU.crowd(0.25 + (ui.press || 0) * 0.3);
    var press = ui.press || 0;
    var v3 = {S3: S3, shooter: shooter, keeper: keeper, ref: ref, press: press};
    /* cámara: detrás del balón (lanzador) o detrás del portero */
    /* apuntar siempre de frente a la portería (como el clásico); en la parada, la cámara pasa detrás del portero o a sus ojos */
    var cam = {eye: [17.2 - press * 0.8, 1.6, 0], tgt: [0, 1.05, 0], fov: 32 - press * 3};
    v3.gkCam = function () { if (prefs().gkcam === "eyes") { keeper.show = false; S3.camTo([0.1, 1.72, 0], [11, 0.7, 0], 54, 0); } else S3.camTo([-10.5, 4.4, 0.3], [11, 0.6, 0], 32, 0); };
    S3.camTo(cam.eye, cam.tgt, cam.fov, 0);
    /* las casillas del SVG se quedan; lo demás del dibujo 2D se oculta */
    Array.prototype.forEach.call(svg.children, function (n) { var c = n.getAttribute("class") || ""; if (!/mg-cells|mg-lab/.test(c) && n.tagName !== "defs") n.style.display = "none"; });
    svg.style.position = "relative"; svg.style.zIndex = 1; svg.style.background = "transparent";
    var layoutCells = null;
    /* el portero rival «baila» en la línea según su perfil (solo aspecto en el clásico) */
    if (!isGk && Math.random() < 0.35) keeper.play("gkdance");
    /* coloca casillas y etiquetas sobre la portería proyectada */
    v3.layout = function (cells, labs, rows, cols, labFn) {
      layoutCells = function () {
        var r = svg.getBoundingClientRect(); if (!r.width) return;
        var a = S3.project(0, GH, HW), b = S3.project(0, 0, -HW);
        /* desde detrás del portero la izquierda de la pantalla es la derecha del lanzador */
        var u = 360 / r.width, vb = svg.viewBox.baseVal, vy = vb ? vb.height / r.height * (r.width / 360) * u / u : 1;
        var sx = function (px) { return (px - r.left) * 360 / r.width; }, sy = function (py) { return (py - r.top) * (vb ? vb.height : 300) / r.height; };
        var x0 = sx(Math.min(a.x, b.x)), x1 = sx(Math.max(a.x, b.x)), y0 = sy(Math.min(a.y, b.y)), y1 = sy(Math.max(a.y, b.y)), cw = (x1 - x0) / cols, ch = (y1 - y0) / rows;
        cells.forEach(function (c, i) { c.el.setAttribute("x", (x0 + c.c * cw + 0.5).toFixed(1)); c.el.setAttribute("y", (y0 + c.r * ch + 0.5).toFixed(1)); c.el.setAttribute("width", (cw - 1).toFixed(1)); c.el.setAttribute("height", (ch - 1).toFixed(1));
          if (labs[i]) { labs[i].setAttribute("x", (x0 + c.c * cw + cw / 2).toFixed(1)); labs[i].setAttribute("y", (y0 + c.r * ch + (labFn ? labFn(c, ch) : ch / 2 + 4.5)).toFixed(1)); } });
      };
      var tries = 0; (function again() { layoutCells(); if (++tries < 6) setTimeout(again, 120); })();
      window.addEventListener("resize", layoutCells);
    };
    v3.dispose = function () { window.removeEventListener("resize", layoutCells); AU.stop(); S3.dispose(); };
    /* latido y público tenso según la presión de la tanda (sin texto) */
    var hb = 0;
    S3.onFrame = function (dt) { if (press >= 0.5 && ui.state !== "shot") AU.heart(dt, true, 70 + press * 50); };
    S3.start();
    /* se limpia al cerrar el minijuego */
    var obs = new MutationObserver(function () { if (!ui.ov.parentNode) { obs.disconnect(); v3.dispose(); } });
    obs.observe(document.body, {childList: true});
    return v3;
  }
  /* rejilla del clásico (r, c) → punto de la portería (marco SpPhys) */
  function cellPoint(r, c, rows, cols, jx, jy) {
    var z = HW * (1 - 2 * (c + 0.5 + (jx || 0)) / cols), y = GH * (1 - (r + 0.5 + (jy || 0)) / rows);
    return {z: z, y: cl(y, 0.15, GH - 0.12)};
  }
  /* SVG del clásico → marco de juego (para portar sus fórmulas de destino) */
  var GX0 = 30, GX1 = 330, GY0 = 46, GY1 = 186;
  function svgToGoal(x, y) { return {z: HW * (1 - 2 * (x - GX0) / (GX1 - GX0)), y: GH * (GY1 - y) / (GY1 - GY0)}; }

  /* ---------- clásico de lanzador: el resultado (how) ya está decidido por su mecánica ---------- */
  /* cell: {r, c, miss}, pf: factor de potencia, v: posición de la barra, then: callback del clásico */
  function penShoot(v3, how, cell, sideR, pf, v, then) {
    v3.S3.host.classList.add("sp3-shot");
    var S3 = v3.S3, rv = SpPhys.rng((cell.r * 7 + cell.c * 13 + Math.floor(v * 1000)) >>> 0 || 1);
    /* mismas fórmulas de destino que el 2D, con azar visual propio (el 2D usa Math.random aquí) */
    var cw = (GX1 - GX0) / 5, ch = (GY1 - GY0) / 3, cxs = GX0 + cell.c * cw + cw / 2 + (rv() - 0.5) * cw * 0.45, cys = GY0 + cell.r * ch + ch / 2 + (rv() - 0.5) * ch * 0.4, txs = cxs, tys = cys;
    if (how === "fuera") {
      if (pf.over >= cell.miss || cell.c === 2 || (cell.r === 0 && rv() < 0.5)) { tys = GY0 - 20 - rv() * 12; txs = cxs + (cxs - 180) * 0.15; }
      else txs = cell.c < 2 ? GX0 - 18 : GX1 + 18;
    }
    var T = svgToGoal(txs, tys), sp = 15 + v * 17 + (pf.over ? 3 : 0), side = sideR < 0.5 ? -1 : 1;
    if (how === "parada") side = cell.c < 2 ? -1 : cell.c > 2 ? 1 : 0;
    var b0 = SpPhys.solve({x: 11, z: 0}, cl(T.y, R, 4), T.z, sp, [0, (rv() - 0.5) * 6, 0], {});
    /* portero: si para, sus manos llegan al punto; si no, se tira al otro lado o se queda corto */
    var arrive = SpPhys.cross(b0, {}) || {t: 0.5, y: T.y, z: T.z};
    var plan, kz = side === 0 ? 0 : side * -1.0;
    /* side: -1 = izquierda de la pantalla = z positivo */
    var dz = side === 0 ? 0 : -side;
    if (how === "parada") plan = {x: 0.25, z: 0, t0: Math.max(0.02, arrive.t - 0.42), dur: 0.4, tz: arrive.z, ty: arrive.y, reach: 4, hands: 0.55, noCatch: v > 0.5};
    else if (how === "gol") { var gz = Math.abs(T.z) < 1.2 ? (dz || (rv() < 0.5 ? 1 : -1)) * 2.4 : (Math.sign(T.z) === dz ? dz * Math.max(0.6, Math.abs(T.z) - 1.9) : dz * 2.2); plan = {x: 0.25, z: 0, t0: 0.04, dur: 0.42, tz: gz, ty: Math.abs(T.y - 1.2) < 0.5 ? 0.4 : 1.1, reach: 2.0, hands: 0.5}; }
    else plan = {x: 0.25, z: 0, t0: 0.08, dur: 0.42, tz: dz * 2.0, ty: 1.0, reach: 2.2, hands: 0.5};
    var env = {keeper: plan, wet: v3.S3.wx === "rain"};
    /* garantía visual: el resultado del clásico manda */
    var res = SpPhys.sim(b0, env, {full: true}).res, guard = 0;
    while (guard++ < 8 && ((how === "gol" && !res.scored) || (how === "parada" && !res.saved) || (how === "fuera" && (res.scored || res.saved)))) {
      if (how === "gol") { plan.tz = -plan.tz * 0.9; plan.reach *= 0.8; plan.t0 += 0.06; }
      if (how === "parada") { plan.reach = 5; plan.dur *= 0.9; plan.t0 = Math.max(0, plan.t0 - 0.03); plan.noCatch = guard > 3; }
      if (how === "fuera") { plan.tz = -plan.tz; }
      res = SpPhys.sim(b0, env, {full: true}).res;
    }
    var gkDir = plan.tz > 0.4 ? -1 : plan.tz < -0.4 ? 1 : 0, gkH = plan.ty;
    shotSequence({S3: S3, shooter: v3.shooter, keeper: v3.keeper, b0: b0, env: env, kickType: v < 0.35 ? "inside" : "laces", kickPow: 0.6 + v * 0.6, important: v3.press >= 0.5, mineShoots: true, homeShoots: true, fromCurrent: true, runT: 1.0,
      gkGo: function () { setTimeout(function () { diveRig(v3.keeper, gkDir, gkH, plan); }, Math.max(0, plan.t0 * 1000)); },
      onResult: function (r) { afterShot(v3, r, how === "gol" ? "goal" : how === "parada" ? "save" : "out", then); }});
    v3.S3.follow = followShot(v3.S3, false);
  }
  /* rig del portero que coincide con su plan físico */
  function diveRig(gk, dir, h, plan) {
    if (!gk) return;
    AU.fx("dive");
    if (dir === 0) { gk.play(h > 1.7 ? "gkjump" : "gkstay", {h: h, d: plan.dur}); return; }
    gk.play("dive", {dir: dir, h: h, reach: Math.min(2.4, Math.abs(plan.tz) * 0.9 + 0.5), d: plan.dur, done: function () {
      gk.play("land", {dir: dir, h: h, reach: Math.min(2.4, Math.abs(plan.tz) * 0.9 + 0.5), done: function () { gk.play("getup", {dir: dir, reach: Math.min(2.4, Math.abs(plan.tz) * 0.9 + 0.5)}); }});
    }});
  }
  /* cámara que sigue: tras el golpeo se cierra un poco hacia la portería */
  function followShot(S3, gkView) {
    var t0 = 0;
    return function (c, dt) { t0 += dt; if (t0 > 0.15 && !gkView && c.k >= 1 && !c.done) { c.done = 1; S3.camTo([8.5, 1.5, -2.5], [0, 1.1, 0], 36, 0.9); } };
  }
  /* resolución: cámara lenta en lo ajustado, repetición corta (saltable) y vuelta al clásico */
  function afterShot(v3, r, kind, then) {
    var S3 = v3.S3, pr = prefs();
    v3.shooter && react({shooter: v3.shooter, keeper: v3.keeper, S3: S3, mineShoots: !v3.gkMode}, r);
    var close = /post|touchin|save|catch/.test(r.how);
    S3.follow = null;
    var go = function () { S3.follow = null; S3.camTo([16, 3.2, 6], [5, 1, 0], 40, 0.8); setTimeout(then, red() ? 100 : 500); };
    if (pr.skip || red() || !close) { setTimeout(go, close ? 900 : 1100); return; }
    setTimeout(function () {
      var tap = function () { S3.stopReplay(); };
      v3.S3.host.addEventListener("pointerdown", tap, {once: true});
      S3.replay(replayCams(r), 0.45, function () { v3.S3.host.removeEventListener("pointerdown", tap); go(); });
    }, 1100);
  }

  /* ---------- clásico de portero: mismas fórmulas y consumo de azar que el 2D ---------- */
  function gkPenDive(v3, how, d, tz, v, tf, rand, then) {
    v3.S3.host.classList.add("sp3-shot");
    var S3 = v3.S3; v3.gkMode = true;
    var cw = (GX1 - GX0) / 3, ch = (GY1 - GY0) / 2;
    function cell(i) { var r = i < 3 ? 0 : 1, c = i % 3; return {r: r, c: c, x: GX0 + c * cw, y: GY0 + r * ch, w: cw, h2: ch}; }
    var tc = cell(tz), dc = cell(d), col = tc.c;
    /* idéntico al 2D (incluido cuántas veces se llama a rand) */
    var tx = tc.x + tc.w / 2 + (rand() - 0.5) * tc.w * 0.5, ty = tc.y + tc.h2 / 2 + (rand() - 0.5) * tc.h2 * 0.45;
    if (how === "parada" && tz !== d) { tx = lerp(tx, dc.x + dc.w / 2, 0.45); ty = lerp(ty, dc.y + dc.h2 / 2, 0.45); }
    if (how === "gol" && tz === d) { tx = tc.x + tc.w * (col === 0 ? 0.16 : col === 2 ? 0.84 : (rand() < 0.5 ? 0.2 : 0.8)); ty = tc.y + tc.h2 * (tc.r === 0 ? 0.24 : 0.8); }
    if (how === "fuera") { if (tc.r === 0 || col === 1) { ty = GY0 - 18 - rand() * 10; tx += (tx - 180) * 0.15; } else tx = col === 0 ? GX0 - 20 : GX1 + 20; }
    var bar = how === "palo" && (col === 1 || (tc.r === 0 && rand() < 0.5));
    if (how === "palo") { if (bar) ty = GY0; else tx = col === 0 ? GX0 : GX1; }
    var T = svgToGoal(tx, ty);
    if (how === "palo") { if (bar) T.y = GH + 0.1; else T.z = (T.z > 0 ? 1 : -1) * (HW + 0.06); }
    /* zona elegida por ti → punto de las manos; momento de la barra → cuándo te tiras */
    var D0 = svgToGoal(dc.x + dc.w / 2, dc.y + dc.h2 / 2), aim = how === "parada" ? T : D0;
    var b0 = SpPhys.solve({x: 11, z: 0}, cl(T.y, R, 4), T.z, 21 + v * 2, [0, 0, 0], {}), arrive = SpPhys.cross(b0, {}) || {t: 0.5};
    var reachV = how === "parada" ? 1 : (1 - 0.35 * tf.late) * (how === "gol" && tz === d ? 0.86 : 1);
    var start = how === "parada" ? Math.max(0.02, arrive.t - 0.4) : (0.11 + 0.44 * v) - 0.3;
    var plan = {x: 0.25, z: 0, t0: start, dur: 0.4, tz: aim.z * reachV, ty: lerp(1.05, aim.y, reachV), reach: how === "parada" ? 5 : 2.6 * reachV, hands: 0.7, noCatch: v > 0.55};
    var env = {keeper: plan};
    var res = SpPhys.sim(b0, env, {full: true}).res, guard = 0;
    while (guard++ < 8 && ((how === "gol" && !res.scored) || (how === "parada" && !res.saved) || ((how === "fuera" || how === "palo") && (res.scored || res.saved)))) {
      if (how === "gol") { plan.reach *= 0.75; plan.t0 += 0.05; }
      if (how === "parada") { plan.reach = 6; plan.t0 = Math.max(0, plan.t0 - 0.04); plan.noCatch = guard > 3; }
      if (how === "fuera" || how === "palo") { plan.tz = -plan.tz; plan.reach *= 0.8; }
      res = SpPhys.sim(b0, env, {full: true}).res;
    }
    var dir = plan.tz > 0.4 ? -1 : plan.tz < -0.4 ? 1 : 0;
    /* tu portero se lanza en su momento (pronto = antes del golpeo) */
    var kickAt = 0.85 + 0.7 * 0.55, early = plan.t0 < 0;
    shotSequence({S3: S3, shooter: v3.shooter, keeper: v3.keeper, b0: b0, env: env, kickType: Math.abs(T.z) < 1 ? "laces" : "inside", important: v3.press >= 0.5, mineShoots: false, homeShoots: false,
      onRun: function () { if (v3.gkCam) v3.gkCam(); if (early) setTimeout(function () { diveRig(v3.keeper, dir, plan.ty, plan); }, Math.max(0, (kickAt + plan.t0) * 1000)); },
      gkGo: function () { if (!early) setTimeout(function () { diveRig(v3.keeper, dir, plan.ty, plan); }, plan.t0 * 1000); },
      onResult: function (r) { afterShot(v3, r, how, then); }});
  }

  var api = {enabled: enabled, prefs: prefs, setPref: setPref, stage3d: stage3d, penShoot: penShoot, gkPenDive: gkPenDive, stats: stats, record: record, AU: AU,
    _int: {runShot: runShot, shotSequence: shotSequence, react: react, afterShot: afterShot, diveRig: diveRig, myKit: myKit, rivalKit: rivalKit, colsNow: colsNow, ctxFor: ctxFor, todNow: todNow, petNow: petNow, celebOf: celebOf, cellPoint: cellPoint, followShot: followShot, replayCams: replayCams, esc: esc, t: t, cl: cl, lerp: lerp, hap: hap, red: red}};
  return api;
})();
