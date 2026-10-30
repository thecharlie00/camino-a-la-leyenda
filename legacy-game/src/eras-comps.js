/* eras-comps.js — Modo Épocas: competiciones de cada año (erascene/competitions.json).
   En Épocas, después de montar el calendario normal, cada competición continental se sustituye por la que existía ese
   año, con su nombre de época, su formato y sus participantes (campeones de liga, campeones de copa…). Fuera de Épocas
   no cambia nada. Los torneos de selecciones siguen sus ediciones reales (Mundial de 16/24/32/48, Eurocopa de 4/8/16/24…). */
(function installEraCompetitions() {
  if (typeof ERAS_MODE === "undefined" || !ERAS_MODE || typeof setupSeasonComps !== "function") return;
  var D = (ERAS_DATA && ERAS_DATA.competitions) || {club: [], national: [], domestic: {}};
  function active() { return typeof eraContextForYear === "function" && !!S && !!eraContextForYear(S.yr); }
  function clubComp(key) { return D.club.filter(function (c) { return c.key === key; })[0] || null; }
  function natComp(key) { return D.national.filter(function (c) { return c.key === key; })[0] || null; }
  function at(list, year) { var hit = null; (list || []).forEach(function (e) { if ((e.from != null ? e.from : e[0]) <= year) hit = e; }); return hit; }
  function exists(comp, year) { return !!comp && comp.years[0] <= year && (comp.years[1] == null || year <= comp.years[1]); }
  function naming(comp, year) { var n = at(comp.names, year) || comp.names[0]; return {n: n[1], s: n[2] || n[1]}; }
  function format(comp, year) { return at(comp.formats, year) || {type: "original"}; }
  var rating = function (c) { return S.cr[c] || 0; };
  function byRating(list) { return list.slice().sort(function (a, b) { return rating(b) - rating(a); }); }
  function uefaCountries() { return Object.keys(W.byCountry).map(Number).filter(function (ci) { return W.ctry[ci] && W.ctry[ci].conf === "UEFA" && W.ctry[ci].code !== "RU"; }); }
  /* campeones de liga de cada país (más el campeón vigente), completados con subcampeones de las ligas más fuertes */
  function champions(n, taken) {
    var out = [], hold = S.last.cont && S.last.cont.UCL;
    function add(c) { if (c != null && c >= 0 && S.cl[c] >= 0 && out.indexOf(c) < 0 && !taken[c]) out.push(c); }
    add(hold);
    var champs = [], seconds = [];
    uefaCountries().forEach(function (ci) { var fin = S.last.final[W.byCountry[ci][0]] || []; if (fin[0] != null) champs.push(fin[0]); if (fin[1] != null) seconds.push(fin[1]); });
    byRating(champs).forEach(add);
    byRating(seconds).forEach(function (c) { if (out.length < n) add(c); });
    return out.slice(0, n);
  }
  /* campeones de copa (si el campeón de copa también ganó la liga, va el finalista) */
  function cupWinners(n, taken) {
    var out = [];
    uefaCountries().forEach(function (ci) {
      var w = S.last.cup && S.last.cup[ci], f = S.last.cupF && S.last.cupF[ci];
      var c = w != null && taken[w] ? f : w;
      if (c != null && c >= 0 && S.cl[c] >= 0 && !taken[c] && out.indexOf(c) < 0) out.push(c);
    });
    return byRating(out).slice(0, n);
  }
  function fill(list, pool, n, taken) {
    byRating(pool).forEach(function (c) { if (list.length < n && list.indexOf(c) < 0 && !taken[c] && S.cl[c] >= 0) list.push(c); });
    return list;
  }
  function confClubs(conf) { var out = []; W.clubs.forEach(function (cl, i) { var li = S.cl[i]; if (li >= 0 && W.lg[li].conf === conf && cl.c !== "RU") out.push(i); }); return out; }
  function mark(list, taken) { list.forEach(function (c) { taken[c] = true; }); }
  /* semanas: eliminatorias a doble partido y final única o a doble partido */
  var KO_WEEKS = [[6, 8], [12, 14], [20, 22], [26, 28], [31, 33]];
  function koRounds(size, fmt, finalWeek) {
    var n = Math.round(Math.log(size) / Math.log(2)), rounds = [], weeks = KO_WEEKS.slice(KO_WEEKS.length - (n - 1));
    for (var i = 0; i < n - 1; i++) rounds.push({n: roundNames(size / Math.pow(2, i)), W: fmt.legs === 1 ? [weeks[i][1]] : weeks[i]});
    rounds.push({n: N_("Final"), W: fmt.final === "two-legs" ? [finalWeek - 2, finalWeek] : [finalWeek], fin: true});
    return rounds;
  }
  function seededTies(teams) {
    var seeds = byRating(teams), size = 1; while (size < seeds.length) size *= 2;
    while (seeds.length < size) seeds.push(-1);
    var order = bracketOrder(size), ties = [];
    for (var i = 0; i < order.length; i += 2) ties.push(mkTie(seeds[order[i + 1] - 1], seeds[order[i] - 1]));
    return ties;
  }
  function buildKO(key, nm, teams, fmt, finalWeek, lvl, conf) {
    var size = 1; while (size < teams.length) size *= 2;
    return mkKO(key, nm.n, nm.s, koRounds(size, fmt, finalWeek), seededTies(teams), {lvl: lvl, conf: conf, teams: teams});
  }
  function buildGroups(key, nm, teams, fmt, finalWeek, lvl, conf) {
    var q = fmt.groups * (fmt.perGroup || 2) + (fmt.bestSeconds || 0), weeks = [];
    var koSteps = [[22, 24], [26, 28], [31, 33]];
    var nR = Math.round(Math.log(q) / Math.log(2));
    weeks = koSteps.slice(koSteps.length - (nR - 1)).concat([[finalWeek]]);
    var c = mkGroups(key, nm.n, nm.s, teams, {ng: fmt.groups, double: true, mdW: [9, 11, 13, 16, 19, 21], koW: weeks, perGroup: fmt.perGroup || 2, lvl: lvl, conf: conf});
    c.bestSeconds = fmt.bestSeconds || 0;
    return c;
  }
  function rename(key, year) {
    var comp = clubComp(key), c = S.C[key];
    if (!comp || !c) return;
    var nm = naming(comp, year); c.n = nm.n; c.s = nm.s; c.era = true;
  }
  function eraSeasonComps() {
    var year = S.yr, Q = contQual(), taken = {}, L = S.last.cont || {};
    /* Copa de Europa / Champions */
    var ucl = clubComp("UCL"), fu = format(ucl, year), nu = naming(ucl, year);
    if (fu.type !== "original") {
      var size = fu.size, teams = (at(ucl.qual, year) || [0, "champions"])[1] === "champions" ? champions(size, taken) : fill([], Q.UCL, size, taken);
      fill(teams, Q.UCL.concat(Q.UEL), size, taken); mark(teams, taken);
      S.C.UCL = fu.type === "groups" ? buildGroups("UCL", nu, teams, fu, 40, 10, "UEFA") : buildKO("UCL", nu, teams, fu, 40, 10, "UEFA");
    } else rename("UCL", year);
    /* Recopa */
    var cw = clubComp("UCWC");
    if (exists(cw, year)) {
      var cwt = cupWinners(32, taken); fill(cwt, Q.UEL.concat(Q.UECL), 32, taken); mark(cwt, taken);
      S.C.UCWC = buildKO("UCWC", naming(cw, year), cwt, format(cw, year), 38, 7, "UEFA");
    }
    /* Copa de Ferias / Copa UEFA / Europa League */
    var uel = clubComp("UEL"), fe = format(uel, year), ne = naming(uel, year);
    if (fe.type !== "original") {
      var et = fill([], Q.UEL.concat(Q.UECL), fe.size, taken); fill(et, confClubs("UEFA"), fe.size, taken); mark(et, taken);
      S.C.UEL = fe.type === "groups" ? buildGroups("UEL", ne, et, fe, 39, 6, "UEFA") : buildKO("UEL", ne, et, fe, 39, 6, "UEFA");
    } else rename("UEL", year);
    /* Conference, Sudamericana, Recopa Sudamericana, Nations League: solo desde que existen */
    ["UECL", "SUD", "REC", "NL"].forEach(function (key) { var comp = clubComp(key); if (!exists(comp, year)) delete S.C[key]; else rename(key, year); });
    if (year < 2018) delete S.C.NLB;
    /* Copa Conmebol (1992-1999) */
    var cc = clubComp("CCMB");
    if (exists(cc, year)) { var cct = fill([], Q.SUD, 16, {}); S.C.CCMB = buildKO("CCMB", naming(cc, year), cct, format(cc, year), 38, 4, "CONMEBOL"); }
    /* Asia y África: eliminatorias antes de sus ligas de campeones; Concacaf con su nombre de época */
    ["ACL", "CAF"].forEach(function (key) {
      var comp = clubComp(key), f = format(comp, year);
      if (!exists(comp, year)) { delete S.C[key]; return; }
      if (f.type === "ko") S.C[key] = buildKO(key, naming(comp, year), byRating(Q[key]).slice(0, 16), f, 38, key === "ACL" ? 7 : 7, comp.conf);
      else rename(key, year);
    });
    rename("LIB", year); rename("CCC", year);
    /* Supercopa de Europa: campeón de Europa contra el de la Recopa (hasta 1999) o el de la UEFA */
    var usc = clubComp("USC");
    if (!exists(usc, year)) delete S.C.USC;
    else {
      var other = year < 2000 ? L.UCWC : L.UEL;
      if (L.UCL != null && L.UCL >= 0 && other != null && other >= 0 && other !== L.UCL) {
        var fs = format(usc, year), nm2 = naming(usc, year);
        S.C.USC = mkKO("USC", nm2.n, nm2.s, [{n: N_("Final"), W: fs.legs === 2 ? [2, 4] : [2], fin: true}], [mkTie(L.UCL, other)], {lvl: 4, conf: "UEFA"});
      } else delete S.C.USC;
    }
    /* Intercontinental: campeón de Europa contra el de la Libertadores (1960-2004); la actual de la FIFA desde 2024 */
    var icc = clubComp("ICC");
    if (exists(icc, year)) {
      if (L.UCL != null && L.UCL >= 0 && L.LIB != null && L.LIB >= 0) {
        var fi = format(icc, year), ni = naming(icc, year);
        S.C.ICC = mkKO("ICC", ni.n, ni.s, [{n: N_("Final"), W: fi.legs === 2 ? [15, 17] : [17], fin: true}], [mkTie(L.UCL, L.LIB)], {lvl: 6, neutral: !!fi.neutral});
      } else delete S.C.ICC;
    } else if (!(icc.modern && year >= icc.modern.from)) delete S.C.ICC;
    /* supercopas nacionales: desde su año de inicio y con 4 equipos solo cuando lo tuvieron */
    var sup = (D.domestic && D.domestic.supercups) || {};
    Object.keys(S.C).forEach(function (key) {
      if (key.indexOf("SC:") !== 0) return;
      var code = key.slice(3), rule = sup[code];
      if (!rule) return;
      var gap = (rule.gaps || []).some(function (g) { return year >= g[0] && year <= g[1]; });
      if (year < rule.since || gap) { delete S.C[key]; return; }
      var c = S.C[key];
      if (rule.fourSince && year < rule.fourSince && c.ko && c.ko.r.length > 1) {
        var ci = c.ci, li = W.byCountry[ci][0], fin = S.last.final[li] || [], champ = fin[0], cupW = S.last.cup[ci];
        var opp = cupW != null && cupW !== champ ? cupW : fin[1];
        if (champ == null || opp == null) { delete S.C[key]; return; }
        S.C[key] = mkKO(key, c.n, c.s, [{n: N_("Final"), W: [1], fin: true}], [mkTie(champ, opp)], {lvl: 2, dom: true, ci: ci});
      }
    });
  }
  var originalSetup = setupSeasonComps;
  setupSeasonComps = function () {
    var out = originalSetup.apply(this, arguments);
    if (active()) eraSeasonComps();
    return out;
  };
  /* ---------- selecciones: ediciones reales ---------- */
  var WC_SLOTS = {16: {UEFA: 10, CONMEBOL: 3, CONCACAF: 1, AFC: 1, CAF: 1}, 24: {UEFA: 14, CONMEBOL: 4, CONCACAF: 2, AFC: 2, CAF: 2},
    32: {UEFA: 13, CONMEBOL: 5, CONCACAF: 3, AFC: 4, CAF: 5}, 48: {UEFA: 16, CAF: 9, AFC: 8, CONMEBOL: 6, CONCACAF: 6, OFC: 1}};
  function editionT(comp, e) {
    var T = {k: comp.key, n: comp.key === "CA" && comp.names ? (at(comp.names, e.y) || comp.names[0])[1] : comp.n, conf: comp.conf, start: e.y, every: 1, era: true,
      size: e.size || 4, groups: e.groups || 0, thirds: e.thirds || 0, perGroup: e.perGroup, final4: !!e.final4, special: comp.special, u23: !!comp.u23,
      noQual: !!comp.noQual, guests: comp.guestsFrom && e.y >= comp.guestsFrom ? "CONCACAF" : null, hosts: {}};
    if (e.hosts) T.hosts[e.y] = e.hosts;
    if (comp.conf === "ALL") T.slots = WC_SLOTS[T.size] || (comp.u23 ? {UEFA: 4, CONMEBOL: 2, CONCACAF: 2, AFC: 3, CAF: 3, OFC: 1} : WC_SLOTS[32]);
    return T;
  }
  function editionsOf(year) {
    var out = [];
    D.national.forEach(function (comp) { comp.editions.forEach(function (e) { if (e.y === year) out.push(editionT(comp, e)); }); });
    return out;
  }
  var originalNatOf = natTournamentsOf;
  natTournamentsOf = function (year) { return active() ? editionsOf(+year) : originalNatOf.apply(this, arguments); };
  if (typeof nextTournamentFor === "function") {
    var originalNext = nextTournamentFor;
    nextTournamentFor = function (ni, afterYear) {
      if (!active()) return originalNext.apply(this, arguments);
      var conf = W.ctry[ni].conf, best = null;
      D.national.forEach(function (comp) {
        if (comp.special || comp.u23 || comp.noQual || (comp.conf !== "ALL" && comp.conf !== conf)) return;
        comp.editions.forEach(function (e) { if (e.y >= afterYear && (!best || e.y < best.y)) best = {T: editionT(comp, e), y: e.y}; });
      });
      return best;
    };
  }
  var originalMkNat = mkNatTournament;
  mkNatTournament = function (T, year, bonusFor) {
    if (!active() || !T || !T.era || T.special) return originalMkNat.apply(this, arguments);
    var parts = natParticipants(T, year, bonusFor);
    if (T.final4) {
      var four = parts.slice().sort(function (a, b) { return S.nr[b] - S.nr[a]; }).slice(0, 4);
      if (four.length < 4) return null;
      var k4 = mkKO(T.k, T.n + " " + year, T.n, [{n: N_("Semifinales"), W: [41]}, {n: N_("Final"), W: [42], fin: true}], [mkTie(four[3], four[0]), mkTie(four[2], four[1])], {nat: true, lvl: tournamentLvl(T.k), conf: T.conf, teams: four});
      k4.tk = T.k; k4.year = year;
      return k4;
    }
    var per = T.perGroup || 2, q = T.groups * per + T.thirds, nR = 0; for (var s = q; s >= 2; s /= 2) nR++;
    var c = mkGroups(T.k, T.n + " " + year, T.n, parts, {ng: T.groups, double: false, mdW: [41, 42, 43], nat: true, perGroup: per, thirds: T.thirds, koW: koWeeksFrom(44, nR), lvl: tournamentLvl(T.k), conf: T.conf});
    c.tk = T.k; c.year = year;
    return c;
  };
  if (typeof setupNationsLeague === "function") {
    var originalNL = setupNationsLeague;
    setupNationsLeague = function () { if (active() && S.yr < 2018) return; return originalNL.apply(this, arguments); };
  }
  window.EraComps = {clubComp: clubComp, natComp: natComp, exists: exists, naming: naming, format: format, editionsOf: editionsOf};
})();
