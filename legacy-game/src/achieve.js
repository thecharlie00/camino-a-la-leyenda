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
  ["p_bdo", "🥇", N_("Balón de Oro"), N_("Gana el Balón de Oro."), function (c) { return S.p.awards.some(function (a) { return a.k === "bdo"; }); }],
  ["p_assist100", "🪄", N_("Arquitecto del juego"), N_("Da 100 asistencias oficiales."), function (c) { return c.t.a >= 100; }],
  ["p_apps1000", "🧭", N_("Mil batallas"), N_("Juega 1.000 partidos oficiales."), function (c) { return c.t.apps >= 1000; }],
  ["p_treble", "👑", N_("Triplete inolvidable"), N_("Gana tres títulos en una misma temporada."), function () { return typeof achTreble === "function" && achTreble(S.p.trophies); }],
  ["p_nat100", "🌍", N_("Leyenda nacional"), N_("Llega a 100 partidos con tu selección."), function () { return S.p.intl.caps >= 100; }]
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
  ["m_best", "🥇", N_("Mejor entrenador"), N_("Gana el premio al mejor entrenador del año."), function (c) { return S.m.awards.some(function (a) { return a.k === "mgr_year"; }); }],
  ["m_w500", "🧠", N_("Quinientas victorias"), N_("Suma 500 victorias como entrenador."), function (c) { return c.t.w >= 500; }],
  ["m_treble", "👑", N_("Triplete desde el banquillo"), N_("Gana liga, copa y torneo continental en una temporada."), function () { return typeof achTreble === "function" && achTreble(S.m.trophies); }],
  ["m_invincible", "🛡️", N_("Temporada perfecta"), N_("Completa una temporada de liga sin derrotas y con al menos 20 partidos."), function () { return S.m.seasons.some(function (r) { return r.l === 0 && r.w + r.d >= 20; }); }],
  ["m_world", "🌐", N_("Míster mundial"), N_("Entrena en cinco clubes diferentes."), function () { return achClubs(S.m.seasons) >= 5; }]
];
/* 30 logros de expansión: 15 para cada recorrido, con pruebas sobre estadísticas ya guardadas. */
ACH_P.push(
  ["p_apps750", "🎽", N_("Setecientos cincuenta partidos"), N_("Juega 750 partidos oficiales."), function (c) { return c.t.apps >= 750; }],
  ["p_apps1500", "🏟️", N_("Estadio lleno"), N_("Juega 1.500 partidos oficiales."), function (c) { return c.t.apps >= 1500; }],
  ["p_g150", "🥅", N_("Instinto goleador"), N_("Marca 150 goles oficiales."), function (c) { return c.t.g >= 150; }],
  ["p_g500", "🚀", N_("Quinientos goles"), N_("Marca 500 goles oficiales."), function (c) { return c.t.g >= 500; }],
  ["p_a200", "🧩", N_("Socio perfecto"), N_("Da 200 asistencias oficiales."), function (c) { return c.t.a >= 200; }],
  ["p_a300", "🎨", N_("Pase de museo"), N_("Da 300 asistencias oficiales."), function (c) { return c.t.a >= 300; }],
  ["p_season15", "🗓️", N_("Quince temporadas"), N_("Completa 15 temporadas."), function (c) { return c.t.seasons >= 15; }],
  ["p_season20", "⌛", N_("Dos décadas de fútbol"), N_("Completa 20 temporadas."), function (c) { return c.t.seasons >= 20; }],
  ["p_titles25", "🏆", N_("Vitrina de plata"), N_("Gana 25 títulos."), function () { return S.p.trophies.length >= 25; }],
  ["p_titles40", "🥇", N_("Dinastía"), N_("Gana 40 títulos."), function () { return S.p.trophies.length >= 40; }],
  ["p_clubs5", "🗺️", N_("Cinco escudos"), N_("Juega en cinco clubes distintos."), function () { return achClubs(S.p.seasons) >= 5; }],
  ["p_clubs10", "🌐", N_("Pasaporte lleno"), N_("Juega en diez clubes distintos."), function () { return achClubs(S.p.seasons) >= 10; }],
  ["p_cs100", "🧤", N_("Cien porterías a cero"), N_("Deja la portería a cero en 100 partidos."), function (c) { return c.t.cs >= 100; }],
  ["p_intcaps150", "🇺🇳", N_("Ciento cincuenta veces internacional"), N_("Juega 150 partidos con tu selección."), function () { return S.p.intl.caps >= 150; }],
  ["p_fame90", "✨", N_("Ídolo mundial"), N_("Alcanza 90 de fama."), function () { return S.p.fame >= 90; }]
);
ACH_M.push(
  ["m_w100", "📊", N_("Centena en el banquillo"), N_("Suma 100 victorias como entrenador."), function (c) { return c.t.w >= 100; }],
  ["m_w300", "⚙️", N_("Trescientas victorias"), N_("Suma 300 victorias como entrenador."), function (c) { return c.t.w >= 300; }],
  ["m_w1000", "🏅", N_("Mil triunfos"), N_("Suma 1.000 victorias como entrenador."), function (c) { return c.t.w >= 1000; }],
  ["m_season5", "📚", N_("Proyecto consolidado"), N_("Completa cinco temporadas como entrenador."), function (c) { return c.t.seasons >= 5; }],
  ["m_season20", "🕰️", N_("Leyenda del banquillo"), N_("Completa 20 temporadas como entrenador."), function (c) { return c.t.seasons >= 20; }],
  ["m_titles10", "🏆", N_("Diez títulos"), N_("Gana 10 títulos como entrenador."), function () { return S.m.trophies.length >= 10; }],
  ["m_titles25", "🥇", N_("Veinticinco títulos"), N_("Gana 25 títulos como entrenador."), function () { return S.m.trophies.length >= 25; }],
  ["m_titles50", "👑", N_("Cincuenta títulos"), N_("Gana 50 títulos como entrenador."), function () { return S.m.trophies.length >= 50; }],
  ["m_clubs5", "🧭", N_("Cinco vestuarios"), N_("Entrena a cinco clubes distintos."), function () { return achClubs(S.m.seasons) >= 5; }],
  ["m_clubs10", "🌍", N_("Carrera internacional"), N_("Entrena a diez clubes distintos."), function () { return achClubs(S.m.seasons) >= 10; }],
  ["m_rep90", "💫", N_("Respeto universal"), N_("Alcanza 90 de reputación."), function () { return S.m.rep >= 90; }],
  ["m_awards3", "🎖️", N_("Tres veces míster del año"), N_("Gana tres premios individuales como entrenador."), function () { return S.m.awards.length >= 3; }],
  ["m_gf120", "💥", N_("Ataque imparable"), N_("Marca 120 goles en una temporada de liga."), function () { return S.m.seasons.some(function (r) { return r.gf >= 120; }); }],
  ["m_inv30", "🧱", N_("Treinta jornadas invicto"), N_("Completa una temporada de liga de al menos 30 partidos sin perder."), function () { return S.m.seasons.some(function (r) { return r.l === 0 && r.w + r.d >= 30; }); }],
  ["m_bigbudget", "💼", N_("Presupuesto de élite"), N_("Dirige un club con al menos 20 millones de presupuesto."), function () { return S.m.bud >= 20000000; }]
);

function achList() {
  var mgr = S && S.mode === "mgr", md = mgr ? "m" : "p", l = (mgr ? ACH_M : ACH_P).concat(typeof achX === "function" ? achX(md) : []);
  /* 5.6: trofeos ampliados (gx-data.js) y el platino del modo, que se evalúa el último */
  if (typeof GX !== "undefined") { GX.rows(md).forEach(function (r) { r.gx = 1; l.push(r); }); var pl = GX.platRow(md); pl.gx = 1; l.push(pl); }
  return l;
}
function achCtx() { return {t: S.mode === "mgr" ? achMgrTot() : achPlayerTot()}; }
/* comprueba y devuelve los logros nuevos; la primera vez en una partida antigua no avisa */
function achCheck() {
  if (!S || (S.mode === "mgr" ? !S.m : !S.p)) return [];
  var first = !S.ach, out = [], c, gxOn = typeof GX !== "undefined", gxRun = gxOn ? GX.check() || first : false, gst = gxOn ? GX.st() : null, gxNew = gst && !gst.init;
  S.ach = S.ach || {};
  try { c = achCtx(); } catch (e) { return []; }
  achList().forEach(function (a) {
    if (a.gx && !gxRun && !gxNew) return;
    if (S.ach[a[0]]) return;
    var ok = false;
    try { ok = a[4](c); } catch (e) { ok = false; }
    if (ok) { S.ach[a[0]] = S.yr; out.push(a); }
  });
  if (gxOn) {
    /* partida que llega de una versión anterior: lo ya cumplido se desbloquea en silencio */
    if (first || gxNew) { GX.unlocked(out, true); gst.init = 1; }
    else GX.unlocked(out, false);
  }
  if (first) { S.achN0 = out.length; return []; }
  if (gxNew) { S.achN0 = (S.achN0 || 0) + out.length; return []; }
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
