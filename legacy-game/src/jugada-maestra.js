/* jugada-maestra.js — secuencias originales de pase y tiro. Motor puro, offline y reproducible. */
var JugadaMaestra = (function () {
  "use strict";
  /* capítulo 1: las seis jugadas originales; capítulos 2 a 5: jugadas propias, comprobadas una a una por el
     buscador de soluciones (par = acciones mínimas para marcar; bonus = el objetivo de la tercera estrella) */
  var BASE = [
    {title: "Pase y orientación", goal: "Lleva el balón a la zona libre y termina la jugada.", ball: [17, 55], mates: [[39, 42], [59, 61], [80, 50]], rivals: [[34, 55], [52, 50], [75, 59]], max: 4, par: 2, bonus: "todos"},
    {title: "El desmarque", goal: "Encuentra a quien ataca el espacio a la espalda.", ball: [18, 50], mates: [[38, 68], [60, 36], [81, 52]], rivals: [[35, 48], [55, 43], [70, 58]], max: 4, par: 2, bonus: "curva"},
    {title: "Pared", goal: "Combina con un apoyo y busca la devolución.", ball: [20, 58], mates: [[42, 58], [56, 34], [78, 55]], rivals: [[39, 52], [61, 48], [74, 64]], max: 5, par: 2, bonus: "escuadra"},
    {title: "Tiro colocado", goal: "Abre el ángulo y apunta a un lado de la portería.", ball: [66, 50], mates: [[49, 65], [78, 35], [85, 61]], rivals: [[69, 43], [81, 55], [87, 44]], max: 3, par: 1, bonus: "rosca"},
    {title: "Centro desde la banda", goal: "Supera la presión y encuentra el remate en el área.", ball: [48, 79], mates: [[68, 68], [78, 47], [88, 58]], rivals: [[55, 72], [74, 53], [84, 65]], max: 4, par: 1, bonus: "raso"},
    {title: "Contraataque", goal: "Avanza con decisión: tienes pocas acciones antes del repliegue.", ball: [19, 52], mates: [[43, 38], [62, 61], [82, 48]], rivals: [[39, 54], [60, 52], [76, 44]], max: 3, par: 2, bonus: "largo"}
  ];
  var CHAPTERS = [
    "Orientación y pase", "Ataca el espacio", "Paredes y apoyos", "Tiro y remate", "Decide bajo presión"
  ];
  var AUTH = [
    {title: "Al espacio", goal: "Busca el pase que rompa la línea y llega al área.", ball: [28, 53], mates: [[50, 27], [51, 82], [83, 59]], rivals: [[42, 47], [60, 38], [57, 67]], max: 4, par: 2, bonus: "largo"},
    {title: "Diagonal", goal: "Cambia de carril con un pase curvo y remata.", ball: [25, 40], mates: [[48, 23], [50, 68], [84, 60]], rivals: [[41, 34], [61, 33], [57, 56], [76, 48]], max: 4, par: 2, bonus: "curva"},
    {title: "Tercer hombre", goal: "Encadena apoyos hasta que alguien quede solo.", ball: [35, 49], mates: [[49, 23], [45, 64], [76, 52]], rivals: [[40, 56], [57, 39], [63, 57]], max: 4, par: 2, bonus: "todos"},
    {title: "A la espalda", goal: "Filtra el balón a la espalda de los centrales.", ball: [20, 47], mates: [[46, 27], [45, 65], [74, 50]], rivals: [[43, 45], [59, 36], [59, 58]], max: 4, par: 2, bonus: "escuadra"},
    {title: "Línea de cuatro", goal: "Cuatro rivales en línea: encuentra la grieta.", ball: [27, 61], mates: [[43, 29], [46, 77], [82, 38]], rivals: [[44, 59], [61, 43], [57, 67], [79, 47]], max: 4, par: 3, bonus: "rosca"},
    {title: "Rápido y vertical", goal: "Solo tres acciones: no te entretengas.", ball: [32, 38], mates: [[41, 18], [42, 73], [85, 39]], rivals: [[38, 32], [61, 39], [57, 61], [76, 41]], max: 3, par: 2, bonus: "raso"},
    {title: "Rondo", goal: "Mueve el balón entre los cuatro apoyos hasta abrir hueco.", ball: [35, 46], mates: [[45, 30], [44, 62], [65, 47], [74, 39]], rivals: [[42, 45], [49, 50], [60, 32], [57, 65]], max: 5, par: 3, bonus: "largo"},
    {title: "Triángulo", goal: "Toca y busca el tercer apoyo para salir de la presión.", ball: [35, 31], mates: [[45, 21], [45, 49], [66, 27]], rivals: [[41, 27], [53, 34], [59, 12], [59, 46]], max: 5, par: 3, bonus: "curva"},
    {title: "Apoyo y descarga", goal: "Descarga, gira el juego y ataca el área.", ball: [35, 60], mates: [[44, 43], [45, 74], [62, 68], [72, 42]], rivals: [[42, 62], [50, 57], [57, 46], [55, 70]], max: 4, par: 3, bonus: "escuadra"},
    {title: "Entre líneas", goal: "Encuentra a quien recibe entre el medio y la defensa.", ball: [34, 68], mates: [[44, 51], [44, 84], [63, 77]], rivals: [[41, 66], [51, 64], [56, 51], [55, 79]], max: 4, par: 3, bonus: "rosca"},
    {title: "Muro de cinco", goal: "Cinco rivales cierran el centro: combina en corto.", ball: [35, 53], mates: [[47, 40], [46, 62], [67, 57], [73, 49]], rivals: [[41, 57], [53, 48], [57, 40], [56, 65], [86, 51]], max: 4, par: 3, bonus: "raso"},
    {title: "Salida en corto", goal: "Rompe la presión con pases precisos.", ball: [34, 38], mates: [[43, 22], [42, 55], [61, 32], [73, 50]], rivals: [[43, 42], [49, 38], [54, 28], [60, 49], [86, 43]], max: 4, par: 3, bonus: "largo"},
    {title: "Con rosca", goal: "Un defensor tapa el tiro directo: curva el balón.", ball: [63, 66], mates: [[82, 30], [79, 63]], rivals: [[70, 62], [87, 52], [89, 67], [75, 55]], max: 3, par: 1, bonus: "rosca"},
    {title: "Asistencia", goal: "Dásela a quien tenga mejor ángulo y remata.", ball: [66, 52], mates: [[85, 34], [79, 72], [65, 24]], rivals: [[72, 48], [82, 53], [88, 66], [74, 58]], max: 3, par: 2, bonus: "curva"},
    {title: "A la escuadra", goal: "El portero cubre el centro: busca la escuadra.", ball: [67, 63], mates: [[84, 41], [85, 70], [63, 18]], rivals: [[75, 64], [86, 48], [89, 63]], max: 3, par: 1, bonus: "escuadra"},
    {title: "Superioridad", goal: "Dos compañeros contra tres rivales: decide bien.", ball: [59, 55], mates: [[78, 37], [81, 68]], rivals: [[67, 50], [86, 53], [85, 60]], max: 3, par: 2, bonus: "todos"},
    {title: "Raso al palo", goal: "Solo hay una rendija: tiro raso y ajustado.", ball: [59, 35], mates: [[80, 40], [86, 63]], rivals: [[68, 31], [87, 49], [89, 42], [73, 44]], max: 3, par: 1, bonus: "raso"},
    {title: "Frontal del área", goal: "Desde la frontal, con defensas delante del portero.", ball: [58, 50], mates: [[85, 29], [82, 59]], rivals: [[65, 52], [81, 48], [84, 38]], max: 3, par: 1, bonus: "escuadra"},
    {title: "Presión alta", goal: "Cinco rivales te esperan: sal jugando y define.", ball: [38, 41], mates: [[41, 23], [45, 76], [78, 60], [85, 58]], rivals: [[45, 41], [60, 34], [59, 60], [69, 58], [82, 42]], max: 4, par: 3, bonus: "escuadra"},
    {title: "Desde atrás", goal: "Del centro del campo a la red sin perder el balón.", ball: [16, 60], mates: [[41, 30], [45, 76], [78, 56], [87, 26]], rivals: [[40, 55], [59, 36], [56, 63], [74, 65], [86, 53]], max: 4, par: 3, bonus: "rosca"},
    {title: "Laberinto", goal: "Hay muy pocas rutas limpias: encuentra la buena.", ball: [25, 56], mates: [[45, 27], [44, 74], [76, 52]], rivals: [[37, 53], [55, 30], [50, 58], [75, 59], [84, 53]], max: 4, par: 3, bonus: "raso"},
    {title: "Sin margen", goal: "Tres acciones exactas para marcar.", ball: [20, 73], mates: [[46, 23], [45, 78], [69, 57], [79, 58]], rivals: [[30, 71], [59, 35], [51, 57], [74, 49], [85, 41]], max: 3, par: 3, bonus: "largo"},
    {title: "Último minuto", goal: "Ahora o nunca: tres acciones y la defensa encima.", ball: [34, 69], mates: [[43, 16], [45, 74], [63, 46]], rivals: [[41, 64], [54, 44], [60, 56], [71, 51], [81, 57]], max: 3, par: 3, bonus: "escuadra"},
    {title: "Obra maestra", goal: "La jugada más difícil: pase, pase y gol perfecto.", ball: [29, 33], mates: [[45, 17], [44, 71], [74, 42]], rivals: [[38, 38], [54, 30], [58, 71], [77, 68], [87, 42]], max: 3, par: 3, bonus: "rosca"}
  ];
  function pad2(n) { return String(n).padStart(2, "0"); }
  var LEVELS = (function () {
    var src = BASE.concat(AUTH), all = [];
    src.forEach(function (b, i) {
      var n = i + 1, c = Math.floor(i / 6);
      all.push({id: "jm-" + pad2(n), chapter: c + 1, chapterTitle: CHAPTERS[c], title: b.title, goal: b.goal, ball: b.ball.slice(), mates: b.mates.map(function (p) { return p.slice(); }), rivals: b.rivals.map(function (p) { return p.slice(); }), max: b.max, par: b.par || null, bonus: b.bonus || "escuadra", seedOffset: n * 7919});
    });
    return all;
  })();
  /* reto diario: una jugada de la campaña en espejo (mismas soluciones, otra lectura) */
  var DAILY = {};
  function dailyLevel(id) {
    if (DAILY[id]) return DAILY[id];
    var k = +String(id).slice(4), b = LEVELS[k]; if (!b) return null;
    var m = function (p) { return [p[0], 100 - p[1]]; };
    DAILY[id] = {id: id, daily: true, base: b.id, chapter: b.chapter, chapterTitle: b.chapterTitle, title: "Jugada del día", goal: b.goal, ball: m(b.ball), mates: b.mates.map(m), rivals: b.rivals.map(m), max: b.max, par: b.par, bonus: b.bonus, seedOffset: 104729 + k * 7919};
    return DAILY[id];
  }
  function dailyId(day, upTo) { var n = Math.max(1, Math.min(LEVELS.length, upTo || LEVELS.length)), h0 = Math.imul((day | 0) ^ 0x5bd1e995, 0x27d4eb2d) >>> 0; h0 ^= h0 >>> 15; return "dia-" + ((h0 >>> 0) % n); }
  function level(id) { if (/^dia-\d+$/.test(String(id))) return dailyLevel(id); for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function segDist(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], d = dx * dx + dy * dy || 1; var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  /* distancia de un punto a un trazo (lista de puntos): así un pase o tiro con rosca puede rodear a un rival */
  function pathDist(p, pts) { var d = 1e9; for (var i = 1; i < pts.length; i++) d = Math.min(d, segDist(p, pts[i - 1], pts[i])); return pts.length > 1 ? d : 1e9; }
  function cleanPath(path, start, end) {
    var out = [start.slice()];
    (path || []).forEach(function (q) { if (q && isFinite(q[0]) && isFinite(q[1])) { var last = out[out.length - 1]; if (Math.hypot(q[0] - last[0], q[1] - last[1]) > 1.5) out.push([Math.max(0, Math.min(100, +q[0])), Math.max(0, Math.min(100, +q[1]))]); } });
    out.push(end.slice());
    return out;
  }
  /* punto del trazo más cercano a p, y lo que se ha recorrido hasta él (0..1) */
  function nearestOnPath(p, pts) {
    var best = pts[0], bd = 1e9, total = 0, at = 0, run = 0, i;
    for (i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), d2 = dx * dx + dy * dy || 1;
      var k = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d2)), q = [a[0] + k * dx, a[1] + k * dy], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < bd) { bd = d; best = q; at = (run + k * L) / (total || 1); }
      run += L;
    }
    return {p: best, d: bd, k: at};
  }
  function noise(seed, turn, x, y) { var s = (seed ^ Math.imul(turn + 1, 0x45d9f3b) ^ Math.imul(Math.round(x * 10) + 1, 0x27d4eb2d) ^ Math.imul(Math.round(y * 10) + 7, 0x165667b1)) >>> 0; s ^= s >>> 16; s = Math.imul(s, 0x7feb352d); s ^= s >>> 15; s = Math.imul(s, 0x846ca68b); s ^= s >>> 16; return (s >>> 0) / 4294967296; }
  function fresh(id, seed) { var l = level(id); if (!l) return null; return {id: id, seed: ((seed >>> 0) ^ l.seedOffset) >>> 0, ball: l.ball.slice(), mates: l.mates.map(function (p, i) { return {p: p.slice(), i: i, open: true}; }), rivals: l.rivals.map(function (p) { return p.slice(); }), turn: 0, max: l.max, done: false, won: false, log: []}; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /* Momento de partido: la misma mecánica de trazos, con la dificultad de la ocasión real.
     xg es el xG del modelo para ese tiro; la geometría (presión, carril y número de rivales)
     lo refleja y el resolvedor ancla la conversión en ese xG (ver resolve). */
  function moment(seed, o) {
    o = o || {};
    var xg = clamp(+o.xg || 0.2, 0.02, 0.85), s = (seed >>> 0) || 7;
    function r(k) { return noise(s, 500 + k, Math.round(xg * 1000) / 10, k * 3 + 1); }
    var bx = clamp(77 + (xg - 0.2) * 11 + (r(1) - 0.5) * 3, 72, 84);
    var by = clamp(50 + (r(2) - 0.5) * 16, 34, 66);
    var wide = r(18) < 0.5 ? -1 : 1;
    var mates = [
      {p: [clamp(bx + 4 + r(3) * 3, 70, 86), clamp(by + (r(4) - 0.5) * 20, 26, 74)], i: 0, open: true},
      {p: [clamp(bx + 1 + r(5) * 4, 70, 86), clamp(by + wide * (17 + r(6) * 10), 16, 84)], i: 1, open: true}
    ];
    if (xg > 0.42) mates.push({p: [clamp(bx + 6 + r(7) * 2, 72, 86), clamp(50 + (r(8) - 0.5) * 14, 30, 70)], i: 2, open: true});
    /* El central cierra el carril pero sin taparlo por completo: deja tiro y portero.
       Con poca ventaja aparece un segundo defensor y, en las ocasiones peores, un
       tercero cubriendo el segundo palo. */
    var side = r(17) < 0.5 ? -1 : 1;
    var rivals = [[clamp(bx + 7 + r(9) * 5, bx + 4, 93), clamp(by + side * (12 + r(15) * 10), 24, 76)]];
    if (xg <= 0.5) rivals.push([clamp(bx - 4 + r(11) * 5, 64, 90), clamp(by - side * (9 + r(16) * 8), 22, 78)]);
    if (xg <= 0.28) rivals.push([clamp((bx + 96) / 2 + (r(13) - 0.5) * 8, 84, 94), clamp(50 + (r(14) - 0.5) * 34, 22, 78)]);
    var st = {id: o.id || "momento", match: true, xg: xg, seed: s, ball: [bx, by], mates: mates,
      rivals: rivals, turn: 0, max: xg >= 0.45 ? 2 : 3, done: false, won: false, log: [], chain: 0};
    /* Referencia neutra: el disparo directo al centro desde la posición inicial. Así un
       intento sin ventaja convierte exactamente con el xG del modelo y el resto es mérito. */
    st.g0 = shotQuality(st.ball, st.rivals, 50);
    return st;
  }
  /* Calidad geométrica base de un tiro (la misma fórmula del resolvedor). */
  function shotQuality(ball, rivals, y) {
    var goalTarget = Math.abs(y - 50), pressure = 99, lane = 99;
    (rivals || []).forEach(function (r) {
      pressure = Math.min(pressure, dist(r, ball));
      lane = Math.min(lane, segDist(r, ball, [96, y]));
    });
    return Math.max(0.13, Math.min(0.91, 0.82 - goalTarget * 0.012 - Math.max(0, 18 - lane) * 0.018 - Math.max(0, 15 - pressure) * 0.009));
  }
  /* Resolución automática sin jugar: reproduce el xG del modelo, sin premio ni castigo. */
  function momentAuto(seed, xg) {
    xg = clamp(+xg || 0.2, 0.02, 0.85);
    var roll = noise((seed >>> 0) || 7, 977, Math.round(xg * 1000), 5);
    if (roll < xg) return "goal";
    var rest = (roll - xg) / Math.max(0.001, 1 - xg);
    return rest < 0.62 ? "save" : rest < 0.8 ? "post" : "miss";
  }
  /* Retos (no partido), al estilo de los juegos de jugadas dibujadas: nada de azar. El trazo decide.
     Portería: postes a 9,15 unidades del centro (7,32 m con 0,4 m por unidad) y larguero a 2,44 m. */
  var POST = 9.15, BAR = 2.44;
  function campaignShot(s, start, y, pts, h) {
    var off = Math.abs(y - 50), far = 97 - start[0], lane = s.rivals.reduce(function (v, r) { return Math.min(v, pathDist(r, pts)); }, 99);
    var hh = h == null ? 1 : +h, how;
    if (lane < 3.5) how = "block";
    else if (off > POST || hh > BAR) how = "miss";
    else if (off > POST - 0.6 || (hh > BAR - 0.12 && off > 1)) how = off > POST - 0.6 ? "post" : "bar";
    else if (far > 50) how = "save";                                   /* más de 25 m: el portero la ve venir */
    else if (far > 34 && !(off >= 5.5 && hh >= 1.5)) how = "save";     /* de 17 a 25 m: solo a la escuadra */
    else if (off < 2.6 && hh < 1.9) how = "save";                      /* al centro: al portero */
    else how = "goal";
    return {how: how, lane: lane, scored: how === "goal"};
  }
  function resolve(s, x, y, path, h) {
    if (!s || s.done) return {ok: false, reason: "done"};
    x = Math.max(5, Math.min(96, +x || 0)); y = Math.max(7, Math.min(93, +y || 0));
    var start = s.ball.slice(), turn = s.turn++, shot = s.match ? (x >= 87 && y > 26 && y < 74) : (x > 83 && y > 28 && y < 72);
    /* en los retos todo va por trazo; sin trazo (botones accesibles) cuenta como una línea recta */
    var drawn = path && path.length ? path : (s.match ? null : []);
    if (shot && !s.match && drawn) {
      var pts0 = cleanPath(drawn, start, [96, y]), cs = campaignShot(s, start, y, pts0, h);
      s.done = true; s.won = cs.scored; s.ball = [95, y];
      var m0 = cs.how === "goal" ? "¡Gol! La jugada termina en la red." : cs.how === "block" ? "La defensa tapa el disparo. Dibuja el tiro rodeando a los rivales." :
        cs.how === "save" ? (97 - start[0] > 34 ? "El portero la atrapa: acércate más o busca la escuadra." : "El portero la atrapa: apunta más cerca de los postes.") : cs.how === "miss" ? "Fuera. Apunta dentro de la portería." : "¡Al palo! Por muy poco.";
      s.log.push({k: "shot", ok: cs.scored, msg: m0, how: cs.how, to: [96, y], from: start, path: pts0, h: h == null ? null : +h, lane: cs.lane});
      return {ok: true, shot: true, scored: cs.scored, how: cs.how, msg: m0, state: s};
    }
    if (shot) {
      var goalTarget = Math.abs(y - 50), pressure = s.rivals.reduce(function (v, r) { return Math.min(v, dist(r, start)); }, 99);
      var shotPts = drawn ? cleanPath(drawn, start, [96, y]) : null;
      var lane = s.rivals.reduce(function (v, r) { return Math.min(v, shotPts ? pathDist(r, shotPts) : segDist(r, start, [96, y])); }, 99);
      var quality = Math.max(0.13, Math.min(0.91, 0.82 - goalTarget * 0.012 - Math.max(0, 18 - lane) * 0.018 - Math.max(0, 15 - pressure) * 0.009));
      /* Momento de partido: mismo gesto y misma física, pero la conversión se ancla en el xG
         del modelo. Un intento neutro convierte como el tiro automático; acercarse y abrir
         línea de tiro mejora, forzar desde lejos o con un rival encima empeora. */
      if (s.match && s.xg != null && s.g0 != null) {
        /* Un intento directo convierte con el xG del modelo; acercarse, abrir línea y
           combinar (la defensa pierde su sitio) mejora; forzar empeora. */
        var near = Math.max(0, 22 - dist(start, [96, y])) * 0.008;
        var chain = 0.07 * Math.min(2, s.chain || 0);
        quality = Math.max(0.03, Math.min(0.93, s.xg + (quality - s.g0) * 0.9 + near + chain));
      }
      var scored = noise(s.seed, turn, x, y) < quality;
      s.done = true; s.won = scored; s.ball = [95, y];
      var msg = scored ? "¡Gol! La jugada termina en la red." : lane < 9 ? "La defensa tapa el disparo. Busca primero una línea de tiro." : "El portero llega a tu disparo. Prueba con más espacio o cambia el ángulo.";
      s.log.push({k: "shot", ok: scored, msg: msg, quality: quality, to: [x, y], from: start, path: shotPts, h: h == null ? null : +h, lane: lane});
      return {ok: true, shot: true, scored: scored, quality: quality, msg: msg, state: s};
    }
    /* con trazo, el receptor es el compañero más cercano a la punta del trazo (así un pase a quien está pegado al área no se confunde) */
    var tip = drawn && drawn.length ? drawn[drawn.length - 1] : null;
    var target = tip && isFinite(tip[0]) && isFinite(tip[1]) ? [+tip[0], +tip[1]] : [x, y], best = null, bd = 1e9;
    s.mates.forEach(function (m) { if (!m.open) return; var d = dist(m.p, target); if (d < bd) { bd = d; best = m; } });
    if (!best || bd > 25) {
      s.turn--; return {ok: false, reason: "target", msg: "Busca un espacio o apunta a un compañero o compañera."};
    }
    var passPts = drawn ? cleanPath(drawn, start, best.p) : null, cut = null;
    var laneDist = s.rivals.reduce(function (v, r) { return Math.min(v, passPts ? pathDist(r, passPts) : segDist(r, start, best.p)); }, 99);
    var closeness = s.rivals.reduce(function (v, r) { return Math.min(v, dist(r, best.p)); }, 99);
    var qualityPass = Math.max(0.18, Math.min(0.96, 0.84 - Math.max(0, 10 - laneDist) * 0.05 - Math.max(0, 10 - closeness) * 0.025 - bd * 0.006));
    var success;
    if (!s.match && passPts) {
      /* reto dibujado: el pase llega si el trazo esquiva a todos los rivales; si pasa cerca de uno, lo corta */
      success = laneDist >= 4 && closeness >= 2.5;
      if (!success) {
        var hit = null, hd = 1e9;
        s.rivals.forEach(function (r) { var n = nearestOnPath(r, passPts); if (n.d < 4 && n.k < (hit ? hit.k : 2)) { hit = n; hd = n.d; } else if (!hit && n.d < hd) { hd = n.d; cut = n; } });
        cut = hit || cut || nearestOnPath(best.p, passPts);
      }
    } else success = noise(s.seed, turn, x, y) < qualityPass;
    if (success) {
      s.ball = best.p.slice(); best.open = false; s.chain = (s.chain || 0) + 1;
      /* tras el pase, la defensa repliega hacia el balón y el resto del equipo ofrece apoyos.
         En un momento de partido el repliegue es más corto: si no, combinar nunca compensa. */
      s.rivals = s.rivals.map(function (r, i) { var k = i === 0 ? (s.match ? 0.12 : 0.24) : (s.match ? 0.07 : 0.13); return [r[0] + (s.ball[0] - r[0]) * k, r[1] + (s.ball[1] - r[1]) * k]; });
      s.mates.forEach(function (m) { if (m !== best && m.open) { m.p[0] = Math.min(90, m.p[0] + 2.5); m.p[1] += (50 - m.p[1]) * 0.06; } });
    } else {
      s.ball = cut ? cut.p.slice() : [start[0] + (best.p[0] - start[0]) * 0.56, start[1] + (best.p[1] - start[1]) * 0.56];
      var near = s.rivals.slice().sort(function (a, b) { return dist(a, s.ball) - dist(b, s.ball); })[0];
      if (near) { near[0] = s.ball[0] + 2; near[1] = s.ball[1]; }
    }
    var message = success ? "Pase completado: el equipo conserva la posesión." : (!s.match && passPts ? "Pase cortado: el trazo pasaba demasiado cerca de un rival." : "Pase interceptado. Aún puedes reaccionar si te queda otra acción.");
    s.log.push({k: "pass", ok: success, msg: message, quality: qualityPass, from: start, to: best.p.slice(), mate: best.i, path: passPts, cut: cut ? cut.k : null});
    if (!success && (s.turn >= s.max || (!s.match && passPts))) s.done = true; /* en los retos dibujados, un pase cortado acaba la jugada */
    if (s.turn >= s.max && !s.won) s.done = true;
    return {ok: true, shot: false, completed: success, quality: qualityPass, msg: message, state: s};
  }
  /* buscador de soluciones: acciones mínimas para marcar desde un estado (y, si se pide, cumpliendo un objetivo).
     Sirve para el par de cada reto, para comprobar los objetivos y para las pistas. */
  var PAR = {}, SHOT_Y = [43, 44.5, 55.5, 57], OFFS = [0, -8, 8, -15, 15], HS = [0.5, 1, 2];
  function bend(a, b, off) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, c = [mx - dy / L * off, my + dx / L * off], pts = [];
    for (var i = 1; i < 8; i++) { var t = i / 8; pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]); }
    return pts;
  }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function solve(st0, pred, cap) {
    if (!st0 || st0.done) return null;
    var left = st0.max - st0.turn, layer = [{s: st0, plan: []}];
    for (var d = 1; d <= left; d++) {
      var next = [], seen = {};
      for (var n = 0; n < layer.length; n++) {
        var node = layer[n], st = node.s;
        for (var a = 0; a < SHOT_Y.length; a++) for (var b = 0; b < OFFS.length; b++) for (var hI = 0; hI < HS.length; hI++) {
          var c = copy(st), y = SHOT_Y[a], r = resolve(c, 96, y, bend(c.ball, [96, y], OFFS[b]), HS[hI]);
          if (r.ok && r.scored && (!pred || pred(c))) return {depth: d, plan: node.plan.concat([{k: "shot", y: y, off: OFFS[b], h: HS[hI]}]), state: c};
        }
        if (d >= left) continue;
        st.mates.forEach(function (m) {
          if (!m.open) return;
          OFFS.forEach(function (o) {
            var c2 = copy(st), r2 = resolve(c2, Math.min(m.p[0], 83), m.p[1], bend(c2.ball, m.p, o));
            if (!r2.ok || !r2.completed || c2.done) return;
            var key = c2.ball.map(Math.round).join(",") + "|" + c2.mates.map(function (q) { return q.open ? 1 : 0; }).join("") + "|" + (pred ? c2.log.length + ":" + o : "");
            if (seen[key]) return; seen[key] = 1;
            next.push({s: c2, plan: node.plan.concat([{k: "pass", mate: m.i, off: o}])});
          });
        });
      }
      layer = next.slice(0, cap || 400);
      if (!layer.length) break;
    }
    return null;
  }
  function par(id) {
    if (PAR[id] != null) return PAR[id];
    var l = level(id); if (!l) return 3;
    if (l.par) return (PAR[id] = l.par);
    var r = solve(fresh(id, 1));
    PAR[id] = r ? r.depth : l.max;
    return PAR[id];
  }
  /* objetivos de la tercera estrella */
  function devOf(pts) { if (!pts || pts.length < 3) return 0; var a = pts[0], b = pts[pts.length - 1], m = 0; for (var i = 1; i < pts.length - 1; i++) m = Math.max(m, segDist(pts[i], a, b)); return m; }
  function lastShot(s) { var t = s.log[s.log.length - 1]; return t && t.k === "shot" ? t : null; }
  function okPasses(s) { return s.log.filter(function (l) { return l.k === "pass" && l.ok; }); }
  var BONUS = {
    escuadra: {label: "Marca por la escuadra", test: function (s) { var t = lastShot(s); return !!(t && t.ok && t.h != null && t.h >= 1.5 && Math.abs(t.to[1] - 50) >= 5.5); }},
    raso: {label: "Marca con un tiro raso", test: function (s) { var t = lastShot(s); return !!(t && t.ok && t.h != null && t.h < 0.8); }},
    rosca: {label: "Marca con un tiro con rosca", test: function (s) { var t = lastShot(s); return !!(t && t.ok && devOf(t.path) >= 3); }},
    largo: {label: "Completa un pase largo", test: function (s) { return okPasses(s).some(function (l) { return dist(l.from, l.to) >= 28; }); }},
    curva: {label: "Completa un pase con rosca", test: function (s) { return okPasses(s).some(function (l) { return devOf(l.path) >= 4; }); }},
    todos: {label: "Que toquen todos tus compañeros", test: function (s) { return okPasses(s).length >= s.mates.length; }}
  };
  function bonusOf(id) { var l = level(id); return l && BONUS[l.bonus] ? {id: l.bonus, label: BONUS[l.bonus].label} : null; }
  function bonusTest(kind, s) { return !!(BONUS[kind] && BONUS[kind].test(s)); }
  /* pista: la siguiente acción de una solución desde el estado actual */
  function hint(s) { if (!s || s.done || s.match) return null; var r = solve(copy(s), null, 160); return r ? r.plan[0] : null; }
  function result(s) {
    if (!s) return null;
    if (s.match) return {done: !!s.done, won: !!s.won, actions: s.turn, par: 2, bits: s.won ? 1 : 0, medal: s.won ? (s.turn <= 2 ? 3 : s.turn <= 3 ? 2 : 1) : 0};
    var p = par(s.id), l = level(s.id), bits = 0;
    if (s.won) { bits = 1; if (s.turn <= p) bits |= 2; if (l && bonusTest(l.bonus, s)) bits |= 4; }
    return {done: !!s.done, won: !!s.won, actions: s.turn, par: p, bits: bits, medal: (bits & 1) + (bits >> 1 & 1) + (bits >> 2 & 1)};
  }
  function levels() { return LEVELS.map(function (l) { return {id: l.id, chapter: l.chapter, chapterTitle: l.chapterTitle, title: l.title, goal: l.goal, max: l.max, bonus: l.bonus}; }); }
  return {POST: POST, BAR: BAR, BONUS: BONUS, levels: levels, solve: solve, hint: hint, bonusOf: bonusOf, bonusTest: bonusTest, dailyId: dailyId, bend: bend, level: level, chapters: CHAPTERS.slice(), fresh: fresh, moment: moment, momentAuto: momentAuto, resolve: resolve, result: result, par: par, dist: dist, segDist: segDist};
})();
