/* ui-week.js — versión 2.9: tarjeta «La semana de trabajo» en el inicio del míster
   (próximo rival e informe, carga de entrenamiento, preparación, estilo y cuerpo técnico). */
(function () {
  if (typeof UIX === "undefined" || typeof wkOf !== "function") return;
  var U = UIX, h = U.h;
  function foldOpen(k, def) { var f = U.ui().fold || {}; return f[k] == null ? def : f[k]; }
  function stars(n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆"; return '<span class="wkst" aria-label="' + h(tr("{n} de 5", {n: n})) + '">' + s + "</span>"; }
  function seg(act, cur, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-a="' + act + '" data-v="' + o[0] + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + h(o[1]) + "</button>"; }).join("") + "</div>"; }
  function oppBlock(w) {
    var opp = typeof nextLgOpp === "function" ? nextLgOpp(S.m.club) : -1;
    if (opp < 0) return "";
    var rp = wkReport(opp), st = WK_STYLE[rp.style];
    return '<div class="wkopp">' + U.crest(opp) + '<div class="grow"><div class="eyebrow">' + tr("Próximo rival de liga") + "</div><b>" + h(clubName(opp)) + "</b><small>" +
      tr("Equipo {st}.", {st: h(tr(st.n))}) + (rp.weak ? " " + tr("Punto débil: {w}.", {w: h(tr(rp.weak))}) : " " + tr("Con un segundo de 3 estrellas sabrás su punto débil.")) + "</small>" +
      (rp.rec ? '<small class="wkrec">' + tr("Tu segundo recomienda: {p}.", {p: "<b>" + h(tr(WK_PREP[rp.rec].n)) + "</b>"}) + (w.prep === rp.rec ? " ✓" : "") + "</small>" : "") + "</div></div>";
  }
  U.weekCard = (function () { return function () {
    if (!wkOn() || S.ph === "ret" || (typeof presOn === "function" && presOn())) return "";
    var w = wkOf(), P = WK_PREP[w.prep] || WK_PREP.gen;
    var sum = tr("Carga {l} · {p}", {l: tr(WK_LOAD[w.load].n).toLowerCase(), p: tr(P.n)});
    var o = '<details class="card mpcard fold wkcard" data-fold="week"' + (foldOpen("week", false) ? " open" : "") + '><summary class="head"><span class="tag real"><span class="dot"></span>' + tr("La semana de trabajo") + '</span><span class="eyebrow">' + h(sum) + "</span></summary>" + '<div class="stack wkbody">';
    o += oppBlock(w);
    o += '<div><label class="lbl">' + tr("Carga de entrenamiento") + "</label>" + seg("wkload", w.load, WK_LOAD.map(function (x, i) { return [i, tr(x.n)]; })) + '<p class="muted wkd">' + h(tr(WK_LOAD[w.load].d)) + "</p></div>";
    o += '<div><label class="lbl">' + tr("Preparación del partido") + '</label><div class="wkchips">' + Object.keys(WK_PREP).map(function (k) { return '<button class="chipb" data-a="wkprep" data-v="' + k + '" aria-pressed="' + (w.prep === k) + '">' + h(tr(WK_PREP[k].n)) + "</button>"; }).join("") + '</div><p class="muted wkd">' + h(tr(P.d)) + "</p></div>";
    o += '<div><label class="lbl">' + tr("Estilo y roles") + "</label>" +
      '<label class="wktg"><input type="checkbox" data-wk="low"' + (w.low ? " checked" : "") + "><span><b>" + tr("Bloque bajo") + "</b><small>" + tr("Todos atrás y a la contra. Encajas mucho menos, sobre todo ante rivales mejores, pero creas poco.") + "</small></span></label>" +
      '<label class="wktg"><input type="checkbox" data-wk="inv"' + (w.inv ? " checked" : "") + "><span><b>" + tr("Laterales invertidos") + "</b><small>" + tr("Tus laterales se meten por dentro: más control y ocasiones, pero sufres ante equipos de contraataque.") + "</small></span></label></div>";
    o += '<div><label class="lbl">' + tr("Cuerpo técnico") + '</label><ul class="wkstaff">' + Object.keys(WK_STAFF).map(function (k) {
      var lv = w.staff[k], max = lv >= 5;
      return "<li><span class=\"grow\"><b>" + h(tr(WK_STAFF[k].n)) + "</b> " + stars(lv) + "<small>" + h(tr(WK_STAFF[k].d)) + "</small></span>" +
        (max ? '<span class="muted wkmax">' + tr("Al máximo") + "</span>" : '<button class="btn sm" data-a="wkhire" data-v="' + k + '">' + tr("Mejorar · {c}", {c: fmtMoney(wkStaffCost(k))}) + "</button>") + "</li>";
    }).join("") + '</ul><p class="muted wkd">' + tr("Se paga del presupuesto de fichajes ({b} disponibles). Tu cuerpo técnico te sigue si cambias de club.", {b: fmtMoney(S.m.bud)}) + "</p></div>";
    return o + "</div></details>";
  }; })();
  function save() { U.persist(); U.render(false); }
  U.actions.wkload = function (b, v) { wkOf().load = +v; save(); };
  U.actions.wkprep = function (b, v) { if (WK_PREP[v]) { wkOf().prep = v; save(); } };
  U.actions.wkhire = function (b, v) {
    var r = wkHire(v);
    if (r.poor) U.toast(tr("No te llega el presupuesto: cuesta {c}.", {c: fmtMoney(r.cost)}));
    else if (r.ok) { U.toast(tr("{n}: ahora {s} estrellas.", {n: tr(WK_STAFF[v].n), s: r.lv})); U.edgeFlash(true); save(); }
  };
  document.addEventListener("change", function (e) {
    var t = e.target, k = t && t.getAttribute && t.getAttribute("data-wk");
    if (!k || !wkOn()) return;
    wkOf()[k] = t.checked ? 1 : 0; save();
  });
})();
