/* sp-play.js — modos nuevos de balón parado en 3D (5.6): falta directa como lanzador y como portero,
   penalti avanzado por gestos y parada avanzada. Todo el azar pasa por opt.rand (misma semilla = misma jugada).
   Sin números en pantalla: la habilidad del jugador manda y los atributos solo ajustan márgenes. */
var SpPlay = (function () {
  "use strict";
  if (typeof SpModes === "undefined" || !SpModes) return null;
  var I = SpModes._int, AU = SpModes.AU, D = SP_DATA, B = D.bal, HW = SpPhys.HW, GH = SpPhys.GH, R = SpPhys.R, PI = Math.PI;
  var t = I.t, esc = I.esc, cl = I.cl, lerp = I.lerp, hap = I.hap, red = I.red;
  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
  function sN(v) { return cl((v - 40) / 55, 0, 1); }
  function pick(list, r) { return list[Math.floor(r() * list.length) % list.length]; }
  var applyError = SpAI.applyError, aiKeeper = SpAI.aiKeeper, planDir = SpAI.planDir, buildWall = SpAI.buildWall, takerChoose = SpAI.takerChoose;

  /* ---------- carcasa a pantalla completa ---------- */
  function shell(o) {
    var el = document.createElement("div");
    el.className = "spo" + (o.gk ? " spo-gk" : ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", o.title);
    el.innerHTML = '<div class="spo-stage"></div><div class="spo-top"><div><div class="spo-kick">' + esc(o.kicker || "") + '</div><h2 class="spo-title">' + esc(o.title) + '</h2></div><div class="spo-sc" aria-live="polite"></div>' +
      (o.closable ? '<button class="iconbtn spo-x" data-sp="x" aria-label="' + esc(t("Cerrar")) + '">✕</button>' : "") + '</div><div class="spo-hint" aria-live="polite"></div><div class="spo-big" aria-live="assertive"></div><div class="spo-bar"></div><div class="spo-res"></div>';
    document.body.appendChild(el);
    var ui = {el: el, stage: el.querySelector(".spo-stage"), alive: true, o: o};
    /* marcador del partido con los escudos */
    var bd = Minigame.takeBoard ? Minigame.takeBoard() : null;
    if (bd) { ui.board = Minigame.boardEl(bd); ui.board.classList.add("spo-board"); el.querySelector(".spo-top").appendChild(ui.board); }
    ui.hint = function (s) { el.querySelector(".spo-hint").textContent = s || ""; };
    ui.bar = function (h) { el.querySelector(".spo-bar").innerHTML = h || ""; };
    ui.big = function (s, cls) { var b = el.querySelector(".spo-big"); b.textContent = s; b.className = "spo-big on " + (cls || ""); clearTimeout(ui.bigT); ui.bigT = setTimeout(function () { b.className = "spo-big"; }, 1500); };
    ui.score = function (h) { el.querySelector(".spo-sc").innerHTML = h || ""; };
    ui.close = function () { if (!ui.alive) return; ui.alive = false; try { if (ui.S3) ui.S3.dispose(); } catch (e) {} AU.stop(); if (el.parentNode) el.parentNode.removeChild(el); document.body.style.overflow = ui.bo || ""; };
    ui.bo = document.body.style.overflow; document.body.style.overflow = "hidden";
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-sp]"); if (b && ui.on) ui.on(b.getAttribute("data-sp"), b.getAttribute("data-v"), b); });
    try { Anim.animate(el, [{opacity: 0}, {opacity: 1}], {dur: 200}); } catch (e) {}
    /* cuenta atrás de entrada */
    if (!red() && o.countdown !== false) { var n = 3; (function cd() { if (!ui.alive) return; if (!n) { ui.big("", ""); return; } ui.big(String(n), "cd"); n--; setTimeout(cd, 420); })(); }
    return ui;
  }
  /* pantalla de resultado con aparición escalonada; recompensas y logros incluidos */
  function resultScreen(ui, txt, cls, lines, next) {
    var r = ui.el.querySelector(".spo-res");
    r.innerHTML = '<div class="spo-res-t ' + cls + '">' + esc(txt) + "</div>" + lines.map(function (l, i) { return '<div class="spo-res-l" style="animation-delay:' + (0.25 + i * 0.12) + 's">' + l + "</div>"; }).join("") +
      '<div class="spo-res-b"><button class="btn" data-sp="replay">' + esc(t("Ver repetición")) + '</button><button class="go" data-sp="next">' + esc(t("Continuar")) + "</button></div>";
    r.className = "spo-res on";
    var nums = r.querySelectorAll("[data-count]");
    Array.prototype.forEach.call(nums, function (n) { try { Anim.countUp(n, 0, +n.getAttribute("data-count"), {dur: 700, delay: 300}); } catch (e) {} });
    var prev = ui.on;
    ui.on = function (a, v, b) {
      if (a === "next") { r.className = "spo-res"; ui.on = prev; next(); }
      else if (a === "replay" && ui.S3) { r.className = "spo-res"; ui.S3.replay(I.replayCams(), 0.45, function () { r.className = "spo-res on"; }); }
      else if (prev) prev(a, v, b);
    };
  }
  function bigFor(res, gkMode) {
    var h = res.how;
    if (res.scored) return h === "postin" ? [t("¡PALO Y DENTRO!"), "good"] : [t("¡GOL!"), gkMode ? "bad" : "good"];
    if (h === "catch" || h === "save") return [gkMode ? t("¡PARADÓN!") : t("¡PARADA!"), gkMode ? "good" : "bad"];
    if (h === "post") return [t("¡AL PALO!"), gkMode ? "good" : "bad"];
    if (h === "wall") return [t("¡A LA BARRERA!"), gkMode ? "good" : "bad"];
    return [t("Fuera"), gkMode ? "good" : "bad"];
  }

  /* ---------- gesto de deslizar desde el balón ---------- */
  function readSwipe(S3, path, ball, o) {
    var p0 = path[0], p1 = path[path.length - 1], dur = Math.max(0.04, (p1[2] - p0[2]) / 1000);
    var bs = S3.project(ball.x, R, ball.z), top = S3.project(ball.x, 2 * R, ball.z), rpx = Math.max(6, Math.abs(bs.y - top.y));
    var cu = cl((p0[0] - bs.x) / (rpx * 2.2), -1, 1), cv = cl((p0[1] - bs.y) / (rpx * 2.2), -1, 1);
    var cx = p1[0] - p0[0], cy = p1[1] - p0[1], len = Math.hypot(cx, cy) || 1, speed = len / dur;
    /* curvatura con signo: desviación máxima respecto a la cuerda */
    var dev = 0; for (var i = 1; i < path.length - 1; i++) { var d = ((path[i][0] - p0[0]) * cy - (path[i][1] - p0[1]) * cx) / len; if (Math.abs(d) > Math.abs(dev)) dev = d; }
    var curve = cl(dev / len, -0.6, 0.6);
    var gb = S3.project(0, 0, 0), K = cl((bs.y - gb.y) / 150, 1, 7);
    var ax = bs.x + cx * K, ay = bs.y + cy * K;
    /* rayo de cámara al plano de la línea de gol */
    var E = S3.E, Rr = E.ray(ax, ay), plane = SP3.GLX, k = (plane - Rr.o[0]) / (Rr.d[0] || 1e-6);
    var hit = {y: Rr.o[1] + Rr.d[1] * k, z: -(Rr.o[2] + Rr.d[2] * k)};
    var power = cl((speed - 350) / 1700, 0, 1) * 0.7 + cl(len / 420, 0, 1) * 0.3;
    var type = "placed";
    if (len < 140 && speed < 700 && Math.abs(hit.z) < 1.6 && hit.y > 1.2) type = "chip";
    else if (Math.abs(curve) > 0.08) type = cu * curve < 0 && Math.abs(cu) > 0.35 ? "outside" : "curl";
    else if (cv < -0.35 && power > 0.55) type = "dip";
    else if (Math.abs(cu) < 0.22 && Math.abs(cv) < 0.22 && power > 0.78) type = "knuckle";
    else if (power > 0.68) type = "power";
    if (o && o.pen && type === "chip") type = "chip";
    var spec = D.shots[type], v = lerp(spec.v[0], spec.v[1], type === "chip" ? cl(len / 140, 0, 1) : power);
    var spin = [0, 0, 0];
    if (type === "curl" || type === "outside") spin[1] = -Math.sign(curve) * spec.spin * cl(Math.abs(curve) / 0.25, 0.4, 1.2);
    if (type === "dip") spin[2] = spec.spin;
    if (type === "chip") spin[2] = -spec.spin;
    if (type === "placed" || type === "power") spin[1] = -curve * 30;
    /* calidad del gesto: muy corto, muy lento o muy torcido empeora la precisión */
    var quality = cl(1 - (len < 70 ? 0.5 : 0) - (dur > 0.9 ? 0.3 : 0) - Math.max(0, Math.abs(curve) - 0.4), 0.2, 1);
    return {y: hit.y, z: hit.z, v: v, spin: spin, type: type, power: power, curve: curve, quality: quality, cu: cu, cv: cv, len: len};
  }
  /* ===================== FALTA DIRECTA: LANZADOR ===================== */
  function fkShoot(opt, done) {
    opt = opt || {};
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random, dist = cl(opt.dist || 16 + rand() * 18, 16, 35);
    var ang = opt.ang != null ? opt.ang : (rand() - 0.5) * 0.9, ball = {x: Math.cos(ang) * dist, z: Math.sin(ang) * dist};
    if (ball.x < 16.5 && Math.abs(ball.z) < 20.16) ball.x = 17.2; /* nunca dentro del área */
    var press = cl(opt.press != null ? opt.press : opt.pressure || 0.3, 0, 1);
    /* viento leve (a veces): lo enseñan los banderines */
    if (!opt.wind && !opt.training && rand() < 0.35) { var wa = rand() * 2 * PI, wm = 0.8 + rand() * 2.2; opt.wind = [Math.cos(wa) * wm, Math.sin(wa) * wm]; }
    var ui = shell({kicker: t("Balón parado"), title: t("Falta directa"), closable: !!opt.training});
    var S3 = ui.S3 = SP3.create(ui.stage, {ctx: opt.ctx || I.ctxFor(press), cols: I.colsNow(), pet: I.petNow(), tod: opt.tod || I.todNow(), wx: opt.wx, wind: opt.wind});
    var me = S3.man(Object.assign(I.myKit(), {foot: opt.foot})), gk = S3.man(I.rivalKit(true)), ref = S3.man({shirt: "#111", shorts: "#111", socks: "#111", official: true, hairStyle: 1});
    if (opt.wind) windFlags(S3, opt.wind, ball);
    var mate = S3.man(Object.assign(I.myKit(), {num: 8, hairStyle: 3}));
    var nW = dist <= 20 ? 5 : dist <= 25 ? 4 : dist <= 30 ? 3 : 2, lieUp = opt.level >= 2 && dist < 24;
    var wallOpt = {lie: lieUp}, wall = buildWall(ball, nW, 0, wallOpt, rand), wallMen = [];
    var rk = I.rivalKit(false);
    wall.forEach(function (w, i) { var m = S3.man(Object.assign({}, rk, {num: 2 + i, hairStyle: i % 5})); var p = SP3.L(w.x, 0, w.z); m.x = p[0]; m.z = p[2]; S3.faceTo(m, ball.x, ball.z); m.play(w.lie ? "lie" : "wall", {ph: i}); m.w = w; wallMen.push(m); });
    /* portero: hacia el palo lejano */
    var gz0 = -Math.sign(ball.z || 0.001) * cl(Math.abs(ball.z) * 0.06, 0.2, 1.1);
    S3.place(gk, 0.4, gz0, false); gk.play("gkready", {amp: 0.03});
    S3.place(me, ball.x + 2.2, ball.z - 1.4, true); S3.faceTo(me, ball.x, ball.z); me.play("breathe");
    S3.place(mate, ball.x + 1.5, ball.z + 1.6, true); S3.faceTo(mate, ball.x, ball.z); mate.show = false;
    S3.place(ref, ball.x - 4, ball.z + 6, true); S3.faceTo(ref, ball.x, ball.z);
    S3.ball.x = ball.x; S3.ball.y = R; S3.ball.z = ball.z;
    var prof = opt.keeper || pick(D.keepers, rand);
    /* árbitro: spray de la distancia */
    for (var s = 0; s < 14; s++) { var wl = wall[0], off = (s - 7) * 0.22; S3.fx("spray", wl.x - wl.dz * off * -1 + wl.dx * 0.15, 0, wl.z + wl.dx * off * -1 + wl.dz * 0.15, 1); }
    ref.play("spray"); AU.fx("spray");
    /* cámara: plano general primero, luego detrás del balón */
    var ux = -ball.x / dist, uz = -ball.z / dist, camBack = function (k) { return [ball.x - ux * (5.4 + press), 2.25, ball.z - uz * (5.4 + press)]; };
    var yawOff = 0, aimTgt = [0, 1.2, ball.z * 0.15];
    function camStudy() { var a = Math.atan2(ball.z, ball.x) + yawOff, e = [ball.x + Math.cos(a) * 4.6, 2.1, ball.z + Math.sin(a) * 4.6]; S3.camTo(e, aimTgt, 40 - press * 4, 0); }
    var sideS = ball.z >= 0 ? 1 : -1; S3.camTo([ball.x * 0.6, 11, ball.z + sideS * 13], [ball.x * 0.45, 0, ball.z * 0.45], 46, 0);
    setTimeout(function () { if (ui.alive) { S3.camTo(camBack(), aimTgt, 40 - press * 4, 1.2); } }, 1300);
    S3.start(); AU.crowd(0.3 + press * 0.4); S3.crowdT = S3.crowdBase * 0.5;
    var tactic = null, runA = 0.6, phase = "study", path = null, ptr = null;
    function bar() {
      ui.bar(phase === "study" ? '<div class="spo-chips"><span class="spo-l">' + esc(t("Carrera")) + "</span>" + [[0.35, N_("Recta")], [0.6, N_("Media")], [0.95, N_("Abierta")]].map(function (x) { return '<button class="pw-chip" data-sp="run" data-v="' + x[0] + '" aria-pressed="' + (runA === x[0]) + '">' + esc(t(x[1])) + "</button>"; }).join("") + "</div>" +
        '<div class="spo-chips"><span class="spo-l">' + esc(t("Jugada")) + "</span>" + [[null, N_("Normal")], ["gap", N_("Compañero en la barrera")], ["feint", N_("Amago de un compañero")]].map(function (x) { return '<button class="pw-chip" data-sp="tac" data-v="' + (x[0] || "") + '" aria-pressed="' + (tactic === x[0]) + '">' + esc(t(x[1])) + "</button>"; }).join("") + "</div>" +
        '<button class="go wide" data-sp="ready">' + esc(t("Preparado")) + "</button>" : "");
    }
    ui.hint(t("Arrastra para estudiar el hueco; elige carrera y jugada."));
    bar();
    ui.on = function (a, v) {
      if (a === "x") { ui.close(); if (done) done(null); return; }
      if (a === "run") { runA = +v; bar(); return; }
      if (a === "tac") { tactic = v || null; if (tactic === "gap") { mate.show = true; var w0 = wall[wall.length - 1], p = SP3.L(w0.x - w0.dz * 0.52, 0, w0.z + w0.dx * 0.52); mate.x = p[0]; mate.z = p[2]; S3.faceTo(mate, 0, 0); mate.yaw += PI; mate.play("wall"); } else if (tactic === "feint") { mate.show = true; S3.place(mate, ball.x + 1.5, ball.z + 1.6, true); S3.faceTo(mate, ball.x, ball.z); mate.play("idle"); } else mate.show = false; bar(); return; }
      if (a === "ready") { phase = "aim"; S3.camTo(camBack(), aimTgt, 40 - press * 4, 0.6); ui.bar(""); ui.hint(t("Desliza desde el balón: dirección, fuerza y efecto. Donde lo toques decide la altura.")); return; }
    };
    /* gestos: estudiar (girar la cámara) o golpear (deslizar desde el balón) */
    var cv = ui.stage;
    cv.addEventListener("pointerdown", function (e) {
      if (!ui.alive) return; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      ptr = {x: e.clientX, y: e.clientY}; path = [[e.clientX, e.clientY, performance.now()]];
    });
    cv.addEventListener("pointermove", function (e) {
      if (!ptr) return; var dx = e.clientX - ptr.x; ptr.x = e.clientX; ptr.y = e.clientY;
      if (phase === "study") { yawOff = cl(yawOff - dx * 0.006, -1.1, 1.1); camStudy(); return; }
      if (phase === "aim") { path.push([e.clientX, e.clientY, performance.now()]); trail(path); }
    });
    cv.addEventListener("pointerup", function () {
      if (!ptr) return; ptr = null;
      if (phase !== "aim" || path.length < 3) { trail(null); return; }
      var bs = S3.project(ball.x, R, ball.z); if (Math.hypot(path[0][0] - bs.x, path[0][1] - bs.y) > 90) { trail(null); ui.hint(t("Empieza el gesto en el balón.")); return; }
      phase = "shot"; trail(null); shoot(readSwipe(S3, path, ball, {}));
    });
    /* trazo del gesto (tiembla con la presión) */
    var tr2 = document.createElementNS("http://www.w3.org/2000/svg", "svg"); tr2.setAttribute("class", "spo-trail"); ui.stage.appendChild(tr2);
    function trail(P) {
      if (!P) { tr2.innerHTML = ""; return; }
      var j = press > 0.4 ? press * 2.5 : 0, d = P.map(function (q, i) { return (i ? "L" : "M") + (q[0] + (j ? (Math.random() - 0.5) * j : 0)).toFixed(1) + " " + (q[1] + (j ? (Math.random() - 0.5) * j : 0)).toFixed(1); }).join(" ");
      tr2.innerHTML = '<path d="' + d + '" />';
    }
    function shoot(sw) {
      var o = {skill: opt.skill || 70, comp: opt.comp, press: press, dist: dist, badFoot: !!opt.badFoot, help: opt.help || 0};
      var aim = applyError(sw, o, rand), b0 = SpPhys.solve({x: ball.x, z: ball.z, kn: rand()}, cl(aim.y, R, 5), aim.z, aim.v, aim.spin, {});
      /* barrera: salta con su tiempo; compañero que abre hueco, amago que adelanta el salto */
      var jumpShift = tactic === "feint" ? -0.12 : 0;
      wall.forEach(function (w) { if (!w.lie) { var jt = w.jt + jumpShift; (function (jt, jh) { w.jump = function (tt) { var k = (tt - jt) / 0.6; return k <= 0 || k >= 1 ? 0 : Math.sin(k * PI) * jh; }; })(jt, w.jh); } });
      if (tactic === "gap") { var outer = wall[wall.length - 1]; if (outer && !outer.lie) { outer.down = true; } }
      var blind = (function () { var c = SpPhys.cross(b0, {}); if (!c) return false; var near = wall.some(function (w) { return Math.abs(w.z - (ball.z + (c.z - ball.z) * (ball.x - w.x) / ball.x)) < 0.9; }); return near; })();
      var kp = aiKeeper(prof, b0, {gk: opt.gk || 70, blind: blind, x0: 0.4, z0: gz0}, rand);
      var env = {keeper: kp, wall: wall, wind: S3.wind, wet: S3.wx === "rain"};
      var kickType = D.shots[sw.type].clip;
      if (tactic === "feint") { mate.play("feint", {d: 0.8}); }
      me.foot = opt.foot === "L" ? "A" : "B";
      I.shotSequence({S3: S3, shooter: me, keeper: gk, b0: b0, env: env, kickType: kickType, kickPow: 0.5 + sw.power * 0.7, important: press >= 0.6, mineShoots: true, homeShoots: true, runAng: runA, runDist: 3.2, runT: 1.05,
        afterKick: function () { S3.camTo([ball.x - ux * 9.5, 4.4, ball.z - uz * 9.5], [0, 1.2, 0], 34, 0.7); },
        gkGo: function () { setTimeout(function () { I.diveRig(gk, planDir(kp), kp.ty, kp); }, Math.max(0, kp.t0 * 1000)); wallMen.forEach(function (m) { if (m.w.down) { m.play("walljump", {h: 0, turn: true}); return; } if (!m.w.lie) setTimeout(function () { m.play("walljump", {h: m.w.jh, turn: Math.random() < 0.3}); }, Math.max(0, m.w.jt * 1000 - 120)); }); },
        onEvent: function (e) { if (e.k === "wall") { var m = wallMen[e.i]; if (m) m.play("ouch"); } },
        onResult: function (res, sim) {
          var top = res.scored && sim.ev.some(function (e) { return e.k === "goal" && e.y > 1.75 && Math.abs(e.z) > 2.6; });
          var got = opt.training ? [] : SpModes.record("fk", res, {top: top, zone: Math.round((sim.ev.filter(function (e) { return e.k === "goal" || e.k === "wide" || e.k === "over"; })[0] || {z: 0}).z)});
          I.react({shooter: me, keeper: gk, S3: S3, mineShoots: true}, res);
          var bf = bigFor(res, false); ui.big(bf[0], bf[1]); hap(res.scored ? "big" : "bad");
          if (res.scored && S3.ctx !== "barrio") S3.crowdT = 1;
          finishMode(ui, res, got, opt, done, {scored: !!res.scored, how: res.how, p: res.scored ? 1 : 0});
        }});
    }
    return {close: function () { ui.close(); }};
  }
  /* banderines que muestran el viento (en las esquinas del área, a la vista de la cámara) */
  function windFlags(S3, w, ball) {
    var O = VoxCore.core.ORIGIN, wm = Math.hypot(w[0], w[1]) || 1, spots = [[16.5, 20.2], [16.5, -20.2], [0.5, 9.5]];
    S3.extra.push(function (E) {
      var tt = S3.t, d = E.dyn;
      spots.forEach(function (sp, si) {
        var P = SP3.L(sp[0], 0, sp[1]); d.code = VoxCore.MAT.GLOSS; d.box(P[0] + O[0], O[1], P[2] + O[2], 0.04, 1.5, 0.04, [0.95, 0.95, 0.92], 1); d.code = VoxCore.MAT.MATTE;
        for (var k = 0; k < 4; k++) { var fl = Math.sin(tt * (6 + wm) + k * 0.9 + si) * 0.05 * (k + 1), lx = -w[0] / wm, lz = w[1] / wm; d.box(P[0] + O[0] + lx * (0.1 + k * 0.1), O[1] + 1.25 + fl * 0.3, P[2] + O[2] + lz * (0.1 + k * 0.1) + fl, 0.1, 0.26, 0.02, k % 2 ? [0.98, 0.78, 0.1] : [0.95, 0.3, 0.2], 1); }
      });
      d.code = -1;
    });
  }
  /* fin común: repetición automática corta en lo ajustado, pantalla de resultado y vuelta */
  function finishMode(ui, res, got, opt, done, out) {
    if (ui.board && res.scored) Minigame.boardGoal(ui.board, !opt.gkMode);
    var S3 = ui.S3, pr = SpModes.prefs(), close = /post|touchin|save|catch/.test(res.how);
    var lines = got.map(function (a) { return "🏅 " + esc(t(a.n)) + ' · <b data-count="' + a.money + '">0</b> €'; });
    if (opt.reward && out.scored === !opt.gkMode) { lines.push("💶 " + esc(t("Premio del reto")) + ' · <b data-count="' + opt.reward + '">0</b> €'); try { S.p.money += opt.reward; } catch (e) {} }
    function show() { resultScreen(ui, bigFor(res, opt.gkMode)[0], bigFor(res, opt.gkMode)[1], lines, function () { ui.close(); if (done) done(out); }); }
    if (close && !pr.skip && !red()) setTimeout(function () { if (!ui.alive) return; var tap = function () { S3.stopReplay(); }; ui.stage.addEventListener("pointerdown", tap, {once: true}); S3.replay(I.replayCams(res), 0.45, function () { ui.stage.removeEventListener("pointerdown", tap); show(); }); }, 1300);
    else setTimeout(function () { if (ui.alive) show(); }, 1600);
  }

  /* ===================== FALTA DIRECTA: PORTERO ===================== */
  function gkFk(opt, done) {
    opt = opt || {};
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random, dist = cl(opt.dist || 17 + rand() * 13, 16, 35);
    var ang = opt.ang != null ? opt.ang : (rand() - 0.5) * 0.9, ball = {x: Math.max(17.2, Math.cos(ang) * dist), z: Math.sin(ang) * dist};
    var press = cl(opt.press != null ? opt.press : opt.pressure || 0.3, 0, 1);
    var ui = shell({kicker: t("Bajo palos"), title: t("Falta en contra"), gk: true, closable: !!opt.training});
    var S3 = ui.S3 = SP3.create(ui.stage, {ctx: opt.ctx || I.ctxFor(press), cols: I.colsNow(), pet: I.petNow(), tod: opt.tod || I.todNow(), wx: opt.wx});
    var kit = I.myKit(), me = S3.man(Object.assign({}, kit, {gk: true, shirt: "#2ad15a", shorts: "#111", gloves: "#f07a24", num: 1}));
    var taker = S3.man(I.rivalKit(false)), ref = S3.man({shirt: "#111", shorts: "#111", socks: "#111", official: true, hairStyle: 1});
    var striker = S3.man(Object.assign(I.rivalKit(false), {num: 9})); S3.place(striker, 13, ball.z * 0.3 + 2, true); S3.faceTo(striker, 0, 0); striker.play("idle");
    var spec = opt.taker || pick(D.fkTakers, rand);
    var org = {n: dist <= 20 ? 5 : dist <= 25 ? 4 : 3, shift: (ball.z > 0 ? 1 : -1) * 0.35, jump: "jump", gz: -Math.sign(ball.z || 0.001) * 0.6};
    var wallMen = [], wall = [];
    function rebuild() {
      wallMen.forEach(function (m) { var i = S3.men.indexOf(m); if (i >= 0) S3.men.splice(i, 1); });
      wallMen = []; wall = buildWall(ball, org.n, 0, {shift: org.shift, noJump: org.jump === "stay", lie: org.jump === "lie"}, SpPhys.rng(77));
      wall.forEach(function (w, i) { var m = S3.man(Object.assign({}, kit, {num: 2 + i, hairStyle: i % 5})); var p = SP3.L(w.x, 0, w.z); m.x = p[0]; m.z = p[2]; S3.faceTo(m, ball.x, ball.z); m.play(w.lie ? "lie" : "wall", {ph: i}); m.w = w; wallMen.push(m); });
      S3.place(me, 0.3, org.gz, false); S3.faceTo(me, ball.x, ball.z); me.play("gkready", {amp: 0.02});
    }
    rebuild();
    S3.place(taker, ball.x + 2.4, ball.z + 1.2, true); S3.faceTo(taker, ball.x, ball.z); taker.play("breathe");
    S3.place(ref, ball.x - 3.5, ball.z - 5, true); S3.faceTo(ref, ball.x, ball.z);
    S3.ball.x = ball.x; S3.ball.y = R; S3.ball.z = ball.z;
    /* organización con tiempo limitado: vista general desde arriba */
    S3.camTo([-7, 13, ball.z * 0.25], [ball.x * 0.55, 0, ball.z * 0.55], 44, 0);
    S3.start(); AU.crowd(0.3 + press * 0.3);
    var phase = "org", left = 14, timer = null;
    function orgBar() {
      ui.bar('<div class="spo-chips"><span class="spo-l">' + esc(t("Barrera")) + '</span><button class="pw-chip" data-sp="n" data-v="-1">−</button><b class="spo-n">' + org.n + '</b><button class="pw-chip" data-sp="n" data-v="1">+</button>' +
        '<button class="pw-chip" data-sp="sh" data-v="-1">◀</button><button class="pw-chip" data-sp="sh" data-v="1">▶</button></div>' +
        '<div class="spo-chips"><span class="spo-l">' + esc(t("Salto")) + "</span>" + [["jump", N_("Saltan")], ["stay", N_("No saltan")], ["lie", N_("Tumbado detrás")]].map(function (x) { return '<button class="pw-chip" data-sp="j" data-v="' + x[0] + '" aria-pressed="' + (org.jump === x[0]) + '">' + esc(t(x[1])) + "</button>"; }).join("") + "</div>" +
        '<div class="spo-chips"><span class="spo-l">' + esc(t("Tu posición")) + '</span><button class="pw-chip" data-sp="gz" data-v="1">◀</button><button class="pw-chip" data-sp="gz" data-v="-1">▶</button></div>' +
        '<button class="go wide" data-sp="go">' + esc(t("¡Listos!")) + ' <span class="spo-time">' + left + "</span></button>");
    }
    ui.hint(t("Organiza la barrera antes de que pite el árbitro."));
    orgBar();
    timer = setInterval(function () { if (!ui.alive) { clearInterval(timer); return; } left--; var el = ui.el.querySelector(".spo-time"); if (el) el.textContent = left; if (left <= 0) { clearInterval(timer); startShot(); } }, 1000);
    ui.on = function (a, v) {
      if (a === "x") { clearInterval(timer); ui.close(); if (done) done(null); return; }
      if (phase !== "org") return;
      if (a === "n") { org.n = cl(org.n + +v, 1, 6); rebuild(); orgBar(); }
      if (a === "sh") { org.shift = cl(org.shift + (+v) * 0.26 * (ball.z >= 0 ? -1 : 1), -2, 2); rebuild(); orgBar(); }
      if (a === "j") { org.jump = v; rebuild(); orgBar(); }
      if (a === "gz") { org.gz = cl(org.gz + (+v) * 0.3, -2.4, 2.4); rebuild(); orgBar(); }
      if (a === "go") { clearInterval(timer); startShot(); }
    };
    /* arrastrar la barrera con el dedo */
    var drag = null;
    ui.stage.addEventListener("pointerdown", function (e) {
      if (phase === "org") { drag = {x: e.clientX}; return; }
      if (phase === "wait" || phase === "run") { gesture.start(e); }
    });
    ui.stage.addEventListener("pointermove", function (e) {
      if (phase === "org" && drag) { var dx = e.clientX - drag.x; if (Math.abs(dx) > 18) { org.shift = cl(org.shift + (dx > 0 ? 1 : -1) * 0.26 * (ball.z >= 0 ? -1 : 1), -2, 2); drag.x = e.clientX; rebuild(); orgBar(); } return; }
      gesture.move(e);
    });
    ui.stage.addEventListener("pointerup", function (e) { drag = null; gesture.end(e); });
    var gesture = gkGesture(ui, S3, me, function () { return {kickT: kickT, phase: phase}; }, function (g) { myDive = g; });
    var kickT = null, myDive = null, shotPlan = null;
    function startShot() {
      phase = "wait"; ui.bar("");
      var cam = SpModes.prefs().gkcam === "eyes" ? {e: [0.1, 1.72, org.gz], t: [ball.x, 0.8, ball.z], f: 56} : {e: [-ball.x / Math.hypot(ball.x, ball.z) * 12.5, 6.4, -ball.z / Math.hypot(ball.x, ball.z) * 12.5], t: [ball.x * 0.4, 0.4, ball.z * 0.4], f: 36};
      if (SpModes.prefs().gkcam === "eyes") me.show = false;
      S3.camTo(cam.e, cam.t, cam.f, 0.8);
      ui.hint(t("Lee al lanzador. Desliza hacia donde te tiras: el momento cuenta."));
      AU.fx("whistle"); ref.play("whistle");
      /* el lanzador elige el hueco según su especialidad (con señales en el cuerpo que se pueden leer) */
      shotPlan = takerChoose(spec, ball, wall, org, opt, rand);
      var tell = spec.hide < rand() ? shotPlan.z : 0;
      S3.faceTo(taker, ball.x + (tell ? -tell * 0.12 : 0), ball.z);
      setTimeout(function () { if (!ui.alive) return; phase = "run"; runAndShoot(); }, 1600 + rand() * 900);
    }
    function runAndShoot() {
      var b0 = shotPlan.b0;
      var env = {wall: wall, wet: S3.wx === "rain"};
      var t0 = S3.t;
      I.shotSequence({S3: S3, shooter: taker, keeper: me, b0: b0, env: env, kickType: D.shots[shotPlan.type].clip, kickPow: 1, important: press >= 0.6, mineShoots: false, homeShoots: false, runAng: 0.7, runDist: 2.8, runT: 0.95, fromCurrent: false,
        onRun: function () { kickT = performance.now() + (0.95 + 0.7 * 0.55) * 1000; },
        gkGo: function () {
          /* si te tiraste antes, el plan ya está; si no, se usa tu gesto cuando llegue */
          wallMen.forEach(function (m) { if (!m.w.lie && m.w.jh) setTimeout(function () { m.play("walljump", {h: m.w.jh}); }, Math.max(0, m.w.jt * 1000 - 120)); });
          blindBall(S3, b0, wall);
        },
        onEvent: function (e) { if (e.k === "wall") { var m = wallMen[e.i]; if (m) m.play("ouch"); } },
        planKeeper: true,
        onResult: function (res, sim) { endGk(res, sim); }});
      /* el plan del portero se fija con tu gesto: se inyecta en el entorno antes de simular */
      env.keeper = {x: 0.3, z: org.gz, t0: 9, dur: 0.4, tz: org.gz, ty: 1, reach: 2.2, hands: 0.7};
      gesture.bind(env.keeper, org);
    }
    function endGk(res, sim) {
      var wallClean = !sim.ev.some(function (e) { return e.k === "wall"; });
      /* segunda jugada: rechace peligroso que el delantero puede rematar */
      if (res.how === "save" && sim.end && sim.end.x < 12 && Math.abs(sim.end.z) < 9 && !opt.noRebound) { rebound(ui, S3, me, striker, sim.end, rand, opt, function (scored) { var r2 = scored ? {how: "goal", scored: true} : res; finishGk(r2, wallClean && !scored); }); return; }
      finishGk(res, wallClean);
    }
    function finishGk(res, wallClean) {
      var got = opt.training ? [] : SpModes.record("gkfk", res, {wallClean: wallClean && !res.scored});
      var bf = bigFor(res, true); ui.big(bf[0], bf[1]); hap(res.scored ? "bad" : "big");
      if (!res.scored) setTimeout(function () { me.show = true; me.play("arms", {d: 1.8}); }, 400); else setTimeout(function () { me.show = true; me.play("fetchnet"); }, 800);
      opt.gkMode = true;
      finishMode(ui, res, got, opt, done, {saved: !!res.saved, scored: !!res.scored, how: res.how, p: res.scored ? 0 : 1});
    }
    return {close: function () { clearInterval(timer); ui.close(); }};
  }
  /* visión tapada: si el balón pasa pegado a la barrera, aparece más tarde en tu cámara */
  function blindBall(S3, b0, wall) {
    if (!wall.length) return;
    var c = SpPhys.cross(b0, {}); if (!c) return;
    var w0 = wall[0], frac = (b0.x - w0.x) / Math.max(0.1, b0.x), zAt = b0.z + (c.z - b0.z) * frac, near = wall.some(function (w) { return Math.abs(w.z - zAt) < 0.8; });
    if (!near || !SpModes.prefs) return;
    var tHide = Math.max(0, (b0.x - w0.x) / Math.max(5, Math.abs(b0.vx)) - 0.05);
    setTimeout(function () { S3.ball.show = false; setTimeout(function () { S3.ball.show = true; }, 120 + 90); }, tHide * 1000);
  }
  /* gesto del portero: deslizar desde el portero hacia la zona; el momento del gesto respecto al golpeo es el timing */
  function gkGesture(ui, S3, me, st, onDive) {
    var path = null, plan = null, org = null, dove = false;
    var G = {
      bind: function (p, o) { plan = p; org = o; dove = false; },
      start: function (e) { path = [[e.clientX, e.clientY, performance.now()]]; },
      move: function (e) { if (path) path.push([e.clientX, e.clientY, performance.now()]); },
      end: function () {
        if (!path || dove || !plan) { path = null; return; }
        var p0 = path[0], p1 = path[path.length - 1], dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy); path = null;
        if (len < 25) return;
        dove = true;
        var s = st(), now = performance.now(), rel = S3.liveBall ? S3.liveBall.t : s.kickT ? Math.min(-0.02, (now - s.kickT) / 1000) : -0.6;
        /* la pantalla mira hacia el lanzador: derecha de la pantalla = izquierda del portero = z negativo… según la cámara */
        var gkView = S3.cam.eye[0] > SP3.GLX - 2; /* cámara detrás de la portería: mira hacia -x local */
        var side = dx / Math.max(1, len), up = -dy / Math.max(1, len);
        var tz = plan.z + (gkView ? side : side) * 2.6 * cl(len / 160, 0.5, 1.1), ty = cl(0.9 + up * 1.4, 0.2, 2.3);
        plan.tz = tz; plan.ty = ty; plan.t0 = rel; plan.dur = 0.42;
        AU.fx("dive");
        var dir = tz - plan.z > 0.4 ? -1 : tz - plan.z < -0.4 ? 1 : 0;
        var wait = Math.max(0, -rel) * 1000;
        me.show = true;
        I.diveRig(me, dir, ty, plan);
        if (onDive) onDive(plan);
      }
    };
    return G;
  }
  /* rechace: toque rápido para atacar el balón antes que el delantero */
  function rebound(ui, S3, me, striker, end, rand, opt, cb) {
    ui.big(t("¡Rechace!"), "warn"); ui.hint(t("¡Toca rápido para atacar el balón!"));
    var p = SP3.L(end.x, 0, end.z); striker.play("run", {cad: 13}); var sx = striker.x, sz = striker.z, t0 = performance.now(), tapped = null;
    var prev = S3.onFrame;
    S3.onFrame = function (dt) { if (prev) prev(dt); var k = cl((performance.now() - t0) / 900, 0, 1); striker.x = lerp(sx, p[0], k); striker.z = lerp(sz, p[2], k); };
    function tap() { if (tapped == null) tapped = performance.now() - t0; }
    ui.stage.addEventListener("pointerdown", tap, {once: true});
    setTimeout(function () {
      S3.onFrame = prev; ui.stage.removeEventListener("pointerdown", tap);
      var g = sN(opt.gk || 70), ok = tapped != null && rand() < cl(1.05 - tapped / 750 + g * 0.2, 0.05, 0.92);
      if (ok) { me.play("gkstay"); AU.fx("catch"); ui.big(t("¡Atrapado!"), "good"); cb(false); }
      else { striker.play("kick", {type: "laces"}); AU.fx("kick"); setTimeout(function () { AU.fx("net"); S3.net.hit(-1.8, 0.6, end.z * 0.3, 18); cb(true); }, 400); }
    }, 900);
  }

  /* ===================== PENALTI AVANZADO (lanzador) ===================== */
  function penPro(opt, done) {
    opt = opt || {};
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random, press = cl(opt.press || opt.pressure * 0.6 || 0, 0, 1);
    var ui = shell({kicker: t("Desde los once metros"), title: t("Penalti"), closable: !!opt.training});
    var S3 = ui.S3 = SP3.create(ui.stage, {ctx: opt.ctx || I.ctxFor(press), cols: I.colsNow(), pet: I.petNow(), tod: opt.tod || I.todNow(), wx: opt.wx});
    var me = S3.man(Object.assign(I.myKit(), {foot: opt.foot})), gk = S3.man(I.rivalKit(true)), ref = S3.man({shirt: "#111", shorts: "#111", socks: "#111", official: true, hairStyle: 1});
    var prof = opt.keeper || pick(D.keepers, rand), ball = {x: 11, z: 0};
    var tg = opt.targets || null;
    if (tg) { gk.show = false; S3.extra.push(function (E) { var O = VoxCore.core.ORIGIN; E.dyn.code = VoxCore.MAT.EMIT; tg.pts.forEach(function (q) { for (var i = 0; i < 20; i++) { var a2 = i / 20 * 2 * PI, L2 = SP3.L(-0.02, q[1] + Math.sin(a2) * tg.r, q[0] + Math.cos(a2) * tg.r); E.dyn.box(L2[0] + O[0], L2[1] + O[1] - 0.03, L2[2] + O[2], 0.04, 0.06, 0.06, [1, 0.82, 0.2], 1); } }); E.dyn.code = -1; }); }
    S3.place(gk, 0.25, 0, false); gk.play(prof.dance > 0.6 && rand() < prof.dance ? "gkdance" : "gkready", {amp: 0.05 + prof.dance * 0.05});
    S3.place(me, 12.7, -1.0, true); me.play("place", {done: function () { me.play("breathe"); }});
    S3.place(ref, 9.5, 9, true); S3.faceTo(ref, 11, 0);
    S3.ball.x = 11; S3.ball.y = R; S3.ball.z = 0;
    S3.camTo([16.8 - press, 1.65, 0], [0, 1.05, 0], 33 - press * 3, 0); S3.start();
    AU.crowd(0.25 + press * 0.4);
    var run = "mid", pause = false, phase = "setup";
    function bar() { ui.bar('<div class="spo-chips"><span class="spo-l">' + esc(t("Carrera")) + "</span>" + [["short", N_("Corta")], ["mid", N_("Media")], ["long", N_("Larga")]].map(function (x) { return '<button class="pw-chip" data-sp="run" data-v="' + x[0] + '" aria-pressed="' + (run === x[0]) + '">' + esc(t(x[1])) + "</button>"; }).join("") + '</div><button class="go wide" data-sp="ready">' + esc(t("Preparado")) + "</button>"); }
    bar(); ui.hint(t("Elige la carrera. Luego desliza desde el balón."));
    if (press >= 0.5) { var hb = S3.onFrame; S3.onFrame = function (dt) { if (hb) hb(dt); if (phase !== "shot") AU.heart(dt, true, 70 + press * 50); }; }
    ui.on = function (a, v) {
      if (a === "x") { ui.close(); if (done) done(null); return; }
      if (a === "run") { run = v; bar(); return; }
      if (a === "ready") { phase = "aim"; ui.bar(""); ui.hint(t("Desliza desde el balón. Toca la pantalla durante la carrera para frenar y mirar al portero.")); }
    };
    var path = null;
    ui.stage.addEventListener("pointerdown", function (e) { if (phase === "run") { pause = true; return; } if (phase !== "aim") return; path = [[e.clientX, e.clientY, performance.now()]]; });
    ui.stage.addEventListener("pointermove", function (e) { if (path) path.push([e.clientX, e.clientY, performance.now()]); });
    ui.stage.addEventListener("pointerup", function () {
      if (!path) return; var P = path; path = null; if (P.length < 3) return;
      var bs = S3.project(11, R, 0); if (Math.hypot(P[0][0] - bs.x, P[0][1] - bs.y) > 90) { ui.hint(t("Empieza el gesto en el balón.")); return; }
      phase = "run"; shoot(readSwipe(S3, P, ball, {pen: true}));
    });
    function shoot(sw) {
      var o = {skill: opt.skill || 72, comp: opt.comp, press: press, dist: 11, badFoot: !!opt.badFoot, help: opt.help || 0};
      var panenka = sw.type === "chip";
      var aim = applyError(sw, o, rand);
      var runT = run === "short" ? 0.65 : run === "long" ? 1.35 : 0.95, runDist = run === "short" ? 1.8 : run === "long" ? 4.2 : 2.8;
      /* el portero lee el cuerpo: la carrera abierta delata el lado cruzado (si no lo disimulas) */
      var tell = run === "long" ? 0.4 : run === "short" ? -0.2 : 0;
      var s = SpModes.stats(), mem = s ? (s.mem.pen || {L: 0, R: 0, C: 0}) : null;
      var tStart = performance.now();
      setTimeout(function () {
        var b0 = SpPhys.solve({x: 11, z: 0, kn: rand()}, cl(aim.y, R, 4), aim.z, aim.v, aim.spin, {});
        var kp = aiKeeper(prof, b0, {gk: opt.gk || 70, pen: true, mem: mem, tell: tell, pause: pause}, rand);
        if (tg) kp = null;
        /* con la pausa ves si se ha vendido: si adivinó pronto y te frenas, cambias al otro lado */
        if (pause && kp.t0 < 0) { var other = -Math.sign(kp.tz || 1) * Math.max(1.8, Math.abs(aim.z)); b0 = SpPhys.solve({x: 11, z: 0, kn: rand()}, cl(aim.y, R, 2.2), other, aim.v, aim.spin, {}); kp.t0 = -0.25; }
        var env = {keeper: kp, wet: S3.wx === "rain"};
        if (!kp) kp = {t0: 9, tz: 0, ty: 1, z: 0};
        I.shotSequence({S3: S3, shooter: me, keeper: tg ? null : gk, b0: b0, env: env, afterKick: function () { S3.camTo([17.5, 2.6, 0], [0, 1.1, 0], 30, 0.6); }, kickType: panenka ? "chip" : D.shots[sw.type].clip, kickPow: 0.5 + sw.power * 0.7, important: press >= 0.5, mineShoots: true, homeShoots: true, runAng: run === "long" ? 0.75 : 0.45, runDist: runDist, runT: runT + (pause ? 0.45 : 0),
          onRun: function () { if (kp.t0 < 0) setTimeout(function () { I.diveRig(gk, planDir(kp), kp.ty, kp); }, Math.max(0, (runT + (pause ? 0.45 : 0) + 0.7 * 0.55 + kp.t0) * 1000)); },
          gkGo: function () { if (kp.t0 >= 0) setTimeout(function () { I.diveRig(gk, planDir(kp), kp.ty, kp); }, kp.t0 * 1000); },
          onResult: function (res, sim) {
            phase = "shot";
            if (tg) { var ge = (sim && sim.ev || []).filter(function (e) { return e.k === "goal"; })[0], hitT = ge && tg.pts.some(function (q) { return Math.hypot(ge.z - q[0], ge.y - q[1]) < tg.r; });
              ui.big(hitT ? t("¡DIANA!") : res.scored ? t("Cerca") : t("Fuera"), hitT ? "good" : "bad"); hap(hitT ? "big" : "tap");
              res = {scored: !!hitT, how: hitT ? "goal" : res.how};
              setTimeout(function () { resultScreen(ui, hitT ? t("¡DIANA!") : t("Otra vez"), hitT ? "good" : "bad", [], function () { ui.close(); if (done) done({scored: !!hitT}); }); }, 1400); return; }
            var side = aim.z > 1 ? "L" : aim.z < -1 ? "R" : "C";
            if (s) { var mm = s.mem.pen || (s.mem.pen = {L: 0, R: 0, C: 0}); mm[side]++; }
            var got = opt.training ? [] : SpModes.record("pen", res, {panenka: panenka, zone: side});
            I.react({shooter: me, keeper: gk, S3: S3, mineShoots: true}, res);
            var bf = bigFor(res, false); ui.big(bf[0], bf[1]); hap(res.scored ? "big" : "bad");
            finishMode(ui, res, got, opt, done, {scored: !!res.scored, how: res.how, p: res.scored ? 1 : 0});
          }});
      }, 10);
    }
    return {close: function () { ui.close(); }};
  }

  /* ===================== PARADA AVANZADA (penalti en contra) ===================== */
  function gkPenPro(opt, done) {
    opt = opt || {};
    var rand = typeof opt.rand === "function" ? opt.rand : Math.random, press = cl(opt.press || opt.pressure * 0.6 || 0, 0, 1);
    var ui = shell({kicker: t("Bajo palos"), title: t("Penalti en contra"), gk: true, closable: !!opt.training});
    var S3 = ui.S3 = SP3.create(ui.stage, {ctx: opt.ctx || I.ctxFor(press), cols: I.colsNow(), pet: I.petNow(), tod: opt.tod || I.todNow(), wx: opt.wx});
    var kit = I.myKit(), me = S3.man(Object.assign({}, kit, {gk: true, shirt: "#2ad15a", shorts: "#111", gloves: "#f07a24", num: 1}));
    var taker = S3.man(I.rivalKit(false)), ref = S3.man({shirt: "#111", shorts: "#111", socks: "#111", official: true, hairStyle: 1});
    var prof = opt.taker || pick(D.takers, rand), gz = 0, distract = 0;
    S3.place(me, 0.25, 0, false); me.play("gkready", {amp: 0.02});
    S3.place(taker, 12.6, 0.6, true); S3.faceTo(taker, 11, 0); taker.play("place", {done: function () { taker.play("breathe"); }});
    S3.place(ref, 9.5, 9, true); S3.faceTo(ref, 11, 0);
    S3.ball.x = 11; S3.ball.y = R; S3.ball.z = 0;
    var eyes = SpModes.prefs().gkcam === "eyes";
    if (eyes) { me.show = false; S3.camTo([0.1, 1.72, 0], [11, 0.7, 0], 54, 0); } else S3.camTo([-10.5, 4.4, 0.3], [11, 0.6, 0], 32, 0);
    S3.start(); AU.crowd(0.3 + press * 0.4);
    var phase = "pre", kickT = null, plan = {x: 0.25, z: 0, t0: 9, dur: 0.42, tz: 0, ty: 1, reach: B.gkReach + B.gkReachSkill * sN(opt.gk || 70), hands: 0.5 + sN(opt.gk || 70) * 0.4};
    function bar() { ui.bar('<div class="spo-chips"><button class="pw-chip" data-sp="mv" data-v="1">◀</button><button class="pw-chip" data-sp="mv" data-v="-1">▶</button>' + [["arms", N_("Abrir brazos")], ["hop", N_("Saltitos")], ["point", N_("Señalar un lado")]].map(function (x) { return '<button class="pw-chip" data-sp="dis" data-v="' + x[0] + '">' + esc(t(x[1])) + "</button>"; }).join("") + "</div>"); }
    bar(); ui.hint(t("Muévete un poco en la línea y distráele si quieres. Desliza para tirarte."));
    ui.on = function (a, v) {
      if (a === "x") { ui.close(); if (done) done(null); return; }
      if (phase !== "pre") return;
      if (a === "mv") { gz = cl(gz + (+v) * 0.25 * (eyes ? -1 : 1), -0.75, 0.75); plan.z = gz; var p = SP3.L(0.25, 0, gz); me.x = p[0]; me.z = p[2]; }
      if (a === "dis") { distract = Math.min(2, distract + 1); me.play(v === "hop" ? "gkdance" : v === "arms" ? "jump" : "silence", {d: 1.2, done: function () { me.play("gkready", {amp: 0.02}); }}); }
    };
    var gest = gkGesture(ui, S3, me, function () { return {kickT: kickT}; }, null);
    gest.bind(plan, {gz: gz});
    ui.stage.addEventListener("pointerdown", function (e) { gest.start(e); });
    ui.stage.addEventListener("pointermove", function (e) { gest.move(e); });
    ui.stage.addEventListener("pointerup", function (e) { gest.end(e); });
    /* el lanzador decide su tiro (perfil, nervios, distracciones) y muestra señales: carrera, cadera, mirada */
    setTimeout(function () {
      if (!ui.alive) return; phase = "run"; ui.bar(""); AU.fx("whistle"); ref.play("whistle");
      var nerv = prof.nerves + distract * 0.12 * (1 - sN(opt.skill || 72) * 0.5);
      var side = prof.side ? (rand() < 0.68 ? prof.side : -prof.side) : (rand() < 0.5 ? 1 : -1), pan = rand() < prof.panenka, high = rand() < prof.high;
      var tz = pan ? 0 : side * lerp(1.4, 3.2, rand()), ty = pan ? 1.9 : high ? lerp(1.5, 2.3, rand()) : lerp(0.25, 0.9, rand());
      var sig = 0.25 + nerv * 0.5; tz += gauss(rand) * sig; ty = cl(ty + gauss(rand) * sig * 0.7, R, 3.2);
      var v = pan ? 9.5 : lerp(18, 30, prof.power);
      var b0 = SpPhys.solve({x: 11, z: 0, kn: rand()}, ty, tz, v, [0, 0, pan ? -10 : 0], {});
      /* señal: el ángulo de carrera apunta al lado contrario si no la disimula */
      var tellAng = rand() > prof.hide ? (side > 0 ? 0.85 : 0.3) : 0.55;
      var env = {keeper: plan, wet: S3.wx === "rain"};
      var pauseT = rand() < prof.pause ? 0.4 : 0;
      I.shotSequence({S3: S3, shooter: taker, keeper: me, b0: b0, env: env, kickType: pan ? "chip" : prof.power > 0.7 ? "laces" : "inside", important: press >= 0.5, mineShoots: false, homeShoots: false, runAng: tellAng, runDist: 2.6, runT: 0.95 + pauseT,
        onRun: function () { kickT = performance.now() + (0.95 + pauseT + 0.7 * 0.55) * 1000; },
        onResult: function (res) {
          /* adelantarse antes del golpeo: el árbitro puede mandar repetir si lo paras */
          var early = plan.t0 < -0.3;
          if (early && !res.scored && rand() < 0.5 && !opt.noRetake) { ui.big(t("¡Repetición!"), "warn"); ref.play("point", {side: 0}); AU.fx("whistle"); setTimeout(function () { ui.close(); gkPenPro(Object.assign({}, opt, {noRetake: true}), done); }, 1800); return; }
          var got = opt.training ? [] : SpModes.record("gkpen", res, {final: S3.ctx === "final"});
          var bf = bigFor(res, true); ui.big(bf[0], bf[1]); hap(res.scored ? "bad" : "big");
          if (!res.scored) setTimeout(function () { me.show = true; me.play("arms", {d: 1.8}); }, 500); else setTimeout(function () { me.show = true; me.play("fetchnet"); }, 900);
          opt.gkMode = true;
          finishMode(ui, res, got, opt, done, {saved: !!res.saved, scored: !!res.scored, how: res.how, p: res.scored ? 0 : 1});
        }});
    }, 2600 + rand() * 1200);
    return {close: function () { ui.close(); }};
  }

  /* enrutado: las faltas pasan a 3D; los penaltis siguen en su clásico salvo que elijas el control avanzado */
  if (typeof Minigame !== "undefined" && Minigame) {
    var M0 = {penalty: Minigame.penalty, gkPenalty: Minigame.gkPenalty, freekick: Minigame.freekick, gkFreekick: Minigame.gkFreekick};
    var on = function () { return SpModes.enabled(); };
    Minigame.freekick = function (o, d) { if (!on()) return M0.freekick(o, d); return fkShoot({skill: o.skill, gk: o.gk, dist: o.dist, press: o.pressure, rand: o.rand}, function (r) { if (d) d(r); }); };
    Minigame.gkFreekick = function (o, d) { if (!on()) return M0.gkFreekick(o, d); return gkFk({skill: o.skill, gk: o.gk, dist: o.dist, press: o.pressure, rand: o.rand}, function (r) { if (d) d(r); }); };
    Minigame.penalty = function (o, d) { if (on() && SpModes.prefs().ctrl === "adv") return penPro({skill: o.skill, gk: o.gk, press: Math.max(o.press || 0, (o.pressure || 0) * 0.6), rand: o.rand}, function (r) { if (d) d(r); }); return M0.penalty(o, d); };
    Minigame.gkPenalty = function (o, d) { if (on() && SpModes.prefs().ctrl === "adv") return gkPenPro({skill: o.skill, gk: o.gk, press: Math.max(o.press || 0, (o.pressure || 0) * 0.6), rand: o.rand}, function (r) { if (d) d(r); }); return M0.gkPenalty(o, d); };
    Minigame.classic = M0;
  }
  return {fkShoot: fkShoot, gkFk: gkFk, penPro: penPro, gkPenPro: gkPenPro, readSwipe: readSwipe, applyError: applyError, aiKeeper: aiKeeper, buildWall: buildWall, takerChoose: takerChoose};
})();
