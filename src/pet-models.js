/* pet-models.js — modelos vóxel de las mascotas (5.6).
   Cada especie se construye por partes rígidas (cuerpo, cabeza, mandíbula, orejas de 2 segmentos,
   cola de 1–4 segmentos, patas con muslo y pie…) con su pivote, en vóxeles de PetStyle.VOXEL.
   - Proporciones chibi y tres tallas por etapa (cría, joven, adulta; la senior canosa).
   - Cara: capa frontal de vóxeles intercambiable con expresiones (y parpadeo).
   - Suciedad: capas de barro por zona y nivel, encima del modelo.
   - Pelaje: variantes por cambio de paleta, nunca modelos duplicados.
   - Anclajes por parte y etapa para los accesorios.
   Todo se genera aquí con primitivas; tools/vox2pet.js permite sustituir partes por modelos .vox. */
var PetModels = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore) return null;
  var VG = VoxCore.VGrid, PAL = PetStyle.PAL, VS = PetStyle.VOXEL, rgb = VoxCore.rgb, mix = VoxCore.mix, shade = VoxCore.shade;
  function R(v) { return Math.round(v); }
  function hs(i, j, k) { var s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); }

  /* ---------- filtros de pelaje (misma idea que los filtros CSS del 2D, aplicados a la paleta) ---------- */
  function filt(col, str) {
    var c = rgb(col).slice(), re = /([a-z-]+)\(([-\d.]+)(deg)?\)/g, mm;
    while ((mm = re.exec(str || ""))) {
      var f = mm[1], v = +mm[2], r = c[0], g = c[1], b = c[2], l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (f === "grayscale") c = [r + (l - r) * v, g + (l - g) * v, b + (l - b) * v];
      else if (f === "brightness") c = [r * v, g * v, b * v];
      else if (f === "contrast") c = [(r - 0.5) * v + 0.5, (g - 0.5) * v + 0.5, (b - 0.5) * v + 0.5];
      else if (f === "sepia") { var sr = 0.393 * r + 0.769 * g + 0.189 * b, sg = 0.349 * r + 0.686 * g + 0.168 * b, sb = 0.272 * r + 0.534 * g + 0.131 * b; c = [r + (sr - r) * v, g + (sg - g) * v, b + (sb - b) * v]; }
      else if (f === "saturate") c = [l + (r - l) * v, l + (g - l) * v, l + (b - l) * v];
      else if (f === "hue-rotate") { var a = v * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
        c = [r * (0.213 + co * 0.787 - si * 0.213) + g * (0.715 - co * 0.715 - si * 0.715) + b * (0.072 - co * 0.072 + si * 0.928),
          r * (0.213 - co * 0.213 + si * 0.143) + g * (0.715 + co * 0.285 + si * 0.14) + b * (0.072 - co * 0.072 - si * 0.283),
          r * (0.213 - co * 0.213 - si * 0.787) + g * (0.715 - co * 0.715 + si * 0.715) + b * (0.072 + co * 0.928 + si * 0.072)]; }
      c = c.map(function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; });
    }
    return c;
  }

  /* ---------- especies (medidas de adulto en vóxeles: cuerpo [ancho, alto, largo], pata [grosor, muslo, pie], cabeza [ancho, alto, fondo]) ---------- */
  var SP = {
    dog: {plan: "quad", c1: PAL.T, c2: "#ecc79c", c3: PAL.t, nose: PAL.K, body: [8, 8, 16], leg: [3, 4, 3], head: [10, 9, 9], snout: [5, 3, 3], ears: "floppy", tail: "wag", belly: 1, sound: "dog"},
    cat: {plan: "quad", c1: PAL.O, c2: "#fff4e6", c3: PAL.o, nose: PAL.M, body: [7, 7, 15], leg: [2, 4, 3], head: [9, 8, 8], snout: [3, 2, 1], ears: "pointy", tail: "long", belly: 1, stripes: 1, sound: "cat"},
    rabbit: {plan: "quad", c1: "#e4e7ec", c2: PAL.W, c3: PAL.M, nose: PAL.M, body: [8, 8, 12], leg: [3, 2, 3], head: [9, 8, 8], snout: [3, 2, 1], ears: "long", tail: "cotton", belly: 1, hop: 1, sound: "rabbit"},
    hamster: {plan: "quad", c1: PAL.O, c2: PAL.W, c3: PAL.M, nose: PAL.M, body: [8, 7, 9], leg: [2, 1, 1], head: [8, 7, 6], snout: [3, 2, 1], ears: "round", tail: "none", belly: 1, cheeks: 1, sound: "squeak"},
    fennec: {plan: "quad", c1: "#e6c48e", c2: PAL.W, c3: "#d39a5a", nose: PAL.K, body: [6, 6, 13], leg: [2, 5, 3], head: [8, 7, 7], snout: [3, 2, 3], ears: "huge", tail: "bushy", belly: 1, sound: "fox"},
    capybara: {plan: "quad", c1: "#946f48", c2: "#7d5c3c", c3: "#5e4430", nose: "#2a201a", body: [10, 10, 18], leg: [3, 3, 2], head: [9, 8, 9], snout: [7, 5, 4], ears: "round", tail: "none", sound: "capy"},
    hedgehog: {plan: "quad", c1: "#d4a072", c2: PAL.S, c3: PAL.t, nose: PAL.K, body: [8, 6, 10], leg: [2, 1, 1], head: [7, 6, 6], snout: [3, 2, 3], ears: "round", tail: "none", spikes: 1, sound: "squeak"},
    iguana: {plan: "quad", c1: PAL.N, c2: "#9fdc86", c3: PAL.n, nose: PAL.n, body: [6, 4, 16], leg: [2, 2, 2], head: [6, 5, 7], snout: [4, 3, 3], ears: "none", tail: "lizard", splay: 1, dorsal: 1, sound: "hiss"},
    turtle: {plan: "turtle", c1: "#86c45e", c2: PAL.n, c3: PAL.N, nose: PAL.n, body: [10, 3, 12], leg: [3, 2, 1], head: [5, 4, 5], snout: [3, 2, 1], ears: "none", tail: "stub", sound: "hiss"},
    macaw: {plan: "bird", c1: PAL.R, c2: PAL.W, c3: PAL.B, c4: PAL.Y, nose: "#ece4d0", body: [7, 10, 7], leg: [1, 3, 1], head: [8, 7, 7], snout: [3, 3, 3], ears: "none", tail: "bird", sound: "bird"},
    python: {plan: "snake", c1: PAL.N, c2: PAL.Y, c3: PAL.n, nose: PAL.n, body: [4, 4, 4], head: [6, 4, 6], ears: "none", tail: "none", sound: "hiss"},
    tarantula: {plan: "spider", c1: "#4a3020", c2: "#7a5236", c3: PAL.R, nose: PAL.K, body: [8, 6, 9], leg: [1, 5, 5], head: [6, 4, 5], ears: "none", tail: "none", sound: "click"},
    fish: {plan: "fish", c1: PAL.B, c2: "#cfe6ff", c3: PAL.b, nose: PAL.b, body: [5, 8, 11], head: [5, 8, 4], ears: "none", tail: "fin", sound: "blub"}
  };
  var BK = [0.72, 0.86, 1, 1], HK = [0.9, 0.95, 1, 1];

  /* ---------- utilidades de construcción ---------- */
  function Part(name, parent, piv) { return {name: name, parent: parent || null, piv: piv || [0, 0, 0], g: new VG()}; }
  /* caja con las aristas biseladas (estilo vóxel redondeado) */
  function rbox(g, x0, y0, z0, x1, y1, z1, col, ch) {
    var cf = typeof col === "function" ? col : null;
    for (var i = x0; i <= x1; i++) for (var j = y0; j <= y1; j++) for (var k = z0; k <= z1; k++) {
      if (ch) { var e = (i === x0 || i === x1 ? 1 : 0) + (j === y0 || j === y1 ? 1 : 0) + (k === z0 || k === z1 ? 1 : 0); if (e >= 2) continue; }
      g.set(i, j, k, cf ? cf(i, j, k) : col);
    }
  }
  function seg(parts, name, parent, piv, fn) { var p = Part(name, parent, piv); fn(p.g); parts[name] = p; return p; }

  /* ---------- cuadrúpedos (y tortuga) ---------- */
  function quad(sp, st, C) {
    var k = BK[st], hk = HK[st], parts = {}, anchors = {};
    var W = Math.max(4, 2 * R(sp.body[0] * k / 2)), H = Math.max(3, R(sp.body[1] * k)), L = Math.max(6, 2 * R(sp.body[2] * k / 2));
    var lw = Math.max(1, R(sp.leg[0] * (0.5 + k * 0.5))), th = Math.max(1, R(sp.leg[1] * k)), ft = Math.max(1, R(sp.leg[2] * k)), legH = th + ft;
    var HW = Math.max(4, 2 * R(sp.head[0] * hk / 2)), HH = Math.max(3, R(sp.head[1] * hk)), HD = Math.max(3, R(sp.head[2] * hk));
    if (sp.plan === "turtle") legH = Math.max(2, legH - 1);
    var bx0 = -W / 2, bx1 = W / 2 - 1, by0 = legH, by1 = legH + H - 1, bz0 = -L / 2, bz1 = L / 2 - 1;
    var bodyCol = function (i, j, kk) {
      if (sp.belly && j <= by0 + 1 && Math.abs(i + 0.5) < W / 2 - 1) return C.c2;
      if (sp.stripes && j >= by1 - 1 && (kk - bz0) % 3 === 0) return C.c3;
      if (sp.spikes) return C.c2;
      return C.c1;
    };
    var body = seg(parts, "body", null, [0, by0 + H / 2, 0], function (g) {
      if (sp.plan === "turtle") {
        rbox(g, bx0 + 1, by0, bz0 + 1, bx1 - 1, by0 + H - 1, bz1 - 1, C.c1, 1);
        /* caparazón: cúpula con placas */
        var cx = -0.5, cz = -0.5, rx = W / 2 + 0.6, rz = L / 2 + 0.6, ry = H + 3;
        g.fill(bx0 - 1, by0 + 1, bz0 - 1, bx1 + 1, by0 + ry, bz1 + 1, function (x, y, z, i, j, kk) {
          var dx = (x - cx - 0.5) / rx, dz = (z - cz - 0.5) / rz, dy = (y - by0 - 1) / ry, d = dx * dx + dz * dz + dy * dy; if (d > 1 || y < by0 + 1.2) return null;
          if (j === by0 + 1) return C.c3;
          return ((Math.floor((i + 20) / 3) + Math.floor((kk + 20) / 3)) % 2) ? C.c2 : mix(C.c2, "#1e5a28", 0.35);
        });
      } else rbox(g, bx0, by0, bz0, bx1, by1, bz1, bodyCol, 1);
      if (sp.spikes) {
        for (var i = bx0; i <= bx1; i++) for (var kk = bz0; kk <= bz1; kk++) {
          var top = by1 + 1, hh = hs(i, 3, kk);
          if (kk > bz1 - 1) continue;
          g.set(i, top, kk, hh < 0.5 ? C.c3 : PAL.T); if (hh < 0.6 && Math.abs(i + 0.5) < W / 2 - 1) g.set(i, top + 1, kk, C.c3);
          if (i === bx0 || i === bx1) for (var j = by0 + 2; j <= by1; j++) g.set(i + (i === bx0 ? -1 : 1), j, kk, hs(i, j, kk) < 0.5 ? C.c3 : PAL.T);
        }
        for (i = bx0; i <= bx1; i++) for (var j2 = by0 + 2; j2 <= by1 + 1; j2++) g.set(i, j2, bz0 - 1, hs(i, j2, 9) < 0.5 ? C.c3 : PAL.T);
      }
      if (sp.dorsal) for (var z = bz0 + 1; z <= bz1 - 1; z += 2) { g.set(-1, by1 + 1, z, C.c3); g.set(0, by1 + 1, z, C.c3); if (z % 4 === 1) { g.set(-1, by1 + 2, z, C.c3); g.set(0, by1 + 2, z, C.c3); } }
    });
    /* cabeza grande (chibi) con hocico; la capa frontal sobre el hocico es la cara intercambiable */
    var hx0 = -HW / 2, hx1 = HW / 2 - 1, hy0, hz0, hz1;
    if (sp.plan === "turtle") { hy0 = by0 + 1; hz0 = bz1 + 1; }
    else if (sp.splay) { hy0 = by0; hz0 = bz1 - 1; }
    else { hy0 = by1 - 2; hz0 = bz1 - R(HD * 0.4); }
    var hy1 = hy0 + HH - 1; hz1 = hz0 + HD - 1;
    var sw = Math.min(HW - 2, R((sp.snout ? sp.snout[0] : 3) * hk)), sh = Math.max(1, R((sp.snout ? sp.snout[1] : 2) * hk)), sl = Math.max(1, R((sp.snout ? sp.snout[2] : 1) * hk));
    sw = sw % 2 ? sw + 1 : sw; if (sw > HW - 2) sw = HW - 2;
    var sy0 = hy0 + 1, sy1 = sy0 + sh - 1, faceY0 = sy1 + 1, faceY1 = hy1 - 1;
    if (faceY1 - faceY0 < 2) { faceY0 = Math.max(hy0 + 1, faceY1 - 2); }
    var face = {x0: hx0 + 1, x1: hx1 - 1, y0: faceY0, y1: faceY1, z: hz1, base: C.c1, muzzle: sp.plan === "quad" && C.c2 !== C.c1 ? C.c2 : null, cheeks: !!sp.cheeks};
    var neckPiv = [0, sp.plan === "turtle" ? hy0 + HH / 2 : hy0 + 1, hz0 + 1];
    var head = seg(parts, "head", "body", neckPiv, function (g) {
      rbox(g, hx0, hy0, hz0, hx1, hy1, hz1, function (i, j, kk) { return sp.belly && j === hy0 && kk >= hz1 - 2 ? C.c2 : C.c1; }, 1);
      if (sp.cheeks) { g.box(hx0 - 1, hy0 + 1, hz1 - 3, hx0 - 1, hy0 + 2, hz1 - 1, C.c2); g.box(hx1 + 1, hy0 + 1, hz1 - 3, hx1 + 1, hy0 + 2, hz1 - 1, C.c2); }
      /* hocico y nariz */
      for (var i = -sw / 2; i <= sw / 2 - 1; i++) for (var j = sy0; j <= sy1; j++) for (var kk = hz1 + 1; kk <= hz1 + sl; kk++) g.set(i, j, kk, sp.plan === "quad" ? C.c2 : C.c1);
      g.set(-1, sy1, hz1 + sl, C.nose); g.set(0, sy1, hz1 + sl, C.nose); if (sw >= 4) g.set(-1, sy1 - 0 >= sy0 ? sy1 : sy0, hz1 + sl, C.nose);
      /* hueco de la cara: la capa frontal sale de PetModels.face() */
      for (i = face.x0; i <= face.x1; i++) for (j = face.y0; j <= face.y1; j++) g.del(i, j, hz1);
    });
    /* mandíbula (abre la boca) con la lengua escondida encima */
    var jawW = Math.max(2, sw - 2);
    seg(parts, "jaw", "head", [0, sy0, hz1 + 1], function (g) {
      for (var i = -jawW / 2; i <= jawW / 2 - 1; i++) for (var kk = hz1 + 1; kk <= hz1 + Math.max(1, sl - (sl > 2 ? 1 : 0)); kk++) g.set(i, sy0 - 1, kk, sp.plan === "quad" ? C.c2 : C.c1);
      g.set(-1, sy0 - 1, hz1 + 1, PAL.M); g.set(0, sy0 - 1, hz1 + 1, PAL.M);
      /* el hocico baja un vóxel al abrir: la fila inferior del hocico pertenece a la mandíbula */
      for (i = -sw / 2; i <= sw / 2 - 1; i++) for (var kk2 = hz1 + 1; kk2 <= hz1 + sl; kk2++) if (sy1 > sy0) { head.g.del(i, sy0, kk2); g.set(i, sy0, kk2, sp.plan === "quad" ? C.c2 : C.c1); }
    });
    /* orejas de dos segmentos */
    var ez = R((hz0 + hz1) / 2) - 1;
    [-1, 1].forEach(function (sd) {
      var nm = sd < 0 ? "L" : "R", xo = sd < 0 ? hx0 : hx1;
      if (sp.ears === "floppy") {
        var x0 = sd < 0 ? hx0 - 2 : hx1 + 1, x1 = x0 + 1, h1 = Math.max(2, R(3 * hk)), h2 = Math.max(2, R(3 * hk));
        seg(parts, "ear" + nm + "1", "head", [x0 + 1, hy1, ez + 1], function (g) { g.box(x0, hy1 - h1 + 1, ez, x1, hy1, ez + 2, C.c3); });
        seg(parts, "ear" + nm + "2", "ear" + nm + "1", [x0 + 1, hy1 - h1 + 1, ez + 1], function (g) { g.box(x0, hy1 - h1 - h2 + 1, ez, x1, hy1 - h1, ez + 2, C.c3); });
      } else if (sp.ears === "pointy" || sp.ears === "huge") {
        var big = sp.ears === "huge", ew = big ? 3 : 2, xa = sd < 0 ? hx0 + (big ? 0 : 1) : hx1 - ew + 1 - (big ? 0 : 1), eh1 = big ? R(3 * hk) + 1 : 2, eh2 = big ? R(3 * hk) : 1;
        seg(parts, "ear" + nm + "1", "head", [xa + ew / 2, hy1 + 1, ez + 1], function (g) { g.box(xa, hy1 + 1, ez, xa + ew - 1, hy1 + eh1, ez + 1, C.c1); g.set(sd < 0 ? xa + 1 : xa + ew - 2, hy1 + 1, ez + 2, PAL.M); if (big) g.box(xa + 1, hy1 + 1, ez + 2, xa + 1, hy1 + eh1 - 1, ez + 2, PAL.M); });
        seg(parts, "ear" + nm + "2", "ear" + nm + "1", [xa + ew / 2, hy1 + eh1 + 1, ez + 1], function (g) { var xb = sd < 0 ? xa : xa + 1; g.box(xb, hy1 + eh1 + 1, ez, xb + Math.max(0, ew - 2), hy1 + eh1 + eh2, ez + 1, big ? C.c1 : C.c3); });
      } else if (sp.ears === "long") {
        var xl = sd < 0 ? -3 : 1, lh = Math.max(3, R(4 * hk));
        seg(parts, "ear" + nm + "1", "head", [xl + 1, hy1 + 1, ez + 1], function (g) { g.box(xl, hy1 + 1, ez, xl + 1, hy1 + lh, ez + 1, C.c1); g.box(xl + (sd < 0 ? 1 : 0), hy1 + 2, ez + 2, xl + (sd < 0 ? 1 : 0), hy1 + lh, ez + 2, C.c3); });
        seg(parts, "ear" + nm + "2", "ear" + nm + "1", [xl + 1, hy1 + lh + 1, ez + 1], function (g) { g.box(xl, hy1 + lh + 1, ez, xl + 1, hy1 + 2 * lh - 1, ez + 1, C.c1); g.box(xl + (sd < 0 ? 1 : 0), hy1 + lh + 1, ez + 2, xl + (sd < 0 ? 1 : 0), hy1 + 2 * lh - 2, ez + 2, C.c3); });
      } else if (sp.ears === "round") {
        var xr = sd < 0 ? hx0 : hx1 - 1;
        seg(parts, "ear" + nm + "1", "head", [xr + 1, hy1 + 1, ez + 1], function (g) { g.box(xr, hy1 + 1, ez, xr + 1, hy1 + 2, ez + 1, sp.cheeks ? C.c3 : C.c1); g.set(sd < 0 ? xr + 1 : xr, hy1 + 1, ez + 2, PAL.M); });
      }
    });
    /* cola por segmentos (rectos; la pose de reposo la levanta) */
    var tz = bz0, ty = sp.plan === "turtle" ? by0 + 1 : by1 - 1, prev = "body", tparts = [];
    var tdef = {wag: [[2, 2, 2], [2, 2, 2], [2, 2, 2], [1, 1, 2]], long: [[2, 2, 3], [2, 2, 3], [2, 2, 3], [2, 2, 2]], bushy: [[3, 3, 3], [4, 4, 3], [4, 4, 3], [3, 3, 2]],
      cotton: [[3, 3, 2]], lizard: [[3, 2, 4], [2, 2, 4], [2, 1, 4], [1, 1, 3]], stub: [[1, 1, 2]]}[sp.tail] || [];
    tdef.forEach(function (d, i) {
      var w = Math.max(1, R(d[0] * (0.6 + 0.4 * k))), hh = Math.max(1, R(d[1] * (0.6 + 0.4 * k))), l = Math.max(1, R(d[2] * k)), nm = "tail" + (i + 1);
      var x0 = -Math.floor(w / 2), y0 = ty - Math.floor(hh / 2), z1 = tz - 1, z0 = z1 - l + 1, piv = [x0 + w / 2, y0 + hh / 2, tz];
      seg(parts, nm, prev, piv, function (g) {
        var col = sp.tail === "cotton" ? PAL.W : sp.tail === "bushy" && i === tdef.length - 1 ? PAL.W : sp.tail === "lizard" && i % 2 ? C.c3 : sp.tail === "long" && i % 2 ? C.c3 : C.c1;
        g.box(x0, y0, z0, x0 + w - 1, y0 + hh - 1, z1, col);
        if (sp.tail === "bushy" && i === tdef.length - 2) g.box(x0, y0, z0, x0 + w - 1, y0 + hh - 1, z0, "#3a2a1a");
      });
      tparts.push(nm); prev = nm; tz = z0;
    });
    /* patas: muslo y pie */
    var lx = W / 2 - lw, zf = bz1 - lw - (sp.plan === "turtle" ? 0 : 1), zb = bz0 + 1;
    [["FL", -1, zf], ["FR", 1, zf], ["BL", -1, zb], ["BR", 1, zb]].forEach(function (Lg) {
      var nm = Lg[0], sd = Lg[1], z0 = Lg[2], x0 = sd < 0 ? -W / 2 + (sp.splay ? -lw : 0) : lx + (sp.splay ? lw : 0), x1 = x0 + lw - 1, cx = x0 + lw / 2, cz = z0 + lw / 2;
      if (sp.hop && nm.charAt(0) === "B") { z0 -= 1; }
      seg(parts, "leg" + nm + "1", "body", [cx, legH + 0.5, cz], function (g) { g.box(x0, ft, z0, x1, legH, z0 + lw - 1, sp.plan === "turtle" ? C.c1 : C.c1); });
      seg(parts, "leg" + nm + "2", "leg" + nm + "1", [cx, ft, cz], function (g) {
        var ext = sp.hop && nm.charAt(0) === "B" ? 2 : (sp.plan === "turtle" ? 0 : 1);
        g.box(x0, 0, z0, x1, ft - 1, z0 + lw - 1 + ext, function (i, j) { return j === 0 && sp.plan !== "turtle" ? C.c2 : C.c1; });
      });
    });
    /* anclajes de accesorios (en vóxeles absolutos de su parte) */
    anchors.head_top = {part: "head", p: [0, hy1 + 1, R((hz0 + hz1) / 2)], w: HW};
    anchors.face = {part: "head", p: [0, R((face.y0 + face.y1) / 2), hz1 + 1], w: HW};
    anchors.neck = {part: "body", p: [0, Math.min(by1, hy0 + 1), Math.min(bz1, hz0 + 1)], w: W};
    anchors.back = {part: "body", p: [0, by1 + 1 + (sp.spikes ? 2 : 0), R(bz0 / 3)], w: W};
    anchors.chest = {part: "body", p: [0, by0 + R(H / 2), bz1 + 1], w: W};
    anchors.tail = tparts.length ? {part: tparts[tparts.length - 1], p: [0, ty, tz], w: 2} : null;
    ["FL", "FR", "BL", "BR"].forEach(function (n) { var pp = parts["leg" + n + "2"]; anchors["foot_" + n] = {part: "leg" + n + "2", p: [pp.piv[0], 0, pp.piv[2]], w: lw}; });
    return {parts: parts, anchors: anchors, face: face, plan: sp.plan, legH: legH, height: (hy1 + 1) * VS, length: L * VS, tail: tparts, dims: {W: W, H: H, L: L, HW: HW, HH: HH, HD: HD, by0: by0, by1: by1, bz0: bz0, bz1: bz1, hy0: hy0, hy1: hy1, hz0: hz0, hz1: hz1, lw: lw}};
  }

  /* ---------- ave (guacamayo): erguida, alas de dos segmentos, cola larga ---------- */
  function bird(sp, st, C) {
    var k = BK[st], hk = HK[st], parts = {}, anchors = {};
    var W = 2 * R(sp.body[0] * k / 2), H = R(sp.body[1] * k), D = 2 * R(sp.body[2] * k / 2), lh = Math.max(2, R(sp.leg[1] * k));
    var by0 = lh, by1 = by0 + H - 1, bx0 = -W / 2, bx1 = W / 2 - 1, bz0 = -D / 2, bz1 = D / 2 - 1;
    seg(parts, "body", null, [0, by0 + H / 2, 0], function (g) { rbox(g, bx0, by0, bz0, bx1, by1, bz1, function (i, j, kk) { return kk >= bz1 - 1 && j < by0 + H * 0.45 ? C.c4 : C.c1; }, 1); });
    var HW = 2 * R(sp.head[0] * hk / 2), HH = R(sp.head[1] * hk), HD = R(sp.head[2] * hk), hy0 = by1 - 1, hy1 = hy0 + HH - 1, hz0 = bz0 + 1, hz1 = hz0 + HD - 1, hx0 = -HW / 2, hx1 = HW / 2 - 1;
    var face = {x0: hx0 + 1, x1: hx1 - 1, y0: hy0 + 3, y1: hy1 - 1, z: hz1, base: C.c2, muzzle: null};
    var head = seg(parts, "head", "body", [0, hy0 + 1, R((hz0 + hz1) / 2)], function (g) {
      rbox(g, hx0, hy0, hz0, hx1, hy1, hz1, C.c1, 1);
      g.box(hx0 + 1, hy0 + 2, hz1, hx1 - 1, hy1 - 1, hz1, C.c2);
      /* pico curvo */
      g.box(-1, hy0 + 2, hz1 + 1, 0, hy0 + 3, hz1 + 2, C.nose); g.box(-1, hy0 + 1, hz1 + 2, 0, hy0 + 2, hz1 + 3, C.nose); g.set(-1, hy0, hz1 + 3, PAL.K); g.set(0, hy0, hz1 + 3, PAL.K);
      for (var i = face.x0; i <= face.x1; i++) for (var j = face.y0; j <= face.y1; j++) g.del(i, j, hz1);
    });
    seg(parts, "jaw", "head", [0, hy0 + 1, hz1 + 1], function (g) { g.box(-1, hy0, hz1 + 1, 0, hy0, hz1 + 2, PAL.K); });
    [-1, 1].forEach(function (sd) {
      var nm = sd < 0 ? "L" : "R", x0 = sd < 0 ? bx0 - 1 : bx1 + 1;
      seg(parts, "wing" + nm + "1", "body", [x0, by1 - 1, 0], function (g) { g.box(x0, by0 + 3, bz0, x0, by1 - 1, bz1 - 1, function (i, j) { return j < by0 + 5 ? C.c4 : C.c3; }); });
      seg(parts, "wing" + nm + "2", "wing" + nm + "1", [x0, by0 + 3, 0], function (g) { g.box(x0, by0, bz0 - 1, x0, by0 + 2, bz1 - 2, C.c3); });
    });
    var prev = "body", ty = by0 + 1, tz = bz0;
    [[3, 1, 3], [2, 1, 4], [2, 1, 4]].forEach(function (d, i) {
      var nm = "tail" + (i + 1), l = R(d[2] * k), z1 = tz - 1, z0 = z1 - l + 1;
      seg(parts, nm, prev, [0, ty, tz], function (g) { g.box(-Math.floor(d[0] / 2), ty - 1, z0, -Math.floor(d[0] / 2) + d[0] - 1, ty - 1 + d[1] - 1, z1, i % 2 ? C.c3 : C.c1); });
      prev = nm; tz = z0; ty -= 1;
    });
    [["FL", -2], ["FR", 1]].forEach(function (Lg) {
      seg(parts, "leg" + Lg[0] + "1", "body", [Lg[1] + 0.5, lh, 0.5], function (g) { g.box(Lg[1], 1, 0, Lg[1], lh, 0, PAL.g); });
      seg(parts, "leg" + Lg[0] + "2", "leg" + Lg[0] + "1", [Lg[1] + 0.5, 1, 0.5], function (g) { g.box(Lg[1], 0, 0, Lg[1], 0, 1, PAL.g); g.set(Lg[1], 0, -1, PAL.g); });
    });
    anchors.head_top = {part: "head", p: [0, hy1 + 1, R((hz0 + hz1) / 2)], w: HW};
    anchors.face = {part: "head", p: [0, R((face.y0 + face.y1) / 2), hz1 + 1], w: HW};
    anchors.neck = {part: "body", p: [0, by1, bz1], w: W};
    anchors.back = {part: "body", p: [0, by1 - 1, bz0 - 1], w: W};
    anchors.chest = {part: "body", p: [0, by0 + R(H / 2), bz1 + 1], w: W};
    anchors.tail = {part: "tail3", p: [0, ty, tz], w: 2};
    anchors.foot_FL = {part: "legFL2", p: [-1.5, 0, 0.5], w: 1}; anchors.foot_FR = {part: "legFR2", p: [1.5, 0, 0.5], w: 1};
    return {parts: parts, anchors: anchors, face: face, plan: "bird", legH: lh, height: (hy1 + 1) * VS, length: D * VS, tail: ["tail1", "tail2", "tail3"], dims: {W: W, H: H, L: D, HW: HW, HH: HH, HD: HD, by0: by0, by1: by1, bz0: bz0, bz1: bz1, hy0: hy0, hy1: hy1, hz0: hz0, hz1: hz1, lw: 1}};
  }

  /* ---------- serpiente: cadena de segmentos detrás de la cabeza ---------- */
  function snake(sp, st, C) {
    var k = BK[st], parts = {}, anchors = {}, n = 10, s0 = Math.max(3, R(sp.body[0] * k)), seglen = 3;
    var HW = 2 * R(sp.head[0] * (0.7 + 0.3 * k) / 2), HH = Math.max(3, R(sp.head[1] * (0.7 + 0.3 * k))), HD = R(sp.head[2] * (0.7 + 0.3 * k));
    seg(parts, "body", null, [0, s0 / 2, 0], function (g) { rbox(g, -s0 / 2, 0, -seglen + 1, s0 / 2 - 1, s0 - 1, 1, function (i, j) { return j === 0 ? C.c2 : C.c1; }, 0); });
    var prev = "body", z = -seglen + 1;
    for (var i = 1; i < n; i++) {
      var w = Math.max(2, R(s0 * (1 - i / (n + 4)))), nm = "seg" + i;
      (function (w, z, i) { seg(parts, nm, prev, [0, w / 2, z], function (g) { g.box(-Math.floor(w / 2), 0, z - seglen, -Math.floor(w / 2) + w - 1, w - 1, z - 1, function (a, j, kk) { return j === 0 ? C.c2 : (Math.floor((kk + 100) / 2) % 2 ? C.c1 : C.c3); }); }); })(w, z, i);
      prev = nm; z -= seglen;
    }
    var hy0 = 0, hy1 = HH - 1, hz0 = 2, hz1 = hz0 + HD - 1, hx0 = -HW / 2, hx1 = HW / 2 - 1;
    var face = {x0: hx0 + 1, x1: hx1 - 1, y0: 1, y1: hy1, z: hz1, base: C.c1, muzzle: null};
    seg(parts, "head", "body", [0, HH / 2, 1], function (g) {
      rbox(g, hx0, hy0, hz0, hx1, hy1, hz1, function (a, j) { return j === 0 ? C.c2 : C.c1; }, 1);
      for (var a = face.x0; a <= face.x1; a++) for (var j = face.y0; j <= face.y1; j++) g.del(a, j, hz1);
    });
    seg(parts, "jaw", "head", [0, 0.5, hz1 + 1], function (g) { g.set(0, 0, hz1 + 1, PAL.R); g.set(0, 0, hz1 + 2, PAL.R); g.set(-1, 0, hz1 + 3, PAL.R); g.set(1, 0, hz1 + 3, PAL.R); });
    anchors.head_top = {part: "head", p: [0, hy1 + 1, R((hz0 + hz1) / 2)], w: HW};
    anchors.face = {part: "head", p: [0, R(HH / 2), hz1 + 1], w: HW};
    anchors.neck = {part: "body", p: [0, s0 - 1, 0], w: s0};
    anchors.back = {part: "seg3", p: [0, s0, -11], w: s0};
    anchors.chest = {part: "body", p: [0, s0 / 2, 2], w: s0};
    anchors.tail = {part: "seg" + (n - 1), p: [0, 1, z], w: 2};
    return {parts: parts, anchors: anchors, face: face, plan: "snake", legH: 0, height: HH * VS, length: (n * seglen + HD) * VS, segs: n - 1, tail: [], dims: {W: s0, H: s0, L: n * seglen, HW: HW, HH: HH, HD: HD, hy1: hy1, hz1: hz1, lw: 1}};
  }

  /* ---------- tarántula: cuerpo doble y 8 patas de dos segmentos ---------- */
  function spider(sp, st, C) {
    var k = BK[st], parts = {}, anchors = {}, W = 2 * R(sp.body[0] * k / 2), H = R(sp.body[1] * k), L = R(sp.body[2] * k), lh = Math.max(3, R(sp.leg[1] * k));
    var y0 = lh;
    seg(parts, "body", null, [0, y0 + H / 2, 0], function (g) {
      rbox(g, -W / 2, y0, -L, W / 2 - 1, y0 + H - 1, -1, function (i, j, kk) { return hs(i, j, kk) < 0.25 ? C.c2 : C.c1; }, 1);
      rbox(g, -W / 2 + 1, y0 + 1, 0, W / 2 - 2, y0 + H - 2, R(L * 0.6), C.c2, 1);
    });
    var hz1 = R(L * 0.6), face = {x0: -W / 2 + 2, x1: W / 2 - 3, y0: y0 + 2, y1: y0 + H - 3, z: hz1, base: C.c2, muzzle: null, spider: 1};
    seg(parts, "head", "body", [0, y0 + H / 2, 0], function (g) { for (var i = face.x0; i <= face.x1; i++) for (var j = face.y0; j <= face.y1; j++) g.set(i, j, hz1 - 1, C.c2); });
    seg(parts, "jaw", "head", [0, y0 + 1, hz1], function (g) { g.set(-1, y0 + 1, hz1 + 1, PAL.K); g.set(0, y0 + 1, hz1 + 1, PAL.K); });
    for (var i = 0; i < 8; i++) {
      (function (i) {
        var sd = i < 4 ? -1 : 1, q = i % 4, z = R(L * 0.5) - q * 2 - 1, x0 = sd < 0 ? -W / 2 + 1 : W / 2 - 2, nm = "leg" + i;
        seg(parts, nm + "1", "body", [x0 + 0.5, y0 + 1, z + 0.5], function (g) { for (var t = 1; t <= 4; t++) g.set(x0 + sd * t, y0 + 1 + (t < 3 ? t : 2), z, C.c1); });
        seg(parts, nm + "2", nm + "1", [x0 + sd * 4 + 0.5, y0 + 3, z + 0.5], function (g) { for (var t = 0; t <= lh; t++) g.set(x0 + sd * (5 + (t < 2 ? 0 : 1)), y0 + 3 - t - 1 < 0 ? 0 : y0 + 3 - t - 1, z, t === lh ? C.c2 : C.c1); });
      })(i);
    }
    anchors.head_top = {part: "body", p: [0, y0 + H, -R(L / 2)], w: W};
    anchors.face = {part: "head", p: [0, y0 + R(H / 2), hz1], w: W};
    anchors.neck = {part: "body", p: [0, y0 + H - 1, 0], w: W};
    anchors.back = {part: "body", p: [0, y0 + H, -R(L / 2)], w: W};
    anchors.chest = {part: "body", p: [0, y0 + 1, hz1], w: W};
    return {parts: parts, anchors: anchors, face: face, plan: "spider", legH: lh, height: (y0 + H) * VS, length: L * 1.6 * VS, tail: [], dims: {W: W, H: H, L: L, HW: W, HH: H, HD: L, lw: 1}};
  }

  /* ---------- pez: cuerpo en gota, cola en abanico y aletas ---------- */
  function fish(sp, st, C) {
    var k = BK[st], parts = {}, anchors = {}, W = Math.max(3, R(sp.body[0] * k)), H = Math.max(5, R(sp.body[1] * k)), L = Math.max(7, R(sp.body[2] * k));
    var cy = R(H / 2);
    seg(parts, "body", null, [0, cy, 0], function (g) {
      g.fill(-W, 0, -L / 2, W, H, L / 2, function (x, y, z, i, j, kk) {
        var t = (z) / (L / 2), f = t >= 0 ? Math.sqrt(Math.max(0, 1 - t * t)) : 0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - t * t));
        var ex = x / (W / 2 * f + 0.01), ey = (y - cy) / (H / 2 * f + 0.01); if (ex * ex + ey * ey > 1) return null;
        if (C.rings) { var dz = Math.abs(t - 0.4), dz2 = Math.abs(t + 0.15); if (dz < 0.12 || dz2 < 0.12) return PAL.W; if (dz < 0.2 || dz2 < 0.2) return PAL.K; return C.c1; }
        return ey > 0.55 ? C.c3 : ey < -0.4 ? C.c2 : ((i + kk) % 2 === 0 && (j + kk) % 2 === 0 ? mix(C.c1, "#ffffff", 0.18) : C.c1);
      });
      for (var z = -1; z <= 2; z++) g.set(-0, H, z, C.c3); g.set(0, H + 1, 0, C.c3);
    });
    var hz1 = R(L / 2) - 1, face = {x0: -1, x1: 0, y0: cy - 1, y1: cy + 1, z: hz1, base: C.c1, muzzle: null, fish: 1};
    seg(parts, "head", "body", [0, cy, R(L / 4)], function () {});
    seg(parts, "jaw", "head", [0, cy - 1, hz1 + 1], function (g) { g.set(0, cy - 1, hz1 + 1, mix(C.c1, PAL.K, 0.4)); });
    seg(parts, "tail1", "body", [0, cy, -R(L / 2)], function (g) { g.box(0, cy - 1, -R(L / 2) - 2, 0, cy + 1, -R(L / 2) - 1, C.c3); });
    seg(parts, "tail2", "tail1", [0, cy, -R(L / 2) - 2], function (g) { g.box(0, cy - 3, -R(L / 2) - 4, 0, cy + 3, -R(L / 2) - 3, C.rings ? C.c1 : C.c3); g.set(0, cy - 3, -R(L / 2) - 5, C.c3); g.set(0, cy + 3, -R(L / 2) - 5, C.c3); });
    [-1, 1].forEach(function (sd) { var nm = sd < 0 ? "finL" : "finR", x = sd < 0 ? -R(W / 2) - 1 : R(W / 2); seg(parts, nm, "body", [x, cy - 1, 1], function (g) { g.box(x, cy - 2, -1, x, cy - 1, 1, C.c3); }); });
    anchors.head_top = {part: "body", p: [0, H + 1, R(L / 4)], w: W};
    anchors.face = {part: "body", p: [0, cy, hz1 + 1], w: W};
    anchors.neck = {part: "body", p: [0, cy - 1, R(L / 4)], w: W};
    anchors.back = {part: "body", p: [0, H, 0], w: W};
    anchors.chest = {part: "body", p: [0, 1, R(L / 4)], w: W};
    return {parts: parts, anchors: anchors, face: face, plan: "fish", legH: 0, height: H * VS, length: L * VS, tail: ["tail1", "tail2"], dims: {W: W, H: H, L: L, HW: W, HH: H, HD: 3, lw: 1}};
  }

  /* ---------- caras (capa frontal intercambiable) ---------- */
  var EXPR = ["happy", "sad", "surprised", "sleep", "angry", "curious", "excited", "love", "dizzy", "open", "blink", "content"];
  function faceGrid(face, expr) {
    var g = new VG(), w = face.x1 - face.x0 + 1, h = face.y1 - face.y0 + 1, E = PAL.eye, base = rgb(face.base);
    var cells = {};
    function px(x, y, c) { if (x < 0 || y < 0 || x >= w || y >= h) return; cells[x + "," + y] = c; }
    /* ojos: dos de 2 de ancho (3 si la cara es amplia) separados en el centro */
    var ew = w >= 8 ? 2 : 1, gap = w >= 8 ? (w - 2 * ew - 2) : Math.max(1, w - 2 * ew), lx = Math.floor((w - (2 * ew + gap)) / 2), rx = lx + ew + gap, ey = Math.max(0, h - 3), eh = h >= 4 ? 2 : 1;
    if (face.fish) { lx = 0; rx = w - 1; ew = 1; ey = 1; eh = 1; }
    function eye(x0, kind, side) {
      var y0 = ey;
      if (kind === "open" || kind === "content") { for (var i = 0; i < ew; i++) for (var j = 0; j < eh; j++) px(x0 + i, y0 + j, E); if (ew > 1 && eh > 1) px(x0 + (side < 0 ? 0 : ew - 1), y0 + eh - 1, PAL.shine); }
      else if (kind === "blink" || kind === "sleep") { for (var i2 = 0; i2 < ew; i2++) px(x0 + i2, y0, E); }
      else if (kind === "happy") { px(x0, y0, E); px(x0 + ew - 1, y0, E); if (ew > 1) { px(x0, y0, E); px(x0 + 1, y0 + 1, E); px(x0 + (side < 0 ? 1 : 0), y0 + 1, E); } else px(x0, y0 + 1, E); }
      else if (kind === "sad") { for (var i3 = 0; i3 < ew; i3++) px(x0 + i3, y0, E); px(side < 0 ? x0 : x0 + ew - 1, y0 + 1, E); }
      else if (kind === "surprised") { for (var i4 = -0; i4 < ew; i4++) for (var j4 = 0; j4 < eh; j4++) px(x0 + i4, y0 + j4, E); px(x0 + (side < 0 ? 0 : ew - 1), y0 + eh, E); if (ew > 1) px(x0 + (side < 0 ? 1 : 0), y0 + eh - 1, PAL.shine); }
      else if (kind === "angry") { for (var i5 = 0; i5 < ew; i5++) px(x0 + i5, y0, E); px(side < 0 ? x0 + ew - 1 : x0, y0 + 1, E); px(side < 0 ? x0 + ew - 1 : x0, y0 + 2, E); }
      else if (kind === "love") { px(x0, y0 + 1, PAL.R); px(x0 + ew - 1, y0 + 1, PAL.R); px(x0, y0, PAL.R); px(x0 + ew - 1, y0, PAL.R); }
      else if (kind === "dizzy") { px(x0, y0, E); px(x0 + ew - 1, y0 + eh - 1, E); px(x0 + ew - 1, y0, E); px(x0, y0 + eh - 1, E); }
      else if (kind === "excited") { for (var i6 = 0; i6 < ew; i6++) for (var j6 = 0; j6 < eh; j6++) px(x0 + i6, y0 + j6, E); px(x0, y0 + eh - 1, PAL.shine); px(x0 + ew - 1, y0, PAL.shine); }
    }
    var L = expr, Rk = expr;
    if (expr === "curious") { L = "open"; Rk = "surprised"; }
    eye(lx, L, -1); eye(rx, Rk, 1);
    if (face.spider) { px(lx, ey, PAL.R); px(rx, ey, PAL.R); px(lx + 1, ey + 1, PAL.R); px(rx - 1, ey + 1, PAL.R); }
    if ((expr === "happy" || expr === "love" || expr === "excited" || expr === "content") && h >= 3 && !face.fish && !face.spider) { px(lx - 1, ey - 1, PAL.blush); px(rx + ew, ey - 1, PAL.blush); }
    for (var x = 0; x < w; x++) for (var y = 0; y < h; y++) {
      var c = cells[x + "," + y];
      var bc = face.muzzle && y === 0 ? rgb(face.muzzle) : base;
      g.set(face.x0 + x, face.y0 + y, face.z, c ? c : bc);
    }
    return g;
  }

  /* ---------- suciedad: manchas de barro sobre la superficie, por parte y nivel (1..3) ---------- */
  function dirtGrid(part, level) {
    var g = new VG(), thr = [0, 0.12, 0.26, 0.42][level] || 0, src = part.g;
    src.each(function (i, j, k) {
      var up = !src.get(i, j + 1, k), side = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) { return !src.get(i + d[0], j, k + d[1]); });
      if (hs(i, j, k) < thr) {
        if (up && j > 0) g.set(i, j + 1, k, hs(i, k, j) < 0.5 ? PAL.mud : PAL.mud2);
        else if (side.length && j <= 4) { var d = side[0]; g.set(i + d[0], j, k + d[1], PAL.mud); }
      }
    });
    return g;
  }

  /* ---------- montaje: especie + etapa + pelaje → mallas por parte ---------- */
  var cache = {};
  function colorsFor(sp, col) {
    var f = col && col !== "nat" && col !== "rainbow" && typeof petColDef === "function" ? petColDef(col)[2] : "";
    var C = {c1: rgb(sp.c1), c2: rgb(sp.c2), c3: rgb(sp.c3), c4: rgb(sp.c4 || sp.c1), nose: rgb(sp.nose), rings: false};
    if (f) { C.c1 = filt(C.c1, f); C.c2 = filt(C.c2, f); C.c3 = filt(C.c3, f); C.c4 = filt(C.c4, f); }
    return C;
  }
  function specKey(o) { return [o.k, o.stage, o.col || "nat", o.ico || ""].join("|"); }
  function build(o) {
    var key = specKey(o); if (cache[key]) return cache[key];
    var sp = SP[o.k] || SP.dog, C = colorsFor(sp, o.col), st = o.stage || 0;
    if (o.k === "fish") { var ic = String(o.ico || "").replace(/️/g, ""); if (ic === "🐠") { C.c1 = rgb(PAL.O); C.c3 = rgb("#e8731a"); C.rings = true; } else if (ic === "🐡") { C.c1 = rgb(PAL.Y); C.c2 = rgb("#ffe98a"); C.c3 = rgb(PAL.y); } }
    if (o.k === "dog" && String(o.ico || "").indexOf("🦮") >= 0) { C.c1 = rgb(PAL.Y); C.c2 = rgb("#fff0c0"); C.c3 = rgb(PAL.y); }
    if (st === 3) C.c2 = mix(C.c2, "#ffffff", 0.35);
    var M = sp.plan === "bird" ? bird(sp, st, C) : sp.plan === "snake" ? snake(sp, st, C) : sp.plan === "spider" ? spider(sp, st, C) : sp.plan === "fish" ? fish(sp, st, C) : quad(sp, st, C);
    M.k = o.k; M.sp = sp; M.C = C; M.stage = st;
    M.facePart = M.anchors.face && M.parts[M.anchors.face.part] ? M.anchors.face.part : M.parts.head ? "head" : "body";
    /* mallas locales por parte (vértices relativos al pivote, en metros) y cajas para tocar */
    M.mesh = {}; M.bb = {}; M.order = [];
    Object.keys(M.parts).forEach(function (n) {
      var p = M.parts[n]; M.order.push(n);
      M.mesh[n] = VoxCore.meshArray(p.g, VS, p.piv);
      var b = p.g.n ? p.g.bbox() : [0, 0, 0, 0, 0, 0];
      M.bb[n] = [(b[0] - p.piv[0]) * VS, (b[1] - p.piv[1]) * VS, (b[2] - p.piv[2]) * VS, (b[3] + 1 - p.piv[0]) * VS, (b[4] + 1 - p.piv[1]) * VS, (b[5] + 1 - p.piv[2]) * VS];
    });
    /* orden padre → hijo para componer matrices */
    var done = {}, ord = [];
    function add(n) { if (done[n]) return; var p = M.parts[n]; if (p.parent && M.parts[p.parent]) add(p.parent); done[n] = 1; ord.push(n); }
    M.order.forEach(add); M.order = ord;
    /* caras y suciedad bajo demanda (caché) */
    var faces = {}, dirt = {};
    M.faceMesh = function (expr) {
      if (!M.face) return null;
      if (!faces[expr]) faces[expr] = VoxCore.meshArray(faceGrid(M.face, expr), VS, M.parts[M.facePart].piv);
      return faces[expr];
    };
    M.dirtMesh = function (n, lv) {
      var key2 = n + lv; if (dirt[key2] !== undefined) return dirt[key2];
      var p = M.parts[n]; if (!p || !lv) return (dirt[key2] = null);
      var g = dirtGrid(p, lv); dirt[key2] = g.n ? VoxCore.meshArray(g, VS, p.piv) : null; return dirt[key2];
    };
    cache[key] = M;
    return M;
  }
  function species(k) { return SP[k] || null; }
  return {build: build, species: species, EXPR: EXPR, filt: filt, SP: SP, VS: VS, rbox: rbox, hs: hs, faceGrid: faceGrid};
})();
