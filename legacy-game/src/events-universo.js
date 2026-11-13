/* events-universo.js — nuevas decisiones condicionales para las carreras y el club propio.
   Son historias de la simulación; no describen hechos históricos ni datos externos. */
EV({id: "uv_player_recovery", tipo: "aleatoria", cat: "Salud", title: "Una semana para recuperar",
  w: 1.25, cd: 2,
  when: function (x) { return x.inSeason && x.p.fit <= 55 && x.p.inj <= S.tw; },
  text: function (x) { return tr("El cuerpo técnico ve que llegas justo de energía al siguiente tramo. No tienes una lesión, pero sí puedes decidir cómo cuidar las piernas."); },
  opts: function () { return [
    {t: tr("Bajar la carga y priorizar el descanso"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {fit: 7, mor: 2}}},
    {t: tr("Completar el entrenamiento con el grupo"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {fit: -3, coach: 3}}},
    {t: tr("Pedir trabajo individual"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {fit: 3, coach: 2, prof: 1}}}
  ]; }});

EV({id: "uv_player_mentor", tipo: "aleatoria", cat: "Vestuario", title: "Una conversación en el vestuario",
  w: 1.1, cd: 3,
  when: function (x) { return x.inSeason && x.p.age <= 24 && x.teamGames >= 4; },
  text: function () { return tr("Una persona con experiencia del vestuario te propone compartir una rutina para preparar mejor los partidos. Puedes escuchar, adaptar la idea o seguir con tu propio método."); },
  opts: function () { return [
    {t: tr("Probar la rutina durante un bloque"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {prof: 2, coach: 2, form: 2}}},
    {t: tr("Pedir consejo y adaptarlo a tu estilo"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {mor: 3, prof: 1}}},
    {t: tr("Agradecerlo y mantener tu rutina"), ok: {txt: tr("Te preparas mejor para el siguiente tramo."), fx: {mor: 1, coach: 1}}}
  ]; }});

MEV({id: "uv_mgr_load", tipo: "aleatoria", cat: "Entrenamiento", title: "Tres partidos, una sola semana",
  w: 1.15, cd: 3,
  when: function (y) { return y.inSeason && y.last.n >= 3; },
  text: function (y) { return tr("El calendario encadena {n} partidos en el tramo. El equipo técnico pide definir una prioridad para llegar con energía y mantener automatismos.", {n: y.last.n}); },
  opts: function () { return [
    {t: tr("Rotar más y repartir minutos"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {sfit: 5, chem: -1}}},
    {t: tr("Mantener el bloque titular"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {chem: 2, sfit: -3}}},
    {t: tr("Preparar cada partido con un plan distinto"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {board: 1, chem: 1, sfit: 1}}}
  ]; }});

MEV({id: "uv_mgr_promise", tipo: "aleatoria", cat: "Cantera", title: "Una promesa pide un plan",
  w: 1.05, cd: 3,
  when: function (y) { return y.inSeason && S.m.sq.some(function (p) { return p.age <= 21 && p.st && p.st.apps < 8 && !p.loanOut; }); },
  target: function () { var a = S.m.sq.filter(function (p) { return p.age <= 21 && p.st && p.st.apps < 8 && !p.loanOut; }); return a.length ? a.sort(function (x, y) { return x.st.apps - y.st.apps; })[0].id : null; },
  text: function (y) { return tr("{name} quiere saber qué necesita demostrar para acercarse al primer equipo. Puedes definir una meta concreta o dejar que siga progresando sin presión.", {name: y.pl ? plName(y.pl) : ""}); },
  opts: function (y) { var p = y.pl; return [
    {t: tr("Acordar una meta de minutos y seguimiento"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {sqMor: 2, board: 1}}},
    {t: tr("Invitarle a entrenar con el primer equipo"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {sqMor: 1, sfit: -1, rep: 1}}},
    {t: tr("Dejar que el progreso marque el momento"), ok: {txt: tr("El cuerpo técnico ha definido una prioridad para el equipo."), fx: {board: 1, chem: 1}}}
  ]; }});

MEV({id: "uv_club_academy", tipo: "aleatoria", cat: "Cantera", title: "El club propio mira al futuro",
  w: 1.2, cd: 3,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("La comunidad propone abrir una tarde de entrenamiento para jóvenes del entorno. El proyecto puede acercar gente al club, pero necesita tiempo y una pequeña parte del presupuesto."); },
  opts: function () { return [
    {t: tr("Organizar una jornada abierta"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -12000, fans: 4, rep: 2}}},
    {t: tr("Crear un programa de becas pequeño"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -18000, board: 2, fans: 3}}},
    {t: tr("Esperar a tener más recursos"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: 0, board: 1, fans: 1}}}
  ]; }});

MEV({id: "uv_club_identity", tipo: "aleatoria", cat: "Afición", title: "¿Qué representa el escudo?",
  w: 1.1, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("La afición propone contar por qué elegiste los colores y el nombre del club. Puedes compartir la historia, abrir una votación para una iniciativa futura o mantener el foco en el campo."); },
  opts: function () { return [
    {t: tr("Contar la historia del club"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {fans: 3, rep: 2}}},
    {t: tr("Escuchar ideas para una mejora futura"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {fans: 2, board: 1}}},
    {t: tr("Dejar que el equipo hable en el campo"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {chem: 1, rep: 1}}}
  ]; }});

EV({id: "uv_player_media", tipo: "aleatoria", cat: "Prensa", title: "Una historia fuera del campo",
  w: 0.9, cd: 3,
  when: function (x) { return x.inSeason && x.teamGames >= 3; },
  text: function () { return tr("Un medio local quiere hablar de tus rutinas y de cómo preparas cada partido. Puedes compartir una parte de tu proceso, centrar la conversación en el equipo o reservar tu tiempo para descansar."); },
  opts: function () { return [
    {t: tr("Compartir una rutina que te ayuda"), ok: {txt: tr("La conversación deja una impresión positiva."), fx: {fame: 1, prof: 1, coach: 1}}},
    {t: tr("Hablar del trabajo colectivo"), ok: {txt: tr("La conversación deja una impresión positiva."), fx: {mor: 2, coach: 2}}},
    {t: tr("Agradecer la invitación y descansar"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 2, mor: 1}}}
  ]; }});

EV({id: "uv_player_training_plan", tipo: "aleatoria", cat: "Progreso", title: "Un objetivo para el próximo bloque",
  w: 1.0, cd: 3,
  when: function (x) { return x.inSeason && x.p.age <= 32 && x.teamGames >= 2; },
  text: function () { return tr("El equipo técnico te propone fijar un objetivo de trabajo para las próximas semanas. Puedes priorizar una habilidad, el entendimiento con el equipo o una carga más sostenible."); },
  opts: function () { return [
    {t: tr("Centrarme en una habilidad concreta"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 2, fit: -1}}},
    {t: tr("Practicar movimientos con el equipo"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {coach: 2, mor: 1}}},
    {t: tr("Mantener una carga equilibrada"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {fit: 2, form: 1}}}
  ]; }});

MEV({id: "uv_mgr_travel", tipo: "aleatoria", cat: "Calendario", title: "Un viaje entre dos partidos",
  w: 1.0, cd: 3,
  when: function (y) { return y.inSeason && y.last.n >= 2; },
  text: function (y) { return tr("El equipo afronta {n} partidos en un tramo con desplazamientos. El cuerpo técnico puede priorizar recuperación, continuidad o preparación específica.", {n: y.last.n}); },
  opts: function () { return [
    {t: tr("Reservar más tiempo para recuperar"), ok: {txt: tr("El plan del equipo queda definido para este tramo."), fx: {sfit: 3, chem: -1}}},
    {t: tr("Conservar el trabajo habitual"), ok: {txt: tr("El plan del equipo queda definido para este tramo."), fx: {chem: 2, sfit: -1}}},
    {t: tr("Preparar una sesión breve de vídeo"), ok: {txt: tr("El plan del equipo queda definido para este tramo."), fx: {board: 1, chem: 1}}}
  ]; }});

MEV({id: "uv_mgr_scouting", tipo: "aleatoria", cat: "Cantera", title: "Dos informes, una plaza",
  w: 0.95, cd: 4,
  when: function (y) { return y.inSeason && S.m && S.m.sq && S.m.sq.length > 0; },
  text: function () { return tr("El área deportiva presenta dos perfiles jóvenes para seguir durante el próximo bloque. Puedes invertir tiempo en scouting, abrir una prueba de entrenamiento o esperar a tener más minutos disponibles."); },
  opts: function () { return [
    {t: tr("Ampliar el seguimiento de scouting"), ok: {txt: tr("El club ha definido cómo seguirá a los perfiles."), fx: {bud: -4000, board: 2}}},
    {t: tr("Invitar a una prueba de entrenamiento"), ok: {txt: tr("El club ha definido cómo seguirá a los perfiles."), fx: {sqMor: 1, chem: 1}}},
    {t: tr("Esperar y revisar el próximo informe"), ok: {txt: tr("El club ha definido cómo seguirá a los perfiles."), fx: {bud: 0, board: 1}}}
  ]; }});

MEV({id: "uv_club_sponsor", tipo: "aleatoria", cat: "Proyecto", title: "Una propuesta de patrocinio local",
  w: 0.9, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Un comercio de la zona propone apoyar al club. El acuerdo puede aportar recursos para esta temporada, reforzar el vínculo con la comunidad o esperar a una propuesta con menos compromisos."); },
  opts: function () { return [
    {t: tr("Aceptar un acuerdo corto y claro"), ok: {txt: tr("El club ha elegido una vía asumible para crecer."), fx: {bud: 12000, fans: 2, rep: 1}}},
    {t: tr("Proponer una colaboración comunitaria"), ok: {txt: tr("El club ha elegido una vía asumible para crecer."), fx: {bud: 5000, fans: 4, board: 1}}},
    {t: tr("Agradecerlo y seguir negociando"), ok: {txt: tr("El club ha elegido una vía asumible para crecer."), fx: {board: 1, rep: 1}}}
  ]; }});

MEV({id: "uv_club_training", tipo: "aleatoria", cat: "Instalaciones", title: "Un campo para compartir",
  w: 0.85, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Una entidad del barrio pregunta si puede usar el campo en una franja libre. Compartirlo acerca el club a nuevas familias; reservarlo protege el césped y deja más margen al equipo."); },
  opts: function () { return [
    {t: tr("Abrir una franja comunitaria"), ok: {txt: tr("La decisión acerca el proyecto a su comunidad."), fx: {bud: -5000, fans: 3, rep: 1}}},
    {t: tr("Organizar una jornada al mes"), ok: {txt: tr("La decisión acerca el proyecto a su comunidad."), fx: {bud: -2500, fans: 2, board: 1}}},
    {t: tr("Mantener el campo para el equipo"), ok: {txt: tr("La decisión acerca el proyecto a su comunidad."), fx: {sfit: 1, board: 1}}}
  ]; }});

/* Segundo bloque editorial: contextos cotidianos con tres prioridades de bajo riesgo.
   El mismo contenido es válido en carreras masculinas y femeninas; no depende de una liga. */
function uvRegisterPlayer(story) {
  EV({id: story.id, tipo: "aleatoria", cat: story.cat, title: story.title, w: story.w || 0.75, cd: 3,
    when: function (x) { return !!(x.inSeason && x.teamGames >= 2); },
    text: function () { return tr(story.text); },
    opts: function () { return story.opts.map(function (o) { return {t: tr(o.t), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: o.fx}}; }); }});
}
[
  {id: "uv_player_position_trial", cat: "Progreso", title: "Una prueba en otra posición", text: "El cuerpo técnico te propone probar un rol cercano en una sesión, sin prometer cambios en la alineación. Puedes explorar, pedir un plan gradual o mantener tu especialidad.", opts: [
    {t: "Practicar movimientos con el equipo", fx: {coach: 2, prof: 1}}, {t: "Centrarme en una habilidad concreta", fx: {prof: 2, form: 1}}, {t: "Mantener una carga equilibrada", fx: {mor: 1, fit: 1}}
  ]},
  {id: "uv_player_youth_day", cat: "Vestuario", title: "Una tarde con la cantera", text: "Un grupo joven del club te invita a compartir una parte de tu experiencia. Puedes hablar de hábitos, escuchar sus preguntas o cuidar tu tiempo de descanso.", opts: [
    {t: "Compartir una rutina que te ayuda", fx: {prof: 1, fame: 1, mor: 1}}, {t: "Hablar del trabajo colectivo", fx: {coach: 1, mor: 2}}, {t: "Agradecer la invitación y descansar", fx: {fit: 2, mor: 1}}
  ]},
  {id: "uv_player_video_review", cat: "Entrenamiento", title: "Una revisión de vídeo contigo", text: "El equipo de análisis quiere revisar contigo varias secuencias de los últimos partidos. Puedes centrarte en una mejora técnica, compartir observaciones con el grupo o mantener una sesión más ligera.", opts: [
    {t: "Centrarme en una habilidad concreta", fx: {prof: 2, fit: -1}}, {t: "Practicar movimientos con el equipo", fx: {coach: 2, mor: 1}}, {t: "Mantener una carga equilibrada", fx: {fit: 2, form: 1}}
  ]},
  {id: "uv_player_roommate", cat: "Vestuario", title: "Una compañera o un compañero nuevo", text: "Una incorporación llega al vestuario y todavía se está adaptando al grupo. Puedes acercarte, facilitar una actividad compartida o dejar que encuentre su propio ritmo.", opts: [
    {t: "Hablar del trabajo colectivo", fx: {mor: 2, coach: 1}}, {t: "Probar la rutina durante un bloque", fx: {coach: 2, form: 1}}, {t: "Agradecer la invitación y descansar", fx: {fit: 1, mor: 1}}
  ]},
  {id: "uv_player_fans_meet", cat: "Afición", title: "Una conversación con la afición", text: "Un grupo de seguidores propone una charla breve después del entrenamiento. Puedes acercarte, compartir el mérito con el equipo o reservar ese rato para recuperarte.", opts: [
    {t: "Compartir una rutina que te ayuda", fx: {fame: 1, mor: 1}}, {t: "Hablar del trabajo colectivo", fx: {fans: 2, mor: 1}}, {t: "Agradecer la invitación y descansar", fx: {fit: 2}}
  ]},
  {id: "uv_player_schedule", cat: "Bienestar", title: "Ajustar tu semana de trabajo", text: "El calendario personal se aprieta y el cuerpo técnico te ofrece reorganizar una sesión. Puedes mantener intensidad, priorizar una mejora concreta o reservar margen para descansar.", opts: [
    {t: "Completar el entrenamiento con el grupo", fx: {coach: 2, fit: -2}}, {t: "Pedir trabajo individual", fx: {prof: 1, fit: 1}}, {t: "Bajar la carga y priorizar el descanso", fx: {fit: 3, mor: 1}}
  ]}
].forEach(uvRegisterPlayer);

function uvRegisterManager(story) {
  MEV({id: story.id, tipo: "aleatoria", cat: story.cat, title: story.title, w: story.w || 0.75, cd: 3,
    when: function (y) { return !!(y.inSeason && y.last && y.last.n >= 1); },
    text: function () { return tr(story.text); },
    opts: function () { return story.opts.map(function (o) { return {t: tr(o.t), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: o.fx}}; }); }});
}
[
  {id: "uv_mgr_captain_review", cat: "Vestuario", title: "La capitanía pide una reunión", text: "La capitanía quiere hablar del ambiente del grupo y de cómo repartir responsabilidades. Puedes abrir la conversación al equipo, acordar pasos concretos o revisar la situación más adelante.", opts: [
    {t: "Escuchar ideas para una mejora futura", fx: {chem: 2, board: 1}}, {t: "Definir un seguimiento con el grupo", fx: {sqMor: 2, chem: 1}}, {t: "Esperar y revisar el próximo informe", fx: {board: 1}}
  ]},
  {id: "uv_mgr_analysis", cat: "Táctica", title: "Un informe táctico con dos lecturas", text: "El análisis encuentra dos maneras razonables de afrontar el siguiente rival. Puedes preparar una variante, reforzar el plan conocido o pedir otra revisión antes de decidir.", opts: [
    {t: "Preparar cada partido con un plan distinto", fx: {chem: 1, board: 1}}, {t: "Mantener el bloque titular", fx: {chem: 2, sfit: -1}}, {t: "Esperar y revisar el próximo informe", fx: {board: 1, sfit: 1}}
  ]},
  {id: "uv_mgr_minutes", cat: "Plantilla", title: "Una conversación sobre los minutos", text: "Varias personas de la plantilla preguntan cómo se decidirán los minutos en el próximo tramo. Puedes explicar criterios comunes, hablar en privado o dejar que el rendimiento marque el orden.", opts: [
    {t: "Acordar una meta de minutos y seguimiento", fx: {sqMor: 2, board: 1}}, {t: "Hablar del trabajo colectivo", fx: {chem: 2, sqMor: 1}}, {t: "Dejar que el progreso marque el momento", fx: {board: 1, chem: 1}}
  ]},
  {id: "uv_mgr_training_load", cat: "Entrenamiento", title: "La intensidad del próximo entrenamiento", text: "El cuerpo técnico propone ajustar la sesión antes de una semana exigente. Puedes mantener la carga, dar más margen de recuperación o dividir el trabajo por grupos.", opts: [
    {t: "Completar el entrenamiento con el grupo", fx: {sfit: -2, chem: 1}}, {t: "Reservar más tiempo para recuperar", fx: {sfit: 3, chem: -1}}, {t: "Preparar una sesión breve de vídeo", fx: {sfit: 1, board: 1}}
  ]},
  {id: "uv_mgr_press_rotation", cat: "Prensa", title: "La prensa pregunta por las rotaciones", text: "En la rueda de prensa te preguntan cómo equilibrar continuidad y oportunidades para la plantilla. Puedes explicar el criterio, proteger al grupo de expectativas o centrarte en el siguiente partido.", opts: [
    {t: "Hablar del trabajo colectivo", fx: {rep: 2, sqMor: 1}}, {t: "Agradecer la invitación y descansar", fx: {rep: 1, board: 1}}, {t: "Mantener el bloque titular", fx: {chem: 1, rep: 1}}
  ]},
  {id: "uv_mgr_scout_budget", cat: "Dirección deportiva", title: "El área de análisis pide recursos", text: "El departamento propone una mejora pequeña para organizar informes y seguimiento. Puedes aprobarla dentro del presupuesto, probarla con un grupo reducido o aplazar el gasto.", opts: [
    {t: "Ampliar el seguimiento de scouting", fx: {bud: -2500, board: 2}}, {t: "Invitar a una prueba de entrenamiento", fx: {sqMor: 1, board: 1}}, {t: "Esperar y revisar el próximo informe", fx: {board: 1, bud: 0}}
  ]}
].forEach(uvRegisterManager);

function uvRegisterClub(story) {
  MEV({id: story.id, tipo: "aleatoria", cat: story.cat, title: story.title, w: story.w || 0.7, cd: 4,
    when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
    text: function () { return tr(story.text); },
    opts: function () { return story.opts.map(function (o) { return {t: tr(o.t), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: o.fx}}; }); }});
}
[
  {id: "uv_club_lighting", cat: "Instalaciones", title: "Mejorar la iluminación del campo", text: "El personal propone renovar una parte de la iluminación para facilitar los entrenamientos de tarde. Puedes invertir ahora, hacer una mejora menor o esperar al siguiente presupuesto.", opts: [
    {t: "Aprobar una mejora gradual", fx: {bud: -7000, board: 2, rep: 1}}, {t: "Organizar una jornada abierta", fx: {bud: -2500, fans: 2}}, {t: "Esperar a tener más recursos", fx: {board: 1}}
  ]},
  {id: "uv_club_tickets", cat: "Afición", title: "El precio de la próxima entrada", text: "La afición pregunta por el precio de las entradas para el siguiente partido en casa. Puedes priorizar una grada accesible, mantener la tarifa o reservar algunas plazas para la comunidad.", opts: [
    {t: "Mantener precios accesibles", fx: {bud: -3000, fans: 4, rep: 1}}, {t: "Mantener la tarifa actual", fx: {bud: 1500, fans: 1}}, {t: "Reservar plazas para la comunidad", fx: {bud: -1500, fans: 3, board: 1}}
  ]},
  {id: "uv_club_open_day", cat: "Comunidad", title: "Un día de puertas abiertas", text: "Familias y comercios locales proponen conocer el club en una jornada abierta. Puedes organizar una versión sencilla, asociarte con una entidad vecinal o esperar a tener más personal.", opts: [
    {t: "Organizar una jornada abierta", fx: {bud: -4500, fans: 3, rep: 1}}, {t: "Crear un programa de becas pequeño", fx: {bud: -6000, fans: 2, board: 2}}, {t: "Esperar a tener más recursos", fx: {board: 1}}
  ]},
  {id: "uv_club_preseason", cat: "Proyecto", title: "Un torneo de presentación", text: "La comunidad propone un torneo amistoso para presentar el club. Puede generar actividad y atraer nuevas caras, aunque requiere organización y una parte moderada del presupuesto.", opts: [
    {t: "Organizar un torneo pequeño", fx: {bud: -5000, fans: 3, rep: 1}}, {t: "Invitar a clubes del entorno", fx: {bud: -3000, fans: 2, chem: 1}}, {t: "Aplazarlo hasta la próxima temporada", fx: {board: 1, bud: 0}}
  ]},
  {id: "uv_club_members", cat: "Afición", title: "Una propuesta de las personas socias", text: "Las personas socias quieren proponer una mejora para la experiencia de los días de partido. Puedes abrir una consulta breve, probar una idea pequeña o dejarlo para una reunión futura.", opts: [
    {t: "Escuchar ideas para una mejora futura", fx: {fans: 3, board: 2}}, {t: "Probar una mejora de bajo coste", fx: {bud: -2000, fans: 2, board: 1}}, {t: "Aplazarlo hasta la próxima temporada", fx: {board: 1}}
  ]},
  {id: "uv_club_travel", cat: "Logística", title: "Planificar un desplazamiento", text: "La logística del próximo viaje ofrece dos opciones razonables. Puedes elegir la más cómoda, compartir el traslado para reducir costes o revisar primero el calendario y el presupuesto.", opts: [
    {t: "Priorizar comodidad y recuperación", fx: {bud: -3500, sfit: 2}}, {t: "Compartir el transporte", fx: {bud: -1500, fans: 1, board: 1}}, {t: "Revisar el presupuesto antes de decidir", fx: {board: 1}}
  ]}
].forEach(uvRegisterClub);

/* Tercer bloque: formación, comunicación deportiva y responsabilidad comunitaria. */
EV({id: "uv_player_study_balance", tipo: "aleatoria", cat: "Progreso", title: "Una formación compatible con la temporada",
  w: 0.85, cd: 4,
  when: function (x) { return x.inSeason && x.p.age >= 16 && x.p.age <= 24 && x.teamGames >= 2; },
  text: function () { return tr("El club comparte una opción de formación breve que podría encajar con tu carrera. Antes de apuntarte, puedes comprobar el horario y cuánto espacio deja para entrenar y descansar."); },
  opts: function () { return [
    {t: tr("Elegir un formato a distancia"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 2, mor: 1, flag: {uvStudyPlan: "remote"}}}},
    {t: tr("Coordinar un horario de baja carga"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 1, fit: 1, coach: 1, flag: {uvStudyPlan: "flexible"}}}},
    {t: tr("Dejarlo para el siguiente receso"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 1, flag: {uvStudyPlan: "defer"}}}}
  ]; }});

EV({id: "uv_player_feedback_session", tipo: "aleatoria", cat: "Entrenamiento", title: "Una devolución individual del cuerpo técnico",
  w: 0.9, cd: 3,
  when: function (x) { return x.inSeason && x.teamGames >= 5; },
  text: function () { return tr("Después de varias jornadas, el cuerpo técnico propone revisar contigo un aspecto concreto de tu juego. Puedes pedir ejemplos, convertirlo en una meta pequeña o tomarte un tiempo para procesar la devolución."); },
  opts: function () { return [
    {t: tr("Pedir ejemplos claros en vídeo"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 2, coach: 1}}},
    {t: tr("Acordar una meta pequeña de trabajo"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 1, form: 1, mor: 1}}},
    {t: tr("Asimilarlo antes de cambiar mi rutina"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {mor: 2, fit: 1}}}
  ]; }});

EV({id: "uv_player_rehab_rhythm", tipo: "aleatoria", cat: "Salud", title: "Volver paso a paso",
  w: 1.0, cd: 3,
  when: function (x) { return x.inSeason && x.p.inj > 0 && x.p.inj <= S.tw; },
  text: function () { return tr("Mientras sigues las indicaciones del personal sanitario, el cuerpo técnico te pregunta cómo organizar las tareas complementarias durante la recuperación. No hace falta adelantar el regreso."); },
  opts: function () { return [
    {t: tr("Mantenerme dentro del plan indicado"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 2, mor: 1, flag: {uvRehabPath: "plan"}}}},
    {t: tr("Pedir una alternativa individual"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 1, coach: 1, flag: {uvRehabPath: "individual"}}}},
    {t: tr("Posponer la carga y revisar después"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 3, mor: 1, flag: {uvRehabPath: "later"}}}}
  ]; }});

MEV({id: "uv_mgr_set_piece_detail", tipo: "aleatoria", cat: "Táctica", title: "Un detalle a balón parado",
  w: 0.9, cd: 3,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 1; },
  text: function () { return tr("El análisis detecta una oportunidad para afinar las jugadas a balón parado. El equipo puede dedicar un bloque a una rutina nueva, ordenar mejor la defensa o mantener lo que ya conoce."); },
  opts: function () { return [
    {t: tr("Ensayar una rutina ofensiva sencilla"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 2, chem: 1, sfit: -1, flag: {uvSetPiecePlan: "attack"}}}},
    {t: tr("Revisar las marcas defensivas"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 1, sfit: 1, flag: {uvSetPiecePlan: "defence"}}}},
    {t: tr("Conservar las rutinas conocidas"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {chem: 1, sfit: 1, flag: {uvSetPiecePlan: "familiar"}}}}
  ]; }});

MEV({id: "uv_mgr_substitute_roles", tipo: "aleatoria", cat: "Plantilla", title: "Claridad para quienes esperan su turno",
  w: 0.9, cd: 3,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 2; },
  text: function () { return tr("Parte de la plantilla quiere entender mejor cómo preparar su papel cuando empieza el partido desde el banquillo. Puedes fijar expectativas, abrir conversaciones individuales o explicar un criterio común para el grupo."); },
  opts: function () { return [
    {t: tr("Definir funciones antes de cada partido"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {sqMor: 2, chem: 1}}},
    {t: tr("Hablar con cada persona por separado"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {sqMor: 1, board: 1}}},
    {t: tr("Explicar un criterio compartido"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {chem: 2, board: 1}}}
  ]; }});

MEV({id: "uv_mgr_staff_tools", tipo: "aleatoria", cat: "Dirección deportiva", title: "Una herramienta sencilla para el equipo técnico",
  w: 0.7, cd: 4,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 1; },
  text: function () { return tr("El cuerpo técnico propone una herramienta modesta para ordenar los informes de entrenamiento. No cambiará el plan por sí sola; puede ahorrar tiempo si el equipo acuerda cómo usarla."); },
  opts: function () { return [
    {t: tr("Aprobar una prueba de un mes"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -3000, board: 2, flag: {uvManagerTool: "fullTrial"}}}},
    {t: tr("Probarla con una parte del cuerpo técnico"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -1000, board: 1, chem: 1, flag: {uvManagerTool: "smallTrial"}}}},
    {t: tr("Seguir con el sistema actual"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {board: 1, flag: {uvManagerTool: "defer"}}}}
  ]; }});

MEV({id: "uv_club_access", tipo: "aleatoria", cat: "Instalaciones", title: "Un día de partido más accesible",
  w: 0.8, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("La comunidad señala pequeños cambios que ayudarían a que más personas disfruten de los partidos. Puedes empezar por una mejora concreta, buscar asesoramiento local o planificarlo por etapas."); },
  opts: function () { return [
    {t: tr("Mejorar primero una zona de acceso"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -5000, fans: 3, rep: 1, flag: {uvClubAccessPlan: "started"}}}},
    {t: tr("Consultar a una entidad de la zona"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -1500, board: 2, fans: 1, flag: {uvClubAccessPlan: "consult"}}}},
    {t: tr("Preparar un plan por etapas"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 2, fans: 1, flag: {uvClubAccessPlan: "phased"}}}}
  ]; }});

MEV({id: "uv_club_girls_open_session", tipo: "aleatoria", cat: "Comunidad", title: "Una sesión abierta para chicas del barrio",
  w: 0.75, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Una asociación local pregunta si el club puede abrir una sesión de iniciación para chicas jóvenes. Sería una actividad comunitaria puntual; no presupone crear una sección ni una competición."); },
  opts: function () { return [
    {t: tr("Organizar una sesión de prueba"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {bud: -2500, fans: 3, rep: 1, flag: {uvClubGirlsActivity: "session"}}}},
    {t: tr("Prepararla con una entidad local"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {bud: -1500, fans: 2, board: 2, flag: {uvClubGirlsActivity: "partner"}}}},
    {t: tr("Consultar el interés antes de fijar fecha"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {fans: 1, board: 1, flag: {uvClubGirlsActivity: "consult"}}}}
  ]; }});

MEV({id: "uv_club_volunteers", tipo: "aleatoria", cat: "Comunidad", title: "La jornada necesita más manos",
  w: 0.8, cd: 3,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Las personas que ayudan los días de partido piden una organización más clara. Puedes preparar turnos con antelación, reconocer su esfuerzo o reducir el alcance de la próxima actividad."); },
  opts: function () { return [
    {t: tr("Organizar turnos con antelación"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 2, fans: 1}}},
    {t: tr("Reservar un pequeño presupuesto de apoyo"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -2000, fans: 2, rep: 1}}},
    {t: tr("Hacer una jornada más sencilla"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: 0, board: 1, sfit: 1}}}
  ]; }});

/* Cuarto bloque: exposición pública, aprendizaje compartido y cuidado del entorno. */
EV({id: "uv_player_media_boundaries", tipo: "aleatoria", cat: "Prensa", title: "Una entrevista con límites claros",
  w: 0.8, cd: 3,
  when: function (x) { return x.inSeason && x.teamGames >= 2; },
  text: function () { return tr("Una periodista te propone una entrevista que mezcla fútbol y vida personal. Puedes acordar de antemano el tema, dar espacio al equipo o declinar sin cerrar futuras conversaciones."); },
  opts: function () { return [
    {t: tr("Acordar un tema deportivo"), ok: {txt: tr("La conversación deja una impresión positiva."), fx: {fame: 1, coach: 1}}},
    {t: tr("Centrar la respuesta en el equipo"), ok: {txt: tr("La conversación deja una impresión positiva."), fx: {mor: 2, coach: 1}}},
    {t: tr("Declinar y reservar tiempo"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 1}}}
  ]; }});

EV({id: "uv_player_block_review", tipo: "aleatoria", cat: "Progreso", title: "Cerrar un tramo con una idea clara",
  w: 0.9, cd: 3,
  when: function (x) { return x.inSeason && x.teamGames >= 4; },
  text: function () { return tr("Tras varias semanas de competición, el cuerpo técnico te ofrece una breve revisión individual. Puedes fijarte en una acción concreta, escoger un objetivo para el siguiente tramo o dejar que el aprendizaje repose."); },
  opts: function () { return [
    {t: tr("Revisar una acción concreta"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 2, coach: 1}}},
    {t: tr("Escoger un objetivo para el próximo tramo"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 1, form: 1, mor: 1}}},
    {t: tr("Dejar reposar las conclusiones"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 2}}}
  ]; }});

EV({id: "uv_player_focus_workshop", tipo: "aleatoria", cat: "Bienestar", title: "Un taller de concentración deportiva",
  w: 0.75, cd: 4,
  when: function (x) { return x.inSeason && x.teamGames >= 3 && x.p.age <= 35; },
  text: function () { return tr("El club ofrece un taller optativo sobre concentración y rutinas antes del partido. No es obligatorio ni sustituye el descanso; puedes probarlo, pedir una versión práctica o buscar otro momento."); },
  opts: function () { return [
    {t: tr("Asistir con el grupo"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 1, mor: 2, coach: 1}}},
    {t: tr("Pedir ejercicios breves para practicar"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 1, fit: 1}}},
    {t: tr("Esperar a que el calendario dé más margen"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 1}}}
  ]; }});

MEV({id: "uv_mgr_process_review", tipo: "aleatoria", cat: "Táctica", title: "Revisar el proceso, no solo el marcador",
  w: 0.85, cd: 3,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 3; },
  text: function () { return tr("El cuerpo técnico propone revisar el último bloque de trabajo sin reducirlo a los resultados. Puedes comprobar una fase del juego, escuchar la lectura del grupo o cambiar un único objetivo de entrenamiento."); },
  opts: function () { return [
    {t: tr("Analizar una fase concreta del juego"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 2, chem: 1}}},
    {t: tr("Recoger la opinión de la plantilla"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {sqMor: 1, chem: 2}}},
    {t: tr("Cambiar un solo foco de entrenamiento"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 1, sfit: 1}}}
  ]; }});

MEV({id: "uv_mgr_style_interview", tipo: "aleatoria", cat: "Prensa", title: "¿Cómo quiere jugar el equipo?",
  w: 0.8, cd: 3,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 1; },
  text: function () { return tr("En una entrevista te preguntan qué principios definen al equipo. Puedes explicar una idea concreta, destacar el trabajo colectivo o evitar promesas y centrarte en el siguiente partido."); },
  opts: function () { return [
    {t: tr("Explicar un principio de juego"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {rep: 2, board: 1}}},
    {t: tr("Dar el mérito al trabajo colectivo"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {rep: 1, chem: 1, sqMor: 1}}},
    {t: tr("Evitar promesas y hablar del próximo partido"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {rep: 1, board: 1}}}
  ]; }});

MEV({id: "uv_mgr_scouting_week", tipo: "aleatoria", cat: "Dirección deportiva", title: "Una semana para observar mejor",
  w: 0.75, cd: 4,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 2; },
  text: function () { return tr("El área deportiva pide reservar una parte de la semana para mejorar el seguimiento de posibles incorporaciones. Puedes observar partidos, ordenar los informes existentes o proteger el tiempo del personal."); },
  opts: function () { return [
    {t: tr("Observar un partido en directo"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -1500, board: 1}}},
    {t: tr("Ordenar y comparar los informes actuales"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {board: 2}}},
    {t: tr("Mantener la carga habitual del personal"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {sqMor: 1, board: 1}}}
  ]; }});

MEV({id: "uv_club_transit", tipo: "aleatoria", cat: "Logística", title: "Llegar al campo con menos barreras",
  w: 0.75, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Una entidad local propone coordinar mejor los desplazamientos a los partidos. El club puede probar una solución pequeña, colaborar en la difusión de rutas existentes o preguntar primero qué necesita la afición."); },
  opts: function () { return [
    {t: tr("Probar un transporte compartido"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -2500, fans: 3, rep: 1}}},
    {t: tr("Difundir rutas y horarios disponibles"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {fans: 2, board: 1}}},
    {t: tr("Consultar primero a la comunidad"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {fans: 1, board: 2}}}
  ]; }});

MEV({id: "uv_club_reuse", tipo: "aleatoria", cat: "Proyecto", title: "Reducir residuos en los días de partido",
  w: 0.7, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Un proveedor de la zona propone probar medidas sencillas para reducir residuos en el campo. Puedes empezar con un piloto pequeño, comparar alternativas o esperar a la siguiente revisión del presupuesto."); },
  opts: function () { return [
    {t: tr("Probar vasos reutilizables en una grada"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -2000, fans: 2, rep: 1}}},
    {t: tr("Pedir dos presupuestos comparables"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 1, rep: 1}}},
    {t: tr("Revisarlo en el próximo presupuesto"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 1}}}
  ]; }});

MEV({id: "uv_club_shared_space", tipo: "aleatoria", cat: "Comunidad", title: "Abrir el espacio del club fuera de los partidos",
  w: 0.7, cd: 4,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Un grupo vecinal pregunta si puede usar una sala del club para una actividad puntual cuando no hay entrenamiento. Puedes acordar una prueba supervisada, fijar condiciones claras o esperar a tener más personal."); },
  opts: function () { return [
    {t: tr("Acordar una prueba con horario definido"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {fans: 2, board: 2}}},
    {t: tr("Definir responsabilidades antes de abrirla"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {board: 2, bud: -1000}}},
    {t: tr("Esperar hasta tener apoyo suficiente"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {board: 1}}}
  ]; }});

/* Arcos cortos: las decisiones iniciales guardan un seguimiento en flags existentes del save. */
EV({id: "uv_player_study_followup", tipo: "aleatoria", cat: "Progreso", title: "Revisar cómo encaja la formación",
  w: 1.0, cd: 1,
  when: function (x) { return !!(x.inSeason && x.p.flags && (x.p.flags.uvStudyPlan === "remote" || x.p.flags.uvStudyPlan === "flexible")); },
  text: function () { return tr("Ya has probado una forma de compaginar la formación y el fútbol. Puedes mantener el ritmo, rebajar una semana o pausar el curso sin perder lo aprendido."); },
  opts: function () { return [
    {t: tr("Mantener el plan de formación"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {prof: 1, fit: -1, flag: {uvStudyPlan: false}}}},
    {t: tr("Reducir la carga esa semana"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 1, flag: {uvStudyPlan: false}}}},
    {t: tr("Pausar el curso y retomarlo después"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 2, flag: {uvStudyPlan: false}}}}
  ]; }});

MEV({id: "uv_mgr_tools_review", tipo: "aleatoria", cat: "Dirección deportiva", title: "¿La herramienta ahorró tiempo?",
  w: 0.9, cd: 1,
  when: function (y) { return !!(y.inSeason && S.m && S.m.flags && (S.m.flags.uvManagerTool === "fullTrial" || S.m.flags.uvManagerTool === "smallTrial")); },
  text: function () { return tr("Tras el periodo de prueba, el cuerpo técnico comparte qué partes del nuevo flujo le resultaron útiles. Puedes mantenerlo, ajustar su alcance o volver al método anterior."); },
  opts: function () { return [
    {t: tr("Mantener la herramienta y revisar su uso"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -1000, board: 1, flag: {uvManagerTool: false}}}},
    {t: tr("Ajustar el proceso antes de ampliarlo"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {board: 2, flag: {uvManagerTool: false}}}},
    {t: tr("Volver al sistema anterior"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {board: 1, flag: {uvManagerTool: false}}}}
  ]; }});

MEV({id: "uv_club_girls_review", tipo: "aleatoria", cat: "Comunidad", title: "Una respuesta a la propuesta de actividad",
  w: 0.85, cd: 1,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id && S.m.flags && S.m.flags.uvClubGirlsActivity); },
  text: function () { return S.m.flags.uvClubGirlsActivity === "consult"
    ? tr("La consulta local ya tiene respuestas. Puedes ajustar la idea, buscar apoyo concreto o esperar a reunir más información.")
    : tr("Tras coordinar la actividad con la comunidad, el club recibe comentarios iniciales. Puedes documentar lo aprendido, acordar un paso pequeño o no fijar otra fecha todavía."); },
  opts: function () { return [
    {t: tr("Guardar los aprendizajes y revisarlos más adelante"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {board: 2, fans: 1, flag: {uvClubGirlsActivity: false}}}},
    {t: tr("Acordar una siguiente actividad pequeña"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {bud: -1000, fans: 2, rep: 1, flag: {uvClubGirlsActivity: false}}}},
    {t: tr("No comprometer otra fecha todavía"), ok: {txt: tr("El proyecto acerca al club a su comunidad."), fx: {board: 1, flag: {uvClubGirlsActivity: false}}}}
  ]; }});

EV({id: "uv_player_rehab_checkin", tipo: "aleatoria", cat: "Salud", title: "Revisar el plan de recuperación",
  w: 1.0, cd: 1,
  when: function (x) { return !!(x.inSeason && x.p.flags && x.p.flags.uvRehabPath); },
  text: function () { return tr("En la siguiente conversación de seguimiento, el cuerpo técnico revisa contigo las tareas complementarias sin sustituir las indicaciones sanitarias. Puedes mantener el acuerdo, ajustar el ritmo o seguir dando prioridad al descanso."); },
  opts: function () { return [
    {t: tr("Mantener el acuerdo actual"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {mor: 1, flag: {uvRehabPath: false}}}},
    {t: tr("Ajustar las tareas en el próximo control"), ok: {txt: tr("Tu plan tiene una prioridad clara para el siguiente bloque."), fx: {coach: 1, prof: 1, flag: {uvRehabPath: false}}}},
    {t: tr("Reservar otro periodo de descanso"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 2, flag: {uvRehabPath: false}}}}
  ]; }});

MEV({id: "uv_mgr_set_piece_review", tipo: "aleatoria", cat: "Táctica", title: "Comprobar la nueva rutina a balón parado",
  w: 0.9, cd: 1,
  when: function (y) { return !!(y.inSeason && S.m && S.m.flags && (S.m.flags.uvSetPiecePlan === "attack" || S.m.flags.uvSetPiecePlan === "defence")); },
  text: function () { return tr("Después del bloque de trabajo, el equipo revisa si la rutina elegida resulta clara para quienes la ejecutan. Puedes mantenerla, simplificar las señales o volver a la alternativa anterior."); },
  opts: function () { return [
    {t: tr("Mantener la rutina preparada"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 1, chem: 1, flag: {uvSetPiecePlan: false}}}},
    {t: tr("Simplificar las señales del grupo"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {chem: 2, board: 1, flag: {uvSetPiecePlan: false}}}},
    {t: tr("Volver a la opción anterior"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {sfit: 1, flag: {uvSetPiecePlan: false}}}}
  ]; }});

MEV({id: "uv_club_access_followup", tipo: "aleatoria", cat: "Instalaciones", title: "Qué queda por mejorar en el acceso",
  w: 0.8, cd: 1,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id && S.m.flags && S.m.flags.uvClubAccessPlan); },
  text: function () { return S.m.flags.uvClubAccessPlan === "consult"
    ? tr("La entidad local ha compartido recomendaciones; todavía no se ha cambiado ninguna instalación. Puedes priorizar un paso, pedir una revisión conjunta o confirmar primero los recursos.")
    : tr("El club y la comunidad revisan el primer paso del plan de acceso. Puedes priorizar una mejora concreta, acordar una revisión conjunta o confirmar los recursos antes de avanzar."); },
  opts: function () { return [
    {t: tr("Priorizar una mejora concreta"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {bud: -2000, fans: 2, rep: 1, flag: {uvClubAccessPlan: false}}}},
    {t: tr("Pedir una revisión conjunta"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 2, fans: 1, flag: {uvClubAccessPlan: false}}}},
    {t: tr("Confirmar los recursos antes de avanzar"), ok: {txt: tr("El proyecto avanza con una decisión asumible para el club."), fx: {board: 1, flag: {uvClubAccessPlan: false}}}}
  ]; }});


/* Cuarto bloque: pequeñas decisiones prácticas, universales y accesibles en ambos universos de género. */
EV({id: "uv_player_travel_language", tipo: "aleatoria", cat: "Progreso", title: "Unas palabras para tu próximo desplazamiento",
  w: 0.7, cd: 4,
  when: function (x) { return x.inSeason && x.teamGames >= 2; },
  text: function () { return tr("Al preparar el siguiente viaje, el club ofrece practicar unas frases del idioma local. Puede facilitar la convivencia, pero el formato y el momento los eliges tú."); },
  opts: function () { return [
    {t: tr("Practicar frases útiles en sesiones breves"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 1, coach: 1}}},
    {t: tr("Aprender con una compañera o un compañero"), ok: {txt: tr("Has elegido una prioridad clara para el siguiente bloque."), fx: {prof: 1, mor: 1}}},
    {t: tr("Dejarlo para un tramo con más tiempo"), ok: {txt: tr("Has protegido tu tiempo de recuperación."), fx: {fit: 1, mor: 1}}}
  ]; }});

MEV({id: "uv_mgr_weather_plan", tipo: "aleatoria", cat: "Entrenamiento", title: "Una sesión con un plan alternativo",
  w: 0.75, cd: 3,
  when: function (y) { return y.inSeason && y.last && y.last.n >= 1; },
  text: function () { return tr("La previsión puede cambiar las condiciones del próximo entrenamiento. El cuerpo técnico propone dejar preparada una alternativa sin alterar los objetivos de la semana."); },
  opts: function () { return [
    {t: tr("Preparar una alternativa de menor carga"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {sfit: 2, board: 1}}},
    {t: tr("Mantener los objetivos con una sesión interior"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {chem: 1, sfit: -1}}},
    {t: tr("Esperar a la siguiente actualización meteorológica"), ok: {txt: tr("El vestuario sabe cuál será el siguiente paso."), fx: {board: 1}}}
  ]; }});

MEV({id: "uv_club_reserve_fund", tipo: "aleatoria", cat: "Proyecto", title: "Crear una pequeña reserva para imprevistos",
  w: 0.7, cd: 5,
  when: function () { return !!(S.custom && S.m && S.m.club === S.custom.id); },
  text: function () { return tr("Una revisión del presupuesto propone reservar una parte del saldo para reparaciones o gastos inesperados. Puedes empezar con una cantidad prudente, aportar menos o revisar las cuentas antes de comprometer recursos."); },
  opts: function () { return [
    {t: tr("Separar una cantidad fija en la reserva"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -5000, board: 2}}},
    {t: tr("Empezar con una aportación menor"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {bud: -2000, board: 1}}},
    {t: tr("Esperar a cerrar el próximo presupuesto"), ok: {txt: tr("El club ha elegido una prioridad sostenible."), fx: {fans: 1, board: 1}}}
  ]; }});

/* Quinto bloque: partido, cantera y comunidad; válido en carreras masculinas y femeninas. */
[{id: "uv_player_captain_call", cat: "Vestuario", title: "La charla antes del partido", text: "La capitanía te pide una mano con la charla previa. Puedes preparar unas palabras breves, dejar que hable otra persona o centrarte en tu propia preparación.", opts: [{t: "Compartir una idea breve con el grupo", fx: {"mor": 2, "coach": 1}},{t: "Escuchar y dejar espacio a la capitanía", fx: {"mor": 1, "coach": 2}},{t: "Prepararte en silencio", fx: {"fit": 1, "form": 1}}]},{id: "uv_player_sleep_travel", cat: "Salud", title: "Dormir bien antes del viaje", text: "El desplazamiento se solapa con una noche corta. Puedes ajustar tu rutina de descanso, compartir el plan con el equipo médico o mantener tus horarios habituales.", opts: [{t: "Ajustar el descanso y la hidratación", fx: {"fit": 2, "mor": 1}},{t: "Consultar el plan con el equipo médico", fx: {"fit": 1, "prof": 1}},{t: "Mantener tus horarios habituales", fx: {"mor": 1, "form": 1}}]},{id: "uv_player_wall_ball", cat: "Entrenamiento", title: "Repetir un gesto a balón parado", text: "Después del entrenamiento queda un rato libre para repetir un gesto técnico. Puedes quedarte a practicar, pedir compañía o reservar el tiempo para recuperar.", opts: [{t: "Repetir el gesto con calma", fx: {"prof": 2, "fit": -1}},{t: "Practicar con una compañera o un compañero", fx: {"coach": 2, "prof": 1}},{t: "Aprovechar para estirar", fx: {"fit": 2, "mor": 1}}]},{id: "uv_player_young_photo", cat: "Afición", title: "Una foto con la afición joven", text: "Un grupo de niños y niñas espera junto al túnel para una foto. Puedes quedarte un momento, proponer una visita al club o seguir con tu plan de recuperación.", opts: [{t: "Quedarte y saludar con calma", fx: {"fame": 1, "mor": 2, "fans": 1}},{t: "Proponer una visita al club", fx: {"fans": 2, "fame": 1}},{t: "Seguir con tu recuperación", fx: {"fit": 2, "mor": 1}}]}].forEach(uvRegisterPlayer);
[{id: "uv_mgr_keeper_rotation", cat: "Plantilla", title: "La rotación de portería", text: "El cuerpo técnico plantea repartir minutos en la portería. Puedes explicar el criterio, alternar por partido o mantener a quien venía jugando.", opts: [{t: "Explicar criterios y repartir minutos", fx: {"sqMor": 2, "board": 1}},{t: "Alternar según el partido", fx: {"chem": 2, "sfit": -1}},{t: "Mantener la titularidad actual", fx: {"chem": 1, "board": 1}}]},{id: "uv_mgr_youth_debut", cat: "Cantera", title: "El momento de una debutante", text: "Una jugadora joven del filial entrena cada vez mejor. Puedes darle minutos en un partido controlado, llevarla convocada sin jugar o esperar a un contexto más favorable.", opts: [{t: "Dar minutos en un partido controlado", fx: {"youth": 2, "sqMor": 1}},{t: "Convocarla para aprender del grupo", fx: {"sqMor": 1, "board": 1}},{t: "Esperar a un mejor contexto", fx: {"board": 1, "chem": 1}}]},{id: "uv_mgr_pitch_care", cat: "Instalaciones", title: "El estado del césped", text: "El responsable del campo avisa de que la superficie necesita cuidado antes del próximo partido. Puedes ajustar el entrenamiento, invertir en una reparación o cambiar de escenario.", opts: [{t: "Ajustar el entrenamiento al estado del campo", fx: {"sfit": 1, "board": 1}},{t: "Aprobar una reparación puntual", fx: {"bud": -4000, "sfit": 2}},{t: "Cambiar el escenario de la sesión", fx: {"bud": -1500, "chem": 1}}]},{id: "uv_mgr_after_loss", cat: "Prensa", title: "Explicar una derrota", text: "La prensa pide explicaciones tras un resultado adverso. Puedes asumir responsabilidad, destacar el trabajo del grupo o pedir tiempo para analizar los datos.", opts: [{t: "Asumir la responsabilidad", fx: {"rep": 2, "sqMor": 1}},{t: "Destacar el trabajo del grupo", fx: {"rep": 1, "chem": 1}},{t: "Pedir tiempo para analizar", fx: {"board": 1, "rep": 1}}]}].forEach(uvRegisterManager);
[{id: "uv_club_kit_reuse", cat: "Proyecto", title: "Camisetas para más de una temporada", text: "El club estudia alargar la vida útil de las equipaciones. Puedes reutilizar las actuales, renovar solo una parte o dejar la decisión para el siguiente presupuesto.", opts: [{t: "Reutilizar las equipaciones actuales", fx: {"bud": 1500, "fans": 1}},{t: "Renovar solo una parte", fx: {"bud": -3000, "fans": 2}},{t: "Esperar al siguiente presupuesto", fx: {"board": 1}}]},{id: "uv_club_stream", cat: "Afición", title: "Retransmitir los partidos locales", text: "Un grupo de aficionados propone emitir los partidos en casa de forma sencilla. Puedes preparar una señal básica, buscar una colaboración o esperar a tener más medios.", opts: [{t: "Preparar una emisión sencilla", fx: {"bud": -2500, "fans": 3}},{t: "Buscar una colaboración local", fx: {"fans": 2, "rep": 1}},{t: "Esperar a tener más medios", fx: {"board": 1}}]},{id: "uv_club_school_link", cat: "Comunidad", title: "Un convenio con la escuela del barrio", text: "La escuela cercana propone un acuerdo para que el alumnado conozca el club. Puedes firmar un convenio pequeño, organizar una visita o posponer la conversación.", opts: [{t: "Firmar un convenio sencillo", fx: {"bud": -2000, "fans": 2, "rep": 1}},{t: "Organizar una visita guiada", fx: {"fans": 1, "rep": 1}},{t: "Posponer la conversación", fx: {"board": 1}}]},{id: "uv_club_first_aid", cat: "Instalaciones", title: "Formación básica de primeros auxilios", text: "El personal propone una formación breve de primeros auxilios para quienes trabajan en los partidos. Puedes financiarla, empezar por el equipo técnico o esperar a la próxima temporada.", opts: [{t: "Financiar la formación completa", fx: {"bud": -3000, "board": 2}},{t: "Empezar por el equipo técnico", fx: {"bud": -1200, "board": 1}},{t: "Esperar a la próxima temporada", fx: {"board": 1}}]}].forEach(uvRegisterClub);

/* Sexto bloque: rutinas, convivencia y gestión cotidiana del club. */
[{id: "uv_player_derby_nerves", cat: "Bienestar", title: "Los nervios antes del derbi", text: "El partido más esperado de la temporada se acerca y notas la tensión. Puedes seguir una rutina de respiración, hablar con alguien del cuerpo técnico o mantener tu preparación habitual.", opts: [{t: "Probar una rutina breve de respiración", fx: {"mor": 2, "form": 1}},{t: "Hablar con el cuerpo técnico", fx: {"coach": 1, "mor": 2}},{t: "Mantener tu preparación habitual", fx: {"form": 1, "fit": 1}}]},{id: "uv_player_boots", cat: "Progreso", title: "Las botas del próximo partido", text: "El equipo de material propone probar un modelo distinto para sentir mejor el balón. Puedes dedicar un entrenamiento a adaptarte, alternar durante la semana o quedarte con lo conocido.", opts: [{t: "Probar el modelo en un entrenamiento", fx: {"prof": 2, "fit": -1}},{t: "Alternar durante la semana", fx: {"prof": 1, "form": 1}},{t: "Seguir con lo conocido", fx: {"form": 2, "mor": 1}}]},{id: "uv_player_team_language", cat: "Vestuario", title: "El idioma del vestuario", text: "En el grupo conviven varios idiomas y una incorporación todavía no sigue todas las consignas. Puedes ayudar con traducciones, proponer señales comunes o dejar que lo resuelva el club.", opts: [{t: "Ayudar con traducciones sencillas", fx: {"mor": 2, "coach": 1}},{t: "Proponer señales comunes", fx: {"coach": 2, "mor": 1}},{t: "Dejar que lo resuelva el club", fx: {"form": 1, "mor": 1}}]},{id: "uv_player_free_day", cat: "Bienestar", title: "Un día libre en el calendario", text: "El calendario deja un día sin entrenamiento. Puedes aprovecharlo para descansar del todo, hacer algo de movilidad suave o adelantar trabajo de análisis.", opts: [{t: "Descansar sin actividad", fx: {"fit": 2, "mor": 2}},{t: "Hacer movilidad suave", fx: {"fit": 1, "prof": 1}},{t: "Adelantar análisis de vídeo", fx: {"prof": 2, "fit": -1}}]}].forEach(uvRegisterPlayer);
[{id: "uv_mgr_bench_talk", cat: "Vestuario", title: "Hablar con quienes no juegan", text: "Varias personas del banquillo quieren entender su papel en el próximo tramo. Puedes abrir una conversación grupal, hablar caso por caso o dejar que el rendimiento hable.", opts: [{t: "Abrir una conversación grupal", fx: {"sqMor": 2, "chem": 1}},{t: "Hablar caso por caso", fx: {"sqMor": 2, "board": 1}},{t: "Dejar que el rendimiento hable", fx: {"chem": 1, "board": 1}}]},{id: "uv_mgr_fan_group", cat: "Afición", title: "Una reunión con la afición organizada", text: "El grupo de animación pide conocer el plan para el próximo partido en casa. Puedes explicar el enfoque, pedir su apoyo concreto o mantener la distancia habitual.", opts: [{t: "Explicar el enfoque del partido", fx: {"fans": 2, "rep": 1}},{t: "Pedir un apoyo concreto", fx: {"fans": 3, "sqMor": -1}},{t: "Mantener la distancia habitual", fx: {"board": 1, "rep": 1}}]},{id: "uv_mgr_travel_roster", cat: "Calendario", title: "La lista para un viaje largo", text: "El desplazamiento más largo de la temporada exige elegir la convocatoria. Puedes llevar más gente joven, priorizar experiencia o repartir según la carga.", opts: [{t: "Dar sitio a gente joven", fx: {"youth": 2, "chem": 1}},{t: "Priorizar experiencia", fx: {"chem": 2, "board": 1}},{t: "Repartir según la carga", fx: {"sfit": 2, "board": 1}}]},{id: "uv_mgr_facility_share", cat: "Instalaciones", title: "Compartir instalaciones con otro club", text: "Un club del entorno propone compartir parte del horario del campo. Puedes aceptar el acuerdo, negociar condiciones o mantener el uso exclusivo.", opts: [{t: "Aceptar el acuerdo", fx: {"bud": 2000, "rep": 1, "fans": 2}},{t: "Negociar condiciones claras", fx: {"bud": 1000, "board": 2}},{t: "Mantener el uso exclusivo", fx: {"sfit": 2, "chem": 1}}]}].forEach(uvRegisterManager);
[{id: "uv_club_audio_desc", cat: "Comunidad", title: "Una narración para el día de partido", text: "Una persona de la grada comenta que no puede seguir el partido con la megafonía actual. Puedes probar una narración sencilla, consultar con una entidad local o dejarlo para más adelante.", opts: [{t: "Probar una narración sencilla", fx: {"bud": -1500, "fans": 2, "rep": 1}},{t: "Consultar con una entidad local", fx: {"fans": 1, "rep": 1}},{t: "Dejarlo para más adelante", fx: {"board": 1}}]},{id: "uv_club_water", cat: "Instalaciones", title: "Agua en los banquillos y la grada", text: "El club estudia instalar puntos de agua reutilizables. Puedes comprar fuentes pequeñas, empezar por el banquillo o esperar al verano.", opts: [{t: "Instalar fuentes pequeñas", fx: {"bud": -2500, "fans": 2, "board": 1}},{t: "Empezar por el banquillo", fx: {"bud": -800, "sfit": 1}},{t: "Esperar al verano", fx: {"board": 1}}]},{id: "uv_club_archive", cat: "Proyecto", title: "Un archivo para la historia del club", text: "Quienes llevan años en el club proponen ordenar fotos y actas antiguas. Puedes dedicar una tarde, buscar ayuda voluntaria o guardarlo para la próxima temporada.", opts: [{t: "Dedicar una tarde al archivo", fx: {"bud": -500, "fans": 1, "rep": 1}},{t: "Buscar ayuda voluntaria", fx: {"fans": 2, "rep": 1}},{t: "Guardarlo para la próxima temporada", fx: {"board": 1}}]},{id: "uv_club_matchday_jobs", cat: "Logística", title: "Repartir las tareas del partido", text: "El día de partido acumula tareas de taquilla, campo y grada. Puedes repartirlas por escrito, buscar voluntariado o mantener el reparto actual.", opts: [{t: "Repartirlas por escrito", fx: {"board": 2, "rep": 1}},{t: "Buscar voluntariado", fx: {"fans": 1, "board": 1}},{t: "Mantener el reparto actual", fx: {"sfit": -1, "board": 1}}]}].forEach(uvRegisterClub);

/* Séptimo bloque: partido, cantera y vida del club en el día a día. */
[{id: "uv_player_throw_in", cat: "Entrenamiento", title: "Un saque de banda para practicar", text: "Un detalle del juego apenas se trabaja en las sesiones. Puedes quedarte a repetirlo, proponerlo al cuerpo técnico o esperar al siguiente entrenamiento.", opts: [{t: "Practicarlo por tu cuenta", fx: {"prof": 2, "fit": -1}},{t: "Proponerlo al cuerpo técnico", fx: {"coach": 2, "prof": 1}},{t: "Esperar al siguiente entrenamiento", fx: {"fit": 1, "mor": 1}}]},{id: "uv_player_post_match", cat: "Prensa", title: "Una publicación después del partido", text: "Después de un resultado ajustado, las redes sociales esperan tu mensaje. Puedes agradecer el apoyo, hablar del trabajo del grupo o esperar un día antes de publicar.", opts: [{t: "Agradecer el apoyo", fx: {"fame": 1, "fans": 2}},{t: "Hablar del trabajo del grupo", fx: {"fans": 1, "mor": 1}},{t: "Esperar un día antes de publicar", fx: {"mor": 1, "form": 1}}]},{id: "uv_player_mentor_young", cat: "Vestuario", title: "Acompañar a una jugadora joven", text: "Una jugadora recién llegada al primer equipo pregunta cómo preparar la semana. Puedes compartir tu rutina, sugerirle hablar con el cuerpo técnico o dejarle espacio.", opts: [{t: "Compartir tu rutina", fx: {"mor": 2, "coach": 1}},{t: "Sugerirle hablar con el cuerpo técnico", fx: {"coach": 2, "mor": 1}},{t: "Dejarle espacio", fx: {"mor": 1, "fit": 1}}]},{id: "uv_player_travel_menu", cat: "Salud", title: "El menú del viaje", text: "El equipo de nutrición propone ajustar el menú del desplazamiento. Puedes probar el menú sugerido, mantener lo que ya te funciona o pedir una alternativa.", opts: [{t: "Probar el menú sugerido", fx: {"fit": 2, "form": 1}},{t: "Mantener lo que ya te funciona", fx: {"mor": 1, "fit": 1}},{t: "Pedir una alternativa", fx: {"fit": 1, "prof": 1}}]}].forEach(uvRegisterPlayer);
[{id: "uv_mgr_cup_week", cat: "Calendario", title: "La copa y la liga en la misma semana", text: "Dos competiciones se cruzan en la misma semana. Puedes rotar en la copa, mantener el bloque o decidir según el rival.", opts: [{t: "Rotar en la copa", fx: {"sfit": 2, "chem": -1}},{t: "Mantener el once de la liga", fx: {"chem": 2, "sfit": -1}},{t: "Decidir según el rival", fx: {"board": 1, "chem": 1}}]},{id: "uv_mgr_referee_meeting", cat: "Dirección deportiva", title: "La reunión con los árbitros", text: "La persona que arbitra propone una reunión previa para repasar criterios. Puedes asistir con el equipo técnico, hacer llegar la información al grupo o delegar en la capitanía.", opts: [{t: "Asistir con el equipo técnico", fx: {"board": 2, "chem": 1}},{t: "Compartir la información con el grupo", fx: {"sqMor": 2, "chem": 1}},{t: "Delegar en la capitanía", fx: {"sqMor": 1, "board": 1}}]},{id: "uv_mgr_supporter_message", cat: "Afición", title: "Un mensaje de la afición", text: "Un grupo de seguidores envía ideas para el próximo partido en casa. Puedes responder con un plan, usar una idea pequeña o agradecer sin comprometerte.", opts: [{t: "Responder con un plan", fx: {"fans": 2, "rep": 1}},{t: "Usar una idea pequeña", fx: {"fans": 1, "board": 1}},{t: "Agradecer sin comprometerte", fx: {"rep": 1, "board": 1}}]},{id: "uv_mgr_second_team", cat: "Cantera", title: "El filial necesita una decisión", text: "El equipo filial pide una orientación sobre qué jugadoras pueden alternar. Puedes fijar un criterio claro, decidir caso por caso o priorizar al primer equipo.", opts: [{t: "Fijar un criterio claro", fx: {"youth": 2, "board": 1}},{t: "Decidir caso por caso", fx: {"sqMor": 1, "youth": 1}},{t: "Priorizar al primer equipo", fx: {"chem": 2, "youth": -1}}]}].forEach(uvRegisterManager);
[{id: "uv_club_mural", cat: "Comunidad", title: "Un mural para la entrada", text: "Una persona del barrio dedicada al arte propone pintar un mural en la entrada del campo. Puedes financiar el material, abrir un concurso de ideas o dejarlo para más adelante.", opts: [{t: "Financiar el material", fx: {"bud": -1800, "fans": 2, "rep": 1}},{t: "Abrir un concurso de ideas", fx: {"fans": 2, "rep": 1}},{t: "Dejar el mural para más adelante", fx: {"board": 1}}]},{id: "uv_club_bike_parking", cat: "Instalaciones", title: "Aparcamiento de bicicletas", text: "Varias familias llegan en bicicleta y no hay dónde dejarlas. Puedes instalar soportes sencillos, buscar apoyo del ayuntamiento o esperar al siguiente presupuesto.", opts: [{t: "Instalar soportes sencillos", fx: {"bud": -1200, "fans": 2, "board": 1}},{t: "Buscar apoyo del ayuntamiento", fx: {"fans": 1, "rep": 1}},{t: "Esperar al próximo presupuesto", fx: {"board": 1}}]},{id: "uv_club_shop", cat: "Proyecto", title: "La tienda del club", text: "La afición pregunta por un punto de venta pequeño en el campo. Puedes montar un puesto en los partidos, buscar una colaboración o vender solo por encargo.", opts: [{t: "Montar un puesto en los partidos", fx: {"bud": -1500, "fans": 2, "board": 1}},{t: "Buscar una tienda colaboradora", fx: {"fans": 1, "rep": 1}},{t: "Vender solo por encargo", fx: {"board": 1}}]},{id: "uv_club_volunteer_day", cat: "Comunidad", title: "Una jornada de mantenimiento", text: "El club organiza una mañana para pintar vallas y ordenar material. Puedes abrirla a las familias, limitarla al personal o contratar parte del trabajo.", opts: [{t: "Abrirla a las familias", fx: {"fans": 2, "rep": 1, "bud": -500}},{t: "Limitarla al personal", fx: {"board": 1, "sfit": 1}},{t: "Contratar parte del trabajo", fx: {"bud": -2000, "board": 2}}]}].forEach(uvRegisterClub);

/* Octavo bloque: últimas rutinas, cantera y vida del club que completan las 108 familias. */
[{id: "uv_player_penalty_routine", cat: "Bienestar", title: "La rutina del penalti", text: "El cuerpo técnico te pide preparar un lanzamiento por si llega el momento. Puedes ensayar una rutina fija, preparar dos variantes o decidir según la sensación del momento.", opts: [{t: "Ensayar una rutina fija", fx: {"mor": 1, "prof": 2}},{t: "Preparar dos variantes", fx: {"prof": 1, "form": 1}},{t: "Decidir según el momento", fx: {"form": 2, "mor": 1}}]},{id: "uv_player_pool_recovery", cat: "Salud", title: "Recuperar en la piscina", text: "El club ofrece una sesión suave en la piscina tras un partido exigente. Puedes aprovecharla, cambiarla por estiramientos o descansar en casa.", opts: [{t: "Aprovechar la sesión de piscina", fx: {"fit": 3, "mor": 1}},{t: "Cambiarla por estiramientos", fx: {"fit": 2, "prof": 1}},{t: "Descansar en casa", fx: {"mor": 2, "fit": 1}}]},{id: "uv_player_tactics_board", cat: "Entrenamiento", title: "Una pizarra con el cuerpo técnico", text: "Antes del partido, el cuerpo técnico abre la pizarra para escuchar ideas del grupo. Puedes proponer un ajuste, preguntar por tu rol o escuchar y tomar notas.", opts: [{t: "Proponer un ajuste concreto", fx: {"coach": 2, "prof": 1}},{t: "Preguntar por tu rol", fx: {"coach": 1, "mor": 1}},{t: "Escuchar y tomar notas", fx: {"prof": 2, "fit": 1}}]},{id: "uv_player_hospital_visit", cat: "Afición", title: "Una visita al hospital", text: "El club organiza una visita breve a un centro cercano. Puedes acompañar al grupo, ayudar a preparar el material o dejar tu sitio a otra persona.", opts: [{t: "Acompañar al grupo", fx: {"mor": 2, "fame": 1}},{t: "Preparar el material", fx: {"coach": 1, "mor": 1}},{t: "Dejar tu sitio a otra persona", fx: {"fit": 1, "mor": 1}}]},{id: "uv_player_contract_talk", cat: "Progreso", title: "Una primera conversación de contrato", text: "Tu representación quiere hablar del futuro con el club. Puedes escuchar la propuesta, pedir tiempo para pensarla o centrarte primero en la temporada.", opts: [{t: "Escuchar la propuesta", fx: {"mor": 1, "prof": 1}},{t: "Pedir tiempo para pensarla", fx: {"mor": 2, "form": 1}},{t: "Centrarte en la temporada", fx: {"form": 2, "fit": 1}}]}].forEach(uvRegisterPlayer);
[{id: "uv_mgr_captain_choice", cat: "Vestuario", title: "Elegir capitanía", text: "La capitanía actual quiere compartir responsabilidades. Puedes confirmar al grupo actual, abrir una votación o elegir a alguien que represente a todo el vestuario.", opts: [{t: "Confirmar la capitanía actual", fx: {"chem": 2, "sqMor": 1}},{t: "Abrir una votación interna", fx: {"sqMor": 2, "chem": 1}},{t: "Elegir una capitanía más amplia", fx: {"chem": 1, "board": 1}}]},{id: "uv_mgr_travel_budget", cat: "Logística", title: "El presupuesto de desplazamientos", text: "La temporada suma más viajes de los previstos. Puedes ajustar los servicios del viaje, buscar transporte compartido o pedir una ampliación a la directiva.", opts: [{t: "Ajustar los servicios del viaje", fx: {"bud": 2500, "sfit": -1}},{t: "Buscar transporte compartido", fx: {"bud": 1500, "sfit": -1}},{t: "Pedir ampliación a la directiva", fx: {"bud": 2000, "board": 1}}]},{id: "uv_mgr_press_youth", cat: "Prensa", title: "Un debut con la prensa", text: "Tras la primera titularidad de una jugadora joven, la prensa pide valoraciones. Puedes protegerla, repartir el mérito con el grupo o explicar su proceso de formación.", opts: [{t: "Protegerla en la comparecencia", fx: {"sqMor": 1, "rep": 1}},{t: "Repartir el mérito con el grupo", fx: {"chem": 2, "sqMor": 1}},{t: "Explicar su proceso de formación", fx: {"rep": 2, "board": 1}}]},{id: "uv_mgr_training_guest", cat: "Cantera", title: "Un entrenamiento con invitadas", text: "Un club vecino pide si dos jugadoras pueden entrenar una sesión contigo. Puedes aceptar sin compromiso, fijar condiciones o declinar por la carga del grupo.", opts: [{t: "Aceptar una sesión abierta", fx: {"youth": 1, "fans": 1}},{t: "Fijar condiciones claras", fx: {"board": 2, "youth": 1}},{t: "Declinar por la carga actual", fx: {"sfit": 1, "chem": 1}}]},{id: "uv_mgr_sports_city", cat: "Instalaciones", title: "El acuerdo con la ciudad deportiva", text: "La ciudad deportiva propone ampliar los horarios disponibles. Puedes aceptar el nuevo horario, negociar un tramo más corto o mantener el actual.", opts: [{t: "Aceptar el nuevo horario", fx: {"sfit": 2, "bud": -1000}},{t: "Negociar un tramo más corto", fx: {"sfit": 1, "bud": -500}},{t: "Mantener el horario actual", fx: {"board": 1, "chem": 1}}]}].forEach(uvRegisterManager);
[{id: "uv_club_photographer", cat: "Proyecto", title: "Una persona para las fotos del club", text: "Las familias piden fotos de los partidos y no hay nadie fijo. Puedes acordar una colaboración voluntaria, pagar unas jornadas o pedir fotos a la afición.", opts: [{t: "Acordar una colaboración voluntaria", fx: {"fans": 2, "rep": 1}},{t: "Pagar unas jornadas de fotos", fx: {"bud": -1200, "fans": 2}},{t: "Pedir fotos a la afición", fx: {"fans": 1, "board": 1}}]},{id: "uv_club_heat_plan", cat: "Instalaciones", title: "Un plan para los días de calor", text: "El verano aprieta y los entrenamientos coinciden con las horas fuertes. Puedes cambiar los horarios, instalar sombra en la grada o repartir agua en los partidos.", opts: [{t: "Cambiar los horarios de entrenamiento", fx: {"sfit": 2, "board": 1}},{t: "Instalar sombra en la grada", fx: {"bud": -2200, "fans": 2}},{t: "Repartir agua en los partidos", fx: {"bud": -600, "fans": 1}}]},{id: "uv_club_local_radio", cat: "Afición", title: "Una entrevista en la radio del barrio", text: "Una emisora local quiere conocer el proyecto. Puedes aceptar una entrevista breve, enviar un resumen escrito o invitarles a un partido.", opts: [{t: "Aceptar una entrevista breve", fx: {"fans": 1, "rep": 2}},{t: "Enviar un resumen escrito", fx: {"rep": 1, "board": 1}},{t: "Invitarles a un partido", fx: {"fans": 2, "rep": 1}}]},{id: "uv_club_supporter_bus", cat: "Logística", title: "Un autobús para la afición", text: "La afición pregunta por un autobús para el desplazamiento más largo. Puedes organizarlo con plaza subvencionada, compartir costes o dejar que se organice por su cuenta.", opts: [{t: "Organizar el autobús con ayuda", fx: {"bud": -2000, "fans": 3}},{t: "Compartir los costes", fx: {"bud": -1000, "fans": 2}},{t: "Dejar que se organice la afición", fx: {"board": 1}}]},{id: "uv_club_girls_team", cat: "Comunidad", title: "Un equipo para las más pequeñas", text: "Familias del barrio preguntan si el club puede formar un equipo de categoría infantil. Puedes abrir un grupo pequeño, buscar una entidad colaboradora o esperar a tener más medios.", opts: [{t: "Abrir un grupo pequeño", fx: {"bud": -2500, "youth": 1, "fans": 2}},{t: "Buscar una entidad colaboradora", fx: {"fans": 2, "rep": 1}},{t: "Esperar a reunir más medios", fx: {"board": 1}}]}].forEach(uvRegisterClub);
