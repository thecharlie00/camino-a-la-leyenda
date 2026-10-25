/* ui-shop.js — tienda de vóxeles (5.6): escaparate giratorio, secciones Destacados/Ofertas, Jugador,
   Entrenador y Mascota, prueba con comparación de atributos, candados con el progreso real,
   existencias que cambian cada día y animación de compra. */
(function () {
  if (typeof UIX === "undefined" || typeof GXI === "undefined" || typeof GXG === "undefined") return;
  var U = UIX, h = U.h;
  function rm() { return document.documentElement.classList.contains("rm"); }
  function who() { return S && S.mode === "mgr" ? "m" : "p"; }
  function purse(w) { return w === "m" ? S.m : S.p; }
  function petNow() { try { var L = S.p && S.p.life; return L && L.pet && L.pet.v === 2 ? L.pet : null; } catch (e) { return null; } }
  GXV.reg("shopbox", function () {
    var V = {}; function box(x0, x1, y0, y1, z0, z1, c) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) V[x + "," + y + "," + z] = c; }
    box(-6, 6, 0, 0, -6, 6, "#8a5a2e"); box(-6, -6, 1, 6, -6, 6, "#a8703a"); box(6, 6, 1, 6, -6, 6, "#a8703a"); box(-6, 6, 1, 6, -6, -6, "#9a6534"); box(-6, 6, 1, 6, 6, 6, "#b47a40"); box(-6, 6, 4, 4, 6, 6, "#ffb21e"); box(-6, 6, 4, 4, -6, -6, "#ffb21e");
    return V;
  });
  GXV.reg("pedestal", function () {
    var V = {}; function box(x0, x1, y0, y1, z0, z1, c) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) V[x + "," + y + "," + z] = c; }
    box(-7, 7, 0, 0, -7, 7, "#1b2428"); box(-6, 6, 1, 1, -6, 6, "#24343a"); box(-5, 5, 2, 2, -5, 5, "#ffb21e"); return V;
  });
  function icon(id, px) {
    var it = GXI.item(id); if (!it) return "";
    if (it.own === "pet") { var k = "pi:" + id; if (!icon.r[k]) { icon.r[k] = 1; var col = {c: "#9aa7aa", r: "#66b9ff", e: "#b07cff", l: "#ff6b3d"}[it.r] || "#9aa7aa"; GXV.reg(k, function () { return GXG.make(it.slot === "h" ? "band" : it.slot === "n" ? "neck" : it.slot === "f" ? "glasses" : "therm", col, null, "#ffffff"); }); } return GXV.img(k, px); }
    return GXG.icon(id, GXI.tier(id, it.own), px);
  }
  icon.r = {};
  function statName(k) {
    if (/^[A-Z]{3}$/.test(k)) { var kk = typeof isGK === "function" && S.p && isGK() ? GX_GKMAP[k] || k : k; return tr(ATT_NAMES[kk] || kk); }
    return tr(GX_STATN[k] || k);
  }
  function chips(st, ref) {
    var keys = Object.keys(st); if (ref) Object.keys(ref).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    return keys.map(function (k) { var v = st[k] || 0, x = ref ? v - (ref[k] || 0) : v; if (!x) return ""; return '<span class="chip ' + (x > 0 ? "up" : "down") + '">' + (x > 0 ? "+" : "−") + Math.abs(x) + " " + h(statName(k)) + "</span>"; }).join("");
  }
  /* candado con el progreso real */
  function lockInfo(lk) {
    var p = S.p, m = S.m;
    if (lk.k === "fame") { var cur = S.mode === "mgr" ? Math.round(m.rep) : Math.round(p.fame); return [tr(S.mode === "mgr" ? "Prestigio {a} / {b}" : "Fama {a} / {b}", {a: cur, b: lk.v}), cur / lk.v]; }
    if (lk.k === "tro") { var n = (S.mode === "mgr" ? m : p).trophies.length; return [tr("Títulos {a} / {b}", {a: n, b: lk.v}), n / lk.v]; }
    if (lk.k === "cap") return [tr("Necesitas ser capitán"), 0];
    if (lk.k === "ch" && typeof GXC !== "undefined") { var pr = GXC.prog(lk.v); return [tr(GXC.name(lk.v)) + " · " + pr[0] + " / " + pr[1], pr[0] / pr[1]]; }
    return [tr("Bloqueado"), 0];
  }
  var TABS = [["feat", "Destacados"], ["p", "Jugador"], ["m", "Entrenador"], ["pet", "Mascota"], ["chal", "Retos"]];
  U.actions.shopopen = function (b, v) { var ui = U.ui(); ui.sh = {tab: v || "feat", sel: null, slot: b && b.getAttribute && b.getAttribute("data-s") || null, tryOn: false}; U.open("shop"); };
  U.gearShopLink = function (w, sl) { return '<button class="btn wide sm" data-a="shopopen" data-v="' + (w === "m" ? "m" : "p") + '" data-s="' + sl + '">' + h(tr("Buscar más en la tienda")) + "</button>"; };
  function list(tab) {
    if (tab === "feat") { var f = GXI.featured(), o = GXI.offers(); return (f ? [f] : []).concat(o.filter(function (x) { return x !== f; })); }
    if (tab === "pet") { var pt = petNow(); return pt && typeof PetSim !== "undefined" ? PetSim.stock(pt).filter(function (id) { var it = GXI.item(id); return it; }) : []; }
    var w = tab, all = GXI.items(w).filter(function (it) { return it.price > 0; });
    /* las existencias rotan cada día; lo bloqueado y lo que ya tienes se ve igual */
    var st = GXI.stock(w);
    return all.filter(function (it) { return st.indexOf(it.id) >= 0 || GXI.lock(it) || GXI.owned(it.id, w) || (it.req && it.req.ch); }).sort(function (a, b) { return (a.req && a.req.ch ? 1 : 0) - (b.req && b.req.ch ? 1 : 0); }).map(function (it) { return it.id; });
  }
  U.sheets.shop = function () {
    var ui = U.ui().sh = U.ui().sh || {tab: "feat", sel: null}, tab = ui.tab, ids = list(tab);
    setTimeout(function () { if (document.querySelector(".shv-c")) loop(); }, 30);
    if (ui.slot) { var only = ids.filter(function (id) { return GXI.item(id).slot === ui.slot; }); if (only.length) ids = only; }
    if (!ui.sel || ids.indexOf(ui.sel) < 0) ui.sel = ids[0] || null;
    var w = tab === "pet" ? "pet" : tab === "feat" ? who() : tab, pr = purse(w === "pet" ? "p" : w);
    var s = "<h2>" + h(tr("Tienda")) + '</h2><div class="stack shp">';
    s += '<div class="seg shp-tabs">' + TABS.map(function (t) { return '<button data-a="shoptab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + h(tr(t[1])) + "</button>"; }).join("") + "</div>";
    s += '<div class="shp-top"><small class="muted">' + h(tr("Las existencias cambian cada día.")) + '</small><b class="shp-money">' + h(fmtMoney(pr ? pr.money : 0)) + "</b></div>";
    if (tab === "chal") s += chalList();
    else if (tab === "m" && S.mode !== "mgr") s += '<p class="muted">' + h(tr("La ropa de entrenador estará disponible cuando te sientes en un banquillo.")) + "</p>";
    else if (tab === "pet" && !petNow()) s += '<p class="muted">' + h(tr("Adopta una mascota para comprarle accesorios.")) + "</p>";
    else if (!ids.length) s += '<p class="muted">' + h(tr("Hoy no queda nada por aquí: vuelve mañana.")) + "</p>";
    else {
      s += vitrine(ui.sel, tab);
      s += '<div class="shp-grid">' + ids.map(function (id, i) {
        var it = GXI.item(id), lk = it.own === "pet" ? null : GXI.lock(it), own = it.own === "pet" ? PetSim.has(id) : GXI.owned(id, it.own), off = tab !== "pet" && GXI.offers().indexOf(id) >= 0, feat = tab !== "pet" && GXI.featured() === id;
        return '<button class="shi' + (ui.sel === id ? " on" : "") + (lk ? " lk" : "") + (own ? " own" : "") + '" data-a="shopsel" data-v="' + id + '" style="--d:' + (i * 35) + 'ms"><img src="' + icon(id, 96) + '" alt="" width="46" height="46"><small>' + h(tr(it.n)) + "</small>" +
          (feat ? '<em class="shb f">' + h(tr("Destacado")) + "</em>" : off ? '<em class="shb o">−30 %</em>' : "") + (lk ? '<i class="shl" aria-hidden="true">🔒</i>' : own ? '<i class="shl" aria-hidden="true">✓</i>' : "") + "</button>";
      }).join("") + "</div>";
    }
    return s + '<button class="btn wide" data-a="close">' + h(tr("Cerrar")) + "</button></div>";
  };
  function vitrine(id, tab) {
    if (!id) return "";
    var it = GXI.item(id), w = it.own, pet = w === "pet", lk = pet ? null : GXI.lock(it), own = pet ? PetSim.has(id) : GXI.owned(id, w);
    var price = pet ? PetSim.price(petItemOf(id)) : GXI.price(id), base = it.price, money = purse(pet ? "p" : w).money, st = GXI.stats(id, 0, w);
    var g = pet ? null : GXI.gear(w), cur = g && g.eq[it.slot], curSt = cur ? GXI.stats(cur, g.own[cur].t, w) : {};
    var s = '<div class="shv"><canvas class="shv-c" width="300" height="240" data-shv="' + id + '" aria-hidden="true"></canvas><div class="shv-i"><b>' + h(tr(it.n)) + "</b>";
    var sl = (GX_SLOTS[pet ? "pet" : w] || []).filter(function (x) { return x[0] === it.slot; })[0];
    if (sl) s += "<small>" + h(tr(sl[1])) + (it.set && GXI.set(it.set) ? " · " + h(tr(GXI.set(it.set).n)) : "") + "</small>";
    s += '<div class="gpc-st">' + chips(st) + "</div>";
    if (!pet && cur && cur !== id && !own) s += '<div class="gpc-cmp"><small>' + h(tr("Frente a lo que llevas:")) + "</small> " + (chips(st, curSt) || '<span class="muted">' + h(tr("igual")) + "</span>") + "</div>";
    /* prueba: qué te quedaría en los atributos con la pieza puesta */
    if (!pet && w === "p" && U.ui().sh.tryOn) s += tryPanel(id);
    if (lk) { var li = lockInfo(lk); s += '<div class="shlock"><span>🔒 ' + h(li[0]) + '</span><i class="gxp"><i style="--w:' + Math.round(Math.min(1, li[1]) * 100) + '%"></i></i></div>'; }
    s += '<div class="gpc-a">';
    if (!pet && w === "p" && !own) s += '<button class="btn sm" data-a="shoptry" aria-pressed="' + !!U.ui().sh.tryOn + '">' + h(tr("Probar")) + "</button>";
    if (own) s += '<span class="gt-max">' + h(tr("Ya es tuya")) + "</span>";
    else if (!lk) s += '<button class="btn sm pri" data-a="shopbuy" data-v="' + id + '"' + (money >= price ? "" : " disabled") + ">" + h(tr("Comprar")) + " <b>" + (price < base ? "<s>" + h(fmtMoney(base)) + "</s> " : "") + h(fmtMoney(price)) + "</b></button>" + (money < price ? '<small class="muted">' + h(tr("Te faltan {m}", {m: fmtMoney(price - money)})) + "</small>" : "");
    return s + "</div></div></div>";
  }
  /* retos: el progreso real de tu carrera y la pieza que desbloquean */
  function chalList() {
    if (typeof GXC === "undefined") return "";
    var mgr = S.mode === "mgr", L = GXC.list().filter(function (c) { return mgr ? c.who === "m" : c.who !== "m"; });
    L.sort(function (a, b) { var A = GXC.done(a.id) ? 1 : 0, B = GXC.done(b.id) ? 1 : 0; if (A !== B) return A - B; var pa = GXC.prog(a.id), pb = GXC.prog(b.id); return pb[0] / pb[1] - pa[0] / pa[1]; });
    var n = L.filter(function (c) { return GXC.done(c.id); }).length;
    return '<p class="muted" style="margin:0">' + h(tr("{n} de {t} retos superados. Cada uno desbloquea una pieza exclusiva.", {n: n, t: L.length})) + '</p><ul class="gxl chl">' + L.map(function (c, i) {
      var pr = GXC.prog(c.id), ok = GXC.done(c.id), it = c.item ? GXI.item(c.item) : null, gift = ok && GX.st().ch[c.id] && GX.st().ch[c.id].gift;
      var img = it ? icon(c.item, 64) : gift ? icon(gift, 64) : GXV.img("s", 64);
      return '<li class="gxi chi' + (ok ? " on" : "") + '" style="--i:' + i + '"><img src="' + img + '" alt="" width="40" height="40"><span class="grow"><b>' + h(tr(c.n)) + "</b><small>" + h(tr(c.d)) + "</small>" +
        (ok ? '<small class="gxd">' + h(it ? tr("Desbloqueado: {x}", {x: tr(it.n)}) : gift ? tr("Regalo: {x}", {x: tr(GXI.item(gift).n)}) : tr("Superado")) + "</small>" : '<span class="gxp"><i style="--w:' + Math.round(pr[0] / pr[1] * 100) + '%"></i><em>' + gxNum(pr[0]) + " / " + gxNum(pr[1]) + "</em></span>" + (it ? '<small class="muted">' + h(tr("Desbloquea: {x}", {x: tr(it.n)})) + "</small>" : c.pet ? '<small class="muted">' + h(tr("Regalo para tu mascota")) + "</small>" : "")) + "</span></li>";
    }).join("") + "</ul>";
  }
  function petItemOf(id) { return typeof petItem === "function" ? petItem(id) : null; }
  function tryPanel(id) {
    var it = GXI.item(id), g = GXI.gear("p"), now = GXI.bonus("p");
    var save = g.eq[it.slot], had = g.own[id]; if (!had) g.own[id] = {t: 0}; g.eq[it.slot] = id;
    var then = GXI.bonus("p"); g.eq[it.slot] = save; if (!had) delete g.own[id];
    var keys = Object.keys(then).concat(Object.keys(now)).filter(function (k, i, a) { return a.indexOf(k) === i && /^[A-Z]{3}$/.test(k); });
    var at = attrs();
    return '<div class="shtry">' + keys.map(function (k) {
      var gk = isGK() ? GX_GKMAP[k] || k : k, a = Math.round(then[k] || 0) - Math.round(now[k] || 0), base = at[gk];
      if (base == null) return "";
      return '<div class="shtr"><span>' + h(statName(k)) + "</span><b>" + base + "</b><i>→</i><b class=\"" + (a > 0 ? "up" : a < 0 ? "down" : "") + "\">" + (base + a) + "</b></div>";
    }).join("") + "</div>";
  }
  U.actions.shoptab = function (b, v) { var ui = U.ui().sh; ui.tab = v; ui.sel = null; ui.slot = null; ui.tryOn = false; U.renderSheet(); };
  U.actions.shopsel = function (b, v) { var ui = U.ui().sh; ui.sel = v; ui.tryOn = false; U.renderSheet(); try { Anim.haptic("tap"); } catch (e) {} };
  U.actions.shoptry = function () { var ui = U.ui().sh; ui.tryOn = !ui.tryOn; U.renderSheet(); };
  U.actions.shopbuy = function (b, v) {
    var it = GXI.item(v), r;
    if (it.own === "pet") { r = PetSim.buy(v); if (r && r.ok) { try { GX.add("buys"); GX.dirty(); } catch (e) {} } }
    else r = GXI.buy(v);
    if (!r || !r.ok) { U.toast(r && r.poor ? tr("No te llega el dinero.") : tr("No se puede comprar.")); return; }
    U.persist(); buyAnim(v, function () { U.renderSheet(); U.render(false); });
  };
  /* ---------- escaparate giratorio ---------- */
  var spin = {raf: 0};
  function loop() {
    cancelAnimationFrame(spin.raf);
    var t0 = performance.now();
    (function f(now) {
      var cv = document.querySelector(".shv-c"); if (!cv) return;
      var id = cv.getAttribute("data-shv"), it = GXI.item(id), t = (now - t0) / 1000, key = it.own === "pet" ? "pi:" + id : "gi:" + id + ":" + GXI.tier(id, it.own);
      if (cv.__id !== id) { cv.__id = id; cv.__t = now; }
      var k = Math.min(1, (now - cv.__t) / 500), pop = 1 - Math.pow(1 - k, 3) * 1, ov = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.12 : 1;
      var ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height);
      /* pedestal (fijo) y la pieza encima, girando con un pequeño balanceo */
      var tmp = loop.tmp || (loop.tmp = document.createElement("canvas")); tmp.width = cv.width; tmp.height = cv.height;
      GXV.draw(tmp, "pedestal", -0.6, {scale: 0.3, dy: 84, shadow: false, metal: 0.2}); ctx.drawImage(tmp, 0, 0);
      GXV.draw(tmp, key, t * (rm() ? 0.3 : 0.9), {scale: 0.62 * pop * ov, dy: 4 + Math.sin(t * 2) * 4, shadow: false, metal: 0.5, shine: (t % 4) < 0.7 ? 1 : 0, shineX: (t % 4) / 0.7}); ctx.drawImage(tmp, 0, 0);
      spin.raf = requestAnimationFrame(f);
    })(t0);
  }
  U.add("after", function () { if (document.querySelector(".shv-c")) loop(); });
  /* ---------- compra: la pieza cae en una caja, aplasta, rebota y saltan monedas ---------- */
  function buyAnim(id, done) {
    var it = GXI.item(id), key = it.own === "pet" ? "pi:" + id : "gi:" + id + ":" + GXI.tier(id, it.own);
    var el = document.createElement("div"); el.className = "gup gbuy"; el.style.setProperty("--tc", "#ffb21e");
    el.innerHTML = '<canvas class="gup-fx" aria-hidden="true"></canvas><canvas class="gup-c" width="360" height="360" aria-hidden="true"></canvas><div class="gup-t"><small>' + h(tr("¡Es tuya!")) + "</small><b>" + h(tr(it.n)) + "</b></div>";
    document.body.appendChild(el);
    var cv = el.querySelector(".gup-c"), fx = el.querySelector(".gup-fx"), t0 = performance.now(), coins = [], raf, hit = false, tmp = document.createElement("canvas"); tmp.width = tmp.height = 360; fx.width = fx.height = 360;
    try { SpModes.AU.fx("coin"); Anim.haptic("ok"); } catch (e) {}
    var dur = rm() ? 0.8 : 1.9;
    function frame(now) {
      var s = (now - t0) / 1000, ctx = cv.getContext("2d"); ctx.clearRect(0, 0, 360, 360);
      var fall = s < 0.15 ? -150 - 12 * (s / 0.15) : s < 0.65 ? -162 + 222 * Math.pow((s - 0.15) / 0.5, 2) : 60 - Math.abs(Math.sin((s - 0.65) * 7)) * 20 * Math.max(0, 1 - (s - 0.65) * 1.6);
      var sq = s > 0.62 && s < 0.85 ? Math.sin((s - 0.62) / 0.23 * Math.PI) * 0.16 : 0;
      GXV.draw(tmp, "shopbox", -0.6, {scale: 0.55 * (1 + sq * 0.6), dy: 95, metal: 0.1}); ctx.drawImage(tmp, 0, 0);
      GXV.draw(tmp, key, -0.6 + s * 3, {scale: 0.45, dy: Math.min(60, fall), shadow: false, metal: 0.5}); ctx.drawImage(tmp, 0, 0);
      if (s > 0.62 && !hit) { hit = true; el.classList.add("hit"); for (var i = 0; i < (rm() ? 0 : 26); i++) { var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 140 + Math.random() * 140; coins.push({x: 180, y: 220, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, r: Math.random() * 6}); } }
      var cx = fx.getContext("2d"); cx.clearRect(0, 0, 360, 360);
      coins.forEach(function (c) { c.l -= 1 / 60; if (c.l <= 0) return; c.x += c.vx / 60; c.y += c.vy / 60; c.vy += 420 / 60; c.r += 0.25; var wdt = Math.abs(Math.cos(c.r)) * 8 + 1; cx.globalAlpha = Math.min(1, c.l * 2); cx.fillStyle = "#ffd36a"; cx.fillRect(c.x - wdt / 2, c.y - 4, wdt, 8); cx.fillStyle = "#b8861a"; cx.fillRect(c.x - wdt / 2, c.y + 2, wdt, 2); });
      cx.globalAlpha = 1;
      if (s < dur) raf = requestAnimationFrame(frame); else setTimeout(close, rm() ? 150 : 550);
    }
    function close() { el.classList.add("out"); setTimeout(function () { el.remove(); done && done(); }, 300); }
    el.addEventListener("click", function () { cancelAnimationFrame(raf); close(); });
    raf = requestAnimationFrame(frame);
  }
  /* entrada en «Yo» (jugador) y en el club (míster) */
  function entry() { var f = GXI.featured(), o = GXI.offers().length; return '<button class="card shcard" data-a="shopopen" data-v="feat"><span class="shcard-ic">' + (f ? '<img src="' + icon(f, 96) + '" alt="" width="40" height="40">' : "🛍️") + '</span><span class="grow"><b>' + h(tr("Tienda")) + "</b><small>" + h(tr("Destacado del día y {n} ofertas. Las existencias cambian cada día.", {n: o})) + '</small></span><span class="chev" aria-hidden="true">›</span></button>'; }
  U.add("jugador", function () { return S && S.p && !U.isMgr() ? entry() : ""; });
  U.shopEntry = entry;
})();
