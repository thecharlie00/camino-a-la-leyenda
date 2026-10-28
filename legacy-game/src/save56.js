/* save56.js — versión de la partida y migraciones en orden (5.6). Cada guardado lleva S.sv; al cargar
   una partida antigua se aplican, una a una, las migraciones pendientes. Las estructuras nuevas
   (trofeos, equipamiento, retos) además se crean al vuelo, así que una migración que falle nunca
   deja la partida sin abrir: se anota y se sigue. */
var SAVE_V = 56;
var SAVE_MIG = [
  /* 5.6: trofeos ampliados, equipamiento y retos */
  {v: 56, fn: function (s) {
    if (s.gx && s.gx.v !== 1) delete s.gx;
    if (s.p && s.p.life && s.p.life.gear && s.p.life.gear.v !== 1) delete s.p.life.gear;
    if (s.m && s.m.gear && s.m.gear.v !== 1) delete s.m.gear;
  }}
];
function saveMigrate(s) {
  var from = +s.sv || 0, log = [];
  SAVE_MIG.forEach(function (m) { if (m.v > from) { try { m.fn(s); log.push(m.v); } catch (e) { log.push("!" + m.v); } } });
  s.sv = SAVE_V;
  return log;
}
(function () {
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  if (typeof restore === "function") {
    var _r = restore;
    root.restore = function (json) { var s = typeof json === "string" ? JSON.parse(json) : json; if (s && typeof s === "object") saveMigrate(s); return _r.call(this, s); };
  }
  if (typeof serialize === "function") {
    var _s = serialize;
    root.serialize = function () { if (S && !S.sv) S.sv = SAVE_V; return _s.apply(this, arguments); };
  }
})();
