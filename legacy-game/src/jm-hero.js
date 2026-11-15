/* jm-hero.js — Jugada Maestra en 3D, al estilo de los juegos de jugadas dibujadas.
   Cámara detrás del balón mirando a la portería, jugadores vóxel y un trazo que dibujas con el dedo:
   el balón sigue tu trazo (con rosca si lo curvas), los rivales lo cortan si pasa cerca y el último
   trazo, hacia la portería, es el tiro (esquina, altura, palo o fuera). El resultado lo decide el motor
   (jugada-maestra.js); aquí solo se dibuja, se recoge el trazo y se anima. Sin WebGL no se usa y la
   interfaz vuelve al campo plano de siempre. */
var JMHero = (function () {
  "use strict";
  if (typeof SP3 === "undefined" || !SP3 || typeof SpModes === "undefined" || !SpModes || !SpModes._int || typeof JugadaMaestra === "undefined") return null;
  var I = SpModes._int, AU = SpModes.AU, PI = Math.PI, BR = SpPhys.R, HW = SpPhys.HW, GH = SpPhys.GH;
  /* unidades del motor (0..100) a metros: 0,5 m a lo largo y 0,4 m a lo ancho; la línea de gol en x = 97 */
  var UX = 0.5, UZ = 0.4, GOALX = 97;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function tt(s, p) { return typeof tr === "function" ? tr(s, p) : String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? p[k] : m; }); }
  function red() { try { return Anim.reduced(); } catch (e) { return false; } }
  function hap(k) { try { Anim.haptic(k); } catch (e) {} }
  function toM(p) { return [(GOALX - p[0]) * UX, (50 - p[1]) * UZ]; }
  function toJ(x, z) { return [GOALX - x / UX, 50 - z / UZ]; }
  function ok() { try { return !window.__JMH_OFF && SpModes.enabled() && SP3.supported(); } catch (e) { return false; } }
  var SKINS = ["#f2c09a", "#c88a62", "#8a5a34", "#5a3a20", "#e0ac84"];
  function teamKit(i) {
    var c = I.colsNow();
    return {shirt: c[0], shorts: c[1] || "#f2f2f2", socks: c[0], trim: c[1], num: [7, 10, 11, 8, 9, 6][i % 6], skin: SKINS[(i * 3 + 1) % 5], hair: ["#1a1410", "#3a2414", "#c9a35a", "#0d0d0d"][i % 4], hairStyle: (i * 2) % 5, boots: "#141414"};
  }
  function rivalKits() {
    var c = I.colsNow(), alt = [["#2a5bd7", "#111827"], ["#f4f4f0", "#1f2a44"], ["#111111", "#f2f2f2"], ["#e2c23a", "#1b3a8a"]], pick = alt[0];
    for (var i = 0; i < alt.length; i++) if (alt[i][0].toLowerCase() !== String(c[0]).toLowerCase()) { pick = alt[i]; break; }
    return function (i) { return {shirt: pick[0], shorts: pick[1], socks: pick[0], num: [4, 5, 3, 2, 6][i % 5], skin: SKINS[(i * 2) % 5], hair: "#1a1410", hairStyle: (i + 1) % 5, boots: "#141414"}; };
  }
  /* suaviza y reparte un trazo en puntos equidistantes */
  function chaikin(pts, n) {
    for (var it = 0; it < n; it++) {
      if (pts.length < 3) return pts;
      var out = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      out.push(pts[pts.length - 1]); pts = out;
    }
    return pts;
  }
  function plen(pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  function resample(pts, n) {
    var L = plen(pts), out = [pts[0]], step = L / (n - 1), acc = 0, i = 1, prev = pts[0];
    if (!L) return pts.slice();
    while (out.length < n - 1 && i < pts.length) {
      var d = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]);
      if (acc + d >= step) { var k = (step - acc) / d; prev = [prev[0] + (pts[i][0] - prev[0]) * k, prev[1] + (pts[i][1] - prev[1]) * k]; out.push(prev); acc = 0; }
      else { acc += d; prev = pts[i]; i++; }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function mount(host, o) {
    var S3;
    try { S3 = SP3.create(host, {ctx: I.ctxFor(o.press == null ? 0.45 : o.press), cols: I.colsNow(), tod: I.todNow(), pet: null}); } catch (e) { return null; }
    host.classList.add("sp3-host", "jmh-host");
    var E = S3.E, rk = rivalKits(), V = {S3: S3, busy: false, moves: [], trail: null, alive: true, aim: null};
    var st0 = o.get();
    var mineKit = o.mine ? I.myKit() : teamKit(0);
    V.holder = S3.man(Object.assign({}, mineKit));
    V.mates = st0.mates.map(function (m, i) { return S3.man(teamKit(i + 1)); });
    V.rivals = st0.rivals.map(function (r, i) { return S3.man(rk(i)); });
    V.gk = S3.man(Object.assign(I.rivalKit(true), {num: 1}));
    V.ex = [];
    function allMen() { return [V.holder].concat(V.mates, V.rivals, V.ex); }
    /* ---------- posiciones (metros del juego: x hacia la portería, z a lo ancho) ---------- */
    function gpos(man) { return [SP3.GLX - man.x, -man.z]; }
    function ballAt(x, z, y) { var p = S3.L(x, y == null ? BR : y, z); S3.ball.x = p[0]; S3.ball.y = p[1]; S3.ball.z = p[2]; }
    function ballG() { return [SP3.GLX - S3.ball.x, -S3.ball.z]; }
    /* el poseedor se coloca medio metro detrás del balón, mirando a la portería */
    function holderSpot(bm) { return [bm[0] + 0.5, bm[1] + 0.06]; }
    function faceGoal(man) { man.yaw = PI / 2; }
    function faceBall(man) { S3.faceTo(man, S3.ball.x, S3.ball.z); }
    function moveTo(man, x, z, dur, face, run) {
      man.gx = x; man.gz = z;
      var p = S3.L(x, 0, z);
      V.moves = V.moves.filter(function (m) { return m.man !== man; });
      if (!dur || red()) { man.x = p[0]; man.z = p[2]; if (face === "ball") faceBall(man); else if (face) faceGoal(man); return; }
      if (Math.hypot(p[0] - man.x, p[2] - man.z) < 0.08) { if (face === "ball") faceBall(man); else if (face) faceGoal(man); return; }
      V.moves.push({man: man, x0: man.x, z0: man.z, x1: p[0], z1: p[2], t: 0, d: dur, face: face});
      var dist = Math.hypot(p[0] - man.x, p[2] - man.z), speed = dist / dur;
      man.play(run === false ? "walk" : "run", {cad: cl(6 + speed * 1.1, 7, 13), amp: cl(0.35 + speed * 0.06, 0.4, 0.85)});
    }
    /* coloca a todos según el estado del motor (con dur, corriendo a la vez) */
    function layout(st, dur, skips) {
      var bm = toM(st.ball), hs = holderSpot(bm), no = function (m) { return skips && skips.indexOf(m) >= 0; };
      if (!no(V.holder)) moveTo(V.holder, hs[0], hs[1], dur, true);
      st.mates.forEach(function (m, i) { var man = V.mates[i]; if (!man || man === V.holder || no(man)) return; var p = toM(m.p); moveTo(man, p[0], p[1], dur, true); });
      st.rivals.forEach(function (r, i) { var man = V.rivals[i]; if (!man || no(man)) return; var p = toM(r); moveTo(man, p[0], p[1], dur, "ball"); });
      V.ex.forEach(function (man) { if (!no(man) && man !== V.holder) moveTo(man, Math.max(5, man.gx - 4.5), man.gz * 0.8, dur, true); });
      if (!dur) ballAt(bm[0], bm[1]);
    }
    S3.place(V.gk, 0.6, 0, false); V.gk.play("gkready", {amp: 0.05});
    layout(st0, 0);
    V.rivals.forEach(faceBall);
    /* ---------- cámara: alta y detrás, encuadrando el balón, los compañeros libres y los rivales cercanos ---------- */
    function frame(st) {
      var b = toM(st.ball), pts = [b];
      st.mates.forEach(function (m) { if (m.open) { var p = toM(m.p); if (p[0] < b[0] + 5 && Math.hypot(p[0] - b[0], p[1] - b[1]) < 24) pts.push(p); } });
      st.rivals.forEach(function (r) { var p = toM(r); if (p[0] < b[0] + 3 && Math.hypot(p[0] - b[0], p[1] - b[1]) < 15) pts.push(p); });
      if (b[0] < 24) pts.push([0, 0]);            /* cerca del área: que se vea la portería */
      var minx = 1e9, minz = 1e9, maxz = -1e9;
      pts.forEach(function (p) { minx = Math.min(minx, p[0]); minz = Math.min(minz, p[1]); maxz = Math.max(maxz, p[1]); });
      var depth = cl(b[0] - minx, 9, 24), width = cl(maxz - minz, 8, 22), span = Math.max(depth, width * 1.25);
      var cz = (minz + maxz) / 2 * 0.45 + b[1] * 0.55, tx = b[0] - depth * 0.5;
      return {eye: [b[0] + 5 + span * 0.3, 5 + span * 0.5, cz * 0.7 + b[1] * 0.3], tgt: [tx, 0, cz], fov: 50};
    }
    function camFor(st, dur) { var f = frame(st); S3.camTo(f.eye, f.tgt, f.fov, dur); }
    if (!red()) {
      var f0 = frame(st0); S3.camTo([f0.eye[0] + 18, f0.eye[1] + 14, f0.eye[2] - 8], f0.tgt, 54, 0);
      setTimeout(function () { if (V.alive) camFor(o.get(), 1.1); }, 80);
    } else camFor(st0, 0);
    S3.crowdT = S3.crowdBase * 0.45; try { AU.crowd(0.3); } catch (e) {}

    /* ---------- capa de dibujo ---------- */
    var cv = document.createElement("canvas"); cv.className = "jmh-draw"; host.appendChild(cv);
    var g = cv.getContext("2d"), dpr = 1;
    var tip = document.createElement("div"); tip.className = "jmh-tip"; tip.setAttribute("role", "status"); tip.setAttribute("aria-live", "polite"); host.appendChild(tip);
    var big = document.createElement("div"); big.className = "jmh-big"; big.setAttribute("aria-hidden", "true"); host.appendChild(big);
    /* cartel de entrada: el nombre de la jugada pasa por delante al empezar */
    var intro = document.createElement("div"); intro.className = "jmh-intro"; intro.setAttribute("aria-hidden", "true");
    if (o.intro && !red()) { intro.innerHTML = "<small>" + (o.intro.kicker || "") + "</small><b>" + (o.intro.title || "") + "</b>"; host.appendChild(intro); setTimeout(function () { intro.classList.add("on"); try { AU.fx("whistle"); } catch (e) {} }, 60); setTimeout(function () { intro.classList.remove("on"); intro.classList.add("off"); }, 1500); }
    function fit() { var r = host.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); }
    fit();
    function local(p) { var r = cv.getBoundingClientRect(); return [(p.x - r.left) * dpr, (p.y - r.top) * dpr]; }
    function projL(x, y, z) { return local(S3.project(x, y, z)); }       /* x, z del juego */
    function say(msg, ms) { tip.textContent = msg || ""; tip.classList.toggle("on", !!msg); clearTimeout(V.tipT); if (msg && ms) V.tipT = setTimeout(function () { tip.classList.remove("on"); }, ms); }
    function shout(txt, cls) { big.textContent = txt; big.className = "jmh-big on " + (cls || ""); clearTimeout(V.bigT); V.bigT = setTimeout(function () { big.className = "jmh-big"; }, 1600); }
    V.say = say;
    var COL = {pass: [91, 227, 122], shot: [255, 210, 63], none: [255, 255, 255]};
    function strokePath(pts, alpha, w, kind, dash) {
      if (pts.length < 2) return;
      var c = COL[kind || "none"], rgb = c[0] + "," + c[1] + "," + c[2];
      g.save(); g.lineCap = "round"; g.lineJoin = "round";
      if (dash) { g.setLineDash([10 * dpr, 12 * dpr]); g.lineDashOffset = -clock * 40 * dpr; }
      g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      g.strokeStyle = "rgba(0,0,0," + 0.28 * alpha + ")"; g.lineWidth = (w + 6) * dpr; g.stroke();
      g.strokeStyle = "rgba(" + rgb + "," + 0.95 * alpha + ")"; g.lineWidth = w * dpr; g.stroke();
      g.setLineDash([]);
      var a = pts[Math.max(0, pts.length - 3)], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), s = (w + 11) * dpr;
      g.fillStyle = "rgba(" + rgb + "," + alpha + ")"; g.beginPath(); g.moveTo(b[0] + Math.cos(ang) * s * 0.7, b[1] + Math.sin(ang) * s * 0.7);
      g.lineTo(b[0] + Math.cos(ang + 2.45) * s, b[1] + Math.sin(ang + 2.45) * s); g.lineTo(b[0] + Math.cos(ang - 2.45) * s, b[1] + Math.sin(ang - 2.45) * s); g.closePath(); g.fill();
      g.restore();
    }
    /* anillo en el césped bajo un jugador (tamaño en metros, en perspectiva) */
    function ring(x, z, rgb, t, hot) {
      var n = 20, r = hot ? 0.95 : 0.7, pul = 1 + 0.08 * Math.sin(t * 5);
      if (hot && V.snapT != null) { var sk = cl((clock - V.snapT) / 0.2, 0, 1); pul *= 1 + 0.6 * (1 - sk) * (1 - sk); }
      g.beginPath();
      for (var i = 0; i <= n; i++) { var a = i / n * PI * 2, p = projL(x + Math.cos(a) * r * pul, 0.03, z + Math.sin(a) * r * pul); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
      g.strokeStyle = "rgba(" + rgb + "," + (hot ? 1 : 0.8) + ")"; g.lineWidth = (hot ? 4 : 2.5) * dpr; g.stroke();
      if (hot) { g.fillStyle = "rgba(" + rgb + ",.22)"; g.fill(); }
    }
    function marker(x, z, rgb, t) {      /* flecha sobre la cabeza del receptor */
      var p = projL(x, 2.35 + 0.12 * Math.sin(t * 6), z), s = 8 * dpr;
      g.fillStyle = "rgba(" + rgb + ",1)"; g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2 * dpr;
      g.beginPath(); g.moveTo(p[0], p[1] + s); g.lineTo(p[0] - s, p[1] - s * 0.4); g.lineTo(p[0] + s, p[1] - s * 0.4); g.closePath(); g.fill(); g.stroke();
    }
    var flash = document.createElement("div"); flash.className = "jmh-flash"; host.appendChild(flash);
    function flashOn(col) { flash.style.background = col || "#fff"; flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on"); }
    /* textos que flotan sobre el campo (¡Pase!, ¡Al hueco!...) */
    V.floats = [];
    var FD = (function () { try { return getComputedStyle(document.documentElement).getPropertyValue("--f-disp").trim() || "sans-serif"; } catch (e) { return "sans-serif"; } })();
    function floatAt(x, y, z, txt, rgb, big2) { V.floats.push({x: x, y: y, z: z, txt: txt, rgb: rgb || "255,255,255", t: 0, d: red() ? 0.8 : 1.15, big: big2}); }
    function drawFloats(dt) {
      V.floats = V.floats.filter(function (f) {
        f.t += dt; var k = f.t / f.d; if (k >= 1) return false;
        var p = projL(f.x, f.y + k * 1.1, f.z), pop = k < 0.18 ? 0.6 + 0.6 * Math.sin(k / 0.18 * PI / 2) - (k > 0.12 ? (k - 0.12) * 2 : 0) : 1, a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        var fs = (f.big ? 26 : 17) * dpr * pop;
        g.save(); g.font = "800 " + fs + "px " + FD; g.textAlign = "center"; g.textBaseline = "middle";
        var hw = g.measureText(f.txt).width / 2 + 8 * dpr; p[0] = cl(p[0], hw, cv.width - hw);
        g.lineWidth = 5 * dpr; g.strokeStyle = "rgba(0,0,0," + 0.55 * a + ")"; g.strokeText(f.txt, p[0], p[1]);
        g.fillStyle = "rgba(" + f.rgb + "," + a + ")"; g.fillText(f.txt, p[0], p[1]); g.restore();
        return true;
      });
    }
    /* estela del balón cuando va rápido */
    V.btrail = [];
    function drawBallTrail(dt) {
      if (V.btrail.length < 2) return;
      V.btrail.forEach(function (q) { q.a -= dt * 3.2; }); V.btrail = V.btrail.filter(function (q) { return q.a > 0; });
      for (var i = 1; i < V.btrail.length; i++) {
        var a = V.btrail[i - 1], b = V.btrail[i], pa = projL(a.x, a.y, a.z), pb = projL(b.x, b.y, b.z);
        g.strokeStyle = "rgba(255,255,255," + 0.55 * b.a + ")"; g.lineCap = "round"; g.lineWidth = (1.5 + 4.5 * (i / V.btrail.length)) * dpr * b.a;
        g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.stroke();
      }
    }
    var clock = 0;
    S3.extra.push(function (E2, dt) {
      clock += dt;
      if (cv.width !== Math.round(cv.getBoundingClientRect().width * dpr)) fit();
      g.clearRect(0, 0, cv.width, cv.height);
      var st = o.get(); if (!st) return;
      V.moves = V.moves.filter(function (m) {
        m.t += dt; var k = cl(m.t / m.d, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        m.man.x = lerp(m.x0, m.x1, e); m.man.z = lerp(m.z0, m.z1, e);
        if (k < 0.92) m.man.yaw = Math.atan2(m.x1 - m.x0, m.z1 - m.z0);
        if (k >= 1) { if (m.face === "ball") faceBall(m.man); else if (m.face) faceGoal(m.man); if (m.man.clip && (m.man.clip.n === "run" || m.man.clip.n === "walk")) m.man.play("idle"); return false; }
        return true;
      });
      /* los rivales siguen el balón con la mirada */
      if (!V.busy) V.rivals.forEach(function (r) { if (!V.moves.some(function (m) { return m.man === r; })) { var want = Math.atan2(S3.ball.x - r.x, S3.ball.z - r.z), d = want - r.yaw; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; r.yaw += d * Math.min(1, dt * 4); } });
      if (!st.done && !V.busy) {
        var aim = V.draw && V.draw.aim;
        st.mates.forEach(function (m, i) { var man = V.mates[i]; if (!man || !m.open || man === V.holder) return; var p = gpos(man), hot = aim && aim.kind === "pass" && aim.i === i; ring(p[0], p[1], "91,227,122", clock + i, hot); if (hot) marker(p[0], p[1], "91,227,122", clock); });
        var bm = ballG(); ring(bm[0], bm[1], "255,210,63", clock * 1.3, false);
        if (aim && aim.kind === "shot") { var gl = projL(0, GH + 0.6, aim.z || 0); g.fillStyle = "rgba(255,210,63,.95)"; g.font = "800 " + 13 * dpr + "px sans-serif"; g.textAlign = "center"; g.fillText("▼", gl[0], gl[1]); }
        if (V.ghost && !V.draw) ghost();
      }
      /* el balón se ve siempre: punto blanco con contorno encima del balón real */
      (function () { var bg = ballG(), c = projL(bg[0], S3.ball.y, bg[1]), e = projL(bg[0], S3.ball.y + BR * 2, bg[1]), r = Math.max(3.2 * dpr, Math.abs(c[1] - e[1]) * 0.6);
        if (r < 7 * dpr) { var sh = projL(bg[0], 0.01, bg[1]); g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(sh[0], sh[1], r * 1.2, r * 0.5, 0, 0, PI * 2); g.fill();
          g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 1.5 * dpr; g.beginPath(); g.arc(c[0], c[1], r, 0, PI * 2); g.fill(); g.stroke(); } })();
      drawBallTrail(dt);
      if (V.draw && V.draw.pts.length > 1) {
        var lp = V.draw.pts.map(local), kind = V.draw.aim ? V.draw.aim.kind : "none";
        strokePath(lp, 1, 7, kind);
        var tp = lp[lp.length - 1], rgb2 = COL[kind].join(","); g.fillStyle = "rgba(" + rgb2 + ",.35)"; g.beginPath(); g.arc(tp[0], tp[1], (14 + 3 * Math.sin(clock * 12)) * dpr, 0, PI * 2); g.fill();
      }
      drawFloats(dt);
      if (V.trail) { V.trail.a -= dt * (V.trail.w ? 0.8 : 1.6); if (V.trail.a <= 0) V.trail = null; else strokePath(V.trail.w ? V.trail.w.map(function (q) { return projL(q[0], q[1], q[2]); }) : V.trail.pts, Math.min(1, V.trail.a), 6, V.trail.kind); }
    });
    /* ---------- pista de la primera jugada: un trazo fantasma hacia el mejor pase ---------- */
    function ghost() {
      var st = o.get(), b = ballG(), best = null;
      st.mates.forEach(function (m, i) {
        if (!m.open || V.mates[i] === V.holder) return;
        var lane = st.rivals.reduce(function (v, r) { return Math.min(v, JugadaMaestra.segDist(r, st.ball, m.p)); }, 99) - Math.abs(m.p[0] - 80) * 0.02;
        if (!best || lane > best.lane) best = {i: i, lane: lane};
      });
      if (!best) return;
      var to = gpos(V.mates[best.i]), mid = [(b[0] + to[0]) / 2, (b[1] + to[1]) / 2 + (to[0] - b[0]) * 0.18], pts = [];
      for (var i = 0; i <= 16; i++) { var t = i / 16; pts.push(projL((1 - t) * (1 - t) * b[0] + 2 * (1 - t) * t * mid[0] + t * t * to[0], 0.05, (1 - t) * (1 - t) * b[1] + 2 * (1 - t) * t * mid[1] + t * t * to[1])); }
      var k = (clock * 0.55) % 1, n = Math.max(2, Math.round(pts.length * Math.min(1, k * 1.3)));
      strokePath(pts.slice(0, n), 0.75 * (k > 0.85 ? (1 - k) / 0.15 : 1), 5, "pass", true);
      var hp = pts[n - 1]; g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.arc(hp[0], hp[1] + 14 * dpr, 11 * dpr, 0, PI * 2); g.fill();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2 * dpr; g.stroke();
    }
    V.ghost = !!o.ghost;

    /* ---------- trazo del usuario ---------- */
    function goalRect() {
      var a = S3.project(0, GH, HW), b = S3.project(0, 0, -HW);
      var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y), w = x1 - x0, h = y1 - y0;
      return {x0: x0 - w * 0.5, x1: x1 + w * 0.5, y0: y0 - h * 1.8, y1: y1 + h * 0.6};
    }
    function ground(p) { var q = E.groundAt(p.x, p.y, 0); if (!q) return null; return [SP3.GLX - q[0], -q[2]]; }
    function goalHit(p) {
      var R = E.ray(p.x, p.y); if (Math.abs(R.d[0]) < 1e-5) return null;
      var k = (SP3.GLX - R.o[0]) / R.d[0]; if (k <= 0) return null;
      return {z: -(R.o[2] + R.d[2] * k), h: R.o[1] + R.d[1] * k};
    }
    /* qué quiere hacer el trazo: tiro, pase a un compañero (el más cercano a la punta) o nada */
    function classify(end) {
      var st = o.get(), gr = goalRect(), gEnd = ground(end);
      if ((end.x > gr.x0 && end.x < gr.x1 && end.y > gr.y0 && end.y < gr.y1) || (gEnd && gEnd[0] < 2.5) || (!gEnd && end.y < gr.y1)) {
        var hit = goalHit(end) || {z: gEnd ? gEnd[1] : 0, h: 1};
        return {kind: "shot", z: hit.z, h: hit.h};
      }
      var best = null, r = cv.getBoundingClientRect();
      st.mates.forEach(function (m, i) {
        var man = V.mates[i]; if (!man || !m.open || man === V.holder) return;
        var gp = gpos(man), s = S3.project(gp[0], 0.9, gp[1]), d = Math.hypot(s.x - end.x, s.y - end.y);
        var dg = gEnd ? Math.hypot(gp[0] - gEnd[0], gp[1] - gEnd[1]) : 1e9;
        var score = Math.min(d / 70, dg / 9);
        if (score < 1 && (!best || score < best.score)) best = {kind: "pass", i: i, score: score};
      });
      return best || {kind: "none"};
    }
    function down(e) {
      var st = o.get();
      if (!V.alive || V.busy || !st || st.done) return;
      var bg0 = ballG(), bs = S3.project(bg0[0], BR, bg0[1]);
      V.draw = {id: e.pointerId, pts: [{x: bs.x, y: bs.y}, {x: e.clientX, y: e.clientY}], aim: null};
      V.ghost = false;
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      say(""); e.preventDefault();
    }
    function move(e) {
      if (!V.draw || e.pointerId !== V.draw.id) return;
      var l = V.draw.pts[V.draw.pts.length - 1];
      if (Math.hypot(e.clientX - l.x, e.clientY - l.y) > 4) {
        V.draw.pts.push({x: e.clientX, y: e.clientY});
        var prev = V.draw.aim, a = classify({x: e.clientX, y: e.clientY});
        V.draw.aim = a;
        if (a.kind === "pass" && (!prev || prev.i !== a.i)) { var mm = V.mates[a.i]; V.snapT = clock; if (mm && (!mm.clip || mm.clip.n === "idle")) mm.play("point", {side: 0.3}); hap("tap"); try { AU.fx("bounce", 0.12); } catch (e2) {} }
        if (a.kind === "shot" && (!prev || prev.kind !== "shot")) { hap("tap"); try { AU.fx("bounce", 0.18); } catch (e3) {} }
      }
      e.preventDefault();
    }
    function up(e) {
      if (!V.draw || e.pointerId !== V.draw.id) return;
      var d = V.draw; V.draw = null;
      var pts = d.pts.slice(1), scr = 0;
      for (var i = 1; i < pts.length; i++) scr += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      var helpMsg = tt("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar.");
      if (pts.length < 2 || scr < 24) { say(helpMsg, 2600); return; }
      var aim = classify(pts[pts.length - 1]);
      if (aim.kind === "none") { V.trail = {pts: d.pts.map(local), a: 0.6, kind: "none"}; say(tt("Termina el trazo en un compañero libre (anillo verde) o en la portería."), 2600); hap("bad"); return; }
      V.trail = {pts: d.pts.map(local), a: 1, kind: aim.kind};
      var path = [];
      d.pts.forEach(function (p) { var q = ground(p); if (q && q[0] > (aim.kind === "shot" ? 1.5 : -1)) path.push(q); });
      if (aim.kind === "shot") {
        var y = cl(50 - aim.z / UZ, 28.6, 71.4), b0 = ballG();
        /* el trazo se queda pintado en el mundo (césped y portería), no en la pantalla */
        V.trail = {w: [[b0[0], 0.05, b0[1]]].concat(path.filter(function (q) { return q[0] > 2 && q[0] < b0[0] - 0.5; }).map(function (q, i, arr) { return [q[0], 0.05 + Math.max(0, aim.h) * Math.pow((i + 1) / (arr.length + 1), 1.4), q[1]]; }), [[0, cl(aim.h, 0.1, 3.4), aim.z]]), a: 1.3, kind: "shot"};
        commit(96, y, path.map(function (q) { return toJ(q[0], q[1]); }), Math.max(0.1, aim.h), {z: aim.z, h: aim.h, path: path});
      } else {
        /* el trazo se dobla con suavidad para acabar en los pies del compañero elegido */
        var st = o.get(), mp = st.mates[aim.i].p, to = toM(mp), bent = bendTo(path, ballG(), to);
        V.trail = {w: resample(chaikin(bent, 2), 40).map(function (q) { return [q[0], 0.05, q[1]]; }), a: 1.3, kind: "pass"};
        commit(Math.min(mp[0], 83), mp[1], bent.map(function (q) { return toJ(q[0], q[1]); }), null, {path: bent, mate: aim.i});
      }
    }
    function bendTo(path, from, to) {
      var pts = [from].concat(path.filter(function (q) { return Math.hypot(q[0] - from[0], q[1] - from[1]) > 0.6; }));
      if (pts.length < 2) return [from, to];
      var L = plen(pts), run = 0, last = pts[pts.length - 1], dx = to[0] - last[0], dz = to[1] - last[1], out = [pts[0]];
      for (var i = 1; i < pts.length; i++) { run += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); var t = run / (L || 1), w = t * t * (3 - 2 * t); out.push([pts[i][0] + dx * w, pts[i][1] + dz * w]); }
      out[out.length - 1] = to.slice();
      return out;
    }
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", function () { V.draw = null; });

    /* ---------- resolución + animación ---------- */
    function commit(x, y, pathJ, h, aim) {
      var before = JSON.parse(JSON.stringify(o.get()));
      var r = o.resolve(x, y, pathJ.length > 1 ? pathJ : null, h);
      if (!r || !r.ok) { V.trail = null; say(tt((r && r.msg) || "Busca un espacio o apunta a un compañero o compañera."), 2600); hap("bad"); return r; }
      play(before, r, aim || {});
      return r;
    }
    function play(before, r, aim) {
      var st = o.get(), last = st.log[st.log.length - 1];
      V.busy = true;
      var fin = function () { V.busy = false; if (V.alive && o.after) o.after(r); };
      if (last && last.k === "shot") shotAnim(before, st, r, last, aim, fin);
      else passAnim(before, st, r, last, aim, fin);
    }
    /* el balón recorre una ruta ([x, z] en metros) con altura h(k) */
    function fly(route, dur, hfn, done, onStep) {
      var pts = resample(chaikin(route, 3), 60), t = 0;
      var prev = S3.onFrame;
      S3.onFrame = function (dt) {
        if (prev) prev(dt);
        t += dt; var k = cl(t / dur, 0, 1), f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
        var x = lerp(pts[i][0], pts[i + 1][0], u), z = lerp(pts[i][1], pts[i + 1][1], u), y = hfn(k);
        var px = S3.ball.x, pz = S3.ball.z;
        ballAt(x, z, y);
        var vx = (S3.ball.x - px) / Math.max(dt, 1e-3), vz = (S3.ball.z - pz) / Math.max(dt, 1e-3);
        S3.ballSpin(vz / BR * 0.6, 0, -vx / BR * 0.6, dt);
        if (Math.hypot(vx, vz) > 9) { V.btrail.push({x: x, y: y, z: z, a: 1}); if (V.btrail.length > 14) V.btrail.shift(); }
        if (onStep) onStep(k, x, z, y, dt);
        if (k >= 1) { S3.onFrame = prev; if (done) done(); }
      };
      return plen(pts);
    }
    function routeFrom(start, mid, end) {
      var r = [start]; (mid || []).forEach(function (q) { var l = r[r.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.8) r.push(q); });
      if (Math.hypot(end[0] - r[r.length - 1][0], end[1] - r[r.length - 1][1]) > 0.05) r.push(end); else r[r.length - 1] = end;
      return r;
    }
    function kickThen(man, type, then) {
      faceGoal(man);
      var fired = false, go = function () { if (fired) return; fired = true; try { AU.fx(type === "laces" ? "kick" : "kickSoft"); } catch (e) {} S3.ball.sq = 1; S3.fx("grass", S3.ball.x, 0, S3.ball.z, 6); hap("tap"); then(); };
      man.play("kick", {type: type || "inside", d: red() ? 0.28 : 0.42, ev: {"0.55": go}});
      setTimeout(go, red() ? 200 : 420);    /* por si la animación no llega a dispararlo */
    }
    function passAnim(before, st, r, last, aim, fin) {
      var start = toM(before.ball), recvI = last ? last.mate : -1, recv = V.mates[recvI], dest = recvI >= 0 ? toM(before.mates[recvI].p) : toM(st.ball);
      var drawn = (aim.path && aim.path.length > 1) ? aim.path.slice(1, -1) : [];
      var full = resample(chaikin(routeFrom(start, drawn, dest), 3), 60), route = full;
      var cutter = null;
      if (!r.completed) {
        var cut = toM(st.ball), bi = 0, bd = 1e9;
        full.forEach(function (q, i) { var dd = Math.hypot(q[0] - cut[0], q[1] - cut[1]); if (dd < bd) { bd = dd; bi = i; } });
        route = full.slice(0, Math.max(2, bi + 1));
        var cm = route[route.length - 1], cd = 1e9;
        before.rivals.forEach(function (rv, i) { var p = toM(rv), dd = Math.hypot(p[0] - cm[0], p[1] - cm[1]); if (dd < cd) { cd = dd; cutter = V.rivals[i]; } });
      }
      var L = plen(route), dur = cl(L / (red() ? 45 : 21), 0.38, 1.5), loft = L > 20 ? Math.min(4.5, L * 0.13) : Math.min(0.5, L * 0.02);
      if (recv) { faceBall(recv); recv.play("point", {side: 0.2}); }
      var passer = V.holder;
      var laneM = before.rivals.reduce(function (v, rv) { var p = toM(rv), best = 1e9; full.forEach(function (q) { best = Math.min(best, Math.hypot(q[0] - p[0], q[1] - p[1])); }); return Math.min(v, best); }, 99);
      kickThen(passer, "inside", function () {
        S3.kick(0.08);
        /* todos se mueven a la vez que el balón: el que pasa se desmarca, los demás ocupan sus sitios */
        if (r.completed && recv) { if (V.ex.indexOf(passer) < 0) V.ex.push(passer); V.holder = recv; layout(st, dur * 1.05, [recv]); }
        else layout(st, dur * 1.05, [passer, cutter]);
        if (cutter) { var cp = route[route.length - 1]; moveTo(cutter, cp[0] - 0.2, cp[1], dur * 0.9, "ball"); }
        fly(route, dur, function (k) { return BR + loft * 4 * k * (1 - k); }, function () {
          if (r.completed && recv) {
            S3.ball.sq = 0.6; try { AU.fx("bounce", 0.35); } catch (e) {}
            S3.fx("grass", S3.ball.x, 0, S3.ball.z, 8); hap("ok");
            floatAt(dest[0], 2.4, dest[1], laneM > 3.2 ? tt("¡Al hueco!") : L > 22 ? tt("¡Pase largo!") : tt("¡Pase!"), "91,227,122", laneM > 3.2);
            var hs = holderSpot(dest); moveTo(recv, hs[0], hs[1], 0.25, true, false);
            ballAt(dest[0], dest[1]);
            camFor(st, 0.75);
            setTimeout(fin, red() ? 60 : 520);
          } else {
            if (cutter) cutter.play("slide");
            try { AU.fx("wall"); AU.fx("ooh"); } catch (e) {}
            shout(tt("¡Cortado!"), "bad"); hap("bad"); S3.kick(0.3); S3.hitstop(80); flashOn("rgba(255,60,60,.35)");
            var cp2 = route[route.length - 1];
            fly([cp2, [cp2[0] + 2.5, cp2[1] + (cp2[1] > 0 ? 1.5 : -1.5)]], 0.45, function (k) { return BR + 0.4 * 4 * k * (1 - k); }, null);
            setTimeout(fin, red() ? 80 : 1250);
          }
        });
      });
    }
    function shotAnim(before, st, r, last, aim, fin) {
      var how = r.outcome || last.how || r.how || (r.scored ? "goal" : "save");
      var start = toM(before.ball), z = aim.z != null ? aim.z : (50 - last.to[1]) * UZ, h = aim.h != null ? aim.h : 1.1, sgn = z < 0 ? -1 : 1;
      h = cl(h, 0.15, 3.6);
      if (how === "goal") { z = cl(z, -HW + 0.35, HW - 0.35); h = cl(h, 0.2, GH - 0.3); if (Math.abs(z) < 1.4) z = sgn * 1.6; }
      else if (how === "post") { z = sgn * (HW - 0.05); h = cl(h, 0.4, GH - 0.4); }
      else if (how === "bar") { h = GH - 0.02; z = cl(z, -HW + 0.6, HW - 0.6); }
      else if (how === "miss") { if (Math.abs(z) <= HW + 0.4 && h <= GH + 0.2) { if (h > 1.8) h = GH + 0.7; else z = sgn * (HW + 0.9); } }
      else if (how === "save") { z = cl(z, -HW + 0.6, HW - 0.6); h = cl(h, 0.3, 2.0); }
      var mid = (aim.path || []).slice(1).filter(function (q) { return q[0] > 2 && q[0] < start[0] - 0.5; });
      var endX = how === "goal" ? -1.4 : how === "miss" ? -3.5 : 0.3, end = [endX, z];
      var blocker = null, route;
      var full = resample(chaikin(routeFrom(start, mid, [0, z]), 3), 60);
      if (how === "block") {
        var bi = 12, bd = 1e9;
        before.rivals.forEach(function (rv, ri) { var p = toM(rv); full.forEach(function (q, i) { var dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; bi = i; blocker = V.rivals[ri]; } }); });
        route = full.slice(0, Math.max(2, bi + 1));
      } else { route = full.slice(); route.push(end); }
      var L = plen(route), dur = cl(L / (red() ? 50 : 28), 0.42, 1.25), hEnd = how === "block" ? 0.9 : h;
      var gkDir = z > 0 ? -1 : 1, gkGo = false, reach = Math.min(2.4, Math.abs(z) * 0.9 + 0.5), slowed = false;
      if (how === "goal" && Math.abs(z) > 2.6) reach = Math.max(0.6, reach - 1.1);
      var side = z > 0 ? -1 : 1;
      kickThen(V.holder, "laces", function () {
        S3.kick(0.22); V.btrail = []; V.trail = null;
        if (blocker) { var bp = route[route.length - 1]; moveTo(blocker, bp[0], bp[1], dur * 0.8, "ball"); }
        /* cámara que persigue al balón */
        S3.follow = function (c, dt) {
          var b = [S3.ball.x, S3.ball.y, S3.ball.z], want = S3.L(Math.max(11, SP3.GLX - b[0] + 7), 3 + S3.ball.y * 0.3, -b[2] * 0.6 + side * 2.4), tg = S3.L(0, 1.1, z * 0.4), a = Math.min(1, dt * 5);
          for (var q = 0; q < 3; q++) { c.eye[q] += (want[q] - c.eye[q]) * a; c.tgt[q] += (tg[q] - c.tgt[q]) * a; }
          c.fov += (44 - c.fov) * a;
        };
        S3.cam.k = 1;
        fly(route, dur, function (k) { return BR + (hEnd - BR) * Math.pow(k, 1.15) + Math.min(1.2, L * 0.03) * 4 * k * (1 - k) * (how === "block" ? 0.3 : 1); }, function () {
          S3.follow = null;
          if (how === "goal") {
            S3.net.hit(S3.ball.x, S3.ball.y, S3.ball.z, 9); try { AU.fx("net"); AU.fx("cheer"); AU.crowd(1); } catch (e) {}
            S3.kick(0.55); hap("big"); shout(tt("¡GOL!"), "good"); flashOn("rgba(255,255,255,.85)");
            S3.fx("confetti", 3, 5, 0, S3.ctx === "final" || S3.ctx === "big" ? 80 : 36);
            var c = I.celebOf(); V.holder.play(c === "silence" || c === "slide" || c === "plane" || c === "jump" || c === "flip" ? c : "arms");
            V.ex.concat(V.mates).forEach(function (m, i) { if (m !== V.holder) setTimeout(function () { m.play(i % 2 ? "jump" : "arms"); }, 200 + i * 120); });
            setTimeout(function () { V.gk.play("crouchsad"); }, 600);
            var hp = gpos(V.holder); S3.camTo([hp[0] + 4.5, 2.2, hp[1] + side * 3], [hp[0], 1.1, hp[1]], 38, 1.1);
          } else if (how === "save") {
            try { AU.fx("catch"); AU.fx("ooh"); } catch (e) {} S3.hitstop(90); S3.kick(0.3); hap("ok"); shout(tt("¡Parada!"), "bad"); flashOn("rgba(255,255,255,.25)");
            V.holder.play("headhands");
          } else if (how === "post" || how === "bar") {
            try { AU.fx("post"); AU.fx("ooh"); } catch (e) {} S3.fx("spark", S3.ball.x, S3.ball.y, S3.ball.z, 10); S3.kick(0.6); S3.hitstop(70); hap("big"); shout(tt(how === "bar" ? "¡Larguero!" : "¡Al palo!"), "bad"); flashOn("rgba(255,255,255,.4)");
            fly([[0.3, z], [6, z * 0.6 - sgn * 1.5]], 0.6, function (k) { return Math.max(BR, h * (1 - k) + 1.2 * 4 * k * (1 - k)); }, null);
            V.holder.play("punch");
          } else if (how === "miss") {
            try { AU.fx("ooh"); } catch (e) {} shout(tt("¡Fuera!"), "bad"); hap("bad"); V.holder.play("headhands");
          } else {
            if (blocker) blocker.play("wall"); try { AU.fx("wall"); AU.fx("ooh"); } catch (e) {} S3.ball.sq = 1; S3.kick(0.35); shout(tt("¡Bloqueado!"), "bad"); hap("bad");
            var e0 = route[route.length - 1];
            fly([e0, [e0[0] + 4, e0[1] + (e0[1] > 0 ? 2 : -2)]], 0.5, function (k) { return BR + 0.8 * 4 * k * (1 - k); }, null);
          }
          setTimeout(fin, red() ? 120 : 1650);
        }, function (k) {
          if (how === "goal" && !slowed && k > 0.72 && !red()) { slowed = true; S3.slow(0.32, 0.55); }
          if (!gkGo && k > (how === "goal" ? 0.45 : 0.3) && how !== "block") {
            gkGo = true; try { AU.fx("dive"); } catch (e) {}
            if (Math.abs(z) < 1.1 && how !== "goal") V.gk.play(h > 1.7 ? "gkjump" : "gkstay", {h: h, d: dur * 0.5});
            else V.gk.play("dive", {dir: gkDir, h: h, reach: reach, d: dur * 0.55, done: function () { V.gk.play("land", {dir: gkDir, h: h, reach: reach}); }});
          }
        });
      });
    }
    /* acción sin trazo (botones accesibles): pase directo o tiro a la esquina más limpia, con la misma animación */
    V.act = function (kind, i) {
      var st = o.get(); if (!st || st.done || V.busy) return null;
      V.ghost = false;
      if (kind === "pass") { var m = st.mates[+i]; if (!m || !m.open) return null; return commit(Math.min(m.p[0], 83), m.p[1], [], null, {path: [], mate: +i}); }
      var best = null;
      [[44, 1.7], [56, 1.7], [45, 0.6], [55, 0.6]].forEach(function (c) {
        var lane = st.rivals.reduce(function (v, r) { return Math.min(v, JugadaMaestra.segDist(r, st.ball, [96, c[0]])); }, 99);
        if (!best || lane > best.lane + 0.5) best = {y: c[0], h: c[1], lane: lane};
      });
      return commit(96, best.y, [], best.h, {z: (50 - best.y) * UZ, h: best.h, path: []});
    };
    V.busy0 = function () { return V.busy; };
    V.dispose = function () { V.alive = false; clearTimeout(V.tipT); clearTimeout(V.bigT); S3.follow = null; try { S3.dispose(); } catch (e) {} [cv, tip, big, flash, intro].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); host.classList.remove("sp3-host", "jmh-host"); };
    S3.start();
    api.last = V;
    return V;
  }
  /* estilos de la capa */
  (function css() {
    if (typeof document === "undefined") return;
    var s = document.createElement("style"); s.id = "jmh-css";
    s.textContent = ".jmh-host{position:relative;overflow:hidden;touch-action:none;background:#0a1410}" +
      ".jmh-host .sp3-cv{position:absolute;inset:0;width:100%;height:100%;display:block}" +
      ".jmh-draw{position:absolute;inset:0;width:100%;height:100%;z-index:2;touch-action:none;cursor:crosshair}" +
      ".jmh-tip{position:absolute;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(8px);max-width:88%;padding:8px 14px;border-radius:999px;background:rgba(6,12,14,.82);color:#fff;font:700 var(--fs-sm,14px)/1.3 var(--f-body,sans-serif);text-align:center;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}" +
      ".jmh-tip.on{opacity:1;transform:translateX(-50%) translateY(0)}" +
      ".jmh-big{position:absolute;left:0;right:0;top:34%;text-align:center;font:800 clamp(38px,12vw,84px)/1 var(--f-disp,sans-serif);color:#fff;text-shadow:0 5px 0 #000,0 0 24px rgba(0,0,0,.5);opacity:0;transform:scale(.6);transition:opacity .18s,transform .25s cubic-bezier(.2,1.6,.4,1);pointer-events:none;z-index:3;letter-spacing:.02em}" +
      ".jmh-big.on{opacity:1;transform:scale(1)}.jmh-big.good{color:#ffd23f}.jmh-big.bad{color:#fff}" +
      ".jmh-big.on.good{animation:jmhPulse .5s ease-out .2s 2}@keyframes jmhPulse{50%{transform:scale(1.12)}}" +
      ".jmh-flash{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0}.jmh-flash.on{animation:jmhFlash .45s ease-out}@keyframes jmhFlash{0%{opacity:1}100%{opacity:0}}" +
      ".jmh-intro{position:absolute;left:0;right:0;top:40%;z-index:3;pointer-events:none;text-align:center;color:#fff;transform:translateX(110%);transition:transform .38s cubic-bezier(.2,1.1,.3,1)}" +
      ".jmh-intro.on{transform:none}.jmh-intro.off{transform:translateX(-110%);transition:transform .3s ease-in}" +
      ".jmh-intro small{display:inline-block;padding:4px 12px;border-radius:999px;background:#ffd23f;color:#111;font:800 12px/1.2 var(--f-body,sans-serif);letter-spacing:.08em;text-transform:uppercase}" +
      ".jmh-intro b{display:block;margin-top:8px;padding:10px 0;background:linear-gradient(90deg,transparent,rgba(0,0,0,.65) 15%,rgba(0,0,0,.65) 85%,transparent);font:800 clamp(26px,8vw,44px)/1.05 var(--f-disp,sans-serif);text-transform:uppercase;text-shadow:0 3px 0 #000}" +
      "@media (prefers-reduced-motion:reduce){.jmh-big,.jmh-tip,.jmh-intro{transition:none;animation:none}.jmh-flash.on{animation:none}}";
    (document.head || document.documentElement).appendChild(s);
  })();
  var api = {ok: ok, mount: mount, toM: toM, toJ: toJ, last: null};
  return api;
})();
