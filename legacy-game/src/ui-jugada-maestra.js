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
    if (heroOn()) { if (U.closeSheet) U.closeSheet(); heroOpen(); return; }
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
  function record(r) {
    active.lastMsg = r.msg;
    if (active.done && active.won) {
      var p = progress(), old = p.medals[active.id] || 0, now = JugadaMaestra.result(active).medal;
      p.done[active.id] = true; p.medals[active.id] = Math.max(old, now); save(p);
    }
    if (U.persist) U.persist();
  }
  function apply(r) {
    if (!r || !r.ok) { if (r && r.msg) active.lastMsg = r.msg; U.renderSheet(); return; }
    record(r); U.renderSheet();
  }

  /* ---------- vista 3D a pantalla completa (si el dispositivo tiene WebGL) ---------- */
  var hero = null;
  function heroOn() { return typeof JMHero !== "undefined" && !!JMHero && JMHero.ok() && typeof document !== "undefined"; }
  function stars(n, of) { var o = ""; for (var i = 0; i < (of || 3); i++) o += '<span class="jmh-star' + (i < n ? " on" : "") + '"></span>'; return o; }
  function heroHud() {
    if (!hero || !active) return;
    var lv = JugadaMaestra.levels(), at = lv.findIndex(function (x) { return x.id === active.id; }), l = JugadaMaestra.level(active.id);
    var left = Math.max(0, active.max - active.turn), dots = "";
    for (var i = 0; i < active.max; i++) dots += '<span class="jmh-dot' + (i < left ? " on" : "") + '"></span>';
    hero.ov.querySelector(".jmh-hud").innerHTML = '<div class="jmh-row"><button class="jmh-back" data-jmh="list" aria-label="' + h(tr("Volver a retos")) + '">‹</button>' +
      '<div class="grow"><small>' + h(tr("Jugada {n} de 30", {n: at + 1})) + " · " + h(tr("Capítulo {n}: {title}", {n: l.chapter, title: tr(l.chapterTitle)})) + "</small><b>" + h(tr(l.title)) + "</b></div>" +
      '<div class="jmh-moves" aria-label="' + h(tr("Acciones: {n}/{max}", {n: active.turn, max: active.max})) + '">' + dots + "</div></div>" +
      '<p class="jmh-goal">' + h(tr(l.goal)) + "</p>";
    var foot = hero.ov.querySelector(".jmh-foot");
    foot.innerHTML = active.done ? "" : '<div class="jmh-assist" aria-label="' + h(tr("O elige un pase asistido")) + '">' + active.mates.map(function (m, i) {
      return '<button class="jmh-chip" data-jmh="pass" data-v="' + i + '"' + (m.open ? "" : " disabled") + ">" + h(tr("Pase {n}", {n: i + 1})) + "</button>"; }).join("") +
      '<button class="jmh-chip shot" data-jmh="shot">' + h(tr("Tirar a puerta")) + "</button></div>";
    var res = hero.ov.querySelector(".jmh-res");
    if (!active.done) { res.hidden = true; return; }
    var won = !!active.won, md = JugadaMaestra.result(active).medal, nx = lv[at + 1], canNext = won && nx;
    res.hidden = false;
    res.innerHTML = '<div class="jmh-card ' + (won ? "good" : "try") + '"><b>' + h(won ? tr("¡Jugada completada!") : tr("La defensa gana esta vez")) + "</b>" +
      '<div class="jmh-stars" aria-label="' + h(won ? tr("Medalla conseguida: {medal}", {medal: md}) : "") + '">' + stars(won ? md : 0) + "</div>" +
      "<p>" + h(won ? tr("Menos acciones, más estrellas.") : tr(active.lastMsg || "Puedes intentarlo otra vez sin coste ni penalización.")) + "</p>" +
      '<div class="jmh-btns">' + (canNext ? '<button class="go" data-jmh="next">' + h(tr("Siguiente jugada")) + "</button>" : "") +
      '<button class="' + (canNext ? "btn" : "go") + '" data-jmh="retry">' + h(tr("Volver a intentarlo")) + '</button><button class="btn" data-jmh="list">' + h(tr("Retos")) + "</button></div></div>";
  }
  function heroClose() { if (!hero) return; try { hero.view.dispose(); } catch (e) {} try { hero.ov.remove(); } catch (e) {} hero = null; }
  function heroOpen() {
    heroClose();
    var ov = document.createElement("div");
    ov.className = "jmh-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", tr("Jugada Maestra"));
    ov.innerHTML = '<div class="jmh-stage"></div><div class="jmh-hud"></div><div class="jmh-foot"></div><div class="jmh-res" hidden></div>';
    document.body.appendChild(ov);
    var l = JugadaMaestra.level(active.id);
    var view = JMHero.mount(ov.querySelector(".jmh-stage"), {
      get: function () { return active; },
      resolve: function (x, y, path, hh) { return JugadaMaestra.resolve(active, x, y, path, hh); },
      after: function (r) { record(r); heroHud(); },
      mine: true, press: Math.min(0.9, 0.2 + (l ? l.chapter : 1) * 0.14)
    });
    if (!view) { ov.remove(); U.open("jugadamaestra"); U.renderSheet(); return; }
    hero = {ov: ov, view: view};
    heroHud();
    view.say(tr("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar."), 4200);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", function (e) {
      if (!hero) return;
      var b = e.target.closest ? e.target.closest("[data-jmh]") : null;
      if (!b || !hero.ov.contains(b)) return;
      var k = b.getAttribute("data-jmh"), v = b.getAttribute("data-v");
      if (k === "list") { heroClose(); active = null; U.open("jugadamaestra"); return; }
      if (k === "retry") { active = JugadaMaestra.fresh(active.id, hashSeed(active.id, Date.now())); heroOpen(); return; }
      if (k === "next") { var lv = JugadaMaestra.levels(), at = lv.findIndex(function (x) { return x.id === active.id; }), nx = lv[at + 1]; if (nx && unlocked(nx.id, progress())) { active = JugadaMaestra.fresh(nx.id, hashSeed(nx.id, Date.now())); heroOpen(); } return; }
      if (k === "pass") { hero.view.act("pass", v); return; }
      if (k === "shot") { hero.view.act("shot"); }
    });
    document.addEventListener("keydown", function (e) { if (hero && e.key === "Escape") { heroClose(); active = null; U.open("jugadamaestra"); } });
    var hcss = document.createElement("style"); hcss.id = "jmh-ov-css";
    hcss.textContent = ".jmh-ov{position:fixed;inset:0;z-index:2147483000;background:#050b09;color:#fff;overscroll-behavior:contain}" +
      ".jmh-stage{position:absolute;inset:0}" +
      ".jmh-hud{position:absolute;left:0;right:0;top:0;z-index:4;padding:max(10px,env(safe-area-inset-top)) 12px 18px;background:linear-gradient(rgba(0,0,0,.7),rgba(0,0,0,0));pointer-events:none}" +
      ".jmh-hud button{pointer-events:auto}.jmh-row{display:flex;align-items:center;gap:10px}.jmh-row .grow{flex:1;min-width:0;display:flex;flex-direction:column}" +
      ".jmh-row small{font:700 var(--fs-xs)/1.2 var(--f-body);opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jmh-row b{font:800 var(--fs-lg)/1.1 var(--f-disp);text-transform:uppercase}" +
      ".jmh-back{width:40px;height:40px;border-radius:12px;border:0;background:rgba(255,255,255,.14);color:#fff;font:800 24px/1 var(--f-body)}" +
      ".jmh-moves{display:flex;gap:5px}.jmh-dot{width:13px;height:13px;border-radius:50%;background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}.jmh-dot.on{background:#ffd23f;box-shadow:0 0 8px rgba(255,210,63,.7)}" +
      ".jmh-goal{margin:6px 0 0;font:600 var(--fs-sm)/1.35 var(--f-body);opacity:.9;text-shadow:0 1px 2px #000}" +
      ".jmh-foot{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:10px 12px max(12px,env(safe-area-inset-bottom));pointer-events:none}" +
      ".jmh-assist{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;pointer-events:auto}" +
      ".jmh-chip{min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(6,12,14,.6);color:#fff;font:700 var(--fs-xs)/1 var(--f-body)}.jmh-chip.shot{border-color:#ffd23f;color:#ffd23f}.jmh-chip:disabled{opacity:.35}" +
      ".jmh-res[hidden]{display:none}.jmh-res{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;justify-content:center;padding:16px 16px max(18px,env(safe-area-inset-bottom));background:linear-gradient(rgba(0,0,0,0) 40%,rgba(0,0,0,.65))}" +
      ".jmh-card{width:100%;max-width:440px;padding:18px;border-radius:20px;background:rgba(12,22,18,.94);border:2px solid rgba(255,210,63,.55);text-align:center;animation:jmhUp .35s cubic-bezier(.2,1.3,.4,1)}" +
      ".jmh-card.try{border-color:rgba(255,255,255,.25)}.jmh-card b{display:block;font:800 var(--fs-xl)/1.1 var(--f-disp);text-transform:uppercase}.jmh-card p{margin:8px 0 14px;opacity:.85}" +
      ".jmh-stars{margin-top:12px;display:flex;justify-content:center;gap:10px}.jmh-star{width:42px;height:40px;background:rgba(255,255,255,.16);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}.jmh-star.on{background:#ffd23f}" +
      ".jmh-btns{display:grid;gap:8px}.jmh-btns button{min-height:46px}" +
      "@keyframes jmhUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}";
    (document.head || document.documentElement).appendChild(hcss);
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
