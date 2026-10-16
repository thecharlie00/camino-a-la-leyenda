/* club30.js — versión 3.0 «El club por dentro».
   - Finanzas de la temporada: taquilla, televisión, patrocinio, premios, sueldos y mantenimiento.
   - Estadio (ampliación) e instalaciones (ciudad deportiva y cantera), guardados por club.
   - Juego limpio financiero: multas si las pérdidas o los sueldos se disparan.
   - Modo presidente en «Crea tu club»: fichas a un entrenador que dirige los partidos; tú llevas el club y respondes ante la afición. */
var FIN_PRICE = [{n: N_("Populares"), k: 0.75, fill: 0.15, fans: 0.6}, {n: N_("Normales"), k: 1, fill: 0, fans: 0}, {n: N_("Caras"), k: 1.3, fill: -0.15, fans: -0.8}];
var COACH_STY = {def: {n: N_("Defensivo"), ment: 0}, equ: {n: N_("Equilibrado"), ment: 1}, ofe: {n: N_("Ofensivo"), ment: 2}};
function finOn() { return !!(S && S.mode === "mgr" && S.m && S.m.club >= 0); }
function presOn() { return !!(S && S.mode === "mgr" && S.m && S.m.owner && S.m.pres); }
/* ingresos de referencia: lo que «debería» ingresar el club en una temporada normal */
function finR0() { var m = S.m; if (m.fin && m.fin.r0) return m.fin.r0; return Math.min(m.wcap || 1e9, mWageBill()) * 1.2; }
function facOf(c) {
  var m = S.m; c = c == null ? m.club : c;
  m.facs = m.facs || {};
  if (!m.facs[c]) {
    var r = S.cr[c] || 60, li = S.cl[c], w = li != null && W.lg[li] ? W.lg[li].w : 0.5;
    m.facs[c] = {cap: Math.round(clamp(6000 + (r - 55) * 1900 * Math.sqrt(Math.max(0.3, w)), 2500, 95000) / 500) * 500, train: 2, youth: 2, work: 0, price: 1};
  }
  return m.facs[c];
}
function finNew() { var m = S.m; return {r0: Math.min(m.wcap || 1e9, mWageBill()) * 1.2, y: S.yr, gate: 0, tv: 0, spo: 0, prize: 0, sell: 0, wage: 0, staff: 0, fac: 0, buy: 0, fine: 0, home: 0, att: 0}; }
function finOf() { var m = S.m; if (!m.fin || m.fin.y !== S.yr) m.fin = finNew(); return m.fin; }
function finIn(f) { return f.gate + f.tv + f.spo + f.prize + f.sell; }
function finOut(f) { return f.wage + f.staff + f.fac + f.buy + f.fine; }
/* precio medio de la entrada: sale de lo que debería dar la taquilla */
function finTicket() { var F = facOf(), base = finR0() * 0.22 / (19 * Math.max(2500, F.cap) * 0.8); return Math.max(5, Math.round(base * FIN_PRICE[F.price].k)); }
function finFill() {
  var m = S.m, F = facOf(), r = S.cr[m.club] || 60;
  return clamp(0.5 + (m.fans - 50) / 160 + (r - 60) / 120 + FIN_PRICE[F.price].fill + (F.cap > 60000 ? -0.05 : 0), 0.25, 1);
}
/* coste de las obras y mejoras */
function facCost(k) {
  var F = facOf(), base = mBudgetFor(S.m.club);
  if (k === "cap") { var seats = facSeats(), per = Math.max(300, 400 + 60 * ((S.cr[S.m.club] || 60) - 50)); return Math.round(seats * per / 1e5) * 1e5; }
  var lv = F[k] + 1;
  return Math.max(5e4, Math.round(base * 0.012 * lv * lv / 1e4) * 1e4);
}
function facSeats() { var F = facOf(); return Math.max(1000, Math.round(F.cap * 0.15 / 500) * 500); }
function facBuild(k) {
  var m = S.m, F = facOf();
  if (k === "cap" && F.work) return {busy: true};
  if (k !== "cap" && F[k] >= 5) return {max: true};
  var cost = facCost(k);
  if (m.bud < cost) return {poor: true, cost: cost};
  m.bud -= cost; finOf().buy += cost;
  if (k === "cap") F.work = facSeats(); else F[k]++;
  return {ok: true, cost: cost};
}
function facYouthB() { return finOn() ? (facOf().youth - 2) * 1.5 : 0; }
function facTrainK() { return finOn() ? 1 + (facOf().train - 2) * 0.04 : 1; }
/* ---------- entrenador del modo presidente ---------- */
function presCoachGen(q) {
  var m = S.m, n = genName(W.lg[S.cl[m.club]] ? W.lg[S.cl[m.club]].ci : 0), r = S.cr[m.club] || 60;
  q = q || clamp(Math.round(rf(1.5, 4.6)), 1, 5);
  return {fn: n.fn, ln: n.ln, q: q, sty: pick(["def", "equ", "ofe"]), age: ri(36, 64), sal: Math.round(4e5 * Math.exp((r - 66) / 7.5) * (0.55 + q * 0.2) / 1e4) * 1e4};
}
function presCands() {
  var m = S.m;
  if (!m.pres.cands || m.pres.candY !== S.yr * 10 + S.bi) { m.pres.cands = [presCoachGen(2), presCoachGen(3), presCoachGen(ri(3, 5))]; m.pres.candY = S.yr * 10 + S.bi; }
  return m.pres.cands;
}
function presHire(i) {
  var m = S.m, c = presCands()[i]; if (!c) return {err: true};
  var sev = m.pres.coach ? Math.round(m.pres.coach.sal * 0.5 / 1e4) * 1e4 : 0;
  if (m.bud < sev) return {poor: true, cost: sev};
  m.bud -= sev; finOf().staff += sev;
  if (m.pres.coach) { m.fans = clamp(m.fans + (m.fans < 45 ? 4 : -2), 0, 100); m.sq.forEach(function (p) { p.mor = clamp(p.mor - 2, 0, 100); }); }
  m.pres.coach = c; m.pres.cands = null; m.pres.since = S.yr;
  m.ment = COACH_STY[c.sty].ment;
  return {ok: true, sev: sev};
}
function presAutoXI() {
  var m = S.m; if (!presOn()) return;
  m.xi = mBestXI(m.form); m.bench = mBestBench(m.xi);
  if (m.pres.coach) m.ment = COACH_STY[m.pres.coach.sty].ment;
}
/* ---------- ganchos en el motor ---------- */
(function () {
  if (typeof mgrFinish !== "function") return;
  var _fin = mgrFinish;
  mgrFinish = function (f) {
    var r = _fin.apply(this, arguments);
    if (finOn() && f) {
      var F = finOf(), c = compOfFixture(f), gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
      if (f.home && !f.neutral) {
        var fac = facOf(), big = f.imp >= 2 ? 0.12 : 0, fill = clamp(finFill() + big, 0.25, 1), att = Math.round(fac.cap * fill / 10) * 10;
        F.gate += att * finTicket() * (c ? 0.8 : 1); F.home++; F.att += att; f.att = att;
        S.m.fans = clamp(S.m.fans + FIN_PRICE[fac.price].fans * 0.5, 0, 100);
      }
      if (c && !c.dom && gu > gt) F.prize += finR0() * 0.006 * ((c.lvl || 3) / 6);
    }
    return r;
  };
  var _bd = mgrBlockDone;
  mgrBlockDone = function () {
    if (finOn()) {
      var F = finOf(), m = S.m, R0 = finR0(), fac = facOf();
      F.tv += R0 * 0.4 / 5;
      F.spo += R0 * 0.2 / 5 * (0.75 + m.fans / 200 + (m.rep || 40) / 400);
      F.wage += mWageBill() / 5 + (presOn() && m.pres.coach ? m.pres.coach.sal / 5 : 0);
      F.fac += R0 * 0.008 * (fac.train + fac.youth) / 5;
    }
    return _bd.apply(this, arguments);
  };
  var _se = mgrSeasonEnd;
  mgrSeasonEnd = function () {
    if (finOn()) finClose();
    return _se.apply(this, arguments);
  };
  var _ss = mgrStartSeason;
  mgrStartSeason = function () {
    var r = _ss.apply(this, arguments);
    if (finOn()) {
      var F = facOf();
      if (F.work) { F.cap += F.work; mNews("ok", tr("Terminan las obras: el estadio tiene ahora {n} asientos.", {n: fmtInt(F.cap)})); F.work = 0; }
      S.m.fin = finNew();
    }
    return r;
  };
  var _gr = mgrGrowth;
  mgrGrowth = function () {
    var k = facTrainK(), before = {};
    if (k !== 1 && S.m) S.m.sq.forEach(function (p) { before[p.id] = p.ovr; });
    var r = _gr.apply(this, arguments);
    if (k !== 1 && S.m) S.m.sq.forEach(function (p) { var o = before[p.id]; if (o != null && p.ovr > o) p.ovr = o + (p.ovr - o) * k; });
    return r;
  };
  /* traspasos: cuentan en las finanzas */
  var _sign = mgrSign;
  mgrSign = function (t, fee) { var r = _sign.apply(this, arguments); if (finOn() && fee) finOf().buy += fee; return r; };
  var _rm = mgrRemovePlayer;
  mgrRemovePlayer = function (p, why, club, fee) { var r = _rm.apply(this, arguments); if (finOn() && fee > 0) finOf().sell += fee; return r; };
  /* modo presidente: el entrenador decide alineación, planteamiento, momentos y penaltis */
  var _prep = mgrPrepFixture;
  mgrPrepFixture = function (f) {
    if (presOn()) presAutoXI();
    var r = _prep.apply(this, arguments);
    if (presOn() && S.m.pres.coach) { f.tr += (S.m.pres.coach.q - 3) * 0.8; f.ment = S.m.ment; }
    else if (presOn()) f.tr -= 2.5;
    return r;
  };
  var _lw = liveWanted;
  liveWanted = function (f) { return presOn() ? false : _lw.apply(this, arguments); };
  var _wp = mgrWantsPlan;
  mgrWantsPlan = function (f) { return presOn() ? false : _wp.apply(this, arguments); };
  var _pm = mgrPickMoment;
  mgrPickMoment = function (f) { return presOn() ? null : _pm.apply(this, arguments); };
  var _ex = mgrExtra;
  mgrExtra = function (f) { var r = _ex.apply(this, arguments); if (presOn() && f.needPens && !f.pens) { var so = shootout(0.76, 0.76); f.pens = [so[0], so[1]]; } return r; };
  if (typeof maybePress === "function") { var _mp = maybePress; maybePress = function () { if (presOn()) return; return _mp.apply(this, arguments); }; }
  /* en modo presidente no salen las decisiones propias del banquillo */
  var PRES_CAT = {"Club": 1, "Mercado": 1, "Cantera": 1, "Directiva": 1, "Afición": 1};
  var _pe = pushMgrEvents;
  pushMgrEvents = function () {
    if (!presOn()) return _pe.apply(this, arguments);
    var off = [];
    MEVENTS.forEach(function (e) { if (!PRES_CAT[e.cat] && !e.manual) { e.manual = true; off.push(e); } });
    try { return _pe.apply(this, arguments); } finally { off.forEach(function (e) { e.manual = false; }); }
  };
  var _cp = mgrCleanPend;
  mgrCleanPend = function () {
    if (presOn()) {
      S.pend = S.pend.filter(function (x) {
        if (x.k === "mfocus") { S.m.focus = pick(["fisico", "tactica", "tecnica"]); return false; }
        return ["mpnatoff", "mpnatm", "talk"].indexOf(x.k) < 0;
      });
    }
    return _cp.apply(this, arguments);
  };
})();
/* cierre de la temporada: balance, efecto en el presupuesto y juego limpio financiero */
function finClose() {
  var m = S.m, F = finOf(), R0 = finR0(), net = finIn(F) - finOut(F), news = [];
  var over = mWageBill() - m.wcap * 1.1, fine = 0;
  if (net < -R0 * 0.15) fine += Math.round(-net * 0.2 / 1e5) * 1e5;
  if (over > 0) fine += Math.round(over * 0.5 / 1e5) * 1e5;
  if (fine > 0) {
    fine = Math.min(fine, Math.max(0, m.bud));
    m.bud -= fine; F.fine += fine;
    m.board = clamp(m.board - 6, 0, 100); m.fans = clamp(m.fans - (m.owner ? 4 : 2), 0, 100);
    mNews("bad", tr("Sanción por incumplir el juego limpio financiero: multa de {v}.", {v: fmtMoney(fine)}));
  }
  var oper = F.gate + F.tv + F.spo + F.prize - F.wage - F.staff - F.fac, adj = Math.round(oper * 0.35 / 1e5) * 1e5;
  m.bud = Math.max(0, m.bud + adj);
  m.finLast = F;
  m.finH = (m.finH || []).concat([{y: S.yr, club: m.club, inc: Math.round(finIn(F)), exp: Math.round(finOut(F)), net: Math.round(finIn(F) - finOut(F)), att: F.home ? Math.round(F.att / F.home) : 0, fine: F.fine}]).slice(-12);
  if (presOn() && m.fans < 30) mNews("bad", tr("Los socios están hartos: si la afición sigue tan enfadada, el palco no aguantará otra temporada así."));
  return net;
}
function fmtInt(n) { return Math.round(n).toLocaleString(LANG === "en" ? "en-GB" : LANG); }

/* ---------- decisiones de la afición (club propio) ---------- */
MEV({id: "c3_abonos", tipo: "aleatoria", cat: "Afición", title: "Los socios piden abonos más baratos", w: 1.3, cd: 2,
  when: function (y) { return y.inSeason && S.m.owner && facOf().price >= 1 && S.m.fans < 70; },
  text: function () { return tr("La federación de peñas te entrega miles de firmas: quieren abonos más baratos para la próxima temporada. Dicen que el estadio no se llena por culpa de los precios."); },
  opts: function () { return [
    {t: tr("Bajar los precios"), d: tr("Menos taquilla por partido, más gente en la grada."), ok: {txt: tr("Las peñas lo celebran: «Por fin un palco que escucha»."), fx: {fans: 8}, then: function () { facOf().price = 0; }}},
    {t: tr("Congelar los precios"), ok: {txt: tr("Ni subida ni bajada. Las peñas lo aceptan a regañadientes."), fx: {fans: 2}}},
    {t: tr("Mantenerlos: el club necesita ingresos"), ok: {txt: tr("La grada lo encaja mal y en el siguiente partido se oyen pitos hacia el palco."), fx: {fans: -6, board: 2}}}
  ]; }});
MEV({id: "c3_pitos", tipo: "aleatoria", cat: "Afición", title: "Pitos hacia el palco", w: 1.5, cd: 1,
  when: function (y) { return y.inSeason && presOn() && S.m.fans < 48 && y.last.l >= 2; },
  text: function () { return tr("Tras otra derrota, la grada mira al palco y corea tu nombre, y no precisamente para bien. La prensa te espera a la salida."); },
  opts: function () { var co = S.m.pres.coach; return [
    {t: tr("Dar la cara ante la prensa"), p: 0.6, ok: {txt: tr("Pides paciencia y explicas el proyecto. La afición valora que no te escondas."), fx: {fans: 6}}, ko: {txt: tr("Tus palabras suenan a excusa y la grada se enfada aún más."), fx: {fans: -4}}},
    co ? {t: tr("Destituir a {name}", {name: co.fn + " " + co.ln}), d: tr("Tendrás que elegir otro entrenador e indemnizarle."), ok: {txt: tr("Destituyes al entrenador. La grada lo celebra, pero el vestuario queda tocado."), fx: {fans: 5, sqMor: -3}, then: function () { var m = S.m, sev = Math.round(m.pres.coach.sal * 0.5 / 1e4) * 1e4; m.bud = Math.max(0, m.bud - sev); finOf().staff += sev; m.pres.coach = null; m.pres.cands = null; }}} : null,
    {t: tr("Silencio"), ok: {txt: tr("No dices nada. El enfado sigue ahí."), fx: {fans: -3}}}
  ].filter(Boolean); }});
MEV({id: "c3_pena", tipo: "aleatoria", cat: "Afición", title: "Una peña pide un local en el estadio", w: 1, cd: 3,
  when: function (y) { return y.inSeason && S.m.owner; },
  text: function () { return tr("La peña más antigua del club pide un local dentro del estadio para reunirse en los días de partido. Costaría dinero adaptar el espacio."); },
  opts: function (y) { var c = mxBud(y, 0.03, 5e4); return [
    {t: tr("Concedérselo ({v})", {v: fmtMoney(c)}), ok: {txt: tr("La peña estrena local y la grada de animación crece cada semana."), fx: {fans: 7, bud: -c}}},
    {t: tr("Ofrecer un espacio fuera del estadio"), ok: {txt: tr("Aceptan, aunque esperaban más."), fx: {fans: 2}}},
    {t: tr("No hay sitio"), ok: {txt: tr("La peña se siente ninguneada."), fx: {fans: -4}}}
  ]; }});
