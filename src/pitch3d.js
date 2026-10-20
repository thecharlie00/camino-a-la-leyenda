/* Partido 3D experimental para el directo.
 *
 * Arquitectura:
 *   · Simulación visual (posesión, balón, saques, descanso) alimentada por Pitch.state/Pitch.event.
 *   · match41 sigue siendo la autoridad del resultado y del minuto; este módulo no altera el marcador.
 *   · WebGL 1 sin dependencias. Campo estático en un VBO y jugadores/balón en un buffer dinámico reutilizado.
 *   · Fallback transparente al campo 2D si no hay WebGL o se pierde el contexto.
 *
 * Activación: ?pitch3d=1 o localStorage "camino.pitch3d" = "1".
 * API compatible con Pitch: mount, teams, state, event, busy, reset, freeze, destroy.
 */
var Pitch3D = (function () {
  "use strict";

  var LEN = 105, WID = 68, MIDZ = WID / 2, POST = 3.66, BAR = 2.44, GRAV = 9.8;
  var PI = Math.PI, TAU = PI * 2, STEP = 1 / 60, AI_STEP = 1 / 30;
  var LIGHT = norm3([0.42, 0.86, 0.28]);
  var BASE = {POR: [0.045, 0.5], LD: [0.24, 0.84], LI: [0.24, 0.16], DFC: [0.2, 0.5], MCD: [0.36, 0.5], MC: [0.46, 0.5], MCO: [0.58, 0.5],
    MD: [0.52, 0.86], MI: [0.52, 0.14], ED: [0.7, 0.84], EI: [0.7, 0.16], DC: [0.76, 0.5]};
  var SPREAD = {DFC: [0.36, 0.64, 0.5], MCD: [0.42, 0.58, 0.5], MC: [0.33, 0.67, 0.5], DC: [0.4, 0.6, 0.5], MCO: [0.38, 0.62, 0.5]};
  var DEF = /^(POR|DFC|LD|LI|MCD)$/, MID = /^(MC|MCD|MCO|MD|MI)$/, FWD = /^(DC|ED|EI|MCO)$/;
  var SHIRT = ["#f5b326", "#5db8ff"], SHORTS = [[0.06, 0.10, 0.18], [0.88, 0.90, 0.84]], SKIN = [0.72, 0.52, 0.37], HAIR = [0.12, 0.075, 0.045];
  var SKINS = [[0.88, 0.69, 0.54], [0.72, 0.52, 0.37], [0.55, 0.37, 0.24], [0.38, 0.25, 0.16], [0.94, 0.79, 0.66]];
  var HAIRS = [[0.08, 0.05, 0.03], [0.25, 0.14, 0.07], [0.55, 0.35, 0.12], [0.82, 0.68, 0.34], [0.14, 0.12, 0.10]];
  var BOOT = [0.07, 0.08, 0.09], NET = [0.78, 0.86, 0.80], WHITE = [0.9, 0.94, 0.88];

  var gl = null, canvas = null, host = null, hud = null, replayBtn = null, disposed = true, frozen = false;
  var raf = 0, lastTs = 0, acc = 0, aiAcc = 0, histAcc = 0, frameCount = 0, fps = 0, fpsFrames = 0, fpsStart = 0;
  var quality = 1, staticMesh = null, staticCount = 0, dyn = null, dynCapacity = 0;
  var program = null, locations = null, staticBuf = null, dynBuf = null;
  var viewW = 1, viewH = 1, dpr = 1;
  var opts = {}, colors = SHIRT.slice(), reduced = false;
  var cam = {x: LEN / 2, z: MIDZ, back: 34, height: 22, lookX: LEN / 2, lookZ: MIDZ, shake: 0};
  var fpsBad = 0, fpsGood = 0;
  var projMat = new Float32Array(16), viewMat = new Float32Array(16), mvpMat = new Float32Array(16);
  var eyeArr = new Float32Array(3), lookArr = new Float32Array(3);
  var fogArr = new Float32Array([0.018, 0.035, 0.055]), UP = [0, 1, 0];

  /* ------------------------------------------------------------------ estado */

  function newBall() {
    return {x: LEN / 2, z: MIDZ, y: 0.22, vx: 0, vy: 0, vz: 0, mode: "dead", side: 0, idx: -1,
      kind: "", timer: 0, fl: null, next: null, lastTouch: 0, claim: null};
  }

  function newSim() {
    return {
      time: 0, rate: 1, own: 0, bx: 50, half: 1, kickoffSide: 0, ended: false, started: false,
      attack: [1, -1], players: [[], []], red: [{}, {}], tactics: [defTac(), defTac()],
      ball: newBall(), action: null, queue: [], restart: null, pendingOwn: null,
      history: [], replay: null, netT: 0, shake: 0, banner: ""
    };
  }

  function defTac() { return {line: 1, width: 1, pass: 1, tempo: 1, ment: 1, press: false, blk: 0}; }

  var sim = newSim();

  function clock() { return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function hashKey(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }
  function dist(ax, az, bx, bz) { return Math.sqrt(dist2(ax, az, bx, bz)); }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function wrapA(a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
  function angleTo(a, b, k) { return a + wrapA(b - a) * k; }
  function norm3(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function rgb(hex) {
    var s = String(hex || "#ffffff").replace("#", "");
    if (s.length === 3) s = s.split("").map(function (x) { return x + x; }).join("");
    var n = parseInt(s, 16); if (!isFinite(n)) n = 0xffffff;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function kitColor(c, fallback) {
    if (Object.prototype.toString.call(c) === "[object Array]") return c;
    var q = rgb(c);
    return isFinite(q[0]) ? q : fallback;
  }
  function shade(c, k) { return [clamp(c[0] * k, 0, 1), clamp(c[1] * k, 0, 1), clamp(c[2] * k, 0, 1)]; }
  function mix(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  function label(k) { return typeof tr === "function" ? tr(k) : k; }
  function actorAt(side, idx) { var a = sim.players[side] && sim.players[side][idx]; return a && !a.gone && !a.sentOff ? a : null; }
  function listOf(side) { return (sim.players[side] || []).filter(function (a) { return a && !a.gone && !a.sentOff; }); }
  function isDef(p) { return DEF.test(p); }
  function isMid(p) { return MID.test(p); }
  function isFwd(p) { return FWD.test(p); }
  function goalX(side) { return sim.attack[side] > 0 ? LEN : 0; }
  function ownX(side) { return sim.attack[side] > 0 ? 0 : LEN; }

  /* ------------------------------------------------------------------ malla */

  function Mesh(cap) {
    this.a = new Float32Array(cap || 16384);
    this.n = 0;
  }
  Mesh.prototype.reset = function () { this.n = 0; };
  Mesh.prototype.reserve = function (verts) {
    var need = this.n + verts * 6;
    if (need <= this.a.length) return;
    var cap = this.a.length;
    while (cap < need) cap *= 2;
    var b = new Float32Array(cap); b.set(this.a); this.a = b;
  };
  Mesh.prototype.v = function (x, y, z, c) {
    var a = this.a, n = this.n;
    a[n] = x; a[n + 1] = y; a[n + 2] = z; a[n + 3] = c[0]; a[n + 4] = c[1]; a[n + 5] = c[2];
    this.n = n + 6;
  };
  Mesh.prototype.tri = function (A, B, C, c) {
    this.reserve(3);
    var ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    var vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    var lit = 0.58 + 0.42 * Math.abs((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / l);
    var q = [clamp(c[0] * lit, 0, 1), clamp(c[1] * lit, 0, 1), clamp(c[2] * lit, 0, 1)];
    this.v(A[0], A[1], A[2], q); this.v(B[0], B[1], B[2], q); this.v(C[0], C[1], C[2], q);
  };
  Mesh.prototype.quad = function (A, B, C, D, c) { this.tri(A, B, C, c); this.tri(A, C, D, c); };
  Mesh.prototype.box = function (x, y, z, w, h, d, c) {
    var x0 = x - w / 2, x1 = x + w / 2, y0 = y, y1 = y + h, z0 = z - d / 2, z1 = z + d / 2;
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c);
    this.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], c);
    this.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], c);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], c);
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], c);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], c);
  };
  Mesh.prototype.ellipsoid = function (cx, cy, cz, rx, ry, rz, c, seg, rings) {
    seg = seg || 8; rings = rings || 5;
    for (var j = 0; j < rings; j++) {
      var p0 = -PI / 2 + j * PI / rings, p1 = -PI / 2 + (j + 1) * PI / rings;
      for (var i = 0; i < seg; i++) {
        var a0 = i * TAU / seg, a1 = (i + 1) * TAU / seg;
        var a = [cx + rx * Math.cos(p0) * Math.cos(a0), cy + ry * Math.sin(p0), cz + rz * Math.cos(p0) * Math.sin(a0)];
        var b = [cx + rx * Math.cos(p0) * Math.cos(a1), cy + ry * Math.sin(p0), cz + rz * Math.cos(p0) * Math.sin(a1)];
        var d = [cx + rx * Math.cos(p1) * Math.cos(a0), cy + ry * Math.sin(p1), cz + rz * Math.cos(p1) * Math.sin(a0)];
        var e = [cx + rx * Math.cos(p1) * Math.cos(a1), cy + ry * Math.sin(p1), cz + rz * Math.cos(p1) * Math.sin(a1)];
        this.tri(a, d, b, c); this.tri(b, d, e, c);
      }
    }
  };
  Mesh.prototype.limb = function (A, B, r, c) {
    var dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2];
    var l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    var dir = [dx / l, dy / l, dz / l];
    var ref = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var u = norm3(cross3(dir, ref)), v = norm3(cross3(dir, u));
    function p(P, su, sv) { return [P[0] + u[0] * r * su + v[0] * r * sv, P[1] + u[1] * r * su + v[1] * r * sv, P[2] + u[2] * r * su + v[2] * r * sv]; }
    var a0 = p(A, -1, -1), a1 = p(A, 1, -1), a2 = p(A, 1, 1), a3 = p(A, -1, 1);
    var b0 = p(B, -1, -1), b1 = p(B, 1, -1), b2 = p(B, 1, 1), b3 = p(B, -1, 1);
    this.quad(a0, a1, b1, b0, c); this.quad(a1, a2, b2, b1, c); this.quad(a2, a3, b3, b2, c); this.quad(a3, a0, b0, b3, c);
    this.quad(a3, a2, a1, a0, c); this.quad(b0, b1, b2, b3, c);
  };
  Mesh.prototype.line = function (x1, z1, x2, z2, c, w, y) {
    var dx = x2 - x1, dz = z2 - z1, n = Math.sqrt(dx * dx + dz * dz) || 1;
    var ox = -dz / n * (w || 0.12), oz = dx / n * (w || 0.12), yy = y == null ? 0.04 : y;
    this.quad([x1 + ox, yy, z1 + oz], [x2 + ox, yy, z2 + oz], [x2 - ox, yy, z2 - oz], [x1 - ox, yy, z1 - oz], c);
  };
  Mesh.prototype.circle = function (cx, cz, r, c, seg, y) {
    seg = seg || 32; y = y == null ? 0.045 : y;
    for (var i = 0; i < seg; i++) {
      var a = i * TAU / seg, b = (i + 1) * TAU / seg;
      this.tri([cx, y, cz], [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y, cz + Math.sin(b) * r], c);
    }
  };
  Mesh.prototype.ring = function (cx, cz, r, width, c, seg, y) {
    seg = seg || 32; y = y == null ? 0.045 : y;
    var r0 = Math.max(0.01, r - width / 2), r1 = r + width / 2;
    for (var i = 0; i < seg; i++) {
      var a = i * TAU / seg, b = (i + 1) * TAU / seg;
      var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      this.quad([cx + ca * r0, y, cz + sa * r0], [cx + ca * r1, y, cz + sa * r1], [cx + cb * r1, y, cz + sb * r1], [cx + cb * r0, y, cz + sb * r0], c);
    }
  };

  /* ------------------------------------------------------------------ campo */

  function buildField(m) {
    var green = [0.055, 0.30, 0.13], stripe = [0.065, 0.35, 0.15], dark = [0.028, 0.075, 0.05];
    var board = [0.12, 0.24, 0.27], stand = [0.055, 0.075, 0.10], tier = [0.085, 0.105, 0.14];
    m.quad([-38, -0.08, -24], [LEN + 38, -0.08, -24], [LEN + 38, -0.08, WID + 24], [-38, -0.08, WID + 24], dark);
    m.quad([0, 0, 0], [LEN, 0, 0], [LEN, 0, WID], [0, 0, WID], green);
    for (var i = 0; i < 12; i++) if (i % 2 === 0) m.quad([i * LEN / 12, 0.008, 0], [(i + 1) * LEN / 12, 0.008, 0], [(i + 1) * LEN / 12, 0.008, WID], [i * LEN / 12, 0.008, WID], stripe);

    m.line(0, 0, LEN, 0, WHITE, 0.13); m.line(LEN, 0, LEN, WID, WHITE, 0.13);
    m.line(LEN, WID, 0, WID, WHITE, 0.13); m.line(0, WID, 0, 0, WHITE, 0.13);
    m.line(LEN / 2, 0, LEN / 2, WID, WHITE, 0.12);
    m.ring(LEN / 2, MIDZ, 9.15, 0.13, WHITE, 40);
    m.circle(LEN / 2, MIDZ, 0.11, WHITE, 10);
    [0, LEN].forEach(function (end) {
      var dir = end === 0 ? 1 : -1, x = end;
      m.line(x, MIDZ - 20.16, x + dir * 16.5, MIDZ - 20.16, WHITE, 0.12);
      m.line(x + dir * 16.5, MIDZ - 20.16, x + dir * 16.5, MIDZ + 20.16, WHITE, 0.12);
      m.line(x + dir * 16.5, MIDZ + 20.16, x, MIDZ + 20.16, WHITE, 0.12);
      m.line(x, MIDZ - 9.16, x + dir * 5.5, MIDZ - 9.16, WHITE, 0.1);
      m.line(x + dir * 5.5, MIDZ - 9.16, x + dir * 5.5, MIDZ + 9.16, WHITE, 0.1);
      m.line(x + dir * 5.5, MIDZ + 9.16, x, MIDZ + 9.16, WHITE, 0.1);
      m.circle(x + dir * 11, MIDZ, 0.11, WHITE, 10);
      /* portería: postes, larguero, red trasera y laterales */
      var z1 = MIDZ - POST, z2 = MIDZ + POST, back = end === 0 ? -1.9 : LEN + 1.9;
      m.box(x, 0, z1, 0.14, BAR, 0.14, [0.94, 0.96, 0.91]);
      m.box(x, 0, z2, 0.14, BAR, 0.14, [0.94, 0.96, 0.91]);
      m.box(x, BAR - 0.07, MIDZ, 0.14, 0.14, POST * 2, [0.94, 0.96, 0.91]);
      m.box(back, 0, z1, 0.08, 2.35, 0.08, NET); m.box(back, 0, z2, 0.08, 2.35, 0.08, NET);
      m.box(back, 2.3, MIDZ, 0.08, 0.08, POST * 2, NET);
      for (var y = 0.3; y < 2.3; y += 0.42) m.box(back, y, MIDZ, 0.025, 0.025, POST * 2, NET);
      for (var zz = -POST + 0.6; zz < POST; zz += 0.7) m.box(back, 0.05, MIDZ + zz, 0.025, 2.32, 0.025, NET);
      for (var yy = 0.45; yy < 2.2; yy += 0.6) {
        m.box((x + back) / 2, yy, z1, Math.abs(back - x), 0.025, 0.025, NET);
        m.box((x + back) / 2, yy, z2, Math.abs(back - x), 0.025, 0.025, NET);
      }
    });
    /* vallas publicitarias */
    for (var bx = 5; bx < LEN; bx += 10) {
      var c0 = (bx / 10) % 2 ? [0.10, 0.28, 0.42] : [0.34, 0.14, 0.10];
      m.box(bx, 0.02, -1.4, 8.6, 0.9, 0.2, c0); m.box(bx, 0.02, WID + 1.4, 8.6, 0.9, 0.2, c0);
    }
    /* gradas laterales por niveles */
    for (var t = 0; t < 3; t++) {
      m.box(LEN / 2, 0.5 + t * 1.15, -7 - t * 3.4, LEN + 18, 1.15, 3.2, t ? tier : stand);
      m.box(LEN / 2, 0.5 + t * 1.15, WID + 7 + t * 3.4, LEN + 18, 1.15, 3.2, t ? tier : stand);
    }
    /* fondos */
    for (var e2 = 0; e2 < 2; e2++) {
      var fx = e2 ? LEN + 8 : -8, fs = e2 ? 1 : -1;
      for (var k = 0; k < 3; k++) m.box(fx + fs * k * 3.4, 0.5 + k * 1.15, MIDZ, 3.2, 1.15, WID + 12, k ? tier : stand);
    }
    /* torres de luz en las esquinas */
    [[-5, -5], [LEN + 5, -5], [-5, WID + 5], [LEN + 5, WID + 5]].forEach(function (p) {
      m.box(p[0], 0, p[1], 0.28, 13, 0.28, [0.16, 0.18, 0.2]);
      m.box(p[0], 13, p[1], 3.0, 0.18, 0.5, [0.85, 0.88, 0.72]);
    });
  }

  /* ------------------------------------------------------------------ shaders / GL */

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  }

  function initGL() {
    gl = canvas.getContext("webgl", {alpha: false, antialias: quality > 0.6, powerPreference: "default"}) ||
      canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL no disponible");
    var vs = shader(gl.VERTEX_SHADER,
      "attribute vec3 aPos;attribute vec3 aCol;uniform mat4 uMvp;varying vec3 vCol;varying vec3 vWorld;" +
      "void main(){vWorld=aPos;vCol=aCol;gl_Position=uMvp*vec4(aPos,1.0);}");
    var fs = shader(gl.FRAGMENT_SHADER,
      "precision mediump float;varying vec3 vCol;varying vec3 vWorld;uniform vec3 uFog;uniform vec3 uEye;" +
      "uniform float uNear;uniform float uFar;void main(){float d=distance(vWorld,uEye);" +
      "float f=smoothstep(uNear,uFar,d);gl_FragColor=vec4(mix(vCol,uFog,f),1.0);}");
    program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link");
    gl.useProgram(program);
    locations = {pos: gl.getAttribLocation(program, "aPos"), col: gl.getAttribLocation(program, "aCol"),
      mvp: gl.getUniformLocation(program, "uMvp"), fog: gl.getUniformLocation(program, "uFog"),
      eye: gl.getUniformLocation(program, "uEye"), near: gl.getUniformLocation(program, "uNear"),
      far: gl.getUniformLocation(program, "uFar")};
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
    gl.clearColor(0.018, 0.035, 0.055, 1);
    staticBuf = gl.createBuffer(); dynBuf = gl.createBuffer();
    staticMesh = new Mesh(65536); buildField(staticMesh);
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.bufferData(gl.ARRAY_BUFFER, staticMesh.a.subarray(0, staticMesh.n), gl.STATIC_DRAW);
    staticCount = staticMesh.n / 6;
    dyn = new Mesh(131072); dynCapacity = dyn.a.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    gl.bufferData(gl.ARRAY_BUFFER, dynCapacity * 4, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /* ------------------------------------------------------------------ equipos */

  function worldBaseX(side, nx) { return sim.attack[side] > 0 ? nx * LEN : LEN - nx * LEN; }

  function makeActor(side, slot, key, nx, nz) {
    var h = hashKey(key);
    var a = {side: side, slot: slot, key: key, pos: "MC", id: key, number: 0,
      nx: nx, nz: nz, baseX: worldBaseX(side, nx), baseZ: nz * WID,
      x: worldBaseX(side, nx), z: nz * WID, tx: worldBaseX(side, nx), tz: nz * WID,
      vx: 0, vz: 0, facing: sim.attack[side] > 0 ? PI / 2 : -PI / 2, runPhase: Math.random() * TAU,
      skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], scale: 0.94 + (h % 9) * 0.015,
      pace: 1, st: 1, ovr: 70, maxSp: 6.4, gk: false, gone: false, sentOff: false, anim: null};
    return a;
  }

  function syncTeam(side, list, fixed) {
    list = list || [];
    var old = sim.players[side] || [], map = {}, counts = {}, seen = {};
    old.forEach(function (a) { if (a) map[a.key] = a; });
    list.forEach(function (p) { if (p) counts[p.pos] = (counts[p.pos] || 0) + 1; });
    var arr = [];
    for (var i = 0; i < 11; i++) {
      var p = list[i];
      if (!p) { arr[i] = null; continue; }
      var key = p.id != null ? String(p.id) : side + ":" + i;
      var nx, nz = 0.5, b = BASE[p.pos] || [0.5, 0.5];
      nx = b[0]; nz = b[1];
      var k = seen[p.pos] = (seen[p.pos] || 0) + 1;
      if (SPREAD[p.pos]) {
        if (counts[p.pos] === 2) nz = SPREAD[p.pos][k - 1];
        else if (counts[p.pos] >= 3) nz = [0.28, 0.5, 0.72][Math.min(2, k - 1)];
      }
      var a = map[key];
      if (!a) a = makeActor(side, i, key, nx, nz);
      a.slot = i; a.pos = p.pos || "MC"; a.nm = p.nm || ""; a.nx = nx; a.nz = nz;
      a.baseX = worldBaseX(side, nx); a.baseZ = nz * WID;
      a.gk = a.pos === "POR"; a.ovr = p.ovr == null ? 70 : +p.ovr;
      a.st = p.st == null ? 1 : clamp(+p.st, 0.05, 1);
      var fza = p.fza == null ? a.ovr : +p.fza;
      a.pace = clamp(0.76 + (fza - 50) * 0.004 + (a.st - 0.7) * 0.12, 0.72, 1.16);
      a.number = fixed && fixed[p.id] != null ? fixed[p.id] : (p.num || 0);
      a.gone = !!p.gone || !!sim.red[side][key];
      a.sentOff = !!sim.red[side][key];
      arr[i] = a;
      map[key] = null;
    }
    old.forEach(function (a) { if (a && map[a.key] !== null) a.gone = true; });
    sim.players[side] = arr;
    var b = sim.ball;
    if (b.mode === "held" && b.side === side && !actorAt(side, b.idx)) releaseBall(0, 0, 0);
  }

  function mirrorTeam(side) {
    (sim.players[side] || []).forEach(function (a) {
      if (!a) return;
      a.x = LEN - a.x; a.tx = LEN - a.tx; a.baseX = LEN - a.baseX; a.vx = -a.vx;
      a.facing = PI - a.facing;
    });
  }

  /* ------------------------------------------------------------------ IA */

  function nearestActor(side, x, z, noGK, exclude) {
    var best = null, bd = 1e9, list = listOf(side);
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a === exclude || (noGK && a.gk)) continue;
      var d = dist2(a.x, a.z, x, z);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  function nearestOpponent(a, radius) {
    var list = listOf(1 - a.side), best = null, bd = radius * radius;
    for (var i = 0; i < list.length; i++) {
      var q = list[i]; if (q.gk) continue;
      var d = dist2(a.x, a.z, q.x, q.z);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  function aiTick() {
    var b = sim.ball, carrier = b.mode === "held" ? actorAt(b.side, b.idx) : null;
    var owner = b.mode === "held" ? b.side : (b.lastTouch != null ? b.lastTouch : sim.own);
    for (var side = 0; side < 2; side++) {
      var dir = sim.attack[side], tac = sim.tactics[side] || defTac(), defending = side !== owner;
      var prog = clamp((dir > 0 ? b.x / LEN : 1 - b.x / LEN), 0, 1);
      var shiftZ = (b.z - MIDZ) * (defending ? 0.30 : 0.42);
      var line = tac.line == null ? 1 : tac.line, width = tac.width == null ? 1 : tac.width;
      var wScale = width === 0 ? 0.78 : width === 2 ? 1.14 : 1;
      var nearest = nearestActor(side, b.x, b.z, true), second = null;
      var list = listOf(side), best2 = 1e9;
      for (var q = 0; q < list.length; q++) {
        if (list[q] === nearest || list[q].gk) continue;
        var d2 = dist2(list[q].x, list[q].z, b.x, b.z);
        if (d2 < best2) { best2 = d2; second = list[q]; }
      }
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (a.gone) continue;
        var tx, tz, maxSp = 6.4 * a.pace;
        if (a.gk) {
          var own = ownX(side), gx = own + dir * 2.0;
          if (Math.abs(b.x - own) > 32) gx = own + dir * 6;
          a.tx = clamp(gx, 0.8, LEN - 0.8);
          a.tz = clamp(b.z, MIDZ - POST + 0.4, MIDZ + POST - 0.4);
          a.maxSp = 5.4;
          continue;
        }
        tx = a.baseX + dir * ((prog - 0.5) * (defending ? 5 : 8));
        tz = MIDZ + (a.baseZ - MIDZ) * wScale + shiftZ;
        if (defending) {
          tx -= dir * (1 - prog) * (4 + line * 2);
          tx += dir * line * 2.0;
          var mark = nearestOpponent(a, 14);
          if (mark && isDef(a.pos)) { tx = lerp(tx, mark.x - dir * 1.1, 0.45); tz = lerp(tz, mark.z, 0.5); }
          if (a === nearest && b.mode !== "dead" && dist(a.x, a.z, b.x, b.z) < 22) {
            tx = b.x - dir * 0.9; tz = b.z; maxSp = 7.2 * a.pace;
          }
        } else {
          tx += dir * (2 + (isFwd(a.pos) ? 4 : isMid(a.pos) ? 1.5 : 0));
          if (carrier && a !== carrier && dist(a.x, a.z, carrier.x, carrier.z) < 5) {
            tz += (a.z < carrier.z ? -1 : 1) * 2.5; tx -= dir * 2;
          }
        }
        var px = b.x + b.vx * 0.25, pz = b.z + b.vz * 0.25;
        if (b.mode === "loose" || b.mode === "flight") {
          if (a === nearest) { tx = px; tz = pz; maxSp = 7.8 * a.pace; }
          else if (a === second && b.mode === "loose") { tx = px; tz = pz; maxSp = 7.2 * a.pace; }
        }
        if (carrier && a === carrier && !sim.action) {
          var gx2 = goalX(side);
          tx = clamp(b.x + dir * 7, 3, LEN - 3);
          tz = clamp(b.z + (MIDZ - b.z) * 0.35 + (a.baseZ - MIDZ) * 0.25, 4, WID - 4);
          if (Math.abs(gx2 - b.x) < 28) { tx = gx2 - dir * 10; tz = MIDZ + (b.z - MIDZ) * 0.4; }
          maxSp = 5.8 * a.pace;
          var opp = nearestActor(1 - side, b.x + dir * 4, b.z, true);
          if (opp && dist(opp.x, opp.z, b.x, b.z) < 5) tz += (b.z > opp.z ? 1 : -1) * 4;
        }
        if (sim.action && sim.action.shooter === a && sim.action.stage !== "outcome") { tx = sim.action.originX; tz = sim.action.originZ; maxSp = 7.5; }
        a.tx = clamp(tx, 1, LEN - 1); a.tz = clamp(tz, 1.5, WID - 1.5); a.maxSp = maxSp;
      }
    }
    separate();
  }

  function separate() {
    var all = [], s, i;
    for (s = 0; s < 2; s++) for (i = 0; i < 11; i++) { var a = actorAt(s, i); if (a && !a.gk) all.push(a); }
    for (i = 0; i < all.length; i++) for (var j = i + 1; j < all.length; j++) {
      var p = all[i], q = all[j];
      var dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz;
      if (d2 > 2.25 || d2 < 0.0001) continue;
      var d = Math.sqrt(d2), push = (1.5 - d) * 0.5;
      dx /= d; dz /= d;
      p.x = clamp(p.x - dx * push, 1, LEN - 1); p.z = clamp(p.z - dz * push, 1.5, WID - 1.5);
      q.x = clamp(q.x + dx * push, 1, LEN - 1); q.z = clamp(q.z + dz * push, 1.5, WID - 1.5);
    }
  }

  function moveActors(dt) {
    for (var s = 0; s < 2; s++) {
      var list = sim.players[s] || [];
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (!a || a.gone || a.sentOff) continue;
        if (a.anim && a.anim.type === "dive") {
          var k = clamp(a.anim.t / a.anim.dur, 0, 1), e = ease(k);
          a.x = clamp(lerp(a.anim.x0, a.anim.x1, e), 0, LEN); a.z = clamp(lerp(a.anim.z0, a.anim.z1, e), 0, WID);
          a.vx = 0; a.vz = 0; continue;
        }
        var dx = a.tx - a.x, dz = a.tz - a.z, d = Math.sqrt(dx * dx + dz * dz);
        var want = Math.min(a.maxSp || 6, d * 3.4);
        var dvx = 0, dvz = 0;
        if (d > 0.001) { dvx = dx / d * want - a.vx; dvz = dz / d * want - a.vz; }
        var lim = 16 * dt, l = Math.sqrt(dvx * dvx + dvz * dvz);
        if (l > lim) { dvx = dvx / l * lim; dvz = dvz / l * lim; }
        a.vx += dvx; a.vz += dvz;
        a.x = clamp(a.x + a.vx * dt, 1, LEN - 1);
        a.z = clamp(a.z + a.vz * dt, 1.5, WID - 1.5);
        var sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
        if (sp > 0.35) a.facing = angleTo(a.facing, Math.atan2(a.vx, a.vz), Math.min(1, dt * 8));
        a.runPhase += sp * dt * 2.3;
      }
    }
  }

  function updateAnimations(dt) {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s] && sim.players[s][i];
      if (!a || !a.anim) continue;
      var card = sim.action && sim.action.type === "card" && sim.action.player === a;
      if ((a.gone || a.sentOff) && !card) continue;
      a.anim.t += dt;
      if (a.anim.t >= a.anim.dur) {
        if (a.anim.type === "celebrate" && a.anim.tx != null) { a.x = a.anim.tx; a.z = a.anim.tz; }
        a.anim = null;
      }
    }
  }

  /* ------------------------------------------------------------------ balón */

  function launchBall(tx, tz, ty, dur, arc, next) {
    var b = sim.ball;
    b.fl = {x0: b.x, y0: b.y, z0: b.z, x1: tx, y1: ty, z1: tz, t: 0, dur: Math.max(0.08, dur), arc: arc || 0};
    b.mode = "flight"; b.next = next || null; b.timer = dur; b.vy = 0;
    b.vx = (tx - b.x) / Math.max(0.08, dur); b.vz = (tz - b.z) / Math.max(0.08, dur);
    b.lastTouch = sim.own === 1 ? 1 : 0;
  }

  function releaseBall(vx, vz, vy) {
    var b = sim.ball;
    b.mode = "loose"; b.fl = null; b.next = null; b.vx = vx || 0; b.vz = vz || 0; b.vy = vy || 0;
  }

  function giveTo(side, idx) {
    var a = actorAt(side, idx);
    if (!a) return false;
    var b = sim.ball;
    b.mode = "held"; b.side = side; b.idx = idx; b.fl = null; b.next = null; b.vx = 0; b.vy = 0; b.vz = 0;
    b.lastTouch = side; sim.own = side;
    return true;
  }

  function updateBall(dt) {
    var b = sim.ball, a = null;
    if (b.mode === "held") {
      a = actorAt(b.side, b.idx);
      if (!a) { releaseBall(0, 0, 0); return; }
      var fx = Math.sin(a.facing), fz = Math.cos(a.facing);
      b.x = lerp(b.x, a.x + fx * 0.44, Math.min(1, dt * 18));
      b.z = lerp(b.z, a.z + fz * 0.44, Math.min(1, dt * 18));
      b.y = 0.22 + Math.abs(Math.sin(a.runPhase * 2)) * 0.025;
      b.vx = a.vx; b.vz = a.vz;
      return;
    }
    if (b.mode === "flight" && b.fl) {
      var f = b.fl;
      f.t += dt;
      var k = clamp(f.t / f.dur, 0, 1);
      b.x = lerp(f.x0, f.x1, k); b.z = lerp(f.z0, f.z1, k);
      b.y = lerp(f.y0, f.y1, k) + f.arc * 4 * k * (1 - k);
      if (k >= 1) {
        b.mode = "loose"; b.fl = null; b.timer = 0;
        b.vx = (f.x1 - f.x0) / f.dur; b.vz = (f.z1 - f.z0) / f.dur;
        var nx = b.next; b.next = null;
        if (nx && nx.type === "held") giveTo(nx.side, nx.idx);
      }
      return;
    }
    if (b.mode === "loose") {
      b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; b.vy -= GRAV * dt;
      if (b.y < 0.22) { b.y = 0.22; if (b.vy < 0) b.vy = -b.vy * 0.32; if (Math.abs(b.vy) < 0.6) b.vy = 0; }
      b.vx *= Math.pow(0.55, dt); b.vz *= Math.pow(0.55, dt);
      if (b.x < -1 || b.x > LEN + 1 || b.z < -1 || b.z > WID + 1) outOfPlay();
    }
  }

  /* ------------------------------------------------------------------ saques */

  function placeAtBase() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      a.x = a.tx = a.baseX; a.z = a.tz = a.baseZ; a.vx = a.vz = 0; a.anim = null;
      a.facing = sim.attack[s] > 0 ? PI / 2 : -PI / 2;
    }
  }

  function setupKickoff(side) {
    sim.action = null; sim.queue = []; sim.ended = false; sim.kickoffSide = side;
    placeAtBase();
    var b = sim.ball;
    b.x = LEN / 2; b.z = MIDZ; b.y = 0.22; b.vx = b.vy = b.vz = 0; b.fl = null; b.next = null; b.mode = "dead";
    var c = nearestActor(side, LEN / 2, MIDZ, true);
    if (c) { c.x = LEN / 2 + (sim.attack[side] > 0 ? -0.9 : 0.9); c.z = MIDZ; c.facing = sim.attack[side] > 0 ? PI / 2 : -PI / 2; }
    sim.own = side;
    sim.restart = {type: "kickoff", side: side, idx: c ? c.slot : -1, t: 0.55};
    if (c) giveTo(side, c.slot);
  }

  function setupGoalKick(side) {
    sim.action = null; placeAtBase();
    var gk = null, list = listOf(side);
    for (var i = 0; i < list.length; i++) if (list[i].gk) { gk = list[i]; break; }
    var b = sim.ball, own = ownX(side);
    b.x = own + sim.attack[side] * 5.5; b.z = MIDZ; b.y = 0.22; b.vx = b.vy = b.vz = 0; b.mode = "dead"; b.fl = null; b.next = null;
    sim.own = side;
    if (gk) { gk.x = b.x - sim.attack[side] * 1.2; gk.z = MIDZ; giveTo(side, gk.slot); }
    sim.restart = {type: "goalkick", side: side, idx: gk ? gk.slot : -1, t: 0.65};
  }

  function setupThrowIn(side, x, z) {
    sim.action = null;
    var b = sim.ball;
    b.x = clamp(x, 2, LEN - 2); b.z = z < MIDZ ? 0.9 : WID - 0.9; b.y = 0.22; b.mode = "dead"; b.fl = null; b.next = null;
    var taker = nearestActor(side, b.x, b.z, true);
    sim.own = side;
    if (taker) { taker.x = b.x; taker.z = b.z + (b.z < MIDZ ? 1 : -1); taker.facing = b.z < MIDZ ? PI : 0; }
    sim.restart = {type: "throw", side: side, idx: taker ? taker.slot : -1, t: 0.55};
  }

  function setupCorner(side, end) {
    sim.action = null;
    var b = sim.ball;
    b.x = end ? LEN - 0.7 : 0.7; b.z = b.z < MIDZ ? 0.7 : WID - 0.7; b.y = 0.22;
    b.vx = b.vy = b.vz = 0; b.mode = "dead"; b.fl = null; b.next = null;
    var taker = nearestActor(side, b.x, b.z, true);
    sim.own = side;
    if (taker) {
      taker.x = b.x; taker.z = b.z + (b.z < MIDZ ? 1.1 : -1.1);
      taker.facing = end ? -PI / 2 : PI / 2;
    }
    sim.restart = {type: "corner", side: side, idx: taker ? taker.slot : -1, t: 0.65};
  }

  function outOfPlay() {
    var b = sim.ball, side = b.lastTouch === 1 ? 1 : 0, def = 1 - side;
    if (b.z < 0 || b.z > WID) { setupThrowIn(def, clamp(b.x, 3, LEN - 3), b.z); return; }
    if (b.x < 0 || b.x > LEN) {
      var end = b.x < 0 ? 0 : 1, defending = 0;
      for (var s = 0; s < 2; s++) if (goalX(s) === (end ? LEN : 0)) defending = s;
      var attacking = 1 - defending;
      if (side === attacking) setupGoalKick(defending);
      else setupCorner(attacking, end);
      return;
    }
    releaseBall(0, 0, 0);
  }

  function updateRestart(dt) {
    if (!sim.restart) return;
    sim.restart.t -= dt;
    if (sim.restart.t > 0) return;
    var r = sim.restart; sim.restart = null;
    var a = actorAt(r.side, r.idx);
    if (!a) return;
    var mate = nearestActor(r.side, a.x, a.z, true, a);
    if (!mate) return;
    launchBall(mate.x, mate.z, 0.23, clamp(dist(a.x, a.z, mate.x, mate.z) / 18, 0.18, 0.5), 0.2, {type: "held", side: r.side, idx: mate.slot});
  }

  /* ------------------------------------------------------------------ acciones */

  function fireCue(e) {
    if (typeof e.cue === "function") { try { setTimeout(e.cue, 0); } catch (ignore) {} }
  }

  function pickShooter(side, who) {
    if (who != null && isFinite(+who)) { var a = actorAt(side, +who); if (a && !a.gk) return a; }
    var list = listOf(side), best = null, bd = 1e9, gx = goalX(side);
    for (var i = 0; i < list.length; i++) {
      var q = list[i]; if (q.gk) continue;
      var d = Math.abs(q.x - gx) + (isFwd(q.pos) ? -6 : 0);
      if (d < bd) { bd = d; best = q; }
    }
    return best || list[0] || null;
  }

  function pickKeeper(side) {
    var list = listOf(side);
    for (var i = 0; i < list.length; i++) if (list[i].gk) return list[i];
    return list[0] || null;
  }

  function shotTarget(a) {
    var gx = a.gx, dir = a.dir, z, y, arc;
    if (a.res === "goal") { z = MIDZ + rnd(-2.3, 2.3); y = rnd(0.4, 1.7); arc = 0.22; }
    else if (a.res === "save") { z = clamp((a.gk ? a.gk.z : MIDZ) + rnd(-1.2, 1.2), MIDZ - POST + 0.4, MIDZ + POST - 0.4); y = rnd(0.6, 1.7); arc = 0.18; }
    else if (a.res === "post") { z = MIDZ + (Math.random() < 0.5 ? -1 : 1) * POST; y = rnd(1.3, 2.3); arc = 0.12; }
    else { z = clamp(MIDZ + (Math.random() < 0.5 ? -1 : 1) * rnd(4.4, 8), 2, WID - 2); y = rnd(1.6, 3.2); arc = 0.35; }
    return {x: gx + dir * 0.55, z: z, y: y, arc: arc};
  }

  function startShot(e) {
    if (sim.action) { sim.queue.push(e); return; }
    sim.restart = null;
    var side = +e.side === 1 ? 1 : 0, res = e.t, kind = e.k || "pass";
    var dir = sim.attack[side], gx = goalX(side);
    var shooter = pickShooter(side, e.who);
    var d = e.d != null && isFinite(+e.d) ? clamp(+e.d, 5, 34) : 14;
    var lane = e.ly != null && isFinite(+e.ly) ? clamp(+e.ly, -13, 13) : (shooter ? clamp(shooter.z - MIDZ, -13, 13) : 0);
    var ox = clamp(gx - dir * d, 3, LEN - 3), oz = clamp(MIDZ + lane, 4, WID - 4);
    var b = sim.ball, travel = dist(b.x, b.z, ox, oz);
    var buildup = travel > 7 ? clamp(travel / 26, 0.18, 0.55) : 0.12;
    if (shooter) {
      shooter.x = ox; shooter.z = oz; shooter.tx = ox; shooter.tz = oz; shooter.vx = shooter.vz = 0;
      shooter.facing = dir > 0 ? PI / 2 : -PI / 2;
    }
    launchBall(ox, oz, 0.24, buildup, travel > 7 ? 0.7 : 0.08, shooter ? {type: "held", side: side, idx: shooter.slot} : null);
    b.lastTouch = side;
    var outcome = res === "goal" ? 1.2 : res === "save" ? 0.8 : res === "post" ? 0.7 : 0.5;
    sim.action = {type: "shot", stage: "build", t: 0, side: side, res: res, kind: kind, shooter: shooter,
      originX: ox, originZ: oz, gx: gx, dir: dir, gk: pickKeeper(1 - side), buildup: buildup,
      flight: 0.5, outcome: outcome, dur: buildup + 0.18 + 0.5 + outcome};
    sim.own = side;
    fireCue(e);
  }

  function resolveShot(a) {
    var b = sim.ball;
    b.fl = null; b.next = null; b.vx = 0; b.vy = 0; b.vz = 0;
    if (a.res === "goal") {
      b.x = a.gx + a.dir * 1.0; b.z = clamp(b.z, MIDZ - POST, MIDZ + POST); b.y = 0.5; b.mode = "dead";
      sim.netT = 1; sim.shake = 0.5;
      if (a.shooter) {
        var cx = clamp(a.gx - a.dir * 8, 4, LEN - 4), cz = b.z < MIDZ ? 5 : WID - 5;
        a.shooter.anim = {type: "celebrate", t: 0, dur: 1.15, tx: cx, tz: cz};
        a.shooter.tx = cx; a.shooter.tz = cz; a.shooter.maxSp = 6.5;
      }
      sim.own = 1 - a.side;
    } else if (a.res === "save") {
      b.mode = "loose"; b.vx = -a.dir * rnd(6, 10); b.vz = rnd(-4, 4); b.vy = 2; b.lastTouch = a.side;
      if (a.gk) a.gk.anim = {type: "dive", t: 0, dur: 0.55, dir: b.z >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z, x1: a.gk.x + a.dir * 0.8, z1: b.z};
      sim.own = 1 - a.side;
    } else if (a.res === "post") {
      b.mode = "loose"; b.vx = -a.dir * rnd(5, 9); b.vz = rnd(-4, 4); b.vy = 2.4; b.lastTouch = a.side;
      if (a.gk) a.gk.anim = {type: "dive", t: 0, dur: 0.5, dir: b.z >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z, x1: a.gk.x + a.dir * 0.7, z1: b.z};
    } else {
      b.mode = "loose"; b.vx = a.dir * 3; b.vz = rnd(-2, 2); b.vy = 2.2; b.lastTouch = a.side;
    }
  }

  function finishAction() {
    var a = sim.action; sim.action = null;
    if (a && a.type === "shot") {
      if (a.res === "goal") { setupKickoff(1 - a.side); sim.pendingOwn = null; }
      else if (a.res === "miss") { setupGoalKick(1 - a.side); sim.pendingOwn = null; }
      else {
        var gk = pickKeeper(1 - a.side);
        if (gk) giveTo(1 - a.side, gk.slot);
      }
    }
    if (a && a.type === "card" && a.res === "red" && a.player) {
      a.player.sentOff = true; a.player.gone = true; a.player.anim = null;
    }
    if (sim.pendingOwn != null) { var p = sim.pendingOwn; sim.pendingOwn = null; sim.own = p; }
    if (sim.queue.length) { var e = sim.queue.shift(); handleEvent(e); }
  }

  function updateAction(dt) {
    var a = sim.action;
    if (!a) return;
    a.t += dt;
    if (a.type !== "shot") { if (a.t >= a.dur) finishAction(); return; }
    if (a.stage === "build" && a.t >= a.buildup) {
      if (a.shooter) { giveTo(a.side, a.shooter.slot); a.shooter.anim = {type: "kick", t: 0, dur: 0.24}; }
      a.stage = "windup"; a.t = 0;
    } else if (a.stage === "windup" && a.t >= 0.18) {
      a.stage = "flight"; a.t = 0;
      var t = shotTarget(a);
      launchBall(t.x, t.z, t.y, a.flight, t.arc, null);
      if (a.gk) {
        var dz = clamp(a.gk.z + (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1.6), MIDZ - POST, MIDZ + POST);
        a.gk.anim = {type: "dive", t: 0, dur: 0.55, dir: dz >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z,
          x1: a.gk.x + a.dir * 0.8, z1: dz};
      }

    } else if (a.stage === "flight" && a.t >= a.flight) {
      a.stage = "outcome"; a.t = 0; resolveShot(a);
    } else if (a.stage === "outcome" && a.t >= a.outcome) {
      finishAction();
    }
  }

  function startCard(e) {
    if (sim.action) { sim.queue.push(e); return; }
    var side = +e.side === 1 ? 1 : 0, a = pickShooter(side, e.who);
    if (a) a.anim = {type: "card", t: 0, dur: 0.9};
    sim.action = {type: "card", t: 0, dur: 0.9, side: side, res: e.t, player: a};
    if (e.t === "red" && a) sim.red[side][a.key] = true;
    fireCue(e);
  }

  function doHalf() {
    if (sim.half === 2) return;
    sim.action = null; sim.queue = []; sim.ended = false; sim.restart = null;
    sim.half = 2; mirrorTeam(0); mirrorTeam(1);
    sim.attack[0] = -sim.attack[0]; sim.attack[1] = -sim.attack[1];
    var b = sim.ball; b.x = LEN - b.x; b.vx = -b.vx; b.fl = null; b.next = null; b.mode = "dead";
    cam.x = LEN - cam.x;
    setupKickoff(1 - sim.kickoffSide);
  }

  function doEnd() {
    sim.action = null; sim.queue = []; sim.restart = null; sim.ended = true;
    var b = sim.ball; b.mode = "dead"; b.fl = null; b.next = null; b.vx = b.vy = b.vz = 0;
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (a) { a.anim = {type: "idle", t: 0, dur: 1e9}; a.vx = a.vz = 0; }
    }
  }

  function handleEvent(e) {
    if (!e) return;
    if (sim.replay) { sim.queue.push(e); return; }
    var t = String(e.t || "").toLowerCase();
    if (sim.ended && t !== "end") { fireCue(e); return; }
    if (t === "half") { doHalf(); fireCue(e); return; }
    if (t === "end") { doEnd(); fireCue(e); return; }
    if (t === "goal" || t === "save" || t === "post" || t === "miss") { e.t = t; startShot(e); return; }
    if (t === "yellow" || t === "red") { e.t = t; startCard(e); return; }
    if (t === "sub" || t === "inj" || t === "tac" || t === "com" || t === "") { fireCue(e); return; }
    fireCue(e);
  }

  /* ------------------------------------------------------------------ historial / replay */

  function record() {
    var frame = {t: sim.time, ball: [sim.ball.x, sim.ball.y, sim.ball.z], p: [[], []]};
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s][i];
      frame.p[s].push(a && !a.gone && !a.sentOff ? [a.x, a.z, a.facing, a.runPhase] : null);
    }
    sim.history.push(frame);
    while (sim.history.length > 60) sim.history.shift();
  }

  function startReplay() {
    if (sim.replay || sim.action || sim.history.length < 6 || frozen) return false;
    var snap = {ball: {x: sim.ball.x, y: sim.ball.y, z: sim.ball.z, vx: sim.ball.vx, vy: sim.ball.vy, vz: sim.ball.vz,
      mode: sim.ball.mode, side: sim.ball.side, idx: sim.ball.idx, lastTouch: sim.ball.lastTouch, fl: sim.ball.fl, next: sim.ball.next}, p: [[], []]};
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s][i];
      snap.p[s].push(a ? {x: a.x, z: a.z, facing: a.facing, vx: a.vx, vz: a.vz, anim: a.anim} : null);
    }
    sim.replay = {frames: sim.history.slice(-40), t: 0, dur: 3.6, save: snap};
    return true;
  }

  function endReplay() {
    var r = sim.replay; if (!r) return;
    var sv = r.save, sb = sv.ball;
    sim.ball.x = sb.x; sim.ball.y = sb.y; sim.ball.z = sb.z; sim.ball.vx = sb.vx; sim.ball.vy = sb.vy; sim.ball.vz = sb.vz;
    sim.ball.mode = sb.mode; sim.ball.side = sb.side; sim.ball.idx = sb.idx; sim.ball.lastTouch = sb.lastTouch;
    sim.ball.fl = sb.fl; sim.ball.next = sb.next;
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s][i], q = sv.p[s][i];
      if (a && q) { a.x = q.x; a.z = q.z; a.facing = q.facing; a.vx = q.vx; a.vz = q.vz; a.anim = q.anim; }
    }
    sim.replay = null;
    if (sim.queue.length) { var e = sim.queue.shift(); handleEvent(e); }
  }

  function updateReplay(dt) {
    var r = sim.replay; if (!r) return;
    r.t += dt;
    var k = clamp(r.t / r.dur, 0, 1), ft = k * (r.frames.length - 1);
    var i = Math.min(r.frames.length - 2, Math.floor(ft)), u = ft - i;
    var A = r.frames[i], B = r.frames[i + 1] || A;
    sim.ball.x = lerp(A.ball[0], B.ball[0], u); sim.ball.y = lerp(A.ball[1], B.ball[1], u); sim.ball.z = lerp(A.ball[2], B.ball[2], u);
    for (var s = 0; s < 2; s++) for (var j = 0; j < 11; j++) {
      var a = sim.players[s][j], pa = A.p[s][j], pb = B.p[s][j];
      if (a && pa && pb) { a.x = lerp(pa[0], pb[0], u); a.z = lerp(pa[1], pb[1], u); a.facing = pa[2]; a.runPhase = pa[3]; }
    }
    if (k >= 1) endReplay();
  }

  /* ------------------------------------------------------------------ cámara */

  function updateCamera(dt) {
    var b = sim.ball, tx = b.x, tz = b.z, back = 34, height = 22;
    var goalDist = Math.min(Math.abs(b.x), Math.abs(LEN - b.x));
    var danger = clamp(1 - goalDist / 35, 0, 1);
    back -= danger * 9; height -= danger * 6;
    if (sim.action && sim.action.type === "shot") { back = 31; height = 19; tx = b.x; tz = b.z; }
    if (sim.action && sim.action.shooter && sim.action.stage === "outcome" && sim.action.res === "goal") {
      tx = sim.action.shooter.x; tz = sim.action.shooter.z; back = 24; height = 14;
    }
    if (sim.replay) { back = 28; height = 17; }
    var aspect = viewW / Math.max(1, viewH);
    if (aspect < 0.9) { back *= 1.28; height *= 1.02; }
    tz = MIDZ + (tz - MIDZ) * 0.45;
    var k = 1 - Math.exp(-dt * (sim.replay ? 3.2 : 2.1));
    cam.x += (tx - cam.x) * k;
    cam.z += (tz - cam.z) * k;
    cam.back += (back - cam.back) * Math.min(1, dt * 2.2);
    cam.height += (height - cam.height) * Math.min(1, dt * 2.2);
    cam.lookX += (tx - cam.lookX) * Math.min(1, dt * 3.0);
    cam.lookZ += (tz - cam.lookZ) * Math.min(1, dt * 3.0);
    if (sim.shake > 0) sim.shake = Math.max(0, sim.shake - dt * 1.6);
  }

  /* ------------------------------------------------------------------ dibujo jugadores */

  function buildPlayer(m, a) {
    var dxc = a.x - cam.x, dzc = a.z - cam.z, far = dxc * dxc + dzc * dzc > 1600;
    var q = quality < 0.7 || far ? 0 : 1, seg = q ? 8 : 6, rings = q ? 5 : 4;
    var shirt = a.gk ? (a.side ? [0.55, 0.26, 0.76] : [0.96, 0.55, 0.12]) : (colors[a.side] || rgb(SHIRT[a.side]));
    var shorts = a.gk ? [0.08, 0.10, 0.12] : (SHORTS[a.side] || SHORTS[0]);
    var skin = a.skin || SKIN, hair = a.hair || HAIR;
    var sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz), run = clamp(sp / 6, 0, 1);
    var gait = Math.sin(a.runPhase) * 0.32 * run, gait2 = Math.sin(a.runPhase + PI) * 0.32 * run;
    var jump = 0, kick = 0, celebrate = 0, card = 0, dive = false;
    if (a.anim) {
      var k = clamp(a.anim.t / a.anim.dur, 0, 1);
      if (a.anim.type === "kick") kick = Math.sin(k * PI);
      else if (a.anim.type === "celebrate") { celebrate = 1; jump = Math.sin(k * PI) * 0.35; }
      else if (a.anim.type === "card") card = Math.sin(k * PI);
      else if (a.anim.type === "dive") dive = true;
    }
    m.circle(a.x, a.z, far ? 0.4 : 0.56, [0.02, 0.08, 0.045], q ? 10 : 7, 0.026);
    if (sim.ball.mode === "held" && sim.ball.side === a.side && sim.ball.idx === a.slot) {
      m.ring(a.x, a.z, 0.58, 0.07, [0.98, 0.82, 0.28], 12, 0.032);
    }
    var start = m.n;
    if (dive) {
      /* El cuerpo cae de lado: el eje local X es el eje lateral del portero. */
      var dirW = a.anim.dir || 1;
      var dirL = -dirW * (Math.sin(a.facing) >= 0 ? 1 : -1);
      m.ellipsoid(0, 0.5, 0, 0.5, 0.2, 0.28, shirt, seg, rings);
      m.ellipsoid(dirL * 0.72, 0.58, 0, 0.17, 0.2, 0.18, skin, seg, rings - 1);
      m.ellipsoid(dirL * 0.84, 0.64, 0, 0.18, 0.08, 0.16, hair, seg, 3);
      m.limb([dirL * 0.08, 0.55, -0.22], [dirL * 0.82, 0.6, -0.42], 0.08, skin);
      m.limb([dirL * 0.08, 0.55, 0.22], [dirL * 0.82, 0.6, 0.42], 0.08, skin);
      m.limb([-dirL * 0.1, 0.42, -0.14], [-dirL * 0.84, 0.16, -0.24], 0.09, shorts);
      m.limb([-dirL * 0.1, 0.42, 0.14], [-dirL * 0.84, 0.16, 0.24], 0.09, shorts);
      m.box(-dirL * 0.9, 0.1, -0.24, 0.28, 0.08, 0.18, BOOT);
      m.box(-dirL * 0.9, 0.1, 0.24, 0.28, 0.08, 0.18, BOOT);
    } else {
      m.ellipsoid(0, 0.94, 0, 0.32, 0.46, 0.23, shirt, seg, rings);
      m.ellipsoid(0, 0.52, 0, 0.26, 0.16, 0.2, shorts, q ? 8 : 6, 4);
      m.ellipsoid(0, 1.5, 0, 0.19, 0.23, 0.18, skin, seg, rings);
      m.ellipsoid(0, 1.64, -0.015, 0.195, 0.09, 0.18, hair, q ? 8 : 6, 3);
      m.limb([-0.14, 0.52, 0], [-0.17, 0.27, gait * 0.35], 0.095, shorts);
      m.limb([-0.17, 0.27, gait * 0.35], [-0.18, 0.07, gait * 0.55], 0.075, skin);
      m.limb([0.14, 0.52, 0], [0.17, 0.27, gait2 * 0.35], 0.095, shorts);
      m.limb([0.17, 0.27, gait2 * 0.35], [0.18, 0.07, gait2 * 0.55], 0.075, skin);
      m.box(-0.18, 0.015, gait * 0.55 + 0.05, 0.2, 0.08, 0.3, BOOT);
      m.box(0.18, 0.015, gait2 * 0.55 + 0.05, 0.2, 0.08, 0.3, BOOT);
      var arm = Math.sin(a.runPhase + PI) * 0.28 * run;
      var handY = celebrate ? 1.6 : card ? 1.35 : 0.78;
      var handZ = celebrate ? 0.05 : card ? 0.0 : -arm;
      m.limb([-0.3, 1.2, 0], [-0.43, celebrate ? 1.45 : 0.98, handZ * 0.5], 0.085, shirt);
      m.limb([-0.43, celebrate ? 1.45 : 0.98, handZ * 0.5], [-0.46, handY, handZ], 0.07, skin);
      m.limb([0.3, 1.2, 0], [0.43, celebrate ? 1.45 : 0.98, arm * 0.5], 0.085, shirt);
      m.limb([0.43, celebrate ? 1.45 : 0.98, arm * 0.5], [0.46, handY, celebrate ? 0.05 : arm], 0.07, skin);
      if (!far) m.box(0, 0.98, 0.24, 0.2, 0.14, 0.035, a.side ? [0.14, 0.24, 0.42] : [0.96, 0.82, 0.24]);
    }
    var ca = Math.cos(a.facing), sa = Math.sin(a.facing);
    for (var vi = start; vi < m.n; vi += 6) {
      var lx = m.a[vi], ly = m.a[vi + 1], lz = m.a[vi + 2];
      m.a[vi] = a.x + lx * ca + lz * sa;
      m.a[vi + 1] = ly * (a.scale || 1) + jump;
      m.a[vi + 2] = a.z - lx * sa + lz * ca;
    }
  }

  function buildBall(m) {
    var b = sim.ball, r = 0.23, y = Math.max(0.2, b.y), x = b.x, z = b.z;
    m.circle(x, z, 0.3, [0.01, 0.05, 0.03], 8, 0.024);
    var top = [x, y + r, z], bot = [x, y - r, z], a = [x + r, y, z], c = [x - r, y, z], d = [x, y, z + r], e = [x, y, z - r];
    var w = [0.95, 0.95, 0.9], k = [0.12, 0.14, 0.15];
    m.tri(top, a, d, w); m.tri(top, d, c, k); m.tri(top, c, e, w); m.tri(top, e, a, k);
    m.tri(bot, d, a, k); m.tri(bot, c, d, w); m.tri(bot, e, c, k); m.tri(bot, a, e, w);
  }

  /* ------------------------------------------------------------------ render */

  function resize() {
    var w = Math.max(1, host && host.clientWidth ? host.clientWidth : 400);
    var h = Math.max(210, Math.round(w * (w < 520 ? 0.62 : 0.56)));
    var maxDpr = quality < 0.7 ? 1 : 1.5;
    dpr = Math.min(maxDpr, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    canvas.style.width = "100%"; canvas.style.height = h + "px";
    var cw = Math.max(1, Math.floor(w * dpr)), ch = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch;
      if (gl) gl.viewport(0, 0, cw, ch);
    }
    viewW = w; viewH = h;
  }

  function perspective(out, fov, aspect, near, far) {
    var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var z = norm3([eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
    var x = norm3(cross3(up, z)), y = cross3(z, x);
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -dot3(x, eye); out[13] = -dot3(y, eye); out[14] = -dot3(z, eye); out[15] = 1;
    return out;
  }
  function matMul(out, a, b) {
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return out;
  }

  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    dyn.reset();
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s] && sim.players[s][i];
      if (!a) continue;
      var card = sim.action && sim.action.type === "card" && sim.action.player === a;
      if ((a.gone || a.sentOff) && !card) continue;
      buildPlayer(dyn, a);
    }
    buildBall(dyn);
    if (dyn.n > dynCapacity) {
      var cap = dynCapacity; while (cap < dyn.n) cap *= 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf); gl.bufferData(gl.ARRAY_BUFFER, cap * 4, gl.DYNAMIC_DRAW);
      dynCapacity = cap;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    if (dyn.n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, dyn.a.subarray(0, dyn.n));
    var shakeX = sim.shake > 0 && !reduced ? Math.sin(sim.time * 45) * sim.shake * 0.35 : 0;
    eyeArr[0] = cam.x + shakeX; eyeArr[1] = cam.height; eyeArr[2] = cam.z + cam.back;
    lookArr[0] = cam.lookX; lookArr[1] = 1.1; lookArr[2] = cam.lookZ;
    var view = lookAt(viewMat, eyeArr, lookArr, UP);
    var proj = perspective(projMat, PI / 4, viewW / Math.max(1, viewH), 0.3, 260);
    var mvp = matMul(mvpMat, proj, view);
    gl.useProgram(program);
    gl.uniformMatrix4fv(locations.mvp, false, mvp);
    if (locations.fog) gl.uniform3fv(locations.fog, fogArr);
    if (locations.eye) gl.uniform3fv(locations.eye, eyeArr);
    if (locations.near) gl.uniform1f(locations.near, 85);
    if (locations.far) gl.uniform1f(locations.far, 210);
    gl.enableVertexAttribArray(locations.pos); gl.enableVertexAttribArray(locations.col);
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.vertexAttribPointer(locations.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locations.col, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.TRIANGLES, 0, staticCount);
    if (dyn.n) {
      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
      gl.vertexAttribPointer(locations.pos, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(locations.col, 3, gl.FLOAT, false, 24, 12);
      gl.drawArrays(gl.TRIANGLES, 0, dyn.n / 6);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  function loop(ts) {
    if (disposed || !gl) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden) { lastTs = ts; return; }
    var dt = lastTs ? Math.min(0.1, Math.max(0, (ts - lastTs) / 1000)) : 0;
    lastTs = ts;
    resize();
    if (!frozen && !sim.replay && !sim.ended) {
      acc += dt;
      var n = 0;
      while (acc >= STEP && n < 4) { simStep(STEP); acc -= STEP; n++; }
      if (n >= 4) acc = 0;
    } else if (sim.replay) {
      simStep(dt);
    } else acc = 0;
    updateCamera(dt);
    draw();
    frameCount++;
    fpsFrames++;
    if (!fpsStart) fpsStart = ts;
    if (ts - fpsStart >= 1000) {
      fps = Math.round(fpsFrames * 1000 / (ts - fpsStart)); fpsFrames = 0; fpsStart = ts;
      adaptQuality();
      if (hud) {
        var count = 0;
        for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) if (actorAt(s, i)) count++;
        hud.textContent = "3D · " + fps + " FPS · " + count + "/22 " + label("jugadores");
        hud.style.color = fps < 25 ? "#ffd0a8" : fps < 45 ? "#fff0b0" : "#b9ffd6";
      }
    }
  }

  function simStep(dt) {
    sim.time += dt * (sim.replay ? 1 : sim.rate);
    if (sim.replay) { updateReplay(dt * 1); return; }
    var sdt = dt * sim.rate;
    updateAction(sdt);
    updateRestart(sdt);
    aiAcc += sdt;
    if (aiAcc >= AI_STEP) { aiTick(); aiAcc = 0; }
    moveActors(sdt);
    updateAnimations(sdt);
    updateBall(sdt);
    if (sim.netT > 0) sim.netT = Math.max(0, sim.netT - sdt * 1.5);
    histAcc += sdt;
    if (histAcc >= 0.1) { histAcc = 0; record(); }
  }

  function adaptQuality() {
    if (fps < 32) { fpsBad++; fpsGood = 0; } else if (fps > 52) { fpsGood++; fpsBad = 0; } else { fpsBad = fpsGood = 0; }
    if (fpsBad >= 3 && quality > 0.55) { quality = Math.max(0.55, quality - 0.15); fpsBad = 0; }
    else if (fpsGood >= 6 && quality < 1) { quality = Math.min(1, quality + 0.08); fpsGood = 0; }
  }

  /* ------------------------------------------------------------------ API */

  function mount(el, o) {
    destroy();
    host = el; opts = o || {};
    var srcCols = opts.cols && opts.cols.length ? opts.cols : SHIRT;
    colors = [kitColor(srcCols[0], rgb(SHIRT[0])), kitColor(srcCols[1], rgb(SHIRT[1]))];
    disposed = false; frozen = false; reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (ignore) {}
    canvas = document.createElement("canvas");
    canvas.className = "lpitch lpitch3d";
    canvas.setAttribute("aria-label", label("Vista 3D del partido"));
    canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.minHeight = "210px";
    host.appendChild(canvas);
    quality = (window.devicePixelRatio || 1) > 2 ? 0.75 : 1;
    try { initGL(); } catch (err) {
      if (window.console) console.warn("Pitch3D: se activa el campo 2D de reserva", err);
      destroy(); return false;
    }
    hud = document.createElement("div");
    hud.className = "lpitch3d-hud";
    hud.style.cssText = "position:absolute;z-index:19;left:6px;bottom:6px;padding:5px 7px;border-radius:5px;background:rgba(5,15,12,.78);color:#b9ffd6;font:600 10px ui-monospace,monospace;pointer-events:none";
    hud.textContent = "3D · midiendo rendimiento…";
    host.appendChild(hud);
    replayBtn = document.createElement("button"); replayBtn.type = "button";
    replayBtn.textContent = "↺"; replayBtn.setAttribute("aria-label", label("Ver la repetición"));
    replayBtn.style.cssText = "position:absolute;z-index:20;right:6px;bottom:6px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.35);background:rgba(8,20,18,.82);color:#fff;font:700 15px system-ui;cursor:pointer";
    replayBtn.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); startReplay(); });
    host.appendChild(replayBtn);
    host.addEventListener("webglcontextlost", onLost, false);
    sim = newSim();
    resize();
    lastTs = 0; acc = 0; aiAcc = 0; histAcc = 0; fps = 0; fpsFrames = 0; fpsStart = 0;
    raf = requestAnimationFrame(loop);
    return true;
  }

  function onLost(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (host) {
      try {
        var e = document.createEvent("Event");
        e.initEvent("pitch3d:contextlost", true, false);
        host.dispatchEvent(e);
      } catch (ignore) {}
    }
  }

  function destroy() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (host) host.removeEventListener("webglcontextlost", onLost, false);
    if (gl) {
      try {
        if (staticBuf) gl.deleteBuffer(staticBuf);
        if (dynBuf) gl.deleteBuffer(dynBuf);
        if (program) gl.deleteProgram(program);
      } catch (ignore) {}
    }
    gl = null; staticBuf = dynBuf = null; program = null; locations = null; staticMesh = null; dyn = null; staticCount = 0;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); canvas = null;
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud); hud = null;
    if (replayBtn && replayBtn.parentNode) replayBtn.parentNode.removeChild(replayBtn); replayBtn = null;
    host = null; sim = newSim(); lastTs = 0; fps = 0;
  }

  function teams(home, away, fixedNums) {
    syncTeam(0, home, fixedNums && fixedNums[0]);
    syncTeam(1, away, fixedNums && fixedNums[1]);
    if (!sim.started && listOf(0).length && listOf(1).length) {
      sim.started = true;
      setupKickoff(sim.own);
    }
  }

  function state(o) {
    if (!o || sim.replay) return;
    if (o.speed != null) sim.rate = clamp(+o.speed || 1, 1, 3);
    if (sim.ended) return;
    if (o.tac) {
      for (var s = 0; s < 2; s++) {
        var t = o.tac[s];
        if (!t) continue;
        sim.tactics[s] = {line: t.line == null ? 1 : clamp(+t.line, 0, 2), width: t.width == null ? 1 : clamp(+t.width, 0, 2),
          pass: t.pass == null ? 1 : clamp(+t.pass, 0, 2), tempo: t.tempo == null ? 1 : clamp(+t.tempo, 0, 2),
          ment: t.ment == null ? 1 : t.ment, press: t.ment === "press" || +t.line === 2,
          blk: t.ment === "bus" ? -1 : t.ment === "press" ? 1 : clamp((+t.line || 1) - 1, -1, 1)};
      }
    }
    if (o.own != null) {
      var own = o.own === 1 ? 1 : 0;
      if (sim.action) sim.pendingOwn = own;
      else if (own !== sim.own) changePossession(own);
    }
    if (o.bx != null) sim.bx = clamp(+o.bx, 0, 100);
    if (!sim.action && !sim.restart && sim.ball.mode === "held") {
      var targetX = sim.attack[0] > 0 ? sim.bx / 100 * LEN : (1 - sim.bx / 100) * LEN;
      var carrier = actorAt(sim.ball.side, sim.ball.idx);
      if (carrier) {
        var d = dist(carrier.x, carrier.z, targetX, MIDZ);
        if (d > 26) {
          var recv = nearestActor(sim.ball.side, targetX, MIDZ, true, carrier);
          if (recv) launchBall(recv.x, recv.z, 0.23, clamp(d / 20, 0.35, 0.85), 0.4, {type: "held", side: sim.ball.side, idx: recv.slot});
        } else carrier.tx = clamp(targetX, 3, LEN - 3);
      }
    }
  }

  function changePossession(side) {
    var b = sim.ball;
    sim.restart = null;
    var a = nearestActor(side, b.x, b.z, false);
    if (!a) { sim.own = side; return; }
    if (b.mode === "held") {
      launchBall(a.x, a.z, 0.23, clamp(dist(b.x, b.z, a.x, a.z) / 18, 0.2, 0.5), 0.15, {type: "held", side: side, idx: a.slot});
    } else {
      giveTo(side, a.slot);
    }
    sim.own = side;
  }

  function event(e) { handleEvent(e); }

  function actionLeft(a) {
    if (!a) return 0;
    if (a.type !== "shot") return Math.max(0, a.dur - a.t);
    if (a.stage === "build") return Math.max(0, a.buildup - a.t) + 0.18 + 0.5 + a.outcome;
    if (a.stage === "windup") return Math.max(0, 0.18 - a.t) + 0.5 + a.outcome;
    if (a.stage === "flight") return Math.max(0, 0.5 - a.t) + a.outcome;
    return Math.max(0, a.outcome - a.t);
  }

  function busy() {
    var a = sim.action, ms = 0;
    if (a) ms += actionLeft(a) / sim.rate * 1000;
    for (var i = 0; i < sim.queue.length; i++) ms += 1600 / sim.rate;
    if (sim.restart) ms += Math.max(0, sim.restart.t) / sim.rate * 1000;
    if (sim.replay) ms += Math.max(0, sim.replay.dur - sim.replay.t) * 1000;
    return ms;
  }

  function reset() {
    var old = sim;
    sim = newSim();
    sim.players = old.players;
    sim.tactics = old.tactics;
    sim.started = !!old.started;
    sim.attack = [1, -1];
    sim.own = 0;
    for (var s = 0; s < 2; s++) {
      for (var i = 0; i < 11; i++) {
        var a = sim.players[s] && sim.players[s][i];
        if (!a) continue;
        a.sentOff = false; a.gone = false; a.baseX = worldBaseX(s, a.nx); a.baseZ = a.nz * WID;
      }
    }
    sim.kickoffSide = 0;
    setupKickoff(0);
    cam.x = LEN / 2; cam.z = MIDZ; cam.lookX = LEN / 2; cam.lookZ = MIDZ;
  }

  function freeze(v) {
    frozen = !!v;
    if (!frozen) { lastTs = 0; acc = 0; }
  }

  function replay() { return startReplay(); }

  function debug() {
    var err = 0;
    try { if (gl) err = gl.getError(); } catch (ignore) {}
    return {sim: sim, ball: sim.ball, action: sim.action, quality: quality, fps: fps, frames: frameCount,
      gl: !!gl, glError: err, players: sim.players, history: sim.history.length, camera: cam};
  }

  return {mount: mount, destroy: destroy, teams: teams, state: state, event: event, busy: busy,
    reset: reset, freeze: freeze, replay: replay, debug: debug,
    active: function () { return !!gl && !disposed; },
    sound: function () { return false; }};
})();

/* Adaptador: conserva la API de Pitch y permite alternar 2D/3D sin romper el directo. */
(function () {
  if (typeof window === "undefined" || typeof Pitch === "undefined" || typeof Pitch3D === "undefined") return;
  var original = Pitch, originalApi = {}, host = null, mountOpts = null, toggle = null;
  var mounted = false, switching = false, lastTeams = null, lastState = null, lastFrozen = false;
  ["mount", "teams", "state", "event", "busy", "reset", "freeze", "destroy", "clearMsg", "replay", "active", "sound", "debug"].forEach(function (k) {
    originalApi[k] = original[k];
  });
  function tr3(k) { return typeof tr === "function" ? tr(k) : k; }
  function preferred() {
    try {
      if (/(?:^|[?&])pitch3d=1(?:&|$)/.test(window.location.search)) return true;
      return window.localStorage.getItem("camino.pitch3d") === "1";
    } catch (e) { return false; }
  }
  function updateToggle() {
    if (!toggle) return;
    toggle.textContent = mounted ? tr3("3D · volver a 2D") : tr3("Probar vista 3D");
    toggle.setAttribute("aria-pressed", mounted ? "true" : "false");
  }
  function onLost() { if (mounted) setMode(false); }
  function setMode(want3d) {
    if (!host || switching) return;
    switching = true;
    try {
      if (mounted) Pitch3D.destroy(); else if (originalApi.destroy) originalApi.destroy();
      mounted = false;
      if (want3d) {
        mounted = Pitch3D.mount(host, mountOpts || {});
        if (!mounted && originalApi.mount) originalApi.mount(host, mountOpts || {});
      } else if (originalApi.mount) originalApi.mount(host, mountOpts || {});
      var active = mounted ? Pitch3D : originalApi;
      if (lastTeams) active.teams.apply(active, lastTeams);
      if (lastState) active.state(lastState);
      if (active.freeze) active.freeze(lastFrozen);
      try { window.localStorage.setItem("camino.pitch3d", mounted ? "1" : "0"); } catch (e) {}
      updateToggle();
    } catch (e) {
      if (window.console) console.warn("Pitch3D: cambio de vista fallido", e);
      try { Pitch3D.destroy(); if (originalApi.mount) originalApi.mount(host, mountOpts || {}); } catch (ignore) {}
      mounted = false;
    }
    switching = false;
  }
  Pitch.mount = function (el, o) {
    host = el; mountOpts = o || {};
    if (!toggle) {
      toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "p3dtoggle";
      toggle.style.cssText = "position:absolute;z-index:20;top:6px;right:6px;padding:6px 9px;border:1px solid rgba(255,255,255,.4);border-radius:6px;background:rgba(8,20,18,.88);color:#fff;font:600 11px system-ui;cursor:pointer";
      toggle.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); setMode(!mounted); });
    }
    if (toggle.parentNode !== host) host.appendChild(toggle);
    host.removeEventListener("pitch3d:contextlost", onLost);
    host.addEventListener("pitch3d:contextlost", onLost);
    setMode(preferred());
  };
  Pitch.teams = function () { lastTeams = Array.prototype.slice.call(arguments); var e = mounted ? Pitch3D : originalApi; return e.teams.apply(e, arguments); };
  Pitch.state = function (s) {
    if (s) { lastState = lastState || {}; for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) lastState[k] = s[k]; }
    var e = mounted ? Pitch3D : originalApi; return e.state.apply(e, arguments);
  };
  Pitch.event = function () { var e = mounted ? Pitch3D : originalApi; return e.event.apply(e, arguments); };
  Pitch.busy = function () { var e = mounted ? Pitch3D : originalApi; return e.busy.apply(e, arguments); };
  Pitch.reset = function () { var e = mounted ? Pitch3D : originalApi; return e.reset.apply(e, arguments); };
  Pitch.freeze = function (v) { lastFrozen = !!v; var e = mounted ? Pitch3D : originalApi; return e.freeze.apply(e, arguments); };
  Pitch.clearMsg = function () { var e = mounted ? Pitch3D : originalApi; return e.clearMsg ? e.clearMsg.apply(e, arguments) : undefined; };
  Pitch.replay = function () { var e = mounted ? Pitch3D : originalApi; return e.replay ? e.replay.apply(e, arguments) : false; };
  Pitch.active = function () { var e = mounted ? Pitch3D : originalApi; return e.active ? e.active.apply(e, arguments) : false; };
  Pitch.sound = function () { var e = mounted ? Pitch3D : originalApi; return e.sound ? e.sound.apply(e, arguments) : false; };
  Pitch.debug = function () { var e = mounted ? Pitch3D : originalApi; return e.debug ? e.debug.apply(e, arguments) : null; };
  Pitch.destroy = function () {
    if (host) host.removeEventListener("pitch3d:contextlost", onLost);
    if (mounted) Pitch3D.destroy(); else if (originalApi.destroy) originalApi.destroy();
    if (toggle && toggle.parentNode) toggle.parentNode.removeChild(toggle);
    mounted = false; host = null; mountOpts = null; toggle = null; lastTeams = null; lastState = null; lastFrozen = false;
  };
})();
