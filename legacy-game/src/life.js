/* life.js — VIDA FUERA DEL CAMPO (carrera de jugador/jugadora, patch 2.5)
   Dorsal, estilo de vida e inversiones, look del avatar y celebración, y rivalidad dinámica.
   Todo vive en S.p.life (se crea al vuelo: las partidas antiguas siguen funcionando).
   Se engancha envolviendo funciones del motor (joinClub, acceptOffer, startSeason, blockDone,
   seasonEnd, finishPlayer, attrs, growthTick, awardsCeremony, newCareer). */

/* ---------- datos ---------- */
var LIFE_CLASSIC = {POR: [1, 13, 25], DFC: [4, 5, 3, 2, 15, 24], LD: [2, 12, 22], LI: [3, 15, 18], MCD: [6, 16, 5, 18], MC: [8, 6, 14, 18, 20],
  MCO: [10, 8, 22, 20], MD: [7, 17, 19, 21], ED: [7, 11, 17, 19, 21], MI: [11, 7, 17, 23], EI: [11, 7, 17, 19, 23], DC: [9, 19, 21, 14, 29]};
var LIFE_GEN_POS = ["POR", "POR", "POR", "DFC", "DFC", "DFC", "DFC", "LD", "LD", "LI", "LI", "MCD", "MCD", "MC", "MC", "MC", "MCO", "MCO", "ED", "EI", "ED", "EI", "DC", "DC", "DC"];
/* servicios: coste por tramo = base + fracción del sueldo anual; duran «dur» tramos (5 = una temporada) */
var LIFE_SVC = [
  {k: "trainer", n: N_("Entrenador personal"), d: N_("Sesiones extra a tu medida: +2 en tus atributos físicos y algo más de progresión."), base: 3000, sal: 0.02, dur: 5,
    att: {RIT: 2, FIS: 2}, gk: {VEL: 2, EST: 2}, ico: "🏋️"},
  {k: "gkcoach", n: N_("Entrenador específico de porteros"), d: N_("Trabajo de reflejos cada mañana: +3 en Reflejos y +2 en Paradas."), base: 3500, sal: 0.025, dur: 5,
    gk: {REF: 3, PAR: 2}, gkOnly: true, ico: "🧤"},
  {k: "mental", n: N_("Psicólogo deportivo"), d: N_("«Sangre fría»: +2 en Tiro (Colocación si eres portero) y la forma cae más despacio tras un mal partido."), base: 2500, sal: 0.015, dur: 5,
    att: {TIR: 2}, gk: {COL: 2}, ico: "🧠"},
  {k: "press", n: N_("Agente de prensa"), d: N_("Entrevistas, marcas y redes: más seguidores y más fama cada tramo."), base: 2000, sal: 0.02, dur: 5, ico: "🎙️"},
  {k: "physio", n: N_("Nutricionista y fisio"), d: N_("Dieta y recuperación personal: un 30 % menos de riesgo de lesión y recuperas mejor el físico."), base: 4000, sal: 0.02, dur: 5, ico: "🥗"}
];
/* inversiones: se revalorizan (o no) al final de cada temporada */
var LIFE_INV = [
  {k: "piso", n: N_("Piso para alquilar"), d: N_("Riesgo bajo: se revaloriza poco a poco y te deja un alquiler cada temporada."), price: 120000, risk: 0, ico: "🏠"},
  {k: "rest", n: N_("Restaurante con amigos"), d: N_("Riesgo medio: puede ir muy bien… o comerse parte de lo invertido."), price: 250000, risk: 1, ico: "🍽️"},
  {k: "startup", n: N_("Startup tecnológica"), d: N_("Riesgo alto: puede multiplicar tu dinero o desaparecer en un año."), price: 60000, risk: 2, ico: "🚀"},
  {k: "hotel", n: N_("Hotel en la costa"), d: N_("Riesgo medio-bajo, inversión grande: rentas altas cuando ya eres una estrella."), price: 2500000, risk: 0.5, ico: "🏨"}
];
/* cosméticos: req = {fame} | {tro} | {money} (se compra una vez) | {cap} (capitán) */
var LIFE_COS = {
  skin: [{id: "s1", c: "#f3d2b3"}, {id: "s2", c: "#e0ac85"}, {id: "s3", c: "#c18a5e"}, {id: "s4", c: "#8d5a3b"}, {id: "s5", c: "#5b3a26"}],
  hair: [{id: "short", n: N_("Corto")}, {id: "buzz", n: N_("Rapado")}, {id: "curly", n: N_("Rizado")}, {id: "long", n: N_("Largo con coleta")}, {id: "bald", n: N_("Sin pelo")}],
  hcol: [{id: "h1", c: "#1d1612"}, {id: "h2", c: "#5a3a22"}, {id: "h3", c: "#b07a3c"}, {id: "h4", c: "#e5c27a"}, {id: "h5", c: "#b9b9b9"}],
  boots: [{id: "blk", n: N_("Negras"), c: "#16191b"}, {id: "wht", n: N_("Blancas"), c: "#f1f1ee"}, {id: "red", n: N_("Rojo fuego"), c: "#e3262f", req: {money: 20000}},
    {id: "blu", n: N_("Azul eléctrico"), c: "#1f7cff", req: {money: 20000}}, {id: "pnk", n: N_("Rosa flúor"), c: "#ff4fb1", req: {fame: 40}}, {id: "gld", n: N_("Doradas"), c: "#e8c35a", req: {tro: 5}}],
  sleeve: [{id: "short", n: N_("Manga corta")}, {id: "long", n: N_("Manga larga")}, {id: "under", n: N_("Manguito térmico negro"), req: {fame: 15}}, {id: "tights", n: N_("Mallas térmicas"), req: {fame: 10}}],
  band: [{id: "none", n: N_("Sin cinta")}, {id: "wht", n: N_("Cinta blanca"), c: "#f4f4f0"}, {id: "blk", n: N_("Cinta negra"), c: "#16191b"},
    {id: "club", n: N_("Cinta con los colores del club"), req: {fame: 30}}, {id: "cap", n: N_("Brazalete de capitán"), req: {cap: 1}}],
  gloves: [{id: "cls", n: N_("Clásicos"), c: "#f4f4f0", c2: "#d33"}, {id: "flu", n: N_("Flúor"), c: "#c6f432", c2: "#16191b"}, {id: "blk", n: N_("Negros"), c: "#1b1d1f", c2: "#ffb21e", req: {fame: 20}},
    {id: "gld", n: N_("Dorados"), c: "#e8c35a", c2: "#7a5a12", req: {tro: 3}}, {id: "leg", n: N_("Edición leyenda"), c: "#6c2bd9", c2: "#e8c35a", req: {money: 250000}}],
  cel: [{id: "fist", n: N_("Puño al aire")}, {id: "plane", n: N_("El avión")}, {id: "lips", n: N_("Dedo en los labios")}, {id: "heart", n: N_("Corazón con las manos")},
    {id: "knee", n: N_("Rodillazo deslizando"), req: {fame: 15}}, {id: "phone", n: N_("La llamada de teléfono"), req: {fame: 25}}, {id: "flip", n: N_("Voltereta"), req: {fame: 35}},
    {id: "spin", n: N_("Salto con giro"), req: {tro: 2}}, {id: "statue", n: N_("La estatua"), req: {tro: 6}}, {id: "dance", n: N_("Baile en el córner"), req: {money: 50000}},
    {id: "roar", n: N_("Rugido a la grada")}, {id: "chest", n: N_("Golpes en el pecho")}]
};
var LIFE_COS_DEF = {skin: "s2", hair: "short", hcol: "h1", boots: "blk", sleeve: "short", band: "none", gloves: "cls", cel: "fist"};
var LIFE_NEXT_NUM = null;

/* ---------- estado ---------- */
function lifeOn() { return !!(S && S.p && S.mode !== "mgr"); }
function lifeDefNum(pos) { return (LIFE_CLASSIC[pos] || [10])[0]; }
function lifeOf() {
  var p = S.p;
  if (!p.life) {
    var n = LIFE_NEXT_NUM >= 1 && LIFE_NEXT_NUM <= 99 ? Math.round(LIFE_NEXT_NUM) : lifeDefNum(p.pos);
    p.life = {pref: n, num: 0, nc: -2, nh: [], svc: {}, inv: [], own: [], cos: {}, rv: null, rvh: [], sv: 0};
  }
  return p.life;
}
function lifeCos(k) { var c = lifeOf().cos; return c[k] || LIFE_COS_DEF[k]; }
function lifeItem(cat, id) { var l = LIFE_COS[cat] || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return l[0]; }
function lifeTroN() { return S.p.trophies.length; }
/* ¿está desbloqueado? devuelve null si sí; si no, {k, v} con el requisito */
function lifeLocked(cat, it) {
  var r = it.req, L = lifeOf(), p = S.p;
  if (!r) return null;
  if (L.own.indexOf(cat + ":" + it.id) >= 0) return null;
  if (r.fame && p.fame < r.fame) return {k: "fame", v: r.fame};
  if (r.tro && lifeTroN() < r.tro) return {k: "tro", v: r.tro};
  if (r.cap && !p.flags.captain) return {k: "cap", v: 1};
  if (r.money) return {k: "money", v: r.money};
  return null;
}
function lifeSetCos(cat, id) {
  var it = lifeItem(cat, id), L = lifeOf();
  if (!it || it.id !== id) return {ok: false};
  var lk = lifeLocked(cat, it);
  if (lk && lk.k !== "money") return {ok: false, lock: lk};
  if (lk && lk.k === "money") {
    if (S.p.money < lk.v) return {ok: false, lock: lk, poor: true};
    S.p.money -= lk.v; L.own.push(cat + ":" + id);
  }
  L.cos[cat] = id;
  return {ok: true, paid: lk ? lk.v : 0};
}
function lifeCel() { return lifeItem("cel", lifeCos("cel")); }

/* ---------- dorsales ---------- */
function lifeHashName(seed, ni) {
  var pool = namePool(ni), f = pool.f.split(","), l = pool.l.split(","), h = hashStr(seed);
  return f[h % f.length] + " " + l[(h >>> 8) % l.length];
}
/* reparte dorsales entre una lista [{pos, nm, ovr, h}] de forma determinista */
function lifeAssign(list) {
  var used = {};
  list.sort(function (a, b) { return b.ovr - a.ovr; });
  list.forEach(function (x) {
    var cl = LIFE_CLASSIC[x.pos] || [], n = 0;
    if ((x.h % 10) < 7) for (var i = 0; i < cl.length; i++) if (!used[cl[i]]) { n = cl[i]; break; }
    if (!n) { var k = 2 + x.h % 38; for (var j = 0; j < 98 && used[k]; j++) k = k % 40 + 1; if (used[k]) for (k = 1; used[k]; k++); n = k; }
    used[n] = x.nm;
  });
  return used;
}
/* dorsales ocupados en el club c esta temporada: {num: nombre} */
function lifeTaken(c) {
  if (c == null || c < 0 || !W.clubs[c]) return {};
  var rc = realClub(c), list = [];
  if (rc) {
    rc.p.forEach(function (r, i) {
      if (realRetired(r, S.yr, i)) return;
      list.push({pos: r[2], nm: (r[0] ? r[0] + " " : "") + r[1], ovr: realAt(r, S.yr).ovr, h: hashStr(r[0] + r[1] + i)});
    });
  } else {
    var ci = W.clubs[c].ci, seed = clubName(c) + ":" + S.yr;
    LIFE_GEN_POS.forEach(function (pos, i) {
      var h = hashStr(seed + "#" + i);
      if (h % 9 === 0) return;
      list.push({pos: pos, nm: lifeHashName(seed + "#" + i, ci), ovr: 60 + h % 25, h: h});
    });
  }
  return lifeAssign(list);
}
function lifeNearest(pref, taken) {
  if (!taken[pref]) return pref;
  for (var d = 1; d < 99; d++) {
    if (pref + d <= 99 && !taken[pref + d]) return pref + d;
    if (pref - d >= 1 && !taken[pref - d]) return pref - d;
  }
  return 99;
}
/* al llegar a un club (fichaje, cesión, vuelta de cesión) */
function lifeSyncNum() {
  if (!lifeOn()) return;
  var p = S.p, L = lifeOf();
  if (L.nc === p.club && L.num) return;
  var taken = lifeTaken(p.club), n = lifeNearest(L.pref, taken);
  L.num = n; L.nc = p.club; L.ny = S.yr; L.keep = false;
  L.nh.push([S.yr, p.club, n]);
  if (L.nh.length > 40) L.nh.splice(0, L.nh.length - 40);
  if (n !== L.pref && S.feed) notify(tr("El {n} es de {name} en el {club}: llevarás el {m}. La próxima temporada podrás pedirlo.", {n: L.pref, name: taken[L.pref], club: clubName(p.club), m: n}), "amber");
}
/* cambiar el dorsal preferido desde la ficha: si está libre en tu club, te lo pones ya */
function lifeSetPref(n) {
  n = Math.round(+n);
  if (!(n >= 1 && n <= 99)) return {ok: false};
  var p = S.p, L = lifeOf();
  L.pref = n;
  if (L.num === n) return {ok: true, now: true};
  var taken = lifeTaken(p.club);
  if (!taken[n]) { L.num = n; L.nc = p.club; L.keep = false; lifeNumHist(n); return {ok: true, now: true}; }
  L.keep = false;
  return {ok: true, now: false, by: taken[n]};
}
function lifeNumHist(n) {
  var L = lifeOf(), last = L.nh[L.nh.length - 1];
  if (last && last[0] === S.yr && last[1] === S.p.club) last[2] = n; else L.nh.push([S.yr, S.p.club, n]);
}
function lifeNumChance(x) {
  if (x.free) return 0.95;
  var r = roleNow(), base = {Estrella: 0.72, Titular: 0.5, "Rotación": 0.3}[r] || 0.2;
  return clamp(base + S.p.fame / 250 + (S.p.flags.captain ? 0.1 : 0), 0.1, 0.9);
}
function lifeNumPend() {
  var p = S.p, L = lifeOf();
  if (L.keep || L.num === L.pref || L.nc !== p.club || L.ny >= S.yr) return;
  var taken = lifeTaken(p.club);
  S.pend.push({k: "lnum", n: L.pref, cur: L.num, free: !taken[L.pref], mate: taken[L.pref] || ""});
}
if (typeof EX_PEND !== "undefined") EX_PEND.lnum = {
  desc: function (x) {
    var pc = lifeNumChance(x);
    return {tag: "real", tagTxt: tr("Decisión de carrera"), cls: "", cat: tr("Dorsal"), title: tr("¿Pides el {n}?", {n: x.n}),
      text: x.free ? tr("El {n} ha quedado libre en el {club}. Llevas el {cur}, pero tu número de siempre está ahí, esperándote.", {n: x.n, club: clubName(S.p.club), cur: x.cur})
        : tr("El {n} sigue siendo de {name}. Puedes pedirle al club que te lo dé: depende de tu peso en el vestuario.", {n: x.n, name: x.mate}),
      ref: null,
      opts: [descOpt({t: tr("Pedir el {n}", {n: x.n}), p: pc, ok: {fx: {mor: 3}}, ko: {fx: {mor: -3, coach: -1}}}, function (u) { return fxPreview(u.fx, u.good ? tr("Dorsal {n}", {n: x.n}) : tr("Sigues con el {n}", {n: x.cur})); }),
        descOpt({t: tr("Quedarte con el {n}", {n: x.cur}), ok: {}}, function () { return [["note", 0, tr("Dorsal {n}", {n: x.cur})]]; })]};
  },
  resolve: function (x, choice) {
    var p = S.p, L = lifeOf(), good = null, chips = [], txt;
    S.pend.shift();
    L.ny = S.yr;
    if (choice === 0) {
      good = chance(lifeNumChance(x));
      if (good) { L.num = x.n; lifeNumHist(x.n); p.mor = clamp(p.mor + 3, 0, 100); chips = [["mor", 3], ["note", 0, tr("Dorsal {n}", {n: x.n})]];
        txt = x.free ? tr("El utillero te prepara la camiseta con el {n}. Vuelves a ser tú.", {n: x.n}) : tr("{name} te cede el {n} con un abrazo delante de todos.", {name: x.mate, n: x.n}); }
      else { p.mor = clamp(p.mor - 3, 0, 100); p.coach = clamp(p.coach - 1, 0, 100); chips = [["mor", -3], ["coach", -1]];
        txt = tr("El club dice que no: el {n} no se toca. Seguirás con el {cur}.", {n: x.n, cur: x.cur}); }
    } else { L.keep = true; txt = tr("El {n} ya es tuyo. Quién sabe, quizá acabe siendo tu número.", {n: x.cur}); chips = [["note", 0, tr("Dorsal {n}", {n: x.cur})]]; }
    return {t: "decision", tipo: "real", cat: tr("Dorsal"), title: tr("¿Pides el {n}?", {n: x.n}), choice: choice === 0 ? tr("Pedir el {n}", {n: x.n}) : tr("Quedarte con el {n}", {n: x.cur}), txt: txt, chips: chips, good: good, y: S.yr};
  }
};

/* ---------- estilo de vida ---------- */
function lifeSvcDef(k) { for (var i = 0; i < LIFE_SVC.length; i++) if (LIFE_SVC[i].k === k) return LIFE_SVC[i]; return null; }
function lifeSvcCost(d) { var sal = S.p.con ? S.p.con.sal : 0; return Math.round((d.base + sal * d.sal) / 500) * 500; }
function lifeSvcOn(k) { var s = lifeOf().svc[k]; return !!(s && s.left > 0); }
function lifeSvcOk(d) { return !(d.gkOnly && !isGK()); }
function lifeHire(k) {
  var d = lifeSvcDef(k), L = lifeOf(), p = S.p;
  if (!d || !lifeSvcOk(d)) return {ok: false};
  if (lifeSvcOn(k)) return {ok: false, on: true};
  var c = lifeSvcCost(d);
  if (p.money < c) return {ok: false, poor: true, cost: c};
  p.money -= c;
  L.svc[k] = {left: d.dur, c: c};
  return {ok: true, cost: c};
}
function lifeFire(k) { var L = lifeOf(); if (L.svc[k]) delete L.svc[k]; }
/* bonus de atributos de los servicios activos */
function lifeAttBonus() {
  var out = {}, gk = isGK();
  LIFE_SVC.forEach(function (d) {
    if (!lifeSvcOn(d.k)) return;
    var m = gk ? d.gk : d.att;
    if (m) Object.keys(m).forEach(function (a) { out[a] = (out[a] || 0) + m[a]; });
  });
  return out;
}
/* cobrar y descontar un tramo (al final de cada tramo de temporada) */
function lifeSvcTick() {
  var L = lifeOf(), p = S.p, gone = [];
  Object.keys(L.svc).forEach(function (k) {
    var s = L.svc[k], d = lifeSvcDef(k);
    if (!d) { delete L.svc[k]; return; }
    if (k === "press") { p.fol = p.fol * 1.06 + 0.3; p.fame = clamp(p.fame + 0.6, 0, 100); p.fans = clamp(p.fans + 0.5, 0, 100); }
    if (k === "physio") p.fit = clamp(p.fit + 3, 0, 100);
    s.left--;
    if (s.left <= 0) { delete L.svc[k]; gone.push(tr(d.n)); return; }
    var c = lifeSvcCost(d);
    if (p.money < c) { delete L.svc[k]; notify(tr("No llegas a pagar a tu {svc}: se acaba el contrato.", {svc: lcName(d.n)}), "amber"); return; }
    p.money -= c; s.c = c;
  });
  if (gone.length) notify(tr("Termina el contrato: {list}. Puedes renovarlo en la pestaña Jugador.", {list: gone.join(", ")}), "info");
}
function lifeInvDef(k) { for (var i = 0; i < LIFE_INV.length; i++) if (LIFE_INV[i].k === k) return LIFE_INV[i]; return null; }
function lifeInvest(k) {
  var d = lifeInvDef(k), L = lifeOf(), p = S.p;
  if (!d) return {ok: false};
  if (L.inv.length >= 6) return {ok: false, full: true};
  if (p.money < d.price) return {ok: false, poor: true};
  p.money -= d.price;
  L.inv.push({k: k, v: d.price, p: d.price, y: S.yr, last: 0});
  return {ok: true};
}
function lifeSell(i) {
  var L = lifeOf(), x = L.inv[i];
  if (!x) return 0;
  var v = Math.round(x.v);
  S.p.money += v; L.inv.splice(i, 1);
  return v;
}
/* fin de temporada: revalorización y rentas */
function lifeInvSeason() {
  var L = lifeOf(), p = S.p, msg = [];
  L.inv = L.inv.filter(function (x) {
    var d = lifeInvDef(x.k); if (!d) return false;
    var old = x.v, inc = 0, r;
    if (d.risk === 0) { r = rf(0.01, 0.06); inc = Math.round(x.v * 0.04); }
    else if (d.risk === 0.5) { r = rf(-0.06, 0.08); inc = Math.round(x.v * rf(0.03, 0.07)); }
    else if (d.risk === 1) { r = chance(0.18) ? -rf(0.35, 0.6) : rf(-0.12, 0.3); inc = r > 0 ? Math.round(x.v * 0.05) : 0; }
    else { var z = R(); r = z < 0.3 ? -1 : z < 0.42 ? rf(1.2, 3) : rf(-0.4, 0.5); }
    x.v = Math.max(0, Math.round(x.v * (1 + r)));
    x.last = x.v - old;
    if (inc) p.money += inc;
    if (x.v <= 0) { msg.push({t: "bad", x: tr("{inv}: el negocio quiebra y pierdes lo invertido.", {inv: tr(d.n)})}); return false; }
    if (r >= 1) msg.push({t: "star", x: tr("{inv}: ¡pelotazo! Ahora vale {v}.", {inv: tr(d.n), v: fmtMoney(x.v)})});
    else if (inc) msg.push({t: "ok", x: tr("{inv}: te deja {v} de beneficio.", {inv: tr(d.n), v: fmtMoney(inc)})});
    return true;
  });
  return msg;
}

/* ---------- rivalidad ---------- */
function lifeGroup() { return posGroup(); }
function lifeRvKey(r) { return r.n + "|" + r.ni; }
function lifeRvCands() {
  var p = S.p, g = lifeGroup(), myR = S.cr[p.club] || 70, myLi = S.cl[p.club], out = [], seen = {};
  var add = function (r) {
    if (!r || r.club === p.club || r.g !== g) return;
    var k = lifeRvKey(r); if (seen[k]) return; seen[k] = 1;
    var sc = Math.abs(r.ovr - p.ovr) + Math.abs(r.age - p.age) * 0.6 + (S.cl[r.club] === myLi ? 0 : 4) + (r.ni === pnat() ? -0.8 : 0);
    out.push({r: r, sc: sc});
  };
  (S.rv || []).forEach(function (r) { add({n: r.n, ni: r.ni, g: r.g, ovr: r.ovr, age: r.age, club: r.club, star: 1}); });
  if (typeof realDB === "function" && realDB()) {
    W.clubs.forEach(function (cl, c) {
      if (c === p.club || S.cl[c] < 0 || Math.abs((S.cr[c] || 0) - myR) > 9) return;
      var rc = realClub(c); if (!rc) return;
      var ofs = realOffset(c, S.yr);
      rc.p.forEach(function (r, i) {
        if (realRetired(r, S.yr, i) || !W.pos[r[2]] || W.pos[r[2]].g !== g) return;
        var at = realAt(r, S.yr), ni = W.cIdx[r[5]];
        if (Math.abs(at.age - p.age) > 5) return;
        add({n: (r[0] ? r[0].charAt(0) + ". " : "") + r[1], ni: ni != null ? ni : cl.ci, g: g, ovr: round1(clamp(at.ovr + ofs, 40, 94)), age: at.age, club: c, pos: r[2]});
      });
    });
  }
  out.sort(function (a, b) { return a.sc - b.sc; });
  return out;
}
function lifeNewRv() {
  var p = S.p, c = lifeRvCands().slice(0, 3), r;
  if (c.length && c[0].sc < 9) r = pick(c).r;
  else {
    /* sin datos reales cerca de tu nivel: un rival inventado de un club parecido */
    var myR = S.cr[p.club] || 70, pool = [];
    W.clubs.forEach(function (cl, i) { if (i !== p.club && S.cl[i] >= 0 && Math.abs(S.cr[i] - myR) <= 6) pool.push(i); });
    var club = pool.length ? pick(pool) : p.club, ni = W.clubs[club].ci;
    if (chance(0.35)) ni = pnat();
    r = {n: rivalName(ni), ni: ni, g: lifeGroup(), ovr: round1(p.ovr + rf(-1.5, 2)), age: clamp(p.age + ri(-1, 2), 16, 34), club: club};
  }
  var L = lifeOf();
  L.rv = {n: r.n, ni: r.ni, g: r.g, ovr: r.ovr, age: r.age, club: r.club, star: r.star ? 1 : 0, since: S.yr, h2h: [0, 0, 0], ss: lifeRvSS(), rows: [], duels: [], hl: []};
  lifeHeadline({t: "ok", tk: N_("Nace una rivalidad: {me} y {him}, dos {pos} llamados a pelear por lo mismo."), tp: {pos: lcName(lifeGroupName(r.g))}});
  return L.rv;
}
function lifeGroupName(g) { return {POR: N_("porteros"), DEF: N_("defensas"), MED: N_("centrocampistas"), DEL: N_("delanteros")}[g] || N_("jugadores"); }
function lifeRvSS() { return {apps: 0, g: 0, a: 0, cs: 0, gc: 0, sv: 0, rs: 0, rn: 0, tro: 0, caps: 0, tk: []}; }
function lifeMeName() { return S.p.fn.charAt(0) + ". " + S.p.ln; }
function lifeHeadline(o) {
  var L = lifeOf(), rv = L.rv; if (!rv) return "";
  var tp = Object.assign({me: lifeMeName(), him: rv.n}, o.tp || {});
  rv.hl.unshift({tk: o.tk, tp: tp, y: S.yr, t: o.t || "ok"});
  if (rv.hl.length > 8) rv.hl.length = 8;
  return tr(o.tk, tp);
}
/* estadísticas de un tramo para el rival (se generan al cerrar cada tramo) */
function lifeRvBlock() {
  var L = lifeOf(), rv = L.rv; if (!rv || !S.bst) return;
  var tm = S.bst.tm || 8, cr = S.cr[rv.club] || 75, rel = rv.ovr - cr, ss = rv.ss;
  var share = clamp(0.62 + rel * 0.06, 0.2, 0.96), apps = 0;
  for (var i = 0; i < tm; i++) if (chance(share)) apps++;
  var gR = {DEL: 0.42, MED: 0.13, DEF: 0.05, POR: 0}[rv.g] * clamp(1 + (rv.ovr - 75) * 0.03, 0.4, 1.8);
  var aR = {DEL: 0.2, MED: 0.22, DEF: 0.08, POR: 0.005}[rv.g] * clamp(1 + (rv.ovr - 75) * 0.025, 0.5, 1.6);
  var gcR = clamp(1.25 - (cr - 75) * 0.035, 0.45, 1.9);
  for (var k = 0; k < apps; k++) {
    var g = 0, a = 0;
    if (chance(gR)) { g++; if (chance(gR * 0.35)) g++; }
    if (chance(aR)) a++;
    ss.apps++; ss.g += g; ss.a += a;
    var rt = 6.55 + rel * 0.03 + (rv.ovr - 75) * 0.015 + g * 0.8 + a * 0.4 + gauss() * 0.45;
    if (rv.g === "POR" || rv.g === "DEF") {
      var gc = 0; for (var j = 0; j < 4; j++) if (chance(gcR / 4)) gc++;
      if (rv.g === "POR") { ss.gc += gc; ss.sv += Math.max(0, Math.round(2.2 + gc * 0.5 + gauss() * 1.1)); }
      if (!gc) { ss.cs++; rt += 0.4; }
      rt -= gc * 0.15;
    }
    ss.rs += clamp(rt, 4, 10); ss.rn++;
  }
  /* selección: convocatorias en las ventanas FIFA del tramo */
  var b = BLOCKS[S.bi];
  INTL_W.forEach(function (w) { if (b && w >= b[0] && w <= b[1] && rv.ovr + gauss() * 1.2 >= (S.nr[rv.ni] || 70) - 5.5) ss.caps += 2; });
}
/* títulos del rival al cerrar la temporada (liga y copas que gane su club) */
function lifeRvTitles() {
  var rv = lifeOf().rv; if (!rv) return;
  var ss = rv.ss;
  if (posInLeague(rv.club) === 1) { ss.tro++; ss.tk.push(W.lg[S.cl[rv.club]].n); }
  Object.keys(S.C || {}).forEach(function (k) {
    var c = S.C[k];
    if (c && !c.nat && c.win === rv.club && c.done !== false && ss.tk.indexOf(c.n) < 0) { ss.tro++; ss.tk.push(c.n); }
  });
}
function lifeMySeason() {
  var p = S.p, ss = p.ss || {}, L = lifeOf();
  return {apps: ss.apps || 0, g: ss.g || 0, a: ss.a || 0, cs: ss.cs || 0, gc: ss.gc || 0, sv: L.svS || 0, rs: ss.rs || 0, rn: ss.rn || 0,
    tro: p.trophies.filter(function (t) { return t.s === seasonLabel(S.yr); }).length, caps: (p.ns && p.ns.apps) || 0};
}
/* sumas desde que empezó la rivalidad */
function lifeCareerPair() {
  var L = lifeOf(), rv = L.rv, p = S.p, me = {apps: 0, g: 0, a: 0, cs: 0, gc: 0, sv: 0, rs: 0, rn: 0, tro: 0, caps: 0}, him = {apps: 0, g: 0, a: 0, cs: 0, gc: 0, sv: 0, rs: 0, rn: 0, tro: 0, caps: 0};
  if (!rv) return null;
  var add = function (o, x) { Object.keys(o).forEach(function (k) { o[k] += x[k] || 0; }); };
  p.seasons.forEach(function (r) {
    if (r.y < rv.since) return;
    add(me, {apps: r.apps, g: r.g, a: r.a, cs: r.cs, gc: r.gc, sv: r.sv || 0, rs: (r.rt || 0) * r.apps, rn: r.rt ? r.apps : 0, tro: (r.tro || []).length, caps: r.caps || 0});
  });
  var cur = p.seasons.length && p.seasons[p.seasons.length - 1].y === S.yr;
  if (!cur) add(me, lifeMySeason());
  rv.rows.forEach(function (r) { add(him, r); });
  var lastRow = rv.rows[rv.rows.length - 1];
  if (!(lastRow && lastRow.y === S.yr)) add(him, rv.ss);
  return {me: me, him: him};
}
function lifeDuel(f) {
  var L = lifeOf(), rv = L.rv, p = S.p;
  if (!rv || f.min <= 0) return;
  var hit = f.isNat ? f.opp === rv.ni : f.opp === rv.club;
  if (!hit || !chance(0.88)) return;
  var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), last = S.blog[S.blog.length - 1] || {};
  var res = gu > gt ? 1 : gu < gt ? -1 : 0;
  if (!res && f.pens) res = f.pens[0] > f.pens[1] ? 1 : -1;
  var share = {DEL: 0.3, MED: 0.13, DEF: 0.05, POR: 0}[rv.g] || 0, hg = 0;
  for (var i = 0; i < gt; i++) if (chance(share)) hg++;
  var hr = 6.5 + hg * 0.85 - res * 0.25 + (rv.ovr - 75) * 0.02 + gauss() * 0.5;
  if (rv.g === "POR") hr += (gu === 0 ? 0.6 : -gu * 0.2);
  hr = clamp(round1(hr), 4, 10);
  var mr = last.rt || 6.5, out = res;
  if (!out) out = mr - hr >= 0.6 ? 1 : hr - mr >= 0.6 ? -1 : 0;
  rv.h2h[out > 0 ? 0 : out < 0 ? 2 : 1]++;
  rv.duels.unshift({y: S.yr, nat: f.isNat ? 1 : 0, o: f.opp, gu: gu, gt: gt, mr: mr, hr: hr, mg: last.g || 0, hg: hg, r: out});
  if (rv.duels.length > 8) rv.duels.length = 8;
  var w = rv.h2h[0], l = rv.h2h[2], tk, kind;
  if (out > 0) {
    kind = "star";
    tk = w + l === 1 ? N_("Primer asalto para {me}: gana el duelo directo a {him}.") : w > l ? N_("{me} manda en el pulso con {him}: {w}-{l} en duelos directos.") : w === l ? N_("{me} iguala la rivalidad con {him}: {w}-{l} en duelos.") : N_("{me} recorta distancias con {him} ({w}-{l}), pero aún va por detrás.");
    p.fame = clamp(p.fame + 1.5, 0, 100); p.mor = clamp(p.mor + 4, 0, 100); p.fans = clamp(p.fans + 2, 0, 100);
  } else if (out < 0) {
    kind = "bad";
    tk = w + l === 1 ? N_("{him} se lleva el primer cara a cara con {me}.") : l > w ? N_("{him} vuelve a ganarle el duelo a {me}: {l}-{w} y subiendo.") : N_("{him} se impone esta vez, pero {me} sigue mandando ({w}-{l}).");
    p.mor = clamp(p.mor - 3, 0, 100);
  } else { kind = "ok"; tk = N_("Tablas en el duelo entre {me} y {him}: ninguno logra imponerse."); }
  var txt = lifeHeadline({t: kind, tk: tk, tp: {w: w, l: l}});
  S.bnews.push({t: kind, x: "⚔️ " + txt});
  notify("⚔️ " + txt, out > 0 ? "good" : out < 0 ? "amber" : "info");
  socPostRaw({by: "press", tk: tk, tp: {me: lifeMeName(), him: rv.n, w: w, l: l, name: socSelfName()}, mood: out});
  if (out > 0 && chance(0.6)) socPostRaw({by: "fan", tk: N_("Hoy {me} se ha comido a {him}. Que no se hable más. 🔥"), tp: {me: lifeMeName(), him: rv.n}, mood: 1});
}
/* cambios de rival al empezar temporada: retirada, distancia de nivel o mismo club */
function lifeRvSeason() {
  var L = lifeOf(), rv = L.rv, p = S.p, why = null;
  if (rv) {
    var star = null;
    (S.rv || []).forEach(function (r) { if (r.n === rv.n && r.ni === rv.ni) star = r; });
    if (star) { rv.ovr = star.ovr; rv.age = star.age; rv.club = star.club; }
    else if (rv.ly !== S.yr) {
      rv.age++;
      if (rv.age <= 24) rv.ovr += rf(0.5, 3); else if (rv.age >= 30) rv.ovr -= rf(0.3, 2.4) * (rv.age - 28) / 3; else rv.ovr += rf(-1, 1);
      rv.ovr = round1(clamp(rv.ovr, 40, 95));
      if (chance(0.1)) { var pool = []; W.clubs.forEach(function (c, i) { if (S.cl[i] >= 0 && Math.abs(S.cr[i] - rv.ovr) <= 3) pool.push(i); }); if (pool.length) rv.club = pick(pool); }
    }
    rv.ly = S.yr;
    if (rv.age >= 36 || (rv.age >= 34 && chance(0.4))) why = "ret";
    else if (Math.abs(rv.ovr - p.ovr) > 9) why = "gap";
    else if (rv.club === p.club) why = "mate";
    if (why) {
      L.rvh.unshift({n: rv.n, ni: rv.ni, a: rv.since, b: S.yr, h: rv.h2h.slice(), why: why});
      if (L.rvh.length > 6) L.rvh.length = 6;
      var msg = why === "ret" ? tr("{him} cuelga las botas. Se acaba vuestra rivalidad ({w}-{d}-{l} en duelos).", {him: rv.n, w: rv.h2h[0], d: rv.h2h[1], l: rv.h2h[2]})
        : why === "mate" ? tr("{him} y tú ahora compartís vestuario: la rivalidad pasa a ser amistosa.", {him: rv.n})
        : rv.ovr > p.ovr ? tr("{him} juega ya en otra liga: deja de ser tu referencia directa.", {him: rv.n}) : tr("Has dejado atrás a {him}: la prensa te busca un rival nuevo.", {him: rv.n});
      notify(msg, "info");
      L.rv = null;
    }
  }
  if (!L.rv) { lifeNewRv(); notify(tr("Nuevo rival: {him} ({club}). La prensa ya os compara.", {him: L.rv.n, club: clubName(L.rv.club)}), "amber"); }
}
/* carreras de premios: Bota de Oro / Zamora, Balón de Oro y selección */
function lifeRaces() {
  var L = lifeOf(), rv = L.rv; if (!rv) return [];
  var me = lifeMySeason(), him = rv.ss, out = [], gk = rv.g === "POR";
  if (gk) {
    var a = me.apps ? me.gc / me.apps : null, b = him.apps ? him.gc / him.apps : null;
    out.push({k: "zamora", n: N_("Trofeo Zamora (goles encajados por partido)"), me: a, him: b, low: true, dec: 2});
    out.push({k: "glove", n: N_("Guante de Oro (porterías a cero)"), me: me.cs, him: him.cs});
  } else {
    out.push({k: "boot", n: N_("Bota de Oro (goles)"), me: me.g, him: him.g});
    if (rv.g !== "DEL") out.push({k: "ast", n: N_("Asistencias"), me: me.a, him: him.a});
  }
  if (rv.bdo) out.push({k: "bdo", n: N_("Balón de Oro {year}"), y: rv.bdo.y, me: rv.bdo.me || null, him: rv.bdo.him || null, low: true, rank: true});
  if (rv.ni === pnat()) out.push({k: "nat", n: N_("Convocatorias con {nat}"), me: me.caps, him: him.caps, nat: rv.ni});
  return out;
}

/* ---------- avatar del rival (determinista) ---------- */
function lifeRvLook(rv) {
  var h = hashStr(rv.n + rv.ni);
  return {skin: LIFE_COS.skin[h % 5].id, hair: LIFE_COS.hair[(h >>> 3) % 4].id, hcol: LIFE_COS.hcol[(h >>> 6) % 4].id, boots: LIFE_COS.boots[(h >>> 9) % 4].id,
    sleeve: (h >>> 12) % 3 ? "short" : "long", band: (h >>> 14) % 4 ? "none" : "blk", gloves: LIFE_COS.gloves[(h >>> 16) % 2].id};
}

/* ---------- enganches con el motor ---------- */
(function () {
  var _newCareer = newCareer;
  newCareer = function (o) {
    LIFE_NEXT_NUM = o && o.num != null ? +o.num : null;
    try { return _newCareer.apply(this, arguments); } finally { LIFE_NEXT_NUM = null; }
  };
  var _joinClub = joinClub;
  joinClub = function () { var r = _joinClub.apply(this, arguments); if (lifeOn()) lifeSyncNum(); return r; };
  var _acceptOffer = acceptOffer;
  acceptOffer = function () { var r = _acceptOffer.apply(this, arguments); if (lifeOn()) lifeSyncNum(); return r; };
  var _attrs = attrs;
  attrs = function () {
    var out = _attrs.apply(this, arguments);
    if (!lifeOn() || !S.p.life) return out;
    var b = lifeAttBonus();
    Object.keys(b).forEach(function (k) { if (out[k] != null) out[k] = Math.round(clamp(out[k] + b[k], 20, 99)); });
    return out;
  };
  var _growth = growthTick;
  growthTick = function () {
    var r = _growth.apply(this, arguments);
    if (lifeOn() && S.p.life && lifeSvcOn("trainer")) { var p = S.p; p.ovr = clamp(p.ovr + (p.age <= 29 ? 0.035 : 0.05), 30, 99); if (p.ovr > p.peak) p.peak = p.ovr; }
    return r;
  };
  var _finish = finishPlayer;
  finishPlayer = function (f) {
    if (!lifeOn()) return _finish.apply(this, arguments);
    var p = S.p, L = lifeOf(), im = p.flags.injMul, form0 = p.form;
    if (lifeSvcOn("physio")) p.flags.injMul = (im || 1) * 0.7;
    var r;
    try { r = _finish.apply(this, arguments); } finally { if (lifeSvcOn("physio")) { if (im == null) delete p.flags.injMul; else p.flags.injMul = im; } }
    if (lifeSvcOn("mental") && p.form < form0) p.form = form0 - (form0 - p.form) * 0.65;
    var last = S.blog[S.blog.length - 1] || {};
    if (f.min > 0) {
      var gt = f.gt + (f.ett || 0);
      if (isGK() && !f.isNat) L.svS = (L.svS || 0) + Math.max(0, Math.round(gt * 0.6 + 2 + (f.or - f.tr) * 0.08 + gauss() * 1.1));
      var cel = lifeCel();
      if (last.g > 0 && chance(0.45)) socPostRaw({by: chance(0.5) ? "fan" : "press", tk: N_("{name} marca y lo celebra con su firma: «{quote}»."), tp: {name: socSelfName(), quote: cel.n}, mood: 1});
      else if (isGK() && gt === 0 && f.min >= 60 && chance(0.3)) socPostRaw({by: "fan", tk: N_("Portería a cero para {name}, que se despide de la grada con su celebración: «{quote}»."), tp: {name: socSelfName(), quote: cel.n}, mood: 1});
      lifeDuel(f);
    }
    return r;
  };
  var _blockDone = blockDone;
  blockDone = function () {
    if (lifeOn()) { lifeOf(); lifeRvBlock(); lifeSvcTick(); }
    return _blockDone.apply(this, arguments);
  };
  var _seasonEnd = seasonEnd;
  seasonEnd = function () {
    if (!lifeOn()) return _seasonEnd.apply(this, arguments);
    var L = lifeOf();
    lifeRvTitles();
    var r = _seasonEnd.apply(this, arguments);
    var row = S.p.seasons[S.p.seasons.length - 1];
    if (row) { row.num = L.num; if (isGK()) row.sv = L.svS || 0; }
    var news = lifeInvSeason(), rv = L.rv;
    if (rv) {
      var s = rv.ss;
      rv.rows.push({y: S.yr, apps: s.apps, g: s.g, a: s.a, cs: s.cs, gc: s.gc, sv: s.sv, rs: round1(s.rs), rn: s.rn, tro: s.tro, caps: s.caps});
      if (rv.rows.length > 20) rv.rows.shift();
      var me = row || {}, gk = rv.g === "POR", tk;
      if (gk) tk = (me.cs || 0) >= s.cs ? N_("Balance del año: {me} gana la pelea de porterías a cero a {him} ({a}-{b}).") : N_("Balance del año: {him} deja más porterías a cero que {me} ({b}-{a}).");
      else tk = (me.g || 0) >= s.g ? N_("Balance del año: {me} supera a {him} en goles ({a}-{b}).") : N_("Balance del año: {him} marca más que {me} ({b}-{a}).");
      var a = gk ? (me.cs || 0) : (me.g || 0), b = gk ? s.cs : s.g;
      news.push({t: a >= b ? "star" : "bad", x: "⚔️ " + lifeHeadline({t: a >= b ? "star" : "bad", tk: tk, tp: {a: a, b: b}})});
      rv.ss = lifeRvSS();
    }
    var card = S.feed[0];
    if (card && card.t === "seasonEnd" && news.length) card.news = (card.news || []).concat(news);
    return r;
  };
  var _startSeason = startSeason;
  startSeason = function (first) {
    var r = _startSeason.apply(this, arguments);
    if (!lifeOn()) return r;
    var L = lifeOf();
    L.svS = 0;
    lifeSyncNum();
    lifeRvSeason();
    if (!first) lifeNumPend();
    return r;
  };
  var _awards = awardsCeremony;
  awardsCeremony = function () {
    var rv = lifeOn() && S.p.life ? S.p.life.rv : null;
    var r = _awards.apply(this, arguments);
    if (rv) {
      var card = S.feed[0], st = null;
      (S.rv || []).forEach(function (x) { if (x.n === rv.n && x.ni === rv.ni) st = x; });
      var myPos = card && card.t === "awards" ? card.pos : 0, him = 0;
      if (card && card.top) card.top.forEach(function (x, i) { if (!x.me && x.n === rv.n && x.ni === rv.ni) him = i + 1; });
      if (!him && st && st.lastScore != null) {
        him = 1 + (S.rv || []).filter(function (x) { return x !== st && x.lastScore > st.lastScore; }).length;
        if (myPos && myPos <= him) him++;
        if (him > 30) him = 0;
      }
      rv.bdo = {y: S.yr + 1, me: myPos && myPos <= 30 ? myPos : 0, him: him};
      if (rv.bdo.me || rv.bdo.him) {
        var meAhead = rv.bdo.me && (!rv.bdo.him || rv.bdo.me < rv.bdo.him);
        lifeHeadline({t: meAhead ? "star" : "bad", tk: meAhead ? N_("Balón de Oro {year}: {me} queda por delante de {him}.") : N_("Balón de Oro {year}: {him} queda por delante de {me}."), tp: {year: S.yr + 1}});
      }
    }
    return r;
  };
})();
