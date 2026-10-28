/* ui-life.js — interfaz de VIDA FUERA DEL CAMPO (patch 2.5): dorsal, estilo de vida, look y rivalidad */
(function () {
  if (typeof window === "undefined" || !window.UIX) return;
  var U = window.UIX, h = U.h;
  function on() { return !!(S && S.p && !U.isMgr() && S.p.life); }
  function rer() {
    var pn = document.querySelector(".sheet .panel"), y = pn ? pn.scrollTop : 0;
    U.persist(); U.render(false);
    pn = document.querySelector(".sheet .panel"); if (pn) pn.scrollTop = y;
  }
  function lum(col) {
    col = String(col || "");
    var m = col.match(/^hsl\(\d+,\d+%,(\d+)%\)$/);
    if (m) return +m[1] / 100;
    if (col.charAt(0) !== "#") return 0.5;
    if (col.length === 4) col = "#" + col.charAt(1) + col.charAt(1) + col.charAt(2) + col.charAt(2) + col.charAt(3) + col.charAt(3);
    var r = parseInt(col.substr(1, 2), 16), g = parseInt(col.substr(3, 2), 16), b = parseInt(col.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function ink(col) { return lum(col) > 0.6 ? "#141414" : "#ffffff"; }
  function kitOf(club, gk) {
    var col = club >= 0 && W.clubs[club] && W.clubs[club].col ? W.clubs[club].col : ["#c8102e", "#ffffff"];
    var c1 = col[0], c2 = col[1];
    if (gk) {
      var opts = ["#2bb673", "#c6f432", "#1b1d1f", "#ff7a1a", "#7a3cf0"], k = hashStr(String(club)) % opts.length;
      for (var i = 0; i < opts.length && Math.abs(lum(opts[k]) - lum(c1)) < 0.18; i++) k = (k + 1) % opts.length;
      c2 = c1; c1 = opts[k];
    }
    return {c1: c1, c2: c2, socks: gk ? c1 : c1, sh: gk ? "#1b1d1f" : c2};
  }

  /* ---------- avatar 2D (SVG) ---------- */
  function avatar(look, club, num, gk, cls, cap) {
    var get = function (cat) { return lifeItem(cat, look[cat] || LIFE_COS_DEF[cat]); };
    var skin = get("skin").c, hc = get("hcol").c, hair = (look.hair || "short"), boots = get("boots").c, sl = look.sleeve || "short", band = look.band || "none", gl = get("gloves"), shirtItem = get("shirt");
    var k = kitOf(club, gk), c1 = shirtItem.c || k.c1, c2 = shirtItem.c2 || k.c2, txt = ink(c1) === "#141414" ? (lum(c2) < 0.6 ? c2 : "#141414") : (lum(c2) > 0.45 ? c2 : "#ffffff");
    var armCol = sl === "long" ? c1 : sl === "under" ? "#16191b" : skin, legCol = sl === "tights" ? "#16191b" : skin;
    var s = '<svg class="' + (cls || "lfsvg") + '" viewBox="0 0 120 170" role="img" aria-label="' + h(tr("Tu avatar")) + '">';
    s += '<ellipse cx="60" cy="163" rx="34" ry="5" fill="rgba(0,0,0,.35)"/>';
    /* piernas, medias y botas */
    s += '<rect x="45" y="112" width="11" height="26" rx="4" fill="' + legCol + '"/><rect x="64" y="112" width="11" height="26" rx="4" fill="' + legCol + '"/>';
    s += '<rect x="44.5" y="132" width="12" height="22" rx="3" fill="' + k.socks + '"/><rect x="63.5" y="132" width="12" height="22" rx="3" fill="' + k.socks + '"/>';
    s += '<rect x="44.5" y="134" width="12" height="3" fill="' + c2 + '" opacity=".85"/><rect x="63.5" y="134" width="12" height="3" fill="' + c2 + '" opacity=".85"/>';
    s += '<path d="M43 152h14v5c0 2-1 3-3 3H39c-2 0-3-1-2-3z" fill="' + boots + '"/><path d="M63 152h14l6 5c1 2 0 3-2 3H66c-2 0-3-1-3-3z" fill="' + boots + '"/>';
    /* pantalón */
    s += '<path d="M40 98h40l3 24H63l-3-10-3 10H37z" fill="' + (shirtItem.shorts || k.sh) + '"/>';
    /* brazos */
    s += '<path d="M37 52l-11 22 4 32h8l-1-28 6-14z" fill="' + armCol + '"/><path d="M83 52l11 22-4 32h-8l1-28-6-14z" fill="' + armCol + '"/>';
    if (sl !== "long") s += '<path d="M37 51l-12 21 9 4 9-15z" fill="' + c1 + '"/><path d="M83 51l12 21-9 4-9-15z" fill="' + c1 + '"/><path d="M25 72l9 4" stroke="' + c2 + '" stroke-width="2"/><path d="M95 72l-9 4" stroke="' + c2 + '" stroke-width="2"/>';
    if (cap || band === "cap") s += '<path d="M27 66l10 4-2 5-10-4z" fill="#ffb21e"/><text x="31" y="73.5" font-size="5" font-weight="900" text-anchor="middle" fill="#1d1404" transform="rotate(21 31 71)">C</text>';
    /* manos o guantes */
    if (gk) s += '<rect x="25" y="100" width="14" height="15" rx="5" fill="' + gl.c + '"/><rect x="81" y="100" width="14" height="15" rx="5" fill="' + gl.c + '"/><rect x="25" y="100" width="14" height="4" rx="2" fill="' + gl.c2 + '"/><rect x="81" y="100" width="14" height="4" rx="2" fill="' + gl.c2 + '"/>';
    else s += '<circle cx="34" cy="107" r="5" fill="' + skin + '"/><circle cx="86" cy="107" r="5" fill="' + skin + '"/>';
    /* camiseta y dorsal */
    s += '<path d="M38 48c6-3 14-5 22-5s16 2 22 5l3 8-4 46H39l-4-46z" fill="' + c1 + '"/>';
    var shirt = shirtItem.pattern || look.shirt || LIFE_COS_DEF.shirt;
    if (shirt === "stripes" || shirt === "pinstripe") s += '<path d="M45 46v60h5V45zm13-3v63h5V43zm13 2v61h5V45z" fill="' + c2 + '" opacity=".92"/>';
    else if (shirt === "hoops") s += '<path d="M38 60h45v6H38zm2 16h42v6H40zm1 16h40v5H41z" fill="' + c2 + '" opacity=".94"/>';
    else if (shirt === "sash") s += '<path d="M43 46l9-3 25 59h-9z" fill="' + c2 + '" opacity=".95"/>';
    else if (shirt === "retro") s += '<path d="M51 44l9 8 9-8-4-2h-10z" fill="' + c2 + '"/><path d="M51 44l9 8 9-8" fill="none" stroke="' + c2 + '" stroke-width="2"/>';
    else if (shirt === "diamond") s += '<path d="M47 55l5-5 5 5-5 5zm16 0l5-5 5 5-5 5zm-8 16l5-5 5 5-5 5zm-8 16l5-5 5 5-5 5zm16 0l5-5 5 5-5 5z" fill="' + c2 + '" opacity=".92"/>';
    else if (shirt === "split") s += '<path d="M60 48h23l-4 57H60z" fill="' + c2 + '" opacity=".95"/>';
    else if (shirt === "chevron") s += '<path d="M38 58l22 12 22-12v8L60 80 38 66zm0 22l22 12 22-12v8L60 102 38 88z" fill="' + c2 + '" opacity=".9"/>';
    else if (shirt === "checker") s += '<path d="M42 54h10v10H42zm20 0h10v10H62zM52 64h10v10H52zm20 0h10v10H72zM42 74h10v10H42zm20 0h10v10H62zM52 84h10v10H52zm20 0h10v10H72z" fill="' + c2 + '" opacity=".9"/>';
    else if (shirt === "pixel") s += '<path d="M42 56h8v8h-8zm16 8h8v8h-8zm16-8h8v8h-8zM50 76h8v8h-8zm16 8h8v8h-8zM42 96h8v8h-8zm32 0h8v8h-8z" fill="' + c2 + '"/>';
    else if (shirt === "lightning") s += '<path d="M62 48l-13 27h10l-4 27 18-35H62l8-19z" fill="' + c2 + '"/>';
    else if (shirt === "gradient") s += '<path d="M38 75h46v12H38z" fill="' + c2 + '" opacity=".35"/><path d="M39 90h44v10H39z" fill="' + c2 + '" opacity=".65"/>';
    else if (shirt === "star") s += '<text x="60" y="76" text-anchor="middle" font-size="20" fill="' + c2 + '">★</text><text x="48" y="98" text-anchor="middle" font-size="9" fill="' + c2 + '">★</text><text x="72" y="98" text-anchor="middle" font-size="9" fill="' + c2 + '">★</text>';
    else if (shirt === "triangles") s += '<path d="M42 56l8 12h-16zm27 0l8 12H61zm-14 20l8 12H47zm22 20l8 12H69zm-30 0l8 12H39z" fill="' + c2 + '" opacity=".9"/>';
    s += '<path d="M52 44l8 8 8-8" fill="none" stroke="' + c2 + '" stroke-width="3" stroke-linejoin="round"/>';
    if (num) s += '<text x="60" y="88" text-anchor="middle" font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="900" font-size="24" fill="' + txt + '">' + num + "</text>";
    /* cabeza */
    s += '<rect x="55" y="36" width="10" height="9" fill="' + skin + '"/><circle cx="60" cy="27" r="14" fill="' + skin + '"/><circle cx="46.5" cy="28" r="3" fill="' + skin + '"/><circle cx="73.5" cy="28" r="3" fill="' + skin + '"/>';
    s += '<circle cx="55" cy="28" r="1.5" fill="#1d1612"/><circle cx="65" cy="28" r="1.5" fill="#1d1612"/><path d="M56 34q4 3 8 0" fill="none" stroke="#5a2f22" stroke-width="1.4" stroke-linecap="round"/>';
    if (hair === "short") s += '<path d="M46 25c0-10 7-14 14-14s14 4 14 14c-3-4-8-6-14-6s-11 2-14 6z" fill="' + hc + '"/>';
    else if (hair === "buzz") s += '<path d="M47 24c1-8 6-11 13-11s12 3 13 11c-4-3-8-4-13-4s-9 1-13 4z" fill="' + hc + '" opacity=".75"/>';
    else if (hair === "curly") s += '<g fill="' + hc + '"><circle cx="50" cy="19" r="5"/><circle cx="57" cy="15" r="5.5"/><circle cx="64" cy="15" r="5.5"/><circle cx="70" cy="19" r="5"/><circle cx="47" cy="25" r="3.5"/><circle cx="73" cy="25" r="3.5"/></g>';
    else if (hair === "long") s += '<path d="M46 26c0-11 7-15 14-15s14 4 14 15c-3-5-8-7-14-7s-11 2-14 7z" fill="' + hc + '"/><path d="M72 18c8 2 10 10 7 19-1-6-4-10-8-12z" fill="' + hc + '"/>';
    if (band !== "none" && band !== "cap") {
      var bc = band === "club" ? c1 : get("band").c || "#fff";
      s += '<rect x="46" y="20" width="28" height="4.5" rx="2" fill="' + bc + '"/>' + (band === "club" ? '<rect x="46" y="21.6" width="28" height="1.3" fill="' + c2 + '"/>' : "");
    }
    return s + "</svg>";
  }
  function myLook() { return Object.assign({}, LIFE_COS_DEF, lifeOf().cos); }
  function myAvatar(cls) { var L = lifeOf(); return avatar(myLook(), S.p.club, L.num, isGK(), cls, !!S.p.flags.captain); }

  /* ---------- creación: dorsal preferido ---------- */
  U.add("create", function (c) {
    if (!c || c.kind !== "p" || c.step !== 1) return "";
    var cur = +c.lnum || lifeDefNum(c.pos), cl = (LIFE_CLASSIC[c.pos] || []).slice(), base = c.pos === "POR" ? [1, 13, 25] : [7, 9, 10, 11, 8, 6, 4, 3, 2, 5];
    base.forEach(function (n) { if (cl.indexOf(n) < 0) cl.push(n); });
    if (c.pos === "POR") cl = [1, 13, 25, 12, 30, 31].filter(function (n, i, a) { return a.indexOf(n) === i; });
    var s = '<div class="lfcreate"><div class="lfcnum" aria-hidden="true">' + cur + '</div><div class="grow"><label class="lbl" for="lnum">' + tr("Dorsal preferido") + "</label>";
    s += '<div class="lfchips">' + cl.slice(0, 8).map(function (n) { return '<button class="lfnchip" data-a="lfcnum" data-v="' + n + '" aria-pressed="' + (cur === n) + '">' + n + "</button>"; }).join("") + "</div>";
    s += '<select id="lnum" data-f="lnum" aria-label="' + h(tr("Elige cualquier número del 1 al 99")) + '">' + range(99).map(function (i) { return '<option value="' + (i + 1) + '"' + (cur === i + 1 ? " selected" : "") + ">" + tr("Dorsal {n}", {n: i + 1}) + "</option>"; }).join("") + "</select>";
    s += '<p class="muted lfhint">' + tr("Si en tu club ya lo lleva alguien, te darán el más cercano y podrás pedirlo la temporada siguiente.") + "</p></div></div>";
    return s;
  });
  U.actions.lfcnum = function (b, v) { var c = U.ui().cr; if (c) { c.lnum = +v; U.render(false); } };
  (function () {
    var _nc = newCareer;
    newCareer = function (o) {
      var c = U.ui().cr;
      if (o && o.num == null && c && c.kind === "p") o.num = +c.lnum || lifeDefNum(c.pos);
      return _nc.apply(this, arguments);
    };
  })();

  /* ---------- pestaña Jugador: tarjeta «Fuera del campo» ---------- */
  function money(v) { return fmtMoney(v); }
  U.add("jugador", function () {
    if (!S || !S.p || U.isMgr()) return "";
    var L = lifeOf();
    if (!L.num) lifeSyncNum();
    if (!L.rv && S.p.club >= 0) lifeNewRv();
    var p = S.p, rv = L.rv, act = Object.keys(L.svc).filter(function (k) { return L.svc[k].left > 0; });
    var s = '<section class="card lfhub"><div class="lfhub-top"><div class="lfav">' + myAvatar() + '</div><div class="lfinfo">';
    s += '<div class="eyebrow">' + tr("Fuera del campo") + "</div>";
    s += '<button class="lfnumbtn" data-a="lfopen" data-v="lnum"><b class="num">' + L.num + "</b><span>" + tr("Dorsal") + (L.num !== L.pref ? "<small>" + tr("Prefieres el {n}", {n: L.pref}) + "</small>" : "<small>" + tr("Cambiar") + "</small>") + "</span></button>";
    s += '<div class="lfcel"><span class="eyebrow">' + tr("Celebración") + "</span><b>" + h(tr(lifeCel().n)) + "</b></div>";
    if (act.length) s += '<div class="lfact">' + act.map(function (k) { var d = lifeSvcDef(k); return '<span class="chip up">' + d.ico + " " + h(tr(d.n)) + " · " + L.svc[k].left + "</span>"; }).join("") + "</div>";
    s += "</div></div>";
    s += '<div class="lfbtns"><button class="btn" data-a="lfopen" data-v="lvida">' + tr("Vida y dinero") + (act.length || L.inv.length ? ' <span class="lfbad">' + (act.length + L.inv.length) + "</span>" : "") + '</button><button class="btn" data-a="lfopen" data-v="llook">' + tr("Look y celebración") + "</button></div>";
    if (rv) {
      s += '<button class="lfrvbtn" data-a="lfopen" data-v="lrival"><span class="eyebrow">' + tr("Tu rival") + "</span><span class=\"lfrvrow\">" + U.crest(rv.club) + "<b>" + h(rv.n) + "</b>" + U.flag(rv.ni) + '<span class="lfh2h num" title="' + h(tr("Duelos: ganados, empates, perdidos")) + '">' + rv.h2h.join("·") + "</span></span></button>";
    }
    return s + "</section>";
  });
  U.actions.lfopen = function (b, v) { U.open(v); };

  /* ---------- tras cada render: dorsal en la barra superior y en el cromo ---------- */
  U.add("after", function () {
    if (!on() || U.ui().view !== "game") return "";
    var L = S.p.life, h1 = document.querySelector("header.top .who h1");
    if (h1 && !h1.querySelector(".lftopnum")) h1.insertAdjacentHTML("afterbegin", '<span class="lftopnum num" aria-label="' + h(tr("Dorsal {n}", {n: L.num})) + '">' + L.num + "</span>");
    var cr = document.querySelector(".cromo .ctop");
    if (cr && !cr.querySelector(".lfcrnum")) cr.insertAdjacentHTML("beforeend", '<div class="lfcrnum num" aria-label="' + h(tr("Dorsal {n}", {n: L.num})) + '">' + L.num + "</div>");
    return "";
  });

  /* ---------- hoja: dorsal ---------- */
  U.sheets.lnum = function () {
    var L = lifeOf(), taken = lifeTaken(S.p.club);
    var s = "<h2>" + tr("Tu dorsal") + '</h2><div class="stack"><div class="lfnumhead"><div class="lfcnum">' + L.num + '</div><p class="muted" style="margin:0">' +
      (L.num === L.pref ? tr("Llevas tu número preferido en el {club}.", {club: h(clubName(S.p.club))}) : tr("Prefieres el {n}, pero en el {club} lo lleva {name}. Podrás pedirlo al empezar la temporada.", {n: L.pref, club: h(clubName(S.p.club)), name: h(taken[L.pref] || "—")})) + "</p></div>";
    s += '<div class="lfgrid" role="group" aria-label="' + h(tr("Elige dorsal")) + '">' + range(99).map(function (i) {
      var n = i + 1, t = taken[n], me = n === L.num;
      return '<button class="lfg' + (t ? " tk" : "") + (n === L.pref ? " pf" : "") + '" data-a="lfsetnum" data-v="' + n + '" aria-pressed="' + me + '"' + (t ? ' title="' + h(t) + '" aria-label="' + h(tr("{n}, lo lleva {name}", {n: n, name: t})) + '"' : "") + ">" + n + "</button>";
    }).join("") + "</div>";
    s += '<p class="muted lfhint">' + tr("Tachados: números ocupados en tu club. Si eliges uno ocupado, lo pedirás la próxima temporada.") + "</p>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfsetnum = function (b, v) {
    var r = lifeSetPref(+v);
    if (!r.ok) return;
    U.toast(r.now ? tr("Ahora llevas el {n}.", {n: +v}) : tr("El {n} lo lleva {name}: lo pedirás la próxima temporada.", {n: +v, name: r.by}));
    rer();
  };

  /* ---------- hoja: vida y dinero ---------- */
  function svcChips(d) {
    var m = isGK() ? d.gk : d.att, out = [];
    if (m) Object.keys(m).forEach(function (a) { out.push('<span class="chip up">+' + m[a] + " " + h(tr(ATT_NAMES[a])) + "</span>"); });
    if (d.k === "press") out.push('<span class="chip up">' + tr("+6 % seguidores por tramo") + "</span>");
    if (d.k === "physio") out.push('<span class="chip up">' + tr("Riesgo de lesión −30 %") + "</span>");
    if (d.k === "mental") out.push('<span class="chip up">' + tr("Forma más estable") + "</span>");
    if (d.k === "trainer") out.push('<span class="chip up">' + tr("Más progresión") + "</span>");
    return out.join("");
  }
  U.sheets.lvida = function () {
    var L = lifeOf(), p = S.p;
    var s = "<h2>" + tr("Vida y dinero") + '</h2><div class="stack"><div class="lfmoney"><span class="eyebrow">' + tr("Tu dinero") + '</span><b class="num">' + money(p.money) + "</b></div>";
    s += '<h3 class="lfsec">' + tr("Tu equipo personal") + '</h3><p class="muted lfhint">' + tr("Se paga cada tramo de temporada. Un contrato dura una temporada (5 tramos).") + "</p>";
    LIFE_SVC.forEach(function (d) {
      if (!lifeSvcOk(d)) return;
      var sv = L.svc[d.k], cost = lifeSvcCost(d), active = sv && sv.left > 0;
      s += '<div class="lfrow' + (active ? " on" : "") + '"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + '</small><div class="chips">' + svcChips(d) + "</div>";
      s += '<div class="lfrowf"><span class="muted">' + tr("{cost} por tramo", {cost: money(cost)}) + "</span>";
      if (active) s += '<span class="lfleft">' + trn(sv.left, "Queda {n} tramo", "Quedan {n} tramos") + '</span><button class="btn sm" data-a="lffire" data-v="' + d.k + '">' + tr("Cancelar") + "</button>";
      else s += '<button class="btn sm pri" data-a="lfhire" data-v="' + d.k + '"' + (p.money < cost ? " disabled" : "") + ">" + tr("Contratar") + "</button>";
      s += "</div></div></div>";
    });
    s += '<h3 class="lfsec">' + tr("Inversiones") + '</h3><p class="muted lfhint">' + tr("Se revalorizan (o no) al final de cada temporada. Puedes vender cuando quieras.") + "</p>";
    if (L.inv.length) s += L.inv.map(function (x, i) {
      var d = lifeInvDef(x.k), dif = x.v - x.p;
      return '<div class="lfrow on"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + tr("Compra: {p} ({year}) · Vale: {v}", {p: money(x.p), year: x.y, v: money(x.v)}) + "</small>" +
        '<div class="lfrowf"><span class="' + (dif >= 0 ? "pos" : "neg") + '">' + (dif >= 0 ? "+" : "−") + money(Math.abs(dif)) + '</span><button class="btn sm" data-a="lfsell" data-v="' + i + '">' + tr("Vender") + "</button></div></div></div>";
    }).join("");
    LIFE_INV.forEach(function (d) {
      var risk = d.risk >= 2 ? tr("Riesgo alto") : d.risk >= 1 ? tr("Riesgo medio") : d.risk > 0 ? tr("Riesgo medio-bajo") : tr("Riesgo bajo");
      s += '<div class="lfrow"><span class="lfico" aria-hidden="true">' + d.ico + '</span><div class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + "</small>" +
        '<div class="lfrowf"><span class="muted">' + money(d.price) + " · " + risk + '</span><button class="btn sm pri" data-a="lfinv" data-v="' + d.k + '"' + (p.money < d.price ? " disabled" : "") + ">" + tr("Invertir") + "</button></div></div></div>";
    });
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfhire = function (b, v) {
    var r = lifeHire(v), d = lifeSvcDef(v);
    if (r.ok) U.toast(tr("Contratado: {svc} ({cost}).", {svc: tr(d.n), cost: money(r.cost)}));
    else if (r.poor) U.toast(tr("No te llega el dinero."));
    rer();
  };
  U.actions.lffire = function (b, v) { lifeFire(v); U.toast(tr("Contrato cancelado.")); rer(); };
  U.actions.lfinv = function (b, v) {
    var r = lifeInvest(v);
    if (r.ok) U.toast(tr("Inversión hecha: {inv}.", {inv: tr(lifeInvDef(v).n)}));
    else if (r.full) U.toast(tr("Ya tienes demasiadas inversiones."));
    else if (r.poor) U.toast(tr("No te llega el dinero."));
    rer();
  };
  U.actions.lfsell = function (b, v) { var m = lifeSell(+v); U.toast(tr("Vendido por {v}.", {v: money(m)})); rer(); };

  /* ---------- hoja: look y celebración ---------- */
  function lockTxt(lk) {
    if (!lk) return "";
    if (lk.k === "fame") return "🔒 " + tr("Fama {n}", {n: lk.v});
    if (lk.k === "tro") return "🔒 " + trn(lk.v, "{n} título", "{n} títulos");
    if (lk.k === "cap") return "🔒 " + tr("Ser capitán");
    return money(lk.v);
  }
  function cosRow(cat, label, swatch) {
    var cur = lifeCos(cat), items = LIFE_COS[cat] || [], pageSize = 18, ui = U.ui();
    ui.lfcosPage = ui.lfcosPage || {};
    var pages = Math.max(1, Math.ceil(items.length / pageSize)), page = clamp(+ui.lfcosPage[cat] || 0, 0, pages - 1);
    ui.lfcosPage[cat] = page;
    var shown = items.slice(page * pageSize, (page + 1) * pageSize);
    var out = '<div class="lfcos"><span class="lbl">' + h(label) + '</span><div class="lfopts' + (swatch ? " sw" : "") + '">' + shown.map(function (it) {
      var lk = lifeLocked(cat, it), sel = cur === it.id, statMap = cat === "shirt" ? (isGK() ? it.gk : it.att) : null;
      var statTxt = statMap ? Object.keys(statMap).filter(function (k) { return statMap[k]; }).map(function (k) {
        var nm = typeof ATT_NAMES !== "undefined" && ATT_NAMES[k] ? ATT_NAMES[k] : k;
        return "+" + statMap[k] + " " + nm;
      }).join(" · ") : "";
      var inner = swatch ? '<i style="background:' + it.c + '"></i>' : "<b>" + h(tr(it.n)) + "</b>" + (statTxt ? '<small class="lfstats">' + h(statTxt) + "</small>" : "") + (lk ? "<small>" + h(lockTxt(lk)) + "</small>" : "");
      if (swatch && it.n) inner += "<b>" + h(tr(it.n)) + "</b>" + (lk ? "<small>" + h(lockTxt(lk)) + "</small>" : "");
      return '<button class="lfo' + (lk ? " lk" : "") + '" data-a="lfcos" data-k="' + cat + '" data-v="' + it.id + '" aria-pressed="' + sel + '"' + (swatch && !it.n ? ' aria-label="' + h(tr("Tono {n}", {n: it.id.slice(1)})) + '"' : "") + ">" + inner + "</button>";
    }).join("") + "</div>";
    if (pages > 1) out += '<div class="lfpages" style="display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:6px 0 12px"><button class="btn sm" data-a="lfcpage" data-k="' + cat + '" data-v="' + Math.max(0, page - 1) + '" aria-label="' + h(tr("Página anterior")) + '"' + (page === 0 ? " disabled" : "") + '>‹</button><span class="muted">' + tr("Página {page} de {pages}", {page: page + 1, pages: pages}) + '</span><button class="btn sm" data-a="lfcpage" data-k="' + cat + '" data-v="' + Math.min(pages - 1, page + 1) + '" aria-label="' + h(tr("Página siguiente")) + '"' + (page === pages - 1 ? " disabled" : "") + '>›</button></div>';
    return out + "</div>";
  }
  U.sheets.llook = function () {
    var gk = isGK();
    var s = "<h2>" + tr("Look y celebración") + '</h2><div class="stack"><div class="lflookprev">' + myAvatar("lfsvg big") + '<div><span class="eyebrow">' + tr("Celebración") + "</span><b>" + h(tr(lifeCel().n)) + '</b><p class="muted lfhint">' + tr("Algunas piezas se desbloquean con fama, títulos o dinero.") + "</p></div></div>";
    s += cosRow("cel", tr("Celebración"));
    if (gk) s += cosRow("gloves", tr("Guantes"), true);
    s += cosRow("boots", tr("Botas"), true);
    s += cosRow("shirt", tr("Diseño de camiseta"));
    s += cosRow("sleeve", tr("Mangas y mallas"));
    s += cosRow("band", tr("Cinta"));
    s += cosRow("skin", tr("Piel"), true);
    s += cosRow("hair", tr("Pelo"));
    s += cosRow("hcol", tr("Color de pelo"), true);
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfcpage = function (b, v) {
    var cat = b.getAttribute("data-k"), ui = U.ui(); ui.lfcosPage = ui.lfcosPage || {}; ui.lfcosPage[cat] = +v || 0; rer();
  };
  U.actions.lfcos = function (b, v) {
    var cat = b.getAttribute("data-k"), r = lifeSetCos(cat, v);
    if (!r.ok && r.lock) U.toast(r.poor ? tr("No te llega el dinero ({v}).", {v: money(r.lock.v)}) : tr("Bloqueado: {req}.", {req: lockTxt(r.lock).replace("🔒 ", "")}));
    else if (r.paid) U.toast(tr("Comprado por {v}.", {v: money(r.paid)}));
    rer();
  };

  /* ---------- hoja: rivalidad ---------- */
  function avg(o) { return o.rn ? o.rs / o.rn : 0; }
  function statRow(lab, a, b, opt) {
    opt = opt || {};
    var fa = opt.fmt ? opt.fmt(a) : a, fb = opt.fmt ? opt.fmt(b) : b, win = a === b || a == null || b == null ? 0 : (opt.low ? a < b : a > b) ? 1 : -1;
    var tot = Math.max(1e-9, (+a || 0) + (+b || 0)), pa = opt.low ? (+b || 0) / tot : (+a || 0) / tot;
    if (!(a || b)) pa = 0.5;
    return '<div class="lfst"><span class="a' + (win > 0 ? " w" : "") + '">' + (a == null ? "—" : fa) + '</span><span class="l">' + h(lab) + '<i class="bar"><i style="width:' + Math.round(pa * 100) + '%"></i></i></span><span class="b' + (win < 0 ? " w" : "") + '">' + (b == null ? "—" : fb) + "</span></div>";
  }
  U.sheets.lrival = function () {
    var L = lifeOf(), rv = L.rv, p = S.p, ui = U.ui();
    if (!rv) return "<h2>" + tr("Rivalidad") + '</h2><p class="muted">' + tr("Aún no tienes rival.") + '</p><button class="btn wide" data-a="close">' + tr("Cerrar") + "</button>";
    var mode = ui.lfrv === "c" ? "c" : "s", pair = mode === "c" ? lifeCareerPair() : {me: lifeMySeason(), him: rv.ss}, me = pair.me, him = pair.him, gk = rv.g === "POR";
    var s = "<h2>" + tr("Rivalidad") + '</h2><div class="stack"><div class="lfvs">';
    s += '<div class="lfside">' + myAvatar("lfsvg") + "<b>" + h(lifeMeName()) + '</b><small>' + U.crest(p.club) + " " + h(clubName(p.club)) + '</small><span class="lfovr num">' + ovrInt() + "</span></div>";
    s += '<div class="lfmid"><span class="eyebrow">' + tr("Duelos") + '</span><div class="lfscore num"><b>' + rv.h2h[0] + "</b><i>" + rv.h2h[1] + "</i><b>" + rv.h2h[2] + '</b></div><small class="muted">' + tr("G · E · P") + "</small></div>";
    s += '<div class="lfside">' + avatar(lifeRvLook(rv), rv.club, ((hashStr(rv.n) % 23) + 2), gk, "lfsvg") + "<b>" + h(rv.n) + " " + U.flag(rv.ni) + '</b><small>' + U.crest(rv.club) + " " + h(clubName(rv.club)) + '</small><span class="lfovr num">' + Math.round(rv.ovr) + "</span></div></div>";
    s += '<div class="seg"><button data-a="lfrvm" data-v="s" aria-pressed="' + (mode === "s") + '">' + tr("Temporada {season}", {season: seasonLabel(S.yr)}) + '</button><button data-a="lfrvm" data-v="c" aria-pressed="' + (mode === "c") + '">' + tr("Desde {year}", {year: rv.since}) + "</button></div>";
    s += '<div class="lfstats">';
    s += statRow(tr("Partidos"), me.apps, him.apps);
    if (gk) {
      s += statRow(tr("Porterías a cero"), me.cs, him.cs);
      s += statRow(tr("Goles encajados"), me.gc, him.gc, {low: true});
      s += statRow(tr("Paradas"), me.sv, him.sv);
      var sp = function (o) { return o.sv + o.gc ? o.sv / (o.sv + o.gc) * 100 : null; };
      s += statRow(tr("% de paradas"), sp(me), sp(him), {fmt: function (x) { return fmtDec(x, 1) + " %"; }});
    } else {
      s += statRow(tr("Goles"), me.g, him.g);
      s += statRow(tr("Asistencias"), me.a, him.a);
      if (rv.g === "DEF") s += statRow(tr("Porterías a cero"), me.cs, him.cs);
    }
    s += statRow(tr("Títulos"), me.tro, him.tro);
    s += statRow(tr("Nota media"), me.rn ? avg(me) : null, him.rn ? avg(him) : null, {fmt: function (x) { return fmtDec(x, 2); }});
    s += "</div>";
    var races = lifeRaces();
    if (races.length) {
      s += '<h3 class="lfsec">' + tr("Carreras") + '</h3><div class="kvlist">' + races.map(function (r) {
        var lab = tr(r.n, {year: r.y, nat: r.nat != null ? natName(r.nat) : ""});
        var f = function (x) { return x == null ? "—" : r.rank ? (x ? tr("{n}º", {n: x}) : "—") : r.dec ? fmtDec(x, r.dec) : x; };
        var lead = r.me == null && r.him == null ? "" : r.me == null || (r.me === 0 && r.rank) ? "b" : r.him == null || (r.him === 0 && r.rank) ? "a" : r.me === r.him ? "" : (r.low ? r.me < r.him : r.me > r.him) ? "a" : "b";
        return "<div><span>" + h(lab) + '</span><span class="lfrace"><b class="' + (lead === "a" ? "pos" : "") + '">' + f(r.me) + "</b> – <b class=\"" + (lead === "b" ? "neg" : "") + '">' + f(r.him) + "</b></span></div>";
      }).join("") + "</div>";
    }
    if (rv.hl.length) s += '<h3 class="lfsec">' + tr("Titulares") + '</h3><ul class="news lfnews">' + rv.hl.map(function (x) { return '<li class="' + h(x.t || "ok") + '"><small>' + seasonLabel(x.y) + "</small> " + h(tr(x.tk, x.tp)) + "</li>"; }).join("") + "</ul>";
    if (rv.duels.length) s += '<h3 class="lfsec">' + tr("Últimos duelos") + '</h3><div class="kvlist">' + rv.duels.map(function (d) {
      return "<div><span>" + seasonLabel(d.y) + " · " + (d.nat ? U.flag(d.o) + " " + h(natName(d.o)) : h(clubName(d.o))) + " " + d.gu + "-" + d.gt + '</span><span class="' + (d.r > 0 ? "pos" : d.r < 0 ? "neg" : "") + '">' + fmtDec(d.mr, 1) + " / " + fmtDec(d.hr, 1) + "</span></div>";
    }).join("") + "</div>";
    if (L.rvh.length) s += '<h3 class="lfsec">' + tr("Rivales anteriores") + '</h3><div class="kvlist">' + L.rvh.map(function (x) { return "<div><span>" + U.flag(x.ni) + " " + h(x.n) + " · " + x.a + "–" + x.b + '</span><span class="num">' + x.h.join("·") + "</span></div>"; }).join("") + "</div>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.lfrvm = function (b, v) { U.ui().lfrv = v; rer(); };

  /* ---------- historial: dorsales ---------- */
  U.add("hist", function () {
    if (!on()) return "";
    var L = S.p.life, rows = [];
    S.p.seasons.forEach(function (r) { if (r.num) rows.push([r.y, r.club, r.num]); });
    if (!rows.length) rows = L.nh.slice();
    if (!rows.length) return "";
    return '<section class="card"><h3>' + tr("Dorsales") + '</h3><div class="lfnumhist">' + rows.slice().reverse().map(function (r) {
      return '<div><span class="lfhn num">' + r[2] + "</span><span>" + U.crest(r[1]) + " " + h(clubName(r[1])) + '</span><small class="muted">' + seasonLabel(r[0]) + "</small></div>";
    }).join("") + "</div></section>";
  });
})();
