/* ui-jugada-maestra.js — interfaz accesible del modo autónomo Jugada Maestra. */
(function () {
  if (typeof UIX === "undefined" || typeof JugadaMaestra === "undefined") return;
  var U = UIX, KEY = "camino.jugada-maestra.v1", active = null, drawing = null;
  function h(x) { return U.h(x); }
  function progress() {
    try { var p = JSON.parse(localStorage.getItem(KEY) || "null"); return p && p.v === 1 && p.done ? p : {v: 1, done: {}, medals: {}}; }
    catch (e) { return {v: 1, done: {}, medals: {}}; }
  }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function unlocked(id, p) { var lv = JugadaMaestra.levels(), at = lv.findIndex(function (x) { return x.id === id; }); return at <= 0 || !!p.done[lv[at - 1].id]; }
  function medal(n) { return n >= 3 ? "🥇" : n === 2 ? "🥈" : n === 1 ? "🥉" : ""; }
  U.add("mainhome", function () {
    var p = progress(), n = Object.keys(p.done).length;
    return '<button class="card jm-home" data-a="jmopen"><span class="jm-home-ic" aria-hidden="true">⚽</span><span class="grow"><b>' + h(tr("Jugada Maestra")) + '</b><small>' + h(tr("Dibuja pases y tiros, y resuelve la jugada.")) + '</small></span><span class="jm-progress">' + n + '/30</span><span class="chev" aria-hidden="true">›</span></button>';
  });
  U.actions.jmopen = function () { active = null; U.open("jugadamaestra"); };
  U.actions.jmstart = function (b, id) {
    if (!unlocked(id, progress())) return;
    active = JugadaMaestra.fresh(id, hashSeed(id, Date.now()));
    U.renderSheet();
  };
  U.actions.jmback = function () { active = null; U.renderSheet(); };
  U.actions.jmretry = function () {
    if (!active) return;
    active = JugadaMaestra.fresh(active.id, hashSeed(active.id, Date.now()));
    U.renderSheet();
  };
  U.actions.jmpass = function (b, i) {
    if (!active) return;
    var m = active.mates[+i]; if (!m) return;
    apply(JugadaMaestra.resolve(active, m.p[0], m.p[1]));
  };
  U.actions.jmshot = function () { if (active) apply(JugadaMaestra.resolve(active, 94, 50)); };
  function hashSeed(id, t) { var s = String(id) + "|" + String(t); var h0 = 2166136261; for (var i = 0; i < s.length; i++) h0 = Math.imul(h0 ^ s.charCodeAt(i), 16777619); return h0 >>> 0; }
  function apply(r) {
    if (!r || !r.ok) { if (r && r.msg) active.lastMsg = r.msg; U.renderSheet(); return; }
    active.lastMsg = r.msg;
    if (active.done && active.won) {
      var p = progress(), old = p.medals[active.id] || 0, now = JugadaMaestra.result(active).medal;
      p.done[active.id] = true; p.medals[active.id] = Math.max(old, now); save(p);
    }
    U.persist(); U.renderSheet();
  }
  function field(s) {
    var l = JugadaMaestra.level(s.id), path = s.log.length ? s.log.map(function (x) { return x; }) : [], last = path.length ? path[path.length - 1] : null;
    var out = '<svg class="jm-field" viewBox="0 0 360 220" role="img" aria-label="' + h(tr("Campo de fútbol. Arrastra desde el balón hacia un compañero o compañera, o hacia la portería.")) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><pattern id="jm-stripes" width="48" height="220" patternUnits="userSpaceOnUse"><rect width="24" height="220" fill="#ffffff" opacity=".035"/></pattern><marker id="jm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffe07a"/></marker></defs>' +
      '<rect x="4" y="4" width="352" height="212" rx="8" class="jm-grass"/><rect x="4" y="4" width="352" height="212" rx="8" fill="url(#jm-stripes)"/><path d="M180 4v212M4 110h352" class="jm-line"/><circle cx="180" cy="110" r="30" class="jm-line"/><circle cx="180" cy="110" r="2" class="jm-mark"/><path d="M4 62h52v96H4M4 82h24v56H4M356 62h-52v96h52M356 82h-24v56h24" class="jm-line"/><path d="M4 91h-7v38h7M356 91h7v38h-7" class="jm-goal"/>';
    s.rivals.forEach(function (p, i) { out += '<g class="jm-rival" aria-hidden="true"><circle cx="' + p[0] * 3.52 + '" cy="' + p[1] * 2.12 + '" r="8"/><text x="' + p[0] * 3.52 + '" y="' + (p[1] * 2.12 + 3) + '">' + (i + 1) + '</text></g>'; });
    s.mates.forEach(function (m, i) { out += '<g class="jm-mate" aria-hidden="true"><circle cx="' + m.p[0] * 3.52 + '" cy="' + m.p[1] * 2.12 + '" r="10"/><text x="' + m.p[0] * 3.52 + '" y="' + (m.p[1] * 2.12 + 3) + '">' + (i + 7) + '</text></g>'; });
    if (last && last.k === "pass" && last.from && last.to) out += '<path d="M' + last.from[0] * 3.52 + " " + last.from[1] * 2.12 + ' L' + last.to[0] * 3.52 + " " + last.to[1] * 2.12 + '" class="jm-trail"/>';
    out += '<circle class="jm-ball" cx="' + s.ball[0] * 3.52 + '" cy="' + s.ball[1] * 2.12 + '" r="5"/><path class="jm-path-preview" d=""/></svg>';
    return out;
  }
  U.sheets.jugadamaestra = function () {
    var p = progress(), levels = JugadaMaestra.levels();
    if (!active) return '<h2>' + h(tr("Jugada Maestra")) + '</h2><p class="muted">' + h(tr("Dibuja pases y tiros, y resuelve la jugada.")) + '</p><div class="jm-list">' + levels.map(function (l, i) {
      var open = unlocked(l.id, p), done = !!p.done[l.id];
      var chapter = (i % 6 === 0) ? '<h3 class="jm-chapter">' + h(tr("Capítulo {n}: {title}", {n: l.chapter, title: tr(l.chapterTitle)})) + '</h3>' : '';
      return chapter + '<button class="jm-row" data-a="jmstart" data-v="' + l.id + '"' + (open ? "" : " disabled") + '><span class="jm-no">' + (done ? medal(p.medals[l.id]) : String(i + 1).padStart(2, "0")) + '</span><span class="grow"><b>' + h(tr(l.title)) + '</b><small>' + h(tr(l.goal)) + '</small></span><span class="chev">' + (open ? "›" : "🔒") + '</span></button>';
    }).join("") + '</div><p class="muted jm-foot">' + h(tr("Retos independientes: no cambian el resultado ni las estadísticas de tus carreras.")) + '</p><button class="btn wide" data-a="close">' + h(tr("Cerrar")) + '</button>';
    var res = JugadaMaestra.result(active), level = JugadaMaestra.level(active.id), status = active.lastMsg || level.goal;
    var buttons = '';
    if (!active.done) {
      buttons = '<div class="jm-tools"><div class="jm-tool-label">' + h(tr("O elige un pase asistido")) + '</div><div class="jm-pass-list">' + active.mates.map(function (m, i) { return '<button class="btn" data-a="jmpass" data-v="' + i + '"' + (m.open ? "" : " disabled") + '>' + h(tr("Pase {n}", {n: i + 1})) + '</button>'; }).join("") + '</div><button class="go wide" data-a="jmshot">' + h(tr("Tirar a puerta")) + '</button></div>';
    } else {
      var won = active.won;
      buttons = '<div class="jm-result ' + (won ? "good" : "try") + '"><b>' + h(won ? tr("¡Jugada completada!") : tr("La defensa gana esta vez")) + '</b><p>' + h(won ? tr("Medalla conseguida: {medal}", {medal: medal(res.medal)}) : tr("Puedes intentarlo otra vez sin coste ni penalización.")) + '</p></div><button class="go wide" data-a="jmretry">' + h(tr("Volver a intentarlo")) + '</button>';
    }
    return '<div class="jm-game-head"><button class="jm-back" data-a="jmback" aria-label="' + h(tr("Volver a retos")) + '">‹ ' + h(tr("Retos")) + '</button><span>' + h(tr("Jugada {n} de 30", {n: levels.findIndex(function (x) { return x.id === active.id; }) + 1})) + '</span><span class="jm-turn">' + h(tr("Acciones: {n}/{max}", {n: active.turn, max: active.max})) + '</span></div><p class="jm-chapter-label">' + h(tr("Capítulo {n}: {title}", {n: level.chapter, title: tr(level.chapterTitle)})) + '</p><h2>' + h(tr(level.title)) + '</h2><p class="jm-objective">' + h(tr(level.goal)) + '</p>' + field(active) + '<p class="jm-status" role="status" aria-live="polite">' + h(tr(status)) + '</p>' + buttons + '<button class="btn wide" data-a="close">' + h(tr("Salir")) + '</button>';
  };
  function point(svg, e) {
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var q = p.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.max(0, Math.min(100, q.x / 3.6)), Math.max(0, Math.min(100, q.y / 2.2))];
  }
  document.addEventListener("pointerdown", function (e) {
    var svg = e.target.closest && e.target.closest("svg.jm-field");
    if (!svg || svg.getAttribute("data-jm") === "live" || !active || active.done || e.target.closest("[data-a]")) return;
    drawing = {svg: svg, id: e.pointerId, start: active.ball.slice()};
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  document.addEventListener("pointermove", function (e) {
    if (!drawing || e.pointerId !== drawing.id || !drawing.svg.isConnected) return;
    var p = point(drawing.svg, e), path = drawing.svg.querySelector(".jm-path-preview");
    if (path) path.setAttribute("d", "M" + drawing.start[0] * 3.52 + " " + drawing.start[1] * 2.12 + " L" + p[0] * 3.52 + " " + p[1] * 2.12);
  });
  document.addEventListener("pointerup", function (e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    var svg = drawing.svg, p = point(svg, e); drawing = null;
    if (!active || active.done) return;
    apply(JugadaMaestra.resolve(active, p[0], p[1]));
  });
  document.addEventListener("pointercancel", function () { drawing = null; });
})();
