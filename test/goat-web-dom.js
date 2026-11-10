/* Pruebas de la capa DOM del tablero online GOAT LADDER (goat-ladder.js):
   pintado de tarjetas, filtros, buscador, estados de error y enlaces compartidos.
   Se ejecutan sin navegador:  node test/goat-web-dom.js  */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "goat-ladder.js"), "utf8");
const failures = [];

function check(name, fn) {
  try { fn(); console.log("  ok  " + name); }
  catch (error) { failures.push(name); console.log("  FAIL " + name + " · " + error.message); }
}

/* ---------- DOM mínimo ---------- */
class El {
  constructor(tag, attrs) {
    this.tagName = tag;
    this.attrs = attrs || {};
    this.children = [];
    this.listeners = {};
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.disabled = false;
    this.className = "";
    this.classList = {add: (c) => { this.className += " " + c; }, remove: () => {}};
    this.style = {};
    this.parentNode = null;
  }
  getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; }
  hasAttribute(name) { return name in this.attrs; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type, event) { (this.listeners[type] || []).forEach((fn) => fn(event || {})); }
  closest(selector) {
    if (selector === "button") return this.tagName === "button" ? this : null;
    if (selector.startsWith("[data-")) {
      const name = selector.slice(1, -1);
      return this.hasAttribute(name) ? this : null;
    }
    return null;
  }
  querySelector(selector) {
    if (selector.startsWith("button[data-")) {
      const name = selector.slice(8, -1);
      return this.buttons.find((button) => button.hasAttribute(name)) || null;
    }
    return null;
  }
  querySelectorAll(selector) {
    if (selector.startsWith("button[data-")) return this.buttons || [];
    return [];
  }
  scrollIntoView() {}
}

function buildDom(options = {}) {
  const list = new El("div", {id: "goat-entries"});
  const status = new El("p", {id: "goat-status"});
  const retry = new El("button", {id: "goat-retry"});
  const metric = new El("select", {id: "goat-metric"});
  metric.parentNode = new El("label");
  const filters = new El("div", {class: "goat-filters"});
  const page = new El("body", {class: "goat-page"});
  const hero = new El("section", {class: "goat-hero"});
  const byId = {"goat-entries": list, "goat-status": status, "goat-retry": retry, "goat-metric": metric};

  const segments = ["board", "mode", "period"].map((kind) => {
    const segment = new El("div", {class: "goat-segment", "aria-label": kind});
    segment.buttons = (options[kind] || []).map((value) => new El("button", {["data-" + kind]: value}));
    return segment;
  });

  const document = {
    readyState: "complete",
    hidden: false,
    body: new El("body"),
    documentElement: {getAttribute: () => options.lang || "es"},
    getElementById: (id) => byId[id] || null,
    querySelector: (selector) => {
      if (selector === ".goat-page") return page;
      if (selector === ".goat-filters") return filters;
      if (selector === ".goat-hero") return hero;
      if (selector === ".goat-filters .goat-segment[aria-label]") return segments[0];
      return null;
    },
    querySelectorAll: (selector) => (selector === ".goat-filters .goat-segment" ? segments : []),
    createElement: (tag) => new El(tag),
    addEventListener() {}
  };
  document.body.getAttribute = () => options.lang || "es";
  return {document, list, status, retry, metric, filters, page, hero, segments, byId};
}

function boot(options = {}) {
  const dom = buildDom(options);
  const calls = [];
  const session = {};
  const window = {
    GOAT_API_URL: options.url === undefined ? "https://api.test" : options.url,
    location: {search: options.search || "", pathname: "/goat-ladder/", origin: "https://futbolroadtolegend.com"},
    navigator: {onLine: true, clipboard: {writeText: () => Promise.resolve()}},
    localStorage: {getItem: () => options.token || null, setItem() {}},
    sessionStorage: {getItem: (k) => session[k] || null, setItem: (k, v) => { session[k] = v; }, removeItem: (k) => { delete session[k]; }},
    history: {replaceState(state, title, url) { window.__url = url; }},
    document: dom.document,
    fetch: (url, init) => { calls.push({url, init}); return options.fetch(url, init, calls.length); },
    addEventListener(type, fn) { (window.__listeners = window.__listeners || {})[type] = fn; },
    confirm: () => true,
    console, setTimeout, clearTimeout, AbortController, URL, TypeError, TextEncoder, JSON, Math, Date, Array, Object, String, Number, encodeURIComponent
  };
  window.window = window;
  const sandbox = vm.createContext({window, document: dom.document, console, Promise, setTimeout, clearTimeout,
    AbortController, URL, TypeError, TextEncoder, JSON, Math, Date, Array, Object, String, Number, encodeURIComponent});
  vm.runInContext(source, sandbox, {filename: "goat-ladder.js"});
  return {...dom, board: window.GoatBoard, window, calls, session};
}

const json = (body, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body))
});

const CAREER = {
  id: "c1", game_mode: "player", display_name: "Leire", title: "Carrera de Jugadora",
  current_club: "Paris Saint-Germain", started_season: 2082, latest_season: 2100,
  metrics: {seasons: 18, appearances: 794, goals: 698, assists: 157, trophies: 16, awards: 125, clubs: 8},
  history: [
    {season: 2099, club: "PSG", competition: "Liga", trophies: ["Liga", "Copa"], awards: ["MVP"], appearances: 40, goals: 30, assists: 10},
    {season: 2100, club: "PSG", competition: "Liga", trophies: ["Liga"], awards: ["MVP", "MVP"], appearances: 38, goals: 32, assists: 9}
  ]
};
const SECOND = {...CAREER, id: "c2", display_name: "Epi", current_club: "Real Sociedad", title: "Carrera de Jugador"};

const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

async function main() {
console.log("Pintado inicial");
{
  const dom = boot({board: ["careers", "achievements"], mode: ["player", "manager"], period: ["all-time", "30d", "7d"],
    fetch: () => json({metric: "appearances", entries: [CAREER, SECOND]})});
  dom.board.start();
  await tick();
  check("se pinta una tarjeta por carrera", () => {
    assert.equal((dom.list.innerHTML.match(/<article class="goat-card"/g) || []).length, 2);
    assert.match(dom.list.innerHTML, /Leire/);
    assert.match(dom.list.innerHTML, /#1/);
  });
  check("las estadísticas y el palmarés aparecen", () => {
    assert.match(dom.list.innerHTML, /794/);
    assert.match(dom.list.innerHTML, /goat-honour/);
    assert.match(dom.list.innerHTML, /×2/);
  });
  check("el historial de temporadas se puede desplegar", () => {
    assert.match(dom.list.innerHTML, /<details class="goat-career-history"/);
  });
  check("el estado muestra la hora de actualización", () => {
    assert.match(dom.status.textContent, /Actualizado/);
    assert.doesNotMatch(dom.status.textContent, /Cargando/);
  });
  check("se añade el buscador a los filtros", () => {
    assert.ok(dom.filters.children.some((child) => child.id === "goat-search"));
  });
  check("se añade el bloque de ayuda en la cabecera", () => {
    assert.ok(dom.hero.children.some((child) => String(child.innerHTML).includes("goat-howto")));
  });
  check("los botones de filtro reflejan el estado", () => {
    assert.equal(dom.segments[0].buttons[0].getAttribute("aria-pressed"), "true");
    assert.equal(dom.segments[0].buttons[1].getAttribute("aria-pressed"), "false");
  });
  check("se pide la métrica por defecto del modo", () => {
    assert.match(dom.calls[0].url, /metric=appearances/);
  });
}

console.log("Buscador y filtros");
{
  const dom = boot({board: ["careers", "achievements"], mode: ["player", "manager"], period: ["all-time"],
    fetch: () => json({metric: "appearances", entries: [CAREER, SECOND]})});
  dom.board.start();
  await tick();
  const search = dom.filters.children.find((child) => child.id === "goat-search");
  search.value = "sociedad";
  search.fire("input");
  check("el buscador filtra sin volver a pedir datos", () => {
    assert.equal(dom.calls.length, 1);
    assert.doesNotMatch(dom.list.innerHTML, /Leire/);
    assert.match(dom.list.innerHTML, /Epi/);
  });
  search.value = "no existe";
  search.fire("input");
  check("sin resultados se avisa con el texto buscado", () => {
    assert.match(dom.list.innerHTML, /no existe/);
  });

  dom.page.fire("click", {target: dom.segments[1].buttons[1]});
  await tick();
  check("cambiar a míster recarga con la primera métrica del modo", () => {
    assert.equal(dom.calls.length, 2);
    assert.match(dom.calls[1].url, /mode=manager/);
    assert.match(dom.calls[1].url, /metric=wins/);
    assert.match(dom.window.__url, /mode=manager/);
  });
}

console.log("Métricas y URL");
{
  const dom = boot({board: ["careers", "achievements"], mode: ["player", "manager"], period: ["all-time"],
    search: "?mode=manager&metric=trophies&period=30d",
    fetch: () => json({metric: "trophies", entries: [CAREER]})});
  dom.board.start();
  await tick();
  check("el estado se lee de la URL", () => {
    assert.match(dom.calls[0].url, /mode=manager/);
    assert.match(dom.calls[0].url, /metric=trophies/);
    assert.match(dom.calls[0].url, /timeframe=30d/);
  });
  check("el selector de métricas se rellena y conserva la elegida", () => {
    assert.match(dom.metric.innerHTML, /value="trophies" selected/);
  });
  dom.metric.value = "win_percentage";
  dom.metric.listeners.change[0]({target: dom.metric});
  await tick();
  check("cambiar la métrica vuelve a pedir el ranking", () => {
    assert.match(dom.calls[1].url, /metric=win_percentage/);
  });
}

console.log("Gestas y enlaces compartidos");
{
  const dom = boot({board: ["careers", "achievements"], mode: ["player", "manager"], period: ["all-time"],
    search: "?board=achievements&entry=c1",
    fetch: () => json({entries: [{id: "c1", game_mode: "player", event_type: "match", display_name: "Leire",
      title: "Hat-trick en Liga", club_name: "PSG", competition_name: "Liga", opponent_name: "Marsella",
      goat_score: 812, metrics: {goals: 3, assists: 1, match_rating: 9.1, minutes_played: 90}}]})});
  dom.board.start();
  await tick();
  check("las gestas muestran resultado y puntuación", () => {
    assert.match(dom.list.innerHTML, /812/);
    assert.match(dom.list.innerHTML, /Marsella/);
    assert.match(dom.list.innerHTML, /9.1/);
  });
  check("la entrada compartida queda resaltada", () => {
    assert.match(dom.list.innerHTML, /goat-card is-selected/);
  });
}

console.log("Estados de error");
{
  const dom = boot({board: ["careers"], mode: ["player"], period: ["all-time"],
    fetch: () => Promise.reject(new TypeError("Failed to fetch"))});
  dom.board.start();
  await tick();
  await tick();
  check("un fallo de red muestra un aviso claro y un botón de reintento", () => {
    assert.match(dom.list.innerHTML, /No se pudo conectar con el ranking/);
    assert.match(dom.list.innerHTML, /data-retry/);
    assert.doesNotMatch(dom.list.innerHTML, /Failed to fetch/);
  });
}
{
  const dom = boot({board: ["careers"], mode: ["player"], period: ["all-time"], fetch: () => json({error: "boom"}, 500)});
  dom.board.start();
  await tick();
  await tick();
  check("un error del servidor se traduce", () => {
    assert.match(dom.list.innerHTML, /no está disponible/);
  });
}
{
  const dom = boot({board: ["careers"], mode: ["player"], period: ["all-time"], fetch: () => json({entries: []})});
  dom.board.start();
  await tick();
  check("un ranking vacío explica cómo aparecer", () => {
    assert.match(dom.list.innerHTML, /Aún no hay carreras compartidas/);
    assert.match(dom.list.innerHTML, /jugar/);
  });
}
{
  const dom = boot({url: "", board: ["careers"], mode: ["player"], period: ["all-time"], fetch: () => json({entries: []})});
  dom.board.start();
  await tick();
  check("sin servicio configurado se avisa", () => {
    assert.match(dom.list.innerHTML, /no está configurado/);
    assert.equal(dom.calls.length, 0);
  });
}

}

main().then(() => {
  console.log(failures.length ? `\n${failures.length} comprobaciones fallidas` : "\nTodo correcto");
  process.exit(failures.length ? 1 : 0);
});
