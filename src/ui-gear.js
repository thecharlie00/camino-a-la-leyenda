/* ui-gear.js — equipamiento en «Yo» (5.6): ranuras con piezas de vóxeles, tiers, conjuntos,
   comparación con lo que llevas, mejora con dinero y materiales (con su animación) y tope visible. */
var GXG = (function () {
  /* ---------- modelos de vóxeles de cada ranura ---------- */
  function hex(c, k) { return GXV.shade(c, k); }
  function make(slot, c, c2, tc) {
    var V = {};
    function put(x, y, z, col) { V[x + "," + y + "," + z] = col; }
    function box(x0, x1, y0, y1, z0, z1, col) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) put(x, y, z, col); }
    function ring(y0, y1, r, col, r0) { for (var x = -r - 1; x <= r + 1; x++) for (var z = -r - 1; z <= r + 1; z++) { var d = Math.sqrt(x * x + z * z); if (d <= r + 0.4 && d > (r0 != null ? r0 : r - 1.1)) for (var y = y0; y <= y1; y++) put(x, y, z, col); } }
    var d = hex(c, 0.7), l = hex(c, 1.15);
    switch (slot) {
      case "boots": box(-4, 4, 0, 0, -2, 2, "#1b1d1f"); box(-4, 4, 1, 2, -2, 2, c); box(-4, -1, 3, 5, -2, 2, c); box(-4, -2, 6, 6, -1, 1, l); box(0, 4, 3, 3, -1, 1, l); box(-3, 3, 2, 2, -2, -2, tc); box(-3, 3, 2, 2, 2, 2, tc);
        [[-3, -1], [-3, 1], [0, -1], [0, 1], [3, -1], [3, 1]].forEach(function (s) { put(s[0], -1, s[1], c2 || "#cfd8dc"); }); break;
      case "shin": box(-2, 2, 0, 8, 0, 0, c); box(-3, -3, 1, 7, 1, 1, d); box(3, 3, 1, 7, 1, 1, d); box(-1, 1, 2, 6, -1, -1, tc); box(-2, 2, 8, 8, 1, 1, l); break;
      case "socks": ring(0, 8, 2, c); ring(5, 6, 2, tc); box(-2, 2, 0, 1, 2, 4, c); box(-1, 1, 0, 0, 3, 5, d); break;
      case "wrist": ring(0, 3, 3, c, 1.8); ring(1, 2, 3.4, tc, 2.9); break;
      case "band": ring(0, 2, 4, c, 3.1); ring(1, 1, 4.4, tc, 3.9); box(3, 4, -2, 0, 3, 4, c); break;
      case "gloves": box(-3, 3, 0, 5, -1, 1, c); box(-3, 3, 0, 1, -1, 1, c2 || d); [-3, -1, 1, 3].forEach(function (x) { box(x, x, 6, 9, -1, 0, c); }); box(4, 5, 2, 5, -1, 0, c); box(-3, 3, 3, 3, 1, 1, tc); break;
      case "therm": box(-3, 3, 0, 7, -1, 1, c); box(-7, -4, 4, 7, -1, 1, c); box(4, 7, 4, 7, -1, 1, c); box(-7, -6, 0, 3, -1, 1, d); box(6, 7, 0, 3, -1, 1, d); box(-1, 1, 7, 7, 1, 1, tc); box(-3, 3, 0, 0, -1, 1, tc); break;
      case "hood": box(-3, 3, 0, 6, -1, 1, c); box(-6, -4, 2, 6, -1, 1, c); box(4, 6, 2, 6, -1, 1, c); box(-2, 2, 7, 10, -1, 2, c); box(-1, 1, 8, 9, 2, 2, "#141a1c"); box(-2, 2, 1, 2, 2, 2, d); box(-3, 3, 0, 0, -1, 1, tc); break;
      case "phones": for (var a = 0; a <= 8; a++) { var ang = Math.PI * a / 8, x = Math.round(Math.cos(ang) * 5), y = Math.round(Math.sin(ang) * 5) + 3; put(x, y, 0, c); put(x, y, 1, c); } box(-6, -4, 0, 3, -1, 2, c2 || d); box(4, 6, 0, 3, -1, 2, c2 || d); box(-6, -6, 1, 2, -1, 2, tc); box(6, 6, 1, 2, -1, 2, tc); break;
      case "arm": ring(0, 3, 3, c, 2.1); box(-1, 1, 1, 2, 3, 4, tc); box(0, 0, 1, 2, 4, 4, "#1d1404"); break;
      case "neck": for (var b = 0; b < 12; b++) { var t = Math.PI * 2 * b / 12; put(Math.round(Math.cos(t) * 4), 6 + Math.round(Math.sin(t) * 1.2), Math.round(Math.sin(t) * 2), c2 || "#cfd8dc"); } box(-1, 1, 1, 4, 0, 0, c); box(0, 0, 2, 3, 1, 1, tc); put(0, 5, 0, c); break;
      case "watch": box(-1, 1, 0, 9, 0, 0, c2 || "#1b1d1f"); box(-2, 2, 3, 6, -1, 1, c); box(-1, 1, 4, 5, 2, 2, "#e8eef0"); put(0, 5, 2, tc); put(0, 4, 2, "#1d1404"); box(3, 3, 4, 5, 0, 0, tc); break;
      case "suit": box(-3, 3, 0, 8, -1, 1, c); box(-6, -4, 2, 8, -1, 1, c); box(4, 6, 2, 8, -1, 1, c); box(-1, 1, 3, 8, 2, 2, "#f4f4f0"); box(0, 0, 3, 7, 2, 2, c2 || "#7a1d1d"); box(-2, -2, 4, 8, 2, 2, tc); box(2, 2, 4, 8, 2, 2, tc); break;
      case "coat": box(-4, 4, 0, 9, -1, 1, c); box(-7, -5, 2, 9, -1, 1, c); box(5, 7, 2, 9, -1, 1, c); box(-3, 3, 9, 10, -1, 1, d); box(0, 0, 0, 8, 2, 2, tc); [2, 4, 6].forEach(function (y) { put(-1, y, 2, "#1d1404"); }); break;
      case "shoes": box(-4, 4, 0, 0, -2, 2, "#1b1d1f"); box(-4, 4, 1, 2, -2, 2, c); box(-4, -1, 3, 4, -2, 2, c); box(1, 4, 3, 3, -1, 1, l); box(-4, 4, 1, 1, -2, -2, tc); break;
      case "tie": box(-1, 1, 9, 10, 0, 0, c); box(-1, 1, 2, 8, 0, 0, c); box(0, 0, 0, 1, 0, 0, c); [3, 5, 7].forEach(function (y) { put(0, y, 1, tc); }); break;
      case "glasses": box(-5, -1, 2, 4, 0, 0, c); box(1, 5, 2, 4, 0, 0, c); box(-4, -2, 3, 3, 1, 1, c2 || "#2a3a40"); box(2, 4, 3, 3, 1, 1, c2 || "#2a3a40"); box(0, 0, 4, 4, 0, 0, tc); box(-6, -6, 3, 4, -4, 0, c); box(6, 6, 3, 4, -4, 0, c); break;
      case "scarf": box(-4, 4, 6, 8, -1, 1, c); box(2, 4, 0, 6, 1, 2, c); [1, 3, 5].forEach(function (y) { box(2, 4, y, y, 1, 2, tc); }); box(-4, 4, 7, 7, 2, 2, tc); break;
      case "notes": box(-3, 3, 0, 8, 0, 1, c); box(-3, -3, 0, 8, 2, 2, tc); box(-2, 2, 6, 6, 2, 2, "#e8eef0"); box(-2, 1, 4, 4, 2, 2, "#e8eef0"); box(-2, 2, 2, 2, 2, 2, "#e8eef0"); break;
      default: box(-3, 3, 0, 6, -1, 1, c); box(-2, 2, 6, 6, 2, 2, tc);
    }
    return V;
  }
  function icon(id, tier, px) {
    var it = GXI.item(id); if (!it) return "";
    var k = "gi:" + id + ":" + tier, t = GX_TIERS[tier] || GX_TIERS[0];
    if (!icon.r[k]) { icon.r[k] = 1; GXV.reg(k, function () { return make(it.slot, it.look.c || "#8a979a", it.look.c2, t.c); }); }
    return GXV.img(k, px || 96);
  }
  icon.r = {};
  return {make: make, icon: icon};
})();

(function () {
  if (typeof UIX === "undefined" || typeof GXI === "undefined") return;
  var U = UIX, h = U.h;
  function rm() { return document.documentElement.classList.contains("rm"); }
  function money(n) { return fmtMoney(n); }
  function who() { return S && S.mode === "mgr" ? "m" : "p"; }
  function statName(k) {
    if (/^[A-Z]{3}$/.test(k)) { var kk = who() === "p" && typeof isGK === "function" && isGK() ? GX_GKMAP[k] || k : k; return tr(ATT_NAMES[kk] || kk); }
    return tr(GX_STATN[k] || k);
  }
  function chips(st, ref) {
    var keys = Object.keys(st); if (ref) Object.keys(ref).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    return keys.map(function (k) {
      var v = st[k] || 0, d = ref ? v - (ref[k] || 0) : null;
      if (ref && !d) return "";
      var x = ref ? d : v;
      return '<span class="chip ' + (x > 0 ? "up" : "down") + '">' + (x > 0 ? "+" : "−") + Math.abs(x) + " " + h(statName(k)) + "</span>";
    }).join("");
  }
  function tierTag(t) { var T = GX_TIERS[t]; return '<span class="gt-tag gt' + t + '">' + h(tr(T.n)) + "</span>"; }
  function slotName(sl, w) { var L = GX_SLOTS[w] || GX_SLOTS.p; for (var i = 0; i < L.length; i++) if (L[i][0] === sl) return tr(L[i][1]); return sl; }
  function slotsFor(w) { var L = GX_SLOTS[w]; if (w === "p" && typeof isGK === "function" && !isGK()) return L; return L; }

  /* ---------- tarjeta en «Yo» ---------- */
  function card(w) {
    var g = GXI.gear(w); if (!g) return "";
    var b = GXI.bonus(w), tot = 0; Object.keys(b).forEach(function (k) { if (/^[A-Z]{3}$/.test(k) || w === "m") tot += Math.max(0, b[k]); });
    var mini = slotsFor(w).map(function (s) { var id = g.eq[s[0]]; return '<span class="gq' + (id ? " gt" + g.own[id].t : "") + '">' + (id ? '<img src="' + GXG.icon(id, g.own[id].t, 64) + '" alt="" width="26" height="26">' : "") + "</span>"; }).join("");
    return '<button class="card gcard" data-a="gearopen"><span class="gcard-h"><b>' + h(tr("Equipamiento")) + "</b><small>" + h(tot ? tr("Tu equipamiento suma {n} puntos.", {n: Math.round(tot)}) : tr("Equípate para sumar a tus atributos.")) + '</small><span class="chev" aria-hidden="true">›</span></span><span class="gq-row">' + mini + "</span></button>";
  }
  U.add("jugador", function () { return S && S.p && !U.isMgr() ? card("p") : ""; });
  /* migración al cargar: los cosméticos de antes ya suman desde el primer momento */
  U.add("after", function () { try { if (S && S.p && S.mode !== "mgr" && S.p.life && !S.p.life.gear) { GXI.gear("p"); GXI.syncLook(); U.persist(); } } catch (e) {} });
  U.gearCard = card;
  U.actions.gearopen = function (b, v) { U.ui().gr = {w: v || who(), s: U.ui().gr && U.ui().gr.s || null, tab: "eq"}; U.open("gear"); };

  /* ---------- hoja de equipamiento ---------- */
  U.sheets.gear = function () {
    var ui = U.ui().gr = U.ui().gr || {w: who(), s: null, tab: "eq"}, w = ui.w, g = GXI.gear(w); if (!g) return "";
    var raw = GXI.raw(w), cap = GXI.capped(raw), sc = GXI.setCount(g, w);
    var s = "<h2>" + h(tr("Equipamiento")) + '</h2><div class="stack gs">';
    if (U.gearTabs) s += U.gearTabs(ui);
    if (ui.tab !== "eq" && U.gearTab) return s + U.gearTab(ui) + "</div>";
    /* resumen: lo que suma y el tope */
    var keys = Object.keys(raw).filter(function (k) { return raw[k]; });
    s += '<div class="gs-sum">' + (keys.length ? keys.map(function (k) {
      var v = cap[k], r = raw[k], lim = /^[A-Z]{3}$/.test(k) ? GX_CAP.att : GX_CAP.extra, capd = r > 0 && v < r - 0.5;
      return '<div class="gs-at"><span>' + h(statName(k)) + '</span><i class="gs-b"><i style="--w:' + Math.round(Math.max(0, v) / lim * 100) + '%"></i></i><b class="' + (v < 0 ? "neg" : "") + '">' + (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + "</b>" + (capd ? '<small title="' + h(tr("Tope")) + '">' + h(tr("tope")) + "</small>" : "") + "</div>";
    }).join("") : '<p class="muted" style="margin:0">' + h(tr("Aún no llevas nada que sume. Toca una ranura para equiparte.")) + "</p>") + "</div>";
    if (w === "p") s += '<p class="muted gs-note">' + h(tr("El equipamiento suma con rendimientos decrecientes: hasta +{a} por atributo y +{t} en total.", {a: GX_CAP.att, t: GX_CAP.total})) + "</p>";
    /* materiales */
    s += '<div class="gs-mat">' + GX_MATS.map(function (m) { return '<span class="gm" style="--mc:' + m[2] + '"><i aria-hidden="true"></i>' + h(tr(m[1])) + " <b>" + (g.mat[m[0]] || 0) + "</b></span>"; }).join("") + "</div>";
    /* ranuras */
    s += '<div class="gs-slots">' + slotsFor(w).map(function (sl, i) {
      var id = g.eq[sl[0]], t = id ? g.own[id].t : -1, n = Object.keys(g.own).filter(function (k) { var it = GXI.item(k); return it && it.slot === sl[0] && it.own === w; }).length;
      return '<button class="gsl' + (ui.s === sl[0] ? " on" : "") + (id ? " gt" + t : " empty") + '" data-a="gearslot" data-v="' + sl[0] + '" style="--d:' + (i * 30) + 'ms" aria-pressed="' + (ui.s === sl[0]) + '">' + (id ? '<img src="' + GXG.icon(id, t, 96) + '" alt="" width="44" height="44">' : '<span class="gsl-e" aria-hidden="true">+</span>') + "<small>" + h(sl[1] ? tr(sl[1]) : sl[0]) + "</small>" + (n ? '<em>' + n + "</em>" : "") + "</button>";
    }).join("") + "</div>";
    /* conjuntos */
    var sets = GX_SETS.filter(function (x) { return sc[x.k]; });
    if (sets.length) s += '<div class="gs-sets">' + sets.map(function (x) { var n = sc[x.k], full = n >= x.need, on3 = n >= 3; return '<div class="gset' + (full ? " full" : on3 ? " half" : "") + '"><b>' + h(tr(x.n)) + "</b><small>" + n + "/" + x.need + "</small><span>" + chips(full ? x.bAll : x.b3) + "</span></div>"; }).join("") + "</div>";
    /* piezas de la ranura elegida */
    if (ui.s) s += slotPanel(w, ui.s, g);
    return s + '<button class="btn wide" data-a="close">' + h(tr("Cerrar")) + "</button></div>";
  };
  function slotPanel(w, sl, g) {
    var cur = g.eq[sl], curSt = cur ? GXI.stats(cur, g.own[cur].t, w) : {};
    var mine = Object.keys(g.own).map(GXI.item).filter(function (it) { return it && it.slot === sl && it.own === w; });
    mine.sort(function (a, b) { return (b.id === cur) - (a.id === cur) || g.own[b.id].t - g.own[a.id].t; });
    var s = '<section class="gs-panel"><h3>' + h(slotName(sl, w)) + "</h3>";
    if (!mine.length) s += '<p class="muted">' + h(tr("No tienes ninguna pieza para esta ranura.")) + "</p>";
    s += mine.map(function (it) {
      var t = g.own[it.id].t, st = GXI.stats(it.id, t, w), on = it.id === cur, up = GXI.upCost(it.id, w), can = GXI.canUp(it.id, w), set = it.set ? GXI.set(it.set) : null;
      return '<div class="gpc gt' + t + (on ? " on" : "") + '"><img src="' + GXG.icon(it.id, t, 120) + '" alt="" width="54" height="54"><div class="grow"><b>' + h(tr(it.n)) + "</b> " + tierTag(t) +
        '<div class="gpc-st">' + chips(st) + "</div>" + (!on && cur ? '<div class="gpc-cmp"><small>' + h(tr("Frente a lo que llevas:")) + "</small> " + (chips(st, curSt) || '<span class="muted">' + h(tr("igual")) + "</span>") + "</div>" : "") +
        (set ? '<small class="muted">' + h(tr(set.n)) + "</small>" : "") +
        '<div class="gpc-a"><button class="btn sm' + (on ? "" : " pri") + '" data-a="gearwear" data-v="' + it.id + '">' + h(on ? tr("Quitar") : tr("Equipar")) + "</button>" +
        (up ? '<button class="btn sm" data-a="gearup" data-v="' + it.id + '"' + (can ? "" : " disabled") + ">" + h(tr("Mejorar a {t}", {t: tr(GX_TIERS[up.to].n)})) + "<small>" + h(money(up.money)) + " · " + up.cu + " " + h(tr("cuero")) + (up.fi ? " · " + up.fi + " " + h(tr("fibra")) : "") + (up.es ? " · " + up.es + " ★" : "") + "</small></button>" : '<span class="gt-max">' + h(tr("Tier máximo")) + "</span>") + "</div></div></div>";
    }).join("");
    if (U.gearShopLink) s += U.gearShopLink(w, sl);
    return s + "</section>";
  }
  U.actions.gearslot = function (b, v) { var ui = U.ui().gr; ui.s = ui.s === v ? null : v; U.renderSheet(); setTimeout(function () { var p = document.querySelector(".gs-panel"); if (p && p.scrollIntoView) p.scrollIntoView({behavior: rm() ? "auto" : "smooth", block: "nearest"}); }, 30); };
  U.actions.gearwear = function (b, v) { GXI.equip(v, U.ui().gr.w); U.persist(); U.renderSheet(); U.render(false); try { Anim.haptic("tap"); } catch (e) {} };
  U.actions.gearup = function (b, v) {
    var w = U.ui().gr.w, t = GXI.upgrade(v, w); if (!t) return;
    U.persist(); upAnim(v, t, function () { U.renderSheet(); U.render(false); });
  };
  /* ---------- animación de mejora: la pieza sube, gira, se aplasta al caer y estalla en chispas del color del tier ---------- */
  function upAnim(id, t, done) {
    var T = GX_TIERS[t], el = document.createElement("div"); el.className = "gup"; el.style.setProperty("--tc", T.c);
    el.innerHTML = '<canvas class="gup-fx" aria-hidden="true"></canvas><canvas class="gup-c" width="360" height="360" aria-hidden="true"></canvas><div class="gup-t"><small>' + h(tr("¡Mejorada!")) + "</small><b>" + h(tr(GXI.item(id).n)) + "</b>" + '<span class="gt-tag gt' + t + '">' + h(tr(T.n)) + "</span></div>";
    document.body.appendChild(el);
    var cv = el.querySelector(".gup-c"), fx = el.querySelector(".gup-fx"), k0 = "gi:" + id + ":" + (t - 1), k1 = "gi:" + id + ":" + t, t0 = performance.now(), parts = [], raf;
    GXG.icon(id, t - 1, 32); GXG.icon(id, t, 32);
    fx.width = 360; fx.height = 360;
    try { if (typeof SpModes !== "undefined" && SpModes.AU) SpModes.AU.fx("coin"); Anim.haptic("ok"); } catch (e) {}
    var dur = rm() ? 0.9 : 2.1, burst = false;
    function frame(now) {
      var s = (now - t0) / 1000, k = Math.min(1, s / dur);
      /* anticipación (baja), sube girando rápido, cambio de tier en lo alto, cae con aplastamiento */
      var y = s < 0.18 ? 10 * (s / 0.18) : s < 0.9 ? 10 - 70 * Math.sin((s - 0.18) / 0.72 * Math.PI / 2) : -60 + 60 * Math.min(1, Math.pow((s - 0.9) / 0.35, 2));
      var spin = s < 0.9 ? s * s * 14 : 11.3 + (s - 0.9) * 1.2, key = s < 0.75 ? k0 : k1;
      var sq = s > 1.25 && s < 1.5 ? Math.sin((s - 1.25) / 0.25 * Math.PI) * 0.12 : 0;
      cv.style.transform = "scale(" + (1 + sq) + "," + (1 - sq) + ")";
      GXV.draw(cv, key, spin, {scale: 0.75, dy: y * 2, shine: s > 0.7 && s < 1.2 ? 1 : 0, shineX: (s - 0.7) / 0.5, metal: 0.4 + t * 0.1});
      if (s > 0.75 && !burst) { burst = true; for (var i = 0; i < (rm() ? 0 : 40); i++) { var a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160; parts.push({x: 180, y: 120, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, l: 0.8 + Math.random() * 0.5, s: 3 + Math.random() * 4}); } el.classList.add("hit"); }
      var cx = fx.getContext("2d"); cx.clearRect(0, 0, 360, 360);
      parts.forEach(function (p) { p.l -= 1 / 60; if (p.l <= 0) return; p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 260 / 60; cx.globalAlpha = Math.min(1, p.l * 2); cx.fillStyle = T.c; cx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); });
      cx.globalAlpha = 1;
      if (k < 1) raf = requestAnimationFrame(frame); else setTimeout(close, rm() ? 200 : 650);
    }
    function close() { el.classList.add("out"); setTimeout(function () { el.remove(); done && done(); }, 300); }
    el.addEventListener("click", function () { cancelAnimationFrame(raf); close(); });
    raf = requestAnimationFrame(frame);
  }
  U.gearUpAnim = upAnim;
})();
