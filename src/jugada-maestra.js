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
  function resolve(s, x, y) {
    if (!s || s.done) return {ok: false, reason: "done"};
    x = Math.max(5, Math.min(96, +x || 0)); y = Math.max(7, Math.min(93, +y || 0));
    var start = s.ball.slice(), turn = s.turn++, shot = x > 83 && y > 28 && y < 72;
    if (shot) {
      var goalTarget = Math.abs(y - 50), pressure = s.rivals.reduce(function (v, r) { return Math.min(v, dist(r, start)); }, 99);
      var lane = s.rivals.reduce(function (v, r) { return Math.min(v, segDist(r, start, [96, y])); }, 99);
      var quality = Math.max(0.13, Math.min(0.91, 0.82 - goalTarget * 0.012 - Math.max(0, 18 - lane) * 0.018 - Math.max(0, 15 - pressure) * 0.009));
      var scored = noise(s.seed, turn, x, y) < quality;
      s.done = true; s.won = scored; s.ball = [95, y];
      var msg = scored ? "¡Gol! La jugada termina en la red." : lane < 9 ? "La defensa tapa el disparo. Busca primero una línea de tiro." : "El portero llega a tu disparo. Prueba con más espacio o cambia el ángulo.";
      s.log.push({k: "shot", ok: scored, msg: msg, quality: quality});
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
      s.ball = best.p.slice(); best.open = false;
      /* tras el pase, la defensa repliega hacia el balón y el resto del equipo ofrece apoyos. */
      s.rivals = s.rivals.map(function (r, i) { var k = i === 0 ? 0.24 : 0.13; return [r[0] + (s.ball[0] - r[0]) * k, r[1] + (s.ball[1] - r[1]) * k]; });
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
  return {levels: levels, level: level, chapters: CHAPTERS.slice(), fresh: fresh, resolve: resolve, result: result, dist: dist, segDist: segDist};
})();
