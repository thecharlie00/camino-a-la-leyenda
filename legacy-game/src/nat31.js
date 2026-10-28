/* nat31.js — versión 3.1 «Camino al Mundial».
   - Concentraciones, convocatorias y amistosos con decisiones (jugador convocado y seleccionador).
   - Sorteo con ceremonia de Mundial, Eurocopa, Copa América… cuando juega tu país, aunque no estés convocado.
   - El seleccionador prepara cada ventana: sus decisiones dan un pequeño plus (o minus) al partido. */
function n31NT() { return typeof mpNT === "function" ? mpNT() : null; }
function n31Bf(v) { var nt = n31NT(); if (nt) nt.bf = clamp((nt.bf || 0) + v, -2, 2); }

/* ---------- seleccionador ---------- */
MEV({id: "n31_lista", tipo: "aleatoria", cat: "Selección", title: "La lista de convocados", manual: true, noClub: true,
  text: function () { return tr("Llega la ventana internacional y tienes que cerrar la lista. Un veterano que lo ganó todo vuelve a estar en forma y un joven lleva semanas marcando en su club."); },
  opts: function () { return [
    {t: tr("Llamar al veterano"), d: tr("Experiencia para un partido serio."), ok: {txt: tr("El veterano da galones al grupo desde el primer entrenamiento."), fx: {rep: 1}, then: function () { n31Bf(0.6); }}},
    {t: tr("Dar la oportunidad al joven"), d: tr("Puede salir muy bien… o pesarle la camiseta."), p: 0.6,
      ok: {txt: tr("El chaval se sale en los entrenamientos y la prensa habla de relevo generacional."), fx: {rep: 2}, then: function () { n31Bf(0.8); }},
      ko: {txt: tr("Se le nota nervioso y el grupo lo nota."), fx: {rep: -1}, then: function () { n31Bf(-0.3); }}},
    {t: tr("Repetir la lista de siempre"), ok: {txt: tr("Nadie se sorprende. El grupo funciona de memoria."), fx: {}, then: function () { n31Bf(0.3); }}}
  ]; }});
MEV({id: "n31_amistoso", tipo: "aleatoria", cat: "Selección", title: "Amistoso de preparación", manual: true, noClub: true,
  text: function () { return tr("La federación ha cerrado un amistoso antes del partido oficial. ¿Para qué lo usas?"); },
  opts: function () { return [
    {t: tr("Probar a los suplentes"), d: tr("Llegarán con menos rodaje juntos, pero conocerás a todos."), ok: {txt: tr("Ves cosas interesantes en el banquillo, aunque el once titular pierde ritmo."), fx: {rep: 1}, then: function () { n31Bf(-0.2); }}},
    {t: tr("Jugar con los titulares"), ok: {txt: tr("Automatismos engrasados para el partido que cuenta."), fx: {}, then: function () { n31Bf(0.5); }}},
    {t: tr("Cambiarlo por dos días de entrenamiento"), ok: {txt: tr("Sin partido, pero con tiempo para trabajar la táctica."), fx: {}, then: function () { n31Bf(0.3); }}}
  ]; }});
MEV({id: "n31_concentracion", tipo: "aleatoria", cat: "Selección", title: "Una concentración larga", manual: true, noClub: true,
  text: function () { return tr("Son diez días juntos en la ciudad deportiva de la federación. Algunos jugadores echan de menos a su familia."); },
  opts: function () { return [
    {t: tr("Concentración cerrada, sin visitas"), d: tr("Máxima concentración, pero el grupo puede agobiarse."), p: 0.6,
      ok: {txt: tr("El grupo se conjura: nadie piensa en otra cosa que en el partido."), fx: {}, then: function () { n31Bf(0.6); }},
      ko: {txt: tr("El ambiente se enrarece y alguno lo comenta en redes."), fx: {rep: -1}, then: function () { n31Bf(-0.4); }}},
    {t: tr("Abrir un día a las familias"), ok: {txt: tr("Una tarde de sonrisas que el vestuario agradece."), fx: {}, then: function () { n31Bf(0.3); }}},
    {t: tr("Entrenamiento a puerta abierta con la afición"), ok: {txt: tr("Gradas llenas y miles de niños pidiendo autógrafos."), fx: {rep: 2}, then: function () { n31Bf(0.2); }}}
  ]; }});
MEV({id: "n31_club", tipo: "aleatoria", cat: "Selección", title: "Un club protesta", manual: true, noClub: true,
  text: function () { return tr("Un club grande se queja: dice que su estrella vuelve tocada de cada ventana internacional y pide que no juegue los 90 minutos."); },
  opts: function () { return [
    {t: tr("Dosificarle"), ok: {txt: tr("El club lo agradece. Tú pierdes algo de calidad en el partido."), fx: {rep: 1}, then: function () { n31Bf(-0.3); }}},
    {t: tr("Jugará lo que haga falta"), ok: {txt: tr("La selección es lo primero. El club no se queda contento."), fx: {rep: -1}, then: function () { n31Bf(0.4); }}}
  ]; }});
(function () {
  if (typeof mpNatWindow !== "function") return;
  var _w = mpNatWindow;
  mpNatWindow = function () {
    var r = _w.apply(this, arguments), nt = n31NT();
    if (nt && chance(0.75)) {
      var ids = ["n31_lista", "n31_amistoso", "n31_concentracion", "n31_club"], last = nt.lastEv, id = pick(ids.filter(function (x) { return x !== last; }));
      nt.lastEv = id; S.pend.unshift(mp("mev", {id: id}));
    }
    return r;
  };
  var _rt = mpNatRating;
  mpNatRating = function () { var nt = n31NT(); return round1(_rt.apply(this, arguments) + (nt && nt.bf ? nt.bf : 0)); };
  var _pl = mpNatPlay;
  mpNatPlay = function () { var r = _pl.apply(this, arguments), nt = n31NT(); if (nt) nt.bf = 0; return r; };
})();

/* ---------- jugador convocado ---------- */
function n31Called(x) { var lc = x.p.flags && x.p.flags.lastCall; return x.inSeason && lc != null && S.tw - lc <= 10 && x.p.intl.caps >= 1; }
(function () {
  if (typeof callUp !== "function") return;
  var _cu = callUp;
  callUp = function () { var r = _cu.apply(this, arguments); if (r && S.p) { S.p.flags = S.p.flags || {}; S.p.flags.lastCall = S.tw; } return r; };
})();
EV({id: "n31_novatada", tipo: "aleatoria", cat: "Selección", title: "La novatada", w: 1.3, once: true,
  when: function (x) { return n31Called(x) && x.p.intl.caps <= 6; },
  text: function () { return tr("Primera cena de la concentración: los veteranos golpean los vasos. Te toca subirte a una silla y cantar delante de todos."); },
  opts: function () { return [
    {t: tr("Cantar con todas tus fuerzas"), p: 0.7, ok: {txt: tr("Desafinas, pero el comedor se viene abajo. Ya eres uno más."), fx: {mor: 6, fame: 1}}, ko: {txt: tr("Te quedas en blanco a mitad de canción. Las risas duran toda la semana."), fx: {mor: -2}}},
    {t: tr("Convencer a otro novato para cantar a dúo"), ok: {txt: tr("Un dúo inesperado que acaba en el móvil de medio vestuario."), fx: {mor: 4}}},
    {t: tr("Negarte"), ok: {txt: tr("Los veteranos no lo olvidan fácilmente."), fx: {mor: -4}}}
  ]; }});
EV({id: "n31_posicion", tipo: "aleatoria", cat: "Selección", title: "Te prueban en otra posición", w: 1, cd: 3,
  when: function (x) { return n31Called(x) && x.g !== "POR"; },
  text: function () { return tr("El seleccionador te llama a su despacho: le faltan efectivos en otra demarcación y quiere probarte ahí en el amistoso."); },
  opts: function () { return [
    {t: tr("Aceptar sin rechistar"), p: 0.55, ok: {txt: tr("Cumples con nota y el seleccionador te ve como un comodín."), fx: {fame: 2, mor: 4}}, ko: {txt: tr("Se te ve perdido y la prensa lo destaca."), fx: {form: -4, mor: -2}}},
    {t: tr("Pedir jugar en tu puesto"), ok: {txt: tr("Respeta tu opinión, pero esta vez no juegas el amistoso."), fx: {mor: -1}}}
  ]; }});
EV({id: "n31_amistoso_p", tipo: "aleatoria", cat: "Selección", title: "¿Amistoso o descanso?", w: 1.1, cd: 2,
  when: function (x) { return n31Called(x) && x.p.fit < 80; },
  text: function () { return tr("Llegas cargado a la concentración. El cuerpo técnico te deja elegir: jugar el amistoso o descansar para volver fresco a tu club."); },
  opts: function () { return [
    {t: tr("Jugar el amistoso"), ok: {txt: tr("Minutos con la selección y buenas sensaciones, aunque vuelves cansado."), fx: {form: 3, fit: -6, fame: 1}}},
    {t: tr("Descansar"), ok: {txt: tr("Tu club agradece que vuelvas fresco."), fx: {fit: 8, coach: 2}}}
  ]; }});
EV({id: "n31_filtracion", tipo: "aleatoria", cat: "Selección", title: "Alguien filtra la alineación", w: 0.9, cd: 4,
  when: function (x) { return n31Called(x) && x.age >= 22; },
  text: function () { return tr("La alineación del partido sale publicada horas antes de que el seleccionador la diga en el vestuario. Hay mal ambiente y todos se miran."); },
  opts: function () { return [
    {t: tr("Hablar en nombre del grupo"), p: 0.6, ok: {txt: tr("Tu discurso calma las aguas y el seleccionador te lo agradece."), fx: {mor: 4, fame: 2}}, ko: {txt: tr("Alguno piensa que vas de líder sin serlo."), fx: {mor: -3}}},
    {t: tr("No meterte"), ok: {txt: tr("El asunto se apaga solo, aunque el ambiente queda tocado."), fx: {mor: -1}}}
  ]; }});

/* ---------- sorteo de los torneos de selecciones ---------- */
(function () {
  if (typeof mkNatTournament !== "function" || typeof drawBuildGroups !== "function") return;
  var _mk = mkNatTournament;
  mkNatTournament = function () {
    var c = _mk.apply(this, arguments);
    try {
      if (c && c.typ === "grp" && c.g && S && S.C) {
        var me = S.mode === "mgr" ? (n31NT() ? n31NT().ni : -1) : (S.p && S.p.inat >= 0 ? S.p.inat : -1);
        var key = c.k + ":g";
        S.drw = S.drw || [];
        if (me >= 0 && c.teams.indexOf(me) >= 0 && S.drw.indexOf(key) < 0) {
          var x = drawBuildGroups(c, me);
          S.drw.push(key); x.id = key + ":" + S.yr;
          drawAnalyze(c, x);
          if (S.mode === "mgr") x.ui = true;
          x.s = Math.floor(Math.random() * 1e9);
          S.pend.push(x);
        }
      }
    } catch (e) { if (typeof console !== "undefined") console.error(e); }
    return c;
  };
})();
/* el verano no arranca hasta que has visto el sorteo de tu selección */
(function () {
  function waiting() { return !!(S && S.pend && S.pend.some(function (x) { return x.k === "draw" && x.nat; })); }
  if (typeof continueRun === "function") { var _c = continueRun; continueRun = function () { if (waiting()) return "pause"; return _c.apply(this, arguments); }; }
  if (typeof mgrContinue === "function") { var _m = mgrContinue; mgrContinue = function () { if (waiting()) return "pause"; return _m.apply(this, arguments); }; }
})();
