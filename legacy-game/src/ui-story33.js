/* ui-story33.js — versión 3.3: relaciones del vestuario, tu gente en el equipo y despedida de leyenda. */
(function () {
  if (typeof UIX === "undefined" || typeof relOf !== "function") return;
  var U = UIX, h = U.h;
  /* míster: amistades y piques en «Equipo» */
  U.add("plantilla", function () {
    if (!S || S.mode !== "mgr" || !S.m || S.m.club < 0) return "";
    var l = relOf(); if (!l.length) return "";
    return '<section class="card"><h3>' + tr("Relaciones en el vestuario") + '</h3><ul class="dlist">' + l.map(function (r) {
      var a = mPl(r.a), b = mPl(r.b);
      return '<li><span aria-hidden="true">' + (r.k === "f" ? "🤝" : "⚡") + "</span><span><b>" + h(plShort(a)) + "</b> " + (r.k === "f" ? tr("y") : tr("contra")) + " <b>" + h(plShort(b)) + "</b> · " + (r.k === "f" ? tr("juntos en el once, el equipo rinde más") : tr("juntos en el once, el equipo rinde menos")) + "</span></li>";
    }).join("") + "</ul></section>";
  });
  /* jugador: tu gente en el vestuario */
  U.add("jugador", function () {
    if (!S || S.mode === "mgr" || !S.p || !S.p.flags) return "";
    var f = S.p.flags, o = [];
    if (f.bff && f.bff.c === S.p.club) o.push("<li><span aria-hidden=\"true\">🤝</span><span>" + tr("Tu mejor amigo en el equipo: {name}. Te sube el ánimo.", {name: "<b>" + h(f.bff.n) + "</b>"}) + "</span></li>");
    if (f.feud && f.feud.c === S.p.club) o.push("<li><span aria-hidden=\"true\">⚡</span><span>" + tr("Tienes un pique con {name}: te motiva, pero te desgasta.", {name: "<b>" + h(f.feud.n) + "</b>"}) + "</span></li>");
    return o.length ? '<section class="card"><h3>' + tr("Tu gente en el vestuario") + '</h3><ul class="dlist">' + o.join("") + "</ul></section>" : "";
  });
  /* despedida de leyenda */
  U.add("carreraTop", function () {
    if (!S || S.mode === "mgr" || S.ph !== "ret" || !farewellOn()) return "";
    var r = S.retired, p = S.p, said = r.speech ? FAREWELL.filter(function (x) { return x.k === r.speech; })[0] : null;
    var clubs = {}; p.seasons.forEach(function (x) { clubs[x.club] = 1; });
    var o = '<section class="card farewell"><div class="eyebrow">' + tr("Despedida de leyenda") + "</div><h2>" + tr("Partido homenaje a {name}", {name: h(p.fn + " " + p.ln)}) + "</h2>" +
      '<p class="lead">' + tr("El estadio del {club} se llena para despedirte: {n} temporadas, {t} títulos y {c} partidos con tu selección.", {club: h(clubName(r.main)), n: p.seasons.length, t: p.trophies.length, c: p.intl.caps}) + "</p>";
    if (said) o += '<blockquote class="fwq">' + h(tr(said.q)) + "</blockquote>";
    else o += '<p class="muted" style="margin:0 0 8px">' + tr("Te dan el micrófono en el centro del campo. ¿Qué dices?") + '</p><div class="opts">' + FAREWELL.map(function (x) { return '<button class="btn wide" data-a="farewell" data-v="' + x.k + '">' + h(tr(x.n)) + "</button>"; }).join("") + "</div>";
    return o + "</section>";
  });
  U.actions.farewell = function (b, v) { if (farewellSay(v)) { U.confetti(true); U.edgeFlash(true); U.persist(); U.render(false); } };
})();
