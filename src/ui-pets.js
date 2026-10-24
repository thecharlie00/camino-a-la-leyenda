/* ui-pets.js — tarjeta y hoja de la mascota (pestaña Jugador).
   Versión 3.7: varias formas de darle cariño, color del pelaje, fondo y accesorios (de tienda y de trofeos). */
(function () {
  if (typeof UIX === "undefined" || typeof PET_DEF === "undefined") return;
  var U = UIX, h = U.h;
  function rer() { U.persist(); U.renderSheet(); U.render(false); }
  function chips(d) {
    var m = (isGK() ? d.gk : d.att) || {}, out = [];
    Object.keys(m).forEach(function (a) { out.push('<span class="chip up">+' + m[a] + " " + h(tr(ATT_NAMES[a])) + "</span>"); });
    out.push('<span class="chip up">' + tr("Moral +{n}", {n: d.mor}) + "</span>");
    if (d.calm) out.push('<span class="chip up">' + tr("Forma más estable") + "</span>");
    if (d.fame) out.push('<span class="chip up">' + tr("Fama y seguidores") + "</span>");
    if (d.risk) out.push('<span class="chip down">' + tr("Sustos y veterinario") + "</span>");
    return out.join("");
  }
  function petSize(pt) { return [34, 46, 58, 58][petStage(pt)]; }
  function bgCss(k) {
    var b = petBgDef(k), c = b[2];
    if (c === "club") { try { var cc = clubColors(W.clubs[S.p.club].n); return "radial-gradient(circle at 50% 40%," + cc[0] + " 0 58%," + cc[1] + " 59% 100%)"; } catch (e) { return ""; } }
    return c ? "radial-gradient(circle at 50% 40%," + c + " 0 62%,transparent 63%)" : "";
  }
  /* anclajes por emoji (en px sobre una caja de 155 para un emoji de 100): cara [x, y, ancho de los ojos], cabeza [x, y, ancho] y cuello [x, y] */
  var FACE = {
    "🐶": {f: [77, 80, 54], h: [77, 40, 60], n: [77, 133]}, "🐕": {f: [53, 52, 34], h: [55, 26, 38], n: [57, 86]}, "🦮": {f: [48, 44, 24], h: [40, 22, 30], n: [52, 66]},
    "🐱": {f: [77, 80, 68], h: [77, 42, 56], n: [77, 133]}, "🐈": {f: [60, 54, 30], h: [58, 30, 30], n: [62, 80]},
    "🐰": {f: [77, 92, 46], h: [77, 56, 42], n: [77, 128]}, "🐇": {f: [60, 70, 22], h: [62, 50, 26], n: [70, 94]},
    "🐟": {f: [49, 67, 20], h: [48, 50, 24], n: [62, 88]}, "🐠": {f: [50, 71, 20], h: [52, 38, 24], n: [56, 96]}, "🐡": {f: [46, 58, 22], h: [62, 34, 28], n: [60, 98]},
    "🐢": {f: [50, 68, 22], h: [46, 58, 24], n: [52, 92]}, "🐹": {f: [77, 72, 56], h: [77, 36, 50], n: [77, 132]},
    "🦜": {f: [52, 40, 22], h: [50, 24, 26], n: [56, 62]}, "🦎": {f: [44, 41, 20], h: [40, 24, 20], n: [50, 56]}, "🐍": {f: [58, 42, 24], h: [58, 26, 24], n: [56, 62]},
    "🦔": {f: [44, 82, 22], h: [50, 64, 26], n: [56, 100]}, "🦊": {f: [77, 82, 54], h: [77, 44, 52], n: [77, 134]}, "🦫": {f: [47, 44, 28], h: [46, 22, 30], n: [48, 72]},
    "🕷️": {f: [75, 86, 34], h: [75, 32, 40], n: [75, 106]}
  };
  var BOX = 155;
  /* posición automática de cada accesorio: centro x y borde superior en % de la caja, tamaño en em */
  /* el accesorio que lleva la mascota en un hueco (para colocarlo según su dibujo) */
  function accIcoOf(pt, sl) { var k = petEq(pt)[sl], a = k && petAccDef(k); return a ? a.ico : null; }
  function accBase(ico, sl, aico) {
    /* 5.6: con sprite de píxeles, la posición sale de los anclajes de la mascota y del dibujo del accesorio */
    if (aico && typeof PX !== "undefined" && PX.petAccPlace) { var q = PX.petAccPlace(ico, aico, sl); if (q) return q; }
    var F = FACE[ico] || {f: [77, 72, 50], h: [77, 36, 50], n: [77, 128]};
    if (sl === "t") return {x: 128 / BOX * 100, y: (122 - 21) / BOX * 100, s: 0.42};
    if (sl === "f") { var sz = F.f[2] * 1.45; return {x: F.f[0] / BOX * 100, y: (F.f[1] - sz * 0.52) / BOX * 100, s: sz / 100}; }
    if (sl === "h") { var sh = F.h[2] * 1.05; return {x: F.h[0] / BOX * 100, y: (F.h[1] - sh * 0.88) / BOX * 100, s: sh / 100}; }
    var sn = Math.max(20, F.f[2] * 0.75); return {x: F.n[0] / BOX * 100, y: (F.n[1] - sn * 0.45) / BOX * 100, s: sn / 100};
  }
  /* ajustes del modo edición: por emoji (cada etapa tiene su dibujo) y por hueco */
  function accAdj(pt, ico, sl) { var A = pt.adj && pt.adj[ico]; return (A && A[sl]) || null; }
  function accStyle(pt, ico, sl) {
    var b = accBase(ico, sl, accIcoOf(pt, sl)), j = accAdj(pt, ico, sl) || {}, sc = clamp(j.s || 1, 0.4, 2.5);
    return "font-size:" + (b.s * sc).toFixed(3) + "em;left:" + (b.x + (j.x || 0)).toFixed(1) + "%;top:" + (b.y + (j.y || 0)).toFixed(1) + "%;bottom:auto;right:auto;transform:translateX(-50%)" + (j.r ? " rotate(" + j.r + "deg)" : "");
  }
  /* dibujo de la mascota con su color, fondo y accesorios */
  function art(pt, size, over) {
    var o = over || {}, col = petColDef(o.col || pt.col || "nat"), bg = bgCss(o.bg || pt.bg || "none"), eq = petEq(pt), ico = o.ico || petIco(pt);
    var f = col[2] === "anim" ? "" : col[2];
    var s = '<span class="petart' + (bg ? " hasbg" : "") + '" style="font-size:' + size + "px" + (bg ? ";background:" + bg : "") + '"' + (o.edit ? ' data-ico="' + ico + '"' : ' aria-hidden="true"') + '><span class="petbody' + (col[2] === "anim" ? " rainbow" : "") + '"' + (f ? ' style="filter:' + f + '"' : "") + ">" + ico + "</span>";
    if (!o.bare) PET_SLOT.forEach(function (sl) {
      var k = eq[sl[0]]; if (!k || !petHasAcc(k)) return;
      var a = petAccDef(k);
      s += '<span class="pacc p' + sl[0] + (o.edit && o.sel === sl[0] ? " sel" : "") + '"' + (o.edit ? ' data-sl="' + sl[0] + '" role="button" tabindex="0" aria-label="' + h(tr(a.n)) + '"' : "") + ' style="' + accStyle(pt, ico, sl[0]) + '">' + a.ico + "</span>";
    });
    return s + "</span>";
  }
  U.petArt = art;
  /* posición de cada accesorio (fracciones de la caja y escala relativa), con los ajustes del modo edición: la usa la vista 3D */
  U.petAccPos = function (pt, ico, sl) { var b = accBase(ico, sl, accIcoOf(pt, sl)), j = accAdj(pt, ico, sl) || {}, sc = clamp(j.s || 1, 0.4, 2.5); return {x: (b.x + (j.x || 0)) / 100, y: (b.y + (j.y || 0)) / 100, s: b.s * sc}; };
  U.petNeed = function () { return !!(S && S.p && !U.isMgr() && petOn() && petNeeds()); };

  /* tarjeta en la pestaña Jugador */
  U.add("jugador", function () {
    if (!S || !S.p || U.isMgr() || !petOn()) return "";
    var pt = petOf();
    if (!pt) return '<button class="card petcta" data-a="petopen"><span class="petcta-ic" aria-hidden="true">🐾</span><span><b>' + tr("Adopta una mascota") + "</b><small>" + tr("Te acompaña, crece contigo y mejora tu ánimo.") + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
    var d = petDef(pt.k), need = petNeeds();
    return '<button class="card petcard' + (need ? " need" : "") + '" data-a="petopen">' + art(pt, petSize(pt)) +
      '<span class="petinfo"><span class="eyebrow">' + tr("Tu mascota") + "</span><b>" + h(pt.nm) + "</b><small>" + (need ? '<span class="petneed">' + tr("Necesita atención") + "</span>" : h(tr(d.n)) + " · " + trn(pt.age, "{n} año", "{n} años") + " · " + h(tr(PET_STAGE[petStage(pt)]))) + "</small>" +
      '<span class="petbond" aria-label="' + h(tr("Vínculo {n} %", {n: Math.round(pt.bond)})) + '"><i style="width:' + Math.round(pt.bond) + '%"></i></span></span>' +
      (pt.cared ? "" : '<span class="petdot" title="' + h(tr("Quiere jugar contigo")) + '">!</span>') + '<span class="chev" aria-hidden="true">›</span></button>';
  });
  /* aviso en la portada de la carrera si te está esperando */
  U.add("carreraTop", function () {
    if (!U.petNeed()) return "";
    var pt = petOf();
    return '<button class="card petalert" data-a="petopen">' + art(pt, 30) + '<span class="grow"><b>' + tr("{pet} necesita atención", {pet: h(pt.nm)}) + "</b><small>" + tr("Dedícale un rato antes de que se debilite el vínculo.") + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
  });

  U.actions.petopen = function () { var ui = U.ui(); ui.petTab = ui.petTab || "n"; ui.petPick = null; ui.petView = "care"; U.open("lpet"); };
  U.actions.pettab = function (b, v) { U.ui().petTab = v; U.ui().petPick = null; U.renderSheet(); };
  U.actions.petview = function (b, v) { U.ui().petView = v; U.renderSheet(); var pn = document.querySelector(".sheet .panel"); if (pn) pn.scrollTop = 0; };
  U.actions.petpick = function (b, v) { U.ui().petPick = v; U.renderSheet(); var i = document.getElementById("petnm"); if (i) i.focus(); };
  U.actions.petadopt = function () {
    var i = document.getElementById("petnm"), r = petAdopt(U.ui().petPick, i ? i.value : "");
    if (r.noName) { U.toast(tr("Ponle un nombre a tu mascota.")); return; }
    if (r.poor) { U.toast(tr("No tienes dinero suficiente.")); return; }
    if (r.ok) { U.edgeFlash(true); U.toast(tr("¡{pet} ya está en casa!", {pet: petOf().nm})); U.ui().petPick = null; U.ui().petView = "care"; rer(); }
  };
  var CARE_TXT = {
    pat: N_("{pet} se acurruca a tu lado: el vínculo crece."), walk: N_("Paseo largo con {pet}: los dos volvéis con energía."), play: N_("Tarde de juegos con {pet}: no paráis de reír."),
    home: N_("El hogar de {pet} queda impecable."), watch: N_("Un rato mirando a {pet}: te quedas en calma."), treat: N_("A {pet} le encanta su premio."),
    spa: N_("{pet} sale reluciente de la peluquería."), photo: N_("Sesión de fotos con {pet}: tus redes lo adoran.")
  };
  U.actions.petact = function (b, v) {
    var r = petAct(v), pt = petOf(); if (!pt) return;
    if (r.poor) { U.toast(tr("No tienes dinero suficiente.")); return; }
    if (r.tired) { U.toast(tr("{pet} ya ha tenido mucha atención este tramo.", {pet: pt.nm})); return; }
    if (!r.ok) return;
    if (v === "trick") U.toast(r.learned ? tr("¡{pet} ha aprendido un truco nuevo! Ya sabe {n}.", {pet: pt.nm, n: pt.tricks}) : tr("{pet} todavía no lo pilla, pero os lo habéis pasado bien.", {pet: pt.nm}));
    else U.toast(tr(CARE_TXT[v] || CARE_TXT.pat, {pet: pt.nm}));
    rer();
    /* 5.6: el truco nuevo se estrena en la vista 3D */
    if (v === "trick" && r.learned && pt.tricks <= 8) show3d({trick: pt.tricks - 1});
  };
  U.actions.petcare = function () { if (petCare()) { U.toast(tr("Pasas la tarde con {pet}: el vínculo crece.", {pet: petOf().nm})); rer(); } };
  U.actions.petname = function () { var i = document.getElementById("petrn"); if (i && petRename(i.value)) { U.toast(tr("Ahora se llama {pet}.", {pet: petOf().nm})); rer(); } };
  U.actions.petcol = function (b, v) { if (petSetCol(v)) rer(); };
  U.actions.petbg = function (b, v) { if (petSetBg(v)) rer(); };
  function show3d(o) {
    if (typeof View3D === "undefined" || !View3D) return;
    o.from = document.querySelector(".sheet .pethero .petart") || document.querySelector(".petart");
    setTimeout(function () { View3D.pet(o); }, 60);
  }
  U.actions.pet3d = function () { show3d({}); };
  U.actions.petwear = function (b, v) {
    var pt = petOf(), a = petAccDef(v), was = pt && a ? petEq(pt)[a.s] : null;
    if (petWear(v)) { rer(); if (was !== v) show3d({acc: v}); }
  };
  U.actions.petbuy = function (b, v) {
    var a = petAccDef(v), r = petBuyAcc(v);
    if (r.poor) { U.toast(tr("No tienes dinero suficiente.")); return; }
    if (r.ok) { U.toast(tr("¡Compra hecha! {pet} ya lleva {acc}.", {pet: petOf() ? petOf().nm : "", acc: a.ico + " " + tr(a.n)})); rer(); show3d({acc: v}); }
  };

  function careView(pt, d) {
    var n = petActN(pt), left = PET_ACT_MAX - n, A = petActs(pt), s = "";
    s += '<div><div class="lbl">' + tr("Vínculo") + " · " + Math.round(pt.bond) + ' %</div><div class="petbond big"><i style="width:' + Math.round(pt.bond) + '%"></i></div><p class="muted lfhint">' + tr("Cuanto más fuerte el vínculo, más te ayuda. Si no le dedicas tiempo, se debilita.") + "</p></div>";
    s += '<div class="lbl">' + tr("Darle cariño") + ' · <span class="muted">' + (left > 0 ? trn(left, "te queda {n} rato este tramo", "te quedan {n} ratos este tramo") : tr("ya le has dedicado tiempo este tramo")) + "</span></div>";
    s += '<div class="petcare">' + petCareList(pt).map(function (c) {
      var cost = petCareCost(c, pt), done = !!A[c.k], dis = done || left <= 0 || (cost && S.p.money < cost);
      var eff = [tr("Vínculo +{n}", {n: c.bond})];
      if (c.mor) eff.push(tr("Moral +{n}", {n: c.mor}));
      if (c.form || c.calm) eff.push(tr("Forma"));
      if (c.fame || c.photo) eff.push(tr("Fama"));
      return '<button class="petact' + (done ? " done" : "") + '" data-a="petact" data-v="' + c.k + '"' + (dis ? " disabled" : "") + '><span class="pai" aria-hidden="true">' + (done ? "✓" : c.ico) + '</span><b>' + h(tr(c.n)) + "</b><small>" + h(tr(c.d)) + '</small><small class="paf">' + h(eff.join(" · ")) + (cost ? " · " + fmtMoney(cost) : "") + "</small></button>";
    }).join("") + "</div>";
    if (pt.tricks) s += '<p class="muted lfhint">🎓 ' + trn(pt.tricks, "Sabe {n} truco", "Sabe {n} trucos") + "</p>";
    s += '<div class="chips">' + chips(d) + "</div>";
    s += '<p class="muted lfhint">' + tr("Gasto anual: {v}. Esperanza de vida: {a}–{b} años.", {v: fmtMoney(d.year), a: d.life[0], b: d.life[1]}) + "</p>";
    s += '<div class="petrn"><input id="petrn" maxlength="16" value="' + h(pt.nm) + '" aria-label="' + h(tr("Nombre")) + '"><button class="btn" data-a="petname">' + tr("Cambiar nombre") + "</button></div>";
    return s;
  }
  function styleView(pt) {
    var s = "", cur = pt.col || "nat", bg = pt.bg || "none", e = petEq(pt);
    s += '<div><div class="lbl">' + tr("Color") + '</div><div class="petsw">' + PET_COL.map(function (c) {
      var ok = petColOk(c);
      return '<button class="psw" data-a="petcol" data-v="' + c[0] + '" aria-pressed="' + (cur === c[0]) + '"' + (ok ? "" : " disabled") + ' title="' + h(ok ? tr(c[1]) : tr(PET_UND[c[3]] || "")) + '">' + art(pt, 26, {col: c[0], bg: "none", bare: true}) + "<small>" + (ok ? "" : "🔒 ") + h(tr(c[1])) + "</small></button>";
    }).join("") + "</div></div>";
    s += '<div><div class="lbl">' + tr("Fondo") + '</div><div class="petsw bg">' + PET_BG.map(function (b) {
      var css = bgCss(b[0]);
      return '<button class="psw" data-a="petbg" data-v="' + b[0] + '" aria-pressed="' + (bg === b[0]) + '"><span class="pbgdot" style="' + (css ? "background:" + css.replace(",transparent 63%", ",transparent 100%") : "") + '"></span><small>' + h(tr(b[1])) + "</small></button>";
    }).join("") + "</div></div>";
    if (petEqList(pt).length) s += '<button class="btn wide" data-a="petview" data-v="edit">✏️ ' + tr("Colocar los accesorios a tu gusto") + "</button>";
    s += '<p class="muted lfhint">' + tr("Los accesorios son tuyos para siempre: si llega otra mascota, también podrá ponérselos. Toca uno que ya tengas para ponérselo o quitárselo.") + "</p>";
    PET_SLOT.forEach(function (sl) {
      s += '<div><div class="lbl">' + h(tr(sl[1])) + '</div><div class="petacc">' + PET_ACC.filter(function (a) { return a.s === sl[0]; }).map(function (a) {
        var own = petHasAcc(a.k), on = own && e[a.s] === a.k;
        if (own) return '<button class="pac own" data-a="petwear" data-v="' + a.k + '" aria-pressed="' + on + '"><span class="pai">' + a.ico + "</span><b>" + h(tr(a.n)) + "</b><small>" + (on ? tr("Puesto") : tr("Ponérselo")) + (a.un ? " · 🏆" : "") + "</small></button>";
        if (a.un) return '<div class="pac lock"><span class="pai">' + a.ico + "</span><b>" + h(tr(a.n)) + "</b><small>🔒 " + h(tr(a.ud)) + "</small></div>";
        return '<button class="pac" data-a="petbuy" data-v="' + a.k + '"' + (S.p.money < a.price ? " disabled" : "") + '><span class="pai">' + a.ico + "</span><b>" + h(tr(a.n)) + "</b><small>" + tr("Comprar · {p}", {p: fmtMoney(a.price)}) + "</small></button>";
      }).join("") + "</div></div>";
    });
    return s;
  }

  /* ---------- modo edición: el jugador coloca cada accesorio (arrastrar, tamaño, giro) ---------- */
  function adjOf(pt, ico, sl, make) {
    if (!pt.adj || typeof pt.adj !== "object") { if (!make) return null; pt.adj = {}; }
    if (!pt.adj[ico]) { if (!make) return null; pt.adj[ico] = {}; }
    if (!pt.adj[ico][sl]) { if (!make) return null; pt.adj[ico][sl] = {x: 0, y: 0, s: 1, r: 0}; }
    return pt.adj[ico][sl];
  }
  function editSel(pt) {
    var eq = petEq(pt), sel = U.ui().petSel;
    if (!sel || !eq[sel] || !petHasAcc(eq[sel])) sel = (PET_SLOT.filter(function (x) { return eq[x[0]] && petHasAcc(eq[x[0]]); })[0] || [null])[0];
    U.ui().petSel = sel; return sel;
  }
  function editView(pt) {
    var sel = editSel(pt), eq = petEq(pt), ico = petIco(pt);
    var s = '<p class="muted lfhint">' + tr("Arrastra cada accesorio con el dedo para colocarlo. Usa los botones para cambiar el tamaño, girarlo o moverlo con precisión.") + "</p>";
    s += '<div class="petedit">' + art(pt, 190, {edit: true, sel: sel}) + "</div>";
    if (!sel) return s + '<button class="btn wide" data-a="petview" data-v="style">' + tr("Volver") + "</button>";
    s += '<div class="seg petselseg">' + PET_SLOT.filter(function (x) { return eq[x[0]] && petHasAcc(eq[x[0]]); }).map(function (x) {
      var a = petAccDef(eq[x[0]]); return '<button data-a="petsel" data-v="' + x[0] + '" aria-pressed="' + (sel === x[0]) + '">' + a.ico + " " + h(tr(x[1])) + "</button>";
    }).join("") + "</div>";
    var j = adjOf(pt, ico, sel) || {s: 1, r: 0};
    function bt(v, t, lbl) { return '<button class="btn petadjb" data-a="petadj" data-v="' + v + '" aria-label="' + h(lbl) + '">' + t + "</button>"; }
    s += '<div class="petadj">' +
      '<div class="petpad">' + bt("u", "▲", tr("Subir")) + "<span>" + bt("l", "◀", tr("A la izquierda")) + bt("r", "▶", tr("A la derecha")) + "</span>" + bt("d", "▼", tr("Bajar")) + "</div>" +
      '<div class="petadjcol"><div class="lbl">' + tr("Tamaño") + " · " + Math.round((j.s || 1) * 100) + ' %</div><div class="petadjrow">' + bt("s-", "−", tr("Más pequeño")) + bt("s+", "+", tr("Más grande")) + "</div>" +
      '<div class="lbl">' + tr("Giro") + " · " + (j.r || 0) + '°</div><div class="petadjrow">' + bt("r-", "↺", tr("Girar a la izquierda")) + bt("r+", "↻", tr("Girar a la derecha")) + "</div></div></div>";
    s += '<div class="petadjrow">' + '<button class="btn" data-a="petadj" data-v="reset">' + tr("Recolocar este") + '</button><button class="btn" data-a="petadj" data-v="resetall">' + tr("Recolocar todos") + "</button></div>";
    s += '<p class="muted lfhint">' + tr("Cada etapa de tu mascota tiene su propio dibujo: cuando crezca, quizá tengas que volver a colocarlos.") + "</p>";
    return s + '<button class="go" data-a="petview" data-v="style">' + tr("Listo") + "</button>";
  }
  U.actions.petsel = function (b, v) { U.ui().petSel = v; U.renderSheet(); };
  U.actions.petadj = function (b, v) {
    var pt = petOf(); if (!pt) return;
    var ico = petIco(pt), sel = editSel(pt);
    if (v === "resetall") { if (pt.adj) delete pt.adj[ico]; rer(); return; }
    if (!sel) return;
    if (v === "reset") { if (pt.adj && pt.adj[ico]) delete pt.adj[ico][sel]; rer(); return; }
    var j = adjOf(pt, ico, sel, true), st = 1.5;
    if (v === "l") j.x = clamp(j.x - st, -60, 60); else if (v === "r") j.x = clamp(j.x + st, -60, 60);
    else if (v === "u") j.y = clamp(j.y - st, -60, 60); else if (v === "d") j.y = clamp(j.y + st, -60, 60);
    else if (v === "s+") j.s = clamp(Math.round((j.s + 0.1) * 10) / 10, 0.4, 2.5); else if (v === "s-") j.s = clamp(Math.round((j.s - 0.1) * 10) / 10, 0.4, 2.5);
    else if (v === "r+") j.r = clamp(j.r + 10, -180, 180); else if (v === "r-") j.r = clamp(j.r - 10, -180, 180);
    rer();
  };
  /* arrastrar con el dedo o el ratón */
  document.addEventListener("pointerdown", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".petedit .pacc") : null; if (!el) return;
    var pt = petOf(), box = el.parentNode; if (!pt || !box) return;
    e.preventDefault();
    var ico = box.getAttribute("data-ico"), sl = el.getAttribute("data-sl"), r = box.getBoundingClientRect();
    U.ui().petSel = sl;
    Array.prototype.forEach.call(box.querySelectorAll(".pacc"), function (x) { x.classList.toggle("sel", x === el); });
    var j = adjOf(pt, ico, sl, true), x0 = j.x, y0 = j.y, sx = e.clientX, sy = e.clientY, moved = false;
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
    function mv(ev) {
      var dx = (ev.clientX - sx) / r.width * 100, dy = (ev.clientY - sy) / r.height * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) moved = true;
      j.x = clamp(Math.round((x0 + dx) * 10) / 10, -60, 60); j.y = clamp(Math.round((y0 + dy) * 10) / 10, -60, 60);
      el.setAttribute("style", accStyle(pt, ico, sl));
    }
    function up() {
      el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      U.persist(); U.renderSheet(); if (moved) U.render(false);
    }
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
  /* teclado: flechas para mover el accesorio enfocado */
  document.addEventListener("keydown", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".petedit .pacc") : null; if (!el) return;
    var m = {ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d", "+": "s+", "-": "s-"}[e.key]; if (!m) return;
    e.preventDefault(); U.ui().petSel = el.getAttribute("data-sl"); U.actions.petadj(null, m);
    var n = document.querySelector('.petedit .pacc[data-sl="' + U.ui().petSel + '"]'); if (n) n.focus();
  });

  U.sheets.lpet = function () {
    var pt = petOf(), L = lifeOf(), s;
    if (pt) {
      petAccSync(true);
      var d = petDef(pt.k), st = petStage(pt), v = U.ui().petView === "style" || U.ui().petView === "edit" ? U.ui().petView : "care";
      s = '<h2>' + tr("Tu mascota") + '</h2><div class="stack"><div class="pethero">' + art(pt, petSize(pt) + 30) + '<div><b class="petnm">' + h(pt.nm) + "</b><small>" + h(tr(d.n)) + " · " + trn(pt.age, "{n} año", "{n} años") + "</small>" + (petNeeds() ? '<small class="petneed">' + tr("Necesita atención") + "</small>" : "") + "</div></div>";
      if (typeof View3D !== "undefined" && View3D && View3D.supported()) s += '<button class="btn v3dbtn" data-a="pet3d">' + tr("Ver en 3D") + (pt.tricks ? " · " + trn(Math.min(pt.tricks, 8), "{n} truco", "{n} trucos") : "") + "</button>";
      s += '<ol class="petstages">' + PET_STAGE.map(function (x, i) { return '<li class="' + (i < st ? "done" : i === st ? "now" : "") + '">' + h(tr(x)) + "</li>"; }).join("") + "</ol>";
      if (v === "edit") { s = '<h2>' + tr("Colocar accesorios") + '</h2><div class="stack">' + editView(pt); }
      else {
        s += '<div class="seg"><button data-a="petview" data-v="care" aria-pressed="' + (v === "care") + '">' + tr("Cuidar") + '</button><button data-a="petview" data-v="style" aria-pressed="' + (v === "style") + '">' + tr("Estilo") + "</button></div>";
        s += v === "style" ? styleView(pt) : careView(pt, d);
      }
    } else {
      var tab = U.ui().petTab || "n", pick = U.ui().petPick, list = PET_DEF.filter(function (x) { return tab === "x" ? x.ex : !x.ex; });
      s = '<h2>' + tr("Adoptar una mascota") + '</h2><div class="stack"><p class="muted" style="margin:0">' + tr("Llega como cría y crece contigo temporada a temporada. Tienes {m}.", {m: fmtMoney(S.p.money)}) + "</p>";
      s += '<div class="seg"><button data-a="pettab" data-v="n" aria-pressed="' + (tab === "n") + '">' + tr("Normales") + '</button><button data-a="pettab" data-v="x" aria-pressed="' + (tab === "x") + '">' + tr("Exóticas") + "</button></div>";
      if (tab === "x") s += '<p class="muted lfhint">' + tr("Las exóticas dan más fama, pero cuestan más y pueden dar sustos.") + "</p>";
      s += '<div class="petlist">' + list.map(function (d) {
        var on = pick === d.k, can = S.p.money >= d.price;
        return '<div class="petrow' + (on ? " on" : "") + '"><button class="petrowb" data-a="petpick" data-v="' + d.k + '" aria-pressed="' + on + '"' + (can ? "" : " disabled") + '><span class="petic" aria-hidden="true">' + d.ico[0] + '</span><span class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + "</small><small class=\"muted\">" +
          tr("{p} · {y}/año · vive {a}–{b} años", {p: fmtMoney(d.price), y: fmtMoney(d.year), a: d.life[0], b: d.life[1]}) + '</small><span class="chips">' + chips(d) + "</span></span></button>" +
          (on ? '<div class="petadopt"><input id="petnm" maxlength="16" placeholder="' + h(tr("¿Cómo se va a llamar?")) + '" aria-label="' + h(tr("Nombre de la mascota")) + '"><button class="go" data-a="petadopt">' + tr("Adoptar") + "</button></div>" : "") + "</div>";
      }).join("") + "</div>";
      if (L.petAcc && L.petAcc.length) s += '<p class="muted lfhint">' + trn(L.petAcc.length, "Guardas {n} accesorio para tu próxima mascota.", "Guardas {n} accesorios para tu próxima mascota.") + "</p>";
    }
    if (L.petMem && L.petMem.length) s += '<div><div class="lbl">' + tr("En el recuerdo") + '</div><ul class="petmem">' + L.petMem.slice(-6).reverse().map(function (m) { var d = petDef(m.k); return "<li>🌈 <b>" + h(m.nm) + "</b> · " + h(d ? tr(d.n) : "") + " · " + m.y0 + "–" + m.y1 + "</li>"; }).join("") + "</ul></div>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
})();
