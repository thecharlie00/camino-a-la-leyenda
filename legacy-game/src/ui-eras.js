/* Selector y continuidad del Modo Épocas; se monta en los slots de UI existentes. */
(function () {
  if (!ERAS_MODE || !window.UIX) return;
  var state = {open: false, packId: "1990s", year: 1992, mode: "player", firstName: "Alex", lastName: "Leyenda", club: ""};
  var layer = null;
  var kitNames = {"classic-70s": "Detalle retro de los 70", "classic-80s": "Patrón chevron de los 80", "baggy-90s": "Franjas horizontales de los 90", "fitted-00s": "Panel dividido de los 2000", "modern-athletic": "Diseño geométrico de los 2010", "modern-performance": "Detalle técnico geométrico de los 2020"};
  var pitchNames = {"mud-winter": "Barro invernal", "hybrid-emerging": "Transición a césped híbrido", hybrid: "Césped híbrido", "hybrid-heated": "Césped híbrido con calefacción"};
  var broadcastNames = {"grainy-4:3": "Televisión 4:3 granulada", "sd-4:3-first-gen-eng": "Televisión 4:3 granulada", "sd-16:9": "Definición estándar panorámica", "hd-16:9": "Alta definición", "4k-graphics": "4K y gráficos actuales"};
  var scienceNames = {basic: "Preparación física básica", growing: "Ciencia deportiva en desarrollo", advanced: "Ciencia deportiva avanzada", "elite-data": "Ciencia deportiva con análisis de datos"};
  var channelNames = {newspapers: "Periódicos", radio: "Radio", "weekly-tv-highlights": "Resúmenes televisivos semanales", tabloids: "Tabloides", teletext: "Teletexto", "teletext-late-decade": "Teletexto", fanzines: "Fanzines", "phone-in": "Programas de llamadas", "live-tv": "Televisión en directo", "club-websites": "Webs de clubes", forums: "Foros", "sms-alerts": "Alertas SMS", "sports-news-tv": "Televisión deportiva", "deadline-day": "Mercado de fichajes", "early-social-web": "Redes sociales", websites: "Webs de clubes", twitter: "Twitter", youtube: "YouTube", "live-blogs": "Webs de clubes", instagram: "Instagram", tiktok: "TikTok", "here-we-go": "Here we go", "fan-channels": "Canales de aficionados", "viral-clips": "Clips virales"};
  function t(text, values) { return eraText(text, values); }
  function channelLabel(id) { return t(channelNames[id] || id); }
  function packs() { return ERAS_DATA.packs.slice().sort(function (a, b) { return a.years[0] - b.years[0]; }); }
  function selectedPack() { return packs().filter(function (pack) { return pack.id === state.packId; })[0] || packs()[0]; }
  function profile(year) { return eraProfileForYear(year == null ? state.year : year); }
  function theme() {
    if (!document.getElementById("eras-style")) {
      var style = document.createElement("style"); style.id = "eras-style";
      style.textContent = ".eras-hud{position:fixed;z-index:58;top:6px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;max-width:calc(100vw - 16px);padding:5px 7px;border:1px solid rgba(220,190,108,.65);border-radius:12px;background:rgba(7,14,17,.94);box-shadow:0 4px 14px #0008;color:#f3e8c8;font:700 11px/1.2 system-ui,sans-serif}#app.era-active header.top{flex-wrap:wrap}header.top .eras-hud{position:static;transform:none;flex:1 0 100%;order:9;max-width:none;justify-content:center;margin:2px 0 0;box-shadow:none}.eras-paper{margin:12px 0 0;padding:10px 12px;border:1px solid rgba(220,190,108,.35);border-radius:12px;background:rgba(255,255,255,.03)}.eras-paper-head{display:flex;flex-direction:column;gap:2px;margin:0 0 8px}.eras-paper-head span{font-size:12px;opacity:.75;letter-spacing:.08em;text-transform:uppercase}.eras-paper-head b{font-size:15px;line-height:1.3}.eras-book{list-style:none;margin:0;padding:0;font-size:13px;text-align:left}.eras-book li{display:flex;flex-direction:column;gap:1px;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)}.eras-book li span{font-weight:600}.eras-book li small{opacity:.85}.eras-book li.diff small:last-child{color:#f0c96a}.eras-book li.mine span{color:#f0c96a}.eras-hud span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.eras-hud button{border:0;border-radius:8px;padding:5px 7px;background:#24343a;color:#fff;font:inherit}.eras-overlay{position:fixed;z-index:1000;inset:0;background:rgba(3,8,10,.88);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px 10px 30px}.eras-dialog{width:min(680px,100%);margin:auto;background:#101c20;color:#e9eee7;border:1px solid rgba(220,190,108,.48);border-radius:18px;padding:18px;box-shadow:0 18px 60px #000b}.eras-dialog h2,.eras-dialog h3{margin:0 0 7px}.eras-kicker{color:#e0bf67;font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.eras-lead{color:#b9c7c2;line-height:1.45}.eras-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.eras-field{display:flex;flex-direction:column;gap:5px;min-width:0}.eras-field label{font-size:.78rem;color:#b9c7c2}.eras-field input,.eras-field select{box-sizing:border-box;width:100%;min-height:42px;border:1px solid #42545a;border-radius:10px;padding:8px 10px;background:#091316;color:#f4f4ee;font:inherit}.eras-summary{margin:14px 0;padding:12px;border-radius:12px;background:#0a1316;border-left:3px solid #d0ae5d}.eras-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.eras-tag{border:1px solid #34474c;border-radius:99px;padding:4px 8px;color:#d8e1da;font-size:.72rem}.eras-actions{display:flex;gap:8px;margin-top:14px}.eras-actions button,.eras-save button{min-height:40px;border:1px solid #43565b;border-radius:10px;padding:8px 12px;background:#1b2a2f;color:#f5f5ee;font:700 .9rem system-ui,sans-serif}.eras-actions .primary{background:#b7913c;color:#141414;border-color:#d7b45f}.eras-save{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid #26363a}.eras-save small{display:block;color:#b9c7c2}.eras-saves{max-height:210px;overflow:auto}.eras-history{margin:8px 0 0;padding-left:22px;color:#d8e1da}.eras-history li{padding:6px 0;border-bottom:1px solid #26363a}.eras-history li span{display:block}.eras-history li small{display:block;color:#b9c7c2;margin-top:2px}.era-skin-teletext .top{border-bottom:2px solid #4ad65a}.era-skin-teletext .top .name,.era-skin-teletext .tag{font-family:ui-monospace,monospace}.era-skin-teletext .card{border-radius:2px}.era-skin-print-scoreboard .top{border-top:3px solid #b58e3f}@media(max-width:520px){.eras-dialog{padding:14px}.eras-grid{grid-template-columns:1fr}.eras-hud{font-size:10px}.eras-hud button{padding:5px}}";
      document.head.appendChild(style);
    }
  }

  function profileSummary(p) {
    var rules = p.rules, media = p.media, presentation = p.presentation, economy = p.economy;
    var social = media.socialMedia ? t("Redes disponibles") : t("Sin redes sociales");
    var varText = rules.var ? t("VAR disponible") : t("VAR: no disponible");
    var scopeText = p.scope ? "" : '<p class="eras-lead" style="margin:8px 0 0">' + t("Las reglas cambian según la liga y la competición: estas son las generales de {year}.", {year: p.currentYear || state.year}) + '</p>';
    var skinText = presentation.uiSkin === "teletext" ? t("Interfaz aplicada: teletexto.") : presentation.uiSkin === "print-scoreboard" ? t("Interfaz aplicada: marcador impreso.") : t("Skin del perfil ({skin}) aún no aplicada; se conserva la interfaz estándar.", {skin: presentation.uiSkin});
    return '<div class="eras-summary"><b>' + t("Reglas en {year}", {year: p.currentYear || state.year}) + '</b><div class="eras-tags">' +
      '<span class="eras-tag">' + t("{n} puntos por victoria", {n: rules.winPoints}) + '</span>' +
      '<span class="eras-tag">' + t("En directo: máximo {n} cambios", {n: rules.maxSubs}) + '</span>' +
      '<span class="eras-tag">' + (rules.transferWindows ? t("Ventanas de fichajes") : t("Sin ventanas obligatorias")) + '</span>' +
      '<span class="eras-tag">' + social + '</span><span class="eras-tag">' + varText + '</span>' +
      '<span class="eras-tag">' + (rules.backPassBanned ? t("Cesión al portero prohibida") : t("Cesión al portero permitida: quien gana puede dormir el partido")) + '</span>' +
      (rules.awayGoals ? '<span class="eras-tag">' + t("Goles fuera valen doble en eliminatorias") + '</span>' : '') +
      (rules.tackleFromBehindRed ? '<span class="eras-tag">' + t("Entrada por detrás: roja") + '</span>' : '<span class="eras-tag">' + t("Menos expulsiones que hoy") + '</span>') + '</div>' + scopeText +
      '<p class="eras-lead" style="margin:10px 0 0">' + skinText + '</p>' +
      '<p class="eras-lead" style="margin:6px 0 0">' + t("Escalas económicas simuladas para salarios, valores y presupuestos.") + ' · ' + t("Salarios ×{wage}; mercado ×{market}; presupuesto ×{tv}.", {wage: economy.wageScale.toFixed(2), market: economy.marketScale.toFixed(2), tv: economy.tvDealMultiplier.toFixed(2)}) + '</p>' +
      '<p class="eras-lead" style="margin:6px 0 0">' + t("Canales mostrados en el HUD; no simulan una red de contactos.") + ' ' + t("Canales: {channels}.", {channels: media.channels.map(channelLabel).join(" · ")}) + '</p>' +
      '<p class="eras-lead" style="margin:6px 0 0">' + t("Estilo de prenda 3D del perfil (si no llevas una propia): {kit}, con colores del club; terreno y TV aún son referencias: {pitch}; {broadcast}.", {kit: t(kitNames[presentation.kits] || presentation.kits), pitch: t(pitchNames[presentation.pitchWear] || presentation.pitchWear), broadcast: t(broadcastNames[presentation.broadcast] || presentation.broadcast)}) + '</p></div>';
  }
  function savedRows() {
    var list = EraStore.getIndex();
    if (!list.length) return '<p class="eras-lead">' + t("Aún no hay carreras de Épocas guardadas en este dispositivo.") + '</p>';
    return list.map(function (entry) {
      return '<div class="eras-save"><div><b>' + eraEscape(entry.player || t("Carrera")) + '</b><small>' + eraEscape(entry.decade || "") + ' · ' + eraEscape(entry.startYear) + ' · ' + eraEscape(entry.club || t("Sin club")) + '</small></div>' +
        '<div><button type="button" data-era-act="load" data-era-id="' + eraEscape(entry.id) + '">' + t("Continuar") + '</button> <button type="button" data-era-act="delete" data-era-id="' + eraEscape(entry.id) + '" aria-label="' + t("Borrar guardado") + '">×</button></div></div>';
    }).join("");
  }
  function recentDecisions() {
    var history = S && S.era && Array.isArray(S.era.decisionLog) ? S.era.decisionLog.slice(-8).reverse() : [];
    if (!history.length) return '<h3>' + t("Decisiones recientes") + '</h3><p class="eras-lead">' + t("Aún no has tomado decisiones de época.") + '</p>';
    var labels = ["Acelerar con inversión", "Probar por fases", "Aplazar y proteger recursos"];
    var rows = history.map(function (entry) {
      var record = ERAS_DATA.decisions.records.filter(function (item) { return item.id === entry.id; })[0];
      if (!record) return "";
      var title = eraText(ERAS_DATA.decisions.topics[record.topic].key) + " · " + eraText(ERAS_DATA.decisions.contexts[record.decade][record.context]);
      return '<li><b>' + eraEscape(entry.year) + '</b><span>' + eraEscape(title) + '</span><small>' + t(labels[entry.choice] || labels[1]) + '</small></li>';
    }).filter(Boolean).join("");
    return '<h3>' + t("Decisiones recientes") + '</h3><ol class="eras-history">' + rows + '</ol>';
  }
  function renderDialog() {
    if (!layer) return;
    var pack = selectedPack(), years = [];
    for (var y = pack.years[0]; y <= pack.years[1]; y++) years.push(y);
    if (years.indexOf(state.year) < 0) state.year = pack.startYear;
    layer.setAttribute("data-era-decade", pack.id);
    layer.setAttribute("data-era-year", state.year);
    var cover = '<div class="eras-cover" aria-hidden="true"><span class="eras-cover-decade">' + eraEscape(pack.label) + '</span><span class="eras-cover-years">' + pack.years[0] + ' — ' + pack.years[1] + '</span><span class="eras-cover-stamp">' + state.year + '</span></div>';
    layer.innerHTML = '<section class="eras-dialog" data-era-decade="' + eraEscape(pack.id) + '" role="dialog" aria-modal="true" aria-labelledby="eras-title">' + cover + '<div class="eras-kicker">' + t("Modo aislado · guardados separados") + '</div><h2 id="eras-title">' + t("Modo Épocas") + '</h2><p class="eras-lead">' + t("Empieza una carrera en otro momento de la historia. La partida moderna y sus guardados no se modifican.") + '</p>' +
      '<div class="eras-grid"><div class="eras-field"><label for="era-decade">' + t("Década de inicio") + '</label><select id="era-decade" data-era-field="pack">' + packs().map(function (item) { return '<option value="' + item.id + '"' + (item.id === pack.id ? ' selected' : '') + '>' + eraEscape(item.label) + '</option>'; }).join("") + '</select></div>' +
      '<div class="eras-field"><label for="era-year">' + t("Año exacto") + '</label><select id="era-year" data-era-field="year">' + years.map(function (n) { return '<option value="' + n + '"' + (n === state.year ? ' selected' : '') + '>' + n + '</option>'; }).join("") + '</select></div>' +
      '<div class="eras-field"><label for="era-mode">' + t("Tipo de carrera") + '</label><select id="era-mode" data-era-field="mode"><option value="player"' + (state.mode === "player" ? ' selected' : '') + '>' + t("Carrera de jugador") + '</option><option value="manager"' + (state.mode === "manager" ? ' selected' : '') + '>' + t("Carrera de míster") + '</option></select></div>' +
      '</div>' +
      profileSummary(profile(state.year)) + '<div class="eras-actions"><button type="button" class="primary" data-era-act="start">' + t("Elegir club y empezar en {year}", {year: state.year}) + '</button><button type="button" data-era-act="close">' + t("Volver") + '</button></div>' +
      '<h3 style="margin-top:20px">' + t("Tus carreras históricas") + '</h3><div class="eras-saves">' + savedRows() + '</div></section>';
  }
  function open() {
    theme(); state.open = true;
    layer = document.getElementById("era-overlay");
    if (!layer) { layer = document.createElement("div"); layer.id = "era-overlay"; layer.className = "eras-overlay"; document.body.appendChild(layer); }
    renderDialog();
  }
  function close() { state.open = false; if (layer) layer.remove(); layer = null; }
  function showCurrentRules() {
    if (!S || !S.era) return;
    theme(); state.open = true;
    layer = document.getElementById("era-overlay");
    if (!layer) { layer = document.createElement("div"); layer.id = "era-overlay"; layer.className = "eras-overlay"; document.body.appendChild(layer); }
    var pack = eraPackForYear(S.yr), oldPack = state.packId, oldYear = state.year;
    state.packId = pack.id; state.year = S.yr;
    var details = profileSummary(eraInfoForYear(S.yr).profile);
    state.packId = oldPack; state.year = oldYear;
    layer.setAttribute("data-era-decade", pack.id);
    layer.setAttribute("data-era-year", S.yr);
    layer.innerHTML = '<section class="eras-dialog" data-era-decade="' + eraEscape(pack.id) + '" role="dialog" aria-modal="true" aria-labelledby="eras-current-title"><div class="eras-kicker">' + eraEscape(S.era.startDecade) + '</div><h2 id="eras-current-title">' + t("Reglas en {year}", {year: S.yr}) + '</h2>' + details + recentDecisions() + '<div class="eras-actions"><button type="button" data-era-act="close">' + t("Volver") + '</button></div></section>';
  }
  /* Identidad de las competiciones de época: cabecera con trofeo, colores, formato, participantes y desempates del año */
  window.UIX.eraAgLabel = function () { return t("(v. goles fuera)"); };
  function formatText(f) {
    if (!f) return "";
    if (f.type === "ko") return f.final === "two-legs" ? t("Eliminatorias a ida y vuelta, también la final") : t("Eliminatorias a ida y vuelta y final a partido único en campo neutral");
    if (f.type === "groups") return t("{g} grupos y eliminatorias", {g: f.groups});
    if (f.type === "final") return f.legs === 2 ? t("Final a ida y vuelta") : t("Final a partido único en campo neutral");
    return "";
  }
  function qualText(q) {
    return q === "champions" ? t("Solo campeones de liga y el campeón vigente") : q === "cup-winners" ? t("Campeones de copa de cada país") : q === "one-per-city" ? t("Clubes de ciudades con feria de muestras, uno por ciudad") : "";
  }
  window.UIX.eraCupHead = function (c, k) {
    if (!S || !S.era || !S.era.active || c.nat || typeof EraComps === "undefined") return "";
    var comp = EraComps.clubComp(k); if (!comp) return "";
    var year = S.yr, f = EraComps.format(comp, year), q = comp.qual ? (comp.qual.filter(function (x) { return x[0] <= year; }).pop() || [])[1] : null;
    var rules = eraRulesForYear(year, {comp: k, conf: comp.conf}), lines = [];
    var ft = formatText(f); if (ft) lines.push(ft);
    var qt = qualText(q); if (qt) lines.push(qt);
    if (rules) {
      var tb = [];
      if (rules.awayGoals && (f.legs === 2 || f.type === "ko" || f.type === "groups")) tb.push(t("goles fuera"));
      if (rules.goldenGoal) tb.push(t("gol de oro")); if (rules.silverGoal) tb.push(t("gol de plata"));
      tb.push(t("penaltis"));
      lines.push(t("Desempate: {list}", {list: tb.join(" · ")}));
    }
    if (f.simplified) lines.push(t("Formato simplificado en el juego: {note}", {note: t(f.simplified)}));
    var cols = (comp.identity && comp.identity.colors) || ["#13262c", "#d9a93c"];
    return '<section class="card eras-cuphead" style="border-left:6px solid ' + eraEscape(cols[1]) + ';background:linear-gradient(135deg,' + eraEscape(cols[0]) + '33,transparent 70%)">' +
      '<div style="display:flex;gap:12px;align-items:center">' + (typeof trophySVG === "function" ? trophySVG(k, 56, c.n) : "") +
      '<div><span class="eyebrow">' + t("Temporada {y}", {y: typeof seasonLabel === "function" ? seasonLabel(year) : year}) + '</span><h3 style="margin:2px 0">' + eraEscape(c.n) + "</h3></div></div>" +
      lines.map(function (line) { return '<p class="lead" style="margin:6px 0 0;font-size:var(--fs-sm)">' + eraEscape(line) + "</p>"; }).join("") + "</section>";
  };
  /* Ficha de época del club elegido y opciones propias de Épocas dentro del formulario de creación */
  function rivalOf(ci) {
    var best = -1;
    Object.keys(W.derby || {}).forEach(function (key) {
      var pair = key.split("-").map(Number);
      if (pair[0] === ci && pair[1] !== ci) best = best < 0 ? pair[1] : best;
      else if (pair[1] === ci && pair[0] !== ci) best = best < 0 ? pair[0] : best;
    });
    return best;
  }
  window.UIX.eraCreateExtra = function (c) {
    var year = c.era.year, out = "";
    if (c.kind !== "mgr") out += '<button class="btn wide" data-a="cset" data-k="mode" data-v="none" aria-pressed="' + (c.mode === "none") + '">' + t("Sin elegir club (cantera al azar)") + "</button>" +
      (c.mode === "none" ? '<p class="lead">' + t("Debutarás en un club de tu país que existiera en {year}, elegido al azar.", {year: year}) + "</p>" : "");
    if (c.club < 0 || !W.clubs[c.club]) return out;
    var club = W.clubs[c.club], li = club.lg0, lg = W.lg[li], hist = (ERAS_DATA.clubsHistory.clubs || {})[club.n];
    var name = eraClubName(club.n, year), league = eraLeagueName(lg.id, lg.n, year), rival = rivalOf(c.club);
    var ranked = lg.cl0.filter(function (ci) { return eraClubExists(W.clubs[ci].n, year); }).sort(function (a, b) { return W.clubs[b].r0 - W.clubs[a].r0; });
    var pos = ranked.indexOf(c.club) + 1, size = pos <= Math.max(1, Math.round(ranked.length / 5)) ? t("uno de los grandes de su liga") : pos > ranked.length * 0.6 ? t("un club modesto de su liga") : t("un club de mitad de tabla");
    var lines = [t("En {year} es {size}: nivel {n}, puesto {p} de {t} por fuerza.", {year: year, size: size, n: Math.round(club.r0), p: pos, t: ranked.length})];
    if (hist && hist.names && name !== club.n) lines.push(t("Hoy se llama {now}.", {now: club.n}));
    if (hist && hist.doubtful) lines.push(t("Datos históricos de este club pendientes de verificar."));
    if (rival >= 0 && eraClubExists(W.clubs[rival].n, year)) lines.push(t("Rival histórico: {rival}.", {rival: eraClubName(W.clubs[rival].n, year)}));
    if (c.kind !== "mgr") {
      var prof = eraProfileForYear(year, {league: lg.id, conf: lg.conf}), rules = prof && prof.rules, nat = W.cIdx[c.nat], nat2 = c.nat2 ? W.cIdx[c.nat2] : -1;
      if (rules && rules.foreignLimit && lg.conf === "UEFA" && nat !== lg.ci && nat2 !== lg.ci)
        lines.push(t("Antes de la ley Bosman los clubes solo alinean {n} extranjeros: si no eres de los mejores del equipo, jugarás menos.", {n: rules.foreignLimit}));
    }
    var colors = (club.col || []).slice(0, 2).map(function (col) { return '<i style="display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid rgba(255,255,255,.3);background:' + eraEscape(col) + '"></i>'; }).join(" ");
    return out + '<section class="card eras-clubcard"><span class="eyebrow">' + t("Ficha de {year}", {year: year}) + '</span><h3 style="margin:4px 0">' + eraEscape(name) + " " + colors + '</h3><small class="muted">' + eraEscape(league) + "</small>" +
      lines.map(function (line) { return '<p class="lead" style="margin:6px 0 0">' + eraEscape(line) + "</p>"; }).join("") + "</section>";
  };
  /* El inicio usa el formulario normal de creación (nacionalidad, posición, pie, edad, talento y cualquier club que existiera ese año). */
  function start() {
    var pack = selectedPack();
    if (!pack || state.year < pack.years[0] || state.year > pack.years[1]) return;
    var year = state.year, mode = state.mode;
    close();
    window.UIX.startCreate(mode === "manager" ? "mgr" : "p", {era: {year: year, packId: pack.id}});
  }
  /* Al terminar el formulario: guarda la partida abierta (moderna o de Épocas) y crea la carrera histórica */
  window.eraStartFromCreate = function (c) {
    function begin() {
      try { eraStartFromCreateNow(c); } catch (e) { fail(e); }
    }
    function fail(error) {
      console.error(error);
      if (window.UIX.toast) window.UIX.toast(t("No se pudo iniciar la carrera de Épocas."));
    }
    try {
      if (S && S.era) { EraStore.save(); begin(); return; }
      if (S && window.UIX.persist) {
        window.UIX.persist();
        var store = window.UIX.store, flushed = store && typeof store.flush === "function" ? store.flush() : null;
        if (flushed && typeof flushed.then === "function") { flushed.then(begin).catch(fail); return; }
      }
      begin();
    } catch (e) { fail(e); }
  };
  function load(id) {
    if (state.loading) return;
    function applyLoad() {
      if (!state.open) { state.loading = false; return; }
      try {
        var json = EraStore.read(id);
        if (!json) throw new Error("Guardado no disponible");
        restore(json);
        var ui = window.UIX.ui(); ui.view = S.ph === "draft" ? "draft" : "game"; ui.tab = S.mode === "mgr" ? "club" : "carrera"; ui.cr = null;
        state.loading = false; close(); window.UIX.render(true);
      } catch (e) { fail(e); }
    }
    function fail(error) {
      state.loading = false; console.error(error);
      if (state.open) renderDialog();
      if (window.UIX.toast) window.UIX.toast(t("No se pudo cargar la carrera histórica."));
    }
    try {
      if (S && S.era) { EraStore.save(); applyLoad(); return; }
      if (S && window.UIX.persist) {
        window.UIX.persist();
        var store = window.UIX.store, flushed = store && typeof store.flush === "function" ? store.flush() : null;
        if (flushed && typeof flushed.then === "function") {
          state.loading = true;
          flushed.then(applyLoad).catch(fail);
          return;
        }
      }
      applyLoad();
    } catch (e) { fail(e); }
  }
  UIX.add("modes", function () {
    if (!ERAS_MODE) return "";
    var count = EraStore.getIndex().length;
    return '<button class="pickrow modec eras-mode" data-a="era-open"><span class="micon" aria-hidden="true">🕰️</span><div class="grow"><b>' + t("Modo Épocas") + '</b><small>' + t("1970 · 1980 · 1990 · 2000 · 2010 · 2020") + ' · ' + t("Modo aislado · guardados separados") + (count ? ' · ' + t("{n} guardadas", {n: count}) : "") + '</small></div></button>';
  });
  UIX.actions["era-open"] = function () { open(); };
  UIX.actions["era-exit"] = function () {
    if (S && S.era) { EraStore.save(); S = null; }
    var ui = window.UIX.ui(); ui.view = "home"; ui.cr = null; ui.sheet = null;
    window.UIX.render(true);
  };
  /* ---------- Anuario: historia real frente a la tuya ---------- */
  function compLabel(key, year) {
    if (key.indexOf("L:") === 0) { var li = W.lgIdx ? W.lgIdx[key.slice(2)] : null; return li != null ? lgName(li) : key.slice(2); }
    var comp = window.EraComps && EraComps.clubComp(key);
    if (comp) return EraComps.naming(comp, year).n;
    return {WC: t("Mundial"), EURO: t("Eurocopa"), CA: t("Copa América")}[key] || key;
  }
  function realLabel(row) {
    if (row.nat) { var ni = W.cIdx[row.real]; return ni != null ? natName(ni) : row.real; }
    var ci = eraRealClub(row.real); return ci >= 0 ? clubName(ci) : row.real;
  }
  function yoursLabel(row) { return row.nat ? natName(row.yours) : clubName(row.yours); }
  function headline(season) {
    var mine = season.rows.filter(function (r) { return r.mine; })[0], diff = season.rows.filter(function (r) { return !r.same; })[0];
    var label = season.rows[0] && season.rows[0].nat ? season.rows[0].year : season.year;
    if (mine) return mine.same ? t("¡{club} gana {comp}, como en la historia real!", {club: yoursLabel(mine), comp: compLabel(mine.key, label)})
      : t("¡{club} gana {comp}! En la realidad fue {real}.", {club: yoursLabel(mine), comp: compLabel(mine.key, label), real: realLabel(mine)});
    if (diff) return t("La historia cambia: {club} gana {comp} (en la realidad, {real}).", {club: yoursLabel(diff), comp: compLabel(diff.key, season.year), real: realLabel(diff)});
    return t("La temporada sigue la historia real.");
  }
  function showYearbook() {
    var book = eraYearbook(); if (!book) return;
    theme(); state.open = true;
    layer = document.getElementById("era-overlay");
    if (!layer) { layer = document.createElement("div"); layer.id = "era-overlay"; layer.className = "eras-overlay"; document.body.appendChild(layer); }
    var pack = eraPackForYear(S.yr), retired = S.ph === "ret" || !!S.retired || !!S.retiredP;
    var body = '<div class="eras-summary"><b>' + t("Divergencia: {n} %", {n: book.divergence}) + '</b><p class="eras-lead" style="margin:6px 0 0">' +
      (book.compared ? t("{c} de {n} títulos han cambiado respecto a la historia real.", {c: book.changed, n: book.compared}) : t("Juega una temporada completa para comparar tu historia con la real.")) + "</p></div>";
    if (retired) {
      var mineRows = [], rewritten = 0;
      book.seasons.forEach(function (season) { season.rows.forEach(function (r) { if (r.mine) { mineRows.push({season: season, row: r}); if (!r.same) rewritten++; } }); });
      body += '<section class="eras-summary"><b>' + t("Documental: tu paso por la historia") + '</b><p class="eras-lead" style="margin:6px 0 0">' +
        t("{t} títulos con tu equipo; {r} de ellos no existían en la historia real.", {t: mineRows.length, r: rewritten}) + "</p>" +
        mineRows.slice(0, 8).map(function (x) { return '<p class="eras-lead" style="margin:4px 0 0">' + eraEscape(x.season.year + " · " + compLabel(x.row.key, x.season.year)) + "</p>"; }).join("") + "</section>";
    }
    body += book.seasons.slice().reverse().map(function (season) {
      return '<section class="eras-paper"><div class="eras-paper-head"><span>' + eraEscape(typeof seasonLabel === "function" ? seasonLabel(season.year) : season.year) + '</span><b>' + eraEscape(headline(season)) + '</b></div><ul class="eras-book">' +
        season.rows.map(function (r) {
          return '<li class="' + (r.same ? "same" : "diff") + (r.mine ? " mine" : "") + '"><span>' + eraEscape(compLabel(r.key, r.nat ? r.year : season.year)) + '</span><small>' + t("Historia real") + ": " + eraEscape(realLabel(r)) + '</small><small>' + t("Tu historia") + ": " + (r.same ? "= " : "≠ ") + eraEscape(yoursLabel(r)) + "</small></li>";
        }).join("") + "</ul></section>";
    }).join("");
    layer.setAttribute("data-era-decade", pack.id);
    layer.innerHTML = '<section class="eras-dialog" data-era-decade="' + eraEscape(pack.id) + '" role="dialog" aria-modal="true" aria-labelledby="eras-book-title"><div class="eras-kicker">' + eraEscape(S.era.startDecade) + '</div><h2 id="eras-book-title">' + t("Anuario de la historia") + "</h2>" + body +
      '<div class="eras-actions"><button type="button" data-era-act="close">' + t("Volver") + "</button></div></section>";
  }
  UIX.actions["era-book"] = function () { showYearbook(); };
  UIX.actions["era-rules"] = function () { showCurrentRules(); };
  UIX.add("after", function () {
    var ui = window.UIX.ui(), active = ERAS_MODE && S && S.era && S.era.active && ui.view !== "home";
    var hud = document.getElementById("era-hud"), app = document.getElementById("app");
    if (!active) {
      if (hud) hud.remove();
      if (app) {
        app.classList.remove("era-skin-teletext", "era-skin-print-scoreboard", "era-active");
        app.removeAttribute("data-era-decade"); app.removeAttribute("data-era-year");
      }
      if (hud) { hud.removeAttribute("data-era-decade"); hud.removeAttribute("data-era-year"); }
      return;
    }
    var info = eraInfoForYear(S.yr), rules = info.rules;
    if (app) {
      app.classList.add("era-active");
      app.classList.toggle("era-skin-teletext", info.presentation.uiSkin === "teletext");
      app.classList.toggle("era-skin-print-scoreboard", info.presentation.uiSkin === "print-scoreboard");
      app.setAttribute("data-era-decade", eraPackForYear(S.yr).id);
      app.setAttribute("data-era-year", S.yr);
    }
    if (!hud) { hud = document.createElement("div"); hud.id = "era-hud"; hud.className = "eras-hud"; }
    /* dentro de la cabecera, en su propia fila: así no tapa el nombre ni el club */
    var top = app && app.querySelector(":scope > header.top");
    if (top) { if (hud.parentNode !== top) top.appendChild(hud); }
    else if (hud.parentNode !== document.body) document.body.appendChild(hud);
    hud.setAttribute("data-era-decade", eraPackForYear(S.yr).id);
    hud.setAttribute("data-era-year", S.yr);
    var currentChannel = channelLabel(eraMediaChannel(S.yr, S.yr + "|" + S.bi));
    hud.innerHTML = '<span>' + t("{decade} · {year}", {decade: eraEscape(S.era.startDecade), year: S.yr}) + ' · ' + t("{n} pts/victoria", {n: rules.winPoints}) + ' · ' + eraEscape(currentChannel) + '</span><button type="button" data-a="era-book">' + t("Anuario") + '</button><button type="button" data-a="era-rules">' + t("Reglas") + '</button><button type="button" data-a="era-exit">' + t("Salir") + '</button>';
  });
  document.addEventListener("change", function (event) {
    var field = event.target && event.target.getAttribute("data-era-field");
    if (!state.open || !field) return;
    var value = event.target.value;
    if (field === "pack") {
      state.packId = value;
      var pack = selectedPack(); state.year = pack.startYear;
    } else if (field === "year") state.year = +value;
    else if (field === "mode") state.mode = value;
    else if (field === "club") state.club = value;
    else if (field === "firstName") state.firstName = value;
    else if (field === "lastName") state.lastName = value;
    renderDialog();
  });
  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest ? event.target.closest("[data-era-act]") : null;
    if (!button) return;
    var action = button.getAttribute("data-era-act"), id = button.getAttribute("data-era-id");
    if (action === "close") close();
    else if (action === "start") start();
    else if (action === "load") load(id);
    else if (action === "delete") { EraStore.remove(id); renderDialog(); }
  });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && state.open) close(); });
})();
