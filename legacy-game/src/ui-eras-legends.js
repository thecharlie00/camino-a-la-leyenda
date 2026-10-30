/* Pantallas de la fase 8: desafíos de época y diario, leyenda rival y dinastía en el Anuario. */
(function () {
  if (!ERAS_MODE || !window.UIX || typeof EraLegends === "undefined") return;
  var EL = EraLegends, layer = null;
  function t(s, v) { return eraText(s, v); }
  function esc(v) { return eraEscape(v); }
  function clubLabel(name, year) { return typeof eraClubName === "function" ? eraClubName(name, year) : name; }
  function mount() {
    if (window.UIX.eraMoCss) window.UIX.eraMoCss(); else if (window.UIX.eraTheme) window.UIX.eraTheme();
    layer = document.getElementById("era-overlay");
    if (!layer) { layer = document.createElement("div"); layer.id = "era-overlay"; layer.className = "eras-overlay"; document.body.appendChild(layer); }
    render();
  }
  function row(c) {
    var done = (EraMeta.get().ch || {})[c.id];
    return '<div class="mo-card"><h4>' + esc(EL.challengeName(c)) + (done ? " ✓" : "") + "</h4><small>" + esc(c.year) + " · " + esc(clubLabel(c.club, c.year)) + " · " + (c.mode === "player" ? t("Carrera de jugador") : t("Carrera de míster")) + "</small>" +
      "<small>" + esc(EL.challengeGoal(c)) + '</small><div class="mo-row"><button type="button" data-lg-act="start" data-lg-v="' + esc(c.id) + '">' + (done ? t("Volver a jugar") : t("Aceptar el desafío")) + "</button></div></div>";
  }
  function render() {
    if (!layer) return;
    var d = EL.daily(), n = Object.keys(EraMeta.get().ch || {}).length;
    layer.innerHTML = '<section class="eras-dialog" role="dialog" aria-modal="true" aria-labelledby="lg-title"><div class="eras-kicker">' + t("Modo Épocas") + '</div><h2 id="lg-title">' + t("Desafíos de época") + "</h2>" +
      '<p class="eras-lead">' + t("Empieza en un club y un año concretos con una meta histórica. Si no llegas a tiempo, la carrera sigue: no pierdes nada.") + "</p>" +
      '<div class="eras-summary"><b>' + t("{n} desafíos conseguidos", {n: n}) + "</b>" + (EraMeta.get().titles.chal ? " · " + t("Título: Retador de épocas") : "") + "</div>" +
      (d ? "<h3>" + t("Hoy") + "</h3>" + row(d) : "") + "<h3>" + t("Desafíos históricos") + "</h3>" + EL.data.challenges.map(row).join("") +
      '<div class="eras-actions"><button type="button" data-lg-act="close">' + t("Volver") + "</button></div></section>";
  }
  function start(id) {
    var c = EL.challengeById(id); if (!c) return;
    if (layer) layer.remove(); layer = null;
    window.UIX.startCreate(c.mode === "player" ? "p" : "mgr", {era: {year: c.year, packId: eraPackForYear(c.year).id, challenge: c.id}});
  }
  document.addEventListener("click", function (event) {
    var b = event.target && event.target.closest ? event.target.closest("[data-lg-act]") : null;
    if (!b) return;
    var a = b.getAttribute("data-lg-act"), v = b.getAttribute("data-lg-v");
    if (a === "open") { var old = document.getElementById("era-overlay"); if (old) old.remove(); mount(); }
    else if (a === "close") { if (layer) layer.remove(); layer = null; }
    else if (a === "start") start(v);
    else if (a === "dynasty") dynasty();
  });
  var baseButtons = window.UIX.eraMomentsButtons;
  window.UIX.eraMomentsButtons = function () { return (baseButtons ? baseButtons() : "") + '<button type="button" data-lg-act="open">' + t("Desafíos de época") + "</button>"; };
  /* aviso en el formulario de creación cuando se juega un desafío */
  window.UIX.eraCreateNote = function (c) {
    var ch = c.era && c.era.challenge ? EL.challengeById(c.era.challenge) : null, out = "";
    if (ch) out += '<section class="card eras-clubcard"><span class="eyebrow">' + esc(EL.challengeName(ch)) + '</span><p class="lead" style="margin:6px 0 0">' + esc(EL.challengeGoal(ch)) + " " + t("Tu club será {club}.", {club: clubLabel(ch.club, ch.year)}) + "</p></section>";
    var dyn = c.era && c.era.dynasty;
    if (dyn) out += '<section class="card eras-clubcard"><span class="eyebrow">' + t("Dinastía · generación {n}", {n: dyn.gen}) + '</span><p class="lead" style="margin:6px 0 0">' + t("Heredas el apellido y la historia que cambió tu familia.") + "</p></section>";
    if (!c.club || c.club < 0) { var sl = EL.starsLine(c.era.year, null); if (sl) out += '<p class="lead">' + esc(sl) + "</p>"; }
    return out;
  };
  /* Anuario: desafío, leyenda rival y dinastía */
  function dynasty() {
    var d = EL.dynastyFrom(); if (!d) return;
    try { EraStore.save(); } catch (e) {}
    var old = document.getElementById("era-overlay"); if (old) old.remove();
    window.UIX.startCreate("p", {ln: d.ln, era: {year: d.year, packId: eraPackForYear(d.year).id, dynasty: d}});
  }
  window.UIX.eraBookExtra = function (retired) {
    var out = "", ch = EL.chalStatus(), duel = EL.rivalDuel(), dyn = S.era.dynasty;
    if (ch) {
      var def = EL.challengeById(ch.id);
      out += '<section class="eras-summary"><b>' + esc(def ? EL.challengeName(def) : ch.id) + '</b><p class="eras-lead" style="margin:6px 0 0">' +
        (ch.done ? t("Desafío conseguido en {y}.", {y: ch.done}) : ch.failed ? t("No llegó a tiempo. La carrera sigue igual.") : t("En juego hasta la temporada {y}.", {y: typeof seasonLabel === "function" ? seasonLabel(ch.by) : ch.by})) + "</p></section>";
    }
    if (duel) out += '<section class="eras-summary"><b>' + t("Leyenda rival: {n} ({club})", {n: esc(duel.name), club: esc(duel.club)}) + '</b><p class="eras-lead" style="margin:6px 0 0">' +
      t("Títulos desde que empezó el duelo: tu equipo {a}, el suyo {b}.", {a: duel.mine, b: duel.theirs}) + (duel.retired ? " " + t("Ya colgó las botas o cambió de aires.") : "") + "</p></section>";
    if (dyn && dyn.prev && dyn.prev.length) out += '<section class="eras-summary"><b>' + t("Dinastía · generación {n}", {n: dyn.gen}) + "</b>" +
      dyn.prev.map(function (p) { return '<p class="eras-lead" style="margin:4px 0 0">' + esc(p.n + " · " + p.from + "–" + p.to + " · ") + t("{n} títulos", {n: p.tro}) + "</p>"; }).join("") + "</section>";
    if (retired && EL.dynastyFrom()) out += '<div class="eras-actions"><button type="button" class="primary" data-lg-act="dynasty">' + t("Continuar la dinastía en {y}", {y: S.yr + 1}) + "</button></div>";
    return out;
  };
  window.UIX.add("after", function () {
    if (S && S.era && S.era.chalNews && window.UIX.toast) { S.era.chalNews = 0; window.UIX.toast(t("¡Desafío de época conseguido!")); }
  });
})();
