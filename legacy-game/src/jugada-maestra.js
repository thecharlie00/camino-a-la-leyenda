/* jugada-maestra.js — secuencias originales de pase y tiro. Motor puro, offline y reproducible. */
var JugadaMaestra = (function () {
  "use strict";
  var LEVELS = [
    {id: "jm-01", title: "Pase y orientación", goal: "Lleva el balón a la zona libre y termina la jugada.", ball: [17, 55], mates: [[39, 42], [59, 61], [80, 50]], rivals: [[34, 55], [52, 50], [75, 59]], max: 4},
    {id: "jm-02", title: "El desmarque", goal: "Encuentra a quien ataca el espacio a la espalda.", ball: [18, 50], mates: [[38, 68], [60, 36], [81, 52]], rivals: [[35, 48], [55, 43], [70, 58]], max: 4},
    {id: "jm-03", title: "Pared", goal: "Combina con un apoyo y busca la devolución.", ball: [20, 58], mates: [[42, 58], [56, 34], [78, 55]], rivals: [[39, 52], [61, 48], [74, 64]], max: 5},
    {id: "jm-04", title: "Tiro colocado", goal: "Abre el ángulo y apunta a un lado de la portería.", ball: [66, 50], mates: [[49, 65], [78, 35], [85, 61]], rivals: [[69, 43], [81, 55], [87, 44]], max: 3},
    {id: "jm-05", title: "Centro desde la banda", goal: "Supera la presión y encuentra el remate en el área.", ball: [48, 79], mates: [[68, 68], [78, 47], [88, 58]], rivals: [[55, 72], [74, 53], [84, 65]], max: 4},
    {id: "jm-06", title: "Contraataque", goal: "Avanza con decisión: tienes pocas acciones antes del repliegue.", ball: [19, 52], mates: [[43, 38], [62, 61], [82, 48]], rivals: [[39, 54], [60, 52], [76, 44]], max: 3}
  ];
  var CHAPTERS = [
    "Orientación y pase", "Ataca el espacio", "Paredes y apoyos", "Tiro y remate", "Decide bajo presión"
  ];
  var LEVELS = (function () {
    var base = LEVELS.slice(), all = [], shifts = [
      [[0, 0], [0, 0], [0, 0]], [[-3, -8], [2, 8], [5, -3]], [[6, 5], [-5, -7], [1, 9]],
      [[-5, 8], [7, -5], [-7, -8]], [[8, -4], [-7, 5], [6, 7]]
    ];
    function moved(pos, delta) { return [Math.max(8, Math.min(92, pos[0] + delta[0])), Math.max(10, Math.min(90, pos[1] + delta[1]))]; }
    for (var c = 0; c < 5; c++) for (var i = 0; i < base.length; i++) {
      var b = base[i], n = c * base.length + i + 1, shift = shifts[c];
      var lm = {
        id: "jm-" + String(n).padStart(2, "0"), chapter: c + 1, chapterTitle: CHAPTERS[c],
        title: b.title, goal: b.goal, ball: moved(b.ball, shift[0]),
        mates: b.mates.map(function (p, j) { return moved(p, shift[(j + c) % 3]); }),
        rivals: b.rivals.map(function (p, j) { return moved(p, shift[(j + 1 + c) % 3]); }),
        max: Math.min(5, Math.max(3, b.max - (c >= 3 ? 1 : 0) + (c === 1 ? 1 : 0))),
        seedOffset: n * 7919
      };
      all.push(lm);
    }
    return all;
  })();
  function level(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function segDist(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], d = dx * dx + dy * dy || 1; var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
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
  function resolve(s, x, y) {
    if (!s || s.done) return {ok: false, reason: "done"};
    x = Math.max(5, Math.min(96, +x || 0)); y = Math.max(7, Math.min(93, +y || 0));
    var start = s.ball.slice(), turn = s.turn++, shot = s.match ? (x >= 87 && y > 26 && y < 74) : (x > 83 && y > 28 && y < 72);
    if (shot) {
      var goalTarget = Math.abs(y - 50), pressure = s.rivals.reduce(function (v, r) { return Math.min(v, dist(r, start)); }, 99);
      var lane = s.rivals.reduce(function (v, r) { return Math.min(v, segDist(r, start, [96, y])); }, 99);
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
      s.log.push({k: "shot", ok: scored, msg: msg, quality: quality, to: [x, y], lane: lane});
      return {ok: true, shot: true, scored: scored, quality: quality, msg: msg, state: s};
    }
    var target = [x, y], best = null, bd = 1e9;
    s.mates.forEach(function (m) { if (!m.open) return; var d = dist(m.p, target); if (d < bd) { bd = d; best = m; } });
    if (!best || bd > 25) {
      s.turn--; return {ok: false, reason: "target", msg: "Busca un espacio o apunta a un compañero o compañera."};
    }
    var laneDist = s.rivals.reduce(function (v, r) { return Math.min(v, segDist(r, start, best.p)); }, 99);
    var closeness = s.rivals.reduce(function (v, r) { return Math.min(v, dist(r, best.p)); }, 99);
    var qualityPass = Math.max(0.18, Math.min(0.96, 0.84 - Math.max(0, 10 - laneDist) * 0.05 - Math.max(0, 10 - closeness) * 0.025 - bd * 0.006));
    var success = noise(s.seed, turn, x, y) < qualityPass;
    if (success) {
      s.ball = best.p.slice(); best.open = false; s.chain = (s.chain || 0) + 1;
      /* tras el pase, la defensa repliega hacia el balón y el resto del equipo ofrece apoyos.
         En un momento de partido el repliegue es más corto: si no, combinar nunca compensa. */
      s.rivals = s.rivals.map(function (r, i) { var k = i === 0 ? (s.match ? 0.12 : 0.24) : (s.match ? 0.07 : 0.13); return [r[0] + (s.ball[0] - r[0]) * k, r[1] + (s.ball[1] - r[1]) * k]; });
      s.mates.forEach(function (m) { if (m !== best && m.open) { m.p[0] = Math.min(90, m.p[0] + 2.5); m.p[1] += (50 - m.p[1]) * 0.06; } });
    } else {
      s.ball = [start[0] + (best.p[0] - start[0]) * 0.56, start[1] + (best.p[1] - start[1]) * 0.56];
      var near = s.rivals.slice().sort(function (a, b) { return dist(a, s.ball) - dist(b, s.ball); })[0];
      if (near) { near[0] = s.ball[0] + 2; near[1] = s.ball[1]; }
    }
    var message = success ? "Pase completado: el equipo conserva la posesión." : "Pase interceptado. Aún puedes reaccionar si te queda otra acción.";
    s.log.push({k: "pass", ok: success, msg: message, quality: qualityPass, from: start, to: best.p.slice()});
    if (!success && s.turn >= s.max) s.done = true;
    if (s.turn >= s.max && !s.won) s.done = true;
    return {ok: true, shot: false, completed: success, quality: qualityPass, msg: message, state: s};
  }
  function result(s) { if (!s) return null; return {done: !!s.done, won: !!s.won, actions: s.turn, medal: s.won ? (s.turn <= 2 ? 3 : s.turn <= 3 ? 2 : 1) : 0}; }
  function levels() { return LEVELS.map(function (l) { return {id: l.id, chapter: l.chapter, chapterTitle: l.chapterTitle, title: l.title, goal: l.goal, max: l.max}; }); }
  return {levels: levels, level: level, chapters: CHAPTERS.slice(), fresh: fresh, moment: moment, momentAuto: momentAuto, resolve: resolve, result: result, dist: dist, segDist: segDist};
})();
