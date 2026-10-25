/* gx-mgr.js — el míster como personaje (5.6): estadísticas propias que nacen de su trayectoria
   (partidos, victorias, títulos, canteranos, prestigio…) más su ropa, y que cuentan en el juego:
   táctica y lectura en el nivel del partido, motivación y vestuario en la química, físico en las
   lesiones, jóvenes en el crecimiento de la cantera, prensa en la afición y negociación en los fichajes.
   Además: clips del míster vóxel (señalar, brazos cruzados, aplaudir, manos a la cabeza). */
var GX_MSTATS = ["tac", "mot", "ves", "pre", "jov", "fis", "neg", "lec"];
var GXM = (function () {
  var api = {};
  function S0(k) { return typeof GX !== "undefined" ? GX.stat(k) : 0; }
  function cap(v) { return Math.max(20, Math.min(99, Math.round(v))); }
  /* base por trayectoria (siempre desde el historial: una partida antigua ya trae su míster) */
  api.base = function () {
    var m = S.m; if (!m) return null;
    var g = S0("mGames"), w = S0("mWins"), t = S0("mTitles"), yd = S0("mYouthDebuts"), rep = m.rep || 40, se = m.seasons.length, ex = S.retiredP;
    var pl = ex ? Math.min(10, (ex.seasons || []).length * 0.6) : 0;
    return {tac: cap(42 + Math.min(22, g / 18) + rep * 0.18 + t * 0.8), mot: cap(44 + Math.min(18, w / 12) + (m.fans || 50) * 0.08 + pl * 0.5), ves: cap(42 + pl + Math.min(16, se * 1.6) + (m.chem || 50) * 0.08),
      pre: cap(38 + rep * 0.3 + t * 0.6), jov: cap(40 + Math.min(32, yd * 1.6)), fis: cap(44 + Math.min(18, se * 1.4) + pl * 0.4), neg: cap(40 + rep * 0.22 + Math.min(12, (m.tx || []).length * 0.4)), lec: cap(42 + Math.min(20, w / 15) + t * 1.2 + pl * 0.3)};
  };
  /* bonus de la ropa (con el mismo tope de rendimientos decrecientes; ×2 en la escala de 99) */
  api.gear = function () { if (typeof GXI === "undefined" || !S.m) return {}; var b = GXI.bonus("m"), o = {}; GX_MSTATS.forEach(function (k) { if (b[k]) o[k] = b[k] * 2; }); return o; };
  api.stats = function () { var b = api.base(); if (!b) return null; var g = api.gear(), o = {}; GX_MSTATS.forEach(function (k) { o[k] = cap(b[k] + (g[k] || 0)); }); return o; };
  return api;
})();
/* ---------- efectos en el juego ---------- */
(function () {
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  function on() { return S && S.mode === "mgr" && S.m && S.m.club >= 0; }
  /* nivel del partido: táctica, lectura y motivación (un empujón pequeño, nunca decisivo) */
  if (typeof mBuffs === "function") {
    var _mb = mBuffs;
    root.mBuffs = function () { var b = _mb.apply(this, arguments); try { if (on()) { var s = GXM.stats(); b += Math.max(-0.25, Math.min(0.6, (s.tac - 48) * 0.011 + (s.lec - 48) * 0.008 + (s.mot - 48) * 0.004)); } } catch (e) {} return b; };
  }
  /* tras cada partido: el vestuario y la motivación mueven la química; la prensa, la afición */
  if (typeof mgrFinish === "function") {
    var _mf = mgrFinish;
    root.mgrFinish = function (f) {
      var r = _mf.apply(this, arguments);
      try { if (on()) { var s = GXM.stats(), m = S.m; m.chem = clamp(m.chem + Math.max(-0.05, (s.ves - 48) * 0.012 + (s.mot - 48) * 0.006), 0, 100); m.fans = clamp(m.fans + Math.max(-0.03, (s.pre - 48) * 0.006), 0, 100); } } catch (e) {}
      return r;
    };
  }
  /* jóvenes: la cantera crece algo más al final de cada tramo; físico: la plantilla se recupera mejor */
  if (typeof mgrBlockDone === "function") {
    var _bd = mgrBlockDone;
    root.mgrBlockDone = function () {
      var r = _bd.apply(this, arguments);
      try {
        if (on()) {
          var s = GXM.stats(), m = S.m;
          m.sq.forEach(function (p) {
            if (p.age <= 21 && p.ovr < p.pot && s.jov > 55) p.ovr = round1(Math.min(p.pot, p.ovr + (s.jov - 55) * 0.004));
            if (s.fis > 55 && p.fit != null) p.fit = clamp(p.fit + (s.fis - 55) * 0.05, 0, 100);
          });
        }
      } catch (e) {}
      return r;
    };
  }
  /* negociación: rebaja en lo que pagas por un fichaje (se aplica al precio acordado) */
  if (typeof mgrSign === "function") {
    var _sg = mgrSign;
    root.mgrSign = function (t) {
      try { if (on() && t && t.fee > 0 && !t.__gxn) { var s = GXM.stats(), d = Math.max(0, Math.min(0.08, (s.neg - 55) * 0.002)); t.__gxn = 1; S.m.bud += Math.round(t.fee * d); } } catch (e) {}
      return _sg.apply(this, arguments);
    };
  }
  /* clips del míster vóxel */
  if (typeof SpRig !== "undefined" && SpRig && SpRig.CLIPS) {
    var C = SpRig.CLIPS;
    function seg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
    function hold(k, a, b) { return seg(k, 0, a) * (1 - seg(k, b, 1)); }
    C.cpoint = {d: 2.2, f: function (m, P, R, k) { var e = hold(k, 0.18, 0.8); P.armA[0] -= 1.55 * e; P.armA[2] += 0.25 * e; P.foreA[0] -= 0.1 * e; P.chest[1] += 0.25 * e; P.spine[0] -= 0.06 * e; P.head[1] += 0.2 * e; R.y += 0.02 * Math.sin(k * 20) * e; }};
    C.ccross = {d: 3.2, f: function (m, P, R, k) { var e = hold(k, 0.15, 0.85); P.armA[0] -= 0.55 * e; P.armB[0] -= 0.55 * e; P.foreA[0] -= 1.25 * e; P.foreB[0] -= 1.25 * e; P.foreA[1] -= 0.9 * e; P.foreB[1] += 0.9 * e; P.chest[0] += 0.04 * e; }};
    C.cclap = {d: 1.6, f: function (m, P, R, k) { var e = hold(k, 0.12, 0.88), c = Math.abs(Math.sin(k * 26)); P.armA[0] -= 0.9 * e; P.armB[0] -= 0.9 * e; P.foreA[0] -= 0.7 * e; P.foreB[0] -= 0.7 * e; P.armA[2] -= (0.35 - c * 0.3) * e; P.armB[2] += (0.35 - c * 0.3) * e; }};
    C.chead = {d: 2.4, f: function (m, P, R, k) { var e = hold(k, 0.12, 0.8); P.armA[0] -= 2.5 * e; P.armB[0] -= 2.5 * e; P.foreA[0] -= 1.5 * e; P.foreB[0] -= 1.5 * e; P.spine[0] += 0.12 * e; P.head[0] += 0.25 * e; R.y -= 0.03 * e; }};
    C.cfist = {d: 1.8, f: function (m, P, R, k) { var e = hold(k, 0.1, 0.75), j = Math.sin(seg(k, 0.05, 0.4) * Math.PI); P.armA[2] += 2.7 * e; P.foreA[2] += 0.4 * e; P.armB[0] -= 0.4 * e; R.y += 0.22 * j; P.head[0] -= 0.25 * e; }};
  }
})();
