/* GOAT LADDER: ranking online de carreras y gestas de Camino a la Leyenda.
   Sin dependencias. Lee window.GOAT_API_URL (servicio Cloudflare) y el idioma de
   <body data-lang>. Guarda en caché de sesión para pintar al instante y reintenta
   las peticiones con tolerancia a fallos de red. */
(function (root, doc) {
  "use strict";

  var TEXT = {
    es: {
      careers: "Carreras", achievements: "Gestas", player: "Jugador", manager: "Míster",
      metric: "Ordenar por métrica", allTime: "Todos", d30: "30 días", d7: "7 días",
      loading: "Cargando ranking…", retry: "Reintentar", refreshing: "Actualizando…",
      updated: "Actualizado {when}", updatedNow: "ahora mismo", updatedMinutes: "hace {n} min",
      updatedHours: "hace {n} h", emptyCareers: "Aún no hay carreras compartidas en este ranking.",
      emptyAchievements: "Aún no hay gestas en este ranking.",
      howToTitle: "¿Cómo aparezco aquí?", howToBody: "Juega una temporada en la app y publica tu carrera o tu última gesta desde GOAT LADDER en el menú del juego.",
      playCta: "Jugar ahora", search: "Buscar por alias o club", searchLabel: "Buscar",
      noResults: "Ningún resultado con «{q}».", share: "Compartir", shareCopied: "Enlace copiado",
      delete: "Eliminar mi entrada", deleteConfirm: "¿Quieres eliminar esta entrada del ranking?",
      deleteFailed: "No se pudo eliminar la entrada.", deleted: "Entrada eliminada",
      seasons: "Temporadas", season: "Temporada", appearances: "Partidos", goals: "Goles",
      assists: "Asistencias", cleanSheets: "Porterías a cero", trophies: "Títulos", awards: "Premios",
      caps: "Internacionales", intlGoals: "Goles internacionales", clubs: "Clubes",
      wins: "Victorias", draws: "Empates", losses: "Derrotas", unbeaten: "Temporadas invictas",
      promotions: "Ascensos", winRate: "% victorias", history: "Historial de temporadas",
      position: "Posición", promoted: "Ascenso", unverified: "Sin verificar · enviado por la comunidad",
      counted: "×{n}", match: "Partido", seasonEvent: "Temporada", rating: "Valoración",
      minutes: "Minutos", result: "Resultado", record: "Balance", opponent: "Rival",
      networkError: "No se pudo conectar con el ranking. Comprueba tu conexión y vuelve a intentarlo.",
      timeoutError: "El ranking está tardando demasiado en responder. Vuelve a intentarlo.",
      offlineError: "Parece que no hay conexión. Conéctate a internet y vuelve a intentarlo.",
      responseError: "El ranking devolvió una respuesta no válida. Vuelve a intentarlo más tarde.",
      serverError: "El ranking no está disponible en este momento. Vuelve a intentarlo en un rato.",
      unavailable: "El ranking global todavía no está configurado.",
      all: "Todos", top: "Top {n}", loadMore: "Ver más"
    },
    en: {
      careers: "Careers", achievements: "Achievements", player: "Player", manager: "Manager",
      metric: "Rank by metric", allTime: "All time", d30: "30 days", d7: "7 days",
      loading: "Loading ranking…", retry: "Retry", refreshing: "Refreshing…",
      updated: "Updated {when}", updatedNow: "just now", updatedMinutes: "{n} min ago",
      updatedHours: "{n} h ago", emptyCareers: "No shared careers in this ranking yet.",
      emptyAchievements: "No achievements in this ranking yet.",
      howToTitle: "How do I get listed?", howToBody: "Play a season in the app and publish your career or latest achievement from GOAT LADDER in the game menu.",
      playCta: "Play now", search: "Search by alias or club", searchLabel: "Search",
      noResults: "No results for “{q}”.", share: "Share", shareCopied: "Link copied",
      delete: "Delete my entry", deleteConfirm: "Delete this entry from the ranking?",
      deleteFailed: "The entry could not be deleted.", deleted: "Entry deleted",
      seasons: "Seasons", season: "Season", appearances: "Appearances", goals: "Goals",
      assists: "Assists", cleanSheets: "Clean sheets", trophies: "Trophies", awards: "Awards",
      caps: "International caps", intlGoals: "International goals", clubs: "Clubs",
      wins: "Wins", draws: "Draws", losses: "Losses", unbeaten: "Unbeaten seasons",
      promotions: "Promotions", winRate: "Win %", history: "Season history",
      position: "Position", promoted: "Promoted", unverified: "Unverified · community-reported",
      counted: "×{n}", match: "Match", seasonEvent: "Season", rating: "Rating",
      minutes: "Minutes", result: "Result", record: "Record", opponent: "Opponent",
      networkError: "Could not reach the ranking. Check your connection and try again.",
      timeoutError: "The ranking is taking too long to respond. Please try again.",
      offlineError: "You appear to be offline. Connect to the internet and try again.",
      responseError: "The ranking returned an invalid response. Please try again later.",
      serverError: "The ranking is unavailable right now. Please try again in a moment.",
      unavailable: "The global ranking is not configured yet.",
      all: "All", top: "Top {n}", loadMore: "Show more"
    },
    de: {
      careers: "Karrieren", achievements: "Erfolge", player: "Spieler", manager: "Manager",
      metric: "Sortieren nach", allTime: "Alle", d30: "30 Tage", d7: "7 Tage",
      loading: "Rangliste wird geladen…", retry: "Erneut versuchen", refreshing: "Aktualisieren…",
      updated: "Aktualisiert {when}", updatedNow: "gerade eben", updatedMinutes: "vor {n} Min.",
      updatedHours: "vor {n} Std.", emptyCareers: "Noch keine geteilten Karrieren in dieser Rangliste.",
      emptyAchievements: "Noch keine Erfolge in dieser Rangliste.",
      howToTitle: "Wie komme ich hierher?", howToBody: "Spiele eine Saison in der App und veröffentliche deine Karriere oder deinen letzten Erfolg über GOAT LADDER im Spielmenü.",
      playCta: "Jetzt spielen", search: "Nach Alias oder Verein suchen", searchLabel: "Suchen",
      noResults: "Keine Treffer für „{q}“.", share: "Teilen", shareCopied: "Link kopiert",
      delete: "Meinen Eintrag löschen", deleteConfirm: "Diesen Eintrag aus der Rangliste löschen?",
      deleteFailed: "Der Eintrag konnte nicht gelöscht werden.", deleted: "Eintrag gelöscht",
      seasons: "Saisons", season: "Saison", appearances: "Einsätze", goals: "Tore",
      assists: "Vorlagen", cleanSheets: "Zu null", trophies: "Titel", awards: "Auszeichnungen",
      caps: "Länderspiele", intlGoals: "Länderspieltore", clubs: "Vereine",
      wins: "Siege", draws: "Unentschieden", losses: "Niederlagen", unbeaten: "Ungeschlagene Saisons",
      promotions: "Aufstiege", winRate: "Siegquote", history: "Saisonverlauf",
      position: "Platz", promoted: "Aufgestiegen", unverified: "Nicht verifiziert · von der Community gemeldet",
      counted: "×{n}", match: "Spiel", seasonEvent: "Saison", rating: "Bewertung",
      minutes: "Minuten", result: "Ergebnis", record: "Bilanz", opponent: "Gegner",
      networkError: "Keine Verbindung zur Rangliste. Prüfe deine Verbindung und versuche es erneut.",
      timeoutError: "Die Rangliste antwortet zu langsam. Bitte versuche es erneut.",
      offlineError: "Du bist offline. Stelle eine Internetverbindung her und versuche es erneut.",
      responseError: "Die Rangliste hat eine ungültige Antwort geliefert. Versuche es später erneut.",
      serverError: "Die Rangliste ist gerade nicht verfügbar. Versuche es gleich noch einmal.",
      unavailable: "Die globale Rangliste ist noch nicht eingerichtet.",
      all: "Alle", top: "Top {n}", loadMore: "Mehr anzeigen"
    },
    it: {
      careers: "Carriere", achievements: "Imprese", player: "Giocatore", manager: "Mister",
      metric: "Ordina per metrica", allTime: "Sempre", d30: "30 giorni", d7: "7 giorni",
      loading: "Caricamento classifica…", retry: "Riprova", refreshing: "Aggiornamento…",
      updated: "Aggiornata {when}", updatedNow: "adesso", updatedMinutes: "{n} min fa",
      updatedHours: "{n} h fa", emptyCareers: "Non ci sono ancora carriere condivise in questa classifica.",
      emptyAchievements: "Non ci sono ancora imprese in questa classifica.",
      howToTitle: "Come compaio qui?", howToBody: "Gioca una stagione nell'app e pubblica la tua carriera o la tua ultima impresa da GOAT LADDER nel menu del gioco.",
      playCta: "Gioca ora", search: "Cerca per alias o club", searchLabel: "Cerca",
      noResults: "Nessun risultato per «{q}».", share: "Condividi", shareCopied: "Link copiato",
      delete: "Elimina la mia voce", deleteConfirm: "Eliminare questa voce dalla classifica?",
      deleteFailed: "Impossibile eliminare la voce.", deleted: "Voce eliminata",
      seasons: "Stagioni", season: "Stagione", appearances: "Presenze", goals: "Gol",
      assists: "Assist", cleanSheets: "Porte inviolate", trophies: "Titoli", awards: "Premi",
      caps: "Presenze internazionali", intlGoals: "Gol internazionali", clubs: "Club",
      wins: "Vittorie", draws: "Pareggi", losses: "Sconfitte", unbeaten: "Stagioni imbattute",
      promotions: "Promozioni", winRate: "% vittorie", history: "Storico stagioni",
      position: "Posizione", promoted: "Promosso", unverified: "Non verificata · segnalata dalla community",
      counted: "×{n}", match: "Partita", seasonEvent: "Stagione", rating: "Voto",
      minutes: "Minuti", result: "Risultato", record: "Bilancio", opponent: "Avversario",
      networkError: "Impossibile raggiungere la classifica. Controlla la connessione e riprova.",
      timeoutError: "La classifica sta impiegando troppo a rispondere. Riprova.",
      offlineError: "Sembra che tu non sia connesso. Connettiti a internet e riprova.",
      responseError: "La classifica ha restituito una risposta non valida. Riprova più tardi.",
      serverError: "La classifica non è disponibile in questo momento. Riprova tra poco.",
      unavailable: "La classifica globale non è ancora configurata.",
      all: "Tutti", top: "Top {n}", loadMore: "Mostra altro"
    },
    fr: {
      careers: "Carrières", achievements: "Exploits", player: "Joueur", manager: "Manager",
      metric: "Classer par", allTime: "Tout", d30: "30 jours", d7: "7 jours",
      loading: "Chargement du classement…", retry: "Réessayer", refreshing: "Actualisation…",
      updated: "Mis à jour {when}", updatedNow: "à l'instant", updatedMinutes: "il y a {n} min",
      updatedHours: "il y a {n} h", emptyCareers: "Aucune carrière partagée dans ce classement pour le moment.",
      emptyAchievements: "Aucun exploit dans ce classement pour le moment.",
      howToTitle: "Comment apparaître ici ?", howToBody: "Joue une saison dans l'app et publie ta carrière ou ton dernier exploit depuis GOAT LADDER dans le menu du jeu.",
      playCta: "Jouer maintenant", search: "Rechercher un alias ou un club", searchLabel: "Rechercher",
      noResults: "Aucun résultat pour « {q} ».", share: "Partager", shareCopied: "Lien copié",
      delete: "Supprimer mon entrée", deleteConfirm: "Supprimer cette entrée du classement ?",
      deleteFailed: "Impossible de supprimer l'entrée.", deleted: "Entrée supprimée",
      seasons: "Saisons", season: "Saison", appearances: "Apparitions", goals: "Buts",
      assists: "Passes décisives", cleanSheets: "Matchs sans encaisser", trophies: "Titres", awards: "Récompenses",
      caps: "Sélections", intlGoals: "Buts internationaux", clubs: "Clubs",
      wins: "Victoires", draws: "Matchs nuls", losses: "Défaites", unbeaten: "Saisons sans défaite",
      promotions: "Promotions", winRate: "Taux de victoire", history: "Historique des saisons",
      position: "Position", promoted: "Promu", unverified: "Non vérifiée · déclarée par la communauté",
      counted: "×{n}", match: "Match", seasonEvent: "Saison", rating: "Note",
      minutes: "Minutes", result: "Résultat", record: "Bilan", opponent: "Adversaire",
      networkError: "Impossible de joindre le classement. Vérifie ta connexion et réessaie.",
      timeoutError: "Le classement met trop de temps à répondre. Réessaie.",
      offlineError: "Tu sembles hors ligne. Connecte-toi à internet et réessaie.",
      responseError: "Le classement a renvoyé une réponse non valide. Réessaie plus tard.",
      serverError: "Le classement est indisponible pour le moment. Réessaie dans un instant.",
      unavailable: "Le classement mondial n'est pas encore configuré.",
      all: "Tout", top: "Top {n}", loadMore: "Voir plus"
    }
  };

  /* Métricas por modo: [clave del servicio, texto, icono]. */
  var METRICS = {
    player: [
      ["appearances", "appearances", "📋"], ["goals", "goals", "⚽"], ["assists", "assists", "🅰️"],
      ["trophies", "trophies", "🏆"], ["awards", "awards", "⭐"], ["clean_sheets", "cleanSheets", "🧤"],
      ["international_caps", "caps", "🌍"], ["international_goals", "intlGoals", "🥅"],
      ["clubs", "clubs", "🏟️"], ["seasons", "seasons", "📅"]
    ],
    manager: [
      ["wins", "wins", "✅"], ["draws", "draws", "➖"], ["losses", "losses", "❌"],
      ["trophies", "trophies", "🏆"], ["unbeaten_seasons", "unbeaten", "🛡️"],
      ["promotions", "promotions", "⬆️"], ["win_percentage", "winRate", "📈"],
      ["clubs", "clubs", "🏟️"], ["seasons", "seasons", "📅"]
    ]
  };
  var PERIODS = [["all-time", "allTime"], ["30d", "d30"], ["7d", "d7"]];
  var BOARDS = [["careers", "careers"], ["achievements", "achievements"]];
  var PAGE_SIZE = 12;
  var CACHE_TTL = 2 * 60 * 1000;
  var STALE_AFTER = 10 * 60 * 1000;
  var REQUEST_TIMEOUT = 12000;
  var TOKEN_KEY = "camino.goat.deleteTokens";
  var CACHE_PREFIX = "camino.goatWeb.";

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
    var period = "all-time", metric = "";
    for (var p = 0; p < PERIODS.length; p++) if (q.period === PERIODS[p][0]) period = q.period;
    if (!period && current && current.period) period = current.period;
    var allowed = METRICS[mode].map(function (item) { return item[0]; });
    if (q.metric && allowed.indexOf(q.metric) >= 0) metric = q.metric;
    else if (current && current.metric && allowed.indexOf(current.metric) >= 0) metric = current.metric;
    else metric = METRICS[mode][0][0];
    var search = typeof q.q === "string" ? q.q.slice(0, 40) : "";
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
    if (typeof TypeError === "function" && error instanceof TypeError) return "networkError";
    if (/load failed|failed to fetch|networkerror|network request failed/i.test(String(error.message || ""))) return "networkError";
    if (error.status >= 500) return "serverError";
    if (error.status === 404) return "serverError";
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
    var seen = {}, list = [];
    (seasons || []).forEach(function (season) {
      (season[key] || []).forEach(function (name) {
        var clean = String(name == null ? "" : name).replace(/^\s+|\s+$/g, "");
        if (!clean) return;
        if (!seen[clean]) { seen[clean] = {name: clean, count: 0}; list.push(seen[clean]); }
        seen[clean].count++;
      });
    });
    return list.sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  }

  function matchesSearch(entry, term) {
    if (!term) return true;
    var needle = term.toLowerCase();
    return [entry.display_name, entry.current_club, entry.club_name, entry.title]
      .filter(Boolean).join(" ").toLowerCase().indexOf(needle) >= 0;
  }

  /* ---------------- i18n ---------------- */

  var lang = "es";
  function t(key, params) {
    var table = TEXT[lang] || TEXT.es;
    var value = table[key] || TEXT.es[key] || key;
    if (params) value = value.replace(/\{(\w+)\}/g, function (m, k) { return params[k] == null ? m : String(params[k]); });
    return value;
  }

  /* ---------------- red ---------------- */

  /* GOAT_API_URL lo define la página antes de cargar este archivo. */
  var origin = normalizeOrigin(root.GOAT_API_URL || "");

  function failure(kind, extra) {
    var error = new Error(t(kind));
    error.goatKind = kind;
    if (extra && extra.status) error.status = extra.status;
    return error;
  }

  function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function timedFetch(url, options, timeout) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var copy = {};
    Object.keys(options || {}).forEach(function (key) { copy[key] = options[key]; });
    var timer = null;
    if (controller) {
      copy.signal = controller.signal;
      timer = setTimeout(function () { controller.abort(); }, timeout);
    }
    return root.fetch(url, copy).then(function (response) {
      if (timer) clearTimeout(timer);
      return response;
    }, function (error) {
      if (timer) clearTimeout(timer);
      throw error;
    });
  }

  function readResponse(response) {
    return response.text().then(function (body) {
      var data;
      try { data = body ? JSON.parse(body) : {}; } catch (error) { throw failure("responseError", {status: response.status}); }
      if (!response.ok) {
        var problem = new Error((data && data.error) || ("HTTP " + response.status));
        problem.status = response.status;
        throw problem;
      }
      return data;
    });
  }

  /* Petición con tiempo máximo, reintento y, si la red falla, segundo intento con un
     cuerpo «simple» que no dispara la petición previa de CORS. */
  function request(path, options) {
    if (!origin) return Promise.reject(failure("unavailable"));
    if (root.navigator && root.navigator.onLine === false) return Promise.reject(failure("offlineError"));
    var url = origin + path;
    var body = options && typeof options.body === "string" ? options.body : null;
    function attempt(contentType) {
      var copy = {};
      Object.keys(options || {}).forEach(function (key) { copy[key] = options[key]; });
      var headers = {};
      Object.keys(copy.headers || {}).forEach(function (key) { headers[key] = copy.headers[key]; });
      headers.Accept = "application/json";
      if (body != null && contentType) headers["Content-Type"] = contentType;
      copy.headers = headers;
      copy.mode = "cors";
      copy.credentials = "omit";
      copy.cache = "no-store";
      return timedFetch(url, copy, REQUEST_TIMEOUT).then(readResponse);
    }
    return attempt(body != null ? "application/json" : null).catch(function (error) {
      if (!body || classify(error) !== "networkError") throw error;
      return delay(500).then(function () { return attempt("text/plain;charset=UTF-8"); });
    }).catch(function (error) {
      throw failure(classify(error), {status: error && error.status});
    });
  }

  /* ---------------- caché de sesión ---------------- */

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
    try {
      root.sessionStorage.setItem(key, JSON.stringify({at: Date.now(), entries: entries}));
    } catch (error) {}
  }

  function cacheDrop(key) {
    try { root.sessionStorage.removeItem(key); } catch (error) {}
  }

  /* ---------------- tokens de borrado (los comparte con el juego) ---------------- */

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

  /* ---------------- pintado ---------------- */

  var els = {};
  var state = {board: "careers", mode: "player", period: "all-time", metric: "appearances", search: "", entry: ""};
  var entries = [];
  var shown = PAGE_SIZE;
  var loading = false;
  var error = "";
  var updatedAt = 0;
  var requestId = 0;
  var toastTimer = 0;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char];
    });
  }
  function num(value) {
    return value == null || value === "" ? "0" : String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function statHtml(label, value) {
    if (value == null || value === "") return "";
    return '<span class="goat-stat"><small>' + esc(label) + "</small><b>" + esc(value) + "</b></span>";
  }
  function metricValue(entry, key) {
    var metrics = entry.metrics || {};
    var value = metrics[key];
    if (value == null || value === "") return "—";
    return key === "win_percentage" ? num(value) + "%" : num(value);
  }

  function seasonRow(season, mode) {
    var bits = [];
    if (mode === "player") {
      bits.push(t("appearances") + ": " + num(season.appearances), t("goals") + ": " + num(season.goals),
        t("assists") + ": " + num(season.assists), t("trophies") + ": " + (season.trophies || []).length);
    } else {
      bits.push(t("record") + ": " + num(season.wins) + "-" + num(season.draws) + "-" + num(season.losses),
        t("goals") + ": " + num(season.goals_for) + "–" + num(season.goals_against));
      if (season.position != null) bits.push(t("position") + ": " + num(season.position));
      if (season.promoted) bits.push(t("promoted"));
    }
    return '<div class="goat-season-row"><strong>' + esc(season.season) + " · " + esc(season.club) +
      " · " + esc(season.competition) + "</strong><span>" + esc(bits.join(" · ")) + "</span></div>";
  }

  function honoursHtml(entry) {
    var trophies = groupHonours(entry.history, "trophies");
    var awards = groupHonours(entry.history, "awards");
    if (!trophies.length && !awards.length) return "";
    function block(title, list, icon) {
      if (!list.length) return "";
      return '<div class="goat-season-honors"><strong>' + esc(title) + ":</strong> " + list.slice(0, 8).map(function (item) {
        return '<span class="goat-honour">' + icon + " " + esc(item.name) +
          (item.count > 1 ? " <em>" + esc(t("counted", {n: item.count})) + "</em>" : "") + "</span>";
      }).join("") + "</div>";
    }
    return block(t("trophies"), trophies, "🏆") + block(t("awards"), awards, "⭐");
  }

  function careersCard(entry, index) {
    var metrics = entry.metrics || {};
    var metricName = METRICS[entry.game_mode || state.mode] || METRICS.player;
    var labelKey = "seasons";
    for (var i = 0; i < metricName.length; i++) if (metricName[i][0] === state.metric) labelKey = metricName[i][1];
    var history = (entry.history || []).slice().reverse();
    var selected = entry.id === state.entry ? " is-selected" : "";
    var stats = [
      statHtml(t("seasons"), num(metrics.seasons)),
      statHtml(t("appearances"), num(metrics.appearances)),
      statHtml(t("goals"), num(metrics.goals)),
      statHtml(t("assists"), num(metrics.assists)),
      statHtml(t("trophies"), num(metrics.trophies)),
      statHtml(t("awards"), num(metrics.awards)),
      entry.game_mode === "manager" ? statHtml(t("wins"), num(metrics.wins)) : statHtml(t("caps"), num(metrics.international_caps)),
      entry.game_mode === "manager" ? statHtml(t("winRate"), num(metrics.win_percentage) + "%") : statHtml(t("intlGoals"), num(metrics.international_goals))
    ].join("");
    return '<article class="goat-card' + selected + '" id="goat-entry-' + esc(entry.id) + '">' +
      '<div class="goat-card-head"><span class="goat-rank">#' + (index + 1) + " · " + esc(t("careers")) + "</span>" +
      '<strong class="goat-score">' + esc(metricValue(entry, state.metric)) + " " + esc(t(labelKey)) + "</strong></div>" +
      '<h2 class="goat-card-title">' + esc(entry.title) + "</h2>" +
      '<p class="goat-card-meta">' + esc(entry.display_name) + " · " + esc(entry.current_club) +
      " · " + esc(num(entry.started_season) + "–" + num(entry.latest_season)) + "</p>" +
      '<div class="goat-stats">' + stats + "</div>" + honoursHtml(entry) +
      (history.length ? '<details class="goat-career-history"><summary>' + esc(t("history")) +
        " (" + history.length + ")</summary>" + history.map(function (season) {
          return seasonRow(season, entry.game_mode);
        }).join("") + "</details>" : "") +
      '<p class="goat-unverified">' + esc(t("unverified")) + "</p>" + cardActions(entry) + "</article>";
  }

  function achievementsCard(entry, index) {
    var stats = [];
    if (entry.game_mode === "player") {
      stats.push(statHtml(t("goals"), num(entry.metrics && entry.metrics.goals)),
        statHtml(t("assists"), num(entry.metrics && entry.metrics.assists)),
        statHtml(t("rating"), entry.metrics && entry.metrics.match_rating != null ? Number(entry.metrics.match_rating).toFixed(1) : ""),
        statHtml(t("minutes"), num(entry.metrics && entry.metrics.minutes_played)));
    } else if (entry.event_type === "season") {
      stats.push(statHtml(t("record"), num(entry.metrics && entry.metrics.wins) + "-" +
        num(entry.metrics && entry.metrics.draws) + "-" + num(entry.metrics && entry.metrics.losses)),
      statHtml(t("goals"), num(entry.metrics && entry.metrics.goals_for) + "–" + num(entry.metrics && entry.metrics.goals_against)),
      statHtml(t("position"), num(entry.metrics && entry.metrics.league_position)));
    } else {
      stats.push(statHtml(t("result"), num(entry.metrics && entry.metrics.own_score) + "–" +
        num(entry.metrics && entry.metrics.opponent_score)));
    }
    var selected = entry.id === state.entry ? " is-selected" : "";
    return '<article class="goat-card' + selected + '" id="goat-entry-' + esc(entry.id) + '">' +
      '<div class="goat-card-head"><span class="goat-rank">#' + (index + 1) + " · " +
      esc(t(entry.event_type === "season" ? "seasonEvent" : "match")) + '</span><strong class="goat-score">' +
      esc(num(entry.goat_score)) + "</strong></div>" +
      '<h2 class="goat-card-title">' + esc(entry.title) + "</h2>" +
      '<p class="goat-card-meta">' + esc(entry.display_name) + " · " + esc(entry.club_name) + " · " +
      esc(entry.competition_name) + "</p>" +
      (entry.opponent_name ? '<p class="goat-card-opponent">' + esc(t("opponent")) + ": " + esc(entry.opponent_name) + "</p>" : "") +
      '<div class="goat-stats">' + stats.join("") + "</div>" +
      '<p class="goat-unverified">' + esc(t("unverified")) + "</p>" + cardActions(entry) + "</article>";
  }

  function cardActions(entry) {
    var out = '<div class="goat-actions"><button type="button" class="linkbtn goat-share" data-share="' +
      esc(entry.id) + '">🔗 ' + esc(t("share")) + "</button>";
    if (canDelete(entry.id)) {
      out += '<button type="button" class="linkbtn goat-remove" data-delete="' + esc(entry.id) + '">🗑️ ' +
        esc(t("delete")) + "</button>";
    }
    return out + "</div>";
  }

  function skeletons(count) {
    var out = "";
    for (var i = 0; i < (count || 3); i++) {
      out += '<article class="goat-card goat-skeleton" aria-hidden="true"><span class="sk sk-a"></span>' +
        '<span class="sk sk-b"></span><span class="sk sk-c"></span><span class="sk sk-d"></span></article>';
    }
    return out;
  }

  function emptyHtml() {
    return '<div class="goat-empty"><p>' + esc(t(state.board === "careers" ? "emptyCareers" : "emptyAchievements")) + "</p>" +
      '<p class="goat-howto"><b>' + esc(t("howToTitle")) + "</b> " + esc(t("howToBody")) + "</p>" +
      '<a class="btn pri sm" href="../jugar/">' + esc(t("playCta")) + "</a></div>";
  }

  function howToHtml() {
    return '<aside class="goat-howto goat-howto-top"><b>' + esc(t("howToTitle")) + "</b> " +
      esc(t("howToBody")) + '<a class="btn sm" href="../jugar/">' + esc(t("playCta")) + "</a></aside>";
  }

  function updatedLabel() {
    if (!updatedAt) return "";
    var ago = timeAgo(updatedAt);
    var when = ago === "now" ? t("updatedNow")
      : ago.charAt(0) === "m" ? t("updatedMinutes", {n: ago.slice(1)})
      : t("updatedHours", {n: ago.slice(1)});
    return t("updated", {when: when});
  }

  function paintStatus() {
    if (!els.status) return;
    var bits = [];
    if (loading && entries.length) bits.push(t("refreshing"));
    else if (loading) bits.push(t("loading"));
    else if (updatedAt) bits.push(updatedLabel());
    if (state.search && entries.length) bits.push(visibleEntries().length + "/" + entries.length);
    els.status.textContent = bits.join(" · ");
  }

  function visibleEntries() {
    return entries.filter(function (entry) { return matchesSearch(entry, state.search); });
  }

  function paint() {
    if (!els.list) return;
    if (error) {
      els.list.innerHTML = '<div class="goat-error-state" role="alert"><p>' + esc(error) + "</p>" +
        '<button type="button" class="btn pri sm goat-retry" data-retry="1">' + esc(t("retry")) + "</button></div>";
      if (els.retry) els.retry.hidden = true;
      paintStatus();
      return;
    }
    if (loading && !entries.length) {
      els.list.innerHTML = skeletons(3);
      if (els.retry) els.retry.hidden = true;
      paintStatus();
      return;
    }
    var list = visibleEntries();
    if (!list.length) {
      els.list.innerHTML = state.search && entries.length
        ? '<p class="goat-status">' + esc(t("noResults", {q: state.search})) + "</p>"
        : emptyHtml();
      if (els.retry) els.retry.hidden = true;
      paintStatus();
      return;
    }
    /* Si el enlace compartido apunta a una entrada que aún no se ve, se amplía la página. */
    if (state.entry) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === state.entry && i >= shown) { shown = i + 1; break; }
      }
    }
    var page = list.slice(0, shown);
    els.list.innerHTML = page.map(function (entry, index) {
      return state.board === "careers" ? careersCard(entry, index) : achievementsCard(entry, index);
    }).join("") + (list.length > page.length
      ? '<button type="button" class="btn wide goat-more" data-more="1">' + esc(t("loadMore")) + "</button>" : "");
    if (els.retry) els.retry.hidden = true;
    paintStatus();
    highlightSelected();
  }

  function highlightSelected() {
    if (!state.entry || !els.list) return;
    var card = doc.getElementById("goat-entry-" + state.entry);
    if (!card) return;
    if (card.scrollIntoView && shown) card.scrollIntoView({block: "center", behavior: "smooth"});
  }

  function toast(message) {
    var box = doc.getElementById("goat-toast");
    if (!box) {
      box = doc.createElement("div");
      box.id = "goat-toast";
      box.className = "goat-toast";
      box.setAttribute("role", "status");
      (doc.body || doc.documentElement).appendChild(box);
    }
    box.textContent = message;
    box.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove("is-on"); }, 2600);
  }

  /* ---------------- estado de la URL ---------------- */

  function syncUrl() {
    if (!root.history || !root.history.replaceState || !root.location) return;
    var params = [];
    if (state.board !== "careers") params.push("board=" + state.board);
    if (state.mode !== "player") params.push("mode=" + state.mode);
    if (state.period !== "all-time") params.push("period=" + state.period);
    var first = METRICS[state.mode][0][0];
    if (state.board === "careers" && state.metric !== first) params.push("metric=" + encodeURIComponent(state.metric));
    if (state.search) params.push("q=" + encodeURIComponent(state.search));
    if (state.entry) params.push("entry=" + encodeURIComponent(state.entry));
    var url = root.location.pathname + (params.length ? "?" + params.join("&") : "");
    try { root.history.replaceState({goat: state}, "", url); } catch (error) {}
  }

  /* ---------------- carga de datos ---------------- */

  function load(options) {
    var opts = options || {};
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
      if (entries.length && cached) {
        /* ya hay datos en pantalla: se avisa sin borrar el ranking */
        error = "";
        paint();
        toast(problem.message || t("error"));
        return;
      }
      error = problem.message || t(classify(problem));
      paint();
    });
  }

  /* ---------------- controles ---------------- */

  function paintFilters() {
    var groups = [
      [els.boards, "board", BOARDS],
      [els.modes, "mode", [["player", "player"], ["manager", "manager"]]],
      [els.periods, "period", PERIODS]
    ];
    groups.forEach(function (group) {
      if (!group[0]) return;
      var buttons = group[0].querySelectorAll("button[data-" + group[1] + "]");
      for (var i = 0; i < buttons.length; i++) {
        var value = buttons[i].getAttribute("data-" + group[1]);
        buttons[i].setAttribute("aria-pressed", String(state[group[1]] === value));
      }
    });
    if (els.metric) {
      var metrics = METRICS[state.mode];
      els.metric.innerHTML = metrics.map(function (item) {
        return '<option value="' + item[0] + '"' + (state.metric === item[0] ? " selected" : "") + ">" +
          esc(t(item[1])) + "</option>";
      }).join("");
      els.metric.disabled = state.board !== "careers";
    }
    if (els.search && els.search.value !== state.search) els.search.value = state.search;
    if (els.metricLabel) els.metricLabel.textContent = t("metric");
  }

  function apply(next, reload) {
    var wanted = sanitizeState(next, state);
    var changed = !reload && (wanted.board !== state.board || wanted.mode !== state.mode ||
      wanted.period !== state.period || wanted.metric !== state.metric);
    state = wanted;
    if (changed) shown = PAGE_SIZE;
    paintFilters();
    syncUrl();
    if (reload === false) return paint();
    return load({keepEntries: !changed});
  }

  function onFilterClick(event) {
    var button = event.target.closest ? event.target.closest("button") : null;
    if (!button) return;
    var map = [["data-board", "board"], ["data-mode", "mode"], ["data-period", "period"]];
    for (var i = 0; i < map.length; i++) {
      var value = button.getAttribute(map[i][0]);
      if (value == null) continue;
      var next = {};
      next[map[i][1]] = value;
      if (map[i][1] === "board") { shown = PAGE_SIZE; state.entry = ""; }
      /* el modo cambia las métricas disponibles: se elige la primera del modo nuevo */
      if (map[i][1] === "mode") { next.metric = METRICS[value === "manager" ? "manager" : "player"][0][0]; }
      apply(next);
      return;
    }
  }

  function onListClick(event) {
    var target = event.target.closest ? event.target.closest("[data-retry],[data-more],[data-share],[data-delete]") : null;
    if (!target) return;
    if (target.hasAttribute("data-retry")) return load({force: true, keepEntries: true});
    if (target.hasAttribute("data-more")) { shown += PAGE_SIZE; return paint(); }
    var shareId = target.getAttribute("data-share");
    if (shareId) return share(shareId);
    var deleteId = target.getAttribute("data-delete");
    if (deleteId) return remove(deleteId, target);
  }

  function share(id) {
    var base = root.location ? root.location.origin + root.location.pathname : "";
    var url = base + "?entry=" + encodeURIComponent(id);
    if (root.navigator && typeof root.navigator.share === "function") {
      root.navigator.share({title: "GOAT LADDER · Camino a la Leyenda", url: url}).catch(function () { copy(url); });
      return;
    }
    copy(url);
  }

  function copy(text) {
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(text).then(function () { toast(t("shareCopied")); },
        function () { toast(text); });
      return;
    }
    toast(text);
  }

  function remove(id, button) {
    if (root.confirm && !root.confirm(t("deleteConfirm"))) return;
    var token = tokens()[id];
    if (!token) { toast(t("deleteFailed")); return; }
    if (button) button.disabled = true;
    request((state.board === "careers" ? "/api/goat-ladder/careers?id=" : "/api/goat-ladder?id=") +
      encodeURIComponent(id) + "&mode=" + encodeURIComponent(state.mode), {
      method: "DELETE", headers: {Authorization: "Bearer " + token}
    }).then(function () {
      forgetToken(id);
      cacheDrop(cacheKey(state));
      entries = entries.filter(function (entry) { return entry.id !== id; });
      toast(t("deleted"));
      paint();
    }).catch(function (problem) {
      if (button) button.disabled = false;
      toast(problem.message || t("deleteFailed"));
    });
  }

  /* ---------------- arranque ---------------- */

  var started = false;
  function init() {
    if (started) return Promise.resolve();
    started = true;
    var page = doc.querySelector(".goat-page") || doc.body;
    els.list = doc.getElementById("goat-entries");
    if (!els.list) return;
    els.status = doc.getElementById("goat-status");
    els.retry = doc.getElementById("goat-retry");
    els.boards = doc.querySelector(".goat-filters .goat-segment[aria-label]");
    var segments = doc.querySelectorAll(".goat-filters .goat-segment");
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].querySelector("button[data-board]")) els.boards = segments[i];
      if (segments[i].querySelector("button[data-mode]")) els.modes = segments[i];
      if (segments[i].querySelector("button[data-period]")) els.periods = segments[i];
    }
    els.metric = doc.getElementById("goat-metric");
    if (els.metric && els.metric.parentNode) els.metricLabel = els.metric.parentNode.firstChild;

    var langAttr = (doc.body && doc.body.getAttribute("data-lang")) ||
      (doc.documentElement && doc.documentElement.getAttribute("lang")) || "es";
    lang = TEXT[langAttr] ? langAttr : "es";
    origin = normalizeOrigin(root.GOAT_API_URL || "");

    state = sanitizeState(readQuery(root.location ? root.location.search : ""));
    shown = PAGE_SIZE;
    paintFilters();

    /* Buscador: se crea antes de conectar los eventos. Filtra al escribir, sin red. */
    var searchHost = doc.querySelector(".goat-filters");
    if (searchHost && !doc.getElementById("goat-search")) {
      var input = doc.createElement("input");
      input.id = "goat-search";
      input.className = "goat-search";
      input.type = "search";
      input.setAttribute("aria-label", t("search"));
      input.setAttribute("placeholder", t("search"));
      input.value = state.search;
      searchHost.appendChild(input);
      els.search = input;
    } else if (!els.search) {
      els.search = doc.getElementById("goat-search");
    }
    if (els.search) els.search.addEventListener("input", function () {
      state.search = els.search.value.slice(0, 40);
      shown = PAGE_SIZE;
      syncUrl();
      paint();
    });

    if (els.metric) els.metric.addEventListener("change", function () {
      apply({metric: els.metric.value});
    });
    if (page) page.addEventListener("click", function (event) {
      onFilterClick(event);
      onListClick(event);
    });
    if (els.retry) els.retry.addEventListener("click", function () { load({force: true, keepEntries: true}); });

    /* Ayuda para participar, si la página no la trae. */
    var hero = doc.querySelector(".goat-hero");
    if (hero) {
      var tip = doc.createElement("div");
      tip.className = "goat-howto-host";
      tip.innerHTML = howToHtml();
      hero.appendChild(tip);
    }

    if (root.addEventListener) {
      root.addEventListener("popstate", function () {
        state = sanitizeState(readQuery(root.location.search));
        paintFilters();
        load({keepEntries: true});
      });
      root.addEventListener("online", function () { if (error) load({force: true}); });
      doc.addEventListener("visibilitychange", function () {
        if (doc.hidden === false && updatedAt && Date.now() - updatedAt > STALE_AFTER) load({keepEntries: true});
      });
    }

    load({force: true});
    /* Foco en el ranking seleccionado por enlace compartido. */
    if (state.entry && els.status) els.status.setAttribute("data-entry", state.entry);
  }

  root.GoatBoard = {
    TEXT: TEXT, METRICS: METRICS, PERIODS: PERIODS,
    normalizeOrigin: normalizeOrigin, readQuery: readQuery, sanitizeState: sanitizeState,
    apiPath: apiPath, cacheKey: cacheKey, classify: classify, timeAgo: timeAgo,
    groupHonours: groupHonours, matchesSearch: matchesSearch, metricLabelKey: metricLabelKey,
    setLang: function (value) { lang = TEXT[value] ? value : "es"; },
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
