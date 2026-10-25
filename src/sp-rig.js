/* sp-rig.js — jugadores vóxel de balón parado (5.6): las mismas piezas que el cuerpo vóxel del partido
   (VOX_PARTS de pitch3d), montadas como partes rígidas con pivotes, y clips con anticipación,
   follow-through y easing: carrera, golpeos por tipo, porteros (espera, estiradas, blocaje, puños),
   barrera (protegerse, saltar, girarse, tumbarse), árbitro (silbato, spray) y celebraciones. */
var SpRig = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore || !Pitch3D || !Pitch3D.core || !Pitch3D.core.VOX_PARTS) return null;
  var C = Pitch3D.core, MX = VoxCore.MX, PI = Math.PI, SC = 0.93;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function eOut(k) { return 1 - (1 - k) * (1 - k); }
  function bell(k, a, b) { return k <= a || k >= b ? 0 : Math.sin((k - a) / (b - a) * PI); }
  function seg(k, a, b) { return cl((k - a) / (b - a), 0, 1); }
  /* huesos: pivote (m, sin escalar) y padre. a = lado x>0 (izquierda del jugador), b = lado x<0 (derecha) */
  var BONES = {
    hips: {p: [0, 0.95, 0], par: null, id: 1}, spine: {p: [0, 1.0, 0], par: "hips", id: 2}, chest: {p: [0, 1.21, 0], par: "spine", id: 3},
    neck: {p: [0, 1.48, 0], par: "chest", id: 4}, head: {p: [0, 1.55, 0], par: "neck", id: 5},
    armA: {p: [0.325, 1.44, 0], par: "chest", id: 7}, foreA: {p: [0.325, 1.135, 0], par: "armA", id: 8}, handA: {p: [0.325, 0.95, 0], par: "foreA", id: 9},
    armB: {p: [-0.325, 1.44, 0], par: "chest", id: 11}, foreB: {p: [-0.325, 1.135, 0], par: "armB", id: 12}, handB: {p: [-0.325, 0.95, 0], par: "foreB", id: 13},
    thighA: {p: [0.115, 0.88, 0], par: "hips", id: 14}, shinA: {p: [0.115, 0.5, 0], par: "thighA", id: 15}, footA: {p: [0.115, 0.12, 0], par: "shinA", id: 16},
    thighB: {p: [-0.115, 0.88, 0], par: "hips", id: 18}, shinB: {p: [-0.115, 0.5, 0], par: "thighB", id: 19}, footB: {p: [-0.115, 0.12, 0], par: "shinB", id: 20}
  };
  var BY_ID = {}; Object.keys(BONES).forEach(function (n) { BY_ID[BONES[n].id] = n; }); BY_ID[17] = "footA"; BY_ID[21] = "footB";
  var MIRROR = {7: 11, 8: 12, 9: 13, 14: 18, 15: 19, 16: 20, 17: 21};
  var ORDER = ["hips", "spine", "chest", "neck", "head", "armA", "foreA", "handA", "armB", "foreB", "handB", "thighA", "shinA", "footA", "thighB", "shinB", "footB"];
  var cache = {}, cacheKeys = [];
  function rgb(c) { return VoxCore.rgb(c); }
  function luma(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }
  /* mallas por hueso, relativas a su pivote */
  function build(o) {
    var key = JSON.stringify(o); if (cache[key]) return cache[key];
    var pal = {kit_shirt: rgb(o.shirt || "#c33"), kit_shorts: rgb(o.shorts || "#111"), kit_socks: rgb(o.socks || o.shirt || "#c33"), kit_trim: rgb(o.trim || "#fff"),
      skin: rgb(o.skin || "#b8855e"), hair: rgb(o.hair || "#2a1a10"), boots: rgb(o.boots || "#141414"), eye: [0.06, 0.05, 0.05]};
    pal.mouth = VoxCore.shade(pal.skin, 0.62); pal.arm = o.gk ? pal.kit_shirt : pal.skin; pal.hand = o.gk ? rgb(o.gloves || "#f07a24") : pal.skin;
    /* 5.7: lo que cubre la piel cambia el color de esa pieza en lugar de superponerse: térmica bajo la manga, guantes */
    var G = o.gear || {};
    if (G.therm && !o.gk && G.therm.k !== "tights") pal.arm = G.therm.k === "long" ? pal.kit_shirt : rgb(G.therm.c);
    if (G.gloves && !o.gk) pal.hand = rgb(G.gloves.c);
    var parts = {};
    ORDER.forEach(function (n) { parts[n] = new C.Mesh(2048); parts[n].code = C.MAT.MATTE; });
    function add(bone, x0, y0, z0, x1, y1, z1, col, ao) {
      var n = BY_ID[bone], P = BONES[n].p, m = parts[n];
      m.box(((x0 + x1) / 2 - P[0]) * SC, (y0 - P[1]) * SC, ((z0 + z1) / 2 - P[2]) * SC, (x1 - x0) * SC, (y1 - y0) * SC, (z1 - z0) * SC, col, ao == null ? 0.82 : ao);
    }
    C.VOX_PARTS.forEach(function (Q) {
      var col = pal[Q[7]] || pal.kit_shirt;
      if (Q[7] === "kit_shorts" && Q[0] === 14) col = pal.kit_shorts;
      /* 5.6: pantalón largo (míster): sin piel en las piernas */
      if (o.longLegs && Q[7] === "skin" && [14, 15, 16, 18, 19, 20].indexOf(Q[0]) >= 0) col = pal.kit_shorts;
      if (G.therm && G.therm.k === "tights" && Q[7] === "skin" && Q[0] === 14) col = rgb(G.therm.c);
      add(Q[0], Q[1], Q[2], Q[3], Q[4], Q[5], Q[6], col);
      if (Q[9]) add(MIRROR[Q[0]] || Q[0], -Q[4], Q[2], Q[3], -Q[1], Q[5], Q[6], col);
    });
    var hs = o.fem ? C.HAIR_FEM : C.HAIR_STYLES[(o.hairStyle || 0) % C.HAIR_STYLES.length];
    hs.forEach(function (H) { add(5, H[0], H[1], H[2], H[3], H[4], H[5], pal.hair, 0.9); });
    /* dorsal en la espalda (cifras pixel del partido) */
    if (o.num > 0 && !G.hood) {
      var num = String(o.num % 100), px = 0.052, nw = num.length * 3 * px + (num.length - 1) * px * 0.8, nc = luma(pal.kit_shirt) > 0.55 ? [0.08, 0.09, 0.12] : [0.97, 0.97, 0.95];
      for (var d = 0; d < num.length; d++) { var g = C.DIGITS[+num.charAt(d)], ox = nw / 2 - d * (3 * px + px * 0.8);
        for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) if (g.charAt(r * 3 + c) === "1") { var x0 = ox - (c + 1) * px, y1 = 1.45 - r * px; add(3, x0, y1 - px, -0.178, x0 + px, y1, -0.163, nc, 1); } }
    }
    /* 5.7: brazalete equipado (o el de capitán) con su color, por fuera de la manga y de la sudadera */
    if (o.captain || o.armband) add(7, 0.236, 1.30, -0.104, 0.414, 1.36, 0.104, rgb(o.armband || "#f6c83a"), 1);
    if (o.official) { add(3, 0.06, 1.33, 0.165, 0.16, 1.40, 0.178, rgb("#f6c83a"), 1); }
    /* 5.6: camisa y corbata (míster) */
    if (o.tie) { add(3, -0.075, 1.30, 0.163, 0.075, 1.45, 0.172, rgb(o.collar || "#f4f4f0"), 1); add(3, -0.028, 1.06, 0.170, 0.028, 1.43, 0.182, rgb(o.tie), 1); }
    gear(o, G, pal, hs, add);
    var out = {mesh: {}, rel: {}};
    ORDER.forEach(function (n) {
      var B = BONES[n], par = B.par ? BONES[B.par].p : [0, 0, 0];
      out.mesh[n] = parts[n].a.slice(0, parts[n].n);
      out.rel[n] = B.par ? [(B.p[0] - par[0]) * SC, (B.p[1] - par[1]) * SC, (B.p[2] - par[2]) * SC] : [B.p[0] * SC, B.p[1] * SC, B.p[2] * SC];
    });
    /* 5.7: caché acotada (probar ropa crea muchas combinaciones): se olvidan las más antiguas */
    cache[key] = out; cacheKeys.push(key); while (cacheKeys.length > 32) delete cache[cacheKeys.shift()];
    return out;
  }

  /* ---------- 5.7: equipamiento ----------
     Cada ranura son bloques pegados a su hueso (heredan todas las animaciones), siempre unos milímetros por
     fuera de la pieza que tapan: sin caras coplanarias y sin nada que atraviese el cuerpo. Capas:
     piel → térmica (color del brazo) → camiseta → sudadera; pie → media → bota. Las espinilleras van bajo la
     media y solo se intuyen por el volumen. Las piezas Oro o superiores llevan un detalle del color del tier.
     GEAR_BOX recoge cada bloque por ranura para la herramienta de comprobación (SpRig.check). */
  var GEAR_BOX = null;
  function gear(o, G, pal, hs, add0) {
    var cur = "";
    function add(b, x0, y0, z0, x1, y1, z1, col, ao) { add0(b, x0, y0, z0, x1, y1, z1, col, ao); if (GEAR_BOX) GEAR_BOX.push({s: cur, b: b, box: [x0, y0, z0, x1, y1, z1]}); }
    function both(b, x0, y0, z0, x1, y1, z1, col, ao) { add(b, x0, y0, z0, x1, y1, z1, col, ao); add(MIRROR[b] || b, -x1, y0, z0, -x0, y1, z1, col, ao); }
    var sh = VoxCore.shade, dark = rgb("#1b1d1f");
    function tc(p) { return p && p.tc ? rgb(p.tc) : null; }
    /* botas: forma según la línea; suela y detalles en su segundo color */
    var B = G.boots; cur = "boots";
    if (B) {
      var c2 = rgb(B.c2 || "#e8eef0"), ln = B.line || "", sole = ln === "wal" ? 0.036 : 0.022;
      both(16, 0.026, -0.005, -0.099, 0.204, sole, 0.134, ln === "wal" ? dark : c2, 0.9);
      both(17, 0.036, -0.005, 0.118, 0.194, sole, 0.234, ln === "wal" ? dark : c2, 0.9);
      if (ln === "ray") { both(16, 0.198, 0.08, -0.06, 0.207, 0.11, 0.02, c2, 1); both(16, 0.198, 0.05, 0.0, 0.207, 0.08, 0.1, c2, 1); }
      else if (ln === "can") both(17, 0.034, -0.004, 0.2, 0.196, 0.112, 0.242, c2, 0.95);
      else if (ln === "mag") both(16, 0.028, 0.115, -0.098, 0.202, 0.148, 0.132, c2, 0.95);
      else if (ln === "tit") both(16, 0.198, 0.02, -0.095, 0.206, 0.08, -0.03, c2, 1);
      else { both(17, 0.07, 0.095, 0.13, 0.16, 0.108, 0.21, c2, 1); both(16, 0.198, 0.05, -0.06, 0.206, 0.09, 0.1, c2, 1); }
      if (tc(B)) both(16, 0.198, 0.095, -0.09, 0.209, 0.13, -0.04, tc(B), 1);
    }
    /* medias: del color del equipo; la pieza pone sus franjas */
    var So = G.socks; cur = "socks";
    if (So) {
      both(15, 0.028, 0.44, -0.097, 0.202, 0.48, 0.097, rgb(So.c), 0.95);
      both(15, 0.033, 0.155, -0.092, 0.197, 0.18, 0.092, rgb(So.c), 0.95);
      if (tc(So)) both(15, 0.197, 0.3, -0.02, 0.203, 0.33, 0.02, tc(So), 1);
    }
    cur = "shin";
    if (G.shin) both(15, 0.05, 0.2, 0.088, 0.18, 0.4, 0.112, sh(pal.kit_socks, 1.05), 0.85);
    /* sudadera: tapa camiseta y brazos; con ella no asoman muñequeras ni reloj */
    var H = G.hood; cur = "hood";
    if (H) {
      var hc = rgb(H.c), hd = sh(hc, 0.8);
      add(2, -0.238, 0.995, -0.163, 0.238, 1.235, 0.163, hc); add(3, -0.258, 1.205, -0.173, 0.258, 1.5, 0.173, hc);
      both(7, 0.242, 1.115, -0.098, 0.408, 1.5, 0.098, hc); both(8, 0.258, 0.945, -0.08, 0.392, 1.145, 0.08, hc);
      add(3, -0.17, 1.43, -0.24, 0.17, 1.5, -0.17, hd); add(2, -0.15, 1.04, 0.163, 0.15, 1.12, 0.168, hd, 0.9);
      both(3, 0.04, 1.38, 0.173, 0.055, 1.47, 0.178, rgb("#f4f4f0"), 1);
      if (tc(H)) add(3, 0.1, 1.3, 0.173, 0.15, 1.35, 0.178, tc(H), 1);
    } else {
      cur = "wrist";
      if (G.wrist) { both(8, 0.258, 0.955, -0.082, 0.392, 1.005, 0.082, rgb(G.wrist.c), 0.95); if (tc(G.wrist)) both(8, 0.392, 0.97, -0.02, 0.396, 0.99, 0.02, tc(G.wrist), 1); }
      cur = "watch";
      if (G.watch) { var W = G.watch; add(8, 0.257, 1.02, -0.081, 0.393, 1.05, 0.081, rgb(W.c2 || "#1b1d1f"), 0.9); add(8, 0.392, 1.005, -0.04, 0.405, 1.065, 0.04, rgb(W.c), 1); add(8, 0.404, 1.03, -0.01, 0.408, 1.04, 0.01, tc(W) || rgb("#e8eef0"), 1); }
    }
    cur = "gloves";
    if (G.gloves) both(9, 0.262, 0.925, -0.079, 0.388, 0.955, 0.079, rgb(G.gloves.c2 || G.gloves.c), 0.9);
    /* cabeza: cinta por encima de las cejas; cascos por encima del peinado */
    var top = 1.93; hs.forEach(function (q) { if (q[4] > top) top = q[4]; });
    cur = "band";
    if (G.band) { add(5, -0.226, 1.83, -0.226, 0.226, 1.87, 0.226, rgb(G.band.c), 0.95); add(5, 0.05, 1.79, -0.245, 0.11, 1.84, -0.226, rgb(G.band.c), 0.9); if (tc(G.band)) add(5, -0.03, 1.84, 0.226, 0.03, 1.86, 0.23, tc(G.band), 1); }
    cur = "phones";
    if (G.phones) {
      var pc = rgb(G.phones.c), p2 = G.phones.c2 ? rgb(G.phones.c2) : sh(pc, 0.6);
      add(5, -0.19, top + 0.002, -0.03, 0.19, top + 0.037, 0.03, pc, 0.95);
      add(5, 0.222, 1.78, -0.025, 0.236, top + 0.037, 0.025, pc); add(5, -0.236, 1.78, -0.025, -0.222, top + 0.037, 0.025, pc);
      add(5, 0.228, 1.66, -0.07, 0.275, 1.79, 0.07, p2); add(5, -0.275, 1.66, -0.07, -0.228, 1.79, 0.07, p2);
      add(5, 0.275, 1.7, -0.035, 0.28, 1.75, 0.035, tc(G.phones) || pc, 1); add(5, -0.28, 1.7, -0.035, -0.275, 1.75, 0.035, tc(G.phones) || pc, 1);
    }
    /* colgante: cadena en V sobre la camiseta y la medalla */
    cur = "neck";
    if (G.neck && !H) {
      var nc = rgb(G.neck.c2 || "#cfd8dc");
      both(3, 0.06, 1.45, 0.166, 0.1, 1.47, 0.176, nc, 1); both(3, 0.03, 1.42, 0.166, 0.07, 1.45, 0.176, nc, 1);
      add(3, -0.035, 1.405, 0.166, 0.035, 1.425, 0.176, nc, 1); add(3, -0.025, 1.35, 0.166, 0.025, 1.405, 0.184, tc(G.neck) || rgb(G.neck.c), 1);
    }
    /* míster: gafas, bufanda, libreta en la mano, reloj y faldón del abrigo */
    cur = "glasses";
    if (o.glasses) {
      var gc = rgb(o.glasses);
      add(5, -0.135, 1.765, 0.2135, 0.135, 1.79, 0.226, gc, 1);
      both(5, 0.045, 1.7, 0.214, 0.125, 1.765, 0.222, sh(gc, 0.55), 1);
      both(5, 0.2015, 1.765, 0.09, 0.214, 1.785, 0.2135, gc, 1);
    }
    cur = "scarf";
    if (o.scarf) { var scc = rgb(o.scarf); add(4, -0.13, 1.455, -0.12, 0.13, 1.54, 0.12, scc, 0.9); add(3, 0.05, 1.2, 0.174, 0.12, 1.46, 0.196, scc, 0.9); add(3, 0.05, 1.2, 0.196, 0.12, 1.22, 0.2, sh(scc, 0.75), 1); }
    cur = "notes";
    if (o.notes) { add(13, -0.355, 0.78, 0.076, -0.295, 0.92, 0.13, rgb(o.notes), 0.95); add(13, -0.352, 0.79, 0.13, -0.298, 0.91, 0.134, rgb("#f4f4f0"), 1); }
    cur = "mwatch";
    if (o.watch) { add(8, 0.261, 1.0, -0.076, 0.389, 1.03, 0.076, rgb("#1b1d1f"), 0.9); add(8, 0.388, 0.995, -0.03, 0.395, 1.035, 0.03, rgb(o.watch), 1); }
    cur = "coat";
    if (o.coat) add(1, -0.22, 0.7, -0.16, 0.22, 1.0, 0.16, rgb(o.coat), 0.85);
  }

  /* ---------- un jugador ---------- */
  function Man(o) {
    this.o = o; this.m = build(o); this.x = 0; this.z = 0; this.yaw = 0; this.y = 0; this.foot = o.foot === "L" ? "A" : "B";
    this.P = {}; ORDER.forEach(function (n) { this.P[n] = [0, 0, 0]; }, this);
    this.root = {y: 0, rx: 0, ry: 0, rz: 0, piv: [0, 0.95, 0]};
    this.clip = null; this.t = 0; this.W = {}; this.breath = Math.random() * 6; this.show = true;
  }
  Man.prototype.play = function (name, o) { var c = CLIPS[name]; if (!c) return; this.clip = {n: name, f: c.f, d: (o && o.d) || c.d, o: o || {}, t: 0, done: o && o.done, ev: o && o.ev, fired: {}}; };
  Man.prototype.update = function (dt) {
    var P = this.P, R = this.root; this.t += dt;
    for (var n in P) { P[n][0] = P[n][1] = P[n][2] = 0; }
    R.y = 0; R.rx = 0; R.ry = 0; R.rz = 0; R.ox = 0; R.oz = 0; R.piv = [0, 0.95, 0];
    /* reposo: respiración y peso */
    var br = Math.sin((this.t + this.breath) * 2.2);
    P.chest[0] += br * 0.015; P.armA[2] += 0.08 + br * 0.01; P.armB[2] -= 0.08 + br * 0.01; P.foreA[0] -= 0.12; P.foreB[0] -= 0.12;
    if (this.clip) {
      var c = this.clip; c.t += dt; var k = cl(c.t / c.d, 0, 1);
      c.f(this, P, R, k, c.o, c);
      if (c.ev) for (var e in c.ev) if (!c.fired[e] && k >= +e) { c.fired[e] = 1; c.ev[e](); }
      if (c.t >= c.d && c.d < 1e8) { this.clip = null; if (c.done) c.done(); }
    }
  };
  Man.prototype.matrices = function () {
    var R = this.root, W = this.W, m = this.m, P = this.P;
    var ca = Math.cos(this.yaw), sa = Math.sin(this.yaw);
    var root = MX.mul(MX.T(this.x + (R.ox || 0) * ca + (R.oz || 0) * sa, this.y + R.y, this.z - (R.ox || 0) * sa + (R.oz || 0) * ca), MX.RY(this.yaw + R.ry));
    if (R.rx || R.rz) root = MX.mul(root, MX.about([R.piv[0] * SC, R.piv[1] * SC, R.piv[2] * SC], MX.mul(MX.RZ(R.rz), MX.RX(R.rx))));
    this.Mroot = root;
    for (var i = 0; i < ORDER.length; i++) {
      var n = ORDER[i], B = BONES[n], rl = m.rel[n], r = P[n], base = B.par ? W[B.par] : root;
      var M = MX.mul(base, MX.T(rl[0], rl[1], rl[2]));
      if (r[1]) M = MX.mul(M, MX.RY(r[1])); if (r[0]) M = MX.mul(M, MX.RX(r[0])); if (r[2]) M = MX.mul(M, MX.RZ(r[2]));
      W[n] = M;
    }
  };
  Man.prototype.draw = function (E) { if (!this.show) return; this.matrices(); for (var i = 0; i < ORDER.length; i++) E.bake(this.m.mesh[ORDER[i]], this.W[ORDER[i]]); };
  /* punto del mundo de un hueso (para el balón en el pie o en las manos) */
  Man.prototype.at = function (bone, off) { var W = this.W[bone]; if (!W) return [this.x, 1, this.z]; off = off || [0, 0, 0]; return MX.tp(W, off[0], off[1], off[2]); };

  /* ---------- clips ---------- */
  function legsRun(P, ph, amp, kneeAmp) {
    var s = Math.sin(ph), c = Math.cos(ph);
    P.thighA[0] -= s * amp; P.thighB[0] += s * amp;
    P.shinA[0] += Math.max(0, c) * kneeAmp + 0.1; P.shinB[0] += Math.max(0, -c) * kneeAmp + 0.1;
    P.armA[0] += s * amp * 0.8; P.armB[0] -= s * amp * 0.8; P.foreA[0] -= 0.7; P.foreB[0] -= 0.7;
  }
  function crouch(P, R, k) { R.y -= 0.16 * k; P.thighA[0] -= 0.55 * k; P.thighB[0] -= 0.55 * k; P.shinA[0] += 0.95 * k; P.shinB[0] += 0.95 * k; P.footA[0] -= 0.4 * k; P.footB[0] -= 0.4 * k; P.spine[0] += 0.3 * k; }
  function side(man) { return man.foot; }  /* "B" = derecha */
  var CLIPS = {
    idle: {d: 1e9, f: function () {}},
    run: {d: 1e9, f: function (m, P, R, k, o) { var ph = m.t * (o.cad || 11); legsRun(P, ph, o.amp || 0.75, 1.1); R.y += Math.abs(Math.sin(ph)) * 0.04; P.spine[0] += 0.12; }},
    walk: {d: 1e9, f: function (m, P, R, k, o) { var ph = m.t * 6; legsRun(P, ph, 0.35, 0.5); P.foreA[0] += 0.5; P.foreB[0] += 0.5; }},
    /* colocar el balón: agacharse, girarlo, mirar la portería */
    place: {d: 2.2, f: function (m, P, R, k) { var e = bell(k, 0, 0.75); crouch(P, R, e); P.spine[0] += 0.5 * e; P.armA[0] -= 1.0 * e; P.armB[0] -= 1.0 * e; P.handA[1] += Math.sin(k * 20) * 0.3 * e; P.head[0] -= 0.4 * bell(k, 0.6, 1); }},
    breathe: {d: 2.4, f: function (m, P, R, k) { var e = bell(k, 0, 1); P.chest[0] -= 0.12 * e; P.head[0] -= 0.15 * e; P.armA[2] += 0.15 * e; P.armB[2] -= 0.15 * e; R.y += 0.02 * e; }},
    /* carrera de aproximación: pasos reales, el último más largo (plantar) */
    approach: {d: 1.2, f: function (m, P, R, k, o) { var ph = k * (o.steps || 4) * PI; legsRun(P, ph, 0.6, 0.9); R.y += Math.abs(Math.sin(ph)) * 0.03; P.spine[0] += 0.08; }},
    /* golpeo: o.type inside | laces | outside | chip | toe; contacto en k = 0.55 */
    kick: {d: 0.9, f: function (m, P, R, k, o) {
      var s = side(m), K = s === "B" ? "B" : "A", S = s === "B" ? "A" : "B", sg = s === "B" ? 1 : -1, ty = o.type || "laces";
      var back = bell(k, 0.0, 0.55) * (k < 0.55 ? 1 : 0) + (k < 0.4 ? seg(k, 0, 0.4) : 0) * 0, wind = seg(k, 0.05, 0.42) * (1 - seg(k, 0.42, 0.55));
      var swing = seg(k, 0.42, 0.6), follow = seg(k, 0.55, 1);
      /* apoyo plantado y brazos equilibrando */
      P["thigh" + S][0] -= 0.25 * (1 - follow * 0.5); P["shin" + S][0] += 0.3;
      R.y -= 0.06 * bell(k, 0.3, 0.8); P.spine[0] += 0.15 - 0.25 * swing; P.spine[2] += sg * 0.2 * bell(k, 0.3, 0.9);
      P["arm" + S][2] += sg * 1.1 * bell(k, 0.2, 1); P["arm" + K][0] += 0.6 * swing;
      /* pierna de golpeo: atrás (anticipación) → adelante (golpeo) → follow-through */
      var th = 0.9 * wind - (ty === "chip" || ty === "toe" ? 0.9 : 1.6) * swing * (1 - 0.3 * follow);
      P["thigh" + K][0] += th; P["shin" + K][0] += 1.5 * wind * (1 - swing) + 0.15;
      if (ty === "inside") P["thigh" + K][1] += sg * 0.6 * swing; if (ty === "outside") P["thigh" + K][1] -= sg * 0.5 * swing;
      if (ty === "laces") P["foot" + K][0] += 0.6 * swing;
      R.y += 0.04 * bell(k, 0.55, 0.9);
    }},
    /* celebraciones */
    arms: {d: 2.4, f: function (m, P, R, k) { var e = seg(k, 0, 0.2); legsRun(P, m.t * 10, 0.55, 0.9); P.armA[2] += 2.6 * e; P.armB[2] -= 2.6 * e; P.head[0] -= 0.3 * e; R.y += Math.abs(Math.sin(m.t * 10)) * 0.04; }},
    slide: {d: 2.4, f: function (m, P, R, k) { var e = seg(k, 0.15, 0.35); legsRun(P, m.t * 11 * (1 - e), 0.7 * (1 - e), 1); R.y -= 0.45 * e; P.thighA[0] += 0.4 * e; P.thighB[0] += 0.4 * e; P.shinA[0] += 2.2 * e; P.shinB[0] += 2.2 * e; P.spine[0] -= 0.5 * e; P.armA[2] += 2.2 * e; P.armB[2] -= 2.2 * e; P.head[0] -= 0.5 * e; R.oz += 0.0; }},
    plane: {d: 2.4, f: function (m, P, R, k) { var e = seg(k, 0, 0.2); legsRun(P, m.t * 10, 0.6, 0.9); P.armA[2] += 1.5 * e; P.armB[2] -= 1.5 * e; R.rz += Math.sin(m.t * 3) * 0.3 * e; }},
    jump: {d: 1.6, f: function (m, P, R, k) { var h = bell(k, 0.2, 0.7); crouch(P, R, bell(k, 0, 0.25) + bell(k, 0.7, 0.95)); R.y += 0.55 * h; P.armB[0] -= 2.8 * seg(k, 0.15, 0.3); P.foreB[0] -= 0.4; P.armA[2] += 0.4; }},
    silence: {d: 2.2, f: function (m, P, R, k) { var e = seg(k, 0, 0.25); P.armB[0] -= 1.6 * e; P.armB[1] += 0.5 * e; P.foreB[0] -= 1.7 * e; P.head[0] -= 0.15 * e; P.spine[1] += Math.sin(m.t * 1.4) * 0.3; }},
    flip: {d: 1.3, f: function (m, P, R, k) { var h = bell(k, 0.15, 0.85); crouch(P, R, bell(k, 0, 0.2) + bell(k, 0.85, 1)); R.y += 0.9 * h; R.piv = [0, 1.1, 0]; R.rx -= seg(k, 0.2, 0.8) * 2 * PI; P.thighA[0] -= 1.2 * h; P.thighB[0] -= 1.2 * h; P.shinA[0] += 1.6 * h; P.shinB[0] += 1.6 * h; }},
    /* lamentos */
    headhands: {d: 2.2, f: function (m, P, R, k) { var e = seg(k, 0, 0.25); P.armA[0] -= 2.4 * e; P.armB[0] -= 2.4 * e; P.armA[2] += 0.6 * e; P.armB[2] -= 0.6 * e; P.foreA[0] -= 1.6 * e; P.foreB[0] -= 1.6 * e; P.head[0] += 0.3 * e; P.spine[0] -= 0.15 * e; }},
    crouchsad: {d: 2.2, f: function (m, P, R, k) { var e = seg(k, 0, 0.3); crouch(P, R, e * 1.2); P.spine[0] += 0.5 * e; P.head[0] += 0.5 * e; P.armA[0] -= 0.8 * e; P.armB[0] -= 0.8 * e; }},
    punch: {d: 1.4, f: function (m, P, R, k) { var e = bell(k, 0.1, 0.6); P.armB[0] -= 2.0 * e; P.foreB[0] -= 0.3; P.spine[0] += 0.3 * e; P.head[0] += 0.4 * e; }},
    /* portero */
    gkready: {d: 1e9, f: function (m, P, R, k, o) { crouch(P, R, 0.55); P.armA[2] += 0.9; P.armB[2] -= 0.9; P.foreA[0] -= 0.6; P.foreB[0] -= 0.6; R.ox += Math.sin(m.t * (o.sway || 3)) * (o.amp == null ? 0.05 : o.amp); R.y += Math.max(0, Math.sin(m.t * 6)) * (o.hop || 0) ; }},
    gkdance: {d: 1e9, f: function (m, P, R, k) { var h = Math.max(0, Math.sin(m.t * 7)); R.y += h * 0.12; P.armA[2] += 1.6 + Math.sin(m.t * 5) * 0.6; P.armB[2] -= 1.6 + Math.sin(m.t * 5 + 1) * 0.6; R.ox += Math.sin(m.t * 2.3) * 0.25; }},
    /* estirada: o.dir (-1/1 en el eje x local), o.h (altura de las manos, m), o.reach; duración = tiempo hasta extensión */
    dive: {d: 0.45, f: function (m, P, R, k, o) {
      var dir = o.dir || 1, e = eOut(seg(k, 0.12, 1)), pre = bell(k, 0, 0.16), high = cl((o.h || 1) / 2.2, 0, 1), low = (o.h || 1) < 0.6;
      crouch(P, R, 0.55 + pre * 0.3 - e * 0.55);
      /* impulso con la pierna contraria */
      var push = dir > 0 ? "B" : "A", lead = dir > 0 ? "A" : "B";
      P["thigh" + push][0] += 0.4 * e; P["thigh" + lead][2] += dir * 0.6 * e;
      R.piv = [0, 0.95, 0]; R.rz -= dir * (low ? 1.45 : 1.2 - high * 0.35) * e; R.ox += dir * (o.reach || 1.6) * 0.55 * e; R.y += (low ? -0.25 : -0.1 + high * 0.45) * e;
      /* brazos estirados hacia el balón */
      P.armA[2] += (2.5 + (dir > 0 ? 0.3 : -0.2) * high) * e; P.armB[2] -= (2.5 + (dir < 0 ? 0.3 : -0.2) * high) * e; P.foreA[0] -= 0.1; P.foreB[0] -= 0.1;
      P.head[2] += dir * 0.3 * e;
    }},
    /* caída tras la estirada, con polvo (lo pone la escena) */
    land: {d: 0.6, f: function (m, P, R, k, o) {
      var dir = o.dir || 1, low = (o.h || 1) < 0.6, e = seg(k, 0, 0.5);
      R.piv = [0, 0.95, 0]; R.rz -= dir * (1.45 + 0.12 * e); R.ox += dir * (o.reach || 1.6) * (0.55 + 0.1 * e); R.y += -0.25 - (low ? 0 : 0.35) * (1 - e) - 0.45 * e;
      P.armA[2] += 2.4 - 0.6 * e; P.armB[2] -= 2.4 - 0.6 * e;
    }},
    gkjump: {d: 0.5, f: function (m, P, R, k, o) { var e = eOut(seg(k, 0.1, 1)); crouch(P, R, 0.55 * (1 - e) + bell(k, 0, 0.15) * 0.4); R.y += 0.55 * e * (o.h > 1.8 ? 1 : 0.4); P.armA[2] += 2.8 * e; P.armB[2] -= 2.8 * e; }},
    gkstay: {d: 0.5, f: function (m, P, R, k) { var e = eOut(k); crouch(P, R, 0.55 + 0.2 * e); P.armA[2] += 0.5 * e; P.armB[2] -= 0.5 * e; P.armA[0] -= 1.2 * e; P.armB[0] -= 1.2 * e; }},
    hold: {d: 1e9, f: function (m, P, R) { P.armA[0] -= 1.5; P.armB[0] -= 1.5; P.foreA[0] -= 0.9; P.foreB[0] -= 0.9; P.armA[2] -= 0.2; P.armB[2] += 0.2; P.spine[0] += 0.25; }},
    getup: {d: 0.9, f: function (m, P, R, k, o) { var dir = o.dir || 1, e = 1 - eOut(k); R.piv = [0, 0.95, 0]; R.rz -= dir * 1.55 * e; R.ox += dir * (o.reach || 1.6) * 0.65; R.y -= 0.7 * e; crouch(P, R, 0.6 * (1 - e) * bell(k, 0.4, 1)); }},
    fetchnet: {d: 2.0, f: function (m, P, R, k) { var e = bell(k, 0, 1); crouch(P, R, e * 0.9); P.spine[0] += 0.6 * e; P.armA[0] -= 1.2 * e; P.armB[0] -= 1.2 * e; P.head[0] += 0.2 * e; }},
    /* barrera */
    wall: {d: 1e9, f: function (m, P, R, k, o) { P.armA[0] -= 0.5; P.armB[0] -= 0.5; P.armA[2] -= 0.35; P.armB[2] += 0.35; P.foreA[0] -= 0.6; P.foreB[0] -= 0.6; P.foreA[1] -= 0.6; P.foreB[1] += 0.6; R.y += Math.sin(m.t * 3 + (o.ph || 0)) * 0.005; }},
    walljump: {d: 0.75, f: function (m, P, R, k, o) { CLIPS.wall.f(m, P, R, k, o); var h = bell(k, 0.12, 0.9); crouch(P, R, bell(k, 0, 0.14) + bell(k, 0.85, 1) * 0.6); R.y += (o.h || 0.45) * h; if (o.turn) R.ry += PI * 0.85 * seg(k, 0.05, 0.3); }},
    wallturn: {d: 0.8, f: function (m, P, R, k, o) { CLIPS.wall.f(m, P, R, k, o); R.ry += 2.4 * seg(k, 0, 0.35) * (1 - seg(k, 0.7, 1)); P.spine[0] += 0.4 * bell(k, 0, 1); }},
    lie: {d: 1e9, f: function (m, P, R) { R.piv = [0, 0.1, 0]; R.rx += PI / 2; R.y += 0.05; P.armA[0] -= 2.8; P.armB[0] -= 2.8; }},
    ouch: {d: 1.2, f: function (m, P, R, k) { var e = bell(k, 0, 1); P.spine[0] += 0.8 * e; P.head[0] += 0.5 * e; R.y -= 0.15 * e; P.armA[0] -= 1.8 * e; P.armB[0] -= 1.8 * e; R.rz += Math.sin(k * 30) * 0.06 * e; }},
    /* árbitro */
    whistle: {d: 1.0, f: function (m, P, R, k) { var e = bell(k, 0, 1); P.armA[0] -= 2.6 * e; P.foreA[0] -= 1.6 * e; P.armA[2] -= 0.3 * e; }},
    point: {d: 1.4, f: function (m, P, R, k, o) { var e = bell(k, 0, 1); P.armB[0] -= 1.5 * e; P.armB[1] += (o.side || 0) * 0.8 * e; }},
    spray: {d: 2.2, f: function (m, P, R, k) { legsRun(P, m.t * 6, 0.25, 0.4); crouch(P, R, 0.35); P.spine[0] += 0.5; P.armB[0] -= 1.1; P.foreB[0] -= 0.2; }},
    feint: {d: 1.0, f: function (m, P, R, k) { legsRun(P, k * 4 * PI, 0.7, 1); CLIPS.kick.f(m, P, R, cl(k * 0.7, 0, 0.45), {type: "laces"}); }}
  };
  Object.keys(CLIPS).forEach(function (n) { if (CLIPS[n].d == null) CLIPS[n].d = 1; });
  /* solo desarrollo (test/gearcheck.js): los bloques de cada ranura, en el marco de su hueso */
  function gearBoxes(o) { var k = JSON.stringify(o); GEAR_BOX = []; delete cache[k]; build(o); var g = GEAR_BOX; GEAR_BOX = null; delete cache[k]; return g; }
  return {Man: Man, CLIPS: CLIPS, build: build, ORDER: ORDER, _dev: {gearBoxes: gearBoxes, BONES: BONES, BY_ID: BY_ID, MIRROR: MIRROR, SC: SC}};
})();
