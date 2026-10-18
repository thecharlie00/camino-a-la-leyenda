/* world45.js — «Mundo vivo» (versión 4.5), motor.
   1) Play-off de ascenso: en las ligas con po: [desde, hasta], los clasificados en ese tramo juegan semifinales y final
      a partido único (en casa el mejor clasificado; la final en campo neutral). El ganador ocupa la última plaza de ascenso.
   2) Torneo de verano: en la pretemporada tu club juega un cuadrangular (semifinal y final o tercer puesto).
   3) Competiciones juveniles: el jugador de 19 años o menos juega con el juvenil cuando apenas tiene minutos;
      el míster ve a su cantera en la Copa juvenil al final de cada temporada.
   4) Día de cierre del mercado: el míster lo vive en directo (reloj de 18:00 a 24:00 con ofertas, gangas y noticias);
      el jugador puede recibir una oferta de última hora. */

/* ---------- 1. play-off de ascenso ---------- */
function poTeams(li) {
  var l = W.lg[li]; if (!l || !l.po || l.upI < 0 || !S.L || !S.L[li]) return [];
  var st = standings(li).map(function (x) { return x.c; });
  return st.slice(l.po[0] - 1, l.po[1]);
}
function poMatch(a, b, neutral) {
  var g = simGoals(S.cr[a], S.cr[b], neutral ? 0 : 1), m = {a: a, b: b, g: g, et: false, pen: null};
  if (g[0] === g[1]) {
    var e = extraTime(S.cr[a], S.cr[b]); m.et = true; g[0] += e[0]; g[1] += e[1];
    if (g[0] === g[1]) m.pen = shootout(0.75, 0.75);
  }
  m.w = m.pen ? (m.pen[0] > m.pen[1] ? a : b) : (g[0] > g[1] ? a : b);
  return m;
}
/* se juega una vez por temporada (la primera vez que hace falta: fin de temporada del jugador o del mundo) */
function poEnsure() {
  if (!S.last) return;
  if (S.last.po && S.last.poY === S.yr) return;
  S.last.po = {}; S.last.poY = S.yr;
  W.lg.forEach(function (l, li) {
    var t = poTeams(li); if (t.length < 2) return;
    var rounds = [], cur = t.slice();
    while (cur.length > 1) {
      var next = [], ms = [], fin = cur.length === 2;
      for (var i = 0; i < cur.length / 2; i++) { var m = poMatch(cur[i], cur[cur.length - 1 - i], fin); ms.push(m); next.push(m.w); }
      rounds.push(ms); cur = next;
    }
    S.last.po[li] = {w: cur[0], t: t, r: rounds};
    histPush("PO:" + l.id, S.yr, cur[0]);
  });
}
function poRun() { poEnsure(); }
/* ¿sube este club? Directo (los primeros) o por el play-off */
function lgPromoted(li, c) {
  var l = W.lg[li]; if (!l || l.upI < 0) return false;
  var up = lgUpN(li), pos = posInLeague(c);
  if (!l.po) return pos <= up;
  poEnsure();
  var po = S.last.po && S.last.po[li];
  return pos <= up - 1 || !!(po && po.w === c);
}
function poRoundName(n) { return n === 2 ? N_("Final") : n === 4 ? N_("Semifinales") : n === 8 ? N_("Cuartos") : N_("Ronda previa"); }
function poScore(m, c) {
  var us = m.a === c, gf = us ? m.g[0] : m.g[1], ga = us ? m.g[1] : m.g[0], s = gf + "-" + ga;
  if (m.pen) s += " (" + (us ? m.pen[0] : m.pen[1]) + "-" + (us ? m.pen[1] : m.pen[0]) + " " + tr("pen.") + ")";
  else if (m.et) s += " " + tr("(prór.)");
  return s;
}
/* resumen del play-off de un club: líneas por ronda y si ascendió */
function poSummary(li, c) {
  var po = S.last && S.last.po && S.last.po[li]; if (!po || po.t.indexOf(c) < 0) return null;
  var lines = [], out = null;
  po.r.forEach(function (ms) {
    ms.forEach(function (m) {
      if (m.a !== c && m.b !== c) return;
      var opp = m.a === c ? m.b : m.a;
      lines.push(tr(poRoundName(ms.length * 2)) + ": " + tr("{score} ante el {club}", {score: poScore(m, c), club: clubName(opp)}));
      if (m.w !== c && out == null) out = tr(poRoundName(ms.length * 2));
    });
  });
  return {up: po.w === c, lines: lines, out: out, pos: po.t.indexOf(c) + W.lg[li].po[0]};
}
function poCard(li, c, mgr) {
  var s = poSummary(li, c); if (!s) return null;
  var L = W.lg[li], to = lgDivRaw(L.upI);
  return {t: "decision", tipo: mgr ? "mgr" : "real", cat: tr("Play-off de ascenso"), title: tr("Play-off de ascenso a {lg}", {lg: trComp(to)}),
    choice: s.up ? tr("¡Ascenso!") : tr("Eliminados en {round}", {round: lc45(s.out || "")}), txt: s.lines.join(" · "), chips: [], good: s.up, y: S.yr};
}

/* ---------- 2. torneo de verano ---------- */
var PT_OPTS_P = [
  {t: N_("Darlo todo para ganarte un sitio"), d: N_("Más opciones de marcar y de convencer al míster, pero acabas fundido"), mod: 1.5, gr: 1.5, fx: {coach: 4, form: 3, fit: -6}},
  {t: N_("Jugar los minutos que te den"), d: N_("Sin forzar: lo normal en pretemporada"), mod: 0, gr: 1, fx: {coach: 1, form: 1}},
  {t: N_("Dosificarte para el arranque de liga"), d: N_("Llegas fresco, aunque al míster le gusta ver ambición"), mod: -1, gr: 0.5, fx: {fit: 4, coach: -2}}
];
var PT_OPTS_M = [
  {t: N_("A por el trofeo con los titulares"), d: N_("Más opciones de ganar, a costa de algo de físico"), mod: 2, fx: {sfit: -3, fans: 2}},
  {t: N_("Rotar y probar a los jóvenes"), d: N_("Menos opciones, pero el vestuario y la cantera lo agradecen"), mod: -2, fx: {chem: 2}}
];
function ptMyClub() { return S.mode === "mgr" ? (S.m && S.m.club) : (S.p && S.p.club); }
function ptSetup() {
  var me = ptMyClub(); if (me == null || me < 0) return null;
  var r = S.cr[me], ci = W.clubs[me].ci, dom = [], ext = [];
  W.clubs.forEach(function (cl, i) {
    if (i === me || S.cl[i] == null || S.cl[i] < 0) return;
    if (Math.abs(S.cr[i] - r) > 6) return;
    (cl.ci === ci ? dom : ext).push(i);
  });
  var op = [];
  if (dom.length) op.push(pick(dom));
  while (op.length < 3 && ext.length) { var c = pick(ext); if (op.indexOf(c) < 0) op.push(c); ext.splice(ext.indexOf(c), 1); }
  while (op.length < 3 && dom.length > op.length) { var d = pick(dom); if (op.indexOf(d) < 0) op.push(d); }
  if (op.length < 3) return null;
  var host = chance(0.6) ? me : op[0];
  return {club: me, op: op, host: host};
}
function ptName(x) { return tr("Trofeo de verano del {club}", {club: clubName(x.host)}); }
function ptPlay(x, mod) {
  var me = x.club, rr = function (c) { return S.cr[c] + (c === me ? mod : 0); };
  var one = function (a, b) {
    var g = simGoals(rr(a), rr(b), a === x.host ? 1 : b === x.host ? -1 : 0), pen = null;
    if (g[0] === g[1]) pen = shootout(0.75, 0.75);
    return {a: a, b: b, g: g, pen: pen, w: pen ? (pen[0] > pen[1] ? a : b) : g[0] > g[1] ? a : b};
  };
  var s1 = one(me, x.op[0]), s2 = one(x.op[1], x.op[2]);
  var l1 = s1.w === me ? x.op[0] : me, l2 = s2.w === x.op[1] ? x.op[2] : x.op[1];
  var inFinal = s1.w === me, last = inFinal ? one(me, s2.w) : one(me, l2);
  var pos = inFinal ? (last.w === me ? 1 : 2) : (last.w === me ? 3 : 4);
  return {semi: s1, last: last, fin: inFinal, pos: pos, champ: inFinal ? last.w : one(s1.w, s2.w).w, l1: l1};
}
function ptScore(m, c) {
  var us = m.a === c, s = (us ? m.g[0] : m.g[1]) + "-" + (us ? m.g[1] : m.g[0]);
  if (m.pen) s += " (" + (us ? m.pen[0] : m.pen[1]) + "-" + (us ? m.pen[1] : m.pen[0]) + " " + tr("pen.") + ")";
  return s;
}
function ptLines(x, res) {
  var me = x.club, o = [];
  o.push(tr("Semifinal") + ": " + tr("{score} ante el {club}", {score: ptScore(res.semi, me), club: clubName(res.semi.a === me ? res.semi.b : res.semi.a)}));
  o.push((res.fin ? tr("Final") : tr("Tercer puesto")) + ": " + tr("{score} ante el {club}", {score: ptScore(res.last, me), club: clubName(res.last.a === me ? res.last.b : res.last.a)}));
  return o;
}
function ptPosTxt(pos) { return [tr("¡Campeones!"), tr("Subcampeones"), tr("Tercer puesto"), tr("Cuarto puesto")][pos - 1]; }
/* minúscula dentro de una frase (en alemán los sustantivos van siempre en mayúscula) */
function lc45(x) { return LANG === "de" ? x : String(x || "").toLowerCase(); }
function ptRecord(x, res, goals) {
  var rec = {y: S.yr, n: ptName(x), host: x.host, pos: res.pos, g: goals || 0};
  if (S.mode === "mgr") (S.m.pt45 = S.m.pt45 || []).unshift(rec); else (S.p.pt45 = S.p.pt45 || []).unshift(rec);
  var L = S.mode === "mgr" ? S.m.pt45 : S.p.pt45; if (L.length > 30) L.length = 30;
}
function ptDescHead(x) {
  return {tag: "real", tagTxt: tr("Pretemporada"), cls: "", cat: tr("Torneo de verano"), title: ptName(x),
    text: tr("Cuadrangular de verano ante el {a}, el {b} y el {c}. Semifinal y final, o partido por el tercer puesto.", {a: clubName(x.op[0]), b: clubName(x.op[1]), c: clubName(x.op[2])})};
}
/* jugador */
EX_PEND.ptour = {
  desc: function (x) {
    var d = ptDescHead(x);
    d.opts = PT_OPTS_P.map(function (o) { return descOpt({t: tr(o.t), d: tr(o.d), ok: {fx: o.fx}}, function (u) { return fxPreview(u.fx, u.n); }); });
    return d;
  },
  resolve: function (x, choice) {
    var o = PT_OPTS_P[choice]; if (!o) return null;
    S.pend.shift();
    if (x.club !== S.p.club) { var n2 = ptSetup(); if (!n2) return null; x = Object.assign(x, n2); }
    var res = ptPlay(x, o.mod), p = S.p, gp = posGroup(), rate = {DEL: 0.45, MED: 0.2, DEF: 0.06, POR: 0}[gp] || 0.15;
    var goals = poisson(rate * 2 * o.gr * (0.6 + roleW()));
    var chips = applyFx(o.fx);
    if (res.pos === 1) { chips = chips.concat(applyFx({mor: 3})); }
    if (goals) { p.coach = clamp(p.coach + goals, 0, 100); chips.push(["note", 0, trn(goals, "Marcas {n} gol", "Marcas {n} goles")]); }
    ptRecord(x, res, goals);
    return {t: "decision", tipo: "real", cat: tr("Torneo de verano"), title: ptName(x), choice: tr(o.t), txt: ptPosTxt(res.pos) + " " + ptLines(x, res).join(" · "), chips: chips, good: res.pos <= 2, y: S.yr};
  }
};
function roleW() { var r = roleNow(); return {Estrella: 1, Titular: 0.85, "Rotación": 0.6, Suplente: 0.4, Promesa: 0.45, Reserva: 0.3}[r] || 0.5; }
/* míster */
MPH.mtour = {
  fixed: true,
  head: function (x) { return ptDescHead(x); },
  opts: function () { return PT_OPTS_M.map(function (o, i) { return {t: tr(o.t), d: tr(o.d), ok: {txt: "", fx: o.fx}, i: i}; }); },
  apply: function (x, o, res) {
    var opt = PT_OPTS_M[o.i], m = S.m;
    if (x.club !== m.club) { var n2 = ptSetup(); if (n2) x = Object.assign(x, n2); }
    var r = ptPlay(x, opt.mod), chips = mgrFx(opt.fx);
    if (r.pos === 1) { m.fans = clamp(m.fans + 2, 0, 100); m.chem = clamp(m.chem + 2, 0, 100); chips.push(["chem", 2]); }
    if (o.i === 1) mActive().forEach(function (p) { if (p.age <= 21) p.mor = clamp(p.mor + 4, 0, 100); });
    ptRecord(x, r, 0);
    res.txt = ptPosTxt(r.pos) + " " + ptLines(x, r).join(" · ");
    res.good = r.pos <= 2;
    return chips;
  },
  card: function (x, o, res, chips, head) { return {t: "decision", tipo: "mgr", cat: tr("Torneo de verano"), title: head.title, choice: o.t, txt: res.txt, chips: chips, good: res.good, y: S.yr}; }
};

/* ---------- 3. competiciones juveniles ---------- */
function yEligible() { var p = S.p; return S.mode !== "mgr" && p && p.club >= 0 && p.age <= 19; }
function yComps(c) {
  var out = [tr("Liga juvenil")];
  if (S.C && S.C.UCL && S.C.UCL.teams && S.C.UCL.teams.indexOf(c) >= 0) out.push(tr("Youth League"));
  return out;
}
function yBlock() {
  if (!yEligible() || !S.bst) return;
  var p = S.p, bst = S.bst;
  if (bst.min >= 420) return;            /* ya juega con el primer equipo */
  var n = ri(2, 4), gp = posGroup(), lvl = S.cr[p.club] - 12, edge = clamp(1 + (p.ovr - lvl) / 12, 0.4, 2.2);
  var rate = ({DEL: 0.55, MED: 0.25, DEF: 0.08, POR: 0}[gp] || 0.2) * edge, ga = ({DEL: 0.2, MED: 0.3, DEF: 0.12, POR: 0.02}[gp] || 0.15) * edge;
  var g = 0, a = 0, cs = 0;
  for (var i = 0; i < n; i++) { g += poisson(rate); a += poisson(ga); if (gp === "POR" && chance(0.35 * edge)) cs++; }
  var y = (p.y45 = p.y45 || {}), rec = y[S.yr] = y[S.yr] || {apps: 0, g: 0, a: 0, cs: 0, club: p.club};
  rec.apps += n; rec.g += g; rec.a += a; rec.cs += cs;
  if (p.ovr < p.pot) p.ovr = Math.min(p.pot, p.ovr + 0.06 * n);
  if (g + a >= 2 || cs >= 2) p.coach = clamp(p.coach + 1, 0, 100);
  var comps = yComps(p.club).join(" / ");
  S.bnews.push({t: "ok", x: gp === "POR" ? tr("Con el juvenil ({comp}): {n} partidos y {cs} porterías a cero.", {comp: comps, n: n, cs: cs}) : tr("Con el juvenil ({comp}): {n} partidos, {g} goles y {a} asistencias.", {comp: comps, n: n, g: g, a: a})});
}
/* fin de temporada del jugador: cómo acabó su juvenil */
function ySeasonEnd() {
  var p = S.p, rec = p && p.y45 && p.y45[S.yr]; if (!rec || !rec.apps) return null;
  var c = rec.club, li = S.cl[c], peers = li >= 0 ? teamsOfLeague(li) : [c];
  var rank = peers.filter(function (o) { return S.cr[o] + rf(-6, 6) > S.cr[c] + rf(-6, 6); }).length + 1;
  rec.pos = clamp(rank, 1, 16);
  var won = rec.pos === 1, cup = yComps(c).length > 1 && S.cr[c] + rf(-8, 8) >= 84;
  if (won) (p.yTro = p.yTro || []).push({y: S.yr, n: "Liga juvenil", club: c});
  if (cup) (p.yTro = p.yTro || []).push({y: S.yr, n: "Youth League", club: c});
  if (won || cup) { p.mor = clamp(p.mor + 4, 0, 100); p.coach = clamp(p.coach + 3, 0, 100); }
  var txt = tr("{n} partidos, {g} goles y {a} asistencias con el juvenil.", {n: rec.apps, g: rec.g, a: rec.a});
  var res = won ? tr("¡Campeones de la Liga juvenil!") : tr("{pos}.º en la Liga juvenil", {pos: rec.pos});
  if (cup) res += " · " + tr("¡Campeones de la Youth League!");
  return {t: "decision", tipo: "real", cat: tr("Juvenil"), title: tr("Temporada en el juvenil"), choice: res, txt: txt, chips: [], good: won || cup, y: S.yr};
}
/* míster: la cantera en la Copa juvenil */
var YC_STAGE = [N_("Octavos"), N_("Cuartos"), N_("Semifinales"), N_("Final"), N_("Campeones")];
function yCupMgr() {
  var m = S.m; if (!m || m.club < 0) return null;
  var c = m.club, li = S.cl[c], ci = W.clubs[c].ci;
  var str = S.cr[c] + (typeof facYouthB === "function" ? facYouthB() * 1.5 : 0) + (m.focus === "cantera" ? 3 : 0) + rf(-7, 7);
  var rivals = W.clubs.map(function (cl, i) { return i; }).filter(function (i) { return W.clubs[i].ci === ci && S.cl[i] >= 0 && i !== c; });
  var better = rivals.filter(function (i) { return S.cr[i] + rf(-7, 7) > str; }).length;
  var st = better === 0 ? 4 : better <= 1 ? 3 : better <= 3 ? 2 : better <= 7 ? 1 : 0;
  var rec = {y: S.yr, st: st, club: c};
  (m.yc45 = m.yc45 || []).unshift(rec); if (m.yc45.length > 30) m.yc45.length = 30;
  var chips = [];
  if (st === 4) { m.flags.youthBoost = true; m.board = clamp(m.board + 2, 0, 100); m.fans = clamp(m.fans + 2, 0, 100); chips.push(["board", 2], ["fans", 2]); }
  else if (st >= 3) { m.fans = clamp(m.fans + 1, 0, 100); chips.push(["fans", 1]); }
  var lab = tr(YC_STAGE[st]);
  return {t: "decision", tipo: "mgr", cat: tr("Cantera"), title: tr("Copa juvenil {season}", {season: seasonLabel(S.yr)}),
    choice: st === 4 ? tr("¡Tu juvenil gana la Copa!") : tr("Hasta {stage}", {stage: lc45(lab)}),
    txt: st === 4 ? tr("La próxima hornada de la cantera llegará con más talento.") : st >= 2 ? tr("Buen año de la cantera.") : tr("Un año discreto para el juvenil."), chips: chips, good: st >= 3, y: S.yr};
}

/* ---------- 4. día de cierre del mercado ---------- */
var DL_T0 = 18, DL_STEPS = 12;           /* de 18:00 a 24:00, en tramos de media hora */
function dlKey() { return S.yr + ":" + (S.m && S.m.mk ? S.m.mk.open : ""); }
function dlNeed() {
  var m = S.m;
  if (S.mode !== "mgr" || !m || m.club < 0 || !m.mk || !m.mk.open) return false;
  if (!((S.ph === "pre" && S.bi === 0) || (S.ph === "gap" && S.bi === 3))) return false;
  return !(m.dlDone && m.dlDone === dlKey());
}
function dlClock(t) { var mins = DL_T0 * 60 + t * 30; return ("0" + Math.floor(mins / 60) % 24).slice(-2) + ":" + ("0" + mins % 60).slice(-2); }
function dlStart() {
  var m = S.m;
  if (m.dl && m.dl.k === dlKey()) return m.dl;
  var D = {k: dlKey(), win: m.mk.open, t: 0, ev: [], log: [], deals: [], bud0: m.bud};
  /* ofertas por tus jugadores */
  var sellable = mActive().filter(function (p) { return p.age >= 18; }).sort(function (a, b) { return pValue(b) - pValue(a); });
  var nOff = clamp(ri(2, 4), 0, sellable.length);
  for (var i = 0; i < nOff; i++) {
    var p = sellable[Math.min(sellable.length - 1, Math.floor(Math.pow(R(), 1.6) * Math.min(12, sellable.length)))];
    if (!p || D.ev.some(function (e) { return e.pid === p.id; })) continue;
    var b = mgrBuyers(p, "dl" + i)[0]; if (!b) continue;
    D.ev.push({id: "o" + i, k: "off", t: ri(1, DL_STEPS - 2), pid: p.id, club: b.club, fee: Math.round(b.fee * rf(1.02, 1.35) / 1e5) * 1e5});
  }
  /* gangas: clubes que necesitan vender antes de medianoche */
  var list = mgrScoutList(5).filter(function (t) { return t.club >= 0 && t.ask > 0; }).slice(0, ri(2, 3));
  list.forEach(function (t, j) {
    t.id = "dl" + j + "_" + S.yr;
    D.ev.push({id: "g" + j, k: "bar", t: ri(2, DL_STEPS - 1), tg: t, fee: Math.max(1e5, Math.round(t.ask * rf(0.5, 0.75) / 1e5) * 1e5)});
  });
  /* noticias del resto del mercado */
  var big = W.clubs.map(function (c, i) { return i; }).filter(function (i) { return S.cl[i] >= 0 && W.lg[S.cl[i]].t === 1 && S.cr[i] >= 74; });
  var nNews = ri(6, 9);
  for (var k = 0; k < nNews && big.length > 1; k++) {
    var to = pick(big), from = pick(big); if (to === from) continue;
    var nm = mName(typeof mNat === "function" ? mNat(W.clubs[from].ci) : W.clubs[from].ci), pos = pick(["POR", "DFC", "LD", "LI", "MCD", "MC", "MCO", "ED", "EI", "DC"]);
    var fee = Math.round(rf(4, 60) * (S.cr[to] - 60) / 20) * 1e6, kind = pick(["deal", "deal", "deal", "loan", "rumor"]);
    D.ev.push({id: "n" + k, k: "news", t: ri(0, DL_STEPS), kind: kind, to: to, from: from, n: nm.fn.charAt(0) + ". " + nm.ln, pos: pos, fee: Math.max(1e6, fee)});
  }
  D.ev.sort(function (a, b) { return a.t - b.t; });
  m.dl = D;
  dlTick(0);
  return D;
}
/* eventos visibles ahora (los que ya han salido y no han caducado ni se han resuelto) */
function dlActive() {
  var D = S.m.dl; if (!D) return [];
  return D.ev.filter(function (e) { return (e.k === "off" || e.k === "bar") && e.t <= D.t && !e.done && D.t <= e.t + 3; });
}
function dlTick(step) {
  var D = S.m.dl; if (!D || D.t >= DL_STEPS) return D;
  D.t = Math.min(DL_STEPS, D.t + (step == null ? 1 : step));
  D.ev.forEach(function (e) {
    if (e.shown || e.t > D.t) return;
    e.shown = true;
    if (e.k === "news") D.log.unshift({t: e.t, x: dlNewsTxt(e)});
    else if (e.k === "off") { var p = mPl(e.pid); if (p) D.log.unshift({t: e.t, x: tr("Llega una oferta del {club} por {name}: {fee}.", {club: clubName(e.club), name: plShort(p), fee: fmtMoney(e.fee)}), hot: true}); }
    else if (e.k === "bar") D.log.unshift({t: e.t, x: tr("Tu ojeador avisa: el {club} deja salir a {name} por {fee}.", {club: clubName(e.tg.club), name: e.tg.fn.charAt(0) + ". " + e.tg.ln, fee: fmtMoney(e.fee)}), hot: true});
  });
  /* lo que caduca sin respuesta */
  D.ev.forEach(function (e) {
    if ((e.k === "off" || e.k === "bar") && e.shown && !e.done && D.t > e.t + 3) { e.done = "late"; D.log.unshift({t: D.t, x: e.k === "off" ? tr("El {club} se retira: no esperan más.", {club: clubName(e.club)}) : tr("Otro club se adelanta y se lleva a {name}.", {name: e.tg.fn.charAt(0) + ". " + e.tg.ln})}); }
  });
  return D;
}
function dlNewsTxt(e) {
  var p = {to: clubName(e.to), from: clubName(e.from), name: e.n, pos: posAb(e.pos), fee: fmtMoney(e.fee)};
  if (e.kind === "loan") return tr("Cesión de última hora: {name} ({pos}) se va del {from} al {to}.", p);
  if (e.kind === "rumor") return tr("Rumor: el {to} prepara una oferta por {name} ({pos}) del {from}.", p);
  return tr("Bombazo: el {to} ficha a {name} ({pos}) del {from} por {fee}.", p);
}
/* acciones del jugador en el directo */
function dlAct(id, yes) {
  var D = S.m.dl, m = S.m; if (!D) return {ok: false};
  var e = D.ev.filter(function (x) { return x.id === id; })[0];
  if (!e || e.done || !e.shown) return {ok: false};
  if (e.k === "off") {
    var p = mPl(e.pid);
    if (!yes || !p) { e.done = "no"; D.log.unshift({t: D.t, x: tr("Rechazas la oferta del {club}.", {club: clubName(e.club)})}); if (p && p.req) p.mor = clamp(p.mor - 8, 0, 100); return {ok: true}; }
    m.bud += e.fee;
    mgrRemovePlayer(p, tr("Vendido al {club}", {club: clubName(e.club)}), e.club, e.fee);
    e.done = "yes"; D.deals.push({inn: false, n: plName(p), club: e.club, fee: e.fee});
    D.log.unshift({t: D.t, x: tr("¡Vendido! {name} se va al {club} por {fee}.", {name: plShort(p), club: clubName(e.club), fee: fmtMoney(e.fee)}), good: true});
    return {ok: true};
  }
  if (e.k === "bar") {
    var t = e.tg;
    if (!yes) { e.done = "no"; return {ok: true}; }
    if (e.fee > m.bud) return {ok: false, why: tr("No te llega el presupuesto")};
    if (mWageBill() + t.sal > m.wcap * 1.1) return {ok: false, why: tr("Superarías el tope salarial")};
    if (mActive().length >= 30) return {ok: false, why: tr("La plantilla está llena")};
    m.bud -= e.fee;
    var np = mgrSign(t, e.fee, t.sal, null, false);
    e.done = "yes"; D.deals.push({inn: true, n: plName(np), club: t.club, fee: e.fee});
    D.log.unshift({t: D.t, x: tr("¡Fichado al límite! {name} llega del {club} por {fee}.", {name: plShort(np), club: clubName(t.club), fee: fmtMoney(e.fee)}), good: true});
    return {ok: true};
  }
  return {ok: false};
}
/* cierre: se apunta el resumen y el mercado queda listo para cerrarse al empezar el tramo */
function dlFinish(auto) {
  var m = S.m, D = m.dl || dlStart();
  if (auto) { while (D.t < DL_STEPS) dlTick(1); }
  m.dlDone = D.k;
  var x = S.pend[0]; if (x && x.k === "dlday") S.pend.shift();
  var ins = D.deals.filter(function (d) { return d.inn; }), outs = D.deals.filter(function (d) { return !d.inn; });
  var txt = D.deals.length ? D.deals.map(function (d) { return (d.inn ? "+ " : "− ") + d.n + " (" + fmtMoney(d.fee) + ")"; }).join(" · ") : tr("Ni entradas ni salidas en el último día.");
  var card = {t: "decision", tipo: "mgr", cat: D.win === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), title: tr("Día de cierre del mercado"),
    choice: auto ? tr("Dejas pasar el último día") : trn(D.deals.length, "{n} operación al límite", "{n} operaciones al límite"), txt: txt,
    chips: m.bud !== D.bud0 ? [["bud", Math.round((m.bud - D.bud0) / 1e5) * 1e5]] : [], y: S.yr};
  if (ins.length + outs.length >= 2) m.fans = clamp(m.fans + 1, 0, 100);
  feed(card);
  m.dl = null;
  return card;
}
MPH.dlday = {
  fixed: true,
  head: function () {
    var m = S.m;
    return {tag: "hot", tagTxt: tr("Día de cierre"), cls: "hotc", cat: m.mk.open === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), title: tr("Último día de mercado"),
      text: tr("A medianoche se cierra el mercado. Pueden llegar ofertas por tus jugadores y gangas de clubes con prisa por vender. Tienes {bud} de presupuesto.", {bud: fmtMoney(m.bud)})};
  },
  opts: function () { return [{t: tr("Vivirlo en directo"), ok: {txt: "", fx: {}}, i: 0}, {t: tr("Cerrar el mercado sin más"), ok: {txt: "", fx: {}}, i: 1}]; },
  /* sin interfaz (simulaciones y pruebas) el directo se resuelve solo */
  apply: function (x, o) { S.pend.unshift(x); dlFinish(true); return []; },
  card: function () { return null; }
};

/* ---------- jugador: oferta de última hora ---------- */
EX_PEND.pdl = {
  desc: function (x) {
    var o = x.o;
    return {tag: "hot", tagTxt: tr("Día de cierre"), cls: "hotc", cat: tr("Mercado"), title: tr("Una llamada a las 23:40"),
      text: tr("Quedan veinte minutos para que cierre el mercado y tu agente llama: el {club} quiere ficharte. {sal} al año durante {n} temporadas.", {club: clubName(o.club), sal: fmtMoney(o.sal || 0), n: o.yrs || 1}),
      opts: [descOpt({t: tr("Aceptar y hacer las maletas"), ok: {fx: {}}}, function () { return []; }), descOpt({t: tr("Quedarte donde estás"), ok: {fx: {}}}, function () { return []; })]};
  },
  resolve: function (x, choice) {
    S.pend.shift();
    S.p.dlDone = x.key;
    if (choice === 0 && typeof acceptOffer === "function") { acceptOffer(x.o); return {t: "decision", tipo: "real", cat: tr("Mercado"), title: tr("Fichaje de última hora"), choice: tr("Firmas por el {club}", {club: clubName(x.o.club)}), txt: tr("Todo se cierra a las 23:58."), chips: [], y: S.yr}; }
    return {t: "decision", tipo: "real", cat: tr("Mercado"), title: tr("Fichaje de última hora"), choice: tr("Te quedas en el {club}", {club: clubName(S.p.club)}), txt: tr("Cuelgas el teléfono. Se cierra el mercado."), chips: [], y: S.yr};
  }
};

/* ---------- enganches con el motor ---------- */
(function () {
  /* fin de temporada: play-off antes de las noticias de ascenso, y tarjetas de play-off y juvenil */
  if (typeof seasonEnd === "function") {
    var _se = seasonEnd;
    seasonEnd = function () {
      poEnsure();
      var c = S.p.club, li = S.cl[c], yc = ySeasonEnd();
      var r = _se.apply(this, arguments);
      var pc = poCard(li, c, false); if (pc) feed(pc);
      if (yc) feed(yc);
      return r;
    };
  }
  if (typeof mgrSeasonEnd === "function") {
    var _mse = mgrSeasonEnd;
    mgrSeasonEnd = function () {
      poEnsure();
      var m = S.m, c = m.club, li = c >= 0 ? S.cl[c] : -1, yc = c >= 0 ? yCupMgr() : null;
      var r = _mse.apply(this, arguments);
      if (c >= 0) { var pc = poCard(li, c, true); if (pc) feed(pc); }
      if (yc) feed(yc);
      return r;
    };
  }
  /* juvenil: al acabar cada tramo */
  if (typeof blockDone === "function") {
    var _bd = blockDone;
    blockDone = function () { try { yBlock(); } catch (e) {} return _bd.apply(this, arguments); };
  }
  /* torneo de verano al empezar la temporada */
  if (typeof startSeason === "function") {
    var _ss = startSeason;
    startSeason = function () {
      var r = _ss.apply(this, arguments);
      var x = ptSetup(); if (x) S.pend.push(Object.assign({k: "ptour"}, x));
      return r;
    };
  }
  if (typeof mgrStartSeason === "function") {
    var _ms = mgrStartSeason;
    mgrStartSeason = function () {
      var r = _ms.apply(this, arguments);
      var x = ptSetup(); if (x) S.pend.push(mp("mtour", x));
      return r;
    };
  }
  if (typeof mgrPendValid === "function") {
    var _pv = mgrPendValid;
    mgrPendValid = function (x) {
      if (x.k === "mtour") return S.m.club >= 0 && S.ph === "pre";
      if (x.k === "dlday") return S.m.club >= 0 && !!S.m.mk.open;
      return _pv.apply(this, arguments);
    };
  }
  /* día de cierre del míster: antes de empezar el tramo con el mercado abierto */
  if (typeof mgrAdvance === "function") {
    var _ma = mgrAdvance;
    mgrAdvance = function () {
      mgrCleanPend();
      if (!S.pend.length && dlNeed()) { S.pend.push(mp("dlday", {ui: true})); return; }
      return _ma.apply(this, arguments);
    };
  }
  /* jugador: a veces llega una oferta en el último momento */
  if (typeof advancePlayer === "function") {
    var _ap = advancePlayer;
    advancePlayer = function () {
      cleanPendPlayer();
      var p = S.p;
      if (!S.pend.length && p && p.club >= 0 && ((S.ph === "pre" && S.bi === 0) || (S.ph === "gap" && S.bi === 3))) {
        var key = S.yr + ":" + S.ph;
        if (p.dlDone !== key) {
          p.dlDone = key;
          var want = p.flags.wantOut || ["Suplente", "Reserva"].indexOf(roleNow()) >= 0;
          if (want && chance(0.45) && typeof genOffers === "function") {
            var offs = genOffers(S.ph === "pre" ? "verano" : "invierno").filter(function (o) { return o.club !== p.club; });
            if (offs.length) { S.pend.push({k: "pdl", o: offs[0], key: key}); return; }
          }
        }
      }
      return _ap.apply(this, arguments);
    };
  }
})();
