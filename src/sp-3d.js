/* sp-3d.js — escena 3D de balón parado (5.6) con el motor del partido: estadio según el contexto,
   público animado, focos, clima, portería con red de muelles, balón vóxel con rotación visible,
   efectos vóxel, director de cámara (cámara lenta, temblor) y grabación de repeticiones.
   Coordenadas de la API: las de SpPhys (x desde la línea de gol, z > 0 = izquierda del lanzador). */
var SP3 = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore || typeof SpRig === "undefined" || !SpRig) return null;
  var C = Pitch3D.core, MX = VoxCore.MX, ORG = C.ORIGIN, GLX = C.LEN / 2, PI = Math.PI;
  var HW = C.POST, BAR = C.BAR;
  function L(x, y, z) { return [GLX - x, y, -z]; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function red() { try { return Anim.reduced(); } catch (e) { return false; } }
  function shakeOn() { try { var a = JSON.parse(localStorage.getItem("camino.sp") || "{}"); return a.shake !== false && !red(); } catch (e) { return !red(); } }
  var worldCache = {};

  /* ---------- balón vóxel: pentágonos negros para ver la rotación y el efecto ---------- */
  var BALL = null;
  function ballMesh() {
    if (BALL) return BALL;
    var g = new VoxCore.VGrid(), D = [[0, 1, 0], [0, -1, 0], [0.89, 0.45, 0], [-0.89, -0.45, 0], [0.28, 0.45, 0.85], [-0.28, -0.45, -0.85], [0.28, 0.45, -0.85], [-0.28, -0.45, 0.85], [-0.72, 0.45, 0.53], [0.72, -0.45, -0.53], [-0.72, 0.45, -0.53], [0.72, -0.45, 0.53]];
    g.ell([0, 0, 0], [5.4, 5.4, 5.4], function (u) { for (var i = 0; i < D.length; i++) if (u[0] * D[i][0] + u[1] * D[i][1] + u[2] * D[i][2] > 0.87) return "#141418"; return "#f6f6f2"; });
    BALL = VoxCore.meshArray(g, 0.0205, [-0.5, -0.5, -0.5]);
    return BALL;
  }

  /* ---------- escenario de barrio: césped gastado, valla, casas y árboles ---------- */
  function barrio(season) {
    var hs = typeof PetModels !== "undefined" && PetModels ? PetModels.hs : function () { return 0.5; };
    var g = new VoxCore.VGrid(), V = 0.25, i0 = Math.round((GLX - 46) / V), i1 = Math.round((GLX + 8) / V);
    for (var i = i0; i <= i1; i++) for (var k = -100; k <= 100; k++) {
      var px = GLX - i * V, z = k * V, h = hs(i, 0, k), worn = Math.abs(z) < 5 && px > -1 && px < 14 && h < 0.5 + (14 - px) / 40;
      var c = worn ? (h < 0.3 ? "#a08a62" : "#8e7a52") : (Math.floor((px + 60) / 3) % 2 ? "#4f8a36" : "#48802f");
      if (season === 2 && h > 0.4) c = "#e6eef2";
      g.set(i, -1, k, c, C.MAT.GRASS);
    }
    var out = [{verts: VoxCore.meshArray(g, V, [0, 0, 0]), id: "bgrass"}];
    var d = new VoxCore.VGrid(), V2 = 0.2, fx = Math.round((GLX + 5) / V2), sz = Math.round(24 / V2);
    /* valla metálica detrás de la portería y en los laterales */
    for (var z2 = -sz; z2 <= sz; z2++) for (var y = 0; y < 18; y++) if (z2 % 10 === 0 || y === 17 || y === 0 || (y + z2) % 4 === 0) d.set(fx, y, z2, z2 % 10 === 0 || y === 17 ? "#5d6670" : "#8a949e");
    var x0 = Math.round((GLX - 44) / V2);
    for (var x2 = x0; x2 <= fx; x2++) for (var y2 = 0; y2 < 10; y2++) if (x2 % 10 === 0 || y2 === 9 || (x2 + y2) % 5 === 0) { d.set(x2, y2, -sz, "#7d868f"); d.set(x2, y2, sz, "#7d868f"); }
    /* casas del barrio detrás de la valla */
    for (var hI = 0; hI < 9; hI++) {
      var hz = -sz + hI * 27, hh = 30 + (hI * 7) % 22, hc = ["#e8d2b0", "#f0c8a8", "#d8e0e8", "#e6dcc4", "#f2e2c8"][hI % 5];
      for (var a = 0; a < 22; a++) for (var b = 0; b < hh; b++) for (var c2 = 0; c2 < 12; c2++) { if (a > 0 && a < 21 && c2 > 0 && c2 < 11 && b > 0 && b < hh - 1) continue; var win = b % 9 > 3 && b % 9 < 8 && a % 6 > 1 && a % 6 < 5 && c2 === 0; d.set(fx + 14 + c2, b, hz + a, win ? "#9fc8e8" : b === hh - 1 ? "#a8392e" : hc); }
    }
    out.push({verts: VoxCore.meshArray(d, V2, [0, 0, 0]), id: "bdeco"});
    return out;
  }
  /* portería propia (postes, laterales) para el barrio; en los estadios ya viene en el campo */
  function goalFrame() {
    var m = new C.Mesh(8192); m.code = C.MAT.GLOSS; var PW = [0.96, 0.97, 0.95], x = GLX, back = x + 2;
    m.box(x + 0.06, 0, -HW - 0.06, 0.12, BAR, 0.12, PW); m.box(x + 0.06, 0, HW + 0.06, 0.12, BAR, 0.12, PW); m.box(x + 0.06, BAR, 0, 0.12, 0.12, HW * 2 + 0.24, PW);
    m.code = C.MAT.MATTE; var NC = [0.86, 0.88, 0.86];
    m.box(back, 0, -HW, 0.06, 1.9, 0.06, NC); m.box(back, 0, HW, 0.06, 1.9, 0.06, NC);
    for (var xx = 0.3; xx < 2; xx += 0.3) { var ny = BAR - (BAR - 1.9) * (xx / 2); m.box(x + xx, 0, -HW, 0.02, ny, 0.02, NC); m.box(x + xx, 0, HW, 0.02, ny, 0.02, NC); }
    for (var sy = 0.3; sy < 1.9; sy += 0.3) { m.box(x + 1, sy, -HW, 2, 0.02, 0.02, NC); m.box(x + 1, sy, HW, 2, 0.02, 0.02, NC); }
    /* líneas del área cerca de la portería */
    m.code = C.MAT.MATTE; var LW = [0.93, 0.95, 0.92];
    m.line(x, -20.16, x - 16.5, -20.16, LW, 0.12, 0.012); m.line(x - 16.5, -20.16, x - 16.5, 20.16, LW, 0.12, 0.012); m.line(x - 16.5, 20.16, x, 20.16, LW, 0.12, 0.012);
    m.line(x, -9.16, x - 5.5, -9.16, LW, 0.12, 0.012); m.line(x - 5.5, -9.16, x - 5.5, 9.16, LW, 0.12, 0.012); m.line(x - 5.5, 9.16, x, 9.16, LW, 0.12, 0.012);
    m.line(x, -HW - 2, x, HW + 2, LW, 0.12, 0.012); m.circle(x - 11, 0, 0.13, LW, 10, 0.013);
    return m.a.slice(0, m.n);
  }

  /* ---------- red de muelles (fondo y techo) ---------- */
  function Net() {
    var cols = 17, rows = 9, N = {cols: cols, rows: rows, p: [], pp: [], r: [], pin: [], e: [], len: []};
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var z = -HW + 2 * HW * i / (cols - 1), u = j / (rows - 1), x, y;
      /* fila 0: suelo del fondo → hasta 1.9 (fondo), luego el techo hasta el larguero */
      if (u <= 0.6) { x = 2.0; y = 1.9 * u / 0.6; } else { var w = (u - 0.6) / 0.4; x = 2.0 * (1 - w); y = 1.9 + (BAR - 1.9) * w; }
      N.r.push(x, y, z); N.p.push(x, y, z); N.pp.push(x, y, z);
      N.pin.push(j === 0 || j === rows - 1 || i === 0 || i === cols - 1 ? 1 : 0);
    }
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var a = j * cols + i; if (i < cols - 1) N.e.push(a, a + 1); if (j < rows - 1) N.e.push(a, a + cols); }
    for (var q = 0; q < N.e.length; q += 2) { var A = N.e[q] * 3, B = N.e[q + 1] * 3; N.len.push(Math.hypot(N.r[B] - N.r[A], N.r[B + 1] - N.r[A + 1], N.r[B + 2] - N.r[A + 2])); }
    N.p = new Float32Array(N.p); N.pp = new Float32Array(N.pp); N.r = new Float32Array(N.r);
    this.N = N; this.live = false; this.acc = 0;
  }
  /* golpe del balón en la red: x,y,z en marco de juego (x negativo = dentro de la portería) */
  Net.prototype.hit = function (x, y, z, v) {
    var N = this.N; this.live = true;
    for (var i = 0; i < N.cols * N.rows; i++) {
      if (N.pin[i]) continue; var k = i * 3, dx = (N.r[k] - (-x)) * 0.5, dy = N.r[k + 1] - y, dz = N.r[k + 2] + z, d = Math.sqrt(dx * dx + dy * dy + dz * dz), w = Math.max(0, 1 - d / 1.4); w *= w;
      if (!w) continue; var push = Math.min(0.6, v * 0.022) * w, back = N.r[k + 1] < 1.95;
      N.pp[k] = N.p[k] - push * (back ? 1 : 0.4); N.pp[k + 1] = N.p[k + 1] + (back ? 0 : push * 0.6);
    }
  };
  Net.prototype.step = function (dt) {
    if (!this.live) return; var N = this.N; this.acc = Math.min(this.acc + dt, 0.1);
    while (this.acc >= 1 / 60) {
      this.acc -= 1 / 60; var p = N.p, pp = N.pp, r = N.r, cnt = N.cols * N.rows, en = 0;
      for (var i = 0; i < cnt; i++) { if (N.pin[i]) continue; var k = i * 3; for (var c = 0; c < 3; c++) { var v = (p[k + c] - pp[k + c]) * 0.96; pp[k + c] = p[k + c]; p[k + c] += v + (r[k + c] - p[k + c]) * 0.02; en += Math.abs(v); } }
      for (var it = 0; it < 3; it++) for (var q = 0; q < N.e.length; q += 2) {
        var a = N.e[q] * 3, b = N.e[q + 1] * 3, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, Lq = N.len[q / 2] * 1.18;
        if (d <= Lq) continue; var f = (d - Lq) / d, wa = N.pin[N.e[q]] ? 0 : N.pin[N.e[q + 1]] ? 1 : 0.5, wb = N.pin[N.e[q + 1]] ? 0 : N.pin[N.e[q]] ? 1 : 0.5;
        p[a] += dx * f * wa; p[a + 1] += dy * f * wa; p[a + 2] += dz * f * wa; p[b] -= dx * f * wb; p[b + 1] -= dy * f * wb; p[b + 2] -= dz * f * wb;
      }
      if (en < 0.002) { p.set(r); pp.set(r); this.live = false; break; }
    }
  };
  /* punto de la red más cercano (para que el balón quede en la bolsa) */
  Net.prototype.pocket = function (y, z) { var N = this.N, best = 0, bd = 1e9; for (var i = 0; i < N.cols * N.rows; i++) { var k = i * 3, d = Math.abs(N.r[k + 1] - y) + Math.abs(N.r[k + 2] - z) + (N.r[k + 1] > 1.95 ? 1 : 0); if (d < bd) { bd = d; best = i; } } return [-N.p[best * 3], N.p[best * 3 + 1], -N.p[best * 3 + 2]]; };
  Net.prototype.draw = function (m) {
    var N = this.N, p = N.p, c = [0.86, 0.88, 0.86], w = 0.008; m.code = C.MAT.MATTE;
    for (var q = 0; q < N.e.length; q += 2) {
      var A = N.e[q] * 3, B = N.e[q + 1] * 3, a = [GLX + p[A] + ORG[0], p[A + 1] + ORG[1], p[A + 2] + ORG[2]], b = [GLX + p[B] + ORG[0], p[B + 1] + ORG[1], p[B + 2] + ORG[2]];
      var horiz = Math.abs(b[2] - a[2]) > Math.abs(b[1] - a[1]);
      var o1 = horiz ? [0, w, 0] : [0, 0, w], o2 = [w, 0, 0];
      m.quad([a[0] - o1[0], a[1] - o1[1], a[2] - o1[2]], [b[0] - o1[0], b[1] - o1[1], b[2] - o1[2]], [b[0] + o1[0], b[1] + o1[1], b[2] + o1[2]], [a[0] + o1[0], a[1] + o1[1], a[2] + o1[2]], c);
      m.quad([a[0] - o2[0], a[1], a[2]], [b[0] - o2[0], b[1], b[2]], [b[0] + o2[0], b[1], b[2]], [a[0] + o2[0], a[1], a[2]], c);
    }
    m.code = -1;
  };

  /* ---------- escena ---------- */
  function create(host, o) {
    o = o || {};
    var cv = document.createElement("canvas"); cv.className = "sp3-cv"; cv.setAttribute("aria-hidden", "true");
    host.insertBefore(cv, host.firstChild);
    var q = (function () { try { return (JSON.parse(localStorage.getItem("camino.sp") || "{}")).q || "auto"; } catch (e) { return "auto"; } })();
    var E = new VoxCore.Engine(cv, {quality: q, alpha: false, clear: [0.02, 0.035, 0.055, 1], shadowR: 9, fog: null, particles: 420, vignette: 1});
    E.cam.far = 400; E.cam.near = 0.08; E.cam.fov = o.fov || 38; E.lowAuto = q === "auto";
    var S = {E: E, cv: cv, host: host, o: o, men: [], t: 0, ts: 1, slowT: 0, shake: 0, raf: 0, alive: true, onFrame: null, ball: {x: 11, y: 0.11, z: 0, R: MX.m4(), show: true, sq: 0}, net: new Net(), rec: null, play: null, extra: []};
    var ctx = o.ctx || "big";
    S.ctx = ctx; S.tod = o.tod || "day"; S.wx = o.wx || null; S.wind = o.wind || null;
    E.setEnv(S.tod, S.wx === "rain" ? "rain" : S.wx === "snow" ? "cold" : null);
    if (S.tod === "night") E.flood = 0.9;
    /* mundo */
    if (ctx === "barrio") {
      barrio(o.season || 0).forEach(function (s) { E.addStatic(s.id, s.verts, {shadow: false}); });
      E.addStatic("goal", goalFrame(), {abs: true});
      E.lamps = [[GLX - 30, 14, -25], [GLX - 30, 14, 25], [GLX + 10, 14, -25], [GLX + 10, 14, 25]].map(function (p) { return [p[0], p[1], p[2]]; });
    } else {
      var key = (o.cols || []).join(","), W = worldCache[key] || (worldCache[key] = C.world(o.cols));
      E.addStatic("stadium", W.stat, {abs: true, shadow: false});
      E.addStatic("crowdA", W.crowd[0], {abs: true, shadow: false, crowd: true});
      if (ctx !== "small") E.addStatic("crowdB", W.crowd[1], {abs: true, shadow: false, crowd: true});
      E.lamps = W.towers.map(function (t) { return [t[0] - ORG[0], t[1] - ORG[1], t[2] - ORG[2]]; });
      S.towers = W.lamps;
    }
    E.addStatic("sky", C.sky(), {abs: true, shadow: false});
    E.crowdAmt = 0.15;
    S.crowdBase = (SP_DATA.ctx.filter(function (c) { return c.k === ctx; })[0] || {crowd: 0.6}).crowd;

    /* ---------- utilidades ---------- */
    S.L = L;
    S.man = function (mo) { var m = new SpRig.Man(mo); S.men.push(m); return m; };
    S.place = function (m, x, z, faceGoal) { var p = L(x, 0, z); m.x = p[0]; m.z = p[2]; m.yaw = faceGoal === false ? -PI / 2 : faceGoal === true || faceGoal == null ? PI / 2 : faceGoal; };
    S.faceTo = function (m, x, z) { var p = L(x, 0, z); m.yaw = Math.atan2(p[0] - m.x, p[2] - m.z); };
    S.project = function (x, y, z) { return E.project(L(x, y, z)); };
    S.fx = function (kind, x, y, z, n) {
      if (red() && kind !== "confetti") n = Math.ceil((n || 1) / 3);
      var p = L(x, y, z), i, wet = S.wx === "rain";
      for (i = 0; i < (n || 1); i++) {
        if (kind === "grass") E.spawn({x: p[0] + (Math.random() - 0.5) * 0.15, y: 0.03, z: p[2] + (Math.random() - 0.5) * 0.15, vx: (Math.random() - 0.5) * 2 - 1.2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, g: 9, life: 0.7, s: 0.025, c: wet ? "#5a4a32" : Math.random() < 0.6 ? "#4b8a34" : "#6a5236", floor: 0, drag: 0.6});
        else if (kind === "chalk") E.spawn({x: p[0] + (Math.random() - 0.5) * 0.3, y: 0.02, z: p[2] + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 0.8, vy: 0.4 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.8, g: 1.5, life: 0.9, s: 0.03, c: "#f0f2ea", drag: 2});
        else if (kind === "dust") E.spawn({x: p[0] + (Math.random() - 0.5) * 0.6, y: 0.03, z: p[2] + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 1.5, vy: 0.3 + Math.random() * 0.8, vz: (Math.random() - 0.5) * 1.5, g: 1.2, life: 1.1, s: 0.04, c: wet ? "#6c5a40" : "#c8b896", drag: 1.6});
        else if (kind === "spark") E.spawn({x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, g: 6, life: 0.35, s: 0.02, c: "#fff7c8", code: C.MAT.EMIT});
        else if (kind === "drop") E.spawn({x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, g: 9, life: 0.5, s: 0.014, c: "#b8d8f8", floor: 0});
        else if (kind === "spray") E.spawn({x: p[0], y: 0.01, z: p[2], life: 30, s: 0.05, c: "#ffffff", code: C.MAT.UNLIT});
        else if (kind === "confetti") E.spawn({x: p[0] + (Math.random() - 0.5) * 16, y: 6 + Math.random() * 4, z: p[2] + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.6, life: 6, s: 0.06, spin: 4, c: ["#e2403a", "#f6c83a", "#3a7ad8", "#4cb84a", "#f070a8", "#ffffff"][i % 6], floor: 0});
      }
    };
    S.slow = function (k, dur) { if (red()) return; S.ts = k; S.slowT = dur; };
    S.kick = function (a) { if (shakeOn()) S.shake = Math.max(S.shake, a); };
    S.hitstop = function (ms) { if (red()) return; S.stopT = Math.max(S.stopT || 0, ms / 1000); };
    /* cámara: presets en marco de juego */
    S.cam = {eye: [0, 0, 0], tgt: [0, 0, 0], fov: 38, from: null, k: 1, dur: 0};
    S.camTo = function (eye, tgt, fov, dur) {
      var c = S.cam; c.from = {eye: c.eye.slice(), tgt: c.tgt.slice(), fov: c.fov}; c.to = {eye: L(eye[0], eye[1], eye[2]), tgt: L(tgt[0], tgt[1], tgt[2]), fov: fov || c.fov}; c.k = dur ? 0 : 1; c.dur = dur || 0;
      if (!dur) { c.eye = c.to.eye.slice(); c.tgt = c.to.tgt.slice(); c.fov = c.to.fov; }
    };
    S.follow = null;
    function camApply(dt) {
      var c = S.cam;
      if (c.to && c.k < 1) { c.k = Math.min(1, c.k + dt / c.dur); var e = c.k < 0.5 ? 2 * c.k * c.k : 1 - Math.pow(-2 * c.k + 2, 2) / 2; for (var i = 0; i < 3; i++) { c.eye[i] = lerp(c.from.eye[i], c.to.eye[i], e); c.tgt[i] = lerp(c.from.tgt[i], c.to.tgt[i], e); } c.fov = lerp(c.from.fov, c.to.fov, e); }
      if (S.follow) S.follow(c, dt);
      var sh = S.shake > 0.001 ? S.shake : 0, sx = sh ? (Math.sin(S.t * 61) * sh * 0.06) : 0, sy = sh ? Math.cos(S.t * 53) * sh * 0.05 : 0; S.shake *= Math.pow(0.02, dt);
      var e2 = c.eye, t2 = c.tgt, dx = e2[0] - t2[0], dy = e2[1] - t2[1], dz = e2[2] - t2[2], dist = Math.hypot(dx, dy, dz);
      E.cam.target = [t2[0] + sx, t2[1] + sy, t2[2]]; E.cam.dist = dist; E.cam.yaw = Math.atan2(dx, dz); E.cam.pitch = Math.asin(cl(dy / dist, -0.99, 0.99)); E.cam.fov = c.fov; E.cam.iso = false;
    }
    /* balón: matriz de rotación acumulada con el giro real y squash al golpear */
    S.ballSpin = function (wx, wy, wz, dt) {
      var w = Math.sqrt(wx * wx + wy * wy + wz * wz); if (w < 1e-4) return;
      var ax = -wx / w, ay = wy / w, az = -wz / w, a = w * dt, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
      var Rm = MX.m4(); Rm[0] = t * ax * ax + c; Rm[1] = t * ax * ay + s * az; Rm[2] = t * ax * az - s * ay; Rm[4] = t * ax * ay - s * az; Rm[5] = t * ay * ay + c; Rm[6] = t * ay * az + s * ax; Rm[8] = t * ax * az + s * ay; Rm[9] = t * ay * az - s * ax; Rm[10] = t * az * az + c;
      S.ball.R = MX.mul(Rm, S.ball.R);
    };
    function drawBall() {
      var b = S.ball; if (!b.show) return;
      var p = L(b.x, b.y, b.z), sq = b.sq || 0;
      var M = MX.mul(MX.T(p[0], p[1], p[2]), MX.mul(MX.S(1 + sq * 0.25, 1 - sq * 0.3, 1 + sq * 0.25), b.R));
      E.bake(ballMesh(), M);
      /* sombra de contacto */
      E.dyn.code = C.MAT.UNLIT; var hs = Math.max(0.05, 0.12 - p[1] * 0.02);
      E.dyn.box(p[0] + ORG[0], 0.004 + ORG[1], p[2] + ORG[2], hs * 2, 0.002, hs * 2, [0.05, 0.08, 0.05], 1); E.dyn.code = -1;
      b.sq *= 0.82;
    }
    /* ---------- repetición: graba poses y balón por fotograma ---------- */
    S.record = function (on) { S.rec = on ? {f: []} : S.rec; if (!on && S.rec) S.rec.done = true; };
    function snap() {
      var f = {b: [S.ball.x, S.ball.y, S.ball.z, S.ball.show ? 1 : 0, S.ball.sq], R: Array.prototype.slice.call(S.ball.R), m: []};
      S.men.forEach(function (m) { var P = []; SpRig.ORDER.forEach(function (n) { P.push(m.P[n][0], m.P[n][1], m.P[n][2]); }); var R = m.root; f.m.push([m.x, m.y, m.z, m.yaw, R.y, R.rx, R.ry, R.rz, R.ox || 0, R.oz || 0, R.piv[0], R.piv[1], R.piv[2], m.show ? 1 : 0].concat(P)); });
      return f;
    }
    function apply(f) {
      S.ball.x = f.b[0]; S.ball.y = f.b[1]; S.ball.z = f.b[2]; S.ball.show = !!f.b[3]; S.ball.sq = f.b[4]; S.ball.R = new Float32Array(f.R);
      f.m.forEach(function (a, i) { var m = S.men[i]; if (!m) return; m.x = a[0]; m.y = a[1]; m.z = a[2]; m.yaw = a[3]; var R = m.root; R.y = a[4]; R.rx = a[5]; R.ry = a[6]; R.rz = a[7]; R.ox = a[8]; R.oz = a[9]; R.piv = [a[10], a[11], a[12]]; m.show = !!a[13]; var j = 14; SpRig.ORDER.forEach(function (n) { m.P[n][0] = a[j++]; m.P[n][1] = a[j++]; m.P[n][2] = a[j++]; }); });
    }
    /* reproduce lo grabado con una cámara y velocidad: cams = [{eye, tgt, fov}] en marco de juego */
    S.replay = function (cams, rate, done) {
      if (!S.rec || !S.rec.f.length) { if (done) done(); return; }
      S.play = {i: 0, f: S.rec.f, cams: cams, ci: 0, rate: rate || 0.5, acc: 0, done: done};
      var c0 = cams[0]; S.camTo(c0.eye, c0.tgt, c0.fov, 0);
    };
    S.stopReplay = function () { if (S.play) { var d = S.play.done; S.play = null; if (d) d(); } };

    /* ---------- bucle ---------- */
    var last = 0;
    function loop(ts) {
      if (!S.alive) return;
      S.raf = requestAnimationFrame(loop);
      if (document.hidden) { last = 0; return; }
      var rdt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      if (S.stopT > 0) { S.stopT -= rdt; rdt = 0; }
      if (S.slowT > 0) { S.slowT -= rdt; if (S.slowT <= 0) S.ts = 1; }
      var dt = rdt * (S.play ? 1 : S.ts);
      S.t += dt;
      E.crowdAmt = lerp(E.crowdAmt, S.crowdT == null ? S.crowdBase * 0.25 : S.crowdT, Math.min(1, rdt * 2));
      E.frame(rdt, function () {
        if (S.play) {
          var P = S.play; P.acc += rdt * P.rate * 60;
          while (P.acc >= 1 && P.i < P.f.length - 1) { P.acc -= 1; P.i++; }
          var segI = Math.floor(P.i / P.f.length * P.cams.length); if (segI !== P.ci && P.cams[segI]) { P.ci = segI; var cc = P.cams[segI]; S.camTo(cc.eye, cc.tgt, cc.fov, 0); }
          apply(P.f[P.i]);
          if (P.i >= P.f.length - 1) { var d = P.done; S.play = null; if (d) setTimeout(d, 0); }
        } else {
          if (S.onFrame) S.onFrame(dt);
          S.men.forEach(function (m) { m.update(dt); });
          if (S.rec && !S.rec.done) { S.rec.f.push(snap()); if (S.rec.f.length > 600) S.rec.f.shift(); }
        }
        camApply(rdt);
        S.net.step(dt);
        S.men.forEach(function (m) { m.draw(E); });
        drawBall();
        S.net.draw(E.dyn);
        S.extra.forEach(function (fn) { fn(E, dt); });
        weather(rdt);
      });
    }
    function weather(dt) {
      if (!S.wx || red() || E.quality === 0) return;
      S.wxA = (S.wxA || 0) + dt; var rate = S.wx === "rain" ? 0.004 : 0.02, t = E.cam.target;
      while (S.wxA > rate) { S.wxA -= rate; var x = t[0] + (Math.random() - 0.5) * 16, z = t[2] + (Math.random() - 0.5) * 16;
        if (S.wx === "rain") E.spawn({x: x, y: 6, z: z, vy: -14, vx: S.wind ? -S.wind[0] : 0, life: 0.45, s: 0.018, c: "#b8d4f0", floor: 0});
        else E.spawn({x: x, y: 6, z: z, vy: -0.8, vx: (Math.random() - 0.5) * 0.3, life: 7, s: 0.03, c: "#ffffff", floor: 0}); }
    }
    /* la mascota del jugador junto a la banda: sigue el balón y reacciona con sus accesorios */
    if (o.pet && typeof PetRig !== "undefined" && PetRig && typeof PetSim !== "undefined") {
      try {
        var pa = new PetRig.Actor({k: o.pet.k, stage: PetSim.stage(o.pet), col: o.pet.col, ico: typeof petIco === "function" ? petIco(o.pet) : "", eq: o.pet.eq || {}, scale: 1.6});
        var pp = L(2.5, 0, -7.6); pa.x = pp[0]; pa.z = pp[2]; pa.yaw = -2.2; pa.float = true; pa.baseExpr = "happy"; pa.mood = o.pet.mood || 70; if (pa.plan === "fish") pa.y = 0.4;
        S.extra.push(function (E2, dt) { var b = S.ball; pa.lookAt(L(b.x, b.y, b.z), 0.8); pa.update(dt); pa.draw(E2, {dt: dt}); });
        S.petReact = function (good) { pa.clip = null; if (good) { pa.play("jump", {done: function () { pa.play("spin"); }}); pa.say("excited", 3); } else { pa.play("sad"); pa.say("sad", 2.5); } };
      } catch (e) {}
    }
    S.start = function () { loop(0); };
    api.last = S;
    S.dispose = function () { S.alive = false; cancelAnimationFrame(S.raf); E.dispose(); if (cv.parentNode) cv.parentNode.removeChild(cv); };
    return S;
  }
  var api = {create: create, L: L, supported: function () { return VoxCore.supported(); }, GLX: GLX, last: null};
  return api;
})();
