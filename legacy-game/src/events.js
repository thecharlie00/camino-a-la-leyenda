/* ===== DECISIONES Y MOMENTOS DEL JUGADOR =====
   Cada opción declara sus desenlaces posibles, con su probabilidad y sus efectos, para que la
   interfaz enseñe el porcentaje de que salga bien y qué cambia si sale mal.
   Formato de opción: {t, d?, p?, ok:{txt, fx, n?, then?}, ko?:{…}}  ó  {t, out:[{p, good, txt, fx, n?, then?}, …]}
   tipo "real": situaciones de carrera (las que tienen ref están calcadas de hechos reales).
   tipo "aleatoria": imprevistos de la vida. */
var EVENTS = [], EVENT_BY_ID = {}, MOMENTS = [], MOMENT_BY_ID = {};
/* minijuego de penaltis y faltas: fuerza que el siguiente desenlace sea bueno (true) o malo (false) */
var FORCE_OUT = null;

/* ---------- desenlaces ---------- */
function outcomesOf(o) {
  var list;
  if (o.out) list = o.out.map(function (x) { return Object.assign({}, x); });
  else if (o.ko && o.p != null) list = [Object.assign({p: o.p, good: true}, o.ok), Object.assign({p: 1 - o.p, good: false}, o.ko)];
  else list = [Object.assign({p: 1, good: true}, o.ok || {})];
  var tot = 0;
  list.forEach(function (x) { x.p = clamp(+x.p || 0, 0, 1); tot += x.p; });
  list.forEach(function (x) { x.p = tot > 0 ? x.p / tot : 1 / list.length; });
  if (list.length > 1) list = list.filter(function (x) { return x.p > 0.0001; });
  if (list.length === 1) list[0].sure = true;
  return list;
}
function rollOutcome(list) {
  if (FORCE_OUT != null) {
    var want = FORCE_OUT; FORCE_OUT = null;
    for (var j = 0; j < list.length; j++) if (!!list[j].good === want) return list[j];
  }
  var r = R();
  for (var i = 0; i < list.length; i++) { r -= list[i].p; if (r < 0) return list[i]; }
  return list[list.length - 1];
}
/* chips de vista previa (no aplican nada) */
function fxPreview(fx, note) {
  var ch = [];
  Object.keys(fx || {}).forEach(function (k) {
    var v = fx[k];
    switch (k) {
      case "buff": ch.push(["buff", v.v, trn(v.b, "{name}, {n} tramo", "{name}, {n} tramos", {name: v.n})]); break;
      case "att": Object.keys(v).forEach(function (a) { ch.push(["att", v[a], tr(ATT_NAMES[a])]); }); break;
      case "pos": ch.push(["pos", 0, posName(v)]); break;
      case "coachSet": ch.push(["coachSet", v]); break;
      case "injMul": ch.push(["injMul", v]); break;
      case "flag": case "agent": case "yrs": break;
      default: if (v) ch.push([k, v]);
    }
  });
  if (note) ch.push(["note", 0, note]);
  return ch;
}
function momPreview(o) {
  var ch = [], fx = Object.assign({}, o.fx || {});
  if (o.goal === "me") ch.push(["goal", 1, tr("Gol tuyo")]);
  if (o.goal === "assist") ch.push(["goal", 1, tr("Asistencia tuya")]);
  if (o.goal === "team") ch.push(["goal", 1, tr("Gol de tu equipo")]);
  if (o.concede) ch.push(["concede", o.concede]);
  if (o.save) ch.push(["save", 1]);
  if (o.red) { ch.push(["red", 1 + (fx.susp || 0)]); delete fx.susp; }
  if (o.yellow) ch.push(["yellow", 1]);
  if (o.rating) ch.push(["rt", o.rating]);
  return ch.concat(fxPreview(fx, o.n));
}

/* ---------- contexto que ven las decisiones ---------- */
function clubsWhere(fn) { var out = []; for (var i = 0; i < W.clubs.length; i++) if (S.cl[i] >= 0 && fn(i)) out.push(i); return out; }
function byRating(a, b) { return S.cr[b] - S.cr[a]; }
var X = {
  cur: null,
  get p() { return S.p; },
  get club() { return clubName(S.p.club); },
  get lg() { var li = S.cl[S.p.club]; return li >= 0 ? lgName(li) : ""; },
  get age() { return S.p.age; },
  get g() { return posGroup(); },
  get role() { return roleNow(); },
  get nat() { return natName(pnat()); },
  get inSeason() { return S.ph === "gap" || S.ph === "blk"; },
  get abroad() { return W.clubs[S.p.club].ci !== S.p.nat; },
  get starts() { return S.p.ss ? S.p.ss.st : 0; },
  get teamGames() { return S.p.ss ? S.p.ss.tm : 0; },
  get yrsAtClub() { return S.p.con ? S.yr - S.p.con.since : 0; },
  get clubR() { return S.cr[S.p.club]; },
  get lgPos() { return posInLeague(S.p.club); },
  /* azar determinista ligado a la decisión pendiente: la vista previa y el resultado coinciden */
  sd: function (k) {
    var c = X.cur, base = c && c.s != null ? c.s : hashStr((c && c.id || "x") + "|" + S.tw + "|" + S.yr);
    return hashStr(base + "|" + (k || ""));
  },
  spick: function (arr, k) { return arr && arr.length ? arr[X.sd(k) % arr.length] : null; },
  oppId: function () {
    var li = S.cl[S.p.club]; if (li < 0 || !S.L || !S.L[li]) return -1;
    var tm = S.L[li].tm.filter(function (c) { return c !== S.p.club; });
    var d = tm.filter(function (c) { return W.derby[S.p.club + "-" + c]; });
    return d.length && X.sd("d") % 2 === 0 ? X.spick(d, "o1") : X.spick(tm, "o2");
  },
  opp: function () { var o = X.oppId(); return o >= 0 ? clubName(o) : tr("rival"); },
  money: function (x) { return fmtMoney(x); },
  /* el grande del país (si puede, el eterno rival) */
  giant: function () {
    var me = S.p.club, ci = W.clubs[me].ci;
    var l = clubsWhere(function (c) { return c !== me && W.clubs[c].ci === ci && S.cr[c] >= S.cr[me] - 1 && S.cr[c] >= 74; }).sort(byRating);
    var d = l.filter(function (c) { return W.derby[me + "-" + c]; });
    return d.length ? d[0] : l.length ? l[0] : -1;
  },
  /* un club más potente, en cualquier liga */
  bigClub: function (minR, k) {
    var me = S.p.club;
    var l = clubsWhere(function (c) { return c !== me && S.cr[c] >= Math.max(minR, S.cr[me] + 1); }).sort(byRating).slice(0, 7);
    return l.length ? X.spick(l, k || "big") : -1;
  },
  derbyRival: function () {
    var me = S.p.club, li = S.cl[me]; if (li < 0 || !S.L || !S.L[li]) return -1;
    var l = S.L[li].tm.filter(function (c) { return c !== me && W.derby[me + "-" + c]; }).sort(byRating);
    return l.length ? l[0] : -1;
  },
  /* el club del que te fuiste y que ahora es rival de liga */
  exClub: function () {
    var p = S.p, li = S.cl[p.club];
    for (var i = p.tx.length - 1; i >= 0; i--) { var t = p.tx[i]; if (!t.loan && t.from !== p.club && li >= 0 && S.cl[t.from] === li) return t.from; }
    return -1;
  },
  /* probabilidad de marcar en un partido según puesto y nivel */
  scoreP: function () {
    var base = {DC: 0.42, ED: 0.3, EI: 0.3, MCO: 0.28, MD: 0.18, MI: 0.18, MC: 0.13, MCD: 0.08, DFC: 0.1, LD: 0.07, LI: 0.07, POR: 0.01}[S.p.pos] || 0.1;
    return clamp(base * (1 + (S.p.ovr - X.clubR) * 0.03), 0.03, 0.7);
  },
  /* competición continental en la que sigues vivo en una eliminatoria */
  aliveKO: function () {
    var found = null;
    ["UCL", "LIB", "UEL", "ACL", "CAF", "CCC", "SUD", "UECL"].some(function (k) {
      var c = S.C && S.C[k]; if (!c || !c.ko || c.done) return false;
      var rd = c.ko.r[c.ko.ri]; if (!rd) return false;
      if (rd.ties.some(function (t) { return t.w < 0 && (t.a === S.p.club || t.b === S.p.club); })) { found = c; return true; }
      return false;
    });
    return found;
  },
  cupAlive: function () {
    var c = S.C && S.C["CUP:" + W.clubs[S.p.club].c]; if (!c || !c.ko || c.done) return null;
    var rd = c.ko.r[c.ko.ri]; if (!rd || c.ko.ri < c.ko.r.length - 2) return null;
    return rd.ties.some(function (t) { return t.w < 0 && (t.a === S.p.club || t.b === S.p.club); }) ? c : null;
  }
};
function EV(d) { i18nFields(d); EVENTS.push(d); EVENT_BY_ID[d.id] = d; }
function MO(d) { i18nFields(d); MOMENTS.push(d); MOMENT_BY_ID[d.id] = d; }
function nearPos(pos) {
  return {DC: ["ED", "EI", "MCO"], ED: ["DC", "MD", "EI"], EI: ["DC", "MI", "ED"], MD: ["ED", "LD", "MC"], MI: ["EI", "LI", "MC"], MCO: ["MC", "DC", "ED"],
    MC: ["MCD", "MCO", "MD"], MCD: ["DFC", "MC"], DFC: ["MCD", "LD", "LI"], LD: ["DFC", "MD", "LI"], LI: ["DFC", "MI", "LD"], POR: []}[pos] || [];
}

/* ============ DECISIONES DE CARRERA (manuales) ============ */
EV({id: "agente", tipo: "real", cat: "Representación", manual: true, title: "Elige a tu agente",
  text: function (x) { return tr("Acabas de firmar tu primer contrato con el {club} y tres representantes quieren llevar tu carrera. De esta decisión depende cuántas ofertas te lleguen y cuánto cobrarás.", {club: x.club}); },
  opts: function (x) { return [
    {t: tr("Agencia de estrellas"), d: tr("Más ofertas y mejores sueldos. Se queda el 10 %."), ok: {txt: tr("Firmas con una agencia que mueve a medio mundo. Tu teléfono ya no deja de sonar."), fx: {agent: 2, fame: 3}, n: tr("Más ofertas · comisión del 10 %")}},
    {t: tr("Tu tío, que te conoce desde niño"), d: tr("Cercano y leal. Se queda el 5 %."), ok: {txt: tr("Todo queda en familia. Te sientes arropado y con los pies en el suelo."), fx: {agent: 1, mor: 6, prof: 3}, n: tr("Comisión del 5 %")}},
    {t: tr("Ir por libre"), d: tr("Sin comisiones, pero menos puertas abiertas."), ok: {txt: tr("Negociarás tú mismo. Ahorras comisiones, aunque los clubes te verán con lupa."), fx: {agent: 0, prof: 2}, n: tr("Sin comisión · menos ofertas")}}
  ]; }});

EV({id: "renovacion", tipo: "real", cat: "Contrato", manual: true, title: "Te queda un año de contrato",
  ref: "Desde la sentencia Bosman (diciembre de 1995), un futbolista con el contrato terminado puede marcharse gratis a otro club.",
  still: function (x) { return x.p.con && x.p.con.yrs === 1 && !x.p.loan; },
  text: function (x) {
    return tr("El {club} quiere sentarse a hablar. Tu contrato vence al final de esta temporada y tu rol ahora es: {role}. Si no firmas, en verano podrás irte gratis… o quedarte sin equipo.", {club: x.club, role: lcT(tr(x.role))});
  },
  opts: function (x) {
    var yrs = x.age <= 25 ? 5 : x.age <= 29 ? 4 : x.age <= 32 ? 2 : 1;
    var strong = {Estrella: 0.35, Titular: 0.2, "Rotación": 0.05, Suplente: -0.1, Promesa: 0.05, Reserva: -0.15}[x.role];
    var p = clamp(0.3 + x.p.fame / 200 + strong + x.p.agent * 0.06, 0.05, 0.9);
    return [
      {t: tr("Firmar la renovación"), d: trn(yrs, "{n} año y un 25 % más de sueldo.", "{n} años y un 25 % más de sueldo."), ok: {txt: tr("Firmas hasta {year}. La grada corea tu nombre en el siguiente partido.", {year: S.yr + yrs + 1}), fx: {yrs: yrs + 1, sal: 1.25, mor: 5, fans: 5, coach: 4}, n: tr("Contrato hasta {year}", {year: S.yr + yrs + 1})}},
      {t: tr("Pedir más dinero"), d: tr("Puede salir muy bien o romper la relación."), p: p,
        ok: {txt: trn(yrs, "El club cede. Firmas el contrato de tu vida: un 70 % más y {n} año.", "El club cede. Firmas el contrato de tu vida: un 70 % más y {n} años."), fx: {yrs: yrs + 1, sal: 1.7, mor: 8, fame: 2}, n: tr("Contrato hasta {year}", {year: S.yr + yrs + 1})},
        ko: {txt: tr("La directiva se levanta de la mesa. No hay acuerdo y el ambiente se enrarece."), fx: {coach: -8, fans: -6, mor: -4}, n: tr("Sin renovar: en verano serás libre")}},
      {t: tr("No renovar"), d: tr("Te irás libre en verano. Al club no le gustará."), ok: {txt: tr("Comunicas que no renovarás. El míster te manda a la grada hasta nuevo aviso."), fx: {coach: -12, fans: -12, flag: {frozen: true}}, n: tr("Casi sin minutos hasta verano")}}
    ];
  }});

EV({id: "lesion_grave", tipo: "real", cat: "Salud", manual: true, title: "Lesión grave: ¿cómo la tratas?",
  still: function (x) { return x.p.inj && x.p.injT > S.tw + 4; },
  text: function (x) { return tr("Los médicos confirman: {injury}. Hay varios caminos y ninguno es perfecto.", {injury: x.p.inj ? lcName(x.p.inj.n) : tr("lesión seria")}); },
  opts: function (x) { return [
    {t: tr("Operarte"), d: tr("Más semanas de baja, recuperación completa."), ok: {txt: tr("La operación sale bien. Será largo, pero volverás sin riesgo de recaída."), fx: {prof: 3}, n: tr("3 semanas más de baja, sin recaída"), then: function () { S.p.injT += 3; }}},
    {t: tr("Tratamiento conservador"), d: tr("Vuelves antes, con riesgo de recaída."), p: 0.65,
      ok: {txt: tr("Vuelves antes de lo previsto y responde bien."), fx: {mor: 4}, n: tr("Acortas la baja un 35 %"), then: function () { S.p.injT -= Math.round((S.p.injT - S.tw) * 0.35); }},
      ko: {txt: tr("Vuelves antes… y la lesión se reproduce. Esta vez dejará huella."), fx: {pot: -2, mor: -8, injMul: 1.3}, n: tr("Recaída: 2 semanas más"), then: function () { S.p.injT += 2; }}},
    {t: tr("Clínica de élite (150 k€)"), d: tr("Cara, pero acelera la vuelta con seguridad."), ok: {txt: tr("Te tratas en una clínica puntera. Acortas plazos sin arriesgar."), fx: {money: -150000, prof: 4}, n: tr("Acortas la baja un 25 %"), then: function () { S.p.injT -= Math.round((S.p.injT - S.tw) * 0.25); }}}
  ]; }});

EV({id: "doble_nacionalidad", tipo: "real", cat: "Selección", manual: true, title: "Dos federaciones te quieren",
  still: function (x) { return x.p.inat < 0 && x.p.nat2 >= 0; },
  text: function (x) { var p = x.p; return tr("Tus actuaciones no han pasado desapercibidas: {country1} y {country2} te quieren en su selección. Cuando debutes en partido oficial, la elección será para siempre.", {country1: natName(p.nat), country2: natName(p.nat2)}); },
  opts: function (x) { var p = x.p; return [
    {t: W.ctry[p.nat].flag + " " + natName(p.nat), d: tr("Nivel de la selección: {level}", {level: Math.round(S.nr[p.nat])}), ok: {txt: tr("Eliges {country}. La federación lo anuncia por todo lo alto.", {country: natName(p.nat)}), fx: {mor: 6, fame: 2}, then: function () { S.p.inat = S.p.nat; }}},
    {t: W.ctry[p.nat2].flag + " " + natName(p.nat2), d: tr("Nivel de la selección: {level}", {level: Math.round(S.nr[p.nat2])}), ok: {txt: tr("Eliges {country}. Te reciben como a uno más desde el primer día.", {country: natName(p.nat2)}), fx: {mor: 6, fame: 2}, then: function () { S.p.inat = S.p.nat2; }}}
  ]; }});

EV({id: "retiro", tipo: "real", cat: "Futuro", manual: true, title: "¿Colgar las botas?",
  text: function (x) { return tr("Tienes {age} años y una media de {ovr}. Tu cuerpo te habla cada mañana. ¿Sigues una temporada más?", {age: x.age, ovr: Math.round(x.p.ovr)}); },
  opts: function (x) {
    var o = [];
    if (x.age < 41 && x.p.ovr >= 52) o.push({t: tr("Una temporada más"), d: tr("El fútbol todavía te necesita."), ok: {txt: tr("Ni te lo planteas: el césped sigue siendo tu casa."), fx: {mor: 4}}});
    o.push({t: tr("Retirarme"), d: tr("Fin de la carrera y repaso a tu legado. Después podrás ser entrenador."), ok: {txt: tr("Anuncias tu retirada. Toda una vida dedicada al fútbol."), fx: {}, n: tr("Fin de tu carrera de jugador"), then: function () { retire(); }}});
    return o;
  }});

/* gala del Balón de Oro: aparece si te quedas a las puertas */
EV({id: "gala_bdo", tipo: "real", cat: "Premios", manual: true, title: "El soplo antes de la gala",
  ref: "Octubre de 2024: el Real Madrid no viajó a la gala del Balón de Oro al saber que Vinícius no lo ganaría.",
  text: function (x) { var pos = (x.cur && x.cur.pos) || 2; return tr("Horas antes de la gala del Balón de Oro te llega el soplo: no vas a ganar, quedarás {pos}. En el {club} proponen no viajar a París en señal de protesta.", {pos: ord(pos), club: x.club}); },
  opts: function (x) { return [
    {t: tr("Ir y aplaudir al ganador"), ok: {txt: tr("Subes al escenario a felicitarle. Imagen de señorío que recorre el mundo."), fx: {fame: 2, prof: 4, fans: 2}}},
    {t: tr("No ir: boicot con tu club"), ok: {txt: tr("Tu asiento vacío es la noticia de la noche. Tu afición te apoya; el resto del mundo, no tanto."), fx: {fans: 5, fame: -3, coach: 3}, n: tr("Polémica mundial")}},
    {t: tr("Ir y criticar la votación en redes"), p: 0.5,
      ok: {txt: tr("Tu mensaje arrasa: millones de aficionados se ponen de tu lado."), fx: {fol: 60, fans: 6, fame: 2}},
      ko: {txt: tr("Te llueven las críticas por mal perdedor."), fx: {fame: -4, fol: 10, mor: -4}}}
  ]; }});

/* ============ DECISIONES DE CARRERA (aparecen según la situación) ============ */
EV({id: "pedir_minutos", tipo: "real", cat: "Vestuario", title: "Pocos minutos",
  when: function (x) { return x.inSeason && x.teamGames >= 6 && x.starts / x.teamGames < 0.4 && x.age >= 18; }, w: 2.5,
  text: function (x) { return trn(x.starts, "Llevas {n} titularidad en {games} partidos. Te sientes preparado, pero el míster no cuenta contigo. Tienes una reunión con él.", "Llevas {n} titularidades en {games} partidos. Te sientes preparado, pero el míster no cuenta contigo. Tienes una reunión con él.", {games: x.teamGames}); },
  opts: function (x) { var p = clamp(0.35 + (x.p.ovr - x.clubR) * 0.06 + (x.p.coach - 50) / 150, 0.1, 0.85); return [
    {t: tr("Exigir más minutos"), p: p,
      ok: {txt: tr("Te escucha. «Demuéstramelo el domingo». Entras en el once."), fx: {coach: 10, mor: 6, buff: {v: 1, b: 1, n: tr("Confianza del míster")}}},
      ko: {txt: tr("No le sienta bien el tono. Te recuerda quién manda en el vestuario."), fx: {coach: -12, mor: -5}}},
    {t: tr("Trabajar en silencio"), ok: {txt: tr("Ni una queja. Eres el primero en llegar y el último en irte. El cuerpo técnico lo nota."), fx: {prof: 5, coach: 7, mor: -2}}},
    {t: tr("Pedir salir en el mercado"), ok: {txt: tr("Tu agente empieza a mover tu nombre. El club no lo ve con buenos ojos."), fx: {coach: -6, flag: {wantOut: true}}, n: tr("Más ofertas en el próximo mercado")}}
  ]; }});

function npFor(x) { var l = nearPos(x.p.pos); return l[(S.yr + S.bi) % l.length]; }
EV({id: "fuera_posicion", tipo: "real", cat: "Táctica", title: "El míster te cambia de sitio", cd: 4,
  when: function (x) { return x.inSeason && x.p.pos !== "POR"; }, w: 1,
  text: function (x) { var np = npFor(x); return tr("Hay bajas y el míster te pide jugar de {pos} las próximas semanas. No es tu sitio, pero confía en ti.", {pos: lcT(posName(np))}); },
  opts: function (x) { var np = npFor(x); return [
    {t: tr("Aceptar y adaptarte"), out: [
      {p: 0.45, good: true, txt: tr("Te adaptas de maravilla. Ganas versatilidad y el míster te adora."), fx: {coach: 12, buff: {v: 1.5, b: 2, n: tr("Polivalente")}}},
      {p: 0.35, good: true, txt: tr("Cumples sin brillar. El míster agradece el sacrificio."), fx: {coach: 8}},
      {p: 0.2, txt: tr("Lo pasas mal: no encuentras tu sitio y tu forma se resiente."), fx: {coach: 6, form: -10}}]},
    {t: tr("Cambiar de posición para siempre"), d: tr("Pasas a ser {pos}.", {pos: lcT(posName(np))}), ok: {txt: tr("Abrazas el cambio. Te costará al principio, pero es una nueva carrera."), fx: {pos: np, coach: 12, ovr: -1}}},
    {t: tr("Negarte con respeto"), ok: {txt: tr("Le explicas que rindes mejor en tu puesto. Lo acepta, pero toma nota."), fx: {coach: -8, mor: 2}}}
  ]; }});

EV({id: "jugar_tocado", tipo: "real", cat: "Salud", title: "Jugar tocado",
  when: function (x) { return x.inSeason && !x.p.inj; }, w: 1.2,
  text: function (x) { return tr("Notas un pinchazo en el gemelo antes del partido contra el {rival}. Los médicos dicen que con una infiltración podrías jugar.", {rival: x.opp()}); },
  opts: function (x) { return [
    {t: tr("Jugar con infiltración"), p: 0.55,
      ok: {txt: tr("Aguantas los 90 minutos. El vestuario valora tu compromiso."), fx: {coach: 6, fans: 4, buff: {v: 1, b: 1, n: tr("Compromiso")}}},
      ko: {txt: tr("En el minuto 30 el pinchazo se convierte en rotura. Error caro."), fx: {inj: [3, 6], coach: 2}}},
    {t: tr("Parar y recuperarte"), ok: {txt: tr("Te pierdes el partido, pero tu cuerpo te lo agradecerá."), fx: {fit: 15, coach: -3, form: -3}}}
  ]; }});

EV({id: "rueda_prensa", tipo: "real", cat: "Prensa", title: "Rueda de prensa tras la derrota",
  when: function (x) { return x.inSeason && x.p.fame >= 15; }, w: 1,
  text: function () { return tr("El equipo cae en un partido polémico y te toca hablar ante los micrófonos. Las cámaras esperan un titular."); },
  opts: function () { return [
    {t: tr("Defender al equipo"), ok: {txt: tr("«Estamos juntos y saldremos de esta». Mensaje de capitán."), fx: {fans: 5, coach: 5}}},
    {t: tr("Cargar contra el árbitro"), p: 0.5,
      ok: {txt: tr("La afición se pone de tu lado; la multa de la federación, la pagas encantado."), fx: {fans: 6, fame: 3, money: -20000}},
      ko: {txt: tr("Comité de Competición: un partido de sanción por tus declaraciones."), fx: {susp: 1, coach: -4, fame: 2}}},
    {t: tr("Asumir la culpa"), ok: {txt: tr("«Hoy he estado mal y lo siento». La honestidad cae bien."), fx: {prof: 5, mor: -4, fans: 3}}}
  ]; }});

EV({id: "capitania", tipo: "real", cat: "Vestuario", title: "El brazalete",
  when: function (x) { return x.inSeason && x.age >= 25 && x.yrsAtClub >= 2 && x.p.coach >= 62 && !x.p.flags.captain && !x.p.loan; }, w: 2, once: true,
  text: function (x) { return tr("El capitán se marcha y la plantilla ha votado: quieren que lleves el brazalete del {club}.", {club: x.club}); },
  opts: function (x) { return [
    {t: tr("Aceptar el brazalete"), p: 0.75,
      ok: {txt: tr("Capitán del {club}. Se te nota más líder dentro y fuera del campo.", {club: x.club}), fx: {mor: 8, fame: 4, coach: 6, fans: 6, flag: {captain: true}}, n: tr("Eres el capitán")},
      ko: {txt: tr("Aceptas, pero la presión te pesa las primeras semanas."), fx: {mor: 3, form: -6, fame: 4, flag: {captain: true}}, n: tr("Eres el capitán")}},
    {t: tr("Declinar"), ok: {txt: tr("Prefieres liderar con el ejemplo sin brazalete."), fx: {prof: 2, coach: -3}}}
  ]; }});

EV({id: "mentor", tipo: "real", cat: "Vestuario", title: "Un veterano te adopta",
  when: function (x) { return x.inSeason && x.age <= 21; }, w: 1.4, once: true,
  text: function () { return tr("El veterano del vestuario, con más de 400 partidos a sus espaldas, te dice que ve en ti algo especial y que quiere ayudarte."); },
  opts: function () { return [
    {t: tr("Aprender de él cada día"), ok: {txt: tr("Dietas, descanso, cómo leer los partidos… Absorbes todo como una esponja."), fx: {prof: 8, gmul: 1.12, mor: 3}}},
    {t: tr("Ir a tu aire"), ok: {txt: tr("Le das las gracias, pero prefieres seguir tu propio camino."), fx: {mor: 2}}}
  ]; }});

EV({id: "entreno_extra", tipo: "real", cat: "Entrenamiento", title: "Horas extra",
  when: function (x) { return x.inSeason; }, w: 1.2,
  text: function () { return tr("Acaba el entrenamiento y la ciudad deportiva se vacía. Tienes energía para un poco más."); },
  opts: function (x) { var gk = x.p.pos === "POR", att = {}; att[gk ? "REF" : "TIR"] = 2; return [
    {t: gk ? tr("Paradas hasta que oscurezca") : tr("Tiros a puerta hasta que oscurezca"), p: 0.88,
      ok: {txt: tr("Cientos de repeticiones. Se nota en cada balón."), fx: {att: att, fit: -8}},
      ko: {txt: tr("Te cargas el aductor de tanto repetir."), fx: {att: att, inj: [1, 2]}}},
    {t: tr("Descansar y cuidar el cuerpo"), ok: {txt: tr("Fisio, hielo y a casa. Llegas fresco al fin de semana."), fx: {fit: 10, form: 2}}},
    {t: tr("Analista de vídeo (15 k€)"), ok: {txt: tr("Estudias a tus rivales al detalle. Llegas a los partidos sabiéndote cada movimiento."), fx: {money: -15000, coach: 4, buff: {v: 1, b: 2, n: tr("Análisis de vídeo")}}}}
  ]; }});

EV({id: "nutricionista", tipo: "real", cat: "Salud", title: "Nutricionista personal",
  when: function (x) { return x.p.money >= 80000 && !x.p.flags.chef; }, w: 0.8, once: true,
  text: function () { return tr("Un nutricionista que ha trabajado con estrellas te ofrece un plan personalizado y un cocinero a domicilio. Cuesta 60 k€ al año."); },
  opts: function () { return [
    {t: tr("Contratarlo"), ok: {txt: tr("Tu cuerpo lo agradece desde la primera semana: menos fatiga y menos lesiones."), fx: {money: -20000, flag: {chef: true}, injMul: 0.85, fit: 8, prof: 6}, n: tr("60 k€ al año")}},
    {t: tr("Seguir comiendo como siempre"), ok: {txt: tr("Las lentejas de tu madre no las supera nadie."), fx: {mor: 2}}}
  ]; }});

EV({id: "fisio_personal", tipo: "real", cat: "Salud", title: "Fisioterapeuta en casa",
  when: function (x) { return x.p.money >= 150000 && x.age >= 24 && !x.p.flags.physio; }, w: 0.8, once: true,
  text: function () { return tr("Muchas estrellas tienen su propio fisio. Uno de los mejores del país te ofrece sus servicios por 75 k€ al año."); },
  opts: function () { return [
    {t: tr("Contratarlo"), ok: {txt: tr("Recuperas mucho mejor entre partidos."), fx: {money: -25000, flag: {physio: true}, injMul: 0.8, fit: 10}, n: tr("Recuperas más rápido cada semana · 75 k€ al año")}},
    {t: tr("Con los del club basta"), ok: {txt: tr("Confías en los servicios médicos del club."), fx: {}}}
  ]; }});

EV({id: "psicologo", tipo: "real", cat: "Mente", title: "Te notas apagado",
  when: function (x) { return x.p.mor < 42; }, w: 3,
  text: function () { return tr("Llevas semanas sin disfrutar. Te cuesta dormir y el fútbol pesa más de lo normal."); },
  opts: function () { return [
    {t: tr("Ir a un psicólogo deportivo"), ok: {txt: tr("Hablar con un profesional te cambia el chip. Vuelves a sonreír en los entrenos."), fx: {money: -20000, mor: 18, form: 5}}},
    {t: tr("Pasar unos días con tu familia"), ok: {txt: tr("Comida de domingo, tus amigos de siempre… Recargas pilas."), fx: {mor: 11, fit: 3, coach: -2}}},
    {t: tr("Encerrarte en el trabajo"), p: 0.5,
      ok: {txt: tr("Entrenar te despeja. Poco a poco vuelve la chispa."), fx: {mor: 7, prof: 4}},
      ko: {txt: tr("Tapar el problema no lo soluciona. Sigues sin encontrarte."), fx: {mor: -4, form: -5}}}
  ]; }});

EV({id: "lanzador", tipo: "real", cat: "Vestuario", title: "¿Quién tira los penaltis?",
  when: function (x) { return x.inSeason && (x.g === "DEL" || x.p.pos === "MCO") && !x.p.flags.pens && x.p.ovr >= x.clubR - 2; }, w: 1.3,
  text: function () { return tr("El lanzador habitual ha fallado los dos últimos. En el vestuario se habla de quién debe coger el balón."); },
  opts: function () { return [
    {t: tr("Reclamar el balón"), p: 0.6,
      ok: {txt: tr("El míster te nombra lanzador oficial. Más goles a la vista."), fx: {flag: {pens: true}, fame: 2, mor: 4}, n: tr("Lanzador oficial de penaltis")},
      ko: {txt: tr("Discutes con el lanzador y se monta un lío en el vestuario."), fx: {coach: -5, mor: -3}}},
    {t: tr("Respetar la jerarquía"), ok: {txt: tr("Dejas que el capitán decida. Buen compañero."), fx: {coach: 3, mor: 1}}}
  ]; }});

EV({id: "nuevo_entrenador", tipo: "real", cat: "Vestuario", title: "Cambio de entrenador",
  when: function (x) { return x.inSeason; }, w: 0.7,
  text: function (x) { return tr("El {club} destituye al míster tras una mala racha. Llega un técnico nuevo con ideas propias y todos empiezan de cero.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Ganártelo en los entrenamientos"), p: 0.7,
      ok: {txt: tr("Tu intensidad le convence enseguida. Eres de sus fijos."), fx: {coachSet: 68, prof: 4}},
      ko: {txt: tr("Le gustas, pero prefiere a otros en tu puesto de momento."), fx: {coachSet: 50, prof: 4}}},
    {t: tr("Hablar con él el primer día"), p: 0.5,
      ok: {txt: tr("Conectáis desde la primera charla. Te quiere como líder."), fx: {coachSet: 72, mor: 4}},
      ko: {txt: tr("Le parece que te adelantas. Mal comienzo."), fx: {coachSet: 42}}}
  ]; }});

EV({id: "competencia", tipo: "real", cat: "Vestuario", title: "Fichan a un rival en tu posición",
  when: function (x) { return x.inSeason && x.role !== "Estrella"; }, w: 1,
  text: function (x) { return tr("El {club} cierra el fichaje de un internacional que juega en tu puesto. La prensa ya habla de quién será el titular.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Redoblar esfuerzos"), ok: {txt: tr("Te lo tomas como un reto. Entrenas a otro nivel."), fx: {prof: 6, fit: -5, buff: {v: 1.5, b: 2, n: tr("Competencia sana")}}}},
    {t: tr("Pedir garantías al club"), p: 0.5,
      ok: {txt: tr("El director deportivo te tranquiliza: cuentan contigo."), fx: {mor: 6}},
      ko: {txt: tr("Respuesta ambigua. Te quedas con la mosca detrás de la oreja."), fx: {mor: -5, coach: -3}}},
    {t: tr("Pedir salir"), ok: {txt: tr("Comunicas que quieres buscar minutos fuera."), fx: {coach: -6, flag: {wantOut: true}}, n: tr("Más ofertas en el próximo mercado")}}
  ]; }});

EV({id: "patrocinio", tipo: "real", cat: "Dinero", title: "Oferta de patrocinio",
  when: function (x) { return x.p.fame >= 28; }, w: 1, cd: 3,
  text: function () { return tr("Tu agente tiene dos propuestas sobre la mesa: una marca deportiva de primer nivel y una bebida energética que paga el doble."); },
  opts: function (x) { var s = x.p.con ? x.p.con.sal : 100000, m1 = Math.round(s * 0.4 / 1000) * 1000, f1 = Math.round(x.p.fame * 2); return [
    {t: tr("Marca deportiva"), d: tr("Prestigio y buena imagen."), p: 0.85,
      ok: {txt: tr("Tus botas nuevas salen en todas las tiendas."), fx: {money: m1, fol: f1, fame: 3}},
      ko: {txt: tr("Tantos eventos te restan descanso."), fx: {money: m1, fol: f1, fame: 3, form: -4}}},
    {t: tr("Bebida energética"), d: tr("Mucho dinero, imagen discutida."), ok: {txt: tr("Llenas la cuenta, aunque a parte de la afición no le hace gracia."), fx: {money: Math.round(s * 0.8 / 1000) * 1000, fans: -6, fame: 4}}},
    {t: tr("Rechazar y centrarte"), ok: {txt: tr("Nada de distracciones: primero el fútbol."), fx: {prof: 4}}}
  ]; }});

EV({id: "documental", tipo: "aleatoria", cat: "Fama", title: "Un documental sobre ti",
  when: function (x) { return x.p.fame >= 55; }, w: 0.8, once: true,
  text: function () { return tr("Una plataforma de streaming quiere grabar tu temporada: cámaras en casa, en el vestuario y en el autobús."); },
  opts: function () { return [
    {t: tr("Aceptar"), p: 0.65,
      ok: {txt: tr("La serie arrasa en audiencia. Ahora te conocen hasta en Japón."), fx: {money: 300000, fol: 250, fame: 6}},
      ko: {txt: tr("Las cámaras incomodan al vestuario y te distraen."), fx: {money: 300000, fol: 200, fame: 5, form: -8, coach: -5}}},
    {t: tr("Rechazar"), ok: {txt: tr("Tu vida privada sigue siendo tuya."), fx: {prof: 2}}}
  ]; }});

EV({id: "radio", tipo: "aleatoria", cat: "Prensa", title: "Invitado en la radio",
  when: function (x) { return x.p.fame >= 12; }, w: 1,
  text: function () { return tr("Un programa deportivo de medianoche te invita a una tertulia en directo. Los tertulianos tienen fama de picar a los invitados."); },
  opts: function () { return [
    {t: tr("Ir y hablar claro"), p: 0.7,
      ok: {txt: tr("Caes de pie: cercano, divertido y sin pelos en la lengua."), fx: {fame: 3, fol: 12, mor: 3}},
      ko: {txt: tr("Una frase sobre el vestuario se convierte en titular. Al míster no le gusta."), fx: {fame: 3, coach: -6}}},
    {t: tr("Mandar un audio"), ok: {txt: tr("Un saludo breve y a dormir."), fx: {fame: 1, fit: 2}}},
    {t: tr("Decir que no"), ok: {txt: tr("A medianoche se duerme."), fx: {fit: 4}}}
  ]; }});

EV({id: "sub21", tipo: "real", cat: "Selección", title: "Convocatoria con la sub-21",
  when: function (x) { return x.inSeason && x.age <= 21 && x.p.intl.caps === 0; }, w: 1,
  text: function (x) { return tr("La sub-21 de {country} te llama para dos partidos. La selección absoluta sigue de cerca a sus jóvenes.", {country: x.nat}); },
  opts: function () { return [
    {t: tr("Ir con la sub-21"), p: 0.6,
      ok: {txt: tr("Marcas diferencias. El seleccionador absoluto toma nota."), fx: {fame: 3, mor: 5, fit: -5, buff: {v: 1, b: 1, n: tr("Con la sub-21")}}},
      ko: {txt: tr("Experiencia útil, aunque vuelves cansado del viaje."), fx: {fame: 1, fit: -8}}},
    {t: tr("Pedir quedarte en el club"), ok: {txt: tr("El club lo agradece; la federación, no tanto."), fx: {coach: 5, fame: -1}}}
  ]; }});

EV({id: "vestuario_dividido", tipo: "real", cat: "Vestuario", title: "Vestuario dividido",
  when: function (x) { return x.inSeason; }, w: 0.8,
  text: function () { return tr("Los veteranos están enfrentados con el míster por los métodos de entrenamiento. Todos esperan a ver de qué lado te pones."); },
  opts: function () { return [
    {t: tr("Apoyar al míster"), ok: {txt: tr("El técnico te ve como uno de los suyos. Algún veterano te retira el saludo."), fx: {coach: 10, mor: -3}}},
    {t: tr("Ponerte con los veteranos"), p: 0.4,
      ok: {txt: tr("El vestuario se une y empieza una racha de victorias."), fx: {coach: -5, mor: 6, fans: 4}},
      ko: {txt: tr("El grupo te respeta, pero el míster te aparta."), fx: {coach: -10, mor: 4}}},
    {t: tr("Mantenerte al margen"), ok: {txt: tr("Tú a lo tuyo: entrenar y jugar."), fx: {prof: 2}}}
  ]; }});

EV({id: "canterano", tipo: "real", cat: "Vestuario", title: "Un canterano te pide consejo",
  when: function (x) { return x.inSeason && x.age >= 26; }, w: 0.8,
  text: function () { return tr("Un chaval de 17 años sube al primer equipo y te pide que le ayudes a adaptarse. Te recuerda a ti hace unos años."); },
  opts: function () { return [
    {t: tr("Ayudarle"), ok: {txt: tr("Le enseñas lo que a ti te enseñaron. Te sientes bien y el míster lo valora."), fx: {mor: 5, coach: 4, prof: 2}}},
    {t: tr("No es tu problema"), ok: {txt: tr("Tienes bastante con lo tuyo."), fx: {coach: -2}}}
  ]; }});

EV({id: "lesion_estrella", tipo: "real", cat: "Oportunidad", title: "Se lesiona la estrella",
  when: function (x) { return x.inSeason && (x.role === "Rotación" || x.role === "Suplente" || x.role === "Promesa"); }, w: 1.4,
  text: function () { return tr("El jugador más importante del equipo cae lesionado para un mes. Se abre un hueco en el once."); },
  opts: function () { return [
    {t: tr("Pedir paso"), p: 0.6,
      ok: {txt: tr("El míster te da la oportunidad y la aprovechas."), fx: {coach: 8, buff: {v: 2, b: 1, n: tr("Oportunidad")}, mor: 6}},
      ko: {txt: tr("Te la da, pero los nervios te juegan una mala pasada."), fx: {coach: 2, form: -6}}},
    {t: tr("Esperar tu momento"), ok: {txt: tr("Paciencia. Tu turno llegará."), fx: {prof: 3, coach: 3}}}
  ]; }});

EV({id: "rumor_grande", tipo: "real", cat: "Mercado", title: "Un grande pregunta por ti",
  when: function (x) { return x.inSeason && x.p.ovr >= x.clubR + 1 && x.p.fame >= 20; }, w: 1.2,
  text: function (x) { return tr("La prensa publica que un club de Champions ha preguntado por ti. La afición del {club} está pendiente de tu reacción.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Alimentar el rumor"), ok: {txt: tr("Tu sonrisa en zona mixta lo dice todo. Se dispara tu cotización… y los pitos."), fx: {fame: 4, fans: -8, coach: -5, flag: {wantOut: true}}, n: tr("Más ofertas en el próximo mercado")}},
    {t: tr("Besar el escudo"), ok: {txt: tr("Celebras tu siguiente gol besando el escudo. La grada se rinde."), fx: {fans: 10, coach: 5}}},
    {t: tr("No decir nada"), ok: {txt: tr("Silencio. Que hable el campo."), fx: {prof: 2}}}
  ]; }});

EV({id: "idioma", tipo: "real", cat: "Adaptación", title: "Clases de idioma",
  when: function (x) { return x.inSeason && x.abroad && !x.p.flags.lang; }, w: 1.5, once: true,
  text: function () { return tr("Juegas lejos de casa y todavía te cuesta entender las charlas del míster."); },
  opts: function () { return [
    {t: tr("Clases intensivas"), ok: {txt: tr("En tres meses ya bromeas con los utilleros."), fx: {money: -10000, mor: 6, coach: 6, flag: {lang: true}}}},
    {t: tr("Ya te apañarás"), ok: {txt: tr("Te comunicas a gestos. Algunas instrucciones se pierden por el camino."), fx: {mor: -3, coach: -3}}}
  ]; }});

/* ============ HECHOS REALES: MERCADO Y CONTRATOS ============ */
EV({id: "precontrato_electoral", tipo: "real", cat: "Mercado", title: "Un candidato quiere tu firma", once: true, w: 0.8,
  ref: "Julio de 2000: Florentino Pérez ganó las elecciones del Real Madrid tras presentar un precontrato con Luís Figo, la estrella del Barcelona. Figo acabó fichando por el eterno rival.",
  when: function (x) { return x.inSeason && x.p.fame >= 40 && x.p.ovr >= 78 && !x.p.loan && x.giant() >= 0; },
  text: function (x) { var g = clubName(x.giant()); return tr("Se acercan las elecciones a la presidencia del {giant}. Uno de los candidatos te ofrece una fortuna por firmar un precontrato: si gana, pagará tu cláusula en verano. Si se filtra, en el {club} te lo harán pagar.", {giant: g, club: x.club}); },
  opts: function (x) { var gi = x.giant(), g = clubName(gi); return [
    {t: tr("Firmar el precontrato"), d: tr("Prima de 500 k€ ya mismo."), p: 0.55,
      ok: {txt: tr("El candidato gana las elecciones gracias a tu nombre. En verano tendrás su oferta sobre la mesa… y en tu club ya te llaman traidor."), fx: {money: 500000, fans: -15, coach: -6, fame: 4, flag: {promise: gi, traitor: S.p.club}}, n: tr("Oferta segura del {giant} en verano", {giant: g})},
      ko: {txt: tr("El candidato pierde y el precontrato sale a la luz. Pasas de ídolo a sospechoso."), fx: {money: 500000, fans: -18, coach: -10, mor: -6}}},
    {t: tr("Rechazarlo y contarlo en el vestuario"), ok: {txt: tr("Lo cuentas tal cual. La afición te adora aún más."), fx: {fans: 10, coach: 5, prof: 3}}},
    {t: tr("Rechazarlo en silencio"), ok: {txt: tr("Cuelgas el teléfono y a otra cosa."), fx: {prof: 2}}}
  ]; }});

EV({id: "vuelta_ex", tipo: "real", cat: "Afición", title: "Vuelves a tu antiguo estadio", cd: 3, w: 3,
  ref: "Noviembre de 2002: en su vuelta al Camp Nou con el Real Madrid, Figo recibió una lluvia de objetos al sacar un córner, entre ellos una cabeza de cochinillo.",
  when: function (x) { var t = x.p.flags.traitor; return x.inSeason && t != null && t >= 0 && t !== x.p.club && S.cl[t] === S.cl[x.p.club]; },
  text: function (x) { var ex = clubName(x.p.flags.traitor); return tr("Vuelves al estadio del {club} con la camiseta de su rival. Silbidos desde el calentamiento, pancartas con tu cara y te toca sacar los córners en ese lado.", {club: ex}); },
  opts: function (x) { var sp = x.scoreP(); return [
    {t: tr("Sacar los córners como siempre"), p: 0.5,
      ok: {txt: tr("Aguantas el chaparrón y das la asistencia del gol. Te ganas el respeto de todos."), fx: {fame: 4, coach: 5, fans: 6, buff: {v: 1, b: 1, n: tr("Sangre fría")}}},
      ko: {txt: tr("Te lanzan de todo, el partido se para y acabas fuera de ti. Tu peor tarde."), fx: {form: -8, mor: -8}}},
    {t: tr("Dejarle los córners a un compañero"), ok: {txt: tr("Te quitas presión. El partido pasa sin pena ni gloria."), fx: {coach: 2, mor: -2}}},
    {t: tr("Si marcas, celebrarlo ante su grada"), p: sp,
      ok: {txt: tr("Marcas y lo celebras delante de ellos. Tu afición te lleva en volandas; la suya no te lo perdonará nunca."), fx: {fans: 10, fame: 5, coach: -2}},
      ko: {txt: tr("No marcas y su grada te despide entre burlas."), fx: {mor: -6, form: -4}}}
  ]; }});

function clausulaDeal(x) {
  var c = x.bigClub(82, "rico"); if (c < 0) return null;
  var fee = Math.max(20e6, Math.round(marketValue() * 1.9 / 1e6) * 1e6);
  return {club: c, fee: fee, sal: Math.round(salaryFor(S.p.ovr, c) * 1.6 / 1000) * 1000, yrs: 5, role: roleFor(S.p.ovr - S.cr[c], S.p.age), loan: false};
}
EV({id: "clausula", tipo: "real", cat: "Mercado", ctx: "verano", title: "Pagan tu cláusula", once: true, w: 1.4,
  ref: "Agosto de 2017: el PSG pagó los 222 millones de euros de la cláusula de Neymar al Barcelona, el traspaso más caro de la historia.",
  when: function (x) { return x.p.ovr >= 80 && !x.p.loan && x.p.con && x.p.con.yrs >= 2 && marketValue() >= 3e7 && x.bigClub(82, "rico") >= 0; },
  text: function (x) { var d = clausulaDeal(x); return tr("El {buyer} está dispuesto a pagar tu cláusula de rescisión: {fee}. No necesita el permiso del {club}: basta con que digas que sí.", {buyer: clubName(d.club), fee: fmtMoney(d.fee), club: x.club}); },
  opts: function (x) { var d = clausulaDeal(x); return [
    {t: tr("Que paguen la cláusula"), d: trn(d.yrs, "{salary} al año durante {n} año.", "{salary} al año durante {n} años.", {salary: fmtMoney(d.sal)}), ok: {txt: tr("Firmas el traspaso más sonado del verano."), fx: {fame: 6, fans: -10}, n: tr("Fichas por el {club}", {club: clubName(d.club)}), then: function () { acceptOffer(d); }}},
    {t: tr("Usarlo para renovar al alza"), p: 0.65,
      ok: {txt: tr("El {club} iguala la apuesta: te sube el sueldo un 50 % y amplía tu contrato.", {club: x.club}), fx: {sal: 1.5, yrs: S.p.con.yrs + 2, mor: 5, coach: 3}, n: tr("Contrato ampliado dos años")},
      ko: {txt: tr("El club no mueve un dedo y la oferta se esfuma. Te quedas con cara de tonto."), fx: {mor: -8, coach: -3}}},
    {t: tr("Quedarte por fidelidad"), ok: {txt: tr("Rechazas la fortuna. La afición te hace una pancarta gigante."), fx: {fans: 12, coach: 4, mor: 2}}}
  ]; }});

EV({id: "burofax", tipo: "real", cat: "Mercado", ctx: "verano", title: "Quieres salir", once: true, w: 1.2,
  ref: "Agosto de 2020: Messi comunicó al Barcelona por burofax que quería marcharse. El club se aferró a su cláusula de 700 millones y Messi se quedó un año más.",
  when: function (x) {
    var last = x.p.seasons[x.p.seasons.length - 1];
    return x.yrsAtClub >= 4 && x.p.fame >= 40 && x.age >= 26 && !x.p.loan && x.p.con && x.p.con.yrs >= 1 && (!last || !last.tro.length || x.p.mor < 55);
  },
  text: function (x) { return trn(x.yrsAtClub, "Llevas {n} temporada en el {club} y sientes que el proyecto se ha agotado. Tu abogado cree que una cláusula de tu contrato te permite salir gratis si lo comunicas a tiempo.", "Llevas {n} temporadas en el {club} y sientes que el proyecto se ha agotado. Tu abogado cree que una cláusula de tu contrato te permite salir gratis si lo comunicas a tiempo.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Enviar un burofax pidiendo salir"), p: 0.3,
      ok: {txt: tr("El club acepta tu salida. Tienes vía libre para escuchar ofertas."), fx: {fans: -10, coach: -6, mor: 6, flag: {wantOut: true}}, n: tr("Recibes ofertas este mismo verano"),
        then: function () { S.pend.push({k: "offers", list: genOffers("verano"), kind: "verano", forced: false}); }},
      ko: {txt: tr("El club se agarra a tu cláusula de rescisión y no te deja salir. Te quedas, pero nada vuelve a ser igual."), fx: {fans: -12, coach: -10, mor: -10}}},
    {t: tr("Hablarlo en privado con el presidente"), p: 0.55,
      ok: {txt: tr("Te prometen fichajes y un proyecto ganador. Recuperas la ilusión."), fx: {mor: 8, coach: 3}},
      ko: {txt: tr("Promesas vacías. Sales de la reunión igual que entraste."), fx: {mor: -4}}},
    {t: tr("Seguir sin decir nada"), ok: {txt: tr("Te lo guardas. Otra temporada más."), fx: {prof: 2, mor: -3}}}
  ]; }});

EV({id: "ultimo_minuto", tipo: "real", cat: "Contrato", title: "Renovación de última hora", once: true, w: 2,
  ref: "Mayo de 2022: con su fichaje por el Real Madrid casi cerrado, Mbappé renovó por sorpresa con el PSG.",
  when: function (x) { return x.inSeason && S.bi >= 3 && x.p.con && x.p.con.yrs === 1 && !x.p.loan && x.p.ovr >= 78 && x.bigClub(84, "ult") >= 0; },
  text: function (x) { var g = clubName(x.bigClub(84, "ult")); return tr("Todo el mundo da por hecho que en verano te irás gratis al {bigClub}. A última hora, el {club} te pone delante el contrato más alto de su historia y hasta voz en las decisiones deportivas.", {bigClub: g, club: x.club}); },
  opts: function (x) { var gi = x.bigClub(84, "ult"), g = clubName(gi); return [
    {t: tr("Renovar en el último minuto"), ok: {txt: tr("Firmas por sorpresa. En tu club te reciben como a un rey; en el {bigClub} no te lo perdonarán.", {bigClub: g}), fx: {yrs: 4, sal: 1.8, fans: 10, coach: 6, fame: 3, flag: {frozen: false, snub: gi}}, n: tr("Contrato hasta {year} · el {bigClub} no volverá a llamar", {year: S.yr + 4, bigClub: g})}},
    {t: tr("Cumplir tu palabra con el {bigClub}", {bigClub: g}), ok: {txt: tr("Confirmas que te irás. Lo que queda de temporada será largo."), fx: {fans: -10, coach: -5, mor: 4, flag: {promise: gi}}, n: tr("Su oferta llegará en verano")}},
    {t: tr("Esperar hasta el final"), ok: {txt: tr("Dejas pasar los días sin decidir. Las dos partes empiezan a impacientarse."), fx: {mor: -2}}}
  ]; }});

function saudiDeal(x) {
  var l = (W.lgIdx.KSA1 != null ? teamsOfLeague(W.lgIdx.KSA1) : []).filter(function (c) { return c !== S.p.club; }).sort(byRating).slice(0, 5);
  if (!l.length) return null;
  var c = X.spick(l, "ksa"), free = S.p.con && S.p.con.yrs <= 0;
  return {club: c, sal: Math.round(Math.max(salaryFor(S.p.ovr, c) * 3, (S.p.con ? S.p.con.sal : 0) * 2.5) / 1000) * 1000, yrs: 2, fee: free ? 0 : Math.round(marketValue() * 1.1 / 1e5) * 1e5, role: N_("Estrella"), loan: false, mega: true};
}
EV({id: "arabia", tipo: "real", cat: "Mercado", ctx: "verano", title: "Llamada de Arabia Saudí", cd: 3, w: 1,
  ref: "Diciembre de 2022: Cristiano Ronaldo fichó por el Al-Nassr saudí con un sueldo de récord.",
  when: function (x) { return x.age >= 30 && x.p.ovr >= 76 && !x.p.loan && W.lg[S.cl[x.p.club]] && W.lg[S.cl[x.p.club]].id !== "KSA1" && !!saudiDeal(x); },
  text: function (x) { var d = saudiDeal(x); return tr("El {club} te ofrece {salary} al año, varias veces lo que cobras ahora. Te aseguran que su liga está creciendo y que no serás la única estrella.", {club: clubName(d.club), salary: fmtMoney(d.sal)}); },
  opts: function (x) { var d = saudiDeal(x); return [
    {t: tr("Aceptar la oferta"), d: trn(d.yrs, "{n} año de contrato.", "{n} años de contrato."), ok: {txt: tr("Te recibe un estadio lleno y una alfombra roja."), fx: {fame: 2}, n: tr("Fichas por el {club}", {club: clubName(d.club)}), then: function () { acceptOffer(d); }}},
    {t: tr("Seguir en la élite"), ok: {txt: tr("Aún te quedan cosas que demostrar en Europa."), fx: {mor: 3, prof: 2}}}
  ]; }});

function faxDeal(x) {
  var c = x.bigClub(S.cr[S.p.club] + 3, "fax"); if (c < 0) return null;
  return {club: c, fee: Math.round(marketValue() * 1.2 / 1e5) * 1e5, sal: Math.round(salaryFor(S.p.ovr, c) * 1.25 / 1000) * 1000, yrs: 5, role: roleFor(S.p.ovr - S.cr[c], S.p.age), loan: false};
}
EV({id: "fax", tipo: "real", cat: "Mercado", ctx: "verano", title: "Último día de mercado", cd: 4, w: 0.9,
  ref: "31 de agosto de 2015: el fichaje de David de Gea por el Real Madrid se cayó porque la documentación llegó a LaLiga minutos después del cierre del mercado.",
  when: function (x) { return x.p.ovr >= 74 && !x.p.loan && x.p.con && x.p.con.yrs >= 1 && !!faxDeal(x); },
  text: function (x) { var d = faxDeal(x); return tr("Último día de mercado. El {buyer} y el {club} han cerrado tu traspaso por {fee}, pero los papeles tienen que llegar a la liga antes de medianoche y quedan horas.", {buyer: clubName(d.club), club: x.club, fee: fmtMoney(d.fee)}); },
  opts: function (x) { var d = faxDeal(x); return [
    {t: tr("Firmar a toda prisa"), p: 0.5 + x.p.agent * 0.15,
      ok: {txt: tr("Los documentos llegan con minutos de margen. ¡Eres nuevo jugador del {club}!", {club: clubName(d.club)}), fx: {}, n: tr("Fichas por el {club}", {club: clubName(d.club)}), then: function () { acceptOffer(d); }},
      ko: {txt: tr("Los papeles llegan tarde y el traspaso se cae. Vuelves a un vestuario que ya te había despedido."), fx: {mor: -12, coach: -6, fans: -4}}},
    {t: tr("Pedir esperar al próximo mercado"), ok: {txt: tr("Prefieres no correr. El club toma nota de tu paciencia."), fx: {mor: -3, coach: 2}}},
    {t: tr("Quedarte"), ok: {txt: tr("No te gusta cómo se ha hecho y te quedas. La afición lo celebra."), fx: {fans: 6, coach: 4}}}
  ]; }});

/* ============ HECHOS REALES: CONDUCTA Y DISCIPLINA ============ */
EV({id: "cantona", tipo: "real", cat: "Disciplina", title: "Insultos camino del túnel", w: 6, cd: 3,
  ref: "Enero de 1995: Éric Cantona, recién expulsado, respondió con una patada de kung-fu a un aficionado del Crystal Palace que le insultaba. Le cayeron ocho meses de sanción.",
  when: function (x) { return x.inSeason && !!x.p.flags.recentRed; },
  text: function () { return tr("Te acaban de expulsar. Camino del túnel, un aficionado rival baja hasta la valla y te dedica insultos muy graves."); },
  opts: function (x) { return [
    {t: tr("Saltar a por él"), ok: {good: false, txt: tr("Saltas la valla. La imagen abre todos los telediarios: sanción larguísima y multa."), fx: {susp: 10, money: -150000, fans: -10, coach: -15, fame: 3, mor: -10}}},
    {t: tr("Contestarle sin acercarte"), p: 0.55,
      ok: {txt: tr("Le dices cuatro cosas desde lejos y los auxiliares te llevan dentro."), fx: {mor: 2}},
      ko: {txt: tr("Las cámaras lo captan: un partido más de sanción por conducta antideportiva."), fx: {susp: 1, fans: -3}}},
    {t: tr("Seguir hacia el vestuario"), ok: {txt: tr("Ni le miras. Esa misma noche el club alaba tu templanza."), fx: {prof: 4, coach: 3}}}
  ]; }});

EV({id: "forzar_amarilla", tipo: "real", cat: "Disciplina", title: "Limpiar tarjetas", cd: 2, w: 1.8,
  ref: "Febrero de 2019: Sergio Ramos admitió haber forzado una amarilla ante el Ajax para limpiar tarjetas. La UEFA le sancionó con dos partidos y el Real Madrid cayó en la vuelta.",
  when: function (x) { return x.inSeason && S.bi >= 3 && (x.g === "DEF" || x.p.pos === "MCD") && !!x.aliveKO(); },
  text: function (x) { var c = x.aliveKO(); return tr("Ida de la eliminatoria de {comp}: vais ganando con comodidad y estás apercibido. Si ves una amarilla ahora, cumplirías el partido de vuelta y llegarías limpio a la siguiente ronda.", {comp: trComp(c.n)}); },
  opts: function () { return [
    {t: tr("Forzar la amarilla"), p: 0.45,
      ok: {txt: tr("Una pérdida de tiempo de manual: amarilla y nadie se da cuenta. Llegarás limpio."), fx: {buff: {v: 1, b: 1, n: tr("Limpio de tarjetas")}, coach: 2}},
      ko: {txt: tr("Te pillan las cámaras y la competición abre expediente: dos partidos de sanción y críticas por todas partes."), fx: {susp: 2, fame: -2, fans: -4, coach: -4}}},
    {t: tr("Jugar limpio"), ok: {txt: tr("Si llega la amarilla, que llegue sola."), fx: {prof: 3}}}
  ]; }});

EV({id: "fiscal", tipo: "aleatoria", cat: "Dinero", title: "La sociedad en el paraíso fiscal", once: true, w: 0.9,
  ref: "En la década de 2010 varias estrellas de LaLiga fueron condenadas por defraudar a Hacienda con sus derechos de imagen.",
  when: function (x) { return x.p.money >= 1e6 && x.p.fame >= 30; },
  text: function () { return tr("Un asesor te propone llevar tus derechos de imagen a una sociedad en un paraíso fiscal. «Lo hace todo el mundo», asegura. Te ahorrarías mucho dinero."); },
  opts: function (x) { var m = x.p.money; return [
    {t: tr("Firmar la estructura"), p: 0.35,
      ok: {txt: tr("Nadie pregunta. Tu cuenta engorda… de momento."), fx: {money: Math.round(m * 0.12 / 1000) * 1000}},
      ko: {txt: tr("Hacienda te investiga: multa enorme, juicio y tu imagen por los suelos."), fx: {money: -Math.round(m * 0.35 / 1000) * 1000, fame: -6, fans: -10, mor: -10}}},
    {t: tr("Pagar todo aquí"), ok: {txt: tr("Pagas lo que toca y duermes tranquilo."), fx: {prof: 4, fans: 3}}},
    {t: tr("Contratar un despacho serio ({cost})", {cost: fmtMoney(60000)}), ok: {txt: tr("Optimizas lo que la ley permite, ni un euro más."), fx: {money: -60000, prof: 2, mor: 2}}}
  ]; }});

EV({id: "redencion", tipo: "real", cat: "Selección", ctx: "any", title: "El villano del país", w: 5, cd: 2,
  ref: "Mundial 1998: Beckham fue expulsado ante Argentina y se convirtió en el villano de Inglaterra. En 2001 su falta en el descuento contra Grecia clasificó a su país para el Mundial.",
  when: function (x) { var v = x.p.flags.natVillain; return v != null && S.yr - v <= 1 && x.p.inat >= 0; },
  text: function (x) { return tr("Tu error con {country} sigue persiguiéndote: muñecos con tu cara, abucheos en cada estadio y portadas pidiendo que no vuelvas a la selección.", {country: x.nat}); },
  opts: function () { return [
    {t: tr("Responder en el campo"), p: 0.6,
      ok: {txt: tr("Partido a partido te ganas otra vez a la gente. Cuando llegue tu momento, estarás listo."), fx: {prof: 4, mor: 6, buff: {v: 1, b: 2, n: tr("Sed de revancha")}, flag: {natVillain: null}}},
      ko: {txt: tr("Los pitos te pesan más de lo que esperabas. Sigues sin encontrarte."), fx: {mor: -8, form: -6}}},
    {t: tr("Pedir perdón públicamente"), ok: {txt: tr("Tu disculpa sincera calma los ánimos."), fx: {fans: 4, mor: -3, flag: {natVillain: null}}}},
    {t: tr("Renunciar a la selección un año"), ok: {txt: tr("Te apartas un tiempo para recuperar la cabeza."), fx: {mor: 5, fit: 6, fame: -4, flag: {natBreak: S.yr + 1, natVillain: null}}, n: tr("Sin convocatorias hasta la próxima temporada")}}
  ]; }});

/* ============ HECHOS REALES: CELEBRACIONES Y MEDIOS ============ */
EV({id: "petardos", tipo: "aleatoria", cat: "Vida", title: "Fuego en casa la víspera del derbi", once: true, w: 0.8,
  ref: "Octubre de 2011: horas después de que unos petardos incendiaran su casa, Balotelli marcó en el derbi de Mánchester y enseñó una camiseta con el lema «Why always me?».",
  when: function (x) { return x.inSeason && x.age >= 19 && x.derbyRival() >= 0; },
  text: function (x) { return tr("La víspera del derbi contra el {rival}, un amigo lanza petardos en tu casa y acaba prendiendo fuego al baño. Los bomberos se marchan de madrugada y la noticia ya está en todas las portadas.", {rival: clubName(x.derbyRival())}); },
  opts: function () { return [
    {t: tr("Jugar el derbi igualmente"), p: 0.5,
      ok: {txt: tr("Marcas y levantas la camiseta: «¿Por qué siempre yo?». La foto da la vuelta al mundo."), fx: {fame: 5, fol: 80, fans: 6, buff: {v: 1, b: 1, n: tr("Imparable")}}},
      ko: {txt: tr("No has dormido y se nota: te cambian al descanso entre pitos."), fx: {form: -8, fit: -6, coach: -4}}},
    {t: tr("Pedir no jugar"), ok: {txt: tr("El míster lo entiende a medias. Te quedas en casa recogiendo cenizas."), fx: {coach: -5, mor: 3, fit: 4}}},
    {t: tr("Pedir perdón en redes con humor"), p: 0.7,
      ok: {txt: tr("Tu vídeo dando las gracias a los bomberos se hace viral y te ganas a todo el mundo."), fx: {fol: 40, fans: 4}},
      ko: {txt: tr("El humor no cae bien: la prensa te acusa de frivolizar."), fx: {fans: -6, coach: -3}}}
  ]; }});

EV({id: "golf", tipo: "aleatoria", cat: "Selección", title: "La bandera de la fiesta", once: true, w: 0.9,
  ref: "Noviembre de 2019: tras clasificar a Gales para la Eurocopa, Gareth Bale posó con una bandera que decía «Gales. Golf. Madrid. En ese orden». En el Bernabéu no gustó nada.",
  when: function (x) { return x.inSeason && x.abroad && x.p.intl.caps >= 10 && x.p.fame >= 35 && S.bi >= 1 && x.p.inat >= 0; },
  text: function (x) { return tr("Celebráis con {country} la clasificación para el gran torneo. En plena fiesta, tus compañeros te pasan una bandera de broma: «{country}. Golf. {club}. En ese orden».", {country: x.nat, club: x.club}); },
  opts: function () { return [
    {t: tr("Posar con la bandera"), ok: {txt: tr("La foto arrasa en tu país… y escuece en tu club."), fx: {fame: 3, fol: 30, fans: -10, coach: -6}}},
    {t: tr("Celebrar sin la bandera"), ok: {txt: tr("Bailas con todos y la bandera se queda en un rincón."), fx: {mor: 4}}}
  ]; }});

EV({id: "camiseta_derbi", tipo: "aleatoria", cat: "Afición", title: "Un mensaje bajo la camiseta", cd: 3, w: 0.9,
  ref: "Abril de 1999: Francesco Totti marcó en el derbi de Roma y enseñó una camiseta que decía «Vi ho purgato ancora» («Os he vuelto a purgar»).",
  when: function (x) { return x.inSeason && x.p.fame >= 15 && x.p.pos !== "POR" && x.derbyRival() >= 0; },
  text: function (x) { return tr("Llega el derbi contra el {rival}. Un amigo te ha preparado una camiseta interior con un mensaje para la afición rival, para enseñarla si marcas.", {rival: clubName(x.derbyRival())}); },
  opts: function (x) { return [
    {t: tr("Llevarla puesta"), p: x.scoreP(),
      ok: {txt: tr("Marcas y enseñas el mensaje. Tu grada enloquece; la rival te tendrá en su lista negra para siempre."), fx: {fans: 10, fame: 4, fol: 25, coach: -2}},
      ko: {txt: tr("No marcas… y la camiseta acaba en manos de la prensa. Te conviertes en el chiste del derbi."), fx: {mor: -8, fans: -4, fame: -1}}},
    {t: tr("Dejarla en casa"), ok: {txt: tr("Mejor que hablen tus botas."), fx: {prof: 2}}}
  ]; }});

EV({id: "celebrar_ex", tipo: "real", cat: "Afición", title: "Contra tu antiguo club", cd: 3, w: 1.6,
  ref: "Septiembre de 2009: Emmanuel Adebayor marcó al Arsenal, su exequipo, y recorrió el campo entero para celebrarlo ante la grada rival. Acabó multado por la federación inglesa.",
  when: function (x) { return x.inSeason && x.p.fame >= 15 && x.exClub() >= 0; },
  text: function (x) { return tr("Esta semana te mides al {club}, el club que te dejó marchar. Su grada lleva días cantando contra ti. ¿Cómo lo celebrarás si marcas?", {club: clubName(x.exClub())}); },
  opts: function (x) { var sp = x.scoreP(); return [
    {t: tr("Correr a celebrarlo ante su grada"), p: sp,
      ok: {txt: tr("Marcas y cruzas el campo entero para celebrarlo delante de ellos. Tu afición te adora; la federación te multa."), fx: {fans: 8, fame: 3, money: -25000, susp: 1, coach: -3}},
      ko: {txt: tr("No marcas y su grada se ríe de ti todo el partido."), fx: {mor: -6}}},
    {t: tr("No celebrarlo por respeto"), p: sp,
      ok: {txt: tr("Marcas y levantas las manos en señal de respeto. Ovación de las dos aficiones."), fx: {fame: 3, fans: 3, prof: 3}},
      ko: {txt: tr("No marcas, pero tu actitud se valora."), fx: {prof: 2}}}
  ]; }});

EV({id: "homenaje", tipo: "real", cat: "Vestuario", title: "Un homenaje bajo la camiseta", once: true, w: 0.5,
  ref: "Julio de 2010: Andrés Iniesta marcó el gol que dio el Mundial a España y enseñó una camiseta en recuerdo de Dani Jarque. Le costó una amarilla.",
  when: function (x) { return x.inSeason && x.age >= 20 && S.bi >= 2 && x.p.pos !== "POR"; },
  text: function () { return tr("Un antiguo compañero tuyo de la cantera falleció hace unos meses. Antes de un partido importante, tu familia te regala una camiseta interior con un mensaje en su recuerdo."); },
  opts: function (x) { return [
    {t: tr("Llevarla y enseñarla si marcas"), p: x.scoreP(),
      ok: {txt: tr("Marcas y enseñas su nombre al mundo. Te cae una amarilla, pero nadie la recuerda: todos recuerdan el gesto."), fx: {fans: 10, fame: 4, mor: 8}},
      ko: {txt: tr("No marcas, pero la camiseta se conoce después del partido y emociona igual."), fx: {fans: 4, mor: 4}}},
    {t: tr("Dedicarle el partido en privado"), ok: {txt: tr("Le recuerdas en silencio antes de saltar al campo."), fx: {mor: 5}}}
  ]; }});

/* ============ HECHOS REALES: EQUIPO Y TÍTULOS ============ */
EV({id: "arenga", tipo: "real", cat: "Vestuario", title: "Corro en el césped", cd: 2, w: 1.6,
  ref: "Abril de 2014: Gerrard reunió al Liverpool tras ganar al City: «¡Esto no se nos escapa ahora!». Dos semanas después resbaló ante el Chelsea y la Premier se escapó.",
  when: function (x) { return x.inSeason && S.bi >= 3 && x.lgPos >= 1 && x.lgPos <= 2 && (x.p.flags.captain || x.age >= 27); },
  text: function () { return tr("Acabáis de ganar a un rival directo y la liga está a tiro. Antes de que nadie se mueva, reúnes al equipo en el césped."); },
  opts: function () { return [
    {t: tr("«¡Esto no se nos escapa!»"), p: 0.6,
      ok: {txt: tr("El grito se convierte en el lema de la temporada. El equipo vuela."), fx: {fans: 6, mor: 6, buff: {v: 1.5, b: 2, n: tr("Arenga")}}},
      ko: {txt: tr("La presión os pasa factura: un resbalón en el peor momento y el título se complica."), fx: {form: -8, mor: -8, fans: -3}}},
    {t: tr("Mensaje de calma: partido a partido"), ok: {txt: tr("Cabeza fría. Nadie se cree campeón todavía."), fx: {prof: 3, buff: {v: 0.5, b: 1, n: tr("Calma")}}}},
    {t: tr("Dejar hablar al míster"), ok: {txt: tr("Le cedes la palabra. El vestuario lo agradece."), fx: {coach: 3}}}
  ]; }});

EV({id: "superliga", tipo: "real", cat: "Club", title: "Tu club anuncia una Superliga", once: true, w: 0.7,
  ref: "Abril de 2021: doce grandes clubes anunciaron la Superliga europea. Las protestas de los aficionados la tumbaron en menos de 48 horas.",
  when: function (x) { var li = S.cl[x.p.club]; return x.inSeason && x.clubR >= 82 && li >= 0 && W.lg[li].conf === "UEFA" && W.lg[li].t === 1; },
  text: function (x) { return tr("A medianoche, el {club} y otros grandes de Europa anuncian una Superliga cerrada. Los aficionados se manifiestan a las puertas del estadio y la prensa espera tu opinión.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Apoyar al club"), ok: {txt: tr("Te alineas con la directiva. Dos días después el proyecto se hunde y tus palabras quedan ahí."), fx: {coach: 4, fans: -10, fame: -2}, n: tr("La Superliga se cae en 48 horas")}},
    {t: tr("Criticarla en redes"), ok: {txt: tr("«El fútbol es de la gente». Tu mensaje se convierte en bandera de la protesta."), fx: {fans: 10, fame: 3, coach: -6}}},
    {t: tr("No decir nada"), ok: {txt: tr("Esperas a que pase la tormenta. Pasa en dos días."), fx: {}}}
  ]; }});

EV({id: "leicester", tipo: "real", cat: "Mercado", title: "Líderes contra todo pronóstico", once: true, w: 2.5,
  ref: "Temporada 2015/16: el Leicester, que pagaba 5000 a 1 en las casas de apuestas, ganó la Premier League.",
  when: function (x) {
    var li = S.cl[x.p.club]; if (!x.inSeason || S.bi < 3 || li < 0 || W.lg[li].t !== 1) return false;
    var L = S.L[li]; return x.lgPos >= 1 && x.lgPos <= 2 && L.exp.indexOf(x.p.club) >= 5 && x.bigClub(80, "lei") >= 0;
  },
  text: function (x) { return tr("Nadie apostaba un euro por el {club} y vais líderes con el invierno ya pasado. El {bigClub} te tienta con un contrato mejor para el verano.", {club: x.club, bigClub: clubName(x.bigClub(80, "lei"))}); },
  opts: function (x) { var b = x.bigClub(80, "lei"); return [
    {t: tr("Creer en el milagro y quedarte"), ok: {txt: tr("Le das tu palabra al vestuario: os vais a quedar juntos hasta el final."), fx: {fans: 10, mor: 6, buff: {v: 1, b: 2, n: tr("Creer")}, flag: {snub: b}}}},
    {t: tr("Escuchar al grande"), ok: {txt: tr("Le das el sí para verano. El vestuario se entera."), fx: {fans: -6, mor: 2, flag: {promise: b}}, n: tr("Su oferta llegará en verano")}}
  ]; }});

EV({id: "negarse_cambio", tipo: "real", cat: "Vestuario", title: "Cambio para los penaltis", once: true, w: 2.5,
  ref: "Febrero de 2019: Kepa se negó a ser sustituido antes de la tanda en la final de la Copa de la Liga. El Chelsea perdió y el club le multó con una semana de sueldo.",
  when: function (x) { return x.inSeason && x.p.pos === "POR" && !!x.cupAlive(); },
  text: function (x) { return tr("Estáis en la recta final de la {cup}. El míster te avisa: si llegáis a los penaltis, te cambiará por el portero suplente, que es un especialista.", {cup: trComp(x.cupAlive().n)}); },
  opts: function (x) { var fine = Math.round((x.p.con ? x.p.con.sal : 50000) / 52 / 1000) * 1000; return [
    {t: tr("Aceptarlo por el equipo"), ok: {txt: tr("Lo entiendes: primero el equipo."), fx: {coach: 6, mor: -3}}},
    {t: tr("Negarte en público"), p: 0.4,
      ok: {txt: tr("Le dices que no vas a salir… y en la tanda paras dos. Nadie te recuerda el desplante."), fx: {fame: 4, coach: -8, mor: 5}},
      ko: {txt: tr("Te niegas, perdéis la tanda y el club te multa con una semana de sueldo."), fx: {coach: -15, fans: -8, money: -fine}}},
    {t: tr("Pedir que lo decida el capitán"), ok: {txt: tr("El capitán te da la razón al míster. Aceptas."), fx: {prof: 2}}}
  ]; }});

/* ============ IMPREVISTOS DE LA VIDA ============ */
EV({id: "fiesta", tipo: "aleatoria", cat: "Vida", title: "Fiesta en la víspera",
  when: function (x) { return x.inSeason && x.age >= 18; }, w: 1.3,
  text: function (x) { return tr("Unos amigos montan una fiesta en un ático del centro la noche antes de jugar contra el {rival}. «Solo un rato», te prometen.", {rival: x.opp()}); },
  opts: function () { return [
    {t: tr("Ir un rato y volver pronto"), out: [
      {p: 0.5, good: true, txt: tr("Cumples tu palabra: a medianoche estás en casa. Desconectar te sienta bien."), fx: {mor: 5, fit: -3}},
      {p: 0.32, txt: tr("El «rato» se alarga hasta las cuatro. Al día siguiente vas con las piernas pesadas."), fx: {fit: -12, form: -6, coach: -4}},
      {p: 0.18, txt: tr("Alguien sube una foto tuya con una copa a las 3 de la mañana. El club abre expediente."), fx: {coach: -12, fans: -8, fame: 2, money: -30000, form: -4}}]},
    {t: tr("Quedarte en casa"), ok: {txt: tr("Cena ligera y a dormir. Llegas fresco al partido."), fx: {fit: 4, prof: 3, form: 2}}}
  ]; }});

EV({id: "tuit_antiguo", tipo: "aleatoria", cat: "Redes", title: "Un tuit del pasado",
  when: function (x) { return x.p.fame >= 15; }, w: 0.9,
  text: function () { return tr("Alguien rescata un tuit tuyo de cuando tenías 14 años. Es una tontería, pero las redes arden."); },
  opts: function (x) { return [
    {t: tr("Pedir perdón públicamente"), ok: {txt: tr("Disculpa sincera. La polémica se apaga en dos días."), fx: {fans: 2, mor: -3}}},
    {t: tr("Ignorarlo"), p: 0.5,
      ok: {txt: tr("Mañana habrá otra polémica. Nadie se acuerda."), fx: {}},
      ko: {txt: tr("El tema crece y llega a las tertulias. El club no está contento."), fx: {fans: -8, coach: -4}}},
    {t: tr("Borrar todas tus redes"), ok: {txt: tr("Desconexión total. Pierdes seguidores, ganas paz."), fx: {fol: -Math.round(x.p.fol * 0.3), mor: 4}}}
  ]; }});

EV({id: "pelea_entreno", tipo: "aleatoria", cat: "Vestuario", title: "Encontronazo en el entreno",
  when: function (x) { return x.inSeason; }, w: 1,
  text: function () { return tr("Una entrada fea en un rondo y acabáis cara a cara con un compañero. Los demás tienen que separaros."); },
  opts: function () { return [
    {t: tr("Pedir perdón"), ok: {txt: tr("Os dais la mano en el vestuario. Aquí no ha pasado nada."), fx: {coach: 4, mor: -1}}},
    {t: tr("Mantenerte firme"), p: 0.5,
      ok: {txt: tr("El vestuario entiende que no te achantas. Ganas respeto."), fx: {mor: 5}},
      ko: {txt: tr("El club os multa a los dos. El míster os aparta una semana."), fx: {money: -50000, coach: -8}}},
    {t: tr("Que medie el capitán"), ok: {txt: tr("El capitán lo arregla con un par de frases."), fx: {prof: 2}}}
  ]; }});

EV({id: "autografo", tipo: "aleatoria", cat: "Afición", title: "Un niño bajo la lluvia",
  when: function (x) { return x.inSeason; }, w: 1,
  text: function () { return tr("Llegas justo de hora al entrenamiento y un niño con tu camiseta lleva una hora esperándote bajo la lluvia."); },
  opts: function () { return [
    {t: tr("Parar y firmar"), p: 0.6,
      ok: {txt: tr("Foto, autógrafo y abrazo. El vídeo se hace viral."), fx: {fans: 7, fame: 2, fol: 15}},
      ko: {txt: tr("Llegas tarde y te cae una multa, pero mereció la pena."), fx: {fans: 6, fame: 2, money: -5000, coach: -3}}},
    {t: tr("Saludar y seguir"), p: 0.8,
      ok: {txt: tr("Le prometes firmar a la salida y cumples."), fx: {fans: -1}},
      ko: {txt: tr("Alguien lo graba. «El jugador que pasa de los niños»."), fx: {fans: -8}}}
  ]; }});

EV({id: "videojuegos", tipo: "aleatoria", cat: "Vida", title: "Torneo online",
  when: function (x) { return x.inSeason && x.age <= 30; }, w: 1,
  text: function () { return tr("Tus amigos montan un torneo de un videojuego de fútbol que empieza a las once de la noche. Mañana hay entreno a las nueve."); },
  opts: function () { return [
    {t: tr("Jugar hasta el final"), p: 0.25,
      ok: {txt: tr("Ganas el torneo, lo emites en directo y se vuelve viral."), fx: {mor: 6, fit: -10, fol: 40, fame: 2}},
      ko: {txt: tr("A las cuatro de la mañana sigues en la final. El entreno se te hace eterno."), fx: {mor: 5, fit: -10, form: -4}}},
    {t: tr("Una partida y a dormir"), ok: {txt: tr("Disciplina. Tu fisio te lo agradece."), fx: {mor: 2, fit: 2}}}
  ]; }});

EV({id: "intoxicacion", tipo: "aleatoria", cat: "Salud", title: "Algo te sentó mal",
  when: function (x) { return x.inSeason; }, w: 0.9,
  text: function (x) { return tr("Te despiertas a las 5 con el estómago revuelto. Esta tarde juegas contra el {opp}.", {opp: x.opp()}); },
  opts: function () { return [
    {t: tr("Jugar igualmente"), p: 0.55,
      ok: {txt: tr("Ni se nota. Partidazo y el míster lo destaca en rueda de prensa."), fx: {coach: 4, fans: 3}},
      ko: {txt: tr("Sin fuerzas. Te cambian al descanso y tardas días en recuperarte."), fx: {form: -10, fit: -15}}},
    {t: tr("Avisar al médico"), ok: {txt: tr("Suero, reposo y a la grada. Mejor así."), fx: {fit: -4, form: -2}}}
  ]; }});

EV({id: "amigo_dinero", tipo: "aleatoria", cat: "Dinero", title: "Un amigo te pide dinero",
  when: function (x) { return x.p.money >= 60000; }, w: 0.8,
  text: function () { return tr("Tu amigo de la infancia tiene problemas con su negocio y te pide 50 000 €. Te promete devolverlos."); },
  opts: function () { return [
    {t: tr("Prestárselo"), p: 0.4,
      ok: {txt: tr("Te los devuelve en un año, con un abrazo y una cena."), fx: {mor: 5}},
      ko: {txt: tr("El dinero no vuelve, y la amistad se resiente."), fx: {money: -50000, mor: -5}}},
    {t: tr("Ofrecerle trabajo"), ok: {txt: tr("Le contratas para llevar tus redes. Te ahorras disgustos."), fx: {money: -20000, mor: 6, fol: 10}}},
    {t: tr("Decir que no"), ok: {txt: tr("Una conversación incómoda, pero necesaria."), fx: {mor: -2}}}
  ]; }});

EV({id: "cripto", tipo: "aleatoria", cat: "Dinero", title: "Inversión milagrosa",
  when: function (x) { return x.p.money >= 200000; }, w: 0.8, cd: 4,
  text: function () { return tr("Un «asesor» te propone meter 150 000 € en una criptomoneda que va a multiplicarse por diez."); },
  opts: function () { return [
    {t: tr("Invertir"), out: [
      {p: 0.25, good: true, txt: tr("¡Se dispara! Vendes a tiempo y triplicas."), fx: {money: 300000, mor: 5}},
      {p: 0.2, good: true, txt: tr("Sube y baja. Recuperas lo invertido y te quitas el susto."), fx: {}},
      {p: 0.55, txt: tr("Era humo. Pierdes hasta el último euro."), fx: {money: -150000, mor: -8}}]},
    {t: tr("Invertir en ladrillo"), ok: {txt: tr("Compras dos pisos para alquilar. Aburrido, pero seguro."), fx: {money: 40000}}},
    {t: tr("Pasar"), ok: {txt: tr("Si parece demasiado bueno para ser verdad, es que no lo es."), fx: {prof: 1}}}
  ]; }});

EV({id: "deportivo", tipo: "aleatoria", cat: "Vida", title: "El coche de tus sueños",
  when: function (x) { return x.p.money >= 400000; }, w: 0.7, once: true,
  text: function () { return tr("Un concesionario te ofrece el deportivo del póster de tu habitación. 300 000 €."); },
  opts: function () { return [
    {t: tr("Comprarlo"), p: 0.8,
      ok: {txt: tr("Llegas al entreno como una estrella de cine."), fx: {money: -300000, fol: 25, mor: 5}},
      ko: {txt: tr("Te pillan a 190 km/h. Portada de todos los periódicos."), fx: {money: -310000, fame: -3, coach: -6, prof: -5}}},
    {t: tr("Seguir con tu coche"), ok: {txt: tr("Tu utilitario de siempre nunca te ha fallado."), fx: {prof: 2}}}
  ]; }});

EV({id: "periodista", tipo: "aleatoria", cat: "Prensa", title: "Te llaman sobrevalorado",
  when: function (x) { return x.p.fame >= 20; }, w: 1,
  text: function (x) { return tr("Un columnista famoso escribe que eres «el jugador más sobrevalorado de {lg}». Medio país lo comparte.", {lg: x.lg}); },
  opts: function () { return [
    {t: tr("Responder con ironía en redes"), p: 0.6,
      ok: {txt: tr("Tu respuesta es tan buena que la comparte hasta el periódico rival."), fx: {fol: 20, fame: 2}},
      ko: {txt: tr("El club te pide que no entres en polémicas."), fx: {fol: 15, coach: -5}}},
    {t: tr("Responder en el campo"), ok: {txt: tr("Guardas el recorte en la taquilla. Combustible."), fx: {prof: 3, buff: {v: 1, b: 1, n: tr("Con rabia")}}}},
    {t: tr("Ignorarlo"), ok: {txt: tr("Ni lo lees."), fx: {}}}
  ]; }});

EV({id: "meme", tipo: "aleatoria", cat: "Redes", title: "Te has convertido en meme",
  when: function (x) { return x.inSeason && x.p.fame >= 10; }, w: 0.9,
  text: function () { return tr("Un fallo clamoroso en el último partido se ha convertido en el meme de la semana."); },
  opts: function () { return [
    {t: tr("Reírte de ti mismo"), ok: {txt: tr("Subes el meme con un «hasta yo me río». Te ganas a todo el mundo."), fx: {fans: 6, mor: 4, fol: 20}}},
    {t: tr("Cerrar las redes una semana"), ok: {txt: tr("Desconectas y te centras."), fx: {mor: 2}}},
    {t: tr("Contestar enfadado"), ok: {good: false, txt: tr("Echas gasolina al fuego."), fx: {fans: -6, fame: 1, mor: -3}}}
  ]; }});

EV({id: "amano", tipo: "aleatoria", cat: "Ética", title: "Una propuesta sucia",
  when: function (x) { return x.inSeason && x.age >= 20; }, w: 0.35, once: true,
  text: function () { return tr("Un desconocido te aborda en el parking: 100 000 € si ves una tarjeta amarilla antes del minuto 20 del próximo partido."); },
  opts: function () { return [
    {t: tr("Denunciarlo al club"), ok: {txt: tr("La policía desarticula una red de apuestas. Eres noticia por los buenos motivos."), fx: {prof: 8, fame: 4, fans: 6}}},
    {t: tr("Ignorarlo"), p: 0.85,
      ok: {txt: tr("No vuelves a verle."), fx: {}},
      ko: {txt: tr("Te citan a declarar como testigo. Unas semanas de nervios."), fx: {mor: -6}}},
    {t: tr("Aceptar"), p: 0.4,
      ok: {txt: tr("Nadie se entera. Pero tú lo sabes."), fx: {money: 100000, prof: -15, mor: -6}},
      ko: {txt: tr("Te descubren. Sanción larga, multa y tu imagen por los suelos."), fx: {money: -200000, susp: 8, fame: -15, fans: -25, coach: -25, mor: -15}}}
  ]; }});

EV({id: "hospital", tipo: "aleatoria", cat: "Afición", title: "Visita al hospital infantil",
  when: function (x) { return x.inSeason; }, w: 0.8,
  text: function () { return tr("El club organiza una visita al hospital infantil por Navidad. Es voluntaria."); },
  opts: function () { return [
    {t: tr("Ir con el equipo"), ok: {txt: tr("Las sonrisas de los niños te acompañan toda la semana."), fx: {fans: 5, mor: 6, fame: 2}}},
    {t: tr("Organizar tu propia campaña"), ok: {txt: tr("Donas material y lanzas una recogida de juguetes. Gesto enorme."), fx: {money: -30000, fans: 10, fame: 4, mor: 8}}},
    {t: tr("No puedes ir"), ok: {txt: tr("Tienes otros compromisos."), fx: {fans: -2}}}
  ]; }});

EV({id: "tatuaje", tipo: "aleatoria", cat: "Vida", title: "Tatuaje nuevo",
  when: function (x) { return x.age >= 18; }, w: 0.6, once: true,
  text: function () { return tr("Llevas meses pensando en tatuarte el brazo entero con el escudo de tu ciudad."); },
  opts: function () { return [
    {t: tr("Hacértelo"), p: 0.9,
      ok: {txt: tr("Queda espectacular. Tu foto en redes bate récords."), fx: {fol: 12, mor: 3}},
      ko: {txt: tr("Se te infecta y te pierdes un par de entrenos."), fx: {fol: 10, fit: -10, inj: 1}}},
    {t: tr("Mejor no"), ok: {txt: tr("Tu madre respira aliviada."), fx: {}}}
  ]; }});

EV({id: "casa", tipo: "aleatoria", cat: "Vida", title: "Buscar casa",
  when: function (x) { return x.p.money >= 150000 && !x.p.flags.house; }, w: 0.7,
  text: function () { return tr("Ya es hora de dejar el piso de alquiler. Tienes dos opciones en mente."); },
  opts: function () { return [
    {t: tr("Casa tranquila junto a la ciudad deportiva"), ok: {txt: tr("Silencio, jardín y diez minutos al entreno. Descansas como nunca."), fx: {money: -120000, fit: 6, prof: 4, flag: {house: true}}}},
    {t: tr("Ático en pleno centro"), ok: {txt: tr("Vistas increíbles y planes cada noche. Cuidado con los horarios."), fx: {money: -150000, mor: 6, fame: 2, fit: -4, flag: {house: true}}}},
    {t: tr("Seguir donde estás"), ok: {txt: tr("Sin prisa."), fx: {}}}
  ]; }});

EV({id: "provocacion", tipo: "aleatoria", cat: "Partido", title: "Provocación en el túnel",
  when: function (x) { return x.inSeason; }, w: 1,
  text: function (x) { return tr("Antes del partido contra el {opp}, un rival te susurra algo muy feo en el túnel de vestuarios.", {opp: x.opp()}); },
  opts: function () { return [
    {t: tr("Encararte con él"), p: 0.6,
      ok: {txt: tr("Lo conviertes en gasolina: sales enchufado."), fx: {buff: {v: 1.5, b: 1, n: tr("Enchufado")}, fans: 3}},
      ko: {txt: tr("El árbitro lo ve. Expulsión antes de empezar y sanción."), fx: {susp: 1, coach: -6, fans: 2}}},
    {t: tr("Ignorarle"), ok: {txt: tr("Ni le miras. Profesionalidad."), fx: {prof: 3}}},
    {t: tr("Reírte en su cara"), ok: {txt: tr("Le descolocas por completo."), fx: {fame: 2, form: 3}}}
  ]; }});

EV({id: "gripe", tipo: "aleatoria", cat: "Salud", title: "Gripe en plena racha",
  when: function (x) { return x.inSeason; }, w: 0.8,
  text: function () { return tr("Fiebre y escalofríos en la semana con tres partidos."); },
  opts: function () { return [
    {t: tr("Descansar"), ok: {txt: tr("Dos días en la cama y vuelves como nuevo."), fx: {fit: 5, form: -3}}},
    {t: tr("Entrenar igual"), p: 0.5,
      ok: {txt: tr("Lo superas a base de fuerza de voluntad."), fx: {prof: 3}},
      ko: {txt: tr("Recaes y lo arrastras dos semanas."), fx: {form: -8, fit: -12}}}
  ]; }});

EV({id: "boda", tipo: "aleatoria", cat: "Vida", title: "La boda de tu mejor amigo",
  when: function (x) { return x.inSeason; }, w: 0.7,
  text: function () { return tr("Tu mejor amigo se casa el mismo día de un partido de liga. Eres el padrino."); },
  opts: function () { return [
    {t: tr("Pedir permiso al club"), p: 0.5,
      ok: {txt: tr("El club te deja ir. Discurso emocionante y a casa pronto."), fx: {mor: 8, coach: -2}},
      ko: {txt: tr("No te lo conceden. Ves la boda por videollamada."), fx: {mor: -6}}},
    {t: tr("Escaparte sin permiso"), p: 0.3,
      ok: {txt: tr("Nadie se entera. Noche inolvidable."), fx: {mor: 8}},
      ko: {txt: tr("Te pillan. Multa gorda y castigo sin jugar."), fx: {mor: 6, money: -80000, coach: -15}}},
    {t: tr("Mandar un vídeo"), ok: {txt: tr("Te emocionas grabándolo. Tu amigo lo entiende."), fx: {mor: -3}}}
  ]; }});

EV({id: "estudios", tipo: "aleatoria", cat: "Vida", title: "Volver a estudiar",
  when: function (x) { return x.age >= 19 && x.age <= 30; }, w: 0.5, once: true,
  text: function () { return tr("Siempre quisiste estudiar. Una universidad online ofrece horarios para deportistas."); },
  opts: function () { return [
    {t: tr("Matricularte"), ok: {txt: tr("Estudiar te ordena la cabeza y te da perspectiva."), fx: {prof: 5, mor: 3, fit: -2}}},
    {t: tr("Ahora toca el fútbol"), ok: {txt: tr("Habrá tiempo cuando te retires."), fx: {}}}
  ]; }});

/* ============ VERANO ============ */
EV({id: "vacaciones", tipo: "aleatoria", cat: "Verano", ctx: "verano", title: "Tus vacaciones",
  when: function () { return true; }, w: 2,
  text: function () { return tr("Tres semanas libres antes de la pretemporada. ¿Cómo las aprovechas?"); },
  opts: function () { return [
    {t: tr("Desconexión total en la playa"), ok: {txt: tr("Recargas cuerpo y mente, aunque vuelves con un par de kilos de más."), fx: {mor: 10, fit: 10, form: -5}}},
    {t: tr("Entrenador personal ({money})", {money: fmtMoney(40000)}), ok: {txt: tr("Llegas a la pretemporada como un tiro."), fx: {money: -40000, form: 6, gmul: 1.05, mor: -2}}},
    {t: tr("Gira de eventos y fiestas"), p: 0.6,
      ok: {txt: tr("Photocalls, fiestas y yates. Tus redes explotan."), fx: {fame: 4, fol: 30, prof: -6, fit: -8, mor: 6}},
      ko: {txt: tr("Una foto de madrugada abre los telediarios. Mala imagen."), fx: {fame: 3, fol: 25, prof: -8, fit: -8, fans: -6}}}
  ]; }});

EV({id: "reality", tipo: "aleatoria", cat: "Verano", ctx: "verano", title: "Te quieren en un reality",
  when: function (x) { return x.p.fame >= 40; }, w: 0.6, once: true,
  text: function () { return tr("Una cadena te ofrece 200 000 € por dos semanas en un programa de famosos durante tus vacaciones."); },
  opts: function () { return [
    {t: tr("Aceptar"), ok: {txt: tr("Medio país te ve cocinar paella en una isla. Fama asegurada, descanso cero."), fx: {money: 200000, fame: 5, fol: 120, fit: -10, prof: -8}}},
    {t: tr("Rechazar"), ok: {txt: tr("Tus vacaciones son para descansar."), fx: {prof: 3}}}
  ]; }});

EV({id: "gira", tipo: "real", cat: "Verano", ctx: "verano", title: "Gira de pretemporada",
  when: function (x) { return x.clubR >= 74; }, w: 1,
  text: function (x) { return tr("El {club} se va de gira por Asia y Estados Unidos: estadios llenos, viajes largos y mucho marketing.", {club: x.club}); },
  opts: function () { return [
    {t: tr("Darlo todo en la gira"), ok: {txt: tr("El míster te ve a tope desde el primer día."), fx: {coach: 6, fit: -6, fame: 2}}},
    {t: tr("Dosificarte"), ok: {txt: tr("Llegas fresco al inicio de liga, aunque el míster esperaba más."), fx: {fit: 6, coach: -3}}}
  ]; }});

EV({id: "dieta_verano", tipo: "real", cat: "Verano", ctx: "verano", title: "Volver en forma",
  when: function (x) { return x.age >= 27; }, w: 1,
  text: function (x) { return tr("Con {age} años, cada pretemporada cuesta un poco más. Tu preparador te propone un plan estricto.", {age: x.age}); },
  opts: function () { return [
    {t: tr("Plan estricto todo el verano"), ok: {txt: tr("Vuelves con el mejor estado de forma de los últimos años."), fx: {fit: 10, prof: 5, gmul: 1.04, mor: -2}}},
    {t: tr("Disfrutar del verano"), ok: {txt: tr("Te lo has ganado. Ya te pondrás a tono en agosto."), fx: {mor: 6, form: -4}}}
  ]; }});

/* ============ MOMENTOS CLAVE EN LOS PARTIDOS ============ */
function att(c, k) { return c.at[k] != null ? c.at[k] : c.p.ovr; }
function pr(x) { return clamp(x, 0.03, 0.95); }
var ATT_POS = {DC: 1, ED: 1, EI: 1, MCO: 1, MD: 1, MI: 1};
/* según el marcador devuelve una de las tres frases completas: ganando / perdiendo / empate */
function scoreTxt(c, win, lose, draw) { return c.sc[0] > c.sc[1] ? win : c.sc[0] < c.sc[1] ? lose : draw; }

MO({id: "penalti_favor", title: "Penalti a favor", w: 1.4,
  when: function () { return ATT_POS[S.p.pos] || S.p.flags.pens; },
  text: function (c) { return tr("Minuto {min}. Derriban a un compañero en el área: penalti. Coges el balón y miras al portero.", {min: c.min}); },
  opts: function (c) { var t = att(c, "TIR"); return [
    {t: tr("Lanzarlo tú: eliges sitio y potencia"), mini: "pen", p: pr(0.76 + (t - 75) * 0.004), ok: {txt: tr("Al palo, imposible. ¡Gol!"), goal: "me", rating: 0.2}, ko: {txt: tr("No entra. El portero o el larguero te niegan el gol."), rating: -0.6}},
    {t: tr("A lo Panenka"), p: pr(0.62 + (t - 75) * 0.003), ref: tr("Final de la Eurocopa 1976: Antonín Panenka picó así el penalti decisivo y dio el título a Checoslovaquia."),
      ok: {txt: tr("¡Panenka! El portero se tira y la pelota entra mansa por el centro. Todo el país lo comenta."), goal: "me", rating: 0.4, fx: {fame: 3}},
      ko: {txt: tr("El portero se queda quieto y la atrapa. Silencio en la grada."), rating: -0.9}},
    {t: tr("Cedérselo al especialista"), p: 0.76, ok: {txt: tr("Tu compañero no falla. Gesto generoso."), goal: "team", rating: 0.1}, ko: {txt: tr("Tu compañero lo falla. Nadie te lo reprocha."), rating: 0}}
  ]; }});

MO({id: "mano_a_mano", title: "Mano a mano", w: 2,
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. Un balón al espacio te deja solo ante el portero del {opp}.", {min: c.min, opp: c.opp}); },
  opts: function (c) { var t = att(c, "TIR"), d = att(c, "REG"), q = (c.eff - c.oppR) * 0.006; return [
    {t: tr("Vaselina"), p: pr(0.42 + (d - 75) * 0.004 + q), ok: {txt: tr("La picas por encima del portero. Golazo de bella factura."), goal: "me", rating: 0.3}, ko: {txt: tr("Se queda corta y el portero la atrapa."), rating: -0.4}},
    {t: tr("Disparo cruzado"), p: pr(0.5 + (t - 75) * 0.005 + q), ok: {txt: tr("Raso y cruzado, al palo largo. ¡Gol!"), goal: "me", rating: 0.2}, ko: {txt: tr("El portero saca la mano a lo grande."), rating: -0.3}},
    {t: tr("Regatear al portero"), p: pr(0.45 + (d - 75) * 0.005 + q), ok: {txt: tr("Le sientas con un amago y empujas a puerta vacía."), goal: "me", rating: 0.3}, ko: {txt: tr("Se la lleva con los pies. Ocasión perdida."), rating: -0.4}},
    {t: tr("Pase atrás al compañero"), p: pr(0.55 + q), ok: {txt: tr("Generoso: tu compañero solo tiene que empujarla."), goal: "assist", rating: 0.2}, ko: {txt: tr("El pase sale largo y se pierde la ocasión."), rating: -0.2}}
  ]; }});

MO({id: "falta_directa", title: "Falta en la frontal", w: 1.2,
  when: function () { return S.p.pos !== "POR" && (ATT_POS[S.p.pos] || S.p.pos === "MC" || S.p.pos === "LI" || S.p.pos === "LD"); },
  text: function (c) { return tr("Minuto {min}. Falta a 22 metros, ligeramente escorada. Tienes el balón en las manos.", {min: c.min}); },
  opts: function (c) { var t = att(c, "TIR"), ps = att(c, "PAS"); return [
    {t: tr("Tirarla tú: dibuja la trayectoria"), mini: "fk", p: pr(0.17 + (t - 75) * 0.006), ok: {txt: tr("¡Golazo de falta! El portero ni se mueve."), goal: "me", rating: 0.4, fx: {fame: 1}}, ko: {txt: tr("No entra. Uy."), rating: 0}},
    {t: tr("Potente por debajo de la barrera"), p: pr(0.14 + (t - 75) * 0.005), ok: {txt: tr("La barrera salta y el balón pasa por debajo. ¡Gol de pillo!"), goal: "me", rating: 0.4}, ko: {txt: tr("La barrera no salta. Rebote y fuera."), rating: 0}},
    {t: tr("Centro al área"), p: pr(0.24 + (ps - 75) * 0.005), ok: {txt: tr("Centro perfecto y cabezazo a la red."), goal: "assist", rating: 0.3}, ko: {txt: tr("El portero sale y despeja."), rating: 0}}
  ]; }});

MO({id: "contra", title: "Contragolpe", w: 1.4,
  when: function () { return S.p.pos !== "POR" && S.p.pos !== "DFC"; },
  text: function (c) { return tr("Minuto {min}. Robo en el centro del campo y salís tres contra dos.", {min: c.min}); },
  opts: function (c) { var d = att(c, "REG"), ps = att(c, "PAS"), t = att(c, "TIR"); return [
    {t: tr("Encarar al central"), p: pr(0.32 + (d - 75) * 0.005), ok: {txt: tr("Le rompes la cintura y la cruzas. ¡Gol!"), goal: "me", rating: 0.3}, ko: {txt: tr("El central te gana el cuerpo a cuerpo."), rating: -0.2}},
    {t: tr("Pase al hueco"), p: pr(0.38 + (ps - 75) * 0.005), ok: {txt: tr("Pase milimétrico y tu compañero define."), goal: "assist", rating: 0.3}, ko: {txt: tr("El pase se marcha largo."), rating: -0.1}},
    {t: tr("Disparo lejano"), p: pr(0.16 + (t - 75) * 0.005), ok: {txt: tr("¡Zapatazo desde 30 metros!"), goal: "me", rating: 0.4}, ko: {txt: tr("Se va a las nubes."), rating: -0.2}}
  ]; }});

MO({id: "chilena", title: "Balón en el aire", w: 0.4,
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. Un centro rebota en un defensa y el balón queda flotando a tu espalda, en el área pequeña.", {min: c.min}); },
  opts: function (c) { return [
    {t: tr("Intentar la chilena"), p: pr(0.2 + (att(c, "REG") - 75) * 0.004),
      ok: {txt: tr("¡CHILENA! Gol para la historia. Ya suenas para el premio al mejor gol del año."), goal: "me", rating: 0.8, fx: {fame: 5, fol: 60}},
      ko: {txt: tr("Le das con la espinilla. Saque de puerta."), rating: -0.1}},
    {t: tr("Controlar y tirar"), p: 0.3, ok: {txt: tr("Control orientado y gol."), goal: "me", rating: 0.3}, ko: {txt: tr("El defensa llega a tiempo de taparla."), rating: 0}}
  ]; }});

MO({id: "piscinazo", title: "Te rozan en el área", w: 0.6,
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. El defensa te toca levemente el hombro dentro del área. Podrías dejarte caer…", {min: c.min}); },
  opts: function () { return [
    {t: tr("Dejarte caer"), out: [
      {p: 0.35, good: true, txt: tr("¡Penalti! Lo transformas tú mismo, aunque las repeticiones no dejan dudas."), goal: "me", rating: 0.1, fx: {fans: -2}},
      {p: 0.35, txt: tr("El árbitro no pica: amarilla por simular y pitos en el estadio."), yellow: true, rating: -0.4, fx: {fame: -1}},
      {p: 0.3, txt: tr("El árbitro ni se inmuta. Juego."), rating: 0}]},
    {t: tr("Seguir de pie"), p: 0.3, ok: {txt: tr("Aguantas el contacto y la colocas. Golazo honrado."), goal: "me", rating: 0.3, fx: {fans: 2}}, ko: {txt: tr("Pierdes el equilibrio y el disparo se marcha fuera."), rating: 0}}
  ]; }});

MO({id: "pase_filtrado", title: "Hueco entre líneas", w: 1.5,
  when: function () { return S.p.pos === "MC" || S.p.pos === "MCO" || S.p.pos === "MCD" || S.p.pos === "MD" || S.p.pos === "MI"; },
  text: function (c) { return tr("Minuto {min}. Levantas la cabeza: un compañero desmarcado a la espalda de la defensa.", {min: c.min}); },
  opts: function (c) { var ps = att(c, "PAS"), p1 = pr(0.4 + (ps - 75) * 0.006); return [
    {t: tr("Pase filtrado arriesgado"), out: [
      {p: p1, good: true, txt: tr("Pase de tiralíneas. Gol de tu compañero."), goal: "assist", rating: 0.4},
      {p: 0.2, txt: tr("Lo interceptan y la contra acaba en gol rival."), concede: 1, rating: -0.6},
      {p: Math.max(0, 0.8 - p1), txt: tr("El pase se va largo por poco."), rating: 0}]},
    {t: tr("Pase seguro y mantener"), ok: {txt: tr("Control del partido. El míster aplaude."), rating: 0.15}},
    {t: tr("Disparo desde fuera"), p: pr(0.14 + (att(c, "TIR") - 75) * 0.005), ok: {txt: tr("¡Al ángulo desde fuera del área!"), goal: "me", rating: 0.5}, ko: {txt: tr("Lo bloquea un defensa."), rating: 0}}
  ]; }});

MO({id: "ultimo_hombre", title: "Último hombre", w: 1.6,
  when: function () { return S.p.pos === "DFC" || S.p.pos === "LD" || S.p.pos === "LI" || S.p.pos === "MCD"; },
  text: function (c) { return tr("Minuto {min}. Pérdida en la salida y el delantero del {opp} se va lanzado. Eres el último hombre.", {min: c.min, opp: c.opp}); },
  opts: function (c) { var d = att(c, "DEF"), r = att(c, "RIT"), p1 = pr(0.55 + (d - 75) * 0.006); return [
    {t: tr("Entrada a ras de suelo"), out: [
      {p: p1, good: true, txt: tr("¡Entrada perfecta! Balón limpio y el estadio en pie."), rating: 0.6},
      {p: 0.25, txt: tr("Llegas tarde: roja directa y falta peligrosa."), red: true, rating: -1.2},
      {p: Math.max(0, 0.75 - p1), txt: tr("Te regatea y marca."), concede: 1, rating: -0.6}]},
    {t: tr("Temporizar"), p: pr(0.62 + (r - 75) * 0.005), ok: {txt: tr("Le encierras en la banda hasta que llegan las ayudas."), rating: 0.4}, ko: {txt: tr("Se perfila y la cruza. Gol rival."), concede: 1, rating: -0.5}},
    {t: tr("Falta táctica"), ok: {txt: tr("Amarilla, pero cortas la contra. Inteligencia."), yellow: true, rating: 0.1}}
  ]; }});

MO({id: "corner", title: "Córner a favor", w: 1.2,
  when: function () { return S.p.pos === "DFC" || S.p.pos === "MCD" || S.p.pos === "DC"; },
  text: function (c) { return tr("Minuto {min}. Córner a favor. Subes al área rival.", {min: c.min}); },
  opts: function (c) { var fi = att(c, "FIS"); return [
    {t: tr("Atacar el primer palo"), p: pr(0.22 + (fi - 75) * 0.005), ok: {txt: tr("Te anticipas a todos: cabezazo picado y gol."), goal: "me", rating: 0.5}, ko: {txt: tr("Llegas un instante tarde."), rating: 0}},
    {t: tr("Bloquear para un compañero"), p: 0.2, ok: {txt: tr("Tu bloqueo libera a tu compañero, que remata a placer."), goal: "team", rating: 0.2}, ko: {txt: tr("La defensa lo lee bien."), rating: 0}}
  ]; }});

MO({id: "despeje", title: "Balón suelto en tu área", w: 1,
  when: function () { return S.p.pos === "DFC" || S.p.pos === "LD" || S.p.pos === "LI"; },
  text: function (c) { return tr("Minuto {min}. Un rechace queda muerto en el punto de penalti y tienes a un rival encima.", {min: c.min}); },
  opts: function (c) { var d = att(c, "DEF"); return [
    {t: tr("Despeje sin contemplaciones"), p: pr(0.75 + (d - 75) * 0.004), ok: {txt: tr("Balón a la grada. Peligro fuera."), rating: 0.2}, ko: {txt: tr("Rebota en el delantero y entra."), concede: 1, rating: -0.5}},
    {t: tr("Sacarlo jugado"), p: pr(0.5 + (d - 75) * 0.004), ok: {txt: tr("Con una sangre fría increíble, sales jugando y arrancas la contra."), rating: 0.5}, ko: {txt: tr("Te la roban y gol. El míster se lleva las manos a la cabeza."), concede: 1, rating: -0.8}}
  ]; }});

MO({id: "subida_lateral", title: "Te sumas al ataque", w: 1.2,
  when: function () { return S.p.pos === "LD" || S.p.pos === "LI"; },
  text: function (c) { return tr("Minuto {min}. El extremo se mete por dentro y te deja toda la banda libre.", {min: c.min}); },
  opts: function (c) { var ps = att(c, "PAS"); return [
    {t: tr("Centro al segundo palo"), p: pr(0.32 + (ps - 75) * 0.005), ok: {txt: tr("Centro tenso y remate a la red. ¡Asistencia!"), goal: "assist", rating: 0.4}, ko: {txt: tr("El centro se lo queda el portero."), rating: 0}},
    {t: tr("Diagonal y tiro"), p: 0.14, ok: {txt: tr("¡Golazo del lateral! Nadie lo esperaba."), goal: "me", rating: 0.6}, ko: {txt: tr("Disparo blando."), rating: 0}},
    {t: tr("Volver a tu posición"), ok: {txt: tr("Prudencia: no dejas la espalda descubierta."), rating: 0.05}}
  ]; }});

MO({id: "penalti_contra", title: "Penalti en contra", w: 1.6,
  when: function () { return S.p.pos === "POR"; },
  text: function (c) { return tr("Minuto {min}. Penalti para el {opp}. El lanzador coloca el balón y te mira.", {min: c.min, opp: c.opp}); },
  opts: function (c) {
    var e = att(c, "EST");
    function dive(side) { var aim = [0.42, 0.16, 0.42][side]; return pr(aim * clamp(0.55 + (e - 75) * 0.006, 0.3, 0.8) + (1 - aim) * 0.06); }
    var ok = {txt: tr("¡LO PARAS! Adivinas el lado y la grada estalla."), rating: 1, save: true, fx: {fame: 2}}, ko = {txt: tr("Te engaña. Gol del {opp}.", {opp: c.opp}), concede: 1, rating: -0.2};
    return [{t: tr("Pararlo tú: eliges zona y momento"), mini: "gkpen", p: dive(0), ok: ok, ko: ko},
      {t: tr("Tirarte a tu izquierda"), p: dive(0), ok: ok, ko: ko}, {t: tr("Aguantar en el centro"), p: dive(1), ok: ok, ko: ko}, {t: tr("Tirarte a tu derecha"), p: dive(2), ok: ok, ko: ko}];
  }});

MO({id: "falta_contra_gk", title: "Falta en contra", w: 1.3,
  when: function () { return S.p.pos === "POR"; },
  text: function (c) { return tr("Minuto {min}. Falta peligrosa para el {opp} al borde del área. Te toca organizar la barrera.", {min: c.min, opp: c.opp}); },
  opts: function (c) {
    var e = att(c, "COL"), rf2 = att(c, "REF");
    var ok = {txt: tr("¡Atajada! Te estiras y la sacas de la escuadra."), rating: 0.8, save: true, fx: {fame: 1}}, ko = {txt: tr("La pone imposible. Gol del {opp}.", {opp: c.opp}), concede: 1, rating: -0.2};
    return [
      {t: tr("Montarla tú: barrera, posición y reacción"), mini: "gkfk", p: pr(0.62 + (rf2 - 75) * 0.005), ok: ok, ko: ko},
      {t: tr("Barrera de cinco y cubrir tu palo"), p: pr(0.66 + (e - 75) * 0.004), ok: ok, ko: ko},
      {t: tr("Barrera de dos y adelantarte"), p: pr(0.55 + (rf2 - 75) * 0.006), ok: ok, ko: ko}
    ];
  }});

MO({id: "uno_contra_uno_gk", title: "Delantero solo ante ti", w: 1.6,
  when: function () { return S.p.pos === "POR"; },
  text: function (c) { return tr("Minuto {min}. Un delantero del {opp} se planta solo frente a ti.", {min: c.min, opp: c.opp}); },
  opts: function (c) { var rf2 = att(c, "REF"), co = att(c, "COL"); return [
    {t: tr("Salir a tapar"), p: pr(0.5 + (rf2 - 75) * 0.006), ok: {txt: tr("Sales como un rayo y le haces la cruz. ¡Paradón!"), rating: 0.8, save: true}, ko: {txt: tr("Te supera con una vaselina."), concede: 1, rating: -0.3}},
    {t: tr("Esperar en la línea"), p: pr(0.42 + (co - 75) * 0.006), ok: {txt: tr("Aguantas hasta el final y desvías con el pie."), rating: 0.6, save: true}, ko: {txt: tr("Remata cruzado, lejos de tu alcance."), concede: 1, rating: -0.2}}
  ]; }});

MO({id: "centro_gk", title: "Centro peligroso", w: 1,
  when: function () { return S.p.pos === "POR"; },
  text: function (c) { return tr("Minuto {min}. Centro colgado al corazón del área con tres rivales esperando.", {min: c.min}); },
  opts: function (c) { return [
    {t: tr("Salir de puños"), p: pr(0.68 + (att(c, "COL") - 75) * 0.004), ok: {txt: tr("Despejas con autoridad entre una nube de jugadores."), rating: 0.3}, ko: {txt: tr("No llegas y te cabecean a puerta vacía."), concede: 1, rating: -0.6}},
    {t: tr("Quedarte bajo palos"), p: pr(0.56 + (att(c, "REF") - 75) * 0.005), ok: {txt: tr("Cabezazo a bocajarro… ¡y reflejos felinos!"), rating: 0.5, save: true}, ko: {txt: tr("Cabezazo imparable."), concede: 1, rating: -0.2}}
  ]; }});

/* ----- momentos calcados de hechos reales ----- */
MO({id: "provocacion_final", title: "Provocación en un partido grande", w: 0.8,
  ref: "Final del Mundial 2006: Zidane respondió con un cabezazo a una provocación de Materazzi y se despidió del fútbol con una roja.",
  when: function (f) { return f.imp >= 2 && S.p.pos !== "POR"; },
  text: function (c) { return tr("Minuto {min}. En una disputa, un rival del {opp} te agarra de la camiseta y te dice algo muy feo sobre tu familia.", {min: c.min, opp: c.opp}); },
  opts: function () { return [
    {t: tr("Seguir jugando"), ok: {txt: tr("Respiras hondo y sigues. El partido es lo importante."), rating: 0.1, fx: {prof: 1}}},
    {t: tr("Encararte con él"), p: 0.6, ok: {txt: tr("Le plantas cara sin tocarle. El árbitro os separa."), rating: 0}, ko: {txt: tr("Amarilla para los dos."), yellow: true, rating: -0.2}},
    {t: tr("Responder con un cabezazo"), ok: {good: false, txt: tr("Le derribas de un cabezazo en el pecho. Roja directa y una imagen que dará la vuelta al mundo."), red: true, rating: -1.5, fx: {susp: 2, fame: 2, fans: -8}}}
  ]; }});

MO({id: "mano_dios", title: "El balón cae entre tú y el portero", w: 0.5,
  ref: "Maradona marcó con la mano a Inglaterra en el Mundial 86 y Henry se ayudó de ella para dar el gol que llevó a Francia al Mundial 2010. Hoy el VAR lo pone casi imposible.",
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. Un centro bombeado cae entre tú y el portero del {opp}. De cabeza no llegas… con la mano, sí.", {min: c.min, opp: c.opp}); },
  opts: function (c) { return [
    {t: tr("Empujarla con la mano"), p: 0.12,
      ok: {txt: tr("¡El árbitro no lo ve y el VAR no entra! Un gol polémico que dará que hablar durante años."), goal: "me", rating: 0.2, fx: {fame: 2, fans: -2}},
      ko: {txt: tr("El VAR lo ve todo: gol anulado y amarilla."), yellow: true, rating: -0.5, fx: {fame: -1}}},
    {t: tr("Lanzarte en plancha"), p: pr(0.25 + (att(c, "FIS") - 75) * 0.004), ok: {txt: tr("¡Cabezazo en plancha a la red!"), goal: "me", rating: 0.5}, ko: {txt: tr("Te quedas a centímetros y te llevas un golpe."), rating: -0.1}},
    {t: tr("Dejarla pasar"), ok: {txt: tr("El balón se pierde por la línea de fondo."), rating: 0}}
  ]; }});

MO({id: "confesar_mano", title: "Gol con la mano", w: 0.4,
  ref: "Septiembre de 2012: Miroslav Klose marcó con la mano ante el Nápoles y se lo confesó al árbitro, que anuló el gol.",
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. Marcas en un barullo… pero el balón te ha tocado en la mano. El árbitro señala el centro del campo y nadie protesta.", {min: c.min}); },
  opts: function () { return [
    {t: tr("Decírselo al árbitro"), ok: {txt: tr("Le confiesas que fue con la mano y anula el gol. Hasta los rivales te aplauden."), rating: 0, fx: {fame: 5, prof: 5, fans: 2}, n: tr("El gol no sube al marcador")}},
    {t: tr("Celebrarlo"), p: 0.6, ok: {txt: tr("Nadie lo ve. El gol sube al marcador."), goal: "me", rating: 0.2}, ko: {txt: tr("El VAR revisa la jugada: gol anulado y amarilla por mano."), yellow: true, rating: -0.4, fx: {fame: -2}}}
  ]; }});

MO({id: "mano_linea", title: "Sobre la línea de gol", w: 0.7, minR: [86, 90],
  ref: "Mundial 2010: Luis Suárez sacó con la mano un gol cantado de Ghana en el último minuto de la prórroga. Gyan falló el penalti y Uruguay pasó en la tanda.",
  when: function (f) { return f.imp >= 2 && f.kind === "ko" && S.p.pos !== "POR"; },
  text: function (c) { return tr("Minuto {min}. Cabezazo del {opp}, tu portero está batido y el balón va dentro. Estás sobre la línea.", {min: c.min, opp: c.opp}); },
  opts: function () { return [
    {t: tr("Sacarla con la mano"), out: [
      {p: 0.25, good: true, txt: tr("Roja directa y penalti… ¡que el rival estrella en el larguero! Celebras camino del vestuario."), red: true, rating: -0.3, fx: {fame: 3}},
      {p: 0.75, txt: tr("Roja directa y el penalti, dentro. Lo peor de los dos mundos."), red: true, concede: 1, rating: -1}]},
    {t: tr("Intentar despejar de cabeza"), p: 0.3, ok: {txt: tr("¡La sacas de cabeza sobre la línea!"), rating: 0.8, fx: {fame: 1}}, ko: {txt: tr("No llegas: gol en contra."), concede: 1, rating: -0.3}}
  ]; }});

MO({id: "minuto_93", title: "Descuento con la liga en juego", w: 2.5, minR: [90, 90],
  ref: "13 de mayo de 2012: Agüero marcó en el minuto 93:20 ante el QPR y dio la Premier League al Manchester City.",
  when: function (f) { var li = S.cl[S.p.club]; return f.kind === "lg" && S.bi === 4 && ATT_POS[S.p.pos] && li >= 0 && posInLeague(S.p.club) <= 2; },
  text: function (c) { return scoreTxt(c, tr("Minuto 93. La liga se decide estas semanas. Vais ganando {a}-{b} y te llega un balón dentro del área.", {a: c.sc[0], b: c.sc[1]}), tr("Minuto 93. La liga se decide estas semanas. Perdéis {a}-{b} y te llega un balón dentro del área.", {a: c.sc[0], b: c.sc[1]}), tr("Minuto 93. La liga se decide estas semanas. Empate a {a} y te llega un balón dentro del área.", {a: c.sc[0]})); },
  opts: function (c) { return [
    {t: tr("Recorte y disparo"), p: pr(0.3 + (att(c, "REG") - 75) * 0.005), ok: {txt: tr("Recortas y disparas con el alma. ¡GOL! El estadio se viene abajo."), goal: "me", rating: 0.8, fx: {fame: 5, fans: 8}}, ko: {txt: tr("El disparo se marcha rozando el palo."), rating: -0.2}},
    {t: tr("Disparo inmediato"), p: pr(0.28 + (att(c, "TIR") - 75) * 0.005), ok: {txt: tr("Le pegas a la primera y entra por la escuadra. ¡Locura!"), goal: "me", rating: 0.8, fx: {fame: 5, fans: 8}}, ko: {txt: tr("Lo tapa un defensa con el cuerpo."), rating: -0.1}},
    {t: tr("Pase atrás"), p: 0.3, ok: {txt: tr("Pase de la muerte y tu compañero la empuja. ¡Gol!"), goal: "assist", rating: 0.5, fx: {fans: 5}}, ko: {txt: tr("Lo corta el último defensa."), rating: -0.1}}
  ]; }});

MO({id: "ultimo_corner", title: "El último córner", w: 1.2, minR: [90, 90],
  ref: "Final de la Champions de 2014 en Lisboa: Sergio Ramos empató de cabeza en el minuto 92:48 y el Real Madrid acabó ganando la Décima.",
  when: function (f) { return f.imp >= 2 && (S.p.pos === "DFC" || S.p.pos === "MCD" || S.p.pos === "DC"); },
  text: function (c) { return scoreTxt(c, tr("Minuto 92. Córner a favor en el último suspiro. Vais ganando {a}-{b}. Subes al área: es ahora o nunca.", {a: c.sc[0], b: c.sc[1]}), tr("Minuto 92. Córner a favor en el último suspiro. Perdéis {a}-{b}. Subes al área: es ahora o nunca.", {a: c.sc[0], b: c.sc[1]}), tr("Minuto 92. Córner a favor en el último suspiro. Empate a {a}. Subes al área: es ahora o nunca.", {a: c.sc[0]})); },
  opts: function (c) { return [
    {t: tr("Atacar el primer palo"), p: pr(0.24 + (att(c, "FIS") - 75) * 0.005), ok: {txt: tr("¡Cabezazo imparable en el descuento! El banquillo salta al campo."), goal: "me", rating: 0.8, fx: {fame: 4}}, ko: {txt: tr("El portero se adelanta y atrapa el balón."), rating: 0}},
    {t: tr("Esperar el rechace"), p: 0.18, ok: {txt: tr("El balón te cae muerto y no perdonas."), goal: "me", rating: 0.5}, ko: {txt: tr("El rechace sale hacia otro lado."), rating: 0}},
    {t: tr("Bloquear para un compañero"), p: 0.2, ok: {txt: tr("Tu bloqueo libera a un compañero, que la mete."), goal: "team", rating: 0.2}, ko: {txt: tr("La defensa lo despeja."), rating: 0}}
  ]; }});

MO({id: "corner_rapido", title: "Defensa despistada", w: 0.7,
  ref: "7 de mayo de 2019: Alexander-Arnold sacó un córner rápido aprovechando un despiste del Barcelona y Origi marcó el 4-0 de la remontada de Anfield.",
  when: function () { return ["LD", "LI", "MC", "MCO", "MD", "MI", "ED", "EI"].indexOf(S.p.pos) >= 0; },
  text: function (c) { return tr("Minuto {min}. Córner a favor. La defensa del {opp} está despistada, protestando y de espaldas.", {min: c.min, opp: c.opp}); },
  opts: function (c) { return [
    {t: tr("Sacar rápido en corto"), p: pr(0.3 + (att(c, "PAS") - 75) * 0.005), ok: {txt: tr("¡La pones al primer palo y tu compañero la mete! Nadie se lo esperaba."), goal: "assist", rating: 0.6, fx: {fame: 3}}, ko: {txt: tr("El árbitro te hace repetirlo: aún no había dado la orden."), rating: -0.1}},
    {t: tr("Esperar y colgarla al área"), p: 0.12, ok: {txt: tr("Centro preciso y gol de cabeza."), goal: "assist", rating: 0.3}, ko: {txt: tr("Despeja el primer defensa."), rating: 0}}
  ]; }});

MO({id: "portero_lesionado", title: "Portero en el suelo", w: 0.35,
  ref: "Diciembre de 2000: Paolo Di Canio cogió el balón con las manos en lugar de marcar a puerta vacía porque el portero del Everton estaba lesionado. Recibió el premio Fair Play de la FIFA.",
  when: function () { return ATT_POS[S.p.pos]; },
  text: function (c) { return tr("Minuto {min}. El portero del {opp} está tendido en el suelo, lesionado. Te llega un centro con la portería vacía.", {min: c.min, opp: c.opp}); },
  opts: function () { return [
    {t: tr("Coger el balón con las manos"), ok: {txt: tr("Paras el juego para que atiendan al portero. Todo el estadio se pone en pie."), rating: 0.1, fx: {fame: 6, fans: 5, prof: 6}}},
    {t: tr("Rematar a puerta vacía"), p: 0.92, ok: {txt: tr("Gol. Lícito… aunque media grada te pita."), goal: "me", rating: 0.1, fx: {fame: -2}}, ko: {txt: tr("La mandas fuera con la portería vacía. Ni eso."), rating: -0.5}}
  ]; }});

MO({id: "exhibicion", title: "Noche mágica a domicilio", w: 0.6,
  ref: "Noviembre de 2005: el Santiago Bernabéu se puso en pie para aplaudir a Ronaldinho tras sus dos golazos en el 0-3 del Barcelona.",
  when: function (f) { return !f.home && !f.isNat && f.imp >= 1 && ATT_POS[S.p.pos] && S.p.ovr >= 80; },
  text: function (c) { return tr("Minuto {min}. Estás haciendo un partidazo en el campo del {opp}. Recibes en el centro del campo con espacio por delante.", {min: c.min, opp: c.opp}); },
  opts: function (c) { return [
    {t: tr("Slalom hasta el área"), p: pr(0.25 + (att(c, "REG") - 75) * 0.006), ok: {txt: tr("Dejas atrás a tres rivales y la cruzas. Hasta su afición se levanta a aplaudirte."), goal: "me", rating: 0.9, fx: {fame: 6, fol: 40}}, ko: {txt: tr("Te frenan con falta en la frontal."), rating: 0}},
    {t: tr("Tocar y asegurar"), ok: {txt: tr("Juegas fácil. El partido está controlado."), rating: 0.1}}
  ]; }});

/* ----- tanda de penaltis ----- */
var SHOOTOUT_BASE = {
  out: [
    {t: N_("Colocado al palo"), p: 0.79, ok: N_("Ajustado al palo: gol."), ko: N_("El portero adivina y la para.")},
    {t: N_("Fuerte arriba"), p: 0.74, ok: N_("Trallazo arriba al centro: gol."), ko: N_("Se te va por encima del larguero."),
      ref: N_("Final del Mundial 1994: Roberto Baggio mandó su penalti por encima del larguero y Brasil fue campeón.")},
    {t: N_("A lo Panenka"), p: 0.6, ok: N_("¡Panenka con dos narices! Gol."), ko: N_("El portero no se mueve y la atrapa."), okFx: {fame: 4},
      ref: N_("Final de la Eurocopa 1976: Antonín Panenka picó así el último penalti y dio el título a Checoslovaquia.")},
    {t: N_("Carrerilla a saltitos"), p: 0.55, ok: N_("Los saltitos desconciertan al portero: gol."), ko: N_("Tanto baile para mandarla a la grada. Serás meme durante años."), koFx: {fol: 20, fame: -2},
      ref: N_("Eurocopa 2016: Simone Zaza tomó carrerilla a saltitos ante Alemania y mandó el penalti a las nubes.")}
  ],
  gk: [
    {t: N_("Tirarte a tu izquierda"), p: 0.33, ok: N_("¡Paras el último penalti!"), ko: N_("No adivinas el lado.")},
    {t: N_("Aguantar en el centro"), p: 0.2, ok: N_("El lanzador tira al centro… ¡y la atrapas!"), ko: N_("Te engaña con un tiro ajustado.")},
    {t: N_("Tirarte a tu derecha"), p: 0.33, ok: N_("¡Vuelas y la sacas!"), ko: N_("La pelota entra pegada al palo contrario.")},
    {t: N_("Mirar la chuleta del rival"), p: 0.37, ok: N_("Tu chuleta acierta: lado correcto y parada."), ko: N_("El lanzador cambia su costumbre justo hoy."),
      ref: N_("Mundial 2006: Jens Lehmann llevaba en la media una chuleta con los lanzamientos de Argentina y paró dos penaltis.")},
    {t: N_("Desconcentrar al lanzador"), p: 0.4, ok: N_("Le vacilas antes del disparo y la manda fuera."), ko: N_("Te ganas los pitos de todo el estadio y encima marca."), koFx: {fame: -1},
      ref: N_("Final del Mundial 2022: Emiliano «Dibu» Martínez desconcentró a los lanzadores de Francia y Argentina ganó la tanda.")}
  ]
};
function SHOOTOUT_OPTS(gk) {
  var p = S.p, at = attrs();
  var list = SHOOTOUT_BASE[gk ? "gk" : "out"].map(function (o) {
    var pp = gk ? clamp(o.p + ((at.REF || p.ovr) - 75) * 0.003, 0.05, 0.6) : clamp(o.p + ((at.TIR || p.ovr) - 75) * 0.004 + (p.mor - 50) / 400, 0.3, 0.95);
    return {t: tr(o.t), ref: o.ref ? tr(o.ref) : o.ref, p: pp, badge: gk ? tr("Paras") : tr("Marcas"),
      ok: {txt: tr(o.ok), rating: 0.4, fx: Object.assign({fame: 2}, o.okFx || {})},
      ko: {txt: tr(o.ko), rating: -0.3, fx: Object.assign({mor: -4}, o.koFx || {})}};
  });
  /* minijuego: eliges tú el sitio y la potencia */
  if (gk) list.unshift({t: tr("Pararlo tú: eliges zona y momento"), mini: "gkpen", p: clamp(0.24 + ((at.REF || p.ovr) - 75) * 0.003, 0.05, 0.6), badge: tr("Paras"),
    ok: {txt: tr("¡LO PARAS! Te lanzas al sitio justo."), rating: 0.4, fx: {fame: 2}}, ko: {txt: tr("Te engaña. Entra."), rating: -0.3, fx: {mor: -4}}});
  if (!gk) list.unshift({t: tr("Elegir tú el sitio y la potencia"), mini: "pen", p: clamp(0.76 + ((at.TIR || p.ovr) - 75) * 0.004, 0.3, 0.95), badge: tr("Marcas"),
    ok: {txt: tr("¡Dentro! Lo celebras con la grada."), rating: 0.4, fx: {fame: 2}}, ko: {txt: tr("Fallas. El silencio se hace eterno."), rating: -0.3, fx: {mor: -4}}});
  return list;
}
