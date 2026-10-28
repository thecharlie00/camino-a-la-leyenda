/* look56.js — aspecto único del jugador y del míster (5.7).
   Una sola fuente de verdad por personaje: el Look (life.cos) guarda piel, peinado, color de pelo y
   celebración; todo lo que se lleva puesto vive en el equipamiento (GXI: life.gear / S.m.gear).
   PLook.player() y PLook.coach() describen el personaje completo; PLook.rig() y PLook.coachRig() lo
   traducen a SpRig, el único constructor vóxel de cuerpo entero (Yo, Look, minijuegos y directo).
   Las vistas 2D (avatar sin WebGL, retrato del míster, escenas de eventos) leen la misma descripción.
   Las cachés de las vistas usan la descripción como clave: al equipar algo se regeneran solas.
   Partidas antiguas: lo que se compró o desbloqueó en el Look (botas, mangas, cinta, guantes) pasa a ser
   una pieza propia y, si era lo que se veía, se equipa. */
var PLook = (function () {
  var api = {}, CATS = ["boots", "sleeve", "band", "gloves"], HS = {short: 0, buzz: 1, curly: 2, long: 3, bald: 4};
  var DEF = {skin: "#e0ac85", hair: "#1d1612", boots: "#16191b", arm: "#ffb21e"};
  function lifeL() { try { return S && S.p ? lifeOf() : null; } catch (e) { return null; } }
  function cosHex(cat, id) { var it = typeof lifeItem === "function" ? lifeItem(cat, id) : null; return it && it.c; }
  /* la pieza de la ranura del Look de antes («boots:red» → L_boots_red) */
  function byCos(key) { var L = GXI.items("p"); for (var i = 0; i < L.length; i++) if (L[i].look && L[i].look.cos === key) return L[i]; return null; }
  /* equipación del club (la misma regla que el avatar 2D: el portero con su color propio) */
  api.kit = function (club, gk) {
    var c = W && W.clubs && W.clubs[club], col = c && c.col ? c.col : c ? clubColors(c.n) : ["#c8312f", "#f4f4f0"], c1 = col[0], c2 = col[1] || "#f4f4f0";
    if (gk) {
      var lum = function (x) { try { var r = VoxCore.rgb(x); return r[0] * 0.3 + r[1] * 0.59 + r[2] * 0.11; } catch (e) { return 0.5; } };
      var opts = ["#2bb673", "#c6f432", "#1b1d1f", "#ff7a1a", "#7a3cf0"], k = hashStr(String(club)) % opts.length;
      for (var i = 0; i < opts.length && Math.abs(lum(opts[k]) - lum(c1)) < 0.18; i++) k = (k + 1) % opts.length;
      return {shirt: opts[k], shorts: "#1b1d1f", socks: opts[k], trim: c1};
    }
    return {shirt: c1, shorts: c2, socks: c1, trim: c2};
  };
  /* ---------- prueba sin equipar (vestidor y tienda) ----------
     tryOn = {w: "p"|"m", eq: {ranura: id | null}}: lo que ves puesto mientras pruebas; nunca se guarda en la partida */
  api.tryOn = null;
  api.eqOf = function (g, w) { var t = api.tryOn; return t && t.w === w ? Object.assign({}, g.eq, t.eq) : g.eq; };
  api.tried = function (id) { var t = api.tryOn; if (!t) return false; for (var k in t.eq) if (t.eq[k] === id) return true; return false; };
  /* ---------- jugador ---------- */
  api.player = function () {
    var L = lifeL(), c = L && L.cos || {}, p = S.p, g = L ? GXI.gear("p") : null, o = {gear: {}};
    o.skin = cosHex("skin", c.skin || LIFE_COS_DEF.skin) || DEF.skin;
    o.hair = cosHex("hcol", c.hcol || LIFE_COS_DEF.hcol) || DEF.hair;
    o.hairId = c.hair || LIFE_COS_DEF.hair; o.hairStyle = HS[o.hairId] || 0;
    o.fem = S.g === "f"; o.num = (L && L.num) || p.num || 9; o.club = p.club;
    o.gk = typeof isGK === "function" && isGK(); o.captain = !!(p.flags && p.flags.captain);
    o.shirt = typeof lifeItem === "function" ? lifeItem("shirt", c.shirt || LIFE_COS_DEF.shirt) : null;
    var eq = g ? api.eqOf(g, "p") : {};
    if (g) GX_SLOTS.p.forEach(function (s) {
      var id = eq[s[0]], it = id && (g.own[id] || api.tried(id)) ? GXI.item(id) : null; if (!it) return;
      o.gear[s[0]] = {id: id, c: it.look.c, c2: it.look.c2, t: g.own[id] ? g.own[id].t : 0, cos: it.look.cos || null};
    });
    var q = o.gear, kit = api.kit(p.club, false);
    o.boots = q.boots ? q.boots.c : DEF.boots;
    o.gloves = q.gloves ? {c: q.gloves.c, c2: q.gloves.c2 || q.gloves.c} : null;
    /* térmica: la manga larga es del color de la camiseta; las mallas tapan las piernas; el resto asoma bajo la manga */
    o.therm = q.therm ? (q.therm.cos === "sleeve:long" ? {k: "long", c: kit.shirt} : q.therm.cos === "sleeve:tights" ? {k: "tights", c: q.therm.c} : {k: "under", c: q.therm.c}) : null;
    o.band = q.band ? (q.band.cos === "band:club" ? kit.shirt : q.band.c) : null;
    /* brazalete: el equipado; si eres capitán y no llevas ninguno, el de capitán */
    o.arm = q.arm ? q.arm.c : o.captain ? DEF.arm : null;
    return o;
  };
  /* dónde se ve cada ranura. «yo»: zona Yo y Look (todo); «pitch»: minijuegos y partido (en el campo).
     La sudadera y los cascos son de calentamiento y llegada: fuera del campo. Colgante y reloj no se llevan
     jugando (reglamento): se guardan. Lo que no sale aquí no falta: se ha quitado para jugar. */
  api.CTX = {hood: {yo: 1}, phones: {yo: 1}, neck: {yo: 1}, watch: {yo: 1}};
  api.shows = function (slot, ctx) { var r = api.CTX[slot]; return !r || !!r[ctx || "yo"]; };
  /* opciones de SpRig: la misma figura en Yo, en el Look y en los minijuegos */
  api.rig = function (pl, extra) {
    pl = pl || api.player();
    var ctx = extra && extra.ctx || "yo", kit = api.kit(pl.club, pl.gk && !(extra && extra.outfield));
    if (pl.shirt) kit = Object.assign({}, kit, {shirt: pl.shirt.c || kit.shirt, shorts: pl.shirt.shorts || kit.shorts, socks: pl.shirt.c || kit.socks, trim: pl.shirt.c2 || kit.trim});
    var o = {shirt: kit.shirt, shorts: kit.shorts, socks: kit.socks, trim: kit.trim, shirtPattern: pl.shirt && (pl.shirt.pattern || pl.shirt.id) || "plain", num: pl.num, skin: pl.skin, hair: pl.hair, hairStyle: pl.hairStyle, fem: pl.fem,
      boots: pl.boots, gk: pl.gk, gloves: pl.gloves ? pl.gloves.c : "#f4f4f0"};
    if (pl.arm) o.armband = pl.arm;
    /* equipamiento visible en este contexto; colores del equipo donde toca (cinta y sudadera «del club») */
    var G = {}, q = pl.gear;
    Object.keys(q).forEach(function (s) {
      var p = q[s]; if (s === "arm" || !api.shows(s, ctx)) return;
      var it = GXI.item(p.id) || {}, e = {c: p.c, c2: p.c2 || null, t: p.t, tc: p.t >= 3 ? GX_TIERS[p.t].c : null};
      if (s === "boots") e.line = it.set || "";
      if (s === "band") e.c = pl.band;
      if (s === "hood" && p.id === "ho_club") e.c = kit.shirt;
      if (s === "therm") { e.k = pl.therm.k; e.c = pl.therm.c; }
      G[s] = e;
    });
    if (Object.keys(G).length) o.gear = G;
    if (extra) { extra = Object.assign({}, extra); delete extra.ctx; delete extra.outfield; Object.assign(o, extra); }
    return o;
  };
  /* ---------- míster ---------- */
  /* ropa del míster según la ocasión (5.7). ctx = {kind: "yo"|"match"|"train"|"indoor", big, cold}
     - partido importante (copa, final, derbi, rival de tu nivel): el traje elegido para esas noches, si lo tienes
     - entrenamiento: la ropa elegida para entrenar (el chándal, normalmente)
     - abrigo/plumífero: en «Yo» se ve siempre; fuera, con frío o lluvia (o siempre, si lo eliges); dentro (prensa, despacho), nunca
     Solo cambia lo que se ve: las estadísticas son siempre las de lo equipado. */
  var TRACK = {m_suit_trk: 1};
  api.cold = function (wx) { var bi = S && S.bi; return wx === "cold" || wx === "rain" || bi === 2 || bi === 3; };
  api.coachPrefs = function () { var g = GXI.gear("m"); return g ? g.ctx || (g.ctx = {big: null, train: null, coat: "cold"}) : {coat: "cold"}; };
  api.coach = function (ctx) {
    ctx = ctx || {kind: "yo"};
    var o = {suit: "#2a3340", tie: "#7a1d1d", shirt: "#f4f4f0", shoes: "#2a1a10", coat: null, scarf: null, glasses: null, notes: null, watch: null, skin: "#c18a5e", hair: "#2a1a10", hairStyle: 0, fem: S.g === "f", track: false};
    try {
      var g = GXI.gear("m"), eq = g ? api.eqOf(g, "m") : {}, it = function (s) { var id = eq[s]; return id && (g.own[id] || api.tried(id)) ? GXI.item(id) : null; };
      var pf = api.coachPrefs(), alt = ctx.kind === "match" && ctx.big ? pf.big : ctx.kind === "train" ? pf.train : null;
      var su = alt && g.own[alt] && !api.tryOn ? GXI.item(alt) : it("suit");
      if (su) { o.suit = su.look.c; if (su.look.c2) o.tie = su.look.c2; o.track = !!TRACK[su.id]; }
      var ti = it("tie"); if (ti) o.tie = ti.look.c; var sh = it("shoes"); if (sh) o.shoes = sh.look.c;
      ["coat", "scarf", "glasses", "notes", "watch"].forEach(function (s) { var x = it(s); if (x) o[s] = x.look.c; });
      /* con chándal no hay corbata; dentro no se lleva abrigo ni libreta; fuera, el abrigo según el tiempo */
      if (o.track) o.tie = null;
      if (ctx.kind === "indoor") { o.coat = null; o.notes = null; }
      else if (ctx.kind !== "yo" && o.coat && pf.coat !== "always" && !ctx.cold) o.coat = null;
      var L = S.p && S.p.life, c = L && L.cos;
      if (c) { o.skin = cosHex("skin", c.skin || LIFE_COS_DEF.skin) || o.skin; o.hair = cosHex("hcol", c.hcol || LIFE_COS_DEF.hcol) || o.hair; o.hairStyle = HS[c.hair] || 0; }
    } catch (e) {}
    return o;
  };
  /* traje: mangas largas (como el portero, con las manos de su piel) y pantalón largo hasta el zapato */
  api.coachRig = function (co) {
    co = co || api.coach(); var jk = co.coat || co.suit;
    return {shirt: jk, shorts: co.suit, socks: co.suit, trim: co.suit, skin: co.skin, hair: co.hair, hairStyle: co.hairStyle, boots: co.shoes, fem: co.fem,
      official: true, gk: true, gloves: co.skin, longLegs: true, tie: co.tie, coat: co.coat, glasses: co.glasses, scarf: co.scarf, notes: co.notes, watch: co.watch};
  };
  /* ---------- Look y equipamiento: una sola fuente ---------- */
  function migrate(g) {
    var L = lifeL(); if (!L) return;
    CATS.forEach(function (cat) {
      (LIFE_COS[cat] || []).forEach(function (ci) {
        var it = byCos(cat + ":" + ci.id); if (!it || g.own[it.id]) return;
        var lk = lifeLocked(cat, ci);
        if (!lk || L.own.indexOf(cat + ":" + ci.id) >= 0) g.own[it.id] = {t: 0, y: S.yr};
      });
      var cur = L.cos && L.cos[cat];
      if (cur) {
        var pc = byCos(cat + ":" + cur), on = pc && g.eq[pc.slot], onIt = on && GXI.item(on);
        /* lo que se veía en el Look se respeta salvo que lleves una pieza de la tienda en esa ranura */
        if (pc && g.own[pc.id] && (!on || (onIt && onIt.look.cos))) g.eq[pc.slot] = pc.id;
        delete L.cos[cat];
      }
    });
  }
  /* piezas de siempre que se desbloquean (fama, títulos, capitanía) y no tienen precio: pasan a ser tuyas */
  api.unlocks = function () {
    var L = lifeL(), g = L && L.gear; if (!g || S.mode === "mgr") return [];
    var out = [];
    GXI.items("p").forEach(function (it) { if (it.look.cos && !it.price && it.req && !g.own[it.id] && !GXI.lock(it)) { g.own[it.id] = {t: 0, y: S.yr}; out.push(it); } });
    return out;
  };
  var _gear = GXI.gear;
  GXI.gear = function (who) {
    var g = _gear.apply(this, arguments);
    if (g && (who || (S && S.mode === "mgr" ? "m" : "p")) === "p" && !g.lk) { g.lk = 1; try { migrate(g); GXI.syncLook(); } catch (e) {} }
    return g;
  };
  /* equipar ya no toca el Look: el aspecto se lee siempre del equipamiento */
  var _eq = GXI.equip;
  GXI.equip = function (id, who) {
    var r = _eq.apply(this, arguments), L = lifeL();
    if (L && L.cos) CATS.forEach(function (k) { delete L.cos[k]; });
    return r;
  };
  api.CATS = CATS;
  /* ---------- vestidor: cálculos sin tocar la partida ---------- */
  /* ejecuta f con el equipamiento cambiado (piezas no tuyas en Común) y lo deja todo como estaba */
  api.withEq = function (w, eq, f) {
    var g = GXI.gear(w), save = g.eq, added = [];
    g.eq = Object.assign({}, g.eq, eq);
    Object.keys(eq).forEach(function (s) { var id = eq[s]; if (id && !g.own[id]) { g.own[id] = {t: 0}; added.push(id); } });
    try { return f(); } finally { g.eq = save; added.forEach(function (id) { delete g.own[id]; }); }
  };
  /* lo que ves en la ficha: atributos efectivos (jugador) o estadísticas del míster */
  api.stats = function (w) { return w === "m" ? (typeof GXM !== "undefined" ? GXM.stats() : {}) : attrs(); };
  /* equipar lo mejor: por un atributo o equilibrado (suma con los contras), con tope y conjuntos incluidos.
     Solo cuando el jugador lo pide; devuelve la propuesta sin aplicarla */
  api.best = function (w, key) {
    var g = GXI.gear(w), eq = Object.assign({}, g.eq), slots = GX_SLOTS[w].map(function (s) { return s[0]; });
    function score(e) {
      var b = api.withEq(w, e, function () { return GXI.bonus(w); }), v = 0;
      if (key) return (b[key] || 0) * 100 + Object.keys(b).reduce(function (a, k) { return a + b[k]; }, 0) * 0.01;
      Object.keys(b).forEach(function (k) { v += b[k]; }); return v;
    }
    for (var pass = 0; pass < 2; pass++) slots.forEach(function (s) {
      var opts = [null].concat(Object.keys(g.own).filter(function (id) { var it = GXI.item(id); return it && it.slot === s && it.own === w; })), bestId = eq[s], bestV = -1e9;
      opts.forEach(function (id) { var e = Object.assign({}, eq); e[s] = id; var v = score(e); if (v > bestV + 1e-6) { bestV = v; bestId = id; } });
      eq[s] = bestId;
    });
    return eq;
  };
  /* aplica un equipamiento completo (conjunto guardado, «lo mejor», «quitar todo»); devuelve las ranuras que cambian */
  api.apply = function (w, eq) {
    var g = GXI.gear(w), ch = [];
    GX_SLOTS[w].forEach(function (s) {
      var k = s[0], want = eq[k] && g.own[eq[k]] ? eq[k] : null, cur = g.eq[k] || null;
      if (want === cur) return;
      if (want) GXI.equip(want, w); else GXI.equip(cur, w);
      ch.push(k);
    });
    return ch;
  };
  /* conjuntos guardados (hasta 4 por personaje), en la partida */
  api.outfits = function (w) { var g = GXI.gear(w); return g.fits || (g.fits = []); };
  /* ---------- animación de equipar y cámara por ranura ---------- */
  api.EQCLIP = {boots: "eqfeet", socks: "eqfeet", shin: "eqfeet", shoes: "eqfeet", gloves: "eqhands", wrist: "eqhands", watch: "eqhands", notes: "eqhands",
    band: "eqhead", phones: "eqhead", glasses: "eqface", hood: "eqhood", therm: "eqhood", suit: "eqlapel", coat: "eqlapel", tie: "eqlapel", scarf: "eqlapel", neck: "eqlapel", arm: "eqarm"};
  /* zona del cuerpo de cada ranura: altura del objetivo de la cámara y distancia */
  api.FOCUS = {feet: [0.22, 1.7], shin: [0.42, 1.9], hands: [0.95, 1.9], head: [1.72, 1.5], chest: [1.3, 2.0]};
  api.ZONE = {boots: "feet", shoes: "feet", socks: "shin", shin: "shin", gloves: "hands", wrist: "hands", watch: "hands", notes: "hands",
    band: "head", phones: "head", glasses: "head", hood: "chest", therm: "chest", suit: "chest", coat: "chest", tie: "chest", scarf: "chest", neck: "chest", arm: "chest"};
  return api;
})();
/* clips de equipar: cortos, con anticipación y vuelta al reposo (se saltan tocando; sin ellos si se reducen las animaciones) */
(function () {
  if (typeof SpRig === "undefined" || !SpRig || !SpRig.CLIPS) return;
  var C = SpRig.CLIPS;
  function seg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
  function hold(k, a, b) { return seg(k, 0, a) * (1 - seg(k, b, 1)); }
  function crouch(P, R, k) { R.y -= 0.16 * k; P.thighA[0] -= 0.55 * k; P.thighB[0] -= 0.55 * k; P.shinA[0] += 0.95 * k; P.shinB[0] += 0.95 * k; P.footA[0] -= 0.4 * k; P.footB[0] -= 0.4 * k; P.spine[0] += 0.3 * k; }
  /* se agacha y se ata las botas (o se sube las medias) */
  C.eqfeet = {d: 1.9, f: function (m, P, R, k) { var e = hold(k, 0.2, 0.8), j = Math.sin(m.t * 17) * 0.22 * seg(k, 0.25, 0.7) * (1 - seg(k, 0.7, 0.8));
    crouch(P, R, 1.25 * e); P.spine[0] += 0.45 * e; P.head[0] += 0.35 * e; P.armA[0] -= 0.75 * e; P.armB[0] -= 0.75 * e; P.foreA[0] -= 0.35 * e; P.foreB[0] -= 0.35 * e; P.handA[2] += j; P.handB[2] -= j; }};
  /* se ajusta los guantes, la muñequera o el reloj: manos juntas delante, tirón */
  C.eqhands = {d: 1.5, f: function (m, P, R, k) { var e = hold(k, 0.2, 0.8), t = Math.sin(seg(k, 0.35, 0.65) * Math.PI) * 0.25;
    P.armA[0] -= 0.9 * e; P.armB[0] -= 0.9 * e; P.foreA[0] -= 1.1 * e; P.foreB[0] -= 1.1 * e; P.foreA[1] -= 0.55 * e; P.foreB[1] += 0.55 * e; P.foreB[0] += t; P.head[0] += 0.3 * e; }};
  /* se coloca la cinta o los cascos: las dos manos a la cabeza */
  C.eqhead = {d: 1.6, f: function (m, P, R, k) { var e = hold(k, 0.25, 0.75);
    P.armA[0] -= 2.3 * e; P.armB[0] -= 2.3 * e; P.armA[2] += 0.55 * e; P.armB[2] -= 0.55 * e; P.foreA[0] -= 1.5 * e; P.foreB[0] -= 1.5 * e; P.head[0] += 0.12 * e * Math.sin(seg(k, 0.3, 0.7) * Math.PI); }};
  /* gafas: una mano a la cara */
  C.eqface = {d: 1.3, f: function (m, P, R, k) { var e = hold(k, 0.25, 0.75); P.armA[0] -= 1.9 * e; P.foreA[0] -= 1.7 * e; P.foreA[1] -= 0.4 * e; P.head[0] -= 0.1 * e; }};
  /* sudadera o térmica: brazos arriba, se la pone y se estira */
  C.eqhood = {d: 1.7, f: function (m, P, R, k) { var up = Math.sin(seg(k, 0.05, 0.6) * Math.PI), e = hold(k, 0.15, 0.85);
    P.armA[2] += 2.6 * up; P.armB[2] -= 2.6 * up; P.foreA[2] += 0.5 * up; P.foreB[2] -= 0.5 * up; P.head[0] += 0.25 * up; P.chest[0] -= 0.12 * e * seg(k, 0.6, 0.7); R.y += 0.03 * seg(k, 0.6, 0.7) * (1 - seg(k, 0.7, 0.85)); }};
  /* americana, abrigo, corbata, bufanda, colgante: se ajusta las solapas */
  C.eqlapel = {d: 1.5, f: function (m, P, R, k) { var e = hold(k, 0.2, 0.8), t = Math.sin(seg(k, 0.35, 0.65) * Math.PI);
    P.armA[0] -= 0.75 * e; P.armB[0] -= 0.75 * e; P.foreA[0] -= 1.35 * e; P.foreB[0] -= 1.35 * e; P.foreA[1] -= 0.8 * e; P.foreB[1] += 0.8 * e; P.chest[0] -= 0.1 * t; P.head[0] += 0.2 * e; }};
  /* míster en la banda: levanta la libreta (o la tableta) y apunta, mirando de reojo al campo */
  C.cnotes = {d: 2.6, f: function (m, P, R, k) { var e = hold(k, 0.15, 0.85), wr = Math.sin(m.t * 14) * 0.12 * seg(k, 0.25, 0.75) * (1 - seg(k, 0.75, 0.85));
    P.armB[0] -= 0.95 * e; P.foreB[0] -= 1.25 * e; P.foreB[1] += 0.45 * e; P.armA[0] -= 0.8 * e; P.foreA[0] -= 1.15 * e; P.foreA[1] -= 0.55 * e; P.handA[2] += wr;
    P.head[0] += 0.35 * e * (1 - 0.8 * Math.max(0, Math.sin(seg(k, 0.45, 0.6) * Math.PI))); P.head[1] += 0.3 * Math.max(0, Math.sin(seg(k, 0.45, 0.6) * Math.PI)); }};
  /* brazalete: la mano derecha se lo coloca en el brazo izquierdo */
  C.eqarm = {d: 1.4, f: function (m, P, R, k) { var e = hold(k, 0.2, 0.8); P.armB[0] -= 1.0 * e; P.foreB[0] -= 1.2 * e; P.foreB[1] += 1.0 * e; P.armA[2] += 0.25 * e; P.head[1] += 0.45 * e; P.head[0] += 0.2 * e; }};
})();
