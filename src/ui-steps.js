/* ui-steps.js — versión 2.8 «Primeros pasos»:
   - primera temporada guiada, un paso cada vez, en la pestaña de inicio;
   - logros e insignias (pantalla en «Más» y aviso al desbloquear);
   - accesibilidad: tamaño de letra y colores para daltonismo (se guardan en el dispositivo). */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;

  /* ---------- accesibilidad ---------- */
  var A11Y_KEY = "camino.a11y";
  function a11yGet() { try { var o = JSON.parse(localStorage.getItem(A11Y_KEY) || "{}"); return {fs: +o.fs || 0, cb: o.cb ? 1 : 0}; } catch (e) { return {fs: 0, cb: 0}; } }
  function a11ySet(o) { try { localStorage.setItem(A11Y_KEY, JSON.stringify(o)); } catch (e) {} a11yApply(o); }
  function a11yApply(o) {
    var el = document.documentElement; if (!el) return;
    el.classList.remove("fs1", "fs2", "cb");
    if (o.fs === 1) el.classList.add("fs1"); else if (o.fs === 2) el.classList.add("fs2");
    if (o.cb) el.classList.add("cb");
  }
  a11yApply(a11yGet());
  window.camA11y = {get: a11yGet, set: a11ySet};

  function a11yBlock() {
    var o = a11yGet();
    return '<div><label class="lbl">' + tr("Tamaño del texto") + '</label><div class="seg">' + [[N_("Normal"), 0], [N_("Grande"), 1], [N_("Muy grande"), 2]].map(function (x) {
      return '<button data-a="a11yfs" data-v="' + x[1] + '" aria-pressed="' + (o.fs === x[1]) + '">' + h(tr(x[0])) + "</button>";
    }).join("") + '</div></div><div><label class="lbl">' + tr("Colores") + '</label><div class="seg">' +
      '<button data-a="a11ycb" data-v="0" aria-pressed="' + !o.cb + '">' + tr("Estándar") + '</button><button data-a="a11ycb" data-v="1" aria-pressed="' + !!o.cb + '">' + tr("Daltonismo") + "</button></div>" +
      '<p class="muted" style="font-size:13px;margin:6px 0 0">' + (o.cb ? tr("Lo bueno se ve en azul y lo malo en naranja, en lugar de verde y rojo.") : tr("Verde para lo bueno y rojo para lo malo.")) + "</p></div>";
  }
  U.add("menu", function () { return '<details class="fold a11y"><summary>' + tr("Accesibilidad") + "</summary>" + '<div class="stack">' + a11yBlock() + "</div></details>"; });
  U.sheets.a11y = function () { return "<h2>" + tr("Accesibilidad") + '</h2><div class="stack">' + a11yBlock() + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>"; };
  U.actions.a11y = function () { U.open("a11y"); };
  U.actions.a11yfs = function (b, v) { var o = a11yGet(); o.fs = +v; a11ySet(o); U.renderSheet(); keepA11yOpen(); };
  U.actions.a11ycb = function (b, v) { var o = a11yGet(); o.cb = +v ? 1 : 0; a11ySet(o); U.renderSheet(); U.render(false); keepA11yOpen(); };
  function keepA11yOpen() { var d = document.querySelector("details.a11y"); if (d) d.open = true; }

  /* ---------- logros ---------- */
  function achRow(a) {
    var y = S.ach && S.ach[a[0]], on = y != null, sec = a[5] && !on;
    return '<li class="achi' + (on ? " on" : "") + '"><span class="achic" aria-hidden="true">' + (on ? a[1] : sec ? "❔" : "🔒") + '</span><span class="grow"><b>' + h(sec ? tr("Logro secreto") : tr(a[2])) + "</b><small>" + h(sec ? tr("Ya lo descubrirás… o no.") : tr(a[3])) + "</small></span>" +
      (on ? '<span class="achy">' + h(seasonLabel(y)) + "</span>" : "") + "</li>";
  }
  U.sheets.ach = function () {
    achCheck();
    var c = achCount(), l = achList(), done = l.filter(function (a) { return S.ach[a[0]] != null; }), todo = l.filter(function (a) { return S.ach[a[0]] == null; });
    return "<h2>" + tr("Logros") + '</h2><div class="stack"><div><div class="lbl">' + tr("{n} de {m} conseguidos", {n: c[0], m: c[1]}) + '</div><div class="bar"><i class="hi" style="width:' + Math.round(c[0] / c[1] * 100) + '%"></i></div></div>' +
      '<ul class="achl">' + done.concat(todo).map(achRow).join("") + "</ul>" +
      '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.ach = function () { U.open("ach"); };
  /* aviso al desbloquear: se comprueba después de cada pintado */
  U.add("after", function () {
    if (!S || UIX.ui().view !== "game") return;
    var nw = achCheck();
    if (S.achN0 != null) { var n0 = S.achN0; delete S.achN0; if (n0) setTimeout(function () { U.toast(trn(n0, "Ya tienes {n} logro: míralo en «Más».", "Ya tienes {n} logros: míralos en «Más».")); }, 400); U.persist(); return; }
    if (!nw.length) return;
    U.persist();
    nw.forEach(function (a, i) { U.toast(a[1] + " " + tr("Logro: {n}", {n: tr(a[2])})); if (i === 0) U.edgeFlash(true); });
  });

  /* ---------- primera temporada guiada ---------- */
  function seen(k) { return !!(S.tut && S.tut.seen && S.tut.seen[k]); }
  function played() {
    if (S.bi > 0) return true;
    if (S.mode === "mgr") { var ss = S.m.ss || {}; return (ss.w || 0) + (ss.d || 0) + (ss.l || 0) > 0; }
    return !!(S.p.ss && S.p.ss.apps > 0) || S.feed.some(function (c) { return c.t === "block"; });
  }
  function steps() {
    var mgr = S.mode === "mgr";
    if (mgr) return [
      typeof presOn === "function" && presOn() ? {ok: !!S.m.pres.coach, t: tr("Elige a tu entrenador"), b: tr("Eres el presidente: el entrenador dirige los partidos. Elige uno que encaje con tu presupuesto."), act: "presopen", gl: tr("Elegir entrenador")} :
      {ok: seen("plantilla"), t: tr("Conoce a tu equipo"), b: tr("Abre «Equipo»: ahí eliges el once, la formación y la táctica. Si no sabes qué tocar, déjalo como está."), go: "plantilla", gl: tr("Ir a Equipo")},
      {ok: played(), t: tr("Juega tus primeros partidos"), b: tr("Pulsa el botón grande de abajo. El juego avanza unas semanas y se para cuando hay algo que decidir.")},
      {ok: seen("mercado"), t: tr("Echa un vistazo al mercado"), b: tr("En «Mercado» verás jugadores que encajan en tu plantilla y lo que cuestan."), go: "mercado", gl: tr("Ir a Mercado")},
      {ok: seen("comp"), t: tr("Mira la clasificación"), b: tr("En «Más» → «Competición» ves cómo vas y quién viene después."), go: "comp", gl: tr("Ver clasificación")},
      {ok: seen("guide"), t: tr("Ten la guía a mano"), b: tr("Si algo no se entiende, la «Guía del juego» lo explica en pocas líneas."), act: "guide", gl: tr("Abrir la guía")},
      {ok: S.bi >= 4 || S.m.seasons.length > 0, t: tr("Llega al final de la temporada"), b: tr("Sigue avanzando. La directiva te juzgará por los objetivos que ves en «Inicio»."), prog: true}
    ];
    return [
      {ok: seen("jugador"), t: tr("Conoce a tu futbolista"), b: tr("Abre «Yo»: ahí ves tu nivel, tus atributos, tu forma y tu moral."), go: "jugador", gl: tr("Ir a Yo")},
      {ok: played(), t: tr("Juega tu primer tramo"), b: tr("Pulsa el botón grande de abajo. La temporada avanza unas semanas y se para cuando hay algo que decidir.")},
      {ok: seen("comp"), t: tr("Mira la clasificación"), b: tr("En «Liga» ves cómo va tu equipo y tus números de la temporada."), go: "comp", gl: tr("Ir a Liga")},
      {ok: seen("guide"), t: tr("Ten la guía a mano"), b: tr("Si algo no se entiende, la «Guía del juego» lo explica en pocas líneas."), act: "guide", gl: tr("Abrir la guía")},
      {ok: S.bi >= 4 || S.p.seasons.length > 0, t: tr("Llega al final de la temporada"), b: tr("Sigue avanzando. Cumple los objetivos del míster para ganar minutos y subir tu moral."), prog: true}
    ];
  }
  function tutOn() {
    if (!S || S.ph === "ret" || (S.tut && S.tut.off)) return false;
    var rows = S.mode === "mgr" ? (S.m && S.m.seasons) : (S.p && S.p.seasons);
    return !!rows && rows.length === 0;
  }
  function coach() {
    if (!tutOn()) return "";
    var st = steps(), i = 0;
    while (i < st.length && st[i].ok) i++;
    if (i >= st.length) return "";
    var s = st[i], btn = s.go ? '<button class="btn sm" data-a="tab" data-t="' + s.go + '">' + h(s.gl) + "</button>" : s.act ? '<button class="btn sm" data-a="' + s.act + '">' + h(s.gl) + "</button>" : "";
    var prog = s.prog ? '<div class="bar tutbar"><i class="hi" style="width:' + Math.round(Math.min(S.bi, 4) / 4 * 100) + '%"></i></div>' : "";
    return '<section class="card tut" aria-live="polite"><div class="tuthd"><span class="eyebrow">' + tr("Primeros pasos · {i} de {n}", {i: i + 1, n: st.length}) + '</span><button class="tutx" data-a="tutoff" aria-label="' + h(tr("Saltar la guía")) + '">' + tr("Saltar") + "</button></div>" +
      '<ol class="tutdots" aria-hidden="true">' + st.map(function (x, k) { return '<li class="' + (k < i ? "done" : k === i ? "now" : "") + '"></li>'; }).join("") + "</ol>" +
      "<b>" + h(s.t) + '</b><p>' + h(s.b) + "</p>" + prog + btn + "</section>";
  }
  U.add("carreraTop", function () { return S && S.mode !== "mgr" ? coach() : ""; });
  U.add("clubTop", function () { return S && S.mode === "mgr" ? coach() : ""; });
  /* recuerda qué pestañas ya se han visto mientras dura la guía */
  U.add("after", function () {
    if (!tutOn() || UIX.ui().view !== "game") return;
    var t = UIX.ui().tab; S.tut = S.tut || {seen: {}}; S.tut.seen = S.tut.seen || {};
    if (t && !S.tut.seen[t]) { S.tut.seen[t] = 1; U.persist(); }
  });
  U.actions.tutoff = function () { S.tut = S.tut || {seen: {}}; S.tut.off = 1; U.persist(); U.render(false); U.toast(tr("Guía cerrada. La tienes siempre en «Más» → «Guía del juego».")); };
  var _guide = U.actions.guide;
  if (_guide) U.actions.guide = function () { if (S && tutOn()) { S.tut = S.tut || {seen: {}}; S.tut.seen = S.tut.seen || {}; S.tut.seen.guide = 1; U.persist(); } return _guide.apply(this, arguments); };
})();
