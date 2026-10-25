/* gx-events.js — motor de decisiones en datos (5.6) y 60 decisiones nuevas del jugador.
   Cada decisión declara: condiciones (when), peso, enfriamiento en temporadas (cd), variantes de texto,
   opciones con desenlaces (la probabilidad puede depender de tus atributos o tu estado), efectos que
   no se enseñan en números, consecuencias aplazadas (later: llegan uno o dos tramos después),
   marcas para los trofeos (gx) y la escena de vóxeles que la ilustra (sc). */
var GXE = (function () {
  var api = {};
  /* ---------- condiciones ---------- */
  function rng(v, a) { return a == null || (v >= (a[0] == null ? -1e9 : a[0]) && v <= (a[1] == null ? 1e9 : a[1])); }
  function petOk() { try { var L = S.p.life; return !!(L && L.pet && L.pet.v === 2); } catch (e) { return false; } }
  function exClubs() { var o = {}; S.p.seasons.forEach(function (r) { (r.clubs || [r.club]).forEach(function (c) { if (c !== S.p.club && c >= 0) o[c] = 1; }); }); return Object.keys(o).length; }
  api.ok = function (w, x) {
    if (!w) return x.inSeason;
    var p = x.p;
    if (w.s !== 0 && !x.inSeason) return false;
    if (w.age && !rng(x.age, w.age)) return false;
    if (w.fame && !rng(p.fame, w.fame)) return false;
    if (w.form && !rng(p.form, w.form)) return false;
    if (w.mor && !rng(p.mor, w.mor)) return false;
    if (w.fit && !rng(p.fit, w.fit)) return false;
    if (w.coach && !rng(p.coach, w.coach)) return false;
    if (w.fans && !rng(p.fans, w.fans)) return false;
    if (w.ovr && !rng(p.ovr, w.ovr)) return false;
    if (w.gk != null && (p.pos === "POR") !== !!w.gk) return false;
    if (w.cap != null && !!p.flags.captain !== !!w.cap) return false;
    if (w.abroad != null && x.abroad !== !!w.abroad) return false;
    if (w.pet != null && petOk() !== !!w.pet) return false;
    if (w.inj != null && !!(p.inj && p.injT > S.tw) !== !!w.inj) return false;
    if (w.yrs != null && x.yrsAtClub < w.yrs) return false;
    if (w.caps != null && p.intl.caps < w.caps) return false;
    if (w.fol != null && p.fol < w.fol) return false;
    if (w.money != null && p.money < w.money) return false;
    if (w.lgTop != null && !(x.lgPos > 0 && x.lgPos <= w.lgTop)) return false;
    if (w.lgLow != null) { var li = S.cl[p.club], n = li >= 0 && S.L[li] ? S.L[li].tm.length : 20; if (!(x.lgPos > n - w.lgLow)) return false; }
    if (w.role && w.role.indexOf(x.role) < 0) return false;
    if (w.ex && exClubs() < 1) return false;
    if (w.loan != null && !!p.loan !== !!w.loan) return false;
    if (w.flag && !p.flags[w.flag]) return false;
    if (w.noflag && p.flags[w.noflag]) return false;
    if (w.gxf && !(typeof GX !== "undefined" && GX.has(w.gxf))) return false;
    if (w.nogxf && typeof GX !== "undefined" && GX.has(w.nogxf)) return false;
    if (w.mgr) return false;
    return true;
  };
  /* ---------- probabilidad: número o {b, att|st, k} ---------- */
  function prob(p, x) {
    if (p == null) return null;
    if (typeof p === "number") return p;
    var v = 0, base = p.b != null ? p.b : 0.5;
    if (p.att) { var at = attrs(), k = x.p.pos === "POR" && GX_GKMAP[p.att] ? GX_GKMAP[p.att] : p.att; v = (at[k] || x.p.ovr) - 65; }
    else if (p.st) v = (x.p[p.st] || 50) - 50;
    return clamp(base + v * (p.k || 0.01), p.min || 0.12, p.max || 0.88);
  }
  /* ---------- consecuencias aplazadas ---------- */
  function blk() { return S.yr * 10 + S.bi; }
  function later(L, id) { var g = GX.st(); g.later = g.later || []; g.later.push({due: blk() + (L.b || 1), txt: L.txt, fx: L.fx || {}, t: L.t || "ok", gx: L.gx || null, id: id}); }
  api.tick = function () {
    var g = GX.st(); if (!g || !g.later || !g.later.length || S.mode === "mgr") return;
    var now = blk(), keep = [];
    g.later.forEach(function (L) {
      if (L.due > now) { keep.push(L); return; }
      try { applyFx(L.fx || {}); } catch (e) {}
      if (L.gx) [].concat(L.gx).forEach(function (k) { if (/^\+/.test(k)) GX.add(k.slice(1)); else GX.flag(k); });
      if (L.txt) S.bnews.push({t: L.t === "bad" ? "bad" : "ok", x: tr(L.txt, vars())});
    });
    g.later = keep;
  };
  function vars() { var o = {club: X.club, nat: X.nat, lg: X.lg}; try { o.opp = X.opp(); } catch (e) { o.opp = tr("rival"); } try { var L = S.p.life; o.pet = L && L.pet ? L.pet.n || tr("tu mascota") : tr("tu mascota"); } catch (e) {} return o; }
  function outc(o, id) {
    if (!o) return null;
    var r = {txt: tr(o.txt, vars()), fx: o.fx || {}};
    if (o.n) r.n = o.n;
    if (o.gx || o.later) r.then = function () { if (o.gx) [].concat(o.gx).forEach(function (k) { if (/^\+/.test(k)) GX.add(k.slice(1)); else GX.flag(k); }); if (o.later) later(o.later, id); };
    return r;
  }
  /* ---------- registro como decisiones del motor de siempre ---------- */
  api.add = function (list) {
    list.forEach(function (d) {
      EV({id: "gx_" + d.id, tipo: d.tipo || "real", cat: d.cat, title: function () { return tr(d.title, vars()); }, once: !!d.once, cd: d.cd != null ? d.cd : 2, w: d.w || 0.8, gx: 1, sc: d.sc || "pitch",
        when: function (x) { return api.ok(d.when, x); },
        text: function (x) { var v = d.text; return tr(Array.isArray(v) ? X.spick(v, "t") : v, vars()); },
        opts: function (x) {
          return d.opts.map(function (o) {
            var r = {t: tr(o.t, vars()), blind: true};
            var pp = prob(o.p, x);
            r.ok = outc(o.ok, d.id); if (o.ko) { r.ko = outc(o.ko, d.id); r.p = pp != null ? pp : 0.5; }
            return r;
          });
        }});
    });
  };
  return api;
})();
/* ---------- textos marcados para el traductor (títulos y textos de cada decisión) ---------- */
GXE.add([
  /* vestuario */
  {id: "pelea_mediar", cat: N_("Vestuario"), sc: "locker", title: N_("Bronca en la ducha"), text: [N_("Dos compañeros llegan a las manos por una entrada fea en el entrenamiento. Todo el vestuario te mira."), N_("Un veterano y un recién llegado se encaran después del partido. Nadie se mete… de momento.")],
    opts: [{t: N_("Meterte en medio y calmarlos"), p: {st: "prof", b: 0.55, k: 0.006}, ok: {txt: N_("Los separas, hablas con los dos y acaban dándose la mano. El míster toma nota."), fx: {coach: 5, mor: 3}, gx: "mediator"}, ko: {txt: N_("Te llevas un empujón y la pelea sigue. Al menos lo intentaste."), fx: {mor: -2, coach: 1}}},
      {t: N_("Mirar hacia otro lado"), ok: {txt: N_("No es tu guerra. El ambiente queda enrarecido unos días."), fx: {mor: -1}}}]},
  {id: "cubrir", cat: N_("Vestuario"), sc: "locker", cd: 1, title: N_("Llegó tarde otra vez"), text: [N_("Un compañero llega tarde a la sesión y te pide que digas que estaba contigo en el fisio."), N_("Un amigo del vestuario se ha saltado la cena del equipo. Te pide que le cubras ante el delegado.")],
    opts: [{t: N_("Cubrirle"), p: 0.7, ok: {txt: N_("Cuela. Te debe una, y lo sabe."), fx: {mor: 2}, gx: "+covered"}, ko: {txt: N_("El delegado no se lo traga y os cae una multa a los dos."), fx: {money: -8000, coach: -4}, gx: "+covered"}},
      {t: N_("Decirle que no"), ok: {txt: N_("Le dices que cada uno responde de lo suyo. Se enfada un tiempo."), fx: {prof: 2, mor: -1}}}]},
  {id: "novato_consejo", cat: N_("Vestuario"), sc: "training", cd: 1, title: N_("El chaval de la cantera"), when: {age: [24, null]}, text: [N_("Un juvenil que acaba de subir te pregunta cómo hacías tú para no venirte abajo tras un mal partido."), N_("El canterano nuevo te sigue a todas partes. Hoy se atreve a pedirte consejo.")],
    opts: [{t: N_("Dedicarle una tarde"), ok: {txt: N_("Le cuentas tus peores días y cómo saliste. Se va con otra cara."), fx: {mor: 3, coach: 2}, gx: "+mentored", later: {b: 2, txt: N_("El canterano al que aconsejaste marca su primer gol y te lo dedica."), fx: {mor: 3, fans: 2}}}},
      {t: N_("Mandarle al psicólogo del club"), ok: {txt: N_("Le das el contacto. Correcto, pero algo frío."), fx: {}}}]},
  {id: "multa_interna", cat: N_("Vestuario"), sc: "locker", title: N_("La caja de multas"), text: [N_("Te toca gestionar la caja de multas del vestuario. Un pesado no paga desde hace meses.")],
    opts: [{t: N_("Exigirle que pague delante de todos"), p: 0.6, ok: {txt: N_("Paga entre risas. Se ha impuesto el orden."), fx: {coach: 2, mor: 2}}, ko: {txt: N_("Se lo toma fatal y se monta un pique tonto."), fx: {mor: -3}}},
      {t: N_("Poner tú lo que falta"), ok: {txt: N_("Pagas tú y nadie se entera. Paz en el vestuario."), fx: {money: -2000, mor: 1}}}]},
  {id: "cumple_vestuario", cat: N_("Vestuario"), sc: "party", tipo: "aleatoria", title: N_("Cumpleaños sorpresa"), text: [N_("Es tu cumpleaños y el vestuario ha preparado una tarta con tu cara. Hay que soplar delante de las cámaras del club.")],
    opts: [{t: N_("Soplar y dejar que te tiren la tarta"), ok: {txt: N_("El vídeo arrasa en las redes del club."), fx: {fol: 40, mor: 4}}}, {t: N_("Soplar con elegancia"), ok: {txt: N_("Discreto y sonriente. Buena foto."), fx: {mor: 2, fol: 10}}}]},
  {id: "grupo_whatsapp", cat: N_("Vestuario"), sc: "home", tipo: "aleatoria", title: N_("El audio del grupo"), text: [N_("Mandas sin querer un audio criticando al míster al grupo del equipo en vez de a tu pareja.")],
    opts: [{t: N_("Ir a pedirle perdón en persona"), p: {st: "coach", b: 0.5, k: 0.01}, ok: {txt: N_("Lo valora. «Prefiero que me lo digas a la cara.»"), fx: {coach: 2}}, ko: {txt: N_("Te escucha, pero te deja en el banquillo el domingo."), fx: {coach: -6, form: -2}}},
      {t: N_("Decir que te hackearon el móvil"), p: 0.35, ok: {txt: N_("Increíble, pero cuela."), fx: {}}, ko: {txt: N_("Nadie se lo cree. Te has ganado un apodo nuevo."), fx: {coach: -8, mor: -3}, gx: "liar"}}]},
  {id: "brazalete_comp", cat: N_("Vestuario"), sc: "locker", when: {cap: 1}, title: N_("Capitán en la sombra"), text: [N_("Llevas el brazalete, pero un veterano sigue mandando en el vestuario. Varios jóvenes te miran a ti.")],
    opts: [{t: N_("Hablar con él a solas"), p: {st: "prof", b: 0.55, k: 0.006}, ok: {txt: N_("Acordáis repartiros los papeles. Él manda fuera, tú dentro."), fx: {coach: 3, mor: 3}}, ko: {txt: N_("Se lo toma como una ofensa. Habrá que convivir."), fx: {mor: -3}}},
      {t: N_("Dejar que el tiempo lo arregle"), ok: {txt: N_("No mueves nada. Las cosas siguen igual."), fx: {}}}]},
  {id: "tactica_mal", cat: N_("Vestuario"), sc: "office", title: N_("La pizarra no convence"), text: [N_("El míster quiere que juegues de forma que no te sale natural. Te pregunta qué opinas.")],
    opts: [{t: N_("Decirle lo que piensas"), p: {st: "coach", b: 0.45, k: 0.012}, ok: {txt: N_("Lo escucha y ajusta un detalle. Te sientes más cómodo."), fx: {form: 4, coach: 2}}, ko: {txt: N_("«Aquí decido yo.» Os quedáis fríos."), fx: {coach: -5}}},
      {t: N_("Adaptarte sin rechistar"), ok: {txt: N_("Haces lo que pide. Cuesta, pero aprendes algo."), fx: {prof: 2, form: -1}, later: {b: 2, txt: N_("Lo que te pidió el míster empieza a salirte solo."), fx: {form: 3}}}}]},
  /* prensa y redes */
  {id: "mentira_prensa", cat: N_("Prensa"), sc: "press", title: N_("¿Te vas o te quedas?"), text: [N_("En rueda de prensa te preguntan por una oferta que existe de verdad. Tu agente te pidió silencio.")],
    opts: [{t: N_("Negarlo todo"), p: 0.5, ok: {txt: N_("Nadie insiste. El tema se enfría."), fx: {}}, ko: {txt: N_("A los dos días publican la oferta con documentos. Te han pillado."), fx: {fans: -6, fame: 1}, gx: "liar"}},
      {t: N_("«Hay interés, pero estoy centrado aquí»"), ok: {txt: N_("Respuesta de manual. Nadie puede reprocharte nada."), fx: {fans: 1}}}]},
  {id: "periodista_ex", cat: N_("Prensa"), sc: "press", title: N_("El exjugador opina"), when: {fame: [20, null]}, text: [N_("Un exjugador convertido en tertuliano dice en la tele que estás «sobrevalorado y sin carácter»."), N_("Un histórico del {club} te pone a parir en una columna. Medio país la comparte.")],
    opts: [{t: N_("Contestarle con dureza"), p: 0.5, ok: {txt: N_("Tu respuesta se hace viral. La afición se pone de tu lado."), fx: {fol: 30, fans: 3}, gx: "pressFight"}, ko: {txt: N_("Te pasas de frenada. El club te pide calma."), fx: {coach: -3, fol: 20}, gx: "pressFight"}},
      {t: N_("Responder en el campo"), ok: {txt: N_("Recortas la columna y la pegas en la taquilla."), fx: {buff: {v: 1, b: 1, n: N_("Con rabia")}}}}]},
  {id: "portada", cat: N_("Prensa"), sc: "press", when: {fame: [30, null]}, title: N_("Sesión de fotos"), text: [N_("Una revista quiere hacerte la portada del mes. La sesión dura todo el día libre.")],
    opts: [{t: N_("Aceptar"), ok: {txt: N_("Sales espectacular en la portada."), fx: {fame: 2, fol: 25, fit: -3}, gx: "+headlines"}}, {t: N_("Rechazarlo y descansar"), ok: {txt: N_("Prefieres recuperar. El cuerpo lo agradece."), fx: {fit: 4}}}]},
  {id: "foto_noche", cat: N_("Prensa"), sc: "party", tipo: "aleatoria", when: {fame: [15, null]}, title: N_("La foto de madrugada"), text: [N_("Un medio publica una foto tuya saliendo de un restaurante a la una de la mañana, con un refresco en la mano.")],
    opts: [{t: N_("Explicarlo con humor"), p: 0.75, ok: {txt: N_("Tu tuit con la foto del refresco triunfa."), fx: {fol: 20, fans: 2}}, ko: {txt: N_("El humor no gusta a la directiva."), fx: {coach: -3}}},
      {t: N_("No decir nada"), ok: {txt: N_("La noticia muere en un día."), fx: {}}}]},
  {id: "stream", cat: N_("Redes"), sc: "home", tipo: "aleatoria", title: N_("Directo en redes"), text: [N_("Te proponen hacer un directo jugando a un videojuego de fútbol con un creador de contenido famoso.")],
    opts: [{t: N_("Hacerlo"), p: 0.7, ok: {txt: N_("Te lo pasas en grande y lo ven miles de chavales."), fx: {fol: 60, mor: 3}}, ko: {txt: N_("Pierdes 7-0 con tu propio equipo. Memes para semanas."), fx: {fol: 40, mor: -2}}},
      {t: N_("No es lo tuyo"), ok: {txt: N_("Te quedas viendo una serie."), fx: {mor: 1}}}]},
  {id: "influencer_marca", cat: N_("Redes"), sc: "office", when: {fol: 500}, title: N_("Contrato con una marca de bebidas"), text: [N_("Una marca de bebidas energéticas quiere que publiques tres veces por semana. Pagan bien.")],
    opts: [{t: N_("Firmar"), ok: {txt: N_("Dinero fácil, aunque a algunos aficionados no les hace gracia."), fx: {money: 60000, fans: -2, fol: 30}}}, {t: N_("No firmar"), ok: {txt: N_("No quieres que tu muro parezca un anuncio."), fx: {fans: 1}}}]},
  {id: "pitada", cat: N_("Afición"), sc: "stadium", when: {fans: [null, 35]}, title: N_("Pitos en tu estadio"), text: [N_("Tu propia afición te pita al ser cambiado. Duele más que cualquier derrota.")],
    opts: [{t: N_("Aplaudir a la grada"), p: 0.5, ok: {txt: N_("El gesto cambia los pitos por un aplauso tímido."), fx: {fans: 6}}, ko: {txt: N_("Lo toman como ironía. Más pitos."), fx: {fans: -4, mor: -3}, gx: "booed"}},
      {t: N_("Irte directo al vestuario"), ok: {txt: N_("No miras atrás. Mañana será otro día."), fx: {mor: -2}, gx: "booed"}}]},
  {id: "nino_hospital2", cat: N_("Afición"), sc: "hospital", tipo: "aleatoria", cd: 3, title: N_("Una carta del hospital"), text: [N_("Te llega la carta de una niña ingresada que dice que eres su jugador favorito.")],
    opts: [{t: N_("Ir a verla por sorpresa"), ok: {txt: N_("Su cara cuando entras por la puerta vale más que un título."), fx: {mor: 6, fans: 4}, gx: "hospital", later: {b: 1, txt: N_("La niña del hospital sale de alta y va a verte al estadio con tu camiseta."), fx: {mor: 3, fans: 2}}}},
      {t: N_("Mandarle una camiseta firmada"), ok: {txt: N_("Le hace muchísima ilusión."), fx: {mor: 2}}}]},
  {id: "fan_tatuaje", cat: N_("Afición"), sc: "street", tipo: "aleatoria", when: {fame: [25, null]}, title: N_("Tu cara en un brazo"), text: [N_("Un aficionado te para por la calle para enseñarte que se ha tatuado tu cara. El parecido es… discutible.")],
    opts: [{t: N_("Hacerte una foto con él"), ok: {txt: N_("La foto da la vuelta al mundo."), fx: {fol: 30, fans: 2}}}, {t: N_("Darle las gracias y seguir"), ok: {txt: N_("Cordial. Él se va feliz igualmente."), fx: {}}}]},
  /* carrera y mercado */
  {id: "grande_llama", cat: N_("Mercado"), sc: "office", once: true, when: {yrs: 2, fame: [35, null]}, title: N_("Llama un grande"), text: [N_("Un club gigante de otra liga pregunta por ti. Tu club no quiere venderte y la afición te ha cantado toda la temporada.")],
    opts: [{t: N_("Quedarte por lealtad"), ok: {txt: N_("Comunicas que te quedas. La grada corea tu nombre el domingo."), fx: {fans: 10, mor: 4, coach: 3}, gx: "rejectBig"}}, {t: N_("Pedir que escuchen la oferta"), ok: {txt: N_("Tu club lo entiende… a regañadientes."), fx: {fans: -5, mor: 2}, later: {b: 2, txt: N_("La oferta del grande se enfría. Te quedas, pero algo se ha roto con la grada."), fx: {fans: -3}, t: "bad"}}}]},
  {id: "renovar_ya", cat: N_("Contrato"), sc: "office", when: {yrs: 1}, title: N_("Renovación sobre la mesa"), text: [N_("El director deportivo te ofrece ampliar contrato un año más con una pequeña mejora.")],
    opts: [{t: N_("Firmar ahora"), ok: {txt: N_("Firmas. Tranquilidad para todos."), fx: {sal: 1.08, mor: 3}, gx: null}}, {t: N_("Esperar a final de temporada"), p: {st: "form", b: 0.5, k: 0.01}, ok: {txt: N_("Tu buen momento te dará más fuerza para negociar."), fx: {mor: 1}}, ko: {txt: N_("El club se molesta y congela la negociación."), fx: {coach: -2}}}]},
  {id: "cesion_dudosa", cat: N_("Mercado"), sc: "office", when: {role: [N_("Suplente"), N_("Reserva"), N_("Promesa")], age: [null, 23]}, title: N_("¿Salir cedido?"), text: [N_("No cuentas mucho para el míster. Un club modesto te ofrece minutos asegurados hasta final de temporada.")],
    opts: [{t: N_("Pedir la cesión"), ok: {txt: N_("Tu club lo estudia: quiere verte crecer."), fx: {mor: 3}, later: {b: 1, txt: N_("La cesión no llega a cerrarse, pero el míster ha captado el mensaje y te da más minutos."), fx: {coach: 4}}}}, {t: N_("Quedarte y pelear"), ok: {txt: N_("Doblas los entrenamientos para ganarte el sitio."), fx: {prof: 3, fit: -3}}}]},
  {id: "agente_presion", cat: N_("Agente"), sc: "office", title: N_("Tu agente quiere moverte"), text: [N_("Tu agente insiste en filtrar que quieres salir para forzar una mejora de contrato.")],
    opts: [{t: N_("Dejar que lo haga"), p: 0.45, ok: {txt: N_("El club mejora tu sueldo para calmar las aguas."), fx: {sal: 1.15, fans: -4}}, ko: {txt: N_("El club no entra al trapo y la grada te señala."), fx: {fans: -8, coach: -3}}},
      {t: N_("Prohibírselo"), ok: {txt: N_("Le recuerdas quién manda. Se lo toma mal, pero obedece."), fx: {fans: 2}}}]},
  {id: "liga_exotica", cat: N_("Mercado"), sc: "plane", once: true, when: {age: [29, null]}, title: N_("Una oferta muy lejos"), text: [N_("Un club de una liga lejana te ofrece el triple de sueldo y un ático frente al mar."), N_("Te llama un representante con una oferta de una liga emergente. Dinero de otro planeta.")],
    opts: [{t: N_("Ir a conocer el proyecto"), ok: {txt: N_("Vuelves impresionado. El proyecto es serio."), fx: {mor: 2}, gx: "exotic"}}, {t: N_("No te interesa"), ok: {txt: N_("Aún te quedan cosas que demostrar donde estás."), fx: {prof: 2}}}]},
  {id: "vuelta_origen", cat: N_("Mercado"), sc: "street", when: {age: [30, null]}, title: N_("El club de tu infancia"), text: [N_("El presidente del club donde empezaste te llama: «Aquí siempre tendrás tu casa»."), N_("Los niños de la escuela de tu primer club te mandan un vídeo pidiéndote que vuelvas.")],
    opts: [{t: N_("Prometer que volverás algún día"), ok: {txt: N_("La noticia emociona a tu ciudad."), fx: {fans: 3, mor: 4}}}, {t: N_("Dar las gracias y no prometer nada"), ok: {txt: N_("Prudente. Nadie se ofende."), fx: {}}}]},
  /* salud y físico */
  {id: "fisio_medico", cat: N_("Salud"), sc: "hospital", title: N_("Dos opiniones"), text: [N_("Notas una molestia. El médico quiere que juegues; el fisio de toda la vida te dice que pares una semana.")],
    opts: [{t: N_("Hacer caso al fisio"), p: 0.6, ok: {txt: N_("Tenía razón: habría sido una rotura. Vuelves como nuevo."), fx: {fit: 10, coach: -2}, gx: "physioRight"}, ko: {txt: N_("No era nada y te pierdes un partido importante."), fx: {form: -3, coach: -3}}},
      {t: N_("Hacer caso al médico"), p: 0.6, ok: {txt: N_("Juegas sin problemas. Falsa alarma."), fx: {coach: 2}}, ko: {txt: N_("En el minuto 20 notas el pinchazo."), fx: {inj: [2, 4]}}}]},
  {id: "tocado_final", cat: N_("Salud"), sc: "locker", when: {fit: [null, 75]}, title: N_("Infiltrarse o no"), text: [N_("Llega un partido gordo y no estás al cien. Te ofrecen infiltrarte para jugar.")],
    opts: [{t: N_("Infiltrarte y jugar"), p: 0.7, ok: {txt: N_("Aguantas y el vestuario lo valora."), fx: {coach: 5, fans: 3}, gx: null, later: {b: 1, txt: N_("Pagas el esfuerzo con unos días de cansancio."), fx: {fit: -6}, t: "bad"}}, ko: {txt: N_("La molestia empeora. Te toca parar."), fx: {inj: [2, 5]}}},
      {t: N_("Parar"), ok: {txt: N_("Recuperas bien. Los partidos importantes vendrán."), fx: {fit: 12, coach: -2}}}]},
  {id: "dieta_nueva", cat: N_("Salud"), sc: "home", tipo: "aleatoria", title: N_("Dieta de moda"), text: [N_("Un compañero jura que una dieta sin nada de hidratos le ha cambiado la vida.")],
    opts: [{t: N_("Probarla"), p: 0.3, ok: {txt: N_("Te sienta bien. Te ves más ligero."), fx: {fit: 4}}, ko: {txt: N_("Te quedas sin energía en el segundo tiempo."), fx: {fit: -6, form: -3}}},
      {t: N_("Preguntar al nutricionista del club"), ok: {txt: N_("Te ajusta la dieta con sentido común."), fx: {fit: 3, prof: 2}}}]},
  {id: "sueno", cat: N_("Salud"), sc: "home", tipo: "aleatoria", title: N_("No duermes"), text: [N_("Llevas varias noches durmiendo mal antes de los partidos.")],
    opts: [{t: N_("Hablar con el psicólogo"), ok: {txt: N_("Unas rutinas sencillas y vuelves a descansar."), fx: {mor: 3, fit: 3}}}, {t: N_("Aguantar"), p: 0.5, ok: {txt: N_("Se pasa solo."), fx: {}}, ko: {txt: N_("Llegas al partido con los ojos cerrados."), fx: {form: -4, fit: -4}}}]},
  {id: "pretemporada_extra", cat: N_("Entrenamiento"), sc: "training", title: N_("Doble sesión"), when: {form: [null, 55]}, text: [N_("No estás en tu mejor momento. El preparador te ofrece una sesión extra cada tarde.")],
    opts: [{t: N_("Aceptar"), ok: {txt: N_("Sudas como nunca."), fx: {fit: -4, prof: 2}, later: {b: 1, txt: N_("Las sesiones extra dan su fruto: vuelves a sentirte rápido."), fx: {form: 6}}}}, {t: N_("Descansar mejor"), ok: {txt: N_("Prefieres no cargar más las piernas."), fx: {fit: 3}}}]},
  /* partidos y juego */
  {id: "pedir_penalti", cat: N_("Partido"), sc: "pitch", title: N_("El balón del penalti"), when: {noflag: "pens", gk: 0}, text: [N_("Penalti a favor en un partido apretado. El lanzador oficial duda. Tú tienes ganas.")],
    opts: [{t: N_("Pedirle el balón"), p: {att: "TIR", b: 0.6, k: 0.012}, ok: {txt: N_("Lo coges, miras al portero y la cuelas por la escuadra."), fx: {form: 5, fans: 3, coach: -1}, gx: "askPenScore"}, ko: {txt: N_("Lo fallas. Todo el estadio sabe que no te tocaba."), fx: {form: -5, coach: -5, fans: -3}}},
      {t: N_("Dejárselo a él"), ok: {txt: N_("Lo tira él. Respeto a la jerarquía."), fx: {coach: 2}}}]},
  {id: "fingir", cat: N_("Partido"), sc: "pitch", title: N_("Tocado en el área"), text: [N_("Un defensa te roza dentro del área. Podrías dejarte caer.")],
    opts: [{t: N_("Tirarte"), p: 0.35, ok: {txt: N_("El árbitro pica: penalti."), fx: {fans: 1}}, ko: {txt: N_("Amarilla por simular y pitos de todo el campo."), fx: {fans: -4, fame: -1}}},
      {t: N_("Seguir de pie"), ok: {txt: N_("Sigues la jugada. El estadio aplaude tu deportividad."), fx: {fans: 2, prof: 1}}}]},
  {id: "gesto_rival", cat: N_("Partido"), sc: "pitch", title: N_("Un rival lesionado"), text: [N_("Un rival cae lesionado y tu equipo tiene el balón en ataque.")],
    opts: [{t: N_("Echar el balón fuera"), ok: {txt: N_("Gesto de deportividad. La prensa lo destaca."), fx: {fans: 2, fame: 1}}}, {t: N_("Seguir jugando"), p: 0.5, ok: {txt: N_("Es fútbol: la jugada termina en córner."), fx: {}}, ko: {txt: N_("La grada rival te dedica una pitada histórica."), fx: {fans: -2}}}]},
  {id: "camiseta_rival", cat: N_("Partido"), sc: "pitch", title: N_("La camiseta del ídolo"), text: [N_("Al acabar el partido, una estrella rival te pide cambiar las camisetas. Habéis perdido.")],
    opts: [{t: N_("Cambiarla igualmente"), ok: {txt: N_("Un recuerdo para siempre… pero algunos aficionados no lo entienden."), fx: {mor: 3, fans: -2}}}, {t: N_("Hacerlo en el túnel, sin cámaras"), ok: {txt: N_("Discreto. La camiseta ya cuelga en tu casa."), fx: {mor: 2}}}]},
  {id: "lluvia_partido", cat: N_("Partido"), sc: "stadium", tipo: "aleatoria", title: N_("Diluvio"), text: [N_("Cae un diluvio y el campo está encharcado. El árbitro pregunta a los capitanes si se puede jugar.")],
    opts: [{t: N_("Jugar"), p: {att: "FIS", b: 0.55, k: 0.01}, ok: {txt: N_("Partido de barro y épica. Sales ovacionado."), fx: {fans: 3, fit: -4}}, ko: {txt: N_("Resbalones y un golpe tonto."), fx: {fit: -8}}},
      {t: N_("Pedir el aplazamiento"), ok: {txt: N_("Se aplaza. Mejor para las piernas."), fx: {fit: 3}}}]},
  {id: "celebracion_polemica", cat: N_("Partido"), sc: "stadium", when: {ex: 1}, title: N_("Contra tu antiguo equipo"), text: [N_("Juegas contra uno de tus ex clubes. Su grada no te ha perdonado la salida.")],
    opts: [{t: N_("Celebrar el gol si llega"), p: {att: "TIR", b: 0.4, k: 0.01}, ok: {txt: N_("Marcas y lo celebras con todo delante de ellos."), fx: {fans: 4, fame: 2, coach: -1}, gx: "exCelebrate"}, ko: {txt: N_("No marcas y te cantan todo el partido."), fx: {mor: -3}}},
      {t: N_("Pedir perdón si marcas"), ok: {txt: N_("Respeto por tu pasado. Aplausos de las dos aficiones."), fx: {fans: 2, prof: 2}}}]},
  {id: "homenaje_final", cat: N_("Despedida"), sc: "stadium", once: true, when: {age: [35, null], fame: [40, null]}, title: N_("Partido homenaje"), text: [N_("Tu club quiere organizarte un partido homenaje con antiguos compañeros. Estadio lleno asegurado.")],
    opts: [{t: N_("Aceptar"), ok: {txt: N_("Noche inolvidable: te mantean, lloras y tu familia salta al césped."), fx: {mor: 10, fans: 8, fame: 3}, gx: "tribute"}}, {t: N_("Preferir una despedida discreta"), ok: {txt: N_("Un aplauso del vestuario y una cena con los tuyos."), fx: {mor: 4}}}]},
  /* selección */
  {id: "capitan_seleccion", cat: N_("Selección"), sc: "stadium", once: true, when: {caps: 30, age: [26, null]}, title: N_("El brazalete de tu país"), text: [N_("El seleccionador te llama: el capitán se retira y quiere que el brazalete sea tuyo.")],
    opts: [{t: N_("Aceptar con orgullo"), ok: {txt: N_("Capitán de {nat}. Tu familia no se lo cree."), fx: {mor: 8, fame: 4}, gx: "natCaptain"}}, {t: N_("Proponer a otro"), ok: {txt: N_("Prefieres liderar sin brazalete. El seleccionador lo respeta."), fx: {prof: 2}}}]},
  {id: "seleccion_lesion", cat: N_("Selección"), sc: "plane", when: {caps: 1}, title: N_("Convocado tocado"), text: [N_("Te convocan con la selección, pero tu club pide que no viajes porque arrastras molestias.")],
    opts: [{t: N_("Ir con la selección"), p: 0.6, ok: {txt: N_("Juegas bien y vuelves entero."), fx: {fame: 2, coach: -3}}, ko: {txt: N_("Vuelves peor. Tu club está furioso."), fx: {coach: -8, fit: -8}}},
      {t: N_("Quedarte a recuperar"), ok: {txt: N_("Tu club te lo agradece. La prensa de tu país, no tanto."), fx: {coach: 4, fans: -1}}}]},
  {id: "himno", cat: N_("Selección"), sc: "stadium", tipo: "aleatoria", when: {caps: 1}, title: N_("Se rompe la megafonía"), text: [N_("En pleno himno se cae el sonido del estadio. Los jugadores se miran.")],
    opts: [{t: N_("Seguir cantándolo a capela"), ok: {txt: N_("Todo el equipo te sigue. Piel de gallina en el estadio."), fx: {fans: 3, mor: 4, fol: 20}}}, {t: N_("Esperar en silencio"), ok: {txt: N_("Vuelve el sonido y se reanuda. Anécdota."), fx: {}}}]},
  /* vida */
  {id: "coche_nuevo", cat: N_("Vida"), sc: "street", tipo: "aleatoria", when: {money: 200000}, title: N_("El coche de tus sueños"), text: [N_("Pasas por delante de un concesionario y ahí está: el deportivo que tenías en un póster de niño.")],
    opts: [{t: N_("Comprarlo"), ok: {txt: N_("Lo aparcas en la ciudad deportiva. Envidia general."), fx: {money: -150000, mor: 5}}}, {t: N_("Seguir andando"), ok: {txt: N_("Tu yo de doce años no te lo perdona."), fx: {}}}]},
  {id: "familia_visita", cat: N_("Vida"), sc: "home", tipo: "aleatoria", title: N_("Visita de la familia"), text: [N_("Tus padres vienen a pasar una semana contigo."), N_("Tu abuela se presenta por sorpresa con comida para un mes.")],
    opts: [{t: N_("Dedicarles todo el tiempo libre"), ok: {txt: N_("Recargas pilas como hacía tiempo."), fx: {mor: 6, fit: -1}}}, {t: N_("Seguir tu rutina"), ok: {txt: N_("Disciplina ante todo."), fx: {prof: 2, mor: 1}}}]},
  {id: "fiesta_vispera", cat: N_("Vida"), sc: "party", tipo: "aleatoria", title: N_("Fiesta la noche antes"), text: [N_("Unos amigos celebran un cumpleaños la víspera del partido. Insisten en que vayas «solo un rato»."), N_("Tu primo se casa el sábado por la noche… y el domingo juegas.")],
    opts: [{t: N_("Ir un rato"), p: 0.55, ok: {txt: N_("Vuelves a una hora decente y con buen ánimo."), fx: {mor: 4}}, ko: {txt: N_("Se te va de las manos. Al día siguiente lo notas."), fx: {fit: -8, form: -4, coach: -3}}},
      {t: N_("Quedarte en casa"), ok: {txt: N_("Te pierdes la fiesta, pero llegas fresco."), fx: {fit: 3}}}]},
  {id: "boda_amigo", cat: N_("Vida"), sc: "party", tipo: "aleatoria", title: N_("Padrino de boda"), text: [N_("Tu mejor amigo de la infancia te pide que seas su padrino. La boda cae en semana de partido.")],
    opts: [{t: N_("Pedir permiso al club para ir"), p: {st: "coach", b: 0.5, k: 0.012}, ok: {txt: N_("Te dejan ir. Discurso épico."), fx: {mor: 7}}, ko: {txt: N_("El club se niega. Lo ves por videollamada."), fx: {mor: -4}}},
      {t: N_("Disculparte con él"), ok: {txt: N_("Lo entiende, pero le duele."), fx: {mor: -2}}}]},
  {id: "estudios", cat: N_("Vida"), sc: "home", tipo: "aleatoria", when: {age: [21, null]}, title: N_("Volver a estudiar"), text: [N_("Te planteas matricularte en una carrera a distancia para cuando cuelgues las botas.")],
    opts: [{t: N_("Matricularte"), ok: {txt: N_("Apuntes entre viajes. Tu madre está orgullosa."), fx: {mor: 3, fit: -1}, later: {b: 2, txt: N_("Apruebas tus primeros exámenes a distancia."), fx: {mor: 3}}}}, {t: N_("Más adelante"), ok: {txt: N_("Ahora toca fútbol."), fx: {}}}]},
  {id: "ong", cat: N_("Vida"), sc: "street", tipo: "aleatoria", when: {money: 100000}, title: N_("Fundación propia"), text: [N_("Una ONG de tu barrio te propone ser su imagen y donar parte de tus primas.")],
    opts: [{t: N_("Aceptar"), ok: {txt: N_("Tu barrio te lo agradece con un mural."), fx: {money: -40000, fans: 5, mor: 5}}}, {t: N_("Colaborar sin poner tu imagen"), ok: {txt: N_("Ayudas en silencio."), fx: {money: -20000, mor: 3}}}]},
  {id: "mudanza", cat: N_("Vida"), sc: "home", tipo: "aleatoria", title: N_("Vecinos ruidosos"), text: [N_("Tus vecinos montan fiestas cada noche y no hay manera de dormir.")],
    opts: [{t: N_("Mudarte"), ok: {txt: N_("Casa nueva, silencio nuevo."), fx: {money: -25000, fit: 3}}}, {t: N_("Invitarles a un partido"), p: 0.6, ok: {txt: N_("Se hacen socios del club y bajan la música."), fx: {mor: 2}}, ko: {txt: N_("Van al partido… y siguen de fiesta después."), fx: {fit: -3}}}]},
  {id: "videojuego_media", cat: N_("Vida"), sc: "home", tipo: "aleatoria", title: N_("Tu media en el videojuego"), text: [N_("Sale el nuevo videojuego de fútbol y tu valoración es más baja de lo que crees merecer.")],
    opts: [{t: N_("Quejarte en redes"), p: 0.5, ok: {txt: N_("Te suben un punto en la siguiente actualización. Victoria."), fx: {fol: 25}}, ko: {txt: N_("Los aficionados te sacan tus estadísticas. Silencio."), fx: {fol: 10, mor: -2}}},
      {t: N_("Usarlo como motivación"), ok: {txt: N_("Haces captura y la guardas en el móvil."), fx: {buff: {v: 0.8, b: 1, n: N_("Motivado")}}}}]},
  {id: "moneda_suerte", cat: N_("Vida"), sc: "street", tipo: "aleatoria", title: N_("El amuleto"), text: [N_("Encuentras una moneda antigua en el aparcamiento el día que marcas. ¿Será casualidad?")],
    opts: [{t: N_("Llevarla en la bota cada partido"), ok: {txt: N_("Superstición asumida. El utillero ya lo sabe."), fx: {mor: 3}}}, {t: N_("Guardarla en un cajón"), ok: {txt: N_("No crees en esas cosas… o eso dices."), fx: {}}}]},
  /* mascota */
  {id: "mascota_club", cat: N_("Mascota"), sc: "stadium", once: true, when: {pet: 1, fame: [30, null]}, title: N_("¿Mascota oficial?"), text: [N_("El departamento de marketing ha visto a {pet} en tus redes y quiere que sea la mascota oficial del club una temporada.")],
    opts: [{t: N_("Aceptar"), ok: {txt: N_("{pet} sale al césped antes de cada partido. Los niños enloquecen."), fx: {fans: 6, fol: 40}, gx: "petMascot"}}, {t: N_("Preferir que siga en casa"), ok: {txt: N_("Lo tuyo con {pet} es privado."), fx: {}}}]},
  {id: "mascota_anuncio", cat: N_("Mascota"), sc: "office", when: {pet: 1}, title: N_("Un anuncio con {pet}"), text: [N_("Una marca de comida para mascotas quiere rodar un anuncio contigo y con {pet}.")],
    opts: [{t: N_("Rodarlo"), p: 0.75, ok: {txt: N_("{pet} es una estrella natural. El anuncio triunfa."), fx: {money: 30000, fol: 50}, gx: "petAd"}, ko: {txt: N_("{pet} se come el decorado. El anuncio sale igual… y es aún más gracioso."), fx: {money: 20000, fol: 70}, gx: "petAd"}},
      {t: N_("No exponer a {pet}"), ok: {txt: N_("Lo rechazas con cariño."), fx: {}}}]},
  {id: "mascota_perdida", cat: N_("Mascota"), sc: "street", tipo: "aleatoria", when: {pet: 1}, title: N_("¡{pet} se ha escapado!"), text: [N_("Al volver del entrenamiento, la puerta está abierta y {pet} no aparece.")],
    opts: [{t: N_("Salir a buscarle tú mismo"), ok: {txt: N_("Le encuentras dos calles más allá, jugando con unos niños."), fx: {mor: 2, fit: -2}}}, {t: N_("Pedir ayuda en redes"), ok: {txt: N_("En una hora te mandan foto de dónde está. Tus seguidores son los mejores."), fx: {fol: 20}}}]},
  {id: "mascota_entreno", cat: N_("Mascota"), sc: "training", tipo: "aleatoria", when: {pet: 1}, title: N_("Invasión de campo"), text: [N_("{pet} se cuela en la ciudad deportiva y se pone a perseguir el balón en pleno rondo.")],
    opts: [{t: N_("Dejar que juegue un rato"), ok: {txt: N_("El vídeo del rondo con {pet} lo comparte hasta el club."), fx: {fol: 35, mor: 3}}}, {t: N_("Llevarle a casa"), ok: {txt: N_("El míster agradece que no se pierda la sesión."), fx: {coach: 1}}}]},
  /* imprevistos */
  {id: "atasco", cat: N_("Imprevisto"), sc: "street", tipo: "aleatoria", title: N_("Atasco antes del partido"), text: [N_("Un accidente en la autopista y vas a llegar tarde a la concentración.")],
    opts: [{t: N_("Ir en moto con un aficionado"), p: 0.7, ok: {txt: N_("Llegas a tiempo. El aficionado tiene historia para toda la vida."), fx: {fans: 2, fol: 15}}, ko: {txt: N_("Pinchazo a mitad de camino. Llegas tardísimo."), fx: {coach: -4}}},
      {t: N_("Llamar al delegado y esperar"), ok: {txt: N_("Llegas tarde, pero avisaste. Sin drama."), fx: {coach: -1}}}]},
  {id: "botas_olvidadas", cat: N_("Imprevisto"), sc: "locker", tipo: "aleatoria", title: N_("Sin botas"), text: [N_("Abres la bolsa en el vestuario visitante: te has dejado las botas en casa.")],
    opts: [{t: N_("Jugar con unas prestadas"), p: {att: "REG", b: 0.5, k: 0.01}, ok: {txt: N_("Te quedan perfectas. Igual son mejores que las tuyas."), fx: {form: 2}}, ko: {txt: N_("Dos números más grandes. Partido para olvidar."), fx: {form: -4}}},
      {t: N_("Pedir que te las traigan"), ok: {txt: N_("Llegan justo en el calentamiento. Qué nervios."), fx: {mor: -1}}}]},
  {id: "vuelo", cat: N_("Imprevisto"), sc: "plane", tipo: "aleatoria", title: N_("Turbulencias"), text: [N_("El avión del equipo atraviesa una tormenta. Medio vestuario está blanco.")],
    opts: [{t: N_("Hacer bromas para calmar a todos"), ok: {txt: N_("Risas nerviosas y aterrizaje perfecto. Eres el héroe del vuelo."), fx: {mor: 3, coach: 1}}}, {t: N_("Ponerte los cascos y cerrar los ojos"), ok: {txt: N_("Cada uno lo lleva como puede."), fx: {}}}]},
  {id: "arbitro_redes", cat: N_("Imprevisto"), sc: "home", tipo: "aleatoria", title: N_("El árbitro te sigue"), text: [N_("Descubres que el árbitro del próximo partido te sigue en redes y le da «me gusta» a tus fotos.")],
    opts: [{t: N_("Hacer como si nada"), ok: {txt: N_("Coincidencia rara. Nada más."), fx: {}}}, {t: N_("Comentarlo en una entrevista"), p: 0.4, ok: {txt: N_("Risas en la sala de prensa."), fx: {fol: 15}}, ko: {txt: N_("La federación abre una consulta. Qué lío más tonto."), fx: {coach: -2, fans: -1}}}]},
  {id: "silbato_grada", cat: N_("Imprevisto"), sc: "stadium", tipo: "aleatoria", title: N_("Un silbato en la grada"), text: [N_("Alguien en la grada imita el silbato del árbitro y te paras en plena contra.")],
    opts: [{t: N_("Pedir al árbitro que lo comunique"), ok: {txt: N_("Avisan por megafonía. Se acabaron las bromas."), fx: {}}}, {t: N_("Reírte y seguir"), ok: {txt: N_("Te lo tomas con humor. La grada te aplaude."), fx: {fans: 1}}}]},
  {id: "autobus_ultras", cat: N_("Afición"), sc: "street", when: {lgLow: 4}, title: N_("Ultras en el entrenamiento"), text: [N_("Un grupo de ultras se presenta en la ciudad deportiva exigiendo explicaciones por la mala racha.")],
    opts: [{t: N_("Salir a hablar con ellos"), p: {st: "fans", b: 0.5, k: 0.01}, ok: {txt: N_("Escuchas, das la cara y se van más tranquilos."), fx: {fans: 5, coach: 2}}, ko: {txt: N_("Los gritos suben de tono. Seguridad tiene que intervenir."), fx: {mor: -4}}},
      {t: N_("Quedarte dentro"), ok: {txt: N_("Lo gestiona el club. Mejor no echar leña."), fx: {fans: -1}}}]},
  {id: "pancarta", cat: N_("Afición"), sc: "stadium", when: {fans: [70, null]}, title: N_("Tu nombre en una pancarta"), text: [N_("La grada de animación despliega una pancarta gigante con tu nombre.")],
    opts: [{t: N_("Ir a saludarles al acabar"), ok: {txt: N_("Te lanzan una bufanda y te la pones. Momento mágico."), fx: {fans: 4, mor: 4}}}, {t: N_("Agradecerlo en redes"), ok: {txt: N_("Tu foto con la pancarta es la más vista de la semana."), fx: {fol: 25, fans: 2}}}]},
  {id: "record_club", cat: N_("Carrera"), sc: "stadium", when: {yrs: 3, fame: [30, null]}, title: N_("Un récord a tiro"), text: [N_("Estás a punto de superar un récord histórico del {club}. La prensa no habla de otra cosa.")],
    opts: [{t: N_("Hablar del récord sin miedo"), p: {st: "mor", b: 0.5, k: 0.01}, ok: {txt: N_("La presión te motiva. Lo vas a conseguir."), fx: {buff: {v: 1, b: 1, n: N_("A por el récord")}}}, ko: {txt: N_("La presión te pesa y te bloqueas un par de partidos."), fx: {form: -4}}},
      {t: N_("Quitarle importancia"), ok: {txt: N_("«Lo importante es el equipo.» Te quitas la presión."), fx: {mor: 2}}}]},
  {id: "cantera_visita", cat: N_("Carrera"), sc: "training", when: {age: [28, null]}, title: N_("Clase magistral"), text: [N_("La escuela del club te invita a dar una clase a los niños de diez años.")],
    opts: [{t: N_("Ir y jugar con ellos"), ok: {txt: N_("Te hacen un túnel delante de todos. Risas y fotos."), fx: {mor: 5, fans: 3}, gx: "+mentored"}}, {t: N_("Mandar un vídeo"), ok: {txt: N_("Un saludo grabado. Algo es algo."), fx: {}}}]}
]);
/* ---------- ganchos: sin números en el resultado y consecuencias aplazadas en cada tramo ---------- */
(function () {
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  if (typeof resolvePendingPlayer === "function") {
    var _rp = resolvePendingPlayer;
    root.resolvePendingPlayer = function (choice) {
      var x = S.pend && S.pend[0], ev = x && x.k === "ev" ? EVENT_BY_ID[x.id] : null;
      var card = _rp.apply(this, arguments);
      try { if (card && ev && ev.gx) { card.chips = []; card.pct = null; card.gxsc = ev.sc; } } catch (e) {}
      return card;
    };
  }
  if (typeof playerDesc === "function") {
    var _pd = playerDesc;
    root.playerDesc = function (x) { var d = _pd.apply(this, arguments); try { var ev = x && x.k === "ev" ? EVENT_BY_ID[x.id] : null; if (d && ev && ev.gx) d.vscene = ev.sc; } catch (e) {} return d; };
  }
  if (typeof GX !== "undefined") GX.on("block", function () { GXE.tick(); });
})();
