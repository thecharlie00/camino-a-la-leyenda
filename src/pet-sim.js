/* pet-sim.js — lógica de la mascota 5.6 (sin gráficos): necesidades en tiempo real, ánimo, vínculo,
   personalidad, memoria, trucos con práctica en días distintos, inventario, tienda, paseos, concursos,
   crecimiento por temporadas y migración del formato antiguo. Todo se guarda en lifeOf().pet (v: 2).
   Las ayudas internas (suelo de necesidades en ausencias largas, racha de fallos que facilita el siguiente
   intento, rivales algo más flojos tras varias derrotas, efecto suave en la moral) no se muestran nunca. */
var PetSim = (function () {
  "use strict";
  var H = 3600e3, DAY = 24 * H, CAP_H = 72;
  var NEEDS = ["hun", "thi", "cln", "ene", "fun", "aff"];
  /* caída por hora (despierta) */
  var DECAY = {hun: 3.6, thi: 4.4, cln: 1.1, ene: 2.6, fun: 3.2, aff: 2.2};
  var api = {H: H, DAY: DAY, NEEDS: NEEDS};
  api.clock = function () { return Date.now(); };
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function hash(str) { var h2 = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h2 ^= str.charCodeAt(i); h2 = Math.imul(h2, 16777619); } return h2 >>> 0; }
  api.hash = hash; api.rnd = rnd;
  function dayKey(t) { var d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  api.dayKey = dayKey;
  function hourOf(t) { var d = new Date(t); return d.getHours() + d.getMinutes() / 60; }
  api.hourOf = hourOf;
  function money() { return S && S.p ? S.p.money : 0; }
  function pay(v) { if (!S || !S.p || S.p.money < v) return false; S.p.money -= v; return true; }

  /* ---------- crecimiento: por temporadas de la carrera; la senior se queda para siempre ---------- */
  api.stage = function (pt) { var a = pt.age || 0; return a < 1 ? 0 : a < 3 ? 1 : a < 10 ? 2 : 3; };

  /* ---------- personalidad y gustos (de la semilla) ---------- */
  var ZONES = ["head", "chin", "back", "belly", "ears", "cheek"], TAGS = ["sporty", "cute", "cozy", "regal", "silly", "shiny", "brave"];
  var TOYS = ["toy_ball", "toy_frisbee", "toy_rope", "toy_plush"], FOODS = ["food_basic", "food_prem"];
  var BIAS = {dog: {act: 0.25, aff: 0.2}, cat: {ind: 0.3, cur: 0.15}, rabbit: {aff: 0.15, act: -0.1}, hamster: {act: 0.2, glu: 0.25}, hedgehog: {ind: 0.1, cur: 0.2},
    fennec: {act: 0.3, cur: 0.2}, capybara: {act: -0.3, aff: 0.25}, iguana: {ind: 0.3, act: -0.2}, macaw: {cur: 0.3, act: 0.15}, python: {ind: 0.3, act: -0.25},
    turtle: {act: -0.35, glu: 0.2}, fish: {cur: 0.1}, tarantula: {ind: 0.35, act: -0.15}};
  function persona(k, seed) {
    var r = rnd(seed), b = BIAS[k] || {}, p = {};
    ["act", "aff", "cur", "ind", "glu"].forEach(function (x) { p[x] = Math.round(cl(0.2 + r() * 0.6 + (b[x] || 0), 0.05, 0.95) * 100) / 100; });
    var t1 = TAGS[Math.floor(r() * TAGS.length)], t2 = TAGS[Math.floor(r() * TAGS.length)];
    if (t2 === t1) t2 = TAGS[(TAGS.indexOf(t1) + 3) % TAGS.length];
    var zi = Math.floor(r() * ZONES.length);
    return {p: p, likes: {zone: ZONES[zi], hate: ZONES[(zi + 1 + Math.floor(r() * 5)) % ZONES.length], toy: TOYS[Math.floor(r() * TOYS.length)], food: FOODS[r() < 0.6 ? 1 : 0], tag: t1, ntag: t2}};
  }
  api.persona = persona;
  /* rasgo principal, para describirlo con palabras (nunca con números) */
  api.trait = function (pt) {
    var p = pt.pers || {}, best = "aff", bv = -1;
    ["act", "aff", "cur", "ind", "glu"].forEach(function (x) { if ((p[x] || 0) > bv) { bv = p[x]; best = x; } });
    return best;
  };

  /* ---------- estado y migración ---------- */
  function fresh(k, nm) {
    var t = api.clock(), seed = hash(k + nm + t), P = persona(k, seed);
    return {v: 2, k: k, nm: nm, seed: seed, age: 0, y0: S && S.yr || 0, bond: 40, mood: 70, col: "nat", bg: "none", eq: {},
      n: {hun: 80, thi: 80, cln: 90, ene: 85, fun: 70, aff: 60}, t: t, tmax: t, born: t, sleep: 0, dirt: 0, shine: 0, boost: 0, debt: 0,
      pers: P.p, likes: P.likes, tr: {}, mem: [], ev: [], album: [], stats: {walks: 0, baths: 0, meals: 0, tricks: 0, wins: 0, steps: 0, contests: 0}, zones: {},
      dec: {bed: [-0.45, 0.2], bowl_food: [0.32, 0.12], bowl_water: [0.45, 0.22]}, walkT: {}, cont: {}, poo: 0, lose: 0, fails: 0, bd: {}};
  }
  api.fresh = fresh;
  /* acepta la mascota del formato 2.7/3.7 y la convierte: nombre, vínculo, edad, accesorios y trucos se conservan */
  api.migrate = function (L) {
    var pt = L && L.pet; if (!pt || pt.v === 2) return pt;
    try { if (typeof Store !== "undefined" && Store.backup) Store.backup("pet-v2"); } catch (e) {}
    var nw = fresh(pt.k, pt.nm || "Pet");
    nw.bond = cl(pt.bond != null ? pt.bond : 60, 5, 100); nw.age = pt.age || 0; nw.y0 = pt.y0 || nw.y0; nw.col = pt.col || "nat"; nw.bg = pt.bg || "none";
    var eq = pt.eq || {}, map = {h: "h", f: "f", n: "n", t: "t"};
    Object.keys(eq).forEach(function (s) { if (eq[s]) nw.eq[map[s] || s] = eq[s]; });
    /* los trucos aprendidos pasan a «casi dominado» en el orden de los básicos */
    var n = Math.min(pt.tricks || 0, PET_TRICKS2.length);
    for (var i = 0; i < n; i++) nw.tr[PET_TRICKS2[i].k] = {m: 55, d: 3, ld: 0, lt: 0};
    nw.mem.push({k: "migr", t: nw.t});
    L.pet = nw;
    return nw;
  };
  api.inv = function () { var L = lifeOf(); if (!L.petInv || typeof L.petInv !== "object") L.petInv = {food_basic: 5, bowl_food: 1, bowl_water: 1}; return L.petInv; };

  /* ---------- reloj real ---------- */
  /* aplica el tiempo transcurrido: tope de 72 h, protección ante cambios de hora hacia atrás y suelo en ausencias largas */
  api.tick = function (pt, now) {
    if (!pt || pt.v !== 2) return 0;
    now = now || api.clock();
    if (now < pt.tmax - 10 * 60e3) { pt.t = now; pt.back = 1; return 0; }  /* reloj atrasado: no pasa el tiempo */
    var from = Math.max(pt.t, pt.back ? pt.tmax : pt.t); pt.back = 0;
    var hrs = (now - from) / H; if (hrs <= 0) { pt.t = now; return 0; }
    var away = hrs, cap = Math.min(hrs, CAP_H);
    pt.t = now; pt.tmax = Math.max(pt.tmax, now);
    var step = Math.min(0.5, cap), left = cap, tt = now - cap * H;
    while (left > 1e-6) {
      var s = Math.min(step, left); left -= s; tt += s * H;
      var hr = hourOf(tt), night = hr >= 22.5 || hr < 7;
      if (!pt.sleep && (pt.n.ene < 12 || (night && pt.n.ene < 75 && hrs > 0.2))) pt.sleep = 1;
      if (pt.sleep && (pt.n.ene >= 98 || (!night && pt.n.ene > 70))) pt.sleep = 0;
      var f = pt.sleep ? 0.45 : 1;
      pt.n.hun -= DECAY.hun * s * f * (0.8 + (pt.pers.glu || 0.5) * 0.4);
      pt.n.thi -= DECAY.thi * s * f;
      pt.n.cln -= DECAY.cln * s;
      pt.n.fun -= DECAY.fun * s * f * (0.7 + (pt.pers.act || 0.5) * 0.6);
      pt.n.aff -= DECAY.aff * s * f * (0.7 + (pt.pers.aff || 0.5) * 0.6);
      pt.n.ene += pt.sleep ? 14 * s : -DECAY.ene * s * (0.7 + (pt.pers.act || 0.5) * 0.6);
      pt.boost = Math.max(0, (pt.boost || 0) - 6 * s);
      pt.debt = Math.max(0, (pt.debt || 0) - 0.15 * s);
      pt.shine = Math.max(0, (pt.shine || 0) - 0.02 * s);
      if (pt.n.cln < 45 && (pt.dirt || 0) < 1) pt.dirt = 1; if (pt.n.cln < 25 && pt.dirt < 2) pt.dirt = 2; if (pt.n.cln < 10) pt.dirt = 3;
      /* ausencia: las necesidades no bajan de un mínimo (nunca enferma ni se va) */
      var floor = away > 8 ? 18 : 6;
      NEEDS.forEach(function (k) { pt.n[k] = cl(pt.n[k], floor, 100); });
    }
    /* el vínculo se resiente un poco si pasa mucho tiempo con todo bajo, pero nunca cae de 5 */
    var low = NEEDS.filter(function (k) { return pt.n[k] < 25; }).length;
    if (low >= 3) pt.bond = cl(pt.bond - 0.25 * Math.min(cap, 48) / 6, 5, 100);
    if (away > 20) { pt.missed = 1; pt.ev.push({k: "away", t: now, h: Math.round(away)}); if (pt.ev.length > 30) pt.ev.shift(); }
    api.trickDecay(pt, now);
    pt.mood = api.mood(pt);
    return away;
  };
  api.mood = function (pt) {
    var n = pt.n, m = n.hun * 0.2 + n.thi * 0.15 + n.cln * 0.1 + n.ene * 0.15 + n.fun * 0.2 + n.aff * 0.2;
    return Math.round(cl(m + (pt.boost || 0) - (pt.debt || 0) * 4 + (pt.bond - 50) * 0.08, 0, 100));
  };
  /* estado legible: la expresión base y los iconos discretos de necesidades */
  api.need = function (pt) {
    var lo = NEEDS.map(function (k) { return [k, pt.n[k]]; }).filter(function (x) { return x[1] < 35; }).sort(function (a, b) { return a[1] - b[1]; });
    return lo.map(function (x) { return x[0]; });
  };
  api.expr = function (pt) {
    if (pt.sleep) return "sleep";
    var m = pt.mood, nd = api.need(pt);
    if (pt.missed) return "sad";
    if (nd.indexOf("ene") >= 0 && pt.n.ene < 20) return "blink";
    if (m > 80) return "happy"; if (m > 60) return "content"; if (m > 40) return "curious"; return "sad";
  };
  /* ¿quiere atención? (para el aviso de la tarjeta, sin números) */
  api.wants = function (pt) { return !!pt && (api.need(pt).length >= 2 || pt.missed); };

  /* ---------- vínculo con rendimientos decrecientes en el día ---------- */
  function bond(pt, v, kind) {
    var dk = dayKey(api.clock()); if (!pt.bd || pt.bd.d !== dk) pt.bd = {d: dk, n: 0, k: {}};
    var used = pt.bd.k[kind] || 0, f = used < 3 ? 1 : used < 6 ? 0.5 : 0.15;
    pt.bd.k[kind] = used + 1; pt.bd.n++;
    var g = v * f * (pt.bond > 85 ? 0.6 : 1);
    pt.bond = cl(pt.bond + g, 5, 100);
    return g;
  }
  api.bond = bond;
  function first(pt, k, extra) {
    if (pt.mem.some(function (m) { return m.k === k; })) return false;
    var o = {k: k, t: api.clock()}; if (extra) for (var x in extra) o[x] = extra[x];
    pt.mem.push(o); if (pt.mem.length > 60) pt.mem.splice(1, 1);
    return true;
  }
  api.first = first;
  function ev(pt, k, x) { pt.ev.push({k: k, t: api.clock(), x: x}); if (pt.ev.length > 30) pt.ev.shift(); }

  /* ---------- cuidados ---------- */
  api.wake = function (pt) { pt.sleep = 0; pt.missed = 0; pt.mood = api.mood(pt); };
  api.toSleep = function (pt) { if (pt.n.ene > 85) return {ok: false, awake: true}; pt.sleep = 1; return {ok: true}; };
  api.feed = function (pt, id) {
    var it = petItem(id), inv = api.inv(); if (!it || !(inv[id] > 0)) return {ok: false, none: true};
    if (it.kind === "food" && pt.n.hun > 92) return {ok: false, full: true};
    inv[id]--; if (!inv[id]) delete inv[id];
    var fav = pt.likes.food === id;
    pt.n.hun = cl(pt.n.hun + (it.hun || 0), 0, 100);
    if (it.mood) pt.boost = cl((pt.boost || 0) + it.mood * (fav ? 1.4 : 1), 0, 30);
    if (it.debt) pt.debt = (pt.debt || 0) + it.debt * (pt.n.hun > 85 ? 1.5 : 1);
    pt.stats.meals++; bond(pt, it.kind === "treat" ? 1.2 : 1.8, "feed"); pt.missed = 0;
    var f1 = first(pt, "meal");
    pt.mood = api.mood(pt);
    return {ok: true, fav: fav, first: f1};
  };
  api.water = function (pt) { if (pt.n.thi > 95) return {ok: false, full: true}; pt.n.thi = 100; bond(pt, 0.8, "water"); pt.mood = api.mood(pt); return {ok: true}; };
  /* baño: progreso de 0 a 1 por frotado; el champú sólo se gasta al terminar */
  api.bathDone = function (pt, rinsed) {
    var inv = api.inv(), sh = inv.shampoo > 0;
    if (sh) { inv.shampoo--; if (!inv.shampoo) delete inv.shampoo; }
    pt.n.cln = sh ? 100 : 80; pt.dirt = 0; pt.stats.baths++;
    var hates = pt.pers.ind > 0.65 && pt.k !== "dog";
    bond(pt, hates ? 0.8 : 2, "bath"); if (hates) pt.n.fun = cl(pt.n.fun - 8, 0, 100);
    first(pt, "bath"); pt.mood = api.mood(pt);
    return {ok: true, shampoo: sh, hates: hates};
  };
  api.brush = function (pt, amt) {
    if (!(api.inv().brush > 0)) return {ok: false, none: true};
    pt.shine = cl((pt.shine || 0) + amt, 0, 1); pt.n.cln = cl(pt.n.cln + amt * 6, 0, 100);
    if (amt > 0.05) bond(pt, amt * 3, "brush");
    return {ok: true, shine: pt.shine};
  };
  /* caricias: zona favorita, zona que no le gusta, y lo que ya ha recibido hoy */
  api.touch = function (pt, zone, kind) {
    if (pt.sleep) { if (kind === "poke") return {r: "wake"}; return {r: "sleepy"}; }
    var p = pt.pers, z = pt.zones[zone] = (pt.zones[zone] || 0) + 1, out = {r: "ok", zone: zone};
    if (zone === pt.likes.hate && kind !== "pat") { out.r = "dislike"; pt.n.fun = cl(pt.n.fun - 2, 0, 100); return out; }
    if (kind === "poke") { out.r = p.ind > 0.6 ? "annoyed" : "curious"; return out; }
    var gain = zone === pt.likes.zone ? 4.5 : 2;
    pt.n.aff = cl(pt.n.aff + gain, 0, 100);
    pt.missed = 0;
    bond(pt, zone === pt.likes.zone ? 0.6 : 0.3, "touch");
    if (zone === pt.likes.zone) { out.r = "love"; if (first(pt, "favzone")) out.found = true; }
    else if (pt.n.aff > 95 && p.ind > 0.5) out.r = "enough";
    pt.mood = api.mood(pt);
    return out;
  };
  api.play = function (pt, toy, good) {
    if (pt.n.ene < 12) return {ok: false, tired: true};
    var fav = pt.likes.toy === toy;
    pt.n.fun = cl(pt.n.fun + (good ? 12 : 6) * (fav ? 1.5 : 1), 0, 100); pt.n.ene = cl(pt.n.ene - 3, 0, 100); pt.n.cln = cl(pt.n.cln - 1, 0, 100);
    bond(pt, fav ? 1.2 : 0.7, "play"); pt.missed = 0;
    if (fav) first(pt, "favtoy", {x: toy});
    pt.mood = api.mood(pt);
    return {ok: true, fav: fav};
  };
  /* gusto por un accesorio: le encanta / le da igual / le fastidia (por sus etiquetas) */
  api.accLike = function (pt, id) {
    var it = petItem(id); if (!it || !it.tags) return 0;
    if (it.tags.indexOf(pt.likes.tag) >= 0) return 1;
    if (it.tags.indexOf(pt.likes.ntag) >= 0 && it.tags.indexOf(pt.likes.tag) < 0) return -1;
    return 0;
  };

  /* ---------- trucos ---------- */
  api.trickLv = function (pt, k) { var t = pt.tr[k]; return t ? t.m : 0; };
  api.tier = function (m) { return m >= 80 ? 3 : m >= 40 ? 2 : m > 0 ? 1 : 0; };
  api.trickOk = function (pt, k) {
    var t = petTrick(k); if (!t) return false;
    if (t.bond && pt.bond < t.bond) return false;
    if (t.ball && ["fish", "turtle", "tarantula", "python"].indexOf(pt.k) >= 0) return false;
    if (["fish"].indexOf(pt.k) >= 0 && ["sit", "lie", "paw", "roll", "dead", "kneeslide", "dive"].indexOf(k) >= 0) return false;
    return true;
  };
  api.tricks = function (pt) { return PET_TRICKS2.filter(function (t) { return api.trickOk(pt, t.k); }); };
  api.known = function (pt) { return Object.keys(pt.tr).filter(function (k) { return pt.tr[k].m >= 40; }); };
  /* intento: devuelve ok / half / other / distracted / fall. La racha de fallos ayuda en silencio */
  api.trickTry = function (pt, k, rng) {
    rng = rng || Math.random;
    var t = petTrick(k); if (!t || !api.trickOk(pt, k)) return {r: "no"};
    if (pt.sleep) return {r: "sleep"};
    if (pt.n.ene < 10) return {r: "tired"};
    var st = pt.tr[k] || (pt.tr[k] = {m: 0, d: 0, ld: 0, lt: 0}), m = st.m / 100;
    var mood = pt.mood / 100, ene = pt.n.ene / 100, age = [0.8, 1.1, 1, 0.85][api.stage(pt)];
    var p = (0.12 + m * 0.78) * (0.6 + mood * 0.4) * (0.75 + ene * 0.25) * age / Math.max(0.6, t.d) + (pt.fails || 0) * 0.07;
    p = cl(p, 0.05, 0.97);
    var dis = cl(0.18 - m * 0.15 + (pt.pers.cur - 0.5) * 0.12 + (1 - mood) * 0.1, 0.02, 0.35);
    var x = rng(), r;
    if (x < p) r = "ok";
    else if (x < p + dis) r = "distracted";
    else if (m > 0.25 && x < p + dis + 0.18) r = "half";
    else if (api.known(pt).length && x < p + dis + 0.3) r = "other";
    else r = "fall";
    pt.n.ene = cl(pt.n.ene - 1.2, 0, 100);
    if (r === "ok") pt.fails = 0; else pt.fails = Math.min(5, (pt.fails || 0) + 1);
    var other = null;
    if (r === "other") { var kn = api.known(pt).filter(function (q) { return q !== k; }); other = kn.length ? kn[Math.floor(rng() * kn.length)] : null; if (!other) r = "fall"; }
    st.pend = {r: r, t: api.clock()};
    return {r: r, other: other, k: k};
  };
  /* premio: si llega dentro de la ventana tras un acierto, fija el aprendizaje; con días distintos de práctica */
  api.reward = function (pt, k, kind) {
    var st = pt.tr[k]; if (!st || !st.pend) return {ok: false};
    var now = api.clock(), late = (now - st.pend.t) / 1000, r = st.pend.r; st.pend = null;
    var win = late <= 2.5, good = r === "ok" ? 1 : r === "half" ? 0.4 : 0;
    if (!good) { if (kind === "treat") pt.debt = (pt.debt || 0) + 0.3; return {ok: true, wasted: true}; }
    var dk = dayKey(now), newDay = dk > (st.ld || 0) && (now - (st.lt || 0)) > 6 * H;
    if (newDay) { st.d = (st.d || 0) + 1; st.ld = dk; st.lt = now; st.today = 0; }
    var cap = 22 + st.d * 6, left = Math.max(0, cap - (st.today || 0));
    /* sin días distintos no pasa de «casi dominado» */
    var ceil = st.d >= 3 ? 100 : st.d >= 2 ? 79 : 60;
    var g = Math.min(left, (win ? 7 : 2.5) * good * (kind === "treat" ? 1.3 : 1) * (0.7 + pt.bond / 200));
    var before = st.m;
    st.m = cl(st.m + g, 0, ceil); st.today = (st.today || 0) + (st.m - before); st.last = now;
    if (kind === "treat") { var inv = api.inv(), id = inv.treat_bone > 0 ? "treat_bone" : inv.treat > 0 ? "treat" : null; if (id) { inv[id]--; if (!inv[id]) delete inv[id]; pt.boost = cl((pt.boost || 0) + 3, 0, 30); } }
    bond(pt, win ? 0.8 : 0.3, "trick");
    var tierUp = api.tier(st.m) > api.tier(before);
    if (tierUp && api.tier(st.m) === 3) { pt.stats.tricks++; first(pt, "trick", {x: k}); ev(pt, "trick", k); }
    return {ok: true, gain: st.m - before, tier: api.tier(st.m), up: tierUp, capped: st.m >= ceil && ceil < 100};
  };
  api.trickDecay = function (pt, now) {
    Object.keys(pt.tr).forEach(function (k) {
      var st = pt.tr[k]; if (!st.last) return;
      var days = (now - st.last) / DAY; if (days < 10) return;
      var floor = st.m >= 80 ? 70 : st.m >= 40 ? 35 : 0, loss = Math.min(st.m - floor, (days - 10) * 0.8 - (st.lost || 0));
      if (loss > 0) { st.m -= loss; st.lost = (st.lost || 0) + loss; }
    });
  };

  /* ---------- tienda: stock diario determinista ---------- */
  api.price = function (it) { return it.price || 0; };
  api.stock = function (pt, now) {
    var dk = dayKey(now || api.clock()), r = rnd(hash("shop" + dk + (pt ? pt.seed : 0))), pool = PET_ACC2.filter(function (a) { return !a.un && a.price; });
    var out = [];
    while (out.length < 6 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    return out;
  };
  api.own = function () { var L = lifeOf(); if (!L.petAcc) L.petAcc = []; return L.petAcc; };
  api.has = function (id) { return api.own().indexOf(id) >= 0; };
  api.buy = function (id) {
    var it = petItem(id); if (!it || it.un) return {ok: false};
    if (it.kind !== "food" && it.kind !== "treat" && it.kind !== "care" && api.has(id)) return {ok: false, owned: true};
    if (it.durable && api.inv()[id] > 0) return {ok: false, owned: true};
    if (!pay(api.price(it))) return {ok: false, poor: true};
    var inv = api.inv();
    if (it.kind === "food" || it.kind === "treat" || it.kind === "care") inv[id] = (inv[id] || 0) + (it.pack || 1);
    else api.own().push(id);
    return {ok: true};
  };
  api.decor = function (pt) { return pt.dec || (pt.dec = {}); };
  api.place = function (pt, id, x, z) { if (!api.has(id) && !(api.inv()[id] > 0) && ["bowl_food", "bowl_water"].indexOf(id) < 0) return false; api.decor(pt)[id] = [cl(x, -0.6, 0.6), cl(z, -0.4, 0.5)]; return true; };
  api.unplace = function (pt, id) { if (PET_DECOR.some(function (d) { return d.id === id && d.fixed; })) return false; delete api.decor(pt)[id]; return true; };
  api.wear = function (pt, id) {
    var it = petItem(id); if (!it || !it.s || !api.has(id)) return false;
    pt.eq[it.s] = pt.eq[it.s] === id ? null : id;
    if (pt.eq[it.s]) { var lk = api.accLike(pt, id); if (lk > 0) { bond(pt, 0.6, "wear"); first(pt, "lovedacc", {x: id}); } }
    return true;
  };
  api.eqList = function (pt) { return Object.keys(pt.eq || {}).map(function (s) { return pt.eq[s]; }).filter(function (id) { return id && api.has(id) && petItem(id); }); };

  /* ---------- paseos ---------- */
  var ROUTES = [
    {k: "park", n: N_("Parque"), min: 0, ene: 18, len: 180},
    {k: "barrio", n: N_("Barrio"), min: 0, ene: 14, len: 160},
    {k: "training", n: N_("Ciudad deportiva"), min: 1, ene: 22, len: 200},
    {k: "stadium", n: N_("Alrededores del estadio"), min: 2, ene: 20, len: 200}
  ];
  api.ROUTES = ROUTES;
  api.canWalk = function (pt) { return pt.k !== "fish" && pt.k !== "tarantula"; };
  api.routeOk = function (pt, r) { return api.canWalk(pt) && api.stage(pt) >= 0 && (r.min <= (pt.stats.walks >= 3 ? 2 : pt.stats.walks >= 1 ? 1 : 0)); };
  api.walkReady = function (pt, k) { var t = pt.walkT[k] || 0; return api.clock() - t > 2.5 * H; };
  /* sucesos del paseo (posiciones a lo largo de la ruta, de 0 a 1) */
  api.walkPlan = function (pt, k) {
    var r = rnd(hash(k + pt.seed + dayKey(api.clock()))), n = 4 + Math.floor(r() * 3), out = [];
    var kinds = ["find", "find", "pet", "fan", "sniff", "puddle", "poo", "bench"];
    if (k === "training") kinds.push("ball", "ball"); if (k === "stadium") kinds.push("fan", "fan", "ball");
    for (var i = 0; i < n; i++) out.push({at: (i + 0.6 + r() * 0.3) / (n + 0.5), k: kinds[Math.floor(r() * kinds.length)], s: Math.floor(r() * 1e6)});
    return out;
  };
  api.walkFind = function (pt, s) {
    var r = rnd(s + 7)(), roll = r;
    if (roll < 0.04) { var pool = PET_ACC2.filter(function (a) { return !a.un && a.price && a.price <= 300 && !api.has(a.id); }); if (pool.length) { var a = pool[s % pool.length]; api.own().push(a.id); return {k: "acc", id: a.id}; } }
    if (roll < 0.45) { var inv = api.inv(); inv.treat = (inv.treat || 0) + 1; return {k: "treat"}; }
    if (roll < 0.7) { if (S && S.p) S.p.money += 20; return {k: "coin", v: 20}; }
    return {k: "stick"};
  };
  api.walkEnd = function (pt, k, o) {
    var R = ROUTES.filter(function (x) { return x.k === k; })[0] || ROUTES[0];
    pt.walkT[k] = api.clock(); pt.stats.walks++; pt.stats.steps += Math.round(o && o.steps || R.len * 8);
    pt.n.ene = cl(pt.n.ene - R.ene, 0, 100); pt.n.fun = cl(pt.n.fun + 30, 0, 100); pt.n.aff = cl(pt.n.aff + 10, 0, 100);
    if (o && o.mud) { pt.n.cln = cl(pt.n.cln - 25, 0, 100); pt.dirt = Math.max(pt.dirt || 0, 2); } else pt.n.cln = cl(pt.n.cln - 8, 0, 100);
    if (o && o.poo === false && pt.poo) pt.poo = 0;
    bond(pt, 3, "walk"); first(pt, "walk_" + k);
    if (o && o.fans && S && S.p) { S.p.fame = cl(S.p.fame + 0.15 * o.fans, 0, 100); }
    pt.missed = 0; pt.mood = api.mood(pt);
    return {ok: true};
  };

  /* ---------- concursos ---------- */
  var CONT = [
    {k: "local", n: N_("Concurso local"), fee: 60, prize: 400, rivals: [28, 46], need: null, un: "cont_local", tro: "trophy_local"},
    {k: "com", n: N_("Concurso comarcal"), fee: 180, prize: 1500, rivals: [48, 66], need: "local", un: "cont_com", tro: "trophy_com"},
    {k: "nac", n: N_("Concurso nacional"), fee: 600, prize: 6000, rivals: [66, 86], need: "com", un: "cont_nac", tro: "trophy_nac"}
  ];
  var THEMES = ["sporty", "cute", "cozy", "regal", "silly", "shiny"];
  api.CONT = CONT;
  api.contOpen = function (pt, c) { return !c.need || !!pt.cont[c.need]; };
  api.contReady = function (pt, c) { var last = (pt.cont["t_" + c.k] || 0); return api.clock() - last > 20 * H; };
  api.contTheme = function (pt, c) { return THEMES[hash(c.k + dayKey(api.clock())) % THEMES.length]; };
  /* puntuación de estilo: accesorios del tema, conjunto completo, limpieza y brillo, gusto de la mascota */
  api.styleScore = function (pt, theme) {
    var eq = api.eqList(pt), s = 0;
    eq.forEach(function (id) { var it = petItem(id); if (it.tags && it.tags.indexOf(theme) >= 0) s += 14; else s += 4; s += {c: 0, r: 3, e: 6, l: 9}[it.r] || 0; if (api.accLike(pt, id) < 0) s -= 6; });
    s += Math.min(eq.length, 4) * 3 + pt.n.cln * 0.15 + (pt.shine || 0) * 12 + pt.mood * 0.08;
    return Math.round(cl(s, 0, 100));
  };
  /* puntuación de trucos: los tres mejores que haga bien en la pista (con su nivel y el ánimo) */
  api.trickScore = function (pt, picks, results) {
    var s = 0;
    picks.forEach(function (k, i) { var t = petTrick(k), m = api.trickLv(pt, k), ok = results ? results[i] : "ok"; s += (ok === "ok" ? 1 : ok === "half" ? 0.45 : 0.1) * (m / 100) * 26 * (t ? t.d : 1); });
    s += pt.mood * 0.08 + pt.bond * 0.06;
    return Math.round(cl(s, 0, 100));
  };
  api.contRun = function (pt, c, cat, score, rng) {
    rng = rng || Math.random;
    var soft = Math.min(3, pt.lose || 0) * 3, rivals = [];
    for (var i = 0; i < 5; i++) rivals.push(Math.round(c.rivals[0] + rng() * (c.rivals[1] - c.rivals[0]) - soft));
    rivals.sort(function (a, b) { return b - a; });
    var pos = 1 + rivals.filter(function (r) { return r > score; }).length, out = {pos: pos, rivals: rivals, score: score, prize: 0, unlock: null};
    pt.cont["t_" + c.k] = api.clock(); pt.stats.contests++;
    if (pos === 1) {
      pt.lose = 0; pt.stats.wins++; out.prize = c.prize; if (S && S.p) S.p.money += c.prize;
      if (!pt.cont[c.k]) { pt.cont[c.k] = 1; out.firstWin = true; }
      else pt.cont[c.k]++;
      if (!api.has(c.tro)) { api.own().push(c.tro); out.tro = c.tro; }
      var acc = PET_ACC2.filter(function (a) { return a.un === c.un; })[0];
      if (acc && !api.has(acc.id)) { api.own().push(acc.id); out.unlock = acc.id; }
      bond(pt, 4, "contest"); first(pt, "win_" + c.k); ev(pt, "win", c.k);
      if (S && S.p) S.p.fame = cl(S.p.fame + [0.4, 0.8, 1.5][CONT.indexOf(c)], 0, 100);
    } else { pt.lose = (pt.lose || 0) + 1; if (pos <= 3 && S && S.p) { out.prize = Math.round(c.prize * (pos === 2 ? 0.35 : 0.15)); S.p.money += out.prize; } bond(pt, 1.5, "contest"); }
    pt.n.ene = cl(pt.n.ene - 12, 0, 100);
    return out;
  };
  api.contPay = function (c) { return pay(c.fee); };

  /* ---------- fútbol: efecto oculto y reacciones ---------- */
  /* cada tramo: moral suave según vínculo y ánimo (nunca se muestra la cifra) */
  api.block = function (pt) {
    if (!pt || !S || !S.p) return 0;
    api.tick(pt);
    var v = ((pt.bond - 30) / 70) * 0.9 + ((pt.mood - 50) / 50) * 0.5;
    v = cl(v, -0.6, 1.3);
    S.p.mor = cl(S.p.mor + v, 0, 100);
    return v;
  };
  api.matchMood = function (pt, res) {
    if (!pt) return;
    pt.lastRes = {r: res, t: api.clock()};
    if (res === "W") pt.boost = cl((pt.boost || 0) + 6, 0, 30);
    pt.mood = api.mood(pt);
  };
  /* ---------- álbum ---------- */
  api.photo = function (pt, o) {
    pt.album.push({t: api.clock(), x: o.expr || "happy", eq: (pt.eq ? JSON.parse(JSON.stringify(pt.eq)) : {}), sc: o.scene || "home", st: api.stage(pt), d: o.d || ""});
    if (pt.album.length > 40) pt.album.shift();
    first(pt, "photo");
    return pt.album.length;
  };
  api.season = function (pt) {
    pt.age = (pt.age || 0) + 1;
    var st = api.stage(pt);
    if (st !== pt.lastSt) { pt.lastSt = st; ev(pt, "grow", st); first(pt, "stage" + st); return {grow: st}; }
    return {};
  };
  return api;
})();
