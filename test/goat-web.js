/* Pruebas del tablero online GOAT LADDER (goat-ladder.js).
   Se ejecutan sin navegador:  node test/goat-web.js  */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
function check(name, fn) {
  try { fn(); console.log("  ok  " + name); }
  catch (error) { failures.push(name); console.log("  FAIL " + name + " · " + error.message); }
}

/* Entorno mínimo: solo las APIs que usa el módulo. */
function loadBoard(options = {}) {
  const store = {};
  const session = {};
  const calls = [];
  const doc = {
    readyState: "complete",
    body: {getAttribute: () => options.lang || "es", appendChild() {}},
    documentElement: {getAttribute: () => options.lang || "es"},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => ({setAttribute() {}, appendChild() {}, classList: {add() {}, remove() {}}, style: {}}),
    hidden: false
  };
  const window = {
    GOAT_API_URL: options.url === undefined ? "https://api.test" : options.url,
    location: {search: options.search || "", pathname: "/goat-ladder/", origin: "https://futbolroadtolegend.com"},
    navigator: {onLine: options.online !== false},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    sessionStorage: {
      getItem: (k) => (k in session ? session[k] : null),
      setItem: (k, v) => { session[k] = String(v); },
      removeItem: (k) => { delete session[k]; }
    },
    history: {replaceState() {}},
    document: doc,
    fetch: (url, init) => { calls.push({url, init}); return options.fetch(url, init, calls.length); },
    addEventListener() {},
    confirm: () => true,
    console
  };
  window.window = window;
  const sandbox = vm.createContext({
    window, document: doc, fetch: window.fetch, console, Promise, setTimeout, clearTimeout,
    AbortController, URL, TypeError, TextEncoder, JSON, Math, Date, Array, Object, String, Number, encodeURIComponent
  });
  sandbox.sessionStorage = window.sessionStorage;
  sandbox.localStorage = window.localStorage;
  sandbox.navigator = window.navigator;
  sandbox.location = window.location;
  sandbox.history = window.history;
  sandbox.GoatBoard = undefined;
  const source = readFileSync(join(root, "goat-ladder.js"), "utf8");
  vm.runInContext(source, sandbox, {filename: "goat-ladder.js"});
  return {board: sandbox.window.GoatBoard, calls, store, session, sandbox};
}

const json = (body, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body))
});

console.log("Normalización de la URL del servicio");
for (const [input, expected] of [
  ["https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev/", "https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev"],
  ["https://https://host.workers.dev/api", "https://host.workers.dev"],
  ["  https://host.workers.dev//  ", "https://host.workers.dev"],
  ["http://localhost:8787/", "http://localhost:8787"],
  ["https://host.workers.dev/api/v1/", "https://host.workers.dev/api/v1"],
  ["", ""],
  ["no-es-una-url", ""]
]) {
  check(`URL ${JSON.stringify(input)}`, () => {
    const {board} = loadBoard();
    assert.equal(board.normalizeOrigin(input), expected);
  });
}

console.log("Estado en la URL");
check("valores válidos se conservan", () => {
  const {board} = loadBoard();
  assert.deepEqual({...board.sanitizeState(board.readQuery("?board=achievements&mode=manager&period=7d&metric=wins&q=leire"))},
    {board: "achievements", mode: "manager", period: "7d", metric: "wins", search: "leire", entry: ""});
});
check("valores inválidos vuelven a los seguros", () => {
  const {board} = loadBoard();
  assert.deepEqual({...board.sanitizeState(board.readQuery("?board=hack&mode=otro&period=99d&metric=appearances"))},
    {board: "careers", mode: "player", period: "all-time", metric: "appearances", search: "", entry: ""});
});
check("una métrica de míster no se acepta en modo jugador", () => {
  const {board} = loadBoard();
  assert.equal(board.sanitizeState(board.readQuery("?mode=player&metric=wins")).metric, "appearances");
});
check("el modo míster conserva su métrica", () => {
  const {board} = loadBoard();
  assert.equal(board.sanitizeState(board.readQuery("?mode=manager&metric=win_percentage")).metric, "win_percentage");
});
check("los parámetros se decodifican", () => {
  const {board} = loadBoard();
  assert.equal(board.readQuery("?q=Real%20Sociedad").q, "Real Sociedad");
  assert.equal(board.readQuery("?q=a+b").q, "a b");
});
check("la búsqueda se limita en longitud", () => {
  const {board} = loadBoard();
  const long = "x".repeat(120);
  assert.equal(board.sanitizeState({q: long}).search.length, 40);
});

console.log("Rutas de la API");
check("carreras: modo, periodo y métrica", () => {
  const {board} = loadBoard();
  assert.equal(board.apiPath({board: "careers", mode: "manager", period: "30d", metric: "trophies"}),
    "/api/goat-ladder/careers?mode=manager&timeframe=30d&metric=trophies");
});
check("gestas: sin métrica", () => {
  const {board} = loadBoard();
  assert.equal(board.apiPath({board: "achievements", mode: "player", period: "all-time"}),
    "/api/goat-ladder?mode=player&timeframe=all-time");
});
check("la caché distingue modo, periodo y métrica", () => {
  const {board} = loadBoard();
  const a = board.cacheKey({board: "careers", mode: "player", period: "all-time", metric: "goals"});
  const b = board.cacheKey({board: "careers", mode: "player", period: "all-time", metric: "assists"});
  const c = board.cacheKey({board: "achievements", mode: "player", period: "all-time", metric: "assists"});
  assert.notEqual(a, b);
  assert.notEqual(b, c);
});

console.log("Clasificación de errores");
for (const [name, error, kind] of [
  ["corte de red (TypeError)", new TypeError("Failed to fetch"), "networkError"],
  ["corte de red (texto)", new Error("Load failed"), "networkError"],
  ["petición abortada", Object.assign(new Error("x"), {name: "AbortError"}), "timeoutError"],
  ["error 500", Object.assign(new Error("boom"), {status: 500}), "serverError"],
  ["error 429", Object.assign(new Error("slow"), {status: 429}), "serverError"],
  ["error ya clasificado", Object.assign(new Error("y"), {goatKind: "offlineError"}), "offlineError"]
]) {
  check(name + " → " + kind, () => {
    const {board} = loadBoard();
    assert.equal(board.classify(error), kind);
  });
}

console.log("Formato y agrupación");
check("timeAgo en segundos, minutos y horas", () => {
  const {board} = loadBoard();
  const now = 1_760_000_000_000;
  assert.equal(board.timeAgo(now - 5_000, now), "now");
  assert.equal(board.timeAgo(now - 5 * 60_000, now), "m5");
  assert.equal(board.timeAgo(now - 3 * 3_600_000, now), "h3");
});
check("los títulos y premios se agrupan con su número", () => {
  const {board} = loadBoard();
  const history = [
    {trophies: ["Liga", "Copa"], awards: ["MVP"]},
    {trophies: ["Liga"], awards: ["MVP", "MVP"]},
    {trophies: [], awards: []}
  ];
  const trophies = board.groupHonours(history, "trophies");
  assert.equal(JSON.stringify(trophies.map((item) => [item.name, item.count])), JSON.stringify([["Liga", 2], ["Copa", 1]]));
  const awards = board.groupHonours(history, "awards");
  assert.equal(JSON.stringify(awards.map((item) => [item.name, item.count])), JSON.stringify([["MVP", 3]]));
});
check("la búsqueda mira alias, club y título", () => {
  const {board} = loadBoard();
  const entry = {display_name: "Leire", current_club: "Paris Saint-Germain", title: "Carrera de Jugador"};
  assert.equal(board.matchesSearch(entry, ""), true);
  assert.equal(board.matchesSearch(entry, "leire"), true);
  assert.equal(board.matchesSearch(entry, "saint"), true);
  assert.equal(board.matchesSearch(entry, "madrid"), false);
});
check("cada idioma tiene todas las claves del español", () => {
  const {board} = loadBoard();
  const base = Object.keys(board.TEXT.es).sort();
  for (const lang of Object.keys(board.TEXT)) {
    assert.deepEqual(Object.keys(board.TEXT[lang]).sort(), base, "faltan claves en " + lang);
  }
});
check("las métricas de cada modo existen en el texto", () => {
  const {board} = loadBoard();
  for (const mode of ["player", "manager"]) {
    for (const metric of board.METRICS[mode]) {
      assert.ok(board.TEXT.es[metric[1]], "sin texto para " + metric[1]);
    }
  }
});

console.log("Arranque y estados de la página");
async function boot() {
  const seen = {};
  const {board, calls, session} = loadBoard({fetch: () => json({metric: "appearances", entries: [
    {id: "a1", game_mode: "player", display_name: "Leire", title: "Carrera", current_club: "PSG",
      started_season: 2082, latest_season: 2100, metrics: {seasons: 18, goals: 698}, history: [{season: 2100, club: "PSG", competition: "Liga", trophies: ["Liga"], awards: []}]}
  ]})});
  board.setLang("es");
  await board.select({});
  seen.entries = board.entries().length;
  seen.calls = calls.length;
  seen.url = calls[0].url;
  check("arranque: pide el ranking y guarda las entradas", () => {
    assert.equal(seen.calls, 1);
    assert.match(seen.url, /^https:\/\/api\.test\/api\/goat-ladder\/careers\?mode=player&timeframe=all-time&metric=appearances$/);
    assert.equal(seen.entries, 1);
  });
  check("arranque: guarda la respuesta en caché de sesión", () => {
    assert.ok(Object.keys(session).some((key) => key.startsWith("camino.goatWeb.")));
  });
}

async function offline() {
  const {board} = loadBoard({url: "", fetch: () => json({entries: []})});
  await board.select({});
  await board.refresh();
  check("sin servicio configurado no se pide nada y se avisa", () => {
    assert.equal(board.entries().length, 0);
  });
}

async function retryOnNetwork() {
  const types = [];
  const {board} = loadBoard({fetch: (url, init, n) => {
    types.push(init.method);
    return n === 1 ? Promise.reject(new TypeError("Failed to fetch")) : json({entries: []});
  }});
  await board.select({});
  await board.refresh();
  check("la lectura reintenta una vez tras un corte de red", () => {
    assert.equal(types.length, 2);
  });
}

await boot();
await offline();
await retryOnNetwork();

console.log(failures.length ? `\n${failures.length} comprobaciones fallidas` : "\nTodo correcto");
process.exit(failures.length ? 1 : 0);
