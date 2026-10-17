/* achieve.js — logros e insignias por hitos de carrera (versión 2.8).
   Cada logro se comprueba con el estado de la partida; los desbloqueados se guardan en S.ach {clave: año}.
   Las partidas antiguas reciben en silencio los logros que ya habían cumplido. */
function achPlayerTot() {
  var p = S.p, t = careerTotals(), last = p.seasons[p.seasons.length - 1], ss = last && last.y === S.yr ? {} : (p.ss || {});
  return {apps: t.apps + (ss.apps || 0), g: t.g + (ss.g || 0), a: t.a + (ss.a || 0), cs: t.cs + (ss.cs || 0), seasons: t.seasons};
}
function achClubs(rows) { var o = {}; rows.forEach(function (r) { (r.clubs || [r.club]).forEach(function (c) { if (c != null && c >= 0) o[c] = 1; }); }); return Object.keys(o).length; }
function achMgrTot() {
  var m = S.m, last = m.seasons[m.seasons.length - 1], ss = last && last.y === S.yr ? {} : (m.ss || {}), t = {w: ss.w || 0, seasons: m.seasons.length};
  m.seasons.forEach(function (r) { t.w += r.w || 0; });
  return t;
}
/* [clave, icono, nombre, descripción, prueba(contexto)] */
var ACH_P = [
  ["p_debut", "👟", N_("Debut"), N_("Juega tu primer partido oficial."), function (c) { return c.t.apps >= 1; }],
  ["p_g1", "⚽", N_("Primer gol"), N_("Marca tu primer gol oficial."), function (c) { return c.t.g >= 1; }],
  ["p_season1", "📅", N_("Primera temporada"), N_("Completa tu primera temporada."), function (c) { return c.t.seasons >= 1; }],
  ["p_pom", "🌟", N_("Jugador del mes"), N_("Gana un premio al mejor del mes."), function (c) { return (S.p.pom || 0) >= 1; }],
  ["p_t1", "🏆", N_("Primer título"), N_("Levanta tu primer trofeo."), function (c) { return S.p.trophies.length >= 1; }],
  ["p_cap1", "🧢", N_("Internacional"), N_("Debuta con tu selección."), function (c) { return S.p.intl.caps >= 1; }],
  ["p_apps100", "💯", N_("Fijo en el once"), N_("Llega a 100 partidos oficiales."), function (c) { return c.t.apps >= 100; }],
  ["p_g50", "🎯", N_("Goleador"), N_("Llega a 50 goles oficiales."), function (c) { return c.t.g >= 50; }],
  ["p_a50", "🤝", N_("Asistente de oro"), N_("Da 50 asistencias."), function (c) { return c.t.a >= 50; }],
  ["p_cs50", "🧤", N_("Muro"), N_("Deja la portería a cero en 50 partidos."), function (c) { return c.t.cs >= 50; }],
  ["p_ovr80", "⭐", N_("Estrella"), N_("Alcanza una media de 80."), function (c) { return Math.round(S.p.peak || S.p.ovr) >= 80; }],
  ["p_m1", "💰", N_("Primer millón"), N_("Ahorra 1 millón."), function (c) { return S.p.money >= 1e6; }],
  ["p_pet", "🐾", N_("Mejor amigo"), N_("Adopta una mascota."), function (c) { var L = S.p.life; return !!(L && (L.pet || (L.petMem && L.petMem.length))); }],
  ["p_clubs3", "🧳", N_("Trotamundos"), N_("Juega en 3 clubes distintos."), function (c) { return achClubs(S.p.seasons) >= 3; }],
  ["p_t5", "🏅", N_("Coleccionista"), N_("Gana 5 títulos."), function (c) { return S.p.trophies.length >= 5; }],
  ["p_g100", "🔥", N_("Centenario"), N_("Llega a 100 goles oficiales."), function (c) { return c.t.g >= 100; }],
  ["p_cap50", "🎖️", N_("Cincuenta con la selección"), N_("Llega a 50 partidos internacionales."), function (c) { return S.p.intl.caps >= 50; }],
  ["p_season10", "⏳", N_("Veterano"), N_("Juega 10 temporadas."), function (c) { return c.t.seasons >= 10; }],
  ["p_apps500", "🦾", N_("Incombustible"), N_("Llega a 500 partidos oficiales."), function (c) { return c.t.apps >= 500; }],
  ["p_ovr90", "💎", N_("Clase mundial"), N_("Alcanza una media de 90."), function (c) { return Math.round(S.p.peak || S.p.ovr) >= 90; }],
  ["p_t15", "🏛️", N_("Vitrina llena"), N_("Gana 15 títulos."), function (c) { return S.p.trophies.length >= 15; }],
  ["p_g300", "👑", N_("Leyenda del gol"), N_("Llega a 300 goles oficiales."), function (c) { return c.t.g >= 300; }],
  ["p_knee", "🏹", N_("Antes era un aventurero como tú..."), N_("Lesiónate la rodilla."), function (c) { return !!(S.p.flags && S.p.flags.knee); }, 1],
  ["p_bdo", "🥇", N_("Balón de Oro"), N_("Gana el Balón de Oro."), function (c) { return S.p.awards.some(function (a) { return a.k === "bdo"; }); }]
];
var ACH_M = [
  ["m_w1", "✅", N_("Primera victoria"), N_("Gana tu primer partido como míster."), function (c) { return c.t.w >= 1; }],
  ["m_season1", "📅", N_("Primera temporada"), N_("Completa tu primera temporada en el banquillo."), function (c) { return c.t.seasons >= 1; }],
  ["m_t1", "🏆", N_("Primer título"), N_("Levanta tu primer trofeo."), function (c) { return S.m.trophies.length >= 1; }],
  ["m_lg", "🛡️", N_("Campeón de liga"), N_("Gana una liga."), function (c) { return S.m.trophies.some(function (t) { return String(t.k).indexOf("L:") === 0; }); }],
  ["m_w50", "📈", N_("Cincuenta victorias"), N_("Suma 50 victorias."), function (c) { return c.t.w >= 50; }],
  ["m_unb", "🧱", N_("Invictos"), N_("Termina una temporada de liga sin perder."), function (c) { return S.m.seasons.some(function (r) { return r.l === 0 && r.w + r.d >= 10; }); }],
  ["m_gf", "💥", N_("Máquina de goles"), N_("Marca 90 goles en una temporada."), function (c) { return S.m.seasons.some(function (r) { return r.gf >= 90; }); }],
  ["m_clubs3", "🧳", N_("Trotamundos"), N_("Entrena a 3 clubes distintos."), function (c) { return achClubs(S.m.seasons) >= 3; }],
  ["m_t5", "🏅", N_("Coleccionista"), N_("Gana 5 títulos."), function (c) { return S.m.trophies.length >= 5; }],
  ["m_rep80", "⭐", N_("Prestigio"), N_("Llega a 80 de reputación."), function (c) { return S.m.rep >= 80; }],
  ["m_w200", "🦾", N_("Doscientas victorias"), N_("Suma 200 victorias."), function (c) { return c.t.w >= 200; }],
  ["m_season10", "⏳", N_("Banquillo eterno"), N_("Entrena 10 temporadas."), function (c) { return c.t.seasons >= 10; }],
  ["m_t15", "🏛️", N_("Vitrina llena"), N_("Gana 15 títulos."), function (c) { return S.m.trophies.length >= 15; }],
  ["m_best", "🥇", N_("Mejor entrenador"), N_("Gana el premio al mejor entrenador del año."), function (c) { return S.m.awards.some(function (a) { return a.k === "mgr_year"; }); }]
];
function achList() { var mgr = S && S.mode === "mgr"; return (mgr ? ACH_M : ACH_P).concat(typeof achX === "function" ? achX(mgr ? "m" : "p") : []); }
function achCtx() { return {t: S.mode === "mgr" ? achMgrTot() : achPlayerTot()}; }
/* comprueba y devuelve los logros nuevos; la primera vez en una partida antigua no avisa */
function achCheck() {
  if (!S || (S.mode === "mgr" ? !S.m : !S.p)) return [];
  var first = !S.ach, out = [], c;
  S.ach = S.ach || {};
  try { c = achCtx(); } catch (e) { return []; }
  achList().forEach(function (a) {
    if (S.ach[a[0]]) return;
    var ok = false;
    try { ok = a[4](c); } catch (e) { ok = false; }
    if (ok) { S.ach[a[0]] = S.yr; out.push(a); }
  });
  if (first) { S.achN0 = out.length; return []; }
  return out;
}
function achCount() { var l = achList(), n = 0; l.forEach(function (a) { if (S.ach && S.ach[a[0]]) n++; }); return [n, l.length]; }
/* lesiones de rodilla: dejan marca para el logro secreto */
var ACH_KNEE = ["Lesión de rodilla", "Esguince de rodilla", "Lesión de menisco", "Rotura del ligamento cruzado"];
(function () {
  if (typeof injure !== "function") return;
  var _inj = injure;
  injure = function () {
    var r = _inj.apply(this, arguments), p = S.p;
    if (p && p.inj && ACH_KNEE.indexOf(p.inj.n) >= 0) { p.flags = p.flags || {}; p.flags.knee = 1; }
    return r;
  };
})();
