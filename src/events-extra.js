/* ===== DECISIONES EXTRA DEL JUGADOR =====
   Hechos reales del fútbol femenino (con ref) pensados para valer en cualquier modo, y situaciones nuevas
   (redes, datos, prevención, equipación, VAR, afición, estadio, patrocinio, selección, idiomas). */
function exSal(x) { return x.p.con ? x.p.con.sal : 100000; }
function exK(v) { return Math.round(v / 1000) * 1000; }
function exAttack(x) { return x.g === "DEL" || x.g === "MED"; }

/* ============ HECHOS REALES DEL FÚTBOL FEMENINO ============ */
EV({id: "x_demanda_igualdad", tipo: "real", cat: "Igualdad", title: "Un escrito para exigir igualdad", once: true, w: 1.2,
  ref: "En marzo de 2019, 28 jugadoras de la selección femenina de EE. UU. demandaron a su federación por discriminación salarial. En 2022 lograron un acuerdo de 24 millones de dólares y la promesa de igualar las primas con las de la selección masculina.",
  when: function (x) { return x.inSeason && x.age >= 21 && x.p.fame >= 25 && !x.p.loan; },
  text: function () { return tr("Tus primas y tus condiciones son mucho peores que las de otras secciones del club y de la federación. Un grupo de compañeros prepara un escrito conjunto y te pide que lo firmes."); },
  opts: function (x) { var p = clamp(0.4 + x.p.fame / 250 + (x.p.ovr - x.clubR) * 0.02, 0.2, 0.8), m = exK(exSal(x) * 0.15); return [
    {t: tr("Firmar y dar la cara"), d: tr("Puede mejorar las condiciones de todos… o señalarte."), p: p,
      ok: {txt: tr("La directiva se sienta a negociar. Las primas mejoran y el vestuario sale más unido."), fx: {money: m, mor: 6, fans: 4, fame: 3, coach: -2}},
      ko: {txt: tr("La directiva se enroca y te señala como cabecilla."), fx: {coach: -8, mor: -3, fame: 3, fans: 3}}},
    {t: tr("Negociar tu contrato por separado"), ok: {txt: tr("Consigues una mejora para ti. Algunos compañeros te miran de reojo."), fx: {sal: 1.1, mor: -3, coach: 2}}},
    {t: tr("Apoyarlo en privado, sin firmar"), ok: {txt: tr("Les animas desde la sombra. Tu nombre no sale en los papeles."), fx: {mor: 2, prof: 1}}}
  ]; }});

EV({id: "x_gesto_marca", tipo: "real", cat: "Marca personal", title: "Tu gesto, hecho marca", once: true, w: 1,
  ref: "En el Mundial de 2019, Megan Rapinoe celebró sus goles con los brazos abiertos de par en par. La pose dio la vuelta al mundo y se convirtió en una de las imágenes del torneo.",
  when: function (x) { return x.inSeason && x.p.fame >= 22 && exAttack(x); },
  text: function () { return tr("Tu celebración del último gol se ha hecho viral y aficionados de medio mundo imitan tu pose. Una marca propone registrarla y vender camisetas con ella."); },
  opts: function (x) { var m = exK(exSal(x) * 0.3); return [
    {t: tr("Firmar la línea de camisetas"), d: tr("Dinero seguro, pero algunos lo verán como postureo."), p: 0.75,
      ok: {txt: tr("Las camisetas vuelan de las tiendas y tu cuenta lo nota."), fx: {money: m, fol: Math.round(x.p.fame * 3), fame: 3}},
      ko: {txt: tr("Se venden bien, pero te llueven críticas por comercializar un gesto espontáneo."), fx: {money: m, fol: 20, fans: -5}}},
    {t: tr("Donar los beneficios a una causa"), ok: {txt: tr("Tu gesto sirve para algo más grande. La afición te lo agradece."), fx: {fans: 8, fame: 4, mor: 5, fol: 40}}},
    {t: tr("Dejar que el gesto sea de todos"), ok: {txt: tr("Sin contratos ni marcas. Los niños lo copian en el patio y a ti te vale."), fx: {fans: 3, mor: 2}}}
  ]; }});

EV({id: "x_cruzado_vuelta", tipo: "real", cat: "Salud", title: "Una vuelta con prisa", w: 3, cd: 2,
  ref: "En julio de 2022, Alexia Putellas, la mejor jugadora del mundo, se rompió el ligamento cruzado a las puertas de la Eurocopa. Volvió a jugar en 2023 y ese año fue campeona del mundo con España.",
  when: function (x) { return x.inSeason && !!x.p.inj && x.p.injT > S.tw + 5; },
  text: function (x) { return tr("Llevas semanas de baja ({injury}) y aún quedan meses. Se acerca una cita muy importante y todos preguntan cuándo vuelves.", {injury: x.p.inj ? lcName(x.p.inj.n) : tr("lesión seria")}); },
  opts: function (x) { return [
    {t: tr("Seguir el plan al pie de la letra"), ok: {txt: tr("Paciencia y trabajo diario. Volverás cuando toque, sin atajos."), fx: {prof: 4, mor: 2, injMul: 0.95}}},
    {t: tr("Adelantar la vuelta"), d: tr("Dos semanas antes, con riesgo de recaída."), p: 0.5,
      ok: {txt: tr("El cuerpo responde y vuelves antes de lo previsto. La afición lo celebra."), fx: {mor: 4, fans: 3}, n: tr("Dos semanas menos de baja"), then: function () { S.p.injT = Math.max(S.tw + 1, S.p.injT - 2); }},
      ko: {txt: tr("Una recaída te devuelve al principio. Esta vez, más tiempo."), fx: {mor: -6, injMul: 1.15}, n: tr("Tres semanas más de baja"), then: function () { S.p.injT += 3; }}},
    {t: tr("Trabajar la cabeza con un psicólogo (20 k€)"), ok: {txt: tr("Aprendes a convivir con el miedo a recaer. Vuelves más fuerte por dentro."), fx: {money: -20000, mor: 8, prof: 3}}}
  ]; }});

EV({id: "x_plante_seleccion", tipo: "real", cat: "Selección", title: "¿Plantarte con tu selección?", once: true, w: 1,
  ref: "Ada Hegerberg, primera ganadora del Balón de Oro femenino (2018), dejó la selección de Noruega en 2017 en protesta por el trato a las jugadoras y se perdió el Mundial de 2019.",
  when: function (x) { return x.inSeason && x.age >= 22 && x.p.intl.caps >= 8 && x.p.fame >= 35; },
  text: function () { return tr("La federación trata a tu selección peor que a otras: hoteles malos, viajes incómodos y primas ridículas. Se acerca una convocatoria importante y se habla de plantarse."); },
  opts: function (x) { return [
    {t: tr("Plantarte y no ir"), d: tr("Un gesto fuerte que puede dar frutos… o dejarte fuera."), p: 0.55,
      ok: {txt: tr("La presión funciona y la federación mejora las condiciones. Tu gesto se recordará."), fx: {fame: 6, mor: 8, fans: 6}},
      ko: {txt: tr("La federación no se mueve. Te pierdes el torneo y la prensa se divide."), fx: {fame: 2, mor: -6, form: -3}}},
    {t: tr("Ir y reclamar desde dentro"), ok: {txt: tr("Presionas en las reuniones y en el vestuario sin dejar al equipo tirado."), fx: {prof: 4, fame: 2, mor: 2}}},
    {t: tr("Ir y callar"), ok: {txt: tr("Cumples y te centras en jugar. Por dentro, algo te escuece."), fx: {prof: 1, mor: -3}}}
  ]; }});

EV({id: "x_voltereta", tipo: "real", cat: "Partido", title: "Una voltereta para celebrar", w: 1, cd: 3,
  ref: "Sam Kerr, máxima goleadora de la historia de Australia, celebraba sus goles con una voltereta hacia atrás que se convirtió en su sello.",
  when: function (x) { return x.inSeason && x.g === "DEL" && x.age <= 34 && x.p.fame >= 15 && !x.p.inj; },
  text: function () { return tr("Marcas un golazo y la grada espera tu celebración. Te ronda la cabeza una voltereta, pero el césped está resbaladizo."); },
  opts: function (x) { var p = clamp(0.96 - (x.age - 18) * 0.012 + (x.p.fit - 60) / 400, 0.6, 0.95); return [
    {t: tr("Voltereta hacia atrás"), p: p,
      ok: {txt: tr("Aterrizas perfecto y el estadio se rinde. Ya tienes tu sello."), fx: {fans: 6, fol: 30, fame: 2}},
      ko: {txt: tr("Aterrizas mal y te tuerces el tobillo. La grada aplaude, el fisio no."), fx: {fans: 3, inj: [1, 3]}}},
    {t: tr("Correr a abrazar a tus compañeros"), ok: {txt: tr("Una piña en la esquina. El grupo lo agradece."), fx: {mor: 3, coach: 3}}},
    {t: tr("Un gesto con la grada"), ok: {txt: tr("Te acercas al fondo y la grada te canta el nombre."), fx: {fans: 4}}}
  ]; }});

EV({id: "x_camiseta_fuera", tipo: "real", cat: "Partido", title: "El gol de la prórroga", w: 2, cd: 3,
  ref: "En la final de la Eurocopa 2022, Chloe Kelly marcó el gol del título de Inglaterra en la prórroga y celebró quitándose la camiseta y dando vueltas con ella en la mano.",
  when: function (x) { return x.inSeason && exAttack(x) && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Marcas en el minuto 110 el gol que mete a tu equipo en la siguiente ronda. El estadio estalla y el cuerpo te pide quitarte la camiseta y correr."); },
  opts: function () { return [
    {t: tr("Quitarte la camiseta y correr"), d: tr("Imagen para la historia… con riesgo de tarjeta."), p: 0.65,
      ok: {txt: tr("La foto del año. La grada y las redes enloquecen."), fx: {fans: 8, fol: 60, fame: 4}},
      ko: {txt: tr("Amarilla por el exceso y sermón del míster, pero la imagen ya es tuya."), fx: {fans: 6, fol: 40, fame: 3, coach: -4, money: -10000}}},
    {t: tr("Abrazarte a tus compañeros"), ok: {txt: tr("La piña se hace enorme. Se celebra como un equipo."), fx: {mor: 5, coach: 4, fans: 3}}},
    {t: tr("Dedicar el gol a alguien especial"), ok: {txt: tr("Señalas al cielo. La grada se queda en silencio y luego aplaude."), fx: {mor: 7, fans: 4, prof: 2}}}
  ]; }});

EV({id: "x_carta_colegios", tipo: "real", cat: "Compromiso", title: "Una carta por el fútbol en los colegios", once: true, w: 1.1,
  ref: "Tras ganar la Eurocopa de 2022, las jugadoras de Inglaterra escribieron una carta abierta a los aspirantes a primer ministro para pedir que todas las niñas pudieran jugar al fútbol en el colegio en las mismas condiciones que los niños.",
  when: function (x) { return x.inSeason && x.age >= 20 && x.p.fame >= 25; },
  text: function () { return tr("En tu antiguo colegio el fútbol es un lujo: pocos equipos y una pista en mal estado. Un grupo de compañeros prepara una carta abierta al gobierno y te pide que la firmes."); },
  opts: function (x) { var c = exK(exSal(x) * 0.2); return [
    {t: tr("Firmar la carta"), d: tr("Gratis, aunque nadie asegura que la lean."), p: 0.6,
      ok: {txt: tr("El gobierno responde con un plan de ayudas y tu firma sale en todos los medios."), fx: {fans: 8, fame: 3, mor: 5, fol: 50}},
      ko: {txt: tr("Nadie responde, pero la carta queda ahí y tu gesto se agradece."), fx: {fans: 3, mor: 2}}},
    {t: tr("Entrenar a los chavales del colegio"), ok: {txt: tr("Sábados de barro y risas. Acabas agotado, pero feliz."), fx: {fit: -5, fans: 8, mor: 8, prof: 2}}},
    {t: tr("Pagar una pista nueva"), d: tr("Te costará {cost}.", {cost: fmtMoney(c)}), ok: {txt: tr("La nueva pista lleva tu nombre. Los niños no paran de jugar."), fx: {money: -c, fans: 10, fame: 4, mor: 6}}}
  ]; }});

EV({id: "x_camiseta_agotada", tipo: "real", cat: "Dinero", title: "Tu camiseta no se vende", once: true, w: 1,
  ref: "En 2023, Nike no vendía la camiseta de portera de Mary Earps, la mejor guardameta del mundo según la FIFA. Tras la presión de las aficionadas y de la propia jugadora, la marca acabó lanzándola.",
  when: function (x) { return x.inSeason && x.age >= 20 && x.p.fame >= 30; },
  text: function () { return tr("Tus aficionados piden tu camiseta, pero la marca del club no la pone a la venta. Hay una campaña en redes para presionar y todos esperan que digas algo."); },
  opts: function (x) { var m = exK(exSal(x) * 0.1); return [
    {t: tr("Criticar a la marca en público"), p: 0.55,
      ok: {txt: tr("La presión funciona: la marca cede y tu camiseta se agota en un día."), fx: {fans: 8, fol: 120, fame: 4}},
      ko: {txt: tr("La marca se ofende y el club te pide que bajes el tono."), fx: {fans: 4, fame: 2, coach: -5, money: -m}}},
    {t: tr("Negociar en privado"), p: 0.7,
      ok: {txt: tr("En unas semanas sale a la venta y te llevas un porcentaje."), fx: {money: m, fans: 5, fame: 2}},
      ko: {txt: tr("Te dan largas. La afición empieza a impacientarse."), fx: {mor: -3, fans: -2}}},
    {t: tr("Mantenerte al margen"), ok: {txt: tr("Prefieres que hable el campo. Algunos fans se sienten solos."), fx: {prof: 2, fans: -2}}}
  ]; }});

EV({id: "x_bajo_protesta", tipo: "real", cat: "Selección", title: "Huelga antes del torneo", w: 1, cd: 4,
  ref: "En 2023, las jugadoras de la selección de Canadá amenazaron con una huelga por los recortes de su federación y acabaron jugando «bajo protesta» para no perderse un torneo.",
  when: function (x) { return x.inSeason && x.age >= 21 && x.p.intl.caps >= 5; },
  text: function () { return tr("Tu federación recorta el presupuesto de la selección y la plantilla debate una huelga justo antes de un torneo."); },
  opts: function () { return [
    {t: tr("Votar por la huelga"), d: tr("La presión es máxima, pero puedes quedarte sin torneo."), p: 0.5,
      ok: {txt: tr("La federación cede y las condiciones mejoran. Vuestro plante se recordará."), fx: {fame: 3, mor: 6, fans: 4}},
      ko: {txt: tr("Os quedáis sin torneo y parte de la prensa os culpa."), fx: {fame: -2, mor: -6, form: -4, fans: -3}}},
    {t: tr("Jugar «bajo protesta»"), ok: {txt: tr("Salís al campo con un mensaje en las camisetas. El mundo os mira."), fx: {fame: 3, fans: 4, mor: 2}}},
    {t: tr("Jugar sin más"), ok: {txt: tr("El seleccionador agradece la profesionalidad. En el vestuario hay mal ambiente."), fx: {coach: 4, mor: -4}}}
  ]; }});

EV({id: "x_mensaje_jovenes", tipo: "real", cat: "Prensa", title: "Un mensaje para quien viene detrás", once: true, w: 1,
  ref: "Tras la eliminación de Brasil en el Mundial de 2019, Marta lanzó un mensaje a las jóvenes: «llorar al principio para sonreír al final», y pidió que no dejaran morir el fútbol femenino.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.age >= 28 && x.p.fame >= 40; },
  text: function () { return tr("Tras una derrota dolorosa, los micrófonos te buscan. Quizá sea uno de tus últimos grandes torneos y tienes algo que decir a la gente joven."); },
  opts: function () { return [
    {t: tr("Lanzar un mensaje a la nueva generación"), p: 0.8,
      ok: {txt: tr("Tus palabras emocionan y se hacen virales. Miles de jóvenes las comparten."), fx: {fol: 80, fans: 8, fame: 4, mor: 4}},
      ko: {txt: tr("Se interpreta como una despedida y te toca desmentirlo."), fx: {fame: 1, mor: -4, fans: 2}}},
    {t: tr("Hablar solo del partido"), ok: {txt: tr("Análisis serio y sin dramas. El míster lo valora."), fx: {prof: 3, coach: 3}}},
    {t: tr("Irte sin decir nada"), ok: {txt: tr("Dolido, te marchas en silencio. Hoy no hay palabras."), fx: {mor: -3, prof: 1}}}
  ]; }});

EV({id: "x_quinto_penalti", tipo: "real", cat: "Partido", title: "El quinto penalti", w: 2, cd: 3,
  ref: "En la final del Mundial de 1999, Brandi Chastain marcó el penalti que dio el título a EE. UU. ante China y lo celebró quitándose la camiseta, una de las imágenes más famosas de la historia del deporte.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.p.pos !== "POR" && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Eliminatoria igualada tras la prórroga. En la tanda, el míster te pide que lances el quinto penalti, el decisivo. Tienes que dar el paso."); },
  opts: function (x) { var p = clamp(0.62 + (x.p.ovr - x.clubR) * 0.015 + (x.p.prof - 50) / 400, 0.35, 0.9); return [
    {t: tr("Lanzar el quinto"), p: p,
      ok: {txt: tr("Gol. Te lanzas a celebrarlo y todo el estadio salta contigo."), fx: {fame: 6, fans: 10, mor: 8, coach: 6, fol: 100}},
      ko: {txt: tr("El balón se va fuera. Te hundes en el césped mientras tus compañeras te abrazan."), fx: {mor: -10, fans: -2, coach: -2}}},
    {t: tr("Pedir el cuarto, y que otro tire el quinto"), p: 0.75,
      ok: {txt: tr("Cumples con tu penalti y compartes la responsabilidad."), fx: {mor: 3, coach: 4}},
      ko: {txt: tr("Fallas el cuarto. Al menos nadie te culpa de la decisión final."), fx: {mor: -6, coach: -1}}},
    {t: tr("Pasar la responsabilidad"), ok: {txt: tr("El míster se fija en otro nombre. Sientes que has perdido una oportunidad."), fx: {coach: -4, mor: -3}}}
  ]; }});

EV({id: "x_baja_familiar", tipo: "real", cat: "Contrato", title: "Una baja familiar", once: true, w: 0.9,
  ref: "La islandesa Sara Björk Gunnarsdóttir denunció que el Olympique de Lyon no le pagó el salario completo durante su embarazo, y la FIFA le dio la razón. Desde 2021, el reglamento de la FIFA garantiza al menos catorce semanas de baja de maternidad pagada.",
  when: function (x) { return x.inSeason && x.age >= 24 && x.age <= 38 && !!x.p.con && !x.p.loan; },
  text: function () { return tr("Esperáis un bebé y vas a necesitar unas semanas de baja. El club solo ofrece pagar una parte del sueldo durante ese tiempo."); },
  opts: function (x) { var p = clamp(0.5 + x.p.agent * 0.1, 0.4, 0.75), m = exK(exSal(x) * 0.15); return [
    {t: tr("Reclamar lo que marca el reglamento"), p: p,
      ok: {txt: tr("El club rectifica: cobras íntegro y la plantilla te apoya."), fx: {mor: 8, fans: 4, fame: 3, coach: -2}},
      ko: {txt: tr("Hay tensión con la directiva y acabas cediendo en parte."), fx: {mor: -4, coach: -6, fame: 2}}},
    {t: tr("Aceptar la oferta del club"), d: tr("Evitas problemas, pero cobras menos."), ok: {txt: tr("Firmas y sin dramas. El club te lo agradece."), fx: {money: -m, coach: 4}}},
    {t: tr("Pactar una vuelta progresiva"), ok: {txt: tr("Acordáis volver poco a poco, con minutos controlados."), fx: {mor: 5, coach: 2, form: -4}}}
  ]; }});

EV({id: "x_portera_penaltis", tipo: "real", cat: "Partido", title: "Un penalti, tú y la lanzadora", w: 2, cd: 3,
  ref: "En la final del Mundial de 2007, Nadine Angerer paró un penalti a Marta y Alemania ganó sin recibir un solo gol en todo el torneo. En 2013 fue la primera portera elegida mejor jugadora del año por la FIFA.",
  when: function (x) { return x.inSeason && S.bi >= 1 && x.p.pos === "POR"; },
  text: function (x) { return tr("Penalti en contra ante el {opp}, en un momento decisivo. La lanzadora tiene fama de tirar siempre al mismo lado, pero tienes dudas.", {opp: x.opp()}); },
  opts: function (x) { var p = clamp(0.3 + (x.p.ovr - x.clubR) * 0.02 + x.p.prof / 500, 0.15, 0.55); return [
    {t: tr("Tirarte con lo que viste en vídeo"), p: p,
      ok: {txt: tr("Lo adivinas y lo paras. Tu equipo te abraza como a una heroína."), fx: {fame: 5, fans: 8, mor: 8, coach: 5}},
      ko: {txt: tr("Te cambia el lado. Gol y a remar contra corriente."), fx: {mor: -4, form: -3}}},
    {t: tr("Quedarte en el centro"), p: 0.22,
      ok: {txt: tr("Tira al medio y se la quedas. Locura en el estadio."), fx: {fame: 6, fans: 9, mor: 8}},
      ko: {txt: tr("Se va a una esquina. Parecías una estatua."), fx: {mor: -5, fans: -2}}},
    {t: tr("Intentar desconcertarla con gestos"), p: 0.4,
      ok: {txt: tr("Se pone nerviosa y lo falla. La jugada da la vuelta al mundo."), fx: {fame: 4, fans: 6, mor: 6}},
      ko: {txt: tr("El árbitro te advierte, repite el penalti… y lo mete."), fx: {coach: -3, mor: -3}}}
  ]; }});

EV({id: "x_banquillo_leyenda", tipo: "real", cat: "Vestuario", title: "Del once al banquillo", once: true, w: 1.2,
  ref: "En el Mundial de 2011, Birgit Prinz, tres veces mejor jugadora del mundo para la FIFA, perdió la titularidad con Alemania y poco después dejó la selección.",
  when: function (x) { return x.inSeason && x.age >= 28 && x.p.fame >= 40 && (x.role === "Suplente" || x.role === "Rotación"); },
  text: function () { return tr("El míster te deja en el banquillo en el partido más importante del año. Tienes más premios que casi nadie en el vestuario, y no es fácil de digerir."); },
  opts: function () { return [
    {t: tr("Aceptarlo y animar desde el banquillo"), ok: {txt: tr("El equipo ve que sigues siendo de los suyos. El míster te lo reconoce."), fx: {coach: 6, mor: -3, prof: 5}}},
    {t: tr("Pedir explicaciones al míster"), p: 0.5,
      ok: {txt: tr("Os decís las cosas a la cara. Te promete minutos pronto."), fx: {coach: 4, mor: 3}},
      ko: {txt: tr("La charla acaba mal. Sigues en el banquillo… y con peor humor."), fx: {coach: -6, mor: -4}}},
    {t: tr("Ofrecerte como apoyo del vestuario"), ok: {txt: tr("Pasas a ser la voz de la experiencia en los momentos difíciles."), fx: {coach: 5, mor: 2, prof: 4, fans: 3}}}
  ]; }});

EV({id: "x_record_goles", tipo: "real", cat: "Selección", title: "A un gol del récord", once: true, w: 1,
  ref: "Christine Sinclair, capitana de Canadá, batió en 2020 el récord de goles con una selección de toda la historia, masculino o femenino, y lo dejó en 190.",
  when: function (x) { return x.inSeason && x.g === "DEL" && x.p.fame >= 40 && x.p.intl.caps >= 30; },
  text: function () { return tr("Estás a un gol de un récord histórico de tu selección. En el partido, tu equipo consigue un penalti y todos te miran."); },
  opts: function (x) { var p = clamp(0.7 + (x.p.ovr - x.clubR) * 0.01, 0.5, 0.88); return [
    {t: tr("Pedir el penalti"), p: p,
      ok: {txt: tr("Gol y récord. El estadio entero te ovaciona."), fx: {fame: 5, fans: 8, mor: 8, fol: 100}},
      ko: {txt: tr("Lo fallas y la presión se te echa encima."), fx: {mor: -8, fame: 1, fans: 2}}},
    {t: tr("Cedérselo a un compañero"), ok: {txt: tr("Un gesto de grandeza: el récord llegará, pero el equipo va antes."), fx: {mor: 4, coach: 5, fans: 4, prof: 3}}},
    {t: tr("Esperar a que llegue en juego"), p: 0.5,
      ok: {txt: tr("Lo consigues con una jugada preciosa. Mejor aún."), fx: {fame: 5, fans: 8, mor: 8, fol: 100}},
      ko: {txt: tr("El gol no llega y la espera se alarga."), fx: {mor: -2}}}
  ]; }});

EV({id: "x_estadio_lleno", tipo: "real", cat: "Partido", title: "Un estadio de récord", w: 1.3, cd: 4,
  ref: "La final de la Eurocopa femenina de 2022 reunió a 87.192 personas en Wembley, récord de asistencia en una Eurocopa de cualquier categoría.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.starts >= 3 && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Tu equipo juega una eliminatoria ante la mayor asistencia de la historia del club. En el túnel notas que las piernas no te responden."); },
  opts: function (x) { var p = clamp(0.55 + x.p.prof / 300 + (x.p.mor - 50) / 300, 0.35, 0.85); return [
    {t: tr("Respirar y disfrutar"), p: p,
      ok: {txt: tr("Dejas que el ruido te empuje y juegas el partido de tu vida."), fx: {fans: 6, fame: 3, buff: {v: 1.5, b: 1, n: tr("Estadio rendido")}}},
      ko: {txt: tr("Te pesa el ambiente y pasas el partido en una nube."), fx: {form: -5, mor: -2}}},
    {t: tr("Pedir el balón desde el principio"), p: 0.5,
      ok: {txt: tr("Te echas el equipo a la espalda. La grada corea tu nombre."), fx: {fans: 8, fame: 4, coach: 4}},
      ko: {txt: tr("Quieres demasiado y pierdes balones tontos."), fx: {coach: -4, form: -4}}},
    {t: tr("Hablar con el psicólogo del club (20 k€)"), ok: {txt: tr("Un par de técnicas de respiración y sales con la cabeza fría."), fx: {money: -20000, mor: 6, form: 3}}}
  ]; }});

EV({id: "x_fichaje_record", tipo: "real", cat: "Mercado", title: "El fichaje más caro de la liga", once: true, w: 1.2,
  ref: "En 2020, la delantera danesa Pernille Harder fichó por el Chelsea en el traspaso más caro hasta entonces del fútbol femenino.",
  when: function (x) { return x.inSeason && x.yrsAtClub <= 1 && x.p.tx.length > 0 && x.p.fame >= 30 && x.age <= 31 && !x.p.loan; },
  text: function () { return tr("Tu fichaje ha costado una cifra récord para tu liga y todo el mundo espera que cambies el equipo. Hoy es tu presentación ante los medios."); },
  opts: function (x) { var p = clamp(0.45 + (x.p.ovr - x.clubR) * 0.03, 0.2, 0.8); return [
    {t: tr("Prometer títulos"), d: tr("La afición se ilusiona, pero la promesa pesa."), p: p,
      ok: {txt: tr("«Vengo a ganar». La grada te adopta antes de pisar el césped."), fx: {fans: 10, fame: 4, buff: {v: 1, b: 2, n: tr("Ilusión")}}},
      ko: {txt: tr("La promesa te persigue en cada mala racha y la presión se nota."), fx: {fans: 4, form: -5, mor: -3}}},
    {t: tr("Hablar de trabajo y humildad"), ok: {txt: tr("Mensaje sensato: nada de focos, a trabajar. El míster lo agradece."), fx: {prof: 4, fans: 3, coach: 4}}},
    {t: tr("Hablar de lo que supone para tu liga"), ok: {txt: tr("«Es una señal de lo lejos que puede llegar este fútbol». Tu discurso se cita en todos los medios."), fx: {fame: 4, fol: 40, fans: 5}}}
  ]; }});

EV({id: "x_gol_medio_campo", tipo: "real", cat: "Partido", title: "La portera, muy adelantada", w: 1, cd: 3,
  ref: "En la final del Mundial de 2015, Carli Lloyd marcó tres goles a Japón en dieciséis minutos; el tercero, desde el círculo central, al ver a la portera muy adelantada.",
  when: function (x) { return x.inSeason && x.p.pos !== "POR" && exAttack(x) && x.p.ovr >= 60; },
  text: function () { return tr("Recuperas en tu campo y ves a la portera rival casi en el centro del campo. Tienes la jugada y apenas un segundo para decidir."); },
  opts: function (x) { var p = clamp(0.12 + (x.p.ovr - 60) * 0.004, 0.05, 0.2); return [
    {t: tr("Disparar desde el centro del campo"), d: tr("Muy arriesgado, pero un gol así no se olvida."), p: p,
      ok: {txt: tr("¡Gol desde el centro del campo! Saldrá en todos los resúmenes del año."), fx: {fame: 6, fans: 8, mor: 8, fol: 120}},
      ko: {txt: tr("Se va rozando el palo. Las risas del estadio se mezclan con aplausos."), fx: {coach: -2, fans: 1}}},
    {t: tr("Conducir y buscar el pase"), p: 0.65,
      ok: {txt: tr("Llevas el balón hasta el área y habilitas a una compañera. Gol."), fx: {coach: 4, mor: 3}},
      ko: {txt: tr("Te cierran el hueco y pierdes el balón."), fx: {coach: -1}}},
    {t: tr("Pasar a quien está mejor ubicado"), ok: {txt: tr("El pase sale limpio y la jugada acaba en córner. Cabeza fría."), fx: {coach: 3, prof: 2}}}
  ]; }});

/* ============ SITUACIONES NUEVAS ============ */
EV({id: "x_bulo_redes", tipo: "aleatoria", cat: "Redes", title: "Un bulo corre por las redes", w: 1, cd: 2,
  when: function (x) { return x.inSeason && x.p.fame >= 20; },
  text: function () { return tr("Circula un bulo de que te has peleado con un compañero y quieres irte. Es falso, pero lo comparten miles de personas y el club pide una respuesta."); },
  opts: function () { return [
    {t: tr("Desmentirlo en un comunicado"), p: 0.7,
      ok: {txt: tr("Claro y breve. En un día nadie lo recuerda."), fx: {fans: 3, coach: 3}},
      ko: {txt: tr("El desmentido atrae todavía más curiosidad."), fx: {fol: 20, fans: -3}}},
    {t: tr("Subir un vídeo entrenando con ese compañero"), ok: {txt: tr("Una sonrisa y un choque de manos valen más que mil palabras."), fx: {fans: 6, mor: 4, fol: 30}}},
    {t: tr("No decir nada"), p: 0.5,
      ok: {txt: tr("Mañana habrá otro bulo. El tuyo se pierde."), fx: {}},
      ko: {txt: tr("El bulo crece y llega a las tertulias."), fx: {fans: -6, coach: -3}}}
  ]; }});

EV({id: "x_datos_gps", tipo: "real", cat: "Datos", title: "Los datos no cuadran", w: 1.1, cd: 3,
  when: function (x) { return x.inSeason && S.bi >= 1 && x.age >= 26; },
  text: function () { return tr("El departamento de análisis te enseña un informe: tu intensidad de carrera ha bajado un 8 % en las últimas semanas. Tú te sientes bien."); },
  opts: function (x) { var p = clamp(0.5 - (x.p.fit - 60) / 300, 0.3, 0.65); return [
    {t: tr("Hacerles caso y cambiar tu preparación"), ok: {txt: tr("Más descanso y trabajo específico. Notas el cambio en pocas semanas."), fx: {fit: 8, prof: 4, form: -2}}},
    {t: tr("Pedir una segunda opinión"), p: 0.5,
      ok: {txt: tr("Los sensores estaban mal calibrados. Tu estado es mejor de lo que decían."), fx: {mor: 4, coach: 3}},
      ko: {txt: tr("Se confirma: estabas más cansado de lo que pensabas."), fx: {fit: -4, coach: -3}}},
    {t: tr("Fiarte de tus sensaciones"), p: 1 - p,
      ok: {txt: tr("Tenías razón: los números mentían y rindes a gran nivel."), fx: {mor: 3, form: 3}},
      ko: {txt: tr("El cuerpo te pasa factura y te notas una molestia muscular."), fx: {inj: [1, 3], prof: -2}}}
  ]; }});

EV({id: "x_prevencion", tipo: "real", cat: "Salud", title: "Plan de prevención de lesiones", once: true, w: 1.1,
  when: function (x) { return x.inSeason && x.age >= 22 && !x.p.flags.prehab; },
  text: function () { return tr("El cuerpo médico propone un programa de fortalecimiento que te quitará horas libres y energías durante meses, pero reduce el riesgo de lesión."); },
  opts: function () { return [
    {t: tr("Hacer el programa completo"), ok: {txt: tr("Mucho trabajo de gimnasio y estabilidad. Tu cuerpo se vuelve un escudo."), fx: {injMul: 0.8, fit: -6, prof: 5, flag: {prehab: true}}}},
    {t: tr("Hacer una versión reducida"), ok: {txt: tr("Dos sesiones a la semana. Menos esfuerzo y algo de protección."), fx: {injMul: 0.92, prof: 2, flag: {prehab: true}}}},
    {t: tr("Diseñarte tu propio plan"), p: 0.5,
      ok: {txt: tr("Te sale redondo y te sientes mejor que nunca."), fx: {injMul: 0.85, prof: 3, flag: {prehab: true}}},
      ko: {txt: tr("Tu plan no estaba tan bien pensado. Te cargas más de lo que ganas."), fx: {injMul: 1.1, fit: -5, flag: {prehab: true}}}}
  ]; }});

EV({id: "x_nueva_camiseta", tipo: "aleatoria", cat: "Club", title: "La camiseta nueva no gusta", w: 0.9, cd: 3,
  when: function (x) { return x.inSeason && x.yrsAtClub >= 1; },
  text: function () { return tr("El club presenta la camiseta nueva y la afición la odia: dicen que el diseño traiciona la historia. Te piden que poses en la presentación."); },
  opts: function () { return [
    {t: tr("Posar con una sonrisa"), ok: {txt: tr("Cumples con el club. La afición lo entiende, aunque no lo comparte."), fx: {coach: 4, fans: -3}}},
    {t: tr("Decir que a ti tampoco te gusta"), p: 0.5,
      ok: {txt: tr("Tu sinceridad se hace viral y la grada te adopta."), fx: {fans: 6, fame: 2, coach: -3}},
      ko: {txt: tr("El club se enfada y te multa por hablar de más."), fx: {fans: 2, coach: -8, money: -10000}}},
    {t: tr("Pedir con los capitanes un cambio de diseño"), p: 0.4,
      ok: {txt: tr("El club rectifica la segunda equipación. Eres la voz de la grada."), fx: {fans: 8, coach: 3}},
      ko: {txt: tr("Os escuchan con una sonrisa y no cambia nada."), fx: {coach: -2}}}
  ]; }});

EV({id: "x_var_anulado", tipo: "real", cat: "Partido", title: "El VAR te anula un gol", w: 1.1, cd: 2,
  ref: "El Mundial femenino de 2019 fue el primero de la historia de los Mundiales femeninos en usar el VAR.",
  when: function (x) { return x.inSeason && exAttack(x); },
  text: function () { return tr("Marcas en el último minuto, pero tras tres minutos de revisión el VAR anula tu gol por un fuera de juego de milímetros."); },
  opts: function () { return [
    {t: tr("Protestar al árbitro"), p: 0.6,
      ok: {txt: tr("Lo haces con respeto y la grada te aplaude."), fx: {fans: 3}},
      ko: {txt: tr("Insistes de más y te llevas una segunda amarilla."), fx: {susp: 1, coach: -5}}},
    {t: tr("Aceptarlo y levantar a los tuyos"), ok: {txt: tr("Palmada en la espalda a tus compañeros y a pensar en el siguiente."), fx: {mor: 3, coach: 4, prof: 3}}},
    {t: tr("Criticar al VAR en zona mixta"), p: 0.5,
      ok: {txt: tr("Tus palabras conectan con la afición y se vuelven virales."), fx: {fans: 6, fame: 2, fol: 30}},
      ko: {txt: tr("Comité de Competición: multa por tus declaraciones."), fx: {money: -15000, coach: -3}}}
  ]; }});

EV({id: "x_boicot_grada", tipo: "real", cat: "Afición", title: "La grada da la espalda", w: 1.2, cd: 3,
  when: function (x) { var li = S.cl[S.p.club]; return x.inSeason && S.bi >= 2 && S.L && !!S.L[li] && x.lgPos > S.L[li].tm.length * 0.55; },
  text: function () { return tr("La afición lleva jornadas sin cantar en protesta contra la directiva por la mala gestión. Un grupo de ultras pide hablar con la plantilla."); },
  opts: function () { return [
    {t: tr("Reunirte con la grada y escuchar"), p: 0.65,
      ok: {txt: tr("Salen las quejas, pero también el compromiso de empujar a los jugadores."), fx: {fans: 8, mor: 3}},
      ko: {txt: tr("El diálogo se tensa y alguien pide cabezas."), fx: {fans: -3, mor: -4}}},
    {t: tr("Dar un mensaje de unidad en redes"), ok: {txt: tr("«Estamos juntos». Quedas bien con casi todos."), fx: {fans: 3, fol: 20, coach: 3}}},
    {t: tr("Quedarte al margen"), ok: {txt: tr("No es tu guerra. El club lo agradece, la grada menos."), fx: {coach: 2, fans: -4}}}
  ]; }});

EV({id: "x_nuevo_estadio", tipo: "real", cat: "Club", title: "Mudanza de estadio", once: true, w: 0.8,
  when: function (x) { return x.inSeason && x.yrsAtClub >= 2 && S.bi <= 2; },
  text: function () { return tr("El club anuncia que dejará su estadio de siempre para estrenar otro nuevo a las afueras. La afición está dividida y todos te preguntan qué te parece."); },
  opts: function () { return [
    {t: tr("Defender el cambio"), p: 0.5,
      ok: {txt: tr("Hablas de futuro y de ilusión. Poco a poco la grada se anima."), fx: {fans: 5, coach: 5}},
      ko: {txt: tr("Te acusan de ser el portavoz de la directiva."), fx: {fans: -8, coach: 3}}},
    {t: tr("Defender el estadio de siempre"), ok: {txt: tr("«Aquí está nuestra historia». La grada te lo agradece."), fx: {fans: 8, coach: -5}}},
    {t: tr("Pedir que se respete la identidad del club"), ok: {txt: tr("Pides un museo y un fondo con nombre histórico. Quedas bien con todos."), fx: {fans: 4, coach: 1, prof: 2}}}
  ]; }});

EV({id: "x_conflicto_patrocinio", tipo: "real", cat: "Dinero", title: "Patrocinador contra patrocinador", w: 1, cd: 3,
  when: function (x) { return x.inSeason && x.p.fame >= 30; },
  text: function () { return tr("Tu patrocinador personal compite con el del club. La marca del club te pide que dejes de aparecer con la competencia en tus redes."); },
  opts: function (x) { var s = exSal(x); return [
    {t: tr("Respetar al club"), d: tr("Pierdes el contrato personal."), ok: {txt: tr("Rescindes con tu marca. El club lo valora, tu cuenta bancaria menos."), fx: {money: -exK(s * 0.1), coach: 5, mor: -1}}},
    {t: tr("Mantener tu contrato personal"), p: 0.6,
      ok: {txt: tr("Consigues una cláusula que te protege. Cobras y nadie se queja."), fx: {money: exK(s * 0.2), fame: 2, coach: -3}},
      ko: {txt: tr("La marca del club protesta y se enfría tu relación con la directiva."), fx: {money: exK(s * 0.2), coach: -10, fans: -3}}},
    {t: tr("Negociar un acuerdo con ambas"), p: 0.4,
      ok: {txt: tr("Las dos marcas aceptan un acuerdo y pagan por tenerte."), fx: {money: exK(s * 0.15), fame: 2, coach: 3}},
      ko: {txt: tr("Las dos se enfadan a la vez. No quedas bien con nadie."), fx: {money: -exK(s * 0.1), fame: -2}}}
  ]; }});

EV({id: "x_llamada_seleccion", tipo: "real", cat: "Selección", title: "Una convocatoria incómoda", w: 1, cd: 3,
  when: function (x) { return x.inSeason && S.bi >= 1 && x.age >= 19 && x.p.fame >= 20 && x.p.inat >= 0; },
  text: function () { return tr("La selección te convoca para un amistoso sin importancia en plena racha del club. Estás justo de fuerzas y el míster prefiere que te quedes."); },
  opts: function () { return [
    {t: tr("Ir con la selección"), p: 0.7,
      ok: {txt: tr("Vas y cumples. El seleccionador toma nota."), fx: {fame: 3, fans: 2, coach: -3, fit: -6}},
      ko: {txt: tr("Vuelves con una molestia y el míster no está nada contento."), fx: {fame: 2, coach: -4, inj: [1, 2]}}},
    {t: tr("Pedir quedarte alegando molestias"), p: 0.6,
      ok: {txt: tr("El seleccionador lo entiende. Descansas y el míster te lo agradece."), fx: {coach: 6, fit: 6}},
      ko: {txt: tr("El seleccionador no se lo cree y toma nota para próximas listas."), fx: {fame: -2, mor: -3}}},
    {t: tr("Ir, pero solo para jugar la mitad"), ok: {txt: tr("Acuerdas con ambos cuerpos técnicos una carga reducida."), fx: {fit: -3, fame: 1}}}
  ]; }});

EV({id: "x_traductor", tipo: "aleatoria", cat: "Adaptación", title: "Haces de traductor", w: 0.8, cd: 4,
  when: function (x) { return x.inSeason && x.age >= 20; },
  text: function () { return tr("Ha fichado un compañero que no habla ni una palabra del idioma del vestuario. El míster te pide que le hagas de traductor y guía los primeros meses."); },
  opts: function () { return [
    {t: tr("Acogerle como a un hermano"), ok: {txt: tr("Le enseñas la ciudad y las costumbres del vestuario. Os hacéis inseparables."), fx: {mor: 5, coach: 5, prof: 3, fit: -3}}},
    {t: tr("Ayudarle solo en los entrenos"), ok: {txt: tr("Traduces las instrucciones y poco más. Cumples sin desgastarte."), fx: {coach: 3}}},
    {t: tr("Decir que no tienes tiempo"), ok: {txt: tr("Alguien del club se encarga. A ti nadie te lo tiene en cuenta… del todo."), fx: {coach: -3, mor: 1}}}
  ]; }});
