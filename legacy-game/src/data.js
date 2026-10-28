/* ===== DATOS DEL MUNDO =====
   Selecciones: código|nombre|fuerza (todas las federaciones FIFA)
   Ligas: clubes ordenados de más fuerte a más débil; la fuerza se interpola entre top y bot. */
var DATA = {};

DATA.countries = {
  UEFA: "ES|España|87,FR|Francia|86,ENG|Inglaterra|85,PT|Portugal|84,DE|Alemania|83,NL|Países Bajos|82,IT|Italia|81,BE|Bélgica|80,HR|Croacia|79,CH|Suiza|77,DK|Dinamarca|77,AT|Austria|77,TR|Turquía|77,NO|Noruega|77,SE|Suecia|75,UA|Ucrania|75,PL|Polonia|75,RS|Serbia|75,RU|Rusia|74,CZ|Chequia|74,HU|Hungría|74,SCO|Escocia|74,GR|Grecia|73,WAL|Gales|72,SK|Eslovaquia|72,RO|Rumanía|72,GE|Georgia|72,SI|Eslovenia|71,IE|Irlanda|71,AL|Albania|71,BA|Bosnia y Herzegovina|69,NIR|Irlanda del Norte|68,IS|Islandia|68,FI|Finlandia|68,ZZ|—|0,MK|Macedonia del Norte|67,ME|Montenegro|67,BG|Bulgaria|66,XK|Kosovo|66,KZ|Kazajistán|65,AM|Armenia|64,BY|Bielorrusia|64,LU|Luxemburgo|64,CY|Chipre|63,AZ|Azerbaiyán|62,LT|Lituania|60,EE|Estonia|60,LV|Letonia|59,FO|Islas Feroe|58,MD|Moldavia|58,MT|Malta|56,AD|Andorra|50,LI|Liechtenstein|48,GI|Gibraltar|47,SM|San Marino|45",
  CONMEBOL: "AR|Argentina|86,BR|Brasil|84,UY|Uruguay|79,CO|Colombia|79,EC|Ecuador|77,PY|Paraguay|75,CL|Chile|73,PE|Perú|72,VE|Venezuela|72,BO|Bolivia|66",
  CONCACAF: "MX|México|76,US|Estados Unidos|76,CA|Canadá|74,PA|Panamá|71,CR|Costa Rica|70,JM|Jamaica|68,HN|Honduras|67,CW|Curazao|65,SV|El Salvador|64,HT|Haití|64,GT|Guatemala|64,TT|Trinidad y Tobago|63,SR|Surinam|63,NI|Nicaragua|60,DO|República Dominicana|60,CU|Cuba|58,GY|Guyana|57,PR|Puerto Rico|55,BZ|Belice|55,BM|Bermudas|54,GD|Granada|54,KN|San Cristóbal y Nieves|54,LC|Santa Lucía|52,VC|San Vicente y las Granadinas|52,AG|Antigua y Barbuda|52,DM|Dominica|52,BB|Barbados|52,AW|Aruba|50,KY|Islas Caimán|47,BS|Bahamas|46,MS|Montserrat|45,VG|Islas Vírgenes Británicas|44,TC|Islas Turcas y Caicos|43,VI|Islas Vírgenes de EE. UU.|43,AI|Anguila|42",
  CAF: "MA|Marruecos|79,SN|Senegal|77,CI|Costa de Marfil|76,NG|Nigeria|75,EG|Egipto|74,DZ|Argelia|74,CM|Camerún|74,ML|Malí|73,GH|Ghana|73,TN|Túnez|72,CD|RD Congo|72,ZA|Sudáfrica|71,BF|Burkina Faso|71,CV|Cabo Verde|70,GN|Guinea|69,GA|Gabón|68,AO|Angola|68,GQ|Guinea Ecuatorial|67,ZM|Zambia|66,UG|Uganda|66,BJ|Benín|66,MR|Mauritania|66,LY|Libia|65,CG|Congo|64,KE|Kenia|64,TZ|Tanzania|64,MZ|Mozambique|64,MG|Madagascar|64,GM|Gambia|64,NA|Namibia|63,SD|Sudán|63,ZW|Zimbabue|63,SL|Sierra Leona|63,TG|Togo|63,MW|Malaui|62,GW|Guinea-Bisáu|62,KM|Comoras|62,RW|Ruanda|61,NE|Níger|61,LR|Liberia|60,ET|Etiopía|60,BW|Botsuana|60,BI|Burundi|60,CF|República Centroafricana|60,LS|Lesoto|58,SZ|Esuatini|56,SS|Sudán del Sur|56,TD|Chad|55,MU|Mauricio|54,ST|Santo Tomé y Príncipe|53,DJ|Yibuti|50,SC|Seychelles|49,ER|Eritrea|48,SO|Somalia|48",
  AFC: "JP|Japón|77,IR|Irán|75,KR|Corea del Sur|75,AU|Australia|73,SA|Arabia Saudí|71,UZ|Uzbekistán|71,QA|Catar|70,IQ|Irak|70,AE|Emiratos Árabes Unidos|69,JO|Jordania|69,OM|Omán|66,CN|China|66,BH|Baréin|65,SY|Siria|64,PS|Palestina|64,ID|Indonesia|63,VN|Vietnam|63,TH|Tailandia|63,KW|Kuwait|62,LB|Líbano|62,KP|Corea del Norte|62,KG|Kirguistán|61,TJ|Tayikistán|61,MY|Malasia|60,TM|Turkmenistán|59,IN|India|58,PH|Filipinas|57,YE|Yemen|56,HK|Hong Kong|55,SG|Singapur|54,AF|Afganistán|52,MM|Myanmar|52,MV|Maldivas|50,NP|Nepal|50,BD|Bangladés|50,TW|Taiwán|50,KH|Camboya|50,LA|Laos|48,MN|Mongolia|47,PK|Pakistán|46,LK|Sri Lanka|45,BT|Bután|44,GU|Guam|44,BN|Brunéi|44,TL|Timor Oriental|44,MO|Macao|42",
  OFC: "NZ|Nueva Zelanda|66,NC|Nueva Caledonia|54,FJ|Fiyi|53,SB|Islas Salomón|52,PF|Tahití|52,PG|Papúa Nueva Guinea|50,VU|Vanuatu|50,WS|Samoa|45,TO|Tonga|43,CK|Islas Cook|42,AS|Samoa Americana|40"
};

/* id, país, nombre, nivel, fuerza máx/mín, copa, supercopa, plazas continentales, ascensos/descensos, riqueza (salarios), coef. Bota de Oro */
DATA.leagues = [
  // ---------------- UEFA ----------------
  {id:"ENG1",c:"ENG",n:"Premier League",t:1,top:86,bot:74,cup:"FA Cup",sc:"Community Shield",eu:[4,2,1],down:"ENG2",rel:3,w:4,gs:2,
   clubs:"Arsenal|Manchester City|Liverpool|Chelsea|Newcastle United|Manchester United|Tottenham Hotspur|Aston Villa|Nottingham Forest|Brighton & Hove Albion|Crystal Palace|Bournemouth|Brentford|Fulham|Everton|Sunderland|Leeds United|Ipswich Town|Coventry City|Hull City"},
  {id:"ENG2",c:"ENG",n:"EFL Championship",t:2,top:73,bot:66,down:"ENG3",rel:3,w:1.3,gs:1,
   clubs:"West Ham United|Wolverhampton Wanderers|Burnley|Southampton|Middlesbrough|Sheffield United|Norwich City|West Bromwich Albion|Stoke City|Watford|Bristol City|Millwall|Blackburn Rovers|Swansea City|Derby County|Queens Park Rangers|Wrexham|Preston North End|Birmingham City|Portsmouth|Charlton Athletic|Cardiff City|Bolton Wanderers|Lincoln City"},
  {id:"ENG3",c:"ENG",n:"EFL League One",t:3,top:65,bot:59,w:0.6,gs:1,
   clubs:"Leicester City|Sheffield Wednesday|Oxford United|Stockport County|Huddersfield Town|Bradford City|Wigan Athletic|Barnsley|Reading|Luton Town|Plymouth Argyle|Leyton Orient|Peterborough United|Wycombe Wanderers|Rotherham United|Mansfield Town|Blackpool|Exeter City|Stevenage|Burton Albion|Northampton Town|AFC Wimbledon|Doncaster Rovers|Port Vale"},
  {id:"ESP1",c:"ES",n:"LaLiga EA Sports",t:1,top:86,bot:73,cup:"Copa del Rey",sc:"Supercopa de España",eu:[4,2,1],down:"ESP2",rel:3,w:2.6,gs:2,
   clubs:"Real Madrid|FC Barcelona|Atlético de Madrid|Athletic Club|Villarreal CF|Real Betis|Real Sociedad|Celta de Vigo|Sevilla FC|Valencia CF|CA Osasuna|Rayo Vallecano|Getafe CF|RCD Espanyol|Deportivo Alavés|Elche CF|Levante UD|Real Racing Club|RC Deportivo|Málaga CF"},
  {id:"ESP2",c:"ES",n:"LaLiga Hypermotion",t:2,top:72,bot:65,w:0.8,gs:1,
   clubs:"Girona FC|RCD Mallorca|Real Oviedo|UD Las Palmas|Real Valladolid|CD Leganés|UD Almería|Granada CF|Real Sporting|Cádiz CF|SD Eibar|FC Andorra|Córdoba CF|CD Castellón|Burgos CF|Albacete BP|CD Tenerife|AD Ceuta|CD Eldense|CE Sabadell|Real Sociedad B|Celta Fortuna"},
  {id:"ITA1",c:"IT",n:"Serie A",t:1,top:85,bot:72,cup:"Coppa Italia",sc:"Supercoppa Italiana",eu:[4,2,1],down:"ITA2",rel:3,w:2.3,gs:2,
   clubs:"Inter|Napoli|Juventus|AC Milan|Atalanta|AS Roma|Como 1907|Lazio|Bologna|Fiorentina|Torino|Udinese|Genoa|Parma|Cagliari|Sassuolo|Lecce|Venezia|Monza|Frosinone"},
  {id:"ITA2",c:"IT",n:"Serie B",t:2,top:71,bot:64,w:0.7,gs:1,
   clubs:"Hellas Verona|Cremonese|Pisa|Empoli|Palermo|Sampdoria|Modena|Cesena|Catanzaro|Südtirol|Padova|Mantova|Carrarese|Juve Stabia|Virtus Entella|Avellino|Benevento|Arezzo|Vicenza|Ascoli"},
  {id:"GER1",c:"DE",n:"Bundesliga",t:1,top:86,bot:72,cup:"DFB-Pokal",sc:"Supercopa de Alemania",eu:[4,2,1],down:"GER2",rel:3,w:2.4,gs:2,
   clubs:"Bayern Múnich|Bayer Leverkusen|Borussia Dortmund|RB Leipzig|Eintracht Frankfurt|VfB Stuttgart|SC Freiburg|TSG Hoffenheim|Werder Bremen|Borussia Mönchengladbach|Mainz 05|FC Augsburg|Union Berlin|1. FC Köln|Hamburger SV|Schalke 04|SC Paderborn|SV Elversberg"},
  {id:"GER2",c:"DE",n:"2. Bundesliga",t:2,top:72,bot:65,w:0.8,gs:1,
   clubs:"VfL Wolfsburg|FC St. Pauli|1. FC Heidenheim|Hertha BSC|Hannover 96|1. FC Kaiserslautern|Holstein Kiel|VfL Bochum|1. FC Nürnberg|Karlsruher SC|Darmstadt 98|1. FC Magdeburg|Greuther Fürth|Arminia Bielefeld|Eintracht Braunschweig|Dynamo Dresden|Energie Cottbus|VfL Osnabrück"},
  {id:"FRA1",c:"FR",n:"Ligue 1",t:1,top:85,bot:71,cup:"Coupe de France",sc:"Trophée des Champions",eu:[3,2,1],down:"FRA2",rel:2,w:2,gs:2,
   clubs:"Paris Saint-Germain|Olympique de Marsella|AS Mónaco|LOSC Lille|Olympique de Lyon|RC Lens|OGC Niza|Stade Rennais|RC Estrasburgo|Stade Brestois|Toulouse FC|Paris FC|AJ Auxerre|Angers SCO|Le Havre AC|FC Lorient|ESTAC Troyes|Le Mans FC"},
  {id:"FRA2",c:"FR",n:"Ligue 2",t:2,top:71,bot:64,w:0.6,gs:1,
   clubs:"FC Nantes|FC Metz|AS Saint-Étienne|Stade de Reims|Montpellier HSC|EA Guingamp|Red Star FC|Clermont Foot|Pau FC|Grenoble Foot|Stade Lavallois|USL Dunkerque|Rodez AF|FC Annecy|AS Nancy Lorraine|US Boulogne|Dijon FCO|FC Sochaux"},
  {id:"POR1",c:"PT",n:"Liga Portugal",t:1,top:82,bot:68,cup:"Taça de Portugal",sc:"Supertaça",eu:[2,2,1],w:1,gs:1.5,
   clubs:"SL Benfica|Sporting CP|FC Porto|SC Braga|Vitória SC|FC Famalicão|Gil Vicente|Casa Pia|Estoril Praia|Rio Ave|Moreirense|Santa Clara|FC Arouca|Estrela da Amadora|FC Alverca|CD Nacional|CS Marítimo|Académico de Viseu"},
  {id:"NED1",c:"NL",n:"Eredivisie",t:1,top:80,bot:67,cup:"KNVB Beker",sc:"Johan Cruijff Schaal",eu:[2,2,1],w:1,gs:1.5,
   clubs:"PSV|Feyenoord|Ajax|AZ Alkmaar|FC Twente|FC Utrecht|NEC Nijmegen|Go Ahead Eagles|SC Heerenveen|FC Groningen|Sparta Rotterdam|PEC Zwolle|Fortuna Sittard|Excelsior|Telstar|ADO Den Haag|Willem II|SC Cambuur"},
  {id:"BEL1",c:"BE",n:"Jupiler Pro League",t:1,top:78,bot:66,cup:"Copa de Bélgica",eu:[1,2,1],w:0.9,gs:1.5,
   clubs:"Club Brujas|Union Saint-Gilloise|RSC Anderlecht|KRC Genk|KAA Gante|Royal Antwerp|Standard de Lieja|KV Mechelen|Sporting Charleroi|Cercle Brujas|KVC Westerlo|OH Leuven|Sint-Truiden|Zulte Waregem|RAAL La Louvière|FCV Dender"},
  {id:"TUR1",c:"TR",n:"Süper Lig",t:1,top:80,bot:67,cup:"Copa de Turquía",sc:"Supercopa de Turquía",eu:[1,2,1],w:1.4,gs:1.5,
   clubs:"Galatasaray|Fenerbahçe|Beşiktaş|Trabzonspor|Başakşehir|Samsunspor|Göztepe|Kasımpaşa|Alanyaspor|Çaykur Rizespor|Konyaspor|Gaziantep FK|Eyüpspor|Kocaelispor|Gençlerbirliği|Erzurumspor|Amedspor|Çorum FK"},
  {id:"SCO1",c:"SCO",n:"Scottish Premiership",t:1,top:76,bot:63,cup:"Scottish Cup",eu:[1,1,1],w:0.8,gs:1.5,
   clubs:"Celtic|Rangers|Heart of Midlothian|Hibernian|Aberdeen|Motherwell|Dundee United|Falkirk|St Mirren|Kilmarnock|Dundee FC|St Johnstone"},
  {id:"AUT1",c:"AT",n:"Bundesliga austriaca",t:1,top:75,bot:64,cup:"ÖFB-Cup",eu:[1,1,2],w:0.7,gs:1.5,
   clubs:"Red Bull Salzburgo|Sturm Graz|Rapid Viena|LASK|Austria Viena|Wolfsberger AC|TSV Hartberg|SCR Altach|WSG Tirol|Blau-Weiß Linz|Grazer AK|SV Ried"},
  {id:"SUI1",c:"CH",n:"Super League suiza",t:1,top:74,bot:64,cup:"Copa de Suiza",eu:[1,1,2],w:0.9,gs:1.5,
   clubs:"Young Boys|FC Basilea|Servette FC|FC Lugano|FC Zúrich|FC St. Gallen|FC Luzern|Lausanne-Sport|FC Sion|Grasshoppers|FC Thun|FC Winterthur"},
  {id:"DEN1",c:"DK",n:"Superliga danesa",t:1,top:74,bot:63,cup:"Copa de Dinamarca",eu:[1,1,2],w:0.7,gs:1.5,
   clubs:"FC Copenhague|FC Midtjylland|Brøndby IF|AGF Aarhus|FC Nordsjælland|Randers FC|Silkeborg IF|Viborg FF|OB Odense|Sønderjyske|Vejle BK|FC Fredericia"},
  {id:"NOR1",c:"NO",n:"Eliteserien",t:1,top:74,bot:62,cup:"Copa de Noruega",eu:[1,1,2],w:0.6,gs:1,
   clubs:"Bodø/Glimt|Molde FK|Rosenborg|SK Brann|Viking FK|Vålerenga|Lillestrøm|Tromsø IL|Sarpsborg 08|Fredrikstad|Kristiansund BK|Sandefjord|HamKam|KFUM Oslo|IK Start|Aalesunds FK"},
  {id:"SWE1",c:"SE",n:"Allsvenskan",t:1,top:72,bot:62,cup:"Copa de Suecia",eu:[0,1,2],w:0.6,gs:1,
   clubs:"Malmö FF|Hammarby IF|AIK|Djurgårdens IF|Mjällby AIF|IF Elfsborg|BK Häcken|IFK Göteborg|GAIS|IK Sirius|Halmstads BK|IF Brommapojkarna|Degerfors IF|Västerås SK|Kalmar FF|Örgryte IS"},
  {id:"CZE1",c:"CZ",n:"Chance Liga",t:1,top:74,bot:62,cup:"Copa de Chequia",eu:[1,1,2],w:0.6,gs:1,
   clubs:"Slavia Praga|Sparta Praga|Viktoria Plzeň|Baník Ostrava|Slovan Liberec|Sigma Olomouc|Mladá Boleslav|Hradec Králové|FK Jablonec|Bohemians 1905|FK Teplice|1. FC Slovácko|FK Pardubice|MFK Karviná|Dukla Praga|FC Zlín"},
  {id:"GRE1",c:"GR",n:"Super League Grecia",t:1,top:76,bot:63,cup:"Copa de Grecia",eu:[1,1,2],w:0.8,gs:1,
   clubs:"Olympiacos|PAOK|AEK Atenas|Panathinaikos|Aris Salónica|Asteras Tripolis|OFI Creta|Atromitos|Volos NFC|Panetolikos|Levadiakos|AO Kifisia|AEL Larissa|Panserraikos"},
  {id:"POL1",c:"PL",n:"Ekstraklasa",t:1,top:73,bot:63,cup:"Copa de Polonia",eu:[1,1,2],w:0.6,gs:1,
   clubs:"Lech Poznań|Legia Varsovia|Raków Częstochowa|Jagiellonia Białystok|Pogoń Szczecin|Górnik Zabrze|Cracovia|GKS Katowice|Widzew Łódź|Zagłębie Lubin|Lechia Gdańsk|Motor Lublin|Piast Gliwice|Korona Kielce|Radomiak Radom|Arka Gdynia|Bruk-Bet Termalica|Wisła Płock"},
  {id:"CRO1",c:"HR",n:"SuperSport HNL",t:1,top:74,bot:62,cup:"Copa de Croacia",eu:[1,1,1],w:0.5,gs:1,
   clubs:"Dinamo Zagreb|Hajduk Split|HNK Rijeka|NK Osijek|Lokomotiva Zagreb|Slaven Belupo|NK Varaždin|NK Istra 1961|HNK Gorica|NK Vukovar 1991"},
  {id:"SRB1",c:"RS",n:"SuperLiga serbia",t:1,top:73,bot:60,cup:"Copa de Serbia",eu:[1,1,1],w:0.5,gs:1,
   clubs:"Estrella Roja|Partizan|TSC Bačka Topola|Vojvodina|Čukarički|Radnički 1923|FK Novi Pazar|OFK Beograd|Železničar Pančevo|Spartak Subotica|IMT Novi Beograd|Mladost Lučani|Radnik Surdulica|Napredak Kruševac|Javor Ivanjica|Radnički Niš"},
  {id:"UKR1",c:"UA",n:"Premier League ucraniana",t:1,top:74,bot:61,cup:"Copa de Ucrania",eu:[1,1,1],w:0.6,gs:1,
   clubs:"Shakhtar Donetsk|Dinamo de Kiev|Polissya Zhytomyr|LNZ Cherkasy|Kryvbas|Karpaty Lviv|Zorya Luhansk|Kolos Kovalivka|Rukh Lviv|Veres Rivne|Obolon Kiev|FC Oleksandriya|Metalist 1925|Epitsentr|FC Kudrivka|SC Poltava"},
  {id:"RUS1",c:"RU",n:"Premier League rusa",t:1,top:75,bot:63,cup:"Copa de Rusia",eu:[0,0,0],w:1.2,gs:1,
   clubs:"Zenit|FC Krasnodar|Spartak de Moscú|Lokomotiv de Moscú|CSKA Moscú|Dinamo de Moscú|Rubin Kazán|FC Rostov|Akhmat Grozny|Krylia Sovetov|Baltika Kaliningrado|Dinamo Makhachkala|FC Orenburg|Pari Nizhny Novgorod|Akron Togliatti|FC Sochi"},
  {id:"ROU1",c:"RO",n:"SuperLiga rumana",t:1,top:71,bot:60,cup:"Copa de Rumanía",eu:[0,1,2],w:0.5,gs:1,
   clubs:"FCSB|CFR Cluj|Universitatea Craiova|Rapid Bucarest|Dinamo Bucarest|Universitatea Cluj|Farul Constanța|Petrolul Ploiești|Oțelul Galați|UTA Arad|FC Botoșani|FC Hermannstadt|FK Csíkszereda|Metaloglobus|Unirea Slobozia|FC Argeș"},
  {id:"HUN1",c:"HU",n:"NB I",t:1,top:71,bot:60,cup:"Copa de Hungría",eu:[0,1,1],w:0.5,gs:1,
   clubs:"Ferencváros|Puskás Akadémia|Paksi FC|Győri ETO|Debreceni VSC|MTK Budapest|Diósgyőri VTK|Újpest FC|ZTE|Nyíregyháza|Kisvárda|Kazincbarcika"},
  {id:"CYP1",c:"CY",n:"Liga chipriota",t:1,top:71,bot:60,cup:"Copa de Chipre",eu:[0,1,2],w:0.6,gs:1,
   clubs:"APOEL|Omonia Nicosia|Pafos FC|AEK Larnaca|Aris Limassol|Apollon Limassol|AEL Limassol|Anorthosis|Ethnikos Achna|Enosis Paralimni|Omonia Aradippou|Olympiakos Nicosia|Akritas Chlorakas|Krasava"},
  {id:"KAZ1",c:"KZ",n:"Premier League de Kazajistán",t:1,top:66,bot:56,cup:"Copa de Kazajistán",eu:[0,1,2],w:0.5,gs:1,
   clubs:"Kairat Almaty|FC Astana|Tobol Kostanay|Ordabasy|Aktobe|Elimai|Zhetysu|Atyrau|Kaisar|Kyzylzhar|Okzhetpes|Zhenis|Ulytau|Turan"},
  {id:"BUL1",c:"BG",n:"Efbet Liga",t:1,top:70,bot:58,cup:"Copa de Bulgaria",eu:[0,1,1],w:0.4,gs:1,
   clubs:"Ludogorets|Levski Sofía|CSKA Sofía|Lokomotiv Plovdiv|Cherno More|CSKA 1948|Arda Kardzhali|Botev Plovdiv|Slavia Sofía|Beroe|Spartak Varna|Septemvri Sofía|Lokomotiv Sofía|Botev Vratsa|Dobrudzha|Montana"},
  {id:"SVK1",c:"SK",n:"Niké Liga",t:1,top:68,bot:58,cup:"Copa de Eslovaquia",eu:[0,1,1],w:0.4,gs:1,
   clubs:"Slovan Bratislava|DAC Dunajská Streda|Spartak Trnava|MŠK Žilina|FK Železiarne Podbrezová|MFK Zemplín Michalovce|MFK Ružomberok|AS Trenčín|FC Košice|KFC Komárno|MFK Skalica|Tatran Prešov"},
  {id:"IRL1",c:"IE",n:"League of Ireland",t:1,top:64,bot:57,cup:"FAI Cup",eu:[0,0,2],w:0.3,gs:1,
   clubs:"Shamrock Rovers|Shelbourne|Bohemians|Derry City|St Patrick's Athletic|Drogheda United|Sligo Rovers|Galway United|Waterford FC|Dundalk"},
  // ---------------- CONMEBOL ----------------
  {id:"ARG1",c:"AR",n:"Liga Profesional",t:1,top:77,bot:67,cup:"Copa Argentina",sc:"Trofeo de Campeones",sa:[5,6],w:0.6,gs:1,
   clubs:"River Plate|Boca Juniors|Racing Club|Estudiantes de La Plata|Vélez Sarsfield|Talleres|Independiente|Rosario Central|Argentinos Juniors|Huracán|Lanús|San Lorenzo|Belgrano|Defensa y Justicia|Newell's Old Boys|Tigre|Platense|Unión de Santa Fe|Gimnasia y Esgrima LP|Instituto|Independiente Rivadavia|Barracas Central|Banfield|Atlético Tucumán|Central Córdoba|Sarmiento|Deportivo Riestra|Aldosivi|Gimnasia de Mendoza|Estudiantes de Río Cuarto"},
  {id:"BRA1",c:"BR",n:"Brasileirão Série A",t:1,top:79,bot:69,cup:"Copa do Brasil",sc:"Supercopa do Brasil",sa:[6,6],w:1,gs:1,
   clubs:"Flamengo|Palmeiras|Botafogo|Fluminense|São Paulo|Corinthians|Atlético Mineiro|Cruzeiro|Internacional|Grêmio|Bahia|Vasco da Gama|RB Bragantino|Athletico Paranaense|Santos|Mirassol|Vitória|Coritiba|Chapecoense|Remo"},
  {id:"URU1",c:"UY",n:"Primera División uruguaya",t:1,top:69,bot:60,sa:[3,3],w:0.3,gs:1,
   clubs:"Peñarol|Nacional|Defensor Sporting|Liverpool FC (URU)|Danubio|Racing de Montevideo|Boston River|Montevideo Wanderers|Cerro Largo|Plaza Colonia|Progreso|Juventud de Las Piedras|CA Cerro|Montevideo City Torque|Central Español|Deportivo Maldonado"},
  {id:"COL1",c:"CO",n:"Liga BetPlay",t:1,top:70,bot:61,cup:"Copa Colombia",sa:[3,4],w:0.35,gs:1,
   clubs:"Atlético Nacional|Millonarios|América de Cali|Junior|Independiente Santa Fe|Deportes Tolima|Independiente Medellín|Once Caldas|Deportivo Cali|Atlético Bucaramanga|Deportivo Pereira|Águilas Doradas|Fortaleza CEIF|Alianza FC|Envigado|Boyacá Chicó|Llaneros|Internacional de Bogotá|Cúcuta Deportivo|Jaguares de Córdoba"},
  {id:"CHI1",c:"CL",n:"Liga de Primera",t:1,top:70,bot:61,cup:"Copa Chile",sa:[3,3],w:0.35,gs:1,
   clubs:"Colo-Colo|Universidad de Chile|Universidad Católica|Coquimbo Unido|Palestino|O'Higgins|Everton de Viña|Audax Italiano|Huachipato|Ñublense|Cobresal|Deportes La Serena|Unión La Calera|Deportes Limache|Deportes Concepción|Universidad de Concepción"},
  {id:"ECU1",c:"EC",n:"LigaPro",t:1,top:70,bot:60,sa:[3,3],w:0.35,gs:1,
   clubs:"Independiente del Valle|LDU Quito|Barcelona SC|Emelec|Aucas|U. Católica (ECU)|Deportivo Cuenca|Orense SC|El Nacional|Delfín SC|Técnico Universitario|Macará|Mushuc Runa|Libertad FC|Manta FC|Leones del Norte"},
  {id:"PAR1",c:"PY",n:"Primera División paraguaya",t:1,top:68,bot:60,sa:[3,3],w:0.3,gs:1,
   clubs:"Olimpia|Cerro Porteño|Club Libertad|Club Guaraní|Nacional (PAR)|Sportivo Luqueño|Sportivo Trinidense|2 de Mayo|Sportivo Ameliano|Tacuary|General Caballero JLM|Recoleta FC"},
  {id:"PER1",c:"PE",n:"Liga 1",t:1,top:67,bot:58,sa:[2,2],w:0.3,gs:1,
   clubs:"Universitario|Alianza Lima|Sporting Cristal|FBC Melgar|Cusco FC|Cienciano|Alianza Atlético|Sport Huancayo|Deportivo Garcilaso|ADT Tarma|Los Chankas|Atlético Grau|Comerciantes Unidos|Juan Pablo II|UTC Cajamarca|Sport Boys|Ayacucho FC|Alianza Universidad"},
  {id:"BOL1",c:"BO",n:"División Profesional",t:1,top:64,bot:56,sa:[2,1],w:0.2,gs:1,
   clubs:"Bolívar|The Strongest|Always Ready|Blooming|Oriente Petrolero|Nacional Potosí|Aurora|Real Tomayapo|San Antonio Bulo Bulo|Guabirá|Independiente Petrolero|Universitario de Vinto"},
  {id:"VEN1",c:"VE",n:"Liga FUTVE",t:1,top:63,bot:56,sa:[2,1],w:0.2,gs:1,
   clubs:"Deportivo Táchira|Caracas FC|Carabobo FC|Academia Puerto Cabello|Monagas SC|Deportivo La Guaira|Metropolitanos|Universidad Central|Zamora FC|Portuguesa FC|Estudiantes de Mérida|Rayo Zuliano"},
  // ---------------- CONCACAF ----------------
  {id:"MLS",c:"US",n:"MLS",t:1,top:75,bot:66,cup:"US Open Cup",cc:6,w:1.6,gs:1,
   clubs:"Inter Miami|Los Angeles FC|Columbus Crew|FC Cincinnati|Philadelphia Union|Seattle Sounders|Vancouver Whitecaps|LA Galaxy|Charlotte FC|Nashville SC|Orlando City|New York City FC|New York Red Bulls|Minnesota United|San Diego FC|Atlanta United|Austin FC|Portland Timbers|Real Salt Lake|Houston Dynamo|FC Dallas|Colorado Rapids|St. Louis City|New England Revolution|Chicago Fire|Toronto FC|CF Montréal|Sporting Kansas City|D.C. United|San Jose Earthquakes"},
  {id:"MEX1",c:"MX",n:"Liga MX",t:1,top:76,bot:67,cup:"Campeón de Campeones",cc:7,w:1.1,gs:1,
   clubs:"Club América|Toluca|Tigres UANL|Cruz Azul|CF Monterrey|Guadalajara|Pumas UNAM|Pachuca|Club León|Atlas|Club Tijuana|Santos Laguna|Necaxa|FC Juárez|Atlético San Luis|Querétaro|Club Puebla|Atlante"},
  {id:"CRC1",c:"CR",n:"Primera División de Costa Rica",t:1,top:65,bot:57,cc:3,w:0.2,gs:1,
   clubs:"Deportivo Saprissa|LD Alajuelense|CS Herediano|CS Cartaginés|Municipal Liberia|Sporting San José|Puntarenas FC|Santos de Guápiles|AD Guanacasteca|Pérez Zeledón"},
  // ---------------- AFC ----------------
  {id:"KSA1",c:"SA",n:"Saudi Pro League",t:1,top:80,bot:66,cup:"Copa del Rey saudí",sc:"Supercopa saudí",afc:5,w:5,gs:1,
   clubs:"Al-Hilal|Al-Nassr|Al-Ittihad|Al-Ahli|Al-Qadsiah|Al-Shabab|Al-Ettifaq|Al-Taawoun|Neom SC|Al-Fateh|Al-Khaleej|Al-Fayha|Al-Kholood|Al-Riyadh|Al-Hazem|Abha|Al-Diriyah|Al-Faisaly"},
  {id:"JPN1",c:"JP",n:"J1 League",t:1,top:72,bot:63,cup:"Copa del Emperador",afc:3,w:0.8,gs:1,
   clubs:"Vissel Kobe|Kashima Antlers|Sanfrecce Hiroshima|Kashiwa Reysol|Urawa Red Diamonds|Kawasaki Frontale|Machida Zelvia|Gamba Osaka|Cerezo Osaka|Kyoto Sanga|FC Tokyo|Nagoya Grampus|Tokyo Verdy|Avispa Fukuoka|Shimizu S-Pulse|Fagiano Okayama|Yokohama F. Marinos|Mito HollyHock|V-Varen Nagasaki|JEF United Chiba"},
  {id:"KOR1",c:"KR",n:"K League 1",t:1,top:70,bot:62,cup:"Copa de Corea",afc:3,w:0.6,gs:1,
   clubs:"Ulsan HD|Jeonbuk Hyundai|Pohang Steelers|FC Seoul|Gangwon FC|Daejeon Hana Citizen|Gimcheon Sangmu|Gwangju FC|FC Anyang|Jeju SK|Incheon United|Bucheon FC 1995"},
  {id:"QAT1",c:"QA",n:"Stars League",t:1,top:70,bot:60,cup:"Copa del Emir",afc:3,w:2.5,gs:1,
   clubs:"Al-Sadd|Al-Duhail|Al-Rayyan|Al-Gharafa|Al-Arabi|Al-Wakrah|Qatar SC|Umm Salal|Al-Shamal|Al-Shahania|Al-Sailiya|Al-Khor"},
  {id:"UAE1",c:"AE",n:"UAE Pro League",t:1,top:71,bot:60,cup:"Copa del Presidente",afc:3,w:2,gs:1,
   clubs:"Al-Ain|Shabab Al-Ahli|Al-Wahda|Al-Jazira|Sharjah FC|Al-Wasl|Al-Nasr Dubái|Ajman Club|Ittihad Kalba|Baniyas|Khor Fakkan|Al-Bataeh|Dibba FC|Al-Dhafra"},
  {id:"CHN1",c:"CN",n:"Chinese Super League",t:1,top:68,bot:60,cup:"Copa de China",afc:2,w:1.2,gs:1,
   clubs:"Shanghai Port|Shanghai Shenhua|Chengdu Rongcheng|Beijing Guoan|Shandong Taishan|Tianjin Jinmen Tiger|Zhejiang FC|Henan FC|Yunnan Yukun|Qingdao West Coast|Wuhan Three Towns|Dalian Yingbo|Shenzhen Peng City|Qingdao Hainiu|Liaoning Tieren|Chongqing Tonglianglong"},
  {id:"AUS1",c:"AU",n:"A-League",t:1,top:66,bot:59,cup:"Australia Cup",afc:2,w:0.6,gs:1,
   clubs:"Melbourne City|Auckland FC|Western Sydney Wanderers|Melbourne Victory|Sydney FC|Adelaide United|Central Coast Mariners|Macarthur FC|Wellington Phoenix|Brisbane Roar|Newcastle Jets|Perth Glory"},
  {id:"IRN1",c:"IR",n:"Persian Gulf Pro League",t:1,top:66,bot:58,cup:"Copa Hazfi",afc:2,w:0.4,gs:1,
   clubs:"Persepolis|Esteghlal|Sepahan|Tractor|Foolad|Gol Gohar|Zob Ahan|Malavan|Shams Azar|Aluminium Arak|Chadormalou|Esteghlal Khuzestan|Mes Rafsanjan|Kheybar|Havadar|Paykan"},
  {id:"IND1",c:"IN",n:"Indian Super League",t:1,top:60,bot:53,cup:"Super Cup",afc:1,w:0.3,gs:1,
   clubs:"Mohun Bagan SG|FC Goa|Bengaluru FC|Mumbai City|Kerala Blasters|East Bengal|Jamshedpur FC|NorthEast United|Odisha FC|Chennaiyin FC|Punjab FC|Inter Kashi|Mohammedan SC"},
  // ---------------- CAF ----------------
  {id:"EGY1",c:"EG",n:"Egyptian Premier League",t:1,top:70,bot:59,cup:"Copa de Egipto",sc:"Supercopa de Egipto",caf:4,w:0.4,gs:1,
   clubs:"Al Ahly|Zamalek|Pyramids FC|Al Masry|Future FC|Ceramica Cleopatra|Ismaily|ENPPI|Smouha|Al Ittihad Alexandria|Talaea El Gaish|National Bank of Egypt|ZED FC|Pharco|Petrojet|Ghazl El Mahalla|El Gouna|Wadi Degla"},
  {id:"MAR1",c:"MA",n:"Botola Pro",t:1,top:70,bot:59,cup:"Copa del Trono",caf:4,w:0.4,gs:1,
   clubs:"Wydad Casablanca|Raja Casablanca|RS Berkane|AS FAR|FUS Rabat|Maghreb Fès|Hassania Agadir|Difaâ El Jadidi|Ittihad Tanger|Olympique Safi|Union Touarga|CODM Meknès|Renaissance Zemamra|KAC Marrakech|Olympic Dcheira|Kawkab Marrakech"},
  {id:"RSA1",c:"ZA",n:"Betway Premiership",t:1,top:69,bot:58,cup:"Nedbank Cup",caf:3,w:0.4,gs:1,
   clubs:"Mamelodi Sundowns|Orlando Pirates|Kaizer Chiefs|Stellenbosch FC|Sekhukhune United|TS Galaxy|Polokwane City|AmaZulu|Golden Arrows|Chippa United|Richards Bay|Durban City|Marumo Gallants|Magesi FC|Orbit College|Siwelele FC"},
  {id:"TUN1",c:"TN",n:"Ligue Professionnelle 1",t:1,top:67,bot:57,cup:"Copa de Túnez",caf:2,w:0.3,gs:1,
   clubs:"Espérance de Tunis|Club Africain|Étoile du Sahel|CS Sfaxien|US Monastir|Stade Tunisien|CA Bizertin|US Ben Guerdane|AS Marsa|ES Métlaoui|Olympique Béja|JS Kairouan|ES Zarzis|AS Soliman|JS Omrane|EGS Gafsa"},
  {id:"ALG1",c:"DZ",n:"Ligue 1 argelina",t:1,top:67,bot:57,cup:"Copa de Argelia",caf:3,w:0.3,gs:1,
   clubs:"MC Alger|CR Belouizdad|USM Alger|JS Kabylie|CS Constantine|ES Sétif|MC Oran|Paradou AC|ASO Chlef|JS Saoura|Olympique Akbou|USM Khenchela|ES Mostaganem|MB Rouissat|NC Magra|ES Ben Aknoun"}
];

/* Colores reales de algunos clubes (principal, secundario). El resto se generan. */
DATA.colors = {
  "Real Madrid":["#f4f4f4","#1d2b5a"],"FC Barcelona":["#a50044","#004d98"],"Atlético de Madrid":["#cb3524","#272e61"],"Athletic Club":["#ee2523","#f4f4f4"],"Villarreal CF":["#ffe667","#005187"],"Real Betis":["#0bb363","#f4f4f4"],"Real Sociedad":["#0067b1","#f4f4f4"],"Sevilla FC":["#f4f4f4","#d4021d"],"Valencia CF":["#f4f4f4","#ee3524"],"Celta de Vigo":["#8ac3ee","#f4f4f4"],
  "Arsenal":["#ef0107","#f4f4f4"],"Manchester City":["#6cabdd","#1c2c5b"],"Liverpool":["#c8102e","#f6eb61"],"Chelsea":["#034694","#f4f4f4"],"Manchester United":["#da291c","#fbe122"],"Tottenham Hotspur":["#f4f4f4","#132257"],"Newcastle United":["#241f20","#f4f4f4"],"Aston Villa":["#670e36","#95bfe5"],"Everton":["#003399","#f4f4f4"],"West Ham United":["#7a263a","#1bb1e7"],
  "Bayern Múnich":["#dc052d","#f4f4f4"],"Borussia Dortmund":["#fde100","#111111"],"Bayer Leverkusen":["#e32221","#111111"],"RB Leipzig":["#f4f4f4","#dd0741"],"Eintracht Frankfurt":["#111111","#e1000f"],"Schalke 04":["#004d9d","#f4f4f4"],"Hamburger SV":["#0a3f86","#f4f4f4"],
  "Inter":["#010e80","#111111"],"AC Milan":["#fb090b","#111111"],"Juventus":["#f4f4f4","#111111"],"Napoli":["#12a0d7","#f4f4f4"],"AS Roma":["#8e1f2f","#f0bc42"],"Lazio":["#87d8f7","#f4f4f4"],"Fiorentina":["#482e92","#f4f4f4"],"Atalanta":["#1e71b8","#111111"],
  "Paris Saint-Germain":["#004170","#da291c"],"Olympique de Marsella":["#f4f4f4","#2faee0"],"Olympique de Lyon":["#f4f4f4","#da001a"],"AS Mónaco":["#e7211a","#f4f4f4"],"LOSC Lille":["#e01e13","#24215b"],
  "SL Benfica":["#e83030","#f4f4f4"],"FC Porto":["#00428c","#f4f4f4"],"Sporting CP":["#008057","#f4f4f4"],"SC Braga":["#dc1f26","#f4f4f4"],
  "Ajax":["#d2122e","#f4f4f4"],"PSV":["#ed1c24","#f4f4f4"],"Feyenoord":["#e1000f","#f4f4f4"],"Celtic":["#018749","#f4f4f4"],"Rangers":["#1b458f","#f4f4f4"],
  "Galatasaray":["#a90432","#fdb912"],"Fenerbahçe":["#163962","#ffed00"],"Beşiktaş":["#111111","#f4f4f4"],"Trabzonspor":["#860e2c","#3fa9f5"],"Club Brujas":["#0067ce","#111111"],"RSC Anderlecht":["#4c2683","#f4f4f4"],
  "Boca Juniors":["#103f79","#f3b229"],"River Plate":["#f4f4f4","#e2231a"],"Racing Club":["#6cb4e4","#f4f4f4"],"Independiente":["#e2231a","#f4f4f4"],"San Lorenzo":["#1c3f94","#e2231a"],
  "Flamengo":["#c3281e","#111111"],"Palmeiras":["#006437","#f4f4f4"],"Corinthians":["#f4f4f4","#111111"],"São Paulo":["#f4f4f4","#fe0000"],"Santos":["#f4f4f4","#111111"],"Fluminense":["#870a28","#00613c"],"Botafogo":["#111111","#f4f4f4"],"Grêmio":["#0d80bf","#111111"],"Internacional":["#e5050f","#f4f4f4"],
  "Al-Hilal":["#1a4fa0","#f4f4f4"],"Al-Nassr":["#fcd116","#1a3d8f"],"Al-Ittihad":["#fcd116","#111111"],"Al-Ahli":["#00843d","#f4f4f4"],
  "Inter Miami":["#f7b5cd","#231f20"],"LA Galaxy":["#00245d","#ffd200"],"Los Angeles FC":["#111111","#c39e6d"],"Club América":["#fff200","#002d72"],"Guadalajara":["#cd1f2d","#f4f4f4"],"Cruz Azul":["#0047bb","#f4f4f4"],"Tigres UANL":["#fdb913","#003da5"],
  "Al Ahly":["#e31b23","#f4f4f4"],"Zamalek":["#f4f4f4","#e31b23"],"Wydad Casablanca":["#d71920","#f4f4f4"],"Raja Casablanca":["#00843d","#f4f4f4"],"Mamelodi Sundowns":["#fdd116","#00843d"],"Kaizer Chiefs":["#fdb913","#111111"],"Orlando Pirates":["#111111","#f4f4f4"],"Espérance de Tunis":["#e31b23","#fdd116"],
  "Peñarol":["#fdd116","#111111"],"Nacional":["#f4f4f4","#0033a0"],"Colo-Colo":["#f4f4f4","#111111"],"Universidad de Chile":["#0033a0","#e30613"],"Atlético Nacional":["#00843d","#f4f4f4"],"Millonarios":["#0033a0","#f4f4f4"],"Olimpia":["#f4f4f4","#111111"],"Cerro Porteño":["#0033a0","#e30613"],"Universitario":["#f2e8c9","#a6192e"],"Alianza Lima":["#0a2240","#f4f4f4"],"LDU Quito":["#f4f4f4","#0a2240"],"Barcelona SC":["#fdd116","#111111"],
  "Shakhtar Donetsk":["#f47920","#111111"],"Dinamo de Kiev":["#f4f4f4","#0052a5"],"Olympiacos":["#e30613","#f4f4f4"],"Red Bull Salzburgo":["#f4f4f4","#d6001c"],"Estrella Roja":["#e30613","#f4f4f4"],"Partizan":["#111111","#f4f4f4"],"Dinamo Zagreb":["#003b99","#f4f4f4"],"Hajduk Split":["#f4f4f4","#003b99"],"Zenit":["#0095da","#f4f4f4"],"Ferencváros":["#008c45","#f4f4f4"],"Young Boys":["#fdd116","#111111"],"FC Copenhague":["#f4f4f4","#002d72"],"Bodø/Glimt":["#fdd116","#111111"],"Malmö FF":["#7fb5e3","#f4f4f4"],"Legia Varsovia":["#f4f4f4","#008c45"],"Slavia Praga":["#e30613","#f4f4f4"],"Sparta Praga":["#8a1538","#f4f4f4"],"PAOK":["#111111","#f4f4f4"],"Panathinaikos":["#008c45","#f4f4f4"],"AEK Atenas":["#fdd116","#111111"],
  "Vissel Kobe":["#8b0021","#f4f4f4"],"Urawa Red Diamonds":["#e60012","#111111"],"Ulsan HD":["#0057a8","#fdd116"],"Jeonbuk Hyundai":["#00843d","#fdd116"],"Al-Sadd":["#f4f4f4","#111111"],"Al-Ain":["#6a2c91","#f4f4f4"],"Persepolis":["#e30613","#f4f4f4"],"Esteghlal":["#0033a0","#f4f4f4"],"Melbourne City":["#6cabdd","#f4f4f4"]
};

/* Parejas de clásicos/derbis para dar emoción a ciertos partidos */
DATA.derbies = [
  ["Real Madrid","FC Barcelona"],["Real Madrid","Atlético de Madrid"],["Sevilla FC","Real Betis"],["Athletic Club","Real Sociedad"],["Valencia CF","Villarreal CF"],["FC Barcelona","RCD Espanyol"],["Celta de Vigo","RC Deportivo"],
  ["Manchester United","Manchester City"],["Liverpool","Everton"],["Liverpool","Manchester United"],["Arsenal","Tottenham Hotspur"],["Chelsea","Arsenal"],["Newcastle United","Sunderland"],
  ["Inter","AC Milan"],["AS Roma","Lazio"],["Juventus","Inter"],["Juventus","Torino"],["Genoa","Sampdoria"],
  ["Borussia Dortmund","Schalke 04"],["Bayern Múnich","Borussia Dortmund"],["Hamburger SV","Werder Bremen"],
  ["Paris Saint-Germain","Olympique de Marsella"],["Olympique de Lyon","AS Saint-Étienne"],
  ["SL Benfica","Sporting CP"],["FC Porto","SL Benfica"],["Ajax","Feyenoord"],["Ajax","PSV"],["Celtic","Rangers"],
  ["Galatasaray","Fenerbahçe"],["Beşiktaş","Galatasaray"],["Olympiacos","Panathinaikos"],["Estrella Roja","Partizan"],["Dinamo Zagreb","Hajduk Split"],
  ["Boca Juniors","River Plate"],["Racing Club","Independiente"],["Flamengo","Fluminense"],["Corinthians","Palmeiras"],["Grêmio","Internacional"],
  ["Peñarol","Nacional"],["Colo-Colo","Universidad de Chile"],["Olimpia","Cerro Porteño"],["Universitario","Alianza Lima"],["Club América","Guadalajara"],["Al-Hilal","Al-Nassr"],["Al Ahly","Zamalek"],["Wydad Casablanca","Raja Casablanca"],["Kaizer Chiefs","Orlando Pirates"]
];

/* Nombres para los rivales por el Balón de Oro (todos ficticios) */
DATA.names = {
  lat:{f:"Lucas,Mateo,Thiago,Santiago,Nicolás,Diego,Álvaro,Pablo,Hugo,Iker,Rodrigo,Enzo,Julián,Facundo,Marcos,Adrián,Gonzalo,Martín,Joaquín,Bruno",l:"García,Martínez,Fernández,López,Rodríguez,Sánchez,Romero,Álvarez,Torres,Ruiz,Navarro,Molina,Castro,Ortega,Herrera,Vidal,Correa,Paredes,Méndez,Aguirre"},
  lus:{f:"João,Pedro,Gabriel,Vinícius,Rafael,Bruno,Diogo,Tiago,Matheus,Gustavo,Caio,Renan,Igor,Danilo,Luan",l:"Silva,Santos,Costa,Pereira,Oliveira,Souza,Lima,Ferreira,Carvalho,Gomes,Ribeiro,Almeida,Araújo,Moura,Barbosa"},
  fra:{f:"Lucas,Hugo,Théo,Nathan,Mathis,Rayan,Enzo,Adrien,Maxime,Yanis,Bastien,Aurélien,Malo,Noah",l:"Martin,Bernard,Dubois,Moreau,Laurent,Lefebvre,Girard,Fontaine,Mercier,Blanc,Garnier,Chevalier,Faure,Rousseau"},
  ang:{f:"Jack,Harry,Oliver,George,Mason,Callum,Reece,Kieran,Jordan,Tyler,Ethan,Liam,Noah,Archie",l:"Smith,Walker,Taylor,Wright,Cooper,Hughes,Bennett,Clarke,Turner,Hall,Morgan,Wood,Parker,Hayes"},
  ger:{f:"Leon,Jonas,Finn,Lukas,Niklas,Felix,Tim,Jan,Moritz,Florian,Julian,Paul,Elias,Malte",l:"Müller,Schmidt,Wagner,Becker,Hoffmann,Koch,Richter,Wolf,Schröder,Neumann,Braun,Krüger,Hartmann,Lange"},
  ita:{f:"Lorenzo,Federico,Alessandro,Matteo,Davide,Riccardo,Nicolò,Simone,Andrea,Giacomo,Tommaso,Samuele",l:"Rossi,Russo,Ferrari,Esposito,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Gallo,Conti,De Luca,Fontana"},
  ned:{f:"Daan,Sem,Lars,Bram,Thijs,Jesse,Ruben,Milan,Joey,Sven,Lucas,Stijn",l:"de Jong,Jansen,de Vries,Bakker,Visser,Smit,Meijer,de Boer,Mulder,de Groot,Bos,Vos,Peeters,Hendriks"},
  sla:{f:"Luka,Marko,Ivan,Nikola,Filip,Stefan,Dominik,Josip,Andrej,Petar,Jakub,Ondřej,Mykola,Artem",l:"Kovač,Horvat,Novak,Jovanović,Petrović,Nowak,Kowalski,Dvořák,Marić,Babić,Popović,Kozlov,Bondarenko,Lewicki"},
  nor:{f:"Erik,Magnus,Oscar,Emil,Isak,Viktor,Elias,Anton,Gustav,Sander,Mikkel,Oliver",l:"Hansen,Johansen,Larsen,Andersen,Nilsson,Lindqvist,Berg,Dahl,Holm,Strand,Lund,Solberg"},
  ara:{f:"Youssef,Hamza,Amine,Karim,Omar,Mohamed,Ilyas,Bilal,Sofiane,Nabil,Walid,Salem,Fahad,Ziad",l:"El Amrani,Benali,Haddad,Mansour,Saïdi,Bennani,Zaki,Khalil,Farouk,Hamdi,Belkacem,Toumi,Al-Qahtani,Al-Harbi"},
  waf:{f:"Kwame,Victor,Samuel,Emmanuel,Ibrahim,Moussa,Ismaël,Abdou,Chidi,Kofi,Seydou,Mamadou,Ousmane,Tunde",l:"Mensah,Diallo,Traoré,Koné,Okafor,Adeyemi,Ndiaye,Camara,Bamba,Osei,Eze,Sarr,Diop,Touré"},
  jpn:{f:"Hiroki,Takumi,Daichi,Ren,Sota,Kaito,Yuto,Riku,Haruto,Kenta",l:"Tanaka,Suzuki,Sato,Ito,Yamamoto,Nakamura,Kobayashi,Watanabe,Takahashi,Morita"},
  kor:{f:"Ji-ho,Seung-woo,Hyun-woo,Do-yeon,Min-seok,Jun-young,Tae-hoon,Sung-min",l:"Kim,Park,Lee,Choi,Jung,Kang,Yoon,Jang"},
  chn:{f:"Wei,Hao,Jun,Lei,Yang,Zhen,Bo,Tao",l:"Wang,Zhang,Liu,Chen,Yang,Zhao,Huang,Zhou"},
  rom:{f:"Andrei,Ionuț,Răzvan,Florin,Alexandru,Bogdan,Cristian,Dragoș",l:"Popescu,Ionescu,Stanciu,Marin,Dumitru,Radu,Munteanu,Constantin"},
  tur:{f:"Emre,Arda,Kerem,Burak,Mert,Oğuz,Cenk,Yusuf,Barış,Kaan",l:"Yılmaz,Kaya,Demir,Çelik,Şahin,Aydın,Öztürk,Arslan,Doğan,Koç"},
  gre:{f:"Giorgos,Kostas,Nikos,Dimitris,Vasilis,Christos,Petros,Thanasis",l:"Papadopoulos,Georgiou,Nikolaidis,Karagiannis,Vlachos,Pappas,Stathopoulos,Ioannou"},
  hun:{f:"Ádám,Bence,Dániel,Dominik,Levente,Márton,Roland,Zsolt",l:"Nagy,Kovács,Tóth,Szabó,Horváth,Varga,Kiss,Molnár"},
  alb:{f:"Arbër,Ermal,Kristjan,Elseid,Arlind,Besart,Ardian,Florent",l:"Hoxha,Berisha,Krasniqi,Gashi,Shala,Kelmendi,Dervishi,Bytyqi"},
  geo:{f:"Giorgi,Levan,Luka,Otar,Nika,Saba,Zurab,Davit",l:"Beridze,Kapanadze,Gelashvili,Lobjanidze,Kiteishvili,Mamardashvili,Tsitaishvili,Zivzivadze"},
  per:{f:"Mehdi,Ali,Reza,Amir,Saman,Milad,Hossein,Omid",l:"Rezaei,Karimi,Hosseini,Ahmadi,Mohammadi,Jahanbakhsh,Nouri,Ghasemi"}
};
/* Fútbol femenino: nombres (ficticios) por zona; si no hay apellidos propios se usan los masculinos */
DATA.namesF = {
  lat:{f:"Lucía,Martina,Sofía,Valentina,Paula,Alba,Carla,Laia,Irene,Aitana,Claudia,Jimena,Noelia,Daniela,Camila,Abril,Nerea,Olga,Marta,Ainhoa"},
  lus:{f:"Ana,Beatriz,Carolina,Inês,Mariana,Gabriela,Larissa,Letícia,Raquel,Débora,Tainá,Luana,Bianca,Jéssica,Kerolin"},
  fra:{f:"Léa,Chloé,Manon,Inès,Camille,Clara,Margaux,Maëlle,Eugénie,Delphine,Sakina,Amandine,Elisa,Romane"},
  ang:{f:"Ella,Lucy,Grace,Chloe,Lauren,Megan,Alessia,Georgia,Beth,Millie,Jess,Katie,Niamh,Hannah"},
  ger:{f:"Lena,Lea,Laura,Anna,Klara,Sophie,Jule,Giulia,Sydney,Lina,Marina,Svenja,Felicitas,Carlotta"},
  ita:{f:"Giulia,Sara,Martina,Valentina,Chiara,Arianna,Elena,Federica,Manuela,Benedetta,Cristiana,Aurora"},
  ned:{f:"Lieke,Vivianne,Jill,Daniëlle,Sherida,Esmee,Victoria,Romée,Lineth,Jackie,Damaris,Kerstin"},
  sla:{f:"Ana,Ivana,Petra,Marija,Katarina,Jelena,Tijana,Ewa,Natalia,Kateřina,Olena,Daryna,Klara,Lucija",l:"Kovač,Horvat,Novak,Jovanović,Petrović,Nowak,Kowalska,Dvořáková,Marić,Babić,Popović,Kozlova,Bondarenko,Lewicka"},
  nor:{f:"Ingrid,Maren,Frida,Guro,Caroline,Hanna,Fridolina,Pernille,Sofie,Amalie,Signe,Elin"},
  ara:{f:"Ghizlane,Sanaa,Yasmin,Nouhaila,Fatima,Salma,Rania,Amira,Leila,Nadia,Ines,Sara,Hajar,Aya"},
  waf:{f:"Asisat,Rasheedat,Chiamaka,Ajara,Michelle,Gabrielle,Grace,Fatoumata,Aminata,Esther,Hannah,Mercy,Thembi,Refiloe"},
  jpn:{f:"Yui,Hina,Saki,Mana,Riko,Fuka,Aoba,Hikaru,Maika,Momoko"},
  kor:{f:"Ji-so,Min-a,Seo-yeon,Ga-eun,Hye-ri,Yu-na,Su-bin,Eun-ji"},
  chn:{f:"Shuang,Lin,Yu,Xin,Jing,Mei,Yan,Li"},
  rom:{f:"Andreea,Ioana,Maria,Elena,Alexandra,Bianca,Cristina,Daria",l:"Popescu,Ionescu,Stanciu,Marin,Dumitru,Radu,Munteanu,Constantin"},
  tur:{f:"Elif,Zeynep,Ece,Melike,Busem,Derya,Kader,Ebru,İpek,Selin"},
  gre:{f:"Maria,Eleni,Katerina,Sofia,Anastasia,Despoina,Georgia,Vasiliki",l:"Papadopoulou,Georgiou,Nikolaidou,Karagianni,Vlachou,Pappa,Stathopoulou,Ioannou"},
  hun:{f:"Anna,Réka,Zsanett,Henrietta,Fanni,Dóra,Lilla,Viktória"},
  alb:{f:"Arbëra,Elona,Megi,Kristina,Era,Blerta,Arta,Fjolla"},
  geo:{f:"Nino,Mariam,Salome,Ana,Tamar,Natia,Elene,Ketevan",l:"Beridze,Kapanadze,Gelashvili,Lobjanidze,Kiteishvili,Mamardashvili,Tsitaishvili,Zivzivadze"},
  per:{f:"Zahra,Maryam,Fatemeh,Niloufar,Sara,Shirin,Parisa,Neda"}
};
/* Fútbol femenino: nivel de las selecciones (las demás, el masculino − 7) */
DATA.natF = {US:90,ES:91,ENG:89,DE:88,FR:87,SE:87,BR:85,JP:85,NL:84,CA:83,AU:82,NO:81,DK:80,IT:80,KP:78,CN:77,KR:77,IS:77,BE:77,AT:77,CH:76,PT:77,CO:77,IE:76,SCO:76,
  MX:75,NG:75,PL:74,FI:74,CZ:73,WAL:73,AR:73,NZ:73,UA:71,ZA:72,CR:71,JM:71,MA:72,CL:71,PY:69,VE:69,PH:67,VN:67,TH:66,HT:67,PA:66,GH:67,CM:68,ZM:68,TW:66,
  RS:68,HR:66,SI:66,HU:67,RO:66,SK:65,GR:65,TR:64,UY:65,EC:65,PE:63,BO:58,SA:52,QA:50,AE:52};
DATA.namePool = {
  ES:"lat",AR:"lat",UY:"lat",CO:"lat",CL:"lat",PE:"lat",EC:"lat",PY:"lat",VE:"lat",BO:"lat",MX:"lat",CR:"lat",PA:"lat",HN:"lat",SV:"lat",GT:"lat",NI:"lat",CU:"lat",DO:"lat",PR:"lat",
  BR:"lus",PT:"lus",AO:"lus",MZ:"lus",CV:"lus",GW:"lus",ST:"lus",
  FR:"fra",BE:"fra",CH:"fra",LU:"fra",HT:"fra",CI:"waf",SN:"waf",CM:"waf",ML:"waf",GN:"waf",BF:"waf",GA:"fra",CD:"waf",CG:"waf",
  ENG:"ang",SCO:"ang",WAL:"ang",NIR:"ang",IE:"ang",US:"ang",CA:"ang",AU:"ang",NZ:"ang",JM:"ang",TT:"ang",
  DE:"ger",AT:"ger",LI:"ger",NL:"ned",SR:"ned",CW:"ned",IT:"ita",SM:"ita",MT:"ita",
  HR:"sla",RS:"sla",PL:"sla",CZ:"sla",SK:"sla",SI:"sla",UA:"sla",RU:"sla",BA:"sla",ME:"sla",MK:"sla",BG:"sla",BY:"sla",
  NO:"nor",SE:"nor",DK:"nor",IS:"nor",FI:"nor",FO:"nor",
  MA:"ara",DZ:"ara",TN:"ara",EG:"ara",LY:"ara",SA:"ara",QA:"ara",AE:"ara",IQ:"ara",JO:"ara",SY:"ara",LB:"ara",PS:"ara",KW:"ara",OM:"ara",BH:"ara",YE:"ara",MR:"ara",
  NG:"waf",GH:"waf",ZA:"waf",KE:"waf",TZ:"waf",UG:"waf",ZM:"waf",ZW:"waf",
  JP:"jpn",KR:"kor",KP:"kor",CN:"chn",TW:"chn",HK:"chn",VN:"chn",TH:"chn",
  RO:"rom",MD:"rom",TR:"tur",AZ:"tur",GR:"gre",CY:"gre",HU:"hun",AL:"alb",XK:"alb",GE:"geo",AM:"geo",IR:"per",AF:"per",TJ:"per"
};
DATA.confPool = {UEFA:"ang",CONMEBOL:"lat",CONCACAF:"lat",CAF:"waf",AFC:"ara",OFC:"ang"};

/* Torneos de selecciones: año inicial y cada cuántos años, anfitriones conocidos */
DATA.natTournaments = [
  {k:"WC",n:"Mundial",start:2030,every:4,conf:"ALL",size:48,groups:12,thirds:8,hosts:{2030:["ES","PT","MA","AR","UY","PY"],2034:["SA"]},
   slots:{UEFA:16,CAF:9,AFC:8,CONMEBOL:6,CONCACAF:6,OFC:1}},
  {k:"EURO",n:"Eurocopa",start:2028,every:4,conf:"UEFA",size:24,groups:6,thirds:4,hosts:{2028:["ENG","SCO","WAL","IE"],2032:["IT","TR"]}},
  {k:"CA",n:"Copa América",start:2028,every:4,conf:"CONMEBOL",size:16,groups:4,thirds:0,noQual:true,guests:"CONCACAF"},
  {k:"AFCON",n:"Copa África",start:2027,every:2,conf:"CAF",size:24,groups:6,thirds:4},
  {k:"ASIAN",n:"Copa Asiática",start:2027,every:4,conf:"AFC",size:24,groups:6,thirds:4,hosts:{2027:["SA"]}},
  {k:"GOLD",n:"Copa Oro",start:2027,every:2,conf:"CONCACAF",size:16,groups:4,thirds:0},
  {k:"OFCN",n:"Copa de Naciones OFC",start:2028,every:4,conf:"OFC",size:8,groups:2,thirds:0},
  {k:"NLF",n:"Nations League",start:2027,every:2,conf:"UEFA",size:4,groups:0,special:"nlf"},
  {k:"OLY",n:"Juegos Olímpicos",start:2028,every:4,conf:"ALL",size:16,groups:4,thirds:0,u23:true,hosts:{2028:["US"],2032:["AU"]},
   slots:{UEFA:4,CONMEBOL:2,CONCACAF:2,AFC:3,CAF:3,OFC:1}}
];

/* Fútbol femenino: torneos de selecciones con sus fechas y sedes reales (Mundial 2027 Brasil, Eurocopa 2029 Alemania…) */
DATA.natTournamentsF = [
  {k:"WC",n:"Mundial",start:2027,every:4,conf:"ALL",size:32,groups:8,thirds:0,hosts:{2027:["BR"],2031:["US","MX","CR","JM"],2035:["ENG","SCO","WAL","NIR"]},
   slots:{UEFA:12,AFC:6,CAF:4,CONMEBOL:4,CONCACAF:5,OFC:1}},
  {k:"EURO",n:"Eurocopa",start:2029,every:4,conf:"UEFA",size:16,groups:4,thirds:0,hosts:{2029:["DE"]}},
  {k:"CA",n:"Copa América",start:2029,every:4,conf:"CONMEBOL",size:8,groups:2,thirds:0,noQual:true},
  {k:"AFCON",n:"Copa África",start:2028,every:2,conf:"CAF",size:12,groups:3,thirds:2},
  {k:"ASIAN",n:"Copa Asiática",start:2029,every:4,conf:"AFC",size:12,groups:3,thirds:2},
  {k:"GOLD",n:"Copa Oro",start:2029,every:4,conf:"CONCACAF",size:12,groups:3,thirds:2},
  {k:"OFCN",n:"Copa de Naciones OFC",start:2027,every:4,conf:"OFC",size:8,groups:2,thirds:0},
  {k:"NLF",n:"Nations League",start:2027,every:2,conf:"UEFA",size:4,groups:0,special:"nlf"},
  {k:"OLY",n:"Juegos Olímpicos",start:2028,every:4,conf:"ALL",size:12,groups:3,thirds:2,hosts:{2028:["US"],2032:["AU"]},
   slots:{UEFA:3,CONMEBOL:2,CONCACAF:2,AFC:2,CAF:2,OFC:1}}
];

/* Posiciones: código, nombre, grupo (POR/DEF/MED/DEL) */
DATA.positions = [
  ["POR","Portero","POR"],["LD","Lateral derecho","DEF"],["DFC","Defensa central","DEF"],["LI","Lateral izquierdo","DEF"],
  ["MCD","Mediocentro defensivo","MED"],["MC","Mediocentro","MED"],["MD","Interior derecho","MED"],["MI","Interior izquierdo","MED"],["MCO","Mediapunta","MED"],
  ["ED","Extremo derecho","DEL"],["EI","Extremo izquierdo","DEL"],["DC","Delantero centro","DEL"]
];
