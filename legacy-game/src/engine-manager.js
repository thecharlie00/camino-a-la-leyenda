/* ===== MOTOR · MODO ENTRENADOR =====
   Al retirarte puedes sentarte en un banquillo: plantilla propia (jugadores ficticios en clubes reales),
   once y táctica, fichajes, renovaciones, roles y moral del vestuario. El resto del mundo se simula igual. */
var FORMATIONS = {
  "4-3-3": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MC", "ED", "DC", "EI"],
  "4-4-2": ["POR", "LD", "DFC", "DFC", "LI", "MD", "MC", "MC", "MI", "DC", "DC"],
  "4-2-3-1": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MCD", "ED", "MCO", "EI", "DC"],
  "4-1-2-1-2": ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MC", "MCO", "DC", "DC"],
  "3-5-2": ["POR", "DFC", "DFC", "DFC", "MD", "MCD", "MC", "MC", "MI", "DC", "DC"],
  "3-4-3": ["POR", "DFC", "DFC", "DFC", "MD", "MC", "MC", "MI", "ED", "DC", "EI"],
  "5-3-2": ["POR", "LD", "DFC", "DFC", "DFC", "LI", "MC", "MCD", "MC", "DC", "DC"],
  "4-5-1": ["POR", "LD", "DFC", "DFC", "LI", "MD", "MC", "MCD", "MC", "MI", "DC"]
};
/* coordenadas (x %, y %) de cada hueco en el campo, ataque hacia arriba */
var FORM_XY = {
  "4-3-3": [[50, 91], [86, 70], [62, 76], [38, 76], [14, 70], [50, 57], [71, 45], [29, 45], [82, 21], [50, 13], [18, 21]],
  "4-4-2": [[50, 91], [86, 70], [62, 76], [38, 76], [14, 70], [86, 43], [62, 48], [38, 48], [14, 43], [63, 16], [37, 16]],
  "4-2-3-1": [[50, 91], [86, 70], [62, 76], [38, 76], [14, 70], [63, 57], [37, 57], [83, 32], [50, 35], [17, 32], [50, 13]],
  "4-1-2-1-2": [[50, 91], [86, 70], [62, 76], [38, 76], [14, 70], [50, 60], [71, 48], [29, 48], [50, 35], [63, 15], [37, 15]],
  "3-5-2": [[50, 91], [73, 75], [50, 78], [27, 75], [88, 45], [50, 59], [68, 46], [32, 46], [12, 45], [63, 15], [37, 15]],
  "3-4-3": [[50, 91], [73, 75], [50, 78], [27, 75], [87, 47], [62, 51], [38, 51], [13, 47], [81, 21], [50, 13], [19, 21]],
  "5-3-2": [[50, 91], [89, 64], [71, 76], [50, 79], [29, 76], [11, 64], [72, 47], [50, 55], [28, 47], [63, 16], [37, 16]],
  "4-5-1": [[50, 91], [86, 70], [62, 76], [38, 76], [14, 70], [87, 42], [68, 47], [50, 57], [32, 47], [13, 42], [50, 15]]
};
var ROLES, MENT_NAMES, ROT_NAMES, TRAITS, MFOCUS;
onLang(function () {
  ROLES = {C: {n: tr("Clave"), s: 0.75}, I: {n: tr("Importante"), s: 0.55}, R: {n: tr("Rotación"), s: 0.35}, S: {n: tr("Suplente"), s: 0.15}, P: {n: tr("Promesa"), s: 0.08}};
  MENT_NAMES = [tr("Defensiva"), tr("Equilibrada"), tr("Ofensiva")];
  ROT_NAMES = [tr("Poca"), tr("Normal"), tr("Mucha")];
  TRAITS = {lider: tr("Líder"), conflictivo: tr("Conflictivo"), profesional: tr("Profesional"), fiestero: tr("Fiestero"), ambicioso: tr("Ambicioso")};
  MFOCUS = {
    fisico: {n: tr("Físico"), d: tr("Recuperan antes entre partidos y se lesionan menos."), fx: {sfit: 6}},
    tactica: {n: tr("Táctica"), d: tr("Más química y un plus de nivel en los dos primeros tramos."), fx: {chem: 8, buff: {v: 0.6, b: 2, n: tr("Automatismos")}}},
    tecnica: {n: tr("Técnica"), d: tr("Los jugadores de 25 años o menos progresan un 15 % más."), fx: {}},
    cantera: {n: tr("Cantera"), d: tr("Los de 21 o menos progresan un 35 % más."), fx: {}},
    descanso: {n: tr("Descanso activo"), d: tr("Vestuario contento y fresco, aunque arrancáis algo oxidados."), fx: {sqMor: 6, sfit: 8, buff: {v: -0.5, b: 1, n: tr("Oxidados")}}}
  };
});
var ROLE_ORDER = ["C", "I", "R", "S", "P"];
var MENT = {0: [0.86, 0.84], 1: [1, 1], 2: [1.13, 1.15], bus: [0.72, 0.68], press: [1.2, 1.24]};
var POS_LINE = {POR: 0, LD: 1, DFC: 1, LI: 1, MCD: 2, MC: 2, MD: 2, MI: 2, MCO: 2, ED: 3, EI: 3, DC: 3};
var POS_NEAR = {DC: ["ED", "EI", "MCO"], ED: ["EI", "MD", "DC"], EI: ["ED", "MI", "DC"], MD: ["ED", "MI", "MC", "LD"], MI: ["EI", "MD", "MC", "LI"], MCO: ["MC", "DC", "ED", "EI"],
  MC: ["MCD", "MCO", "MD", "MI"], MCD: ["MC", "DFC"], DFC: ["MCD", "LD", "LI"], LD: ["LI", "DFC", "MD"], LI: ["LD", "DFC", "MI"], POR: []};
var SQUAD_PLAN = [["POR", 3, 1], ["LD", 2, 1], ["DFC", 4, 2], ["LI", 2, 1], ["MCD", 2, 1], ["MC", 3, 2], ["MCO", 2, 0], ["ED", 2, 1], ["EI", 2, 1], ["DC", 3, 1]];
var POS_ORDER = ["POR", "LD", "DFC", "LI", "MCD", "MC", "MD", "MI", "MCO", "ED", "EI", "DC"];

/* ---------- utilidades ---------- */
function mp(k, o) { return Object.assign({k: k, s: ri(1, 999999999)}, o || {}); }
function posFit(pp, sp) {
  if (pp === sp) return 0;
  if (pp === "POR" || sp === "POR") return 25;
  if ((POS_NEAR[pp] || []).indexOf(sp) >= 0) return 3;
  if (POS_LINE[pp] === POS_LINE[sp]) return 7;
  return 12;
}
/* posición compatible: misma línea (portería, defensa, medio, ataque) o demarcación afín; la portería solo para porteros */
function posOk(pp, sp) { return posFit(pp, sp) <= 7; }
function mPl(id) { var sq = S.m ? S.m.sq : []; for (var i = 0; i < sq.length; i++) if (sq[i].id === id) return sq[i]; return null; }
function plName(p) { return p ? (p.fn ? p.fn + " " + p.ln : p.ln) : "—"; }
function plShort(p) { return p ? (p.fn ? p.fn.charAt(0) + ". " + p.ln : p.ln) : "—"; }
function mAvail(p) { return !!p && !p.loanOut && p.inj <= S.tw && p.sus <= 0; }
function mSlotEff(p, slot) { return p.ovr - posFit(p.pos, slot) + clamp((p.mor - 60) / 28 + (p.form - 50) / 30, -2.5, 1.8) - Math.max(0, 55 - p.fit) / 6; }
function mNewSt() { return {apps: 0, st: 0, min: 0, g: 0, a: 0, rs: 0, rn: 0, cs: 0, yc: 0, rc: 0}; }
function mActive() { return S.m.sq.filter(function (p) { return !p.loanOut; }); }
function mWageBill() { var t = 0; S.m.sq.forEach(function (p) { if (!p.loanOut) t += p.sal; }); return t; }
function mSquadAvg() { var a = mActive().slice().sort(function (x, y) { return y.ovr - x.ovr; }).slice(0, 14); return a.length ? a.reduce(function (s, p) { return s + p.ovr; }, 0) / a.length : 60; }
function mAvgMor() { var a = mActive(); return a.length ? a.reduce(function (s, p) { return s + p.mor; }, 0) / a.length : 60; }
function mWageFor(p, club, role) {
  var base = salaryFor(p.ovr, club) * 2.2;
  var rm = {C: 1.25, I: 1.1, R: 1, S: 0.9, P: 0.75}[role || p.role || "R"] || 1;
  var ageM = p.age <= 20 ? 0.6 : p.age <= 22 ? 0.8 : p.age >= 33 ? 0.85 : 1;
  return Math.max(8000, Math.round(base * rm * ageM / 1000) * 1000);
}
function pValue(p) {
  var a = p.age, ageF = a <= 19 ? 1.15 : a <= 22 ? 1.2 : a <= 26 ? 1.1 : a <= 28 ? 1 : a <= 30 ? 0.75 : a <= 32 ? 0.45 : a <= 34 ? 0.25 : 0.1;
  var potF = a <= 23 ? 1 + Math.max(0, p.pot - p.ovr) / 40 : 1;
  var o = Math.min(p.ovr, 85), base = 1e5 * Math.exp((o - 55) / 4.6);
  if (p.ovr > 85) base *= Math.exp((p.ovr - 85) / 8);
  var v = base * ageF * potF * (p.yrs != null && p.yrs <= 1 ? 0.65 : 1);
  return v < 1e6 ? Math.round(v / 1e4) * 1e4 : Math.round(v / 1e5) * 1e5;
}
function mPotFor(age, ovr) { return round1(Math.min(94, ovr + (age <= 19 ? rf(6, 17) : age <= 21 ? rf(4, 12) : age <= 24 ? rf(1, 7) : age <= 27 ? rf(0, 2.5) : 0))); }
function mName(ni) {
  return genName(ni);
}
function mNat(ci) {
  if (chance(0.62)) return ci;
  var conf = W.ctry[ci].conf;
  var cands = range(W.ctry.length).filter(function (i) { return S.nr[i] >= 62 && W.ctry[i].code !== "RU"; });
  var r = wpick(cands, function (i) { return Math.pow(Math.max(1, S.nr[i] - 60), 1.4) * (W.ctry[i].conf === conf ? 2.2 : 1); });
  return r == null ? ci : r;
}
function newPl(o) {
  var m = S.m, nm = o.fn ? {fn: o.fn, ln: o.ln} : mName(o.ni);
  var p = {id: m.nid++, fn: nm.fn, ln: nm.ln, pos: o.pos, age: o.age, ovr: round1(o.ovr), pot: o.pot != null ? o.pot : mPotFor(o.age, o.ovr), nat: o.ni,
    fit: ri(88, 100), mor: ri(58, 72), form: ri(50, 60), sal: 0, yrs: o.yrs || ri(1, 4), role: o.role || "R", tr: o.tr !== undefined ? o.tr : (chance(0.22) ? pick(Object.keys(TRAITS)) : null),
    inj: 0, injN: "", sus: 0, st: mNewSt(), since: S.yr, yth: !!o.yth, caps: 0, tot: {apps: 0, g: 0, a: 0}, ycA: 0, bmin: 0};
  if (o.rid) { p.rid = o.rid; p.rl = 1; }
  return p;
}
/* plantilla ficticia de 25 jugadores al nivel del club */
function genSquad(club) {
  var real = realSquad(club);
  if (real) return real;
  var r = S.cr[club], ci = W.clubs[club].ci, out = [];
  SQUAD_PLAN.forEach(function (x) {
    for (var i = 0; i < x[1]; i++) {
      var tier = i < x[2] ? 0 : (i === x[1] - 1 && x[1] >= 3) || (x[0] === "MCO" && i === 1) ? 2 : 1;
      var age, ovr;
      if (tier === 0) { age = ri(21, 32); ovr = r + gauss() * 2.4 + (age >= 25 && age <= 29 ? 0.8 : -0.4); }
      else if (tier === 1) { age = ri(19, 34); ovr = r - rf(2.5, 6.5) + gauss() * 1.5; }
      else { age = ri(17, 19); ovr = r - rf(9, 15); }
      out.push(newPl({pos: x[0], ovr: clamp(ovr, 40, 93), age: age, ni: mNat(ci), yth: tier === 2 && chance(0.7), yrs: tier === 2 ? ri(2, 3) : ri(1, 5)}));
    }
  });
  var star = out.filter(function (p) { return p.age >= 22 && p.age <= 30 && p.pos !== "POR"; }).sort(function (a, b) { return b.ovr - a.ovr; })[0];
  if (star) { star.ovr = round1(Math.min(94, star.ovr + rf(2, 4))); star.pot = Math.max(star.pot, star.ovr); }
  mAssignRoles(out);
  out.forEach(function (p) { p.sal = mWageFor(p, club); p.since = S.yr - ri(0, Math.min(6, Math.max(0, p.age - 18))); if (p.yth) p.since = S.yr - ri(0, 1); });
  return out;
}
function mAssignRoles(sq) {
  var gk = sq.filter(function (p) { return p.pos === "POR"; }).sort(function (a, b) { return b.ovr - a.ovr; });
  var out = sq.filter(function (p) { return p.pos !== "POR"; }).sort(function (a, b) { return b.ovr - a.ovr; });
  out.forEach(function (p, i) { p.role = i < 4 ? "C" : i < 10 ? "I" : i < 15 ? "R" : (p.age <= 20 ? "P" : "S"); });
  gk.forEach(function (p, i) { p.role = i === 0 ? (out[3] && p.ovr >= out[3].ovr ? "C" : "I") : (p.age <= 20 ? "P" : "S"); });
}

/* ---------- once, valoración y sincronización con el mundo ---------- */
function mBestXI(form, pool) {
  var slots = FORMATIONS[form || S.m.form], used = {}, xi = [], pairs = [], filled = 0;
  var cands = (pool || S.m.sq).filter(mAvail);
  for (var i = 0; i < 11; i++) xi.push(null);
  cands.forEach(function (p) { slots.forEach(function (s, j) { pairs.push([mSlotEff(p, s), p.id, j]); }); });
  pairs.sort(function (a, b) { return b[0] - a[0]; });
  for (var k = 0; k < pairs.length && filled < 11; k++) {
    var pr = pairs[k];
    if (used[pr[1]] || xi[pr[2]] != null) continue;
    xi[pr[2]] = pr[1]; used[pr[1]] = 1; filled++;
  }
  return xi;
}
function mTeamRating(xi, form) {
  var m = S.m, slots = FORMATIONS[form || m.form], sum = 0, fill = mSquadAvg() - 13;
  for (var i = 0; i < 11; i++) { var p = xi[i] != null ? mPl(xi[i]) : null; sum += p ? mSlotEff(p, slots[i]) : fill; }
  return sum / 11 + clamp((m.chem - 50) / 40, -1.25, 1.25);
}
function mBuffs() { var b = 0; S.m.buffs.forEach(function (x) { b += x.v; }); return b; }
function mSync() { var m = S.m; if (m.club < 0) return; S.cr[m.club] = round1(clamp(mTeamRating(mBestXI(m.form)), 35, 95)); }
/* rellenar huecos del once elegido (salidas, cambios de sistema) */
function mFixXI() {
  var m = S.m, slots = FORMATIONS[m.form], used = {};
  if (!m.xi || m.xi.length !== 11) m.xi = mBestXI(m.form);
  for (var i = 0; i < 11; i++) { var p = m.xi[i] != null ? mPl(m.xi[i]) : null; if (!p || p.loanOut || used[p.id]) m.xi[i] = null; else used[p.id] = 1; }
  for (var j = 0; j < 11; j++) {
    if (m.xi[j] != null) continue;
    var best = null, bv = -1e9;
    m.sq.forEach(function (q) { if (used[q.id] || q.loanOut) return; var v = mSlotEff(q, slots[j]) - (mAvail(q) ? 0 : 20); if (v > bv) { bv = v; best = q; } });
    if (best) { m.xi[j] = best.id; used[best.id] = 1; }
  }
  mFixBench();
  if (m.cap == null || !mPl(m.cap)) m.cap = mPickCaptain();
}
function mPickCaptain() {
  var a = mActive().slice().sort(function (x, y) { return mCapScore(y) - mCapScore(x); });
  return a.length ? a[0].id : null;
}
function mCapScore(p) { return p.age * 1.2 + (S.yr - p.since) * 2 + (p.tr === "lider" ? 12 : 0) + (p.role === "C" ? 6 : p.role === "I" ? 3 : 0) - (p.tr === "conflictivo" ? 10 : 0); }
function mSetFormation(f) {
  var m = S.m; if (!FORMATIONS[f]) return;
  var old = m.xi.map(mPl).filter(Boolean), slots = FORMATIONS[f], xi = [], used = {};
  for (var i = 0; i < 11; i++) xi.push(null);
  /* conservar a los que encajan en el nuevo dibujo */
  slots.forEach(function (s, j) {
    var best = null, bv = -1e9;
    old.forEach(function (p) { if (used[p.id]) return; var v = -posFit(p.pos, s, p) * 3 + p.ovr / 10; if (v > bv) { bv = v; best = p; } });
    if (best && posFit(best.pos, s, best) <= 3) { xi[j] = best.id; used[best.id] = 1; }
  });
  m.form = f; m.xi = xi; mFixXI();
}

/* ---------- inicio de la carrera de entrenador ---------- */
function startManager() {
  var p = S.p, r = S.retired;
  if (!r || S.mode === "mgr") return;
  var lg = r.lg || legacy();
  S.mode = "mgr";
  S.m = {fn: p.fn, ln: p.ln, nat: p.inat >= 0 ? p.inat : p.nat, age: p.age, rep: round1(clamp(15 + lg.sc / 25, 10, 70)), club: -1, since: 0, sal: 0, money: 0,
    form: "4-3-3", ment: 1, rot: 1, xi: [], cap: null, sq: [], nid: 1, tid: 0, mk: {open: "", list: [], tx: []},
    board: 60, fans: 55, chem: 50, bud: 0, wcap: 0, objs: [], ss: null, seasons: [], trophies: [], awards: [], tx: [], focus: null, buffs: [],
    flags: {}, evCd: {}, alumni: [], spells: [], peakRep: 0, y0: S.yr + 1, exClub: r.main, lastBlk: null, youth: null, mom: 0};
  S.m.peakRep = S.m.rep;
  S.retiredP = r; S.retired = null;
  if (S.ph === "ret") { mgrSilentSummer(); mgrSilentAwards(); }
  S.cur = null; S.tour = null;
  S.ph = "mjob";
  S.pend = [mp("jobs", {list: mgrJobOffers(false), forced: true, first: true})];
  feed({t: "mstart", y: S.yr + 1, rep: Math.round(S.m.rep)});
}
function mgrSilentSummer() {
  var plan = summerPlan(), made = [];
  plan.list.forEach(function (x) { var c = mkNatTournament(x.T, x.y, {}); if (c) { S.C[x.T.k] = c; made.push(c); } });
  if (plan.cwc) { var cw = mkClubWorldCup(plan.y); S.C.CWC = cw; made.push(cw); }
  for (var w = 41; w <= 48; w++) { S.w = w; S.tw++; weekFixtures(w).forEach(function (f) { if (f.kind !== "nq") recordFixture(f, simFixture(f)); }); }
  made.forEach(function (c) { if (c.win >= 0) histPush(c.tk || c.k, S.yr + 1, c.win); });
}
function mgrSilentAwards() {
  var yEnd = S.yr + 1;
  var rk = S.rv.map(function (r) { var s = rivalSeason(r, yEnd); return {n: r.n, ni: r.ni, club: r.club, sc: bdoScore(s)}; }).sort(function (a, b) { return b.sc - a.sc; });
  if (rk.length) histPush("BDO", yEnd, -1, rk[0].n + "|" + rk[0].ni + "|" + rk[0].club);
  ageRivals();
}
function mgrSalary(c) { return Math.round(4e5 * Math.exp((S.cr[c] - 66) / 7.5) / 1000) * 1000; }
function mBudgetFor(c) { var li = S.cl[c], w = li >= 0 ? W.lg[li].w : 0.5; return Math.round(1.2e6 * Math.exp((Math.min(S.cr[c], 90) - 62) / 6.3) * Math.sqrt(Math.max(0.2, w)) / 1e5) * 1e5; }
function mgrMaxClubR() { return 58 + S.m.rep * 0.32 + 3; }
function mgrJobOffers(lower, upward) {
  var m = S.m, max = mgrMaxClubR(), target = 58 + m.rep * 0.32 - (lower ? 5 : 0), out = [];
  var lo = upward ? Math.max(target - 2, (m.club >= 0 ? S.cr[m.club] : 0) + 1) : target - 5, hi = Math.min(max, upward ? max : target + 2);
  var cands = clubsWhere(function (c) { var li = S.cl[c]; return c !== m.club && li >= 0 && W.lg[li].t <= 2 && S.cr[c] >= lo && S.cr[c] <= hi; });
  if (cands.length < 4 && !upward) cands = clubsWhere(function (c) { return c !== m.club && S.cr[c] >= target - 9 && S.cr[c] <= max; });
  var ex = m.exClub;
  if (ex != null && ex >= 0 && ex !== m.club && S.cl[ex] >= 0 && S.cr[ex] <= max + 3 && !upward && chance(0.6)) out.push(ex);
  while (out.length < 4 && cands.length) {
    var c = wpick(cands, function (i) { return (W.clubs[i].ci === m.nat ? 2.2 : 1) * Math.pow(Math.max(0.2, W.lg[S.cl[i]].w), 0.4); });
    if (c == null) break;
    cands = cands.filter(function (x) { return x !== c; });
    if (out.indexOf(c) < 0) out.push(c);
  }
  if (!out.length && !upward) {
    out = clubsWhere(function (c) { return c !== m.club && S.cr[c] <= max; }).sort(function (a, b) { return Math.abs(S.cr[a] - target) - Math.abs(S.cr[b] - target); }).slice(0, 3);
  }
  return out.map(function (c) { return {club: c, sal: mgrSalary(c), yrs: ri(2, 3)}; });
}
function mgrJoinClub(c, o) {
  var m = S.m, offSeason = S.ph === "mjob" || S.ph === "post" || S.ph === "sblk" || S.ph === "awards" || S.ph === "off";
  if (m.club >= 0) mgrLeaveClub();
  if (S.coach) delete S.coach[c];
  m.club = c;
  m.since = offSeason ? S.yr + 1 : S.yr;
  m.sal = (o && o.sal) || mgrSalary(c);
  m.sq = genSquad(c);
  m.xi = mBestXI(m.form); m.bench = mBestBench(m.xi); m.cap = mPickCaptain();
  m.board = 65; m.fans = c === m.exClub ? 76 : 55; m.chem = 50; m.buffs = [];
  m.bud = Math.round(mBudgetFor(c) * mBudM() / 1e5) * 1e5; m.wcap = Math.round(mWageBill() * 1.12 / 1e5) * 1e5;
  m.spells.push({club: c, y0: m.since, y1: null, w: 0, d: 0, l: 0, tro: 0});
  if (!offSeason) m.ss = {w: 0, d: 0, l: 0, gf: 0, ga: 0, club: c, mid: true};
  mSync();
  if (S.ph === "gap" || S.ph === "pre") { mgrSetObjectives(); if (m.mk.open) m.mk.list = mgrScoutList(12); }
  feed({t: "mjob", y: S.yr, club: c, lg: S.cl[c], r: Math.round(S.cr[c]), bud: m.bud, mid: !offSeason});
  if (S.cr[c] >= 74 && chance(0.45)) S.pend.push(mp("mev", {id: "m_clough"}));
}
function mgrLeaveClub() {
  var m = S.m, sp = m.spells[m.spells.length - 1];
  if (sp && sp.y1 == null) sp.y1 = S.yr;
  m.sq.forEach(function (p) { if (p.tot.apps + p.st.apps >= 40) mgrAlumni(p, tr("Seguía en el club cuando te fuiste")); });
  /* los jugadores reales de la casa vuelven al mundo; el club busca otro entrenador */
  if (S.rp) { var pre = realKey(m.club) + "#"; m.sq.forEach(function (p) { if (p.rid && p.rid.indexOf(pre) === 0) delete S.rp[p.rid]; }); }
  coachLeaves(m.club);
  m.sq = []; m.xi = []; m.bench = []; m.cap = null; m.club = -1; m.buffs = [];
}
function mgrAlumni(p, why) {
  var m = S.m;
  m.alumni.unshift({n: plName(p), pos: p.pos, nat: p.nat, apps: p.tot.apps + p.st.apps, g: p.tot.g + p.st.g, a: p.tot.a + p.st.a, y0: p.since, y1: S.yr, why: why, club: m.club});
  if (m.alumni.length > 60) m.alumni.length = 60;
}
/* aceptar un banquillo desde la interfaz (oferta o club elegido a mano) */
function mgrTakeJob(club, sal) {
  var x = S.pend[0];
  if (!x || x.k !== "jobs") return false;
  if (S.cr[club] > mgrMaxClubR() && !x.list.some(function (o) { return o.club === club; })) return false;
  S.pend.shift();
  var wasStart = S.ph === "mjob";
  mgrJoinClub(club, {sal: sal || mgrSalary(club)});
  if (wasStart) mgrStartSeason();
  mgrCleanPend();
  return true;
}

/* ---------- temporada ---------- */
function mgrStartSeason() {
  var m = S.m;
  S.yr++; m.age++;
  S.w = 0; S.bi = 0; S.cur = null;
  mgrEnsureSquad();
  mFixXI(); mTopBench();
  mSync();
  S.L = W.lg.map(function (l, li) { return newLeagueSeason(li); });
  setupSeasonComps();
  m.ss = {w: 0, d: 0, l: 0, gf: 0, ga: 0, club: m.club};
  m.sq.forEach(function (p) { p.st = mNewSt(); p.bmin = 0; p.rnT = null; });
  if (m.seasons.length || m.flags.started) {
    m.bud = Math.round((m.bud * 0.5 + mBudgetFor(m.club) * mBudM() * (0.55 + m.board / 160)) / 1e5) * 1e5;
    m.wcap = Math.round(Math.max(m.wcap, mWageBill()) * (1.03 + m.board / 1000) / 1e5) * 1e5;
  }
  m.flags.started = true;
  m.focus = null; m.buffs = [];
  mgrSetObjectives();
  m.mk = {open: "verano", list: mgrScoutList(14), tx: []};
  S.ph = "pre"; S.pend = [];
  feed({t: "mseason", y: S.yr, club: m.club, lg: S.cl[m.club], r: Math.round(S.cr[m.club]), objs: m.objs.map(function (o) { return {n: o.n, tk: o.tk, tp: o.tp}; }), bud: m.bud});
  if (m.youth && m.youth.length) S.pend.push(mp("youth"));
  mgrQueueRenewals();
  S.pend.push(mp("mfocus"));
  mgrIncomingOffers();
  pushMgrEvents("verano", 1);
  mgrCheckWages();
}
function mgrEnsureSquad() {
  var m = S.m, r = S.cr[m.club], act = mActive();
  var need = function (pos, n) {
    var have = act.filter(function (p) { return p.pos === pos; }).length;
    for (var i = have; i < n; i++) {
      var p = newPl({pos: pos, ovr: clamp(r - rf(6, 11), 40, 88), age: ri(18, 30), ni: mNat(W.clubs[m.club].ci), yrs: 2, role: "S"});
      p.sal = mWageFor(p, m.club); m.sq.push(p); act.push(p);
      feedNote(tr("El club incorpora a {name} ({pos}) para completar la plantilla.", {name: plName(p), pos: posAb(p.pos)}));
    }
  };
  need("POR", 2); need("DFC", 3); need("MC", 2); need("DC", 2);
  while (mActive().length < 20) { var pos = pick(["LD", "LI", "MCD", "MCO", "ED", "EI"]); need(pos, mActive().filter(function (p) { return p.pos === pos; }).length + 1); }
}
function feedNote(x) { S.mnotes = S.mnotes || []; S.mnotes.push(x); }
function mNews(t, x) { if ((S.ph === "blk" || S.ph === "sblk") && S.bnews) S.bnews.push({t: t, x: x}); else feedNote(x); }
function mgrSetObjectives() {
  var m = S.m, li = S.cl[m.club], L = S.L[li], n = L.tm.length, exp = L.exp.indexOf(m.club) + 1, objs = [], t, txt, lg = W.lg[li];
  var tk, tp = null;
  if (lg.upI >= 0 && exp <= 5) { t = lgUpN(li) || 3; tk = N_("Ascender (top {n})"); tp = {n: t}; }
  else if (exp <= 1) { t = 1; tk = N_("Ganar la liga"); }
  else if (exp <= 4) { t = Math.min(4, exp + 1); tk = N_("Terminar entre los {n} primeros"); tp = {n: t}; }
  else if (exp <= n / 2) { t = Math.round(n / 2); tk = N_("Terminar en la mitad alta"); }
  else if (lg.rel) { t = n - lg.rel; tk = N_("Evitar el descenso"); }
  else { t = n - 2; tk = N_("No acabar en los dos últimos puestos"); }
  objs.push(objT({k: "pos", v: t, main: true}, tk, tp));
  var cup = S.C["CUP:" + W.clubs[m.club].c];
  if (cup && compHas(cup, m.club)) {
    var d = exp <= 2 ? 1 : exp <= 6 ? 2 : 3;
    objs.push(objT({k: "cup", ck: cup.k, v: d}, ["", N_("Llegar a la final de {comp}"), N_("Llegar a semifinales de {comp}"), N_("Llegar a cuartos de {comp}")][d], {comp: cup.n}));
  }
  ["UCL", "LIB", "UEL", "ACL", "CAF", "CCC", "SUD", "UECL", "UCWC", "CCMB"].forEach(function (k) {
    var c = S.C[k];
    if (!c || !compHas(c, m.club)) return;
    var rank = c.teams && c.teams.length ? c.teams.slice().sort(byRating).indexOf(m.club) + 1 : 10;
    if (c.typ === "swiss" || c.typ === "grp") objs.push(objT({k: "cont", ck: k, v: rank <= 6 ? 3 : 9}, rank <= 6 ? N_("Llegar a cuartos de {comp}") : N_("Superar la fase de liga de {comp}"), {comp: c.n}));
    else objs.push(objT({k: "cont", ck: k, v: rank <= 4 ? 2 : 3}, rank <= 4 ? N_("Llegar a semifinales de {comp}") : N_("Llegar a cuartos de {comp}"), {comp: c.n}));
  });
  m.objs = objs;
  queueObjChoice();
}
function compHas(c, club) {
  if (!c) return false;
  if (c.teams && c.teams.indexOf(club) >= 0) return true;
  var inv = false;
  if (c.ko) c.ko.r.forEach(function (rd) { rd.ties.forEach(function (t) { if (t.a === club || t.b === club) inv = true; }); });
  return inv;
}
var STAGE_DEPTH = {"Campeón": 0, "Final": 1, "Semifinales": 2, "Cuartos": 3, "Octavos": 4, "Playoff": 5, "Dieciseisavos": 5, "Treintaidosavos": 6, "Ronda previa": 7, "Challenger Cup": 2, "Primera ronda": 3, "Fase de liga": 9, "Fase de grupos": 9};
function mgrObjProgress(o) {
  var m = S.m;
  if (o.k === "pos") { var p = posInLeague(m.club); return {txt: p > 0 ? ord(p) : "—", met: p > 0 && p <= o.v, pct: p > 0 ? clamp((1 - (p - o.v) / 10) * 100, 5, 100) : 0}; }
  var c = S.C[o.ck];
  if (!c) return {txt: "—", met: false, pct: 0};
  var st = stageReached(c, m.club), d = STAGE_DEPTH[st] != null ? STAGE_DEPTH[st] : 8;
  var alive = c.ko && !c.done && c.ko.r[c.ko.ri] && c.ko.r[c.ko.ri].ties.some(function (t) { return t.w < 0 && (t.a === m.club || t.b === m.club); });
  if (!c.ko && !c.done) alive = true;
  return {txt: st ? tr(st) : "—", met: d <= o.v, alive: alive, pct: clamp((10 - d) / (10 - o.v) * 100, 5, 100)};
}

/* ---------- tramos de partidos ---------- */
function mNewBst() { return {w: 0, d: 0, l: 0, gf: 0, ga: 0, n: 0, lgN: 0, lgPts: 0}; }
function mgrStartBlock() {
  var b = BLOCKS[S.bi];
  S.cur = {w: b[0], end: b[1], prep: false, pm: [], pi: 0, summer: false};
  S.blog = []; S.bnews = (S.mnotes || []).map(function (x) { return {t: "ok", x: x}; }); S.mnotes = [];
  S.momN = 0; S.bst = mNewBst();
  S.m.mk.open = "";
  S.ph = "blk";
  mFixXI();
  return mgrContinue();
}
function mgrContinue() {
  var r = mgrRunWeeks();
  if (r === "done") { if (S.cur && S.cur.summer) mgrSummerDone(); else mgrBlockDone(); }
  return r;
}
function mgrRunWeeks() {
  var cur = S.cur;
  while (cur.w <= cur.end) {
    if (!cur.prep) { mgrPrepWeek(cur.w); cur.prep = true; cur.pi = 0; }
    while (cur.pi < cur.pm.length) {
      var r = mgrPlayFixture(cur.pm[cur.pi]);
      if (r === "pause") return "pause";
      cur.pi++;
    }
    mgrEndWeek();
    cur.w++; cur.prep = false; cur.pm = [];
  }
  return "done";
}
function mgrPrepWeek(w) {
  S.w = w; S.tw++;
  var club = S.m.club, mine = [];
  weekFixtures(w).forEach(function (f) {
    var c = compOfFixture(f);
    if (f.kind !== "nq" && !(c && c.nat) && (f.h === club || f.a === club)) mine.push(f);
    else if (f.kind !== "nq") recordFixture(f, simFixture(f));
  });
  if (INTL_W.indexOf(w) >= 0) mgrIntlWindow();
  mine.sort(function (a, b) { return (a.kind === "lg" ? 0 : 1) - (b.kind === "lg" ? 0 : 1); });
  S.cur.pm = mine;
}
function mgrIntlWindow() {
  var n = 0;
  mActive().forEach(function (p) {
    if (p.inj > S.tw || p.ovr < S.nr[p.nat] - 6 || p.age < 18) return;
    n++; p.caps++; p.fit = clamp(p.fit - 6, 0, 100);
    if (chance(0.018)) mInjure(p, ri(1, 4), tr("con su selección"));
  });
  if (n) S.bnews.push({t: "ok", x: trn(n, "{n} jugador tuyo convocado con sus selecciones.", "{n} jugadores tuyos convocados con sus selecciones.")});
}
function mgrEndWeek() {
  var m = S.m;
  m.sq.forEach(function (p) {
    if (p.loanOut) return;
    var rec = 9 + (m.focus === "fisico" ? 2 : 0) + (p.age <= 23 ? 1 : 0) - (p.age >= 32 ? 1 : 0) - (p.tr === "fiestero" ? 1 : 0);
    p.fit = clamp(p.fit + rec, 0, 100);
    if (p.inj > 0 && p.inj <= S.tw) { if (p.role === "C" || p.role === "I") S.bnews.push({t: "ok", x: tr("{name} recibe el alta médica.", {name: plName(p)})}); p.inj = 0; p.injN = ""; }
    p.mor = p.mor + (62 - p.mor) * 0.03;
  });
}
function mInjure(p, w, where) {
  var x = R(), n;
  if (w) n = w >= 10 ? tr("Lesión de rodilla") : w >= 4 ? tr("Rotura fibrilar") : tr("Sobrecarga muscular");
  else if (x < 0.62) { w = ri(1, 3); n = pick([tr("Sobrecarga muscular"), tr("Esguince de tobillo"), tr("Contusión")]); }
  else if (x < 0.9) { w = ri(4, 8); n = pick([tr("Rotura fibrilar"), tr("Lesión en el isquiotibial"), tr("Esguince de rodilla")]); }
  else if (x < 0.985) { w = ri(10, 18); n = pick([tr("Fractura de peroné"), tr("Lesión de menisco")]); }
  else { w = ri(28, 36); n = tr("Rotura del ligamento cruzado"); }
  p.inj = Math.max(p.inj, S.tw) + w; p.injN = n;
  var injL = LANG === "es" ? n.toLowerCase() : n;
  p.mor = clamp(p.mor - Math.min(10, w), 0, 100);
  if (p.role === "C" || p.role === "I" || w >= 6) mNews("bad", where ? trn(w, "{name}: {inj} {where} ({n} semana).", "{name}: {inj} {where} ({n} semanas).", {name: plName(p), inj: injL, where: where}) : trn(w, "{name}: {inj} ({n} semana).", "{name}: {inj} ({n} semanas).", {name: plName(p), inj: injL}));
}

/* ---------- partido del equipo ---------- */
function mgrPlayFixture(f) {
  if (f.st == null) {
    mgrPrepFixture(f); f.st = 0;
    if (liveWanted(f)) { S.pend.push(mp("mlive", {fi: S.cur.pi, ui: true})); return "pause"; }
    if (mgrWantsPlan(f)) { S.pend.push(mp("mplan", {fi: S.cur.pi})); return "pause"; }
  }
  if (f.st === 0 && f.live && !f.liveDone) {
    if (!S.pend.some(function (x) { return x.k === "mlivew"; })) S.pend.push(mp("mlivew", {fi: S.cur.pi, ui: true}));
    return "pause";
  }
  if (f.st === 0) {
    mgrSimGoals(f); f.st = 1;
    var mo = mgrPickMoment(f);
    if (mo) { f.mom = mo; S.momN = (S.momN || 0) + 1; S.pend.push(mp("mmom", {id: mo.id, fi: S.cur.pi})); return "pause"; }
  }
  if (f.st === 1) {
    mgrExtra(f); f.st = 2;
    if (f.needPens && !f.pens) { S.pend.push(mp("mso", {fi: S.cur.pi})); f.st = 3; return "pause"; }
  }
  if (f.st === 2 || f.st === 3) {
    if (f.needPens && !f.pens) { var so = shootout(0.76, 0.76); f.pens = [so[0], so[1]]; }
    mgrFinish(f); f.st = 4;
  }
  return "ok";
}
/* bajas (lesionados o sancionados) que siguen en el once */
function mUnavXI() {
  var m = S.m, out = [];
  if (!m || m.club < 0 || !m.xi) return out;
  m.xi.forEach(function (id, i) { var p = id != null ? mPl(id) : null; if (p && !p.loanOut && !mAvail(p)) out.push({i: i, p: p}); });
  return out;
}
/* sustituye las bajas por el mejor disponible compatible (primero el banquillo) */
function mFixUnav() {
  var m = S.m, slots = FORMATIONS[m.form], n = 0, used = {};
  m.xi.forEach(function (id) { if (id != null) used[id] = 1; });
  mUnavXI().forEach(function (u) {
    var best = null, bv = -1e9, onB = {};
    (m.bench || []).forEach(function (id) { onB[id] = 1; });
    m.sq.forEach(function (q) {
      if (used[q.id] || !mAvail(q) || !posOk(q.pos, slots[u.i])) return;
      var v = mSlotEff(q, slots[u.i]) + (onB[q.id] ? 4 : 0);
      if (v > bv) { bv = v; best = q; }
    });
    if (best) { m.xi[u.i] = best.id; used[best.id] = 1; m.bench = (m.bench || []).filter(function (id) { return id !== best.id; }); n++; }
  });
  mFixBench();
  return n;
}
function mgrPrepFixture(f) {
  var m = S.m, c = compOfFixture(f);
  f.us = m.club; f.home = f.h === m.club; f.opp = f.home ? f.a : f.h; f.isNat = false;
  f.or = S.cr[f.opp]; f.imp = importance(f, c, m.club, f.opp);
  var seen = m.unav0 || [], bad = mUnavXI().filter(function (u) { return seen.indexOf(u.p.id) >= 0; });
  f.xi = mMatchXI(f); f.ment = m.ment;
  f.tr = mTeamRating(f.xi) + mBuffs();
  if (bad.length) {
    /* saliste con bajas en el once: entra el suplente natural de urgencia y se paga */
    var subs = bad.map(function (u) { var q = mPl(f.xi[u.i]); m.xi[u.i] = f.xi[u.i]; return q; }).filter(Boolean);
    m.bench = (m.bench || []).filter(function (id) { return m.xi.indexOf(id) < 0; });
    mFixXI();
    f.tr -= 2 * bad.length; f.badXI = bad.length;
    mActive().forEach(function (p) { p.mor = clamp(p.mor - 3 * bad.length, 0, 100); });
    m.board = clamp(m.board - 1.5 * bad.length, 0, 100);
    m.unav0 = seen.filter(function (id) { return !bad.some(function (u) { return u.p.id === id; }); });
    if (typeof notify === "function") notify(trn(bad.length, "Alineaste a {names} sin estar disponible. Entra {subs} de urgencia, el equipo lo acusa y el vestuario pierde moral.", "Alineaste a {names} sin estar disponibles. Entran {subs} de urgencia, el equipo lo acusa y el vestuario pierde moral.", {names: bad.map(function (u) { return plShort(u.p); }).join(", "), subs: subs.map(plShort).join(", ") || "—"}), "red");
    mNews("bad", tr("Alineación con bajas: rendimiento penalizado y vestuario molesto."));
  }
  f.forced = []; f.mr = 0;
}
function mgrWantsPlan(f) {
  if (f.imp >= 3) return true;
  if (f.imp >= 2 && f.kind === "ko") return chance([0.25, 0.45, 0.6][S.set.ev]);
  if (f.imp >= 1 && f.kind === "lg" && W.derby[S.m.club + "-" + f.opp]) return chance([0.1, 0.25, 0.4][S.set.ev]);
  return false;
}
function mMatchXI(f) {
  var m = S.m, slots = FORMATIONS[m.form], used = {}, xi = [], c = compOfFixture(f);
  var easy = !!(c && c.dom && f.or < S.cr[m.club] - 5);
  var thr = f.imp >= 2 ? 40 : [50, 62, 72][m.rot] + (easy ? 12 : 0);
  var onB = {};
  (m.bench || []).forEach(function (id) { onB[id] = 1; });
  for (var i = 0; i < 11; i++) {
    var p = m.xi[i] != null ? mPl(m.xi[i]) : null;
    if (p && mAvail(p) && !used[p.id] && p.fit >= thr && !(easy && p.role === "C" && chance(0.5))) { xi.push(p.id); used[p.id] = 1; } else xi.push(null);
  }
  for (var j = 0; j < 11; j++) {
    if (xi[j] != null) continue;
    var best = null, bv = -1e9;
    m.sq.forEach(function (q) {
      if (used[q.id] || !mAvail(q)) return;
      var v = mSlotEff(q, slots[j]) - (q.fit < thr - 8 ? 5 : 0) + (easy && (q.role === "P" || q.role === "S") ? 3 : 0) + (onB[q.id] ? 10 : 0);
      if (v > bv) { bv = v; best = q; }
    });
    if (best) { xi[j] = best.id; used[best.id] = 1; }
  }
  /* banquillo del partido: los suplentes elegidos que siguen disponibles */
  f.bench = (m.bench || []).filter(function (id) { var q = mPl(id); return q && !used[id] && mAvail(q); });
  return xi;
}
function mLambdas(f, ment) {
  var d = (f.tr - f.or) * 0.05 + (f.neutral ? 0 : f.home ? 0.1 : -0.1), M = MENT[ment] || MENT[1];
  return [1.3 * Math.exp(d) * M[0], 1.3 * Math.exp(-d) * M[1]];
}
function mgrSimGoals(f) {
  var L = mLambdas(f, f.ment);
  f.gu = poisson(L[0]); f.gt = poisson(L[1]); f.mg = 0;
  f.gmu = range(f.gu).map(function () { return ri(1, 90); }).sort(function (a, b) { return a - b; });
  f.gmt = range(f.gt).map(function () { return ri(1, 90); }).sort(function (a, b) { return a - b; });
}
function poisP(l, k) { var p = Math.exp(-l); for (var i = 1; i <= k; i++) p *= l / i; return p; }
function wdl(lf, la) {
  var w = 0, d = 0, l = 0;
  for (var i = 0; i <= 10; i++) for (var j = 0; j <= 10; j++) { var p = poisP(lf, i) * poisP(la, j); if (i > j) w += p; else if (i === j) d += p; else l += p; }
  var s = w + d + l; return [w / s, d / s, l / s];
}
function mgrExtra(f) {
  f.etu = 0; f.ett = 0; f.needPens = false;
  if (f.kind !== "ko" || f.leg !== f.legs - 1) return;
  var ag = aggBefore(f), us = f.home ? ag[0] : ag[1], them = f.home ? ag[1] : ag[0];
  if (us + f.gu !== them + f.gt) return;
  var e = extraTime(f.tr, f.or); f.etu = e[0]; f.ett = e[1]; f.et = true;
  if (e[0] === e[1]) f.needPens = true;
}
function mgrPickMoment(f) {
  var lim = [1, 2, 3][S.set.ev] + (S.cur.summer ? 1 : 0);
  if ((S.momN || 0) >= lim) return null;
  var pr = [0.03, 0.07, 0.16, 0.4][f.imp] * [0.7, 1, 1.25][S.set.ev];
  if (!chance(pr)) return null;
  var cands = [];
  MGR_MOMENTS.forEach(function (mm) {
    try {
      if (mm.when && !mm.when(f)) return;
      var min = mm.minute ? mm.minute(f) : ri(20, 85);
      if (mm.whenAt && !mm.whenAt(f, scoreAt(f, min))) return;
      cands.push({mm: mm, min: min});
    } catch (e) {}
  });
  var c = wpick(cands, function (x) { return x.mm.w || 1; });
  if (!c) return null;
  var pid = c.mm.pick ? c.mm.pick(f) : null;
  if (c.mm.pick && pid == null) return null;
  return {id: c.mm.id, min: c.min, pid: pid};
}
function mgrMomCtx(f) {
  var min = f.mom ? f.mom.min : 90;
  return {f: f, min: min, sc: scoreAt(f, min), us: clubName(S.m.club), opp: clubName(f.opp), comp: compShort(f), rn: roundLabel(f), tr: f.tr, or: f.or,
    pl: f.mom && f.mom.pid != null ? mPl(f.mom.pid) : null, xi: f.xi.map(mPl).filter(Boolean)};
}
function mgrApplyMoment(f, res) {
  var min = f.mom ? f.mom.min : 80, i;
  if (res.lock) {
    f.gmu = f.gmu.filter(function (t) { return t < min; }); f.gmt = f.gmt.filter(function (t) { return t < min; });
    f.gu = f.gmu.length; f.gt = f.gmt.length;
    if (f.forced.length > f.gu) f.forced.length = f.gu;
  }
  for (i = 0; i < (res.goal || 0); i++) { f.gu++; f.gmu.push(Math.min(90, min + ri(1, 6))); if (res.scorer != null) f.forced.push(res.scorer); }
  for (i = 0; i < (res.concede || 0); i++) { f.gt++; f.gmt.push(Math.min(90, min + ri(1, 6))); }
  if (res.uncon && f.gt > 0) { f.gt--; f.gmt.pop(); }
  if (res.red && f.mom && f.mom.pid != null) { f.redId = f.mom.pid; f.redMin = min; }
  if (res.red2) { var cand = f.xi.filter(function (id) { return id != null && id !== (f.mom && f.mom.pid); }); if (cand.length) { f.redId = pick(cand); f.redMin = min; } }
  if (res.off && f.mom && f.mom.pid != null) f.subOff = {id: f.mom.pid, min: min};
  return mgrFx(res.fx || {}, f.mom ? f.mom.pid : null);
}
function mgrFinish(f) {
  var m = S.m, c = compOfFixture(f), gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
  var res = gu > gt ? 1 : gu < gt ? -1 : 0, full = 90 + (f.et ? 30 : 0);
  var xi = f.xi.map(mPl).filter(Boolean), mins = {}, played = [];
  xi.forEach(function (p) { mins[p.id] = full; played.push(p); });
  if (f.redId != null && mins[f.redId] != null) mins[f.redId] = f.redMin || 60;
  if (f.subOff && mins[f.subOff.id] != null) mins[f.subOff.id] = f.subOff.min;
  /* partido en directo: los cambios que hiciste */
  if (f.liveSubs && f.liveSubs.length) f.liveSubs.forEach(function (sb) { var q = mPl(sb["in"]); if (!q) return; if (mins[sb.out] != null) mins[sb.out] = Math.min(mins[sb.out], sb.min); mins[q.id] = full - sb.min; played.push(q); });
  /* cambios: entran hasta tres suplentes por los más cansados */
  var bench = f.bench ? f.bench.map(mPl).filter(function (p) { return p && mAvail(p) && f.xi.indexOf(p.id) < 0; }) : m.sq.filter(function (p) { return mAvail(p) && f.xi.indexOf(p.id) < 0; });
  var tired = f.liveSubs ? [] : played.filter(function (p) { return p.id !== f.redId; }).sort(function (a, b) { return a.fit - b.fit; }).slice(0, 3);
  var slots = FORMATIONS[m.form], subs = [];
  if (f.liveSubs) f.liveSubs.forEach(function (sb) { var q = mPl(sb["in"]); if (q) subs.push(q); });
  tired.forEach(function (out) {
    if (out.fit > 82 && !(f.subOff && f.subOff.id === out.id) && chance(0.5)) return;
    var si = f.xi.indexOf(out.id), best = null, bv = -1e9;
    bench.forEach(function (q) { if (subs.indexOf(q) >= 0) return; var v = mSlotEff(q, slots[si]); if (v > bv) { bv = v; best = q; } });
    if (!best) return;
    var on = f.subOff && f.subOff.id === out.id ? f.subOff.min : ri(58, 82);
    mins[out.id] = Math.min(mins[out.id], on); mins[best.id] = full - on; subs.push(best); played.push(best);
  });
  /* goles y asistencias */
  var gl = {}, as = {}, scorers = f.forced.slice(0, gu);
  while (scorers.length < gu && played.length) {
    var sc = wpick(played, function (p) { return ((GOAL_SHARE[p.pos] || 0.01) + 0.004) * Math.max(0.3, 1 + (p.ovr - f.tr) * 0.04) * mins[p.id] / 90; });
    scorers.push(sc ? sc.id : played[0].id);
  }
  scorers.forEach(function (id) {
    gl[id] = (gl[id] || 0) + 1;
    if (chance(0.78)) { var a = wpick(played.filter(function (p) { return p.id !== id; }), function (p) { return (AST_SHARE[p.pos] || 0.01) * mins[p.id] / 90; }); if (a) as[a.id] = (as[a.id] || 0) + 1; }
  });
  /* sanciones cumplidas por los que no podían jugar */
  m.sq.forEach(function (p) { if (p.sus > 0 && !mins[p.id] && !p.loanOut) p.sus--; });
  var names = [], best = null;
  played.forEach(function (p) {
    var mn = mins[p.id] || 0; if (mn <= 0) return;
    var frac = Math.min(1, mn / 90), g = gl[p.id] || 0, a = as[p.id] || 0, grp = W.pos[p.pos].g, sub = subs.indexOf(p) >= 0;
    var r = 6.45 + clamp((p.ovr - f.or) * 0.015, -0.4, 0.4) + res * 0.25 + g * 0.9 + a * 0.5 + gauss() * 0.5;
    if (grp === "DEF" || grp === "POR") { if (gt === 0 && mn >= 60) r += grp === "POR" ? 0.6 : 0.4; r -= gt * (grp === "POR" ? 0.22 : 0.12); }
    if (sub) r = 6.3 + (r - 6.3) * 0.55;
    if (p.id === f.redId) r -= 1.2;
    r = clamp(round1(r), 3.5, 10);
    var st = p.st; st.apps++; if (!sub) st.st++; st.min += mn; st.g += g; st.a += a; st.rs += r; st.rn++;
    if ((grp === "DEF" || grp === "POR") && gt === 0 && mn >= 60) st.cs++;
    p.bmin = (p.bmin || 0) + mn;
    p.fit = clamp(p.fit - frac * (7 + (p.age >= 31 ? 2 : 0) + (f.ment === 2 || f.ment === "press" ? 1.5 : 0)) * (typeof wkFitK === "function" ? wkFitK(f) : 1), 5, 100);
    var risk = 0.0075 * frac * (typeof wkInjK === "function" ? wkInjK() : 1) * (1 + Math.max(0, 60 - p.fit) / 30) * (m.focus === "fisico" ? 0.85 : 1) * (p.tr === "profesional" ? 0.85 : p.tr === "fiestero" ? 1.2 : 1);
    if (chance(risk)) mInjure(p);
    if (chance(({DFC: 0.17, MCD: 0.17, LD: 0.12, LI: 0.12, MC: 0.12}[p.pos] || 0.07) * frac)) { st.yc++; p.ycA = (p.ycA || 0) + 1; if (p.ycA >= 5) { p.ycA = 0; p.sus += 1; S.bnews.push({t: "bad", x: tr("{name} cumplirá un partido por acumulación de amarillas.", {name: plName(p)})}); } }
    if (p.id === f.redId || (f.redId == null && chance(0.008 * frac))) { if (p.id !== f.redId) f.redId = p.id; st.rc++; p.sus += 1; S.bnews.push({t: "bad", x: tr("Roja para {name} ante el {club}.", {name: plName(p), club: clubName(f.opp)})}); }
    p.form = clamp(50 + (p.form - 50) * 0.75 + (r - 6.6) * 6, 0, 100);
    p.mor = clamp(p.mor + 0.3 + res * (res > 0 ? 0.8 : 1), 0, 100);
    if (g) names.push(plShort(p) + (g > 1 ? " (" + g + ")" : ""));
    if (!best || r > best.r) best = {r: r, n: plShort(p)};
  });
  m.sq.forEach(function (p) {
    if (mins[p.id] || p.loanOut) return;
    p.form = 50 + (p.form - 50) * 0.92;
    if (mAvail(p) && (p.role === "C" || p.role === "I")) p.mor = clamp(p.mor - 1.2 - (f.bench && f.bench.indexOf(p.id) < 0 ? 0.6 : 0), 0, 100);
    p.mor = clamp(p.mor + res * 0.3, 0, 100);
  });
  /* balance */
  var pens = f.pens, rr = res !== 0 ? res : 0;
  if (rr > 0) { m.ss.w++; S.bst.w++; } else if (rr < 0) { m.ss.l++; S.bst.l++; } else { m.ss.d++; S.bst.d++; }
  var sp = m.spells[m.spells.length - 1]; if (sp) { if (rr > 0) sp.w++; else if (rr < 0) sp.l++; else sp.d++; }
  m.ss.gf += gu; m.ss.ga += gt; S.bst.gf += gu; S.bst.ga += gt; S.bst.n++;
  if (f.kind === "lg") { S.bst.lgN++; S.bst.lgPts += rr > 0 ? 3 : rr === 0 ? 1 : 0; }
  m.recent = (m.recent || []).concat([rr > 0 ? "W" : rr < 0 ? "L" : "D"]).slice(-6);
  var lastU = f.gmu.length ? Math.max.apply(null, f.gmu) : 0;
  if (rr > 0 && f.imp >= 2 && lastU >= 85 && gu - gt === 1) m.flags.lateWinner = S.yr * 10 + S.bi;
  /* registrar en la competición */
  var r3 = f.home ? {gh: f.gu, ga: f.gt, eh: f.etu, ea: f.ett} : {gh: f.gt, ga: f.gu, eh: f.ett, ea: f.etu};
  if (f.et) r3.et = true;
  if (pens) { if (f.home) { r3.ph = pens[0]; r3.pa = pens[1]; } else { r3.ph = pens[1]; r3.pa = pens[0]; } }
  recordFixture(f, r3);
  S.blog.push({c: logLabel(f), r: roundLabel(f), o: f.opp, h: f.home ? 1 : 0, gu: gu, gt: gt, p: pens || null, et: f.et ? 1 : 0, sc: names.slice(0, 3), x: f.imp, w: S.w, mom: f.mom ? 1 : 0, best: best ? best.n : null});
  mgrKoNews(f, c);
}
function mgrKoNews(f, c) {
  if (!c || f.kind !== "ko" || f.leg !== f.legs - 1) return;
  var t = c.ko.r[f.ri].ties[f.ti];
  if (t.w < 0) return;
  var won = t.w === S.m.club;
  if (f.fin) {
    if (won) { mgrAddTrophy(c.k, c.n); S.bnews.push({t: "trophy", x: f.pens ? tr("¡CAMPEONES! {comp} en los penaltis.", {comp: trComp(c.n)}) : tr("¡CAMPEONES! {comp}.", {comp: trComp(c.n)})}); }
    else { S.bnews.push({t: "bad", x: tr("Final perdida: {comp}.", {comp: trComp(c.n)})}); S.m.board = clamp(S.m.board - 2, 0, 100); }
  } else if (won) { var nx = c.ko.r[f.ri + 1]; if (nx) S.bnews.push({t: "ok", x: tr("{comp}: pasáis a {round}.", {comp: trComp(c.n), round: lcT(tr(nx.n))})}); }
  else S.bnews.push({t: "bad", x: tr("{comp}: eliminados en {round}.", {comp: trComp(c.n), round: lcT(tr(f.rn))})});
}
function mgrAddTrophy(k, name) {
  var m = S.m, c = S.C[k], base = k.split(":")[0];
  var w = k.indexOf("L:") === 0 ? LEAGUE_TROPHY_W(W.lgIdx[k.slice(2)]) : COMP_TROPHY_W[c && c.tk ? c.tk : base] || (base === "CUP" ? 3 : base === "SC" ? 1 : 2);
  m.trophies.push({k: c && c.tk ? c.tk : k, n: name, y: S.yr + (S.cur && S.cur.summer ? 1 : 0), club: m.club, w: w, s: seasonLabel(S.yr)});
  m.rep = clamp(m.rep + Math.min(6, w / 3), 0, 100); m.peakRep = Math.max(m.peakRep, m.rep);
  m.board = clamp(m.board + Math.min(14, 3 + w / 2), 0, 100); m.fans = clamp(m.fans + Math.min(12, 3 + w / 2), 0, 100);
  m.sq.forEach(function (p) { if (!p.loanOut) p.mor = clamp(p.mor + 6, 0, 100); });
  var sp = m.spells[m.spells.length - 1]; if (sp) sp.tro++;
}

/* ---------- final de tramo ---------- */
function mgrBlockDone() {
  var m = S.m, b = BLOCKS[S.bi], bst = S.bst, li = S.cl[m.club], L = S.L[li];
  mgrGrowth();
  mgrMoraleRoles();
  m.buffs.forEach(function (x) { x.b--; }); m.buffs = m.buffs.filter(function (x) { return x.b > 0; });
  m.chem = clamp(m.chem + (bst.w - bst.l) * 0.7 + (55 - m.chem) * 0.1 + 1, 0, 100);
  var n = L.tm.length, exp = L.exp.indexOf(m.club) + 1, expP = 2.3 - 1.4 * (exp - 1) / Math.max(1, n - 1);
  if (bst.lgN >= 2) {
    var d = bst.lgPts / bst.lgN - expP;
    m.board = clamp(m.board + clamp(d * 8, -8, 8), 0, 100);
    m.fans = clamp(m.fans + clamp(d * 7, -7, 6), 0, 100);
    if (S.yr === m.since && S.bi <= 2) m.board = Math.max(m.board, 30);
  }
  if (bst.lgN >= 4 && bst.lgPts / bst.lgN >= 2.55 && chance(0.4)) {
    m.awards.push(awd("mgr_month", "Entrenador del mes ({lg})", {lg: W.lg[li].n}, S.yr));
    S.bnews.push({t: "star", x: tr("Entrenador del mes en {lg}.", trParams({lg: W.lg[li].n}))}); m.rep = clamp(m.rep + 1, 0, 100);
  }
  m.money += m.sal / 5;
  mgrCheckWages();
  m.lastBlk = {w: bst.w, d: bst.d, l: bst.l, gf: bst.gf, ga: bst.ga, n: bst.n};
  feed({t: "mblock", y: S.yr, bi: S.bi, lab: b[2], log: S.blog, news: S.bnews, st: {w: bst.w, d: bst.d, l: bst.l, gf: bst.gf, ga: bst.ga}, pos: posInLeague(m.club), lg: li, club: m.club,
    board: Math.round(m.board), fans: Math.round(m.fans)});
  S.cur = null;
  /* 4.7: el ultimátum de la directiva se decide al acabar su tramo */
  if (typeof blpUltBlock === "function" && blpUltBlock(bst) < 0) m.board = 0;
  if (S.bi < 4) {
    S.bi++; S.ph = "gap";
    if (!m.owner && m.board < mSackT(0) && !(typeof blpUltimatum === "function" && blpUltimatum(0))) { mgrSacked(); return; }
    mgrQueueBetween(S.bi);
  } else mgrSeasonEnd();
}
function mgrCheckWages() {
  var m = S.m;
  if (mWageBill() > m.wcap * 1.04) { m.board = clamp(m.board - 2, 0, 100); mNews("bad", tr("La masa salarial supera el tope que marca la directiva.")); }
}
function mgrGrowth() {
  var m = S.m, n = Math.max(1, S.bst.n);
  m.sq.forEach(function (p) {
    var a = p.age, rate = a <= 17 ? 0.33 : a <= 19 ? 0.28 : a <= 21 ? 0.22 : a <= 23 ? 0.16 : a <= 25 ? 0.1 : a <= 27 ? 0.06 : a <= 29 ? 0.03 : 0.01;
    var gap = Math.max(0, p.pot - p.ovr);
    var share = p.loanOut ? 0.75 : clamp((p.bmin || 0) / (n * 90), 0, 1);
    var focusF = m.focus === "tecnica" && a <= 25 ? 1.15 : m.focus === "cantera" && a <= 21 ? 1.35 : 1;
    var trF = p.tr === "profesional" ? 1.12 : p.tr === "fiestero" ? 0.88 : 1;
    var g = gap * rate / 5 * (0.5 + 0.8 * share) * focusF * trF * (0.9 + p.mor / 500);
    if (p.ovr >= p.pot) g = Math.min(g, 0.03);
    if (a >= 30) g -= Math.pow(a - 29, 1.3) * 0.36 / 5 * (p.tr === "profesional" ? 0.8 : 1);
    if (p.inj > S.tw + 8) g -= 0.12;
    p.ovr = round1(clamp(p.ovr + g, 30, 95));
  });
}
function mgrMoraleRoles() {
  var m = S.m, n = S.bst.n, avg = mSquadAvg();
  if (!n) return;
  m.sq.forEach(function (p) {
    if (p.loanOut) { p.bmin = 0; return; }
    var share = (p.bmin || 0) / (n * 90), exp = ROLES[p.role].s, avail = p.inj <= S.tw, d = 0;
    if (avail && share < exp - 0.25) d = exp >= 0.55 ? -9 : -5;
    else if (avail && share < exp - 0.12) d = -3;
    else if (share >= exp) d = 2.5;
    if (p.tr === "conflictivo") d *= 1.5;
    if (p.tr === "profesional" && d < 0) d *= 0.6;
    if (p.tr === "ambicioso" && d < 0) d *= 1.25;
    if (p.prom && avail && share < 0.45) { d -= 10; S.bnews.push({t: "bad", x: tr("{name} se siente engañado: le prometiste ser jugador Clave.", {name: plName(p)})}); p.prom = null; }
    p.mor = clamp(p.mor + d, 0, 100);
    p.bmin = 0;
    /* como mucho una petición de salida por tramo y dos por temporada: que no tape al resto de historias */
    var rq = m.reqY && m.reqY.y === S.yr ? m.reqY : (m.reqY = {y: S.yr, n: 0, bi: -1});
    if (p.mor < 30 && !p.req && rq.n < 2 && rq.bi !== S.bi && (p.role === "C" || p.role === "I" || p.ovr >= avg - 1) && chance(0.55)) {
      rq.n++; rq.bi = S.bi;
      p.req = true; S.bnews.push({t: "bad", x: tr("{name} pide salir del club.", {name: plName(p)})});
      S.pend.push(mp("mev", {id: "m_peticion", pid: p.id}));
    }
  });
}
function mgrQueueBetween(nextBi) {
  var m = S.m;
  if (nextBi === 3) {
    m.mk.open = "invierno"; m.mk.list = mgrScoutList(10); m.mk.tx = m.mk.tx || [];
    mgrIncomingOffers();
  }
  var n = [1, 1, 2][S.set.ev] + (chance([0.15, 0.45, 0.55][S.set.ev]) ? 1 : 0);
  pushMgrEvents("temporada", n);
  maybePress();
}
function mgrSacked() {
  var m = S.m, old = m.club;
  feed({t: "msacked", y: S.yr, club: old, board: Math.round(m.board)});
  m.rep = clamp(m.rep - 6, 0, 100);
  m.lastClub = old;
  mgrLeaveClub();
  S.pend = S.pend.filter(function (x) { return x.k === "jobs"; });
  S.pend.push(mp("jobs", {list: mgrJobOffers(true), forced: true, sacked: true}));
}

/* ---------- final de temporada ---------- */
function mgrSeasonEnd() {
  var m = S.m, li = S.cl[m.club], pos = posInLeague(m.club), L = W.lg[li], news = [];
  var exp = S.L[li].exp.indexOf(m.club) + 1;
  var objs = m.objs.map(function (o) { var pr = mgrObjProgress(o); return {n: o.n, tk: o.tk, tp: o.tp, met: pr.met, main: o.main, lv: o.lv}; });
  if (pos === 1) { mgrAddTrophy("L:" + L.id, L.n); news.push({t: "trophy", x: tr("¡Campeones de {lg}!", trParams({lg: L.n}))}); }
  if (L.upI >= 0 && (typeof lgPromoted === "function" ? lgPromoted(li, m.club) : pos <= lgUpN(li))) { news.push({t: "star", x: tr("¡Ascenso a {lg}!", trParams({lg: lgDivRaw(L.upI)}))}); m.board = clamp(m.board + 10, 0, 100); m.rep = clamp(m.rep + 3, 0, 100); }
  if (L.downI >= 0 && pos > S.L[li].tm.length - L.rel) { news.push({t: "bad", x: tr("Descenso a {lg}.", trParams({lg: lgDivRaw(L.downI)}))}); m.board = clamp(m.board - 20, 0, 100); m.rep = clamp(m.rep - 4, 0, 100); }
  objs.forEach(function (o) { var k = objMultOf(o, o.met); m.board = clamp(m.board + (o.met ? (o.main ? 10 : 5) : (o.main ? -10 : -4)) * k, 0, 100); if (o.met && o.lv >= 2) m.rep = clamp(m.rep + o.lv - 1, 0, 100); });
  m.rep = clamp(m.rep + clamp((exp - pos) * 0.35, -4, 3.5) + objs.filter(function (o) { return o.met; }).length * 0.5 + (50 - m.rep) * 0.03, 0, 100);
  m.peakRep = Math.max(m.peakRep, m.rep);
  if ((pos === 1 && chance(0.55)) || (pos <= exp - 5 && chance(0.5))) {
    m.awards.push(awd("mgr_lg", "Mejor entrenador de {lg}", {lg: L.n}, S.yr + 1)); news.push({t: "star", x: tr("Mejor entrenador de {lg}.", trParams({lg: L.n}))}); m.rep = clamp(m.rep + 3, 0, 100);
  }
  var tro = m.trophies.filter(function (t) { return t.s === seasonLabel(S.yr); });
  m.seasons.push({y: S.yr, club: m.club, lg: li, pos: pos, w: m.ss.w, d: m.ss.d, l: m.ss.l, gf: m.ss.gf, ga: m.ss.ga, tro: tro.map(function (t) { return t.n; }), r: Math.round(S.cr[m.club]), board: Math.round(m.board), mid: !!m.ss.mid, exp: exp});
  seasonEndWorld();
  pruneComps([m.club]);
  var after = mgrSquadSeasonEnd();
  m.youth = mgrGenYouth(3);
  maybeNickMgr();
  feed({t: "mseasonEnd", y: S.yr, club: m.club, lg: li, pos: pos, row: m.seasons[m.seasons.length - 1], objs: objs, news: news.concat(after), board: Math.round(m.board)});
  S.ph = "post";
  if (!m.owner && (m.board < mSackT(1) || (typeof blpMustGo === "function" && blpMustGo())) && !(typeof blpUltimatum === "function" && blpUltimatum(1))) { mgrSacked(); return; }
  var big = tro.some(function (t) { return t.w >= 10; });
  if (m.owner) { /* el dueño no recibe ofertas de otros banquillos */ }
  else if (big && S.yr - m.since >= 1 && chance(0.5)) S.pend.push(mp("mev", {id: "m_zidane", tn: tro.sort(function (a, b) { return b.w - a.w; })[0].n}));
  else if (chance(clamp((m.rep - 28) / 110, 0.04, 0.45))) { var jo = mgrJobOffers(false, true).filter(function (o) { return S.cr[o.club] > S.cr[m.club] + 1; }); if (jo.length) S.pend.push(mp("jobs", {list: jo, forced: false})); }
  if (m.age >= 66) S.pend.push(mp("mev", {id: "m_retiro"}));
}
function mgrSquadSeasonEnd() {
  var m = S.m, news = [], gone = [];
  m.sq.forEach(function (p) {
    p.tot.apps += p.st.apps; p.tot.g += p.st.g; p.tot.a += p.st.a;
    p.lastSt = {apps: p.st.apps, g: p.st.g, a: p.st.a, cs: p.st.cs, rt: p.st.rn ? round1(p.st.rs / p.st.rn) : 6.4};
    p.age++;
    if (p.loanOut) { p.loanOut = null; p.ovr = round1(Math.min(p.pot, p.ovr + rf(0, 1.5))); news.push({t: "ok", x: tr("{name} vuelve de su cesión con {ovr} de media.", {name: plName(p), ovr: Math.round(p.ovr)})}); }
    p.yrs--;
    p.st = mNewSt();
    if (p.leaveTo) { gone.push([p, tr("Traspasado al {club}", {club: clubName(p.leaveTo.club)}), p.leaveTo.club, p.leaveTo.fee]); return; }
    var retire = (p.age >= 37) || (p.age >= 35 && chance(0.45)) || (p.age >= 33 && p.ovr < 55 && chance(0.5));
    if (retire) { gone.push([p, tr("Se retira"), -1, 0, true]); return; }
    if (p.yrs <= 0) gone.push([p, tr("Se va libre al acabar su contrato"), -1, 0]);
  });
  gone.forEach(function (g) {
    var p = g[0];
    news.push({t: g[4] ? "ok" : "bad", x: g[3] ? tr("{name}: {why} ({fee}).", {name: plName(p), why: lcT(g[1]), fee: fmtMoney(g[3])}) : tr("{name}: {why}.", {name: plName(p), why: lcT(g[1])})});
    if (g[3]) m.bud += g[3];
    mgrRemovePlayer(p, g[1], g[2], g[3], true);
  });
  mFixXI();
  return news;
}
function mgrGenYouth(n) {
  var m = S.m, r = S.cr[m.club], out = [];
  for (var i = 0; i < n; i++) {
    var age = ri(16, 17), ovr = clamp(r - rf(12, 20), 38, 75);
    var pot = round1(clamp(r + rf(-5, 7) + (m.focus === "cantera" ? 2 : 0) + (m.flags.youthBoost ? 3 : 0) + (typeof facYouthB === "function" ? facYouthB() : 0), ovr + 6, 92));
    var nm = mName(chance(0.85) ? W.clubs[m.club].ci : mNat(W.clubs[m.club].ci));
    out.push({fn: nm.fn, ln: nm.ln, pos: pick(POS_ORDER), age: age, ovr: round1(ovr), pot: pot, nat: W.clubs[m.club].ci});
  }
  return out;
}
function mgrMakeYouth(y) {
  var m = S.m;
  y = y || mgrGenYouth(1)[0];
  var p = newPl({fn: y.fn, ln: y.ln, pos: y.pos, ovr: y.ovr, pot: y.pot, age: y.age, ni: y.nat, yth: true, yrs: 3, role: "P"});
  p.sal = mWageFor(p, m.club, "P");
  return p;
}

/* ---------- verano y gala ---------- */
function mgrStartSummer() {
  var plan = summerPlan(), m = S.m, made = [];
  plan.list.forEach(function (x) { var c = mkNatTournament(x.T, x.y, {}); if (c) { S.C[x.T.k] = c; made.push(c); } });
  if (plan.cwc) { var cw = mkClubWorldCup(plan.y); S.C.CWC = cw; made.push(cw); }
  S.sumMade = made.map(function (c) { return c.k; });
  S.cur = {w: 41, end: 48, prep: false, pm: [], pi: 0, summer: true};
  S.blog = []; S.bnews = []; S.momN = 0; S.bst = mNewBst();
  S.ph = "sblk";
  var inCwc = m.club >= 0 && S.C.CWC && S.C.CWC.teams.indexOf(m.club) >= 0;
  if (!inCwc) { var r, guard = 0; do { r = mgrContinue(); } while (r === "pause" && guard++ < 50); }
  else mgrContinue();
}
function mgrSummerDone() {
  var m = S.m, cards = [];
  (S.sumMade || []).forEach(function (k) {
    var c = S.C[k]; if (!c) return;
    var mine = !c.nat && m.club >= 0 && c.teams.indexOf(m.club) >= 0;
    if (c.win >= 0) histPush(c.tk || k, S.yr + 1, c.win);
    cards.push({k: k, n: c.n, nat: !!c.nat, win: c.win, stage: mine ? stageReached(c, m.club) : null, mine: mine});
    if (c.nat && c.win >= 0) {
      var champs = mActive().filter(function (p) { return p.nat === c.win && p.ovr >= S.nr[p.nat] - 6; });
      if (champs.length) S.bnews.push({t: "star", x: trn(champs.length, "{names} gana el {comp} con {nat}.", "{names} ganan el {comp} con {nat}.", {names: champs.map(plShort).join(", "), comp: trComp(c.n), nat: natName(c.win)})});
      champs.forEach(function (p) { p.mor = clamp(p.mor + 10, 0, 100); });
    }
    if (c.nat) mActive().forEach(function (p) { if (c.teams.indexOf(p.nat) >= 0 && p.ovr >= S.nr[p.nat] - 6) p.fit = clamp(p.fit - 8, 0, 100); });
  });
  feed({t: "summer", y: S.yr + 1, cards: cards, log: S.blog, news: S.bnews, tour: null, mgr: true});
  S.cur = null;
  S.ph = "awards";
}
function mgrAwards() {
  var m = S.m, yEnd = S.yr + 1, ranking = [], out = [];
  S.rv.forEach(function (r) { var s = rivalSeason(r, yEnd); ranking.push({n: r.n, ni: r.ni, club: r.club, sc: bdoScore(s)}); });
  var row = m.seasons[m.seasons.length - 1], troPts = 0;
  m.trophies.forEach(function (t) { if (row && t.s === seasonLabel(row.y)) troPts += t.w; });
  mActive().forEach(function (p) {
    if (p.ovr < 80 || !p.tot) return;
    var last = p.lastSt; if (!last || last.apps < 20) return;
    var sc = bdoScore({ovr: p.ovr, avgR: last.rt, apps: last.apps, troph: troPts, clubR: S.cr[m.club], g: W.pos[p.pos].g, goals: last.g, ast: last.a, cs: last.cs});
    ranking.push({n: plShort(p), ni: p.nat, club: m.club, sc: sc, mine: true, pid: p.id});
  });
  ranking.sort(function (a, b) { return b.sc - a.sc; });
  var mineTop = ranking.slice(0, 3).filter(function (x) { return x.mine; });
  if (ranking[0] && ranking[0].mine) { out.push({k: "bdo", n: tr("{name} gana el Balón de Oro {year}", {name: ranking[0].n, year: yEnd})}); m.fans = clamp(m.fans + 6, 0, 100); m.rep = clamp(m.rep + 2, 0, 100); var bp = mPl(ranking[0].pid); if (bp) bp.mor = clamp(bp.mor + 12, 0, 100); }
  else if (mineTop.length) out.push({k: "bdo_pod", n: tr("{name} acaba en el podio del Balón de Oro", {name: mineTop[0].n}), minor: true});
  if (troPts >= 22 || (troPts >= 14 && m.rep >= 70)) {
    if (chance(0.55)) { out.push(awd("mgr_year", "Mejor entrenador del año {y}", {y: yEnd}, yEnd)); m.awards.push(awd("mgr_year", "Mejor entrenador del año {y}", {y: yEnd}, yEnd)); m.rep = clamp(m.rep + 5, 0, 100); }
  }
  feed({t: "awards", y: yEnd, top: ranking.slice(0, 10).map(function (x) { return {n: x.n, ni: x.ni, club: x.club, me: !!x.mine}; }), pos: 0, won: out, mgr: true});
  if (ranking.length) histPush("BDO", yEnd, -1, ranking[0].n + "|" + ranking[0].ni + "|" + ranking[0].club);
  ageRivals();
  S.ph = "off";
}

/* ---------- mercado ---------- */
function mgrNeeds() {
  var act = mActive(), avg = mSquadAvg(), needs = {};
  POS_ORDER.forEach(function (pos) {
    var ps = act.filter(function (p) { return p.pos === pos; }), best = ps.length ? Math.max.apply(null, ps.map(function (p) { return p.ovr; })) : 0;
    var want = {POR: 2, DFC: 3, MC: 2, DC: 2}[pos] || 1;
    needs[pos] = 1 + Math.max(0, want - ps.length) * 2 + Math.max(0, avg - best) / 2 + (ps.some(function (p) { return p.age >= 32; }) ? 0.6 : 0);
  });
  return needs;
}
function mgrScoutList(n) {
  var m = S.m, myR = S.cr[m.club], out = [], needs = mgrNeeds();
  var pool = clubsWhere(function (c) { return c !== m.club && S.cr[c] >= myR - 8 && S.cr[c] <= myR + 5; });
  for (var i = 0; i < n && pool.length; i++) {
    var pos = wpick(Object.keys(needs), function (k) { return needs[k]; });
    var club = pick(pool), star = chance(0.16), young = !star && chance(0.32);
    var rt = chance(0.85) ? realTargetFor(club, pos, young) : null;
    if (rt) { out.push(mgrNewTarget(Object.assign({club: club}, rt))); continue; }
    var age = young ? ri(18, 22) : ri(23, 32);
    var ovr = S.cr[club] + gauss() * 2.6 + (star ? rf(2, 5) : 0) - (young ? rf(2, 6) : 0);
    if (ovr > 88) ovr = 88 + (ovr - 88) * 0.4;
    out.push(mgrNewTarget({pos: pos, age: age, ovr: clamp(ovr, 45, 92), club: club, ni: mNat(W.clubs[club].ci)}));
  }
  for (var j = 0; j < 2; j++) {
    var p2 = wpick(Object.keys(needs), function (k) { return needs[k]; });
    out.push(mgrNewTarget({pos: p2, age: ri(29, 34), ovr: clamp(myR - rf(1, 7), 45, 90), club: -1, ni: mNat(W.clubs[m.club].ci)}));
  }
  return out;
}
function mgrNewTarget(o) {
  var m = S.m, nm = o.ln ? {fn: o.fn || "", ln: o.ln} : mName(o.ni), pot = o.pot != null ? o.pot : mPotFor(o.age, o.ovr);
  var t = {id: "t" + (m.tid = (m.tid || 0) + 1), fn: nm.fn, ln: nm.ln, pos: o.pos, age: o.age, ovr: round1(o.ovr), pot: pot, nat: o.ni, club: o.club,
    tr: o.rid ? (o.tr || null) : (chance(0.2) ? pick(Object.keys(TRAITS)) : null), tries: 0, done: null, rid: o.rid || null};
  t.val = pValue({ovr: t.ovr, age: t.age, pot: t.pot, yrs: 3});
  var key = o.club >= 0 && t.ovr >= S.cr[o.club] + 2;
  t.key = key;
  t.ask = o.club < 0 ? 0 : Math.round(t.val * rf(1.05, 1.35) * (key ? 1.2 : 1) * (m.flags.data ? 0.9 : 1) / 1e5) * 1e5;
  t.sal = Math.round(mWageFor({ovr: t.ovr, age: t.age}, m.club, "I") * rf(1.05, 1.3) / 1000) * 1000;
  t.yrsD = t.age <= 24 ? 5 : t.age <= 28 ? 4 : t.age <= 31 ? 3 : 2;
  var err = m.flags.data ? 1 : t.age <= 24 ? 4 : 2;
  t.potR = [Math.round(Math.max(t.ovr, t.pot - rf(0, err))), Math.round(Math.min(95, t.pot + rf(0, err)))];
  var theirR = o.club >= 0 ? S.cr[o.club] : S.cr[m.club] - 5;
  t.int = round1(clamp(52 + (S.cr[m.club] - theirR) * 6 + (m.rep - 40) / 3, 5, 95));
  return t;
}
function mgrTarget(tid) { var l = S.m.mk.list || []; for (var i = 0; i < l.length; i++) if (l[i].id === tid) return l[i]; return null; }
function mgrStartBid(tid) {
  var m = S.m, t = mgrTarget(tid);
  if (!t || t.done || !m.mk.open || m.club < 0) return false;
  if (typeof negoStart === "function") return negoStart(tid);
  S.pend.unshift(t.club < 0 ? mp("terms", {tid: tid, fee: 0, ui: true}) : mp("bid", {tid: tid, ui: true}));
  return true;
}
function mgrSign(t, fee, sal, role, promise) {
  var m = S.m;
  var p = newPl({fn: t.fn, ln: t.ln, pos: t.pos, ovr: t.ovr, pot: t.pot, age: t.age, ni: t.nat, yrs: t.yrsD, role: role, tr: t.tr, rid: t.rid});
  realUse(t.rid);
  p.sal = sal; p.mor = clamp(70 + (promise ? 8 : 0), 0, 100); p.since = S.yr; p.prom = promise ? "C" : null;
  if (!role) { p.role = "R"; var rank = mActive().filter(function (q) { return q.pos !== "POR" && q.ovr > p.ovr; }).length; if (p.pos !== "POR") p.role = rank < 4 ? "C" : rank < 10 ? "I" : rank < 15 ? "R" : "S"; else p.role = mActive().some(function (q) { return q.pos === "POR" && q.ovr > p.ovr; }) ? "S" : "I"; }
  m.sq.push(p); mBenchAdd(p);
  m.chem = clamp(m.chem - 2, 0, 100);
  if (p.ovr >= mSquadAvg() + 3) m.fans = clamp(m.fans + 4, 0, 100);
  t.done = "fichado";
  var tx = {y: S.yr, w: S.w, n: plName(p), pos: p.pos, from: t.club, to: m.club, fee: fee, inn: true};
  m.tx.unshift(tx); (m.mk.tx = m.mk.tx || []).unshift(tx);
  if (m.tx.length > 80) m.tx.length = 80;
  mFixXI(); mSync();
  feed({t: "mtransfer", y: S.yr, inn: true, n: plName(p), pos: p.pos, age: p.age, ovr: Math.round(p.ovr), from: t.club, to: m.club, fee: fee, sal: sal, yrs: p.yrs, role: p.role});
  return p;
}
function mgrRemovePlayer(p, why, club, fee, quiet) {
  var m = S.m, i = m.sq.indexOf(p);
  if (i < 0) return;
  if (p.tot.apps + p.st.apps >= 20 || fee >= 5e6) mgrAlumni(p, fee ? tr("{why} por {fee}", {why: why, fee: fmtMoney(fee)}) : why);
  m.sq.splice(i, 1);
  var xi = m.xi.indexOf(p.id); if (xi >= 0) m.xi[xi] = null;
  if (m.cap === p.id) { m.cap = null; feedNote(tr("El brazalete pasa a otro jugador tras la salida de {name}.", {name: plName(p)})); }
  if (!quiet) {
    var tx = {y: S.yr, w: S.w, n: plName(p), pos: p.pos, from: m.club, to: club, fee: fee || 0, inn: false};
    m.tx.unshift(tx); if (m.mk && m.mk.tx) m.mk.tx.unshift(tx);
    if (m.tx.length > 80) m.tx.length = 80;
    feed({t: "mtransfer", y: S.yr, inn: false, n: plName(p), pos: p.pos, age: p.age, ovr: Math.round(p.ovr), from: m.club, to: club, fee: fee || 0, why: why});
  }
  mFixXI();
  if (m.club >= 0) mSync();
}
function mgrBuyers(p, k) {
  var m = S.m, val = pValue(p);
  var l = clubsWhere(function (c) { return c !== m.club && S.cr[c] >= p.ovr - 7 && S.cr[c] <= p.ovr + 4; }).sort(byRating);
  if (!l.length) return [];
  var out = [], used = {}, h = hashStr("b" + p.id + "|" + S.tw + "|" + (k || ""));
  var n = 1 + (h % 3);
  for (var i = 0; i < n && i < l.length; i++) {
    var c = l[(h >>> (i * 5)) % l.length];
    if (used[c]) continue; used[c] = 1;
    var f = 0.8 + ((h >>> (i * 3 + 7)) % 45) / 100;
    out.push({club: c, fee: Math.max(1e5, Math.round(val * f * (p.req ? 0.9 : 1) / 1e5) * 1e5)});
  }
  return out.sort(function (a, b) { return b.fee - a.fee; });
}
function mgrStartSell(pid) {
  var m = S.m, p = mPl(pid);
  if (!p || !m.mk.open || p.loanOut) return false;
  var offers = mgrBuyers(p, "s");
  if (!offers.length) return false;
  S.pend.unshift(mp("sell", {pid: pid, offers: offers, ui: true}));
  return true;
}
function mgrIncomingOffers() {
  var m = S.m, n = 0, avg = mSquadAvg();
  mActive().slice().sort(function (a, b) { return pValue(b) - pValue(a); }).forEach(function (p) {
    if (n >= 2 || p.age < 19) return;
    var ch = (p.req ? 0.45 : 0.06) * (p.role === "C" ? 1.5 : 1) * (p.ovr >= avg + 3 ? 1.4 : 1) * (p.list ? 3 : 1);
    if (!chance(ch)) return;
    var o = mgrBuyers(p, "in")[0];
    if (!o) return;
    n++;
    S.pend.push(mp("inoffer", {pid: p.id, club: o.club, fee: Math.round(o.fee * rf(1, 1.15) / 1e5) * 1e5}));
  });
}
function mgrLoanClubs(p) {
  var m = S.m;
  var l = clubsWhere(function (c) { return c !== m.club && S.cr[c] <= S.cr[m.club] - 3 && S.cr[c] >= p.ovr - 2 && S.cr[c] <= p.ovr + 5; }).sort(byRating);
  var h = hashStr("l" + p.id + "|" + S.yr), out = [];
  for (var i = 0; i < 3 && l.length; i++) { var c = l[(h >>> (i * 4)) % l.length]; if (out.indexOf(c) < 0) out.push(c); }
  return out;
}
function mgrStartLoan(pid) {
  var p = mPl(pid);
  if (!p || !S.m.mk.open || p.age > 23 || p.loanOut) return false;
  var l = mgrLoanClubs(p); if (!l.length) return false;
  S.pend.unshift(mp("loan", {pid: pid, clubs: l, ui: true}));
  return true;
}
function mgrStartRelease(pid) { if (!mPl(pid)) return false; S.pend.unshift(mp("release", {pid: pid, ui: true})); return true; }
function mgrStartRenew(pid) {
  var p = mPl(pid);
  if (!p || p.yrs > 2 || p.loanOut || p.rnT === S.yr * 10 + S.bi) return false;
  S.pend.unshift(mp("renew", {pid: pid, ui: true}));
  return true;
}
function mgrStartTalk(pid) { var p = mPl(pid); if (!p || p.tkT === S.yr * 10 + S.bi) return false; S.pend.unshift(mp("talk", {pid: pid, ui: true})); return true; }
function mgrQueueRenewals() {
  var m = S.m, avg = mSquadAvg(), n = 0, auto = [];
  mActive().filter(function (p) { return p.yrs === 1; }).sort(function (a, b) { return b.ovr - a.ovr; }).forEach(function (p) {
    if (n < 3 && (p.role === "C" || p.role === "I" || p.ovr >= avg - 2 || (p.age <= 21 && p.pot >= avg))) { n++; S.pend.push(mp("renew", {pid: p.id})); return; }
    /* el director deportivo se encarga de los secundarios */
    if (p.age <= 31 && (p.ovr >= avg - 9 || p.pot >= avg - 2) && chance(0.7)) {
      var t = mgrRenewTerms(p); p.sal = t.wage; p.yrs = 1 + Math.min(3, t.yrs); auto.push(plShort(p));
    }
  });
  if (auto.length) feedNote(tr("El director deportivo renueva a {names}.", {names: auto.join(", ")}));
}
function mgrRenewTerms(p) {
  var m = S.m, wage = Math.round(mWageFor(p, m.club, p.role) * (p.tr === "ambicioso" ? 1.15 : 1) * (p.age <= 23 && p.pot > p.ovr + 5 ? 1.1 : 1) / 1000) * 1000;
  var yrs = p.age <= 24 ? 5 : p.age <= 28 ? 4 : p.age <= 31 ? 3 : p.age <= 33 ? 2 : 1;
  var base = clamp(0.62 + (p.mor - 60) / 100 + {C: 0.1, I: 0.05, R: 0, S: -0.1, P: 0.05}[p.role] + (S.cr[m.club] - p.ovr) * 0.02 - (p.tr === "ambicioso" ? 0.08 : 0), 0.08, 0.95);
  return {wage: wage, yrs: yrs, p: base};
}
/* cambiar el rol: el efecto en la moral se calcula respecto al rol que tenía al empezar el tramo,
   así cambiar varias veces de rol sin avanzar no la va hundiendo (antes cada clic restaba) */
function mgrSetRole(pid, role) {
  var p = mPl(pid); if (!p || !ROLES[role] || p.role === role) return;
  var key = S.yr * 100 + (S.bi || 0) * 10 + (S.ph === "blk" ? 1 : 0);
  if (!p.roleB || p.roleB.k !== key) p.roleB = {k: key, role: p.role, mor: p.mor, prom: p.prom || null};
  var b = p.roleB, d = ROLE_ORDER.indexOf(role) - ROLE_ORDER.indexOf(b.role);
  var eff = d > 0 ? -(d * 6 * (p.tr === "ambicioso" ? 1.5 : 1) + (b.prom ? 15 : 0)) : d < 0 ? 4 : 0;
  p.mor = clamp(b.mor + eff, 0, 100);
  p.prom = d > 0 ? null : b.prom;
  p.role = role;
}

/* ---------- retirada del entrenador ---------- */
function mgrTotals() { var t = {n: 0, w: 0, d: 0, l: 0}; S.m.spells.forEach(function (s) { t.w += s.w; t.d += s.d; t.l += s.l; }); t.n = t.w + t.d + t.l; return t; }
function mgrLegacy() {
  var m = S.m, sc = 0, tot = mgrTotals();
  m.trophies.forEach(function (t) { sc += t.w * 2.5; });
  m.awards.forEach(function (a) { sc += {mgr_year: 40, mgr_lg: 12, mgr_month: 1}[a.k] || 2; });
  sc += tot.w * 0.12 + tot.n * 0.03 + m.seasons.length * 2 + Math.max(0, m.peakRep - 50) * 3;
  sc = Math.round(sc);
  var title = sc >= 900 ? tr("Leyenda de los banquillos") : sc >= 600 ? tr("Entrenador de época") : sc >= 380 ? tr("Técnico de élite") : sc >= 220 ? tr("Entrenador respetado") : sc >= 110 ? tr("Míster de garantías") : tr("Trotamundos de los banquillos");
  return {sc: sc, title: title};
}
function mgrRetire() {
  var m = S.m, clubs = {};
  m.spells.forEach(function (s) { clubs[s.club] = (clubs[s.club] || 0) + s.w + s.d + s.l; });
  var main = Object.keys(clubs).sort(function (a, b) { return clubs[b] - clubs[a]; })[0];
  S.mretired = {y: S.yr + 1, age: m.age, lg: mgrLegacy(), tot: mgrTotals(), main: main != null ? +main : m.club};
  var sp = m.spells[m.spells.length - 1]; if (sp && sp.y1 == null) sp.y1 = S.yr + 1;
  S.ph = "ret";
  S.pend = [];
  feed({t: "mretire", y: S.yr + 1});
}

/* ---------- avance general y decisiones (los dos modos) ---------- */
function mgrNextLabel() {
  mgrCleanPend();
  if (S.pend.length) return null;
  switch (S.ph) {
    case "pre": return tr("Jugar {block}", {block: tr(BLOCKS[0][2])});
    case "gap": return tr("Jugar {block}", {block: tr(BLOCKS[S.bi][2])});
    case "blk": case "sblk": return tr("Continuar");
    case "post": var pl = summerPlan(); return pl.list.length || pl.cwc ? tr("Verano {year}: torneos", {year: pl.y}) : tr("Verano {year}", {year: pl.y});
    case "awards": return tr("Gala de premios {year}", {year: S.yr + 1});
    case "off": return tr("Empezar temporada {season}", {season: seasonLabel(S.yr + 1)});
    default: return null;
  }
}
function mgrAdvance() {
  mgrCleanPend();
  if (S.pend.length) return;
  if (S.m && S.m.club >= 0) S.m.unav0 = mUnavXI().map(function (u) { return u.p.id; });
  switch (S.ph) {
    case "pre": case "gap": if (S.m.club >= 0) mgrStartBlock(); break;
    case "blk": case "sblk": mgrContinue(); break;
    case "post": mgrStartSummer(); break;
    case "awards": mgrAwards(); break;
    case "off": mgrStartSeason(); break;
  }
  mgrCleanPend();
}
function mgrPendValid(x) {
  var m = S.m;
  switch (x.k) {
    case "jobs": return x.list && (x.list.length > 0 || x.forced);
    case "mmom": case "mplan": case "mso": return !!(S.cur && S.cur.pm && S.cur.pm[x.fi]);
    case "bid": case "terms": case "nego": var t = mgrTarget(x.tid); return !!(t && !t.done && m.mk.open && m.club >= 0);
    case "clausm": return !!(mPl(x.pid) && m.club >= 0);
    case "sell": case "loan": return !!(mPl(x.pid) && m.mk.open && !mPl(x.pid).loanOut);
    case "inoffer": return !!(mPl(x.pid) && !mPl(x.pid).loanOut && m.club >= 0);
    case "renew": case "talk": case "release": return !!(mPl(x.pid) && !mPl(x.pid).loanOut && m.club >= 0);
    case "youth": return !!(m.youth && m.youth.length && m.club >= 0);
    case "mfocus": return m.club >= 0;
    case "objs": return m.club >= 0 && !!(x.cats && x.cats.length);
    case "mlive": case "mlivew": return !!(S.cur && S.cur.pm && S.cur.pm[x.fi] && !S.cur.pm[x.fi].liveDone);
    case "mpress": return m.club >= 0;
    case "draw": return x.nat ? !!(typeof mpNT === "function" && mpNT() && mpNT().ni === x.me) : (m.club >= 0 && x.me === m.club);
    case "mpq": return m.club >= 0 && typeof PRESS !== "undefined" && !!pressQ(true, x.q);
    case "mploanin": case "mploanopt": case "mpnatoff": case "mpnatm": case "mpfilup": return typeof mpPendValid === "function" && mpPendValid(x);
    case "mev":
      var ev = MEV_BY_ID[x.id]; if (!ev) return false;
      if (x.pid != null && !mPl(x.pid)) return false;
      if (m.club < 0 && !ev.noClub) return false;
      Y.cur = x;
      try { var ok = (!ev.still || ev.still(Y)) && (ev.manual || !ev.when || !!ev.when(Y)); if (ok) ok = !!ev.text(Y) && ev.opts(Y).length > 0; return ok; }
      catch (e) { return false; } finally { Y.cur = null; }
  }
  return false;
}
function mgrCleanPend() { while (S.pend.length && !mgrPendValid(S.pend[0])) S.pend.shift(); }
function mgrResolve(choice) {
  mgrCleanPend();
  var x = S.pend[0];
  if (!x) return null;
  if (x.k === "jobs") {
    if (choice >= 0 && x.list[choice]) { mgrTakeJob(x.list[choice].club, x.list[choice].sal); return null; }
    if (x.forced) return null;
    S.pend.shift();
    feed({t: "decision", tipo: "mgr", cat: tr("Banquillo"), title: tr("Ofertas de otros clubes"), choice: tr("Te quedas en el {club}", {club: clubName(S.m.club)}), txt: trn(x.list.length, "Rechazas {n} oferta.", "Rechazas {n} ofertas."), chips: [["board", 3]], y: S.yr});
    S.m.board = clamp(S.m.board + 3, 0, 100);
    mgrCleanPend();
    return null;
  }
  var h = MPH[x.k];
  Y.cur = x;
  var head = h.head(x), raw = h.opts(x), o = raw[choice];
  if (!o || o.dis) { Y.cur = null; return null; }
  var res = h.fixed ? Object.assign({p: 1, good: true, sure: true}, o.ok || {}) : rollOutcome(outcomesOf(o));
  S.pend.shift();
  var pid = o.pid != null ? o.pid : x.pid;
  var chips = h.apply ? h.apply(x, o, res) : mgrFx(res.fx || {}, pid);
  if (res.n) chips.push(["note", 0, res.n]);
  if (res.then) res.then(x, o, res);
  if (x.k === "mev") S.m.evCd[x.id] = S.yr;
  Y.cur = null;
  var card = h.card ? h.card(x, o, res, chips, head) : {t: head.hot ? "moment" : "decision", tipo: "mgr", cat: head.cat, title: head.title, ctx: head.ctxTxt, choice: o.t, txt: res.txt, chips: chips,
    good: res.sure ? null : !!res.good, pct: res.sure || h.fixed ? null : Math.round(res.p * 100), y: S.yr};
  if (card) feed(card);
  mgrCleanPend();
  return card;
}
function mgrDesc(x) {
  var h = MPH[x.k];
  Y.cur = x;
  try {
    var d = h.head(x), pid = x.pid;
    d.opts = h.opts(x).map(function (o) { return descOpt(o, function (u) { return mgrPreview(u, o.pid != null ? o.pid : pid); }); });
    return d;
  } finally { Y.cur = null; }
}
/* despachadores comunes: la interfaz llama a estos sin preocuparse del modo */
function advance() { if (S.mode === "mgr") return mgrAdvance(); return advancePlayer(); }
function nextLabel() { if (S.mode === "mgr") return mgrNextLabel(); return nextLabelPlayer(); }
function resolvePending(i) { if (S.mode === "mgr") return mgrResolve(i); return resolvePendingPlayer(i); }
function cleanPend() { if (S.mode === "mgr") return mgrCleanPend(); return cleanPendPlayer(); }
function pendDesc(x) { if (S.mode === "mgr") return x.k === "jobs" ? null : mgrDesc(x); return playerDesc(x); }

/* ---------- efectos de las decisiones del entrenador ---------- */
var MFX_LABEL;
onLang(function () { MFX_LABEL = {board: tr("Directiva"), fans: tr("Afición"), rep: tr("Prestigio"), chem: tr("Química"), sqMor: tr("Moral del vestuario"), sfit: tr("Físico de la plantilla"), pts: tr("Puntos en liga")}; });
function mgrFx(fx, pid) {
  var m = S.m, ch = [], pl = pid != null ? mPl(pid) : null;
  Object.keys(fx || {}).forEach(function (k) {
    var v = fx[k];
    switch (k) {
      case "board": case "fans": case "rep": case "chem": m[k] = clamp(m[k] + v, 0, 100); if (k === "rep") m.peakRep = Math.max(m.peakRep, m.rep); if (v) ch.push([k, v]); break;
      case "sqMor": m.sq.forEach(function (p) { p.mor = clamp(p.mor + v, 0, 100); }); if (v) ch.push([k, v]); break;
      case "sfit": m.sq.forEach(function (p) { p.fit = clamp(p.fit + v, 0, 100); }); if (v) ch.push([k, v]); break;
      case "bud": m.bud += v; if (v) ch.push(["bud", v]); break;
      case "buff": m.buffs.push({v: v.v, b: v.b, n: v.n}); ch.push(["tbuff", v.v, trn(v.b, "{name}, {n} tramo", "{name}, {n} tramos", {name: v.n})]); break;
      case "pmor": if (pl && v) { pl.mor = clamp(pl.mor + v, 0, 100); ch.push(["pmor", v, plShort(pl)]); } break;
      case "pinj": if (pl) { var w = Array.isArray(v) ? ri(v[0], v[1]) : v; mInjure(pl, w); ch.push(["pinj", w, plShort(pl)]); } break;
      case "psus": if (pl) { pl.sus += v; ch.push(["psus", v, plShort(pl)]); } break;
      case "prole": if (pl) { pl.role = v; ch.push(["prole", 0, tr("{name} pasa a {role}", {name: plShort(pl), role: lcT(tr(ROLES[v].n))})]); } break;
      case "povr": if (pl) { pl.ovr = round1(clamp(pl.ovr + v, 30, 95)); ch.push(["povr", v, plShort(pl)]); } break;
      case "plist": if (pl) { pl.list = !!v; if (v) ch.push(["note", 0, tr("{name} está en venta", {name: plShort(pl)})]); } break;
      case "preq": if (pl) pl.req = !!v; break;
      case "pts": var li = S.cl[m.club], L = S.L && S.L[li], idx = L ? L.tm.indexOf(m.club) : -1; if (idx >= 0) { L.tb[idx][6] += v; ch.push(["pts", v]); } break;
      case "youth": for (var i = 0; i < v; i++) m.sq.push(mgrMakeYouth()); ch.push(["youth", v]); break;
      case "flag": Object.keys(v).forEach(function (a) { m.flags[a] = v[a]; }); break;
      case "wcap": m.wcap = Math.round(m.wcap * v / 1e5) * 1e5; ch.push(["wcap", v]); break;
    }
  });
  return ch;
}
function mgrFxPreview(fx, pid) {
  var ch = [], pl = pid != null ? mPl(pid) : null, nm = pl ? plShort(pl) : "";
  Object.keys(fx || {}).forEach(function (k) {
    var v = fx[k];
    switch (k) {
      case "buff": ch.push(["tbuff", v.v, trn(v.b, "{name}, {n} tramo", "{name}, {n} tramos", {name: v.n})]); break;
      case "pmor": if (v) ch.push(["pmor", v, nm]); break;
      case "pinj": ch.push(["pinj", v, nm]); break;
      case "psus": ch.push(["psus", v, nm]); break;
      case "prole": ch.push(["prole", 0, tr("{name} pasa a {role}", {name: nm, role: lcT(tr(ROLES[v].n))})]); break;
      case "povr": ch.push(["povr", v, nm]); break;
      case "plist": if (v) ch.push(["note", 0, tr("{name} pasa a estar en venta", {name: nm})]); break;
      case "preq": case "flag": break;
      default: if (v) ch.push([k, v]);
    }
  });
  return ch;
}
/* vista previa de un desenlace de entrenador (decisiones y momentos de banda) */
function mgrPreview(u, pid) {
  var ch = [];
  if (u.lock) ch.push(["note", 0, tr("Cerráis el marcador")]);
  if (u.goal) ch.push(["goal", u.goal, tr("Gol a favor")]);
  if (u.concede) ch.push(["concede", u.concede]);
  if (u.uncon) ch.push(["save", 1]);
  if (u.red) { var pl = pid != null ? mPl(pid) : null; ch.push(["red", 1, pl ? plShort(pl) : ""]); }
  if (u.red2) ch.push(["red", 1, tr("uno de los tuyos")]);
  if (u.off) ch.push(["note", 0, tr("Sale del campo")]);
  return ch.concat(mgrFxPreview(u.fx, pid), u.n ? [["note", 0, u.n]] : []);
}
