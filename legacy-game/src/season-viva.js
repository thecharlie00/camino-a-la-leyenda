/* season-viva.js — Foco de jornada y crónicas derivadas de la simulación.
   Todo dato narrativo procede del save actual; no introduce resultados, hechos históricos ni azar nuevo. */
var SeasonViva = (function () {
  function registry(year) {
    if (!S) return null;
    var v = S.viva;
    if (!v || v.v !== 1 || !Array.isArray(v.seen)) v = S.viva = {v: 1, y: year, seen: []};
    if (v.y !== year) { v.y = year; v.seen = []; }
    return v;
  }
  function has(v, k) { return v.seen.indexOf(k) >= 0; }
  function remember(v, k) { v.seen.push(k); if (v.seen.length > 16) v.seen.splice(0, v.seen.length - 16); }
  function moment(title, ctx, choice, text) {
    return {t: "moment", tipo: "real", hot: true, title: tr(title), ctx: ctx || "", choice: tr(choice), txt: text, good: null, chips: []};
  }
  function matchTotals(card) {
    var out = {g: 0, a: 0};
    (card.log || []).forEach(function (m) { if (m.ro === "nc") return; out.g += +m.g || 0; out.a += +m.a || 0; });
    return out;
  }
  function youngStats(last) {
    var out = {apps: 0, goals: 0};
    if (!S || !S.m || !Array.isArray(S.m.sq)) return out;
    S.m.sq.forEach(function (p) {
      var st = last ? p.lastSt : p.st;
      if (p.age <= (last ? 22 : 21) && st) { out.apps += +st.apps || 0; out.goals += +st.g || 0; }
    });
    return out;
  }
  function blockMoment(card) {
    var v = registry(card.y), key = "block-" + card.bi;
    if (!v || has(v, key)) return null;
    /* Dos puntos de giro por temporada: mitad de curso y tramo decisivo. */
    if (card.bi !== 1 && card.bi !== 3) return null;
    var ctx = tr("Tramo {n} · {season}", {n: card.bi + 1, season: seasonLabel(card.y)}), txt, title;
    if (card.t === "mblock") {
      var st = card.st || {w: 0, d: 0, l: 0};
      title = st.w > st.l ? "La forma del equipo acompaña" : st.l > st.w ? "Un tramo exigente" : "La pelea sigue abierta";
      txt = tr("Balance del tramo: {w}, {d} y {l}.", {w: trn(st.w || 0, "{n} victoria", "{n} victorias"), d: trn(st.d || 0, "{n} empate", "{n} empates"), l: trn(st.l || 0, "{n} derrota", "{n} derrotas")});
      if (card.pos > 0) txt += " " + tr("Puesto actual en la liga: {pos}.", {pos: ord(card.pos)});
    } else {
      var total = matchTotals(card), apps = card.st && card.st.apps || 0;
      if (!apps) return null;
      title = total.g + total.a > 0 ? "Tu aportación se nota" : "Cada minuto cuenta";
      txt = tr("En este tramo: {apps}, {goals} y {assists}.", {apps: trn(apps, "{n} partido", "{n} partidos"), goals: trn(total.g, "{n} gol", "{n} goles"), assists: trn(total.a, "{n} asist.", "{n} asistencias")});
      if (card.st.rn > 0) txt += " " + tr("Nota media: {r}.", {r: fmtDec(card.st.rs / card.st.rn, 1)});
    }
    remember(v, key);
    return moment(title, ctx, "Hito de tu carrera", txt);
  }
  function seasonMoment(card) {
    var v = registry(card.y), key = "season-end";
    if (!v || has(v, key)) return null;
    var r = card.row || {}, txt;
    if (card.t === "mseasonEnd") {
      var pos = card.pos > 0 ? tr("El equipo terminó en el puesto {pos}.", {pos: ord(card.pos)}) : tr("La temporada del equipo llegó a su fin.");
      var record = tr("Balance: {w}, {d} y {l}.", {w: trn(r.w || 0, "{n} victoria", "{n} victorias"), d: trn(r.d || 0, "{n} empate", "{n} empates"), l: trn(r.l || 0, "{n} derrota", "{n} derrotas")});
      var tro = r.tro && r.tro.length ? trn(r.tro.length, "{n} título de equipo.", "{n} títulos de equipo.") : tr("Esta temporada no dejó títulos de equipo.");
      txt = [pos, record, tro].join(" · ");
    } else {
      var statline = tr("{apps}: {goals} y {assists}.", {apps: trn(r.apps || 0, "{n} partido", "{n} partidos"), goals: trn(r.g || 0, "{n} gol", "{n} goles"), assists: trn(r.a || 0, "{n} asist.", "{n} asistencias")});
      var avg = tr("Nota media: {r}.", {r: r.rt ? fmtDec(r.rt, 1) : "—"});
      var awards = r.tro && r.tro.length ? trn(r.tro.length, "{n} título de equipo.", "{n} títulos de equipo.") : tr("Esta temporada no dejó títulos de equipo.");
      txt = [statline, avg, awards].join(" · ");
    }
    remember(v, key);
    return moment("La temporada en tres momentos", seasonLabel(card.y), "Balance de temporada", txt);
  }
  function onFeed(card, push) {
    if (!S || !card || !push || S.ph === "ret") return;
    var story = null;
    if (card.t === "block" || card.t === "mblock") story = blockMoment(card);
    else if (card.t === "seasonEnd" || card.t === "mseasonEnd") story = seasonMoment(card);
    if (story) push(story);
  }
  function focus() {
    if (!S || S.ph === "ret" || S.ph === "post" || S.pend && S.pend.length) return null;
    if (S.ph !== "pre" && S.ph !== "gap") return null;
    var mgr = S.mode === "mgr", club = mgr && S.m ? S.m.club : S.p ? S.p.club : -1;
    if (club == null || club < 0) return null;
    if (mgr) {
      var unavailable = typeof mUnavXI === "function" ? mUnavXI() : [];
      if (unavailable && unavailable.length) return {title: trn(unavailable.length, "Hay {n} baja en tu once.", "Hay {n} bajas en tu once."), detail: tr("Antes de avanzar, revisa quién puede jugar."), action: "fixxi", value: "", label: tr("Corregir automáticamente")};
      return {title: tr("Prepara el siguiente tramo"), detail: tr("Abre la semana de trabajo para revisar rival y preparación."), action: "vivafocus", value: "week", label: tr("Ver preparación")};
    }
    var opp = typeof nextLgOpp === "function" ? nextLgOpp(club) : -1;
    if (opp >= 0) return {title: tr("Próximo rival de liga"), detail: tr("{club} · {league}", {club: clubName(opp), league: lgName(S.cl[club])}), action: "tab", value: "comp", label: tr("Ver competición")};
    return {title: tr("Tus objetivos de temporada"), detail: tr("Consulta tu progreso antes del siguiente tramo."), action: "tab", value: "jugador", label: tr("Ver objetivos")};
  }
  return {onFeed: onFeed, focus: focus};
})();
(function () {
  if (typeof feed !== "function") return;
  var previousFeed = feed;
  feed = function (card) {
    var result = previousFeed.apply(this, arguments);
    SeasonViva.onFeed(card, function (story) { previousFeed.call(this, story); });
    return result;
  };
})();
