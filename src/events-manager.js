/* ===== DECISIONES DEL ENTRENADOR =====
   Banquillo, vestuario, directiva y mercado. Mismo formato de opciones que las del jugador:
   cada desenlace lleva su probabilidad y sus efectos para enseñarlos antes de decidir. */
var MEVENTS = [], MEV_BY_ID = {}, MGR_MOMENTS = [], MGR_MOM_BY_ID = {};
function MEV(d) { i18nFields(d); MEVENTS.push(d); MEV_BY_ID[d.id] = d; }
function MMO(d) { i18nFields(d); MGR_MOMENTS.push(d); MGR_MOM_BY_ID[d.id] = d; }

/* contexto que ven las decisiones del entrenador */
var Y = {
  cur: null,
  get m() { return S.m; },
  get club() { return clubName(S.m.club); },
  get clubR() { return S.cr[S.m.club]; },
  get li() { return S.cl[S.m.club]; },
  get lg() { var li = S.cl[S.m.club]; return li >= 0 ? W.lg[li].n : ""; },
  get pos() { return posInLeague(S.m.club); },
  get expPos() { var li = S.cl[S.m.club]; return S.L && S.L[li] ? S.L[li].exp.indexOf(S.m.club) + 1 : 0; },
  get inSeason() { return S.ph === "gap" || S.ph === "blk"; },
  get pl() { return Y.cur && Y.cur.pid != null ? mPl(Y.cur.pid) : null; },
  get last() { return S.m.lastBlk || {w: 0, d: 0, l: 0, gf: 0, ga: 0, n: 0}; },
  sd: function (k) {
    var c = Y.cur, base = c && c.s != null ? c.s : hashStr((c && c.id || "y") + "|" + S.tw + "|" + S.yr);
    return hashStr(base + "|" + (k || ""));
  },
  spick: function (arr, k) { return arr && arr.length ? arr[Y.sd(k) % arr.length] : null; },
  star: function () { var a = mActive().slice().sort(function (x, y) { return y.ovr - x.ovr; }); return a[0] || null; },
  giant: function () {
    var me = S.m.club, ci = W.clubs[me].ci;
    var l = clubsWhere(function (c) { return c !== me && W.clubs[c].ci === ci && S.cr[c] >= S.cr[me] + 0.5; }).sort(byRating);
    if (!l.length) l = clubsWhere(function (c) { return c !== me && S.cr[c] >= S.cr[me] + 3; }).sort(byRating).slice(0, 5);
    return l.length ? l[0] : -1;
  },
  money: function (x) { return fmtMoney(x); }
};
function tf(v) { return typeof v === "function" ? v(Y) : v; }
function plDesc(p) { return tr("{name} ({pos}, {age} años, media {ovr}, rol {role}).", {name: plName(p), pos: lcT(posName(p.pos)), age: p.age, ovr: Math.round(p.ovr), role: lcT(tr(ROLES[p.role].n))}); }
function tDesc(t) { return tr("{name} ({pos}, {age} años, media {ovr}, potencial {potMin}–{potMax}).", {name: t.fn + " " + t.ln, pos: lcT(posName(t.pos)), age: t.age, ovr: Math.round(t.ovr), potMin: t.potR[0], potMax: t.potR[1]}); }

/* ============ VESTUARIO Y MOTIVACIÓN ============ */
MEV({id: "m_secador", tipo: "real", cat: "Vestuario", title: "El equipo no reacciona", w: 2.2, cd: 2,
  ref: "Alex Ferguson era famoso por el «secador de pelo»: broncas a gritos a centímetros de la cara del jugador.",
  when: function (y) { var l = y.last; return y.inSeason && l.n >= 4 && l.l >= l.w + 2; },
  text: function (y) { var l = y.last; return tr("{n} derrotas en las últimas semanas y el vestuario parece dormido. Al descanso del último partido ya se te escapó un grito.", {n: l.l}); },
  opts: function () { return [
    {t: tr("Bronca histórica en el vestuario"), p: 0.55,
      ok: {txt: tr("Nadie había visto al míster así. El equipo sale con otra cara."), fx: {buff: {v: 1.5, b: 1, n: tr("Bronca")}, chem: 2}},
      ko: {txt: tr("Algunos pesos pesados se sienten humillados y se cierran en banda."), fx: {sqMor: -6, chem: -6}}},
    {t: tr("Charla tranquila, uno a uno"), ok: {txt: tr("Escuchas a cada jugador. El ambiente se relaja."), fx: {sqMor: 4, chem: 2}}},
    {t: tr("Doble sesión de entrenamiento"), ok: {txt: tr("Castigo físico para todos. Las piernas lo notan, la intensidad también."), fx: {sfit: -10, buff: {v: 0.8, b: 1, n: tr("Intensidad")}}}}
  ]; }});

MEV({id: "m_bota", tipo: "real", cat: "Vestuario", title: "Bronca con tu estrella", w: 1.2, cd: 4,
  ref: "Febrero de 2003: tras caer en la FA Cup, una bota que pateó Ferguson golpeó a Beckham en la ceja. Ese verano Beckham se marchó al Real Madrid.",
  when: function (y) { return y.inSeason && y.last.l >= 2; },
  target: function (y) { var s = y.star(); return s && s.role === "C" && !s.rl ? s.id : null; },
  text: function (y) { return tr("Tras la derrota, {name}, tu jugador más mediático, te discute delante de todos en el vestuario. Hay una bota en el suelo, justo delante de ti.", {name: plName(y.pl)}); },
  opts: function (y) { return [
    {t: tr("Pegarle una patada a la bota de rabia"), out: [
      {p: 0.4, good: true, txt: tr("La bota se estrella contra la pared. El vestuario entiende que va en serio."), fx: {buff: {v: 1, b: 1, n: tr("Mano dura")}, pmor: -8}},
      {p: 0.6, txt: tr("La bota sale volando y le da en la ceja. La foto de la tirita abre los periódicos y la relación queda rota."), fx: {pmor: -30, preq: true, rep: -2, chem: -4}, n: tr("{name} querrá irse", {name: plShort(y.pl)})}]},
    {t: tr("Mandarle a la grada el próximo partido"), ok: {txt: tr("Castigo ejemplar. El resto toma nota."), fx: {psus: 1, pmor: -15, chem: 3, board: 2}}},
    {t: tr("Hablarlo en privado"), p: 0.7,
      ok: {txt: tr("Os decís las cosas a la cara y salís reforzados."), fx: {pmor: 10, chem: 2}},
      ko: {txt: tr("La conversación no arregla nada."), fx: {pmor: -5}}}
  ]; }});

MEV({id: "m_pizza", tipo: "real", cat: "Vestuario", title: "Una apuesta con la defensa", w: 1.6, cd: 3,
  ref: "2015: Claudio Ranieri prometió invitar a pizza a su Leicester si dejaba la portería a cero. Lo cumplieron ante el Crystal Palace y aquella temporada el Leicester ganó la Premier.",
  when: function (y) { var l = y.last; return y.inSeason && l.n >= 4 && l.ga / l.n >= 1.5; },
  text: function (y) { return tr("Encajáis {avg} goles por partido y la defensa está tocada. En el entrenamiento se te ocurre una apuesta con la plantilla.", {avg: fmtDec(y.last.ga / Math.max(1, y.last.n), 1)}); },
  opts: function () { return [
    {t: tr("Pizza para todos si dejáis la portería a cero"), p: 0.6,
      ok: {txt: tr("Lo conseguís a la segunda y acabáis amasando vuestras propias pizzas. Vestuario unido y defensa de hierro."), fx: {chem: 6, sqMor: 4, buff: {v: 1, b: 2, n: tr("Defensa de hierro")}}},
      ko: {txt: tr("No hay manera de dejar la portería a cero. La broma pierde la gracia."), fx: {sqMor: -2}}},
    {t: tr("Sesiones extra de defensa"), ok: {txt: tr("Horas y horas de trabajo defensivo."), fx: {sfit: -8, buff: {v: 0.8, b: 1, n: tr("Trabajo defensivo")}}}},
    {t: tr("Cambiar el sistema"), ok: {txt: tr("Nuevo dibujo, nuevas dudas… y algo más de solidez."), fx: {chem: -4, buff: {v: 0.5, b: 2, n: tr("Nuevo sistema")}}}}
  ]; }});

MEV({id: "m_hechos", tipo: "real", cat: "Prensa", title: "Guerra psicológica", w: 1.3, cd: 3,
  ref: "Enero de 2009: Rafa Benítez leyó en rueda de prensa una lista de «hechos» contra Alex Ferguson. El Manchester United acabó ganando aquella Premier.",
  when: function (y) { return y.inSeason && S.bi >= 2 && y.pos >= 1 && y.pos <= 3 && y.giant() >= 0; },
  text: function (y) { return tr("El entrenador del {club} lleva semanas lanzando indirectas sobre los árbitros y el calendario. Mañana tienes rueda de prensa.", {club: clubName(y.giant())}); },
  opts: function () { return [
    {t: tr("Leer una lista de «hechos» contra él"), p: 0.4,
      ok: {txt: tr("Tu discurso se hace viral y el equipo se siente defendido."), fx: {sqMor: 5, fans: 5, buff: {v: 0.8, b: 1, n: tr("Guerra psicológica")}}},
      ko: {txt: tr("Te convierten en meme y tus jugadores notan la presión."), fx: {sqMor: -5, rep: -3, buff: {v: -0.8, b: 1, n: tr("Presión")}}}},
    {t: tr("No entrar al trapo"), ok: {txt: tr("Sonríes y hablas solo de tu equipo."), fx: {rep: 2, chem: 2}}}
  ]; }});

MEV({id: "m_motin", tipo: "real", cat: "Vestuario", title: "Motín en el vestuario", w: 2, cd: 3,
  ref: "Mundial 2010: los jugadores de Francia se negaron a entrenar en Knysna tras la expulsión de Anelka de la concentración.",
  when: function (y) { return y.inSeason && (y.m.chem < 38 || mAvgMor() < 45); },
  text: function () { return tr("Has apartado a un jugador por indisciplina y el resto de la plantilla amenaza con no entrenar si no vuelve."); },
  opts: function () { return [
    {t: tr("Mantener la sanción"), p: 0.5,
      ok: {txt: tr("El vestuario cede y entiende quién manda."), fx: {board: 5, chem: 4, rep: 2}},
      ko: {txt: tr("Los jugadores se niegan a entrenar y la imagen da la vuelta al mundo."), fx: {chem: -12, sqMor: -10, board: -8, rep: -4}}},
    {t: tr("Perdonar al jugador"), ok: {txt: tr("Paz en el vestuario… a costa de tu autoridad."), fx: {chem: 6, sqMor: 4, board: -6, rep: -2}}},
    {t: tr("Dejar que medie el capitán"), p: 0.7,
      ok: {txt: tr("El capitán reconduce la situación."), fx: {chem: 5, sqMor: 3}},
      ko: {txt: tr("Ni el capitán consigue calmar los ánimos."), fx: {chem: -4}}}
  ]; }});

MEV({id: "m_partido", tipo: "real", cat: "Prensa", title: "¿Candidatos al título?", w: 1.6, cd: 2,
  ref: "Diego Simeone convirtió el «partido a partido» en el lema del Atlético que ganó la Liga 2013/14.",
  when: function (y) { return y.inSeason && S.bi >= 2 && y.pos >= 1 && y.pos <= 2 && y.expPos >= 3; },
  text: function () { return tr("Vais en lo más alto y nadie lo esperaba. La prensa te pregunta si sois candidatos al título."); },
  opts: function () { return [
    {t: tr("«Partido a partido»"), ok: {txt: tr("Cabeza fría. El vestuario no se despista."), fx: {chem: 3, buff: {v: 0.5, b: 2, n: tr("Partido a partido")}}}},
    {t: tr("«Vamos a por la liga»"), p: 0.5,
      ok: {txt: tr("El vestuario se cree el discurso y la afición se ilusiona."), fx: {fans: 8, buff: {v: 1.2, b: 2, n: tr("Ilusión")}}},
      ko: {txt: tr("La presión aprieta y llegan los nervios."), fx: {sqMor: -5, buff: {v: -0.8, b: 1, n: tr("Vértigo")}}}}
  ]; }});

/* ============ TÁCTICA, RIVALES Y JUEGO LIMPIO ============ */
MEV({id: "m_espionaje", tipo: "real", cat: "Táctica", title: "Un espía en el entrenamiento rival", w: 0.8, cd: 4,
  ref: "Enero de 2019: Marcelo Bielsa admitió haber espiado los entrenamientos de sus rivales con el Leeds. La liga inglesa multó al club con 200 000 libras.",
  when: function (y) { return y.inSeason && S.bi >= 1; },
  text: function () { return tr("Un ayudante te propone mandar a alguien a ver el entrenamiento a puerta cerrada de vuestro próximo rival."); },
  opts: function () { return [
    {t: tr("Mandar al espía"), p: 0.5,
      ok: {txt: tr("Conoces su once y su plan antes que sus propios jugadores."), fx: {buff: {v: 1.5, b: 1, n: tr("Información privilegiada")}}},
      ko: {txt: tr("Pillan a tu ayudante con unos prismáticos. Multa y vergüenza pública."), fx: {bud: -250000, board: -8, rep: -5}}},
    {t: tr("Analizar sus vídeos"), ok: {txt: tr("Horas de vídeo. Llegáis preparados."), fx: {buff: {v: 0.5, b: 1, n: tr("Análisis de vídeo")}}}}
  ]; }});

MEV({id: "m_carrera", tipo: "real", cat: "Prensa", title: "Tu carrera por la banda", w: 4, cd: 1,
  ref: "Marzo de 2004: Mourinho recorrió la banda de Old Trafford a la carrera tras el gol del Oporto que eliminó al Manchester United.",
  when: function (y) { return y.inSeason && y.m.flags.lateWinner === S.yr * 10 + S.bi - 1; },
  text: function () { return tr("El vídeo de tu celebración del gol de la victoria en el descuento está por todas partes: saliste corriendo por la banda hasta el córner. La federación estudia multarte."); },
  opts: function () { return [
    {t: tr("Pedir disculpas"), ok: {txt: tr("Disculpas formales y asunto cerrado."), fx: {board: 2, rep: 1}}},
    {t: tr("Decir que lo volverías a hacer"), p: 0.6,
      ok: {txt: tr("La afición te convierte en ídolo."), fx: {fans: 8, rep: 2}},
      ko: {txt: tr("Multa y bronca de la directiva."), fx: {bud: -50000, board: -3, fans: 4}}},
    {t: tr("Reírte en rueda de prensa"), ok: {txt: tr("«Fue el corazón». Titular del día."), fx: {fans: 4}}}
  ]; }});

/* ============ PLANTILLA Y CANTERA ============ */
function veteransToCut() {
  return mActive().filter(function (p) { return p.age >= 29 && (p.role === "C" || p.role === "I"); }).sort(function (a, b) { return b.sal - a.sal; }).slice(0, 2);
}
MEV({id: "m_limpieza", tipo: "real", cat: "Plantilla", ctx: "verano", title: "Veteranos que cobran una fortuna", w: 2.5, once: true,
  ref: "Verano de 2008: Guardiola llegó al banquillo del Barcelona, dio salida a Ronaldinho y Deco y subió a canteranos como Busquets y Pedro.",
  when: function (y) { return S.yr === y.m.since && veteransToCut().length === 2; },
  text: function () { var v = veteransToCut(); return tr("Llegas a un vestuario con dos estrellas veteranas, {name1} y {name2}, que cobran una fortuna y ya no corren como antes. La cantera aprieta desde abajo.", {name1: plName(v[0]), name2: plName(v[1])}); },
  opts: function () { var v = veteransToCut(), fee = v.reduce(function (s, p) { return s + Math.round(pValue(p) * 0.8 / 1e5) * 1e5; }, 0); return [
    {t: tr("Prescindir de los dos"), d: tr("Ingresas unos {fee} por ellos.", {fee: fmtMoney(fee)}), ok: {txt: tr("Cortas por lo sano. La afición duda; la directiva aplaude."), fx: {bud: fee, chem: -4, fans: -6, board: 4, youth: 1}, n: tr("Se van {name1} y {name2}", {name1: plShort(v[0]), name2: plShort(v[1])}),
      then: function () { v.forEach(function (p) { var b = mgrBuyers(p, "lim")[0]; mgrRemovePlayer(p, b ? tr("Vendido al {club}", {club: clubName(b.club)}) : tr("Vendido al extranjero"), b ? b.club : -1, Math.round(pValue(p) * 0.8 / 1e5) * 1e5); }); }}},
    {t: tr("Mantener el bloque"), ok: {txt: tr("Confías en los que ya están. Ellos lo agradecen."), fx: {chem: 4, sqMor: 2}}}
  ]; }});

MEV({id: "m_masia", tipo: "real", cat: "Cantera", title: "Un once de la casa", w: 1.4, cd: 4,
  ref: "Noviembre de 2012: en el campo del Levante, el Barcelona llegó a jugar con once futbolistas formados en La Masia.",
  when: function (y) { return y.inSeason && mActive().filter(function (p) { return p.yth; }).length >= 6; },
  text: function () { return tr("Tienes {n} canteranos en la plantilla. El próximo partido podrías juntar en el campo a un once formado casi entero en casa.", {n: mActive().filter(function (p) { return p.yth; }).length}); },
  opts: function () { return [
    {t: tr("Once de canteranos"), p: 0.55,
      ok: {txt: tr("Ganáis y la imagen de once chicos de la casa da la vuelta al mundo."), fx: {fans: 10, rep: 4, chem: 4}},
      ko: {txt: tr("El experimento sale mal y llueven las críticas."), fx: {board: -5, fans: 2}}},
    {t: tr("Darles minutos poco a poco"), ok: {txt: tr("Sin prisa, pero sin pausa."), fx: {sqMor: 2}}}
  ]; }});

MEV({id: "m_galacticos", tipo: "real", cat: "Mercado", ctx: "verano", title: "El presidente quiere una estrella", w: 1.2, cd: 3,
  ref: "Entre 2000 y 2003 el Real Madrid fichó cada verano a una gran estrella (Figo, Zidane, Ronaldo, Beckham): la era de los «galácticos».",
  when: function (y) { return y.clubR >= 82 && y.m.board >= 55; },
  text: function () { return tr("El presidente quiere un fichaje de relumbrón cada verano. Pone dinero extra sobre la mesa… si fichas a la estrella que él elija."); },
  opts: function (y) { var extra = Math.round(pValue({ovr: Math.min(92, y.clubR + 5), age: 26, pot: 92, yrs: 3}) * 0.9 / 1e6) * 1e6; return [
    {t: tr("Fichar la estrella del presidente"), ok: {txt: tr("La estrella aparece en tu lista de fichajes y el club pone el dinero."), fx: {bud: extra, board: 6, fans: 6, chem: -3}, n: tr("Nueva estrella en el mercado"),
      then: function () { var top = clubsWhere(function (c) { return c !== S.m.club; }).sort(byRating).slice(0, 8), cl = pick(top);
        var t = mgrNewTarget({pos: pick(["DC", "ED", "EI", "MCO"]), age: ri(24, 28), ovr: Math.min(91.5, y.clubR + rf(3, 6)), club: cl, ni: mNat(W.clubs[cl].ci)}); t.int = 90; S.m.mk.list.unshift(t); }}},
    {t: tr("Pedir el dinero para la cantera"), p: 0.4,
      ok: {txt: tr("El presidente acepta a regañadientes."), fx: {youth: 2, board: 2, flag: {youthBoost: 1}}},
      ko: {txt: tr("«O la estrella o nada». No hay dinero."), fx: {board: -6}}},
    {t: tr("Rechazar la idea"), ok: {txt: tr("Prefieres construir un equipo, no un álbum de cromos."), fx: {board: -4, rep: 2}}}
  ]; }});

MEV({id: "m_datos", tipo: "real", cat: "Club", ctx: "verano", title: "Fichar con datos", once: true, w: 1.3,
  ref: "El Brentford, con un modelo de fichajes basado en datos, subió en 2021 a la Premier League 74 años después.",
  when: function (y) { return y.clubR <= 76 && !y.m.flags.data; },
  text: function () { return tr("Un analista te presenta un modelo estadístico que detecta jugadores infravalorados en ligas pequeñas. Montar el departamento cuesta dinero."); },
  opts: function (y) { var cost = Math.max(5e5, Math.round(y.m.bud * 0.06 / 1e5) * 1e5); return [
    {t: tr("Montar el departamento ({cost})", {cost: fmtMoney(cost)}), ok: {txt: tr("Tus informes de fichajes ya no se basan en intuiciones."), fx: {bud: -cost, flag: {data: true}}, n: tr("Fichajes un 10 % más baratos y potencial más preciso")}},
    {t: tr("Seguir con los ojeadores de siempre"), ok: {txt: tr("El ojo del ojeador nunca falla… casi nunca."), fx: {}}}
  ]; }});

MEV({id: "m_debut", tipo: "aleatoria", cat: "Cantera", title: "Una joya pide paso", w: 1.3, cd: 2,
  when: function (y) { return y.inSeason; },
  target: function () { var l = mActive().filter(function (p) { return p.age <= 20 && p.pot >= mSquadAvg() && p.st.apps < 4; }).sort(function (a, b) { return b.pot - a.pot; }); return l.length ? l[0].id : null; },
  text: function (y) { return tr("{name}, tu joya de {age} años, te pide una oportunidad. Su agente amenaza con llevárselo si no debuta pronto.", {name: plName(y.pl), age: y.pl.age}); },
  opts: function (y) { return [
    {t: tr("Hacerle debutar ya"), p: 0.65,
      ok: {txt: tr("Debuta con personalidad. La afición ya tiene nuevo ídolo."), fx: {pmor: 12, povr: 1, fans: 4}},
      ko: {txt: tr("Se le hace grande el partido."), fx: {pmor: -4}}},
    {t: tr("Prometerle minutos en la copa"), ok: {txt: tr("Se conforma de momento."), fx: {pmor: 5}}},
    {t: tr("Pedirle paciencia"), p: 0.5,
      ok: {txt: tr("Lo entiende y sigue trabajando."), fx: {}},
      ko: {txt: tr("Su agente empieza a escuchar ofertas."), fx: {pmor: -10, preq: true}}}
  ]; }});

/* ============ CLUB, DIRECTIVA Y CARRERA ============ */
MEV({id: "m_superliga", tipo: "real", cat: "Club", title: "Tu club entra en una Superliga", once: true, w: 0.8,
  ref: "Abril de 2021: doce grandes clubes anunciaron la Superliga europea. Las protestas de los aficionados la tumbaron en menos de 48 horas.",
  when: function (y) { var li = y.li; return y.inSeason && y.clubR >= 82 && li >= 0 && W.lg[li].conf === "UEFA" && W.lg[li].t === 1; },
  text: function () { return tr("Tu presidente firma la entrada del club en una Superliga cerrada. La afición está en pie de guerra y la prensa quiere saber de qué lado estás."); },
  opts: function () { return [
    {t: tr("Apoyar al presidente"), ok: {txt: tr("Te alineas con la directiva. Dos días después el proyecto se hunde y tus palabras quedan ahí."), fx: {board: 8, fans: -12, rep: -3}, n: tr("La Superliga se cae en 48 horas")}},
    {t: tr("Ponerte del lado de la afición"), ok: {txt: tr("«El fútbol es de la gente». La grada corea tu nombre."), fx: {fans: 12, rep: 4, board: -10}}},
    {t: tr("Ni una palabra"), ok: {txt: tr("Silencio absoluto hasta que pasa la tormenta."), fx: {}}}
  ]; }});

MEV({id: "m_calciopoli", tipo: "real", cat: "Ética", title: "Una llamada que no debería existir", once: true, w: 0.6,
  ref: "2006: el escándalo Calciopoli destapó presiones a los árbitros en Italia. La Juventus perdió dos títulos de liga y bajó a la Serie B.",
  when: function (y) { return y.inSeason && S.bi >= 2; },
  text: function () { return tr("Un directivo te sugiere que el club podría «hablar» con quien designa a los árbitros. «Aquí siempre se ha hecho así», te dice."); },
  opts: function () { return [
    {t: tr("Denunciarlo a la federación"), ok: {txt: tr("Destapas la trama. Ganas prestigio y algún enemigo en el palco."), fx: {rep: 8, board: -10, fans: 4}}},
    {t: tr("Mirar hacia otro lado"), p: 0.6,
      ok: {txt: tr("No vuelves a oír hablar del asunto."), fx: {}},
      ko: {txt: tr("Estalla el escándalo y te salpica por no denunciarlo."), fx: {rep: -8, board: -4}}},
    {t: tr("Aceptar"), p: 0.3,
      ok: {txt: tr("Los arbitrajes empiezan a sonreíros. Nadie dice nada… de momento."), fx: {buff: {v: 1.5, b: 2, n: tr("Arbitrajes amables")}, rep: -2}},
      ko: {txt: tr("Las escuchas salen a la luz: el club pierde puntos y tu nombre queda manchado."), fx: {pts: -12, rep: -25, board: -25, fans: -15}}}
  ]; }});

MEV({id: "m_fuga", tipo: "real", cat: "Vestuario", title: "Tu estrella ya ha firmado con el rival", w: 1.5, once: true,
  ref: "Abril de 2013: un día antes de la semifinal de Champions contra el Real Madrid se supo que Götze dejaría el Dortmund por el Bayern.",
  when: function (y) { return y.inSeason && S.bi >= 3 && y.giant() >= 0; },
  target: function () { var s = Y.star(); return s && s.role === "C" && s.age <= 27 && !s.leaveTo ? s.id : null; },
  text: function (y) { return tr("A un día de un partido decisivo se filtra que {name} ya ha firmado con el {club} para la próxima temporada. Pagan su cláusula.", {name: plName(y.pl), club: clubName(y.giant())}); },
  opts: function (y) {
    var g = y.giant(), fee = Math.round(pValue(y.pl) * 1.2 / 1e5) * 1e5, pl = y.pl;
    var go = function () { pl.leaveTo = {club: g, fee: fee}; };
    return [
      {t: tr("Mantenerle en el once"), p: 0.6,
        ok: {txt: tr("Juega como si nada y se despide dándolo todo."), fx: {pmor: 2}, n: tr("Se irá en verano por {fee}", {fee: fmtMoney(fee)}), then: go},
        ko: {txt: tr("La grada le pita y el equipo lo nota."), fx: {chem: -6, sqMor: -4}, n: tr("Se irá en verano por {fee}", {fee: fmtMoney(fee)}), then: go}},
      {t: tr("Apartarle hasta final de temporada"), ok: {txt: tr("Fuera del equipo. El vestuario cierra filas."), fx: {pmor: -25, chem: 3, fans: 3, prole: "S"}, n: tr("Se irá en verano por {fee}", {fee: fmtMoney(fee)}), then: go}},
      {t: tr("Intentar convencerle"), p: 0.15,
        ok: {txt: tr("¡Rompe el acuerdo y se queda! La afición enloquece."), fx: {fans: 10, pmor: 10}},
        ko: {txt: tr("Ya no hay vuelta atrás."), fx: {pmor: -5}, n: tr("Se irá en verano por {fee}", {fee: fmtMoney(fee)}), then: go}}
    ];
  }});

MEV({id: "m_dudas", tipo: "real", cat: "Directiva", title: "La directiva duda", w: 3, cd: 2,
  ref: "Noviembre de 2012: el Chelsea despidió a Roberto Di Matteo seis meses después de que ganara la Champions.",
  when: function (y) { return y.inSeason && y.m.board < 32 && y.m.trophies.some(function (t) { return t.w >= 5 && t.club === y.m.club && S.yr - t.y <= 1; }); },
  text: function () { return tr("Hace nada levantaste un título importante, pero tras una mala racha la directiva empieza a dudar de ti."); },
  opts: function (y) { return [
    {t: tr("Pedir tiempo y confianza"), p: 0.5,
      ok: {txt: tr("El presidente te respalda en público."), fx: {board: 15}},
      ko: {txt: tr("Te dan una semana. Y una sonrisa forzada."), fx: {board: -6}}},
    {t: tr("Exigir refuerzos en público"), p: 0.35,
      ok: {txt: tr("La presión funciona: dinero extra para el mercado."), fx: {bud: Math.round(mBudgetFor(y.m.club) * 0.25 / 1e5) * 1e5, board: 4}},
      ko: {txt: tr("Al presidente no le gusta que le presionen."), fx: {board: -12}}},
    {t: tr("Cambios radicales en el once"), ok: {txt: tr("Sacudes el árbol."), fx: {chem: -8, buff: {v: 1, b: 1, n: tr("Revulsivo")}}}}
  ]; }});

MEV({id: "m_cima", tipo: "real", cat: "Futuro", manual: true, title: "¿Irte en lo más alto?",
  ref: "Mayo de 2018: cinco días después de ganar su tercera Champions seguida, Zidane dimitió como entrenador del Real Madrid.",
  text: function (y) { var tn = y.cur && y.cur.tn; return tn ? tr("Acabas de ganar {trophy}. Estás en lo más alto y te preguntas si no sería el mejor momento para irte.", {trophy: trComp(tn)}) : tr("Acabas de ganar un gran título. Estás en lo más alto y te preguntas si no sería el mejor momento para irte."); },
  opts: function () { return [
    {t: tr("Dimitir en lo más alto"), ok: {txt: tr("Te despides entre lágrimas. Te lloverán ofertas."), fx: {rep: 6, fans: 5}, n: tr("Eliges nuevo banquillo"),
      then: function () { var list = mgrJobOffers(false, true); if (list.length < 2) list = list.concat(mgrJobOffers(false, false).filter(function (o) { return !list.some(function (q) { return q.club === o.club; }); })).slice(0, 4); S.m.lastClub = S.m.club; mgrLeaveClub(); S.pend = S.pend.filter(function (q) { return q.k !== "jobs"; }); S.pend.unshift(mp("jobs", {list: list, forced: true})); }}},
    {t: tr("Seguir y a por más"), ok: {txt: tr("El hambre no se acaba."), fx: {board: 6, chem: 3}}}
  ]; }});
MEV_BY_ID.m_zidane = MEV_BY_ID.m_cima;

MEV({id: "m_clough", tipo: "real", cat: "Vestuario", manual: true, title: "Tu primer discurso",
  ref: "1974: Brian Clough llegó al Leeds, vigente campeón, criticando el juego de sus propios jugadores. Le destituyeron a los 44 días.",
  text: function (y) { return tr("Primer día en el {club}. El vestuario tiene veteranos acostumbrados a ganar. ¿Cómo empiezas?", {club: y.club}); },
  opts: function () { return [
    {t: tr("Decirles que sus títulos no valen nada"), p: 0.3,
      ok: {txt: tr("El golpe de autoridad funciona: todos corren como el primer día."), fx: {buff: {v: 1.5, b: 2, n: tr("Nueva era")}, chem: 2}},
      ko: {txt: tr("Los veteranos se rebelan y la directiva toma nota."), fx: {chem: -15, board: -15, sqMor: -8}}},
    {t: tr("Respetar la jerarquía"), ok: {txt: tr("Te ganas a los pesos pesados."), fx: {chem: 6}}},
    {t: tr("Reuniones uno a uno"), ok: {txt: tr("Conoces a cada jugador por su nombre y su historia."), fx: {sqMor: 5}}}
  ]; }});

MEV({id: "m_retiro", tipo: "real", cat: "Futuro", manual: true, noClub: true, title: "¿Una temporada más?",
  ref: "Alex Ferguson anunció que se retiraría en 2002, cambió de idea en febrero de ese año y siguió en el banquillo once temporadas más.",
  text: function (y) { return tr("Tienes {age} años y toda una vida en los banquillos. ¿Sigues una temporada más?", {age: y.m.age}); },
  opts: function () { return [
    {t: tr("Una temporada más"), ok: {txt: tr("Todavía te queda gasolina."), fx: {}}},
    {t: tr("Retirarte"), ok: {txt: tr("Te despides de los banquillos. Toca repasar tu legado."), fx: {}, n: tr("Fin de tu carrera de entrenador"), then: function () { mgrRetire(); }}}
  ]; }});

/* ============ MORAL Y DISCIPLINA ============ */
MEV({id: "m_peticion", tipo: "real", cat: "Vestuario", manual: true, title: "Quiere irse",
  text: function (y) { return tr("{name} ha pedido salir del club. Dice que no se siente valorado y su agente ya está moviendo su nombre.", {name: plName(y.pl)}); },
  opts: function (y) { var p = y.pl, base = clamp(0.35 + (p.mor - 25) / 100, 0.15, 0.7); return [
    {t: tr("Ponerle en el mercado"), ok: {txt: tr("Le dices que escucharás ofertas."), fx: {plist: true, pmor: 4}, n: tr("Llegarán ofertas en el próximo mercado")}},
    {t: tr("Convencerle de que se quede"), p: base,
      ok: {txt: tr("Una charla larga y sincera. Se queda con ganas."), fx: {pmor: 18, preq: false}},
      ko: {txt: tr("No le convences."), fx: {pmor: -5, chem: -3}}},
    {t: tr("Prometerle el rol de Clave"), p: 0.75, dis: p.role === "C" ? tr("Ya es jugador Clave") : null,
      ok: {txt: tr("Acepta el reto y se olvida de irse."), fx: {prole: "C", pmor: 20, preq: false}, then: function () { p.prom = "C"; }},
      ko: {txt: tr("No se fía de tus promesas."), fx: {pmor: -6}}},
    {t: tr("Ignorarle"), ok: {good: false, txt: tr("El ambiente se enrarece."), fx: {chem: -4, pmor: -6}}}
  ]; }});

MEV({id: "m_fiesta", tipo: "aleatoria", cat: "Disciplina", title: "Fiesta a destiempo", w: 1.1, cd: 2,
  when: function (y) { return y.inSeason; },
  target: function () { var l = mActive().filter(function (p) { return p.age <= 30 && p.age >= 19 && !p.rl; }); var f = l.filter(function (p) { return p.tr === "fiestero"; }); return (f.length ? Y.spick(f, "f") : Y.spick(l, "f2") || {}).id; },
  text: function (y) { return tr("Dos de tus jugadores, entre ellos {name}, aparecen en un vídeo de fiesta a las cuatro de la mañana, dos días antes de un partido.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Multarles y apartarles un partido"), ok: {txt: tr("Mano dura. El resto entiende el mensaje."), fx: {psus: 1, pmor: -10, board: 3, chem: 2}}},
    {t: tr("Charla en privado"), p: 0.6,
      ok: {txt: tr("Lo reconocen y piden perdón al grupo."), fx: {pmor: 4}},
      ko: {txt: tr("El vestuario ve que no pasa nada y se relaja."), fx: {chem: -4}}},
    {t: tr("Hacer la vista gorda"), ok: {good: false, txt: tr("Mal precedente."), fx: {chem: -5, board: -3}}}
  ]; }});

MEV({id: "m_lesion", tipo: "aleatoria", cat: "Médico", title: "Acelerar una recuperación", w: 1.4, cd: 1,
  when: function (y) { return y.inSeason; },
  target: function () { var l = mActive().filter(function (p) { return p.inj > S.tw + 3 && (p.role === "C" || p.role === "I"); }).sort(function (a, b) { return b.ovr - a.ovr; }); return l.length ? l[0].id : null; },
  text: function (y) { var p = y.pl; return trn(p.inj - S.tw, "{name} está de baja ({inj}, {n} semana). El preparador cree que con un tratamiento agresivo podría volver antes.", "{name} está de baja ({inj}, {n} semanas). El preparador cree que con un tratamiento agresivo podría volver antes.", {name: plName(p), inj: lcT((p.injN ? tr(p.injN) : tr("lesión")))}); },
  opts: function (y) { var p = y.pl; return [
    {t: tr("Acelerar la recuperación"), p: 0.6,
      ok: {txt: tr("Vuelve antes de lo previsto."), fx: {pmor: 4}, n: tr("Vuelve un 40 % antes"), then: function () { p.inj = S.tw + Math.max(0, Math.round((p.inj - S.tw) * 0.6)); }},
      ko: {txt: tr("Recaída: más tiempo fuera."), fx: {pmor: -5}, n: tr("Dos semanas más de baja"), then: function () { p.inj += 2; }}},
    {t: tr("Respetar los plazos"), ok: {txt: tr("Paciencia. Volverá cuando esté al cien por cien."), fx: {pmor: 2}}}
  ]; }});

MEV({id: "m_prensa", tipo: "aleatoria", cat: "Prensa", title: "La prensa señala a un jugador", w: 1.2, cd: 1,
  when: function (y) { return y.inSeason; },
  target: function () { var l = mActive().filter(function (p) { return p.form < 46 && (p.role === "C" || p.role === "I"); }); return l.length ? Y.spick(l, "pr").id : null; },
  text: function (y) { return tr("La prensa se ceba con {name} tras varios partidos flojos. Te preguntan si seguirá en el once.", {name: plName(y.pl)}); },
  opts: function () { return [
    {t: tr("Defenderle sin dudar"), p: 0.7,
      ok: {txt: tr("Se siente respaldado y responde."), fx: {pmor: 10, chem: 2}},
      ko: {txt: tr("Le defiendes… y sigue sin dar una. La grada se impacienta."), fx: {pmor: 4, fans: -4}}},
    {t: tr("Mandarle un aviso: tiene que mejorar"), p: 0.5,
      ok: {txt: tr("Se pica y responde en el campo."), fx: {pmor: 4, povr: 0.5}},
      ko: {txt: tr("Se siente señalado en público."), fx: {pmor: -12}}},
    {t: tr("Cambiar de tema"), ok: {txt: tr("Sin titulares."), fx: {}}}
  ]; }});

MEV({id: "m_gira", tipo: "aleatoria", cat: "Club", ctx: "verano", title: "Gira de pretemporada", w: 1.2, cd: 1,
  when: function (y) { return y.clubR >= 70; },
  text: function () { return tr("El departamento comercial ha cerrado una gira de pretemporada por Asia y Estados Unidos. Mucho dinero y muchos aviones."); },
  opts: function (y) { var x = Math.round(1e6 * Math.exp((y.clubR - 70) / 10) / 1e5) * 1e5; return [
    {t: tr("Hacer la gira completa"), ok: {txt: tr("Estadios llenos y cuentas saneadas. Los jugadores vuelven agotados."), fx: {bud: x, sfit: -10, fans: 3}}},
    {t: tr("Gira corta"), ok: {txt: tr("Un par de amistosos y vuelta a casa."), fx: {bud: Math.round(x / 3 / 1e5) * 1e5}}},
    {t: tr("Pretemporada en casa"), ok: {txt: tr("Trabajo táctico sin prisas."), fx: {chem: 4, sfit: 4}}}
  ]; }});

MEV({id: "m_tope", tipo: "real", cat: "Directiva", title: "La masa salarial se dispara", w: 4, cd: 1,
  when: function (y) { return y.m.mk.open && mWageBill() > y.m.wcap * 1.05; },
  text: function (y) { return tr("La masa salarial está en {bill} para un tope de {cap}. La directiva te exige vender antes de que cierre el mercado.", {bill: fmtMoney(mWageBill()), cap: fmtMoney(y.m.wcap)}); },
  opts: function (y) {
    var top = mActive().slice().sort(function (a, b) { return b.sal - a.sal; })[0], b = top ? mgrBuyers(top, "tope")[0] : null;
    return [
      {t: top ? tr("Vender al que más cobra ({name})", {name: plShort(top)}) : tr("Vender al que más cobra"), dis: b ? null : tr("Nadie puede pagarle"), ok: {txt: tr("Sale el sueldo más alto del vestuario."), fx: {bud: b ? b.fee : 0, board: 6, fans: -4, chem: -3},
        then: function () { if (top && b) mgrRemovePlayer(top, tr("Vendido al {club}", {club: clubName(b.club)}), b.club, b.fee); }}},
      {t: tr("Convencer a la directiva"), p: 0.4,
        ok: {txt: tr("Te suben el tope salarial."), fx: {wcap: 1.12, board: -2}},
        ko: {txt: tr("No cuela. La directiva pierde la paciencia."), fx: {board: -10}}},
      {t: tr("Rebajarte tú el sueldo"), ok: {txt: tr("Predicas con el ejemplo."), fx: {board: 4, wcap: 1.04}, then: function () { S.m.sal = Math.round(S.m.sal * 0.8 / 1000) * 1000; }}}
    ];
  }});

MEV({id: "m_libre", tipo: "aleatoria", cat: "Mercado", title: "Un agente libre se ofrece", w: 3, cd: 1,
  when: function (y) { return !!y.m.mk.open && mActive().filter(function (p) { return p.inj > S.tw; }).length >= 3; },
  prep: function (y) { var pos = pick(POS_ORDER.filter(function (p) { return p !== "POR"; })); var nm = mName(mNat(W.clubs[y.m.club].ci)); return {fa: {fn: nm.fn, ln: nm.ln, pos: pos, age: ri(28, 33), ovr: round1(clamp(y.clubR - rf(2, 6), 45, 90)), nat: W.clubs[y.m.club].ci}}; },
  text: function (y) { var a = y.cur.fa; return tr("Con media plantilla en la enfermería, el agente de un jugador sin equipo te ofrece a su representado: {name}, {pos}, {age} años, media {ovr}.", {name: a.fn + " " + a.ln, pos: lcT(posName(a.pos)), age: a.age, ovr: Math.round(a.ovr)}); },
  opts: function (y) { var a = y.cur.fa, sal = Math.round(mWageFor({ovr: a.ovr, age: a.age}, y.m.club, "R") / 1000) * 1000; return [
    {t: tr("Ficharle ({sal}/año)", {sal: fmtMoney(sal)}), ok: {txt: tr("Firma por una temporada. Llega en forma."), fx: {}, n: tr("Contrato de un año"),
      then: function () { var t = {fn: a.fn, ln: a.ln, pos: a.pos, ovr: a.ovr, pot: a.ovr, age: a.age, nat: a.nat, yrsD: 1, club: -1, tr: null}; mgrSign(t, 0, sal, "R", false); }}},
    {t: tr("No hace falta"), ok: {txt: tr("Te arreglarás con lo que tienes."), fx: {}}}
  ]; }});

/* ============ MOMENTOS DESDE LA BANDA ============ */
function mmTakers(c) { return c.xi.filter(function (p) { return p.id !== c.f.redId && p.pos !== "POR"; }).sort(function (a, b) { return penScore(b) - penScore(a); }).slice(0, 3); }
function penScore(p) { return p.ovr + ({DC: 6, MCO: 5, ED: 4, EI: 4, MC: 3, MD: 2, MI: 2, MCD: 0, DFC: -2, LD: -1, LI: -1}[p.pos] || 0) + (p.tr === "lider" ? 2 : 0); }
function penP(p) { return clamp(0.6 + (penScore(p) - 72) * 0.006 + (p.mor - 60) / 500, 0.45, 0.92); }
function scoreTxtM(c) { return c.sc[0] > c.sc[1] ? tr("Ganáis {a}-{b}", {a: c.sc[0], b: c.sc[1]}) : c.sc[0] < c.sc[1] ? tr("Perdéis {a}-{b}", {a: c.sc[0], b: c.sc[1]}) : tr("Empate a {a}", {a: c.sc[0]}); }

MMO({id: "mm_descanso", title: "Descanso: vais perdiendo", w: 2.4,
  minute: function () { return 45; },
  whenAt: function (f, sc) { return sc[0] < sc[1]; },
  text: function (c) { return tr("Descanso. {score} ante el {opp}. El vestuario está en silencio y todos te miran.", {score: scoreTxtM(c), opp: c.opp}); },
  opts: function () { return [
    {t: tr("Doble cambio ofensivo"), out: [
      {p: 0.4, good: true, txt: tr("Los cambios revolucionan el partido: ¡gol!"), goal: 1},
      {p: 0.35, good: true, txt: tr("Mejoráis mucho, aunque sin premio."), fx: {}},
      {p: 0.25, txt: tr("Os pillan a la contra con el equipo partido."), concede: 1}]},
    {t: tr("Bronca en el vestuario"), p: 0.5,
      ok: {txt: tr("Salís como un huracán y marcáis enseguida."), goal: 1},
      ko: {txt: tr("El grito no surte efecto y algunos agachan la cabeza."), fx: {sqMor: -3}}},
    {t: tr("Mantener el plan"), ok: {txt: tr("Confías en tu idea. El partido sigue su curso."), fx: {}}}
  ]; }});

MMO({id: "mm_ventaja", title: "Ganáis por la mínima", w: 2.2,
  minute: function () { return ri(72, 78); },
  whenAt: function (f, sc) { return sc[0] - sc[1] === 1; },
  text: function (c) { return tr("Minuto {min}. {score} y el {opp} empieza a apretar.", {min: c.min, score: scoreTxtM(c), opp: c.opp}); },
  opts: function () { return [
    {t: tr("Meter un central más y cerrar"), p: 0.75,
      ok: {txt: tr("Cerráis el partido con oficio."), lock: true},
      ko: {txt: tr("Os encierran y llega el empate en un balón parado."), lock: true, concede: 1}},
    {t: tr("Buscar el segundo"), out: [
      {p: 0.35, good: true, txt: tr("¡Llega el segundo! Partido sentenciado."), lock: true, goal: 1},
      {p: 0.4, good: true, txt: tr("Lo intentáis sin suerte, pero aguantáis."), lock: true},
      {p: 0.25, txt: tr("Os pillan a la contra: empate."), lock: true, concede: 1}]},
    {t: tr("Perder tiempo con los cambios"), p: 0.8,
      ok: {txt: tr("Tres cambios en el descuento y el reloj vuela."), lock: true},
      ko: {txt: tr("El árbitro añade siete minutos y os empatan."), lock: true, concede: 1}}
  ]; }});

MMO({id: "mm_empate", title: "A la desesperada", w: 2.2,
  minute: function () { return ri(80, 84); },
  whenAt: function (f, sc) { return sc[1] - sc[0] === 1; },
  text: function (c) { return tr("Minuto {min}. {score}. Queda poco y necesitáis un gol.", {min: c.min, score: scoreTxtM(c)}); },
  opts: function () { return [
    {t: tr("Todos arriba, también el portero en los córners"), out: [
      {p: 0.26, good: true, txt: tr("¡Gol en el último suspiro!"), lock: true, goal: 1},
      {p: 0.44, txt: tr("No llega el empate."), lock: true},
      {p: 0.3, txt: tr("Contra a portería vacía: os hacen otro."), lock: true, concede: 1}]},
    {t: tr("Balones largos al delantero"), p: 0.22,
      ok: {txt: tr("Un balón dividido, una prolongación… ¡y gol!"), lock: true, goal: 1},
      ko: {txt: tr("Ni un remate claro."), lock: true}},
    {t: tr("Aceptar la derrota y reservar fuerzas"), ok: {good: false, txt: tr("Cambias a los titulares pensando en el siguiente partido."), lock: true, fx: {sfit: 4}}}
  ]; }});

MMO({id: "mm_diez", title: "Os quedáis con diez", w: 1.4,
  minute: function () { return ri(30, 62); },
  pick: function (f) { var l = f.xi.filter(function (id) { var p = mPl(id); return p && p.pos !== "POR"; }); return l.length ? pick(l) : null; },
  text: function (c) { return tr("Minuto {min}. Roja directa para {name}. {score} y queda mucho partido.", {min: c.min, name: plName(c.pl), score: scoreTxtM(c)}); },
  opts: function () { return [
    {t: tr("Sacrificar un delantero y cerrar líneas"), p: 0.6,
      ok: {txt: tr("Aguantáis el chaparrón con diez."), red: true},
      ko: {txt: tr("Al final la superioridad del rival se nota."), red: true, concede: 1}},
    {t: tr("Mantener el dibujo"), out: [
      {p: 0.2, good: true, txt: tr("¡Golazo con diez! El estadio ruge."), red: true, goal: 1},
      {p: 0.35, good: true, txt: tr("Aguantáis sin cambiar nada."), red: true},
      {p: 0.45, txt: tr("Os pasan por encima con uno más."), red: true, concede: 1}]}
  ]; }});

MMO({id: "mm_penalti", title: "Penalti a favor", w: 1.6,
  minute: function () { return ri(15, 88); },
  text: function (c) { return tr("Minuto {min}. Penalti a favor. {score}. ¿Quién lo tira?", {min: c.min, score: scoreTxtM(c)}); },
  opts: function (c) { return mmTakers(c).map(function (p, i) {
    return {t: plName(p), d: i === 0 ? tr("{pos} · media {ovr} · tu especialista", {pos: posName(p.pos), ovr: Math.round(p.ovr)}) : tr("{pos} · media {ovr}", {pos: posName(p.pos), ovr: Math.round(p.ovr)}), p: penP(p), pid: p.id, badge: tr("Marca"),
      ok: {txt: tr("{name} no perdona.", {name: plShort(p)}), goal: 1, scorer: p.id, fx: {pmor: 3}},
      ko: {txt: tr("Lo para el portero. {name} se lleva las manos a la cabeza.", {name: plShort(p)}), fx: {pmor: -6}}};
  }); }});

MMO({id: "mm_corner", title: "Defensa despistada", w: 0.8,
  ref: "7 de mayo de 2019: Alexander-Arnold sacó un córner rápido aprovechando un despiste del Barcelona y Origi marcó el 4-0 de la remontada de Anfield.",
  minute: function () { return ri(20, 85); },
  text: function (c) { return tr("Minuto {min}. Córner a favor y la defensa del {opp} está protestando, de espaldas. Tu ayudante te mira.", {min: c.min, opp: c.opp}); },
  opts: function () { return [
    {t: tr("¡Que lo saquen rápido!"), p: 0.3, ok: {txt: tr("Saque en corto, centro al primer palo y gol. Nadie se lo esperaba."), goal: 1}, ko: {txt: tr("El árbitro lo hace repetir."), fx: {}}},
    {t: tr("Que suban los centrales"), p: 0.14, ok: {txt: tr("Cabezazo de tu central a la red."), goal: 1}, ko: {txt: tr("Despeja la defensa."), fx: {}}}
  ]; }});

MMO({id: "mm_fairplay", title: "Gol con un rival en el suelo", w: 0.5,
  ref: "Abril de 2019: Bielsa ordenó al Leeds dejarse empatar tras marcar con un rival lesionado en el suelo. Recibió el premio Fair Play de la FIFA.",
  minute: function () { return ri(55, 85); },
  text: function (c) { return tr("Minuto {min}. Tu equipo marca mientras un jugador del {opp} estaba tendido en el suelo. Sus jugadores protestan y se monta una tangana.", {min: c.min, opp: c.opp}); },
  opts: function () { return [
    {t: tr("Ordenar que les dejen empatar"), ok: {txt: tr("Tus jugadores se apartan y el rival empata. El fútbol entero te aplaude."), goal: 1, concede: 1, fx: {rep: 6, fans: 2}}},
    {t: tr("Mantener el gol"), out: [
      {p: 0.65, good: true, txt: tr("El gol sube al marcador y el partido sigue entre pitos."), goal: 1, fx: {rep: -1}},
      {p: 0.35, txt: tr("La tangana acaba con un expulsado de los tuyos."), goal: 1, red2: true, fx: {rep: -2}}]}
  ]; }});

MMO({id: "mm_lesion", title: "Tu estrella se resiente", w: 1.2,
  minute: function () { return ri(25, 40); },
  pick: function (f) { var l = f.xi.map(mPl).filter(Boolean).sort(function (a, b) { return b.ovr - a.ovr; }); return l.length ? l[0].id : null; },
  text: function (c) { return tr("Minuto {min}. {name} se toca el muslo y te hace un gesto: nota algo raro.", {min: c.min, name: plName(c.pl)}); },
  opts: function () { return [
    {t: tr("Cambiarle ya"), ok: {txt: tr("Sale por precaución. Mejor así."), off: true}},
    {t: tr("Que aguante hasta el descanso"), p: 0.6,
      ok: {txt: tr("Aguanta y no pasa nada."), fx: {}},
      ko: {txt: tr("Rotura muscular: semanas fuera."), off: true, fx: {pinj: [3, 8]}}}
  ]; }});

/* ---------- planteamiento de los partidos grandes ---------- */
function mgrPlanOpts(f) {
  var mk = function (ment, t, d, ref) {
    var L = mLambdas(f, ment), q = wdl(L[0], L[1]);
    return {t: t, d: d, ref: ref, ment: ment, badge: tr("Victoria"),
      out: [{p: q[0], good: true, lab: tr("Victoria")}, {p: q[1], neu: true, lab: tr("Empate")}, {p: q[2], lab: tr("Derrota")}],
      ok: {txt: tr("Planteamiento elegido: {plan}.", {plan: lcT(t)})}};
  };
  return [
    mk("bus", tr("Aparcar el autobús"), tr("Todos atrás y a la contra: pocos goles en las dos porterías."), tr("Abril de 2010: el Inter de Mourinho se encerró en el Camp Nou con diez jugadores, perdió 1-0 y aun así eliminó al Barcelona.")),
    mk(1, tr("Equilibrado"), tr("Tu idea de siempre.")),
    mk("press", tr("Presión alta"), tr("A por ellos desde el primer minuto: más ocasiones para los dos."), tr("Mayo de 2019: el Liverpool de Klopp remontó un 3-0 al Barcelona con una presión asfixiante en Anfield."))
  ];
}
function mgrBoard(f, min, sc) {
  var us = W.clubs[S.m.club].ab, op = W.clubs[f.opp].ab;
  return {min: min, l: f.home ? [us, sc[0]] : [op, sc[1]], r: f.home ? [op, sc[1]] : [us, sc[0]]};
}
function mgrMomLabel(f) { return compShort(f) + (roundLabel(f) ? " · " + roundLabel(f) : "") + " · " + tr("vs {club}", {club: clubName(f.opp)}); }
function mgrRunShootout(f, ok) {
  var a = 0, b = 0, my = 0.76, taken = false;
  for (var i = 0; i < 5; i++) {
    if (i === 4) { taken = true; if (ok) a++; } else if (chance(my)) a++;
    if (chance(my)) b++;
    var left = 4 - i;
    if (i < 4 && (a + left < b || b + left < a)) break;
  }
  var g = 0;
  while (a === b && g++ < 20) { if (chance(my)) a++; if (chance(my)) b++; }
  if (a === b) a++;
  f.pens = [a, b];
  return {a: a, b: b, taken: taken};
}

/* ---------- manejadores de decisiones del entrenador ---------- */
var MPH = {
  mev: {
    head: function (x) { var ev = MEV_BY_ID[x.id], real = ev.tipo === "real";
      return {tag: real ? "real" : "rand", tagTxt: real ? tr("Decisión de banquillo") : tr("Imprevisto"), cls: real ? "" : "randc", cat: ev.cat, title: tf(ev.title), text: ev.text(Y), ref: ev.ref ? tf(ev.ref) : null}; },
    opts: function (x) { return MEV_BY_ID[x.id].opts(Y); }
  },
  mmom: {
    head: function (x) { var f = S.cur.pm[x.fi], c = mgrMomCtx(f), mm = MGR_MOM_BY_ID[x.id];
      return {tag: "hot", tagTxt: tr("Desde la banda"), cls: "hotc", hot: true, cat: c.comp + (c.rn ? " · " + c.rn : ""), ctxTxt: mgrMomLabel(f), title: mm.title, text: mm.text(c), ref: mm.ref || null, board: mgrBoard(f, c.min + "'", c.sc)}; },
    opts: function (x) { return MGR_MOM_BY_ID[x.id].opts(mgrMomCtx(S.cur.pm[x.fi])); },
    apply: function (x, o, res) { var f = S.cur.pm[x.fi], fxc = mgrApplyMoment(f, Object.assign({}, res, {scorer: res.scorer})); return mgrPreview({goal: res.goal, concede: res.concede, red: res.red, red2: res.red2, lock: res.lock}, f.mom ? f.mom.pid : null).concat(fxc); }
  },
  mplan: {
    fixed: true,
    head: function (x) { var f = S.cur.pm[x.fi];
      return {tag: "hot", tagTxt: tr("Pizarra"), cls: "hotc", hot: true, cat: compShort(f) + (roundLabel(f) ? " · " + roundLabel(f) : ""), ctxTxt: mgrMomLabel(f), title: tr("¿Cómo planteas el partido?"),
        text: f.fin ? tr("Final contra el {opp}. Tu once llega con un nivel de {a} frente a {b}. Los porcentajes salen del modelo de partido del juego.", {opp: clubName(f.opp), a: Math.round(f.tr), b: Math.round(f.or)}) : tr("Partido grande contra el {opp}. Tu once llega con un nivel de {a} frente a {b}. Los porcentajes salen del modelo de partido del juego.", {opp: clubName(f.opp), a: Math.round(f.tr), b: Math.round(f.or)}), board: mgrBoard(f, "0'", [0, 0])}; },
    opts: function (x) { return mgrPlanOpts(S.cur.pm[x.fi]); },
    apply: function (x, o) { S.cur.pm[x.fi].ment = o.ment; return []; }
  },
  mso: {
    head: function (x) { var f = S.cur.pm[x.fi], sc = [f.gu + (f.etu || 0), f.gt + (f.ett || 0)];
      return {tag: "hot", tagTxt: tr("Desde la banda"), cls: "hotc", hot: true, cat: compShort(f) + (roundLabel(f) ? " · " + roundLabel(f) : ""), ctxTxt: mgrMomLabel(f), title: tr("Tanda de penaltis"),
        text: tr("Empate tras la prórroga. Los cuatro primeros lanzadores están decididos: ¿quién tira el quinto, el que puede valer la eliminatoria?"), board: mgrBoard(f, tr("PEN"), sc)}; },
    opts: function (x) { var f = S.cur.pm[x.fi], c = mgrMomCtx(f); return mmTakers(c).map(function (p) {
      return {t: plName(p), d: tr("{pos} · media {ovr}", {pos: posName(p.pos), ovr: Math.round(p.ovr)}), p: penP(p), pid: p.id, badge: tr("Marca"),
        ok: {txt: tr("{name} marca el quinto.", {name: plShort(p)}), fx: {pmor: 4}}, ko: {txt: tr("{name} falla el quinto.", {name: plShort(p)}), fx: {pmor: -8}}};
    }); },
    apply: function (x, o, res) { var f = S.cur.pm[x.fi], r = mgrRunShootout(f, !!res.good); x.so = r; return [["note", 0, tr("Tanda {a}-{b}", {a: r.a, b: r.b})]].concat(mgrFx(r.taken ? res.fx : {}, o.pid)); },
    card: function (x, o, res, chips, head) { var r = x.so, good = r.a > r.b;
      return {t: "moment", tipo: "mgr", title: tr("Tanda de penaltis"), ctx: head.ctxTxt, choice: tr("Quinto lanzador: {name}", {name: o.t}), txt: (r.taken ? res.txt : tr("La tanda se decide antes del quinto lanzamiento.")) + " " + (good ? tr("Termina {a}-{b}: ¡pasáis!", {a: r.a, b: r.b}) : tr("Termina {a}-{b}: eliminados.", {a: r.a, b: r.b})), chips: chips, good: good, y: S.yr}; }
  },
  bid: {
    head: function (x) { var t = mgrTarget(x.tid);
      return {tag: "real", tagTxt: tr("Fichaje"), cls: "", cat: S.m.mk.open === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), title: tr("Oferta por {name}", {name: t.fn + " " + t.ln}), text: tDesc(t) + " " + (t.key ? tr("El {club} pide {fee} y es pieza clave para ellos.", {club: clubName(t.club), fee: fmtMoney(t.ask)}) : tr("El {club} pide {fee}.", {club: clubName(t.club), fee: fmtMoney(t.ask)})) + " " + tr("Tienes {bud} de presupuesto.", {bud: fmtMoney(S.m.bud)})}; },
    opts: function (x) {
      var t = mgrTarget(x.tid), m = S.m, k = t.key ? -0.15 : 0, out = [];
      [[1, 0.88], [0.85, 0.55], [0.7, 0.25]].forEach(function (q, i) {
        if (t.tries >= 1 && i === 2) return;
        var fee = Math.round(t.ask * q[0] / 1e5) * 1e5, p = clamp(q[1] + k + (m.rep - 40) / 400, 0.03, 0.97);
        out.push({t: i === 0 ? tr("Pagar lo que piden: {fee}", {fee: fmtMoney(fee)}) : tr("Ofrecer el {pct} %: {fee}", {pct: Math.round(q[0] * 100), fee: fmtMoney(fee)}), p: p, dis: fee > m.bud ? tr("No te llega el presupuesto") : null,
          ok: {txt: tr("El {club} acepta {fee}. Ahora falta convencer al jugador.", {club: clubName(t.club), fee: fmtMoney(fee)}), n: tr("Acuerdo con su club"), then: function () { S.pend.unshift(mp("terms", {tid: t.id, fee: fee, ui: true})); }},
          ko: {txt: t.tries >= 1 ? tr("El {club} rechaza la oferta y da por cerrada la negociación.", {club: clubName(t.club)}) : tr("El {club} rechaza la oferta y sube el precio.", {club: clubName(t.club)}), n: t.tries >= 1 ? tr("Se acaba la negociación") : tr("El precio sube un 10 %"),
            then: function () { t.tries++; if (t.tries >= 2) t.done = "rechazado"; else t.ask = Math.round(t.ask * 1.1 / 1e5) * 1e5; }}});
      });
      out.push({t: tr("Retirarte de la operación"), ok: {txt: tr("Te retiras. Quizá en otro momento."), fx: {}}});
      return out;
    }
  },
  terms: {
    head: function (x) { var t = mgrTarget(x.tid);
      return {tag: "real", tagTxt: tr("Fichaje"), cls: "", cat: tr("Negociación"), title: tr("Convencer a {name}", {name: t.fn + " " + t.ln}),
        text: (x.fee ? tr("Acuerdo cerrado con el {club} por {fee}.", {club: clubName(t.club), fee: fmtMoney(x.fee)}) : tr("Está sin equipo y escucha ofertas.")) + " " + trn(t.yrsD, "Pide {sal} al año durante {n} año y quiere saber qué papel tendrá.", "Pide {sal} al año durante {n} años y quiere saber qué papel tendrá.", {sal: fmtMoney(t.sal)})}; },
    opts: function (x) {
      var t = mgrTarget(x.tid), m = S.m, base = clamp(0.5 + (t.int - 50) / 110 + (m.rep - 40) / 300, 0.08, 0.93);
      var bill = mWageBill(), over = bill + t.sal > m.wcap, low = Math.round(t.sal * 0.9 / 1000) * 1000, hi = Math.round(t.sal * 1.1 / 1000) * 1000;
      var cap = function (sal) { return bill + sal > m.wcap * 1.1 ? tr("Superarías el tope salarial: vende o renegocia antes") : null; };
      var fx = function () { var o = {bud: -x.fee}; if (over) o.board = -5; return o; };
      var sign = function (sal, role, prom) { return function () { mgrSign(t, x.fee, sal, role, prom); }; };
      var no = {txt: tr("Se lo piensa y al final elige otra oferta."), n: tr("No ficha"), then: function () { t.done = "rechazó"; }};
      var end = S.yr + t.yrsD;
      return [
        {t: tr("Darle lo que pide"), d: tr("{sal}/año hasta {end}", {sal: fmtMoney(t.sal), end: end}), p: base, dis: cap(t.sal), ok: {txt: tr("¡Fichado! {name} firma hasta {end}.", {name: t.fn + " " + t.ln, end: end}), fx: fx(), n: over ? tr("Superas el tope salarial") : null, then: sign(t.sal, null, false)}, ko: no},
        {t: tr("Ofrecer un 10 % menos"), d: tr("{sal}/año", {sal: fmtMoney(low)}), p: clamp(base - 0.2, 0.03, 0.9), dis: cap(low), ok: {txt: tr("Acepta la rebaja. ¡Fichado!"), fx: fx(), then: sign(low, null, false)}, ko: no},
        {t: tr("Prometerle que será Clave"), d: tr("{sal}/año · si no juega, se sentirá engañado", {sal: fmtMoney(hi)}), p: clamp(base + 0.15, 0.05, 0.97), dis: cap(hi), ok: {txt: tr("Le convence el papel protagonista. ¡Fichado!"), fx: fx(), n: tr("Entra como jugador Clave"), then: sign(hi, "C", true)}, ko: no},
        {t: tr("Renunciar al fichaje"), ok: {txt: tr("Lo dejas estar."), fx: {}, then: function () { t.done = "descartado"; }}}
      ];
    }
  },
  sell: {
    head: function (x) { var p = mPl(x.pid); return {tag: "real", tagTxt: tr("Venta"), cls: "", cat: tr("Mercado"), title: tr("Ofertas por {name}", {name: plName(p)}), text: plDesc(p) + " " + tr("Valor de mercado: {val}.", {val: fmtMoney(pValue(p))})}; },
    opts: function (x) {
      var p = mPl(x.pid), pop = p.role === "C" || p.tot.apps + p.st.apps >= 120, out = [];
      var sell = function (club, fee) { return function () { mgrRemovePlayer(p, tr("Vendido al {club}", {club: clubName(club)}), club, fee); }; };
      x.offers.forEach(function (o) {
        out.push({t: tr("Aceptar {fee} del {club}", {fee: fmtMoney(o.fee), club: clubName(o.club)}), ok: {txt: tr("{name} se marcha al {club}.", {name: plName(p), club: clubName(o.club)}), fx: {bud: o.fee, fans: pop ? -6 : 0, chem: -1}, then: sell(o.club, o.fee)}});
      });
      var b = x.offers[0], more = Math.round(b.fee * 1.2 / 1e5) * 1e5;
      out.push({t: tr("Pedir {fee} al {club}", {fee: fmtMoney(more), club: clubName(b.club)}), p: 0.45,
        ok: {txt: tr("Aceptan pagar más. {name} se marcha.", {name: plName(p)}), fx: {bud: more, fans: pop ? -6 : 0, chem: -1}, then: sell(b.club, more)},
        ko: {txt: tr("Se levantan de la mesa."), fx: {}}});
      out.push({t: tr("No vender"), ok: {txt: tr("Te lo quedas."), fx: {pmor: p.req ? -8 : 2}}});
      return out;
    }
  },
  inoffer: {
    head: function (x) { var p = mPl(x.pid); return {tag: "real", tagTxt: tr("Oferta recibida"), cls: "", cat: tr("Mercado"), title: tr("El {club} quiere a {name}", {club: clubName(x.club), name: plShort(p)}),
      text: tr("Ofrecen {fee} por {desc} Su valor de mercado es {val}.", {fee: fmtMoney(x.fee), desc: plDesc(p), val: fmtMoney(pValue(p))}) + " " + (p.req ? tr("El jugador quiere irse.") : tr("El jugador está a gusto en el club."))}; },
    opts: function (x) {
      var p = mPl(x.pid), pop = p.role === "C" || p.tot.apps + p.st.apps >= 120, more = Math.round(x.fee * 1.25 / 1e5) * 1e5;
      var sell = function (fee) { return function () { mgrRemovePlayer(p, tr("Vendido al {club}", {club: clubName(x.club)}), x.club, fee); }; };
      return [
        {t: tr("Aceptar {fee}", {fee: fmtMoney(x.fee)}), ok: {txt: tr("Trato hecho."), fx: {bud: x.fee, fans: pop ? -5 : 0}, then: sell(x.fee)}},
        {t: tr("Pedir {fee}", {fee: fmtMoney(more)}), p: 0.5, ok: {txt: tr("Pagan lo que pides."), fx: {bud: more, fans: pop ? -5 : 0}, then: sell(more)}, ko: {txt: tr("Se retiran."), fx: {pmor: p.req ? -8 : 0}}},
        {t: tr("Rechazar la oferta"), ok: {txt: tr("No está en venta."), fx: {pmor: p.req ? -15 : 3}}}
      ];
    }
  },
  renew: {
    head: function (x) { var p = mPl(x.pid), tm = mgrRenewTerms(p);
      return {tag: "real", tagTxt: tr("Renovación"), cls: "", cat: tr("Contrato"), title: tr("Renovar a {name}", {name: plName(p)}),
        text: plDesc(p) + " " + (p.yrs <= 1 ? tr("Le queda esta temporada de contrato y cobra {sal}.", {sal: fmtMoney(p.sal)}) : tr("Le quedan {n} temporadas de contrato y cobra {sal}.", {n: p.yrs, sal: fmtMoney(p.sal)})) + " " + trn(tm.yrs, "Pide {wage} al año y {n} año más.", "Pide {wage} al año y {n} años más.", {wage: fmtMoney(tm.wage)})}; },
    opts: function (x) {
      var p = mPl(x.pid), tm = mgrRenewTerms(p), end = S.yr + tm.yrs + 1, low = Math.round(tm.wage * 0.85 / 1000) * 1000, hi = Math.round(tm.wage * 1.15 / 1000) * 1000;
      var sign = function (w, role) { return function () { p.sal = w; p.yrs = 1 + tm.yrs; if (role) { p.role = role; p.prom = "C"; } }; };
      var fail = function (d) { return {txt: tr("Quiere esperar a ver qué otras ofertas le llegan."), fx: {pmor: d}, n: tr("Podrás volver a intentarlo el próximo tramo"), then: function () { p.rnT = S.yr * 10 + S.bi; }}; };
      var o = [
        {t: tr("Aceptar sus condiciones"), d: tr("{sal}/año hasta {end}", {sal: fmtMoney(tm.wage), end: end}), p: tm.p, ok: {txt: tr("{name} renueva hasta {end}.", {name: plShort(p), end: end}), fx: {pmor: 6}, then: sign(tm.wage)}, ko: fail(-4)},
        {t: tr("Ofrecer un 15 % menos"), d: tr("{sal}/año", {sal: fmtMoney(low)}), p: clamp(tm.p - 0.25, 0.03, 0.9), ok: {txt: tr("Acepta la rebaja. Renueva hasta {end}.", {end: end}), fx: {pmor: 2}, then: sign(low)}, ko: fail(-7)}
      ];
      if (p.role !== "C") o.push({t: tr("Subirle a jugador Clave"), d: tr("{sal}/año y la promesa de minutos", {sal: fmtMoney(hi)}), p: clamp(tm.p + 0.12, 0.05, 0.97), ok: {txt: tr("Encantado con su nuevo papel. Renueva hasta {end}.", {end: end}), fx: {pmor: 12}, then: sign(hi, "C")}, ko: fail(-4)});
      o.push({t: tr("Dejarle marchar"), ok: {txt: tr("Se lo comunicas. Cumplirá su contrato y se irá."), fx: {pmor: -8}, n: tr("Se irá libre al acabar su contrato"), then: function () { p.noRenew = true; p.rnT = S.yr * 10 + S.bi; }}});
      return o;
    }
  },
  talk: {
    head: function (x) { var p = mPl(x.pid); return {tag: "real", tagTxt: tr("Charla"), cls: "", cat: tr("Vestuario"), title: tr("Hablar con {name}", {name: plName(p)}),
      text: plDesc(p) + " " + trn(p.st.apps, "Su moral está en {mor} y esta temporada ha jugado {n} partido.", "Su moral está en {mor} y esta temporada ha jugado {n} partidos.", {mor: Math.round(p.mor)})}; },
    opts: function (x) { var p = mPl(x.pid), mk = function () { p.tkT = S.yr * 10 + S.bi; }; return [
      {t: tr("Prometerle más minutos"), p: 0.7, ok: {txt: tr("Sale de tu despacho con otra cara."), fx: {pmor: 14}, n: tr("Si no juega, se sentirá engañado"), then: function () { mk(); p.prom = p.role === "C" ? "C" : null; }}, ko: {txt: tr("No se cree tus promesas."), fx: {pmor: 3}, then: mk}},
      {t: tr("Explicarle su papel con sinceridad"), p: 0.55, ok: {txt: tr("Lo entiende y lo acepta."), fx: {pmor: 8}, then: mk}, ko: {txt: tr("La verdad le duele."), fx: {pmor: -4}, then: mk}},
      {t: tr("Que se lo gane en los entrenamientos"), p: 0.4, ok: {txt: tr("Se lo toma como un reto."), fx: {pmor: 6, povr: 0.3}, then: mk}, ko: {txt: tr("Se siente ninguneado."), fx: {pmor: -8}, then: mk}},
      {t: tr("Cancelar"), ok: {txt: tr("Lo dejáis para otro día."), fx: {}}}
    ]; }
  },
  loan: {
    head: function (x) { var p = mPl(x.pid); return {tag: "real", tagTxt: tr("Cesión"), cls: "", cat: tr("Mercado"), title: tr("Ceder a {name}", {name: plName(p)}), text: plDesc(p) + " " + tr("Jugará la temporada en otro club y volverá en verano.")}; },
    opts: function (x) { var p = mPl(x.pid); return x.clubs.map(function (c) {
      return {t: tr("Ceder al {club}", {club: clubName(c)}), d: tr("{lg} · nivel {n}", {lg: W.lg[S.cl[c]] ? lgName(S.cl[c]) : "", n: Math.round(S.cr[c])}),
        ok: {txt: tr("{name} se va cedido al {club}.", {name: plName(p), club: clubName(c)}), fx: {}, n: tr("Vuelve en verano con más rodaje"), then: function () { p.loanOut = {club: c, y: S.yr}; mFixXI(); mSync(); }}};
    }).concat([{t: tr("Cancelar"), ok: {txt: tr("Se queda en la plantilla."), fx: {}}}]); }
  },
  release: {
    head: function (x) { var p = mPl(x.pid); return {tag: "real", tagTxt: tr("Rescisión"), cls: "", cat: tr("Contrato"), title: tr("Rescindir a {name}", {name: plName(p)}), text: plDesc(p) + " " + trn(p.yrs, "Le queda {n} temporada a {sal} al año.", "Le quedan {n} temporadas a {sal} al año.", {sal: fmtMoney(p.sal)})}; },
    opts: function (x) { var p = mPl(x.pid), cost = Math.round(p.sal * Math.max(1, p.yrs) * 0.5 / 1e4) * 1e4; return [
      {t: tr("Rescindir y pagar {cost}", {cost: fmtMoney(cost)}), ok: {txt: tr("{name} deja el club.", {name: plName(p)}), fx: {bud: -cost, chem: -1}, then: function () { mgrRemovePlayer(p, tr("Contrato rescindido"), -1, 0); }}},
      {t: tr("Cancelar"), ok: {txt: tr("Sigue en la plantilla."), fx: {}}}
    ]; }
  },
  youth: {
    head: function () { return {tag: "real", tagTxt: tr("Cantera"), cls: "", cat: tr("Cantera"), title: tr("Llegan los juveniles"), text: tr("Tu cantera ha formado a tres chicos que piden paso. Puedes subir a uno al primer equipo; los demás seguirán su camino en otros clubes.")}; },
    opts: function () { var m = S.m;
      var o = m.youth.map(function (y, i) { return {t: y.fn + " " + y.ln, d: tr("{pos} · {age} años · media {ovr} · potencial {a}–{b}", {pos: posName(y.pos), age: y.age, ovr: Math.round(y.ovr), a: Math.round(y.pot - 3), b: Math.round(Math.min(95, y.pot + 3))}),
        ok: {txt: tr("{name} sube al primer equipo.", {name: y.fn + " " + y.ln}), fx: {}, n: tr("Nuevo canterano en la plantilla"), then: function () { m.sq.push(mgrMakeYouth(y)); m.youth = null; }}}; });
      if (mActive().length <= 25) o.push({t: tr("Subir a los tres"), ok: {txt: tr("Tres canteranos más en la plantilla."), fx: {}, n: tr("Tres canteranos nuevos"), then: function () { m.youth.forEach(function (y) { m.sq.push(mgrMakeYouth(y)); }); m.youth = null; }}});
      o.push({t: tr("No subir a ninguno"), ok: {txt: tr("Seguirán formándose lejos de aquí."), fx: {}, then: function () { m.youth = null; }}});
      return o; }
  },
  mfocus: {
    head: function () { return {tag: "real", tagTxt: tr("Pretemporada"), cls: "", cat: tr("Entrenamiento"), title: tr("Plan de pretemporada"), text: tr("¿En qué vais a trabajar este verano? Marcará toda la temporada.")}; },
    opts: function () { return Object.keys(MFOCUS).map(function (k) { var f = MFOCUS[k]; return {t: tr(f.n), d: tr(f.d), ok: {txt: tr(f.d), fx: f.fx, then: function () { S.m.focus = k; }}}; }); }
  }
};

/* sorteo de decisiones entre tramos */
function pushMgrEvents(ctx, n) {
  var m = S.m, used = {};
  if (m.club < 0) return;
  S.pend.forEach(function (x) { if (x.k === "mev") used[x.id] = 1; });
  for (var i = 0, guard = 0; i < n && guard < 40; guard++) {
    var pool = MEVENTS.filter(function (e) {
      if (used[e.id] || e.manual) return false;
      if (e.ctx && e.ctx !== ctx && e.ctx !== "any") return false;
      if (!e.ctx && ctx === "verano") return false;
      var cd = m.evCd[e.id];
      if (cd != null && S.yr - cd < (e.cd != null ? e.cd : 2)) return false;
      if (e.once && cd != null) return false;
      try { return !e.when || e.when(Y); } catch (err) { return false; }
    });
    var ev = wpick(pool, function (e) { return e.w || 1; });
    if (!ev) break;
    used[ev.id] = 1;
    var item = mp("mev", {id: ev.id});
    if (ev.target) { var pid = null; try { pid = ev.target(Y); } catch (err) {} if (pid == null) continue; item.pid = pid; }
    if (ev.prep) Object.assign(item, ev.prep(Y));
    S.pend.push(item);
    i++;
  }
}
