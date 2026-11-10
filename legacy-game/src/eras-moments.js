/* Momentos de leyenda, Álbum de los 80 y recompensas fuera del modo (fase 7).
   Los momentos se juegan aparte de la carrera: no tocan ninguna partida guardada. El progreso entre partidas
   (estrellas, cromos, recompensas) vive en un almacén propio y sobrevive a borrar carreras. */
var EraMeta = (function () {
  var KEY = "camino.eras.meta", cache = null;
  function blank() { return {v: 1, mom: {}, cards: {}, rew: {}, titles: {}}; }
  function get() {
    if (cache) return cache;
    var m = null;
    try { var ls = eraLocalStorage(); m = ls ? JSON.parse(ls.getItem(KEY) || "null") : null; } catch (e) { m = null; }
    cache = m && m.v === 1 ? m : blank();
    ["mom", "cards", "rew", "titles"].forEach(function (k) { if (!cache[k] || typeof cache[k] !== "object") cache[k] = {}; });
    return cache;
  }
  function save() { try { var ls = eraLocalStorage(); if (ls) ls.setItem(KEY, JSON.stringify(get())); } catch (e) {} }
  function reset() { cache = null; }
  return {get: get, save: save, reset: reset};
})();

var EraMoments = (function () {
  var DATA = ERAS_DATA.moments || {moments: [], album: {pages: []}, rewards: []};
  var MOMENTS = DATA.moments, ALBUM = DATA.album, REWARDS = DATA.rewards || [];
  function t(s, v) { return eraText(s, v); }
  function loc(o) { var l = typeof LANG === "string" ? LANG : "es"; return o ? o[l] || o.es || "" : ""; }
  function byId(id) { return MOMENTS.filter(function (m) { return m.id === id; })[0] || null; }
  function allCards() { var out = []; ALBUM.pages.forEach(function (p) { p.cards.forEach(function (c) { out.push(c); }); }); return out; }
  function card(id) { return allCards().filter(function (c) { return c.id === id; })[0] || null; }

  /* ---------- objetivos y simulación (puros, con rand inyectable para las pruebas) ---------- */
  var SECONDARY = {
    clean: "No encajes ningún gol", score2: "Marca al menos 2 goles", score3: "Marca al menos 3 goles",
    noET: "Decídelo sin prórroga", noDefend: "No te encierres atrás en ningún tramo",
    allPens: "Marca todos tus penaltis", firstFive: "Gana en las cinco primeras rondas", bestShot: "Marca un penalti arriesgado (menos del 60 %)",
    save2: "Para al menos 2 penaltis", save3: "Para al menos 3 penaltis", concede1: "Encaja como mucho 1 penalti"
  };
  function mainText(m, mode) {
    if (mode === "rewrite") return t("Cambia la historia: que gane {team}", {team: teamName(m.teams[1])});
    if (m.needMargin) return t("Gana por {n} goles o más", {n: m.needMargin});
    if (m.needDraw) return t("No pierdas");
    return t("Gana como en la historia real");
  }
  /* estado inicial: el jugador lleva siempre al equipo «you»; el marcador se guarda desde el equipo 0 */
  function initState(m, mode) {
    var you = mode === "rewrite" ? 1 : 0;
    var st = {id: m.id, mode: mode, you: you, kind: m.kind, minute: m.minute || 0, s: (m.score || [0, 0]).slice(), add: [0, 0],
      phase: m.kind === "match" ? "play" : "pens", et: false, defended: false, pens: {k: [[], []], round: 0, saves: 0, conceded: 0, risky: false}, log: [], done: false};
    st.chunks = m.kind === "match" ? Math.max(2, Math.min(5, Math.ceil((90 - st.minute) / 15))) : 0;
    st.chunk = 0;
    return st;
  }
  function poisson(l, rand) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rand(); } while (p > L && k < 12); return k - 1; }
  var TACTIC = {att: [1.45, 1.35], bal: [1, 1], def: [0.6, 0.55]};
  function help(id) { var r = EraMeta.get().mom[id]; return r ? Math.min(4, r.f || 0) : 0; }
  /* un tramo: goles de cada equipo según fuerza, táctica y (sin anunciarlo) los intentos fallidos */
  function playChunk(m, st, tactic, mins, rand) {
    var me = m.teams[st.you], them = m.teams[1 - st.you], d = (me.r - them.r) / 10;
    var tf = TACTIC[tactic] || TACTIC.bal, boost = 1 + 0.08 * help(m.id);
    var gf = poisson(1.3 * Math.exp(0.35 * d) * tf[0] * boost * mins / 90, rand), ga = poisson(1.3 * Math.exp(-0.35 * d) * tf[1] / boost * mins / 90, rand);
    if (tactic === "def") st.defended = true;
    st.s[st.you] += gf; st.s[1 - st.you] += ga; st.add[0] += gf; st.add[1] += ga;
    return [gf, ga];
  }
  function mine(st) { return st.s[st.you]; }
  function theirs(st) { return st.s[1 - st.you]; }
  /* ¿se ha cumplido la historia real? (siempre desde el equipo 0) */
  function realHappened(m, st) {
    var a = st.s[0], b = st.s[1];
    if (st.pensWinner != null) return st.pensWinner === 0;
    if (m.needMargin) return a - b >= m.needMargin;
    if (m.needDraw) return a >= b;
    return a > b;
  }
  function mainOk(m, st) { var real = realHappened(m, st); return st.mode === "rewrite" ? !real : real; }
  function secondaryOk(key, st) {
    var p = st.pens;
    switch (key) {
      case "clean": return st.add[1] === 0;
      case "score2": return st.add[0] >= 2;
      case "score3": return st.add[0] >= 3;
      case "noET": return !st.et;
      case "noDefend": return !st.defended;
      case "allPens": return p.k[0].length > 0 && p.k[0].every(Boolean);
      case "firstFive": return p.round <= 5;
      case "bestShot": return p.risky;
      case "save2": return p.saves >= 2;
      case "save3": return p.saves >= 3;
      case "concede1": return p.conceded <= 1;
    }
    return false;
  }
  function score(m, st) {
    var ok = mainOk(m, st), sec = (m.secondary || []).map(function (k) { return {k: k, ok: ok && secondaryOk(k, st)}; });
    return {ok: ok, sec: sec, stars: ok ? 1 + sec.filter(function (x) { return x.ok; }).length : 0};
  }
  /* tanda: k[0] tus lanzamientos, k[1] los del rival (true = gol) */
  function pensDecided(p) {
    var a = p.k[0].filter(Boolean).length, b = p.k[1].filter(Boolean).length, na = p.k[0].length, nb = p.k[1].length;
    if (na <= 5 && nb <= 5) {
      if (a + (5 - na) < b) return 1;
      if (b + (5 - nb) < a) return 0;
      if (na === 5 && nb === 5 && a !== b) return a > b ? 0 : 1;
      return null;
    }
    if (na === nb && a !== b) return a > b ? 0 : 1;
    return null;
  }
  function oppKick(m, st, rand) { return rand() < Math.max(0.55, 0.76 - 0.04 * help(m.id)); }
  function ourKick(m, st, rand) { return rand() < Math.min(0.9, 0.72 + 0.04 * help(m.id)); }

  /* ---------- progreso, cromos y recompensas ---------- */
  function record(m, st, res) {
    var meta = EraMeta.get(), r = meta.mom[m.id] || (meta.mom[m.id] = {r: 0, w: 0, f: 0}), slot = st.mode === "rewrite" ? "w" : "r";
    if (res.ok) { r[slot] = Math.max(r[slot] || 0, res.stars); r.f = 0; } else r.f = (r.f || 0) + 1;
    var got = [];
    if (res.ok) allCards().forEach(function (c) { if (c.kind === "moment" && c.ref === m.id && !meta.cards[c.id]) { meta.cards[c.id] = 1; got.push(c.id); } });
    var unlocked = refresh();
    EraMeta.save();
    return {cards: got, rewards: unlocked};
  }
  function momentDone(id) { var r = EraMeta.get().mom[id]; return !!(r && (r.r || r.w)); }
  function pageDone(p) { var c = EraMeta.get().cards; return p.cards.every(function (x) { return c[x.id] > 0; }); }
  /* evalúa qué recompensas se han ganado; devuelve las nuevas */
  function refresh() {
    var meta = EraMeta.get(), fresh = [];
    REWARDS.forEach(function (rw) {
      if (meta.rew[rw.id]) return;
      var u = rw.unlock || {}, ok = false;
      if (u.decade) ok = MOMENTS.filter(function (m) { return m.decade === u.decade; }).every(function (m) { return momentDone(m.id); });
      else if (u.page) ok = ALBUM.pages.filter(function (p) { return p.id === u.page; }).every(pageDone);
      else if (u.album) ok = ALBUM.pages.every(pageDone);
      if (ok) { meta.rew[rw.id] = 1; fresh.push(rw.id); }
    });
    if (!meta.titles.album && ALBUM.pages.every(pageDone)) meta.titles.album = 1;
    if (!meta.titles.all && MOMENTS.every(function (m) { return momentDone(m.id); })) meta.titles.all = 1;
    return fresh;
  }
  function addCard(id) { var c = EraMeta.get().cards; c[id] = (c[id] || 0) + 1; return id; }
  function randomCard(rand, kinds) {
    var list = allCards().filter(function (c) { return !kinds || kinds.indexOf(c.kind) >= 0; });
    return list.length ? list[Math.floor((rand || Math.random)() * list.length)].id : null;
  }
  /* cambiar repetidos: «swap» repetidos por un cromo que te falte */
  function dupes() { var c = EraMeta.get().cards, n = 0; Object.keys(c).forEach(function (k) { if (c[k] > 1) n += c[k] - 1; }); return n; }
  function swap(id) {
    var meta = EraMeta.get(), need = ALBUM.swap || 4, cd = card(id);
    if (!cd || meta.cards[id] || dupes() < need) return false;
    var left = need;
    Object.keys(meta.cards).forEach(function (k) { while (left > 0 && meta.cards[k] > 1) { meta.cards[k]--; left--; } });
    meta.cards[id] = 1; refresh(); EraMeta.save(); return true;
  }
  /* cromos en las carreras de Épocas de los 80: dos por temporada y uno por título de tu equipo */
  function compCard(key, yr) {
    var hit = allCards().filter(function (c) { return c.ref === key + ":" + yr || c.ref === key + ":" + (yr - 1) || (c.kind === "comp" && c.ref === key); })[0];
    return hit ? hit.id : null;
  }
  function inAlbumDecade(yr) { var d = +String(ALBUM.decade).slice(0, 4); return yr >= d && yr <= d + 9; }
  function myClubIdx() { return S && (S.mode === "mgr" ? S.m && S.m.club : S.p && S.p.club); }
  function onHist(key, yr, who) {
    if (!S || !S.era || !S.era.active || !inAlbumDecade(S.yr) || key === "BDO" || key.indexOf("PO:") === 0) return;
    var got = [];
    if (S.era.albumYr !== S.yr) { S.era.albumYr = S.yr; got.push(addCard(randomCard()), addCard(randomCard())); }
    var mineWin = who === myClubIdx() || (S.mode !== "mgr" && S.p && who === S.p.nat && /^(WC|EURO|CA)$/.test(key));
    if (mineWin) { var id = compCard(key, yr) || (key.indexOf("L:") === 0 ? randomCard(null, ["club"]) : null); if (id) got.push(addCard(id)); }
    if (got.length) { refresh(); EraMeta.save(); S.era.newCards = (S.era.newCards || 0) + got.filter(Boolean).length; }
  }

  /* ---------- nombres ---------- */
  function teamName(tm) {
    if (tm.type === "nat") { if (tm.era) return t(tm.name); var ni = W.cIdx ? W.cIdx[tm.code] : null; return ni != null ? natName(ni) : tm.name; }
    var ci = eraRealClub(tm.name); return ci >= 0 ? clubName(ci) : tm.name;
  }
  function cardName(c) { return c.kind === "club" ? teamName({type: "club", name: c.ref}) : loc(c.name); }
  return {list: MOMENTS, album: ALBUM, rewards: REWARDS, byId: byId, card: card, allCards: allCards, initState: initState, playChunk: playChunk, score: score,
    record: record, refresh: refresh, pensDecided: pensDecided, oppKick: oppKick, ourKick: ourKick, mine: mine, theirs: theirs, secondaryText: function (k) { return t(SECONDARY[k] || k); },
    mainText: mainText, teamName: teamName, cardName: cardName, swap: swap, dupes: dupes, addCard: addCard, randomCard: randomCard, onHist: onHist, pageDone: pageDone, loc: loc, help: help};
})();

/* ---------- recompensas en el equipamiento (todas las partidas) ---------- */
(function () {
  if (typeof GXI === "undefined") return;
  var R = EraMoments.rewards;
  ["p", "m"].forEach(function (who) {
    GXI.add(R.filter(function (r) { return r.who === who; }).map(function (r) { return [r.id, r.slot, r.name, r.stats, null, 0, {era: r.id}, r.look]; }), who);
  });
  var baseLock = GXI.lock;
  GXI.lock = function (it) {
    if (it && it.req && it.req.era) return EraMeta.get().rew[it.req.era] ? null : {k: "era", v: it.req.era};
    return baseLock.apply(this, arguments);
  };
  /* nombres de las piezas en el diccionario del juego (se cargan bajo demanda) */
  if (typeof ensureI18n === "function") {
    var baseEnsure = ensureI18n;
    ensureI18n = function (lang) {
      var out = baseEnsure.apply(this, arguments);
      try { var d = I18N[lang]; if (d) R.forEach(function (r) { if (r.names[lang] && !d[r.name]) d[r.name] = r.names[lang]; }); } catch (e) {}
      return out;
    };
  }
  window.eraLockText = function (lk) {
    var rw = R.filter(function (r) { return r.id === lk.v; })[0], u = rw ? rw.unlock : {};
    if (u.decade) return eraText("Modo Épocas: completa los momentos de leyenda de los {d}", {d: u.decade.slice(2, 4)});
    if (u.page) { var p = EraMoments.album.pages.filter(function (x) { return x.id === u.page; })[0]; return eraText("Modo Épocas: completa la página «{p}» del álbum", {p: p ? EraMoments.loc(p.name) : u.page}); }
    return eraText("Modo Épocas: completa el álbum de los 80");
  };
  /* lo ganado se entrega en cualquier partida, también en las modernas */
  window.eraGrantRewards = function () {
    if (!S) return 0;
    var meta = EraMeta.get(), n = 0;
    R.forEach(function (r) {
      if (!meta.rew[r.id]) return;
      if (r.who === "m" && (S.mode !== "mgr" || !S.m)) return;
      if (r.who === "p" && !S.p) return;
      try { if (!GXI.owned(r.id, r.who) && GXI.give(r.id, 0, r.who)) n++; } catch (e) {}
    });
    return n;
  };
  if (typeof histPush === "function") {
    var baseHist = histPush;
    histPush = function (k, yr, who) { var out = baseHist.apply(this, arguments); try { EraMoments.onHist(k, yr, who); } catch (e) {} return out; };
  }
})();
