/* ui-45.js — «Mundo vivo» (versión 4.5), interfaz: día de cierre en directo, play-offs y juveniles en el historial. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h, timer = null;

  /* ---------- día de cierre: tarjeta pendiente ---------- */
  U.pend.dlday = function (x) {
    var m = S.m, d = MPH.dlday.head(x);
    return '<section class="card decision hotc dlcard"><div class="head"><span class="tag hot"><span class="dot"></span>' + h(d.tagTxt) + '</span><span class="eyebrow">' + h(d.cat) + "</span></div>" +
      "<h3>" + h(d.title) + '</h3><p class="lead">' + h(d.text) + '</p><div class="opts">' +
      '<button class="opt" data-a="dllive"><b>📺 ' + tr("Vivirlo en directo") + "</b><small>" + tr("De las 18:00 a medianoche, con reloj, ofertas de última hora y gangas.") + "</small></button>" +
      '<button class="opt" data-a="choose" data-i="1"><b>' + tr("Cerrar el mercado sin más") + "</b><small>" + tr("Se rechaza todo lo que llegue y empieza el siguiente tramo.") + "</small></button></div></section>";
  };
  U.actions.dllive = function () { if (!S || !S.m) return; dlStart(); U.persist(); U.open("dl45"); };
  U.actions.dlnext = function () { if (!S.m.dl) return; dlTick(1); U.persist(); U.renderSheet(); };
  U.actions.dlauto = function () {
    if (timer) { clearInterval(timer); timer = null; U.renderSheet(); return; }
    timer = setInterval(function () {
      var ui = U.ui();
      if (!S || !S.m || !S.m.dl || !ui.sheet || ui.sheet.k !== "dl45" || S.m.dl.t >= DL_STEPS) { clearInterval(timer); timer = null; if (ui.sheet && ui.sheet.k === "dl45") U.renderSheet(); return; }
      dlTick(1); U.persist(); U.renderSheet();
    }, 2200);
    U.renderSheet();
  };
  U.actions.dlyes = function (b, v) { var r = dlAct(v, true); if (!r.ok && r.why) U.toast(r.why); U.persist(); U.renderSheet(); };
  U.actions.dlno = function (b, v) { dlAct(v, false); U.persist(); U.renderSheet(); };
  U.actions.dlend = function () {
    if (timer) { clearInterval(timer); timer = null; }
    dlFinish(false); U.persist(); U.closeSheet(); U.render(true);
  };

  function plLine(p) { return posAb(p.pos) + " · " + tr("{n} años", {n: p.age}) + " · " + tr("media {n}", {n: Math.round(p.ovr)}); }
  U.sheets.dl45 = function () {
    var m = S.m, D = m.dl;
    if (!D) return "<h2>" + tr("Día de cierre") + '</h2><p class="lead">' + tr("El mercado ya está cerrado.") + '</p><button class="btn wide" data-a="close">' + tr("Cerrar") + "</button>";
    var end = D.t >= DL_STEPS, pct = Math.round(D.t / DL_STEPS * 100), bill = mWageBill();
    var o = '<div class="dl45"><div class="dlhead"><div><span class="eyebrow">' + h(D.win === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano")) + "</span><h2>" + tr("Día de cierre") + "</h2></div>" +
      '<div class="dlclock' + (D.t >= DL_STEPS - 2 ? " hot" : "") + '" aria-label="' + h(tr("Hora")) + '">' + dlClock(D.t) + "</div></div>" +
      '<div class="dlbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="dlmeta"><span>' + tr("Presupuesto") + " <b>" + fmtMoney(m.bud) + "</b></span><span>" + tr("Masa salarial") + " <b>" + fmtMoney(bill) + " / " + fmtMoney(m.wcap) + "</b></span></div>";
    var act = dlActive();
    if (!end) {
      if (act.length) {
        o += '<div class="dlacts">';
        act.forEach(function (e) {
          var left = dlClock(e.t + 3);
          if (e.k === "off") {
            var p = mPl(e.pid); if (!p) return;
            o += '<div class="dlev off"><div class="dlevh">' + U.crest(e.club) + "<div><b>" + tr("Oferta del {club}", {club: h(clubName(e.club))}) + "</b><small>" + h(plName(p)) + " · " + h(plLine(p)) + "</small></div></div>" +
              '<div class="dlnums"><span>' + tr("Ofrecen") + " <b>" + fmtMoney(e.fee) + "</b></span><span>" + tr("Valor") + " <b>" + fmtMoney(pValue(p)) + "</b></span><span>" + tr("Caduca a las {t}", {t: left}) + "</span></div>" +
              '<div class="row2"><button class="btn" data-a="dlno" data-v="' + e.id + '">' + tr("Rechazar") + '</button><button class="btn pri" data-a="dlyes" data-v="' + e.id + '">' + tr("Vender") + "</button></div></div>";
          } else {
            var t = e.tg, can = e.fee <= m.bud && bill + t.sal <= m.wcap * 1.1;
            o += '<div class="dlev ganga"><div class="dlevh">' + U.crest(t.club) + "<div><b>" + tr("Ganga: {name}", {name: h(t.fn + " " + t.ln)}) + "</b><small>" + h(plLine(t)) + " · " + h(clubName(t.club)) + "</small></div></div>" +
              '<div class="dlnums"><span>' + tr("Precio") + " <b>" + fmtMoney(e.fee) + "</b> <s>" + fmtMoney(t.ask) + "</s></span><span>" + tr("Sueldo") + " <b>" + fmtMoney(t.sal) + "</b></span><span>" + tr("Caduca a las {t}", {t: left}) + "</span></div>" +
              '<div class="row2"><button class="btn" data-a="dlno" data-v="' + e.id + '">' + tr("Pasar") + '</button><button class="btn pri" data-a="dlyes" data-v="' + e.id + '"' + (can ? "" : ' aria-disabled="true"') + ">" + tr("Fichar") + "</button></div></div>";
          }
        });
        o += "</div>";
      } else o += '<p class="muted dlwait">' + tr("Teléfonos en silencio… de momento.") + "</p>";
    } else {
      o += '<div class="dlclosed"><b>' + tr("¡Se cierra el mercado!") + "</b><span>" + (D.deals.length ? trn(D.deals.length, "{n} operación al límite", "{n} operaciones al límite") : tr("Ni entradas ni salidas en el último día.")) + "</span></div>";
    }
    o += '<h3 class="dlh3">' + tr("Última hora") + '</h3><ul class="dllog">' + (D.log.length ? D.log.slice(0, 14).map(function (l) {
      return '<li class="' + (l.good ? "good" : l.hot ? "hot" : "") + '"><span class="num">' + dlClock(l.t) + "</span>" + h(l.x) + "</li>";
    }).join("") : '<li><span class="num">' + dlClock(0) + "</span>" + tr("Arranca el último día de mercado.") + "</li>") + "</ul>";
    if (!end) o += '<div class="row2 dlctl"><button class="btn" data-a="dlauto">' + (timer ? "⏸ " + tr("Pausar") : "▶ " + tr("Automático")) + '</button><button class="btn pri" data-a="dlnext">' + tr("+30 minutos") + "</button></div>";
    else o += '<button class="btn pri wide" data-a="dlend">' + tr("Cerrar el mercado y seguir") + "</button>";
    return o + "</div>";
  };

  /* ---------- historial: torneos de verano, juvenil y Copa juvenil ---------- */
  U.add("hist", function () {
    if (!S) return "";
    var mgr = S.mode === "mgr", pt = (mgr ? S.m && S.m.pt45 : S.p && S.p.pt45) || [], o = "";
    if (pt.length) {
      o += '<section class="card"><div class="head"><h3>' + tr("Torneos de verano") + '</h3><span class="eyebrow">' + trn(pt.filter(function (x) { return x.pos === 1; }).length, "{n} ganado", "{n} ganados") + '</span></div><div class="kvlist">' +
        pt.slice(0, 10).map(function (x) { return "<div><span>" + x.y + " · " + h(tr("Trofeo de verano del {club}", {club: clubName(x.host)})) + "</span><span>" + (x.pos === 1 ? "🏆 " : "") + h(ptPosTxt(x.pos)) + (x.g ? " · " + trn(x.g, "{n} gol", "{n} goles", {n: x.g}) : "") + "</span></div>"; }).join("") + "</div></section>";
    }
    if (!mgr && S.p && S.p.y45) {
      var ys = Object.keys(S.p.y45).sort().reverse(), tro = S.p.yTro || [];
      if (ys.length) o += '<section class="card"><div class="head"><h3>' + tr("Juvenil") + '</h3><span class="eyebrow">' + trn(tro.length, "{n} título", "{n} títulos") + '</span></div><div class="kvlist">' +
        ys.map(function (y) { var r = S.p.y45[y]; return "<div><span>" + seasonLabel(+y) + " · " + h(clubName(r.club)) + "</span><span>" + trn(r.apps, "{n} partido", "{n} partidos") + " · " + trn(r.g, "{n} gol", "{n} goles") + (r.pos ? " · " + tr("{pos}.º", {pos: r.pos}) : "") + "</span></div>"; }).join("") +
        tro.map(function (t) { return "<div><span>🏆 " + h(tr(t.n)) + "</span><span>" + seasonLabel(t.y) + "</span></div>"; }).join("") + "</div></section>";
    }
    if (mgr && S.m && S.m.yc45 && S.m.yc45.length) {
      o += '<section class="card"><div class="head"><h3>' + tr("Copa juvenil") + '</h3><span class="eyebrow">' + trn(S.m.yc45.filter(function (x) { return x.st === 4; }).length, "{n} ganada", "{n} ganadas") + '</span></div><div class="kvlist">' +
        S.m.yc45.slice(0, 10).map(function (x) { return "<div><span>" + seasonLabel(x.y) + " · " + h(clubName(x.club)) + "</span><span>" + (x.st === 4 ? "🏆 " : "") + h(tr(YC_STAGE[x.st])) + "</span></div>"; }).join("") + "</div></section>";
    }
    return o;
  });

  /* ---------- competición: el último play-off de tu liga ---------- */
  U.add("comp", function () {
    if (!S || !S.last || !S.last.po) return "";
    var me = S.mode === "mgr" ? S.m && S.m.club : S.p && S.p.club; if (me == null || me < 0) return "";
    var li = -1;
    Object.keys(S.last.po).forEach(function (k) { var po = S.last.po[k]; if (po.t.indexOf(me) >= 0 || +k === S.cl[me]) li = +k; });
    if (li < 0) return "";
    var po = S.last.po[li], L = W.lg[li];
    var o = '<section class="card"><div class="head"><h3>' + tr("Play-off de ascenso") + '</h3><span class="eyebrow">' + h(lgName(li)) + " · " + seasonLabel(S.last.poY) + "</span></div>";
    po.r.forEach(function (ms) {
      o += '<p class="lbl" style="margin:8px 0 4px">' + h(tr(poRoundName(ms.length * 2))) + "</p>";
      ms.forEach(function (mt) {
        var sc = mt.g[0] + "-" + mt.g[1] + (mt.pen ? " (" + mt.pen[0] + "-" + mt.pen[1] + " " + tr("pen.") + ")" : mt.et ? " " + tr("(prór.)") : "");
        o += '<div class="pomatch"><span class="' + (mt.w === mt.a ? "w" : "") + (mt.a === me ? " me" : "") + '">' + h(clubName(mt.a)) + '</span><b class="num">' + sc + '</b><span class="' + (mt.w === mt.b ? "w" : "") + (mt.b === me ? " me" : "") + '">' + h(clubName(mt.b)) + "</span></div>";
      });
    });
    return o + '<p class="muted" style="font-size:var(--fs-sm);margin:8px 0 0">' + tr("Sube a {lg}: {club}.", {lg: h(trComp(lgDivRaw(L.upI))), club: h(clubName(po.w))}) + "</p></section>";
  });
})();
