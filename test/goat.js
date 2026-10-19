const assert = require("assert");

(async function () {
  const {default: worker, calculateGoatScore, validateEntry} = await import("../goat-ladder/worker.mjs");
  const player = {
    event_key: "career-1:23:match", game_mode: "player", event_type: "match",
    display_name: "Legend", title: "Hat-trick in the final", club_name: "Example FC",
    competition_name: "Champions Cup", opponent_name: "Rivals FC", season: 2031,
    goals: 3, assists: 1, match_rating: 10, minutes_played: 90, key_passes: null,
    possession: null, xg: null, decisive_goal_minute: 89, own_score: 4, opponent_score: 3,
    halftime_own_score: 0, halftime_opponent_score: 3, opponent_strength: 90,
    team_strength: 65, importance: 3, is_final: true
  };
  const validPlayer = validateEntry(player);
  const playerScore = calculateGoatScore(validPlayer);
  assert(validPlayer.comeback);
  assert(playerScore.score > 700 && playerScore.score <= 1000);
  assert.strictEqual(playerScore.breakdown.rating, 250);
  assert.throws(() => validateEntry({...player, match_rating: 11}), /Invalid numeric field/);
  assert.throws(() => validateEntry({...player, display_name: ""}), /Invalid display_name/);
  assert.throws(() => validateEntry({...player, game_mode: "coach"}), /Invalid game_mode/);

  const season = validateEntry({
    event_key: "career-2:season:2031", game_mode: "manager", event_type: "season",
    display_name: "Coach", title: "Unbeaten season", club_name: "Underdog FC",
    competition_name: "League", season: 2031, goals_for: 60, goals_against: 18,
    halftime_own_score: 0, halftime_opponent_score: 0, importance: 2, is_final: false,
    wins: 30, draws: 8, losses: 0, goal_difference: 42, league_position: 1,
    division_depth: 4, team_strength: 48, trophies_count: 2
  });
  const seasonScore = calculateGoatScore(season);
  assert(seasonScore.score <= 1000 && seasonScore.score > 700);
  assert.strictEqual(seasonScore.breakdown.champions, 180);
  assert.throws(() => validateEntry({
    ...season, wins: 0, draws: 0, losses: 0
  }), /at least one match/);

  let inserted = false, deleted = false, listFiltered = false;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            all: async () => {
              if (sql.includes("datetime('now', '-30 days')")) {
                assert(sql.includes("WHERE game_mode = ?"));
                assert.deepStrictEqual(values, ["manager"]);
                listFiltered = true;
              }
              return {results: []};
            },
            run: async () => {
              assert(sql.includes("INSERT OR IGNORE") || sql.includes("DELETE FROM"));
              if (sql.includes("INSERT OR IGNORE")) {
                assert.strictEqual(values.length, 40);
                inserted = true;
                return {meta: {changes: 1}};
              }
              deleted = true;
              return {meta: {changes: 1}};
            }
          };
        }
      };
    }
  };
  const env = {GOAT_DB: db, ALLOWED_ORIGINS: "https://futbolroadtolegend.com"};
  const listRequest = new Request(
    "https://api.example/api/goat-ladder?mode=manager&timeframe=30d",
    {headers: {Origin: "https://futbolroadtolegend.com"}}
  );
  assert.strictEqual(new URL(listRequest.url).searchParams.get("timeframe"), "30d");
  const list = await worker.fetch(listRequest, env);
  assert.strictEqual(list.status, 200);
  assert(listFiltered);

  const post = await worker.fetch(new Request("https://api.example/api/goat-ladder", {
    method: "POST", headers: {
      Origin: "https://futbolroadtolegend.com", "Content-Type": "application/json"
    }, body: JSON.stringify(player)
  }), env);
  assert.strictEqual(post.status, 201);
  const created = await post.json();
  assert(inserted);
  assert.match(created.delete_token, /^[0-9a-f]{64}$/);

  const limited = await worker.fetch(new Request("https://api.example/api/goat-ladder", {
    method: "POST", headers: {
      Origin: "https://futbolroadtolegend.com", "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.5"
    }, body: JSON.stringify(player)
  }), {...env, GOAT_SUBMIT_LIMITER: {limit: async ({key}) => {
    assert.strictEqual(key, "192.0.2.5");
    return {success: false};
  }}});
  assert.strictEqual(limited.status, 429);

  const denied = await worker.fetch(new Request("https://api.example/api/goat-ladder", {
    headers: {Origin: "https://bad.example"}
  }), env);
  assert.strictEqual(denied.status, 403);

  const deletion = await worker.fetch(new Request("https://api.example/api/goat-ladder?id=" + created.id, {
    method: "DELETE",
    headers: {Origin: "https://futbolroadtolegend.com", Authorization: "Bearer " + created.delete_token}
  }), env);
  assert.strictEqual(deletion.status, 200);
  assert(deleted);

  const preflight = await worker.fetch(new Request("https://api.example/api/goat-ladder", {
    method: "OPTIONS", headers: {Origin: "https://futbolroadtolegend.com"}
  }), env);
  assert.strictEqual(preflight.status, 204);
  assert.strictEqual(preflight.headers.get("Access-Control-Allow-Methods"), "GET, POST, DELETE, OPTIONS");
  console.log("GOAT LADDER validation, scoring, CORS and endpoints passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
