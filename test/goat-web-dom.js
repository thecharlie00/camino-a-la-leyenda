/* Pruebas del tablero online GOAT LADDER sobre el HTML real de la página (jsdom).
   Se ejecutan sin navegador:  node test/goat-web-dom.js  */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = readFileSync(join(root, "goat-ladder.js"), "utf8");
const pixelSource = readFileSync(join(root, "pixel.js"), "utf8");

const failures = [];
function check(name, fn) {
  try { fn(); console.log("  ok  " + name); }
  catch (error) { failures.push(name); console.log("  FAIL " + name + " · " + error.message); }
}
const pause = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const CAREER_WITH_TROPHIES = {
  id: "c9", game_mode: "player", title: "Carrera de Nerea", display_name: "Nerea", current_club: "Atlas",
  started_season: 2080, latest_season: 2082,
  metrics: {seasons: 3, appearances: 120, goals: 44, trophies: 3, awards: 1},
  history: [
    {season: 2082, club: "Atlas", competition: "Liga", trophies: ["Liga", "Copa"], trophy_keys: ["league", "cup"],
      awards: ["MVP de la temporada"], award_keys: ["mvp"], appearances: 40, goals: 18},
    {season: 2081, club: "Atlas", competition: "Liga", trophies: ["Liga"], trophy_keys: ["league"],
      awards: [], appearances: 40, goals: 14}
  ]
};

const CAREER = (id, name, club) => ({
  id, game_mode: "player", title: "Carrera de " + name, display_name: name, current_club: club,
  started_season: 2082, latest_season: 2100,
  metrics: {seasons: 18, appearances: 794, goals: 698, assists: 157, trophies: 16, awards: 125},
  history: [{season: 2100, club, competition: "Liga", trophies: ["Liga"], awards: ["MVP"],
    appearances: 38, goals: 32, assists: 9, position: 1}],
  verification: "community-reported"
});

const ENTRIES = [CAREER("c1", "Leire", "PSG"), CAREER("c2", "Epi", "Real Sociedad")];

/* Página real + guion del servicio. Devuelve la ventana y las peticiones vistas. */
async function boot(options = {}) {
  const file = options.page || "goat-ladder/index.html";
  const html = readFileSync(join(root, file), "utf8");
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: options.url || "https://futbolroadtolegend.com/goat-ladder/",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const calls = [];
  const copied = [];
  const store = options.storage ? { ...options.storage } : {};
  window.localStorage.clear();
  Object.keys(store).forEach((key) => window.localStorage.setItem(key, store[key]));
  for (const key of Object.keys(options.session || {})) window.sessionStorage.setItem(key, options.session[key]);
  window.console.error = () => {};
  window.GOAT_API_URL = "GOAT_API_URL" in options ? options.GOAT_API_URL : "https://api.test";
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText: (value) => { copied.push(value); return Promise.resolve(); } }
  });
  window.confirm = () => true;
  window.fetch = (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    const answer = options.fetch ? options.fetch(String(url), init || {}, calls.length) : null;
    if (answer === "hang") {
      /* como el fetch real: si se aborta, la promesa se rechaza */
      return new Promise((_, reject) => {
        const signal = init && init.signal;
        if (!signal) return;
        signal.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });
    }
    if (answer instanceof Promise) return answer;
    return Promise.resolve({
      ok: true, status: 200,
      text: () => Promise.resolve(JSON.stringify(answer || { entries: ENTRIES }))
    });
  };
  if (options.timeoutMs) {
    const native = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) =>
      native(callback, delay >= 10000 ? options.timeoutMs : delay, ...args);
  }
  if (options.pixel) window.eval(pixelSource);   /* iconos de trofeo reales */
  window.eval(script);
  await pause(20);
  return { dom, window, document: window.document, calls, copied };
}

const cardNames = (document) => [...document.querySelectorAll(".goat-card-title")].map((el) => el.textContent);
const text = (document, selector) => {
  const el = document.querySelector(selector);
  return el ? el.textContent.trim() : "";
};

async function rendering() {
  console.log("Pintado del ranking");
  const { window, document, calls } = await boot();
  check("pide las carreras al servicio con modo, periodo y métrica", () => {
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/goat-ladder\/careers\?mode=player&timeframe=all-time&metric=appearances$/);
  });
  check("pinta una tarjeta por carrera con su nombre", () => {
    assert.deepEqual(cardNames(document), ["Carrera de Leire", "Carrera de Epi"]);
  });
  check("cada tarjeta muestra el palmarés y el historial de temporadas", () => {
    assert.ok(document.querySelector(".goat-honours"), "sin bloque de palmarés");
    assert.ok(document.querySelector(".goat-career-history"), "sin historial");
    assert.match(text(document, ".goat-season-row"), /Liga/);
  });
  check("anuncia la última actualización y esconde el reintento", () => {
    assert.match(text(document, "#goat-updated"), /Actualizado/);
    assert.equal(document.getElementById("goat-retry").hidden, true);
  });
  check("añade el buscador y la ayuda para participar", () => {
    assert.ok(document.getElementById("goat-search"), "sin buscador");
    assert.match(document.querySelector(".goat-howto").textContent, /Cómo aparezco/);
  });
  window.close();
}

async function search() {
  console.log("Buscador");
  const { window, document, calls } = await boot();
  const input = document.getElementById("goat-search");
  input.value = "sociedad";
  input.dispatchEvent(new window.Event("input"));
  check("filtra sin volver a pedir el ranking", () => {
    assert.deepEqual(cardNames(document), ["Carrera de Epi"]);
    assert.equal(calls.length, 1);
  });
  check("guarda la búsqueda en la URL", () => {
    assert.match(window.location.search, /q=sociedad/);
  });
  input.value = "zzz";
  input.dispatchEvent(new window.Event("input"));
  check("avisa cuando no hay resultados y ofrece ver todo", () => {
    assert.match(text(document, ".goat-empty"), /Ningún resultado con «zzz»/);
    assert.ok(document.querySelector("[data-goat-clear]"), "sin botón para limpiar");
  });
  document.querySelector("[data-goat-clear]").click();
  check("«ver todo» devuelve la lista completa y limpia la URL", () => {
    assert.equal(cardNames(document).length, 2);
    assert.equal(input.value, "");
    assert.equal(window.location.search, "");
  });
  window.close();
}

async function filters() {
  console.log("Filtros");
  const { window, document, calls } = await boot({
    fetch: (url) => url.includes("/careers")
      ? { entries: ENTRIES }
      : { entries: [{ id: "a1", game_mode: "manager", event_type: "season", title: "Temporada perfecta",
        display_name: "Epi", club_name: "León", competition_name: "Liga", goat_score: 88, metrics: { wins: 30 } }] }
  });
  document.querySelector('[data-mode="manager"]').click();
  await pause(10);
  check("cambiar a míster recarga con la métrica de míster", () => {
    assert.match(calls[1].url, /mode=manager/);
    assert.match(calls[1].url, /metric=wins/);
    assert.equal(document.querySelector('[data-mode="manager"]').getAttribute("aria-pressed"), "true");
    assert.equal(document.querySelector('[data-mode="player"]').getAttribute("aria-pressed"), "false");
  });
  document.querySelector('[data-period="7d"]').click();
  await pause(10);
  check("el periodo se envía como timeframe y se marca el botón", () => {
    assert.match(calls[2].url, /timeframe=7d/);
    assert.equal(document.querySelector('[data-period="7d"]').getAttribute("aria-pressed"), "true");
  });
  document.querySelector('[data-board="achievements"]').click();
  await pause(10);
  check("las gestas usan su propio endpoint y ocultan la métrica", () => {
    assert.match(calls[3].url, /\/api\/goat-ladder\?mode=manager&timeframe=7d$/);
    assert.equal(document.getElementById("goat-metric").disabled, true);
    assert.match(text(document, ".goat-card-title"), /Temporada perfecta/);
  });
  const metric = document.getElementById("goat-metric");
  document.querySelector('[data-board="careers"]').click();
  await pause(10);
  const before = calls.length;
  metric.value = "trophies";
  metric.dispatchEvent(new window.Event("change"));
  await pause(10);
  check("cambiar la métrica ordena de nuevo el ranking", () => {
    assert.equal(calls.length, before + 1);
    assert.match(calls[calls.length - 1].url, /metric=trophies/);
  });
  window.close();
}

async function pagination() {
  console.log("Paginación y enlace directo");
  const many = Array.from({ length: 20 }, (_, i) => CAREER("c" + i, "Jugador " + i, "Club " + i));
  const { window, document } = await boot({ fetch: () => ({ entries: many }) });
  check("la primera página se corta en 12 tarjetas", () => {
    assert.equal(document.querySelectorAll(".goat-card").length, 12);
    assert.ok(document.querySelector("[data-goat-more]"), "sin botón de ver más");
  });
  document.querySelector("[data-goat-more]").click();
  check("«ver más» añade el resto sin repetir tarjetas", () => {
    assert.equal(document.querySelectorAll(".goat-card").length, 20);
    assert.equal(document.querySelector("[data-goat-more]"), null);
  });
  window.close();

  const deep = await boot({
    url: "https://futbolroadtolegend.com/goat-ladder/?entry=" + many[17].id,
    fetch: () => ({ entries: many })
  });
  check("un enlace compartido abre en la entrada y la resalta", () => {
    const card = deep.document.getElementById("goat-entry-" + many[17].id);
    assert.ok(card, "la entrada compartida no está pintada");
    assert.match(card.className, /is-selected/);
  });
  deep.window.close();
}

async function trophyIcons() {
  console.log("Trofeos del historial");
  const withIcons = await boot({ pixel: true, fetch: () => ({ entries: [CAREER_WITH_TROPHIES] }) });
  const details = withIcons.document.querySelector(".goat-career-history");
  check("el historial de temporadas está desplegable", () => {
    assert.ok(details, "sin bloque de historial");
    assert.equal(details.querySelectorAll(".goat-season-row").length, 2);
  });
  check("cada temporada muestra el icono de los trofeos ganados", () => {
    const rows = details.querySelectorAll(".goat-season-row");
    /* el historial se pinta de la temporada más antigua a la más reciente */
    assert.equal(rows[0].querySelectorAll(".goat-season-honours svg").length, 1, "2081: un título");
    assert.equal(rows[1].querySelectorAll(".goat-season-honours svg").length, 3, "2082: dos títulos y un premio");
    assert.equal(rows[1].querySelectorAll(".goat-season-honours").length, 2, "títulos y premios van separados");
  });
  check("los iconos llevan el nombre del trofeo accesible", () => {
    const icon = details.querySelector(".goat-hon-ico");
    assert.ok(icon, "sin contenedor de icono");
    assert.match(icon.getAttribute("title"), /Liga|Copa|MVP/);
    assert.ok(details.querySelector("svg[aria-label]"), "el icono no tiene etiqueta");
  });
  check("el palmarés de la carrera también lleva trofeos", () => {
    assert.ok(withIcons.document.querySelector(".goat-honours svg"), "palmarés sin iconos");
  });
  withIcons.window.close();

  const plain = await boot({ pixel: true, fetch: () => ({ entries: [{
    id: "c1", game_mode: "player", title: "Carrera de Leire", display_name: "Leire", current_club: "PSG",
    started_season: 2082, latest_season: 2100, metrics: {seasons: 1, appearances: 40},
    history: [{season: 2100, club: "PSG", competition: "Liga", trophies: [], awards: [], appearances: 40}]
  }] }) });
  check("una temporada sin trofeos no pinta la fila de honores", () => {
    const row = plain.document.querySelector(".goat-season-row");
    assert.ok(row, "sin fila de temporada");
    assert.equal(row.querySelector(".goat-season-honours"), null);
  });
  plain.window.close();

  const withoutPixel = await boot({ fetch: () => ({ entries: [CAREER_WITH_TROPHIES] }) });
  check("sin pixel.js los trofeos se leen como texto", () => {
    const text = withoutPixel.document.querySelector(".goat-season-honours .goat-hon-ico.is-text");
    assert.ok(text, "no hay respaldo en texto");
    assert.match(text.textContent, /Liga/);
  });
  withoutPixel.window.close();
}

async function failure() {
  console.log("Errores y reintento");
  const once = await boot({
    fetch: (url, init, n) => (n === 1 ? Promise.reject(new TypeError("Failed to fetch")) : { entries: ENTRIES })
  });
  await pause(600);
  check("un corte de red puntual se reintenta solo", () => {
    assert.equal(once.calls.length, 2);
    assert.equal(once.document.querySelector(".goat-error-state"), null);
    assert.equal(cardNames(once.document).length, 2);
  });
  once.window.close();

  const { window, document, calls } = await boot({
    fetch: (url, init, n) => (n <= 2 ? Promise.reject(new TypeError("Failed to fetch")) : { entries: ENTRIES })
  });
  await pause(700);
  check("si la red sigue caída avisa y ofrece reintentar", () => {
    assert.match(text(document, ".goat-error-state"), /No se pudo conectar con el ranking/);
    assert.ok(document.querySelector(".goat-error-state[role='alert']"), "el aviso no es accesible");
    assert.ok(document.querySelector("[data-goat-retry]"), "sin botón de reintento");
  });
  document.querySelector("[data-goat-retry]").click();
  await pause(20);
  check("reintentar vuelve a pedir el ranking y lo pinta", () => {
    assert.ok(calls.length >= 2);
    assert.equal(cardNames(document).length, 2);
    assert.equal(document.querySelector(".goat-error-state"), null);
  });
  window.close();

  const slow = await boot({ fetch: () => "hang", timeoutMs: 10 });
  await pause(60);
  check("si el servicio no responde se avisa de la tardanza", () => {
    assert.match(text(slow.document, ".goat-error-state"), /tardando demasiado/);
  });
  slow.window.close();

  const empty = await boot({ fetch: () => ({ entries: [] }) });
  check("sin carreras explica cómo aparecer", () => {
    assert.match(text(empty.document, ".goat-empty"), /Aún no hay carreras/);
    assert.ok(empty.document.querySelector(".goat-empty .goat-howto"), "sin ayuda");
  });
  empty.window.close();

  const off = await boot({ GOAT_API_URL: "" });
  check("sin servicio configurado lo dice y no pide nada", () => {
    assert.match(text(off.document, ".goat-error-state"), /no está configurado/);
    assert.equal(off.calls.length, 0);
  });
  off.window.close();
}

async function sharing() {
  console.log("Compartir y eliminar");
  const { window, document, copied } = await boot();
  document.querySelector("[data-goat-share]").click();
  await pause(10);
  check("compartir copia el enlace directo a la entrada", () => {
    assert.equal(copied[0], "https://futbolroadtolegend.com/goat-ladder/?entry=c1");
  });
  check("y lo confirma con un aviso", () => {
    assert.match(text(document, "#goat-toast"), /Enlace copiado/);
  });
  check("sin token guardado no se ofrece eliminar", () => {
    assert.equal(document.querySelector("[data-goat-delete]"), null);
  });
  window.close();

  const own = await boot({
    storage: { "camino.goat.deleteTokens": JSON.stringify({ c1: "token-1" }) },
    fetch: (url, init) => init.method === "DELETE" ? { ok: true } : { entries: ENTRIES }
  });
  const remove = own.document.querySelector("[data-goat-delete]");
  check("con token guardado se ofrece eliminar la entrada propia", () => {
    assert.ok(remove, "sin botón de eliminar");
    assert.equal(remove.getAttribute("data-goat-delete"), "c1");
  });
  remove.click();
  await pause(30);
  check("eliminar manda el token y quita la tarjeta", () => {
    const del = own.calls.find((call) => call.init.method === "DELETE");
    assert.ok(del, "no se envió la petición de borrado");
    assert.match(del.url, /\/api\/goat-ladder\/careers\?id=c1/);
    assert.equal(del.init.headers.Authorization, "Bearer token-1");
    assert.deepEqual(cardNames(own.document), ["Carrera de Epi"]);
    assert.match(text(own.document, "#goat-toast"), /Entrada eliminada/);
  });
  check("el token usado se olvida", () => {
    const left = JSON.parse(own.window.localStorage.getItem("camino.goat.deleteTokens") || "{}");
    assert.equal(left.c1, undefined);
  });
  own.window.close();
}

async function caching() {
  console.log("Caché de sesión");
  const { window } = await boot();
  const sessionStorage = window.sessionStorage;
  const cached = Object.keys(sessionStorage).filter((key) => key.startsWith("camino.goatWeb."));
  check("la respuesta se guarda en la sesión", () => {
    assert.equal(cached.length, 1);
  });
  const store = {};
  cached.forEach((key) => { store[key] = sessionStorage.getItem(key); });
  window.close();
  const again = await boot({ session: store });
  check("al volver a la página se pinta al instante sin pedir de nuevo", async () => {
    assert.equal(again.calls.length, 0);
    assert.equal(cardNames(again.document).length, 2);
  });
  again.window.close();
}

async function languages() {
  console.log("Idiomas");
  const pages = [
    ["en/goat-ladder/index.html", /Search by alias or club/, /Updated/],
    ["de/goat-ladder/index.html", /Nach Alias oder Verein suchen/, /Aktualisiert/],
    ["it/goat-ladder/index.html", /Cerca per alias o club/, /Aggiornata/],
    ["fr/goat-ladder/index.html", /Rechercher un alias ou un club/, /Actualisé/]
  ];
  for (const [page, searchLabel, updatedLabel] of pages) {
    const { window, document } = await boot({ page, url: "https://futbolroadtolegend.com/" + page.replace("index.html", "") });
    check(page.split("/")[0] + ": buscador y estado traducidos", () => {
      assert.match(document.getElementById("goat-search").getAttribute("placeholder"), searchLabel);
      assert.match(text(document, "#goat-updated"), updatedLabel);
    });
    window.close();
  }
}

async function main() {
  await rendering();
  await search();
  await filters();
  await pagination();
  await trophyIcons();
  await failure();
  await sharing();
  await caching();
  await languages();
  console.log(failures.length ? `\n${failures.length} comprobaciones fallidas` : "\nTodo correcto");
  process.exit(failures.length ? 1 : 0);
}

main();
