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

MEV({id: "mx_minutos_cantera", tipo: "aleatoria", cat: "Cantera", title: "El juvenil pide una oportunidad", w: 1.2, cd: 3,
  when: function (y) { return y.inSeason && y.m.sq.some(function (p) { return p.yth && p.age <= 20; }); },
  target: function (y) { var a = y.m.sq.filter(function (p) { return p.yth && p.age <= 20 && !p.inj; }); return a.length ? a[0].id : null; },
  text: function (y) { return tr("{name} siente que está preparado para el primer equipo y pide una oportunidad en la próxima convocatoria.", {name: plName(y.pl)}); },
  opts: function (y) { return [
    {t: tr("Darle minutos en el próximo partido"), p: 0.65,
      ok: {txt: tr("El juvenil responde con personalidad y el vestuario celebra su debut."), fx: {pmor: 7, youth: 1, fans: 2}},
      ko: {txt: tr("Los nervios le pueden y comete un error en una zona peligrosa."), fx: {pmor: -3, board: -1}}},
    {t: tr("Diseñar un plan de cesión"), ok: {txt: tr("Encontrará minutos en otro equipo y volverá con experiencia."), fx: {pmor: 3, youth: 1, board: 1}}},
    {t: tr("Pedirle que siga trabajando"), ok: {txt: tr("Acepta la decisión, aunque espera que no le hayas cerrado la puerta."), fx: {pmor: -2, chem: 1}}}
  ]; }});

MEV({id: "mx_objetivo_directiva", tipo: "aleatoria", cat: "Directiva", title: "La directiva cambia el objetivo", w: 0.8, cd: 4,
  when: function (y) { return y.inSeason && S.bi >= 2; },
  text: function () { return tr("Tras una buena racha, la directiva te pide públicamente que luches por un objetivo más ambicioso. La plantilla nota el aumento de presión."); },
  opts: function () { return [
    {t: tr("Aceptar el reto y marcar una meta clara"), p: 0.6,
      ok: {txt: tr("El grupo se motiva y la directiva respalda tu liderazgo."), fx: {board: 4, sqMor: 3, fans: 2}},
      ko: {txt: tr("El objetivo resulta demasiado exigente y crecen las dudas."), fx: {board: -3, sqMor: -3}}},
    {t: tr("Rebajar la presión y hablar de proceso"), ok: {txt: tr("Proteges al vestuario, aunque el palco esperaba una promesa más contundente."), fx: {sqMor: 3, board: -1, chem: 1}}},
    {t: tr("Pedir recursos antes de prometer resultados"), ok: {txt: tr("La directiva valora que pongas condiciones concretas sobre la mesa."), fx: {bud: mxBud(y, 0.02, 1e5), board: 1}}}
  ]; }});

MEV({id: "mx_analisis_rival", tipo: "aleatoria", cat: "Táctica", title: "Filtración del análisis táctico", w: 0.9, cd: 3,
  when: function (y) { return y.inSeason && S.bi >= 1; },
  text: function () { return tr("Un medio publica parte del plan táctico que preparaste para el próximo rival. El analista ofrece rehacerlo, pero queda poco tiempo."); },
  opts: function () { return [
    {t: tr("Cambiar el plan a última hora"), p: 0.65,
      ok: {txt: tr("El rival llega preparado para otra cosa y vuestro ajuste funciona."), fx: {buff: {v: 0.8, b: 1, n: tr("Plan alternativo")}, rep: 2}},
      ko: {txt: tr("Los cambios confunden a varios titulares."), fx: {chem: -3, sqMor: -2}}},
    {t: tr("Mantener el plan y confiar en la ejecución"), ok: {txt: tr("El equipo conoce el sistema y no se deja distraer por la filtración."), fx: {chem: 2, buff: {v: 0.35, b: 1, n: tr("Convicción")}}}},
    {t: tr("Investigar quién lo filtró"), ok: {txt: tr("El vestuario se compromete a cuidar mejor la información interna."), fx: {chem: 1, board: 1, fans: -1}}}
  ]; }});

/* 100 decisiones nuevas para la carrera de entrenador/a, registradas como MEV del juego. */
var MANAGER_DECISION_THEMES = [
  {cat: "Entrenamiento", title: "Ajustar la semana de trabajo", open: "El cuerpo técnico te presenta el plan de sesiones.", choices: ["Concentrar el trabajo en una prioridad", "Doblar la carga de preparación", "Dejar que cada jugador adapte la sesión"], cases: [
    ["Salida desde atrás", "Los centrales piden practicar la salida ante la presión alta."], ["Transiciones", "El análisis señala que el equipo tarda demasiado en replegarse."], ["Finalización", "Los delanteros acumulan ocasiones claras sin convertirlas."], ["Balón parado", "El equipo ha encajado varios goles en jugadas de estrategia."], ["Presión coordinada", "Los atacantes saltan a presionar, pero el resto no siempre les acompaña."], ["Centros laterales", "Los extremos quieren ensayar centros con distintas trayectorias."], ["Defensa del área", "El portero pide mejorar las marcas en los centros laterales."], ["Juego de posición", "Los mediocampistas creen que pueden ofrecer mejores líneas de pase."], ["Velocidad de reacción", "El preparador físico observa una bajada de intensidad al final de los partidos."], ["Penaltis", "Una eliminatoria próxima podría decidirse desde los once metros."]]},
  {cat: "Alineación", title: "Gestionar los minutos", open: "El calendario obliga a tomar decisiones sobre la convocatoria.", choices: ["Rotar con un plan claro", "Mantener a los titulares", "Dar una oportunidad a los suplentes"], cases: [
    ["Tres partidos en siete días", "La semana incluye liga y dos compromisos de copa."], ["Veteranos cargados", "Varios titulares superan los treinta años y acumulan muchos minutos."], ["Un regreso esperado", "Un jugador importante acaba de recibir el alta médica."], ["El portero suplente", "El segundo guardameta pregunta si tendrá minutos esta semana."], ["Una final cercana", "El equipo afronta una final dentro de pocos días."], ["Viaje continental", "El desplazamiento europeo implica volver de madrugada."], ["Jóvenes en forma", "Dos canteranos han destacado en los entrenamientos recientes."], ["Calendario despejado", "Por primera vez en semanas hay tiempo para repetir el mismo once."], ["Un jugador sancionado", "La suspensión de un titular obliga a reorganizar varias posiciones."], ["Derbi de máxima presión", "La afición espera que alinees a todos tus nombres más reconocibles."]]},
  {cat: "Cantera", title: "Una decisión para la academia", open: "El director de cantera solicita tu opinión antes de cerrar la semana.", choices: ["Apostar por el desarrollo técnico", "Dar minutos inmediatos al talento", "Mantener el plan gradual"], cases: [
    ["Central zurdo", "Un central zurdo de la cantera destaca por su salida de balón."], ["Portero juvenil", "El guardameta sub-19 acaba de detener dos penaltis en un torneo."], ["Extremo veloz", "Un extremo joven supera a los defensas en cada entrenamiento."], ["Mediocentro creativo", "El filial tiene un organizador que pide entrenar con el primer equipo."], ["Joven goleadora", "Una delantera juvenil ha marcado en cinco partidos consecutivos."], ["Instalaciones", "La residencia necesita mejoras para retener a las promesas."], ["Ojeador local", "Un ojeador propone ampliar la búsqueda a clubes pequeños de la región."], ["Torneo internacional", "La cantera recibe una invitación para competir fuera del país."], ["Mentoría", "Un veterano se ofrece a acompañar a un joven durante la temporada."], ["Equipo filial", "El responsable del filial pide compartir un preparador físico."]]},
  {cat: "Táctica", title: "Preparar una respuesta táctica", open: "El analista presenta un problema que puede cambiar el próximo partido.", choices: ["Ajustar el plan desde el inicio", "Esperar y reaccionar durante el partido", "Confiar en el sistema habitual"], cases: [
    ["Bloque bajo", "El próximo rival suele defender muy cerca de su área."], ["Presión alta", "El rival presiona a los centrales desde el saque de puerta."], ["Carrileros ofensivos", "El equipo contrario genera peligro con sus laterales largos."], ["Delantero referencia", "Un ariete dominante gana casi todos los duelos aéreos."], ["Falso nueve", "El rival utiliza un delantero que abandona continuamente el área."], ["Transición rápida", "El oponente busca contraatacar con pases directos."], ["Doble pivote", "El mediocampo rival acumula jugadores por el centro."], ["Balón parado defensivo", "El rival ha marcado muchos goles de córner esta temporada."], ["Extremos a pierna cambiada", "Los dos extremos rivales buscan recortar hacia dentro."], ["Partido de vuelta", "La eliminatoria exige gestionar el marcador de la ida."]]},
  {cat: "Directiva", title: "Una petición de la dirección", open: "La directiva te convoca para conversar sobre las prioridades del club.", choices: ["Presentar un plan con objetivos medibles", "Pedir más margen y proteger al grupo", "Negociar recursos concretos"], cases: [
    ["Objetivo revisado", "La directiva eleva la meta después de una buena racha."], ["Presupuesto congelado", "Finanzas comunica que no habrá fondos adicionales este mes."], ["Reunión de mitad de temporada", "El presidente quiere revisar el proyecto antes de lo previsto."], ["Obligación de cantera", "La propiedad quiere ver más jugadores formados en casa."], ["Gira comercial", "El club propone una gira que coincide con la preparación física."], ["Renovación pendiente", "La junta te pide una recomendación sobre un jugador veterano."], ["Nuevo patrocinador", "Un acuerdo comercial permitiría reforzar el presupuesto del equipo."], ["Rumores de venta", "La posible venta del club inquieta a los empleados."], ["Resultados económicos", "El director financiero pide reducir gastos de viaje y concentración."], ["Estadio en obras", "Las reformas obligan a jugar varios partidos lejos de casa."]]},
  {cat: "Prensa", title: "Una rueda de prensa delicada", open: "Los medios buscan una frase que resuma el momento del equipo.", choices: ["Hablar con franqueza", "Defender públicamente al vestuario", "No entrar en polémicas"], cases: [
    ["Error arbitral", "La última derrota estuvo marcada por una decisión discutida."], ["Fichaje criticado", "Un fichaje caro todavía no ha encontrado su mejor nivel."], ["Racha negativa", "Los periodistas preguntan si has perdido el control del equipo."], ["Rival provocador", "El entrenador rival cuestiona tus decisiones antes del derbi."], ["Promesa de título", "Un titular afirma que garantizaste ganar la competición."], ["Cambio del capitán", "Te preguntan por qué el capitán empezó el partido en el banquillo."], ["Juvenil debutante", "La prensa pide saber si el joven seguirá teniendo oportunidades."], ["Táctica filtrada", "Un medio publica una parte de tu plan para el siguiente encuentro."], ["Mercado de fichajes", "Los reporteros quieren nombres antes de que el club cierre una operación."], ["Afición impaciente", "Los seguidores han pedido explicaciones tras el último resultado."]]},
  {cat: "Mercado", title: "El mercado ofrece alternativas", open: "El director deportivo comparte una oportunidad que exige una respuesta rápida.", choices: ["Apostar por el perfil recomendado", "Buscar una opción de menor coste", "Esperar antes de comprometer el presupuesto"], cases: [
    ["Delantero cedible", "Un delantero joven podría llegar cedido con opción de compra."], ["Contrato finalizado", "Un mediocampista experimentado quedará libre al acabar el mes."], ["Interés por un titular", "Un club extranjero pregunta por uno de tus jugadores más importantes."], ["Mercado de invierno", "Una lesión abre una necesidad inesperada en la plantilla."], ["Jugador polivalente", "Un agente ofrece un futbolista capaz de cubrir tres posiciones."], ["Portero prometedor", "El ojeador recomienda un guardameta de una liga menor."], ["Cláusula asequible", "Un defensa tiene una cláusula que se ajusta al presupuesto actual."], ["Salario elevado", "Un goleador acepta negociar, aunque pide un sueldo alto."], ["Renovación urgente", "Un jugador clave entra en su último año de contrato."], ["Oferta por un suplente", "Una propuesta permite liberar salario y abrir espacio para un juvenil."]]},
  {cat: "Vestuario", title: "Mantener unido al grupo", open: "El responsable de vestuario detecta un asunto que conviene resolver pronto.", choices: ["Reunir al grupo y escuchar", "Hablar directamente con los implicados", "Dejar que los líderes lo gestionen"], cases: [
    ["Capitanes divididos", "Dos capitanes discrepan sobre cómo responder a las críticas."], ["Recién llegado", "Un fichaje nuevo todavía no ha encontrado su lugar en el grupo."], ["Suplente descontento", "Un jugador importante ha pedido explicaciones por sus pocos minutos."], ["Celebración excesiva", "Algunos jugadores salieron hasta tarde después de una victoria."], ["Rumor de filtración", "Alguien parece estar compartiendo información interna con la prensa."], ["Veterano y juvenil", "Un veterano se queja de que un joven no respeta las normas del equipo."], ["Grupo de idiomas", "Los jugadores internacionales se agrupan y cuesta integrar a todos."], ["Tensión por el brazalete", "Varios futbolistas creen que deberían ser capitanes."], ["Bono pendiente", "La plantilla pregunta por una prima que todavía no ha sido abonada."], ["Diferencias de entrenamiento", "Un grupo considera que las cargas no son iguales para todos."]]},
  {cat: "Afición", title: "Responder a la grada", open: "El club pide una idea para acercar el equipo a sus seguidores.", choices: ["Organizar un encuentro abierto", "Enviar un mensaje institucional", "Invitar a representantes de la afición"], cases: [
    ["Entrenamiento abierto", "Las familias quieren ver una sesión antes del próximo partido en casa."], ["Viaje visitante", "Un grupo de seguidores ha organizado un desplazamiento largo."], ["Club de barrio", "Una escuela local pide que el equipo visite sus instalaciones."], ["Protesta por precios", "Los aficionados cuestionan el precio de las entradas para la copa."], ["Homenaje a un socio", "La grada quiere recordar a un seguidor histórico del club."], ["Camiseta especial", "Los seguidores proponen un diseño para una campaña solidaria."], ["Derrota dolorosa", "La afición espera una explicación después de una eliminación inesperada."], ["Fiesta del club", "El ayuntamiento ofrece una plaza para celebrar el aniversario del equipo."], ["Redes del club", "El departamento de comunicación propone una sesión de preguntas abierta."], ["Afición visitante", "Un grupo rival solicita compartir una iniciativa contra la violencia."]]},
  {cat: "Preparación", title: "Planificar la concentración", open: "El calendario y el estado anímico del equipo obligan a elegir cómo prepararse.", choices: ["Mantener una rutina estricta", "Cambiar el entorno para despejar la mente", "Dejar que los jugadores participen en el plan"], cases: [
    ["Derbi fuera de casa", "El partido más tenso del calendario llega después de varios viajes."], ["Final continental", "El equipo debe desplazarse antes de una final de máxima exigencia."], ["Semana sin partidos", "Hay varios días libres que podrían dedicarse a fortalecer automatismos."], ["Clima extremo", "El rival juega en una ciudad con calor o frío poco habituales."], ["Hotel ruidoso", "La concentración anterior estuvo marcada por interrupciones nocturnas."], ["Cambio de campo", "Las obras obligan a entrenar en una instalación diferente."], ["Dos ciudades", "El calendario permite elegir entre viajar antes o hacerlo el mismo día."], ["Partido a mediodía", "El horario obliga a modificar los hábitos de sueño y alimentación."], ["Descanso mental", "El grupo pide una tarde libre tras un mes de mucha presión."], ["Preparación con vídeo", "El analista quiere sustituir parte del entrenamiento por una sesión de vídeo."]]},
];
function managerExpansionFx(theme, variant, option, failed) {
  var n = 1 + (variant % 3), t = theme % 5;
  if (option === 0) return {chem: n, sqMor: n + 1};
  if (option === 1) return failed ? {board: -n, sqMor: -n} : {rep: 1, fans: n, board: n};
  return t === 0 ? {sfit: n * 2, chem: 1} : (t === 1 ? {bud: -n * 25000, youth: 1} : {chem: n, board: 1});
}
var MANAGER_DECISION_COUNT = 0;
MANAGER_DECISION_THEMES.forEach(function (theme, ti) {
  theme.cases.forEach(function (caseRow, vi) {
    var index = MANAGER_DECISION_COUNT++;
    MEV({id: "extra_manager_" + String(index + 1).padStart(3, "0"), tipo: "aleatoria", cat: theme.cat,
      title: N_(theme.title + " · " + caseRow[0]), once: true, w: 0.22,
      when: function (y) { return y.inSeason && y.m && y.m.club >= 0 && (ti % 4 !== 0 || y.m.chem < 100); },
      text: function () { return tr(theme.open + " " + caseRow[1]); },
      opts: function () {
        var chance = 0.45 + (vi % 4) * 0.07;
        return [
          {t: tr(theme.choices[0]), ok: {txt: tr("El vestuario entiende el plan y acepta la decisión."), fx: managerExpansionFx(ti, vi, 0, false)}},
          {t: tr(theme.choices[1]), p: chance,
            ok: {txt: tr("La apuesta funciona y el club nota un cambio positivo."), fx: managerExpansionFx(ti, vi, 1, false)},
            ko: {txt: tr("La decisión genera dudas y tendrás que recuperar la confianza."), fx: managerExpansionFx(ti, vi, 1, true)}},
          {t: tr(theme.choices[2]), ok: {txt: tr("Encuentras una salida práctica sin romper la armonía del grupo."), fx: managerExpansionFx(ti, vi, 2, false)}}
        ];
      }
    });
  });
});
