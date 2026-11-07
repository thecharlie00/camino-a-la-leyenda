/* Modelos de vóxeles para los iconos de Google Play Juegos (se cargan en la página del juego desde pgs-export.cjs).
   Cada logro recibe un objeto que cuenta lo que pide (balón en llamas, guante, reloj de arena, maleta, vinilo,
   micrófono...), con el metal de su rareza y una peana de uno de cuatro estilos. PGSModels.key(cat, rar, id, text)
   registra el modelo en GXV y devuelve su clave. */
var PGSModels = (function () {
  var PAL = GXV.PAL;
  var W = "#f2f4f5", K = "#1c2226", G = "#8b969b", G2 = "#c9d1d4", R = "#d8423a", B = "#2f7fd8", GR = "#3fae5a", Y = "#f4c430", O = "#f08a24",
      BR = "#7a5532", BR2 = "#a8743e", SK = "#e0b48a", PK = "#f29bb3", PU = "#8a5cd8", CY = "#53d0e6";
  function hsh(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function make(rar, ped, build) {
    var V = {}, c = PAL[rar] || PAL.b;
    function put(x, y, z, col) { var k = x + "," + y + "," + z; if (col) V[k] = col; else delete V[k]; }
    function box(x0, x1, y0, y1, z0, z1, col) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) put(x, y, z, col); }
    function disc(y, r, col, hollow) { for (var x = -9; x <= 9; x++) for (var z = -9; z <= 9; z++) { var d = Math.hypot(x, z); if (d <= r + 0.35 && (!hollow || d > r - 0.95)) put(x, y, z, col); } }
    /* disco vertical (plano x-y), grosor t en z */
    function discV(cx, cy, r, col, t, hollow) { t = t || 1; for (var x = -10; x <= 10; x++) for (var y = -10; y <= 10; y++) { var d = Math.hypot(x, y); if (d <= r + 0.35 && (!hollow || d > r - 1.1)) for (var z = 0; z < t; z++) put(cx + x, cy + y, z - (t >> 1), col); } }
    function sphere(cy, r, fn, cx, cz) { cx = cx || 0; cz = cz || 0; for (var x = -9; x <= 9; x++) for (var y = -9; y <= 9; y++) for (var z = -9; z <= 9; z++) if (Math.hypot(x, y, z) <= r + 0.3) put(cx + x, cy + y, cz + z, fn(x, y, z)); }
    /* figura plana a partir de filas de texto (de arriba abajo); cada letra es un color del mapa */
    function sprite(rows, map, x0, ytop, t) { t = t || 1; rows.forEach(function (row, i) { for (var j = 0; j < row.length; j++) { var col = map[row[j]]; if (col) for (var z = 0; z < t; z++) put(x0 + j, ytop - i, z - (t >> 1), col); } }); }
    /* peanas */
    var base = "#20262b", base2 = "#30383e";
    if (ped === 0) { box(-4, 4, 0, 0, -4, 4, base); box(-3, 3, 1, 1, -3, 3, base2); box(-3, 3, 2, 2, -3, 3, c[0]); box(-3, 3, 3, 3, -3, 3, base); }
    else if (ped === 1) { disc(0, 4.6, base); disc(1, 3.8, base2); disc(2, 3.8, c[0]); disc(3, 3.4, base); }
    else if (ped === 2) { box(-4, 4, 0, 0, -4, 4, base); box(-2, 2, 1, 2, -2, 2, base2); box(-3, 3, 3, 3, -3, 3, c[0]); }
    else { box(-5, 5, 0, 0, -3, 3, base); box(-4, 4, 1, 1, -3, 3, c[0]); box(-4, 4, 2, 3, -2, 2, base2); }
    build({put: put, box: box, disc: disc, discV: discV, sphere: sphere, sprite: sprite, c: c, rar: rar});
    return V;
  }

  var M = {
    /* --- copas y premios --- */
    cupTall: function (m) { m.disc(4, 2, m.c[0]); for (var y = 5; y <= 8; y++) m.put(0, y, 0, m.c[1]); [1.6, 2.2, 2.6, 2.9, 3.1, 3.2, 3.2].forEach(function (r, i) { m.disc(9 + i, r, i === 6 ? m.c[2] : m.c[1], i > 0); }); for (var k = 0; k < 4; k++) { m.put(4, 13 - k, 0, m.c[1]); m.put(-4, 13 - k, 0, m.c[1]); } m.put(5, 12, 0, m.c[1]); m.put(-5, 12, 0, m.c[1]); m.put(5, 11, 0, m.c[1]); m.put(-5, 11, 0, m.c[1]); },
    cupBowl: function (m) { m.disc(4, 2.4, m.c[0]); m.put(0, 5, 0, m.c[1]); m.put(0, 6, 0, m.c[1]); [2.5, 4, 5, 5.6, 5.8].forEach(function (r, i) { m.disc(7 + i, r, i === 4 ? m.c[2] : m.c[1], i > 0); }); m.box(-1, 1, 12, 12, -1, 1, m.c[2]); m.put(0, 13, 0, m.c[2]); },
    amphora: function (m) { m.disc(4, 1.8, m.c[0]); [1.2, 2.2, 3.2, 3.8, 3.8, 3.2, 2.2, 1.4, 1.4, 2.4].forEach(function (r, i) { m.disc(5 + i, r, i === 9 ? m.c[2] : m.c[1], i > 0 && i < 9); }); for (var y = 9; y <= 14; y++) { m.put(5, y, 0, m.c[0]); m.put(-5, y, 0, m.c[0]); } m.put(4, 14, 0, m.c[0]); m.put(-4, 14, 0, m.c[0]); },
    plate: function (m) { m.box(-1, 1, 4, 5, -1, 1, m.c[0]); m.discV(0, 11, 6, m.c[1], 1); m.discV(0, 11, 6, m.c[0], 1, true); m.discV(0, 11, 3.6, m.c[2], 1, true); m.discV(0, 11, 1.2, m.c[2], 2); },
    obelisk: function (m) { for (var y = 4; y <= 15; y++) { var w = y < 7 ? 2 : y < 13 ? 1 : 0; m.box(-w, w, y, y, -w, w, y === 15 ? m.c[2] : m.c[1]); } m.put(0, 16, 0, m.c[2]); m.box(-2, 2, 9, 9, 2, 2, m.c[0]); },
    medal: function (m) { m.box(-1, 1, 4, 5, -1, 1, m.c[0]); m.box(-4, -2, 14, 18, 0, 0, R); m.box(2, 4, 14, 18, 0, 0, B); m.box(-2, -1, 12, 13, 0, 0, R); m.box(1, 2, 12, 13, 0, 0, B); m.discV(0, 8, 4.2, m.c[1], 2); m.discV(0, 8, 4.2, m.c[0], 2, true); m.discV(0, 8, 1.6, m.c[2], 3); },
    medalStar: function (m) { m.box(-1, 1, 4, 5, -1, 1, m.c[0]); m.box(-1, 1, 13, 18, 0, 0, GR); m.box(-3, 3, 18, 18, 0, 0, GR); starAt(m, 0, 9, 4.6, m.c[1], m.c[2]); },
    star: function (m) { starAt(m, 0, 11, 6, m.c[1], m.c[2]); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    stars3: function (m) { starAt(m, -4, 8, 3.2, m.c[1], m.c[2]); starAt(m, 4, 8, 3.2, m.c[1], m.c[2]); starAt(m, 0, 14, 3.6, m.c[2], W); m.box(-1, 1, 4, 4, 0, 0, m.c[0]); },
    stars4: function (m) { starAt(m, -4, 8, 2.8, m.c[1], m.c[2]); starAt(m, 4, 8, 2.8, m.c[1], m.c[2]); starAt(m, -4, 14, 2.8, m.c[1], m.c[2]); starAt(m, 4, 14, 2.8, m.c[1], m.c[2]); m.box(-1, 1, 4, 4, 0, 0, m.c[0]); },
    crown: function (m) { m.disc(5, 4.4, m.c[0]); m.disc(6, 4.4, m.c[1], true); m.disc(7, 4.4, m.c[1], true); for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, x = Math.round(Math.cos(a) * 4.4), z = Math.round(Math.sin(a) * 4.4); m.put(x, 8, z, m.c[1]); m.put(x, 9, z, m.c[1]); if (i % 2 === 0) { m.put(x, 10, z, m.c[2]); m.put(x, 11, z, R); } } m.disc(7, 4.4, R, true); m.box(-1, 1, 4, 4, -1, 1, m.c[0]); },
    laurel: function (m) { for (var a = 0; a < 26; a++) { var t = Math.PI * 0.15 + a / 26 * Math.PI * 1.7, x = Math.round(Math.sin(t) * 6), y = Math.round(11 - Math.cos(t) * 6); m.put(x, y, 0, GR); if (a % 2) m.put(x + (x > 0 ? 1 : -1), y, 0, "#2e8a44"); } m.box(-1, 1, 4, 5, 0, 0, m.c[0]); m.discV(0, 11, 2.4, m.c[1], 2); m.discV(0, 11, 1, m.c[2], 3); },
    ring: function (m) { for (var a = 0; a < 30; a++) { var t = a / 30 * Math.PI * 2; m.put(Math.round(Math.sin(t) * 4.5), Math.round(10 + Math.cos(t) * 4.5), 0, m.c[1]); m.put(Math.round(Math.sin(t) * 4.5), Math.round(10 + Math.cos(t) * 4.5), 1, m.c[0]); } m.sphere(15, 1.6, function () { return CY; }); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    diamond: function (m) { for (var y = 0; y <= 9; y++) { var r = y < 6 ? y * 0.9 : (9 - y) * 1.8; m.disc(5 + y, r, y % 3 === 0 ? W : CY, false); } m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    /* --- balón, gol, porterías --- */
    ball: function (m) { m.sphere(9, 4.6, function (x, y, z) { return (Math.round(x / 2.3) + Math.round(y / 2.3) + Math.round(z / 2.3)) % 2 ? K : W; }); m.disc(4, 1.6, m.c[0]); },
    ballMetal: function (m) { m.sphere(9, 4.6, function (x, y, z) { return (Math.round(x / 2.3) + Math.round(y / 2.3) + Math.round(z / 2.3)) % 2 ? m.c[0] : m.c[2]; }); m.disc(4, 1.6, m.c[0]); },
    ballFire: function (m) { m.sphere(8, 3.6, function (x, y, z) { return (Math.round(x / 2) + Math.round(y / 2) + Math.round(z / 2)) % 2 ? K : W; }, 2); [[-2, 9, R], [-3, 10, O], [-4, 11, Y], [-2, 12, O], [-5, 13, Y], [-3, 14, R], [-1, 12, Y], [-4, 8, O], [-6, 10, R], [-6, 12, O]].forEach(function (p) { m.put(p[0], p[1], 0, p[2]); m.put(p[0], p[1], 1, p[2]); m.put(p[0] - 1, p[1] - 1, 0, p[2]); }); m.disc(4, 1.6, m.c[0]); },
    rocketBall: function (m) { m.sphere(13, 2.6, function (x, y, z) { return (x + y + z) % 2 ? K : W; }); for (var y = 5; y <= 10; y++) m.put(0, y, 0, y % 2 ? Y : O); m.box(-1, 1, 5, 6, 0, 0, R); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    goal: function (m) { m.box(-6, -6, 4, 12, 0, 0, W); m.box(6, 6, 4, 12, 0, 0, W); m.box(-6, 6, 12, 12, 0, 0, W); for (var x = -5; x <= 5; x++) for (var y = 4; y <= 11; y++) if ((x + y) % 2 === 0) m.put(x, y, -2, G2); m.box(-6, 6, 12, 12, -2, -1, G2); },
    goalBall: function (m) { M.goal(m); m.sphere(7, 1.6, function (x, y) { return (x + y) % 2 ? K : W; }, 2, -1); },
    post: function (m) { m.box(-1, 0, 4, 15, 0, 0, W); m.box(-1, 6, 15, 15, 0, 0, W); m.sphere(11, 1.6, function (x, y) { return (x + y) % 2 ? K : W; }, 2, 0); m.put(3, 13, 0, Y); m.put(4, 14, 0, Y); m.put(3, 9, 0, Y); },
    target: function (m) { m.box(0, 0, 4, 5, 0, 0, BR); m.discV(0, 11, 6, W, 1); m.discV(0, 11, 5, R, 1); m.discV(0, 11, 3.6, W, 1); m.discV(0, 11, 2.2, R, 1); m.discV(0, 11, 0.8, m.c[2], 2); m.box(1, 6, 13, 13, 1, 1, BR2); m.put(6, 14, 1, R); },
    wall: function (m) { for (var y = 4; y <= 12; y++) for (var x = -6; x <= 6; x++) m.put(x, y, 0, ((y % 2 ? x : x + 1) % 3 === 0) ? "#5a3a2a" : y % 2 ? "#b4503a" : "#c8644a"); m.sphere(14, 1.6, function (x, y) { return (x + y) % 2 ? K : W; }, 3); },
    glove: function (m) { m.box(-2, 2, 4, 6, -1, 1, m.c[0]); m.box(-3, 3, 7, 11, -1, 1, m.c[1]); [-3, -1, 1, 3].forEach(function (x, i) { var t = 14 + (i === 1 || i === 2 ? 1 : 0); m.box(x, x, 12, t, -1, 1, m.c[1]); m.put(x, t + 1, 0, m.c[2]); }); m.box(4, 5, 8, 10, -1, 1, m.c[1]); m.box(-2, 2, 6, 6, -2, 2, W); },
    gloves2: function (m) { [-3, 3].forEach(function (cx) { m.box(cx - 2, cx + 2, 5, 9, -1, 1, m.c[1]); for (var f = -2; f <= 2; f += 2) m.box(cx + f, cx + f, 10, 12, -1, 1, m.c[1]); m.box(cx - 2, cx + 2, 5, 5, -2, 2, W); }); m.box(-1, 1, 4, 4, 0, 0, m.c[0]); },
    shield: function (m) { for (var y = 5; y <= 15; y++) { var w = y >= 9 ? 5 : Math.max(0, y - 4); for (var x = -w; x <= w; x++) { var edge = Math.abs(x) === w || y === 15; m.put(x, y, 0, edge ? m.c[0] : x >= 0 && y < 13 ? m.c[1] : m.c[2]); m.put(x, y, 1, m.c[0]); } } m.box(-1, 1, 4, 4, -1, 1, m.c[0]); },
    shieldBall: function (m) { M.shield(m); m.sphere(11, 1.8, function (x, y) { return (x + y) % 2 ? K : W; }, 0, -2); },
    /* --- jugador y equipamiento --- */
    boot: function (m) { m.box(-1, 1, 4, 4, -2, 2, m.c[0]); m.box(-4, 4, 5, 6, -1, 1, m.c[1]); m.box(-4, -1, 7, 12, -1, 1, m.c[1]); m.box(0, 4, 7, 7, -1, 1, m.c[1]); m.box(4, 5, 5, 6, -1, 1, m.c[2]); m.box(-4, -1, 13, 13, -1, 1, m.c[2]); m.box(-1, 3, 8, 8, 0, 0, W); },
    bootWing: function (m) { M.boot(m); [[-5, 10], [-6, 11], [-7, 12], [-6, 13], [-7, 14], [-8, 13]].forEach(function (p) { m.put(p[0], p[1], 0, W); m.put(p[0], p[1], 1, G2); }); },
    shirt: function (m) { m.sprite(["XXX.....XXX", "XXXX...XXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "...XXXXX...", "...XNNNX...", "...XXNXX...", "...XNXXX...", "...XNNNX...", "...XXXXX..."], {X: m.c[1], N: W}, -5, 15, 2); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    armband: function (m) { m.disc(8, 4, Y, true); m.disc(9, 4, Y, true); m.disc(10, 4, Y, true); m.disc(11, 4, Y, true); m.sprite(["KKK", "K..", "K..", "KKK"], {K: K}, -1, 11, 1); m.box(-1, 1, 4, 7, 0, 0, m.c[0]); },
    cap: function (m) { m.sphere(8, 3.6, function (x, y) { return y > 1 ? m.c[1] : m.c[0]; }); m.box(-2, 2, 6, 6, 3, 6, m.c[0]); m.disc(5, 1.4, m.c[0]); },
    dumbbell: function (m) { m.box(-5, 5, 9, 9, 0, 0, G); [-5, 5].forEach(function (x) { m.box(x - 1, x + 1, 6, 12, -2, 2, m.c[1]); m.box(x, x, 7, 11, 3, 3, m.c[2]); }); m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    stopwatch: function (m) { m.discV(0, 10, 5, m.c[1], 2); m.discV(0, 10, 4, W, 3); m.box(0, 0, 10, 13, 2, 2, K); m.box(0, 3, 10, 10, 2, 2, R); m.box(-1, 1, 16, 16, 0, 0, m.c[0]); m.put(0, 15, 0, m.c[0]); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    hourglass: function (m) { m.box(-4, 4, 4, 4, -3, 3, m.c[1]); m.box(-4, 4, 16, 16, -3, 3, m.c[1]); for (var y = 5; y <= 15; y++) { var r = Math.abs(y - 10) * 0.6 + 0.6; m.disc(y, r, y < 10 ? Y : y === 10 ? Y : CY, y > 10); } [-4, 4].forEach(function (x) { m.box(x, x, 5, 15, -3, -3, BR); m.box(x, x, 5, 15, 3, 3, BR); }); },
    clock: function (m) { m.box(-4, 4, 4, 16, -2, 2, BR); m.discV(0, 12, 3.4, W, 6); m.box(0, 0, 12, 14, 3, 3, K); m.box(0, 2, 12, 12, 3, 3, K); m.box(0, 0, 6, 9, 3, 3, m.c[1]); m.discV(0, 6, 1.2, m.c[1], 7); },
    calendar: function (m) { m.box(-5, 5, 4, 14, 0, 1, W); m.box(-5, 5, 13, 15, 0, 1, R); m.put(-3, 16, 0, G); m.put(3, 16, 0, G); for (var x = -4; x <= 4; x += 2) for (var y = 5; y <= 11; y += 2) m.put(x, y, 2, (x + y) % 4 ? G : m.c[1]); },
    /* --- viajes y clubes --- */
    suitcase: function (m) { m.box(-5, 5, 4, 11, -2, 2, m.c[1]); m.box(-5, 5, 7, 7, -2, 2, m.c[0]); m.box(-2, 2, 13, 13, 0, 0, m.c[0]); m.put(-2, 12, 0, m.c[0]); m.put(2, 12, 0, m.c[0]); m.box(-4, -3, 9, 10, 3, 3, R); m.box(2, 3, 5, 6, 3, 3, B); m.box(-1, 1, 9, 9, 3, 3, m.c[2]); },
    plane: function (m) { m.box(-6, 6, 11, 12, -1, 1, W); m.box(-1, 2, 11, 11, -7, 7, m.c[1]); m.box(-6, -5, 13, 15, 0, 0, m.c[1]); m.box(-6, -5, 12, 12, -3, 3, m.c[1]); m.put(7, 11, 0, G); for (var x = -4; x <= 4; x += 2) m.put(x, 12, 2, CY); m.box(0, 0, 4, 10, 0, 0, G); },
    globe: function (m) { m.sphere(10, 4.4, function (x, y, z) { return ((x * 3 + z * 5 + y * 7) & 7) < 3 ? GR : B; }); for (var a = 0; a < 24; a++) { var t = a / 24 * Math.PI * 2, x = Math.round(Math.sin(t) * 5.6), y = Math.round(10 + Math.cos(t) * 5.6); if (y > 4) m.put(x, y, 0, m.c[1]); } m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    flag: function (m) { m.box(-5, -5, 4, 17, 0, 0, G); m.put(-5, 18, 0, m.c[2]); for (var x = -4; x <= 4; x++) for (var y = 11; y <= 17; y++) m.put(x, y, 0, y >= 16 ? m.c[2] : y >= 13 ? W : m.c[1]); m.put(-1, 14, 1, m.c[2]); m.put(0, 14, 1, m.c[2]); m.put(1, 14, 1, m.c[2]); },
    flags2: function (m) { m.box(-5, -5, 4, 16, 0, 0, G); m.box(5, 5, 4, 16, 0, 0, G); for (var y = 12; y <= 16; y++) { m.box(-4, -1, y, y, 0, 0, y % 2 ? B : W); m.box(1, 4, y, y, 0, 0, y > 14 ? GR : Y); } },
    house: function (m) { m.box(-4, 4, 4, 9, -3, 3, W); for (var y = 10; y <= 14; y++) { var w = 14 - y; m.box(-w - 1, w + 1, y, y, -3, 3, R); } m.box(-1, 1, 4, 7, 4, 4, BR); m.box(2, 3, 7, 8, 4, 4, CY); m.box(-3, -2, 7, 8, 4, 4, CY); },
    stadium: function (m) { m.disc(4, 7, GR); for (var y = 5; y <= 9; y++) m.disc(y, 7.6 - (y - 5) * 0.1, y % 2 ? m.c[1] : G2, true); m.box(-7, -7, 10, 14, 0, 0, G); m.box(7, 7, 10, 14, 0, 0, G); m.box(-8, -6, 15, 15, -1, 1, Y); m.box(6, 8, 15, 15, -1, 1, Y); m.box(-1, 1, 5, 5, -2, 2, W); },
    bus: function (m) { m.box(-6, 6, 6, 11, -2, 2, m.c[1]); for (var x = -5; x <= 5; x += 2) m.box(x, x, 9, 10, 3, 3, CY); m.box(-6, 6, 7, 7, 3, 3, W); [-4, 4].forEach(function (x) { m.box(x - 1, x + 1, 4, 5, 2, 3, K); m.box(x - 1, x + 1, 4, 5, -3, -2, K); }); },
    contract: function (m) { m.box(-4, 4, 5, 15, 0, 0, W); [13, 11, 9].forEach(function (y) { m.box(-3, 3, y, y, 1, 1, G); }); m.box(-3, 0, 7, 7, 1, 1, B); for (var k = 0; k < 7; k++) m.put(1 + k, 6 + k, 2, k < 1 ? K : k < 6 ? m.c[1] : m.c[2]); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    ladder: function (m) { m.box(-4, -4, 4, 17, 0, 0, BR2); m.box(4, 4, 4, 17, 0, 0, BR2); for (var y = 6; y <= 16; y += 3) m.box(-3, 3, y, y, 0, 0, BR); m.put(5, 17, 0, GR); m.put(6, 16, 0, GR); m.put(5, 16, 0, GR); },
    arrowUp: function (m) { for (var y = 4; y <= 12; y++) m.box(-1, 1, y, y, -1, 1, m.c[1]); for (var k = 0; k <= 4; k++) m.box(-4 + k, 4 - k, 13 + k, 13 + k, -1, 1, m.c[2]); },
    rocket: function (m) { for (var y = 7; y <= 15; y++) m.disc(y, y > 13 ? 16 - y : 2, y > 13 ? R : W); m.disc(17, 0, R); m.box(-3, -3, 7, 9, 0, 0, R); m.box(3, 3, 7, 9, 0, 0, R); m.box(0, 0, 7, 9, -3, -3, R); m.box(0, 0, 7, 9, 3, 3, R); m.discV(0, 12, 1, CY, 6); m.put(0, 6, 0, Y); m.put(0, 5, 0, O); m.put(0, 4, 0, R); },
    bolt: function (m) { m.sprite(["....XXX", "...XXX.", "..XXX..", ".XXXXXX", "XXXXXX.", "...XX..", "..XX...", ".XX....", "XX.....", "X......"], {X: Y}, -3, 15, 2); m.box(-3, 3, 4, 5, 0, 0, m.c[0]); },
    fire: function (m) { m.sprite(["...R...", "..RR...", "..RRR.R", ".RROR.R", ".ROORRR", "RROYORR", "ROYYYOR", "ROYYYOR", ".ROYYOR", "..RRRR."], {R: R, O: O, Y: Y}, -3, 15, 3); m.box(-3, 3, 4, 5, -1, 1, m.c[0]); },
    sun: function (m) { m.discV(0, 11, 3.2, Y, 2); for (var a = 0; a < 8; a++) { var t = a / 8 * Math.PI * 2; for (var r = 4.6; r <= 6; r++) m.put(Math.round(Math.sin(t) * r), Math.round(11 + Math.cos(t) * r), 0, O); } m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    rain: function (m) { m.sphere(13, 2.6, function () { return G2; }, -2); m.sphere(13, 3, function () { return "#aeb8bc"; }, 2); m.sphere(14, 2.2, function () { return W; }, 0, 1); [[-3, 8], [0, 6], [3, 9], [-1, 9], [2, 6]].forEach(function (p) { m.put(p[0], p[1], 0, B); m.put(p[0], p[1] - 1, 0, CY); }); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    ghost: function (m) { m.sprite([".WWWWW.", "WWWWWWW", "WKWWWKW", "WKWWWKW", "WWWWWWW", "WWWKWWW", "WWWWWWW", "WWWWWWW", "W.W.W.W"], {W: W, K: K}, -3, 15, 3); m.box(-2, 2, 4, 6, -1, 1, m.c[0]); },
    heart: function (m) { m.sprite([".RR.RR.", "RRRRRRR", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], {R: R}, -3, 15, 3); m.put(-2, 14, 2, PK); m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    handshake: function (m) { m.box(-6, -1, 9, 11, -1, 1, SK); m.box(1, 6, 9, 11, -1, 1, "#c08a5e"); m.box(-2, 2, 10, 12, -1, 1, SK); m.box(-7, -6, 8, 12, -1, 1, B); m.box(6, 7, 8, 12, -1, 1, R); m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    bandage: function (m) { m.box(-5, 5, 9, 13, 0, 0, W); m.box(-1, 1, 7, 15, 0, 0, W); m.box(-3, 3, 10, 12, 1, 1, R); m.box(-1, 1, 8, 14, 1, 1, R); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    crutch: function (m) { m.box(0, 0, 4, 15, 0, 0, G); m.box(-3, 3, 16, 16, 0, 0, K); m.box(-3, -3, 12, 16, 0, 0, G); m.box(3, 3, 12, 16, 0, 0, G); m.box(-2, 2, 11, 11, 0, 0, K); m.box(3, 6, 6, 9, -1, 1, W); m.box(4, 5, 7, 8, 2, 2, R); },
    /* --- dinero y tienda --- */
    moneyBag: function (m) { m.sphere(9, 4.4, function () { return "#c9a26a"; }); m.disc(14, 1.6, "#c9a26a"); m.disc(15, 2.4, "#b08850"); m.sprite([".X.", "XXX", "X..", "XXX", "..X", "XXX", ".X."], {X: GR}, -1, 12, 1); for (var y = 6; y <= 12; y++) m.put(0, y, 5, null); m.box(-1, 1, 6, 12, 5, 5, null); },
    coins: function (m) { [[0, 4, 6], [-3, 4, 4], [3, 4, 3]].forEach(function (p) { for (var y = p[1]; y < p[1] + p[2]; y++) m.disc(y, 2, y % 2 ? Y : m.c[1]); }); for (var y = 4; y < 10; y++) m.disc(y, 2, y % 2 ? Y : m.c[2]); m.discV(4, 13, 2.4, Y, 1); },
    gem: function (m) { for (var y = 0; y <= 8; y++) { var r = y < 5 ? y * 1.1 : (8 - y) * 1.6; m.disc(6 + y, r, y % 2 ? PU : PK); } m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    bag: function (m) { m.box(-4, 4, 4, 12, -2, 2, m.c[1]); m.box(-4, 4, 12, 12, -2, 2, m.c[0]); [-2, 2].forEach(function (x) { m.put(x, 13, 0, K); m.put(x, 14, 0, K); }); m.box(-2, 2, 15, 15, 0, 0, K); m.box(-2, 2, 7, 9, 3, 3, W); },
    tag: function (m) { for (var y = 5; y <= 15; y++) { var w = y > 12 ? 15 - y + 1 : 4; m.box(-w, w, y, y, 0, 0, Y); } m.put(0, 13, 1, K); m.box(-2, 2, 8, 8, 1, 1, R); m.box(-1, 1, 10, 10, 1, 1, R); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    gift: function (m) { m.box(-4, 4, 4, 11, -4, 4, R); m.box(-1, 1, 4, 12, -5, 5, Y); m.box(-5, 5, 4, 12, -1, 1, Y); m.put(-2, 13, 0, Y); m.put(2, 13, 0, Y); m.put(-3, 14, 0, Y); m.put(3, 14, 0, Y); },
    /* --- medios y afición --- */
    mic: function (m) { m.box(0, 0, 4, 9, 0, 0, G); m.box(-1, 1, 4, 4, -1, 1, K); m.sphere(13, 2.6, function (x, y) { return (y + x) % 2 ? m.c[1] : m.c[2]; }); m.disc(10, 1.6, m.c[0]); },
    megaphone: function (m) { for (var x = -4; x <= 5; x++) { var r = 1 + (x + 4) * 0.45; for (var y = -6; y <= 6; y++) for (var z = -6; z <= 6; z++) if (Math.hypot(y, z) <= r && Math.hypot(y, z) > r - 1.1) m.put(x, 11 + y, z, x === 5 ? m.c[2] : R); } m.box(-6, -5, 10, 12, -1, 1, W); m.box(-4, -4, 6, 9, 0, 0, K); },
    tv: function (m) { m.box(-6, 6, 6, 15, -3, 2, "#5a4a3a"); m.box(-5, 3, 7, 14, 3, 3, "#6fa0a8"); m.box(-4, 2, 8, 13, 3, 3, "#9fd0d4"); m.put(5, 12, 3, Y); m.put(5, 10, 3, G); m.put(-2, 16, 0, K); m.put(-3, 17, 0, K); m.put(2, 16, 0, K); m.put(3, 17, 0, K); m.box(-4, -4, 4, 5, 0, 0, K); m.box(4, 4, 4, 5, 0, 0, K); },
    newspaper: function (m) { m.box(-5, 5, 4, 15, 0, 0, W); m.box(-4, 4, 13, 14, 1, 1, K); m.box(-4, -1, 6, 11, 1, 1, G); [11, 9, 7].forEach(function (y) { m.box(1, 4, y, y, 1, 1, G2); }); m.box(-5, 5, 4, 15, -1, -1, G2); },
    phone: function (m) { m.box(-3, 3, 4, 16, -1, 0, K); m.box(-2, 2, 6, 14, 1, 1, CY); m.box(-1, 1, 12, 13, 2, 2, R); m.box(-1, 1, 9, 10, 2, 2, PK); m.put(0, 15, 1, G); m.put(-1, 7, 2, W); m.put(1, 7, 2, W); },
    camera: function (m) { m.box(-5, 5, 6, 12, -2, 2, K); m.box(-2, 1, 13, 13, -1, 1, K); m.discV(0, 9, 2.6, G, 7); m.discV(0, 9, 1.4, CY, 8); m.put(4, 11, 3, R); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    whistle: function (m) { m.box(-3, 3, 7, 10, -2, 2, m.c[1]); m.box(4, 7, 9, 10, -1, 1, m.c[1]); m.disc(11, 1.5, m.c[0]); m.box(-1, 1, 11, 13, 0, 0, R); m.box(-2, 2, 14, 14, 0, 0, R); m.box(0, 0, 4, 6, 0, 0, m.c[0]); m.box(-2, -1, 8, 9, 3, 3, K); },
    redCard: function (m) { m.box(-6, -1, 7, 15, 0, 0, Y); m.box(1, 6, 6, 14, 1, 1, R); m.box(-1, 1, 4, 5, 0, 0, m.c[0]); },
    /* --- banquillo y táctica --- */
    clipboard: function (m) { m.box(-4, 4, 4, 15, 0, 0, BR); m.box(-3, 3, 5, 13, 1, 1, W); m.box(-2, 2, 14, 16, 1, 1, m.c[1]); [7, 9, 11].forEach(function (y) { m.box(-2, 2, y, y, 2, 2, G); }); m.put(1, 8, 2, R); m.put(-1, 10, 2, R); },
    tactics: function (m) { m.box(-6, 6, 5, 15, 0, 0, "#2e7d4a"); m.box(-6, 6, 5, 5, 1, 1, W); m.box(-6, 6, 15, 15, 1, 1, W); m.box(0, 0, 5, 15, 1, 1, W); [[-4, 8], [-4, 12], [-2, 10]].forEach(function (p) { m.put(p[0], p[1], 2, R); }); [[3, 7], [5, 9], [3, 13]].forEach(function (p) { m.put(p[0] - 1, p[1] - 1, 2, W); m.put(p[0] + 1, p[1] + 1, 2, W); m.put(p[0] - 1, p[1] + 1, 2, W); m.put(p[0] + 1, p[1] - 1, 2, W); }); for (var k = 0; k < 4; k++) m.put(-1 + k, 9 + k, 2, Y); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    chess: function (m) { m.disc(4, 2.6, m.c[1]); m.disc(5, 2, m.c[1]); m.disc(6, 1.4, m.c[1]); for (var y = 7; y <= 10; y++) m.disc(y, 1, m.c[1]); m.disc(11, 1.8, m.c[1]); m.sphere(14, 2, function () { return m.c[2]; }); },
    sprout: function (m) { m.box(-3, 3, 4, 7, -3, 3, "#b4503a"); m.box(-3, 3, 7, 7, -3, 3, BR); for (var y = 8; y <= 14; y++) m.put(0, y, 0, GR); [[-1, 11], [-2, 12], [-3, 12], [-2, 13], [1, 13], [2, 14], [3, 14], [2, 15]].forEach(function (p) { m.put(p[0], p[1], 0, GR); m.put(p[0], p[1], 1, "#2e8a44"); }); },
    brain: function (m) { m.sphere(11, 4, function (x, y, z) { return (x + y * 2 + z) % 3 ? PK : "#d77a98"; }); m.box(0, 0, 4, 7, 0, 0, m.c[0]); for (var k = 0; k < 4; k++) { m.put(-2 + k, 16 + (k % 2), 0, O); m.put(2 - k, 16 + (k % 2), 1, Y); } },
    swords: function (m) { for (var k = 0; k <= 11; k++) { m.put(-6 + k, 4 + k, 0, k > 2 ? G2 : BR); m.put(6 - k, 4 + k, 1, k > 2 ? G2 : BR); } m.box(-5, -3, 7, 7, 0, 0, m.c[1]); m.box(3, 5, 7, 7, 1, 1, m.c[1]); },
    helmet: function (m) { m.sphere(10, 4.4, function (x, y, z) { return m.c[1]; }); m.box(-1, 1, 7, 10, 4, 5, null); m.box(-3, -1, 8, 10, 4, 5, K); m.box(1, 3, 8, 10, 4, 5, K); for (var x = -5; x <= 5; x++) m.put(0, 15 + Math.round(Math.cos(x / 5 * 1.5)), x, R); m.disc(5, 2, m.c[0]); },
    mask: function (m) { m.sprite(["WWWWWWW", "WKWWWKW", "WKWWWKW", "WWWWWWW", "WKWWWKW", "WWKKKWW", ".WWWWW."], {W: W, K: K}, -7, 15, 2); m.sprite(["YYYYYYY", "YKYYYKY", "YKYYYKY", "YYYYYYY", "YYKKKYY", "YKYYYKY", ".YYYYY."], {Y: Y, K: K}, 1, 13, 2); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    ballot: function (m) { m.box(-4, 4, 4, 10, -3, 3, m.c[1]); m.box(-4, 4, 11, 11, -3, 3, m.c[0]); m.box(-2, 2, 11, 11, 0, 0, K); m.box(-1, 1, 12, 15, 0, 0, W); m.put(0, 14, 1, R); m.box(-3, 3, 7, 7, 4, 4, m.c[2]); },
    scale: function (m) { m.box(0, 0, 4, 15, 0, 0, m.c[1]); m.box(-6, 6, 15, 15, 0, 0, m.c[1]); [-5, 5].forEach(function (x) { m.put(x, 14, 0, G); m.put(x, 13, 0, G); m.disc(12, 2, null); m.box(x - 2, x + 2, 11, 11, -2, 2, m.c[2]); }); m.put(0, 16, 0, m.c[2]); },
    book: function (m) { [[4, B], [6, R], [8, GR]].forEach(function (p, i) { m.box(-5 + i, 4 + i, p[0], p[0] + 1, -3, 3, p[1]); m.box(-4 + i, 3 + i, p[0], p[0] + 1, 4, 4, W); }); m.box(-2, 6, 10, 15, -1, 1, m.c[1]); m.box(-1, 5, 11, 14, 2, 2, W); },
    scroll: function (m) { m.box(-4, 4, 6, 14, 0, 0, "#efe2bc"); m.box(-5, 5, 14, 15, -1, 1, BR2); m.box(-5, 5, 5, 6, -1, 1, BR2); [12, 10, 8].forEach(function (y) { m.box(-3, 3, y, y, 1, 1, "#9a8a6a"); }); m.put(2, 7, 1, R); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    vinyl: function (m) { m.discV(0, 11, 6, K, 1); for (var r = 2.5; r < 6; r += 1.5) m.discV(0, 11, r, "#2c343a", 1, true); m.discV(0, 11, 1.8, R, 2); m.box(-1, 1, 4, 5, 0, 0, m.c[0]); },
    cassette: function (m) { m.box(-6, 6, 7, 14, 0, 1, K); m.box(-5, 5, 11, 13, 2, 2, O); m.discV(-3, 10, 1.2, W, 6); m.discV(3, 10, 1.2, W, 6); m.box(-2, 2, 8, 8, 2, 2, G); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    gamepad: function (m) { m.box(-6, 6, 7, 10, -1, 1, m.c[1]); m.box(-7, -4, 5, 8, -1, 1, m.c[1]); m.box(4, 7, 5, 8, -1, 1, m.c[1]); m.box(-5, -3, 9, 9, 2, 2, K); m.box(-4, -4, 8, 10, 2, 2, K); m.put(3, 10, 2, R); m.put(5, 9, 2, B); m.put(4, 8, 2, GR); m.put(4, 10, 2, Y); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    puzzle: function (m) { m.sprite(["...XX...", "..XXXX..", "XXXXXXXX", "XXXXXXXXX", "XXXXXXXXXX", "XXXXXXXXX", "XXXXXXXX", "...XX...", "..XXXX..", "XXXXXXXX"], {X: GR}, -4, 15, 2); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    gear: function (m) { m.discV(0, 11, 4.2, G, 2); for (var a = 0; a < 8; a++) { var t = a / 8 * Math.PI * 2; m.box(Math.round(Math.sin(t) * 5.4), Math.round(Math.sin(t) * 5.4), Math.round(11 + Math.cos(t) * 5.4), Math.round(11 + Math.cos(t) * 5.4), -1, 1, G); } m.discV(0, 11, 1.6, K, 3); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    key: function (m) { m.discV(-3, 13, 2.6, m.c[1], 2); m.discV(-3, 13, 1, K, 3); m.box(-1, 6, 13, 13, 0, 0, m.c[1]); m.box(4, 4, 11, 12, 0, 0, m.c[1]); m.box(6, 6, 11, 12, 0, 0, m.c[1]); m.box(0, 0, 4, 12, 0, 0, m.c[0]); },
    fish: function (m) { m.sprite(["....OOO..O", "..OOOOOOOO", ".OWOOOOOO.", "OOOOOOOOO.", ".OOOOOOOOO", "..OOOOO..O"], {O: O, W: K}, -5, 13, 3); m.box(0, 0, 4, 7, 0, 0, m.c[0]); m.disc(4, 3, CY); },
    /* --- mascotas --- */
    paw: function (m) { m.discV(0, 8, 3, m.c[1], 2); [[-5, 13], [-2, 16], [2, 16], [5, 13]].forEach(function (p) { m.discV(p[0], p[1], 1.4, m.c[2], 2); }); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    bone: function (m) { m.box(-5, 5, 10, 11, -1, 1, W); [-6, 6].forEach(function (x) { m.sphere(12, 1.3, function () { return W; }, x); m.sphere(9, 1.3, function () { return W; }, x); }); m.box(0, 0, 4, 9, 0, 0, m.c[0]); },
    dogHouse: function (m) { m.box(-4, 4, 4, 10, -3, 3, BR2); for (var y = 11; y <= 14; y++) { var w = 14 - y; m.box(-w - 1, w + 1, y, y, -4, 4, R); } m.box(-2, 2, 4, 8, 4, 4, K); m.box(-1, 1, 11, 11, 4, 4, Y); },
    dog: function (m) { m.box(-4, 3, 7, 10, -2, 2, BR2); m.box(2, 6, 10, 14, -2, 2, BR2); m.box(6, 7, 10, 11, -1, 1, K); m.box(2, 3, 14, 16, -2, -1, BR); m.box(2, 3, 14, 16, 1, 2, BR); m.put(5, 13, 3, K); m.box(-6, -5, 10, 12, 0, 0, BR2); [[-3, -1], [-3, 1], [2, -1], [2, 1]].forEach(function (p) { m.box(p[0], p[0], 4, 6, p[1], p[1], BR); }); m.box(2, 6, 9, 9, -2, 2, R); },
    crownSmall: function (m) { M.crown(m); }
  };
  function starAt(m, cx, cy, size, col, mid) {
    var s = Math.ceil(size);
    for (var x = -s; x <= s; x++) for (var y = -s; y <= s; y++) {
      var a = Math.atan2(y, x), r = Math.hypot(x, y), k = Math.cos(5 * (a - Math.PI / 2)), lim = size * 0.5 + size * 0.55 * Math.max(0, k);
      if (r <= lim) { m.put(cx + x, cy + y, 0, r < size * 0.4 ? mid : col); m.put(cx + x, cy + y, 1, col); }
    }
  }
  /* ---------- guiños a la cultura popular: objetos genéricos que evocan la referencia (sin personajes ni logos) ---------- */
  var P = {
    staff: function (m) { m.box(0, 0, 4, 16, 0, 0, BR2); m.sphere(17, 1.6, function () { return W; }); for (var k = 0; k < 6; k++) { m.put(-3 + k % 3, 18 + (k >> 1), 1, CY); m.put(2 - k % 3, 16 + (k >> 1), -1, W); } m.box(-6, 6, 4, 4, -1, 1, "#5a3a2a"); },
    aura: function (m) { m.sphere(11, 2.6, function (x, y) { return (x + y) % 2 ? K : W; }); for (var a = 0; a < 20; a++) { var t = a / 20 * Math.PI * 2; m.put(Math.round(Math.sin(t) * 5), Math.round(11 + Math.cos(t) * 5), 0, a % 2 ? CY : B); } m.box(0, 0, 4, 7, 0, 0, m.c[0]); for (var y = 5; y <= 7; y++) m.put(0, y, 1, CY); },
    arrowKnee: function (m) { m.box(-3, 3, 4, 13, -1, 1, "#3a5a8a"); m.box(-3, 3, 8, 10, -2, 2, m.c[1]); for (var k = 0; k <= 8; k++) m.put(-6 + k, 16 - k, 0, BR2); m.put(-7, 17, 0, W); m.put(-6, 17, 0, W); m.put(-7, 16, 0, W); m.put(2, 8, 0, G); },
    sunArms: function (m) { m.discV(0, 13, 3.4, Y, 2); for (var a = 0; a < 12; a++) { var t = a / 12 * Math.PI * 2; m.put(Math.round(Math.sin(t) * 5.4), Math.round(13 + Math.cos(t) * 5.4), 0, O); } m.box(-1, 1, 4, 8, 0, 0, m.c[1]); m.box(-4, -2, 8, 9, 0, 0, m.c[1]); m.box(2, 4, 8, 9, 0, 0, m.c[1]); m.put(-4, 10, 0, m.c[1]); m.put(4, 10, 0, m.c[1]); },
    shout: function (m) { m.discV(-4, 11, 1.6, m.c[1], 2); for (var r = 3; r <= 7; r += 2) for (var a = -6; a <= 6; a++) { var t = a / 6 * 0.9; m.put(Math.round(-4 + Math.cos(t) * r), Math.round(11 + Math.sin(t) * r), 0, r === 3 ? W : r === 5 ? CY : B); } m.box(-4, -4, 4, 9, 0, 0, m.c[0]); },
    pickaxe: function (m) { for (var k = 0; k <= 10; k++) m.put(-4 + k, 4 + k, 0, BR2); for (var k = -4; k <= 4; k++) m.put(1 + k, 11 - Math.abs(k) * 0.5 + 3 | 0, 0, CY); m.box(-6, -4, 4, 6, -1, 1, CY); m.put(-5, 7, 0, W); },
    silverSword: function (m) { m.box(0, 0, 8, 17, 0, 0, G2); m.put(0, 18, 0, W); m.box(-3, 3, 7, 7, -1, 1, m.c[1]); m.box(0, 0, 4, 6, 0, 0, BR); m.put(0, 3, 0, m.c[2]); m.box(-4, -4, 12, 16, 0, 0, G2); m.put(-4, 17, 0, W); m.box(-5, -3, 11, 11, 0, 0, m.c[1]); },
    door: function (m) { m.box(-4, 4, 4, 16, 0, 0, "#6a4a32"); m.box(-5, 5, 17, 17, -1, 1, BR); m.box(-5, -5, 4, 16, -1, 1, BR); m.box(5, 5, 4, 16, -1, 1, BR); [[-2, 13], [2, 13], [-2, 8], [2, 8]].forEach(function (p) { m.box(p[0] - 1, p[0] + 1, p[1] - 1, p[1] + 2, 1, 1, "#7a5a40"); }); m.put(3, 10, 1, Y); m.box(6, 7, 12, 13, 1, 2, SK); },
    cardboard: function (m) { m.box(-5, 5, 4, 12, -4, 4, "#c09a62"); m.box(-5, 5, 12, 12, -4, 4, "#a8844e"); m.box(-1, 1, 9, 10, 5, 5, K); m.box(-5, 5, 8, 8, -4, 4, "#b08a52"); },
    pills: function (m) { m.box(-5, -2, 9, 10, -1, 1, R); m.box(-6, -6, 9, 10, 0, 0, R); m.box(-1, -1, 9, 10, 0, 0, W); m.box(2, 5, 9, 10, -1, 1, B); m.box(6, 6, 9, 10, 0, 0, B); m.box(1, 1, 9, 10, 0, 0, W); m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    redPill: function (m) { m.box(-3, 0, 9, 12, -2, 2, R); m.box(1, 4, 9, 12, -2, 2, W); m.put(-4, 10, 0, R); m.put(-4, 11, 0, R); m.put(5, 10, 0, W); m.put(5, 11, 0, W); m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    boxing: function (m) { [-3, 3].forEach(function (cx) { m.sphere(11, 2.8, function () { return R; }, cx); m.box(cx - 2, cx + 2, 6, 8, -2, 2, W); }); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    mugFire: function (m) { m.box(-3, 3, 4, 10, -3, 3, W); m.box(-2, 2, 10, 10, -2, 2, BR); m.box(4, 5, 6, 9, 0, 0, W); [[-5, 6, R], [-6, 8, O], [-5, 10, Y], [6, 11, R], [5, 13, O], [-4, 12, O], [0, 13, Y], [1, 12, O]].forEach(function (p) { m.box(p[0], p[0], p[1], p[1] + 1, 0, 1, p[2]); }); },
    stocks: function (m) { m.box(-6, 6, 4, 15, 0, 0, K); var ys = [6, 7, 7, 9, 8, 10, 12, 11, 13, 14]; ys.forEach(function (y, i) { m.put(-5 + i, y, 1, GR); m.put(-5 + i, y - 1, 1, "#2e8a44"); }); m.put(5, 14, 1, GR); m.put(4, 14, 1, GR); m.put(5, 13, 1, GR); m.box(-6, 6, 4, 4, 1, 1, m.c[1]); },
    scrollSword: function (m) { M.scroll(m); for (var k = 0; k <= 12; k++) m.put(-6 + k, 4 + k, 2, k > 2 ? G2 : BR); m.box(-5, -3, 7, 7, 2, 2, m.c[1]); },
    brainFire: function (m) { M.brain(m); [[-3, 15, R], [0, 16, O], [3, 15, R], [-1, 17, Y], [1, 17, O], [2, 18, Y], [-2, 18, R]].forEach(function (p) { m.put(p[0], p[1], 0, p[2]); m.put(p[0], p[1], 1, p[2]); }); },
    hatch: function (m) { m.box(-6, 6, 4, 14, 0, 0, "#3a4a4a"); m.box(-5, 5, 5, 13, 1, 1, "#20302e"); for (var i = 0; i < 6; i++) { m.box(-5 + i * 2, -4 + i * 2, 11, 12, 2, 2, GR); } m.box(-4, 4, 7, 8, 2, 2, Y); m.put(4, 6, 2, R); },
    fishBowl: function (m) { m.sphere(10, 4.4, function (x, y, z) { return y > 2 ? null : "#9fd8e8"; }); m.sprite(["..OO.O", ".OOOOO", "OKOOOO", ".OOOOO", "..OO.O"], {O: O, K: K}, -3, 11, 1); m.disc(5, 2.6, "#5a8a9a"); },
    sign: function (m) { m.box(-6, 6, 9, 16, 0, 0, Y); m.box(-6, 6, 9, 9, 1, 1, K); m.box(-6, 6, 16, 16, 1, 1, K); m.box(-5, 5, 12, 13, 1, 1, B); m.box(0, 0, 4, 8, 0, 0, BR); },
    moneyPress: function (m) { m.box(-5, 5, 4, 9, -3, 3, G); m.box(-4, 4, 10, 11, -2, 2, "#5a6a6e"); for (var y = 12; y <= 16; y += 2) m.box(-3, 3, y, y, -2, 2, "#7cbf6a"); m.box(-6, 6, 7, 7, 4, 4, R); m.discV(-3, 7, 1.2, K, 9); },
    profGlasses: function (m) { m.box(-6, 6, 7, 15, 0, 0, "#2e5a3a"); m.box(-6, 6, 6, 6, -1, 1, BR); m.box(-4, -1, 10, 12, 1, 1, W); m.box(1, 4, 10, 12, 1, 1, W); m.box(-3, -2, 11, 11, 1, 1, "#2e5a3a"); m.box(2, 3, 11, 11, 1, 1, "#2e5a3a"); m.put(0, 11, 1, W); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    orangeShirt: function (m) { m.sprite(["XXX.....XXX", "XXXX...XXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "...XXXXX...", "...XXXXX...", "...XXXXX...", "...XXXXX...", "...XXXXX..."], {X: O}, -5, 15, 2); m.box(-1, 1, 12, 12, 2, 2, W); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    katana: function (m) { for (var k = 0; k <= 13; k++) m.put(-6 + k, 4 + k, 0, k < 3 ? K : k < 4 ? m.c[1] : W); m.box(-4, -2, 7, 7, 0, 0, m.c[1]); m.box(-4, 4, 4, 4, -2, 2, R); },
    cartridge: function (m) { m.box(-5, 5, 5, 15, -1, 1, G); m.box(-4, 4, 9, 14, 2, 2, R); m.box(-3, 3, 10, 13, 2, 2, Y); for (var x = -4; x <= 4; x += 2) m.put(x, 4, 0, Y); },
    binder: function (m) { m.box(-6, 6, 5, 15, -1, 0, PU); for (var x = -5; x <= 5; x += 4) for (var y = 6; y <= 14; y += 4) m.box(x, x + 2, y, y + 2, 1, 1, [R, B, Y, GR, PK, CY][((x + 5) / 4 + (y - 6) / 4 * 3) % 6]); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    gauge: function (m) { m.discV(0, 10, 5.4, K, 2); m.discV(0, 10, 4.6, W, 3); for (var a = -6; a <= 6; a++) { var t = a / 6 * 1.4; m.put(Math.round(Math.sin(t) * 4), Math.round(10 + Math.cos(t) * 4), 2, a > 3 ? R : a > 0 ? Y : GR); } for (var k = 0; k <= 4; k++) m.put(k, 10 + k, 2, R); [[5, 15], [6, 13], [4, 16]].forEach(function (p) { m.put(p[0], p[1], 0, Y); }); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    auraGlove: function (m) { M.glove(m); for (var a = 0; a < 18; a++) { var t = a / 18 * Math.PI * 2; m.put(Math.round(Math.sin(t) * 6.5), Math.round(11 + Math.cos(t) * 6.5), 0, a % 2 ? W : "#c9d8ff"); } },
    robotHand: function (m) { m.box(-3, 3, 5, 10, -1, 1, G); [-3, -1, 1, 3].forEach(function (x) { m.box(x, x, 11, 15, 0, 0, G2); m.put(x, 13, 1, K); }); m.box(4, 5, 8, 11, 0, 0, G2); m.box(-2, 2, 7, 8, 2, 2, CY); m.box(-1, 1, 4, 4, -1, 1, K); },
    speedClock: function (m) { M.stopwatch(m); [[5, 15], [6, 14], [5, 13], [6, 12], [7, 11]].forEach(function (p) { m.put(p[0], p[1], 2, Y); }); },
    bike: function (m) { [-4, 4].forEach(function (cx) { for (var a = 0; a < 16; a++) { var t = a / 16 * Math.PI * 2; m.put(Math.round(cx + Math.sin(t) * 3), Math.round(8 + Math.cos(t) * 3), 0, K); } m.put(cx, 8, 0, G); }); for (var k = 0; k <= 4; k++) { m.put(-4 + k, 8 + k, 0, R); m.put(k, 12 - k, 0, R); } m.box(0, 4, 12, 12, 0, 0, R); m.box(-1, 1, 13, 13, 0, 0, K); m.box(3, 5, 14, 14, 0, 0, G); },
    snowflake: function (m) { for (var a = 0; a < 6; a++) { var t = a / 6 * Math.PI * 2; for (var r = 0; r <= 6; r++) { var x = Math.round(Math.sin(t) * r), y = Math.round(11 + Math.cos(t) * r); m.put(x, y, 0, r > 4 ? W : CY); if (r === 4) { m.put(x + Math.round(Math.cos(t) * 1.5), y - Math.round(Math.sin(t) * 1.5), 0, W); m.put(x - Math.round(Math.cos(t) * 1.5), y + Math.round(Math.sin(t) * 1.5), 0, W); } } } m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    throne: function (m) { m.box(-4, 4, 4, 9, -3, 3, m.c[0]); m.box(-4, 4, 10, 17, -3, -2, m.c[1]); m.box(-5, -4, 4, 12, -3, 3, m.c[1]); m.box(4, 5, 4, 12, -3, 3, m.c[1]); m.box(-3, 3, 9, 9, -1, 3, R); [-4, -2, 0, 2, 4].forEach(function (x, i) { m.put(x, 18 + (i % 2), -3, m.c[2]); }); },
    lights: function (m) { for (var x = -7; x <= 7; x++) { var y = Math.round(14 - Math.abs(Math.sin(x / 7 * Math.PI)) * 3); m.put(x, y, 0, K); if (x % 2 === 0) { m.put(x, y - 1, 0, [R, Y, GR, B, PK, O, CY, R][(x + 8) % 8]); m.put(x, y - 2, 0, [R, Y, GR, B, PK, O, CY, R][(x + 8) % 8]); } } m.box(-7, -7, 4, 14, 0, 0, BR); m.box(7, 7, 4, 14, 0, 0, BR); m.box(-5, 5, 4, 7, -1, 1, "#3a3550"); },
    claw: function (m) { m.box(-5, 5, 4, 8, -3, 3, R); m.box(-5, 5, 9, 16, -3, -3, CY); m.box(-5, -5, 9, 16, -3, 3, G2); m.box(5, 5, 9, 16, -3, 3, G2); m.box(-5, 5, 17, 17, -3, 3, R); m.box(0, 0, 13, 16, 0, 0, G); m.put(-1, 12, 0, G); m.put(1, 12, 0, G); m.put(-2, 11, 0, G); m.put(2, 11, 0, G); m.sphere(10, 1.2, function () { return GR; }); },
    podium: function (m) { m.box(-2, 2, 4, 10, -2, 2, m.c[1]); m.box(-6, -3, 4, 8, -2, 2, G2); m.box(3, 6, 4, 6, -2, 2, BR2); m.sphere(8, 1.3, function () { return W; }, 4); m.box(-1, 1, 12, 12, 0, 0, m.c[2]); m.put(0, 13, 0, m.c[2]); },
    ringBall: function (m) { M.ring(m); m.sphere(15, 1.8, function (x, y) { return (x + y) % 2 ? K : W; }); },
    ring4: function (m) { M.ring(m); [[-3, 13], [3, 13], [-4, 8], [4, 8]].forEach(function (p, i) { m.put(p[0], p[1], 1, [R, B, GR, Y][i]); }); },
    cane: function (m) { m.box(1, 1, 4, 15, 0, 0, BR2); m.box(-3, 1, 16, 16, 0, 0, BR2); m.put(-3, 15, 0, BR2); m.box(-5, -3, 4, 9, -1, 1, O); m.box(-5, -3, 10, 10, -1, 1, W); m.put(-4, 6, 2, W); },
    disco: function (m) { m.sphere(11, 4, function (x, y, z) { return (x + y + z) % 2 ? G2 : (x * y) % 3 ? W : PK; }); m.box(0, 0, 15, 17, 0, 0, G); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    nose: function (m) { m.sphere(10, 3.2, function () { return "#d9a066"; }); for (var x = 3; x <= 9; x++) m.put(x, 10, 0, "#c08a50"); m.put(-1, 11, 3, K); m.put(1, 11, 3, K); m.box(-1, 1, 4, 6, 0, 0, m.c[0]); },
    phoneHeart: function (m) { M.phone(m); m.box(-1, 1, 9, 13, 2, 2, null); m.sprite([".R.R.", "RRRRR", ".RRR.", "..R.."], {R: R}, -2, 12, 1); },
    tent: function (m) { for (var y = 4; y <= 14; y++) { var r = (14 - y) * 0.65; m.disc(y, r, null); for (var a = 0; a < 16; a++) { var t = a / 16 * Math.PI * 2; m.put(Math.round(Math.sin(t) * r), y, Math.round(Math.cos(t) * r), a % 2 ? R : W); } } m.box(0, 0, 15, 17, 0, 0, G); m.box(1, 2, 16, 17, 0, 0, Y); },
    tiara: function (m) { m.disc(8, 4, m.c[1], true); [[-3, 10], [0, 12], [3, 10], [-2, 9], [2, 9], [-1, 10], [1, 10], [0, 11]].forEach(function (p) { m.put(p[0], p[1], -3, m.c[2]); }); m.put(0, 13, -3, PK); m.put(-3, 11, -3, CY); m.put(3, 11, -3, CY); m.box(0, 0, 4, 7, 0, 0, m.c[0]); },
    hanger: function (m) { m.put(0, 17, 0, G); m.put(1, 16, 0, G); m.put(0, 15, 0, G); for (var k = 0; k <= 5; k++) { m.put(-k, 14 - k * 0.5 | 0, 0, G); m.put(k, 14 - k * 0.5 | 0, 0, G); } m.box(-4, 4, 4, 11, -1, 0, PK); m.box(-2, 2, 11, 11, 1, 1, W); m.box(-4, 4, 7, 7, 1, 1, PU); },
    binoculars: function (m) { [-3, 3].forEach(function (cx) { for (var z = -3; z <= 3; z++) m.discV(cx, 10, z === 3 ? 1.6 : 2.2, z === 3 ? CY : K, 1); }); m.box(-1, 1, 10, 11, -1, 1, G); m.box(0, 0, 4, 7, 0, 0, m.c[0]); },
    godBolt: function (m) { m.sphere(15, 2.6, function () { return W; }, -2); m.sphere(15, 2.4, function () { return G2; }, 2); m.sprite(["..YY", ".YY.", "YYYY", "..Y.", ".Y.."], {Y: Y}, -1, 12, 1); M.laurel(m); },
    zeroRing: function (m) { for (var a = 0; a < 32; a++) { var t = a / 32 * Math.PI * 2; for (var w = 0; w < 2; w++) m.put(Math.round(Math.sin(t) * (3.2 + w)), Math.round(11 + Math.cos(t) * (5 + w)), 0, w ? m.c[0] : m.c[1]); } m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    grave: function (m) { m.box(-6, 6, 4, 4, -3, 3, "#3a5a32"); m.box(-3, 3, 5, 12, -1, 1, G); m.disc(13, 0, G); m.box(-2, 2, 13, 13, -1, 1, G); m.box(-1, 1, 14, 14, -1, 1, G); m.box(-1, 1, 9, 9, 2, 2, K); m.box(0, 0, 8, 10, 2, 2, K); m.box(4, 5, 5, 8, 2, 2, "#7aa060"); m.put(6, 8, 2, "#7aa060"); },
    magnifier: function (m) { for (var a = 0; a < 24; a++) { var t = a / 24 * Math.PI * 2; m.put(Math.round(-1 + Math.sin(t) * 4), Math.round(12 + Math.cos(t) * 4), 0, m.c[1]); } m.discV(-1, 12, 3, "#bfe8f0", 1); for (var k = 0; k <= 5; k++) m.put(2 + k, 8 - k, 0, BR); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    cloudLadder: function (m) { M.ladder(m); m.sphere(17, 2.4, function () { return W; }, -3); m.sphere(17, 2.6, function () { return W; }, 2); },
    dumbbellCrown: function (m) { M.dumbbell(m); [[-2, 14], [0, 15], [2, 14], [-1, 13], [1, 13], [0, 13]].forEach(function (p) { m.put(p[0], p[1], 0, m.c[2]); }); m.box(-2, 2, 13, 13, 0, 0, m.c[2]); },
    infinity: function (m) { for (var a = 0; a < 40; a++) { var t = a / 40 * Math.PI * 2, x = Math.round(6 * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t))), y = Math.round(11 + 6 * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t))); m.put(x, y, 0, m.c[1]); m.put(x, y, 1, m.c[0]); } m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    bars: function (m) { m.box(-6, 6, 4, 4, -1, 1, G); m.box(-6, 6, 16, 16, -1, 1, G); [-5, -3, -1, 3, 5].forEach(function (x) { m.box(x, x, 5, 15, 0, 0, G2); }); m.box(1, 1, 5, 8, 0, 0, G2); m.put(2, 11, 0, G2); m.put(1, 14, 0, G2); m.box(1, 1, 15, 15, 0, 0, G2); m.sphere(8, 1.4, function (x, y) { return (x + y) % 2 ? K : W; }, 7, 2); },
    explosion: function (m) { for (var a = 0; a < 16; a++) { var t = a / 16 * Math.PI * 2, r = a % 2 ? 6 : 3.5; for (var k = 0; k <= r; k++) m.put(Math.round(Math.sin(t) * k), Math.round(11 + Math.cos(t) * k), 0, k < 2 ? W : k < 4 ? Y : a % 2 ? R : O); } m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    xray: function (m) { m.box(-5, 5, 9, 12, 0, 0, K); m.box(-4, -1, 10, 11, 1, 1, R); m.box(1, 4, 10, 11, 1, 1, R); for (var k = 0; k < 5; k++) { m.put(-3 - k, 9 - k, 1, R); m.put(3 + k, 9 - k, 1, R); m.put(-2 - k, 13 + k, 1, Y); m.put(2 + k, 13 + k, 1, Y); } m.box(0, 0, 4, 8, 0, 0, m.c[0]); },
    lamp: function (m) { m.sphere(8, 3, function () { return m.c[1]; }); for (var x = 3; x <= 7; x++) m.put(x, 8 + (x > 5 ? 1 : 0), 0, m.c[1]); m.box(-5, -4, 7, 10, 0, 0, m.c[1]); m.disc(11, 1.4, m.c[2]); m.put(0, 12, 0, m.c[2]); [[7, 11], [6, 13], [7, 15], [5, 16]].forEach(function (p) { m.put(p[0], p[1], 0, "#c9b8ff"); }); m.disc(4, 1.6, m.c[0]); },
    clapper: function (m) { m.box(-5, 5, 4, 11, -1, 1, K); m.box(-4, 4, 6, 9, 2, 2, G); for (var x = -5; x <= 5; x++) { m.put(x, 12, 0, (x + 6) % 3 ? W : K); m.put(x, 14 + (x > 0 ? 1 : 0), 0, (x + 6) % 3 ? K : W); } },
    vault: function (m) { m.box(-5, 5, 4, 15, -3, 3, G); m.discV(0, 10, 3.4, G2, 9); m.discV(0, 10, 1.4, K, 10); for (var a = 0; a < 6; a++) { var t = a / 6 * Math.PI * 2; m.put(Math.round(Math.sin(t) * 2.6), Math.round(10 + Math.cos(t) * 2.6), 5, K); } m.box(4, 4, 6, 14, 4, 4, Y); },
    wheat: function (m) { [-4, -1, 2, 5].forEach(function (x, i) { m.box(x, x, 4, 11 + i % 2, 0, 0, "#c9a24a"); for (var y = 12 + i % 2; y <= 15 + i % 2; y++) { m.put(x, y, 0, Y); m.put(x - 1, y - 1, 0, "#e0c060"); } }); M.glove(m); },
    greatWall: function (m) { for (var x = -7; x <= 7; x++) { var y = 7 + Math.round(Math.sin(x / 3) * 1.5); m.box(x, x, 4, y, -1, 1, "#b8a080"); if (x % 2 === 0) m.put(x, y + 1, 0, "#9a8060"); } m.box(-2, 2, 4, 12, -2, 2, "#c8b090"); for (var x = -2; x <= 2; x += 2) m.put(x, 13, 0, "#9a8060"); },
    curtain: function (m) { m.box(-7, 7, 16, 17, -1, 1, G); for (var x = -7; x <= 7; x++) m.box(x, x, 4, 15, x % 2 ? 0 : 1, x % 2 ? 0 : 1, x % 2 ? "#6a747a" : "#8b969b"); },
    butter: function (m) { m.box(-4, 4, 4, 5, -3, 3, W); m.box(-3, 3, 6, 9, -2, 2, "#f4e08a"); m.box(-3, 3, 10, 10, -2, 2, "#fff0a8"); m.box(4, 8, 7, 7, 0, 0, G2); m.box(6, 8, 6, 8, 0, 0, G2); },
    iceCube: function (m) { m.box(-4, 4, 5, 13, -4, 4, "#bfe8f4"); m.box(-3, 3, 6, 12, 5, 5, W); m.box(-4, 4, 13, 13, -4, 4, W); m.put(2, 11, 5, CY); m.put(-2, 8, 5, CY); m.box(-1, 1, 4, 4, -1, 1, m.c[0]); },
    crackWall: function (m) { M.wall(m); for (var k = 0; k <= 6; k++) m.put(-2 + (k % 2), 5 + k, 1, K); m.sphere(9, 1.5, function (x, y) { return (x + y) % 2 ? K : W; }, 0, 2); },
    joker: function (m) { m.box(-4, 4, 5, 16, 0, 0, W); m.box(-4, 4, 5, 5, 1, 1, R); m.box(-4, 4, 16, 16, 1, 1, R); [[-2, 12, R], [0, 13, Y], [2, 12, GR]].forEach(function (p) { m.box(p[0] - 1, p[0] + 1, p[1], p[1], 1, 1, p[2]); m.put(p[0], p[1] + 1, 1, p[2]); }); m.box(-2, 2, 8, 10, 1, 1, PU); m.box(0, 0, 4, 4, 0, 0, m.c[0]); },
    anvil: function (m) { m.box(-2, 2, 4, 7, -2, 2, K); m.box(-5, 4, 8, 10, -2, 2, "#4a5256"); m.box(-7, -6, 9, 10, -1, 1, "#4a5256"); m.box(-1, 1, 11, 12, -1, 1, O); m.put(0, 13, 0, Y); m.put(-3, 12, 0, Y); m.put(3, 13, 0, O); },
    dice: function (m) { m.box(-6, -1, 4, 9, -2, 3, W); m.box(1, 6, 7, 12, -2, 3, R); [[-5, 8], [-2, 5], [-4, 6]].forEach(function (p) { m.put(p[0], p[1], 4, K); }); [[2, 11], [5, 8], [2, 8], [5, 11]].forEach(function (p) { m.put(p[0], p[1], 4, W); }); },
    crystalBall: function (m) { m.sphere(11, 4, function (x, y, z) { return (x + y) % 3 ? "#b49cff" : PU; }); m.disc(6, 2.6, BR2); m.disc(5, 3, BR); m.put(-1, 12, 4, W); },
    gavel: function (m) { m.box(-5, 1, 11, 13, -1, 1, BR2); m.box(-6, -6, 10, 14, -2, 2, BR); m.box(2, 2, 10, 14, -2, 2, BR); for (var k = 0; k <= 6; k++) m.put(1 + k, 10 - k, 0, BR2); m.box(-4, 4, 4, 5, -2, 2, BR); },
    shootingStar: function (m) { starAt(m, 3, 13, 3.4, Y, W); for (var k = 1; k <= 7; k++) { m.put(3 - k, 13 - k, 0, k < 3 ? Y : k < 5 ? O : PK); m.put(3 - k, 12 - k, 0, k < 4 ? W : CY); } m.box(-4, -4, 4, 5, 0, 0, m.c[0]); },
    puddleBoots: function (m) { m.disc(4, 6, "#5a9ad8"); m.disc(4, 4, "#7ab8f0", true); [-3, 2].forEach(function (x) { m.box(x, x + 2, 5, 11, -1, 1, Y); m.box(x + 2, x + 3, 5, 6, -1, 1, Y); }); [[-6, 6], [6, 7], [-5, 8], [5, 9]].forEach(function (p) { m.put(p[0], p[1], 0, CY); }); },
    twoHearts: function (m) { m.sprite([".RR.RR.", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], {R: R}, -6, 14, 2); m.sprite([".PP.PP.", "PPPPPPP", ".PPPPP.", "..PPP..", "...P..."], {P: PK}, 0, 11, 2); m.box(0, 0, 4, 6, 0, 0, m.c[0]); },
    fedora: function (m) { m.disc(8, 5.4, K); m.disc(9, 3.2, K); m.disc(10, 3.2, R); for (var y = 11; y <= 13; y++) m.disc(y, 3 - (y - 11) * 0.3, K); m.box(-1, 1, 13, 13, -1, 1, null); m.box(0, 0, 4, 7, 0, 0, m.c[0]); },
    ticTac: function (m) { m.box(-6, 6, 4, 16, 0, 0, "#2e5a3a"); [-2, 2].forEach(function (v) { m.box(v, v, 5, 15, 1, 1, W); m.box(-5, 5, v + 10, v + 10, 1, 1, W); }); [[-4, 14], [0, 10], [4, 6]].forEach(function (p) { m.put(p[0], p[1], 2, R); m.put(p[0] - 1, p[1] + 1, 2, R); m.put(p[0] + 1, p[1] - 1, 2, R); m.put(p[0] - 1, p[1] - 1, 2, R); m.put(p[0] + 1, p[1] + 1, 2, R); }); m.discV(4, 14, 1.3, Y, 1, true); m.box(-6, 6, 13, 13, 3, 3, Y); m.box(-6, 6, 13, 13, 3, 3, null); },
    aces: function (m) { [[-5, 0, R], [-2, 1, K], [1, 2, R], [4, 3, K]].forEach(function (q) { m.box(q[0] - 2, q[0] + 2, 6 + q[1] % 2, 14 + q[1] % 2, q[1], q[1], W); m.put(q[0], 10 + q[1] % 2, q[1] + 1, q[2]); m.put(q[0] - 1, 9 + q[1] % 2, q[1] + 1, q[2]); m.put(q[0] + 1, 9 + q[1] % 2, q[1] + 1, q[2]); m.put(q[0] - 1, 13 + q[1] % 2, q[1] + 1, q[2]); }); m.box(0, 0, 4, 5, 0, 0, m.c[0]); },
    beerFoam: function (m) { m.box(-3, 3, 4, 12, -3, 3, Y); m.box(-3, 3, 13, 14, -3, 3, W); m.put(-1, 15, 0, W); m.put(1, 15, 1, W); m.box(4, 5, 6, 10, 0, 0, G2); }
  };
  Object.keys(P).forEach(function (k) { M[k] = P[k]; });
  /* id del logro → objeto especial que evoca su referencia */
  var SPECIAL = {
    p_knee: "arrowKnee", x_gta: "bike", x_sun: "sunArms", x_fus: "shout", x_mine: "pickaxe", x_witcher: "silverSword", x_goldfish: "fishBowl",
    x_force: "aura", x_ring: "ring", x_papel: "moneyPress", x_cruyff: "orangeShirt", x_bushido: "katana", x_real: "rain", x_ea: "cartridge",
    x_9000: "gauge", a_9000: "gauge", x_poke: "binder", x_speed: "speedClock", mi_speed: "speedClock", x_mgs: "cardboard", x_pass: "staff", k_shall: "staff",
    x_knock: "door", x_matrix: "pills", c_pill: "redPill", x_fight: "boxing", x_fine: "mugFire", x_wolf: "stocks", x_war: "scrollSword", x_brain: "brainFire",
    g_hathome: "fedora", g_heist: "vault", g_exclub: "robotHand", g_1000: "lamp", g_s40: "clapper", g_ownhalf: "infinity", g_subfast: "bars", g_own: "explosion",
    a_prof: "profGlasses", a_200: "xray", a_both: "dice", a_pos: "joker", a_iron: "anvil", a_three: "goalBall",
    k_iron: "curtain", k_200: "wheat", k_butter: "butter", k_ultra: "auraGlove", k_zero: "iceCube", k_china: "greatWall", sp_10: "iceCube", sp_fk100: "target",
    sp_far: "house", sp_wall: "crackWall", sp_sd: "hourglass", c_winter: "snowflake", c_bench: "throne", c_upside: "lights", c_believe: "sign", c_jinx: "crystalBall",
    w_cap: "claw", w_pod: "podium", w_bdo3: "ringBall", w_all: "ring4", d_liar: "nose", d_house: "cane", d_dance: "disco", d_party: "beerFoam", d_boss: "gavel",
    r_inf: "phoneHeart", pt_circus: "tent", pt_queen: "tiara", pt_fashion: "hanger", pt_wish: "shootingStar", pt_puddle: "puddleBoots", pt_bff: "twoHearts",
    sh_eye: "binoculars", sh_leg: "godBolt", o_sparta: "helmet", o_zero: "zeroRing", o_rain: "rain", o_lost: "hatch", o_zombie: "grave", o_ghost: "ghost",
    m_where: "magnifier", m_sky: "cloudLadder", plat_m: "dumbbellCrown", g_hat: "ticTac", g_poker: "aces", r_ref: "redCard", o_invis: "gift", n_wc: "stars4"
  };
  /* reglas por texto (id, nombre y descripción en español): lo que cuenta el logro decide el objeto */
  var RULES = [
    [/^plat_/, ["crown"]],
    [/balón de oro|balones de oro|p_bdo|tercer hombre/, ["ballMetal"]],
    [/bota de|botas distintas|boots/, ["bootWing", "boot"]],
    [/mundial|cuatro estrellas/, ["stars4"]],
    [/anillo/, ["ring"]],
    [/esparta/, ["helmet"]],
    [/lluvia/, ["rain"]],
    [/sun|sol!/, ["sun"]],
    [/goldfish|pez/, ["fish"]],
    [/fantasma|zombie|muertos/, ["ghost"]],
    [/capitán/, ["armband"]],
    [/hat-trick|tres en raya|póker|triplete/, ["stars3"]],
    [/poste|palo/, ["post"]],
    [/diana|escuadra/, ["target"]],
    [/barrera|falta directa|balón parado|faltas/, ["wall", "goalBall"]],
    [/penalti|panenka|tanda|muerte súbita|picadito/, ["goalBall", "target", "goal"]],
    [/rodilla|lesi|fisio|médico|tocado|cinco lesionados/, ["bandage", "crutch"]],
    [/árbitro|roja|amonestad|expuls/, ["redCard", "whistle"]],
    [/mascota|charco|paseo|trucos|desfile|accesorios/, ["paw", "bone", "dogHouse", "dog"]],
    [/influencer|seguidores|redes/, ["phone"]],
    [/titular|portada|prensa|pinocho/, ["newspaper", "mic", "camera"]],
    [/anuncio|cine/, ["camera", "tv"]],
    [/afición|grada|pitad|ídolo|niño/, ["megaphone", "heart"]],
    [/millón|presupuesto|wall street|triple de su valor|ganga|oferta/, ["moneyBag", "coins", "tag"]],
    [/compra|tienda|pieza|tier|conjunto|destacado|equipa/, ["bag", "gift", "shirt", "cap"]],
    [/dorsales/, ["shirt"]],
    [/portería a cero|muro|telón|muralla|guardián|no pasarás|cero absoluto|encaj/, ["gloves2", "wall", "shield"]],
    [/para |parada|portero|mantequilla/, ["glove", "gloves2"]],
    [/golazo|fus ro|campo infinito|desde mi casa/, ["rocketBall", "ballFire"]],
    [/remont|perdía|0-3|sorpresa|believe|salva|ir perdiendo/, ["rocket", "bolt", "fire"]],
    [/asciende|ascen|cielo|ascensor/, ["ladder", "arrowUp"]],
    [/desciende|despid|bronca|0-5|cruda|pierde|falla|cosas que pasan|propia puerta|lo petó/, ["rain", "ghost", "bandage"]],
    [/9000|ultra|instinto|elegido|matrix/, ["bolt", "brain"]],
    [/cerebro|química|profesor|plan|visión|arquitecto|pase de museo|socio/, ["brain", "chess", "tactics"]],
    [/guerra|derbi|lucha|guerrero|bushido|rivia|witcher/, ["swords", "helmet"]],
    [/lealtad|mentor|mediador|paz|cubre/, ["handshake", "heart"]],
    [/fiesta|baile|homenaje/, ["mask", "vinyl"]],
    [/cantera|juvenil|canteranos|17 años|joven|chico de oro|joya/, ["sprout"]],
    [/vuelta a casa|predilecto|hijo|barrio/, ["house"]],
    [/estadio|1.500/, ["stadium"]],
    [/selección|internacional|confederación|bandera|centurión|tribu|patrio|llamada|continente/, ["flag", "flags2", "globe"]],
    [/trotamundos|viajero|pasaporte|países|exótica|mercado de invierno|clubes|escudos|banquillos|vestuarios|carrera internacional|míster mundial/, ["suitcase", "plane", "contract", "bus", "shield"]],
    [/archivo|setenta|ochenta|noventa|dos mil|milenio/, ["vinyl", "cassette", "tv", "scroll"]],
    [/futuro|2020/, ["rocket", "phone"]],
    [/década|décadas|temporadas|años|veterano|cuarentón|eterno|consolidado/, ["hourglass", "clock", "calendar", "stopwatch"]],
    [/primer partido|debut|silbatazo/, ["whistle", "shirt", "ball"]],
    [/minutos|partidos completos|hierro|incombustible|batallas|partidos/, ["stopwatch", "dumbbell", "shirt"]],
    [/decisi|capítulos|estrategias/, ["ballot", "scroll", "book"]],
    [/reputación|prestigio|respeto/, ["laurel", "crown", "shield"]],
    [/mejor entrenador|míster del año|premio|mes tras mes|once ideal|jugador del mes/, ["medalStar", "medal", "star"]],
    [/victoria|victorias|triunfos|triunfo/, ["laurel", "medal", "obelisk", "plate"]],
    [/invict|sin derrotas|sin perder|perfecta/, ["shieldBall", "diamond", "shield"]],
    [/título|títulos|vitrina|campeón|liga|copa|dinastía|continental|rey del/, ["cupTall", "cupBowl", "amphora", "plate", "crown", "obelisk"]],
    [/gol|goles|goleador|marca|ataque/, ["ball", "ballFire", "goalBall", "rocketBall"]],
    [/asisten|pase/, ["boot", "tactics"]],
    [/entrena|míster|banquillo|táctic|mentalidad|cambios|dirige|brazos|silla|equipo/, ["clipboard", "tactics", "whistle"]]
  ];
  var POOL = {goals: ["ball", "ballFire", "goalBall"], play: ["boot", "tactics"], gk: ["glove", "gloves2"], sp: ["goalBall", "wall"], career: ["suitcase", "calendar", "hourglass"],
    nat: ["flag", "globe"], awards: ["medal", "star", "medalStar"], room: ["ballot", "handshake", "mask"], press: ["mic", "newspaper", "megaphone"], pet: ["paw", "bone", "dog"],
    mgr: ["clipboard", "whistle", "tactics"], mini: ["gamepad", "target", "puzzle"], shop: ["bag", "tag", "gift"], odd: ["ghost", "fish", "gear", "key"],
    era: ["vinyl", "cassette", "tv", "scroll", "calendar"], base: ["cupTall", "shield", "star", "obelisk", "medal"]};
  var used = {};
  /* elige el objeto: la primera regla que encaje; dentro de su lista, el menos usado hasta ahora (más variedad) */
  function pick(cat, rar, id, text) {
    if (SPECIAL[id]) { used[SPECIAL[id]] = (used[SPECIAL[id]] || 0) + 1; return SPECIAL[id]; }
    var t = (id + " " + (text || "")).toLowerCase(), list = null;
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(t)) { list = RULES[i][1]; break; }
    if (!list) list = POOL[cat] || POOL.base;
    var h = hsh(id), best = null;
    for (var k = 0; k < list.length; k++) { var n = list[(h + k) % list.length]; if (best === null || (used[n] || 0) < (used[best] || 0)) best = n; }
    used[best] = (used[best] || 0) + 1;
    return best;
  }
  function key(cat, rar, id, text) {
    var name = pick(cat, rar, id, text), ped = hsh(id + "p") % 4, k = "pgs:" + name + ":" + rar + ":" + ped;
    GXV.reg(k, function () { return make(rar, ped, M[name]); });
    return k;
  }
  return {key: key, pick: pick, names: Object.keys(M), used: function () { return used; }};
})();
