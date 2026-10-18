/* ui-shootout.js — TANDA DE PENALTIS COMPLETA (patch 2.5, interfaz)
   Opción «so» de las decisiones "so" (jugador) y "mso" (míster): superposición a pantalla completa con
   · míster: pizarra para ordenar lanzadores (técnica, sangre fría, fatiga; orden sugerido; tocar para intercambiar)
   · tanda penalti a penalti: marcador con ✓/✗, tensión creciente, crónica y «simular el resto»
   · jugador: tu penalti abre Minigame.penalty; de portero, cada lanzamiento rival abre Minigame.gkPenalty
   Al terminar deja el estado en SO.forced y resuelve la decisión con la misma opción (UIX.choose). */
(function () {
  if (typeof UIX === "undefined" || typeof SO === "undefined") return;
  var h = UIX.h, V = null;

  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function later(ms, fn) { if (!V) return; clearTimeout(V.timer); V.timer = setTimeout(fn, reduced() ? Math.min(ms, 160) : ms); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  UIX.actions.so = function (b) {
    var x = S.pend[0], i = +b.getAttribute("data-i");
    if (!x || !S.cur || !S.cur.pm || !S.cur.pm[x.fi]) return;
    open(x, i);
  };

  /* ---------- abrir / cerrar ---------- */
  function open(x, i) {
    close();
    var f = S.cur.pm[x.fi], mgr = UIX.isMgr();
    V = {x: x, i: i, f: f, mgr: mgr, sel: -1, run: true, timer: null, flash: null, stage: "order"};
    var el = document.createElement("div");
    el.id = "so"; el.className = "so-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", tr("Tanda de penaltis"));
    document.body.appendChild(el);
    V.el = el; V.bodyOv = document.body.style.overflow; document.body.style.overflow = "hidden";
    el.addEventListener("click", onClick);
    if (mgr) {
      V.list = SO.mgrList(f);
      var ids = V.list.map(function (t) { return t.id; });
      V.ord = (x.ord || []).filter(function (id) { return ids.indexOf(id) >= 0; });
      if (V.ord.length !== ids.length) { V.ord = SO.autoOrder(V.list).map(function (t) { return t.id; }); }
    } else begin(SO.playerCtx(f));
    draw();
  }
  function close() {
    if (!V) return;
    clearTimeout(V.timer);
    if (V.el && V.el.parentNode) V.el.parentNode.removeChild(V.el);
    document.body.style.overflow = V.bodyOv || "";
    V = null;
  }
  function begin(ctx) {
    V.st = SO.make(Object.assign(ctx, {first: R() < 0.5 ? 1 : 0}));
    V.stage = "play";
    V.coin = V.st.first;
    later(1500, step);
  }

  /* ---------- nombres y escudos ---------- */
  function teams() {
    var f = V.f, usI = V.mgr ? S.m.club : f.us, nat = !V.mgr && f.isNat;
    var mk = function (i) { return {ab: nat ? W.ctry[i].code : W.clubs[i].ab, n: nat ? natName(i) : clubName(i), icon: nat ? UIX.flag(i) : UIX.crest(i)}; };
    return [mk(usI), mk(f.opp)];
  }

  /* ---------- flujo de la tanda ---------- */
  function interactive(nk) { return !!nk && !V.mgr && ((nk.side === 0 && nk.t.me) || (nk.side === 1 && V.st.gkMe)); }
  function step() {
    if (!V || V.stage !== "play") return;
    var nk = SO.nextKick(V.st);
    if (!nk) { V.stage = "end"; draw(); return; }
    V.nk = nk; V.flash = null;
    if (interactive(nk)) { V.wait = true; draw(); return; }
    V.wait = false; V.phase = "up"; draw();
    if (!V.run) return;
    later(1100, function () { shoot(nk); });
  }
  function shoot(nk) {
    if (!V || V.stage !== "play") return;
    var ok = R() < nk.p, w = ok ? 0 : R();
    resolveKick(nk, ok, ok ? "" : w < 0.55 ? "parada" : w < 0.73 ? "palo" : "fuera");
  }
  function resolveKick(nk, ok, how) {
    SO.record(V.st, nk, ok, how);
    V.flash = {ok: ok, how: how, side: nk.side, n: nk.t.n};
    V.phase = "res";
    if (SO.done(V.st)) { draw(); later(1300, function () { V.stage = "end"; draw(); }); return; }
    draw();
    if (V.run) later(1200, step);
  }
  function playMine() {
    var nk = V.nk, st = V.st, f = V.f;
    if (!nk || typeof Minigame === "undefined") return;
    var pressure = Math.max(0.1, Math.min(1, (st.imp || 1) / 3));
    V.wait = false; V.run = true;
    if (nk.side === 0) {
      var sk = Math.round(Math.max(40, Math.min(95, nk.t.pen - Math.max(0, nk.t.fat - 20) * 0.2)));
      Minigame.penalty({skill: sk, gk: Math.round(Math.max(40, Math.min(95, st.gkThem))), pressure: pressure, press: nk.press, rand: R}, function (res) {
        if (!V) return;
        resolveKick(nk, !!(res && res.scored), res && res.scored ? "" : "fuera");
      });
    } else {
      Minigame.gkPenalty({gk: Math.round(Math.max(40, Math.min(95, st.gkUs))), skill: Math.round(Math.max(40, Math.min(95, nk.t.pen))), pressure: pressure, press: nk.press, rand: R, dist: 18}, function (res) {
        if (!V) return;
        resolveKick(nk, !!(res && res.scored), res && res.saved ? "parada" : res && !res.scored ? "fuera" : "");
      });
    }
  }
  function simRest() {
    if (!V || !V.st) return;
    clearTimeout(V.timer);
    while (!SO.done(V.st)) { var nk = SO.nextKick(V.st); if (!nk) break; shootSilent(nk); }
    V.stage = "end"; V.flash = null; draw();
  }
  function shootSilent() { SO.simKick(V.st, R); }
  function finish() {
    if (!V || !SO.done(V.st)) return;
    var st = V.st, i = V.i, win = SO.winner(st) === 0, mgr = V.mgr;
    SO.forced = st;
    if (mgr) FORCE_OUT = win;
    close();
    UIX.choose(i);
  }

  /* ---------- clics ---------- */
  function onClick(e) {
    var b = e.target.closest("[data-so]");
    if (!b || b.disabled || !V) return;
    var a = b.getAttribute("data-so"), k = +b.getAttribute("data-k");
    switch (a) {
      /* la × no deshace la tanda: antes de empezar solo cierra; empezada, se simula lo que falta; acabada, cuenta este resultado */
      case "close":
        if (V.st && V.stage !== "order") { if (!SO.done(V.st)) simRest(); finish(); }
        else close();
        break;
      case "pick":
        if (V.sel < 0) V.sel = k;
        else if (V.sel === k) V.sel = -1;
        else { var t = V.ord[V.sel]; V.ord[V.sel] = V.ord[k]; V.ord[k] = t; V.sel = -1; saveOrd(); }
        draw(); break;
      case "up": case "down":
        var j = a === "up" ? k - 1 : k + 1;
        if (j >= 0 && j < V.ord.length) { var u = V.ord[k]; V.ord[k] = V.ord[j]; V.ord[j] = u; V.sel = -1; saveOrd(); draw(); }
        break;
      case "auto": V.ord = SO.autoOrder(V.list).map(function (t) { return t.id; }); V.sel = -1; saveOrd(); draw(); break;
      case "start": saveOrd(); begin(SO.mgrCtx(V.f, V.ord)); draw(); break;
      case "mine": playMine(); break;
      case "pause": V.run = !V.run; if (V.run && !V.wait) { if (V.phase === "up" && V.nk) later(400, function () { shoot(V.nk); }); else later(300, step); } else clearTimeout(V.timer); draw(); break;
      case "next": clearTimeout(V.timer); if (V.phase === "up" && V.nk && !V.wait) shoot(V.nk); else step(); break;
      case "sim": simRest(); break;
      case "end": finish(); break;
    }
  }
  function saveOrd() { V.x.ord = V.ord.slice(); UIX.persist(); }

  /* ---------- dibujo ---------- */
  function bar(v, cls) { return '<span class="so-bar ' + (cls || "") + '"><i style="width:' + Math.max(4, Math.min(100, v)) + '%"></i></span>'; }
  function head(sub) {
    var f = V.f;
    return '<div class="so-top"><span class="eyebrow">' + h(compShort(f) + (roundLabel(f) ? " · " + roundLabel(f) : "")) + '</span><button class="so-x" data-so="close" aria-label="' + h(tr("Cerrar")) + '">×</button></div>' +
      '<h2 class="so-title">' + h(tr("Tanda de penaltis")) + "</h2>" + (sub ? '<p class="so-sub">' + sub + "</p>" : "");
  }
  function drawOrder() {
    var by = {};
    V.list.forEach(function (t) { by[t.id] = t; });
    var s = head(h(tr("Ordena a tus lanzadores. Toca a dos jugadores para intercambiarlos o usa las flechas.")));
    s += '<div class="so-legend"><span>' + h(tr("Técnica")) + "</span><span>" + h(tr("Sangre fría")) + "</span><span>" + h(tr("Fatiga")) + "</span></div>";
    s += '<ol class="so-ord">';
    V.ord.forEach(function (id, k) {
      var t = by[id]; if (!t) return;
      if (k === 5) s += '<li class="so-sep">' + h(tr("Muerte súbita")) + "</li>";
      var p = Math.round(SO.kickP(t, k === 4 ? 0.75 : k >= 5 ? 1 : 0.2, V.f.or || 70) * 100);
      s += '<li class="so-li' + (V.sel === k ? " on" : "") + (k === 4 ? " fifth" : "") + '">' +
        '<button class="so-row" data-so="pick" data-k="' + k + '" aria-pressed="' + (V.sel === k) + '"><span class="so-n num">' + (k + 1) + '</span><span class="so-who"><b>' + h(t.n) + "</b><small>" + h(posName(t.pos)) + "</small></span>" +
        '<span class="so-attrs"><span class="so-at"><em class="num">' + t.pen + "</em>" + bar((t.pen - 30) / 0.69, "pen") + '</span><span class="so-at"><em class="num">' + t.comp + "</em>" + bar(t.comp, "comp") + '</span><span class="so-at"><em class="num">' + t.fat + "</em>" + bar(t.fat, "fat") + "</span></span>" +
        '<span class="so-pc num ' + (p >= 75 ? "hi" : p >= 62 ? "mid" : "lo") + '">' + p + "%</span></button>" +
        '<span class="so-mv"><button data-so="up" data-k="' + k + '" aria-label="' + h(tr("Subir")) + '"' + (k === 0 ? " disabled" : "") + '>▲</button><button data-so="down" data-k="' + k + '" aria-label="' + h(tr("Bajar")) + '"' + (k === V.ord.length - 1 ? " disabled" : "") + ">▼</button></span></li>";
    });
    s += "</ol>";
    s += '<p class="so-note muted">' + h(tr("El % es su acierto estimado; en el quinto y en la muerte súbita pesa mucho más la sangre fría.")) + "</p>";
    s += '<div class="so-btns"><button class="btn" data-so="auto">' + h(tr("Orden sugerido")) + '</button><button class="btn pri" data-so="start">' + h(tr("¡A la tanda!")) + "</button></div>";
    return s;
  }
  function boardRow(st, side, tm, nk) {
    var k = st.k[side], n = Math.max(5, k.length + (nk && nk.side === side ? 1 : 0), st.k[1 - side].length), d = "";
    for (var i = 0; i < n; i++) {
      var cls = i < k.length ? (k[i] ? "ok" : "ko") : nk && nk.side === side && i === k.length ? "now" : "";
      d += '<i class="so-dot ' + cls + (i >= 5 ? " sd" : "") + '">' + (i < k.length ? (k[i] ? "✓" : "✗") : "") + "</i>";
    }
    var sc = SO.score(st)[side];
    return '<div class="so-tm' + (nk && nk.side === side ? " kick" : "") + '">' + (tm.icon || "") + '<b class="so-ab">' + h(tm.ab) + '</b><span class="so-dots' + (n > 6 ? " many" : "") + '">' + d + '</span><span class="so-sc num">' + sc + "</span></div>";
  }
  function drawPlay() {
    var st = V.st, tm = teams(), nk = V.stage === "play" ? SO.nextKick(st) : null, end = V.stage === "end";
    var s = head(st.k[0].length + st.k[1].length === 0 ? h(tr("Sorteo: empieza a lanzar el {team}.", {team: tm[V.coin].n})) : "");
    s += '<div class="so-board">' + boardRow(st, 0, tm[0], nk) + boardRow(st, 1, tm[1], nk) + "</div>";
    if (end) {
      var win = SO.winner(st) === 0, sc = SO.score(st);
      s += '<div class="so-end ' + (win ? "win" : "lose") + '"><b>' + h(win ? tr("¡Pasáis!") : tr("Eliminados")) + '</b><span class="num">' + sc[0] + " - " + sc[1] + "</span></div>";
      s += '<div class="so-btns"><button class="btn pri wide" data-so="end">' + h(tr("Continuar")) + "</button></div>";
    } else if (nk) {
      var kindTxt = {win: tr("Penalti para ganar"), save: tr("Obligado a marcar"), sd: tr("Muerte súbita")}[nk.kind] || tr("Penalti {n} de 5", {n: nk.i + 1});
      var lvl = Math.round(nk.press * 100);
      s += '<div class="so-tension' + (lvl >= 70 ? " hot" : "") + '"><span>' + h(tr("Tensión")) + '</span><span class="so-tb"><i style="width:' + Math.max(8, lvl) + '%"></i></span><b>' + h(kindTxt) + "</b></div>";
      var fl = V.flash, me = nk.t.me, mineTurn = V.wait && interactive(nk);
      var who = nk.side === 0 ? tm[0].ab : tm[1].ab;
      s += '<div class="so-now' + (fl ? (fl.ok === (fl.side === 0) ? " good" : " bad") : "") + (mineTurn ? " mine" : "") + '">';
      if (fl && V.phase === "res") {
        var big = fl.ok ? tr("¡GOL!") : fl.how === "parada" ? tr("¡PARADA!") : fl.how === "palo" ? tr("¡AL PALO!") : tr("¡FUERA!");
        s += '<span class="so-big">' + h(big) + '</span><span class="so-who2">' + h(fl.n) + "</span>";
      } else {
        s += '<span class="so-kicker">' + h(who) + " · " + h(posName(nk.t.pos)) + '</span><span class="so-name">' + h(nk.t.n) + (me ? ' <em class="so-you">' + h(tr("Tú")) + "</em>" : "") + "</span>";
        if (mineTurn) s += '<span class="so-msg">' + h(nk.side === 0 ? tr("Te toca. Coges el balón, lo besas y lo colocas en el punto.") : tr("Te toca bajo palos. Mira al lanzador a los ojos.")) + "</span>";
        else s += '<span class="so-msg">' + h(V.phase === "up" ? pick([tr("Coloca el balón en el punto…"), tr("Toma carrerilla…"), tr("Silencio en el estadio…")]) : tr("Al punto de penalti")) + '</span><span class="so-p">' + h(tr("Acierto estimado: {p} %", {p: Math.round(nk.p * 100)})) + "</span>";
      }
      s += "</div>";
      s += '<div class="so-btns">';
      if (mineTurn) s += '<button class="btn pri wide so-go" data-so="mine">' + h(nk.side === 0 ? tr("Tirar mi penalti") : tr("Ponerte bajo palos")) + "</button>";
      else s += '<button class="btn" data-so="pause">' + h(V.run ? tr("Pausa") : tr("Seguir")) + '</button><button class="btn" data-so="next">' + h(tr("Siguiente")) + "</button>";
      s += '<button class="btn" data-so="sim">' + h(tr("Simular el resto")) + "</button></div>";
    }
    if (st.log.length) {
      s += '<ol class="so-log" reversed>';
      for (var i = st.log.length - 1; i >= 0; i--) {
        var l = st.log[i], txt = l.ok ? (l.me ? tr("¡Marcas!") : tr("marca")) : l.h === "parada" ? (l.s === 1 && V.st.gkMe ? tr("¡se lo paras!") : tr("se lo paran")) : l.h === "palo" ? tr("al palo") : tr("la manda fuera");
        s += '<li class="' + (l.ok ? "ok" : "ko") + '"><i>' + (l.ok ? "✓" : "✗") + "</i><b>" + h(tm[l.s].ab) + "</b> " + h(l.n) + ' <span class="muted">' + h(txt) + "</span></li>";
      }
      s += "</ol>";
    }
    return s;
  }
  function draw() {
    if (!V || !V.el) return;
    var sc = V.el.querySelector(".so-box"), top = sc ? sc.scrollTop : 0;
    V.el.innerHTML = '<div class="so-box' + (V.stage === "order" ? " ord" : "") + '">' + (V.stage === "order" ? drawOrder() : drawPlay()) + "</div>";
    var nb = V.el.querySelector(".so-box"); if (nb) nb.scrollTop = top;
  }

  UIX.shootout = {open: open, close: close, state: function () { return V; }};
})();
