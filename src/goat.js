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
    if (event === "season") {
      if (blog.pos === 1) return "Campeones de " + competition;
      if (blog.l === 0) return "Temporada invicta";
      return "Temporada histórica en " + competition;
    }
    if (mode === "player" && (blog.g || 0) >= 3) return "Hat-trick en " + competition;
    if (comeback) return "La remontada ante " + opponent;
    if (isFinal && blog.gu > blog.gt) return "La final de " + competition;
    if (mode === "manager" && blog.gu > blog.gt && blog.gu - blog.gt === 1) return "Victoria ante " + opponent;
    return "Actuación ante " + opponent;
  }
  function depthOfLeague(index) {
    var depth = 1, current = index;
    while (W.lg[current] && W.lg[current].upI >= 0 && depth < 10) {
      current = W.lg[current].upI;
      depth++;
    }
    return depth;
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
    canDelete: function (id) { return !!(memoryDeleteTokens[id] || storedDeleteTokens()[id]); },
    t: function (key) {
      var language = typeof LANG === "string" ? LANG : "es";
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
    deleteEntry: function (id) {
      var token = memoryDeleteTokens[id] || storedDeleteTokens()[id];
      if (!apiOrigin || !token) return Promise.reject(new Error("No deletion token is available on this device"));
      return request("/api/goat-ladder?id=" + encodeURIComponent(id), {
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
