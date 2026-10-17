/* ===== MOTOR · NÚCLEO =====
   Mundo, azar, ligas, copas, competiciones continentales, torneos de selecciones y calendario semanal. */
var S = null;          // partida en curso (serializable)
var W = {};            // mundo estático derivado de DATA
var START_YEAR = 2026;
var BLOCKS;
onLang(function () { BLOCKS = [[1, 8, tr("Ago–Sep")], [9, 16, tr("Oct–Nov")], [17, 24, tr("Dic–Ene")], [25, 32, tr("Feb–Mar")], [33, 40, tr("Abr–May")]]; });
var INTL_W = [5, 10, 15, 30];
var INTL_NAME = {5: "septiembre", 10: "octubre", 15: "noviembre", 30: "marzo"};

/* ---------- azar reproducible ---------- */
function R() {
  var t = S.rng = (S.rng + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function ri(a, b) { return a + Math.floor(R() * (b - a + 1)); }
function rf(a, b) { return a + R() * (b - a); }
function pick(a) { return a[Math.floor(R() * a.length)]; }
function chance(p) { return R() < p; }
function gauss() { var u = 0; while (!u) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); }
function poisson(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R(); } while (p > L && k < 20); return k - 1; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function wpick(items, wf) {
  var tot = 0, ws = items.map(function (x) { var w = Math.max(0, wf(x)); tot += w; return w; });
  if (tot <= 0) return null;
  var r = R() * tot;
  for (var i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function round1(x) { return Math.round(x * 10) / 10; }
function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- mundo estático ---------- */
function flagOf(code) {
  var tag = {ENG: "gbeng", SCO: "gbsct", WAL: "gbwls"}[code];
  if (tag) { var s = "🏴"; for (var i = 0; i < tag.length; i++) s += String.fromCodePoint(0xE0000 + tag.charCodeAt(i)); return s + String.fromCodePoint(0xE007F); }
  if (code === "NIR") code = "GB";
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65);
}
var ABBR_STOP = {FC: 1, CF: 1, CD: 1, SC: 1, AC: 1, AS: 1, RC: 1, SL: 1, CA: 1, CS: 1, US: 1, SD: 1, UD: 1, RCD: 1, AFC: 1, AJ: 1, RSC: 1, KAA: 1, KRC: 1, OGC: 1, LOSC: 1, SK: 1, IF: 1, FK: 1, BK: 1, NK: 1, HNK: 1, TSG: 1, VfB: 1, VfL: 1, SV: 1, "1": 1, de: 1, del: 1, da: 1, do: 1, la: 1, "&": 1, Club: 1, AD: 1, CE: 1, EA: 1, ESTAC: 1, KV: 1, KVC: 1, OH: 1, RAAL: 1, FCV: 1, SCR: 1, TSV: 1, WSG: 1, AO: 1, MFK: 1, MŠK: 1, KFC: 1, AIF: 1, IK: 1, BP: 1, CS: 1, FBC: 1, ADT: 1, UTC: 1, CODM: 1, KAC: 1, ES: 1, CR: 1, MC: 1, JS: 1, USM: 1, ASO: 1, NC: 1, MB: 1, EGS: 1, RS: 1, FUS: 1, LD: 1, SG: 1};
function abbr(nm) {
  var w = nm.replace(/[().'’]/g, " ").split(/[\s\-\/]+/).filter(function (x) { return x && !ABBR_STOP[x]; });
  if (!w.length) w = [nm];
  var s = w.length === 1 ? w[0].slice(0, 3) : (w[0][0] + w[1].slice(0, 2));
  return s.toUpperCase();
}
function clubColors(nm) {
  if (DATA.colors[nm]) return DATA.colors[nm];
  var h = hashStr(nm), hue = h % 360, t = (h >>> 9) % 4;
  var c1 = "hsl(" + hue + ",58%,40%)";
  var c2 = t === 0 ? "#f4f4f4" : t === 1 ? "#141414" : "hsl(" + ((hue + 160) % 360) + ",70%,60%)";
  return [c1, c2];
}

/* wk: "m" fútbol masculino · "f" femenino (clubes femeninos reales) · "f1" femenino de la versión 1.8 (clubes del masculino) */
function worldKey(s) { return s && s.g === "f" ? (s.wk === "f" ? "f" : "f1") : "m"; }
function natTours() { return FEM && DATA.natTournamentsF ? DATA.natTournamentsF : DATA.natTournaments; }
function buildWorld(wk) {
  wk = wk || "m";
  if (W.ready && W.wk === wk) return;
  Object.keys(W).forEach(function (k) { delete W[k]; });
  W.wk = wk;
  var LEAGUES = wk === "f" && DATA.leaguesF ? DATA.leaguesF : DATA.leagues;
  W.ctry = []; W.cIdx = {};
  Object.keys(DATA.countries).forEach(function (conf) {
    DATA.countries[conf].split(",").forEach(function (e) {
      var a = e.split("|");
      W.cIdx[a[0]] = W.ctry.length;
      /* ZZ: hueco vacío que conserva la numeración de las partidas guardadas; no juega ni aparece */
      W.ctry.push({code: a[0], n: a[1], conf: a[0] === "ZZ" ? "NONE" : conf, r0: +a[2], flag: a[0] === "ZZ" ? "" : flagOf(a[0]), pool: DATA.namePool[a[0]] || DATA.confPool[conf]});
    });
  });
  W.lg = []; W.lgIdx = {}; W.clubs = []; W.cName = {}; W.byCountry = {}; W.dv = {};
  LEAGUES.forEach(function (L, li) {
    var ci = W.cIdx[L.c], ct = W.ctry[ci];
    var lg = {id: L.id, c: L.c, ci: ci, n: L.n, t: L.t, top: L.top, bot: L.bot, cup: L.cup || null, sc: L.sc || null,
      eu: L.eu || null, sa: L.sa || null, cc: L.cc || 0, afc: L.afc || 0, caf: L.caf || 0, down: L.down || null, rel: L.rel || 0,
      w: L.w || 0.5, gs: L.gs || 1, conf: ct.conf, cl0: [], dv: L.dv || null, dvn: L.dvn || null, gno: L.gno || 0, reg: L.reg || "", upN: L.upN || 0};
    var names = L.clubs.split("|"), n = names.length;
    /* las divisiones añadidas después (xl) crean sus clubes al final para no mover los índices de partidas guardadas */
    if (L.xl) { lg.late = names; W.lgIdx[L.id] = li; W.lg.push(lg); (W.byCountry[ci] = W.byCountry[ci] || []).push(li); if (L.dv) (W.dv[L.dv] = W.dv[L.dv] || []).push(li); return; }
    names.forEach(function (nm, i) {
      var f = n > 1 ? i / (n - 1) : 0;
      var r = L.top - (L.top - L.bot) * Math.pow(f, 0.85);
      var id = W.clubs.length;
      W.clubs.push({n: nm, c: L.c, ci: ci, lg0: li, r0: Math.round(r * 10) / 10, col: clubColors(nm), ab: abbr(nm)});
      W.cName[nm] = id; lg.cl0.push(id);
    });
    W.lgIdx[L.id] = li; W.lg.push(lg);
    (W.byCountry[ci] = W.byCountry[ci] || []).push(li);
  });
  /* nombres de competición (para darles su versión femenina) */
  W.lg.forEach(function (l) { [l.n, l.cup, l.sc, l.dvn].forEach(function (x) { if (x && typeof x === "string") FEM_COMP[x] = 1; }); });
  DATA.natTournaments.concat(DATA.natTournamentsF || []).forEach(function (t) { FEM_COMP[t.n] = 1; });
  W.lg.forEach(function (l) {
    l.downDv = l.down && W.dv[l.down] ? l.down : null;
    l.downI = l.downDv ? W.dv[l.down][0] : l.down && W.lgIdx[l.down] != null ? W.lgIdx[l.down] : -1; l.upI = -1;
  });
  W.lg.forEach(function (l, i) {
    if (l.downDv) W.dv[l.downDv].forEach(function (g) { if (W.lg[g].upI < 0) W.lg[g].upI = i; });
    else if (l.downI >= 0) W.lg[l.downI].upI = i;
  });
  // clubes sin liga propia (para el Mundial de Clubes)
  W.extra = {};
  [["Auckland City", "NZ", 60], ["Hienghène Sport", "NC", 53]].forEach(function (x) {
    var id = W.clubs.length;
    W.clubs.push({n: x[0], c: x[1], ci: W.cIdx[x[1]], lg0: -1, r0: x[2], col: clubColors(x[0]), ab: abbr(x[0])});
    W.cName[x[0]] = id; W.extra[x[0]] = id;
  });
  /* clubes de las divisiones añadidas */
  W.lg.forEach(function (lg, li) {
    if (!lg.late) return;
    var n = lg.late.length;
    lg.late.forEach(function (nm, i) {
      var f = n > 1 ? i / (n - 1) : 0, r = lg.top - (lg.top - lg.bot) * Math.pow(f, 0.85), id = W.clubs.length;
      W.clubs.push({n: nm, c: lg.c, ci: lg.ci, lg0: li, r0: Math.round(r * 10) / 10, col: clubColors(nm), ab: abbr(nm)});
      W.cName[nm] = id; lg.cl0.push(id);
    });
    delete lg.late;
  });
  W.derby = {};
  DATA.derbies.forEach(function (d) { var a = W.cName[d[0]], b = W.cName[d[1]]; if (a != null && b != null) { W.derby[a + "-" + b] = 1; W.derby[b + "-" + a] = 1; } });
  W.pos = {}; DATA.positions.forEach(function (p) { W.pos[p[0]] = {n: p[1], g: p[2]}; });
  W.confs = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];
  W.ready = true;
}

function clubName(c) { return c >= 0 && W.clubs[c] ? W.clubs[c].n : "—"; }
/* plazas de ascenso de una liga y nombre de su división (los grupos comparten división) */
function lgUpN(li) { var l = W.lg[li]; return l ? (l.upN || (l.upI >= 0 ? W.lg[l.upI].rel : 0)) : 0; }
function lgDivRaw(li) { var l = W.lg[li]; return l ? (l.dvn || l.n) : ""; }
/* nivel base de una selección (en el fútbol femenino, su propia tabla) */
function natR0(i) {
  var c = W.ctry[i];
  if (!(S && S.g === "f") || c.conf === "NONE") return c.r0;
  var f = DATA.natF[c.code];
  return f != null ? f : Math.max(40, c.r0 - 7);
}
/* nombres inventados según la zona (y el fútbol masculino o femenino) */
function namePool(ni) {
  var M = DATA.names, pm = (W.ctry[ni] && W.ctry[ni].pool) || "ang", m = M[pm] || M.ang;
  if (!FEM) return m;
  var f = DATA.namesF[pm] || (DATA.namePar && DATA.namesF[DATA.namePar[pm]]) || DATA.namesF.ang;
  return {f: f.f, l: f.l || m.l};
}
function natLive(i) { return !!W.ctry[i] && W.ctry[i].conf !== "NONE"; }
function natName(n) { return W.ctry[n] ? tr(W.ctry[n].n) : "—"; }

/* ---------- estado dinámico del mundo ---------- */
function initWorld() {
  S.cr = W.clubs.map(function (c) { return round1(c.r0 + gauss() * 0.5); });
  S.cl = W.clubs.map(function (c) { return c.lg0; });
  S.nr = W.ctry.map(function (c, i) { return natR0(i); });
  S.last = {final: {}, cup: {}, cupF: {}, cont: {}, nlWin: []};
  S.hist = {};
  W.lg.forEach(function (l, li) { S.last.final[li] = teamsOfLeague(li).sort(function (a, b) { return S.cr[b] - S.cr[a]; }); });
}
function teamsOfLeague(li) { var out = []; for (var c = 0; c < S.cl.length; c++) if (S.cl[c] === li) out.push(c); return out; }
function natsOfConf(conf) { var out = []; W.ctry.forEach(function (c, i) { if (c.conf === conf) out.push(i); }); return out; }
function histPush(k, yr, t, extra) { (S.hist[k] = S.hist[k] || []).push(extra ? [yr, t, extra] : [yr, t]); if (S.hist[k].length > 40) S.hist[k].shift(); }

/* ---------- partidos ---------- */
function simGoals(ra, rb, home) {
  var d = (ra - rb) * 0.05 + home * 0.1;
  return [poisson(1.3 * Math.exp(d)), poisson(1.3 * Math.exp(-d))];
}
function extraTime(ra, rb) { var d = (ra - rb) * 0.05; return [poisson(0.36 * Math.exp(d)), poisson(0.36 * Math.exp(-d))]; }
function shootout(pa, pb) {
  var a = 0, b = 0, i;
  for (i = 0; i < 5; i++) { if (R() < pa) a++; if (R() < pb) b++; }
  var guard = 0;
  while (a === b && guard++ < 30) { if (R() < pa) a++; if (R() < pb) b++; }
  if (a === b) a++;
  return [a, b];
}
function tblAdd(row, gf, ga) {
  row[0]++; row[4] += gf; row[5] += ga;
  if (gf > ga) { row[1]++; row[6] += 3; } else if (gf === ga) { row[2]++; row[6] += 1; } else row[3]++;
}
function sortTable(tm, tb, nat) {
  var rt = nat ? S.nr : S.cr;
  var idx = tm.map(function (_, i) { return i; });
  idx.sort(function (x, y) {
    return tb[y][6] - tb[x][6] || (tb[y][4] - tb[y][5]) - (tb[x][4] - tb[x][5]) || tb[y][4] - tb[x][4] || rt[tm[y]] - rt[tm[x]];
  });
  return idx.map(function (i) { return {c: tm[i], r: tb[i]}; });
}

/* ---------- ligas ---------- */
function newLeagueSeason(li) {
  var tm = teamsOfLeague(li), n = tm.length, m = n % 2 ? n + 1 : n;
  var single = n > 24;
  var exp = tm.slice().sort(function (a, b) { return S.cr[b] - S.cr[a]; });
  return {tm: tm, tb: tm.map(function () { return [0, 0, 0, 0, 0, 0, 0]; }), md: 0, N: single ? m - 1 : 2 * (m - 1), pm: shuffle(range(m)), exp: exp};
}
function lgWeek(L, md) { return 1 + Math.floor(md * 40 / L.N); }
function leagueFixtures(L, md) {
  var n = L.tm.length, m = n % 2 ? n + 1 : n, half = m - 1, r = md % half, flip = md >= half, out = [];
  function push(x, y, h) {
    var a = L.pm[x], b = L.pm[y];
    if (a >= n || b >= n) return;
    if (h !== flip) out.push([a, b]); else out.push([b, a]);
  }
  push(m - 1, r, r % 2 === 0);
  for (var k = 1; k < m / 2; k++) push((r + k) % half, (r - k + half) % half, k % 2 === 0);
  return out;
}
function standings(li) { var L = S.L[li]; return sortTable(L.tm, L.tb, false); }
function posInLeague(c) { var li = S.cl[c]; if (li < 0) return -1; var st = standings(li); for (var i = 0; i < st.length; i++) if (st[i].c === c) return i + 1; return -1; }

/* ---------- competiciones (genéricas) ---------- */
function roundNames(nTeams) {
  var names = {2: N_("Final"), 4: N_("Semifinales"), 8: N_("Cuartos"), 16: N_("Octavos"), 32: N_("Dieciseisavos"), 64: N_("Treintaidosavos"), 128: N_("Ronda previa"), 256: N_("Ronda previa")};
  return names[nTeams] || N_("Ronda");
}
function bracketOrder(n) {
  var o = [1, 2];
  while (o.length < n) { var m = o.length * 2 + 1, nx = []; o.forEach(function (s) { nx.push(s, m - s); }); o = nx; }
  return o;
}
function mkTie(a, b) { return {a: a, b: b, s: [], w: -1}; }

/* fase de liga suiza (Champions, Europa, Conference, AFC) */
function mkSwiss(k, name, short, teams, opt) {
  var N = teams.length, used = {}, sched = [];
  for (var r = 0; r < opt.mdW.length; r++) {
    var pairs = null;
    for (var t = 0; t < 300 && !pairs; t++) pairs = tryMatching(N, used, teams, t < 200);
    if (!pairs) pairs = shuffle(range(N)).reduce(function (acc, x, i, arr) { if (i % 2 === 0) acc.push([arr[i], arr[i + 1]]); return acc; }, []);
    pairs.forEach(function (p) { used[Math.min(p[0], p[1]) + "-" + Math.max(p[0], p[1])] = 1; });
    sched.push(pairs);
  }
  return {k: k, n: name, s: short, typ: "swiss", teams: teams, tb: teams.map(function () { return [0, 0, 0, 0, 0, 0, 0]; }),
    sched: sched, md: 0, mdW: opt.mdW, left: N / 2 * opt.mdW.length, koCfg: opt.ko, ko: null, lvl: opt.lvl || 5, conf: opt.conf, win: -1};
}
function tryMatching(N, used, teams, strict) {
  var idx = shuffle(range(N)), taken = [], pairs = [];
  for (var q = 0; q < idx.length; q++) {
    var i = idx[q]; if (taken[i]) continue;
    var found = -1;
    for (var z = 0; z < idx.length; z++) {
      var j = idx[z];
      if (j === i || taken[j]) continue;
      if (used[Math.min(i, j) + "-" + Math.max(i, j)]) continue;
      if (strict && W.clubs[teams[i]].ci === W.clubs[teams[j]].ci) continue;
      found = j; break;
    }
    if (found < 0) return null;
    taken[i] = taken[found] = true;
    pairs.push(R() < 0.5 ? [i, found] : [found, i]);
  }
  return pairs;
}
/* fase de grupos (Libertadores, torneos de selecciones, Mundial de Clubes…) */
function mkGroups(k, name, short, teams, opt) {
  var ng = opt.ng, per = teams.length / ng, rt = opt.nat ? S.nr : S.cr;
  var sorted = teams.slice().sort(function (a, b) { return rt[b] - rt[a]; });
  var groups = range(ng).map(function () { return []; });
  for (var pot = 0; pot < per; pot++) {
    var potT = shuffle(sorted.slice(pot * ng, pot * ng + ng));
    potT.forEach(function (t, i) { groups[i].push(t); });
  }
  var mdPerRound = per % 2 ? per : per - 1;
  var nMd = opt.double ? mdPerRound * 2 : mdPerRound;
  var pmG = groups.map(function () { return shuffle(range(per % 2 ? per + 1 : per)); });
  var left = 0;
  groups.forEach(function (g) { left += (g.length * (g.length - 1) / 2) * (opt.double ? 2 : 1); });
  return {k: k, n: name, s: short, typ: "grp", nat: !!opt.nat, teams: teams, g: groups, gt: groups.map(function (g) { return g.map(function () { return [0, 0, 0, 0, 0, 0, 0]; }); }),
    pmG: pmG, md: 0, nMd: nMd, mdW: opt.mdW, left: left, perGroup: opt.perGroup || 2, thirds: opt.thirds || 0,
    koW: opt.koW, koLegs: opt.koLegs || 1, finalW: opt.finalW, ko: null, lvl: opt.lvl || 5, conf: opt.conf, win: -1, finals: opt.finals !== false, sub: opt.sub};
}
function groupFixtures(c, gi, md) {
  var g = c.g[gi], n = g.length, m = n % 2 ? n + 1 : n, half = m - 1, r = md % half, flip = md >= half, out = [], pm = c.pmG[gi];
  function push(x, y, h) { var a = pm[x], b = pm[y]; if (a >= n || b >= n) return; if (h !== flip) out.push([a, b]); else out.push([b, a]); }
  push(m - 1, r, r % 2 === 0);
  for (var k = 1; k < m / 2; k++) push((r + k) % half, (r - k + half) % half, k % 2 === 0);
  return out;
}
/* eliminatoria pura (copas, supercopas, Concachampions, Intercontinental) */
function mkKO(k, name, short, rounds, firstTies, opt) {
  opt = opt || {};
  var c = {k: k, n: name, s: short, typ: "ko", nat: !!opt.nat, teams: opt.teams || [], lvl: opt.lvl || 3, conf: opt.conf, win: -1, dom: opt.dom, ci: opt.ci,
    ko: {r: rounds.map(function (r) { return {n: r.n, W: r.W, ties: [], left: 0, enter: r.enter || [], draw: r.draw || "bracket", fin: !!r.fin}; }), ri: 0}};
  koSetRound(c, 0, firstTies);
  return c;
}
function koSetRound(c, ri, ties) {
  var rd = c.ko.r[ri]; rd.ties = ties; rd.left = 0;
  ties.forEach(function (t) { if (t.b === -1) t.w = t.a; else if (t.a === -1) t.w = t.b; else rd.left++; });
  if (rd.left === 0) koRoundDone(c, ri);
}
function koRoundDone(c, ri) {
  var rd = c.ko.r[ri], winners = rd.ties.map(function (t) { return t.w; });
  if (ri === c.ko.r.length - 1) { c.win = winners[0]; c.done = true; c.ko.ri = ri + 1; return; }
  var nx = c.ko.r[ri + 1], parts = winners.concat(nx.enter || []);
  if (nx.draw === "random") parts = shuffle(parts);
  var ties = [];
  for (var i = 0; i < parts.length; i += 2) {
    var a = parts[i], b = parts[i + 1] === undefined ? -1 : parts[i + 1];
    if (nx.draw === "random" && b >= 0 && R() < 0.5) { var t = a; a = b; b = t; }
    ties.push(mkTie(a, b));
  }
  c.ko.ri = ri + 1;
  koSetRound(c, ri + 1, ties);
}
function koFinalist(c) { var r = c.ko && c.ko.r[c.ko.r.length - 1]; if (!r || !r.ties[0] || r.ties[0].w < 0) return -1; var t = r.ties[0]; return t.w === t.a ? t.b : t.a; }

/* construir eliminatorias al acabar la fase de liga o grupos */
function buildKOFromTable(c) {
  var rounds = [], seeds;
  if (c.typ === "swiss") {
    var st = sortTable(c.teams, c.tb, false).map(function (x) { return x.c; });
    c.final = st;
    var cfg = c.koCfg;
    if (cfg.po) {
      var po = [];
      for (var i = 0; i < 8; i++) po.push(mkTie(st[23 - i], st[8 + i]));
      var top8 = st.slice(0, 8);
      rounds = [{n: N_("Playoff"), W: cfg.W[0]}, {n: N_("Octavos"), W: cfg.W[1]}, {n: N_("Cuartos"), W: cfg.W[2]}, {n: N_("Semifinales"), W: cfg.W[3]}, {n: N_("Final"), W: cfg.W[4], fin: true}];
      c.ko = {r: rounds.map(function (r) { return {n: r.n, W: r.W, ties: [], left: 0, enter: [], draw: "bracket", fin: !!r.fin}; }), ri: 0, top8: top8};
      // los ocho primeros esperan en octavos: se emparejan con los ganadores del playoff
      c.ko.r[1].enter = [];
      koSetRound(c, 0, po);
      return;
    }
    seeds = st.slice(0, cfg.direct);
    rounds = cfg.names.map(function (n, i) { return {n: n, W: cfg.W[i], fin: i === cfg.names.length - 1}; });
  } else {
    // grupos: primeros, segundos y mejores terceros
    var firsts = [], seconds = [], thirds = [], rt = c.nat ? S.nr : S.cr;
    c.gst = c.g.map(function (g, gi) { return sortTable(g, c.gt[gi], c.nat); });
    c.gst.forEach(function (st, gi) {
      if (st[0]) firsts.push({t: st[0].c, r: st[0].r, g: gi});
      if (c.perGroup > 1 && st[1]) seconds.push({t: st[1].c, r: st[1].r, g: gi});
      if (st[2]) thirds.push({t: st[2].c, r: st[2].r, g: gi});
    });
    function cmp(a, b) { return b.r[6] - a.r[6] || (b.r[4] - b.r[5]) - (a.r[4] - a.r[5]) || b.r[4] - a.r[4] || rt[b.t] - rt[a.t]; }
    firsts.sort(cmp); seconds.sort(cmp); thirds.sort(cmp);
    var q = firsts.concat(seconds).concat(thirds.slice(0, c.thirds));
    seeds = q.map(function (x) { return x.t; });
    var grpOf = {}; q.forEach(function (x) { grpOf[x.t] = x.g; });
    c.grpOf = grpOf;
    var n = seeds.length, names = [];
    for (var s = n; s >= 2; s /= 2) names.push(roundNames(s));
    rounds = names.map(function (nm, i) { return {n: nm, W: c.koW[i], fin: i === names.length - 1}; });
  }
  // primera ronda con cabezas de serie (1 vs último…) evitando cruces del mismo grupo
  var order = bracketOrder(seeds.length), ties = [];
  for (var k = 0; k < order.length; k += 2) {
    var A = seeds[order[k + 1] - 1], B = seeds[order[k] - 1];
    ties.push(mkTie(A, B));
  }
  if (c.grpOf) {
    for (var z = 0; z < ties.length; z++) {
      if (c.grpOf[ties[z].a] === c.grpOf[ties[z].b]) {
        var sw = (z + 1) % ties.length;
        var t = ties[z].a; ties[z].a = ties[sw].a; ties[sw].a = t;
      }
    }
  }
  c.ko = {r: rounds.map(function (r) { return {n: r.n, W: r.W, ties: [], left: 0, enter: [], draw: "bracket", fin: !!r.fin}; }), ri: 0};
  koSetRound(c, 0, ties);
}
/* octavos de Champions: ganadores del playoff contra los 8 primeros */
function uclR16Fill(c) {
  var po = c.ko.r[0], ties = [];
  for (var i = 0; i < 8; i++) ties.push(mkTie(po.ties[7 - i].w, c.ko.top8[i]));
  c.ko.ri = 1;
  koSetRound(c, 1, ties);
}

/* ---------- partidos de la semana ---------- */
/* fixture: {ck: clave comp | "L:li", kind: "lg"|"tb"|"ko"|"nq", h, a, md?, gi?, ri, ti, leg, legs, neutral, nat} */
function weekFixtures(w) {
  var out = [];
  if (w <= 40) {
    S.L.forEach(function (L, li) {
      while (L.md < L.N && lgWeek(L, L.md) === w) {
        leagueFixtures(L, L.md).forEach(function (p) { out.push({ck: "L:" + li, kind: "lg", h: L.tm[p[0]], a: L.tm[p[1]], hi: p[0], ai: p[1], md: L.md}); });
        L.md++;
      }
    });
  }
  Object.keys(S.C).forEach(function (k) { compFixtures(S.C[k], w).forEach(function (f) { out.push(f); }); });
  return out;
}
function compFixtures(c, w) {
  var out = [];
  if (c.done || c.typ === "nq") return out;
  if (c.typ === "swiss") {
    while (c.md < c.mdW.length && c.mdW[c.md] === w) {
      c.sched[c.md].forEach(function (p) { out.push({ck: c.k, kind: "tb", h: c.teams[p[0]], a: c.teams[p[1]], hi: p[0], ai: p[1], md: c.md}); });
      c.md++;
    }
  } else if (c.typ === "grp") {
    while (c.md < c.nMd && c.mdW[c.md] === w) {
      for (var gi = 0; gi < c.g.length; gi++) {
        groupFixtures(c, gi, c.md).forEach(function (p) { out.push({ck: c.k, kind: "tb", nat: c.nat, h: c.g[gi][p[0]], a: c.g[gi][p[1]], gi: gi, hi: p[0], ai: p[1], md: c.md, neutral: c.nat}); });
      }
      c.md++;
    }
  }
  if (c.ko) {
    for (var ri = c.ko.ri; ri < c.ko.r.length; ri++) {
      var rd = c.ko.r[ri], leg = rd.W.indexOf(w);
      if (leg < 0) continue;
      if (ri !== c.ko.ri) break;
      rd.ties.forEach(function (t, ti) {
        if (t.w >= 0 || t.b < 0 || t.a < 0) return;
        var h = leg === 0 ? t.a : t.b, a = leg === 0 ? t.b : t.a;
        out.push({ck: c.k, kind: "ko", nat: c.nat, h: h, a: a, ri: ri, ti: ti, leg: leg, legs: rd.W.length, neutral: rd.fin || c.nat || c.neutral, fin: rd.fin, rn: rd.n});
      });
      break;
    }
  }
  return out;
}
function compOfFixture(f) { return f.ck.charAt(0) === "L" && f.ck.charAt(1) === ":" ? null : S.C[f.ck]; }
/* agregado previo de una eliminatoria desde la perspectiva de f.h / f.a */
function aggBefore(f) {
  var c = S.C[f.ck], t = c.ko.r[f.ri].ties[f.ti], A = 0, B = 0;
  for (var i = 0; i < f.leg; i++) { if (t.s[i]) { A += t.s[i][0]; B += t.s[i][1]; } }
  return f.h === t.a ? [A, B] : [B, A];
}
/* simular un partido ajeno al jugador (con prórroga y penaltis si decide eliminatoria) */
function simFixture(f) {
  var c = compOfFixture(f), nat = c && c.nat;
  var rh = nat ? S.nr[f.h] : S.cr[f.h], ra = nat ? S.nr[f.a] : S.cr[f.a];
  var g = simGoals(rh, ra, f.neutral ? 0 : 1), res = {gh: g[0], ga: g[1], eh: 0, ea: 0};
  if (f.kind === "ko" && f.leg === f.legs - 1) {
    var ag = aggBefore(f), H = ag[0] + g[0], A = ag[1] + g[1];
    if (H === A) {
      var e = extraTime(rh, ra); res.eh = e[0]; res.ea = e[1]; res.et = true;
      if (e[0] === e[1]) { var p = shootout(0.76, 0.76); res.ph = p[0]; res.pa = p[1]; }
    }
  }
  return res;
}
/* registrar el resultado en su competición */
function recordFixture(f, res) {
  var gh = res.gh + (res.eh || 0), ga = res.ga + (res.ea || 0);
  if (f.kind === "lg") {
    var L = S.L[+f.ck.slice(2)];
    tblAdd(L.tb[f.hi], res.gh, res.ga); tblAdd(L.tb[f.ai], res.ga, res.gh);
    return;
  }
  var c = S.C[f.ck];
  if (f.kind === "tb") {
    if (c.typ === "swiss") { tblAdd(c.tb[f.hi], res.gh, res.ga); tblAdd(c.tb[f.ai], res.ga, res.gh); }
    else { tblAdd(c.gt[f.gi][f.hi], res.gh, res.ga); tblAdd(c.gt[f.gi][f.ai], res.ga, res.gh); }
    c.left--;
    if (c.left <= 0 && !c.ko) {
      if (c.typ === "grp" && !c.finals) { c.done = true; c.gst = c.g.map(function (g, gi) { return sortTable(g, c.gt[gi], c.nat); }); }
      else buildKOFromTable(c);
    }
    return;
  }
  if (f.kind === "ko") {
    var rd = c.ko.r[f.ri], t = rd.ties[f.ti];
    var x = f.h === t.a ? [gh, ga] : [ga, gh];
    t.s[f.leg] = x;
    if (res.et) t.et = true;
    if (f.leg === f.legs - 1) {
      var A = 0, B = 0; t.s.forEach(function (s) { A += s[0]; B += s[1]; });
      if (A > B) t.w = t.a; else if (B > A) t.w = t.b;
      else {
        var pa = f.h === t.a ? [res.ph, res.pa] : [res.pa, res.ph];
        if (pa[0] == null) pa = shootout(0.76, 0.76);
        t.p = pa; t.w = pa[0] > pa[1] ? t.a : t.b;
      }
      rd.left--;
      if (rd.left <= 0) {
        if (f.ri === 0 && c.ko.top8) uclR16Fill(c);
        else koRoundDone(c, f.ri);
      }
    }
  }
}

/* ---------- competiciones de la temporada ---------- */
function contQual() {
  var Q = {UCL: [], UEL: [], UECL: [], LIB: [], SUD: [], CCC: [], ACL: [], CAF: []};
  W.lg.forEach(function (l, li) {
    if (l.t !== 1) return;
    var order = (S.last.final[li] || []).filter(function (c) { return S.cl[c] >= 0; }), pos = 0;
    function take(arr, k) { for (var i = 0; i < k && pos < order.length; i++) arr.push(order[pos++]); }
    if (l.eu) { take(Q.UCL, l.eu[0]); take(Q.UEL, l.eu[1]); take(Q.UECL, l.eu[2]); }
    if (l.sa) { take(Q.LIB, l.sa[0]); take(Q.SUD, l.sa[1]); }
    if (l.cc) take(Q.CCC, l.cc);
    if (l.afc) take(Q.ACL, l.afc);
    if (l.caf) take(Q.CAF, l.caf);
  });
  function flow(a, b, n) { while (a.length > n) { var x = a.pop(); if (b) b.unshift(x); } }
  flow(Q.UCL, Q.UEL, 36); flow(Q.UEL, Q.UECL, 36); flow(Q.UECL, null, 36);
  flow(Q.LIB, Q.SUD, 32); flow(Q.SUD, null, 32);
  flow(Q.CCC, null, 16); flow(Q.ACL, null, 24); flow(Q.CAF, null, 16);
  // completar huecos con los mejores clubes disponibles de la confederación
  var inAny = {};
  Object.keys(Q).forEach(function (k) { Q[k].forEach(function (c) { inAny[c] = 1; }); });
  var need = {UCL: [36, "UEFA"], UEL: [36, "UEFA"], UECL: [36, "UEFA"], LIB: [32, "CONMEBOL"], SUD: [32, "CONMEBOL"], CCC: [16, "CONCACAF"], ACL: [24, "AFC"], CAF: [16, "CAF"]};
  Object.keys(need).forEach(function (k) {
    var n = need[k][0], conf = need[k][1];
    if (Q[k].length >= n) return;
    var pool = [];
    W.clubs.forEach(function (cl, i) { var li = S.cl[i]; if (li >= 0 && !inAny[i] && W.lg[li].conf === conf && !(conf === "UEFA" && cl.c === "RU")) pool.push(i); });
    pool.sort(function (a, b) { return S.cr[b] - S.cr[a]; });
    while (Q[k].length < n && pool.length) { var c = pool.shift(); Q[k].push(c); inAny[c] = 1; }
  });
  return Q;
}
function cupWeeks(nRounds) { var wk = [38, 32, 27, 21, 15, 10, 6, 3]; return wk.slice(0, nRounds).reverse(); }
function mkDomesticCup(ci) {
  var lis = W.byCountry[ci], top = W.lg[lis[0]];
  var teams = [];
  lis.forEach(function (li) { teams = teams.concat(teamsOfLeague(li)); });
  if (teams.length < 4) return null;
  teams.sort(function (a, b) { return S.cr[b] - S.cr[a]; });
  var n = teams.length, size = 1; while (size < n) size *= 2;
  var nR = Math.round(Math.log(size) / Math.log(2)), wk = cupWeeks(nR), rounds = [];
  for (var i = 0; i < nR; i++) { var left = size / Math.pow(2, i); rounds.push({n: roundNames(left), W: [wk[i]], draw: "random", fin: i === nR - 1}); }
  // primera ronda: los más débiles juegan, los más fuertes pasan exentos
  var m0 = n - size / 2, playing = shuffle(teams.slice(n - 2 * m0)), byes = teams.slice(0, n - 2 * m0), ties = [];
  if (m0 === n / 2) { playing = shuffle(teams.slice()); byes = []; }
  for (var k = 0; k < playing.length; k += 2) {
    var a = playing[k], b = playing[k + 1];
    if (S.cr[a] > S.cr[b]) { var t = a; a = b; b = t; }
    ties.push(mkTie(a, b));
  }
  byes.forEach(function (bt) { ties.push(mkTie(bt, -1)); });
  ties = shuffle(ties);
  return mkKO("CUP:" + top.c, top.cup, "Copa", rounds, ties, {lvl: 3, dom: true, ci: ci});
}
function mkDomesticSuper(ci) {
  var lis = W.byCountry[ci], li = lis[0], top = W.lg[li];
  var fin = S.last.final[li] || [], champ = fin[0], cupW = S.last.cup[ci], cupF = S.last.cupF[ci];
  if (champ == null || cupW == null) return null;
  var four = top.c === "ES" || top.c === "IT" || top.c === "SA";
  if (four) {
    var parts = [champ];
    [fin[1], cupW, cupF, fin[2], fin[3]].forEach(function (x) { if (x != null && x >= 0 && parts.indexOf(x) < 0 && parts.length < 4) parts.push(x); });
    if (parts.length < 4) return null;
    return mkKO("SC:" + top.c, top.sc, "Supercopa", [{n: N_("Semifinales"), W: [18]}, {n: N_("Final"), W: [19], fin: true}], [mkTie(parts[0], parts[3]), mkTie(parts[1], parts[2])], {lvl: 2, dom: true, ci: ci, neutral: true});
  }
  var other = cupW !== champ ? cupW : fin[1];
  if (other == null) return null;
  return mkKO("SC:" + top.c, top.sc, "Supercopa", [{n: N_("Final"), W: [1], fin: true}], [mkTie(champ, other)], {lvl: 2, dom: true, ci: ci});
}
function setupSeasonComps() {
  S.C = {};
  // copas y supercopas nacionales
  Object.keys(W.byCountry).forEach(function (ci) {
    ci = +ci;
    var top = W.lg[W.byCountry[ci][0]];
    if (top.cup) { var cup = mkDomesticCup(ci); if (cup) S.C[cup.k] = cup; }
    if (top.sc) { var sc = mkDomesticSuper(ci); if (sc) S.C[sc.k] = sc; }
  });
  var Q = contQual();
  var koE = {po: true, W: [[25, 26], [28, 29], [31, 33], [35, 36], [40]]};
  S.C.UCL = mkSwiss("UCL", "Champions League", "Champions", Q.UCL, {mdW: [6, 8, 11, 13, 15, 18, 20, 22], ko: koE, lvl: 10, conf: "UEFA"});
  S.C.UEL = mkSwiss("UEL", "Europa League", "Europa League", Q.UEL, {mdW: [6, 8, 11, 13, 15, 18, 20, 22], ko: {po: true, W: [[25, 26], [28, 29], [31, 33], [35, 36], [39]]}, lvl: 6, conf: "UEFA"});
  if (!FEM) S.C.UECL = mkSwiss("UECL", "Conference League", "Conference", Q.UECL, {mdW: [8, 11, 13, 15, 18, 20], ko: {po: true, W: [[25, 26], [28, 29], [31, 33], [35, 36], [38]]}, lvl: 4, conf: "UEFA"});
  S.C.LIB = mkGroups("LIB", "Copa Libertadores", "Libertadores", Q.LIB, {ng: 8, double: true, mdW: [9, 11, 13, 16, 19, 21], koW: [[24, 26], [29, 31], [34, 36], [39]], lvl: 8, conf: "CONMEBOL"});
  if (!FEM) S.C.SUD = mkGroups("SUD", "Copa Sudamericana", "Sudamericana", Q.SUD, {ng: 8, double: true, mdW: [10, 12, 14, 17, 19, 22], koW: [[25, 27], [29, 31], [34, 36], [38]], lvl: 5, conf: "CONMEBOL"});
  S.C.ACL = mkSwiss("ACL", "AFC Champions League Elite", "AFC Champions", Q.ACL, {mdW: [6, 9, 12, 14, 16, 19, 21, 23], ko: {direct: 16, names: [N_("Octavos"), N_("Cuartos"), N_("Semifinales"), N_("Final")], W: [[26, 28], [32], [35], [38]]}, lvl: 7, conf: "AFC"});
  S.C.CAF = mkGroups("CAF", "CAF Champions League", "CAF Champions", Q.CAF, {ng: 4, double: true, mdW: [9, 12, 14, 17, 20, 22], koW: [[27, 29], [33, 35], [37, 39]], lvl: 7, conf: "CAF"});
  // Concachampions: eliminatoria directa
  var cc = Q.CCC.slice().sort(function (a, b) { return S.cr[b] - S.cr[a]; }), ord = bracketOrder(cc.length), cct = [];
  for (var i = 0; i < ord.length; i += 2) cct.push(mkTie(cc[ord[i + 1] - 1], cc[ord[i] - 1]));
  S.C.CCC = mkKO("CCC", "Concacaf Champions Cup", "Concachampions", [{n: N_("Octavos"), W: [21, 23]}, {n: N_("Cuartos"), W: [26, 28]}, {n: N_("Semifinales"), W: [32, 34]}, {n: N_("Final"), W: [38], fin: true}], cct, {lvl: 7, conf: "CONCACAF"});
  // supercopas continentales e Intercontinental
  var L = S.last.cont;
  if (!FEM && L.UCL >= 0 && L.UEL >= 0 && L.UCL !== L.UEL && L.UCL != null && L.UEL != null) S.C.USC = mkKO("USC", "Supercopa de Europa", "Supercopa UEFA", [{n: N_("Final"), W: [2], fin: true}], [mkTie(L.UCL, L.UEL)], {lvl: 4, conf: "UEFA", neutral: true});
  if (!FEM && L.LIB >= 0 && L.SUD >= 0 && L.LIB !== L.SUD && L.LIB != null && L.SUD != null) S.C.REC = mkKO("REC", "Recopa Sudamericana", "Recopa", [{n: N_("Final"), W: [23, 24]}], [mkTie(L.SUD, L.LIB)], {lvl: 3, conf: "CONMEBOL"});
  if (L.UCL != null && L.LIB != null) {
    var e = function (k, conf) { if (L[k] != null && L[k] >= 0) return L[k]; return bestOfConf(conf); };
    S.C.ICC = mkKO("ICC", "Copa Intercontinental", "Intercontinental", [
      {n: N_("Primera ronda"), W: [14]}, {n: N_("Challenger Cup"), W: [16]}, {n: N_("Final"), W: [17], fin: true, enter: [L.UCL]}
    ], [mkTie(e("CCC", "CONCACAF"), L.LIB), mkTie(e("CAF", "CAF"), e("ACL", "AFC"))], {lvl: 6, neutral: true});
  }
  setupNationsLeague();
}
function bestOfConf(conf) {
  var best = -1;
  W.clubs.forEach(function (c, i) { var li = S.cl[i]; if (li >= 0 && W.lg[li].conf === conf && (best < 0 || S.cr[i] > S.cr[best])) best = i; });
  return best;
}

/* ---------- selecciones ---------- */
function natTournamentsOf(year) {
  var out = [];
  natTours().forEach(function (T) { if (year >= T.start && (year - T.start) % T.every === 0) out.push(T); });
  return out;
}
function nextTournamentFor(ni, afterYear) {
  var conf = W.ctry[ni].conf, best = null;
  natTours().forEach(function (T) {
    if (T.special || T.u23 || T.noQual) return;
    if (T.conf !== "ALL" && T.conf !== conf) return;
    var y = T.start; while (y < afterYear) y += T.every;
    if (!best || y < best.y) best = {T: T, y: y};
  });
  return best;
}
function isHost(T, y, ni) { var h = T.hosts && T.hosts[y]; return !!(h && h.indexOf(W.ctry[ni].code) >= 0); }
function setupNationsLeague() {
  // fase de liga de la Nations League en otoños de año par
  if (S.yr % 2 !== 0) return;
  var u = natsOfConf("UEFA").filter(function (n) { return W.ctry[n].code !== "RU"; }).sort(function (a, b) { return S.nr[b] - S.nr[a]; });
  var A = u.slice(0, 16);
  var c = mkGroups("NL", "UEFA Nations League", "Nations League", A, {ng: 4, double: true, mdW: [5, 5, 10, 10, 15, 15], nat: true, finals: false, lvl: 3, conf: "UEFA"});
  c.sub = N_("Liga A");
  S.C.NL = c;
  var pn = S.p && S.mode !== "mgr" ? S.p.inat : -1;
  if (pn >= 0 && W.ctry[pn].conf === "UEFA" && A.indexOf(pn) < 0 && W.ctry[pn].code !== "RU") {
    var idx = u.indexOf(pn), lvl = idx < 32 ? N_("Liga B") : idx < 48 ? N_("Liga C") : N_("Liga D");
    var start = idx < 32 ? 16 : idx < 48 ? 32 : 48;
    var pool = u.slice(start, start + 16).filter(function (x) { return x !== pn; });
    pool.sort(function (a, b) { return Math.abs(S.nr[a] - S.nr[pn]) - Math.abs(S.nr[b] - S.nr[pn]); });
    var grp = [pn].concat(pool.slice(0, 3));
    var c2 = mkGroups("NLB", "UEFA Nations League", "Nations League", grp, {ng: 1, double: true, mdW: [5, 5, 10, 10, 15, 15], nat: true, finals: false, lvl: 1, conf: "UEFA"});
    c2.sub = lvl;
    S.C.NLB = c2;
  }
}
/* participantes de un torneo de selecciones */
function natParticipants(T, year, bonusFor) {
  var hosts = (T.hosts && T.hosts[year] ? T.hosts[year] : []).map(function (code) { return W.cIdx[code]; }).filter(function (x) { return x != null; });
  var res = hosts.slice(), score = {};
  function sc(n) {
    if (score[n] == null) score[n] = S.nr[n] + gauss() * 2.4 + (bonusFor && bonusFor[n] ? bonusFor[n] : 0);
    return score[n];
  }
  function takeTop(pool, k) {
    pool = pool.filter(function (n) { return res.indexOf(n) < 0 && W.ctry[n].code !== "RU"; }).sort(function (a, b) { return sc(b) - sc(a); });
    for (var i = 0; i < k && i < pool.length; i++) res.push(pool[i]);
  }
  if (T.conf === "ALL") {
    Object.keys(T.slots).forEach(function (conf) {
      var inConf = res.filter(function (n) { return W.ctry[n].conf === conf; }).length;
      takeTop(natsOfConf(conf), Math.max(0, T.slots[conf] - inConf));
    });
    var rest = [];
    W.confs.forEach(function (cf) { if (cf !== "UEFA") rest = rest.concat(natsOfConf(cf)); });
    takeTop(rest, T.size - res.length);
  } else if (T.noQual) {
    natsOfConf(T.conf).forEach(function (n) { if (res.indexOf(n) < 0) res.push(n); });
    if (T.guests) takeTop(natsOfConf(T.guests), T.size - res.length);
  } else {
    takeTop(natsOfConf(T.conf), T.size - res.length);
  }
  if (res.length > T.size) res = res.slice(0, T.size);
  if (res.length < T.size) { var all = range(W.ctry.length).filter(natLive); takeTop(all, T.size - res.length); }
  return res;
}
function koWeeksFrom(start, n) { var out = []; for (var i = 0; i < n; i++) out.push([start + i]); return out; }
function mkNatTournament(T, year, bonusFor) {
  if (T.special === "nlf") {
    var nl = S.lastNL;
    if (!nl || nl.length < 4) return null;
    var teams = nl.slice(0, 4);
    return mkKO("NLF", T.n + " " + year, "Nations League", [{n: N_("Semifinales"), W: [41]}, {n: N_("Final"), W: [42], fin: true}], [mkTie(teams[3], teams[0]), mkTie(teams[2], teams[1])], {nat: true, lvl: 4, conf: "UEFA", teams: teams});
  }
  var parts = natParticipants(T, year, bonusFor);
  var q = T.groups * 2 + T.thirds, nR = 0; for (var s = q; s >= 2; s /= 2) nR++;
  var c = mkGroups(T.k, T.n + " " + year, T.n, parts, {ng: T.groups, double: false, mdW: [41, 42, 43], nat: true, perGroup: 2, thirds: T.thirds, koW: koWeeksFrom(44, nR), lvl: tournamentLvl(T.k), conf: T.conf});
  c.tk = T.k; c.year = year;
  return c;
}
function tournamentLvl(k) { return {WC: 12, EURO: 9, CA: 9, AFCON: 6, ASIAN: 6, GOLD: 5, OFCN: 3, OLY: 5, NLF: 4}[k] || 4; }
function mkClubWorldCup(year) {
  var quota = {UEFA: 12, CONMEBOL: 6, CONCACAF: 4, AFC: 4, CAF: 4}, teams = [], perCountry = {};
  var winKey = {UEFA: "UCL", CONMEBOL: "LIB", CONCACAF: "CCC", AFC: "ACL", CAF: "CAF"};
  Object.keys(quota).forEach(function (conf) {
    var list = [];
    (S.hist[winKey[conf]] || []).slice(-4).forEach(function (h) { if (list.indexOf(h[1]) < 0 && h[1] >= 0) list.push(h[1]); });
    var pool = [];
    W.clubs.forEach(function (cl, i) { var li = S.cl[i]; if (li >= 0 && W.lg[li].conf === conf && W.lg[li].t === 1) pool.push(i); });
    pool.sort(function (a, b) { return S.cr[b] - S.cr[a]; });
    list.forEach(function (c) { perCountry[W.clubs[c].ci] = (perCountry[W.clubs[c].ci] || 0) + 1; });
    pool.forEach(function (c) {
      if (list.length >= quota[conf] || list.indexOf(c) >= 0) return;
      var ci = W.clubs[c].ci;
      if ((perCountry[ci] || 0) >= 2) return;
      perCountry[ci] = (perCountry[ci] || 0) + 1; list.push(c);
    });
    teams = teams.concat(list.slice(0, quota[conf]));
  });
  teams.push(W.extra["Auckland City"]);
  var pool2 = W.clubs.map(function (_, i) { return i; }).filter(function (i) { return S.cl[i] >= 0 && teams.indexOf(i) < 0 && W.lg[S.cl[i]].t === 1; }).sort(function (a, b) { return S.cr[b] - S.cr[a]; });
  while (teams.length < 32 && pool2.length) teams.push(pool2.shift());
  return mkGroups("CWC", "Mundial de Clubes " + year, N_("Mundial de Clubes"), teams, {ng: 8, double: false, mdW: [41, 42, 43], perGroup: 2, thirds: 0, koW: koWeeksFrom(44, 4), lvl: 7});
}

/* ---------- fin de temporada (mundo) ---------- */
function seasonEndWorld() {
  var yr = S.yr;
  W.lg.forEach(function (l, li) {
    var st = standings(li);
    S.last.final[li] = st.map(function (x) { return x.c; });
    if (st.length) histPush("L:" + l.id, yr, st[0].c);
  });
  Object.keys(S.C).forEach(function (k) {
    var c = S.C[k];
    if (c.typ === "grp" && !c.finals) return;
    if (c.win == null || c.win < 0) return;
    if (c.dom) { S.last.cup[c.ci] = c.win; S.last.cupF[c.ci] = koFinalist(c); histPush(c.k, yr, c.win); }
    else if (!c.nat) { S.last.cont[k] = c.win; histPush(k, yr, c.win); S.cr[c.win] += 0.7; }
  });
  if (S.C.NL && S.C.NL.gst) S.lastNL = S.C.NL.gst.map(function (st) { return st[0].c; }).sort(function (a, b) { return S.nr[b] - S.nr[a]; });
  else if (S.yr % 2 === 1) S.lastNL = null;
  // evolución de la fuerza de los clubes
  W.lg.forEach(function (l, li) {
    var L = S.L[li], fin = S.last.final[li], n = fin.length;
    fin.forEach(function (c, pos) {
      var e = L.exp.indexOf(c);
      S.cr[c] += (e - pos) / n * 1.8 + gauss() * 0.65;
    });
  });
  // ascensos y descensos
  var doneDv = {};
  W.lg.forEach(function (l, li) {
    if (l.downDv) {
      /* la división de arriba (uno o varios grupos) baja tantos como suben de los grupos de abajo */
      var upper = l.dv ? W.dv[l.dv] : [li], key = l.dv || ("L" + li);
      if (doneDv[key]) return; doneDv[key] = 1;
      var lower = W.dv[l.downDv], ups = [], downs = [];
      lower.forEach(function (g) { S.last.final[g].slice(0, W.lg[g].upN || 1).forEach(function (c) { ups.push(c); }); });
      for (var d = 1; downs.length < ups.length && d < 30; d++) {
        var row = upper.map(function (g) { var f = S.last.final[g]; return f[f.length - d]; }).filter(function (c) { return c != null && downs.indexOf(c) < 0; });
        shuffle(row).forEach(function (c) { if (downs.length < ups.length) downs.push(c); });
      }
      var freeUp = downs.map(function (c) { return S.cl[c]; }), freeDown = ups.map(function (c) { return S.cl[c]; });
      ups.forEach(function (c, i) { S.cl[c] = freeUp[i]; S.cr[c] += 1.1; });
      /* cada descendido va a un grupo de abajo con hueco, mejor si es su grupo de origen */
      downs.forEach(function (c) {
        var j = freeDown.indexOf(W.clubs[c].lg0);
        if (j < 0) j = 0;
        S.cl[c] = freeDown[j]; freeDown.splice(j, 1); S.cr[c] -= 1.4;
      });
      return;
    }
    if (l.downI < 0 || !l.rel) return;
    var top = S.last.final[li], low = S.last.final[l.downI], k = l.rel;
    top.slice(-k).forEach(function (c) { S.cl[c] = l.downI; S.cr[c] -= 1.4; });
    low.slice(0, k).forEach(function (c) { S.cl[c] = li; S.cr[c] += 1.1; });
  });
  W.clubs.forEach(function (cl, i) {
    var li = S.cl[i]; if (li < 0) return;
    var L = W.lg[li], mid = (L.top + L.bot) / 2;
    S.cr[i] = round1(clamp(S.cr[i] + (mid - S.cr[i]) * 0.05, L.bot - 4, L.top + 3));
  });
  W.ctry.forEach(function (c, i) { S.nr[i] = round1(clamp(S.nr[i] + (natR0(i) - S.nr[i]) * 0.18 + gauss() * 0.7, 35, 92)); });
}
