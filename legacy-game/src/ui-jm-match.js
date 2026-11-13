/* ui-jm-match.js — Jugada Maestra dentro de un partido en directo.
   La secuencia llega sellada desde el motor (S.live.jm): aquí solo se dibuja el campo,
   se recogen los trazos y se muestra el resultado. El partido queda en pausa hasta que
   se cierra el panel, y la jugada nunca se repite. */
(function () {
  if (typeof UIX === "undefined" || typeof JugadaMaestra === "undefined") return;
  var U = UIX, ui = null, drawing = null, cssDone = false;
  function h(x) { return U.h(x); }
  function tr2(s, o) { return typeof tr === "function" ? tr(s, o) : s; }
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    var st = document.createElement("style");
    st.id = "jml-css";
    st.textContent = ".jml-ov{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;padding:0;background:rgba(4,9,11,.82);backdrop-filter:blur(3px);animation:fadein .18s ease-out}" +
      ".jml-box{width:100%;max-width:560px;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;color:var(--chalk)}" +
      ".jml-head{display:flex;flex-direction:column;gap:4px}" +
      ".jml-kick{display:inline-flex;align-items:center;gap:6px;width:max-content;padding:3px 9px;border-radius:999px;background:rgba(255,224,122,.16);color:#ffe07a;font:800 var(--fs-xs)/1.2 var(--f-body);letter-spacing:.06em;text-transform:uppercase}" +
      ".jml-head h2{margin:2px 0 0;font:800 var(--fs-xl)/1.1 var(--f-disp);text-transform:uppercase}" +
      ".jml-score{display:flex;align-items:center;gap:10px;font-variant-numeric:tabular-nums;color:var(--chalk)}" +
      ".jml-score b{font:800 var(--fs-2xl)/1 var(--f-disp);letter-spacing:.02em}" +
      ".jml-score span{font:600 var(--fs-sm)/1.2 var(--f-body);color:rgba(237,241,232,.78);max-width:38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".jml-intro{margin:0;font-size:var(--fs-sm);line-height:1.45;color:rgba(237,241,232,.82)}" +
      ".jml-status{min-height:2.6em;margin:0;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.07);font-weight:650;line-height:1.4}" +
      ".jml-field-wrap{position:relative}" +
      ".jml-turn{position:absolute;right:8px;top:8px;padding:4px 9px;border-radius:999px;background:rgba(6,12,14,.72);font:800 var(--fs-xs)/1.2 var(--f-body);font-variant-numeric:tabular-nums;pointer-events:none}" +
      ".jml-tools{display:grid;gap:8px}" +
      ".jml-tool-label{font-size:var(--fs-sm);color:rgba(237,241,232,.72)}" +
      ".jml-pass-list{display:flex;gap:8px;flex-wrap:wrap}" +
      ".jml-pass-list .btn{flex:1 1 90px;min-height:44px}" +
      ".jml-acts{display:grid;gap:8px}" +
      ".jml-acts .btn{min-height:44px}" +
      ".jml-res{margin:0;padding:12px 14px;border-radius:14px;font-weight:650;line-height:1.45}" +
      ".jml-res.good{background:#e6f6e9;color:#174528}.jml-res.try{background:#fff1df;color:#5c3614}" +
      ".jml-go{min-height:48px}" +
      ".jml-box .jm-field{max-height:min(46vh,340px);border:1px solid rgba(255,255,255,.14)}" +
      "@media(max-height:560px){.jml-box .jm-field{max-height:34vh}.jml-intro{display:none}}";
    document.head.appendChild(st);
  }
  /* Dos contextos comparten panel y motor: el partido en directo del míster y la carrera
     de jugador/a. En ambos la ocasión llega sellada por el motor y solo se resuelve una vez. */
  function isLive() { return !!(typeof S !== "undefined" && S && S.live && typeof jmLiveState === "function" && jmLiveState()); }
  /* el estado sellado; el tablero dibujable vive en su .st */
  function jmMeta() {
    if (isLive()) return jmLiveState();
    return typeof jmPlayerState === "function" ? jmPlayerState() : null;
  }
  function jm() { var m = jmMeta(); return m && m.st ? m.st : null; }
  function fixture() {
    if (typeof S === "undefined" || !S || !S.cur || !S.cur.pm) return null;
    if (isLive()) return S.cur.pm[S.live.fi];
    var i = typeof S.cur.pi === "number" ? S.cur.pi : -1;
    return i >= 0 ? S.cur.pm[i] : null;
  }
  function teamName(id) { return typeof clubName === "function" ? clubName(id) : ""; }
  function teamOf(f, id) { return f && f.isNat ? (typeof natName === "function" ? natName(id) : teamName(id)) : teamName(id); }
  /* goles de cada equipo (nosotros y rival) en el momento de la ocasión */
  function scoreNow() {
    if (isLive()) return [S.live.gu, S.live.gt];
    var f = fixture(), m = jmMeta();
    if (!f) return [0, 0];
    var sc = typeof scoreAt === "function" ? scoreAt(f, m && m.min != null ? m.min : 90) : [0, 0];
    /* el gol convertido se suma al marcador visible: es el gol que el partido ya tenía previsto
       en ese minuto, no uno nuevo; solo cambia de quién es el tanto */
    if (m && m.done && m.res === "goal") return [sc[0] + 1, sc[1]];
    return [sc[0], sc[1]];
  }
  function matchOver() { return isLive() ? !!S.live.done : false; }
  function shotAt(x, y) { return isLive() ? jmLiveResolve(x, y) : jmPlayerResolve(x, y); }
  function autoShot() { return isLive() ? jmLiveAuto() : jmPlayerAuto(); }
  function refreshView() { if (isLive() && U.liveRefresh) U.liveRefresh(); }
  function resumeView() { if (isLive()) { if (U.liveResume) U.liveResume(); } else if (U.playerJMResume) U.playerJMResume(); }
  function goalPoint() {
    /* la portería se ataca de izquierda a derecha en el dibujo */
    return [94, 50];
  }
  function field(s) {
    var out = '<svg class="jm-field" data-jm="live" viewBox="0 0 360 220" role="group" aria-label="' + h(tr2("Campo de fútbol. Arrastra desde el balón hacia un compañero o compañera, o hacia la portería.")) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><pattern id="jm-stripes" width="48" height="220" patternUnits="userSpaceOnUse"><rect width="24" height="220" fill="#ffffff" opacity=".035"/></pattern><marker id="jm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffe07a"/></marker></defs>' +
      '<rect x="4" y="4" width="352" height="212" rx="8" class="jm-grass"/><rect x="4" y="4" width="352" height="212" rx="8" fill="url(#jm-stripes)"/>' +
      '<path d="M180 4v212M4 110h352" class="jm-line"/><circle cx="180" cy="110" r="30" class="jm-line"/><circle cx="180" cy="110" r="2" class="jm-mark"/>' +
      '<path d="M4 62h52v96H4M4 82h24v56H4M356 62h-52v96h52M356 82h-24v56h24" class="jm-line"/><path d="M4 91h-7v38h7M356 91h7v38h-7" class="jm-goal"/>';
    s.rivals.forEach(function (p, i) { out += '<g class="jm-rival" aria-hidden="true"><circle cx="' + p[0] * 3.52 + '" cy="' + p[1] * 2.12 + '" r="8"/><text x="' + p[0] * 3.52 + '" y="' + (p[1] * 2.12 + 3) + '">' + (i + 1) + "</text></g>"; });
    s.mates.forEach(function (m, i) { out += '<g class="jm-mate" aria-hidden="true"><circle cx="' + m.p[0] * 3.52 + '" cy="' + m.p[1] * 2.12 + '" r="10"/><text x="' + m.p[0] * 3.52 + '" y="' + (m.p[1] * 2.12 + 3) + '">' + (i + 7) + "</text></g>"; });
    (s.log || []).forEach(function (x, i) {
      if (x.k === "pass" && x.from && x.to) out += '<path d="M' + x.from[0] * 3.52 + " " + x.from[1] * 2.12 + " L" + x.to[0] * 3.52 + " " + x.to[1] * 2.12 + '" class="jm-trail" opacity="' + Math.max(0.25, 1 - (s.log.length - i) * 0.15) + '"/>';
      if (x.k === "shot" && x.from && x.to) out += '<path d="M' + x.from[0] * 3.52 + " " + x.from[1] * 2.12 + " L" + x.to[0] * 3.52 + " " + x.to[1] * 2.12 + '" class="jm-trail"/>';
    });
    out += '<circle class="jm-ball" cx="' + s.ball[0] * 3.52 + '" cy="' + s.ball[1] * 2.12 + '" r="5"/><path class="jm-path-preview" d=""/></svg>';
    return out;
  }
  function resolved() { var m = jmMeta(); return !!(m && m.done); }
  function statusText(s) {
    if (!s) return "";
    if (s.done || resolved()) {
      var j = jmMeta(), res = j && j.res;
      if (s.won || res === "goal") return isLive()
        ? tr2("Gol: la jugada acaba en la red. El marcador y las estadísticas ya lo reflejan.")
        : tr2("Gol: el tanto es tuyo y cuenta en tus estadísticas.");
      if (res === "block") return tr2("La defensa despeja el balón. La jugada no se repite.");
      if (res === "lost") return tr2("Pérdida: el rival corta la jugada y se lleva el balón.");
      if (res === "save") return tr2("El portero llega: parada y el juego sigue.");
      if (res === "post") return tr2("Al palo: la jugada se queda ahí.");
      return tr2("El disparo se marcha fuera. El partido continúa.");
    }
    var last = s.log && s.log.length ? s.log[s.log.length - 1] : null;
    return last && last.msg ? tr2(last.msg) : tr2("Dibuja desde el balón hacia un compañero o compañera, o hacia la portería.");
  }
  function panel() {
    var s = jm(), f = fixture();
    if (!s || !f) return "";
    var live = isLive(), m = jmMeta();
    var my = f ? teamOf(f, f.us) : (live && S.m && S.m.club >= 0 ? teamName(S.m.club) : ""), op = f ? teamOf(f, f.opp) : "";
    var home = f ? !!f.home : true, sc = scoreNow();
    var a = home ? sc[0] : sc[1], b = home ? sc[1] : sc[0];
    var left = home ? my : op, right = home ? op : my;
    var remaining = Math.max(0, s.max - s.turn);
    var done = !!s.done || resolved();
    var who = live ? tr2("Ocasión para el {club}", {club: my})
      : tr2("Ocasión para {name}", {name: (S.p ? (S.p.fn + " " + S.p.ln) : "")});
    var out = '<div class="jml-head"><span class="jml-kick">⚽ ' + h(tr2("Jugada Maestra")) + "</span>" +
      '<h2>' + h(who) + "</h2>" +
      '<div class="jml-score"><span>' + h(left) + "</span><b>" + a + " – " + b + "</b><span>" + h(right) + "</span><b style=\"font-size:var(--fs-md)\">" + (matchOver() ? h(tr2("Final")) : (m && m.min != null ? m.min : 0) + "'") + "</b></div></div>" +
      '<p class="jml-intro">' + h(done ? tr2("La jugada ya está resuelta. Vuelve al partido cuando quieras.") : tr2("El partido está en pausa. Dibuja desde el balón hacia un compañero o hacia la portería: la jugada se resuelve una sola vez.")) + "</p>" +
      '<div class="jml-field-wrap">' + field(s) + (done ? "" : '<span class="jml-turn">' + h(tr2("Acciones: {n}/{max}", {n: s.turn, max: s.max})) + "</span>") + "</div>" +
      '<p class="jml-status" role="status" aria-live="polite">' + h(statusText(s)) + "</p>";
    if (!done) {
      out += '<div class="jml-tools"><div class="jml-tool-label">' + h(tr2("O elige un pase asistido")) + '</div><div class="jml-pass-list">' +
        s.mates.map(function (m, i) { return '<button class="btn" data-jml="pass" data-v="' + i + '"' + (m.open ? "" : " disabled") + ">" + h(tr2("Pase {n}", {n: i + 1})) + "</button>"; }).join("") +
        '</div><button class="go wide" data-jml="shot">' + h(tr2("Tirar a puerta")) + "</button></div>" +
        '<div class="jml-acts"><button class="btn wide" data-jml="auto">' + h(tr2("Dejar que decida el equipo")) + "</button></div>";
      if (remaining === 1) out += '<p class="jml-intro" style="margin:0">' + h(tr2("Última acción de la jugada.")) + "</p>";
    } else {
      out += '<div class="jml-acts"><button class="go wide jml-go" data-jml="back">' + h(tr2("Continuar el partido")) + "</button></div>";
    }
    return out;
  }
  function render() {
    if (!ui) return;
    var s = jm();
    if (!s) { close(true); return; }
    ui.box.innerHTML = panel();
    if (s.done || resolved()) { var g = ui.ov.querySelector('[data-jml="back"]'); if (g) try { g.focus(); } catch (e) {} }
  }
  function open() {
    if (ui || !jm()) return;
    injectCss();
    var ov = document.createElement("div");
    ov.className = "jml-ov"; ov.id = "jml-ov";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", tr2("Jugada Maestra"));
    var box = document.createElement("div");
    box.className = "jml-box";
    ov.appendChild(box);
    ui = {ov: ov, box: box};
    document.body.appendChild(ov);
    render();
    var first = ov.querySelector('[data-jml="pass"]:not([disabled])') || ov.querySelector('[data-jml="shot"]');
    if (first) try { first.focus(); } catch (e) {}
  }
  function close(resume) {
    if (ui) { try { ui.ov.remove(); } catch (e) {} ui = null; drawing = null; }
    if (resume) resumeView();
  }
  function act(kind, v) {
    if (kind === "back") { close(true); return; }
    var s = jm();
    if (!s || s.done || resolved()) return;
    if (kind === "auto") { autoShot(); render(); refreshView(); return; }
    if (kind === "pass") {
      var mate = s.mates[+v];
      if (!mate || !mate.open) return;
      after(shotAt(mate.p[0], mate.p[1]));
    } else if (kind === "shot") {
      var g = goalPoint();
      after(shotAt(g[0], g[1]));
    }
  }
  function after(r) {
    if (!r) return;
    render();
    refreshView();
    try { if (typeof Sfx !== "undefined" && Sfx.play) Sfx.play(r.pending ? "tap" : r.outcome === "goal" ? "big" : r.outcome ? "meh" : "choose"); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    if (!ui) return;
    var b = e.target.closest ? e.target.closest("[data-jml]") : null;
    if (!b || !ui.ov.contains(b)) return;
    e.preventDefault();
    act(b.getAttribute("data-jml"), b.getAttribute("data-v"));
  });
  function point(svg, e) {
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    var q = p.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.max(0, Math.min(100, q.x / 3.6)), Math.max(0, Math.min(100, q.y / 2.2))];
  }
  document.addEventListener("pointerdown", function (e) {
    var s = jm();
    if (!ui || !s || s.done || resolved()) return;
    var svg = e.target.closest && e.target.closest("svg.jm-field");
    if (!svg || svg.getAttribute("data-jm") !== "live" || e.target.closest("[data-jml]")) return;
    drawing = {svg: svg, id: e.pointerId, start: s.ball.slice()};
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  document.addEventListener("pointermove", function (e) {
    if (!drawing || e.pointerId !== drawing.id || !drawing.svg.isConnected) return;
    var p;
    try { p = point(drawing.svg, e); } catch (err) { return; }
    var path = drawing.svg.querySelector(".jm-path-preview");
    if (path) path.setAttribute("d", "M" + drawing.start[0] * 3.52 + " " + drawing.start[1] * 2.12 + " L" + p[0] * 3.52 + " " + p[1] * 2.12);
  });
  document.addEventListener("pointerup", function (e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    var svg = drawing.svg, p;
    drawing = null;
    var s = jm();
    if (!ui || !s || s.done || resolved()) return;
    try { p = point(svg, e); } catch (err) { return; }
    after(shotAt(p[0], p[1]));
  });
  document.addEventListener("pointercancel", function () { drawing = null; });
  document.addEventListener("keydown", function (e) {
    if (!ui) return;
    if (e.key === "1" || e.key === "2" || e.key === "3") act("pass", String(+e.key - 1));
    if (e.key === "Enter" && document.activeElement === ui.ov) act("shot");
  });
  U.jmMatch = {open: open, close: close, render: render, isOpen: function () { return !!ui; }};
})();
