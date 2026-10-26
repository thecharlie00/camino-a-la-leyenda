const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

(async function () {
  const {default: worker, calculateGoatScore, validateEntry, validateCareerEntry} = await import("../goat-ladder/worker.mjs");
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

  const career = {
    event_key: "career:unique-save-id", game_mode: "player", display_name: "Striker",
    title: "Complete career", current_club: "Example FC", started_season: 2030, latest_season: 2031,
    metrics: {seasons: 2, appearances: 80, goals: 45, assists: 20, clean_sheets: 0,
      trophies: 3, awards: 2, international_caps: 8, international_goals: 3, clubs: 2},
    history: [
      {season: 2030, club: "Old FC", clubs: ["Old FC"], competition: "League A", trophies: ["Cup"],
        awards: ["Young player"], appearances: 40, goals: 20, assists: 9, clean_sheets: 0,
        rating: 7.2, overall: 76, international_caps: 4, international_goals: 1},
      {season: 2031, club: "Example FC", clubs: ["Example FC"], competition: "League B", trophies: ["League", "Cup"],
        awards: ["Best player"], appearances: 40, goals: 25, assists: 11, clean_sheets: 0,
        rating: 8.1, overall: 83, international_caps: 4, international_goals: 2}
    ]
  };
  const validCareer = validateCareerEntry(career);
  assert.strictEqual(validCareer.history.length, 2);
  assert.throws(() => validateCareerEntry({...career, metrics: {...career.metrics, seasons: 3}}), /every season/);
  assert.throws(() => validateCareerEntry({...career, metrics: {...career.metrics, goals: 46}}), /does not match history/);
  assert.throws(() => validateCareerEntry({...career, history: career.history.map(row => ({...row, rating: 11}))}), /Invalid numeric field/);
  const managerCareer = validateCareerEntry({
    event_key: "manager-career:save-1", game_mode: "manager", display_name: "Coach",
    title: "Manager career", current_club: "Same FC", started_season: 2030, latest_season: 2031,
    metrics: {seasons: 2, wins: 20, draws: 5, losses: 5, trophies: 1,
      unbeaten_seasons: 1, promotions: 1, clubs: 1, win_percentage: 67},
    history: [
      {season: 2030, club: "Same FC", competition: "League 2", trophies: [], awards: [], wins: 12,
        draws: 5, losses: 0, goals_for: 38, goals_against: 12, position: 1, promoted: true},
      {season: 2031, club: "Same FC", competition: "League 1", trophies: ["League"], awards: [], wins: 8,
        draws: 0, losses: 5, goals_for: 25, goals_against: 19, position: 8, promoted: false}
    ]
  });
  assert.strictEqual(managerCareer.metrics.win_percentage, 67);

  const gameContext = {
    GOAT_API_URL: "",
    GOAT_TEXT: {es: {careerTitlePlayer: "Carrera de Jugador", careerTitleManager: "Carrera de Míster", player: "Jugador", manager: "Míster"}},
    GOAT_FEM_TEXT: {es: {careerTitlePlayer: "Carrera de Jugadora", careerTitleManager: "Carrera de Entrenadora", player: "Jugadora", manager: "Entrenadora"}},
    LANG: "es",
    W: {lg: [{n: "League 2", upI: 1}, {n: "League 1", upI: -1}]},
    clubName: id => "Club " + id,
    console
  };
  vm.runInNewContext(fs.readFileSync("src/goat.js", "utf8"), gameContext);
  gameContext.S = {
    uid: "player-save-unique", mode: "player", yr: 2031, ph: "ret", cl: {},
    p: {club: 2, seasons: career.history.map((row, index) => ({
      y: row.season, club: index + 1, clubs: [index + 1], lg: 0,
      tro: row.trophies, aw: row.awards, apps: row.appearances, g: row.goals, a: row.assists,
      cs: row.clean_sheets, rt: row.rating, ovr1: row.overall, caps: row.international_caps, ig: row.international_goals
    })), ss: null}
  };
  const playerSnapshot = gameContext.GoatLadder.career();
  assert.strictEqual(playerSnapshot.metrics.goals, 45);
  assert.strictEqual(playerSnapshot.title, "Carrera de Jugador");
  assert.strictEqual(gameContext.GoatLadder.t("player"), "Jugador");
  gameContext.FEM = true;
  assert.strictEqual(gameContext.GoatLadder.t("player"), "Jugadora");
  assert.strictEqual(gameContext.GoatLadder.t("manager"), "Entrenadora");
  assert.strictEqual(gameContext.GoatLadder.career().title, "Carrera de Jugadora");
  assert.strictEqual(validateCareerEntry({...playerSnapshot, display_name: "Player"}).history.length, 2);
  gameContext.S = {
    uid: "manager-save-unique", mode: "mgr", yr: 2031, ph: "ret", cl: {},
    m: {club: 1, seasons: managerCareer.history.map(row => ({
      y: row.season, club: 1, lg: row.season === 2030 ? 0 : 1, tro: row.trophies,
      w: row.wins, d: row.draws, l: row.losses, gf: row.goals_for, ga: row.goals_against, pos: row.position
    })), ss: null, awards: []}
  };
  const managerSnapshot = gameContext.GoatLadder.career();
  assert.strictEqual(managerSnapshot.metrics.promotions, 1);
  assert.strictEqual(managerSnapshot.title, "Carrera de Entrenadora");
  assert.strictEqual(validateCareerEntry({...managerSnapshot, display_name: "Manager"}).history.length, 2);

  let inserted = false, deleted = false, listFiltered = false, careerInserted = false, careerDeleted = false;
  let careerListFiltered = false;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            all: async () => {
              if (sql.includes("FROM goat_ladder_careers")) {
                assert(sql.includes("ORDER BY COALESCE(goals, -1) DESC"));
                assert.deepStrictEqual(values, ["player"]);
                careerListFiltered = true;
                return {results: [{
                  id: "career-row", game_mode: "player", display_name: "Striker", title: "Complete career",
                  current_club: "Example FC", started_season: 2030, latest_season: 2031, created_at: "2031-01-01",
                  metrics_json: JSON.stringify(validCareer.metrics), history_json: JSON.stringify(validCareer.history)
                }]};
              }
              if (sql.includes("datetime('now', '-30 days')")) {
                assert(sql.includes("WHERE game_mode = ?"));
                assert.deepStrictEqual(values, ["manager"]);
                listFiltered = true;
              }
              return {results: []};
            },
            run: async () => {
              assert(sql.includes("INSERT OR IGNORE") || sql.includes("INSERT INTO goat_ladder_careers") || sql.includes("DELETE FROM"));
              if (sql.includes("INSERT INTO goat_ladder_careers")) {
                assert(sql.includes("ON CONFLICT(career_key_hash) DO UPDATE"));
                assert.strictEqual(values.length, 28);
                careerInserted = true;
                return {meta: {changes: 1}};
              }
              if (sql.includes("DELETE FROM goat_ladder_careers")) {
                careerDeleted = true;
                return {meta: {changes: 1}};
              }
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

  const careerList = await worker.fetch(new Request(
    "https://api.example/api/goat-ladder/careers?mode=player&metric=goals",
    {headers: {Origin: "https://futbolroadtolegend.com"}}
  ), env);
  assert.strictEqual(careerList.status, 200);
  assert(careerListFiltered);
  const rankedCareers = await careerList.json();
  assert.strictEqual(rankedCareers.metric, "goals");
  assert.strictEqual(rankedCareers.entries[0].history.length, 2);

  const careerPost = await worker.fetch(new Request("https://api.example/api/goat-ladder/careers", {
    method: "POST", headers: {
      Origin: "https://futbolroadtolegend.com", "Content-Type": "application/json"
    }, body: JSON.stringify(career)
  }), env);
  assert.strictEqual(careerPost.status, 201);
  const savedCareer = await careerPost.json();
  assert(careerInserted);
  assert.match(savedCareer.delete_token, /^[0-9a-f]{64}$/);

  const invalidMetric = await worker.fetch(new Request(
    "https://api.example/api/goat-ladder/careers?mode=player&metric=title",
    {headers: {Origin: "https://futbolroadtolegend.com"}}
  ), env);
  assert.strictEqual(invalidMetric.status, 400);

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

  const careerDeletion = await worker.fetch(new Request(
    "https://api.example/api/goat-ladder/careers?id=" + savedCareer.id,
    {method: "DELETE", headers: {
      Origin: "https://futbolroadtolegend.com", Authorization: "Bearer " + savedCareer.delete_token
    }}
  ), env);
  assert.strictEqual(careerDeletion.status, 200);
  assert(careerDeleted);

  const preflight = await worker.fetch(new Request("https://api.example/api/goat-ladder", {
    method: "OPTIONS", headers: {Origin: "https://futbolroadtolegend.com"}
  }), env);
  assert.strictEqual(preflight.status, 204);
  assert.strictEqual(preflight.headers.get("Access-Control-Allow-Methods"), "GET, POST, DELETE, OPTIONS");
  console.log("GOAT LADDER validation, career rankings, scoring, CORS and endpoints passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
