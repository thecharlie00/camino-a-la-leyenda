/* data-45.js — «Mundo vivo» (versión 4.5).
   1) Nuevas divisiones masculinas jugables (xl: sus clubes se crean al final para no mover los índices de partidas guardadas),
      con ascensos y descensos y play-off de ascenso (po: [desde, hasta] puestos de la liga de abajo que lo juegan).
   2) Fútbol femenino: listas de clubes reales para las ligas que usaban clubes del masculino. Solo en partidas nuevas
      (mundo "f2"); las partidas femeninas ya empezadas siguen con su mundo de siempre ("f"). */
(function () {
  var used = {};
  DATA.leagues.forEach(function (l) { l.clubs.split("|").forEach(function (n) { used[n] = 1; }); });
  function L(o, clubs) {
    var list = clubs.split("|").filter(function (n) { if (used[n]) return false; used[n] = 1; return true; });
    o.clubs = list.join("|"); o.xl = true;
    return o;
  }
  /* enlaces con las ligas que ya existían */
  var link = {ENG3: ["ENG4", 4], ITA2: ["ITA3", 3], GER2: ["GER3", 3], FRA2: ["FRA3", 2], POR1: ["POR2", 2], NED1: ["NED2", 2], BEL1: ["BEL2", 1],
    TUR1: ["TUR2", 3], SCO1: ["SCO2", 1], ARG1: ["ARG2", 2], BRA1: ["BRA2", 4], JPN1: ["JPN2", 3]};
  DATA.leagues.forEach(function (l) { var k = link[l.id]; if (k) { l.down = k[0]; l.rel = k[1]; } });
  /* play-off de ascenso en ligas que ya existían */
  var po = {ENG2: [3, 6], ENG3: [3, 6], ESP2: [3, 6], ITA2: [3, 6]};
  DATA.leagues.forEach(function (l) { if (po[l.id]) l.po = po[l.id]; if (/^ESP30/.test(l.id)) l.po = [2, 5]; });
  DATA.leagues = DATA.leagues.concat([
    L({id: "ENG4", c: "ENG", n: "EFL League Two", t: 4, top: 61, bot: 55, w: 0.35, gs: 1, po: [4, 7]},
      "Gillingham|Walsall|Bromley|Chesterfield|Grimsby Town|Swindon Town|Notts County|MK Dons|Salford City|Crewe Alexandra|Colchester United|Cheltenham Town|Barrow|Accrington Stanley|Fleetwood Town|Tranmere Rovers|Bristol Rovers|Shrewsbury Town|Cambridge United|Crawley Town|Harrogate Town|Newport County|Oldham Athletic|Barnet|Carlisle United|York City|Forest Green Rovers"),
    L({id: "GER3", c: "DE", n: "3. Liga", t: 3, top: 66, bot: 59, w: 0.4, gs: 1},
      "TSV 1860 München|FC Ingolstadt 04|SV Wehen Wiesbaden|SV Waldhof Mannheim|FC Erzgebirge Aue|Rot-Weiss Essen|Hansa Rostock|Viktoria Köln|SC Verl|Alemannia Aachen|VfL Osnabrück|Energie Cottbus|MSV Duisburg|TSV Havelse|1. FC Saarbrücken|SSV Ulm 1846|Jahn Regensburg|TSG Hoffenheim II|VfB Stuttgart II|FC Schweinfurt 05|SpVgg Unterhaching|Dynamo Dresden"),
    L({id: "ITA301", c: "IT", n: "Serie C · Girone A", t: 3, top: 63, bot: 55, w: 0.3, gs: 1, dv: "ITA3", dvn: "Serie C", gno: 1, upN: 1},
      "L.R. Vicenza|Triestina|Lecco|Novara|Renate|Giana Erminio|AlbinoLeffe|Pro Vercelli|Alcione Milano|Arzignano Valchiampo|Trento|Lumezzane|Pergolettese|Union Brescia|Virtus Verona|Dolomiti Bellunesi|Ospitaletto|Inter U23|Pro Patria|Cittadella"),
    L({id: "ITA302", c: "IT", n: "Serie C · Girone B", t: 3, top: 63, bot: 55, w: 0.3, gs: 1, dv: "ITA3", dvn: "Serie C", gno: 2, upN: 1},
      "Ternana|Arezzo|Perugia|Ascoli|Rimini|Gubbio|Pineto|Campobasso|Vis Pesaro|Pontedera|Carpi|Ravenna|Forlì|Torres|Guidonia Montecelio|Sambenedettese|Livorno|Pianese|Bra|Juventus Next Gen"),
    L({id: "ITA303", c: "IT", n: "Serie C · Girone C", t: 3, top: 63, bot: 55, w: 0.3, gs: 1, dv: "ITA3", dvn: "Serie C", gno: 3, upN: 1},
      "Benevento|Catania|Salernitana|Crotone|Cosenza|Potenza|Monopoli|Team Altamura|Picerno|Audace Cerignola|Sorrento|Trapani|Foggia|Latina|Giugliano|Casertana|Cavese|Siracusa|Atalanta U23|Casarano"),
    L({id: "FRA3", c: "FR", n: "National", t: 3, top: 62, bot: 56, w: 0.3, gs: 1},
      "Valenciennes FC|FC Rouen|US Orléans|FC Sochaux-Montbéliard|US Concarneau|Quevilly-Rouen|Dijon FCO|SM Caen|FC Versailles|Bourg-en-Bresse|Le Puy Foot|Aubagne FC|FC Fleury 91|Paris 13 Atletico|FC Villefranche|Stade Briochin|LB Châteauroux|Stade Lavallois"),
    L({id: "POR2", c: "PT", n: "Liga Portugal 2", t: 2, top: 67, bot: 60, w: 0.4, gs: 1},
      "CS Marítimo|FC Vizela|CD Feirense|Leixões SC|Académico de Viseu|GD Chaves|FC Penafiel|Portimonense SC|UD Oliveirense|SCU Torreense|FC Paços de Ferreira|Benfica B|FC Porto B|FC Felgueiras 1932|União de Leiria|Lusitânia de Lourosa|Sporting CP B|SC Farense|Boavista FC"),
    L({id: "NED2", c: "NL", n: "Keuken Kampioen Divisie", t: 2, top: 67, bot: 59, w: 0.4, gs: 1},
      "Willem II|SC Cambuur|De Graafschap|ADO Den Haag|Roda JC Kerkrade|FC Den Bosch|FC Emmen|VVV-Venlo|Helmond Sport|FC Dordrecht|TOP Oss|MVV Maastricht|Vitesse|RKC Waalwijk|Almere City FC|FC Eindhoven|Jong Ajax|Jong PSV|Jong AZ|Jong FC Utrecht"),
    L({id: "BEL2", c: "BE", n: "Challenger Pro League", t: 2, top: 65, bot: 58, w: 0.35, gs: 1},
      "Beerschot|KV Kortrijk|Lommel SK|RWDM Brussels|Patro Eisden Maasmechelen|Club NXT|Jong Genk|RSCA Futures|SK Beveren|Lierse Kempenzonen|RFC Seraing|Francs Borains|Olympic Charleroi|KAS Eupen|KSC Lokeren|Jong Gent"),
    L({id: "TUR2", c: "TR", n: "TFF 1. Lig", t: 2, top: 67, bot: 59, w: 0.45, gs: 1, po: [3, 6]},
      "Bodrum FK|Sivasspor|Hatayspor|Pendikspor|Bandırmaspor|Iğdır FK|Sakaryaspor|Manisa FK|Keçiörengücü|Ümraniyespor|Boluspor|Esenler Erokspor|Serikspor|Sarıyer|Vanspor FK|İstanbulspor|Adana Demirspor|Ankaragücü|Antalyaspor|Kayserispor"),
    L({id: "SCO2", c: "SCO", n: "Scottish Championship", t: 2, top: 61, bot: 55, w: 0.3, gs: 1},
      "St Johnstone|Ross County|Dunfermline Athletic|Partick Thistle|Raith Rovers|Ayr United|Greenock Morton|Airdrieonians|Arbroath|Queen's Park|Hamilton Academical|Kilmarnock"),
    L({id: "ARG2", c: "AR", n: "Primera Nacional", t: 2, top: 65, bot: 58, w: 0.3, gs: 1, po: [2, 5]},
      "Chacarita Juniors|Quilmes|Ferro Carril Oeste|All Boys|Almagro|Atlanta|Deportivo Morón|San Martín de Tucumán|Gimnasia y Esgrima de Jujuy|Defensores de Belgrano|Chaco For Ever|Atlético de Rafaela|Tristán Suárez|Estudiantes de Buenos Aires|Temperley|Mitre de Santiago del Estero|Agropecuario|Colegiales|Club Atlético Brown|San Miguel"),
    L({id: "BRA2", c: "BR", n: "Brasileirão Série B", t: 2, top: 70, bot: 62, w: 0.5, gs: 1},
      "Goiás|Novorizontino|Cuiabá|Atlético Goianiense|Avaí|CRB|Chapecoense|Vila Nova|América Mineiro|Operário Ferroviário|Ponte Preta|Criciúma|Botafogo-SP|Athletic Club|Ferroviária|Londrina|Náutico|Paysandu|Amazonas FC|Sport Recife|Juventude|Ceará|Fortaleza"),
    L({id: "JPN2", c: "JP", n: "J2 League", t: 2, top: 65, bot: 58, w: 0.4, gs: 1, po: [3, 6]},
      "Yokohama FC|Shonan Bellmare|Albirex Niigata|Vegalta Sendai|JEF United Chiba|Montedio Yamagata|Ventforet Kofu|Oita Trinita|Tokushima Vortis|Ehime FC|Fujieda MYFC|Iwaki FC|V-Varen Nagasaki|Roasso Kumamoto|Mito HollyHock|Blaublitz Akita|Renofa Yamaguchi|Kataller Toyama|Imabari FC|Sagan Tosu")
  ].map(function (o) {
    /* cada liga nueva, con el número de clubes que le toca (lo que sobre de la lista se descarta) */
    var want = {ENG4: 24, GER3: 20, ITA301: 20, ITA302: 20, ITA303: 20, FRA3: 17, POR2: 18, NED2: 20, BEL2: 16, TUR2: 20, SCO2: 10, ARG2: 20, BRA2: 20, JPN2: 20}[o.id];
    var cl = o.clubs.split("|"); if (want && cl.length > want) o.clubs = cl.slice(0, want).join("|");
    return o;
  }));

  /* ---------- fútbol femenino: clubes reales en las ligas que no los tenían (mundo "f2") ---------- */
  if (!DATA.leaguesF) return;
  var F = {
    TUR1: [66, 52, "Galatasaray|Fenerbahçe|Beşiktaş|ABB Fomget|Trabzonspor|Hakkarigücü|Fatih Vatan|Ünye Kadın|Amedspor|Giresun Sanayispor|Beylerbeyi|Çekmeköy BilgiDoğa"],
    POL1: [64, 52, "GKS Katowice|Czarni Sosnowiec|Pogoń Szczecin|Śląsk Wrocław|AZS UJ Kraków|Górnik Łęczna|Medyk Konin|UKS SMS Łódź|Rekord Bielsko-Biała|Stomilanki Olsztyn|AP Orlen Gdańsk|Lech Poznań"],
    UKR1: [62, 50, "Vorskla Poltava|Kryvbas|Metalist 1925|Polissya Zhytomyr|Shakhtar Donetsk|Kolos Kovalivka|Obolon Kiev|Dinamo de Kiev|Veres Rivne|Karpaty Lviv"],
    GRE1: [60, 50, "PAOK|Olympiacos|AEK Atenas|REA|Asteras Tripolis|Panathinaikos|OFI Creta|Aris Salónica|Volos NFC|Atromitos"],
    ROU1: [62, 50, "Farul Constanța|Olimpia Cluj|Universitatea Cluj|FCSB|Rapid Bucarest|Dinamo Bucarest|CFR Cluj|Politehnica Timișoara|Vasas Femina Odorhei|Carmen București"],
    HUN1: [62, 50, "Ferencváros|ETO FC Győr|MTK Budapest|Puskás Akadémia|Diósgyőri VTK|Haladás|Szent Mihály|Újpest FC|Budaörs|Kóka"],
    SRB1: [60, 48, "Spartak Subotica|Estrella Roja|Partizan|Vojvodina|Mašinac Niš|Čukarički|Radnički 1923|TSC Bačka Topola"],
    CRO1: [58, 48, "Osijek|Dinamo Zagreb|Hajduk Split|Agram|Split|HNK Rijeka|Dinamo Zagreb B|Donat"],
    IRL1: [60, 50, "Shelbourne|Peamount United|Athlone Town|Shamrock Rovers|Galway United|Bohemians|Wexford Youths|Cork City|Sligo Rovers|DLR Waves|Treaty United|Bray Wanderers"],
    URU1: [56, 46, "Nacional|Peñarol|Defensor Sporting|Liverpool FC (URU)|Danubio|Montevideo Wanderers|Racing de Montevideo|Rampla Juniors|Colón FC|River Plate (URU)"],
    CHI1: [60, 48, "Universidad de Chile|Colo-Colo|Universidad Católica|Santiago Morning|Palestino|Audax Italiano|Everton de Viña|Cobresal|Huachipato|Deportes La Serena|Unión La Calera|Deportes Iquique"],
    PAR1: [56, 46, "Olimpia|Cerro Porteño|Club Libertad|Sportivo Limpeño|Club Guaraní|Sol de América|Sportivo Luqueño|Nacional (PAR)|Club Fernando de la Mora|Sportivo Trinidense"],
    PER1: [54, 44, "Alianza Lima|Universitario|Sporting Cristal|Carlos A. Mannucci|FBC Melgar|Deportivo Municipal|Real Áncash|Comerciantes Unidos|Atlético Trujillo|Cusco FC"],
    ECU1: [56, 46, "Dragonas IDV|Barcelona SC|LDU Quito|Ñañas|Deportivo Cuenca|Emelec|Aucas|El Nacional|U. Católica (ECU)|Orense SC"],
    CRC1: [56, 46, "Deportivo Saprissa|LD Alajuelense|CS Herediano|Sporting San José|Dimas Escazú|AD Moravia|CS Cartaginés|Pérez Zeledón"]
  };
  DATA.leaguesF2 = DATA.leaguesF.map(function (l) {
    var x = F[l.id]; if (!x) return l;
    var o = {}; Object.keys(l).forEach(function (k) { o[k] = l[k]; });
    o.top = x[0]; o.bot = x[1]; o.clubs = x[2];
    return o;
  });
})();
