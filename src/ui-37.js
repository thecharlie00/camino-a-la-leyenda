/* ui-37.js — versión 3.7: caras de los jugadores, posiciones secundarias, media física y etiqueta de versión. */
(function () {
  if (typeof UIX === "undefined" || typeof faceSVG !== "function") return;
  var U = UIX, h = U.h;
  var LV_CLS = ["nat", "sec", "emg", "inc"], PHY_TXT = [N_("Óptimo"), N_("Justo"), N_("En reserva")];

  /* ---------- caras ---------- */
  function kit(p) {
    var club = S && S.m ? S.m.club : -1, col = club >= 0 && W.clubs[club] && W.clubs[club].col ? W.clubs[club].col : ["#2c6fb7", "#ffffff"];
    return p && p.pos === "POR" ? {c1: "#2bb673", c2: col[0]} : {c1: col[0], c2: col[1]};
  }
  var CACHE = {}, CN = 0;
  function faceHTML(p, size) {
    var k = kit(p), key = [p.id, p.fn, p.ln, p.nat, (p.age || 0) >= 33 ? 1 : 0, size, k.c1, k.c2, S && S.g].join("|");
    if (!CACHE[key]) { if (++CN > 600) { CACHE = {}; CN = 0; } CACHE[key] = faceSVG(p, size, k); }
    return CACHE[key];
  }
  function bat(p) {
    if (!S || !S.m || typeof plPhy !== "function") return "";
    var v = plPhy(p), lv = phyLv(v);
    /* el aviso solo sale si de verdad está cansado (la base física baja sola no es cansancio) */
    if (lv === 1 && p.fit >= 75) lv = 0;
    return lv ? '<i class="fbat l' + lv + '" title="' + h(tr("Media física {n}", {n: v})) + '">⚡</i>' : "";
  }
  U.hk.av = function (p, size) {
    if (!p) return "";
    return '<span class="fav" style="width:' + size + "px;height:" + size + 'px">' + faceHTML(p, size) + bat(p) + "</span>";
  };
  U.faceHTML = faceHTML;

  /* ---------- posiciones ---------- */
  U.hk.posB = function (p) {
    var p2 = typeof plPos2 === "function" ? plPos2(p) : [];
    return h(posAb(p.pos)) + (p2.length ? '<small class="pp2">' + h(p2.map(posAb).join("/")) + "</small>" : "");
  };
  U.hk.lvTag = function (p, sp) {
    var lv = posLv(p, sp);
    return lv ? ' <span class="lvtag ' + LV_CLS[lv] + '">' + (lv >= 2 ? "⚠ " : "") + h(tr(POS_LV_NAMES[lv])) + "</span>" : "";
  };

  /* ---------- media física ---------- */
  var PHY_C = ["var(--grass)", "var(--led)", "var(--red)"];
  U.hk.phy = function (p) { var v = plPhy(p); return '<i style="--w:' + v + "%;--c:" + PHY_C[phyLv(v)] + '"></i>'; };

  /* ---------- ficha del jugador ---------- */
  U.hk.psTop = function (p) {
    var role = p.yth ? ["yth", N_("Canterano")] : p.role === "C" ? ["star", N_("Estrella")] : null;
    var p2 = plPos2(p);
    return '<div class="pstop"><span class="favbig' + (role ? " " + role[0] : "") + '">' + faceHTML(p, 128) + (role ? '<em>' + h(tr(role[1])) + "</em>" : "") + "</span>" +
      '<div class="psposl"><span class="lbl">' + tr("Posiciones") + '</span><div class="pschips"><span class="lvtag nat">' + h(posAb(p.pos)) + " · " + h(tr("Natural")) + "</span>" +
      p2.map(function (x) { return '<span class="lvtag sec">' + h(posAb(x)) + " · " + h(tr("Secundaria")) + "</span>"; }).join("") + "</div></div></div>";
  };
  U.hk.psPhy = function (p) {
    var v = plPhy(p), lv = phyLv(v);
    return '<div class="psphy l' + lv + '"><div class="psphyh"><span class="lbl">' + tr("Media física") + '</span><b>' + v + '</b><span class="psphyt">' + h(tr(PHY_TXT[lv])) + "</span></div>" +
      '<div class="phybar"><i style="width:' + v + '%"></i></div>' +
      '<div class="phyparts"><span>' + tr("Resistencia") + " <b>" + plRes(p) + "</b></span><span>" + tr("Condición") + " <b>" + Math.round(p.fit) + "</b></span><span>" + tr("Fuerza y ritmo") + " <b>" + plFza(p) + "</b></span></div>" +
      '<div class="lbl phy2d">' + tr("En el campo 2D") + '</div><div class="phyparts"><span>' + tr("Pase") + " <b>" + plPas(p) + "</b></span><span>" + tr("Entrada") + " <b>" + plEnt(p) + "</b></span><span>" + tr("Colocación") + " <b>" + plCol(p) + "</b></span></div>" +
      '<p class="muted phyhint">' + (lv === 2 ? (p.fit < 60 ? tr("Riesgo alto de lesión y bajón en la segunda parte. Mejor que descanse.") : tr("Físico muy limitado: necesita rotaciones.")) : lv === 1 ? (p.fit < 75 ? tr("Algo cansado: rinde un poco menos y el riesgo de lesión sube.") : tr("Físico justo: aguanta peor los partidos seguidos.")) : tr("En plena forma para jugar.")) + "</p></div>";
  };

  /* ---------- consejo del segundo entrenador ---------- */
  function tiredXI() {
    var m = S && S.m; if (!m || m.club < 0 || !m.xi) return [];
    if (m.phySkip === S.tw) return [];
    return m.xi.map(function (id, i) { var p = id != null ? mPl(id) : null; return p && mAvail(p) ? {p: p, i: i, v: plPhy(p)} : null; })
      .filter(function (x) { return x && x.v < 60; }).sort(function (a, b) { return a.v - b.v; });
  }
  function bestSub(i) {
    var m = S.m, sp = FORMATIONS[m.form][i], inXI = {};
    m.xi.forEach(function (id) { if (id != null) inXI[id] = 1; });
    var c = m.sq.filter(function (q) { return !q.loanOut && !inXI[q.id] && mAvail(q) && posOk(q.pos, sp, q) && plPhy(q) >= 60; });
    c.sort(function (a, b) { return mSlotEff(b, sp) - mSlotEff(a, sp); });
    return c[0] || null;
  }
  function assistCard() {
    var t = tiredXI(); if (!t.length) return "";
    var x = t[0], sub = bestSub(x.i);
    var more = t.length > 1 ? " " + trn(t.length - 1, "Hay {n} titular más en rojo.", "Hay {n} titulares más en rojo.") : "";
    return '<section class="card assist"><div class="assisth">' + U.hk.av(x.p, 40) + '<div class="grow"><span class="eyebrow">' + tr("Tu segundo entrenador") + "</span><p>«" + h(tr("{n} muestra una media física de {v}: te recomiendo que descanse el próximo partido.", {n: plShort(x.p), v: x.v})) + "»" + h(more) + "</p></div></div>" +
      '<div class="assistb">' + (sub ? '<button class="btn pri" data-a="phyrest" data-v="' + x.i + '">' + h(tr("Que entre {n}", {n: plShort(sub)})) + "</button>" : "") + '<button class="btn" data-a="physkip">' + tr("Ahora no") + "</button></div></section>";
  }
  U.add("plantillaTop", function () { return U.isMgr() ? assistCard() : ""; });
  U.add("clubTop", function () { return U.isMgr() ? assistCard() : ""; });
  U.actions.phyrest = function (b, v) {
    var m = S.m, i = +v, out = mPl(m.xi[i]), sub = bestSub(i); if (!out || !sub) return;
    var bi = (m.bench || []).indexOf(sub.id);
    m.xi[i] = sub.id;
    if (bi >= 0) m.bench[bi] = out.id; else if ((m.bench || []).length < BENCH_N) m.bench.push(out.id);
    U.toast(tr("{a} descansa y entra {b}.", {a: plShort(out), b: plShort(sub)}));
    U.persist(); U.render(false);
  };
  U.actions.physkip = function () { S.m.phySkip = S.tw; U.persist(); U.render(false); };

  /* ---------- etiqueta de versión ---------- */
  var B = typeof BUILD !== "undefined" ? BUILD : {v: "?", code: 0, t: ""};
  function chan() { return window.AndroidBridge ? "LIVE" : "WEB"; }
  function tagTxt() { return "v" + B.v + " (" + B.code + ") · " + chan(); }
  var NOTES = [N_("Pareja, hijos y una relación que cuidar, como jugador y como entrenador"), N_("Ficha a tu hijo o a tu hija y sigue su carrera"), N_("El relevo puede ser tu hijo o tu hija, y llegan las ligas de Tailandia")];
  function sysInfo() {
    var n = 0; try { n = (U.ui().slots || []).length; } catch (e) {}
    return [
      tr("Camino a la Leyenda {tag}", {tag: tagTxt()}),
      tr("Build: {build}", {build: B.t || "?"}),
      tr("Idioma: {lang}", {lang: LANG}),
      tr("Modo: {mode}", {mode: S ? (S.mode || "p") + (S.g === "f" ? " (f)" : "") : "-"}),
      tr("Temporada: {season}", {season: S ? S.yr : "-"}),
      tr("Pantalla: {size} @{dpr}", {size: window.innerWidth + "x" + window.innerHeight, dpr: window.devicePixelRatio || 1}),
      tr("Navegador: {ua}", {ua: navigator.userAgent})
    ].join("\n");
  }
  U.add("after", function () {
    var home = document.querySelector('#main [data-a="newgame"]');
    if (home && !document.getElementById("vtag")) {
      var st = document.querySelector("#main .stack");
      if (st) { var b = document.createElement("button"); b.id = "vtag"; b.className = "vtag"; b.setAttribute("data-a", "vtag"); b.textContent = tagTxt(); st.appendChild(b); }
    }
    return "";
  });
  U.add("menu", function () { return '<button class="vtag inmenu" data-a="vtag">' + h(tagTxt()) + "</button>"; });
  U.actions.vtag = function () { U.open("vtag"); };
  U.sheets.vtag = function () {
    var d = B.t ? new Date(B.t) : null;
    return "<h2>" + tr("Versión") + '</h2><div class="stack"><div class="kvlist"><div><span>' + tr("Versión") + "</span><span>" + h(B.v) + " · " + tr("compilación {n}", {n: B.code}) + "</span></div><div><span>" + tr("Canal") + "</span><span>" + chan() + "</span></div>" +
      "<div><span>" + tr("Compilado") + "</span><span>" + (d && !isNaN(d) ? h(d.toLocaleString(LANG, {dateStyle: "medium", timeStyle: "short"})) : "—") + "</span></div></div>" +
      '<div><div class="lbl">' + tr("Novedades") + '</div><ul class="vnotes">' + NOTES.map(function (n) { return "<li>" + h(tr(n)) + "</li>"; }).join("") + "</ul></div>" +
      '<button class="btn wide" data-a="vcopy">' + tr("Copiar información del sistema") + '</button><p class="muted" style="font-size:var(--fs-xs);margin:0">' + tr("Pégala cuando informes de un error: así sabremos qué versión y qué dispositivo usas.") + "</p>" +
      '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.vcopy = function () {
    var t = sysInfo(), ok = function () { U.toast(tr("Información copiada")); };
    if (window.AndroidBridge && window.AndroidBridge.copy) { try { window.AndroidBridge.copy(t); ok(); return; } catch (e) {} }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(ok, function () { window.prompt(tr("Copiar información del sistema"), t); }); return; }
    window.prompt(tr("Copiar información del sistema"), t);
  };
})();
