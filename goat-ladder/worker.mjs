const API_PATH = "/api/goat-ladder";
const MAX_BODY_BYTES = 12000;
const MAX_NAME_LENGTH = 32;
const MAX_TITLE_LENGTH = 64;

function boundedNumber(value, min, max, fallback) {
  if (value == null) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error("Invalid numeric field");
  }
  return number;
}

function boundedInteger(value, min, max, fallback) {
  const number = boundedNumber(value, min, max, fallback);
  if (number != null && !Number.isInteger(number)) throw new Error("Expected integer field");
  return number;
}

function text(value, field, maxLength, required) {
  if (typeof value !== "string") {
    if (required) throw new Error("Missing " + field);
    return null;
  }
  const result = value.trim();
  if ((!result && required) || result.length > maxLength || /[\u0000-\u001f\u007f]/.test(result)) {
    throw new Error("Invalid " + field);
  }
  return result || null;
}

function boolean(value, field) {
  if (typeof value !== "boolean") throw new Error("Invalid " + field);
  return value;
}

export function validateEntry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid request body");
  if (input.game_mode !== "player" && input.game_mode !== "manager") throw new Error("Invalid game_mode");
  if (input.event_type !== "match" && input.event_type !== "season") throw new Error("Invalid event_type");

  const entry = {
    event_key: text(input.event_key, "event_key", 128, true),
    game_mode: input.game_mode,
    event_type: input.event_type,
    display_name: text(input.display_name, "display_name", MAX_NAME_LENGTH, true),
    title: text(input.title, "title", MAX_TITLE_LENGTH, true),
    club_name: text(input.club_name, "club_name", 64, true),
    competition_name: text(input.competition_name, "competition_name", 64, true),
    opponent_name: text(input.opponent_name, "opponent_name", 64, false),
    season: boundedInteger(input.season, 1900, 2200, null),
    goals: boundedInteger(input.goals, 0, 30, null),
    assists: boundedInteger(input.assists, 0, 30, null),
    match_rating: boundedNumber(input.match_rating, 1, 10, null),
    minutes_played: boundedInteger(input.minutes_played, 0, 130, null),
    key_passes: boundedInteger(input.key_passes, 0, 100, null),
    possession: boundedNumber(input.possession, 0, 100, null),
    xg: boundedNumber(input.xg, 0, 30, null),
    decisive_goal_minute: boundedInteger(input.decisive_goal_minute, 1, 130, null),
    own_score: boundedInteger(input.own_score, 0, 30, null),
    opponent_score: boundedInteger(input.opponent_score, 0, 30, null),
    goals_for: boundedInteger(input.goals_for, 0, 1000, null),
    goals_against: boundedInteger(input.goals_against, 0, 1000, null),
    halftime_own_score: boundedInteger(input.halftime_own_score, 0, 30, 0),
    halftime_opponent_score: boundedInteger(input.halftime_opponent_score, 0, 30, 0),
    opponent_strength: boundedInteger(input.opponent_strength, 30, 99, null),
    team_strength: boundedInteger(input.team_strength, 30, 99, null),
    importance: boundedInteger(input.importance, 0, 3, 0),
    is_final: boolean(input.is_final, "is_final"),
    wins: boundedInteger(input.wins, 0, 100, null),
    draws: boundedInteger(input.draws, 0, 100, null),
    losses: boundedInteger(input.losses, 0, 100, null),
    goal_difference: boundedInteger(input.goal_difference, -1000, 1000, 0),
    league_position: boundedInteger(input.league_position, 1, 100, null),
    division_depth: boundedInteger(input.division_depth, 1, 10, 1),
    trophies_count: boundedInteger(input.trophies_count, 0, 30, 0)
  };
  if (entry.event_key.length < 8 || entry.display_name.length < 2) throw new Error("Alias and event key are too short");

  if (entry.event_type === "match") {
    if (entry.own_score == null || entry.opponent_score == null) throw new Error("Match score is required");
    if (entry.game_mode === "player" && (entry.minutes_played == null || entry.match_rating == null)) {
      throw new Error("Player minutes and rating are required");
    }
  } else if (entry.game_mode !== "manager" || entry.wins == null || entry.draws == null || entry.losses == null) {
    throw new Error("Season records require manager results");
  } else if (entry.wins + entry.draws + entry.losses < 1) {
    throw new Error("Season records require at least one match");
  }

  entry.is_win = entry.event_type === "match" && entry.own_score > entry.opponent_score;
  entry.comeback = entry.event_type === "match" &&
    entry.halftime_own_score < entry.halftime_opponent_score && entry.is_win;
  entry.metrics = {
    goals: entry.goals, assists: entry.assists, match_rating: entry.match_rating,
    minutes_played: entry.minutes_played, key_passes: entry.key_passes,
    possession: entry.possession, xg: entry.xg, decisive_goal_minute: entry.decisive_goal_minute,
    own_score: entry.own_score, opponent_score: entry.opponent_score,
    goals_for: entry.goals_for, goals_against: entry.goals_against,
    opponent_strength: entry.opponent_strength, team_strength: entry.team_strength,
    importance: entry.importance, is_final: entry.is_final, is_win: entry.is_win,
    comeback: entry.comeback, wins: entry.wins, draws: entry.draws, losses: entry.losses,
    goal_difference: entry.goal_difference, league_position: entry.league_position,
    division_depth: entry.division_depth, trophies_count: entry.trophies_count
  };
  return entry;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function calculateGoatScore(entry) {
  const breakdown = {};
  if (entry.event_type === "season") {
    const played = entry.wins + entry.draws + entry.losses;
    const winRate = played ? entry.wins / played : 0;
    const goalDifference = (entry.goal_difference || 0) / played;
    breakdown.results = Math.round(winRate * 300);
    breakdown.unbeaten = entry.losses === 0 ? 120 : 0;
    breakdown.underdog = clamp(
      Math.round(150 + (65 - (entry.team_strength || 65)) * 1.8 + ((entry.division_depth || 1) - 1) * 20),
      0, 250
    );
    breakdown.goal_difference = Math.round(clamp(goalDifference * 20, 0, 100));
    breakdown.trophies = Math.min(240, entry.trophies_count * 80);
    breakdown.champions = entry.league_position === 1 ? 180 : 0;
  } else {
    const won = entry.is_win;
    const drew = entry.own_score === entry.opponent_score;
    const difficulty = entry.opponent_strength == null || entry.team_strength == null
      ? 75
      : clamp(Math.round(75 + (entry.opponent_strength - entry.team_strength) * 2.5), 0, 150);
    const finalWon = entry.is_final && won;
    if (entry.game_mode === "player") {
      breakdown.rating = Math.round(((entry.match_rating - 1) / 9) * 250);
      breakdown.contribution = Math.min(150, (entry.goals || 0) * 30 + (entry.assists || 0) * 18);
      breakdown.minutes = Math.round(Math.sqrt((entry.minutes_played || 0) / 90) * 100);
    } else {
      const margin = entry.own_score - entry.opponent_score;
      breakdown.result = won ? 220 : drew ? 120 : 0;
      breakdown.margin = Math.round(clamp(margin * 12, 0, 60));
      breakdown.clean_sheet = won && entry.opponent_score === 0 ? 25 : 0;
      breakdown.minutes = 100;
    }
    breakdown.opponent = difficulty;
    breakdown.importance = Math.min(200, entry.importance * 50 + (entry.is_final ? 50 : 0));
    breakdown.moment = (entry.comeback ? 40 : 0) + (finalWon ? 70 : 0) +
      (won && entry.decisive_goal_minute >= 85 ? 20 : 0);
    breakdown.outcome = won ? 50 : drew ? 20 : 0;
  }
  const score = clamp(Object.keys(breakdown).reduce((total, key) => total + breakdown[key], 0), 0, 1000);
  return { score, breakdown };
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return { "Vary": "Origin" };
  const configured = (env.ALLOWED_ORIGINS || "https://futbolroadtolegend.com,https://thecharlie00.github.io")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (configured.indexOf(origin) === -1) return null;
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
}

function response(request, env, data, status) {
  const headers = corsHeaders(request, env);
  if (!headers) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin" } });
  headers["Content-Type"] = "application/json; charset=utf-8";
  headers["Cache-Control"] = "no-store";
  return new Response(JSON.stringify(data), { status, headers });
}

async function readEntry(request) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new Error("Request body too large");
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) throw new Error("Request body too large");
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}

async function tokenHash(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function timeframeClause(timeframe) {
  if (timeframe === "7d") return " AND created_at >= datetime('now', '-7 days')";
  if (timeframe === "30d") return " AND created_at >= datetime('now', '-30 days')";
  if (timeframe === "all-time") return "";
  throw new Error("Invalid timeframe");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== API_PATH) return new Response("Not found", { status: 404 });
    if (request.method === "OPTIONS") {
      const headers = corsHeaders(request, env);
      if (!headers) return response(request, env, { error: "Origin not allowed" }, 403);
      return new Response(null, { status: 204, headers });
    }
    if (request.method === "DELETE") {
      if (!env.GOAT_DB) return response(request, env, { error: "Ranking storage is not configured" }, 503);
      const id = url.searchParams.get("id") || "";
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/i.test(token)) {
        return response(request, env, { error: "Invalid deletion credentials" }, 400);
      }
      const result = await env.GOAT_DB.prepare(
        "DELETE FROM goat_ladder_entries WHERE id = ? AND delete_token_hash = ?"
      ).bind(id, await tokenHash(token)).run();
      if (!result.meta || !result.meta.changes) return response(request, env, { error: "Entry not found or deletion token invalid" }, 404);
      return response(request, env, { deleted: true }, 200);
    }
    if (request.method === "GET") {
      if (!env.GOAT_DB) return response(request, env, { error: "Ranking storage is not configured" }, 503);
      if (env.GOAT_READ_LIMITER) {
        const limit = await env.GOAT_READ_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
        if (!limit.success) return response(request, env, { error: "Too many ranking requests" }, 429);
      }
      const mode = url.searchParams.get("mode") || "player";
      const timeframe = url.searchParams.get("timeframe") || "all-time";
      if (mode !== "player" && mode !== "manager") return response(request, env, { error: "Invalid mode" }, 400);
      let period;
      try {
        period = timeframeClause(timeframe);
      } catch (error) {
        return response(request, env, { error: error.message }, 400);
      }
      const result = await env.GOAT_DB.prepare(
        "SELECT id, game_mode, event_type, display_name, title, club_name, competition_name, opponent_name, season, " +
        "created_at, goat_score, score_breakdown_json, metrics_json FROM goat_ladder_entries " +
        "WHERE game_mode = ?" + period + " ORDER BY goat_score DESC, created_at ASC LIMIT 50"
      ).bind(mode).all();
      return response(request, env, { entries: (result.results || []).map(row => ({
        id: row.id, game_mode: row.game_mode, event_type: row.event_type, display_name: row.display_name,
        title: row.title, club_name: row.club_name, competition_name: row.competition_name,
        opponent_name: row.opponent_name, season: row.season, created_at: row.created_at,
        goat_score: row.goat_score, score_breakdown: JSON.parse(row.score_breakdown_json),
        metrics: JSON.parse(row.metrics_json), verification: "community-reported"
      })) }, 200);
    }
    if (request.method !== "POST") return response(request, env, { error: "Method not allowed" }, 405);
    if (!env.GOAT_DB) return response(request, env, { error: "Ranking storage is not configured" }, 503);
    if (env.GOAT_SUBMIT_LIMITER) {
      const limit = await env.GOAT_SUBMIT_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
      if (!limit.success) return response(request, env, { error: "Too many submission attempts" }, 429);
    }
    let entry;
    try {
      entry = validateEntry(await readEntry(request));
    } catch (error) {
      return response(request, env, { error: error.message }, 400);
    }
    const calculated = calculateGoatScore(entry);
    const id = crypto.randomUUID();
    const deleteToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(byte => byte.toString(16).padStart(2, "0")).join("");
    const createdAt = new Date().toISOString();
    const result = await env.GOAT_DB.prepare(
      "INSERT OR IGNORE INTO goat_ladder_entries " +
      "(id, event_key_hash, game_mode, event_type, display_name, title, club_name, competition_name, opponent_name, " +
      "season, created_at, goat_score, score_breakdown_json, metrics_json, delete_token_hash, goals, assists, match_rating, minutes_played, " +
      "key_passes, possession, xg, decisive_goal_minute, own_score, opponent_score, opponent_strength, team_strength, " +
      "importance, is_final, is_win, comeback, wins, draws, losses, goal_difference, league_position, trophies_count, " +
      "goals_for, goals_against, division_depth) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id, await tokenHash(entry.event_key), entry.game_mode, entry.event_type, entry.display_name, entry.title, entry.club_name,
      entry.competition_name, entry.opponent_name, entry.season, createdAt, calculated.score,
      JSON.stringify(calculated.breakdown), JSON.stringify(entry.metrics), await tokenHash(deleteToken), entry.goals, entry.assists,
      entry.match_rating, entry.minutes_played, entry.key_passes, entry.possession, entry.xg,
      entry.decisive_goal_minute, entry.own_score, entry.opponent_score, entry.opponent_strength,
      entry.team_strength, entry.importance, entry.is_final ? 1 : 0, entry.is_win ? 1 : 0,
      entry.comeback ? 1 : 0, entry.wins, entry.draws, entry.losses, entry.goal_difference,
      entry.league_position, entry.trophies_count, entry.goals_for, entry.goals_against, entry.division_depth
    ).run();
    if (!result.meta || !result.meta.changes) return response(request, env, { error: "This career record was already submitted" }, 409);
    return response(request, env, {
      id, goat_score: calculated.score, score_breakdown: calculated.breakdown,
      verification: "community-reported", delete_token: deleteToken
    }, 201);
  }
};
