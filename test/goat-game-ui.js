/* Pruebas de la ficha del ranking dentro del juego (legacy-game/src/ui-goat.js):
   buscador, compartir, alias recordado y reintentos.
   Se ejecutan sin navegador:  node test/goat-game-ui.js  */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "legacy-game", "src", "ui-goat.js"), "utf8");
const failures = [];
function check(name, fn) {
  try { fn(); console.log("  ok  " + name); }
  catch (error) { failures.push(name); console.log("  FAIL " + name + " · " + error.message); }
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

const ENTRIES = [
  {id: "c1", game_mode: "player", display_name: "Leire", title: "Carrera de Jugadora", current_club: "PSG",
    started_season: 2082, latest_season: 2100,
    metrics: {seasons: 18, appearances: 794, goals: 698, assists: 157, trophies: 16, awards: 125},
    history: [{season: 2100, club: "PSG", competition: "Liga", trophies: ["Liga"], awards: ["MVP"], appearances: 38, goals: 32, assists: 9}]},
  {id: "c2", game_mode: "player", display_name: "Epi", title: "Carrera de Jugador", current_club: "Real Sociedad",
    started_season: 2026, latest_season: 2043, metrics: {seasons: 18, appearances: 874, goals: 569}, history: []}
];

function build(options = {}) {
  const store = {};
  const copied = [];
  const listeners = {};
  const elements = [];
  const document = {
    body: {appendChild(el) { elements.push(el); }},
    getElementById: (id) => elements.find((el) => el.id === id) || null,
    createElement: () => ({id: "", className: "", textContent: "", style: {}, setAttribute() {}}),
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); }
  };
  const UIX = {
    actions: {}, sheets: {}, pend: {}, slots: {}, hk: {}, sheet: null,
    getSheet() { return UIX.sheet; },
    setSheet(sheet) { UIX.sheet = sheet; window.__goatSheet = sheet; },
    renderSheet() { UIX.renders++; },
    renders: 0
  };
  const career = {event_key: "career:1", game_mode: "player", title: "Carrera de Jugadora",
    current_club: "PSG", started_season: 2082, latest_season: 2100, metrics: {seasons: 18}, history: []};
  const calls = {list: 0, listCareers: 0};
  let submitResult = () => Promise.reject(new Error("Sin conexión con el ranking."));
  const service = {
    available: () => options.available !== false,
    career: () => career,
    latest: () => ({event_key: "m:1", title: "Gesta", club_name: "PSG", competition_name: "Liga",
      game_mode: "player", event_type: "match"}),
    list: () => { calls.list++; return Promise.resolve(ENTRIES); },
    listCareers: () => { calls.listCareers++; return Promise.resolve(options.entries || ENTRIES); },
    canDelete: () => false,
    /* se resuelve contra la tabla real que define el propio módulo */
    t: (key, params) => {
      const table = (window.GOAT_TEXT && window.GOAT_TEXT.es) || {};
      let value = table[key] || key;
      if (params) value = value.replace(/\{(\w+)\}/g, (m, k) => (params[k] == null ? m : String(params[k])));
      return value;
    },
    submit: (...args) => submitResult(...args),
    submitCareer: (...args) => submitResult(...args),
    deleteEntry: () => Promise.resolve({}),
    deleteCareer: () => Promise.resolve({})
  };
  const window = {
    UIX, GoatLadder: service, GOAT_WEB_BUILD: true, GOAT_WEB_URL: "",
    AndroidBridge: undefined,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); }
    },
    navigator: {clipboard: {writeText: (v) => { copied.push(v); return Promise.resolve(); }}},
    confirm: () => true,
    document
  };
  window.window = window;
  Object.assign(window, {
    addEventListener() {}, setTimeout, clearTimeout, Promise, console, JSON, Math, Date, String, Number,
    Array, Object, encodeURIComponent, document
  });
  const sandbox = vm.createContext(window);
  vm.runInContext(source, sandbox, {filename: "ui-goat.js"});
  return {UIX, service, window, document, copied, store, listeners, elements, calls,
    setSubmit(fn) { submitResult = fn; }};
}

function panel(values = {}) {
  const fields = {alias: "Leire", title: "Carrera de Jugadora", consent: true, ...values};
  return {
    closest: () => panel(values),
    querySelector(selector) {
      if (selector.includes("consent")) return {checked: !!fields.consent};
      if (selector.includes("alias")) return {value: fields.alias};
      if (selector.includes("title")) return {value: fields.title};
      return null;
    }
  };
}

async function main() {
  console.log("Ficha del ranking en el juego");
  {
    const env = build();
    const sheet = {k: "goat", board: "careers", mode: "player", timeframe: "all-time", metric: "appearances",
      entries: [], loading: false, error: ""};
    env.UIX.setSheet(sheet);
    env.UIX.actions.goatrefresh();
    await tick();
    const html = env.UIX.sheets.goat(sheet);
    check("pinta las carreras con su buscador", () => {
      assert.match(html, /Leire/);
      assert.match(html, /data-goat-q/);
      assert.match(html, /goat-search/);
    });
    check("cada entrada ofrece compartir", () => {
      assert.match(html, /data-a="goatshare"/);
    });
    check("en la web ofrece abrir el ranking completo", () => {
      assert.match(html, /goat-ladder\//);
      assert.match(html, /target="_top"/);
    });
  }

  console.log("Buscador");
  {
    const env = build();
    const sheet = {k: "goat", board: "careers", mode: "player", timeframe: "all-time", metric: "appearances",
      entries: ENTRIES, loading: false, error: ""};
    env.UIX.setSheet(sheet);
    const change = env.listeners.change[0];
    change({target: {matches: (s) => s === "[data-goat-q]", value: "sociedad"}});
    check("el buscador filtra las entradas sin red", () => {
      const html = env.UIX.sheets.goat(sheet);
      assert.doesNotMatch(html, /Leire/);
      assert.match(html, /Epi/);
    });
    change({target: {matches: (s) => s === "[data-goat-q]", value: "zzz"}});
    check("avisa cuando no hay resultados", () => {
      assert.match(env.UIX.sheets.goat(sheet), /zzz/);
    });
  }

  console.log("Compartir");
  {
    const env = build();
    env.UIX.actions.goatshare(null, "c1");
    await tick();
    check("copia el enlace público de la entrada", () => {
      assert.equal(env.copied[0], "https://futbolroadtolegend.com/goat-ladder/?entry=c1");
    });
    check("avisa de que el enlace está copiado", () => {
      const toast = env.elements.find((el) => el.id === "goat-toast");
      assert.ok(toast, "no se creó el aviso");
      assert.match(toast.textContent, /Enlace copiado/);
    });
  }

  console.log("Publicar y alias recordado");
  {
    const env = build();
    env.setSubmit(() => Promise.resolve({id: "x", delete_token: "t", delete_token_saved: true, goat_score: 10}));
    const sheet = {k: "goat", board: "achievements", mode: "player", timeframe: "all-time",
      metric: "appearances", entries: [], loading: false, error: ""};
    env.UIX.setSheet(sheet);
    const originalError = console.error;
    console.error = () => {};
    env.UIX.actions.goatsubmit(panel());
    await tick();
    console.error = originalError;
    check("tras publicar se recuerda el alias", () => {
      assert.equal(env.store["camino.goat.alias"], "Leire");
      assert.equal(sheet.submitFailed, false);
    });
    const html = env.UIX.sheets.goat(sheet);
    check("el alias aparece ya rellenado la próxima vez", () => {
      assert.match(html, /value="Leire"/);
      assert.match(html, /Alias recordado/);
    });
  }

  console.log("Errores de publicación");
  {
    const env = build();
    const sheet = {k: "goat", board: "achievements", mode: "player", timeframe: "all-time",
      metric: "appearances", entries: [], loading: false, error: ""};
    env.UIX.setSheet(sheet);
    const originalError = console.error;
    console.error = () => {};
    env.UIX.actions.goatsubmit(panel());
    await tick();
    console.error = originalError;
    check("un fallo muestra el motivo y ofrece reintentar", () => {
      assert.equal(sheet.submitFailed, true);
      assert.match(sheet.submitError, /Sin conexión/);
      assert.match(env.UIX.sheets.goat(sheet), /Reintentar envío/);
    });
  }

  console.log("Cambios de filtro");
  {
    const env = build();
    const sheet = {k: "goat", board: "careers", mode: "player", timeframe: "all-time",
      metric: "appearances", entries: ENTRIES.slice(), loading: false, error: ""};
    env.UIX.setSheet(sheet);
    env.UIX.actions.goatmode(null, "manager");
    check("cambiar de modo no reutiliza las filas anteriores", () => {
      assert.deepEqual([...sheet.entries], []);
      assert.equal(sheet.mode, "manager");
      assert.equal(sheet.metric, "wins");
    });
    const before = env.calls.listCareers;
    env.UIX.actions.goatmode(null, "manager");
    check("repetir el mismo modo no recarga", () => {
      assert.equal(env.calls.listCareers, before);
    });
    env.listeners.change[0]({target: {matches: (sel) => sel === "[data-goat-metric]", value: "trophies"}});
    check("cambiar la métrica sí recarga", () => {
      assert.equal(env.calls.listCareers, before + 1);
      assert.equal(sheet.metric, "trophies");
    });
  }

  console.log("Ranking no configurado");
  {
    const env = build({available: false});
    const sheet = {k: "goat", board: "careers", mode: "player", timeframe: "all-time",
      metric: "appearances", entries: [], loading: false, error: ""};
    env.UIX.setSheet(sheet);
    const html = env.UIX.sheets.goat(sheet);
    check("avisa sin romper la ficha", () => {
      assert.match(html, /no está configurado/);
      assert.doesNotMatch(html, /data-a="goatshare"/);
    });
  }
}

main().then(() => {
  console.log(failures.length ? `\n${failures.length} comprobaciones fallidas` : "\nTodo correcto");
  process.exit(failures.length ? 1 : 0);
});
