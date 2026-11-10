/* Pruebas de la ficha del ranking dentro del juego (legacy-game/src/ui-goat.js):
   buscador, compartir, alias recordado, reintentos y enlaces a la web.
   Se ejecutan sin navegador:  node test/goat-game-ui.js  */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uiSource = readFileSync(join(root, "legacy-game", "src", "ui-goat.js"), "utf8");

const failures = [];
function check(name, fn) {
  try { fn(); console.log("  ok  " + name); }
  catch (error) { failures.push(name); console.log("  FAIL " + name + " · " + error.message); }
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

const CAREER_ENTRIES = [
  {id: "c1", game_mode: "player", display_name: "Leire", title: "Carrera de Leire",
    current_club: "PSG", started_season: 2082, latest_season: 2100,
    metrics: {seasons: 18, appearances: 794, goals: 698, assists: 157, trophies: 16},
    history: [{season: 2100, club: "PSG", competition: "Liga", trophies: ["Liga"], awards: ["MVP"],
      appearances: 38, goals: 32, assists: 9}]},
  {id: "c2", game_mode: "player", display_name: "Epi", title: "Carrera de Epi",
    current_club: "Real Sociedad", started_season: 2026, latest_season: 2043,
    metrics: {seasons: 18, appearances: 874, goals: 569}, history: []}
];

/* Entorno: solo lo que toca el módulo (UIX, servicio, almacenamiento y DOM mínimo). */
function build(options = {}) {
  const store = { ...(options.storage || {}) };
  const copied = [];
  const listeners = {};
  const elements = [];
  const calls = {list: 0, listCareers: 0};
  const document = {
    body: {appendChild(el) { elements.push(el); }},
    documentElement: {appendChild(el) { elements.push(el); }},
    getElementById: (id) => elements.find((el) => el.id === id) || null,
    querySelector: () => null,
    createElement: () => ({
      id: "", className: "", textContent: "", style: {}, children: [], parentNode: null,
      classList: {
        add() {},
        remove() {}
      },
      setAttribute(name, value) { this[name] = value; },
      appendChild(child) { this.children.push(child); }
    }),
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); }
  };
  const UIX = {
    actions: {}, sheets: {}, pend: {}, slots: {}, hk: {}, adds: [],
    sheet: null,
    add(name, fn) { UIX.adds.push(name); },
    getSheet() { return UIX.sheet; },
    setSheet(sheet) { UIX.sheet = sheet; window.__goatSheet = sheet; },
    renderSheet() { UIX.renders = (UIX.renders || 0) + 1; },
    renders: 0
  };
  const latest = options.latest === undefined
    ? {event_key: "m:1", title: "Gesta", club_name: "PSG", competition_name: "Liga",
        game_mode: "player", event_type: "match", metrics: {goals: 3, assists: 1}}
    : options.latest;
  const career = options.career === undefined
    ? {event_key: "career:1", game_mode: "player", title: "Carrera de Leire", current_club: "PSG",
        started_season: 2082, latest_season: 2100, metrics: {seasons: 18, appearances: 794}, history: []}
    : options.career;
  let submitResult = () => Promise.reject(new Error("Sin conexión con el ranking."));
  const service = {
    available: () => options.available !== false,
    latest: () => latest,
    career: () => career,
    list: () => { calls.list++; return Promise.resolve(options.entries || CAREER_ENTRIES); },
    listCareers: () => { calls.listCareers++; return Promise.resolve(options.entries || CAREER_ENTRIES); },
    canDelete: (id) => !!(options.deletable || []).includes(id),
    submit: (...args) => submitResult(...args),
    submitCareer: (...args) => submitResult(...args),
    deleteEntry: () => Promise.resolve({}),
    deleteCareer: () => Promise.resolve({}),
    /* se resuelve contra la tabla que publica el propio módulo (5 idiomas, con marcadores) */
    t: (key, params) => {
      const tables = window.GOAT_TEXT || {};
      const table = tables.es || {};
      let value = table[key] == null ? key : table[key];
      if (params) value = String(value).replace(/\{(\w+)\}/g, (m, name) => (params[name] == null ? m : String(params[name])));
      return value;
    }
  };
  const window = {
    UIX, GoatLadder: service, GOAT_WEB_BUILD: options.webBuild !== false, TEXT: undefined,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    navigator: {clipboard: {writeText: (value) => { copied.push(value); return Promise.resolve(); }}},
    confirm: () => true,
    document
  };
  window.window = window;
  Object.assign(window, {
    addEventListener() {}, setTimeout, clearTimeout, Promise, console, JSON, Math, Date, String, Number,
    Array, Object, encodeURIComponent, decodeURIComponent
  });
  const sandbox = vm.createContext(window);
  vm.runInContext(uiSource, sandbox, {filename: "ui-goat.js"});
  return {UIX, service, window, document, copied, store, listeners, elements, calls,
    setSubmit(fn) { submitResult = fn; }};
}

function panel(values = {}) {
  const fields = {alias: "Leire", title: "Carrera de Leire", consent: true, ...values};
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

function goatSheet(extra = {}) {
  return {k: "goat", board: "careers", mode: "player", timeframe: "all-time", metric: "appearances",
    entries: [], loading: false, error: "", q: "", ...extra};
}

async function main() {
  console.log("Ficha del ranking en el juego");
  {
    const env = build();
    const sheet = goatSheet();
    env.UIX.setSheet(sheet);
    env.UIX.actions.goatrefresh();
    await tick();
    const html = env.UIX.sheets.goat(sheet);
    check("pinta las carreras del ranking", () => {
      assert.match(html, /Leire/);
      assert.match(html, /Epi/);
    });
    check("incluye el buscador con su etiqueta", () => {
      assert.match(html, /data-goat-q/);
      assert.match(html, /Buscar por alias o club/);
    });
    check("cada carrera se puede compartir", () => {
      assert.match(html, /data-a="goatshare" data-v="c1"/);
    });
    check("no ofrece eliminar lo que no es de este dispositivo", () => {
      assert.doesNotMatch(html, /data-a="goatcareerdelete"/);
    });
    check("en el build web enlaza al ranking completo", () => {
      assert.match(html, /href="\.\.\/goat-ladder\/"/);
      assert.match(html, /target="_top"/);
    });
  }

  console.log("Buscador");
  {
    const env = build();
    const sheet = goatSheet({entries: CAREER_ENTRIES.slice()});
    env.UIX.setSheet(sheet);
    const change = env.listeners.change[0];
    change({target: {matches: (sel) => sel === "[data-goat-q]", value: "sociedad"}});
    check("filtra sin pedir nada a la red", () => {
      const html = env.UIX.sheets.goat(sheet);
      assert.equal((html.match(/data-a="goatshare"/g) || []).length, 1);
      assert.match(html, /data-a="goatshare" data-v="c2"/);
      assert.doesNotMatch(html, /data-v="c1"/);
    });
    check("indica cuántas entradas se están viendo", () => {
      assert.match(env.UIX.sheets.goat(sheet), /1 de 2/);
    });
    change({target: {matches: (sel) => sel === "[data-goat-q]", value: "zzz"}});
    const empty = env.UIX.sheets.goat(sheet);
    check("avisa cuando no hay resultados y ofrece ver todo", () => {
      assert.match(empty, /Ningún resultado con «zzz»/);
      assert.match(empty, /data-a="goatclearq"/);
    });
    env.UIX.actions.goatclearq();
    check("«ver todo» limpia la búsqueda y repinta", () => {
      assert.equal(sheet.q, "");
      assert.match(env.UIX.sheets.goat(sheet), /Carrera de Leire/);
    });
  }

  console.log("Compartir");
  {
    const env = build();
    env.UIX.setSheet(goatSheet());
    env.UIX.actions.goatshare(null, "c1");
    await tick();
    check("copia el enlace público de la entrada", () => {
      assert.equal(env.copied[0], "https://futbolroadtolegend.com/goat-ladder/?entry=c1");
    });
    check("lo confirma con un aviso propio", () => {
      const toast = env.elements.find((el) => el.id === "goat-toast");
      assert.ok(toast, "no se creó el aviso");
      assert.match(toast.textContent, /Enlace copiado/);
    });
  }

  console.log("Publicar y alias recordado");
  {
    const env = build();
    env.setSubmit(() => Promise.resolve({id: "x", delete_token: "t", delete_token_saved: true, goat_score: 10}));
    const sheet = goatSheet({board: "achievements"});
    env.UIX.setSheet(sheet);
    env.UIX.actions.goatsubmit(panel());
    await tick();
    check("tras publicar se recuerda el alias", () => {
      assert.equal(env.store["camino.goat.alias"], "Leire");
      assert.equal(sheet.submitFailed, false);
    });
    check("el alias se rellena solo la próxima vez", () => {
      const html = env.UIX.sheets.goat(sheet);
      assert.match(html, /data-goat-alias value="Leire"/);
      assert.match(html, /Alias recordado/);
    });
    check("la ficha de carrera también parte del alias recordado", () => {
      env.UIX.setSheet({k: "goatCareerPublish", career: env.service.career()});
      assert.match(env.UIX.sheets.goatCareerPublish(env.UIX.getSheet()), /data-career-alias value="Leire"/);
    });
  }

  console.log("Errores de publicación");
  {
    const env = build();
    const sheet = goatSheet({board: "achievements"});
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
    const sheet = goatSheet({entries: CAREER_ENTRIES.slice()});
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
    env.UIX.actions.goatperiod(null, "7d");
    check("cambiar de periodo sí recarga", () => {
      assert.equal(env.calls.listCareers, before + 1);
      assert.equal(sheet.timeframe, "7d");
    });
  }

  console.log("Estados del listado");
  {
    const env = build();
    const sheet = goatSheet({entries: CAREER_ENTRIES.slice(), loading: true});
    env.UIX.setSheet(sheet);
    check("al refrescar mantiene las filas y avisa de la actualización", () => {
      const html = env.UIX.sheets.goat(sheet);
      assert.match(html, /Actualizando ranking/);
      assert.match(html, /Leire/);
    });

    const off = build({available: false});
    const offSheet = goatSheet();
    off.UIX.setSheet(offSheet);
    const html = off.UIX.sheets.goat(offSheet);
    check("sin servicio lo avisa en las dos pestañas", () => {
      assert.match(html, /no está configurado|aún no está configurado/i);
      assert.doesNotMatch(html, /data-a="goatshare"/);
    });
  }
}

main().then(() => {
  console.log(failures.length ? `\n${failures.length} comprobaciones fallidas` : "\nTodo correcto");
  process.exit(failures.length ? 1 : 0);
});
