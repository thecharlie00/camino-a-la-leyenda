/* Pruebas del cliente del ranking GOAT LADDER (publicación de gestas y carreras).
   Se ejecutan sin navegador:  node test/goat-client.js  */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
var root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
var failures = 0;

function check(name, condition, extra) {
  if (condition) { console.log("  ok  " + name); return; }
  failures++;
  console.log("  FAIL " + name + (extra === undefined ? "" : " " + JSON.stringify(extra)));
}
function jsonResponse(body, status) {
  status = status || 200;
  return Promise.resolve({ok: status >= 200 && status < 300, status: status,
    text: function () { return Promise.resolve(JSON.stringify(body)); }});
}
function networkError() { return Promise.reject(new TypeError("Failed to fetch")); }

var goatOrigin = "https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev";
var goatLocales = ["", "en/", "de/", "it/", "fr/"];
goatLocales.forEach(function (locale) {
  var page = fs.readFileSync(path.join(root, locale, "goat-ladder/index.html"), "utf8");
  check("GOAT Ladder origin " + (locale || "es"), page.indexOf('window.GOAT_API_URL = "' + goatOrigin + '"') >= 0);
  check("GOAT Ladder web build version " + (locale || "es"), page.indexOf("5.17") >= 0 && page.indexOf("5.7") < 0);
});
var siteCss = fs.readFileSync(path.join(root, "site.css"), "utf8");
check("web GOAT filters have 44px touch targets", /\.goat-segment button\s*\{[^}]*min-height:\s*44px;[^}]*touch-action:\s*manipulation;/s.test(siteCss));

/* Carga src/goat.js con un entorno mínimo (sin DOM). */
function loadService(options, sourcePath) {
  var store = {}, calls = [];
  var texts = {es: {networkError: "SIN_RED", timeoutError: "TIEMPO", offlineError: "SIN_CONEXION",
    responseError: "RESPUESTA", unavailable: "NO_CONFIGURADO", noLatest: "SIN_GESTA",
    careerNoData: "SIN_CARRERA", deleteMissing: "SIN_CLAVE"}};
  var env = {
    GOAT_API_URL: options.url, GOAT_TEXT: texts, LANG: "es", AndroidBridge: options.bridge,
    navigator: {onLine: options.online !== false},
    localStorage: {
      getItem: function (key) { return key in store ? store[key] : null; },
      setItem: function (key, value) { store[key] = String(value); },
      removeItem: function (key) { delete store[key]; }
    },
    TextEncoder: TextEncoder, AbortController: AbortController, URL: URL, TypeError: TypeError,
    console: {log: function () {}, warn: function () {}, error: function () {}}, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout,
    fetch: function (url, init) { calls.push({url: url, init: init}); return options.fetch(url, init, calls.length); }
  };
  env.window = env;
  var source = fs.readFileSync(path.join(root, sourcePath || "src/goat.js"), "utf8");
  /* El módulo usa variables globales del juego (S, W, LANG, GOAT_TEXT, GOAT_API_URL). */
  var factory = new Function("window", "GOAT_API_URL", "GOAT_TEXT", "LANG", "navigator",
    "localStorage", "fetch", "TextEncoder", "AbortController", "console", source);
  factory(env, env.GOAT_API_URL, env.GOAT_TEXT, env.LANG, env.navigator, env.localStorage, env.fetch,
    env.TextEncoder, env.AbortController, env.console);
  return {service: env.GoatLadder, calls: calls, window: env};
}

(async function () {
  console.log("URL del servicio");
  var urls = [
    ["https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev/", "https://camino-goat-ladder.httpscamino-goat-ladderworkersdev.workers.dev"],
    ["https://https://host.workers.dev", "https://host.workers.dev"],
    ["  https://host.workers.dev/api  ", "https://host.workers.dev"],
    ["https://host.workers.dev//", "https://host.workers.dev"],
    ["http://localhost:8787/", "http://localhost:8787"],
    ["https://host.workers.dev/prefijo/", "https://host.workers.dev/prefijo"],
    ["", ""],
    ["sin-esquema", ""]
  ];
  for (var i = 0; i < urls.length; i++) {
    var input = urls[i][0], expected = urls[i][1], used = null;
    var loaded = loadService({url: input, fetch: function (url) { used = url; return jsonResponse({entries: []}); }});
    if (loaded.service.available()) await loaded.service.list("player", "all-time").catch(function () {});
    check("URL " + JSON.stringify(input), (used ? used.replace(/\/api\/goat-ladder.*$/, "") : "") === expected, used);
  }

  console.log("Publicación");
  {
    var env1 = loadService({url: "https://api.test", fetch: function () {
      return jsonResponse({id: "abc", delete_token: "tok", goat_score: 12});
    }});
    var out = await env1.service.submit({event_key: "k", goat_score: 12}, "  Alias  ", "  Titulo ");
    check("el envío usa JSON como antes", env1.calls.length === 1 &&
      env1.calls[0].init.headers["Content-Type"] === "application/json",
      env1.calls[0] && env1.calls[0].init.headers);
    check("el cuerpo lleva el alias sin espacios", JSON.parse(env1.calls[0].init.body).display_name === "Alias");
    check("se guarda la clave de borrado", out.delete_token_saved === true);
  }
  {
    /* Fallo de red (preflight/CORS incluidos) -> se reintenta sin preflight como texto. */
    var seen = [];
    var env2 = loadService({url: "https://api.test", fetch: function (url, init, n) {
      seen.push(init.headers["Content-Type"]);
      if (n === 1) return networkError();
      return jsonResponse({id: "abc", delete_token: "t", goat_score: 1});
    }});
    var rescued = await env2.service.submitCareer({event_key: "career:1", history: [], metrics: {}}, "Alias", "Titulo");
    check("tras un fallo de red se reintenta sin preflight",
      seen.length === 2 && seen[0] === "application/json" && seen[1] === "text/plain;charset=UTF-8" && rescued.goat_score === 1, seen);
  }
  {
    /* Si el servicio rechaza el texto, se vuelve a JSON. */
    var types = [];
    var env2b = loadService({url: "https://api.test", fetch: function (url, init, n) {
      types.push(init.headers["Content-Type"]);
      if (n === 1) return networkError();
      if (n === 2) return jsonResponse({error: "unsupported media type"}, 415);
      return jsonResponse({id: "abc", delete_token: "t", goat_score: 1});
    }});
    await env2b.service.submitCareer({event_key: "career:1", history: [], metrics: {}}, "Alias", "Titulo");
    check("si el servicio exige JSON, el reintento vuelve a JSON",
      types.length === 3 && types[2] === "application/json", types);
  }

  console.log("Errores");
  {
    var env3 = loadService({url: "https://api.test", fetch: networkError});
    var error = null;
    try { await env3.service.submitCareer({event_key: "career:1", history: [], metrics: {}}, "Alias", "Titulo"); }
    catch (e) { error = e; }
    check("un corte de red acaba en un mensaje traducido", error && error.goatKind === "networkError" && error.message === "SIN_RED",
      error && error.message);
    check("un corte de red reintenta una sola vez", env3.calls.length === 2, env3.calls.length);
  }
  {
    var env4 = loadService({url: "https://api.test", online: false, fetch: networkError});
    var offline = null;
    try { await env4.service.submitCareer({event_key: "career:1"}, "Alias", "Titulo"); } catch (e) { offline = e; }
    check("sin conexión no se lanza ninguna petición", offline && offline.goatKind === "offlineError" && env4.calls.length === 0);
  }
  {
    var env5 = loadService({url: "https://api.test", fetch: function () {
      return Promise.reject(Object.assign(new Error("aborted"), {name: "AbortError"}));
    }});
    var abort = null;
    try { await env5.service.listCareers("player", "all-time", "appearances"); } catch (e) { abort = e; }
    check("una petición abortada se informa como tiempo agotado", abort && abort.goatKind === "timeoutError", abort && abort.message);
  }
  {
    var env6 = loadService({url: "https://api.test", fetch: function () {
      return Promise.resolve({ok: true, status: 200, text: function () { return Promise.resolve("<!doctype html>"); }});
    }});
    var html = null;
    try { await env6.service.list("player", "all-time"); } catch (e) { html = e; }
    check("una respuesta que no es JSON se detecta", html && html.goatKind === "responseError", html && html.message);
  }
  {
    var env7 = loadService({url: "https://api.test", fetch: function () { return jsonResponse({error: "Alias duplicado"}, 409); }});
    var rejected = null;
    try { await env7.service.submit({event_key: "k"}, "Alias", "Titulo"); } catch (e) { rejected = e; }
    check("se conserva el mensaje del servicio", rejected && rejected.message === "Alias duplicado" && rejected.status === 409);
  }
  {
    var env8 = loadService({url: "", fetch: networkError});
    var unset = null;
    try { await env8.service.submitCareer({event_key: "career:1"}, "Alias", "Titulo"); } catch (e) { unset = e; }
    check("servicio sin configurar: aviso claro", unset && unset.goatKind === "unavailable", unset && unset.message);
  }

  console.log("Carreras muy largas");
  {
    var seasons = [];
    for (var j = 0; j < 400; j++) seasons.push({season: 2000 + j, club: "Club " + j, competition: "Liga",
      trophies: ["Copa de Europa", "Liga"], appearances: 40, goals: 30, assists: 10, clean_sheets: 0,
      rating: 7.8, overall: 88, international_caps: 8, international_goals: 5,
      awards: ["Mejor jugador de la temporada " + j + " de la liga de prueba",
        "Equipo de la temporada " + j + " de la liga de prueba con nombre larguísimo",
        "Máximo goleador de la temporada " + j + " de la liga de prueba con nombre larguísimo"]});
    var body = null;
    var env9 = loadService({url: "https://api.test", fetch: function (url, init) {
      body = init.body;
      return jsonResponse({id: "x", delete_token: "y"});
    }});
    await env9.service.submitCareer({event_key: "career:1", game_mode: "player",
      metrics: {seasons: 400, goals: 12000}, history: seasons}, "Alias", "Titulo");
    var payload = JSON.parse(body);
    check("el envío no supera los 100 KB", Buffer.byteLength(body, "utf8") <= 100000, Buffer.byteLength(body, "utf8"));
    check("las métricas agregadas se mantienen", payload.metrics.goals === 12000 && payload.metrics.seasons === 400);
    check("se conservan las temporadas más recientes",
      payload.history[payload.history.length - 1].season === 2399 && payload.history.length < 400, payload.history.length);
    check("la carrera original no se modifica", seasons.length === 400);
  }

  console.log("Cliente incluido en la app (legacy-game)");
  {
    var managerSeasons = [];
    for (var k = 0; k < 31; k++) {
      var awards = [];
      for (var a = 0; a < 30; a++) awards.push("Premio de entrenador de la temporada " + k + " — " + "historial detallado ".repeat(8));
      managerSeasons.push({season: 2100 + k, club: "Club " + k, competition: "Liga", trophies: ["Liga"],
        awards: awards, award_keys: awards.map(function () { return "manager_award"; }), appearances: 50,
        wins: 35, draws: 8, losses: 7, goals: 95, assists: 0, clean_sheets: 0});
    }
    var managerCareer = {event_key: "career:manager:31", game_mode: "manager",
      metrics: {seasons: 31, wins: 1085, trophies: 31, awards: 930}, history: managerSeasons};
    var legacyBody = null;
    var legacyEnv = loadService({url: "https://api.test/api/", fetch: function (url, init, attempt) {
      if (attempt === 1) return networkError();
      legacyBody = init.body;
      return jsonResponse({id: "manager-31", delete_token: "token"});
    }}, "legacy-game/src/goat.js");
    var legacyResult = await legacyEnv.service.submitCareer(managerCareer, "  Míster  ", "  31 temporadas  ");
    var legacyPayload = JSON.parse(legacyBody);
    check("el cliente de la app reintenta Failed to fetch sin preflight",
      legacyEnv.calls.length === 2 && legacyEnv.calls[1].init.headers["Content-Type"] === "text/plain;charset=UTF-8",
      legacyEnv.calls.map(function (call) { return call.init.headers["Content-Type"]; }));
    check("publica una carrera manager en la ruta de carreras",
      legacyEnv.calls[0].url === "https://api.test/api/goat-ladder/careers" && legacyPayload.game_mode === "manager");
    check("recorta el historial extenso por debajo de 100 KB y conserva la temporada reciente",
      Buffer.byteLength(legacyBody, "utf8") <= 100000 && legacyPayload.history.length < 31 &&
      legacyPayload.history[legacyPayload.history.length - 1].season === 2130,
      {bytes: Buffer.byteLength(legacyBody, "utf8"), seasons: legacyPayload.history.length});
    check("conserva métricas agregadas y no muta el guardado del míster",
      legacyPayload.metrics.seasons === 31 && legacyPayload.metrics.awards === 930 &&
      managerCareer.history.length === 31 && legacyResult.id === "manager-31");
    check("normaliza la URL del cliente legacy",
      legacyEnv.calls[0].url.indexOf("/api/api/") < 0 && legacyEnv.calls[0].url.indexOf("/api/goat-ladder/careers") >= 0);
  }

  console.log("Envío Android nativo (sin CORS de origen file://)");
  for (var nativeSource of ["src/goat.js", "legacy-game/src/goat.js"]) {
    var nativeEnv;
    var nativeCalls = [];
    nativeEnv = loadService({url: "https://api.test", bridge: {
      goatCareerPost: function (requestId, body, contentType) {
        nativeCalls.push({requestId: requestId, body: body, contentType: contentType});
        Promise.resolve().then(function () {
          nativeEnv.window.__caminoGoatNativeComplete(requestId, 201,
            JSON.stringify({id: "native-career", delete_token: "native-token"}));
        });
      }
    }, fetch: function () { throw new Error("The Android bridge should bypass WebView fetch"); }}, nativeSource);
    var nativeResult = await nativeEnv.service.submitCareer({event_key: "career:native", game_mode: "manager",
      metrics: {seasons: 1}, history: [{season: 2129}]}, "Alias", "Career title");
    check("" + nativeSource + " career request uses AndroidBridge, not WebView CORS",
      nativeCalls.length === 1 && nativeCalls[0].contentType === "application/json" &&
      JSON.parse(nativeCalls[0].body).event_key === "career:native" && nativeResult.id === "native-career");
  }

  console.log(failures ? "\n" + failures + " comprobaciones fallidas" : "\nTodo correcto");
  process.exit(failures ? 1 : 0);
})();
