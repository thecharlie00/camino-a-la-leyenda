/* Modo Épocas: capa aislada, con perfiles JSON empaquetados en ERAS_DATA.
   Sin perfil activo, todas las envolturas delegan exactamente al motor moderno. */
var ERA_SAVE_SCHEMA = 1;
var ERA_SAVE_PREFIX = "camino.eras.v1.";
var ERA_CREATE_CONTEXT = null;

function eraDeepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  Object.keys(source).forEach(function (key) {
    var value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = eraDeepMerge(target[key] && typeof target[key] === "object" ? target[key] : {}, value);
    } else target[key] = value;
  });
  return target;
}
function eraClone(value) { return JSON.parse(JSON.stringify(value)); }
function eraPacks() { return ERAS_MODE && ERAS_DATA && Array.isArray(ERAS_DATA.packs) ? ERAS_DATA.packs : []; }
function eraPackForYear(year) {
  var packs = eraPacks(), y = +year || 0;
  for (var i = 0; i < packs.length; i++) if (y >= packs[i].years[0] && y <= packs[i].years[1]) return packs[i];
  if (packs.length && y < packs[0].years[0]) return packs[0];
  return packs.length ? packs[packs.length - 1] : null;
}
function eraProfileForYear(year) {
  var pack = eraPackForYear(year);
  if (!pack) return null;
  var result = eraClone(pack), events = ERAS_DATA.timeline && ERAS_DATA.timeline.events || [];
  events.slice().sort(function (a, b) { return a.year - b.year; }).forEach(function (event) {
    if (event.year <= year) eraDeepMerge(result, event.changes);
  });
  result.currentYear = +year;
  return result;
}
function eraContextForYear(year) {
  if (!ERAS_MODE) return null;
  if (S && S.era && S.era.active) return eraProfileForYear(year == null ? S.yr : year);
  if (ERA_CREATE_CONTEXT) return eraProfileForYear(year == null || +year < ERA_CREATE_CONTEXT.startYear ? ERA_CREATE_CONTEXT.startYear : year);
  return null;
}
function eraIsActive() { return !!(ERAS_MODE && S && S.era && S.era.active); }
function eraKeepYearRoundMarket() {
  var rules = eraRulesForYear(S && S.yr), market = S && S.m && S.m.mk;
  if (!rules || rules.transferWindows !== false || !market || !S.m || S.m.club < 0) return;
  market.open = "year-round";
  if ((!market.list || !market.list.length) && typeof mgrScoutList === "function") market.list = mgrScoutList(12);
}
function eraWrapMarketPhase(name) {
  if (typeof window[name] !== "function") return;
  var original = window[name];
  window[name] = function () {
    var result = original.apply(this, arguments);
    eraKeepYearRoundMarket();
    return result;
  };
}
function eraWrapPlayerMarket() {
  if (typeof window.queueBetween !== "function") return;
  var original = window.queueBetween;
  window.queueBetween = function (nextBi) {
    var result = original.apply(this, arguments), rules = eraRulesForYear(S && S.yr);
    if (rules && !rules.transferWindows && nextBi !== 3 && S.p && typeof genOffers === "function") {
      var offers = genOffers("verano");
      if (offers.length) S.pend.push({k: "offers", list: offers, kind: N_("mercado abierto"), forced: false});
    }
    return result;
  };
}
function eraWrapSeasonDecision(name) {
  if (typeof window[name] !== "function") return;
  var original = window[name];
  window[name] = function () {
    var result = original.apply(this, arguments);
    eraQueueSeasonDecision();
    return result;
  };
}
function eraWrapScouting() {
  if (typeof window.mgrScoutList !== "function") return;
  var original = window.mgrScoutList;
  window.mgrScoutList = function (count) {
    if (!eraIsActive()) return original.apply(this, arguments);
    var level = Math.max(0, Math.min(5, +(S.era.scoutingLevel || 0)));
    var targets = original.call(this, Math.max(0, (+count || 0) + level));
    if (level && Array.isArray(targets)) targets.forEach(function (target) {
      if (!target || target.pot == null || !Array.isArray(target.potR)) return;
      var error = Math.max(0, 4 - level);
      target.potR = [Math.max(target.ovr || 0, Math.round(target.pot - error)), Math.min(95, Math.round(target.pot + error))];
    });
    return targets;
  };
}
function eraInstallKitHooks() {
  if (typeof PLook === "undefined" || !PLook || typeof PLook.rig !== "function") return;
  var original = PLook.rig;
  PLook.rig = function (player, extra) {
    var source = player || (typeof PLook.player === "function" ? PLook.player() : null);
    var rig = original.apply(this, arguments), info = eraInfoForYear(S && S.yr);
    var ownShirt = source && (source.gear && source.gear.shirt || source.shirt && source.shirt.id && source.shirt.id !== "plain");
    if (!info || !S.era || !S.era.active || !rig || ownShirt) return rig;
    var patterns = {"classic-70s": "retro", "classic-80s": "chevron", "baggy-90s": "hoops", "fitted-00s": "split", "modern-athletic": "diamond", "modern-performance": "lightning"};
    rig.shirtPattern = patterns[info.presentation.kits] || "plain";
    return rig;
  };
}
function eraInstallManagerDecisionHooks() {
  if (typeof mgrPendValid === "function") {
    var oldValid = mgrPendValid;
    mgrPendValid = function (item) { return item && item.k === "eraDecision" ? !!(eraIsActive() && eraDecisionRecord(item.id)) : oldValid.apply(this, arguments); };
  }
  if (typeof mgrDesc === "function") {
    var oldDesc = mgrDesc;
    mgrDesc = function (item) { return item && item.k === "eraDecision" ? eraDecisionDescription(item, true) : oldDesc.apply(this, arguments); };
  }
  if (typeof mgrResolve === "function") {
    var oldResolve = mgrResolve;
    mgrResolve = function (choice) {
      if (typeof mgrCleanPend === "function") mgrCleanPend();
      var item = S && S.pend && S.pend[0];
      if (!item || item.k !== "eraDecision") return oldResolve.apply(this, arguments);
      return eraResolveDecision(item, choice, true);
    };
  }
}
function eraWrapGrowth(name, managerMode) {
  if (typeof window[name] !== "function") return;
  var original = window[name];
  window[name] = function () {
    var info = eraInfoForYear(S && S.yr);
    if (!info || !info.playerModel) return original.apply(this, arguments);
    var scale = Math.max(0.4, Math.min(1.25, info.playerModel.trainingScale + (S.era ? +S.era.trainingBonus || 0 : 0)));
    if (scale === 1) return original.apply(this, arguments);
    var players = managerMode ? S && S.m && S.m.sq || [] : S && S.p ? [S.p] : [];
    var before = players.map(function (player) { return {player: player, ovr: player.ovr, attributes: !managerMode && player.tr && typeof player.tr === "object" ? eraClone(player.tr) : null}; });
    var result = original.apply(this, arguments);
    before.forEach(function (entry) {
      var player = entry.player;
      player.ovr = entry.ovr + (player.ovr - entry.ovr) * scale;
      if (entry.attributes && player.tr) Object.keys(player.tr).forEach(function (key) {
        player.tr[key] = (entry.attributes[key] || 0) + ((player.tr[key] || 0) - (entry.attributes[key] || 0)) * scale;
      });
    });
    return result;
  };
}
function eraRulesForYear(year) {
  var profile = eraContextForYear(year);
  return profile ? profile.rules : null;
}
function eraVarAllowed(rules) {
  if (!rules) return true;
  var allowed = rules.varByCompetition || {}, club = S && S.m ? S.m.club : S && S.p ? S.p.club : -1;
  var li = S && S.cl && club >= 0 ? S.cl[club] : -1, league = li >= 0 && W && W.lg ? W.lg[li] : null;
  if (!league) return false;
  var competition = league.id === "ENG1" ? "Premier League" : league.id === "ESP1" ? "La Liga" : null;
  return !!(competition && allowed[competition]);
}
function eraInfoForYear(year) {
  var profile = eraContextForYear(year);
  if (!profile) return null;
  return {profile: profile, rules: profile.rules, media: profile.media, economy: profile.economy,
    presentation: profile.presentation, staff: profile.staff, playerModel: profile.playerModel};
}
function eraMediaChannel(year, salt) {
  var info = eraInfoForYear(year);
  if (!info || !info.media || !info.media.channels.length) return "newspapers";
  var h = typeof hashStr === "function" ? hashStr(String(year) + "|" + String(salt || "")) : (+year || 0);
  return info.media.channels[h % info.media.channels.length];
}
function eraDecisionRecord(id) {
  var records = ERAS_DATA && ERAS_DATA.decisions && ERAS_DATA.decisions.records || [];
  for (var i = 0; i < records.length; i++) if (records[i].id === id) return records[i];
  return null;
}
function eraDecisionEvent(record) {
  var events = ERAS_DATA && ERAS_DATA.decisions && ERAS_DATA.decisions.historyEvents || [];
  if (!record || !record.historyEventId) return null;
  for (var i = 0; i < events.length; i++) if (events[i].id === record.historyEventId) return events[i];
  return null;
}
function eraEventText(event, field) {
  var localized = event && event[field], language = typeof LANG === "string" ? LANG : "es";
  if (localized && localized[language]) return localized[language];
  return localized && localized.es || "";
}
function eraDecisionLabel(record) {
  var catalog = ERAS_DATA.decisions, topic = catalog.topics[record.topic], context = catalog.contexts[record.decade][record.context];
  var event = eraDecisionEvent(record);
  return eraText(topic.key) + " · " + (event ? eraEventText(event, "label") : eraText(context));
}
function eraDecisionOptions(record) {
  var lever = ERAS_DATA.decisions.topics[record.topic].lever, n = record.intensity;
  var invest = {funds: -n, morale: -1, reputation: 1}, pilot = {funds: -1, morale: 1}, defer = {funds: 1, reputation: -1};
  if (lever !== "funds") {
    invest[lever] = (invest[lever] || 0) + 1 + n;
    pilot[lever] = (pilot[lever] || 0) + 1;
    defer[lever] = (defer[lever] || 0) - 1;
  }
  return [invest, pilot, defer];
}
function eraDecisionFundsAmount(amount, managerMode) {
  if (!amount) return 0;
  if (managerMode) {
    var m = S && S.m, base = m ? Math.max(250000, +m.bud || 0) : 250000;
    var raw = Math.max(25000, Math.round(base * 0.025 * Math.abs(amount) / 10000) * 10000);
    return amount < 0 ? -Math.min(Math.max(0, +m.bud || 0), raw) : raw;
  }
  var p = S && S.p, salary = p ? Math.max(10000, +p.sal || 0) : 10000;
  var money = p ? Math.max(0, +p.money || 0) : 0;
  var playerAmount = Math.max(1000, Math.round(salary * 0.12 * Math.abs(amount) / 1000) * 1000);
  return amount < 0 ? -Math.min(money, playerAmount) : playerAmount;
}
function eraDecisionChips(record, choice, managerMode) {
  var fx = eraDecisionOptions(record)[choice], chips = [], topics = ERAS_DATA.decisions.topics, lever = topics[record.topic].lever;
  var cash = eraDecisionFundsAmount(fx.funds, managerMode);
  if (cash) chips.push([managerMode ? "bud" : "money", cash]);
  if (fx.morale) { chips.push([managerMode ? "sqMor" : "mor", fx.morale * 2]); if (managerMode) chips.push(["chem", fx.morale * 2]); }
  if (fx.reputation) { chips.push([managerMode ? "rep" : "fame", fx.reputation * 2]); if (managerMode) chips.push(["board", fx.reputation * 2]); }
  if (lever === "training" && fx.training) chips.push(["note", 0, eraText("Entrenamiento futuro {n} puntos porcentuales", {n: Math.round(fx.training * 2)})]);
  if (lever === "insight" && fx.insight) chips.push(["note", 0, eraText(managerMode ? "Nivel de ojeo {n}" : "Profesionalidad {n}", {n: fx.insight})]);
  if (lever === "fitness" && fx.fitness) chips.push([managerMode ? "sfit" : "fit", fx.fitness * 2]);
  if (lever === "culture" && fx.culture) chips.push([managerMode ? "chem" : "fans", fx.culture * 2]);
  return chips;
}
function eraDecisionDescription(item, managerMode) {
  var record = eraDecisionRecord(item && item.id), event = eraDecisionEvent(record), currentPack = S && eraPackForYear(S.yr);
  if (!record || !eraIsActive() || !currentPack || currentPack.id !== record.decade || (event && event.year > +S.yr)) return null;
  var catalog = ERAS_DATA.decisions, context = catalog.contexts[record.decade][record.context], profile = eraInfoForYear(S.yr), opts = [
    {label: "Acelerar con inversión", description: "Coste inmediato alto; refuerza el área elegida a largo plazo."},
    {label: "Probar por fases", description: "Coste y beneficio moderados; permite aprender antes de ampliar."},
    {label: "Aplazar y proteger recursos", description: "Protege recursos ahora, pero reduce el impulso futuro."}
  ];
  return {tag: "real", tagTxt: eraText("Decisión de época"), cat: eraText("Decisión de gestión"), title: eraDecisionLabel(record),
    text: eraText(catalog.periods[record.decade]) + " " + eraText("Perfil de juego: {points} puntos por victoria, máximo {subs} cambios, {windows}; {social}.", {
      points: profile.rules.winPoints, subs: profile.rules.maxSubs,
      windows: eraText(profile.rules.transferWindows ? "Ventanas de fichajes" : "Sin ventanas obligatorias"),
      social: eraText(profile.media.socialMedia ? "Redes disponibles" : "Sin redes sociales")
    }) + " " + (event ? eraText("Marco histórico ({year}): {fact}", {year: event.year, fact: eraEventText(event, "fact")}) + " " + eraText("El hecho histórico sirve solo de contexto; el dilema y sus efectos son ficticios y no se atribuyen a clubes o personas reales. Elige según los efectos mostrados.") : eraText(context) + " " + eraText("Este dilema de gestión es una situación ficticia de juego, no un episodio histórico atribuido a un club real. Elige según los efectos mostrados.")),
    opts: opts.map(function (option, i) {
      var desc = eraText(option.description);
      return {t: eraText(option.label), d: desc, outs: [{p: 1, good: true, sure: true, lab: eraText("Efecto confirmado"), chips: eraDecisionChips(record, i, managerMode)}]};
    })};
}
function eraApplyDecision(record, choice, managerMode) {
  var options = eraDecisionOptions(record), fx = options[choice], desc = eraDecisionDescription({id: record.id}, managerMode);
  if (!eraIsActive() || !fx || !desc) return null;
  var chips = [], cash = eraDecisionFundsAmount(fx.funds, managerMode), lever = ERAS_DATA.decisions.topics[record.topic].lever;
  if (managerMode) {
    var m = S.m;
    if (cash) { m.bud = Math.max(0, (+m.bud || 0) + cash); chips.push(["bud", cash]); }
    if (fx.morale) { m.chem = clamp((+m.chem || 0) + fx.morale * 2, 0, 100); (m.sq || []).forEach(function (p) { p.mor = clamp((+p.mor || 0) + fx.morale * 2, 0, 100); }); chips.push(["sqMor", fx.morale * 2], ["chem", fx.morale * 2]); }
    if (fx.reputation) { m.rep = clamp((+m.rep || 0) + fx.reputation * 2, 0, 100); m.board = clamp((+m.board || 0) + fx.reputation * 2, 0, 100); m.peakRep = Math.max(+m.peakRep || 0, m.rep); chips.push(["rep", fx.reputation * 2], ["board", fx.reputation * 2]); }
    if (lever === "training" && fx.training) S.era.trainingBonus = clamp((+S.era.trainingBonus || 0) + fx.training * 0.02, -0.2, 0.2);
    if (lever === "insight" && fx.insight) S.era.scoutingLevel = clamp((+S.era.scoutingLevel || 0) + fx.insight, 0, 5);
    if (lever === "fitness" && fx.fitness) { (m.sq || []).forEach(function (p) { p.fit = clamp((+p.fit || 0) + fx.fitness * 2, 0, 100); }); chips.push(["sfit", fx.fitness * 2]); }
    if (lever === "culture" && fx.culture) { m.chem = clamp((+m.chem || 0) + fx.culture * 2, 0, 100); m.fans = clamp((+m.fans || 0) + fx.culture * 2, 0, 100); chips.push(["chem", fx.culture * 2], ["fans", fx.culture * 2]); }
  } else {
    var p = S.p;
    if (cash) { p.money = Math.max(0, (+p.money || 0) + cash); chips.push(["money", cash]); }
    if (fx.morale) { p.mor = clamp((+p.mor || 0) + fx.morale * 2, 0, 100); chips.push(["mor", fx.morale * 2]); }
    if (fx.reputation) { p.fame = clamp((+p.fame || 0) + fx.reputation * 2, 0, 100); chips.push(["fame", fx.reputation * 2]); }
    if (lever === "training" && fx.training) S.era.trainingBonus = clamp((+S.era.trainingBonus || 0) + fx.training * 0.02, -0.2, 0.2);
    if (lever === "insight" && fx.insight) { p.prof = clamp((+p.prof || 0) + fx.insight, 0, 100); chips.push(["prof", fx.insight]); }
    if (lever === "fitness" && fx.fitness) { p.fit = clamp((+p.fit || 0) + fx.fitness * 2, 0, 100); chips.push(["fit", fx.fitness * 2]); }
    if (lever === "culture" && fx.culture) { p.fans = clamp((+p.fans || 0) + fx.culture * 2, 0, 100); chips.push(["fans", fx.culture * 2]); }
  }
  if (lever === "training" && fx.training) chips.push(["note", 0, eraText("Entrenamiento futuro {n} puntos porcentuales", {n: Math.round(fx.training * 2)})]);
  if (lever === "insight" && fx.insight && managerMode) chips.push(["note", 0, eraText("Nivel de ojeo {n}", {n: fx.insight})]);
  S.era.decisionLog = Array.isArray(S.era.decisionLog) ? S.era.decisionLog : [];
  S.era.decisionSeen = S.era.decisionSeen || {};
  S.era.decisionSeen[record.decade] = Array.isArray(S.era.decisionSeen[record.decade]) ? S.era.decisionSeen[record.decade] : [];
  if (S.era.decisionSeen[record.decade].indexOf(record.id) < 0) S.era.decisionSeen[record.decade].push(record.id);
  S.era.decisionLog.push({id: record.id, year: S.yr, choice: choice});
  if (S.era.decisionLog.length > 200) S.era.decisionLog.splice(0, S.era.decisionLog.length - 200);
  S.pend.shift();
  var result = {t: "decision", tipo: managerMode ? "mgr" : "real", cat: desc.cat, title: desc.title, choice: desc.opts[choice].t,
    txt: eraText("Decisión de época aplicada y añadida a tu legado."), chips: chips, y: S.yr, good: true, pct: 100, eraDecisionId: record.id};
  if (managerMode && typeof feed === "function") feed(result);
  return result;
}
function eraQueueSeasonDecision() {
  if (!eraIsActive() || !S || !S.era || !S.era.active) return false;
  S.pend = Array.isArray(S.pend) ? S.pend : [];
  S.era.decisionYears = S.era.decisionYears || {};
  var yearKey = String(S.yr);
  if (S.era.decisionYears[yearKey]) return false;
  var pack = eraPackForYear(S.yr), all = ERAS_DATA && ERAS_DATA.decisions && ERAS_DATA.decisions.records || [];
  var options = all.filter(function (record) {
    if (record.decade !== pack.id) return false;
    var event = eraDecisionEvent(record);
    return !event || event.year <= +S.yr;
  });
  if (!options.length) return false;
  var seen = S.era.decisionSeen && S.era.decisionSeen[pack.id] || [];
  var fresh = options.filter(function (record) { return seen.indexOf(record.id) < 0; });
  if (!fresh.length) fresh = options;
  var seed = typeof hashStr === "function" ? hashStr(String(S.uid || "") + "|" + yearKey + "|" + pack.id) : +S.yr;
  var decision = fresh[Math.abs(seed) % fresh.length];
  S.era.decisionYears[yearKey] = decision.id;
  S.pend.push({k: "eraDecision", id: decision.id});
  return decision;
}
function eraResolveDecision(item, choice, managerMode) {
  var record = eraDecisionRecord(item && item.id), desc = eraDecisionDescription(item, managerMode);
  if (!record || !desc || choice < 0 || choice >= desc.opts.length) return null;
  return eraApplyDecision(record, choice, managerMode);
}
function eraKnownYear(year) { return !!eraPackForYear(year); }
function eraText(text, values) {
  var language = typeof LANG === "string" ? LANG : "es", row = ERAS_I18N && ERAS_I18N[text], output = row && row[language] ? row[language] : text;
  Object.keys(values || {}).forEach(function (key) { output = output.split("{" + key + "}").join(String(values[key])); });
  return output;
}
function eraEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"})[c]; });
}
function eraLocalStorage() {
  try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
}
var EraStore = {
  indexKey: ERA_SAVE_PREFIX + "index",
  getIndex: function () {
    var ls = eraLocalStorage();
    try { var index = ls ? JSON.parse(ls.getItem(this.indexKey) || "[]") : []; return Array.isArray(index) ? index : []; } catch (e) { return []; }
  },
  save: function () {
    if (!eraIsActive() || typeof serialize !== "function") return false;
    var ls = eraLocalStorage();
    if (!ls) return false;
    try {
      S.era.saveSchema = ERA_SAVE_SCHEMA;
      S.era.savedAt = Date.now();
      var json = serialize(), id = String(S.uid), key = ERA_SAVE_PREFIX + "save." + id;
      ls.setItem(key + ".tmp", json);
      if (ls.getItem(key + ".tmp") !== json) throw new Error("No se pudo verificar el guardado de Épocas");
      ls.setItem(key, json);
      ls.removeItem(key + ".tmp");
      var meta = {id: id, mode: S.era.mode, player: S.p ? (S.p.fn + " " + S.p.ln).trim() : ((S.m && S.m.fn ? S.m.fn + " " : "") + (S.m ? S.m.ln : "")),
        club: S.m ? clubName(S.m.club) : S.p ? clubName(S.p.club) : "", year: S.yr, startYear: S.era.startYear,
        decade: S.era.startDecade, profile: S.era.profileId, schema: ERA_SAVE_SCHEMA, savedAt: S.era.savedAt};
      var index = this.getIndex().filter(function (entry) { return entry && entry.id !== id; });
      index.unshift(meta);
      ls.setItem(this.indexKey, JSON.stringify(index.slice(0, 10)));
      return true;
    } catch (e) {
      try { ls.removeItem(ERA_SAVE_PREFIX + "save." + String(S.uid) + ".tmp"); } catch (ignore) {}
      console.warn("No se pudo guardar la carrera de Épocas", e);
      return false;
    }
  },
  read: function (id) {
    var ls = eraLocalStorage();
    if (!ls) return null;
    try {
      var json = ls.getItem(ERA_SAVE_PREFIX + "save." + String(id));
      if (!json) return null;
      var state = JSON.parse(json), version = state && state.era ? (+state.era.saveSchema || 1) : 0;
      if (version > ERA_SAVE_SCHEMA) throw new Error("Este guardado requiere una versión más reciente del Modo Épocas");
      if (!state || !state.era || !state.era.active || !state.era.startDecade) throw new Error("El guardado no incluye los metadatos de época");
      return json;
    } catch (e) { console.warn("Guardado de Épocas no válido", e); return null; }
  },
  remove: function (id) {
    var ls = eraLocalStorage();
    if (!ls) return;
    try { ls.removeItem(ERA_SAVE_PREFIX + "save." + String(id)); } catch (e) {}
    ls.setItem(this.indexKey, JSON.stringify(this.getIndex().filter(function (entry) { return entry && entry.id !== id; })));
  }
};
function eraStartCareer(mode, year, identity) {
  if (!ERAS_MODE || (mode !== "player" && mode !== "manager")) throw new Error("Modo Épocas no disponible");
  year = Math.round(+year);
  var pack = eraPackForYear(year);
  if (!pack || year < pack.years[0] || year > pack.years[1]) throw new Error("Año fuera del perfil elegido");
  identity = identity || {};
  var selectedClubName = identity.clubName || (Number.isInteger(identity.club) && W.clubs[identity.club] ? W.clubs[identity.club].n : null);
  buildWorld("m");
  var previousStartYear = START_YEAR, previousContext = ERA_CREATE_CONTEXT;
  ERA_CREATE_CONTEXT = {active: true, startYear: year, mode: mode};
  START_YEAR = year;
  try {
    if (mode === "manager") {
      var chosenClub = selectedClubName && W.cName[selectedClubName] != null ? W.cName[selectedClubName] : (W.cName["Manchester United"] != null ? W.cName["Manchester United"] : 0);
      newManagerCareer({fn: identity.firstName || "Alex", ln: identity.lastName || "Leyenda", nat: identity.nat || "ES", age: 40, diff: 1, ev: 0, club: chosenClub, g: "m"});
    } else {
      var playerClub = Number.isInteger(identity.club) && W.clubs[identity.club] ? identity.club : -1;
      newCareer({fn: identity.firstName || "Alex", ln: identity.lastName || "Leyenda", nat: identity.nat || "ES", pos: identity.position || "DC", foot: identity.foot || "Diestro", age: 18, talent: "promesa", club: playerClub, ev: 0, g: "m"});
    }
  } finally {
    START_YEAR = previousStartYear;
    ERA_CREATE_CONTEXT = previousContext;
  }
  if (!S) throw new Error("No se pudo crear la carrera histórica");
  var now = Date.now();
  S.uid = "era-" + now.toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
  S.era = {active: true, saveSchema: ERA_SAVE_SCHEMA, mode: mode, profileId: pack.id, startDecade: pack.id,
    startYear: year, startLabel: pack.label, createdAt: now, playerNames: "generated-archetypes", decisionLog: [], decisionSeen: {}, decisionYears: {}};
  eraQueueSeasonDecision();
  return S;
}
function eraStartWithContext(mode, year, identity) {
  var ui = window.UIX && window.UIX.ui ? window.UIX.ui() : null;
  eraStartCareer(mode, year, identity);
  if (ui) { ui.cr = null; ui.view = S.ph === "draft" ? "draft" : "game"; ui.tab = S.mode === "mgr" ? "club" : "carrera"; }
  if (window.UIX && window.UIX.persist) window.UIX.persist();
  if (window.UIX && window.UIX.render) window.UIX.render(true);
}

/* Los cambios se evalúan con S.yr en cada operación; no hay un bool global de reglas. */
(function installEraRules() {
  if (!ERAS_MODE) return;
  if (typeof realDB === "function") {
    var oldRealDB = realDB;
    realDB = function () { return eraContextForYear(S && S.yr) ? null : oldRealDB.apply(this, arguments); };
  }
  ["mgrStartSeason", "mgrStartBlock", "mgrQueueBetween", "mgrStartSummer"].forEach(eraWrapMarketPhase);
  eraWrapPlayerMarket();
  eraWrapSeasonDecision("startSeason");
  eraWrapSeasonDecision("mgrStartSeason");
  eraWrapScouting();
  eraInstallManagerDecisionHooks();
  eraInstallKitHooks();
  eraWrapGrowth("growthTick", false);
  eraWrapGrowth("mgrGrowth", true);
  if (typeof extraTime === "function") {
    var oldExtraTime = extraTime;
    extraTime = function () {
      var result = oldExtraTime.apply(this, arguments), rules = eraRulesForYear(S && S.yr);
      if (rules && rules.goldenGoal && result[0] !== result[1]) return result[0] > result[1] ? [1, 0] : [0, 1];
      return result;
    };
  }
  if (typeof tblAdd === "function") {
    var oldTblAdd = tblAdd;
    tblAdd = function (row, gf, ga) {
      if (!eraContextForYear(S && S.yr)) return oldTblAdd.apply(this, arguments);
      row[0]++; row[4] += gf; row[5] += ga;
      if (gf > ga) { row[1]++; row[6] += eraRulesForYear(S.yr).winPoints; }
      else if (gf === ga) { row[2]++; row[6] += 1; }
      else row[3]++;
    };
  }
  if (typeof salaryFor === "function") {
    var oldSalaryFor = salaryFor;
    salaryFor = function () {
      var value = oldSalaryFor.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      return info ? Math.max(1000, Math.round(value * info.economy.wageScale / 1000) * 1000) : value;
    };
  }
  if (typeof marketValue === "function") {
    var oldMarketValue = marketValue;
    marketValue = function () {
      var value = oldMarketValue.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      return info ? Math.max(1000, Math.round(value * info.economy.marketScale / 1000) * 1000) : value;
    };
  }
  if (typeof pValue === "function") {
    var oldPValue = pValue;
    pValue = function () {
      var value = oldPValue.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      return info ? Math.max(1000, Math.round(value * info.economy.marketScale / 1000) * 1000) : value;
    };
  }
  if (typeof mgrSalary === "function") {
    var oldMgrSalary = mgrSalary;
    mgrSalary = function () {
      var value = oldMgrSalary.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      return info ? Math.max(1000, Math.round(value * info.economy.wageScale / 1000) * 1000) : value;
    };
  }
  if (typeof mBudgetFor === "function") {
    var oldMBudgetFor = mBudgetFor;
    mBudgetFor = function () {
      var value = oldMBudgetFor.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      return info ? Math.max(100000, Math.round(value * info.economy.tvDealMultiplier / 4 / 100000) * 100000) : value;
    };
  }
  if (typeof attrs === "function") {
    var oldAttrs = attrs;
    attrs = function () {
      var values = oldAttrs.apply(this, arguments), info = eraInfoForYear(S && S.yr);
      if (!info) return values;
      ["RIT", "VEL"].forEach(function (key) { if (values[key] != null) values[key] = Math.max(20, Math.min(99, Math.round(values[key] * info.playerModel.paceScale))); });
      ["FIS"].forEach(function (key) { if (values[key] != null) values[key] = Math.max(20, Math.min(99, Math.round(values[key] * info.playerModel.staminaScale))); });
      return values;
    };
  }
  if (typeof liveSub === "function") {
    var oldLiveSub = liveSub;
    liveSub = function () {
      var rules = eraRulesForYear(S && S.yr), live = S && S.live;
      if (rules && live && (live.subs || []).length >= rules.maxSubs) {
        if (window.UIX && window.UIX.toast) window.UIX.toast(eraText("Esta época permite {n} cambios por partido.", {n: rules.maxSubs}));
        return false;
      }
      return oldLiveSub.apply(this, arguments);
    };
  }
  if (typeof socPost === "function") {
    var oldSocPost = socPost;
    socPost = function () {
      var info = eraInfoForYear(S && S.yr);
      if (info && !info.media.socialMedia) return null;
      return oldSocPost.apply(this, arguments);
    };
  }
  [
    [typeof EVENT_BY_ID !== "undefined" ? EVENT_BY_ID.x_var_anulado : null, "VAR"],
    [typeof MEV_BY_ID !== "undefined" ? MEV_BY_ID.mx_var : null, "VAR"]
  ].forEach(function (entry) {
    var event = entry[0];
    if (!event || typeof event.when !== "function") return;
    var originalWhen = event.when;
    event.when = function () {
      var rules = eraRulesForYear(S && S.yr);
      if (!eraVarAllowed(rules)) return false;
      return originalWhen.apply(this, arguments);
    };
  });
})();
if (typeof EX_PEND !== "undefined") EX_PEND.eraDecision = {
  desc: function (item) { return eraDecisionDescription(item, false); },
  resolve: function (item, choice) { return eraResolveDecision(item, choice, false); }
};
