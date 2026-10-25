/* gx-mevents.js — decisiones del míster en datos (5.6): mismo motor que las del jugador (condiciones,
   variantes, desenlaces sin números, consecuencias aplazadas y escena de vóxeles) sobre las decisiones
   de banquillo de siempre (MEV). */
(function () {
  if (typeof MEV !== "function" || typeof GXE === "undefined") return;
  function rng(v, a) { return a == null || (v >= (a[0] == null ? -1e9 : a[0]) && v <= (a[1] == null ? 1e9 : a[1])); }
  function ok(w, y) {
    var m = S.m; if (!m || m.club < 0) return false;
    w = w || {};
    if (w.s !== 0 && !y.inSeason) return false;
    if (w.rep && !rng(m.rep, w.rep)) return false;
    if (w.board && !rng(m.board, w.board)) return false;
    if (w.fans && !rng(m.fans, w.fans)) return false;
    if (w.chem && !rng(m.chem, w.chem)) return false;
    if (w.lgTop != null && !(y.pos > 0 && y.pos <= w.lgTop)) return false;
    if (w.lgLow != null) { var li = S.cl[m.club], n = li >= 0 && S.L[li] ? S.L[li].tm.length : 20; if (!(y.pos > n - w.lgLow)) return false; }
    if (w.lastL != null && y.last.l < w.lastL) return false;
    if (w.lastW != null && y.last.w < w.lastW) return false;
    if (w.youth && !m.sq.some(function (p) { return p.yth && p.age <= 19; })) return false;
    if (w.bud != null && m.bud < w.bud) return false;
    if (w.pet && !(typeof petOf === "function" && petOn() && petOf())) return false;
    return true;
  }
  function vars() { var o = {club: Y.club, lg: Y.lg}; try { var pt = typeof petOf === "function" ? petOf() : null; o.pet = pt ? pt.nm : tr("tu mascota"); } catch (e) { o.pet = tr("tu mascota"); } return o; }
  function blk() { return S.yr * 10 + S.bi; }
  function outc(o, id) {
    if (!o) return null;
    var r = {txt: tr(o.txt, vars()), fx: o.fx || {}};
    if (o.gx || o.later) r.then = function () {
      if (o.gx) [].concat(o.gx).forEach(function (k) { if (/^\+/.test(k)) GX.add(k.slice(1)); else GX.flag(k); });
      if (o.later) { var g = GX.st(); g.laterM = g.laterM || []; g.laterM.push({due: blk() + (o.later.b || 1), txt: o.later.txt, fx: o.later.fx || {}, t: o.later.t || "ok"}); }
    };
    return r;
  }
  function add(list) {
    list.forEach(function (d) {
      MEV({id: "gxm_" + d.id, tipo: d.tipo || "real", cat: d.cat, title: d.title, w: d.w || 0.9, cd: d.cd != null ? d.cd : 2, gx: 1, sc: d.sc || "office",
        when: function (y) { return ok(d.when, y); },
        text: function (y) { var v = d.text; return tr(Array.isArray(v) ? Y.spick(v, "t") : v, vars()); },
        opts: function () { return d.opts.map(function (o) { var r = {t: tr(o.t, vars())}; r.ok = outc(o.ok, d.id); if (o.ko) { r.ko = outc(o.ko, d.id); r.p = o.p != null ? (typeof o.p === "number" ? o.p : clamp((o.p.b || 0.5) + ((GXM.stats() || {})[o.p.st] - 50) * (o.p.k || 0.01), 0.15, 0.88)) : 0.5; } return r; }); }});
    });
  }
  add([
    {id: "pizarra", cat: N_("Táctica"), sc: "office", title: N_("Noche de vídeo"), text: [N_("Tu analista ha encontrado un patrón en el rival del domingo: deja un pasillo enorme a la espalda del lateral."), N_("Pasas la noche viendo partidos del rival. A las tres de la mañana lo ves claro.")],
      opts: [{t: N_("Cambiar el plan para atacar ese pasillo"), p: {st: "lec", b: 0.5, k: 0.012}, ok: {txt: N_("El plan funciona: tus extremos viven en ese pasillo."), fx: {buff: {v: 1.2, b: 1, n: N_("Plan a medida")}}}, ko: {txt: N_("El rival lo corrige al cuarto de hora. Te ha salido caro el cambio."), fx: {chem: -3}}},
        {t: N_("Mantener tu idea de juego"), ok: {txt: N_("Tu equipo juega a lo suyo, sin sorpresas."), fx: {chem: 2}}}]},
    {id: "charla_descanso", cat: N_("Vestuario"), sc: "locker", when: {lastL: 2}, title: N_("La charla del descanso"), text: [N_("Al descanso vais perdiendo y el vestuario está en silencio. Todos te miran.")],
      opts: [{t: N_("Discurso épico"), p: {st: "mot", b: 0.45, k: 0.013}, ok: {txt: N_("Salen al campo como leones."), fx: {buff: {v: 1.4, b: 1, n: N_("Discurso")}, sqMor: 3}}, ko: {txt: N_("Suena hueco. Nadie se lo cree."), fx: {sqMor: -3}}},
        {t: N_("Ajustes tácticos en la pizarra"), p: {st: "tac", b: 0.55, k: 0.01}, ok: {txt: N_("Dos cambios de posición y el partido es otro."), fx: {buff: {v: 1, b: 1, n: N_("Ajustes")}}}, ko: {txt: N_("Los jugadores no entienden los cambios."), fx: {chem: -2}}}]},
    {id: "cantera_salto", cat: N_("Cantera"), sc: "training", when: {youth: 1}, title: N_("El chaval está listo"), text: [N_("El juvenil más prometedor de la cantera lleva meses rompiéndola. Tu segundo dice que ya está listo.")],
      opts: [{t: N_("Hacerle debutar ya"), p: {st: "jov", b: 0.5, k: 0.012}, ok: {txt: N_("Debuta con desparpajo y la grada se enamora."), fx: {fans: 4, chem: 2}, gx: "+mYouthDebuts"}, ko: {txt: N_("Le pesa el momento. Habrá más oportunidades."), fx: {fans: 1}}},
        {t: N_("Esperar a que madure"), ok: {txt: N_("Sigue entrenando con el primer equipo."), fx: {}, later: {b: 2, txt: N_("El canterano al que esperaste llega por fin preparado."), fx: {chem: 2}}}}]},
    {id: "rueda_dura", cat: N_("Prensa"), sc: "press", when: {lastL: 2}, title: N_("Rueda de prensa caliente"), text: [N_("Un periodista te pregunta si te ves fuera del banquillo después de la última derrota.")],
      opts: [{t: N_("Responder con calma y datos"), p: {st: "pre", b: 0.55, k: 0.01}, ok: {txt: N_("Tu tranquilidad desactiva la polémica."), fx: {board: 3, fans: 2}}, ko: {txt: N_("Se te escapa un dato mal y se hace viral."), fx: {fans: -3}}},
        {t: N_("Cortar la rueda de prensa"), ok: {txt: N_("Te levantas y te vas. Titular asegurado."), fx: {board: -4, fans: 1}}}]},
    {id: "presidente_fichaje", cat: N_("Directiva"), sc: "office", title: N_("El capricho del presidente"), text: [N_("El presidente quiere fichar a un veterano famoso para vender camisetas. A ti no te convence.")],
      opts: [{t: N_("Negociar que no venga"), p: {st: "neg", b: 0.5, k: 0.012}, ok: {txt: N_("Le convences: el dinero irá a la cantera."), fx: {board: 1, bud: 300000}}, ko: {txt: N_("El presidente se enfada y lo ficha igual."), fx: {board: -5}}},
        {t: N_("Aceptarlo"), ok: {txt: N_("Llega el veterano entre focos. Al menos vende camisetas."), fx: {board: 4, fans: 3, chem: -2}}}]},
    {id: "ultras_mgr", cat: N_("Afición"), sc: "street", when: {lgLow: 4}, title: N_("Pancartas contra ti"), text: [N_("Aparecen pancartas pidiendo tu dimisión en la ciudad deportiva.")],
      opts: [{t: N_("Reunirte con las peñas"), p: {st: "pre", b: 0.5, k: 0.01}, ok: {txt: N_("Les explicas el plan y te dan tiempo."), fx: {fans: 5}}, ko: {txt: N_("La reunión acaba a gritos."), fx: {fans: -4, board: -2}}},
        {t: N_("Encerrarte a trabajar"), ok: {txt: N_("Solo los resultados te salvarán."), fx: {chem: 2}}}]},
    {id: "estrella_queja", cat: N_("Vestuario"), sc: "locker", title: N_("La estrella se queja"), text: [N_("Tu mejor jugador protesta en público porque le cambias siempre en el minuto 70.")],
      opts: [{t: N_("Hablar con él en privado"), p: {st: "ves", b: 0.55, k: 0.012}, ok: {txt: N_("Lo arregláis con un café. Vuelve a sonreír."), fx: {sqMor: 3, chem: 2}}, ko: {txt: N_("No hay manera: se siente infravalorado."), fx: {chem: -4}}},
        {t: N_("Multarle"), ok: {txt: N_("Mensaje claro al vestuario: aquí nadie está por encima del grupo."), fx: {board: 2, chem: -1}}}]},
    {id: "racha_buena", cat: N_("Vestuario"), sc: "party", when: {lastW: 3}, title: N_("Racha de victorias"), text: [N_("Encadenáis victorias y el vestuario te pide un día libre para celebrarlo.")],
      opts: [{t: N_("Concederlo"), ok: {txt: N_("Un día de descanso y vuelven con más hambre."), fx: {sqMor: 4, sfit: 5}}}, {t: N_("Mantener la exigencia"), p: {st: "mot", b: 0.55, k: 0.01}, ok: {txt: N_("Ni un paso atrás. La racha continúa."), fx: {buff: {v: 0.8, b: 1, n: N_("Exigencia")}}}, ko: {txt: N_("Algunos jugadores refunfuñan."), fx: {sqMor: -3}}}]},
    {id: "preparador_fisico", cat: N_("Cuerpo técnico"), sc: "training", title: N_("Método nuevo"), text: [N_("Tu preparador físico propone un método de cargas que ha visto en otra liga.")],
      opts: [{t: N_("Probarlo"), p: {st: "fis", b: 0.5, k: 0.012}, ok: {txt: N_("Los jugadores vuelan en los últimos minutos."), fx: {sfit: 8}, later: {b: 2, txt: N_("El nuevo método de cargas reduce las molestias musculares."), fx: {sfit: 5}}}, ko: {txt: N_("Varias sobrecargas en la primera semana."), fx: {sfit: -6}}},
        {t: N_("Seguir con lo de siempre"), ok: {txt: N_("Si funciona, no lo toques."), fx: {}}}]},
    {id: "mercado_ganga", cat: N_("Mercado"), sc: "office", title: N_("Una ganga en el mercado"), text: [N_("Un agente te ofrece un jugador libre con buen nivel. Pide una comisión altísima.")],
      opts: [{t: N_("Negociar la comisión"), p: {st: "neg", b: 0.45, k: 0.013}, ok: {txt: N_("Rebajas la comisión a la mitad. Buen negocio."), fx: {bud: -100000, chem: 2}}, ko: {txt: N_("El agente se ofende y lo coloca en otro club."), fx: {}}},
        {t: N_("Pasar"), ok: {txt: N_("No quieres entrar en ese juego."), fx: {board: 1}}}]},
    {id: "derbi_semana", cat: N_("Partido"), sc: "stadium", title: N_("Semana de derbi"), text: [N_("Llega el derbi y la ciudad no habla de otra cosa.")],
      opts: [{t: N_("Calentar el partido en rueda de prensa"), p: {st: "pre", b: 0.45, k: 0.012}, ok: {txt: N_("Tu afición te adora. El estadio será una olla."), fx: {fans: 4, buff: {v: 0.8, b: 1, n: N_("Derbi")}}}, ko: {txt: N_("Tu frase se vuelve contra ti y motiva al rival."), fx: {fans: -2}}},
        {t: N_("Rebajar la tensión"), ok: {txt: N_("Respeto máximo al rival. Partido limpio."), fx: {board: 2}}}]},
    {id: "copa_rotaciones", cat: N_("Partido"), sc: "pitch", title: N_("Rotaciones en copa"), text: [N_("Partido de copa entre semana ante un rival de categoría inferior.")],
      opts: [{t: N_("Rotar a todo el equipo"), p: 0.6, ok: {txt: N_("Los suplentes cumplen y los titulares descansan."), fx: {sfit: 6, sqMor: 2}}, ko: {txt: N_("Susto tremendo: casi os eliminan."), fx: {board: -3}}},
        {t: N_("Jugar con los titulares"), ok: {txt: N_("Goleada sin historia, pero las piernas pesan."), fx: {sfit: -5, board: 1}}}]},
    {id: "mascota_banquillo", cat: N_("Mascota"), sc: "stadium", when: {pet: 1}, title: N_("Tu mascota en la grada"), text: [N_("Llevas a {pet} al estadio y los aficionados no paran de hacerle fotos.")],
      opts: [{t: N_("Hacer una foto con {pet} y la grada"), ok: {txt: N_("La foto es la más compartida de la jornada."), fx: {fans: 3}}}, {t: N_("Dejarle en el palco"), ok: {txt: N_("{pet} ve el partido como un señor."), fx: {}}}]},
    {id: "oferta_seleccion", cat: N_("Carrera"), sc: "office", when: {rep: [60, null]}, cd: 4, title: N_("Llama una federación"), text: [N_("Una federación te ofrece dirigir su selección cuando acabe la temporada.")],
      opts: [{t: N_("Agradecerlo y seguir en el club"), ok: {txt: N_("La directiva valora tu compromiso."), fx: {board: 5, rep: 1}}}, {t: N_("Decir que lo pensarás"), ok: {txt: N_("Se filtra la noticia y la grada se inquieta."), fx: {fans: -3, rep: 2}}}]},
    {id: "asistente_marcha", cat: N_("Cuerpo técnico"), sc: "office", title: N_("Tu segundo quiere volar"), text: [N_("Tu segundo entrenador ha recibido una oferta para ser primer entrenador en otro club.")],
      opts: [{t: N_("Animarle a aceptar"), ok: {txt: N_("Se va con tu bendición. El fútbol es así."), fx: {chem: -2, rep: 1}, later: {b: 2, txt: N_("Tu antiguo segundo gana su primer partido y te lo dedica."), fx: {rep: 1}}}},
        {t: N_("Pedirle que se quede"), p: {st: "ves", b: 0.5, k: 0.01}, ok: {txt: N_("Se queda contigo un año más."), fx: {chem: 3}}, ko: {txt: N_("Se va igualmente y algo dolido."), fx: {chem: -3}}}]},
    {id: "nino_vestuario", cat: N_("Afición"), sc: "locker", tipo: "aleatoria", title: N_("Un niño en el vestuario"), text: [N_("Un niño de la fundación del club gana un concurso: pasará el día con el equipo.")],
      opts: [{t: N_("Que dé la charla antes del partido"), ok: {txt: N_("Su discurso de treinta segundos es lo mejor de la temporada."), fx: {sqMor: 5, fans: 3}}}, {t: N_("Que se siente en el banquillo"), ok: {txt: N_("No se pierde un detalle. Sale con un balón firmado."), fx: {fans: 2}}}]}
  ]);
  /* sin números en el resultado y escena en la tarjeta */
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  if (typeof mgrResolve === "function") {
    var _mr = mgrResolve;
    root.mgrResolve = function (i) { var x = S.pend && S.pend[0], ev = x && x.k === "mev" ? MEV_BY_ID[x.id] : null; var card = _mr.apply(this, arguments);  return card; };
  }
  if (typeof mgrDesc === "function") {
    var _md = mgrDesc;
    root.mgrDesc = function (x) { var d = _md.apply(this, arguments); try { var ev = x && x.k === "mev" ? MEV_BY_ID[x.id] : null; if (d && ev && !d.scene) d.vscene = ev.sc || GXE.scOf(ev); } catch (e) {} return d; };
  }
  if (typeof mgrBlockDone === "function") {
    var _bd = mgrBlockDone;
    root.mgrBlockDone = function () {
      var r = _bd.apply(this, arguments);
      try { var g = GX.st(); if (g && g.laterM && g.laterM.length && S.m) { var now = blk(), keep = []; g.laterM.forEach(function (L) { if (L.due > now) { keep.push(L); return; } mgrFx(L.fx || {}); if (L.txt && S.bnews) S.bnews.push({t: L.t === "bad" ? "bad" : "ok", x: tr(L.txt, vars())}); }); g.laterM = keep; } } catch (e) {}
      return r;
    };
  }
})();
