/* vox-core.js — motor vóxel compartido con el partido 3D (5.6).
   No es un segundo motor: usa la malla (Mesh: 10 floats por vértice con oclusión ambiental),
   los shaders de luz, sombra y niebla, y la ambientación (envFor) que expone Pitch3D.core.
   Aquí solo se añade lo que el partido no necesita:
   - VGrid: rejilla de vóxeles con estampado de formas (caja, elipsoide, cápsula, cono).
   - meshGrid: mallado con fusión de caras iguales (greedy meshing), caras ocultas eliminadas
     y oclusión ambiental por vértice como la de los jugadores.
   - Engine: un contexto WebGL con los mismos programas, buffer estático por lotes, un buffer dinámico
     reutilizado por fotograma (sin crear objetos), mapa de sombras, reflejo tenue en el suelo,
     partículas vóxel con pool, cámara orbital/isométrica, rayos para tocar y modo de calidad automático. */
var VoxCore = (function () {
  "use strict";
  if (typeof Pitch3D === "undefined" || !Pitch3D.core) return null;
  var C = Pitch3D.core, STRIDE = C.STRIDE, ORG = C.ORIGIN, MAT = C.MAT;
  var PI = Math.PI;

  /* ---------- matrices (columna mayor) ---------- */
  function m4() { var m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
  function mul(a, b, o) {
    o = o || new Float32Array(16);
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11], a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    for (var c = 0; c < 4; c++) {
      var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      o[c * 4] = a0 * b0 + a4 * b1 + a8 * b2 + a12 * b3; o[c * 4 + 1] = a1 * b0 + a5 * b1 + a9 * b2 + a13 * b3;
      o[c * 4 + 2] = a2 * b0 + a6 * b1 + a10 * b2 + a14 * b3; o[c * 4 + 3] = a3 * b0 + a7 * b1 + a11 * b2 + a15 * b3;
    }
    return o;
  }
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), m = new Float32Array(16); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; }
  function ortho(l, r, b, t, n, f) { var m = new Float32Array(16); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m; }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx, xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx, m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx; m[4] = xy; m[5] = yy; m[6] = zy; m[8] = xz; m[9] = yz; m[10] = zz;
    m[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); m[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); m[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); m[15] = 1;
    return m;
  }
  function T(x, y, z) { var m = m4(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function S(x, y, z) { var m = m4(); m[0] = x; m[5] = y == null ? x : y; m[10] = z == null ? x : z; return m; }
  function RX(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function RY(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function RZ(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  function M() { var r = arguments[0]; for (var i = 1; i < arguments.length; i++) r = mul(r, arguments[i]); return r; }
  function about(p, R) { return M(T(p[0], p[1], p[2]), R, T(-p[0], -p[1], -p[2])); }
  function tp(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
  function invRigid(m) { /* inversa de rotación+traslación (+escala uniforme aproximada) */
    var o = m4(), sx = Math.hypot(m[0], m[1], m[2]) || 1, k = 1 / (sx * sx);
    o[0] = m[0] * k; o[1] = m[4] * k; o[2] = m[8] * k; o[4] = m[1] * k; o[5] = m[5] * k; o[6] = m[9] * k; o[8] = m[2] * k; o[9] = m[6] * k; o[10] = m[10] * k;
    o[12] = -(o[0] * m[12] + o[4] * m[13] + o[8] * m[14]); o[13] = -(o[1] * m[12] + o[5] * m[13] + o[9] * m[14]); o[14] = -(o[2] * m[12] + o[6] * m[13] + o[10] * m[14]);
    return o;
  }
  var MX = {m4: m4, mul: mul, T: T, S: S, RX: RX, RY: RY, RZ: RZ, M: M, about: about, tp: tp, invRigid: invRigid, persp: persp, lookAt: lookAt};

  /* ---------- color ---------- */
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (typeof c === "number") return [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255];
    c = String(c || "#888").trim();
    var hm = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/.exec(c);
    if (hm) {
      var H = (+hm[1] % 360) / 360, Sa = +hm[2] / 100, L = +hm[3] / 100, q = L < 0.5 ? L * (1 + Sa) : L + Sa - L * Sa, p0 = 2 * L - q;
      var f = function (t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p0 + (q - p0) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p0 + (q - p0) * (2 / 3 - t) * 6 : p0; };
      return [f(H + 1 / 3), f(H), f(H - 1 / 3)];
    }
    var m = /^rgba?\(([^)]+)\)/.exec(c);
    if (m) { var p = m[1].split(","); return [+p[0] / 255, +p[1] / 255, +p[2] / 255]; }
    c = c.replace("#", ""); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var v = parseInt(c, 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
  }
  function packC(c, code) { c = rgb(c); return 1 + (code || 0) * 16777216 + (Math.round(c[0] * 255) << 16 | Math.round(c[1] * 255) << 8 | Math.round(c[2] * 255)); }
  function unpackC(v) { v -= 1; var code = Math.floor(v / 16777216), c = v - code * 16777216; return {code: code, c: [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255]}; }
  function mix(a, b, k) { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function shade(a, k) { a = rgb(a); return [Math.min(1, a[0] * k), Math.min(1, a[1] * k), Math.min(1, a[2] * k)]; }

  /* ---------- rejilla de vóxeles ---------- */
  function VGrid() { this.m = {}; this.n = 0; }
  VGrid.prototype.key = function (i, j, k) { return i + "," + j + "," + k; };
  VGrid.prototype.set = function (i, j, k, col, code) { var key = i + "," + j + "," + k; if (!this.m[key]) this.n++; this.m[key] = packC(col, code); };
  VGrid.prototype.setP = function (i, j, k, v) { var key = i + "," + j + "," + k; if (!this.m[key]) this.n++; this.m[key] = v; };
  VGrid.prototype.get = function (i, j, k) { return this.m[i + "," + j + "," + k] || 0; };
  VGrid.prototype.del = function (i, j, k) { var key = i + "," + j + "," + k; if (this.m[key]) { delete this.m[key]; this.n--; } };
  VGrid.prototype.each = function (fn) { for (var key in this.m) { var q = key.split(","); fn(+q[0], +q[1], +q[2], this.m[key], key); } };
  VGrid.prototype.clone = function () { var g = new VGrid(); for (var k in this.m) g.m[k] = this.m[k]; g.n = this.n; return g; };
  VGrid.prototype.bbox = function () {
    var b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    this.each(function (i, j, k) { if (i < b[0]) b[0] = i; if (j < b[1]) b[1] = j; if (k < b[2]) b[2] = k; if (i > b[3]) b[3] = i; if (j > b[4]) b[4] = j; if (k > b[5]) b[5] = k; });
    return b;
  };
  /* rellena las celdas de una caja de coordenadas (en vóxeles, extremos incluidos) según una prueba */
  VGrid.prototype.fill = function (x0, y0, z0, x1, y1, z1, test, code) {
    var any = false;
    for (var i = Math.floor(x0); i <= Math.ceil(x1); i++) for (var j = Math.floor(y0); j <= Math.ceil(y1); j++) for (var k = Math.floor(z0); k <= Math.ceil(z1); k++) {
      var c = test(i + 0.5, j + 0.5, k + 0.5, i, j, k);
      if (c) { this.set(i, j, k, c, code); any = true; }
    }
    return any;
  };
  VGrid.prototype.box = function (x0, y0, z0, x1, y1, z1, col, code) {
    var cf = typeof col === "function" ? col : null;
    for (var i = x0; i <= x1; i++) for (var j = y0; j <= y1; j++) for (var k = z0; k <= z1; k++) this.set(i, j, k, cf ? cf(i, j, k) : col, code);
  };
  /* elipsoide de centro c y semiejes r (en vóxeles); col puede ser función(u dirección unitaria, i, j, k) */
  VGrid.prototype.ell = function (c, r, col, code) {
    var cf = typeof col === "function" ? col : null, rx = Math.max(r[0], 0.5), ry = Math.max(r[1], 0.5), rz = Math.max(r[2], 0.5);
    var ok = this.fill(c[0] - rx, c[1] - ry, c[2] - rz, c[0] + rx, c[1] + ry, c[2] + rz, function (x, y, z, i, j, k) {
      var dx = (x - c[0]) / rx, dy = (y - c[1]) / ry, dz = (z - c[2]) / rz, d = dx * dx + dy * dy + dz * dz;
      if (d > 1) return null; if (!cf) return col; var l = Math.sqrt(d) || 1; return cf([dx / l, dy / l, dz / l], i, j, k);
    }, code);
    if (!ok) this.set(Math.floor(c[0]), Math.floor(c[1]), Math.floor(c[2]), cf ? cf([0, 1, 0]) : col, code);
  };
  VGrid.prototype.cap = function (p0, p1, r0, r1, col, code) {
    var r = Math.max(r0, r1, 0.5), d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1e-6;
    var ok = this.fill(Math.min(p0[0], p1[0]) - r, Math.min(p0[1], p1[1]) - r, Math.min(p0[2], p1[2]) - r, Math.max(p0[0], p1[0]) + r, Math.max(p0[1], p1[1]) + r, Math.max(p0[2], p1[2]) + r, function (x, y, z) {
      var t = Math.max(0, Math.min(1, ((x - p0[0]) * d[0] + (y - p0[1]) * d[1] + (z - p0[2]) * d[2]) / L2));
      var qx = p0[0] + d[0] * t - x, qy = p0[1] + d[1] * t - y, qz = p0[2] + d[2] * t - z, rr = Math.max(r0 + (r1 - r0) * t, 0.5);
      return qx * qx + qy * qy + qz * qz <= rr * rr ? col : null;
    }, code);
    if (!ok) this.set(Math.floor(p0[0]), Math.floor(p0[1]), Math.floor(p0[2]), col, code);
  };
  /* cono (o cuña si flat < 1: aplasta un eje perpendicular) */
  VGrid.prototype.cone = function (base, tip, r, col, flat, code) {
    var dx = tip[0] - base[0], dy = tip[1] - base[1], dz = tip[2] - base[2], L = Math.hypot(dx, dy, dz) || 1e-6, z = [dx / L, dy / L, dz / L];
    var up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]], xl = Math.hypot(x[0], x[1], x[2]) || 1;
    x = [x[0] / xl, x[1] / xl, x[2] / xl]; var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]], f = flat || 1, R = Math.max(r, 0.5);
    this.fill(Math.min(base[0], tip[0]) - R, Math.min(base[1], tip[1]) - R, Math.min(base[2], tip[2]) - R, Math.max(base[0], tip[0]) + R, Math.max(base[1], tip[1]) + R, Math.max(base[2], tip[2]) + R, function (px, py, pz) {
      px -= base[0]; py -= base[1]; pz -= base[2];
      var hh = px * z[0] + py * z[1] + pz * z[2]; if (hh < 0 || hh > L) return null;
      var u = (px * x[0] + py * x[1] + pz * x[2]) / f, w = px * y[0] + py * y[1] + pz * y[2], rr = Math.max(R * (1 - hh / L), 0.45);
      return u * u + w * w <= rr * rr ? col : null;
    }, code);
    this.set(Math.floor(base[0]), Math.floor(base[1]), Math.floor(base[2]), col, code);
  };
  /* píxeles de una rejilla 2D (PX.Grid) extruidos en z (de z0 a z1) */
  VGrid.prototype.sprite = function (g, x0, y0, z0, z1, flipY) {
    for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) { var c = g.get(x, y); if (!c) continue; for (var z = z0; z <= z1; z++) this.set(x0 + x, y0 + (flipY ? (g.h - 1 - y) : y), z, c); }
  };

  /* ---------- mallado: fusión de caras + oclusión por vértice ---------- */
  var AOF = [0.55, 0.72, 0.87, 1.0];
  function meshGrid(g, vs, pivot, out) {
    var m = out || new C.Mesh(4096); if (!out) m.reset();
    if (!g.n) return m;
    var b = g.bbox(), X0 = b[0] - 1, Y0 = b[1] - 1, Z0 = b[2] - 1, W = b[3] - b[0] + 3, H = b[4] - b[1] + 3, D = b[5] - b[2] + 3;
    var A = new Float64Array(W * H * D);
    g.each(function (i, j, k, v) { A[(i - X0) + W * ((j - Y0) + H * (k - Z0))] = v; });
    var dims = [W, H, D];
    function at(x, y, z) { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return 0; return A[x + W * (y + H * z)]; }
    var px = pivot ? pivot[0] : 0, py = pivot ? pivot[1] : 0, pz = pivot ? pivot[2] : 0;
    var q = [0, 0, 0], du = [0, 0, 0], dv = [0, 0, 0];
    for (var d = 0; d < 3; d++) {
      var u = (d + 1) % 3, v = (d + 2) % 3, Nu = dims[u], Nv = dims[v], mask = new Float64Array(Nu * Nv);
      for (var s = -1; s <= 1; s += 2) {
        for (var x = 0; x < dims[d]; x++) {
          var n = 0;
          for (var jv = 0; jv < Nv; jv++) for (var iu = 0; iu < Nu; iu++) {
            q[d] = x; q[u] = iu; q[v] = jv;
            var cur = at(q[0], q[1], q[2]);
            q[d] = x + s;
            var nb = at(q[0], q[1], q[2]);
            if (!cur || nb) { mask[n++] = 0; continue; }
            /* oclusión de las 4 esquinas, mirando la capa hacia la que mira la cara */
            var ao = 0;
            for (var c = 0; c < 4; c++) {
              var su = c === 1 || c === 2 ? 1 : -1, sv = c >= 2 ? 1 : -1;
              q[u] = iu + su; q[v] = jv; var s1 = at(q[0], q[1], q[2]) ? 1 : 0;
              q[u] = iu; q[v] = jv + sv; var s2 = at(q[0], q[1], q[2]) ? 1 : 0;
              q[u] = iu + su; q[v] = jv + sv; var cn = at(q[0], q[1], q[2]) ? 1 : 0;
              var lv = s1 && s2 ? 0 : 3 - (s1 + s2 + cn);
              ao = ao * 4 + lv;
            }
            mask[n++] = cur * 256 + ao;
          }
          /* fusión voraz de rectángulos con el mismo color, material y oclusión */
          n = 0;
          for (var j2 = 0; j2 < Nv; j2++) {
            for (var i2 = 0; i2 < Nu;) {
              var key = mask[n];
              if (!key) { i2++; n++; continue; }
              var w = 1; while (i2 + w < Nu && mask[n + w] === key) w++;
              var hgt = 1, done = false;
              while (j2 + hgt < Nv && !done) { for (var k2 = 0; k2 < w; k2++) if (mask[n + k2 + hgt * Nu] !== key) { done = true; break; } if (!done) hgt++; }
              var vv = Math.floor(key / 256), aoq = key - vv * 256, info = unpackC(vv);
              var a0 = AOF[(aoq >> 6) & 3], a1 = AOF[(aoq >> 4) & 3], a2 = AOF[(aoq >> 2) & 3], a3 = AOF[aoq & 3];
              var plane = x + (s > 0 ? 1 : 0);
              function P(uu, vvv) { var r = [0, 0, 0]; r[d] = plane; r[u] = uu; r[v] = vvv; return [(r[0] + X0 - px) * vs, (r[1] + Y0 - py) * vs, (r[2] + Z0 - pz) * vs]; }
              var c0 = P(i2, j2), c1 = P(i2 + w, j2), c2 = P(i2 + w, j2 + hgt), c3 = P(i2, j2 + hgt);
              m.code = info.code;
              if (a0 + a2 < a1 + a3) m.quadAO(c1, c2, c3, c0, info.c, a1, a2, a3, a0);
              else m.quadAO(c0, c1, c2, c3, info.c, a0, a1, a2, a3);
              for (var l2 = 0; l2 < hgt; l2++) for (var k3 = 0; k3 < w; k3++) mask[n + k3 + l2 * Nu] = 0;
              i2 += w; n += w;
            }
          }
        }
      }
    }
    m.code = -1;
    return m;
  }
  function meshArray(g, vs, pivot) { var m = meshGrid(g, vs, pivot); return new Float32Array(m.a.subarray(0, m.n)); }
  /* mallas sueltas de cajas (escenario): mismo formato, con la oclusión de contacto de los jugadores */
  function boxMesh(list) {
    var m = new C.Mesh(4096); m.reset();
    list.forEach(function (b) { m.code = b[7] || 0; m.box(b[0], b[1], b[2], b[3], b[4], b[5], rgb(b[6]), b[8] == null ? 0.84 : b[8]); });
    return new Float32Array(m.a.subarray(0, m.n));
  }

  /* ---------- motor de dibujo ---------- */
  var FS_A = C.FS_MAIN.replace("gl_FragColor=vec4(col,1.0);}", "gl_FragColor=vec4(col,uAlpha);}").replace("col*=1.0-0.42*dot(uv,uv);", "col*=1.0-0.42*uVig*dot(uv,uv);");
  var FS_L = C.FS_LITE.replace("gl_FragColor=vec4(col,1.0);}", "gl_FragColor=vec4(col,uAlpha);}").replace("col*=1.0-0.42*dot(uv,uv);", "col*=1.0-0.42*uVig*dot(uv,uv);");
  function addU(src) { var i = src.indexOf("varying"); return src.slice(0, i) + "uniform float uAlpha;uniform float uVig;" + src.slice(i); }
  FS_A = addU(FS_A); FS_L = addU(FS_L);
  var UN = C.U_NAMES.concat(["uAlpha", "uVig"]);

  function Engine(canvas, o) {
    o = o || {};
    this.o = o; this.cv = canvas;
    var gl = canvas.getContext("webgl", {antialias: o.antialias !== false, alpha: !!o.alpha, premultipliedAlpha: false, preserveDrawingBuffer: !!o.preserve, stencil: true}) || canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("webgl");
    this.gl = gl;
    this.lowAuto = o.quality === "auto" || o.quality == null;
    this.quality = o.quality === "low" ? 0 : 1;
    this.progs = {};
    this.mk("main", C.VS_MAIN, FS_A); this.mk("lite", C.VS_LITE, FS_L);
    this.shadowProg = this.prog(C.VS_SHADOW, C.FS_SHADOW);
    this.sPos = gl.getAttribLocation(this.shadowProg, "aPos"); this.sMvp = gl.getUniformLocation(this.shadowProg, "uMvp");
    this.batches = []; this.dyn = new C.Mesh(65536); this.dynT = new C.Mesh(8192);
    this.dbuf = gl.createBuffer(); this.dbufT = gl.createBuffer(); this.dcap = 0; this.dcapT = 0;
    this.cam = {yaw: 0, pitch: 0.35, dist: 3, target: [0, 0.3, 0], fov: 40, iso: false, near: 0.05, far: 120};
    this.PV = m4(); this.eye = [0, 1, 3];
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.lamps = [[0, 30, 0], [0, 30, 0], [0, 30, 0], [0, 30, 0]];
    this.floorY = 0; this.reflect = 0; this.floorBatch = null; this.shadowR = o.shadowR || 4;
    this.fpsAcc = 0; this.fpsN = 0; this.slowT = 0;
    this.parts = []; for (var i = 0; i < (o.particles || 220); i++) this.parts.push({on: false});
    this.setEnv(o.tod || "day", o.wx || null);
    this.initShadow();
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  Engine.prototype.prog = function (vs, fs) {
    var gl = this.gl, p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (x) { var s = gl.createShader(x[0]); gl.shaderSource(s, x[1]); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(p, s); });
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  };
  Engine.prototype.mk = function (name, vs, fs) {
    var gl = this.gl, p = this.prog(vs, fs), u = {};
    UN.forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    this.progs[name] = {p: p, u: u, a: {pos: gl.getAttribLocation(p, "aPos"), col: gl.getAttribLocation(p, "aCol"), nrm: gl.getAttribLocation(p, "aNrm"), mat: gl.getAttribLocation(p, "aMat")}};
  };
  Engine.prototype.initShadow = function () {
    var gl = this.gl; this.shadowSize = 0;
    try {
      var size = 1024;
      this.sTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.sTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.sRb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, this.sRb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
      this.sFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.sFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.sRb);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) this.shadowSize = size;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } catch (e) { this.shadowSize = 0; }
    this.sMat = m4();
  };
  /* ambientación: la misma función que el partido (hora y clima); flood = luz de farolas/focos cercanos */
  Engine.prototype.setEnv = function (tod, wx, flood) {
    this.env = C.envFor(tod, wx); this.tod = tod; this.wx = wx;
    /* escenas pequeñas: sol más alto (la cabeza grande no tapa el cuerpo) y algo más de luz de cielo */
    if (this.o.sun) { var s = this.o.sun, l = Math.hypot(s[0], s[1], s[2]) || 1; this.env.sun = [s[0] / l, s[1] / l, s[2] / l]; }
    var ab = this.o.ambient || 1; if (ab !== 1) { this.env.sky = this.env.sky.map(function (x) { return x * ab; }); this.env.ground = this.env.ground.map(function (x) { return x * ab; }); }
    this.flood = flood == null ? this.env.flood * 0.12 : flood;
  };
  /* lotes estáticos: {id, verts (local), alpha, shadow, reflect, floor} */
  Engine.prototype.addStatic = function (id, verts, o) {
    o = o || {};
    var gl = this.gl, b = gl.createBuffer(), w = o.abs ? (verts instanceof Float32Array ? verts : new Float32Array(verts)) : this.world(verts);
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, w, gl.STATIC_DRAW);
    var bt = {id: id, b: b, n: w.length / STRIDE, alpha: o.alpha == null ? 1 : o.alpha, shadow: o.shadow !== false, reflect: !!o.reflect, floor: !!o.floor, crowd: !!o.crowd, show: true, M: null};
    this.removeStatic(id); this.batches.push(bt);
    if (bt.floor) this.floorBatch = bt;
    return bt;
  };
  Engine.prototype.removeStatic = function (id) {
    for (var i = this.batches.length - 1; i >= 0; i--) if (this.batches[i].id === id) { this.gl.deleteBuffer(this.batches[i].b); if (this.floorBatch === this.batches[i]) this.floorBatch = null; this.batches.splice(i, 1); }
  };
  /* de coordenadas locales de la escena a las del mundo del partido (cielo y luces centrados igual) */
  Engine.prototype.world = function (v) {
    var w = new Float32Array(v.length);
    w.set(v);
    for (var i = 0; i < w.length; i += STRIDE) { w[i] += ORG[0]; w[i + 1] += ORG[1]; w[i + 2] += ORG[2]; }
    return w;
  };
  /* escribe una malla local transformada por una matriz en el buffer dinámico (sin crear objetos) */
  Engine.prototype.bake = function (verts, Mx, tint, out) {
    var m = out || this.dyn; m.reserve(verts.length / STRIDE);
    var a = m.a, n = m.n, v = verts, M0 = Mx[0], M1 = Mx[1], M2 = Mx[2], M4 = Mx[4], M5 = Mx[5], M6 = Mx[6], M8 = Mx[8], M9 = Mx[9], M10 = Mx[10], M12 = Mx[12] + ORG[0], M13 = Mx[13] + ORG[1], M14 = Mx[14] + ORG[2];
    var tm = tint ? tint.m : null, to = tint ? tint.o : null;
    for (var i = 0; i < v.length; i += STRIDE) {
      var x = v[i], y = v[i + 1], z = v[i + 2];
      a[n] = M0 * x + M4 * y + M8 * z + M12; a[n + 1] = M1 * x + M5 * y + M9 * z + M13; a[n + 2] = M2 * x + M6 * y + M10 * z + M14;
      var r = v[i + 3], g = v[i + 4], bb = v[i + 5];
      if (tm) { var r2 = tm[0] * r + tm[1] * g + tm[2] * bb + to[0], g2 = tm[3] * r + tm[4] * g + tm[5] * bb + to[1], b2 = tm[6] * r + tm[7] * g + tm[8] * bb + to[2]; r = r2 < 0 ? 0 : r2 > 1 ? 1 : r2; g = g2 < 0 ? 0 : g2 > 1 ? 1 : g2; bb = b2 < 0 ? 0 : b2 > 1 ? 1 : b2; }
      a[n + 3] = r; a[n + 4] = g; a[n + 5] = bb;
      var nx = v[i + 6], ny = v[i + 7], nz = v[i + 8];
      a[n + 6] = M0 * nx + M4 * ny + M8 * nz; a[n + 7] = M1 * nx + M5 * ny + M9 * nz; a[n + 8] = M2 * nx + M6 * ny + M10 * nz;
      a[n + 9] = v[i + 9];
      n += STRIDE;
    }
    m.n = n;
  };
  /* partículas vóxel: cubos que encogen al desaparecer (corazones, estrellas y zetas son figuras de cubitos) */
  var SHAPES = {
    heart: [[-1, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [0, -2], [-2, 1], [2, 1]].map(function (p) { return [p[0], p[1] + 0.5]; }),
    star: [[0, 2], [0, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, -1], [-1, -2], [1, -2]],
    zz: [[-1, 1], [0, 1], [1, 1], [0, 0], [-1, -1], [0, -1], [1, -1]],
    note: [[1, 2], [1, 1], [1, 0], [0, -1], [1, -1], [2, 2]]
  };
  Engine.prototype.spawn = function (o) {
    for (var i = 0; i < this.parts.length; i++) {
      var q = this.parts[i]; if (q.on) continue;
      q.on = true; q.x = o.x; q.y = o.y; q.z = o.z; q.vx = o.vx || 0; q.vy = o.vy || 0; q.vz = o.vz || 0; q.g = o.g || 0; q.drag = o.drag || 0;
      q.t = 0; q.life = o.life || 1; q.s = o.s || 0.02; q.c = rgb(o.c || "#ffffff"); q.shape = o.shape || null; q.code = o.code || 0; q.floor = o.floor != null ? o.floor : null;
      q.spin = o.spin || 0; q.rot = Math.random() * PI; q.follow = o.follow || null; return q;
    }
    return null;
  };
  Engine.prototype.stepParticles = function (dt) {
    var m = this.dyn;
    for (var i = 0; i < this.parts.length; i++) {
      var q = this.parts[i]; if (!q.on) continue;
      q.t += dt; if (q.t >= q.life) { q.on = false; continue; }
      q.vy -= q.g * dt; if (q.drag) { var k = Math.max(0, 1 - q.drag * dt); q.vx *= k; q.vy *= k; q.vz *= k; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += q.spin * dt;
      if (q.floor != null && q.y < q.floor) { q.y = q.floor; q.vy = -q.vy * 0.3; q.vx *= 0.6; q.vz *= 0.6; }
      var k2 = q.t / q.life, s = q.s * (k2 > 0.65 ? 1 - (k2 - 0.65) / 0.35 : 1);
      if (s <= 0.001) continue;
      m.code = q.code;
      if (q.shape && SHAPES[q.shape]) {
        var sh = SHAPES[q.shape], cs = s * 0.42, ca = Math.cos(q.rot), sa = Math.sin(q.rot);
        for (var j = 0; j < sh.length; j++) { var lx = sh[j][0] * cs, ly = sh[j][1] * cs; m.box(q.x + ORG[0] + lx * ca, q.y + ORG[1] + ly, q.z + ORG[2] + lx * sa, cs, cs, cs, q.c, 1); }
      } else m.box(q.x + ORG[0], q.y + ORG[1] - s / 2, q.z + ORG[2], s, s, s, q.c, 0.9);
    }
    m.code = -1;
  };
  /* cámara: órbita (o isométrica fija) alrededor de un objetivo */
  Engine.prototype.camUpdate = function () {
    var c = this.cam, w = this.cv.width, h = this.cv.height, asp = w / Math.max(1, h);
    var yaw = c.iso ? PI / 4 : c.yaw, pitch = c.iso ? 0.6 : c.pitch, t = c.target;
    var e = [t[0] + Math.sin(yaw) * Math.cos(pitch) * c.dist, t[1] + Math.sin(pitch) * c.dist, t[2] + Math.cos(yaw) * Math.cos(pitch) * c.dist];
    this.eye = e;
    var fov = (asp < 0.8 ? c.fov * 1.25 : c.fov) * PI / 180;
    this.fovR = fov; this.asp = asp;
    this.PV = mul(persp(fov, asp, c.near, c.far), lookAt([e[0] + ORG[0], e[1] + ORG[1], e[2] + ORG[2]], [t[0] + ORG[0], t[1] + ORG[1], t[2] + ORG[2]], [0, 1, 0]));
  };
  Engine.prototype.project = function (p) {
    var m = this.PV, x = p[0] + ORG[0], y = p[1] + ORG[1], z = p[2] + ORG[2];
    var X = m[0] * x + m[4] * y + m[8] * z + m[12], Y = m[1] * x + m[5] * y + m[9] * z + m[13], Wc = m[3] * x + m[7] * y + m[11] * z + m[15];
    var r = this.cv.getBoundingClientRect(); return {x: r.left + (X / Wc * 0.5 + 0.5) * r.width, y: r.top + (1 - (Y / Wc * 0.5 + 0.5)) * r.height, w: Wc};
  };
  /* rayo desde un punto de la pantalla (coordenadas locales de la escena) */
  Engine.prototype.ray = function (cx, cy) {
    var r = this.cv.getBoundingClientRect(), nx = (cx - r.left) / r.width * 2 - 1, ny = 1 - (cy - r.top) / r.height * 2;
    var t = this.cam.target, e = this.eye, f = [t[0] - e[0], t[1] - e[1], t[2] - e[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1; f = [f[0] / fl, f[1] / fl, f[2] / fl];
    var rr = [-f[2], 0, f[0]], rl = Math.hypot(rr[0], rr[2]) || 1; rr = [rr[0] / rl, 0, rr[2] / rl];
    var u = [rr[1] * f[2] - rr[2] * f[1], rr[2] * f[0] - rr[0] * f[2], rr[0] * f[1] - rr[1] * f[0]];
    var th = Math.tan(this.fovR / 2), d = [f[0] + rr[0] * nx * th * this.asp + u[0] * ny * th, f[1] + u[1] * ny * th, f[2] + rr[2] * nx * th * this.asp + u[2] * ny * th];
    var dl = Math.hypot(d[0], d[1], d[2]); return {o: e.slice(), d: [d[0] / dl, d[1] / dl, d[2] / dl]};
  };
  Engine.prototype.groundAt = function (cx, cy, y) {
    var R = this.ray(cx, cy), h = y || 0; if (R.d[1] > -1e-4) return null;
    var k = (h - R.o[1]) / R.d[1]; return [R.o[0] + R.d[0] * k, h, R.o[2] + R.d[2] * k];
  };
  /* rayo contra una caja orientada (matriz de la parte + caja local): distancia o -1 */
  Engine.prototype.hitBox = function (R, Mx, bb) {
    var inv = invRigid(Mx), o = tp(inv, R.o[0], R.o[1], R.o[2]), d0 = tp(inv, R.o[0] + R.d[0], R.o[1] + R.d[1], R.o[2] + R.d[2]), d = [d0[0] - o[0], d0[1] - o[1], d0[2] - o[2]];
    var tmin = -1e9, tmax = 1e9;
    for (var a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < bb[a] || o[a] > bb[a + 3]) return -1; continue; }
      var t1 = (bb[a] - o[a]) / d[a], t2 = (bb[a + 3] - o[a]) / d[a]; if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
      if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return -1;
    }
    return tmax < 0 ? -1 : Math.max(0, tmin);
  };
  Engine.prototype.resize = function () {
    var w = this.cv.clientWidth || this.o.w || 300, h = this.cv.clientHeight || this.o.h || 300, d = this.dpr;
    var W = Math.round(w * d), H = Math.round(h * d);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
  };
  Engine.prototype.useShadows = function () { return this.shadowSize > 0 && this.quality > 0 && this.o.shadows !== false; };
  Engine.prototype.shadowMatrix = function () {
    var L = this.env.sun.slice(); if (L[1] < 0.25) { L[1] = 0.25; var l = Math.hypot(L[0], L[1], L[2]); L = [L[0] / l, L[1] / l, L[2] / l]; }
    var t = this.cam.target, c = [t[0] + ORG[0], ORG[1], t[2] + ORG[2]], R = this.shadowR, D = 20;
    var v = lookAt([c[0] + L[0] * D, c[1] + L[1] * D, c[2] + L[2] * D], c, Math.abs(L[1]) > 0.97 ? [0, 0, 1] : [0, 1, 0]);
    mul(ortho(-R, R, -R, R, D - 12, D + 12), v, this.sMat);
  };
  Engine.prototype.attrib = function (P) {
    var gl = this.gl;
    gl.enableVertexAttribArray(P.a.pos); gl.vertexAttribPointer(P.a.pos, 3, gl.FLOAT, false, STRIDE * 4, 0);
    if (P.a.col >= 0) { gl.enableVertexAttribArray(P.a.col); gl.vertexAttribPointer(P.a.col, 3, gl.FLOAT, false, STRIDE * 4, 12); }
    if (P.a.nrm >= 0) { gl.enableVertexAttribArray(P.a.nrm); gl.vertexAttribPointer(P.a.nrm, 3, gl.FLOAT, false, STRIDE * 4, 24); }
    if (P.a.mat >= 0) { gl.enableVertexAttribArray(P.a.mat); gl.vertexAttribPointer(P.a.mat, 1, gl.FLOAT, false, STRIDE * 4, 36); }
  };
  Engine.prototype.uploadDyn = function () {
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dbuf);
    if (this.dyn.a.length > this.dcap) { this.dcap = this.dyn.a.length; gl.bufferData(gl.ARRAY_BUFFER, this.dcap * 4, gl.DYNAMIC_DRAW); }
    if (this.dyn.n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dyn.a.subarray(0, this.dyn.n));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dbufT);
    if (this.dynT.a.length > this.dcapT) { this.dcapT = this.dynT.a.length; gl.bufferData(gl.ARRAY_BUFFER, this.dcapT * 4, gl.DYNAMIC_DRAW); }
    if (this.dynT.n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.dynT.a.subarray(0, this.dynT.n));
  };
  Engine.prototype.setUniforms = function (P, mvp, alpha) {
    var gl = this.gl, u = P.u, e = this.env, l = this.lamps;
    gl.uniformMatrix4fv(u.uMvp, false, mvp);
    if (u.uShadowMvp) gl.uniformMatrix4fv(u.uShadowMvp, false, this.sMat);
    gl.uniform1f(u.uTime, this.time || 0); gl.uniform1f(u.uCrowd, 0);
    gl.uniform3f(u.uEye, this.eye[0] + ORG[0], this.eye[1] + ORG[1], this.eye[2] + ORG[2]);
    gl.uniform3fv(u.uSunDir, e.sun); gl.uniform3fv(u.uSunCol, e.sunCol); gl.uniform3fv(u.uSkyAmb, e.sky); gl.uniform3fv(u.uGroundAmb, e.ground);
    gl.uniform3fv(u.uFogCol, e.fog); gl.uniform3fv(u.uZenith, e.zenith); gl.uniform3fv(u.uHorizon, e.horizon);
    gl.uniform1f(u.uFogDen, this.o.fog == null ? e.fogDen * 4 : this.o.fog); gl.uniform1f(u.uExposure, e.exposure * (this.o.exposure || 1)); gl.uniform1f(u.uStars, e.stars || 0);
    gl.uniform1f(u.uShadowOn, this.useShadows() && this.shadowPass ? 1 : 0); gl.uniform1f(u.uTexel, 1 / Math.max(1, this.shadowSize));
    gl.uniform1f(u.uFlood, this.flood); gl.uniform1f(u.uEmis, e.emis);
    gl.uniform2f(u.uRes, this.cv.width, this.cv.height);
    for (var i = 0; i < 4; i++) gl.uniform3f(u["uL" + i], l[i][0] + ORG[0], l[i][1] + ORG[1], l[i][2] + ORG[2]);
    gl.uniform3fv(u.uGrassMul, e.grassMul); gl.uniform4fv(u.uGrassMix, e.grassMix); gl.uniform1f(u.uWet, e.wet || 0);
    gl.uniform1f(u.uAlpha, alpha == null ? 1 : alpha); gl.uniform1f(u.uVig, this.o.vignette == null ? 1 : this.o.vignette);
    if (u.uShadow) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sTex); gl.uniform1i(u.uShadow, 0); }
  };
  Engine.prototype.drawBuf = function (P, buf, n) { if (!n) return; var gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, buf); this.attrib(P); gl.drawArrays(gl.TRIANGLES, 0, n); };
  /* un fotograma: fn(dt) escribe en this.dyn (opaco) y this.dynT (translúcido) */
  Engine.prototype.frame = function (dt, fn) {
    var gl = this.gl, self = this;
    this.time = (this.time || 0) + dt;
    /* calidad automática: si el móvil no llega, programa ligero sin sombras ni reflejo */
    if (this.lowAuto && this.quality > 0) {
      this.fpsAcc += dt; this.fpsN++;
      if (this.fpsN >= 30) { var avg = this.fpsAcc / this.fpsN; this.fpsAcc = 0; this.fpsN = 0; this.slowT = avg > 1 / 40 ? this.slowT + 1 : 0; if (this.slowT >= 3) { this.quality = 0; this.dpr = 1; if (this.onLow) this.onLow(); } }
    }
    this.resize(); this.camUpdate();
    this.dyn.reset(); this.dynT.reset();
    fn(dt);
    this.stepParticles(dt);
    this.uploadDyn();
    var P = this.quality > 0 ? this.progs.main : this.progs.lite;
    /* sombras */
    this.shadowPass = false;
    if (this.useShadows()) {
      this.shadowMatrix();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sFb); gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.BLEND);
      gl.useProgram(this.shadowProg); gl.uniformMatrix4fv(this.sMvp, false, this.sMat);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3);
      var SP = {a: {pos: this.sPos, col: -1, nrm: -1, mat: -1}};
      this.batches.forEach(function (b) { if (b.show && b.shadow && b.alpha >= 1 && !b.floor && !b.crowd) self.drawBuf(SP, b.b, b.n); });
      this.drawBuf(SP, this.dbuf, this.dyn.n / STRIDE);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.enable(gl.BLEND);
      this.shadowPass = true;
    }
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    var bg = this.o.clear || [0, 0, 0, 0];
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(P.p);
    /* suelo con reflejo tenue: base opaca, figura reflejada con poca opacidad y la profundidad del suelo después */
    var fb = this.floorBatch, refl = this.reflect > 0 && this.quality > 0 && fb;
    if (refl) {
      /* el suelo marca el stencil: el reflejo solo se ve dentro del suelo */
      gl.enable(gl.STENCIL_TEST); gl.clearStencil(0); gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.ALWAYS, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.depthMask(false); this.setUniforms(P, this.PV, 1); this.drawBuf(P, fb.b, fb.n); gl.depthMask(true);
      gl.stencilFunc(gl.EQUAL, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      var fy = this.floorY + ORG[1], Mr = mul(this.PV, M(T(0, 2 * fy, 0), S(1, -1, 1)));
      var save = this.shadowPass; this.shadowPass = false;
      this.setUniforms(P, Mr, this.reflect * 0.6); this.drawBuf(P, this.dbuf, this.dyn.n / STRIDE);
      this.batches.forEach(function (b) { if (b.show && b.reflect) self.drawBuf(P, b.b, b.n); });
      var Mr2 = mul(this.PV, M(T(0.012, 2 * fy, 0.008), S(1, -1, 1)));
      this.setUniforms(P, Mr2, this.reflect * 0.4); this.drawBuf(P, this.dbuf, this.dyn.n / STRIDE);
      this.shadowPass = save;
      gl.disable(gl.STENCIL_TEST);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.colorMask(false, false, false, false); this.setUniforms(P, this.PV, 1); this.drawBuf(P, fb.b, fb.n); gl.colorMask(true, true, true, true);
    }
    this.setUniforms(P, this.PV, 1);
    this.batches.forEach(function (b) { if (b.show && b.alpha >= 1 && !(refl && b === fb)) { if (b.crowd) gl.uniform1f(P.u.uCrowd, self.crowdAmt || 0); self.drawBuf(P, b.b, b.n); if (b.crowd) gl.uniform1f(P.u.uCrowd, 0); } });
    this.drawBuf(P, this.dbuf, this.dyn.n / STRIDE);
    /* translúcidos al final, sin escribir profundidad */
    gl.depthMask(false);
    this.batches.forEach(function (b) { if (b.show && b.alpha < 1) { self.setUniforms(P, self.PV, b.alpha); self.drawBuf(P, b.b, b.n); } });
    if (this.dynT.n) { this.setUniforms(P, this.PV, this.alphaT || 0.4); this.drawBuf(P, this.dbufT, this.dynT.n / STRIDE); }
    gl.depthMask(true);
  };
  Engine.prototype.dispose = function () { try { var e = this.gl.getExtension("WEBGL_lose_context"); if (e) e.loseContext(); } catch (er) {} };

  function supported() { try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } }
  return {MX: MX, MAT: MAT, STRIDE: STRIDE, rgb: rgb, mix: mix, shade: shade, packC: packC, VGrid: VGrid, meshGrid: meshGrid, meshArray: meshArray, boxMesh: boxMesh,
    Engine: Engine, supported: supported, core: C};
})();
