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
  var PEN_DEPTH = 16.5, PEN_HALF = 20.16, GK_SAFE_DIST = 13.5;
  var PI = Math.PI, TAU = PI * 2, STEP = 1 / 60, AI_STEP = 1 / 30;
  /* Secuencias de vestuario: tiempos en segundos de partido, comprimidos por
   * la velocidad del directo. El túnel está en la grada larga (z negativa). */
  var TUNNEL_X = LEN / 2, TUNNEL_Z = -5.1;
  /* La entrada real se hace en fila: el capitán abre la comitiva y el resto
   * espera detrás dentro del túnel. La fila avanza hasta el borde del área
   * central y solo se abre a las posiciones después del sorteo. */
  var INTRO_WALK = 4.2, INTRO_GREET = 2.6, INTRO_LINEUP = 1.5;
  var COIN_FLIP = 1.15, COIN_RESULT = 1.25, COIN_WAIT = 10, CHOICE_WAIT = 20, RIVAL_WAIT = 1.25;
  var HALF_OFF = 2.7, HALF_SWITCH = 0.85, HALF_ENTER = 2.7, HALF_GREET = 1.35;
  var END_WHISTLE = 1.15, END_LINE = 3.4, END_GREET = 1.2, END_WALKOFF = 2.8;
  /* Secuencia de saque de puerta. Los tiempos están en segundos de partido y
   * se comprimen con la velocidad del directo. El impacto no lanza el balón
   * hasta que la fase "impact" cruza su marca; nunca se usa un temporizador
   * independiente de la pose. */
  var GK_PHASES = [
    {name: "prepare", dur: 1.35},
    {name: "scan", dur: 0.80},
    {name: "windup", dur: 0.90},
    {name: "plant", dur: 0.16},
    {name: "impact", dur: 0.10},
    {name: "follow", dur: 0.75},
    {name: "recover", dur: 0.70}
  ];
  /* El balón GLB mide 0,11 m de radio; el partido lo dibuja algo mayor para
   * que siga siendo legible en pantallas pequeñas y a la distancia de cámara. */
  var BALL_R = 0.11, BALL_SCALE = 2;
  /* Dirección artística: estadio y jugadores vóxel con luz por píxel, sombras
   * proyectadas, cielo, niebla de altura, focos y tonemapping fílmico. */
  var VOXEL = true;
  var LIGHT = norm3([0.42, 0.86, 0.28]);
  var SHADOW_DIR = (function () { var l = Math.sqrt(LIGHT[0] * LIGHT[0] + LIGHT[2] * LIGHT[2]) || 1; return [-LIGHT[0] / l, -LIGHT[2] / l]; })();
  var BASE = {POR: [0.045, 0.5], LD: [0.24, 0.84], LI: [0.24, 0.16], DFC: [0.2, 0.5], MCD: [0.36, 0.5], MC: [0.46, 0.5], MCO: [0.58, 0.5],
    MD: [0.52, 0.86], MI: [0.52, 0.14], ED: [0.7, 0.84], EI: [0.7, 0.16], DC: [0.76, 0.5]};
  var SPREAD = {DFC: [0.36, 0.64, 0.5], MCD: [0.42, 0.58, 0.5], MC: [0.33, 0.67, 0.5], DC: [0.4, 0.6, 0.5], MCO: [0.38, 0.62, 0.5]};
  var DEF = /^(POR|DFC|LD|LI|MCD)$/, MID = /^(MC|MCD|MCO|MD|MI)$/, FWD = /^(DC|ED|EI|MCO)$/;
  var SHIRT = ["#f5b326", "#5db8ff"], SHORTS = [[0.06, 0.10, 0.18], [0.88, 0.90, 0.84]], SKIN = [0.72, 0.52, 0.37], HAIR = [0.12, 0.075, 0.045];
  var SKINS = [[0.88, 0.69, 0.54], [0.72, 0.52, 0.37], [0.55, 0.37, 0.24], [0.38, 0.25, 0.16], [0.94, 0.79, 0.66]];
  var HAIRS = [[0.08, 0.05, 0.03], [0.25, 0.14, 0.07], [0.55, 0.35, 0.12], [0.82, 0.68, 0.34], [0.14, 0.12, 0.10]];
  var BOOT = [0.07, 0.08, 0.09], NET = [0.78, 0.86, 0.80], WHITE = [0.9, 0.94, 0.88];

  var gl = null, canvas = null, host = null, hud = null, scoreHud = null, replayBtn = null, coinEl = null, disposed = true, frozen = false;
  var freezeWanted = false;
  var raf = 0, lastTs = 0, acc = 0, aiAcc = 0, histAcc = 0, frameCount = 0, fps = 0, fpsFrames = 0, fpsStart = 0;
  var quality = 1, staticMesh = null, staticCount = 0, dyn = null, dynCapacity = 0;
  var crowdMeshes = null, crowdBufs = [null, null], crowdCounts = [0, 0];
  var program = null, locations = null, progFull = null, locFull = null, progLite = null, locLite = null, staticBuf = null, dynBuf = null;
  var assetModels = null, assetState = "none", assetFrameTris = 0, assetFramePlayers = 0, assetFrameBall = 0;
  var viewW = 1, viewH = 1, dpr = 1;
  var opts = {}, colors = SHIRT.slice(), reduced = false;
  var cam = {x: LEN / 2, z: MIDZ, back: 34, height: 22, lookX: LEN / 2, lookZ: MIDZ, shake: 0, cutT: 0, cutMode: ""};
  var fpsBad = 0, fpsGood = 0;
  var projMat = new Float32Array(16), viewMat = new Float32Array(16), mvpMat = new Float32Array(16);
  var eyeArr = new Float32Array(3), lookArr = new Float32Array(3);
  var fogArr = new Float32Array([0.018, 0.035, 0.055]), UP = [0, 1, 0];

  /* ------------------------------------------------------------------ estado */

  function newBall() {
    return {x: LEN / 2, z: MIDZ, y: 0.22, vx: 0, vy: 0, vz: 0, mode: "dead", side: 0, idx: -1,
      spinX: 0, spinZ: 0, kind: "", timer: 0, fl: null, next: null, lastTouch: 0, claim: null};
  }

  function newSim() {
    return {
      time: 0, rate: 1, own: 0, bx: 50, half: 1, kickoffSide: 0, koSet: false, ended: false, started: false, fem: false,
      attack: [1, -1], players: [[], []], red: [{}, {}], tactics: [defTac(), defTac()],
      ball: newBall(), action: null, queue: [], restart: null, pendingOwn: null,
      history: [], replay: null, netT: 0, shake: 0, banner: "", lastGoalKick: null,
      pendingPass: null, officials: [], wx: "sun", score: [0, 0], scoreTarget: [0, 0], scorePending: 0,
      scoreForceAt: 0, min: 0, scoreOn: false, toss: null,
      lastPass: null, lastCard: null, lastSetPiece: null, cinema: null, ballHidden: false
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
  function labelv(k, p) {
    if (typeof tr === "function") return tr(k, p);
    var s = k;
    if (p) for (var q in p) if (Object.prototype.hasOwnProperty.call(p, q)) s = s.split("{" + q + "}").join(String(p[q]));
    return s;
  }
  /* El 3D comparte el motor de audio del campo 2D. Así el ambiente no se
     apaga al destruir el canvas 2D para montar la vista 3D. */
  function pitchAudio() {
    return typeof window !== "undefined" && window.PitchAudio ? window.PitchAudio : null;
  }
  function sfx(name, arg) {
    var a = pitchAudio();
    if (!a || typeof a[name] !== "function") return;
    try { a[name](arg); } catch (ignore) {}
  }
  function updateCrowdAudio() {
    var b = sim.ball; if (!b) return;
    var goalDist = Math.min(Math.abs(b.x), Math.abs(LEN - b.x));
    var danger = clamp(1 - goalDist / 38, 0, 1);
    if (sim.cinema) danger = sim.cinema.stage === "coinCall" ? 0.2 : 0.12;
    if (sim.action && sim.action.type === "shot") danger = Math.max(danger, 0.72);
    sfx("exc", danger * 0.65);
  }
  function actorAt(side, idx) { var a = sim.players[side] && sim.players[side][idx]; return a && !a.gone && !a.sentOff ? a : null; }
  function listOf(side) { return (sim.players[side] || []).filter(function (a) { return a && !a.gone && !a.sentOff; }); }
  function isDef(p) { return DEF.test(p); }
  function isMid(p) { return MID.test(p); }
  function isFwd(p) { return FWD.test(p); }
  function goalX(side) { return sim.attack[side] > 0 ? LEN : 0; }
  function ownX(side) { return sim.attack[side] > 0 ? 0 : LEN; }

  /* ------------------------------------------------------------------ malla */
  /* Vértice de 10 floats: posición (3), albedo (3), normal (3) y material (1).
   * El material empaqueta el código (parte entera) y la oclusión ambiental
   * (parte decimal): la luz se calcula en la GPU, por píxel. Códigos:
   *   0 mate · 1 brillante · 2 metal · 3 césped · 4 emisivo · 5 afición (salta)
   *   6 cielo · 7 sin luz (partículas) · 8 LED animado */
  var FS = 10;
  var MAT_MATTE = 0, MAT_GLOSS = 1, MAT_METAL = 2, MAT_GRASS = 3, MAT_EMIT = 4, MAT_CROWD = 5,
    MAT_SKY = 6, MAT_UNLIT = 7, MAT_LED = 8;

  function Mesh(cap) {
    this.a = new Float32Array(cap || 16384);
    this.n = 0;
    /* La malla dinámica deja brillar los materiales claros (balón, botas). */
    this.spec = false;
    this.metallic = 0;
    this.roughness = 1;
    /* Código de material forzado (-1: se deduce de metalicidad y rugosidad). */
    this.code = -1;
  }
  Mesh.prototype.reset = function () { this.n = 0; };
  Mesh.prototype.reserve = function (verts) {
    var need = this.n + verts * FS;
    if (need <= this.a.length) return;
    var cap = this.a.length;
    while (cap < need) cap *= 2;
    var b = new Float32Array(cap); b.set(this.a); this.a = b;
  };
  Mesh.prototype.tri = function (A, B, C, c) {
    this.tri9(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], c[0], c[1], c[2]);
  };
  Mesh.prototype.matCode = function (r, g, b) {
    if (this.code >= 0) return this.code;
    if (this.metallic > 0.5) return MAT_METAL;
    if (this.roughness < 0.6) return MAT_GLOSS;
    if (this.spec) {
      var mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (mx > 0.78 && mx - mn < 0.12) return MAT_GLOSS;
    }
    return MAT_MATTE;
  };
  /* Sin allocations (skinning, vóxeles): normal plana del triángulo y
   * oclusión por vértice. La luz la pone el shader. */
  Mesh.prototype.tri9 = function (ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b) {
    this.triAO(ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b, 1, 1, 1);
  };
  Mesh.prototype.triAO = function (ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b, o0, o1, o2) {
    this.reserve(3);
    var ux = bx - ax, uy = by - ay, uz = bz - az;
    var vx = cx - ax, vy = cy - ay, vz = cz - az;
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    var il = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
    nx *= il; ny *= il; nz *= il;
    r = clamp(r, 0, 1); g = clamp(g, 0, 1); b = clamp(b, 0, 1);
    var code = this.matCode(r, g, b);
    var a = this.a, n = this.n;
    a[n] = ax; a[n + 1] = ay; a[n + 2] = az; a[n + 3] = r; a[n + 4] = g; a[n + 5] = b;
    a[n + 6] = nx; a[n + 7] = ny; a[n + 8] = nz; a[n + 9] = code + clamp(o0, 0, 1) * 0.98;
    a[n + 10] = bx; a[n + 11] = by; a[n + 12] = bz; a[n + 13] = r; a[n + 14] = g; a[n + 15] = b;
    a[n + 16] = nx; a[n + 17] = ny; a[n + 18] = nz; a[n + 19] = code + clamp(o1, 0, 1) * 0.98;
    a[n + 20] = cx; a[n + 21] = cy; a[n + 22] = cz; a[n + 23] = r; a[n + 24] = g; a[n + 25] = b;
    a[n + 26] = nx; a[n + 27] = ny; a[n + 28] = nz; a[n + 29] = code + clamp(o2, 0, 1) * 0.98;
    this.n = n + 30;
  };
  /* Recalcula las normales planas de los triángulos escritos desde `start`
   * (tras deformar o girar una malla ya escrita). */
  Mesh.prototype.renormal = function (start) {
    var a = this.a;
    for (var i = start; i + 3 * FS <= this.n; i += 3 * FS) {
      var ux = a[i + FS] - a[i], uy = a[i + FS + 1] - a[i + 1], uz = a[i + FS + 2] - a[i + 2];
      var vx = a[i + 2 * FS] - a[i], vy = a[i + 2 * FS + 1] - a[i + 1], vz = a[i + 2 * FS + 2] - a[i + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var il = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
      for (var k = 0; k < 3; k++) { var o = i + k * FS; a[o + 6] = nx * il; a[o + 7] = ny * il; a[o + 8] = nz * il; }
    }
  };
  Mesh.prototype.quad = function (A, B, C, D, c) { this.tri(A, B, C, c); this.tri(A, C, D, c); };
  /* Cara con oclusión por esquina (A,B abajo; C,D arriba en las cajas). */
  Mesh.prototype.quadAO = function (A, B, C, D, c, oa, ob, oc, od) {
    this.triAO(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], c[0], c[1], c[2], oa, ob, oc);
    this.triAO(A[0], A[1], A[2], C[0], C[1], C[2], D[0], D[1], D[2], c[0], c[1], c[2], oa, oc, od);
  };
  /* Caja alineada a los ejes. `ao` oscurece la base de las caras laterales
   * (oclusión de contacto típica del vóxel); `faces` omite caras que nunca se
   * ven (bit 1 abajo, 2 atrás -z, 4 delante +z, 8 izq -x, 16 der +x). */
  Mesh.prototype.box = function (x, y, z, w, h, d, c, ao, skip) {
    var x0 = x - w / 2, x1 = x + w / 2, y0 = y, y1 = y + h, z0 = z - d / 2, z1 = z + d / 2;
    var lo = ao == null ? 1 : ao, sk = skip || 0;
    if (!(sk & 2)) this.quadAO([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], c, lo, lo, 1, 1);
    if (!(sk & 4)) this.quadAO([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, lo, lo, 1, 1);
    if (!(sk & 8)) this.quadAO([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c, lo, lo, 1, 1);
    if (!(sk & 16)) this.quadAO([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], c, lo, lo, 1, 1);
    this.quadAO([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], c, 1, 1, 1, 1);
    if (!(sk & 1)) this.quadAO([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, lo, lo, lo, lo);
  };
  /* Caja orientada por una matriz 4x4 (columna mayor) desde un cubo en
   * espacio local [x0..x1]x[y0..y1]x[z0..z1]; escribe las esquinas ya
   * transformadas en `out` (24 floats). Base de los jugadores vóxel. */
  function boxCorners(M, o, x0, y0, z0, x1, y1, z1, out) {
    var xs = [x0, x1], ys = [y0, y1], zs = [z0, z1], k = 0;
    for (var iz = 0; iz < 2; iz++) for (var iy = 0; iy < 2; iy++) for (var ix = 0; ix < 2; ix++) {
      var px = xs[ix], py = ys[iy], pz = zs[iz];
      out[k++] = M[o] * px + M[o + 4] * py + M[o + 8] * pz + M[o + 12];
      out[k++] = M[o + 1] * px + M[o + 5] * py + M[o + 9] * pz + M[o + 13];
      out[k++] = M[o + 2] * px + M[o + 6] * py + M[o + 10] * pz + M[o + 14];
    }
    return out;
  }
  /* Dibuja la caja de 8 esquinas (orden de boxCorners) con oclusión en la base. */
  Mesh.prototype.cornerBox = function (q, c, lo) {
    var self = this;
    function V(i) { return [q[i * 3], q[i * 3 + 1], q[i * 3 + 2]]; }
    /* índices: x + 2y + 4z */
    var c000 = V(0), c100 = V(1), c010 = V(2), c110 = V(3), c001 = V(4), c101 = V(5), c011 = V(6), c111 = V(7);
    lo = lo == null ? 0.82 : lo;
    self.quadAO(c100, c000, c010, c110, c, lo, lo, 1, 1);   /* -z */
    self.quadAO(c001, c101, c111, c011, c, lo, lo, 1, 1);   /* +z */
    self.quadAO(c000, c001, c011, c010, c, lo, lo, 1, 1);   /* -x */
    self.quadAO(c101, c100, c110, c111, c, lo, lo, 1, 1);   /* +x */
    self.quadAO(c011, c111, c110, c010, c, 1, 1, 1, 1);     /* +y */
    self.quadAO(c000, c100, c101, c001, c, lo, lo, lo, lo); /* -y */
  };
  Mesh.prototype.ellipsoid = function (cx, cy, cz, rx, ry, rz, c, seg, rings) {
    /* Estilo vóxel: los volúmenes redondeados se convierten en bloques. */
    if (VOXEL) { this.box(cx, cy - ry * 0.86, cz, rx * 1.72, ry * 1.72, rz * 1.72, c, 0.84); return; }
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
  Mesh.prototype.ellipse = function (cx, cz, rx, rz, rot, c, seg, y) {
    seg = seg || 12; y = y == null ? 0.045 : y;
    var ca = Math.cos(rot), sa = Math.sin(rot);
    for (var i = 0; i < seg; i++) {
      var a = i * TAU / seg, b = (i + 1) * TAU / seg;
      var ax = Math.cos(a) * rx, az = Math.sin(a) * rz;
      var bx = Math.cos(b) * rx, bz = Math.sin(b) * rz;
      this.tri([cx, y, cz],
        [cx + ax * ca - az * sa, y, cz + ax * sa + az * ca],
        [cx + bx * ca - bz * sa, y, cz + bx * sa + bz * ca], c);
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

  function appendStaticAsset(m, id, cx, cz, yaw) {
    var model = assetModels && assetModels.static && assetModels.static[id];
    if (!model || !model.positions || !model.positions.length) return false;
    var pos = model.positions, col = model.colors, mats = model.materials;
    var ca = Math.cos(yaw), sa = Math.sin(yaw);
    for (var i = 0; i < pos.length; i += 9) {
      var ax = pos[i], ay = pos[i + 1], az = pos[i + 2];
      var bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5];
      var gx = pos[i + 6], gy = pos[i + 7], gz = pos[i + 8];
      var wax = cx + ax * ca + az * sa, waz = cz - ax * sa + az * ca;
      var wbx = cx + bx * ca + bz * sa, wbz = cz - bx * sa + bz * ca;
      var wgx = cx + gx * ca + gz * sa, wgz = cz - gx * sa + gz * ca;
      var mi = mats && mats.length ? mats[i / 3] : 0;
      m.metallic = (model.matMetallic && model.matMetallic[mi] != null) ? model.matMetallic[mi] : 0;
      m.roughness = (model.matRoughness && model.matRoughness[mi] != null) ? model.matRoughness[mi] : 0.8;
      var cr = (col[i] + col[i + 3] + col[i + 6]) / 3;
      var cg = (col[i + 1] + col[i + 4] + col[i + 7]) / 3;
      var cb = (col[i + 2] + col[i + 5] + col[i + 8]) / 3;
      m.tri9(wax, ay, waz, wbx, by, wbz, wgx, gy, wgz, cr, cg, cb);
    }
    return true;
  }

  var CROWD_COLS = [[0.86, 0.25, 0.19], [0.18, 0.34, 0.72], [0.92, 0.84, 0.20], [0.92, 0.92, 0.90],
    [0.12, 0.55, 0.30], [0.45, 0.18, 0.60], [0.10, 0.12, 0.15], [0.72, 0.36, 0.14]];

  function crowdColor(i, home) {
    var r = (i * 1103515245 + 12345) >>> 0;
    /* La grada local va de su color; el resto mezcla camisetas. */
    if (home === 0 && r % 5 < 3) return colors[0] || CROWD_COLS[0];
    if (home === 1 && r % 5 < 3) return colors[1] || CROWD_COLS[1];
    if (r % 13 === 0) return colors[0] || CROWD_COLS[0];
    if (r % 17 === 0) return colors[1] || CROWD_COLS[1];
    return CROWD_COLS[(r >>> 4) % CROWD_COLS.length];
  }

  /* ------------------------------------------------------------------ estadio vóxel */
  var GRASS = [0.21, 0.37, 0.15];
  var CONCRETE = [0.50, 0.50, 0.49], CONCRETE_D = [0.36, 0.36, 0.36], STEEL = [0.62, 0.64, 0.67], DARK = [0.10, 0.11, 0.12];
  /* Un aficionado: cuerpo y cabeza en bloques; solo las caras que mira el
   * campo (delante y arriba). `dir` es el eje hacia el campo: 0 +z, 1 -z, 2 +x, 3 -x. */
  function fan(m, x, y, z, dir, shirt, skin, hair, seed) {
    var bw = 0.42, bh = 0.50, bd = 0.30, hs = 0.28;
    var skipBody = 1 | 8 | 16 | 2, skipHead = 1 | 2;
    var along = dir < 2;
    var w = along ? bw : bd, d = along ? bd : bw;
    var faceSkip = dir === 0 ? (1 | 2 | 8 | 16) : dir === 1 ? (1 | 4 | 8 | 16) : dir === 2 ? (1 | 2 | 4 | 8) : (1 | 2 | 4 | 16);
    m.box(x, y, z, w, bh, d, shirt, 0.7, faceSkip);
    m.box(x, y + bh, z, along ? hs : hs, hs, along ? hs : hs, skin, 1, faceSkip);
    if (seed % 3) m.box(x, y + bh + hs - 0.06, z + (dir === 0 ? -0.02 : dir === 1 ? 0.02 : 0), hs + 0.02, 0.08, hs + 0.02, hair, 1, faceSkip | (seed % 2 ? 0 : 0));
    /* brazos en alto en algunos: bufanda o aplauso */
    if (seed % 7 === 0) {
      m.box(x - (along ? 0.26 : 0), y + bh - 0.05, z - (along ? 0 : 0.26), 0.1, 0.42, 0.1, shirt, 1, faceSkip);
      m.box(x + (along ? 0.26 : 0), y + bh - 0.05, z + (along ? 0 : 0.26), 0.1, 0.42, 0.1, shirt, 1, faceSkip);
    }
  }
  /* Una grada escalonada: filas de hormigón, asientos corridos y afición.
   * x0..x1 a lo largo; d0 es la primera fila (más cerca del campo) y `out`
   * el sentido hacia fuera del estadio. */
  function standRows(m, o) {
    var rows = o.rows, step = o.step || 0.82, rise = o.rise || 0.46;
    for (var r = 0; r < rows; r++) {
      var dd = o.d0 + o.out * (r * step + step / 2), yy = o.y0 + r * rise;
      var cut = function (x) { return o.gap && r < o.gapRows && x > o.gap[0] && x < o.gap[1]; };
      var segs = o.gap && r < o.gapRows ? [[o.a0, o.gap[0]], [o.gap[1], o.a1]] : [[o.a0, o.a1]];
      for (var si = 0; si < segs.length; si++) {
        var a0 = segs[si][0], a1 = segs[si][1], mid = (a0 + a1) / 2, len = a1 - a0;
        m.code = MAT_MATTE;
        var conc = r % 2 ? CONCRETE : shade(CONCRETE, 0.94);
        if (o.axis === "x") {
          m.box(mid, 0, dd, len, yy + rise * 0.15, step, conc, 0.75, 1);
          m.box(mid, yy + rise * 0.15, dd + o.out * step * 0.18, len, 0.24, step * 0.36, o.seat(r), 0.8, 1);
        } else {
          m.box(dd, 0, mid, step, yy + rise * 0.15, len, conc, 0.75, 1);
          m.box(dd + o.out * step * 0.18, yy + rise * 0.15, mid, step * 0.36, 0.24, len, o.seat(r), 0.8, 1);
        }
        if (o.noFans || opts.noCrowd) continue;
        var cm = crowdMeshes || [m, m];
        cm[0].code = cm[1].code = MAT_CROWD;
        for (var t = a0 + 0.35; t < a1 - 0.2; t += 0.58) {
          if (cut(t)) continue;
          var seed = ((Math.round(t * 17) * 2654435761) ^ (r * 40503 + o.salt * 9176)) >>> 0;
          if (seed % 100 >= o.fill) continue;
          var sh = crowdColor(seed, o.home), sk = SKINS[(seed >>> 5) % SKINS.length], hr = HAIRS[(seed >>> 9) % HAIRS.length];
          var jit = ((seed >>> 13) % 5 - 2) * 0.03;
          var fm = cm[(seed >>> 3) & 1];
          if (o.axis === "x") fan(fm, t + jit, yy + rise * 0.15 + 0.02, dd + o.out * step * 0.05, o.out < 0 ? 0 : 1, sh, sk, hr, seed);
          else fan(fm, dd + o.out * step * 0.05, yy + rise * 0.15 + 0.02, t + jit, o.out < 0 ? 2 : 3, sh, sk, hr, seed);
        }
      }
    }
    m.code = -1;
    if (crowdMeshes) crowdMeshes[0].code = crowdMeshes[1].code = -1;
    return o.y0 + rows * rise;
  }
  function seatFn(base, alt) { return function (r) { return r % 2 ? base : shade(base, 0.88); }; }
  /* Torre de focos de celosía con la cabeza de lámparas mirando al campo. */
  function tower(m, x, z) {
    var H = 34, s = 0.9;
    m.code = MAT_METAL;
    for (var cx = -1; cx <= 1; cx += 2) for (var cz = -1; cz <= 1; cz += 2) m.box(x + cx * s, 0, z + cz * s, 0.22, H, 0.22, STEEL, 0.6);
    for (var y = 2; y < H; y += 3) {
      m.box(x, y, z - s, 2 * s + 0.2, 0.14, 0.12, STEEL); m.box(x, y, z + s, 2 * s + 0.2, 0.14, 0.12, STEEL);
      m.box(x - s, y, z, 0.12, 0.14, 2 * s + 0.2, STEEL); m.box(x + s, y, z, 0.12, 0.14, 2 * s + 0.2, STEEL);
    }
    m.code = MAT_MATTE;
    var dx = LEN / 2 - x, dz = MIDZ - z, l = Math.sqrt(dx * dx + dz * dz); dx /= l; dz /= l;
    m.box(x, H, z, 6.4, 3.4, 1.0, DARK, 0.8);
    m.code = MAT_EMIT;
    for (var lx = -2; lx <= 2; lx++) for (var ly = 0; ly < 3; ly++) {
      var px = x + lx * 1.15 * Math.abs(dz) + dx * 0.56, pz = z + lx * 1.15 * Math.abs(dx) * (dz > 0 ? 1 : -1) * 0 + dz * 0.56;
      var ox = Math.abs(dz) > Math.abs(dx) ? lx * 1.15 : 0, oz = Math.abs(dz) > Math.abs(dx) ? 0 : lx * 1.15;
      m.box(x + ox + dx * 0.55, H + 0.35 + ly * 1.0, z + oz + dz * 0.55, Math.abs(dz) > Math.abs(dx) ? 0.9 : 0.12, 0.75, Math.abs(dz) > Math.abs(dx) ? 0.12 : 0.9, [1.0, 0.97, 0.86], 1);
    }
    m.code = -1;
    LAMPS.push([x + dx * 1.5, H + 1.7, z + dz * 1.5, 7, 0.9]);
  }
  /* Valla LED: marco oscuro y pantalla animada hacia el campo. */
  function ledBoard(m, x, z, len, axis, toward, cols) {
    m.code = MAT_MATTE;
    if (axis === "x") m.box(x, 0, z, len, 0.95, 0.28, DARK, 0.7); else m.box(x, 0, z, 0.28, 0.95, len, DARK, 0.7);
    m.code = MAT_LED;
    var n = Math.max(1, Math.round(len / 1.0));
    for (var i = 0; i < n; i++) {
      var t0 = -len / 2 + i * len / n, t1 = t0 + len / n, c = cols[Math.floor(i / 3) % cols.length];
      if ((i * 7) % 5 === 0) c = mix(c, [1, 1, 1], 0.55);
      var y0 = 0.14, y1 = 0.86, f = toward * 0.15;
      if (axis === "x") m.quad([x + t0, y0, z + f], [x + t1, y0, z + f], [x + t1, y1, z + f], [x + t0, y1, z + f], c);
      else m.quad([x + f, y0, z + t0], [x + f, y0, z + t1], [x + f, y1, z + t1], [x + f, y1, z + t0], c);
    }
    m.code = -1;
  }

  var SCREENS = [];
  function buildStadium(m) {
    SCREENS = [];
    var c0 = colors[0] || [0.8, 0.2, 0.2], c1 = colors[1] || [0.2, 0.4, 0.8];
    var seatHome = shade(c0, 0.8), seatAway = shade(c1, 0.8), seatN = [0.30, 0.33, 0.38];
    /* Tribuna principal (z<0): dos anfiteatros con cubierta y túnel. */
    var top1 = standRows(m, {axis: "x", a0: -10, a1: LEN + 10, d0: -6.2, out: -1, y0: 0.5, rows: 11, seat: seatFn(seatHome),
      fill: 88, home: 0, salt: 1, gap: [TUNNEL_X - 3.8, TUNNEL_X + 3.8], gapRows: 5});
    m.code = MAT_MATTE;
    m.box(LEN / 2, top1, -6.2 - 11 * 0.82 - 1.2, LEN + 20, 1.1, 2.4, CONCRETE_D, 0.7);  /* vomitorio / pasillo */
    var top2 = standRows(m, {axis: "x", a0: -10, a1: LEN + 10, d0: -6.2 - 11 * 0.82 - 2.4, out: -1, y0: top1 + 1.1, rows: 10, seat: seatFn(seatHome),
      fill: 80, home: 0, salt: 2, rise: 0.56});
    var backZ = -6.2 - 21 * 0.82 - 2.6;
    m.box(LEN / 2, 0, backZ - 0.4, LEN + 22, top2 + 1.6, 0.8, CONCRETE_D, 0.6);
    /* cubierta: cerchas metálicas y chapa, con la línea de focos en el borde */
    var roofY = Math.max(top2 + 3.2, 15);
    m.code = MAT_MATTE;
    m.box(LEN / 2, roofY, (backZ - 4.6) / 2, LEN + 24, 0.35, Math.abs(backZ) - 3.6, [0.22, 0.24, 0.27], 0.9);
    m.code = MAT_METAL;
    for (var tx = -10; tx <= LEN + 10; tx += 7.5) {
      m.box(tx, roofY - 1.2, (backZ - 4.6) / 2, 0.3, 1.2, Math.abs(backZ) - 3.6, STEEL, 0.8);
      m.box(tx, 0, backZ - 0.2, 0.5, roofY, 0.5, STEEL, 0.7);
    }
    m.box(LEN / 2, roofY - 0.6, -4.8, LEN + 24, 0.6, 0.5, STEEL);
    m.code = MAT_EMIT;
    for (var lx = -6; lx <= LEN + 6; lx += 9) {
      m.box(lx, roofY - 0.95, -4.75, 2.6, 0.32, 0.3, [1.0, 0.96, 0.84], 1);
      LAMPS.push([lx, roofY - 0.8, -4.4, 2.4, 0.5]);
    }
    m.code = -1;
    /* túnel con marquesina de los colores locales */
    m.code = MAT_MATTE;
    m.box(TUNNEL_X - 3.9, 0, -5.4, 0.4, 2.7, 4.2, CONCRETE_D, 0.6);
    m.box(TUNNEL_X + 3.9, 0, -5.4, 0.4, 2.7, 4.2, CONCRETE_D, 0.6);
    m.box(TUNNEL_X, 2.7, -5.6, 8.2, 0.35, 4.6, c0, 0.8);
    m.box(TUNNEL_X, 0, -7.6, 7.4, 2.7, 0.3, [0.02, 0.02, 0.025], 0.9);
    /* banquillos vóxel */
    [-1, 1].forEach(function (sd) {
      var bx = LEN / 2 + sd * 9;
      m.box(bx, 0, -4.4, 7.2, 0.5, 1.3, DARK, 0.7);
      m.box(bx, 0.5, -4.85, 7.2, 0.55, 0.35, sd < 0 ? seatHome : seatAway, 0.8);
      m.box(bx, 0, -5.1, 7.4, 2.1, 0.12, [0.70, 0.78, 0.82], 0.8);
      m.box(bx, 2.1, -4.5, 7.6, 0.12, 1.5, [0.70, 0.78, 0.82], 0.9);
    });
    /* Tribuna de enfrente (lado de cámara): baja y sin cubierta para no tapar el plano. */
    var topF = standRows(m, {axis: "x", a0: -10, a1: LEN + 10, d0: WID + 6.2, out: 1, y0: 0.5, rows: 14, seat: seatFn(seatN),
      fill: 84, home: -1, salt: 3});
    m.code = MAT_MATTE;
    m.box(LEN / 2, 0, WID + 6.2 + 14 * 0.82 + 0.4, LEN + 22, topF + 1.2, 0.8, CONCRETE_D, 0.6);
    m.code = -1;
    /* Fondos: local a la izquierda, visitante a la derecha, con videomarcador. */
    [0, 1].forEach(function (e) {
      var out = e ? 1 : -1, d0 = e ? LEN + 6.2 : -6.2;
      var top = standRows(m, {axis: "z", a0: -4, a1: WID + 4, d0: d0, out: out, y0: 0.5, rows: 13, seat: seatFn(e ? seatAway : seatHome),
        fill: e ? 72 : 90, home: e ? 1 : 0, salt: 5 + e});
      var back = d0 + out * (13 * 0.82 + 0.4);
      m.code = MAT_MATTE;
      m.box(back, 0, MIDZ, 0.8, top + 1.4, WID + 10, CONCRETE_D, 0.6);
      /* videomarcador */
      m.box(back + out * 0.6, top + 1.4, MIDZ, 0.6, 5.6, 16, DARK, 0.9);
      SCREENS.push({x: back - out * 0.06, out: out, y0: top + 1.9, y1: top + 6.5, z0: MIDZ - 7.4, z1: MIDZ + 7.4});
      m.code = MAT_EMIT;
      m.quad([back - out * 0.05, top + 1.9, MIDZ - 7.4], [back - out * 0.05, top + 1.9, MIDZ], [back - out * 0.05, top + 6.5, MIDZ], [back - out * 0.05, top + 6.5, MIDZ - 7.4], shade(c0, 0.75));
      m.quad([back - out * 0.05, top + 1.9, MIDZ], [back - out * 0.05, top + 1.9, MIDZ + 7.4], [back - out * 0.05, top + 6.5, MIDZ + 7.4], [back - out * 0.05, top + 6.5, MIDZ], shade(c1, 0.75));
      m.code = -1;
      /* cubierta de fondo */
      m.code = MAT_MATTE;
      m.box(d0 + out * 6.5, top + 7.6, MIDZ, 13.5, 0.3, WID + 14, [0.22, 0.24, 0.27], 0.9);
      m.code = MAT_METAL;
      for (var tz = -4; tz <= WID + 4; tz += 9) m.box(back, 0, tz, 0.45, top + 7.6, 0.45, STEEL, 0.7);
      m.code = -1;
    });
    /* esquinas: bloques escalonados que cierran el estadio */
    [[-10, -6.2], [LEN + 10, -6.2], [-10, WID + 6.2], [LEN + 10, WID + 6.2]].forEach(function (c, k) {
      var sx = k % 2 ? 1 : -1, sz = k < 2 ? -1 : 1;
      for (var r = 0; r < 8; r++) {
        m.box(c[0] + sx * (2 + r * 0.82), 0, c[1] + sz * (2 + r * 0.82), 4 + r * 1.64, 0.5 + r * 0.46, 4 + r * 1.64, r % 2 ? CONCRETE : shade(CONCRETE, 0.92), 0.75, 1);
      }
    });
    /* torres de focos */
    TOWERS.forEach(function (t) { tower(m, t[0], t[2]); });
    /* Ciudad al fondo: bloques con ventanas que se encienden de noche. */
    var city = [[0.20, 0.22, 0.26], [0.26, 0.25, 0.24], [0.17, 0.19, 0.23], [0.30, 0.29, 0.28]];
    for (var i = 0; i < 46; i++) {
      var ang = i / 46 * TAU + 0.07 * Math.sin(i * 3.7), rad = 150 + (i * 37) % 32;
      var bx2 = LEN / 2 + Math.cos(ang) * rad, bz2 = MIDZ + Math.sin(ang) * rad * 0.82;
      var bw = 10 + (i * 13) % 14, bh = 14 + (i * 29) % 46, bd = 10 + (i * 7) % 12;
      m.code = MAT_MATTE; m.box(bx2, 0, bz2, bw, bh, bd, city[i % city.length], 0.7);
      m.code = MAT_EMIT;
      for (var wy = 4; wy < bh - 2; wy += 6) for (var wk = 0; wk < 3; wk++) {
        if (((i * 31 + wy * 7 + wk * 13) % 5) > 1) continue;
        var wx = bx2 + (wk - 1) * bw * 0.28, nz = bz2 + (Math.sin(ang) > 0 ? -1 : 1) * (bd / 2 + 0.05);
        m.quad([wx - 1.1, wy, nz], [wx + 1.1, wy, nz], [wx + 1.1, wy + 1.4, nz], [wx - 1.1, wy + 1.4, nz], [0.55, 0.45, 0.25]);
      }
      m.code = -1;
    }
  }

  function buildField(m) {
    /* suelo exterior, pista y césped (el shader pinta franjas, losetas y desgaste) */
    m.code = MAT_MATTE;
    m.quad([-240, -0.06, -240], [LEN + 240, -0.06, -240], [LEN + 240, -0.06, WID + 240], [-240, -0.06, WID + 240], [0.24, 0.25, 0.24]);
    m.quad([-6, -0.03, -5.2], [LEN + 6, -0.03, -5.2], [LEN + 6, -0.03, WID + 5.2], [-6, -0.03, WID + 5.2], [0.30, 0.22, 0.17]);
    m.code = MAT_GRASS;
    /* rejilla (no un único quad) para que la variante ligera ilumine por vértice */
    var GX = 28, GZ = 18, gx0 = -4.6, gz0 = -3.6, gdx = (LEN + 9.2) / GX, gdz = (WID + 7.2) / GZ;
    for (var gi = 0; gi < GX; gi++) for (var gj = 0; gj < GZ; gj++) {
      var ax = gx0 + gi * gdx, az = gz0 + gj * gdz;
      m.quad([ax, 0, az], [ax + gdx, 0, az], [ax + gdx, 0, az + gdz], [ax, 0, az + gdz], GRASS);
    }
    m.code = MAT_MATTE;
    var LW = [0.93, 0.95, 0.92];
    m.line(0, 0, LEN, 0, LW, 0.12, 0.012); m.line(LEN, 0, LEN, WID, LW, 0.12, 0.012);
    m.line(LEN, WID, 0, WID, LW, 0.12, 0.012); m.line(0, WID, 0, 0, LW, 0.12, 0.012);
    m.line(LEN / 2, 0, LEN / 2, WID, LW, 0.12, 0.012);
    m.ring(LEN / 2, MIDZ, 9.15, 0.12, LW, 48, 0.012);
    m.circle(LEN / 2, MIDZ, 0.13, LW, 10, 0.013);
    [0, LEN].forEach(function (end) {
      var dir = end === 0 ? 1 : -1, x = end;
      m.line(x, MIDZ - 20.16, x + dir * 16.5, MIDZ - 20.16, LW, 0.12, 0.012);
      m.line(x + dir * 16.5, MIDZ - 20.16, x + dir * 16.5, MIDZ + 20.16, LW, 0.12, 0.012);
      m.line(x + dir * 16.5, MIDZ + 20.16, x, MIDZ + 20.16, LW, 0.12, 0.012);
      m.line(x, MIDZ - 9.16, x + dir * 5.5, MIDZ - 9.16, LW, 0.12, 0.012);
      m.line(x + dir * 5.5, MIDZ - 9.16, x + dir * 5.5, MIDZ + 9.16, LW, 0.12, 0.012);
      m.line(x + dir * 5.5, MIDZ + 9.16, x, MIDZ + 9.16, LW, 0.12, 0.012);
      m.circle(x + dir * 11, MIDZ, 0.13, LW, 10, 0.013);
      /* arco del área */
      for (var k = 0; k < 14; k++) {
        var a0 = -0.93 + k * 1.86 / 14, a1 = -0.93 + (k + 1) * 1.86 / 14;
        m.line(x + dir * (11 + Math.cos(a0) * 9.15), MIDZ + Math.sin(a0) * 9.15, x + dir * (11 + Math.cos(a1) * 9.15), MIDZ + Math.sin(a1) * 9.15, LW, 0.11, 0.012);
      }
      /* Portería vóxel: postes blancos brillantes y red de malla fina. */
      var z1 = MIDZ - POST, z2 = MIDZ + POST, back = end === 0 ? -2.0 : LEN + 2.0, mid = (x + back) / 2, dep = Math.abs(back - x);
      m.code = MAT_GLOSS;
      var PW = [0.96, 0.97, 0.95];
      m.box(x, 0, z1, 0.14, BAR, 0.14, PW, 0.9); m.box(x, 0, z2, 0.14, BAR, 0.14, PW, 0.9);
      m.box(x, BAR - 0.07, MIDZ, 0.14, 0.14, POST * 2 + 0.14, PW);
      m.code = MAT_MATTE;
      var NETC = [0.86, 0.88, 0.86];
      m.box(back, 0, z1, 0.08, 1.9, 0.08, NETC); m.box(back, 0, z2, 0.08, 1.9, 0.08, NETC);
      m.box(mid, BAR - 0.05, z1, dep, 0.05, 0.05, NETC); m.box(mid, BAR - 0.05, z2, dep, 0.05, 0.05, NETC);
      /* laterales fijos; techo y fondo son la red con física (drawNets) */
      for (var xx = 0.36; xx < dep; xx += 0.36) {
        var nx = x - dir * xx, ny = BAR - (BAR - 1.9) * (xx / dep);
        m.box(nx, 0, z1, 0.025, ny, 0.025, NETC); m.box(nx, 0, z2, 0.025, ny, 0.025, NETC);
      }
      for (var sy = 0.36; sy < 1.9; sy += 0.36) {
        m.box(mid, sy, z1, dep, 0.025, 0.025, NETC); m.box(mid, sy, z2, dep, 0.025, 0.025, NETC);
      }
      m.code = -1;
    });
    /* banderines */
    [[0, 0], [LEN, 0], [0, WID], [LEN, WID]].forEach(function (c) {
      m.code = MAT_GLOSS; m.box(c[0], 0, c[1], 0.05, 1.5, 0.05, [0.95, 0.95, 0.92]);
      m.code = MAT_MATTE; m.box(c[0] + 0.2, 1.18, c[1], 0.36, 0.3, 0.03, [0.98, 0.78, 0.10]);
      m.code = -1;
    });
    /* vallas LED alrededor del campo */
    var cols = [colors[0] || [0.8, 0.2, 0.2], [0.10, 0.45, 0.95], colors[1] || [0.2, 0.4, 0.8], [0.98, 0.72, 0.12]];
    for (var bx = 2.5; bx < LEN; bx += 10) {
      if (Math.abs(bx + 2.5 - TUNNEL_X) < 6) continue;
      ledBoard(m, bx + 2.5, -3.2, 9.6, "x", 1, cols);
    }
    for (var bx2 = 2.5; bx2 < LEN; bx2 += 10) ledBoard(m, bx2 + 2.5, WID + 3.2, 9.6, "x", -1, cols.slice().reverse());
    [[-4.4, 1], [LEN + 4.4, -1]].forEach(function (e) {
      ledBoard(m, e[0], 9, 16, "z", e[1], cols); ledBoard(m, e[0], WID - 9, 16, "z", e[1], cols);
    });
    buildStadium(m);
    m.code = -1;
  }

  /* ------------------------------------------------------------------ shaders / GL */

  /* Ambientación: hora del partido y clima. Colores en espacio lineal. */
  var TOWERS = [[-15, 36, -17], [LEN + 15, 36, -17], [-15, 36, WID + 17], [LEN + 15, 36, WID + 17]];
  var envNow = null, envKey = "", todSel = "night";
  function lin(c) { return [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)]; }
  function envFor(tod, wx) {
    var e;
    if (tod === "day") e = {sun: norm3([0.42, 0.78, 0.46]), sunCol: [2.15, 2.02, 1.82], sky: [0.42, 0.52, 0.66], ground: [0.16, 0.18, 0.12],
      zenith: [0.20, 0.40, 0.78], horizon: [0.70, 0.80, 0.90], fogDen: 0.0024, flood: 0, night: 0, exposure: 0.95, emis: 1.6};
    else if (tod === "dusk") e = {sun: norm3([0.74, 0.30, 0.60]), sunCol: [2.05, 1.45, 0.98], sky: [0.34, 0.30, 0.42], ground: [0.12, 0.10, 0.09],
      zenith: [0.16, 0.20, 0.42], horizon: [0.98, 0.56, 0.32], fogDen: 0.0030, flood: 0.55, night: 0.15, exposure: 1.05, emis: 2.2};
    else e = {sun: norm3([0.30, 0.86, -0.42]), sunCol: [0.95, 0.98, 1.08], sky: [0.09, 0.11, 0.17], ground: [0.04, 0.05, 0.04],
      zenith: [0.006, 0.012, 0.035], horizon: [0.05, 0.075, 0.13], fogDen: 0.0036, flood: 0.5, night: 1, exposure: 1.05, emis: 3.0};
    e.tod = tod;
    if (wx === "rain") {
      e.sunCol = shade(e.sunCol, 0.42); e.sky = mix(e.sky, [0.32, 0.35, 0.40], 0.5); e.fogDen *= 3.2;
      e.zenith = mix(e.zenith, [0.20, 0.23, 0.27], tod === "night" ? 0.15 : 0.7); e.horizon = mix(e.horizon, [0.42, 0.46, 0.50], tod === "night" ? 0.15 : 0.7);
      e.stars = 0;
    } else if (wx === "cold") {
      e.sunCol = mix(e.sunCol, [1.6, 1.8, 2.2], 0.35); e.sky = mix(e.sky, [0.45, 0.55, 0.72], 0.3); e.fogDen *= 1.6;
      e.horizon = mix(e.horizon, [0.78, 0.84, 0.92], tod === "night" ? 0.1 : 0.45);
    } else if (wx === "heat") {
      e.sunCol = mix(e.sunCol, [2.8, 2.3, 1.6], 0.5); e.fogDen *= 1.4; e.horizon = mix(e.horizon, [0.95, 0.82, 0.60], tod === "night" ? 0.1 : 0.5);
    } else if (wx === "mild") {
      e.sunCol = shade(e.sunCol, 0.72); e.sky = mix(e.sky, [0.40, 0.44, 0.50], 0.35); e.fogDen *= 1.5;
      e.horizon = mix(e.horizon, [0.62, 0.66, 0.72], tod === "night" ? 0.1 : 0.45);
    }
    /* el césped también cambia: mojado y oscuro, escarchado o quemado */
    e.grassMul = wx === "rain" ? [0.80, 0.92, 0.84] : wx === "heat" ? [1.18, 1.02, 0.66] : wx === "mild" ? [0.95, 0.98, 0.95] : [1, 1, 1];
    e.grassMix = wx === "cold" ? [0.20, 0.25, 0.25, 0.20] : wx === "heat" ? [0.17, 0.14, 0.05, 0.22] : [0, 0, 0, 0];
    e.wet = wx === "rain" ? 1 : 0;
    if (e.stars == null) e.stars = e.night;
    e.zenith = lin(e.zenith); e.horizon = lin(e.horizon); e.sky = lin(e.sky); e.ground = lin(e.ground);
    e.fog = mix(e.horizon, e.sky, 0.25);
    return e;
  }
  /* La hora sale de la partida (opts.tod) o, si no llega, de los colores de
   * los equipos: el mismo cruce siempre se juega a la misma hora. */
  function pickTod() {
    if (opts && /^(day|dusk|night)$/.test(opts.tod || "")) return opts.tod;
    var h = hashKey(String(opts && opts.envSeed != null ? opts.envSeed : (colors[0] + "|" + colors[1])));
    return ["night", "dusk", "day", "night", "day"][h % 5];
  }
  function currentEnv() {
    var k = todSel + "|" + sim.wx;
    if (!envNow || envKey !== k) { envNow = envFor(todSel, sim.wx); envKey = k; shadowDirty = true; }
    return envNow;
  }

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  }
  function makeProgram(vsSrc, fsSrc) {
    var pr = gl.createProgram();
    gl.attachShader(pr, shader(gl.VERTEX_SHADER, vsSrc)); gl.attachShader(pr, shader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) || "link");
    return pr;
  }
  var PREC = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n";
  var VS_MAIN =
    "attribute vec3 aPos;attribute vec3 aCol;attribute vec3 aNrm;attribute float aMat;" +
    "uniform mat4 uMvp;uniform mat4 uShadowMvp;uniform float uTime;uniform float uCrowd;" +
    "varying vec3 vCol;varying vec3 vNrm;varying vec3 vWorld;varying float vCode;varying float vAo;varying vec4 vSh;" +
    "void main(){float code=floor(aMat+0.0005);float ao=(aMat-code)/0.98;vec3 p=aPos;" +
    "if(code>4.5&&code<5.5){float ph=aPos.x*1.37+aPos.z*0.91;float r=fract(ph*0.137);" +
    "p.y+=max(0.0,sin(uTime*(3.2+r*2.6)+ph))*uCrowd*(0.25+0.75*fract(ph*7.31));}" +
    "vWorld=p;vCol=aCol;vNrm=aNrm;vCode=code;vAo=ao;vSh=uShadowMvp*vec4(p,1.0);gl_Position=uMvp*vec4(p,1.0);}";
  var FS_MAIN = PREC +
    "varying vec3 vCol;varying vec3 vNrm;varying vec3 vWorld;varying float vCode;varying float vAo;varying vec4 vSh;" +
    "uniform vec3 uEye;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uSkyAmb;uniform vec3 uGroundAmb;uniform vec3 uFogCol;" +
    "uniform vec3 uZenith;uniform vec3 uHorizon;uniform float uFogDen;uniform float uExposure;uniform float uTime;uniform float uStars;" +
    "uniform float uShadowOn;uniform float uTexel;uniform float uFlood;uniform float uEmis;uniform vec2 uRes;uniform sampler2D uShadow;" +
    "uniform vec3 uL0;uniform vec3 uL1;uniform vec3 uL2;uniform vec3 uL3;uniform vec3 uGrassMul;uniform vec4 uGrassMix;uniform float uWet;" +
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "float unpack(vec4 c){return dot(c,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}" +
    "float tap(vec3 s,vec2 o,float b){return step(s.z-b,unpack(texture2D(uShadow,s.xy+o*uTexel)));}" +
    "\n#ifdef LITE\nfloat shadowAt(float ndl){return 1.0;}\n#else\n" +
    "float shadowAt(float ndl){if(uShadowOn<0.5)return 1.0;vec3 s=vSh.xyz/vSh.w*0.5+0.5;" +
    "if(s.x<0.0||s.x>1.0||s.y<0.0||s.y>1.0||s.z>1.0)return 1.0;float b=0.0016+0.004*(1.0-ndl);" +
    "return (tap(s,vec2(-1.2,-1.2),b)+tap(s,vec2(1.2,-1.2),b)+tap(s,vec2(-1.2,1.2),b)+tap(s,vec2(1.2,1.2),b)+tap(s,vec2(0.0),b)*2.0)/6.0;}\n#endif\n" +
    "float flood(vec3 lp,vec3 N){vec3 d=lp-vWorld;float l2=dot(d,d);vec3 L=d*inversesqrt(l2);return max(dot(N,L),0.0)*2600.0/(l2+600.0);}" +
    "vec3 sky(vec3 d){float h=max(d.y,0.0);vec3 c=mix(uHorizon,uZenith,pow(h,0.5));float sd=max(dot(d,uSunDir),0.0);" +
    "c+=uSunCol*(0.05*pow(sd,6.0)+0.6*pow(sd,700.0))*(1.0-uStars);" +
    "\n#ifndef LITE\n" + "if(uStars>0.01&&d.y>0.04){vec2 g=floor(d.xz/(d.y+0.35)*240.0);c+=vec3(step(0.9968,hash(g)))*uStars*0.8*smoothstep(0.04,0.3,d.y);}\n#endif\n" +
    "return c;}" +
    "vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}" +
    "void main(){vec3 col;float code=vCode;" +
    "if(code>5.5&&code<6.5){col=sky(normalize(vWorld-vec3(52.5,0.0,34.0)));}" +
    "else{vec3 alb=pow(vCol,vec3(2.2));vec3 V=normalize(uEye-vWorld);vec3 N=normalize(vNrm);if(dot(N,V)<0.0)N=-N;" +
    "if(code>3.5&&code<4.5){col=alb*uEmis;}" +
    "else if(code>6.5&&code<7.5){col=alb*(uSkyAmb*0.9+uSunCol*0.3);}" +
    "else if(code>7.5){float band=step(0.5,fract(vWorld.x*0.06+vWorld.z*0.06-uTime*0.25));col=alb*uEmis*(0.7+0.4*band);}" +
    "else{" +
    "if(code>2.5&&code<3.5){vec2 p=vWorld.xz;float st=mod(floor(p.x/8.75),2.0);float cr=mod(floor(p.y/8.5),2.0);" +
    "alb*=mix(0.86,1.08,st)*mix(0.97,1.03,cr);\n#ifndef LITE\nalb*=(0.93+0.09*hash(floor(p*1.5)))*(0.97+0.05*hash(floor(p*5.0)));" +
    "float w=max(1.0-smoothstep(0.0,7.5,length((p-vec2(5.0,34.0))*vec2(1.0,1.6))),1.0-smoothstep(0.0,7.5,length((p-vec2(100.0,34.0))*vec2(1.0,1.6))));" +
    "w=max(w,(1.0-smoothstep(0.0,3.5,length(p-vec2(52.5,34.0))))*0.6);if(p.x<0.0||p.x>105.0||p.y<0.0||p.y>68.0)w=0.0;" +
    "alb=mix(alb,vec3(0.13,0.10,0.05),w*0.30);\n#endif\n" +
    "alb=mix(alb*uGrassMul,uGrassMix.rgb,uGrassMix.a);}" +
    "float ndl=max(dot(N,uSunDir),0.0);float sh=shadowAt(ndl);float ao=vAo;" +
    "vec3 hemi=mix(uGroundAmb,uSkyAmb,N.y*0.5+0.5);vec3 lt=hemi*ao+uSunCol*ndl*sh*(0.45+0.55*ao);" +
    "if(uFlood>0.01){float f=flood(uL0,N)+flood(uL1,N)+flood(uL2,N)+flood(uL3,N);lt+=vec3(0.92,0.95,1.0)*f*uFlood*(0.5+0.5*ao)*mix(0.6,1.0,sh);}" +
    "col=alb*lt;" +
    "if(uWet>0.01&&code>2.5&&code<3.5){vec3 H=normalize(uSunDir+V);col+=uSunCol*pow(max(dot(N,H),0.0),40.0)*0.35*uWet*sh;}" +
    "\n#ifndef LITE\n" + "if(code>0.5&&code<2.5){vec3 H=normalize(uSunDir+V);float nh=max(dot(N,H),0.0);" +
    "float sp=code>1.5?pow(nh,60.0)*1.6:pow(nh,28.0)*0.5;float fr=0.04+0.96*pow(1.0-max(dot(N,V),0.0),5.0);" +
    "col+=uSunCol*sp*sh*(0.35+fr)*(code>1.5?mix(vec3(0.7),alb,0.5):vec3(1.0));}\n#endif\n" +
    "}" +
    "float dist=length(vWorld-uEye);float hf=exp(-max(vWorld.y,0.0)*0.03);" +
    "float fog=1.0-exp(-dist*uFogDen*(0.45+0.55*hf));col=mix(col,uFogCol,clamp(fog,0.0,0.92));}" +
    "col=aces(col*uExposure);col=pow(col,vec3(1.0/2.2));" +
    "vec2 uv=gl_FragCoord.xy/uRes-0.5;col*=1.0-0.42*dot(uv,uv);" +
    "gl_FragColor=vec4(col,1.0);}";
  var VS_SHADOW = "attribute vec3 aPos;uniform mat4 uMvp;void main(){gl_Position=uMvp*vec4(aPos,1.0);}";
  var FS_SHADOW = PREC + "void main(){vec4 e=fract(gl_FragCoord.z*vec4(1.0,255.0,65025.0,16581375.0));" +
    "e-=e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);gl_FragColor=e;}";

  /* Variante ligera (móviles modestos): iluminación por vértice y fragmento
   * mínimo. Misma paleta, luces y niebla; sin sombras ni especulares. */
  var VS_LITE =
    "attribute vec3 aPos;attribute vec3 aCol;attribute vec3 aNrm;attribute float aMat;" +
    "uniform mat4 uMvp;uniform float uTime;uniform float uCrowd;uniform vec3 uEye;uniform vec3 uSunDir;uniform vec3 uSunCol;" +
    "uniform vec3 uSkyAmb;uniform vec3 uGroundAmb;uniform vec3 uZenith;uniform vec3 uHorizon;uniform float uFogDen;uniform float uFlood;uniform float uStars;" +
    "uniform vec3 uL0;uniform vec3 uL1;uniform vec3 uL2;uniform vec3 uL3;" +
    "varying vec3 vCol;varying vec3 vLt;varying vec3 vWorld;varying float vCode;varying float vFog;" +
    "float flood(vec3 lp,vec3 N,vec3 w){vec3 d=lp-w;float l2=dot(d,d);return max(dot(N,d*inversesqrt(l2)),0.0)*2600.0/(l2+600.0);}" +
    "void main(){float code=floor(aMat+0.0005);float ao=(aMat-code)/0.98;vec3 p=aPos;" +
    "if(code>4.5&&code<5.5){float ph=aPos.x*1.37+aPos.z*0.91;float r=fract(ph*0.137);" +
    "p.y+=max(0.0,sin(uTime*(3.2+r*2.6)+ph))*uCrowd*(0.25+0.75*fract(ph*7.31));}" +
    "vec3 lt;float fog=0.0;" +
    "if(code>5.5&&code<6.5){vec3 d=normalize(p-vec3(52.5,0.0,34.0));float h=max(d.y,0.0);float sd=max(dot(d,uSunDir),0.0);" +
    "lt=mix(uHorizon,uZenith,sqrt(h))+uSunCol*0.05*pow(sd,6.0)*(1.0-uStars);}" +
    "else{vec3 N=aNrm;if(dot(N,uEye-p)<0.0)N=-N;" +
    "if(code>6.5&&code<7.5)lt=uSkyAmb*0.9+uSunCol*0.3;" +
    "else{float ndl=max(dot(N,uSunDir),0.0);lt=mix(uGroundAmb,uSkyAmb,N.y*0.5+0.5)*ao+uSunCol*ndl*(0.45+0.55*ao)*0.88;" +
    "if(uFlood>0.01){float f=flood(uL0,N,p)+flood(uL1,N,p)+flood(uL2,N,p)+flood(uL3,N,p);lt+=vec3(0.92,0.95,1.0)*f*uFlood*(0.5+0.5*ao)*0.9;}}" +
    "float dist=length(p-uEye);float hf=exp(-max(p.y,0.0)*0.03);fog=clamp(1.0-exp(-dist*uFogDen*(0.45+0.55*hf)),0.0,0.92);}" +
    "vLt=lt;vFog=fog;vCol=aCol;vWorld=p;vCode=code;gl_Position=uMvp*vec4(p,1.0);}";
  var FS_LITE = PREC +
    "varying vec3 vCol;varying vec3 vLt;varying vec3 vWorld;varying float vCode;varying float vFog;" +
    "uniform vec3 uFogCol;uniform float uExposure;uniform float uTime;uniform float uEmis;uniform vec2 uRes;uniform vec3 uGrassMul;uniform vec4 uGrassMix;" +
    "void main(){vec3 col;float code=vCode;" +
    "if(code>5.5&&code<6.5){col=vLt;}else{vec3 alb=vCol*vCol;" +
    "if(code>3.5&&code<4.5)col=alb*uEmis;" +
    "else if(code>7.5){float band=step(0.5,fract(vWorld.x*0.06+vWorld.z*0.06-uTime*0.25));col=alb*uEmis*(0.7+0.4*band);}" +
    "else{if(code>2.5&&code<3.5){vec2 q=vWorld.xz;alb*=mix(0.86,1.08,mod(floor(q.x/8.75),2.0))*mix(0.97,1.03,mod(floor(q.y/8.5),2.0));alb=mix(alb*uGrassMul,uGrassMix.rgb,uGrassMix.a);}col=alb*vLt;}" +
    "col=mix(col,uFogCol,vFog);}" +
    "col*=uExposure;col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);col=sqrt(col);" +
    "vec2 uv=gl_FragCoord.xy/uRes-0.5;col*=1.0-0.42*dot(uv,uv);gl_FragColor=vec4(col,1.0);}";

  var shadowProg = null, shadowLoc = null, shadowFb = null, shadowTex = null, shadowRb = null, shadowSize = 0;
  var shadowMat = new Float32Array(16), shadowDirty = true, skyBuf = null, skyCount = 0, fxBuf = null, fx = null, fxCap = 0;
  var LAMPS = [];
  var U_NAMES = ["uMvp", "uShadowMvp", "uTime", "uCrowd", "uEye", "uSunDir", "uSunCol", "uSkyAmb", "uGroundAmb", "uFogCol",
    "uZenith", "uHorizon", "uFogDen", "uExposure", "uStars", "uShadowOn", "uTexel", "uFlood", "uEmis", "uRes", "uShadow",
    "uL0", "uL1", "uL2", "uL3", "uGrassMul", "uGrassMix", "uWet"];

  function initShadows() {
    shadowSize = 0;
    try {
      shadowProg = makeProgram(VS_SHADOW, FS_SHADOW);
      shadowLoc = {pos: gl.getAttribLocation(shadowProg, "aPos"), mvp: gl.getUniformLocation(shadowProg, "uMvp")};
      var size = quality < 0.8 ? 1024 : 2048;
      var maxT = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024; if (size > maxT) size = maxT;
      shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      shadowRb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, shadowRb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
      shadowFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, shadowRb);
      var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindTexture(gl.TEXTURE_2D, null);
      if (ok) shadowSize = size;
    } catch (err) { shadowSize = 0; }
  }
  /* Proyección ortográfica desde el sol (o el foco principal) que abarca el
   * estadio entero: el césped recibe las sombras de jugadores, porterías y
   * cubierta. */
  function updateShadowMatrix(env) {
    var L = env.sun, D = 160, c = [LEN / 2, 0, MIDZ];
    var eye = [c[0] + L[0] * D, c[1] + L[1] * D, c[2] + L[2] * D];
    var up = Math.abs(L[1]) > 0.97 ? [0, 0, 1] : [0, 1, 0];
    var v = lookAt(new Float32Array(16), eye, c, up);
    var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, mnz = 1e9, mxz = -1e9;
    var xs = [-7, LEN + 7], ys = [-1, 5], zs = [-6, WID + 6];
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) for (var k = 0; k < 2; k++) {
      var px = xs[i], py = ys[j], pz = zs[k];
      var X = v[0] * px + v[4] * py + v[8] * pz + v[12], Y = v[1] * px + v[5] * py + v[9] * pz + v[13], Z = v[2] * px + v[6] * py + v[10] * pz + v[14];
      mnx = Math.min(mnx, X); mxx = Math.max(mxx, X); mny = Math.min(mny, Y); mxy = Math.max(mxy, Y); mnz = Math.min(mnz, Z); mxz = Math.max(mxz, Z);
    }
    var o = new Float32Array(16), n = -mxz - 5, f = -mnz + 5;
    o[0] = 2 / (mxx - mnx); o[5] = 2 / (mxy - mny); o[10] = -2 / (f - n); o[15] = 1;
    o[12] = -(mxx + mnx) / (mxx - mnx); o[13] = -(mxy + mny) / (mxy - mny); o[14] = -(f + n) / (f - n);
    matMul(shadowMat, o, v);
    shadowDirty = false;
  }
  function useShadows() { return shadowSize > 0 && quality > 0.6 && !opts.noShadows; }

  function buildSky() {
    var m = new Mesh(16384), R = 210, cx = LEN / 2, cz = MIDZ, seg = 24, rings = 8;
    m.code = MAT_SKY;
    for (var j = 0; j < rings; j++) {
      var p0 = -0.25 + j * (PI / 2 + 0.25) / rings, p1 = -0.25 + (j + 1) * (PI / 2 + 0.25) / rings;
      for (var i = 0; i < seg; i++) {
        var a0 = i * TAU / seg, a1 = (i + 1) * TAU / seg;
        var A = [cx + R * Math.cos(p0) * Math.cos(a0), R * Math.sin(p0), cz + R * Math.cos(p0) * Math.sin(a0)];
        var B = [cx + R * Math.cos(p0) * Math.cos(a1), R * Math.sin(p0), cz + R * Math.cos(p0) * Math.sin(a1)];
        var C = [cx + R * Math.cos(p1) * Math.cos(a1), R * Math.sin(p1), cz + R * Math.cos(p1) * Math.sin(a1)];
        var D2 = [cx + R * Math.cos(p1) * Math.cos(a0), R * Math.sin(p1), cz + R * Math.cos(p1) * Math.sin(a0)];
        m.quad(A, B, C, D2, [1, 1, 1]);
      }
    }
    skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
    gl.bufferData(gl.ARRAY_BUFFER, m.a.subarray(0, m.n), gl.STATIC_DRAW);
    skyCount = m.n / FS;
  }

  function initGL() {
    gl = canvas.getContext("webgl", {alpha: false, antialias: quality > 0.6, powerPreference: "default"}) ||
      canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL no disponible");
    var mk = function (lite) {
      var pr = lite ? makeProgram(VS_LITE, FS_LITE) : makeProgram(VS_MAIN, FS_MAIN);
      var lc = {pos: gl.getAttribLocation(pr, "aPos"), col: gl.getAttribLocation(pr, "aCol"),
        nrm: gl.getAttribLocation(pr, "aNrm"), mat: gl.getAttribLocation(pr, "aMat")};
      U_NAMES.forEach(function (u) { lc[u] = gl.getUniformLocation(pr, u); });
      return [pr, lc];
    };
    var pf = mk(false); progFull = pf[0]; locFull = pf[1];
    /* Variante ligera para móviles modestos: sin sombras, sin ruido del
     * césped ni especulares; misma paleta y luces. */
    try { var pl = mk(true); progLite = pl[0]; locLite = pl[1]; } catch (e) { progLite = null; }
    program = progFull; locations = locFull;
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
    gl.clearColor(0.018, 0.035, 0.055, 1);
    staticBuf = gl.createBuffer(); dynBuf = gl.createBuffer(); fxBuf = gl.createBuffer();
    staticMesh = new Mesh(1 << 20); LAMPS = [];
    crowdMeshes = [new Mesh(1 << 20), new Mesh(1 << 20)];
    buildField(staticMesh);
    /* La afición va en dos búferes aparte: no proyecta sombras y la variante
     * ligera dibuja solo la mitad. */
    for (var ci = 0; ci < 2; ci++) {
      crowdBufs[ci] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, crowdBufs[ci]);
      gl.bufferData(gl.ARRAY_BUFFER, crowdMeshes[ci].a.subarray(0, Math.max(FS, crowdMeshes[ci].n)), gl.STATIC_DRAW);
      crowdCounts[ci] = crowdMeshes[ci].n / FS;
    }
    crowdMeshes = null;
    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.bufferData(gl.ARRAY_BUFFER, staticMesh.a.subarray(0, staticMesh.n), gl.STATIC_DRAW);
    staticCount = staticMesh.n / FS;
    staticMesh = {n: staticMesh.n};
    dyn = new Mesh(1 << 18); dyn.spec = true; dynCapacity = dyn.a.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    gl.bufferData(gl.ARRAY_BUFFER, dynCapacity * 4, gl.DYNAMIC_DRAW);
    fx = new Mesh(1 << 14); fx.code = MAT_EMIT; fxCap = fx.a.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, fxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, fxCap * 4, gl.DYNAMIC_DRAW);
    buildSky();
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    initShadows();
    shadowDirty = true;
  }

  function bindMesh(buf, loc) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, FS * 4, 0);
    if (loc.col != null && loc.col >= 0) gl.vertexAttribPointer(loc.col, 3, gl.FLOAT, false, FS * 4, 12);
    if (loc.nrm != null && loc.nrm >= 0) gl.vertexAttribPointer(loc.nrm, 3, gl.FLOAT, false, FS * 4, 24);
    if (loc.mat != null && loc.mat >= 0) gl.vertexAttribPointer(loc.mat, 1, gl.FLOAT, false, FS * 4, 36);
  }

  /* ------------------------------------------------------------------ equipos */

  function worldBaseX(side, nx) { return sim.attack[side] > 0 ? nx * LEN : LEN - nx * LEN; }

  function actorVariant(a) {
    return a && a.gk ? "goalkeeper" : (sim.fem ? "female" : "male");
  }

  function setActorVariant(a) {
    if (a) a.variant = actorVariant(a);
  }

  function refreshActorVariants() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) setActorVariant(sim.players[s] && sim.players[s][i]);
    for (var oi = 0; oi < sim.officials.length; oi++) setActorVariant(sim.officials[oi]);
  }

  function makeActor(side, slot, key, nx, nz) {
    var h = hashKey(key);
    var a = {side: side, slot: slot, key: key, pos: "MC", id: key, number: 0,
      nx: nx, nz: nz, baseX: worldBaseX(side, nx), baseZ: nz * WID,
      x: worldBaseX(side, nx), z: nz * WID, tx: worldBaseX(side, nx), tz: nz * WID,
      vx: 0, vz: 0, facing: sim.attack[side] > 0 ? PI / 2 : -PI / 2, runPhase: Math.random() * TAU,
      phase: (h % 997) / 997, variant: sim.fem ? "female" : "male",
       visualAnim: null,
      skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], scale: 0.94 + (h % 9) * 0.015,
      pace: 1, st: 1, ovr: 70, maxSp: 6.4, gk: false, gone: false, sentOff: false, anim: null,
      passTarget: null, faceLock: false, lean: 0, bank: 0};
    return a;
  }

  /* Árbitro y asistentes: actores puramente visuales, fuera de sim.players
     para no alterar el contrato de 22 jugadores ni la física del partido. */
  function makeOfficial(kind, x, z) {
    return {official: kind, side: 0, slot: -1, key: "official:" + kind, id: "official:" + kind,
      pos: "MC", nm: "", number: 0, nx: 0.5, nz: z / WID, baseX: x, baseZ: z,
      bandZ: kind === "ar1" ? -1.1 : kind === "ar2" ? WID + 1.1 : z,
      x: x, z: z, tx: x, tz: z, vx: 0, vz: 0, facing: PI / 2,
      runPhase: Math.random() * TAU, phase: Math.random(), variant: sim.fem ? "female" : "male",
      visualAnim: null, passTarget: null, skin: SKINS[kind === "ref" ? 1 : 2], hair: HAIRS[0],
      scale: kind === "ref" ? 1.0 : 0.97, pace: 1, st: 1, ovr: 70, maxSp: 7,
      gk: false, gone: false, sentOff: false, anim: null, faceLock: false, lean: 0, bank: 0};
  }

  function initOfficials() {
    sim.officials = [
      makeOfficial("ref", LEN / 2, MIDZ),
      makeOfficial("ar1", LEN / 2, -1.1),
      makeOfficial("ar2", LEN / 2, WID + 1.1)
    ];
  }

  function mirrorOfficials() {
    for (var i = 0; i < sim.officials.length; i++) {
      var o = sim.officials[i];
      o.x = LEN - o.x; o.tx = LEN - o.tx; o.baseX = LEN - o.baseX; o.vx = -o.vx;
      o.z = WID - o.z; o.tz = WID - o.tz; o.baseZ = WID - o.baseZ; o.vz = -o.vz;
      if (o.bandZ != null) o.bandZ = WID - o.bandZ;
      o.facing = PI - o.facing;
    }
  }

  /* ------------------------------------------------------------------ vestuario */
  /* Entrada, saludos, cara o cruz, descanso y despedida. Todo es puramente
   * visual: el balón y el marcador siguen llegando de match41. */

  function captainOf(side) {
    return actorAt(side, 9) || actorAt(side, 5) || listOf(side)[0] || null;
  }

  /* Orden de la comitiva: el capitán (slot 9) sale primero y el resto espera
   * detrás en una única fila. Dos filas, una por equipo, caben en la boca del
   * túnel sin solaparse. */
  function tunnelRank(side, slot) {
    var cap = captainOf(side), cs = cap ? cap.slot : 9;
    if (slot === cs) return 0;
    return 1 + (slot < cs ? slot : slot - 1);
  }

  function tunnelSpot(side, slot) {
    var rank = tunnelRank(side, slot);
    return {x: TUNNEL_X + (side ? 1.05 : -1.05), z: TUNNEL_Z + 0.35 - rank * 0.58};
  }

  /* Fila de salida: cada equipo avanza en columna por su carril y se detiene
   * escalonado, conservando la distancia de la comitiva. */
  function walkoutTargets() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      var rank = tunnelRank(s, i);
      /* El capitán (rank 0) queda delante, en el extremo de la fila más
       * cercano al círculo central; la velocidad es común para no romper la
       * formación. */
      setTarget(a, TUNNEL_X + (s ? 1.05 : -1.05), 20 - rank * 0.72,
        7.1, false, 0);
    }
  }

  function faceTo(a, x, z) {
    if (!a) return;
    var dx = x - a.x, dz = z - a.z;
    if (dx * dx + dz * dz > 0.0001) a.facing = Math.atan2(dx, dz);
  }

  function setTarget(a, x, z, speed, lock, facing) {
    if (!a) return;
    a.tx = x; a.tz = z; a.maxSp = speed == null ? 6.8 * (a.pace || 1) : speed;
    a.faceLock = !!lock;
    if (facing != null) a.facing = facing;
  }

  function placeAtTunnel(a, side, slot, hide) {
    if (!a) return;
    var p = tunnelSpot(side, slot);
    a.x = a.tx = p.x; a.z = a.tz = p.z;
    a.vx = a.vz = 0; a.maxSp = 0; a.faceLock = false; a.anim = null; a.visualAnim = null;
    a.passTarget = null;
    /* La cola queda dentro del túnel y se va destapando al cruzar la boca. */
    a.hidden = !!hide || p.z < -4.9;
    a.runPhase = Math.random() * TAU;
  }

  function baseTargets(speed, clearAnim) {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      a.hidden = false;
      if (clearAnim) { a.anim = null; a.visualAnim = null; }
      setTarget(a, a.baseX, a.baseZ, (speed || 6.8) * (a.pace || 1), false);
    }
  }

  function officialTargets(speed) {
    var ref = sim.officials[0], ar1 = sim.officials[1], ar2 = sim.officials[2];
    if (ref) { ref.hidden = false; setTarget(ref, LEN / 2, MIDZ + 2.4, speed || 6.4, false); }
    if (ar1) { ar1.hidden = false; setTarget(ar1, LEN / 2, ar1.bandZ == null ? -1.1 : ar1.bandZ, speed || 6.2, false); }
    if (ar2) { ar2.hidden = false; setTarget(ar2, LEN / 2, ar2.bandZ == null ? WID + 1.1 : ar2.bandZ, speed || 6.2, false); }
  }

  function placeOfficialsAtBands(hide) {
    if (!sim.officials.length) initOfficials();
    for (var i = 0; i < sim.officials.length; i++) {
      var o = sim.officials[i];
      o.x = o.tx = LEN / 2;
      o.z = o.tz = o.official === "ref" ? MIDZ : (o.bandZ == null ? (o.official === "ar1" ? -1.1 : WID + 1.1) : o.bandZ);
      o.vx = o.vz = 0; o.maxSp = 0; o.hidden = !!hide; o.anim = null; o.faceLock = false;
      o.facing = o.official === "ar1" ? -PI / 2 : o.official === "ar2" ? PI / 2 : PI;
    }
  }

  function officialsToTunnel(hide) {
    for (var i = 0; i < sim.officials.length; i++) {
      var o = sim.officials[i];
      o.x = o.tx = TUNNEL_X + (i - 1) * 0.8;
      o.z = o.tz = TUNNEL_Z + 0.15 * i;
      o.vx = o.vz = 0; o.maxSp = 0; o.hidden = !!hide; o.anim = null; o.faceLock = false;
    }
  }

  function clearOfficialGestures() {
    for (var i = 0; i < sim.officials.length; i++) {
      var o = sim.officials[i];
      o.anim = null; o.visualAnim = null; o.faceLock = false;
    }
  }

  function beginCinema(type) {
    /* Si el usuario había pausado, la secuencia debe poder verse; el deseo de
     * congelar se aplica de nuevo al terminar. */
    frozen = false;
    sim.cinema = {type: type, stage: "", stageT: 0, t: 0, switched: false, fieldFlipped: false,
      greet: false, lineGreeted: false, coin: null};
  }

  function setCinemaStage(name) {
    var c = sim.cinema; if (!c) return;
    c.stage = name; c.stageT = 0; c.greet = false; c.lineGreeted = false;
    if (c.type === "intro") {
      if (name === "walkout") {
        walkoutTargets(); officialTargets(6.6);
      } else if (name === "greet") {
        baseTargets(5.6, false); officialTargets(5.6);
        var c0 = captainOf(0), c1 = captainOf(1);
        /* Los capitanes salen al frente de la fila y aprovechan el saludo para
         * llegar al círculo central antes del sorteo. */
        if (c0) { setTarget(c0, LEN / 2 - 1.1, MIDZ, 7.2, true, PI / 2); c0.anim = {type: "greet", t: 0, dur: 1.45, hand: true}; }
        if (c1) { setTarget(c1, LEN / 2 + 1.1, MIDZ, 7.2, true, -PI / 2); c1.anim = {type: "greet", t: 0, dur: 1.45, hand: true}; }
        for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
          var a = actorAt(s, i);
          if (!a || a === c0 || a === c1) continue;
          a.anim = {type: "greet", t: -0.45 * (i % 3), dur: 1.25, hand: false};
        }
        var ref = sim.officials[0];
        if (ref) { setTarget(ref, LEN / 2, MIDZ + 1.4, 4.5, true, PI); ref.anim = {type: "greet", t: 0, dur: 1.2, hand: false}; }
      } else if (name === "coinCall") {
        c.coin.show = true; c.coin.waitT = 0; c.coin.angle = 0;
        var ca = captainOf(0), cb = captainOf(1), rf = sim.officials[0];
        if (ca) setTarget(ca, LEN / 2 - 1.0, MIDZ, 3.2, true, PI / 2);
        if (cb) setTarget(cb, LEN / 2 + 1.0, MIDZ, 3.2, true, -PI / 2);
        if (rf) setTarget(rf, LEN / 2, MIDZ + 1.3, 3.0, true, PI);
        c.coin.face = null; c.coin.call = null; c.coin.winner = null; c.coin.choice = null;
      } else if (name === "coinFlip" || name === "coinResult" || name === "choose" || name === "rivalChoice" || name === "choiceResult") {
        c.coin.show = true;
        if (name === "choose" || name === "rivalChoice" || name === "choiceResult") c.coin.angle = 0;
        if (name === "choose" || name === "rivalChoice") c.coin.waitT = 0;
      } else if (name === "lineup") {
        c.coin.show = false;
        baseTargets(7.0, true); officialTargets(6.4);
      }
    } else if (c.type === "half") {
      if (name === "off") {
        for (var hs = 0; hs < 2; hs++) for (var hi = 0; hi < 11; hi++) {
          var ha = actorAt(hs, hi);
          if (!ha) continue;
          ha.hidden = false; ha.faceLock = false; ha.anim = null; ha.visualAnim = null;
          var hp = tunnelSpot(hs, hi);
          setTarget(ha, hp.x, hp.z, 6.6 * (ha.pace || 1), false);
        }
        officialsToTunnel(false);
      } else if (name === "switch") {
        /* Los jugadores quedan dentro del túnel mientras se cambia de lado. */
        for (var ss = 0; ss < 2; ss++) for (var si = 0; si < 11; si++) {
          var sa = actorAt(ss, si);
          if (sa) {
            sa.hidden = true; sa.anim = null; sa.visualAnim = null;
            sa.tx = sa.x; sa.tz = sa.z; sa.maxSp = 0; sa.vx = sa.vz = 0;
          }
        }
        placeOfficialsAtBands(true);
      } else if (name === "enter") {
        baseTargets(7.0, true); officialTargets(6.4);
      } else if (name === "greetHalf") {
        baseTargets(5.4, false); officialTargets(5.6);
        var hc0 = captainOf(0), hc1 = captainOf(1);
        if (hc0) { setTarget(hc0, LEN / 2 - 1.1, MIDZ, 4.0, true, PI / 2); hc0.anim = {type: "greet", t: 0, dur: 1.3, hand: true}; }
        if (hc1) { setTarget(hc1, LEN / 2 + 1.1, MIDZ, 4.0, true, -PI / 2); hc1.anim = {type: "greet", t: 0, dur: 1.3, hand: true}; }
        var hr = sim.officials[0];
        if (hr) { setTarget(hr, LEN / 2, MIDZ + 1.4, 4.5, true, PI); hr.anim = {type: "greet", t: 0, dur: 1.2, hand: false}; }
      }
    } else if (c.type === "end") {
      if (name === "whistle") {
        for (var es = 0; es < 2; es++) for (var ei = 0; ei < 11; ei++) {
          var ea = actorAt(es, ei); if (!ea) continue;
          ea.hidden = false; ea.faceLock = false; ea.visualAnim = null;
          setTarget(ea, ea.x, ea.z, 0, false);
          if (sim.score[es] > sim.score[1 - es] && ei < 6) ea.anim = {type: "celebrate", t: 0, dur: 1.15};
          else if (ei < 3) ea.anim = {type: "greet", t: 0, dur: 1.0, hand: false};
          else ea.anim = null;
        }
        officialsToTunnel(false);
      } else if (name === "line") {
        for (var ls = 0; ls < 2; ls++) for (var li = 0; li < 11; li++) {
          var la = actorAt(ls, li); if (!la) continue;
          la.hidden = false; la.anim = null; la.visualAnim = null;
          la.faceLock = false;
          setTarget(la, LEN / 2 + (ls ? 1.8 : -1.8), 8 + li * 4.5, 6.2 * (la.pace || 1), false);
          la.facing = ls ? -PI / 2 : PI / 2;
        }
        var lr = sim.officials[0];
        if (lr) { lr.hidden = false; setTarget(lr, LEN / 2, MIDZ + 4, 5.0, false); }
      } else if (name === "walkoff") {
        for (var ws = 0; ws < 2; ws++) for (var wi = 0; wi < 11; wi++) {
          var wa = actorAt(ws, wi); if (!wa) continue;
          wa.hidden = false; wa.anim = null; wa.visualAnim = null; wa.faceLock = false;
          var wp = tunnelSpot(ws, wi);
          setTarget(wa, wp.x, wp.z - 1.0, 6.3 * (wa.pace || 1), false);
        }
        officialsToTunnel(false);
      }
    }
    updateCoinOverlay();
  }

  function startIntro() {
    sim.started = true; sim.ended = false; sim.action = null; sim.queue = []; sim.restart = null;
    sim.pendingPass = null; sim.pendingOwn = null; sim.ballHidden = true;
    beginCinema("intro");
    sim.cinema.coin = {show: false, call: null, face: null, winner: null, choice: null,
      angle: 0, waitT: 0};
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (a) placeAtTunnel(a, s, i, false);
    }
    placeOfficialsAtBands(false);
    cam.cutT = 0; cam.cutMode = "";
    setCinemaStage("walkout");
  }

  function startHalfCinema() {
    beginCinema("half");
    sim.half = 2; sim.ended = false; sim.ballHidden = true;
    sim.action = null; sim.queue = []; sim.restart = null; sim.pendingPass = null; sim.pendingOwn = null;
    var b = sim.ball; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null; b.vx = b.vy = b.vz = 0;
    cam.cutT = 0; cam.cutMode = "";
    setCinemaStage("off");
  }

  function startEndCinema() {
    beginCinema("end");
    sim.ended = true; sim.ballHidden = true;
    sim.action = null; sim.queue = []; sim.restart = null; sim.pendingPass = null; sim.pendingOwn = null;
    var b = sim.ball; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null; b.vx = b.vy = b.vz = 0;
    cam.cutT = 0; cam.cutMode = "";
    setCinemaStage("whistle");
  }

  function switchHalfSides() {
    var c = sim.cinema; if (!c || c.switched) return;
    c.switched = true;
    sim.attack[0] = -sim.attack[0]; sim.attack[1] = -sim.attack[1];
    mirrorTeam(0); mirrorTeam(1); mirrorOfficials();
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      a.baseX = worldBaseX(s, a.nx); a.baseZ = a.nz * WID;
      placeAtTunnel(a, s, i, true);
    }
    placeOfficialsAtBands(true);
    var b = sim.ball; b.x = LEN / 2; b.z = MIDZ; b.y = 0.22; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null;
    b.vx = b.vy = b.vz = 0; b.side = 0; b.idx = -1; b.lastTouch = 0;
    cam.x = LEN / 2; cam.z = MIDZ;
  }

  function applyCoinChoice() {
    var c = sim.cinema; if (!c || c.type !== "intro" || c.fieldFlipped) return;
    var choice = c.coin && c.coin.choice;
    if (choice !== "campo") return;
    c.fieldFlipped = true;
    sim.attack[0] = -1; sim.attack[1] = 1;
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      a.baseX = worldBaseX(s, a.nx); a.baseZ = a.nz * WID;
      if (!a.hidden) { a.tx = a.baseX; a.tz = a.baseZ; }
    }
  }

  function finishCinema() {
    var c = sim.cinema; if (!c) return;
    var fw = freezeWanted;
    if (c.type === "intro") {
      applyCoinChoice();
      var side = sim.kickoffSide === 1 ? 1 : 0;
      sim.cinema = null; hideCoinOverlay(); sim.ballHidden = false;
      clearOfficialGestures();
      for (var oi = 0; oi < sim.officials.length; oi++) sim.officials[oi].hidden = false;
      officialTargets(6.8);
      setupKickoff(side);
    } else if (c.type === "half") {
      if (!c.switched) switchHalfSides();
      var next = 1 - sim.kickoffSide;
      sim.cinema = null; hideCoinOverlay(); sim.ballHidden = false;
      sim.koSet = true;
      clearOfficialGestures();
      for (var oj = 0; oj < sim.officials.length; oj++) sim.officials[oj].hidden = false;
      officialTargets(6.8);
      setupKickoff(next);
    } else {
      sim.cinema = null; hideCoinOverlay(); sim.ballHidden = true; sim.ended = true;
      for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
        var a = actorAt(s, i); if (a) { a.hidden = true; a.anim = null; a.visualAnim = null; }
      }
      clearOfficialGestures();
      for (var oi = 0; oi < sim.officials.length; oi++) sim.officials[oi].hidden = true;
    }
    frozen = fw;
    if (!frozen) { lastTs = 0; acc = 0; }
  }

  function skipCinema() {
    var c = sim.cinema; if (!c) return false;
    if (c.type === "intro" && c.coin && c.coin.choice == null) c.coin.choice = "pelota";
    if (c.type === "half" && !c.switched) switchHalfSides();
    finishCinema();
    return true;
  }

  function coinCall(v) {
    var c = sim.cinema;
    if (!c || c.type !== "intro" || c.stage !== "coinCall" || (v !== "cara" && v !== "cruz")) return false;
    if (c.coin.call != null) return false;
    c.coin.call = v;
    c.coin.face = Math.random() < 0.5 ? "cara" : "cruz";
    c.coin.winner = c.coin.face === c.coin.call ? 0 : 1;
    setCinemaStage("coinFlip");
    return true;
  }

  function coinChoice(v) {
    var c = sim.cinema;
    if (!c || c.type !== "intro" || c.stage !== "choose" || (v !== "campo" && v !== "pelota")) return false;
    if (c.coin.choice != null) return false;
    c.coin.choice = v;
    setCinemaStage("choiceResult");
    if (v === "campo") applyCoinChoice();
    return true;
  }

  function resolveCoin() {
    var c = sim.cinema; if (!c || !c.coin) return;
    setCinemaStage("coinResult");
  }

  function updateCinema(dt) {
    var c = sim.cinema; if (!c) return;
    c.t += dt; c.stageT += dt;
    if (c.coin) {
      c.coin.angle += dt * (c.stage === "coinFlip" ? 17 : 1.1);
      if (c.stage === "coinCall") {
        c.coin.waitT += dt;
        if (c.coin.waitT >= COIN_WAIT) coinCall(Math.random() < 0.5 ? "cara" : "cruz");
      }
      if (c.stage === "coinCall" || c.stage === "choose") updateCoinTimer();
    }
    if (c.type === "intro") {
      if (c.stage === "walkout" && c.stageT >= INTRO_WALK) setCinemaStage("greet");
      else if (c.stage === "greet" && c.stageT >= INTRO_GREET) setCinemaStage("coinCall");
      else if (c.stage === "coinFlip" && c.stageT >= COIN_FLIP) resolveCoin();
      else if (c.stage === "coinResult" && c.stageT >= COIN_RESULT) {
        if (c.coin.winner === 0) setCinemaStage("choose");
        else {
          var plan = chooseRivalToss();
          c.coin.choice = plan.choice; c.coin.rivalWhy = plan.why;
          setCinemaStage("rivalChoice");
        }
      } else if (c.stage === "choose") {
        c.coin.waitT = (c.coin.waitT || 0) + dt;
        if (c.coin.choice == null && c.coin.waitT >= CHOICE_WAIT) coinChoice(Math.random() < 0.5 ? "campo" : "pelota");
      } else if (c.stage === "rivalChoice" && c.stageT >= RIVAL_WAIT) {
        setCinemaStage("choiceResult");
        applyCoinChoice();
      } else if (c.stage === "choiceResult" && c.stageT >= COIN_RESULT) setCinemaStage("lineup");
      else if (c.stage === "lineup" && c.stageT >= INTRO_LINEUP) finishCinema();
    } else if (c.type === "half") {
      if (c.stage === "off" && c.stageT >= HALF_OFF) { switchHalfSides(); setCinemaStage("switch"); }
      else if (c.stage === "switch" && c.stageT >= HALF_SWITCH) setCinemaStage("enter");
      else if (c.stage === "enter" && c.stageT >= HALF_ENTER) setCinemaStage("greetHalf");
      else if (c.stage === "greetHalf" && c.stageT >= HALF_GREET) finishCinema();
    } else if (c.type === "end") {
      if (c.stage === "whistle" && c.stageT >= END_WHISTLE) setCinemaStage("line");
      else if (c.stage === "line") {
        if (!c.lineGreeted && c.stageT >= 1.65) {
          c.lineGreeted = true;
          for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
            var a = actorAt(s, i);
            if (a) a.anim = {type: "greet", t: -0.09 * i, dur: 1.1, hand: true};
          }
        }
        if (c.stageT >= END_LINE) setCinemaStage("walkoff");
      } else if (c.stage === "walkoff" && c.stageT >= END_WALKOFF) finishCinema();
    }
    moveCinemaActors(dt);
    updateAnimations(dt);
  }

  function moveCinemaActors(dt) {
    var lists = [sim.players[0] || [], sim.players[1] || [], sim.officials || []];
    for (var l = 0; l < lists.length; l++) {
      var list = lists[l];
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        if (!a || a.gone || a.sentOff) continue;
        var dx = a.tx - a.x, dz = a.tz - a.z, d = Math.sqrt(dx * dx + dz * dz);
        var want = Math.min(a.maxSp || 6, d * 3.4), dvx = 0, dvz = 0;
        if (d > 0.001) { dvx = dx / d * want - a.vx; dvz = dz / d * want - a.vz; }
        var lim = 17 * dt, ll = Math.sqrt(dvx * dvx + dvz * dvz);
        if (ll > lim) { dvx = dvx / ll * lim; dvz = dvz / ll * lim; }
        a.vx += dvx; a.vz += dvz;
        a.x += a.vx * dt; a.z += a.vz * dt;
        if (a.x < -2) a.x = -2; else if (a.x > LEN + 2) a.x = LEN + 2;
        /* La fila puede tener varios metros de cola dentro del túnel. */
        if (a.z < -12.5) a.z = -12.5; else if (a.z > WID + 2) a.z = WID + 2;
        if (a.z < -4.9) a.hidden = true;
        else if (a.maxSp > 0.01) a.hidden = false;
        var sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
        if (sp > 0.35 && !a.faceLock) a.facing = angleTo(a.facing, Math.atan2(a.vx, a.vz), Math.min(1, dt * 8));
        a.runPhase += sp * dt * 2.3;
        a.lean = lerp(a.lean || 0, 0, Math.min(1, dt * 6));
        a.bank = lerp(a.bank || 0, 0, Math.min(1, dt * 6));
      }
    }
  }

  /* La cámara de las secuencias evita seguir el balón mientras está oculto. */
  function cinemaShot() {
    var c = sim.cinema; if (!c) return null;
    if (c.type === "intro") {
      if (c.stage === "walkout") return c.stageT < 1.35
        ? {x: LEN / 2, z: 8, back: 2.5, height: 5.2, lookX: LEN / 2, lookZ: -3.2}
        : {x: LEN / 2, z: 34, back: 33, height: 20, lookX: LEN / 2, lookZ: MIDZ};
      if (c.stage === "greet" || c.stage === "coinCall" || c.stage === "coinFlip" ||
        c.stage === "coinResult" || c.stage === "choose" || c.stage === "rivalChoice" || c.stage === "choiceResult")
        return {x: LEN / 2, z: 30, back: 10.5, height: 8.2, lookX: LEN / 2, lookZ: MIDZ};
      if (c.stage === "lineup") return {x: LEN / 2, z: 34, back: 31, height: 19, lookX: LEN / 2, lookZ: MIDZ};
    } else if (c.type === "half") {
      if (c.stage === "off") return c.stageT < 1.5
        ? {x: LEN / 2, z: 34, back: 33, height: 20, lookX: LEN / 2, lookZ: MIDZ}
        : {x: LEN / 2, z: 8, back: 2.5, height: 5.2, lookX: LEN / 2, lookZ: -3.2};
      if (c.stage === "switch") return {x: LEN / 2, z: 8, back: 2.5, height: 5.2, lookX: LEN / 2, lookZ: -3.2};
      if (c.stage === "enter") return c.stageT < 1.3
        ? {x: LEN / 2, z: 8, back: 2.5, height: 5.2, lookX: LEN / 2, lookZ: -3.2}
        : {x: LEN / 2, z: 34, back: 32, height: 19, lookX: LEN / 2, lookZ: MIDZ};
      if (c.stage === "greetHalf") return {x: LEN / 2, z: 30, back: 10.5, height: 8.2, lookX: LEN / 2, lookZ: MIDZ};
    } else if (c.type === "end") {
      if (c.stage === "whistle") return {x: LEN / 2, z: 34, back: 33, height: 20, lookX: LEN / 2, lookZ: MIDZ};
      if (c.stage === "line") return {x: LEN / 2, z: 32, back: 15, height: 10, lookX: LEN / 2, lookZ: MIDZ};
      if (c.stage === "walkoff") return {x: LEN / 2, z: 12, back: 8, height: 6, lookX: LEN / 2, lookZ: -2};
    }
    return {x: LEN / 2, z: 34, back: 33, height: 20, lookX: LEN / 2, lookZ: MIDZ};
  }

  function updateCinemaCamera(dt) {
    var sh = cinemaShot(); if (!sh) return;
    var k = 1 - Math.exp(-dt * 2.4);
    cam.x += (sh.x - cam.x) * k;
    cam.z += (sh.z - cam.z) * k;
    cam.back += (sh.back - cam.back) * k;
    cam.height += (sh.height - cam.height) * k;
    cam.lookX += (sh.lookX - cam.lookX) * k;
    cam.lookZ += (sh.lookZ - cam.lookZ) * k;
    cam.shake = 0;
  }

  function updateOfficials(dt) {
    if (!sim.officials.length) initOfficials();
    var b = sim.ball;
    var cardAct = sim.action && sim.action.type === "card" && sim.action.stage !== "foul" ? sim.action : null;
    for (var i = 0; i < sim.officials.length; i++) {
      var o = sim.officials[i], tx, tz, maxSp;
      var cardRef = cardAct && cardAct.ref === o;
      if (o.official === "ref" && cardRef) {
        /* La tarjeta manda sobre el seguimiento normal del balón. */
        tx = cardAct.refX == null ? o.x : cardAct.refX;
        tz = cardAct.refZ == null ? o.z : cardAct.refZ;
        maxSp = cardAct.stage === "show" ? 4.4 : 8.6;
      } else if (o.official === "ref") {
        /* El árbitro acompaña la jugada por el lado contrario al balón. */
        tx = clamp(b.x - sim.attack[0] * 1.2, 6, LEN - 6);
        tz = clamp(b.z + (b.z < MIDZ ? 6.5 : -6.5), 8, WID - 8);
        maxSp = 7.4;
      } else {
        /* Los asistentes recorren su banda siguiendo la línea de juego. */
        tx = clamp(b.x, 4, LEN - 4);
        tz = o.bandZ == null ? (o.official === "ar1" ? -1.1 : WID + 1.1) : o.bandZ;
        maxSp = 8.1;
      }
      var dx = tx - o.x, dz = tz - o.z, d = Math.sqrt(dx * dx + dz * dz);
      var want = Math.min(maxSp, d * 3.0), dvx = 0, dvz = 0;
      if (d > 0.01) { dvx = dx / d * want - o.vx; dvz = dz / d * want - o.vz; }
      var lim = 18 * dt, l = Math.sqrt(dvx * dvx + dvz * dvz);
      if (l > lim) { dvx = dvx / l * lim; dvz = dvz / l * lim; }
      o.vx += dvx; o.vz += dvz;
      o.x += o.vx * dt; o.z += o.vz * dt;
      var sp = Math.sqrt(o.vx * o.vx + o.vz * o.vz);
      if (cardRef && cardAct.stage === "show" && cardAct.player) {
        o.facing = angleTo(o.facing, Math.atan2(cardAct.player.x - o.x, cardAct.player.z - o.z),
          Math.min(1, dt * 10));
      } else if (sp > 0.35) o.facing = angleTo(o.facing, Math.atan2(o.vx, o.vz), Math.min(1, dt * 8));
      else {
        var bx = b.x - o.x, bz = b.z - o.z;
        if (bx * bx + bz * bz > 0.09) o.facing = angleTo(o.facing, Math.atan2(bx, bz), Math.min(1, dt * 2.4));
      }
      o.runPhase += sp * dt * 2.3;
      o.lean = clamp((sp - 4.5) * 0.006, 0, 0.03);
      o.bank = 0;
    }
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
      a.gk = a.pos === "POR"; setActorVariant(a); a.ovr = p.ovr == null ? 70 : +p.ovr;
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

  /* Distancia al rival más cercano. Se usa para comprobar que nadie invade
   * el saque de puerta; no mueve a nadie ni altera la jugada. */
  function nearestOpponentDist(side, x, z) {
    var list = listOf(1 - side), best = 1e9;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (!q || q.gone || q.sentOff) continue;
      var d = dist(q.x, q.z, x, z);
      if (d < best) best = d;
    }
    return best;
  }

  function insidePenaltyArea(side, x, z, pad) {
    var own = ownX(side), dir = sim.attack[side], depth = (x - own) * dir, p = pad || 0;
    return depth >= -p && depth < PEN_DEPTH + p && Math.abs(z - MIDZ) < PEN_HALF + p;
  }

  /* Los rivales esperan fuera del área y a una distancia mínima del portero.
   * No se teletransportan al jugador con balón: solo se corrige a quien invade
   * la zona o queda demasiado cerca antes del saque. */
  function placeGoalKickOpponents(side, gk) {
    var dir = sim.attack[side], own = ownX(side), lineX = clamp(own + dir * (PEN_DEPTH + 1.7), 3, LEN - 3);
    var list = listOf(1 - side), moved = 0, n = 0;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (!q || q.gk) continue;
      var inside = insidePenaltyArea(side, q.x, q.z, 0.45);
      var d = gk ? dist(q.x, q.z, gk.x, gk.z) : 99;
      if (inside || d < GK_SAFE_DIST + 1.2) {
        var z = clamp(q.z, 5, WID - 5);
        var tx = clamp(lineX + dir * Math.floor(n / 5) * 1.4, 3, LEN - 3);
        q.x = q.tx = tx; q.z = q.tz = z; q.vx = q.vz = 0;
        q.facing = sim.attack[1 - side] > 0 ? PI / 2 : -PI / 2;
        q.maxSp = 0;
        moved++;
      } else {
        /* Congelado durante la preparación para que su carrera no le meta
         * en el área mientras el portero aún no ha golpeado. */
        q.tx = q.x; q.tz = q.z; q.vx = q.vz = 0;
        q.maxSp = 0;
      }
      n++;
    }
    /* Segunda pasada: si por una banda la distancia al portero sigue siendo
     * corta, se separa radialmente y se vuelve a comprobar el área. */
    if (gk) {
      for (var j = 0; j < list.length; j++) {
        var r = list[j];
        if (!r || r.gk) continue;
        var dr = dist(r.x, r.z, gk.x, gk.z);
        if (dr >= GK_SAFE_DIST) continue;
        var ang = Math.atan2(r.z - gk.z, r.x - gk.x);
        if (!isFinite(ang)) ang = dir > 0 ? 0 : PI;
        var sx = gk.x + Math.cos(ang) * GK_SAFE_DIST, sz = gk.z + Math.sin(ang) * GK_SAFE_DIST;
        if (insidePenaltyArea(side, sx, sz, 0.45)) { sx = lineX; sz = clamp(sz, 5, WID - 5); }
        r.x = r.tx = clamp(sx, 3, LEN - 3); r.z = r.tz = sz;
        r.vx = r.vz = 0; r.maxSp = 0;
      }
    }
    return goalKickSpaceStats(side, gk, moved);
  }

  function goalKickSpaceStats(side, gk, moved) {
    var owner = gk || pickKeeper(side), list = listOf(1 - side);
    var inside = 0, minD = 1e9;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (!q || q.gk) continue;
      if (insidePenaltyArea(side, q.x, q.z, 0.02)) inside++;
      if (owner) minD = Math.min(minD, dist(q.x, q.z, owner.x, owner.z));
    }
    return {outside: inside === 0, inside: inside, minDist: minD === 1e9 ? 99 : minD,
      moved: moved || 0, safeDist: GK_SAFE_DIST};
  }

  /* Línea del último defensor de un equipo (x), para el fuera de juego visual. */
  function lastDefLine(side) {
    var dir = sim.attack[side], list = listOf(side), best = null;
    for (var i = 0; i < list.length; i++) {
      var a = list[i]; if (!a || a.gone || a.gk) continue;
      if (best == null || a.x * dir < best * dir) best = a.x;
    }
    return best == null ? ownX(side) + dir * 16 : best;
  }
  function aiTick() {
    var b = sim.ball, carrier = b.mode === "held" ? actorAt(b.side, b.idx) : null;
    var owner = b.mode === "held" ? b.side : (b.lastTouch != null ? b.lastTouch : sim.own);
    var defLines = [lastDefLine(0), lastDefLine(1)];
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
        /* Recepción de un pase visual: el receptor ataca el punto de caída
           durante la maniobra y luego vuelve a la disciplina táctica. */
        if (a.passTarget) {
          if (sim.time < a.passTarget.until) {
            a.tx = clamp(a.passTarget.x, 1, LEN - 1);
            a.tz = clamp(a.passTarget.z, 1.5, WID - 1.5);
            a.maxSp = 7.8 * a.pace;
            continue;
          }
          a.passTarget = null;
        }
        var tx, tz, maxSp = 6.4 * a.pace;
        if (a.gk) {
          /* Portero: en la bisectriz del ángulo de tiro (línea centro de
           * portería → balón), más adelantado cuanto más lejos está el balón y
           * de líbero si su equipo ataca en campo contrario. */
          var own = ownX(side), bdx = (b.x - own) * dir, bdz = b.z - MIDZ, bd = Math.sqrt(bdx * bdx + bdz * bdz) || 1;
          var depth = clamp(1.4 + bd * 0.07, 1.2, 5.5);
          if (bdx > 52 && !defending) depth = clamp(bdx * 0.22, 6, 16);
          var gxk = own + dir * Math.max(0.8, bdx / bd * depth), gzk = MIDZ + bdz / bd * depth;
          a.tx = clamp(gxk, 0.8, LEN - 0.8);
          a.tz = clamp(gzk, MIDZ - POST - (depth > 6 ? 6 : 0.2), MIDZ + POST + (depth > 6 ? 6 : 0.2));
          a.maxSp = 5.4;
          continue;
        }
        tx = a.baseX + dir * ((prog - 0.5) * (defending ? 5 : 8));
        tz = MIDZ + (a.baseZ - MIDZ) * (defending ? wScale * 0.86 : wScale) + shiftZ;
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
        /* Fuera de juego: sin balón, el atacante no se queda por delante del
         * último defensor rival (salvo en jugada a balón parado). */
        if (!defending && a !== carrier && !sim.restart && b.mode !== "flight") {
          var off = defLines[1 - side], ahead = Math.max(off * dir, b.x * dir);
          if (tx * dir > ahead - 0.4) tx = (ahead - 0.4) * dir;
        }
        if (sim.action && sim.action.shooter === a && sim.action.stage !== "outcome") { tx = sim.action.originX; tz = sim.action.originZ; maxSp = 7.5; }
        a.tx = clamp(tx, 1, LEN - 1); a.tz = clamp(tz, 1.5, WID - 1.5); a.maxSp = maxSp;
      }
      /* Línea defensiva: los defensores que no persiguen el balón ni marcan de
       * cerca forman una línea común (la más retrasada de sus posiciones) y el
       * bloque no se estira más de ~34 m entre defensas y delanteros. */
      if (defending && !sim.restart) {
        var backs = [], deepest = null, front = null;
        for (var bi = 0; bi < list.length; bi++) {
          var d0 = list[bi]; if (d0.gone || d0.gk || d0.passTarget) continue;
          if (isDef(d0.pos) && d0 !== nearest && d0 !== second) { backs.push(d0); if (deepest == null || d0.tx * dir < deepest * dir) deepest = d0.tx; }
          if (front == null || d0.tx * dir > front * dir) front = d0.tx;
        }
        if (backs.length >= 2) for (bi = 0; bi < backs.length; bi++) backs[bi].tx = lerp(backs[bi].tx, deepest, 0.7);
        if (deepest != null) for (bi = 0; bi < list.length; bi++) {
          var f0 = list[bi]; if (f0.gone || f0.gk || f0 === nearest || f0.passTarget) continue;
          if ((f0.tx - deepest) * dir > 34) f0.tx = deepest + dir * 34;
        }
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
          a.vx = 0; a.vz = 0; a.lean = 0; a.bank = 0; continue;
        }
        var pvx = a.vx, pvz = a.vz, pf = a.facing;
        var dx = a.tx - a.x, dz = a.tz - a.z, d = Math.sqrt(dx * dx + dz * dz);
        /* Llegada natural: frena a tiempo (v = √(2·a·d)) en vez de ir a tope y clavarse. */
        var want = Math.min(a.maxSp || 6, Math.sqrt(2 * 9 * d), d * 6);
        var dvx = 0, dvz = 0;
        if (d > 0.001) { dvx = dx / d * want - a.vx; dvz = dz / d * want - a.vz; }
        /* Aceleración realista: arrancar cuesta más cuanto más rápido vas,
         * frenar es más rápido que acelerar y girar en carrera abre la curva. */
        var cur = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
        if (cur > 0.2) {
          var ux = a.vx / cur, uz = a.vz / cur, par = dvx * ux + dvz * uz, px = dvx - ux * par, pz = dvz - uz * par;
          var accMax = (par > 0 ? 10.5 * (1 - 0.55 * clamp(cur / ((a.maxSp || 6) + 0.01), 0, 1)) + 2.5 : 15) * dt;
          var latMax = 15 / (1 + cur * 0.16) * dt;
          if (Math.abs(par) > accMax) par = par > 0 ? accMax : -accMax;
          var pl = Math.sqrt(px * px + pz * pz);
          if (pl > latMax) { px = px / pl * latMax; pz = pz / pl * latMax; }
          dvx = ux * par + px; dvz = uz * par + pz;
        } else {
          var lim = 12 * dt, l = Math.sqrt(dvx * dvx + dvz * dvz);
          if (l > lim) { dvx = dvx / l * lim; dvz = dvz / l * lim; }
        }
        a.vx += dvx; a.vz += dvz;
        a.x = clamp(a.x + a.vx * dt, 1, LEN - 1);
        a.z = clamp(a.z + a.vz * dt, 1.5, WID - 1.5);
        var sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
        if (sp > 0.35 && !a.faceLock) a.facing = angleTo(a.facing, Math.atan2(a.vx, a.vz), Math.min(1, dt * 8));
        else if (sp <= 0.35 && !a.faceLock && !a.anim) {
          /* Cuando se detiene, mira al balón en vez de quedarse clavado en la
           * última dirección de carrera. */
          var bx = sim.ball.x - a.x, bz = sim.ball.z - a.z;
          if (bx * bx + bz * bz > 0.09) a.facing = angleTo(a.facing, Math.atan2(bx, bz), Math.min(1, dt * 2.4));
        }
        a.runPhase += sp * dt * 2.3;
        /* Inclinación de carrera: el cuerpo acompaña la aceleración y el giro.
         * Es una deformación cosmética; no altera posición, balón ni marcador. */
        var safeDt = Math.max(0.0001, dt), turn = wrapA(a.facing - pf) / safeDt;
        var accF = ((a.vx - pvx) * Math.sin(a.facing) + (a.vz - pvz) * Math.cos(a.facing)) / safeDt;
        var wantLean = clamp(accF * 0.0045, -0.065, 0.065);
        var wantBank = clamp(turn * sp * 0.0032, -0.05, 0.05);
        if (a.faceLock || a.anim || sp < 0.4) { wantLean = 0; wantBank = 0; }
        var lk = Math.min(1, dt * 6);
        a.lean = lerp(a.lean || 0, wantLean, lk);
        a.bank = lerp(a.bank || 0, wantBank, lk);
      }
    }
  }

  function stepActorAnimation(a, dt, card) {
    if (!a || !a.anim) return;
    if ((a.gone || a.sentOff) && !card) return;
    a.anim.t += dt;
    if (a.anim.t >= a.anim.dur) {
      /* al terminar la celebración sigue corriendo a su destino (sin saltos) */
      if (a.anim.type === "celebrate" && a.anim.tx != null) { a.tx = a.anim.tx; a.tz = a.anim.tz; }
      a.anim = null;
    }
  }

  function updateAnimations(dt) {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s] && sim.players[s][i];
      var card = sim.action && sim.action.type === "card" && sim.action.player === a;
      stepActorAnimation(a, dt, card);
    }
    /* Los oficiales también tienen gestos (saludo, pito). Sin este recorrido
     * el clip se quedaba congelado al terminar la secuencia. */
    for (var oi = 0; oi < sim.officials.length; oi++) stepActorAnimation(sim.officials[oi], dt, false);
  }

  /* ------------------------------------------------------------------ balón */

  function launchBall(tx, tz, ty, dur, arc, next, curve) {
    var b = sim.ball;
    b.fl = {x0: b.x, y0: b.y, z0: b.z, x1: tx, y1: ty, z1: tz, t: 0, dur: Math.max(0.08, dur),
      arc: arc || 0, curve: curve || 0};
    fxKick(b, tx, tz, dur, arc);
    b.mode = "flight"; b.next = next || null; b.timer = dur; b.vy = 0; b.claim = null;
    b.vx = (tx - b.x) / Math.max(0.08, dur); b.vz = (tz - b.z) / Math.max(0.08, dur);
    b.lastTouch = sim.own === 1 ? 1 : 0;
  }

  function releaseBall(vx, vz, vy) {
    var b = sim.ball;
    b.mode = "loose"; b.fl = null; b.next = null; b.claim = null;
    b.vx = vx || 0; b.vz = vz || 0; b.vy = vy || 0;
  }

  function giveTo(side, idx) {
    var a = actorAt(side, idx);
    if (!a) return false;
    var b = sim.ball;
    b.mode = "held"; b.side = side; b.idx = idx; b.fl = null; b.next = null; b.claim = null;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.lastTouch = side; sim.own = side;
    return true;
  }

  function spinBall(b, dt) {
    var r = BALL_R * BALL_SCALE;
    b.spinX = (b.spinX + b.vz / r * dt) % TAU;
    b.spinZ = (b.spinZ - b.vx / r * dt) % TAU;
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
      spinBall(b, dt);
      return;
    }
    if (b.mode === "flight" && b.fl) {
      var f = b.fl;
      f.t += dt;
      var k = clamp(f.t / f.dur, 0, 1);
      var dx = f.x1 - f.x0, dz = f.z1 - f.z0, dl = Math.sqrt(dx * dx + dz * dz) || 1;
      /* El enrosque se aplica en el eje perpendicular al recorrido y vuelve a
         cero en el destino: el balón nunca deja de ser continuo. */
      var bend = (f.curve || 0) * Math.sin(PI * k);
      /* Resistencia del aire / rozamiento: el balón sale rápido y llega más
       * lento (mismo punto y mismo instante de llegada que el motor). */
      var cd = f.drag == null ? (f.drag = clamp(dl / f.dur / 30, 0.25, 1.1)) : f.drag, kh = (1 - Math.exp(-cd * k)) / (1 - Math.exp(-cd));
      b.x = lerp(f.x0, f.x1, kh) - dz / dl * bend;
      b.z = lerp(f.z0, f.z1, kh) + dx / dl * bend;
      b.y = lerp(f.y0, f.y1, k) + f.arc * 4 * k * (1 - k);
      spinBall(b, dt);
      if (k >= 1) {
        b.mode = "loose"; b.fl = null; b.timer = 0;
        var endK = f.drag ? f.drag * Math.exp(-f.drag) / (1 - Math.exp(-f.drag)) : 1;
        b.vx = (f.x1 - f.x0) / f.dur * endK; b.vz = (f.z1 - f.z0) / f.dur * endK;
        var nx = b.next; b.next = null;
        if (nx && nx.type === "held") {
          var r = actorAt(nx.side, nx.idx);
          /* Solo se entrega en el pie si el receptor está realmente ahí. Si se
           * ha quedado atrás, el balón sigue suelto y él lo persigue: nunca se
           * teletransporta al jugador. */
          if (r && sim.lastPass && sim.lastPass.pending && sim.lastPass.to === nx.idx) {
            sim.lastPass.atEnd = +dist(b.x, b.z, r.x, r.z).toFixed(2);
            sim.lastPass.pending = false;
          }
          if (r && dist(b.x, b.z, r.x, r.z) <= 1.75) giveTo(nx.side, nx.idx);
          else if (r) {
            b.claim = {side: nx.side, idx: nx.idx, until: sim.time + 1.1};
            var cdx = r.x - b.x, cdz = r.z - b.z, cd = Math.sqrt(cdx * cdx + cdz * cdz) || 1;
            b.vx = cdx / cd * 4.2; b.vz = cdz / cd * 4.2;
            r.passTarget = {x: b.x, z: b.z, until: b.claim.until};
            r.maxSp = 7.8 * r.pace;
            b.lastTouch = nx.side;
          }
        }
      }
      return;
    }
    if (b.mode === "loose") {
      var wf = weatherFx(sim.wx);
      spinBall(b, dt);
      b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; b.vy -= GRAV * dt;
      if (b.y < 0.22) { b.y = 0.22; if (b.vy < -2.5) emitBurst(b.x, 0.02, b.z, 3 + Math.round(-b.vy), clamp(-b.vy / 12, 0, 0.6), b.vx, b.vz, 1.2); if (b.vy < 0) b.vy = -b.vy * wf.bounce; if (Math.abs(b.vy) < 0.6) b.vy = 0; }
      b.vx *= Math.pow(wf.friction, dt); b.vz *= Math.pow(wf.friction, dt);
      if (b.claim) {
        var ca = actorAt(b.claim.side, b.claim.idx);
        if (ca && dist(b.x, b.z, ca.x, ca.z) <= 1.25) { giveTo(b.claim.side, b.claim.idx); return; }
        if (!ca || sim.time > b.claim.until) b.claim = null;
      }
      if (b.x < -1 || b.x > LEN + 1 || b.z < -1 || b.z > WID + 1) outOfPlay();
    }
  }

  /* ------------------------------------------------------------------ saques */

  /* Reanudaciones sin teletransporte: la preparación calcula dónde debe
   * estar cada jugador y aquí se convierte en una carrera desde su posición
   * actual. El saque espera a que lleguen (máx. 4 s). El balón sí se recoloca:
   * ha salido del campo o viene de un gol y la cámara corta. */
  function smoothed(fn, kind) {
    return function () {
      var live = sim.started && !sim.cinema && !sim.ended && sim.time > 1.5;
      if (!live) return fn.apply(this, arguments);
      var before = [];
      for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) { var a0 = actorAt(s, i); before.push(a0 ? [a0.x, a0.z, a0.facing] : null); }
      var out = fn.apply(this, arguments), k = 0, maxT = 0;
      for (s = 0; s < 2; s++) for (i = 0; i < 11; i++, k++) {
        var a = actorAt(s, i), q = before[k];
        if (!a || !q || a.gone || a.sentOff) continue;
        var d = dist(q[0], q[1], a.x, a.z);
        if (d < 0.6) continue;
        var fx = a.x, fz = a.z;
        a.x = q[0]; a.z = q[1]; a.facing = q[2]; a.vx = a.vz = 0;
        a.tx = fx; a.tz = fz;
        var spd = 7.2 * (a.pace || 1);
        a.maxSp = Math.max(a.maxSp || 0, spd);
        a.regroup = {x: fx, z: fz, until: sim.time + 4.5};
        maxT = Math.max(maxT, d / spd);
      }
      var delay = clamp(maxT * 0.9, 0, 4);
      if (delay > 0.05) {
        if (sim.restart) sim.restart.t += delay;
        if (sim.action && sim.action.type === "goalkick") sim.action.t = -delay;
        if (kind === "kickoff" && sim.ball.mode === "held") { var bk = sim.ball; bk.mode = "dead"; bk.x = LEN / 2; bk.z = MIDZ; bk.side = -1; bk.idx = -1; }
      }
      return out;
    };
  }
  /* Mientras dura el reagrupamiento, el objetivo de cada jugador es su puesto. */
  function applyRegroup() {
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a || !a.regroup) continue;
      if (sim.time > a.regroup.until || dist(a.x, a.z, a.regroup.x, a.regroup.z) < 0.35) {
        if (dist(a.x, a.z, a.regroup.x, a.regroup.z) < 1.2) { a.x = a.regroup.x; a.z = a.regroup.z; }
        a.tx = a.regroup.x; a.tz = a.regroup.z; a.regroup = null; a.vx *= 0.3; a.vz *= 0.3;
        continue;
      }
      a.tx = a.regroup.x; a.tz = a.regroup.z; a.maxSp = Math.max(a.maxSp || 0, 7.2 * (a.pace || 1));
    }
  }

  function placeAtBase() {
    sim.pendingPass = null;
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = actorAt(s, i); if (!a) continue;
      a.x = a.tx = a.baseX; a.z = a.tz = a.baseZ; a.vx = a.vz = 0; a.anim = null; a.visualAnim = null;
      a.hidden = false; a.passTarget = null; a.faceLock = false; a.lean = 0; a.bank = 0;
      a.facing = sim.attack[s] > 0 ? PI / 2 : -PI / 2;
    }
  }

  function setupKickoff(side) {
    sim.action = null; sim.queue = []; sim.ended = false; sim.kickoffSide = side;
    placeAtBase();
    var b = sim.ball;
    b.x = LEN / 2; b.z = MIDZ; b.y = 0.22; b.vx = b.vy = b.vz = 0; b.fl = null; b.next = null; b.claim = null; b.mode = "dead";
    var c = nearestActor(side, LEN / 2, MIDZ, true);
    if (c) { c.x = LEN / 2 + (sim.attack[side] > 0 ? -0.9 : 0.9); c.z = MIDZ; c.facing = sim.attack[side] > 0 ? PI / 2 : -PI / 2; }
    sim.own = side;
    sim.restart = {type: "kickoff", side: side, idx: c ? c.slot : -1, t: 0.55};
    if (c) giveTo(side, c.slot);
  }

  function setupGoalKick(side) {
    sim.action = null; sim.restart = null; placeAtBase();
    var dir = sim.attack[side], own = ownX(side), b = sim.ball;
    var ballX = own + dir * 5.5, ballZ = MIDZ;
    b.x = ballX; b.z = ballZ; b.y = 0.22; b.vx = b.vy = b.vz = 0;
    b.mode = "dead"; b.fl = null; b.next = null; b.claim = null; b.side = side; b.idx = -1;
    sim.own = side;

    var gk = pickKeeper(side);
    if (gk) {
      gk.x = own + dir * 2.3; gk.z = ballZ; gk.tx = ballX - dir * 0.58; gk.tz = ballZ;
      gk.vx = gk.vz = 0; gk.faceLock = false; gk.maxSp = 5.4;
      gk.facing = dir > 0 ? PI / 2 : -PI / 2;
    }

    /* Los rivales esperan fuera del área y lejos del portero. Se coloca antes
     * de mover a los receptores para que la IA no pueda invadir la zona. */
    var space = placeGoalKickOpponents(side, gk);

    /* Dos opciones reales para el saque: un apoyo corto y una salida larga.
     * Los receptores se mueven a su zona durante la preparación; el balón no
     * se lanza hasta el impacto. */
    var shortOff = (Math.random() < 0.5 ? -1 : 1) * 10;
    var shortSpot = {x: clamp(own + dir * 17, 2, LEN - 2), z: clamp(ballZ + shortOff, 4, WID - 4)};
    var longSpot = {x: clamp(own + dir * 42, 2, LEN - 2), z: clamp(ballZ - shortOff * 0.75, 4, WID - 4)};
    var shortA = nearestActor(side, shortSpot.x, shortSpot.z, true);
    var longA = nearestActor(side, longSpot.x, longSpot.z, true, shortA);
    if (!shortA) shortA = nearestActor(side, ballX, ballZ, true);
    if (!longA || longA === shortA) longA = nearestActor(side, longSpot.x, longSpot.z, true, shortA) || shortA;
    if (shortA) {
      shortA.tx = shortSpot.x; shortA.tz = shortSpot.z; shortA.maxSp = 4.8 * shortA.pace;
      shortA.faceLock = false;
    }
    if (longA && longA !== shortA) {
      longA.tx = longSpot.x; longA.tz = longSpot.z; longA.maxSp = 4.6 * longA.pace;
      longA.faceLock = false;
    }

    var phases = [], at = 0, impactAt = 0, i;
    for (i = 0; i < GK_PHASES.length; i++) {
      var pd = GK_PHASES[i];
      phases.push({name: pd.name, dur: pd.dur, start: at, end: at + pd.dur});
      if (pd.name === "impact") impactAt = at;
      at += pd.dur;
    }
    var a = {type: "goalkick", t: 0, dur: at, side: side, dir: dir, gk: gk,
      ballX: ballX, ballZ: ballZ, shortA: shortA, longA: longA, shortK: Math.random() < 0.55,
      shortSpot: shortSpot, longSpot: longSpot, phases: phases, phaseIndex: 0, phase: "prepare",
      phaseLog: [], impactAt: impactAt, launched: false, launchT: 0, launchPhase: "",
      flightDur: 0, receiver: null,
      minPressureDist: space.minDist, opponentsOutside: space.outside, playersInsideArea: space.inside,
      opponentsMoved: space.moved, safeDist: GK_SAFE_DIST};
    sim.action = a;
    enterGoalKickPhase(a, 0);
  }

  function enterGoalKickPhase(a, idx) {
    if (!a || !a.phases[idx]) return;
    var ph = a.phases[idx], gk = a.gk, dirFace = a.dir > 0 ? PI / 2 : -PI / 2;
    a.phaseIndex = idx; a.phase = ph.name;
    a.phaseLog.push(ph.name);
    if (!gk) return;
    if (ph.name === "prepare") {
      gk.anim = null; gk.faceLock = false;
      gk.tx = a.ballX - a.dir * 0.58; gk.tz = a.ballZ;
    } else if (ph.name === "scan") {
      /* Llega al balón, lo coloca y otea las dos bandas antes de decidir. */
      gk.x = a.ballX - a.dir * 0.58; gk.z = a.ballZ; gk.vx = gk.vz = 0;
      gk.tx = gk.x; gk.tz = gk.z; gk.facing = dirFace; gk.faceLock = true;
      gk.anim = {type: "gkready", t: 0, dur: ph.dur};
    } else if (ph.name === "windup") {
      /* Retrocede mirando al balón y arranca la carrera de tres pasos. */
      gk.anim = null; gk.faceLock = true; gk.facing = dirFace;
      gk.tx = a.ballX - a.dir * 2.8; gk.tz = a.ballZ;
      gk.maxSp = 5.6;
    } else if (ph.name === "plant") {
      gk.x = a.ballX - a.dir * 0.72; gk.z = a.ballZ; gk.vx = gk.vz = 0;
      gk.tx = gk.x; gk.tz = gk.z; gk.facing = dirFace; gk.faceLock = true;
      gk.anim = {type: "gkstrike", t: 0, dur: 1.04};
    } else if (ph.name === "impact") {
      if (!a.launched) launchGoalKickBall(a);
      gk.x = a.ballX - a.dir * 0.52; gk.z = a.ballZ; gk.vx = gk.vz = 0;
      gk.tx = gk.x; gk.tz = gk.z; gk.facing = dirFace; gk.faceLock = true;
      if (!gk.anim) gk.anim = {type: "gkstrike", t: 0, dur: 1.04};
    } else if (ph.name === "follow") {
      gk.faceLock = true; gk.facing = dirFace;
      gk.tx = clamp(a.ballX + a.dir * 0.65, 1, LEN - 1); gk.tz = a.ballZ;
    } else if (ph.name === "recover") {
      gk.faceLock = false; gk.anim = null;
      gk.tx = ownX(a.side) + a.dir * 2.3; gk.tz = a.ballZ;
      gk.maxSp = 5.4;
    }
  }

  function launchGoalKickBall(a) {
    if (!a || a.launched) return;
    a.launched = true; a.launchT = a.t; a.launchPhase = a.phase;
    var b = sim.ball, r = a.shortK ? (a.shortA || a.longA) : (a.longA || a.shortA);
    if (!r) { releaseBall(a.dir * 7, 0, 1.8); b.lastTouch = a.side; return; }
    var tx = clamp(r.x + r.vx * 0.08, 2, LEN - 2);
    var tz = clamp(r.z + r.vz * 0.08, 2.5, WID - 2.5);
    var d = dist(b.x, b.z, tx, tz);
    var dur = clamp(d / 18, 0.32, 2.45);
    var arc = a.shortK ? clamp(d * 0.025 + 0.25, 0.3, 0.9) : clamp(d * 0.055 + 0.8, 1.2, 3.0);
    launchBall(tx, tz, 0.23, dur, arc, {type: "held", side: a.side, idx: r.slot});
    b.lastTouch = a.side; sim.own = a.side;
    a.flightDur = dur; a.receiver = r;
    /* busy() debe cubrir también la recepción cuando el envío es largo. */
    a.dur = Math.max(a.dur, a.t + dur + 0.45);
  }

  function updateGoalKickAction(a) {
    var gk = a.gk, ph = a.phases[a.phaseIndex];
    /* Hasta el golpeo, la zona se vigila en cada fotograma: si el saque se creó
     * durante una repetición, al terminar esta se restauran las posiciones
     * guardadas y algún rival puede volver a quedar dentro del área. Con el balón
     * muerto se le recoloca fuera (y quieto) como en la preparación. */
    if (gk && !a.launched) {
      var chk = goalKickSpaceStats(a.side, gk);
      if (!chk.outside || chk.minDist < GK_SAFE_DIST) {
        var fix = placeGoalKickOpponents(a.side, gk);
        a.opponentsMoved = (a.opponentsMoved || 0) + fix.moved;
      }
      if (a.t < 0) { var sp0 = goalKickSpaceStats(a.side, gk); a.opponentsOutside = sp0.outside; a.playersInsideArea = sp0.inside; }
    }
    /* Ningún rival puede acercarse al portero durante el saque. La IA está
     * congelada y aquí solo se mide la separación para depurar/pruebas. */
    if (gk && a.t >= 0) {
      var pd = nearestOpponentDist(a.side, gk.x, gk.z);
      if (pd < a.minPressureDist) a.minPressureDist = pd;
      var sp = goalKickSpaceStats(a.side, gk);
      a.opponentsOutside = sp.outside; a.playersInsideArea = sp.inside;
    }
    if (gk && ph) {
      if (a.phase === "scan") {
        var su = clamp((a.t - ph.start) / Math.max(0.01, ph.dur), 0, 1);
        gk.facing = (a.dir > 0 ? PI / 2 : -PI / 2) + Math.sin(su * TAU * 1.15) * 0.55;
      } else if (a.phase === "windup") {
        var wu = clamp((a.t - ph.start) / Math.max(0.01, ph.dur), 0, 1);
        if (wu < 0.48) {
          gk.faceLock = true; gk.facing = a.dir > 0 ? PI / 2 : -PI / 2;
          gk.tx = a.ballX - a.dir * 2.8; gk.tz = a.ballZ;
        } else {
          gk.faceLock = false;
          gk.tx = a.ballX - a.dir * 0.62; gk.tz = a.ballZ;
        }
      }
    }
    while (a.phaseIndex < a.phases.length - 1 && a.t >= a.phases[a.phaseIndex].end) {
      enterGoalKickPhase(a, a.phaseIndex + 1);
    }
  }


  function setupThrowIn(side, x, z) {
    sim.action = null; sim.pendingPass = null;
    var b = sim.ball;
    b.x = clamp(x, 2, LEN - 2); b.z = z < MIDZ ? 0.9 : WID - 0.9; b.y = 0.22; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null;
    var taker = nearestActor(side, b.x, b.z, true);
    sim.own = side;
    if (taker) { taker.x = b.x; taker.z = b.z + (b.z < MIDZ ? 1 : -1); taker.facing = b.z < MIDZ ? PI : 0; }
    sim.restart = {type: "throw", side: side, idx: taker ? taker.slot : -1, t: 0.55};
  }

  /* Coloca a un actor en una posición de balón parado sin arrastrar la pose
   * anterior. La orientación se fija al punto de saque/carrera. */
  function placeSetPieceActor(a, x, z, faceX, faceZ) {
    if (!a) return;
    a.x = a.tx = clamp(x, 1.2, LEN - 1.2);
    a.z = a.tz = clamp(z, 1.5, WID - 1.5);
    a.vx = a.vz = 0; a.maxSp = 0;
    a.anim = null; a.visualAnim = null; a.passTarget = null;
    a.hidden = false; a.faceLock = false; a.lean = 0; a.bank = 0;
    if (faceX != null) faceTo(a, faceX, faceZ);
  }

  /* Los rivales deben respetar la distancia reglamentaria al balón. Se usa en
   * córners y faltas; no mueve al sacador ni al portero. */
  function keepOpponentsAway(side, x, z, radius, except) {
    var list = listOf(1 - side);
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (!q || q === except || q.gk) continue;
      var dx = q.x - x, dz = q.z - z, d = Math.sqrt(dx * dx + dz * dz);
      if (d >= radius || d < 0.001) continue;
      var ux = dx / d, uz = dz / d;
      placeSetPieceActor(q, x + ux * (radius + 0.35), z + uz * (radius + 0.35), x, z);
    }
  }

  function setupCorner(side, end) {
    sim.action = null; sim.restart = null; sim.pendingPass = null;
    placeAtBase();
    end = end == null ? (sim.attack[side] > 0 ? 1 : 0) : (end ? 1 : 0);
    var b = sim.ball, cornerZ = b.z < MIDZ ? 0.7 : WID - 0.7;
    b.x = end ? LEN - 0.7 : 0.7; b.z = cornerZ; b.y = 0.22;
    b.vx = b.vy = b.vz = 0; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null;
    b.side = side; b.idx = -1;
    sim.own = side;

    var gx = goalX(side), dir = sim.attack[side];
    var targetX = clamp(gx - dir * 10.5, 4, LEN - 4);
    var targetZ = clamp(MIDZ + (cornerZ < MIDZ ? 4.2 : -4.2), 6, WID - 6);
    var taker = nearestActor(side, b.x, b.z, true);
    if (taker) placeSetPieceActor(taker, b.x + (end ? -0.55 : 0.55),
      b.z + (cornerZ < MIDZ ? 0.55 : -0.55), targetX, targetZ);

    var rec = nearestActor(side, targetX, targetZ, true, taker);
    if (rec) placeSetPieceActor(rec, targetX, targetZ, gx, MIDZ);
    var attackers = listOf(side).filter(function (q) {
      return q !== taker && q !== rec && !q.gk;
    });
    var nearX = clamp(gx - dir * 7.2, 3, LEN - 3);
    var nearZ = clamp(MIDZ + (cornerZ < MIDZ ? -3.7 : 3.7), 4, WID - 4);
    var edgeX = clamp(gx - dir * 16.5, 3, LEN - 3);
    if (attackers[0]) placeSetPieceActor(attackers[0], nearX, nearZ, b.x, b.z);
    if (attackers[1]) placeSetPieceActor(attackers[1], edgeX, MIDZ, b.x, b.z);
    if (attackers[2]) placeSetPieceActor(attackers[2], targetX - dir * 3.0,
      clamp(MIDZ - (cornerZ < MIDZ ? 2.2 : -2.2), 5, WID - 5), b.x, b.z);

    /* Marcas defensivas: palo corto, rematador y frontal del área. */
    var defenders = listOf(1 - side).filter(function (q) { return !q.gk; });
    if (defenders[0]) placeSetPieceActor(defenders[0], clamp(gx - dir * 8.4, 3, LEN - 3),
      targetZ, b.x, b.z);
    if (defenders[1]) placeSetPieceActor(defenders[1], clamp(gx - dir * 6.9, 3, LEN - 3),
      clamp(MIDZ + (cornerZ < MIDZ ? -3.4 : 3.4), 4, WID - 4), b.x, b.z);
    if (defenders[2]) placeSetPieceActor(defenders[2], clamp(gx - dir * 15.0, 3, LEN - 3),
      MIDZ, b.x, b.z);
    var gk = pickKeeper(1 - side);
    if (gk) placeSetPieceActor(gk, gx - dir * 0.9, MIDZ, b.x, b.z);
    keepOpponentsAway(side, b.x, b.z, 9.15, null);

    sim.restart = {type: "corner", side: side, idx: taker ? taker.slot : -1, t: 1.15,
      target: rec ? rec.slot : -1, targetX: targetX, targetZ: targetZ, gx: gx, dir: dir};
    sim.lastSetPiece = {type: "corner", side: side, target: rec ? rec.slot : -1,
      targetX: +targetX.toFixed(2), targetZ: +targetZ.toFixed(2),
      opponentsClear: +nearestOpponentDist(side, b.x, b.z).toFixed(2)};
  }

  /* Falta: cerca del área se forma barrera a 9,15 m y se busca el remate;
   * lejos del área se reanuda con un pase normal, como en un partido. */
  function setupFreeKick(side, x, z) {
    sim.action = null; sim.restart = null; sim.pendingPass = null;
    placeAtBase();
    var b = sim.ball, dir = sim.attack[side], gx = goalX(side);
    var spotX = clamp(x == null ? LEN / 2 : x, 3, LEN - 3);
    var spotZ = clamp(z == null ? MIDZ : z, 4, WID - 4);
    b.x = spotX; b.z = spotZ; b.y = 0.22;
    b.vx = b.vy = b.vz = 0; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null;
    b.side = side; b.idx = -1;
    sim.own = side;

    var taker = nearestActor(side, spotX, spotZ, true);
    if (taker) placeSetPieceActor(taker, spotX - dir * 0.85, spotZ, gx, MIDZ);
    /* 34 m es el límite aproximado de una falta directa con barrera. */
    var nearGoal = dist(spotX, spotZ, gx, MIDZ) <= 34;
    var targetX, targetZ, rec, wallX = null, wallZ = null;
    if (nearGoal) {
      targetX = clamp(gx - dir * 10.5, 4, LEN - 4);
      targetZ = clamp(MIDZ + (spotZ < MIDZ ? 3.2 : -3.2), 6, WID - 6);
      rec = nearestActor(side, targetX, targetZ, true, taker);
      if (rec) placeSetPieceActor(rec, targetX, targetZ, gx, MIDZ);

      var attackers = listOf(side).filter(function (q) {
        return q !== taker && q !== rec && !q.gk;
      });
      for (var ai = 0; ai < attackers.length && ai < 3; ai++) {
        placeSetPieceActor(attackers[ai], clamp(targetX + dir * (ai - 1) * 4.2, 4, LEN - 4),
          clamp(targetZ + (ai === 0 ? -4.6 : ai === 1 ? 4.6 : 0), 5, WID - 5), b.x, b.z);
      }

      var dx = gx - spotX, dz = MIDZ - spotZ, dl = Math.sqrt(dx * dx + dz * dz) || 1;
      var ux = dx / dl, uz = dz / dl, px = -uz, pz = ux;
      wallX = spotX + ux * 9.15; wallZ = spotZ + uz * 9.15;
      var defenders = listOf(1 - side).filter(function (q) { return !q.gk; });
      for (var wi = 0; wi < defenders.length && wi < 3; wi++) {
        placeSetPieceActor(defenders[wi], wallX + px * (wi - 1) * 0.95,
          wallZ + pz * (wi - 1) * 0.95, spotX, spotZ);
      }
      /* El resto de la defensa se queda entre la barrera y su portería. */
      for (var di = 3; di < defenders.length; di++) {
        placeSetPieceActor(defenders[di], clamp(gx - dir * (12 + (di - 3) * 2.8), 4, LEN - 4),
          clamp(MIDZ + (di % 2 ? 5.4 : -5.4), 5, WID - 5), b.x, b.z);
      }
    } else {
      /* Falta lejana: receptor delante del sacador y pase raso; no tiene
       * sentido montar una barrera y llenar el área desde el centro del campo. */
      targetX = clamp(spotX + dir * 18, 4, LEN - 4);
      targetZ = clamp(spotZ + (spotZ < MIDZ ? 7 : -7), 6, WID - 6);
      rec = nearestActor(side, targetX, targetZ, true, taker);
      if (rec) placeSetPieceActor(rec, targetX, targetZ, spotX, spotZ);
    }
    var gk = pickKeeper(1 - side);
    if (gk) placeSetPieceActor(gk, gx - dir * 0.9, MIDZ, b.x, b.z);
    keepOpponentsAway(side, spotX, spotZ, 9.15, null);

    sim.restart = {type: "free", side: side, idx: taker ? taker.slot : -1, t: 1.1,
      target: rec ? rec.slot : -1, targetX: targetX, targetZ: targetZ, gx: gx, dir: dir,
      cross: nearGoal};
    sim.lastSetPiece = {type: "free", side: side, target: rec ? rec.slot : -1,
      targetX: +targetX.toFixed(2), targetZ: +targetZ.toFixed(2),
      wallX: wallX == null ? null : +wallX.toFixed(2),
      wallZ: wallZ == null ? null : +wallZ.toFixed(2),
      wallDist: wallX == null ? null : +dist(spotX, spotZ, wallX, wallZ).toFixed(2),
      cross: nearGoal};
  }

  /* Penalti: balón en el punto, portero en la línea y todos los demás fuera
   * del área. El lanzamiento se resuelve con la acción de tiro existente. */
  function setupPenalty(side, res, who) {
    sim.action = null; sim.restart = null; sim.pendingPass = null;
    placeAtBase();
    var b = sim.ball, dir = sim.attack[side], gx = goalX(side);
    var spotX = clamp(gx - dir * 11, 8, LEN - 8), spotZ = MIDZ;
    b.x = spotX; b.z = spotZ; b.y = 0.22;
    b.vx = b.vy = b.vz = 0; b.mode = "dead"; b.fl = null; b.next = null; b.claim = null;
    b.side = side; b.idx = -1;
    sim.own = side;

    var taker = who != null ? actorAt(side, +who) : null;
    if (!taker || taker.gk) taker = pickShooter(side, who);
    if (taker) placeSetPieceActor(taker, spotX - dir * 2.4, spotZ, gx, MIDZ);
    var gk = pickKeeper(1 - side);
    if (gk) placeSetPieceActor(gk, gx - dir * 0.35, MIDZ, spotX, spotZ);

    /* Todos los demás esperan detrás de la frontal del área. */
    var outsideX = spotX - dir * 8.2;
    var lists = [listOf(side), listOf(1 - side)], n = 0;
    for (var li = 0; li < 2; li++) for (var ii = 0; ii < lists[li].length; ii++) {
      var q = lists[li][ii];
      if (q === taker || q === gk) continue;
      var zz = 6 + (n % 10) * ((WID - 12) / 9);
      n++;
      placeSetPieceActor(q, outsideX + (q.side ? -1 : 1) * 0.65, zz, spotX, spotZ);
    }
    sim.restart = {type: "penalty", side: side, idx: taker ? taker.slot : -1,
      t: 1.0, res: res === "goal" || res === "post" || res === "miss" ? res : "save",
      spotX: spotX, spotZ: spotZ};
    sim.lastSetPiece = {type: "penalty", side: side, taker: taker ? taker.slot : -1,
      res: sim.restart.res, spotX: +spotX.toFixed(2)};
  }
  setupKickoff = smoothed(setupKickoff, "kickoff");
  setupGoalKick = smoothed(setupGoalKick, "goalkick");
  setupCorner = smoothed(setupCorner, "corner");
  setupFreeKick = smoothed(setupFreeKick, "free");
  setupPenalty = smoothed(setupPenalty, "penalty");


  function outOfPlay() {
    var b = sim.ball, side = b.lastTouch === 1 ? 1 : 0, def = 1 - side;
    if (b.z < 0 || b.z > WID) { setupThrowIn(def, clamp(b.x, 3, LEN - 3), b.z); return; }
    if (b.x < 0 || b.x > LEN) {
      var end = b.x < 0 ? 0 : 1, attacking = 0;
      for (var s = 0; s < 2; s++) if (goalX(s) === (end ? LEN : 0)) attacking = s;
      var defending = 1 - attacking;
      /* Si el último toque es del atacante, el balón salió por la portería
       * rival: saque de puerta para el defensor. Si es del defensor, córner. */
      if (side === attacking) setupGoalKick(defending);
      else setupCorner(attacking, end);
      return;
    }
    releaseBall(0, 0, 0);
  }

  function takeSetPiece(r) {
    var a = actorAt(r.side, r.idx);
    if (!a) return;
    a.visualAnim = {type: "pass", t: 0, dur: 0.6};
    var mate = r.target != null && r.target >= 0 ? actorAt(r.side, r.target) : null;
    if (!mate) mate = nearestActor(r.side, a.x, a.z, true, a);
    var tx = r.targetX != null ? r.targetX : (mate ? mate.x : a.x + sim.attack[r.side] * 18);
    var tz = r.targetZ != null ? r.targetZ : (mate ? mate.z : MIDZ);
    tx = clamp(tx + (mate ? clamp(mate.vx * 0.12, -0.8, 0.8) : 0), 2, LEN - 2);
    tz = clamp(tz + (mate ? clamp(mate.vz * 0.12, -0.8, 0.8) : 0), 2.5, WID - 2.5);
    var d = dist(a.x, a.z, tx, tz);
    var cross = r.type === "corner" || (r.type === "free" && r.cross !== false);
    var dur = clamp(d / (cross ? 18 : 24), cross ? 0.55 : 0.28, cross ? 1.7 : 1.2);
    var arc = cross ? clamp(1.1 + d * 0.018, 1.25, 2.7) : 0.2;
    if (mate) {
      mate.passTarget = {x: tx, z: tz, until: sim.time + dur + 0.75};
      mate.maxSp = 7.8 * mate.pace;
    }
    sim.own = r.side;
    launchBall(tx, tz, 0.24, dur, arc, mate ? {type: "held", side: r.side, idx: mate.slot} : null);
    if (sim.lastSetPiece) {
      sim.lastSetPiece.launched = true;
      sim.lastSetPiece.flightDur = +dur.toFixed(2);
      sim.lastSetPiece.receiver = mate ? mate.slot : -1;
    }
  }

  function updateRestart(dt) {
    if (!sim.restart) return;
    sim.restart.t -= dt;
    if (sim.restart.t > 0) return;
    var r = sim.restart; sim.restart = null; sim.pendingPass = null;
    if (r.type === "penalty") {
      startShot({t: r.res || "save", side: r.side, who: r.idx, k: "penalty", d: 11, ly: 0});
      return;
    }
    if (r.type === "corner" || r.type === "free") { takeSetPiece(r); return; }
    var a = actorAt(r.side, r.idx);
    if (!a) return;
    if (r.type === "kickoff" && !(sim.ball.mode === "held" && sim.ball.side === r.side && sim.ball.idx === a.slot)) {
      sim.ball.x = LEN / 2; sim.ball.z = MIDZ; giveTo(r.side, a.slot);
    }
    a.visualAnim = {type: "pass", t: 0, dur: 0.6};
    var mate = nearestActor(r.side, a.x, a.z, true, a);
    if (!mate) return;
    /* También en saques y reinicios el receptor ataca el punto de caída. Antes
     * seguía con su tarea táctica y el balón terminaba encima de él de golpe. */
    var tx = clamp(mate.x + clamp(mate.vx * 0.16, -0.9, 0.9), 2, LEN - 2);
    var tz = clamp(mate.z + clamp(mate.vz * 0.16, -0.9, 0.9), 2.5, WID - 2.5);
    var dur = clamp(dist(a.x, a.z, tx, tz) / 18, 0.28, 1.2);
    mate.passTarget = {x: tx, z: tz, until: sim.time + dur + 0.6};
    mate.maxSp = 7.8 * mate.pace;
    launchBall(tx, tz, 0.23, dur, 0.2, {type: "held", side: r.side, idx: mate.slot});
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

  /* Pase visual en juego abierto: el motor de partido ya decidió que hay un
     pase; el 3D elige un receptor coherente y mantiene el balón continuo. */
  function pickPassReceiver(side, carrier, want) {
    var dir = sim.attack[side], list = listOf(side), best = null, bestScore = -1e9;
    var targetX = sim.attack[side] > 0 ? sim.bx / 100 * LEN : (1 - sim.bx / 100) * LEN;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (!q || q === carrier || q.gk) continue;
      var d = dist(carrier.x, carrier.z, q.x, q.z);
      if (d < 4 || d > 38) continue;
      var forward = (q.x - carrier.x) * dir;
      /* pases de 8-22 m, hacia delante sin pasarse de la línea del motor y
       * a un compañero sin rival encima */
      var mk = nearestOpponentDist(side, q.x, q.z);
      var score = -Math.abs(d - 15) * 0.4 + clamp(forward, -12, 20) * 0.45 - Math.abs(q.x - targetX) * 0.1 + Math.min(mk, 8) * 0.5;
      if (forward < -6) score -= 3;
      /* El evento solo sugiere un nombre: si está muy lejos, vale más un
         compañero cercano que un pase imposible de 40 m. */
      if (q === want) score += d < 27 ? 7 : -4;
      if (score > bestScore) { bestScore = score; best = q; }
    }
    return best;
  }

  /* El enrosque se aplica perpendicular al recorrido. Si el punto de destino
   * está cerca de una banda, se recorta para que el balón no dibuje una curva
   * que salga del campo y vuelva a entrar. */
  function fitPassCurve(x0, z0, x1, z1, curve) {
    if (!curve) return 0;
    var dx = x1 - x0, dz = z1 - z0, dl = Math.sqrt(dx * dx + dz * dz) || 1;
    var px = -dz / dl, pz = dx / dl;
    var minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
    var minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1);
    var cap = Math.abs(curve), lo = 1.0, hiX = LEN - 1.0, hiZ = WID - 1.0;
    if (Math.abs(px) > 1e-6) {
      cap = Math.min(cap, (hiX - maxX) / Math.abs(px), (minX - lo) / Math.abs(px));
    }
    if (Math.abs(pz) > 1e-6) {
      cap = Math.min(cap, (hiZ - maxZ) / Math.abs(pz), (minZ - lo) / Math.abs(pz));
    }
    if (!isFinite(cap) || cap < 0) cap = 0;
    return (curve < 0 ? -1 : 1) * cap;
  }

  function startVisualPass(e, side, want) {
    if (!sim.started || sim.ended || sim.action || sim.restart) return false;
    var b = sim.ball;
    if (b.mode !== "held" || b.side !== side) return false;
    var carrier = actorAt(side, b.idx);
    if (!carrier || carrier.gk) return false;
    var rec = pickPassReceiver(side, carrier, want);
    if (!rec) return false;
    var dir = sim.attack[side];
    /* El punto de recepción no debe exigir una carrera imposible: se limita
       la ventaja a ~1,2 m y el receptor ataca ese espacio durante el vuelo. */
    var tx = clamp(rec.x + clamp(rec.vx * 0.20, -1.2, 1.2), 2, LEN - 2);
    var tz = clamp(rec.z + clamp(rec.vz * 0.20, -1.2, 1.2), 2.5, WID - 2.5);
    var d = dist(carrier.x, carrier.z, tx, tz);
    var cross = Math.abs(rec.z - carrier.z) > 14 && (rec.x - carrier.x) * dir > 8;
    var longBall = d > 27;
    var arc = cross ? clamp(d * 0.045, 0.9, 2.4) : longBall ? clamp(d * 0.03, 0.6, 1.8) : clamp(d * 0.008, 0.05, 0.35);
    var dur = clamp(d / (cross ? 19 : longBall ? 23 : 26), 0.26, 1.65);
    /* Menos enrosque en los pases rasos y siempre dentro de los límites. */
    var curve = (Math.random() < 0.5 ? -1 : 1) * (cross ? 1.0 : longBall ? 0.52 : 0.10) *
      (0.55 + Math.random() * 0.65);
    curve = fitPassCurve(carrier.x, carrier.z, tx, tz, curve);
    carrier.visualAnim = {type: "pass", t: 0, dur: 0.56};
    sim.lastPass = {from: carrier.slot, to: rec.slot, dur: +dur.toFixed(2),
      curve: +curve.toFixed(2), atEnd: null, pending: true};
    /* El receptor corre al punto de recepción y se queda allí hasta que el
     * balón llega; así la recepción no le obliga a teletransportarse. */
    rec.passTarget = {x: tx, z: tz, until: sim.time + dur + 0.6};
    rec.maxSp = 7.8 * rec.pace;
    launchBall(tx, tz, 0.23, dur, arc, {type: "held", side: side, idx: rec.slot}, curve);
    b.lastTouch = side;
    sim.own = side;
    return true;
  }

  /* Un pase puede llegar antes que el estado de posesión. Se guarda y se
     ejecuta en cuanto el balón está en los pies del bando correcto; si en
     4 s no hay receptor, se descarta para no arrastrar acciones viejas. */
  function tryPendingPass() {
    var pp = sim.pendingPass;
    if (!pp) return false;
    if (sim.time > pp.until || sim.ended || !sim.started || sim.action || sim.restart) {
      if (sim.time > pp.until || sim.ended) sim.pendingPass = null;
      return false;
    }
    var b = sim.ball;
    if (b.mode !== "held" || b.side !== pp.side) {
      if (b.mode !== "dead" && b.mode !== "loose") return false;
      var a = nearestActor(pp.side, b.x, b.z, false);
      if (!a || dist(a.x, a.z, b.x, b.z) > 3.2) return false;
      if (!giveTo(pp.side, a.slot)) return false;
    }
    if (startVisualPass(pp.e, pp.side, pp.who)) { sim.pendingPass = null; return true; }
    return false;
  }

  /* Siguiente pase de la jugada previa al tiro: al rematador si el balón ya
   * está a tiro de pase; si no, a un compañero intermedio. */
  function shotLeg(a) {
    var b = sim.ball, sh = a.shooter; if (!sh) return;
    var from = b.mode === "held" ? actorAt(b.side, b.idx) : null;
    var d = dist(b.x, b.z, a.originX, a.originZ);
    if (d < 2) { giveTo(a.side, sh.slot); return; }
    var tx = a.originX, tz = a.originZ, rec = sh;
    if (d > 32 && a.legs < 2) {
      var mx = (b.x + a.originX) / 2, mz = (b.z + a.originZ) / 2, list = listOf(a.side), best = null, bd = 1e9;
      for (var i = 0; i < list.length; i++) { var q = list[i]; if (q === sh || q.gk || q === from) continue; var qd = dist(q.x, q.z, mx, mz); if (qd < bd) { bd = qd; best = q; } }
      if (best && bd < 16) { rec = best; tx = clamp(best.x + best.vx * 0.3, 2, LEN - 2); tz = clamp(best.z + best.vz * 0.3, 2.5, WID - 2.5); }
    }
    var dl = dist(b.x, b.z, tx, tz), run = rec === sh ? dist(sh.x, sh.z, tx, tz) / (7.6 * sh.pace) : 0;
    var cross = Math.abs(tz - b.z) > 14 && Math.abs(tx - b.x) < 30;
    var dur = clamp(Math.max(dl / (cross ? 19 : 23), run), 0.35, 2.2);
    var arc = cross ? clamp(dl * 0.05, 1.0, 2.6) : dl > 26 ? clamp(dl * 0.03, 0.6, 1.8) : clamp(dl * 0.01, 0.05, 0.4);
    if (from) from.visualAnim = {type: "pass", t: 0, dur: 0.56};
    rec.passTarget = {x: tx, z: tz, until: sim.time + dur + 0.6};
    rec.maxSp = 8 * rec.pace;
    launchBall(tx, tz, 0.23, dur, arc, {type: "held", side: a.side, idx: rec.slot}, 0);
    a.legs++;
    a.buildMax = Math.max(a.buildMax, a.t + dur + 0.6);
  }
  function startWindup(a) {
    var sh = a.shooter;
    if (sh) {
      a.originX = sh.x; a.originZ = sh.z; sh.passTarget = null;
      sh.tx = sh.x; sh.tz = sh.z; sh.anim = {type: "kick", t: 0, dur: 0.24};
      sh.facing = Math.atan2(a.gx - sh.x, MIDZ - sh.z);
    }
    a.stage = "windup"; a.t = 0;
  }
  function startShot(e) {
    if (sim.action) { sim.queue.push(e); return; }
    sim.restart = null; sim.pendingPass = null;
    for (var ps2 = 0; ps2 < 2; ps2++) for (var pi2 = 0; pi2 < 11; pi2++) {
      var pa2 = actorAt(ps2, pi2); if (pa2) pa2.passTarget = null;
    }
    var side = +e.side === 1 ? 1 : 0, res = e.t, kind = e.k || "pass";
    /* El marcador del motor ya incluye el gol, pero este HUD espera al
     * fotograma en que la pelota cruza la línea. La reconciliación de
     * emergencia evita que un evento perdido deje el marcador viejo. */
    if (res === "goal") {
      sim.scorePending++;
      sim.scoreForceAt = Math.max(sim.scoreForceAt || 0, sim.time + 25);
    }
    var dir = sim.attack[side], gx = goalX(side);
    var shooter = pickShooter(side, e.who);
    var d = e.d != null && isFinite(+e.d) ? clamp(+e.d, 5, 34) : 14;
    var lane = e.ly != null && isFinite(+e.ly) ? clamp(+e.ly, -13, 13) : (shooter ? clamp(shooter.z - MIDZ, -13, 13) : 0);
    var ox = clamp(gx - dir * d, 3, LEN - 3), oz = clamp(MIDZ + lane, 4, WID - 4);
    var b = sim.ball, travel = dist(b.x, b.z, ox, oz);
    /* el rematador debe estar cerca del origen; si el elegido anda lejos, se usa
       al compañero mejor colocado para que el balón no tenga que perseguirle */
    /* Jugada previa sin teletransportes: el rematador (el nombrado si está a
     * tiro, si no el compañero mejor colocado) corre al punto de disparo y el
     * balón llega con uno o dos pases reales, o en conducción si ya lo lleva. */
    var near = nearestActor(side, ox, oz, true);
    if (near && (!shooter || dist(shooter.x, shooter.z, ox, oz) > 16)) shooter = near;
    var holder = b.mode === "held" && b.side === side ? actorAt(side, b.idx) : null;
    var runT = shooter ? dist(shooter.x, shooter.z, ox, oz) / 7.6 : 0;
    var buildMax = clamp(Math.max(runT, travel / 16) + 1.4, 1.4, 4.2);
    if (shooter) {
      shooter.passTarget = {x: ox, z: oz, until: sim.time + buildMax + 0.5};
      shooter.maxSp = 8 * shooter.pace;
    }
    var act = {type: "shot", stage: "build", t: 0, side: side, res: res, kind: kind, shooter: shooter,
      originX: ox, originZ: oz, gx: gx, dir: dir, gk: pickKeeper(1 - side), buildup: buildMax, buildMax: buildMax, legs: 0,
      flight: 0.5, outcome: 0, dur: 0};
    act.outcome = res === "goal" ? 1.2 : res === "save" ? 0.8 : res === "post" ? 0.7 : 0.5;
    act.dur = buildMax + 0.18 + 0.5 + act.outcome;
    sim.action = act;
    if (!(holder && holder === shooter)) shotLeg(act);
    b.lastTouch = side;
    var outcome = act.outcome;
    sim.own = side;
    cam.cutT = 0.9; cam.cutMode = "shot";
    sfx("kick", res === "goal" ? 1 : 0.82);
    fireCue(e);
  }

  function resolveShot(a) {
    var b = sim.ball;
    var hitV = Math.sqrt((b.vx || 0) * (b.vx || 0) + (b.vz || 0) * (b.vz || 0));
    b.fl = null; b.next = null; b.vx = 0; b.vy = 0; b.vz = 0;
    if (a.res === "goal") {
      /* La pelota cruza la línea en este fotograma: solo ahora se confirma
       * el marcador que el motor ya había adelantado. */
      commitGoal(a.side);
      netHit(a.gx, clamp(b.z, MIDZ - POST + 0.4, MIDZ + POST - 0.4), clamp(b.y, 0.3, BAR - 0.3), 7 + clamp(hitV / 4, 0, 6));
      b.x = a.gx + a.dir * 1.0; b.z = clamp(b.z, MIDZ - POST, MIDZ + POST); b.y = 0.5; b.mode = "dead";
      sim.netT = 1; sim.shake = 0.5;
      cam.cutT = 1.4; cam.cutMode = "goal";
      if (a.shooter) {
        var cx = clamp(a.gx - a.dir * 8, 4, LEN - 4), cz = b.z < MIDZ ? 5 : WID - 5;
        a.shooter.anim = {type: "celebrate", t: 0, dur: 1.15, tx: cx, tz: cz};
        a.shooter.tx = cx; a.shooter.tz = cz; a.shooter.maxSp = 6.5;
      }
      sim.own = 1 - a.side;
    } else if (a.res === "save") {
      b.mode = "loose"; b.vx = -a.dir * rnd(6, 10); b.vz = rnd(-4, 4); b.vy = 2; b.lastTouch = a.side;
      if (a.gk) { a.gk.anim = {type: "dive", t: 0, dur: 0.55, dir: b.z >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z, x1: a.gk.x + a.dir * 0.8, z1: b.z}; fxDive(a.gk, a.gk.anim.dir); }
      sim.own = 1 - a.side;
    } else if (a.res === "post") {
      b.mode = "loose"; b.vx = -a.dir * rnd(5, 9); b.vz = rnd(-4, 4); b.vy = 2.4; b.lastTouch = a.side;
      if (a.gk) { a.gk.anim = {type: "dive", t: 0, dur: 0.5, dir: b.z >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z, x1: a.gk.x + a.dir * 0.7, z1: b.z}; fxDive(a.gk, a.gk.anim.dir); }
    } else {
      b.mode = "loose"; b.vx = a.dir * 3; b.vz = rnd(-2, 2); b.vy = 2.2; b.lastTouch = a.side;
    }
    if (a.res === "goal") sfx("cheer", a.side === 0);
    else sfx("ooh");
  }

  function finishAction() {
    var a = sim.action; sim.action = null;
    if (a && a.type === "goalkick") {
      if (a.gk) a.gk.faceLock = false;
      sim.lastGoalKick = {side: a.side, phases: a.phaseLog.slice(), launched: a.launched,
        launchPhase: a.launchPhase, launchT: +a.launchT.toFixed(3), impactAt: +a.impactAt.toFixed(3),
        flightDur: +a.flightDur.toFixed(3), shortK: a.shortK, pressure: false,
        receiver: a.receiver ? a.receiver.slot : -1, minPressureDist: +a.minPressureDist.toFixed(3),
        opponentsOutside: !!a.opponentsOutside, playersInsideArea: a.playersInsideArea || 0,
        opponentsMoved: a.opponentsMoved || 0, safeDist: GK_SAFE_DIST};
    }
    if (a && a.type === "shot") {
      if (a.res === "goal") { setupKickoff(1 - a.side); sim.pendingOwn = null; }
      else if (a.res === "miss") { setupGoalKick(1 - a.side); sim.pendingOwn = null; }
      else {
        var gk = pickKeeper(1 - a.side);
        if (gk) giveTo(1 - a.side, gk.slot);
      }
    }
    if (a && a.type === "card") {
      if (a.ref) { a.ref.anim = null; a.ref.faceLock = false; }
      if (a.player && !a.player.sentOff) a.player.anim = null;
      if (a.res === "red" && a.player) {
        a.player.sentOff = true; a.player.gone = true; a.player.anim = null;
      }
    }
    if (sim.pendingOwn != null) { var p = sim.pendingOwn; sim.pendingOwn = null; sim.own = p; }
    /* Un foul con tarjeta deja una falta para el equipo contrario. Si el
     * árbitro muestra la tarjeta, la puesta en escena del balón parado llega
     * justo después y ya con la formación colocada. */
    if (a && a.type === "card" && a.freeKick && !sim.ended && !sim.cinema) {
      setupFreeKick(1 - a.side, a.foul ? a.foul.x : sim.ball.x, a.foul ? a.foul.z : sim.ball.z);
    }
    if (sim.queue.length) { var e = sim.queue.shift(); handleEvent(e); }
  }

  /* Puesta en escena de la tarjeta: primero el árbitro llega, después levanta
   * la tarjeta. El gesto se limpia al terminar para que no quede congelado. */
  function updateCardAction(a, dt) {
    var ref = a.ref, p = a.player;
    if (a.stage === "foul") {
      var f = a.foul, v = f.victim, b = sim.ball;
      if (!f.hit) {
        /* la víctima conduce hacia delante; el infractor llega por detrás o de lado */
        if (b.mode === "held" && actorAt(b.side, b.idx) === v) v.passTarget = {x: clamp(v.x + f.dir * 3, 2, LEN - 2), z: v.z, until: sim.time + 0.3};
        v.maxSp = 4.8;
        p.passTarget = {x: v.x - f.dir * 0.6, z: v.z, until: sim.time + 0.3}; p.maxSp = 8.6 * p.pace;
        if ((dist(p.x, p.z, v.x, v.z) < 1.4 && b.mode === "held") || a.t > 3.6) {
          f.hit = true; f.x = v.x; f.z = v.z; a.t = 0;
          p.visualAnim = {type: "tackle", t: 0, dur: 0.75, dir: v.z >= p.z ? 1 : -1}; fxTackle(p);
          var fall = f.dir, side2 = v.z >= MIDZ ? -1 : 1;
          v.passTarget = null; p.passTarget = null;
          v.anim = {type: "dive", t: 0, dur: 0.7, dir: side2, x0: v.x, z0: v.z, x1: clamp(v.x + fall * 1.6, 1, LEN - 1), z1: clamp(v.z + side2 * 0.5, 1.5, WID - 1.5)};
          if (b.mode === "held") releaseBall(fall * 2.4, rnd(-1, 1), 0.4);
          sfx("whistle", [0.24]); sim.shake = 0.15;
        }
      } else {
        /* pitido: el balón se para, la víctima se queda en el suelo un momento */
        if (a.t > 0.5 && b.mode === "loose") { b.vx = b.vy = b.vz = 0; b.mode = "dead"; }
        p.tx = p.x; p.tz = p.z; p.maxSp = 2;
        if (a.t > 1.0) {
          a.stage = "approach"; a.t = 0;
          p.anim = {type: "card", t: 0, dur: 1.3};
          b.fl = null; b.next = null; b.claim = null; b.vx = b.vy = b.vz = 0; b.y = 0.22; b.mode = "dead";
          b.x = clamp(f.x, 1, LEN - 1); b.z = clamp(f.z, 1.5, WID - 1.5);
          if (ref) { var rdx = ref.x - p.x, rdz = ref.z - p.z, rdd = Math.sqrt(rdx * rdx + rdz * rdz) || 1;
            a.refX = clamp(p.x + rdx / rdd * 2.05, 1.4, LEN - 1.4); a.refZ = clamp(p.z + rdz / rdd * 2.05, 2.2, WID - 2.2);
            if (rdd > 14) { ref.x = clamp(p.x + rdx / rdd * 9, 1.4, LEN - 1.4); ref.z = clamp(p.z + rdz / rdd * 9, 2.2, WID - 2.2); }
            ref.tx = a.refX; ref.tz = a.refZ; ref.maxSp = 8.6; ref.faceLock = false; }
        }
      }
      return;
    }
    if (a.stage === "approach") {
      var near = ref && p ? dist(ref.x, ref.z, p.x, p.z) : 99;
      if (near <= 2.9 || a.t >= 1.45) {
        a.stage = "show"; a.showT = 0;
        if (ref) {
          ref.anim = {type: "card", res: a.res, t: 0, dur: 2.1};
          ref.faceLock = true;
          if (p) ref.facing = Math.atan2(p.x - ref.x, p.z - ref.z);
        }
        if (p && ref) p.facing = Math.atan2(ref.x - p.x, ref.z - p.z);
        if (sim.lastCard) sim.lastCard.visible = true;
        cam.cutT = 1.8; cam.cutMode = "card";
      }
    } else if (a.stage === "show") {
      a.showT += dt;
      if (ref && p) {
        ref.facing = angleTo(ref.facing, Math.atan2(p.x - ref.x, p.z - ref.z), Math.min(1, dt * 10));
        p.facing = angleTo(p.facing, Math.atan2(ref.x - p.x, ref.z - p.z), Math.min(1, dt * 8));
      }
      if (a.showT >= 1.75) finishAction();
    }
  }

  function updateAction(dt) {
    var a = sim.action;
    if (!a) return;
    a.t += dt;
    if (a.type === "goalkick") {
      updateGoalKickAction(a);
      if (a.t >= a.dur) finishAction();
      return;
    }
    if (a.type === "card") { updateCardAction(a, dt); return; }
    if (a.type !== "shot") { if (a.t >= a.dur) finishAction(); return; }
    if (a.stage === "build") {
      var bb = sim.ball, hold = bb.mode === "held" && bb.side === a.side ? actorAt(a.side, bb.idx) : null, sh = a.shooter;
      if (hold && hold === sh) {
        /* conducción hasta el punto de disparo, o dispara ya si está cerca */
        var rem = dist(sh.x, sh.z, a.originX, a.originZ);
        if (rem > 1.6 && a.t < a.buildMax) { sh.passTarget = {x: a.originX, z: a.originZ, until: sim.time + 0.4}; sh.maxSp = 7 * sh.pace; }
        else startWindup(a);
      } else if (hold && bb.mode === "held") shotLeg(a);
      else if (a.t >= a.buildMax + 0.6 && bb.mode !== "flight") {
        /* red de seguridad: el balón no llegó; el rematador lo recoge donde esté */
        if (sh && dist(sh.x, sh.z, bb.x, bb.z) < 4) { giveTo(a.side, sh.slot); startWindup(a); }
        else if (sh && !a.rescue) {
          /* el balón quedó lejos: pase directo al rematador allí donde esté */
          a.rescue = true; a.originX = sh.x; a.originZ = sh.z; a.legs = 2;
          if (bb.mode === "dead") { bb.mode = "loose"; bb.vx = bb.vz = bb.vy = 0; }
          shotLeg(a);
        } else startWindup(a);
      }
    } else if (a.stage === "windup" && a.t >= 0.18) {
      a.stage = "flight"; a.t = 0;
      var t = shotTarget(a);
      /* Los tiros llevan un enrosque leve; los disparos lejanos y las roscas
         se abren algo más sin cambiar el punto de impacto. */
      var bend = (a.kind === "long" ? 0.9 : a.kind === "oneone" ? 0.22 : 0.48) *
        (a.res === "goal" || a.res === "save" ? 1 : 0.6) * (Math.random() < 0.5 ? -1 : 1);
      /* velocidad de disparo realista (~27 m/s): el tiempo de vuelo depende
       * de la distancia, y el portero se lanza al final, no al golpeo */
      var sb = sim.ball, sd = dist(sb.x, sb.z, t.x, t.z);
      a.flight = a.kind === "penalty" ? 0.42 : clamp(sd / 27, 0.38, 1.3);
      launchBall(t.x, t.z, t.y, a.flight, t.arc, null, bend);
      a.diveAt = Math.max(0, a.flight - 0.5); a.dived = false;
    } else if (a.stage === "flight" && !a.dived && a.t >= (a.diveAt || 0)) {
      a.dived = true;
      if (a.gk) {
        var dz = clamp(a.gk.z + (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1.6), MIDZ - POST, MIDZ + POST);
        a.gk.anim = {type: "dive", t: 0, dur: 0.55, dir: dz >= a.gk.z ? 1 : -1, x0: a.gk.x, z0: a.gk.z,
          x1: a.gk.x + a.dir * 0.8, z1: dz};
        fxDive(a.gk, a.gk.anim.dir);
      }
    } else if (a.stage === "flight" && a.t >= a.flight) {
      a.stage = "outcome"; a.t = 0; resolveShot(a);
    } else if (a.stage === "outcome" && a.t >= a.outcome) {
      finishAction();
    }
  }

  function startCard(e) {
    if (sim.action) { sim.queue.push(e); return; }
    /* La tarjeta detiene el juego: no puede seguir un pase o un saque mientras
     * el árbitro se acerca al infractor. */
    sim.restart = null; sim.pendingPass = null; sim.challenge = null;
    var b = sim.ball;
    var side = +e.side === 1 ? 1 : 0, a = pickShooter(side, e.who);
    /* Primero se ve la falta: el infractor persigue al rival con el balón y
     * le derriba; después pita el árbitro y saca la tarjeta. Si el infractor
     * estaba lejos de la jugada, el corte de cámara le acerca. */
    var foul = null, isFoul = e.k == null || e.k === "foul";
    if (a && isFoul && !sim.ended) {
      /* la falta ocurre donde está el balón: la víctima es el rival que lo
       * lleva (o el más cercano a él) */
      var holder = b.mode === "held" ? actorAt(b.side, b.idx) : null, victim = null;
      if (holder && b.side === 1 - side && !holder.gk) victim = holder;
      else victim = nearestActor(1 - side, b.x, b.z, true);
      /* infractor lejos de la jugada: la jugada va hacia su zona con un
       * cambio de juego al rival que tiene cerca */
      if (victim && dist(a.x, a.z, victim.x, victim.z) > 30) {
        var v2 = nearestActor(1 - side, a.x, a.z, true);
        if (v2 && dist(b.x, b.z, v2.x, v2.z) < 48) victim = v2;
      }
      if (victim) {
        var vdir = sim.attack[1 - side];
        if (dist(a.x, a.z, victim.x, victim.z) > 30) {
          a.x = clamp(victim.x - vdir * 5.5, 2, LEN - 2); a.z = clamp(victim.z + (a.z > victim.z ? 2 : -2), 2.5, WID - 2.5); a.vx = a.vz = 0;
        }
        if (!(b.mode === "held" && actorAt(b.side, b.idx) === victim)) {
          var pd = dist(b.x, b.z, victim.x, victim.z);
          if (pd < 50 && b.x > -0.5 && b.x < LEN + 0.5 && b.z > -0.5 && b.z < WID + 0.5) {
            if (b.mode === "dead") { b.mode = "loose"; b.vx = b.vy = b.vz = 0; }
            if (holder) holder.visualAnim = {type: "pass", t: 0, dur: 0.56};
            launchBall(victim.x, victim.z, 0.23, clamp(pd / 22, 0.3, 2.0), pd > 24 ? clamp(pd * 0.03, 0.6, 1.8) : 0.1, {type: "held", side: 1 - side, idx: victim.slot}, 0);
          } else { b.fl = null; b.next = null; b.x = victim.x; b.z = victim.z; giveTo(1 - side, victim.slot); }
        }
        foul = {victim: victim, dir: vdir, x: victim.x, z: victim.z, hit: false, downT: 0};
      }
    }
    if (!foul && (b.mode === "flight" || b.mode === "held")) {
      b.fl = null; b.next = null; b.claim = null;
      b.vx = b.vy = b.vz = 0; b.y = 0.22; b.mode = "dead";
    }
    var ref = sim.officials[0] || null, refX = null, refZ = null;
    /* El árbitro se acerca al infractor desde su posición actual y se queda a
     * unos dos metros para que la tarjeta entre en el plano. */
    if (ref && a && !foul) {
      var dx = ref.x - a.x, dz = ref.z - a.z, dd = Math.sqrt(dx * dx + dz * dz);
      if (dd < 0.3) { dx = 0; dz = 1; dd = 1; }
      refX = clamp(a.x + dx / dd * 2.05, 1.4, LEN - 1.4);
      refZ = clamp(a.z + dz / dd * 2.05, 2.2, WID - 2.2);
      /* Si la jugada dejó al árbitro muy lejos, el corte de cámara justifica
       * que aparezca ya en el lugar de la tarjeta. A menos de 8 m camina. */
      if (dd > 8) { ref.x = refX; ref.z = refZ; ref.vx = ref.vz = 0; }
      ref.tx = refX; ref.tz = refZ; ref.maxSp = 8.6; ref.faceLock = false;
    } else if (ref) {
      refX = ref.x; refZ = ref.z;
    }
    if (a && !foul) {
      a.anim = {type: "card", t: 0, dur: 1.3};
      a.passTarget = null; a.tx = a.x; a.tz = a.z; a.maxSp = 0;
    }
    sim.action = {type: "card", stage: foul ? "foul" : "approach", t: 0, dur: 3.4, side: side, res: e.t,
      player: a, ref: ref, refX: refX, refZ: refZ, showT: 0, foul: foul,
      freeKick: isFoul};
    if (foul) { cam.cutT = 1.2; cam.cutMode = "foul"; }
    if (e.t === "red" && a) sim.red[side][a.key] = true;
    sim.lastCard = {side: side, res: e.t, player: a ? a.slot : -1,
      referee: !!ref, visible: false};
    cam.cutT = 1.8; cam.cutMode = "card";
    fireCue(e);
  }

  function doHalf() {
    if (sim.half === 2) return;
    startHalfCinema();
  }

  function doEnd() {
    startEndCinema();
  }

  function handleEvent(e) {
    if (!e) return;
    if (sim.replay) { sim.queue.push(e); return; }
    var t = String(e.t || "").toLowerCase();
    if (sim.ended && t !== "end") { fireCue(e); return; }
    /* Las secuencias de vestuario no se interrumpen con acciones de juego. */
    if (sim.cinema && t !== "half" && t !== "end") { fireCue(e); return; }
    /* no cortar un gol o una tarjeta que se está representando en el 45' */
    if ((t === "half" || t === "end") && sim.action) { sim.queue.push(e); return; }
    if (t === "half") { sfx("whistle", [0.32, 0.9]); doHalf(); fireCue(e); return; }
    if (t === "end") { sfx("whistle", [0.3, 0.3, 1.2]); doEnd(); fireCue(e); return; }
    if (t === "goal" || t === "save" || t === "post" || t === "miss") {
      /* Un tiro no puede nacer en mitad de un pase: el balón terminaría
       * cambiando de dirección en el aire. Se encola hasta la recepción; el
       * pendiente de marcador se anota cuando el tiro arranca de verdad. */
      if (sim.ball.mode === "flight" && sim.ball.next) { sim.queue.push(e); return; }
      e.t = t; startShot(e); return;
    }
    if (t === "yellow" || t === "red") { e.t = t; startCard(e); return; }
    /* Balones parados que pueden llegar desde el motor o desde una prueba.
     * Se tratan como una puesta en escena completa, no como un pase corto. */
    if (t === "corner") {
      if (sim.action) { sim.queue.push(e); return; }
      var cs = +e.side === 1 ? 1 : 0;
      var ce = e.end != null ? (e.end ? 1 : 0) : (sim.attack[cs] > 0 ? 1 : 0);
      sfx("whistle", [0.2]);
      setupCorner(cs, ce); fireCue(e); return;
    }
    if (t === "free" || t === "freekick" || t === "free-kick") {
      if (sim.action) { sim.queue.push(e); return; }
      sfx("whistle", [0.2]);
      setupFreeKick(+e.side === 1 ? 1 : 0, e.x != null ? +e.x : null, e.z != null ? +e.z : null);
      fireCue(e); return;
    }
    if (t === "penalty") {
      if (sim.action) { sim.queue.push(e); return; }
      sfx("whistle", [0.24]);
      setupPenalty(+e.side === 1 ? 1 : 0, e.res || e.r, e.who);
      fireCue(e); return;
    }
    if (t === "pass") {
      var ps = +e.side === 1 ? 1 : 0, pa = e.who != null ? actorAt(ps, +e.who) : null;
      if (!startVisualPass(e, ps, pa)) sim.pendingPass = {e: e, side: ps, who: pa, until: sim.time + 4};
      fireCue(e); return;
    }
    if (t === "tackle") {
      /* El motor nombra a un jugador al azar: la entrada la hace quien está
       * de verdad junto al balón (o la presión en curso ya la representa). */
      var ts = +e.side === 1 ? 1 : 0, named = e.who != null ? actorAt(ts, +e.who) : null, ta = nearestActor(ts, sim.ball.x, sim.ball.z, true);
      if (named && !named.gk && dist(named.x, named.z, sim.ball.x, sim.ball.z) < 9) ta = named;
      if (!(sim.challenge && sim.challenge.side === ts) && ta && dist(ta.x, ta.z, sim.ball.x, sim.ball.z) < (ta === named ? 9 : 5) && !sim.action) {
        ta.visualAnim = {type: "tackle", t: 0, dur: 0.75, dir: sim.ball.z >= ta.z ? 1 : -1}; fxTackle(ta);
      }
      fireCue(e); return;
    }
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
    cam.cutT = 0; cam.cutMode = "";
    var snap = {ball: {x: sim.ball.x, y: sim.ball.y, z: sim.ball.z, vx: sim.ball.vx, vy: sim.ball.vy, vz: sim.ball.vz,
      mode: sim.ball.mode, side: sim.ball.side, idx: sim.ball.idx, lastTouch: sim.ball.lastTouch, fl: sim.ball.fl, next: sim.ball.next}, p: [[], []]};
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s][i];
      snap.p[s].push(a ? {x: a.x, z: a.z, facing: a.facing, vx: a.vx, vz: a.vz, anim: a.anim} : null);
    }
    sim.replay = {frames: sim.history.slice(-40), t: 0, dur: 3.6, save: snap};
    cam.cutT = sim.replay.dur; cam.cutMode = "replay";
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
      if (a && pa && pb) { a.x = lerp(pa[0], pb[0], u); a.z = lerp(pa[1], pb[1], u); a.facing = pa[2]; a.runPhase = pa[3]; a.lean = 0; a.bank = 0; }
    }
    if (k >= 1) endReplay();
  }

  /* ------------------------------------------------------------------ cámara */

  /* Cámara fija para revisar el arte (pruebas y capturas). */
  var camLock = null;
  function updateCamera(dt) {
    if (camLock) { for (var ck in camLock) if (camLock.hasOwnProperty(ck)) cam[ck] = camLock[ck]; return; }
    if (sim.cinema) { updateCinemaCamera(dt); return; }
    var b = sim.ball, tx = b.x, tz = b.z, back = 34, height = 22;
    var goalDist = Math.min(Math.abs(b.x), Math.abs(LEN - b.x));
    var danger = clamp(1 - goalDist / 35, 0, 1);
    back -= danger * 9; height -= danger * 6;
    if (sim.action && sim.action.type === "shot") { back = 31; height = 19; tx = b.x; tz = b.z; }
    if (sim.action && sim.action.type === "goalkick") {
      tx = b.x; tz = b.z; back = 18; height = 10;
      if (sim.action.phase === "windup" || sim.action.phase === "plant" ||
        sim.action.phase === "impact" || sim.action.phase === "follow") { back = 14; height = 8.5; }
    }
    if (sim.action && sim.action.shooter && sim.action.stage === "outcome" && sim.action.res === "goal") {
      tx = sim.action.shooter.x; tz = sim.action.shooter.z; back = 24; height = 14;
    }
    if (sim.action && sim.action.type === "card") {
      var cp = sim.action.player || sim.action.ref, fv = sim.action.foul;
      if (sim.action.stage === "foul" && fv && fv.victim) {
        /* la jugada de la falta: plano medio entre víctima e infractor */
        tx = cp ? (cp.x + fv.victim.x) / 2 : fv.victim.x; tz = cp ? (cp.z + fv.victim.z) / 2 : fv.victim.z;
        back = 17; height = 9.5;
      } else {
        tx = cp ? cp.x : b.x; tz = cp ? cp.z : b.z;
        back = 12.5; height = 6.8;
      }
    }
    if (sim.action && sim.action.kind === "penalty") {
      tx = sim.action.shooter ? sim.action.shooter.x : b.x;
      tz = sim.action.shooter ? sim.action.shooter.z : b.z;
      back = 20; height = 10;
    }
    if (sim.replay) { back = 28; height = 17; }
    /* Cortes de retransmisión: acercan la cámara en tiros, celebraciones y
     * repeticiones sin romper el seguimiento suave del balón. */
    if (cam.cutT > 0) {
      cam.cutT = Math.max(0, cam.cutT - dt);
      if (cam.cutMode === "shot") { back = Math.min(back, 26); height = Math.min(height, 16); }
      else if (cam.cutMode === "goal") { back = Math.min(back, 22); height = Math.min(height, 13); tx = sim.action && sim.action.shooter ? sim.action.shooter.x : tx; tz = sim.action && sim.action.shooter ? sim.action.shooter.z : tz; }
      else if (cam.cutMode === "replay") { back = 24; height = 15; }
      if (cam.cutT <= 0) cam.cutMode = "";
    }
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

  /* ------------------------------------------------------------------ assets GLB / skinning */

  function loadAssets() {
    if (assetState !== "none") return;
    assetState = "unavailable";
    try {
      if (typeof P3D_ASSET_PACK === "undefined" || !P3D_ASSET_PACK ||
        typeof Pitch3DAssets === "undefined" || !Pitch3DAssets.load) return;
      assetModels = Pitch3DAssets.load(P3D_ASSET_PACK);
      var male = assetModels && assetModels.players && assetModels.players.male;
      if (male && (male[1] || male[2])) assetState = "ready";
      else assetState = "failed";
      if (assetModels && assetModels.errors && assetModels.errors.length && window.console) {
        console.warn("Pitch3D: algunos GLB no se pudieron cargar", assetModels.errors);
      }
    } catch (err) {
      assetModels = null; assetState = "failed";
      if (window.console) console.warn("Pitch3D: fallback procedural, assets no disponibles", err);
    }
  }

  function mat4TRS(out, o, tr, ti, rot, ri, sc, si) {
    var x = tr[ti], y = tr[ti + 1], z = tr[ti + 2];
    var qx = rot[ri], qy = rot[ri + 1], qz = rot[ri + 2], qw = rot[ri + 3];
    var ql = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;
    qx /= ql; qy /= ql; qz /= ql; qw /= ql;
    var sx = sc[si], sy = sc[si + 1], sz = sc[si + 2];
    out[o] = (1 - 2 * (qy * qy + qz * qz)) * sx;
    out[o + 1] = (2 * (qx * qy + qz * qw)) * sx;
    out[o + 2] = (2 * (qx * qz - qy * qw)) * sx;
    out[o + 3] = 0;
    out[o + 4] = (2 * (qx * qy - qz * qw)) * sy;
    out[o + 5] = (1 - 2 * (qx * qx + qz * qz)) * sy;
    out[o + 6] = (2 * (qy * qz + qx * qw)) * sy;
    out[o + 7] = 0;
    out[o + 8] = (2 * (qx * qz + qy * qw)) * sz;
    out[o + 9] = (2 * (qy * qz - qx * qw)) * sz;
    out[o + 10] = (1 - 2 * (qx * qx + qy * qy)) * sz;
    out[o + 11] = 0;
    out[o + 12] = x; out[o + 13] = y; out[o + 14] = z; out[o + 15] = 1;
  }

  function mat4MulAt(out, oo, a, ao, b, bo) {
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      out[oo + c * 4 + r] = a[ao + r] * b[bo + c * 4] + a[ao + 4 + r] * b[bo + c * 4 + 1] +
        a[ao + 8 + r] * b[bo + c * 4 + 2] + a[ao + 12 + r] * b[bo + c * 4 + 3];
  }

  function trackAt(track, t, comps, out, off) {
    var times = track.times, vals = track.values, n = times.length;
    if (!n) return;
    var i = 0;
    if (t <= times[0]) { for (var z = 0; z < comps; z++) out[off + z] = vals[z]; return; }
    if (t >= times[n - 1]) { for (var e = 0; e < comps; e++) out[off + e] = vals[(n - 1) * comps + e]; return; }
    var lo = 0, hi = n - 1;
    while (lo + 1 < hi) { i = (lo + hi) >> 1; if (times[i] <= t) lo = i; else hi = i; }
    i = lo;
    var span = times[i + 1] - times[i] || 1, u = (t - times[i]) / span;
    for (var k = 0; k < comps; k++) out[off + k] = lerp(vals[i * comps + k], vals[(i + 1) * comps + k], u);
  }

  function quatAt(track, t, out, off) {
    var times = track.times, vals = track.values, n = times.length;
    if (!n) return;
    var i = 0;
    if (t <= times[0]) { out[off] = vals[0]; out[off + 1] = vals[1]; out[off + 2] = vals[2]; out[off + 3] = vals[3]; return; }
    if (t >= times[n - 1]) { i = (n - 1) * 4; out[off] = vals[i]; out[off + 1] = vals[i + 1]; out[off + 2] = vals[i + 2]; out[off + 3] = vals[i + 3]; return; }
    var lo = 0, hi = n - 1, mid;
    while (lo + 1 < hi) { mid = (lo + hi) >> 1; if (times[mid] <= t) lo = mid; else hi = mid; }
    var j = lo * 4, k = (lo + 1) * 4;
    var span = times[lo + 1] - times[lo] || 1, u = (t - times[lo]) / span;
    var ax = vals[j], ay = vals[j + 1], az = vals[j + 2], aw = vals[j + 3];
    var bx = vals[k], by = vals[k + 1], bz = vals[k + 2], bw = vals[k + 3];
    var dot = ax * bx + ay * by + az * bz + aw * bw;
    if (dot < 0) { bx = -bx; by = -by; bz = -bz; bw = -bw; dot = -dot; }
    if (dot > 0.9995) {
      var ix = lerp(ax, bx, u), iy = lerp(ay, by, u), iz = lerp(az, bz, u), iw = lerp(aw, bw, u);
      var il = Math.sqrt(ix * ix + iy * iy + iz * iz + iw * iw) || 1;
      out[off] = ix / il; out[off + 1] = iy / il; out[off + 2] = iz / il; out[off + 3] = iw / il;
    } else {
      var th = Math.acos(clamp(dot, -1, 1)), s = Math.sin(th) || 1;
      var wa = Math.sin((1 - u) * th) / s, wb = Math.sin(u * th) / s;
      out[off] = ax * wa + bx * wb; out[off + 1] = ay * wa + by * wb;
      out[off + 2] = az * wa + bz * wb; out[off + 3] = aw * wa + bw * wb;
    }
  }

  function assetScratch(model) {
    if (model._p3dScratch) return model._p3dScratch;
    var n = model.parents.length, verts = model.positions.length / 3;
    model._p3dScratch = {
      local: new Float32Array(n * 16), world: new Float32Array(n * 16), skin: new Float32Array(n * 16), skin2: new Float32Array(n * 16),
      t: new Float32Array(n * 3), r: new Float32Array(n * 4), s: new Float32Array(n * 3),
      pos: new Float32Array(verts * 3), pos2: new Float32Array(verts * 3)
    };
    return model._p3dScratch;
  }

  /* La pose se evalúa y se deforma en CPU, jugador a jugador. Los vértices
   * vienen sin indexar (3 por triángulo), así que el resultado se puede
   * escribir directamente en el VBO dinámico común del partido. */
  /* Solo la pose: matrices de skinning (mundo × inversa de bind) por hueso. */
  function evalBones(model, clip, time, sc, skinOut) {
    var n = model.parents.length, i, k;
    sc.t.set(model.bindT); sc.r.set(model.bindR); sc.s.set(model.bindS);
    for (i = 0; i < clip.tracks.length; i++) {
      var tr = clip.tracks[i], u = time;
      if (tr.path === "rotation") quatAt(tr, u, sc.r, tr.node * 4);
      else if (tr.path === "translation") {
        trackAt(tr, u, 3, sc.t, tr.node * 3);
        if (tr.node === 0) { sc.t[0] = model.bindT[0]; sc.t[2] = model.bindT[2]; }
      } else if (tr.path === "scale") trackAt(tr, u, 3, sc.s, tr.node * 3);
    }
    for (i = 0; i < n; i++) mat4TRS(sc.local, i * 16, sc.t, i * 3, sc.r, i * 4, sc.s, i * 3);
    for (i = 0; i < n; i++) {
      var o = i * 16, p = model.parents[i];
      if (p >= 0) mat4MulAt(sc.world, o, sc.world, p * 16, sc.local, o);
      else for (k = 0; k < 16; k++) sc.world[o + k] = sc.local[o + k];
    }
    var out = skinOut || sc.skin;
    for (i = 0; i < n; i++) mat4MulAt(out, i * 16, sc.world, i * 16, model.ibm, i * 16);
  }

  function evalModel(model, clip, time, sc, dst) {
    var n = model.parents.length, i, k;
    sc.t.set(model.bindT); sc.r.set(model.bindR); sc.s.set(model.bindS);
    for (i = 0; i < clip.tracks.length; i++) {
      var tr = clip.tracks[i], u = time;
      if (tr.path === "rotation") quatAt(tr, u, sc.r, tr.node * 4);
      else if (tr.path === "translation") {
        trackAt(tr, u, 3, sc.t, tr.node * 3);
        /* El desplazamiento lateral del clip dive duplicaría el movimiento
         * del actor; se conserva solo la altura del hueso raíz. */
        if (tr.node === 0) { sc.t[0] = model.bindT[0]; sc.t[2] = model.bindT[2]; }
      } else if (tr.path === "scale") trackAt(tr, u, 3, sc.s, tr.node * 3);
    }
    for (i = 0; i < n; i++) mat4TRS(sc.local, i * 16, sc.t, i * 3, sc.r, i * 4, sc.s, i * 3);
    for (i = 0; i < n; i++) {
      var o = i * 16, p = model.parents[i];
      if (p >= 0) mat4MulAt(sc.world, o, sc.world, p * 16, sc.local, o);
      else for (k = 0; k < 16; k++) sc.world[o + k] = sc.local[o + k];
    }
    for (i = 0; i < n; i++) mat4MulAt(sc.skin, i * 16, sc.world, i * 16, model.ibm, i * 16);
    var pos = model.positions, jnt = model.joints, wgt = model.weights, out = dst || sc.pos;
    for (i = 0, k = 0; i < pos.length; i += 3, k += 4) {
      var px = pos[i], py = pos[i + 1], pz = pos[i + 2], x = 0, y = 0, z = 0;
      for (var wi = 0; wi < 4; wi++) {
        var w = wgt[k + wi];
        if (!w) continue;
        var b = jnt[k + wi] * 16;
        x += w * (sc.skin[b] * px + sc.skin[b + 4] * py + sc.skin[b + 8] * pz + sc.skin[b + 12]);
        y += w * (sc.skin[b + 1] * px + sc.skin[b + 5] * py + sc.skin[b + 9] * pz + sc.skin[b + 13]);
        z += w * (sc.skin[b + 2] * px + sc.skin[b + 6] * py + sc.skin[b + 10] * pz + sc.skin[b + 14]);
      }
      out[i] = x; out[i + 1] = y; out[i + 2] = z;
    }
  }

  function runClip(a) {
    return {name: "run", t: (a.runPhase / TAU) * 0.8, loop: true};
  }

  function actorClip(a) {
    var anim = a.anim, sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
    /* Saludar no puede convertir al árbitro en un jugador que celebra. Si el
     * actor aún camina hacia su sitio, la locomoción manda sobre el gesto. */
    if (anim && anim.type === "greet" && sp > 0.9) return runClip(a);
    /* Animaciones procedurales de transición (Opción A): reutilizan los clips
     * existentes para no depender de nuevos GLB. */
    if (a.visualAnim) {
      var vk = clamp(a.visualAnim.t / Math.max(0.01, a.visualAnim.dur), 0, 1);
      if (a.visualAnim.type === "pass") return {name: "kick", t: vk * 0.85, loop: false};
      /* El tackle de un jugador de campo no es una estirada de portero. Se
       * resuelve con el golpeo y una inclinación procedural; solo el portero
       * puede usar `dive`. */
      if (a.visualAnim.type === "tackle") {
        if (a.gk) return {name: "dive", t: vk * 0.9, loop: false};
        return {name: "kick", t: vk * 0.62, loop: false};
      }
      if (a.visualAnim.type === "save" && a.gk) return {name: "dive", t: vk * 0.9, loop: false};
    }
    if (anim) {
      var k = clamp(anim.t / Math.max(0.01, anim.dur), 0, 1);
      /* Clips explícitos: permite añadir nuevas animaciones al GLB sin tocar
       * esta función ni la state machine. */
      if (anim.clip) return {name: anim.clip, t: k * (anim.clipDur || anim.dur || 1), loop: !!anim.loop};
      if (anim.type === "dive") return {name: "dive", t: k * 1.25, loop: false};
      if (anim.type === "kick") return {name: "kick", t: k * 0.85, loop: false};
      if (anim.type === "gkstrike") return {name: "kick", t: k * 0.98, loop: false};
      if (anim.type === "gkready" || anim.type === "gkshield") return {name: "idle", t: a.phase * 2 + sim.time * 0.35, loop: true};
      if (anim.type === "celebrate") return {name: "celebrate", t: k * 1.7, loop: false};
      if (anim.type === "greet") return {name: "idle", t: a.phase * 2 + sim.time * 0.35, loop: true};
      if (anim.type === "card") {
        /* El árbitro reutiliza el gesto de brazos en alto; la tarjeta visible
         * se dibuja aparte. Nunca se deja el clip bloqueado tras la acción. */
        if (a.official === "ref") return {name: "celebrate", t: k * 1.15, loop: false};
        return {name: "idle", t: a.phase * 2 + sim.time * 0.35, loop: true};
      }
    }
    if (sp > 0.65) return runClip(a);
    return {name: "idle", t: a.phase * 2 + sim.time * 0.35, loop: true};
  }

  function assetPalette(a) {
    if (a.official) {
      var dark = a.official === "ref" ? [0.055, 0.06, 0.07] : [0.085, 0.095, 0.105];
      return {kit_shirt: dark, kit_shorts: [0.04, 0.045, 0.055], kit_socks: [0.92, 0.78, 0.16],
        kit_trim: [0.98, 0.84, 0.20], skin: a.skin || SKIN, hair: a.hair || HAIR, boots: BOOT,
        gloves: [0.98, 0.48, 0.16]};
    }
    var shirt = a.gk ? (a.side ? [0.55, 0.26, 0.76] : [0.96, 0.55, 0.12]) : (colors[a.side] || rgb(SHIRT[a.side]));
    var shorts = a.gk ? [0.08, 0.10, 0.12] : (SHORTS[a.side] || SHORTS[0]);
    return {kit_shirt: shirt, kit_shorts: shorts, kit_socks: shirt, kit_trim: [0.96, 0.86, 0.55],
      skin: a.skin || SKIN, hair: a.hair || HAIR, boots: BOOT, gloves: [0.98, 0.48, 0.16]};
  }

  /* Tarjeta en la mano del árbitro. Es una geometría barata orientada a la
   * cámara: se levanta al empezar el gesto y se guarda al final. */
  function drawRefCard(m, a) {
    var anim = a && a.anim;
    if (!a || a.official !== "ref" || !anim || anim.type !== "card") return;
    var k = clamp(anim.t / Math.max(0.01, anim.dur), 0, 1);
    var up = clamp(k / 0.22, 0, 1); up = up * up * (3 - 2 * up);
    var down = k > 0.84 ? clamp((k - 0.84) / 0.16, 0, 1) : 0;
    var y = 1.42 + up * 0.62 - down * 0.72;
    var ca = Math.cos(a.facing), sa = Math.sin(a.facing);
    var cx = a.x + 0.43 * ca + 0.18 * sa;
    var cz = a.z - 0.43 * sa + 0.18 * ca;
    var dx = cam.x - cx, dz = cam.z - cz, dl = Math.sqrt(dx * dx + dz * dz) || 1;
    var rx = dz / dl, rz = -dx / dl;
    var w = 0.145, h = 0.215;
    var pushX = dx / dl * 0.012, pushZ = dz / dl * 0.012;
    /* borde claro y interior de color: la tarjeta se lee incluso en móvil */
    m.tri9(cx + rx * (w + 0.022) + pushX, y - h / 2 - 0.018, cz + rz * (w + 0.022) + pushZ,
      cx - rx * (w + 0.022) + pushX, y - h / 2 - 0.018, cz - rz * (w + 0.022) + pushZ,
      cx - rx * (w + 0.022) + pushX, y + h / 2 + 0.018, cz - rz * (w + 0.022) + pushZ,
      0.96, 0.96, 0.93);
    m.tri9(cx + rx * (w + 0.022) + pushX, y - h / 2 - 0.018, cz + rz * (w + 0.022) + pushZ,
      cx - rx * (w + 0.022) + pushX, y + h / 2 + 0.018, cz - rz * (w + 0.022) + pushZ,
      cx + rx * (w + 0.022) + pushX, y + h / 2 + 0.018, cz + rz * (w + 0.022) + pushZ,
      0.96, 0.96, 0.93);
    var col = anim.res === "red" ? [0.90, 0.045, 0.055] : [0.99, 0.82, 0.10];
    m.tri9(cx + rx * w + pushX, y - h / 2, cz + rz * w + pushZ,
      cx - rx * w + pushX, y - h / 2, cz - rz * w + pushZ,
      cx - rx * w + pushX, y + h / 2, cz - rz * w + pushZ,
      col[0], col[1], col[2]);
    m.tri9(cx + rx * w + pushX, y - h / 2, cz + rz * w + pushZ,
      cx - rx * w + pushX, y + h / 2, cz - rz * w + pushZ,
      cx + rx * w + pushX, y + h / 2, cz + rz * w + pushZ,
      col[0], col[1], col[2]);
  }

  /* Oclusión de contacto: un disco de césped más oscuro en el centro que se
   * funde con el campo (el shader pinta el césped). Las sombras reales las
   * pone el mapa de sombras. */
  function aoDisc(m, x, z, rx, rz, core, seg) {
    seg = seg || 12; m.code = MAT_GRASS;
    var col = GRASS, y = 0.006;
    for (var i = 0; i < seg; i++) {
      var a0 = i * TAU / seg, a1 = (i + 1) * TAU / seg;
      m.triAO(x, y, z, x + Math.cos(a0) * rx, y, z + Math.sin(a0) * rz, x + Math.cos(a1) * rx, y, z + Math.sin(a1) * rz,
        col[0], col[1], col[2], core, 1, 1);
    }
    m.code = -1;
  }
  function drawContactShadow(m, a, q, far) {
    aoDisc(m, a.x, a.z, 0.62, 0.62, far ? 0.55 : 0.42, q ? 14 : 8);
  }

  function buildAssetPlayer(m, a) {
    if (!assetModels || assetState !== "ready") return false;
    var variant = a.variant || actorVariant(a), set = assetModels.players[variant];
    if (!set) return false;
    var d2 = dist2(a.x, a.z, cam.lookX, cam.lookZ);
    var model = (quality > 0.72 && d2 < 24 * 24) ? set[1] : set[2];
    if (!model) model = set[1] || set[2];
    if (!model || !model.clips) return false;
    var info = actorClip(a), clip = model.clips[info.name] || model.clips.idle;
    if (!clip) return false;
    var sc = assetScratch(model);
    var t = info.loop ? info.t % clip.dur : clamp(info.t, 0, clip.dur);
    if (t < 0) t += clip.dur;

    /* Cross-fade de 0.18 s entre clips: evita el salto seco idle→run→kick
       y da transiciones de animación propias de un juego actual. */
    var now = sim.time, dt = a.assetLastTime == null ? 0 : Math.max(0, now - a.assetLastTime);
    a.assetLastTime = now;
    if (a.assetPrev) {
      a.assetPrev.t += dt;
      var pdur = a.assetPrev.dur || 1;
      if (a.assetPrev.loop && pdur > 0) a.assetPrev.t %= pdur;
    }
    if (a.assetClipName !== info.name) {
      a.assetPrev = a.assetClip ? {name: a.assetClip.name, t: a.assetClip.t, loop: a.assetClip.loop, dur: a.assetClip.dur} : null;
      a.assetClip = {name: info.name, t: t, loop: info.loop, dur: clip.dur};
      a.assetClipName = info.name;
      a.assetBlend = a.assetPrev ? 0.18 : 0;
    } else if (a.assetClip) {
      a.assetClip.t = t; a.assetClip.loop = info.loop; a.assetClip.dur = clip.dur;
    }
    if (a.assetBlend > 0) {
      a.assetBlend = Math.max(0, a.assetBlend - dt);
      if (a.assetBlend <= 0) a.assetPrev = null;
    }
    evalBones(model, clip, t, sc);
    if (a.assetPrev && a.assetBlend > 0) {
      var prevClip = model.clips[a.assetPrev.name];
      if (prevClip) {
        var pu = clamp(1 - a.assetBlend / 0.18, 0, 1);
        pu = pu * pu * (3 - 2 * pu);
        evalBones(model, prevClip, a.assetPrev.t, sc, sc.skin2);
        for (var bi = 0; bi < sc.skin.length; bi++) sc.skin[bi] = sc.skin2[bi] + (sc.skin[bi] - sc.skin2[bi]) * pu;
      }
    }

    var far = d2 > 1600, q = quality < 0.7 || far ? 0 : 1;
    drawContactShadow(m, a, q, far);
    if (sim.ball.mode === "held" && sim.ball.side === a.side && sim.ball.idx === a.slot) {
      m.code = MAT_EMIT; m.ring(a.x, a.z, 0.62, 0.08, [0.98, 0.78, 0.22], 16, 0.03); m.code = -1;
    }
    var tackleK = 0;
    if (a.visualAnim && a.visualAnim.type === "tackle" && !a.gk) {
      tackleK = Math.sin(clamp(a.visualAnim.t / Math.max(0.01, a.visualAnim.dur), 0, 1) * PI);
    }
    var lean = (a.lean || 0) + tackleK * 0.06;
    var bank = (a.bank || 0) + tackleK * 0.24 * (a.visualAnim && a.visualAnim.dir ? a.visualAnim.dir : 1);
    var tris = buildVoxelBody(m, a, sc.skin, assetPalette(a), far || quality < 0.62, lean, bank);
    assetFrameTris += tris;
    assetFramePlayers++;
    return true;
  }

  /* ------------------------------------------------------------------ jugadores vóxel */
  /* Cuerpo de bloques robusto (cabeza grande, tronco cuadrado, extremidades
   * gruesas) unido a los 22 huesos del esqueleto GLB: cada pieza se define en
   * la pose de reposo y se mueve con la matriz de su hueso, así los clips
   * idle/run/kick/dive/celebrate siguen sirviendo tal cual. Huesos: 1 cadera,
   * 2 espalda, 3 pecho, 4 cuello, 5 cabeza, 7-9 brazo izq., 11-13 brazo der.,
   * 14-17 pierna izq., 18-21 pierna der. +x es la izquierda del jugador, +z delante. */
  var VOX_PARTS = [
    /* hueso, x0, y0, z0, x1, y1, z1, color, detalle(1)=solo de cerca, espejo */
    [1, -0.21, 0.76, -0.145, 0.21, 1.02, 0.145, "kit_shorts"],
    [2, -0.23, 1.00, -0.155, 0.23, 1.23, 0.155, "kit_shirt"],
    [3, -0.25, 1.21, -0.165, 0.25, 1.49, 0.165, "kit_shirt"],
    [3, -0.13, 1.47, -0.12, 0.13, 1.51, 0.13, "kit_trim", 1],
    [2, -0.235, 1.00, -0.16, 0.235, 1.04, 0.16, "kit_trim", 1],
    [4, -0.08, 1.46, -0.08, 0.08, 1.57, 0.08, "skin"],
    [5, -0.20, 1.55, -0.18, 0.20, 1.93, 0.20, "skin"],
    [5, 0.055, 1.71, 0.198, 0.115, 1.78, 0.212, "eye", 1, 1],
    [5, 0.045, 1.80, 0.198, 0.125, 1.825, 0.212, "hair", 1, 1],
    [5, -0.04, 1.62, 0.198, 0.04, 1.645, 0.21, "mouth", 1],
    [7, 0.25, 1.26, -0.09, 0.40, 1.49, 0.09, "kit_shirt", 0, 1],
    [7, 0.265, 1.12, -0.075, 0.385, 1.27, 0.075, "arm", 0, 1],
    [8, 0.265, 0.93, -0.072, 0.385, 1.14, 0.072, "arm", 0, 1],
    [9, 0.27, 0.81, -0.075, 0.38, 0.95, 0.075, "hand", 0, 1],
    [14, 0.015, 0.66, -0.11, 0.215, 0.88, 0.11, "kit_shorts", 0, 1],
    [14, 0.03, 0.50, -0.095, 0.20, 0.67, 0.095, "skin", 0, 1],
    [15, 0.035, 0.12, -0.09, 0.195, 0.52, 0.09, "kit_socks", 0, 1],
    [15, 0.03, 0.43, -0.095, 0.20, 0.49, 0.095, "kit_trim", 1, 1],
    [16, 0.03, 0.0, -0.10, 0.20, 0.15, 0.13, "boots", 0, 1],
    [17, 0.04, 0.0, 0.12, 0.19, 0.10, 0.23, "boots", 0, 1]
  ];
  /* peinados: cada uno es una lista de bloques sobre la cabeza */
  var HAIR_STYLES = [
    [[-0.21, 1.85, -0.21, 0.21, 1.96, 0.18], [-0.21, 1.64, -0.21, 0.21, 1.86, -0.13], [0.17, 1.74, -0.13, 0.21, 1.87, 0.08], [-0.21, 1.74, -0.13, -0.17, 1.87, 0.08]],
    [[-0.205, 1.89, -0.19, 0.205, 1.945, 0.17]],
    [[-0.07, 1.90, -0.20, 0.07, 2.02, 0.16], [-0.205, 1.88, -0.19, 0.205, 1.93, 0.15]],
    [[-0.22, 1.83, -0.22, 0.22, 1.99, 0.20], [-0.22, 1.60, -0.22, 0.22, 1.86, -0.12], [0.17, 1.66, -0.14, 0.22, 1.88, 0.12], [-0.22, 1.66, -0.14, -0.17, 1.88, 0.12], [-0.22, 1.86, 0.15, 0.22, 1.91, 0.21]],
    []
  ];
  var HAIR_FEM = [[-0.22, 1.84, -0.22, 0.22, 1.98, 0.20], [-0.22, 1.50, -0.23, 0.22, 1.86, -0.12], [0.17, 1.58, -0.14, 0.22, 1.88, 0.10],
    [-0.22, 1.58, -0.14, -0.17, 1.88, 0.10], [-0.07, 1.36, -0.30, 0.07, 1.62, -0.20]];
  var DIGITS = ["111101101101111", "010110010010111", "111001111100111", "111001111001111", "101101111001001",
    "111100111001111", "111100111101111", "111001010010010", "111101111101111", "111101111001111"];
  var voxQ = new Float32Array(24), voxM = new Float32Array(16);

  function luma(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }

  function buildVoxelBody(m, a, skin, pal, low, lean, bank) {
    var start = m.n, scale = (a.scale || 1) * 0.93, ca = Math.cos(a.facing), sa = Math.sin(a.facing);
    var shirt = pal.kit_shirt, trim = pal.kit_trim || [0.95, 0.9, 0.7];
    var cols = {kit_shirt: shirt, kit_shorts: pal.kit_shorts, kit_socks: pal.kit_socks || shirt, kit_trim: trim, skin: pal.skin,
      hair: pal.hair, boots: pal.boots || BOOT, eye: [0.06, 0.05, 0.05], mouth: shade(pal.skin, 0.62),
      arm: a.gk ? shirt : pal.skin, hand: a.gk ? (pal.gloves || [0.98, 0.48, 0.16]) : pal.skin};
    var tris = 0;
    function part(bone, x0, y0, z0, x1, y1, z1, col, lo) {
      boxCorners(skin, bone * 16, x0, y0, z0, x1, y1, z1, voxQ);
      for (var k = 0; k < 24; k += 3) {
        var px = voxQ[k] * scale, py = voxQ[k + 1] * scale, pz = voxQ[k + 2] * scale;
        var lx = px + bank * py, lz = pz + lean * py;
        voxQ[k] = a.x + lx * ca + lz * sa; voxQ[k + 1] = py; voxQ[k + 2] = a.z - lx * sa + lz * ca;
      }
      m.cornerBox(voxQ, col, lo == null ? 0.8 : lo);
      tris += 12;
    }
    m.code = MAT_MATTE;
    for (var i = 0; i < VOX_PARTS.length; i++) {
      var P = VOX_PARTS[i];
      if (P[8] && low) continue;
      var col = cols[P[7]] || shirt, bone = P[0];
      part(bone, P[1], P[2], P[3], P[4], P[5], P[6], col);
      if (P[9]) part(bone === 7 ? 11 : bone === 8 ? 12 : bone === 9 ? 13 : bone === 14 ? 18 : bone === 15 ? 19 : bone === 16 ? 20 : bone === 17 ? 21 : bone,
        -P[4], P[2], P[3], -P[1], P[5], P[6], col);
    }
    /* pelo */
    var hs = a.variant === "female" ? HAIR_FEM : HAIR_STYLES[(a.phase * 997 | 0) % HAIR_STYLES.length];
    if (a.official) hs = HAIR_STYLES[1];
    for (var h = 0; h < hs.length; h++) {
      if (low && h > 1) break;
      var H = hs[h]; part(5, H[0], H[1], H[2], H[3], H[4], H[5], cols.hair, 0.9);
    }
    /* dorsal en la espalda y escudo en el pecho (de cerca) */
    if (!low && !a.official && a.number > 0) {
      var num = String(a.number % 100), px = 0.052, nw = num.length * 3 * px + (num.length - 1) * px * 0.8;
      var numCol = luma(shirt) > 0.55 ? [0.08, 0.09, 0.12] : [0.97, 0.97, 0.95];
      for (var d = 0; d < num.length; d++) {
        var g = DIGITS[+num.charAt(d)], ox = nw / 2 - d * (3 * px + px * 0.8);
        for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) {
          if (g.charAt(r * 3 + c) !== "1") continue;
          var x0 = ox - (c + 1) * px, y1 = 1.45 - r * px;
          part(3, x0, y1 - px, -0.178, x0 + px, y1, -0.163, numCol, 1);
        }
      }
      part(3, 0.08, 1.36, 0.163, 0.15, 1.43, 0.178, trim, 1);
    }
    m.code = -1;
    return tris;
  }

  /* ------------------------------------------------------------------ dibujo jugadores */

  function buildPlayer(m, a) {
    var dxc = a.x - cam.x, dzc = a.z - cam.z, far = dxc * dxc + dzc * dzc > 1600;
    var q = quality < 0.7 || far ? 0 : 1, seg = q ? 8 : 6, rings = q ? 5 : 4;
    var shirt = a.official ? (a.official === "ref" ? [0.055, 0.06, 0.07] : [0.085, 0.095, 0.105]) :
      a.gk ? (a.side ? [0.55, 0.26, 0.76] : [0.96, 0.55, 0.12]) : (colors[a.side] || rgb(SHIRT[a.side]));
    var shorts = a.official ? [0.04, 0.045, 0.055] : a.gk ? [0.08, 0.10, 0.12] : (SHORTS[a.side] || SHORTS[0]);
    var skin = a.skin || SKIN, hair = a.hair || HAIR;
    var sp = Math.sqrt(a.vx * a.vx + a.vz * a.vz), run = clamp(sp / 6, 0, 1);
    var gait = Math.sin(a.runPhase) * 0.32 * run, gait2 = Math.sin(a.runPhase + PI) * 0.32 * run;
    var liftL = Math.max(0, Math.cos(a.runPhase)) * 0.12 * run;
    var liftR = Math.max(0, Math.cos(a.runPhase + PI)) * 0.12 * run;
    var jump = 0, kick = 0, celebrate = 0, card = 0, dive = false, tackle = 0, tackleDir = 1,
      gkready = false, gkshield = false, handshake = 0;
    if (a.anim) {
      var k = clamp(a.anim.t / a.anim.dur, 0, 1);
      if (a.anim.type === "kick") kick = Math.sin(k * PI);
      else if (a.anim.type === "gkstrike") kick = Math.sin(clamp(k * 0.92, 0, 1) * PI);
      else if (a.anim.type === "gkready") gkready = true;
      else if (a.anim.type === "gkshield") gkshield = true;
      else if (a.anim.type === "celebrate") { celebrate = 1; jump = Math.sin(k * PI) * 0.35; }
      else if (a.anim.type === "greet") {
        /* Solo el apretón de manos modifica la pose. Un saludo sin mano no es
         * una celebración: el árbitro nunca debe quedarse con los brazos arriba. */
        if (a.anim.hand) handshake = Math.sin(clamp(k, 0, 1) * PI);
      }
      else if (a.anim.type === "card") card = Math.sin(k * PI);
      else if (a.anim.type === "dive") dive = true;
    }
    if (a.visualAnim) {
      var vk = clamp(a.visualAnim.t / Math.max(0.01, a.visualAnim.dur), 0, 1);
      if (a.visualAnim.type === "pass") kick = Math.sin(vk * PI) * 0.7;
      else if (a.visualAnim.type === "tackle") {
        if (a.gk) dive = true;
        else { tackle = Math.sin(vk * PI); tackleDir = a.visualAnim.dir || 1; }
      } else if (a.visualAnim.type === "save" && a.gk) dive = true;
    }
    drawContactShadow(m, a, q, far);
    if (sim.ball.mode === "held" && sim.ball.side === a.side && sim.ball.idx === a.slot) {
      m.ring(a.x, a.z, 0.58, 0.07, [0.98, 0.82, 0.28], 12, 0.032);
    }
    var start = m.n;
    if (dive) {
      /* El cuerpo cae de lado: el eje local X es el eje lateral del portero.
         visualAnim (tackle/parada) puede no traer dirección de anim. */
      var diveAnim = a.anim || a.visualAnim;
      var dirW = (diveAnim && diveAnim.dir) || 1;
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
    } else if (tackle > 0.01) {
      /* Barrida de campo: el cuerpo baja, una pierna se estira hacia el balón
       * y la otra queda recogida. Es una pose distinta de la estirada del
       * portero, que solo se usa en `save`/`dive` de porteros. */
      var tl = -tackleDir * (Math.sin(a.facing) >= 0 ? 1 : -1);
      m.ellipsoid(tl * 0.16, 0.62, 0.02, 0.32, 0.28, 0.23, shirt, seg, rings);
      m.ellipsoid(tl * 0.16, 0.38, 0, 0.27, 0.16, 0.20, shorts, q ? 8 : 6, 4);
      m.ellipsoid(tl * 0.24, 1.02, 0.06, 0.19, 0.22, 0.18, skin, seg, rings - 1);
      m.ellipsoid(tl * 0.24, 1.15, 0.05, 0.195, 0.08, 0.18, hair, q ? 8 : 6, 3);
      m.limb([tl * 0.05, 0.74, 0], [tl * 0.48, 0.54, 0.38], 0.08, shirt);
      m.limb([tl * 0.48, 0.54, 0.38], [tl * 0.62, 0.34, 0.52], 0.07, skin);
      m.limb([-tl * 0.02, 0.70, 0], [-tl * 0.34, 0.56, -0.32], 0.08, shirt);
      m.limb([-tl * 0.34, 0.56, -0.32], [-tl * 0.48, 0.34, -0.44], 0.07, skin);
      m.limb([tl * 0.1, 0.42, 0], [tl * 0.82, 0.23, 0.25], 0.09, shorts);
      m.limb([tl * 0.82, 0.23, 0.25], [tl * 1.02, 0.10, 0.40], 0.075, skin);
      m.box(tl * 1.04, 0.07, 0.43, 0.28, 0.08, 0.18, BOOT);
      m.limb([-tl * 0.06, 0.42, 0], [-tl * 0.30, 0.27, -0.30], 0.09, shorts);
      m.limb([-tl * 0.30, 0.27, -0.30], [-tl * 0.14, 0.08, -0.12], 0.075, skin);
      m.box(-tl * 0.12, 0.04, -0.10, 0.28, 0.08, 0.18, BOOT);
    } else {
      m.ellipsoid(0, 0.94, 0, 0.32, 0.46, 0.23, shirt, seg, rings);
      m.ellipsoid(0, 0.52, 0, 0.26, 0.16, 0.2, shorts, q ? 8 : 6, 4);
      m.ellipsoid(0, 1.5, 0, 0.19, 0.23, 0.18, skin, seg, rings);
      m.ellipsoid(0, 1.64, -0.015, 0.195, 0.09, 0.18, hair, q ? 8 : 6, 3);
      m.limb([-0.14, 0.52, 0], [-0.17, 0.27 + liftL * 0.35, gait * 0.35], 0.095, shorts);
      m.limb([-0.17, 0.27 + liftL * 0.35, gait * 0.35], [-0.18, 0.07 + liftL, gait * 0.55], 0.075, skin);
      /* La pierna derecha acompaña el golpeo: rodilla arriba, pie adelante y
       * el apoyo queda plantado. Sin animación de golpeo el resultado es la
       * zancada de siempre. */
      var rKneeY = 0.27 + liftR * 0.35 + kick * 0.08, rKneeZ = gait2 * 0.35 + kick * 0.30;
      var rFootY = 0.07 + liftR + kick * 0.18, rFootZ = gait2 * 0.55 + kick * 0.72;
      m.limb([0.14, 0.52, 0], [0.17, rKneeY, rKneeZ], 0.095, shorts);
      m.limb([0.17, rKneeY, rKneeZ], [0.18, rFootY, rFootZ], 0.075, skin);
      m.box(-0.18, 0.015 + liftL, gait * 0.55 + 0.05, 0.2, 0.08, 0.3, BOOT);
      m.box(0.18, Math.max(0.015, rFootY - 0.055), rFootZ + 0.05, 0.2, 0.08, 0.3, BOOT);
      var arm = Math.sin(a.runPhase + PI) * 0.28 * run;
      var handY = celebrate ? 1.6 : card ? (a.official === "ref" ? 1.88 : 1.35) : 0.78;
      var elbowY = celebrate ? 1.45 : card && a.official === "ref" ? 1.46 : 0.98;
      var handX = 0.46, elbowX = 0.43;
      var leftHandZ = celebrate ? 0.05 : card ? 0 : -arm;
      var rightHandZ = celebrate ? 0.05 : card ? 0 : arm;
      if (gkready || gkshield) {
        handY = 1.02; elbowY = 1.15;
        handX = gkshield ? 0.62 : 0.54;
        elbowX = gkshield ? 0.50 : 0.46;
        leftHandZ = rightHandZ = gkshield ? 0.30 : 0.17;
      } else if (kick > 0.01) {
        handY = 1.12; elbowY = 1.05;
        leftHandZ = 0.30 * kick; rightHandZ = -0.22 * kick;
      }
      if (handshake > 0.01) {
        /* Los capitanes se dan la mano: el brazo derecho va al centro y el
         * cuerpo queda de frente al rival. */
        handY = 1.03; elbowY = 1.08; handX = 0.15; elbowX = 0.37;
        rightHandZ = 0.56 * handshake; leftHandZ = -0.06;
      }
      m.limb([-0.3, 1.2, 0], [-elbowX, elbowY, leftHandZ * 0.4], 0.085, shirt);
      m.limb([-elbowX, elbowY, leftHandZ * 0.4], [-handX, handY, leftHandZ], 0.07, skin);
      m.limb([0.3, 1.2, 0], [elbowX, elbowY, rightHandZ * 0.4], 0.085, shirt);
      m.limb([elbowX, elbowY, rightHandZ * 0.4], [handX, handY, rightHandZ], 0.07, skin);
      if (!far) m.box(0, 0.98, 0.24, 0.2, 0.14, 0.035, a.official ? [0.98, 0.84, 0.20] : a.side ? [0.14, 0.24, 0.42] : [0.96, 0.82, 0.24]);
    }
    var ca = Math.cos(a.facing), sa = Math.sin(a.facing);
    var lean = a.lean || 0, bank = a.bank || 0;
    var sway = dive ? 0 : Math.sin(sim.time * 1.4 + (a.phase || 0) * TAU) * 0.012 * (1 - run);
    for (var vi = start; vi < m.n; vi += FS) {
      var lx = m.a[vi] + bank * m.a[vi + 1] + sway, ly = m.a[vi + 1], lz = m.a[vi + 2] + lean * m.a[vi + 1];
      m.a[vi] = a.x + lx * ca + lz * sa;
      m.a[vi + 1] = ly * (a.scale || 1) + jump;
      m.a[vi + 2] = a.z - lx * sa + lz * ca;
    }
    m.renormal(start);
  }

  function buildAssetBall(m) {
    var model = assetModels && assetModels.static && assetModels.static.ball_lod1;
    if (!model || !model.triangles || !model.positions.length) return false;
    var b = sim.ball, x = b.x, z = b.z, y = Math.max(BALL_R * BALL_SCALE, b.y);
    aoDisc(m, x, z, 0.32, 0.32, clamp(0.4 + b.y * 0.12, 0.4, 0.95), 10);
    var pos = model.positions, col = model.colors;
    m.metallic = 0;
    m.roughness = (model.matRoughness && model.matRoughness[0] != null) ? model.matRoughness[0] : 0.56;
    var cx = Math.cos(b.spinX), sx = Math.sin(b.spinX);
    var cz = Math.cos(b.spinZ), sz = Math.sin(b.spinZ);
    for (var i = 0; i < pos.length; i += 9) {
      /* dos giros alrededor de X y Z: rueda en la dirección de la velocidad */
      var ax = pos[i] * BALL_SCALE, ay = pos[i + 1] * BALL_SCALE, az = pos[i + 2] * BALL_SCALE;
      var a1 = ay * cx - az * sx, a2 = ay * sx + az * cx;
      var bx = pos[i + 3] * BALL_SCALE, by = pos[i + 4] * BALL_SCALE, bz = pos[i + 5] * BALL_SCALE;
      var b1 = by * cx - bz * sx, b2 = by * sx + bz * cx;
      var gx = pos[i + 6] * BALL_SCALE, gy = pos[i + 7] * BALL_SCALE, gz = pos[i + 8] * BALL_SCALE;
      var g1 = gy * cx - gz * sx, g2 = gy * sx + gz * cx;
      m.tri9(
        x + ax * cz - a1 * sz, y + ax * sz + a1 * cz, z + a2,
        x + bx * cz - b1 * sz, y + bx * sz + b1 * cz, z + b2,
        x + gx * cz - g1 * sz, y + gx * sz + g1 * cz, z + g2,
        (col[i] + col[i + 3] + col[i + 6]) / 3,
        (col[i + 1] + col[i + 4] + col[i + 7]) / 3,
        (col[i + 2] + col[i + 5] + col[i + 8]) / 3
      );
    }
    assetFrameTris += model.triangles;
    assetFrameBall++;
    return true;
  }

  /* ------------------------------------------------------------------ red con física */
  /* Techo y fondo de cada red son una malla de nudos (Verlet) cosida al marco:
   * el gol la embolsa, rebota y vuelve a su sitio. Solo visual. */
  var nets = null, NET_SP = 0.36, NET_ROOF = 6, NET_BACK = 6;
  function initNets() {
    nets = [0, LEN].map(function (end) {
      var out = end === 0 ? -1 : 1, x = end, back = end + out * 2.0;
      var cols = Math.round(POST * 2 / NET_SP) + 1, rows = NET_ROOF + NET_BACK + 1, n = cols * rows;
      var r = new Float32Array(n * 3), pin = new Uint8Array(n);
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var k = (j * cols + i) * 3, z = MIDZ - POST + i * (POST * 2) / (cols - 1), px, py;
        if (j <= NET_ROOF) { var t = j / NET_ROOF; px = lerp(x, back, t); py = lerp(BAR - 0.03, 1.9, t); }
        else { px = back; py = 1.9 * (1 - (j - NET_ROOF) / NET_BACK); }
        r[k] = px; r[k + 1] = py; r[k + 2] = z;
        pin[j * cols + i] = (j === 0 || j === rows - 1 || i === 0 || i === cols - 1) ? 1 : 0;
      }
      var e = [];
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        var a = j * cols + i;
        if (i < cols - 1) e.push(a, a + 1);
        if (j < rows - 1) e.push(a, a + cols);
      }
      var len = new Float32Array(e.length / 2);
      for (var q = 0; q < e.length; q += 2) {
        var A = e[q] * 3, B = e[q + 1] * 3;
        len[q / 2] = Math.sqrt(Math.pow(r[A] - r[B], 2) + Math.pow(r[A + 1] - r[B + 1], 2) + Math.pow(r[A + 2] - r[B + 2], 2));
      }
      return {end: end, out: out, cols: cols, rows: rows, r: r, p: new Float32Array(r), pp: new Float32Array(r), pin: pin,
        e: e, len: len, live: false, acc: 0, hit: -1};
    });
  }
  /* Golpe del balón: velocidad hacia fuera con caída suave alrededor del punto. */
  function netHit(gx, z, y, power) {
    if (!nets) initNets();
    var N = nets[gx < LEN / 2 ? 0 : 1], best = -1, bd = 1e9;
    for (var i = 0; i < N.cols * N.rows; i++) {
      if (N.pin[i]) continue;
      var k = i * 3, dz = N.r[k + 2] - z, dy = N.r[k + 1] - y, dx = (N.r[k] - N.end) * 0.6;
      var d = Math.sqrt(dz * dz + dy * dy + dx * dx * 0.2);
      var w = Math.max(0, 1 - d / 1.9); w *= w;
      if (d < bd && N.r[k] !== N.end) { bd = d; best = i; }
      if (!w) continue;
      var back = N.r[k + 1] < 1.9 + 1e-3 && Math.abs(N.r[k] - N.end) > 1.95;
      var v = power * 1.35 * w / 60;
      N.pp[k] = N.p[k] - N.out * v * (back ? 1 : 0.55);
      N.pp[k + 1] = N.p[k + 1] + (back ? 0 : v * 0.6);
    }
    N.live = true; N.hit = best;
    sim.netBall = {n: N.end === 0 ? 0 : 1, idx: best, until: sim.time + 1.3};
  }
  function stepNet(N, h) {
    var p = N.p, pp = N.pp, r = N.r, cnt = N.cols * N.rows, i, k;
    for (i = 0; i < cnt; i++) {
      if (N.pin[i]) continue;
      k = i * 3;
      for (var c = 0; c < 3; c++) {
        var v = (p[k + c] - pp[k + c]) * 0.965;
        pp[k + c] = p[k + c];
        p[k + c] += v + (r[k + c] - p[k + c]) * 0.018;
      }
      p[k + 1] -= 2.5 * h * h;
      if (p[k + 1] < 0.02) p[k + 1] = 0.02;
    }
    for (var it = 0; it < 3; it++) for (var q = 0; q < N.e.length; q += 2) {
      var a = N.e[q], b = N.e[q + 1], A = a * 3, B = b * 3;
      var dx = p[B] - p[A], dy = p[B + 1] - p[A + 1], dz = p[B + 2] - p[A + 2];
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, L = N.len[q / 2];
      if (d <= L * 1.16) continue;                 /* la red cede pero no se estira */
      var f = (d - L * 1.16) / d, wa = N.pin[a] ? 0 : N.pin[b] ? 1 : 0.5, wb = N.pin[b] ? 0 : N.pin[a] ? 1 : 0.5;
      p[A] += dx * f * wa; p[A + 1] += dy * f * wa; p[A + 2] += dz * f * wa;
      p[B] -= dx * f * wb; p[B + 1] -= dy * f * wb; p[B + 2] -= dz * f * wb;
    }
    var en = 0;
    for (i = 0; i < cnt * 3; i++) en += Math.abs(p[i] - r[i]) + Math.abs(p[i] - pp[i]);
    if (en < 0.02) { p.set(r); pp.set(r); N.live = false; }
  }
  function updateNets(dt) {
    if (!nets) return;
    for (var g = 0; g < 2; g++) {
      var N = nets[g];
      if (!N.live) continue;
      N.acc = Math.min(N.acc + dt, 0.1);
      while (N.acc >= 1 / 60) { stepNet(N, 1 / 60); N.acc -= 1 / 60; }
    }
    /* el balón se queda dentro de la bolsa mientras la red lo frena */
    var nb = sim.netBall, b = sim.ball;
    if (nb && b.mode === "dead" && sim.time < nb.until && nb.idx >= 0 && sim.action && sim.action.type === "shot") {
      var M = nets[nb.n], k = nb.idx * 3;
      b.x = M.p[k] - M.out * 0.2; b.z = M.p[k + 2]; b.y = Math.max(0.22, M.p[k + 1] - 0.05);
    } else if (nb) sim.netBall = null;
  }
  function strand(m, A, B, w, c) {
    var dx = Math.abs(B[0] - A[0]), dy = Math.abs(B[1] - A[1]), dz = Math.abs(B[2] - A[2]);
    var o1 = dy >= dx && dy >= dz ? [w, 0, 0] : [0, w, 0], o2 = dz >= dx && dz >= dy ? [w, 0, 0] : [0, 0, w];
    m.quad([A[0] - o1[0], A[1] - o1[1], A[2] - o1[2]], [B[0] - o1[0], B[1] - o1[1], B[2] - o1[2]], [B[0] + o1[0], B[1] + o1[1], B[2] + o1[2]], [A[0] + o1[0], A[1] + o1[1], A[2] + o1[2]], c);
    m.quad([A[0] - o2[0], A[1] - o2[1], A[2] - o2[2]], [B[0] - o2[0], B[1] - o2[1], B[2] - o2[2]], [B[0] + o2[0], B[1] + o2[1], B[2] + o2[2]], [A[0] + o2[0], A[1] + o2[1], A[2] + o2[2]], c);
  }
  function drawNets(m) {
    if (!nets) initNets();
    var c = [0.86, 0.88, 0.86];
    m.code = MAT_MATTE;
    for (var g = 0; g < 2; g++) {
      var N = nets[g], p = N.p;
      for (var q = 0; q < N.e.length; q += 2) {
        var A = N.e[q] * 3, B = N.e[q + 1] * 3;
        strand(m, [p[A], p[A + 1], p[A + 2]], [p[B], p[B + 1], p[B + 2]], 0.013, c);
      }
    }
    m.code = -1;
  }

  /* ------------------------------------------------------------------ clima en el césped y partículas */
  /* Todo es visual: no usa el azar del motor ni cambia una sola jugada. */
  var fxSeed = 12345;
  function frnd() { fxSeed = (fxSeed * 1103515245 + 12345) & 0x7fffffff; return fxSeed / 0x7fffffff; }
  function fxState() { if (!sim.fx) sim.fx = {p: [], div: [], steps: [], si: 0, splashAcc: 0}; return sim.fx; }

  /* Paleta de los restos que levanta el balón según el clima. */
  function debrisFor(wx) {
    if (wx === "rain") return {a: [0.70, 0.80, 0.92], b: [0.26, 0.18, 0.11], wetA: true, mudB: 0.35, grav: 9.8, drag: 0.6};
    if (wx === "cold") return {a: [0.94, 0.97, 1.0], b: [0.82, 0.88, 0.95], wetA: false, mudB: 0.5, grav: 4.2, drag: 1.8};
    if (wx === "heat") return {a: [0.72, 0.60, 0.40], b: [0.62, 0.58, 0.28], wetA: false, mudB: 0.5, grav: 1.6, drag: 2.6, dust: true};
    return {a: [0.24, 0.48, 0.16], b: [0.36, 0.26, 0.16], wetA: false, mudB: 0.3, grav: 7.5, drag: 1.0};
  }

  /* Ráfaga de vóxeles: n trozos que salen con `power` (0..1) hacia (dx, dz). */
  function emitBurst(x, y, z, n, power, dx, dz, cone) {
    if (!gl) return;
    var f = fxState(), d = debrisFor(sim.wx);
    if (reduced) n = Math.ceil(n / 3);
    if (quality < 0.62) n = Math.ceil(n * 0.6);
    var dl = Math.sqrt((dx || 0) * (dx || 0) + (dz || 0) * (dz || 0));
    var ux = dl > 0.01 ? dx / dl : 0, uz = dl > 0.01 ? dz / dl : 0;
    cone = cone == null ? 1 : cone;
    for (var i = 0; i < n && f.p.length < 420; i++) {
      var mud = frnd() < d.mudB, sp = (1.2 + power * 5.5) * (0.45 + frnd() * 0.75);
      var ang = (frnd() - 0.5) * 2.4 * cone, ca = Math.cos(ang), sa = Math.sin(ang);
      var vx = (ux * ca - uz * sa) * sp + (frnd() - 0.5) * 1.6, vz = (uz * ca + ux * sa) * sp + (frnd() - 0.5) * 1.6;
      if (dl <= 0.01) { var a2 = frnd() * TAU; vx = Math.cos(a2) * sp * 0.6; vz = Math.sin(a2) * sp * 0.6; }
      var col = mud ? d.b : d.a, j = 0.88 + frnd() * 0.24;
      var life = d.dust ? 0.9 + frnd() * 0.9 : 0.45 + frnd() * 0.6;
      f.p.push({x: x + (frnd() - 0.5) * 0.25, y: y + 0.03, z: z + (frnd() - 0.5) * 0.25,
        vx: vx, vy: (1.4 + power * 4.2) * (0.5 + frnd() * 0.8), vz: vz,
        life: life, max: life, s: (d.dust ? 0.09 : 0.035) + frnd() * (d.dust ? 0.10 : 0.06) * (0.6 + power),
        c: [col[0] * j, col[1] * j, col[2] * j], wet: !mud && d.wetA, dust: !!d.dust && !mud,
        g: d.dust && !mud ? d.grav : d.grav, drag: d.drag});
    }
  }
  /* Marca permanente en el césped (chupinazo raso o entrada). */
  function addDivot(x, z, dx, dz, len) {
    if (x < -3 || x > LEN + 3 || z < -2 || z > WID + 2) return;
    var f = fxState(), a = Math.atan2(dz || 0, dx || 1);
    f.div.push({x: x, z: z, a: a, len: len || 0.32, w: 0.22 + frnd() * 0.1, wx: sim.wx});
    if (f.div.length > 90) f.div.shift();
  }
  function fxKick(b, tx, tz, dur, arc) {
    var dx = tx - b.x, dz = tz - b.z, d = Math.sqrt(dx * dx + dz * dz), sp = d / Math.max(0.08, dur);
    var power = clamp((sp - 6) / 24, 0, 1);
    if (b.y > 0.7) { emitBurst(b.x, b.y - 0.1, b.z, 2 + Math.round(power * 3), power * 0.4, dx, dz, 1.3); return; }
    emitBurst(b.x, 0.02, b.z, 5 + Math.round(power * 13), 0.25 + power * 0.75, dx, dz, arc > 1 ? 0.7 : 1);
    if (power > 0.55 && frnd() < 0.7) addDivot(b.x - dx / (d || 1) * 0.25, b.z - dz / (d || 1) * 0.25, dx, dz, 0.28 + power * 0.25);
  }
  function fxTackle(a, dir) {
    if (!a) return;
    var dx = Math.sin(a.facing), dz = Math.cos(a.facing);
    emitBurst(a.x + dx * 0.5, 0.02, a.z + dz * 0.5, 12, 0.55, dx, dz, 1.4);
    addDivot(a.x + dx * 0.6, a.z + dz * 0.6, dx, dz, sim.wx === "rain" ? 1.9 : sim.wx === "cold" ? 1.6 : 1.1);
  }
  function fxDive(gk, dir) {
    if (!gk) return;
    emitBurst(gk.x, 0.02, gk.z + (dir || 1) * 1.1, 10, 0.5, 0, dir || 1, 1.6);
    addDivot(gk.x, gk.z + (dir || 1) * 1.0, 0, dir || 1, 1.3);
  }

  /* Paso del tiempo de partículas y huellas (tiempo de pantalla, no del motor). */
  function updateFx(dt) {
    if (!dt || !sim.fx && sim.wx !== "rain") return;
    var f = fxState(), p = f.p;
    for (var i = p.length - 1; i >= 0; i--) {
      var q = p[i];
      q.life -= dt;
      if (q.life <= 0) { p.splice(i, 1); continue; }
      var dr = Math.pow(0.5, dt * q.drag);
      q.vx *= dr; q.vz *= dr; q.vy = q.dust ? q.vy * dr + 0.35 * dt : q.vy - q.g * dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < 0.01) { q.y = 0.01; q.vy = q.wet ? 0 : -q.vy * 0.25; q.vx *= 0.5; q.vz *= 0.5; if (q.wet) q.life = Math.min(q.life, 0.12); }
    }
    var b = sim.ball;
    /* balón rodando sobre agua: estela de gotas */
    if (sim.wx === "rain" && b.mode === "loose" && b.y < 0.3 && b.vx * b.vx + b.vz * b.vz > 25 && frnd() < dt * 22)
      emitBurst(b.x, 0.02, b.z, 1, 0.15, b.vx, b.vz, 0.6);
    /* gotas que rebotan en el césped cerca del balón */
    if (sim.wx === "rain" && !reduced) {
      f.splashAcc += dt * (quality < 0.62 ? 10 : 22);
      while (f.splashAcc >= 1 && p.length < 420) {
        f.splashAcc -= 1;
        var sx = b.x + (frnd() - 0.5) * 50, sz = b.z + (frnd() - 0.2) * 34;
        if (sx < -4 || sx > LEN + 4 || sz < -3 || sz > WID + 3) continue;
        for (var k = 0; k < 2; k++)
          p.push({x: sx, y: 0.02, z: sz, vx: (frnd() - 0.5) * 1.2, vy: 1.1 + frnd() * 0.9, vz: (frnd() - 0.5) * 1.2,
            life: 0.22, max: 0.22, s: 0.035, c: [0.78, 0.86, 0.95], wet: true, g: 9.8, drag: 0.4});
      }
    } else f.splashAcc = 0;
    /* pisadas: huellas en nieve y barro, polvo con calor */
    var marks = sim.wx === "cold" || sim.wx === "rain", puff = sim.wx === "heat" || sim.wx === "cold";
    if (!marks && !puff) return;
    for (var s = 0; s < 2; s++) {
      var list = sim.players[s] || [];
      for (var j = 0; j < list.length; j++) {
        var a = list[j];
        if (!a || a.gone || a.sentOff || a.hidden) continue;
        var v = Math.sqrt(a.vx * a.vx + a.vz * a.vz);
        if (v < 2.2) continue;
        a.fxStride = (a.fxStride || 0) + v * dt;
        if (a.fxStride < 0.95) continue;
        a.fxStride = 0; a.fxFoot = !a.fxFoot;
        var side = a.fxFoot ? 0.11 : -0.11, cx = Math.cos(a.facing), sx2 = Math.sin(a.facing);
        var fx = a.x + cx * side, fz = a.z - sx2 * side;
        if (marks && fx > -4 && fx < LEN + 4 && fz > -3 && fz < WID + 3) {
          f.steps[f.si] = {x: fx, z: fz, a: a.facing}; f.si = (f.si + 1) % 320;
        }
        if (puff && v > 4.5 && frnd() < 0.5) emitBurst(fx, 0.02, fz, 1, 0.1, -a.vx, -a.vz, 0.8);
      }
    }
  }

  function flatRect(m, x, z, a, len, w, y, c) {
    var ca = Math.cos(a), sa = Math.sin(a), hx = len / 2, hz = w / 2;
    var p = function (u, v) { return [x + ca * u - sa * v, y, z + sa * u + ca * v]; };
    m.quad(p(-hx, -hz), p(-hx, hz), p(hx, hz), p(hx, -hz), c);
  }
  function drawFx(m) {
    var f = sim.fx;
    if (!f) return;
    var wet = sim.wx === "rain";
    /* marcas: tepes levantados, resbalones y huellas */
    m.code = wet ? MAT_GLOSS : MAT_MATTE;
    for (var i = 0; i < f.div.length; i++) {
      var d = f.div[i];
      var col = d.wx === "cold" ? [0.20, 0.30, 0.16] : d.wx === "rain" ? [0.20, 0.14, 0.08] : d.wx === "heat" ? [0.50, 0.40, 0.26] : [0.33, 0.24, 0.15];
      flatRect(m, d.x, d.z, d.a, d.len, d.w, 0.009, col);
      if (d.len < 0.7) {
        var ox = Math.cos(d.a) * (d.len * 0.5 + 0.18), oz = Math.sin(d.a) * (d.len * 0.5 + 0.18);
        m.box(d.x + ox, 0, d.z + oz, 0.16, 0.05, 0.12, d.wx === "cold" ? [0.9, 0.94, 0.98] : [0.22, 0.42, 0.15], 0.8, 1);
      }
    }
    var sc = sim.wx === "cold" ? [0.62, 0.70, 0.80] : [0.22, 0.17, 0.11];
    for (var k = 0; k < f.steps.length; k++) {
      var st = f.steps[k];
      if (st) flatRect(m, st.x, st.z, PI / 2 - st.a, 0.26, 0.11, sim.wx === "cold" ? 0.075 : 0.010, sc);
    }
    /* partículas: cubos que encogen al apagarse */
    for (var j = 0; j < f.p.length; j++) {
      var q = f.p[j], kf = q.life / q.max, s = q.s * (q.dust ? 0.6 + 0.8 * (1 - kf) : Math.min(1, kf * 2.2));
      if (q.dust && kf < 0.5) s *= kf * 2;
      m.code = q.wet ? MAT_GLOSS : MAT_MATTE;
      m.box(q.x, q.y - s / 2, q.z, s, s, s, q.c, 1, 1);
    }
    m.code = -1;
  }

  /* Desperfectos fijos del césped según el clima: barro y charcos con lluvia,
   * nieve con calles limpias en las líneas, calvas secas con calor y desgaste
   * en las áreas siempre. Se reconstruye al cambiar el clima o la hora. */
  var wxBuf = null, wxCount = 0, wxKey = "";
  var LINES = [[0, 0, LEN, 0], [0, WID, LEN, WID], [0, 0, 0, WID], [LEN, 0, LEN, WID], [LEN / 2, 0, LEN / 2, WID],
    [16.5, MIDZ - 20.16, 16.5, MIDZ + 20.16], [0, MIDZ - 20.16, 16.5, MIDZ - 20.16], [0, MIDZ + 20.16, 16.5, MIDZ + 20.16],
    [LEN - 16.5, MIDZ - 20.16, LEN - 16.5, MIDZ + 20.16], [LEN - 16.5, MIDZ - 20.16, LEN, MIDZ - 20.16], [LEN - 16.5, MIDZ + 20.16, LEN, MIDZ + 20.16],
    [5.5, MIDZ - 9.16, 5.5, MIDZ + 9.16], [0, MIDZ - 9.16, 5.5, MIDZ - 9.16], [0, MIDZ + 9.16, 5.5, MIDZ + 9.16],
    [LEN - 5.5, MIDZ - 9.16, LEN - 5.5, MIDZ + 9.16], [LEN - 5.5, MIDZ - 9.16, LEN, MIDZ - 9.16], [LEN - 5.5, MIDZ + 9.16, LEN, MIDZ + 9.16]];
  function lineDist(x, z) {
    var best = Math.abs(Math.sqrt((x - LEN / 2) * (x - LEN / 2) + (z - MIDZ) * (z - MIDZ)) - 9.15);
    for (var i = 0; i < LINES.length; i++) {
      var L = LINES[i], dx = L[2] - L[0], dz = L[3] - L[1], l2 = dx * dx + dz * dz;
      var t = clamp(((x - L[0]) * dx + (z - L[1]) * dz) / l2, 0, 1);
      var ex = L[0] + dx * t - x, ez = L[1] + dz * t - z, dd = Math.sqrt(ex * ex + ez * ez);
      if (dd < best) best = dd;
    }
    return best;
  }
  function vnoise(x, z, s) {
    var ix = Math.floor(x / s), iz = Math.floor(z / s), fx = x / s - ix, fz = z / s - iz;
    var h = function (a, b) { var n = ((a * 374761393 + b * 668265263) ^ fxNoiseSalt) >>> 0; n = ((n ^ (n >>> 13)) * 1274126177) >>> 0; return (n & 0xffff) / 0xffff; };
    var u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
  }
  var fxNoiseSalt = 0;
  /* Desgaste del juego: áreas pequeñas, punto de penalti, centro y la banda del linier. */
  function wearAt(x, z) {
    var w = 0;
    [[3.2, MIDZ, 4.5, 3.4], [LEN - 3.2, MIDZ, 4.5, 3.4], [11, MIDZ, 1.8, 1.8], [LEN - 11, MIDZ, 1.8, 1.8], [LEN / 2, MIDZ, 2.6, 2.6]].forEach(function (g) {
      var dx = (x - g[0]) / g[2], dz = (z - g[1]) / g[3], d = Math.sqrt(dx * dx + dz * dz);
      w = Math.max(w, 1 - d);
    });
    if (z < -0.6 && z > -2.2 && x > LEN / 2 - 2 && x < LEN) w = Math.max(w, 0.45);
    if (z > WID + 0.6 && z < WID + 2.2 && x > 0 && x < LEN / 2 + 2) w = Math.max(w, 0.45);
    return w;
  }
  function buildPitchWx(m, wx, env) {
    var night = env.night || 0;
    fxNoiseSalt = hashKey(colors[0] + "|" + colors[1] + "|" + wx) & 0xffff;
    var S = 0.6, x, z;
    /* 1. desgaste en las zonas de más juego */
    m.code = wx === "rain" ? MAT_GLOSS : MAT_MATTE;
    var dirt = wx === "rain" ? [0.24, 0.16, 0.09] : wx === "heat" ? [0.56, 0.45, 0.30] : wx === "cold" ? [0.30, 0.26, 0.22] : [0.36, 0.27, 0.17];
    var wearMul = wx === "rain" ? 1.35 : wx === "heat" ? 1.15 : wx === "sun" || wx === "mild" ? 0.75 : 1;
    for (x = -2.4; x < LEN + 2.4; x += S) for (z = -2.4; z < WID + 2.4; z += S) {
      var cx = x + S / 2, cz = z + S / 2, w = wearAt(cx, cz) * wearMul;
      if (w <= 0) continue;
      var n = vnoise(cx, cz, 1.3) * 0.6 + vnoise(cx, cz, 0.45) * 0.4;
      if (n > 1 - w * 0.9) {
        var c = shade(dirt, 0.86 + vnoise(cx, cz, 0.3) * 0.26);
        if (wx === "rain" && n > 1 - w * 0.5) c = [0.30, 0.34, 0.40];
        m.quad([x, 0.007, z], [x + S, 0.007, z], [x + S, 0.007, z + S], [x, 0.007, z + S], c);
        /* terrones sueltos de barro o tierra */
        if (n > 1 - w * 0.35 && vnoise(cx * 3.1, cz * 2.7, 0.7) > 0.72) m.box(cx, 0, cz, 0.18, 0.06, 0.15, shade(dirt, 0.8), 0.7, 1);
      }
    }
    if (wx === "rain") {
      /* 2. charcos: manchas planas que reflejan el cielo */
      m.code = MAT_METAL;
      var refl = night > 0.5 ? [0.10, 0.12, 0.17] : [0.46, 0.52, 0.60];
      for (var pi = 0; pi < 16; pi++) {
        var px = pi < 6 ? (pi % 2 ? LEN - 4 - (pi >> 1) * 3 : 4 + (pi >> 1) * 3) + vnoise(pi, 3, 1) * 3 : 8 + vnoise(pi, 7, 1) * (LEN - 16);
        var pz = pi < 6 ? MIDZ + (vnoise(pi, 11, 1) - 0.5) * 12 : 4 + vnoise(pi, 13, 1) * (WID - 8);
        var pr = 0.9 + vnoise(pi, 17, 1) * 1.9, PS = 0.3;
        for (x = px - pr; x < px + pr; x += PS) for (z = pz - pr * 0.7; z < pz + pr * 0.7; z += PS) {
          var dx = (x + PS / 2 - px) / pr, dz = (z + PS / 2 - pz) / (pr * 0.7);
          if (dx * dx + dz * dz > 0.55 + vnoise(x, z, 0.6) * 0.5) continue;
          m.quad([x, 0.010, z], [x + PS, 0.010, z], [x + PS, 0.010, z + PS], [x, 0.010, z + PS], shade(refl, 0.9 + vnoise(x, z, 0.5) * 0.2));
        }
      }
    } else if (wx === "cold") {
      /* 2. nieve en bloques: más en bandas y esquinas, calles limpias en las líneas */
      m.code = MAT_MATTE;
      var C = 0.9;
      for (x = -4.5; x < LEN + 4.5; x += C) for (z = -3.5; z < WID + 3.5; z += C) {
        var mx = x + C / 2, mz = z + C / 2;
        if (lineDist(mx, mz) < 0.55) continue;
        var edge = Math.min(mx, LEN - mx, mz, WID - mz), outside = edge < 0 ? 1 : 0;
        var dens = 0.50 + clamp(1 - edge / 12, 0, 1) * 0.35 + outside * 0.3 - wearAt(mx, mz) * 1.1;
        var sn = vnoise(mx, mz, 7) * 0.7 + vnoise(mx, mz, 2.4) * 0.22 + vnoise(mx, mz, 0.9) * 0.08;
        if (sn > 1 - dens) {
          var hgt = 0.02 + clamp(sn - (1 - dens), 0, 0.5) * 0.18 + outside * 0.05;
          var sc2 = [0.90 + vnoise(mx, mz, 0.4) * 0.08, 0.93 + vnoise(mx, mz, 0.4) * 0.05, 0.97];
          m.box(mx, 0, mz, C, hgt, C, sc2, 0.92, 1);
        }
      }
      /* montones de nieve apartada junto a las bandas */
      for (x = 1; x < LEN; x += 1.6) {
        [-3.0, WID + 3.0].forEach(function (zz, side) {
          var h = 0.25 + vnoise(x, zz, 1.7) * 0.45;
          m.box(x, 0, zz, 1.5, h, 0.9, [0.92, 0.95, 0.99], 0.8, 1);
          m.box(x + 0.2, h, zz + (side ? 0.12 : -0.12), 0.9, h * 0.5, 0.55, [0.95, 0.97, 1.0], 0.85, 1);
        });
      }
    } else if (wx === "heat") {
      /* 2. calvas quemadas por el sol */
      m.code = MAT_MATTE;
      var D = 0.75;
      for (x = -3; x < LEN + 3; x += D) for (z = -2.5; z < WID + 2.5; z += D) {
        var hx = x + D / 2, hz = z + D / 2, hn = vnoise(hx, hz, 5.5) * 0.7 + vnoise(hx, hz, 1.4) * 0.3;
        hn += wearAt(hx, hz) * 0.25;
        if (hn < 0.72 || lineDist(hx, hz) < 0.12) continue;
        var straw = mix([0.40, 0.45, 0.20], [0.58, 0.52, 0.30], clamp((hn - 0.72) * 4, 0, 1));
        m.quad([x, 0.006, z], [x + D, 0.006, z], [x + D, 0.006, z + D], [x, 0.006, z + D], shade(straw, 0.92 + vnoise(hx, hz, 0.4) * 0.16));
      }
      /* grietas en la tierra de las porterías */
      m.code = MAT_MATTE;
      [3, LEN - 3].forEach(function (gx) {
        for (var ci = 0; ci < 14; ci++) {
          var a = vnoise(gx, ci, 1) * TAU, l = 0.6 + vnoise(ci, gx, 1) * 1.2;
          flatRect(m, gx + (vnoise(ci, 5, 1) - 0.5) * 6, MIDZ + (vnoise(ci, 9, 1) - 0.5) * 6, a, l, 0.05, 0.011, [0.24, 0.18, 0.12]);
        }
      });
    }
    m.code = -1;
  }
  function ensurePitchWx(env) {
    var k = sim.wx + "|" + env.tod + "|" + colors[0] + colors[1];
    if (k === wxKey && wxBuf) return;
    var m = new Mesh(1 << 17);
    buildPitchWx(m, sim.wx, env);
    if (!wxBuf) wxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, m.a.subarray(0, Math.max(FS, m.n)), gl.STATIC_DRAW);
    wxCount = m.n / FS; wxKey = k;
  }

  /* Lluvia y nieve procedurales: quads baratos alrededor del balón que
     desaparecen en calidad baja o con movimiento reducido. */
  function drawWeather(m) {
    if (reduced) return;
    var rain = sim.wx === "rain", snow = sim.wx === "cold";
    if (!rain && !snow) return;
    var count = quality > 0.7 ? (rain ? 210 : 110) : (rain ? 100 : 55);
    var b = sim.ball, t = sim.time;
    m.metallic = 0; m.roughness = 0.92; m.code = MAT_UNLIT;
    for (var i = 0; i < count; i++) {
      var seed = (i * 2654435761 + 1013904223) >>> 0;
      var x = b.x + ((seed % 800) / 10 - 40) + Math.sin(t * 0.6 + i) * 0.25;
      /* La lluvia también cae entre la cámara y el campo: si solo se dibuja
         alrededor del balón, las gotas cercanas nunca entran en el encuadre. */
      var z = b.z + (((seed >>> 9) % 800) / 10 - 15);
      var fall = rain ? 17 : 3.2;
      var span = rain ? 15 : 11;
      var y = 0.4 + (((t * fall + ((seed >>> 18) % 200)) % span));
      if (rain) {
        var c = [0.46 + (seed % 10) * 0.012, 0.55 + (seed % 8) * 0.012, 0.68], slant = 0.38;
        m.quad([x, y, z], [x + 0.055 + slant, y - 0.9, z], [x + 0.055 + slant, y - 0.9, z + 0.022], [x, y, z + 0.022], c);
      } else {
        var sc = 0.12 + (seed % 5) * 0.012;
        m.quad([x, y, z], [x + sc, y, z], [x + sc, y + sc, z], [x, y + sc, z], [0.90, 0.94, 1.0]);
      }
    }
    m.code = -1;
  }

  function buildBall(m) {
    var b = sim.ball, r = BALL_R * BALL_SCALE, y = Math.max(r, b.y), x = b.x, z = b.z;
    aoDisc(m, x, z, 0.32, 0.32, 0.45, 10);
    var top = [x, y + r, z], bot = [x, y - r, z], a = [x + r, y, z], c = [x - r, y, z], d = [x, y, z + r], e = [x, y, z - r];
    var w = [0.95, 0.95, 0.9], k = [0.12, 0.14, 0.15];
    m.tri(top, a, d, w); m.tri(top, d, c, k); m.tri(top, c, e, w); m.tri(top, e, a, k);
    m.tri(bot, d, a, k); m.tri(bot, c, d, w); m.tri(bot, e, c, k); m.tri(bot, a, e, w);
  }

  function coinDisc(m, x, y, z, rx, ry, c, seg) {
    seg = seg || 18;
    for (var i = 0; i < seg; i++) {
      var a = i * TAU / seg, b = (i + 1) * TAU / seg;
      m.tri([x, y, z], [x + Math.cos(a) * rx, y + Math.sin(a) * ry, z],
        [x + Math.cos(b) * rx, y + Math.sin(b) * ry, z], c);
    }
  }

  /* Moneda del sorteo: un disco vertical barato que gira sobre su eje. */
  function buildCoin(m) {
    var c = sim.cinema; if (!c || c.type !== "intro" || !c.coin || !c.coin.show) return;
    var x = LEN / 2, y = 1.42 + Math.sin(sim.time * 3.2) * 0.035, z = MIDZ;
    var r = 0.27, sy = Math.max(0.035, Math.abs(Math.cos(c.coin.angle)) * r);
    var gold = [0.97, 0.76, 0.18], edge = [0.52, 0.34, 0.06], light = [1.0, 0.91, 0.52];
    m.metallic = 0.45; m.roughness = 0.28;
    coinDisc(m, x, y, z + 0.012, r * 1.045, sy * 1.045, edge, 18);
    coinDisc(m, x, y, z + 0.018, r, sy, gold, 18);
    if (sy > r * 0.62) coinDisc(m, x, y, z + 0.024, r * 0.37, sy * 0.37, light, 14);
    m.metallic = 0; m.roughness = 1;
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

  /* Halos de los focos y conos de luz: aditivos, sin escribir profundidad. */
  function buildGlow(env) {
    fx.reset();
    var k = env.flood; if (k < 0.05 || !LAMPS.length) return;
    var ex = eyeArr[0], ey = eyeArr[1], ez = eyeArr[2];
    for (var i = 0; i < LAMPS.length; i++) {
      var L = LAMPS[i], dx = ex - L[0], dy = ey - L[1], dz = ez - L[2], dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      /* base del billboard perpendicular a la cámara */
      var rx = dz / dl, rz = -dx / dl, rl = Math.sqrt(rx * rx + rz * rz) || 1; rx /= rl; rz /= rl;
      var ux = -(dy / dl) * rx * 0, uy = 1, uz = 0;
      var gk = k * (0.25 + 0.75 * env.night), R = L[3] * (0.55 + 0.45 * env.night) * (0.92 + 0.08 * Math.sin(sim.time * 0.7 + i));
      var c = [0.90 * gk * L[4], 0.88 * gk * L[4], 0.80 * gk * L[4]];
      var seg = 14, px = L[0] + dx / dl * 0.5, py = L[1] + dy / dl * 0.5, pz = L[2] + dz / dl * 0.5;
      for (var s2 = 0; s2 < seg; s2++) {
        var a0 = s2 * TAU / seg, a1 = (s2 + 1) * TAU / seg;
        fx.triAO(px, py, pz,
          px + (Math.cos(a0) * rx) * R, py + Math.sin(a0) * R * uy, pz + (Math.cos(a0) * rz) * R,
          px + (Math.cos(a1) * rx) * R, py + Math.sin(a1) * R * uy, pz + (Math.cos(a1) * rz) * R, c[0], c[1], c[2], 1, 0, 0);
      }
      /* fuente: no se tiñe; los vértices exteriores llevan color 0 */
      fixGlowRim(fx, seg);
    }
  }
  /* En el halo el color central se conserva y el borde va a negro (aditivo). */
  function fixGlowRim(m, seg) {
    var a = m.a, start = m.n - seg * 3 * FS;
    for (var i = start; i < m.n; i += 3 * FS) {
      for (var v = 1; v < 3; v++) { var o = i + v * FS; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = 0; }
    }
  }

  function setUniforms(env, mvp) {
    var U = locations;
    gl.uniformMatrix4fv(U.uMvp, false, mvp);
    gl.uniformMatrix4fv(U.uShadowMvp, false, shadowMat);
    gl.uniform1f(U.uTime, sim.time);
    gl.uniform1f(U.uCrowd, reduced ? 0 : 0.10 + 0.22 * clamp(sim.shake * 3 + (sim.action && sim.action.type === "shot" ? 0.6 : 0), 0, 1) + (sim.netT > 0 ? 0.25 : 0));
    gl.uniform3fv(U.uEye, eyeArr);
    gl.uniform3fv(U.uSunDir, env.sun); gl.uniform3fv(U.uSunCol, env.sunCol);
    gl.uniform3fv(U.uSkyAmb, env.sky); gl.uniform3fv(U.uGroundAmb, env.ground);
    gl.uniform3fv(U.uFogCol, env.fog); gl.uniform3fv(U.uZenith, env.zenith); gl.uniform3fv(U.uHorizon, env.horizon);
    gl.uniform1f(U.uFogDen, env.fogDen); gl.uniform1f(U.uExposure, env.exposure); gl.uniform1f(U.uStars, env.stars);
    gl.uniform1f(U.uShadowOn, useShadows() ? 1 : 0); gl.uniform1f(U.uTexel, shadowSize ? 1 / shadowSize : 0);
    gl.uniform1f(U.uFlood, env.flood); gl.uniform1f(U.uEmis, env.emis);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform3fv(U.uL0, TOWERS[0]); gl.uniform3fv(U.uL1, TOWERS[1]); gl.uniform3fv(U.uL2, TOWERS[2]); gl.uniform3fv(U.uL3, TOWERS[3]);
    gl.uniform1i(U.uShadow, 0);
    gl.uniform3fv(U.uGrassMul, env.grassMul); gl.uniform4fv(U.uGrassMix, env.grassMix); gl.uniform1f(U.uWet, env.wet);
  }

  function draw() {
    var env = currentEnv();
    dyn.reset();
    dyn.spec = quality > 0.55;
    assetFrameTris = 0; assetFramePlayers = 0; assetFrameBall = 0;
    for (var s = 0; s < 2; s++) for (var i = 0; i < 11; i++) {
      var a = sim.players[s] && sim.players[s][i];
      if (!a || a.hidden) continue;
      var card = sim.action && sim.action.type === "card" && sim.action.player === a;
      if ((a.gone || a.sentOff) && !card) continue;
      if (!buildAssetPlayer(dyn, a)) buildPlayer(dyn, a);
    }
    for (var oi = 0; oi < sim.officials.length; oi++) {
      var oa = sim.officials[oi];
      if (!oa || oa.hidden) continue;
      if (!buildAssetPlayer(dyn, oa)) buildPlayer(dyn, oa);
      drawRefCard(dyn, oa);
    }
    drawPet(dyn);
    drawCoach(dyn);
    drawBoard(dyn);
    buildCoin(dyn);
    drawNets(dyn);
    if (!sim.ballHidden && !buildAssetBall(dyn)) buildBall(dyn);
    var solidN = dyn.n;
    drawFx(dyn);
    drawWeather(dyn);
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

    /* 1. sombras */
    var shadows = useShadows();
    if (shadows) {
      if (shadowDirty) updateShadowMatrix(env);
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
      gl.viewport(0, 0, shadowSize, shadowSize);
      gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(shadowProg);
      gl.uniformMatrix4fv(shadowLoc.mvp, false, shadowMat);
      gl.enableVertexAttribArray(shadowLoc.pos);
      bindMesh(staticBuf, shadowLoc); gl.drawArrays(gl.TRIANGLES, 0, staticCount);
      if (solidN) { bindMesh(dynBuf, shadowLoc); gl.drawArrays(gl.TRIANGLES, 0, solidN / FS); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    /* 2. escena */
    var lite = progLite && quality < 0.62;
    program = lite ? progLite : progFull; locations = lite ? locLite : locFull;
    gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadows ? shadowTex : null);
    setUniforms(env, mvp);
    var L = locations;
    gl.enableVertexAttribArray(L.pos); gl.enableVertexAttribArray(L.col);
    if (L.nrm >= 0) gl.enableVertexAttribArray(L.nrm);
    if (L.mat >= 0) gl.enableVertexAttribArray(L.mat);
    gl.depthMask(false); bindMesh(skyBuf, L); gl.drawArrays(gl.TRIANGLES, 0, skyCount); gl.depthMask(true);
    bindMesh(staticBuf, L); gl.drawArrays(gl.TRIANGLES, 0, staticCount);
    ensurePitchWx(env);
    if (wxCount) {
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4);
      bindMesh(wxBuf, L); gl.drawArrays(gl.TRIANGLES, 0, wxCount);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    for (var cb = 0; cb < (lite ? 1 : 2); cb++) if (crowdCounts[cb]) { bindMesh(crowdBufs[cb], L); gl.drawArrays(gl.TRIANGLES, 0, crowdCounts[cb]); }
    if (dyn.n) { bindMesh(dynBuf, L); gl.drawArrays(gl.TRIANGLES, 0, dyn.n / FS); }
    /* 3. halos */
    buildGlow(env);
    if (fx.n) {
      if (fx.n > fxCap) { fxCap = fx.a.length; gl.bindBuffer(gl.ARRAY_BUFFER, fxBuf); gl.bufferData(gl.ARRAY_BUFFER, fxCap * 4, gl.DYNAMIC_DRAW); }
      gl.bindBuffer(gl.ARRAY_BUFFER, fxBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, fx.a.subarray(0, fx.n));
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
      bindMesh(fxBuf, L); gl.drawArrays(gl.TRIANGLES, 0, fx.n / FS);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  function loop(ts) {
    if (disposed || !gl) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden) { lastTs = ts; return; }
    var dt = lastTs ? Math.min(0.25, Math.max(0, (ts - lastTs) / 1000)) : 0;
    lastTs = ts;
    resize();
    if (!frozen && !sim.replay && (!sim.ended || sim.cinema)) {
      acc += dt;
      var n = 0;
      /* Con FPS bajos la simulación recupera hasta 0,25 s por fotograma
       * para que el partido no se ralentice en móviles modestos. */
      while (acc >= STEP && n < 15) { simStep(STEP); acc -= STEP; n++; }
      if (n >= 15) acc = 0;
    } else if (sim.replay) {
      simStep(Math.min(dt, 0.25));
    } else acc = 0;
    updateCrowdAudio();
    updateFx(dt);
    updateNets(dt);
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

  /* Procesa un evento que llegó mientras el balón estaba en vuelo. Se hace
   * fuera de `finishAction` para cubrir también pases y saques. */
  function drainQueue() {
    if (sim.cinema || sim.replay || sim.action || sim.restart || sim.ball.mode === "flight") return;
    if (sim.queue.length) {
      var e = sim.queue.shift();
      handleEvent(e);
    }
  }

  function simStep(dt) {
    sim.time += dt * (sim.replay ? 1 : sim.rate);
    if (sim.replay) { updateReplay(dt * 1); return; }
    var sdt = dt * sim.rate;
    /* Entrada, descanso y despedida tienen su propio reloj y no pasan por la
     * IA: así los jugadores no abandonan la puesta en escena. */
    if (sim.cinema) { updateCinema(sdt); return; }
    updateAction(sdt);
    updateRestart(sdt);
    aiAcc += sdt;
    /* El saque de puerta tiene su propia coreografía: congelar la IA evita
     * que el portero o el receptor abandonen la puesta en escena. Al terminar
     * la acción, aiTick recupera el control en el siguiente paso. */
    if (aiAcc >= AI_STEP) {
      var setPiece = sim.restart && (sim.restart.type === "corner" || sim.restart.type === "free" ||
        sim.restart.type === "penalty");
      var staging = sim.action && (sim.action.type === "goalkick" || (sim.action.type === "card" && sim.action.stage !== "foul"));
      if (!staging && !setPiece) aiTick();
      aiAcc = 0;
    }
    updateChallenge();
    applyRegroup();
    moveActors(sdt);
    updateOfficials(sdt);
    for (var vs = 0; vs < 2; vs++) for (var vi = 0; vi < 11; vi++) {
      var va = actorAt(vs, vi);
      if (va && va.visualAnim) { va.visualAnim.t += sdt; if (va.visualAnim.t >= va.visualAnim.dur) va.visualAnim = null; }
    }
    updateAnimations(sdt);
    updateBall(sdt);
    tryPendingPass();
    drainQueue();
    if (sim.scorePending && sim.time > sim.scoreForceAt) reconcileScore(true);
    if (sim.netT > 0) sim.netT = Math.max(0, sim.netT - sdt * 1.5);
    histAcc += sdt;
    if (histAcc >= 0.1) { histAcc = 0; record(); }
  }

  function adaptQuality() {
    if (opts && opts.quality != null) { quality = +opts.quality; return; }
    if (fps < 32) { fpsBad++; fpsGood = 0; } else if (fps > 52) { fpsGood++; fpsBad = 0; } else { fpsBad = fpsGood = 0; }
    if (fps < 14 && quality > 0.55) { quality = 0.55; fpsBad = 0; }
    else if (fpsBad >= 3 && quality > 0.55) { quality = Math.max(0.55, quality - 0.15); fpsBad = 0; }
    else if (fpsGood >= 6 && quality < 1) { quality = Math.min(1, quality + 0.08); fpsGood = 0; }
  }

  /* ------------------------------------------------------------------ API */

  function coinButton(txt, attr, val) {
    return '<button type="button" ' + attr + '="' + val + '" style="min-width:68px;padding:6px 10px;margin:2px;border-radius:7px;border:1px solid rgba(255,255,255,.38);background:rgba(244,190,48,.92);color:#172018;font:800 var(--fs-2xs) var(--f-body);cursor:pointer">' + txt + "</button>";
  }

  function tossContext() {
    var t = sim.toss || {}, my = +t.myLevel, opp = +t.oppLevel;
    if (!isFinite(my)) my = 75;
    if (!isFinite(opp)) opp = 75;
    var style = String(t.style || "balanced");
    if (["possession", "direct", "press", "counter", "balanced"].indexOf(style) < 0) style = "balanced";
    return {me: String(t.myName || label("Tu equipo")), opp: String(t.oppName || label("Rival")),
      myLevel: my, oppLevel: opp, diff: my - opp, style: style,
      styleLabel: label({possession: "Posesión", direct: "Juego directo", press: "Presión alta",
        counter: "Contragolpe", balanced: "Equilibrado"}[style]), wx: weatherInfo(sim.wx)};
  }

  function tossAdvice(choice) {
    var x = tossContext(), pros = [], cons = [];
    if (choice === "campo") {
      pros.push(label("Eliges la orientación y hacia qué portería atacar."));
      if (x.wx.key === "rain") pros.push(label("Con el césped resbaladizo, proteges el lado de tu salida."));
      else if (x.wx.key === "heat") pros.push(label("Evitas atacar de cara al sol en el segundo tiempo."));
      else if (x.wx.key === "cold") pros.push(label("Puedes elegir el lado con menos viento y nieve."));
      if (x.style === "possession") cons.push(label("Su posesión se adapta a cualquier orientación."));
      else if (x.style === "press") cons.push(label("Su presión alta puede cerrarte la banda que defiendes."));
      else if (x.style === "direct") cons.push(label("Su juego directo funciona igual en las dos porterías."));
      else if (x.style === "counter") cons.push(label("Te cederá el balón y buscará tu espalda desde el inicio."));
      if (x.diff < -3) cons.push(label("El cambio de lado no compensa su superioridad."));
    } else {
      pros.push(label("Conservas el saque de centro y marcas el primer ritmo."));
      if (x.style === "possession") pros.push(label("Le obligas a correr detrás del balón desde el inicio."));
      else if (x.style === "direct") pros.push(label("Puedes jugar el primer balón en largo sin presión."));
      else if (x.style === "press") cons.push(label("Su presión alta puede atrapar tu primer pase."));
      else if (x.style === "counter") cons.push(label("Te cede la iniciativa y espera tu error para salir en contra."));
      if (x.wx.key === "rain") cons.push(label("El balón corre más: el primer pase puede escaparse."));
      else if (x.wx.key === "cold") cons.push(label("El balón pesado exige un primer toque más firme."));
      else if (x.wx.key === "heat") pros.push(label("Dosificar el ritmo desde el saque ahorra fuerzas."));
      if (x.diff > 3) pros.push(label("Tu superioridad te permite dominar el primer balón."));
      if (x.diff < -3) cons.push(label("Si el rival es superior, perderás el balón en zonas peligrosas."));
    }
    if (!pros.length) pros.push(label("Mantienes tu plan de saque sin cambios."));
    if (!cons.length) cons.push(label("No cambias de lado: mantienes la orientación actual."));
    return {pros: pros.slice(0, 2), cons: cons.slice(0, 2)};
  }

  function chooseRivalToss() {
    var x = tossContext();
    if (x.style === "press") return {choice: "campo", why: label("Quiere presionar hacia su propia grada en el primer tiempo.")};
    if (x.style === "possession") return {choice: "campo", why: label("Prefiere ordenar el campo y defender con la línea adelantada.")};
    if (x.style === "direct") return {choice: "campo", why: label("Busca atacar con el sol o el viento a favor en el segundo tiempo.")};
    if (x.style === "counter") return {choice: "campo", why: label("Quiere que su bloque pueda salir en contra hacia su banquillo.")};
    if (x.diff <= -4) return {choice: "pelota", why: label("No necesita cambiar nada: confía en su nivel y te deja el primer balón.")};
    if (x.wx.key === "rain") return {choice: "campo", why: label("Busca que la lluvia complique tu salida desde atrás.")};
    return {choice: "campo", why: label("Elige el lado que mejor encaja con su plan de partido.")};
  }

  function tossCard(choice, title) {
    var a = tossAdvice(choice), html = '<div style="flex:1;min-width:0;padding:3px;border-radius:7px;background:rgba(255,255,255,.055);text-align:left">' +
      coinButton(title, "data-p3d-choice", choice);
    for (var i = 0; i < a.pros.length; i++) html += '<span data-p3d-pro="' + choice + '" style="display:block;color:#b9ffd6;font:600 var(--fs-2xs)/1.18 var(--f-body);margin:2px 1px 0">✓ ' + a.pros[i] + "</span>";
    for (var j = 0; j < a.cons.length; j++) html += '<span data-p3d-con="' + choice + '" style="display:block;color:#ffd0a8;font:600 var(--fs-2xs)/1.18 var(--f-body);margin:2px 1px 0">✗ ' + a.cons[j] + "</span>";
    return html + "</div>";
  }

  function tossMeta() {
    var x = tossContext();
    return '<div data-p3d-toss-meta="1" style="display:block;font:600 var(--fs-2xs)/1.3 var(--f-body);opacity:.82;margin-top:4px;text-align:left">' +
      "🌤 " + label("Clima") + ": " + x.wx.icon + " " + x.wx.name + " · " + x.wx.effect + " · " + label("Fatiga") + " ×" + x.wx.fatigue.toFixed(2).replace(".", ",") + "<br>" +
      label("Rival") + ": " + x.opp + " · " + label("Nivel") + " " + x.oppLevel + " · " + x.styleLabel + "</div>";
  }

  function updateCoinTimer() {
    if (!coinEl) return;
    var c = sim.cinema;
    if (!c || !c.coin) return;
    var total = c.stage === "choose" ? CHOICE_WAIT : COIN_WAIT;
    var el = coinEl.querySelector("[data-p3d-timer]");
    if (el) el.textContent = Math.max(0, Math.ceil(total - (c.coin.waitT || 0))) + " s";
  }

  function updateCoinOverlay() {
    if (!coinEl) return;
    var c = sim.cinema;
    if (!c || c.type !== "intro" || !c.coin || !c.coin.show) { hideCoinOverlay(); return; }
    var s = "", face = c.coin.face === "cara" ? label("Cara") : label("Cruz");
    if (c.stage === "coinCall") {
      s = '<b style="display:block;font:800 var(--fs-xs)/1.2 var(--f-body)">' + label("Cara o cruz") + "</b>" +
        '<span style="display:block;font:500 var(--fs-2xs)/1.25 var(--f-body);opacity:.84;margin-top:2px">' + label("Elige tu llamada.") + "</span>" +
        '<div style="margin-top:4px">' + coinButton(label("Cara"), "data-p3d-coin", "cara") + coinButton(label("Cruz"), "data-p3d-coin", "cruz") + "</div>" +
        '<span style="display:block;font:700 var(--fs-2xs)/1.3 var(--f-body);margin-top:4px;color:#fff0b0">⏱ ' + label("Tiempo para llamar") + ': <b data-p3d-timer="1">' + Math.max(0, Math.ceil(COIN_WAIT - (c.coin.waitT || 0))) + " s</b></span>";
    } else if (c.stage === "coinFlip") {
      s = '<b style="display:block;font:800 var(--fs-xs) var(--f-body)">' + label("La moneda está en el aire…") + "</b>" +
        '<span style="display:block;font:500 var(--fs-2xs) var(--f-body);opacity:.78;margin-top:2px">' + labelv("Has llamado {v}.", {v: c.coin.call === "cara" ? label("Cara") : label("Cruz")}) + "</span>";
    } else if (c.stage === "coinResult") {
      s = '<b style="display:block;font:800 var(--fs-sm) var(--f-body)">' + labelv("Salió {v}.", {v: face}) + "</b>" +
        '<span style="display:block;font:600 var(--fs-2xs) var(--f-body);margin-top:2px;color:' + (c.coin.winner === 0 ? "#b9ffd6" : "#ffd0a8") + '">' +
        (c.coin.winner === 0 ? label("Ganas el sorteo.") : label("Gana el rival.")) + "</span>";
    } else if (c.stage === "choose") {
      s = '<b style="display:block;font:800 var(--fs-xs)/1.2 var(--f-body)">' + label("¡Ganaste el sorteo!") + "</b>" +
        '<span style="display:block;font:500 var(--fs-2xs)/1.2 var(--f-body);opacity:.84;margin-top:2px">' + label("¿Campo o pelota?") + "</span>" +
        '<div style="display:flex;gap:4px;margin-top:4px">' + tossCard("campo", label("Campo")) + tossCard("pelota", label("Pelota")) + "</div>" +
        '<span style="display:block;font:500 var(--fs-2xs)/1.2 var(--f-body);opacity:.62;margin-top:2px">' + label("Campo cambia de lado · Pelota mantiene el saque") + "</span>" +
        '<span style="display:block;font:700 var(--fs-2xs)/1.3 var(--f-body);margin-top:4px;color:#fff0b0">⏱ ' + label("Tiempo para elegir") + ': <b data-p3d-timer="1">' + Math.max(0, Math.ceil(CHOICE_WAIT - (c.coin.waitT || 0))) + " s</b></span>" + tossMeta();
    } else if (c.stage === "rivalChoice") {
      var rp = c.coin.choice === "campo" ? label("Campo") : label("Pelota");
      s = '<b style="display:block;font:800 var(--fs-xs) var(--f-body)">' + label("Gana el rival el sorteo") + "</b>" +
        '<span style="display:block;font:600 var(--fs-2xs)/1.25 var(--f-body);margin-top:2px">' + labelv("Elige {v}.", {v: rp}) + "</span>" +
        '<span data-p3d-rival-why="1" style="display:block;font:500 var(--fs-2xs)/1.25 var(--f-body);opacity:.82;margin-top:2px">' +
        (c.coin.rivalWhy || label("Elige el lado que mejor encaja con su plan de partido.")) + "</span>" + tossMeta();
    } else if (c.stage === "choiceResult") {
      var cc = c.coin.choice === "campo" ? label("Campo elegido") : label("Saque elegido");
      var res = c.coin.winner === 1 ? label("El rival decide: ") : "";
      s = '<b style="display:block;font:800 var(--fs-xs) var(--f-body)">' + res + cc + "</b>" +
        '<span data-p3d-choice-result="' + (c.coin.choice || "") + '" style="display:block;font:500 var(--fs-2xs)/1.25 var(--f-body);opacity:.82;margin-top:2px">' +
        (c.coin.choice === "campo" ? label("Cambiamos de lado antes del saque. Conservas el saque de centro.") : label("No cambiamos de lado. Conservas el saque de centro.")) + "</span>" +
        tossMeta();
    }
    if (!s) { hideCoinOverlay(); return; }
    coinEl.innerHTML = s;
    coinEl.style.display = "block";
  }

  function hideCoinOverlay() {
    if (!coinEl) return;
    coinEl.style.display = "none";
    coinEl.innerHTML = "";
  }

  function makeCoinOverlay() {
    coinEl = document.createElement("div");
    coinEl.className = "lpitch3d-coin";
    coinEl.setAttribute("role", "status");
    coinEl.setAttribute("aria-live", "polite");
    coinEl.style.cssText = "position:absolute;z-index:24;left:50%;bottom:8px;transform:translateX(-50%);width:min(392px,94%);max-height:56%;overflow:auto;box-sizing:border-box;padding:6px 9px;border:1px solid rgba(255,255,255,.30);border-radius:9px;background:rgba(5,15,12,.90);color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.32);display:none";
    coinEl.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var b = ev.target;
      while (b && b !== coinEl && !b.getAttribute("data-p3d-coin") && !b.getAttribute("data-p3d-choice")) b = b.parentNode;
      if (!b || b === coinEl) return;
      if (b.getAttribute("data-p3d-coin")) coinCall(b.getAttribute("data-p3d-coin"));
      else coinChoice(b.getAttribute("data-p3d-choice"));
    });
    host.appendChild(coinEl);
  }

  function mount(el, o) {
    destroy();
    petA = null; boardKey = "";
    host = el; opts = o || {};
    var srcCols = opts.cols && opts.cols.length ? opts.cols : SHIRT;
    colors = [kitColor(srcCols[0], rgb(SHIRT[0])), kitColor(srcCols[1], rgb(SHIRT[1]))];
    disposed = false; frozen = false; reduced = false;
    loadAssets();
    todSel = pickTod();
    try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (ignore) {}
    canvas = document.createElement("canvas");
    canvas.className = "lpitch lpitch3d";
    canvas.setAttribute("aria-label", label("Vista 3D del partido"));
    canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.minHeight = "210px";
    host.appendChild(canvas);
    quality = opts.quality != null ? +opts.quality : (window.devicePixelRatio || 1) > 2 ? 0.75 : 1;
    try { initGL(); } catch (err) {
      if (window.console) console.warn("Pitch3D: se activa el campo 2D de reserva", err);
      destroy(); return false;
    }
    hud = document.createElement("div");
    hud.className = "lpitch3d-hud";
    hud.style.cssText = "position:absolute;z-index:19;left:6px;bottom:6px;padding:5px 7px;border-radius:5px;background:rgba(5,15,12,.78);color:#b9ffd6;font:600 var(--fs-2xs) ui-monospace,monospace;pointer-events:none";
    hud.textContent = "3D · midiendo rendimiento…";
    host.appendChild(hud);
    scoreHud = document.createElement("div");
    scoreHud.className = "lpitch3d-score";
    scoreHud.setAttribute("aria-live", "polite");
    scoreHud.style.cssText = "position:absolute;z-index:19;left:6px;top:6px;display:none;align-items:center;gap:5px;padding:4px 7px;border-radius:5px;background:rgba(5,15,12,.80);color:#fff;font:700 var(--fs-2xs)/1 ui-monospace,monospace;pointer-events:none";
    host.appendChild(scoreHud);
    replayBtn = document.createElement("button"); replayBtn.type = "button";
    replayBtn.textContent = "↺"; replayBtn.setAttribute("aria-label", label("Ver la repetición"));
    replayBtn.style.cssText = "position:absolute;z-index:20;right:6px;bottom:6px;width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.35);background:rgba(8,20,18,.82);color:#fff;font:700 var(--fs-base) var(--f-body);cursor:pointer";
    replayBtn.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); startReplay(); });
    host.appendChild(replayBtn);
    try { if (window.getComputedStyle(host).position === "static") host.style.position = "relative"; } catch (ignore) {}
    makeCoinOverlay();
    host.addEventListener("webglcontextlost", onLost, false);
    sim = newSim();
    freezeWanted = false;
    sim.fem = !!opts.fem;
    resize();
    lastTs = 0; acc = 0; aiAcc = 0; histAcc = 0; fps = 0; fpsFrames = 0; fpsStart = 0;
    if (pitchAudio()) pitchAudio().mount();
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
        crowdBufs.forEach(function (b) { if (b) gl.deleteBuffer(b); });
        if (wxBuf) gl.deleteBuffer(wxBuf);
        if (dynBuf) gl.deleteBuffer(dynBuf);
        if (progFull) gl.deleteProgram(progFull);
        if (progLite) gl.deleteProgram(progLite);
        if (shadowProg) gl.deleteProgram(shadowProg);
        if (fxBuf) gl.deleteBuffer(fxBuf);
        if (skyBuf) gl.deleteBuffer(skyBuf);
        if (shadowFb) gl.deleteFramebuffer(shadowFb);
        if (shadowTex) gl.deleteTexture(shadowTex);
        if (shadowRb) gl.deleteRenderbuffer(shadowRb);
      } catch (ignore) {}
    }
    gl = null; staticBuf = dynBuf = null; program = null; locations = null; progFull = progLite = null; locFull = locLite = null; staticMesh = null; dyn = null; staticCount = 0; crowdBufs = [null, null]; crowdCounts = [0, 0]; wxBuf = null; wxCount = 0; wxKey = "";
    shadowProg = shadowFb = shadowTex = shadowRb = null; shadowSize = 0; fxBuf = skyBuf = null; fx = null; envNow = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); canvas = null;
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud); hud = null;
    if (scoreHud && scoreHud.parentNode) scoreHud.parentNode.removeChild(scoreHud); scoreHud = null;
    if (replayBtn && replayBtn.parentNode) replayBtn.parentNode.removeChild(replayBtn); replayBtn = null;
    if (coinEl && coinEl.parentNode) coinEl.parentNode.removeChild(coinEl); coinEl = null;
    host = null; sim = newSim(); freezeWanted = false; frozen = false; lastTs = 0; fps = 0;
    if (pitchAudio()) pitchAudio().stop();
  }

  function teams(home, away, fixedNums) {
    syncTeam(0, home, fixedNums && fixedNums[0]);
    syncTeam(1, away, fixedNums && fixedNums[1]);
    if (!sim.officials.length) initOfficials();
    for (var oi = 0; oi < sim.officials.length; oi++) setActorVariant(sim.officials[oi]);
    if (!sim.started && listOf(0).length && listOf(1).length) {
      sim.started = true;
      /* Al reabrir o cambiar a 3D con el partido ya empezado no se repite la
       * entrada desde el túnel; solo ocurre en el arranque real. */
      if (opts.cinematics === false) setupKickoff(sim.own);
      else startIntro();
    }
  }

  function scoreChip(c) {
    var r = Math.round(clamp(c[0], 0, 1) * 255), g = Math.round(clamp(c[1], 0, 1) * 255), b = Math.round(clamp(c[2], 0, 1) * 255);
    return '<i style="display:inline-block;width:6px;height:6px;border-radius:1px;background:rgb(' + r + ',' + g + ',' + b + ')"></i>';
  }

  function updateScoreHud() {
    if (!scoreHud) return;
    scoreHud.style.display = sim.scoreOn ? "flex" : "none";
    if (!sim.scoreOn) return;
    scoreHud.innerHTML = '<em style="font-style:normal;opacity:.68;margin-right:2px">' + sim.min + "'</em>" +
      scoreChip(colors[0]) + "<b>" + sim.score[0] + "</b>" +
      '<span style="opacity:.55">–</span><b>' + sim.score[1] + "</b>" + scoreChip(colors[1]);
  }

  function scorePair(v) {
    return [clamp(Math.round(+v[0] || 0), 0, 99), clamp(Math.round(+v[1] || 0), 0, 99)];
  }

  /* El estado del motor fija el marcador objetivo. La UI 3D no lo muestra
   * hasta que la pelota cruza la línea; así el HUD no se adelanta al vuelo. */
  /* 5.6: videomarcador del partido con los escudos (opts.board = {h:{ab,pix}, a:{ab,pix}}) */
  var boardCache = null, boardKey = "";
  function drawBoard(m) {
    var b = opts && opts.board; if (!b) return;
    var key = sim.score[0] + "-" + sim.score[1] + "-" + sim.min + "-" + (b.v || 0);
    if (key !== boardKey) { boardKey = key; boardCache = boardVerts({h: b.h, a: b.a, gh: sim.score[0], ga: sim.score[1], min: sim.min}); }
    if (!boardCache || !boardCache.length) return;
    m.reserve(boardCache.length / FS); m.a.set(boardCache, m.n); m.n += boardCache.length;
  }
  /* 5.6: la mascota del jugador, junto al banquillo local; celebra los goles de su equipo */
  var petA = null, petT = 0;
  function drawPet(m) {
    if (!opts || !opts.pet || typeof PetRig === "undefined" || !PetRig || typeof PetSim === "undefined") return;
    try {
      var pt = opts.pet, O = [LEN / 2, 0, MIDZ];
      if (!petA) {
        petA = new PetRig.Actor({k: pt.k, stage: PetSim.stage(pt), col: pt.col, ico: typeof petIco === "function" ? petIco(pt) : "", eq: pt.eq || {}, scale: 2});
        petA.x = LEN / 2 + (opts.mySide === 1 ? 9 : -9) + 4.6 - O[0]; petA.z = -1.8 - O[2]; petA.yaw = 0.2; petA.baseExpr = "happy"; petA.mood = pt.mood || 70; petA.float = true;
        if (petA.plan === "fish") petA.y = 0.5;
      }
      var now = sim.time || 0, dt = Math.min(0.05, Math.max(0, now - petT)); petT = now;
      if (!petA.clip && Math.random() < dt * 0.15) petA.play(Math.random() < 0.5 ? "sniff" : "happy");
      petA.lookAt([sim.ball ? sim.ball.x - O[0] : 0, 0.3, sim.ball ? sim.ball.z - O[2] : 0], 0.8);
      petA.update(dt);
      petA.matrices();
      var M = petA.M, W = petA.W, ex = petA.curExpr();
      var bake = function (verts, Mx) { VoxCore.Engine.prototype.bake.call({dyn: m}, verts, Mx, null, m); };
      M.order.forEach(function (n) { bake(M.mesh[n], W[n]); });
      var fm = M.faceMesh(ex); if (fm) bake(fm, W[M.facePart]);
      petA.acc.forEach(function (q) { bake(q.verts, q.W); });
      if (petA.toy && petA.toy.verts) bake(petA.toy.verts, petA.toyM());
    } catch (e) { opts.pet = null; }
  }
  /* 5.6: el míster vóxel en su área técnica (modo míster): señala, se cruza de brazos, aplaude y celebra */
  var coachA = null, coachT = 0, coachNext = 2;
  function drawCoach(m) {
    if (!opts || !opts.coach || typeof SpRig === "undefined" || !SpRig) return;
    try {
      var co = opts.coach, O = [LEN / 2, 0, MIDZ];
      if (!coachA) {
        coachA = new SpRig.Man(co.rig || {shirt: co.suit || "#2a3340", shorts: co.trousers || co.suit || "#2a3340", socks: co.trousers || "#1b1d1f", trim: co.trousers || co.suit || "#2a3340", skin: co.skin || "#c18a5e", hair: co.hair || "#2a1a10", boots: co.shoes || "#1b1d1f", hairStyle: co.hs || 0, fem: !!co.fem, official: true, gk: true, gloves: co.skin || "#c18a5e", longLegs: true, tie: co.tie || "#7a1d1d"});
        coachA.x = LEN / 2 + (opts.mySide === 1 ? 9 : -9) - 1.6 - O[0]; coachA.z = -2.6 - O[2]; coachA.yaw = 0;
      }
      var now = sim.time || 0, dt = Math.min(0.05, Math.max(0, now - coachT)); coachT = now;
      coachNext -= dt;
      if (!coachA.clip && coachNext <= 0) {
        var mine = sim.ball && sim.ball.side === (opts.mySide || 0);
        /* 5.7: con libreta o tableta, a ratos apunta (más cuando el rival tiene el balón) */
        var nt = coachA.o && coachA.o.notes && SpRig.CLIPS.cnotes && Math.random() < (mine ? 0.15 : 0.35);
        coachA.play(nt ? "cnotes" : mine ? (Math.random() < 0.6 ? "cpoint" : "cclap") : (Math.random() < 0.55 ? "ccross" : "cpoint"));
        coachNext = 3 + Math.random() * 4;
      }
      /* mira hacia el balón girando poco a poco */
      if (sim.ball) { var want = Math.atan2(sim.ball.x - O[0] - coachA.x, sim.ball.z - O[2] - coachA.z); var d = want - coachA.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; coachA.yaw += d * Math.min(1, dt * 2.5); }
      coachA.update(dt); coachA.matrices();
      var bake = function (verts, Mx) { VoxCore.Engine.prototype.bake.call({dyn: m}, verts, Mx, null, m); };
      SpRig.ORDER.forEach(function (n) { bake(coachA.m.mesh[n], coachA.W[n]); });
    } catch (e) { opts.coach = null; }
  }
  function coachGoal(side) {
    if (!coachA) return;
    coachA.clip = null; coachA.play(side === (opts.mySide || 0) ? "cfist" : "chead"); coachNext = 3;
  }
  function petGoal(side) {
    coachGoal(side);
    if (!petA) return;
    if (side === (opts.mySide || 0)) { petA.clip = null; petA.play("jump", {done: function () { petA.play("spin"); }}); petA.say("excited", 3); }
    else { petA.clip = null; petA.play("sad"); petA.say("sad", 2.5); }
  }
  function commitGoal(side) {
    petGoal(side);
    sim.score[side] = clamp(sim.score[side] + 1, 0, 99);
    if (sim.scorePending > 0) sim.scorePending--;
    if (!sim.scorePending) {
      sim.scoreForceAt = 0;
      var st = sim.scoreTarget;
      /* Si el objetivo ya contiene este gol, se adopta para corregir
       * cualquier evento perdido. Nunca se retrocede el marcador mostrado. */
      if (st && st[0] >= sim.score[0] && st[1] >= sim.score[1]) sim.score = st.slice();
    }
    updateScoreHud();
  }

  function reconcileScore(force) {
    if (!sim.scoreOn) return;
    if (sim.scorePending && !force && sim.time <= sim.scoreForceAt) return;
    var st = sim.scoreTarget;
    if (!st) return;
    /* El HUD nunca retrocede: si el objetivo viniera por detrás del marcador
     * ya mostrado, se conserva lo mostrado y solo se limpia el pendiente. */
    if (st[0] >= sim.score[0] && st[1] >= sim.score[1]) sim.score = st.slice();
    sim.scorePending = 0; sim.scoreForceAt = 0;
    updateScoreHud();
  }

  /* El clima nunca toca las fórmulas del motor: solo cambia la lectura visual
   * del balón suelto y la niebla de la cámara. La fatiga real ya la aplica
   * match41 con MX_WX. */
  function weatherFx(wx) {
    var k = String(wx || "sun");
    if (k === "rain") return {key: k, friction: 0.64, bounce: 0.30, near: 62, far: 185, fatigue: 1.06};
    if (k === "cold") return {key: k, friction: 0.60, bounce: 0.24, near: 72, far: 195, fatigue: 0.95};
    if (k === "heat") return {key: k, friction: 0.53, bounce: 0.34, near: 78, far: 200, fatigue: 1.16};
    if (k === "mild") return {key: k, friction: 0.55, bounce: 0.32, near: 80, far: 205, fatigue: 1};
    return {key: "sun", friction: 0.55, bounce: 0.32, near: 90, far: 220, fatigue: 1};
  }

  function weatherInfo(wx) {
    var fx = weatherFx(wx), meta = {
      sun: ["☀", "Despejado", "Campo rápido"],
      mild: ["☁", "Nublado", "Sin efecto claro"],
      rain: ["🌧", "Lluvia", "Balón vivo y césped resbaladizo"],
      heat: ["🔥", "Calor", "Ritmo lento y fatiga alta"],
      cold: ["❄", "Frío", "Balón pesado y bote seco"]
    }[fx.key] || ["☀", "Despejado", "Campo rápido"];
    return {key: fx.key, icon: meta[0], name: label(meta[1]), effect: label(meta[2]),
      fatigue: fx.fatigue, friction: fx.friction, bounce: fx.bounce, near: fx.near, far: fx.far};
  }

  function state(o) {
    if (!o || sim.replay) return;
    if (o.wx && o.wx !== sim.wx) sim.wx = String(o.wx);
    if (o.tod && /^(day|dusk|night)$/.test(o.tod)) todSel = o.tod;
    if (o.toss && typeof o.toss === "object") sim.toss = o.toss;
    var scoreChanged = false;
    if (o.score && o.score.length >= 2) {
      sim.scoreTarget = scorePair(o.score);
      sim.scoreOn = true; scoreChanged = true;
      /* Sin un gol pendiente se adopta de inmediato: así se recupera la
       * sincronía al abrir el directo, cambiar de cámara o perder un evento.
       * El HUD nunca retrocede por debajo de lo ya mostrado. */
      if (!sim.scorePending || sim.time > sim.scoreForceAt) {
        var tgt = sim.scoreTarget;
        if (tgt[0] >= sim.score[0] && tgt[1] >= sim.score[1]) sim.score = tgt.slice();
        sim.scorePending = 0; sim.scoreForceAt = 0;
      }
    }
    if (o.min != null && isFinite(+o.min)) { sim.min = clamp(Math.round(+o.min), 0, 130); scoreChanged = true; }
    if (scoreChanged) updateScoreHud();
    if (o.fem != null && sim.fem !== !!o.fem) { sim.fem = !!o.fem; refreshActorVariants(); }
    if (o.speed != null) sim.rate = clamp(+o.speed || 1, 1, 3);
    if (sim.ended) return;
    /* Durante la entrada o el descanso el motor sigue siendo la autoridad:
     * se guarda quién saca, pero no se mueve el balón ni la posesión. */
    if (sim.cinema) {
      if (o.own != null && !sim.koSet) {
        var cineOwn = o.own === 1 ? 1 : 0;
        sim.koSet = true; sim.kickoffSide = cineOwn; sim.own = cineOwn;
      }
      return;
    }
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
      /* el primer estado fija quién saca de centro; al descanso saca el otro */
      if (!sim.koSet) {
        sim.koSet = true; sim.kickoffSide = own;
        if (sim.restart && sim.restart.type === "kickoff" && sim.restart.side !== own) setupKickoff(own);
      }
      if (sim.action) sim.pendingOwn = own;
      else if (own !== sim.own && !sim.restart) changePossession(own);
    }
    if (o.bx != null) sim.bx = clamp(+o.bx, 0, 100);
    /* La posición del motor ya es continua. Si el portador está lejos del objetivo,
       corre hacia él; antes se lanzaba un pase de 50 m solo para "reconciliar" el estado. */
    if (!sim.action && !sim.restart && sim.ball.mode === "held") {
      var targetX = sim.attack[0] > 0 ? sim.bx / 100 * LEN : (1 - sim.bx / 100) * LEN;
      var carrier = actorAt(sim.ball.side, sim.ball.idx);
      if (carrier) carrier.tx = clamp(targetX, 3, LEN - 3);
    }
  }

  /* Cambio de posesión creíble: el defensor tiene que llegar al portador y
   * quitársela (entrada) o cortar un pase; el balón nunca salta a un jugador
   * lejano. El motor ya decidió el cambio: aquí solo se escenifica. */
  function winBall(side, ch, carrier) {
    var b = sim.ball;
    ch.visualAnim = {type: "tackle", t: 0, dur: 0.75, dir: b.z >= ch.z ? 1 : -1};
    fxTackle(ch);
    if (carrier && !carrier.anim) carrier.visualAnim = {type: "tackle", t: 0.4, dur: 0.75, dir: 0};
    if (Math.random() < 0.62 && dist(ch.x, ch.z, b.x, b.z) < 2.2) giveTo(side, ch.slot);
    else {
      var dir = sim.attack[side];
      releaseBall(dir * rnd(1.5, 3.5), rnd(-1.5, 1.5), 0.6);
      b.claim = {side: side, idx: ch.slot, until: sim.time + 2.5};
      b.lastTouch = side;
    }
    sim.own = side;
  }
  function changePossession(side) {
    var b = sim.ball;
    sim.restart = null; sim.challenge = null;
    var ch = nearestActor(side, b.x, b.z, true) || nearestActor(side, b.x, b.z, false);
    if (b.mode === "flight" && !sim.action) {
      /* pase cortado: el rival más cercano al punto de caída se queda con él */
      var f = b.fl, ix = nearestActor(side, f ? f.x1 : b.x, f ? f.z1 : b.z, true);
      if (f && ix && dist(ix.x, ix.z, f.x1, f.z1) < 14) {
        b.next = {type: "held", side: side, idx: ix.slot};
        ix.passTarget = {x: f.x1, z: f.z1, until: sim.time + (f.dur - f.t) + 0.8};
        ix.maxSp = 8 * ix.pace;
        if (sim.lastPass) sim.lastPass.pending = false;
      } else {
        b.fl = null; b.next = null; b.mode = "loose"; b.vx *= 0.35; b.vz *= 0.35;
        if (ch) b.claim = {side: side, idx: ch.slot, until: sim.time + 3};
      }
      b.lastTouch = side; sim.own = side; tryPendingPass(); return;
    }
    var carrier = b.mode === "held" ? actorAt(b.side, b.idx) : null;
    if (carrier && b.side !== side && ch) {
      var d = dist(ch.x, ch.z, b.x, b.z);
      if (d <= 2.6) winBall(side, ch, carrier);
      else if (d <= 20) {
        /* presión: el defensor corre al portador y le roba al llegar */
        sim.challenge = {side: side, ch: ch, carrier: carrier, until: sim.time + clamp(d / 7.2 + 0.4, 0.7, 3.2)};
        ch.maxSp = 8.4 * ch.pace;
      } else {
        /* pase interceptado: el portador busca a un compañero y el rival lo corta */
        var lx = clamp(ch.x + ch.vx * 0.3, 2, LEN - 2), lz = clamp(ch.z + ch.vz * 0.3, 2.5, WID - 2.5), dd = dist(b.x, b.z, lx, lz);
        var dur = clamp(dd / 22, 0.5, 1.8);
        carrier.visualAnim = {type: "pass", t: 0, dur: 0.56};
        ch.passTarget = {x: lx, z: lz, until: sim.time + dur + 0.6};
        launchBall(lx, lz, 0.23, dur, dd > 25 ? clamp(dd * 0.03, 0.5, 1.6) : 0.15, {type: "held", side: side, idx: ch.slot}, 0);
        b.lastTouch = side;
      }
      sim.own = side; return;
    }
    if (b.mode === "dead" || b.mode === "loose") {
      if (ch && dist(ch.x, ch.z, b.x, b.z) < 2.6) giveTo(side, ch.slot);
      else if (ch) { if (b.mode === "dead") { b.mode = "loose"; b.vx = b.vz = b.vy = 0; } b.claim = {side: side, idx: ch.slot, until: sim.time + 4}; }
    }
    sim.own = side;
    tryPendingPass();
  }
  function updateChallenge() {
    var c = sim.challenge; if (!c) return;
    var b = sim.ball;
    if (sim.action || sim.restart || b.mode !== "held" || actorAt(b.side, b.idx) !== c.carrier || c.ch.gone) { sim.challenge = null; return; }
    c.ch.tx = clamp(b.x + b.vx * 0.2, 1, LEN - 1); c.ch.tz = clamp(b.z + b.vz * 0.2, 1.5, WID - 1.5); c.ch.maxSp = 8.4 * c.ch.pace;
    /* el portador protege el balón y frena un poco */
    c.carrier.maxSp = Math.min(c.carrier.maxSp || 6, 5.2);
    if (dist(c.ch.x, c.ch.z, b.x, b.z) < 1.5 || sim.time > c.until) { sim.challenge = null; winBall(c.side, c.ch, c.carrier); }
  }

  function event(e) { handleEvent(e); }

  function actionLeft(a) {
    if (!a) return 0;
    if (a.type === "card") return a.stage === "show" ? Math.max(0, 1.75 - a.showT) :
      Math.max(0, 1.45 - a.t) + 1.75;
    if (a.type !== "shot") return Math.max(0, a.dur - a.t);
    if (a.stage === "build") return Math.max(0, (a.buildMax || a.buildup) - a.t) + 0.18 + 0.5 + a.outcome;
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
    /* Las secuencias se sondean desde la UI: el minuto no avanza hasta que
     * termina la puesta en escena. */
    if (sim.cinema) ms += 620;
    return ms;
  }

  function reset() {
    var old = sim;
    hideCoinOverlay();
    sim = newSim();
    sim.players = old.players;
    sim.tactics = old.tactics;
    sim.started = !!old.started;
    sim.fem = !!old.fem;
    refreshActorVariants();
    initOfficials();
    sim.attack = [1, -1];
    sim.own = 0;
    for (var s = 0; s < 2; s++) {
      for (var i = 0; i < 11; i++) {
        var a = sim.players[s] && sim.players[s][i];
        if (!a) continue;
        a.sentOff = false; a.gone = false; a.hidden = false; a.anim = null; a.visualAnim = null;
        a.baseX = worldBaseX(s, a.nx); a.baseZ = a.nz * WID;
      }
    }
    sim.kickoffSide = 0;
    freezeWanted = false; frozen = false;
    if (scoreHud) scoreHud.style.display = "none";
    setupKickoff(0);
    cam.x = LEN / 2; cam.z = MIDZ; cam.lookX = LEN / 2; cam.lookZ = MIDZ;
  }

  function freeze(v) {
    freezeWanted = !!v;
    /* Si la UI pausa en mitad de una secuencia, se termina de ver y el
     * congelado se aplica al volver al juego. */
    if (freezeWanted && sim.cinema) { frozen = false; return; }
    frozen = freezeWanted;
    if (!frozen) { lastTs = 0; acc = 0; }
  }

  function replay() { return startReplay(); }

  function cinema() {
    var c = sim.cinema;
    if (!c) return null;
    var coin = null;
    if (c.coin) coin = {show: !!c.coin.show, call: c.coin.call, face: c.coin.face,
      winner: c.coin.winner, choice: c.coin.choice, waitT: +(c.coin.waitT || 0).toFixed(3),
      angle: +(c.coin.angle || 0).toFixed(3), rivalWhy: c.coin.rivalWhy || null};
    return {type: c.type, stage: c.stage, t: +c.t.toFixed(3), stageT: +c.stageT.toFixed(3), coin: coin};
  }

  /* Diagnóstico barato para el smoke test: detecta NaN y triángulos
   * desgarrados sin exponer el VBO completo. */
  function meshStats() {
    if (!dyn || !dyn.n) return {verts: 0, tris: 0, maxEdge: 0, nan: 0, bad: 0};
    var a = dyn.a, n = dyn.n, maxEdge = 0, nan = 0, bad = 0;
    for (var i = 0; i + 3 * FS - 1 < n; i += 3 * FS) {
      var ax = a[i], ay = a[i + 1], az = a[i + 2];
      var bx = a[i + FS], by = a[i + FS + 1], bz = a[i + FS + 2];
      var cx = a[i + 2 * FS], cy = a[i + 2 * FS + 1], cz = a[i + 2 * FS + 2];
      if (!isFinite(ax + ay + az + bx + by + bz + cx + cy + cz)) nan++;
      var e = Math.max(Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by) + (az - bz) * (az - bz)),
        Math.sqrt((bx - cx) * (bx - cx) + (by - cy) * (by - cy) + (bz - cz) * (bz - cz)),
        Math.sqrt((cx - ax) * (cx - ax) + (cy - ay) * (cy - ay) + (cz - az) * (cz - az)));
      if (e > maxEdge) maxEdge = e;
      if (!isFinite(e) || e > 1.5) bad++;
    }
    return {verts: n / FS, tris: n / (3 * FS), maxEdge: +maxEdge.toFixed(3), nan: nan, bad: bad};
  }

  function debug() {
    var err = 0;
    try { if (gl) err = gl.getError(); } catch (ignore) {}
    var assetLods = 0;
    if (assetModels && assetModels.players) for (var v in assetModels.players) if (assetModels.players.hasOwnProperty(v)) {
      for (var l in assetModels.players[v]) if (assetModels.players[v].hasOwnProperty(l) && assetModels.players[v][l]) assetLods++;
    }
    var gk = null;
    if (sim.action && sim.action.type === "goalkick") {
      var ga = sim.action;
      gk = {active: true, side: ga.side, phase: ga.phase, phaseIndex: ga.phaseIndex, phases: ga.phaseLog.slice(),
        t: +ga.t.toFixed(3), dur: +ga.dur.toFixed(3), impactAt: +ga.impactAt.toFixed(3),
        launched: ga.launched, launchPhase: ga.launchPhase, launchT: +ga.launchT.toFixed(3),
        shortK: ga.shortK, pressure: false, receiver: ga.receiver ? ga.receiver.slot : -1,
        minPressureDist: +ga.minPressureDist.toFixed(3), opponentsOutside: !!ga.opponentsOutside,
        playersInsideArea: ga.playersInsideArea || 0, opponentsMoved: ga.opponentsMoved || 0,
        safeDist: GK_SAFE_DIST};
    } else if (sim.lastGoalKick) gk = sim.lastGoalKick;
    return {coach: coachA ? {x: coachA.x, z: coachA.z, clip: coachA.clip ? coachA.clip.n : null} : null, sim: sim, ball: sim.ball, action: sim.action, goalkick: gk, card: sim.lastCard,
      weather: weatherInfo(sim.wx), toss: sim.toss, setPiece: sim.lastSetPiece, cinema: cinema(), quality: quality, fps: fps, frames: frameCount,
      gl: !!gl, glError: err, players: sim.players, history: sim.history.length, camera: cam, mesh: meshStats(),
      assets: {state: assetState, lods: assetLods, statics: assetModels ? Object.keys(assetModels.static).length : 0,
        errors: assetModels && assetModels.errors ? assetModels.errors.length : 0,
        frameTris: assetFrameTris, framePlayers: assetFramePlayers, frameBall: assetFrameBall}};
  }

  /* Núcleo compartido (5.6): la mascota y las vistas 3D usan exactamente la misma malla vóxel con
     oclusión por vértice, los mismos shaders de luz y sombra y la misma ambientación que el partido.
     Solo se exponen piezas sin estado (no tocan el contexto ni la simulación de este módulo). */
  /* 5.6: videomarcador con los escudos y el resultado (en las dos pantallas de los fondos).
     b = {h:{ab, pix}, a:{ab, pix}, gh, ga, min|tag}; pix = {w, h, d:[r,g,b|null…]} (escudo rasterizado) */
  var FONT3 = {A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
    K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
    U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111", "-": "000000111000000", "'": "010010000000000", " ": "000000000000000"};
  function glyph3(ch) { if (/[0-9]/.test(ch)) return DIGITS[+ch]; ch = String(ch).toUpperCase(); if (ch.normalize) ch = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); return FONT3[ch] || null; }
  function boardVerts(b, screens) {
    var m = new Mesh(1 << 16), GW = 74, GH = 24;
    (screens || SCREENS).forEach(function (sc) {
      var W = sc.z1 - sc.z0, H = sc.y1 - sc.y0, px = Math.min(W / GW, H / GH), u0 = (sc.z0 + sc.z1) / 2, v0 = (sc.y0 + sc.y1) / 2;
      var right = sc.out > 0 ? 1 : -1, xf = sc.x - sc.out * 0.02;
      /* fondo oscuro de la pantalla */
      m.code = MAT_UNLIT; m.box(xf, sc.y0 + 0.05, u0, 0.03, H - 0.1, W - 0.1, [0.03, 0.05, 0.08], 1);
      function dot(gx, gy, c, k) { var z = u0 + right * (gx - GW / 2 + 0.5) * px, y = v0 + (GH / 2 - gy - 1) * px; m.box(xf - sc.out * 0.03, y, z, 0.03, px * (k || 0.86), px * (k || 0.86), c, 1); }
      function text(str, cx, gy, sz, c) { var w = str.length * 4 - 1, x0 = Math.round(cx - w * sz / 2); for (var i = 0; i < str.length; i++) { var g = glyph3(str.charAt(i)); if (!g) continue; for (var r = 0; r < 5; r++) for (var q = 0; q < 3; q++) if (g.charAt(r * 3 + q) === "1") for (var a = 0; a < sz; a++) for (var bb = 0; bb < sz; bb++) dot(x0 + (i * 4 + q) * sz + a, gy + r * sz + bb, c); } }
      function crest(p, cx, gy) { if (!p) return; var x0 = Math.round(cx - p.w / 2); for (var y = 0; y < p.h; y++) for (var x = 0; x < p.w; x++) { var c = p.d[y * p.w + x]; if (c) dot(x0 + x, gy + y, c, 1); } }
      m.code = MAT_EMIT;
      crest(b.h && b.h.pix, 10, 1); crest(b.a && b.a.pix, GW - 10, 1);
      text(String((b.h && b.h.ab) || "").slice(0, 3), 10, 18, 1, [1, 0.86, 0.3]); text(String((b.a && b.a.ab) || "").slice(0, 3), GW - 10, 18, 1, [1, 0.86, 0.3]);
      text(String(b.gh) + "-" + String(b.ga), GW / 2, 2, 3, [0.98, 0.98, 0.95]);
      var low = b.tag ? String(b.tag) : b.min != null ? String(b.min) + "'" : "";
      if (low) text(low.slice(0, 9), GW / 2, 18, 1, [0.6, 0.85, 1]);
      m.code = -1;
    });
    return m.a.slice(0, m.n);
  }
  /* 5.6: estadio, campo, afición y cielo para los minijuegos de balón parado (mismo aspecto que el partido) */
  function worldFor(cols) {
    var keepC = colors, keepL = LAMPS, keepCM = crowdMeshes;
    try {
      colors = [kitColor(cols && cols[0], rgb(SHIRT[0])), kitColor(cols && cols[1], rgb(SHIRT[1]))];
      LAMPS = []; crowdMeshes = [new Mesh(1 << 19), new Mesh(1 << 19)];
      var sm = new Mesh(1 << 20); buildField(sm);
      return {stat: sm.a.slice(0, sm.n), crowd: [crowdMeshes[0].a.slice(0, crowdMeshes[0].n), crowdMeshes[1].a.slice(0, crowdMeshes[1].n)], lamps: LAMPS.slice(), towers: TOWERS.map(function (t) { return t.slice(); }), screens: SCREENS.map(function (q) { return Object.assign({}, q); })};
    } finally { colors = keepC; LAMPS = keepL; crowdMeshes = keepCM; }
  }
  function skyVerts() {
    var m = new Mesh(16384), R = 210, cx = LEN / 2, cz = MIDZ, seg = 24, rings = 8;
    m.code = MAT_SKY;
    for (var j = 0; j < rings; j++) {
      var p0 = -0.25 + j * (PI / 2 + 0.25) / rings, p1 = -0.25 + (j + 1) * (PI / 2 + 0.25) / rings;
      for (var i = 0; i < seg; i++) {
        var a0 = i * TAU / seg, a1 = (i + 1) * TAU / seg;
        m.quad([cx + R * Math.cos(p0) * Math.cos(a0), R * Math.sin(p0), cz + R * Math.cos(p0) * Math.sin(a0)], [cx + R * Math.cos(p0) * Math.cos(a1), R * Math.sin(p0), cz + R * Math.cos(p0) * Math.sin(a1)],
          [cx + R * Math.cos(p1) * Math.cos(a1), R * Math.sin(p1), cz + R * Math.cos(p1) * Math.sin(a1)], [cx + R * Math.cos(p1) * Math.cos(a0), R * Math.sin(p1), cz + R * Math.cos(p1) * Math.sin(a0)], [1, 1, 1]);
      }
    }
    return m.a.slice(0, m.n);
  }
  var CORE = {Mesh: Mesh, boardVerts: boardVerts, world: worldFor, sky: skyVerts, VOX_PARTS: VOX_PARTS, HAIR_STYLES: HAIR_STYLES, HAIR_FEM: HAIR_FEM, LEN: LEN, WID: WID, POST: POST, BAR: BAR, STRIDE: FS, boxCorners: boxCorners, envFor: envFor, lin: lin,
    MAT: {MATTE: MAT_MATTE, GLOSS: MAT_GLOSS, METAL: MAT_METAL, GRASS: MAT_GRASS, EMIT: MAT_EMIT, CROWD: MAT_CROWD, SKY: MAT_SKY, UNLIT: MAT_UNLIT, LED: MAT_LED},
    VS_MAIN: VS_MAIN, FS_MAIN: FS_MAIN, VS_SHADOW: VS_SHADOW, FS_SHADOW: FS_SHADOW, VS_LITE: VS_LITE, FS_LITE: FS_LITE, U_NAMES: U_NAMES.slice(),
    DIGITS: DIGITS, ORIGIN: [LEN / 2, 0, MIDZ], VOXEL: 0.04};
  return {core: CORE, _pet: function () { return petA; }, mount: mount, destroy: destroy, teams: teams, state: state, event: event, busy: busy,
    reset: reset, freeze: freeze, replay: replay, debug: debug,
    cinema: cinema, skipCinema: skipCinema,
    lookCam: function (o) { camLock = o || null; },
    netHit: function (end, z, y, power) { netHit(end ? LEN : 0, z == null ? MIDZ : z, y == null ? 1.2 : y, power || 11); },
    fxBurst: function (x, z, power, dx, dz) { emitBurst(x, 0.02, z, 18, power == null ? 1 : power, dx || 1, dz || 0, 1); addDivot(x, z, dx || 1, dz || 0, 0.5); },
    env: function () { var e = currentEnv(); return {tod: e.tod, wx: sim.wx, shadows: useShadows(), shadowSize: shadowSize, staticTris: staticCount / 3, crowdTris: (crowdCounts[0] + crowdCounts[1]) / 3, lamps: LAMPS.length}; },
    active: function () { return !!gl && !disposed; },
    sound: function () { var a = pitchAudio(); return a && typeof a.isOn === "function" ? a.isOn() : false; }};
})();

/* Adaptador: conserva la API de Pitch y permite alternar 2D/3D sin romper el directo. */
(function () {
  if (typeof window === "undefined" || typeof Pitch === "undefined" || typeof Pitch3D === "undefined") return;
  var original = Pitch, originalApi = {}, host = null, mountOpts = null, toggle = null;
  var mounted = false, switching = false, lastTeams = null, lastState = null, lastFrozen = false, introSeen = false;
  ["mount", "teams", "state", "event", "busy", "reset", "freeze", "destroy", "clearMsg", "replay", "active", "sound", "debug", "cinema", "skipCinema"].forEach(function (k) {
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
      /* Si se cambia de vista en plena entrada, hay que continuar la ceremonia
         en el otro modo; no se puede tratar como una entrada ya terminada. */
      var activeCinema = null;
      try { activeCinema = mounted ? Pitch3D.cinema() : (originalApi.cinema ? originalApi.cinema() : null); } catch (ignoreCinema) {}
      var resumeIntro = activeCinema && activeCinema.type === "intro" ? activeCinema : null;
      if (mounted) Pitch3D.destroy(); else if (originalApi.destroy) originalApi.destroy();
      mounted = false;
      /* La entrada no se repite una vez terminada. Si se cambia de vista con
         la ceremonia activa, resumeIntro la continúa en el otro modo. */
      var mo = mountOpts || {};
      if (resumeIntro || introSeen || (lastState && +lastState.min > 0)) {
        mo = {}; for (var mk in mountOpts || {}) if (Object.prototype.hasOwnProperty.call(mountOpts, mk)) mo[mk] = mountOpts[mk];
        if (resumeIntro) { mo.cinematics = true; mo.intro = resumeIntro; }
        else mo.cinematics = false;
      }
      if (want3d) {
        mounted = Pitch3D.mount(host, mo);
        if (!mounted && originalApi.mount) originalApi.mount(host, mo);
      } else if (originalApi.mount) originalApi.mount(host, mo);
      var active = mounted ? Pitch3D : originalApi;
      if (lastTeams) active.teams.apply(active, lastTeams);
      if (lastState) active.state(lastState);
      if (active.freeze) active.freeze(lastFrozen);
      try { window.localStorage.setItem("camino.pitch3d", mounted ? "1" : "0"); } catch (e) {}
      updateToggle();
    } catch (e) {
      if (window.console) console.warn("Pitch3D: cambio de vista fallido", e);
      try { Pitch3D.destroy(); if (originalApi.mount) originalApi.mount(host, mo || {}); } catch (ignore) {}
      mounted = false;
    }
    switching = false;
  }
  Pitch.mount = function (el, o) {
    host = el; mountOpts = o || {}; introSeen = false;
    if (!toggle) {
      toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "p3dtoggle";
      toggle.style.cssText = "position:absolute;z-index:20;top:6px;right:6px;padding:6px 9px;border:1px solid rgba(255,255,255,.4);border-radius:6px;background:rgba(8,20,18,.88);color:#fff;font:600 var(--fs-2xs) var(--f-body);cursor:pointer";
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
  Pitch.event = function (ev) {
    /* pass/tackle son animaciones del 3D; el campo 2D no debe crear un
       ticker vacío ni una jugada fantasma al recibirlos. */
    if (!mounted && ev && (ev.t === "pass" || ev.t === "tackle")) return false;
    var e = mounted ? Pitch3D : originalApi; return e.event.apply(e, arguments);
  };
  Pitch.busy = function () { var e = mounted ? Pitch3D : originalApi; return e.busy.apply(e, arguments); };
  Pitch.cinema = function () {
    var e = mounted ? Pitch3D : originalApi, c = e.cinema ? e.cinema() : null;
    if (c) introSeen = true;
    return c;
  };
  Pitch.skipCinema = function () {
    var e = mounted ? Pitch3D : originalApi, ok = e.skipCinema ? e.skipCinema() : false;
    if (ok) introSeen = true;
    return ok;
  };
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
    mounted = false; host = null; mountOpts = null; toggle = null; lastTeams = null; lastState = null; lastFrozen = false; introSeen = false;
  };
})();
