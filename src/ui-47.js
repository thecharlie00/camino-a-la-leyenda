/* ui-47.js — «Sin rachas eternas» (4.7), interfaz: el jugador ve siempre dónde está la línea y qué ayuda tiene. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;
  function card(ic, title, sub, cls, bar) {
    return '<section class="card crcard blpcard ' + (cls || "") + '"><div class="presrow"><span class="presic" aria-hidden="true">' + ic + '</span><div class="grow"><b>' + title + "</b><small>" + sub + "</small>" + (bar || "") + "</div></div></section>";
  }
  function meter(v, max, cls) { return '<div class="bar blpbar"><i class="' + (cls || "") + '" style="width:' + Math.max(3, Math.min(100, v / max * 100)) + '%"></i></div>'; }

  /* míster: ultimátum en juego y aviso antes de llegar a él */
  U.add("clubTop", function () {
    if (!S || S.mode !== "mgr" || !S.m || S.m.club < 0 || S.m.owner || S.ph === "ret") return "";
    var m = S.m, L = blpUltLive();
    if (L) {
      var need = L.need, got = L.n ? L.pts / L.n : 0, ok = L.n && got >= need;
      var sub = L.playing && L.n ? tr("Llevas {pts} puntos en {n} partidos de liga: media {got}. Necesitas {need}.", {pts: L.pts, n: L.n, got: fmtNeed(got), need: fmtNeed(need)})
        : tr("En el próximo tramo necesitas una media de {need} puntos por partido de liga. Si lo consigues, la directiva vuelve a confiar en ti.", {need: fmtNeed(need)});
      return card("⏳", tr("Ultimátum de la directiva"), h(sub), "lv3", L.playing && L.n ? meter(got, Math.max(need * 1.5, 1), ok ? "ok" : "bad") : "");
    }
    var warn = mSackT(0) + 10;
    if (m.board < warn && S.ph !== "mjob") {
      var used = m.ult && m.ult.club === m.club && m.ult.st !== "ok";
      return card("⚠️", tr("La directiva se impacienta ({b})", {b: Math.round(m.board)}),
        h(used ? tr("Ya agotaste el ultimátum en este club: si la confianza baja de {t}, te despiden.", {t: mSackT(0)}) : tr("Si la confianza baja de {t}, la directiva te dará un ultimátum: un tramo para salvar el puesto.", {t: mSackT(0)})), "lv2");
    }
    return "";
  });

  /* jugador: racha sin jugar y confianza en el minijuego */
  U.add("carreraTop", function () {
    if (!S || S.mode === "mgr" || !S.p || !S.blp || S.ph === "ret") return "";
    var b = S.blp, o = "";
    if (b.bench >= 3 && !(S.p.flags && S.p.flags.frozen)) {
      var pc = Math.round(blpBenchChance(b.bench) * 100);
      o += card("🪑", trn(b.bench, "{n} partido sin jugar", "{n} partidos sin jugar"),
        h(b.promise ? tr("El míster te ha prometido la titularidad en el próximo partido.") : pc ? tr("El míster se lo está pensando: +{p} % de opciones de ser titular en el próximo partido.", {p: pc}) : tr("Si sigues sin jugar, el míster empezará a plantearse darte una oportunidad.")), "lv1");
    }
    if (blpMgBonus()) o += '<div class="qchip blpchip">🎯 ' + h(tr("Confianza +{n} en tu próximo penalti o falta", {n: blpMgBonus()})) + "</div>";
    return o;
  });
})();
