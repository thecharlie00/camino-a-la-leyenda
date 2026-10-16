/* chal32.js — versión 3.2 «Temporadas que no se repiten».
   - Desafíos de míster (salvar al colista, solo cantera, remontar una crisis) con medallas.
   - Rivalidades que se encienden partido a partido y crisis de club que duran más de una temporada.
   - Diario de la carrera (jugador y míster).
   - Récords históricos de cada liga y récords de tu carrera. */
var CHAL = {
  save: {ic: "🛟", n: N_("Salvar al colista"), d: N_("Coges al peor equipo de la liga. Objetivo: no descender."), goal: N_("Bronce: salvarte · Plata: mitad alta · Oro: entre los seis primeros.")},
  cant: {ic: "🌱", n: N_("Solo cantera"), d: N_("No puedes fichar: solo juveniles y los que ya tienes. Tienes tres temporadas."), goal: N_("Bronce: entre los cuatro primeros · Plata: un título · Oro: la liga.")},
  crisis: {ic: "🔥", n: N_("Remontar una crisis"), d: N_("Un grande hundido: vestuario roto, afición enfadada y sin dinero."), goal: N_("Bronce: que no te echen · Plata: mitad alta · Oro: entre los tres primeros.")}
};
var MEDAL_IC = {gold: "🥇", silver: "🥈", bronze: "🥉"};
var MEDAL_N = {gold: N_("Oro"), silver: N_("Plata"), bronze: N_("Bronce")};
function medalW(m) { var t = tr(MEDAL_N[m]); return typeof LANG !== "undefined" && LANG === "de" ? t : t.toLowerCase(); }
function chalOn() { return !!(S && S.mode === "mgr" && S.ch && !S.ch.res); }
function chalClub(k, li) {
  var cl = W.lg[li].cl0.slice().sort(function (a, b) { return W.clubs[b].r0 - W.clubs[a].r0; });
  if (k === "save") return cl[cl.length - 1];
  if (k === "crisis") return cl[Math.min(cl.length - 1, 2)];
  return cl[Math.floor(cl.length / 2)];
}
function chalStart(k) {
  var m = S.m; if (!CHAL[k]) return;
  S.ch = {k: k, n0: m.seasons.length, res: null};
  if (k === "crisis") {
    m.board = 42; m.fans = 26; m.chem = 30; m.bud = 0; m.crisis = 2;
    m.sq.forEach(function (p) { p.mor = clamp(p.mor - 28, 5, 100); });
  }
  if (k === "save") { m.board = 62; m.fans = 50; }
  if (k === "cant" && m.mk) m.mk.list = [];
}
function chalMedal(k, row, N, rel) {
  var pos = row.pos;
  if (k === "save") return pos <= 6 ? "gold" : pos <= N / 2 ? "silver" : pos <= N - rel ? "bronze" : null;
  if (k === "crisis") return pos <= 3 ? "gold" : pos <= N / 2 ? "silver" : "bronze";
  return null;
}
function chalEnd(medal, why) {
  var c = S.ch; if (!c || c.res) return;
  c.res = {medal: medal, y: S.yr, why: why || ""};
  var name = tr(CHAL[c.k].n);
  if (medal) notify(MEDAL_IC[medal] + " " + tr("Desafío «{n}» superado: medalla de {m}.", {n: name, m: medalW(medal)}), "good");
  else notify(tr("Desafío «{n}» no superado. Puedes seguir la partida igualmente.", {n: name}), "bad");
  diaryAdd("chal", {k: c.k, m: medal || ""});
}
(function () {
  if (typeof mgrSeasonEnd !== "function") return;
  var _se = mgrSeasonEnd;
  mgrSeasonEnd = function () {
    var r = _se.apply(this, arguments);
    if (chalOn()) {
      var m = S.m, row = m.seasons[m.seasons.length - 1], li = row.lg, N = S.L[li].tm.length, rel = W.lg[li].rel || 3, k = S.ch.k, done = m.seasons.length - S.ch.n0;
      if (k === "cant") {
        var tro = m.trophies.filter(function (t) { return t.y > S.yr - 3; }), lg = tro.some(function (t) { return String(t.k).indexOf("L:") === 0; });
        S.ch.best = S.ch.best || null;
        var md = lg ? "gold" : tro.length ? "silver" : row.pos <= 4 ? "bronze" : null;
        var rank = {gold: 3, silver: 2, bronze: 1};
        if (md && (!S.ch.best || rank[md] > rank[S.ch.best])) S.ch.best = md;
        if (S.ch.best === "gold" || done >= 3) chalEnd(S.ch.best);
      } else if (done >= 1) chalEnd(row.club === m.club || k !== "crisis" ? chalMedal(k, row, N, rel) : null);
    }
    return r;
  };
  var _sk = mgrSacked;
  mgrSacked = function () { if (chalOn()) chalEnd(null, "sacked"); return _sk.apply(this, arguments); };
  /* solo cantera: no hay mercado de fichajes */
  var _sl = mgrScoutList;
  mgrScoutList = function () { if (chalOn() && S.ch.k === "cant") return []; return _sl.apply(this, arguments); };
  var _sb = mgrStartBid;
  mgrStartBid = function () { if (chalOn() && S.ch.k === "cant") return false; return _sb.apply(this, arguments); };
  var _nm = newManagerCareer;
  newManagerCareer = function (o) { var r = _nm.apply(this, arguments); if (o && o.chal) chalStart(o.chal); return r; };
})();

/* ---------- rivalidades y crisis (míster) ---------- */
function rvOf() { var m = S.m; m.rv = m.rv || {}; return m.rv; }
function rvTop(n) { var rv = rvOf(); return Object.keys(rv).map(Number).filter(function (c) { return rv[c] >= 2 && W.clubs[c]; }).sort(function (a, b) { return rv[b] - rv[a]; }).slice(0, n || 3); }
function crisisOf() { return S.m.crisis || 0; }
(function () {
  if (typeof mgrFinish !== "function") return;
  var _fin = mgrFinish;
  mgrFinish = function (f) {
    var r = _fin.apply(this, arguments);
    if (S.mode !== "mgr" || !S.m || !f || f.opp == null || f.isNat) return r;
    var m = S.m, gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), rv = rvOf(), c = f.opp, h0 = rv[c] || 0;
    var derby = W.derby[m.club + "-" + c];
    var add = (derby ? 1.6 : f.imp >= 2 ? 0.9 : 0.25) + (gu < gt ? 0.8 : gu > gt ? 0.3 : 0.4) + (f.redId != null ? 0.5 : 0) + (f.fin ? 1 : 0);
    rv[c] = Math.round((h0 + add) * 10) / 10;
    if (h0 < 5 && rv[c] >= 5) { notify("🔥 " + tr("Nace una rivalidad: los partidos contra el {club} ya no son uno más.", {club: clubName(c)}), "info"); diaryAdd("rv", {c: c}); }
    if (h0 >= 5) {
      if (gu > gt) { m.fans = clamp(m.fans + 2, 0, 100); m.board = clamp(m.board + 1, 0, 100); }
      else if (gu < gt) m.fans = clamp(m.fans - 2, 0, 100);
    }
    /* récords de tu carrera */
    var R = S.m.recs = S.m.recs || {};
    if (gu - gt > (R.win ? R.win[0] - R.win[1] : 0)) R.win = [gu, gt, c, S.yr];
    R.run = gu >= gt ? (R.run || 0) + 1 : 0; R.best = Math.max(R.best || 0, R.run);
    if (f.fin || gu - gt >= 4 || (derby && gu > gt)) diaryAdd("match", {c: c, a: gu, b: gt, fin: f.fin ? 1 : 0, ck: f.ck || ""});
    return r;
  };
  var _bd = mgrBlockDone;
  mgrBlockDone = function () {
    if (S.mode === "mgr" && S.m && S.m.club >= 0) {
      var m = S.m, ss = m.ss || {}, b0 = m.crB || {w: 0, l: 0, d: 0}, w = (ss.w || 0) - b0.w, l = (ss.l || 0) - b0.l, cr = m.crisis || 0;
      if (w + l > 0) {
        if (l >= w + 3 && cr < 3) { m.crisis = cr + 1; mNews("bad", tr("La crisis se agrava: nivel {n} de 3.", {n: m.crisis})); if (m.crisis === 2) diaryAdd("crisis", {}); }
        else if (w >= l + 2 && cr > 0) { m.crisis = cr - 1; mNews("ok", m.crisis ? tr("El equipo reacciona: la crisis baja a nivel {n}.", {n: m.crisis}) : tr("Se acabó la crisis: el equipo vuelve a sonreír.")); }
      }
      if (m.crisis >= 2) { if (m.crisis >= 3) m.board = clamp(m.board - 1, 0, 100); m.sq.forEach(function (p) { p.mor = clamp(p.mor - 1, 0, 100); }); }
      m.crB = {w: ss.w || 0, l: ss.l || 0, d: ss.d || 0};
    }
    return _bd.apply(this, arguments);
  };
  var _ss = mgrStartSeason;
  mgrStartSeason = function () {
    var r = _ss.apply(this, arguments);
    if (S.m) { var rv = rvOf(); Object.keys(rv).forEach(function (c) { rv[c] = Math.round(rv[c] * 6) / 10; if (rv[c] < 0.5) delete rv[c]; }); S.m.crB = {w: 0, l: 0, d: 0}; }
    return r;
  };
})();
MEV({id: "c32_crisis", tipo: "aleatoria", cat: "Directiva", title: "Reunión de crisis", w: 2, cd: 1,
  when: function (y) { return y.inSeason && (S.m.crisis || 0) >= 2; },
  text: function () { return tr("El presidente convoca una reunión de urgencia: la crisis ya es tema nacional. Quiere saber qué vas a hacer."); },
  opts: function () { return [
    {t: tr("Charla a calzón quitado en el vestuario"), p: 0.6, ok: {txt: tr("Los jugadores se conjuran. El ambiente cambia."), fx: {sqMor: 6, chem: 4}, then: function () { S.m.crisis = Math.max(0, S.m.crisis - 1); }}, ko: {txt: tr("La charla no cala y alguno la filtra a la prensa."), fx: {sqMor: -3, board: -2}}},
    {t: tr("Cambiar el sistema de juego"), ok: {txt: tr("Pruebas algo nuevo: los primeros entrenamientos son caóticos, pero el equipo despierta."), fx: {chem: -4, sqMor: 3}, then: function () { S.m.crisis = Math.max(0, S.m.crisis - 1); }}},
    {t: tr("Pedir paciencia y dinero para fichar"), ok: {txt: tr("La directiva te da un pequeño margen, pero te lo apunta."), fx: {board: -3, bud: 1e6}}}
  ]; }});

/* ---------- diario de la carrera ---------- */
function diaryAdd(k, a) {
  if (!S) return;
  S.diary = S.diary || [];
  S.diary.push({y: S.yr, w: S.w || 0, k: k, a: a || {}});
  if (S.diary.length > 400) S.diary = S.diary.slice(-400);
}
(function () {
  if (typeof feed !== "function") return;
  var _feed = feed;
  feed = function (card) {
    var r = _feed.apply(this, arguments);
    try {
      var t = card && card.t;
      if (t === "mjob") diaryAdd("mjob", {c: card.club});
      else if (t === "msacked") diaryAdd("msacked", {c: card.club});
      else if (t === "mseasonEnd" || t === "seasonEnd") diaryAdd("season", {c: card.club, lg: card.lg, pos: card.pos});
      else if (t === "mtransfer" && (card.fee >= 1e6 || card.inn)) diaryAdd("mtx", {n: card.n, inn: card.inn ? 1 : 0, c: card.inn ? card.from : card.to, fee: card.fee || 0});
      else if (t === "transfer") diaryAdd("tx", {c: card.to, fee: card.fee || 0, loan: card.loan ? 1 : 0});
      else if (t === "awards" && card.won && card.won.length) card.won.forEach(function (a) { diaryAdd("award", {n: a.n, tk: a.tk, tp: a.tp}); });
      else if (t === "retire" || t === "mretire") diaryAdd("retire", {});
      else if ((t === "decision" || t === "moment") && card.title && (card.hot || card.tipo === "real")) diaryAdd("dec", {ti: card.title, ch: card.choice || ""});
    } catch (e) {}
    return r;
  };
  if (typeof addTrophy === "function") { var _at = addTrophy; addTrophy = function (k, name) { var r = _at.apply(this, arguments); diaryAdd("tro", {n: name}); return r; }; }
  if (typeof mgrAddTrophy === "function") { var _mt = mgrAddTrophy; mgrAddTrophy = function (k, name) { var r = _mt.apply(this, arguments); diaryAdd("tro", {n: name}); return r; }; }
  /* jugador: liga ganada y partidos señalados */
  if (typeof seasonEnd === "function") {
    var _pse = seasonEnd;
    seasonEnd = function () { var p = S.p, n0 = p ? p.trophies.length : 0, r = _pse.apply(this, arguments); if (p) p.trophies.slice(n0).forEach(function (t) { diaryAdd("tro", {n: t.n}); }); return r; };
  }
  if (typeof finishPlayer === "function") {
    var _fp = finishPlayer;
    finishPlayer = function (f) {
      var r = _fp.apply(this, arguments);
      try { var pg = (f.mg || 0) + (f.etg || 0); if (f && S.p && f.min > 0 && (pg >= 3 || f.fin)) diaryAdd("pmatch", {c: f.opp, nat: f.isNat ? 1 : 0, a: f.gu + (f.etu || 0), b: f.gt + (f.ett || 0), g: pg, fin: f.fin ? 1 : 0}); } catch (e) {}
      return r;
    };
  }
  if (typeof achCheck === "function") {
    var _ac = achCheck;
    achCheck = function () { var first = S && !S.ach, r = _ac.apply(this, arguments); if (!first) r.forEach(function (a) { diaryAdd("ach", {id: a[0]}); }); return r; };
  }
})();

/* ---------- récords de cada liga ---------- */
function recOf(li) { S.rec = S.rec || {}; return S.rec[li] || null; }
(function () {
  if (typeof seasonEndWorld !== "function") return;
  var _w = seasonEndWorld;
  seasonEndWorld = function () {
    try {
      S.rec = S.rec || {};
      W.lg.forEach(function (l, li) {
        var st = standings(li); if (!st.length || !st[0].r || !st[0].r[0]) return;
        var R = S.rec[li] = S.rec[li] || {}, y = S.yr;
        st.forEach(function (x) {
          var r = x.r;
          if (!R.pts || r[6] > R.pts[0]) R.pts = [r[6], x.c, y];
          if (!R.gf || r[4] > R.gf[0]) R.gf = [r[4], x.c, y];
          if (!R.ga || r[5] < R.ga[0]) R.ga = [r[5], x.c, y];
        });
      });
    } catch (e) {}
    return _w.apply(this, arguments);
  };
})();
