/* Pantallas de Momentos de leyenda y del Álbum de los 80 (sobre la capa del Modo Épocas). */
(function () {
  if (!ERAS_MODE || !window.UIX || typeof EraMoments === "undefined") return;
  var EM = EraMoments, layer = null, view = {s: "list", dec: "1980s", st: null, res: null, msg: ""};
  var DECADES = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  function t(s, v) { return eraText(s, v); }
  function esc(v) { return eraEscape(v); }
  function css() {
    if (window.UIX.eraTheme) window.UIX.eraTheme();
    if (document.getElementById("eras-mo-style")) return;
    var st = document.createElement("style"); st.id = "eras-mo-style";
    st.textContent = ".mo-tabs{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}.mo-tabs button{flex:1 1 auto;min-width:56px}.mo-tabs button.on{background:#dcbe6c;color:#151208}" +
      ".mo-card{border:1px solid rgba(220,190,108,.4);border-radius:10px;padding:10px;margin:8px 0;background:rgba(255,255,255,.03)}.mo-card h4{margin:0 0 4px;font-size:15px}.mo-card small{display:block;opacity:.85}" +
      ".mo-stars{color:#f6c83a;letter-spacing:2px;font-size:14px}.mo-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.mo-board{display:flex;justify-content:space-between;align-items:center;gap:8px;font:800 18px/1.2 system-ui,sans-serif;padding:10px;border-radius:10px;background:#0b1512;border:1px solid rgba(220,190,108,.5)}" +
      ".mo-board b{font-size:26px;color:#f6c83a}.mo-board span{flex:1;min-width:0;overflow-wrap:anywhere}.mo-board span:last-child{text-align:right}.mo-log{list-style:none;padding:0;margin:8px 0;font-size:13px}.mo-log li{padding:3px 0;border-bottom:1px dashed rgba(220,190,108,.2)}" +
      ".mo-obj{list-style:none;padding:0;margin:6px 0}.mo-obj li{padding:2px 0}.mo-ok{color:#8fe08a}.mo-ko{color:#ff8c7a}.mo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin:8px 0}" +
      ".mo-c{border-radius:8px;padding:8px 6px;min-height:64px;font-size:12px;font-weight:700;display:flex;flex-direction:column;justify-content:space-between;background:#1d2a24;border:2px solid #dcbe6c;color:#f3e8c8}.mo-c.miss{background:transparent;border-style:dashed;opacity:.55}.mo-c em{font-style:normal;font-size:11px;color:#f6c83a}";
    document.head.appendChild(st);
  }
  function stars(n, max) { var s = ""; for (var i = 0; i < max; i++) s += i < n ? "★" : "☆"; return '<span class="mo-stars" aria-label="' + esc(t("{n} de {m} estrellas", {n: n, m: max})) + '">' + s + "</span>"; }
  function mount() {
    css();
    layer = document.getElementById("era-overlay");
    if (!layer) { layer = document.createElement("div"); layer.id = "era-overlay"; layer.className = "eras-overlay"; document.body.appendChild(layer); }
    render();
  }
  function close() { if (layer) layer.remove(); layer = null; view.st = null; if (window.UIX.render) window.UIX.render(true); }
  function frame(title, body, actions) {
    layer.setAttribute("data-era-decade", view.dec);
    layer.innerHTML = '<section class="eras-dialog" data-era-decade="' + esc(view.dec) + '" role="dialog" aria-modal="true" aria-labelledby="mo-title"><div class="eras-kicker">' + t("Modo Épocas") + '</div><h2 id="mo-title">' + title + "</h2>" + body +
      '<div class="eras-actions">' + (actions || "") + '<button type="button" data-mo-act="close">' + t("Volver") + "</button></div></section>";
  }
  function titles() {
    var m = EraMeta.get(), out = [];
    if (m.titles.album) out.push(EM.loc(EM.album.complete.title));
    if (m.titles.all) out.push(EM.loc((ERAS_DATA.moments.titles || {}).all));
    return out.filter(Boolean).length ? '<p class="eras-lead">' + t("Títulos: {t}", {t: esc(out.filter(Boolean).join(" · "))}) + "</p>" : "";
  }
  function listView() {
    var meta = EraMeta.get();
    var tabs = '<div class="mo-tabs" role="tablist">' + DECADES.map(function (d) { return '<button type="button" role="tab" aria-selected="' + (d === view.dec) + '" class="' + (d === view.dec ? "on" : "") + '" data-mo-act="dec" data-mo-v="' + d + '">' + esc(d.slice(0, 4)) + "</button>"; }).join("") + "</div>";
    var cards = EM.list.filter(function (m) { return m.decade === view.dec; }).map(function (m) {
      var r = meta.mom[m.id] || {}, max = 1 + (m.secondary || []).length;
      return '<div class="mo-card"><h4>' + esc(m.year) + " · " + esc(EM.teamName(m.teams[0])) + " – " + esc(EM.teamName(m.teams[1])) + "</h4><small>" + esc(EM.loc(m.setup)) + "</small>" +
        '<small>' + t("Recrear") + " " + stars(r.r || 0, max) + " · " + t("Reescribir") + " " + stars(r.w || 0, max) + "</small>" +
        '<div class="mo-row"><button type="button" data-mo-act="intro" data-mo-v="' + esc(m.id) + '|recreate">' + t("Recrear") + '</button><button type="button" data-mo-act="intro" data-mo-v="' + esc(m.id) + '|rewrite">' + t("Reescribir") + "</button></div></div>";
    }).join("");
    frame(t("Momentos de leyenda"), '<p class="eras-lead">' + t("Partidos que marcaron cada década. Recréalos como fueron o cambia la historia. No afectan a tus carreras.") + "</p>" + titles() + tabs + cards,
      '<button type="button" data-mo-act="album">' + t("Álbum de los 80") + "</button>");
  }
  function objectives(m, mode, res) {
    var main = EM.mainText(m, mode);
    function li(text, ok) { return "<li" + (res ? ' class="' + (ok ? "mo-ok" : "mo-ko") + '"' : "") + ">" + (res ? (ok ? "✓ " : "✗ ") : "• ") + esc(text) + "</li>"; }
    return '<ul class="mo-obj">' + li(t("Principal: {o}", {o: main}), res && res.ok) + (m.secondary || []).map(function (k, i) { return li(EM.secondaryText(k), res && res.sec[i].ok); }).join("") + "</ul>";
  }
  function introView() {
    var st = view.st, m = EM.byId(st.id);
    var side = EM.teamName(m.teams[st.you]);
    frame(esc(m.year) + " · " + esc(EM.teamName(m.teams[0])) + " – " + esc(EM.teamName(m.teams[1])),
      '<div class="eras-summary"><b>' + t("Lo que pasó") + '</b><p class="eras-lead" style="margin:6px 0 0">' + esc(EM.loc(m.fact)) + "</p></div>" +
      '<p class="eras-lead">' + esc(EM.loc(m.setup)) + " " + t("Juegas con {team}.", {team: esc(side)}) + "</p>" + objectives(m, st.mode),
      '<button type="button" class="primary" data-mo-act="go">' + t("Empezar") + "</button>");
  }
  function board(st, m) {
    var mins = st.phase === "pens" ? t("Penaltis") : st.minute + "'";
    return '<div class="mo-board"><span>' + esc(EM.teamName(m.teams[0])) + "</span><b>" + st.s[0] + "–" + st.s[1] + "</b><span>" + esc(EM.teamName(m.teams[1])) + "</span></div>" +
      '<p class="eras-lead" style="text-align:center;margin:6px 0">' + esc(mins) + (st.et ? " · " + t("Prórroga") : "") + "</p>";
  }
  function pensLine(st) {
    var p = st.pens, me = st.you;
    function row(k) { return k.map(function (x) { return x ? "●" : "○"; }).join(" ") || "—"; }
    var a = me === 0 ? p.k[0] : p.k[1], b = me === 0 ? p.k[1] : p.k[0];
    return '<p class="eras-lead" style="text-align:center">' + row(a) + "<br>" + row(b) + "</p>";
  }
  function playView() {
    var st = view.st, m = EM.byId(st.id), body = board(st, m);
    if (st.phase === "pens") {
      body += pensLine(st) + '<ul class="mo-log">' + st.log.slice(-4).reverse().map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      frame(t("Tanda de penaltis"), body, '<button type="button" class="primary" data-mo-act="kick">' + (m.kind === "gkshootout" ? t("Ponerte bajo palos") : t("Lanzar tu penalti")) + "</button>");
      return;
    }
    if (st.chance) {
      frame(t("¡Ocasión!"), body + '<p class="eras-lead">' + esc(st.chance === "fk" ? t("Falta al borde del área. Te toca a ti.") : t("Penalti a favor. Te toca a ti.")) + "</p>",
        '<button type="button" class="primary" data-mo-act="shoot">' + t("Lanzar") + "</button>");
      return;
    }
    body += '<ul class="mo-log">' + st.log.slice(-5).reverse().map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<p class="eras-lead">' + t("Elige cómo juegas el siguiente tramo.") + "</p>";
    frame(t("Momento de leyenda"), body, '<button type="button" data-mo-act="tac" data-mo-v="att">' + t("Atacar") + '</button><button type="button" data-mo-act="tac" data-mo-v="bal">' + t("Equilibrado") + '</button><button type="button" data-mo-act="tac" data-mo-v="def">' + t("Defender") + "</button>");
  }
  function resultView() {
    var st = view.st, m = EM.byId(st.id), res = view.res, max = 1 + (m.secondary || []).length, gained = view.gained || {cards: [], rewards: []};
    var body = board(st, m) + '<div class="eras-summary"><b>' + (res.ok ? (st.mode === "rewrite" ? t("¡Has cambiado la historia!") : t("¡Momento recreado!")) : t("Esta vez no salió")) + "</b> " + stars(res.stars, max) + "</div>" + objectives(m, st.mode, res);
    if (gained.cards.length) body += '<p class="eras-lead">' + t("Cromo nuevo: {c}", {c: esc(gained.cards.map(function (id) { return EM.cardName(EM.card(id)); }).join(", "))}) + "</p>";
    if (gained.rewards.length) body += '<p class="eras-lead">' + t("Recompensa desbloqueada para todas tus partidas: {r}", {r: esc(gained.rewards.map(function (id) { var r = EM.rewards.filter(function (x) { return x.id === id; })[0]; return r ? (typeof tr === "function" ? tr(r.name) : r.name) : id; }).join(", "))}) + "</p>";
    frame(t("Resultado"), body, '<button type="button" class="primary" data-mo-act="intro" data-mo-v="' + esc(m.id) + "|" + st.mode + '">' + t("Repetir") + '</button><button type="button" data-mo-act="list">' + t("Momentos") + "</button>");
  }
  function albumView() {
    var meta = EraMeta.get(), A = EM.album, owned = 0, total = 0;
    var pages = A.pages.map(function (p) {
      var rw = EM.rewards.filter(function (r) { return r.id === p.reward; })[0];
      return '<div class="mo-card"><h4>' + esc(EM.loc(p.name)) + (EM.pageDone(p) ? " ✓" : "") + '</h4><small>' + t("Premio de la página: {r}", {r: esc(rw ? (typeof tr === "function" ? tr(rw.name) : rw.name) : "")}) + '</small><div class="mo-grid">' + p.cards.map(function (c) {
        var n = meta.cards[c.id] || 0; total++; if (n) owned++;
        return '<div class="mo-c' + (n ? "" : " miss") + '"><span>' + esc(n ? EM.cardName(c) : "?") + "</span>" + (n > 1 ? "<em>×" + n + "</em>" : !n && EM.dupes() >= (A.swap || 4) ? '<button type="button" data-mo-act="swap" data-mo-v="' + esc(c.id) + '">' + t("Cambiar") + "</button>" : "") + "</div>";
      }).join("") + "</div></div>";
    }).join("");
    frame(t("Álbum de los 80"), '<p class="eras-lead">' + t("Consigue cromos jugando carreras de Épocas en los 80 (dos por temporada y uno por cada título de tu equipo) y con los momentos de los 80. {n} repetidos se cambian por el cromo que elijas.", {n: A.swap || 4}) + "</p>" +
      '<div class="eras-summary"><b>' + t("{a} de {b} cromos", {a: owned, b: total}) + "</b> · " + t("{n} repetidos", {n: EM.dupes()}) + "</div>" + (view.msg ? '<p class="eras-lead">' + esc(view.msg) + "</p>" : "") + pages,
      '<button type="button" data-mo-act="list">' + t("Momentos de leyenda") + "</button>");
  }
  function render() {
    if (!layer) return;
    if (view.s === "intro") introView(); else if (view.s === "play") playView(); else if (view.s === "result") resultView(); else if (view.s === "album") albumView(); else listView();
  }
  /* ---------- desarrollo del partido ---------- */
  function finish() {
    var st = view.st, m = EM.byId(st.id);
    st.done = true; view.res = EM.score(m, st); view.gained = EM.record(m, st, view.res); view.s = "result";
    try { if (S && window.eraGrantRewards) window.eraGrantRewards(); } catch (e) {}
    render();
  }
  function startPens() { var st = view.st; st.phase = "pens"; st.log.push(t("Empate: se decide en los penaltis.")); render(); }
  function endRegular() {
    var st = view.st, m = EM.byId(st.id);
    if (st.s[0] === st.s[1] && m.knockout) {
      if (!st.et) { st.et = true; st.chunks += 2; st.log.push(t("Empate al final: prórroga.")); render(); return; }
      startPens(); return;
    }
    finish();
  }
  function tactic(v) {
    var st = view.st, m = EM.byId(st.id), endMin = st.et ? 120 : 90, mins = Math.max(1, Math.round((endMin - st.minute) / Math.max(1, st.chunks - st.chunk)));
    var g = EM.playChunk(m, st, v, mins, Math.random);
    st.minute = Math.min(endMin, st.minute + mins); st.chunk++;
    var line = st.minute + "' · " + (v === "att" ? t("Atacas") : v === "def" ? t("Te cierras") : t("Juegas equilibrado"));
    if (g[0]) line += " · " + t("¡Gol tuyo!") + (g[0] > 1 ? " ×" + g[0] : "");
    if (g[1]) line += " · " + t("Gol del rival") + (g[1] > 1 ? " ×" + g[1] : "");
    st.log.push(line);
    /* una ocasión a balón parado por partido, en un tramo al azar */
    if (st.chanceAt == null) st.chanceAt = Math.floor(Math.random() * Math.max(1, st.chunks));
    if (!st.chanceUsed && st.chunk - 1 === st.chanceAt) { st.chanceUsed = true; st.chance = Math.random() < 0.5 ? "pen" : "fk"; render(); return; }
    afterChunk();
  }
  function afterChunk() {
    var st = view.st;
    if (st.chunk >= st.chunks || st.minute >= (st.et ? 120 : 90)) { endRegular(); return; }
    render();
  }
  function shoot() {
    var st = view.st, m = EM.byId(st.id), me = m.teams[st.you], them = m.teams[1 - st.you], kind = st.chance;
    var opts = {skill: Math.min(95, me.r + 3 * EM.help(m.id)), gk: Math.max(45, them.r - 4), pressure: 0.7, press: true};
    hide();
    var go = function (res) {
      show();
      st.chance = null;
      if (res && res.scored) { st.s[st.you]++; st.add[0]++; st.log.push(t("¡Gol a balón parado!")); } else st.log.push(t("Ocasión perdida."));
      afterChunk();
    };
    if (kind === "fk") Minigame.freekick(opts, go); else Minigame.penalty(opts, go);
  }
  function kick() {
    var st = view.st, m = EM.byId(st.id), p = st.pens, me = m.teams[st.you], them = m.teams[1 - st.you], gkMode = m.kind === "gkshootout";
    hide();
    var done = function (res) {
      show();
      var scoredUser = !!(res && res.scored);
      p.round++;
      if (gkMode) {
        /* tú paras; tu equipo tira de forma simulada */
        p.k[1].push(scoredUser); if (!scoredUser) p.saves++; else p.conceded++;
        p.k[0].push(EM.ourKick(m, st, Math.random));
      } else {
        p.k[0].push(scoredUser); if (scoredUser && res.p != null && res.p < 0.6) p.risky = true;
        p.k[1].push(EM.oppKick(m, st, Math.random));
      }
      st.log.push(t("Ronda {n}: tú {a} · rival {b}", {n: p.round, a: p.k[0][p.k[0].length - 1] ? "●" : "○", b: p.k[1][p.k[1].length - 1] ? "●" : "○"}));
      var w = EM.pensDecided(p);
      if (w != null) { st.pensWinner = w === 0 ? st.you : 1 - st.you; finish(); return; }
      if (p.round >= 12) { st.pensWinner = Math.random() < 0.5 ? 0 : 1; finish(); return; }
      render();
    };
    if (gkMode) Minigame.gkPenalty({gk: Math.min(95, me.r + 3 * EM.help(m.id)), skill: them.r, pressure: 0.8, press: true}, done);
    else Minigame.penalty({skill: Math.min(95, me.r + 3 * EM.help(m.id)), gk: Math.max(45, them.r - 4), pressure: 0.8, press: true}, done);
  }
  function hide() { if (layer) layer.style.display = "none"; }
  function show() { if (layer) layer.style.display = ""; }
  document.addEventListener("click", function (event) {
    var b = event.target && event.target.closest ? event.target.closest("[data-mo-act]") : null;
    if (!b) return;
    var a = b.getAttribute("data-mo-act"), v = b.getAttribute("data-mo-v") || "";
    view.msg = "";
    if (a === "open") { view.s = "list"; mount(); return; }
    if (a === "album-open") { view.s = "album"; mount(); return; }
    if (!layer) return;
    if (a === "close") { close(); return; }
    if (a === "dec") { view.dec = v; view.s = "list"; }
    else if (a === "list") view.s = "list";
    else if (a === "album") view.s = "album";
    else if (a === "intro") { var x = v.split("|"), m = EM.byId(x[0]); if (!m) return; view.dec = m.decade; view.st = EM.initState(m, x[1] === "rewrite" ? "rewrite" : "recreate"); view.s = "intro"; }
    else if (a === "go") view.s = "play";
    else if (a === "tac") { tactic(v); return; }
    else if (a === "shoot") { shoot(); return; }
    else if (a === "kick") { kick(); return; }
    else if (a === "swap") { view.msg = EM.swap(v) ? t("Cambio hecho: {c}", {c: EM.cardName(EM.card(v))}) : t("No tienes repetidos suficientes."); }
    render();
  });
  /* entrega de recompensas y aviso de cromos nuevos en las carreras */
  window.UIX.add("after", function () {
    try { if (S && window.eraGrantRewards) window.eraGrantRewards(); } catch (e) {}
    if (S && S.era && S.era.newCards && window.UIX.toast) { var n = S.era.newCards; S.era.newCards = 0; window.UIX.toast(t("{n} cromos nuevos para el Álbum de los 80", {n: n})); }
  });
  window.UIX.eraMoCss = css;
  window.UIX.eraMomentsButtons = function () {
    return '<button type="button" data-mo-act="open">' + t("Momentos de leyenda") + '</button><button type="button" data-mo-act="album-open">' + t("Álbum de los 80") + "</button>";
  };
})();
