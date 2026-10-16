/* story33.js — versión 3.3 «Historias de vestuario».
   - Documental de temporada: más fama y dinero, pero salen a la luz secretos del vestuario.
   - Amistades y piques entre jugadores (míster) que suben o bajan el nivel del once; mejor amigo y pique en el vestuario (jugador).
   - Familia y momentos personales.
   - Despedida de leyenda al retirarte (la tarjeta está en ui-story33.js). */

/* ---------- relaciones en el vestuario (míster) ---------- */
function relOf() { var m = S.m; m.rel = (m.rel || []).filter(function (r) { var a = mPl(r.a), b = mPl(r.b); return a && b && !a.loanOut && !b.loanOut && S.yr - r.y < 2; }); return m.rel; }
function relAdd(a, b, k) { var l = relOf().filter(function (r) { return !((r.a === a && r.b === b) || (r.a === b && r.b === a)); }); l.push({a: a, b: b, k: k, y: S.yr}); S.m.rel = l; }
function relPair(y) {
  var xi = (y.m.xi || []).filter(function (id) { return id != null && mPl(id); });
  if (xi.length < 4) return null;
  var a = xi[ri(1, xi.length - 1)], b; do { b = xi[ri(1, xi.length - 1)]; } while (b === a);
  return {pa: a, pb: b};
}
function relNames(y) { var a = mPl(y.cur.pa), b = mPl(y.cur.pb); return {a: a ? plName(a) : "—", b: b ? plName(b) : "—"}; }
function relBonus(xi) {
  var on = {}, v = 0; (xi || []).forEach(function (id) { if (id != null) on[id] = 1; });
  relOf().forEach(function (r) { if (on[r.a] && on[r.b]) v += r.k === "f" ? 0.35 : -0.5; });
  return v;
}
(function () {
  if (typeof mgrPrepFixture !== "function") return;
  var _p = mgrPrepFixture;
  mgrPrepFixture = function (f) { var r = _p.apply(this, arguments); if (S.mode === "mgr" && S.m && f.xi) { f.relB = relBonus(f.xi); f.tr += f.relB; } return r; };
})();
MEV({id: "s33_pelea", tipo: "aleatoria", cat: "Vestuario", title: "Pelea en el entrenamiento", w: 1.4, cd: 2,
  when: function (y) { return y.inSeason && y.m.xi && y.m.xi.length >= 11; },
  prep: function (y) { return relPair(y) || {}; },
  text: function (y) { var n = relNames(y); return tr("{a} y {b} acaban a empujones tras una entrada fuerte en el entrenamiento. Medio vestuario ha tenido que separarlos.", n); },
  opts: function (y) { var x = y.cur; return [
    {t: tr("Sentarlos juntos y que se den la mano"), p: 0.6, ok: {txt: tr("Se piden perdón delante de todos. Asunto zanjado."), fx: {chem: 2}}, ko: {txt: tr("Se dan la mano, pero no se miran. El pique sigue ahí."), fx: {chem: -2}, then: function () { relAdd(x.pa, x.pb, "e"); }}},
    {t: tr("Multar a los dos"), ok: {txt: tr("Cumplen la multa, pero entre ellos queda tensión."), fx: {board: 1}, then: function () { if (chance(0.5)) relAdd(x.pa, x.pb, "e"); }}},
    {t: tr("Dejar que lo arreglen ellos"), ok: {txt: tr("No lo arreglan: ahora juegan sin pasarse el balón."), fx: {}, then: function () { relAdd(x.pa, x.pb, "e"); }}}
  ]; }});
MEV({id: "s33_amigos", tipo: "aleatoria", cat: "Vestuario", title: "Dos inseparables", w: 1.2, cd: 2,
  when: function (y) { return y.inSeason && y.m.xi && y.m.xi.length >= 11; },
  prep: function (y) { return relPair(y) || {}; },
  text: function (y) { var n = relNames(y); return tr("{a} y {b} se han hecho inseparables: comparten coche, cenas y celebraciones. En el campo se buscan con los ojos cerrados.", n); },
  opts: function (y) { var x = y.cur; return [
    {t: tr("Hacer que jueguen juntos"), ok: {txt: tr("Su conexión se nota en cada partido."), fx: {chem: 2}, then: function () { relAdd(x.pa, x.pb, "f"); }}},
    {t: tr("Que no se forme un grupito"), ok: {txt: tr("Les pides que se abran al resto. Lo entienden."), fx: {chem: 1}}}
  ]; }});

/* ---------- documental de temporada ---------- */
MEV({id: "s33_doc", tipo: "aleatoria", cat: "Club", title: "Un documental de la temporada", w: 1, cd: 4,
  when: function (y) { return y.inSeason && S.bi <= 1 && y.clubR >= 62; },
  text: function () { return tr("Una plataforma quiere grabar toda la temporada del club: vestuario, despachos y viajes. Pagan bien y la fama del club se dispararía, pero las cámaras lo ven todo."); },
  opts: function (y) { var g = mxBud(y, 0.04, 2e5); return [
    {t: tr("Aceptar ({v})", {v: fmtMoney(g)}), ok: {txt: tr("Las cámaras llegan el lunes. Todo el mundo se peina un poco más."), fx: {bud: g, rep: 3, fans: 4}, then: function () { S.m.flags.doc = S.yr; }}},
    {t: tr("Rechazarlo"), ok: {txt: tr("El vestuario es sagrado. Los jugadores lo agradecen."), fx: {chem: 3}}}
  ]; }});
MEV({id: "s33_doc_leak", tipo: "aleatoria", cat: "Club", title: "El documental lo enseña todo", w: 3, cd: 1,
  when: function (y) { return y.inSeason && S.m.flags.doc === S.yr && S.bi >= 2; },
  text: function () { return tr("Se estrena un capítulo del documental y aparece tu bronca más dura en el vestuario, con insultos incluidos. Las redes no hablan de otra cosa."); },
  opts: function () { return [
    {t: tr("Defender que el fútbol es así"), p: 0.55, ok: {txt: tr("Mucha gente lo entiende: el vestuario te ve como un líder de verdad."), fx: {rep: 2, chem: 2}}, ko: {txt: tr("La directiva no está nada contenta con la imagen del club."), fx: {board: -4, rep: -1}}},
    {t: tr("Pedir disculpas públicamente"), ok: {txt: tr("Te disculpas. La polémica se apaga, aunque algún jugador cree que te has achantado."), fx: {board: 2, chem: -2}}},
    {t: tr("Exigir que corten esas escenas"), ok: {txt: tr("La plataforma cede, pero el siguiente capítulo será más incómodo."), fx: {fans: -2, sqMor: 2}}}
  ]; }});
EV({id: "s33_pdoc", tipo: "aleatoria", cat: "Fama", title: "Tu propio documental", w: 1, cd: 4,
  when: function (x) { return x.inSeason && S.bi <= 1 && x.p.fame >= 40 && x.age >= 21; },
  text: function () { return tr("Una plataforma quiere grabar tu temporada: entrenamientos, casa, viajes y vestuario. Te pagan muy bien y tu fama crecería, pero las cámaras lo ven todo."); },
  opts: function () { return [
    {t: tr("Aceptar"), ok: {txt: tr("Firmas. A partir de mañana hay una cámara hasta en tu cocina."), fx: {fame: 6, money: 250000}, then: function () { S.p.flags.doc = S.yr; }}},
    {t: tr("Rechazarlo"), ok: {txt: tr("Prefieres que hable tu fútbol."), fx: {prof: 2}}}
  ]; }});
EV({id: "s33_pdoc_leak", tipo: "aleatoria", cat: "Fama", title: "Secretos en pantalla", w: 3, cd: 1,
  when: function (x) { return x.inSeason && S.p.flags.doc === S.yr && S.bi >= 2; },
  text: function () { return tr("El documental muestra una discusión tuya con un compañero en el vestuario. Las redes ya han elegido bando."); },
  opts: function () { return [
    {t: tr("Hacer las paces en público"), ok: {txt: tr("Una foto juntos zanja la polémica. Ganas puntos."), fx: {fans: 4, mor: 2}}},
    {t: tr("Mantener lo que dijiste"), p: 0.5, ok: {txt: tr("Mucha gente aplaude tu carácter."), fx: {fame: 3}}, ko: {txt: tr("El vestuario se divide y el míster no lo ve con buenos ojos."), fx: {coach: -5, mor: -4}}}
  ]; }});

/* ---------- amistades y piques (jugador) ---------- */
function s33Mate() { var c = X.cur; if (c && c.mate) return c.mate; var n = genName(W.clubs[S.p.club] ? W.clubs[S.p.club].ci : 0), nm = n.fn + " " + n.ln; if (c) c.mate = nm; return nm; }
EV({id: "s33_bff", tipo: "aleatoria", cat: "Vestuario", title: "Un amigo en el vestuario", w: 1.1, cd: 3,
  when: function (x) { return x.inSeason && !(S.p.flags.bff && S.p.flags.bff.c === S.p.club); },
  text: function (x) { return tr("{name} y tú os habéis hecho uña y carne: entrenáis juntos, viajáis juntos y os buscáis en cada jugada.", {name: s33Mate()}); },
  opts: function () { var nm = s33Mate(); return [
    {t: tr("Disfrutarlo"), ok: {txt: tr("Con un amigo al lado, todo pesa menos."), fx: {mor: 5}, then: function () { S.p.flags.bff = {n: nm, c: S.p.club}; }}},
    {t: tr("Centrarte solo en el fútbol"), ok: {txt: tr("Prefieres no mezclar. Sigues a lo tuyo."), fx: {prof: 2}}}
  ]; }});
EV({id: "s33_pique", tipo: "aleatoria", cat: "Vestuario", title: "Pique con un compañero", w: 1, cd: 3,
  when: function (x) { return x.inSeason && !(S.p.flags.feud && S.p.flags.feud.c === S.p.club); },
  text: function () { return tr("{name} juega en tu posición y no soporta que le quites minutos. Ya no te pasa el balón en los rondos.", {name: s33Mate()}); },
  opts: function () { var nm = s33Mate(); return [
    {t: tr("Hablarlo a solas"), p: 0.6, ok: {txt: tr("Os entendéis: competiréis, pero sin malos rollos."), fx: {mor: 3}}, ko: {txt: tr("No hay manera. El pique sigue."), fx: {mor: -2}, then: function () { S.p.flags.feud = {n: nm, c: S.p.club}; }}},
    {t: tr("Responder en el campo"), ok: {txt: tr("Te sobra motivación, pero el ambiente se enrarece."), fx: {form: 3, mor: -2}, then: function () { S.p.flags.feud = {n: nm, c: S.p.club}; }}}
  ]; }});
(function () {
  if (typeof blockDone !== "function") return;
  var _bd = blockDone;
  blockDone = function () {
    var p = S.p;
    if (p && p.flags) {
      if (p.flags.bff && p.flags.bff.c === p.club) p.mor = clamp(p.mor + 1.5, 0, 100);
      if (p.flags.feud && p.flags.feud.c === p.club) { p.mor = clamp(p.mor - 1, 0, 100); p.form = clamp(p.form + 0.5, 0, 100); }
    }
    return _bd.apply(this, arguments);
  };
})();

/* ---------- familia y momentos personales ---------- */
EV({id: "s33_bebe", tipo: "aleatoria", cat: "Familia", title: "Vas a ser padre", w: 1, once: true,
  when: function (x) { return x.inSeason && x.age >= 25 && x.age <= 36 && S.g !== "f"; },
  text: function () { return tr("Tu pareja sale de cuentas justo la semana de un partido importante. El club te deja decidir."); },
  opts: function () { return [
    {t: tr("Estar en el parto aunque te pierdas el partido"), ok: {txt: tr("Nace tu primer hijo. No hay partido que valga más que esto."), fx: {mor: 12, coach: -2}}},
    {t: tr("Jugar y salir corriendo al hospital"), p: 0.5, ok: {txt: tr("Llegas a tiempo, con la camiseta aún puesta. Una historia para contarle."), fx: {mor: 10, form: 3}}, ko: {txt: tr("Llegas tarde por diez minutos. No te lo perdonas."), fx: {mor: 2}}}
  ]; }});
EV({id: "s33_boda", tipo: "aleatoria", cat: "Familia", title: "La boda de tu hermano", w: 1, once: true,
  when: function (x) { return x.inSeason && x.age >= 20; },
  text: function () { return tr("Tu hermano se casa el mismo sábado que tenéis partido fuera de casa."); },
  opts: function () { return [
    {t: tr("Pedir permiso para ir a la boda"), ok: {txt: tr("Bailas hasta las tantas. Al míster no le hace gracia."), fx: {mor: 8, coach: -4}}},
    {t: tr("Jugar y llegar al banquete"), ok: {txt: tr("Llegas a los postres, con el resultado en la boca. Tu hermano lo agradece."), fx: {mor: 3}}},
    {t: tr("Perdértela"), ok: {txt: tr("Mandas un vídeo. Sabe a poco."), fx: {mor: -5, prof: 2}}}
  ]; }});
EV({id: "s33_padres", tipo: "aleatoria", cat: "Familia", title: "Tus padres en la grada", w: 1.2, cd: 3,
  when: function (x) { return x.inSeason && x.abroad; },
  text: function () { return tr("Tus padres cruzan medio mundo para verte jugar por primera vez desde que te fuiste al extranjero."); },
  opts: function () { return [
    {t: tr("Prometerles un gol"), p: 0.45, ok: {txt: tr("Marcas y corres hacia su asiento. Tu madre llora en la grada."), fx: {mor: 8, fame: 2}}, ko: {txt: tr("No hay gol, pero esa noche cenáis juntos y te sienta de maravilla."), fx: {mor: 3}}},
    {t: tr("Invitarles a la ciudad deportiva"), ok: {txt: tr("Conocen a tus compañeros y al míster. Te sientes en casa."), fx: {mor: 5, coach: 1}}}
  ]; }});
EV({id: "s33_mudanza", tipo: "aleatoria", cat: "Familia", title: "La familia no se adapta", w: 1, cd: 4,
  when: function (x) { return x.inSeason && x.abroad && x.yrsAtClub <= 1; },
  text: function () { return tr("Tu familia lo está pasando mal en la nueva ciudad: el idioma, el clima, el colegio… Te lo cuentan cada noche."); },
  opts: function () { return [
    {t: tr("Pagar un colegio internacional y clases de idioma"), ok: {txt: tr("Poco a poco se van adaptando."), fx: {money: -60000, mor: 5}}},
    {t: tr("Que vuelvan a casa una temporada"), ok: {txt: tr("Les echas de menos, pero te centras en el fútbol."), fx: {mor: -4, form: 2}}},
    {t: tr("Pedirle al club que te busque una salida"), ok: {txt: tr("El club toma nota. Tu entrenador, también."), fx: {coach: -6, mor: 3}}}
  ]; }});
MEV({id: "s33_familia", tipo: "aleatoria", cat: "Club", title: "Tu hija juega en la cantera rival", w: 0.8, once: true,
  when: function (y) { return y.inSeason && y.m.age >= 42; },
  text: function () { return tr("Tu hija acaba de fichar por la cantera del eterno rival. La prensa se ha enterado y quiere saber qué opinas."); },
  opts: function () { return [
    {t: tr("Presumir de hija en rueda de prensa"), ok: {txt: tr("«El fútbol es suyo, no mío». Todo el mundo aplaude el gesto."), fx: {rep: 2, fans: 2}}},
    {t: tr("Bromear: «En casa, la camiseta buena es la nuestra»"), ok: {txt: tr("Risas en la sala y un titular simpático."), fx: {fans: 3}}},
    {t: tr("No hablar de tu familia"), ok: {txt: tr("La prensa respeta tu silencio."), fx: {}}}
  ]; }});
MEV({id: "s33_aniversario", tipo: "aleatoria", cat: "Club", title: "Un aniversario en mal momento", w: 0.8, cd: 4,
  when: function (y) { return y.inSeason; },
  text: function () { return tr("Tu aniversario de boda cae en plena semana de viaje con el equipo. En casa no están contentos."); },
  opts: function () { return [
    {t: tr("Escaparte una noche"), ok: {txt: tr("Cena sorpresa y vuelta en el primer vuelo. Tu segundo te cubre."), fx: {chem: -1}}},
    {t: tr("Quedarte con el equipo"), ok: {txt: tr("El vestuario lo valora; en casa te esperan explicaciones."), fx: {chem: 2}}}
  ]; }});

/* ---------- despedida de leyenda ---------- */
function farewellOn() { var r = S && S.retired, p = S && S.p; if (!r || !p) return false; return p.seasons.length >= 10 || p.trophies.length >= 5 || p.intl.caps >= 50 || (r.lg && r.lg.sc >= 60); }
var FAREWELL = [
  {k: "thanks", n: N_("Dar las gracias a todos"), q: N_("«Gracias a cada compañero, a cada entrenador y a cada persona que alguna vez coreó mi nombre. Esto ha sido un sueño.»")},
  {k: "humor", n: N_("Despedirte con humor"), q: N_("«Me voy antes de que el balón empiece a correr más que yo. Nos vemos en la grada… o en el banquillo.»")},
  {k: "future", n: N_("Mirar al futuro"), q: N_("«Hoy cuelgo las botas, pero no me voy del fútbol. Lo mejor está por llegar.»")}
];
function farewellSay(k) {
  var r = S.retired; if (!r || r.speech) return false;
  r.speech = k;
  if (typeof socPostRaw === "function") {
    try { socPostRaw({by: "fan", tk: N_("Una leyenda se despide. Gracias por todo, {name}. 👏"), tp: {name: S.p.fn + " " + S.p.ln}, mood: 1}); } catch (e) {}
  }
  if (typeof diaryAdd === "function") diaryAdd("retire", {});
  return true;
}
