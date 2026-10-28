/* edit35.js — versión 3.5 «A tu manera» (parte del motor).
   - Editor de la partida: nombres, abreviaturas y colores de clubes; nombres de ligas y competiciones (S.ed).
   - Carrera rápida: la partida termina sola tras 10 temporadas (S.quick). */
function edOf() { if (!S) return null; S.ed = S.ed || {cl: {}, cp: {}}; S.ed.cl = S.ed.cl || {}; S.ed.cp = S.ed.cp || {}; return S.ed; }
function edClub(c) { return S && S.ed && S.ed.cl && S.ed.cl[c] ? S.ed.cl[c] : null; }
function edSetClub(c, o) {
  var e = edOf(), cur = e.cl[c] || {};
  ["n", "ab"].forEach(function (k) { if (o[k] != null) { var v = String(o[k]).replace(/[<>]/g, "").trim().slice(0, k === "ab" ? 4 : 30); if (v) cur[k] = k === "ab" ? v.toUpperCase() : v; else delete cur[k]; } });
  if (o.col) cur.col = o.col.slice(0, 2).map(function (x) { return /^#[0-9a-fA-F]{6}$/.test(x) ? x : null; });
  if (cur.col && !cur.col[0] && !cur.col[1]) delete cur.col;
  if (Object.keys(cur).length) e.cl[c] = cur; else delete e.cl[c];
}
function edSetComp(orig, v) {
  var e = edOf(); v = String(v || "").replace(/[<>]/g, "").trim().slice(0, 40);
  if (v) e.cp[orig] = v; else delete e.cp[orig];
}
(function () {
  if (typeof clubName === "function") {
    var _cn = clubName;
    clubName = function (c) { var e = edClub(c); return e && e.n ? e.n : _cn.apply(this, arguments); };
  }
  if (typeof femComp === "function") {
    var _fc = femComp;
    femComp = function (n) { var cp = S && S.ed && S.ed.cp; return cp && cp[n] ? cp[n] : _fc.apply(this, arguments); };
  }
})();

/* ---------- carrera rápida ---------- */
function quickOn() { return !!(S && S.quick && !S.quick.done); }
function quickLeft() { if (!quickOn()) return -1; var n = S.mode === "mgr" ? S.m.seasons.length : S.p.seasons.length; return Math.max(0, S.quick.n - n); }
(function () {
  if (typeof startSeason === "function") {
    var _ss = startSeason;
    startSeason = function (first) {
      if (!first && quickOn() && S.p && S.p.seasons.length >= S.quick.n) { S.quick.done = 1; retire(); return; }
      return _ss.apply(this, arguments);
    };
  }
  if (typeof mgrStartSeason === "function") {
    var _ms = mgrStartSeason;
    mgrStartSeason = function () {
      if (quickOn() && S.m && S.m.seasons.length >= S.quick.n) { S.quick.done = 1; mgrRetire(); return; }
      return _ms.apply(this, arguments);
    };
  }
  function q(o) { if (o && o.quick) { S.quick = {n: 10}; S.set.ev = 0; } }
  if (typeof newCareer === "function") { var _nc = newCareer; newCareer = function (o) { var r = _nc.apply(this, arguments); q(o); return r; }; }
  if (typeof newManagerCareer === "function") { var _nm = newManagerCareer; newManagerCareer = function (o) { var r = _nm.apply(this, arguments); q(o); return r; }; }
  if (typeof newClubCareer === "function") { var _nk = newClubCareer; newClubCareer = function (o) { var r = _nk.apply(this, arguments); q(o); return r; }; }
})();
