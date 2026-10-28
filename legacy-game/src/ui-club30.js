/* ui-club30.js — versión 3.0: tarjeta «El club por dentro» (finanzas, estadio, instalaciones)
   y, en el modo presidente, la tarjeta y la hoja para elegir entrenador. */
(function () {
  if (typeof UIX === "undefined" || typeof finOn !== "function") return;
  var U = UIX, h = U.h;
  function foldOpen(k, def) { var f = U.ui().fold || {}; return f[k] == null ? def : f[k]; }
  function stars(n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆"; return '<span class="wkst" aria-label="' + h(tr("{n} de 5", {n: n})) + '">' + s + "</span>"; }
  function row(l, v, cls) { return "<div><span>" + h(l) + '</span><span class="' + (cls || "") + '">' + v + "</span></div>"; }
  function money(v, sign) { var t = fmtMoney(Math.abs(Math.round(v / 1e4) * 1e4)); return sign ? (v < 0 ? "−" : "+") + t : t; }
  function ffp() {
    var m = S.m, F = finOf(), net = finIn(F) - finOut(F), R0 = finR0(), wageOver = mWageBill() > m.wcap * 1.1;
    if (net < -R0 * 0.15 || wageOver) return ['<b class="neg">' + tr("En riesgo de multa") + "</b>", wageOver ? tr("La masa salarial pasa del tope en más de un 10 %.") : tr("Las pérdidas superan el 15 % de los ingresos previstos.")];
    if (net < -R0 * 0.08) return ['<b class="led">' + tr("Vigilado") + "</b>", tr("Si las pérdidas siguen creciendo, llegará una multa al final de la temporada.")];
    return ['<b class="pos">' + tr("En regla") + "</b>", tr("Cumples el juego limpio financiero.")];
  }
  U.finCard = (function () { return function () {
    if (!finOn() || S.ph === "ret") return "";
    var m = S.m, F = finOf(), fac = facOf(), net = finIn(F) - finOut(F), st = ffp(), own = !!m.owner;
    var o = '<details class="card mpcard fold fincard" data-fold="fin"' + (foldOpen("fin", false) ? " open" : "") + '><summary class="head"><span class="tag real"><span class="dot"></span>' + tr("El club por dentro") + '</span><span class="eyebrow">' + tr("Balance {v}", {v: money(net, true)}) + "</span></summary>" + '<div class="stack wkbody">';
    o += '<div><label class="lbl">' + tr("Cuentas de la temporada") + '</label><div class="kvlist">' +
      row(tr("Taquilla"), money(F.gate)) + row(tr("Televisión"), money(F.tv)) + row(tr("Patrocinio"), money(F.spo)) + (F.prize ? row(tr("Premios"), money(F.prize)) : "") + (F.sell ? row(tr("Ventas de jugadores"), money(F.sell)) : "") +
      row(tr("Sueldos"), "−" + money(F.wage), "neg") + (F.staff ? row(tr("Cuerpo técnico e indemnizaciones"), "−" + money(F.staff), "neg") : "") + row(tr("Mantenimiento"), "−" + money(F.fac), "neg") + (F.buy ? row(tr("Fichajes y obras"), "−" + money(F.buy), "neg") : "") + (F.fine ? row(tr("Multas"), "−" + money(F.fine), "neg") : "") +
      row(tr("Balance"), "<b>" + money(net, true) + "</b>", net >= 0 ? "pos" : "neg") + "</div>" +
      '<p class="muted wkd">' + tr("Al acabar la temporada, un tercio del resultado de explotación (sin contar fichajes ni ventas) se suma o se resta al presupuesto de fichajes.") + "</p></div>";
    o += '<div class="finffp"><span>' + tr("Juego limpio financiero") + "</span>" + st[0] + '<small class="muted">' + h(st[1]) + "</small></div>";
    o += '<div><label class="lbl">' + tr("Estadio") + '</label><div class="kvlist">' + row(tr("Aforo"), fmtInt(fac.cap)) + (F.home ? row(tr("Media de asistencia"), fmtInt(F.att / F.home) + " · " + Math.round(F.att / F.home / fac.cap * 100) + " %") : "") + row(tr("Entrada media"), fmtMoney(finTicket())) + "</div>";
    if (own) o += '<label class="lbl" style="margin-top:10px">' + tr("Precio de las entradas") + '</label><div class="seg">' + FIN_PRICE.map(function (x, i) { return '<button data-a="finprice" data-v="' + i + '" aria-pressed="' + (fac.price === i) + '">' + h(tr(x.n)) + "</button>"; }).join("") + '</div><p class="muted wkd">' + tr("Más baratas llenan el estadio y contentan a la afición; más caras dan más dinero por entrada, pero vacían la grada.") + "</p>";
    o += fac.work ? '<p class="muted wkd">' + tr("Obras en marcha: +{n} asientos para la próxima temporada.", {n: fmtInt(fac.work)}) + "</p>" : '<button class="btn wide" data-a="facbuild" data-v="cap">' + tr("Ampliar el estadio: +{n} asientos · {c}", {n: fmtInt(facSeats()), c: fmtMoney(facCost("cap"))}) + "</button>";
    o += "</div>";
    o += '<div><label class="lbl">' + tr("Instalaciones") + '</label><ul class="wkstaff">' + [["train", tr("Ciudad deportiva"), tr("Tus jugadores progresan más rápido.")], ["youth", tr("Cantera"), tr("Los juveniles que suben tienen más potencial.")]].map(function (x) {
      var lv = fac[x[0]];
      return '<li><span class="grow"><b>' + h(x[1]) + "</b> " + stars(lv) + "<small>" + h(x[2]) + "</small></span>" + (lv >= 5 ? '<span class="muted wkmax">' + tr("Al máximo") + "</span>" : '<button class="btn sm" data-a="facbuild" data-v="' + x[0] + '">' + tr("Mejorar · {c}", {c: fmtMoney(facCost(x[0]))}) + "</button>") + "</li>";
    }).join("") + '</ul><p class="muted wkd">' + tr("Las obras y mejoras se pagan del presupuesto de fichajes ({b} disponibles).", {b: fmtMoney(m.bud)}) + "</p></div>";
    if (m.finH && m.finH.length) o += '<div><label class="lbl">' + tr("Temporadas anteriores") + '</label><div class="kvlist">' + m.finH.slice(-4).reverse().map(function (r) { return row(seasonLabel(r.y) + " · " + clubName(r.club), money(r.net, true), r.net >= 0 ? "pos" : "neg"); }).join("") + "</div></div>";
    return o + "</div></details>";
  }; })();
  function save() { U.persist(); U.render(false); }
  U.actions.finprice = function (b, v) { facOf().price = +v; save(); };
  U.actions.facbuild = function (b, v) {
    var r = facBuild(v);
    if (r.poor) U.toast(tr("No te llega el presupuesto: cuesta {c}.", {c: fmtMoney(r.cost)}));
    else if (r.busy) U.toast(tr("Ya hay obras en marcha."));
    else if (r.ok) { U.toast(v === "cap" ? tr("Empiezan las obras: estarán listas la próxima temporada.") : tr("Instalaciones mejoradas.")); U.edgeFlash(true); save(); }
  };

  /* ---------- modo presidente ---------- */
  U.add("clubTop", function () {
    if (!presOn() || S.ph === "ret") return "";
    var c = S.m.pres.coach;
    if (!c) return '<section class="card prescard need"><div class="head"><span class="tag hot"><span class="dot"></span>' + tr("Banquillo vacío") + '</span></div><p style="margin:6px 0 10px">' + tr("Eres el presidente: necesitas un entrenador que dirija los partidos. Sin él, el equipo rinde bastante peor.") + '</p><button class="go" data-a="presopen">' + tr("Elegir entrenador") + "</button></section>";
    return '<section class="card prescard"><div class="presrow"><span class="presic" aria-hidden="true">📋</span><div class="grow"><div class="eyebrow">' + tr("Tu entrenador") + "</div><b>" + h(c.fn + " " + c.ln) + "</b> " + stars(c.q) + "<small>" + tr("{s} · {v}/año", {s: h(tr(COACH_STY[c.sty].n)), v: fmtMoney(c.sal)}) + '</small></div><button class="btn sm" data-a="presopen">' + tr("Cambiar") + "</button></div>" +
      '<div class="presfans"><span>' + tr("Afición") + '</span><div class="bar"><i class="' + (S.m.fans < 35 ? "lo" : S.m.fans < 60 ? "mid" : "hi") + '" style="width:' + Math.round(S.m.fans) + '%"></i></div><b>' + Math.round(S.m.fans) + "</b></div></section>";
  });
  U.actions.presopen = function () { U.open("pres"); };
  U.actions.preshire = function (b, v) {
    var r = presHire(+v);
    if (r.poor) { U.toast(tr("No te llega para la indemnización: {c}.", {c: fmtMoney(r.cost)})); return; }
    if (r.ok) { U.ui().sheet = null; U.toast(tr("{name} es el nuevo entrenador.", {name: S.m.pres.coach.fn + " " + S.m.pres.coach.ln})); U.edgeFlash(true); save(); }
  };
  U.sheets.pres = function () {
    var cur = S.m.pres.coach, sev = cur ? Math.round(cur.sal * 0.5 / 1e4) * 1e4 : 0;
    return "<h2>" + tr("Elige entrenador") + '</h2><div class="stack"><p class="muted" style="margin:0">' + tr("Él elige el once, el planteamiento y los cambios. Cuantas más estrellas, mejor rinde el equipo, pero más cobra.") + (cur ? " " + tr("Destituir a {name} cuesta {v} de indemnización.", {name: h(cur.fn + " " + cur.ln), v: fmtMoney(sev)}) : "") + '</p><div class="list">' +
      presCands().map(function (c, i) { return '<button class="pickrow" data-a="preshire" data-v="' + i + '"><span class="presic" aria-hidden="true">📋</span><div class="grow"><b>' + h(c.fn + " " + c.ln) + "</b> " + stars(c.q) + "<small>" + tr("{a} años · {s} · {v}/año", {a: c.age, s: h(tr(COACH_STY[c.sty].n)), v: fmtMoney(c.sal)}) + "</small></div></button>"; }).join("") +
      '</div><button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
})();
