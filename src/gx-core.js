/* gx-core.js — bus de sucesos, contadores y trofeos ampliados (5.6).
   Los motores avisan con GX.ev(tipo, datos); los analizadores de abajo ponen marcas (S.gx.f) y suman
   contadores (S.gx.c). Las estadísticas de carrera se calculan desde el historial, así que una partida
   antigua desbloquea en silencio lo que ya había cumplido. Los trofeos se guardan como los logros de
   siempre (S.ach) y además con fecha y partido (S.gx.t). Los detalles de cada gol (desde dónde, minuto)
   salen de un generador propio con semilla: nunca se toca R() y los resultados no cambian. */
/* cifras con separador de miles del idioma (dígitos tabulares en la interfaz) */
function gxNum(n) { var s = String(Math.round(n)), sep = typeof LANG !== "undefined" ? (LANG === "en" ? "," : LANG === "fr" ? "\u202f" : ".") : "."; return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
var GX = (function () {
  var api = {}, dirty = true, cache = null;
  function st() {
    if (!S) return null;
    var g = S.gx;
    if (!g || g.v !== 1) g = S.gx = {v: 1, c: {}, f: {}, t: {}, k: {}, nums: {}, titles: [], q: [], retro: 0};
    return g;
  }
  api.st = st;
  function hs(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var r = (seed >>> 0) % 2147483647 || 1; return function () { r = (r * 48271) % 2147483647; return r / 2147483647; }; }
  api.rng = rng; api.hs = hs;
  /* ---------- marcas, contadores y rachas ---------- */
  api.flag = function (k) { var g = st(); if (!g || g.f[k]) return; g.f[k] = S.yr || 1; dirty = true; };
  api.has = function (k) { var g = st(); return !!(g && g.f[k]); };
  api.add = function (k, n) { var g = st(); if (!g) return; g.c[k] = (g.c[k] || 0) + (n == null ? 1 : n); dirty = true; };
  api.cnt = function (k) { var g = st(); return g ? g.c[k] || 0 : 0; };
  /* racha: sube con ok, se corta con !ok; guarda la mejor en c[k + "Best"] */
  api.streak = function (k, ok) {
    var g = st(); if (!g) return 0;
    g.k[k] = ok ? (g.k[k] || 0) + 1 : 0;
    if (g.k[k] > (g.c[k + "Best"] || 0)) g.c[k + "Best"] = g.k[k];
    dirty = true; return g.k[k];
  };
  api.dirty = function () { dirty = true; };
  /* ---------- bus ---------- */
  var H = {};
  api.on = function (t, fn) { (H[t] = H[t] || []).push(fn); };
  api.ev = function (t, d) {
    if (!S) return;
    (H[t] || []).forEach(function (fn) { try { fn(d || {}); } catch (e) { if (api.debugOn) console.warn("GX", t, e); } });
    dirty = true;
  };

  /* ---------- estadísticas de carrera (siempre desde el historial) ---------- */
  function P() { return S.p || S.retiredP || null; }
  function cur(p) { var last = p.seasons[p.seasons.length - 1]; return last && last.y === S.yr ? null : p.ss; }
  function rows(p) { var r = p.seasons.slice(), c = cur(p); if (c && c.apps) r.push({club: p.club, clubs: c.clubs, pos: p.pos, apps: c.apps, min: c.min, g: c.g, a: c.a, cs: c.cs, rc: c.rc, y: S.yr, cur: 1}); return r; }
  function sum(p, k) { return rows(p).reduce(function (s, r) { return s + (r[k] || 0); }, 0); }
  function best(p, k) { return rows(p).reduce(function (s, r) { return Math.max(s, r[k] || 0); }, 0); }
  function aw(p, re) { return (p.awards || []).filter(function (a) { return re.test(a.k); }).length; }
  function clubsOf(p) { var o = {}; rows(p).forEach(function (r) { (r.clubs || [r.club]).forEach(function (c) { if (c != null && c >= 0) o[c] = 1; }); }); if (p.club >= 0) o[p.club] = 1; return Object.keys(o).map(Number); }
  function petOfNow() { try { var L = S.p && S.p.life; return L && L.pet && L.pet.v === 2 ? L.pet : null; } catch (e) { return null; } }
  var LOST = [4, 8, 15, 16, 23, 42];
  var GX_STATS = {
    goals: function (p) { return sum(p, "g"); },
    assists: function (p) { return sum(p, "a"); },
    apps: function (p) { return sum(p, "apps"); },
    minutes: function (p) { return sum(p, "min"); },
    cleanSheets: function (p) { return sum(p, "cs"); },
    bestSeasonGoals: function (p) { return best(p, "g"); },
    bestSeasonAssists: function (p) { return best(p, "a"); },
    bestSeasonCS: function (p) { return best(p, "cs"); },
    bestSeasonReds: function (p) { return best(p, "rc"); },
    bestSeasonTitles: function (p) { var by = {}; (p.trophies || []).forEach(function (t) { var k = t.s || t.y; by[k] = (by[k] || 0) + 1; }); var m = 0; for (var k in by) m = Math.max(m, by[k]); return m; },
    worldCups: function (p) { return (p.trophies || []).filter(function (t) { return t.nat >= 0 && t.k === "WC"; }).length; },
    confCups: function (p) { return (p.trophies || []).filter(function (t) { return t.nat >= 0 && t.k !== "WC" && !/^(L:|CUP:|SC:)/.test(String(t.k)); }).length; },
    captain: function (p) { return api.has("captain") || (p.flags && p.flags.captain) ? 1 : 0; },
    caps: function (p) { return p.intl ? p.intl.caps : 0; },
    bdo: function (p) { return aw(p, /^bdo$/); },
    bdoPodiums: function (p) { return aw(p, /^bdo(_pod)?$/); },
    boots: function (p) { return aw(p, /^boot$/); },
    youngAwards: function (p) { return aw(p, /^(goldenboy|kopa|young)$/); },
    pom: function (p) { return aw(p, /^pom$/); },
    teamOfYear: function (p) { return aw(p, /^xi$/); },
    positions: function (p) { var o = {}; rows(p).forEach(function (r) { if (r.pos) o[r.pos] = 1; }); if (p.pos) o[p.pos] = 1; (st().c.posList || "").split(",").forEach(function (x) { if (x) o[x] = 1; }); return Object.keys(o).length; },
    countries: function (p) { var o = {}; clubsOf(p).forEach(function (c) { var cl = W.clubs[c]; if (cl) o[cl.ci] = 1; }); return Object.keys(o).length; },
    oneClubBest: function (p) { var b = 0, run = 0, last = null; rows(p).forEach(function (r) { if (r.loan) return; if (r.club === last) run++; else { run = 1; last = r.club; } b = Math.max(b, run); }); return b; },
    followers: function (p) { return Math.round((p.fol || 0) * 1000); },
    lostNumbers: function () { var n = st().nums; return LOST.filter(function (x) { return n[x]; }).length; },
    goalAssistGames: function () { return Math.max(api.cnt("goalAssistGames"), retro("ga")); },
    exGoals: function () { return Math.max(api.cnt("exGoals"), retro("ex")); },
    fkGoals: function (p) { return Math.max(api.cnt("fkGoals"), p.sp && p.sp.fk ? p.sp.fk.g : 0); },
    panenkas: function () { return api.cnt("panenkas"); },
    penSaves: function (p) { return Math.max(api.cnt("penSaves"), p.sp && p.sp.gkpen ? p.sp.gkpen.s : 0); },
    spChallenges: function (p) { return p.sp && p.sp.ch ? Object.keys(p.sp.ch).length : 0; },
    woodwork: function (p) { var s = p.sp; return Math.max(api.cnt("woodwork"), s ? (s.pen.post || 0) + (s.fk.post || 0) : 0); },
    petGoals: function () { return api.cnt("petGoals"); },
    petWalks: function () { var pt = petOfNow(); return Math.max(api.cnt("petWalks"), pt && pt.stats ? pt.stats.walks : 0); },
    petAcc: function () { try { return typeof PetSim !== "undefined" ? PetSim.own().length : 0; } catch (e) { return 0; } },
    petPuddles: function () { return api.cnt("petPuddles"); },
    /* gestor */
    mGames: function () { var m = S.m; if (!m) return 0; var ss = m.ss || {}, last = m.seasons[m.seasons.length - 1], n = last && last.y === S.yr ? 0 : (ss.w || 0) + (ss.d || 0) + (ss.l || 0); m.seasons.forEach(function (r) { n += (r.w || 0) + (r.d || 0) + (r.l || 0); }); return n; },
    mContinental: function () { return S.m ? S.m.trophies.filter(function (t) { return !/^(L:|CUP:|SC:)/.test(String(t.k)) && !t.nat; }).length : 0; }
  };
  api.STATS = GX_STATS;
  /* contadores que también se pueden reconstruir desde el diario de partidos (S.blog) */
  function retro(k) {
    var p = S.p; if (!p || !S.blog) return 0;
    if (k === "ga") return S.blog.filter(function (b) { return !b.nat && b.g >= 1 && b.a >= 1; }).length;
    if (k === "ex") { var ex = {}; clubsOf(p).forEach(function (c) { if (c !== p.club) ex[c] = 1; }); return S.blog.reduce(function (s, b) { return s + (!b.nat && ex[b.o] ? b.g || 0 : 0); }, 0); }
    return 0;
  }
  api.stat = function (k) {
    var f = GX_STATS[k];
    if (f) { try { var p = P(); return /^m[A-Z]/.test(k) ? f(p) : p ? f(p) : 0; } catch (e) { return 0; } }
    return api.cnt(k);
  };

  /* ---------- lista de trofeos (formato de achieve.js) ---------- */
  var RAR_ICO = {b: "🥉", s: "🥈", g: "🥇", p: "💠"};
  function catIco(c) { c = String(c).replace("#", ""); for (var i = 0; i < GX_CATS.length; i++) if (GX_CATS[i][0] === c) return GX_CATS[i][2]; return "🏆"; }
  function test(d) {
    var c = d[7];
    return function () { return c[0] === "s" ? api.stat(c[1]) >= c[2] : api.has(c[1]); };
  }
  var LIST = null, BY = {};
  function build() {
    if (LIST) return LIST;
    LIST = GX_T.map(function (d) {
      var o = {id: d[0], cat: d[1].replace("#", ""), prog: d[1].indexOf("#") > 0 && d[7][0] === "s", rar: d[2], hide: !!d[3], mode: d[4], n: d[5], d: d[6], cond: d[7], x: d[8] || null};
      o.row = [o.id, catIco(o.cat), o.n, o.d, test(d), o.hide ? 1 : 0];
      BY[o.id] = o; return o;
    });
    return LIST;
  }
  api.list = function (mode) { return build().filter(function (o) { return !mode || o.mode === mode; }); };
  api.get = function (id) { build(); return BY[id] || null; };
  api.rows = function (mode) { return api.list(mode).map(function (o) { return o.row; }); };
  /* metadatos de cualquier logro (nuevo, antiguo o de cultura pop) */
  api.meta = function (id) {
    var o = api.get(id); if (o) return o;
    if (id === GX_PLAT.p.id || id === GX_PLAT.m.id) { var pl = id === GX_PLAT.p.id ? GX_PLAT.p : GX_PLAT.m; return {id: id, cat: "base", rar: "p", hide: false, mode: id === GX_PLAT.p.id ? "p" : "m", n: pl.n, d: pl.d, x: {title: pl.title}}; }
    var od = GX_OLD[id]; if (!od) return {id: id, cat: "base", rar: "b", hide: false, mode: /^m_/.test(id) ? "m" : "p"};
    var mode = /^m_/.test(id) ? "m" : /^p_/.test(id) ? "p" : null;
    if (!mode && typeof ACH_X !== "undefined") { var x = ACH_X.filter(function (a) { return a[0] === id; })[0]; mode = x ? x[2] : "b"; }
    return {id: id, cat: od[0], rar: od[1], hide: !!od[2], mode: mode};
  };
  api.prog = function (id) { var o = api.get(id); if (!o || !o.prog) return null; return [Math.min(o.cond[2], Math.floor(api.stat(o.cond[1]))), o.cond[2]]; };
  /* platino: todos los demás trofeos del modo */
  function allOf(mode) {
    var ids = [];
    (mode === "m" ? ACH_M : ACH_P).forEach(function (a) { ids.push(a[0]); });
    if (typeof ACH_X !== "undefined") ACH_X.forEach(function (a) { if (a[2] === mode || a[2] === "b") ids.push(a[0]); });
    api.list(mode).forEach(function (o) { ids.push(o.id); });
    return ids;
  }
  api.allOf = allOf;
  function platRow(mode) {
    var pl = GX_PLAT[mode];
    return [pl.id, "💠", pl.n, pl.d, function () { var ids = allOf(mode); return ids.every(function (id) { return S.ach && S.ach[id]; }); }, 0];
  }
  api.platRow = platRow;

  /* ---------- recompensas ---------- */
  function scale() {
    var c = S.mode === "mgr" ? (S.m && S.m.club) : (S.p && S.p.club), cr = c != null && c >= 0 && S.cr ? S.cr[c] || 60 : 60;
    return Math.max(0.2, Math.min(1.25, (cr - 45) / 36));
  }
  api.money = function (rar) { var r = GX_RAR[rar]; return r ? Math.round(r.money * scale() / 500) * 500 : 0; };
  function reward(m) {
    var out = {money: 0, title: null};
    if (!m || !GX_RAR[m.rar] || GX_OLD[m.id]) return out;
    out.money = api.money(m.rar);
    var who = S.mode === "mgr" ? S.m : S.p;
    if (who && out.money) who.money = (who.money || 0) + out.money;
    var g = st();
    if (m.x && m.x.title && g.titles.indexOf(m.id) < 0) { g.titles.push(m.id); out.title = m.x.title; }
    if (m.x && m.x.give && typeof GX.give === "function") GX.give(m.x.give);
    return out;
  }
  /* se llama desde achCheck con los logros nuevos: guarda fecha, partido y recompensa y los pone en cola */
  api.unlocked = function (list, silent) {
    var g = st(); if (!g) return;
    var b = S.blog && S.blog[S.blog.length - 1], match = b ? (b.nat ? natName(b.o) : clubName(b.o)) + " " + b.gu + "-" + b.gt : "";
    list.forEach(function (a) {
      var id = a[0]; if (g.t[id]) return;
      var m = api.meta(id), rw = reward(m);
      g.t[id] = {y: S.yr, d: Date.now(), m: match, $: rw.money};
      if (!silent) g.q.push(id);
    });
    if (silent && list.length) g.retro += list.length;
  };
  /* ---------- evaluación incremental: solo si algo ha cambiado ---------- */
  api.check = function () { var d = dirty; dirty = false; return d; };

  /* ======================================================================
     ANALIZADORES: leen los sucesos y ponen marcas o suman contadores
     ====================================================================== */
  function goalDetail(f, pg) {
    /* minutos de tus goles dentro de los minutos de tu equipo mientras estabas en el campo */
    var r = rng(hs("gx|" + S.yr + "|" + S.tw + "|" + f.opp + "|" + (f.min || 0) + "|" + pg)), on0 = f.role === "sub" ? Math.max(0, 90 - f.min) : 0, on1 = f.role === "sub" ? 125 : (f.min >= 90 ? 125 : f.min);
    var mins = (f.gmu || []).filter(function (m) { return m >= on0 && m <= on1; }).slice();
    for (var i = mins.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = mins[i]; mins[i] = mins[j]; mins[j] = t; }
    var mine = mins.slice(0, pg).sort(function (a, b) { return a - b; });
    return {mine: mine, on0: on0, r: r};
  }
  function rainy(f) {
    try {
      var fi = S.cur && S.cur.pm ? S.cur.pm.indexOf(f) : 0, h = hs(S.yr + "|" + S.tw + "|" + fi + "|" + f.opp), mo = (7 + Math.floor((S.tw || 0) / 4.35)) % 12;
      if (typeof hashStr === "function") h = hashStr(S.yr + "|" + S.tw + "|" + fi + "|" + f.opp);
      var w = [30, 28, 20, 10, 12]; if (mo >= 6 && mo <= 8) w = [40, 20, 8, 30, 2]; else if (mo === 11 || mo <= 1) w = [22, 30, 26, 0, 22];
      var t = w.reduce(function (s, x) { return s + x; }, 0), x = h % t;
      for (var k = 0; k < w.length; k++) { x -= w[k]; if (x < 0) return k === 2 || k === 4; }
    } catch (e) {}
    return false;
  }
  function at(f, min) { var a = (f.gmu || []).filter(function (x) { return x < min; }).length, b = (f.gmt || []).filter(function (x) { return x < min; }).length; return [a, b]; }
  function worstTrail(f) { var ev = []; (f.gmu || []).forEach(function (x) { ev.push([x, 1]); }); (f.gmt || []).forEach(function (x) { ev.push([x, -1]); }); ev.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }); var d = 0, w = 0; ev.forEach(function (e) { d += e[1]; w = Math.min(w, d); }); return w; }
  api.on("pmatch", function (o) {
    var f = o.f, p = S.p, b = o.b || {}, g = st(); if (!f || !p) return;
    var pg = b.g || 0, pa = b.a || 0, gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), win = gu > gt, pw = f.pens && f.pens[0] > f.pens[1], won = win || (gu === gt && pw), gk = p.pos === "POR";
    if (!f.isNat) { api.streak("appStreak", f.min >= 85); api.streak("benchStreak", f.role === "bench"); }
    if (!(f.min > 0)) return;
    var L = p.life || {}; if (L.num) g.nums[L.num] = 1; if (p.num) g.nums[p.num] = 1;
    if (g.c.posList == null || ("," + g.c.posList + ",").indexOf("," + p.pos + ",") < 0) g.c.posList = (g.c.posList ? g.c.posList + "," : "") + p.pos;
    api.streak("rainStreak", rainy(f));
    if (gk) api.streak("csStreak", gt === 0 && f.min >= 60);
    if (pg >= 3) api.flag("hat3");
    if (pg >= 3 && f.home && !f.isNat) api.flag("hat3home");
    if (pg >= 4) api.flag("poker");
    if (pa >= 3) api.flag("assist3");
    if (pg >= 1 && pa >= 1 && !f.isNat) api.add("goalAssistGames");
    if (gk && pg >= 1) api.flag("gkgoal");
    if (gk && gt >= 5 && f.min >= 60) api.flag("concede5");
    if (f.fin && gk && gu === 1 && gt === 0) api.flag("final10gk");
    if (f.red && won && (f.imp >= 2 || f.fin)) api.flag("spartan");
    if (f.red && (p.seasons.length === 0 && p.ss && p.ss.apps <= 1 && !f.isNat)) api.flag("redDebut");
    if (gu === 0 && gt >= 5) api.flag("lose05");
    if (win && worstTrail(f) <= -3) api.flag("comeback3");
    var ht = at(f, 46); if (gu === gt && ht[1] - ht[0] >= 3) api.flag("zombie");
    if (b.rt != null && b.rt <= 4.5) api.flag("invisible");
    if (p.age >= 40) api.flag("age40");
    if (f.isNat && f.fin && pg >= 1) api.flag("natFinalGoal");
    if (f.kind === "nq" && pg >= 1 && gu - gt === 1) api.flag("qualHero");
    var tot = GX_STATS.apps(p); if (!f.isNat && tot === 100 && pg >= 1) api.flag("goal100th");
    /* ex clubes */
    if (!f.isNat && pg) { var ex = clubsOf(p).filter(function (c) { return c !== p.club; }); if (ex.indexOf(f.opp) >= 0) api.add("exGoals", pg); }
    /* mascota en la grada */
    if (pg && petOfNow()) api.add("petGoals", pg);
    /* detalles de los goles (generador propio) */
    if (pg) {
      var gd = goalDetail(f, pg), r = gd.r;
      if (f.role === "sub" && gd.mine.length && gd.mine[0] <= gd.on0 + 2) api.flag("subfast");
      var last = (f.gmu || []).slice().sort(function (a, b) { return a - b; }).pop();
      if (!f.home && win && gu - gt === 1 && gd.mine.length && gd.mine[gd.mine.length - 1] === last && last >= 89) api.flag("heist");
      for (var i = 0; i < pg; i++) { var x = r(); if (x < 0.0012 && !gk) api.flag("ownhalf"); else if (x > 0.9975) api.flag("ghost"); }
    }
    /* gol en propia: no cambia el marcador (uno de los goles del rival se apunta a tu nombre) */
    if (gt > 0 && !gk) {
      var ro = rng(hs("og|" + S.yr + "|" + S.tw + "|" + f.opp + "|" + gt))();
      var pr = ({DFC: 0.008, LD: 0.005, LI: 0.005, MCD: 0.004}[p.pos] || 0.0012) * gt;
      if (ro < pr) { api.flag("owngoal"); if (f.fin && !won) api.flag("finalOwnGoal"); }
    }
    /* decisiones con consecuencias en el siguiente partido */
    if (g.f.partyEve && S.tw - g.f.partyEve <= 2) { if (pg >= 2) api.flag("partyBrace"); delete g.f.partyEve; }
    if (g.f.hurtEve) { if (f.fin && won) api.flag("hurtFinalWin"); delete g.f.hurtEve; }
    /* liga: último a partir de la jornada 30 */
    if (f.kind === "lg" && !f.isNat) {
      try { var li = S.cl[p.club], sd = standings(li), me = sd.filter(function (x) { return x.c === p.club; })[0]; if (me && me.r[0] >= 30 && sd[sd.length - 1].c === p.club) g.f.lastAt30 = S.yr; } catch (e) {}
    }
  });
  api.on("pseason", function (o) {
    var p = S.p, g = st(); if (!p) return;
    var ss = o.ss || {};
    if (p.pos === "POR" && ss.lg && ss.lg.apps >= 25 && (ss.lg.gc || 0) < 15) api.flag("lgUnder15");
    if ((o.fans || 0) >= 90 && (g.c.fansMinY === o.y ? g.c.fansMin : 0) >= 90) api.flag("fansMax");
    if (g.f.lastAt30 === o.y && !o.down) api.flag("believe");
    /* ascensos y descensos con el mismo club */
    var u = g.c["ud" + o.club] || 0;
    if (o.up) u |= 1; if (o.down) u |= 2;
    if (o.club != null) g.c["ud" + o.club] = u;
    if (u === 3) api.flag("upDown");
    delete g.f.lastAt30;
  });
  api.on("join", function (o) {
    var g = st(), p = S.p; if (!p) return;
    if (o.first) { g.c.firstClub = o.club + 1; return; }
    var first = g.c.firstClub ? g.c.firstClub - 1 : (p.seasons[0] ? p.seasons[0].club : -1);
    if (o.club === first && o.old !== first) api.flag("homecoming");
    try { var li = S.cl[o.club], L = W.lg[li]; if (L && /AFC|CAF|OFC/.test(L.conf || "")) api.flag("exotic"); } catch (e) {}
  });
  api.on("injury", function () { var g = st(); if (g.f.renewTw && S.tw - g.f.renewTw <= 3 && S.yr === g.f.renewY) api.flag("injAfterRenew"); });
  /* decisiones: id del suceso + opción elegida */
  var CHOICE = {
    hospital: function (i) { if (i <= 1) api.flag("hospital"); },
    canterano: function (i) { if (i === 0) api.add("mentored"); },
    celebrar_ex: function (i, ok) { if (i === 0 && ok) api.flag("exCelebrate"); },
    fiesta: function (i) { if (i === 0) st().f.partyEve = S.tw; },
    jugar_tocado: function (i, ok) { if (i === 0 && ok) st().f.hurtEve = S.tw; },
    doble_nacionalidad: function () { api.flag("dualNat"); },
    periodista: function (i) { if (i === 0) api.flag("pressFight"); },
    arabia: function (i) { if (i === 0) api.flag("exotic"); },
    renovacion: function (i) { var g = st(); g.f.renewTw = S.tw; g.f.renewY = S.yr; },
    gx_renovar_ya: function (i) { if (i === 0) { var g = st(); g.f.renewTw = S.tw; g.f.renewY = S.yr; } },
    gx_tocado_final: function (i, ok) { if (i === 0 && ok) st().f.hurtEve = S.tw; },
    gx_fiesta_vispera: function (i) { if (i === 0) st().f.partyEve = S.tw; }
  };
  api.CHOICE = CHOICE;
  api.on("choice", function (o) {
    if (o.k === "offers" && o.i >= 0 && o.kind === "invierno") api.flag("janMove");
    var fn = CHOICE[o.id]; if (fn) fn(o.i, o.good !== false);
    if (o.gx) [].concat(o.gx).forEach(function (k) { if (/^\+/.test(k)) api.add(k.slice(1)); else api.flag(k); });
  });
  /* balón parado (partido, entrenamiento y retos) */
  api.on("sp", function (o) {
    var sc = !!o.scored;
    if (o.training) {
      if (o.k === "pen" && !o.target) api.streak("trainPen", sc);
      if (o.target && sc) api.add("targets");
      return;
    }
    if (/post/.test(o.how || "")) api.add("woodwork");
    if (o.how === "postin") api.flag("postin");
    if (o.k === "pen") { api.streak("penStreak", sc); if (sc && o.panenka) api.add("panenkas"); }
    if (o.k === "fk" && sc) { api.add("fkGoals"); if (o.dist >= 30) api.flag("fk30"); if (o.wallIn) api.flag("wallIn"); if (o.ch && !(st().c["chTry" + o.ch] > 0)) api.flag("fkChallenge"); }
    if (o.k === "fk" && o.ch) api.add("chTry" + o.ch);
    if (o.k === "gkfk") api.streak("fkSave", !sc);
    if (o.k === "gkpen" && !sc) { api.add("penSaves"); if (o.final) api.flag("savefinal"); }
  });
  api.on("mini", function (o) { if (o.kind === "pen" && o.scored && o.min >= 89) api.flag("penLate"); });
  api.on("so", function (o) {
    var s = o.st; if (!s) return;
    var w = o.w, me = s.log.filter(function (l) { return l.me; }), saves = s.gkMe ? s.log.filter(function (l) { return l.s === 1 && !l.ok && l.h === "parada"; }).length : 0;
    if (saves) api.add("penSaves", saves);
    if (saves >= 3) api.flag("so3saves");
    if (w === 0 && s.k[0].length > 5) api.flag("soSudden");
    if (w === 1 && me.some(function (l) { return !l.ok; })) api.flag("soMissOut");
  });
  api.on("block", function () {
    var p = S.p; if (!p || S.mode === "mgr") return;
    if ((p.fans || 50) <= 12) api.flag("booed");
    var gg = st(); if (gg.c.fansMinY !== S.yr) { gg.c.fansMinY = S.yr; gg.c.fansMin = p.fans || 0; } else gg.c.fansMin = Math.min(gg.c.fansMin, p.fans || 0);
    if (p.flags && p.flags.captain) api.flag("captain");
    (S.bnews || []).forEach(function (n) { if (!n._gx && (n.t === "star" || n.t === "trophy")) { n._gx = 1; api.add("headlines"); } });
  });
  api.on("pet", function (o) { if (o.k === "walk") api.add("petWalks"); if (o.k === "puddle") api.add("petPuddles"); });
  /* gestor */
  api.on("mmatch", function (o) {
    var f = o.f, m = S.m; if (!f || !m) return;
    var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), win = gu > gt;
    api.streak("mBigLoss", gt - gu >= 3);
    if (o.debuts) api.add("mYouthDebuts", o.debuts);
    if (win && f.kind === "lg" && f.xi && f.xi.length === 11 && typeof FORMATIONS !== "undefined") {
      var sl = FORMATIONS[m.form] || [], off = f.xi.filter(function (id, i) { var pl = mPl(id); return pl && sl[i] && posFit(pl.pos, sl[i]) >= 7; }).length;
      if (off >= 5) api.flag("mOutOfPos");
    }
    var L = S.live; if (win && f.liveDone && L && (L.tchg || 0) >= 3) api.flag("mSubsWin");
    var R0 = S.retiredP; if (R0 && R0.seasons && R0.seasons.some(function (r) { return (r.clubs || [r.club]).indexOf(m.club) >= 0; })) api.flag("mExClub");
  });
  api.on("mseason", function (o) {
    var g = st();
    if (o.champ && o.lgPromoted) api.flag("mPromotedChamp");
    if (o.up) { if (g.c.mPromLast === o.y - 1) api.flag("mDoublePromo"); g.c.mPromLast = o.y; }
  });
  /* mGames / mBigLossStreak */
  GX_STATS.mBigLossStreak = function () { return api.cnt("mBigLossBest"); };
  GX_STATS.mYouthDebuts = function () { return api.cnt("mYouthDebuts"); };

  /* ======================================================================
     GANCHOS en el motor (envolturas que no cambian lo que hacen)
     ====================================================================== */
  api.hook = function () {
    function wrap(name, after, before) {
      var root = typeof globalThis !== "undefined" ? globalThis : window, fn = root[name]; if (typeof fn !== "function" || fn.__gx) return;
      var w = function () {
        var pre; try { pre = before ? before.apply(this, arguments) : null; } catch (e) { pre = null; }
        var r = fn.apply(this, arguments);
        try { if (after) after.call(this, arguments, r, pre); } catch (e) { if (api.debugOn) console.warn("GX hook", name, e); }
        return r;
      };
      w.__gx = 1; root[name] = w;
    }
    wrap("finishPlayer", function (a) { var f = a[0], b = S.blog && S.blog[S.blog.length - 1]; if (S.mode !== "mgr") api.ev("pmatch", {f: f, b: b}); });
    wrap("seasonEnd", function (a, r, pre) {
      if (!pre) return;
      var after = S.cl[pre.club], up = false, down = false;
      if (after != null && after >= 0 && after !== pre.li && pre.li >= 0) { var L0 = W.lg[pre.li]; up = L0.upI === after || W.lg[after].downI === pre.li; down = L0.downI === after; }
      api.ev("pseason", {ss: pre.ss, fans: pre.fans, y: pre.y, club: pre.club, up: up, down: down});
    }, function () { var p = S.p; return p ? {ss: p.ss, fans: p.fans, y: S.yr, club: p.club, li: S.cl[p.club]} : null; });
    wrap("joinClub", function (a, r, pre) { var t = a[1] || {}; api.ev("join", {club: a[0], first: !!t.first, old: pre}); }, function () { return S.p ? S.p.club : -1; });
    wrap("injure", function () { if (S.mode !== "mgr") api.ev("injury", {}); });
    wrap("resolvePendingPlayer", function (a, card, x) { if (x) api.ev("choice", {id: x.id, k: x.k, kind: x.kind, i: a[0], good: card ? card.good : null}); }, function () { return S.pend && S.pend[0] ? Object.assign({}, S.pend[0]) : null; });
    wrap("blockDone", function () { api.ev("block", {}); });
    wrap("mgrFinish", function (a, r, snap) {
      var m = S.m, f = a[0], deb = 0; if (!m || !f || S.mode !== "mgr") return;
      m.sq.forEach(function (p) { var s0 = snap ? snap[p.id] : undefined; if (s0 === 0 && p.yth && p.st && p.st.apps > 0) deb++; });
      api.ev("mmatch", {f: f, debuts: deb});
    }, function () { var m = S.m, o = {}; if (m) m.sq.forEach(function (p) { o[p.id] = (p.st ? p.st.apps : 0) + (p.tot ? p.tot.apps : 0); }); return o; });
    wrap("mgrSeasonEnd", function (a, r, pre) {
      if (!pre || !S.m) return;
      var after = S.cl[pre.club], up = false;
      if (after != null && after >= 0 && pre.li >= 0 && after !== pre.li) up = W.lg[pre.li].upI === after || W.lg[after].downI === pre.li;
      api.ev("mseason", {y: pre.y, up: up, champ: pre.champ, lgPromoted: pre.prom});
    }, function () {
      var m = S.m; if (!m || m.club < 0) return null;
      var li = S.cl[m.club], champ = false; try { champ = posInLeague(m.club) === 1; } catch (e) {}
      return {y: S.yr, club: m.club, li: li, champ: champ, prom: st().c.mPromLast === S.yr - 1};
    });
    if (typeof SO !== "undefined" && SO.record && !SO.record.__gx) {
      var sr = SO.record; SO.record = function (s, nk, ok, how) { var w = sr.apply(this, arguments); try { if (w >= 0 && !s._gx) { s._gx = 1; api.ev("so", {st: s, w: w}); } } catch (e) {} return w; }; SO.record.__gx = 1;
    }
    if (typeof SpModes !== "undefined" && SpModes.record && !SpModes.record.__gx) {
      var spr = SpModes.record; SpModes.record = function (kind, res, o) { var g = spr.apply(this, arguments); try { api.ev("sp", Object.assign({k: kind, scored: !!res.scored, how: res.how}, o || {})); } catch (e) {} return g; }; SpModes.record.__gx = 1;
    }
  };
  /* ---------- depuración (consola): GX.debug.unlock("g_hat"), GX.debug.all("p") ---------- */
  api.debug = {
    unlock: function (id) { if (!S) return; S.ach = S.ach || {}; if (S.ach[id]) return; S.ach[id] = S.yr; api.unlocked([[id]], false); dirty = true; },
    all: function (mode) { allOf(mode || (S.mode === "mgr" ? "m" : "p")).forEach(function (id) { api.debug.unlock(id); }); },
    flag: api.flag, add: api.add, stat: api.stat
  };
  return api;
})();
GX.hook();
