/* ui-35.js — versión 3.5 «A tu manera»: editor de la partida, temas visuales, carrera rápida,
   avisos en el móvil (app Android) y copias de seguridad automáticas. */
(function () {
  if (typeof UIX === "undefined" || typeof edOf !== "function") return;
  var U = UIX, h = U.h;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function ldel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---------- temas ---------- */
  var THEMES = [["night", N_("Noche")], ["day", N_("Día de partido")], ["retro", N_("Retro")]];
  function themeGet() { var t = lget("camino.theme"); return t === "day" || t === "retro" ? t : "night"; }
  function themeApply(t) { var el = document.documentElement; if (!el) return; el.classList.remove("th-day", "th-retro"); if (t !== "night") el.classList.add("th-" + t); }
  themeApply(themeGet());
  function themeBlock() {
    var t = themeGet();
    return '<div><label class="lbl">' + tr("Tema") + '</label><div class="seg">' + THEMES.map(function (x) { return '<button data-a="theme" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + h(tr(x[1])) + "</button>"; }).join("") + "</div></div>";
  }
  U.actions.theme = function (b, v) { lset("camino.theme", v); themeApply(v); U.renderSheet(); U.render(false); var d = document.querySelector("details.a11y"); if (d) d.open = true; };
  if (U.sheets.a11y) { var _a = U.sheets.a11y; U.sheets.a11y = function () { return _a.apply(this, arguments).replace('<button class="btn wide" data-a="close">', themeBlock() + '<button class="btn wide" data-a="close">'); }; }

  /* ---------- avisos en el móvil (solo en la app de Android) ---------- */
  function bridge() { return window.AndroidBridge && typeof window.AndroidBridge.remind === "function" ? window.AndroidBridge : null; }
  function notifOn() { return lget("camino.notif") === "1"; }
  function remindText() {
    if (!S) return [tr("Tu carrera te espera"), tr("Vuelve a «Fútbol: Camino a la Leyenda» y sigue escribiendo tu historia.")];
    if (S.mode === "mgr" && S.m && S.m.mk && S.m.mk.open && S.m.club >= 0) return [tr("El mercado sigue abierto"), tr("Aún puedes reforzar al {club} antes de que cierre el mercado.", {club: clubName(S.m.club)})];
    if (S.pend && S.pend.length) return [tr("Tienes decisiones pendientes"), tr("Tu vestuario espera una respuesta. Entra a decidir.")];
    return [tr("La temporada sigue"), tr("Tu próximo partido te espera. ¿Seguimos?")];
  }
  document.addEventListener("visibilitychange", function () {
    var b = bridge(); if (!b) return;
    try {
      if (document.hidden) { if (notifOn()) { var t = remindText(); b.remind(t[0], t[1], 20 * 60); } }
      else b.cancelRemind();
    } catch (e) {}
  });
  U.actions.notif = function (b, v) {
    lset("camino.notif", v === "1" ? "1" : "0");
    var br = bridge();
    if (br && v === "1" && typeof br.askNotify === "function") { try { br.askNotify(); } catch (e) {} }
    U.renderSheet();
  };

  /* ---------- copias de seguridad ---------- */
  var BK_MAX = 2;
  function bkKey(id) { return "camino.bk." + id; }
  function bkList(id) { try { return JSON.parse(lget(bkKey(id)) || "[]") || []; } catch (e) { return []; } }
  var bkBusy = false;
  U.add("after", function () {
    if (!S || !S.uid || bkBusy || U.ui().view !== "game" || typeof U.pack !== "function") return;
    var tag = S.yr + "|" + (S.mode === "mgr" ? (S.m ? S.m.seasons.length : 0) : (S.p ? S.p.seasons.length : 0));
    if (S.bkTag === tag) return;
    var first = !S.bkTag; S.bkTag = tag;
    if (first && bkList(S.uid).length) return;
    bkBusy = true;
    var id = S.uid, y = S.yr, json = serialize();
    U.pack(json).then(function (pk) {
      var code = "CAMINO1:" + (pk.z ? "z:" + pk.d : "j:" + U.b64(new TextEncoder().encode(pk.d)));
      var l = bkList(id).concat([{ts: Date.now(), y: y, code: code}]).slice(-BK_MAX);
      while (l.length && !lset(bkKey(id), JSON.stringify(l))) l.shift();
      if (!l.length) ldel(bkKey(id));
    }).catch(function () {}).then(function () { bkBusy = false; });
  });
  U.actions.bkrestore = function (b, v) {
    var l = S ? bkList(S.uid) : [], x = l[+v]; if (!x) return;
    if (!window.confirm(tr("Volverás a la copia de {s}. Lo que hayas jugado después se perderá. ¿Seguir?", {s: seasonLabel(x.y)}))) return;
    U.importCode(x.code);
  };

  /* ---------- menú: tema, avisos y copias ---------- */
  U.add("menu", function () {
    var o = '<details class="fold a11y35"><summary>' + tr("Tema, avisos y copias") + '</summary><div class="stack">' + themeBlock();
    if (bridge()) o += '<div><label class="lbl">' + tr("Avisos en el móvil") + '</label><div class="seg"><button data-a="notif" data-v="1" aria-pressed="' + notifOn() + '">' + tr("Activados") + '</button><button data-a="notif" data-v="0" aria-pressed="' + !notifOn() + '">' + tr("Desactivados") + '</button></div><p class="muted" style="font-size:13px;margin:6px 0 0">' + tr("Si no juegas en un día, te recordamos el cierre del mercado o tus decisiones pendientes.") + "</p></div>";
    if (S && S.uid) {
      var l = bkList(S.uid);
      o += '<div><label class="lbl">' + tr("Copias de seguridad") + "</label>" + (l.length ? '<ul class="dlist">' + l.slice().reverse().map(function (x, i) {
        var idx = l.length - 1 - i;
        return '<li><span aria-hidden="true">💾</span><span class="grow">' + h(seasonLabel(x.y)) + ' · <small class="muted">' + h(new Date(x.ts).toLocaleDateString(LANG)) + '</small></span><button class="btn sm" data-a="bkrestore" data-v="' + idx + '">' + tr("Restaurar") + "</button></li>";
      }).join("") + "</ul>" : '<p class="muted" style="font-size:13px;margin:0">' + tr("Se guarda una copia sola al empezar cada temporada.") + "</p>") + "</div>";
    }
    return o + "</div></details>";
  });

  /* ---------- carrera rápida ---------- */
  function quickChip() { var n = quickLeft(); return n >= 0 ? '<div class="qchip">⏱️ ' + trn(n, "Carrera rápida: queda {n} temporada", "Carrera rápida: quedan {n} temporadas") + "</div>" : ""; }
  U.add("carreraTop", function () { return S && S.mode !== "mgr" && S.ph !== "ret" ? quickChip() : ""; });
  U.add("clubTop", function () { return S && S.mode === "mgr" && S.ph !== "ret" ? quickChip() : ""; });

  /* ---------- editor de la partida ---------- */
  U.actions.editor = function () { var ui = U.ui(); ui.edTab = ui.edTab || "cl"; if (ui.edLg == null) { var me = U.myClub(); ui.edLg = me >= 0 ? S.cl[me] : 0; } U.open("editor"); };
  U.actions.edtab = function (b, v) { U.ui().edTab = v; U.renderSheet(); };
  function hex(c) {
    c = String(c || "");
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
    var m = /^hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/.exec(c);
    if (m) {
      var H = +m[1] / 360, Sa = +m[2] / 100, L = +m[3] / 100, q = L < 0.5 ? L * (1 + Sa) : L + Sa - L * Sa, p0 = 2 * L - q;
      var f = function (t) { t = (t + 1) % 1; var v = t < 1 / 6 ? p0 + (q - p0) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p0 + (q - p0) * (2 / 3 - t) * 6 : p0; return ("0" + Math.round(v * 255).toString(16)).slice(-2); };
      return "#" + f(H + 1 / 3) + f(H) + f(H - 1 / 3);
    }
    return "#888888";
  }
  U.sheets.editor = function () {
    var ui = U.ui(), tab = ui.edTab || "cl", li = +ui.edLg || 0, s = "<h2>" + tr("Editor de la partida") + '</h2><div class="stack"><p class="muted" style="margin:0;font-size:13px">' + tr("Los cambios solo afectan a esta partida. Deja un campo vacío para volver al original.") + "</p>";
    s += '<div class="seg"><button data-a="edtab" data-v="cl" aria-pressed="' + (tab === "cl") + '">' + tr("Clubes") + '</button><button data-a="edtab" data-v="cp" aria-pressed="' + (tab === "cp") + '">' + tr("Ligas y copas") + "</button></div>";
    if (tab === "cl") {
      s += '<label class="lbl" for="edlg">' + tr("Liga") + '</label><select id="edlg">' + W.lg.map(function (l, i) { return '<option value="' + i + '"' + (i === li ? " selected" : "") + ">" + W.ctry[l.ci].flag + " " + h(lgName(i)) + "</option>"; }).join("") + "</select>";
      s += '<ul class="edlist">' + (S.L && S.L[li] ? S.L[li].tm : W.lg[li].cl0).map(function (c) {
        var cl = W.clubs[c], e = edClub(c) || {}, col = e.col || [];
        return '<li data-ed="' + c + '">' + U.crest(c) + '<input class="edn" maxlength="30" value="' + h(e.n || "") + '" placeholder="' + h(cl.n) + '" aria-label="' + h(tr("Nombre")) + '"><input class="edab" maxlength="4" value="' + h(e.ab || "") + '" placeholder="' + h(cl.ab) + '" aria-label="' + h(tr("Abreviatura")) + '">' +
          '<input type="color" class="edc0" value="' + hex(col[0] || cl.col[0]) + '" aria-label="' + h(tr("Color principal")) + '"><input type="color" class="edc1" value="' + hex(col[1] || cl.col[1]) + '" aria-label="' + h(tr("Color secundario")) + '"></li>';
      }).join("") + "</ul>";
    } else {
      var me = U.myClub(), ci = me >= 0 && W.lg[S.cl[me]] ? W.lg[S.cl[me]].ci : -1, names = [];
      W.lg.forEach(function (l) { if (l.ci === ci) names.push(l.n); });
      Object.keys(S.C || {}).forEach(function (k) { var c = S.C[k]; if (c && c.n && (!c.dom || c.ci === ci) && names.indexOf(c.n) < 0) names.push(c.n); });
      s += '<ul class="edlist cp">' + names.map(function (n) { var cur = S.ed && S.ed.cp && S.ed.cp[n]; var sv = S.ed && S.ed.cp; if (sv) delete S.ed.cp[n]; var orig = femComp(n); if (cur) S.ed.cp[n] = cur; return '<li data-cp="' + h(n) + '"><input class="edcp" maxlength="40" value="' + h(cur || "") + '" placeholder="' + h(orig) + '" aria-label="' + h(orig) + '"></li>'; }).join("") + "</ul>";
    }
    return s + '<div class="row2"><button class="btn wide" data-a="close">' + tr("Cancelar") + '</button><button class="btn pri wide" data-a="edsave">' + tr("Guardar") + "</button></div></div>";
  };
  U.actions.edsave = function () {
    document.querySelectorAll(".edlist li[data-ed]").forEach(function (li) {
      var c = +li.getAttribute("data-ed"), cl = W.clubs[c], q = function (s) { return li.querySelector(s); };
      var c0 = q(".edc0").value, c1 = q(".edc1").value;
      edSetClub(c, {n: q(".edn").value, ab: q(".edab").value, col: [c0 !== hex(cl.col[0]) ? c0 : null, c1 !== hex(cl.col[1]) ? c1 : null]});
    });
    document.querySelectorAll(".edlist li[data-cp]").forEach(function (li) { edSetComp(li.getAttribute("data-cp"), li.querySelector(".edcp").value); });
    U.ui().sheet = null; U.persist(); U.render(false); U.toast(tr("Cambios guardados."));
  };
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "edlg") { U.ui().edLg = +e.target.value; U.renderSheet(); } });
})();
