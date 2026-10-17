/* ach36.js — logros de cultura popular (videojuegos, cine, memes y vivencias de jugador).
   Los que dependen de algo que pasa en un partido o en el mercado se marcan en S.achE[id] desde los ganchos;
   los de estado se comprueban directamente. achieve.js los evalúa como el resto y la interfaz los guarda
   también como logros generales del usuario (ui-steps.js). Modo: "p" jugador, "m" míster, "b" ambos. */
function achE(id) { if (!S) return; S.achE = S.achE || {}; if (!S.achE[id]) S.achE[id] = S.yr; }
function achHas(id) { return !!(S && S.achE && S.achE[id]); }
function achEv(id) { return function () { return achHas(id); }; }
/* minuto a minuto (sim): goles propios y del rival antes de un minuto */
function achAt(f, min) { var a = (f.gmu || []).filter(function (x) { return x < min; }).length, b = (f.gmt || []).filter(function (x) { return x < min; }).length; return [a, b]; }
function achTrailed(f) {
  var ev = [];
  (f.gmu || []).forEach(function (x) { ev.push([x, 1]); }); (f.gmt || []).forEach(function (x) { ev.push([x, -1]); });
  ev.sort(function (a, b) { return a[0] - b[0]; });
  var d = 0, worst = 0; ev.forEach(function (e) { d += e[1]; worst = Math.min(worst, d); });
  return worst;
}
function achTreble(list) {
  var by = {};
  (list || []).forEach(function (t) { var s = t.s || t.y, k = String(t.k || ""); by[s] = by[s] || {}; if (k.indexOf("L:") === 0) by[s].l = 1; else if (k.indexOf("CUP:") === 0) by[s].c = 1; else if (/^(UCL|UEL|UECL|LIB|SUD|ACL|CAF|CCC)$/.test(k)) by[s].x = 1; });
  return Object.keys(by).some(function (s) { return by[s].l && by[s].c && by[s].x; });
}
var ACH_X = [
  /* videojuegos */
  ["x_gta", "🚲", "b", N_("Ah shit, here we go again"), N_("Desciende de categoría o sufre tu primer despido."), achEv("x_gta")],
  ["x_9000", "💥", "m", N_("¡Es de más de 9000!"), N_("Un juvenil de tu cantera llega a una media de 90."), function () { return achHas("x_9000") || !!(S.m && S.m.sq.some(function (p) { return p.yth && p.ovr >= 90; })); }],
  ["x_sun", "☀️", "b", N_("Praise the Sun! \\o/"), N_("Gana una final después de ir perdiendo."), achEv("x_sun")],
  ["x_poke", "🔴", "m", N_("Hazme con todos"), N_("Ficha a una joya de 20 años o menos (potencial 82+) de cinco confederaciones distintas."), achEv("x_poke")],
  ["x_fus", "🗣️", "b", N_("Fus Ro Dah!"), N_("Marca un golazo desde fuera del área."), achEv("x_fus")],
  ["x_speed", "⏱️", "m", N_("Speedrun"), N_("Que te despidan antes de dirigir cinco partidos en un club."), achEv("x_speed")],
  ["x_mgs", "📦", "m", N_("Misión sigilosa"), N_("Gana 1-0 con la mentalidad «Encerrarse» o con el bloque bajo."), achEv("x_mgs")],
  ["x_mine", "⛏️", "b", N_("Diamante en bruto"), N_("Marca en tu debut con 17 años o menos (o que lo haga un juvenil de tu cantera)."), achEv("x_mine")],
  ["x_witcher", "⚔️", "b", N_("Geralt de Rivia"), N_("Gana un derbi en el campo del rival."), achEv("x_witcher")],
  /* cine y televisión */
  ["x_goldfish", "🐟", "b", N_("Be a goldfish"), N_("Gana el siguiente partido de liga justo después de perder por cuatro goles o más."), achEv("x_goldfish")],
  ["x_force", "✨", "b", N_("¡Que la Fuerza te acompañe!"), N_("Gana una final en la tanda de penaltis."), achEv("x_force")],
  ["x_pass", "🧙", "m", N_("¡No puedes pasar!"), N_("Gana sin encajar jugando con uno menos ante un rival claramente mejor."), achEv("x_pass")],
  ["x_knock", "🚪", "m", N_("I am the one who knocks"), N_("Gana en el campo del líder invicto con una mentalidad ofensiva o de presión alta."), achEv("x_knock")],
  ["x_matrix", "🕶️", "m", N_("El Elegido"), N_("Gana encerrado atrás a un rival al menos seis puntos de media mejor."), achEv("x_matrix")],
  ["x_ring", "💍", "b", N_("Un anillo para gobernarlos a todos"), N_("Gana liga, copa y una competición continental en la misma temporada."), function () { return achHas("x_ring") || achTreble(S.mode === "mgr" ? S.m.trophies : S.p.trophies); }],
  ["x_papel", "🎭", "b", N_("¡Sorpresa, cabrones!"), N_("Gana un partido que perdías por dos goles a falta de diez minutos."), achEv("x_papel")],
  ["x_fight", "🥊", "m", N_("El club de la lucha"), N_("Termina un partido con cinco o más jugadores amonestados."), achEv("x_fight")],
  /* memes e internet */
  ["x_fine", "🔥", "m", N_("This is fine"), N_("Aguanta un tramo con la directiva furiosa, cinco lesionados y las cuentas en rojo sin perder el puesto."), achEv("x_fine")],
  ["x_wolf", "🐺", "m", N_("El lobo de Wall Street"), N_("Vende a un veterano de 31 años o más por el triple de su valor."), achEv("x_wolf")],
  ["x_war", "♟️", "m", N_("El arte de la guerra"), N_("Haz tres cambios tácticos en un partido en directo y gánalo."), achEv("x_war")],
  /* vivencias de jugador */
  ["x_cruyff", "🔄", "p", N_("Jugador total"), N_("Sal desde el banquillo y marca el gol de la victoria."), achEv("x_cruyff")],
  ["x_bushido", "🥋", "p", N_("El camino del guerrero"), N_("Juega una temporada entera de 30 partidos o más como titular sin ser sustituido nunca."), achEv("x_bushido")],
  ["x_real", "😩", "b", N_("La cruda realidad"), N_("Pierde un partido en el que ganabas por tres goles al descanso."), achEv("x_real")],
  ["x_ea", "🐞", "p", N_("It's in the game..."), N_("Falla tu jugada clave y aun así gana el partido."), achEv("x_ea")],
  ["x_brain", "🧠", "m", N_("El cerebro en llamas"), N_("Gana con los once titulares en su posición natural y la química del equipo por encima de 85."), achEv("x_brain")]
];
function achX(mode) { return ACH_X.filter(function (a) { return a[2] === "b" || a[2] === mode; }).map(function (a) { return [a[0], a[1], a[3], a[4], a[5]]; }); }

/* ---------- análisis de un partido (los dos modos) ---------- */
function achMatch(f, mgr) {
  if (!f || f.gu == null) return;
  var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), win = gu > gt, me = mgr ? S.m.club : S.p.club;
  var pw = f.pens && f.pens[0] > f.pens[1], won = win || (gu === gt && pw);
  if (f.fin && won && achTrailed(f) < 0) achE("x_sun");
  if (f.fin && gu === gt && pw) achE("x_force");
  var at80 = achAt(f, 81); if (win && at80[1] - at80[0] >= 2) achE("x_papel");
  var ht = achAt(f, 46); if (gu < gt && ht[0] - ht[1] >= 3) achE("x_real");
  if (won && !f.home && !f.isNat && f.opp != null && W.derby[me + "-" + f.opp]) achE("x_witcher");
  if (f.kind === "lg") {
    var A = S.achLg = S.achLg || {};
    if (A.big && win) achE("x_goldfish");
    A.big = gt - gu >= 4;
  }
}
(function () {
  if (typeof mgrFinish === "function") {
    var _mf = mgrFinish;
    mgrFinish = function (f) {
      var m = S.m, snap = {};
      if (m) m.sq.forEach(function (p) { snap[p.id] = [p.st ? p.st.apps : 0, p.st ? p.st.g : 0, p.st ? p.st.yc : 0, p.tot ? p.tot.apps : 0]; });
      var r = _mf.apply(this, arguments);
      try {
        if (S.mode !== "mgr" || !m || !f) return r;
        achMatch(f, true);
        var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), win = gu > gt, yc = 0;
        m.sq.forEach(function (p) {
          var s0 = snap[p.id]; if (!s0 || !p.st) return;
          yc += Math.max(0, p.st.yc - s0[2]);
          if (p.yth && p.age <= 17 && s0[3] + s0[0] === 0 && p.st.apps === 1 && p.st.g > s0[1]) achE("x_mine");
        });
        if (yc >= 5) achE("x_fight");
        var ment = f.ment, low = f.wk && f.wk.low;
        if (win && gu === 1 && gt === 0 && (ment === "bus" || ment === 0 || low)) achE("x_mgs");
        if (win && (ment === "bus" || low) && f.or >= f.tr + 6) achE("x_matrix");
        if (win && gt === 0 && f.redId != null && !f.isNat && f.or >= f.tr + 3) achE("x_pass");
        if (win && !f.home && f.kind === "lg" && (ment === 2 || ment === "press")) {
          var li = S.cl[m.club], st = li >= 0 ? standings(li) : [];
          if (st.length && st[0].c === f.opp && st[0].r[3] === 0) achE("x_knock");
        }
        if (win && f.xi && m.chem >= 85) {
          var slots = FORMATIONS[m.form] || [], nat = f.xi.every(function (id, i) { var p = mPl(id); return p && slots[i] && posFit(p.pos, slots[i]) === 0; });
          if (nat && f.xi.length === 11) achE("x_brain");
        }
        var L = S.live;
        if (f.liveDone && L) {
          if ((L.ev || []).some(function (e) { return e.t === "goal" && e.us && e.k === "long"; })) achE("x_fus");
          if (win && (L.tchg || 0) >= 3) achE("x_war");
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof finishPlayer === "function") {
    var _fp = finishPlayer;
    finishPlayer = function (f) {
      var p = S.p, t0 = p ? careerTotals().apps + (p.ss ? p.ss.apps : 0) : 0;
      var r = _fp.apply(this, arguments);
      try {
        if (!p || !f || !(f.min > 0)) return r;
        achMatch(f, false);
        var pg = (f.mg || 0) + (f.etg || 0), gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
        if (t0 === 0 && pg >= 1 && p.age <= 17) achE("x_mine");
        if (f.role === "sub" && pg >= 1 && gu - gt === 1) achE("x_cruyff");
        if (f.momFail && gu > gt) achE("x_ea");
      } catch (e) {}
      return r;
    };
  }
  /* descenso o primer despido */
  if (typeof mgrSacked === "function") {
    var _sk = mgrSacked;
    mgrSacked = function () { try { var ss = S.m.ss || {}; achE("x_gta"); if ((ss.w || 0) + (ss.d || 0) + (ss.l || 0) < 5) achE("x_speed"); } catch (e) {} return _sk.apply(this, arguments); };
  }
  function relegated(club) { var li = S.cl[club], L = li >= 0 ? W.lg[li] : null; if (!L || L.downI < 0) return false; return posInLeague(club) > S.L[li].tm.length - L.rel; }
  if (typeof mgrSeasonEnd === "function") {
    var _ms = mgrSeasonEnd;
    mgrSeasonEnd = function () { try { if (S.m && S.m.club >= 0 && relegated(S.m.club)) achE("x_gta"); } catch (e) {} return _ms.apply(this, arguments); };
  }
  if (typeof seasonEnd === "function") {
    var _ps = seasonEnd;
    seasonEnd = function () {
      try {
        var p = S.p, ss = p.ss || {};
        if (p.club >= 0 && relegated(p.club)) achE("x_gta");
        if (ss.apps >= 30 && ss.st === ss.apps && ss.min >= ss.apps * 90) achE("x_bushido");
      } catch (e) {}
      return _ps.apply(this, arguments);
    };
  }
  /* mercado */
  if (typeof mgrSign === "function") {
    var _sg = mgrSign;
    mgrSign = function (t) {
      var r = _sg.apply(this, arguments);
      try {
        if (t && t.age <= 20 && (t.pot || 0) >= 82 && W.ctry[t.nat]) {
          var A = S.achPk = S.achPk || {}; A[W.ctry[t.nat].conf] = 1;
          if (Object.keys(A).length >= 5) achE("x_poke");
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof mgrRemovePlayer === "function") {
    var _rp = mgrRemovePlayer;
    mgrRemovePlayer = function (p, why, club, fee) {
      try { if (p && p.age >= 31 && fee > 0 && fee >= 3 * pValue(p)) achE("x_wolf"); } catch (e) {}
      return _rp.apply(this, arguments);
    };
  }
  /* this is fine: tramo infernal sin perder el puesto */
  if (typeof mgrBlockDone === "function") {
    var _bd = mgrBlockDone;
    mgrBlockDone = function () {
      var m = S.m, club = m ? m.club : -1, bad = false;
      try {
        if (m && club >= 0) {
          var inj = m.sq.filter(function (p) { return !p.loanOut && p.inj > S.tw; }).length;
          var red = typeof finOf === "function" ? (function () { var F = finOf(); return finIn(F) - finOut(F) < 0; })() : m.bud <= 0;
          bad = m.board < 30 && inj >= 5 && red;
        }
      } catch (e) {}
      var r = _bd.apply(this, arguments);
      if (bad && S.m && S.m.club === club && S.ph !== "ret") achE("x_fine");
      return r;
    };
  }
  if (typeof applyMomentResult === "function") {
    var _am = applyMomentResult;
    applyMomentResult = function (f, out) { try { if (f && out && !out.good) f.momFail = 1; } catch (e) {} return _am.apply(this, arguments); };
  }
  /* jugador: golazo desde fuera y jugada clave fallada con victoria (se ven en la tarjeta del momento) */
  if (typeof feed === "function") {
    var _fd = feed;
    feed = function (card) {
      var r = _fd.apply(this, arguments);
      try {
        if (card && card.t === "moment" && S.mode !== "mgr") {
          if (card.good && card.choice === tr("Disparo desde fuera")) achE("x_fus");
        }
      } catch (e) {}
      return r;
    };
  }
})();
