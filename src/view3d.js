/* view3d.js — vistas 3D de presentación (5.6).
   WebGL propio, sin librerías ni recursos remotos.
   - Escenario: un campo de fútbol que cambia con la época de la temporada (verano seco, otoño con hojas,
     invierno nevado y de noche con focos, febrero-marzo lluvioso con charcos que reflejan, primavera con margaritas),
     con grada, portería, clima en partículas y la sombra del personaje.
   - Jugador: su figura pixel extruida a vóxeles (mismos colores y proporciones que en 2D); la prenda nueva destella
     y posa para enseñarla; también hace su celebración.
   - Mascota, al estilo de un Nintendogs sencillo: modelo 3D suave hecho de formas simples con los colores de su sprite;
     pasea por el césped, se sienta, olfatea, te mira, acude cuando tocas el césped, la acaricias arrastrando sobre ella
     (corazones), le lanzas la pelota (o su juguete) y te la trae, y hace los trucos de su especie. Los accesorios van en su sitio.
   - Arrastrar fuera del personaje gira la cámara; pellizcar (o la rueda) acerca con límites. Se cierra cuando quieras.
   - Sin WebGL no se abre; con animaciones reducidas no hay reflejos ni clima, y si el móvil va justo se simplifica solo. */
var View3D = (function () {
  "use strict";
  if (typeof Anim === "undefined") return null;
  var D2R = Math.PI / 180, PI = Math.PI;

  /* ================= matemáticas (matrices 4×4 en columna mayor) ================= */
  function m4() { var m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function M() { var r = arguments[0]; for (var i = 1; i < arguments.length; i++) r = mul(r, arguments[i]); return r; }
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), m = new Float32Array(16); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], zl = Math.hypot(zx, zy, zz); zx /= zl; zy /= zl; zz /= zl;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx, xl = Math.hypot(xx, xy, xz); xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx, m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx; m[4] = xy; m[5] = yy; m[6] = zy; m[8] = xz; m[9] = yz; m[10] = zz;
    m[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); m[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); m[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); m[15] = 1;
    return m;
  }
  function T(x, y, z) { var m = m4(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function Sc(x, y, z) { var m = m4(); m[0] = x; m[5] = y == null ? x : y; m[10] = z == null ? x : z; return m; }
  function RX(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function RY(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function RZ(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  function about(p, R) { return M(T(p[0], p[1], p[2]), R, T(-p[0], -p[1], -p[2])); }
  function tp(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function damp(a, b, k, dt) { return lerp(a, b, 1 - Math.exp(-k * dt)); }
  function angDiff(a, b) { var d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function h(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ================= colores ================= */
  function rgb(c) {
    if (Array.isArray(c)) return c;
    c = String(c || "#888").trim();
    var hm = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/.exec(c);
    if (hm) {
      var H = (+hm[1] % 360) / 360, Sa = +hm[2] / 100, L = +hm[3] / 100, q = L < 0.5 ? L * (1 + Sa) : L + Sa - L * Sa, p0 = 2 * L - q;
      var f = function (t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p0 + (q - p0) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p0 + (q - p0) * (2 / 3 - t) * 6 : p0; };
      return [f(H + 1 / 3), f(H), f(H - 1 / 3), 1];
    }
    var m = /^rgba?\(([^)]+)\)/.exec(c);
    if (m) { var p = m[1].split(","); return [+p[0] / 255, +p[1] / 255, +p[2] / 255, p[3] == null ? 1 : +p[3]]; }
    c = c.replace("#", ""); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var v = parseInt(c, 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255, 1];
  }
  function mix(a, b, k) { a = rgb(a); b = rgb(b); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), 1]; }
  /* filtros CSS de color de la mascota (gris, brillo, contraste, sepia, saturación, tono) como matriz afín */
  function cssFilterMat(str, extraHue) {
    var Mx = [1, 0, 0, 0, 1, 0, 0, 0, 1], off = [0, 0, 0];
    function apply(A, o2) {
      var R = [], i, j, k;
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) { var s = 0; for (k = 0; k < 3; k++) s += A[i * 3 + k] * Mx[k * 3 + j]; R[i * 3 + j] = s; }
      var O = [0, 0, 0]; for (i = 0; i < 3; i++) { var so = o2 ? o2[i] : 0; for (k = 0; k < 3; k++) so += A[i * 3 + k] * off[k]; O[i] = so; }
      Mx = R; off = O;
    }
    function hue(deg) { var a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
      return [0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072]; }
    function sat(s) { return [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s]; }
    var re = /([a-z-]+)\(([-\d.]+)(deg)?\)/g, mm;
    while ((mm = re.exec(str || ""))) {
      var f = mm[1], v = +mm[2];
      if (f === "grayscale") { var g = 1 - v; apply([0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g, 0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g]); }
      else if (f === "brightness") apply([v, 0, 0, 0, v, 0, 0, 0, v]);
      else if (f === "contrast") apply([v, 0, 0, 0, v, 0, 0, 0, v], [0.5 - 0.5 * v, 0.5 - 0.5 * v, 0.5 - 0.5 * v]);
      else if (f === "sepia") { var s2 = 1 - v; apply([0.393 + 0.607 * s2, 0.769 - 0.769 * s2, 0.189 - 0.189 * s2, 0.349 - 0.349 * s2, 0.686 + 0.314 * s2, 0.168 - 0.168 * s2, 0.272 - 0.272 * s2, 0.534 - 0.534 * s2, 0.131 + 0.869 * s2]); }
      else if (f === "saturate") apply(sat(v));
      else if (f === "hue-rotate") apply(hue(v));
    }
    if (extraHue) { apply(sat(1.4)); apply(hue(extraHue)); }
    return {m: new Float32Array([Mx[0], Mx[3], Mx[6], Mx[1], Mx[4], Mx[7], Mx[2], Mx[5], Mx[8]]), o: new Float32Array(off)};
  }
  var ID_CM = cssFilterMat("");

  /* ================= geometría ================= */
  /* cada vértice: posición (3), normal (3), color (3), destello (1) */
  function V(A, p, n, c, f) { A.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], f || 0); }
  function ellipsoid(A, c, r, col, seg, ring, fl) {
    seg = seg || 14; ring = ring || 10;
    var cf = typeof col === "function" ? col : null, cc = cf ? null : rgb(col);
    function pt(i, j) {
      var th = i / ring * PI, ph = j / seg * 2 * PI, sx = Math.sin(th) * Math.cos(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.sin(ph);
      var n = [sx / r[0], sy / r[1], sz / r[2]], l = Math.hypot(n[0], n[1], n[2]) || 1;
      return {p: [c[0] + r[0] * sx, c[1] + r[1] * sy, c[2] + r[2] * sz], n: [n[0] / l, n[1] / l, n[2] / l], u: [sx, sy, sz]};
    }
    for (var i = 0; i < ring; i++) for (var j = 0; j < seg; j++) {
      var a = pt(i, j), b = pt(i + 1, j), d = pt(i + 1, j + 1), e = pt(i, j + 1), q = [a, b, d, a, d, e];
      for (var k = 0; k < 6; k++) V(A, q[k].p, q[k].n, cf ? rgb(cf(q[k].u)) : cc, fl);
    }
  }
  function basis(d) {
    var l = Math.hypot(d[0], d[1], d[2]) || 1, z = [d[0] / l, d[1] / l, d[2] / l], up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    var x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]], xl = Math.hypot(x[0], x[1], x[2]); x = [x[0] / xl, x[1] / xl, x[2] / xl];
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return {x: x, y: y, z: z, l: l};
  }
  function ringPt(b, a, r, p, fx) { var c = Math.cos(a) * (fx || 1), s = Math.sin(a); return [p[0] + (b.x[0] * c + b.y[0] * s) * r, p[1] + (b.x[1] * c + b.y[1] * s) * r, p[2] + (b.x[2] * c + b.y[2] * s) * r]; }
  function capsule(A, p0, p1, r0, r1, col, seg, fl) {
    seg = seg || 10; var b = basis([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]), c = rgb(col);
    for (var j = 0; j < seg; j++) {
      var a0 = j / seg * 2 * PI, a1 = (j + 1) / seg * 2 * PI;
      var n0 = ringPt(b, a0, 1, [0, 0, 0]), n1 = ringPt(b, a1, 1, [0, 0, 0]);
      var q0 = ringPt(b, a0, r0, p0), q1 = ringPt(b, a1, r0, p0), q2 = ringPt(b, a1, r1, p1), q3 = ringPt(b, a0, r1, p1);
      V(A, q0, n0, c, fl); V(A, q1, n1, c, fl); V(A, q2, n1, c, fl); V(A, q0, n0, c, fl); V(A, q2, n1, c, fl); V(A, q3, n0, c, fl);
    }
    ellipsoid(A, p0, [r0, r0, r0], col, 8, 6, fl); ellipsoid(A, p1, [r1, r1, r1], col, 8, 6, fl);
  }
  function cone(A, base, tip, r, col, seg, fl, flat) {
    seg = seg || 10; var b = basis([tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]]), c = rgb(col), nb = [-b.z[0], -b.z[1], -b.z[2]];
    for (var j = 0; j < seg; j++) {
      var a0 = j / seg * 2 * PI, a1 = (j + 1) / seg * 2 * PI;
      var q0 = ringPt(b, a0, r, base, flat), q1 = ringPt(b, a1, r, base, flat);
      var d0 = ringPt(b, a0, 1, [0, 0, 0], flat), d1 = ringPt(b, a1, 1, [0, 0, 0], flat);
      var nn = function (d) { var n = [d[0] + b.z[0] * r / b.l, d[1] + b.z[1] * r / b.l, d[2] + b.z[2] * r / b.l], l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
      V(A, q0, nn(d0), c, fl); V(A, q1, nn(d1), c, fl); V(A, tip, b.z, c, fl);
      V(A, base, nb, c, fl); V(A, q1, nb, c, fl); V(A, q0, nb, c, fl);
    }
  }
  function box(A, x0, y0, z0, x1, y1, z1, col, fl) {
    var c = rgb(col), F = [
      [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]], [[-1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]]],
      [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]], [[0, -1, 0], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]], [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]]];
    F.forEach(function (f) { var q = f[1]; [0, 1, 2, 0, 2, 3].forEach(function (i) { V(A, q[i], f[0], c, fl); }); });
  }
  /* sprite de píxeles → vóxeles (jugador y accesorios): solo las caras que dan al vacío */
  var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  var FACE = [[[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]],
    [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]]];
  function voxelize(cells, depth, H, s, cx, A) {
    var occ = {}, list = []; A = A || [];
    cells.forEach(function (c) {
      var d = depth(c[0], c[1], c[3]), col = rgb(c[2]); if (col[3] < 0.5) return;
      for (var z = d[0]; z < d[1]; z++) { var k = c[0] + "," + c[1] + "," + z; if (!occ[k]) list.push([c[0], c[1], z, col, c[4] || 0]); occ[k] = 1; }
    });
    list.forEach(function (q) {
      for (var f = 0; f < 6; f++) {
        var d = DIRS[f];
        if (occ[(q[0] + d[0]) + "," + (q[1] - d[1]) + "," + (q[2] + d[2])]) continue;
        var sh = f === 2 ? 1.0 : f === 3 ? 0.7 : f === 4 ? 0.97 : f === 5 ? 0.78 : 0.86, cs = FACE[f], col = [q[3][0] * sh, q[3][1] * sh, q[3][2] * sh];
        var quad = cs.map(function (o) { return [(q[0] + o[0] - cx) * s, (H - q[1] - 1 + o[1]) * s, (q[2] + o[2]) * s]; });
        [0, 1, 2, 0, 2, 3].forEach(function (i) { V(A, quad[i], d, col, q[4]); });
      }
    });
    return A;
  }
  function gridCells(g) { var out = []; for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) { var c = g.get(x, y); if (c) out.push([x, y, c, "b", 0]); } return out; }
  function nf(e) { return String(e || "").replace(/️/g, ""); }

  /* ================= época de la temporada ================= */
  function season() {
    var bi = null;
    try { if (typeof S !== "undefined" && S && S.bi != null) bi = S.bi; } catch (e) {}
    if (bi == null) { var mo = new Date().getMonth(); bi = mo >= 7 && mo <= 8 ? 0 : mo >= 9 && mo <= 10 ? 1 : mo === 11 || mo === 0 ? 2 : mo >= 1 && mo <= 2 ? 3 : mo >= 3 && mo <= 4 ? 4 : 0; }
    return [
      {k: "summer", id: 0, sky: "linear-gradient(180deg,#5fb2ea 0%,#a9d8f3 55%,#e8f4fa 100%)", fog: [0.72, 0.85, 0.92], key: [1.08, 1.0, 0.88], amb: [0.42, 0.45, 0.5], rim: [1.0, 0.9, 0.7], wet: 0, wx: null},
      {k: "autumn", id: 1, sky: "linear-gradient(180deg,#5b6b8f 0%,#d99a5e 55%,#f6c88a 100%)", fog: [0.86, 0.66, 0.48], key: [1.12, 0.86, 0.6], amb: [0.38, 0.34, 0.36], rim: [1.0, 0.7, 0.4], wet: 0.05, wx: "leaf"},
      {k: "winter", id: 2, sky: "linear-gradient(180deg,#050a14 0%,#0e1a2e 55%,#1f3048 100%)", fog: [0.1, 0.15, 0.24], key: [0.92, 0.97, 1.12], amb: [0.3, 0.34, 0.44], rim: [0.7, 0.8, 1.0], wet: 0.2, wx: "snow", night: true},
      {k: "rain", id: 3, sky: "linear-gradient(180deg,#46505b 0%,#77828d 55%,#9aa4ad 100%)", fog: [0.5, 0.55, 0.6], key: [0.86, 0.9, 0.96], amb: [0.36, 0.4, 0.44], rim: [0.7, 0.75, 0.85], wet: 0.12, wx: "rain"},
      {k: "spring", id: 4, sky: "linear-gradient(180deg,#77c6f5 0%,#bfe6fb 55%,#f2fbff 100%)", fog: [0.78, 0.9, 0.95], key: [1.02, 1.02, 0.95], amb: [0.44, 0.47, 0.5], rim: [1.0, 0.95, 0.85], wet: 0, wx: "petal"}
    ][bi] || null;
  }

  /* ================= sombreadores ================= */
  var VS = "attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;attribute float aF;uniform mat4 uPV;uniform mat4 uM;uniform mediump float uMir;uniform mediump float uFl;" +
    "varying vec3 vC;varying vec3 vN;varying float vY;varying float vF;void main(){vec4 w=uM*vec4(aP,1.0);vec3 n=normalize((uM*vec4(aN,0.0)).xyz);" +
    "if(uMir>0.5){w.y=-w.y;n.y=-n.y;}vY=w.y;vN=n;vC=aC;vF=aF*uFl;gl_Position=uPV*w;}";
  var FS = "precision mediump float;varying vec3 vC;varying vec3 vN;varying float vY;varying float vF;uniform float uA;uniform float uMir;" +
    "uniform vec3 uKey;uniform vec3 uAmb;uniform vec3 uRim;uniform vec3 uL;uniform mat3 uCM;uniform vec3 uCO;" +
    "void main(){vec3 n=normalize(vN);float d=dot(n,uL)*0.5+0.5;d=d*d;float rim=pow(1.0-max(n.z*0.6+n.y*0.4,0.0),3.0)*0.18;" +
    "vec3 base=clamp(uCM*vC+uCO,0.0,1.0);vec3 c=base*(uAmb+uKey*d*1.05)+uRim*rim+vec3(1.0,0.95,0.7)*vF*0.6;" +
    "float a=uA;if(uMir>0.5){a*=clamp(1.0+vY*1.6,0.0,1.0);c*=0.7;}gl_FragColor=vec4(c,a);}";
  /* césped: rayas de corte, líneas, detalles de la época, niebla al fondo, charcos y sombra */
  var GVS = "attribute vec2 aQ;uniform mat4 uPV;uniform mediump float uR;varying vec2 vP;void main(){vP=aQ*uR;gl_Position=uPV*vec4(vP.x,0.0,vP.y,1.0);}";
  var GFS = "precision mediump float;varying vec2 vP;uniform float uSe;uniform float uR;uniform vec3 uSh;uniform vec3 uFog;uniform vec3 uKey;uniform vec3 uAmb;uniform float uRefl;" +
    "float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),f.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),f.x),f.y);}" +
    "float ln(float d,float w){return 1.0-smoothstep(w*0.6,w,abs(d));}" +
    "void main(){vec2 p=vP;float r=length(p);" +
    "vec3 g=uSe<0.5?vec3(0.34,0.6,0.24):uSe<1.5?vec3(0.3,0.5,0.22):uSe<2.5?vec3(0.2,0.38,0.2):uSe<3.5?vec3(0.2,0.42,0.19):vec3(0.3,0.64,0.26);" +
    "float st=mod(floor((p.x+120.0)/1.6),2.0);g*=0.9+0.13*st;g*=0.94+0.12*vn(p*3.0);" +
    "float wet=0.0;" +
    "if(uSe<0.5){float dry=smoothstep(0.62,0.8,vn(p*0.45));g=mix(g,vec3(0.62,0.6,0.32),dry*0.55);}" +
    "else if(uSe<1.5){vec2 c=floor(p*5.0);float hh=hs(c);vec2 f=fract(p*5.0);if(hh>0.86&&abs(f.x-0.5)<0.32&&abs(f.y-0.5)<0.2){float k=hs(c+7.0);g=k<0.33?vec3(0.85,0.42,0.12):k<0.66?vec3(0.62,0.28,0.1):vec3(0.86,0.66,0.2);}}" +
    "else if(uSe<2.5){float sn=smoothstep(0.32,0.48,vn(p*0.7)+0.25*vn(p*3.1));g=mix(g,vec3(0.86,0.9,0.97),sn);wet=0.18*(1.0-sn);}" +
    "else if(uSe<3.5){float pd=smoothstep(0.6,0.7,vn(p*0.42));g=mix(g,vec3(0.12,0.17,0.15),pd*0.85);wet=0.08+0.6*pd;}" +
    "else{vec2 c=floor(p*6.0);float hh=hs(c);vec2 f=fract(p*6.0)-0.5;if(hh>0.93&&length(f)<0.22){g=length(f)<0.09?vec3(1.0,0.82,0.2):vec3(0.98,0.98,0.95);}}" +
    "float L=max(max(ln(p.y,0.07),ln(r-2.6,0.07)),ln(r,0.12)*step(r,0.2));" +
    "L=max(L,ln(p.y+9.0,0.07)*step(abs(p.x),9.0));L=max(L,ln(abs(p.x)-4.0,0.07)*step(p.y,-6.6)*step(-9.0,p.y));L=max(L,ln(p.y+6.6,0.07)*step(abs(p.x),4.0));" +
    "float lv=uSe>1.5&&uSe<2.5?0.35:0.92;g=mix(g,vec3(0.95,0.97,0.95),L*lv);" +
    "vec3 c=g*(uAmb+uKey*0.78);" +
    "float s=length((p-uSh.xy)/vec2(uSh.z,uSh.z*0.82));c*=1.0-(1.0-smoothstep(0.25,1.0,s))*0.5;" +
    "c=mix(c,uFog,smoothstep(uR*0.45,uR*0.95,r));" +
    "float a=1.0-wet*uRefl;a*=1.0-smoothstep(uR*0.92,uR,r);gl_FragColor=vec4(c,a);}";
  /* grada en anillo alrededor del campo, con público, valla LED y focos */
  var RVS = "attribute vec2 aQ;uniform mat4 uPV;uniform float uRR;uniform float uRH;varying vec2 vQ;void main(){vQ=aQ;float a=aQ.x*6.2831853;" +
    "float rr=uRR+aQ.y*uRH*0.9;gl_Position=uPV*vec4(cos(a)*rr,aQ.y*uRH,sin(a)*rr,1.0);}";
  var RFS = "precision mediump float;varying vec2 vQ;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uAmb;uniform vec3 uKey;uniform vec3 uFog;uniform float uNight;uniform float uT;" +
    "float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "void main(){vec2 q=vQ;vec3 c;" +
    "if(q.y<0.09){vec2 cl=floor(vec2(q.x*220.0,q.y*30.0));float on=step(0.45,hs(cl+floor(uT*1.5)));c=mix(vec3(0.05,0.05,0.06),vec3(1.0,0.7,0.12),on*0.9);c+=vec3(0.15,0.1,0.02)*uNight;}" +
    "else if(q.y>0.93){c=vec3(0.07,0.08,0.1);if(uNight>0.5&&q.y>0.96&&fract(q.x*48.0)<0.35)c=vec3(1.0,0.97,0.85)*1.6;}" +
    "else{vec2 cl=floor(vec2(q.x*900.0,(q.y-0.09)*34.0));float hh=hs(cl);vec3 seat=vec3(0.16,0.18,0.22);" +
    "vec3 fan=hh<0.3?uC1:hh<0.5?uC2:hh<0.65?vec3(0.92,0.92,0.9):hh<0.8?vec3(0.15,0.16,0.2):vec3(0.75,0.55,0.4);" +
    "fan=mix(fan,seat,0.35);c=mix(seat,fan,step(0.18,hh))*(uAmb+uKey*0.5);float row=fract((q.y-0.09)*34.0);c*=0.82+0.18*step(0.2,row);}" +
    "c=mix(c,uFog,0.32);gl_FragColor=vec4(c,1.0);}";
  /* partículas: clima, corazones, estrellas, notas, burbujas y polvo (atlas de píxeles) */
  var PVS = "attribute vec3 aP;attribute float aS;attribute float aT;attribute vec4 aC;uniform mat4 uPV;uniform float uH;varying float vT;varying vec4 vC;" +
    "void main(){vec4 c=uPV*vec4(aP,1.0);gl_Position=c;gl_PointSize=max(1.0,aS*uH/max(0.2,c.w));vT=aT;vC=aC;}";
  var PFS = "precision mediump float;varying float vT;varying vec4 vC;uniform sampler2D uTex;void main(){vec2 pc=gl_PointCoord;" +
    "if(vT>8.5){if(abs(pc.x-0.5)>0.1)discard;gl_FragColor=vec4(vC.rgb,vC.a*0.7);return;}" +
    "vec4 t=texture2D(uTex,vec2((vT+pc.x)/9.0,pc.y));if(t.a<0.5)discard;gl_FragColor=vec4(t.rgb*vC.rgb,vC.a);}";
  function prog(gl, vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (x) { var s = gl.createShader(x[0]); gl.shaderSource(s, x[1]); gl.compileShader(s); gl.attachShader(p, s); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { try { console.warn("view3d", gl.getProgramInfoLog(p)); } catch (e) {} return null; }
    var o = {p: p, a: {}, u: {}}, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES), i;
    for (i = 0; i < n; i++) { var a = gl.getActiveAttrib(p, i); o.a[a.name] = gl.getAttribLocation(p, a.name); }
    n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i); o.u[u.name.replace("[0]", "")] = gl.getUniformLocation(p, u.name); }
    return o;
  }
  /* atlas de partículas en pixel art: corazón, estrella, nota, zeta, copo, hoja, pétalo, burbuja, cuadrado */
  var ATLAS = [
    [".XX.XX..", "XXXXXXX.", "XXXXXXX.", "XXXXXXX.", ".XXXXX..", "..XXX...", "...X....", "........"],
    ["...X....", "...X....", ".XXXXX..", "..XXX...", "..X.X...", ".X...X..", "........", "........"],
    ["...XXX..", "...X.X..", "...X.X..", "...X....", ".XXX....", "XXXX....", ".XX.....", "........"],
    ["XXXXX...", "...X....", "..X.....", ".X......", "XXXXX...", "........", "........", "........"],
    ["...X....", ".X.X.X..", "..XXX...", "XXXXXXX.", "..XXX...", ".X.X.X..", "...X....", "........"],
    ["....XX..", "..XXXX..", ".XXXXX..", ".XXXX...", "XXXX....", "X.......", "........", "........"],
    ["..XX....", ".XXXX...", ".XXXX...", "..XX....", "........", "........", "........", "........"],
    ["..XXX...", ".X...X..", "X..X..X.", "X.....X.", "X.....X.", ".X...X..", "..XXX...", "........"],
    ["XXXXXX..", "XXXXXX..", "XXXXXX..", "XXXXXX..", "XXXXXX..", "XXXXXX..", "........", "........"]
  ];
  var ATLAS_COL = ["#ff5a8a", "#ffd23a", "#ffffff", "#cfd8ff", "#ffffff", "#ffffff", "#ffd0e4", "#d8f4ff", "#ffffff"];
  function atlasTex(gl) {
    var cv = document.createElement("canvas"); cv.width = 72; cv.height = 8;
    var x = cv.getContext("2d");
    ATLAS.forEach(function (rows, i) { x.fillStyle = ATLAS_COL[i]; rows.forEach(function (r, y) { for (var k = 0; k < 8; k++) if (r.charAt(k) === "X") x.fillRect(i * 8 + k, y, 1, 1); }); });
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* ================= escena común ================= */
  var cur = null;
  function supported() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; }
  }
  function close() {
    if (!cur) return;
    var c = cur; cur = null;
    if (c.stop) c.stop();
    window.removeEventListener("keydown", c.onKey);
    var fin = function () { try { var ext = c.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } catch (e) {} if (c.el.parentNode) c.el.parentNode.removeChild(c.el); if (c.o.onClose) c.o.onClose(); };
    Anim.animate(c.el, [{opacity: 1}, {opacity: 0}], {dur: 180, easing: Anim.css.in, onfinish: fin});
    setTimeout(fin, 400);
  }
  function clubCols() {
    try { var cc = clubColors(W.clubs[S.p.club].n); return [rgb(cc[0] || "#c33"), rgb(cc[1] || "#fff")]; } catch (e) { return [rgb("#c8312f"), rgb("#f2f2f2")]; }
  }
  function goalMesh() {
    var A = [], w = 4.2, hgt = 2.8, z = -9, t = 0.09, wcol = "#f4f6f2", net = "#c9d2cc";
    box(A, -w - t, 0, z - t, -w + t, hgt, z + t, wcol); box(A, w - t, 0, z - t, w + t, hgt, z + t, wcol); box(A, -w - t, hgt - t, z - t, w + t, hgt + t, z + t, wcol);
    for (var i = -4; i <= 4; i++) box(A, i - 0.012, 0, z - 1.4, i + 0.012, hgt, z - 1.38, net);
    for (var j = 1; j <= 5; j++) box(A, -w, j * 0.5 - 0.012, z - 1.4, w, j * 0.5 + 0.012, z - 1.38, net);
    box(A, -w, hgt - 0.012, z - 1.4, w, hgt + 0.012, z, net);
    return new Float32Array(A);
  }

  /* abre la vista: o = {title, kicker, from, buttons, hint, scene(ctx) → {parts, pose(dt, t), hit, tap, touch…, onButton}} */
  function open(o) {
    if (cur) close();
    if (!supported()) return false;
    var red = Anim.reduced(), SE = season();
    var el = document.createElement("div");
    el.className = "v3d v3d-" + SE.k; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", o.title || "3D");
    el.style.background = SE.sky;
    el.innerHTML = '<canvas class="v3d-cv"></canvas><div class="v3d-top"><div><span class="eyebrow">' + h(o.kicker || "") + "</span><h2>" + h(o.title || "") + '</h2></div><button class="iconbtn v3d-x" data-v3d="x" aria-label="' + h(tr("Cerrar")) + '">✕</button></div>' +
      '<div class="v3d-bot">' + (o.buttons || "") + '<p class="v3d-hint">' + h(o.hint || tr("Arrastra para girar · pellizca para acercar")) + "</p></div>";
    document.body.appendChild(el);
    var cv = el.querySelector("canvas");
    var gl = cv.getContext("webgl", {alpha: true, antialias: true, premultipliedAlpha: false}) || cv.getContext("experimental-webgl");
    if (!gl) { el.parentNode.removeChild(el); return false; }
    var P = prog(gl, VS, FS), G = prog(gl, GVS, GFS), R = prog(gl, RVS, RFS), PP = prog(gl, PVS, PFS);
    if (!P || !G || !R || !PP) { el.parentNode.removeChild(el); return false; }
    function buf(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return {b: b, n: data.length / 10}; }
    var quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    var ringData = [], RS = 64, i;
    for (i = 0; i < RS; i++) { var a0 = i / RS, a1 = (i + 1) / RS; ringData.push(a0, 0, a1, 0, a1, 1, a0, 0, a1, 1, a0, 1); }
    var ring = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ring); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringData), gl.STATIC_DRAW);
    var goal = buf(goalMesh()), tex = atlasTex(gl), CC = clubCols();
    /* partículas: pool fijo, sin objetos por fotograma */
    var NP = 220, pd = new Float32Array(NP * 9), pbuf = gl.createBuffer(), parts = [];
    for (i = 0; i < NP; i++) parts.push({on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1, t: 0, c: [1, 1, 1, 1], life: 0, max: 1, g: 0, wx: false, sw: 0});
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, pd, gl.DYNAMIC_DRAW);
    function spawn(o2) {
      if (red && !o2.keep && !o2.wx) return null;
      for (var k = 0; k < NP; k++) { var q = parts[k]; if (q.on) continue;
        q.on = true; q.x = o2.x; q.y = o2.y; q.z = o2.z; q.vx = o2.vx || 0; q.vy = o2.vy || 0; q.vz = o2.vz || 0; q.s = o2.s || 0.12; q.t = o2.t || 0;
        q.c = o2.c || [1, 1, 1, 1]; q.life = 0; q.max = o2.max || 1.2; q.g = o2.g || 0; q.wx = !!o2.wx; q.sw = rnd(0, 6); return q; }
      return null;
    }
    var st = {yaw: o.yaw0 == null ? 0 : o.yaw0, pitch: o.pitch0 == null ? 0.2 : o.pitch0, dist: o.dist || 4.2, dmin: o.dmin || 2.4, dmax: o.dmax || 6.5, auto: o.auto !== false, idleT: 0, t: 0,
      refl: !red && SE.wet > 0, frames: 0, slow: 0, dpr: Math.min(2, window.devicePixelRatio || 1), tgt: (o.target || [0, 1.05, 0]).slice()};
    /* clima: partículas que se reciclan alrededor del personaje */
    if (!red && SE.wx) {
      var nW = SE.wx === "rain" ? 120 : SE.wx === "snow" ? 110 : SE.wx === "leaf" ? 40 : 30;
      for (i = 0; i < nW; i++) spawn({x: rnd(-6, 6), y: rnd(0, 5), z: rnd(-6, 4), wx: true, max: 1e9,
        t: SE.wx === "rain" ? 9 : SE.wx === "snow" ? 4 : SE.wx === "leaf" ? 5 : 6, s: SE.wx === "rain" ? 0.16 : SE.wx === "snow" ? 0.07 : 0.11,
        c: SE.wx === "rain" ? [0.75, 0.85, 1, 0.55] : SE.wx === "leaf" ? (Math.random() < 0.5 ? [0.92, 0.45, 0.12, 1] : [0.75, 0.3, 0.08, 1]) : [1, 1, 1, 0.95]});
    }
    var cam = {eye: [0, 1, 4], PV: m4(), fov: 0.7, asp: 1};
    function project(p) {
      var m = cam.PV, x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      var r = cv.getBoundingClientRect(); return {x: r.left + (x / w * 0.5 + 0.5) * r.width, y: r.top + (1 - (y / w * 0.5 + 0.5)) * r.height, w: w};
    }
    function groundAt(cx, cy) {
      var r = cv.getBoundingClientRect(), nx = (cx - r.left) / r.width * 2 - 1, ny = 1 - (cy - r.top) / r.height * 2;
      var t = st.tgt, e = cam.eye, f = [t[0] - e[0], t[1] - e[1], t[2] - e[2]], fl = Math.hypot(f[0], f[1], f[2]); f = [f[0] / fl, f[1] / fl, f[2] / fl];
      var rr = [-f[2], 0, f[0]], rl = Math.hypot(rr[0], rr[2]) || 1; rr = [rr[0] / rl, 0, rr[2] / rl];
      var u = [rr[1] * f[2] - rr[2] * f[1], rr[2] * f[0] - rr[0] * f[2], rr[0] * f[1] - rr[1] * f[0]];
      var th = Math.tan(cam.fov / 2), d = [f[0] + rr[0] * nx * th * cam.asp + u[0] * ny * th, f[1] + u[1] * ny * th, f[2] + rr[2] * nx * th * cam.asp + u[2] * ny * th];
      if (d[1] > -1e-3) return null;
      var k = -e[1] / d[1]; return [e[0] + d[0] * k, 0, e[2] + d[2] * k];
    }
    var ctx = {gl: gl, spawn: spawn, st: st, el: el, cv: cv, season: SE, red: red, cam: cam, project: project, groundAt: groundAt};
    var sc = o.scene(ctx);
    var meshes = {};
    Object.keys(sc.parts).forEach(function (k) { meshes[k] = buf(sc.parts[k]); });
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var L = (function () { var v = [-0.4, 0.85, 0.5], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
    function resize() {
      var w = cv.clientWidth, hh = cv.clientHeight, d = st.dpr;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(hh * d)) { cv.width = Math.round(w * d); cv.height = Math.round(hh * d); }
      gl.viewport(0, 0, cv.width, cv.height);
    }
    function camUpdate() {
      var asp = cv.width / Math.max(1, cv.height), fov = (asp < 0.8 ? 50 : 38) * D2R;
      var t = st.tgt, e = [t[0] + Math.sin(st.yaw) * Math.cos(st.pitch) * st.dist, t[1] + Math.sin(st.pitch) * st.dist, t[2] + Math.cos(st.yaw) * Math.cos(st.pitch) * st.dist];
      cam.eye = e; cam.fov = fov; cam.asp = asp; cam.PV = mul(persp(fov, asp, 0.05, 60), lookAt(e, t, [0, 1, 0]));
    }

    /* gestos: el personaje decide (acariciar, tocar); fuera de él, arrastrar gira y pellizcar acerca */
    var ptrs = {}, pinch0 = 0, dist0 = 0, down = null;
    cv.addEventListener("pointerdown", function (e) {
      ptrs[e.pointerId] = [e.clientX, e.clientY]; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      st.auto = false; st.idleT = 0;
      var ks = Object.keys(ptrs);
      if (ks.length === 2) { var a = ptrs[ks[0]], b = ptrs[ks[1]]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); dist0 = st.dist; if (down && down.on && sc.touchEnd) sc.touchEnd(); down = null; return; }
      down = {x: e.clientX, y: e.clientY, moved: false, on: sc.hit ? sc.hit(e.clientX, e.clientY) : false};
      if (down.on && sc.touchStart) sc.touchStart(e.clientX, e.clientY);
    });
    cv.addEventListener("pointermove", function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ks = Object.keys(ptrs);
      if (ks.length === 2 && pinch0) { ptrs[e.pointerId] = [e.clientX, e.clientY]; var a = ptrs[ks[0]], b = ptrs[ks[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); st.dist = clamp(dist0 * pinch0 / Math.max(20, d), st.dmin, st.dmax); return; }
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
      if (down && down.on && sc.touchMove) sc.touchMove(e.clientX, e.clientY, e.clientX - p[0], e.clientY - p[1]);
      else if (down && down.moved) { st.yaw -= (e.clientX - p[0]) * 0.01; st.pitch = clamp(st.pitch + (e.clientY - p[1]) * 0.005, 0.03, 0.95); }
      ptrs[e.pointerId] = [e.clientX, e.clientY]; st.idleT = 0;
    });
    var up = function (e) {
      if (down && !down.moved && sc.tap) sc.tap(e.clientX, e.clientY, down.on);
      if (down && down.on && sc.touchEnd) sc.touchEnd();
      delete ptrs[e.pointerId]; pinch0 = 0; down = null;
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); st.dist = clamp(st.dist * (e.deltaY > 0 ? 1.08 : 0.93), st.dmin, st.dmax); st.idleT = 0; }, {passive: false});
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-v3d]"); if (!b) return;
      var v = b.getAttribute("data-v3d");
      if (v === "x") close(); else if (sc.onButton) sc.onButton(v, b);
    });
    var onKey = function (e) { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);

    function useModelProg(mirror, alpha, flash) {
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uPV, false, cam.PV);
      gl.uniform1f(P.u.uMir, mirror ? 1 : 0); gl.uniform1f(P.u.uA, alpha); gl.uniform1f(P.u.uFl, flash || 0);
      gl.uniform3fv(P.u.uKey, SE.key); gl.uniform3fv(P.u.uAmb, SE.amb); gl.uniform3fv(P.u.uRim, SE.rim); gl.uniform3fv(P.u.uL, L);
    }
    function drawMesh(m, Mx, cm) {
      cm = cm || ID_CM;
      gl.uniformMatrix3fv(P.u.uCM, false, cm.m); gl.uniform3fv(P.u.uCO, cm.o);
      gl.uniformMatrix4fv(P.u.uM, false, Mx);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.b);
      gl.enableVertexAttribArray(P.a.aP); gl.vertexAttribPointer(P.a.aP, 3, gl.FLOAT, false, 40, 0);
      gl.enableVertexAttribArray(P.a.aN); gl.vertexAttribPointer(P.a.aN, 3, gl.FLOAT, false, 40, 12);
      gl.enableVertexAttribArray(P.a.aC); gl.vertexAttribPointer(P.a.aC, 3, gl.FLOAT, false, 40, 24);
      if (P.a.aF != null) { gl.enableVertexAttribArray(P.a.aF); gl.vertexAttribPointer(P.a.aF, 1, gl.FLOAT, false, 40, 36); }
      gl.drawArrays(gl.TRIANGLES, 0, m.n);
    }
    function drawParts(pose, mirror, alpha) {
      useModelProg(mirror, alpha, pose.flash);
      var list = pose.draw || Object.keys(pose.mats);
      for (var k = 0; k < list.length; k++) { var n = list[k], m = meshes[n], Mx = pose.mats[n]; if (m && Mx) drawMesh(m, Mx, pose.cm && pose.cm[n]); }
    }
    function off() { for (var k = 0; k < 6; k++) gl.disableVertexAttribArray(k); }
    function drawGround(sh, base) {
      off(); gl.useProgram(G.p);
      gl.uniformMatrix4fv(G.u.uPV, false, cam.PV);
      gl.uniform1f(G.u.uR, 13); gl.uniform1f(G.u.uSe, SE.id); gl.uniform3f(G.u.uSh, sh[0], sh[1], sh[2]);
      gl.uniform3fv(G.u.uFog, SE.fog); gl.uniform3fv(G.u.uKey, SE.key); gl.uniform3fv(G.u.uAmb, SE.amb); gl.uniform1f(G.u.uRefl, st.refl && !base ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(G.a.aQ); gl.vertexAttribPointer(G.a.aQ, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6); off();
    }
    function drawRing() {
      off(); gl.useProgram(R.p);
      gl.uniformMatrix4fv(R.u.uPV, false, cam.PV);
      gl.uniform1f(R.u.uRR, 13.4); gl.uniform1f(R.u.uRH, 4.2); gl.uniform3fv(R.u.uC1, CC[0].slice(0, 3)); gl.uniform3fv(R.u.uC2, CC[1].slice(0, 3));
      gl.uniform3fv(R.u.uAmb, SE.amb); gl.uniform3fv(R.u.uKey, SE.key); gl.uniform3fv(R.u.uFog, SE.fog); gl.uniform1f(R.u.uNight, SE.night ? 1 : 0); gl.uniform1f(R.u.uT, st.t);
      gl.bindBuffer(gl.ARRAY_BUFFER, ring); gl.enableVertexAttribArray(R.a.aQ); gl.vertexAttribPointer(R.a.aQ, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, RS * 6); off();
    }
    function stepParticles(dt) {
      var n = 0, t = st.tgt;
      for (var k = 0; k < NP; k++) {
        var q = parts[k]; if (!q.on) continue;
        q.life += dt;
        if (q.life > q.max) { q.on = false; continue; }
        if (q.wx) {
          if (q.t === 9) { q.y -= dt * 7; q.x -= dt * 0.8; }
          else if (q.t === 4) { q.y -= dt * 0.7; q.x += Math.sin(st.t * 1.3 + q.sw) * dt * 0.3; }
          else if (q.t === 5) { q.y -= dt * 0.55; q.x += Math.sin(st.t * 2 + q.sw) * dt * 0.8; q.z += Math.cos(st.t * 1.7 + q.sw) * dt * 0.4; }
          else { q.y -= dt * 0.35; q.x += Math.sin(st.t * 1.5 + q.sw) * dt * 0.5; }
          if (q.y < 0) { q.y = 5; q.x = t[0] + rnd(-6, 6); q.z = t[2] + rnd(-6, 4); }
          if (Math.abs(q.x - t[0]) > 7) q.x = t[0] + rnd(-6, 6);
          if (Math.abs(q.z - t[2]) > 7) q.z = t[2] + rnd(-6, 4);
        } else {
          q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vx *= 1 - 1.5 * dt; q.vz *= 1 - 1.5 * dt;
          if (q.y < 0.01 && q.g > 0) { q.y = 0.01; q.vy = 0; }
          if (q.t === 7) q.x += Math.sin(st.t * 5 + q.sw) * dt * 0.15;
        }
        var fade = q.wx ? 1 : clamp((q.max - q.life) / 0.35, 0, 1), o9 = n * 9;
        pd[o9] = q.x; pd[o9 + 1] = q.y; pd[o9 + 2] = q.z; pd[o9 + 3] = q.s; pd[o9 + 4] = q.t; pd[o9 + 5] = q.c[0]; pd[o9 + 6] = q.c[1]; pd[o9 + 7] = q.c[2]; pd[o9 + 8] = q.c[3] * fade;
        n++;
      }
      return n;
    }
    function drawParticles(n) {
      if (!n) return;
      off(); gl.useProgram(PP.p);
      gl.uniformMatrix4fv(PP.u.uPV, false, cam.PV); gl.uniform1f(PP.u.uH, cv.height * 0.9);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(PP.u.uTex, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pd.subarray(0, n * 9));
      gl.enableVertexAttribArray(PP.a.aP); gl.vertexAttribPointer(PP.a.aP, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(PP.a.aS); gl.vertexAttribPointer(PP.a.aS, 1, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(PP.a.aT); gl.vertexAttribPointer(PP.a.aT, 1, gl.FLOAT, false, 36, 16);
      gl.enableVertexAttribArray(PP.a.aC); gl.vertexAttribPointer(PP.a.aC, 4, gl.FLOAT, false, 36, 20);
      gl.depthMask(false); gl.drawArrays(gl.POINTS, 0, n); gl.depthMask(true); off();
    }
    var stop = Anim.loop(function (dt) {
      if (!cur || cur.el !== el) return false;
      st.t += dt; st.idleT += dt;
      if (!st.auto && st.idleT > 3 && o.auto !== false) st.auto = true;
      if (st.auto && !red && o.auto !== false) st.yaw += dt * 0.35;
      st.frames++;
      if (st.frames > 20 && st.frames < 160 && dt > 1 / 38) st.slow++;
      if (st.slow > 35 && (st.refl || st.dpr > 1)) { st.refl = false; st.dpr = 1; }
      resize();
      var pose = sc.pose(dt, st.t);
      if (pose.target) { st.tgt[0] = damp(st.tgt[0], pose.target[0], 3, dt); st.tgt[1] = damp(st.tgt[1], pose.target[1], 3, dt); st.tgt[2] = damp(st.tgt[2], pose.target[2], 3, dt); }
      camUpdate();
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawRing();
      gl.clear(gl.DEPTH_BUFFER_BIT);
      /* suelo: primero opaco (base), luego el reflejo de los charcos y encima el césped con su transparencia mojada */
      if (st.refl) {
        gl.depthMask(false); drawGround(pose.shadow || [0, 0, 0.6], true); gl.depthMask(true);
        drawParts(pose, true, 0.5); gl.clear(gl.DEPTH_BUFFER_BIT);
      }
      gl.depthMask(false); drawGround(pose.shadow || [0, 0, 0.6]); gl.depthMask(true);
      useModelProg(false, 1, 0); drawMesh(goal, m4());
      drawParts(pose, false, 1);
      drawParticles(stepParticles(dt));
      return true;
    }, {noStop: true});
    cur = {el: el, gl: gl, stop: stop, o: o, onKey: onKey, st: st};
    var from = o.from && o.from.getBoundingClientRect ? o.from.getBoundingClientRect() : null;
    if (from && from.width && !red) {
      var cx = from.left + from.width / 2 - window.innerWidth / 2, cy = from.top + from.height / 2 - window.innerHeight / 2;
      Anim.animate(el, [{opacity: 0, transform: "translate(" + cx + "px," + cy + "px) scale(.25)"}, {opacity: 1, transform: "none"}], {dur: 420, easing: Anim.css.out});
    } else Anim.animate(el, [{opacity: 0}, {opacity: 1}], {dur: 220});
    return true;
  }

  /* ================= jugador ================= */
  var PART_DEPTH = {head: [-3, 3], eyes: [2, 3], torso: [-2, 2], armL: [-1, 1], armR: [-1, 1], legL: [-1, 2], legR: [-1, 2]};
  function playerModel(rects, flash) {
    var parts = {head: [], eyes: [], torso: [], armL: [], armR: [], legL: [], legR: []};
    rects.forEach(function (b) {
      var part = UIX.lifeRigPart(b); if (part === "sh" || !parts[part]) return;
      var fl = flash && flash.indexOf(part) >= 0 ? 1 : 0;
      for (var y = b[1]; y <= b[3]; y++) for (var x = b[0]; x <= b[2]; x++) parts[part].push([x, y, b[4], part, fl]);
    });
    var eyeAt = {}; parts.eyes.forEach(function (c) { eyeAt[c[0] + "," + c[1]] = 1; });
    var depth = function (x, y, part) {
      if (part === "head" && eyeAt[x + "," + y]) return [-3, 2];
      if (part === "head" && (x === 8 || x === 15) && y >= 5 && y <= 6) return [-1, 1];
      if ((part === "legL" || part === "legR") && y >= 32) return [-1, 3];
      return PART_DEPTH[part] || [-1, 1];
    };
    var out = {}; Object.keys(parts).forEach(function (k) { if (parts[k].length) out[k] = new Float32Array(voxelize(parts[k], depth, 34, 1 / 16, 12)); });
    return out;
  }
  var FLASH_OF = {boots: ["legL", "legR"], gloves: ["armL", "armR"], sleeve: ["armL", "armR", "legL", "legR"], band: ["head"], hair: ["head"], hcol: ["head"], skin: ["head", "armL", "armR", "legL", "legR"], cel: []};
  function presentKeys(item) {
    var A = function (t, o, ez) { o.t = t; o.ez = ez || "inOutQuad"; return o; };
    if (item === "cel") return Rig.celKeys();
    if (item === "boots") return Rig.gestures.boots();
    if (item === "sleeve") return Rig.gestures.tug();
    if (item === "skin") return Rig.gestures.stretch();
    if (item === "gloves") return [A(0, {}), A(0.3, {aL: -40, aR: 40}, "outBack"), A(0.42, {aL: -55, aR: 55}), A(0.54, {aL: -40, aR: 40}), A(0.66, {aL: -55, aR: 55}), A(1.0, {aR: -160, hd: -6}, "outBack"), A(1.6, {aR: -160}), A(1.9, {})];
    if (item === "band" || item === "hair" || item === "hcol") return [A(0, {}), A(0.35, {aR: -150, hd: -6, hy: -0.2}, "outBack"), A(0.8, {aR: -140, hd: 6}), A(1.2, {aR: -150, hd: -4}), A(1.6, {})];
    return Rig.gestures.look();
  }
  var CELL = 1 / 16, PIV = {head: [0, (34 - 10) * CELL, 0], armL: [-6 * CELL, (34 - 10.6) * CELL, 0], armR: [6 * CELL, (34 - 10.6) * CELL, 0], legL: [-2.6 * CELL, (34 - 23.6) * CELL, 0], legR: [2.6 * CELL, (34 - 23.6) * CELL, 0]};
  function player(o) {
    o = o || {};
    if (!UIX.myAvatarRects || !UIX.lifeRigPart || !Rig) return false;
    var item = o.item || null;
    return open({
      title: o.title || tr("Tu jugador"), kicker: o.kicker || tr("Vestuario"), from: o.from, dist: 4.1, target: [0, 1.05, 0], pitch0: 0.16, yaw0: -0.5,
      buttons: '<button class="btn" data-v3d="cel">' + h(tr("Celebración")) + "</button>",
      scene: function (ctx) {
        var brain = new Rig.Brain({gestures: ["look", "tug", "stretch", "juggle", "boots"]}), flashT = item ? 0 : 99, land = true;
        brain.mood = Rig.playerMood(); brain.play(Rig.gestures.land(), true);
        if (item) setTimeout(function () { brain.play(presentKeys(item)); }, 650);
        function confetti(n) { for (var i = 0; i < n; i++) ctx.spawn({x: rnd(-0.6, 0.6), y: rnd(1.2, 2.2), z: rnd(-0.3, 0.5), vx: rnd(-1.2, 1.2), vy: rnd(1, 2.6), vz: rnd(-0.4, 1.2), g: 3.5, t: i % 2 ? 1 : 8, s: i % 2 ? 0.13 : 0.06, max: 1.3, c: i % 2 ? [1, 1, 1, 1] : [[1, 0.7, 0.1, 1], [0.25, 0.8, 0.5, 1], [1, 1, 1, 1]][i % 3]}); }
        return {
          parts: playerModel(UIX.myAvatarRects(), item ? FLASH_OF[item] : null),
          onButton: function (v) { if (v === "cel") { brain.play(Rig.celKeys(), true); setTimeout(function () { confetti(16); }, 500); } },
          pose: function (dt) {
            var Pz = brain.step(dt, false);
            flashT += dt;
            var fl = flashT < 1.6 ? Math.max(0, Math.sin(flashT * PI * 3)) * (1 - flashT / 1.6) : 0;
            if (flashT > 0.6 && land && item) { land = false; confetti(22); Anim.haptic("ok"); }
            var root = M(T(Pz.bx * CELL, -Pz.by * CELL, 0), RY(Pz.yaw * D2R), about([0, 0.95, 0], RX(Pz.pitch * D2R)), about([0, 0.95, 0], RZ(-(Pz.br - Pz.pitch) * D2R)), Sc(1 + Pz.sx, 1 + Pz.sy, 1 + Pz.sx));
            var up = about([0, 10 * CELL, 0], Sc(1, 1 + Pz.tor, 1));
            var mats = {
              torso: mul(root, up),
              head: M(root, up, T(Pz.hx * CELL, -Pz.hy * CELL, 0), about(PIV.head, RZ(-Pz.hd * D2R))),
              armL: M(root, up, about(PIV.armL, RZ(-Pz.aL * D2R))), armR: M(root, up, about(PIV.armR, RZ(-Pz.aR * D2R))),
              legL: M(root, about(PIV.legL, RZ(-Pz.lL * D2R))), legR: M(root, about(PIV.legR, RZ(-Pz.lR * D2R)))
            };
            mats.eyes = M(mats.head, about([0, (34 - 5.5) * CELL, 0], Sc(1, Math.max(0.15, 1 - Pz.eye), 1)));
            var hgt = Math.max(0, -Pz.by * CELL);
            return {mats: mats, flash: fl, shadow: [Pz.bx * CELL, 0, Math.max(0.35, 0.75 - hgt * 0.5)], target: [0, 1.05, 0]};
          }
        };
      }
    });
  }

  /* ================= mascota (estilo Nintendogs sencillo) ================= */
  var PALX = {K: "#1b1b24", W: "#ffffff", w: "#d8dde3", g: "#8a929c", R: "#e2403a", O: "#f08a24", o: "#b3561a", Y: "#f6c83a", y: "#c08a1c",
    N: "#4cb84a", n: "#2a7a32", B: "#3a7ad8", b: "#23468e", S: "#f2c09a", T: "#8a5a34", t: "#5a3a20", M: "#f070a8"};
  /* especies: formas simples con los colores del sprite. Medidas en unidades del mundo (perro adulto ≈ 0,6 de alto) */
  var SPEC = {
    dog: {kind: "quad", c1: PALX.T, c2: PALX.S, c3: PALX.t, nose: PALX.K, body: [0.3, 0.17, 0.17], leg: [0.2, 0.05], head: 0.17, snout: [0.12, 0.075], ears: "floppy", tail: "wag", tongue: true, gait: "trot", speed: 1.1},
    cat: {kind: "quad", c1: PALX.O, c2: PALX.W, c3: PALX.o, nose: PALX.M, body: [0.28, 0.14, 0.14], leg: [0.19, 0.042], head: 0.15, snout: [0.05, 0.06], ears: "pointy", tail: "long", stripes: true, gait: "trot", speed: 0.9},
    rabbit: {kind: "quad", c1: PALX.w, c2: PALX.W, c3: PALX.M, nose: PALX.M, body: [0.22, 0.16, 0.15], leg: [0.09, 0.045], head: 0.14, snout: [0.05, 0.06], ears: "long", tail: "cotton", gait: "hop", speed: 1.0},
    hamster: {kind: "quad", c1: PALX.O, c2: PALX.W, c3: PALX.M, nose: PALX.M, body: [0.15, 0.13, 0.13], leg: [0.04, 0.03], head: 0.115, snout: [0.03, 0.05], ears: "round", tail: "none", cheeks: true, gait: "scurry", speed: 0.9},
    fennec: {kind: "quad", c1: "#e6c48e", c2: PALX.W, c3: "#d9a86a", nose: PALX.K, body: [0.24, 0.12, 0.12], leg: [0.18, 0.035], head: 0.13, snout: [0.1, 0.055], ears: "huge", tail: "bushy", gait: "trot", speed: 1.3},
    capybara: {kind: "quad", c1: "#8f6c48", c2: "#7d5c3c", c3: "#5e4430", nose: "#2a201a", body: [0.34, 0.2, 0.2], leg: [0.13, 0.06], head: 0.15, snout: [0.13, 0.11], ears: "round", tail: "none", gait: "walk", speed: 0.55, orange: true},
    hedgehog: {kind: "quad", c1: "#c88a62", c2: PALX.S, c3: PALX.t, nose: PALX.K, body: [0.17, 0.12, 0.14], leg: [0.04, 0.03], head: 0.1, snout: [0.09, 0.04], ears: "round", tail: "none", spikes: true, gait: "scurry", speed: 0.9},
    iguana: {kind: "quad", c1: PALX.N, c2: "#8fd47a", c3: PALX.n, nose: PALX.n, body: [0.3, 0.08, 0.1], leg: [0.07, 0.03], head: 0.09, snout: [0.09, 0.055], ears: "none", tail: "lizard", spikes: "dorsal", gait: "walk", speed: 0.8, splay: true},
    turtle: {kind: "turtle", c1: "#7fbf5a", c2: PALX.n, c3: PALX.N, nose: PALX.n, body: [0.22, 0.12, 0.18], leg: [0.05, 0.045], head: 0.075, snout: [0.04, 0.05], ears: "none", tail: "stub", gait: "walk", speed: 0.25},
    macaw: {kind: "bird", c1: PALX.R, c2: PALX.W, c3: PALX.B, c4: PALX.Y, nose: "#e8e2d0", body: [0.12, 0.16, 0.12], leg: [0.07, 0.02], head: 0.1, snout: [0.08, 0.05], gait: "hop", speed: 0.7},
    fish: {kind: "fish", c1: PALX.B, c2: PALX.W, c3: PALX.b, nose: PALX.b, body: [0.22, 0.13, 0.08], head: 0, gait: "swim", speed: 0.7},
    python: {kind: "snake", c1: PALX.N, c2: PALX.Y, c3: PALX.n, nose: PALX.n, body: [0.06, 0.06, 0.06], head: 0.085, gait: "slither", speed: 0.5},
    tarantula: {kind: "spider", c1: PALX.t, c2: PALX.T, c3: PALX.R, nose: PALX.K, body: [0.11, 0.09, 0.1], leg: [0.16, 0.018], head: 0.08, gait: "scurry", speed: 1.0}
  };
  function specOf(pt) {
    var sp = Object.assign({}, SPEC[pt.k] || SPEC.dog), ico = nf(petIco(pt));
    if (pt.k === "fish") { if (ico === "🐠") { sp.c1 = PALX.O; sp.c2 = PALX.W; sp.c3 = PALX.Y; sp.rings = true; } else if (ico === "🐡") { sp.c1 = PALX.Y; sp.c2 = "#ffe98a"; sp.c3 = PALX.y; sp.puffer = true; sp.body = [0.16, 0.16, 0.16]; } }
    if (pt.k === "dog" && ico === "🦮") { sp.c1 = PALX.Y; sp.c2 = "#fff0c0"; sp.c3 = PALX.y; sp.harness = true; }
    var stg = petStage(pt);
    sp.scale = [0.72, 0.88, 1, 1][stg]; sp.headK = [1.28, 1.12, 1, 1][stg]; sp.senior = stg === 3;
    return sp;
  }
  /* modelo por partes con pivotes; la mascota mira hacia +z */
  function petModel(sp) {
    var P = {}, piv = {}, s = sp.scale, B = sp.body.map(function (v) { return v * s; }), legL = (sp.leg ? sp.leg[0] : 0) * s, legR = (sp.leg ? sp.leg[1] : 0) * s;
    var hr = (sp.head || 0) * s * sp.headK, c1 = sp.c1, c2 = sp.senior ? mix(sp.c2, "#ffffff", 0.35) : sp.c2, c3 = sp.c3;
    var bodyY = legL + B[1] * 0.85, A, i;
    function part(n) { return (P[n] = P[n] || []); }
    /* ojos aparte para que parpadeen y se cierren de gusto */
    function eyes(cx, cy, cz, r, sep) {
      var E = part("eyes");
      [-1, 1].forEach(function (sd) {
        ellipsoid(E, [cx + sd * sep, cy, cz], [r, r * 1.15, r * 0.6], PALX.K, 10, 8);
        ellipsoid(E, [cx + sd * sep - r * 0.3, cy + r * 0.4, cz + r * 0.45], [r * 0.32, r * 0.32, r * 0.2], "#ffffff", 6, 4);
      });
      piv.eyes = [cx, cy, cz];
    }
    if (sp.kind === "quad" || sp.kind === "turtle") {
      A = part("body");
      if (sp.kind === "turtle") {
        ellipsoid(A, [0, bodyY, 0], [B[2] * 0.9, B[1] * 0.55, B[0] * 0.9], c1, 12, 8);
        A = part("shell");
        ellipsoid(A, [0, bodyY + B[1] * 0.2, 0], [B[2], B[1], B[0]], function (u) { var a = Math.atan2(u[2], u[0]), r = Math.acos(clamp(u[1], -1, 1)); return u[1] < 0.05 ? c3 : ((Math.floor(a * 3) + Math.floor(r * 5)) % 2 ? sp.c2 : c3); }, 16, 10);
      } else {
        ellipsoid(A, [0, bodyY, 0], [B[2], B[1], B[0]], sp.stripes ? function (u) { return u[1] < -0.35 ? c2 : (Math.floor((u[2] + 1) * 4) % 2 && u[1] > 0 ? c3 : c1); } : function (u) { return u[1] < -0.35 ? c2 : c1; }, 16, 10);
        if (sp.harness) box(A, -B[2] * 1.02, bodyY - B[1] * 0.2, B[0] * 0.15, B[2] * 1.02, bodyY + B[1] * 1.02, B[0] * 0.32, PALX.R);
        if (sp.spikes === true) {
          for (i = 0; i < 46; i++) { var th = rnd(0.05, 1.45), ph = rnd(0, 2 * PI), dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph);
            if (dz > 0.75) continue;
            cone(A, [dx * B[2] * 0.9, bodyY + dy * B[1] * 0.9, dz * B[0] * 0.9], [dx * B[2] * 1.45, bodyY + dy * B[1] * 1.5, dz * B[0] * 1.3 - 0.04], 0.025 * s, i % 3 ? c3 : PALX.T, 5); }
        }
        if (sp.spikes === "dorsal") for (i = -3; i <= 3; i++) cone(A, [0, bodyY + B[1] * 0.85, i * B[0] * 0.25], [0, bodyY + B[1] * 1.5, i * B[0] * 0.25 - 0.02], 0.02 * s, c3, 5);
      }
      piv.body = [0, bodyY, 0];
      var hz = B[0] * 0.92, hy = bodyY + B[1] * 0.85 + hr * 0.25;
      if (sp.splay) hy = bodyY + hr * 0.3;
      if (sp.kind === "turtle") { hz = B[0] * 1.05; hy = bodyY + 0.01; }
      A = part("head");
      ellipsoid(A, [0, hy, hz], [hr, hr * 0.95, hr * (sp.splay ? 1.1 : 1)], function (u) { return u[1] < -0.45 ? c2 : c1; }, 14, 10);
      if (sp.cheeks) [-1, 1].forEach(function (sd) { ellipsoid(A, [sd * hr * 0.62, hy - hr * 0.35, hz + hr * 0.35], [hr * 0.45, hr * 0.38, hr * 0.4], c2, 8, 6); });
      var sl = (sp.snout ? sp.snout[0] : 0) * s, sr = (sp.snout ? sp.snout[1] : 0) * s, sy = hy - hr * 0.3, szn = hz + hr * 0.8;
      ellipsoid(A, [0, sy, szn + sl * 0.3], [sr * 1.05, sr * 0.8, sl * 0.6 + sr * 0.5], c2, 10, 8);
      ellipsoid(A, [0, sy + sr * 0.35, szn + sl * 0.9 + sr * 0.4], [sr * 0.35, sr * 0.28, sr * 0.25], sp.nose, 8, 6);
      eyes(0, hy + hr * 0.15, hz + hr * 0.82, hr * 0.15, hr * 0.42);
      if (sp.tongue) { A = part("tongue"); ellipsoid(A, [0, sy - sr * 0.75, szn + sl * 0.45], [sr * 0.4, sr * 0.12, sr * 0.6], PALX.M, 8, 4); piv.tongue = [0, sy - sr * 0.6, szn]; }
      if (sp.orange) { A = part("orange"); ellipsoid(A, [0, 0.045, 0], [0.05, 0.045, 0.05], "#f39a1f", 10, 8); cone(A, [0, 0.085, 0], [0.015, 0.11, 0], 0.012, PALX.n, 4); }
      piv.head = [0, hy - hr * 0.6, hz - hr * 0.5];
      piv.headTop = [0, hy + hr * 0.95, hz]; piv.face = [0, hy + hr * 0.15, hz + hr * 0.9]; piv.neck = [0, hy - hr * 0.95, hz - hr * 0.2]; piv.mouth = [0, sy - sr * 0.3, szn + sl * 0.9 + sr * 0.6]; piv.hr = hr;
      [-1, 1].forEach(function (sd) {
        var n = sd < 0 ? "earL" : "earR", ex = sd * hr * 0.62, ey = hy + hr * 0.7, ez = hz - hr * 0.05;
        if (sp.ears === "none" || !sp.ears) return;
        var E = part(n);
        if (sp.ears === "floppy") { ellipsoid(E, [sd * hr * 0.95, hy + hr * 0.05, ez], [hr * 0.22, hr * 0.55, hr * 0.38], c3, 8, 6); piv[n] = [sd * hr * 0.85, hy + hr * 0.55, ez]; }
        else if (sp.ears === "pointy") { cone(E, [ex, ey - hr * 0.1, ez], [sd * hr * 0.8, ey + hr * 0.6, ez], hr * 0.32, c1, 8, 0, 0.45); cone(E, [ex, ey - hr * 0.05, ez + hr * 0.06], [sd * hr * 0.78, ey + hr * 0.45, ez + hr * 0.07], hr * 0.18, PALX.M, 6, 0, 0.4); piv[n] = [ex, ey, ez]; }
        else if (sp.ears === "huge") { cone(E, [ex, ey - hr * 0.1, ez], [sd * hr * 1.5, ey + hr * 1.4, ez - hr * 0.1], hr * 0.55, c1, 8, 0, 0.35); cone(E, [ex, ey, ez + hr * 0.08], [sd * hr * 1.45, ey + hr * 1.25, ez - hr * 0.02], hr * 0.35, PALX.M, 6, 0, 0.3); piv[n] = [ex, ey, ez]; }
        else if (sp.ears === "long") { ellipsoid(E, [sd * hr * 0.4, ey + hr * 0.75, ez - hr * 0.1], [hr * 0.2, hr * 0.8, hr * 0.13], c1, 8, 6); ellipsoid(E, [sd * hr * 0.4, ey + hr * 0.75, ez - hr * 0.02], [hr * 0.11, hr * 0.62, hr * 0.06], c3, 6, 4); piv[n] = [sd * hr * 0.4, ey, ez]; }
        else if (sp.ears === "round") { ellipsoid(E, [sd * hr * 0.6, ey + hr * 0.05, ez], [hr * 0.25, hr * 0.25, hr * 0.12], sp.cheeks ? c3 : c1, 8, 6); piv[n] = [sd * hr * 0.6, ey - hr * 0.1, ez]; }
      });
      var lx = B[2] * (sp.splay ? 1.05 : 0.62), lzF = B[0] * 0.58, lzB = -B[0] * 0.6;
      [["legFL", -lx, lzF], ["legFR", lx, lzF], ["legBL", -lx, lzB], ["legBR", lx, lzB]].forEach(function (L) {
        var top = [L[1], bodyY - B[1] * 0.2, L[2]], foot = [L[1] * (sp.splay ? 1.35 : 1), legR * 0.9, L[2]];
        A = part(L[0]); capsule(A, top, foot, legR * 1.1, legR, c1, 8);
        ellipsoid(A, [foot[0], legR * 0.6, foot[2] + legR * 0.4], [legR * 1.25, legR * 0.7, legR * 1.5], sp.kind === "turtle" ? c1 : c2, 8, 6);
        piv[L[0]] = top;
      });
      var tz = -B[0] * 0.95, ty = bodyY + B[1] * 0.35;
      if (sp.tail && sp.tail !== "none") {
        A = part("tail");
        if (sp.tail === "wag") capsule(A, [0, ty, tz], [0, ty + 0.12 * s, tz - 0.1 * s], 0.025 * s, 0.018 * s, c1, 6);
        else if (sp.tail === "long") { capsule(A, [0, ty, tz], [0, ty + 0.08 * s, tz - 0.16 * s], 0.025 * s, 0.022 * s, c1, 6); capsule(A, [0, ty + 0.08 * s, tz - 0.16 * s], [0, ty + 0.24 * s, tz - 0.2 * s], 0.022 * s, 0.02 * s, c3, 6); }
        else if (sp.tail === "bushy") { ellipsoid(A, [0, ty + 0.05 * s, tz - 0.14 * s], [0.06 * s, 0.07 * s, 0.17 * s], c1, 10, 8); ellipsoid(A, [0, ty + 0.08 * s, tz - 0.29 * s], [0.045 * s, 0.05 * s, 0.05 * s], "#3a2a1a", 8, 6); }
        else if (sp.tail === "cotton") ellipsoid(A, [0, ty + 0.02, tz], [0.05 * s, 0.05 * s, 0.05 * s], "#ffffff", 8, 6);
        else if (sp.tail === "lizard") { var px = [0, ty - 0.02, tz]; for (var j = 1; j <= 5; j++) { var nx = [0, ty - 0.02 - j * 0.012, tz - j * 0.09 * s]; capsule(A, px, nx, 0.04 * s * (1 - (j - 1) / 6), 0.04 * s * (1 - j / 6), j % 2 ? c1 : c3, 6); px = nx; } }
        else if (sp.tail === "stub") ellipsoid(A, [0, ty - 0.03, tz], [0.02, 0.02, 0.04], c1, 6, 4);
        piv.tail = [0, ty, tz];
      }
    } else if (sp.kind === "bird") {
      var by = legL + B[1] * 1.0;
      A = part("body"); ellipsoid(A, [0, by, 0], [B[0], B[1], B[2]], function (u) { return u[2] > 0.5 && u[1] < 0.1 ? sp.c4 : c1; }, 14, 10);
      piv.body = [0, by, 0];
      A = part("head"); var bh = by + B[1] * 0.95 + hr * 0.4, bz = B[2] * 0.3;
      ellipsoid(A, [0, bh, bz], [hr, hr, hr], c1, 12, 8);
      ellipsoid(A, [0, bh - hr * 0.05, bz + hr * 0.55], [hr * 0.8, hr * 0.6, hr * 0.5], c2, 10, 6);
      cone(A, [0, bh - hr * 0.1, bz + hr * 0.9], [0, bh - hr * 0.75, bz + hr * 1.55], hr * 0.38, sp.nose, 8);
      cone(A, [0, bh - hr * 0.35, bz + hr * 0.85], [0, bh - hr * 0.55, bz + hr * 1.15], hr * 0.22, PALX.K, 6);
      eyes(0, bh + hr * 0.15, bz + hr * 0.7, hr * 0.14, hr * 0.5);
      piv.head = [0, bh - hr * 0.7, bz]; piv.headTop = [0, bh + hr, bz]; piv.face = [0, bh + hr * 0.15, bz + hr * 0.85]; piv.neck = [0, bh - hr * 0.9, bz]; piv.mouth = [0, bh - hr * 0.7, bz + hr * 1.5]; piv.hr = hr;
      [-1, 1].forEach(function (sd) { var n = sd < 0 ? "wingL" : "wingR", E = part(n);
        ellipsoid(E, [sd * B[0] * 1.0, by + B[1] * 0.1, -B[2] * 0.15], [B[0] * 0.28, B[1] * 0.8, B[2] * 0.75], function (u) { return u[1] < -0.2 ? sp.c4 : c3; }, 10, 8);
        piv[n] = [sd * B[0] * 0.85, by + B[1] * 0.6, 0]; });
      A = part("tail"); cone(A, [0, by - B[1] * 0.5, -B[2] * 0.6], [0, by - B[1] * 1.6, -B[2] * 2.4], B[0] * 0.45, c3, 8, 0, 0.35); piv.tail = [0, by - B[1] * 0.5, -B[2] * 0.6];
      [["legFL", -0.04], ["legFR", 0.04]].forEach(function (L) { A = part(L[0]); capsule(A, [L[1] * s, legL + 0.02, 0.02], [L[1] * s, 0.015, 0.03], 0.014 * s, 0.012 * s, PALX.g, 6); piv[L[0]] = [L[1] * s, legL + 0.02, 0.02]; });
    } else if (sp.kind === "fish") {
      A = part("body");
      if (sp.puffer) {
        ellipsoid(A, [0, 0, 0], [B[0], B[1], B[2]], function (u) { return u[1] < -0.3 ? sp.c2 : c1; }, 14, 10);
        for (i = 0; i < 30; i++) { var t2 = rnd(0.2, 2.9), p2 = rnd(0, 2 * PI), d = [Math.sin(t2) * Math.cos(p2), Math.cos(t2), Math.sin(t2) * Math.sin(p2)]; cone(A, [d[0] * B[0] * 0.92, d[1] * B[1] * 0.92, d[2] * B[2] * 0.92], [d[0] * B[0] * 1.25, d[1] * B[1] * 1.25, d[2] * B[2] * 1.25], 0.02 * s, sp.c3, 4); }
        eyes(0, B[1] * 0.35, B[2] * 0.85, B[0] * 0.17, B[0] * 0.45);
      } else {
        ellipsoid(A, [0, 0, 0], [B[2], B[1], B[0]], sp.rings ? function (u) { return Math.abs(u[2] - 0.25) < 0.1 || Math.abs(u[2] + 0.3) < 0.1 ? sp.c2 : c1; } : function (u) { return u[1] < -0.3 ? sp.c2 : c1; }, 16, 10);
        var E2 = part("eyes"); [-1, 1].forEach(function (sd) { ellipsoid(E2, [sd * B[2] * 0.72, B[1] * 0.25, B[0] * 0.55], [B[2] * 0.22, B[2] * 0.26, B[2] * 0.12], PALX.K, 8, 6); ellipsoid(E2, [sd * B[2] * 0.82, B[1] * 0.32, B[0] * 0.6], [B[2] * 0.08, B[2] * 0.08, B[2] * 0.05], "#fff", 6, 4); });
        piv.eyes = [0, B[1] * 0.25, B[0] * 0.55];
        cone(A, [0, B[1] * 0.8, 0], [0, B[1] * 1.45, -B[0] * 0.25], B[0] * 0.3, sp.c3, 8, 0, 0.2);
      }
      A = part("tail"); cone(A, [0, 0, -B[0] * 0.85], [0, 0, -B[0] * 1.6], B[1] * 0.85, sp.c3, 10, 0, 0.18); piv.tail = [0, 0, -B[0] * 0.85];
      piv.body = [0, 0, 0]; piv.head = [0, 0, B[0] * 0.5]; piv.headTop = [0, B[1], B[0] * 0.35]; piv.face = [0, B[1] * 0.25, B[0] * 0.85]; piv.neck = [0, -B[1] * 0.2, B[0] * 0.55]; piv.mouth = [0, 0, B[0] * 1.0]; piv.hr = B[1] * 0.8;
    } else if (sp.kind === "snake") {
      for (i = 0; i < 12; i++) { A = part("seg" + i); var rr = B[0] * (1 - i / 16); ellipsoid(A, [0, rr, 0], [rr, rr, rr * 1.3], function (u) { return u[1] < -0.3 ? sp.c2 : ((Math.floor((u[0] + 1) * 3) % 2) ? c1 : c3); }, 10, 6); }
      A = part("head"); ellipsoid(A, [0, hr * 0.8, 0], [hr * 0.9, hr * 0.7, hr * 1.2], c1, 12, 8); eyes(0, hr * 1.15, hr * 0.9, hr * 0.15, hr * 0.5);
      A = part("tongue"); capsule(A, [0, hr * 0.6, hr * 1.1], [0, hr * 0.6, hr * 1.6], 0.008, 0.006, PALX.R, 4); piv.tongue = [0, hr * 0.6, hr * 1.1];
      piv.head = [0, hr * 0.8, 0]; piv.headTop = [0, hr * 1.4, 0]; piv.face = [0, hr * 1.1, hr * 1.0]; piv.neck = [0, hr * 0.5, -hr * 0.5]; piv.mouth = [0, hr * 0.6, hr * 1.4]; piv.hr = hr;
      piv.body = [0, 0, 0];
    } else if (sp.kind === "spider") {
      var sy2 = 0.1 * s;
      A = part("body"); ellipsoid(A, [0, sy2 + B[1] * 0.4, -B[2] * 1.1], [B[0] * 1.1, B[1] * 1.05, B[2] * 1.2], c1, 12, 8); ellipsoid(A, [0, sy2 + B[1] * 0.25, 0], [B[0] * 0.75, B[1] * 0.65, B[2] * 0.75], sp.c2, 12, 8);
      for (i = 0; i < 4; i++) ellipsoid(A, [(i - 1.5) * 0.018 * s, sy2 + B[1] * 0.6, B[2] * 0.65], [0.01 * s, 0.01 * s, 0.008 * s], sp.c3, 6, 4);
      for (i = 0; i < 8; i++) { var sd2 = i < 4 ? -1 : 1, k2 = i % 4, n2 = "leg" + i; A = part(n2); var a2 = (k2 - 1.5) * 0.45, x0 = sd2 * B[0] * 0.6, z0 = (1.5 - k2) * 0.04 * s;
        var knee = [x0 + sd2 * Math.cos(a2) * 0.12 * s, sy2 + 0.1 * s, z0 + Math.sin(a2) * 0.12 * s], ft = [x0 + sd2 * Math.cos(a2) * 0.22 * s, 0.005, z0 + Math.sin(a2) * 0.22 * s];
        capsule(A, [x0, sy2 + B[1] * 0.2, z0], knee, 0.016 * s, 0.014 * s, c1, 6); capsule(A, knee, ft, 0.014 * s, 0.01 * s, c1, 6); piv[n2] = [x0, sy2 + B[1] * 0.2, z0]; }
      piv.body = [0, sy2, 0]; piv.head = [0, sy2, 0]; piv.headTop = [0, sy2 + B[1] * 0.9, 0]; piv.face = [0, sy2 + B[1] * 0.6, B[2] * 0.7]; piv.neck = [0, sy2 + B[1] * 0.1, B[2] * 0.4]; piv.mouth = [0, sy2, B[2] * 0.8]; piv.hr = B[0] * 0.6;
    }
    var out = {}; Object.keys(P).forEach(function (k) { if (P[k].length) out[k] = new Float32Array(P[k]); });
    return {parts: out, piv: piv, bodyY: piv.body ? piv.body[1] : 0, size: Math.max(B[0], B[2]) * 1.4 + hr};
  }
  /* accesorios: sus mismos sprites de píxeles en vóxeles finos, en la cabeza, la cara, el cuello o como juguete */
  function accModel(aico, slot, mdl) {
    if (typeof PX === "undefined" || !PX.iconGrid || !PX.bboxOf) return null;
    var g = PX.iconGrid(nf(aico)); if (!g) return null;
    var bb = PX.bboxOf(g); if (!bb) return null;
    var hr = mdl.piv.hr || 0.1, bw = bb[2] - bb[0] + 1, want = slot === "h" ? hr * 1.7 : slot === "f" ? hr * 1.5 : slot === "n" ? hr * 1.7 : 0.16;
    var s = want / bw, cx = (bb[0] + bb[2] + 1) / 2;
    var A = voxelize(gridCells(g), function () { return [0, 1]; }, 12, s, cx);
    var top = (12 - bb[1]) * s, bot = (12 - bb[3] - 1) * s, mid = (top + bot) / 2;
    var oy = slot === "h" ? -bot : slot === "f" ? -mid : slot === "n" ? -(top - s * 0.5) : -bot;
    return {v: new Float32Array(A), oy: oy, s: s};
  }

  function pet(o) {
    o = o || {};
    if (typeof petOf !== "function" || !Rig) return false;
    var pt = petOf(); if (!pt) return false;
    var sp = specOf(pt), mdl = petModel(sp), red = Anim.reduced();
    var eq = petEq(pt), accs = {}, newAcc = o.acc || null, accDrop = {};
    PET_SLOT.forEach(function (sl) {
      var k = eq[sl[0]]; if (!k || !petHasAcc(k)) return;
      var a = petAccDef(k), am = accModel(a.ico, sl[0], mdl); if (!am) return;
      accs[sl[0]] = {m: am, k: k};
      if (sl[0] !== "t") mdl.parts["acc_" + sl[0]] = am.v;
      if (k === newAcc) accDrop[sl[0]] = 0;
    });
    /* el juguete del hueco «juguete» (hueso, peluche…) es lo que se lanza; si no hay, un balón */
    var ballA = []; ellipsoid(ballA, [0, 0.05, 0], [0.05, 0.05, 0.05], function (u) {
      var D = [[0, 1, 0], [0, -1, 0], [0.89, 0.45, 0], [-0.89, -0.45, 0], [0.28, 0.45, 0.85], [-0.28, -0.45, -0.85], [0.28, 0.45, -0.85], [-0.28, -0.45, 0.85], [-0.72, 0.45, 0.53], [0.72, -0.45, -0.53], [-0.72, 0.45, -0.53], [0.72, -0.45, 0.53]];
      for (var i = 0; i < D.length; i++) if (u[0] * D[i][0] + u[1] * D[i][1] + u[2] * D[i][2] > 0.9) return "#1e2427"; return "#f4f6f0"; }, 14, 10);
    mdl.parts.ball = accs.t ? accs.t.m.v : new Float32Array(ballA);
    var col = petColDef(pt.col || "nat"), rainbow = col[2] === "anim", CM = cssFilterMat(rainbow ? "" : col[2]);
    var tricks = Rig.knownTricks(pt), trickO = o.trick != null ? Rig.speciesTricks(pt)[o.trick] : null;
    var btns = '<div class="v3d-tricks"><button class="btn" data-v3d="ball">' + h(tr("Lanzar pelota")) + "</button>" +
      tricks.map(function (tk, i) { return '<button class="btn' + (trickO && trickO.k === tk.k ? " pri" : "") + '" data-v3d="t' + i + '">' + h(tr(tk.n)) + "</button>"; }).join("") + "</div>";
    return open({
      title: o.title || pt.nm, kicker: o.kicker || (trickO ? tr("¡Truco nuevo!") : newAcc ? tr("Accesorio nuevo") : tr("Tu mascota")), from: o.from,
      hint: tr("Acaríciale arrastrando sobre él · toca el césped para llamarle · pellizca para acercar"),
      dist: clamp(1.3 + mdl.size * 3.4, 1.7, 3.2), dmin: 1.1, dmax: 4.5, target: [0, mdl.bodyY * 0.8 + (sp.kind === "fish" ? 0.45 : 0), 0.3], pitch0: 0.38, yaw0: 0, auto: false, buttons: btns,
      scene: function (ctx) { return petScene(ctx, pt, sp, mdl, accs, accDrop, CM, rainbow, tricks, trickO, red); }
    });
  }

  /* comportamiento y animación de la mascota */
  function petScene(ctx, pt, sp, mdl, accs, accDrop, CM, rainbow, tricks, trickO, red) {
    var piv = mdl.piv, s = sp.scale, fly = sp.kind === "fish" ? 0.55 : 0, rootM = m4();
    var S2 = {x: 0, z: 0.3, yaw: 0, v: 0, gait: 0, mode: "idle", t: 0, target: null, sit: 0, lie: 0, belly: 0, happy: 0, blink: -1, blinkN: 2,
      headYaw: 0, headPitch: 0, tailAmp: 0.4, wagT: 0, trick: null, trickT: 0, pet: 0, heartT: 0, idleN: rnd(1.5, 3), curl: 0, hide: 0, sniff: 0, earT: 0, earPerk: 0, sitHold: 0, happyHold: 0, idleActT: 0};
    var ball = {on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rest: false, held: false, spin: 0};
    function camXZ() { return [ctx.cam.eye[0], ctx.cam.eye[2]]; }
    function worldOf(p) { return tp(rootM, p[0], p[1], p[2]); }
    function faceTo(x, z, dt, k) { var want = Math.atan2(x - S2.x, z - S2.z); S2.yaw += angDiff(S2.yaw, want) * Math.min(1, (k || 6) * dt); }
    function hearts(n, t) { var hp = worldOf(piv.headTop); for (var i = 0; i < (n || 1); i++) ctx.spawn({x: hp[0] + rnd(-0.06, 0.06), y: hp[1] + 0.05, z: hp[2] + rnd(-0.06, 0.06), vx: rnd(-0.15, 0.15), vy: rnd(0.35, 0.6), vz: rnd(-0.1, 0.1), g: -0.1, t: t == null ? 0 : t, s: 0.075, max: 1.3, keep: true}); }
    function dust(n) { for (var i = 0; i < n; i++) ctx.spawn({x: S2.x + rnd(-0.1, 0.1), y: 0.02, z: S2.z + rnd(-0.1, 0.1), vx: rnd(-0.4, 0.4), vy: rnd(0.2, 0.5), vz: rnd(-0.4, 0.4), g: 1, t: 8, s: 0.035, c: ctx.season.k === "winter" ? [1, 1, 1, 0.8] : [0.7, 0.6, 0.45, 0.7], max: 0.6}); }
    /* trucos: duración y deformaciones en función del tiempo */
    var E = Anim.ease;
    var TR = {
      spin: {d: 1.1, f: function (t, Q) { var k = clamp((t - 0.15) / 0.75, 0, 1); Q.yaw += E.inOutQuad(k) * 2 * PI; Q.jump += Math.sin(k * PI) * 0.12; if (t < 0.15) Q.sq = -0.15 * Math.sin(t / 0.15 * PI); }},
      sit: {d: 1.8, f: function (t, Q) { Q.sit = Math.min(1, t / 0.3) * (t > 1.5 ? 1 - (t - 1.5) / 0.3 : 1); Q.look = "cam"; }},
      jump: {d: 0.9, f: function (t, Q) { if (t < 0.15) Q.sq = -0.2 * Math.sin(t / 0.15 * PI); else if (t < 0.75) { var k = (t - 0.15) / 0.6; Q.jump += Math.sin(k * PI) * 0.45 * s; Q.pitch -= Math.sin(k * PI) * 0.25; } else Q.sq = -0.18 * Math.sin((t - 0.75) / 0.15 * PI); }},
      paw: {d: 1.8, f: function (t, Q) { Q.sit = Math.min(1, t / 0.3) * (t > 1.5 ? 1 - (t - 1.5) / 0.3 : 1); Q.paw = t > 0.35 && t < 1.45 ? 0.6 + 0.4 * Math.sin((t - 0.35) * 14) : 0; Q.look = "cam"; }},
      roll: {d: 1.3, f: function (t, Q) { var k = clamp((t - 0.2) / 0.9, 0, 1); Q.lie = Math.sin(Math.min(1, t / 0.2) * PI / 2) * (t > 1.1 ? 1 - (t - 1.1) / 0.2 : 1); Q.roll += E.inOutQuad(k) * 2 * PI; }},
      dead: {d: 2.4, f: function (t, Q) { var k = t < 0.35 ? E.outBounce(t / 0.35) : t > 2.0 ? 1 - (t - 2.0) / 0.4 : 1; Q.roll += k * PI / 2; Q.lie = k; Q.eyesShut = t > 0.3 && t < 2.0; Q.legsStiff = k; if (t > 2.0) Q.jump += Math.sin((t - 2.0) / 0.4 * PI) * 0.15; }},
      dance: {d: 2.0, f: function (t, Q) { Q.stand = Math.min(1, t / 0.3) * (t > 1.7 ? 1 - (t - 1.7) / 0.3 : 1); Q.yaw += Math.sin(t * 7) * 0.4; Q.roll += Math.sin(t * 7) * 0.12; Q.paw = 0.5 + 0.5 * Math.sin(t * 14); Q.notes = true; }},
      flip: {d: 1.1, f: function (t, Q) { if (t < 0.18) Q.sq = -0.22 * Math.sin(t / 0.18 * PI); else if (t < 0.9) { var k = (t - 0.18) / 0.72; Q.jump += Math.sin(k * PI) * 0.6 * s; Q.pitch -= E.inOutQuad(k) * 2 * PI; } else Q.sq = -0.2 * Math.sin((t - 0.9) / 0.2 * PI); }},
      stretch: {d: 1.8, f: function (t, Q) { var k = t < 0.4 ? t / 0.4 : t > 1.2 ? Math.max(0, 1 - (t - 1.2) / 0.3) : 1; Q.pitch += 0.35 * k; Q.sq += 0.06 * k; Q.eyesShut = k > 0.5; if (t > 1.4) Q.shake = Math.sin((t - 1.4) * 40) * 0.25; }},
      pounce: {d: 1.3, f: function (t, Q) { if (t < 0.45) { Q.pitch += 0.2 * t / 0.45; Q.sq = -0.15 * t / 0.45; Q.tailAmp = 1.5; } else if (t < 0.95) { var k = (t - 0.45) / 0.5; Q.jump += Math.sin(k * PI) * 0.3 * s; Q.fwd += k * 0.5; Q.pitch -= Math.sin(k * PI) * 0.3; } else { Q.fwd += 0.5; Q.sq = -0.18 * Math.sin((t - 0.95) / 0.35 * PI); } }},
      binky: {d: 1.0, f: function (t, Q) { if (t > 0.1 && t < 0.8) { var k = (t - 0.1) / 0.7; Q.jump += Math.sin(k * PI) * 0.4 * s; Q.yaw += Math.sin(k * PI * 2) * 0.7; Q.roll += Math.sin(k * PI) * 0.5; } }},
      hide: {d: 2.4, f: function (t, Q) { var k = t < 0.25 ? t / 0.25 : t > 2.0 ? 1 - (t - 2.0) / 0.4 : 1; Q.hide = k; Q.sq -= 0.05 * k; if (t > 0.6 && t < 1.8) Q.yaw += Math.sin(t * 9) * 0.05; }},
      fly: {d: 3.2, f: function (t, Q) { var k = t < 0.5 ? t / 0.5 : t > 2.6 ? 1 - (t - 2.6) / 0.6 : 1; Q.jump += E.inOutQuad(k) * 0.9; Q.flap = 1; Q.yaw += clamp((t - 0.5) / 2.1, 0, 1) * 2 * PI; Q.fwd += Math.sin(clamp((t - 0.5) / 2.1, 0, 1) * PI) * 0.4; }},
      coil: {d: 1.6, f: function (t, Q) { var k = clamp(t / 1.3, 0, 1); Q.yaw += E.inOutQuad(k) * 4 * PI; Q.coil = Math.sin(k * PI); }},
      pushup: {d: 1.8, f: function (t, Q) { Q.pitch -= Math.max(0, Math.sin(t * 10)) * 0.25 * (t < 1.5 ? 1 : 0); Q.headPitch = -0.3; Q.look = "cam"; }},
      ball: {d: 2.2, f: function (t, Q) { var k = t < 0.3 ? t / 0.3 : t > 1.9 ? 1 - (t - 1.9) / 0.3 : 1; Q.curl = k; if (t > 0.3 && t < 1.9) { var q = (t - 0.3) / 1.6; Q.fwd += Math.sin(q * PI) * 0.5; Q.pitch += q * 4 * PI; } }},
      swim: {d: 2.0, f: function (t, Q) { var k = clamp(t / 1.8, 0, 1); Q.pitch -= E.inOutQuad(k) * 2 * PI; Q.fwd += Math.sin(k * PI) * 0.25; Q.jump += Math.sin(k * PI) * 0.35; }},
      bubbles: {d: 1.6, f: function (t, Q) { Q.sq += 0.08 * Math.sin(t * 12); Q.bubbles = true; Q.look = "cam"; }},
      wave: {d: 1.8, f: function (t, Q) { Q.stand = Math.min(1, t / 0.3) * (t > 1.5 ? 1 - (t - 1.5) / 0.3 : 1) * 0.6; Q.paw = 0.5 + 0.5 * Math.sin(t * 12); Q.flapOne = Q.paw; Q.look = "cam"; }},
      dive: {d: 2.2, f: function (t, Q) { if (t < 0.3) Q.sq = -0.2 * t / 0.3; else if (t < 0.8) { var k = (t - 0.3) / 0.5; Q.jump += Math.sin(k * PI * 0.8) * 0.5 * s; Q.pitch += k * 1.6; Q.fwd += k * 0.3; } else if (t < 1.7) { Q.pitch += 1.6; Q.fwd += 0.3; Q.jump -= 0.12 * s; Q.wiggle = Math.sin(t * 25) * 0.3; } else { var q = (t - 1.7) / 0.5; Q.pitch += 1.6 * (1 - q); Q.fwd += 0.3; Q.jump += Math.sin(q * PI) * 0.2 * s; } }},
      chill: {d: 3.0, f: function (t, Q) { var k = t < 0.5 ? t / 0.5 : t > 2.6 ? 1 - (t - 2.6) / 0.4 : 1; Q.lie = k; Q.eyesShut = k > 0.6; Q.zzz = k > 0.8; Q.orange = k; }}
    };
    function startTrick(k) {
      if (k === "fetch") { throwBall(); return; }
      if (!TR[k]) k = "jump";
      S2.trick = k; S2.trickT = 0; S2.mode = "trick"; S2.target = null;
      Anim.haptic("tap");
    }
    function throwBall() {
      var e = camXZ(), dx = S2.x - e[0], dz = S2.z - e[1], l = Math.hypot(dx, dz) || 1, a = Math.atan2(dx / l, dz / l) + rnd(-0.7, 0.7), d = rnd(1.4, 2.4);
      ball.on = true; ball.held = false; ball.rest = false; ball.x = e[0] + dx / l * 0.5; ball.z = e[1] + dz / l * 0.5; ball.y = 0.9;
      var tx = clamp(ball.x + Math.sin(a) * (l - 0.5 + d * 0.5), -3.8, 3.8), tz = clamp(ball.z + Math.cos(a) * (l - 0.5 + d * 0.5), -3.8, 3.8), T2 = 0.85;
      ball.vx = (tx - ball.x) / T2; ball.vz = (tz - ball.z) / T2; ball.vy = 2.8;
      S2.mode = "fetch"; S2.trick = null; S2.fetchState = "watch"; S2.t = 0;
      Anim.haptic("tap");
    }
    if (trickO) setTimeout(function () { startTrick(trickO.k); }, 700);
    var dropT = {}; Object.keys(accDrop).forEach(function (k) { dropT[k] = 0; });
    if (Object.keys(dropT).length) S2.sitHold = 2.2;
    function hitPet(cx, cy) {
      var y0 = mdl.bodyY + fly + 0.04, c = ctx.project([S2.x, y0, S2.z]), e = ctx.project([S2.x, y0 + mdl.size * 0.5, S2.z]);
      return Math.hypot(cx - c.x, cy - c.y) < Math.max(34, Math.abs(e.y - c.y) * 1.7);
    }
    return {
      parts: mdl.parts,
      hit: hitPet,
      touchStart: function () { S2.pet = 0.01; },
      touchMove: function (x, y, dx, dy) { S2.pet = Math.min(1, S2.pet + (Math.abs(dx) + Math.abs(dy)) * 0.006); if (S2.mode !== "trick") { S2.mode = "petted"; S2.target = null; } },
      touchEnd: function () { if (S2.mode === "petted") { S2.mode = "idle"; S2.idleN = rnd(1, 2); S2.happyHold = 1.2; } S2.pet = 0; },
      tap: function (x, y, onPet) {
        if (onPet) { var r = Math.random(); startTrick(sp.kind === "quad" && r < 0.3 ? "roll" : r < 0.65 ? "jump" : "spin"); hearts(3); return; }
        var g = ctx.groundAt(x, y); if (!g) return;
        S2.mode = "walk"; S2.target = [clamp(g[0], -4, 4), clamp(g[2], -4, 4)]; S2.trick = null; S2.call = true; S2.idleActT = 0;
        ctx.spawn({x: S2.target[0], y: 0.05, z: S2.target[1], vy: 0.25, t: 1, s: 0.09, max: 0.7, keep: true});
      },
      onButton: function (v) { if (v === "ball") { throwBall(); return; } if (v.charAt(0) === "t") { var tk = tricks[+v.slice(1)]; if (tk) startTrick(tk.k); } },
      pose: function (dt, time) {
        var Q = {yaw: 0, pitch: 0, roll: 0, jump: 0, sq: 0, sit: 0, lie: 0, stand: 0, paw: 0, fwd: 0, look: null, tailAmp: null, eyesShut: false, legsStiff: 0, flap: 0, hide: 0, curl: 0, coil: 0, shake: 0, wiggle: 0, orange: 0, belly: 0, sniff: 0};
        S2.t += dt;
        var spd = sp.speed * (0.55 + 0.45 * s), moving = false, run = false, i;
        /* --- máquina de estados --- */
        if (S2.mode === "trick" && S2.trick) {
          S2.trickT += dt; TR[S2.trick].f(S2.trickT, Q);
          if (Q.notes && Math.random() < dt * 3) { var hp = worldOf(piv.headTop); ctx.spawn({x: hp[0], y: hp[1] + 0.05, z: hp[2], vx: rnd(-0.2, 0.2), vy: 0.4, g: -0.05, t: 2, s: 0.07, max: 1}); }
          if (Q.bubbles && Math.random() < dt * 10) { var mp = worldOf(piv.mouth); ctx.spawn({x: mp[0], y: mp[1], z: mp[2], vx: rnd(-0.05, 0.05), vy: rnd(0.3, 0.5), g: -0.1, t: 7, s: rnd(0.04, 0.08), max: 1.4, keep: true}); }
          if (Q.zzz && Math.random() < dt * 1.2) { var zp = worldOf(piv.headTop); ctx.spawn({x: zp[0], y: zp[1] + 0.05, z: zp[2], vx: 0.08, vy: 0.25, t: 3, s: 0.06, max: 1.4, keep: true}); }
          if (S2.trickT >= TR[S2.trick].d) {
            S2.trick = null; S2.mode = "idle"; S2.idleN = rnd(1.2, 2.5); S2.happyHold = 1.2;
            hearts(2, 1); var tp2 = worldOf(piv.headTop); for (i = 0; i < 8; i++) ctx.spawn({x: tp2[0], y: tp2[1], z: tp2[2], vx: rnd(-0.6, 0.6), vy: rnd(0.4, 1), vz: rnd(-0.6, 0.6), g: 1.5, t: 1, s: 0.06, max: 0.9});
            Anim.haptic("ok");
          }
        } else if (S2.mode === "petted") {
          S2.happy = damp(S2.happy, 1, 6, dt); Q.look = "cam"; Q.tailAmp = 1.6;
          S2.heartT -= dt; if (S2.heartT <= 0) { hearts(1); S2.heartT = 0.35; Anim.haptic("tap"); }
          if (sp.kind === "quad" && S2.pet > 0.85 && (pt.k === "dog" || pt.k === "cat")) Q.belly = 1;
        } else if (S2.mode === "fetch") {
          var fs = S2.fetchState;
          if (fs === "watch") { Q.look = "ball"; Q.tailAmp = 1.4; faceTo(ball.x, ball.z, dt, 5); if (ball.rest || (ball.y < 0.12 && ball.vy <= 0)) S2.fetchState = "run"; }
          else if (fs === "run") { S2.target = [ball.x, ball.z]; run = true; Q.look = "ball";
            if (Math.hypot(ball.x - S2.x, ball.z - S2.z) < 0.1 + mdl.size * 0.45) {
              if (sp.kind === "quad" || sp.kind === "bird") { ball.held = true; S2.fetchState = "back"; Anim.haptic("tap"); }
              else { var e2 = camXZ(), dx2 = e2[0] - ball.x, dz2 = e2[1] - ball.z, l2 = Math.hypot(dx2, dz2) || 1; ball.vx = dx2 / l2 * 1.6; ball.vz = dz2 / l2 * 1.6; ball.vy = 0.8; ball.rest = false; S2.fetchState = "done"; S2.t = 0; }
            } }
          else if (fs === "back") { var e3 = camXZ(), dx3 = e3[0] - S2.x, dz3 = e3[1] - S2.z, l3 = Math.hypot(dx3, dz3) || 1; S2.target = [S2.x + dx3 / l3 * Math.max(0, l3 - 1.3), S2.z + dz3 / l3 * Math.max(0, l3 - 1.3)]; run = true;
            if (l3 < 1.5) { ball.held = false; ball.vx = dx3 / l3 * 0.3; ball.vz = dz3 / l3 * 0.3; ball.vy = 0.3; ball.rest = false; S2.fetchState = "done"; S2.t = 0; hearts(3); Anim.haptic("ok"); } }
          else if (fs === "done") { Q.sit = Math.min(1, S2.t / 0.3); Q.look = "cam"; Q.tailAmp = 1.8; S2.target = null; if (S2.t > 1.8) { S2.mode = "idle"; S2.idleN = rnd(1, 2); } }
        } else if (S2.mode === "walk") {
          if (!S2.target) S2.mode = "idle";
        } else {
          S2.idleN -= dt;
          if (S2.sitHold > 0) { S2.sitHold -= dt; Q.sit = 1; Q.look = "cam"; }
          else if (S2.idleN <= 0) {
            var r2 = Math.random(), ang = rnd(0, 2 * PI), rad = rnd(0.4, 2.2);
            if (r2 < 0.55) { S2.mode = "walk"; S2.target = [Math.sin(ang) * rad, Math.cos(ang) * rad * 0.8]; }
            else if (r2 < 0.7 && tricks.length && !red) startTrick(tricks[(Math.random() * tricks.length) | 0].k);
            else { S2.idleAct = r2 < 0.8 ? "sniff" : r2 < 0.9 ? "sit" : "lie"; S2.idleActT = rnd(1.5, 3.5); }
            S2.idleN = rnd(2.5, 5);
          }
          if (S2.idleActT > 0) { S2.idleActT -= dt; if (S2.idleAct === "sniff") Q.sniff = 1; else if (S2.idleAct === "sit") Q.sit = 1; else Q.lie = sp.kind === "quad" ? 1 : 0; }
          if (!Q.look) Q.look = Math.sin(S2.t * 0.4) > 0.2 ? "cam" : null;
        }
        if (S2.happyHold > 0) { S2.happyHold -= dt; S2.happy = damp(S2.happy, 1, 6, dt); } else if (S2.mode !== "petted") S2.happy = damp(S2.happy, 0, 3, dt);
        /* --- desplazamiento: gira hacia el objetivo y avanza --- */
        if (S2.target && (S2.mode === "walk" || S2.mode === "fetch")) {
          var dx = S2.target[0] - S2.x, dz = S2.target[1] - S2.z, d = Math.hypot(dx, dz);
          if (d > 0.05) {
            faceTo(S2.target[0], S2.target[1], dt, run ? 9 : 5);
            var vmax = spd * (run || S2.call ? 1.8 : 1);
            S2.v = damp(S2.v, Math.min(vmax, d * 3), 6, dt);
            var align = Math.max(0, Math.cos(angDiff(S2.yaw, Math.atan2(dx, dz))));
            S2.x += Math.sin(S2.yaw) * S2.v * dt * align; S2.z += Math.cos(S2.yaw) * S2.v * dt * align; moving = S2.v > 0.02;
          } else { S2.v = 0; if (S2.mode === "walk") { S2.mode = "idle"; S2.target = null; S2.idleN = rnd(1, 3); if (S2.call) { S2.call = false; S2.sitHold = 1.5; S2.happyHold = 1; } } }
        } else S2.v = damp(S2.v, 0, 8, dt);
        S2.x = clamp(S2.x, -4.5, 4.5); S2.z = clamp(S2.z, -4.5, 4.5);
        /* --- pelota --- */
        if (ball.on) {
          if (ball.held) { var mpos = worldOf(piv.mouth); ball.x = mpos[0]; ball.y = mpos[1] - 0.05; ball.z = mpos[2]; }
          else if (!ball.rest) {
            ball.vy -= 9 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; ball.spin += Math.hypot(ball.vx, ball.vz) * dt * 12;
            if (ball.y < 0) { ball.y = 0; if (Math.abs(ball.vy) > 0.6) { ball.vy = -ball.vy * 0.45; Anim.haptic("tap"); } else ball.vy = 0; ball.vx *= 0.8; ball.vz *= 0.8; if (Math.hypot(ball.vx, ball.vz) < 0.05 && ball.vy === 0) ball.rest = true; }
          }
        }
        /* --- marcha --- */
        if (moving) S2.gait += S2.v * dt * (sp.gait === "hop" ? 9 : sp.gait === "scurry" ? 26 : 16) / Math.max(0.3, s);
        var gp = S2.gait, walkK = clamp(S2.v / Math.max(0.05, spd * 0.6), 0, 1);
        var hopY = sp.gait === "hop" ? Math.abs(Math.sin(gp)) * 0.08 * walkK * s : sp.gait === "trot" ? Math.abs(Math.sin(gp * 2)) * 0.012 * walkK : 0;
        if (moving && sp.gait === "hop" && Math.random() < dt * 3) dust(2);
        /* --- suavizados --- */
        S2.sit = damp(S2.sit, Q.sit, 8, dt); S2.lie = damp(S2.lie, Q.lie, 6, dt); S2.belly = damp(S2.belly, Q.belly, 5, dt);
        S2.hide = damp(S2.hide, Q.hide, 10, dt); S2.curl = damp(S2.curl, Q.curl, 10, dt); S2.sniff = damp(S2.sniff, Q.sniff, 4, dt);
        S2.tailAmp = damp(S2.tailAmp, Q.tailAmp != null ? Q.tailAmp : 0.35 + S2.happy * 1.2 + (moving ? 0.3 : 0), 5, dt);
        S2.wagT += dt * (6 + S2.tailAmp * 8);
        S2.blinkN -= dt; if (S2.blinkN <= 0 && S2.blink < 0) { S2.blink = 0; S2.blinkN = rnd(1.8, 5); } if (S2.blink >= 0) { S2.blink += dt; if (S2.blink > 0.14) S2.blink = -1; }
        S2.earT += dt; if (Math.random() < dt * 0.4) S2.earPerk = 1; S2.earPerk = damp(S2.earPerk, 0, 3, dt);
        /* --- mirada --- */
        var lookP = Q.look === "cam" ? ctx.cam.eye : Q.look === "ball" && ball.on ? [ball.x, ball.y, ball.z] : null, hy0 = 0, hp0 = 0;
        if (lookP) { var hw = worldOf(piv.head); hy0 = clamp(angDiff(S2.yaw + Q.yaw, Math.atan2(lookP[0] - hw[0], lookP[2] - hw[2])), -0.9, 0.9); hp0 = clamp(-Math.atan2(lookP[1] - hw[1], Math.hypot(lookP[0] - hw[0], lookP[2] - hw[2])), -0.6, 0.5); }
        if (S2.sniff > 0.01) hp0 = lerp(hp0, 0.7, S2.sniff);
        if (Q.headPitch) hp0 += Q.headPitch;
        S2.headYaw = damp(S2.headYaw, hy0, 6, dt); S2.headPitch = damp(S2.headPitch, hp0, 6, dt);
        /* --- matrices --- */
        var breath = Math.sin(time * (2 + S2.happy * 2)) * 0.02, sq = Q.sq + (sp.kind === "fish" ? 0 : breath * 0.5);
        var jumpY = Q.jump + hopY + fly + (sp.kind === "fish" ? Math.sin(time * 1.6) * 0.04 : 0);
        var bY = mdl.bodyY, sitA = S2.sit * 0.55, lieY = -S2.lie * (sp.leg ? sp.leg[0] * s * 0.85 : 0), standA = (Q.stand || 0) * 1.1;
        rootM = M(T(S2.x + Math.sin(S2.yaw) * Q.fwd, jumpY + lieY, S2.z + Math.cos(S2.yaw) * Q.fwd), RY(S2.yaw + Q.yaw));
        var bodyM = M(rootM, about([0, bY, -mdl.size * 0.3], RX(-sitA - standA)), about([0, bY, 0], RX(Q.pitch)),
          about([0, bY, 0], RZ(Q.roll + S2.belly * PI + Q.shake + Q.wiggle)), Sc(1 - sq * 0.5 + S2.curl * 0.15, 1 + sq - S2.curl * 0.2, 1 - sq * 0.5));
        var mats = {}, draw = [];
        function put(n, Mx) { if (mdl.parts[n]) { mats[n] = Mx; draw.push(n); } }
        put("body", bodyM); put("shell", bodyM);
        var hv = piv.head || [0, 0, 0];
        var headM = M(bodyM, about(hv, M(RY(S2.headYaw), RX(S2.headPitch + S2.sit * 0.35))), about(hv, Sc(Math.max(0.05, 1 - S2.hide * 0.95 - S2.curl * 0.9))));
        if (sp.kind === "turtle") headM = M(headM, T(0, 0, -S2.hide * 0.08));
        if (sp.kind === "snake") {
          var segL = 0.07 * s, wav = time * (moving ? 6 : 2), coilK = Q.coil || 0;
          for (i = 0; i < 12; i++) put("seg" + i, M(rootM, RY(coilK * i * 0.5), T(Math.sin(wav - i * 0.7) * (0.05 + 0.04 * walkK) * Math.min(1, i / 2), 0, -i * segL), Sc(1 + sq)));
          headM = M(rootM, T(0, 0, 0.06 * s), about(hv, M(RY(S2.headYaw), RX(S2.headPitch - Math.max(0, Q.jump) * 2))));
        }
        put("head", headM);
        var happyTongue = S2.happy > 0.3 || run;
        if (piv.tongue) put("tongue", M(headM, about(piv.tongue, Sc(1, 1, sp.kind === "snake" ? (Math.sin(time * 3) > 0.6 ? 1 : 0.01) : happyTongue ? 1 + 0.25 * Math.sin(time * 12) : 0.02))));
        /* ojos: parpadeo y cerrados de gusto */
        var shut = Q.eyesShut || S2.blink >= 0 || S2.happy > 0.8;
        if (piv.eyes) put("eyes", M(sp.kind === "fish" ? bodyM : headM, about(piv.eyes, Sc(1, shut ? 0.12 : 1, 1))));
        var flop = Math.sin(gp * 2) * 0.3 * walkK + S2.earPerk * 0.3;
        if (piv.earL) put("earL", M(headM, about(piv.earL, M(RZ(-0.2 * flop - Math.sin(S2.earT * 13) * 0.08 * S2.earPerk), RX(sp.ears === "floppy" ? -flop * 0.6 : 0)))));
        if (piv.earR) put("earR", M(headM, about(piv.earR, M(RZ(0.2 * flop + Math.sin(S2.earT * 11) * 0.08 * S2.earPerk), RX(sp.ears === "floppy" ? -flop * 0.6 : 0)))));
        var tw = Math.sin(S2.wagT) * 0.35 * S2.tailAmp;
        if (piv.tail) put("tail", M(bodyM, about(piv.tail, sp.kind === "fish" ? RY(Math.sin(time * (moving ? 10 : 5)) * 0.45) : M(RY(tw), RX(sp.tail === "wag" ? -0.3 * S2.tailAmp : 0)))));
        var legA = 0.55 * walkK * (sp.gait === "scurry" ? 0.7 : 1), stiff = Q.legsStiff || 0;
        ["legFL", "legFR", "legBL", "legBR"].forEach(function (n, k) {
          if (!mdl.parts[n]) return;
          var back = k >= 2, ph = sp.gait === "hop" ? (k < 2 ? 0 : PI * 0.6) : (k === 0 || k === 3 ? 0 : PI), a = Math.sin(gp + ph) * legA;
          if (sp.kind === "bird") a = Math.sin(gp + (k ? PI : 0)) * legA;
          if (S2.sit > 0.01) a += back ? -1.2 * S2.sit : sitA + standA;
          if (Q.stand && !back) a += -0.6 * Q.stand;
          if (S2.lie > 0.01) a += back ? -1.3 * S2.lie : 1.3 * S2.lie;
          if (S2.belly > 0.01) a += Math.sin(time * 9 + k) * 0.4 * S2.belly;
          if (n === "legFR" && Q.paw) a -= Q.paw * 1.6;
          if (stiff) a = lerp(a, k % 2 ? 0.3 : -0.3, stiff);
          put(n, M(bodyM, about(piv[n], M(RX(a), Sc(Math.max(0.05, 1 - S2.hide * 0.9 - S2.curl * 0.95))))));
        });
        for (var li = 0; li < 8; li++) { var ln2 = "leg" + li; if (!mdl.parts[ln2]) continue; put(ln2, M(bodyM, about(piv[ln2], RY(Math.sin(gp + (li % 2 ? PI : 0) + li) * 0.4 * walkK - (Q.paw && li % 4 === 0 ? Q.paw * 0.8 : 0))))); }
        var flapA = (Q.flap ? Math.sin(time * 26) * 0.9 : moving ? Math.sin(gp) * 0.15 : 0) + breath;
        if (piv.wingL) put("wingL", M(bodyM, about(piv.wingL, RZ(-flapA - (Q.flapOne || 0) * 1.4))));
        if (piv.wingR) put("wingR", M(bodyM, about(piv.wingR, RZ(flapA))));
        /* accesorios en su sitio: siguen a la cabeza o al cuerpo; el nuevo cae y rebota y la mascota se mira */
        ["h", "f", "n"].forEach(function (sl) {
          var a = accs[sl]; if (!a || !mdl.parts["acc_" + sl]) return;
          var anchor = sl === "h" ? piv.headTop : sl === "f" ? piv.face : piv.neck, base = sl === "n" ? bodyM : headM, drop = 0;
          if (dropT[sl] != null) {
            dropT[sl] += dt; var k = Math.min(1, dropT[sl] / 0.7); drop = (1 - E.outBounce(k)) * 0.8;
            if (dropT[sl] > 0.7 && dropT[sl] - dt <= 0.7) { var wp = worldOf(anchor); for (var i2 = 0; i2 < 10; i2++) ctx.spawn({x: wp[0], y: wp[1], z: wp[2], vx: rnd(-0.6, 0.6), vy: rnd(0.3, 0.8), vz: rnd(-0.6, 0.6), g: 2, t: 1, s: 0.05, max: 0.7}); Anim.haptic("tap"); }
            if (dropT[sl] > 0.8 && dropT[sl] < 2.4) S2.headYaw += Math.sin(dropT[sl] * 6) * 0.03;
          }
          var swing = sl === "n" ? Math.sin(gp * 2) * 0.12 * walkK + Math.sin(S2.wagT) * 0.03 : 0;
          put("acc_" + sl, M(base, T(anchor[0], anchor[1] + a.m.oy + drop, anchor[2] + (sl === "f" ? 0.012 : sl === "n" ? piv.hr * 0.2 : -0.005)), RX(swing)));
        });
        if (Q.orange > 0.3 && mdl.parts.orange && piv.headTop) put("orange", M(headM, T(piv.headTop[0], piv.headTop[1] - 0.01 + (1 - Q.orange) * 0.3, piv.headTop[2] - 0.02)));
        if (ball.on) put("ball", M(T(ball.x, ball.y, ball.z), RX(ball.spin)));
        /* color de la mascota (pelaje elegido o arcoíris), no en accesorios ni pelota */
        var cm = rainbow ? cssFilterMat("", (time * 60) % 360) : CM, cms = {};
        draw.forEach(function (n) { if (n.indexOf("acc_") !== 0 && n !== "ball" && n !== "orange") cms[n] = cm; });
        var shR = Math.max(0.12, mdl.size * 0.55) * (1 - Math.min(0.6, Math.max(0, jumpY - fly) * 1.5));
        return {mats: mats, draw: draw, cm: cms, shadow: [S2.x, S2.z, shR], target: [S2.x, mdl.bodyY * 0.8 + fly * 0.8, S2.z]};
      }
    };
  }

  return {supported: supported, open: open, close: close, player: player, pet: pet, isOpen: function () { return !!cur; }};
})();
