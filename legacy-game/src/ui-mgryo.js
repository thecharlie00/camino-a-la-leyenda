/* ui-mgryo.js — zona «Tu míster» (5.6): retrato vóxel animado con la ropa equipada, estadísticas del
   míster (base + ropa), equipamiento, tienda, vitrina, mascota, retos, trofeos y título. */
(function () {
  if (typeof UIX === "undefined" || typeof GXM === "undefined") return;
  var U = UIX, h = U.h;
  function rm() { return document.documentElement.classList.contains("rm"); }
  var SN = {tac: N_("Táctica"), mot: N_("Motivación"), ves: N_("Vestuario"), pre: N_("Prensa"), jov: N_("Jóvenes"), fis: N_("Físico"), neg: N_("Negociación"), lec: N_("Lectura")};
  /* ---------- aspecto del míster (ropa equipada y la piel y el pelo del jugador que fue) ---------- */
  function look() { return PLook.coach(); }
  /* ctx: la ocasión (partido importante, frío…) decide traje, chándal y abrigo; sin ctx, lo de «Tu míster» */
  U.coachLook = function (ctx) { if (!S || S.mode !== "mgr") return null; var o = PLook.coach(ctx); return {suit: o.coat || o.suit, trousers: o.suit, tie: o.tie, shoes: o.shoes, skin: o.skin, hair: o.hair, fem: S.g === "f", rig: PLook.coachRig(o)}; };
  /* ---------- figura vóxel: tres poses (reposo, brazos cruzados, señalando) ---------- */
  function fig(o, pose) {
    var V = {};
    function box(x0, x1, y0, y1, z0, z1, c) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) V[x + "," + y + "," + z] = c; }
    var jk = o.coat || o.suit;
    box(-3, 3, 0, 0, -3, 3, "#24343a");
    box(-2, -1, 1, 1, -1, 1, o.shoes); box(1, 2, 1, 1, -1, 1, o.shoes);
    box(-2, -1, 2, 8, -1, 0, o.suit); box(1, 2, 2, 8, -1, 0, o.suit);
    box(-3, 3, 9, 16, -1, 1, jk); box(-1, 1, 12, 16, 2, 2, o.shirt); box(0, 0, 10, 15, 2, 2, o.tie); if (o.coat) box(-3, 3, 7, 8, -1, 1, jk);
    if (o.scarf) { box(-2, 2, 16, 16, -1, 2, o.scarf); box(1, 1, 11, 15, 2, 2, o.scarf); }
    box(-1, 1, 17, 17, -1, 1, o.skin); box(-2, 2, 18, 21, -2, 2, o.skin); box(-2, 2, 22, 22, -2, 2, o.hair); box(-2, 2, 19, 21, -2, -2, o.hair);
    V["-1,20,2"] = "#141a1c"; V["1,20,2"] = "#141a1c"; V["0,18,2"] = "#8a4a3a";
    if (o.glasses) { box(-2, -1, 20, 20, 3, 3, o.glasses); box(1, 2, 20, 20, 3, 3, o.glasses); V["0,20,3"] = o.glasses; }
    if (pose === "cross") { box(-3, 3, 12, 13, 2, 3, jk); box(-1, 1, 12, 12, 4, 4, o.skin); box(-4, -4, 11, 16, -1, 1, jk); box(4, 4, 11, 16, -1, 1, jk); }
    else if (pose === "point") { box(-4, -4, 9, 16, -1, 0, jk); V["-4,8,0"] = o.skin; box(4, 9, 16, 16, 0, 1, jk); box(10, 11, 16, 16, 0, 1, o.skin); }
    else { box(-4, -4, 9, 16, -1, 0, jk); box(4, 4, 9, 16, -1, 0, jk); V["-4,8,0"] = o.skin; V["4,8,0"] = o.skin; }
    return V;
  }
  var IMG = {};
  function pose(p) {
    var o = look(), k = p + JSON.stringify(o);
    if (IMG[k]) return IMG[k];
    var key = "mg:" + k; GXV.reg(key, function () { return fig(o, p); });
    try { var cv = document.createElement("canvas"); cv.width = 240; cv.height = 300; GXV.draw(cv, key, -0.45, {scale: 1.15, metal: 0.1}); IMG[k] = cv.toDataURL(); } catch (e) { IMG[k] = ""; }
    return IMG[k];
  }
  /* ---------- título (de los trofeos que lo dan) ---------- */
  function titles() { var g = GX.st(); return g ? g.titles.map(function (id) { var m = GX.meta(id); return m && m.x && m.x.title ? [id, m.x.title] : null; }).filter(Boolean) : []; }
  function titleRow() {
    var L = titles(); if (!L.length) return "";
    var g = GX.st(), cur = g.title || "";
    return '<div class="gtitle"><span class="eyebrow">' + h(tr("Título")) + '</span><div class="gtitle-l">' + [["", tr("Sin título")]].concat(L).map(function (t) { return '<button data-a="gxtitle" data-v="' + t[0] + '" aria-pressed="' + (cur === t[0]) + '">' + h(t[0] ? tr(t[1]) : t[1]) + "</button>"; }).join("") + "</div></div>";
  }
  U.actions.gxtitle = function (b, v) { GX.st().title = v || null; U.persist(); U.render(false); };
  U.gxTitle = function () { var g = S && GX.st(); if (!g || !g.title) return ""; var m = GX.meta(g.title); return m && m.x && m.x.title ? tr(m.x.title) : ""; };
  U.gxTitleRow = titleRow;
  /* ---------- la zona ---------- */
  U.mgrYo = function () {
    var m = S.m, b = GXM.base(), gr = GXM.gear(), st = GXM.stats(); if (!m || !st) return "";
    var tl = U.gxTitle(), s = '<div class="stack myo">';
    s += '<section class="card myo-hero"><div class="myo-fig" aria-hidden="true"><img class="p0" src="' + pose("idle") + '" alt=""><img class="p1" src="' + pose("cross") + '" alt=""><img class="p2" src="' + pose("point") + '" alt=""></div><div class="myo-id"><span class="eyebrow">' + h(tr("Tu míster")) + "</span><h2>" + h(((m.fn || "") + " " + (m.ln || "")).trim()) + "</h2>" + (tl ? '<span class="myo-tl">' + h(tl) + "</span>" : "") +
      "<small>" + h(tr("Prestigio {n}", {n: Math.round(m.rep)})) + (m.club >= 0 ? " · " + h(clubName(m.club)) : "") + "</small></div></section>";
    s += '<section class="card"><h3>' + h(tr("Estadísticas del míster")) + '</h3><p class="muted" style="margin:0 0 8px;font-size:var(--fs-xs)">' + h(tr("Crecen con tu trayectoria; la ropa suma un poco más.")) + '</p><div class="myo-st">' + GX_MSTATS.map(function (k, i) {
      var g = Math.round(gr[k] || 0), base = b[k];
      return '<div class="myo-r" style="--d:' + (i * 50) + 'ms"><span>' + h(tr(SN[k])) + '</span><i class="myo-b"><i class="bb" style="--w:' + base + '%"></i>' + (g > 0 ? '<i class="bg" style="--l:' + base + '%;--w:' + Math.min(g, 99 - base) + '%"></i>' : "") + "</i><b data-n=\"" + st[k] + "\">" + st[k] + "</b>" + (g ? '<em class="' + (g < 0 ? "neg" : "") + '">' + (g > 0 ? "+" : "−") + Math.abs(g) + "</em>" : "") + "</div>";
    }).join("") + "</div></section>";
    s += titleRow();
    if (U.gearCard) s += U.gearCard("m");
    if (U.shopEntry) s += U.shopEntry();
    if (U.gxVitrina) s += U.gxVitrina("m");
    s += petCard();
    if (typeof GXC !== "undefined") { var L = GXC.list().filter(function (c) { return c.who === "m"; }), n = L.filter(function (c) { return GXC.done(c.id); }).length; s += '<button class="card shcard" data-a="shopopen" data-v="chal"><span class="shcard-ic">🎯</span><span class="grow"><b>' + h(tr("Retos del míster")) + "</b><small>" + h(tr("{n} de {t} retos superados. Cada uno desbloquea una pieza exclusiva.", {n: n, t: L.length})) + '</small></span><span class="chev" aria-hidden="true">›</span></button>'; }
    s += '<button class="card shcard" data-a="ach"><span class="shcard-ic"><img src="' + GXV.img("g", 64) + '" alt="" width="36" height="36"></span><span class="grow"><b>' + h(tr("Trofeos")) + "</b><small>" + h(tr("Tus trofeos de míster, con fecha y partido.")) + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
    return s + "</div>";
  };
  function petCard() {
    if (!S.p || typeof petOf !== "function" || !petOn()) return "";
    var pt = petOf();
    if (!pt) return '<button class="card petcta" data-a="petopen"><span class="petcta-ic" aria-hidden="true">🐾</span><span><b>' + h(tr("Adopta una mascota")) + "</b><small>" + h(tr("Te acompaña en el banquillo, crece contigo y mejora tu ánimo.")) + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
    return '<button class="card petcard" data-a="petopen">' + (U.petArt ? U.petArt(pt, 40) : "🐾") + '<span class="petinfo"><span class="eyebrow">' + h(tr("Tu mascota")) + "</span><b>" + h(pt.nm) + '</b><span class="petbond"><i style="width:' + Math.round(pt.bond) + '%"></i></span></span><span class="chev" aria-hidden="true">›</span></button>';
  }
  /* acceso desde la portada del club */
  U.add("clubTop", function () {
    if (!S || S.mode !== "mgr" || !S.m || S.ph === "ret") return "";
    return '<button class="card myo-mini" data-a="tab" data-t="yo"><img src="' + pose("idle") + '" alt="" width="40" height="50"><span class="grow"><b>' + h(tr("Tu míster")) + "</b><small>" + h(tr("Ropa, estadísticas, vitrina y mascota")) + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
  });
  /* título también en «Yo» del jugador */
  U.add("jugador", function () { return S && S.p && !U.isMgr() ? titleRow() : ""; });
})();
