/* pixel.js — dirección de arte 2D en pixel art (versión 5.4).
   Sustituye las caras, trofeos, escudos y camisetas vectoriales por sprites de píxeles, y convierte
   los emojis de interfaz más usados en iconos pixelados. Todo se dibuja en SVG con <rect> nítidos
   (shape-rendering crispEdges): no hay imágenes externas ni lienzos, funciona sin conexión.
   Estilo: siluetas compactas, colores planos con una sombra y un brillo, personajes sin rasgos
   faciales (como las figuras de 8 bits). Nada reproduce trofeos, escudos ni personajes reales. */
var PX = (function () {
  "use strict";
  /* ---------- color ---------- */
  function hex2(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? "0" : "") + n.toString(16); }
  function rgbOf(c) {
    c = String(c || "#888");
    var m;
    if (c.charAt(0) === "#") {
      var x = c.length < 6 ? c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3) : c.substr(1, 6);
      return [parseInt(x.substr(0, 2), 16), parseInt(x.substr(2, 2), 16), parseInt(x.substr(4, 2), 16)];
    }
    if ((m = /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/.exec(c))) {
      var h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      var f = function (t) { t = t < 0 ? t + 1 : t > 1 ? t - 1 : t; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
      return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
    }
    if ((m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(c))) return [+m[1], +m[2], +m[3]];
    return [136, 136, 136];
  }
  function toHex(r) { return "#" + hex2(r[0]) + hex2(r[1]) + hex2(r[2]); }
  function shade(c, k) { var r = rgbOf(c); return toHex([r[0] * k, r[1] * k, r[2] * k]); }
  function mixc(a, b, k) { var x = rgbOf(a), y = rgbOf(b); return toHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]); }
  function lum(c) { var r = rgbOf(c); return (0.299 * r[0] + 0.587 * r[1] + 0.114 * r[2]) / 255; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---------- lienzo de píxeles → SVG ---------- */
  function Grid(w, h) { this.w = w; this.h = h; this.p = new Array(w * h); }
  Grid.prototype.set = function (x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) this.p[y * this.w + x] = c; };
  Grid.prototype.get = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.p[y * this.w + x] : null; };
  Grid.prototype.rect = function (x0, y0, x1, y1, c) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.set(x, y, c); };
  /* dibuja una plantilla de caracteres con una paleta */
  Grid.prototype.stamp = function (rows, pal, ox, oy) {
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y].charAt(x);
      if (ch !== "." && ch !== " " && pal[ch]) this.set((ox || 0) + x, (oy || 0) + y, pal[ch]);
    }
    return this;
  };
  /* contorno de 1 px alrededor de lo opaco */
  Grid.prototype.outline = function (c) {
    var add = [];
    for (var y = 0; y < this.h; y++) for (var x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(x, y);
    }
    for (var i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], c);
    return this;
  };
  Grid.prototype.svg = function (W, H, cls, label, style) {
    var out = "";
    for (var y = 0; y < this.h; y++) {
      var x = 0;
      while (x < this.w) {
        var c = this.p[y * this.w + x];
        if (!c) { x++; continue; }
        var x0 = x; while (x < this.w && this.p[y * this.w + x] === c) x++;
        out += '<rect x="' + x0 + '" y="' + y + '" width="' + (x - x0) + '" height="1" fill="' + c + '"/>';
      }
    }
    return '<svg class="' + (cls || "px") + '" viewBox="0 0 ' + this.w + " " + this.h + '" width="' + W + '" height="' + H +
      '" shape-rendering="crispEdges"' + (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true" focusable="false"') +
      (style ? ' style="' + style + '"' : "") + ">" + out + "</svg>";
  };

  /* ---------- tipografía 3×5 para escudos ---------- */
  var FONT = {
    A: [".#.", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."], C: [".##", "#..", "#..", "#..", ".##"],
    D: ["##.", "#.#", "#.#", "#.#", "##."], E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."],
    G: [".##", "#..", "#.#", "#.#", ".##"], H: ["#.#", "#.#", "###", "#.#", "#.#"], I: ["###", ".#.", ".#.", ".#.", "###"],
    J: ["..#", "..#", "..#", "#.#", ".#."], K: ["#.#", "#.#", "##.", "#.#", "#.#"], L: ["#..", "#..", "#..", "#..", "###"],
    M: ["#.#", "###", "###", "#.#", "#.#"], N: ["##.", "#.#", "#.#", "#.#", "#.#"], O: [".#.", "#.#", "#.#", "#.#", ".#."],
    P: ["##.", "#.#", "##.", "#..", "#.."], Q: [".#.", "#.#", "#.#", "##.", ".##"], R: ["##.", "#.#", "##.", "#.#", "#.#"],
    S: [".##", "#..", ".#.", "..#", "##."], T: ["###", ".#.", ".#.", ".#.", ".#."], U: ["#.#", "#.#", "#.#", "#.#", "###"],
    V: ["#.#", "#.#", "#.#", "#.#", ".#."], W: ["#.#", "#.#", "###", "###", "#.#"], X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
    Y: ["#.#", "#.#", ".#.", ".#.", ".#."], Z: ["###", "..#", ".#.", "#..", "###"],
    "0": ["###", "#.#", "#.#", "#.#", "###"], "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"],
    "3": ["##.", "..#", ".#.", "..#", "##."], "4": ["#.#", "#.#", "###", "..#", "..#"], "5": ["###", "#..", "##.", "..#", "##."],
    "6": [".##", "#..", "###", "#.#", "###"], "7": ["###", "..#", ".#.", ".#.", ".#."], "8": ["###", "#.#", "###", "#.#", "###"],
    "9": ["###", "#.#", "###", "..#", "##."], ".": ["...", "...", "...", "...", ".#."], "-": ["...", "...", "###", "...", "..."]
  };
  function plain(s) {
    s = String(s || "").toUpperCase();
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) { /* motores antiguos */ }
    return s.replace(/[^A-Z0-9.\-]/g, "");
  }
  function text(g, s, cx, y, c, sh) {
    s = plain(s).slice(0, 4);
    var w = s.length * 4 - 1, x = Math.round(cx - w / 2);
    for (var i = 0; i < s.length; i++) {
      var gl = FONT[s.charAt(i)]; if (!gl) continue;
      for (var r = 0; r < 5; r++) for (var k = 0; k < 3; k++) if (gl[r].charAt(k) === "#") {
        if (sh) { g.set(x + i * 4 + k + 1, y + r + 1, sh); }
      }
    }
    for (i = 0; i < s.length; i++) {
      gl = FONT[s.charAt(i)]; if (!gl) continue;
      for (r = 0; r < 5; r++) for (k = 0; k < 3; k++) if (gl[r].charAt(k) === "#") g.set(x + i * 4 + k, y + r, c);
    }
  }

  /* ---------- personajes (caras) ---------- */
  /* Retrato de busto de 18×18: cabeza cuadrada sin rasgos, pelo en bloques, cuello y camiseta. */
  var SKIN = ["#f6d2b4", "#eab38c", "#d39268", "#a96d45", "#7e4f31", "#553522"];
  function face(p, size, o) {
    var f = typeof faceOf === "function" ? faceOf(p) : null; if (!f) return "";
    o = o || {};
    var sk = SKIN[f[0]] || SKIN[1], skD = shade(sk, 0.84), skL = mixc(sk, "#ffffff", 0.18);
    var hk = (typeof FACE_HAIR !== "undefined" && FACE_HAIR[f[1]]) ? FACE_HAIR[f[1]][0] : "short";
    var hc = (typeof FACE_HAIRC !== "undefined" && FACE_HAIRC[f[2]]) || "#3b2619", hcL = mixc(hc, "#ffffff", 0.22), hcD = shade(hc, 0.75);
    var bd = (typeof FACE_BEARD !== "undefined" && FACE_BEARD[f[3]]) || "none";
    var c1 = o.c1 || "#2c6fb7", c2 = o.c2 || "#ffffff", c1D = shade(c1, 0.78);
    var g = new Grid(18, 18), H = function (x0, y0, x1, y1, c) { g.rect(x0, y0, x1, y1, c || hc); };
    /* pelo largo por detrás de la cabeza */
    if (hk === "long" || hk === "wavy") { H(4, 4, 5, hk === "wavy" ? 13 : 15); H(12, 4, 13, hk === "wavy" ? 13 : 15); }
    if (hk === "braids" || hk === "dreads") { for (var dy = 4; dy <= 15; dy++) { g.set(4, dy, dy % 2 ? hc : hcD); g.set(13, dy, dy % 2 ? hcD : hc); } g.set(5, 12, hc); g.set(12, 12, hc); }
    if (hk === "bob") { H(4, 4, 5, 11); H(12, 4, 13, 11); }
    if (hk === "pony") { H(13, 5, 14, 7); H(14, 8, 15, 11); }
    /* camiseta: hombros cuadrados, cuello en pico del color secundario */
    g.rect(2, 14, 15, 17, c1); g.rect(1, 15, 16, 17, c1);
    g.rect(1, 17, 16, 17, c1D); g.rect(2, 14, 3, 14, c1D); g.rect(14, 14, 15, 14, c1D);
    g.rect(7, 14, 10, 14, c2); g.set(8, 15, c2); g.set(9, 15, c2);
    /* cuello */
    g.rect(7, 12, 10, 13, skD); g.set(8, 14, skD); g.set(9, 14, skD);
    /* cabeza 8×8 con orejas */
    g.rect(5, 4, 12, 11, sk); g.rect(12, 4, 12, 11, skD); g.rect(6, 11, 11, 11, skD);
    g.set(4, 7, sk); g.set(4, 8, skD); g.set(13, 7, skD); g.set(13, 8, skD);
    g.set(6, 5, skL);
    /* barba */
    var bc = hc;
    if (bd === "stubble") { var st = mixc(sk, hc, 0.35); g.rect(5, 9, 12, 11, st); g.rect(6, 11, 11, 11, shade(st, 0.9)); }
    else if (bd === "short") { g.rect(5, 9, 12, 11, bc); g.rect(7, 9, 10, 9, sk); }
    else if (bd === "full") { g.rect(5, 8, 12, 12, bc); g.rect(7, 8, 10, 9, sk); g.rect(7, 12, 10, 12, hcD); }
    else if (bd === "goatee") { g.rect(7, 10, 10, 11, bc); g.rect(8, 12, 9, 12, bc); }
    else if (bd === "tache") { g.rect(6, 9, 11, 9, bc); }
    else if (bd === "chin") { g.rect(5, 10, 12, 11, bc); g.rect(7, 10, 10, 10, sk); }
    else if (bd === "chops") { g.rect(5, 6, 5, 10, bc); g.rect(12, 6, 12, 10, bc); }
    /* pelo por delante */
    switch (hk) {
      case "buzz": H(5, 3, 12, 4, mixc(hc, sk, 0.35)); break;
      case "short": H(5, 2, 12, 4); H(5, 5, 5, 6); H(12, 5, 12, 6); g.rect(6, 2, 8, 2, hcL); break;
      case "crew": H(6, 2, 11, 2); H(5, 3, 12, 4); g.rect(7, 2, 8, 2, hcL); break;
      case "side": H(5, 2, 12, 4); H(5, 5, 9, 5); H(5, 6, 5, 7); H(12, 5, 12, 6); g.rect(10, 2, 11, 2, hcL); break;
      case "quiff": H(7, 0, 11, 1); H(5, 2, 12, 4); H(5, 5, 5, 6); H(12, 5, 12, 6); g.rect(8, 0, 9, 0, hcL); break;
      case "spiky": g.set(5, 1, hc); g.set(7, 0, hc); g.set(9, 1, hc); g.set(11, 0, hc); g.set(12, 1, hc); H(5, 2, 12, 4); H(12, 5, 12, 5); break;
      case "curly": H(4, 2, 13, 4); H(5, 1, 6, 1); H(8, 1, 9, 1); H(11, 1, 12, 1); H(4, 5, 4, 7); H(13, 5, 13, 7);
        g.set(5, 3, hcL); g.set(8, 2, hcL); g.set(11, 3, hcL); g.set(6, 4, hcD); g.set(10, 4, hcD); break;
      case "afro": H(3, 1, 14, 4); H(4, 0, 13, 0); H(2, 2, 2, 8); H(15, 2, 15, 8); H(3, 5, 4, 9); H(13, 5, 14, 9);
        g.set(5, 1, hcL); g.set(9, 0, hcL); g.set(12, 2, hcL); break;
      case "mohawk": H(8, 0, 9, 3); g.rect(5, 3, 12, 4, mixc(hc, sk, 0.45)); g.rect(8, 3, 9, 4, hc); break;
      case "long": case "wavy": H(5, 2, 12, 4); H(5, 5, 5, 8); H(12, 5, 12, 8); g.rect(6, 2, 8, 2, hcL); break;
      case "bun": H(7, 0, 10, 1); H(5, 2, 12, 4); H(5, 5, 5, 6); H(12, 5, 12, 6); g.set(8, 0, hcL); break;
      case "pony": H(5, 2, 12, 4); H(5, 5, 5, 6); H(12, 5, 12, 6); g.rect(6, 2, 8, 2, hcL); break;
      case "braids": case "dreads": H(5, 2, 12, 4); H(5, 5, 5, 7); H(12, 5, 12, 7); g.set(7, 3, hcD); g.set(10, 3, hcD); break;
      case "slick": H(5, 2, 12, 4); H(12, 5, 12, 5); g.rect(6, 2, 10, 2, hcL); break;
      case "fringe": H(5, 2, 12, 5); H(5, 6, 5, 6); H(12, 6, 12, 6); g.rect(6, 2, 8, 2, hcL); break;
      case "recede": H(5, 4, 6, 6); H(11, 4, 12, 6); g.rect(7, 3, 10, 3, mixc(hc, sk, 0.6)); break;
      case "bob": H(5, 2, 12, 4); H(5, 5, 9, 5); g.rect(6, 2, 8, 2, hcL); break;
      default: g.set(7, 4, skL); g.set(8, 4, skL); break;
    }
    return g.svg(size, size, "face px");
  }

  /* ---------- trofeos ---------- */
  /* M metal (sombreado por columnas), H brillo, D metal oscuro, B franja/cinta, P peana, p peana oscura,
     G pizarra, W blanco, K negro. Cuadrícula 16×18. */
  var PLINTH = ["....PPPPPPPP....", "....BBBBBBBB....", "...PPPPPPPPPP...", "..pppppppppppp.."];
  var TRO = {
    goblet: ["................", "...MMMMMMMMMM...", ".MMMMMMMMMMMMMM.", "M..MMMMMMMMMM..M", "M..MMMMMMMMMM..M", ".M..MMMMMMMM..M.",
      "..MMMMMMMMMMMM..", "....MMMMMMMM....", ".....MMMMMM.....", "......MMMM......", ".......MM.......", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    tallcup: ["....MMMMMMMM....", "..M.MMMMMMMM.M..", ".M..MMMMMMMM..M.", ".M..MMMMMMMM..M.", ".M..MMMMMMMM..M.", "..M.MMMMMMMM.M..",
      "...MMMMMMMMMM...", ".....MMMMMM.....", "......MMMM......", ".......MM.......", ".......MM.......", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    wing: ["................", "M.....MMMM.....M", "MM...MMMMMM...MM", ".MM..MMMMMM..MM.", ".MMM.MMMMMM.MMM.", "..MMMMMMMMMMMM..",
      "...MMMMMMMMMM...", "......MMMM......", ".......MM.......", ".......MM.......", ".......MM.......", "......MMMM......",
      ".....MMMMMM.....", "....MMMMMMMM...."].concat(PLINTH),
    diamond: ["................", ".......MM.......", "......MMMM......", ".....MMHMMM.....", "....MMHMMMMM....", "...MMMMMMMMMM...",
      "..MMMMMMMMMMMM..", "...MMMMMMMMMM...", "....MMMMMMMM....", ".....MMMMMM.....", "......MMMM......", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    flame: ["................", ".......M........", "......MM....M...", ".....MMM...MM...", "....MMMM..MMM...", "....MMMMMMMMMM..",
      "...MMMMHHMMMMM..", "...MMMHHHHMMMM..", "...MMMHHHHMMM...", "....MMMHHMMMM...", ".....MMMMMMM....", "......MMMMM.....",
      ".......MM.......", "......MMMM......"].concat(PLINTH),
    cone: ["................", "..MMMMMMMMMMMM..", "..MMMMMMMMMMMM..", "...MMMMMMMMMM...", "...MMMMMMMMMM...", "....MMMMMMMM....",
      "....MMMMMMMM....", ".....MMMMMM.....", ".....MMMMMM.....", "......MMMM......", "......MMMM......", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    star: ["................", ".......MM.......", "......MMMM......", "......MMMM......", ".MMMMMMMMMMMMMM.", "..MMMMMMMMMMMM..",
      "...MMMMMMMMMM...", "....MMMMMMMM....", "...MMMMMMMMMM...", "..MMMM.MM.MMMM..", "..MM...MM...MM..", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    spire: ["................", ".......MM.......", ".......MM.......", "......MMMM......", "......MMMM......", "......MHMM......",
      ".....MMHMMM.....", ".....MMMMMM.....", ".....MMMMMM.....", "....MMMMMMMM....", "....MMMMMMMM....", "...MMMMMMMMMM...",
      "...MMMMMMMMMM...", "..MMMMMMMMMMMM.."].concat(PLINTH),
    obelisk: ["................", ".....MMMMMM.....", "....MMHMMMMM....", "...MMHMMMMMMM...", "...MMMMMMMMMM...", "...MMMMMMMMMM...",
      "....MMMMMMMM....", ".....MMMMMM.....", "....M..MM..M....", "....M..MM..M....", "....M..MM..M....", "....MMMMMMMM....",
      ".....MMMMMM.....", "....MMMMMMMM...."].concat(PLINTH),
    ring: ["................", ".....MMMMMM.....", "....MMMMMMMM....", "...MMM....MMM...", "...MM......MM...", "...MM......MM...",
      "...MM......MM...", "...MMM....MMM...", "....MMMMMMMM....", ".....MMMMMM.....", ".......MM.......", ".......MM.......",
      "......MMMM......", ".....MMMMMM....."].concat(PLINTH),
    medal: ["................", "...BBB....BBB...", "...BBBB..BBBB...", "....BBBBBBBB....", ".....BBBBBB.....", "......BBBB......",
      ".....MMMMMM.....", "....MMMMMMMM....", "...MMMMMMMMMM...", "...MMMMDDMMMM...", "...MMMDDDDMMM...", "...MMMMDDMMMM...",
      "...MMMMMMMMMM...", "....MMMMMMMM....", ".....MMMMMM.....", "................", "................", "................"],
    ball: ["................", ".....MMMMMM.....", "....MMDDMMMM....", "...MMDDDDMMMM...", "...MMMDDMMMDM...", "...MDMMMMMMDD...",
      "...MDDMMMMMMM...", "....MMMMDMMM....", ".....MMDDDM.....", "......MMMM......", ".......MM.......", "......MMMM......",
      ".....MMMMMM.....", "....MMMMMMMM...."].concat(PLINTH),
    glove: ["................", "....M.M.M.......", "...MM.M.M.M.....", "...MM.M.M.M.....", "...MMMMMMMM.....", "...MMMMMMMM.MM..",
      "...MMMMMMMMMMM..", "...MMMMMMMMMM...", "...MMMMMMMMM....", "....MMMMMMM.....", "....DDDDDDD.....", ".....MMMMM......",
      "......MMM.......", ".....MMMMM......"].concat(PLINTH),
    boot: ["................", "................", "....MMMM........", "....MMMM........", "....MMMM........", "....MMMMM.......",
      "....MMMMMM......", "....MMMMMMMMMM..", "...MMMMMMMMMMMM.", "...MMMMMMMMMMMM.", "...DDDDDDDDDDDD.", "....D..D..D.....",
      ".......MM.......", "......MMMM......"].concat(PLINTH),
    laurel: ["................", "...M........M...", "..MM........MM..", ".MM.M......M.MM.", ".MM..........MM.", "MM.M........M.MM",
      "MM............MM", ".MM.M......M.MM.", ".MM..........MM.", "..MMM......MMM..", "...MMMM..MMMM...", ".....MMMMMM.....",
      ".......MM.......", "......MMMM......"].concat(PLINTH),
    board: ["................", ".MMMMMMMMMMMMMM.", ".MGGGGGGWGGGGGM.", ".MGWGGGGWGGGGGM.", ".MGGWGGWWWGGGGM.", ".MGGGGWGWGWGGGM.",
      ".MGGGGGWWWGGKGM.", ".MGGGGGGWGGGGGM.", ".MGGGGGGWGGGGGM.", ".MMMMMMMMMMMMMM.", "....M......M....", "....M......M....",
      "...M........M...", "...M........M..."].concat(PLINTH),
    shield: ["................", "..MMMMMMMMMMMM..", "..MBBBBBBBBBBM..", "..MBBBBBBBBBBM..", "..MMMMMMMMMMMM..", "..MMMMMMMMMMMM..",
      "..MMMMMHHMMMMM..", "..MMMMHHHHMMMM..", "..MMMMMHHMMMMM..", "...MMMMMMMMMM...", "....MMMMMMMM....", ".....MMMMMM.....",
      "......MMMM......", ".......MM......."].concat(PLINTH)
  };
  var METAL = {
    gold: ["#7a561a", "#d9a93c", "#fff4c4", "#f2cf63", "#a87a22"], silver: ["#56626a", "#b6c2c8", "#ffffff", "#dfe7ea", "#7d8a91"],
    bronze: ["#5c371a", "#b67a45", "#f6cda3", "#d99a63", "#86532a"], rose: ["#7a3f34", "#d98e7c", "#ffe3da", "#f0b3a2", "#a5594b"],
    teal: ["#164a44", "#3fb59c", "#d2fff4", "#5fe0c4", "#23705f"], iron: ["#2c3437", "#6f7b7f", "#c3ccd0", "#8b979b", "#454f53"]
  };
  function hashS(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  /* forma y metal de un trofeo; sin mundo cargado (web, ranking) las ligas y copas se deducen del prefijo */
  var KEY_ALIAS = {glove: "yashin", tglove: "yashin", bestgk: "best", gkxi: "xi", ast: "asist"};
  function specOf(key) {
    key = String(key || ""); key = KEY_ALIAS[key] || key;
    var pre = /^(L|CUP|SC):(.*)$/.exec(key);
    if (pre && (typeof W === "undefined" || !W || !W.lgIdx)) {
      var hue = "hsl(" + (hashS(pre[2]) % 360) + ",62%,46%)";
      return pre[1] === "L" ? ["shield", "gold", hue] : pre[1] === "CUP" ? ["goblet", "silver", hue] : ["cone", "bronze", hue];
    }
    if (typeof trophySpec === "function") { try { return trophySpec(key); } catch (e) { /* sin datos del mundo */ } }
    return ["goblet", "gold"];
  }
  /* Deduce la clave de icono a partir del nombre (entradas antiguas del ranking sin claves). */
  function guessKey(name, individual) {
    var n = String(name || "");
    if (individual) {
      if (/Bal[oó]n de Oro del|Golden Ball/i.test(n)) return "tball";
      if (/º en el Bal|place in the Ball/i.test(n)) return "bdo_pod";
      if (/Bal[oó]n de Oro|Ballon d|Ballon/i.test(n)) return "bdo";
      if (/Bota de Oro|Golden Boot|Soulier/i.test(n)) return "boot";
      if (/Guante de Oro|Golden Glove|Yashin/i.test(n)) return "yashin";
      if (/Zamora|menos goleado/i.test(n)) return "zamora";
      if (/Golden Boy/i.test(n)) return "goldenboy";
      if (/Kopa/i.test(n)) return "kopa";
      if (/The Best/i.test(n)) return "best";
      if (/FIFPRO|Once Mundial/i.test(n)) return "xi";
      if (/M[aá]ximo goleador|Pichichi|top scorer/i.test(n)) return "pichichi";
      if (/asistente|assist/i.test(n)) return "asist";
      if (/joven|young/i.test(n)) return "young";
      if (/Entrenador del mes|Manager of the month/i.test(n)) return "mgr_month";
      if (/del mes|of the month/i.test(n)) return "pom";
      if (/entrenador del a[nñ]o|manager of the year/i.test(n)) return "mgr_year";
      if (/entrenador|manager|coach/i.test(n)) return "mgr_lg";
      if (/Equipo de la temporada|Team of the season/i.test(n)) return "tots";
      return "mvp";
    }
    if (/Champions|Campeones de Europa/i.test(n)) return "UCL";
    if (/Europa League|Liga Europa/i.test(n)) return "UEL";
    if (/Conference/i.test(n)) return "UECL";
    if (/Libertadores/i.test(n)) return "LIB";
    if (/Sudamericana/i.test(n)) return "SUD";
    if (/Mundial de Clubes|Club World/i.test(n)) return "CWC";
    if (/Intercontinental/i.test(n)) return "ICC";
    if (/Supercopa de Europa|UEFA Super/i.test(n)) return "USC";
    if (/Mundial|Copa del Mundo|World Cup/i.test(n)) return "WC";
    if (/Eurocopa|\bEuro\b|European Championship/i.test(n)) return "EURO";
    if (/Copa Am[eé]rica/i.test(n)) return "CA";
    if (/[ÁA]frica/i.test(n)) return "AFCON";
    if (/Copa Asi|Asian Cup/i.test(n)) return "ASIAN";
    if (/Liga de Campeones de la AFC|AFC Champions/i.test(n)) return "ACL";
    if (/Copa Oro|Gold Cup/i.test(n)) return "GOLD";
    if (/Naciones|Nations/i.test(n)) return "NLF";
    if (/Ol[ií]mpic|Olympic/i.test(n)) return "OLY";
    if (/Concacaf/i.test(n)) return "CCC";
    if (/Supercopa|Super ?Cup|Supercoppa|Supercup|Troph[eé]e des|Community Shield|Supertaça/i.test(n)) return "SC:" + n;
    if (/Copa|Cup|Coppa|Pokal|Coupe|Ta[çc]a|Beker|Trophy/i.test(n)) return "CUP:" + n;
    return "L:" + n;
  }
  /* Palmarés agregado de un historial de carrera: [{name, key, n, years, ind}] colectivos primero. */
  function honours(history) {
    var map = {}, out = [];
    (history || []).forEach(function (row) {
      [["trophies", "trophy_keys", false], ["awards", "award_keys", true]].forEach(function (f) {
        var names = row[f[0]] || [], keys = row[f[1]] || [];
        names.forEach(function (nm, i) {
          var ind = f[2], base = ind ? String(nm).replace(/\s*\([^)]*\)\s*$/, "").replace(/\s+\d{4}(\/\d{2})?$/, "") : String(nm);
          var key = typeof keys[i] === "string" && keys[i] ? keys[i] : guessKey(nm, ind), id = (ind ? "i|" : "t|") + base;
          if (!map[id]) { map[id] = {name: base, key: key, n: 0, years: [], ind: ind}; out.push(map[id]); }
          map[id].n++; if (row.season != null) map[id].years.push(row.season);
        });
      });
    });
    var rank = function (h) { var sp = specOf(h.key), w = {gold: 0, silver: 1, rose: 2, teal: 2, bronze: 3, iron: 4}[sp[1]]; return (w == null ? 3 : w); };
    return out.sort(function (a, b) { return (a.ind - b.ind) || (rank(a) - rank(b)) || (b.n - a.n) || (a.name < b.name ? -1 : 1); });
  }
  function trophy(key, size, label) {
    var sp = specOf(key);
    var rows = TRO[sp[0]] || TRO.goblet, m = METAL[sp[1]] || METAL.gold;
    var band = sp[2] || (sp[0] === "medal" ? "#c8322d" : m[4]);
    var g = new Grid(16, 18), pal = {H: m[2], D: m[4], B: band, P: "#2f4a52", p: "#172a30", G: "#1f5a3a", W: "#f4f6f2", K: "#1b1b24"};
    g.stamp(rows, pal);
    /* metal: sombreado por tramos de cada fila (borde oscuro, brillo a la izquierda del centro) */
    for (var y = 0; y < rows.length; y++) {
      var r = rows[y], x = 0;
      while (x < 16) {
        if (r.charAt(x) !== "M") { x++; continue; }
        var x0 = x; while (x < 16 && r.charAt(x) === "M") x++;
        var n = x - x0;
        for (var k = 0; k < n; k++) {
          var t = n === 1 ? 0.5 : k / (n - 1), c;
          if (n <= 2) c = k === 0 ? m[3] : m[4];
          else if (t < 0.12) c = m[4];
          else if (t < 0.3) c = m[3];
          else if (t < 0.45) c = m[2];
          else if (t < 0.8) c = m[1];
          else c = m[4];
          g.set(x0 + k, y, c);
        }
      }
    }
    return g.svg(size || 48, size || 48, "tro px", label, null);
  }

  /* ---------- escudos ---------- */
  var CW = 20, CH = 22;
  function inShape(shape, x, y) {
    var u = (x + 0.5) / CW, v = (y + 0.5) / CH, du = u - 0.5, dv;
    switch (shape) {
      case "round": case "ring": case "ball": dv = v - 0.5; return du * du + dv * dv * 0.79 <= 0.205;
      case "oval": dv = v - 0.5; return du * du / 0.2 + dv * dv / 0.25 <= 1;
      case "diamond": return Math.abs(du) * 1.05 + Math.abs(v - 0.5) * 0.92 <= 0.5;
      case "hexagon": return Math.abs(du) <= 0.46 && Math.abs(v - 0.5) <= 0.47 - Math.max(0, Math.abs(du) - 0.22) * 0.9;
      case "octagon": return Math.abs(du) <= 0.47 && Math.abs(v - 0.5) <= 0.47 && Math.abs(du) + Math.abs(v - 0.5) <= 0.7;
      case "pennant": return v >= 0.06 && Math.abs(du) <= 0.46 * (1 - Math.max(0, v - 0.28) / 0.72) + 0.02;
      case "square": return Math.abs(du) <= 0.46 && Math.abs(v - 0.5) <= 0.45 && !(Math.abs(du) > 0.38 && Math.abs(v - 0.5) > 0.37);
      case "pointed": return v >= 0.06 && Math.abs(du) <= (v < 0.45 ? 0.46 : 0.46 * (1 - (v - 0.45) / 0.55));
      case "french": return v >= 0.06 && Math.abs(du) <= 0.46 && (v < 0.78 || Math.abs(du) <= 0.46 - (v - 0.78) * 1.4 || (Math.abs(du) < 0.06));
      case "rounded": dv = v - 0.55; return v >= 0.06 && Math.abs(du) <= 0.46 && (v < 0.55 || du * du + dv * dv * 1.6 <= 0.205);
      case "crown": if (v < 0.22) return v > 0.06 && (Math.abs(du) > 0.3 || Math.abs(du) < 0.07) && Math.abs(du) <= 0.42; return v >= 0.22 && shieldAt(du, (v - 0.22) / 0.78);
      case "star": if (v < 0.2) return Math.abs(du) < 0.1 && v > 0.02; return shieldAt(du, (v - 0.2) / 0.8);
      case "tab": if (v < 0.14) return v > 0.02 && (Math.abs(du) > 0.33 || Math.abs(du) < 0.08) && Math.abs(du) <= 0.46; return shieldAt(du, (v - 0.1) / 0.9);
      default: return v >= 0.06 && shieldAt(du, (v - 0.06) / 0.94);
    }
  }
  function shieldAt(du, v) {
    if (v < 0 || v > 1) return false;
    if (v < 0.5) return Math.abs(du) <= 0.46;
    var k = (v - 0.5) / 0.5; return Math.abs(du) <= 0.46 * Math.sqrt(Math.max(0, 1 - k * k)) + 0.02;
  }
  function patAt(p, x, y) {
    var u = (x + 0.5) / CW, v = (y + 0.5) / CH;
    switch (p) {
      case "stripes": return Math.floor(x / 2) % 2 === 1;
      case "band": return v > 0.38 && v < 0.62;
      case "halves": return u >= 0.5;
      case "quarters": return (u >= 0.5) !== (v >= 0.48);
      case "sash": return Math.abs((u - 0.5) - (v - 0.5) * 0.9) < 0.12;
      case "chevron": return Math.abs(v - 0.62 + Math.abs(u - 0.5) * 0.9) < 0.1;
      case "hoops": return Math.floor(y / 2) % 2 === 1;
      case "cross": return Math.abs(u - 0.5) < 0.1 || Math.abs(v - 0.45) < 0.09;
      case "chief": return v < 0.32;
      default: return false;
    }
  }
  function crest(o) {
    o = o || {};
    var c = o.col || [], c0 = typeof c[0] === "string" ? c[0] : "#556066", c1 = typeof c[1] === "string" ? c[1] : "#f4f4f4";
    var big = !!o.big, w = big ? 34 : 22, h = big ? 39 : 25, shape = o.shape || "shield", pat = o.pat || "plain";
    var g = new Grid(CW + 2, CH + 2), x, y, inside = [];
    for (y = 0; y < CH; y++) for (x = 0; x < CW; x++) if (inShape(shape, x, y)) {
      var col = patAt(pat, x, y) ? c1 : c0;
      if (pat === "border") { var edge = !inShape(shape, x - 2, y) || !inShape(shape, x + 2, y) || !inShape(shape, x, y - 2) || !inShape(shape, x, y + 2); col = edge ? c1 : c0; }
      g.set(x + 1, y + 1, col); inside.push(x, y);
    }
    /* sombra en el lado derecho e inferior, brillo arriba a la izquierda */
    for (var i = 0; i < inside.length; i += 2) {
      x = inside[i]; y = inside[i + 1];
      var cc = g.get(x + 1, y + 1);
      if (!inShape(shape, x + 1, y) || !inShape(shape, x, y + 1)) g.set(x + 1, y + 1, shade(cc, 0.8));
      else if (!inShape(shape, x - 1, y) || !inShape(shape, x, y - 1)) g.set(x + 1, y + 1, mixc(cc, "#ffffff", 0.22));
    }
    if (shape === "ring") for (i = 0; i < inside.length; i += 2) { x = inside[i]; y = inside[i + 1]; var du = (x + 0.5) / CW - 0.5, dv = (y + 0.5) / CH - 0.5; if (du * du + dv * dv * 0.79 > 0.13 && du * du + dv * dv * 0.79 < 0.165) g.set(x + 1, y + 1, c1); }
    if (shape === "star") { g.rect(10, 1, 11, 1, "#f5c84a"); g.rect(8, 2, 13, 2, "#f5c84a"); g.rect(9, 3, 12, 3, "#f5c84a"); g.rect(10, 4, 11, 4, "#c9962a"); }
    if (shape === "crown") { for (x = 1; x <= CW; x++) for (y = 1; y <= 4; y++) if (g.get(x, y)) g.set(x, y, "#f2c54a"); }
    if (shape === "quartered") { for (var qy = 2; qy <= 8; qy++) for (var qx = 1; qx <= CW; qx++) if (g.get(qx, qy)) g.set(qx, qy, qx <= CW / 2 ? c1 : c0); }
    if (shape === "ball") { g.rect(10, 4, 11, 5, "#1b1b24"); g.set(5, 7, "#1b1b24"); g.set(16, 7, "#1b1b24"); g.set(6, 17, "#1b1b24"); g.set(15, 17, "#1b1b24"); }
    g.outline("#151a1e");
    var ab = String(o.ab == null ? "" : o.ab);
    if (plain(ab)) {
      /* texto pixelado: color con mejor contraste sobre el fondo del centro */
      var under = patAt(pat, 10, 11) ? c1 : c0, ink = lum(under) > 0.6 ? "#16181c" : "#ffffff", sh = lum(under) > 0.6 ? null : "rgba(0,0,0,.45)";
      var ty = shape === "crown" || shape === "star" || shape === "tab" ? 11 : 9;
      /* placa lisa detrás del texto si el patrón lo cruza */
      var mixed = false;
      for (var tx = 3; tx < CW - 3; tx++) for (var tyy = ty; tyy < ty + 5; tyy++) if (g.get(tx + 1, tyy + 1) && (patAt(pat, tx, tyy) ? c1 : c0) !== under) mixed = true;
      if (mixed) for (tx = 2; tx < CW; tx++) for (tyy = ty; tyy <= ty + 6; tyy++) if (inShape(shape, tx - 1, tyy - 1)) g.set(tx, tyy, under);
      text(g, ab, CW / 2 + 1, ty + 1, ink, sh);
    }
    return g.svg(w, h, "crest-svg px", null, "flex:none;display:inline-block;vertical-align:middle");
  }

  /* ---------- camisetas ---------- */
  var KIT = ["...KKK....KKK...", "..KCCCKKKKCCCK..", ".KCCCCCSSCCCCCK.", "KCCCCCCCCCCCCCCK", "KCCCCCCCCCCCCCCK", "KSSKCCCCCCCCKSSK",
    ".KK.KCCCCCCK.KK.", "....KCCCCCCK....", "....KCCCCCCK....", "....KCCCCCCK....", "....KCCCCCCK....", "....KCCCCCCK....",
    "....KCCCCCCK....", "....KCCCCCCK....", "....KDDDDDDK....", "....KKKKKKKK...."];
  function kit(o) {
    o = o || {};
    var c = o.col || [], a = typeof c[0] === "string" ? c[0] : "#556066", b = typeof c[1] === "string" ? c[1] : "#f4f4f4", t = typeof c[2] === "string" ? c[2] : b;
    var big = !!o.big, w = big ? 64 : 32, g = new Grid(16, 16), p = o.pat || "plain";
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var ch = KIT[y].charAt(x); if (ch === ".") continue;
      var col = ch === "K" ? "#151a1e" : ch === "S" ? t : ch === "D" ? shade(a, 0.75) : a;
      if (ch === "C") {
        var alt = false;
        if (p === "stripes") alt = Math.floor((x - 1) / 2) % 2 === 1;
        else if (p === "pinstripes") alt = x % 3 === 0;
        else if (p === "hoops") alt = Math.floor((y - 1) / 2) % 2 === 1;
        else if (p === "halves") alt = x >= 8;
        else if (p === "sash") alt = Math.abs((x - 4) - y * 0.6) < 1.2;
        else if (p === "diagonal") alt = x + y > 16;
        else if (p === "band") alt = y >= 6 && y <= 7;
        else if (p === "quarters") alt = (x >= 8) !== (y >= 7);
        else if (p === "sleeves") alt = x <= 3 || x >= 12;
        else if (p === "gradient") alt = y >= 9;
        if (alt) col = b;
        if (p === "gradient" && y >= 6 && y < 9) col = mixc(a, b, (y - 5) / 4);
        if (x === 13 || x === 10 && y > 5) col = shade(col, 0.86);
      }
      g.set(x, y, col);
    }
    return g.svg(w, w, "kit-svg px", null, "flex:none;display:inline-block;vertical-align:middle");
  }

  /* ---------- iconos (emoji → sprite 12×12) ---------- */
  var PAL = {K: "#1b1b24", W: "#ffffff", w: "#d8dde3", g: "#8a929c", G: "#4a5260", R: "#e2403a", r: "#9e2422", O: "#f08a24", o: "#b3561a",
    Y: "#f6c83a", y: "#c08a1c", L: "#ffe98a", N: "#4cb84a", n: "#2a7a32", B: "#3a7ad8", b: "#23468e", C: "#6fd0f0", P: "#a05ad0",
    p: "#6a3494", S: "#f2c09a", s: "#c88a62", T: "#8a5a34", t: "#5a3a20", M: "#f070a8", m: "#c04a7e"};
  function swap(rows, map) { return rows.map(function (r) { return r.replace(/[A-Za-z]/g, function (ch) { return map[ch] || ch; }); }); }
  var HEART = ["............", ".XXX....XXX.", "XLXXX..XXXXX", "XLXXXXXXXXXX", "XXXXXXXXXXXX", "XXXXXXXXXXXd", ".XXXXXXXXXd.",
    "..XXXXXXXd..", "...XXXXXd...", "....XXXd....", ".....Xd.....", "............"];
  function heart(c, l, d) { return {rows: HEART, pal: {X: c, L: l, d: d}}; }
  var MEDAL = ["..B......R..", "..BB....RR..", "...BB..RR...", "....BBRR....", ".....XX.....", "....XXXX....", "...XXLXXX...",
    "...XLXXXd...", "...XXXXXd...", "....XXdd....", ".....dd.....", "............"];
  var STAR = ["............", ".....XX.....", ".....XX.....", "....XXXX....", "XXXXXXXXXXXX", ".XXXXXXXXXX.", "..XXXXXXXX..",
    "...XXXXXX...", "...XXXXXX...", "..XXX..XXX..", "..XX....XX..", "............"];
  var CARD = ["............", "...XXXXXX...", "...XLXXXX...", "...XXXXXX...", "...XXXXXX...", "...XXXXXX...", "...XXXXXX...",
    "...XXXXXX...", "...XXXXXX...", "...XXXXXd...", "...dddddd...", "............"];
  var DOT = ["............", "....XXXX....", "..XXXXXXXX..", "..XLLXXXXX..", ".XXLXXXXXXX.", ".XXXXXXXXXX.", ".XXXXXXXXXX.",
    ".XXXXXXXXXd.", "..XXXXXXXd..", "..XXXXXXdd..", "....dddd....", "............"];
  var HAND = ["............", "....S.S.....", "...SS.SS.S..", "...SS.SS.SS.", ".S.SSSSSSSS.", ".SSSSSSSSSS.", "..SSSSSSSSS.",
    "..SSSSSSSS..", "...SSSSSS...", "....sssss...", "............", "............"];
  var CROSS = ["............", ".wwwwwwwwww.", ".wwwwRRwwww.", ".wwwwRRwwww.", ".wwRRRRRRww.", ".wwRRRRRRww.", ".wwwwRRwwww.",
    ".wwwwRRwwww.", ".wwwwwwwwww.", ".gggggggggg.", "............", "............"];
  var ICONS = {
    "⚽": ["....gggg....", "..ggWWWWgg..", ".gWWWKKWWWg.", ".gWWKKKKWWg.", "gKWWKKKKWWKg", "gKKWWKKWWKKg", "gKWWWWWWWWKg",
      "gWWWWWWWWWWg", ".gWWKWWKWWg.", ".gWKKWWKKWg.", "..ggWWWWgg..", "....gggg...."],
    "🏆": ["..LYYYYYYy..", "YYLYYYYYYyYY", "Y.LYYYYYYy.Y", "Y.LYYYYYYy.Y", ".YLYYYYYYyY.", "..YYYYYYyy..", "....YYyy....",
      ".....Yy.....", ".....Yy.....", "....YYyy....", "..TTTTTTTT..", "..tttttttt.."],
    "🔥": [".....R......", ".....RR.....", "....RRR..R..", "...RROR..RR.", "..RROORRRRR.", ".RROOOORROR.", ".ROOOYOOOOR.",
      "RROOYYYOOORR", "ROOYYLYYOOOR", "ROOYLLLYYOOR", ".ROOYLLYOOR.", "..RRRRRRRR.."],
    "📊": ["............", "........NN..", "........NN..", ".....YY.NN..", ".....YY.NN..", "..BB.YY.NN..", "..BB.YY.NN..",
      "..BB.YY.NN..", "..BB.YY.NN..", ".KKKKKKKKKK.", "............", "............"],
    "📈": ["............", "........NNN.", ".........NN.", ".......NN.N.", "......NN....", ".N...NN.....", ".NN.NN......",
      "..NNN.......", "...N........", ".KKKKKKKKKK.", "............", "............"],
    "📉": ["............", ".R..........", ".RR.........", "..RRR...R...", "...RRR.RRR..", "....RRRR.RR.", ".....RR...R.",
      "..........R.", "........RRR.", ".KKKKKKKKKK.", "............", "............"],
    "🚨": ["............", ".Y...RR...Y.", "..YRRRRRRY..", "..RRLRRRRR..", "..RLLRRRRR..", "..RRRRRRRR..", "..RRRRRRRR..",
      ".gggggggggg.", ".GGGGGGGGGG.", "............", "............", "............"],
    "📺": ["..K.....K...", "...K...K....", "....K.K.....", ".KKKKKKKKKK.", ".KBBBBBBBBK.", ".KBCBBBBBBK.", ".KBBBBBBBBK.",
      ".KBBBBBBBBK.", ".KBBBBBBBBK.", ".KKKKKKKKKK.", "..K......K..", "............"],
    "💪": ["............", "...SS.......", "..SSSS......", "..SS.SS.....", "..SS..SS....", "..SS...SSS..", "..SSS.SSSSS.",
      "...SSSSSSSS.", "....SSSSSSs.", ".....sssss..", "............", "............"],
    "🎙": ["....gggg....", "...gwwggg...", "...gwgggg...", "...gggggg...", "...gggggg...", ".G.gggggg.G.", ".G..gggg..G.",
      "..G......G..", "...GGGGGG...", ".....GG.....", "....GGGG....", "............"],
    "🎤": ["........ggg.", ".......ggggg", ".......gwggg", "......Kggggg", ".....KK.ggg.", "....KK......", "...KK.......",
      "..KK........", ".KK.........", "KK..........", "............", "............"],
    "🧤": ["............", "...O.O.O....", "..OO.O.O.O..", "..OO.O.O.O..", "..OOOOOOOO..", "..OOOOOOOO.O", "..OOOOOOOOOO",
      "..OOOOOOOOO.", "...OOOOOOO..", "...WWWWWWW..", "...WWWWWWW..", "............"],
    "✅": [".NNNNNNNNNN.", "NNNNNNNNNNNN", "NNNNNNNNNWNN", "NNNNNNNNWWNN", "NNNNNNNWWNNN", "NNWNNNWWNNNN", "NNWWNWWNNNNN",
      "NNNWWWNNNNNN", "NNNNWNNNNNNN", "NNNNNNNNNNNN", ".nnnnnnnnnn.", "............"],
    "✓": ["............", "..........N.", ".........NN.", "........NN..", ".......NN...", ".N....NN....", ".NN..NN.....",
      "..NNNN......", "...NN.......", "............", "............", "............"],
    "❌": ["............", ".RR......RR.", ".RRR....RRR.", "..RRR..RRR..", "...RRRRRR...", "....RRRR....", "....RRRR....",
      "...RRRRRR...", "..RRR..RRR..", ".RRR....RRR.", ".RR......RR.", "............"],
    "📋": ["....TTTT....", "..TTggggTT..", "..TWWWWWWT..", "..TWKKKKWT..", "..TWWWWWWT..", "..TWKKKWWT..", "..TWWWWWWT..",
      "..TWKKKKWT..", "..TWWWWWWT..", "..TWKKWWWT..", "..TWWWWWWT..", "..TTTTTTTT.."],
    "📒": ["............", "..YYYYYYYYK.", "..YLLLLLLYK.", "..YYYYYYYYK.", "..YYKKKKYYK.", "..YYYYYYYYK.", "..YYYYYYYYK.",
      "..YYYYYYYYK.", "..YYYYYYYYK.", "..YYYYYYYYK.", "..yyyyyyyyK.", "............"],
    "📖": ["............", "............", ".WWWWW.WWWW.", "BWKKKW.WKKWB", "BWWWWW.WWWWB", "BWKKKW.WKKWB", "BWWWWW.WWWWB",
      "BWKKWW.WKKWB", "BWWWWW.WWWWB", "BBBBBBBBBBBB", "............", "............"],
    "📰": ["............", ".wwwwwwwww..", ".wKKKKKKKwg.", ".wwwwwwwwwg.", ".wKKK.wwwwg.", ".wKKK.wKKwg.", ".wKKK.wwwwg.",
      ".wwwwwwKKwg.", ".wKKKKwwwwg.", ".wwwwwwwwwg.", "..gggggggg..", "............"],
    "🤝": ["............", "............", "OO........SS", "OOO......SSS", "OOOOO..SSSSS", ".OOOOSSSSSS.", "..OOSSSSSS..",
      "...SSSSSS...", "....SsSs....", "............", "............", "............"],
    "⏱": ["....KKKK....", ".....KK.....", "...wwwwww...", "..wwwwwwww..", ".wwwwKwwwww.", ".wwwwKwwwww.", ".wwwwKKKwww.",
      ".wwwwwwwwww.", ".wwwwwwwwww.", "..wwwwwwww..", "...wwwwww...", "............"],
    "⏳": [".TTTTTTTTTT.", "..wYYYYYYw..", "..wYYYYYYw..", "...wYYYYw...", "....wYYw....", ".....ww.....", ".....ww.....",
      "....wwYw....", "...wwYYYw...", "..wYYYYYYw..", "..wYYYYYYw..", ".TTTTTTTTTT."],
    "🎉": ["..R....Y...B", "......N.....", "...B.....R..", "........Y...", ".....M......", "..Y.....N...", "...OO.......",
      "..OOYO......", ".OOYOOO.....", "OOOYOO......", "OYOO........", "OO.........."],
    "👑": ["............", "............", "Y....Y....Y.", "YY..YYY..YY.", "YYY.YYY.YYY.", "YYYYYYYYYYY.", "YYRYYBYYRYY.",
      "YYYYYYYYYYY.", "yyyyyyyyyyy.", "............", "............", "............"],
    "🧠": ["............", "...MMMMMM...", "..MMmMMmMM..", ".MMmMMMMmMM.", ".MmMMmMMMmM.", ".MMMMmMmMMM.", ".MmMMMMMMmM.",
      "..MMmMMmMM..", "...MMMMMM...", ".....MM.....", "............", "............"],
    "🎧": ["...KKKKKK...", "..K......K..", ".K........K.", ".K........K.", ".K........K.", "RRK......KRR", "RRR......RRR",
      "RRR......RRR", "RRR......RRR", ".RR......RR.", "............", "............"],
    "🔒": ["....gggg....", "...g....g...", "...g....g...", "...g....g...", "..YYYYYYYY..", "..YYYYYYYY..", "..YYYKKYYY..",
      "..YYYKKYYY..", "..YYYYYYYY..", "..yyyyyyyy..", "............", "............"],
    "🎯": ["...RRRRRR...", "..RWWWWWWR..", ".RWRRRRRRWR.", ".RWRWWWWRWR.", ".RWRWRRWRWR.", ".RWRWRRWRWR.", ".RWRWWWWRWR.",
      ".RWRRRRRRWR.", "..RWWWWWWR..", "...RRRRRR...", "............", "............"],
    "⚡": ["......YYY...", ".....YYY....", "....YYY.....", "...YYY......", "..YYYYYYY...", "......YYY...", ".....YYY....",
      "....YYY.....", "...YY.......", "..Y.........", "............", "............"],
    "☀": [".....Y......", ".Y...Y...Y..", "..Y.....Y...", "....YYY.....", "...YYYYY....", "YY.YYLYY.YY.", "...YYYYY....",
      "....YYY.....", "..Y.....Y...", ".Y...Y...Y..", ".....Y......", "............"],
    "🌙": ["....YYY.....", "..YYY.......", ".YYY........", ".YY.........", "YYY.........", "YYY.........", "YYY.........",
      ".YYY......Y.", ".YYYY...YY..", "..YYYYYYY...", "....YYY.....", "............"],
    "❄": [".....C......", "..C..C..C...", "...C.C.C....", "....CCC.....", "CCCCCCCCCCC.", "....CCC.....", "...C.C.C....",
      "..C..C..C...", ".....C......", "............", "............", "............"],
    "🌧": ["............", "....wwww....", "..wwwwwwww..", ".wwwwwwwwww.", ".wwwwwwwwww.", "..gggggggg..", "............",
      "..B..B..B...", ".B..B..B....", "............", "..B..B..B...", "............"],
    "☁": ["............", "............", "....wwww....", "..wwwwwwww..", ".wwwwwwwwww.", "wwwwwwwwwwww", "wwwwwwwwwwww",
      ".gggggggggg.", "............", "............", "............", "............"],
    "⛅": ["......YY....", ".....YYYY...", "....YYYYYY..", "..wwwwYYYY..", ".wwwwwwwYY..", "wwwwwwwwww..", "wwwwwwwwwww.",
      ".gggggggggg.", "............", "............", "............", "............"],
    "🎮": ["............", "............", "..GGGGGGGG..", ".GGGGGGGGGG.", "GGWGGGGGRGGG", "GWWWGGGRGRGG", "GGWGGGGGRGGG",
      "GGGGGGGGGGGG", "GGG.GGGG.GGG", "GG......GG..", "............", "............"],
    "🏟": ["............", "............", "..gggggggg..", ".gwwwwwwwwg.", "gwwNNNNNNwwg", "gwNNNWNNNNwg", "gwNNNWNNNNwg",
      "gwwNNNNNNwwg", ".gwwwwwwwwg.", "..gggggggg..", "............", "............"],
    "🚀": ["..........RR", "........wwRR", ".......wwwR.", "......wwBww.", ".....wwwww..", "....wwwww...", "..R.wwww....",
      ".RRwwww.....", "..OOww......", ".OYO.R......", "OYO.........", "OO.........."],
    "📸": ["............", "....GGG.....", ".GGGGGGGGGG.", ".GgggggggGG.", ".GgggKKKggG.", ".GggKBBKggG.", ".GggKBBKggG.",
      ".GgggKKKggG.", ".GggggggggG.", ".GGGGGGGGGG.", "............", "............"],
    "💎": ["............", "...CCCCCC...", "..CWCCCCCC..", ".CWCCCCCCCC.", "CCCCCCCCCCCC", ".CCCCCCCCCb.", "..CCCCCCCb..",
      "...CCCCCb...", "....CCCb....", ".....Cb.....", "............", "............"],
    "📱": ["...KKKKKK...", "...KBBBBK...", "...KBCBBK...", "...KBBBBK...", "...KBBBBK...", "...KBBBBK...", "...KBBBBK...",
      "...KBBBBK...", "...KKKKKK...", "...KKwwKK...", "............", "............"],
    "💰": ["....TTTT....", ".....TT.....", "....YYYY....", "...YYYYYY...", "..YYYKYYYY..", ".YYYKYKYYYY.", ".YYYYKYYYYY.",
      ".YYYKYKYYYY.", ".YYYYKYYYYY.", "..yyyyyyyy..", "............", "............"],
    "💶": ["............", "............", "NNNNNNNNNNNN", "NnnnnnnnnnnN", "NnNNNNNNNNnN", "NnNNWWWNNNnN", "NnNNWNNNNNnN",
      "NnNNWWWNNNnN", "NnNNNNNNNNnN", "NnnnnnnnnnnN", "NNNNNNNNNNNN", "............"],
    "🚑": CROSS, "🏥": CROSS, "🩹": CROSS,
    "🚪": ["...TTTTTT...", "...TttttT...", "...TttttT...", "...TttttT...", "...TttttT...", "...TttYtT...", "...TttttT...",
      "...TttttT...", "...TttttT...", "...TttttT...", "..gggggggg..", "............"],
    "⚠": [".....YY.....", "....YYYY....", "....YKKY....", "...YYKKYY...", "...YYKKYY...", "..YYYKKYYY..", "..YYYYYYYY..",
      ".YYYYKKYYYY.", ".YYYYKKYYYY.", "YYYYYYYYYYYY", "............", "............"],
    "🔄": ["............", "....BBBBB...", "..BB.....BB.", ".B.......BBB", ".B......BBB.", "............", "............",
      ".BBB......B.", "BBB.......B.", ".BB.....BB..", "...BBBBB....", "............"],
    "➡": ["............", "............", "......B.....", "......BB....", "BBBBBBBBB...", "BBBBBBBBBB..", "BBBBBBBBB...",
      "......BB....", "......B.....", "............", "............", "............"],
    "🏠": [".....RR.....", "....RRRR....", "...RRRRRR...", "..RRRRRRRR..", ".RRRRRRRRRR.", "..wwwwwwww..", "..wwBBwTTw..",
      "..wwBBwTTw..", "..wwwwwTTw..", "..wwwwwTTw..", "............", "............"],
    "👕": ["..BBB..BBB..", ".BBBBWWBBBB.", "BBBBBBBBBBBB", "BBBBBBBBBBBB", "BB.BBBBBB.BB", "...BBBBBB...", "...BBBBBB...",
      "...BBBBBB...", "...BBBBBB...", "...bbbbbb...", "............", "............"],
    "🥅": ["............", "WWWWWWWWWWWW", "Wg.g.g.g.g.W", "W.g.g.g.g.gW", "Wg.g.g.g.g.W", "W.g.g.g.g.gW", "Wg.g.g.g.g.W",
      "W.g.g.g.g.gW", "W..........W", "NNNNNNNNNNNN", "............", "............"],
    "💼": ["....TTTT....", "....T..T....", "TTTTTTTTTTTT", "TttttttttttT", "TttttYYttttT", "TTTTTYYTTTTT", "TttttttttttT",
      "TttttttttttT", "TTTTTTTTTTTT", "............", "............", "............"],
    "🔔": [".....YY.....", "....YYYY....", "...YYYYYY...", "...YLYYYY...", "...YLYYYY...", "..YYYYYYYY..", ".YYYYYYYYYY.",
      ".yyyyyyyyyy.", ".....yy.....", "............", "............", "............"],
    "🎓": ["............", ".....KK.....", "...KKKKKK...", ".KKKKKKKKKK.", "...KKKKKK.Y.", "...KKKKKK.Y.", "....KKKK..Y.",
      "..........Y.", "............", "............", "............", "............"],
    "🏁": ["G...........", "GKWKWKWK....", "GWKWKWKW....", "GKWKWKWK....", "GWKWKWKW....", "G...........", "G...........",
      "G...........", "G...........", "G...........", "............", "............"],
    "⏸": ["............", "..www..www..", "..www..www..", "..www..www..", "..www..www..", "..www..www..", "..www..www..",
      "..www..www..", "..www..www..", "............", "............", "............"],
    "🔍": ["...gggg.....", "..g....g....", ".g.CC...g...", ".g.C....g...", ".g......g...", "..g....g....", "...ggggKK...",
      ".......KKK..", "........KKK.", ".........KK.", "............", "............"],
    "🎁": ["....R..R....", ".....RR.....", "MMMMMRRMMMMM", "MMMMMRRMMMMM", ".MMMMRRMMMM.", ".MMMMRRMMMM.", ".MMMMRRMMMM.",
      ".MMMMRRMMMM.", ".mmmmRRmmmm.", "............", "............", "............"],
    "🎂": ["..Y..Y..Y...", "..R..R..R...", "..R..R..R...", ".MMMMMMMMMM.", ".MWMWMWMWMM.", ".TTTTTTTTTT.", ".TTTTTTTTTT.",
      ".MMMMMMMMMM.", ".TTTTTTTTTT.", "wwwwwwwwwwww", "............", "............"],
    "👀": ["............", "............", ".wwww..wwww.", "wwwwwwwwwwww", "wwKKwwwwKKww", "wwKKwwwwKKww", "wwwwwwwwwwww",
      ".wwww..wwww.", "............", "............", "............", "............"],
    "📅": ["..K......K..", ".RRRRRRRRRR.", ".RRRRRRRRRR.", ".wwwwwwwwww.", ".wKwKwKwKww.", ".wwwwwwwwww.", ".wKwKwKwKww.",
      ".wwwwwwwwww.", ".wKwKwKwwww.", ".wwwwwwwwww.", "............", "............"],
    "🛡": [".bbbbbbbbbb.", ".bBBBBBBBBb.", ".bBWBBBBBBb.", ".bBWBBBBBBb.", ".bBBBBBBBBb.", ".bBBBBBBBBb.", "..bBBBBBBb..",
      "...bBBBBb...", "....bBBb....", ".....bb.....", "............", "............"],
    "✨": ["..Y.........", ".YYY........", "..Y.....Y...", ".......YYY..", "......YYYYY.", ".......YYY..", "..Y.....Y...",
      ".YYY........", "..Y.........", "............", "............", "............"],
    "💨": ["............", "............", ".wwwwwww....", "........w...", "..wwwwwwww..", "...........w", ".wwwwwwwwww.",
      "..........w.", "...wwwwwww..", "............", "............", "............"],
    "🧱": ["............", "rRRRRrRRRRRr", "rRRRRrRRRRRr", "rrrrrrrrrrrr", "RRrRRRRRrRRR", "RRrRRRRRrRRR", "rrrrrrrrrrrr",
      "rRRRRrRRRRRr", "rRRRRrRRRRRr", "rrrrrrrrrrrr", "............", "............"],
    "👟": ["............", "............", "...BBB......", "...BWB......", "...BBBB.....", "...BBBBBB...", "..BBBBBBBBB.",
      ".BBBBBBBBBBB", ".WWWWWWWWWWW", "..K..K..K...", "............", "............"],
    "🗳": ["....wwww....", "....wKKw....", "....wwww....", "..GGGGGGGG..", "..GwwwwwwG..", "..GwwwwwwG..", "..GwwwwwwG..",
      "..GGGGGGGG..", "............", "............", "............", "............"]
  };
  ICONS["✔"] = ICONS["✓"]; ICONS["✗"] = ICONS["❌"]; ICONS["✕"] = ICONS["❌"]; ICONS["🔎"] = ICONS["🔍"]; ICONS["🗞"] = ICONS["📰"];
  ICONS["🔁"] = ICONS["🔄"]; ICONS["💸"] = ICONS["💶"]; ICONS["🌤"] = ICONS["⛅"]; ICONS["🎆"] = ICONS["🎉"]; ICONS["🎊"] = ICONS["🎉"];
  ICONS["🥳"] = ICONS["🎉"];
  var SPECIAL = {
    "❤": heart(PAL.R, "#ff8a7a", PAL.r), "♥": heart(PAL.R, "#ff8a7a", PAL.r), "💙": heart(PAL.B, "#8ab8ff", PAL.b),
    "💛": heart(PAL.Y, PAL.L, PAL.y), "🤍": heart("#f4f4f4", "#ffffff", "#b8bec6"), "💜": heart(PAL.P, "#d0a0f0", PAL.p),
    "💓": heart(PAL.M, "#ffc0d8", PAL.m), "💞": heart(PAL.M, "#ffc0d8", PAL.m), "🫶": heart(PAL.M, "#ffc0d8", PAL.m),
    "🏅": {rows: MEDAL, pal: {X: PAL.Y, L: PAL.L, d: PAL.y, B: PAL.B, R: PAL.R}}, "🥇": {rows: MEDAL, pal: {X: PAL.Y, L: PAL.L, d: PAL.y, B: PAL.B, R: PAL.R}},
    "🥈": {rows: MEDAL, pal: {X: "#c9d2d8", L: "#ffffff", d: "#7d8a91", B: PAL.B, R: PAL.R}}, "🥉": {rows: MEDAL, pal: {X: "#d08a50", L: "#f6cda3", d: "#86532a", B: PAL.B, R: PAL.R}},
    "🎖": {rows: MEDAL, pal: {X: PAL.Y, L: PAL.L, d: PAL.y, B: PAL.B, R: PAL.R}},
    "⭐": {rows: STAR, pal: {X: PAL.Y}}, "🌟": {rows: STAR, pal: {X: PAL.Y}}, "★": {rows: STAR, pal: {X: PAL.Y}}, "☆": {rows: STAR, pal: {X: PAL.g}},
    "🟥": {rows: CARD, pal: {X: PAL.R, L: "#ff8a7a", d: PAL.r}}, "🟨": {rows: CARD, pal: {X: PAL.Y, L: PAL.L, d: PAL.y}},
    "🔴": {rows: DOT, pal: {X: PAL.R, L: "#ff8a7a", d: PAL.r}}, "🔵": {rows: DOT, pal: {X: PAL.B, L: "#8ab8ff", d: PAL.b}},
    "👋": {rows: HAND, pal: PAL}, "🙌": {rows: HAND, pal: PAL}, "👏": {rows: HAND, pal: PAL}, "🙏": {rows: HAND, pal: PAL}, "🤙": {rows: HAND, pal: PAL}
  };
  /* caras: base amarilla + rasgos en las filas 3..9 */
  var SMILE = ["....YYYY....", "..YYYYYYYY..", ".YYYYYYYYYY.", ".YYYYYYYYYY.", "YYYYYYYYYYYY", "YYYYYYYYYYYY", "YYYYYYYYYYYY",
    "YYYYYYYYYYYY", ".YYYYYYYYYY.", ".YYYYYYYYYy.", "..yYYYYYYy..", "....yyyy...."];
  var FACES = {
    "🙂": ["............", "...K....K...", "...K....K...", "............", "...K....K...", "....KKKK....", "............"],
    "😄": ["............", "..KK....KK..", "............", "..KKKKKKKK..", "..KWWWWWWK..", "...KRRRRK...", "....KKKK...."],
    "😂": ["............", "..KK....KK..", ".C........C.", "CCKKKKKKKKCC", ".CKWWWWWWKC.", "...KRRRRK...", "....KKKK...."],
    "😅": ["..........C.", "..KK....KKCC", "............", "..KKKKKKKK..", "..KWWWWWWK..", "...KRRRRK...", "....KKKK...."],
    "😎": ["............", ".KKKKKKKKKK.", ".KKKK..KKKK.", "..KK....KK..", "...K....K...", "....KKKK....", "............"],
    "😤": ["..KK....KK..", "...KK..KK...", "...K....K...", "............", "....KKKK....", "w..........w", "ww........ww"],
    "😭": ["............", "..KKK..KKK..", "..C......C..", "..C.KKKK.C..", "..CKRRRRKC..", "..C.KKKK.C..", "..C......C.."],
    "🙄": ["..WK....WK..", "..WW....WW..", "............", "............", "....KKKK....", "............", "............"],
    "🤔": ["...KK.......", "...K....K...", "...K....K...", "............", ".....KKKK...", "............", "..SSSS......"],
    "😬": ["............", "...K....K...", "...K....K...", "............", "..KKKKKKKK..", "..KWKWKWKK..", "..KKKKKKKK.."],
    "😱": ["............", "..WWW..WWW..", "..WKW..WKW..", "..WWW..WWW..", ".....KK.....", "....KKKK....", ".....KK....."],
    "😢": ["............", "..KK....KK..", "...K....K...", "........C...", "....KKKK....", "...K....K...", "............"],
    "😍": ["..R.R..R.R..", "..RRR..RRR..", "...R....R...", "............", "...K....K...", "....KKKK....", "............"],
    "🤩": ["...O....O...", "..OOO..OOO..", "...O....O...", "............", "..KKKKKKKK..", "...KWWWWK...", "....KKKK...."],
    "😉": ["............", "...K........", "...K...KK...", "............", "...K....K...", "....KKKK....", "............"],
    "😏": ["............", "..KK....KK..", "............", "............", ".......KK...", "....KKK.....", "............"],
    "😜": ["............", "...K...KK...", "...K........", "............", "...KKKKKK...", ".....MM.....", ".....MM....."],
    "😴": [".........KK.", "..KK..KK..K.", ".........KK.", "............", "....KKKK....", "............", "............"],
    "😐": ["............", "...K....K...", "...K....K...", "............", "...KKKKKK...", "............", "............"],
    "😮": ["............", "...K....K...", "...K....K...", "............", ".....KK.....", "....K..K....", ".....KK....."]
  };
  var FACE_ALIAS = {"🤣": "😂", "😆": "😄", "😁": "😄", "😊": "🙂", "🙃": "🙂", "🤗": "🙂", "🥲": "😅", "🥹": "😢", "😩": "😢",
    "😔": "😢", "😞": "😢", "😟": "😢", "😡": "😤", "😠": "😤", "😳": "😮", "🤯": "😱", "😰": "😱", "😵": "😱", "🤪": "😜",
    "😑": "😐", "😶": "😐", "🫥": "😐", "🫤": "😐", "😒": "😏", "🤐": "😐", "🤫": "😐", "😣": "😢", "🥵": "😅", "🤓": "😎", "🥸": "😎"};
  function iconGrid(e) {
    var g = new Grid(12, 12), sp = SPECIAL[e];
    if (sp) return g.stamp(sp.rows, sp.pal);
    if (ICONS[e]) return g.stamp(ICONS[e], PAL);
    var fk = FACES[e] ? e : FACE_ALIAS[e];
    if (fk && FACES[fk]) {
      var red = e === "😡" || e === "😠" || e === "🥵";
      g.stamp(SMILE, red ? {Y: PAL.R, y: PAL.r} : PAL);
      return g.stamp(FACES[fk], PAL, 0, 3);
    }
    if (e === "💀") { g.stamp(SMILE, {Y: "#eef0f2", y: "#b8bec6"}); return g.stamp(["............", "..KKK..KKK..", "..KKK..KKK..", ".....KK.....", "............", "...K.K.K.K..", "............"], PAL, 0, 3); }
    return null;
  }
  var ICACHE = {};
  function icon(e, size) {
    var k = e + "|" + (size || "");
    if (ICACHE[k] != null) return ICACHE[k];
    var g = iconGrid(e);
    return (ICACHE[k] = g ? g.svg(size || "1em", size || "1em", "pxi-svg") : "");
  }
  function has(e) { return !!(SPECIAL[e] || ICONS[e] || FACES[e] || FACE_ALIAS[e] || e === "💀"); }
  var KEYS = Object.keys(ICONS).concat(Object.keys(SPECIAL), Object.keys(FACES), Object.keys(FACE_ALIAS), ["💀"]);
  KEYS.sort(function (a, b) { return b.length - a.length; });
  var RE = null;
  try { RE = new RegExp("(" + KEYS.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")(?:\\uFE0F|\\uD83C[\\uDFFB-\\uDFFF])?", "g"); } catch (e) { RE = null; }

  /* Sustituye los emojis conocidos por iconos en los nodos de texto (no en campos de formulario ni SVG). */
  var SKIP = {TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, SCRIPT: 1, STYLE: 1, svg: 1, SVG: 1, TITLE: 1, CANVAS: 1};
  function skipNode(n) {
    for (var e = n.parentNode; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.nodeName] || SKIP[e.tagName]) return true;
      if (e.hasAttribute && (e.hasAttribute("data-nopx") || e.isContentEditable)) return true;
      if (e.classList && e.classList.contains("pxi")) return true;
    }
    return false;
  }
  function fixText(t) {
    if (!RE || !t.nodeValue || !t.parentNode) return;
    RE.lastIndex = 0;
    if (!RE.test(t.nodeValue) || skipNode(t)) return;
    var s = t.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var sp = document.createElement("span");
      sp.className = "pxi"; sp.setAttribute("role", "img"); sp.setAttribute("aria-label", m[1]);
      sp.innerHTML = icon(m[1]);
      frag.appendChild(sp);
      last = m.index + m[0].length;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag, t);
  }
  function emojify(root) {
    if (!root || typeof document === "undefined" || !RE) return;
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    var w = document.createTreeWalker(root, 4, null, false), list = [], n;
    while ((n = w.nextNode())) { RE.lastIndex = 0; if (RE.test(n.nodeValue)) list.push(n); }
    for (var i = 0; i < list.length; i++) fixText(list[i]);
  }
  var on = true;
  function start() {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !document.body) return;
    emojify(document.body);
    new MutationObserver(function (recs) {
      if (!on) return;
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === "characterData") fixText(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) emojify(r.addedNodes[j]);
      }
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else setTimeout(start, 0);
  }
  /* iconos de navegación monocromos (color del texto) */
  var UI = {
    home: ["............", ".....##.....", "....####....", "...######...", "..########..", ".##########.", "..##....##..",
      "..##.##.##..", "..##.##.##..", "..##.##.##..", "..########..", "............"],
    grid: ["............", ".####..####.", ".#..#..#..#.", ".#..#..#..#.", ".####..####.", "............", "............",
      ".####..####.", ".#..#..#..#.", ".#..#..#..#.", ".####..####.", "............"],
    medal: [".##......##.", "..##....##..", "...##..##...", "....####....", "....####....", "...######...", "..##....##..",
      "..#..##..#..", "..#..##..#..", "..##....##..", "...######...", "............"],
    book: ["............", ".#####.####.", ".#...#.#..#.", ".#.#.#.#..#.", ".#...#.#.##.", ".#.#.#.#..#.", ".#...#.#.##.",
      ".#.#.#.#..#.", ".#...#.#..#.", ".##########.", "............", "............"],
    gear: ["............", ".....##.....", "..#.####.#..", "..########..", "...##..##...", ".###....###.", ".###....###.",
      "...##..##...", "..########..", "..#.####.#..", ".....##.....", "............"],
    at: ["............", "...######...", "..#......#..", ".#..####..#.", ".#.#...#..#.", ".#.#...#..#.", ".#.#..##..#.",
      ".#..##.###..", "..#.........", "...######...", "............", "............"],
    play: ["............", "...#........", "...##.......", "...###......", "...####.....", "...#####....", "...#####....",
      "...####.....", "...###......", "...##.......", "...#........", "............"],
    dots: ["............", "............", "............", "............", "............", ".##..##..##.", ".##..##..##.",
      "............", "............", "............", "............", "............"],
    route: ["............", ".##.........", ".##.........", "..#.........", "..#####.....", "......#.....", "......#.....",
      "......#####.", "..........#.", ".........##.", ".........##.", "............"],
    shirt: ["............", "..###..###..", ".####..####.", "############", "##.######.##", "...######...", "...######...",
      "...######...", "...######...", "...######...", "............", "............"],
    table: ["............", "############", "#..#.......#", "############", "#..#.......#", "############", "#..#.......#",
      "############", "#..#.......#", "############", "............", "............"],
    trophy: ["............", "..########..", "##.######.##", "#..######..#", "##.######.##", "...######...", "....####....",
      ".....##.....", ".....##.....", "....####....", "...######...", "............"],
    globe: ["............", "....####....", "..##.##.##..", ".#..#..#..#.", ".##########.", ".#..#..#..#.", ".#..#..#..#.",
      ".##########.", ".#..#..#..#.", "..##.##.##..", "....####....", "............"],
    swap: ["............", "........#...", "........##..", ".##########.", "........##..", "........#...", "...#........",
      "..##........", ".##########.", "..##........", "...#........", "............"],
    board: ["............", "############", "#....#.....#", "#.#..#..#..#", "#..#.#.#...#", "#...###....#", "#....#.....#",
      "#....#..##.#", "#....#.....#", "############", "...#....#...", "..#......#.."]
  };
  function uiIcons() {
    var out = {};
    Object.keys(UI).forEach(function (k) { out[k] = new Grid(12, 12).stamp(UI[k], {"#": "currentColor"}).svg("1em", "1em", "pxi-svg"); });
    return out;
  }
  return {Grid: Grid, face: face, trophy: trophy, honours: honours, guessKey: guessKey, uiIcons: uiIcons, UI: UI, crest: crest, kit: kit, icon: icon, has: has, emojify: emojify, shade: shade, mix: mixc,
    off: function () { on = false; }, ICONS: ICONS, TRO: TRO};
})();

/* Las funciones vectoriales se sustituyen por las pixeladas (misma firma). */
if (typeof faceSVG === "function") faceSVG = function (p, size, o) { return PX.face(p, size, o); };
if (typeof trophySVG === "function") trophySVG = function (key, size, label) { return PX.trophy(key, size, label); };
if (typeof crestSVG !== "undefined") crestSVG = function (o) { return PX.crest(o); };
if (typeof kitSVG !== "undefined") kitSVG = function (o) { return PX.kit(o); };
