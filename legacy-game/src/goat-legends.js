/* GOAT LADDER — «Leyendas del universo».
   Figuras ficticias que comparten universo con las carreras del jugador: sus clubes
   existen en el mundo del juego, sus récords se comparan con tu carrera y las
   noticias de fin de temporada los citan cuando los superas. No son personas reales,
   no son entradas de la comunidad y sus marcas no son récords oficiales de ningún club. */
(function (root) {
  "use strict";

  var LEGENDS = [
    {
      id: "leg_alba_fuentes", g: "f", fn: "Alba", ln: "Fuentes", nat: "ESP", pos: "MC",
      mode: "player", club: "Athletic Club", from: 2005, to: 2021, era: 2021,
      metrics: {seasons: 16, appearances: 402, goals: 38, assists: 121, clean_sheets: 0, trophies: 5,
        awards: 6, international_caps: 74, international_goals: 6, clubs: 2},
      record: {k: "assists"}
    },
    {
      id: "leg_ainhoa_prieto", g: "f", fn: "Ainhoa", ln: "Prieto", nat: "ESP", pos: "DC",
      mode: "player", club: "FC Barcelona", from: 2009, to: 2025, era: 2025,
      metrics: {seasons: 16, appearances: 431, goals: 289, assists: 96, clean_sheets: 0, trophies: 18,
        awards: 11, international_caps: 102, international_goals: 61, clubs: 3},
      record: {k: "goals"}
    },
    {
      id: "leg_leire_gallego", g: "f", fn: "Leire", ln: "Gallego", nat: "ESP", pos: "POR",
      mode: "player", club: "Real Sociedad", from: 1998, to: 2012, era: 2005,
      metrics: {seasons: 14, appearances: 364, goals: 0, assists: 1, clean_sheets: 118, trophies: 3,
        awards: 5, international_caps: 45, international_goals: 0, clubs: 2},
      record: {k: "clean_sheets"}
    },
    {
      id: "leg_irene_marquez", g: "f", fn: "Irene", ln: "Márquez", nat: "ESP", pos: "MCO",
      mode: "player", club: "Levante UD", from: 1988, to: 2004, era: 1998,
      metrics: {seasons: 16, appearances: 388, goals: 71, assists: 88, clean_sheets: 0, trophies: 4,
        awards: 4, international_caps: 39, international_goals: 12, clubs: 3},
      record: {k: "appearances"}
    },
    {
      id: "leg_marc_caballero", g: "m", fn: "Marc", ln: "Caballero", nat: "ESP", pos: "DC",
      mode: "player", club: "Villarreal CF", from: 1996, to: 2011, era: 2005,
      metrics: {seasons: 15, appearances: 379, goals: 212, assists: 54, clean_sheets: 0, trophies: 2,
        awards: 4, international_caps: 28, international_goals: 19, clubs: 3},
      record: {k: "goals"}
    },
    {
      id: "leg_jules_lambert", g: "m", fn: "Jules", ln: "Lambert", nat: "FRA", pos: "MCO",
      mode: "player", club: "Olympique de Lyon", from: 1984, to: 1999, era: 1994,
      metrics: {seasons: 15, appearances: 402, goals: 88, assists: 132, clean_sheets: 0, trophies: 7,
        awards: 5, international_caps: 61, international_goals: 14, clubs: 2},
      record: {k: "assists"}
    },
    {
      id: "leg_ciro_santoro", g: "m", fn: "Ciro", ln: "Santoro", nat: "ITA", pos: "DFC",
      mode: "player", club: "AS Roma", from: 1975, to: 1990, era: 1975,
      metrics: {seasons: 15, appearances: 446, goals: 12, assists: 9, clean_sheets: 0, trophies: 3,
        awards: 2, international_caps: 58, international_goals: 1, clubs: 1},
      record: {k: "appearances"}
    },
    {
      id: "leg_andreas_gustafsson", g: "m", fn: "Andreas", ln: "Gustafsson", nat: "NOR", pos: "DFC",
      mode: "player", club: "SK Brann", from: 2010, to: 2023, era: 2021,
      metrics: {seasons: 13, appearances: 331, goals: 29, assists: 11, clean_sheets: 0, trophies: 6,
        awards: 3, international_caps: 41, international_goals: 3, clubs: 2},
      record: {k: "trophies"}
    },
    {
      id: "leg_nerea_cano", g: "f", fn: "Nerea", ln: "Cano", nat: "ESP", pos: "DT",
      mode: "manager", club: "Atlético de Madrid", from: 2007, to: 2022, era: 2021,
      metrics: {seasons: 15, wins: 214, draws: 61, losses: 74, win_percentage: 61, trophies: 7,
        unbeaten_seasons: 3, promotions: 0, clubs: 2},
      record: {k: "wins"}
    },
    {
      id: "leg_maite_serrano", g: "f", fn: "Maite", ln: "Serrano", nat: "ESP", pos: "DT",
      mode: "manager", club: "Paris FC", from: 1999, to: 2014, era: 2005,
      metrics: {seasons: 15, wins: 168, draws: 72, losses: 96, win_percentage: 50, trophies: 2,
        unbeaten_seasons: 1, promotions: 3, clubs: 3},
      record: {k: "promotions"}
    },
    {
      id: "leg_ines_ferreira", g: "f", fn: "Inês", ln: "Ferreira", nat: "POR", pos: "DT",
      mode: "manager", club: "SL Benfica", from: 2012, to: 2026, era: 2025,
      metrics: {seasons: 14, wins: 187, draws: 44, losses: 41, win_percentage: 69, trophies: 9,
        unbeaten_seasons: 4, promotions: 1, clubs: 2},
      record: {k: "trophies"}
    },
    {
      id: "leg_aitor_dominguez", g: "m", fn: "Aitor", ln: "Domínguez", nat: "ESP", pos: "DT",
      mode: "manager", club: "Glasgow City", from: 1994, to: 2009, era: 1998,
      metrics: {seasons: 15, wins: 151, draws: 66, losses: 89, win_percentage: 49, trophies: 3,
        unbeaten_seasons: 1, promotions: 4, clubs: 4},
      record: {k: "promotions"}
    },
    {
      id: "leg_giovanni_rizzo", g: "m", fn: "Giovanni", ln: "Rizzo", nat: "ITA", pos: "DT",
      mode: "manager", club: "VfL Wolfsburg", from: 1985, to: 2000, era: 1994,
      metrics: {seasons: 15, wins: 176, draws: 58, losses: 62, win_percentage: 59, trophies: 5,
        unbeaten_seasons: 5, promotions: 1, clubs: 2},
      record: {k: "unbeaten_seasons"}
    },
    {
      id: "leg_matthijs_dekker", g: "m", fn: "Matthijs", ln: "Dekker", nat: "NED", pos: "DT",
      mode: "manager", club: "Ajax", from: 1990, to: 2005, era: 1998,
      metrics: {seasons: 15, wins: 198, draws: 55, losses: 70, win_percentage: 61, trophies: 6,
        unbeaten_seasons: 3, promotions: 0, clubs: 2},
      record: {k: "wins"}
    }
  ];

  var TEXT = {
    es: {
      boardLegends: "Leyendas", legendsIntro: "Figuras del mismo universo que tus carreras: sus clubes están en el juego y sus marcas se comparan con tu legado.",
      fictional: "Personajes ficticios del universo del juego. No son personas reales, no son entradas de la comunidad y sus marcas no son récords oficiales.",
      badge: "Leyenda del universo", recordLine: "Récord: {value} {metric}", clubLine: "{club} · {from}–{to}",
      eraLine: "Época {year}", eraActive: "Esta leyenda juega en tu época actual", yourCareer: "Tu carrera",
      cmpAhead: "Ya superas su marca ({value})", cmpEqual: "Igualas su marca ({value})", cmpBehind: "Te faltan {gap} para igualar su marca ({value})",
      cmpNone: "Avanza una temporada para comparar tu carrera", cmpOtherClub: "Tu carrera no comparte club con esta leyenda",
      newsBeaten: "Superas el récord de {name}: {record}.",
      careerLegacy: "Legado del club: {name} · {record}", openLegends: "Ver las leyendas del universo",
      m_goals: "goles", m_appearances: "partidos", m_assists: "asistencias", m_clean_sheets: "porterías a cero",
      m_trophies: "títulos", m_wins: "victorias", m_promotions: "ascensos", m_unbeaten_seasons: "temporadas invictas",
      m_awards: "premios", m_international_caps: "internacionalidades", m_international_goals: "goles internacionales",
      m_seasons: "temporadas", m_clubs: "clubes", m_draws: "empates", m_losses: "derrotas", m_win_percentage: "% de victorias"
    },
    en: {
      boardLegends: "Legends", legendsIntro: "Figures from the same universe as your careers: their clubs exist in the game and their marks are compared with your legacy.",
      fictional: "Fictional characters from the game universe. They are not real people, not community entries, and their marks are not official records.",
      badge: "Legend of the universe", recordLine: "Record: {value} {metric}", clubLine: "{club} · {from}–{to}",
      eraLine: "Era {year}", eraActive: "This legend plays in your current era", yourCareer: "Your career",
      cmpAhead: "You already beat their mark ({value})", cmpEqual: "You match their mark ({value})", cmpBehind: "{gap} to match their mark ({value})",
      cmpNone: "Finish a season to compare your career", cmpOtherClub: "Your career has not played for this legend’s club",
      newsBeaten: "You beat {name}’s record: {record}.",
      careerLegacy: "Club legacy: {name} · {record}", openLegends: "See the legends of the universe",
      m_goals: "goals", m_appearances: "appearances", m_assists: "assists", m_clean_sheets: "clean sheets",
      m_trophies: "trophies", m_wins: "wins", m_promotions: "promotions", m_unbeaten_seasons: "unbeaten seasons",
      m_awards: "awards", m_international_caps: "caps", m_international_goals: "international goals",
      m_seasons: "seasons", m_clubs: "clubs", m_draws: "draws", m_losses: "losses", m_win_percentage: "win %"
    },
    de: {
      boardLegends: "Legenden", legendsIntro: "Figuren aus demselben Universum wie deine Karrieren: ihre Vereine gibt es im Spiel, ihre Marken werden mit deinem Vermächtnis verglichen.",
      fictional: "Fiktive Figuren aus dem Spieluniversum. Keine realen Personen, keine Community-Einträge, und ihre Marken sind keine offiziellen Rekorde.",
      badge: "Legende des Universums", recordLine: "Rekord: {value} {metric}", clubLine: "{club} · {from}–{to}",
      eraLine: "Epoche {year}", eraActive: "Diese Legende spielt in deiner aktuellen Epoche", yourCareer: "Deine Karriere",
      cmpAhead: "Du übertriffst ihre Marke bereits ({value})", cmpEqual: "Du erreichst ihre Marke ({value})", cmpBehind: "{gap} bis zu ihrer Marke ({value})",
      cmpNone: "Beende eine Saison, um deine Karriere zu vergleichen", cmpOtherClub: "Deine Karriere spielte nicht für den Verein dieser Legende",
      newsBeaten: "Du übertriffst den Rekord von {name}: {record}.",
      careerLegacy: "Vereinsvermächtnis: {name} · {record}", openLegends: "Die Legenden des Universums ansehen",
      m_goals: "Tore", m_appearances: "Einsätze", m_assists: "Vorlagen", m_clean_sheets: "Zu-Null-Spiele",
      m_trophies: "Titel", m_wins: "Siege", m_promotions: "Aufstiege", m_unbeaten_seasons: "ungeschlagene Saisons",
      m_awards: "Auszeichnungen", m_international_caps: "Länderspiele", m_international_goals: "Länderspieltore",
      m_seasons: "Saisons", m_clubs: "Vereine", m_draws: "Unentschieden", m_losses: "Niederlagen", m_win_percentage: "Siegquote"
    },
    it: {
      boardLegends: "Leggende", legendsIntro: "Figure dello stesso universo delle tue carriere: i loro club esistono nel gioco e i loro primati si confrontano con il tuo lascito.",
      fictional: "Personaggi di fantasia dell’universo del gioco. Non sono persone reali, non sono voci della community e i loro primati non sono record ufficiali.",
      badge: "Leggenda dell’universo", recordLine: "Primato: {value} {metric}", clubLine: "{club} · {from}–{to}",
      eraLine: "Epoca {year}", eraActive: "Questa leggenda gioca nella tua epoca attuale", yourCareer: "La tua carriera",
      cmpAhead: "Superi già il suo primato ({value})", cmpEqual: "Eguagli il suo primato ({value})", cmpBehind: "Ti mancano {gap} per eguagliarlo ({value})",
      cmpNone: "Completa una stagione per confrontare la carriera", cmpOtherClub: "La tua carriera non ha giocato nel club di questa leggenda",
      newsBeaten: "Superi il primato di {name}: {record}.",
      careerLegacy: "Eredità del club: {name} · {record}", openLegends: "Guarda le leggende dell’universo",
      m_goals: "gol", m_appearances: "presenze", m_assists: "assist", m_clean_sheets: "porta inviolata",
      m_trophies: "titoli", m_wins: "vittorie", m_promotions: "promozioni", m_unbeaten_seasons: "stagioni imbattute",
      m_awards: "premi", m_international_caps: "presenze internazionali", m_international_goals: "gol internazionali",
      m_seasons: "stagioni", m_clubs: "club", m_draws: "pareggi", m_losses: "sconfitte", m_win_percentage: "% vittorie"
    },
    fr: {
      boardLegends: "Légendes", legendsIntro: "Des figures du même univers que tes carrières : leurs clubs existent dans le jeu et leurs marques sont comparées à ton héritage.",
      fictional: "Personnages fictifs de l’univers du jeu. Ce ne sont pas des personnes réelles ni des entrées de la communauté, et leurs marques ne sont pas des records officiels.",
      badge: "Légende de l’univers", recordLine: "Record : {value} {metric}", clubLine: "{club} · {from}–{to}",
      eraLine: "Époque {year}", eraActive: "Cette légende joue dans ton époque actuelle", yourCareer: "Ta carrière",
      cmpAhead: "Tu dépasses déjà sa marque ({value})", cmpEqual: "Tu égalises sa marque ({value})", cmpBehind: "Il te manque {gap} pour égaler sa marque ({value})",
      cmpNone: "Termine une saison pour comparer ta carrière", cmpOtherClub: "Ta carrière n’a pas joué dans le club de cette légende",
      newsBeaten: "Tu dépasses le record de {name} : {record}.",
      careerLegacy: "Héritage du club : {name} · {record}", openLegends: "Voir les légendes de l’univers",
      m_goals: "buts", m_appearances: "matchs", m_assists: "passes décisives", m_clean_sheets: "matchs sans encaisser",
      m_trophies: "titres", m_wins: "victoires", m_promotions: "promotions", m_unbeaten_seasons: "saisons sans défaite",
      m_awards: "récompenses", m_international_caps: "sélections", m_international_goals: "buts internationaux",
      m_seasons: "saisons", m_clubs: "clubs", m_draws: "matchs nuls", m_losses: "défaites", m_win_percentage: "% de victoires"
    }
  };

  var STORIES = {
    leg_alba_fuentes: {
      es: "Cambió el ritmo del Athletic con pases filtrados y una zurda que no pedía permiso.",
      en: "She changed Athletic’s tempo with threaded passes and a left foot that never asked permission.",
      de: "Sie veränderte das Tempo von Athletic mit Steilpässen und einem linken Fuß, der nie um Erlaubnis bat.",
      it: "Cambiava il ritmo dell’Athletic con passaggi filtranti e un mancino che non chiedeva permesso.",
      fr: "Elle changeait le rythme de l’Athletic par ses passes filtrantes et un pied gauche qui ne demandait jamais la permission."
    },
    leg_ainhoa_prieto: {
      es: "Del área chica al área grande: su olfato de gol sostuvo una década de títulos.",
      en: "From the six-yard box to the big area: her nose for goal carried a decade of titles.",
      de: "Vom Fünfmeterraum bis zum Strafraum: Ihr Torinstinkt trug ein Jahrzehnt voller Titel.",
      it: "Dall’area piccola all’area grande: il suo fiuto del gol ha sostenuto un decennio di titoli.",
      fr: "De la surface à la grande area : son sens du but a porté une décennie de titres."
    },
    leg_leire_gallego: {
      es: "Paró lo que parecía imposible y convirtió las porterías a cero en una costumbre.",
      en: "She saved what looked impossible and turned clean sheets into a habit.",
      de: "Sie hielt, was unmöglich schien, und machte Zu-Null-Spiele zur Gewohnheit.",
      it: "Parava ciò che sembrava impossibile e ha reso le porte inviolate un’abitudine.",
      fr: "Elle arrêtait ce qui semblait impossible et a fait des matchs sans encaisser une habitude."
    },
    leg_irene_marquez: {
      es: "Entre líneas, siempre disponible: ninguna temporada se quedó sin jugar.",
      en: "Between the lines, always available: she never let a season pass without playing.",
      de: "Zwischen den Linien, immer anspielbar: Keine Saison verging ohne sie.",
      it: "Tra le linee, sempre disponibile: nessuna stagione è passata senza di lei.",
      fr: "Entre les lignes, toujours disponible : aucune saison ne s’est passée sans elle."
    },
    leg_marc_caballero: {
      es: "Un nueve de área que aprendió a caer a banda antes de aparecer en el segundo palo.",
      en: "A box striker who learned to drift wide before arriving at the far post.",
      de: "Ein Strafraumstürmer, der lernte, auf den Flügel zu gehen, um dann am zweiten Pfosten aufzutauchen.",
      it: "Un centravanti d’area che imparava ad allargarsi prima di comparire sul secondo palo.",
      fr: "Un avant-centre de surface qui apprenait à dézoner avant d’arriver au second poteau."
    },
    leg_jules_lambert: {
      es: "El último pase como firma: el Lyon de su época jugaba al ritmo de su cabeza.",
      en: "The final pass as a signature: Lyon played to the rhythm of his mind.",
      de: "Der letzte Pass als Unterschrift: Lyon spielte im Rhythmus seines Kopfes.",
      it: "Il passaggio finale come firma: il Lione giocava al ritmo della sua testa.",
      fr: "La dernière passe comme signature : Lyon jouait au rythme de sa tête."
    },
    leg_ciro_santoro: {
      es: "Un defensa de los que hablan poco y ordenan la línea con la mirada.",
      en: "A defender who says little and organises the line with a look.",
      de: "Ein Verteidiger, der wenig sagt und die Kette mit einem Blick ordnet.",
      it: "Un difensore che parla poco e organizza la linea con lo sguardo.",
      fr: "Un défenseur qui parle peu et organise sa ligne du regard."
    },
    leg_andreas_gustafsson: {
      es: "Capitán de los días de frío: su nombre aparecía en todas las celebraciones.",
      en: "Captain of the cold days: his name turned up in every celebration.",
      de: "Kapitän an kalten Tagen: Sein Name tauchte bei jeder Feier auf.",
      it: "Capitano dei giorni freddi: il suo nome compariva in ogni festa.",
      fr: "Capitaine des jours froids : son nom apparaissait dans chaque célébration."
    },
    leg_nerea_cano: {
      es: "Construyó un Atlético que defendía con el balón y competía sin excusas.",
      en: "She built an Atlético that defended with the ball and competed without excuses.",
      de: "Sie baute ein Atlético, das mit dem Ball verteidigte und ohne Ausreden antrat.",
      it: "Ha costruito un Atlético che difendeva con il pallone e gareggiava senza scuse.",
      fr: "Elle a bâti un Atlético qui défendait avec le ballon et jouait sans excuses."
    },
    leg_maite_serrano: {
      es: "Especialista en proyectos difíciles: subió al Paris FC desde abajo y lo dejó estable.",
      en: "A specialist in hard projects: she took Paris FC up from below and left them steady.",
      de: "Spezialistin für schwierige Projekte: Sie führte Paris FC von unten nach oben und hinterließ Stabilität.",
      it: "Specialista in progetti difficili: ha portato il Paris FC dal basso e lo ha lasciato solido.",
      fr: "Spécialiste des projets difficiles : elle a fait monter le Paris FC et l’a laissé stable."
    },
    leg_ines_ferreira: {
      es: "Convirtió el Benfica en una máquina de finales y no perdió la calma en ninguna.",
      en: "She turned Benfica into a final machine and never lost her calm in one.",
      de: "Sie machte Benfica zu einer Finalmaschine und blieb in jedem Finale ruhig.",
      it: "Ha trasformato il Benfica in una macchina da finali, senza perdere la calma.",
      fr: "Elle a fait du Benfica une machine à finales, sans jamais perdre son calme."
    },
    leg_aitor_dominguez: {
      es: "Subió cuatro veces con clubes distintos y siempre dejó la plantilla mejor de lo que la encontró.",
      en: "He won four promotions with different clubs and always left the squad better than he found it.",
      de: "Er stieg viermal mit verschiedenen Vereinen auf und hinterließ den Kader immer besser, als er ihn vorfand.",
      it: "Quattro promozioni con club diversi, lasciando sempre la rosa migliore di come l’aveva trovata.",
      fr: "Quatre montées avec des clubs différents, en laissant chaque effectif meilleur qu’à son arrivée."
    },
    leg_giovanni_rizzo: {
      es: "Su Wolfsburg no perdía: cinco temporadas seguidas sin conocer la derrota en casa.",
      en: "His Wolfsburg did not lose: five seasons in a row unbeaten at home.",
      de: "Sein Wolfsburg verlor nicht: fünf Spielzeiten in Folge ohne Heimniederlage.",
      it: "Il suo Wolfsburg non perdeva: cinque stagioni di fila senza sconfitte in casa.",
      fr: "Son Wolfsburg ne perdait pas : cinq saisons de suite invaincu à domicile."
    },
    leg_matthijs_dekker: {
      es: "Hizo del Ajax un equipo que presionaba alto y no negociaba el estilo.",
      en: "He made Ajax a side that pressed high and never negotiated its style.",
      de: "Er machte aus Ajax ein Team, das hoch presste und seinen Stil nie verhandelte.",
      it: "Ha reso l’Ajax una squadra che pressava alta e non negoziava lo stile.",
      fr: "Il a fait de l’Ajax une équipe qui pressait haut sans négocier son style."
    }
  };

  var DENY = ["Messi", "Ronaldo", "Maradona", "Pelé", "Zidane", "Cruyff", "Iniesta", "Xavi",
    "Casillas", "Puyol", "Haaland", "Mbappé", "Ronaldinho", "Beckham", "Guardiola", "Maldini",
    "Totti", "Del Piero", "Buffon", "Kane", "Benzema", "Modrić", "Kroos", "Neymar"];

  function language() {
    return typeof LANG === "string" && TEXT[LANG] ? LANG : "es";
  }
  function text(key, params) {
    var table = TEXT[language()] || TEXT.es;
    var value = table[key] != null ? table[key] : TEXT.es[key];
    if (value == null) return key;
    if (params) value = String(value).replace(/\{(\w+)\}/g, function (match, name) {
      return params[name] == null ? match : String(params[name]);
    });
    return value;
  }
  function fullName(legend) { return legend.fn + " " + legend.ln; }
  function metricValue(legend, key) {
    var value = legend.metrics[key];
    return value == null ? 0 : value;
  }
  function metricLabel(key) { return text("m_" + key); }
  function recordText(legend) {
    return text("recordLine", {value: metricValue(legend, legend.record.k), metric: metricLabel(legend.record.k)});
  }
  function story(legend) {
    var entry = STORIES[legend.id] || {};
    return entry[language()] || entry.es || "";
  }
  function all() { return LEGENDS.slice(); }
  function list(mode) {
    return LEGENDS.filter(function (legend) { return !mode || legend.mode === mode; });
  }
  function byId(id) {
    for (var i = 0; i < LEGENDS.length; i++) if (LEGENDS[i].id === id) return LEGENDS[i];
    return null;
  }
  function forClub(club, mode) {
    return LEGENDS.filter(function (legend) {
      return legend.club === club && (!mode || legend.mode === mode);
    });
  }
  function forEra(year, mode) {
    return LEGENDS.filter(function (legend) {
      return legend.era === Number(year) && (!mode || legend.mode === mode);
    });
  }
  function sorted(mode, metric) {
    var rows = list(mode);
    return rows.sort(function (a, b) {
      var diff = metricValue(b, metric) - metricValue(a, metric);
      if (diff) return diff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }
  function compare(career, legend) {
    var empty = {state: "none", metric: legend.record.k, legendValue: metricValue(legend, legend.record.k), careerValue: null, gap: null};
    if (!career || career.game_mode !== legend.mode || !career.metrics) return empty;
    var value = career.metrics[legend.record.k];
    if (value == null) return empty;
    var target = metricValue(legend, legend.record.k);
    var state = value > target ? "ahead" : value === target ? "equal" : "behind";
    var result = {state: state, metric: legend.record.k, legendValue: target, careerValue: value, gap: Math.max(0, target - value)};
    result.sameClub = career.current_club === legend.club;
    if (state === "behind" && !result.sameClub) result.state = "other-club";
    return result;
  }
  /* Leyenda más cercana para el club del jugador; sirve para el gancho del vestuario. */
  function closest(career) {
    if (!career || !career.current_club || !career.game_mode) return null;
    var candidates = forClub(career.current_club, career.game_mode).map(function (legend) {
      return {legend: legend, comparison: compare(career, legend)};
    });
    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      var av = a.comparison.gap == null ? 0 : a.comparison.gap;
      var bv = b.comparison.gap == null ? 0 : b.comparison.gap;
      return av - bv;
    });
    return candidates[0];
  }
  /* Noticias de fin de temporada: una sola vez por leyenda y partida. */
  function careerNews(input) {
    var out = [];
    if (!input || !input.metrics || !input.mode) return out;
    list(input.mode).forEach(function (legend) {
      if (input.club != null && legend.club !== input.club) return;
      var target = metricValue(legend, legend.record.k);
      var value = input.metrics[legend.record.k];
      if (value == null || value < target) return;
      var flag = "legendRec_" + legend.id;
      if (input.flags && input.flags[flag]) return;
      if (input.flags) input.flags[flag] = true;
      out.push({t: "star", x: text("newsBeaten", {name: fullName(legend), record: recordText(legend)})});
    });
    return out;
  }

  root.GoatLegends = {
    schema: 1, count: LEGENDS.length,
    all: all, list: list, byId: byId, forClub: forClub, forEra: forEra, sorted: sorted,
    compare: compare, closest: closest, careerNews: careerNews,
    fullName: fullName, metricValue: metricValue, metricLabel: metricLabel,
    recordText: recordText, story: story, text: text,
    /* sólo para pruebas: nombres prohibidos y tabla de traducciones */
    _deny: DENY, _text: TEXT, _stories: STORIES
  };
})(typeof window !== "undefined" ? window : this);
