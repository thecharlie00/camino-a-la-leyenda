/* Web de Camino a la Leyenda: anuncios, consent, idioma, pantalla completa y partido en directo (3D WebGL y 2D). */
(function () {
  "use strict";
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ---------- anuncios: se piden solo los huecos que se ven ---------- */
  function fillAds() {
    var list = document.querySelectorAll("ins.adsbygoogle:not([data-done])");
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.offsetWidth) continue;
      el.setAttribute("data-done", "1");
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }
  }
  if (document.querySelector("ins.adsbygoogle")) {
    fillAds();
    var t0 = 0;
    window.addEventListener("resize", function () { clearTimeout(t0); t0 = setTimeout(fillAds, 400); });
  }
  /* «Privacidad y cookies»: vuelve a mostrar el mensaje de consentimiento de Google */
  var cl = document.querySelectorAll("[data-consent]");
  for (var c = 0; c < cl.length; c++) cl[c].addEventListener("click", function () {
    var fc = window.googlefc;
    if (fc && typeof fc.showRevocationMessage === "function") fc.showRevocationMessage();
    else { window.googlefc = fc || {}; window.googlefc.callbackQueue = window.googlefc.callbackQueue || []; window.googlefc.callbackQueue.push({CONSENT_API_READY: function () { window.googlefc.showRevocationMessage(); }}); }
  });

  /* ---------- idioma de la web ---------- */
  var ll = document.querySelectorAll("[data-weblang]");
  for (var li = 0; li < ll.length; li++) ll[li].addEventListener("click", function () { try { localStorage.setItem("camino.webpick", this.getAttribute("data-weblang")); } catch (e) {} });
  document.addEventListener("click", function (ev) { var d = document.querySelectorAll("details.lang[open]"); for (var i = 0; i < d.length; i++) if (!d[i].contains(ev.target)) d[i].open = false; });
  try {
    var root = document.documentElement.lang === "es" && document.querySelector("link[rel=alternate][hreflang=en]") && /\/(index\.html)?$/.test(location.pathname) && document.getElementById("pitch");
    if (root && !localStorage.getItem("camino.webpick")) {
      var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "", pl = nav.slice(0, 2).toLowerCase();
      if (/^(en|de|it|fr)$/.test(pl)) { localStorage.setItem("camino.webpick", pl); location.replace(pl + "/"); return; }
      localStorage.setItem("camino.webpick", "es");
    }
  } catch (e) {}

  /* ---------- pantalla completa del juego ---------- */
  var fs = document.getElementById("fs"), pf = document.getElementById("pframe");
  if (fs && pf) {
    var req = pf.requestFullscreen || pf.webkitRequestFullscreen;
    if (!req) fs.hidden = true;
    else fs.addEventListener("click", function () {
      try { var r = req.call(pf); if (r && r.catch) r.catch(function () {}); } catch (e) {}
      var ifr = pf.querySelector("iframe"); if (ifr) setTimeout(function () { try { ifr.focus(); } catch (e) {} }, 300);
    });
  }
  /* móvil en horizontal: sugiere girarlo (una vez por visita) */
  var rot = document.getElementById("rot");
  if (rot) {
    var mq = null, said = false;
    try { mq = window.matchMedia("(orientation: landscape) and (max-height: 500px) and (pointer: coarse)"); said = sessionStorage.getItem("rotok") === "1"; } catch (e) {}
    var upd = function () { rot.hidden = !(mq && mq.matches) || said; };
    if (mq) { upd(); if (mq.addEventListener) mq.addEventListener("change", upd); else if (mq.addListener) mq.addListener(upd); }
    var ok = document.getElementById("rotok");
    if (ok) ok.addEventListener("click", function () { said = true; try { sessionStorage.setItem("rotok", "1"); } catch (e) {} upd(); });
  }
  var gameFrame = document.querySelector(".pframe iframe");
  if (gameFrame) gameFrame.addEventListener("load", function () { try { gameFrame.focus(); } catch (e) {} });

  /* ---------- PARTIDO EN DIRECTO (3D WebGL + 2D Canvas) ---------- */
  var cv2d = document.getElementById("pitch");
  if (!cv2d) return;

  var W = 105, H = 68, MIDZ = H / 2, K = cv2d.width / W;
  var COL = ["#ffb21e", "#66b9ff"], INK = ["#1d1404", "#06233d"];
  var F = [[4.5, 34], [24, 10], [21, 26], [21, 42], [24, 58], [40, 20], [37, 34], [40, 48], [58, 12], [62, 34], [58, 56]];
  var NAMES = [["Ribas", "Lozano", "Teo", "Barro", "Quique", "Moya", "Iker", "Saúl", "Pino", "Nando", "Cuesta"], ["Ferro", "Abel", "Garrido", "Nuño", "Ruiz", "Calvo", "Duarte", "Mateo", "Rivas", "Ortega", "Vidal"]];
  var T = [[], []], ball = {x: 52.5, y: 34, fx: 0, fy: 0, tx: 0, ty: 0, t: 1, d: 1, h: 0, z: 0, spin: 0}, own = 0, holder = 9, nextAt = 0, clock = 0, minute = 1, goals = [0, 0], shot = null, pause = 0;
  var sc = document.getElementById("sc"), say = document.getElementById("say");
  var TT = window.T || {kick: "Empieza el partido.", again: "Empieza otro partido.", shot: "Tiro de {n}…", try: "Lo intenta {n}…", goal: "¡Gol de {n}! {t} celebra.", out: "Fuera. Saca de puerta el portero.", rec: "Recupera {n}.", a: "Ribera", b: "Montaña"};
  function tt(k, p) { var v = TT[k] || ""; for (var x in p || {}) v = v.split("{" + x + "}").join(p[x]); return v; }

  for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
    var x = s ? W - F[i][0] : F[i][0], y = s ? H - F[i][1] : F[i][1];
    T[s].push({x: x, y: y, vx: 0, vy: 0, hx: F[i][0], hy: F[i][1], sp: 6 + Math.random() * 2.2, n: i + 1, ph: Math.random() * 6});
  }
  function U(s, u) { return s ? W - u : u; }
  function line(t) { if (say) say.innerHTML = '<span class="min">' + minute + "'</span> " + t; }
  function nearest(s, x, y, ex) { var b = -1, bd = 1e9; T[s].forEach(function (p, i) { if (i === ex || i === 0) return; var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; b = i; } }); return b; }
  function kick(x, y, d, h) { ball.fx = ball.x; ball.fy = ball.y; ball.tx = x; ball.ty = y; ball.t = 0; ball.d = d; ball.h = h || 0; holder = -1; }

  // Partículas 3D de celebración en los goles
  var particles = [];
  function burstGoal(gx) {
    for (var p = 0; p < 45; p++) {
      var ang = Math.random() * Math.PI * 2, sp = 5 + Math.random() * 12;
      particles.push({
        x: gx, y: 1.5 + Math.random() * 2, z: MIDZ + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * sp, vy: 4 + Math.random() * 8, vz: Math.sin(ang) * sp * 0.7,
        c: [[1, 0.7, 0.1], [0.4, 0.7, 1], [1, 1, 1], [0.2, 0.9, 0.4]][Math.floor(Math.random() * 4)],
        life: 1.8
      });
    }
  }

  function decide() {
    var p = T[own][holder], bu = own ? W - p.x : p.x, d = 1 - own;
    if (bu > 76 && Math.random() < 0.5) {
      var gy = 34 + (Math.random() - 0.5) * 9, goal = Math.random() < 0.32;
      if (!goal && Math.random() < 0.5) gy = 34 + (Math.random() < 0.5 ? -1 : 1) * (4.2 + Math.random() * 3);
      shot = {s: own, goal: goal, who: NAMES[own][holder]};
      kick(U(own, W + 0.8), gy, 0.55, 1.4);
      line(tt(goal ? "shot" : "try", {n: shot.who}));
      return;
    }
    var best = -1, bw = -1;
    T[own].forEach(function (q, i) {
      if (i === holder || i === 0) return;
      var fwd = (own ? p.x - q.x : q.x - p.x), dist = Math.hypot(q.x - p.x, q.y - p.y); if (dist < 7 || dist > 40) return;
      var open = 99; T[d].forEach(function (o) { open = Math.min(open, Math.hypot(o.x - q.x, o.y - q.y)); });
      var w = (0.6 + Math.min(open, 9) / 9) * (fwd > 0 ? 1.4 : 0.7) * (0.5 + Math.random());
      if (w > bw) { bw = w; best = i; }
    });
    if (best < 0) { nextAt = clock + 0.5; return; }
    var r = T[own][best], dist2 = Math.hypot(r.x - p.x, r.y - p.y);
    var steal = Math.random() < 0.16, tgt = {x: r.x + (own ? -2 : 2), y: r.y};
    kick(tgt.x, tgt.y, 0.25 + dist2 / 18, dist2 > 26 ? 2.8 : 0);
    ball.to = steal ? {s: d, i: nearest(d, tgt.x, tgt.y)} : {s: own, i: best};
  }

  function arrive() {
    if (shot) {
      var s0 = shot.s, who = shot.who; shot = null;
      if (Math.abs(ball.ty - 34) < 3.66 && Math.random() < 0.85) {
        goals[s0]++; if (sc) sc.textContent = goals[0] + "-" + goals[1];
        burstGoal(s0 === 0 ? W : 0);
        line(tt("goal", {n: who, t: s0 ? TT.b : TT.a}));
      } else line(tt("out"));
      pause = 1.6; own = 1 - s0; holder = 0; ball.x = U(own, 5); ball.y = 34; nextAt = clock + 1.8;
      return;
    }
    var to = ball.to || {s: own, i: 9};
    if (to.s !== own) line(tt("rec", {n: NAMES[to.s][to.i]}));
    own = to.s; holder = to.i; nextAt = clock + 0.5 + Math.random() * 0.7;
  }

  function step(dt) {
    clock += dt;
    if (clock > minute * 1.25 && minute < 90) minute++;
    if (minute >= 90 && clock > minute * 1.25 + 4) { minute = 1; clock = 0; goals = [0, 0]; if (sc) sc.textContent = "0-0"; line(tt("again")); }
    if (pause > 0) pause -= dt;
    if (holder < 0) {
      ball.t += dt; var k = Math.min(1, ball.t / ball.d), e = k * (2 - k);
      ball.x = ball.fx + (ball.tx - ball.fx) * e; ball.y = ball.fy + (ball.ty - ball.fy) * e; ball.z = 4 * ball.h * k * (1 - k);
      ball.spin += dt * 14;
      if (k >= 1) arrive();
    } else {
      var hp = T[own][holder]; ball.x += (hp.x + (own ? -0.8 : 0.8) - ball.x) * Math.min(1, dt * 10); ball.y += (hp.y - ball.y) * Math.min(1, dt * 10); ball.z = 0;
      ball.spin += dt * 4;
      if (clock > nextAt && pause <= 0) decide();
    }
    var bu0 = own ? W - ball.x : ball.x;
    for (var s = 0; s < 2; s++) {
      var att = s === own, push = att ? (bu0 - 45) * 0.45 : (bu0 - 60) * 0.4;
      T[s].forEach(function (p, i) {
        var u = p.hx + (i ? push : 0), v = p.hy + (ball.y - 34) * (i ? 0.25 : 0.12);
        if (i === 0) u = Math.min(Math.max(p.hx + (att ? 4 : 0), 2), 14);
        var tx = U(s, Math.max(2, Math.min(W - 2, u))) + Math.sin(clock * 0.7 + p.ph) * 1.2, ty = Math.max(2, Math.min(H - 2, v + Math.cos(clock * 0.6 + p.ph) * 1.2));
        if (!att && holder >= 0 && i === nearest(s, ball.x, ball.y)) { tx = ball.x; ty = ball.y; }
        if (holder < 0 && ball.to && ball.to.s === s && ball.to.i === i) { tx = ball.tx; ty = ball.ty; }
        if (s === own && i === holder) { tx = p.x + (own ? -3 : 3); ty = p.y + Math.sin(clock + p.ph) * 0.6; }
        var dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy), want = Math.min(p.sp, Math.sqrt(2 * 5 * dist));
        var wx = dist > 0.1 ? dx / dist * want : 0, wy = dist > 0.1 ? dy / dist * want : 0, a = Math.min(1, dt * 3.2);
        p.vx += (wx - p.vx) * a; p.vy += (wy - p.vy) * a; p.x += p.vx * dt; p.y += p.vy * dt;
      });
    }

    // Partículas de goles
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pr = particles[pi];
      pr.life -= dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.z += pr.vz * dt;
      pr.vy -= 9.8 * dt;
      if (pr.y < 0) { pr.y = 0; pr.vy = -pr.vy * 0.4; }
      if (pr.life <= 0) particles.splice(pi, 1);
    }
  }

  /* ---------- RENDERER 2D (Canvas) ---------- */
  var ctx2d = cv2d.getContext("2d");
  function draw2D() {
    if (!ctx2d) return;
    for (var i = 0; i < 12; i++) { ctx2d.fillStyle = i % 2 ? "#206646" : "#1b5a3c"; ctx2d.fillRect(i * W / 12 * K, 0, W / 12 * K + 1, H * K); }
    ctx2d.strokeStyle = "rgba(237,241,232,.75)"; ctx2d.lineWidth = 0.32 * K;
    ctx2d.strokeRect(1 * K, 1 * K, (W - 2) * K, (H - 2) * K);
    ctx2d.beginPath(); ctx2d.moveTo(W / 2 * K, 1 * K); ctx2d.lineTo(W / 2 * K, (H - 1) * K); ctx2d.stroke();
    ctx2d.beginPath(); ctx2d.arc(W / 2 * K, H / 2 * K, 9.15 * K, 0, 6.283); ctx2d.stroke();
    [0, 1].forEach(function (s) {
      var x0 = s ? W - 1 - 16.5 : 1, x1 = s ? W - 1 - 5.5 : 1;
      ctx2d.strokeRect(x0 * K, (34 - 20.16) * K, 16.5 * K, 40.32 * K);
      ctx2d.strokeRect(x1 * K, (34 - 9.16) * K, 5.5 * K, 18.32 * K);
      ctx2d.fillStyle = "rgba(237,241,232,.9)"; ctx2d.fillRect((s ? W - 1 : 1 - 1.2) * K, (34 - 3.66) * K, 1.2 * K, 7.32 * K);
    });
    var r = 1.25 * K;
    for (var s = 0; s < 2; s++) T[s].forEach(function (p, i) {
      ctx2d.fillStyle = "rgba(0,0,0,.28)"; ctx2d.beginPath(); ctx2d.arc(p.x * K + 2, p.y * K + 3, r, 0, 6.283); ctx2d.fill();
      ctx2d.fillStyle = i === 0 ? "#edf1e8" : COL[s]; ctx2d.beginPath(); ctx2d.arc(p.x * K, p.y * K, r, 0, 6.283); ctx2d.fill();
      ctx2d.fillStyle = i === 0 ? "#1b2a2e" : INK[s]; ctx2d.font = "800 " + Math.round(r * 1.15) + "px 'Atkinson Hyperlegible Next', sans-serif"; ctx2d.textAlign = "center"; ctx2d.textBaseline = "middle";
      ctx2d.fillText(String(p.n), p.x * K, p.y * K + 1);
    });
    ctx2d.fillStyle = "rgba(0,0,0,.3)"; ctx2d.beginPath(); ctx2d.arc(ball.x * K + 2 + ball.z * 2, ball.y * K + 3 + ball.z * 2, 0.6 * K, 0, 6.283); ctx2d.fill();
    ctx2d.fillStyle = "#fff"; ctx2d.beginPath(); ctx2d.arc(ball.x * K, (ball.y - ball.z * 0.35) * K, (0.62 + ball.z * 0.05) * K, 0, 6.283); ctx2d.fill();
  }

  /* ---------- RENDERER 3D (WebGL 1 puro sin dependencias) ---------- */
  var cv3d = document.getElementById("pitch-3d");
  var gl = null, p3dAvailable = false, mode3d = true;

  function Mesh(capacity) {
    this.a = new Float32Array(capacity * 6);
    this.n = 0;
  }
  Mesh.prototype.v = function (x, y, z, c) {
    if (this.n + 6 > this.a.length) {
      var b = new Float32Array(this.a.length * 2);
      b.set(this.a);
      this.a = b;
    }
    var i = this.n;
    this.a[i] = x; this.a[i+1] = y; this.a[i+2] = z;
    this.a[i+3] = c[0]; this.a[i+4] = c[1]; this.a[i+5] = c[2];
    this.n += 6;
  };
  Mesh.prototype.tri = function (p0, p1, p2, c) {
    this.v(p0[0], p0[1], p0[2], c);
    this.v(p1[0], p1[1], p1[2], c);
    this.v(p2[0], p2[1], p2[2], c);
  };
  Mesh.prototype.quad = function (p0, p1, p2, p3, c) {
    this.tri(p0, p1, p2, c);
    this.tri(p0, p2, p3, c);
  };
  Mesh.prototype.box = function (cx, cy, cz, sx, sy, sz, c) {
    var hx = sx / 2, hy = sy / 2, hz = sz / 2;
    var x0 = cx - hx, x1 = cx + hx;
    var y0 = cy - hy, y1 = cy + hy;
    var z0 = cz - hz, z1 = cz + hz;
    var ct = [Math.min(1, c[0] * 1.15), Math.min(1, c[1] * 1.15), Math.min(1, c[2] * 1.15)];
    var cb = [c[0] * 0.65, c[1] * 0.65, c[2] * 0.65];
    var cs = [c[0] * 0.88, c[1] * 0.88, c[2] * 0.88];
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], ct);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], cb);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c);
    this.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], cs);
    this.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], cs);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], cs);
  };
  Mesh.prototype.line = function (x0, z0, x1, z1, y, w, c) {
    var dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1;
    var nx = (-dz / len) * (w / 2), nz = (dx / len) * (w / 2);
    this.quad([x0 - nx, y, z0 - nz], [x1 - nx, y, z1 - nz], [x1 + nx, y, z1 + nz], [x0 + nx, y, z0 + nz], c);
  };
  Mesh.prototype.ring = function (cx, cz, y, r, w, c, segs) {
    var count = segs || 36, step = (Math.PI * 2) / count;
    for (var i = 0; i < count; i++) {
      var a0 = i * step, a1 = (i + 1) * step;
      var r0 = r - w / 2, r1 = r + w / 2;
      var x00 = cx + Math.cos(a0) * r0, z00 = cz + Math.sin(a0) * r0;
      var x01 = cx + Math.cos(a0) * r1, z01 = cz + Math.sin(a0) * r1;
      var x10 = cx + Math.cos(a1) * r0, z10 = cz + Math.sin(a1) * r0;
      var x11 = cx + Math.cos(a1) * r1, z11 = cz + Math.sin(a1) * r1;
      this.quad([x00, y, z00], [x10, y, z10], [x11, y, z11], [x01, y, z01], c);
    }
  };

  var program = null, locations = null, staticBuf = null, dynBuf = null, staticCount = 0;
  var viewMat = new Float32Array(16), projMat = new Float32Array(16), mvpMat = new Float32Array(16);
  var dynMesh = new Mesh(16384);

  // Cámara 3D interactiva
  var camMode = "tv";
  var cam = { x: 52.5, y: 32, z: -26, lookX: 52.5, lookY: 1.0, lookZ: 34 };
  var orbit = { yaw: 0, pitch: 0, userOffset: false };
  var dragging = false, lastDrag = { x: 0, y: 0 };

  function buildStaticStadium(m) {
    var WHITE = [0.94, 0.96, 0.94];
    var green1 = [0.07, 0.32, 0.16], green2 = [0.09, 0.38, 0.19];
    var standCol = [0.05, 0.08, 0.11], tierCol = [0.08, 0.12, 0.16], seatCol = [0.12, 0.22, 0.3];
    var adDark = [0.08, 0.16, 0.22], adGold = [0.85, 0.65, 0.15];

    // Fondo / Terreno exterior del estadio
    m.quad([-36, -0.05, -24], [W + 36, -0.05, -24], [W + 36, -0.05, H + 24], [-36, -0.05, H + 24], [0.03, 0.05, 0.06]);
    // Césped del campo con 12 franjas
    for (var i = 0; i < 12; i++) {
      var x0 = i * (W / 12), x1 = (i + 1) * (W / 12);
      m.quad([x0, 0, 0], [x1, 0, 0], [x1, 0, H], [x0, 0, H], i % 2 === 0 ? green1 : green2);
    }

    // Líneas blancas del campo
    var lw = 0.15;
    m.line(0, 0, W, 0, 0.012, lw, WHITE);
    m.line(W, 0, W, H, 0.012, lw, WHITE);
    m.line(W, H, 0, H, 0.012, lw, WHITE);
    m.line(0, H, 0, 0, 0.012, lw, WHITE);
    m.line(W / 2, 0, W / 2, H, 0.012, lw, WHITE);
    m.ring(W / 2, MIDZ, 0.012, 9.15, lw, WHITE, 40);
    m.box(W / 2, 0.013, MIDZ, 0.3, 0.01, 0.3, WHITE); // punto central

    // Áreas de penalti y porterías en ambos extremos
    [0, 1].forEach(function (s) {
      var gx = s ? W : 0, sgn = s ? -1 : 1;
      var boxX = gx + sgn * 16.5, boxZ0 = MIDZ - 20.16, boxZ1 = MIDZ + 20.16;
      m.line(gx, boxZ0, boxX, boxZ0, 0.012, lw, WHITE);
      m.line(boxX, boxZ0, boxX, boxZ1, 0.012, lw, WHITE);
      m.line(boxX, boxZ1, gx, boxZ1, 0.012, lw, WHITE);

      var sboxX = gx + sgn * 5.5, sboxZ0 = MIDZ - 9.16, sboxZ1 = MIDZ + 9.16;
      m.line(gx, sboxZ0, sboxX, sboxZ0, 0.012, lw, WHITE);
      m.line(sboxX, sboxZ0, sboxX, sboxZ1, 0.012, lw, WHITE);
      m.line(sboxX, sboxZ1, gx, sboxZ1, 0.012, lw, WHITE);

      // Punto de penalti
      m.box(gx + sgn * 11, 0.013, MIDZ, 0.28, 0.01, 0.28, WHITE);

      // Porterías 3D (postes, larguero y red)
      var pZ0 = MIDZ - 3.66, pZ1 = MIDZ + 3.66, gh = 2.44, depth = 2.0;
      var postCol = [0.96, 0.98, 0.96], netCol = [0.82, 0.88, 0.85];
      m.box(gx, gh / 2, pZ0, 0.16, gh, 0.16, postCol);
      m.box(gx, gh / 2, pZ1, 0.16, gh, 0.16, postCol);
      m.box(gx, gh, MIDZ, 0.16, 0.16, 7.32, postCol);
      // Estructura trasera y red
      m.box(gx - sgn * depth, gh / 2, pZ0, 0.1, gh, 0.1, [0.4, 0.5, 0.45]);
      m.box(gx - sgn * depth, gh / 2, pZ1, 0.1, gh, 0.1, [0.4, 0.5, 0.45]);
      m.box(gx - sgn * depth, gh, MIDZ, 0.1, 0.1, 7.32, [0.4, 0.5, 0.45]);
      // Red inclinada
      m.quad([gx, gh, pZ0], [gx, gh, pZ1], [gx - sgn * depth, 0.05, pZ1], [gx - sgn * depth, 0.05, pZ0], netCol);
      m.quad([gx, gh, pZ0], [gx - sgn * depth, gh, pZ0], [gx - sgn * depth, 0.05, pZ0], [gx, 0.05, pZ0], netCol);
      m.quad([gx, gh, pZ1], [gx, 0.05, pZ1], [gx - sgn * depth, 0.05, pZ1], [gx - sgn * depth, gh, pZ1], netCol);

      // Banderines de córner
      [[0, 0], [0, H], [W, 0], [W, H]].forEach(function (pt) {
        m.box(pt[0], 0.75, pt[1], 0.08, 1.5, 0.08, [0.9, 0.9, 0.2]);
        m.box(pt[0], 1.35, pt[1] + (pt[1] === 0 ? 0.2 : -0.2), 0.04, 0.28, 0.38, [0.9, 0.2, 0.15]);
      });
    });

    // Vallas publicitarias alrededor del campo
    for (var bx = 4; bx < W; bx += 18) {
      m.box(bx + 8, 0.5, -2.4, 16, 1.0, 0.35, (bx % 36 === 0) ? adGold : adDark);
      m.box(bx + 8, 0.5, H + 2.4, 16, 1.0, 0.35, (bx % 36 === 0) ? adGold : adDark);
    }
    // Gradas con gradientes de color
    for (var tier = 0; tier < 3; tier++) {
      var tz = -(5 + tier * 4.5), th = 1.2 + tier * 2.2;
      m.box(W / 2, th / 2, tz, W + 30, th, 4.0, (tier % 2 === 0 ? standCol : tierCol));
      m.box(W / 2, th + 0.1, tz, W + 28, 0.2, 3.2, seatCol);

      var bz = H + 5 + tier * 4.5;
      m.box(W / 2, th / 2, bz, W + 30, th, 4.0, (tier % 2 === 0 ? standCol : tierCol));
      m.box(W / 2, th + 0.1, bz, W + 28, 0.2, 3.2, seatCol);
    }
  }

  function initWebGL() {
    if (!cv3d) return false;
    try {
      gl = cv3d.getContext("webgl", { antialias: true, alpha: false }) || cv3d.getContext("experimental-webgl");
      if (!gl) return false;

      var vsSrc = "attribute vec3 aPos; attribute vec3 aCol; uniform mat4 uMvp; uniform vec3 uEye; varying vec3 vCol; varying float vDepth;" +
                  "void main(){ vCol = aCol; vDepth = distance(aPos, uEye); gl_Position = uMvp * vec4(aPos, 1.0); }";
      var fsSrc = "precision mediump float; varying vec3 vCol; varying float vDepth; uniform vec3 uFog; uniform float uNear; uniform float uFar;" +
                  "void main(){ float f = smoothstep(uNear, uFar, vDepth); gl_FragColor = vec4(mix(vCol, uFog, f * 0.45), 1.0); }";

      function compile(type, src) {
        var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      }
      var vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);

      locations = {
        pos: gl.getAttribLocation(program, "aPos"),
        col: gl.getAttribLocation(program, "aCol"),
        mvp: gl.getUniformLocation(program, "uMvp"),
        eye: gl.getUniformLocation(program, "uEye"),
        fog: gl.getUniformLocation(program, "uFog"),
        near: gl.getUniformLocation(program, "uNear"),
        far: gl.getUniformLocation(program, "uFar")
      };

      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0.04, 0.08, 0.10, 1.0);

      var sm = new Mesh(16384);
      buildStaticStadium(sm);
      staticBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
      gl.bufferData(gl.ARRAY_BUFFER, sm.a.subarray(0, sm.n), gl.STATIC_DRAW);
      staticCount = sm.n / 6;

      dynBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
      gl.bufferData(gl.ARRAY_BUFFER, 65536 * 4, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return true;
    } catch (e) {
      if (window.console) console.warn("WebGL fallback a 2D:", e);
      return false;
    }
  }

  p3dAvailable = initWebGL();

  // Controles de cámara táctiles / ratón
  if (cv3d) {
    cv3d.addEventListener("mousedown", function (e) { dragging = true; lastDrag = { x: e.clientX, y: e.clientY }; orbit.userOffset = true; });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastDrag.x, dy = e.clientY - lastDrag.y;
      orbit.yaw += dx * 0.008;
      orbit.pitch = Math.max(-0.4, Math.min(0.5, orbit.pitch + dy * 0.008));
      lastDrag = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("mouseup", function () { dragging = false; });
    cv3d.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) { dragging = true; lastDrag = { x: e.touches[0].clientX, y: e.touches[0].clientY }; orbit.userOffset = true; }
    }, { passive: true });
    cv3d.addEventListener("touchmove", function (e) {
      if (!dragging || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - lastDrag.x, dy = e.touches[0].clientY - lastDrag.y;
      orbit.yaw += dx * 0.008;
      orbit.pitch = Math.max(-0.4, Math.min(0.5, orbit.pitch + dy * 0.008));
      lastDrag = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    window.addEventListener("touchend", function () { dragging = false; });
  }

  // Botones de cámara
  var camBtns = document.querySelectorAll("[data-cam]");
  for (var cbi = 0; cbi < camBtns.length; cbi++) {
    camBtns[cbi].addEventListener("click", function (ev) {
      ev.preventDefault();
      var c = this.getAttribute("data-cam");
      camMode = c;
      orbit.yaw = 0; orbit.pitch = 0; orbit.userOffset = false;
      for (var j = 0; j < camBtns.length; j++) camBtns[j].classList.toggle("active", camBtns[j] === this);
    });
  }

  // Selector de Modo 3D / 2D
  var modePills = document.querySelectorAll("[data-mode]");
  var camBar = document.getElementById("cam-bar");
  function setMatchMode(want3d) {
    mode3d = want3d && p3dAvailable;
    if (cv3d) cv3d.style.display = mode3d ? "block" : "none";
    if (cv2d) cv2d.style.display = mode3d ? "none" : "block";
    if (camBar) camBar.style.display = mode3d ? "flex" : "none";
    for (var m = 0; m < modePills.length; m++) {
      var is3 = modePills[m].getAttribute("data-mode") === "3d";
      modePills[m].classList.toggle("active", is3 === mode3d);
    }
  }
  for (var mpi = 0; mpi < modePills.length; mpi++) {
    modePills[mpi].addEventListener("click", function (ev) {
      ev.preventDefault();
      setMatchMode(this.getAttribute("data-mode") === "3d");
    });
  }
  setMatchMode(p3dAvailable);

  function draw3D() {
    if (!gl || !program) return;
    gl.viewport(0, 0, cv3d.width, cv3d.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Seguimiento suave del balón con la cámara
    cam.lookX += (ball.x - cam.lookX) * 0.08;
    cam.lookZ += (ball.y - cam.lookZ) * 0.08;

    var targetEye = [52.5, 30.0, -26.0];
    if (camMode === "tv") {
      targetEye[0] = cam.lookX * 0.72 + 52.5 * 0.28;
      targetEye[1] = 30.0;
      targetEye[2] = -26.0;
    } else if (camMode === "lateral") {
      targetEye[0] = cam.lookX;
      targetEye[1] = 13.0;
      targetEye[2] = -14.0;
    } else if (camMode === "aerea") {
      targetEye[0] = 52.5;
      targetEye[1] = 72.0;
      targetEye[2] = MIDZ - 0.05;
    }

    // Aplicar rotación táctil del usuario si existe
    if (orbit.userOffset) {
      var dx = targetEye[0] - cam.lookX, dz = targetEye[2] - cam.lookZ;
      var dist = Math.hypot(dx, dz) || 35;
      var baseAng = Math.atan2(dz, dx) + orbit.yaw;
      targetEye[0] = cam.lookX + Math.cos(baseAng) * dist;
      targetEye[2] = cam.lookZ + Math.sin(baseAng) * dist;
      targetEye[1] = Math.max(8, targetEye[1] + orbit.pitch * 30);
    }

    cam.x += (targetEye[0] - cam.x) * 0.1;
    cam.y += (targetEye[1] - cam.y) * 0.1;
    cam.z += (targetEye[2] - cam.z) * 0.1;

    // LookAt corregido: orientación vertical correcta (césped abajo, cabezas arriba) y alineación este-oeste
    var ex = cam.x, ey = cam.y, ez = cam.z;
    var lx = cam.lookX, ly = cam.lookY, lz = cam.lookZ;
    var fx = lx - ex, fy = ly - ey, fz = lz - ez;
    var flen = Math.hypot(fx, fy, fz) || 1;
    fx /= flen; fy /= flen; fz /= flen;

    // Vector R (derecha en pantalla): normal de [0, 1, 0] y F -> [fz, 0, -fx]
    var rx = fz, ry = 0, rz = -fx;
    var rlen = Math.hypot(rx, rz);
    if (rlen < 0.0001) { rx = 1; rz = 0; }
    else { rx /= rlen; rz /= rlen; }

    // Vector U (arriba en pantalla): U = cross(F, R)
    var ux = fy * rz - fz * ry;
    var uy = fz * rx - fx * rz;
    var uz = fx * ry - fy * rx;
    var ulen = Math.hypot(ux, uy, uz) || 1;
    ux /= ulen; uy /= ulen; uz /= ulen;

    // Z_cam en OpenGL: -F
    var zcx = -fx, zcy = -fy, zcz = -fz;

    viewMat[0] = rx;  viewMat[1] = ux;  viewMat[2] = zcx;  viewMat[3] = 0;
    viewMat[4] = ry;  viewMat[5] = uy;  viewMat[6] = zcy;  viewMat[7] = 0;
    viewMat[8] = rz;  viewMat[9] = uz;  viewMat[10] = zcz; viewMat[11] = 0;
    viewMat[12] = -(rx * ex + ry * ey + rz * ez);
    viewMat[13] = -(ux * ex + uy * ey + uz * ez);
    viewMat[14] = -(zcx * ex + zcy * ey + zcz * ez);
    viewMat[15] = 1;

    var aspect = cv3d.width / cv3d.height, fov = Math.PI / 4, near = 0.5, far = 260.0;
    var f = 1.0 / Math.tan(fov / 2), rangeInv = 1 / (near - far);
    projMat[0] = f / aspect; projMat[1] = 0; projMat[2] = 0; projMat[3] = 0;
    projMat[4] = 0; projMat[5] = f; projMat[6] = 0; projMat[7] = 0;
    projMat[8] = 0; projMat[9] = 0; projMat[10] = (far + near) * rangeInv; projMat[11] = -1;
    projMat[12] = 0; projMat[13] = 0; projMat[14] = (2 * far * near) * rangeInv; projMat[15] = 0;

    for (var mi = 0; mi < 4; mi++) {
      var ai0 = projMat[mi], ai1 = projMat[mi+4], ai2 = projMat[mi+8], ai3 = projMat[mi+12];
      mvpMat[mi]    = ai0 * viewMat[0] + ai1 * viewMat[1] + ai2 * viewMat[2] + ai3 * viewMat[3];
      mvpMat[mi+4]  = ai0 * viewMat[4] + ai1 * viewMat[5] + ai2 * viewMat[6] + ai3 * viewMat[7];
      mvpMat[mi+8]  = ai0 * viewMat[8] + ai1 * viewMat[9] + ai2 * viewMat[10] + ai3 * viewMat[11];
      mvpMat[mi+12] = ai0 * viewMat[12] + ai1 * viewMat[13] + ai2 * viewMat[14] + ai3 * viewMat[15];
    }

    gl.useProgram(program);
    gl.uniformMatrix4fv(locations.mvp, false, mvpMat);
    gl.uniform3f(locations.eye, cam.x, cam.y, cam.z);
    gl.uniform3f(locations.fog, 0.04, 0.08, 0.10);
    gl.uniform1f(locations.near, 30.0);
    gl.uniform1f(locations.far, 160.0);

    // Dibujar estadio estático
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.enableVertexAttribArray(locations.pos);
    gl.vertexAttribPointer(locations.pos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(locations.col);
    gl.vertexAttribPointer(locations.col, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.TRIANGLES, 0, staticCount);

    // Construir objetos dinámicos (jugadores, balón, sombras)
    dynMesh.n = 0;

    // 22 Jugadores 3D
    for (var s = 0; s < 2; s++) {
      var shirt = s === 0 ? [1.0, 0.70, 0.12] : [0.40, 0.72, 1.0];
      var shorts = s === 0 ? [0.06, 0.11, 0.18] : [0.92, 0.94, 0.95];
      var skin = [[0.82, 0.62, 0.48], [0.65, 0.45, 0.32], [0.45, 0.30, 0.20]][s % 3];

      for (var ji = 0; ji < 11; ji++) {
        var p = T[s][ji], isGk = (ji === 0);
        var curShirt = isGk ? [0.15, 0.85, 0.45] : shirt;
        var spd = Math.hypot(p.vx, p.vy);
        var stride = Math.sin(clock * 9 + p.ph) * Math.min(0.45, spd * 0.1);

        // Sombra de contacto suave
        dynMesh.quad([p.x - 0.45, 0.005, p.y - 0.35], [p.x + 0.45, 0.005, p.y - 0.35], [p.x + 0.45, 0.005, p.y + 0.35], [p.x - 0.45, 0.005, p.y + 0.35], [0.03, 0.07, 0.04]);

        // Piernas con animación de carrera
        dynMesh.box(p.x - 0.12, 0.35, p.y + stride, 0.15, 0.62, 0.16, skin);
        dynMesh.box(p.x + 0.12, 0.35, p.y - stride, 0.15, 0.62, 0.16, skin);
        // Botas
        dynMesh.box(p.x - 0.12, 0.06, p.y + stride, 0.16, 0.12, 0.22, [0.12, 0.13, 0.15]);
        dynMesh.box(p.x + 0.12, 0.06, p.y - stride, 0.16, 0.12, 0.22, [0.12, 0.13, 0.15]);
        // Pantalón
        dynMesh.box(p.x, 0.72, p.y, 0.44, 0.24, 0.28, shorts);
        // Torso / Camiseta
        dynMesh.box(p.x, 1.10, p.y, 0.48, 0.52, 0.26, curShirt);
        // Cabeza y pelo
        dynMesh.box(p.x, 1.48, p.y, 0.24, 0.24, 0.24, skin);
        dynMesh.box(p.x, 1.62, p.y - 0.02, 0.25, 0.08, 0.26, [0.12, 0.08, 0.05]);
      }
    }

    // Balón 3D con elevación y rotación
    var by = ball.z * 1.6 + 0.24;
    var bShadR = Math.max(0.18, 0.38 - ball.z * 0.06);
    dynMesh.quad([ball.x - bShadR, 0.006, ball.y - bShadR], [ball.x + bShadR, 0.006, ball.y - bShadR], [ball.x + bShadR, 0.006, ball.y + bShadR], [ball.x - bShadR, 0.006, ball.y + bShadR], [0.03, 0.07, 0.04]);

    // Balón esfera facetada
    var br = 0.24, segs = 8;
    for (var si = 0; si < segs; si++) {
      var a0 = (si / segs) * Math.PI * 2 + ball.spin, a1 = ((si + 1) / segs) * Math.PI * 2 + ball.spin;
      var isDark = si % 2 === 0;
      var bcol = isDark ? [0.18, 0.18, 0.22] : [0.98, 0.98, 0.98];
      var p0 = [ball.x + Math.cos(a0) * br, by + 0.12, ball.y + Math.sin(a0) * br];
      var p1 = [ball.x + Math.cos(a1) * br, by + 0.12, ball.y + Math.sin(a1) * br];
      var p2 = [ball.x + Math.cos(a1) * br, by - 0.12, ball.y + Math.sin(a1) * br];
      var p3 = [ball.x + Math.cos(a0) * br, by - 0.12, ball.y + Math.sin(a0) * br];
      dynMesh.quad(p0, p1, p2, p3, bcol);
    }
    dynMesh.box(ball.x, by + br, ball.y, br * 1.4, 0.06, br * 1.4, [0.98, 0.98, 0.98]);
    dynMesh.box(ball.x, by - br, ball.y, br * 1.4, 0.06, br * 1.4, [0.98, 0.98, 0.98]);

    // Partículas de celebración de gol
    for (var pi = 0; pi < particles.length; pi++) {
      var pt = particles[pi];
      dynMesh.box(pt.x, pt.y, pt.z, 0.22, 0.22, 0.22, pt.c);
    }

    // Dibujar buffer dinámico
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, dynMesh.a.subarray(0, dynMesh.n));
    gl.vertexAttribPointer(locations.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locations.col, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.TRIANGLES, 0, dynMesh.n / 6);
  }

  /* ---------- LOOP PRINCIPAL ---------- */
  var last = 0, visible = true, run = !reduce;
  function frame(ts) {
    if (!run) return;
    var dt = Math.min(0.05, ((ts - last) / 1000) || 0); last = ts;
    if (visible && !document.hidden) {
      step(dt);
      if (mode3d && p3dAvailable) draw3D();
      else draw2D();
    }
    requestAnimationFrame(frame);
  }

  for (var w = 0; w < 120; w++) step(1 / 30);
  if (p3dAvailable) draw3D(); else draw2D();

  if (run) {
    var obsTarget = cv3d || cv2d;
    if ("IntersectionObserver" in window && obsTarget) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(obsTarget);
    }
    requestAnimationFrame(function (ts) { last = ts; frame(ts); });
  }
})();
