/* Logros de Google Play Juegos (solo en la app de Android con Play Juegos configurado).
   Cada logro desbloqueado en cualquier partida se envía una vez a Play Juegos con su misma clave;
   la app traduce la clave al ID de Play (android/res/raw/pgs_achievements.json). Sin Play Juegos no hace nada. */
var PGS = (function () {
  var KEY = "camino.pgs.sent", sent = null, busy = false;
  function bridge() { var b = typeof window !== "undefined" && window.AndroidBridge; return b && typeof b.pgsUnlock === "function" ? b : null; }
  function state() { var b = bridge(); try { return b && b.pgsState ? String(b.pgsState()) : "off"; } catch (e) { return "off"; } }
  function load() { if (sent) return sent; try { sent = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { sent = {}; } return sent; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(sent || {})); } catch (e) {} }
  /* manda lo desbloqueado en la partida abierta que aún no se haya enviado */
  function sync() {
    var b = bridge(); if (!b || busy || typeof S === "undefined" || !S || !S.ach || state() !== "in") return 0;
    busy = true; load();
    var n = 0;
    try {
      Object.keys(S.ach).forEach(function (k) {
        if (!S.ach[k] || sent[k]) return;
        try { if (b.pgsUnlock(k)) { sent[k] = 1; n++; } } catch (e) {}
      });
      if (n) save();
    } finally { busy = false; }
    return n;
  }
  function show() { var b = bridge(); try { if (b && b.pgsShow) b.pgsShow(); } catch (e) {} }
  return {sync: sync, show: show, state: state, available: function () { return state() !== "off"; }};
})();
if (typeof window !== "undefined") {
  window.pgsSync = PGS.sync;
  if (window.UIX && window.UIX.add) {
    var pgsLast = 0;
    window.UIX.add("after", function () {
      var now = Date.now(); if (now - pgsLast < 1500) return; pgsLast = now;
      setTimeout(function () { try { PGS.sync(); } catch (e) {} }, 0);
    });
  }
}
if (typeof window !== "undefined" && window.UIX) {
  window.UIX.actions.pgsshow = function () { PGS.show(); };
  if (typeof ensureI18n === "function") {
    var pgsNames = {"Logros de Google Play Juegos": {en: "Google Play Games achievements", de: "Google Play Spiele-Erfolge", it: "Obiettivi di Google Play Giochi", fr: "Succès Google Play Jeux"}};
    var pgsEnsure = ensureI18n;
    ensureI18n = function (lang) {
      var r = pgsEnsure.apply(this, arguments);
      try { var d = I18N[lang]; if (d) Object.keys(pgsNames).forEach(function (k) { if (!d[k] && pgsNames[k][lang]) d[k] = pgsNames[k][lang]; }); } catch (e) {}
      return r;
    };
  }
}
