/* ui-cups.js — versión 2.9: «Copas y torneos» en la pestaña de clasificación.
   Elige cualquier competición de la temporada (Champions, Europa League, copas, Mundial, Eurocopa…)
   y ve su fase de liga o de grupos completa y todas las eliminatorias, con tu equipo resaltado. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;

  function myCi() { var me = U.myClub(); return me >= 0 && S.cl[me] != null && W.lg[S.cl[me]] ? W.lg[S.cl[me]].ci : -1; }
  /* competiciones que se pueden consultar, agrupadas */
  function cupList() {
    var ci = myCi(), groups = {mine: [], club: [], nat: [], dom: []};
    Object.keys(S.C || {}).forEach(function (k) {
      var c = S.C[k];
      if (!c || k === "NQ" || c.typ === "nq") return;
      if (c.dom && c.ci !== ci && !U.involved(c)) return;
      var g = U.involved(c) ? "mine" : c.dom ? "dom" : c.nat ? "nat" : "club";
      groups[g].push(k);
    });
    Object.keys(groups).forEach(function (g) { groups[g].sort(function (a, b) { return (S.C[b].lvl || 0) - (S.C[a].lvl || 0); }); });
    return groups;
  }
  function firstKey(g) { return g.mine[0] || g.club[0] || g.nat[0] || g.dom[0] || null; }

  function tieRow(t, nat, me) {
    if (t.b < 0 || t.a < 0) { var only = t.a < 0 ? t.b : t.a; return '<li class="cuptie' + (only === me ? " me" : "") + '"><span class="ct-a">' + U.team(nat, only) + '</span><span class="ct-s muted">' + tr("Exento") + "</span><span></span></li>"; }
    var sc = t.s.length ? t.s.map(function (s) { return s[0] + "-" + s[1]; }).join(" / ") : "—";
    var wa = t.w === t.a, wb = t.w === t.b;
    return '<li class="cuptie' + (t.a === me || t.b === me ? " me" : "") + '"><span class="ct-a' + (wa ? " w" : wb ? " l" : "") + '">' + U.team(nat, t.a) + '</span><span class="ct-s">' + sc + (t.p ? '<small>' + tr("(pen.)") + "</small>" : "") + '</span><span class="ct-b' + (wb ? " w" : wa ? " l" : "") + '">' + U.team(nat, t.b) + "</span></li>";
  }
  function koBlock(c, nat, me) {
    if (!c.ko) return "";
    var out = "", last = -1;
    c.ko.r.forEach(function (rd, i) { if (rd.ties.length) last = i; });
    for (var i = last; i >= 0; i--) {
      var rd = c.ko.r[i], ties = rd.ties, more = 0;
      if (!ties.length) continue;
      if (ties.length > 16) { var mine = ties.filter(function (t) { return t.a === me || t.b === me; }); more = ties.length - mine.length; ties = mine; }
      out += '<div class="cupround"><div class="lbl">' + h(tr(rd.n)) + (i === c.ko.ri && c.win < 0 ? ' · <span class="led">' + tr("en juego") + "</span>" : "") + '</div><ul class="cupties">' + ties.map(function (t) { return tieRow(t, nat, me); }).join("") + "</ul>" +
        (more ? '<p class="muted cupmore">' + trn(more, "Y {n} eliminatoria más.", "Y {n} eliminatorias más.") + "</p>" : "") + "</div>";
    }
    var nx = c.ko.r[last + 1];
    if (c.win < 0 && nx) out = '<p class="muted cupmore">' + tr("Siguiente ronda: {r}", {r: h(tr(nx.n))}) + "</p>" + out;
    return out;
  }
  function cupDetail(k) {
    var c = S.C[k]; if (!c) return "";
    var nat = !!c.nat, me = nat ? U.myNat() : U.myClub(), o = "";
    if (c.win >= 0 && (c.done || c.typ === "lite")) o += '<p class="lead cupchamp">🏆 ' + (c.win === me ? '<b class="pos">' + tr("¡Campeones!") + "</b>" : tr("Campeón: {team}", {team: U.team(nat, c.win)})) + "</p>";
    if (c.typ === "lite") return o + '<p class="muted">' + tr("Esta temporada no la disputas: aquí solo se guarda el campeón.") + "</p>";
    o += koBlock(c, nat, me);
    if (c.typ === "swiss") o += '<div class="lbl">' + tr("Fase de liga") + "</div>" + U.miniTable(sortTable(c.teams, c.tb, nat), 0, me, nat);
    else if (c.typ === "grp" && c.g) o += c.g.map(function (g, i) { return '<div class="lbl">' + tr("Grupo {g}", {g: String.fromCharCode(65 + i)}) + "</div>" + U.miniTable(sortTable(g, c.gt[i], nat), 0, me, nat); }).join("");
    return o || '<p class="muted">' + tr("Aún no se ha jugado ningún partido.") + "</p>";
  }
  function cupsView() {
    var g = cupList(), ui = U.ui(), all = g.mine.concat(g.club, g.nat, g.dom);
    if (!all.length) return '<section class="card"><p class="empty">' + tr("No hay copas ni torneos en juego ahora mismo.") + "</p></section>";
    if (!ui.cupSel || all.indexOf(ui.cupSel) < 0) ui.cupSel = firstKey(g);
    var c = S.C[ui.cupSel];
    var chips = g.mine.length ? '<div class="cupchips" role="group" aria-label="' + h(tr("Tus competiciones")) + '">' + g.mine.map(function (k) { return '<button class="chipb" data-a="cupsel" data-v="' + h(k) + '" aria-pressed="' + (k === ui.cupSel) + '">' + h(trComp(S.C[k].s || S.C[k].n)) + "</button>"; }).join("") + "</div>" : "";
    var opt = function (lab, ks) { return ks.length ? '<optgroup label="' + h(lab) + '">' + ks.map(function (k) { return '<option value="' + h(k) + '"' + (k === ui.cupSel ? " selected" : "") + ">" + h(trComp(S.C[k].n)) + "</option>"; }).join("") + "</optgroup>" : ""; };
    var sel = '<label class="lbl" for="cupsel">' + tr("Todas las competiciones") + '</label><select id="cupsel">' + opt(tr("Tus competiciones"), g.mine) + opt(tr("Clubes"), g.club) + opt(tr("Selecciones"), g.nat) + opt(tr("Copas nacionales"), g.dom) + "</select>";
    return '<section class="card">' + chips + sel + "</section>" +
      '<section class="card"><div class="head"><h3>' + h(trComp(c.n)) + '</h3><span class="eyebrow">' + (U.involved(c) ? tr("Participas") : c.typ === "lite" ? tr("Terminada") : tr("Sigue en juego")) + "</span></div>" + cupDetail(ui.cupSel) + "</section>";
  }
  U.cupsView = cupsView;
  U.actions.cupsel = function (b, v) { U.ui().cupSel = v; U.render(false); };
  U.actions.compseg = function (b, v) { U.ui().compSeg = v; U.render(true); };
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "cupsel") { U.ui().cupSel = e.target.value; U.render(false); } });
})();
