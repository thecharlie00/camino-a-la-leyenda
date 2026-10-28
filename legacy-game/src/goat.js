/* Envío voluntario del resumen de partido/temporada a GOAT LADDER. */
(function (root) {
  "use strict";
  var apiOrigin = typeof GOAT_API_URL === "string" ? GOAT_API_URL.replace(/\/+$/, "") : "";
  var memoryDeleteTokens = {};
  var TOKEN_STORAGE_KEY = "camino.goat.deleteTokens";

  function safeName(name) {
    return String(name == null ? "" : name).replace(/^\s+|\s+$/g, "");
  }
  function halfScore(goals) {
    return (goals || []).filter(function (minute) { return minute <= 45; }).length;
  }
  function roundedOrNull(value) {
    return value != null && isFinite(value) ? Math.round(value) : null;
  }
  function remember(entry) {
    if (!S || !S.blog || !S.blog.length) return;
    entry.event_key = String(S.uid || "career") + ":" + S.blog.length + ":" + entry.event_type;
    S.goatLatest = entry;
  }
  function capture(action) {
    try {
      action();
    } catch (error) {
      console.error("GOAT LADDER local capture failed", error);
    }
  }
  function titleFor(mode, event, blog, opponent, competition, isFinal, comeback) {
    competition = trComp(competition);
    if (event === "season") {
      if (blog.pos === 1) return tr("Campeones de {comp}", {comp: competition});
      if (blog.l === 0) return tr("Temporada invicta");
      return tr("Temporada histórica en {comp}", {comp: competition});
    }
    if (mode === "player" && (blog.g || 0) >= 3) return tr("Hat-trick en {comp}", {comp: competition});
    if (comeback) return tr("La remontada ante {opp}", {opp: opponent});
    if (isFinal && blog.gu > blog.gt) return tr("La final de {comp}", {comp: competition});
    if (mode === "manager" && blog.gu > blog.gt && blog.gu - blog.gt === 1) return tr("Victoria ante {opp}", {opp: opponent});
    return tr("Actuación ante {opp}", {opp: opponent});
  }
  function depthOfLeague(index) {
    var depth = 1, current = index;
    while (W.lg[current] && W.lg[current].upI >= 0 && depth < 10) {
      current = W.lg[current].upI;
      depth++;
    }
    return depth;
  }
  function namesForClubs(clubs, fallback) {
    var names = [], seen = {};
    (clubs || [fallback]).forEach(function (club) {
      var name = safeName(clubName(club));
      if (name && !seen[name]) { seen[name] = true; names.push(name); }
    });
    if (!names.length && fallback != null) names.push(safeName(clubName(fallback)));
    return names;
  }
  /* Títulos y premios de una temporada con su clave de icono (para el palmarés del ranking). */
  function seasonHonours(list, year, isAward) {
    var label = typeof seasonLabel === "function" ? seasonLabel(year) : null;
    var items = (list || []).filter(function (t) {
      if (!t) return false;
      if (isAward) return t.k !== "bdo_nom" && (t.y === year + 1 || (t.y === year && /month|pom/.test(String(t.k))));
      return t.s === label;
    }).slice(0, 30);
    return {names: items.map(function (t) { return safeName(t.n).slice(0, 64); }), keys: items.map(function (t) { return String(t.k || "").slice(0, 40); })};
  }
  function playerCareerRow(row, active) {
    var player = S.p, clubs = active ? player.ss.clubs : row.clubs;
    var club = active ? player.club : row.club, league = active ? S.cl[player.club] : row.lg;
    var year = active ? S.yr : row.y, tro = seasonHonours(player.trophies, year, false), aw = seasonHonours(player.awards, year, true);
    if (!player.trophies && !active) tro = {names: (row.tro || []).map(safeName), keys: []};
    if (!player.awards && !active) aw = {names: (row.aw || []).map(safeName), keys: []};
    return {
      season: year,
      club: safeName(clubName(club)),
      clubs: namesForClubs(clubs, club),
      competition: safeName(W.lg[league] ? W.lg[league].n : ""),
      trophies: tro.names, trophy_keys: tro.keys,
      awards: aw.names, award_keys: aw.keys,
      appearances: active ? player.ss.apps || 0 : row.apps || 0,
      goals: active ? player.ss.g || 0 : row.g || 0,
      assists: active ? player.ss.a || 0 : row.a || 0,
      clean_sheets: active ? player.ss.cs || 0 : row.cs || 0,
      rating: active || row.rt == null ? null : roundedOrNull(row.rt * 10) / 10,
      overall: active ? player.ovr : row.ovr1,
      international_caps: active ? player.ns.apps || 0 : row.caps || 0,
      international_goals: active ? player.ns.g || 0 : row.ig || 0
    };
  }
  function managerCareerRow(row, active, next) {
    var club = active ? S.m.club : row.club, league = active ? S.cl[club] : row.lg;
    var promoted = !active && !!next && row.club === next.club && W.lg[row.lg] &&
      W.lg[row.lg].upI === next.lg;
    var year = active ? S.yr : row.y, tro = seasonHonours(S.m.trophies, year, false), aw = seasonHonours(S.m.awards, year, true);
    if (!S.m.trophies && !active) tro = {names: (row.tro || []).map(safeName), keys: []};
    return {
      season: year,
      club: safeName(clubName(club)),
      competition: safeName(W.lg[league] ? W.lg[league].n : ""),
      trophies: tro.names, trophy_keys: tro.keys,
      awards: aw.names, award_keys: aw.keys,
      wins: active ? S.m.ss.w || 0 : row.w || 0,
      draws: active ? S.m.ss.d || 0 : row.d || 0,
      losses: active ? S.m.ss.l || 0 : row.l || 0,
      goals_for: active ? S.m.ss.gf || 0 : row.gf || 0,
      goals_against: active ? S.m.ss.ga || 0 : row.ga || 0,
      position: active ? null : row.pos,
      promoted: promoted
    };
  }
  function careerSnapshot() {
    if (!S || !S.uid) return null;
    var manager = S.mode === "mgr", history = [];
    if (manager) {
      var seasons = S.m && S.m.seasons || [];
      seasons.forEach(function (row, index) {
        history.push(managerCareerRow(row, false, seasons[index + 1]));
      });
      if (S.m && S.m.ss && S.ph !== "ret") history.push(managerCareerRow(null, true, null));
    } else {
      var playerSeasons = S.p && S.p.seasons || [];
      playerSeasons.forEach(function (row) { history.push(playerCareerRow(row, false)); });
      if (S.p && S.p.ss && S.ph !== "ret") history.push(playerCareerRow(null, true));
    }
    if (!history.length || history.length > 100) return null;
    var metrics = {seasons: history.length, trophies: 0, awards: 0, clubs: 0};
    var clubsSeen = {};
    history.forEach(function (row) {
      metrics.trophies += row.trophies.length;
      metrics.awards += row.awards.length;
      (row.clubs || [row.club]).forEach(function (club) { clubsSeen[club] = true; });
    });
    metrics.clubs = Object.keys(clubsSeen).length;
    if (manager) {
      metrics.wins = 0; metrics.draws = 0; metrics.losses = 0; metrics.unbeaten_seasons = 0;
      metrics.promotions = 0;
      history.forEach(function (row) {
        metrics.wins += row.wins || 0; metrics.draws += row.draws || 0; metrics.losses += row.losses || 0;
        if ((row.wins || 0) + (row.draws || 0) > 0 && !row.losses) metrics.unbeaten_seasons++;
        if (row.promoted) metrics.promotions++;
      });
      var managerMatches = metrics.wins + metrics.draws + metrics.losses;
      metrics.win_percentage = managerMatches ? Math.round(metrics.wins / managerMatches * 100) : 0;
    } else {
      metrics.appearances = 0; metrics.goals = 0; metrics.assists = 0; metrics.clean_sheets = 0;
      metrics.international_caps = 0; metrics.international_goals = 0;
      history.forEach(function (row) {
        metrics.appearances += row.appearances || 0; metrics.goals += row.goals || 0;
        metrics.assists += row.assists || 0; metrics.clean_sheets += row.clean_sheets || 0;
        metrics.international_caps += row.international_caps || 0;
        metrics.international_goals += row.international_goals || 0;
      });
    }
    return {
      event_key: "career:" + String(S.uid), game_mode: manager ? "manager" : "player",
      title: service.t(manager ? "careerTitleManager" : "careerTitlePlayer"),
      current_club: safeName(clubName(manager ? S.m.club : S.p.club)),
      started_season: history[0].season, latest_season: history[history.length - 1].season,
      metrics: metrics, history: history
    };
  }
  function rememberMatch(f, mode, blog) {
    if (!S || !f || !blog || (mode === "player" && !(blog.m > 0))) return;
    var national = mode === "player" && !!f.isNat;
    var club = mode === "manager" ? clubName(S.m.club) : national ? natName(f.us) : clubName(S.p.club);
    var opponent = national ? natName(f.opp) : clubName(f.opp);
    var competition = String(blog.c || "");
    var ownGoals = f.gmu || [], opponentGoals = f.gmt || [];
    var won = blog.gu > blog.gt;
    var comeback = halfScore(ownGoals) < halfScore(opponentGoals) && won;
    var decisiveMinute = won && blog.gu - blog.gt === 1 && ownGoals.length
      ? Math.max.apply(null, ownGoals) : null;
    remember({
      event_type: "match", game_mode: mode, title: titleFor(mode, "match", blog, opponent, competition, !!f.fin, comeback),
      club_name: safeName(club), competition_name: safeName(competition), opponent_name: safeName(opponent),
      season: S.yr, goals: mode === "player" ? blog.g || 0 : null,
      assists: mode === "player" ? blog.a || 0 : null,
      match_rating: mode === "player" ? blog.rt : null,
      minutes_played: mode === "player" ? blog.m : (f.et ? 120 : 90),
      key_passes: null, possession: null, xg: null, decisive_goal_minute: decisiveMinute,
      own_score: blog.gu, opponent_score: blog.gt, goals_for: null, goals_against: null,
      halftime_own_score: halfScore(ownGoals), halftime_opponent_score: halfScore(opponentGoals),
      opponent_strength: roundedOrNull(f.or), team_strength: roundedOrNull(mode === "player" ? f.tr0 : f.tr),
      importance: f.imp || 0,
      is_final: !!f.fin
    });
  }
  function rememberSeason() {
    if (!S || !S.m || !S.m.seasons || !S.m.seasons.length) return;
    var row = S.m.seasons[S.m.seasons.length - 1], league = W.lg[row.lg];
    if (!row || !league) return;
    remember({
      event_type: "season", game_mode: "manager", title: titleFor("manager", "season", row, "", league.n),
      club_name: safeName(clubName(row.club)), competition_name: safeName(league.n), opponent_name: null,
      season: row.y, goals: null, assists: null, match_rating: null, minutes_played: null,
      key_passes: null, possession: null, xg: null, decisive_goal_minute: null,
      own_score: null, opponent_score: null, goals_for: row.gf, goals_against: row.ga,
      halftime_own_score: 0, halftime_opponent_score: 0,
      opponent_strength: null, team_strength: row.r, importance: 2, is_final: false,
      wins: row.w, draws: row.d, losses: row.l, league_position: row.pos,
      division_depth: depthOfLeague(row.lg), trophies_count: (row.tro || []).length,
      goal_difference: row.gf - row.ga
    });
  }
  function request(path, options) {
    return fetch(apiOrigin + path, options).then(function (response) {
      return response.text().then(function (body) {
        var data;
        try { data = body ? JSON.parse(body) : {}; } catch (error) { throw new Error("Invalid GOAT LADDER response"); }
        if (!response.ok) throw new Error(data.error || ("GOAT LADDER HTTP " + response.status));
        return data;
      });
    });
  }
  function storedDeleteTokens() {
    try {
      var stored = root.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) return {};
      var parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid deletion token storage");
      return parsed;
    } catch (error) {
      console.error("Could not read GOAT LADDER deletion tokens", error);
      return {};
    }
  }
  function keepDeleteToken(id, token) {
    memoryDeleteTokens[id] = token;
    var tokens = storedDeleteTokens();
    tokens[id] = token;
    try {
      root.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      return true;
    } catch (error) {
      console.error("Could not persist GOAT LADDER deletion token", error);
      return false;
    }
  }
  function forgetDeleteToken(id) {
    delete memoryDeleteTokens[id];
    var tokens = storedDeleteTokens();
    delete tokens[id];
    try {
      root.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error("Could not remove GOAT LADDER deletion token", error);
    }
  }
  var service = {
    available: function () { return !!apiOrigin; },
    latest: function () { return S && S.goatLatest ? S.goatLatest : null; },
    career: careerSnapshot,
    canDelete: function (id) { return !!(memoryDeleteTokens[id] || storedDeleteTokens()[id]); },
    t: function (key) {
      var language = typeof LANG === "string" ? LANG : "es";
      var fem = typeof FEM !== "undefined" && FEM && root.GOAT_FEM_TEXT ? root.GOAT_FEM_TEXT[language] : null;
      if (fem && fem[key]) return fem[key];
      return (root.GOAT_TEXT[language] || root.GOAT_TEXT.es)[key] || root.GOAT_TEXT.es[key] || key;
    },
    list: function (mode, timeframe) {
      if (!apiOrigin) return Promise.reject(new Error("GOAT API is not configured"));
      return Promise.resolve().then(function () {
        return request("/api/goat-ladder?mode=" + encodeURIComponent(mode) + "&timeframe=" +
          encodeURIComponent(timeframe), {method: "GET"});
      }).then(function (data) { return data.entries || []; });
    },
    submit: function (latest, displayName, title) {
      if (!apiOrigin) return Promise.reject(new Error("GOAT API is not configured"));
      if (!latest || !latest.event_key) return Promise.reject(new Error("No match or season is ready to publish"));
      var payload = {};
      Object.keys(latest).forEach(function (key) { payload[key] = latest[key]; });
      payload.display_name = safeName(displayName);
      payload.title = safeName(title);
      return Promise.resolve().then(function () {
        return request("/api/goat-ladder", {
          method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
        });
      }).then(function (data) {
        data.delete_token_saved = keepDeleteToken(data.id, data.delete_token);
        return data;
      });
    },
    listCareers: function (mode, timeframe, metric) {
      if (!apiOrigin) return Promise.reject(new Error("GOAT API is not configured"));
      return Promise.resolve().then(function () {
        return request("/api/goat-ladder/careers?mode=" + encodeURIComponent(mode) +
          "&timeframe=" + encodeURIComponent(timeframe) + "&metric=" + encodeURIComponent(metric),
        {method: "GET"});
      }).then(function (data) { return data.entries || []; });
    },
    submitCareer: function (career, displayName, title) {
      if (!apiOrigin) return Promise.reject(new Error("GOAT API is not configured"));
      if (!career || !career.event_key) return Promise.reject(new Error("No career is ready to publish"));
      var payload = {};
      Object.keys(career).forEach(function (key) { payload[key] = career[key]; });
      payload.display_name = safeName(displayName);
      payload.title = safeName(title);
      return Promise.resolve().then(function () {
        return request("/api/goat-ladder/careers", {
          method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
        });
      }).then(function (data) {
        data.delete_token_saved = keepDeleteToken(data.id, data.delete_token);
        return data;
      });
    },
    deleteEntry: function (id) {
      var token = memoryDeleteTokens[id] || storedDeleteTokens()[id];
      if (!apiOrigin || !token) return Promise.reject(new Error("No deletion token is available on this device"));
      return request("/api/goat-ladder?id=" + encodeURIComponent(id), {
        method: "DELETE", headers: {Authorization: "Bearer " + token}
      }).then(function (data) {
        forgetDeleteToken(id);
        return data;
      });
    },
    deleteCareer: function (id) {
      var token = memoryDeleteTokens[id] || storedDeleteTokens()[id];
      if (!apiOrigin || !token) return Promise.reject(new Error("No deletion token is available on this device"));
      return request("/api/goat-ladder/careers?id=" + encodeURIComponent(id), {
        method: "DELETE", headers: {Authorization: "Bearer " + token}
      }).then(function (data) {
        forgetDeleteToken(id);
        return data;
      });
    }
  };
  root.GoatLadder = service;

  if (typeof finishPlayer === "function") {
    var originalPlayerFinish = finishPlayer;
    finishPlayer = function (fixture) {
      var before = S && S.blog ? S.blog.length : 0;
      var result = originalPlayerFinish.apply(this, arguments);
      if (S && S.blog && S.blog.length > before) capture(function () {
        rememberMatch(fixture, "player", S.blog[S.blog.length - 1]);
      });
      return result;
    };
  }
  if (typeof mgrFinish === "function") {
    var originalManagerFinish = mgrFinish;
    mgrFinish = function (fixture) {
      var before = S && S.blog ? S.blog.length : 0;
      var result = originalManagerFinish.apply(this, arguments);
      if (S && S.blog && S.blog.length > before) capture(function () {
        rememberMatch(fixture, "manager", S.blog[S.blog.length - 1]);
      });
      return result;
    };
  }
  if (typeof mgrSeasonEnd === "function") {
    var originalSeasonEnd = mgrSeasonEnd;
    mgrSeasonEnd = function () {
      var before = S && S.m && S.m.seasons ? S.m.seasons.length : 0;
      var result = originalSeasonEnd.apply(this, arguments);
      if (S && S.m && S.m.seasons && S.m.seasons.length > before) capture(rememberSeason);
      return result;
    };
  }
})(typeof window !== "undefined" ? window : this);
