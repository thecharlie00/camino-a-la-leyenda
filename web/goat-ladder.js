/* Standalone public ranking page. Render API values as text, never as HTML. */
(function () {
  "use strict";
  var api = (window.GOAT_API_URL || "").replace(/\/+$/, "");
  var lang = document.documentElement.lang || "es";
  var text = {
    es: {honours:"Palmarés", honoursTeam:"Títulos colectivos", honoursInd:"Títulos individuales", loading:"Cargando ranking…", error:"No se pudo cargar el ranking.", empty:"Aún no hay carreras en este ranking.", emptyAchievements:"Aún no hay gestas en este ranking.", unverified:"Sin verificar · enviado por la comunidad", score:"GOAT SCORE", match:"Partido", season:"Temporada", goals:"Goles", assists:"Asistencias", rating:"Valoración", minutes:"Minutos", result:"Resultado", record:"Balance", position:"Posición", club:"Club", competition:"Competición", opponent:"Rival", seasons:"Temporadas", appearances:"Partidos", clean_sheets:"Porterías a cero", trophies:"Títulos", awards:"Premios", international_caps:"Partidos internacionales", international_goals:"Goles internacionales", wins:"Victorias", draws:"Empates", losses:"Derrotas", unbeaten_seasons:"Temporadas invictas", promotions:"Ascensos", clubs:"Clubes", win_percentage:"Porcentaje de victorias", history:"Historial de temporadas", promoted:"Ascenso", goals_for:"Goles a favor", goals_against:"Goles en contra", career:"Carrera", metric:"Métrica"},
    en: {honours:"Honours", honoursTeam:"Team titles", honoursInd:"Individual awards", loading:"Loading ranking…", error:"The ranking could not be loaded.", empty:"There are no careers in this ranking yet.", emptyAchievements:"There are no achievements in this ranking yet.", unverified:"Unverified · community-reported", score:"GOAT SCORE", match:"Match", season:"Season", goals:"Goals", assists:"Assists", rating:"Rating", minutes:"Minutes", result:"Result", record:"Record", position:"Position", club:"Club", competition:"Competition", opponent:"Opponent", seasons:"Seasons", appearances:"Appearances", clean_sheets:"Clean sheets", trophies:"Trophies", awards:"Awards", international_caps:"International appearances", international_goals:"International goals", wins:"Wins", draws:"Draws", losses:"Losses", unbeaten_seasons:"Unbeaten seasons", promotions:"Promotions", clubs:"Clubs", win_percentage:"Win percentage", history:"Season history", promoted:"Promoted", goals_for:"Goals for", goals_against:"Goals against", career:"Career", metric:"Metric"},
    de: {honours:"Erfolge", honoursTeam:"Mannschaftstitel", honoursInd:"Einzelauszeichnungen", loading:"Rangliste wird geladen…", error:"Die Rangliste konnte nicht geladen werden.", empty:"Noch keine Karrieren in dieser Rangliste.", emptyAchievements:"Noch keine Erfolge in dieser Rangliste.", unverified:"Nicht verifiziert · von der Community gemeldet", score:"GOAT SCORE", match:"Spiel", season:"Saison", goals:"Tore", assists:"Vorlagen", rating:"Bewertung", minutes:"Minuten", result:"Ergebnis", record:"Bilanz", position:"Platz", club:"Verein", competition:"Wettbewerb", opponent:"Gegner", seasons:"Saisons", appearances:"Einsätze", clean_sheets:"Zu-Null-Spiele", trophies:"Titel", awards:"Auszeichnungen", international_caps:"Länderspiele", international_goals:"Länderspieltore", wins:"Siege", draws:"Unentschieden", losses:"Niederlagen", unbeaten_seasons:"Ungeschlagene Saisons", promotions:"Aufstiege", clubs:"Vereine", win_percentage:"Siegquote", history:"Saisonverlauf", promoted:"Aufgestiegen", goals_for:"Tore", goals_against:"Gegentore", career:"Karriere", metric:"Kennzahl"},
    it: {honours:"Palmarès", honoursTeam:"Titoli di squadra", honoursInd:"Premi individuali", loading:"Caricamento classifica…", error:"Impossibile caricare la classifica.", empty:"Non ci sono ancora carriere in questa classifica.", emptyAchievements:"Non ci sono ancora imprese in questa classifica.", unverified:"Non verificato · segnalato dalla community", score:"GOAT SCORE", match:"Partita", season:"Stagione", goals:"Gol", assists:"Assist", rating:"Voto", minutes:"Minuti", result:"Risultato", record:"Bilancio", position:"Posizione", club:"Club", competition:"Competizione", opponent:"Avversario", seasons:"Stagioni", appearances:"Presenze", clean_sheets:"Partite senza subire gol", trophies:"Titoli", awards:"Premi", international_caps:"Presenze internazionali", international_goals:"Gol internazionali", wins:"Vittorie", draws:"Pareggi", losses:"Sconfitte", unbeaten_seasons:"Stagioni imbattute", promotions:"Promozioni", clubs:"Club", win_percentage:"Percentuale vittorie", history:"Storico stagioni", promoted:"Promosso", goals_for:"Gol fatti", goals_against:"Gol subiti", career:"Carriera", metric:"Metrica"},
    fr: {honours:"Palmarès", honoursTeam:"Titres collectifs", honoursInd:"Distinctions individuelles", loading:"Chargement du classement…", error:"Impossible de charger le classement.", empty:"Aucune carrière dans ce classement pour le moment.", emptyAchievements:"Aucun exploit dans ce classement pour le moment.", unverified:"Non vérifié · déclaré par la communauté", score:"GOAT SCORE", match:"Match", season:"Saison", goals:"Buts", assists:"Passes décisives", rating:"Note", minutes:"Minutes", result:"Résultat", record:"Bilan", position:"Position", club:"Club", competition:"Compétition", opponent:"Adversaire", seasons:"Saisons", appearances:"Apparitions", clean_sheets:"Matchs sans encaisser", trophies:"Titres", awards:"Récompenses", international_caps:"Sélections", international_goals:"Buts internationaux", wins:"Victoires", draws:"Matchs nuls", losses:"Défaites", unbeaten_seasons:"Saisons sans défaite", promotions:"Promotions", clubs:"Clubs", win_percentage:"Pourcentage de victoires", history:"Historique des saisons", promoted:"Promu", goals_for:"Buts marqués", goals_against:"Buts encaissés", career:"Carrière", metric:"Statistique"}
  };
  var metricKeys = {
    player: ["appearances", "goals", "assists", "trophies", "awards", "clean_sheets", "international_caps", "international_goals", "clubs", "seasons"],
    manager: ["wins", "draws", "losses", "trophies", "unbeaten_seasons", "promotions", "win_percentage", "clubs", "seasons"]
  };
  var t = text[lang] || text.es;
  var status = document.getElementById("goat-status");
  var entries = document.getElementById("goat-entries");
  var retry = document.getElementById("goat-retry");
  var metricSelect = document.getElementById("goat-metric");
  var mode = "player", timeframe = "all-time", board = "careers", metric = "appearances", loadId = 0;

  function node(tag, className, value) {
    var el = document.createElement(tag);
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
    var value = metrics[key];
    return key === "win_percentage" && value != null ? value + "%" : value;
  }
  function renderMetricOptions() {
    var choices = metricKeys[mode], selected = choices.indexOf(metric) >= 0 ? metric : choices[0];
    metric = selected;
    metricSelect.replaceChildren();
    choices.forEach(function (key) {
      var option = node("option", "", t[key] || key);
      option.value = key;
      option.selected = key === selected;
      metricSelect.appendChild(option);
    });
    metricSelect.value = selected;
    metricSelect.parentElement.hidden = board !== "careers";
  }
  function seasonHistory(entry) {
    var details = node("details", "goat-career-history");
    var summary = node("summary", "", t.history);
    details.appendChild(summary);
    (entry.history || []).slice().reverse().forEach(function (season) {
      var row = node("p", "goat-season-row");
      var head = [season.season, season.club, season.competition].filter(Boolean).join(" · ");
      row.appendChild(node("strong", "", head));
      var values = entry.game_mode === "player"
        ? [t.appearances + ": " + season.appearances, t.goals + ": " + season.goals,
          t.assists + ": " + season.assists, t.trophies + ": " + (season.trophies || []).length]
        : [t.wins + ": " + season.wins + "-" + season.draws + "-" + season.losses,
          t.goals_for + ": " + season.goals_for, t.goals_against + ": " + season.goals_against];
      if (season.position != null) values.push(t.position + ": " + season.position);
      if (season.promoted) values.push(t.promoted);
      row.appendChild(node("span", "", values.join(" · ")));
      if (season.trophies && season.trophies.length) {
        row.appendChild(node("span", "goat-season-honors", t.trophies + ": " + season.trophies.join(", ")));
      }
      if (season.awards && season.awards.length) {
        row.appendChild(node("span", "goat-season-honors", t.awards + ": " + season.awards.join(", ")));
      }
      details.appendChild(row);
    });
    return details;
  }
  /* Palmarés con trofeos pixelados (pixel.js + trophies.js) */
  function honours(entry) {
    var wrap = node("div", "goat-honours");
    if (!window.PX || !PX.honours) return wrap;
    var list = PX.honours(entry.history || []);
    if (!list.length) return wrap;
    wrap.appendChild(node("div", "goat-hon-t", t.honours));
    [false, true].forEach(function (ind) {
      var items = list.filter(function (h) { return h.ind === ind; });
      if (!items.length) return;
      wrap.appendChild(node("div", "goat-hon-h", ind ? t.honoursInd : t.honoursTeam));
      var row = node("div", "goat-hon");
      items.forEach(function (h) {
        var item = node("span", "goat-hon-i");
        var years = h.years.filter(function (y, i, a) { return a.indexOf(y) === i; }).join(", ");
        item.title = h.name + (years ? " · " + years : "");
        var icon = document.createElement("span");
        icon.innerHTML = PX.trophy(h.key, 30, h.name);
        item.appendChild(icon.firstChild);
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
  function careerCard(entry, index) {
    var article = node("article", "goat-card");
    var head = node("div", "goat-card-head");
    head.appendChild(node("span", "goat-rank", "#" + (index + 1) + " · " + t.career));
    head.appendChild(node("strong", "goat-score", metricValue(entry.metrics || {}, metric) + " " + t[metric]));
    article.appendChild(head);
    article.appendChild(node("h2", "goat-card-title", entry.title));
    article.appendChild(node("p", "goat-card-meta", [entry.display_name, entry.current_club,
      entry.started_season + "–" + entry.latest_season].filter(Boolean).join(" · ")));
    var stats = node("div", "goat-stats"), metrics = entry.metrics || {};
    (entry.game_mode === "player"
      ? ["seasons", "appearances", "goals", "assists", "clean_sheets", "trophies", "awards", "international_caps", "international_goals", "clubs"]
      : ["seasons", "wins", "draws", "losses", "trophies", "unbeaten_seasons", "promotions", "clubs", "win_percentage"]
    ).forEach(function (key) { stat(stats, t[key], metricValue(metrics, key)); });
    article.appendChild(stats);
    article.appendChild(honours(entry));
    article.appendChild(seasonHistory(entry));
    article.appendChild(node("p", "goat-unverified", t.unverified));
    return article;
  }
  function achievementCard(entry, index) {
    var article = node("article", "goat-card");
    var head = node("div", "goat-card-head");
    head.appendChild(node("span", "goat-rank", "#" + (index + 1) + " · " + t[entry.event_type === "season" ? "season" : "match"]));
    head.appendChild(node("strong", "goat-score", entry.goat_score + " " + t.score));
    article.appendChild(head);
    article.appendChild(node("h2", "goat-card-title", entry.title));
    article.appendChild(node("p", "goat-card-meta", [entry.display_name, entry.club_name, entry.competition_name].filter(Boolean).join(" · ")));
    var stats = node("div", "goat-stats"), values = entry.metrics || {};
    if (entry.game_mode === "player") {
      stat(stats, t.goals, values.goals); stat(stats, t.assists, values.assists);
      stat(stats, t.rating, values.match_rating == null ? null : Number(values.match_rating).toFixed(1));
      stat(stats, t.minutes, values.minutes_played);
    } else if (entry.event_type === "season") {
      stat(stats, t.record, [values.wins, values.draws, values.losses].join("-"));
      stat(stats, t.position, values.league_position);
    } else {
      stat(stats, t.result, values.own_score + "–" + values.opponent_score);
    }
    article.appendChild(stats);
    article.appendChild(node("p", "goat-unverified", t.unverified));
    return article;
  }
  function load() {
    var requestId = ++loadId;
    entries.replaceChildren();
    retry.hidden = true;
    status.textContent = t.loading;
    if (!api) {
      status.textContent = t.error;
      retry.hidden = false;
      return;
    }
    renderMetricOptions();
    var path = board === "careers" ? "/api/goat-ladder/careers" : "/api/goat-ladder";
    var query = "?mode=" + encodeURIComponent(mode) + "&timeframe=" + encodeURIComponent(timeframe);
    if (board === "careers") query += "&metric=" + encodeURIComponent(metric);
    fetch(api + path + query)
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || ("HTTP " + response.status));
          return data;
        });
      })
      .then(function (data) {
        if (requestId !== loadId) return;
        var list = data.entries || [];
        status.textContent = list.length ? "" : t[board === "careers" ? "empty" : "emptyAchievements"];
        list.forEach(function (entry, index) {
          entries.appendChild(board === "careers" ? careerCard(entry, index) : achievementCard(entry, index));
        });
      })
      .catch(function (error) {
        if (requestId !== loadId) return;
        console.error("GOAT LADDER ranking request failed", error);
        status.textContent = t.error;
        retry.hidden = false;
      });
  }
  document.addEventListener("change", function (event) {
    if (event.target === metricSelect) { metric = metricSelect.value; load(); }
  });
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-board], [data-mode], [data-period], #goat-retry");
    if (!button) return;
    if (button.hasAttribute("data-board")) board = button.getAttribute("data-board") === "achievements" ? "achievements" : "careers";
    if (button.hasAttribute("data-mode")) mode = button.getAttribute("data-mode");
    if (button.hasAttribute("data-period")) timeframe = button.getAttribute("data-period");
    if (button.hasAttribute("data-board") || button.hasAttribute("data-mode") || button.hasAttribute("data-period")) {
      document.querySelectorAll("[data-board]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item.getAttribute("data-board") === board));
      });
      document.querySelectorAll("[data-mode]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item.getAttribute("data-mode") === mode));
      });
      document.querySelectorAll("[data-period]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item.getAttribute("data-period") === timeframe));
      });
      if (button.hasAttribute("data-mode")) metric = metricKeys[mode][0];
      load();
    }
  });
  load();
})();
