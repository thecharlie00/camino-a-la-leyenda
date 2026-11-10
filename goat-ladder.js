/* GOAT LADDER: ranking online de carreras y gestas.
   Sin dependencias. Lee window.GOAT_API_URL (servicio Cloudflare) y el idioma de
   <body data-lang>. Pinta las tarjetas con la API del DOM (nunca con innerHTML de
   datos ajenos), guarda la última respuesta en sessionStorage para pintar al
   instante y sobrevive a fallos de red con reintento y mensajes concretos. */
(function (root, doc) {
  "use strict";

  var PERIODS = [["all-time", "all"], ["30d", "d30"], ["7d", "d7"]];
  var METRICS = {
    player: [["appearances", "appearances"], ["goals", "goals"], ["assists", "assists"],
      ["trophies", "trophies"], ["awards", "awards"], ["clean_sheets", "clean_sheets"],
      ["international_caps", "international_caps"], ["international_goals", "international_goals"],
      ["clubs", "clubs"], ["seasons", "seasons"]],
    manager: [["wins", "wins"], ["draws", "draws"], ["losses", "losses"], ["trophies", "trophies"],
      ["unbeaten_seasons", "unbeaten_seasons"], ["promotions", "promotions"],
      ["win_percentage", "win_percentage"], ["clubs", "clubs"], ["seasons", "seasons"]]
  };

  /* Claves que añade el tablero a la tabla de textos compartida con el juego. */
  var EXTRA = {
    es: {
      all: "Todos", d30: "30 días", d7: "7 días", retry: "Reintentar", refreshing: "Actualizando…",
      updated: "Actualizado {when}", updatedNow: "ahora mismo", updatedMinutes: "hace {n} min",
      updatedHours: "hace {n} h", search: "Buscar por alias o club", searchLabel: "Buscar",
      clearSearch: "Ver todo",
      noResults: "Ningún resultado con «{q}».", share: "Compartir", shareCopied: "Enlace copiado",
      delete: "Eliminar mi entrada", deleteConfirm: "¿Quieres eliminar esta entrada del ranking?",
      deleteFailed: "No se pudo eliminar la entrada.", deleted: "Entrada eliminada",
      loadMore: "Ver más", howToTitle: "¿Cómo aparezco aquí?",
      howToBody: "Juega una temporada y publica tu carrera o tu última gesta desde GOAT LADDER en el menú del juego.",
      playCta: "Jugar ahora", countedShort: "{n} de {total}",
      networkError: "No se pudo conectar con el ranking. Comprueba tu conexión y vuelve a intentarlo.",
      timeoutError: "El ranking está tardando demasiado en responder. Vuelve a intentarlo.",
      offlineError: "Parece que no hay conexión. Conéctate a internet y vuelve a intentarlo.",
      responseError: "El ranking devolvió una respuesta no válida. Vuelve a intentarlo más tarde.",
      serverError: "El ranking no está disponible en este momento. Vuelve a intentarlo en un rato."
    },
    en: {
      all: "All", d30: "30 days", d7: "7 days", retry: "Try again", refreshing: "Refreshing…",
      updated: "Updated {when}", updatedNow: "just now", updatedMinutes: "{n} min ago",
      updatedHours: "{n} h ago", search: "Search by alias or club", searchLabel: "Search",
      clearSearch: "Show all",
      noResults: "No results for “{q}”.", share: "Share", shareCopied: "Link copied",
      delete: "Delete my entry", deleteConfirm: "Delete this entry from the ranking?",
      deleteFailed: "The entry could not be deleted.", deleted: "Entry deleted",
      loadMore: "Show more", howToTitle: "How do I get listed?",
      howToBody: "Play a season and publish your career or latest achievement from GOAT LADDER in the game menu.",
      playCta: "Play now", countedShort: "{n} of {total}",
      networkError: "Could not reach the ranking. Check your connection and try again.",
      timeoutError: "The ranking is taking too long to respond. Please try again.",
      offlineError: "You appear to be offline. Connect to the internet and try again.",
      responseError: "The ranking returned an invalid response. Please try again later.",
      serverError: "The ranking is unavailable right now. Please try again in a moment."
    },
    de: {
      all: "Alle", d30: "30 Tage", d7: "7 Tage", retry: "Erneut versuchen", refreshing: "Aktualisieren…",
      updated: "Aktualisiert {when}", updatedNow: "gerade eben", updatedMinutes: "vor {n} Min.",
      updatedHours: "vor {n} Std.", search: "Nach Alias oder Verein suchen", searchLabel: "Suchen",
      clearSearch: "Alle anzeigen",
      noResults: "Keine Treffer für „{q}“.", share: "Teilen", shareCopied: "Link kopiert",
      delete: "Meinen Eintrag löschen", deleteConfirm: "Diesen Eintrag aus der Rangliste löschen?",
      deleteFailed: "Der Eintrag konnte nicht gelöscht werden.", deleted: "Eintrag gelöscht",
      loadMore: "Mehr anzeigen", howToTitle: "Wie komme ich hierher?",
      howToBody: "Spiele eine Saison und veröffentliche deine Karriere oder deinen letzten Erfolg über GOAT LADDER im Spielmenü.",
      playCta: "Jetzt spielen", countedShort: "{n} von {total}",
      networkError: "Keine Verbindung zur Rangliste. Prüfe deine Verbindung und versuche es erneut.",
      timeoutError: "Die Rangliste antwortet zu langsam. Bitte versuche es erneut.",
      offlineError: "Du bist offline. Stelle eine Internetverbindung her und versuche es erneut.",
      responseError: "Die Rangliste hat eine ungültige Antwort geliefert. Versuche es später erneut.",
      serverError: "Die Rangliste ist gerade nicht verfügbar. Versuche es gleich noch einmal."
    },
    it: {
      all: "Tutti", d30: "30 giorni", d7: "7 giorni", retry: "Riprova", refreshing: "Aggiornamento…",
      updated: "Aggiornata {when}", updatedNow: "adesso", updatedMinutes: "{n} min fa",
      updatedHours: "{n} h fa", search: "Cerca per alias o club", searchLabel: "Cerca",
      clearSearch: "Mostra tutto",
      noResults: "Nessun risultato per «{q}».", share: "Condividi", shareCopied: "Link copiato",
      delete: "Elimina la mia voce", deleteConfirm: "Eliminare questa voce dalla classifica?",
      deleteFailed: "Impossibile eliminare la voce.", deleted: "Voce eliminata",
      loadMore: "Mostra altro", howToTitle: "Come compaio qui?",
      howToBody: "Gioca una stagione e pubblica la tua carriera o la tua ultima impresa da GOAT LADDER nel menu del gioco.",
      playCta: "Gioca ora", countedShort: "{n} di {total}",
      networkError: "Impossibile raggiungere la classifica. Controlla la connessione e riprova.",
      timeoutError: "La classifica sta impiegando troppo a rispondere. Riprova.",
      offlineError: "Sembra che tu non sia connesso. Connettiti a internet e riprova.",
      responseError: "La classifica ha restituito una risposta non valida. Riprova più tardi.",
      serverError: "La classifica non è disponibile in questo momento. Riprova tra poco."
    },
    fr: {
      all: "Tous", d30: "30 jours", d7: "7 jours", retry: "Réessayer", refreshing: "Actualisation…",
      updated: "Actualisé {when}", updatedNow: "à l'instant", updatedMinutes: "il y a {n} min",
      updatedHours: "il y a {n} h", search: "Rechercher un alias ou un club", searchLabel: "Rechercher",
      clearSearch: "Tout afficher",
      noResults: "Aucun résultat pour « {q} ».", share: "Partager", shareCopied: "Lien copié",
      delete: "Supprimer mon entrée", deleteConfirm: "Supprimer cette entrée du classement ?",
      deleteFailed: "Impossible de supprimer l'entrée.", deleted: "Entrée supprimée",
      loadMore: "Afficher plus", howToTitle: "Comment apparaître ici ?",
      howToBody: "Joue une saison et publie ta carrière ou ton dernier exploit depuis GOAT LADDER dans le menu du jeu.",
      playCta: "Jouer maintenant", countedShort: "{n} sur {total}",
      networkError: "Impossible de joindre le classement. Vérifie ta connexion et réessaie.",
      timeoutError: "Le classement met trop de temps à répondre. Réessaie.",
      offlineError: "Tu sembles hors ligne. Connecte-toi à internet et réessaie.",
      responseError: "Le classement a renvoyé une réponse invalide. Réessaie plus tard.",
      serverError: "Le classement est indisponible pour le moment. Réessaie dans un instant."
    }
  };

  var PAGE_SIZE = 12;
  var CACHE_TTL = 2 * 60 * 1000;
  var STALE_AFTER = 10 * 60 * 1000;
  var REQUEST_TIMEOUT = 15000;
  var TOKEN_KEY = "camino.goat.deleteTokens";
  var CACHE_PREFIX = "camino.goatWeb.";

  var lang = "es", origin = "", started = false, T = {};

  function buildText() {
    var base = text[lang] || text.es, own = EXTRA[lang] || EXTRA.es, out = {};
    Object.keys(base).forEach(function (key) { out[key] = base[key]; });
    Object.keys(own).forEach(function (key) { out[key] = own[key]; });
    T = out;
  }
  function t(key, params) {
    var value = T[key];
    if (value == null) value = EXTRA.es[key] != null ? EXTRA.es[key] : text.es[key];
    if (value == null) return key;
    if (params) value = String(value).replace(/\{(\w+)\}/g, function (m, k) { return params[k] == null ? m : String(params[k]); });
    return String(value);
  }

  /* ---------------- utilidades puras (probadas en test/goat-web.js) ---------------- */

  function normalizeOrigin(value) {
    var raw = String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
    if (!raw) return "";
    var secure = !/^http:\/\//i.test(raw);
    var host = raw.replace(/^(?:https?:)?[:\/]+/i, "");
    while (/^https?[:\/]/i.test(host)) host = host.replace(/^https?[:\/]+/i, "");
    host = host.replace(/\/+$/, "");
    if (!/^[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i.test(host)) return "";
    var hostname = host.split(/[\/:]/)[0];
    if (!hostname || (hostname !== "localhost" && hostname.indexOf(".") < 0)) return "";
    var parsed;
    try { parsed = new URL((secure ? "https://" : "http://") + host); } catch (error) { return ""; }
    var base = (parsed.origin + parsed.pathname).replace(/\/+$/, "");
    if (/\/api$/i.test(base)) base = base.replace(/\/api$/i, "");
    return base;
  }

  function readQuery(search) {
    var out = {}, pairs = String(search == null ? "" : search).replace(/^\?/, "").split("&");
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) continue;
      var at = pairs[i].indexOf("="), key = at < 0 ? pairs[i] : pairs[i].slice(0, at);
      var val = at < 0 ? "" : pairs[i].slice(at + 1);
      try { key = decodeURIComponent(key.replace(/\+/g, " ")); val = decodeURIComponent(val.replace(/\+/g, " ")); } catch (error) {}
      if (key) out[key] = val;
    }
    return out;
  }

  function sanitizeState(query, current) {
    var q = query || {};
    var board = q.board === "achievements" || q.board === "careers" ? q.board : (current && current.board) || "careers";
    var mode = q.mode === "manager" || q.mode === "player" ? q.mode : (current && current.mode) || "player";
    var period = "", metric = "";
    for (var p = 0; p < PERIODS.length; p++) if (q.period === PERIODS[p][0]) period = q.period;
    if (!period && current && current.period) period = current.period;
    if (!period) period = "all-time";
    var allowed = METRICS[mode].map(function (item) { return item[0]; });
    if (q.metric && allowed.indexOf(q.metric) >= 0) metric = q.metric;
    else if (current && current.metric && allowed.indexOf(current.metric) >= 0) metric = current.metric;
    else metric = METRICS[mode][0][0];
    var search = typeof q.q === "string" ? q.q.slice(0, 40) : (current && current.search) || "";
    var entry = typeof q.entry === "string" ? q.entry.slice(0, 64) : "";
    return {board: board, mode: mode, period: period, metric: metric, search: search, entry: entry};
  }

  function metricLabelKey(state) {
    var list = METRICS[state.mode] || METRICS.player;
    for (var i = 0; i < list.length; i++) if (list[i][0] === state.metric) return list[i][1];
    return "seasons";
  }

  function apiPath(state) {
    if (state.board === "achievements") {
      return "/api/goat-ladder?mode=" + encodeURIComponent(state.mode) +
        "&timeframe=" + encodeURIComponent(state.period);
    }
    return "/api/goat-ladder/careers?mode=" + encodeURIComponent(state.mode) +
      "&timeframe=" + encodeURIComponent(state.period) + "&metric=" + encodeURIComponent(state.metric);
  }

  function cacheKey(state) {
    return CACHE_PREFIX + state.board + "|" + state.mode + "|" + state.period + "|" +
      (state.board === "careers" ? state.metric : "-");
  }

  function classify(error) {
    if (!error) return "serverError";
    if (error.goatKind) return error.goatKind;
    if (error.name === "AbortError") return "timeoutError";
    if (error.name === "TimeoutError") return "timeoutError";
    if (root.navigator && root.navigator.onLine === false) return "offlineError";
    if (typeof TypeError === "function" && error instanceof TypeError) return "networkError";
    if (/load failed|failed to fetch|networkerror|network request failed|network unavailable|fetch failed/i.test(String(error.message || ""))) return "networkError";
    /* cualquier fallo sin respuesta HTTP es de red (incluye TypeError de otro contexto/WebView) */
    if (!error.status && !error.goatKind) return "networkError";
    return "serverError";
  }

  function timeAgo(stamp, now) {
    var seconds = Math.max(0, Math.round(((now || Date.now()) - stamp) / 1000));
    if (seconds < 45) return "now";
    var minutes = Math.round(seconds / 60);
    if (minutes < 60) return "m" + Math.max(1, minutes);
    return "h" + Math.round(minutes / 60);
  }

  function groupHonours(seasons, key) {
    var map = {};
    (seasons || []).forEach(function (season) {
      var list = Array.isArray(season && season[key]) ? season[key] : [];
      list.forEach(function (name) {
        var label = String(name == null ? "" : name);
        if (!label) return;
        map[label] = (map[label] || 0) + 1;
      });
    });
    return Object.keys(map).map(function (name) { return {name: name, count: map[name]}; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  }

  function matchesSearch(entry, term) {
    var needle = String(term == null ? "" : term).replace(/^\s+|\s+$/g, "").toLowerCase();
    if (!needle) return true;
    var fields = [entry.display_name, entry.title, entry.current_club, entry.club_name,
      entry.competition_name, entry.opponent_name, entry.started_season, entry.latest_season];
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] == null) continue;
      if (String(fields[i]).toLowerCase().indexOf(needle) >= 0) return true;
    }
    return false;
  }

  /* Texto para el visitante: el del servicio solo si es un error suyo con mensaje propio. */
  function describe(problem) {
    var kind = classify(problem);
    if ((kind === "serverError" || kind === "responseError") && problem && problem.status != null &&
        problem.message && problem.message !== t(kind)) return problem.message;
    return t(kind);
  }

  function failure(kind, extra) {
    var error = new Error(t(kind));
    error.goatKind = kind;
    if (extra && extra.status != null) error.status = extra.status;
    return error;
  }
  function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function timedFetch(url, options, timeout) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var copy = {};
    Object.keys(options || {}).forEach(function (key) { copy[key] = options[key]; });
    if (controller) copy.signal = controller.signal;
    var timer = 0;
    if (controller) timer = setTimeout(function () { controller.abort(); }, timeout || REQUEST_TIMEOUT);
    return root.fetch(url, copy).then(function (response) {
      if (timer) clearTimeout(timer);
      return response;
    }, function (error) {
      if (timer) clearTimeout(timer);
      throw error;
    });
  }

  function readResponse(response) {
    var body;
    if (response && typeof response.json === "function") {
      body = response.json().then(function (data) { return data; }, function () { return null; });
    } else {
      body = response.text().then(function (text) {
        try { return text ? JSON.parse(text) : null; } catch (error) { return null; }
      });
    }
    return body.then(function (data) {
      if (!response.ok) {
        var message = data && typeof data.error === "string" ? data.error : "";
        var error = failure(message ? "serverError" : "responseError", {status: response.status});
        if (message) error.message = message;
        throw error;
      }
      if (!data || typeof data !== "object") throw failure("responseError");
      return data;
    });
  }

  function request(path, options) {
    if (!origin) return Promise.reject(failure("unavailable"));
    var url = origin + path;
    var opts = options || {};
    /* Un corte de red se reintenta una vez (400 ms); el resto de fallos se informa tal cual. */
    function attempt(retried) {
      return timedFetch(url, {method: opts.method || "GET", headers: opts.headers}, opts.timeout)
        .catch(function (error) {
          if (error && error.name === "AbortError") throw failure("timeoutError");
          /* sin respuesta HTTP el fallo es de red: se reintenta una vez */
          if (error && !error.goatKind && !retried && error.name !== "AbortError") {
            return delay(400).then(function () { return attempt(true); });
          }
          throw error;
        });
    }
    return attempt(false).then(readResponse).catch(function (error) {
      if (error && !error.goatKind && error.status >= 500) throw failure("serverError", {status: error.status});
      throw error;
    });
  }

  /* ---------------- caché y tokens ---------------- */

  function cacheGet(key) {
    try {
      var raw = root.sessionStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.entries)) return null;
      return parsed;
    } catch (error) { return null; }
  }
  function cacheSet(key, entries) {
    try { root.sessionStorage.setItem(key, JSON.stringify({at: Date.now(), entries: entries})); } catch (error) {}
  }
  function cacheDrop(key) {
    try { root.sessionStorage.removeItem(key); } catch (error) {}
  }
  /* Los tokens de borrado son los mismos que guarda el juego en este navegador. */
  function tokens() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(TOKEN_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) { return {}; }
  }
  function canDelete(id) { return !!tokens()[id]; }
  function forgetToken(id) {
    var map = tokens();
    delete map[id];
    try { root.localStorage.setItem(TOKEN_KEY, JSON.stringify(map)); } catch (error) {}
  }

  /* ---------------- estado ---------------- */

  var els = {};
  var state = {board: "careers", mode: "player", period: "all-time", metric: "appearances", search: "", entry: ""};
  var entries = [];
  var shown = PAGE_SIZE;
  var loading = false;
  var error = "";
  var updatedAt = 0;
  var requestId = 0;
  var toastTimer = 0;

  var text = {
    es: {honours:"Palmarés", honoursTeam:"Títulos colectivos", honoursInd:"Títulos individuales", loading:"Cargando ranking…", error:"No se pudo cargar el ranking.", timeout:"El ranking está tardando demasiado. Comprueba la conexión y vuelve a intentarlo.", unavailable:"El ranking no está configurado en este momento.", empty:"Aún no hay carreras en este ranking.", emptyAchievements:"Aún no hay gestas en este ranking.", unverified:"Sin verificar · enviado por la comunidad", score:"GOAT SCORE", match:"Partido", season:"Temporada", goals:"Goles", assists:"Asistencias", rating:"Valoración", minutes:"Minutos", result:"Resultado", record:"Balance", position:"Posición", club:"Club", competition:"Competición", opponent:"Rival", seasons:"Temporadas", appearances:"Partidos", clean_sheets:"Porterías a cero", trophies:"Títulos", awards:"Premios", international_caps:"Partidos internacionales", international_goals:"Goles internacionales", wins:"Victorias", draws:"Empates", losses:"Derrotas", unbeaten_seasons:"Temporadas invictas", promotions:"Ascensos", clubs:"Clubes", win_percentage:"Porcentaje de victorias", history:"Historial de temporadas", promoted:"Ascenso", goals_for:"Goles a favor", goals_against:"Goles en contra", career:"Carrera", metric:"Métrica"},

    en: {honours:"Honours", honoursTeam:"Team titles", honoursInd:"Individual awards", loading:"Loading ranking…", error:"The ranking could not be loaded.", timeout:"The ranking is taking too long to respond. Check your connection and try again.", unavailable:"The ranking is not configured right now.", empty:"There are no careers in this ranking yet.", emptyAchievements:"There are no achievements in this ranking yet.", unverified:"Unverified · community-reported", score:"GOAT SCORE", match:"Match", season:"Season", goals:"Goals", assists:"Assists", rating:"Rating", minutes:"Minutes", result:"Result", record:"Record", position:"Position", club:"Club", competition:"Competition", opponent:"Opponent", seasons:"Seasons", appearances:"Appearances", clean_sheets:"Clean sheets", trophies:"Trophies", awards:"Awards", international_caps:"International appearances", international_goals:"International goals", wins:"Wins", draws:"Draws", losses:"Losses", unbeaten_seasons:"Unbeaten seasons", promotions:"Promotions", clubs:"Clubs", win_percentage:"Win percentage", history:"Season history", promoted:"Promoted", goals_for:"Goals for", goals_against:"Goals against", career:"Career", metric:"Metric"},
    de: {honours:"Erfolge", honoursTeam:"Mannschaftstitel", honoursInd:"Einzelauszeichnungen", loading:"Rangliste wird geladen…", error:"Die Rangliste konnte nicht geladen werden.", timeout:"Die Rangliste braucht zu lange. Prüfe deine Verbindung und versuche es erneut.", unavailable:"Die Rangliste ist momentan nicht konfiguriert.", empty:"Noch keine Karrieren in dieser Rangliste.", emptyAchievements:"Noch keine Erfolge in dieser Rangliste.", unverified:"Nicht verifiziert · von der Community gemeldet", score:"GOAT SCORE", match:"Spiel", season:"Saison", goals:"Tore", assists:"Vorlagen", rating:"Bewertung", minutes:"Minuten", result:"Ergebnis", record:"Bilanz", position:"Platz", club:"Verein", competition:"Wettbewerb", opponent:"Gegner", seasons:"Saisons", appearances:"Einsätze", clean_sheets:"Zu-Null-Spiele", trophies:"Titel", awards:"Auszeichnungen", international_caps:"Länderspiele", international_goals:"Länderspieltore", wins:"Siege", draws:"Unentschieden", losses:"Niederlagen", unbeaten_seasons:"Ungeschlagene Saisons", promotions:"Aufstiege", clubs:"Vereine", win_percentage:"Siegquote", history:"Saisonverlauf", promoted:"Aufgestiegen", goals_for:"Tore", goals_against:"Gegentore", career:"Karriere", metric:"Kennzahl"},
    it: {honours:"Palmarès", honoursTeam:"Titoli di squadra", honoursInd:"Premi individuali", loading:"Caricamento classifica…", error:"Impossibile caricare la classifica.", timeout:"La classifica impiega troppo a rispondere. Controlla la connessione e riprova.", unavailable:"La classifica non è configurata al momento.", empty:"Non ci sono ancora carriere in questa classifica.", emptyAchievements:"Non ci sono ancora imprese in questa classifica.", unverified:"Non verificato · segnalato dalla community", score:"GOAT SCORE", match:"Partita", season:"Stagione", goals:"Gol", assists:"Assist", rating:"Voto", minutes:"Minuti", result:"Risultato", record:"Bilancio", position:"Posizione", club:"Club", competition:"Competizione", opponent:"Avversario", seasons:"Stagioni", appearances:"Presenze", clean_sheets:"Partite senza subire gol", trophies:"Titoli", awards:"Premi", international_caps:"Presenze internazionali", international_goals:"Gol internazionali", wins:"Vittorie", draws:"Pareggi", losses:"Sconfitte", unbeaten_seasons:"Stagioni imbattute", promotions:"Promozioni", clubs:"Club", win_percentage:"Percentuale vittorie", history:"Storico stagioni", promoted:"Promosso", goals_for:"Gol fatti", goals_against:"Gol subiti", career:"Carriera", metric:"Metrica"},
    fr: {honours:"Palmarès", honoursTeam:"Titres collectifs", honoursInd:"Distinctions individuelles", loading:"Chargement du classement…", error:"Impossible de charger le classement.", timeout:"Le classement met trop de temps à répondre. Vérifie ta connexion et réessaie.", unavailable:"Le classement n'est pas configuré pour le moment.", empty:"Aucune carrière dans ce classement pour le moment.", emptyAchievements:"Aucun exploit dans ce classement pour le moment.", unverified:"Non vérifié · déclaré par la communauté", score:"GOAT SCORE", match:"Match", season:"Saison", goals:"Buts", assists:"Passes décisives", rating:"Note", minutes:"Minutes", result:"Résultat", record:"Bilan", position:"Position", club:"Club", competition:"Compétition", opponent:"Adversaire", seasons:"Saisons", appearances:"Apparitions", clean_sheets:"Matchs sans encaisser", trophies:"Titres", awards:"Récompenses", international_caps:"Sélections", international_goals:"Buts internationaux", wins:"Victoires", draws:"Matchs nuls", losses:"Défaites", unbeaten_seasons:"Saisons sans défaite", promotions:"Promotions", clubs:"Clubs", win_percentage:"Pourcentage de victoires", history:"Historique des saisons", promoted:"Promu", goals_for:"Buts marqués", goals_against:"Buts encaissés", career:"Carrière", metric:"Statistique"}
  };

  /* ---------------- pintado de tarjetas (misma ficha que en el juego) ---------------- */

  function node(tag, className, value) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (value != null) el.textContent = String(value);
    return el;
  }
  function stat(container, label, value) {
    if (value == null || value === "") return;
    var item = node("span", "goat-stat");
    item.appendChild(node("small", "", label));
    item.appendChild(node("b", "", value));
    container.appendChild(item);
  }
  function metricValue(metrics, key) {
    var value = metrics ? metrics[key] : null;
    return key === "win_percentage" && value != null ? value + "%" : value;
  }
  /* Icono pixelado del trofeo/premio (pixel.js). Sin pixel.js se muestra el nombre. */
  function honourIcon(name, key, individual) {
    var label = String(name == null ? "" : name);
    var item = node("span", "goat-hon-ico");
    item.title = label;
    if (root.PX && typeof root.PX.trophy === "function") {
      try {
        var useKey = typeof key === "string" && key ? key : (root.PX.guessKey ? root.PX.guessKey(label, !!individual) : "");
        var holder = doc.createElement("span");
        holder.innerHTML = root.PX.trophy(useKey, 22, label);
        if (holder.firstChild) {
          item.appendChild(holder.firstChild);
          return item;
        }
      } catch (error) { /* se cae al texto */ }
    }
    item.className = "goat-hon-ico is-text";
    item.textContent = label;
    return item;
  }
  function honourList(names, keys, individual, label) {
    var wrap = node("div", "goat-season-honours");
    wrap.appendChild(node("span", "goat-hon-label", label));
    (names || []).forEach(function (name, index) {
      wrap.appendChild(honourIcon(name, keys ? keys[index] : "", individual));
    });
    return wrap;
  }
  function seasonHistory(entry) {
    var details = node("details", "goat-career-history");
    var summary = node("summary", "", T.history);
    details.appendChild(summary);
    (entry.history || []).slice().reverse().forEach(function (season) {
      var row = node("p", "goat-season-row");
      var head = [season.season, season.club, season.competition].filter(Boolean).join(" · ");
      row.appendChild(node("strong", "", head));
      var values = [];
      function addValue(label, value) { if (value != null && value !== "") values.push(label + ": " + value); }
      if (entry.game_mode === "player") {
        addValue(T.appearances, season.appearances); addValue(T.goals, season.goals); addValue(T.assists, season.assists);
        if (season.trophies && season.trophies.length) addValue(T.trophies, season.trophies.length);
      } else {
        if (season.wins != null || season.draws != null || season.losses != null) {
          addValue(T.wins + "/" + T.draws + "/" + T.losses, [season.wins, season.draws, season.losses].map(function (n) { return n == null ? "—" : n; }).join("-"));
        }
        addValue(T.goals_for, season.goals_for); addValue(T.goals_against, season.goals_against);
      }
      if (season.position != null) values.push(T.position + ": " + season.position);
      if (season.promoted) values.push(T.promoted);
      row.appendChild(node("span", "", values.join(" · ")));
      if (season.trophies && season.trophies.length) {
        row.appendChild(honourList(season.trophies, season.trophy_keys, false, T.trophies));
      }
      if (season.awards && season.awards.length) {
        row.appendChild(honourList(season.awards, season.award_keys, true, T.awards));
      }
      details.appendChild(row);
    });
    return details;
  }
  /* Palmarés con trofeos pixelados (pixel.js + trophies.js, si están en la página). */
  function honours(entry) {
    var wrap = node("div", "goat-honours");
    if (!root.PX || !root.PX.honours) return wrap;
    var list = root.PX.honours(entry.history || []) || [];
    if (!list.length) return wrap;
    wrap.appendChild(node("div", "goat-hon-t", T.honours));
    [false, true].forEach(function (ind) {
      var items = list.filter(function (h) { return h.ind === ind; });
      if (!items.length) return;
      wrap.appendChild(node("div", "goat-hon-h", ind ? T.honoursInd : T.honoursTeam));
      var row = node("div", "goat-hon");
      items.forEach(function (h) {
        var item = node("span", "goat-hon-i");
        var years = (h.years || []).filter(function (y, i, a) { return a.indexOf(y) === i; }).join(", ");
        item.title = h.name + (years ? " · " + years : "");
        try {
          var icon = doc.createElement("span");
          icon.innerHTML = root.PX.trophy(h.key, 30, h.name);
          if (icon.firstChild) item.appendChild(icon.firstChild);
        } catch (problem) { /* sin icono, el nombre sigue siendo legible */ }
        var label = node("span", "");
        label.appendChild(node("b", "", h.name));
        if (h.n > 1) label.appendChild(node("em", "", "×" + h.n));
        item.appendChild(label);
        row.appendChild(item);
      });
      wrap.appendChild(row);
    });
    return wrap;
  }
  function actions(entry) {
    var wrap = node("div", "goat-actions");
    var shareButton = node("button", "linkbtn goat-share", "🔗 " + T.share);
    shareButton.type = "button";
    shareButton.setAttribute("data-goat-share", entry.id);
    wrap.appendChild(shareButton);
    if (canDelete(entry.id)) {
      var removeButton = node("button", "linkbtn goat-remove", "🗑️ " + T.delete);
      removeButton.type = "button";
      removeButton.setAttribute("data-goat-delete", entry.id);
      wrap.appendChild(removeButton);
    }
    return wrap;
  }
  function cardFor(entry) {
    return node("article", "goat-card" + (state.entry && state.entry === entry.id ? " is-selected" : ""));
  }
  function careerCard(entry, index) {
    var article = cardFor(entry);
    if (entry.id) article.id = "goat-entry-" + entry.id;
    var head = node("div", "goat-card-head");
    head.appendChild(node("span", "goat-rank", "#" + (index + 1) + " · " + T.career));
    head.appendChild(node("strong", "goat-score", metricValue(entry.metrics || {}, state.metric) + " " + T[state.metric]));
    article.appendChild(head);
    article.appendChild(node("h2", "goat-card-title", entry.title));
    article.appendChild(node("p", "goat-card-meta", [entry.display_name, entry.current_club,
      entry.started_season + "–" + entry.latest_season].filter(Boolean).join(" · ")));
    var stats = node("div", "goat-stats"), metrics = entry.metrics || {};
    (entry.game_mode === "player"
      ? ["seasons", "appearances", "goals", "assists", "clean_sheets", "trophies", "awards", "international_caps", "international_goals", "clubs"]
      : ["seasons", "wins", "draws", "losses", "trophies", "unbeaten_seasons", "promotions", "clubs", "win_percentage"]
    ).forEach(function (key) { stat(stats, T[key], metricValue(metrics, key)); });
    article.appendChild(stats);
    article.appendChild(honours(entry));
    article.appendChild(seasonHistory(entry));
    article.appendChild(node("p", "goat-unverified", T.unverified));
    article.appendChild(actions(entry));
    return article;
  }
  function achievementCard(entry, index) {
    var article = cardFor(entry);
    if (entry.id) article.id = "goat-entry-" + entry.id;
    var head = node("div", "goat-card-head");
    head.appendChild(node("span", "goat-rank", "#" + (index + 1) + " · " + T[entry.event_type === "season" ? "season" : "match"]));
    head.appendChild(node("strong", "goat-score", entry.goat_score + " " + T.score));
    article.appendChild(head);
    article.appendChild(node("h2", "goat-card-title", entry.title));
    article.appendChild(node("p", "goat-card-meta", [entry.display_name, entry.club_name, entry.competition_name].filter(Boolean).join(" · ")));
    var stats = node("div", "goat-stats"), values = entry.metrics || {};
    if (entry.game_mode === "player") {
      stat(stats, T.goals, values.goals); stat(stats, T.assists, values.assists);
      stat(stats, T.rating, values.match_rating == null ? null : Number(values.match_rating).toFixed(1));
      stat(stats, T.minutes, values.minutes_played);
    } else if (entry.event_type === "season") {
      stat(stats, T.record, [values.wins, values.draws, values.losses].join("-"));
      stat(stats, T.position, values.league_position);
    } else {
      stat(stats, T.result, values.own_score + "–" + values.opponent_score);
    }
    article.appendChild(stats);
    article.appendChild(node("p", "goat-unverified", T.unverified));
    article.appendChild(actions(entry));
    return article;
  }
  function skeleton() {
    var article = node("article", "goat-card goat-skeleton");
    article.setAttribute("aria-hidden", "true");
    ["sk sk-a", "sk sk-b", "sk sk-c", "sk sk-d"].forEach(function (name) {
      article.appendChild(node("span", name));
    });
    return article;
  }

  /* ---------------- estado en pantalla ---------------- */

  function visibleEntries() {
    return entries.filter(function (entry) { return matchesSearch(entry, state.search); });
  }
  function updatedLabel() {
    if (!updatedAt) return "";
    var ago = timeAgo(updatedAt);
    var when = ago === "now" ? t("updatedNow")
      : ago.charAt(0) === "m" ? t("updatedMinutes", {n: ago.slice(1)})
      : t("updatedHours", {n: ago.slice(1)});
    return t("updated", {when: when});
  }
  function toast(message) {
    var box = doc.getElementById("goat-toast");
    if (!box) {
      box = node("div", "goat-toast");
      box.id = "goat-toast";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      (doc.querySelector(".goat-page") || doc.body || doc.documentElement).appendChild(box);
    }
    box.textContent = message;
    box.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove("is-on"); }, 2600);
  }
  function howToCard() {
    var card = node("aside", "goat-howto goat-howto-top");
    card.appendChild(node("b", "", t("howToTitle")));
    card.appendChild(doc.createTextNode ? doc.createTextNode(" " + t("howToBody") + " ") : node("span", "", " " + t("howToBody") + " "));
    var cta = node("a", "btn sm", t("playCta"));
    cta.href = "../jugar/";
    card.appendChild(cta);
    return card;
  }
  function paintFilters() {
    var groups = [["board", ["data-board"]], ["mode", ["data-mode"]], ["period", ["data-period"]]];
    groups.forEach(function (group) {
      var buttons = doc.querySelectorAll("[" + group[1][0] + "]");
      for (var i = 0; i < buttons.length; i++) {
        var value = buttons[i].getAttribute(group[1][0]);
        buttons[i].setAttribute("aria-pressed", String(state[group[0]] === value));
      }
    });
    if (els.metric) {
      var choices = METRICS[state.mode];
      els.metric.replaceChildren ? els.metric.replaceChildren() : (els.metric.innerHTML = "");
      choices.forEach(function (item) {
        var option = node("option", "", t(item[1]));
        option.value = item[0];
        option.selected = state.metric === item[0];
        els.metric.appendChild(option);
      });
      els.metric.value = state.metric;
      els.metric.disabled = state.board !== "careers";
    }
    if (els.metricLabel) els.metricLabel.hidden = state.board !== "careers";
    if (els.label) els.label.textContent = t("metric");
    if (els.search && els.search.value !== state.search) els.search.value = state.search;
  }
  function paintStatus() {
    if (els.status) {
      var bits = [];
      if (loading && entries.length) bits.push(t("refreshing"));
      else if (loading) bits.push(t("loading"));
      if (state.search && entries.length) bits.push(t("countedShort", {n: visibleEntries().length, total: entries.length}));
      els.status.textContent = bits.join(" · ");
    }
    if (els.updated) els.updated.textContent = !loading && !error && updatedAt ? updatedLabel() : "";
    if (els.updated && updatedAt) els.updated.title = new Date(updatedAt).toLocaleString();
  }
  function clearList() {
    if (!els.list) return;
    if (els.list.replaceChildren) els.list.replaceChildren();
    else els.list.innerHTML = "";
  }
  function paintError() {
    clearList();
    var box = node("div", "goat-error-state");
    box.setAttribute("role", "alert");
    box.appendChild(node("p", "", error));
    var retryButton = node("button", "btn pri sm", t("retry"));
    retryButton.type = "button";
    retryButton.setAttribute("data-goat-retry", "1");
    box.appendChild(retryButton);
    els.list.appendChild(box);
    if (els.retry) els.retry.hidden = true;
  }
  function paintEmpty() {
    clearList();
    var box = node("div", "goat-empty");
    if (state.search && entries.length) {
      box.appendChild(node("p", "", t("noResults", {q: state.search})));
      var clear = node("button", "linkbtn", t("clearSearch"));
      clear.type = "button";
      clear.setAttribute("data-goat-clear", "1");
      box.appendChild(clear);
    } else {
      box.appendChild(node("p", "", t(state.board === "careers" ? "empty" : "emptyAchievements")));
      var help = node("div", "goat-howto");
      help.appendChild(node("b", "", t("howToTitle")));
      help.appendChild(node("span", "", " " + t("howToBody")));
      box.appendChild(help);
      var cta = node("a", "btn pri sm", t("playCta"));
      cta.href = "../jugar/";
      box.appendChild(cta);
    }
    els.list.appendChild(box);
    if (els.retry) els.retry.hidden = true;
  }
  function paint() {
    if (!els.list) return;
    if (error) { paintError(); paintStatus(); return; }
    if (loading && !entries.length) {
      clearList();
      for (var s = 0; s < 3; s++) els.list.appendChild(skeleton());
      if (els.retry) els.retry.hidden = true;
      paintStatus();
      return;
    }
    var list = visibleEntries();
    if (!list.length) { paintEmpty(); paintStatus(); return; }
    /* Si el enlace compartido apunta más abajo, se amplía la página hasta esa entrada. */
    if (state.entry) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === state.entry && i >= shown) { shown = i + 1; break; }
      }
    }
    var page = list.slice(0, shown);
    clearList();
    page.forEach(function (entry, index) {
      els.list.appendChild(state.board === "careers" ? careerCard(entry, index) : achievementCard(entry, index));
    });
    if (list.length > page.length) {
      var more = node("button", "btn wide goat-more", t("loadMore"));
      more.type = "button";
      more.setAttribute("data-goat-more", "1");
      els.list.appendChild(more);
    }
    if (els.retry) els.retry.hidden = true;
    paintStatus();
    highlightSelected();
  }
  function highlightSelected() {
    if (!state.entry || !els.list) return;
    var card = doc.getElementById("goat-entry-" + state.entry);
    if (!card) return;
    if (card.scrollIntoView) {
      try { card.scrollIntoView({block: "center", behavior: "smooth"}); } catch (error) { card.scrollIntoView(); }
    }
  }

  /* ---------------- URL compartible ---------------- */

  function syncUrl() {
    if (!root.history || !root.history.replaceState || !root.location) return;
    var params = [];
    if (state.board !== "careers") params.push("board=" + state.board);
    if (state.mode !== "player") params.push("mode=" + state.mode);
    if (state.period !== "all-time") params.push("period=" + state.period);
    if (state.board === "careers" && state.metric !== METRICS[state.mode][0][0]) params.push("metric=" + encodeURIComponent(state.metric));
    if (state.search) params.push("q=" + encodeURIComponent(state.search));
    if (state.entry) params.push("entry=" + encodeURIComponent(state.entry));
    var url = root.location.pathname + (params.length ? "?" + params.join("&") : "");
    try { root.history.replaceState({goat: state}, "", url); } catch (error) {}
  }

  /* ---------------- carga de datos ---------------- */

  function load(options) {
    var opts = options || {};
    if (!Object.keys(T).length) buildText();
    /* el origen se resuelve la primera vez que se usa, aunque no haya DOM (pruebas) */
    if (!origin) origin = normalizeOrigin(root.GOAT_API_URL || "");
    if (!origin) {
      loading = false;
      error = t("unavailable");
      paint();
      return Promise.resolve();
    }
    var key = cacheKey(state);
    var cached = cacheGet(key);
    if (cached && !opts.force) {
      entries = cached.entries;
      updatedAt = cached.at;
      error = "";
      loading = false;
      paint();
      if (Date.now() - cached.at < CACHE_TTL) return Promise.resolve();
    } else if (!opts.keepEntries) {
      entries = [];
    }
    loading = true;
    error = "";
    paint();
    requestId += 1;
    var current = requestId;
    return request(apiPath(state), {method: "GET"}).then(function (data) {
      if (current !== requestId) return;
      entries = Array.isArray(data.entries) ? data.entries : [];
      updatedAt = Date.now();
      loading = false;
      error = "";
      cacheSet(key, entries);
      paint();
    }).catch(function (problem) {
      if (current !== requestId) return;
      loading = false;
      if (entries.length) {
        /* ya hay ranking en pantalla: se avisa sin borrarlo */
        error = "";
        paint();
        toast(describe(problem));
        return;
      }
      error = describe(problem);
      paint();
    });
  }

  /* ---------------- controles ---------------- */

  function apply(next, reload) {
    var wanted = sanitizeState(next, state);
    var changed = wanted.board !== state.board || wanted.mode !== state.mode ||
      wanted.period !== state.period || wanted.metric !== state.metric;
    state = wanted;
    if (changed) shown = PAGE_SIZE;
    buildText();
    paintFilters();
    syncUrl();
    if (reload === false) { paint(); return Promise.resolve(); }
    return load({keepEntries: !changed});
  }

  function share(id) {
    var base = root.location ? (root.location.origin || "") + root.location.pathname : "";
    var url = base + "?entry=" + encodeURIComponent(id);
    state.entry = id;
    syncUrl();
    if (root.navigator && typeof root.navigator.share === "function") {
      root.navigator.share({title: "GOAT LADDER · Camino a la Leyenda", url: url}).catch(function () { copy(url); });
      return;
    }
    copy(url);
  }
  function copy(value) {
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(value).then(function () { toast(t("shareCopied")); },
        function () { toast(value); });
      return;
    }
    toast(value);
  }
  function remove(id, button) {
    if (root.confirm && !root.confirm(t("deleteConfirm"))) return;
    var token = tokens()[id];
    if (!token) { toast(t("deleteFailed")); return; }
    if (button) button.disabled = true;
    var path = (state.board === "careers" ? "/api/goat-ladder/careers?id=" : "/api/goat-ladder?id=") +
      encodeURIComponent(id) + "&mode=" + encodeURIComponent(state.mode);
    request(path, {method: "DELETE", headers: {Authorization: "Bearer " + token}}).then(function () {
      forgetToken(id);
      cacheDrop(cacheKey(state));
      entries = entries.filter(function (entry) { return entry.id !== id; });
      toast(t("deleted"));
      paint();
    }).catch(function (problem) {
      if (button) button.disabled = false;
      toast(describe(problem));
    });
  }

  function onDocumentClick(event) {
    var target = event.target && event.target.closest
      ? event.target.closest("[data-board],[data-mode],[data-period],[data-goat-share],[data-goat-delete],[data-goat-more],[data-goat-retry],[data-goat-clear],#goat-retry")
      : null;
    if (!target) return;
    if (target.id === "goat-retry" || target.hasAttribute("data-goat-retry")) {
      return load({force: true, keepEntries: true});
    }
    if (target.hasAttribute("data-goat-more")) { shown += PAGE_SIZE; return paint(); }
    if (target.hasAttribute("data-goat-clear")) {
      state.search = "";
      shown = PAGE_SIZE;
      if (els.search) els.search.value = "";
      syncUrl();
      return paint();
    }
    var shareId = target.getAttribute("data-goat-share");
    if (shareId) return share(shareId);
    var deleteId = target.getAttribute("data-goat-delete");
    if (deleteId) return remove(deleteId, target);
    var next = {}, touchedBoard = false;
    ["board", "mode", "period"].forEach(function (key) {
      var value = target.getAttribute("data-" + key);
      if (value == null) return;
      next[key] = value;
      if (key === "board") touchedBoard = true;
    });
    if (touchedBoard) { state.entry = ""; shown = PAGE_SIZE; }
    /* el modo cambia la lista de métricas: se elige la primera del modo nuevo */
    var nextMode = next.mode || state.mode;
    if (next.mode && next.mode !== state.mode) next.metric = METRICS[nextMode === "manager" ? "manager" : "player"][0][0];
    apply(next);
  }
  function onMetricChange() {
    if (!els.metric) return;
    apply({metric: els.metric.value});
  }
  function onSearchInput() {
    state.search = String(els.search.value || "").slice(0, 40);
    shown = PAGE_SIZE;
    syncUrl();
    paint();
  }

  /* ---------------- arranque ---------------- */

  function init() {
    if (started) return Promise.resolve();
    els.list = doc.getElementById("goat-entries");
    if (!els.list) return Promise.resolve();
    started = true;
    els.status = doc.getElementById("goat-status");
    els.retry = doc.getElementById("goat-retry");
    els.metric = doc.getElementById("goat-metric");
    if (els.metric && els.metric.parentNode) {
      els.metricLabel = els.metric.parentNode;
      els.label = els.metric.parentNode.firstChild;
    }
    var langAttr = (doc.body && doc.body.getAttribute("data-lang")) ||
      (doc.documentElement && doc.documentElement.getAttribute("lang")) || "es";
    lang = text[langAttr] ? langAttr : "es";
    buildText();
    origin = normalizeOrigin(root.GOAT_API_URL || "");
    state = sanitizeState(readQuery(root.location ? root.location.search : ""));

    /* Buscador: se crea antes de conectar los eventos (si no, el campo no responde). */
    els.search = doc.getElementById("goat-search");
    if (!els.search) {
      var host = doc.querySelector(".goat-filters") || doc.querySelector(".goat-board");
      if (host) {
        var field = node("input", "goat-search");
        field.id = "goat-search";
        field.type = "search";
        field.setAttribute("maxlength", "40");
        field.setAttribute("autocomplete", "off");
        field.setAttribute("aria-label", t("searchLabel"));
        field.setAttribute("placeholder", t("search"));
        field.value = state.search;
        host.appendChild(field);
        els.search = field;
      }
    }
    if (els.search) {
      els.search.value = state.search;
      els.search.addEventListener("input", onSearchInput);
      els.search.addEventListener("change", onSearchInput);
      var form = els.search.form;
      if (form) form.addEventListener("submit", function (event) { event.preventDefault(); onSearchInput(); });
    }
    if (els.metric) els.metric.addEventListener("change", onMetricChange);
    doc.addEventListener("click", onDocumentClick);

    /* Ayuda para participar, encima del ranking, si la página no la trae. */
    if (!doc.querySelector(".goat-howto") && doc.querySelector(".goat-hero")) {
      doc.querySelector(".goat-hero").appendChild(howToCard());
    }
    /* Anuncio del instante de la última actualización (lectores de pantalla). */
    if (els.status && !doc.getElementById("goat-updated")) {
      var updated = node("p", "goat-updated");
      updated.id = "goat-updated";
      updated.setAttribute("aria-live", "polite");
      if (els.status.parentNode) els.status.parentNode.insertBefore(updated, els.status.nextSibling);
      els.updated = updated;
    }

    if (root.addEventListener) {
      root.addEventListener("popstate", function () {
        state = sanitizeState(readQuery(root.location.search), state);
        buildText();
        paintFilters();
        load({keepEntries: true});
      });
      root.addEventListener("online", function () { if (error) load({force: true, keepEntries: true}); });
      doc.addEventListener("visibilitychange", function () {
        if (!doc.hidden && updatedAt && Date.now() - updatedAt > STALE_AFTER) load({keepEntries: true});
      });
    }

    buildText();
    paintFilters();
    /* Primero la caché de la sesión (pintado instantáneo); si está caducada, se refresca. */
    return load({});
  }

  root.GoatBoard = {
    TEXT: text, EXTRA: EXTRA, METRICS: METRICS, PERIODS: PERIODS, PAGE_SIZE: PAGE_SIZE,
    normalizeOrigin: normalizeOrigin, readQuery: readQuery, sanitizeState: sanitizeState,
    apiPath: apiPath, cacheKey: cacheKey, classify: classify, timeAgo: timeAgo,
    groupHonours: groupHonours, matchesSearch: matchesSearch, metricLabelKey: metricLabelKey,
    texts: function () { return T; },
    setLang: function (value) { lang = text[value] ? value : "es"; buildText(); },
    t: t,
    start: init,
    /* API sin DOM (pruebas y depuración): cambia el estado y recarga el ranking. */
    select: function (next) { return apply(next); },
    refresh: function (options) { return load(options || {force: true}); },
    state: function () { return state; },
    entries: function () { return entries; }
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
