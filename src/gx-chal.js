/* gx-chal.js — retos que desbloquean equipamiento (5.6). Usan las mismas estadísticas que los trofeos
   (GX.stat) y el mismo formato de condición. Al superarlos, la pieza exclusiva aparece en la tienda
   (o se regala, en la mascota) y llegan unos materiales. Todo en datos. */
var GX_CH = [
  /* jugador: [id, nombre, descripción, condición, pieza exclusiva [id, ranura, nombre, estadísticas, conjunto, precio, aspecto]] */
  ["c_apps10", N_("Primeros pasos"), N_("Juega 10 partidos oficiales."), ["s", "apps", 10], ["x_socks_dbt", "socks", N_("Medias del debut"), {RIT: 1, rec: 1}, null, 12000, {c: "#f4f4f0"}]],
  ["c_g10", N_("Olfato"), N_("Marca 10 goles oficiales."), ["s", "goals", 10], ["x_band_g10", "band", N_("Cinta del olfato"), {TIR: 2}, "can", 30000, {c: "#ff7a1a"}]],
  ["c_a10", N_("Primer pase de gol"), N_("Da 10 asistencias."), ["s", "assists", 10], ["x_wr_a10", "wrist", N_("Muñequera del pasador"), {PAS: 2}, "led", 25000, {c: "#66b9ff"}]],
  ["c_w10", N_("Ganar engancha"), N_("Gana 10 partidos con tu club."), ["s", "wins", 10], ["x_ho_w10", "hood", N_("Sudadera ganadora"), {FIS: 1, TIR: 1}, null, 30000, {c: "#2ad15a"}]],
  ["c_cs10", N_("Candado"), N_("Deja la portería a cero 10 veces."), ["s", "cleanSheets", 10], ["x_gl_cs10", "gloves", N_("Guantes candado"), {DEF: 2, REG: 1}, "gua", 40000, {c: "#2a3a40", c2: "#ffb21e"}]],
  ["c_motm5", N_("Foco"), N_("Sé el mejor del partido 5 veces."), ["s", "motm", 5], ["x_ph_motm", "phones", N_("Cascos del foco"), {TIR: 1, REG: 1}, null, 35000, {c: "#ffb21e"}]],
  ["c_g25", N_("Instinto asesino"), N_("Marca 25 goles oficiales."), ["s", "goals", 25], ["x_boots_g25", "boots", N_("Botas del instinto"), {TIR: 2, RIT: 1, DEF: -1}, "can", 90000, {c: "#c8312f", c2: "#1d1404"}]],
  ["c_apps50", N_("Habitual"), N_("Juega 50 partidos oficiales."), ["s", "apps", 50], ["x_sh_50", "shin", N_("Espinilleras del habitual"), {DEF: 1, FIS: 1, inj: 1}, "tit", 45000, {c: "#3a4b50"}]],
  ["c_min3k", N_("Kilómetros"), N_("Juega 3.000 minutos."), ["s", "minutes", 3000], ["x_wa_3k", "watch", N_("Reloj de los kilómetros"), {rec: 2, FIS: 1}, "tit", 50000, {c: "#2ad15a"}]],
  ["c_hat1", N_("Triplete"), N_("Marca un hat-trick."), ["s", "hatTricks", 1], ["x_ne_hat", "neck", N_("Colgante del triplete"), {TIR: 2, PAS: 1}, null, 80000, {c: "#f6c83a"}]],
  ["c_t1", N_("Primer metal"), N_("Gana tu primer título."), ["s", "titles", 1], ["x_ar_t1", "arm", N_("Brazalete del campeón"), {PAS: 1, FIS: 1}, "led", 60000, {c: "#f6c83a"}]],
  ["c_cap1", N_("La camiseta de tu país"), N_("Debuta con tu selección."), ["s", "caps", 1], ["x_th_nat", "therm", N_("Térmica de la selección"), {FIS: 1, RIT: 1}, null, 40000, {c: "#1f4a8a"}]],
  ["c_pom1", N_("Mes de oro"), N_("Gana un premio al jugador del mes."), ["s", "pom", 1], ["x_wr_pom", "wrist", N_("Muñequera del mes"), {REG: 1, TIR: 1}, "mag", 45000, {c: "#f6c83a"}]],
  ["c_fk3", N_("Especialista"), N_("Marca 3 goles de falta directa."), ["s", "fkGoals", 3], ["x_boots_fk", "boots", N_("Botas del especialista"), {TIR: 2, PAS: 1}, "can", 110000, {c: "#7a3ad8", c2: "#f6c83a"}]],
  ["c_pen10", N_("Desde los once metros"), N_("Marca 10 penaltis."), ["s", "penGoals", 10], ["x_band_pen", "band", N_("Cinta del lanzador"), {TIR: 1, rec: 1}, null, 40000, {c: "#f4f4f0"}]],
  ["c_sav5", N_("Manos rápidas"), N_("Para 5 penaltis."), ["s", "penSaves", 5], ["x_gl_sav", "gloves", N_("Guantes manos rápidas"), {REG: 2, DEF: 1}, "gua", 90000, {c: "#c6f432", c2: "#1d1404"}]],
  ["c_g50", N_("Medio centenar"), N_("Marca 50 goles oficiales."), ["s", "goals", 50], ["x_wa_g50", "watch", N_("Reloj del cincuenta"), {TIR: 1, RIT: 1}, "ray", 120000, {c: "#c3cdd2"}]],
  ["c_a50", N_("Visión"), N_("Da 50 asistencias."), ["s", "assists", 50], ["x_boots_a50", "boots", N_("Botas de la visión"), {PAS: 3, REG: 1, FIS: -1}, "mag", 130000, {c: "#d9c6ff", c2: "#2a1a4a"}]],
  ["c_w50", N_("Cultura ganadora"), N_("Gana 50 partidos con tu club."), ["s", "wins", 50], ["x_ho_w50", "hood", N_("Sudadera de la cultura ganadora"), {FIS: 1, PAS: 1, rec: 1}, "led", 80000, {c: "#c8312f"}]],
  ["c_cs25", N_("Cerrojo"), N_("Deja la portería a cero 25 veces."), ["s", "cleanSheets", 25], ["x_th_cs", "therm", N_("Térmica del cerrojo"), {DEF: 2, FIS: 1, RIT: -1}, "wal", 90000, {c: "#2a3a40"}]],
  ["c_seas3", N_("Veterano en ciernes"), N_("Completa 3 temporadas."), ["s", "seasons", 3], ["x_ne_s3", "neck", N_("Medalla de tres temporadas"), {rec: 1, inj: 1}, null, 30000, {c: "#c88a52"}]],
  ["c_ovr75", N_("Despegue"), N_("Alcanza una media de 75."), ["s", "peakOvr", 75], ["x_sh_75", "shin", N_("Espinilleras del despegue"), {RIT: 1, DEF: 1}, "ray", 70000, {c: "#2de0ff"}]],
  ["c_fame40", N_("Cara conocida"), N_("Llega a 40 de fama."), ["s", "fame", 40], ["x_ne_fame", "neck", N_("Colgante de estrella"), {TIR: 1, REG: 1}, null, 60000, {c: "#16191b"}]],
  ["c_fol1m", N_("Viral"), N_("Llega a 1 millón de seguidores."), ["s", "followers", 1e6], ["x_ph_viral", "phones", N_("Cascos virales"), {PAS: 1, REG: 1}, null, 70000, {c: "#ff4fb1"}]],
  ["c_t3", N_("Coleccionista de metales"), N_("Gana 3 títulos."), ["s", "titles", 3], ["x_boots_t3", "boots", N_("Botas de campeón"), {TIR: 1, PAS: 1, FIS: 1}, null, 200000, {c: "#f6c83a", c2: "#7a5a12"}]],
  ["c_caps10", N_("Fijo con la selección"), N_("Juega 10 partidos internacionales."), ["s", "caps", 10], ["x_so_nat", "socks", N_("Medias de la selección"), {FIS: 1, RIT: 1}, null, 50000, {c: "#1f4a8a"}]],
  ["c_ig5", N_("Goleador internacional"), N_("Marca 5 goles con tu selección."), ["s", "intlGoals", 5], ["x_wr_nat", "wrist", N_("Muñequera internacional"), {TIR: 2}, "can", 60000, {c: "#1f4a8a"}]],
  ["c_g100", N_("Centenario"), N_("Marca 100 goles oficiales."), ["s", "goals", 100], ["x_boots_g100", "boots", N_("Botas del centenario"), {TIR: 3, RIT: 1, DEF: -1}, "can", 350000, {c: "#ffe58a", c2: "#c8312f"}]],
  ["c_a100", N_("Asistente de oro"), N_("Da 100 asistencias."), ["s", "assists", 100], ["x_wa_a100", "watch", N_("Cronógrafo del pasador"), {PAS: 2, REG: 1}, "mag", 300000, {c: "#d9c6ff"}]],
  ["c_apps200", N_("Incombustible"), N_("Juega 200 partidos oficiales."), ["s", "apps", 200], ["x_th_200", "therm", N_("Térmica incombustible"), {FIS: 2, rec: 1}, "tit", 180000, {c: "#ff7a1a"}]],
  ["c_cs75", N_("Muro"), N_("Deja la portería a cero 75 veces."), ["s", "cleanSheets", 75], ["x_gl_cs75", "gloves", N_("Guantes del muro"), {DEF: 3, REG: 1, PAS: -1}, "gua", 300000, {c: "#f6c83a", c2: "#1d1404"}]],
  ["c_motm25", N_("Protagonista"), N_("Sé el mejor del partido 25 veces."), ["s", "motm", 25], ["x_ho_motm", "hood", N_("Sudadera del protagonista"), {TIR: 1, REG: 1, PAS: 1}, null, 220000, {c: "#ffb21e"}]],
  ["c_hat5", N_("Triplete en serie"), N_("Marca 5 hat-tricks."), ["s", "hatTricks", 5], ["x_band_hat", "band", N_("Cinta de los tripletes"), {TIR: 2, REG: 1}, "can", 250000, {c: "#f6c83a"}]],
  ["c_ovr85", N_("Élite"), N_("Alcanza una media de 85."), ["s", "peakOvr", 85], ["x_sh_85", "shin", N_("Espinilleras de élite"), {DEF: 1, RIT: 1, FIS: 1}, null, 260000, {c: "#b07cff"}]],
  ["c_t8", N_("Vitrina repleta"), N_("Gana 8 títulos."), ["s", "titles", 8], ["x_ne_t8", "neck", N_("Cadena de los ocho títulos"), {TIR: 1, PAS: 1, REG: 1}, null, 400000, {c: "#f6c83a"}]],
  ["c_bdo1", N_("El mejor del mundo"), N_("Gana el Balón de Oro."), ["s", "bdo", 1], ["x_boots_bdo", "boots", N_("Botas doradas del mejor"), {TIR: 3, REG: 2, DEF: -1}, null, 900000, {c: "#ffe58a", c2: "#f6c83a"}]],
  ["c_caps50", N_("Leyenda nacional"), N_("Juega 50 partidos internacionales."), ["s", "caps", 50], ["x_ar_nat", "arm", N_("Brazalete de la selección"), {PAS: 1, DEF: 1, FIS: 1}, "led", 300000, {c: "#1f4a8a"}]],
  ["c_g200", N_("Doscientos"), N_("Marca 200 goles oficiales."), ["s", "goals", 200], ["x_wa_g200", "watch", N_("Reloj de los doscientos"), {TIR: 2, RIT: 1}, null, 700000, {c: "#f6c83a"}]],
  ["c_apps400", N_("Leyenda del césped"), N_("Juega 400 partidos oficiales."), ["s", "apps", 400], ["x_so_400", "socks", N_("Medias de leyenda"), {FIS: 1, RIT: 1, rec: 1}, null, 350000, {c: "#ff6b3d"}]],
  ["c_seas10", N_("Una década"), N_("Completa 10 temporadas."), ["s", "seasons", 10], ["x_ph_10", "phones", N_("Cascos de la década"), {PAS: 1, TIR: 1, rec: 1}, null, 300000, {c: "#c3cdd2"}]],
  ["c_fk10", N_("Maestro de la falta"), N_("Marca 10 goles de falta directa."), ["s", "fkGoals", 10], ["x_wr_fk", "wrist", N_("Muñequera del maestro"), {TIR: 1, PAS: 2}, "mag", 200000, {c: "#7a3ad8"}]],
  ["c_fol10m", N_("Fenómeno global"), N_("Llega a 10 millones de seguidores."), ["s", "followers", 1e7], ["x_ho_fol", "hood", N_("Sudadera de fenómeno"), {REG: 2, TIR: 1}, null, 500000, {c: "#ff4fb1"}]],
  /* míster */
  ["c_mg10", N_("Primeros partidos en el banquillo"), N_("Dirige 10 partidos."), ["s", "mGames", 10], ["x_m_nb", "notes", N_("Libreta del novato"), {tac: 1, lec: 1}, "mcl", 15000, {c: "#2ad15a"}]],
  ["c_mw25", N_("Pizarra ganadora"), N_("Gana 25 partidos como míster."), ["s", "mWins", 25], ["x_m_tie", "tie", N_("Corbata de la suerte"), {mot: 2}, null, 40000, {c: "#ffb21e"}]],
  ["c_mt1", N_("Primer título en el banquillo"), N_("Gana un título como míster."), ["s", "mTitles", 1], ["x_m_coat", "coat", N_("Abrigo del campeón"), {mot: 1, pre: 1, tac: 1}, null, 150000, {c: "#2a1a10"}]],
  ["c_myd5", N_("Ojo para el talento"), N_("Haz debutar a 5 canteranos."), ["s", "mYouthDebuts", 5], ["x_m_sc", "scarf", N_("Bufanda de la cantera"), {jov: 2, ves: 1}, "mtr", 60000, {c: "#2ad15a"}]],
  ["c_mrep70", N_("Respetado"), N_("Llega a 70 de prestigio."), ["s", "mRep", 70], ["x_m_gl", "glasses", N_("Gafas del respeto"), {pre: 1, lec: 2}, "mbr", 120000, {c: "#c3cdd2"}]],
  ["c_mw100", N_("Cien victorias"), N_("Gana 100 partidos como míster."), ["s", "mWins", 100], ["x_m_suit", "suit", N_("Traje de las cien victorias"), {tac: 2, mot: 1, neg: 1}, "mbr", 400000, {c: "#1b2a40", c2: "#f6c83a"}]],
  ["c_mt5", N_("Palmarés de míster"), N_("Gana 5 títulos como míster."), ["s", "mTitles", 5], ["x_m_wa", "watch", N_("Reloj del palmarés"), {lec: 2, tac: 1}, "mcl", 500000, {c: "#f6c83a"}]],
  ["c_mseas5", N_("Banquillo curtido"), N_("Entrena 5 temporadas."), ["s", "mSeasons", 5], ["x_m_shoe", "shoes", N_("Zapatos curtidos"), {ves: 1, fis: 1, neg: 1}, null, 90000, {c: "#5a3a22"}]],
  /* mascota: regalan un accesorio raro que aún no tenga */
  ["c_pw10", N_("Paseos diarios"), N_("Sal de paseo 10 veces con tu mascota."), ["s", "petWalks", 10], "pet"],
  ["c_pc3", N_("A la pasarela"), N_("Participa en 3 concursos con tu mascota."), ["s", "petContests", 3], "pet"],
  ["c_pg25", N_("Hincha de cuatro patas"), N_("Que tu mascota celebre contigo 25 goles."), ["s", "petGoals", 25], "pet"],
  ["c_pwin1", N_("Campeona del barrio"), N_("Gana un concurso con tu mascota."), ["s", "petWins", 1], "pet"]
];

var GXC = (function () {
  var api = {}, BY = {};
  /* piezas exclusivas: se añaden al catálogo con el reto como requisito (la que no tenga ranura válida se descarta) */
  var items = [];
  GX_CH.forEach(function (c) {
    BY[c[0]] = {id: c[0], n: c[1], d: c[2], cond: c[3], item: Array.isArray(c[4]) ? c[4][0] : null, pet: c[4] === "pet", who: /^m[A-Z]/.test(c[3][1]) ? "m" : c[4] === "pet" ? "pet" : "p"};
    if (Array.isArray(c[4])) { var d = c[4], slot = d[1]; items.push({d: [d[0], slot, d[2], d[3], d[4], d[5] || 20000, {ch: c[0]}, d[6]], m: BY[c[0]].who}); }
  });
  GXI.add(items.filter(function (x) { return x.m === "p"; }).map(function (x) { return x.d; }), "p");
  GXI.add(items.filter(function (x) { return x.m === "m"; }).map(function (x) { return x.d; }), "m");
  GX_SETS.forEach(function (s) { s.items = GXI.items().filter(function (it) { return it.set === s.k; }).map(function (it) { return it.id; }); s.slots = {}; s.items.forEach(function (id) { s.slots[GXI.item(id).slot] = 1; }); s.need = Object.keys(s.slots).length; });
  api.list = function () { return GX_CH.map(function (c) { return BY[c[0]]; }); };
  api.get = function (id) { return BY[id]; };
  api.name = function (id) { return BY[id] ? BY[id].n : id; };
  function st() { var g = GX.st(); if (!g) return {}; g.ch = g.ch || {}; return g.ch; }
  api.done = function (id) { return !!st()[id]; };
  api.prog = function (id) {
    var c = BY[id]; if (!c) return [0, 1];
    if (c.cond[0] === "s") return [Math.min(c.cond[2], Math.floor(GX.stat(c.cond[1]))), c.cond[2]];
    return [GX.has(c.cond[1]) ? 1 : 0, 1];
  };
  /* evaluación (se llama tras cada cambio de estado; los mismos números que los trofeos) */
  var last = "";
  api.check = function (force) {
    if (!S || !GX.st()) return [];
    var key = (S.yr || 0) + "|" + (S.tw || 0) + "|" + (S.bi || 0) + "|" + (S.blog ? S.blog.length : 0) + "|" + (S.mode || "");
    if (!force && key === last) return []; last = key;
    var done = st(), out = [], mgr = S.mode === "mgr";
    api.list().forEach(function (c) {
      if (done[c.id]) return;
      if (c.who === "m" && !mgr) return;
      if (c.who !== "m" && mgr) return;
      var p = api.prog(c.id); if (p[0] < p[1]) return;
      done[c.id] = {y: S.yr, d: Date.now()};
      /* recompensa: materiales y, en la mascota, un accesorio raro */
      var g = GXI.gear(c.who === "m" ? "m" : "p");
      if (g) { g.mat.cu += 4; g.mat.fi += 2; if (/100|200|400|bdo|t8|10m|mw100|mt5|ovr85/.test(c.id)) g.mat.es += 1; }
      if (c.pet && typeof PET_ACC2 !== "undefined" && typeof PetSim !== "undefined") {
        var pool = PET_ACC2.filter(function (a) { return !a.un && (a.r === "r" || a.r === "e") && !PetSim.has(a.id); });
        if (pool.length) { var a = pool[GX.hs(c.id + S.yr) % pool.length]; PetSim.own().push(a.id); done[c.id].gift = a.id; }
      }
      GX.st().q.push("ch:" + c.id); out.push(c.id);
    });
    if (out.length) GX.dirty();
    return out;
  };
  return api;
})();
/* estadísticas extra que comparten retos y trofeos */
(function () {
  var S0 = GX.STATS;
  function P() { return S.p || S.retiredP; }
  S0.wins = function () { return (S.blog || []).filter(function (b) { return !b.nat && b.m > 0 && b.gu > b.gt; }).length; };
  S0.motm = function (p) { return p.motm || 0; };
  S0.titles = function (p) { return (p.trophies || []).length; };
  S0.seasons = function (p) { return p.seasons.length; };
  S0.peakOvr = function (p) { return Math.round(Math.max(p.peak || 0, p.ovr || 0)); };
  S0.fame = function (p) { return Math.round(p.fame || 0); };
  S0.intlGoals = function (p) { return p.intl ? p.intl.g : 0; };
  S0.hatTricks = function () { return Math.max(GX.cnt("hatTricks"), (S.blog || []).filter(function (b) { return b.g >= 3; }).length); };
  S0.penGoals = function (p) { return Math.max(GX.cnt("penGoals"), p.sp && p.sp.pen ? p.sp.pen.g : 0); };
  S0.mWins = function () { var m = S.m; if (!m) return 0; var ss = m.ss || {}, last = m.seasons[m.seasons.length - 1], n = last && last.y === S.yr ? 0 : ss.w || 0; m.seasons.forEach(function (r) { n += r.w || 0; }); return n; };
  S0.mTitles = function () { return S.m ? S.m.trophies.length : 0; };
  S0.mRep = function () { return S.m ? Math.round(S.m.rep) : 0; };
  S0.mSeasons = function () { return S.m ? S.m.seasons.length : 0; };
  S0.petContests = function () { try { var pt = S.p.life.pet; return pt && pt.stats ? pt.stats.contests : 0; } catch (e) { return 0; } };
  S0.petWins = function () { try { var pt = S.p.life.pet; return pt && pt.stats ? pt.stats.wins : 0; } catch (e) { return 0; } };
  GX.on("pmatch", function (o) { var b = o.b || {}; if (b.g >= 3) GX.add("hatTricks"); });
  GX.on("sp", function (o) { if (!o.training && o.k === "pen" && o.scored) GX.add("penGoals"); });
  /* se evalúan junto a los trofeos */
  if (typeof achCheck === "function") {
    var root = typeof globalThis !== "undefined" ? globalThis : window, _ac = achCheck;
    root.achCheck = function () { var r = _ac.apply(this, arguments); try { GXC.check(); } catch (e) {} return r; };
  }
})();
