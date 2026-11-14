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
    var E = S3.E, rk = rivalKits(), V = {S3: S3, busy: false, moves: [], trail: null, flight: null, alive: true};
    var st0 = o.get();
    var mineKit = o.mine ? I.myKit() : teamKit(0);
    V.holder = S3.man(Object.assign({}, mineKit, {foot: mineKit.foot}));
    V.mates = st0.mates.map(function (m, i) { return S3.man(teamKit(i + 1)); });
    V.rivals = st0.rivals.map(function (r, i) { return S3.man(rk(i)); });
    V.gk = S3.man(Object.assign(I.rivalKit(true), {num: 1}));
    V.ex = [];
    /* coloca a todos según el estado del motor */
    function holderSpot(b) { var m = toM(b); return [m[0] + 0.42, m[1] + 0.08]; }
    function layout(st, dur) {
      var b = toM(st.ball), hs = holderSpot(st.ball);
      moveTo(V.holder, hs[0], hs[1], dur, true);
      st.mates.forEach(function (m, i) { var man = V.mates[i]; if (!man || man === V.holder) return; var p = toM(m.p); moveTo(man, p[0], p[1], dur, true); });
      st.rivals.forEach(function (r, i) { var man = V.rivals[i]; if (!man) return; var p = toM(r); moveTo(man, p[0], p[1], dur, "ball"); });
      V.ex.forEach(function (man, i) { moveTo(man, Math.max(4, man.gx - 4), man.gz * 0.85, dur, true); });
      if (!dur) { S3.ball.x = b[0]; S3.ball.y = BR; S3.ball.z = b[1]; }
    }
    function moveTo(man, x, z, dur, face) {
      man.gx = x; man.gz = z;
      var p = S3.L(x, 0, z);
      if (!dur || red()) { man.x = p[0]; man.z = p[2]; faceMan(man, face); return; }
      V.moves = V.moves.filter(function (m) { return m.man !== man; });
      if (Math.hypot(p[0] - man.x, p[2] - man.z) < 0.05) { faceMan(man, face); return; }
      V.moves.push({man: man, x0: man.x, z0: man.z, x1: p[0], z1: p[2], t: 0, d: dur, face: face});
      man.play("run", {cad: 10});
    }
    function faceMan(man, face) {
      if (face === "ball") S3.faceTo(man, S3.ball.x, S3.ball.z);
      else if (face === true) man.yaw = PI / 2;
    }
    S3.place(V.gk, 0.5, 0, false); V.gk.play("gkready", {amp: 0.05});
    V.holder.gx = 0; V.holder.gz = 0;
    layout(st0, 0);
    V.holder.play("idle"); V.mates.forEach(function (m) { m.play("idle"); }); V.rivals.forEach(function (m) { m.play("gkready", {amp: 0.02, sway: 1.5}); });
    /* cámara: detrás y por encima del balón, mirando a la portería */
    function camFor(b, dur) {
      var m = toM(b), x = m[0], z = m[1];
      S3.camTo([x + 10.5, 7.6, z * 0.6], [Math.max(-1, x - 11), 0.4, z * 0.4], 46, dur);
    }
    if (!red()) { var m0 = toM(st0.ball); S3.camTo([m0[0] + 26, 18, m0[1] * 0.4 - 6], [m0[0] * 0.5, 0, 0], 50, 0); setTimeout(function () { if (V.alive) camFor(o.get().ball, 1.4); }, 120); }
    else camFor(st0.ball, 0);
    S3.crowdT = S3.crowdBase * 0.45; try { AU.crowd(0.3); } catch (e) {}

    /* ---------- capa de dibujo (trazo, anillos de los receptores, avisos) ---------- */
    var cv = document.createElement("canvas"); cv.className = "jmh-draw"; host.appendChild(cv);
    var g = cv.getContext("2d"), dpr = 1;
    var tip = document.createElement("div"); tip.className = "jmh-tip"; tip.setAttribute("role", "status"); tip.setAttribute("aria-live", "polite"); host.appendChild(tip);
    var big = document.createElement("div"); big.className = "jmh-big"; big.setAttribute("aria-hidden", "true"); host.appendChild(big);
    function fit() { var r = host.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); }
    fit();
    function local(p) { var r = cv.getBoundingClientRect(); return [(p.x - r.left) * dpr, (p.y - r.top) * dpr]; }
    function proj(x, y, z) { return local(S3.project(x, y, z)); }
    function say(msg, ms) { tip.textContent = msg || ""; tip.classList.toggle("on", !!msg); clearTimeout(V.tipT); if (msg && ms) V.tipT = setTimeout(function () { tip.classList.remove("on"); }, ms); }
    function shout(txt, cls) { big.textContent = txt; big.className = "jmh-big on " + (cls || ""); clearTimeout(V.bigT); V.bigT = setTimeout(function () { big.className = "jmh-big"; }, 1700); }
    V.say = say;
    function strokePath(pts, alpha, w) {
      if (pts.length < 2) return;
      g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = "rgba(255,206,64," + 0.45 * alpha + ")"; g.lineWidth = (w + 8) * dpr; g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
      g.strokeStyle = "rgba(255,255,255," + 0.95 * alpha + ")"; g.lineWidth = w * dpr; g.stroke();
      var a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), s = (w + 10) * dpr;
      g.fillStyle = "rgba(255,255,255," + alpha + ")"; g.beginPath(); g.moveTo(b[0] + Math.cos(ang) * s * 0.6, b[1] + Math.sin(ang) * s * 0.6);
      g.lineTo(b[0] + Math.cos(ang + 2.5) * s, b[1] + Math.sin(ang + 2.5) * s); g.lineTo(b[0] + Math.cos(ang - 2.5) * s, b[1] + Math.sin(ang - 2.5) * s); g.closePath(); g.fill();
    }
    function ring(x, z, col, t) {
      var c = proj(x, 0.02, z), e = proj(x + 0.9, 0.02, z), r = Math.min(22 * dpr, Math.max(6 * dpr, Math.abs(e[1] - c[1]) * 1.4 + 8 * dpr)) * (1 + 0.12 * Math.sin(t * 5));
      g.strokeStyle = col; g.lineWidth = 3 * dpr; g.beginPath(); g.ellipse(c[0], c[1], r * 1.6, r * 0.62, 0, 0, PI * 2); g.stroke();
    }
    var clock = 0;
    S3.extra.push(function (E2, dt) {
      clock += dt;
      if (cv.width !== Math.round(cv.getBoundingClientRect().width * dpr)) fit();
      g.clearRect(0, 0, cv.width, cv.height);
      var st = o.get(); if (!st) return;
      /* movimientos en curso */
      V.moves = V.moves.filter(function (m) {
        m.t += dt; var k = cl(m.t / m.d, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        m.man.x = lerp(m.x0, m.x1, e); m.man.z = lerp(m.z0, m.z1, e);
        if (k < 1) m.man.yaw = Math.atan2(m.x1 - m.x0, m.z1 - m.z0);
        if (k >= 1) { faceMan(m.man, m.face); if (m.man.clip && m.man.clip.n === "run") m.man.play(V.rivals.indexOf(m.man) >= 0 ? "gkready" : "idle", {amp: 0.02, sway: 1.5}); return false; }
        return true;
      });
      if (!st.done && !V.busy) {
        st.mates.forEach(function (m, i) { var man = V.mates[i]; if (!man || !m.open || man === V.holder) return; var p = toM(m.p); ring(p[0], p[1], "rgba(120,235,150,.85)", clock + i); });
        var bm = toM(st.ball); ring(bm[0], bm[1], "rgba(255,210,70,.9)", clock * 1.3);
      }
      if (V.draw && V.draw.pts.length > 1) strokePath(V.draw.pts.map(function (p) { return local(p); }), 1, 7);
      if (V.trail) { V.trail.a -= dt * 0.9; if (V.trail.a <= 0) V.trail = null; else strokePath(V.trail.pts, V.trail.a, 6); }
    });

    /* ---------- trazo del usuario ---------- */
    function goalRect() {
      var a = S3.project(0, GH, HW), b = S3.project(0, 0, -HW);
      var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y), w = x1 - x0, h = y1 - y0;
      return {x0: x0 - w * 0.45, x1: x1 + w * 0.45, y0: y0 - h * 1.6, y1: y1 + h * 0.5};
    }
    function ground(p) {
      var q = E.groundAt(p.x, p.y, 0); if (!q) return null;
      return [SP3.GLX - q[0], -q[2]];
    }
    function goalHit(p) {
      var R = E.ray(p.x, p.y); if (Math.abs(R.d[0]) < 1e-5) return null;
      var k = (SP3.GLX - R.o[0]) / R.d[0]; if (k <= 0) return null;
      return {z: -(R.o[2] + R.d[2] * k), h: R.o[1] + R.d[1] * k};
    }
    function down(e) {
      var st = o.get();
      if (!V.alive || V.busy || !st || st.done) return;
      var bs = S3.project(S3.ball.x, S3.ball.y, S3.ball.z);
      V.draw = {id: e.pointerId, pts: [{x: bs.x, y: bs.y}, {x: e.clientX, y: e.clientY}]};
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      say(""); e.preventDefault();
    }
    function move(e) {
      if (!V.draw || e.pointerId !== V.draw.id) return;
      var l = V.draw.pts[V.draw.pts.length - 1];
      if (Math.hypot(e.clientX - l.x, e.clientY - l.y) > 5) V.draw.pts.push({x: e.clientX, y: e.clientY});
      e.preventDefault();
    }
    function up(e) {
      if (!V.draw || e.pointerId !== V.draw.id) return;
      var d = V.draw; V.draw = null;
      var pts = d.pts.slice(1), scr = 0;
      for (var i = 1; i < pts.length; i++) scr += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (pts.length < 2 || scr < 24) { say(tt("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar."), 2600); return; }
      V.trail = {pts: d.pts.map(function (p) { return local(p); }), a: 1};
      var end = pts[pts.length - 1], gr = goalRect(), gEnd = ground(end);
      var isShot = (end.x > gr.x0 && end.x < gr.x1 && end.y > gr.y0 && end.y < gr.y1) || (gEnd && gEnd[0] < 2.5) || (!gEnd && end.y < gr.y1);
      var path = [];
      d.pts.forEach(function (p) { var q = ground(p); if (q && q[0] > (isShot ? 1.5 : -1)) path.push(q); });
      if (isShot) {
        var hit = goalHit(end) || {z: gEnd ? gEnd[1] : 0, h: 1};
        var y = cl(50 - hit.z / UZ, 28.6, 71.4);
        commit(96, y, path.map(function (q) { return toJ(q[0], q[1]); }), Math.max(0.1, hit.h), {z: hit.z, h: hit.h, path: path});
      } else {
        if (!gEnd) { say(tt("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar."), 2600); return; }
        var j = toJ(gEnd[0], gEnd[1]);
        commit(Math.min(j[0], 83), j[1], path.map(function (q) { return toJ(q[0], q[1]); }), null, {path: path});
      }
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
    /* el balón recorre una ruta (lista de [x, z] en metros) con altura h(k) */
    function fly(route, dur, hfn, done, onStep) {
      var pts = resample(chaikin(route, 2), 48), L = plen(pts), t = 0, prevAcc = null;
      S3.onFrame = (function (prev) {
        return function (dt) {
          if (prev) prev(dt);
          t += dt; var k = cl(t / dur, 0, 1), f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
          var x = lerp(pts[i][0], pts[i + 1][0], u), z = lerp(pts[i][1], pts[i + 1][1], u), y = hfn(k);
          var p = S3.L(x, y, z), px = S3.ball.x, pz = S3.ball.z;
          S3.ball.x = p[0]; S3.ball.y = y; S3.ball.z = p[2];
          var vx = (S3.ball.x - px) / Math.max(dt, 1e-3), vz = (S3.ball.z - pz) / Math.max(dt, 1e-3);
          S3.ballSpin(vz * 0.9 / BR * 0.1, 0, -vx * 0.9 / BR * 0.1, dt);
          if (onStep) onStep(k, x, z, y);
          if (k >= 1) { S3.onFrame = prev; if (done) done(); }
        };
      })(S3.onFrame);
      return L;
    }
    function routeFrom(start, mid, end) {
      var r = [start]; (mid || []).forEach(function (q) { var l = r[r.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.8) r.push(q); }); r.push(end);
      return r;
    }
    function kickThen(man, type, then) {
      S3.faceTo(man, S3.ball.x - 1, S3.ball.z);
      man.yaw = PI / 2;
      man.play("kick", {type: type || "inside", d: red() ? 0.3 : 0.55, ev: {"0.55": function () { try { AU.fx(type === "laces" ? "kick" : "kickSoft"); } catch (e) {} S3.ball.sq = 1; S3.fx("grass", S3.ball.x, 0, S3.ball.z, 6); hap("tap"); then(); }}});
    }
    function passAnim(before, st, r, last, aim, fin) {
      var start = toM(before.ball), recvI = last ? last.mate : -1, recv = V.mates[recvI], dest = recvI >= 0 ? toM(before.mates[recvI].p) : toM(st.ball);
      var mid = (aim.path || []).slice(1);
      var end = r.completed ? dest : toM(st.ball), route = routeFrom([start[0] - 0.3, start[1]], mid, end);
      /* si el pase se corta, la ruta se queda en el punto del corte */
      if (!r.completed) {
        var full = resample(chaikin(routeFrom([start[0] - 0.3, start[1]], mid, dest), 2), 48), cut = toM(st.ball), bi = 0, bd = 1e9;
        full.forEach(function (q, i) { var dd = Math.hypot(q[0] - cut[0], q[1] - cut[1]); if (dd < bd) { bd = dd; bi = i; } });
        route = full.slice(0, Math.max(2, bi + 1));
      }
      var L = plen(route), dur = cl(L / (red() ? 40 : 19), 0.4, 1.7), loft = L > 22 ? Math.min(4.2, L * 0.12) : 0;
      if (recv) { S3.faceTo(recv, S3.ball.x, S3.ball.z); }
      /* el rival que corta sale hacia el punto del corte */
      var cutter = null;
      if (!r.completed) {
        var cm = toM(st.ball), cd = 1e9;
        before.rivals.forEach(function (rv, i) { var p = toM(rv), dd = Math.hypot(p[0] - cm[0], p[1] - cm[1]); if (dd < cd) { cd = dd; cutter = V.rivals[i]; } });
      }
      kickThen(V.holder, "inside", function () {
        if (cutter) { moveTo(cutter, toM(st.ball)[0] - 0.3, toM(st.ball)[1], dur * 0.95, "ball"); }
        fly(route, dur, function (k) { return BR + loft * 4 * k * (1 - k); }, function () {
          if (r.completed && recv) {
            var old = V.holder; V.ex.push(old); V.holder = recv; S3.ball.sq = 0.5; try { AU.fx("bounce", 0.4); } catch (e) {}
            recv.play("idle"); say("", 0);
            camFor(st.ball, 0.9);
            layout(st, 0.9);
            setTimeout(fin, red() ? 60 : 650);
          } else {
            if (cutter) cutter.play("slide");
            try { AU.fx("wall"); AU.fx("ooh"); } catch (e) {}
            shout(tt("¡Cortado!"), "bad"); hap("bad"); S3.kick(0.3);
            setTimeout(fin, red() ? 80 : 1300);
          }
        });
      });
    }
    function shotAnim(before, st, r, last, aim, fin) {
      var how = last.how || r.how || r.outcome || (r.scored ? "goal" : "save");
      if (r.outcome) how = r.outcome;
      var start = toM(before.ball), z = aim.z != null ? aim.z : (50 - last.to[1]) * UZ, h = aim.h != null ? aim.h : 1.1, sgn = z < 0 ? -1 : 1;
      h = cl(h, 0.15, 3.6);
      if (how === "goal") { z = cl(z, -HW + 0.35, HW - 0.35); h = cl(h, 0.2, GH - 0.3); if (Math.abs(z) < 1.4) z = sgn * 1.6; }
      else if (how === "post") { z = sgn * (HW - 0.05); h = cl(h, 0.4, GH - 0.4); }
      else if (how === "bar") { h = GH - 0.02; z = cl(z, -HW + 0.6, HW - 0.6); }
      else if (how === "miss") { if (Math.abs(z) <= HW + 0.4 && h <= GH + 0.2) { if (h > 1.8) h = GH + 0.7; else z = sgn * (HW + 0.9); } }
      else if (how === "save") { z = cl(z, -HW + 0.6, HW - 0.6); h = cl(h, 0.3, 2.0); }
      var mid = (aim.path || []).slice(1).filter(function (q) { return q[0] > 1.5; });
      var endX = how === "goal" ? -1.3 : how === "miss" ? -3.5 : 0.25, end = [endX, z + (how === "goal" ? (z - start[1]) * 0.03 : 0)];
      var blocker = null, route;
      if (how === "block") {
        var full = resample(chaikin(routeFrom([start[0] - 0.3, start[1]], mid, [0, z]), 2), 48), bi = 12, bd = 1e9;
        before.rivals.forEach(function (rv, ri) { var p = toM(rv); full.forEach(function (q, i) { var dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; bi = i; blocker = V.rivals[ri]; } }); });
        route = full.slice(0, Math.max(2, bi + 1));
      } else route = routeFrom([start[0] - 0.3, start[1]], mid, end);
      var L = plen(route), dur = cl(L / (red() ? 50 : 27), 0.45, 1.35), hEnd = how === "block" ? 0.9 : h;
      var gkDir = z > 0 ? -1 : 1, gkGo = false, reach = Math.min(2.4, Math.abs(z) * 0.9 + 0.5);
      if (how === "goal" && Math.abs(z) > 2.6) reach = Math.max(0.6, reach - 1.1);
      kickThen(V.holder, "laces", function () {
        if (blocker) moveTo(blocker, route[route.length - 1][0], route[route.length - 1][1], dur * 0.8, "ball");
        S3.camTo([start[0] * 0.7 + 5, 4.1, start[1] * 0.6 + (z > 0 ? -3.2 : 3.2)], [0, 1.0, z * 0.35], 44, dur * 1.25);
        fly(route, dur, function (k) { return BR + (hEnd - BR) * Math.pow(k, 1.15) + Math.min(1.2, L * 0.03) * 4 * k * (1 - k) * (how === "block" ? 0.3 : 1); }, function () {
          if (how === "goal") {
            S3.net.hit(S3.ball.x, S3.ball.y, S3.ball.z, 9); try { AU.fx("net"); AU.fx("cheer"); AU.crowd(1); } catch (e) {}
            S3.slow(0.4, 0.6); S3.kick(0.4); hap("big"); shout(tt("¡GOL!"), "good");
            if (S3.ctx === "final" || S3.ctx === "big") S3.fx("confetti", 4, 6, 0, 70);
            var c = I.celebOf(); V.holder.play(c === "silence" || c === "slide" || c === "plane" || c === "jump" || c === "flip" ? c : "arms");
            V.ex.concat(V.mates).forEach(function (m, i) { if (m !== V.holder) setTimeout(function () { m.play(i % 2 ? "jump" : "arms"); }, 200 + i * 120); });
            setTimeout(function () { V.gk.play("crouchsad"); }, 600);
          } else if (how === "save") {
            try { AU.fx("catch"); AU.fx("ooh"); } catch (e) {} S3.hitstop(90); S3.kick(0.3); hap("ok"); shout(tt("¡Parada!"), "bad");
            V.holder.play("headhands");
          } else if (how === "post" || how === "bar") {
            try { AU.fx("post"); AU.fx("ooh"); } catch (e) {} S3.fx("spark", 0, S3.ball.y, -z, 10); S3.kick(0.6); S3.hitstop(70); hap("big"); shout(tt(how === "bar" ? "¡Larguero!" : "¡Al palo!"), "bad");
            fly([[0.2, z], [5, z * 0.6 - sgn * 1.5]], 0.6, function (k) { return Math.max(BR, h * (1 - k) + 1.2 * 4 * k * (1 - k)); }, null);
            V.holder.play("punch");
          } else if (how === "miss") {
            try { AU.fx("ooh"); } catch (e) {} shout(tt("¡Fuera!"), "bad"); hap("bad"); V.holder.play("headhands");
          } else {
            if (blocker) blocker.play("wall"); try { AU.fx("wall"); AU.fx("ooh"); } catch (e) {} S3.ball.sq = 1; S3.kick(0.35); shout(tt("¡Bloqueado!"), "bad"); hap("bad");
            fly([route[route.length - 1], [route[route.length - 1][0] + 4, route[route.length - 1][1] + (Math.random() - 0.5) * 4]], 0.5, function (k) { return BR + 0.8 * 4 * k * (1 - k); }, null);
          }
          setTimeout(fin, red() ? 120 : 1700);
        }, function (k) {
          /* el portero se lanza poco después del golpeo */
          if (!gkGo && k > (how === "goal" ? 0.42 : 0.28) && how !== "block") {
            gkGo = true; try { AU.fx("dive"); } catch (e) {}
            if (Math.abs(z) < 1.1 && how !== "goal") V.gk.play(h > 1.7 ? "gkjump" : "gkstay", {h: h, d: dur * 0.5});
            else V.gk.play("dive", {dir: gkDir, h: h, reach: reach, d: dur * 0.55, done: function () { V.gk.play("land", {dir: gkDir, h: h, reach: reach}); }});
          }
        });
      });
    }
    /* acción sin trazo (botones accesibles): pase directo o tiro al centro con la misma animación */
    V.act = function (kind, i) {
      var st = o.get(); if (!st || st.done || V.busy) return null;
      if (kind === "pass") { var m = st.mates[+i]; if (!m || !m.open) return null; var p = toM(m.p); return commit(m.p[0], m.p[1], [], null, {path: []}); }
      /* tiro asistido: a la esquina con la línea más limpia */
      var best = null;
      [[44, 1.7], [56, 1.7], [45, 0.6], [55, 0.6]].forEach(function (c) {
        var lane = st.rivals.reduce(function (v, r) { return Math.min(v, JugadaMaestra.segDist(r, st.ball, [96, c[0]])); }, 99);
        if (!best || lane > best.lane + 0.5) best = {y: c[0], h: c[1], lane: lane};
      });
      return commit(96, best.y, [], best.h, {z: (50 - best.y) * UZ, h: best.h, path: []});
    };
    V.busy0 = function () { return V.busy; };
    V.dispose = function () { V.alive = false; clearTimeout(V.tipT); clearTimeout(V.bigT); try { S3.dispose(); } catch (e) {} [cv, tip, big].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); host.classList.remove("sp3-host", "jmh-host"); };
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
      ".jmh-tip{position:absolute;left:50%;bottom:12px;transform:translateX(-50%) translateY(8px);max-width:88%;padding:8px 14px;border-radius:999px;background:rgba(6,12,14,.82);color:#fff;font:700 var(--fs-sm,14px)/1.3 var(--f-body,sans-serif);text-align:center;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}" +
      ".jmh-tip.on{opacity:1;transform:translateX(-50%) translateY(0)}" +
      ".jmh-big{position:absolute;left:0;right:0;top:34%;text-align:center;font:800 clamp(38px,12vw,84px)/1 var(--f-disp,sans-serif);color:#fff;text-shadow:0 5px 0 #000,0 0 24px rgba(0,0,0,.5);opacity:0;transform:scale(.6);transition:opacity .18s,transform .25s cubic-bezier(.2,1.6,.4,1);pointer-events:none;z-index:3;letter-spacing:.02em}" +
      ".jmh-big.on{opacity:1;transform:scale(1)}.jmh-big.good{color:#ffd23f}.jmh-big.bad{color:#fff}" +
      "@media (prefers-reduced-motion:reduce){.jmh-big,.jmh-tip{transition:none}}";
    (document.head || document.documentElement).appendChild(s);
  })();
  var api = {ok: ok, mount: mount, toM: toM, toJ: toJ, last: null};
  return api;
})();
