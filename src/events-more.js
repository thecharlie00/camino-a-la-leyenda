/* ===== MÁS DECISIONES DEL JUGADOR =====
   Episodios reales de todas las épocas (con ref), convertidos en dilemas para tu jugador, y situaciones
   inventadas de la vida de un futbolista: redes, agentes, familia, vestuario, prensa, viajes, dinero… */
function ySal(x) { return x.p.con ? x.p.con.sal : 100000; }
function yK(v) { return Math.round(v / 1000) * 1000; }
function yAttack(x) { return x.g === "DEL" || x.g === "MED"; }
function yBottom(x) { var li = S.cl[S.p.club]; return !!S.L && !!S.L[li] && x.lgPos > S.L[li].tm.length * 0.65; }

/* ============ HECHOS REALES ============ */
EV({id: "y_botellas", tipo: "real", cat: "Patrocinio", title: "Dos botellas en la mesa", once: true, w: 1.2,
  ref: "En 2021, durante la Eurocopa, Cristiano Ronaldo apartó dos botellas de Coca-Cola, patrocinador del torneo, al sentarse en una rueda de prensa y animó a beber agua.",
  when: function (x) { return x.inSeason && x.p.fame >= 30 && x.p.prof >= 45; },
  text: function () { return tr("Te sientas en la rueda de prensa previa y delante tienes dos latas de un refresco azucarado, patrocinador de la competición. Siempre has defendido comer sano."); },
  opts: function () { return [
    {t: tr("Apartarlas y pedir agua"), d: tr("Coherente con tus ideas, aunque al patrocinador no le hará gracia."), p: 0.6,
      ok: {txt: tr("El gesto da la vuelta al mundo. Los jóvenes te aplauden."), fx: {fame: 4, fol: 80, fans: 4, prof: 2}},
      ko: {txt: tr("El patrocinador se queja al club y te cae una reprimenda."), fx: {fame: 3, fol: 50, coach: -5, money: -10000}}},
    {t: tr("Dejarlas donde están"), ok: {txt: tr("Respondes a las preguntas y nadie habla de las latas."), fx: {prof: 1}}},
    {t: tr("Hacer una broma sobre ellas"), p: 0.5,
      ok: {txt: tr("La sala se ríe y el momento se vuelve un meme simpático."), fx: {fol: 40, fans: 3}},
      ko: {txt: tr("La broma no se entiende y parece que te burlas del patrocinador."), fx: {coach: -3, fans: -2}}}
  ]; }});

EV({id: "y_escorpion", tipo: "real", cat: "Partido", title: "Un balón fácil… y una idea loca", w: 2.5, cd: 4,
  ref: "En 1995, en un amistoso en Wembley, el portero colombiano René Higuita despejó un disparo lanzándose hacia delante y golpeando el balón con los talones: el famoso «escorpión».",
  when: function (x) { return x.inSeason && x.p.pos === "POR" && x.p.fame >= 10; },
  text: function () { return tr("Partido sin nada en juego y un rival lanza un balón bombeado y flojo directo a tus manos. Por tu cabeza pasa una parada imposible para la galería."); },
  opts: function (x) { var p = clamp(0.55 + (x.p.ovr - 60) * 0.01, 0.4, 0.8); return [
    {t: tr("Intentar la parada acrobática"), d: tr("Si sale, imagen para la historia; si no, gol de chiste."), p: p,
      ok: {txt: tr("La saca con los talones. El estadio no da crédito y el vídeo arrasa."), fx: {fame: 5, fans: 6, fol: 100, coach: -3}},
      ko: {txt: tr("Calculas mal y el balón entra. El míster se lleva las manos a la cabeza."), fx: {coach: -8, fans: -3, mor: -4, fol: 30}}},
    {t: tr("Atraparla sin más"), ok: {txt: tr("Blocaje seguro. Lo aburrido también gana partidos."), fx: {coach: 2, prof: 2}}}
  ]; }});

EV({id: "y_un_club", tipo: "real", cat: "Contrato", title: "Un contrato para toda la vida", ctx: "verano", once: true, w: 5,
  ref: "En 2009, Paolo Maldini se retiró tras jugar toda su carrera profesional en el AC Milan, el club en el que había debutado en 1985.",
  when: function (x) { return x.age >= 24 && x.age <= 33 && x.yrsAtClub >= 1 && !!x.p.con && !x.p.loan; },
  text: function (x) { return tr("El {club} te ofrece un contrato hasta el final de tu carrera, con un sueldo algo menor que el actual. «Queremos que seas un hombre de un solo club.»", {club: x.club}); },
  opts: function (x) { return [
    {t: tr("Firmar para siempre"), d: tr("Seguridad y cariño de la grada a cambio de sueldo."), ok: {txt: tr("Firmas entre aplausos. Tu nombre ya va unido al del club."), fx: {yrs: Math.max(3, 35 - x.age), sal: 0.9, fans: 12, mor: 6, coach: 4}, n: tr("Contrato hasta los 35")}},
    {t: tr("Pedir el mismo sueldo"), p: 0.5,
      ok: {txt: tr("El club acepta tus condiciones. Te quedas y sin perder dinero."), fx: {yrs: Math.max(3, 35 - x.age), fans: 8, mor: 5}, n: tr("Contrato hasta los 35")},
      ko: {txt: tr("La negociación se enfría y la oferta se retira. La grada no lo entiende."), fx: {fans: -5, coach: -3}}},
    {t: tr("Dejar la puerta abierta"), ok: {txt: tr("Agradeces el gesto, pero quieres ver qué te ofrece el mercado."), fx: {fans: -3, mor: 1}}}
  ]; }});

EV({id: "y_servilleta", tipo: "real", cat: "Familia", title: "Un futuro en otro país", once: true, w: 1.5,
  ref: "En diciembre de 2000, Carles Rexach, director técnico del Barcelona, firmó en una servilleta de papel el primer compromiso del club con un Lionel Messi de 13 años, que se mudó con su familia de Argentina a Barcelona.",
  when: function (x) { return x.inSeason && x.age <= 19 && x.p.pot >= 75 && !x.abroad; },
  text: function () { return tr("Un ojeador de un club extranjero te ha visto jugar y quiere llevarte a su academia. Tu familia tendría que dejarlo todo para acompañarte."); },
  opts: function () { return [
    {t: tr("Hacer las maletas con tu familia"), d: tr("Una apuesta enorme que puede salir mal."), p: 0.55,
      ok: {txt: tr("La experiencia te hace crecer a toda velocidad, aunque al final sigues en tu club."), fx: {pot: 2, prof: 4, mor: 2}},
      ko: {txt: tr("La adaptación es durísima y vuelves a casa tras unas semanas de prueba."), fx: {mor: -6, pot: 1}}},
    {t: tr("Quedarte y crecer en casa"), ok: {txt: tr("Prefieres seguir en tu club, cerca de los tuyos. El club te lo agradece."), fx: {coach: 5, fans: 4, mor: 3}}},
    {t: tr("Usar el interés para mejorar tu contrato"), p: 0.6,
      ok: {txt: tr("Tu club reacciona y te sube el sueldo para que no te vayas."), fx: {sal: 1.2, coach: -2}},
      ko: {txt: tr("El club no se deja presionar y te mira con recelo."), fx: {coach: -5}}}
  ]; }});

EV({id: "y_foto_presidente", tipo: "real", cat: "Selección", title: "Una foto con un presidente", once: true, w: 1,
  ref: "En 2018, Mesut Özil dejó la selección alemana tras la polémica por una foto con el presidente turco Recep Tayyip Erdoğan, y denunció haber recibido un trato racista.",
  when: function (x) { return x.inSeason && x.p.fame >= 35 && x.age >= 21; },
  text: function () { return tr("El presidente de un país muy polémico, del que procede tu familia, te invita a un acto y quiere hacerse una foto contigo. Rechazarlo puede ofender a mucha gente."); },
  opts: function () { return [
    {t: tr("Hacerte la foto"), d: tr("Puede leerse como un apoyo político."), p: 0.35,
      ok: {txt: tr("La foto pasa casi desapercibida fuera de ese país."), fx: {fame: 2, mor: 2}},
      ko: {txt: tr("Estalla la polémica: te acusan de apoyar a un régimen y te pitan en el estadio."), fx: {fans: -10, fame: 3, mor: -6, coach: -3}}},
    {t: tr("Declinar con educación"), p: 0.75,
      ok: {txt: tr("Excusas de agenda y todos contentos."), fx: {prof: 2}},
      ko: {txt: tr("Parte de tu familia se siente dolida por el desplante."), fx: {mor: -4}}},
    {t: tr("Ir, pero sin foto y sin declaraciones"), p: 0.6,
      ok: {txt: tr("Cumples con tus raíces sin entrar en política."), fx: {mor: 3}},
      ko: {txt: tr("Alguien te graba de lejos y el vídeo se interpreta como quiere cada uno."), fx: {fans: -4, fame: 1}}}
  ]; }});

EV({id: "y_lagrimas", tipo: "real", cat: "Partido", title: "Una amarilla que duele", w: 1.5, cd: 4,
  ref: "En la semifinal del Mundial de 1990, Paul Gascoigne vio una amarilla que le impedía jugar una posible final y rompió a llorar en el campo. Inglaterra cayó en los penaltis ante Alemania.",
  when: function (x) { return x.inSeason && S.bi >= 2 && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Semifinal. Te sacan una amarilla que te deja fuera de la final si tu equipo pasa. Faltan veinte minutos y se te nubla la vista."); },
  opts: function (x) { var p = clamp(0.5 + x.p.prof / 300, 0.45, 0.8); return [
    {t: tr("Tragarte las lágrimas y darlo todo"), p: p,
      ok: {txt: tr("Juegas los mejores veinte minutos de tu vida por tus compañeros. La grada se emociona."), fx: {fans: 8, coach: 5, fame: 3, mor: -2}},
      ko: {txt: tr("No te quitas el golpe de la cabeza y fallas un par de balones fáciles."), fx: {form: -4, mor: -5}}},
    {t: tr("Protestar la tarjeta"), p: 0.3,
      ok: {txt: tr("El árbitro no cambia su decisión, pero tu rabia contagia al equipo."), fx: {mor: -2, fans: 3}},
      ko: {txt: tr("Te ganas la segunda amarilla. A la caseta."), fx: {susp: 1, coach: -8, mor: -6}}},
    {t: tr("Pedir el cambio"), ok: {txt: tr("El míster te sienta. Lloras en el banquillo, pero el equipo no pierde a nadie."), fx: {coach: 2, mor: -6}}}
  ]; }});

EV({id: "y_beso_calva", tipo: "real", cat: "Vestuario", title: "El ritual de la suerte", once: true, w: 1.2,
  ref: "En el Mundial de 1998, Laurent Blanc besaba la calva del portero Fabien Barthez antes de cada partido. Francia acabó ganando su primer Mundial.",
  when: function (x) { return x.inSeason && S.bi >= 1 && x.starts >= 3; },
  text: function () { return tr("El equipo lleva una racha increíble y el vestuario está convencido de que se debe a un ritual: antes de cada partido, tú y un compañero tenéis que repetir un gesto absurdo delante de todos."); },
  opts: function () { return [
    {t: tr("Seguir el ritual sin falta"), ok: {txt: tr("Nadie se atreve a romper la racha. El vestuario está más unido que nunca."), fx: {mor: 5, coach: 3, buff: {v: 0.5, b: 2, n: tr("Ritual de la suerte")}}}},
    {t: tr("Decir que no crees en supersticiones"), p: 0.5,
      ok: {txt: tr("Los resultados siguen llegando y el ritual se olvida sin dramas."), fx: {prof: 3}},
      ko: {txt: tr("Perdéis el siguiente partido y medio vestuario te culpa en broma… o no tan en broma."), fx: {mor: -4, coach: -2}}},
    {t: tr("Grabarlo para tus redes"), p: 0.6,
      ok: {txt: tr("El vídeo se hace viral y el ritual se vuelve famoso."), fx: {fol: 60, fans: 4}},
      ko: {txt: tr("Al vestuario no le gusta que airees sus cosas."), fx: {fol: 30, mor: -3, coach: -3}}}
  ]; }});

EV({id: "y_nuevo_rico", tipo: "real", cat: "Mercado", title: "El club de los petrodólares", once: true, w: 1.2,
  ref: "En enero de 2009, Kaká rechazó una oferta millonaria del Manchester City, recién comprado por un fondo de Abu Dabi, para seguir en el Milan. Ese verano fichó por el Real Madrid.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.p.ovr >= 76 && x.p.fame >= 40 && !x.p.loan && x.age <= 30; },
  text: function () { return tr("Un club recién comprado por un multimillonario te ofrece triplicar tu sueldo en pleno invierno. Tu afición se ha echado a la calle para pedirte que te quedes."); },
  opts: function () { return [
    {t: tr("Asomarte al balcón y quedarte"), ok: {txt: tr("Saludas a la gente desde la ventana de casa. Eres su ídolo."), fx: {fans: 12, mor: 6, fame: 3, coach: 3}}},
    {t: tr("Usar la oferta para renovar mejor"), p: 0.6,
      ok: {txt: tr("Tu club mejora tu contrato. La grada respira aliviada."), fx: {sal: 1.25, fans: 3}},
      ko: {txt: tr("La directiva se siente chantajeada. La relación se enfría."), fx: {coach: -6, fans: -4}}},
    {t: tr("Decir que lo estás pensando"), ok: {txt: tr("Pasan los días y la incertidumbre te pesa en el campo."), fx: {form: -4, fans: -4, fame: 2}}}
  ]; }});

EV({id: "y_bota_vestuario", tipo: "real", cat: "Vestuario", title: "Una bota por los aires", once: true, w: 1.1,
  ref: "En febrero de 2003, tras una derrota en la FA Cup, Alex Ferguson pateó una bota en el vestuario que golpeó a David Beckham en la ceja. Ese verano Beckham fichó por el Real Madrid.",
  when: function (x) { return x.inSeason && x.p.fame >= 25 && x.p.coach <= 60; },
  text: function () { return tr("Tras una derrota dolorosa, el míster estalla en el vestuario y da una patada a una bota que te golpea en la ceja. Sangras un poco y la prensa espera fuera."); },
  opts: function () { return [
    {t: tr("Salir con la herida a la vista"), d: tr("Las cámaras lo verán todo."), ok: {txt: tr("La foto sale en todas las portadas. El míster no te lo perdonará."), fx: {fame: 4, fol: 60, coach: -12, fans: 3}}},
    {t: tr("Taparte y no decir nada"), ok: {txt: tr("Un accidente es un accidente. El míster agradece tu discreción."), fx: {coach: 6, mor: -3}}},
    {t: tr("Hablarlo cara a cara con él"), p: 0.6,
      ok: {txt: tr("Se disculpa y la relación sale reforzada."), fx: {coach: 5, mor: 3}},
      ko: {txt: tr("La conversación se calienta y acaba peor que empezó."), fx: {coach: -8, mor: -4}}}
  ]; }});

EV({id: "y_dorsal", tipo: "real", cat: "Club", title: "Elegir dorsal", once: true, w: 1.3,
  ref: "En 1970, Johan Cruyff empezó a llevar el dorsal 14 en el Ajax, un número poco habitual entre los titulares, y lo convirtió en su seña de identidad.",
  when: function (x) { return x.inSeason && x.age <= 25 && x.p.fame >= 15 && x.yrsAtClub <= 1; },
  text: function () { return tr("El club ha liberado un dorsal mítico, el que llevaron sus leyendas, y te lo ofrece. También podrías quedarte con un número raro que nadie lleva y hacerlo tuyo."); },
  opts: function () { return [
    {t: tr("Aceptar el dorsal de las leyendas"), d: tr("Ilusiona, pero pesa."), p: 0.55,
      ok: {txt: tr("Lo llevas con orgullo y la grada te ve como el heredero."), fx: {fans: 8, fame: 3, mor: 3}},
      ko: {txt: tr("Cada mal partido se compara con las leyendas. La presión se nota."), fx: {fans: 2, form: -4, mor: -4}}},
    {t: tr("Elegir un número raro"), ok: {txt: tr("Tu número será tuyo y de nadie más. Las camisetas se venden bien."), fx: {fol: 30, fame: 2, mor: 2}}},
    {t: tr("Dejárselo a un veterano"), ok: {txt: tr("El vestuario aplaude tu humildad."), fx: {coach: 4, mor: 2, prof: 2}}}
  ]; }});

EV({id: "y_democracia", tipo: "real", cat: "Vestuario", title: "Votar en el vestuario", once: true, w: 1.5,
  ref: "A principios de los años 80, Sócrates encabezó la «Democracia Corinthiana»: los jugadores del Corinthians decidían por votación asuntos del club, como las concentraciones antes de los partidos.",
  when: function (x) { return x.inSeason && x.age >= 22 && x.yrsAtClub >= 1; },
  text: function () { return tr("La plantilla propone votar si se acaban las concentraciones en el hotel la noche antes de jugar en casa. La directiva está en contra y tu voto puede decidirlo."); },
  opts: function () { return [
    {t: tr("Votar por acabar con ellas"), p: 0.55,
      ok: {txt: tr("Gana el sí. Dormir en casa sienta bien y el equipo responde con resultados."), fx: {mor: 6, form: 2, coach: -3}},
      ko: {txt: tr("Gana el sí, pero los resultados empeoran y la directiva os señala."), fx: {mor: 2, coach: -6, fans: -3}}},
    {t: tr("Votar por mantenerlas"), ok: {txt: tr("Te ganas a la directiva, aunque algunos compañeros te miran mal."), fx: {coach: 5, mor: -3}}},
    {t: tr("Proponer una solución intermedia"), ok: {txt: tr("Concentración solo antes de los partidos grandes. Todos ceden un poco."), fx: {mor: 2, coach: 2, prof: 2}}}
  ]; }});

EV({id: "y_miedo_volar", tipo: "real", cat: "Salud", title: "Miedo a volar", once: true, w: 1.2,
  ref: "Dennis Bergkamp tenía tanto miedo a volar que dejó de viajar en avión, y se perdió muchos partidos fuera de casa con el Arsenal y con la selección de Países Bajos.",
  when: function (x) { return x.inSeason && x.age >= 20; },
  text: function () { return tr("Tras un vuelo con turbulencias terribles, el simple hecho de pensar en un avión te provoca ansiedad. La semana que viene hay un viaje largo."); },
  opts: function () { return [
    {t: tr("Terapia para superar el miedo (15 k€)"), p: 0.75,
      ok: {txt: tr("Unas sesiones bien hechas y vuelves a volar con calma."), fx: {money: -15000, mor: 5, prof: 2}},
      ko: {txt: tr("Mejora algo, pero cada vuelo sigue siendo un mal trago."), fx: {money: -15000, mor: -2}}},
    {t: tr("Viajar por carretera por tu cuenta"), ok: {txt: tr("Horas y horas de coche. Llegas cansado y el míster no lo ve claro."), fx: {fit: -6, coach: -3, mor: 2}}},
    {t: tr("Aguantar en silencio"), p: 0.5,
      ok: {txt: tr("Cierras los ojos, auriculares y a contar minutos. Lo superas."), fx: {mor: 1}},
      ko: {txt: tr("Lo pasas fatal y juegas el partido sin haber dormido."), fx: {form: -5, mor: -4}}}
  ]; }});

EV({id: "y_brazalete_compa", tipo: "real", cat: "Vestuario", title: "Que levante él la copa", once: true, w: 2.5,
  ref: "En 2011, Éric Abidal jugó la final de la Champions con el Barcelona poco más de dos meses después de ser operado de un tumor en el hígado. El capitán, Carles Puyol, le cedió el brazalete para que fuera el primero en levantar la copa.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.age >= 23 && (!!x.p.flags.captain || x.yrsAtClub >= 1); },
  text: function () { return tr("Un compañero ha vuelto a jugar tras superar una enfermedad grave y hoy disputáis una final. Si ganáis, como uno de los líderes del vestuario te tocaría levantar el trofeo."); },
  opts: function () { return [
    {t: tr("Cederle el honor de levantarlo"), ok: {txt: tr("Si llega el trofeo, lo levantará él. El gesto emociona a todo el país."), fx: {fans: 10, fame: 4, mor: 6, coach: 5, prof: 3}}},
    {t: tr("Levantarlo juntos"), ok: {txt: tr("Lo acordáis entre risas: cuatro manos para un trofeo."), fx: {fans: 6, mor: 5, coach: 3}}},
    {t: tr("Centrarte solo en ganar"), ok: {txt: tr("Ya habrá tiempo para gestos. Hoy toca competir."), fx: {prof: 2, form: 2}}}
  ]; }});

EV({id: "y_descanso_remontada", tipo: "real", cat: "Partido", title: "0-3 al descanso", w: 1.5, cd: 4,
  ref: "En la final de la Champions de 2005, en Estambul, el Liverpool perdía 0-3 al descanso ante el Milan. Empató en seis minutos de la segunda parte y ganó en los penaltis.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.age >= 22 && x.starts >= 3 && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Eliminatoria decisiva y perdéis 0-3 al descanso. En el vestuario nadie habla y el míster te mira a ti."); },
  opts: function (x) { var p = clamp(0.2 + x.p.fame / 300 + (x.p.ovr - x.clubR) * 0.02, 0.12, 0.45); return [
    {t: tr("Levantar la voz y pedir la remontada"), d: tr("Si sale, se recordará siempre."), p: p,
      ok: {txt: tr("Tres goles en un abrir y cerrar de ojos y el partido es vuestro. Noche histórica."), fx: {fame: 6, fans: 10, mor: 10, coach: 6, fol: 100}},
      ko: {txt: tr("Lo intentáis con todo, pero no llega. Al menos salvasteis el orgullo."), fx: {mor: -3, fans: 3, coach: 2}}},
    {t: tr("Pedir calma y maquillar el resultado"), ok: {txt: tr("Evitáis una goleada mayor. La eliminatoria está casi perdida."), fx: {mor: -4, coach: 2}}},
    {t: tr("Dejar hablar al míster"), ok: {txt: tr("El míster da su charla. Tú te limitas a escuchar."), fx: {mor: -2}}}
  ]; }});

EV({id: "y_mejor_que", tipo: "real", cat: "Partido", title: "«Demuestra que eres el mejor»", w: 4, cd: 4,
  ref: "En la final del Mundial de 2014, Joachim Löw le dijo a Mario Götze antes de saltar al campo: «Demuestra al mundo que eres mejor que Messi». Götze marcó el gol del título en la prórroga.",
  when: function (x) { return x.inSeason && yAttack(x) && x.role !== "Estrella" && (!!x.cupAlive() || !!x.aliveKO()); },
  text: function () { return tr("Partido decisivo: hoy empiezas en el banquillo y entras en la prórroga. Antes de entrar, el míster te agarra del brazo: «Demuestra a todos que eres mejor que su estrella»."); },
  opts: function (x) { var p = clamp(x.scoreP() * 0.8 + 0.1, 0.1, 0.45); return [
    {t: tr("Buscar el gol a toda costa"), p: p,
      ok: {txt: tr("Controlas con el pecho y la empalas. ¡Gol! El héroe que nadie esperaba."), fx: {fame: 7, fans: 10, mor: 10, coach: 6, fol: 120}},
      ko: {txt: tr("Lo intentas todo, pero el gol no llega. Te vas con la cabeza alta."), fx: {mor: -2, coach: 1}}},
    {t: tr("Jugar para el equipo"), ok: {txt: tr("Presionas, combinas y das aire a los tuyos. El míster lo valora."), fx: {coach: 5, prof: 2}}}
  ]; }});

EV({id: "y_platano", tipo: "real", cat: "Afición", title: "Algo cae desde la grada", w: 0.8, cd: 8,
  ref: "En abril de 2014, en un partido en Villarreal, Dani Alves recogió un plátano que le habían lanzado desde la grada en un gesto racista, le dio un mordisco y sacó el córner.",
  when: function (x) { return x.inSeason && x.p.fame >= 15; },
  text: function () { return tr("Vas a sacar un córner y desde la grada te lanzan un objeto acompañado de insultos racistas. El partido sigue y el árbitro no parece haberlo visto."); },
  opts: function () { return [
    {t: tr("Responder con humor y seguir jugando"), p: 0.7,
      ok: {txt: tr("Tu gesto desarma a los racistas y recorre el mundo."), fx: {fame: 5, fans: 8, fol: 100, mor: 3}},
      ko: {txt: tr("Hay quien no entiende el gesto y la polémica se desvía de lo importante."), fx: {fame: 2, mor: -3}}},
    {t: tr("Pedir al árbitro que pare el partido"), p: 0.6,
      ok: {txt: tr("Se activa el protocolo y el club rival identifica al responsable."), fx: {fame: 3, fans: 6, mor: 4, prof: 2}},
      ko: {txt: tr("El árbitro no actúa y te pide que sigas. Te sientes solo."), fx: {mor: -6, fans: 3}}},
    {t: tr("Denunciarlo tras el partido"), ok: {txt: tr("Tu denuncia en redes abre un debate y la liga promete medidas."), fx: {fans: 4, fol: 40, mor: 1}}}
  ]; }});

EV({id: "y_descenso_quedarse", tipo: "real", cat: "Club", title: "Quedarse en la caída", once: true, w: 2,
  ref: "En 2006, la Juventus fue enviada a la Serie B por el escándalo Calciopoli. Estrellas como Alessandro Del Piero, Gianluigi Buffon y Pavel Nedvěd se quedaron y la ayudaron a volver a Primera al año siguiente.",
  when: function (x) { return x.inSeason && S.bi >= 2 && x.yrsAtClub >= 1 && x.p.fame >= 20 && !x.p.loan && yBottom(x); },
  text: function (x) { return tr("El {club} está en la zona baja, el descenso asoma y varios clubes ya preguntan por ti. La grada quiere saber si te quedarás pase lo que pase.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Prometer que te quedarás"), ok: {txt: tr("«Con el club, en las buenas y en las malas.» Te conviertes en un símbolo."), fx: {fans: 12, mor: 4, coach: 4, fame: 2}}},
    {t: tr("No prometer nada"), ok: {txt: tr("Prefieres no mentir. La grada se queda con la duda."), fx: {fans: -3, prof: 1}}},
    {t: tr("Decir que mereces jugar en la élite"), p: 0.5,
      ok: {txt: tr("Lo dices con respeto y la mayoría lo entiende."), fx: {fans: -3, fame: 2}},
      ko: {txt: tr("Se interpreta como una huida. Te pitan en el siguiente partido."), fx: {fans: -12, mor: -4}}}
  ]; }});

EV({id: "y_no_calentar", tipo: "real", cat: "Vestuario", title: "«Sal a calentar»", w: 1.5, cd: 4,
  ref: "En septiembre de 2011, según su entrenador Roberto Mancini, Carlos Tévez se negó a salir a calentar en un partido de Champions del Manchester City en Múnich. Pasó meses apartado del equipo.",
  when: function (x) { return x.inSeason && (x.role === "Suplente" || x.role === "Rotación") && x.p.coach <= 60 && x.age >= 21; },
  text: function () { return tr("Llevas semanas sin jugar y con la sensación de que el míster te ignora. Perdéis por dos goles a falta de quince minutos y te manda calentar."); },
  opts: function () { return [
    {t: tr("Calentar y salir con rabia"), p: 0.5,
      ok: {txt: tr("Entras como un ciclón y das una asistencia. El míster toma nota."), fx: {coach: 6, mor: 4, fans: 3}},
      ko: {txt: tr("Apenas tocas el balón. Al menos has cumplido."), fx: {coach: 2, mor: -2}}},
    {t: tr("Negarte"), d: tr("Un gesto que puede costarte muy caro."), ok: {txt: tr("El míster lo cuenta en rueda de prensa. Multa y apartado del grupo."), fx: {coach: -18, fans: -8, money: -yK(25000), mor: -4, fame: 2}}},
    {t: tr("Calentar sin ganas"), ok: {txt: tr("Te ve el banquillo entero. El míster ni te saca."), fx: {coach: -5, mor: -2}}}
  ]; }});

EV({id: "y_beso_directo", tipo: "real", cat: "Prensa", title: "Entrevista con tu pareja", once: true, w: 1,
  ref: "En 2010, tras ganar el Mundial, Iker Casillas besó en directo a la periodista Sara Carbonero, su pareja, en mitad de una entrevista a pie de campo.",
  when: function (x) { return x.inSeason && x.age >= 21 && x.p.fame >= 30; },
  text: function () { return tr("Tu pareja es periodista y le toca entrevistarte a pie de campo justo después de un partido enorme. Todo el país está mirando."); },
  opts: function () { return [
    {t: tr("Darle un beso en directo"), p: 0.7,
      ok: {txt: tr("La imagen se vuelve icónica y medio mundo sonríe."), fx: {fame: 4, fol: 120, fans: 5, mor: 5}},
      ko: {txt: tr("Su cadena critica que se mezcle lo personal con lo profesional."), fx: {fame: 3, fol: 60, mor: -3}}},
    {t: tr("Responder con profesionalidad"), ok: {txt: tr("Una entrevista impecable. Ya lo celebraréis en casa."), fx: {prof: 3, mor: 2}}},
    {t: tr("Pedir que te entreviste otra persona"), ok: {txt: tr("Evitas las bromas, aunque alguien en la redacción se lo toma mal."), fx: {prof: 1}}}
  ]; }});

EV({id: "y_corazon", tipo: "real", cat: "Salud", title: "Algo raro en el corazón", once: true, w: 0.8,
  ref: "En 1996, tras ganar el oro olímpico con Nigeria, a Nwankwo Kanu le detectaron una anomalía cardiaca en el reconocimiento médico del Inter de Milán. Se operó y volvió a jugar durante muchos años.",
  when: function (x) { return x.inSeason && x.age >= 19 && x.age <= 30; },
  text: function () { return tr("En una prueba médica rutinaria aparece una pequeña anomalía en tu corazón. Los médicos recomiendan una operación preventiva que te tendría parado unas semanas."); },
  opts: function () { return [
    {t: tr("Operarte ahora"), ok: {txt: tr("La operación sale bien. Unas semanas fuera y tranquilidad para siempre."), fx: {inj: [4, 6], mor: 4, prof: 3, injMul: 0.95}}},
    {t: tr("Pedir una segunda opinión (20 k€)"), p: 0.6,
      ok: {txt: tr("Otro especialista confirma que no hace falta operar. Revisiones y a jugar."), fx: {money: -20000, mor: 5}},
      ko: {txt: tr("La segunda opinión coincide con la primera. Acabas pasando por quirófano."), fx: {money: -20000, inj: [4, 6], mor: 2}}},
    {t: tr("Aplazarlo hasta el verano"), p: 0.75,
      ok: {txt: tr("Terminas la temporada sin problemas, aunque con la cabeza en otra parte."), fx: {mor: -4, form: -2}},
      ko: {txt: tr("Un mareo en pleno entrenamiento te obliga a operarte de urgencia."), fx: {inj: [5, 8], mor: -6, coach: -2}}}
  ]; }});

EV({id: "y_plancha", tipo: "real", cat: "Partido", title: "Reírte de tu fama", once: true, w: 1.3,
  ref: "En 1994, Jürgen Klinsmann, con fama de tirarse en el área, llegó a la Premier y celebró su primer gol con el Tottenham lanzándose en plancha sobre el césped, junto a sus compañeros.",
  when: function (x) { return x.inSeason && yAttack(x) && x.yrsAtClub <= 1 && x.p.tx.length > 0 && x.p.fame >= 15; },
  text: function () { return tr("Llegas a tu nuevo club con fama de exagerar las faltas y la prensa local te ha recibido con burlas. Si marcas en el debut, ¿cómo lo celebras?"); },
  opts: function () { return [
    {t: tr("Tirarte en plancha para reírte de ti"), p: 0.75,
      ok: {txt: tr("Toda la plantilla se tira contigo. La grada te adopta al instante."), fx: {fans: 10, fame: 3, fol: 60, mor: 4}},
      ko: {txt: tr("Algunos lo ven como una provocación y la burla se alarga."), fx: {fans: -2, fame: 2}}},
    {t: tr("Celebrar con naturalidad"), ok: {txt: tr("Un gol y un abrazo. Dejarás que el tiempo cambie tu fama."), fx: {mor: 2, coach: 2}}},
    {t: tr("Responder a la prensa en zona mixta"), p: 0.4,
      ok: {txt: tr("Tu respuesta ingeniosa se gana a los periodistas."), fx: {fame: 3, fans: 3}},
      ko: {txt: tr("Te pones a la defensiva y das más munición."), fx: {fans: -4, mor: -3}}}
  ]; }});

EV({id: "y_cuna", tipo: "real", cat: "Familia", title: "Un bebé en plena concentración", once: true, w: 1.1,
  ref: "En el Mundial de 1994, Bebeto, que acababa de ser padre, celebró un gol ante Países Bajos meciendo un bebé imaginario junto a Romário y Mazinho.",
  when: function (x) { return x.inSeason && x.age >= 23 && x.age <= 36; },
  text: function () { return tr("Tu pareja se pone de parto en mitad de la concentración, dos días antes de un partido clave. Estás a cientos de kilómetros."); },
  opts: function () { return [
    {t: tr("Volver corriendo a casa"), d: tr("Te perderás el partido."), ok: {txt: tr("Llegas a tiempo para ver nacer a tu hijo. Nada en el mundo vale más."), fx: {mor: 12, coach: -4, form: -2}}},
    {t: tr("Quedarte y dedicarle el partido"), p: 0.5,
      ok: {txt: tr("Marcas, meces un bebé imaginario y medio planeta se emociona."), fx: {mor: 4, fans: 8, fol: 80, fame: 3}},
      ko: {txt: tr("No te lo quitas de la cabeza y juegas fatal. Te pesa no haber ido."), fx: {mor: -8, form: -4}}},
    {t: tr("Ir y volver en el día"), p: 0.6,
      ok: {txt: tr("Un viaje de locos que sale bien: abrazo al bebé y llegas al partido."), fx: {mor: 8, fit: -8}},
      ko: {txt: tr("El vuelo se retrasa y no llegas a ninguna de las dos cosas a tiempo."), fx: {mor: -4, coach: -5, fit: -6}}}
  ]; }});

EV({id: "y_adios_seleccion", tipo: "real", cat: "Selección", title: "¿Dejar la selección?", once: true, w: 1.2,
  ref: "En 2016, tras perder su tercera final seguida con Argentina, en la Copa América ante Chile, Lionel Messi anunció que dejaba la selección. Semanas después dio marcha atrás.",
  when: function (x) { return x.inSeason && x.age >= 24 && x.p.intl.caps >= 20 && x.p.fame >= 45; },
  text: function () { return tr("Otra derrota dolorosa con tu selección y otra lluvia de críticas. En caliente, sientes que no quieres volver a ponerte esa camiseta."); },
  opts: function () { return [
    {t: tr("Anunciar tu adiós en caliente"), p: 0.5,
      ok: {txt: tr("El país entero te pide que vuelvas. Al final das marcha atrás y te reciben como a un héroe."), fx: {fame: 5, fans: 8, mor: 4}},
      ko: {txt: tr("Te acusan de abandonar el barco. Tu vuelta se hace incómoda."), fx: {fame: 2, fans: -6, mor: -6}}},
    {t: tr("Dejar pasar unos días"), ok: {txt: tr("Con la cabeza fría, decides seguir luchando."), fx: {prof: 3, mor: 2}}},
    {t: tr("Hablar con el seleccionador"), ok: {txt: tr("Te escucha y te da un papel con más apoyo. Sales reforzado."), fx: {mor: 4, fame: 1}}}
  ]; }});

EV({id: "y_pancarta_gracias", tipo: "real", cat: "Selección", title: "Jugar por un país herido", once: true, w: 1,
  ref: "En 2011, meses después del terremoto y el tsunami que devastaron su país, Japón ganó el Mundial femenino. Tras los partidos, sus jugadoras desplegaban una pancarta para agradecer el apoyo del mundo.",
  when: function (x) { return x.inSeason && x.p.intl.caps >= 3 && x.age >= 20; },
  text: function () { return tr("Una catástrofe natural ha golpeado a tu país semanas antes de un torneo. La selección debate cómo mostrar su apoyo a las víctimas."); },
  opts: function () { return [
    {t: tr("Proponer una pancarta de agradecimiento"), ok: {txt: tr("El gesto emociona y une a todo el equipo."), fx: {mor: 6, fans: 6, fame: 3}}},
    {t: tr("Donar tus primas del torneo"), ok: {txt: tr("Tu donación anima a otros a sumarse."), fx: {money: -yK(30000), fans: 8, fame: 4, mor: 5}}},
    {t: tr("Centrarte en jugar"), ok: {txt: tr("La mejor forma de ayudar es dar alegrías en el campo."), fx: {prof: 2, form: 2}}}
  ]; }});

EV({id: "y_siete_mundiales", tipo: "real", cat: "Selección", title: "Una convocatoria más", once: true, w: 1.5,
  ref: "En 2019, la brasileña Formiga disputó su séptimo Mundial, un récord absoluto, 24 años después de jugar el primero.",
  when: function (x) { return x.inSeason && x.age >= 33 && x.p.intl.caps >= 15; },
  text: function () { return tr("Tienes más de treinta años y el seleccionador te llama para otro gran torneo. En la prensa hay quien dice que deberías dejar paso a los jóvenes."); },
  opts: function () { return [
    {t: tr("Ir y batir otro récord"), ok: {txt: tr("Cada partido es historia. Los jóvenes aprenden de ti."), fx: {fame: 4, fans: 5, fit: -6, mor: 4}}},
    {t: tr("Ceder tu sitio a un joven"), ok: {txt: tr("Un adiós generoso. El país te lo agradece."), fx: {fans: 8, mor: 2, fit: 6, prof: 3}}},
    {t: tr("Ir como suplente de lujo"), ok: {txt: tr("Tu papel es el de mentor del grupo. Pocos minutos, mucho peso."), fx: {mor: 3, coach: 3, fame: 2}}}
  ]; }});

EV({id: "y_pregunta_gala", tipo: "real", cat: "Prensa", title: "Una pregunta fuera de lugar", once: true, w: 1.3,
  ref: "En 2018, nada más recibir el primer Balón de Oro femenino, Ada Hegerberg tuvo que escuchar cómo el presentador de la gala le preguntaba si sabía hacer twerking.",
  when: function (x) { return x.p.fame >= 40 && x.p.awards.length >= 1; },
  text: function () { return tr("Recibes un premio importante y, sobre el escenario, el presentador te hace una pregunta humillante que nada tiene que ver con el fútbol."); },
  opts: function () { return [
    {t: tr("Responder con un «no» seco"), ok: {txt: tr("Tu respuesta tajante se aplaude en todo el mundo."), fx: {fame: 4, fans: 5, fol: 60}}},
    {t: tr("Reírte para no estropear la gala"), ok: {txt: tr("Salvas el momento, pero luego te escuece no haber dicho nada."), fx: {mor: -4, fame: 2}}},
    {t: tr("Hablar de ello en redes al día siguiente"), p: 0.7,
      ok: {txt: tr("Tu mensaje abre un debate necesario y recibes mucho apoyo."), fx: {fans: 6, fol: 80, fame: 3}},
      ko: {txt: tr("Una parte de las redes te acusa de exagerar."), fx: {fol: 40, mor: -3}}}
  ]; }});

EV({id: "y_gol_mil", tipo: "real", cat: "Récord", title: "Un gol para los niños", once: true, w: 1.5,
  ref: "En 1969, Pelé marcó su gol número mil, de penalti, en Maracaná, y se lo dedicó a los niños de Brasil.",
  when: function (x) { return x.inSeason && x.g === "DEL" && x.p.fame >= 45 && x.age >= 26; },
  text: function () { return tr("Estás a punto de alcanzar una cifra redonda de goles en tu carrera. La prensa quiere saber a quién se lo dedicarás."); },
  opts: function () { return [
    {t: tr("A los niños que juegan en la calle"), ok: {txt: tr("Tus palabras se citan en todos los medios y en los colegios."), fx: {fans: 8, fame: 4, fol: 60, mor: 3}}},
    {t: tr("A tu familia"), ok: {txt: tr("Un recuerdo para los que te apoyaron desde el principio."), fx: {mor: 6, fans: 3}}},
    {t: tr("No pensar en la cifra"), p: 0.6,
      ok: {txt: tr("Sin presión, el gol llega solo."), fx: {prof: 3, form: 2}},
      ko: {txt: tr("La cifra te obsesiona igualmente y pasas varios partidos sin marcar."), fx: {form: -4, mor: -3}}}
  ]; }});

EV({id: "y_camiseta_colores", tipo: "real", cat: "Imagen", title: "Una camiseta chillona", once: true, w: 2.5,
  ref: "En el Mundial de 1994, el portero mexicano Jorge Campos jugó con camisetas de colores chillones que él mismo diseñaba.",
  when: function (x) { return x.inSeason && x.p.pos === "POR" && x.p.fame >= 15; },
  text: function () { return tr("La marca de tu equipación te deja diseñar tus propias camisetas de portero. Puedes ir a lo seguro o atreverte con algo que no pase desapercibido."); },
  opts: function () { return [
    {t: tr("Colores imposibles"), p: 0.65,
      ok: {txt: tr("Tu camiseta se convierte en objeto de culto. Se agota en las tiendas."), fx: {fame: 4, fol: 80, money: yK(20000), fans: 4}},
      ko: {txt: tr("Las burlas no paran y el árbitro te pide cambiarla por confundirse con el rival."), fx: {fol: 30, mor: -3, coach: -2}}},
    {t: tr("Un diseño clásico"), ok: {txt: tr("Elegante y sobrio. Nadie se queja."), fx: {prof: 1}}},
    {t: tr("Dejar que la diseñen los aficionados"), ok: {txt: tr("Un concurso en redes con miles de propuestas. La grada se siente parte."), fx: {fans: 6, fol: 40}}}
  ]; }});

EV({id: "y_portero_faltas", tipo: "real", cat: "Partido", title: "El portero quiere tirar", once: true, w: 2.5,
  ref: "En los años 90, el portero paraguayo José Luis Chilavert lanzaba faltas y penaltis, y marcó decenas de goles a lo largo de su carrera.",
  when: function (x) { return x.inSeason && x.p.pos === "POR" && x.age >= 22 && x.p.ovr >= 60; },
  text: function () { return tr("En los entrenamientos clavas las faltas mejor que los delanteros. Hay una falta en la frontal rival y te pica el gusanillo de pedírsela al míster."); },
  opts: function () { return [
    {t: tr("Pedirle la falta"), d: tr("Si fallas, el contragolpe con la portería vacía da miedo."), p: 0.3,
      ok: {txt: tr("¡Gol del portero! La escuadra y el estadio en pie."), fx: {fame: 6, fans: 10, fol: 120, mor: 8}},
      ko: {txt: tr("Al travesaño, y vuelves corriendo como puedes mientras el rival contraataca."), fx: {coach: -6, fans: -2, mor: -3}}},
    {t: tr("Proponerlo solo para penaltis"), p: 0.5,
      ok: {txt: tr("El míster acepta que seas el tercero en la lista de lanzadores."), fx: {coach: 2, mor: 3}},
      ko: {txt: tr("El míster se ríe y lo descarta."), fx: {mor: -1}}},
    {t: tr("Quedarte bajo palos"), ok: {txt: tr("Tu sitio es la portería. Ya marcarás en los entrenos."), fx: {coach: 2}}}
  ]; }});

EV({id: "y_partido_benefico", tipo: "real", cat: "Compromiso", title: "Un partido benéfico", once: true, w: 1,
  ref: "En 1920, el Dick, Kerr Ladies jugó un partido benéfico en Goodison Park ante más de 50.000 espectadores. Al año siguiente, la federación inglesa prohibió el fútbol femenino en los campos de sus clubes.",
  when: function (x) { return x.inSeason && x.age >= 19 && x.p.fame >= 15; },
  text: function () { return tr("Te invitan a un partido benéfico para recaudar fondos para familias sin recursos. Es en tu día libre y el club no lo ve con buenos ojos por el riesgo de lesión."); },
  opts: function () { return [
    {t: tr("Jugar el partido"), p: 0.85,
      ok: {txt: tr("Estadio lleno y una recaudación enorme. Merecía la pena."), fx: {fans: 8, fame: 3, mor: 5, fit: -4, coach: -2}},
      ko: {txt: tr("Una entrada absurda y te vas con un golpe en el tobillo. El club no está contento."), fx: {fans: 6, inj: [1, 2], coach: -6}}},
    {t: tr("Hacer de entrenador ese día"), ok: {txt: tr("Desde la banda te diviertes igual y no arriesgas nada."), fx: {fans: 5, mor: 3}}},
    {t: tr("Donar dinero y quedarte en casa"), ok: {txt: tr("Una buena aportación y descanso. Todos contentos."), fx: {money: -yK(15000), fans: 3, fit: 2}}}
  ]; }});

/* ============ SITUACIONES INVENTADAS ============ */
EV({id: "y_agente_doble", tipo: "aleatoria", cat: "Agente", title: "Tu agente juega a dos bandas", w: 1, cd: 4,
  when: function (x) { return x.inSeason && x.p.agent >= 1 && x.age >= 19; },
  text: function () { return tr("Descubres que tu agente también representa al jugador con el que compites por el puesto, y que le ha movido para un club que te interesaba a ti."); },
  opts: function () { return [
    {t: tr("Exigirle explicaciones"), p: 0.6,
      ok: {txt: tr("Se disculpa y te asegura prioridad. Esta vez le crees."), fx: {mor: 3}},
      ko: {txt: tr("Te da largas. Sospechas que te ha usado de moneda de cambio."), fx: {mor: -5}}},
    {t: tr("Romper con él"), d: tr("Te quedas sin agente hasta que busques otro."), ok: {txt: tr("Pagas la rescisión, pero duermes tranquilo."), fx: {agent: 0, money: -yK(20000), mor: 2, prof: 2}}},
    {t: tr("No decir nada y vigilar"), ok: {txt: tr("Lo apuntas. La confianza ya no es la misma."), fx: {mor: -2}}}
  ]; }});

EV({id: "y_streaming", tipo: "aleatoria", cat: "Redes", title: "Tu propio canal en directo", once: true, w: 1.2,
  when: function (x) { return x.age >= 18 && x.age <= 30 && x.p.fame >= 15; },
  text: function () { return tr("Una plataforma de directos te ofrece un contrato por emitir tres noches a la semana jugando y charlando con tus seguidores."); },
  opts: function (x) { var m = yK(Math.max(20000, ySal(x) * 0.12)); return [
    {t: tr("Firmar y emitir"), d: tr("Dinero y seguidores, pero muchas horas de pantalla."), p: 0.6,
      ok: {txt: tr("Tus directos son un éxito y tu comunidad crece sin parar."), fx: {money: m, fol: Math.round(x.p.fame * 6), fame: 3, fit: -4}},
      ko: {txt: tr("Un comentario en directo sobre el míster se hace viral. Te toca disculparte."), fx: {money: m, fol: 60, coach: -8}}},
    {t: tr("Solo directos ocasionales"), ok: {txt: tr("Un directo al mes, sin contrato. Tus seguidores lo agradecen."), fx: {fol: 40, mor: 2}}},
    {t: tr("Rechazarlo"), ok: {txt: tr("Prefieres desconectar de las pantallas."), fx: {prof: 2, fit: 2}}}
  ]; }});

EV({id: "y_hermano", tipo: "aleatoria", cat: "Familia", title: "Tu hermano en la cantera", once: true, w: 1,
  when: function (x) { return x.inSeason && x.age >= 20 && x.age <= 30 && x.yrsAtClub >= 1; },
  text: function () { return tr("Tu hermano pequeño juega en las categorías inferiores del club y no le va bien. Tu familia te pide que hables con el director deportivo para que no le den la baja."); },
  opts: function () { return [
    {t: tr("Hablar con el director deportivo"), p: 0.6,
      ok: {txt: tr("Le dan otra temporada. Tu familia te lo agradece."), fx: {mor: 5, coach: -3}},
      ko: {txt: tr("El club no cede y encima te ven como alguien que pide favores."), fx: {coach: -6, mor: -4}}},
    {t: tr("Entrenar con él por tu cuenta"), ok: {txt: tr("Sesiones extra los domingos. Él mejora y vosotros os unís más."), fx: {mor: 6, fit: -4, prof: 2}}},
    {t: tr("No meterte"), ok: {txt: tr("Le explicas que debe ganárselo solo. En casa hay mal ambiente unos días."), fx: {mor: -4, prof: 3}}}
  ]; }});

EV({id: "y_padre_agente", tipo: "aleatoria", cat: "Familia", title: "Tu padre quiere ser tu agente", once: true, w: 1.1,
  when: function (x) { return x.age <= 22 && x.p.fame >= 10; },
  text: function () { return tr("Tu padre ha dejado su trabajo y quiere encargarse de tus contratos. No tiene experiencia, pero dice que nadie te va a defender como él."); },
  opts: function () { return [
    {t: tr("Dejar que lo intente"), p: 0.4,
      ok: {txt: tr("Aprende rápido y negocia con uñas y dientes. Sorpresa."), fx: {agent: 1, mor: 6}},
      ko: {txt: tr("Discute con medio club y las negociaciones se atascan."), fx: {agent: 0, coach: -6, mor: -3}}},
    {t: tr("Contratar a un profesional"), ok: {txt: tr("Tu padre se enfada un tiempo, pero lo acaba entendiendo."), fx: {agent: Math.max(1, S.p.agent), mor: -4, prof: 2}}},
    {t: tr("Que trabaje junto a un agente"), ok: {txt: tr("Él se ocupa de lo personal y el agente, de los contratos. Equilibrio."), fx: {mor: 3, money: -yK(10000)}}}
  ]; }});

EV({id: "y_botas_nuevas", tipo: "aleatoria", cat: "Patrocinio", title: "Botas recién salidas de la caja", w: 0.8, cd: 5,
  when: function (x) { return x.inSeason && x.p.fame >= 20; },
  text: function () { return tr("Tu marca de botas te envía el último modelo y quiere que lo estrenes en el partido de mañana, que retransmiten en medio mundo. Aún no las has probado."); },
  opts: function () { return [
    {t: tr("Estrenarlas mañana"), d: tr("La marca paga un extra, pero tus pies podrían sufrir."), p: 0.6,
      ok: {txt: tr("Te sientan como un guante. La marca está encantada."), fx: {money: yK(15000), fame: 1}},
      ko: {txt: tr("Ampollas a la media hora. Juegas fatal."), fx: {money: yK(15000), form: -5, fit: -3}}},
    {t: tr("Usar tus botas viejas"), ok: {txt: tr("La marca refunfuña, pero tus pies te lo agradecen."), fx: {prof: 2, money: -yK(5000)}}},
    {t: tr("Probarlas en el calentamiento y decidir"), p: 0.7,
      ok: {txt: tr("Van bien y las usas. Prudencia y negocio."), fx: {money: yK(10000)}},
      ko: {txt: tr("No te convencen y las cambias. La marca lo nota."), fx: {money: -yK(3000)}}}
  ]; }});

EV({id: "y_hackeo", tipo: "aleatoria", cat: "Redes", title: "Te han hackeado la cuenta", w: 0.8, cd: 7,
  when: function (x) { return x.p.fame >= 20 && x.p.fol >= 50; },
  text: function () { return tr("Alguien ha entrado en tu cuenta y ha publicado mensajes ofensivos contra tu propio club. Tus seguidores no saben si eres tú."); },
  opts: function (x) { return [
    {t: tr("Pagar a expertos en seguridad (10 k€)"), ok: {txt: tr("Recuperas la cuenta en horas y explicas lo ocurrido."), fx: {money: -10000, fans: 2, coach: 2}}},
    {t: tr("Grabar un vídeo explicándolo"), p: 0.7,
      ok: {txt: tr("La gente te cree y la anécdota acaba en broma."), fx: {fol: 20, fans: 3}},
      ko: {txt: tr("Hay quien piensa que es una excusa para unos mensajes tuyos."), fx: {fans: -6, coach: -4}}},
    {t: tr("Cerrar la cuenta y abrir otra"), ok: {txt: tr("Empiezas de cero. Pierdes buena parte de tus seguidores."), fx: {fol: -Math.round(x.p.fol * 0.4), mor: 2}}}
  ]; }});

EV({id: "y_casa_apuestas", tipo: "aleatoria", cat: "Patrocinio", title: "Una casa de apuestas llama", once: true, w: 1,
  when: function (x) { return x.p.fame >= 25 && x.age >= 20; },
  text: function () { return tr("Una casa de apuestas te ofrece mucho dinero por ser su imagen. Varias asociaciones de familias critican a los futbolistas que se prestan a esas campañas."); },
  opts: function (x) { var m = yK(Math.max(40000, ySal(x) * 0.25)); return [
    {t: tr("Firmar"), d: tr("Mucho dinero, pero tu imagen puede resentirse."), p: 0.45,
      ok: {txt: tr("La campaña pasa sin demasiado ruido y tu cuenta lo nota."), fx: {money: m}},
      ko: {txt: tr("Las críticas te llueven. Muchos padres dejan de comprar tu camiseta."), fx: {money: m, fans: -8, fame: -2}}},
    {t: tr("Rechazarlo públicamente"), ok: {txt: tr("Explicas por qué no lo harás. Las familias te aplauden."), fx: {fans: 6, fame: 2, prof: 2}}},
    {t: tr("Rechazarlo en silencio"), ok: {txt: tr("Sin dramas. Nadie se entera."), fx: {prof: 1}}}
  ]; }});

EV({id: "y_libro", tipo: "aleatoria", cat: "Fama", title: "¿Tu autobiografía ya?", ctx: "verano", once: true, w: 1.2,
  when: function (x) { return x.age <= 27 && x.p.fame >= 35; },
  text: function () { return tr("Una editorial te propone publicar tu autobiografía. Un escritor la redactaría por ti, pero quieren anécdotas jugosas del vestuario."); },
  opts: function (x) { var m = yK(Math.max(30000, ySal(x) * 0.15)); return [
    {t: tr("Contarlo todo"), d: tr("Venderá mucho, pero algunos no te lo perdonarán."), ok: {txt: tr("El libro arrasa. Varios excompañeros dejan de hablarte."), fx: {money: m * 2, fame: 4, fol: 60, coach: -6, mor: -2}}},
    {t: tr("Un libro amable y sin polémicas"), ok: {txt: tr("Ventas discretas y buenas críticas."), fx: {money: m, fame: 2}}},
    {t: tr("Esperar a retirarte"), ok: {txt: tr("Aún te queda mucha historia por escribir."), fx: {prof: 2}}}
  ]; }});

EV({id: "y_vuelo_retraso", tipo: "aleatoria", cat: "Viajes", title: "El vuelo de vuelta se retrasa", w: 0.9, cd: 5,
  when: function (x) { return x.inSeason && x.p.intl.caps >= 1 && S.bi >= 1; },
  text: function () { return tr("Vuelves de jugar con tu selección y tu vuelo se retrasa ocho horas. Llegarás la misma mañana del partido de liga."); },
  opts: function () { return [
    {t: tr("Jugar igualmente"), p: 0.5,
      ok: {txt: tr("Con un café y mucha cabeza, sacas el partido adelante."), fx: {coach: 4, fit: -6}},
      ko: {txt: tr("Te arrastras por el campo y el míster te cambia al descanso."), fx: {form: -5, fit: -8, coach: -2}}},
    {t: tr("Pedir descansar"), ok: {txt: tr("El míster lo entiende y te deja en la grada."), fx: {fit: 5, coach: -1}}},
    {t: tr("Pagar un vuelo privado (25 k€)"), ok: {txt: tr("Llegas la víspera y duermes en tu cama."), fx: {money: -25000, fit: 2, coach: 3}}}
  ]; }});

EV({id: "y_entrevista_idioma", tipo: "aleatoria", cat: "Adaptación", title: "La primera entrevista en otro idioma", once: true, w: 1.4,
  when: function (x) { return x.inSeason && x.abroad && x.yrsAtClub <= 1; },
  text: function () { return tr("La televisión local quiere entrevistarte. Llevas pocos meses en el país y apenas chapurreas el idioma."); },
  opts: function () { return [
    {t: tr("Lanzarte en el idioma local"), p: 0.6,
      ok: {txt: tr("Te trabas, pero la gente valora el esfuerzo. Te ganas a la ciudad."), fx: {fans: 8, mor: 3}},
      ko: {txt: tr("Dices una palabra por otra y te vuelves meme… cariñoso, por suerte."), fx: {fans: 3, fol: 30, mor: -2}}},
    {t: tr("Pedir un intérprete"), ok: {txt: tr("Respuestas claras y sin riesgos."), fx: {prof: 1}}},
    {t: tr("Hablar en inglés"), ok: {txt: tr("Te entienden casi todos. Algunos esperaban un poco más de esfuerzo."), fx: {fans: -1}}}
  ]; }});

EV({id: "y_morrina", tipo: "aleatoria", cat: "Adaptación", title: "Echas de menos tu casa", w: 1.2, cd: 3,
  when: function (x) { return x.inSeason && x.abroad && x.age <= 26; },
  text: function () { return tr("Llevas meses lejos de tu país. El clima, la comida y la soledad empiezan a pesarte y lo notas en el campo."); },
  opts: function () { return [
    {t: tr("Traer a tu familia una temporada (20 k€)"), ok: {txt: tr("Con los tuyos cerca, la casa vuelve a ser casa."), fx: {money: -20000, mor: 8, form: 2}}},
    {t: tr("Hacer amigos en el vestuario"), p: 0.6,
      ok: {txt: tr("Un par de compañeros te adoptan. Cenas, series y risas."), fx: {mor: 6, coach: 2}},
      ko: {txt: tr("No acabas de encajar. La soledad sigue ahí."), fx: {mor: -3}}},
    {t: tr("Volar a casa en los días libres"), ok: {txt: tr("Recargas pilas, pero tanto viaje cansa."), fx: {mor: 5, fit: -5}}}
  ]; }});

EV({id: "y_presion_alta", tipo: "aleatoria", cat: "Táctica", title: "Presión a todo el campo", w: 0.8, cd: 6,
  when: function (x) { return x.inSeason && x.p.pos !== "POR"; },
  text: function () { return tr("El míster quiere presionar arriba durante los noventa minutos. Necesita que corras mucho más que antes, aunque te quite energía para atacar."); },
  opts: function () { return [
    {t: tr("Entregarte al plan"), ok: {txt: tr("Corres como nunca. El míster te pone de ejemplo."), fx: {coach: 6, fit: -6, att: {FIS: 1}}}},
    {t: tr("Pedir un papel adaptado"), p: 0.5,
      ok: {txt: tr("El míster te libera de parte del trabajo sin balón."), fx: {coach: 1, form: 3}},
      ko: {txt: tr("«Aquí presiona todo el mundo». Te ganas una mirada fría."), fx: {coach: -5}}},
    {t: tr("Trabajar el físico por tu cuenta"), ok: {txt: tr("Sesiones extra de resistencia. Llegas mejor que nadie."), fx: {fit: -3, prof: 3, coach: 3, att: {FIS: 1}}}}
  ]; }});

EV({id: "y_dossier", tipo: "aleatoria", cat: "Táctica", title: "Un informe sobre tu par", w: 0.7, cd: 5,
  when: function (x) { return x.inSeason && x.starts >= 2; },
  text: function (x) { return tr("El analista te deja un informe de cuarenta páginas sobre el jugador que tendrás enfrente en el partido contra el {opp}. Es tarde y mañana hay sesión temprano.", {opp: x.opp()}); },
  opts: function () { return [
    {t: tr("Estudiarlo hasta la madrugada"), p: 0.6,
      ok: {txt: tr("Te sabes cada movimiento suyo y lo anulas por completo."), fx: {coach: 4, buff: {v: 1, b: 1, n: tr("Deberes hechos")}, fit: -3}},
      ko: {txt: tr("Duermes poco y en el campo te faltan piernas."), fx: {fit: -6, form: -3}}},
    {t: tr("Leer el resumen y dormir"), ok: {txt: tr("Lo esencial y a la cama. Equilibrio."), fx: {prof: 2}}},
    {t: tr("Fiarte de tu instinto"), ok: {txt: tr("El analista se queda con cara de pocos amigos."), fx: {coach: -2, fit: 2}}}
  ]; }});

EV({id: "y_multas_vestuario", tipo: "aleatoria", cat: "Vestuario", title: "La caja de las multas", once: true, w: 1.6,
  when: function (x) { return x.inSeason && x.age >= 23 && x.yrsAtClub >= 1; },
  text: function () { return tr("Te encargas de la caja de multas internas del vestuario. La estrella del equipo llega tarde una y otra vez y se niega a pagar."); },
  opts: function () { return [
    {t: tr("Exigirle que pague delante de todos"), p: 0.55,
      ok: {txt: tr("Paga entre risas. El vestuario ve que las normas son para todos."), fx: {coach: 4, mor: 3, prof: 2}},
      ko: {txt: tr("Se lo toma fatal y se forma un frente en el vestuario."), fx: {mor: -5, coach: -2}}},
    {t: tr("Hablarlo con él en privado"), ok: {txt: tr("Acabáis pactando que invite a cenar a toda la plantilla."), fx: {mor: 4}}},
    {t: tr("Contárselo al míster"), ok: {txt: tr("El míster lo resuelve, pero algunos te ven como un chivato."), fx: {coach: 4, mor: -3}}}
  ]; }});

EV({id: "y_novatada", tipo: "aleatoria", cat: "Vestuario", title: "Canta delante de todos", once: true, w: 1.5,
  when: function (x) { return x.inSeason && x.yrsAtClub === 0 && x.age <= 24; },
  text: function () { return tr("Es tu primera cena con la plantilla y la tradición manda: los nuevos tienen que subirse a una silla y cantar una canción."); },
  opts: function () { return [
    {t: tr("Darlo todo con un clásico"), p: 0.6,
      ok: {txt: tr("Afinas lo justo, pero la energía conquista a todos. Estás dentro."), fx: {mor: 6, coach: 3}},
      ko: {txt: tr("Se te olvida la letra a la mitad. Risas… a tu costa."), fx: {mor: 1, fol: 20}}},
    {t: tr("Cantar algo de tu tierra"), ok: {txt: tr("Nadie la conoce, pero acaban todos coreando el estribillo."), fx: {mor: 5, coach: 2}}},
    {t: tr("Negarte"), ok: {txt: tr("No haces el ridículo, pero te ganas fama de soso."), fx: {mor: -4}}}
  ]; }});

EV({id: "y_audio_filtrado", tipo: "aleatoria", cat: "Vestuario", title: "Un audio que no debía salir", w: 0.9, cd: 4,
  when: function (x) { return x.inSeason && x.p.coach <= 55 && x.p.fame >= 15; },
  text: function () { return tr("Un audio tuyo en el grupo del vestuario criticando al míster ha llegado a la prensa. Alguien te ha traicionado."); },
  opts: function () { return [
    {t: tr("Pedir perdón al míster"), p: 0.6,
      ok: {txt: tr("Lo acepta, aunque te lo recordará durante un tiempo."), fx: {coach: 4, mor: -2}},
      ko: {txt: tr("No hay perdón: te pasas varias semanas en el banquillo."), fx: {coach: -6, form: -3}}},
    {t: tr("Buscar al topo"), p: 0.4,
      ok: {txt: tr("Lo descubres y el vestuario le da la espalda a él."), fx: {mor: 4}},
      ko: {txt: tr("Sospechas de todos y el ambiente se envenena."), fx: {mor: -5, coach: -3}}},
    {t: tr("Mantener lo que dijiste"), ok: {txt: tr("Algunos compañeros te apoyan en voz baja. El míster, no."), fx: {coach: -10, fans: 3, mor: 2}}}
  ]; }});

EV({id: "y_pancarta_ultras", tipo: "aleatoria", cat: "Afición", title: "Una foto con los ultras", w: 0.9, cd: 4,
  when: function (x) { return x.inSeason && x.yrsAtClub >= 1 && x.p.fame >= 15; },
  text: function () { return tr("El grupo ultra más ruidoso del estadio te pide una foto con una pancarta suya. Algunos de sus mensajes han provocado sanciones al club."); },
  opts: function () { return [
    {t: tr("Hacerte la foto"), p: 0.5,
      ok: {txt: tr("La grada de animación te jalea cada vez que tocas el balón."), fx: {fans: 6}},
      ko: {txt: tr("La pancarta tiene un mensaje polémico. El club abre expediente."), fx: {fans: 2, coach: -6, money: -yK(10000), fame: -1}}},
    {t: tr("Hacerte la foto, sin pancarta"), ok: {txt: tr("Un saludo con ellos y nada más. Te vale."), fx: {fans: 3}}},
    {t: tr("Negarte con educación"), ok: {txt: tr("Algún pitido aislado, pero el club lo agradece."), fx: {coach: 2, fans: -3}}}
  ]; }});

EV({id: "y_anuncio", tipo: "aleatoria", cat: "Patrocinio", title: "Un anuncio un poco ridículo", w: 0.8, cd: 6,
  when: function (x) { return x.p.fame >= 25; },
  text: function () { return tr("Una marca de embutidos te ofrece un anuncio para la tele. El guion te obliga a bailar disfrazado de chorizo."); },
  opts: function (x) { var m = yK(Math.max(20000, ySal(x) * 0.1)); return [
    {t: tr("Rodarlo con todo"), p: 0.55,
      ok: {txt: tr("El anuncio es tan absurdo que se vuelve un fenómeno. Te adoran."), fx: {money: m, fol: 100, fans: 5, fame: 2}},
      ko: {txt: tr("Los rivales te lo cantan en cada estadio."), fx: {money: m, fol: 40, mor: -4}}},
    {t: tr("Pedir cambiar el guion"), p: 0.5,
      ok: {txt: tr("Aceptan un anuncio más serio, y cobras algo menos."), fx: {money: yK(m * 0.6)}},
      ko: {txt: tr("La marca se busca a otro futbolista."), fx: {}}},
    {t: tr("Rechazarlo"), ok: {txt: tr("Tu dignidad no tiene precio."), fx: {prof: 1}}}
  ]; }});

EV({id: "y_periodista_amigo", tipo: "aleatoria", cat: "Prensa", title: "Un amigo periodista", w: 0.8, cd: 6,
  when: function (x) { return x.inSeason && x.p.fame >= 20; },
  text: function () { return tr("Un periodista con el que tienes buena relación te pide que le confirmes, en secreto, que un compañero va a dejar el club."); },
  opts: function () { return [
    {t: tr("Confirmárselo"), p: 0.5,
      ok: {txt: tr("La exclusiva sale sin que nadie sepa de dónde. El periodista te debe una."), fx: {fame: 1}},
      ko: {txt: tr("Tu compañero se entera de que fuiste tú. El vestuario te mira mal."), fx: {mor: -6, coach: -5}}},
    {t: tr("Negarte a hablar del tema"), ok: {txt: tr("El periodista lo entiende… más o menos."), fx: {prof: 2}}},
    {t: tr("Avisar a tu compañero"), ok: {txt: tr("Te agradece la lealtad y la relación se refuerza."), fx: {mor: 4, coach: 1}}}
  ]; }});

EV({id: "y_muela", tipo: "aleatoria", cat: "Salud", title: "Una muela que duele", once: true, w: 0.9,
  when: function (x) { return x.inSeason && x.age >= 18; },
  text: function () { return tr("Llevas días con dolor en una muela del juicio y tus músculos no recuperan bien. El dentista del club recomienda sacarla ya."); },
  opts: function () { return [
    {t: tr("Sacarla ahora"), ok: {txt: tr("Un par de días con la cara hinchada y sopa. Luego, como nuevo."), fx: {form: -2, fit: 4, injMul: 0.97}}},
    {t: tr("Aguantar con antiinflamatorios"), p: 0.55,
      ok: {txt: tr("El dolor remite y llegas al parón sin problemas."), fx: {}},
      ko: {txt: tr("Se infecta y te pierdes un partido con fiebre."), fx: {inj: 1, form: -4}}},
    {t: tr("Esperar al parón"), p: 0.7,
      ok: {txt: tr("Aguantas unas semanas y te operas sin perder partidos."), fx: {fit: -2}},
      ko: {txt: tr("Tu cuerpo lo paga con una sobrecarga muscular."), fx: {inj: [1, 2], fit: -4}}}
  ]; }});

EV({id: "y_preparador_porteros", tipo: "aleatoria", cat: "Entrenamiento", title: "Nuevo preparador de porteros", once: true, w: 2.5,
  when: function (x) { return x.inSeason && x.p.pos === "POR" && x.age >= 19; },
  text: function () { return tr("Llega un preparador de porteros con ideas modernas: quiere que juegues más adelantado y con los pies, aunque eso cambie tu forma de parar."); },
  opts: function () { return [
    {t: tr("Abrazar el cambio"), p: 0.65,
      ok: {txt: tr("Te conviertes en un portero moderno. El juego del equipo lo agradece."), fx: {coach: 5, ovr: 1, att: {SAQ: 1}}},
      ko: {txt: tr("En plena adaptación, un error con los pies acaba en gol."), fx: {coach: -3, form: -4, att: {SAQ: 1}}}},
    {t: tr("Pedir mantener tu estilo"), ok: {txt: tr("Seguirás siendo un portero de reflejos. El preparador no está convencido."), fx: {coach: -3, att: {REF: 1}}}},
    {t: tr("Cambiar poco a poco"), ok: {txt: tr("Un poco cada semana. Sin brillo, pero sin errores."), fx: {prof: 3, coach: 2}}}
  ]; }});

EV({id: "y_marcaje", tipo: "aleatoria", cat: "Táctica", title: "Al hombre, todo el partido", w: 1.3, cd: 3,
  when: function (x) { return x.inSeason && (x.g === "DEF" || x.p.pos === "MCD"); },
  text: function (x) { return tr("El míster quiere que persigas a la estrella del {opp} por todo el campo, olvidándote de tu posición.", {opp: x.opp()}); },
  opts: function (x) { var p = clamp(0.5 + (x.p.ovr - x.clubR) * 0.03, 0.3, 0.8); return [
    {t: tr("Pegarte a él como una sombra"), p: p,
      ok: {txt: tr("No toca un balón en todo el partido. Las cámaras te buscan a ti."), fx: {coach: 6, fame: 2, fans: 4}},
      ko: {txt: tr("Te gana la espalda un par de veces y marca. Duro día."), fx: {coach: -3, form: -4}}},
    {t: tr("Jugar duro desde el principio"), p: 0.55,
      ok: {txt: tr("Un par de entradas y le quitas las ganas de encarar."), fx: {coach: 3, fans: 2}},
      ko: {txt: tr("Amarilla temprana y tienes que bajar el pistón. Sufres."), fx: {coach: -4, susp: 1}}},
    {t: tr("Proponer una defensa en zona"), p: 0.4,
      ok: {txt: tr("El míster acepta y salís bien parados."), fx: {coach: 2, prof: 2}},
      ko: {txt: tr("«Aquí decido yo». Hoy chupas banquillo."), fx: {coach: -5}}}
  ]; }});

EV({id: "y_pierna_mala", tipo: "aleatoria", cat: "Entrenamiento", title: "Un verano para tu pierna mala", ctx: "verano", once: true, w: 1.3,
  when: function (x) { return x.age <= 27 && x.p.pos !== "POR"; },
  text: function () { return tr("Tu pierna mala es tu gran debilidad y los rivales lo saben. Un entrenador personal te propone dedicar medio verano a corregirla."); },
  opts: function () { return [
    {t: tr("Trabajar todo el verano (15 k€)"), ok: {txt: tr("Horas y horas golpeando con la otra pierna. Ya no eres previsible."), fx: {money: -15000, ovr: 1, prof: 3, fit: -4}}},
    {t: tr("Unas semanas y vacaciones"), p: 0.6,
      ok: {txt: tr("Lo justo para notar mejora sin quemarte."), fx: {money: -8000, prof: 2, att: {TIR: 1}}},
      ko: {txt: tr("No da tiempo a mejorar casi nada."), fx: {money: -8000}}},
    {t: tr("Descansar de verdad"), ok: {txt: tr("Playa, familia y desconexión. Vuelves fresco."), fx: {mor: 5, fit: 4}}}
  ]; }});

EV({id: "y_himno", tipo: "aleatoria", cat: "Selección", title: "No cantaste el himno", once: true, w: 1.3,
  when: function (x) { return x.inSeason && x.p.intl.caps >= 1 && x.p.intl.caps <= 8; },
  text: function () { return tr("En tu último partido con la selección no cantaste el himno y un programa de televisión lo ha convertido en debate nacional."); },
  opts: function () { return [
    {t: tr("Explicar que te concentras así"), p: 0.6,
      ok: {txt: tr("La mayoría lo entiende y el tema se apaga."), fx: {prof: 2}},
      ko: {txt: tr("Te acusan de poco patriota. Te pitan en un estadio."), fx: {fans: -4, mor: -3}}},
    {t: tr("Cantarlo a pleno pulmón la próxima vez"), ok: {txt: tr("Las cámaras te enfocan y te ven cantar con ganas. Fin del debate."), fx: {fans: 3, fame: 1}}},
    {t: tr("Criticar el debate"), p: 0.5,
      ok: {txt: tr("Tu respuesta conecta con mucha gente."), fx: {fame: 3, fol: 40}},
      ko: {txt: tr("Echas leña al fuego. El seleccionador te pide calma."), fx: {fame: 2, mor: -3}}}
  ]; }});

EV({id: "y_campus", tipo: "aleatoria", cat: "Afición", title: "Tu propio campus de verano", ctx: "verano", once: true, w: 1.2,
  when: function (x) { return x.age >= 21 && x.p.fame >= 25; },
  text: function () { return tr("Te proponen organizar un campus de fútbol con tu nombre para niños de tu ciudad durante dos semanas de vacaciones."); },
  opts: function (x) { return [
    {t: tr("Estar todos los días"), ok: {txt: tr("Niños felices, padres agradecidos y tú agotado."), fx: {fans: 8, fame: 3, money: yK(20000), fit: -4}}},
    {t: tr("Poner el nombre y aparecer un día"), p: 0.6,
      ok: {txt: tr("Todo sale bien y cobras sin cansarte."), fx: {money: yK(30000), fans: 2}},
      ko: {txt: tr("Algunos padres se quejan de que pagaron por verte y no estabas."), fx: {money: yK(30000), fans: -5}}},
    {t: tr("Hacerlo gratis para familias sin recursos"), ok: {txt: tr("Una idea que llena de orgullo a tu ciudad."), fx: {fans: 10, fame: 4, mor: 5, money: -yK(10000)}}}
  ]; }});

EV({id: "y_compa_ayuda", tipo: "aleatoria", cat: "Vestuario", title: "Un compañero no está bien", once: true, w: 1,
  when: function (x) { return x.inSeason && x.age >= 20; },
  text: function () { return tr("Un compañero te confiesa que lo está pasando muy mal y que no duerme. Te pide que no se lo cuentes a nadie."); },
  opts: function () { return [
    {t: tr("Convencerle de pedir ayuda profesional"), p: 0.75,
      ok: {txt: tr("Acepta ver al psicólogo del club. Semanas después te da las gracias."), fx: {mor: 5, coach: 3, prof: 2}},
      ko: {txt: tr("Aún no está preparado, pero sabe que puede contar contigo."), fx: {mor: 1}}},
    {t: tr("Estar a su lado"), ok: {txt: tr("Cenas, paseos y charlas. A veces lo que hace falta es compañía."), fx: {mor: 4, fit: -2}}},
    {t: tr("Avisar al cuerpo técnico"), p: 0.5,
      ok: {txt: tr("El club actúa a tiempo. Él lo acaba entendiendo."), fx: {coach: 4, mor: 2}},
      ko: {txt: tr("Se siente traicionado y deja de hablarte."), fx: {mor: -4}}}
  ]; }});

EV({id: "y_cena_presidente", tipo: "aleatoria", cat: "Club", title: "Cena con el presidente", w: 1, cd: 4,
  when: function (x) { return x.inSeason && x.p.fame >= 30 && !x.p.loan && x.yrsAtClub >= 1; },
  text: function () { return tr("El presidente te invita a cenar y, entre plato y plato, te pregunta qué piensas del míster. Parece que se plantea cambiarlo."); },
  opts: function () { return [
    {t: tr("Defender al míster"), ok: {txt: tr("El presidente toma nota. Si se entera, el míster te lo agradecerá."), fx: {coach: 5, prof: 2}}},
    {t: tr("Decir lo que piensas de verdad"), p: 0.5,
      ok: {txt: tr("El presidente valora tu sinceridad y te consulta más a menudo."), fx: {fame: 1, mor: 3}},
      ko: {txt: tr("La conversación se filtra y el míster se entera."), fx: {coach: -12, mor: -3}}},
    {t: tr("Hablar solo de la renovación"), p: 0.5,
      ok: {txt: tr("Aprovechas el momento y te promete mejorar tu contrato."), fx: {sal: 1.08}},
      ko: {txt: tr("Al presidente le sienta mal que solo hables de dinero."), fx: {mor: -2}}}
  ]; }});

EV({id: "y_premio_joven", tipo: "aleatoria", cat: "Fama", title: "Nominado a mejor joven", once: true, w: 1.4,
  when: function (x) { return x.age <= 21 && x.p.fame >= 20 && x.p.ovr >= 65; },
  text: function () { return tr("Estás entre los finalistas al premio al mejor jugador joven del año. Parte del jurado se decide con votos de los aficionados."); },
  opts: function (x) { var p = clamp(0.3 + x.p.fame / 200, 0.3, 0.7); return [
    {t: tr("Hacer campaña en redes"), p: p,
      ok: {txt: tr("Tu comunidad se vuelca y te llevas el premio."), fx: {fame: 5, fol: 100, mor: 6}},
      ko: {txt: tr("Quedas segundo. Algunos critican tanta campaña."), fx: {fol: 40, mor: -2}}},
    {t: tr("Dejar que hable el campo"), p: p * 0.6,
      ok: {txt: tr("Ganas sin pedir un solo voto. Más mérito todavía."), fx: {fame: 5, prof: 3, mor: 6}},
      ko: {txt: tr("No ganas, pero te quedas con la experiencia."), fx: {prof: 2}}},
    {t: tr("Pedir el voto para un compañero"), ok: {txt: tr("Un gesto que el vestuario nunca olvidará."), fx: {coach: 4, mor: 3, fans: 3}}}
  ]; }});

EV({id: "y_insultos_familia", tipo: "aleatoria", cat: "Redes", title: "Insultos a tu familia", w: 0.8, cd: 6,
  when: function (x) { return x.inSeason && x.p.fame >= 20; },
  text: function () { return tr("Tras un error tuyo, cientos de mensajes en redes insultan a tu familia. Tu madre está muy afectada."); },
  opts: function () { return [
    {t: tr("Denunciar las cuentas"), ok: {txt: tr("La plataforma cierra varias cuentas y la policía investiga."), fx: {mor: 3, fans: 3, money: -yK(5000)}}},
    {t: tr("Responder en caliente"), p: 0.3,
      ok: {txt: tr("Tu mensaje recibe una ola de apoyo."), fx: {fans: 4, fol: 30}},
      ko: {txt: tr("Te enzarzas con los provocadores y el club te pide que lo dejes."), fx: {coach: -4, mor: -4}}},
    {t: tr("Desconectar unas semanas"), ok: {txt: tr("Dejas las redes en manos de tu equipo. Tu cabeza lo agradece."), fx: {mor: 5, fol: -10}}}
  ]; }});

EV({id: "y_cesion_invierno", tipo: "aleatoria", cat: "Mercado", title: "Un club humilde te quiere cedido", w: 1.5, cd: 3,
  when: function (x) { return x.inSeason && x.age <= 22 && (x.role === "Suplente" || x.role === "Promesa" || x.role === "Reserva") && !x.p.loan; },
  text: function () { return tr("Un club humilde de otra ciudad quiere tu cesión para darte minutos. Tu club prefiere que te quedes y pelees por un sitio."); },
  opts: function () { return [
    {t: tr("Quedarte y pelear"), p: 0.45,
      ok: {txt: tr("Trabajas como nadie y el míster empieza a contar contigo."), fx: {coach: 8, prof: 3}},
      ko: {txt: tr("Sigues sin jugar y la paciencia se agota."), fx: {mor: -5, form: -2}}},
    {t: tr("Pedir que te dejen salir"), p: 0.4,
      ok: {txt: tr("El club se lo piensa y te promete minutos en la Copa para retenerte."), fx: {coach: 2, mor: 4}},
      ko: {txt: tr("El club se niega en redondo y no le gusta tu insistencia."), fx: {coach: -5, mor: -3}}},
    {t: tr("Entrenar con el filial para coger ritmo"), ok: {txt: tr("Partidos de verdad, aunque sea en una categoría menor."), fx: {form: 4, prof: 2, coach: 2}}}
  ]; }});

EV({id: "y_recovery_plan", tipo: "aleatoria", cat: "Rendimiento", title: "El plan de recuperación", w: 1.1, cd: 3,
  when: function (x) { return x.inSeason && x.p.fame >= 5; },
  text: function () { return tr("El calendario viene cargado y el cuerpo te pide una pausa. El fisio propone ajustar el descanso, pero el entrenador quiere verte entrenar a tope."); },
  opts: function () { return [
    {t: tr("Seguir el plan del fisio"), ok: {txt: tr("Llegas más fresco al próximo partido."), fx: {form: 4, mor: 2}}},
    {t: tr("Completar una sesión extra"), p: 0.65,
      ok: {txt: tr("El esfuerzo extra da resultado y te notas más rápido."), fx: {form: 2, prof: 3}},
      ko: {txt: tr("Te pasas de carga y las piernas se quedan pesadas."), fx: {form: -4, mor: -2}}},
    {t: tr("Pedir una rotación al míster"), ok: {txt: tr("Te reserva unos minutos y recuperas energía."), fx: {coach: 2, mor: 3, form: 3}}}
  ]; }});

EV({id: "y_brazo_capitan", tipo: "aleatoria", cat: "Vestuario", title: "Un compañero necesita apoyo", w: 0.9, cd: 4,
  when: function (x) { return x.inSeason && x.p.ovr >= 60; },
  text: function () { return tr("Un compañero joven encadena errores y algunos veteranos empiezan a señalarle. Te busca para saber si crees que puede salir adelante."); },
  opts: function () { return [
    {t: tr("Hablar con él en privado"), ok: {txt: tr("Se siente escuchado y vuelve a entrenar con confianza."), fx: {mor: 3, coach: 2, prof: 2}}},
    {t: tr("Defenderle delante de todo el grupo"), p: 0.7,
      ok: {txt: tr("El vestuario se une y el joven responde en el campo."), fx: {mor: 4, fans: 2, prof: 2}},
      ko: {txt: tr("El gesto se interpreta como una crítica a los veteranos."), fx: {coach: -3, mor: -2}}},
    {t: tr("Dejar que resuelva sus problemas"), ok: {txt: tr("Cada uno aprende a su ritmo, aunque la distancia entre ambos aumenta."), fx: {prof: 1, mor: -1}}}
  ]; }});

EV({id: "y_entrevista_tactica", tipo: "aleatoria", cat: "Prensa", title: "Una pregunta sobre tu posición", w: 1, cd: 3,
  when: function (x) { return x.inSeason && x.p.fame >= 12; },
  text: function () { return tr("En una entrevista te preguntan si prefieres jugar en tu posición natural o aceptar cualquier papel que te pida el entrenador."); },
  opts: function () { return [
    {t: tr("Poner al equipo por delante"), ok: {txt: tr("El míster agradece tu compromiso y la prensa destaca tu profesionalidad."), fx: {coach: 4, prof: 3, fans: 2}}},
    {t: tr("Explicar dónde rindes mejor"), ok: {txt: tr("Hablas claro sin faltar al respeto. El cuerpo técnico toma nota."), fx: {coach: 2, prof: 2}}},
    {t: tr("Exigir jugar siempre en tu sitio"), p: 0.45,
      ok: {txt: tr("Tu sinceridad abre una conversación útil con el entrenador."), fx: {coach: 3, mor: 2}},
      ko: {txt: tr("El titular suena a ultimátum y el míster se molesta."), fx: {coach: -5, fans: -2}}}
  ]; }});

/* 100 situaciones nuevas de carrera de jugador/a. Cada tema combina diez casos jugables,
   con decisiones, consecuencias y claves únicas para que las partidas puedan recordarlas. */
var PLAYER_DECISION_THEMES = [
  {cat: "Entrenamiento", title: "Una sesión a tu medida", open: "El cuerpo técnico está diseñando el trabajo de la semana.", choices: ["Pedir un objetivo técnico concreto", "Probar el reto más exigente", "Acordar una sesión equilibrada"], cases: [
    ["Primer toque", "El analista señala que el control orientado te ayudaría a salir de la presión."], ["Pierna menos hábil", "El preparador propone terminar cada ejercicio con tu pierna menos hábil."], ["Juego aéreo", "El equipo quiere que practiques saltos y disputas en el área."], ["Pase vertical", "El vídeo de tu último partido muestra varios pases hacia atrás evitables."], ["Cambio de ritmo", "El preparador físico ha medido una bajada de velocidad en el último tramo."], ["Centros", "Los laterales te piden repetir centros y remates al segundo palo."], ["Presión tras pérdida", "El nuevo sistema exige reaccionar en los segundos posteriores a perder el balón."], ["Tiros lejanos", "En el entrenamiento te quedan diez minutos y el portero propone una competición de disparos."], ["Cobertura defensiva", "El míster quiere que mejores la coordinación con quien juega a tu lado."], ["Balón parado", "El especialista de faltas te ofrece ensayar una jugada nueva."]]},
  {cat: "Prensa", title: "Una pregunta incómoda", open: "Un periodista busca una respuesta que abra los titulares de mañana.", choices: ["Responder con calma", "Convertirlo en un desafío público", "Desviar la atención hacia el equipo"], cases: [
    ["La suplencia", "Te preguntan si estás molesto por haber empezado el último partido en el banquillo."], ["El gol fallado", "Una repetición de tu ocasión más clara vuelve a circular por todos los programas."], ["El cambio temprano", "Quieren saber si te sentó mal que el entrenador te sustituyera."], ["El rival", "Un delantero rival ha dicho que no le preocupa enfrentarse contigo."], ["El contrato", "La prensa publica una cifra de renovación que nadie ha confirmado."], ["La afición", "Te preguntan por los silbidos de un sector de la grada."], ["La selección", "Un reportero te plantea si mereces más minutos con tu país."], ["La posición", "El entrevistador afirma que rindes mejor en otra demarcación."], ["El vestuario", "Un periodista insinúa que hay mal ambiente entre los titulares y los suplentes."], ["La racha", "Te preguntan si el equipo puede mantener el buen momento hasta final de temporada."]]},
  {cat: "Recuperación", title: "Tu cuerpo pide una decisión", open: "El calendario aprieta y el equipo médico revisa tus cargas.", choices: ["Seguir el protocolo del fisio", "Acelerar la vuelta por tu cuenta", "Negociar una recuperación intermedia"], cases: [
    ["Viaje largo", "Regresas de un desplazamiento nocturno con poco descanso."], ["Dos partidos seguidos", "Hay otro encuentro importante apenas tres días después del último."], ["Molestia muscular", "Notas una pequeña sobrecarga que todavía no aparece en el parte médico."], ["Calor extremo", "La previsión anuncia temperaturas altas para el siguiente partido."], ["Sueño irregular", "El personal del club detecta que estás descansando peor de lo habitual."], ["Carga de gimnasio", "Las piernas siguen pesadas tras una sesión de fuerza exigente."], ["Tobillo sensible", "El vendaje te ayuda, pero la articulación continúa rígida."], ["Regreso a los entrenamientos", "Ya estás recuperado y quieres saber cuánto debes forzar en la primera semana."], ["Menos minutos", "Has jugado poco últimamente y te preocupa perder ritmo competitivo."], ["Rutina personal", "Una aplicación deportiva te recomienda un plan distinto al del club."]]},
  {cat: "Vestuario", title: "Una conversación en el vestuario", open: "Un compañero se acerca cuando la mayoría ya se ha marchado.", choices: ["Escucharle en privado", "Hablar del tema con todo el grupo", "Pedir ayuda a un veterano"], cases: [
    ["Un juvenil nervioso", "El canterano que debuta este mes teme cometer un error decisivo."], ["Un compañero aislado", "Un recién llegado come solo y apenas participa en las charlas del equipo."], ["Dos líderes enfrentados", "Los capitanes discrepan sobre quién debe lanzar el próximo penalti."], ["Un suplente frustrado", "Un compañero cree que merece más minutos y está perdiendo la motivación."], ["Una broma pesada", "Un jugador joven te cuenta que las bromas del grupo han ido demasiado lejos."], ["Una discusión táctica", "Dos compañeros discuten por quién debía cubrir una carrera del rival."], ["Un error repetido", "El portero quiere hablar contigo después de varios goles encajados."], ["Un regreso difícil", "Un compañero vuelve de una lesión larga y no se siente al nivel del grupo."], ["Un idioma nuevo", "Un fichaje extranjero no comprende algunas indicaciones del vestuario."], ["Una despedida", "Un veterano te confiesa que está pensando en retirarse al acabar el año."]]},
  {cat: "Rol", title: "El míster te pide flexibilidad", open: "La planificación del próximo encuentro plantea una función distinta para ti.", choices: ["Aceptar el nuevo papel", "Pedir una explicación antes de decidir", "Proponer una alternativa táctica"], cases: [
    ["Un puesto más retrasado", "El entrenador quiere que ayudes a iniciar las jugadas desde atrás."], ["La banda contraria", "Una lesión obliga al equipo a cambiarte de banda."], ["Falso nueve", "El míster piensa usar tu movilidad como referencia ofensiva."], ["Lateral por sorpresa", "El equipo necesita que cubras una posición poco habitual durante un partido."], ["Capitán suplente", "Te proponen llevar el brazalete mientras descansa el capitán."], ["Especialista de córners", "El cuerpo técnico quiere que ejecutes los saques de esquina."], ["Presión individual", "Te asignan seguir de cerca al organizador rival."], ["Entrada desde el banquillo", "El entrenador te plantea cambiar el partido en la segunda parte."], ["Doble pivote", "Quieren que formes una pareja en el centro con un compañero más defensivo."], ["Delantero de apoyo", "El plan requiere que juegues cerca del goleador en lugar de ser la referencia."]]},
  {cat: "Mercado", title: "Tu representante trae una propuesta", open: "Tu agente te llama antes de que el club publique nada.", choices: ["Escuchar la propuesta sin compromiso", "Pedir que la negociación espere", "Hablar primero con tu entrenador"], cases: [
    ["Interés desde otra liga", "Un equipo extranjero ha preguntado por tu situación contractual."], ["Renovación anticipada", "Tu club quiere empezar a negociar antes de que termine la temporada."], ["Cesión con minutos", "Un equipo cercano ofrece un préstamo con una promesa de titularidad."], ["Cláusula de rescisión", "El agente sugiere incluir una cláusula para facilitar un futuro traspaso."], ["Cambio de patrocinador", "Una marca rival quiere ofrecerte un contrato personal."], ["Oferta de última hora", "Un club presenta una oferta cuando el mercado está a punto de cerrar."], ["Intermediario nuevo", "Un representante desconocido promete contactos en varios campeonatos."], ["Aumento de sueldo", "Tu agente cree que tus actuaciones justifican una mejora salarial."], ["Club recién ascendido", "Un proyecto nuevo te ofrece ser una de sus caras principales."], ["Contrato corto", "Una oferta interesante solo garantiza una temporada de duración."]]},
  {cat: "Afición", title: "La grada espera un gesto", open: "Los aficionados hablan de ti en redes y alrededor del estadio.", choices: ["Acercarte a la afición", "Responder con un mensaje público", "Dejar que tus actuaciones hablen"], cases: [
    ["Entrenamiento abierto", "Un grupo de niños espera al equipo a la salida de la ciudad deportiva."], ["Camisetas firmadas", "Una asociación local pide tu ayuda para una rifa benéfica."], ["Una pancarta", "La grada prepara un mensaje de apoyo antes del próximo partido."], ["Críticas en redes", "Un vídeo de un error tuyo acumula comentarios duros."], ["Viaje de seguidores", "Aficionados han recorrido cientos de kilómetros para verte jugar."], ["Visita a un hospital", "El club organiza una mañana con pacientes jóvenes."], ["Una camiseta antigua", "Un hincha te regala una camiseta histórica de tu club."], ["Afición visitante", "Una familia rival te pide una foto después del encuentro."], ["Campaña solidaria", "Los seguidores proponen recaudar fondos para un proyecto del barrio."], ["Silbidos tras el partido", "Algunos aficionados muestran su enfado cuando te acercas a la grada."]]},
  {cat: "Patrocinio", title: "Una marca quiere asociarse contigo", open: "Una empresa se pone en contacto para usar tu imagen.", choices: ["Aceptar con condiciones claras", "Rechazar y cuidar tu independencia", "Pedir consejo al club"], cases: [
    ["Calzado deportivo", "Una firma de botas te ofrece probar su nuevo modelo."], ["Ropa de calle", "Una marca de moda quiere grabar una campaña durante tu día libre."], ["Videojuego", "Un estudio te invita a aparecer en una promoción futbolística."], ["Bebida energética", "La propuesta incluye publicar varias fotos con el producto."], ["Marca local", "Una tienda de tu ciudad quiere patrocinar tus actividades comunitarias."], ["Colección retro", "Una empresa prepara una línea de camisetas inspirada en tu carrera."], ["Evento comercial", "Te piden dedicar una tarde a firmar autógrafos en un centro comercial."], ["Equipo tecnológico", "Una marca te ofrece dispositivos a cambio de una recomendación pública."], ["Campaña benéfica", "La empresa propone donar parte de los ingresos a una fundación."], ["Embajador internacional", "Una agencia te invita a representar una marca en otro país."]]},
  {cat: "Selección", title: "Una oportunidad internacional", open: "El calendario de selecciones puede cambiar tu temporada.", choices: ["Prepararte para darlo todo", "Hablar con el seleccionador", "Priorizar la recuperación y ser sincero"], cases: [
    ["Primera convocatoria", "Tu teléfono recibe una llamada inesperada del cuerpo técnico nacional."], ["Partido amistoso", "Te ofrecen participar en un amistoso lejos de casa."], ["Cambio de entrenador", "Un nuevo seleccionador quiere conocerte antes de tomar decisiones."], ["Puesto por cubrir", "Una baja abre una vacante en tu posición para el próximo torneo."], ["Concentración larga", "La convocatoria coincide con varias semanas lejos de tu club."], ["Compañero convocado", "Un compañero de equipo te pregunta cómo es el ambiente en la selección."], ["Debut aplazado", "Viajaste con el grupo, pero aún no has tenido minutos internacionales."], ["Capitanía juvenil", "El entrenador de una selección formativa te ofrece liderar al equipo."], ["Regreso cansado", "Vuelves de representar a tu país justo antes de un partido decisivo."], ["Clasificación complicada", "La selección necesita puntos y el próximo rival es uno de los favoritos."]]},
  {cat: "Vida personal", title: "Fuera del campo también decides", open: "Tu entorno te plantea una decisión que no aparece en el plan de partido.", choices: ["Proteger tu tiempo personal", "Aprovechar la oportunidad", "Buscar una solución compartida"], cases: [
    ["Estudios", "Una universidad te ofrece compatibilizar entrenamientos con una titulación."], ["Mudanza", "Tu familia valora trasladarse más cerca de la ciudad deportiva."], ["Fundación propia", "Un amigo propone crear una iniciativa social con tu nombre."], ["Descanso familiar", "Un compromiso familiar coincide con una actividad opcional del club."], ["Curso de idiomas", "El club ofrece clases para facilitar la adaptación al vestuario."], ["Proyecto de inversión", "Un conocido te presenta un negocio que requiere tiempo y dinero."], ["Vacaciones cortas", "Tienes dos días libres antes de volver a entrenar."], ["Entrevista larga", "Un documental quiere grabar en tu casa durante varias semanas."], ["Rutina digital", "Tu equipo de comunicación sugiere publicar más contenido personal."], ["Mentoría", "Un exjugador te ofrece acompañarte en la transición hacia el futuro."]]},
];
function playerWardrobeDecisionFx(theme, variant, option, failed) {
  var n = 1 + (variant % 3), t = theme % 5;
  if (option === 0) return {mor: n + (failed ? -1 : 1), prof: 1, coach: t === 0 ? 1 : 0};
  if (option === 1) return failed ? {mor: -n, coach: -n, fame: -1} : {fame: n, fans: n, prof: 1};
  return t === 1 ? {fit: n * 2, form: n} : (t === 2 ? {money: -n * 1000, prof: 1} : {coach: 1, form: n, mor: 1});
}
var PLAYER_DECISION_COUNT = 0;
PLAYER_DECISION_THEMES.forEach(function (theme, ti) {
  theme.cases.forEach(function (caseRow, vi) {
    var index = PLAYER_DECISION_COUNT++;
    EV({id: "extra_player_" + String(index + 1).padStart(3, "0"), tipo: "aleatoria", cat: theme.cat,
      title: N_(theme.title + " · " + caseRow[0]), once: true, w: 0.22,
      when: function (x) { return x.inSeason && !!x.p && (ti % 3 !== 0 || !x.p.inj); },
      text: function () { return tr(theme.open + " " + caseRow[1]); },
      opts: function () {
        var chance = 0.48 + (vi % 4) * 0.07;
        return [
          {t: tr(theme.choices[0]), ok: {txt: tr("Tu postura se entiende y te deja margen para concentrarte en el fútbol."), fx: playerWardrobeDecisionFx(ti, vi, 0, false)}},
          {t: tr(theme.choices[1]), p: chance,
            ok: {txt: tr("La apuesta sale bien y el grupo reconoce tu iniciativa."), fx: playerWardrobeDecisionFx(ti, vi, 1, false)},
            ko: {txt: tr("La decisión no tiene el efecto que esperabas y el ambiente se resiente."), fx: playerWardrobeDecisionFx(ti, vi, 1, true)}},
          {t: tr(theme.choices[2]), ok: {txt: tr("Encuentras un punto medio y sigues adelante sin hacer ruido."), fx: playerWardrobeDecisionFx(ti, vi, 2, false)}}
        ];
      }
    });
  });
});
