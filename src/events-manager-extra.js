/* ===== DECISIONES EXTRA DEL ENTRENADOR =====
   Hechos reales del fútbol femenino (con ref) pensados para valer en cualquier modo, y situaciones nuevas
   (datos, prevención, cámaras, VAR, afición, estadio, patrocinio, selecciones, cantera, idiomas). */
function mxBud(y, f, min) { return Math.max(min || 1e5, Math.round(y.m.bud * f / 1e5) * 1e5); }

/* ============ HECHOS REALES DEL FÚTBOL FEMENINO ============ */
MEV({id: "mx_rotar_estrella", tipo: "real", cat: "Plantilla", title: "Tu mejor jugador va sin gasolina", w: 1.4, cd: 3,
  ref: "Aitana Bonmatí ganó tres Balones de Oro femeninos seguidos (2023, 2024 y 2025), con un calendario casi sin pausas entre club y selección.",
  when: function (y) { return y.inSeason && S.bi >= 2; },
  target: function (y) { var s = y.star(); return s && s.fit < 65 && s.age <= 34 && !s.inj ? s.id : null; },
  text: function (y) { return tr("{name}, tu mejor jugador, lleva casi todos los minutos de la temporada y empieza a mostrar signos de fatiga. Se acerca un tramo con muchos partidos.", {name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, p = clamp(pl.fit / 100 + 0.05, 0.3, 0.8); return [
    {t: tr("Darle un descanso en el próximo partido"), ok: {txt: tr("Se recupera, aunque sin él el equipo se nota algo más vulgar."), fx: {pmor: 2, buff: {v: -0.8, b: 1, n: tr("Sin su estrella")}}, n: tr("Recupera energías"), then: function () { pl.fit = clamp(pl.fit + 20, 0, 100); }}},
    {t: tr("Seguir contando con él"), p: p,
      ok: {txt: tr("Aguanta el ritmo y vuelve a ser decisivo."), fx: {pmor: 3, buff: {v: 1, b: 1, n: tr("Estrella decisiva")}}},
      ko: {txt: tr("Se rompe en pleno partido. Le tocará parar."), fx: {pinj: [2, 5], pmor: -4}}},
    {t: tr("Planificar descansos con el cuerpo técnico"), ok: {txt: tr("Acordáis un calendario de rotaciones. Él no está del todo contento, pero lo entiende."), fx: {pmor: -3, chem: 2, sqMor: 1}, n: tr("Recupera energías"), then: function () { pl.fit = clamp(pl.fit + 10, 0, 100); }}}
  ]; }});

MEV({id: "mx_las_quince", tipo: "real", cat: "Vestuario", title: "Los jugadores te dan un ultimátum", once: true, w: 1.2,
  ref: "En septiembre de 2022, quince jugadoras de la selección española comunicaron a su federación que no jugarían con ella mientras no cambiara la situación. Un año después, España ganó el Mundial de 2023.",
  when: function (y) { return y.inSeason && S.bi >= 1 && y.m.chem < 70; },
  text: function () { return tr("Varios de tus jugadores más importantes te dicen que, si no mejoran las condiciones de trabajo y el trato del club, dejarán de jugar contigo."); },
  opts: function () { return [
    {t: tr("Trasladar sus quejas a la directiva"), p: 0.55,
      ok: {txt: tr("La directiva mueve ficha y el vestuario ve que el míster está de su lado."), fx: {chem: 5, sqMor: 5, board: -2}},
      ko: {txt: tr("La directiva se cierra y el vestuario se queda con la sensación de que no sirve de nada."), fx: {sqMor: -4, board: -4, chem: -3}}},
    {t: tr("Mantenerte firme: quien no esté a gusto, fuera"), ok: {txt: tr("Te alineas con el club. La directiva lo agradece y el vestuario se enfría."), fx: {board: 5, chem: -8, sqMor: -6}}},
    {t: tr("Reunir a todos con el presidente"), p: 0.45,
      ok: {txt: tr("Sentados a la misma mesa, se llega a un acuerdo que contenta a casi todos."), fx: {chem: 8, sqMor: 5, board: 2}},
      ko: {txt: tr("La reunión se tensa y todos salen peor de lo que entraron."), fx: {chem: -2, board: -3}}}
  ]; }});

MEV({id: "mx_hayes_seleccion", tipo: "real", cat: "Futuro", title: "La selección te llama", once: true, w: 0.9,
  ref: "En 2024, Emma Hayes dejó el Chelsea, con el que había ganado siete ligas inglesas, para dirigir a la selección de EE. UU., con la que ganó el oro olímpico ese mismo verano.",
  when: function (y) { return y.inSeason && S.bi >= 3 && y.m.rep >= 60 && y.pos >= 1 && y.pos <= 3; },
  text: function () { return tr("La federación nacional te ofrece dirigir a la selección. Tu club va arriba, pero una oportunidad así puede no volver."); },
  opts: function (y) { return [
    {t: tr("Aceptar y dejar el club"), ok: {txt: tr("Te despides del vestuario y te lanzas a un nuevo reto."), fx: {rep: 6, fans: -6}, n: tr("Eliges nuevo banquillo"), then: MEV_BY_ID.m_cima.opts(y)[0].ok.then}},
    {t: tr("Pedir que esperen a final de temporada"), d: tr("Puede salir bien… o perder la oportunidad."), p: 0.4,
      ok: {txt: tr("La federación acepta esperar. Te comprometes a cerrar el curso con tu equipo."), fx: {rep: 3, board: 3, fans: 4}},
      ko: {txt: tr("La federación se cansa de esperar y ficha a otro. Tu club tampoco lo agradece."), fx: {rep: -2, board: -2}}},
    {t: tr("Rechazar y seguir donde estás"), ok: {txt: tr("«Aquí tengo trabajo que acabar». La grada te aplaude."), fx: {board: 6, fans: 6, chem: 3}}}
  ]; }});

MEV({id: "mx_estadio_grande", tipo: "real", cat: "Club", title: "¿Mudamos el partido al estadio grande?", w: 1.2, cd: 3,
  ref: "En marzo de 2022, 91.553 personas llenaron el Camp Nou para ver al Barcelona ante el Real Madrid, récord mundial de asistencia a un partido de fútbol femenino en aquel momento.",
  when: function (y) { return y.inSeason && S.bi >= 1 && y.clubR >= 55; },
  text: function () { return tr("Tienes un partido grande en el calendario y el club propone moverlo al estadio más grande de la ciudad para batir vuestro récord de asistencia. Habrá más ingresos, pero perderéis vuestro campo de siempre."); },
  opts: function (y) { var p = clamp(0.5 + (y.clubR - 60) / 120, 0.4, 0.8), g = mxBud(y, 0.05); return [
    {t: tr("Mudar el partido al estadio grande"), d: tr("Si se llena, será un día histórico."), p: p,
      ok: {txt: tr("Estadio a rebosar y récord de asistencia. Un día para la historia del club."), fx: {bud: g, fans: 8, rep: 3}},
      ko: {txt: tr("El estadio se queda medio vacío y el ambiente es gélido."), fx: {bud: Math.round(g / 3 / 1e5) * 1e5, fans: -4, chem: -2}}},
    {t: tr("Jugar en casa y regalar entradas a peñas y colegios"), ok: {txt: tr("Ambiente de fiesta en vuestro campo, con muchos niños en la grada."), fx: {fans: 6, rep: 1, bud: -Math.round(g / 5 / 1e5) * 1e5}}},
    {t: tr("Quedarte donde estás"), ok: {txt: tr("Nada de experimentos: la grada de siempre es vuestro mejor aliado."), fx: {chem: 2, board: -1}}}
  ]; }});

MEV({id: "mx_dinastia", tipo: "real", cat: "Plantilla", title: "¿Una dinastía?", w: 1, cd: 3,
  ref: "El Olympique de Lyon ha ganado ocho Champions League femeninas, cinco seguidas entre 2016 y 2020, con una plantilla llena de estrellas.",
  when: function (y) { return y.inSeason && S.bi >= 2 && y.clubR >= 75 && y.pos >= 1 && y.pos <= 2; },
  text: function () { return tr("Vais líderes y la plantilla pide seguir ganándolo todo. Tu staff te recuerda que las dinastías duran cuando se rota y se renueva a tiempo."); },
  opts: function (y) { var g = mxBud(y, 0.1); return [
    {t: tr("Rotar para llegar fresco a la fase decisiva"), p: 0.6,
      ok: {txt: tr("La plantilla entera se siente importante y llegáis lanzados al final."), fx: {sqMor: 4, buff: {v: 1, b: 2, n: tr("Plantilla fresca")}}},
      ko: {txt: tr("Os atascáis en liga con tanto cambio y la prensa se pregunta qué pasa."), fx: {chem: -3, fans: -2}}},
    {t: tr("Mantener a los fijos"), ok: {txt: tr("Los de siempre responden. El equipo está en piloto automático."), fx: {chem: 3, sfit: -6, buff: {v: 0.5, b: 1, n: tr("Hambre de títulos")}}}},
    {t: tr("Fichar una estrella ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Llega una estrella al vestuario. Hay más calidad, pero hay que hacerle sitio."), fx: {bud: -g, chem: -2, board: 4, buff: {v: 1, b: 2, n: tr("Refuerzo de lujo")}}}}
  ]; }});

MEV({id: "mx_fiebre_seleccion", tipo: "real", cat: "Club", title: "La fiebre de la selección", w: 1.1, cd: 3,
  ref: "En el Mundial de 2023, la semifinal de Australia ante Inglaterra fue vista por más de once millones de personas en el país, una de las mayores audiencias televisivas de su historia.",
  when: function (y) { return y.inSeason && S.bi >= 2 && y.clubR <= 80; },
  text: function () { return tr("Tras el éxito de la selección nacional, tu estadio se llena como nunca. Los socios nuevos piden entradas y la directiva se frota las manos, pero los abonados de siempre se quejan de los precios."); },
  opts: function (y) { var g = mxBud(y, 0.04); return [
    {t: tr("Subir los precios"), ok: {txt: tr("El estadio sigue lleno y las arcas también. Los abonados de siempre protestan."), fx: {bud: g, fans: -6, board: 4}}},
    {t: tr("Mantener precios populares"), ok: {txt: tr("La grada se llena de familias y de caras nuevas. La directiva ve menos dinero."), fx: {fans: 8, board: -2, chem: 2}}},
    {t: tr("Abono familiar y entradas flexibles"), p: 0.55,
      ok: {txt: tr("La fórmula funciona: más socios y más ingresos."), fx: {bud: g, fans: 5}},
      ko: {txt: tr("El sistema es un lío y hay colas en las taquillas."), fx: {bud: Math.round(g / 3 / 1e5) * 1e5, fans: -3}}}
  ]; }});

MEV({id: "mx_oferta_millon", tipo: "real", cat: "Mercado", ctx: "verano", title: "Una oferta de récord", w: 1.2, cd: 3,
  ref: "En 2025, el Arsenal pagó un millón de libras por la delantera canadiense Olivia Smith, el primer traspaso de ese importe en el fútbol femenino.",
  when: function (y) { return y.clubR >= 55; },
  target: function (y) { var s = y.star(); return s && s.age <= 29 && s.role === "C" && !s.leaveTo ? s.id : null; },
  text: function (y) { var fee = Math.round(pValue(y.pl) * 1.8 / 1e5) * 1e5; return tr("Un club con mucho dinero ofrece {fee} por {name}, una cifra récord. Su agente ya sonríe: la oferta no se repetirá, aunque tu equipo la necesita.", {fee: fmtMoney(fee), name: plName(y.pl)}); },
  opts: function (y) { var pl = y.pl, fee = Math.round(pValue(pl) * 1.8 / 1e5) * 1e5, more = Math.round(fee * 1.3 / 1e5) * 1e5;
    var sell = function (f) { return function () { mgrRemovePlayer(pl, tr("Vendido al extranjero"), -1, f); }; };
    return [
    {t: tr("Aceptar {fee}", {fee: fmtMoney(fee)}), ok: {txt: tr("Operación récord. Hay dinero para reconstruir el equipo."), fx: {bud: fee, fans: -8, chem: -3, board: 6}, then: sell(fee)}},
    {t: tr("Pedir {fee}", {fee: fmtMoney(more)}), d: tr("Si se enfadan, la oferta se cae."), p: 0.35,
      ok: {txt: tr("Pagan lo que pides. Un traspaso histórico."), fx: {bud: more, fans: -8, chem: -3, board: 8}, then: sell(more)},
      ko: {txt: tr("Se levantan de la mesa y el jugador queda tocado."), fx: {pmor: -6}}},
    {t: tr("Rechazar y blindarle"), ok: {txt: tr("«No se vende». El vestuario y la grada te lo agradecen."), fx: {pmor: 8, fans: 5, board: -4}}}
  ]; }});

MEV({id: "mx_primas_iguales", tipo: "real", cat: "Vestuario", title: "Primas para todos por igual", w: 1, cd: 4,
  ref: "En 2022, las selecciones femenina y masculina de EE. UU. firmaron convenios que igualaban sus primas, incluidos los premios de los Mundiales, que se reparten a partes iguales.",
  when: function (y) { return y.inSeason && S.bi >= 1; },
  text: function () { return tr("La plantilla pide que las primas por objetivos se repartan a partes iguales entre todos, titulares y suplentes. Los más importantes no lo ven claro."); },
  opts: function (y) { var g = mxBud(y, 0.03); return [
    {t: tr("Primas iguales para todos"), ok: {txt: tr("Todos son uno. Los suplentes se sienten parte del equipo."), fx: {chem: 8, sqMor: 3, bud: -g, board: -2}}},
    {t: tr("Primas según el rol"), ok: {txt: tr("Todo sigue como antes. Los más importantes se sienten valorados; los demás, menos."), fx: {chem: -3, sqMor: -2, board: 3}}},
    {t: tr("Fondo común y un variable por méritos"), p: 0.65,
      ok: {txt: tr("Un reparto mixto que casi todos aceptan."), fx: {chem: 5, sqMor: 3}},
      ko: {txt: tr("Nadie queda contento con la fórmula."), fx: {chem: -3, sqMor: -2}}}
  ]; }});

MEV({id: "mx_veterana_40", tipo: "real", cat: "Plantilla", title: "Un veterano quiere seguir", w: 1.1, cd: 3,
  ref: "La brasileña Formiga jugó siete Mundiales femeninos, de 1995 a 2019, el último con 41 años.",
  when: function (y) { return y.inSeason; },
  target: function () { var l = mActive().filter(function (p) { return p.age >= 34 && !p.rl; }).sort(function (a, b) { return b.age - a.age; }); return l.length ? l[0].id : null; },
  text: function (y) { return tr("{name}, de {age} años, quiere una temporada más y su nivel aún da la talla. Pero su físico ya no es el de antes y la cantera aprieta.", {name: plName(y.pl), age: y.pl.age}); },
  opts: function () { return [
    {t: tr("Ofrecerle una temporada más"), p: 0.7,
      ok: {txt: tr("Sigue aportando con la cabeza y la experiencia."), fx: {pmor: 12, chem: 4}},
      ko: {txt: tr("El cuerpo le avisa en seguida: se lesiona."), fx: {pmor: 4, pinj: [3, 6]}}},
    {t: tr("Convertirle en mentor de las jóvenes promesas"), ok: {txt: tr("Menos minutos, más enseñanzas. Los jóvenes le adoran."), fx: {pmor: 3, chem: 6, prole: "S"}}},
    {t: tr("Agradecerle los servicios y no renovar"), ok: {txt: tr("Una despedida con honores. A la grada le duele."), fx: {pmor: -10, fans: -4, chem: -2, preq: true}}}
  ]; }});

MEV({id: "mx_guitarra", tipo: "real", cat: "Vestuario", title: "Una guitarra antes del partido", w: 1, cd: 3,
  ref: "Pia Sundhage, seleccionadora de EE. UU., tocaba la guitarra y cantaba para sus jugadoras; ganó el oro olímpico en 2008 y 2012.",
  when: function (y) { return y.inSeason && S.bi >= 1 && y.m.chem < 65; },
  text: function () { return tr("Antes de un partido clave notas el vestuario tenso. Tienes una guitarra en el coche y una idea un poco loca."); },
  opts: function () { return [
    {t: tr("Cantar con la plantilla"), p: 0.55,
      ok: {txt: tr("Acabáis todos desafinando a gritos. El estrés se esfuma."), fx: {chem: 8, sqMor: 5, buff: {v: 1, b: 1, n: tr("Unidos")}}},
      ko: {txt: tr("Risas… pero de vergüenza ajena. Algún jugador piensa que has perdido el norte."), fx: {sqMor: 2, rep: -2}}},
    {t: tr("Dar una charla seria"), ok: {txt: tr("Palabras claras y un plan de partido. El vestuario se centra."), fx: {chem: 3, buff: {v: 0.5, b: 1, n: tr("Concentrados")}}}},
    {t: tr("Dejar que el vestuario se organice solo"), ok: {txt: tr("Los jugadores tiran de líderes. Te sientes un poco fuera."), fx: {chem: 2, sqMor: 1}}}
  ]; }});

MEV({id: "mx_benefico", tipo: "real", cat: "Club", title: "Un amistoso benéfico", w: 1, cd: 3,
  ref: "El 26 de diciembre de 1920, 53 000 personas vieron en Goodison Park un partido benéfico del Dick, Kerr Ladies, y otras 10 000 se quedaron fuera.",
  when: function (y) { return y.inSeason && S.bi >= 2; },
  text: function () { return tr("Una asociación te pide jugar un amistoso benéfico en el parón. El estadio se llenaría y la causa es buena, pero la plantilla ya viene justa."); },
  opts: function (y) { var g = mxBud(y, 0.02); return [
    {t: tr("Jugar con todos los titulares"), ok: {txt: tr("Estadio lleno y recaudación récord. La plantilla acaba exhausta."), fx: {fans: 8, rep: 4, sfit: -8, bud: g}}},
    {t: tr("Jugar con suplentes y cantera"), ok: {txt: tr("Los chavales viven una noche inolvidable. El resultado es lo de menos."), fx: {fans: 4, rep: 2, chem: 2}}},
    {t: tr("Declinar con cariño"), ok: {txt: tr("Os centráis en la liga. La asociación lo entiende, aunque no del todo."), fx: {sfit: 4, fans: -2}}}
  ]; }});

MEV({id: "mx_revulsivos", tipo: "real", cat: "Táctica", title: "Un banquillo con hambre", w: 1.1, cd: 3,
  ref: "En la Eurocopa de 2022, Inglaterra de Sarina Wiegman ganó el título con goles decisivos de jugadoras que salieron desde el banquillo: Toone, Russo y Kelly, autora del gol de la final.",
  when: function (y) { return y.inSeason && S.bi >= 2; },
  text: function () { return tr("Tu banquillo está lleno de gente con ganas y poco protagonismo. Si alguno no ve minutos, el vestuario se resiente; si juegan todos, el once pierde equilibrio."); },
  opts: function () { return [
    {t: tr("Darles el rol de revulsivos"), p: 0.65,
      ok: {txt: tr("Cada cambio es un golpe de energía. Sois un equipo de 22."), fx: {sqMor: 4, chem: 4, buff: {v: 1, b: 2, n: tr("Revulsivos")}}},
      ko: {txt: tr("Se sienten jugadores de segunda y lo hacen notar."), fx: {sqMor: -3}}},
    {t: tr("Darles la titularidad en la copa"), ok: {txt: tr("Todos tienen su día. Menos intensidad en liga, más unión."), fx: {sqMor: 5, chem: 2, buff: {v: -0.5, b: 1, n: tr("Rotaciones")}}}},
    {t: tr("Mantener el once de siempre"), ok: {txt: tr("El once rinde, pero el banquillo empieza a murmurar."), fx: {chem: 2, sqMor: -3, buff: {v: 0.5, b: 1, n: tr("Once de gala")}}}}
  ]; }});

/* ============ SITUACIONES NUEVAS ============ */
MEV({id: "mx_datos", tipo: "real", cat: "Datos", title: "Los números no mienten", w: 1.2, cd: 3,
  when: function (y) { return y.inSeason && y.last.n >= 3 && y.last.w > y.last.l; },
  text: function () { return tr("Tu analista te enseña un informe: ganáis, pero el modelo dice que los resultados tienen más de suerte que de juego. Cree que deberías cambiar el plan."); },
  opts: function (y) { var g = mxBud(y, 0.03); return [
    {t: tr("Fiarte del modelo y ajustar el sistema"), p: 0.55,
      ok: {txt: tr("Pequeños ajustes y el equipo juega mejor. Los resultados lo confirman."), fx: {chem: -2, buff: {v: 1, b: 2, n: tr("Ajuste táctico")}}},
      ko: {txt: tr("El cambio descoloca a los jugadores y se resienten los automatismos."), fx: {sqMor: -3, chem: -5}}},
    {t: tr("Seguir con lo que funciona"), ok: {txt: tr("Ganar da la razón. Por ahora."), fx: {chem: 3, fans: 1, board: 1}}},
    {t: tr("Reforzar el equipo de análisis ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Más ojos y más datos para decidir mejor."), fx: {bud: -g, buff: {v: 0.5, b: 2, n: tr("Análisis")}, board: 2}}}
  ]; }});

MEV({id: "mx_prevencion", tipo: "real", cat: "Médico", title: "Parada técnica por lesiones", w: 1.4, cd: 3,
  when: function (y) { return y.inSeason && mActive().filter(function (p) { return p.inj > S.tw; }).length >= 2; },
  text: function () { var n = mActive().filter(function (p) { return p.inj > S.tw; }).length; return tr("Con {n} jugadores en la enfermería, el preparador físico te propone replantear las cargas de trabajo de toda la plantilla.", {n: n}); },
  opts: function (y) { var g = mxBud(y, 0.03); return [
    {t: tr("Reducir la carga de entrenamiento"), ok: {txt: tr("Menos intensidad y más descanso. Los cuerpos lo agradecen."), fx: {sfit: 8, buff: {v: -0.5, b: 1, n: tr("Menos intensidad")}}}},
    {t: tr("Mantener el ritmo"), p: 0.6,
      ok: {txt: tr("El grupo aguanta y la intensidad se nota en el campo."), fx: {buff: {v: 0.5, b: 1, n: tr("Intensidad")}}},
      ko: {txt: tr("Más cansancio y más molestias. La enfermería sigue llena."), fx: {sfit: -8, sqMor: -2}}},
    {t: tr("Contratar a un especialista ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Un experto reorganiza la carga. Los resultados llegan poco a poco."), fx: {bud: -g, sfit: 5, chem: 1}}}
  ]; }});

MEV({id: "mx_camaras", tipo: "real", cat: "Prensa", title: "Cámaras en el vestuario", once: true, w: 0.9,
  when: function (y) { return y.inSeason && y.m.rep >= 40 && !y.m.flags.cameras; },
  text: function () { return tr("Una plataforma de streaming quiere grabar un documental sobre el club, con cámaras en el vestuario y en tu despacho. Pagan bien."); },
  opts: function (y) { var g = mxBud(y, 0.08, 2e5); return [
    {t: tr("Aceptar con acceso total"), d: tr("Dinero e imagen… con un riesgo evidente."), p: 0.6,
      ok: {txt: tr("La serie es un éxito mundial y el club gana prestigio y dinero."), fx: {bud: g, fans: 5, rep: 4, flag: {cameras: true}}},
      ko: {txt: tr("Las cámaras captan una bronca que se vuelve viral y rompe la intimidad del vestuario."), fx: {bud: g, chem: -5, board: -4, sqMor: -3, flag: {cameras: true}}}},
    {t: tr("Aceptar solo partidos y entrevistas"), ok: {txt: tr("Una versión más light: menos dinero, menos riesgo."), fx: {bud: Math.round(g / 3 / 1e5) * 1e5, rep: 2, flag: {cameras: true}}}},
    {t: tr("Rechazar"), ok: {txt: tr("El vestuario es un lugar sagrado. Los jugadores lo agradecen."), fx: {chem: 3, sqMor: 2, flag: {cameras: true}}}}
  ]; }});

MEV({id: "mx_var", tipo: "real", cat: "Prensa", title: "El VAR os deja sin puntos", w: 1.2, cd: 2,
  when: function (y) { return y.inSeason && y.last.n >= 2 && y.last.l >= 1; },
  text: function () { return tr("Perdéis tras un penalti revisado por el VAR en el descuento. Los jugadores están furiosos y quieren que hables fuerte."); },
  opts: function () { return [
    {t: tr("Criticar al árbitro en rueda de prensa"), p: 0.5,
      ok: {txt: tr("Tus palabras levantan a la plantilla y a la grada."), fx: {fans: 6, sqMor: 3}},
      ko: {txt: tr("Sanción de un partido y multa por tus declaraciones."), fx: {bud: -50000, board: -3}}},
    {t: tr("Pedir calma y mirar adelante"), ok: {txt: tr("Madurez ante todo. La prensa te lo reconoce."), fx: {rep: 2, chem: 2}}},
    {t: tr("Enviar un informe a la federación"), p: 0.4,
      ok: {txt: tr("La federación reconoce el error y publica un comunicado."), fx: {fans: 3, board: 3}},
      ko: {txt: tr("El informe se queda sin respuesta."), fx: {}}}
  ]; }});

MEV({id: "mx_boicot", tipo: "real", cat: "Afición", title: "La grada se calla", w: 2, cd: 3,
  when: function (y) { return y.inSeason && (y.m.fans < 45 || y.m.board < 35); },
  text: function () { return tr("La grada guarda silencio durante los primeros quince minutos en protesta contra la directiva. El presidente te pide que mantengas al vestuario al margen."); },
  opts: function () { return [
    {t: tr("Respaldar a la afición"), ok: {txt: tr("«Tienen derecho a quejarse». La grada te adopta y el palco se enfada."), fx: {fans: 8, board: -8}}},
    {t: tr("Ponerte del lado del presidente"), ok: {txt: tr("Pides respeto y unidad. La directiva lo agradece; la grada, no."), fx: {board: 8, fans: -8, rep: -2}}},
    {t: tr("Quedarte al margen"), p: 0.6,
      ok: {txt: tr("«Mi trabajo es el campo». El vestuario no se contagia."), fx: {chem: 2}},
      ko: {txt: tr("Tu silencio se interpreta como cobardía."), fx: {fans: -3, board: -3}}}
  ]; }});

MEV({id: "mx_nuevo_campo", tipo: "real", cat: "Club", title: "El club se muda de estadio", once: true, w: 0.8,
  when: function (y) { return y.inSeason && S.bi <= 2 && y.clubR >= 60; },
  text: function () { return tr("La directiva anuncia que el club jugará la próxima temporada en un estadio nuevo, más moderno y más lejos del centro. La plantilla teme perder el calor de la grada."); },
  opts: function (y) { var g = mxBud(y, 0.06); return [
    {t: tr("Defender la mudanza"), ok: {txt: tr("Hablas de futuro y de ingresos. La directiva está encantada."), fx: {bud: g, fans: -6, board: 5}}},
    {t: tr("Pedir un año más en el estadio de siempre"), ok: {txt: tr("Ganas tiempo y el cariño de los socios, pero la directiva se impacienta."), fx: {board: -4, fans: 5}}},
    {t: tr("Condicionar la mudanza a una mejor ciudad deportiva"), p: 0.5,
      ok: {txt: tr("La directiva acepta tu condición. Os dan unas instalaciones de lujo."), fx: {board: 2, sfit: 4, chem: 3}},
      ko: {txt: tr("«Una cosa no tiene que ver con la otra». Te quedas sin lo uno ni lo otro."), fx: {board: -3}}}
  ]; }});

MEV({id: "mx_patrocinio", tipo: "real", cat: "Club", title: "Un patrocinador incómodo", once: true, w: 0.9,
  when: function (y) { return y.inSeason && y.clubR <= 84 && !y.m.flags.betSponsor; },
  text: function () { return tr("Una casa de apuestas ofrece mucho dinero por llevar su logo en la camiseta. Parte de la afición y varios jugadores se oponen."); },
  opts: function (y) { var g = mxBud(y, 0.1, 3e5); return [
    {t: tr("Aceptar el patrocinio"), ok: {txt: tr("Entra mucho dinero. La grada protesta y algunos jugadores se sienten incómodos."), fx: {bud: g, fans: -6, board: 5, flag: {betSponsor: true}}}},
    {t: tr("Rechazarlo"), ok: {txt: tr("«Hay cosas que no se compran». Ganas el respeto del vestuario y de la grada."), fx: {board: -4, fans: 6, chem: 2, flag: {betSponsor: true}}}},
    {t: tr("Aceptar solo en la manga"), ok: {txt: tr("Un logo pequeño y menos dinero. Casi todos pueden vivir con eso."), fx: {bud: Math.round(g / 2 / 1e5) * 1e5, fans: -2, board: 2, flag: {betSponsor: true}}}}
  ]; }});

MEV({id: "mx_convocatorias", tipo: "real", cat: "Selección", title: "Un amistoso inoportuno", w: 1.1, cd: 3,
  when: function (y) { return y.inSeason && S.bi >= 1; },
  target: function (y) { var s = y.star(); return s && s.age <= 33 && !s.inj ? s.id : null; },
  text: function (y) { return tr("La selección convoca a {name} para un amistoso sin importancia. Está justo de fuerzas y juegas el domingo.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Pedir que le liberen"), p: 0.35,
      ok: {txt: tr("La federación cede y se queda en casa a descansar."), fx: {pmor: 3, sfit: 2}},
      ko: {txt: tr("Respuesta tajante. La federación toma nota de tu petición."), fx: {rep: -2, board: -1}}},
    {t: tr("Dejarle ir"), p: 0.75,
      ok: {txt: tr("Va, juega y vuelve con la autoestima por las nubes."), fx: {pmor: 5, rep: 1}},
      ko: {txt: tr("Vuelve con una molestia que le tendrá fuera unos días."), fx: {pinj: [2, 4], pmor: -2}}},
    {t: tr("Dejarle ir y planificar una rotación"), ok: {txt: tr("Con un plan B listo, el domingo estaréis preparados."), fx: {pmor: 3, sqMor: 2, buff: {v: -0.3, b: 1, n: tr("Rotaciones")}}}}
  ]; }});

MEV({id: "mx_academia", tipo: "real", cat: "Cantera", ctx: "verano", title: "Reformar la academia", w: 1.2, cd: 3,
  when: function (y) { return y.m.bud >= 1e6; },
  text: function () { return tr("El director de la cantera pide dinero para reformar la residencia y contratar entrenadores. Es una inversión a largo plazo."); },
  opts: function (y) { var big = mxBud(y, 0.08, 5e5), small = mxBud(y, 0.04, 3e5); return [
    {t: tr("Inversión fuerte ({cost})", {cost: fmtMoney(big)}), ok: {txt: tr("Nueva residencia, nuevos técnicos y una promoción que apunta alto."), fx: {bud: -big, youth: 1, board: 3, flag: {youthBoost: 1}}}},
    {t: tr("Inversión moderada ({cost})", {cost: fmtMoney(small)}), ok: {txt: tr("Arreglos básicos y un entrenador más. Poco a poco."), fx: {bud: -small, youth: 1}}},
    {t: tr("Dejarlo como está"), ok: {txt: tr("Dinero para la plantilla. La cantera tendrá que esperar."), fx: {board: 2, fans: -1}}}
  ]; }});

MEV({id: "mx_fichaje_idioma", tipo: "aleatoria", cat: "Vestuario", title: "Un fichaje que no entiende nada", w: 1.2, cd: 2,
  when: function (y) { return y.inSeason; },
  target: function (y) { var ci = W.clubs[y.m.club].ci, l = mActive().filter(function (p) { return p.nat !== ci && p.since >= S.yr - 1 && !p.rl; }); return l.length ? y.spick(l, "id").id : null; },
  text: function (y) { return tr("{name} llegó este año y sigue sin entender las instrucciones. Se aísla del grupo y su rendimiento cae.", {name: plName(y.pl)}); },
  opts: function (y) { var g = mxBud(y, 0.01, 5e4); return [
    {t: tr("Contratarle un intérprete ({cost})", {cost: fmtMoney(g)}), ok: {txt: tr("Con un intérprete a su lado, empieza a entender el plan de juego."), fx: {bud: -g, pmor: 8, povr: 0.3}}},
    {t: tr("Emparejarle con un veterano"), p: 0.7,
      ok: {txt: tr("El veterano le adopta y el grupo se une un poco más."), fx: {pmor: 6, chem: 3}},
      ko: {txt: tr("Se entienden a medias. El jugador sigue desubicado."), fx: {pmor: -2}}},
    {t: tr("Dejar que se las apañe"), ok: {txt: tr("«Aquí se viene aprendido». El jugador se hunde un poco más."), fx: {pmor: -6}}}
  ]; }});
