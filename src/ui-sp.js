/* ui-sp.js — balón parado en la pestaña Jugador (5.6): entrenamiento, retos, historial y ajustes,
   y su efecto en los partidos (pedir el balón, lanzador oficial, estadísticas de los clásicos). */
(function () {
  if (typeof UIX === "undefined" || typeof SpModes === "undefined" || !SpModes || typeof SpPlay === "undefined" || !SpPlay) return;
  var U = UIX, h = U.h, D = SP_DATA;
  function st() { return SpModes.stats(); }
  function gkNow() { try { return isGK(); } catch (e) { return false; } }
  function rer() { U.persist(); U.renderSheet(); U.render(false); }
  function skill(kind) { var at = attrs(), p = S.p; return kind === "fk" ? Math.round((at.TIR || p.ovr) * 0.6 + (at.PAS || p.ovr) * 0.4) : kind === "gk" ? Math.round(((at.REF || p.ovr) + (at.EST || at.COL || p.ovr)) / 2) : (at.TIR || p.ovr); }

  /* tarjeta en la pestaña Jugador */
  U.add("jugador", function () {
    if (!S || !S.p || U.isMgr() || !SpModes.enabled()) return "";
    var s = st(), g = (s.pen.g + s.fk.g), saves = s.gkpen.s + s.gkfk.s;
    return '<button class="card spcard" data-a="spopen"><span class="spcard-ic" aria-hidden="true">🎯</span><span class="grow"><b>' + h(tr("Balón parado")) + "</b><small>" + h(tr("Entrena penaltis y faltas, supera retos y mira tu historial.")) + "</small></span>" +
      (g || saves ? '<span class="spcard-n">' + (gkNow() ? "🧤 " + saves : "⚽ " + g) + "</span>" : "") + '<span class="chev" aria-hidden="true">›</span></button>';
  });
  U.actions.spopen = function () { U.ui().spTab = U.ui().spTab || "train"; U.open("spset"); };
  U.actions.sptab = function (b, v) { U.ui().spTab = v; U.renderSheet(); };
  U.actions.sppref = function (b, v) { var kv = v.split(":"); SpModes.setPref(kv[0], kv[1] === "1" ? true : kv[1] === "0" ? false : kv[1]); U.renderSheet(); };
  U.actions.spceleb = function (b, v) { st().celeb = v; rer(); };

  /* entrenamiento: sin consecuencias en la carrera; pequeñas mejoras de atributo con tope por temporada.
     Ayuda anti-frustración oculta: solo aquí y solo tras muchos fallos seguidos */
  function trainOpts(kind) {
    var s = st(), help = s.miss >= D.bal.trainHelpAfter ? Math.min(D.bal.trainHelpMax, (s.miss - D.bal.trainHelpAfter + 1) * 0.015) : 0;
    return {training: true, skill: skill(kind === "gk" ? "gk" : kind), gk: 55 + Math.floor(Math.random() * 30), press: 0.1, help: help, ctx: "barrio", noStats: true, rand: SpPhys.rng((Date.now() & 0xffffff) >>> 0)};
  }
  function trainDone(kind, r) {
    if (!r) return;
    var s = st(), good = kind === "gk" ? !r.scored : !!r.scored;
    s.miss = good ? 0 : (s.miss || 0) + 1;
    if (good) {
      if (s.tr.y !== S.yr) { s.tr.y = S.yr; s.tr.n = 0; }
      if (s.tr.n < 30) { s.tr.n++; var p = S.p, k = kind === "gk" ? (Math.random() < 0.5 ? "REF" : "EST") : kind === "fk" ? (Math.random() < 0.5 ? "TIR" : "PAS") : "TIR"; p.tr = p.tr || {}; p.tr[k] = Math.round(((p.tr[k] || 0) + 0.05) * 100) / 100; }
    }
    U.persist(); U.render(false);
  }
  U.actions.sptrain = function (b, v) {
    U.close && U.close();
    var o = trainOpts(v === "gkpen" || v === "gkfk" ? "gk" : v === "fk" ? "fk" : "pen"), cb = function (r) { trainDone(v === "gkpen" || v === "gkfk" ? "gk" : v === "fk" ? "fk" : "pen", r); };
    if (v === "pen") { if (SpModes.prefs().ctrl === "adv") SpPlay.penPro(o, cb); else Minigame.classic.penalty({skill: o.skill, gk: o.gk, pressure: 0.2, rand: o.rand, noStats: true}, cb); }
    else if (v === "gkpen") { if (SpModes.prefs().ctrl === "adv") SpPlay.gkPenPro(o, cb); else Minigame.classic.gkPenalty({gk: o.skill, skill: o.gk, pressure: 0.2, rand: o.rand, noStats: true}, cb); }
    else if (v === "fk") SpPlay.fkShoot(o, cb);
    else if (v === "gkfk") SpPlay.gkFk(Object.assign(o, {gk: o.skill, skill: 60 + Math.floor(Math.random() * 30)}), cb);
    else if (v === "targets") SpPlay.penPro(Object.assign(o, {targets: D.targets[Math.floor(Math.random() * D.targets.length)]}), cb);
  };
  /* retos especiales: una vez por temporada, con premio propio */
  U.actions.spchal = function (b, v) {
    var c = D.challenges.filter(function (x) { return x.k === v; })[0]; if (!c) return;
    var s = st(); if (s.ch[c.k] === S.yr) return;
    U.close && U.close();
    var o = {skill: skill(c.kind === "gkpen" || c.kind === "gkfk" ? "gk" : c.kind), gk: 80, press: c.press, dist: c.dist, ang: c.ang, ctx: c.ctx, reward: c.reward, ch: c.k, training: false, rand: SpPhys.rng((Date.now() & 0xffffff) >>> 0)};
    var cb = function (r) { if (r) { s.ch[c.k] = S.yr; U.persist(); U.render(false); } };
    if (c.kind === "fk") SpPlay.fkShoot(o, cb);
    else if (c.kind === "pen") SpPlay.penPro(o, cb);
    else if (c.kind === "gkfk") SpPlay.gkFk(Object.assign(o, {gk: o.skill, skill: 88}), cb);
    else SpPlay.gkPenPro(Object.assign(o, {gk: o.skill, skill: 85}), cb);
  };

  U.sheets.spset = function () {
    var s = st(), tab = U.ui().spTab || "train", pr = SpModes.prefs();
    var out = "<h2>" + tr("Balón parado") + '</h2><div class="stack"><div class="seg">' + [["train", N_("Entrenar")], ["ch", N_("Retos")], ["hist", N_("Historial")], ["set", N_("Ajustes")]].map(function (x) { return '<button data-a="sptab" data-v="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + tr(x[1]) + "</button>"; }).join("") + "</div>";
    if (tab === "train") {
      out += '<p class="muted lfhint">' + tr("Sin consecuencias en la carrera. Cada acierto te hace un poco mejor (con un tope por temporada).") + "</p><div class=\"sp-grid\">" +
        [["pen", "⚽", N_("Penaltis")], ["gkpen", "🧤", N_("Parar penaltis")], ["fk", "🎯", N_("Faltas directas")], ["gkfk", "🧱", N_("Parar faltas")], ["targets", "⭕", N_("Dianas")]].map(function (x) { return '<button class="sp-tile" data-a="sptrain" data-v="' + x[0] + '"><span aria-hidden="true">' + x[1] + "</span><b>" + tr(x[2]) + "</b></button>"; }).join("") + "</div>";
    } else if (tab === "ch") {
      out += '<div class="sp-list">' + D.challenges.map(function (c) { var done = s.ch[c.k] === S.yr; return '<button class="sp-row" data-a="spchal" data-v="' + c.k + '"' + (done ? " disabled" : "") + "><b>" + tr(c.n) + "</b><small>" + tr(c.d) + "</small><span class=\"sp-pr\">" + (done ? "✓ " + tr("Superado esta temporada") : fmtMoney(c.reward)) + "</span></button>"; }).join("") + "</div>";
    } else if (tab === "hist") {
      var row = function (lbl, a, b) { return "<tr><th>" + tr(lbl) + "</th><td>" + a + "</td><td>" + b + "</td></tr>"; };
      out += '<table class="sp-tab"><thead><tr><th></th><th>' + tr("Lanzados") + "</th><th>" + tr("Logrados") + "</th></tr></thead><tbody>" +
        row(N_("Penaltis"), s.pen.n, s.pen.g) + row(N_("Faltas directas"), s.fk.n, s.fk.g) + row(N_("Penaltis en contra"), s.gkpen.n, s.gkpen.s) + row(N_("Faltas en contra"), s.gkfk.n, s.gkfk.s) + "</tbody></table>";
      out += '<p class="muted lfhint">' + tr("Al palo: {a} · Mejor racha: {b}", {a: s.pen.post + s.fk.post, b: s.best}) + "</p>";
      var ach = D.ach.filter(function (a) { return s.ach[a.k]; });
      out += '<div class="lbl">' + tr("Logros") + '</div><div class="chips">' + (ach.length ? ach.map(function (a) { return '<span class="chip">🏅 ' + h(tr(a.n)) + "</span>"; }).join("") : '<span class="muted">' + tr("Todavía ninguno.") + "</span>") + "</div>";
      out += '<div class="lbl">' + tr("Celebración favorita") + '</div><div class="chips">' + D.celebs.map(function (c) { var ok = !c.un || s.ach[c.un]; return '<button class="chipb" data-a="spceleb" data-v="' + c.k + '" aria-pressed="' + (s.celeb === c.k) + '"' + (ok ? "" : " disabled") + ">" + (ok ? "" : "🔒 ") + h(tr(c.n)) + "</button>"; }).join("") + "</div>";
    } else {
      var seg = function (k, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-a="sppref" data-v="' + k + ":" + o[0] + '" aria-pressed="' + (String(pr[k]) === String(o[0]) || (pr[k] === true && o[0] === "1") || (pr[k] === false && o[0] === "0")) + '">' + tr(o[1]) + "</button>"; }).join("") + "</div>"; };
      out += '<div class="lbl">' + tr("Control de penaltis") + "</div>" + seg("ctrl", [["classic", N_("Clásico")], ["adv", N_("Avanzado (gestos)")]]) +
        '<div class="lbl">' + tr("Cámara del portero") + "</div>" + seg("gkcam", [["behind", N_("Detrás")], ["eyes", N_("Sus ojos")]]) +
        '<div class="lbl">' + tr("Repeticiones") + "</div>" + seg("skip", [["0", N_("Verlas")], ["1", N_("Saltarlas")]]) +
        '<div class="lbl">' + tr("Temblor de cámara") + "</div>" + seg("shake", [["1", N_("Sí")], ["0", N_("No")]]) +
        '<div class="lbl">' + tr("Gráficos") + "</div>" + seg("q", [["auto", N_("Automático")], ["high", N_("Alta")], ["low", N_("Baja")]]) +
        '<p class="muted lfhint">' + tr("Con «Reducir animaciones» activado no hay temblor, pausas ni cámara lenta.") + "</p>";
    }
    return out + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };

  /* partidos: estadísticas de los clásicos y lanzador oficial (pedir el balón tiene consecuencias) */
  var M = Minigame.classic;
  function mapHow(how) { return how === "gol" ? "goal" : how === "parada" ? "save" : how === "palo" ? "post" : "wide"; }
  ["penalty", "gkPenalty"].forEach(function (k) {
    var fn = M[k];
    M[k] = function (o, d) { return fn(o, function (r) { if (r && !o.noStats) SpModes.record(k === "penalty" ? "pen" : "gkpen", {scored: r.scored, saved: r.saved, how: mapHow(r.how)}, {}); if (d) d(r); }); };
  });
  /* tras un penalti o una falta en partido: lanzador oficial, confianza del míster y vestuario */
  U.hk.spAfter = function (kind, scored) {
    if (kind !== "pen" && kind !== "fk") return;
    var s = st(); if (!s) return; var p = S.p;
    s.taker = s.taker == null ? 35 : s.taker;
    var official = s.taker >= 60;
    if (scored) { s.taker = Math.min(100, s.taker + (official ? 4 : 14)); if (!official && s.taker >= 60) U.toast(tr("El míster lo tiene claro: a partir de ahora eres el lanzador oficial.")); }
    else { s.taker = Math.max(0, s.taker - (official ? 8 : 12)); if (!official) { p.coach = Math.max(0, (p.coach || 50) - 3); p.mor = Math.max(0, (p.mor || 50) - 2); U.toast(tr("Pediste el balón y fallaste: en el banquillo no han hecho ni un gesto.")); } }
  };
})();
