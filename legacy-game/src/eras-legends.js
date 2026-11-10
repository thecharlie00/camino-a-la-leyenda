/* Fase 8 del Modo Épocas: estrellas de cada década (nombres versionados), mecánica propia de cada época, leyenda rival,
   dinastía y desafíos de época con un desafío diario (semilla por fecha, sin conexión). Datos en erascene/legends.json. */
var EraLegends = (function () {
  var D = ERAS_DATA.legends || {stars: {}, signature: {homeAdv: {}}, challenges: [], dailyLeagues: []};
  function t(s, v) { return eraText(s, v); }
  function loc(o) { var l = typeof LANG === "string" ? LANG : "es"; return o ? o[l] || o.es || "" : ""; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function decadeOf(yr) { return Math.floor(yr / 10) * 10 + "s"; }

  /* ---------- estrellas ---------- */
  function starsAt(yr) {
    var out = [];
    Object.keys(D.stars).forEach(function (dec) {
      D.stars[dec].forEach(function (s, i) {
        if (yr < s.from || yr > s.until) return;
        out.push(Object.assign({id: dec + "#" + i, ageNow: s.age + (yr - s.year)}, s));
      });
    });
    return out;
  }
  function starName(s) { return s.fn + " " + s.ln; }
  /* plantilla del míster: la estrella de ese año entra por el peor de su puesto */
  function injectStars(club, squad) {
    if (!Array.isArray(squad) || !W.clubs[club]) return squad;
    var name = W.clubs[club].n;
    starsAt(S.yr).filter(function (s) { return s.club === name; }).forEach(function (s) {
      var rid = "era*" + s.id;
      if ((S.rp || {})[rid] || squad.some(function (p) { return p.rid === rid; })) return;
      var same = squad.filter(function (p) { return p.pos === s.pos && !p.rid; }).sort(function (a, b) { return a.ovr - b.ovr; })[0];
      var ni = W.cIdx[s.nat], ovr = clamp(s.ovr - Math.max(0, s.ageNow - 31) * 1.5, 60, 94);
      var p = newPl({pos: s.pos, ovr: ovr, age: s.ageNow, ni: ni != null ? ni : W.clubs[club].ci, yrs: Math.max(1, Math.min(5, s.until - S.yr + 1)), rid: rid});
      p.fn = s.fn; p.ln = s.ln; p.pot = Math.max(p.pot || 0, ovr);
      if (typeof mWageFor === "function") p.sal = mWageFor(p, club);
      if (same) squad.splice(squad.indexOf(same), 1, p); else squad.push(p);
      (S.rp = S.rp || {})[rid] = 1;
    });
    return squad;
  }
  function starsLine(year, clubName) {
    var list = starsAt(year), here = clubName ? list.filter(function (s) { return s.club === clubName; }) : [];
    if (here.length) return t("Estrella de la época en este club: {n}.", {n: here.map(starName).join(", ")});
    if (!clubName && list.length) return t("Estrellas de {year}: {n}.", {year: year, n: list.slice(0, 6).map(function (s) { return starName(s) + " (" + (typeof eraClubName === "function" ? eraClubName(s.club, year) : s.club) + ")"; }).join(", ")});
    return "";
  }

  /* ---------- mecánica de la época: ventaja local y partidos más cerrados antes de la cesión prohibida ---------- */
  function signature(yr) {
    var prof = eraContextForYear(yr) || eraProfileForYear(yr), rules = prof && prof.rules || {}, sig = D.signature;
    var home = rules.compressedCovidCalendar ? sig.covidHomeAdv : sig.homeAdv[decadeOf(yr)];
    return {home: home != null ? home : 0.1, thin: rules.backPassBanned === false ? sig.backPassGoalScale : 1, covid: !!rules.compressedCovidCalendar, backPass: rules.backPassBanned === false};
  }
  function signatureLines(yr) {
    var s = signature(yr), out = [], pct = Math.round((s.home / 0.1 - 1) * 100);
    if (s.covid) out.push(t("Estadios vacíos: casi no hay ventaja por jugar en casa."));
    else if (pct > 0) out.push(t("Jugar en casa pesa más que hoy: +{n} % de ventaja local.", {n: pct}));
    if (s.backPass) out.push(t("Con la cesión al portero permitida, quien gana duerme el partido: unos {n} % menos goles.", {n: Math.round((1 - s.thin) * 100)}));
    return out;
  }
  function rnd() { return typeof R === "function" ? R() : Math.random(); }
  function thin(n, p) { var k = 0; for (var i = 0; i < n; i++) if (rnd() < p) k++; return k; }

  /* ---------- leyenda rival ---------- */
  function myClub() { return S.mode === "mgr" ? S.m && S.m.club : S.p && S.p.club; }
  function pickRival() {
    if (!S || !S.era) return null;
    var mine = myClub(), list = starsAt(S.yr).filter(function (s) { return W.cName[s.club] != null && W.cName[s.club] !== mine; });
    if (!list.length) return null;
    var s = list[hash(S.uid || "x") % list.length];
    return {id: s.id, name: starName(s), club: s.club, until: s.until, from: S.yr};
  }
  function rivalDuel() {
    if (!S || !S.era) return null;
    var r = S.era.rival; if (!r) return null;
    var ci = W.cName[r.club], mine = myClub(), a = 0, b = 0;
    Object.keys(S.hist || {}).forEach(function (k) {
      if (k === "BDO" || k.indexOf("PO:") === 0) return;
      (S.hist[k] || []).forEach(function (e) { if (e[0] < r.from) return; if (e[1] === mine) a++; if (e[1] === ci && e[0] <= r.until + 1) b++; });
    });
    return {name: r.name, club: typeof eraClubName === "function" ? eraClubName(r.club, S.yr) : r.club, mine: a, theirs: b, retired: S.yr > r.until};
  }

  /* ---------- desafíos ---------- */
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* el diario se calcula solo con la fecha: mismo reto para todos ese día, sin conexión */
  function daily(date) {
    date = date || today();
    var h = hash("eras-daily|" + date), packs = ERAS_DATA.packs.slice().sort(function (a, b) { return a.years[0] - b.years[0]; });
    var pack = packs[h % packs.length], year = pack.years[0] + (Math.floor(h / 7) % 10);
    var pool = [];
    (D.dailyLeagues || []).forEach(function (id) {
      var li = W.lgIdx ? W.lgIdx[id] : null; if (li == null) return;
      W.lg[li].cl0.forEach(function (ci, rank) { if (eraClubExists(W.clubs[ci].n, year)) pool.push({ci: ci, rank: rank, lg: id}); });
    });
    if (!pool.length) return null;
    var pick = pool[Math.floor(h / 131) % pool.length], big = pick.rank < 4;
    return {id: "daily-" + date, daily: true, date: date, mode: "manager", year: year, club: W.clubs[pick.ci].n,
      key: big ? "L:" + pick.lg : "*", by: year + (big ? 1 : 2), seasons: big ? 2 : 3};
  }
  function challengeById(id) { return id && id.indexOf("daily-") === 0 ? daily(id.slice(6)) : D.challenges.filter(function (c) { return c.id === id; })[0] || null; }
  function challengeName(c) { return c.daily ? t("Desafío del día ({date})", {date: c.date}) : loc(c.name); }
  function challengeGoal(c) {
    if (!c.daily) return loc(c.goal);
    return c.key === "*" ? t("Gana un título con {club} en {n} temporadas.", {club: c.club, n: c.seasons}) : t("Gana la liga con {club} en {n} temporadas.", {club: c.club, n: c.seasons});
  }
  function meta() { var m = EraMeta.get(); m.ch = m.ch || {}; return m; }
  function onHist(key, who) {
    var ch = S && S.era && S.era.challenge; if (!ch || ch.done || ch.failed) return;
    if (S.yr > ch.by) { ch.failed = true; return; }
    if (who !== myClub() || key === "BDO" || key.indexOf("PO:") === 0) return;
    if (ch.key !== "*" && ch.key !== key) return;
    ch.done = S.yr; var m = meta(); m.ch[ch.id] = {y: S.yr};
    if (Object.keys(m.ch).length >= 5) m.titles.chal = 1;
    EraMeta.save(); S.era.chalNews = 1;
  }
  function chalStatus() {
    var ch = S && S.era && S.era.challenge; if (!ch) return null;
    if (!ch.done && !ch.failed && S.yr > ch.by) ch.failed = true;
    return ch;
  }

  /* ---------- dinastía ---------- */
  function dynastyFrom() {
    if (!S || !S.era) return null;
    var who = S.mode === "mgr" ? S.m : S.p, next = S.yr + 1;
    var last = ERAS_DATA.packs.reduce(function (m, p) { return Math.max(m, p.years[1]); }, 0);
    if (next > last || !who) return null;
    var trophies = (who.trophies || []).length, prev = (S.era.dynasty && S.era.dynasty.prev || []).slice();
    prev.push({n: (who.fn || "") + " " + (who.ln || ""), from: S.era.startYear, to: S.yr, tro: trophies, mode: S.mode === "mgr" ? "manager" : "player"});
    return {gen: prev.length + 1, prev: prev, ln: who.ln || "", year: next, hist: JSON.parse(JSON.stringify(S.hist || {}))};
  }
  return {data: D, starsAt: starsAt, starName: starName, injectStars: injectStars, starsLine: starsLine, signature: signature, signatureLines: signatureLines, thin: thin,
    pickRival: pickRival, rivalDuel: rivalDuel, daily: daily, challengeById: challengeById, challengeName: challengeName, challengeGoal: challengeGoal, onHist: onHist,
    chalStatus: chalStatus, dynastyFrom: dynastyFrom, hash: hash, loc: loc, today: today};
})();

(function installEraLegends() {
  if (!ERAS_MODE) return;
  /* plantillas con las estrellas de la época */
  if (typeof genSquad === "function") {
    var baseSquad = genSquad;
    genSquad = function (club) {
      var out = baseSquad.apply(this, arguments);
      try { if (eraContextForYear(S && S.yr)) EraLegends.injectStars(club, out); } catch (e) {}
      return out;
    };
  }
  /* mecánica de la época sobre el núcleo de goles: solo con contexto de Épocas */
  if (typeof simGoals === "function") {
    var baseGoals = simGoals;
    simGoals = function (ra, rb, home) {
      if (!eraContextForYear(S && S.yr)) return baseGoals.apply(this, arguments);
      var sig = EraLegends.signature(S.yr), g = baseGoals.call(this, ra, rb, (home || 0) * sig.home / 0.1);
      if (sig.thin < 1) g = [EraLegends.thin(g[0], sig.thin), EraLegends.thin(g[1], sig.thin)];
      return g;
    };
  }
  if (typeof histPush === "function") {
    var baseHist = histPush;
    histPush = function (k, yr, who) { var out = baseHist.apply(this, arguments); try { if (S && S.era && S.era.active) EraLegends.onHist(k, who); } catch (e) {} return out; };
  }
  /* al crear: desafío (club fijo), dinastía (apellido e historia heredados) y leyenda rival */
  if (typeof eraStartFromCreateNow === "function") {
    var baseStart = eraStartFromCreateNow;
    eraStartFromCreateNow = function (c) {
      var ch = c && c.era && c.era.challenge ? EraLegends.challengeById(c.era.challenge) : null;
      if (ch && W.cName[ch.club] != null) c.club = W.cName[ch.club];
      var out = baseStart.apply(this, arguments);
      if (S && S.era) {
        if (ch) S.era.challenge = {id: ch.id, key: ch.key, by: ch.by, club: ch.club, daily: !!ch.daily};
        var dyn = c.era && c.era.dynasty;
        if (dyn) { S.era.dynasty = {gen: dyn.gen, prev: dyn.prev}; if (dyn.hist) {
          var merged = dyn.hist; S.hist = S.hist || {};
          Object.keys(S.hist).forEach(function (k) { var old = merged[k] || [], years = {}; old.forEach(function (e) { years[e[0]] = 1; }); merged[k] = old.concat(S.hist[k].filter(function (e) { return !years[e[0]]; })); });
          S.hist = merged;
        } }
        S.era.rival = EraLegends.pickRival();
        if (window.UIX && window.UIX.persist) window.UIX.persist();
      }
      return out;
    };
  }
})();
