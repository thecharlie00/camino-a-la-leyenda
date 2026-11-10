/* ===== MOTOR · CARRERA DEL JUGADOR ===== */
var TALENT;
onLang(function () {
  TALENT = {
    promesa: {n: tr("Promesa"), ovr: 58, pot: [74, 84]},
    joya: {n: tr("Joya"), ovr: 62, pot: [82, 89]},
    elegido: {n: tr("Elegido"), ovr: 65, pot: [88, 94]},
    misterio: {n: tr("Misterio"), ovr: 0, pot: [64, 95]}
  };
});
/* perfil de atributos por posición (desvío respecto a la media) */
var ATT_OUT = ["RIT", "TIR", "PAS", "REG", "DEF", "FIS"];
var ATT_GK = ["EST", "PAR", "SAQ", "REF", "VEL", "COL"];
var ATT_NAMES;
onLang(function () {
  ATT_NAMES = {RIT: tr("Ritmo"), TIR: tr("Tiro"), PAS: tr("Pase"), REG: tr("Regate"), DEF: tr("Defensa"), FIS: tr("Físico"), EST: tr("Estirada"), PAR: tr("Paradas"), SAQ: tr("Saque"), REF: tr("Reflejos"), VEL: tr("Velocidad"), COL: tr("Colocación")};
});
var POS_PROFILE = {
  DC: [2, 6, -8, 1, -40, 2], ED: [6, -1, -3, 5, -42, -10], EI: [6, -1, -3, 5, -42, -10], MD: [5, -6, 0, 3, -25, -4], MI: [5, -6, 0, 3, -25, -4],
  MCO: [-1, 0, 3, 5, -35, -10], MC: [-6, -5, 4, 1, -6, -2], MCD: [-8, -12, 0, -5, 3, 4], DFC: [-10, -35, -14, -18, 4, 3], LD: [4, -25, -5, -4, 0, -2], LI: [4, -25, -5, -4, 0, -2],
  POR: [1, 0, -12, 2, -30, 0]
};
var GOAL_SHARE = {DC: 0.27, ED: 0.17, EI: 0.17, MCO: 0.13, MD: 0.09, MI: 0.09, MC: 0.065, MCD: 0.035, DFC: 0.04, LD: 0.025, LI: 0.025, POR: 0};
var AST_SHARE = {DC: 0.11, ED: 0.17, EI: 0.17, MCO: 0.2, MD: 0.15, MI: 0.15, MC: 0.13, MCD: 0.07, DFC: 0.035, LD: 0.1, LI: 0.1, POR: 0.008};
var FOCUS;
onLang(function () {
  FOCUS = {
    fisico: {n: tr("Físico y velocidad"), d: tr("Aguantas más y te lesionas menos."), att: ["RIT", "FIS"], gk: ["VEL", "EST"]},
    tecnica: {n: tr("Técnica"), d: tr("Más desborde y asistencias."), att: ["REG", "PAS"], gk: ["SAQ", "COL"]},
    remate: {n: tr("Definición"), d: tr("Más goles por partido."), att: ["TIR"], gk: ["REF", "PAR"]},
    defensa: {n: tr("Defensa"), d: tr("Mejor marcaje y anticipación."), att: ["DEF", "FIS"], gk: ["PAR", "COL"]},
    tactica: {n: tr("Táctica"), d: tr("Entiendes al míster: más minutos."), att: [], gk: []},
    mental: {n: tr("Mentalidad"), d: tr("Más regularidad y moral bajo presión."), att: [], gk: []}
  };
});
var LEAGUE_TROPHY_W = function (li) { var l = W.lg[li]; if (!l) return 3; if (l.gs >= 2) return 10; if (l.conf === "UEFA" && l.gs >= 1.5) return 5; return 3; };
var COMP_TROPHY_W = {UCL: 20, UEL: 7, UECL: 4, LIB: 11, SUD: 4, ACL: 5, CAF: 5, CCC: 5, CWC: 8, ICC: 3, USC: 2, REC: 2, WC: 28, EURO: 16, CA: 15, AFCON: 9, ASIAN: 9, GOLD: 6, OFCN: 3, NLF: 4, OLY: 4};

/* ---------- utilidades del jugador ---------- */
function P() { return S.p; }
function posGroup(pos) { return W.pos[pos || S.p.pos].g; }
function isGK() { return S.p.pos === "POR"; }
function pEff() {
  var p = S.p, e = p.ovr + (p.form - 50) / 16 + (p.mor - 50) / 25;
  if (p.fit < 50) e -= (50 - p.fit) / 10;
  p.buffs.forEach(function (b) { if (b.k === "ovr") e += b.v; });
  return e;
}
function attrs() {
  var p = S.p, base = POS_PROFILE[p.pos], keys = isGK() ? ATT_GK : ATT_OUT, out = {};
  keys.forEach(function (k, i) {
    var v = p.ovr + base[i] + (p.att[k] || 0) + (p.tr[k] || 0);
    out[k] = Math.round(clamp(v, 20, 99));
  });
  return out;
}
function ovrInt() { return Math.round(S.p.ovr); }
function roleFor(rel, age) {
  if (rel >= 4) return N_("Estrella");
  if (rel >= 0) return N_("Titular");
  if (rel >= -4) return N_("Rotación");
  if (rel >= -9) return N_("Suplente");
  return age <= 21 ? N_("Promesa") : N_("Reserva");
}
function lcName(s) { var t = tr(s); return LANG === "de" ? t : t.toLowerCase(); }
function roleNow() { var p = S.p; return roleFor(p.ovr - S.cr[p.club], p.age); }
function salaryFor(ovr, club) {
  var li = S.cl[club], w = li >= 0 ? W.lg[li].w : 0.5;
  return Math.round(30000 * Math.exp((ovr - 55) / 7.2) * Math.max(0.25, w) * clamp(S.cr[club] / 75, 0.7, 1.25) / 1000) * 1000;
}
function marketValue() {
  var p = S.p, a = p.age;
  var ageF = a <= 19 ? 1.15 : a <= 22 ? 1.2 : a <= 26 ? 1.1 : a <= 28 ? 1 : a <= 30 ? 0.75 : a <= 32 ? 0.45 : a <= 34 ? 0.25 : 0.1;
  var potF = a <= 23 ? 1 + Math.max(0, p.pot - p.ovr) / 40 : 1;
  var o = Math.min(p.ovr, 85), base = 1e5 * Math.exp((o - 55) / 4.6);
  if (p.ovr > 85) base *= Math.exp((p.ovr - 85) / 8);
  var v = base * ageF * potF * (1 + p.fame / 600);
  return v < 1e6 ? Math.round(v / 1e4) * 1e4 : Math.round(v / 1e5) * 1e5;
}
/* fmtMoney y fmtFol viven en i18n.js (dependen del idioma) */
function seasonLabel(y) { return y + "/" + String((y + 1) % 100).padStart(2, "0"); }
function pnat() { return S.p.inat >= 0 ? S.p.inat : S.p.nat; }

/* ---------- nueva carrera ---------- */
function newCareer(o) {
  buildWorld(o.g === "f" ? "f2" : "m"); resetCustom();
  S = {v: 1, rng: (o.seed != null ? o.seed : (Date.now() ^ Math.floor(Math.random() * 1e9))) | 0, set: {ev: o.ev != null ? o.ev : 1},
    yr: START_YEAR, tw: 0, w: 0, ph: "pre", bi: 0, pend: [], feed: [], q: {}, cur: null, blog: [], bnews: [], uid: Date.now().toString(36), g: o.g === "f" ? "f" : "m", wk: o.g === "f" ? "f2" : "m"};
  setFem(S.g === "f");
  initWorld();
  var T = TALENT[o.talent] || TALENT.promesa;
  var ovr = T.ovr || ri(55, 63);
  ovr += {16: -3, 17: -1.5, 18: 0, 19: 1.5}[o.age] || 0;
  var pot = rf(T.pot[0], T.pot[1]);
  var keys = o.pos === "POR" ? ATT_GK : ATT_OUT, att = {};
  keys.forEach(function (k) { att[k] = ri(-3, 3); });
  if (o.pos !== "POR") att[o.foot === "Zurdo" ? "REG" : "PAS"] += 1;
  S.p = {fn: o.fn, ln: o.ln, nat: W.cIdx[o.nat], nat2: o.nat2 ? W.cIdx[o.nat2] : -1, inat: -1, pos: o.pos, foot: o.foot, age: o.age,
    ovr: ovr + rf(-0.5, 0.5), pot: Math.max(pot, ovr + 6), att: att, tr: {}, form: 55, mor: 66, fit: 92, prof: 60, fame: 4, coach: 55, fans: 50,
    money: 15000, fol: 1.5, club: -1, loan: null, con: null, agent: 0, injT: 0, inj: null, susp: 0, buffs: [], flags: {}, focus: null,
    seasons: [], intl: {caps: 0, g: 0, a: 0, debut: null, tours: []}, trophies: [], awards: [], ms: [], peak: ovr, evCd: {}, objs: [], tx: [],
    ss: null, ns: null, potSeen: null, motm: 0, pom: 0};
  if (S.p.nat2 < 0 || S.p.nat2 === S.p.nat) { S.p.nat2 = -1; S.p.inat = S.p.nat; }
  S.p.potSeen = potEstimate();
  var club = o.club >= 0 ? o.club : randomStartClub(S.p.nat);
  joinClub(club, {sal: salaryFor(S.p.ovr, club) * 0.6, yrs: 3, fee: 0, first: true});
  setupRivals();
  startSeason(true);
  return S;
}
function randomStartClub(ni) {
  var code = W.ctry[ni].code, lis = W.byCountry[ni] || [], pool = [];
  lis.forEach(function (li) { teamsOfLeague(li).forEach(function (c) { pool.push(c); }); });
  if (!pool.length) {
    var conf = W.ctry[ni].conf;
    W.clubs.forEach(function (c, i) { var li = S.cl[i]; if (li >= 0 && W.lg[li].conf === conf) pool.push(i); });
    if (!pool.length) W.clubs.forEach(function (c, i) { if (S.cl[i] >= 0) pool.push(i); });
  }
  var ovr = S.p.ovr;
  var c = wpick(pool, function (i) { var d = S.cr[i] - ovr; return d > 14 ? 0.2 : d < -2 ? 0.4 : 1; });
  return c != null ? c : pool[0];
}
function potEstimate() {
  var p = S.p, err = Math.max(1, 6 - p.age / 5);
  var lo = Math.round(p.pot - rf(1, err)), hi = Math.round(p.pot + rf(1, err));
  return [Math.max(lo, Math.round(p.ovr)), Math.min(99, Math.max(hi, Math.round(p.ovr) + 1))];
}
function joinClub(c, t) {
  var p = S.p;
  p.club = c;
  p.con = {sal: Math.max(8000, Math.round(t.sal / 1000) * 1000), yrs: t.yrs, since: S.yr, fee: t.fee || 0};
  p.coach = clamp(52 + p.fame / 12, 40, 70);
  p.fans = clamp(48 + p.fame / 8, 35, 75);
  if (!t.first) p.mor = clamp(p.mor + 8, 0, 100);
}

/* ---------- rivales por los premios (ficticios) ---------- */
function rivalName(ni) {
  var nm = genName(ni);
  return nm.fn.charAt(0) + ". " + nm.ln;
}
function newRival(young) {
  var strong = W.ctry.map(function (_, i) { return i; }).filter(function (i) { return S.nr[i] >= 72; });
  var ni = wpick(strong, function (i) { return Math.pow(S.nr[i] - 66, 1.6); });
  var g = wpick(["DEL", "MED", "DEF", "POR"], function (x) { return {DEL: 42, MED: 34, DEF: 18, POR: 6}[x]; });
  var age = young ? ri(17, 20) : ri(21, 31);
  var ovr = young ? rf(74, 83) : rf(80, 91);
  var big = W.clubs.map(function (_, i) { return i; }).filter(function (i) { return S.cl[i] >= 0 && S.cr[i] >= (young ? 77 : 81); });
  return {n: rivalName(ni), ni: ni, g: g, ovr: round1(ovr), age: age, pot: round1(Math.max(ovr, young ? rf(85, 94) : ovr + rf(0, 3))), club: pick(big)};
}
function setupRivals() {
  var real = realRivals();
  if (real) { S.rv = real; return; }
  S.rv = [];
  for (var i = 0; i < 34; i++) S.rv.push(newRival(false));
  for (var j = 0; j < 12; j++) S.rv.push(newRival(true));
}
function ageRivals() {
  S.rv.forEach(function (r) {
    r.age++;
    if (r.age <= 24) r.ovr = Math.min(r.pot, r.ovr + rf(0.5, 3.5));
    else if (r.age >= 30) r.ovr -= rf(0.3, 2.6) * (r.age - 28) / 3;
    else r.ovr += rf(-1, 1);
    r.ovr = round1(clamp(r.ovr, 60, 95));
    if (chance(0.12)) { var big = W.clubs.map(function (_, i) { return i; }).filter(function (i) { return S.cl[i] >= 0 && S.cr[i] >= 80; }); r.club = pick(big); }
  });
  S.rv = S.rv.filter(function (r) { return r.age <= 35 && r.ovr >= 76; });
  while (S.rv.length < 46) S.rv.push(newRival(S.rv.filter(function (r) { return r.age <= 21; }).length < 10));
}

/* ---------- temporada ---------- */
function newSeasonStats() { return {apps: 0, st: 0, min: 0, g: 0, a: 0, cs: 0, gc: 0, rs: 0, rn: 0, yc: 0, rc: 0, motm: 0, lg: {apps: 0, g: 0, a: 0, cs: 0, gc: 0}, comp: {}, clubs: [S.p.club], tm: 0, ovr0: S.p.ovr}; }
function startSeason(first) {
  var p = S.p;
  if (!first) { S.yr++; p.age++; p.flags.gmul = 1; p.flags.wantOut = false; p.pom = 0; }
  S.w = 0; S.bi = 0;
  S.L = W.lg.map(function (l, li) { return newLeagueSeason(li); });
  setupSeasonComps();
  p.ss = newSeasonStats();
  p.ns = {apps: 0, g: 0, a: 0};
  p.potSeen = potEstimate();
  S.ph = "pre";
  S.pend = [];
  if (first) S.pend.push({k: "ev", id: "agente"});
  if (!first) {
    var offers = genOffers("verano");
    if (offers.length) S.pend.push({k: "offers", list: offers, kind: N_("verano"), forced: p.con.yrs <= 0 && !p.loan});
    if (p.con.yrs === 1 && !p.loan) S.pend.push({k: "ev", id: "renovacion"});
  }
  S.pend.push({k: "focus"});
  if (!first) pushRandomEvents("verano", 1);
  setObjectives();
  feed({t: "season", y: S.yr, club: p.club, lg: S.cl[p.club], role: roleNow(), ovr: ovrInt(), age: p.age});
}
function setObjectives() {
  var p = S.p, role = roleNow(), g = posGroup(), li = S.cl[p.club], objs = [];
  var appsT = {Estrella: 34, Titular: 28, "Rotación": 20, Suplente: 12, Promesa: 8, Reserva: 6}[role];
  objs.push(objT({k: "apps", v: appsT}, N_("Jugar {n} partidos"), {n: appsT}));
  var tier = {Estrella: 0, Titular: 1, "Rotación": 2, Suplente: 3, Promesa: 4, Reserva: 4}[role];
  if (g === "DEL") { var gv = [22, 14, 8, 4, 2][tier]; objs.push(objT({k: "g", v: gv}, N_("Marcar {n} goles"), {n: gv})); }
  else if (g === "MED") { var mv = [18, 12, 7, 3, 2][tier]; objs.push(objT({k: "ga", v: mv}, N_("Sumar {n} goles + asistencias"), {n: mv})); }
  else if (g === "DEF") { objs.push(objT({k: "rt", v: 6.9}, N_("Nota media de {rating} o más"), {rating: 6.9})); }
  else { var cv = [16, 12, 8, 3, 1][tier]; objs.push(objT({k: "cs", v: cv}, cv === 1 ? N_("{n} portería a cero") : N_("{n} porterías a cero"), {n: cv})); }
  if (li >= 0) {
    var L = S.L[li], exp = L.exp.indexOf(p.club) + 1, n = L.tm.length, t, tk, tp = null;
    if (exp <= 1) { t = 1; tk = N_("Ganar la liga"); }
    else if (exp <= 4) { t = Math.min(4, exp + 1); tk = N_("Terminar entre los {n} primeros"); tp = {n: t}; }
    else if (exp <= n / 2) { t = Math.round(n / 2) - 1; tk = N_("Terminar entre los {n} primeros"); tp = {n: t}; }
    else if (W.lg[li].downI >= 0 || W.lg[li].rel) { t = n - (W.lg[li].rel || 3); tk = N_("Evitar el descenso"); }
    else { t = n - 2; tk = N_("No acabar en los dos últimos puestos"); }
    if (W.lg[li].upI >= 0 && exp <= 4) { t = lgUpN(li) || 3; tk = N_("Ascender (top {n})"); tp = {n: t}; }
    objs.push(objT({k: "pos", v: t}, tk, tp));
  }
  p.objs = objs;
  queueObjChoice();
}
function objProgress(o) {
  var p = S.p, ss = p.ss;
  if (o.k === "apps") return [ss.apps, o.v];
  if (o.k === "g") return [ss.g, o.v];
  if (o.k === "ga") return [ss.g + ss.a, o.v];
  if (o.k === "cs") return [ss.cs, o.v];
  if (o.k === "rt") return [ss.rn ? round1(ss.rs / ss.rn) : 0, o.v];
  if (o.k === "pos") return [posInLeague(p.club), o.v];
  return [0, 0];
}
function objMet(o) { var pr = objProgress(o); return o.k === "pos" ? (pr[0] > 0 && pr[0] <= pr[1]) : pr[0] >= pr[1]; }

/* ---------- bloques de partidos ---------- */
function startBlock() {
  var b = BLOCKS[S.bi];
  S.cur = {w: b[0], end: b[1], prep: false, pm: [], pi: 0, called: false, summer: false};
  S.blog = []; S.bnews = []; S.momN = 0;
  S.bst = {apps: 0, min: 0, rs: 0, rn: 0, lgApps: 0, lgRs: 0, tm: 0, ovr0: S.p.ovr};
  S.ph = "blk";
  S.p.flags.recentRed = false;
  return continueRun();
}
function continueRun() {
  var r = runWeeks();
  if (r === "done") { if (S.cur && S.cur.summer) summerDone(); else blockDone(); }
  return r;
}
function runWeeks() {
  var cur = S.cur;
  while (cur.w <= cur.end) {
    if (!cur.prep) { prepWeek(cur.w); cur.prep = true; cur.pi = 0; }
    while (cur.pi < cur.pm.length) {
      var r = playPlayerFixture(cur.pm[cur.pi]);
      if (r === "pause") return "pause";
      cur.pi++;
    }
    endWeek();
    cur.w++; cur.prep = false; cur.pm = [];
  }
  return "done";
}
function isMineFixture(f, called) {
  var p = S.p, c = compOfFixture(f);
  if ((c && c.nat) || f.kind === "nq") {
    if (p.inat < 0) return false;
    if (!(f.h === p.inat || f.a === p.inat)) return false;
    return S.cur.summer ? !!(S.sq && S.sq[f.ck]) : called;
  }
  if (S.cur.summer && S.sq && S.sq.any) return false;
  return f.h === p.club || f.a === p.club;
}
function prepWeek(w) {
  S.w = w; S.tw++;
  var fx = weekFixtures(w), intl = INTL_W.indexOf(w) >= 0, called = false;
  if (intl) { fx = fx.concat(natWindowFixtures(w)); called = callUp(); S.cur.called = called; }
  var mine = [];
  fx.forEach(function (f) {
    if (isMineFixture(f, called)) mine.push(f);
    else {
      var res = simFixture(f);
      recordFixture(f, res);
      var c = compOfFixture(f);
      if (((c && c.nat) || f.kind === "nq") && (f.h === pnat() || f.a === pnat())) natNotCalledLog(f, res);
    }
  });
  mine.sort(function (a, b) { return (a.kind === "lg" ? 0 : 1) - (b.kind === "lg" ? 0 : 1); });
  S.cur.pm = mine;
  if (intl && called) S.bst.called = (S.bst.called || 0) + 1;
}
function endWeek() {
  var p = S.p;
  var rec = 9 + (p.flags.physio ? 3 : 0) + (p.prof > 75 ? 1 : 0) + (p.age <= 23 ? 1 : 0) - (p.age >= 32 ? 1 : 0);
  p.fit = clamp(p.fit + rec, 0, 100);
  if (p.inj && p.injT <= S.tw) {
    S.bnews.push({t: "ok", x: tr("Recibes el alta médica tras {inj}.", {inj: lcName(p.inj.n)})});
    /* 4.7: tras una baja larga vuelves con hambre (la lesión también deja algo) */
    if (p.inj.w >= 4) { var hb = Math.min(10, 2 + p.inj.w / 2); p.mor = clamp(p.mor + hb, 0, 100); p.form = clamp(p.form + hb, 0, 100); p.prof = clamp(p.prof + 2, 0, 100);
      S.bnews.push({t: "star", x: tr("Vuelves con hambre: +{n} de moral y de forma, y la recuperación te ha hecho más profesional.", {n: Math.round(hb)})}); }
    p.inj = null;
  }
  p.mor = p.mor + (60 - p.mor) * 0.035;
}

/* ---------- selección nacional en ventanas FIFA ---------- */
function natWindowFixtures(w) {
  var pn = pnat(), out = [];
  var inNL = (S.C.NL && S.C.NL.teams.indexOf(pn) >= 0) || (S.C.NLB && S.C.NLB.teams.indexOf(pn) >= 0);
  if (inNL && (w === 5 || w === 10 || w === 15)) return out;
  var nt = nextTournamentFor(pn, S.yr + 1);
  var qual = nt && (nt.y - (S.yr + 1)) <= 1 && !isHost(nt.T, nt.y, pn);
  var label = qual ? (nt.T.k === "WC" ? tr("Clasificación Mundial {year}", {year: nt.y}) : tr("Clasificación {comp} {year}", {comp: trComp(nt.T.n), year: nt.y})) : tr("Amistoso internacional");
  var conf = W.ctry[pn].conf;
  var pool = (qual ? natsOfConf(conf) : range(W.ctry.length)).filter(function (n) { return natLive(n) && n !== pn && W.ctry[n].code !== "RU" && Math.abs(S.nr[n] - S.nr[pn]) < (qual ? 14 : 9); });
  if (pool.length < 2) pool = natsOfConf(conf).filter(function (n) { return n !== pn; });
  if (!S.C.NQ) S.C.NQ = {k: "NQ", typ: "nq", nat: true, n: N_("Partidos de selección"), s: N_("Selección"), lvl: 1, done: false, win: -1};
  var o1 = pick(pool), rest = pool.filter(function (x) { return x !== o1; }), o2 = rest.length ? pick(rest) : o1;
  [o1, o2].forEach(function (o, i) {
    var home = i === 0 ? chance(0.5) : !out[0].hh;
    out.push({ck: "NQ", kind: "nq", nat: true, h: home ? pn : o, a: home ? o : pn, hh: home, lab: label, qk: qual ? nt.T.k + nt.y : null, neutral: false});
  });
  return out;
}
function callUp() {
  var p = S.p, ni = pnat();
  if (p.age < 17 || p.injT > S.tw) return false;
  if (p.flags.natBreak && S.yr < p.flags.natBreak) return false;
  var thr = S.nr[ni] - 6.5 - p.fame / 40 + gauss() * 1.2;
  var eff = p.ovr + (p.form - 50) / 15;
  if (p.inat < 0) {
    var t2 = S.nr[p.nat2] - 6.5 - p.fame / 40;
    if (eff >= Math.min(thr, t2) && !p.flags.nat2Asked) { p.flags.nat2Asked = true; S.pend.push({k: "ev", id: "doble_nacionalidad"}); }
    return false;
  }
  return eff >= thr;
}
function natNotCalledLog(f, res) {
  var pn = pnat(), home = f.h === pn, gu = home ? res.gh : res.ga, gt = home ? res.ga : res.gh;
  S.blog.push({c: logLabel(f), r: roundLabel(f), o: home ? f.a : f.h, nat: 1, h: home ? 1 : 0, gu: gu + (home ? res.eh || 0 : res.ea || 0), gt: gt + (home ? res.ea || 0 : res.eh || 0), ro: "nc", w: S.w});
  if (f.kind === "nq") qualRecord(f, res);
}
function qualRecord(f, res) {
  if (!f.qk) return;
  var pn = pnat(), q = S.q[f.qk] = S.q[f.qk] || {pts: 0, gp: 0, gf: 0, ga: 0};
  var gu = f.h === pn ? res.gh : res.ga, gt = f.h === pn ? res.ga : res.gh;
  q.gp++; q.gf += gu; q.ga += gt; q.pts += gu > gt ? 3 : gu === gt ? 1 : 0;
}

/* ---------- partidos del jugador ---------- */
function compShort(f) {
  if (f.kind === "lg") return lgName(+f.ck.slice(2));
  var c = S.C[f.ck];
  return c ? trComp(c.s || c.n) : "";
}
function logLabel(f) {
  if (f.kind === "lg") return tr("Liga");
  if (f.kind === "nq") return f.qk ? tr("Clasif.") : tr("Amistoso");
  var c = S.C[f.ck];
  return c ? trComp(c.s || c.n) : "";
}
function roundLabel(f) {
  if (f.kind === "lg") return tr("J{n}", {n: f.md + 1});
  if (f.kind === "nq") return "";
  var c = S.C[f.ck];
  if (f.kind === "tb") return c.typ === "grp" ? (c.sub ? tr(c.sub) : tr("Grupo {g}", {g: String.fromCharCode(65 + f.gi)})) : tr("J{n}", {n: f.md + 1});
  if (f.legs > 1) return f.leg === 0 ? tr("{round} (ida)", {round: tr(f.rn)}) : tr("{round} (vuelta)", {round: tr(f.rn)});
  return tr(f.rn);
}
function importance(f, c, us, opp) {
  if (f.kind === "lg") {
    var imp = W.derby[us + "-" + opp] ? 1 : 0;
    if (S.cr[opp] >= S.cr[us] + 1 && S.cr[us] >= 78) imp = 1;
    return imp;
  }
  if (f.kind === "nq") return f.qk ? 1 : 0;
  if (f.kind === "tb") return c.nat && c.tk ? 2 : 1;
  if (f.fin) return 3;
  if (/Semifinal|Cuartos/.test(f.rn)) return 2;
  return c.lvl >= 6 || c.nat ? 2 : 1;
}
function prePlayer(f) {
  var p = S.p, c = compOfFixture(f), nat = (c && c.nat) || f.kind === "nq";
  var us = nat ? p.inat : p.club, home = f.h === us, opp = home ? f.a : f.h;
  var tr = nat ? S.nr[us] : S.cr[us], or = nat ? S.nr[opp] : S.cr[opp];
  f.us = us; f.opp = opp; f.home = home; f.isNat = nat; f.or = or;
  f.imp = importance(f, c, us, opp);
  var role;
  if (p.injT > S.tw) role = "inj";
  else if (!nat && p.susp > 0) { role = "susp"; p.susp--; }
  else role = selection(f, c, tr, or, nat);
  var min = role === "start" ? (chance(0.7) ? 90 : ri(58, 85)) : role === "sub" ? ri(8, 35) : 0;
  var eff = pEff();
  var trE = tr + (min > 0 ? clamp((eff - tr) * 0.2 * min / 90, -2, 4) : (role === "inj" && eff > tr + 3 ? -1 : 0));
  var g = simGoals(trE, or, f.neutral ? 0 : home ? 1 : -1);
  f.role = role; f.min = min; f.tr = trE; f.tr0 = tr; f.gu = g[0]; f.gt = g[1]; f.mg = 0; f.ma = 0; f.mr = 0;
  f.gmu = range(g[0]).map(function () { return ri(1, 90); }).sort(function (a, b) { return a - b; });
  f.gmt = range(g[1]).map(function () { return ri(1, 90); }).sort(function (a, b) { return a - b; });
}
function selection(f, c, tr, or, nat) {
  var p = S.p, eff = pEff(), rel = eff - tr;
  var x = (rel + 1.5) / 2.2 + (p.coach - 50) / 25;
  if (p.flags.focus === "tactica") x += 0.25;
  if (p.fit < 60) x -= 0.6;
  if (p.fit < 45) x -= 1.2;
  if (!nat && c && c.dom && or < tr - 6) x += 1.1;
  if (f.imp >= 2) x += rel / 4;
  if (p.flags.frozen && !nat) x -= 2;
  if (chance(sigmoid(x))) return "start";
  var pSub = clamp(0.2 + sigmoid(x + 1.6) * 0.6, 0.1, 0.85);
  return chance(pSub) ? "sub" : "bench";
}
function playPlayerFixture(f) {
  if (f.st == null) {
    prePlayer(f); f.st = 1;
    if (f.min > 0) {
      var m = pickMoment(f);
      if (m) {
        S.momN = (S.momN || 0) + 1;
        f.mom = m;
        S.pend.push({k: "moment", id: m.id, min: m.min, fi: S.cur.pi});
        return "pause";
      }
    }
  }
  if (f.st === 1) {
    computeExtra(f); f.st = 2;
    if (f.needPens && f.onEnd && !f.pens) { S.pend.push({k: "so", fi: S.cur.pi}); f.st = 3; return "pause"; }
  }
  if (f.st === 2 || f.st === 3) {
    if (f.needPens && !f.pens) { var so = shootout(0.76, 0.76); f.pens = [so[0], so[1]]; }
    finishPlayer(f); f.st = 4;
  }
  return "ok";
}
function pickMoment(f) {
  var lim = [1, 2, 2][S.set.ev] + (S.cur.summer ? 1 : 0);
  if ((S.momN || 0) >= lim) return null;
  var pr = [0.025, 0.06, 0.16, 0.45][f.imp] * [0.7, 1, 1.25][S.set.ev];
  if (!chance(pr)) return null;
  var pool = MOMENTS.filter(function (m) { try { return m.when(f); } catch (e) { return false; } });
  var m = wpick(pool, function (m) { return m.w || 1; });
  if (!m) return null;
  var min = m.minR ? ri(m.minR[0], m.minR[1]) : f.imp >= 3 ? ri(62, 89) : ri(18, 88);
  if (f.role === "sub" && !m.minR) min = Math.max(min, 90 - f.min + ri(2, Math.max(3, f.min - 2)));
  min = Math.min(min, 90);
  return {id: m.id, min: min, ml: min >= 90 && m.minR ? "90+" + ri(2, 4) : null};
}
function scoreAt(f, min) {
  var a = (f.gmu || []).filter(function (x) { return x < min; }).length, b = (f.gmt || []).filter(function (x) { return x < min; }).length;
  return [a, b];
}
function applyMomentResult(f, out) {
  if (out.goal === "me") { f.gu++; f.mg++; f.gmu.push(f.mom.min); }
  if (out.goal === "assist") { f.gu++; f.ma++; f.gmu.push(f.mom.min); }
  if (out.goal === "team") { f.gu++; f.gmu.push(f.mom.min); }
  if (out.concede) { f.gt += out.concede; f.gmt.push(f.mom.min); }
  if (out.save && f.gt > 0 && chance(0.5)) { f.gt--; f.gmt.pop(); }
  f.mr += out.rating || 0;
  if (out.red) {
    f.red = true; f.min = Math.min(f.min, f.mom.min); S.p.susp += 1; S.p.flags.recentRed = true;
    if (f.isNat && f.imp >= 1) S.p.flags.natVillain = S.yr;
  }
  if (out.yellow) f.yc = true;
  if (out.inj) f.minj = out.inj;
  if (out.fx) return applyFx(out.fx);
  return [];
}
function computeExtra(f) {
  f.etu = 0; f.ett = 0; f.needPens = false;
  f.onEnd = f.role === "sub" || (f.role === "start" && f.min >= 90 && !f.red);
  if (f.kind !== "ko" || f.leg !== f.legs - 1) return;
  var ag = aggBefore(f), us = f.home ? ag[0] : ag[1], them = f.home ? ag[1] : ag[0];
  if (us + f.gu !== them + f.gt) return;
  var e = extraTime(f.tr, f.or);
  f.etu = e[0]; f.ett = e[1]; f.et = true;
  if (f.onEnd && f.role === "start") f.min += 30;
  if (f.onEnd && f.etu > 0 && chance(GOAL_SHARE[S.p.pos] * 0.9)) f.etg = 1;
  if (e[0] === e[1]) f.needPens = true;
}
function finishPlayer(f) {
  var p = S.p, c = compOfFixture(f), g = posGroup();
  var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
  var pg = 0, pa = 0, rating = null, cs = false;
  if (f.min > 0) {
    var frac = Math.min(1, f.min / 90), eff = pEff(), at = attrs();
    var q = clamp(1 + (eff - f.tr) * 0.025, 0.5, 1.45);
    var gS = GOAL_SHARE[p.pos] * q * (isGK() ? 0 : 1 + ((at.TIR || p.ovr) - p.ovr) / 80) + (p.flags.pens && !isGK() ? 0.035 : 0);
    var aS = AST_SHARE[p.pos] * q * (1 + ((at.PAS || p.ovr) - p.ovr) / 80);
    gS = clamp(gS, 0, 0.5); aS = clamp(aS, 0, 0.42);
    pg = f.mg + (f.etg || 0); pa = f.ma;
    var others = Math.max(0, f.gu - f.mg - f.ma);
    for (var i = 0; i < others; i++) {
      var x = R();
      if (x < gS * frac) pg++;
      else if (x < (gS + aS * 0.78) * frac) pa++;
    }
    var res = gu > gt ? 1 : gu === gt ? 0 : -1;
    var r = 6.45 + clamp((eff - f.tr0) * 0.05, -0.6, 0.6) + clamp((eff - f.or) * 0.015, -0.4, 0.4) + clamp((eff - 75) * 0.015, -0.3, 0.3)
      + gauss() * 0.5 + pg * 0.9 + pa * 0.5 + res * 0.25 + f.mr;
    if (g === "DEF" || g === "POR") {
      if (gt === 0 && f.min >= 60) { r += g === "POR" ? 0.6 : 0.4; cs = true; }
      r -= gt * (g === "POR" ? 0.22 : 0.12);
    }
    if (g === "POR") r += clamp((f.or - f.tr) * 0.03, 0, 0.5) + gauss() * 0.15;
    if (p.flags.focus === "mental") r += 0.08;
    if (f.role === "sub") r = 6.3 + (r - 6.3) * 0.55;
    rating = clamp(round1(r), 3.5, 10);
    // tarjetas, cansancio y lesiones
    var yc = f.yc || chance(({DFC: 0.17, MCD: 0.17, LD: 0.12, LI: 0.12, MC: 0.12}[p.pos] || 0.07) * frac);
    if (!f.red && chance(0.01 * frac * (typeof eraFactor === "function" ? eraFactor("red") : 1))) { f.red = true; p.susp += 1; p.flags.recentRed = true; if (f.isNat && f.imp >= 2) p.flags.natVillain = S.yr; }
    p.fit = clamp(p.fit - frac * 7 - (f.isNat ? 1.5 : 0), 5, 100);
    var risk = 0.0085 * frac * (1 + Math.max(0, 60 - p.fit) / 30) * (1.25 - p.prof / 200) * (p.flags.injMul || 1);
    if (f.minj || chance(risk)) injure(f.minj);
    p.form = clamp(50 + (p.form - 50) * 0.75 + (rating - 6.6) * 6, 0, 100);
    p.mor = clamp(p.mor + (f.role === "start" ? 0.3 : 0.05) + res * (res > 0 ? 0.35 : 0.5), 0, 100);
    if (rating >= 8.5) { p.motm++; }
    // estadísticas
    var ss = f.isNat ? null : p.ss;
    if (ss) {
      ss.apps++; if (f.role === "start") ss.st++; ss.min += f.min; ss.g += pg; ss.a += pa; ss.rs += rating; ss.rn++;
      if (cs) ss.cs++; if (yc) ss.yc++; if (f.red) ss.rc++; if (rating >= 8.5) ss.motm++;
      /* porteros: goles encajados mientras está en el campo */
      var gcN = g === "POR" ? (f.min >= 60 ? gt : Math.round(gt * frac)) : 0;
      ss.gc = (ss.gc || 0) + gcN;
      if (f.kind === "lg") { ss.lg.cs = (ss.lg.cs || 0) + (cs ? 1 : 0); ss.lg.gc = (ss.lg.gc || 0) + gcN; }
      var key = f.kind === "lg" ? "Liga" : (c.s || c.n);
      var cc = ss.comp[key] = ss.comp[key] || {apps: 0, g: 0, a: 0};
      cc.apps++; cc.g += pg; cc.a += pa;
      if (f.kind === "lg") { ss.lg.apps++; ss.lg.g += pg; ss.lg.a += pa; }
      S.bst.apps++; S.bst.min += f.min; S.bst.rs += rating; S.bst.rn++;
      if (f.kind === "lg") { S.bst.lgApps++; S.bst.lgRs += rating; }
      if (ss.g === pg && pg > 0 && !p.flags.firstGoal) { p.flags.firstGoal = true; milestone(tr("Primer gol como profesional")); S.bnews.push({t: "star", x: tr("¡Primer gol como profesional ante el {club}!", {club: clubName(f.opp)})}); }
    } else {
      if (S.tour && g === "POR") { S.tour.gc = (S.tour.gc || 0) + gt; if (cs) S.tour.cs = (S.tour.cs || 0) + 1; }
      p.intl.caps++; p.intl.g += pg; p.intl.a += pa; p.ns.apps++; p.ns.g += pg; p.ns.a += pa;
      if (!p.intl.debut) { p.intl.debut = S.yr; milestone(tr("Debut con {nat}", {nat: natName(p.inat)})); S.bnews.push({t: "star", x: tr("Debut con la selección de {nat} ante {opp}.", {nat: natName(p.inat), opp: natName(f.opp)})}); }
      if (S.tour && f.ck === S.tour.k) { var tt = S.tour; tt.apps++; tt.g += pg; tt.a += pa; tt.rs += rating; }
      if (pg > 0 && !p.flags.firstIntlGoal) { p.flags.firstIntlGoal = true; milestone(tr("Primer gol con la selección")); }
    }
    if (!p.flags.debut && !f.isNat) { p.flags.debut = true; milestone(tr("Debut con el {club}", {club: clubName(p.club)})); }
  } else {
    p.form = 50 + (p.form - 50) * 0.92 - (f.role === "bench" ? 0.8 : 0);
    if (f.role === "bench") {
      var r0 = roleNow();
      p.mor = clamp(p.mor - (r0 === "Estrella" || r0 === "Titular" ? 1.8 : 0.8), 0, 100);
    }
    var res2 = gu > gt ? 1 : gu === gt ? 0 : -1;
    p.mor = clamp(p.mor + res2 * 0.3, 0, 100);
  }
  if (!f.isNat) { p.ss.tm++; S.bst.tm++; }
  // registrar en la competición
  var res3 = f.home ? {gh: f.gu, ga: f.gt, eh: f.etu, ea: f.ett} : {gh: f.gt, ga: f.gu, eh: f.ett, ea: f.etu};
  if (f.et) res3.et = true;
  if (f.pens) { if (f.home) { res3.ph = f.pens[0]; res3.pa = f.pens[1]; } else { res3.ph = f.pens[1]; res3.pa = f.pens[0]; } }
  if (f.kind === "nq") qualRecord(f, res3);
  else recordFixture(f, res3);
  S.blog.push({c: logLabel(f), r: roundLabel(f), o: f.opp, nat: f.isNat ? 1 : 0, h: f.home ? 1 : 0, gu: gu, gt: gt, p: f.pens || null, et: f.et ? 1 : 0,
    rt: rating, g: pg, a: pa, m: f.min, ro: f.role, x: f.imp, w: S.w, mom: f.mom ? 1 : 0, red: f.red ? 1 : 0});
  koNews(f, c);
}
function injure(forced) {
  var p = S.p, x = R(), w, n;
  if (forced) { w = forced; n = forced >= 10 ? N_("Lesión de rodilla") : N_("Golpe fuerte"); }
  else if (x < 0.62) { w = ri(1, 3); n = pick([N_("Sobrecarga muscular"), N_("Esguince de tobillo"), N_("Contusión en el muslo"), N_("Molestias en el aductor")]); }
  else if (x < 0.9) { w = ri(4, 8); n = pick([N_("Rotura fibrilar"), N_("Lesión en el isquiotibial"), N_("Esguince de rodilla")]); }
  else if (x < 0.985) { w = ri(10, 18); n = pick([N_("Fractura de peroné"), N_("Lesión de menisco"), N_("Rotura muscular grave")]); }
  else { w = ri(28, 36); n = N_("Rotura del ligamento cruzado"); }
  p.injT = Math.max(p.injT, S.tw) + w;
  p.inj = {n: n, w: w};
  S.bnews.push({t: "bad", x: trn(w, "Lesión: {inj} ({n} semana de baja).", "Lesión: {inj} ({n} semanas de baja).", {inj: lcName(n)})});
  if (w >= 10 && !p.flags.surgeryAsked) { p.flags.surgeryAsked = true; S.pend.push({k: "ev", id: "lesion_grave"}); }
  p.mor = clamp(p.mor - Math.min(15, w), 0, 100);
}
function koNews(f, c) {
  if (!c || f.kind !== "ko" || f.leg !== f.legs - 1) return;
  var t = c.ko.r[f.ri].ties[f.ti];
  if (t.w < 0) return;
  var won = t.w === f.us, name = c.n, comp = trComp(name);
  if (f.fin) {
    if (won) {
      addTrophy(c.k, name, f.isNat);
      S.bnews.push({t: "trophy", x: f.pens ? tr("¡CAMPEONES! {comp} en los penaltis.", {comp: comp}) : tr("¡CAMPEONES! {comp}.", {comp: comp})});
    } else S.bnews.push({t: "bad", x: tr("Final perdida: {comp}.", {comp: comp})});
  } else if (won) {
    var nx = c.ko.r[f.ri + 1];
    if (nx) S.bnews.push({t: "ok", x: tr("{comp}: pasáis a {round}.", {comp: comp, round: lcName(nx.n)})});
  } else S.bnews.push({t: "bad", x: tr("{comp}: eliminados en {round}.", {comp: comp, round: lcName(f.rn)})});
}
function addTrophy(k, name, nat) {
  var p = S.p, c = S.C[k];
  var base = k.split(":")[0];
  var wgt = COMP_TROPHY_W[c && c.tk ? c.tk : base] || (base === "CUP" ? 3 : base === "SC" ? 1 : 2);
  p.trophies.push({k: c && c.tk ? c.tk : k, n: name, y: S.yr + (S.cur && S.cur.summer ? 1 : 0), team: nat ? -1 : p.club, nat: nat ? p.inat : -1, w: wgt, s: seasonLabel(S.yr)});
  p.mor = clamp(p.mor + 10, 0, 100); p.fame = clamp(p.fame + Math.min(8, wgt / 2), 0, 100); p.fans = clamp(p.fans + 6, 0, 100);
}
function milestone(t) { S.p.ms.push({y: S.yr, t: t}); }

/* ---------- final de bloque ---------- */
function blockDone() {
  var p = S.p, b = BLOCKS[S.bi], bst = S.bst;
  growthTick();
  p.buffs.forEach(function (x) { x.b--; }); p.buffs = p.buffs.filter(function (x) { return x.b > 0; });
  var salary = (p.con ? p.con.sal : 0) / 5 * (1 - [0, 0.05, 0.1][p.agent]);
  p.money += salary;
  if (p.flags.chef) p.money -= 12000;
  if (p.flags.physio) p.money -= 15000;
  if (bst.lgApps >= 3 && bst.lgRs / bst.lgApps >= 7.6 && chance(0.55)) {
    p.pom++; p.fame = clamp(p.fame + 2, 0, 100); p.mor = clamp(p.mor + 5, 0, 100);
    p.awards.push(awd("pom", "Jugador del mes ({lg})", {lg: W.lg[S.cl[p.club]].n}, S.yr));
    S.bnews.push({t: "star", x: tr("Jugador del mes en {lg}.", trParams({lg: W.lg[S.cl[p.club]].n}))});
  }
  p.fol = p.fol * (1 + p.fame / 2500) + p.fame * 0.4 * (bst.apps / 10);
  feed({t: "block", y: S.yr, bi: S.bi, lab: b[2], log: S.blog, news: S.bnews, ovr0: bst.ovr0, ovr1: p.ovr, club: p.club, pos: posInLeague(p.club), lg: S.cl[p.club], st: {apps: bst.apps, rs: bst.rs, rn: bst.rn}});
  S.cur = null;
  if (S.bi < 4) {
    S.bi++; S.ph = "gap";
    queueBetween(S.bi);
  } else seasonEnd();
}
function growthTick() {
  var p = S.p, bst = S.bst, a = p.age;
  var rate = a <= 17 ? 0.33 : a <= 19 ? 0.28 : a <= 21 ? 0.22 : a <= 23 ? 0.16 : a <= 25 ? 0.1 : a <= 27 ? 0.06 : a <= 29 ? 0.03 : 0.01;
  var gap = Math.max(0, p.pot - p.ovr);
  var share = bst.tm ? clamp(bst.min / (bst.tm * 90), 0, 1) : 0;
  var playF = 0.45 + 0.8 * share + (bst.called ? 0.05 : 0);
  var avgR = bst.rn ? bst.rs / bst.rn : 6.3;
  var perfF = clamp(1 + (avgR - 6.6) * 0.35, 0.6, 1.5);
  var profF = 0.75 + p.prof / 200, morF = 0.9 + p.mor / 500;
  var focusF = p.focus === "tactica" || p.focus === "mental" ? 1.03 : 1;
  var g = gap * rate / 5 * playF * perfF * profF * morF * focusF * (p.flags.gmul || 1);
  if (p.ovr >= p.pot) g = Math.min(g, 0.04);
  if (a >= 30) g -= Math.pow(a - 29, 1.3) * 0.38 / 5 * (1.25 - p.prof / 200);
  if (p.injT > S.tw + 8) g -= 0.15;
  p.ovr = clamp(p.ovr + g, 30, 99);
  if (p.ovr > p.peak) p.peak = p.ovr;
  var f = FOCUS[p.focus];
  if (f) (isGK() ? f.gk : f.att).forEach(function (k) { p.tr[k] = Math.min(12, (p.tr[k] || 0) + 0.45); });
}

/* ---------- decisiones entre bloques ---------- */
function queueBetween(nextBi) {
  if (nextBi === 3) {
    var offers = genOffers("invierno");
    if (offers.length) S.pend.push({k: "offers", list: offers, kind: N_("invierno"), forced: false});
  }
  var n = [1, 1, 2][S.set.ev] + (chance([0.15, 0.45, 0.55][S.set.ev]) ? 1 : 0);
  pushRandomEvents("temporada", n);
  maybePress();
}
function pushRandomEvents(ctx, n) {
  var used = {};
  S.pend.forEach(function (x) { if (x.k === "ev") used[x.id] = 1; });
  for (var i = 0; i < n; i++) {
    var want = i % 2 === 0 ? (chance(0.5) ? "real" : "aleatoria") : null;
    var pool = EVENTS.filter(function (e) {
      if (used[e.id] || e.manual) return false;
      if (e.ctx && e.ctx !== ctx && e.ctx !== "any") return false;
      if (!e.ctx && ctx === "verano") return false;
      var cd = S.p.evCd[e.id];
      if (cd != null && S.yr - cd < (e.cd != null ? e.cd : 2)) return false;
      if (e.once && cd != null) return false;
      try { return !e.when || e.when(X); } catch (err) { return false; }
    });
    if (want) { var pf = pool.filter(function (e) { return e.tipo === want; }); if (pf.length) pool = pf; }
    var ev = wpick(pool, function (e) { return typeof e.w === "function" ? e.w(X) : (e.w || 1); });
    if (!ev) break;
    used[ev.id] = 1;
    S.pend.push({k: "ev", id: ev.id, s: ri(1, 999999999)});
  }
}

/* ---------- fin de temporada ---------- */
function seasonEnd() {
  var p = S.p, li = S.cl[p.club], pos = posInLeague(p.club), L = W.lg[li];
  var ss = p.ss, avg = ss.rn ? ss.rs / ss.rn : 0;
  var news = [];
  if (pos === 1 && ss.lg.apps >= 1) {
    p.trophies.push({k: "L:" + L.id, n: L.n, y: S.yr + 1, team: p.club, nat: -1, w: LEAGUE_TROPHY_W(li), s: seasonLabel(S.yr), fx: {fame: 5, mor: 10}});
    p.mor = clamp(p.mor + 10, 0, 100); p.fame = clamp(p.fame + 5, 0, 100);
    S.troQ = (S.troQ || []).concat([p.trophies.length - 1]).slice(-5);
    news.push({t: "trophy", x: tr("¡Campeones de {lg}!", {lg: lgName(li)})});
  }
  if (L.upI >= 0 && (typeof lgPromoted === "function" ? lgPromoted(li, p.club) : pos <= lgUpN(li))) news.push({t: "star", x: tr("¡Ascenso a {lg}!", {lg: trComp(lgDivRaw(L.upI))})});
  if (L.downI >= 0 && pos > S.L[li].tm.length - L.rel) news.push({t: "bad", x: tr("Descenso a {lg}.", {lg: trComp(lgDivRaw(L.downI))})});
  var aw = leagueAwards(li, pos, avg);
  aw.forEach(function (a) { p.awards.push(awd(a.k, a.tk, a.tp, S.yr + 1)); news.push({t: "star", x: awardName(a) + "."}); p.fame = clamp(p.fame + 3, 0, 100); });
  var objs = p.objs.map(function (o) { var met = objMet(o); return {n: o.n, tk: o.tk, tp: o.tp, met: met, pr: objProgress(o), lv: o.lv}; });
  /* la recompensa crece con la dificultad elegida; fallar uno fácil duele más */
  objs.forEach(function (o) { var k = objMultOf(o, o.met); if (o.met) { p.mor += 4 * k; p.coach += 4 * k; p.fame += Math.round(1 * k); if (p.con && o.lv >= 2) p.money += Math.round(p.con.sal * 0.04 * k / 1000) * 1000; } else { p.mor -= 3 * k; p.coach -= 4 * k; } });
  p.mor = clamp(p.mor, 0, 100); p.coach = clamp(p.coach, 0, 100);
  var trophies = p.trophies.filter(function (t) { return t.s === seasonLabel(S.yr); }).map(function (t) { return t.n; });
  var row = {y: S.yr, club: p.club, clubs: ss.clubs.slice(), lg: li, pos: pos, apps: ss.apps, st: ss.st, min: ss.min, g: ss.g, a: ss.a, cs: ss.cs, gc: ss.gc || 0, lgCs: ss.lg.cs || 0, lgGc: ss.lg.gc || 0, rt: round1(avg),
    yc: ss.yc, rc: ss.rc, motm: ss.motm, lgApps: ss.lg.apps, lgG: ss.lg.g, lgA: ss.lg.a, ovr0: Math.round(ss.ovr0), ovr1: ovrInt(), age: p.age, loan: !!p.loan,
    caps: p.ns.apps, ig: p.ns.g, tro: trophies, aw: aw.map(function (a) { return a.n; }), comp: ss.comp, val: marketValue()};
  p.seasons.push(row);
  maybeNickPlayer();
  seasonEndWorld();
  pruneComps(ss.clubs);
  // contrato y cesiones
  var after = [];
  if (p.loan) {
    var parent = p.loan.from;
    after.push({t: "ok", x: tr("Termina tu cesión: vuelves al {club}.", {club: clubName(parent)})});
    p.club = parent; p.loan = null;
    p.coach = clamp(55 + (row.rt - 6.6) * 20, 30, 85);
  }
  if (p.con) p.con.yrs--;
  p.fame = clamp(p.fame * 0.96 + Math.min(10, ss.apps / 6) + (S.cr[p.club] >= 82 ? 2 : 0) + (avg - 6.6) * 4, 0, 100);
  p.flags.frozen = false; p.flags.surgeryAsked = false;
  feed({t: "seasonEnd", y: S.yr, row: row, news: news.concat(after), objs: objs, pos: pos, lg: li, club: row.club});
  S.ph = "post";
  if (p.age >= 33 || (p.age >= 30 && p.ovr < 62)) S.pend.push({k: "ev", id: "retiro"});
}
/* las competiciones ajenas al jugador se resumen para que la partida ocupe poco */
function pruneComps(myClubs) {
  Object.keys(S.C).forEach(function (k) {
    var c = S.C[k], inv = false;
    if (c.typ === "lite" || k === "NQ") return;
    if (c.nat) inv = S.mode !== "mgr" && !!(c.teams && c.teams.indexOf(S.p.inat) >= 0);
    else {
      if (c.teams && c.teams.some(function (t) { return myClubs.indexOf(t) >= 0; })) inv = true;
      if (!inv && c.ko) c.ko.r.forEach(function (rd) { rd.ties.forEach(function (t) { if (myClubs.indexOf(t.a) >= 0 || myClubs.indexOf(t.b) >= 0) inv = true; }); });
    }
    if (!inv) S.C[k] = {k: c.k, n: c.n, s: c.s, typ: "lite", done: true, win: c.win, nat: !!c.nat, lvl: c.lvl, dom: c.dom, ci: c.ci, conf: c.conf};
  });
}
function leagueAwards(li, pos, avg) {
  var p = S.p, ss = p.ss, L = S.L[li], N = L.N, out = [], g = posGroup();
  if (ss.lg.apps < 8) return out;
  var lgN = W.lg[li].n, y1 = S.yr + 1;
  var topG = Math.max(8, Math.round(N * 0.62 * (W.lg[li].t === 1 ? 1 : 0.95) + gauss() * 3.5));
  if (ss.lg.g >= topG) out.push(awd("pichichi", "Máximo goleador de {lg} ({n} goles)", {lg: lgN, n: ss.lg.g}, y1));
  var topA = Math.max(5, Math.round(N * 0.32 + gauss() * 2.5));
  if (ss.lg.a >= topA) out.push(awd("asist", "Máximo asistente de {lg} ({n})", {lg: lgN, n: ss.lg.a}, y1));
  var lgAvg = ss.lg.apps ? avg : 0;
  if (ss.lg.apps >= 24 && lgAvg >= 7.45 && pos <= 4 && chance(0.35 + (lgAvg - 7.45) * 1.5)) out.push(awd("mvp", "Mejor jugador de {lg}", {lg: lgN}, y1));
  if (ss.lg.apps >= 20 && lgAvg >= 7.15) out.push(awd("tots", "Equipo de la temporada de {lg}", {lg: lgN}, y1));
  if (p.age <= 21 && ss.lg.apps >= 16 && lgAvg >= 6.95 && chance(0.6)) out.push(awd("young", "Mejor jugador joven de {lg}", {lg: lgN}, y1));
  if (g === "POR") {
    /* porteros: menos goleado (en España, el Zamora) y guante de oro (más porterías a cero) */
    var gpg = (ss.lg.gc || 0) / Math.max(1, ss.lg.apps), csN = ss.lg.cs || 0, es = W.lg[li].c === "ES" && W.lg[li].t === 1, en = W.lg[li].c === "ENG" && W.lg[li].t === 1;
    if (ss.lg.apps >= Math.round(N * 0.7) && gpg <= 0.82 + gauss() * 0.05) out.push(es ? awd("zamora", "Trofeo Zamora {year}", {year: y1}, y1) : awd("zamora", "Portero menos goleado de {lg}", {lg: lgN}, y1));
    var topCs = Math.max(6, Math.round(N * 0.36 + gauss() * 1.5));
    if (csN >= topCs) out.push(en ? awd("glove", "Guante de Oro de la Premier ({n} porterías a cero)", {n: csN}, y1) : awd("glove", "Guante de Oro de {lg} ({n} porterías a cero)", {lg: lgN, n: csN}, y1));
  }
  return out;
}

/* ---------- verano: torneos de selecciones y Mundial de Clubes ---------- */
function summerPlan() {
  var Y = S.yr + 1, p = S.p, list = [];
  natTournamentsOf(Y).forEach(function (T) { list.push({T: T, y: Y}); });
  var cwc = FEM ? Y >= 2028 && (Y - 2028) % 4 === 0 : Y >= 2029 && (Y - 2029) % 4 === 0;
  return {y: Y, list: list, cwc: cwc};
}
function startSummer() {
  var plan = summerPlan(), p = S.p, pn = p.inat;
  S.sq = {any: false};
  var bonus = {};
  if (pn >= 0) {
    plan.list.forEach(function (x) {
      var q = S.q[x.T.k + x.y];
      var b = Math.max(0, p.ovr - S.nr[pn]) * 0.12;
      if (q && q.gp >= 3) b += (q.pts / q.gp - 1.7) * 3.2;
      bonus[pn] = b;
    });
  }
  var made = [];
  plan.list.forEach(function (x) {
    var c = mkNatTournament(x.T, x.y, bonus);
    if (!c) return;
    S.C[x.T.k] = c; made.push(c);
  });
  if (plan.cwc) { var cw = mkClubWorldCup(plan.y); S.C.CWC = cw; made.push(cw); }
  // convocatoria (un solo torneo de selecciones por verano)
  var mine = null;
  if (pn >= 0) {
    made.filter(function (c) { return c.nat && c.teams.indexOf(pn) >= 0; }).sort(function (a, b) { return (a.k === "OLY" ? 1 : 0) - (b.k === "OLY" ? 1 : 0); }).some(function (c) {
      var u23 = c.k === "OLY";
      if (u23 && p.age > 23) return false;
      var thr = S.nr[pn] - (u23 ? 12 : 5.5) - p.fame / 40 + gauss() * 1.2;
      var ok = p.age >= 17 && p.ovr + (p.form - 50) / 15 >= thr && p.injT <= S.tw + 1 && !(p.flags.natBreak && S.yr < p.flags.natBreak);
      if (ok) { mine = c; return true; }
      if (!u23) S.summerNews = (S.summerNews || []).concat([{t: "bad", x: tr("No entras en la lista de {nat} para el {comp}.", {nat: natName(pn), comp: trComp(c.n)})}]);
      return false;
    });
  }
  if (mine) { S.sq[mine.k] = true; S.sq.any = true; mine.squad = true; S.tour = {k: mine.k, n: mine.n, apps: 0, g: 0, a: 0, rs: 0}; }
  else S.tour = null;
  var clubIn = S.C.CWC && S.C.CWC.teams.indexOf(p.club) >= 0 && !S.sq.any;
  S.cur = {w: 41, end: 48, prep: false, pm: [], pi: 0, called: false, summer: true};
  S.blog = []; S.bnews = (S.summerNews || []).slice(); S.summerNews = null; S.momN = 0;
  S.bst = {apps: 0, min: 0, rs: 0, rn: 0, lgApps: 0, lgRs: 0, tm: 0, ovr0: p.ovr};
  S.sumMade = made.map(function (c) { return c.k; });
  S.ph = "sblk";
  S.involved = !!(mine || clubIn);
  if (!S.involved) { var r, guard = 0; do { r = continueRun(); } while (r === "pause" && guard++ < 50); }
  else continueRun();
  return S.involved;
}
function summerDone() {
  var p = S.p, cards = [];
  var row = p.seasons[p.seasons.length - 1], ss = p.ss;
  if (row && ss && ss.apps > row.apps) {
    row.apps = ss.apps; row.st = ss.st; row.min = ss.min; row.g = ss.g; row.a = ss.a; row.cs = ss.cs; row.gc = ss.gc || 0; row.rt = round1(ss.rs / Math.max(1, ss.rn)); row.comp = ss.comp;
  }
  (S.sumMade || []).forEach(function (k) {
    var c = S.C[k]; if (!c) return;
    var winner = c.win, pn = p.inat;
    var mineNat = c.nat && pn >= 0 && c.teams.indexOf(pn) >= 0;
    var mineClub = !c.nat && c.teams.indexOf(p.club) >= 0;
    var stage = (mineNat || mineClub) ? stageReached(c, mineNat ? pn : p.club) : null;
    if (c.nat && winner >= 0) histPush(c.tk || k, S.yr + 1, winner);
    if (!c.nat && winner >= 0) histPush(k, S.yr + 1, winner);
    cards.push({k: k, n: c.n, nat: !!c.nat, win: winner, stage: stage, mine: mineNat || mineClub, squad: !!c.squad});
  });
  var tour = S.tour;
  if (tour && tour.apps) {
    var c = S.C[tour.k], won = c && c.win === p.inat;
    var avg = tour.rs / tour.apps;
    var bootThr = tour.k === "NLF" ? 99 : ri(4, 7);
    if (tour.k === "NLF") avg = 0;
    if (tour.g >= bootThr) { p.awards.push(awd("tboot", "Bota de Oro del {tour}", {tour: tour.n}, S.yr + 1)); S.bnews.push({t: "star", x: tr("Bota de Oro del {tour} ({n} goles).", {tour: trComp(tour.n), n: tour.g})}); }
    if (isGK() && tour.apps >= 3 && (tour.gc || 0) / tour.apps <= 0.75 && (won || stageReached(c, p.inat) === "Final" || stageReached(c, p.inat) === "Semifinales") && tour.k !== "NLF" && chance(won ? 0.75 : 0.45)) {
      p.awards.push(awd("tglove", "Guante de Oro del {tour}", {tour: tour.n}, S.yr + 1)); S.bnews.push({t: "star", x: tr("Guante de Oro del {tour}: {n} goles encajados en {m} partidos.", {tour: trComp(tour.n), n: tour.gc || 0, m: tour.apps})});
    }
    if (avg >= 7.5 && (won || stageReached(c, p.inat) === "Final") && chance(won ? 0.65 : 0.4)) { p.awards.push(awd("tball", "Balón de Oro del {tour}", {tour: tour.n}, S.yr + 1)); S.bnews.push({t: "star", x: tr("Mejor jugador del {tour}.", {tour: trComp(tour.n)})}); }
    p.intl.tours.push({k: tour.k, n: tour.n, apps: tour.apps, g: tour.g, a: tour.a, st: stageReached(c, p.inat), y: S.yr + 1});
  }
  feed({t: "summer", y: S.yr + 1, cards: cards, log: S.blog, news: S.bnews, tour: tour});
  S.cur = null;
  S.ph = "awards";
}
function stageReached(c, t) {
  if (!c) return "";
  if (c.win === t) return N_("Campeón");
  if (c.ko) {
    var last = "";
    c.ko.r.forEach(function (rd) { rd.ties.forEach(function (x) { if (x.a === t || x.b === t) last = rd.n; }); });
    if (last) return last === "Final" ? "Final" : last;
  }
  return c.typ === "grp" ? N_("Fase de grupos") : N_("Fase de liga");
}

/* ---------- gala de premios ---------- */
function seasonTrophyPts(yrLabel, yEnd) {
  var pts = 0;
  S.p.trophies.forEach(function (t) { if (t.s === yrLabel || (t.nat >= 0 && t.y === yEnd)) pts += t.w; });
  return pts;
}
function bdoScore(st) {
  var sc = (st.ovr - 75) * 2 + (st.avgR - 6.8) * 16 + Math.min(st.apps, 55) * 0.12 + st.troph + (st.clubR - 78) * 0.35;
  if (st.g === "DEL") sc += st.goals * 0.85 + st.ast * 0.4;
  else if (st.g === "MED") sc += st.goals * 0.75 + st.ast * 0.6 + 6;
  else if (st.g === "DEF") sc += st.goals * 0.5 + st.ast * 0.4 + st.cs * 0.25 + 4;
  else sc += st.cs * 0.45 + 2;
  return sc;
}
function rivalSeason(r, yEnd) {
  var apps = ri(36, 55), avgR = 6.75 + (r.ovr - 80) * 0.07 + gauss() * 0.22, goals, ast, cs = 0;
  if (r.g === "DEL") { goals = Math.max(0, Math.round((r.ovr - 68) * 1.25 + gauss() * 6)); ast = Math.max(0, Math.round((r.ovr - 72) * 0.6 + gauss() * 3)); }
  else if (r.g === "MED") { goals = Math.max(0, Math.round((r.ovr - 72) * 0.5 + gauss() * 3)); ast = Math.max(0, Math.round((r.ovr - 70) * 0.7 + gauss() * 3)); }
  else if (r.g === "DEF") { goals = Math.max(0, Math.round(2 + gauss() * 2)); ast = Math.max(0, Math.round(3 + gauss() * 2)); cs = ri(10, 22); }
  else { goals = 0; ast = 0; cs = ri(12, 26); }
  var clubR = S.cr[r.club] || 80, troph = 0;
  if (clubR >= 83 && chance(0.1 + (clubR - 83) * 0.03)) troph += 20;
  if (chance(0.3 + (clubR - 82) * 0.05)) troph += 10;
  if (chance(0.3)) troph += 3;
  natTournamentsOf(yEnd).forEach(function (T) {
    if (T.u23 || T.special) return;
    if (T.conf !== "ALL" && T.conf !== W.ctry[r.ni].conf) return;
    var nr = S.nr[r.ni], p = clamp((nr - 76) * 0.012, 0, 0.16) * (T.conf === "ALL" ? 1 : 1.8);
    if (chance(p)) troph += COMP_TROPHY_W[T.k] || 6;
  });
  return {ovr: r.ovr, avgR: avgR, apps: apps, troph: troph, clubR: clubR, g: r.g, goals: goals, ast: ast, cs: cs};
}
function playerSeasonForAwards() {
  var p = S.p, row = p.seasons[p.seasons.length - 1];
  if (!row) return null;
  var yEnd = row.y + 1, tour = S.tour;
  var apps = row.apps + (tour ? tour.apps : 0), goals = row.g + (tour ? tour.g : 0), ast = row.a + (tour ? tour.a : 0);
  var avgR = row.rt;
  if (tour && tour.apps) avgR = (row.rt * row.apps + tour.rs) / Math.max(1, apps);
  return {ovr: p.ovr, avgR: avgR || 6, apps: apps, troph: seasonTrophyPts(seasonLabel(row.y), yEnd), clubR: S.cr[row.club] || 70, g: posGroup(), goals: goals, ast: ast, cs: row.cs, lgG: row.lgG, lg: row.lg, yEnd: yEnd};
}
function awardsCeremony() {
  var p = S.p, me = playerSeasonForAwards(), yEnd = S.yr + 1, out = [], ranking = [];
  if (me && me.apps >= 8) {
    var myScore = bdoScore(me);
    S.rv.forEach(function (r) { var s = rivalSeason(r, yEnd); r.lastScore = bdoScore(s); r.lastG = s.goals; r.lastTro = s.troph; });
    ranking = S.rv.map(function (r) { return {n: r.n, ni: r.ni, club: r.club, sc: r.lastScore, g: r.g, age: r.age}; });
    ranking.push({n: p.fn.charAt(0) + ". " + p.ln, ni: p.inat >= 0 ? p.inat : p.nat, club: p.club, sc: myScore, me: true, g: posGroup(), age: p.age});
    ranking.sort(function (a, b) { return b.sc - a.sc; });
    var myPos = ranking.findIndex(function (x) { return x.me; }) + 1;
    if (myPos === 1) { out.push(awd("bdo", "Balón de Oro {year}", {year: yEnd})); p.fame = clamp(p.fame + 15, 0, 100); }
    else if (myPos <= 3) {
      out.push(awd("bdo_pod", "{pos}º en el Balón de Oro {year}", {pos: myPos, year: yEnd}));
      if (S.p.evCd.gala_bdo == null || S.yr - S.p.evCd.gala_bdo >= 2) S.pend.push({k: "ev", id: "gala_bdo", pos: myPos, s: ri(1, 999999999)});
    }
    else if (myPos <= 30 && me.ovr >= 76) { var nom = awd("bdo_nom", "Nominado al Balón de Oro {year} ({pos}º)", {year: yEnd, pos: myPos}); nom.minor = true; out.push(nom); }
    var best = ranking.find(function (x) { return x.me; });
    // The Best: misma base, otro jurado
    var bestScore = best.sc + gauss() * 5;
    if (myPos <= 3 && bestScore >= ranking[myPos === 1 ? 1 : 0].sc + gauss() * 3) out.push(awd("best", "Premio The Best FIFA {year}", {year: yEnd}));
    if (myPos <= 12 || (me.ovr >= 86 && me.avgR >= 7.2)) { var xi = awd("xi", "Once Mundial FIFPRO {year}", {year: yEnd}); xi.minor = myPos > 5; out.push(xi); }
    // jóvenes
    if (p.age <= 21) {
      var youth = ranking.filter(function (x) { return x.age <= 21; });
      var yPos = youth.findIndex(function (x) { return x.me; }) + 1;
      if (yPos === 1) { out.push(awd("goldenboy", "Golden Boy {year}", {year: yEnd})); p.fame = clamp(p.fame + 6, 0, 100); }
      if (yPos <= 2 && chance(yPos === 1 ? 0.7 : 0.35)) out.push(awd("kopa", "Trofeo Kopa {year}", {year: yEnd}));
    }
    if (posGroup() === "POR") {
      var gks = ranking.filter(function (x) { return x.g === "POR"; });
      var gkPos = gks.findIndex(function (x) { return x.me; });
      if (gkPos === 0) out.push(awd("yashin", "Trofeo Yashin {year}", {year: yEnd}));
      if (gkPos === 0 || (gkPos === 1 && chance(0.35))) out.push(awd("bestgk", "Premio The Best FIFA al mejor portero {year}", {year: yEnd}));
      else if (gkPos >= 1 && gkPos <= 4) { var gx = awd("gkxi", "Once Mundial FIFPRO: portero {year}", {year: yEnd}); gx.minor = true; if (!out.some(function (a) { return a.k === "xi"; })) out.push(gx); }
    }
    // Bota de Oro europea
    var li = me.lg;
    if (li >= 0 && W.lg[li] && W.lg[li].conf === "UEFA") {
      var pts = me.lgG * W.lg[li].gs, thr = 56 + gauss() * 6;
      if (pts >= thr) out.push(awd("boot", "Bota de Oro europea {year} ({n} goles)", {year: yEnd, n: me.lgG}));
    }
    out.forEach(function (a) { p.awards.push(awd(a.k, a.tk, a.tp, yEnd)); });
    feed({t: "awards", y: yEnd, top: ranking.slice(0, 10).map(function (x) { return {n: x.n, ni: x.ni, club: x.club, me: !!x.me}; }), pos: myPos, won: out});
  } else {
    var rk = S.rv.map(function (r) { var s = rivalSeason(r, yEnd); return {n: r.n, ni: r.ni, club: r.club, sc: bdoScore(s)}; }).sort(function (a, b) { return b.sc - a.sc; });
    feed({t: "awards", y: yEnd, top: rk.slice(0, 10), pos: 0, won: []});
    ranking = rk;
  }
  if (ranking.length) histPush("BDO", yEnd, -1, ranking[0].n + "|" + ranking[0].ni + "|" + ranking[0].club + (ranking[0].me ? "|me" : ""));
  ageRivals();
  S.tour = null;
  S.ph = "off";
}

/* ---------- fichajes ---------- */
function recentPerf() {
  var p = S.p, ss = p.ss, last = p.seasons[p.seasons.length - 1];
  if (ss && ss.rn >= 5) return {avgR: ss.rs / ss.rn, share: ss.tm ? ss.min / (ss.tm * 90) : 0};
  if (last && last.apps) return {avgR: last.rt, share: Math.min(1, last.min / (Math.max(1, last.apps) * 75 + 1) * 0.7)};
  return {avgR: 6.6, share: 0.3};
}
function genOffers(kind) {
  var p = S.p, out = [];
  if (kind === "invierno" && p.loan) return out;
  var eff = p.ovr, age = p.age, free = !p.loan && p.con && p.con.yrs <= 0, perf = recentPerf();
  var interest = 0.16 + (perf.avgR - 6.6) * 0.45 + p.fame / 220 + [0, 0.05, 0.15][p.agent] + (p.flags.wantOut ? 0.35 : 0) + (age <= 21 && p.pot - p.ovr > 6 ? 0.12 : 0);
  if (kind === "invierno") interest *= 0.5;
  interest = clamp(interest, 0.03, 0.9);
  var n = 0; for (var i = 0; i < 4; i++) if (chance(interest)) n++;
  if (free) n = Math.max(n, 3);
  var myR = S.cr[p.club], hiExtra = age <= 21 ? Math.max(0, p.pot - eff) * 0.3 : 0;
  var cands = [], snub = p.flags.snub;
  W.clubs.forEach(function (c, i) {
    if (i === p.club || S.cl[i] < 0 || i === snub) return;
    var r = S.cr[i];
    if (r >= eff - 7 && r <= eff + 4 + hiExtra) cands.push(i);
  });
  if (cands.length < 3) W.clubs.forEach(function (c, i) { if (i !== p.club && S.cl[i] >= 0 && Math.abs(S.cr[i] - eff) < 12) cands.push(i); });
  var chosen = [];
  for (var k = 0; k < n && cands.length; k++) {
    var c = wpick(cands, function (i) {
      var r = S.cr[i], li = S.cl[i], w = 1 + Math.max(0, r - myR) * 0.25;
      w *= Math.pow(W.lg[li].w, 0.3);
      if (W.clubs[i].ci === p.nat) w *= 1.4;
      if (r < myR - 3 && !free) w *= 0.35;
      return w;
    });
    if (c == null) break;
    cands = cands.filter(function (x) { return x !== c; });
    chosen.push(c);
  }
  var val = marketValue(), agentMul = [0.95, 1, 1.15][p.agent];
  /* promesas de verano (precontratos, palabra dada a un grande…) */
  var prom = p.flags.promise;
  if (kind === "verano" && prom != null && prom >= 0 && prom !== p.club && S.cl[prom] >= 0) {
    chosen = chosen.filter(function (c) { return c !== prom; });
    out.push({club: prom, sal: Math.round(salaryFor(eff, prom) * 1.4 * agentMul / 1000) * 1000, yrs: age <= 29 ? 5 : 3, fee: free ? 0 : Math.round(val * 1.25 / 1e5) * 1e5, role: roleFor(eff - S.cr[prom], age), loan: false, promised: true});
    p.flags.promise = null;
  }
  chosen.forEach(function (c) {
    var yrs = age <= 23 ? ri(4, 5) : age <= 29 ? ri(3, 5) : age <= 32 ? ri(2, 3) : ri(1, 2);
    var fee = free ? 0 : Math.round(val * rf(0.85, 1.35) * (p.con && p.con.yrs <= 1 ? 0.6 : 1) / 1e5) * 1e5;
    out.push({club: c, sal: Math.round(salaryFor(eff, c) * rf(1, 1.35) * agentMul / 1000) * 1000, yrs: yrs, fee: fee, role: roleFor(eff - S.cr[c], age), loan: false});
  });
  if (age >= 27 && eff >= 78 && chance(0.3)) {
    var sa = teamsOfLeague(W.lgIdx.KSA1).filter(function (c) { return c !== p.club && S.cr[c] >= 72; });
    if (sa.length) { var sc = pick(sa); out.push({club: sc, sal: Math.round(salaryFor(eff, sc) * rf(2, 3) / 1000) * 1000, yrs: ri(2, 3), fee: free ? 0 : Math.round(val * 1.2 / 1e5) * 1e5, role: roleFor(eff - S.cr[sc], age), loan: false, mega: true}); }
  }
  if (!free && age <= 21 && perf.share < 0.35 && kind === "verano" && !p.loan) {
    var lc = W.clubs.map(function (_, i) { return i; }).filter(function (i) { return i !== p.club && S.cl[i] >= 0 && S.cr[i] >= eff - 4 && S.cr[i] <= eff + 1.5; });
    shuffle(lc).slice(0, ri(1, 2)).forEach(function (c) { out.push({club: c, sal: p.con.sal, yrs: 1, fee: 0, role: roleFor(eff - S.cr[c], age), loan: true}); });
  }
  return out;
}
function acceptOffer(o) {
  var p = S.p, old = p.club;
  if (o.loan) {
    p.loan = {from: old};
    p.club = o.club;
    p.coach = 55; p.fans = 50; p.mor = clamp(p.mor + 6, 0, 100);
    p.tx.push({y: S.yr, w: S.w, from: old, to: o.club, fee: 0, loan: true});
    milestone(tr("Cedido al {club}", {club: clubName(o.club)}));
  } else {
    if (p.loan) p.loan = null;
    var yrsAt = p.con ? S.yr - p.con.since : 0;
    if (yrsAt >= 3 && W.clubs[old].ci === W.clubs[o.club].ci && S.cr[old] >= 70) p.flags.traitor = old;
    joinClub(o.club, {sal: o.sal, yrs: o.yrs, fee: o.fee});
    p.money += Math.round(o.sal * 0.1);
    p.fame = clamp(p.fame + Math.min(10, o.fee / 1e7), 0, 100);
    p.tx.push({y: S.yr, w: S.w, from: old, to: o.club, fee: o.fee, loan: false});
    milestone(o.fee ? tr("Fichaje por el {club} ({fee})", {club: clubName(o.club), fee: fmtMoney(o.fee)}) : tr("Fichaje por el {club} (libre)", {club: clubName(o.club)}));
  }
  if (p.ss && p.ss.clubs.indexOf(p.club) < 0) p.ss.clubs.push(p.club);
  p.flags.wantOut = false; p.flags.frozen = false;
  if (S.ph === "pre") setObjectives();
  feed({t: "transfer", y: S.yr, from: old, to: o.club, fee: o.fee, loan: o.loan, sal: o.sal, yrs: o.yrs, role: roleNow()});
}

/* ---------- retirada y legado ---------- */
function legacy() {
  var p = S.p, sc = 0;
  p.trophies.forEach(function (t) { sc += t.w * 2.2; });
  p.awards.forEach(function (a) {
    sc += {bdo: 60, bdo_pod: 22, best: 20, goldenboy: 12, kopa: 6, yashin: 20, boot: 18, xi: 8, pichichi: 10, mvp: 12, tots: 4, young: 4, asist: 4, zamora: 6, tboot: 10, tball: 14, pom: 1, bdo_nom: 2}[a.k] || 2;
  });
  var tot = careerTotals();
  sc += tot.g * (posGroup() === "DEL" ? 0.2 : 0.35) + tot.a * 0.15 + tot.apps * 0.05 + p.intl.caps * 0.3 + p.intl.g * 0.4;
  sc += Math.max(0, p.peak - 75) * 6;
  sc = Math.round(sc);
  var title = sc >= 1100 ? tr("Leyenda eterna") : sc >= 750 ? tr("Leyenda mundial") : sc >= 480 ? tr("Estrella internacional") : sc >= 300 ? tr("Ídolo de la afición") : sc >= 160 ? tr("Profesional respetado") : sc >= 80 ? tr("Carrera sólida") : tr("Trotamundos del fútbol");
  return {sc: sc, title: title};
}
function careerTotals() {
  var t = {apps: 0, g: 0, a: 0, cs: 0, seasons: S.p.seasons.length};
  S.p.seasons.forEach(function (r) { t.apps += r.apps; t.g += r.g; t.a += r.a; t.cs += r.cs; });
  return t;
}
function retire() {
  var p = S.p, lg = legacy(), tot = careerTotals();
  var clubs = {};
  p.seasons.forEach(function (r) { clubs[r.club] = (clubs[r.club] || 0) + r.apps; });
  var main = Object.keys(clubs).sort(function (a, b) { return clubs[b] - clubs[a]; })[0];
  S.retired = {y: S.yr + 1, age: p.age, lg: lg, tot: tot, main: main != null ? +main : p.club};
  S.ph = "ret";
  feed({t: "retire", y: S.yr + 1, lg: lg, tot: tot, main: S.retired.main});
}

/* ---------- avance general (modo jugador) ---------- */
function feed(card) { card.id = (S.fid = (S.fid || 0) + 1); S.feed.unshift(card); if (S.feed.length > 32) S.feed.length = 32; }
function cleanPendPlayer() {
  while (S.pend.length) {
    var x = S.pend[0];
    if (x.k === "ev") {
      var ev = EVENT_BY_ID[x.id], keep = !!ev;
      if (ev) {
        X.cur = x;
        try {
          keep = (!ev.still || ev.still(X)) && (ev.manual || !ev.when || !!ev.when(X));
          if (keep) keep = !!ev.text(X) && ev.opts(X).length > 0;
        } catch (e) { keep = false; }
        X.cur = null;
      }
      if (!keep) { S.pend.shift(); continue; }
    }
    if (x.k === "offers" && !x.forced && !x.list.length) { S.pend.shift(); continue; }
    if ((x.k === "moment" || x.k === "so") && (!S.cur || !S.cur.pm || !S.cur.pm[x.fi])) { S.pend.shift(); continue; }
    break;
  }
}
function nextLabelPlayer() {
  cleanPendPlayer();
  if (S.pend.length) return null;
  switch (S.ph) {
    case "pre": return tr("Jugar {block}", {block: BLOCKS[0][2]});
    case "gap": return tr("Jugar {block}", {block: BLOCKS[S.bi][2]});
    case "blk": case "sblk": return tr("Continuar");
    case "post": var pl = summerPlan(); var nat = pl.list.filter(function (x) { return !x.T.special || S.lastNL; });
      return nat.length || pl.cwc ? tr("Verano {year}: torneos", {year: pl.y}) : tr("Vacaciones de verano");
    case "awards": return tr("Gala de premios {year}", {year: S.yr + 1});
    case "off": return tr("Empezar temporada {season}", {season: seasonLabel(S.yr + 1)});
    default: return null;
  }
}
function advancePlayer() {
  cleanPendPlayer();
  if (S.pend.length) return;
  switch (S.ph) {
    case "pre": case "gap": startBlock(); break;
    case "blk": case "sblk": continueRun(); break;
    case "post": startSummer(); break;
    case "awards": awardsCeremony(); break;
    case "off": startSeason(false); break;
  }
  cleanPendPlayer();
}
/* opción → descripción para la interfaz (desenlaces, porcentajes y chips) */
function descOpt(o, prev) {
  return {t: o.t, d: o.d || null, ref: o.ref || null, badge: o.badge || null, dis: o.dis || null, blind: !!o.blind, mini: o.mini || null,
    outs: outcomesOf(o).map(function (u) { return {p: u.p, good: !!u.good, neu: !!u.neu, sure: !!u.sure, lab: u.lab || null, chips: prev(u)}; })};
}
function playerDesc(x) {
  if (typeof EX_PEND !== "undefined" && EX_PEND[x.k]) return EX_PEND[x.k].desc(x);
  if (x.k === "ev") {
    var ev = EVENT_BY_ID[x.id], real = ev.tipo === "real";
    X.cur = x;
    try {
      return {tag: real ? "real" : "rand", tagTxt: real ? tr("Decisión de carrera") : tr("Imprevisto"), cls: real ? "" : "randc", cat: ev.cat,
        title: typeof ev.title === "function" ? ev.title(X) : ev.title, text: ev.text(X), ref: typeof ev.ref === "function" ? ev.ref(X) : (ev.ref || null),
        opts: ev.opts(X).map(function (o) { return descOpt(o, function (u) { return fxPreview(u.fx, u.n); }); })};
    } finally { X.cur = null; }
  }
  if (x.k === "moment" || x.k === "so") {
    var f = S.cur.pm[x.fi], c = momCtx(f), so = x.k === "so", m = so ? null : MOMENT_BY_ID[x.id], gk = isGK();
    var sc = so ? [f.gu + (f.etu || 0), f.gt + (f.ett || 0)] : c.sc;
    var us = f.isNat ? W.ctry[f.us].code : W.clubs[f.us].ab, op = f.isNat ? W.ctry[f.opp].code : W.clubs[f.opp].ab;
    var board = {min: so ? "PEN" : (c.ml || c.min) + "'", l: f.home ? [us, sc[0]] : [op, sc[1]], r: f.home ? [op, sc[1]] : [us, sc[0]]};
    var text = so ? (gk ? tr("Empate tras la prórroga. Todo se decide en los penaltis y te toca adivinar el lado del último lanzador del {opp}.", {opp: c.opp}) :
      tr("Empate tras la prórroga. Coges el balón para tirar el primer penalti de la tanda; el resto lo deciden tus compañeros.")) : m.text(c);
    var opts = so ? SHOOTOUT_OPTS(gk) : m.opts(c);
    return {tag: "hot", tagTxt: tr("Momento clave"), cls: "hotc", cat: trComp(c.comp) + (c.rn ? " · " + tr(c.rn) : ""), title: so ? tr("Tanda de penaltis") : m.title, text: text,
      ref: so ? null : (m.ref || null), board: board, opts: opts.map(function (o) { return descOpt(o, momPreview); })};
  }
  return null;
}
function momResultChips(out, fxCh) {
  var susp = out.red && out.fx && out.fx.susp ? out.fx.susp : 0;
  var ch = momPreview({goal: out.goal, concede: out.concede, save: out.save, red: out.red, yellow: out.yellow, rating: out.rating, fx: susp ? {susp: susp} : null});
  return ch.concat((fxCh || []).filter(function (c) { return !(susp && c[0] === "susp"); }));
}
/* resolver la decisión pendiente; devuelve la tarjeta de resultado */
function resolvePendingPlayer(choice) {
  cleanPendPlayer();
  var x = S.pend[0];
  if (!x) return null;
  var card = null;
  if (typeof EX_PEND !== "undefined" && EX_PEND[x.k]) { card = EX_PEND[x.k].resolve(x, choice); if (card) feed(card); cleanPendPlayer(); return card; }
  if (x.k === "ev") {
    var ev = EVENT_BY_ID[x.id];
    X.cur = x;
    var o = ev.opts(X)[choice], title = typeof ev.title === "function" ? ev.title(X) : ev.title;
    X.cur = null;
    if (!o || o.dis) return null;
    var res = rollOutcome(outcomesOf(o));
    var chips = applyFx(res.fx || {});
    if (res.n) chips.push(["note", 0, res.n]);
    S.p.evCd[ev.id] = S.yr;
    card = {t: "decision", tipo: ev.tipo, cat: ev.cat, title: title, choice: o.t, txt: res.txt, chips: chips, y: S.yr, good: res.sure ? null : !!res.good, pct: res.sure ? null : Math.round(res.p * 100)};
    S.pend.shift();
    if (res.then) { X.cur = x; try { res.then(X); } finally { X.cur = null; } }
  } else if (x.k === "focus") {
    var keys = Object.keys(FOCUS), k = keys[choice];
    if (!k) return null;
    S.p.focus = k; S.p.flags.focus = k;
    S.pend.shift();
    card = {t: "decision", tipo: "real", cat: tr("Entrenamiento"), title: tr("Plan de pretemporada"), choice: FOCUS[k].n, txt: FOCUS[k].d, chips: [], y: S.yr};
  } else if (x.k === "offers") {
    if (choice >= 0 && x.list[choice]) { S.pend.shift(); acceptOffer(x.list[choice]); cleanPendPlayer(); return null; }
    if (x.forced) return null;
    S.pend.shift();
    if (S.p.flags.wantOut) { S.p.mor = clamp(S.p.mor - 6, 0, 100); }
    card = {t: "decision", tipo: "real", cat: "Mercado", title: x.kind === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), choice: tr("Te quedas en el {club}", {club: clubName(S.p.club)}), txt: trn(x.list.length, "{n} oferta rechazada.", "{n} ofertas rechazadas."), chips: [], y: S.yr};
  } else if (x.k === "moment") {
    var f = S.cur.pm[x.fi], m = MOMENT_BY_ID[x.id], opt = m.opts(momCtx(f))[choice];
    if (!opt) return null;
    var out = rollOutcome(outcomesOf(opt));
    var fxCh = applyMomentResult(f, out);
    S.pend.shift();
    card = {t: "moment", title: m.title, ctx: momLabel(f), choice: opt.t, txt: out.txt, good: !!out.good, pct: out.sure ? null : Math.round(out.p * 100), chips: momResultChips(out, fxCh), y: S.yr};
  } else if (x.k === "so") {
    var f2 = S.cur.pm[x.fi];
    var r2 = resolveShootout(f2, choice);
    if (!r2) return null;
    S.pend.shift();
    card = {t: "moment", title: tr("Tanda de penaltis"), ctx: momLabel(f2), choice: r2.choice, txt: r2.txt, good: r2.good, chips: r2.chips, y: S.yr};
  }
  if (card) feed(card);
  cleanPendPlayer();
  return card;
}
function momCtx(f) {
  var sc = scoreAt(f, f.mom ? f.mom.min : 90);
  return {f: f, min: f.mom ? f.mom.min : 90, ml: f.mom ? f.mom.ml : null, us: f.isNat ? natName(f.us) : clubName(f.us), opp: f.isNat ? natName(f.opp) : clubName(f.opp), sc: sc, imp: f.imp, comp: f.kind === "nq" ? f.lab : compShort(f), rn: roundLabel(f), p: S.p, at: attrs(), eff: pEff(), oppR: f.or};
}
function momLabel(f) { return tr("{comp} · vs {opp}", {comp: trComp(f.kind === "nq" ? f.lab : compShort(f)) + (roundLabel(f) ? " · " + tr(roundLabel(f)) : ""), opp: f.isNat ? natName(f.opp) : clubName(f.opp)}); }
function resolveShootout(f, choice) {
  var p = S.p, gk = isGK(), my = 0.76;
  var o = SHOOTOUT_OPTS(gk)[choice];
  if (!o) return null;
  var res = rollOutcome(outcomesOf(o)), ok = !!res.good;
  var a = 0, b = 0;
  for (var i = 0; i < 5; i++) {
    if (gk) { if (chance(my)) a++; if (i === 4 ? !ok : chance(my)) b++; }
    else { if (i === 0 ? ok : chance(my)) a++; if (chance(my)) b++; }
  }
  var guard = 0;
  while (a === b && guard++ < 20) { if (chance(my)) a++; if (chance(my)) b++; }
  if (a === b) a++;
  f.pens = [a, b];
  var good = a > b;
  var sp = {a: a, b: b};
  var txt = res.txt + " " + (good ? (gk ? tr("La tanda termina {a}-{b}: ¡clasificados!", sp) : tr("La tanda termina {a}-{b}: ¡pasáis vosotros!", sp)) : (gk ? tr("La tanda termina {a}-{b}: eliminados.", sp) : tr("La tanda termina {a}-{b}: quedáis fuera.", sp)));
  f.mr += res.rating || 0;
  var chips = [["note", 0, gk ? (ok ? tr("Paras el último penalti") : tr("No lo paras")) : (ok ? tr("Tu penalti: dentro") : tr("Tu penalti: fallado"))]].concat(applyFx(res.fx || {}));
  if (!ok && f.isNat && f.imp >= 1) p.flags.natVillain = S.yr;
  return {txt: txt, good: good, choice: o.t, chips: chips};
}
/* aplicar efectos de una decisión y devolver chips para la interfaz */
var FX_LABEL;
onLang(function () { FX_LABEL = {ovr: tr("Media"), pot: tr("Potencial"), form: tr("Forma"), mor: tr("Moral"), fit: tr("Físico"), prof: tr("Profesionalidad"), fame: tr("Fama"), coach: tr("Míster"), fans: tr("Afición"), money: tr("Dinero"), fol: tr("Seguidores"), inj: tr("Lesión"), susp: tr("Sanción")}; });
function applyFx(fx) {
  var p = S.p, ch = [];
  Object.keys(fx).forEach(function (k) {
    var v = fx[k];
    switch (k) {
      case "ovr": p.ovr = clamp(p.ovr + v, 30, 99); if (p.ovr > p.peak) p.peak = p.ovr; ch.push([k, v]); break;
      case "pot": p.pot = clamp(p.pot + v, 40, 99); ch.push([k, v]); break;
      case "form": case "mor": case "fit": case "prof": case "fame": case "coach": case "fans":
        p[k] = clamp(p[k] + v, 0, 100); ch.push([k, v]); break;
      case "money": p.money += v; ch.push([k, v]); break;
      case "fol": p.fol = Math.max(0, p.fol + v); ch.push([k, v]); break;
      case "inj": var wk = Array.isArray(v) ? ri(v[0], v[1]) : v; if (wk > 0) { injure(wk); ch.push([k, wk]); } break;
      case "susp": p.susp += v; ch.push([k, v]); break;
      case "buff": p.buffs.push({k: "ovr", v: v.v, b: v.b, n: v.n}); ch.push(["buff", v.v, trn(v.b, "{name}, {n} tramo", "{name}, {n} tramos", {name: v.n})]); break;
      case "att": Object.keys(v).forEach(function (a) { p.tr[a] = (p.tr[a] || 0) + v[a]; ch.push(["att", v[a], ATT_NAMES[a]]); }); break;
      case "flag": Object.keys(v).forEach(function (a) { p.flags[a] = v[a]; }); break;
      case "gmul": p.flags.gmul = (p.flags.gmul || 1) * v; ch.push(["gmul", v]); break;
      case "injMul": p.flags.injMul = (p.flags.injMul || 1) * v; ch.push(["injMul", v]); break;
      case "sal": if (p.con) { p.con.sal = Math.round(p.con.sal * v / 1000) * 1000; ch.push(["sal", v]); } break;
      case "yrs": if (p.con) p.con.yrs = v; break;
      case "pos": p.pos = v; ch.push(["pos", 0, posName(v)]); break;
      case "agent": p.agent = v; break;
      case "coachSet": var d = v - p.coach; p.coach = clamp(v, 0, 100); ch.push(["coach", Math.round(d)]); break;
    }
  });
  return ch;
}

/* ---------- guardado ---------- */
function serialize() { return JSON.stringify(S); }
function restore(json) {
  var s = typeof json === "string" ? JSON.parse(json) : json;
  if (!s || !s.cr || !(s.p || s.m)) throw new Error("Partida no válida");
  buildWorld(worldKey(s)); resetCustom();
  S = s;
  if (S.g !== "f") S.g = "m";
  setFem(S.g === "f");
  if (!S.uid) S.uid = Date.now().toString(36);
  /* partidas de antes de añadir divisiones: completar clubes y ligas nuevas */
  for (var i = S.cr.length; i < W.clubs.length; i++) { S.cr[i] = W.clubs[i].r0; S.cl[i] = W.clubs[i].lg0; }
  W.lg.forEach(function (l, li) {
    if (S.last && S.last.final && !S.last.final[li]) S.last.final[li] = teamsOfLeague(li).sort(function (a, b) { return S.cr[b] - S.cr[a]; });
    if (S.L && !S.L[li]) S.L[li] = newLeagueSeason(li);
  });
  var dead = W.cIdx.ZZ, fixN = function (o, k, club) { if (o && o[k] === dead) o[k] = club >= 0 && W.clubs[club] ? W.clubs[club].ci : W.cIdx.ES; };
  if (dead != null) {
    (S.rv || []).forEach(function (r) { fixN(r, "ni", r.club); });
    if (S.m) { (S.m.sq || []).forEach(function (p) { fixN(p, "nat", S.m.club); }); ((S.m.mk && S.m.mk.list) || []).forEach(function (t) { fixN(t, "nat", t.club); }); fixN(S.m, "nat", -1); }
    if (S.p) { fixN(S.p, "nat", -1); if (S.p.inat === dead) S.p.inat = S.p.nat; if (S.p.nat2 === dead) S.p.nat2 = -1; }
  }
  applyCustom();
  if (S.mode === "mgr" && S.m && S.m.club >= 0 && !S.m.bench) S.m.bench = mBestBench(S.m.xi);
  return S;
}
