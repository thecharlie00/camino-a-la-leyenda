/* play40.js — versión 4.0 «Juega tus momentos (I)»: control directo de las jugadas clave del jugador de campo.
   PlayMoment.open({skill: {tir, reg, vel}, opp, diff 0..2, help, cols: [tuyo, rival], rand}, done)
   → done({scored, lost, p})
   Campo 2D en vista cenital del último tercio: arrastra para moverte, «Regatear» para irte del defensor,
   «Pared» para tocar con un compañero y «Tirar» para disparar. Sin dependencias; canvas a pantalla completa. */
var PlayMoment = (function () {
  "use strict";
  var W = 40, L = 34, TOP = 1.4, GX0 = 16.4, GX1 = 23.6;
  function t(s, p) { return typeof tr === "function" ? tr(s, p) : s; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }

  function open(o, done) {
    o = o || {};
    var R = o.rand || Math.random, diff = clamp(o.diff == null ? 1 : o.diff, 0, 2), sk = o.skill || {};
    var TIR = sk.tir || 70, REG = sk.reg || 70, VEL = sk.vel || 70;
    var cols = o.cols || ["#ffb21e", "#ff5b66"];
    var ov = document.createElement("div"); ov.className = "mg-ov pm-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = '<div class="pm-box"><div class="pm-top"><b>' + t("Juega la jugada") + '</b><span class="pm-time"><i></i></span></div>' +
      '<canvas class="pm-cv"></canvas><p class="pm-hint">' + t("Arrastra sobre el campo para moverte. Regatea al defensa, haz una pared o dispara.") + "</p>" +
      '<div class="pm-btns"><button type="button" data-pm="reg">' + t("Regatear") + '</button><button type="button" data-pm="pas">' + t("Pared") + '</button><button type="button" class="pm-shot" data-pm="tir">' + t("Tirar") + ' <small></small></button></div>' +
      '<div class="pm-msg" hidden></div></div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector(".pm-cv"), ctx = cv.getContext("2d"), msgEl = ov.querySelector(".pm-msg"), timeEl = ov.querySelector(".pm-time i"), shotEl = ov.querySelector(".pm-shot small");
    var dpr = Math.min(2, window.devicePixelRatio || 1), sc = 10, cw = 0, chh = 0;
    function resize() {
      var r = cv.getBoundingClientRect(); cw = r.width; chh = r.height || r.width * (L + TOP) / W;
      cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); sc = Math.min(cw / W, chh / (L + TOP));
    }
    /* estado */
    var T = [11, 9, 8][diff], DSP = [4.6, 5.4, 6.0][diff], TK = [0.16, 0.26, 0.36][diff];
    var me = {x: 20 + (R() - 0.5) * 10, y: 27, tx: null, ty: null, burst: 0};
    var mates = [{x: 7 + R() * 3, y: 18}, {x: 30 + R() * 3, y: 17}];
    var defs = [{x: me.x + (R() - 0.5) * 4, y: 21, st: 0}, {x: 13, y: 12, st: 0}, {x: 27, y: 12, st: 0}];
    if (diff === 0) defs.pop();
    var gk = {x: 20, y: 1.3, dive: 0};
    var ball = {x: me.x, y: me.y - 0.6, st: "me", fx: 0, fy: 0, tx: 0, ty: 0, k: 0, dur: 0, then: null};
    var t0 = 0, last = now(), over = false, cd = 0, tkT = 0, fin = null, started = false, raf = 0;
    function shotP() {
      var d = Math.hypot(me.x - 20, me.y), a1 = Math.atan2(GX0 - me.x, me.y), a2 = Math.atan2(GX1 - me.x, me.y), ang = Math.abs(a2 - a1);
      var base = clamp(ang / 0.85, 0, 1) * clamp(1.15 - d / 26, 0, 1);
      var nd = Math.min.apply(null, defs.map(function (q) { return q.st > 0 ? 9 : dist(q, me); }));
      var press = nd < 1.5 ? 0.6 : nd < 3 ? 0.85 : 1;
      return clamp(base * (0.72 + (TIR - 70) * 0.012) * press * [1.2, 1, 0.85][diff], 0.02, 0.9);
    }
    function end(kind, scored) {
      if (fin) return;
      fin = {kind: kind, scored: !!scored, at: now(), p: shotP()};
      var txt = {goal: t("¡GOOOL!"), save: t("¡Parada del portero!"), miss: t("Se va fuera"), lost: t("Te roban el balón"), time: t("Se acabó la jugada"), inter: t("Pase interceptado")}[kind] || "";
      msgEl.hidden = false; msgEl.textContent = txt; msgEl.className = "pm-msg " + (scored ? "good" : "bad");
      setTimeout(function () { close(); done && done({scored: !!scored, lost: kind !== "goal" && kind !== "save" && kind !== "miss", p: fin.p}); }, 1500);
    }
    function close() { over = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); ov.remove(); }
    /* controles */
    function toPitch(e) { var r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; var ox = (cw - W * sc) / 2; return {x: (p.clientX - r.left - ox) / sc, y: (p.clientY - r.top) / sc - TOP}; }
    var down = false;
    function onDown(e) { if (fin) return; down = true; var p = toPitch(e); me.tx = p.x; me.ty = p.y; if (e.cancelable) e.preventDefault(); }
    function onMove(e) { if (!down || fin) return; var p = toPitch(e); me.tx = p.x; me.ty = p.y; if (e.cancelable) e.preventDefault(); }
    function onUp() { down = false; me.tx = null; }
    cv.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    ov.querySelector(".pm-btns").addEventListener("click", function (e) {
      var b = e.target.closest("[data-pm]"); if (!b || fin || ball.st !== "me") return;
      var k = b.getAttribute("data-pm");
      if (k === "reg" && cd <= 0) {
        cd = 1; me.burst = 0.5;
        var q = defs.filter(function (d) { return d.st <= 0; }).sort(function (a, c) { return dist(a, me) - dist(c, me); })[0];
        if (q && dist(q, me) < 2.8) {
          var ok = R() < clamp(0.5 + (REG - 70) * 0.012 + [0.15, 0, -0.12][diff], 0.15, 0.92);
          if (ok) { q.st = 1.4; q.x += (q.x < me.x ? -1.6 : 1.6); } else { ball.st = "lost"; end("lost", false); }
        }
      } else if (k === "pas") {
        var m = mates.slice().sort(function (a, c) { return openness(c) - openness(a); })[0];
        kick(m.x, m.y, 16, function () {
          /* ¿la corta un defensor? */
          var cut = defs.some(function (d) { return d.st <= 0 && segDist(d, me, m) < 1.2; }) && R() < [0.4, 0.55, 0.7][diff];
          if (cut) { end("inter", false); return; }
          ball.st = "mate";
          setTimeout(function () { if (fin) return; defs.forEach(function (d) { if (dist(d, me) < 4) d.st = Math.max(d.st, 0.6); }); var tx = clamp(me.x, 5, 35), ty = Math.max(6, me.y - 3); kick(tx, ty, 15, function () { ball.st = "me"; me.x = tx; me.y = ty; }, m); }, 350);
        }, me);
      } else if (k === "tir") {
        var p = shotP(), aim = gk.x < 20 ? GX1 - 0.9 : GX0 + 0.9, goal = R() < p, miss = !goal && R() < 0.45;
        var ty2 = miss ? -0.6 : 0.2, tx2 = miss ? (aim < 20 ? GX0 - 1.2 : GX1 + 1.2) : aim;
        gk.dive = goal || miss ? (aim < 20 ? -1 : 1) * 0.6 : (aim < 20 ? -1 : 1);
        kick(tx2, ty2, 24, function () { end(goal ? "goal" : miss ? "miss" : "save", goal); }, me);
        ball.st = "shot";
      }
    });
    function openness(m) { return Math.min.apply(null, defs.map(function (d) { return dist(d, m); })); }
    function segDist(p, a, b) { var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1, k = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1); return Math.hypot(p.x - (a.x + dx * k), p.y - (a.y + dy * k)); }
    function kick(tx, ty, sp, then, from) {
      from = from || ball; ball.fx = from.x; ball.fy = from.y; ball.tx = tx; ball.ty = ty; ball.k = 0;
      ball.dur = Math.max(0.15, Math.hypot(tx - from.x, ty - from.y) / sp); ball.then = then; ball.st = ball.st === "shot" ? "shot" : "fly";
    }
    /* bucle */
    function step(dt) {
      if (!started) return;
      t0 += dt; cd = Math.max(0, cd - dt); me.burst = Math.max(0, me.burst - dt);
      if (!fin && t0 >= T && ball.st === "me") { end("time", false); }
      /* tú */
      var sp = (5.6 + (VEL - 70) * 0.04) * (me.burst > 0 ? 1.6 : 1) * (ball.st === "me" ? 0.92 : 1);
      if (me.tx != null && !fin) { var dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy); if (d > 0.2) { var k = Math.min(1, sp * dt / d); me.x += dx * k; me.y += dy * k; } }
      me.x = clamp(me.x, 1, W - 1); me.y = clamp(me.y, 1.2, L - 1);
      /* balón */
      if (ball.st === "me") { ball.x = me.x; ball.y = me.y - 0.6; }
      else if (ball.st === "fly" || ball.st === "shot") {
        ball.k += dt / ball.dur; var kk = Math.min(1, ball.k);
        ball.x = ball.fx + (ball.tx - ball.fx) * kk; ball.y = ball.fy + (ball.ty - ball.fy) * kk;
        if (kk >= 1) { var th = ball.then; ball.then = null; if (ball.st === "fly") ball.st = "idle"; if (th) th(); }
      }
      /* compañeros: buscan espacio */
      mates.forEach(function (m, i) { var tx = i ? 31 : 9, ty = clamp(me.y - 7, 9, 22); m.x += (tx - m.x) * dt * 0.8; m.y += (ty - m.y) * dt * 0.8; });
      /* defensores */
      defs.forEach(function (q, i) {
        if (q.st > 0) { q.st -= dt; return; }
        var tg = i === 0 || dist(q, me) < 6 ? me : {x: (me.x + 20) / 2, y: Math.max(6, me.y - 6)};
        if (ball.st === "fly" || ball.st === "mate") tg = ball;
        var dx = tg.x - q.x, dy = tg.y - q.y, d = Math.hypot(dx, dy), v = DSP * dt;
        if (d > 0.6) { q.x += dx / d * Math.min(v, d - 0.6); q.y += dy / d * Math.min(v, d - 0.6); }
      });
      /* entrada */
      if (!fin && ball.st === "me") {
        tkT -= dt;
        var near = defs.some(function (q) { return q.st <= 0 && dist(q, me) < 1.05; });
        if (near && tkT <= 0) { tkT = 0.35; if (R() < TK * (me.burst > 0 ? 0.4 : 1)) { ball.st = "lost"; end("lost", false); } }
      }
      /* portero */
      if (gk.dive) gk.x += gk.dive * dt * 9; else gk.x += (clamp(ball.x, GX0 + 0.6, GX1 - 0.6) - gk.x) * Math.min(1, dt * 3);
      gk.x = clamp(gk.x, GX0 - 1.5, GX1 + 1.5);
      timeEl.style.width = Math.max(0, 100 - t0 / T * 100) + "%";
      if (o.help !== false && ball.st === "me") shotEl.textContent = Math.round(shotP() * 100) + " %"; else shotEl.textContent = "";
    }
    function X(x) { return (cw - W * sc) / 2 + x * sc; }
    function Y(y) { return (y + TOP) * sc; }
    function dot(x, y, r, fill, stroke) { ctx.beginPath(); ctx.arc(X(x), Y(y), r * sc, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); } }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#16472f"; ctx.fillRect(0, 0, cw, chh);
      ctx.fillStyle = "#1a5236"; for (var i = 0; i < 8; i += 2) ctx.fillRect(X(0), Y(i * L / 8), W * sc, L / 8 * sc);
      ctx.strokeStyle = "rgba(237,241,232,.75)"; ctx.lineWidth = 1.4;
      ctx.strokeRect(X(0), Y(0), W * sc, L * sc);
      ctx.strokeRect(X(5.85), Y(0), 28.3 * sc, 16.5 * sc); ctx.strokeRect(X(14.5), Y(0), 11 * sc, 5.5 * sc);
      ctx.beginPath(); ctx.arc(X(20), Y(11), 0.25 * sc, 0, 6.28); ctx.fillStyle = "rgba(237,241,232,.75)"; ctx.fill();
      ctx.beginPath(); ctx.arc(X(20), Y(11), 9.15 * sc, 0.65, Math.PI - 0.65); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(X(GX0), Y(-0.9), (GX1 - GX0) * sc, 0.9 * sc);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(X(GX0), Y(-0.9), (GX1 - GX0) * sc, 0.9 * sc);
      /* línea de tiro de ayuda */
      if (o.help !== false && ball.st === "me" && !fin) { ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(255,178,30,.5)"; ctx.beginPath(); ctx.moveTo(X(me.x), Y(me.y)); ctx.lineTo(X(gk.x < 20 ? GX1 - 0.9 : GX0 + 0.9), Y(0)); ctx.stroke(); ctx.setLineDash([]); }
      dot(gk.x, gk.y, 0.8, "#2f3b40", "#ffffff");
      mates.forEach(function (m) { dot(m.x, m.y, 0.75, cols[0], "rgba(0,0,0,.45)"); });
      defs.forEach(function (q) { dot(q.x, q.y, 0.75, q.st > 0 ? "rgba(255,91,102,.45)" : cols[1], "rgba(0,0,0,.45)"); });
      dot(me.x, me.y, 0.85, cols[0], "#ffffff");
      ctx.beginPath(); ctx.arc(X(me.x), Y(me.y), 1.35 * sc, 0, 6.28); ctx.strokeStyle = "rgba(255,178,30,.85)"; ctx.lineWidth = 2; ctx.stroke();
      if (me.tx != null) { ctx.beginPath(); ctx.moveTo(X(me.x), Y(me.y)); ctx.lineTo(X(me.tx), Y(me.ty)); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.stroke(); }
      dot(ball.x, ball.y, 0.38, "#ffffff", "#111");
    }
    function loop() {
      if (over) return;
      var tn = now(), dt = Math.min(0.05, (tn - last) / 1000); last = tn;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    resize(); window.addEventListener("resize", resize);
    /* cuenta atrás corta antes de empezar */
    msgEl.hidden = false; msgEl.className = "pm-msg"; msgEl.textContent = t("¡Vamos!");
    setTimeout(function () { if (!fin) { msgEl.hidden = true; started = true; last = now(); } }, 700);
    loop();
    return {close: close};
  }
  return {open: open};
})();

/* ---------- integración con las decisiones de partido (jugador de campo) ---------- */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;
  function setOf() { S.set = S.set || {}; if (S.set.play == null) S.set.play = 1; if (S.set.pdiff == null) S.set.pdiff = 1; if (S.set.phelp == null) S.set.phelp = 1; return S.set; }
  /* índice de la opción de disparo con más probabilidad */
  function shotIdx(d) { var best = -1, bp = -1; d.opts.forEach(function (o, i) { if (o.shot && !o.dis) { var p = o.outs && o.outs[0] ? o.outs[0].p : 0; if (p > bp) { bp = p; best = i; } } }); return best; }
  U.playable = function (d) {
    if (!S || S.mode === "mgr" || !S.p || !S.pend[0] || S.pend[0].k !== "moment" || isGK()) return false;
    if (setOf().play === 0 || d.opts.some(function (o) { return o.mini; })) return false;
    return shotIdx(d) >= 0;
  };
  U.actions.mplay = function () {
    var x = S.pend[0]; if (!x || x.k !== "moment") return;
    var d = playerDesc(x), i = shotIdx(d); if (i < 0) return;
    var at = attrs(), p = S.p, f = S.cur && S.cur.pm && S.cur.pm[x.fi], st = setOf();
    var cu = W.clubs[p.club] ? W.clubs[p.club].col : null, co = f && f.opp != null && !f.isNat && W.clubs[f.opp] ? W.clubs[f.opp].col : null;
    PlayMoment.open({skill: {tir: at.TIR || p.ovr, reg: at.REG || at.TEC || p.ovr, vel: at.RIT || at.VEL || p.ovr}, diff: st.pdiff, help: st.phelp !== 0,
      cols: [cu && /^#/.test(cu[0]) ? cu[0] : "#ffb21e", co && /^#/.test(co[0]) && co[0] !== (cu && cu[0]) ? co[0] : "#ff5b66"]}, function (res) {
      FORCE_OUT = !!res.scored; U.choose(i);
    });
  };
  U.add("menu", function () {
    if (!S || S.mode === "mgr") return "";
    var st = setOf();
    return '<details class="fold"><summary>' + tr("Jugar los momentos") + '</summary><div class="stack">' +
      '<div class="seg"><button data-a="pset" data-k="play" data-v="1" aria-pressed="' + (st.play !== 0) + '">' + tr("Jugarlos yo") + '</button><button data-a="pset" data-k="play" data-v="0" aria-pressed="' + (st.play === 0) + '">' + tr("Solo decidir") + "</button></div>" +
      '<div><label class="lbl">' + tr("Dificultad") + '</label><div class="seg">' + [[N_("Fácil"), 0], [N_("Normal"), 1], [N_("Difícil"), 2]].map(function (x) { return '<button data-a="pset" data-k="pdiff" data-v="' + x[1] + '" aria-pressed="' + (st.pdiff === x[1]) + '">' + h(tr(x[0])) + "</button>"; }).join("") + "</div></div>" +
      '<div><label class="lbl">' + tr("Ayudas") + '</label><div class="seg"><button data-a="pset" data-k="phelp" data-v="1" aria-pressed="' + (st.phelp !== 0) + '">' + tr("Ver probabilidad y línea de tiro") + '</button><button data-a="pset" data-k="phelp" data-v="0" aria-pressed="' + (st.phelp === 0) + '">' + tr("Sin ayudas") + "</button></div></div></div></details>";
  });
  U.actions.pset = function (b, v) { setOf()[b.getAttribute("data-k")] = +v; U.persist(); U.renderSheet(); var ds = document.querySelectorAll(".sheet details.fold"); if (ds.length) ds[ds.length - 1].open = true; };
})();
