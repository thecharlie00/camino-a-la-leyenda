/* ui-shop.js — tienda de vóxeles (5.6): escaparate giratorio, secciones Destacados/Ofertas, Jugador,
   Entrenador y Mascota, prueba con comparación de atributos, candados con el progreso real,
   existencias que cambian cada día y animación de compra. */
(function () {
  if (typeof UIX === "undefined" || typeof GXI === "undefined" || typeof GXG === "undefined") return;
  var U = UIX, h = U.h;
  function rm() { return document.documentElement.classList.contains("rm"); }
  function who() { return S && S.mode === "mgr" ? "m" : "p"; }
  /* la mascota se paga con quien la cuida ahora (el míster, en su modo): lo mismo que cobra PetSim */
  function purse(w) { return w === "m" ? S.m : w === "pet" && typeof petWallet === "function" ? petWallet() : S.p; }
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
    if (it.own === "pet") { var k = "pi:" + id; if (!icon.r[k]) { icon.r[k] = 1; var col = {c: "#9aa7aa", r: "#66b9ff", e: "#b07cff", l: "#ff6b3d"}[it.r] || "#9aa7aa"; GXV.reg(k, function () { return petVox(id) || GXG.make(it.slot === "h" ? "band" : it.slot === "n" ? "neck" : it.slot === "f" ? "glasses" : "therm", col, null, "#ffffff"); }); } return GXV.img(k, px); }
    return GXG.icon(id, GXI.tier(id, it.own), px);
  }
  icon.r = {};
  /* 5.7: el icono de un accesorio de mascota es su propio modelo (la receta de vóxeles que lleva puesta), no uno genérico */
  function petVox(id) {
    var d = typeof petItem === "function" ? petItem(id) : null; if (!d || !d.rec || typeof PetStyle === "undefined") return null;
    var PAL = PetStyle.PAL, T = PetStyle.teamColors(), V = {};
    /* el renderizador de iconos trabaja en hex; los colores del club pueden venir en hsl */
    function hx(x) { if (/^#[0-9a-f]{6}$/i.test(x)) return x; try { return "#" + VoxCore.rgb(x).map(function (v) { return ("0" + Math.round(v * 255).toString(16)).slice(-2); }).join(""); } catch (e) { return "#9aa7aa"; } }
    function c(x) { return hx(x === "T1" ? T[0] : x === "T2" ? T[1] : x && x.length <= 2 && PAL[x] ? PAL[x] : x); }
    d.rec.forEach(function (r) {
      if (r[0] !== "box") return; var fl = r[8], col = c(r[7]);
      for (var i = r[1]; i <= r[4]; i++) for (var j = r[2]; j <= r[5]; j++) for (var q = r[3]; q <= r[6]; q++) {
        if (fl === "ring" && !(i === r[1] || i === r[4] || q === r[3] || q === r[6])) continue;
        if (fl === "beads" && (!(i === r[1] || i === r[4] || q === r[3] || q === r[6]) || (i + q) % 2)) continue;
        if (fl === "frame" && !(i === r[1] || i === r[4] || j === r[2] || j === r[5])) continue;
        if (fl === "shell" && !(i === r[1] || i === r[4] || j === r[5] || q === r[3] || q === r[6])) continue;
        if (fl === "net" && (i + j) % 2) continue;
        V[i + "," + j + "," + q] = col;
      }
    });
    return Object.keys(V).length ? V : null;
  }
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
    if (lk.k === "era" && typeof eraLockText === "function") return [eraLockText(lk), 0];
    return [tr("Bloqueado"), 0];
  }
  var TABS = [["feat", N_("Destacados")], ["p", N_("Jugador")], ["m", N_("Entrenador")], ["pet", N_("Mascota")], ["chal", N_("Retos")]];
  U.actions.shopopen = function (b, v) { var ui = U.ui(); ui.sh = {tab: v || "feat", sel: null, slot: b && b.getAttribute && b.getAttribute("data-s") || null, view: "item", f: {}}; U.open("shop"); };
  U.gearShopLink = function (w, sl) { return '<button class="btn wide sm" data-a="shopopen" data-v="' + (w === "m" ? "m" : "p") + '" data-s="' + sl + '">' + h(tr("Buscar más en la tienda")) + "</button>"; };
  /* ---------- 5.7: qué has visto ya («Nuevo») ---------- */
  function seenOf(w) { var g = GXI.gear(w === "m" ? "m" : "p"); return g ? g.seen || (g.seen = {}) : {}; }
  function isNew(id) { var it = GXI.item(id); return it && !seenOf(it.own)[id]; }
  function markSeen(ids) { ids.forEach(function (id) { var it = GXI.item(id); if (it && (it.own !== "m" || S.m)) seenOf(it.own)[id] = 1; }); }
  /* lo que se ha enseñado en la rejilla pasa a visto al cerrar la tienda */
  U.add("after", function () {
    var ui = U.ui(), sh = ui && ui.sh; if (!sh || !sh.shown || document.querySelector(".sheet:not(.out) .shp")) return;
    try { markSeen(Object.keys(sh.shown)); U.persist(); } catch (e) {} sh.shown = null;
  });
  function list(tab) {
    if (tab === "feat") { var f = GXI.featured(), o = GXI.offers(); return (f ? [f] : []).concat(o.filter(function (x) { return x !== f; })); }
    if (tab === "pet") { var pt = petNow(); return pt && typeof PetSim !== "undefined" ? PetSim.stock(pt).filter(function (id) { var it = GXI.item(id); return it; }) : []; }
    var w = tab, all = GXI.items(w).filter(function (it) { return it.price > 0; });
    /* las existencias rotan cada día; lo bloqueado y lo que ya tienes se ve igual */
    var st = GXI.stock(w);
    return all.filter(function (it) { return st.indexOf(it.id) >= 0 || GXI.lock(it) || GXI.owned(it.id, w) || (it.req && it.req.ch); }).sort(function (a, b) { return (a.req && a.req.ch ? 1 : 0) - (b.req && b.req.ch ? 1 : 0); }).map(function (it) { return it.id; });
  }
  /* ---------- 5.7: ranura, filtros, orden y búsqueda ---------- */
  function owns(id) { var it = GXI.item(id); return it.own === "pet" ? PetSim.has(id) : GXI.owned(id, it.own); }
  function priceOf(id) { var it = GXI.item(id); return it.own === "pet" ? PetSim.price(petItemOf(id)) : GXI.price(id); }
  function walletOf(it) { var p = purse(it.own); return p ? p.money : 0; }
  function sumSt(id) { var st = GXI.stats(id, 0, GXI.item(id).own), v = 0; Object.keys(st).forEach(function (k) { v += st[k]; }); return v; }
  function norm(t) { return String(t).toLowerCase().normalize ? String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : String(t).toLowerCase(); }
  function filtered(ids, ui) {
    var f = ui.f || {};
    var out = ids.filter(function (id) {
      var it = GXI.item(id);
      if (ui.slot && it.slot !== ui.slot) return false;
      if (f.afford && (owns(id) || priceOf(id) > walletOf(it) || (it.own !== "pet" && GXI.lock(it)))) return false;
      if (f.fresh && !isNew(id)) return false;
      if (f.set && it.set !== f.set) return false;
      if (f.st && !(GXI.stats(id, 0, it.own)[f.st] > 0)) return false;
      /* se busca por nombre, ranura y línea («botas», «relámpago»…) */
      if (ui.q) { var sl = (GX_SLOTS[it.own] || PET_SLOT).filter(function (x) { return x[0] === it.slot; })[0], st2 = it.set && GXI.set(it.set);
        if (norm(tr(it.n) + " " + (sl ? tr(sl[1]) : "") + " " + (st2 ? tr(st2.n) : "")).indexOf(norm(ui.q)) < 0) return false; }
      return true;
    });
    var o = f.ord || "";
    if (o) out.sort(function (a, b) {
      if (o === "pa") return priceOf(a) - priceOf(b);
      if (o === "pd") return priceOf(b) - priceOf(a);
      if (o === "st") return f.st ? (GXI.stats(b, 0, GXI.item(b).own)[f.st] || 0) - (GXI.stats(a, 0, GXI.item(a).own)[f.st] || 0) : sumSt(b) - sumSt(a);
      if (o === "ti") return GXI.tier(b, GXI.item(b).own) - GXI.tier(a, GXI.item(a).own);
      return 0;
    });
    return out;
  }
  function sel(k, label, opts, cur) {
    return '<label class="shp-sel"><span>' + h(label) + '</span><select data-shk="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (cur || "") ? " selected" : "") + ">" + h(o[1]) + "</option>"; }).join("") + "</select></label>";
  }
  function toolbar(tab, ids, ui) {
    var w = tab === "pet" ? "pet" : tab, f = ui.f || {}, s = "";
    if (ids.length > 12) s += '<input class="shp-q" type="search" inputmode="search" placeholder="' + h(tr("Buscar")) + '" aria-label="' + h(tr("Buscar")) + '" value="' + h(ui.q || "") + '">';
    var present = {}; ids.forEach(function (id) { present[GXI.item(id).slot] = 1; });
    var slots = (GX_SLOTS[w] || []).filter(function (x) { return present[x[0]]; });
    if (slots.length > 1) s += '<div class="shp-slots" role="group" aria-label="' + h(tr("Ranura")) + '"><button class="chip" data-a="shopslot" data-v="" aria-pressed="' + !ui.slot + '">' + h(tr("Todo")) + "</button>" +
      slots.map(function (x) { return '<button class="chip" data-a="shopslot" data-v="' + x[0] + '" aria-pressed="' + (ui.slot === x[0]) + '">' + h(tr(x[1])) + "</button>"; }).join("") + "</div>";
    s += '<div class="shp-flt"><button class="chip" data-a="shopf" data-v="afford" aria-pressed="' + !!f.afford + '">' + h(tr("Me lo puedo permitir")) + '</button><button class="chip" data-a="shopf" data-v="fresh" aria-pressed="' + !!f.fresh + '">' + h(tr("Nuevo")) + "</button></div>";
    if (tab !== "pet") {
      var sets = GX_SETS.filter(function (x) { return ids.some(function (id) { return GXI.item(id).set === x.k; }); });
      var stk = tab === "m" ? GX_MSTATS : ["RIT", "TIR", "PAS", "REG", "DEF", "FIS", "rec", "inj"];
      s += '<div class="shp-sels">' + sel("ord", tr("Orden"), [["", tr("Recomendado")], ["pa", tr("Precio: de menos a más")], ["pd", tr("Precio: de más a menos")], ["st", tr("Estadísticas")], ["ti", tr("Tier")]], f.ord) +
        sel("st", tr("Estadística"), [["", tr("Cualquiera")]].concat(stk.map(function (k) { return [k, statName(k)]; })), f.st) +
        (sets.length ? sel("set", tr("Conjunto"), [["", tr("Cualquiera")]].concat(sets.map(function (x) { return [x.k, tr(x.n)]; })), f.set) : "") + "</div>";
    }
    return '<div class="shp-bar">' + s + "</div>";
  }
  function grid(tab, ids, ui) {
    if (!ids.length) return '<div class="shp-grid"><p class="muted shp-none">' + h(tr("Nada coincide con lo que buscas.")) + ' <button class="btn sm" data-a="shopclr">' + h(tr("Quitar filtros")) + "</button></p></div>";
    ui.shown = ui.shown || {};
    return '<div class="shp-grid">' + ids.map(function (id, i) {
      ui.shown[id] = 1;
      var it = GXI.item(id), lk = it.own === "pet" ? null : GXI.lock(it), own = owns(id), off = tab !== "pet" && GXI.offers().indexOf(id) >= 0, feat = tab !== "pet" && GXI.featured() === id, eq = own && it.own !== "pet" && GXI.gear(it.own).eq[it.slot] === id;
      var badge = feat ? '<em class="shb f">' + h(tr("Destacado")) + "</em>" : off ? '<em class="shb o">−30 %</em>' : !own && isNew(id) ? '<em class="shb n">' + h(tr("Nuevo")) + "</em>" : "";
      var state = eq ? tr("Equipado") : own ? tr("En propiedad") : lk ? tr("Bloqueado") : "";
      return '<button class="shi' + (ui.sel === id ? " on" : "") + (lk ? " lk" : "") + (own ? " own" : "") + '" data-a="shopsel" data-v="' + id + '" style="--d:' + (Math.min(i, 12) * 35) + 'ms" aria-label="' + h(tr(it.n) + (state ? " · " + state : "")) + '"><img src="' + icon(id, 96) + '" alt="" width="46" height="46"><small>' + h(tr(it.n)) + "</small>" +
        badge + (lk ? '<i class="shl" aria-hidden="true">🔒</i>' : eq ? '<i class="shl eq" aria-hidden="true">●</i>' : own ? '<i class="shl" aria-hidden="true">✓</i>' : "") + "</button>";
    }).join("") + "</div>";
  }
  U.sheets.shop = function () {
    var ui = U.ui().sh = U.ui().sh || {tab: "feat", sel: null}, tab = ui.tab, all = list(tab), ids = tab === "feat" ? all : filtered(all, ui);
    setTimeout(function () { if (document.querySelector(".shv-c")) loop(); mountMe(); }, 30);
    if (!ui.sel || all.indexOf(ui.sel) < 0) ui.sel = ids[0] || all[0] || null;
    var w = tab === "pet" ? "pet" : tab === "feat" ? who() : tab, pr = purse(w);
    var s = "<h2>" + h(tr("Tienda")) + '</h2><div class="stack shp">';
    s += '<div class="seg shp-tabs">' + TABS.map(function (t) { return '<button data-a="shoptab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + h(tr(t[1])) + "</button>"; }).join("") + "</div>";
    s += '<div class="shp-top"><small class="muted">' + h(tr("Las existencias cambian cada día.")) + '</small><b class="shp-money num">' + h(fmtMoney(pr ? pr.money : 0)) + "</b></div>";
    if (tab === "chal") s += chalList();
    else if (tab === "m" && S.mode !== "mgr") s += '<p class="muted">' + h(tr("La ropa de entrenador estará disponible cuando te sientes en un banquillo.")) + '</p><button class="btn wide" data-a="shoptab" data-v="p">' + h(tr("Jugador")) + "</button>";
    else if (tab === "pet" && !petNow()) s += '<p class="muted">' + h(tr("Adopta una mascota para comprarle accesorios.")) + '</p><button class="btn wide" data-a="petopen">🐾 ' + h(tr("Adopta una mascota")) + "</button>";
    else if (!all.length) s += '<p class="muted">' + h(tr("Hoy no queda nada por aquí: vuelve mañana.")) + '</p><button class="btn wide" data-a="shoptab" data-v="chal">' + h(tr("Retos")) + "</button>";
    else {
      s += vitrine(ui.sel, tab);
      if (tab !== "feat") s += toolbar(tab, all, ui);
      s += grid(tab, ids, ui);
    }
    return s + '<button class="btn wide" data-a="close">' + h(tr("Cerrar")) + "</button></div>";
  };
  /* una línea con personalidad por línea de equipamiento (sin efectos que no existan) */
  var SETD = {ray: N_("Para los que viven a la espalda del defensa."), can: N_("Para los que no saben chutar flojo."), mag: N_("Para los que juegan con la pelota pegada al pie."),
    wal: N_("Para los que no dejan pasar ni el aire."), tit: N_("Para los que aguantan los noventa y la prórroga."), led: N_("Para los que hablan en el túnel y los demás escuchan."),
    gua: N_("Para los que viven bajo los palos."), mcl: N_("Para el míster que lo apunta todo."), mbr: N_("Para el míster que cierra fichajes con un apretón de manos."), mtr: N_("Para el míster que entrena con los jugadores.")};
  function vitrine(id, tab) {
    if (!id) return "";
    var ui = U.ui().sh, it = GXI.item(id), w = it.own, pet = w === "pet", lk = pet ? null : GXI.lock(it), own = owns(id);
    var price = priceOf(id), base = it.price, money = walletOf(it), st = GXI.stats(id, 0, w);
    var g = pet ? null : GXI.gear(w), cur = g && g.eq[it.slot], on = own && cur === id, pt = pet ? petNow() : null, petOn = pet && pt && pt.eq && pt.eq[it.slot] === id;
    /* «en ti»: la pieza puesta en tu personaje (jugador o míster) con lo que ya llevas */
    var canMe = !pet && (w === "p" ? S.mode !== "mgr" : S.mode === "mgr") && U.yo3d, me = canMe && ui.view === "me";
    var s = '<div class="shv">' + (me ? '<div class="shv-me gs-prev3d" data-w="' + w + '"></div>' : '<canvas class="shv-c" width="300" height="240" data-shv="' + id + '" aria-hidden="true"></canvas>') + '<div class="shv-i">';
    if (canMe) s += '<div class="seg shv-view"><button data-a="shopview" data-v="item" aria-pressed="' + !me + '">' + h(tr("Pieza")) + '</button><button data-a="shopview" data-v="me" aria-pressed="' + !!me + '">' + h(tr("En ti")) + "</button></div>";
    s += "<b>" + h(tr(it.n)) + "</b>";
    var sl = (GX_SLOTS[pet ? "pet" : w] || PET_SLOT).filter(function (x) { return x[0] === it.slot; })[0] || (pet ? PET_SLOT.filter(function (x) { return x[0] === it.slot; })[0] : null);
    s += "<small>" + (sl ? h(tr(sl[1])) + " · " : "") + (pet ? h(tr(GX_TIERS[0].n)) : '<span class="gt-tag gt' + GXI.tier(id, w) + '">' + h(tr(GX_TIERS[GXI.tier(id, w)].n)) + "</span>") + "</small>";
    var set = it.set && GXI.set(it.set);
    if (set && SETD[it.set]) s += '<p class="shv-d">' + h(tr(SETD[it.set])) + "</p>";
    s += '<div class="gpc-st">' + chips(st) + "</div>";
    /* qué te cambia frente a lo que llevas en esa ranura (contras incluidos) */
    if (!pet && !on && U.gearDelta && (w === "p" ? S.mode !== "mgr" : S.mode === "mgr")) { var eqx = {}; eqx[it.slot] = id; s += U.gearDelta(w, eqx); }
    if (set) s += '<small class="shv-set">' + h(tr(set.n)) + " · " + h(tr("3 piezas")) + ": " + chips(set.b3 || {}) + " · " + h(tr("completa")) + ": " + chips(set.bAll || {}) + "</small>";
    if (lk) { var li = lockInfo(lk); s += '<div class="shlock"><span>🔒 ' + h(li[0]) + '</span><i class="gxp"><i style="--w:' + Math.round(Math.min(1, li[1]) * 100) + '%"></i></i></div>'; }
    s += '<div class="gpc-a">';
    if (own) {
      s += '<span class="gt-max">' + h(on || petOn ? tr("Equipado") : tr("En propiedad")) + "</span>";
      if (!on && !petOn && (pet ? pt : w === "p" ? S.mode !== "mgr" : S.mode === "mgr")) s += '<button class="btn sm pri" data-a="shopwear" data-v="' + id + '">' + h(ui.just === id ? tr("Equipar ya") : tr("Equipar")) + "</button>";
    } else if (!lk) {
      if (ui.confirm === id) s += '<div class="shconf" role="group"><span>' + h(tr("Precio")) + ' <b class="num">' + h(fmtMoney(price)) + "</b> · " + h(tr("Te quedarán")) + ' <b class="num">' + h(fmtMoney(money - price)) + '</b></span><button class="btn sm pri" data-a="shopbuyok" data-v="' + id + '">' + h(tr("Confirmar compra")) + '</button><button class="btn sm" data-a="shopbuyno">' + h(tr("Cancelar")) + "</button></div>";
      else if (money >= price) s += '<button class="btn sm pri" data-a="shopbuy" data-v="' + id + '">' + h(tr("Comprar")) + ' <b class="num">' + (price < base ? "<s>" + h(fmtMoney(base)) + "</s> " : "") + h(fmtMoney(price)) + "</b></button>";
      else s += '<button class="btn sm" disabled>' + h(tr("Te faltan {m}", {m: fmtMoney(price - money)})) + "</button>";
    }
    return s + "</div></div></div>";
  }
  /* monta el personaje en la ficha cuando se pide «En ti» */
  function mountMe() {
    var ui = U.ui().sh, hh = document.querySelector(".sheet:not(.out) .shv-me"); if (!ui || !hh || !U.yo3d) return;
    var it = GXI.item(ui.sel), eq = {}; eq[it.slot] = ui.sel;
    var fresh = !PLook.tryOn || PLook.tryOn.eq[it.slot] !== ui.sel;
    PLook.tryOn = {w: it.own, eq: eq};
    U.yo3d.dress(hh, it.own, {focus: it.slot, clips: fresh ? [PLook.EQCLIP[it.slot]].filter(Boolean) : []});
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
  function reset(ui) { ui.confirm = null; ui.just = null; }
  U.actions.shoptab = function (b, v) { var ui = U.ui().sh; ui.tab = v; ui.sel = null; ui.slot = null; ui.q = ""; reset(ui); if (ui.view === "me") PLook.tryOn = null; U.renderSheet(); };
  U.actions.shopsel = function (b, v) { var ui = U.ui().sh; ui.sel = v; reset(ui); markSeen([v]); U.renderSheet(); try { Anim.haptic("tap"); } catch (e) {} };
  U.actions.shopview = function (b, v) { var ui = U.ui().sh; ui.view = v; if (v !== "me") PLook.tryOn = null; U.renderSheet(); };
  U.actions.shopslot = function (b, v) { var ui = U.ui().sh; ui.slot = v || null; U.renderSheet(); };
  U.actions.shopf = function (b, v) { var ui = U.ui().sh; ui.f = ui.f || {}; ui.f[v] = !ui.f[v]; U.renderSheet(); };
  U.actions.shopclr = function () { var ui = U.ui().sh; ui.f = {}; ui.slot = null; ui.q = ""; U.renderSheet(); };
  /* desplegables (orden, estadística, conjunto) y búsqueda: la búsqueda solo repinta la rejilla para no perder el teclado */
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t || !t.getAttribute || !t.getAttribute("data-shk") || !U.ui().sh) return;
    var ui = U.ui().sh; ui.f = ui.f || {}; ui.f[t.getAttribute("data-shk")] = t.value || null; U.renderSheet();
  });
  document.addEventListener("input", function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains("shp-q")) return;
    var ui = U.ui().sh; if (!ui) return; ui.q = t.value;
    var gr = document.querySelector(".sheet:not(.out) .shp-grid"); if (!gr) return;
    var tmp = document.createElement("div"); tmp.innerHTML = grid(ui.tab, filtered(list(ui.tab), ui), ui); gr.replaceWith(tmp.firstChild);
  });
  /* atrás (botón o gesto de Android, Escape): primero cancela la confirmación de compra, luego cierra */
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return; var ui = U.ui && U.ui().sh;
    if (ui && ui.confirm && document.querySelector(".sheet:not(.out) .shconf")) { ui.confirm = null; U.renderSheet(); e.stopImmediatePropagation(); e.stopPropagation(); }
  }, true);
  /* comprar: primero confirma con el precio y el saldo que te queda */
  U.actions.shopbuy = function (b, v) { var ui = U.ui().sh; if (ui.busy) return; ui.confirm = v; U.renderSheet(); try { Anim.haptic("tap"); } catch (e) {} };
  U.actions.shopbuyno = function () { U.ui().sh.confirm = null; U.renderSheet(); };
  U.actions.shopbuyok = function (b, v) {
    var ui = U.ui().sh, it = GXI.item(v), r;
    /* nada de compras dobles por toques rápidos ni de comprar lo que ya tienes */
    if (ui.busy || owns(v)) return; ui.busy = true; ui.confirm = null;
    if (it.own === "pet") { r = PetSim.buy(v); if (r && r.ok) { try { GX.add("buys"); GX.dirty(); } catch (e) {} } }
    else r = GXI.buy(v);
    if (!r || !r.ok) { ui.busy = false; U.toast(r && r.poor ? tr("No te llega el dinero.") : tr("No se puede comprar.")); U.renderSheet(); return; }
    /* la ficha pasa ya a «tuya» debajo de la animación (sin botón de confirmar que siga a la vista) */
    ui.just = v; U.persist(); U.renderSheet(); buyAnim(v, function () { ui.busy = false; U.renderSheet(); U.render(false); });
  };
  /* equipar ya, desde la ficha */
  U.actions.shopwear = function (b, v) {
    var ui = U.ui().sh, it = GXI.item(v);
    if (it.own === "pet") { var pt = petNow(); if (!pt || !PetSim.wear(pt, v)) return; }
    else { if (GXI.gear(it.own).eq[it.slot] === v) return; GXI.equip(v, it.own); }
    ui.just = null; PLook.tryOn = null; U.persist(); U.render(false);
    try { Anim.haptic("ok"); } catch (e) {}
    U.toast(tr("Equipado: {x}", {x: tr(it.n)}));
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
  /* 5.7: precarga — los iconos de lo que hay hoy en la tienda (y de lo tuyo) se generan en ratos libres, de pocos en pocos,
     para que abrir la tienda o el vestidor no dé tirones en móviles flojos */
  var warmed = "";
  U.add("after", function () {
    if (!S || !(S.p || S.m) || document.querySelector(".sheet:not(.out)")) return;
    var w = who(), key = w + GXI.day(); if (warmed === key) return; warmed = key;
    var g = GXI.gear(w), ids = GXI.stock(w).concat(GXI.offers(), g ? Object.keys(g.own) : []), i = 0;
    var idle = window.requestIdleCallback || function (f) { return setTimeout(function () { f({timeRemaining: function () { return 8; }}); }, 120); };
    idle(function s0(d) { while (i < ids.length && d.timeRemaining() > 4) { try { icon(ids[i], 96); } catch (e) {} i++; } if (i < ids.length) idle(s0); });
  });
  U.shopEntry = entry;
})();
