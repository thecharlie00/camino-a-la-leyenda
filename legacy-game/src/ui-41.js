/* ui-41.js — versión 4.1: lo nuevo del motor en directo a la vista (xG, momentum, territorio en 18 zonas,
   clima, estado del partido y resistencia de cada jugador minuto a minuto). */
(function () {
  if (typeof UIX === "undefined" || typeof mxInit !== "function") return;
  var U = UIX, h = U.h;
  function dec2(v) { return (Math.round((v || 0) * 100) / 100).toFixed(2).replace(".", LANG === "en" ? "." : ","); }
  U.hk.liveX = function (L, f, cu) {
    if (!L.xg) return "";
    var home = !!f.home, a = home ? L.xg[0] : L.xg[1], b = home ? L.xg[1] : L.xg[0];
    var wx = MX_WX.filter(function (w) { return w[0] === L.wx; })[0] || MX_WX[0];
    var s = '<div class="lx">';
    /* xG y estado */
    s += '<div class="lxrow"><div class="lxg"><span>' + tr("Goles esperados (xG)") + '</span><b class="num">' + dec2(a) + " – " + dec2(b) + "</b></div>" +
      '<div class="lxmeta"><span title="' + h(tr(wx[2])) + '">' + wx[1] + " " + h(tr(wx[2])) + "</span><span>" + h(tr(MX_ST[L.st] || MX_ST.OPEN_PLAY)) + "</span></div></div>";
    /* la barra crece hacia el lado del equipo que aprieta (el local juega a la izquierda) */
    var mom = L.mom || 0, toLeft = (mom > 0) === home, w = Math.min(50, Math.abs(mom) / 2);
    s += '<div class="lmom"><div class="lmomh"><span>' + tr("Momento del partido") + '</span><span class="muted">' + (Math.abs(mom) < 12 ? tr("Igualado") : mom > 0 ? tr("Aprieta tu equipo") : tr("Aprieta el rival")) + '</span></div><div class="lmomt"><i class="mid"></i><i class="bar" style="' + (toLeft ? "right:50%" : "left:50%") + ";width:" + w + "%;background:" + (mom >= 0 ? cu[0] : cu[1]) + '"></i></div></div>';
    /* territorio: 18 zonas (6 × 3), orientado como el marcador (local a la izquierda) */
    var zn = L.zn || [], mx = Math.max.apply(null, zn.concat([1])), cells = "";
    for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) {
      var cc = home ? c : 5 - c, v = zn[r * 6 + cc] || 0;
      cells += '<i style="opacity:' + (0.08 + 0.85 * v / mx).toFixed(2) + '"></i>';
    }
    var tot = zn.reduce(function (s2, x) { return s2 + x; }, 0), att = tot ? Math.round((zn[4] + zn[5] + zn[10] + zn[11] + zn[16] + zn[17]) / tot * 100) : 0;
    s += '<div class="lterr"><div class="lmomh"><span>' + tr("Territorio") + '</span><span class="muted">' + tr("{n} % del juego en el último tercio rival", {n: att}) + '</span></div><div class="lzn">' + cells + "</div></div>";
    return s + "</div>";
  };
  U.hk.lfit = function (L, p) {
    var v = Math.round(L.fit && L.fit[p.id] != null ? L.fit[p.id] : p.fit), c = v >= 70 ? "ok" : v >= 50 ? "mid" : "low";
    return '<span class="fit f-' + c + '" title="' + h(tr("Resistencia {n}", {n: v})) + '">' + v + "</span>";
  };
})();
