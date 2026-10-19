/* GOAT LADDER: ranking y publicación explícita de una actuación. */
(function () {
  "use strict";
  var TEXT = {
    es: {
      boardCareers: "Carreras", boardAchievements: "Gestas", careerTitlePlayer: "Carrera de Jugador",
      careerTitleManager: "Carrera de Míster", publishCareer: "Publicar carrera completa",
      careerConsent: "Acepto publicar este alias, el título, las métricas agregadas y el historial completo de temporadas de esta carrera. No se enviará la partida guardada.",
      careerPrivacy: "Se publicarán el alias, el título, las métricas y el historial de temporadas con clubes, competiciones, estadísticas, títulos y premios. No se envía la partida completa. Los datos son públicos y no están verificados.",
      careerNoData: "Avanza al menos una temporada para publicar tu carrera.", careerPublished: "Carrera publicada",
      careerSeasons: "Temporadas", careerAppearances: "Partidos", careerWins: "Victorias",
      careerDraws: "Empates", careerLosses: "Derrotas",
      careerGoals: "Goles", careerAssists: "Asistencias", careerTrophies: "Títulos",
      careerAwards: "Premios", careerCleanSheets: "Porterías a cero", careerCaps: "Partidos internacionales",
      careerIntlGoals: "Goles internacionales", careerUnbeaten: "Temporadas invictas",
      careerPromotions: "Ascensos", careerClubs: "Clubes", careerWinRate: "% victorias",
      emptyCareers: "Aún no hay carreras compartidas en este ranking.", careerHistory: "Historial de temporadas",
      careerPosition: "Posición", careerPromoted: "Ascenso", careerDeleteConfirm: "¿Quieres eliminar esta carrera del ranking?",
      deleteCareer: "Eliminar mi carrera",
      careerMetric: "Ordenar por", metricSeasons: "Temporadas", metricAppearances: "Partidos",
      metricGoals: "Goles", metricAssists: "Asistencias", metricCleanSheets: "Porterías a cero",
      metricTrophies: "Títulos", metricAwards: "Premios", metricCaps: "Partidos internacionales",
      metricIntlGoals: "Goles internacionales", metricWins: "Victorias", metricUnbeaten: "Temporadas invictas",
      metricDraws: "Empates", metricLosses: "Derrotas", metricPromotions: "Ascensos", metricClubs: "Clubes", metricWinRate: "% victorias",
      home: "GOAT LADDER", player: "Jugador", manager: "Míster", all: "Todos", week: "7 días",
      month: "30 días", loading: "Cargando ranking…", unavailable: "El ranking global aún no está configurado.",
      setup: "Cuando se configure el servicio, podrás consultar y publicar gestas desde la web y la app.",
      empty: "Aún no hay gestas en este ranking.", retry: "Volver a cargar", publish: "Publicar mi gesta",
      latest: "Última actuación disponible", alias: "Nombre público (alias)", title: "Título de la gesta",
      consent: "Acepto publicar este alias, el título y las estadísticas que se muestran para esta gesta. Serán visibles para cualquiera.",
      noLatest: "Termina un partido o una temporada para preparar una gesta.", privacy: "Al abrir el ranking, Cloudflare procesa la solicitud y puede recibir tu dirección IP. Solo al pulsar Publicar se envían el alias, el título y las estadísticas de esta gesta, que quedan públicos. Los resultados se calculan en el dispositivo y no se verifican con un servidor del juego; no incluyas datos personales.",
      score: "GOAT SCORE", verified: "Sin verificar · enviado por la comunidad", eventMatch: "Partido",
      eventSeason: "Temporada", goals: "Goles", assists: "Asistencias", rating: "Valoración",
      minutes: "Minutos", result: "Resultado", record: "Balance", position: "Posición",
      competition: "Competición", club: "Club",
      opponent: "Rival", submitted: "Gesta publicada", error: "No se pudo completar la solicitud", close: "Cerrar",
      modePlayer: "Ranking Jugador", modeManager: "Ranking Míster", login: "No hace falta crear una cuenta.",
      submitConsent: "Debes aceptar la publicación antes de enviar.", validation: "Escribe un alias de 2 a 32 caracteres y un título.",
      delete: "Eliminar mi gesta", deleteConfirm: "¿Quieres eliminar esta entrada del ranking?",
      deleteSaved: "Puedes eliminar esta entrada desde este dispositivo.", deleteNotSaved: "No se pudo guardar la clave de eliminación en este dispositivo."
    },
    en: {
      boardCareers: "Careers", boardAchievements: "Achievements", careerTitlePlayer: "Player career",
      careerTitleManager: "Manager career", publishCareer: "Publish complete career",
      careerConsent: "I agree to publish this alias, title, aggregate metrics and the full season history for this career. The save file will not be sent.",
      careerPrivacy: "The alias, title, metrics and season history (clubs, competitions, stats, trophies and awards) will be public. The full save is not sent. Entries are community-reported and unverified.",
      careerNoData: "Complete at least one season to publish your career.", careerPublished: "Career published",
      careerSeasons: "Seasons", careerAppearances: "Appearances", careerWins: "Wins",
      careerDraws: "Draws", careerLosses: "Losses",
      careerGoals: "Goals", careerAssists: "Assists", careerTrophies: "Trophies",
      careerAwards: "Awards", careerCleanSheets: "Clean sheets", careerCaps: "International appearances",
      careerIntlGoals: "International goals", careerUnbeaten: "Unbeaten seasons",
      careerPromotions: "Promotions", careerClubs: "Clubs", careerWinRate: "Win %",
      emptyCareers: "No shared careers in this ranking yet.", careerHistory: "Season history",
      careerPosition: "Position", careerPromoted: "Promoted", careerDeleteConfirm: "Delete this career from the ranking?",
      deleteCareer: "Delete my career",
      careerMetric: "Rank by", metricSeasons: "Seasons", metricAppearances: "Appearances",
      metricGoals: "Goals", metricAssists: "Assists", metricCleanSheets: "Clean sheets",
      metricTrophies: "Trophies", metricAwards: "Awards", metricCaps: "International appearances",
      metricIntlGoals: "International goals", metricWins: "Wins", metricUnbeaten: "Unbeaten seasons",
      metricDraws: "Draws", metricLosses: "Losses", metricPromotions: "Promotions", metricClubs: "Clubs", metricWinRate: "Win %",
      home: "GOAT LADDER", player: "Player", manager: "Manager", all: "All time", week: "7 days",
      month: "30 days", loading: "Loading ranking…", unavailable: "The global ranking is not configured yet.",
      setup: "Once the service is configured, you can browse and publish records from web and app.",
      empty: "No records in this ranking yet.", retry: "Reload", publish: "Publish my record",
      latest: "Latest performance available", alias: "Public name (alias)", title: "Record title",
      consent: "I agree to publish this alias, title and the stats shown for this record. They will be public.",
      noLatest: "Finish a match or season to prepare a record.", privacy: "When you open the ranking, Cloudflare processes the request and may receive your IP address. Only when you press Publish are your alias, title and this record's stats sent; they become public. Match results are calculated on-device and are not verified by a game server; do not include personal information.",
      score: "GOAT SCORE", verified: "Unverified · community-reported", eventMatch: "Match",
      eventSeason: "Season", goals: "Goals", assists: "Assists", rating: "Rating",
      minutes: "Minutes", result: "Result", record: "W-D-L", position: "Position",
      competition: "Competition", club: "Club",
      opponent: "Opponent", submitted: "Record published", error: "The request could not be completed", close: "Close",
      modePlayer: "Player ranking", modeManager: "Manager ranking", login: "No account is required.",
      submitConsent: "Accept publication before submitting.", validation: "Enter an alias (2–32 characters) and a title.",
      delete: "Delete my record", deleteConfirm: "Delete this entry from the ranking?",
      deleteSaved: "You can delete this entry from this device.", deleteNotSaved: "The deletion key could not be saved on this device."
    },
    de: {
      boardCareers: "Karrieren", boardAchievements: "Erfolge", careerTitlePlayer: "Spielerkarriere",
      careerTitleManager: "Managerkarriere", publishCareer: "Komplette Karriere veröffentlichen",
      careerConsent: "Ich stimme zu, diesen Alias, Titel, zusammengefasste Kennzahlen und den vollständigen Saisonverlauf dieser Karriere zu veröffentlichen. Der Spielstand wird nicht gesendet.",
      careerPrivacy: "Alias, Titel, Kennzahlen und Saisonverlauf mit Vereinen, Wettbewerben, Statistiken, Titeln und Auszeichnungen werden öffentlich. Der Spielstand wird nicht gesendet. Die Angaben sind nicht verifiziert.",
      careerNoData: "Schließe mindestens eine Saison ab, um deine Karriere zu veröffentlichen.", careerPublished: "Karriere veröffentlicht",
      careerSeasons: "Saisons", careerAppearances: "Einsätze", careerWins: "Siege",
      careerDraws: "Unentschieden", careerLosses: "Niederlagen",
      careerGoals: "Tore", careerAssists: "Vorlagen", careerTrophies: "Titel",
      careerAwards: "Auszeichnungen", careerCleanSheets: "Zu-Null-Spiele", careerCaps: "Länderspiele",
      careerIntlGoals: "Länderspieltore", careerUnbeaten: "Ungeschlagene Saisons",
      careerPromotions: "Aufstiege", careerClubs: "Vereine", careerWinRate: "Siegquote",
      emptyCareers: "Noch keine geteilten Karrieren in dieser Rangliste.", careerHistory: "Saisonverlauf",
      careerPosition: "Platz", careerPromoted: "Aufgestiegen", careerDeleteConfirm: "Diese Karriere aus der Rangliste löschen?",
      deleteCareer: "Meine Karriere löschen",
      careerMetric: "Sortieren nach", metricSeasons: "Saisons", metricAppearances: "Einsätze",
      metricGoals: "Tore", metricAssists: "Vorlagen", metricCleanSheets: "Zu-Null-Spiele",
      metricTrophies: "Titel", metricAwards: "Auszeichnungen", metricCaps: "Länderspiele",
      metricIntlGoals: "Länderspieltore", metricWins: "Siege", metricUnbeaten: "Ungeschlagene Saisons",
      metricDraws: "Unentschieden", metricLosses: "Niederlagen", metricPromotions: "Aufstiege", metricClubs: "Vereine", metricWinRate: "Siegquote",
      home: "GOAT LADDER", player: "Spieler", manager: "Manager", all: "Alle", week: "7 Tage",
      month: "30 Tage", loading: "Rangliste wird geladen…", unavailable: "Die globale Rangliste ist noch nicht eingerichtet.",
      setup: "Nach der Einrichtung kannst du Erfolge in Web und App ansehen und veröffentlichen.",
      empty: "Noch keine Einträge in dieser Rangliste.", retry: "Neu laden", publish: "Erfolg veröffentlichen",
      latest: "Letzte verfügbare Leistung", alias: "Öffentlicher Name (Alias)", title: "Titel des Erfolgs",
      consent: "Ich stimme zu, diesen Alias, Titel und die angezeigten Statistiken dieses Eintrags zu veröffentlichen.",
      noLatest: "Beende ein Spiel oder eine Saison, um einen Eintrag vorzubereiten.", privacy: "Beim Öffnen der Rangliste verarbeitet Cloudflare die Anfrage und kann deine IP-Adresse erhalten. Alias, Titel und Statistiken dieses Eintrags werden erst beim Tippen auf Veröffentlichen gesendet und sind dann öffentlich. Spielergebnisse werden auf dem Gerät berechnet und nicht durch einen Spielserver verifiziert; gib keine persönlichen Daten an.",
      score: "GOAT SCORE", verified: "Nicht verifiziert · von der Community gemeldet", eventMatch: "Spiel",
      eventSeason: "Saison", goals: "Tore", assists: "Vorlagen", rating: "Bewertung",
      minutes: "Minuten", result: "Ergebnis", record: "Bilanz", position: "Platz",
      competition: "Wettbewerb", club: "Verein",
      opponent: "Gegner", submitted: "Erfolg veröffentlicht", error: "Die Anfrage konnte nicht abgeschlossen werden", close: "Schließen",
      modePlayer: "Spieler-Rangliste", modeManager: "Manager-Rangliste", login: "Kein Konto erforderlich.",
      submitConsent: "Stimme der Veröffentlichung vor dem Senden zu.", validation: "Gib einen Alias (2–32 Zeichen) und einen Titel ein.",
      delete: "Meinen Eintrag löschen", deleteConfirm: "Diesen Eintrag aus der Rangliste löschen?",
      deleteSaved: "Du kannst diesen Eintrag auf diesem Gerät löschen.", deleteNotSaved: "Der Löschschlüssel konnte auf diesem Gerät nicht gespeichert werden."
    },
    it: {
      boardCareers: "Carriere", boardAchievements: "Imprese", careerTitlePlayer: "Carriera da giocatore",
      careerTitleManager: "Carriera da mister", publishCareer: "Pubblica la carriera completa",
      careerConsent: "Accetto di pubblicare questo alias, il titolo, le metriche aggregate e lo storico completo delle stagioni. Il salvataggio non verrà inviato.",
      careerPrivacy: "Saranno pubblici alias, titolo, metriche e storico delle stagioni con club, competizioni, statistiche, titoli e premi. Il salvataggio completo non viene inviato. I dati non sono verificati.",
      careerNoData: "Completa almeno una stagione per pubblicare la carriera.", careerPublished: "Carriera pubblicata",
      careerSeasons: "Stagioni", careerAppearances: "Presenze", careerWins: "Vittorie",
      careerDraws: "Pareggi", careerLosses: "Sconfitte",
      careerGoals: "Gol", careerAssists: "Assist", careerTrophies: "Titoli",
      careerAwards: "Premi", careerCleanSheets: "Partite senza subire gol", careerCaps: "Presenze internazionali",
      careerIntlGoals: "Gol internazionali", careerUnbeaten: "Stagioni imbattute",
      careerPromotions: "Promozioni", careerClubs: "Club", careerWinRate: "Percentuale vittorie",
      emptyCareers: "Non ci sono ancora carriere condivise in questa classifica.", careerHistory: "Storico stagioni",
      careerPosition: "Posizione", careerPromoted: "Promosso", careerDeleteConfirm: "Eliminare questa carriera dalla classifica?",
      deleteCareer: "Elimina la mia carriera",
      careerMetric: "Ordina per", metricSeasons: "Stagioni", metricAppearances: "Presenze",
      metricGoals: "Gol", metricAssists: "Assist", metricCleanSheets: "Partite senza subire gol",
      metricTrophies: "Titoli", metricAwards: "Premi", metricCaps: "Presenze internazionali",
      metricIntlGoals: "Gol internazionali", metricWins: "Vittorie", metricUnbeaten: "Stagioni imbattute",
      metricDraws: "Pareggi", metricLosses: "Sconfitte", metricPromotions: "Promozioni", metricClubs: "Club", metricWinRate: "Percentuale vittorie",
      home: "GOAT LADDER", player: "Giocatore", manager: "Mister", all: "Sempre", week: "7 giorni",
      month: "30 giorni", loading: "Caricamento classifica…", unavailable: "La classifica globale non è ancora configurata.",
      setup: "Dopo la configurazione potrai consultare e pubblicare imprese da web e app.",
      empty: "Non ci sono ancora record in questa classifica.", retry: "Ricarica", publish: "Pubblica la mia impresa",
      latest: "Ultima prestazione disponibile", alias: "Nome pubblico (alias)", title: "Titolo dell'impresa",
      consent: "Accetto di pubblicare questo alias, il titolo e le statistiche mostrate per questo record, visibili a tutti.",
      noLatest: "Completa una partita o una stagione per preparare un record.", privacy: "Quando apri la classifica, Cloudflare elabora la richiesta e può ricevere il tuo indirizzo IP. Alias, titolo e statistiche di questo record vengono inviati solo premendo Pubblica e diventano pubblici. I risultati sono calcolati sul dispositivo e non verificati da un server di gioco; non inserire dati personali.",
      score: "GOAT SCORE", verified: "Non verificato · segnalato dalla community", eventMatch: "Partita",
      eventSeason: "Stagione", goals: "Gol", assists: "Assist", rating: "Voto",
      minutes: "Minuti", result: "Risultato", record: "Bilancio", position: "Posizione",
      competition: "Competizione", club: "Club",
      opponent: "Avversario", submitted: "Impresa pubblicata", error: "Impossibile completare la richiesta", close: "Chiudi",
      modePlayer: "Classifica giocatori", modeManager: "Classifica mister", login: "Non serve un account.",
      submitConsent: "Accetta la pubblicazione prima di inviare.", validation: "Inserisci un alias (2–32 caratteri) e un titolo.",
      delete: "Elimina il mio record", deleteConfirm: "Eliminare questa voce dalla classifica?",
      deleteSaved: "Puoi eliminare questa voce da questo dispositivo.", deleteNotSaved: "Impossibile salvare la chiave di eliminazione su questo dispositivo."
    },
    fr: {
      boardCareers: "Carrières", boardAchievements: "Exploits", careerTitlePlayer: "Carrière de joueur",
      careerTitleManager: "Carrière de manager", publishCareer: "Publier la carrière complète",
      careerConsent: "J'accepte de publier cet alias, le titre, les statistiques agrégées et l'historique complet des saisons. La sauvegarde ne sera pas envoyée.",
      careerPrivacy: "L'alias, le titre, les statistiques et l'historique des saisons avec clubs, compétitions, résultats, titres et récompenses seront publics. La sauvegarde complète n'est pas envoyée. Les données ne sont pas vérifiées.",
      careerNoData: "Termine au moins une saison pour publier ta carrière.", careerPublished: "Carrière publiée",
      careerSeasons: "Saisons", careerAppearances: "Apparitions", careerWins: "Victoires",
      careerDraws: "Matchs nuls", careerLosses: "Défaites",
      careerGoals: "Buts", careerAssists: "Passes décisives", careerTrophies: "Titres",
      careerAwards: "Récompenses", careerCleanSheets: "Matchs sans encaisser", careerCaps: "Sélections",
      careerIntlGoals: "Buts internationaux", careerUnbeaten: "Saisons sans défaite",
      careerPromotions: "Promotions", careerClubs: "Clubs", careerWinRate: "Taux de victoire",
      emptyCareers: "Aucune carrière partagée dans ce classement pour le moment.", careerHistory: "Historique des saisons",
      careerPosition: "Position", careerPromoted: "Promu", careerDeleteConfirm: "Supprimer cette carrière du classement ?",
      deleteCareer: "Supprimer ma carrière",
      careerMetric: "Classer par", metricSeasons: "Saisons", metricAppearances: "Apparitions",
      metricGoals: "Buts", metricAssists: "Passes décisives", metricCleanSheets: "Matchs sans encaisser",
      metricTrophies: "Titres", metricAwards: "Récompenses", metricCaps: "Sélections",
      metricIntlGoals: "Buts internationaux", metricWins: "Victoires", metricUnbeaten: "Saisons sans défaite",
      metricDraws: "Matchs nuls", metricLosses: "Défaites", metricPromotions: "Promotions", metricClubs: "Clubs", metricWinRate: "Taux de victoire",
      home: "GOAT LADDER", player: "Joueur", manager: "Manager", all: "Tout", week: "7 jours",
      month: "30 jours", loading: "Chargement du classement…", unavailable: "Le classement mondial n'est pas encore configuré.",
      setup: "Une fois le service configuré, tu pourras consulter et publier des exploits sur le web et l'app.",
      empty: "Aucun record dans ce classement pour le moment.", retry: "Recharger", publish: "Publier mon exploit",
      latest: "Dernière performance disponible", alias: "Nom public (alias)", title: "Titre de l'exploit",
      consent: "J'accepte de publier cet alias, le titre et les statistiques affichées pour ce record, visibles par tous.",
      noLatest: "Termine un match ou une saison pour préparer un record.", privacy: "Lorsque tu ouvres le classement, Cloudflare traite la requête et peut recevoir ton adresse IP. L'alias, le titre et les statistiques de ce record ne sont envoyés qu'après avoir appuyé sur Publier et deviennent publics. Les résultats sont calculés sur l'appareil et ne sont pas vérifiés par un serveur de jeu ; n'inclus aucune donnée personnelle.",
      score: "GOAT SCORE", verified: "Non vérifié · déclaré par la communauté", eventMatch: "Match",
      eventSeason: "Saison", goals: "Buts", assists: "Passes décisives", rating: "Note",
      minutes: "Minutes", result: "Résultat", record: "B-N-D", position: "Position",
      competition: "Compétition", club: "Club",
      opponent: "Adversaire", submitted: "Exploit publié", error: "La requête n'a pas pu aboutir", close: "Fermer",
      modePlayer: "Classement joueur", modeManager: "Classement manager", login: "Aucun compte requis.",
      submitConsent: "Accepte la publication avant l'envoi.", validation: "Saisis un alias (2–32 caractères) et un titre.",
      delete: "Supprimer mon record", deleteConfirm: "Supprimer cette entrée du classement ?",
      deleteSaved: "Tu peux supprimer cette entrée depuis cet appareil.", deleteNotSaved: "La clé de suppression n'a pas pu être enregistrée sur cet appareil."
    }
  };
  window.GOAT_TEXT = TEXT;
  var service = window.GoatLadder;
  var tr = service.t;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char];
    });
  }
  function stat(label, value) {
    if (value == null || value === "") return "";
    return '<span class="goat-stat"><small>' + esc(label) + '</small><b>' + esc(value) + "</b></span>";
  }
  function MatchStatsSummary(entry) {
    var metrics = entry.metrics || {}, stats = [];
    if (entry.game_mode === "player") {
      stats.push(stat(tr("goals"), metrics.goals), stat(tr("assists"), metrics.assists),
        stat(tr("rating"), metrics.match_rating == null ? "" : Number(metrics.match_rating).toFixed(1)),
        stat(tr("minutes"), metrics.minutes_played));
    } else if (entry.event_type === "season") {
      stats.push(stat(tr("record"), (metrics.wins || 0) + "-" + (metrics.draws || 0) + "-" + (metrics.losses || 0)),
        stat(tr("goals"), (metrics.goals_for || 0) + "–" + (metrics.goals_against || 0)),
        stat(tr("position"), metrics.league_position));
    } else {
      stats.push(stat(tr("result"), (metrics.own_score == null ? 0 : metrics.own_score) + "–" +
        (metrics.opponent_score == null ? 0 : metrics.opponent_score)),
      stat(tr("goals"), metrics.goals));
    }
    return '<div class="goat-stats">' + stats.join("") + "</div>";
  }
  var METRICS = {
    player: [
      ["appearances", "careerAppearances"], ["goals", "careerGoals"], ["assists", "careerAssists"],
      ["clean_sheets", "careerCleanSheets"], ["trophies", "careerTrophies"], ["awards", "careerAwards"],
      ["international_caps", "careerCaps"], ["international_goals", "careerIntlGoals"],
      ["clubs", "careerClubs"], ["seasons", "careerSeasons"]
    ],
    manager: [
      ["wins", "careerWins"], ["draws", "careerDraws"], ["losses", "careerLosses"],
      ["trophies", "careerTrophies"], ["unbeaten_seasons", "careerUnbeaten"],
      ["promotions", "careerPromotions"], ["win_percentage", "careerWinRate"], ["clubs", "careerClubs"],
      ["seasons", "careerSeasons"]
    ]
  };
  function CareerStatsSummary(metrics, mode) {
    return '<div class="goat-stats">' + METRICS[mode].map(function (item) {
      return stat(tr(item[1]), metrics[item[0]] == null ? "" :
        (item[0] === "win_percentage" ? metrics[item[0]] + "%" : metrics[item[0]]));
    }).join("") + "</div>";
  }
  function careerMetricValue(metrics, key) {
    var value = metrics[key];
    return value == null ? "" : (key === "win_percentage" ? value + "%" : value);
  }
  function CareerSeasonHistory(entry) {
    var rows = (entry.history || []).slice().reverse().map(function (season) {
      var heading = [season.season, season.club, season.competition].filter(Boolean).join(" · ");
      var summary = entry.game_mode === "player"
        ? [tr("careerAppearances") + ": " + season.appearances, tr("careerGoals") + ": " + season.goals,
          tr("careerAssists") + ": " + season.assists, tr("careerTrophies") + ": " + (season.trophies || []).length]
        : [tr("careerWins") + ": " + season.wins + "-" + season.draws + "-" + season.losses,
          tr("goals") + ": " + season.goals_for + "–" + season.goals_against];
      if (season.position != null) summary.push(tr("careerPosition") + ": " + season.position);
      if (season.promoted) summary.push(tr("careerPromoted"));
      return '<p class="goat-season"><b>' + esc(heading) + '</b><span>' +
        esc(summary.join(" · ")) + "</span>" +
        (season.trophies && season.trophies.length ? '<span>' +
          esc(tr("careerTrophies") + ": " + season.trophies.join(", ")) + "</span>" : "") +
        (season.awards && season.awards.length ? '<span>' +
          esc(tr("careerAwards") + ": " + season.awards.join(", ")) + "</span>" : "") + "</p>";
    }).join("");
    return '<details class="goat-history"><summary>' + esc(tr("careerHistory")) +
      "</summary>" + rows + "</details>";
  }
  function CareerLadderCard(entry, index, metric) {
    var metrics = entry.metrics || {};
    var metricName = METRICS[entry.game_mode].filter(function (item) { return item[0] === metric; })[0];
    var metricLabel = metricName ? tr(metricName[1]) : tr("careerSeasons");
    return '<article class="card goat-card"><div class="head"><span class="tag real">#' + (index + 1) +
      " · " + esc(tr("boardCareers")) + '</span><strong class="goat-score">' +
      esc(careerMetricValue(metrics, metric)) + " " + esc(metricLabel) + "</strong></div><h3>" +
      esc(entry.title) + '</h3><p class="goat-meta">' + esc(entry.display_name) + " · " +
      esc(entry.current_club) + " · " + esc(entry.started_season + "–" + entry.latest_season) +
      "</p>" + CareerStatsSummary(metrics, entry.game_mode) + CareerSeasonHistory(entry) +
      '<p class="goat-unverified">' + esc(tr("verified")) + "</p>" +
      (service.canDelete(entry.id) ? '<button class="btn wide" data-a="goatcareerdelete" data-v="' +
        esc(entry.id) + '"' + (entry.id === window.__goatSheet.deletingCareer ? " disabled" : "") +
        ">" + esc(tr("deleteCareer")) + "</button>" : "") + "</article>";
  }
  function GoatLadderCard(entry, index) {
    var opponent = entry.opponent_name ? " · " + tr("opponent") + ": " + entry.opponent_name : "";
    return '<article class="card goat-card"><div class="head"><span class="tag real">#' + (index + 1) +
      " · " + tr(entry.event_type === "season" ? "eventSeason" : "eventMatch") + '</span><strong class="goat-score">' +
      esc(entry.goat_score) + '</strong></div><h3>' + esc(entry.title) + '</h3><p class="goat-meta">' +
      esc(entry.display_name) + " · " + esc(entry.club_name) + " · " + esc(entry.competition_name) +
      esc(opponent) + '</p>' + MatchStatsSummary(entry) + '<p class="goat-unverified">' +
      esc(tr("verified")) + "</p>" + (service.canDelete(entry.id)
        ? '<button class="btn wide" data-a="goatdelete" data-v="' + esc(entry.id) + '">' +
          esc(tr("delete")) + "</button>" : "") + "</article>";
  }
  function GoatFilterTabs(board, mode, timeframe, metric) {
    var metrics = METRICS[mode];
    return '<div class="seg goat-board"><button data-a="goatboard" data-v="careers" aria-pressed="' +
      (board === "careers") + '">' + esc(tr("boardCareers")) + '</button><button data-a="goatboard" data-v="achievements" aria-pressed="' +
      (board === "achievements") + '">' + esc(tr("boardAchievements")) + '</button></div>' +
      '<div class="seg goat-mode"><button data-a="goatmode" data-v="player" aria-pressed="' +
      (mode === "player") + '">' + esc(tr("player")) + '</button><button data-a="goatmode" data-v="manager" aria-pressed="' +
      (mode === "manager") + '">' + esc(tr("manager")) + '</button></div><div class="seg goat-period">' +
      [["all-time", "all"], ["30d", "month"], ["7d", "week"]].map(function (period) {
        return '<button data-a="goatperiod" data-v="' + period[0] + '" aria-pressed="' +
          (timeframe === period[0]) + '">' + esc(tr(period[1])) + "</button>";
      }).join("") + '</div><label class="lbl goat-metric">' + esc(tr("careerMetric")) +
      '<select data-goat-metric' + (board === "careers" ? "" : " disabled") + ">" +
      metrics.map(function (item) {
        return '<option value="' + item[0] + '"' + (metric === item[0] ? " selected" : "") +
          ">" + esc(tr(item[1])) + "</option>";
      }).join("") + "</select></label>";
  }
  function load(sheet) {
    if (!service.available()) { sheet.loading = false; sheet.entries = []; return; }
    sheet.requestId = (sheet.requestId || 0) + 1;
    var requestId = sheet.requestId;
    sheet.loading = true;
    sheet.error = "";
    window.UIX.renderSheet();
    var request = sheet.board === "careers"
      ? service.listCareers(sheet.mode, sheet.timeframe, sheet.metric)
      : service.list(sheet.mode, sheet.timeframe);
    request.then(function (entries) {
      if (window.UIX && window.UIX.sheets && window.UIX.sheets.goat &&
          window.__goatSheet === sheet && sheet.requestId === requestId) {
        sheet.entries = entries;
        sheet.loading = false;
        window.UIX.renderSheet();
      }
    }).catch(function (error) {
      console.error("GOAT LADDER ranking request failed", error);
      if (window.__goatSheet === sheet && sheet.requestId === requestId) {
        sheet.error = error.message || tr("error");
        sheet.loading = false;
        window.UIX.renderSheet();
      }
    });
  }
  function open() {
    var sheet = {k: "goat", board: "careers", mode: "player", timeframe: "all-time",
      metric: "appearances", entries: [], loading: false, error: ""};
    window.__goatSheet = sheet;
    window.UIX.setSheet(sheet);
    load(sheet);
  }
  function submit(button) {
    var sheet = window.UIX.getSheet(), latest = service.latest();
    if (!sheet || !latest) return;
    var panel = button.closest(".sheet"), aliasInput = panel.querySelector("[data-goat-alias]");
    var titleInput = panel.querySelector("[data-goat-title]"), consent = panel.querySelector("[data-goat-consent]");
    var alias = aliasInput ? aliasInput.value.trim() : "";
    var title = titleInput ? titleInput.value.trim() : "";
    sheet.alias = alias;
    sheet.title = title;
    if (!consent || !consent.checked) { sheet.submitError = tr("submitConsent"); window.UIX.renderSheet(); return; }
    if (alias.length < 2 || alias.length > 32 || !title || title.length > 64) {
      sheet.submitError = tr("validation"); window.UIX.renderSheet(); return;
    }
    sheet.submitting = true;
    sheet.submitError = "";
    window.UIX.renderSheet();
    service.submit(latest, alias, title).then(function (result) {
      sheet.submitting = false;
      sheet.submitSuccess = result.goat_score;
      sheet.deleteNotice = result.delete_token_saved ? tr("deleteSaved") : tr("deleteNotSaved");
      load(sheet);
    }).catch(function (error) {
      console.error("GOAT LADDER submission failed", error);
      sheet.submitting = false;
      sheet.submitError = error.message || tr("error");
      window.UIX.renderSheet();
    });
  }
  function submitCareer(button) {
    var sheet = window.UIX.getSheet(), career = service.career();
    if (!sheet || sheet.k !== "goatCareerPublish" || !career) return;
    var panel = button.closest(".sheet"), aliasInput = panel.querySelector("[data-career-alias]");
    var titleInput = panel.querySelector("[data-career-title]"), consent = panel.querySelector("[data-career-consent]");
    var alias = aliasInput ? aliasInput.value.trim() : "";
    var title = titleInput ? titleInput.value.trim() : "";
    sheet.careerAlias = alias;
    sheet.careerTitle = title;
    if (!consent || !consent.checked) { sheet.submitError = tr("submitConsent"); window.UIX.renderSheet(); return; }
    if (alias.length < 2 || alias.length > 32 || !title || title.length > 64) {
      sheet.submitError = tr("validation"); window.UIX.renderSheet(); return;
    }
    sheet.submitting = true;
    sheet.submitError = "";
    window.UIX.renderSheet();
    service.submitCareer(career, alias, title).then(function (result) {
      sheet.submitting = false;
      sheet.submitSuccess = tr("careerPublished");
      sheet.deleteNotice = result.delete_token_saved ? tr("deleteSaved") : tr("deleteNotSaved");
      window.UIX.renderSheet();
    }).catch(function (error) {
      console.error("GOAT LADDER career submission failed", error);
      sheet.submitting = false;
      sheet.submitError = error.message || tr("error");
      window.UIX.renderSheet();
    });
  }
  function careerInputLabel(key, attribute, value) {
    return '<label class="lbl">' + esc(tr(key)) + '<input class="goat-input" maxlength="' +
      (key === "alias" ? 32 : 64) + '" data-career-' + attribute + ' value="' + esc(value) + '"></label>';
  }
  function openCareerPublish() {
    var career = service.career();
    if (!career) return;
    window.UIX.setSheet({k: "goatCareerPublish", career: career});
  }
  function careerPublishSheet(sheet) {
    var career = service.career();
    if (!career) return '<h2>' + esc(tr("careerNoData")) + "</h2>";
    if (!service.available()) {
      return '<h2>' + esc(tr("publishCareer")) + '</h2><p class="goat-error">' +
        esc(tr("unavailable")) + "</p><button class=\"btn wide\" data-a=\"close\">" +
        esc(tr("close")) + "</button>";
    }
    return '<h2>' + esc(tr("publishCareer")) + '</h2><p class="goat-meta">' +
      esc(career.current_club) + " · " + esc(career.started_season + "–" + career.latest_season) +
      "</p>" + CareerStatsSummary(career.metrics, career.game_mode) +
      careerInputLabel("alias", "alias", sheet.careerAlias || "") +
      careerInputLabel("title", "title", sheet.careerTitle || career.title) +
      '<label class="goat-consent"><input type="checkbox" data-career-consent> ' +
      esc(tr("careerConsent")) + '</label><p class="goat-privacy">' +
      esc(tr("careerPrivacy")) + "</p>" +
      (sheet.submitError ? '<p class="goat-error" role="alert">' + esc(sheet.submitError) + "</p>" : "") +
      (sheet.submitSuccess ? '<p class="pos">' + esc(sheet.submitSuccess) + "</p>" : "") +
      (sheet.deleteNotice ? '<p class="muted">' + esc(sheet.deleteNotice) + "</p>" : "") +
      '<button class="btn pri wide" data-a="goatcareerpublish"' +
      (sheet.submitting ? " disabled" : "") + ">" +
      esc(sheet.submitting ? tr("loading") : tr("publishCareer")) +
      '</button><button class="btn wide" data-a="close">' + esc(tr("close")) + "</button>";
  }
  function inputLabel(key, attribute, value) {
    return '<label class="lbl">' + esc(tr(key)) + '<input class="goat-input" maxlength="' +
      (key === "alias" ? 32 : 64) + '" data-goat-' + attribute + ' value="' + esc(value) + '"></label>';
  }

  if (!window.GOAT_WEB_BUILD) window.UIX.add("mainhome", function () {
    return '<button class="btn wide goat-entry" data-a="goat">🏆 ' + esc(tr("home")) + "</button>";
  });
  if (!window.GOAT_WEB_BUILD) window.UIX.add("menu", function () {
    return '<button class="btn wide" data-a="goat">🏆 ' + esc(tr("home")) + "</button>";
  });
  window.UIX.hk.retGoat = function () {
    var career = service.career();
    return career ? '<button class="btn wide" data-a="goatcareeropen">' +
      esc(tr("publishCareer")) + "</button>" : "";
  };
  window.UIX.actions.goat = open;
  window.UIX.actions.goatcareerpublish = function (button) { submitCareer(button); };
  window.UIX.actions.goatcareeropen = function () { openCareerPublish(); };
  window.UIX.sheets.goatCareerPublish = careerPublishSheet;
  window.UIX.actions.goatmode = function (button, mode) {
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat") return;
    sheet.mode = mode === "manager" ? "manager" : "player";
    if (sheet.board === "careers") sheet.metric = METRICS[sheet.mode][0][0];
    load(sheet);
  };
  window.UIX.actions.goatboard = function (button, board) {
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat") return;
    sheet.board = board === "achievements" ? "achievements" : "careers";
    load(sheet);
  };
  window.UIX.actions.goatperiod = function (button, timeframe) {
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat") return;
    sheet.timeframe = timeframe === "7d" || timeframe === "30d" ? timeframe : "all-time";
    load(sheet);
  };
  window.UIX.actions.goatrefresh = function () { var sheet = window.UIX.getSheet(); if (sheet && sheet.k === "goat") load(sheet); };
  window.UIX.actions.goatsubmit = function (button) { submit(button); };
  window.UIX.actions.goatdelete = function (button, id) {
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat" || !window.confirm(tr("deleteConfirm"))) return;
    sheet.submitting = true;
    window.UIX.renderSheet();
    service.deleteEntry(id).then(function () {
      sheet.submitting = false;
      sheet.deleteNotice = "";
      load(sheet);
    }).catch(function (error) {
      console.error("GOAT LADDER deletion failed", error);
      sheet.submitting = false;
      sheet.error = error.message || tr("error");
      window.UIX.renderSheet();
    });
  };
  window.UIX.actions.goatcareerdelete = function (button, id) {
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat" || !window.confirm(tr("careerDeleteConfirm"))) return;
    sheet.deletingCareer = id;
    window.UIX.renderSheet();
    service.deleteCareer(id).then(function () {
      sheet.deletingCareer = null;
      load(sheet);
    }).catch(function (error) {
      console.error("GOAT LADDER career deletion failed", error);
      sheet.deletingCareer = null;
      sheet.error = error.message || tr("error");
      window.UIX.renderSheet();
    });
  };
  document.addEventListener("change", function (event) {
    var select = event.target;
    if (!select || !select.matches || !select.matches("[data-goat-metric]")) return;
    var sheet = window.UIX.getSheet();
    if (!sheet || sheet.k !== "goat" || sheet.board !== "careers") return;
    var allowed = METRICS[sheet.mode].map(function (item) { return item[0]; });
    sheet.metric = allowed.indexOf(select.value) >= 0 ? select.value : METRICS[sheet.mode][0][0];
    load(sheet);
  });
  window.UIX.sheets.goat = function (sheet) {
    var latest = service.latest(), title = latest ? latest.title : "";
    var list = !service.available() ? "" :
      sheet.loading ? '<p class="muted">' + esc(tr("loading")) + "</p>" :
      sheet.error ? '<p class="goat-error" role="alert">' + esc(sheet.error) +
        '</p><button class="btn wide" data-a="goatrefresh">' + esc(tr("retry")) + "</button>" :
      sheet.entries.length ? sheet.entries.map(function (entry, index) {
        return sheet.board === "careers"
          ? CareerLadderCard(entry, index, sheet.metric) : GoatLadderCard(entry, index);
      }).join("") :
      '<p class="muted">' + esc(tr(sheet.board === "careers" ? "emptyCareers" : "empty")) + "</p>";
    var publish = !service.available()
      ? '<div class="card goat-notice"><b>' + esc(tr("unavailable")) + '</b><p class="muted">' +
        esc(tr("setup")) + "</p></div>"
      : latest
        ? '<section class="card goat-publish"><div class="head"><span class="tag hot">' +
          esc(tr("latest")) + '</span><span>' + esc(tr(latest.event_type === "season" ? "eventSeason" : "eventMatch")) +
          "</span></div><h3>" + esc(latest.title) + '</h3><p class="goat-meta">' +
          esc(latest.club_name) + " · " + esc(latest.competition_name) +
          (latest.opponent_name ? " · " + esc(latest.opponent_name) : "") +
          "</p>" + MatchStatsSummary({game_mode: latest.game_mode, metrics: latest}) +
          inputLabel("alias", "alias", sheet.alias || "") + inputLabel("title", "title", sheet.title || title) +
          '<label class="goat-consent"><input type="checkbox" data-goat-consent> ' + esc(tr("consent")) +
          '</label><p class="goat-privacy">' + esc(tr("privacy")) + "</p>" +
          (sheet.submitError ? '<p class="goat-error" role="alert">' + esc(sheet.submitError) + "</p>" : "") +
          (sheet.submitSuccess != null ? '<p class="pos">' + esc(tr("submitted")) + " · " +
            esc(sheet.submitSuccess) + " " + esc(tr("score")) + "</p>" : "") +
          (sheet.deleteNotice ? '<p class="muted">' + esc(sheet.deleteNotice) + "</p>" : "") +
          '<button class="btn pri wide" data-a="goatsubmit"' + (sheet.submitting ? " disabled" : "") + ">" +
          esc(sheet.submitting ? tr("loading") : tr("publish")) + "</button></section>"
        : '<div class="card goat-notice"><p class="muted">' + esc(tr("noLatest")) + "</p></div>";
    return '<h2>🏆 ' + esc(tr("home")) + '</h2><p class="muted">' + esc(tr("login")) + "</p>" +
      GoatFilterTabs(sheet.board, sheet.mode, sheet.timeframe, sheet.metric) +
      (sheet.board === "achievements" ? publish : "") +
      '<div class="stack goat-list">' + list + "</div>" +
        '<button class="btn wide" data-a="close">' + esc(tr("close")) + "</button>";
  };
})();
