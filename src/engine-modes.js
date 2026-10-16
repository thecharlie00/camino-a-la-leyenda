/* ===== MODOS DE JUEGO · BANQUILLO · CLUB PROPIO · PLANTILLAS REALES =====
   - Carrera de míster directa y «Crea tu club» (además de la carrera de jugador).
   - Banquillo (hasta 9) y no convocados; mover jugadores entre once, banquillo y grada.
   - Plantillas y entrenadores reales con nombres versionados (REAL, en real.js) cuando existen. */
var BENCH_N = 9;
var DIFFS = [N_("Fácil"), N_("Normal"), N_("Difícil"), N_("Leyenda")];
var DIFF_REP = [55, 38, 24, 12], DIFF_BUD = [1.3, 1, 0.8, 0.6], DIFF_SACK = [[6, 9], [12, 15], [15, 18], [18, 22]];
var CLUB_BUD = [1.6, 1, 0.7, 0.45];
var REAL_TRAITS = ["lider", "profesional", "ambicioso"];

function mDiff() { return S.m && S.m.diff != null ? S.m.diff : 1; }
function mSackT(k) { return DIFF_SACK[mDiff()][k]; }
function mBudM() { return S.m && S.m.budM ? S.m.budM : 1; }

/* ---------- banquillo ---------- */
function mBestBench(xi) {
  var inXI = {};
  (xi || S.m.xi || []).forEach(function (id) { if (id != null) inXI[id] = 1; });
  var c = mActive().filter(function (p) { return !inXI[p.id]; }).sort(function (a, b) { return (mAvail(b) - mAvail(a)) || (b.ovr - a.ovr); });
  var out = [], gk = c.filter(function (p) { return p.pos === "POR"; })[0];
  if (gk) out.push(gk.id);
  ["DEF", "MED", "DEL"].forEach(function (g) {
    var q = c.filter(function (p) { return W.pos[p.pos].g === g && out.indexOf(p.id) < 0; })[0];
    if (q) out.push(q.id);
  });
  c.forEach(function (p) { if (out.length < BENCH_N && out.indexOf(p.id) < 0 && p.pos !== "POR") out.push(p.id); });
  return out;
}
function mFixBench() {
  var m = S.m, inXI = {}, seen = {};
  (m.xi || []).forEach(function (id) { if (id != null) inXI[id] = 1; });
  if (!m.bench) { m.bench = mBestBench(m.xi); return; }
  m.bench = m.bench.filter(function (id) { var q = mPl(id); if (!q || q.loanOut || inXI[id] || seen[id]) return false; seen[id] = 1; return true; }).slice(0, BENCH_N);
}
/* al empezar temporada el banquillo se completa con los mejores disponibles */
function mTopBench() {
  var m = S.m; mFixBench();
  mBestBench(m.xi).forEach(function (id) { if (m.bench.length < BENCH_N && m.bench.indexOf(id) < 0) m.bench.push(id); });
}
function mBenchAdd(p) { var m = S.m; if (m.bench && m.bench.length < BENCH_N && m.bench.indexOf(p.id) < 0 && m.xi.indexOf(p.id) < 0) m.bench.push(p.id); }
function mZoneOf(id) {
  var m = S.m, i = m.xi.indexOf(id);
  if (i >= 0) return ["xi", i];
  i = (m.bench || []).indexOf(id);
  if (i >= 0) return ["bench", i];
  return ["nc", -1];
}
/* src/dst: {z: "xi"|"bench"|"nc", i?: hueco del once, id?: jugador}. Soltar encima de otro jugador
   los intercambia; soltar en una zona libre lo mueve allí. Devuelve true, false o "full". */
function mgrMove(src, dst) {
  var m = S.m;
  if (!m || m.club < 0) return false;
  m.bench = m.bench || [];
  var sid = src.z === "xi" ? m.xi[src.i] : src.id;
  var sp = sid != null ? mPl(sid) : null;
  if (!sp || sp.loanOut) return false;
  var tid = dst.z === "xi" ? m.xi[dst.i] : (dst.id != null ? dst.id : null);
  if (tid != null && (!mPl(tid) || mPl(tid).loanOut)) tid = null;
  if (tid === sid) return false;
  var a = mZoneOf(sid), b = tid != null ? mZoneOf(tid) : [dst.z, dst.z === "xi" ? dst.i : -1];
  if (tid == null && a[0] === b[0] && a[0] !== "xi") return false;
  if (tid == null && b[0] === "bench" && a[0] !== "bench" && m.bench.length >= BENCH_N) return "full";
  var fs = FORMATIONS[m.form] || [];
  if (b[0] === "xi" && fs[b[1]] && !posOk(sp.pos, fs[b[1]])) return "pos";
  if (tid != null && a[0] === "xi" && fs[a[1]] && !posOk(mPl(tid).pos, fs[a[1]])) return "pos";
  if (a[0] === "xi") m.xi[a[1]] = null; else if (a[0] === "bench") m.bench[a[1]] = null;
  if (tid != null) {
    if (b[0] === "xi") m.xi[b[1]] = null; else if (b[0] === "bench") m.bench[b[1]] = null;
    if (a[0] === "xi") m.xi[a[1]] = tid; else if (a[0] === "bench") m.bench[a[1]] = tid;
  }
  if (b[0] === "xi") m.xi[b[1]] = sid;
  else if (b[0] === "bench") { if (b[1] >= 0) m.bench[b[1]] = sid; else m.bench.push(sid); }
  m.bench = m.bench.filter(function (id) { return id != null; });
  return true;
}
function mgrRename(pid, fn, ln) {
  var p = mPl(pid);
  if (!p) return false;
  fn = String(fn == null ? "" : fn).replace(/\s+/g, " ").trim().slice(0, 20);
  ln = String(ln == null ? "" : ln).replace(/\s+/g, " ").trim().slice(0, 24);
  if (!fn && !ln) return false;
  if (!ln) { ln = fn; fn = ""; }
  p.fn = fn; p.ln = ln;
  return true;
}
/* «Nombre Apellido» escrito en una sola casilla */
function splitName(full) {
  var t = String(full || "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  var i = t.indexOf(" ");
  return i < 0 ? {fn: "", ln: t} : {fn: t.slice(0, i), ln: t.slice(i + 1)};
}

/* ---------- entrenadores ---------- */
function fakeCoach(c, salt) {
  var cl = W.clubs[c], pool = namePool(cl.ci), f = pool.f.split(","), l = pool.l.split(",");
  var hh = hashStr("dt" + (cl.n0 || cl.n) + (salt || ""));
  return f[hh % f.length] + " " + l[Math.floor(hh / 7) % l.length];
}
function coachName(c) {
  if (c == null || c < 0 || !W.clubs[c]) return "";
  if (S && S.mode === "mgr" && S.m && S.m.club === c) return (S.m.fn ? S.m.fn + " " : "") + S.m.ln;
  if (S && S.coach && S.coach[c]) return S.coach[c];
  var rc = realClub(c);
  if (rc && rc.co) return rc.co;
  return fakeCoach(c);
}
function coachLeaves(c) { if (c >= 0) (S.coach = S.coach || {})[c] = fakeCoach(c, S.yr); }

/* ---------- plantillas reales (nombres versionados) ----------
   REAL = {y: año de los datos, c: {"Club": {co: "Entrenador", p: [[nombre, apellido, pos, edad, media, país, pot?], …]}}} */
/* plantillas reales: masculinas (REAL) o femeninas (REALF); las partidas femeninas de la 1.8 no tienen */
function realDB() {
  if (S && S.g === "f") return S.wk === "f" && typeof REALF !== "undefined" ? REALF : null;
  return typeof REAL !== "undefined" ? REAL : null;
}
function realClub(c) {
  var R = realDB();
  if (!R || !R.c || c == null || c < 0 || !W.clubs[c]) return null;
  if (S && S.custom && S.custom.id === c) return null;
  var cl = W.clubs[c];
  return R.c[cl.n0 || cl.n] || null;
}
function realKey(c) { var cl = W.clubs[c]; return cl.n0 || cl.n; }
function realAt(rec, yr) {
  var dy = Math.max(0, yr - (realDB() || {y: 2026}).y), a = rec[3], o = rec[4];
  for (var k = 0; k < dy; k++) { var g = a + k; o += g <= 20 ? 2.6 : g <= 23 ? 1.6 : g <= 26 ? 0.7 : g <= 29 ? 0 : g <= 31 ? -1 : g <= 33 ? -2 : -3; }
  if (rec[6] && o > rec[6] && a + dy <= 27) o = rec[6];
  return {age: a + dy, ovr: clamp(o, 40, 94)};
}
function realRetired(rec, yr, i) { return realAt(rec, yr).age > 35 + (hashStr(rec[1] + "|" + i) % 4); }
function realPot(rec, at, ofs) {
  if (rec[6]) return round1(clamp(Math.max(rec[6] + ofs, at.ovr + ofs), 40, 95));
  var hh = hashStr(rec[0] + rec[1]) % 100 / 100, a = at.age;
  var gain = a <= 19 ? 7 + hh * 7 : a <= 21 ? 4 + hh * 5 : a <= 24 ? 1 + hh * 4 : a <= 27 ? hh * 1.5 : 0;
  return round1(Math.min(95, at.ovr + ofs + gain));
}
/* desplaza la escala de los datos a la valoración del club en el juego */
function realOffset(c, yr) {
  var rc = realClub(c);
  if (!rc) return 0;
  W.rofs = W.rofs || {};
  var key = c + ":" + yr + ":" + Math.round(S.cr[c] * 2);
  if (W.rofs[key] != null) return W.rofs[key];
  var l = [];
  rc.p.forEach(function (r, i) { if (!realRetired(r, yr, i)) l.push(realAt(r, yr).ovr); });
  l.sort(function (a, b) { return b - a; });
  l = l.slice(0, 11);
  var avg = l.length ? l.reduce(function (s, x) { return s + x; }, 0) / l.length : S.cr[c];
  return (W.rofs[key] = l.length >= 8 ? clamp(S.cr[c] - avg, -6, 6) : 0);
}
function realPl(c, r, i, ofs) {
  var at = realAt(r, S.yr), ni = W.cIdx[r[5]];
  return {fn: r[0], ln: r[1], pos: r[2], age: at.age, ovr: clamp(at.ovr + ofs, 40, 94), pot: realPot(r, at, ofs), ni: ni != null ? ni : W.clubs[c].ci,
    rid: realKey(c) + "#" + i, tr: chance(0.2) ? pick(REAL_TRAITS) : null};
}
function realSquad(club) {
  var rc = realClub(club);
  if (!rc) return null;
  var ofs = realOffset(club, S.yr), used = S.rp || {}, out = [];
  rc.p.forEach(function (r, i) {
    var rid = realKey(club) + "#" + i;
    if (used[rid] || realRetired(r, S.yr, i) || !W.pos[r[2]]) return;
    out.push(newPl(Object.assign(realPl(club, r, i, ofs), {yrs: ri(1, 5)})));
  });
  if (out.length < 14) return null;
  out.sort(function (a, b) { return b.ovr - a.ovr; });
  var gks = out.filter(function (p) { return p.pos === "POR"; }), field = out.filter(function (p) { return p.pos !== "POR"; });
  out = gks.slice(0, 3).concat(field.slice(0, 25));
  /* completar huecos con jugadores inventados */
  var r0 = S.cr[club], ci = W.clubs[club].ci;
  SQUAD_PLAN.forEach(function (x) {
    var have = out.filter(function (p) { return p.pos === x[0]; }).length, want = Math.max(1, x[0] === "POR" ? 3 : x[1] - 1);
    for (var k = have; k < want && out.length < 28; k++) {
      var young = chance(0.5), age = young ? ri(17, 20) : ri(21, 31);
      out.push(newPl({pos: x[0], ovr: clamp(r0 - (young ? rf(8, 14) : rf(3, 7)), 40, 90), age: age, ni: mNat(ci), yth: young && chance(0.7), yrs: ri(1, 4)}));
    }
  });
  mAssignRoles(out);
  out.forEach(function (p) {
    p.sal = mWageFor(p, club);
    p.since = S.yr - ri(0, Math.min(6, Math.max(0, p.age - 18)));
    if (p.yth) p.since = S.yr - ri(0, 1);
    if (p.rid) used[p.rid] = 1;
  });
  S.rp = used;
  return out;
}
/* objetivo de mercado real del club c para el puesto pos (o cercano) */
function realTargetFor(c, pos, young) {
  var rc = realClub(c);
  if (!rc) return null;
  var ofs = realOffset(c, S.yr), used = S.rp || {}, taken = {}, cands = [];
  ((S.m && S.m.mk && S.m.mk.list) || []).forEach(function (t) { if (t.rid) taken[t.rid] = 1; });
  rc.p.forEach(function (r, i) {
    var rid = realKey(c) + "#" + i;
    if (used[rid] || taken[rid] || realRetired(r, S.yr, i) || !W.pos[r[2]]) return;
    var age = realAt(r, S.yr).age;
    if (young ? age > 22 : age < 20) return;
    var w = r[2] === pos ? 4 : (POS_NEAR[pos] || []).indexOf(r[2]) >= 0 ? 1 : 0;
    if (w) cands.push({r: r, i: i, w: w});
  });
  var x = wpick(cands, function (z) { return z.w; });
  return x ? realPl(c, x.r, x.i, ofs) : null;
}
function realUse(rid) { if (rid) (S.rp = S.rp || {})[rid] = 1; }
/* rivales del Balón de Oro: las estrellas reales de las ligas con datos */
function realRivals() {
  var R = realDB();
  if (!R || !R.c) return null;
  var all = [];
  Object.keys(R.c).forEach(function (cn) {
    var c = W.cName[cn];
    if (c == null || S.cl[c] < 0) return;
    var ofs = realOffset(c, S.yr);
    R.c[cn].p.forEach(function (r, i) {
      if (realRetired(r, S.yr, i) || !W.pos[r[2]]) return;
      var x = realPl(c, r, i, ofs);
      all.push({n: (x.fn ? x.fn.charAt(0) + ". " : "") + x.ln, ni: x.ni, g: W.pos[x.pos].g, ovr: round1(x.ovr), age: x.age, pot: round1(Math.max(x.ovr, x.pot)), club: c, rl: 1});
    });
  });
  var est = all.filter(function (x) { return x.age >= 21; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 34);
  var yng = all.filter(function (x) { return x.age <= 20; }).sort(function (a, b) { return b.pot + b.ovr - a.pot - a.ovr; }).slice(0, 12);
  if (est.length < 20) return null;
  return est.concat(yng);
}

/* ---------- club propio ---------- */
function resetCustom() {
  var touched = false;
  (W.clubs || []).forEach(function (c) {
    if (c.n0 == null) return;
    c.n = c.n0; c.ab = abbr(c.n0); c.col = clubColors(c.n0); if (c.r00 != null) c.r0 = c.r00; delete c.cs;
    delete c.n0; delete c.r00; touched = true;
  });
  if (touched) {
    W.derby = {};
    DATA.derbies.forEach(function (d) { var a = W.cName[d[0]], b = W.cName[d[1]]; if (a != null && b != null) { W.derby[a + "-" + b] = 1; W.derby[b + "-" + a] = 1; } });
  }
  W.rofs = {};
}
function applyCustom() {
  var cu = S && S.custom;
  if (!cu || !W.clubs[cu.id]) return;
  var c = W.clubs[cu.id];
  if (c.n0 == null) { c.n0 = c.n; c.r00 = c.r0; }
  /* los datos del club propio pueden venir de un código de partida: se limpian */
  var okc = function (x) { return /^#[0-9a-fA-F]{6}$/.test(x) ? x : "#c8102e"; };
  cu.n = String(cu.n || "Club").slice(0, 26); cu.ab = String(cu.ab || "FC").slice(0, 4); cu.col = [okc((cu.col || [])[0]), okc((cu.col || [])[1])];
  c.n = cu.n; c.ab = cu.ab; c.col = cu.col.slice(); if (cu.r0 != null) c.r0 = cu.r0;
  /* escudo y equipación elegidos (parche 2.0) */
  var okIn = function (list, v, d) { return typeof list !== "undefined" && list.some(function (x) { return x[0] === v; }) ? v : d; };
  if (cu.crest) { cu.crest = {shape: okIn(typeof CREST_SHAPES !== "undefined" ? CREST_SHAPES : [], cu.crest.shape, "shield"), pat: okIn(typeof CREST_PATS !== "undefined" ? CREST_PATS : [], cu.crest.pat, "band")}; c.cs = cu.crest; }
  if (cu.kit) cu.kit = {pat: okIn(typeof KIT_PATS !== "undefined" ? KIT_PATS : [], cu.kit.pat, "plain"), col3: okc(cu.kit.col3)};
  Object.keys(W.derby).forEach(function (k) { var a = k.split("-"); if (+a[0] === cu.id || +a[1] === cu.id) delete W.derby[k]; });
}
function clubAbbr(n) { var a = abbr(n || ""); return a || String(n || "").slice(0, 3).toUpperCase(); }

/* ---------- carreras nuevas: míster y club propio ---------- */
function baseMgrState(o) {
  buildWorld(o.g === "f" ? "f" : "m"); resetCustom();
  S = {v: 1, rng: (o.seed != null ? o.seed : (Date.now() ^ Math.floor(Math.random() * 1e9))) | 0, set: {ev: o.ev != null ? o.ev : 1},
    yr: START_YEAR - 1, tw: 0, w: 0, ph: "mjob", bi: 0, pend: [], feed: [], q: {}, cur: null, blog: [], bnews: [], uid: Date.now().toString(36) + Math.floor(Math.random() * 90 + 10),
    mode: "mgr", p: null, kind: o.kind, g: o.g === "f" ? "f" : "m", wk: o.g === "f" ? "f" : "m"};
  setFem(S.g === "f");
  initWorld();
}
function newMgrState(o) {
  var d = o.diff != null ? o.diff : 1, rep = DIFF_REP[d];
  return {fn: o.fn || "", ln: o.ln, nat: W.cIdx[o.nat] != null ? W.cIdx[o.nat] : W.cIdx.ES, age: (o.age || 40) - 1, rep: rep, club: -1, since: 0, sal: 0, money: 0,
    form: "4-3-3", ment: 1, rot: 1, xi: [], bench: null, cap: null, sq: [], nid: 1, tid: 0, mk: {open: "", list: [], tx: []},
    board: 60, fans: 55, chem: 50, bud: 0, wcap: 0, objs: [], ss: null, seasons: [], trophies: [], awards: [], tx: [], focus: null, buffs: [],
    flags: {}, evCd: {}, alumni: [], spells: [], peakRep: rep, y0: START_YEAR, exClub: -1, lastBlk: null, youth: null, mom: 0, diff: d, budM: DIFF_BUD[d]};
}
/* o: {fn, ln, nat, age, diff, ev, club, seed} */
function newManagerCareer(o) {
  baseMgrState({seed: o.seed, ev: o.ev, kind: "mgr", g: o.g});
  setupRivals();
  S.m = newMgrState(o);
  mgrJoinClub(o.club, {sal: mgrSalary(o.club)});
  mgrStartSeason();
  return S;
}
/* nivel inicial del club propio según la dificultad */
function customRating(li, id, diff) {
  var tm = teamsOfLeague(li).filter(function (c) { return c !== id; }).map(function (c) { return S.cr[c]; }).sort(function (a, b) { return b - a; });
  if (!tm.length) return 65;
  return round1([tm[0] + 1, tm[Math.floor(tm.length / 2)] + 1, tm[tm.length - 1] + 1, tm[tm.length - 1] - 3][diff != null ? diff : 1]);
}
/* o: {fn, ln, nat, age, diff, ev, seed, cn (nombre del club), ab, col: [c1, c2], repl (club al que sustituye)} */
function newClubCareer(o) {
  baseMgrState({seed: o.seed, ev: o.ev, kind: "club", g: o.g});
  var id = o.repl, li = S.cl[id], d = o.diff != null ? o.diff : 1;
  var r = customRating(li, id, d);
  S.custom = {id: id, n: o.cn, ab: o.ab || clubAbbr(o.cn), col: (o.col || ["#c8102e", "#ffffff"]).slice(0, 2), r0: r, crest: o.crest || null, kit: o.kit || null};
  applyCustom();
  S.cr[id] = r;
  S.last.final[li] = teamsOfLeague(li).sort(function (a, b) { return S.cr[b] - S.cr[a]; });
  setupRivals();
  S.m = newMgrState(o);
  S.m.owner = true; S.m.budM = CLUB_BUD[d];
  if (o.role === "pres") S.m.pres = {coach: null};
  mgrJoinClub(id, {sal: mgrSalary(id)});
  S.m.board = 70; S.m.fans = 62;
  S.feed = [];
  feed({t: "mfound", y: S.yr + 1, club: id, lg: li, r: Math.round(S.cr[id]), bud: S.m.bud, diff: d});
  S.ph = "draft";
  return S;
}
/* plantilla nueva para el club propio antes de empezar */
function clubRedraft() {
  var m = S.m;
  if (S.ph !== "draft") return false;
  S.cr[m.club] = S.custom.r0;
  m.sq = genSquad(m.club);
  m.xi = mBestXI(m.form); m.bench = mBestBench(m.xi); m.cap = mPickCaptain();
  m.wcap = Math.round(mWageBill() * 1.12 / 1e5) * 1e5;
  mSync();
  return true;
}
function clubStart() {
  if (S.ph !== "draft") return false;
  mgrStartSeason();
  return true;
}

/* ---------- ofertas para empezar ----------
   Jugador que sale de la cantera: tres clubes modestos de su país (divisiones inferiores si las hay).
   Míster que empieza desde abajo: tres clubes de ligas menos potentes (Argentina, Arabia, MLS…). */
function rndPick(list, w) {
  var t = 0; list.forEach(function (x) { t += w(x); });
  var r = Math.random() * t;
  for (var i = 0; i < list.length; i++) { r -= w(list[i]); if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
function startOffersPlayer(code, base) {
  var ni = W.cIdx[code], lis = (W.byCountry[ni] || []).slice();
  if (!lis.length) {
    var conf = W.ctry[ni] ? W.ctry[ni].conf : "UEFA";
    lis = W.lg.map(function (l, i) { return i; }).filter(function (i) { return W.lg[i].conf === conf && W.lg[i].t === 1 && W.lg[i].top < 78; });
  } else if (lis.length > 1) {
    var lower = lis.filter(function (li) { return W.lg[li].t >= 3; });
    lis = lower.length ? lower : lis.filter(function (li) { return W.lg[li].t >= 2; });
  }
  var out = [], used = {};
  for (var k = 0; k < 3 && lis.length; k++) {
    var pool = [];
    lis.forEach(function (li) { W.lg[li].cl0.forEach(function (c) { if (!used[c]) pool.push(c); }); });
    if (!pool.length) break;
    var c = rndPick(pool, function (i) { var d = W.clubs[i].r0 - base; return (d > 12 ? 0.15 : d < -10 ? 0.3 : 1) * (out.some(function (o) { return W.clubs[o].lg0 === W.clubs[i].lg0; }) ? 0.25 : 1); });
    used[c] = 1; out.push(c);
  }
  return out;
}
var BIG5 = {ENG1: 1, ESP1: 1, ITA1: 1, GER1: 1, FRA1: 1};
function startOffersMgr() {
  var lis = W.lg.map(function (l, i) { return i; }).filter(function (i) { var l = W.lg[i]; return l.t === 1 && !BIG5[l.id] && l.cl0.length >= 10; });
  var out = [], usedL = {};
  for (var k = 0; k < 3; k++) {
    var li = rndPick(lis.filter(function (i) { return !usedL[i]; }), function (i) { var l = W.lg[i]; return l.conf === "UEFA" ? 0.35 : 1.2; });
    if (li == null) break;
    usedL[li] = 1;
    var cl = W.lg[li].cl0.slice().sort(function (a, b) { return W.clubs[b].r0 - W.clubs[a].r0; });
    var from = Math.floor(cl.length * 0.35), to = Math.floor(cl.length * 0.8);
    out.push(cl[from + Math.floor(Math.random() * Math.max(1, to - from))]);
  }
  return out;
}
