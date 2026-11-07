/* Modelos de vóxeles para los iconos de Google Play Juegos (se cargan en la página del juego desde pgs-export.cjs).
   Cada categoría de logro tiene su objeto (balón, bota, guante, medalla, micrófono…) sobre la peana del juego,
   con el metal de su rareza (bronce, plata, oro, platino). PGSModels.key(cat, rar, id) registra el modelo en GXV. */
var PGSModels = (function () {
  var PAL = GXV.PAL, BASE = "#20262b", BASE2 = "#30383e";
  function make(rar, build) {
    var V = {}, c = PAL[rar] || PAL.b;
    function put(x, y, z, col) { V[x + "," + y + "," + z] = col; }
    function box(x0, x1, y0, y1, z0, z1, col) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) put(x, y, z, col); }
    function disc(y, r, col, hollow) { for (var x = -8; x <= 8; x++) for (var z = -8; z <= 8; z++) { var d = Math.hypot(x, z); if (d <= r + 0.35 && (!hollow || d > r - 0.95)) put(x, y, z, col); } }
    /* disco vertical (plano x-y) de grosor t en z */
    function discV(cx, cy, r, col, t, hollow) { for (var x = -9; x <= 9; x++) for (var y = -9; y <= 9; y++) { var d = Math.hypot(x, y); if (d <= r + 0.35 && (!hollow || d > r - 1.1)) for (var z = 0; z < (t || 1); z++) put(cx + x, cy + y, z - ((t || 1) >> 1), col); } }
    function sphere(cy, r, colFn) { for (var x = -8; x <= 8; x++) for (var y = -8; y <= 8; y++) for (var z = -8; z <= 8; z++) if (Math.hypot(x, y, z) <= r + 0.3) put(x, cy + y, z, colFn(x, y, z)); }
    /* peana del juego con la franja de la rareza */
    box(-4, 4, 0, 0, -4, 4, BASE); box(-3, 3, 1, 1, -3, 3, BASE2); box(-3, 3, 2, 2, -3, 3, c[0]); box(-3, 3, 3, 3, -3, 3, BASE);
    build({put: put, box: box, disc: disc, discV: discV, sphere: sphere, c: c, rar: rar});
    return V;
  }
  var WHITE = "#f2f4f5", DARK = "#1c2226", GREY = "#8b969b", RED = "#d8423a", BLUE = "#2f7fd8", GREEN = "#3fae5a", SKIN = "#e0b48a";
  var M = {
    /* copa clásica: la del juego */
    cup: null,
    ball: function (m) { m.sphere(9, 4.6, function (x, y, z) { var a = Math.abs(x) + Math.abs(y - 0) + Math.abs(z); return (Math.round(x / 2.3) + Math.round(y / 2.3) + Math.round(z / 2.3)) % 2 ? m.c[1] : WHITE; }); m.disc(4, 1.6, m.c[0]); },
    boot: function (m) {
      m.box(-1, 1, 4, 4, -2, 2, m.c[0]); /* soporte */
      m.box(-4, 4, 5, 6, -1, 1, m.c[1]); m.box(-4, -1, 7, 11, -1, 1, m.c[1]); m.box(0, 4, 7, 7, -1, 1, m.c[1]); m.box(4, 5, 5, 6, -1, 1, m.c[2]);
      m.box(-4, -1, 12, 12, -1, 1, m.c[2]); [[-3, 5], [0, 5], [3, 5]].forEach(function (p) { m.put(p[0], 4, 0, DARK); });
      for (var y = 8; y <= 11; y += 1) m.put(0, y - 1, 0, WHITE); m.box(-1, 3, 8, 8, 0, 0, WHITE);
    },
    glove: function (m) {
      m.box(-2, 2, 4, 6, -1, 1, m.c[0]); m.box(-3, 3, 7, 11, -1, 1, m.c[1]);
      [-3, -1, 1, 3].forEach(function (x, i) { m.box(x, x, 12, 14 + (i === 1 || i === 2 ? 1 : 0), -1, 1, m.c[1]); m.put(x, 15 + (i === 1 || i === 2 ? 1 : 0), 0, m.c[2]); });
      m.box(4, 5, 8, 10, -1, 1, m.c[1]); m.box(-3, 3, 9, 9, -1, -1, m.c[2]); m.box(-2, 2, 6, 6, -2, 2, WHITE);
    },
    medal: function (m) {
      m.box(-1, 1, 4, 5, -1, 1, m.c[0]);
      for (var k = 0; k < 6; k++) { m.put(-3 + k * 0.5 | 0, 16 - k, 0, RED); m.put(3 - (k * 0.5 | 0), 16 - k, 0, BLUE); }
      m.box(-4, -3, 15, 17, 0, 0, RED); m.box(3, 4, 15, 17, 0, 0, BLUE);
      m.discV(0, 9, 4.2, m.c[1], 2); m.discV(0, 9, 4.2, m.c[0], 2, true); m.discV(0, 9, 1.5, m.c[2], 3);
    },
    shield: function (m) {
      for (var y = 5; y <= 15; y++) { var w = y >= 9 ? 4 : Math.max(0, y - 5); for (var x = -w; x <= w; x++) { var edge = Math.abs(x) === w || y === 15; m.put(x, y, 0, edge ? m.c[0] : x >= 0 && y < 13 ? m.c[1] : m.c[2]); m.put(x, y, 1, m.c[0]); } }
      m.box(-1, 1, 4, 4, -1, 1, m.c[0]);
    },
    star: function (m) {
      var cx = 0, cy = 10;
      for (var x = -6; x <= 6; x++) for (var y = -6; y <= 6; y++) {
        var a = Math.atan2(y, x), r = Math.hypot(x, y), k = Math.cos(5 * (a - Math.PI / 2)), lim = 3 + 3.2 * Math.max(0, k);
        if (r <= lim) { m.put(cx + x, cy + y, 0, r < 2.5 ? m.c[2] : m.c[1]); m.put(cx + x, cy + y, 1, m.c[0]); }
      }
      m.box(0, 0, 4, 5, 0, 0, m.c[0]);
    },
    crown: function (m) {
      m.disc(5, 4, m.c[0]); m.disc(6, 4, m.c[1], true); m.disc(7, 4, m.c[1], true);
      for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, x = Math.round(Math.cos(a) * 4), z = Math.round(Math.sin(a) * 4); m.put(x, 8, z, m.c[1]); m.put(x, 9, z, m.c[1]); if (i % 2 === 0) { m.put(x, 10, z, m.c[2]); m.put(x, 11, z, RED); } }
      m.disc(7, 4, RED, true); m.box(0, 0, 4, 4, 0, 0, m.c[0]);
    },
    mic: function (m) {
      m.box(0, 0, 4, 9, 0, 0, GREY); m.box(-1, 1, 4, 4, -1, 1, DARK);
      m.sphere(13, 2.6, function (x, y, z) { return (y + 13 + x) % 2 ? m.c[1] : m.c[2]; }); m.disc(10, 1.6, m.c[0]);
    },
    globe: function (m) {
      m.sphere(10, 4.3, function (x, y, z) { return ((x * 3 + z * 5 + y * 7) & 7) < 3 ? GREEN : BLUE; });
      for (var a = 0; a < 24; a++) { var t = a / 24 * Math.PI * 2, x = Math.round(Math.sin(t) * 5.5), y = Math.round(10 + Math.cos(t) * 5.5); if (y > 4) m.put(x, y, 0, m.c[1]); }
      m.box(0, 0, 4, 5, 0, 0, m.c[0]);
    },
    goal: function (m) {
      m.box(-6, -6, 4, 11, 0, 0, WHITE); m.box(6, 6, 4, 11, 0, 0, WHITE); m.box(-6, 6, 12, 12, 0, 0, WHITE);
      for (var x = -5; x <= 5; x++) for (var y = 4; y <= 11; y++) if ((x + y) % 2 === 0) m.put(x, y, -2, "#c9d1d4");
      m.box(-6, 6, 12, 12, -2, -1, "#c9d1d4"); m.sphere(6, 1.2, function () { return m.c[1]; });
    },
    suitcase: function (m) {
      m.box(-5, 5, 4, 11, -2, 2, m.c[1]); m.box(-5, 5, 7, 7, -2, 2, m.c[0]); m.box(-2, 2, 13, 13, 0, 0, m.c[0]); m.put(-2, 12, 0, m.c[0]); m.put(2, 12, 0, m.c[0]);
      m.box(-4, -3, 9, 10, 3, 3, RED); m.box(2, 3, 5, 6, 3, 3, BLUE); m.box(-1, 1, 9, 9, 3, 3, m.c[2]);
    },
    clipboard: function (m) {
      m.box(-4, 4, 4, 15, 0, 0, "#7a5532"); m.box(-3, 3, 5, 13, 1, 1, WHITE); m.box(-2, 2, 14, 16, 1, 1, m.c[1]);
      [7, 9, 11].forEach(function (y) { m.box(-2, 2, y, y, 2, 2, GREY); }); m.put(-2, 12, 2, m.c[0]); m.put(1, 8, 2, RED); m.put(-1, 10, 2, RED);
    },
    gamepad: function (m) {
      m.box(-6, 6, 7, 10, -1, 1, m.c[1]); m.box(-7, -4, 5, 8, -1, 1, m.c[1]); m.box(4, 7, 5, 8, -1, 1, m.c[1]);
      m.box(-5, -3, 9, 9, 2, 2, DARK); m.box(-4, -4, 8, 10, 2, 2, DARK); m.put(3, 10, 2, RED); m.put(5, 9, 2, BLUE); m.put(4, 8, 2, GREEN); m.put(4, 10, 2, m.c[2]);
      m.box(0, 0, 4, 6, 0, 0, m.c[0]);
    },
    paw: function (m) {
      m.discV(0, 8, 3, m.c[1], 2); [[-5, 13], [-2, 16], [2, 16], [5, 13]].forEach(function (p) { m.discV(p[0], p[1], 1.4, m.c[2], 2); });
      m.box(0, 0, 4, 5, 0, 0, m.c[0]);
    },
    ballot: function (m) {
      m.box(-4, 4, 4, 10, -3, 3, m.c[1]); m.box(-4, 4, 11, 11, -3, 3, m.c[0]); m.box(-2, 2, 11, 11, 0, 0, DARK);
      m.box(-1, 1, 12, 15, 0, 0, WHITE); m.put(0, 14, 1, RED); m.box(-3, 3, 7, 7, 4, 4, m.c[2]);
    },
    plaque: function (m) {
      m.box(-5, 5, 4, 14, 0, 1, "#3a2a1c"); m.box(-4, 4, 5, 13, 2, 2, m.c[1]); m.box(-3, 3, 11, 12, 3, 3, m.c[2]); m.discV(0, 8, 2, m.c[0], 1);
      for (var x = -3; x <= 3; x++) m.put(x, 8, 3, m.c[2]);
    },
    flag: function (m) {
      m.box(-5, -5, 4, 16, 0, 0, GREY); m.put(-5, 17, 0, m.c[2]);
      for (var x = -4; x <= 4; x++) for (var y = 11; y <= 16; y++) m.put(x, y + (x % 3 === 0 ? 0 : 0), 0, y >= 15 ? m.c[2] : y >= 13 ? m.c[1] : m.c[0]);
    },
    whistle: function (m) {
      m.box(-3, 3, 7, 10, -2, 2, m.c[1]); m.box(4, 7, 9, 10, -1, 1, m.c[1]); m.disc(11, 1.5, m.c[0]); m.box(-1, 1, 11, 13, 0, 0, RED); m.box(-2, 2, 14, 14, 0, 0, RED);
      m.box(0, 0, 4, 6, 0, 0, m.c[0]); m.box(-2, -1, 8, 9, 3, 3, DARK);
    },
    calendar: function (m) {
      m.box(-5, 5, 4, 14, 0, 1, WHITE); m.box(-5, 5, 13, 15, 0, 1, RED); m.put(-3, 16, 0, GREY); m.put(3, 16, 0, GREY);
      for (var x = -4; x <= 4; x += 2) for (var y = 5; y <= 11; y += 2) m.put(x, y, 2, (x + y) % 4 ? GREY : m.c[1]);
    }
  };
  var BY_CAT = {goals: ["ball"], play: ["boot"], gk: ["glove"], sp: ["goal"], career: ["suitcase", "calendar"], nat: ["globe", "flag"], awards: ["medal", "star"],
    room: ["ballot"], press: ["mic"], pet: ["paw"], mgr: ["clipboard", "whistle"], mini: ["gamepad"], base: ["cup", "shield", "star", "plaque", "medal"],
    era: ["calendar", "plaque", "shield", "cup", "flag", "star"], shop: ["boot", "suitcase", "gamepad"], odd: ["star", "crown", "shield", "gamepad", "mic"]};
  var ALL = Object.keys(M);
  function pick(cat, rar, id) {
    var h = 2166136261; for (var i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } h >>>= 0;
    var list = BY_CAT[cat] || ["cup", "shield", "star", "plaque", "medal", "crown"];
    var name = list[h % list.length];
    if (rar === "p") name = "crown"; else if (rar === "g" && h % 5 === 0 && !BY_CAT[cat]) name = "crown";
    return name;
  }
  function key(cat, rar, id) {
    var name = pick(cat, rar, id);
    if (name === "cup") return rar;
    var k = "pgs:" + name + ":" + rar;
    GXV.reg(k, function () { return make(rar, M[name]); });
    return k;
  }
  return {key: key, pick: pick, names: ALL};
})();
