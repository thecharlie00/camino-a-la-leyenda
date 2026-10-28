/* ===== MÁS DECISIONES DEL ENTRENADOR =====
   Episodios reales de banquillos y clubes (con ref) llevados a un dilema parecido para tu míster,
   y situaciones nuevas del día a día: balón parado, filtraciones, agentes, propietario, césped, viajes, parones… */
function myBud(y, f, min) { return Math.max(min || 1e5, Math.round(y.m.bud * f / 1e5) * 1e5); }
function myR5(x) { return Math.round(x / 1e5) * 1e5; }
/* baja larga que no es una lesión (maternidad): semanas fuera sin parte médico */
function myLeave(pl, a, b) { return function () { pl.inj = Math.max(pl.inj, S.tw) + ri(a, b); pl.injN = tr("Baja por maternidad"); }; }

/* ============ EPISODIOS REALES ============ */
MEV({id: "my_remontada", tipo: "real", cat: "Prensa", title: "Si nos hicieron cuatro…", w: 1.2, cd: 3,
  ref: "En 2017, tras perder 4-0 en París, Luis Enrique dijo que si el PSG les había hecho cuatro, el Barcelona podía hacerle seis. En la vuelta ganó 6-1.",
  when: function (y) { var l = y.last; return y.inSeason && S.bi >= 1 && l.n >= 2 && l.l >= 1 && l.ga >= l.gf + 3; },
  text: function () { return tr("Os han goleado sin piedad y la prensa ya da la eliminatoria por perdida. En la rueda de prensa te preguntan si queda alguna esperanza."); },
  opts: function () { return [
    {t: tr("«Si nos hicieron cuatro, podemos hacer seis»"), p: 0.4,
      ok: {txt: tr("La frase prende en el vestuario y en la grada. El equipo sale a por todas."), fx: {fans: 6, sqMor: 5, buff: {v: 1.3, b: 1, n: tr("Fe ciega")}}},
      ko: {txt: tr("No hay milagro y tu frase se convierte en munición para los críticos."), fx: {rep: -3, fans: -3, sqMor: -2}}},
    {t: tr("Reconocer la superioridad del rival"), ok: {txt: tr("Discurso honesto. Nadie se ilusiona, pero tampoco nadie se decepciona."), fx: {rep: 1, chem: 1}}},
    {t: tr("Cerrar el vestuario y no dar titulares"), ok: {txt: tr("Semana de silencio y trabajo. El grupo se refugia en sí mismo."), fx: {chem: 3, fans: -1}}}
  ]; }});

MEV({id: "my_sacchi", tipo: "real", cat: "Táctica", title: "Presión y defensa en zona", w: 1.1, cd: 4,
  ref: "En 1987, Arrigo Sacchi, que nunca fue futbolista profesional, llegó al Milan e impuso la defensa en zona y la presión adelantada. Ganó las Copas de Europa de 1989 y 1990.",
  when: function (y) { return y.inSeason && S.bi <= 2 && S.yr - y.m.since <= 1; },
  text: function () { return tr("Quieres implantar una idea nueva: línea defensiva adelantada, presión alta y todos defendiendo en zona. Algunos veteranos se miran con escepticismo: «¿Y este quién se cree?»."); },
  opts: function () { return [
    {t: tr("Imponer la revolución desde ya"), p: 0.5,
      ok: {txt: tr("Tras semanas de repeticiones, el equipo empieza a moverse como un bloque. Los rivales se ahogan."), fx: {chem: -2, buff: {v: 1.4, b: 2, n: tr("Presión en bloque")}}},
      ko: {txt: tr("Los automatismos no llegan y os pillan a la espalda una y otra vez."), fx: {chem: -6, sqMor: -4, board: -3}}},
    {t: tr("Introducirla poco a poco"), ok: {txt: tr("Pequeños cambios cada semana. El vestuario se va convenciendo."), fx: {chem: 2, buff: {v: 0.5, b: 2, n: tr("Nueva idea")}}}},
    {t: tr("Adaptarte a lo que ya saben hacer"), ok: {txt: tr("Los jugadores agradecen no tener que reinventarse. Tú te guardas tu idea."), fx: {chem: 4, sqMor: 2, rep: -1}}}
  ]; }});

MEV({id: "my_disfrutad", tipo: "real", cat: "Vestuario", title: "Antes de la gran final", w: 1.8, cd: 3,
  ref: "En 1992, antes de la final de la Copa de Europa en Wembley contra la Sampdoria, Johan Cruyff despidió a sus jugadores con un «Salid y disfrutad». El Barcelona ganó 1-0 en la prórroga.",
  when: function (y) { return y.inSeason && S.bi >= 3 && y.pos >= 1 && y.pos <= 5; },
  text: function () { return tr("Se acerca el partido más importante del año y notas a los jugadores agarrotados. Tienes cinco minutos antes de salir al campo."); },
  opts: function () { return [
    {t: tr("«Salid y disfrutad»"), p: 0.6,
      ok: {txt: tr("Los hombros bajan, aparecen las sonrisas y el equipo juega suelto."), fx: {sqMor: 5, buff: {v: 1.2, b: 1, n: tr("Disfrutar")}}},
      ko: {txt: tr("Algunos se lo toman demasiado a la ligera y salen dormidos."), fx: {buff: {v: -0.6, b: 1, n: tr("Exceso de calma")}}}},
    {t: tr("Recordarles todo lo que hay en juego"), p: 0.5,
      ok: {txt: tr("El vestuario sale con los dientes apretados y se come al rival."), fx: {buff: {v: 1, b: 1, n: tr("Tensión competitiva")}}},
      ko: {txt: tr("La presión pesa y los nervios se notan en cada pase."), fx: {sqMor: -3, buff: {v: -0.8, b: 1, n: tr("Nervios")}}}},
    {t: tr("Repasar el plan una última vez"), ok: {txt: tr("Cada uno sabe lo que tiene que hacer. Ni euforia ni miedo."), fx: {chem: 2, buff: {v: 0.5, b: 1, n: tr("Plan claro")}}}}
  ]; }});

MEV({id: "my_creyentes", tipo: "real", cat: "Afición", title: "De escépticos a creyentes", once: true, w: 1.3,
  ref: "En octubre de 2015, en su presentación como entrenador del Liverpool, Jürgen Klopp dijo que había que pasar «de escépticos a creyentes». Ganó la Champions en 2019 y la Premier en 2020.",
  when: function (y) { return y.inSeason && S.yr === y.m.since && S.bi <= 2 && y.m.fans < 60; },
  text: function () { return tr("Has llegado a un club deprimido: la grada está harta y desconfía de cualquier promesa. Te toca dar tu primer gran mensaje a la afición."); },
  opts: function () { return [
    {t: tr("Pedirles que pasen de escépticos a creyentes"), p: 0.6,
      ok: {txt: tr("El mensaje cala. La grada vuelve a empujar como hacía años que no lo hacía."), fx: {fans: 8, sqMor: 3, buff: {v: 0.6, b: 2, n: tr("Creer")}}},
      ko: {txt: tr("Bonitas palabras, dicen. La grada esperará a ver resultados."), fx: {fans: -2}}},
    {t: tr("Prometer títulos en tres años"), p: 0.4,
      ok: {txt: tr("La ambición ilusiona a todos, directiva incluida."), fx: {fans: 6, board: 4}},
      ko: {txt: tr("Te toman por un vendehúmos y el titular te perseguirá."), fx: {rep: -3, fans: -3}}},
    {t: tr("Hablar solo de trabajo"), ok: {txt: tr("Mensaje sobrio. Nadie se emociona, pero nadie te reprocha nada."), fx: {board: 2, chem: 1}}}
  ]; }});

MEV({id: "my_paciencia", tipo: "real", cat: "Directiva", title: "Pides tiempo a la directiva", w: 1.6, cd: 3,
  ref: "Alex Ferguson llegó al Manchester United en noviembre de 1986 y no ganó su primer título hasta la FA Cup de 1990. El club le mantuvo pese a las críticas y acabó ganando trece ligas.",
  when: function (y) { return y.inSeason && S.yr - y.m.since <= 2 && y.m.board < 48 && S.bi >= 1; },
  text: function () { return tr("Los resultados no acompañan y en el palco empiezan los murmullos. Crees en tu proyecto, pero necesitas tiempo para que dé frutos."); },
  opts: function (y) { return [
    {t: tr("Presentar un plan a largo plazo"), p: clamp(0.35 + y.m.rep / 200, 0.35, 0.7),
      ok: {txt: tr("La directiva compra tu plan y te da margen. El vestuario lo nota."), fx: {board: 8, chem: 2}},
      ko: {txt: tr("«Aquí se vive del domingo». Te escuchan, pero no te creen."), fx: {board: -3}}},
    {t: tr("Pedir refuerzos para salvar la temporada"), p: 0.45,
      ok: {txt: tr("La directiva abre la cartera, aunque te deja claro que quiere resultados ya."), fx: {bud: myBud(y, 0.05), board: -2}},
      ko: {txt: tr("No hay un euro más y la petición sienta mal."), fx: {board: -5}}},
    {t: tr("Agachar la cabeza y trabajar"), ok: {txt: tr("Ni excusas ni promesas. Solo trabajo."), fx: {chem: 3, sqMor: 2}}}
  ]; }});

MEV({id: "my_dieta", tipo: "real", cat: "Vestuario", ctx: "verano", title: "Adiós a las costumbres de siempre", once: true, w: 1.4,
  ref: "En 1996, Arsène Wenger llegó al Arsenal y cambió la dieta, los estiramientos y los hábitos de una plantilla acostumbrada al alcohol. En 1998 ganó la liga y la copa.",
  when: function (y) { return S.yr - y.m.since <= 1; },
  text: function () { return tr("En la primera comida de pretemporada ves refrescos, bollería y planes para salir de copas tras los partidos. Tu preparador físico te propone cambiarlo todo de golpe."); },
  opts: function (y) { var g = myBud(y, 0.02, 5e4); return [
    {t: tr("Nutricionista y normas estrictas ({cost})", {cost: fmtMoney(g)}), p: 0.65,
      ok: {txt: tr("Al principio refunfuñan, pero a las pocas semanas vuelan en los entrenamientos."), fx: {bud: -g, sfit: 8, buff: {v: 0.8, b: 2, n: tr("Hábitos de élite")}, chem: -2}},
      ko: {txt: tr("Los veteranos se rebelan y se esconden chocolatinas en las taquillas."), fx: {bud: -g, chem: -5, sqMor: -3}}},
    {t: tr("Cambios graduales y pactados"), ok: {txt: tr("Pactáis unas normas mínimas. Mejoran poco a poco."), fx: {sfit: 4, chem: 2}}},
    {t: tr("Respetar sus costumbres"), ok: {txt: tr("El vestuario te recibe con los brazos abiertos. Las piernas, no tanto."), fx: {chem: 4, sfit: -4}}}
  ]; }});

MEV({id: "my_invencibles", tipo: "real", cat: "Plantilla", title: "Una racha imparable", w: 3, cd: 3,
  ref: "En la temporada 2003/04, el Arsenal de Arsène Wenger ganó la Premier League sin perder un solo partido: 26 victorias y 12 empates.",
  when: function (y) { var l = y.last; return y.inSeason && S.bi >= 1 && l.n >= 4 && l.l <= 1 && l.w >= l.n * 0.6 && y.pos >= 1 && y.pos <= 4; },
  text: function () { return tr("Lleváis semanas sin apenas perder y la prensa ya habla de una temporada histórica. Los titulares van justos de fuerzas y hay copa entre semana."); },
  opts: function () { return [
    {t: tr("Ir a por el récord con los de siempre"), p: 0.55,
      ok: {txt: tr("El once aguanta y la racha sigue. Ya sois historia viva del club."), fx: {fans: 6, rep: 3, sfit: -6, buff: {v: 0.8, b: 1, n: tr("Invictos")}}},
      ko: {txt: tr("Las piernas dicen basta y llega la derrota, con lesión incluida en el parte."), fx: {sfit: -8, sqMor: -3}}},
    {t: tr("Rotar aunque se rompa la racha"), ok: {txt: tr("Prioridad a la temporada, no a la estadística. Los suplentes lo agradecen."), fx: {sfit: 6, sqMor: 2, fans: -2}}},
    {t: tr("Prohibir hablar de la racha"), ok: {txt: tr("Nadie la menciona en el vestuario. El grupo sigue a lo suyo."), fx: {chem: 3, buff: {v: 0.4, b: 1, n: tr("Cabeza fría")}}}}
  ]; }});

MEV({id: "my_rehhagel", tipo: "real", cat: "Táctica", title: "David contra Goliat", w: 1.2, cd: 3,
  ref: "En 2004, la Grecia de Otto Rehhagel ganó la Eurocopa de Portugal sin partir entre los favoritos y con un fútbol muy defensivo. En la final venció 1-0 a la anfitriona.",
  when: function (y) { return y.inSeason && y.giant() >= 0 && y.clubR <= 78; },
  text: function (y) { return tr("Te toca el {club}, muy superior sobre el papel. Tu cuerpo técnico está dividido: encerrarse atrás o jugarle de tú a tú.", {club: clubName(y.giant())}); },
  opts: function () { return [
    {t: tr("Bloque bajo y balón parado"), p: 0.5,
      ok: {txt: tr("Defensa numantina y un gol a balón parado. Gran golpe."), fx: {fans: 4, rep: 2, buff: {v: 1, b: 1, n: tr("Muralla")}}},
      ko: {txt: tr("Aguantáis hasta que cae el primero y luego no sabéis atacar."), fx: {fans: -3}}},
    {t: tr("Jugarles de tú a tú"), p: 0.3,
      ok: {txt: tr("Valentía premiada: les pasáis por encima ante el asombro general."), fx: {fans: 8, rep: 4, sqMor: 4}},
      ko: {txt: tr("Os castigan cada espacio. Una goleada que escuece."), fx: {sqMor: -4, board: -3}}},
    {t: tr("Reservar a titulares para la liga"), ok: {txt: tr("Partido perdido de antemano, piernas frescas para lo que importa."), fx: {sfit: 5, fans: -3}}}
  ]; }});

MEV({id: "my_vikingo", tipo: "real", cat: "Afición", title: "Un ritual con la grada", w: 1, cd: 4,
  ref: "En la Eurocopa de 2016, Islandia eliminó a Inglaterra en octavos y su celebración con la afición, el aplauso vikingo, dio la vuelta al mundo.",
  when: function (y) { return y.inSeason && y.last.w >= 2; },
  text: function () { return tr("Tras una victoria, los ultras proponen un ritual: que la plantilla se acerque a la grada después de cada partido para celebrar juntos, se gane o se pierda."); },
  opts: function () { return [
    {t: tr("Adoptar el ritual"), p: 0.7,
      ok: {txt: tr("La comunión entre equipo y grada es total. El campo se convierte en una caldera."), fx: {fans: 8, chem: 3}},
      ko: {txt: tr("Tras una derrota, la celebración acaba en pitada y tensión."), fx: {fans: -2, sqMor: -3}}},
    {t: tr("Solo cuando se gane"), ok: {txt: tr("Un gesto bonito, sin forzar. La grada lo acepta."), fx: {fans: 3}}},
    {t: tr("Mantener distancia"), ok: {txt: tr("El equipo se centra en lo suyo. Los ultras se sienten despreciados."), fx: {fans: -4, chem: 1}}}
  ]; }});

MEV({id: "my_campo_ajeno", tipo: "real", cat: "Club", title: "Fuera del estadio principal", once: true, w: 0.9,
  ref: "En diciembre de 1921, la Federación Inglesa prohibió a sus clubes ceder sus campos a equipos femeninos. El veto no se levantó hasta 1971.",
  when: function (y) { return y.inSeason && S.bi >= 1; },
  text: function () { return S.g === "f" ? tr("La directiva quiere sacar a tu equipo del estadio principal para que el césped llegue impecable a los partidos de la sección masculina. Os mandarían a la ciudad deportiva.") : tr("La directiva quiere sacar a la sección femenina del estadio principal para que el césped llegue impecable a tus partidos. Las jugadoras te piden que des la cara por ellas."); },
  opts: function () { var f = S.g === "f"; return [
    {t: f ? tr("Plantarte: este también es vuestro estadio") : tr("Defender que sigan en el estadio"), p: 0.55,
      ok: {txt: tr("La directiva rectifica. Tu postura se aplaude dentro y fuera del club."), fx: {fans: 6, rep: 3, board: -2, chem: 2}},
      ko: {txt: tr("La directiva no da su brazo a torcer y toma nota de tu desafío."), fx: {board: -5, fans: 3}}},
    {t: tr("Proponer un calendario compartido"), ok: {txt: tr("Algunos partidos en el estadio, otros en la ciudad deportiva. Un parche razonable."), fx: {board: 2, fans: 2}}},
    {t: tr("Aceptar la decisión del club"), ok: f ? {txt: tr("Os mudáis a un campo pequeño. La plantilla se siente de segunda."), fx: {board: 4, sqMor: -5, fans: -4}} : {txt: tr("El césped está perfecto, pero la imagen del club se resiente."), fx: {board: 4, rep: -3, fans: -3}}}
  ]; }});

MEV({id: "my_maternidad", tipo: "real", cat: "Plantilla", title: "Una noticia muy feliz", w: 1.2, cd: 3,
  ref: "En 2021 entró en vigor la normativa de la FIFA que garantiza a las futbolistas un permiso de maternidad mínimo de catorce semanas y la obligación de reintegrarlas tras el parto.",
  when: function (y) { return y.inSeason && S.g === "f"; },
  target: function (y) { var l = mActive().filter(function (p) { return p.age >= 25 && p.age <= 35 && !p.inj && !p.rl; }); return l.length ? y.spick(l, "mat").id : null; },
  text: function (y) { return tr("{name} te cuenta que está embarazada. Le queda un año de contrato y quiere saber qué piensa hacer el club con ella.", {name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, g = myBud(y, 0.02, 5e4), out = tr("Estará de baja varios meses"); return [
    {t: tr("Renovarle y garantizar su vuelta"), ok: {txt: tr("El club se compromete con ella. El vestuario lo celebra como un título."), fx: {chem: 8, sqMor: 4, rep: 2, bud: -g, pmor: 15}, n: out, then: function () { pl.yrs = Math.max(pl.yrs, 2); myLeave(pl, 12, 18)(); }}},
    {t: tr("Cumplir lo mínimo que exige la norma"), ok: {txt: tr("Todo en regla, nada más. Ella lo nota."), fx: {pmor: -4, chem: -1}, n: out, then: myLeave(pl, 12, 18)}},
    {t: tr("Plan de vuelta con el cuerpo técnico"), p: 0.7,
      ok: {txt: tr("Un plan a medida para que vuelva fuerte. Un ejemplo para todo el club."), fx: {pmor: 10, chem: 4, fans: 3}, n: out, then: myLeave(pl, 10, 15)},
      ko: {txt: tr("El plan es demasiado ambicioso y su vuelta se complica."), fx: {pmor: 3}, n: out, then: myLeave(pl, 16, 22)}}
  ]; }});

MEV({id: "my_forest", tipo: "real", cat: "Mercado", title: "¿Y si soñamos?", w: 3, cd: 3,
  ref: "El Nottingham Forest de Brian Clough y Peter Taylor ganó la liga inglesa en 1978, recién ascendido, y después dos Copas de Europa seguidas, en 1979 y 1980.",
  when: function (y) { return y.inSeason && S.bi >= 1 && S.bi <= 3 && y.pos >= 1 && y.pos <= 6 && y.expPos >= y.pos + 2; },
  text: function () { return tr("Nadie os daba un duro y vais en la zona alta de la tabla. Se acerca el mercado de invierno y la directiva te pregunta si hace falta reforzarse para soñar."); },
  opts: function (y) { var g = myBud(y, 0.12, 3e5); return [
    {t: tr("Pedir dos fichajes con experiencia ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Llegan dos veteranos que saben lo que es ganar. El vestuario se crece."), fx: {bud: -g, board: 3, chem: -1, buff: {v: 1, b: 2, n: tr("Veteranía")}}}},
    {t: tr("Confiar en los que os han traído hasta aquí"), p: 0.5,
      ok: {txt: tr("El grupo se siente valorado y responde. Sigue el sueño."), fx: {chem: 5, sqMor: 4}},
      ko: {txt: tr("Las piernas y la falta de fondo de armario os pasan factura."), fx: {sfit: -6, sqMor: -2}}},
    {t: tr("Ahorrar y bajar las expectativas"), ok: {txt: tr("«Nuestro objetivo es otro». La directiva respira, la grada no tanto."), fx: {board: 3, fans: -4}}}
  ]; }});

MEV({id: "my_keegan", tipo: "real", cat: "Prensa", title: "La ventaja se esfuma", w: 2.5, cd: 3,
  ref: "En 1996, el Newcastle de Kevin Keegan llegó a tener doce puntos de ventaja en la Premier. En abril, con el Manchester United ya encima, Keegan estalló en directo en televisión. El título fue para el United.",
  when: function (y) { return y.inSeason && S.bi >= 2 && y.pos >= 1 && y.pos <= 3 && y.last.l >= 2; },
  text: function () { return tr("Ibais lanzados en la zona alta, pero tu perseguidor no falla y la ventaja se ha reducido a casi nada. Tras el partido, una cadena te pide una entrevista en directo."); },
  opts: function () { return [
    {t: tr("Soltar lo que llevas dentro en directo"), p: 0.3,
      ok: {txt: tr("Tu arrebato se convierte en grito de guerra para la grada."), fx: {fans: 6, sqMor: 3}},
      ko: {txt: tr("La imagen del míster desencajado transmite pánico al vestuario."), fx: {sqMor: -5, rep: -3, buff: {v: -1, b: 1, n: tr("Pánico")}}}},
    {t: tr("Sonreír y quitar presión"), ok: {txt: tr("«Ellos tienen más que perder». La calma se contagia."), fx: {chem: 2, buff: {v: 0.5, b: 1, n: tr("Calma")}}}},
    {t: tr("Volverse más conservador"), p: 0.55,
      ok: {txt: tr("Menos riesgos, partidos cerrados y puntos que valen oro."), fx: {buff: {v: 0.8, b: 1, n: tr("Pragmatismo")}, fans: -2}},
      ko: {txt: tr("El equipo pierde su identidad y se atasca."), fx: {chem: -3, fans: -3}}}
  ]; }});

MEV({id: "my_leeds", tipo: "real", cat: "Directiva", title: "Dinero prestado", once: true, w: 1,
  ref: "El Leeds United se endeudó para fichar a principios de los 2000 y llegó a semifinales de la Champions en 2001. Tres años después, ahogado por las deudas, bajó a segunda.",
  when: function (y) { return y.inSeason && S.bi <= 3 && y.clubR <= 82 && y.m.board >= 45; },
  text: function () { return tr("El presidente te propone pedir un préstamo enorme para fichar ya. «Con la Champions lo pagaremos de sobra», asegura. El director financiero no lo ve nada claro."); },
  opts: function (y) { var g = myBud(y, 0.3, 1e6); return [
    {t: tr("Aceptar el préstamo ({cost})", {cost: fmtMoney(g)}), d: tr("Más dinero hoy, menos margen salarial mañana."), ok: {txt: tr("Hay dinero para fichar como un grande. Ahora habrá que ganar."), fx: {bud: g, board: 4, wcap: 0.92}}},
    {t: tr("Un préstamo más pequeño"), ok: {txt: tr("Algo de margen sin hipotecar el club."), fx: {bud: myR5(g / 3), board: 1, wcap: 0.97}}},
    {t: tr("Rechazarlo: con lo que hay"), ok: {txt: tr("Cuentas sanas. El presidente se queda con las ganas."), fx: {board: -3, rep: 1}}}
  ]; }});

MEV({id: "my_chapman", tipo: "real", cat: "Táctica", title: "Cambia el reglamento", once: true, w: 1,
  ref: "En 1925 se cambió la regla del fuera de juego: bastaban dos rivales por delante, y no tres. Herbert Chapman respondió en el Arsenal con un nuevo sistema, la WM.",
  when: function (y) { return y.inSeason && S.bi <= 1 && S.yr - y.m.since >= 1; },
  text: function () { return tr("La liga aprueba una norma nueva sobre el juego y casi todos los equipos van a seguir igual. Tú ves una oportunidad para adelantarte con un sistema distinto."); },
  opts: function () { return [
    {t: tr("Inventar un sistema para la nueva norma"), p: 0.55,
      ok: {txt: tr("Mientras los rivales dudan, tu equipo ya juega como si la norma existiera desde siempre."), fx: {rep: 4, buff: {v: 1.2, b: 2, n: tr("Adelantados")}, chem: -2}},
      ko: {txt: tr("Demasiado pronto. Los jugadores no entienden el nuevo dibujo."), fx: {chem: -5, buff: {v: -0.5, b: 1, n: tr("Desajustes")}}}},
    {t: tr("Esperar a ver qué hacen los demás"), ok: {txt: tr("Prudencia. Ni ganas ni pierdes ventaja."), fx: {chem: 1}}},
    {t: tr("Encargar un estudio a los analistas"), ok: {txt: tr("Unas semanas de vídeo y datos para ajustar lo justo."), fx: {buff: {v: 0.5, b: 2, n: tr("Ajuste fino")}}}}
  ]; }});

MEV({id: "my_falso_nueve", tipo: "real", cat: "Táctica", title: "Tu estrella, de falso nueve", w: 1.1, cd: 4,
  ref: "El 2 de mayo de 2009, Guardiola situó a Messi como falso nueve en el Bernabéu y el Barcelona ganó 2-6 al Real Madrid.",
  when: function (y) { return y.inSeason && S.bi >= 1; },
  target: function (y) { var s = y.star(); return s && !s.inj && /^(ED|EI|MCO|MD|MI)$/.test(s.pos) ? s.id : null; },
  text: function (y) { return tr("Preparando un partido grande, se te ocurre algo arriesgado: sacar a {name} de su posición y ponerle de delantero centro sin referencias, para descolocar a los centrales rivales.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Probarlo en el partido grande"), p: 0.45,
      ok: {txt: tr("Los centrales no saben a quién marcar. Exhibición para el recuerdo."), fx: {pmor: 8, fans: 6, rep: 3, buff: {v: 1.3, b: 1, n: tr("Falso nueve")}}},
      ko: {txt: tr("Se pierde entre los centrales y el equipo queda sin profundidad."), fx: {pmor: -5, buff: {v: -0.6, b: 1, n: tr("Sin referencia")}}}},
    {t: tr("Ensayarlo antes en un partido menor"), ok: {txt: tr("Un primer ensayo con buenas sensaciones. Ya tienes un arma más."), fx: {pmor: 3, buff: {v: 0.5, b: 2, n: tr("Variante táctica")}}}},
    {t: tr("Cada uno en su sitio"), ok: {txt: tr("Lo de siempre funciona. Él lo agradece."), fx: {pmor: 2, chem: 1}}}
  ]; }});

MEV({id: "my_ninos", tipo: "real", cat: "Cantera", title: "«No se gana nada con niños»", w: 1.2, cd: 4,
  ref: "En agosto de 1995, tras una derrota del Manchester United lleno de jóvenes, Alan Hansen dijo en la tele que no se gana nada con niños. Aquel equipo ganó la liga y la copa.",
  when: function (y) { return y.inSeason && y.last.l >= 1 && mActive().filter(function (p) { return p.age <= 21; }).length >= 4; },
  text: function () { return tr("Tras una derrota, un comentarista muy influyente sentencia en televisión que con tantos jóvenes en el once no vas a ganar nada. La directiva te pregunta si no convendría fichar experiencia."); },
  opts: function (y) { var g = myBud(y, 0.06); return [
    {t: tr("Mantener a los jóvenes y responder en el campo"), p: 0.55,
      ok: {txt: tr("Los chavales se pican y encadenan victorias. El comentarista tendrá que tragarse sus palabras."), fx: {sqMor: 5, fans: 5, rep: 3}},
      ko: {txt: tr("Les pesa la presión y llegan más tropiezos."), fx: {board: -4, fans: -3}}},
    {t: tr("Fichar un veterano para guiarles ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Llega un veterano que les hace de hermano mayor."), fx: {bud: -g, chem: 3, board: 2}}},
    {t: tr("Sacar a algunos del once"), ok: {txt: tr("Más experiencia sobre el campo, pero los jóvenes se sienten traicionados."), fx: {sqMor: -3, board: 2, buff: {v: 0.4, b: 1, n: tr("Experiencia")}}}}
  ]; }});

MEV({id: "my_crazy_gang", tipo: "real", cat: "Vestuario", title: "Bromas pesadas", w: 1, cd: 4,
  ref: "En 1988, el Wimbledon de la «Crazy Gang», famoso por las bromas pesadas de su vestuario, ganó la FA Cup al Liverpool, el gran favorito.",
  when: function (y) { return y.inSeason && y.m.chem >= 45; },
  text: function () { return tr("Los veteranos han montado un ritual de bienvenida a base de bromas pesadas: ropa cortada, coches llenos de espuma… A los fichajes nuevos no les hace ninguna gracia."); },
  opts: function () { return [
    {t: tr("Dejarles hacer: une al grupo"), p: 0.55,
      ok: {txt: tr("Entre risas, el vestuario se convierte en una piña indestructible."), fx: {chem: 7, sqMor: 3}},
      ko: {txt: tr("Una broma se pasa de la raya y un fichaje se siente humillado."), fx: {chem: -4, sqMor: -3, board: -2}}},
    {t: tr("Poner límites claros"), ok: {txt: tr("Bromas sí, humillaciones no. Todos lo entienden."), fx: {chem: 3}}},
    {t: tr("Prohibirlas del todo"), ok: {txt: tr("Paz en el vestuario… y algo menos de chispa."), fx: {chem: -2, board: 2}}}
  ]; }});

MEV({id: "my_saipan", tipo: "real", cat: "Vestuario", title: "Tu capitán estalla", w: 1.2, cd: 4,
  ref: "En el Mundial de 2002, el seleccionador irlandés Mick McCarthy envió a casa a su capitán, Roy Keane, tras sus duras críticas a la preparación del equipo en Saipán.",
  when: function (y) { return y.inSeason; },
  target: function (y) { var c = y.m.cap != null ? mPl(y.m.cap) : null; return c && !c.loanOut && !c.inj ? c.id : null; },
  text: function (y) { return tr("{name}, tu capitán, se queja delante de todos de las instalaciones, los viajes y el nivel de exigencia. Dice que así no se puede competir y te señala a ti.", {name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, g = myBud(y, 0.03); return [
    {t: tr("Quitarle el brazalete"), p: 0.5,
      ok: {txt: tr("Golpe de autoridad. El vestuario entiende quién manda."), fx: {pmor: -15, board: 3, chem: 2}, then: function () { S.m.cap = mPickCaptain(); if (S.m.cap === pl.id) S.m.cap = null; }},
      ko: {txt: tr("Medio vestuario se pone de su lado y el ambiente se envenena."), fx: {pmor: -20, chem: -8, sqMor: -4}, then: function () { S.m.cap = null; }}},
    {t: tr("Darle la razón y pedir mejoras al club ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Se mejoran las condiciones. El capitán se siente escuchado, la directiva no tanto."), fx: {bud: -g, pmor: 10, chem: 3, board: -3}}},
    {t: tr("Hablarlo a solas"), p: 0.6,
      ok: {txt: tr("Os decís las verdades y salís con un plan común."), fx: {pmor: 6, chem: 2}},
      ko: {txt: tr("La conversación acaba a gritos y se filtra a la prensa."), fx: {pmor: -8, rep: -2}}}
  ]; }});

MEV({id: "my_agua_bendita", tipo: "real", cat: "Vestuario", title: "Supersticiones en el banquillo", w: 1.6, cd: 4,
  ref: "En el Mundial de 2002, Giovanni Trapattoni, seleccionador de Italia, se hizo famoso por rociar agua bendita en el banquillo durante los partidos.",
  when: function (y) { return y.inSeason && y.last.n >= 3 && y.last.w * 3 <= y.last.n; },
  text: function () { return tr("Lleváis varias semanas ganando muy poco. Tu utillero, muy supersticioso, te trae un frasco de agua bendita y jura que hay que rociar el banquillo antes del partido."); },
  opts: function () { return [
    {t: tr("Rociar el banquillo delante de las cámaras"), p: 0.5,
      ok: {txt: tr("Ganáis y el gesto se convierte en leyenda. La grada se lo pasa en grande."), fx: {fans: 5, sqMor: 3}},
      ko: {txt: tr("Tampoco ganáis y las imágenes dan la vuelta a las redes entre burlas."), fx: {rep: -3, fans: -2}}},
    {t: tr("Hacerlo a escondidas"), ok: {txt: tr("Nadie se entera. El utillero se queda tranquilo y tú también."), fx: {chem: 1, sqMor: 1}}},
    {t: tr("«Aquí se gana entrenando»"), ok: {txt: tr("Sesión extra de táctica en lugar de rituales."), fx: {sfit: -4, buff: {v: 0.5, b: 1, n: tr("Trabajo")}}}}
  ]; }});

/* ============ SITUACIONES NUEVAS ============ */
MEV({id: "my_balon_parado", tipo: "real", cat: "Táctica", title: "Un especialista en balón parado", w: 1.1, cd: 4,
  when: function (y) { return y.inSeason && y.last.n >= 3; },
  text: function () { return tr("Un entrenador especialista en balón parado se ofrece al club. Sus equipos marcan uno de cada tres goles en córneres y faltas, pero quiere libertad para robar horas de entrenamiento."); },
  opts: function (y) { var g = myBud(y, 0.02, 5e4); return [
    {t: tr("Ficharle y darle carta blanca ({cost})", {cost: fmtMoney(g)}), p: 0.65,
      ok: {txt: tr("Jugadas ensayadas que parecen coreografías. Los goles llegan."), fx: {bud: -g, buff: {v: 1, b: 2, n: tr("Balón parado")}}},
      ko: {txt: tr("Tantas jugadas nuevas confunden a los jugadores y los demás entrenamientos se resienten."), fx: {bud: -g, chem: -3}}},
    {t: tr("Contratarle como asesor puntual"), ok: {txt: tr("Unas cuantas jugadas buenas sin cambiar la rutina."), fx: {bud: -Math.max(5e4, myR5(g / 2)), buff: {v: 0.5, b: 1, n: tr("Estrategia")}}}},
    {t: tr("Que se encargue tu segundo"), ok: {txt: tr("Tu segundo se lo toma como un reto personal."), fx: {chem: 1}}}
  ]; }});

MEV({id: "my_filtracion", tipo: "aleatoria", cat: "Vestuario", title: "Alguien filtra tu once", w: 1.2, cd: 3,
  when: function (y) { return y.inSeason && S.bi >= 1; },
  text: function () { return tr("Por segunda semana seguida, tu alineación aparece publicada en un periódico horas antes del partido. Hay un topo en el vestuario o en el cuerpo técnico."); },
  opts: function () { return [
    {t: tr("Dar alineaciones falsas para cazarle"), p: 0.5,
      ok: {txt: tr("La trampa funciona: el topo queda retratado y la filtración se acaba."), fx: {chem: 4, board: 2}},
      ko: {txt: tr("No caza a nadie y los jugadores se sienten vigilados."), fx: {chem: -5, sqMor: -2}}},
    {t: tr("Dar el once solo una hora antes"), ok: {txt: tr("Se acaban las filtraciones, pero los jugadores se preparan peor."), fx: {buff: {v: -0.3, b: 1, n: tr("Once tardío")}, chem: 1}}},
    {t: tr("Encararlo delante de todos"), p: 0.4,
      ok: {txt: tr("Tu discurso hace que el culpable dé un paso al frente. Asunto zanjado."), fx: {chem: 5, rep: 1}},
      ko: {txt: tr("Nadie habla y el ambiente se enrarece."), fx: {chem: -4}}}
  ]; }});

MEV({id: "my_superagente", tipo: "aleatoria", cat: "Mercado", title: "Un superagente con mucho poder", w: 1.1, cd: 4,
  when: function (y) { return y.inSeason && mActive().filter(function (p) { return p.role === "C" || p.role === "I"; }).length >= 4; },
  target: function (y) { var l = mActive().filter(function (p) { return (p.role === "C" || p.role === "I") && p.age <= 29 && !p.rl; }); return l.length ? y.spick(l, "ag").id : null; },
  text: function (y) { return tr("El agente de {name} representa también a otros dos de tus jugadores. Ahora exige que su cliente cobre como los mejores, o «se lo pensarán todos».", {name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, rise = Math.max(1e4, Math.round(pl.sal * 0.3 / 1e4) * 1e4); return [
    {t: tr("Subirle el sueldo"), d: tr("Unos {sal} más al año.", {sal: fmtMoney(rise)}), ok: {txt: tr("Paz con el agente… hasta la próxima. Otros jugadores toman nota."), fx: {pmor: 10, chem: -2, board: -2}, then: function () { pl.sal += rise; }}},
    {t: tr("Plantarte ante el agente"), p: 0.5,
      ok: {txt: tr("El agente recula: su cliente no quiere irse. Ganas autoridad."), fx: {board: 4, rep: 2}},
      ko: {txt: tr("El agente cumple su amenaza y tres jugadores se ponen tensos."), fx: {pmor: -12, sqMor: -3, preq: true}}},
    {t: tr("Hablar directamente con el jugador"), p: 0.6,
      ok: {txt: tr("El jugador se compromete con el proyecto, digan lo que digan.") , fx: {pmor: 6, chem: 2}},
      ko: {txt: tr("El jugador te remite a su agente. Te sientes ninguneado."), fx: {pmor: -4}}}
  ]; }});

MEV({id: "my_dueno_once", tipo: "aleatoria", cat: "Directiva", title: "El dueño quiere elegir el once", w: 1.1, cd: 4,
  when: function (y) { return y.inSeason && S.bi >= 1; },
  target: function () { var l = mActive().filter(function (p) { return (p.role === "R" || p.role === "S") && !p.inj && !p.rl; }).sort(function (a, b) { return b.ovr - a.ovr; }); return l.length ? l[0].id : null; },
  text: function (y) { return tr("El propietario te manda un mensaje la víspera del partido: quiere ver a {name} de titular. Dice que es «una sugerencia».", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Hacerle caso"), p: 0.55,
      ok: {txt: tr("El jugador cumple y el dueño presume de ojo clínico. Tú tragas saliva."), fx: {board: 6, pmor: 8, rep: -1}},
      ko: {txt: tr("Partido para olvidar y el vestuario sabe por qué jugó."), fx: {board: 2, chem: -5, rep: -2}}},
    {t: tr("Ignorarle con educación"), ok: {txt: tr("Tú decides las alineaciones. El dueño no lo olvidará."), fx: {board: -6, chem: 3, rep: 2}}},
    {t: tr("Darle minutos en la segunda parte"), ok: {txt: tr("Un término medio que deja a todos casi contentos."), fx: {board: 2, pmor: 3}}}
  ]; }});

MEV({id: "my_cesped", tipo: "aleatoria", cat: "Club", title: "Un césped impracticable", w: 1.1, cd: 4,
  when: function (y) { return y.inSeason && (S.bi === 2 || S.bi === 3); },
  text: function () { return tr("Las lluvias y un concierto han dejado el césped de tu estadio lleno de calvas y barro. Tu juego de toque se resiente y el jardinero pide una solución cara."); },
  opts: function (y) { var g = myBud(y, 0.04, 1e5); return [
    {t: tr("Instalar césped híbrido nuevo ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Una alfombra. El balón vuelve a correr."), fx: {bud: -g, buff: {v: 0.6, b: 2, n: tr("Césped perfecto")}, board: -1}}},
    {t: tr("Adaptar el juego: balones largos"), p: 0.55,
      ok: {txt: tr("Fútbol directo y segundas jugadas. Funciona en ese barrizal."), fx: {buff: {v: 0.5, b: 1, n: tr("Juego directo")}}},
      ko: {txt: tr("Los jugadores no saben jugar así y la grada pita."), fx: {fans: -4, chem: -2}}},
    {t: tr("Parchearlo y aguantar"), ok: {txt: tr("Unos tepes nuevos y a rezar. Alguna torcedura de tobillo."), fx: {sfit: -4}}}
  ]; }});

MEV({id: "my_vuelo", tipo: "aleatoria", cat: "Club", title: "Vuelo cancelado", w: 1.1, cd: 3,
  when: function (y) { return y.inSeason; },
  text: function () { return tr("Tu vuelo para el partido fuera de casa se cancela por una tormenta. Las alternativas: diez horas de autobús esta noche o un vuelo privado carísimo mañana a primera hora."); },
  opts: function (y) { var g = myBud(y, 0.015, 5e4); return [
    {t: tr("Pagar el vuelo privado ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Llegáis descansados. El director financiero no tanto."), fx: {bud: -g, board: -1}}},
    {t: tr("Autobús nocturno"), p: 0.5,
      ok: {txt: tr("La odisea une al grupo: canciones, cartas y una victoria con épica."), fx: {chem: 4, sfit: -5}},
      ko: {txt: tr("Llegáis destrozados y se nota desde el primer minuto."), fx: {sfit: -8, buff: {v: -0.6, b: 1, n: tr("Viaje infernal")}}}},
    {t: tr("Pedir aplazar el partido"), p: 0.35,
      ok: {txt: tr("La liga acepta y ganáis un día de descanso."), fx: {sfit: 3}},
      ko: {txt: tr("La liga se niega y llegáis con lo justo y de mal humor."), fx: {sfit: -6, sqMor: -2}}}
  ]; }});

MEV({id: "my_vuelta_paron", tipo: "aleatoria", cat: "Selección", title: "Vuelven tarde del parón", w: 1.2, cd: 3,
  when: function (y) { return y.inSeason && S.bi >= 1 && mActive().filter(function (p) { return p.role === "C" || p.role === "I"; }).length >= 3; },
  text: function () { return tr("Tras el parón de selecciones, cuatro de tus titulares vuelven el jueves tras cruzar medio mundo, con el partido el sábado. Llegan cansados y con jet lag."); },
  opts: function () { return [
    {t: tr("Que jueguen igualmente"), p: 0.55,
      ok: {txt: tr("Son profesionales y responden aunque vayan justos."), fx: {sfit: -4}},
      ko: {txt: tr("Se arrastran por el campo y uno acaba con una sobrecarga."), fx: {sfit: -7, buff: {v: -0.7, b: 1, n: tr("Jet lag")}}}},
    {t: tr("Reservarles y tirar de suplentes"), ok: {txt: tr("Los menos habituales tienen su oportunidad y se dejan la piel."), fx: {sqMor: 3, buff: {v: -0.4, b: 1, n: tr("Once alternativo")}}}},
    {t: tr("Plan de recuperación con el cuerpo médico"), ok: {txt: tr("Crioterapia, siestas pautadas y luz solar. Llegan algo mejor."), fx: {sfit: 2, bud: -30000}}}
  ]; }});

MEV({id: "my_prodigio", tipo: "aleatoria", cat: "Cantera", title: "Un prodigio de quince años", once: true, w: 1.2,
  when: function (y) { return y.inSeason && mActive().length <= 30; },
  text: function () { return tr("En la cantera hay un chico de quince años que lo hace todo con una facilidad insultante. Los grandes de Europa ya preguntan por él y su familia duda."); },
  opts: function (y) { var g = myBud(y, 0.03, 1e5);
    var promote = function (bonus) { return function () { var p = S.m.sq[S.m.sq.length - 1]; if (p && p.yth) { p.age = 16; p.pot = Math.min(95, p.pot + bonus); } }; };
    return [
    {t: tr("Subirle al primer equipo ya"), p: 0.6,
      ok: {txt: tr("Firma su primer contrato y entrena con los mayores. La grada ya corea su nombre."), fx: {youth: 1, fans: 5, rep: 2}, n: tr("Un prodigio en la plantilla"), then: promote(10)},
      ko: {txt: tr("Sube, pero la presión le supera y tarda en adaptarse."), fx: {youth: 1, fans: 2}, then: promote(5)}},
    {t: tr("Blindarle con un contrato de formación ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("La familia confía en el club y el chico sube con calma."), fx: {bud: -g, youth: 1, board: 2}, n: tr("Un prodigio en la plantilla"), then: promote(8)}},
    {t: tr("Venderle a un grande"), ok: {txt: tr("Una cantidad muy jugosa. La cantera llora la pérdida."), fx: {bud: myBud(y, 0.08, 3e5), fans: -5, board: 3}}}
  ]; }});

MEV({id: "my_capitania", tipo: "aleatoria", cat: "Vestuario", title: "¿Quién lleva el brazalete?", w: 1, cd: 4,
  when: function (y) { return y.inSeason && S.bi <= 2; },
  target: function () { var c = S.m.cap, l = mActive().filter(function (p) { return p.id !== c && p.age <= 25 && (p.role === "C" || p.role === "I") && !p.rl; }).sort(function (a, b) { return b.ovr - a.ovr; }); return l.length ? l[0].id : null; },
  text: function (y) { var c = y.m.cap != null ? mPl(y.m.cap) : null; return c ? tr("{young}, joven y con carisma, se ha convertido en un líder del grupo. Algunos piden que herede el brazalete de {cap}.", {young: plName(y.pl), cap: plName(c)}) : tr("{young}, joven y con carisma, se ha convertido en un líder del grupo. Algunos piden que sea el nuevo capitán.", {young: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl; return [
    {t: tr("Darle el brazalete"), p: 0.55,
      ok: {txt: tr("Un nuevo líder para una nueva etapa. Los jóvenes se sienten representados."), fx: {pmor: 12, chem: 3}, then: function () { S.m.cap = pl.id; }},
      ko: {txt: tr("Los veteranos se sienten desplazados y el vestuario se divide."), fx: {pmor: 8, chem: -6}, then: function () { S.m.cap = pl.id; }}},
    {t: tr("Que vote la plantilla"), ok: {txt: tr("Votación democrática. Gane quien gane, todos lo aceptan."), fx: {chem: 4, sqMor: 2}}},
    {t: tr("Mantener al capitán actual"), ok: {txt: tr("Jerarquía ante todo. El joven tendrá que esperar."), fx: {pmor: -5, chem: 1}}}
  ]; }});

MEV({id: "my_gato", tipo: "aleatoria", cat: "Vestuario", title: "Un gato en el entrenamiento", w: 0.9, cd: 4,
  when: function (y) { return y.inSeason && y.last.w >= 2; },
  text: function () { return tr("Desde que un gato callejero se coló en el campo de entrenamiento, no habéis perdido. La plantilla quiere adoptarlo como mascota y la prensa ya le ha puesto nombre."); },
  opts: function () { return [
    {t: tr("Adoptarlo como mascota oficial"), p: 0.7,
      ok: {txt: tr("El gato se convierte en un fenómeno y las camisetas con su cara se agotan."), fx: {fans: 5, chem: 3, bud: 50000}},
      ko: {txt: tr("Llega la primera derrota y alguien culpa al gato. Ridículo nacional."), fx: {rep: -2, chem: -1}}},
    {t: tr("Dejarlo a cargo del utillero, sin publicidad"), ok: {txt: tr("El gato vive feliz en el vestuario. Todos sonríen al verlo."), fx: {chem: 2}}},
    {t: tr("Pedir que se lo lleve una protectora"), ok: {txt: tr("Decisión sensata. Algún jugador supersticioso no lo lleva bien."), fx: {sqMor: -2}}}
  ]; }});

MEV({id: "my_panolada", tipo: "aleatoria", cat: "Afición", title: "Pañolada contra tu estilo", w: 1.3, cd: 3,
  when: function (y) { var l = y.last; return y.inSeason && l.n >= 3 && l.w <= 1 && l.gf <= l.n && y.m.fans < 60; },
  text: function () { return tr("Tras otro partido sin apenas ocasiones, la grada saca los pañuelos. No piden tu cabeza: piden que el equipo ataque."); },
  opts: function () { return [
    {t: tr("Pasar a un plan más ofensivo"), p: 0.5,
      ok: {txt: tr("El equipo se suelta y la grada vuelve a disfrutar."), fx: {fans: 6, buff: {v: 0.6, b: 1, n: tr("Más ataque")}}},
      ko: {txt: tr("Os abrís y os pillan a la contra. Ahora pitan más."), fx: {fans: -3, sqMor: -3}}},
    {t: tr("Defender tu idea en rueda de prensa"), ok: {txt: tr("«Los resultados llegarán». La directiva te respalda; la grada, a medias."), fx: {board: 2, fans: -3}}},
    {t: tr("Reunirte con las peñas"), p: 0.6,
      ok: {txt: tr("Explicas tu plan cara a cara y te ganas algo de crédito."), fx: {fans: 5, rep: 1}},
      ko: {txt: tr("La reunión acaba en reproches y se filtra a la prensa."), fx: {fans: -2, board: -2}}}
  ]; }});

MEV({id: "my_patrocinador_acto", tipo: "aleatoria", cat: "Club", title: "Un acto del patrocinador", w: 1, cd: 3,
  when: function (y) { return y.inSeason; },
  text: function () { return tr("El patrocinador principal organiza un acto con toda la plantilla la víspera de un partido importante: fotos, firmas y una cena que acabará tarde. El contrato lo permite."); },
  opts: function (y) { var g = myBud(y, 0.02, 5e4); return [
    {t: tr("Ir con toda la plantilla"), ok: {txt: tr("El patrocinador está encantado y promete más dinero. Los jugadores, agotados."), fx: {bud: g, board: 3, sfit: -5}}},
    {t: tr("Mandar solo a los capitanes"), p: 0.6,
      ok: {txt: tr("El patrocinador lo acepta con una sonrisa."), fx: {board: 1}},
      ko: {txt: tr("El patrocinador se queja a la directiva."), fx: {board: -3}}},
    {t: tr("Pedir que se cambie la fecha"), p: 0.45,
      ok: {txt: tr("Lo trasladan a después del partido. Todos contentos."), fx: {board: 2, chem: 1}},
      ko: {txt: tr("No hay manera y el patrocinador se molesta."), fx: {board: -4}}}
  ]; }});

MEV({id: "my_filial", tipo: "aleatoria", cat: "Cantera", title: "El filial se juega el ascenso", w: 1, cd: 3,
  when: function (y) { return y.inSeason && S.bi >= 3; },
  text: function () { return tr("El filial se juega el ascenso este fin de semana y su entrenador te pide a dos jugadores del primer equipo que apenas juegan contigo."); },
  opts: function () { return [
    {t: tr("Cederles para el partido"), p: 0.6,
      ok: {txt: tr("Ascenso del filial. La cantera tiene un escaparate mejor."), fx: {youth: 1, board: 3, fans: 2}},
      ko: {txt: tr("El filial no asciende y los dos jugadores se sienten degradados."), fx: {sqMor: -2}}},
    {t: tr("Negarte: los necesitas en el banquillo"), ok: {txt: tr("El primer equipo es lo primero. En la cantera hay malestar."), fx: {board: -2}}},
    {t: tr("Mandar juveniles que entrenan contigo"), ok: {txt: tr("Una solución intermedia. Los chavales lo viven con ilusión."), fx: {chem: 1, fans: 1}}}
  ]; }});

MEV({id: "my_ia_ojeador", tipo: "aleatoria", cat: "Datos", ctx: "verano", title: "Un ojeador artificial", once: true, w: 1.2,
  when: function (y) { return y.m.bud >= 5e5 && !y.m.flags.data; },
  text: function () { return tr("Una empresa te ofrece una plataforma de inteligencia artificial que analiza miles de partidos y te sugiere fichajes. Tus ojeadores temen quedarse sin trabajo."); },
  opts: function (y) { var g = myBud(y, 0.04, 2e5); return [
    {t: tr("Contratarla y reducir ojeadores ({cost})", {cost: fmtMoney(g)}), p: 0.6,
      ok: {txt: tr("La plataforma encuentra gangas que nadie había visto."), fx: {bud: -g, board: 3, flag: {data: true}}, n: tr("Fichajes un 10 % más baratos y potencial más preciso")},
      ko: {txt: tr("El algoritmo recomienda jugadores que ya no existen o están retirados. Hazmerreír."), fx: {bud: -g, rep: -3}}},
    {t: tr("Usarla como apoyo de los ojeadores"), ok: {txt: tr("Datos y ojo humano juntos. Más caro, pero sólido."), fx: {bud: -myR5(g * 1.3), flag: {data: true}}, n: tr("Fichajes un 10 % más baratos y potencial más preciso")}},
    {t: tr("Rechazarla"), ok: {txt: tr("Los ojeadores de siempre siguen viajando por medio mundo."), fx: {chem: 1}}}
  ]; }});

MEV({id: "my_redes", tipo: "aleatoria", cat: "Disciplina", title: "Un mensaje en las redes", w: 1.2, cd: 2,
  when: function (y) { return y.inSeason; },
  target: function (y) { var l = mActive().filter(function (p) { return (p.role === "R" || p.role === "I") && p.mor < 55 && p.age <= 30 && !p.rl; }); return l.length ? y.spick(l, "rd").id : null; },
  text: function (y) { return tr("{name} ha publicado un mensaje enigmático en sus redes tras quedarse en el banquillo: «Hay cosas que no se entienden». La prensa ya lo interpreta como un ataque a ti.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Multarle"), ok: {txt: tr("Mensaje claro para todo el vestuario. Él lo encaja mal."), fx: {pmor: -10, board: 2, chem: 1}}},
    {t: tr("Restarle importancia en rueda de prensa"), p: 0.6,
      ok: {txt: tr("«Es normal querer jugar». Se acaba la polémica."), fx: {pmor: 4, rep: 1}},
      ko: {txt: tr("Lo vuelve a hacer la semana siguiente."), fx: {pmor: -3, chem: -3}}},
    {t: tr("Darle la titularidad el próximo partido"), p: 0.5,
      ok: {txt: tr("Responde en el campo y pide perdón."), fx: {pmor: 10, chem: 1}},
      ko: {txt: tr("El vestuario entiende que quejarse en redes tiene premio."), fx: {pmor: 6, chem: -5}}}
  ]; }});

MEV({id: "my_gps", tipo: "aleatoria", cat: "Datos", title: "El GPS no perdona", w: 1.1, cd: 4,
  when: function (y) { return y.inSeason && S.bi >= 1; },
  target: function (y) { var s = y.star(); return s && !s.inj && s.pos !== "POR" ? s.id : null; },
  text: function (y) { return tr("El analista te enseña los datos del GPS: {name}, tu mejor jugador, es el que menos corre y menos presiona de todo el equipo. Teme que el resto empiece a imitarle.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Enseñarle los datos en privado"), p: 0.6,
      ok: {txt: tr("Se pica y empieza a presionar como el que más."), fx: {pmor: 2, chem: 3, buff: {v: 0.6, b: 2, n: tr("Presión de todos")}}},
      ko: {txt: tr("«Yo estoy para decidir partidos, no para correr». Se ofende."), fx: {pmor: -8}}},
    {t: tr("Diseñar el sistema para liberarle"), ok: {txt: tr("Los demás corren por él. Su talento brilla, el resto se cansa más."), fx: {pmor: 6, sfit: -4, chem: -2}}},
    {t: tr("Publicar los datos de todos en el vestuario"), p: 0.45,
      ok: {txt: tr("La competencia interna dispara la intensidad."), fx: {buff: {v: 0.8, b: 1, n: tr("Competencia interna")}, sqMor: 1}},
      ko: {txt: tr("Se sienten expuestos y el ambiente se tensa."), fx: {chem: -5, pmor: -5}}}
  ]; }});

MEV({id: "my_segundo", tipo: "aleatoria", cat: "Futuro", title: "Quieren a tu segundo", w: 1, cd: 4,
  when: function (y) { return y.inSeason && y.m.rep >= 35 && S.bi <= 3; },
  text: function () { return tr("Un club de una categoría inferior ofrece a tu segundo entrenador ser primer técnico. Es tu mano derecha y conoce a todos los jugadores."); },
  opts: function (y) { var g = myBud(y, 0.015, 5e4); return [
    {t: tr("Dejarle marchar con tu bendición"), ok: {txt: tr("Se despide emocionado. Tú pierdes a tu mejor apoyo."), fx: {rep: 2, chem: -3}}},
    {t: tr("Pedir al club que le mejore el contrato ({cost})", {cost: fmtMoney(g)}), p: 0.6,
      ok: {txt: tr("Se queda contigo. El cuerpo técnico sale reforzado."), fx: {bud: -g, chem: 3}},
      ko: {txt: tr("Agradece el gesto, pero se va igualmente."), fx: {bud: -g, chem: -3}}},
    {t: tr("Promocionar a un técnico de la cantera"), ok: {txt: tr("Savia nueva en el staff. Los canteranos tienen un aliado."), fx: {chem: -1, sqMor: 2}}}
  ]; }});

MEV({id: "my_psicologo", tipo: "aleatoria", cat: "Médico", title: "Cabezas bloqueadas", w: 2.5, cd: 3,
  when: function (y) { return y.inSeason && (mAvgMor() < 60 || y.last.l >= y.last.w + 3); },
  text: function () { return tr("La plantilla tiene la moral por los suelos. El médico propone incorporar un psicólogo deportivo; algunos veteranos dicen que «eso es para los débiles»."); },
  opts: function (y) { var g = myBud(y, 0.015, 5e4); return [
    {t: tr("Incorporar un psicólogo ({cost})", {cost: fmtMoney(g)}), p: 0.7,
      ok: {txt: tr("Sesiones voluntarias que acaban llenas. El grupo respira."), fx: {bud: -g, sqMor: 6, chem: 2}},
      ko: {txt: tr("Pocos acuden y los veteranos se burlan de la iniciativa."), fx: {bud: -g, sqMor: 1, chem: -2}}},
    {t: tr("Unos días libres para desconectar"), ok: {txt: tr("Familia, playa y móvil apagado. Vuelven con otra cara."), fx: {sqMor: 4, sfit: 3, buff: {v: -0.3, b: 1, n: tr("Poco rodaje")}}}},
    {t: tr("Más trabajo y menos lamentos"), ok: {txt: tr("Doble sesión. Algunos lo agradecen; otros se hunden más."), fx: {sqMor: -2, buff: {v: 0.5, b: 1, n: tr("Mano dura")}}}}
  ]; }});

MEV({id: "my_clausula", tipo: "aleatoria", cat: "Mercado", title: "Quiere una cláusula de salida", w: 1.1, cd: 3,
  when: function (y) { return y.inSeason && S.bi <= 3; },
  target: function (y) { var l = mActive().filter(function (p) { return p.age <= 26 && p.role !== "P" && p.ovr >= mSquadAvg() && !p.rl && !p.leaveTo; }); return l.length ? y.spick(l, "cl").id : null; },
  text: function (y) { return tr("{name} quiere renovar, pero con una cláusula de salida asequible por si llama un grande. Sin ella, se niega a firmar.", {name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, rise = Math.max(1e4, Math.round(pl.sal * 0.4 / 1e4) * 1e4); return [
    {t: tr("Aceptar la cláusula"), ok: {txt: tr("Firma feliz. Quizá algún día te arrepientas."), fx: {pmor: 10, board: -3}, then: function () { pl.yrs = Math.max(pl.yrs, 3); }}},
    {t: tr("Ofrecer más sueldo sin cláusula"), d: tr("Unos {sal} más al año.", {sal: fmtMoney(rise)}), p: 0.55,
      ok: {txt: tr("El dinero le convence y firma sin cláusula."), fx: {pmor: 6, board: 2}, then: function () { pl.sal += rise; pl.yrs = Math.max(pl.yrs, 4); }},
      ko: {txt: tr("No le interesa el dinero, sino la libertad. Se enfada."), fx: {pmor: -8}}},
    {t: tr("No negociar"), ok: {txt: tr("Si no firma, se irá cuando acabe su contrato."), fx: {pmor: -10, preq: true, board: 1}}}
  ]; }});

MEV({id: "my_horario_tv", tipo: "aleatoria", cat: "Club", title: "La tele te cambia el horario", w: 1.1, cd: 3,
  when: function (y) { return y.inSeason && y.clubR >= 55; },
  text: function () { return tr("La televisión mueve vuestro partido al lunes por la noche, tres días después de un duelo de copa fuera de casa y justo antes de otro viaje. La afición, indignada."); },
  opts: function () { return [
    {t: tr("Protestar públicamente"), p: 0.4,
      ok: {txt: tr("La presión funciona y la liga recoloca el partido."), fx: {fans: 4, sfit: 3}},
      ko: {txt: tr("La liga no cede y la federación te abre expediente."), fx: {bud: -30000, board: -2, fans: 3}}},
    {t: tr("Aceptarlo y rotar"), ok: {txt: tr("Sin dramas. Media plantilla nueva el lunes."), fx: {buff: {v: -0.4, b: 1, n: tr("Rotaciones")}, sqMor: 2}}},
    {t: tr("Pedir al club que compense a los abonados"), ok: {txt: tr("Descuentos para los que no puedan ir. La grada lo agradece."), fx: {fans: 5, bud: -50000, board: -1}}}
  ]; }});
