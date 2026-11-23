/* ui-jugada-maestra.js — interfaz accesible del modo autónomo Jugada Maestra. */
(function () {
  if (typeof UIX === "undefined" || typeof JugadaMaestra === "undefined") return;
  var U = UIX, KEY = "camino.jugada-maestra.v1", active = null, drawing = null;
  function h(x) { return U.h(x); }
  function progress() {
    var p;
    try { p = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { p = null; }
    if (!p || p.v !== 1 || !p.done) p = {v: 1, done: {}, medals: {}};
    p.medals = p.medals || {}; p.best = p.best || {};
    if (!p.stars) { p.stars = {}; Object.keys(p.medals).forEach(function (id) { var m = p.medals[id] || 0; p.stars[id] = (m >= 1 ? 1 : 0) | (m >= 3 ? 2 : 0); }); }
    return p;
  }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function unlocked(id, p) { if (/^dia-/.test(id)) return true; var lv = JugadaMaestra.levels(), at = lv.findIndex(function (x) { return x.id === id; }); return at <= 0 || !!p.done[lv[at - 1].id]; }
  function nStars(b) { b = b | 0; return (b & 1) + (b >> 1 & 1) + (b >> 2 & 1); }
  function totalStars(p) { return JugadaMaestra.levels().reduce(function (v, l) { return v + nStars(p.stars[l.id]); }, 0); }
  function medal(n) { return n >= 3 ? "🥇" : n === 2 ? "🥈" : n === 1 ? "🥉" : ""; }
  function dayNum() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
  function dailyNow(p) { var n = Object.keys(p.done).filter(function (k) { return /^jm-/.test(k); }).length; return JugadaMaestra.dailyId(dayNum(), Math.max(3, Math.min(30, n + 1))); }
  U.add("mainhome", function () {
    var p = progress(), n = Object.keys(p.done).filter(function (k) { return /^jm-/.test(k); }).length;
    return '<button class="card jm-home" data-a="jmopen"><span class="jm-home-ic" aria-hidden="true">⚽</span><span class="grow"><b>' + h(tr("Jugada Maestra")) + '</b><small>' + h(tr("Dibuja pases y tiros, y resuelve la jugada.")) + '</small></span><span class="jm-progress">' + n + '/30<small> · ★ ' + totalStars(p) + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
  });
  U.actions.jmopen = function () { active = null; if (heroOn()) { if (U.closeSheet) U.closeSheet(); mapOpen(); return; } U.open("jugadamaestra"); };
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
      var p = progress(), id = active.id, res = JugadaMaestra.result(active), old = p.stars[id] | 0;
      active.bits = res.bits; active.newBits = res.bits & ~old; active.record = !!active.newBits && old > 0;
      p.stars[id] = old | res.bits; p.medals[id] = nStars(p.stars[id]);
      p.best[id] = Math.min(p.best[id] || 99, active.turn);
      if (/^jm-/.test(id)) p.done[id] = true;
      if (active.daily) { var dn = dayNum(); if (!p.daily || p.daily.last !== dn) { var st = p.daily && p.daily.last === dn - 1 ? (p.daily.streak || 0) + 1 : 1; p.daily = {last: dn, streak: st, best: Math.max(st, p.daily && p.daily.best || 0)}; active.streak = st; } }
      save(p);
    }
    if (U.persist) U.persist();
  }
  function apply(r) {
    if (!r || !r.ok) { if (r && r.msg) active.lastMsg = r.msg; U.renderSheet(); return; }
    record(r); U.renderSheet();
  }

  /* ---------- vista 3D a pantalla completa (si el dispositivo tiene WebGL) ---------- */
  var hero = null, map = null;
  function heroOn() { return typeof JMHero !== "undefined" && !!JMHero && JMHero.ok() && typeof document !== "undefined"; }
  function stars(n, of) { var o = ""; for (var i = 0; i < (of || 3); i++) o += '<span class="jmh-star' + (i < n ? " on" : "") + '"></span>'; return o; }
  function sfx(k, v) { try { if (typeof SpModes !== "undefined" && SpModes && SpModes.AU) SpModes.AU.fx(k, v); } catch (e) {} }
  function hapt(k) { try { Anim.haptic(k); } catch (e) {} }
  function lvInfo(id) {
    var l = JugadaMaestra.level(id), lv = JugadaMaestra.levels(), at = lv.findIndex(function (x) { return x.id === (l && l.daily ? l.base : id); });
    return {l: l, at: at, par: JugadaMaestra.par(id), bonus: JugadaMaestra.bonusOf(id), daily: !!(l && l.daily)};
  }
  /* los tres objetivos de estrella, visibles antes de jugar */
  function objectives(id, bits, have) {
    var I0 = lvInfo(id), list = [tr("Marca gol"), tr("Hazlo en {n} acciones o menos", {n: I0.par}), I0.bonus ? tr(I0.bonus.label) : ""];
    return '<ul class="jmh-obj">' + list.map(function (t, i) {
      var got = bits != null ? !!(bits & (1 << i)) : false, old = !!((have | 0) & (1 << i));
      return '<li class="' + (got ? "got" : old ? "old" : "") + '"><span class="jmh-star mini' + (got || old ? " on" : "") + '"></span><span>' + h(t) + "</span></li>";
    }).join("") + "</ul>";
  }
  function heroHud() {
    if (!hero || !active) return;
    var I0 = lvInfo(active.id), l = I0.l, p = progress();
    var left = Math.max(0, active.max - active.turn), dots = "";
    for (var i = 0; i < active.max; i++) dots += '<span class="jmh-dot' + (i < left ? " on" : "") + '"></span>';
    var kick = I0.daily ? tr("Jugada del día") : tr("Jugada {n} de 30", {n: I0.at + 1}) + " · " + tr("Capítulo {n}: {title}", {n: l.chapter, title: tr(l.chapterTitle)});
    hero.ov.querySelector(".jmh-hud").innerHTML = '<div class="jmh-row"><button class="jmh-back" data-jmh="list" aria-label="' + h(tr("Volver a retos")) + '">‹</button>' +
      '<div class="grow"><small>' + h(kick) + "</small><b>" + h(tr(l.title)) + "</b></div>" +
      '<div class="jmh-moves" aria-label="' + h(tr("Acciones: {n}/{max}", {n: active.turn, max: active.max})) + '">' + dots + "</div></div>" +
      '<div class="jmh-row2"><p class="jmh-goal">' + h(tr(l.goal)) + '</p><button class="jmh-ic" data-jmh="hint" aria-label="' + h(tr("Pista")) + '"' + (active.done ? " disabled" : "") + '>💡</button><button class="jmh-ic" data-jmh="restart" aria-label="' + h(tr("Reiniciar")) + '">↺</button></div>' +
      '<div class="jmh-objs">' + objectives(active.id, null, p.stars[active.id]) + "</div>";
    var foot = hero.ov.querySelector(".jmh-foot");
    var openA = !!(hero && hero.assist);
    foot.innerHTML = active.done ? "" : '<div class="jmh-assist">' + (openA ? active.mates.map(function (m, i) {
      return '<button class="jmh-chip" data-jmh="pass" data-v="' + i + '"' + (m.open ? "" : " disabled") + ">" + h(tr("Pase {n}", {n: i + 1})) + "</button>"; }).join("") +
      '<button class="jmh-chip shot" data-jmh="shot">' + h(tr("Tirar a puerta")) + "</button>" : "") +
      '<button class="jmh-chip ghost" data-jmh="assist" aria-expanded="' + openA + '">' + h(openA ? tr("Ocultar") : tr("O elige un pase asistido")) + "</button></div>";
    var res = hero.ov.querySelector(".jmh-res");
    if (!active.done) { res.hidden = true; return; }
    if (!res.hidden) return;
    var won = !!active.won, bits = won ? active.bits | 0 : 0, nx = !I0.daily && JugadaMaestra.levels()[I0.at + 1], canNext = won && nx;
    var chapterDone = won && !I0.daily && I0.at % 6 === 5 && active.newBits & 1;
    var canRew = !won && hero.hist.length && hero.rewinds > 0;
    res.hidden = false;
    res.innerHTML = '<div class="jmh-card ' + (won ? "good" : "try") + '"><b>' + h(won ? tr("¡Jugada completada!") : tr("La defensa gana esta vez")) + "</b>" +
      (won ? '<div class="jmh-stars" aria-label="' + h(tr("Estrellas: {n} de 3", {n: nStars(bits)})) + '">' + [0, 1, 2].map(function (i) { return '<span class="jmh-star' + (bits & (1 << i) ? " on" : "") + '"></span>'; }).join("") + "</div>" : "") +
      (active.record ? '<span class="jmh-rec">' + h(tr("¡Nuevo récord!")) + "</span>" : "") +
      (chapterDone ? '<span class="jmh-rec ch">' + h(tr("¡Capítulo completado!")) + "</span>" : "") +
      (active.streak ? '<span class="jmh-rec">' + h(tr("Racha diaria: {n}", {n: active.streak})) + "</span>" : "") +
      (won ? objectives(active.id, bits, progress().stars[active.id]) : "<p>" + h(tr(active.lastMsg || "Puedes intentarlo otra vez sin coste ni penalización.")) + "</p>") +
      '<div class="jmh-btns">' + (canNext ? '<button class="go" data-jmh="next">' + h(tr("Siguiente jugada")) + "</button>" : "") +
      (canRew ? '<button class="go" data-jmh="rewind">' + h(tr("Rebobinar la última acción")) + "</button>" : "") +
      '<button class="' + (canNext || canRew ? "btn" : "go") + '" data-jmh="retry">' + h(tr("Volver a intentarlo")) + "</button>" +
      '<div class="jmh-btn2">' + (hero.view.canReplay() ? '<button class="btn" data-jmh="replay">▶ ' + h(tr("Repetición")) + "</button>" : "") + '<button class="btn" data-jmh="list">' + h(tr("Retos")) + "</button></div></div></div>";
    var on = res.querySelectorAll(".jmh-stars .jmh-star.on");
    Array.prototype.forEach.call(on, function (el, i) {
      el.style.animationDelay = (0.35 + i * 0.3) + "s"; el.classList.add("pop");
      setTimeout(function () { sfx("post", 0.6 + i * 0.25); hapt(i === on.length - 1 ? "big" : "ok"); }, 350 + i * 300);
    });
    if (!won) { var card = res.querySelector(".jmh-card"); if (card) card.classList.add("shake"); }
    setTimeout(function () { var b = res.querySelector(".go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 80);
  }
  function heroClose() { if (!hero) return; try { hero.view.dispose(); } catch (e) {} try { hero.ov.remove(); } catch (e) {} hero = null; }
  function heroOpen() {
    heroClose(); mapClose();
    var ov = document.createElement("div");
    ov.className = "jmh-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", tr("Jugada Maestra"));
    ov.innerHTML = '<div class="jmh-stage"></div><div class="jmh-hud"></div><div class="jmh-foot"></div><div class="jmh-res" hidden></div>';
    document.body.appendChild(ov);
    var I0 = lvInfo(active.id), l = I0.l;
    hero = {ov: ov, hist: [], rewinds: 1};
    var view = JMHero.mount(ov.querySelector(".jmh-stage"), {
      get: function () { return active; },
      resolve: function (x, y, path, hh) {
        var snap = {st: JSON.parse(JSON.stringify(active)), sv: hero.view ? hero.view.snap() : null};
        var r = JugadaMaestra.resolve(active, x, y, path, hh); if (r && r.ok) hero.hist.push(snap); return r;
      },
      after: function (r) { record(r); heroHud(); },
      mine: true, press: Math.min(0.9, 0.2 + (l ? l.chapter : 1) * 0.14),
      intro: {kicker: I0.daily ? tr("Jugada del día") : tr("Jugada {n} de 30", {n: I0.at + 1}), title: h(tr(l.title))},
      ghost: !I0.daily && I0.at < 3 && !progress().done[active.id]
    });
    if (!view) { ov.remove(); hero = null; U.open("jugadamaestra"); U.renderSheet(); return; }
    hero.view = view;
    heroHud();
    view.say(tr("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar."), 4200);
  }
  function heroRetry() {
    if (!hero || hero.view.busy0()) return;
    active = JugadaMaestra.fresh(active.id, hashSeed(active.id, Date.now())); if (JugadaMaestra.level(active.id).daily) active.daily = true;
    hero.hist = []; hero.rewinds = 1; hero.ov.querySelector(".jmh-res").hidden = true; hero.view.restart(); heroHud();
  }
  /* ---------- mapa de retos: capítulos, estrellas y jugada del día ---------- */
  function mapClose() { if (map) { try { map.remove(); } catch (e) {} map = null; } }
  function mapHtml() {
    var p = progress(), lv = JugadaMaestra.levels(), tot = totalStars(p), did = dailyNow(p), dl = JugadaMaestra.level(did), dDone = p.daily && p.daily.last === dayNum();
    var o = '<div class="jmm-head"><button class="jmh-back" data-jmp="close" aria-label="' + h(tr("Cerrar")) + '">‹</button><div class="grow"><small>' + h(tr("Dibuja pases y tiros, y resuelve la jugada.")) + "</small><b>" + h(tr("Jugada Maestra")) + '</b></div><span class="jmm-tot"><span class="jmh-star mini on"></span>' + tot + "/90</span></div>";
    o += '<div class="jmm-scroll">';
    o += '<button class="jmm-daily' + (dDone ? " done" : "") + '" data-jmp="daily"><span class="jmm-cal" aria-hidden="true">' + (dDone ? "✓" : "★") + '</span><span class="grow"><b>' + h(tr("Jugada del día")) + "</b><small>" + h(dDone ? tr("Hecha hoy. Vuelve mañana para otra.") : tr("Una jugada en espejo cada día. ¡Mantén la racha!")) + "</small></span>" + (p.daily && p.daily.streak ? '<span class="jmm-streak">🔥 ' + p.daily.streak + "</span>" : "") + "</button>";
    for (var c = 0; c < 5; c++) {
      var ls = lv.slice(c * 6, c * 6 + 6), cs = ls.reduce(function (v, l) { return v + nStars(p.stars[l.id]); }, 0), openC = unlocked(ls[0].id, p);
      o += '<section class="jmm-ch c' + (c + 1) + (openC ? "" : " locked") + '"><div class="jmm-ban"><span class="jmm-n">' + (c + 1) + '</span><span class="grow"><small>' + h(tr("Capítulo {n}", {n: c + 1})) + "</small><b>" + h(tr(ls[0].chapterTitle)) + '</b></span><span class="jmm-cs"><span class="jmh-star mini on"></span>' + cs + "/18</span></div><div class=\"jmm-grid\">";
      ls.forEach(function (l, i) {
        var n = c * 6 + i + 1, un = unlocked(l.id, p), st = p.stars[l.id] | 0, cur = un && !p.done[l.id];
        o += '<button class="jmm-node' + (un ? "" : " lock") + (cur ? " cur" : "") + (p.done[l.id] ? " done" : "") + '" data-jmp="lv" data-v="' + l.id + '"' + (un ? "" : " disabled") + ' aria-label="' + h(tr("Jugada {n} de 30", {n: n}) + ": " + tr(l.title)) + '"><span class="jmm-num">' + (un ? n : "🔒") + '</span><span class="jmm-ttl">' + h(tr(l.title)) + '</span><span class="jmm-st">' + [0, 1, 2].map(function (k) { return '<span class="jmh-star mini' + (st & (1 << k) ? " on" : "") + '"></span>'; }).join("") + "</span></button>";
      });
      o += "</div></section>";
    }
    o += '<p class="jmm-foot">' + h(tr("Retos independientes: no cambian el resultado ni las estadísticas de tus carreras.")) + "</p></div>";
    o += '<div class="jmm-det" hidden></div>';
    return o;
  }
  function mapOpen(focusId) {
    heroClose(); mapClose();
    map = document.createElement("div"); map.className = "jmh-ov jmm"; map.setAttribute("role", "dialog"); map.setAttribute("aria-modal", "true"); map.setAttribute("aria-label", tr("Jugada Maestra"));
    map.innerHTML = mapHtml(); document.body.appendChild(map);
    var p = progress(), lv = JugadaMaestra.levels(), cur = focusId || (lv.filter(function (l) { return unlocked(l.id, p) && !p.done[l.id]; })[0] || lv[lv.length - 1]).id;
    var el = map.querySelector('[data-v="' + cur + '"]'); if (el) setTimeout(function () { try { el.scrollIntoView({block: "center"}); } catch (e) {} }, 30);
  }
  function mapDetail(id) {
    if (!map) return;
    var I0 = lvInfo(id), l = I0.l, p = progress(), d = map.querySelector(".jmm-det"), best = p.best[id];
    d.hidden = false;
    d.innerHTML = '<div class="jmh-card"><small class="jmm-k">' + h(I0.daily ? tr("Jugada del día") : tr("Jugada {n} de 30", {n: I0.at + 1})) + "</small><b>" + h(tr(l.title)) + "</b><p>" + h(tr(l.goal)) + "</p>" + objectives(id, null, p.stars[id]) +
      '<p class="jmm-meta">' + h(tr("Acciones: {n}/{max}", {n: 0, max: l.max})) + (best ? " · " + h(tr("Tu mejor: {n} acciones", {n: best})) : "") + "</p>" +
      '<div class="jmh-btns"><button class="go" data-jmp="play" data-v="' + id + '">' + h(tr("¡A jugar!")) + '</button><button class="btn" data-jmp="det-close">' + h(tr("Cerrar")) + "</button></div></div>";
    sfx("bounce", 0.2); hapt("tap");
    setTimeout(function () { var b = d.querySelector(".go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 40);
  }
  function startLevel(id) {
    active = JugadaMaestra.fresh(id, hashSeed(id, Date.now())); if (!active) return;
    if (JugadaMaestra.level(id).daily) active.daily = true;
    heroOpen();
  }
  /* ---------- Jugada Maestra dentro de un momento de la carrera (como los penaltis y las faltas) ---------- */
  var mini = null;
  function miniHud() {
    if (!mini) return;
    var st = mini.st, left = Math.max(0, st.max - st.turn), dots = "";
    for (var i = 0; i < st.max; i++) dots += '<span class="jmh-dot' + (i < left ? " on" : "") + '"></span>';
    mini.ov.querySelector(".jmh-hud").innerHTML = '<div class="jmh-row"><div class="grow"><small>' + h(tr("Momento clave")) + (mini.o.min ? " · " + h(mini.o.min) + "'" : "") + "</small><b>" + h(mini.o.title) + "</b></div>" +
      '<div class="jmh-moves" aria-label="' + h(tr("Acciones: {n}/{max}", {n: st.turn, max: st.max})) + '">' + dots + "</div></div>" +
      '<p class="jmh-goal">' + h(tr("Dibuja la jugada: pasa y remata antes de que cierre la defensa.")) + "</p>";
    var foot = mini.ov.querySelector(".jmh-foot"), openA = !!mini.assist;
    foot.innerHTML = st.done ? "" : '<div class="jmh-assist">' + (openA ? st.mates.map(function (m, i) {
      return '<button class="jmh-chip" data-jmm="pass" data-v="' + i + '"' + (m.open ? "" : " disabled") + ">" + h(tr("Pase {n}", {n: i + 1})) + "</button>"; }).join("") +
      '<button class="jmh-chip shot" data-jmm="shot">' + h(tr("Tirar a puerta")) + "</button>" : "") +
      '<button class="jmh-chip ghost" data-jmm="assist" aria-expanded="' + openA + '">' + h(openA ? tr("Ocultar") : tr("O elige un pase asistido")) + "</button></div>";
    var res = mini.ov.querySelector(".jmh-res");
    if (!st.done || !res.hidden) return;
    var last = st.log[st.log.length - 1] || {};
    res.hidden = false;
    res.innerHTML = '<div class="jmh-card ' + (st.won ? "good" : "try") + '"><b>' + h(st.won ? tr("¡GOL!") : tr("Ocasión perdida")) + "</b><p>" + h(tr(last.msg || "")) + "</p>" +
      '<div class="jmh-btns"><button class="go" data-jmm="done">' + h(tr("Continuar")) + "</button>" + (mini.view && mini.view.canReplay() ? '<button class="btn" data-jmm="replay">▶ ' + h(tr("Repetición")) + "</button>" : "") + "</div></div>";
    if (!st.won) { var card = res.querySelector(".jmh-card"); if (card) card.classList.add("shake"); }
    setTimeout(function () { var b = res.querySelector("[data-jmm=done]"); if (b) try { b.focus(); } catch (e) {} }, 60);
  }
  function miniClose() {
    if (!mini) return;
    var m = mini; mini = null;
    try { m.view.dispose(); } catch (e) {} try { m.ov.remove(); } catch (e) {}
    var passes = m.st.log.filter(function (l) { return l.k === "pass" && l.ok; }).length;
    if (m.cb) m.cb({scored: !!m.st.won, passes: passes});
  }
  U.jmMini = function (o, cb) {
    if (mini) return;
    var st = JugadaMaestra.moment(o.seed || 7, {xg: o.xg, id: "carrera"});
    var ov = document.createElement("div");
    ov.className = "jmh-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", o.title || tr("Jugada Maestra"));
    ov.innerHTML = '<div class="jmh-stage"></div><div class="jmh-hud"></div><div class="jmh-foot"></div><div class="jmh-res" hidden></div>';
    document.body.appendChild(ov);
    mini = {ov: ov, st: st, o: o, cb: cb};
    var view = JMHero.mount(ov.querySelector(".jmh-stage"), {
      get: function () { return mini ? mini.st : st; },
      resolve: function (x, y, path, hh) { return JugadaMaestra.resolve(st, x, y, path, hh); },
      after: function () { miniHud(); },
      mine: true, press: o.pressure == null ? 0.6 : o.pressure,
      intro: {kicker: tr("Momento clave") + (o.min ? " · " + o.min + "'" : ""), title: h(o.title || tr("Jugada Maestra"))}
    });
    if (!view) { ov.remove(); mini = null; var auto = JugadaMaestra.momentAuto(o.seed || 7, o.xg); if (cb) cb({scored: auto === "goal", passes: 0}); return; }
    mini.view = view;
    miniHud();
    view.say(tr("Desliza desde el balón: hacia un compañero para pasar o hacia la portería para tirar."), 3800);
  };
  U.jmMini.ok = function () { return heroOn(); };
  if (typeof document !== "undefined") {
    document.addEventListener("click", function (e) {
      if (!mini) return;
      var b = e.target.closest ? e.target.closest("[data-jmm]") : null;
      if (!b || !mini.ov.contains(b)) return;
      var k = b.getAttribute("data-jmm");
      if (k === "done") { miniClose(); return; }
      if (k === "replay") { var rs = mini.ov.querySelector(".jmh-res"); rs.style.display = "none"; mini.ov.classList.add("rp"); mini.view.replay(function () { rs.style.display = ""; if (mini) mini.ov.classList.remove("rp"); }); return; }
      if (k === "assist") { mini.assist = !mini.assist; miniHud(); return; }
      if (k === "pass") { mini.view.act("pass", b.getAttribute("data-v")); return; }
      if (k === "shot") mini.view.act("shot");
    });
    var prevBackM = window.caminoBack;
    window.caminoBack = function () { if (mini) { if (mini.view && mini.view.busy0()) return true; if (mini.st.done) miniClose(); return true; } return prevBackM ? prevBackM() : false; };
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", function (e) {
      if (map) {
        var q = e.target.closest ? e.target.closest("[data-jmp]") : null;
        if (q && map.contains(q)) {
          var kq = q.getAttribute("data-jmp"), vq = q.getAttribute("data-v");
          if (kq === "close") { mapClose(); return; }
          if (kq === "lv") { mapDetail(vq); return; }
          if (kq === "daily") { mapDetail(dailyNow(progress())); return; }
          if (kq === "det-close") { map.querySelector(".jmm-det").hidden = true; return; }
          if (kq === "play") { startLevel(vq); return; }
        }
        if (e.target === map.querySelector(".jmm-det")) map.querySelector(".jmm-det").hidden = true;
        return;
      }
      if (!hero) return;
      var b = e.target.closest ? e.target.closest("[data-jmh]") : null;
      if (!b || !hero.ov.contains(b)) return;
      var k = b.getAttribute("data-jmh"), v = b.getAttribute("data-v");
      if (k === "list") { var back = active && !active.daily ? active.id : null; heroClose(); active = null; mapOpen(back); return; }
      if (k === "retry" || k === "restart") { heroRetry(); return; }
      if (k === "next") { var I0 = lvInfo(active.id), nx = JugadaMaestra.levels()[I0.at + 1]; if (nx && unlocked(nx.id, progress())) startLevel(nx.id); return; }
      if (k === "rewind") { var hs = hero.hist.pop(); if (!hs || hero.view.busy0()) return; hero.rewinds--; active = hs.st; hero.ov.querySelector(".jmh-res").hidden = true; hero.view.restore(hs.sv || {holder: null, ex: []}); heroHud(); return; }
      if (k === "replay") { var rs = hero.ov.querySelector(".jmh-res"); rs.style.display = "none"; hero.ov.classList.add("rp"); hero.view.replay(function () { rs.style.display = ""; if (hero) hero.ov.classList.remove("rp"); }); return; }
      if (k === "hint") { if (hero.view.busy0() || active.done) return; var a = JugadaMaestra.hint(active); if (a) { hero.view.hint(a); hero.view.say(a.k === "shot" ? tr("Pista: sigue la línea azul y tira.") : tr("Pista: sigue la línea azul hasta tu compañero."), 3200); } else hero.view.say(tr("Desde aquí ya no hay gol: rebobina o reinicia."), 3200); return; }
      if (k === "assist") { hero.assist = !hero.assist; heroHud(); return; }
      if (k === "pass") { hero.view.act("pass", v); return; }
      if (k === "shot") { hero.view.act("shot"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; if (map) { var dd = map.querySelector(".jmm-det"); if (!dd.hidden) dd.hidden = true; else mapClose(); return; } if (hero) { heroClose(); active = null; mapOpen(); } });
    /* botón atrás de Android: cierra la jugada en vez de salir de la app */
    var prevBack = window.caminoBack;
    window.caminoBack = function () {
      if (hero) { if (hero.view.busy0()) return true; var back = active && !active.daily ? active.id : null; heroClose(); active = null; mapOpen(back); return true; }
      if (map) { var dd = map.querySelector(".jmm-det"); if (!dd.hidden) dd.hidden = true; else mapClose(); return true; }
      return prevBack ? prevBack() : false;
    };
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
      ".jmh-chip{min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(6,12,14,.6);color:#fff;font:700 var(--fs-xs)/1 var(--f-body)}.jmh-chip.shot{border-color:#ffd23f;color:#ffd23f}.jmh-chip.ghost{opacity:.7;border-style:dashed}.jmh-chip:disabled{opacity:.35}" +
      ".jmh-res[hidden]{display:none}.jmh-res{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;justify-content:center;padding:16px 16px max(18px,env(safe-area-inset-bottom));background:linear-gradient(rgba(0,0,0,0) 40%,rgba(0,0,0,.65))}" +
      ".jmh-card{width:100%;max-width:440px;padding:18px;border-radius:20px;background:rgba(12,22,18,.94);border:2px solid rgba(255,210,63,.55);text-align:center;animation:jmhUp .35s cubic-bezier(.2,1.3,.4,1)}" +
      ".jmh-card.try{border-color:rgba(255,255,255,.25)}.jmh-card b{display:block;font:800 var(--fs-xl)/1.1 var(--f-disp);text-transform:uppercase}.jmh-card p{margin:8px 0 14px;opacity:.85}" +
      ".jmh-stars{margin-top:12px;display:flex;justify-content:center;gap:10px}.jmh-star{width:42px;height:40px;background:rgba(255,255,255,.16);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}.jmh-star.on{background:#ffd23f}.jmh-star.pop{transform:scale(0);animation:jmhStar .45s cubic-bezier(.2,1.8,.4,1) forwards}@keyframes jmhStar{to{transform:scale(1)}}" +
      ".jmh-rec{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;background:#ffd23f;color:#111;font:800 var(--fs-xs)/1.3 var(--f-body);text-transform:uppercase;animation:jmhStar .4s 1.2s both}" +
      ".jmh-card.shake{animation:jmhUp .35s cubic-bezier(.2,1.3,.4,1),jmhShake .4s .35s}@keyframes jmhShake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}" +
      ".jmh-dot{transition:transform .25s,background .25s}.jmh-dot:not(.on){transform:scale(.7)}" +
      ".jmh-btns{display:grid;gap:8px}.jmh-btns button{min-height:46px}" +
      ".jmh-ov.rp .jmh-hud,.jmh-ov.rp .jmh-foot{opacity:0;pointer-events:none}.jmh-hud,.jmh-foot{transition:opacity .2s}" +
      ".jmh-row2{display:flex;align-items:center;gap:8px;margin-top:4px}.jmh-row2 .jmh-goal{flex:1;margin:0}" +
      ".jmh-ic{pointer-events:auto;width:38px;height:38px;flex:none;border-radius:12px;border:0;background:rgba(255,255,255,.14);color:#fff;font:800 18px/1 var(--f-body)}.jmh-ic:disabled{opacity:.35}" +
      ".jmh-objs .jmh-obj{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0 0}.jmh-objs li{font-size:11px;gap:5px;padding:3px 9px 3px 6px;border-radius:999px;background:rgba(0,0,0,.5);opacity:.85;text-shadow:none}.jmh-objs li.old{color:#ffd23f}.jmm-cal .jmh-star{width:24px;height:23px;background:#111}" +
      ".jmh-obj{list-style:none;padding:0;margin:10px 0 12px;display:grid;gap:6px;text-align:left}.jmh-obj li{display:flex;align-items:center;gap:8px;font:700 var(--fs-xs)/1.25 var(--f-body);opacity:.75;text-shadow:0 1px 2px #000}" +
      ".jmh-obj li.got,.jmh-obj li.old{opacity:1}.jmh-obj li.got{color:#ffd23f}.jmh-star.mini{width:15px;height:14px;flex:none;display:inline-block}.jmh-card .jmh-obj{max-width:300px;margin-left:auto;margin-right:auto}" +
      ".jmh-btn2{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px}.jmh-rec.ch{background:#5be37a}" +
      ".jmm{display:flex;flex-direction:column;background:radial-gradient(120% 60% at 50% 0,#17402c,#06120c 70%)}" +
      ".jmm-head{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 10px}.jmm-head .grow{flex:1;min-width:0;display:flex;flex-direction:column}.jmm-head small{font:700 var(--fs-xs)/1.2 var(--f-body);opacity:.7}.jmm-head b{font:800 var(--fs-xl)/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.02em}" +
      ".jmm-tot{display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;background:rgba(0,0,0,.4);font:800 var(--fs-sm)/1 var(--f-body);color:#ffd23f}" +
      ".jmm-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 14px max(20px,env(safe-area-inset-bottom))}" +
      ".jmm-daily{display:flex;align-items:center;gap:12px;width:100%;margin:2px 0 14px;padding:12px 14px;border-radius:18px;border:2px solid #ffd23f;background:linear-gradient(135deg,rgba(255,210,63,.22),rgba(255,210,63,.05));color:#fff;text-align:left}.jmm-daily.done{border-color:rgba(91,227,122,.7);background:rgba(91,227,122,.1)}" +
      ".jmm-daily .grow{flex:1;display:flex;flex-direction:column;gap:2px}.jmm-daily b{font:800 var(--fs-md)/1.1 var(--f-disp);text-transform:uppercase}.jmm-daily small{opacity:.8;font:600 var(--fs-xs)/1.3 var(--f-body)}" +
      ".jmm-cal{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#ffd23f;color:#111;font:900 22px/1 var(--f-body)}.jmm-daily.done .jmm-cal{background:#5be37a}.jmm-streak{font:800 var(--fs-sm)/1 var(--f-body)}" +
      ".jmm-ch{margin:0 0 16px;border-radius:20px;background:rgba(0,0,0,.28);overflow:hidden}.jmm-ch.locked{opacity:.55}" +
      ".jmm-ban{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(90deg,var(--jc,#1f9d55),transparent)}.jmm-ch.c2{--jc:#2a6fd7}.jmm-ch.c3{--jc:#9b4dd6}.jmm-ch.c4{--jc:#d6862a}.jmm-ch.c5{--jc:#d62828}" +
      ".jmm-n{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(0,0,0,.35);font:900 18px/1 var(--f-disp)}.jmm-ban .grow{flex:1;display:flex;flex-direction:column}.jmm-ban small{font:700 10px/1.2 var(--f-body);opacity:.8;text-transform:uppercase;letter-spacing:.08em}.jmm-ban b{font:800 var(--fs-md)/1.1 var(--f-disp);text-transform:uppercase}" +
      ".jmm-cs{display:flex;align-items:center;gap:5px;font:800 var(--fs-xs)/1 var(--f-body);color:#ffd23f}" +
      ".jmm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px}" +
      ".jmm-node{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:92px;padding:9px 4px 8px;border-radius:16px;border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff}" +
      ".jmm-node.done{border-color:rgba(255,210,63,.45);background:rgba(255,210,63,.08)}.jmm-node.cur{border-color:#5be37a;box-shadow:0 0 0 3px rgba(91,227,122,.25);animation:jmmCur 1.6s ease-in-out infinite}@keyframes jmmCur{50%{box-shadow:0 0 0 6px rgba(91,227,122,.1)}}" +
      ".jmm-node.lock{opacity:.45}.jmm-num{font:900 22px/1 var(--f-disp)}.jmm-ttl{font:700 10px/1.15 var(--f-body);opacity:.85;text-align:center;min-height:23px;display:flex;align-items:center}.jmm-st{display:flex;gap:2px}" +
      ".jmm-foot{opacity:.6;font:600 var(--fs-xs)/1.4 var(--f-body);text-align:center;margin:4px 8px 10px}" +
      ".jmm-det[hidden]{display:none}.jmm-det{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;justify-content:center;padding:16px 16px max(18px,env(safe-area-inset-bottom));background:rgba(0,0,0,.55)}" +
      ".jmm-k{display:inline-block;margin-bottom:6px;padding:3px 10px;border-radius:999px;background:#ffd23f;color:#111;font:800 11px/1.3 var(--f-body);text-transform:uppercase;letter-spacing:.06em}.jmm-meta{font:600 var(--fs-xs)/1.3 var(--f-body);opacity:.7;margin:0 0 12px!important}" +
      "@media (prefers-reduced-motion:reduce){.jmm-node.cur{animation:none}}" +
      "@keyframes jmhUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@media (prefers-reduced-motion:reduce){.jmh-star.pop{transform:none;animation:none}.jmh-card,.jmh-card.shake,.jmh-rec{animation:none}}";
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
