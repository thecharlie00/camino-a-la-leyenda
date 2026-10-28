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
function eraWrapGrowth(name, managerMode) {
  if (typeof window[name] !== "function") return;
  var original = window[name];
  window[name] = function () {
    var info = eraInfoForYear(S && S.yr), scale = info && info.playerModel ? info.playerModel.trainingScale : 1;
    if (!info || scale === 1) return original.apply(this, arguments);
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
    startYear: year, startLabel: pack.label, createdAt: now, playerNames: "generated-archetypes"};
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
