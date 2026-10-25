/* ui-life.js — interfaz de VIDA FUERA DEL CAMPO (patch 2.5): dorsal, estilo de vida, look y rivalidad */
(function () {
  if (typeof window === "undefined" || !window.UIX) return;
  var U = window.UIX, h = U.h;
  function on() { return !!(S && S.p && !U.isMgr() && S.p.life); }
  function rer() {
    var pn = document.querySelector(".sheet .panel"), y = pn ? pn.scrollTop : 0;
    U.persist(); U.render(false);
    pn = document.querySelector(".sheet .panel"); if (pn) pn.scrollTop = y;
  }
  function lum(col) {
    col = String(col || "");
    var m = col.match(/^hsl\(\d+,\d+%,(\d+)%\)$/);
    if (m) return +m[1] / 100;
    if (col.charAt(0) !== "#") return 0.5;
    if (col.length === 4) col = "#" + col.charAt(1) + col.charAt(1) + col.charAt(2) + col.charAt(2) + col.charAt(3) + col.charAt(3);
    var r = parseInt(col.substr(1, 2), 16), g = parseInt(col.substr(3, 2), 16), b = parseInt(col.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function ink(col) { return lum(col) > 0.6 ? "#141414" : "#ffffff"; }
  function kitOf(club, gk) {
    var col = club >= 0 && W.clubs[club] && W.clubs[club].col ? W.clubs[club].col : ["#c8102e", "#ffffff"];
    var c1 = col[0], c2 = col[1];
    if (gk) {
      var opts = ["#2bb673", "#c6f432", "#1b1d1f", "#ff7a1a", "#7a3cf0"], k = hashStr(String(club)) % opts.length;
      for (var i = 0; i < opts.length && Math.abs(lum(opts[k]) - lum(c1)) < 0.18; i++) k = (k + 1) % opts.length;
      c2 = c1; c1 = opts[k];
    }
    return {c1: c1, c2: c2, socks: gk ? c1 : c1, sh: gk ? "#1b1d1f" : c2};
  }

  /* ---------- avatar 2D (SVG) ---------- */
  function avatar(look, club, num, gk, cls, cap) {
    /* 5.7: la figura se dibuja desde una descripción ya resuelta (la mía sale de PLook; la del rival, de su look) */
    var R0 = look.__r ? look : cosLook(look);
    var skin = R0.skin, hc = R0.hcol, hair = R0.hair || "short", boots = R0.boots, th = R0.therm, sl = th ? th.k : "short", gl = R0.gloves || {c: "#f4f4f0", c2: "#d33"};
    var k = kitOf(club, gk), c1 = k.c1, c2 = k.c2, txt = ink(c1) === "#141414" ? (lum(c2) < 0.6 ? c2 : "#141414") : (lum(c2) > 0.45 ? c2 : "#ffffff");
    var armCol = sl === "long" ? c1 : sl === "under" ? th.c : skin, legCol = sl === "tights" ? th.c : skin;
    /* figura de cuerpo entero en pixel art (celda 5, sin rasgos faciales) */
    var R = [], B = function (x0, y0, x1, y1, c, tag) { R.push([x0, y0, x1, y1, c, tag]); };
    var shade = function (c, k) { return typeof PX !== "undefined" ? PX.shade(c, k) : c; };
    B(6, 33, 17, 33, "rgba(0,0,0,.35)");
    if (hair === "long") { B(8, 3, 8, 10, hc); B(15, 3, 15, 10, hc); }
    /* piernas, medias y botas */
    B(8, 24, 10, 26, legCol); B(13, 24, 15, 26, legCol);
    B(8, 27, 10, 31, k.socks); B(13, 27, 15, 31, k.socks); B(8, 27, 10, 27, c2); B(13, 27, 15, 27, c2);
    B(7, 32, 10, 32, boots); B(13, 32, 16, 32, boots);
    /* pantalón */
    B(7, 20, 16, 22, k.sh); B(7, 23, 10, 23, k.sh); B(13, 23, 16, 23, k.sh); B(7, 20, 7, 23, shade(k.sh, 0.8));
    /* brazos y mangas */
    B(5, 13, 6, 19, armCol); B(17, 13, 18, 19, armCol);
    if (sl !== "long") { B(5, 10, 6, 12, c1); B(17, 10, 18, 12, c1); B(5, 12, 6, 12, c2); B(17, 12, 18, 12, c2); }
    else { B(5, 10, 6, 12, c1); B(17, 10, 18, 12, c1); }
    if (cap || R0.arm) B(5, 11, 6, 11, R0.arm || "#ffb21e");
    if (gk) { B(4, 19, 6, 21, gl.c); B(17, 19, 19, 21, gl.c); B(4, 19, 6, 19, gl.c2); B(17, 19, 19, 19, gl.c2); }
    else { B(5, 20, 6, 20, skin); B(17, 20, 18, 20, skin); }
    /* camiseta con cuello en pico */
    B(7, 10, 16, 19, c1); B(7, 10, 8, 19, shade(c1, 0.82)); B(10, 10, 13, 10, c2); B(11, 11, 12, 11, c2);
    /* cabeza: cuello, cara lisa y orejas */
    B(11, 9, 12, 9, shade(skin, 0.85)); B(9, 3, 14, 8, skin); B(14, 3, 14, 8, shade(skin, 0.86)); B(8, 5, 8, 6, skin); B(15, 5, 15, 6, shade(skin, 0.86));
    if (hair === "short") { B(9, 1, 14, 2, hc); B(9, 3, 9, 4, hc); B(14, 3, 14, 3, hc); }
    else if (hair === "buzz") B(9, 2, 14, 2, shade(hc, 1.15));
    else if (hair === "curly") { B(8, 1, 15, 2, hc); B(9, 0, 10, 0, hc); B(12, 0, 13, 0, hc); B(8, 3, 8, 4, hc); B(15, 3, 15, 4, hc); }
    else if (hair === "long") { B(9, 1, 14, 2, hc); B(9, 3, 14, 3, hc); }
    if (R0.band) B(9, 3, 14, 3, R0.band === "club" ? c1 : R0.band);
    /* 5.6: ojos de un píxel (parpadean en la zona Yo) */
    var eye = shade(skin, 0.32); B(10, 5, 10, 5, eye, "eyes"); B(13, 5, 13, 5, eye, "eyes");
    /* dorsal en cifras de píxel */
    var F = {"0": ["###", "#.#", "#.#", "#.#", "###"], "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"], "3": ["##.", "..#", ".#.", "..#", "##."],
      "4": ["#.#", "#.#", "###", "..#", "..#"], "5": ["###", "#..", "##.", "..#", "##."], "6": [".##", "#..", "###", "#.#", "###"], "7": ["###", "..#", ".#.", ".#.", ".#."],
      "8": ["###", "#.#", "###", "#.#", "###"], "9": ["###", "#.#", "###", "..#", "##."]};
    var ns = String(num || ""), nw = ns.length * 4 - 1, nx0 = Math.round(12 - nw / 2);
    var rig = / rig\b|^rig\b/.test(cls || "");
    var s = '<svg class="' + (cls || "lfsvg") + ' px" viewBox="0 0 120 170" role="img" aria-label="' + h(tr("Tu avatar")) + '" shape-rendering="crispEdges">';
    var rr = function (b) { return '<rect x="' + b[0] * 5 + '" y="' + b[1] * 5 + '" width="' + (b[2] - b[0] + 1) * 5 + '" height="' + (b[3] - b[1] + 1) * 5 + '" fill="' + b[4] + '"/>'; };
    /* modelo de partes para la animación (y para la vista 3D): misma figura, agrupada por articulaciones */
    U._avRects = R;
    if (!rig) R.forEach(function (b) { s += rr(b); });
    else {
      var G = {sh: "", legL: "", legR: "", torso: "", armL: "", armR: "", head: "", eyes: ""};
      R.forEach(function (b) { G[lifeRigPart(b)] += rr(b); });
      s += '<g class="pa-sh">' + G.sh + '</g><g class="pa-body"><g class="pa-legL">' + G.legL + '</g><g class="pa-legR">' + G.legR + '</g><g class="pa-up"><g class="pa-armL">' + G.armL + '</g><g class="pa-torso">' + G.torso;
    }
    /* el dorsal usa media celda para que quepan dos cifras */
    for (var di = 0; di < ns.length; di++) {
      var gph = F[ns.charAt(di)]; if (!gph) continue;
      for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < 3; gx++) if (gph[gy].charAt(gx) === "#")
        s += '<rect x="' + (60 - (nw * 2.5) / 2 + (di * 4 + gx) * 2.5).toFixed(1) + '" y="' + (68 + gy * 2.5) + '" width="2.5" height="2.5" fill="' + txt + '"/>';
    }
    if (rig) s += '</g><g class="pa-armR">' + G.armR + '</g><g class="pa-head">' + G.head + '<g class="pa-eyes">' + G.eyes + "</g></g></g>" +
      '<g class="pa-ball"><rect x="-6" y="-6" width="12" height="12" fill="#f4f4f0"/><rect x="-2" y="-2" width="4" height="4" fill="#1b1d1f"/><rect x="-6" y="-2" width="2" height="4" fill="#1b1d1f"/><rect x="4" y="-2" width="2" height="4" fill="#1b1d1f"/></g></g>';
    return s + "</svg>";
  }
  /* a qué articulación pertenece cada bloque de la figura (celdas de 24 × 34) */
  function lifeRigPart(b) {
    if (b[5] === "eyes") return "eyes";
    var x0 = b[0], y0 = b[1], x1 = b[2], y1 = b[3];
    if (y0 >= 33) return "sh";
    if (y1 <= 9 || ((x0 === 8 || x0 === 15) && x1 === x0 && y0 <= 10 && y0 >= 0 && y1 <= 10 && y0 < 9)) return "head";
    if (x1 <= 6 && y0 >= 10) return "armL";
    if (x0 >= 17 && y0 >= 10) return "armR";
    if (y0 >= 24) return x1 <= 11 ? "legL" : "legR";
    return "torso";
  }
  U.lifeRigPart = lifeRigPart;
  U.lifeAvatar = avatar;
  /* look de partidas antiguas o del rival (ids de LIFE_COS) → descripción resuelta */
  function cosLook(look) {
    var get = function (cat) { return lifeItem(cat, look[cat] || LIFE_COS_DEF[cat]); }, sl = look.sleeve || "short", band = look.band || "none";
    return {__r: 1, skin: get("skin").c, hcol: get("hcol").c, hair: look.hair || "short", boots: get("boots").c, gloves: get("gloves"),
      therm: sl === "short" ? null : {k: sl, c: "#16191b"}, band: band === "none" || band === "cap" ? null : band === "club" ? "club" : get("band").c || "#fff", arm: band === "cap" ? "#ffb21e" : null};
  }
  function myLook() {
    if (typeof PLook === "undefined") return Object.assign({}, LIFE_COS_DEF, lifeOf().cos);
    var p = PLook.player(), band = p.gear.band && p.gear.band.cos === "band:club" ? "club" : p.band;
    return {__r: 1, skin: p.skin, hcol: p.hair, hair: p.hairId, boots: p.boots, gloves: p.gloves, therm: p.therm, band: band, arm: p.gear.arm ? p.arm : null};
  }
  function myAvatar(cls) { var L = lifeOf(); return avatar(myLook(), S.p.club, L.num, isGK(), cls, !!S.p.flags.captain); }
  U.myAvatar = myAvatar;
  /* bloques de mi figura (para la vista 3D) y colores de la equipación */
  U.myAvatarRects = function () { myAvatar(""); return U._avRects.slice(); };

  /* ---------- creación: dorsal preferido ---------- */
  U.add("create", function (c) {
    if (!c || c.kind !== "p" || c.step !== 1) return "";
    var cur = +c.lnum || lifeDefNum(c.pos), cl = (LIFE_CLASSIC[c.pos] || []).slice(), base = c.pos === "POR" ? [1, 13, 25] : [7, 9, 10, 11, 8, 6, 4, 3, 2, 5];
    base.forEach(function (n) { if (cl.indexOf(n) < 0) cl.push(n); });
    if (c.pos === "POR") cl = [1, 13, 25, 12, 30, 31].filter(function (n, i, a) { return a.indexOf(n) === i; });
    var s = '<div class="lfcreate"><div class="lfcnum" aria-hidden="true">' + cur + '</div><div class="grow"><label class="lbl" for="lnum">' + tr("Dorsal preferido") + "</label>";
    s += '<div class="lfchips">' + cl.slice(0, 8).map(function (n) { return '<button class="lfnchip" data-a="lfcnum" data-v="' + n + '" aria-pressed="' + (cur === n) + '">' + n + "</button>"; }).join("") + "</div>";
    s += '<select id="lnum" data-f="lnum" aria-label="' + h(tr("Elige cualquier número del 1 al 99")) + '">' + range(99).map(function (i) { return '<option value="' + (i + 1) + '"' + (cur === i + 1 ? " selected" : "") + ">" + tr("Dorsal {n}", {n: i + 1}) + "</option>"; }).join("") + "</select>";
    s += '<p class="muted lfhint">' + tr("Si en tu club ya lo lleva alguien, te darán el más cercano y podrás pedirlo la temporada siguiente.") + "</p></div></div>";
    return s;
  });
  U.actions.lfcnum = function (b, v) { var c = U.ui().cr; if (c) { c.lnum = +v; U.render(false); } };
  (function () {
    var _nc = newCareer;
    newCareer = function (o) {
      var c = U.ui().cr;
      if (o && o.num == null && c && c.kind === "p") o.num = +c.lnum || lifeDefNum(c.pos);
      return _nc.apply(this, arguments);
    };
  })();

  /* ---------- pestaña Jugador: tarjeta «Fuera del campo» ---------- */
  function money(v) { return fmtMoney(v); }
  U.add("jugador", function () {
    if (!S || !S.p || U.isMgr()) return "";
    var L = lifeOf();
    if (!L.num) lifeSyncNum();
    if (!L.rv && S.p.club >= 0) lifeNewRv();
    var p = S.p, rv = L.rv, act = Object.keys(L.svc).filter(function (k) { return L.svc[k].left > 0; });
    var s = '<section class="card lfhub"><div class="lfhub-top"><div class="lfav" data-a="lfavtap" role="button" tabindex="0" aria-label="' + h(tr("Tu jugador")) + '">' + myAvatar("lfsvg rig") + '</div><div class="lfinfo">';
    s += '<div class="eyebrow">' + tr("Fuera del campo") + "</div>";
    s += '<button class="lfnumbtn" data-a="lfopen" data-v="lnum"><b class="num">' + L.num + "</b><span>" + tr("Dorsal") + (L.num !== L.pref ? "<small>" + tr("Prefieres el {n}", {n: L.pref}) + "</small>" : "<small>" + tr("Cambiar") + "</small>") + "</span></button>";
    s += '<div class="lfcel"><span class="eyebrow">' + tr("Celebración") + "</span><b>" + h(tr(lifeCel().n)) + "</b></div>";
    if (act.length) s += '<div class="lfact">' + act.map(function (k) { var d = lifeSvcDef(k); return '<span class="chip up">' + d.ico + " " + h(tr(d.n)) + " · " + L.svc[k].left + "</span>"; }).join("") + "</div>";
    s += "</div></div>";
    s += '<div class="lfbtns"><button class="btn" data-a="lfopen" data-v="lvida">' + tr("Vida y dinero") + (act.length || L.inv.length ? ' <span class="lfbad">' + (act.length + L.inv.length) + "</span>" : "") + '</button><button class="btn" data-a="lfopen" data-v="llook">' + tr("Look y celebración") + "</button></div>";
    if (rv) {
      s += '<button class="lfrvbtn" data-a="lfopen" data-v="lrival"><span class="eyebrow">' + tr("Tu rival") + "</span><span class=\"lfrvrow\">" + U.crest(rv.club) + "<b>" + h(rv.n) + "</b>" + U.flag(rv.ni) + '<span class="lfh2h num" title="' + h(tr("Duelos: ganados, empates, perdidos")) + '">' + rv.h2h.join("·") + "</span></span></button>";
    }
    return s + "</section>";
  });
  U.actions.lfopen = function (b, v) { U.open(v); };

  /* ---------- tras cada render: dorsal en la barra superior y en el cromo ---------- */
  U.add("after", function () {
    if (!on() || U.ui().view !== "game") return "";
    var L = S.p.life, h1 = document.querySelector("header.top .who h1");
    if (h1 && !h1.querySelector(".lftopnum")) h1.insertAdjacentHTML("afterbegin", '<span class="lftopnum num" aria-label="' + h(tr("Dorsal {n}", {n: L.num})) + '">' + L.num + "</span>");
    var cr = document.querySelector(".cromo .ctop");
    if (cr && !cr.querySelector(".lfcrnum")) cr.insertAdjacentHTML("beforeend", '<div class="lfcrnum num" aria-label="' + h(tr("Dorsal {n}", {n: L.num})) + '">' + L.num + "</div>");
    return "";
  });

  /* ---------- hoja: dorsal ---------- */
  U.sheets.lnum = function () {
    var L = lifeOf(), taken = lifeTaken(S.p.club);
    var s = "<h2>" + tr("Tu dorsal") + '</h2><div class="stack"><div class="lfnumhead"><div class="lfcnum">' + L.num + '</div><p class="muted" style="margin:0">' +
      (L.num === L.pref ? tr("Llevas tu número preferido en el {club}.", {club: h(clubName(S.p.club))}) : tr("Prefieres el {n}, pero en el {club} lo lleva {name}. Podrás pedirlo al empezar la temporada.", {n: L.pref, club: h(clubName(S.p.club)), name: h(taken[L.pref] || "—")})) + "</p></div>";
    s += '<div class="lfgrid" role="group" aria-label="' + h(tr("Elige dorsal")) + '">' + range(99).map(function (i) {
      var n = i + 1, t = taken[n], me = n === L.num;
      return '<button class="lfg' + (t ? " tk" : "") + (n === L.pref ? " pf" : "") + '" data-a="lfsetnum" data-v="' + n + '" aria-pressed="' + me + '"' + (t ? ' title="' + h(t) + '" aria-label="' + h(tr("{n}, lo lleva {name}", {n: n, name: t})) + '"' : "") + ">" + n + "</button>";
    }).join("") + "</div>";
    s += '<p class="muted lfhint">' + tr("Tachados: números ocupados en tu club. Si eliges uno ocupado, lo pedirás la próxima temporada.") + "</p>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfsetnum = function (b, v) {
    var r = lifeSetPref(+v);
    if (!r.ok) return;
    U.toast(r.now ? tr("Ahora llevas el {n}.", {n: +v}) : tr("El {n} lo lleva {name}: lo pedirás la próxima temporada.", {n: +v, name: r.by}));
    rer();
  };

  /* ---------- hoja: vida y dinero ---------- */
  function svcChips(d) {
    var m = isGK() ? d.gk : d.att, out = [];
    if (m) Object.keys(m).forEach(function (a) { out.push('<span class="chip up">+' + m[a] + " " + h(tr(ATT_NAMES[a])) + "</span>"); });
    if (d.k === "press") out.push('<span class="chip up">' + tr("+6 % seguidores por tramo") + "</span>");
    if (d.k === "physio") out.push('<span class="chip up">' + tr("Riesgo de lesión −30 %") + "</span>");
    if (d.k === "mental") out.push('<span class="chip up">' + tr("Forma más estable") + "</span>");
    if (d.k === "trainer") out.push('<span class="chip up">' + tr("Más progresión") + "</span>");
    return out.join("");
  }
  U.sheets.lvida = function () {
    var L = lifeOf(), p = S.p;
    var s = "<h2>" + tr("Vida y dinero") + '</h2><div class="stack"><div class="lfmoney"><span class="eyebrow">' + tr("Tu dinero") + '</span><b class="num">' + money(p.money) + "</b></div>";
    s += '<h3 class="lfsec">' + tr("Tu equipo personal") + '</h3><p class="muted lfhint">' + tr("Se paga cada tramo de temporada. Un contrato dura una temporada (5 tramos).") + "</p>";
    LIFE_SVC.forEach(function (d) {
      if (!lifeSvcOk(d)) return;
      var sv = L.svc[d.k], cost = lifeSvcCost(d), active = sv && sv.left > 0;
      s += '<div class="lfrow' + (active ? " on" : "") + '"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + '</small><div class="chips">' + svcChips(d) + "</div>";
      s += '<div class="lfrowf"><span class="muted">' + tr("{cost} por tramo", {cost: money(cost)}) + "</span>";
      if (active) s += '<span class="lfleft">' + trn(sv.left, "Queda {n} tramo", "Quedan {n} tramos") + '</span><button class="btn sm" data-a="lffire" data-v="' + d.k + '">' + tr("Cancelar") + "</button>";
      else s += '<button class="btn sm pri" data-a="lfhire" data-v="' + d.k + '"' + (p.money < cost ? " disabled" : "") + ">" + tr("Contratar") + "</button>";
      s += "</div></div></div>";
    });
    s += '<h3 class="lfsec">' + tr("Inversiones") + '</h3><p class="muted lfhint">' + tr("Se revalorizan (o no) al final de cada temporada. Puedes vender cuando quieras.") + "</p>";
    if (L.inv.length) s += L.inv.map(function (x, i) {
      var d = lifeInvDef(x.k), dif = x.v - x.p;
      return '<div class="lfrow on"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + tr("Compra: {p} ({year}) · Vale: {v}", {p: money(x.p), year: x.y, v: money(x.v)}) + "</small>" +
        '<div class="lfrowf"><span class="' + (dif >= 0 ? "pos" : "neg") + '">' + (dif >= 0 ? "+" : "−") + money(Math.abs(dif)) + '</span><button class="btn sm" data-a="lfsell" data-v="' + i + '">' + tr("Vender") + "</button></div></div></div>";
    }).join("");
    LIFE_INV.forEach(function (d) {
      var risk = d.risk >= 2 ? tr("Riesgo alto") : d.risk >= 1 ? tr("Riesgo medio") : d.risk > 0 ? tr("Riesgo medio-bajo") : tr("Riesgo bajo");
      s += '<div class="lfrow"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + "</small>" +
        '<div class="lfrowf"><span class="muted">' + money(d.price) + " · " + risk + '</span><button class="btn sm pri" data-a="lfinv" data-v="' + d.k + '"' + (p.money < d.price ? " disabled" : "") + ">" + tr("Invertir") + "</button></div></div></div>";
    });
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfhire = function (b, v) {
    var r = lifeHire(v), d = lifeSvcDef(v);
    if (r.ok) U.toast(tr("Contratado: {svc} ({cost}).", {svc: tr(d.n), cost: money(r.cost)}));
    else if (r.poor) U.toast(tr("No te llega el dinero."));
    rer();
  };
  U.actions.lffire = function (b, v) { lifeFire(v); U.toast(tr("Contrato cancelado.")); rer(); };
  U.actions.lfinv = function (b, v) {
    var r = lifeInvest(v);
    if (r.ok) U.toast(tr("Inversión hecha: {inv}.", {inv: tr(lifeInvDef(v).n)}));
    else if (r.full) U.toast(tr("Ya tienes demasiadas inversiones."));
    else if (r.poor) U.toast(tr("No te llega el dinero."));
    rer();
  };
  U.actions.lfsell = function (b, v) { var m = lifeSell(+v); U.toast(tr("Vendido por {v}.", {v: money(m)})); rer(); };

  /* ---------- hoja: look y celebración ---------- */
  function lockTxt(lk) {
    if (!lk) return "";
    if (lk.k === "fame") return "🔒 " + tr("Fama {n}", {n: lk.v});
    if (lk.k === "tro") return "🔒 " + trn(lk.v, "{n} título", "{n} títulos");
    if (lk.k === "cap") return "🔒 " + tr("Ser capitán");
    return money(lk.v);
  }
  function cosRow(cat, label, swatch) {
    var cur = lifeCos(cat);
    return '<div class="lfcos"><span class="lbl">' + h(label) + '</span><div class="lfopts' + (swatch ? " sw" : "") + '">' + LIFE_COS[cat].map(function (it) {
      var lk = lifeLocked(cat, it), sel = cur === it.id;
      var inner = swatch ? '<i style="background:' + it.c + '"></i>' : "<b>" + h(tr(it.n)) + "</b>" + (lk ? "<small>" + h(lockTxt(lk)) + "</small>" : "");
      if (swatch && it.n) inner += "<b>" + h(tr(it.n)) + "</b>" + (lk ? "<small>" + h(lockTxt(lk)) + "</small>" : "");
      return '<button class="lfo' + (lk ? " lk" : "") + '" data-a="lfcos" data-k="' + cat + '" data-v="' + it.id + '" aria-pressed="' + sel + '"' + (swatch && !it.n ? ' aria-label="' + h(tr("Tono {n}", {n: it.id.slice(1)})) + '"' : "") + ">" + inner + "</button>";
    }).join("") + "</div></div>";
  }
  U.sheets.llook = function () {
    var gk = isGK();
    /* al abrirse (sin repintar la pantalla de debajo) se coloca aquí el modelo 3D de «Yo» */
    setTimeout(function () { var hh = document.querySelector(".sheet:not(.out) .lfprev3d"); if (hh && U.yo3d) U.yo3d.mount(hh, "p"); }, 0);
    var s = "<h2>" + tr("Look y celebración") + '</h2><div class="stack"><div class="lflookprev"><div class="lfprev3d">' + myAvatar("lfsvg big rig") + '</div><div><span class="eyebrow">' + tr("Celebración") + "</span><b>" + h(tr(lifeCel().n)) + '</b><p class="muted lfhint">' + tr("Algunas piezas se desbloquean con fama, títulos o dinero.") + "</p></div></div>";
    s += cosRow("cel", tr("Celebración"));
    s += cosRow("skin", tr("Piel"), true);
    s += cosRow("hair", tr("Pelo"));
    s += cosRow("hcol", tr("Color de pelo"), true);
    /* 5.7: botas, mangas, cinta y guantes se llevan desde el equipamiento (una sola fuente) */
    s += '<button class="btn wide" data-a="gearopen" data-v="p">' + h(tr("Equipamiento")) + "</button>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfcos = function (b, v) {
    var cat = b.getAttribute("data-k"), prev = (lifeOf().cos || {})[cat] || LIFE_COS_DEF[cat], r = lifeSetCos(cat, v);
    if (!r.ok && r.lock) U.toast(r.poor ? tr("No te llega el dinero ({v}).", {v: money(r.lock.v)}) : tr("Bloqueado: {req}.", {req: lockTxt(r.lock).replace("🔒 ", "")}));
    else if (r.paid) U.toast(tr("Comprado por {v}.", {v: money(r.paid)}));
    rer();
    /* 5.7: la vista previa es el mismo modelo 3D de «Yo»: con una celebración nueva, la hace */
    if (r.ok && prev !== v && cat === "cel" && U.yo3d) setTimeout(function () { U.yo3d.celebrate(); }, 60);
  };

  /* ---------- hoja: rivalidad ---------- */
  function avg(o) { return o.rn ? o.rs / o.rn : 0; }
  function statRow(lab, a, b, opt) {
    opt = opt || {};
    var fa = opt.fmt ? opt.fmt(a) : a, fb = opt.fmt ? opt.fmt(b) : b, win = a === b || a == null || b == null ? 0 : (opt.low ? a < b : a > b) ? 1 : -1;
    var tot = Math.max(1e-9, (+a || 0) + (+b || 0)), pa = opt.low ? (+b || 0) / tot : (+a || 0) / tot;
    if (!(a || b)) pa = 0.5;
    return '<div class="lfst"><span class="a' + (win > 0 ? " w" : "") + '">' + (a == null ? "—" : fa) + '</span><span class="l">' + h(lab) + '<i class="bar"><i style="width:' + Math.round(pa * 100) + '%"></i></i></span><span class="b' + (win < 0 ? " w" : "") + '">' + (b == null ? "—" : fb) + "</span></div>";
  }
  U.sheets.lrival = function () {
    var L = lifeOf(), rv = L.rv, p = S.p, ui = U.ui();
    if (!rv) return "<h2>" + tr("Rivalidad") + '</h2><p class="muted">' + tr("Aún no tienes rival.") + '</p><button class="btn wide" data-a="close">' + tr("Cerrar") + "</button>";
    var mode = ui.lfrv === "c" ? "c" : "s", pair = mode === "c" ? lifeCareerPair() : {me: lifeMySeason(), him: rv.ss}, me = pair.me, him = pair.him, gk = rv.g === "POR";
    var s = "<h2>" + tr("Rivalidad") + '</h2><div class="stack"><div class="lfvs">';
    s += '<div class="lfside">' + myAvatar("lfsvg") + "<b>" + h(lifeMeName()) + '</b><small>' + U.crest(p.club) + " " + h(clubName(p.club)) + '</small><span class="lfovr num">' + ovrInt() + "</span></div>";
    s += '<div class="lfmid"><span class="eyebrow">' + tr("Duelos") + '</span><div class="lfscore num"><b>' + rv.h2h[0] + "</b><i>" + rv.h2h[1] + "</i><b>" + rv.h2h[2] + '</b></div><small class="muted">' + tr("G · E · P") + "</small></div>";
    s += '<div class="lfside">' + avatar(lifeRvLook(rv), rv.club, ((hashStr(rv.n) % 23) + 2), gk, "lfsvg") + "<b>" + h(rv.n) + " " + U.flag(rv.ni) + '</b><small>' + U.crest(rv.club) + " " + h(clubName(rv.club)) + '</small><span class="lfovr num">' + Math.round(rv.ovr) + "</span></div></div>";
    s += '<div class="seg"><button data-a="lfrvm" data-v="s" aria-pressed="' + (mode === "s") + '">' + tr("Temporada {season}", {season: seasonLabel(S.yr)}) + '</button><button data-a="lfrvm" data-v="c" aria-pressed="' + (mode === "c") + '">' + tr("Desde {year}", {year: rv.since}) + "</button></div>";
    s += '<div class="lfstats">';
    s += statRow(tr("Partidos"), me.apps, him.apps);
    if (gk) {
      s += statRow(tr("Porterías a cero"), me.cs, him.cs);
      s += statRow(tr("Goles encajados"), me.gc, him.gc, {low: true});
      s += statRow(tr("Paradas"), me.sv, him.sv);
      var sp = function (o) { return o.sv + o.gc ? o.sv / (o.sv + o.gc) * 100 : null; };
      s += statRow(tr("% de paradas"), sp(me), sp(him), {fmt: function (x) { return fmtDec(x, 1) + " %"; }});
    } else {
      s += statRow(tr("Goles"), me.g, him.g);
      s += statRow(tr("Asistencias"), me.a, him.a);
      if (rv.g === "DEF") s += statRow(tr("Porterías a cero"), me.cs, him.cs);
    }
    s += statRow(tr("Títulos"), me.tro, him.tro);
    s += statRow(tr("Nota media"), me.rn ? avg(me) : null, him.rn ? avg(him) : null, {fmt: function (x) { return fmtDec(x, 2); }});
    s += "</div>";
    var races = lifeRaces();
    if (races.length) {
      s += '<h3 class="lfsec">' + tr("Carreras") + '</h3><div class="kvlist">' + races.map(function (r) {
        var lab = tr(r.n, {year: r.y, nat: r.nat != null ? natName(r.nat) : ""});
        var f = function (x) { return x == null ? "—" : r.rank ? (x ? tr("{n}º", {n: x}) : "—") : r.dec ? fmtDec(x, r.dec) : x; };
        var lead = r.me == null && r.him == null ? "" : r.me == null || (r.me === 0 && r.rank) ? "b" : r.him == null || (r.him === 0 && r.rank) ? "a" : r.me === r.him ? "" : (r.low ? r.me < r.him : r.me > r.him) ? "a" : "b";
        return "<div><span>" + h(lab) + '</span><span class="lfrace"><b class="' + (lead === "a" ? "pos" : "") + '">' + f(r.me) + "</b> – <b class=\"" + (lead === "b" ? "neg" : "") + '">' + f(r.him) + "</b></span></div>";
      }).join("") + "</div>";
    }
    if (rv.hl.length) s += '<h3 class="lfsec">' + tr("Titulares") + '</h3><ul class="news lfnews">' + rv.hl.map(function (x) { return '<li class="' + h(x.t || "ok") + '"><small>' + seasonLabel(x.y) + "</small> " + h(tr(x.tk, x.tp)) + "</li>"; }).join("") + "</ul>";
    if (rv.duels.length) s += '<h3 class="lfsec">' + tr("Últimos duelos") + '</h3><div class="kvlist">' + rv.duels.map(function (d) {
      return "<div><span>" + seasonLabel(d.y) + " · " + (d.nat ? U.flag(d.o) + " " + h(natName(d.o)) : h(clubName(d.o))) + " " + d.gu + "-" + d.gt + '</span><span class="' + (d.r > 0 ? "pos" : d.r < 0 ? "neg" : "") + '">' + fmtDec(d.mr, 1) + " / " + fmtDec(d.hr, 1) + "</span></div>";
    }).join("") + "</div>";
    if (L.rvh.length) s += '<h3 class="lfsec">' + tr("Rivales anteriores") + '</h3><div class="kvlist">' + L.rvh.map(function (x) { return "<div><span>" + U.flag(x.ni) + " " + h(x.n) + " · " + x.a + "–" + x.b + '</span><span class="num">' + x.h.join("·") + "</span></div>"; }).join("") + "</div>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfrvm = function (b, v) { U.ui().lfrv = v; rer(); };

  /* ---------- historial: dorsales ---------- */
  U.add("hist", function () {
    if (!on()) return "";
    var L = S.p.life, rows = [];
    S.p.seasons.forEach(function (r) { if (r.num) rows.push([r.y, r.club, r.num]); });
    if (!rows.length) rows = L.nh.slice();
    if (!rows.length) return "";
    return '<section class="card"><h3>' + tr("Dorsales") + '</h3><div class="lfnumhist">' + rows.slice().reverse().map(function (r) {
      return '<div><span class="lfhn num">' + r[2] + "</span><span>" + U.crest(r[1]) + " " + h(clubName(r[1])) + '</span><small class="muted">' + seasonLabel(r[0]) + "</small></div>";
    }).join("") + "</div></section>";
  });
})();
