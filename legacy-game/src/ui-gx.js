/* ui-gx.js — trofeos ampliados (5.6): trofeos de vóxeles que giran, avisos animados en cola,
   pantalla de trofeos con filtros, vitrina en «Yo» y ceremonia del platino.
   Los trofeos se dibujan como vóxeles en un lienzo 2D (caras planas con la misma luz que el estadio),
   así no se abre ningún contexto WebGL extra para un aviso. */
var GXV = (function () {
  /* ---------- modelos de vóxeles ---------- */
  var PAL = {
    b: ["#8a5228", "#c07a3e", "#e6a86a"], s: ["#7f8c93", "#c3cdd2", "#f4f8fa"], g: ["#a8740e", "#e8b52a", "#ffe58a"], p: ["#4f8fa3", "#9fe6f5", "#eafcff"],
    lock: ["#2a3a3f", "#3a4b50", "#4d6166"]
  };
  function key(x, y, z) { return x + "," + y + "," + z; }
  function model(rar) {
    var V = {}, c = PAL[rar] || PAL.b, base = "#20262b", base2 = "#30383e";
    function put(x, y, z, col) { V[key(x, y, z)] = col; }
    function disc(y, r, col, hollow) { for (var x = -7; x <= 7; x++) for (var z = -7; z <= 7; z++) { var d = Math.sqrt(x * x + z * z); if (d <= r + 0.35 && (!hollow || d > r - 0.95)) put(x, y, z, col); } }
    function box(x0, x1, y0, y1, z0, z1, col) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) put(x, y, z, col); }
    var big = rar === "g" || rar === "p";
    /* peana con franja del color de la rareza */
    box(-4, 4, 0, 0, -4, 4, base); box(-3, 3, 1, 1, -3, 3, base2); box(-3, 3, 2, 2, -3, 3, c[0]); box(-3, 3, 3, 3, -3, 3, base);
    if (rar === "lock") { box(-2, 2, 4, 9, -2, 2, c[1]); box(-1, 1, 10, 11, -1, 1, c[2]); return V; }
    /* pie y tallo */
    disc(4, 2, c[0]); disc(5, 1, c[1]); put(0, 6, 0, c[1]); put(0, 7, 0, c[1]); if (big) { put(0, 8, 0, c[1]); disc(8, 1, c[0]); }
    var y0 = big ? 9 : 8, prof = rar === "b" ? [1.6, 2.4, 3, 3.2, 3.2] : rar === "s" ? [1.6, 2.6, 3.2, 3.6, 3.8, 3.8] : [1.8, 2.8, 3.6, 4.1, 4.4, 4.6, 4.6];
    prof.forEach(function (r, i) { disc(y0 + i, r, i === prof.length - 1 ? c[2] : i % 2 ? c[1] : c[1], i > 0); });
    var top = y0 + prof.length - 1;
    /* asas */
    if (rar !== "b") {
      var hx = Math.round(prof[prof.length - 2]) + 1;
      for (var k = 0; k < 4; k++) { put(hx + (k === 1 || k === 2 ? 1 : 0), top - 1 - k, 0, c[1]); put(-hx - (k === 1 || k === 2 ? 1 : 0), top - 1 - k, 0, c[1]); }
    }
    /* estrella (oro) o diamante (platino) encima */
    if (rar === "g") { put(0, top + 1, 0, c[2]); put(0, top + 2, 0, c[2]); put(-1, top + 2, 0, c[2]); put(1, top + 2, 0, c[2]); put(0, top + 3, 0, c[2]); }
    if (rar === "p") { box(-1, 1, top + 2, top + 2, -1, 1, c[2]); put(0, top + 1, 0, c[1]); put(0, top + 3, 0, c[2]); put(0, top + 4, 0, "#ffffff"); }
    return V;
  }
  /* caras visibles (sin las que tocan otro vóxel) */
  var CACHE = {};
  /* modelos extra registrados por otros módulos (piezas de equipamiento): fn() → {"x,y,z": color} */
  var REG = {};
  function reg(k, fn) { REG[k] = fn; delete CACHE[k]; Object.keys(IMG).forEach(function (i) { if (i.indexOf(k) === 0) delete IMG[i]; }); }
  function faces(rar) {
    if (CACHE[rar]) return CACHE[rar];
    var V = REG[rar] ? REG[rar]() : model(rar), F = [], N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], miny = 99, maxy = -99, rad = 0;
    Object.keys(V).forEach(function (k) {
      var p = k.split(",").map(Number); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); rad = Math.max(rad, Math.hypot(p[0], p[2]) + 0.8);
      N.forEach(function (n) {
        if (V[key(p[0] + n[0], p[1] + n[1], p[2] + n[2])]) return;
        var q = [], ax = n[0] ? 0 : n[1] ? 1 : 2, a = (ax + 1) % 3, b = (ax + 2) % 3;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { var v = [p[0], p[1], p[2]]; v[ax] += n[ax] * 0.5; v[a] += s[0] * 0.5; v[b] += s[1] * 0.5; q.push(v); });
        F.push({q: q, n: n, c: V[k]});
      });
    });
    CACHE[rar] = {F: F, cy: (miny + maxy) / 2, h: maxy - miny + 1, r: rad};
    return CACHE[rar];
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 1) { var t = k - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; } else { r *= k; g *= k; b *= k; }
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }
  /* dibuja el trofeo girado «ang» (rad) dentro de un lienzo; brillo extra con «shine» (0..1) */
  function draw(cv, rar, ang, o) {
    o = o || {};
    var ctx = cv.getContext("2d"), W = cv.width, H = cv.height, M = faces(rar), sc = (o.scale || 1) * (o.fit ? Math.min(H / (M.h * 0.95 + M.r * 0.62 + 2), W / (M.r * 2.1)) : H / (M.h + 6)), ca = Math.cos(ang), sa = Math.sin(ang), tilt = 0.32, ct = Math.cos(tilt), stt = Math.sin(tilt);
    ctx.clearRect(0, 0, W, H);
    var L = [-0.45, 0.8, 0.4], ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
    var out = [];
    function tf(v) { var x = v[0] * ca + v[2] * sa, z = -v[0] * sa + v[2] * ca, y = v[1] - M.cy; var y2 = y * ct - z * stt, z2 = y * stt + z * ct; return [W / 2 + x * sc, H / 2 - y2 * sc + (o.dy || 0), z2]; }
    for (var i = 0; i < M.F.length; i++) {
      var f = M.F[i], n = f.n, nx = n[0] * ca + n[2] * sa, nz = -n[0] * sa + n[2] * ca, ny = n[1];
      var ny2 = ny * ct - nz * stt, nz2 = ny * stt + nz * ct;
      if (nz2 <= 0.001) continue;
      var P = f.q.map(tf), d = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4;
      var lam = Math.max(0, nx * L[0] + ny2 * L[1] + nz2 * L[2]), k = 0.5 + lam * 0.55;
      /* reflejo metálico: banda que pasa al girar */
      var spec = Math.pow(Math.max(0, nx * 0.35 + nz2 * 0.94), 18) * (o.metal == null ? 0.6 : o.metal) + (o.shine || 0) * Math.max(0, 1 - Math.abs(P[0][0] / W - (o.shineX || 0)) * 6) * 0.5;
      out.push({P: P, d: d, col: shade(f.c, k + spec)});
    }
    out.sort(function (a, b) { return a.d - b.d; });
    if (o.shadow !== false) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(W / 2, H / 2 + (M.h / 2 - 0.2) * sc * ct + (o.dy || 0) * 0 + 2, 5.2 * sc, 1.9 * sc, 0, 0, Math.PI * 2); ctx.fill(); }
    for (var j = 0; j < out.length; j++) {
      var q = out[j].P; ctx.fillStyle = out[j].col; ctx.strokeStyle = out[j].col; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  /* imagen fija (para listas y vitrina), en caché */
  var IMG = {};
  function img(rar, px) {
    var k = rar + px; if (IMG[k]) return IMG[k];
    try { var cv = document.createElement("canvas"); cv.width = cv.height = px; draw(cv, rar, -0.6, {}); IMG[k] = cv.toDataURL(); } catch (e) { IMG[k] = ""; }
    return IMG[k];
  }
  return {draw: draw, img: img, faces: faces, PAL: PAL, reg: reg, shade: shade};
})();

(function () {
  if (typeof UIX === "undefined" || typeof GX === "undefined") return;
  var U = UIX, h = U.h;
  function rm() { return document.documentElement.classList.contains("rm"); }
  var KICK = {b: N_("Trofeo de bronce"), s: N_("Trofeo de plata"), g: N_("Trofeo de oro"), p: N_("Trofeo de platino")};
  function rarName(r) { return tr(GX_RAR[r] ? GX_RAR[r].n : "Bronce"); }
  function money(n) { return typeof fmtMoney === "function" ? fmtMoney(n) : n + " €"; }
  function nameOf(id) { var m = GX.meta(id); if (m.n) return tr(m.n); var a = (typeof achList === "function" ? achList(true) : []).filter(function (x) { return x[0] === id; })[0]; return a ? (typeof achTranslate === "function" ? achTranslate(a[2]) : tr(a[2])) : id; }
  function descOf(id) { var m = GX.meta(id); if (m.d) return tr(m.d); var a = (typeof achList === "function" ? achList(true) : []).filter(function (x) { return x[0] === id; })[0]; return a ? (typeof achTranslate === "function" ? achTranslate(a[3]) : tr(a[3])) : ""; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function back(t) { var c = 1.70158 * 1.3; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  /* ---------- aviso en cola ---------- */
  var BUSY = false;
  function next() {
    var g = S && GX.st(); if (!g || !g.q.length || busyUI()) { BUSY = false; return; }
    BUSY = true;
    var id = g.q.shift(); U.persist();
    if (/^ch:/.test(id)) { chBanner(id.slice(3), function () { setTimeout(next, 180); }); return; }
    var m = GX.meta(id);
    if (m.rar === "p") { ceremony(id, next); return; }
    banner(id, m, function () { setTimeout(next, 180); });
  }
  /* reto superado: mismo aviso, con la pieza que se desbloquea girando */
  function chBanner(cid, done) {
    var c = typeof GXC !== "undefined" ? GXC.get(cid) : null; if (!c) { done(); return; }
    var gift = (GX.st().ch[cid] || {}).gift, item = c.item || gift, it = item && typeof GXI !== "undefined" ? GXI.item(item) : null;
    var key = it ? (it.own === "pet" ? null : "gi:" + item + ":0") : null; if (key && typeof GXG !== "undefined") GXG.icon(item, 0, 16);
    banner(cid, {rar: "s"}, done, {kick: tr("Reto superado"), n: tr(c.n), d: it ? (c.pet ? tr("Regalo para tu mascota: {x}", {x: tr(it.n)}) : tr("Desbloqueado en la tienda: {x}", {x: tr(it.n)})) : tr(c.d), key: key || "s", rw: 0, tap: "shop"});
  }
  function banner(id, m, done, o) {
    o = o || {};
    var t0 = performance.now(), T = rm() ? 2600 : 4300, rw = o.rw != null ? o.rw : (GX.st().t[id] || {}).$ || 0;
    var el = document.createElement("div"); el.className = "gxb gx-" + m.rar; el.setAttribute("role", "status");
    el.innerHTML = '<canvas width="168" height="168" aria-hidden="true"></canvas><div class="gxb-t"><small>' + h(o.kick || tr(KICK[m.rar] || KICK.b)) + "</small><b>" + h(o.n || nameOf(id)) + "</b><span>" + h(o.d || descOf(id)) + "</span>" +
      (rw ? '<em class="gxb-m">+<i>0</i></em>' : "") + "</div><span class=\"gxb-sh\" aria-hidden=\"true\"></span>";
    document.body.appendChild(el);
    var cv = el.querySelector("canvas"), mi = el.querySelector(".gxb-m i"), closed = false, raf = 0;
    el.addEventListener("click", function () { close(); if (o.tap === "shop") { U.ui().sh = {tab: "chal"}; U.open("shop"); return; } U.ui().gxF = {st: "on"}; U.open("ach"); });
    if (typeof Anim !== "undefined" && Anim.haptic) try { Anim.haptic(m.rar === "g" ? "big" : "ok"); } catch (e) {}
    try { if (typeof SpModes !== "undefined" && SpModes.AU && SpModes.AU.fx) SpModes.AU.fx(m.rar === "g" ? "cheer" : "coin"); } catch (e) {}
    function frame(now) {
      if (closed) return;
      var t = (now - t0) / 1000;
      /* entrada: anticipación hacia arriba, caída con rebote y aplastamiento al llegar */
      var a = Math.min(1, t / 0.55), y = t < 0.08 ? -6 * (t / 0.08) : (1 - back(Math.min(1, (t - 0.08) / 0.5))) * -140;
      var sq = t > 0.5 && t < 0.72 ? Math.sin((t - 0.5) / 0.22 * Math.PI) * 0.06 : 0;
      el.style.transform = "translate(-50%," + y.toFixed(1) + "%) scale(" + (1 + sq).toFixed(3) + "," + (1 - sq).toFixed(3) + ")";
      el.style.opacity = Math.min(1, a * 1.6).toFixed(2);
      /* trofeo: aparece con escala elástica y un giro que frena */
      var ts = t < 0.25 ? 0 : Math.min(1, back(Math.min(1, (t - 0.25) / 0.45))), spin = -0.6 + (1 - ease(Math.min(1, t / 1.6))) * Math.PI * 4 + Math.sin(t * 1.4) * 0.25;
      var bob = Math.sin(t * 2.6) * 2;
      GXV.draw(cv, o.key || m.rar, spin, {scale: ts, dy: bob, shine: t > 0.9 && t < 1.6 ? 1 : 0, shineX: (t - 0.9) / 0.7, metal: m.rar === "b" ? 0.35 : 0.7});
      if (mi) mi.textContent = money(Math.round(rw * ease(Math.min(1, Math.max(0, t - 0.6) / 0.9)))).replace(/^\+/, "");
      if (t * 1000 > T) { close(); return; }
      if (t > 0.3 && busyUI()) { if (!o.n && t < 2.5) GX.st().q.unshift(id); close(); return; }
      raf = requestAnimationFrame(frame);
    }
    function close() {
      if (closed) return; closed = true; cancelAnimationFrame(raf);
      el.classList.add("out");
      setTimeout(function () { el.remove(); done(); }, rm() ? 60 : 380);
    }
    raf = requestAnimationFrame(frame);
  }
  /* ---------- ceremonia del platino ---------- */
  function ceremony(id, done) {
    var m = GX.meta(id), el = document.createElement("div"); el.className = "gxc"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<canvas class="gxc-fx" aria-hidden="true"></canvas><canvas class="gxc-cup" width="440" height="440" aria-hidden="true"></canvas><div class="gxc-t"><small>' + h(tr("Trofeo de platino")) + "</small><h2>" + h(nameOf(id)) + "</h2><p>" + h(descOf(id)) + "</p>" +
      (m.x && m.x.title ? '<p class="gxc-ti">' + h(tr("Nuevo título: «{t}»", {t: tr(m.x.title)})) + "</p>" : "") + '<button class="btn" data-gx="ok">' + h(tr("¡Leyenda!")) + "</button></div>";
    document.body.appendChild(el);
    var fx = el.querySelector(".gxc-fx"), cup = el.querySelector(".gxc-cup"), t0 = performance.now(), raf = 0, parts = [], closed = false;
    function size() { fx.width = innerWidth; fx.height = innerHeight; }
    size();
    var cols = ["#9fe6f5", "#eafcff", "#ffb21e", "#ffffff", "#4f8fa3"];
    for (var i = 0; i < (rm() ? 0 : 90); i++) parts.push({x: Math.random() * innerWidth, y: -Math.random() * innerHeight * 0.8, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 120, s: 4 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 6, c: cols[i % cols.length]});
    try { if (typeof SpModes !== "undefined" && SpModes.AU) SpModes.AU.fx("cheer"); } catch (e) {}
    function frame(now) {
      if (closed) return;
      var t = (now - t0) / 1000, dt = 1 / 60, cx = fx.getContext("2d");
      cx.clearRect(0, 0, fx.width, fx.height);
      if (t > 0.9) parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; if (p.y > fx.height + 10) { p.y = -10; p.x = Math.random() * fx.width; } cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7); cx.fillStyle = "rgba(0,0,0,.18)"; cx.fillRect(-p.s / 2, p.s * 0.1, p.s, p.s * 0.25); cx.restore(); });
      /* el trofeo baja un poco (anticipación), sube desde abajo y se asienta girando */
      var rise = t < 0.25 ? 0.06 * (t / 0.25) : -(1 - back(Math.min(1, (t - 0.25) / 1.1))) * 0.9 + 0.06 * Math.max(0, 1 - (t - 0.25) / 0.3);
      GXV.draw(cup, "p", -0.5 + (1 - ease(Math.min(1, t / 2.6))) * Math.PI * 6 + t * 0.35, {scale: 0.95, dy: rise * 440 + Math.sin(t * 2) * 4, shine: (t % 3) < 0.8 ? 1 : 0, shineX: (t % 3) / 0.8, metal: 0.9});
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    el.querySelector('[data-gx="ok"]').addEventListener("click", function () {
      closed = true; cancelAnimationFrame(raf); el.classList.add("out");
      setTimeout(function () { el.remove(); done(); }, rm() ? 60 : 420);
    });
    if (typeof Anim !== "undefined" && Anim.haptic) try { Anim.haptic("big"); } catch (e) {}
  }
  /* no tapa nada: espera a que se cierren el mundo de la mascota, los minijuegos, el directo y las animaciones */
  function busyUI() { return !!document.querySelector(".pw, .spo, #live, .gup, .gxc, .mg, .sheet .shp"); }
  U.gxNotify = function () { if (!BUSY && S && GX.st().q.length && !busyUI()) next(); };

  /* ---------- pantalla de trofeos ---------- */
  var old = U.sheets.ach;
  function mode() { return S && S.mode === "mgr" ? "m" : "p"; }
  function all() {
    var md = mode(), l = achList(true).map(function (a) { var m = GX.meta(a[0]); return {id: a[0], cat: m.cat, rar: m.rar, hide: !!(m.hide || a[5]), n: typeof achTranslate === "function" ? achTranslate(a[2]) : tr(a[2]), d: typeof achTranslate === "function" ? achTranslate(a[3]) : tr(a[3])}; });
    return l;
  }
  U.sheets.ach = function () {
    if (!S) return old ? old() : "";
    if (typeof achCheck === "function") achCheck();
    setTimeout(countUp, 40);
    var F = U.ui().gxF = U.ui().gxF || {st: "all", cat: "", rar: ""}, L = all(), g = GX.st(), got = L.filter(function (x) { return S.ach[x.id]; }), pct = L.length ? Math.round(got.length / L.length * 100) : 0;
    var byR = {b: [0, 0], s: [0, 0], g: [0, 0], p: [0, 0]}; L.forEach(function (x) { var r = byR[x.rar] || byR.b; r[1]++; if (S.ach[x.id]) r[0]++; });
    var s = '<h2>' + h(tr("Trofeos")) + '</h2><div class="stack gxs">';
    s += '<div class="gxs-top"><div class="gxs-pct" data-gxpct="' + pct + '"><b>0</b><small>%</small></div><div class="grow"><div class="gxs-bar"><i style="--w:' + pct + '%"></i></div><small class="muted">' +
      h(tr("{n} de {t} trofeos de esta carrera", {n: got.length, t: L.length})) + "</small>" +
      '<div class="gxs-rar">' + ["p", "g", "s", "b"].map(function (r) { return '<button data-a="gxrar" data-v="' + r + '" class="gxr gx-' + r + (F.rar === r ? " on" : "") + '" aria-pressed="' + (F.rar === r) + '"><img src="' + GXV.img(r, 48) + '" alt="" width="24" height="24"><span>' + byR[r][0] + "/" + byR[r][1] + "</span></button>"; }).join("") + "</div></div></div>";
    s += '<div class="seg gxs-st">' + [["all", N_("Todos")], ["on", N_("Conseguidos")], ["off", N_("Pendientes")]].map(function (x) { return '<button data-a="gxst" data-v="' + x[0] + '" aria-pressed="' + (F.st === x[0]) + '">' + h(tr(x[1])) + "</button>"; }).join("") + "</div>";
    /* categorías con barra de progreso */
    var cats = GX_CATS.filter(function (c) { return L.some(function (x) { return x.cat === c[0]; }); });
    s += '<div class="gxs-cats">' + '<button data-a="gxcat" data-v="" aria-pressed="' + (!F.cat) + '" class="gxc-b"><span>🏆</span><b>' + h(tr("Todas")) + "</b></button>" + cats.map(function (c) {
      var n = L.filter(function (x) { return x.cat === c[0]; }), k = n.filter(function (x) { return S.ach[x.id]; }).length;
      return '<button data-a="gxcat" data-v="' + c[0] + '" aria-pressed="' + (F.cat === c[0]) + '" class="gxc-b"><span aria-hidden="true">' + c[2] + "</span><b>" + h(tr(c[1])) + '</b><i class="gxs-mini"><i style="--w:' + Math.round(k / n.length * 100) + '%"></i></i><small>' + k + "/" + n.length + "</small></button>";
    }).join("") + "</div>";
    var vis = L.filter(function (x) { var on = !!S.ach[x.id]; return (F.st === "all" || (F.st === "on") === on) && (!F.cat || x.cat === F.cat) && (!F.rar || x.rar === F.rar); });
    vis.sort(function (a, b) { var A = S.ach[a.id] ? 1 : 0, B = S.ach[b.id] ? 1 : 0; if (A !== B) return B - A; if (A) return ((g.t[b.id] || {}).d || 0) - ((g.t[a.id] || {}).d || 0); return "psgb".indexOf(a.rar) - "psgb".indexOf(b.rar); });
    s += '<ul class="gxl">' + vis.map(function (x) {
      var on = !!S.ach[x.id], sec = x.hide && !on, t = g.t[x.id], pr = GX.prog(x.id);
      return '<li class="gxi gx-' + x.rar + (on ? " on" : "") + '"><img src="' + GXV.img(sec ? "lock" : x.rar, 64) + '" alt="" width="40" height="40"><span class="grow"><b>' + h(sec ? "???" : x.n) + '</b><small>' + h(sec ? tr("Trofeo oculto: sigue jugando para descubrirlo.") : x.d) + "</small>" +
        (pr && !on ? '<span class="gxp"><i style="--w:' + Math.round(pr[0] / pr[1] * 100) + '%"></i><em>' + fmtN(pr[0]) + " / " + fmtN(pr[1]) + "</em></span>" : "") +
        (on ? '<small class="gxd">' + h(seasonLabel(t ? t.y : S.ach[x.id])) + (t && t.m ? " · " + h(t.m) : "") + (t && t.$ ? " · +" + h(money(t.$)) : "") + "</small>" : "") +
        '</span><span class="gxi-r">' + h(rarName(x.rar)) + "</span></li>";
    }).join("") + (vis.length ? "" : '<li class="muted">' + h(tr("Nada por aquí con estos filtros.")) + "</li>") + "</ul>";
    var gc = U.achG ? U.achG() : null;
    if (gc) s += '<p class="muted" style="margin:0;font-size:var(--fs-xs)">' + h(tr("En todas tus partidas: {n} de {t} logros clásicos.", {n: gc[0], t: gc[1]})) + "</p>";
    return s + '<button class="btn wide" data-a="close">' + h(tr("Cerrar")) + "</button></div>";
  };
  function fmtN(n) { return gxNum(n); }
  U.actions.gxst = function (b, v) { U.ui().gxF.st = v; U.renderSheet(); };
  U.actions.gxcat = function (b, v) { U.ui().gxF.cat = v; U.renderSheet(); };
  U.actions.gxrar = function (b, v) { var F = U.ui().gxF; F.rar = F.rar === v ? "" : v; U.renderSheet(); };
  /* porcentaje que cuenta hacia arriba al abrir */
  function countUp() {
    var e = document.querySelector(".gxs-pct[data-gxpct]:not(.run)"); if (!e) return;
    e.classList.add("run"); var to = +e.getAttribute("data-gxpct"), b = e.querySelector("b"), t0 = performance.now();
    if (rm()) { b.textContent = to; return; }
    (function f(now) { var k = Math.min(1, (now - t0) / 900); b.textContent = Math.round(to * ease(k)); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  U.add("after", countUp);
  /* cola de avisos: se mira después de cada pintado */
  U.add("after", function () { if (S && U.ui().view === "game") setTimeout(U.gxNotify, 250); });

  /* ---------- vitrina en «Yo» ---------- */
  function vitrina(md) {
    var g = GX.st(); if (!g) return "";
    var ids = Object.keys(S.ach || {}).filter(function (id) { var m = GX.meta(id); return (m.rar === "g" || m.rar === "p") && (m.mode === md || m.mode === "b"); });
    ids.sort(function (a, b) { var A = GX.meta(a).rar === "p" ? 1 : 0, B = GX.meta(b).rar === "p" ? 1 : 0; return B - A || ((g.t[b] || {}).d || 0) - ((g.t[a] || {}).d || 0); });
    var shelf = ids.slice(0, 8), slots = [];
    for (var i = 0; i < 8; i++) slots.push(shelf[i] ? '<span class="gxv-s gx-' + GX.meta(shelf[i]).rar + '" title="' + h(nameOf(shelf[i])) + '" style="--d:' + (i * 70) + 'ms"><img src="' + GXV.img(GX.meta(shelf[i]).rar, 120) + '" alt="' + h(nameOf(shelf[i])) + '" width="60" height="60"></span>' : '<span class="gxv-s empty" aria-hidden="true"></span>');
    return '<button class="card gxv" data-a="gxvit"><span class="gxv-h"><b>' + h(tr("Vitrina")) + "</b><small>" + h(ids.length ? trn(ids.length, "{n} trofeo de oro o platino", "{n} trofeos de oro o platino") : tr("Aquí lucirán tus trofeos de oro y platino.")) + '</small><span class="chev" aria-hidden="true">›</span></span><span class="gxv-sh">' + slots.slice(0, 4).join("") + '</span><span class="gxv-sh">' + slots.slice(4).join("") + "</span></button>";
  }
  U.actions.gxvit = function () { U.ui().gxF = {st: "on", cat: "", rar: ""}; U.open("ach"); };
  U.add("jugador", function () { return S && S.p && !U.isMgr() ? vitrina("p") : ""; });
  U.gxVitrina = vitrina;
})();
