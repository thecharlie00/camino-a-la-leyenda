/* names.js — generador de nombres (parche 2.6).
   Tablas mucho más amplias y separadas por país/región, con combinatoria ponderada
   y memoria de lo ya usado para que no se repitan apellidos ni nombres completos. */
(function () {
  function add(k, f, l) { var o = DATA.names[k] || {f: "", l: ""}; DATA.names[k] = {f: join(o.f, f), l: join(o.l, l)}; }
  function addF(k, f, l) { var o = DATA.namesF[k] || {f: ""}; var r = {f: join(o.f, f)}; if (l || o.l) r.l = join(o.l || "", l || ""); DATA.namesF[k] = r; }
  function join(a, b) {
    var seen = {}, out = [];
    (a ? a.split(",") : []).concat(b ? b.split(",") : []).forEach(function (x) { x = x.trim(); if (x && !seen[x]) { seen[x] = 1; out.push(x); } });
    return out.join(",");
  }

  /* ---- España (castellanos, catalanes, vascos, gallegos, andaluces) ---- */
  DATA.names.esp = {
    f: "Pablo,Hugo,Álvaro,Iker,Adrián,Sergio,Javier,Daniel,Raúl,Marcos,Rubén,Alejandro,Carlos,Jorge,Manuel,Óscar,Víctor,Gonzalo,Unai,Aitor,Ander,Mikel,Asier,Jon,Oier,Gorka,Pol,Marc,Arnau,Jordi,Oriol,Xavi,Biel,Èric,Roger,Aleix,Xabier,Brais,Iago,Antón,Borja,Nacho,Fran,Dani,Rafa,Miguel,Ángel,Héctor,Samuel,Isaac,Diego,Mario,Lucas,Mateo,Martín,Joel,Nico,Rodrigo,Bruno,Izan,Eloy,Kike,Chema,Quique,Santi,Jaime,Germán,Alberto,Luis,Joan,Guillem,Nil,Ian,Leo",
    l: "García,Martínez,López,Sánchez,Pérez,Gómez,Martín,Jiménez,Hernández,Ruiz,Díaz,Moreno,Muñoz,Álvarez,Romero,Gutiérrez,Alonso,Navarro,Torres,Domínguez,Ramos,Vázquez,Gil,Serrano,Blanco,Molina,Suárez,Morales,Ortega,Delgado,Castro,Ortiz,Rubio,Marín,Sanz,Iglesias,Núñez,Medina,Garrido,Cortés,Castillo,Santos,Lozano,Cano,Prieto,Méndez,Cruz,Gallego,León,Márquez,Herrera,Peña,Flores,Cabrera,Campos,Vega,Fuentes,Diez,Caballero,Reyes,Aguilar,Pascual,Santana,Herrero,Montero,Lorenzo,Hidalgo,Giménez,Ibáñez,Ferrer,Durán,Santiago,Benítez,Mora,Vicente,Vargas,Arias,Carmona,Crespo,Román,Pastor,Soto,Sáez,Velasco,Moya,Soler,Parra,Esteban,Gallardo,Rojas,Pardo,Franco,Espinosa,Izquierdo,Lara,Rivas,Silva,Rivera,Casado,Arroyo,Redondo,Camacho,Rey,Vera,Otero,Luque,Galán,Montes,Ríos,Sierra,Segura,Carrillo,Marcos,Soriano,Mendoza,Robles,Bernal,Vila,Valero,Palacios,Pons,Vallejo,Benito,Escobar,Cuesta,Plaza,Toledo,Nieto,Rosa,Guillén,Ortín,Puig,Roca,Ferrán,Casals,Riera,Sala,Batlle,Rovira,Bosch,Planas,Pujol,Masip,Comas,Vives,Mas,Font,Serra,Coll,Badia,Grau,Oliva,Bonet,Llorente,Etxeberria,Agirre,Goikoetxea,Arrizabalaga,Zubizarreta,Iturraspe,Larrazabal,Urkiza,Bengoetxea,Elustondo,Mendizabal,Olabarria,Aranburu,Gorostiza,Lekue,Iraola,Zabala,Arteta,Otxoa,Castelao,Pazos,Varela,Fraga,Barreiro,Lago,Souto,Rial,Losada,Couto,Seoane,Carballo,Outeiro,Bouzas,Rioboo,Mosquera,Freire,Trigo,Andújar,Calderón,Toral,Expósito,Valverde,Escudero,Collado,Maroto,Baena,Cordero,Quintana,Requena"
  };
  /* ---- Río de la Plata y Paraguay (mucho apellido italiano) ---- */
  DATA.names.rio = {
    f: "Santiago,Facundo,Thiago,Matías,Agustín,Nahuel,Franco,Valentín,Joaquín,Tomás,Ezequiel,Gonzalo,Leandro,Maximiliano,Emiliano,Nicolás,Federico,Lucas,Bautista,Benjamín,Ignacio,Gastón,Rodrigo,Julián,Enzo,Mauro,Exequiel,Alexis,Cristian,Brian,Kevin,Germán,Fabricio,Juan Cruz,Juan Manuel,Gianluca,Thiago,Lisandro,Marcos,Elías,Giuliano,Darío,Walter,Hernán,Sebastián,Diego,Sergio,Rubén,Braian,Ramiro,Iván,Uriel,Tiziano,Bruno,Mateo,Felipe,Gerónimo,Santino,Luciano",
    l: "González,Rodríguez,Fernández,López,Martínez,Gómez,Pérez,Romero,Sosa,Álvarez,Ruiz,Benítez,Acosta,Medina,Herrera,Aguirre,Giménez,Molina,Castro,Ortiz,Silva,Rojas,Núñez,Ledesma,Domínguez,Ríos,Ferreyra,Godoy,Paz,Cáceres,Correa,Vera,Ojeda,Ramírez,Villalba,Cabrera,Moreno,Peralta,Ponce,Figueroa,Quiroga,Luna,Coronel,Arias,Barrios,Maidana,Cardozo,Ayala,Bogado,Duarte,Ortigoza,Insaurralde,Zárate,Garay,Galeano,Benegas,Rossi,Bianchi,Ferrari,Russo,Colombo,Romano,Gallo,Conti,Costa,Mancini,Lombardi,Moretti,Barbieri,Fontana,Rinaldi,Caruso,Ferraro,Marino,Greco,Bruno,Pellegrini,Palacios,Battaglia,Varela,Olivera,Viera,Suárez,Píriz,Ottonello,Spinelli,Lucero,Barco,Gaitán,Montoya,Escobar,Rolón,Vargas,Torres,Iturbe,Ferrero,Caballero,Bertolo,Cuesta,Funes,Sotelo,Arévalo"
  };
  /* ---- Andes y Caribe sudamericano ---- */
  DATA.names.and = {
    f: "Juan David,Juan Camilo,Santiago,Sebastián,Andrés,Felipe,Mateo,Daniel,Kevin,Jhon,Cristian,Óscar,Brayan,Jefferson,Wilmar,Yeison,Luis,Carlos,Jorge,Édison,Piero,Gianluca,Renato,Christian,Yoshimar,Alexis,Arturo,Gary,Charles,Eduardo,Marcelo,Ángel,Diego,Darwin,Yangel,Salomón,Jhon Jader,Richard,Rafael,Josef,Yordan,Erick,Junior,Mauricio,Jhojan,Jaminton,Yaser,Deiver,Miguel,Iván",
    l: "Rodríguez,Gómez,González,Martínez,López,García,Hernández,Díaz,Pérez,Ramírez,Torres,Rojas,Vargas,Moreno,Jiménez,Muñoz,Castro,Ortiz,Ruiz,Suárez,Mendoza,Quintero,Arias,Murillo,Borja,Valencia,Preciado,Angulo,Cortés,Mosquera,Palacios,Córdoba,Riascos,Renteria,Banguera,Montaño,Arboleda,Ibarra,Méndez,Sarmiento,Cifuentes,Chalá,Tapia,Callens,Zambrano,Abram,Peña,Flores,Polo,Carrillo,Quispe,Mamani,Huamán,Chávez,Condori,Vaca,Saucedo,Cuéllar,Justiniano,Herrera,Osorio,Alarcón,Echeverría,Carmona,Leiva,Contreras,Fuenzalida,Sepúlveda,Valenzuela,Tapia,Salas,Reyes,Escobar,Urrutia,Yepes,Uribe,Restrepo,Zuluaga,Londoño,Echeverri,Cardona,Ospina,Arango,Betancur,Gaviria"
  };
  /* ---- México, Centroamérica y Caribe ---- */
  DATA.names.mex = {
    f: "Santiago,Diego,Raúl,Héctor,Andrés,Jesús,Carlos,Luis,Jorge,Uriel,Erick,César,Alexis,Roberto,Julián,Johan,Kevin,Gerardo,Israel,Jonathan,Alan,Rogelio,Javier,Guillermo,Ángel,Fernando,Emilio,Marcelo,Brian,Obed,Gilberto,Aníbal,Bryan,Joel,Celso,Francisco,Yael,Ozziel,Efraín,Jairo,Rodolfo,Alberto,Eduardo,Ulises,Armando,Esteban,Óscar,Gabriel,Mauricio,Germán,Adalberto,Romell,Alberth,Kervin",
    l: "Hernández,García,Martínez,López,González,Pérez,Rodríguez,Sánchez,Ramírez,Cruz,Flores,Gómez,Morales,Vázquez,Reyes,Jiménez,Torres,Díaz,Gutiérrez,Ruiz,Mendoza,Aguilar,Ortiz,Moreno,Castillo,Romero,Álvarez,Méndez,Chávez,Rivera,Juárez,Ramos,Domínguez,Herrera,Medina,Castro,Guzmán,Fernández,Muñoz,Salazar,Rojas,Contreras,Luna,Ortega,Estrada,Bautista,Cortés,Soto,Alvarado,Vargas,Lozano,Pineda,Orozco,Moreno,Márquez,Araujo,Vega,Montes,Gallardo,Córdova,Gimenez,Jurado,Talavera,Acevedo,Arteaga,Sepúlveda,Quiñones,Zendejas,Valdez,Borges,Ruiz,Duarte,Elizondo,Fajardo,Brenes,Lozano,Palma,Figueroa,Godoy,Murillo,Fariña,Waterman,Cummings,Pimentel,Bello,Quintero,Peralta,Tejeda,Grullón,Batista,Mancebo,Polanco"
  };
  /* ---- Brasil ---- */
  DATA.names.bra = {
    f: "João,Pedro,Gabriel,Vinícius,Rafael,Bruno,Matheus,Gustavo,Caio,Renan,Igor,Danilo,Luan,Lucas,Thiago,Éder,Wendell,Guilherme,Felipe,Leonardo,Vitor,Rodrigo,Diego,Everton,Douglas,Hugo,Arthur,André,Murilo,Yan,Kaio,Wesley,Ruan,Cauã,Davi,Breno,Samuel,Jean,Alex,Alan,Willian,Paulinho,Juninho,Zé Ricardo,Léo,Gerson,Pablo,Ronald,Kauã,Vitinho,Ygor,Lázaro,Talles,Matheuzinho",
    l: "Silva,Santos,Oliveira,Souza,Lima,Pereira,Ferreira,Costa,Rodrigues,Almeida,Nascimento,Alves,Carvalho,Araújo,Ribeiro,Gomes,Martins,Rocha,Barbosa,Dias,Moreira,Cardoso,Teixeira,Correia,Mendes,Nunes,Soares,Vieira,Monteiro,Cavalcanti,Moura,Freitas,Campos,Pinto,Machado,Batista,Lopes,Fernandes,Ramos,Castro,Andrade,Melo,Reis,Barros,Rezende,Fonseca,Sampaio,Guimarães,Brandão,Siqueira,Coelho,Peixoto,Farias,Aguiar,Tavares,Bezerra,Xavier,Queiroz,Magalhães,Paiva,Prates,Jesus,Bento,Danilo,Fagner,Pedrosa,Veiga,Fabrício,Sávio,Gerson,Lucena,Viana,Damasceno,Brito,Fontes,Bastos,Cunha,Medeiros,Leite,Lacerda,Pacheco,Dantas,Toledo,Bittencourt,Assunção"
  };
  /* ---- Portugal y lusófonos de África ---- */
  DATA.names.por = {
    f: "João,Diogo,Tiago,Bernardo,Rafael,Gonçalo,Francisco,Nuno,Rui,Pedro,André,Ricardo,Bruno,Nélson,Fábio,Renato,Daniel,Miguel,Duarte,Tomás,Afonso,Martim,Rodrigo,Henrique,Gustavo,Simão,Hélder,Sérgio,Paulo,Luís,Hugo,Carlos,Samuel,Mateus,Leandro,Edgar,Jota,Dany,Zé,Leonel,Nanu,Stopira,Garry,Ryan,Gelson,Fredy,Mabululu,Gilberto",
    l: "Silva,Santos,Ferreira,Pereira,Oliveira,Costa,Rodrigues,Martins,Jesus,Sousa,Fernandes,Gonçalves,Gomes,Lopes,Marques,Alves,Almeida,Ribeiro,Pinto,Carvalho,Teixeira,Moreira,Correia,Mendes,Nunes,Soares,Vieira,Monteiro,Cardoso,Rocha,Raposo,Neves,Coelho,Cruz,Cunha,Pires,Ramos,Reis,Simões,Antunes,Matos,Fonseca,Morais,Machado,Freitas,Araújo,Barbosa,Tavares,Loureiro,Leite,Guerreiro,Dias,Neto,Sá,Varela,Brito,Fortes,Lima,Tavares,Lopes,Évora,Mendes,Delgado,Andrade,Dju,Embaló,Baldé,Djaló,Camará"
  };
  /* ---- ampliaciones del resto ---- */
  add("fra", "Eduardo,Jules,Benjamin,Théo,William,Ibrahima,Marcus,Kingsley,Moussa,Warren,Bradley,Rayan,Mathys,Wesley,Jonathan,Clément,Valentin,Florian,Romain,Quentin,Corentin,Kévin,Loïc,Benoît,Thibault,Lilian,Nolan,Évan,Killian,Sacha,Léo,Gabin,Arthur,Raphaël,Louis,Mattéo,Tom,Axel,Baptiste,Rémi,Alexis,Cyril",
    "Petit,Durand,Leroy,Roux,David,Bertrand,Morel,Simon,Michel,Lefèvre,Lambert,Bonnet,François,Legrand,Garcia,Perrin,Robin,Clément,Morin,Nicolas,Henry,Roussel,Mathieu,Gautier,Masson,Marchand,Duval,Denis,Dumont,Marie,Lemaire,Noël,Meyer,Dufour,Brun,Blanchard,Giraud,Joly,Rivière,Lucas,Brunet,Gaillard,Barbier,Arnaud,Martinez,Gérard,Roche,Renard,Schmitt,Roy,Leroux,Colin,Vidal,Caron,Picard,Roger,Fabre,Aubert,Lemoine,Renaud,Dumas,Lacroix,Olivier,Philippe,Bourgeois,Pierre,Benoît,Rey,Leclerc,Hernandez,Fofana");
  add("ang", "James,Thomas,William,Charlie,Alfie,Joshua,Daniel,Samuel,Joe,Ben,Luke,Ryan,Adam,Marcus,Phil,Conor,Ollie,Levi,Morgan,Aaron,Lewis,Scott,Craig,Kieran,Billy,Ross,Jamie,Lewis,Andrew,Stuart,Ciaran,Seamus,Darragh,Cian,Evan,Owen,Rhys,Dylan,Gareth,Brennan,Christian,Tyler,Josh,Cameron,Sam",
    "Johnson,Brown,Jones,Williams,Davies,Evans,Thomas,Roberts,Robinson,Thompson,Green,Lewis,Harris,Martin,Jackson,Clarke,Edwards,Wood,Hill,Moore,Mitchell,Ward,Watson,Phillips,Davis,Bailey,Bell,Carter,Allen,Young,King,Scott,Collins,Price,Fletcher,Gray,Webb,Barnes,Mills,Holmes,Rose,Dixon,Lloyd,Butler,Gordon,Adams,Christie,Ferguson,Moore,Brooks,Doherty,Knight,Robinson,Turner,Davies,David,Irvine,Goodwin,Ryan");
  add("ger", "Joshua,Kai,Thomas,Manuel,Antonio,Robin,Nico,Florian,Maximilian,David,Benjamin,Pascal,Chris,Deniz,Aleksandar,Christoph,Konrad,Marcel,Dominik,Kevin,Lennart,Ole,Tom,Luca,Noah,Ben,Henri,Mats,Emre,Waldemar,Angelo,Yann,Malick,Nadiem,Jonathan,Mergim,Lukas,Stefan,Marko,Sebastian,Philipp,Matthias,Tobias,Alexander,Marvin",
    "Schneider,Fischer,Weber,Meyer,Schulz,Bauer,Klein,Schwarz,Zimmermann,Schmitt,Hofmann,Schmid,Krause,Meier,Lehmann,Huber,Kaiser,Fuchs,Peters,Lang,Scholz,Möller,Weiß,Jung,Hahn,Keller,Vogel,Friedrich,Günther,Frank,Berger,Winkler,Roth,Beck,Lorenz,Baumann,Franke,Albrecht,Schuster,Simon,Ludwig,Böhm,Winter,Kraus,Martin,Schumacher,Krämer,Vogt,Stein,Jäger,Otto,Sommer,Groß,Seidel,Heinrich,Brandt,Haas,Schreiber,Graf,Dietrich,Ziegler,Kuhn,Pohl,Engel,Horn,Busch,Bergmann,Thomas,Voigt,Sauer,Arnold,Wolff,Pfeiffer,Tah,Raum,Sommer");
  add("ita", "Nicolò,Federico,Gianluca,Leonardo,Sandro,Manuel,Mattia,Giovanni,Raoul,Ciro,Domenico,Stefano,Francesco,Marco,Luca,Pietro,Gabriele,Emanuele,Daniele,Michele,Salvatore,Vincenzo,Antonio,Christian,Giorgio,Alberto,Fabio,Roberto,Paolo,Filippo,Edoardo,Diego,Mirko,Gennaro,Cristiano,Niccolò,Kevin,Samuele,Alessio,Jacopo,Mattéo,Dario,Bryan",
    "Bruno,Gallo,Costa,Giordano,Mancini,Rizzo,Lombardi,Moretti,Barbieri,Fontana,Santoro,Mariani,Rinaldi,Caruso,Ferrara,Galli,Martini,Leone,Longo,Gentile,Vitale,Lombardo,Serra,Coppola,De Santis,D'Angelo,Marchetti,Parisi,Villa,Conte,Ferraro,Ferri,Fabbri,Bianco,Marini,Grasso,Valentini,Messina,Sala,De Angelis,Gatti,Pellegrini,Palumbo,Sanna,Farina,Rizzi,Monti,Cattaneo,Morelli,Amato,Silvestri,Mazza,Testa,Grassi,Pellegrino,Carbone,Giuliani,Benedetti,Barone,Rossetti,Caputo,Montanari,Guerra,Palmieri,Bernardi,Martino,Fiore,De Rosa,Ferretti,Bellini,Basile,Riva,Donati,Piras,Vitali,Battaglia,Sartori,Neri,Costantini,Milani,Pagano,Ruggiero,Sorrentino,D'Amico,Orlando,Damico,Negri,Ricci");
  add("ned", "Cody,Xavi,Denzel,Nathan,Matthijs,Jurriën,Tijjani,Ryan,Micky,Jeremie,Teun,Steven,Wout,Donyell,Joshua,Ian,Justin,Kenneth,Myron,Quinten,Mats,Tim,Noa,Jorrel,Calvin,Kees,Jasper,Thom,Gijs,Floris,Siem,Luuk,Niek,Bart,Pieter,Jens,Dirk,Arne,Wouter,Koen,Olivier,Youri,Kevin,Mike,Jurgen,Hans,Charles,Leandro,Brian,Jan,Amadou,Youri,Arthur",
    "Lang,de Wit,Mulder,Dekker,Dijkstra,Vermeulen,van den Berg,van Dam,Willems,Brouwer,Schouten,Hoekstra,Kok,Huisman,Prins,van Leeuwen,Post,Kuipers,Veenstra,Kramer,van der Meer,Blom,Wouters,Jacobs,Maes,Claes,Goossens,Wuyts,Mertens,Lemmens,Verstraete,Hendrickx,Janssens,Smets");
  add("sla", "Aleksandar,Sergej,Dejan,Mateo,Lovro,Borna,Mario,Ivan,Ante,Martin,Kristijan,Robert,Piotr,Kamil,Jan,Wojciech,Bartosz,Sebastian,Przemysław,Patrik,Tomáš,Vladimír,Ladislav,Milan,Ľubomír,Stanislav,Juraj,Roman,Oleksandr,Andriy,Vitaliy,Illia,Heorhiy,Mykhailo,Ruslan,Dmytro,Edin,Ermedin,Haris,Amar,Elmin,Benjamin,Nemanja,Miloš,Strahinja,Uroš,Lazar,Vanja,Igor,Jan,Benjamin,Žan,Timi,Adam,Domagoj,Nikola",
    "Petković,Pavlović,Lukić,Živković,Wójcik,Kamiński,Lis,Kowalczyk,Wiśniewski,Wójtowicz,Zając,Krawczyk,Mazur,Kaczmarek,Král,Vlček,Duda,Šešum,Stojanović");
  add("nor", "Martin,Alexander,Sander,Kristoffer,Fredrik,Jonas,Mathias,Andreas,Henrik,Tobias,Jørgen,Ola,Morten,Kasper,Rasmus,Christian,Mikkel,Jesper,Victor,Joachim,Simon,Andreas,Jonas,Patrik,Dejan,Albin,Robin,Ludwig,Hugo,Linus,Teemu,Lukas,Jere,Glen,Leo,Joel,Ari,Albert,Rúnar,Aron",
    "Berge,Ajer,Pedersen,Wolfe,Christensen,Andersen,Wind,Poulsen,Bah,Kristiansen,Olsson,Karlsson,Svensson,Gustafsson,Pettersson,Jonsson,Persson,Eriksson,Johansson,Mikkelsen,Kristensen,Jensen,Nielsen,Rasmussen,Sørensen,Madsen,Kamara,Lod,Gudmundsson,Haraldsson,Thórarinsson,Halldórsson,Gunnarsson");
  add("ara", "Sofyan,Azzedine,Noussair,Romain,Yassine,Nayef,Abde,Brahim,Ismaël,Ramy,Houssem,Aïssa,Saïd,Wahbi,Ellyes,Hannibal,Montassar,Aymen,Mostafa,Emam,Akram,Almoez,Hassan,Abdulaziz,Salem,Firas,Saud,Feras,Ayman,Tarek,Hussein,Mahmoud,Ahmed,Khaled,Abdullah,Ibrahim,Anas,Hamdan,Ali,Zakaria,Oussama,Adam,Eliesse,Rayan",
    "Diaz,Abdi,Fathy,Afifi,Ali,Hassan,Al-Rawi,Al-Malki,Al-Hamdan,Al-Bulayhi,Bahbri,Abdelhamid,Mansouri,Benchaa,Hamidi,Rahimi,Brahimi,Riad,Benali,Zouhri,Lamrani,Bouazza");
  add("waf", "Edouard,Nicolas,Pape,Lamine,Habib,Victor,Wilfred,Alex,Samuel,Calvin,Ola,Frank,Thomas,Mohammed,Jordan,André,Franck,Simon,Sébastien,Nicolas,Vincent,Bryan,Karl,Yves,Amadou,Yves,Lassine,Mohamed,Fashion,Marshall,Tino",
    "Mendy,Gueye,Sarr,Jackson,Diallo,Dieng,Ndiaye,Cissé,Sow,Faye,Seck,Ba,Fall,Niang,Kouyaté,Simon,Williams,Abu,Fofana,Williams,Foster,Sakala,Bamba,Coulibaly,Keita,Kamara,Sylla");

  /* nombres femeninos para los pools nuevos */
  addF("esp", "Irene,Patri,Olga,Laia,Claudia,Teresa,Esther,Lucía,Marta,Ainhoa,Nerea,Leire,Maite,Eva,Andrea,Sheila,Alba,Vicky,Inma,María,Paula,Carla,Martina,Sara,Noelia,Rocío,Elena,Celia,Julia,Natalia,Ane,Uxue,Iraia,Bárbara,Nuria,Jana,Aina,Berta,Lola");
  addF("rio", "Florencia,Mariana,Romina,Lorena,Milagros,Camila,Agustina,Sofía,Micaela,Aldana,Vanina,Laurina,Eliana,Paulina,Belén,Lucía,Valentina,Josefina,Antonella,Rocío,Jessica,Dahiana,Fiorella,Carolina,Yoana,Pamela,Celeste,Natalia");
  addF("and", "Daniela,Catalina,Manuela,Lorena,Ana María,Carolina,Gabriela,Valeria,Isabella,Karen,Liana,Christiane,Claudia,Fernanda,Javiera,Yanara,Karen,María José,Daniela,Michelle");
  addF("mex", "Rebeca,Jacqueline,Alison,Lizbeth,Scarlett,Montserrat,Diana,Stephany,Nicole,Katty,Greta,Lucero,Karla,Daniela,Fernanda,Ximena,Raquel,Shirley,Priscila,Melissa,Rosalía,María Paula,Wendy,Yamileth,Tatiana");
  addF("bra", "Marta,Antônia,Rafaelle,Lauren,Gabi,Adriana,Bia,Ludmila,Duda,Ary,Lorena,Jheniffer,Priscila,Tarciane,Angelina,Luana,Bruna,Letícia,Natália,Fernanda,Camila,Thaís,Aline,Júlia,Vitória");
  addF("por", "Tatiana,Ana,Andreia,Diana,Fátima,Lúcia,Inês,Joana,Mariana,Catarina,Beatriz,Telma,Francisca,Rita,Sara,Raquel,Carolina,Patrícia,Mónica,Sílvia,Matilde");

  /* qué pool usa cada país */
  var MAP = {ES: "esp", AR: "rio", UY: "rio", PY: "rio", CO: "and", PE: "and", EC: "and", VE: "and", BO: "and", CL: "and",
    MX: "mex", CR: "mex", PA: "mex", HN: "mex", SV: "mex", GT: "mex", NI: "mex", CU: "mex", DO: "mex", PR: "mex",
    BR: "bra", PT: "por", AO: "por", MZ: "por", CV: "por", GW: "por", ST: "por"};
  for (var c in MAP) DATA.namePool[c] = MAP[c];
  /* pool «padre» por si falta alguna tabla femenina */
  DATA.namePar = {esp: "lat", rio: "lat", and: "lat", mex: "lat", bra: "lus", por: "lus"};
})();

/* Elige nombre y apellido con pesos suaves (los más comunes salen algo más, pero hay cola larga)
   y penaliza lo ya usado en esta partida para que no se repitan. */
var NM_Z = {};
function nmWeights(list) {
  var k = list.length + "|" + list[0];
  if (!NM_Z[k]) NM_Z[k] = list.map(function (_, i) { return 1 / Math.pow(i + 4, 0.45); });
  return NM_Z[k];
}
function nmPick(list, used, pen) {
  var w = nmWeights(list), tot = 0, ws = [];
  for (var i = 0; i < list.length; i++) { var x = w[i] / (1 + (used[list[i]] || 0) * pen); ws.push(x); tot += x; }
  var r = Math.random() * tot;
  for (var j = 0; j < list.length; j++) { r -= ws[j]; if (r <= 0) return list[j]; }
  return list[list.length - 1];
}
function genName(ni) {
  var pool = namePool(ni), fl = pool.f.split(","), ll = pool.l.split(",");
  var U = (typeof S !== "undefined" && S) ? (S.nmU || (S.nmU = {f: {}, l: {}, n: {}})) : {f: {}, l: {}, n: {}};
  var fn, ln;
  for (var t = 0; t < 10; t++) {
    fn = nmPick(fl, U.f, 0.35); ln = nmPick(ll, U.l, 1.6);
    if (!U.n[fn + " " + ln] && fn !== ln) break;
  }
  U.f[fn] = (U.f[fn] || 0) + 1; U.l[ln] = (U.l[ln] || 0) + 1; U.n[fn + " " + ln] = 1;
  return {fn: fn, ln: ln};
}
