/* ui-46.js — «Dinastías» (versión 4.6), interfaz: relevo familiar al retirarte, árbol de la dinastía y récords. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;

  /* ---------- en la tarjeta de retirada ---------- */
  U.hk.retDyn = function () {
    if (!dynCanHeir()) return "";
    var d = dynOf(), n = d.mem.length, kids = typeof famHeirKids === "function" ? famHeirKids() : [];
    var kb = kids.map(function (k) { var I = famKidInfo(k);
      return '<button class="btn pri wide" data-a="heirkid" data-v="' + k.id + '">' + h(k.g === "f" ? tr("Seguir con tu hija {name}", {name: k.fn}) : tr("Seguir con tu hijo {name}", {name: k.fn})) + '<small style="display:block;font-weight:500;opacity:.8">' + h(tr("{age} años · {pos} · {ovr} de media · {club}", {age: I.age, pos: posName(k.fb.pos), ovr: I.ovr, club: I.club})) + "</small></button>"; }).join("");
    return '<div class="dynret"><div class="dynreth"><span class="dynbadge">G' + (d.g + 1) + "</span><div><b>" + tr("Tu hijo o tu hija puede seguir tus pasos") + "</b><small>" +
      (kids.length ? tr("Puedes seguir con quien ya juega al fútbol o empezar con otro hijo o hija desde la cantera.") : tr("Empezaría con 17 años en tu club de siempre y heredaría parte de tu fama.")) + "</small></div></div>" +
      (kb ? '<div class="stack" style="gap:8px;margin-bottom:8px">' + kb + "</div>" : "") +
      '<div class="row2"><button class="btn' + (kb ? "" : " pri") + '" data-a="heir">' + (kb ? tr("Otro hijo o hija") : tr("Elegir hijo o hija")) + '</button><button class="btn" data-a="dyn">' + (n > 1 ? tr("Ver tu dinastía") : tr("Ver el árbol familiar")) + "</button></div></div>";
  };
  U.actions.heirkid = function (b, v) {
    if (!dynHeirStart({kid: +v})) { U.toast(tr("No se pudo empezar la nueva generación.")); return; }
    var ui = U.ui(); ui.tab = "carrera"; ui.exp = {}; ui.wl = null;
    U.closeSheet(); U.persist(); U.render(true);
  };

  /* ---------- formulario del relevo ---------- */
  var heir = {pos: null, foot: "Diestro", g: "m"};
  /* si ya tienes un hijo o una hija de esa edad (modo entrenador), el nombre sale de la familia */
  function famDefault(g) {
    var f = S.m && S.m.fam; if (!f) return null;
    var k = f.kids.filter(function (k) { return k.g === g && !k.fb && famAge(k) >= 12 && famAge(k) <= 24; })[0];
    return k ? k.fn : null;
  }
  function heirNat() { var par = S.mode === "mgr" ? S.m : S.p; return par.inat >= 0 ? par.inat : par.nat; }
  U.actions.heir = function () {
    heir.pos = heir.pos || (S.p ? S.p.pos : "MC"); heir.foot = (S.p && S.p.foot) || "Diestro";
    heir.g = S.g === "f" ? "f" : "m";
    heir.fn = famDefault(heir.g) || (typeof famFirst === "function" ? famFirst(heirNat(), heir.g) : genName(heirNat()).fn); heir.auto = heir.fn;
    U.open("heir");
  };
  U.actions.heirg = function (b, v) {
    var i = document.getElementById("heirfn"); if (i) heir.fn = i.value;
    if (heir.g === v) return;
    heir.g = v === "f" ? "f" : "m";
    if (!heir.fn || heir.fn === heir.auto) { heir.fn = famDefault(heir.g) || (typeof famFirst === "function" ? famFirst(heirNat(), heir.g) : heir.fn); heir.auto = heir.fn; }
    U.renderSheet();
  };
  U.actions.heirpos = function (b, v) { heir.pos = v; var i = document.getElementById("heirfn"); if (i) heir.fn = i.value; U.renderSheet(); };
  U.actions.heirfoot = function (b, v) { heir.foot = v; var i = document.getElementById("heirfn"); if (i) heir.fn = i.value; U.renderSheet(); };
  U.actions.heirgo = function () {
    var i = document.getElementById("heirfn"), fn = (i ? i.value : heir.fn || "").trim().replace(/\s+/g, " ").slice(0, 20);
    if (!fn) { U.toast(tr("Escribe su nombre")); if (i) i.focus(); return; }
    if (!dynHeirStart({fn: fn, pos: heir.pos || "MC", foot: heir.foot || "Diestro", g: heir.g})) { U.toast(tr("No se pudo empezar la nueva generación.")); return; }
    var ui = U.ui(); ui.tab = "carrera"; ui.exp = {}; ui.wl = null;
    U.closeSheet(); U.persist(); U.render(true);
  };
  U.sheets.heir = function () {
    var d = dynOf(), par = S.mode === "mgr" ? S.m : S.p, home = S.mode === "mgr" ? (S.mretired ? S.mretired.main : S.m.club) : (S.retired ? S.retired.main : S.p.club);
    var groups = [["POR", ["POR"]], ["DEF", ["DFC", "LD", "LI"]], ["MED", ["MCD", "MC", "MCO", "MD", "MI"]], ["DEL", ["ED", "EI", "DC"]]];
    var other = heir.g !== (S.g === "f" ? "f" : "m");
    var o = "<h2>" + (heir.g === "f" ? tr("Tu hija toma el relevo") : tr("Tu hijo toma el relevo")) + '</h2><p class="lead">' + (other ? (heir.g === "f" ? tr("Generación {n} de la familia {ln}. Empieza con 17 años en el fútbol femenino; la dinastía y sus récords vienen con ella.", {n: d.g + 1, ln: h(par.ln)}) : tr("Generación {n} de la familia {ln}. Empieza con 17 años en el fútbol masculino; la dinastía y sus récords vienen con él.", {n: d.g + 1, ln: h(par.ln)})) : tr("Generación {n} de la familia {ln}. Empieza con 17 años en la cantera del {club}.", {n: d.g + 1, ln: h(par.ln), club: h(clubName(home))})) + "</p>";
    o += '<div class="stack"><div><label class="lbl">' + tr("Hijo o hija") + '</label><div class="seg">' + [["m", tr("Hijo")], ["f", tr("Hija")]].map(function (x) { return '<button data-a="heirg" data-v="' + x[0] + '" aria-pressed="' + (heir.g === x[0]) + '">' + h(x[1]) + "</button>"; }).join("") + "</div></div>";
    o += '<div><label class="lbl" for="heirfn">' + tr("Nombre") + '</label><input type="text" id="heirfn" maxlength="20" autocomplete="off" value="' + h(heir.fn || "") + '"><p class="muted" style="font-size:13px;margin:4px 0 0">' + tr("Apellido: {ln}", {ln: h(par.ln)}) + "</p></div>";
    o += '<div><label class="lbl">' + tr("Posición") + '</label><div class="heirpos">' + groups.map(function (g) {
      return '<div class="heirg">' + g[1].map(function (c) { return '<button type="button" class="chipbtn" data-a="heirpos" data-v="' + c + '" aria-pressed="' + (heir.pos === c) + '" title="' + h(posName(c)) + '">' + h(posAb(c)) + "</button>"; }).join("") + "</div>";
    }).join("") + '</div><p class="muted" style="font-size:13px;margin:4px 0 0">' + h(posName(heir.pos || "MC")) + "</p></div>";
    o += '<div><label class="lbl">' + tr("Pierna buena") + '</label><div class="seg">' + ["Diestro", "Zurdo"].map(function (f) { return '<button data-a="heirfoot" data-v="' + f + '" aria-pressed="' + (heir.foot === f) + '">' + h(tr(f)) + "</button>"; }).join("") + "</div></div>";
    o += '<div class="ref"><b>' + tr("Lo que hereda") + "</b>" + tr("Parte de tu fama y de tus seguidores, un pequeño colchón económico y algo más de potencial. Y la presión de un apellido conocido.") + "</div>";
    o += '<button class="btn pri wide" data-a="heirgo">' + tr("Empezar su carrera") + '</button><button class="btn wide" data-a="close">' + tr("Cancelar") + "</button></div>";
    return o;
  };

  /* ---------- árbol de la dinastía ---------- */
  U.actions.dyn = function () { U.open("dyn"); };
  function yrs(a, b) { return a ? (b ? a + "–" + b : a + "–") : ""; }
  function memCard(x) {
    var roles = [];
    if (x.pk) roles.push('<span class="chip">' + tr("Futbolista") + "</span>");
    if (x.mk || (x.live && S.mode === "mgr")) roles.push('<span class="chip">' + tr("Entrenador") + "</span>");
    if (x.live) roles.push('<span class="chip up">' + tr("En activo") + "</span>");
    var stats = [];
    if (x.pk) stats.push(trn(x.apps || 0, "{n} partido", "{n} partidos") + " · " + trn(x.g || 0, "{n} gol", "{n} goles") + (x.tro ? " · " + trn(x.tro, "{n} título", "{n} títulos") : "") + (x.caps ? " · " + trn(x.caps, "{n} internacionalidad", "{n} internacionalidades") : ""));
    if (x.mk || (x.live && S.mode === "mgr")) stats.push(tr("En el banquillo: {s} temporadas, {w} victorias, {t} títulos", {s: x.seasons || 0, w: x.mw || 0, t: x.mtro || 0}));
    var club = x.club != null && x.club >= 0 ? x.club : x.mclub;
    var legacy = x.title || x.mtitle;
    return '<li class="dyngen' + (x.live ? " live" : "") + '"><span class="dynbadge">G' + x.gen + '</span><div class="dyncard"><div class="dynname"><b>' + h((x.fn ? x.fn + " " : "") + x.ln) + "</b><span>" + yrs(x.y0, x.live ? null : x.y1 || x.my1) + "</span></div>" +
      '<div class="chips">' + roles.join("") + "</div>" +
      (club != null && club >= 0 ? '<div class="dynclub">' + U.crest(club) + "<span>" + h(clubName(club)) + "</span></div>" : (x.clubN || x.mclubN ? '<div class="dynclub"><span>' + h(x.clubN || x.mclubN) + "</span></div>" : "")) +
      stats.map(function (s) { return '<p class="dynstat">' + h(s) + "</p>"; }).join("") +
      (x.pt ? '<p class="dynstat">💞 ' + h(tr("Con {name}", {name: x.pt})) + "</p>" : "") +
      (legacy ? '<p class="dynleg">' + h(tr(legacy)) + (x.sc || x.msc ? " · " + Math.max(x.sc || 0, x.msc || 0) : "") + "</p>" : "") + "</div></li>";
  }
  U.sheets.dyn = function () {
    var d = dynOf(), R = dynRecords(), t = R.t, b = R.best, ln = (R.all[0] && R.all[0].ln) || (S.p ? S.p.ln : S.m ? S.m.ln : "");
    var o = "<h2>" + tr("Dinastía {ln}", {ln: h(ln)}) + '</h2><p class="muted" style="margin:-6px 0 12px">' + trn(R.all.length, "{n} generación", "{n} generaciones") + "</p>";
    o += '<div class="dynrec">' + [[t.apps, tr("Partidos")], [t.g, tr("Goles")], [t.tro + t.mtro, tr("Títulos")], [t.caps, tr("Internac.")], [t.bdo, tr("B. de Oro")], [t.seasons, tr("Temp. de míster")]].map(function (x) {
      return '<div class="stat"><b class="num">' + x[0] + "</b><span>" + h(x[1]) + "</span></div>"; }).join("") + "</div>";
    var rec = [];
    var nm = function (x) { return h((x.fn ? x.fn + " " : "") + x.ln) + " (G" + x.gen + ")"; };
    if (b.g) rec.push([tr("Máximo goleador"), nm(b.g) + " · " + trn(b.g.g, "{n} gol", "{n} goles")]);
    if (b.season) rec.push([tr("Mejor temporada"), nm(b.season) + " · " + trn(b.season.best.g, "{n} gol", "{n} goles") + " (" + seasonLabel(b.season.best.y) + ")"]);
    if (b.tro) rec.push([tr("Más títulos"), nm(b.tro) + " · " + ((b.tro.tro || 0) + (b.tro.mtro || 0))]);
    if (b.sc) rec.push([tr("Mayor leyenda"), nm(b.sc) + " · " + h(tr(b.sc.title || b.sc.mtitle || ""))]);
    if (rec.length) o += '<h3 class="dynh3">' + tr("Récords de la familia") + '</h3><div class="kvlist">' + rec.map(function (r) { return "<div><span>" + h(r[0]) + "</span><span>" + r[1] + "</span></div>"; }).join("") + "</div>";
    o += '<h3 class="dynh3">' + tr("Árbol de leyendas") + '</h3><ol class="dyntree">' + R.all.map(memCard).join("") + "</ol>";
    var clubs = Object.keys(d.clubs).map(Number).filter(function (c) { var x = d.clubs[c]; return x.p || x.m || x.tro; })
      .sort(function (a, b2) { var A = d.clubs[a], B = d.clubs[b2]; return (B.gens.length - A.gens.length) || (B.p + B.m * 30 - A.p - A.m * 30); }).slice(0, 12);
    if (clubs.length) {
      o += '<h3 class="dynh3">' + tr("Clubes de la familia") + '</h3><div class="dynclubs">' + clubs.map(function (c) {
        var x = d.clubs[c], bits = [];
        if (x.p) bits.push(trn(x.p, "{n} partido", "{n} partidos") + (x.g ? " · " + trn(x.g, "{n} gol", "{n} goles") : ""));
        if (x.m) bits.push(trn(x.m, "{n} temporada de míster", "{n} temporadas de míster"));
        if (x.tro) bits.push(trn(x.tro, "{n} título", "{n} títulos"));
        return '<div class="dynclubrow">' + U.crest(c, true) + '<div class="grow"><b>' + h(clubName(c)) + "</b><small>" + h(bits.join(" · ")) + '</small></div><span class="dyngens">' + x.gens.slice().sort().map(function (g) { return "G" + g; }).join(" ") + "</span></div>";
      }).join("") + "</div>";
    }
    return o + '<button class="btn wide" data-a="close" style="margin-top:14px">' + tr("Cerrar") + "</button>";
  };

  /* ---------- historial: acceso a la dinastía ---------- */
  U.add("hist", function () {
    if (!S || !S.dyn || (!S.dyn.mem.length && S.dyn.g < 2)) return "";
    var R = dynRecords();
    return '<section class="card dynhist"><div class="head"><h3>' + tr("Tu dinastía") + '</h3><span class="eyebrow">' + trn(R.all.length, "{n} generación", "{n} generaciones") + "</span></div>" +
      '<p class="muted" style="margin:4px 0 10px">' + tr("{g} goles y {t} títulos entre toda la familia.", {g: R.t.g, t: R.t.tro + R.t.mtro}) + '</p><button class="btn wide" data-a="dyn">' + tr("Ver el árbol de leyendas") + "</button></section>";
  });
})();
