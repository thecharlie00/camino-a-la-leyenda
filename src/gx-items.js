/* gx-items.js — equipamiento con estadísticas y tiers (5.6).
   Todo en datos: ranuras, piezas, conjuntos, tiers y costes. Las piezas del jugador suman a sus atributos
   a través de attrs() (el único punto de atributos efectivos) con un tope global y rendimientos
   decrecientes; las de la mascota cambian su estilo, vínculo y ánimo; las del míster, sus estadísticas.
   Los cosméticos de antes (botas, mangas, cintas y guantes) se convierten en piezas al cargar. */
var GX_TIERS = [
  {k: 0, n: N_("Común"), c: "#9aa7aa", m: 1}, {k: 1, n: N_("Bronce"), c: "#c88a52", m: 1.3}, {k: 2, n: N_("Plata"), c: "#cfd8dc", m: 1.65},
  {k: 3, n: N_("Oro"), c: "#f6c83a", m: 2}, {k: 4, n: N_("Élite"), c: "#b07cff", m: 2.45}, {k: 5, n: N_("Leyenda"), c: "#ff6b3d", m: 3}
];
/* tope global del equipamiento del jugador: por atributo y en total (rendimientos decrecientes) */
var GX_CAP = {att: 6, total: 10, extra: 5};
var GX_SLOTS = {
  p: [["boots", N_("Botas")], ["shin", N_("Espinilleras")], ["socks", N_("Medias")], ["wrist", N_("Muñequeras")], ["band", N_("Cinta")], ["gloves", N_("Guantes")],
    ["therm", N_("Térmica")], ["hood", N_("Sudadera")], ["phones", N_("Cascos")], ["arm", N_("Brazalete")], ["neck", N_("Colgante")], ["watch", N_("Reloj")]],
  m: [["suit", N_("Traje")], ["coat", N_("Abrigo")], ["shoes", N_("Zapatos")], ["tie", N_("Corbata")], ["glasses", N_("Gafas")], ["scarf", N_("Bufanda")], ["notes", N_("Libreta")], ["watch", N_("Reloj")]],
  pet: [["h", N_("Cabeza")], ["f", N_("Cara")], ["n", N_("Cuello")], ["b", N_("Cuerpo")], ["t", N_("Juguete")]]
};
/* estadísticas: atributos de campo (el portero los recibe traducidos) y extras */
var GX_GKMAP = {RIT: "VEL", TIR: "COL", PAS: "SAQ", REG: "REF", DEF: "PAR", FIS: "EST"};
var GX_STATN = {rec: N_("Recuperación"), inj: N_("Resistencia"),
  tac: N_("Táctica"), mot: N_("Motivación"), ves: N_("Vestuario"), pre: N_("Prensa"), jov: N_("Jóvenes"), fis: N_("Preparación física"), neg: N_("Negociación"), lec: N_("Lectura de partido"),
  sty: N_("Estilo"), bnd: N_("Vínculo"), joy: N_("Ánimo"), ene: N_("Energía")};
/* piezas del jugador: [id, ranura, nombre, estadísticas en Común, conjunto, precio, requisito, aspecto]
   los ids «L_» son los cosméticos de siempre (cat:id en LIFE_COS) */
var GX_ITEMS = [
  /* botas */
  ["L_boots_blk", "boots", N_("Negras"), {RIT: 1}, null, 0, null, {cos: "boots:blk", c: "#16191b"}],
  ["L_boots_wht", "boots", N_("Blancas"), {PAS: 1}, null, 0, null, {cos: "boots:wht", c: "#f1f1ee"}],
  ["L_boots_red", "boots", N_("Rojo fuego"), {TIR: 2, DEF: -1}, "can", 20000, null, {cos: "boots:red", c: "#e3262f"}],
  ["L_boots_blu", "boots", N_("Azul eléctrico"), {RIT: 2, FIS: -1}, "ray", 20000, null, {cos: "boots:blu", c: "#1f7cff"}],
  ["L_boots_pnk", "boots", N_("Rosa flúor"), {REG: 2, DEF: -1}, "mag", 30000, {fame: 40}, {cos: "boots:pnk", c: "#ff4fb1"}],
  ["L_boots_gld", "boots", N_("Doradas"), {TIR: 2, PAS: 1, FIS: -1}, null, 60000, {tro: 5}, {cos: "boots:gld", c: "#e8c35a"}],
  ["b_ray", "boots", N_("Relámpago V"), {RIT: 2, REG: 1, DEF: -1}, "ray", 90000, null, {c: "#2de0ff", c2: "#0b3a52"}],
  ["b_can", "boots", N_("Cañonera"), {TIR: 3, REG: -1}, "can", 140000, null, {c: "#ff7a1a", c2: "#2a1408"}],
  ["b_silk", "boots", N_("Seda"), {REG: 2, PAS: 1, FIS: -1}, "mag", 120000, null, {c: "#d9c6ff", c2: "#3b2a66"}],
  ["b_tank", "boots", N_("Tanque"), {DEF: 2, FIS: 1, RIT: -1}, "wal", 80000, null, {c: "#4a5a3a", c2: "#c9d08a"}],
  ["b_mud", "boots", N_("Tacos de barro"), {FIS: 2, inj: 1}, "tit", 50000, null, {c: "#6b4a2a", c2: "#e2c08a"}],
  /* espinilleras */
  ["sh_lite", "shin", N_("Ligeras"), {RIT: 1}, null, 6000, null, {c: "#e8eef0"}],
  ["sh_armor", "shin", N_("Blindadas"), {DEF: 2, inj: 1, RIT: -1}, "wal", 45000, null, {c: "#59656b"}],
  ["sh_carbon", "shin", N_("Carbono"), {DEF: 1, FIS: 1}, "tit", 70000, null, {c: "#1c2226"}],
  ["sh_ray", "shin", N_("Rayo"), {RIT: 1, DEF: 1}, "ray", 60000, null, {c: "#2de0ff"}],
  ["sh_photo", "shin", N_("Con foto familiar"), {inj: 1, rec: 1}, null, 15000, null, {c: "#f3d27a"}],
  /* medias */
  ["so_cls", "socks", N_("Clásicas"), {FIS: 1}, null, 4000, null, {c: "#f4f4f0"}],
  ["so_comp", "socks", N_("De compresión"), {FIS: 1, rec: 1}, "tit", 35000, null, {c: "#222a30"}],
  ["so_grip", "socks", N_("Antideslizantes"), {REG: 1, TIR: 1}, "can", 40000, null, {c: "#ffb21e"}],
  ["so_ray", "socks", N_("Rayo"), {RIT: 1, rec: 1}, "ray", 45000, null, {c: "#2de0ff"}],
  ["so_silk", "socks", N_("Sedosas"), {REG: 1, PAS: 1}, "mag", 50000, null, {c: "#d9c6ff"}],
  /* muñequeras */
  ["wr_basic", "wrist", N_("Básica"), {PAS: 1}, null, 3000, null, {c: "#f4f4f0"}],
  ["wr_can", "wrist", N_("De artillero"), {TIR: 1, PAS: 1}, "can", 30000, null, {c: "#ff7a1a"}],
  ["wr_mag", "wrist", N_("Del mago"), {REG: 2, DEF: -1}, "mag", 35000, null, {c: "#7a3ad8"}],
  ["wr_lead", "wrist", N_("Del capitán"), {PAS: 1, DEF: 1}, "led", 40000, null, {c: "#ffb21e"}],
  /* cinta */
  ["L_band_wht", "band", N_("Cinta blanca"), {REG: 1}, null, 0, null, {cos: "band:wht", c: "#f4f4f0"}],
  ["L_band_blk", "band", N_("Cinta negra"), {TIR: 1}, null, 0, null, {cos: "band:blk", c: "#16191b"}],
  ["L_band_club", "band", N_("Cinta con los colores del club"), {PAS: 1, FIS: 1}, "led", 0, {fame: 30}, {cos: "band:club", c: "#c8312f"}],
  ["ba_focus", "band", N_("Concentración"), {TIR: 1, PAS: 1}, null, 25000, null, {c: "#66b9ff"}],
  ["ba_samurai", "band", N_("Samurái"), {TIR: 2, REG: 1, DEF: -1}, "can", 75000, null, {c: "#e3262f"}],
  /* guantes (al portero le suman a sus atributos; al de campo, poco) */
  ["L_gloves_cls", "gloves", N_("Clásicos"), {DEF: 1}, "gua", 0, null, {cos: "gloves:cls", c: "#f4f4f0", c2: "#d33"}],
  ["L_gloves_flu", "gloves", N_("Flúor"), {REG: 1}, "gua", 0, null, {cos: "gloves:flu", c: "#c6f432", c2: "#16191b"}],
  ["L_gloves_blk", "gloves", N_("Negros"), {DEF: 1, FIS: 1}, null, 0, {fame: 20}, {cos: "gloves:blk", c: "#1b1d1f", c2: "#ffb21e"}],
  ["L_gloves_gld", "gloves", N_("Dorados"), {DEF: 2, REG: 1, RIT: -1}, null, 0, {tro: 3}, {cos: "gloves:gld", c: "#e8c35a", c2: "#7a5a12"}],
  ["L_gloves_leg", "gloves", N_("Edición leyenda"), {DEF: 2, REG: 2, PAS: -1}, "gua", 250000, null, {cos: "gloves:leg", c: "#6c2bd9", c2: "#e8c35a"}],
  ["gl_therm", "gloves", N_("Térmicos de campo"), {FIS: 1, rec: 1}, null, 12000, null, {c: "#222a30", c2: "#66b9ff"}],
  /* térmica */
  ["L_sleeve_long", "therm", N_("Manga larga"), {FIS: 1}, null, 0, null, {cos: "sleeve:long", c: "#c8312f"}],
  ["L_sleeve_under", "therm", N_("Manguito térmico negro"), {FIS: 1, rec: 1}, "tit", 0, {fame: 15}, {cos: "sleeve:under", c: "#16191b"}],
  ["L_sleeve_tights", "therm", N_("Mallas térmicas"), {RIT: 1, rec: 1}, "ray", 0, {fame: 10}, {cos: "sleeve:tights", c: "#16191b"}],
  ["th_pro", "therm", N_("Térmica pro"), {FIS: 2, inj: 1, RIT: -1}, "tit", 65000, null, {c: "#2a3a40"}],
  ["th_gk", "therm", N_("Térmica de portero"), {DEF: 1, FIS: 1}, "gua", 40000, null, {c: "#2ad15a"}],
  /* sudadera de calentamiento */
  ["ho_warm", "hood", N_("Calentamiento"), {rec: 1}, null, 8000, null, {c: "#3a4b50"}],
  ["ho_club", "hood", N_("Capucha del club"), {FIS: 1, PAS: 1}, "led", 30000, null, {c: "#c8312f"}],
  ["ho_zen", "hood", N_("Modo zen"), {TIR: 1, REG: 1}, null, 45000, null, {c: "#e8eef0"}],
  ["ho_gk", "hood", N_("Sudadera de portero"), {REG: 1, rec: 1}, "gua", 30000, null, {c: "#7a3ad8"}],
  /* cascos */
  ["ph_basic", "phones", N_("Básicos"), {TIR: 1}, null, 5000, null, {c: "#1b1d1f"}],
  ["ph_iso", "phones", N_("Aislantes"), {TIR: 1, PAS: 1, REG: -1}, "can", 38000, null, {c: "#ff7a1a"}],
  ["ph_studio", "phones", N_("De estudio"), {PAS: 2, DEF: -1}, "mag", 55000, null, {c: "#d9c6ff"}],
  ["ph_beat", "phones", N_("Con graves"), {FIS: 1, rec: 1}, "tit", 42000, null, {c: "#e3262f"}],
  /* brazalete */
  ["L_band_cap", "arm", N_("Brazalete de capitán"), {PAS: 1, DEF: 1}, "led", 0, {cap: 1}, {cos: "band:cap", c: "#ffb21e"}],
  ["ar_lead", "arm", N_("Líder nato"), {PAS: 1, FIS: 1}, "led", 60000, {cap: 1}, {c: "#ffb21e"}],
  ["ar_black", "arm", N_("Brazalete negro"), {DEF: 1}, null, 10000, null, {c: "#16191b"}],
  /* colgante */
  ["ne_charm", "neck", N_("Amuleto"), {TIR: 1}, null, 6000, null, {c: "#e8c35a"}],
  ["ne_gold", "neck", N_("Cadena de oro"), {REG: 1, PAS: 1, FIS: -1}, "mag", 90000, null, {c: "#f6c83a"}],
  ["ne_fam", "neck", N_("Medalla familiar"), {rec: 1, inj: 1}, null, 20000, null, {c: "#cfd8dc"}],
  /* reloj */
  ["wa_sport", "watch", N_("Deportivo"), {RIT: 1}, null, 9000, null, {c: "#1b1d1f"}],
  ["wa_hr", "watch", N_("Pulsómetro"), {rec: 2}, "tit", 35000, null, {c: "#2ad15a"}],
  ["wa_chrono", "watch", N_("Cronógrafo"), {PAS: 1, RIT: 1}, "ray", 85000, null, {c: "#cfd8dc"}],
  ["wa_lux", "watch", N_("De lujo"), {TIR: 1, REG: 1, FIS: -1}, null, 350000, {fame: 60}, {c: "#f6c83a"}]
];
/* conjuntos: piezas de la misma línea; bonus con 3 piezas y con el conjunto completo */
var GX_SETS = [
  {k: "ray", n: N_("Línea Relámpago"), b3: {RIT: 1}, bAll: {RIT: 2, rec: 1}},
  {k: "can", n: N_("Línea Artillero"), b3: {TIR: 1}, bAll: {TIR: 2, PAS: 1}},
  {k: "mag", n: N_("Línea Mago"), b3: {REG: 1}, bAll: {REG: 2, PAS: 1}},
  {k: "wal", n: N_("Línea Muralla"), b3: {DEF: 1}, bAll: {DEF: 2, inj: 1}},
  {k: "tit", n: N_("Línea Titán"), b3: {FIS: 1}, bAll: {FIS: 2, rec: 1}},
  {k: "led", n: N_("Línea Capitán"), b3: {PAS: 1}, bAll: {PAS: 1, DEF: 1, FIS: 1}},
  {k: "gua", n: N_("Línea Guardián"), b3: {DEF: 1}, bAll: {DEF: 1, REG: 2}}
];
/* mejora de tier: dinero (sobre el precio de la pieza, con un mínimo) y materiales */
var GX_UP = [
  {money: 0.5, min: 4000, cu: 3, fi: 0, es: 0}, {money: 1, min: 9000, cu: 6, fi: 2, es: 0}, {money: 2, min: 20000, cu: 10, fi: 5, es: 1},
  {money: 4, min: 45000, cu: 15, fi: 9, es: 3}, {money: 8, min: 100000, cu: 25, fi: 15, es: 6}
];
var GX_MATS = [["cu", N_("Cuero"), "#a8703a"], ["fi", N_("Fibra"), "#66b9ff"], ["es", N_("Esquirla de estrella"), "#ffe58a"]];
/* mascota: cada accesorio suma según su rareza y su ranura (regla en datos) */
var GX_PET_STAT = {r: {c: 1, r: 2, e: 3, l: 4}, s: {h: "sty", f: "joy", n: "bnd", t: "ene"}};

var GXI = (function () {
  var api = {}, BY = {}, SET = {};
  GX_ITEMS.forEach(function (d) { BY[d[0]] = {id: d[0], slot: d[1], n: d[2], st: d[3], set: d[4], price: d[5], req: d[6], look: d[7] || {}, own: "p"}; });
  GX_SETS.forEach(function (s) { SET[s.k] = s; s.items = GX_ITEMS.filter(function (d) { return d[4] === s.k; }).map(function (d) { return d[0]; }); s.slots = {}; s.items.forEach(function (id) { s.slots[BY[id].slot] = 1; }); s.need = Object.keys(s.slots).length; });
  api.item = function (id) { return BY[id] || null; };
  api.items = function (who) { return Object.keys(BY).map(function (k) { return BY[k]; }).filter(function (it) { return !who || it.own === who; }); };
  api.set = function (k) { return SET[k] || null; };
  api.add = function (list, who) { list.forEach(function (d) { BY[d[0]] = {id: d[0], slot: d[1], n: d[2], st: d[3], set: d[4], price: d[5], req: d[6], look: d[7] || {}, own: who}; }); };
  /* ---------- estado (S.p.life.gear / S.m.gear) ---------- */
  function lifeG() { if (!S || !S.p || typeof lifeOf !== "function") return null; return lifeOf(); }
  api.gear = function (who) {
    who = who || (S && S.mode === "mgr" ? "m" : "p");
    var host = who === "m" ? S.m : lifeG(); if (!host) return null;
    var g = host.gear;
    if (!g || g.v !== 1) { g = host.gear = {v: 1, own: {}, eq: {}, mat: {cu: 0, fi: 0, es: 0}, n: {up: 0, buy: 0}}; if (who === "p") migrate(g); }
    return g;
  };
  /* los cosméticos de antes pasan a ser piezas (con su tier Común) y se respeta lo que llevabas puesto */
  function migrate(g) {
    var L = lifeG(); if (!L) return;
    GX_ITEMS.forEach(function (d) {
      var lk = d[7] && d[7].cos; if (!lk) return;
      var c = lk.split(":"), it = typeof lifeItem === "function" ? lifeItem(c[0], c[1]) : null; if (!it || it.id !== c[1]) return;
      var owned = !it.req || L.own.indexOf(lk) >= 0 || (typeof lifeLocked === "function" && !lifeLocked(c[0], it));
      if (owned) g.own[d[0]] = {t: 0, y: S.yr};
      if (L.cos && L.cos[c[0]] === c[1] && owned) g.eq[d[1]] = d[0];
    });
    if (!g.eq.boots && g.own.L_boots_blk) g.eq.boots = "L_boots_blk";
  }
  api.owned = function (id, who) { var g = api.gear(who); return !!(g && g.own[id]); };
  api.tier = function (id, who) { var g = api.gear(who); return g && g.own[id] ? g.own[id].t : 0; };
  api.give = function (id, tier, who) {
    var it = BY[id]; if (!it) return false; who = who || it.own;
    var g = api.gear(who === "pet" ? "p" : who); if (!g) return false;
    if (who === "pet") { try { if (typeof PetSim !== "undefined" && !PetSim.has(id)) PetSim.own().push(id); } catch (e) {} return true; }
    if (!g.own[id]) g.own[id] = {t: tier || 0, y: S.yr}; else if (tier > g.own[id].t) g.own[id].t = tier;
    if (typeof GX !== "undefined") GX.ev("gear", {k: "own", id: id});
    return true;
  };
  /* requisitos (como los cosméticos de siempre): null si se puede comprar */
  api.lock = function (it) {
    var r = it.req; if (!r) return null;
    var p = S.p, m = S.m;
    if (it.own === "m" && !m) return {k: "mgr", v: 1};
    if (r.fame && (it.own === "m" ? (m ? m.rep : 0) : p.fame) < r.fame) return {k: "fame", v: r.fame};
    if (r.tro && (it.own === "m" ? m.trophies.length : p.trophies.length) < r.tro) return {k: "tro", v: r.tro};
    if (r.cap && !(p && p.flags && p.flags.captain)) return {k: "cap", v: 1};
    if (r.ch && typeof GXC !== "undefined" && !GXC.done(r.ch)) return {k: "ch", v: r.ch};
    return null;
  };
  api.equip = function (id, who) {
    var it = BY[id]; who = who || it.own; var g = api.gear(who); if (!it || !g || !g.own[id]) return false;
    g.eq[it.slot] = g.eq[it.slot] === id ? null : id;
    /* el aspecto de los cosméticos de siempre sigue su pieza */
    if (who === "p" && it.look.cos && g.eq[it.slot] === id) { var c = it.look.cos.split(":"); lifeOf().cos[c[0]] = c[1]; }
    if (who === "p" && it.look.cos && g.eq[it.slot] !== id) { var c2 = it.look.cos.split(":"); lifeOf().cos[c2[0]] = LIFE_COS_DEF[c2[0]]; }
    syncLook();
    if (typeof GX !== "undefined") GX.ev("gear", {k: "eq", id: id, who: who});
    return true;
  };
  function syncLook() { var L = lifeG(), g = L && L.gear; if (!g) return; var b = BY[g.eq.boots]; L.eq = {boots: b ? {c: b.look.c, t: g.own[b.id] ? g.own[b.id].t : 0} : null}; }
  api.syncLook = syncLook;
  /* ---------- estadísticas de una pieza en su tier ---------- */
  api.stats = function (id, tier, who) {
    var it = BY[id]; if (!it) return {};
    var t = tier != null ? tier : api.tier(id, who), m = GX_TIERS[t].m, out = {};
    var st = it.st || (it.own === "pet" ? petStats(it) : {});
    Object.keys(st).forEach(function (k) { var v = st[k]; out[k] = v > 0 ? Math.round(v * m) : v; });
    return out;
  };
  function petStats(it) { var o = {}; o[GX_PET_STAT.s[it.slot] || "sty"] = GX_PET_STAT.r[it.r] || 1; if (it.r === "l" || it.r === "e") o.sty = (o.sty || 0) + 1; return o; }
  /* piezas de la mascota: se registran desde PET_ACC2 */
  if (typeof PET_ACC2 !== "undefined") PET_ACC2.forEach(function (a) { BY[a.id] = {id: a.id, slot: a.s, n: a.n, st: null, set: null, price: a.price, req: null, look: {}, own: "pet", r: a.r}; });
  /* ---------- bonus total con conjuntos, tope y rendimientos decrecientes ---------- */
  api.setCount = function (g, who) { var c = {}; Object.keys(g.eq).forEach(function (s) { var it = BY[g.eq[s]]; if (it && it.set && it.own === who) c[it.set] = (c[it.set] || 0) + 1; }); return c; };
  api.raw = function (who) {
    who = who || "p"; var g = api.gear(who), out = {}; if (!g) return out;
    function add(o) { Object.keys(o).forEach(function (k) { out[k] = (out[k] || 0) + o[k]; }); }
    Object.keys(g.eq).forEach(function (s) { var id = g.eq[s]; if (id && g.own[id] && BY[id] && BY[id].own === who) add(api.stats(id, g.own[id].t, who)); });
    var sc = api.setCount(g, who);
    Object.keys(sc).forEach(function (k) { var s = SET[k]; if (!s) return; if (sc[k] >= s.need && s.bAll) add(s.bAll); else if (sc[k] >= 3 && s.b3) add(s.b3); });
    return out;
  };
  /* aplica el tope: cada atributo con curva suave hasta GX_CAP.att y el total positivo hasta GX_CAP.total */
  function knee(v, k, cap) { return v <= k ? v : k + (cap - k) * (1 - Math.exp(-(v - k) / (cap - k))); }
  api.capped = function (raw) {
    var out = {}, pos = 0, keys = Object.keys(raw);
    keys.forEach(function (k) {
      var v = raw[k], att = /^[A-Z]{3}$/.test(k), cap = att ? GX_CAP.att : GX_CAP.extra;
      out[k] = v > 0 ? knee(v, cap / 2, cap) : v;
      if (att && out[k] > 0) pos += out[k];
    });
    if (pos > GX_CAP.total * 0.6) { var f = knee(pos, GX_CAP.total * 0.6, GX_CAP.total) / pos; keys.forEach(function (k) { if (/^[A-Z]{3}$/.test(k) && out[k] > 0) out[k] *= f; }); }
    return out;
  };
  api.bonus = function (who) { return api.capped(api.raw(who)); };
  /* en atributos del jugador actual (portero: traducidos) */
  api.attBonus = function () {
    var b = api.bonus("p"), gk = typeof isGK === "function" && isGK(), out = {};
    Object.keys(b).forEach(function (k) { if (!/^[A-Z]{3}$/.test(k)) return; var kk = gk ? GX_GKMAP[k] || k : k; out[kk] = (out[kk] || 0) + b[k]; });
    return out;
  };
  /* ---------- mejorar de tier ---------- */
  api.upCost = function (id, who) {
    var it = BY[id], t = api.tier(id, who); if (!it || t >= 5) return null;
    var u = GX_UP[t]; return {money: Math.max(u.min, Math.round(it.price * u.money / 1000) * 1000), cu: u.cu, fi: u.fi, es: u.es, to: t + 1};
  };
  function purse(who) { return who === "m" ? S.m : S.p; }
  api.canUp = function (id, who) {
    var c = api.upCost(id, who), g = api.gear(who); if (!c || !g) return false;
    return purse(who).money >= c.money && g.mat.cu >= c.cu && g.mat.fi >= c.fi && g.mat.es >= c.es;
  };
  api.upgrade = function (id, who) {
    who = who || BY[id].own; if (who === "pet") who = "p";
    if (!api.canUp(id, who)) return false;
    var c = api.upCost(id, who), g = api.gear(who), it = BY[id];
    purse(who).money -= c.money; g.mat.cu -= c.cu; g.mat.fi -= c.fi; g.mat.es -= c.es;
    if (it.own === "pet") { g.pt = g.pt || {}; g.pt[id] = c.to; } else g.own[id].t = c.to;
    g.n.up++;
    if (typeof GX !== "undefined") { GX.add("upgrades"); GX.ev("gear", {k: "up", id: id, t: c.to}); }
    syncLook();
    return c.to;
  };
  api.mat = function (k, n, who) { var g = api.gear(who || (S.mode === "mgr" ? "m" : "p")); if (g) g.mat[k] = (g.mat[k] || 0) + n; };
  /* tier de los accesorios de la mascota (se guardan aparte, en el equipamiento del jugador) */
  api.petTier = function (id) { var g = api.gear("p"); return g && g.pt && g.pt[id] || 0; };
  api.petBonus = function (pt) {
    var out = {}; if (!pt || !pt.eq) return out;
    Object.keys(pt.eq).forEach(function (s) { var id = pt.eq[s]; if (!id || !BY[id]) return; var st = api.stats(id, api.petTier(id), "pet"); Object.keys(st).forEach(function (k) { out[k] = (out[k] || 0) + st[k]; }); });
    return out;
  };
  return api;
})();
/* el tier de las piezas de la mascota usa su propio guardado */
(function () {
  var _t = GXI.tier;
  GXI.tier = function (id, who) { var it = GXI.item(id); if (it && it.own === "pet") return GXI.petTier(id); return _t(id, who); };
})();

/* ---------- ganchos: atributos, físico, lesiones, materiales y mascota ---------- */
(function () {
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  if (typeof attrs === "function") {
    var _attrs = attrs;
    root.attrs = function () {
      var out = _attrs.apply(this, arguments);
      try {
        if (!S || !S.p || S.mode === "mgr" || !S.p.life || !S.p.life.gear) return out;
        var b = GXI.attBonus();
        Object.keys(b).forEach(function (k) { if (out[k] != null) out[k] = Math.round(clamp(out[k] + b[k], 20, 99)); });
      } catch (e) {}
      return out;
    };
  }
  /* recuperación: el físico baja algo menos tras cada partido; resistencia: menos lesiones (generador propio) */
  if (typeof finishPlayer === "function") {
    var _fp = finishPlayer;
    root.finishPlayer = function (f) {
      var r = _fp.apply(this, arguments);
      try {
        var p = S.p; if (p && p.life && !p.life.gear && S.mode !== "mgr") GXI.gear("p");
        if (!p || S.mode === "mgr" || !p.life || !p.life.gear || !f) return r;
        var b = GXI.bonus("p"), g = p.life.gear;
        if (f.min > 0 && b.rec > 0) p.fit = clamp(p.fit + b.rec * 0.35 * Math.min(1, f.min / 90), 5, 100);
        /* materiales: cuero por jugar, fibra por ganar y por las grandes notas, estrellas en las finales ganadas */
        if (f.min > 0) {
          var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), bl = S.blog[S.blog.length - 1] || {};
          g.mat.cu += 1;
          if (gu > gt) { g.n.w = (g.n.w || 0) + 1; if (g.n.w % 2 === 0) g.mat.fi += 1; }
          if (bl.rt >= 8) g.mat.fi += 1;
          if (f.fin && gu > gt) g.mat.es += 1;
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof injure === "function") {
    var _inj = injure;
    root.injure = function (forced) {
      try {
        if (!forced && S && S.p && S.mode !== "mgr" && S.p.life && S.p.life.gear) {
          var b = GXI.bonus("p");
          if (b.inj > 0 && typeof GX !== "undefined") { var x = GX.rng(GX.hs("inj|" + S.yr + "|" + S.tw + "|" + S.p.fit))(); if (x < b.inj * 0.045) return; }
        }
      } catch (e) {}
      return _inj.apply(this, arguments);
    };
  }
  /* trofeos con recompensa de equipamiento o materiales */
  if (typeof GX !== "undefined") {
    GX.give = function (g) { [].concat(g).forEach(function (x) { if (x.item) GXI.give(x.item, x.t || 0); if (x.mat) GXI.mat(x.mat, x.n || 1); }); };
    GX.on("gear", function () { GX.dirty(); });
  }
  /* mascota: estilo en los concursos, vínculo y ánimo */
  if (typeof PetSim !== "undefined") {
    var _ss = PetSim.styleScore;
    PetSim.styleScore = function (pt, theme) { var s = _ss.apply(this, arguments); try { var b = GXI.petBonus(pt); s = Math.round(clamp(s + (b.sty || 0) * 1.6, 0, 100)); } catch (e) {} return s; };
    var _md = PetSim.mood;
    if (_md) PetSim.mood = function (pt) { var m = _md.apply(this, arguments); try { var b = GXI.petBonus(pt); m = Math.round(clamp(m + (b.joy || 0) * 0.8, 0, 100)); } catch (e) {} return m; };
    PetSim.eneMul = function (pt) { try { return Math.max(0.6, 1 - (GXI.petBonus(pt).ene || 0) * 0.05); } catch (e) { return 1; } };
    PetSim.bondMul = function (pt) { try { return 1 + (GXI.petBonus(pt).bnd || 0) * 0.03; } catch (e) { return 1; } };
  }
})();

/* ---------- piezas del míster (estadísticas propias: ver gx-mgr.js) ---------- */
var GX_MGR_ITEMS = [
  ["m_suit_cls", "suit", N_("Traje clásico"), {tac: 1, pre: 1}, "mcl", 0, null, {c: "#2a3340", c2: "#7a1d1d"}],
  ["m_suit_tw", "suit", N_("Traje de tweed"), {lec: 2, neg: 1, pre: -1}, "mbr", 120000, null, {c: "#6b5a3a", c2: "#2a4a2a"}],
  ["m_suit_wht", "suit", N_("Traje blanco de finales"), {mot: 2, pre: 1}, null, 400000, {tro: 3}, {c: "#ecebe4", c2: "#1d1404"}],
  ["m_suit_trk", "suit", N_("Chándal de banquillo"), {fis: 2, ves: 1, pre: -1}, "mtr", 30000, null, {c: "#1f4a8a", c2: "#f4f4f0"}],
  ["m_coat_long", "coat", N_("Abrigo largo"), {tac: 1, lec: 1}, "mcl", 60000, null, {c: "#1b1d1f"}],
  ["m_coat_pad", "coat", N_("Plumífero de banquillo"), {ves: 1, fis: 1}, "mtr", 25000, null, {c: "#1f4a8a"}],
  ["m_coat_cam", "coat", N_("Gabardina camel"), {pre: 2, neg: 1, fis: -1}, "mbr", 180000, null, {c: "#b08a5a"}],
  ["m_shoe_cls", "shoes", N_("Zapatos clásicos"), {pre: 1}, "mcl", 0, null, {c: "#2a1a10"}],
  ["m_shoe_run", "shoes", N_("Zapatillas"), {fis: 1, ves: 1}, "mtr", 15000, null, {c: "#f4f4f0"}],
  ["m_shoe_lux", "shoes", N_("Zapatos de lujo"), {neg: 2, ves: -1}, "mbr", 150000, null, {c: "#7a1d1d"}],
  ["m_tie_red", "tie", N_("Corbata roja"), {mot: 1}, "mcl", 8000, null, {c: "#c8312f"}],
  ["m_tie_club", "tie", N_("Corbata del club"), {ves: 1, mot: 1}, null, 20000, null, {c: "#ffb21e"}],
  ["m_tie_knit", "tie", N_("Corbata de punto"), {lec: 1, tac: 1}, "mbr", 45000, null, {c: "#2a4a2a"}],
  ["m_gl_read", "glasses", N_("Gafas de lectura"), {lec: 2, mot: -1}, "mbr", 30000, null, {c: "#1b1d1f"}],
  ["m_gl_sun", "glasses", N_("Gafas de sol"), {pre: 2, ves: -1}, null, 60000, null, {c: "#16191b", c2: "#2a3a40"}],
  ["m_gl_tac", "glasses", N_("Gafas de pizarra"), {tac: 2}, "mcl", 90000, {fame: 60}, {c: "#cfd8dc"}],
  ["m_sc_club", "scarf", N_("Bufanda del club"), {mot: 1, ves: 1}, null, 12000, null, {c: "#c8312f"}],
  ["m_sc_wool", "scarf", N_("Bufanda de lana"), {fis: 1, jov: 1}, "mtr", 18000, null, {c: "#e8eef0"}],
  ["m_sc_silk", "scarf", N_("Pañuelo de seda"), {neg: 1, pre: 1}, "mbr", 70000, null, {c: "#7a3ad8"}],
  ["m_nb_basic", "notes", N_("Libreta de notas"), {tac: 1}, null, 3000, null, {c: "#ffb21e"}],
  ["m_nb_tab", "notes", N_("Tableta de datos"), {lec: 2, tac: 1, ves: -1}, "mcl", 140000, null, {c: "#2a3a40"}],
  ["m_nb_youth", "notes", N_("Cuaderno de la cantera"), {jov: 2, tac: 1}, null, 50000, null, {c: "#2ad15a"}],
  ["m_wa_cls", "watch", N_("Reloj de bolsillo"), {lec: 1}, "mcl", 25000, null, {c: "#e8c35a"}],
  ["m_wa_sport", "watch", N_("Reloj deportivo"), {fis: 1, jov: 1}, "mtr", 20000, null, {c: "#1b1d1f"}],
  ["m_wa_lux", "watch", N_("Reloj de coleccionista"), {neg: 2, pre: 1, ves: -1}, "mbr", 500000, {fame: 70}, {c: "#f6c83a"}]
];
GXI.add(GX_MGR_ITEMS, "m");
GX_SETS.push({k: "mcl", n: N_("Línea Pizarra"), b3: {tac: 1}, bAll: {tac: 2, lec: 1}}, {k: "mbr", n: N_("Línea Despacho"), b3: {neg: 1}, bAll: {neg: 2, pre: 1}}, {k: "mtr", n: N_("Línea Chándal"), b3: {fis: 1}, bAll: {fis: 2, ves: 1}});
(function () {
  GX_SETS.forEach(function (s) { if (s.items) return; var all = GXI.items(); s.items = all.filter(function (it) { return it.set === s.k; }).map(function (it) { return it.id; }); s.slots = {}; s.items.forEach(function (id) { s.slots[GXI.item(id).slot] = 1; }); s.need = Object.keys(s.slots).length; });
  /* el traje y los zapatos clásicos los tiene todo míster al empezar */
  var _g = GXI.gear;
  GXI.gear = function (who) {
    var fresh = who === "m" && S && S.m && !(S.m.gear && S.m.gear.v === 1), g = _g.apply(this, arguments);
    if (fresh && g) { g.own.m_suit_cls = {t: 0, y: S.yr}; g.own.m_shoe_cls = {t: 0, y: S.yr}; g.eq.suit = "m_suit_cls"; g.eq.shoes = "m_shoe_cls"; }
    return g;
  };
})();

/* ---------- tienda: existencias del día, ofertas, destacado y compra ---------- */
(function () {
  function day() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
  GXI.day = day;
  function rnd(seed) { return GX.rng(GX.hs(seed)); }
  function skey() { var o = S.mode === "mgr" ? S.m : S.p; return o ? (o.fn || "") + (o.ln || "") + (o.y0 || "") : ""; }
  /* existencias: por sección, distintas cada día y para cada partida */
  GXI.stock = function (who) {
    var d = day(), seed = skey() + "|" + d, pool = GXI.items(who).filter(function (it) { return it.price > 0 && !GXI.owned(it.id, who); });
    var r = rnd("shop|" + who + "|" + seed), out = [];
    while (out.length < 8 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    return out;
  };
  GXI.offers = function () {
    var w = S.mode === "mgr" ? "m" : "p", r = rnd("off|" + w + "|" + skey() + "|" + day()), pool = GXI.items(w).filter(function (it) { return it.price > 0 && !GXI.owned(it.id, w) && !GXI.lock(it); }), out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    return out;
  };
  GXI.featured = function () {
    var w = S.mode === "mgr" ? "m" : "p", r = rnd("feat|" + w + "|" + skey() + "|" + day()), pool = GXI.items(w).filter(function (it) { return it.price >= 40000 && !GXI.owned(it.id, w) && !GXI.lock(it); });
    return pool.length ? pool[Math.floor(r() * pool.length)].id : null;
  };
  GXI.price = function (id) {
    var it = GXI.item(id); if (!it) return 0;
    var p = it.price; if (GXI.offers().indexOf(id) >= 0) p = Math.round(p * 0.7 / 500) * 500;
    return p;
  };
  GXI.buy = function (id) {
    var it = GXI.item(id); if (!it) return {ok: false};
    var w = it.own, purse = w === "m" ? S.m : S.p; if (!purse) return {ok: false};
    if (GXI.owned(id, w)) return {ok: false, owned: true};
    var lk = GXI.lock(it); if (lk) return {ok: false, lock: lk};
    var pr = GXI.price(id); if (purse.money < pr) return {ok: false, poor: true, price: pr};
    purse.money -= pr; GXI.give(id, 0, w);
    var g = GXI.gear(w); g.n.buy++;
    if (typeof GX !== "undefined") {
      GX.add("buys");
      if (pr < it.price) GX.flag("bargain");
    }
    return {ok: true, price: pr};
  };
  /* el destacado se calcula sobre lo que aún no tienes: se fija antes de comprar */
  var _buy = GXI.buy;
  GXI.buy = function (id) { var f = GXI.featured(); var r = _buy(id); if (r.ok && f === id && typeof GX !== "undefined") GX.st().c["fd" + day()] = 1; return r; };
  /* trofeos de tienda: se miran cada vez que cambia el equipamiento */
  if (typeof GX !== "undefined") {
    GX.STATS.buys = function () { var g = S.p && S.p.life && S.p.life.gear; return Math.max(GX.cnt("buys"), g ? g.n.buy : 0); };
    GX.STATS.upgrades = function () { var g = S.p && S.p.life && S.p.life.gear; return Math.max(GX.cnt("upgrades"), g ? g.n.up : 0); };
    GX.STATS.bootsOwned = function () { var g = S.p && S.p.life && S.p.life.gear; return g ? Object.keys(g.own).filter(function (id) { var it = GXI.item(id); return it && it.slot === "boots"; }).length : 0; };
    GX.STATS.featuredDays = function () { var c = GX.st().c; return Object.keys(c).filter(function (k) { return /^fd\d+$/.test(k); }).length; };
    GX.on("gear", function () {
      ["p", "m"].forEach(function (w) {
        var g = (w === "p" ? S.p && S.p.life && S.p.life.gear : S.m && S.m.gear); if (!g) return;
        if (Object.keys(g.own).some(function (id) { return g.own[id].t >= 5; })) GX.flag(w === "p" ? "legendPiece" : "mLegendPiece");
        var sc = GXI.setCount(g, w); if (GX_SETS.some(function (s) { return sc[s.k] >= s.need && s.need >= 3; })) GX.flag(w === "p" ? "fullSet" : "mFullSet");
        var sl = GX_SLOTS[w], gold = sl.every(function (s) { var id = g.eq[s[0]]; return id && g.own[id] && g.own[id].t >= 3; }); if (gold) GX.flag(w === "p" ? "allGold" : "mAllGold");
      });
    });
  }
})();
