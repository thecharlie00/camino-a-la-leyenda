/* pet-props.js — accesorios montados sobre la mascota, objetos y escenarios en vóxeles (5.6).
   - acc(): convierte la entrada de PET_ACC2 en piezas hijas de las partes de la mascota (heredan sus
     animaciones), alineadas a su rejilla. Las prendas que cubren varias partes se reparten por piezas;
     las partes sueltas (bufanda, capa, lazos) son cadenas de segmentos con muelle.
   - prop(): objetos (pelota, comedero, cama, bañera…) y decoración.
   - scene(): el rincón de la zona Yo, paseos, concursos, tienda y vestidor (vóxel de 4 cm, como el partido). */
var PetProps = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore || typeof PetModels === "undefined" || !PetModels) return null;
  var VG = VoxCore.VGrid, PAL = PetStyle.PAL, VS = PetStyle.VOXEL, VB = PetStyle.VOXEL_SIM, rgb = VoxCore.rgb, mix = VoxCore.mix, hs = PetModels.hs;
  function col(c, T) {
    if (Array.isArray(c)) return c;
    if (c === "T1") return rgb(T[0]); if (c === "T2") return rgb(T[1]);
    if (typeof c === "string" && c.length <= 2 && PAL[c]) return rgb(PAL[c]);
    return rgb(c);
  }
  /* tipografía pixel 3×5 (cifras del partido: 2, 5 y 8 inconfundibles) y letras para el nombre */
  var FONT = {A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011",
    H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101",
    O: "010101101101010", P: "110101110100100", Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111",
    V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111"};
  function glyph(ch) {
    var D = VoxCore.core.DIGITS;
    if (/[0-9]/.test(ch)) return D[+ch];
    ch = ch.toUpperCase().normalize ? ch.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : ch.toUpperCase();
    return FONT[ch] || null;
  }

  /* ---------- accesorios ---------- */
  var SLOT_ANCHOR = {h: "head_top", f: "face", n: "neck", k: "back", l: "tail"};
  function shellAround(src, g, opt) {
    /* capa de un vóxel por fuera de una parte (prendas) dentro de una región */
    opt = opt || {};
    src.each(function (i, j, k) {
      if (opt.minY != null && j < opt.minY) return; if (opt.maxY != null && j > opt.maxY) return;
      if (opt.minZ != null && k < opt.minZ) return; if (opt.maxZ != null && k > opt.maxZ) return;
      var N = opt.noUp ? [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]] : [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]];
      if (opt.bottom) N.push([0, -1, 0]);
      for (var n = 0; n < N.length; n++) {
        var x = i + N[n][0], y = j + N[n][1], z = k + N[n][2];
        if (src.get(x, y, z) || g.get(x, y, z)) continue;
        if (opt.only && !opt.only(x, y, z)) continue;
        g.set(x, y, z, opt.color(x, y, z));
      }
    });
  }
  function piece(M, partName, g, extra) {
    var P = M.parts[partName]; if (!P || !g.n) return null;
    var o = {parent: partName, verts: VoxCore.meshArray(g, VS, P.piv)};
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  /* cadena colgante (bufanda, capa): segmentos con su pivote, hijos uno de otro */
  function chain(M, parentName, start, segs, w, d, colFn, dirZ) {
    var out = [], P = M.parts[parentName]; if (!P) return out;
    var y = start[1], z = start[2], prev = null;
    for (var s = 0; s < segs.length; s++) {
      var g = new VG(), len = segs[s];
      for (var t = 0; t < len; t++) for (var x = -Math.floor(w / 2); x < Math.ceil(w / 2); x++) for (var q = 0; q < d; q++) g.set(start[0] + x, y - t, z + q * (dirZ || 1), colFn(s, t, x));
      var piv = [start[0], y + 0.5, z + 0.5];
      out.push({parent: prev === null ? parentName : null, chainParent: prev, piv: piv, g: g, dangle: true});
      prev = out.length - 1; y -= len;
    }
    /* mallas relativas al pivote de cada segmento */
    out.forEach(function (o) { o.verts = VoxCore.meshArray(o.g, VS, o.piv); o.pivAbs = o.piv; delete o.g; });
    return out;
  }
  function acc(item, M, T) {
    T = T || PetStyle.teamColors();
    var out = [], a, k;
    if (!item) return out;
    var rec = item.rec;
    if (rec && SLOT_ANCHOR[item.s]) {
      a = M.anchors[SLOT_ANCHOR[item.s]]; if (!a) return out;
      k = Math.max(0.55, Math.min(1.4, (a.w || 10) / 10));
      var g = new VG();
      rec.forEach(function (r) {
        var x0 = Math.round(r[1] * k), y0 = Math.round(r[2] * k), z0 = Math.round(r[3] * k), x1 = Math.round(r[4] * k), y1 = Math.round(r[5] * k), z1 = Math.round(r[6] * k), c = col(r[7], T), fl = r[8];
        if (r[0] === "box") for (var i = x0; i <= x1; i++) for (var j = y0; j <= y1; j++) for (var q = z0; q <= z1; q++) {
          if (fl === "ring" && !(i === x0 || i === x1 || q === z0 || q === z1)) continue;
          if (fl === "beads" && (!(i === x0 || i === x1 || q === z0 || q === z1) || (i + q) % 2)) continue;
          if (fl === "frame" && !(i === x0 || i === x1 || j === y0 || j === y1)) continue;
          if (fl === "shell" && !(i === x0 || i === x1 || j === y1 || q === z0 || q === z1)) continue;
          if (fl === "net" && (i + j) % 2) continue;
          g.set(a.p[0] + i, a.p[1] + j, a.p[2] + q, c, item.glow ? VoxCore.MAT.GLOSS : 0);
        }
      });
      /* cara: los marcos se colocan por delante de la capa de la cara; cuello: el anillo rodea al cuerpo/cabeza */
      var pc = piece(M, a.part, g, {glow: item.glow}); if (pc) out.push(pc);
      return out;
    }
    var gen = item.gen, B = M.parts.body, d = M.dims;
    if (!B) return out;
    if (gen === "jersey" || gen === "bib" || gen === "vest" || gen === "sash") {
      var C1 = item.colors ? rgb(item.colors[0]) : col("T1", T), C2 = item.colors ? rgb(item.colors[1]) : col("T2", T);
      if (gen === "bib") { C1 = rgb("#d6f22e"); C2 = rgb("#9bb81c"); }
      if (gen === "vest") { C1 = rgb("#e8763a"); C2 = rgb("#b5552a"); }
      var gj = new VG(), zf = d.bz1 != null ? d.bz1 : 99, zb = d.bz0 != null ? d.bz0 : -99, top = d.by1 != null ? d.by1 : 99;
      shellAround(B.g, gj, {minY: (d.by0 || 0) + (gen === "jersey" ? 0 : 2), minZ: zb + 2, maxZ: zf - 1, color: function (x, y, z) {
        if (gen === "vest") return (x + y + z) % 2 ? C1 : C2;
        if (gen === "bib") return (x + z) % 3 === 0 ? C2 : C1;
        if (gen === "sash") return null;
        return z === zf - 1 || z === zb + 2 ? C2 : C1;
      }});
      if (gen === "sash") { gj = new VG(); shellAround(B.g, gj, {minY: d.by0, color: function (x, y, z) { return Math.abs((z - zb) - (y - d.by0) * 1.2 - (x > 0 ? 3 : 0)) < 1.5 ? rgb(PAL.Y) : null; }}); var g2 = new VG(); gj.each(function (i, j, q, v) { if (v) g2.setP(i, j, q, v); }); gj = g2; }
      if (gen === "jersey") {
        /* dorsal en el lomo y nombre en el costado, con la tipografía pixel */
        var num = String(item.num != null ? item.num : (function () { try { return lifeOf().num || 10; } catch (e) { return 10; } })()).slice(0, 2);
        var nw = num.length * 4 - 1, zc = Math.round((zf + zb) / 2), x0n = -Math.floor(nw / 2);
        for (var c = 0; c < num.length; c++) { var gl = glyph(num.charAt(c)); if (!gl) continue;
          for (var r = 0; r < 5; r++) for (var cc = 0; cc < 3; cc++) if (gl.charAt(r * 3 + cc) === "1") { var gx = x0n + c * 4 + cc, gz = zc + 2 - r; if (gj.get(gx, top + 1, gz)) gj.set(gx, top + 1, gz, C2); } }
        var nm = String((item.name || (function () { try { return petOf().nm; } catch (e) { return ""; } })()) || "").slice(0, Math.max(1, Math.floor((zf - zb - 4) / 4)));
        var sx = (d.W != null ? -d.W / 2 : -4) - 1, len = nm.length * 4 - 1, z0n = Math.round((zf + zb) / 2) + Math.floor(len / 2);
        for (var c2 = 0; c2 < nm.length; c2++) { var g3 = glyph(nm.charAt(c2)); if (!g3) continue;
          for (var r2 = 0; r2 < 5; r2++) for (var c3 = 0; c3 < 3; c3++) if (g3.charAt(r2 * 3 + c3) === "1") { var y = top - r2, z = z0n - c2 * 4 - c3; if (gj.get(sx, y, z)) gj.set(sx, y, z, C2); } }
      }
      var pj = piece(M, "body", gj, {glow: item.glow}); if (pj) out.push(pj);
      if (gen === "jersey") ["FL", "FR"].forEach(function (n) { var Lp = M.parts["leg" + n + "1"]; if (!Lp) return; var gs = new VG(), bb = Lp.g.bbox(); shellAround(Lp.g, gs, {minY: bb[4] - 1, noUp: true, color: function () { return C1; }}); var ps = piece(M, "leg" + n + "1", gs); if (ps) out.push(ps); });
      return out;
    }
    if (gen === "scarf") {
      var A = M.anchors.neck, k2 = Math.max(0.55, Math.min(1.4, (A.w || 8) / 10)), gS = new VG(), s1 = item.gold ? rgb(PAL.Y) : col("T1", T), s2 = item.gold ? rgb("#fff4c0") : col("T2", T);
      var X0 = Math.round(-5 * k2), X1 = Math.round(4 * k2), Z0 = Math.round(-4 * k2), Z1 = Math.round(4 * k2);
      for (var i = X0; i <= X1; i++) for (var q = Z0; q <= Z1; q++) for (var j = 0; j <= 1; j++) if (i === X0 || i === X1 || q === Z0 || q === Z1) gS.set(A.p[0] + i, A.p[1] + j, A.p[2] + q, (i + q) % 4 < 2 ? s1 : s2);
      var ps2 = piece(M, A.part, gS); if (ps2) out.push(ps2);
      var off = out.length; chain(M, A.part, [A.p[0] + X1 - 1, A.p[1], A.p[2] + Z1 + 1], [3, 3], 2, 1, function (s, t) { return (s * 3 + t) % 2 ? s1 : s2; }).forEach(function (o) { if (o.chainParent != null) o.chainParent += off; out.push(o); });
      return out;
    }
    if (gen === "cape") {
      var top2 = d.by1 != null ? d.by1 + 1 : 8, zz = (d.bz1 != null ? d.bz1 : 6) - 1, w = Math.max(4, (d.W || 8) + 2);
      chain(M, "body", [0, top2, zz], [3, 4, 4], w, 1, function (s, t, x) { return t === 0 && s === 0 ? rgb(PAL.Y) : (s === 2 && t === 3 ? rgb("#7a1520") : rgb("#c8202f")); }, -1).forEach(function (o) { o.cape = true; out.push(o); });
      return out;
    }
    if (gen === "wings") {
      var top3 = d.by1 != null ? d.by1 : 8;
      [-1, 1].forEach(function (sd) {
        var gw = new VG(), x = sd < 0 ? -2 : 1;
        for (var t = 0; t < 5; t++) for (var y2 = 0; y2 < 4 - Math.floor(t / 2); y2++) gw.set(x + sd * t, top3 + 1 + y2, 0, t === 4 ? rgb("#cfe6ff") : rgb(PAL.W));
        var o = piece(M, "body", gw, {wing: sd, pivAbs: [x, top3 + 1, 0]}); if (o) { o.verts = VoxCore.meshArray(gw, VS, [x, top3 + 1, 0]); o.piv = [x, top3 + 1, 0]; out.push(o); }
      });
      return out;
    }
    if (gen === "boots" || gen === "wrist" || gen === "socks") {
      ["FL", "FR", "BL", "BR"].forEach(function (n) {
        if (gen === "wrist" && n.charAt(0) === "B") return;
        var part = gen === "wrist" ? "leg" + n + "1" : "leg" + n + "2", Lp = M.parts[part]; if (!Lp) return;
        var gb = new VG(), bb = Lp.g.bbox(), c1 = gen === "socks" ? col("T1", T) : rgb(item.c || "#1b1d1f"), c2 = gen === "socks" ? col("T2", T) : rgb(item.c2 || "#ffffff");
        if (gen === "wrist") shellAround(Lp.g, gb, {minY: bb[1], maxY: bb[1], noUp: true, color: function () { return rgb(PAL.W); }});
        else shellAround(Lp.g, gb, {noUp: gen === "socks", maxY: gen === "socks" ? bb[4] : bb[1] + 1, color: function (x, y, z) { return gen === "boots" ? (y === bb[1] && (x + z) % 2 ? c2 : c1) : (y % 2 ? c1 : c2); }});
        var pb = piece(M, part, gb, {glow: item.glow}); if (pb) out.push(pb);
      });
      return out;
    }
    if (gen === "tailbow" || gen === "tailrings") {
      var tails = M.tail || [];
      if (!tails.length) return out;
      if (gen === "tailbow") {
        var tp = M.parts[tails[tails.length - 1]], b2 = tp.g.bbox(), gt = new VG();
        gt.box(b2[0] - 2, b2[4] + 1, b2[5], b2[0] - 1, b2[4] + 2, b2[5], rgb(PAL.M)); gt.box(b2[3] + 1, b2[4] + 1, b2[5], b2[3] + 2, b2[4] + 2, b2[5], rgb(PAL.M)); gt.set(b2[0], b2[4] + 1, b2[5], rgb(PAL.m));
        var pt2 = piece(M, tails[tails.length - 1], gt); if (pt2) out.push(pt2);
      } else tails.forEach(function (tn, i) { var tp3 = M.parts[tn], gr = new VG(), b3 = tp3.g.bbox(), zc2 = Math.round((b3[2] + b3[5]) / 2); shellAround(tp3.g, gr, {minZ: zc2, maxZ: zc2, color: function () { return rgb(["#e2403a", "#f6c83a", "#3a7ad8", "#4cb84a"][i % 4]); }}); var pr = piece(M, tn, gr); if (pr) out.push(pr); });
      return out;
    }
    return out;
  }

  /* ---------- objetos ---------- */
  var propCache = {};
  function prop(id, o) {
    o = o || {};
    var key = id + "|" + JSON.stringify(o); if (propCache[key]) return propCache[key];
    var g = new VG(), T = o.T || PetStyle.teamColors(), vs = VS, piv = [0, 0, 0];
    var W = rgb(PAL.W), K = rgb(PAL.K);
    switch (id) {
      case "ball": g.ell([0, 2.5, 0], [2.6, 2.6, 2.6], function (u) { var D = [[0, 1, 0], [0, -1, 0], [0.89, 0.45, 0], [-0.89, -0.45, 0], [0.28, 0.45, 0.85], [-0.28, -0.45, -0.85], [0.28, 0.45, -0.85], [-0.28, -0.45, 0.85], [-0.72, 0.45, 0.53], [0.72, -0.45, -0.53], [-0.72, 0.45, -0.53], [0.72, -0.45, 0.53]]; for (var i = 0; i < D.length; i++) if (u[0] * D[i][0] + u[1] * D[i][1] + u[2] * D[i][2] > 0.86) return K; return W; }); piv = [0, 2.5, 0]; break;
      case "frisbee": g.fill(-4, 0, -4, 4, 1, 4, function (x, y, z) { var r = Math.hypot(x, z); return r <= 4.2 ? (r > 3.2 ? rgb("#e2403a") : rgb("#f6c83a")) : null; }); piv = [0, 0.5, 0]; break;
      case "rope": g.box(-5, 0, 0, 4, 1, 0, function (i) { return i % 2 ? rgb("#e2403a") : rgb("#f4f4f0"); }); g.box(-6, 0, -1, -5, 1, 1, rgb("#3a7ad8")); g.box(4, 0, -1, 5, 1, 1, rgb("#3a7ad8")); piv = [0, 0.5, 0]; break;
      case "plush": g.ell([0, 3, 0], [3, 3, 3], function (u) { return u[1] > 0.4 ? K : W; }); g.box(-1, 5, 2, 0, 5, 2, K); piv = [0, 3, 0]; break;
      case "bone": g.box(-4, 0, 0, 3, 1, 0, rgb("#f4ead2")); g.box(-5, 0, -1, -4, 2, 1, rgb("#f4ead2")); g.box(3, 0, -1, 4, 2, 1, rgb("#f4ead2")); piv = [0, 1, 0]; break;
      case "cup": g.box(-2, 0, -2, 1, 0, 1, rgb(PAL.y)); g.box(-1, 1, -1, 0, 2, 0, rgb(PAL.Y)); g.box(-3, 3, -3, 2, 6, 2, function (i, j, k) { return (i === -3 || i === 2 || k === -3 || k === 2 || j === 3) ? rgb(PAL.Y) : null; }); g.box(-4, 4, -1, -4, 5, 0, rgb(PAL.Y)); g.box(3, 4, -1, 3, 5, 0, rgb(PAL.Y)); piv = [0, 2, 0]; break;
      case "goldboot": g.box(-2, 0, -4, 1, 1, 3, rgb(PAL.Y)); g.box(-2, 2, -4, 1, 4, -1, rgb(PAL.Y)); g.box(-2, 0, 3, 1, 0, 3, rgb(PAL.y)); piv = [0, 1, 0]; break;
      case "goldglove": g.box(-3, 0, -1, 2, 4, 1, rgb(PAL.Y)); g.box(-3, 5, -1, -3, 6, 1, rgb(PAL.Y)); g.box(-1, 5, -1, -1, 7, 1, rgb(PAL.Y)); g.box(1, 5, -1, 1, 6, 1, rgb(PAL.Y)); g.box(3, 1, -1, 3, 3, 1, rgb(PAL.Y)); piv = [0, 2, 0]; break;
      /* cuidado */
      case "bowl_food": case "bowl_water": {
        var fillc = id === "bowl_food" ? rgb("#b98552") : rgb("#5aa8f0"), lv = o.level == null ? 1 : o.level, rim = id === "bowl_food" ? rgb("#e2403a") : rgb("#3a7ad8");
        g.fill(-6, 0, -6, 6, 3, 6, function (x, y, z, i, j, k) { var r = Math.hypot(x, z); if (r > 6.3) return null; if (r > 5) return rim; if (j === 0) return mix(rim, "#000", 0.25); if (j <= Math.round(lv * 2.4) && r < 5) return id === "bowl_food" ? (hs(i, j, k) < 0.5 ? fillc : mix(fillc, "#5a3a20", 0.3)) : fillc; return null; });
        vs = VS; break;
      }
      case "bed": g.fill(-14, 0, -11, 13, 4, 10, function (x, y, z, i, j, k) { var e = Math.max(Math.abs(x + 0.5) / 14, Math.abs(z + 0.5) / 11); if (e > 1) return null; if (j === 0) return rgb("#6a3494"); if (e > 0.78) return j <= 4 ? rgb("#a05ad0") : null; return j <= 1 ? ((i + k) % 4 < 2 ? rgb("#f4e6ff") : rgb("#e4d0f4")) : null; }); break;
      case "basket": g.fill(-8, 0, -6, 7, 7, 5, function (x, y, z, i, j, k) { if (i > -8 && i < 7 && k > -6 && k < 5 && j > 0) return null; return (i + j) % 2 ? rgb(PAL.wood) : rgb(PAL.wood2); }); g.ell([-3, 7, -1], [2.5, 2.5, 2.5], function () { return rgb("#e2403a"); }); g.box(2, 6, -2, 4, 8, 0, rgb("#f6c83a")); break;
      case "goal": vs = VB; g.box(-7, 0, 0, -7, 7, 0, W); g.box(6, 0, 0, 6, 7, 0, W); g.box(-7, 8, 0, 6, 8, 0, W); for (var gi = -6; gi <= 5; gi++) for (var gj = 0; gj <= 7; gj++) if ((gi + gj) % 2 === 0) g.set(gi, gj, -3, rgb("#d8e0dc")); g.box(-7, 0, -3, -7, 7, -3, rgb("#c0c8c4")); g.box(6, 0, -3, 6, 7, -3, rgb("#c0c8c4")); break;
      case "poster": vs = VB; g.box(-6, 0, 0, 5, 15, 0, function (i, j) { return j > 11 ? col("T2", T) : j < 3 ? col("T2", T) : col("T1", T); }); g.box(-2, 5, 1, 1, 9, 1, function (i, j) { return j === 9 || i === -2 || i === 1 ? col("T2", T) : rgb(PAL.W); }); break;
      case "pennant": vs = VB; g.box(0, 0, 0, 0, 14, 0, rgb(PAL.wood2)); for (var pi = 0; pi < 8; pi++) for (var pj = 0; pj < 6 - Math.floor(pi * 0.7); pj++) g.set(1 + pi, 13 - pj - Math.floor(pi * 0.35), 0, pi % 2 ? col("T1", T) : col("T2", T)); break;
      case "plant": vs = VB; g.box(-3, 0, -3, 2, 4, 2, function (i, j) { return j === 4 ? rgb("#5a3a20") : rgb("#c8653a"); }); g.ell([-0.5, 9, -0.5], [4, 5, 4], function (u) { return u[1] > 0.3 ? rgb("#56c75c") : rgb("#3fae4a"); }); break;
      case "rug": vs = VB; g.fill(-12, 0, -9, 11, 0, 8, function (x, y, z, i, j, k) { var e = Math.hypot((x + 0.5) / 12, (z + 0.5) / 9); if (e > 1) return null; return e > 0.85 ? col("T2", T) : e < 0.35 ? col("T2", T) : col("T1", T); }); break;
      case "lamp": vs = VB; g.box(-1, 0, -1, 0, 0, 0, rgb(PAL.G)); g.box(0, 1, 0, 0, 16, 0, rgb(PAL.G)); g.box(-2, 17, -2, 1, 19, 1, rgb("#fff3c0"), VoxCore.MAT.EMIT); break;
      case "trophy1": case "trophy2": case "trophy3": {
        vs = VB; var tc = id === "trophy3" ? rgb(PAL.Y) : id === "trophy2" ? rgb("#cfd8dc") : rgb("#c88a52");
        g.box(-3, 0, -3, 2, 1, 2, rgb(PAL.wood2)); g.box(-1, 2, -1, 0, 4, 0, tc); g.box(-3, 5, -3, 2, 9, 2, function (i, j, k) { return i === -3 || i === 2 || k === -3 || k === 2 || j === 5 ? tc : null; }); g.box(-4, 6, -1, -4, 8, 0, tc); g.box(3, 6, -1, 3, 8, 0, tc); break;
      }
      case "tub": vs = VB; g.fill(-9, 0, -7, 8, 4, 6, function (x, y, z, i, j, k) { var inside = i > -9 && i < 8 && k > -7 && k < 6 && j > 0; if (inside) return null; return j === 4 ? rgb("#ffffff") : rgb("#eaf2f8"); }); for (var fx = -8; fx <= 7; fx++) for (var fz = -6; fz <= 5; fz++) g.set(fx, 1, fz, rgb("#8fd0f8")); g.box(-9, 0, -7, -9, 0, -7, rgb("#9aa2a8")); g.box(8, 0, 6, 8, 0, 6, rgb("#9aa2a8")); break;
      case "sponge": g.box(-3, 0, -2, 2, 2, 1, function (i, j, k) { return hs(i, j, k) < 0.25 ? rgb("#e8c040") : rgb(PAL.Y); }); piv = [0, 1, 0]; break;
      case "brush": g.box(-1, 0, -6, 0, 1, 2, rgb(PAL.wood)); g.box(-2, 0, 3, 1, 1, 7, rgb(PAL.wood2)); for (var bi = -2; bi <= 1; bi++) for (var bk = 3; bk <= 7; bk++) g.set(bi, -1, bk, rgb("#f4f4f0")); piv = [0, 0, 0]; break;
      case "shower": g.box(-1, 0, -1, 0, 8, 0, rgb("#cfd8dc")); g.box(-3, 9, -3, 2, 10, 2, rgb("#b0bcc2")); piv = [0, 10, 0]; break;
      case "leash": g.box(0, 0, 0, 0, 0, 0, rgb("#e2403a")); break;
      case "cone": vs = VB; g.box(-2, 0, -2, 1, 0, 1, rgb("#ff7a1a")); g.box(-1, 1, -1, 0, 5, 0, function (i, j) { return j === 3 ? rgb(PAL.W) : rgb("#ff7a1a"); }); break;
      case "hurdle": vs = VB; g.box(-6, 0, 0, -6, 6, 0, rgb(PAL.W)); g.box(5, 0, 0, 5, 6, 0, rgb(PAL.W)); g.box(-6, 6, 0, 5, 6, 0, function (i) { return i % 2 ? rgb("#e2403a") : rgb(PAL.W); }); break;
      case "tunnel": vs = VB; g.fill(-5, 0, -9, 4, 9, 8, function (x, y, z) { var r = Math.hypot(x + 0.5, y - 0.5); return r <= 5.2 && r >= 4.2 && y >= 0.5 ? ((Math.floor((z + 20) / 3)) % 2 ? rgb("#3a7ad8") : rgb("#f6c83a")) : null; }); break;
      case "pedestal": vs = VB; g.box(-5, 0, -5, 4, 3, 4, function (i, j) { return j === 3 ? rgb("#f4f0e6") : rgb("#d8d0c0"); }); break;
      case "door": vs = VB; g.box(-6, 0, 0, 5, 20, 1, function (i, j) { return i === -6 || i === 5 || j === 20 ? rgb(PAL.wood2) : rgb(PAL.wood); }); g.box(3, 9, 2, 3, 10, 2, rgb(PAL.Y)); break;
      case "kibble": g.box(0, 0, 0, 0, 0, 0, rgb("#b98552")); break;
      case "poop": g.ell([0, 1, 0], [2, 1.4, 2], rgb("#6b4a2b")); g.set(0, 3, 0, rgb("#5a3a20")); break;
      case "bag": vs = VB; g.box(-2, 0, -1, 1, 3, 0, rgb("#3a7ad8")); break;
      default: g.set(0, 0, 0, W);
    }
    var res = {verts: VoxCore.meshArray(g, vs, piv), vs: vs, bb: g.n ? g.bbox().map(function (v, i) { return (i < 3 ? v - piv[i % 3] : v + 1 - piv[i % 3]) * vs; }) : [0, 0, 0, 0, 0, 0]};
    propCache[key] = res;
    return res;
  }

  /* ---------- escenarios (vóxel de 4 cm, como el partido) ---------- */
  function scene(kind, o) {
    o = o || {};
    var T = o.T || PetStyle.teamColors(), out = [], season = o.season || 0, night = !!o.night;
    var grassA = [[0.36, 0.66, 0.28], [0.36, 0.56, 0.24], [0.84, 0.88, 0.92], [0.26, 0.5, 0.22], [0.34, 0.7, 0.3]][season], grassB = mix(grassA, "#1e4a18", 0.18);
    function floorGrid(R, fn) { var g = new VG(); for (var i = -R; i < R; i++) for (var k = -R; k < R; k++) { var c = fn(i, k); if (c) g.set(i, -1, k, c.c || c, c.code || 0); } return g; }
    function grassC(i, k) {
      var h = hs(i, 0, k), c = (Math.floor((i + 100) / 6) % 2 ? grassA : grassB);
      if (season === 1 && h > 0.93) return h > 0.97 ? rgb("#d9732a") : rgb("#b4552a");
      if (season === 2 && h > 0.35) return mix(grassA, "#ffffff", 0.3);
      if (season === 4 && h > 0.965) return h > 0.985 ? rgb("#ffd23a") : rgb("#ffffff");
      return mix(c, h > 0.5 ? "#ffffff" : "#000000", Math.abs(h - 0.5) * 0.12);
    }
    if (kind === "home") {
      /* jardín junto a la casa: césped (o suelo pulido en invierno), valla, pared con puerta y caminito */
      var R = 52;
      var fl = floorGrid(R, function (i, k) { var r = Math.hypot(i, k + 6); if (r > R) return null; if (Math.abs(i) <= 3 && k < -20) return rgb("#c8b896"); return grassC(i, k); });
      out.push({id: "floor", verts: VoxCore.meshArray(fl, VB), floor: true});
      var g = new VG();
      /* pared de la casa al fondo con ventana y puerta */
      for (var i = -48; i < 48; i++) for (var j = 0; j < 40; j++) for (var k = -46; k <= -44; k++) {
        var win = (Math.abs(i - 16) <= 5 && j >= 18 && j <= 28) || (Math.abs(i + 18) <= 5 && j >= 18 && j <= 28), door = Math.abs(i) <= 5 && j <= 22;
        if (door && k > -46) continue;
        if (win && k === -44) { g.set(i, j, k, j === 23 || Math.abs(i - (i > 0 ? 16 : -18)) === 0 ? rgb("#f4f0e6") : (night ? rgb("#ffe39a") : rgb("#9fd0f0")), night ? VoxCore.MAT.EMIT : VoxCore.MAT.GLOSS); continue; }
        g.set(i, j, k, j < 3 ? rgb("#8a7a6a") : (Math.floor(j / 3) + (Math.floor(j / 3) % 2 ? Math.floor(i / 4) : Math.floor((i + 2) / 4))) % 7 === 0 ? rgb("#e8d8c0") : rgb("#f0e4d0"));
      }
      for (i = -50; i < 50; i++) for (k = -48; k <= -43; k++) g.set(i, 40, k, rgb(PAL.r));
      /* valla de madera alrededor */
      for (var a = 0; a < 360; a += 2.2) { var rad = a * Math.PI / 180, x = Math.round(Math.cos(rad) * 48), z = Math.round(Math.sin(rad) * 42) - 4; if (z < -43) continue; for (var y = 0; y < 9; y++) if (y < 8 || a % 6.6 < 2.2) g.set(x, y, z, y === 7 || y === 3 ? rgb(PAL.wood2) : rgb(PAL.wood)); }
      out.push({id: "home", verts: VoxCore.meshArray(g, VB)});
      return out;
    }
    if (kind === "walk") {
      /* recorrido: una franja larga en z con zonas según la ruta */
      var route = o.route || "park", len = 220, gw = new VG();
      for (var zi = -len; zi < 30; zi++) for (var xi = -22; xi < 22; xi++) {
        var path = Math.abs(xi - Math.round(Math.sin(zi / 23) * 6)) <= 4;
        var c = route === "barrio" ? (path ? rgb("#c9c4ba") : Math.abs(xi) > 16 ? rgb("#8a8478") : rgb("#a8a296")) : route === "stadium" ? (path ? rgb("#c8beb0") : rgb("#9aa0a8")) : path ? rgb("#c8b896") : grassC(xi, zi);
        if (route === "training" && !path) c = (Math.floor((xi + 100) / 5) % 2 ? grassA : grassB);
        gw.set(xi, -1, zi, c);
      }
      out.push({id: "floor", verts: VoxCore.meshArray(gw, VB), floor: true});
      var gd = new VG(), seed = route.length * 13;
      for (var t = 0; t < 46; t++) {
        var tz = -len + 10 + Math.floor(hs(t, seed, 1) * (len + 10)), tx = (hs(t, seed, 2) < 0.5 ? -1 : 1) * (10 + Math.floor(hs(t, seed, 3) * 10));
        if (route === "barrio" || route === "stadium") {
          var hh = 12 + Math.floor(hs(t, 4, seed) * 20), wallc = route === "stadium" ? (t % 2 ? col("T1", T) : rgb("#d8dce0")) : [rgb("#f0d8b8"), rgb("#d8e4f0"), rgb("#f4e0e0"), rgb("#e0f0d8")][t % 4];
          gd.box(tx - 4, 0, tz - 4, tx + 3, hh, tz + 3, function (i, j, k) { return j === hh ? rgb(PAL.r) : (j % 6 === 3 && (i + k) % 3 === 0) ? rgb("#9fd0f0") : wallc; });
        } else {
          gd.box(tx, 0, tz, tx + 1, 8, tz + 1, rgb(PAL.wood2));
          gd.ell([tx + 0.5, 14, tz + 0.5], [5, 6, 5], function (u) { return season === 1 ? (u[1] > 0 ? rgb("#e08a2a") : rgb("#c0602a")) : season === 2 ? (u[1] > 0.3 ? rgb("#f4f8ff") : rgb("#2f6a3a")) : (u[1] > 0.2 ? rgb("#56c75c") : rgb("#2f8f3c")); });
        }
      }
      if (route === "training") for (var c2 = -200; c2 < 0; c2 += 30) { gd.box(-15, 0, c2, -15, 7, c2, rgb(PAL.W)); gd.box(-9, 0, c2, -9, 7, c2, rgb(PAL.W)); gd.box(-15, 8, c2, -9, 8, c2, rgb(PAL.W)); }
      out.push({id: "walkdeco", verts: VoxCore.meshArray(gd, VB)});
      return out;
    }
    if (kind === "arena" || kind === "shop" || kind === "wardrobe" || kind === "show") {
      var Rr = kind === "arena" ? 50 : 30;
      var fl2 = floorGrid(Rr, function (i, k) {
        var r = Math.hypot(i, k); if (r > Rr) return null;
        if (kind === "arena") return grassC(i, k);
        if (kind === "shop") return (Math.floor((i + 100) / 4) + Math.floor((k + 100) / 4)) % 2 ? rgb("#f4efe6") : rgb("#e6dccb");
        if (kind === "show") return r < 12 ? {c: rgb("#2a2f3a"), code: VoxCore.MAT.GLOSS} : rgb("#1c2028");
        return r < 14 ? {c: rgb("#3a3346"), code: VoxCore.MAT.GLOSS} : rgb("#2a2533");
      });
      out.push({id: "floor", verts: VoxCore.meshArray(fl2, VB), floor: true});
      var gs = new VG();
      if (kind === "arena") {
        for (var a2 = 0; a2 < 360; a2 += 1.6) { var r2 = a2 * Math.PI / 180, x2 = Math.round(Math.cos(r2) * 46), z2 = Math.round(Math.sin(r2) * 46); for (var y2 = 0; y2 < 6; y2++) gs.set(x2, y2, z2, y2 === 5 ? col("T2", T) : col("T1", T)); }
        for (var b = 0; b < 3; b++) gs.box(-40 + b * 30, 6, -48, -26 + b * 30, 14, -47, function (i, j) { return j === 14 ? rgb(PAL.K) : (i + j) % 4 ? rgb("#ffb21e") : rgb("#1d1404"); });
      } else if (kind === "shop") {
        for (var s1 = -30; s1 < 30; s1++) for (var s2 = 0; s2 < 26; s2++) gs.set(s1, s2, -28, s2 > 22 ? col("T1", T) : (s2 % 8 === 0 ? rgb("#d8c8a8") : rgb("#f6efe2")));
        for (var s3 = -30; s3 < 30; s3 += 2) gs.box(s3, 26, -30, s3 + 1, 27, -26, s3 % 4 ? rgb("#e2403a") : rgb(PAL.W));
      } else {
        for (var a3 = 0; a3 < 360; a3 += 2) { var r3 = a3 * Math.PI / 180, x3 = Math.round(Math.cos(r3) * 14), z3 = Math.round(Math.sin(r3) * 14); gs.set(x3, 0, z3, rgb("#ffb21e"), VoxCore.MAT.EMIT); }
      }
      out.push({id: kind + "deco", verts: VoxCore.meshArray(gs, VB)});
      return out;
    }
    return out;
  }
  return {acc: acc, prop: prop, scene: scene, glyph: glyph};
})();
