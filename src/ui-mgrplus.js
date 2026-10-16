/* ui-mgrplus.js — interfaz de MÍSTER+ (patch 2.5): ojeadores, cesiones de entrada, selección, filial,
   charlas rápidas y la opción de ver siempre los partidos en directo. El motor está en mgr-plus.js. */
(function () {
  if (typeof window === "undefined" || !window.UIX || typeof mpOn !== "function") return;
  var U = window.UIX, h = U.h;
  function on() { return mpOn() && U.isMgr(); }
  function rer() {
    var pn = document.querySelector(".sheet .panel"), y = pn ? pn.scrollTop : 0, mn = document.getElementById("main"), my = mn ? mn.scrollTop : 0;
    U.persist(); U.render(false);
    pn = document.querySelector(".sheet .panel"); if (pn) pn.scrollTop = y;
    mn = document.getElementById("main"); if (mn) mn.scrollTop = my;
  }
  function stars(n) { var s = ""; for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆"; return '<span class="mpst" aria-label="' + h(tr("{n} estrellas", {n: n})) + '">' + s + "</span>"; }
  function chips(l) { return (l || []).map(U.chip).join(""); }

  /* ---------- MERCADO: red de ojeadores y cesiones ---------- */
  function foldOpen(k, def) { var f = U.ui().fold || {}; return f[k] == null ? def : f[k]; }
  U.add("mercado", function () {
    if (!on() || S.m.club < 0) return "";
    var m = S.m, sc = mpSc(), regs = mpRegions(), o = '<details class="card mpcard fold" data-fold="scouts"' + (foldOpen("scouts", !sc.l.length) ? " open" : "") + '><summary class="head"><span class="tag real"><span class="dot"></span>' + tr("Ojeadores") + '</span><span class="eyebrow">' + tr("{n}/{max} en plantilla", {n: sc.l.length, max: MP_SC_MAX}) + '<span class="fchev" aria-hidden="true">›</span></span></summary>';
    o += '<p class="muted mpnote">' + tr("Cada ojeador te trae informes al empezar cada tramo. Con más estrellas, el potencial que ves es más fiable; con más viajes, encuentra más jugadores.") + "</p>";
    if (sc.l.length) {
      o += '<div class="mplist">' + sc.l.map(function (s) {
        return '<div class="mprow"><div class="grow"><b>' + h(s.fn + " " + s.ln) + "</b> " + stars(s.st) + '<small class="muted">' + tr("{sal}/año · {n} informes", {sal: fmtMoney(s.sal), n: s.n || 0}) + "</small>" +
          '<div class="mpctl"><select data-mp="reg" data-id="' + s.id + '" aria-label="' + h(tr("Región")) + '">' + regs.map(function (r) { return '<option value="' + h(r.k) + '"' + (r.k === s.reg ? " selected" : "") + ">" + h(r.n) + "</option>"; }).join("") + "</select>" +
          '<div class="seg sm">' + [0, 1, 2].map(function (lv) { return '<button data-a="mpsclv" data-id="' + s.id + '" data-v="' + lv + '" aria-pressed="' + (s.lv === lv) + '" title="' + h(lv ? tr("Viajes: {c} por tramo", {c: fmtMoney(mpScTrip(lv))}) : tr("Sin viajes")) + '">' + [tr("Local"), tr("Viajes"), tr("Mundo")][lv] + "</button>"; }).join("") + "</div></div></div>" +
          '<button class="btn sm" data-a="mpscfire" data-id="' + s.id + '">' + tr("Despedir") + "</button></div>";
      }).join("") + "</div>";
    }
    if (sc.l.length < MP_SC_MAX) {
      o += '<div class="lbl" style="margin-top:10px">' + tr("Candidatos") + '</div><div class="mplist">' + mpScCands().map(function (c, i) {
        var can = m.bud >= c.sal;
        return '<div class="mprow"><div class="grow"><b>' + h(c.fn + " " + c.ln) + "</b> " + stars(c.st) + '<small class="muted">' + tr("{sal}/año", {sal: fmtMoney(c.sal)}) + "</small></div>" +
          '<button class="btn sm pri" data-a="mpschire" data-v="' + i + '"' + (can ? "" : " disabled") + ">" + (can ? tr("Contratar") : tr("Sin presupuesto")) + "</button></div>";
      }).join("") + "</div>";
    }
    /* cesiones de entrada */
    var loans = (m.mk && m.mk.open ? (m.mk.list || []) : []).filter(function (t) { return mpLoanInOk(t) && t.age <= 26; }).slice(0, 4);
    if (loans.length) {
      o += '<div class="lbl" style="margin-top:12px">' + tr("Pedir cedido") + '</div><div class="mplist">' + loans.map(function (t) {
        return '<div class="mprow"><div class="grow"><b>' + h(t.fn + " " + t.ln) + '</b><small class="muted">' + h(posAb(t.pos)) + " · " + Math.round(t.ovr) + " · " + h(clubName(t.club)) + "</small></div>" +
          '<button class="btn sm" data-a="mploan" data-id="' + h(t.id) + '">' + tr("Cesión") + "</button></div>";
      }).join("") + '</div><p class="muted mpnote">' + tr("Cesión de un año, con opción u obligación de compra al final.") + "</p>";
    }
    return o + "</details>";
  });
  U.actions.mpschire = function (b, v) { if (!mpScHire(+v)) U.toast(tr("No puedes contratar a más ojeadores ahora.")); rer(); };
  U.actions.mpscfire = function (b, v, id) { mpScFire(+id); rer(); };
  U.actions.mpsclv = function (b, v, id) { mpScSet(+id, "lv", +v); rer(); };
  U.actions.mploan = function (b, v, id) { if (mpStartLoanIn(id)) { U.persist(); U.open("pend"); U.render(false); } else U.toast(tr("Ahora no se puede negociar.")); };
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t.getAttribute || t.getAttribute("data-mp") !== "reg") return;
    mpScSet(+t.getAttribute("data-id"), "reg", t.value); U.persist();
  });

  /* ---------- CLUB: selección y filial ---------- */
  U.add("club", function () {
    if (!on()) return "";
    var o = "", nt = mpNT(), fil = mpFil();
    if (nt) {
      var sq = mpNatSquad(), r = mpNatRating();
      o += '<section class="card mpcard"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Selección") + '</span><span class="eyebrow">' + (nt.ex ? tr("Dedicación exclusiva") + " · " : "") + tr("Contrato hasta {y}", {y: nt.end}) + "</span></div>";
      o += "<h3>" + U.flag(nt.ni) + " " + h(mpNatLabel(nt.ni)) + '</h3><div class="statline"><div class="stat"><b>' + r + "</b><span>" + tr("Nivel") + '</span></div><div class="stat"><b>' + sq.length + "</b><span>" + tr("Convocados") + '</span></div><div class="stat"><b>' + nt.w + "-" + nt.d + "-" + nt.l + "</b><span>" + tr("Balance") + "</span></div></div>";
      o += '<div class="row2" style="margin-top:10px"><button class="btn wide" data-a="mpnatsq">' + tr("Convocatoria") + '</button><button class="btn wide" data-a="mpnatauto">' + tr("Convocatoria automática") + "</button></div>";
      if (nt.log && nt.log.length) o += '<div class="kvlist" style="margin-top:10px">' + nt.log.slice(0, 4).map(function (g) { return "<div><span>" + h(mpNatCmpName(g)) + " · " + h(natName(g.opp)) + '</span><span class="num">' + (g.gu + (g.eu || 0)) + "-" + (g.gt + (g.ett || 0)) + "</span></div>"; }).join("") + "</div>";
      o += "</section>";
    }
    if (fil) {
      o += '<section class="card mpcard"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Filial") + '</span><span class="eyebrow">' + h(clubName(fil.par)) + "</span></div><h3>" + tr("Objetivos para subir al primer equipo") + '</h3><div class="mpobjs">' +
        mpFilProgress().map(function (x) { return '<div class="mpobj' + (x.met ? " ok" : "") + '"><span>' + (x.met ? "✅" : "⬜") + "</span><div><b>" + h(tr(x.n)) + "</b><small class=\"muted\">" + h(x.txt || "") + "</small></div></div>"; }).join("") +
        '</div><p class="muted mpnote">' + tr("Cumple dos de los tres y, al acabar la temporada, el primer equipo te llamará.") + "</p></section>";
    }
    return o;
  });
  U.actions.mpnatauto = function () { mpNatAutoSet(); U.toast(tr("Convocatoria hecha por tu cuerpo técnico")); rer(); };
  U.actions.mpnatsq = function () { U.open("mpnatsq"); };
  U.actions.mpnattg = function (b, v) { if (!mpNatToggle(v)) U.toast(tr("Máximo 26 convocados")); U.persist(); U.renderSheet(); };
  U.sheets.mpnatsq = function () {
    var nt = mpNT(); if (!nt) return "";
    var pool = mpNatPool(nt.ni), sq = mpNatSquad(), on2 = {};
    sq.forEach(function (k) { on2[k] = 1; });
    var o = "<h2>" + tr("Convocatoria") + '</h2><p class="muted" style="margin:-6px 0 10px">' + h(mpNatLabel(nt.ni)) + " · " + tr("{n}/26 convocados · nivel {r}", {n: sq.length, r: mpNatRating()}) + "</p>";
    ["POR", "DEF", "MED", "DEL"].forEach(function (g) {
      var l = pool.filter(function (x) { return W.pos[x.pos].g === g; }).slice(0, 18);
      if (!l.length) return;
      o += '<div class="sgroup">' + h(g) + "</div>" + l.map(function (x) {
        return '<button class="pickrow mpnat" data-a="mpnattg" data-v="' + h(x.k) + '" aria-pressed="' + !!on2[x.k] + '"><span class="pp">' + h(posAb(x.pos)) + '</span><div class="grow"><b>' + h((x.fn ? x.fn.charAt(0) + ". " : "") + x.ln) + (x.mine ? " ⭐" : "") + '</b><small class="muted">' + h(x.club != null && x.club >= 0 ? clubName(x.club) : "") + '</small></div><span class="lvl">' + Math.round(x.ovr) + "</span></button>";
      }).join("");
    });
    return o + '<button class="btn wide" style="margin-top:12px" data-a="close">' + tr("Cerrar") + "</button>";
  };

  /* ---------- PLANTILLA: charlas rápidas ---------- */
  U.add("plantilla", function () {
    if (!on() || S.m.club < 0) return "";
    var l = mActive().filter(mpQtCan).slice(0, 4);
    if (!l.length) return "";
    var lab = {min: tr("Quiere más minutos"), con: tr("Le preocupa su contrato"), req: tr("Quiere irse")};
    return '<details class="card mpcard fold" data-fold="talks"' + (foldOpen("talks", false) ? " open" : "") + '><summary class="head"><span class="tag hot"><span class="dot"></span>' + tr("Charlas rápidas") + '</span><span class="eyebrow">' + trn(l.length, "{n} jugador quiere hablar", "{n} jugadores quieren hablar") + '<span class="fchev" aria-hidden="true">›</span></span></summary>' +
      l.map(function (p) {
        var k = mpQtIssue(p);
        return '<div class="mpqt"><div class="mpqth"><b>' + h(plName(p)) + '</b><span class="chip">' + h(lab[k] || "") + '</span><small class="muted">' + tr("Moral {n}", {n: Math.round(p.mor)}) + "</small></div><div class=\"mpqto\">" +
          mpQtOpts(p, k).map(function (o, i) { return '<button class="opt sm" data-a="mpqt" data-id="' + p.id + '" data-v="' + i + '"><b>' + h(o.t) + '</b><span class="chips">' + chips(mpQtPreview(p, o)) + "</span></button>"; }).join("") + "</div></div>";
      }).join("") + "</details>";
  });
  U.actions.mpqt = function (b, v, id) {
    var card = mpQuickTalk(+id, +v);
    if (card) { U.edgeFlash(true); U.toast(card.choice); }
    U.persist();
    if (S.pend[0] && S.pend[0].ui) { U.open("pend"); U.render(false); } else rer();
  };

  /* ---------- MENÚ: ver siempre los partidos ---------- */
  U.add("menu", function () {
    if (!on()) return "";
    var a = mpAlwaysLive();
    return '<button class="pickrow" data-a="mplive" aria-pressed="' + a + '"><div class="grow"><b>' + tr("Ver siempre los partidos en directo") + "</b><small>" + tr("Te preguntará en cada partido si lo ves o lo simulas, en cualquier ritmo de decisiones.") + "</small></div></button>";
  });
  U.actions.mplive = function () { mpSetAlwaysLive(!mpAlwaysLive()); U.persist(); U.renderSheet(); };
})();
