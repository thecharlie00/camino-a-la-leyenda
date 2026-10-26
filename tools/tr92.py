# Traducciones del lote 5.6 (tienda y ropa de míster). Genera i18n/<idioma>/part92.json
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from tr90 import write
T = [
("Traje clásico","Classic suit","Klassischer Anzug","Abito classico","Costume classique"),("Traje de tweed","Tweed suit","Tweedanzug","Abito di tweed","Costume en tweed"),
("Traje blanco de finales","White cup-final suit","Weißer Finalanzug","Abito bianco da finale","Costume blanc des finales"),("Chándal de banquillo","Touchline tracksuit","Trainingsanzug","Tuta da panchina","Survêtement de banc"),
("Abrigo largo","Long coat","Langer Mantel","Cappotto lungo","Manteau long"),("Plumífero de banquillo","Bench puffer","Bank-Daunenjacke","Piumino da panchina","Doudoune de banc"),
("Gabardina camel","Camel trench coat","Kamelfarbener Trenchcoat","Trench color cammello","Trench camel"),("Zapatos clásicos","Classic shoes","Klassische Schuhe","Scarpe classiche","Chaussures classiques"),
("Zapatillas","Trainers","Turnschuhe","Sneakers","Baskets"),("Zapatos de lujo","Luxury shoes","Luxusschuhe","Scarpe di lusso","Chaussures de luxe"),("Corbata roja","Red tie","Rote Krawatte","Cravatta rossa","Cravate rouge"),
("Corbata del club","Club tie","Vereinskrawatte","Cravatta del club","Cravate du club"),("Corbata de punto","Knitted tie","Strickkrawatte","Cravatta in maglia","Cravate en tricot"),
("Gafas de lectura","Reading glasses","Lesebrille","Occhiali da lettura","Lunettes de lecture"),("Gafas de pizarra","Tactics glasses","Taktikbrille","Occhiali da lavagna","Lunettes de tableau"),
("Bufanda de lana","Wool scarf","Wollschal","Sciarpa di lana","Écharpe en laine"),("Pañuelo de seda","Silk scarf","Seidentuch","Foulard di seta","Foulard en soie"),
("Libreta de notas","Notepad","Notizblock","Taccuino di appunti","Bloc-notes"),("Tableta de datos","Data tablet","Daten-Tablet","Tablet dei dati","Tablette de données"),
("Cuaderno de la cantera","Academy notebook","Jugend-Notizbuch","Quaderno del vivaio","Cahier du centre de formation"),("Reloj de bolsillo","Pocket watch","Taschenuhr","Orologio da taschino","Montre à gousset"),
("Reloj deportivo","Sports watch","Sportuhr","Orologio sportivo","Montre de sport"),("Reloj de coleccionista","Collector's watch","Sammleruhr","Orologio da collezione","Montre de collection"),
("Línea Pizarra","Tactics board line","Taktiktafel-Linie","Linea Lavagna","Gamme Tableau"),("Línea Despacho","Office line","Büro-Linie","Linea Ufficio","Gamme Bureau"),("Línea Chándal","Tracksuit line","Trainingsanzug-Linie","Linea Tuta","Gamme Survêtement"),
("Títulos {a} / {b}","Titles {a} / {b}","Titel {a} / {b}","Titoli {a} / {b}","Titres {a} / {b}"),("Necesitas ser capitán","You need to be captain","Du musst Kapitän sein","Devi essere capitano","Tu dois être capitaine"),
("Bloqueado","Locked","Gesperrt","Bloccato","Verrouillé"),("Buscar más en la tienda","Find more in the shop","Mehr im Shop suchen","Cerca altro nel negozio","Chercher plus dans la boutique"),
("Tienda","Shop","Shop","Negozio","Boutique"),("Las existencias cambian cada día.","Stock changes every day.","Das Angebot wechselt täglich.","Gli articoli cambiano ogni giorno.","Le stock change chaque jour."),
("La ropa de entrenador estará disponible cuando te sientes en un banquillo.","Manager clothing will be available once you take a seat on the bench.","Trainerkleidung gibt es, sobald du auf einer Bank sitzt.","L'abbigliamento da allenatore sarà disponibile quando siederai in panchina.","Les tenues d'entraîneur seront disponibles quand tu t'assiéras sur un banc."),
("Adopta una mascota para comprarle accesorios.","Adopt a pet to buy it accessories.","Adoptiere ein Haustier, um ihm Accessoires zu kaufen.","Adotta un animale per comprargli accessori.","Adopte un animal pour lui acheter des accessoires."),
("Hoy no queda nada por aquí: vuelve mañana.","Nothing left here today: come back tomorrow.","Heute ist hier nichts mehr: Komm morgen wieder.","Oggi qui non è rimasto niente: torna domani.","Plus rien ici aujourd'hui : reviens demain."),
("Destacado","Featured","Highlight","In evidenza","Vedette"),("Ya es tuya","Already yours","Gehört schon dir","È già tua","Déjà à toi"),("Comprar","Buy","Kaufen","Compra","Acheter"),
("Te faltan {m}","You're {m} short","Dir fehlen {m}","Ti mancano {m}","Il te manque {m}"),("No se puede comprar.","It can't be bought.","Kann nicht gekauft werden.","Non si può comprare.","Impossible de l'acheter."),
("¡Es tuya!","It's yours!","Gehört dir!","È tua!","Elle est à toi !"),
("Destacado del día y {n} ofertas. Las existencias cambian cada día.","Daily featured item and {n} offers. Stock changes every day.","Tageshighlight und {n} Angebote. Das Angebot wechselt täglich.","Articolo del giorno e {n} offerte. Gli articoli cambiano ogni giorno.","Article vedette du jour et {n} promotions. Le stock change chaque jour."),
]
write("part92.json", T)
