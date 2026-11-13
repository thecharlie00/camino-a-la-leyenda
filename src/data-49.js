/* data-49.js — expansión de competiciones (5.33): segundas divisiones con ruta completa.
   Seis países ganan una segunda división masculina y otra femenina, conectadas con su primera
   división (ascenso y descenso). Los clubes se añaden al final de cada mundo para conservar los
   índices de las partidas guardadas y las ligas nuevas se marcan xl, igual que las expansiones 4.5/4.8.
   Procedencia: real/sources.json (masculino) y real-f/sources.json (femenino). Solo la segunda
   femenina de Suecia usa una plantilla de clubes verificada; el resto de pools femeninos están
   declarados como curados y no como la plantilla oficial de la temporada. */
(function () {
  var MEN = [
    {id: "AUT2", c: "AT", n: "2. Liga austriaca", t: 2, top: 63, bot: 51, w: 0.7, gs: 1, clubs: [
      "Admira Wacker", "SKU Amstetten", "SW Bregenz", "Floridsdorfer AC", "First Vienna",
      "Rapid Viena II", "Austria Viena II", "Kapfenberger SV", "FC Liefering", "Sturm Graz II",
      "SKN St. Pölten", "FC Hertha Wels", "SV Austria Salzburg", "ASK Voitsberg", "Wacker Innsbruck"
    ]},
    {id: "SUI2", c: "CH", n: "Challenge League suiza", t: 2, top: 62, bot: 50, w: 0.7, gs: 1, clubs: [
      "FC Aarau", "SC Kriens", "Étoile Carouge", "Neuchâtel Xamax", "Yverdon-Sport", "FC Wil",
      "FC Rapperswil-Jona", "Stade Nyonnais", "Stade Lausanne Ouchy"
    ]},
    {id: "DEN2", c: "DK", n: "1. Division danesa", t: 2, top: 63, bot: 52, w: 0.8, gs: 1, clubs: [
      "AaB", "Aarhus Fremad", "AB Gladsaxe", "Esbjerg fB", "Hillerød", "Hobro IK", "Hvidovre IF",
      "Kolding IF", "HB Køge", "Vendsyssel FF"
    ]},
    {id: "NOR2", c: "NO", n: "1. divisjon noruega", t: 2, top: 62, bot: 50, w: 0.75, gs: 1, clubs: [
      "Bryne FK", "Egersunds IK", "FK Haugesund", "IL Hødd", "Kongsvinger", "Lyn", "Moss FK",
      "Odds BK", "Ranheim", "Raufoss", "Sandnes Ulf", "Sogndal", "Stabæk", "Strømmen",
      "Strømsgodset", "Åsane"
    ]},
    {id: "SWE2", c: "SE", n: "Superettan", t: 2, top: 61, bot: 50, w: 0.75, gs: 1, clubs: [
      "Falkenbergs FF", "GIF Sundsvall", "Helsingborgs IF", "IFK Norrköping", "IFK Värnamo",
      "IK Brage", "IK Oddevold", "Landskrona BoIS", "Ljungskile SK", "Nordic United", "Norrby IF",
      "Sandvikens IF", "Varbergs BoIS", "Örebro SK", "Östers IF", "Östersunds FK"
    ]},
    {id: "CZE2", c: "CZ", n: "Chance Národní liga", t: 2, top: 61, bot: 49, w: 0.7, gs: 1, clubs: [
      "FC Silon Táborsko", "FK Viagem Ústí nad Labem", "Baník Ostrava B", "FK Příbram", "SFC Opava",
      "Viktoria Žižkov", "Sellier & Bellot Vlašim", "Slavia Praga B", "Hanácká Slavia Kroměříž",
      "1. SK Prostějov", "Vysočina Jihlava", "SK Kladno", "Arsenal Česká Lípa", "FK Třinec"
    ]}
  ];
  /* Cuatro países sin liga en el mundo del juego: se añade su primera división masculina y femenina.
     Listas de participantes verificadas de la temporada 2026 (Finlandia, Islandia, Irlanda del Norte)
     y 2026/27 (Gales). */
  var MEN_TOP = [
    {id: "FI1", c: "FI", n: "Veikkausliiga", t: 1, top: 66, bot: 54, cup: "Copa de Finlandia", w: 0.6, gs: 1, clubs: [
      "HJK", "KuPS", "Ilves", "SJK", "VPS", "FC Inter", "FC Lahti", "IF Gnistan",
      "IFK Mariehamn", "AC Oulu", "FF Jaro", "TPS"
    ]},
    {id: "IS1", c: "IS", n: "Besta deild karla", t: 1, top: 64, bot: 52, cup: "Copa de Islandia", w: 0.5, gs: 1, clubs: [
      "Víkingur Reykjavík", "Breiðablik", "Valur", "KR", "Stjarnan", "FH", "Fram", "KA",
      "ÍA", "Keflavík", "ÍBV", "Þór Akureyri"
    ]},
    {id: "WAL1", c: "WAL", n: "Cymru Premier", t: 1, top: 58, bot: 46, cup: "Copa de Gales", w: 0.4, gs: 1, clubs: [
      "The New Saints", "Cardiff Met", "Barry Town United", "Caernarfon Town", "Connah's Quay Nomads",
      "Penybont", "Haverfordwest County", "Colwyn Bay", "Briton Ferry Llansawel", "Flint Town United",
      "Llandudno", "Airbus UK Broughton", "Holywell Town", "Cambrian United", "Ammanford", "Trefelin BGC"
    ]},
    {id: "NIR1", c: "NIR", n: "NIFL Premiership", t: 1, top: 60, bot: 48, cup: "Copa de Irlanda del Norte", w: 0.45, gs: 1, clubs: [
      "Linfield", "Larne", "Glentoran", "Cliftonville", "Crusaders", "Coleraine", "Portadown",
      "Ballymena United", "Dungannon Swifts", "Carrick Rangers", "Bangor", "Limavady United"
    ]}
  ];
  var WOMEN_TOP = [
    {id: "FI1", c: "FI", n: "Kansallinen Liiga", t: 1, top: 62, bot: 50, cup: "Copa de Finlandia", w: 0.5, gs: 1, clubs: [
      "HJK", "KuPS", "HPS", "Åland United", "PK-35 Vantaa", "Ilves", "IF Gnistan", "Vasa IFK"
    ]},
    {id: "IS1", c: "IS", n: "Besta deild kvenna", t: 1, top: 60, bot: 48, cup: "Copa de Islandia", w: 0.45, gs: 1, clubs: [
      "Breiðablik", "Valur", "Stjarnan", "FH", "Þór/KA", "Þróttur R.", "Fram", "Víkingur R.",
      "ÍBV", "Grindavík/Njarðvík"
    ]},
    {id: "WAL1", c: "WAL", n: "Adran Premier", t: 1, top: 54, bot: 42, cup: "Copa de Gales", w: 0.3, gs: 1, clubs: [
      "Wrexham", "Cardiff City", "Swansea City", "Cardiff Met", "The New Saints",
      "Briton Ferry Llansawel", "Barry Town United", "Aberystwyth Town"
    ]},
    {id: "NIR1", c: "NIR", n: "Women's Premiership", t: 1, top: 52, bot: 40, cup: "Copa de Irlanda del Norte", w: 0.3, gs: 1, clubs: [
      "Cliftonville", "Glentoran", "Crusaders Strikers", "Linfield", "Lisburn Rangers",
      "Lisburn Ladies", "Derry City Ladies", "Larne"
    ]}
  ];
  /* Ruta: la primera división existente desciende k clubes y la nueva segunda asciende los mismos. */
  var MEN_LINK = {AUT2: ["AUT1", 1], SUI2: ["SUI1", 1], DEN2: ["DEN1", 2], NOR2: ["NOR1", 2], SWE2: ["SWE1", 2], CZE2: ["CZE1", 2]};

  var WOMEN = [
    {id: "AUT2", c: "AT", n: "2. Liga femenina austriaca", t: 2, top: 57, bot: 45, w: 0.5, gs: 1, clubs: [
      "Carinthians Spittal", "SKV Altenmarkt", "SG Südburgenland", "Union Kleinmünchen", "SV Horn",
      "Wiener Sport-Club", "Wildcats Krottendorf", "FFC Lustenau", "RW Rankweil", "FC Pinzgau"
    ]},
    {id: "SUI2", c: "CH", n: "Women's Challenge League", t: 2, top: 57, bot: 45, w: 0.5, gs: 1, clubs: [
      "FC Zúrich II", "FC Basilea II", "Young Boys II", "Servette FC II", "FC St. Gallen II",
      "FC Luzern II", "FC Aarau II", "Grasshoppers II", "FC Thun II", "FC Sion II"
    ]},
    {id: "DEN2", c: "DK", n: "Kvinde 1. division", t: 2, top: 57, bot: 45, w: 0.5, gs: 1, clubs: [
      "B.93", "Næstved BK", "AaB", "Varde IF", "Sundby BK", "Ballerup-Skovlunde", "Ølstykke FC",
      "Solrød FC", "FC Djursland", "VSK Aarhus"
    ]},
    {id: "NOR2", c: "NO", n: "1. divisjon femenina noruega", t: 2, top: 59, bot: 47, w: 0.55, gs: 1, clubs: [
      "Åsane", "Arna-Bjørnar", "TIL 2020", "Øvrevoll Hosle", "Fyllingsdalen", "Klepp",
      "Sandnes Ulf", "Viking FK", "Bryne FK", "Kongsvinger", "Medkila", "Amazon Grimstad", "Urædd"
    ]},
    {id: "SWE2", c: "SE", n: "Elitettan", t: 2, top: 61, bot: 49, w: 0.6, gs: 1, clubs: [
      "Alingsås IF", "IF Elfsborg", "Enskede IK", "Gamla Upsala SK", "IFK Göteborg", "BK Häcken II",
      "Husqvarna FF", "Jitex BK", "Linköping FC", "KIF Örebro", "Örebro SK", "Sandvikens IF",
      "Trelleborgs FF", "Umeå IK"
    ]},
    {id: "CZE2", c: "CZ", n: "2. liga femenina checa", t: 2, top: 55, bot: 43, w: 0.5, gs: 1, clubs: [
      "Sparta Praga II", "Slavia Praga II", "Viktoria Plzeň II", "Baník Ostrava II", "Sigma Olomouc II",
      "Slovan Liberec II", "Hradec Králové II", "FK Pardubice II", "1. FC Slovácko II", "Mladá Boleslav II"
    ]}
  ];
  var WOMEN_LINK = {AUT2: ["AUT1", 1], SUI2: ["SUI1", 1], DEN2: ["DEN1", 2], NOR2: ["NOR1", 2], SWE2: ["SWE1", 2], CZE2: ["CZE1", 2]};

  function usedNames(lists) {
    var used = {};
    lists.forEach(function (list) {
      (list || []).forEach(function (l) {
        if (!l || !l.clubs) return;
        l.clubs.split("|").forEach(function (n) { used[n] = 1; });
      });
    });
    return used;
  }
  function copyLeague(def) {
    var out = {};
    Object.keys(def).forEach(function (k) { out[k] = def[k]; });
    return out;
  }
  /* Cada mundo filtra contra sus propios nombres: los dos mundos femeninos son independientes,
     así que una liga añadida a "f" no debe vaciar la misma liga en "f2". */
  function append(list, defs) {
    if (!list) return;
    var used = usedNames([list]);
    defs.forEach(function (def) {
      var league = copyLeague(def);
      league.xl = true;
      league.clubs = def.clubs.filter(function (n) {
        if (used[n]) return false;
        used[n] = 1;
        return true;
      }).join("|");
      list.push(league);
    });
  }
  function link(list, links) {
    if (!list) return;
    Object.keys(links).forEach(function (downId) {
      var target = links[downId];
      list.forEach(function (l) {
        if (l.id !== target[0]) return;
        l.down = downId;
        l.rel = target[1];
      });
    });
  }

  append(DATA.leagues, MEN);
  append(DATA.leagues, MEN_TOP);
  link(DATA.leagues, MEN_LINK);

  append(DATA.leaguesF, WOMEN);
  append(DATA.leaguesF, WOMEN_TOP);
  append(DATA.leaguesF2, WOMEN);
  append(DATA.leaguesF2, WOMEN_TOP);
  link(DATA.leaguesF, WOMEN_LINK);
  link(DATA.leaguesF2, WOMEN_LINK);
})();
