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
      style.textContent = ".eras-hud{position:fixed;z-index:58;top:6px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;max-width:calc(100vw - 16px);padding:5px 7px;border:1px solid rgba(220,190,108,.65);border-radius:12px;background:rgba(7,14,17,.94);box-shadow:0 4px 14px #0008;color:#f3e8c8;font:700 11px/1.2 system-ui,sans-serif}.eras-hud span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.eras-hud button{border:0;border-radius:8px;padding:5px 7px;background:#24343a;color:#fff;font:inherit}.eras-overlay{position:fixed;z-index:1000;inset:0;background:rgba(3,8,10,.88);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px 10px 30px}.eras-dialog{width:min(680px,100%);margin:auto;background:#101c20;color:#e9eee7;border:1px solid rgba(220,190,108,.48);border-radius:18px;padding:18px;box-shadow:0 18px 60px #000b}.eras-dialog h2,.eras-dialog h3{margin:0 0 7px}.eras-kicker{color:#e0bf67;font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.eras-lead{color:#b9c7c2;line-height:1.45}.eras-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.eras-field{display:flex;flex-direction:column;gap:5px;min-width:0}.eras-field label{font-size:.78rem;color:#b9c7c2}.eras-field input,.eras-field select{box-sizing:border-box;width:100%;min-height:42px;border:1px solid #42545a;border-radius:10px;padding:8px 10px;background:#091316;color:#f4f4ee;font:inherit}.eras-summary{margin:14px 0;padding:12px;border-radius:12px;background:#0a1316;border-left:3px solid #d0ae5d}.eras-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.eras-tag{border:1px solid #34474c;border-radius:99px;padding:4px 8px;color:#d8e1da;font-size:.72rem}.eras-actions{display:flex;gap:8px;margin-top:14px}.eras-actions button,.eras-save button{min-height:40px;border:1px solid #43565b;border-radius:10px;padding:8px 12px;background:#1b2a2f;color:#f5f5ee;font:700 .9rem system-ui,sans-serif}.eras-actions .primary{background:#b7913c;color:#141414;border-color:#d7b45f}.eras-save{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid #26363a}.eras-save small{display:block;color:#b9c7c2}.eras-saves{max-height:210px;overflow:auto}.eras-history{margin:8px 0 0;padding-left:22px;color:#d8e1da}.eras-history li{padding:6px 0;border-bottom:1px solid #26363a}.eras-history li span{display:block}.eras-history li small{display:block;color:#b9c7c2;margin-top:2px}.era-skin-teletext .top{border-bottom:2px solid #4ad65a}.era-skin-teletext .top .name,.era-skin-teletext .tag{font-family:ui-monospace,monospace}.era-skin-teletext .card{border-radius:2px}.era-skin-print-scoreboard .top{border-top:3px solid #b58e3f}@media(max-width:520px){.eras-dialog{padding:14px}.eras-grid{grid-template-columns:1fr}.eras-hud{font-size:10px}.eras-hud button{padding:5px}}";
      document.head.appendChild(style);
    }
  }
  function clubOptions(pack) {
    var available = {};
    (DATA.leagues || []).forEach(function (league) { String(league.clubs || "").split("|").forEach(function (name) { if (name) available[name] = true; }); });
    return (pack.referenceClubs || []).filter(function (name) { return !!available[name]; }).map(function (name) { return {id: name, name: name}; });
  }
  function profileSummary(p) {
    var rules = p.rules, media = p.media, presentation = p.presentation, economy = p.economy;
    var social = media.socialMedia ? t("Redes disponibles") : t("Sin redes sociales");
    var implementedVar = !!((rules.varByCompetition || {})["Premier League"] || (rules.varByCompetition || {})["La Liga"]);
    var varText = implementedVar ? t("VAR aplicado solo en Premier League y La Liga cuando la cronología lo permite.") : t("VAR: no disponible");
    var skinText = presentation.uiSkin === "teletext" ? t("Interfaz aplicada: teletexto.") : presentation.uiSkin === "print-scoreboard" ? t("Interfaz aplicada: marcador impreso.") : t("Skin del perfil ({skin}) aún no aplicada; se conserva la interfaz estándar.", {skin: presentation.uiSkin});
    return '<div class="eras-summary"><b>' + t("Reglas en {year}", {year: p.currentYear || state.year}) + '</b><div class="eras-tags">' +
      '<span class="eras-tag">' + t("{n} puntos por victoria", {n: rules.winPoints}) + '</span>' +
      '<span class="eras-tag">' + t("En directo: máximo {n} cambios", {n: rules.maxSubs}) + '</span>' +
      '<span class="eras-tag">' + (rules.transferWindows ? t("Ventanas de fichajes") : t("Sin ventanas obligatorias")) + '</span>' +
      '<span class="eras-tag">' + social + '</span><span class="eras-tag">' + varText + '</span></div>' +
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
    var clubList = clubOptions(pack);
    if (state.mode === "manager") {
      if (!clubList.some(function (club) { return club.id === state.club; })) state.club = clubList.length ? clubList[0].id : "Manchester United";
    } else state.club = "";
    var clubs = state.mode === "manager" ? '<div class="eras-field"><label for="era-club">' + t("Club") + '</label><select id="era-club" data-era-field="club">' + clubList.map(function (club) { return '<option value="' + club.id + '"' + (club.id === state.club ? ' selected' : '') + '>' + eraEscape(club.name) + '</option>'; }).join("") + '</select></div>' : '';
    layer.setAttribute("data-era-decade", pack.id);
    layer.setAttribute("data-era-year", state.year);
    var cover = '<div class="eras-cover" aria-hidden="true"><span class="eras-cover-decade">' + eraEscape(pack.label) + '</span><span class="eras-cover-years">' + pack.years[0] + ' — ' + pack.years[1] + '</span><span class="eras-cover-stamp">' + state.year + '</span></div>';
    layer.innerHTML = '<section class="eras-dialog" data-era-decade="' + eraEscape(pack.id) + '" role="dialog" aria-modal="true" aria-labelledby="eras-title">' + cover + '<div class="eras-kicker">' + t("Modo aislado · guardados separados") + '</div><h2 id="eras-title">' + t("Modo Épocas") + '</h2><p class="eras-lead">' + t("Empieza una carrera en otro momento de la historia. La partida moderna y sus guardados no se modifican.") + '</p>' +
      '<div class="eras-grid"><div class="eras-field"><label for="era-decade">' + t("Década de inicio") + '</label><select id="era-decade" data-era-field="pack">' + packs().map(function (item) { return '<option value="' + item.id + '"' + (item.id === pack.id ? ' selected' : '') + '>' + eraEscape(item.label) + '</option>'; }).join("") + '</select></div>' +
      '<div class="eras-field"><label for="era-year">' + t("Año exacto") + '</label><select id="era-year" data-era-field="year">' + years.map(function (n) { return '<option value="' + n + '"' + (n === state.year ? ' selected' : '') + '>' + n + '</option>'; }).join("") + '</select></div>' +
      '<div class="eras-field"><label for="era-mode">' + t("Tipo de carrera") + '</label><select id="era-mode" data-era-field="mode"><option value="player"' + (state.mode === "player" ? ' selected' : '') + '>' + t("Carrera de jugador") + '</option><option value="manager"' + (state.mode === "manager" ? ' selected' : '') + '>' + t("Carrera de míster") + '</option></select></div>' + clubs +
      '<div class="eras-field"><label for="era-first">' + t("Nombre") + '</label><input id="era-first" data-era-field="firstName" maxlength="18" value="' + eraEscape(state.firstName) + '"></div><div class="eras-field"><label for="era-last">' + t("Apellido") + '</label><input id="era-last" data-era-field="lastName" maxlength="24" value="' + eraEscape(state.lastName) + '"></div></div>' +
      profileSummary(profile(state.year)) + '<div class="eras-actions"><button type="button" class="primary" data-era-act="start">' + t("Empezar en {year}", {year: state.year}) + '</button><button type="button" data-era-act="close">' + t("Volver") + '</button></div>' +
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
  function start() {
    var pack = selectedPack();
    if (state.starting || !pack || state.year < pack.years[0] || state.year > pack.years[1]) return;
    function begin() {
      if (!state.open) { state.starting = false; return; }
      try {
        state.starting = false;
        eraStartWithContext(state.mode, state.year, {firstName: state.firstName.trim() || "Alex", lastName: state.lastName.trim() || "Leyenda", club: -1, clubName: state.mode === "manager" ? state.club : null, nat: "ES"});
        close();
      } catch (e) { fail(e); }
    }
    function fail(error) {
      state.starting = false; console.error(error);
      if (state.open) renderDialog();
      if (window.UIX.toast) window.UIX.toast(t("No se pudo iniciar la carrera de Épocas."));
    }
    try {
      if (S && S.era) { EraStore.save(); begin(); return; }
      if (S && window.UIX.persist) {
        window.UIX.persist();
        var store = window.UIX.store, flushed = store && typeof store.flush === "function" ? store.flush() : null;
        if (flushed && typeof flushed.then === "function") {
          state.starting = true;
          var button = layer && layer.querySelector('[data-era-act="start"]');
          if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); }
          flushed.then(begin).catch(fail);
          return;
        }
      }
      begin();
    } catch (e) { fail(e); }
  }
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
    if (!hud) { hud = document.createElement("div"); hud.id = "era-hud"; hud.className = "eras-hud"; document.body.appendChild(hud); }
    hud.setAttribute("data-era-decade", eraPackForYear(S.yr).id);
    hud.setAttribute("data-era-year", S.yr);
    var currentChannel = channelLabel(eraMediaChannel(S.yr, S.yr + "|" + S.bi));
    hud.innerHTML = '<span>' + t("{decade} · {year}", {decade: eraEscape(S.era.startDecade), year: S.yr}) + ' · ' + t("{n} pts/victoria", {n: rules.winPoints}) + ' · ' + eraEscape(currentChannel) + '</span><button type="button" data-a="era-rules">' + t("Reglas") + '</button><button type="button" data-a="era-exit">' + t("Salir") + '</button>';
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
