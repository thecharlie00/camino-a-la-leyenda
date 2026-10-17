/* Web de Camino a la Leyenda: anuncios (solo en huecos visibles) y el partido de la portada. */
(function () {
  "use strict";
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ---------- anuncios: se piden solo los huecos que se ven (los laterales, solo en pantallas anchas) ---------- */
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

  /* ---------- el partido de la portada: 22 bolitas, pases, tiros y un marcador ---------- */
  var cv = document.getElementById("pitch");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d"), W = 105, H = 68, K = cv.width / W;
  var COL = ["#ffb21e", "#66b9ff"], INK = ["#1d1404", "#06233d"];
  var F = [[4.5, 34], [24, 10], [21, 26], [21, 42], [24, 58], [40, 20], [37, 34], [40, 48], [58, 12], [62, 34], [58, 56]];
  var NAMES = [["Ribas", "Lozano", "Teo", "Barro", "Quique", "Moya", "Iker", "Saúl", "Pino", "Nando", "Cuesta"], ["Ferro", "Abel", "Garrido", "Nuño", "Ruiz", "Calvo", "Duarte", "Mateo", "Rivas", "Ortega", "Vidal"]];
  var T = [[], []], ball = {x: 52.5, y: 34, fx: 0, fy: 0, tx: 0, ty: 0, t: 1, d: 1, h: 0, z: 0}, own = 0, holder = 9, nextAt = 0, clock = 0, minute = 1, goals = [0, 0], shot = null, pause = 0;
  var sc = document.getElementById("sc"), say = document.getElementById("say");
  for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
    var x = s ? W - F[i][0] : F[i][0], y = s ? H - F[i][1] : F[i][1];
    T[s].push({x: x, y: y, vx: 0, vy: 0, hx: F[i][0], hy: F[i][1], sp: 6 + Math.random() * 2.2, n: i + 1, ph: Math.random() * 6});
  }
  function U(s, u) { return s ? W - u : u; }
  function line(t) { if (say) say.innerHTML = '<span class="min">' + minute + "'</span> " + t; }
  function nearest(s, x, y, ex) { var b = -1, bd = 1e9; T[s].forEach(function (p, i) { if (i === ex || i === 0) return; var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; b = i; } }); return b; }
  function kick(x, y, d, h) { ball.fx = ball.x; ball.fy = ball.y; ball.tx = x; ball.ty = y; ball.t = 0; ball.d = d; ball.h = h || 0; holder = -1; }
  function decide() {
    var p = T[own][holder], bu = own ? W - p.x : p.x, d = 1 - own;
    if (bu > 76 && Math.random() < 0.5) {
      /* tiro */
      var gy = 34 + (Math.random() - 0.5) * 9, goal = Math.random() < 0.3;
      if (!goal && Math.random() < 0.5) gy = 34 + (Math.random() < 0.5 ? -1 : 1) * (4.2 + Math.random() * 3);
      shot = {s: own, goal: goal, who: NAMES[own][holder]};
      kick(U(own, W + 0.8), gy, 0.55, 0.6);
      line(goal ? "Tiro de " + shot.who + "…" : "Lo intenta " + shot.who + "…");
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
    /* a veces el rival corta el pase */
    var steal = Math.random() < 0.16, tgt = {x: r.x + (own ? -2 : 2), y: r.y};
    kick(tgt.x, tgt.y, 0.25 + dist2 / 18, dist2 > 28 ? 3 : 0);
    ball.to = steal ? {s: d, i: nearest(d, tgt.x, tgt.y)} : {s: own, i: best};
  }
  function arrive() {
    if (shot) {
      var s0 = shot.s, who = shot.who; shot = null;
      if (Math.abs(ball.ty - 34) < 3.6 && Math.random() < 0.85) {
        goals[s0]++; if (sc) sc.textContent = goals[0] + "-" + goals[1];
        line("¡Gol de " + who + "! " + (s0 ? "Montaña" : "Ribera") + " celebra.");
      } else line("Fuera. Saca de puerta el portero.");
      pause = 1.6; own = 1 - s0; holder = 0; ball.x = U(own, 5); ball.y = 34; nextAt = clock + 1.8;
      return;
    }
    var to = ball.to || {s: own, i: 9};
    if (to.s !== own) line("Recupera " + NAMES[to.s][to.i] + ".");
    own = to.s; holder = to.i; nextAt = clock + 0.5 + Math.random() * 0.7;
  }
  function step(dt) {
    clock += dt;
    if (clock > minute * 1.25 && minute < 90) minute++;
    if (minute >= 90 && clock > minute * 1.25 + 4) { minute = 1; clock = 0; goals = [0, 0]; if (sc) sc.textContent = "0-0"; line("Empieza otro partido."); }
    if (pause > 0) pause -= dt;
    if (holder < 0) {
      ball.t += dt; var k = Math.min(1, ball.t / ball.d), e = k * (2 - k);
      ball.x = ball.fx + (ball.tx - ball.fx) * e; ball.y = ball.fy + (ball.ty - ball.fy) * e; ball.z = 4 * ball.h * k * (1 - k);
      if (k >= 1) arrive();
    } else {
      var hp = T[own][holder]; ball.x += (hp.x + (own ? -0.8 : 0.8) - ball.x) * Math.min(1, dt * 10); ball.y += (hp.y - ball.y) * Math.min(1, dt * 10); ball.z = 0;
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
  }
  function draw() {
    for (var i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? "#206646" : "#1b5a3c"; ctx.fillRect(i * W / 12 * K, 0, W / 12 * K + 1, H * K); }
    ctx.strokeStyle = "rgba(237,241,232,.75)"; ctx.lineWidth = 0.32 * K;
    ctx.strokeRect(1 * K, 1 * K, (W - 2) * K, (H - 2) * K);
    ctx.beginPath(); ctx.moveTo(W / 2 * K, 1 * K); ctx.lineTo(W / 2 * K, (H - 1) * K); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2 * K, H / 2 * K, 9.15 * K, 0, 6.283); ctx.stroke();
    [0, 1].forEach(function (s) {
      var x0 = s ? W - 1 - 16.5 : 1, x1 = s ? W - 1 - 5.5 : 1;
      ctx.strokeRect(x0 * K, (34 - 20.16) * K, 16.5 * K, 40.32 * K);
      ctx.strokeRect(x1 * K, (34 - 9.16) * K, 5.5 * K, 18.32 * K);
      ctx.fillStyle = "rgba(237,241,232,.9)"; ctx.fillRect((s ? W - 1 : 1 - 1.2) * K, (34 - 3.66) * K, 1.2 * K, 7.32 * K);
    });
    var r = 1.25 * K;
    for (var s = 0; s < 2; s++) T[s].forEach(function (p, i) {
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.arc(p.x * K + 2, p.y * K + 3, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = i === 0 ? "#edf1e8" : COL[s]; ctx.beginPath(); ctx.arc(p.x * K, p.y * K, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = i === 0 ? "#1b2a2e" : INK[s]; ctx.font = "800 " + Math.round(r * 1.15) + "px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(p.n), p.x * K, p.y * K + 1);
    });
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.arc(ball.x * K + 2 + ball.z * 2, ball.y * K + 3 + ball.z * 2, 0.6 * K, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x * K, (ball.y - ball.z * 0.35) * K, (0.62 + ball.z * 0.05) * K, 0, 6.283); ctx.fill();
  }
  var last = 0, visible = true, run = !reduce;
  function frame(ts) {
    if (!run) return;
    var dt = Math.min(0.05, ((ts - last) / 1000) || 0); last = ts;
    if (visible && !document.hidden) { step(dt); draw(); }
    requestAnimationFrame(frame);
  }
  /* sin animación si el sistema pide menos movimiento: se dibuja un instante del partido */
  for (var w = 0; w < 120; w++) step(1 / 30);
  draw();
  if (run) {
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
    requestAnimationFrame(function (ts) { last = ts; frame(ts); });
  }
})();
