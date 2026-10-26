const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

(async function () {
  let currentSheet = null, careerCalls = [], achievementCalls = [];
  const player = {
    id: "player-career", game_mode: "player", display_name: "Striker", title: "Legend",
    current_club: "Example FC", started_season: 2020, latest_season: 2021,
    metrics: {seasons: 2, appearances: 80, goals: 45, assists: 20, clean_sheets: 0,
      trophies: 1, awards: 1, international_caps: 8, international_goals: 3, clubs: 1},
    history: [
      {season: 2020, club: "Example FC", competition: "League", appearances: 40, goals: 20,
        assists: 9, trophies: ["Cup"], awards: ["Young player"]},
      {season: 2021, club: "Example FC", competition: "League", appearances: 40, goals: 25,
        assists: 11, trophies: ["League"], awards: ["Best player"]}
    ]
  };
  const manager = {
    id: "manager-career", game_mode: "manager", display_name: "Coach", title: "Undefeated",
    current_club: "Example United", started_season: 2021, latest_season: 2021,
    metrics: {seasons: 1, wins: 20, draws: 5, losses: 0, trophies: 1,
      unbeaten_seasons: 1, promotions: 0, clubs: 1, win_percentage: 80},
    history: [{season: 2021, club: "Example United", competition: "League", wins: 20,
      draws: 5, losses: 0, goals_for: 50, goals_against: 10, trophies: ["League"]}]
  };
  const service = {
    available: () => true,
    latest: () => null,
    canDelete: () => false,
    t: key => key,
    listCareers: (mode, timeframe, metric) => {
      careerCalls.push({mode, timeframe, metric});
      return Promise.resolve(mode === "player" ? [player] : [manager]);
    },
    list: (mode, timeframe) => {
      achievementCalls.push({mode, timeframe});
      return Promise.resolve([]);
    }
  };
  const UIX = {
    actions: {}, sheets: {}, hk: {}, add: () => {},
    getSheet: () => currentSheet,
    setSheet: sheet => { currentSheet = sheet; window.__goatSheet = sheet; },
    renderSheet: () => {}
  };
  const window = {GOAT_TEXT: {es: {}}, GoatLadder: service, GOAT_WEB_BUILD: false, UIX};
  const document = {addEventListener: () => {}};
  const pxCtx = {console};
  vm.runInNewContext(fs.readFileSync("src/pixel.js", "utf8"), pxCtx);
  window.PX = pxCtx.PX;
  vm.runInNewContext(fs.readFileSync("src/ui-goat.js", "utf8"), {window, document, console});
  assert.strictEqual(window.GOAT_FEM_TEXT.es.player, "Jugadora");
  assert.strictEqual(window.GOAT_FEM_TEXT.es.careerTitleManager, "Carrera de Entrenadora");
  assert.strictEqual(window.GOAT_FEM_TEXT.it.manager, "Allenatrice");
  assert.strictEqual(window.GOAT_FEM_TEXT.fr.careerTitlePlayer, "Carrière de joueuse");

  UIX.actions.goat();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(currentSheet.board, "careers");
  assert.deepStrictEqual(careerCalls[0], {mode: "player", timeframe: "all-time", metric: "appearances"});
  let html = UIX.sheets.goat(currentSheet);
  assert(html.includes("Striker"));
  assert(html.includes("careerHistory"));
  assert(html.includes("goat-honours") && html.includes("honoursTeam") && html.includes("honoursInd"), "palmarés con títulos colectivos e individuales");
  assert(/<svg class="tro px"/.test(html), "icono pixelado del trofeo");
  assert(!html.includes(">empty<"));

  UIX.actions.goatmode(null, "manager");
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(careerCalls[1].mode, "manager");
  html = UIX.sheets.goat(currentSheet);
  assert(html.includes("Coach"));
  assert(html.includes("Example United"));
  assert(html.includes("20-5-0"));

  UIX.actions.goatboard(null, "achievements");
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(achievementCalls.length, 1);
  html = UIX.sheets.goat(currentSheet);
  assert(html.includes(">empty<"));
  assert(!html.includes("emptyCareers"));
  console.log("GOAT LADDER app UI shows shared player/manager careers and separate achievements");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
