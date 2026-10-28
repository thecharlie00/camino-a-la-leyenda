/* Escudos y camisetas en SVG inline. Autónomo (ES5), sin dependencias.
   crestSVG({shape, pat, col:[c0,c1], ab, big}) → escudo 22×25 (34×39 si big)
   crestAuto(nombre, col, ab, big)             → forma + patrón deterministas a partir del nombre
   kitSVG({pat, col:[cuerpo, secundario, ribete], big}) → camiseta 32×32 (64×64 si big)
   Todo se dibuja en un viewBox fijo (44×50 escudos, 64×64 camisetas); los ids de clipPath llevan contador. */
if (typeof N_ !== "function") var N_ = function (s) { return s; };
var CREST_SHAPES = [
  ["shield", N_("Escudo clásico")], ["pointed", N_("Escudo en punta")], ["french", N_("Escudo francés")],
  ["rounded", N_("Escudo redondeado")], ["round", N_("Insignia redonda")], ["ring", N_("Redondo con anillo")],
  ["oval", N_("Óvalo")], ["diamond", N_("Rombo")], ["hexagon", N_("Hexágono")], ["octagon", N_("Octógono")],
  ["pennant", N_("Banderín")], ["square", N_("Cuadrado redondeado")], ["crown", N_("Escudo con corona")],
  ["quartered", N_("Escudo cuartelado")], ["ball", N_("Balón")], ["star", N_("Escudo con estrella")],
  ["tab", N_("Escudo de puntas")]
];
var CREST_PATS = [
  ["plain", N_("Liso")], ["stripes", N_("Rayas")], ["band", N_("Franja")], ["halves", N_("Mitades")],
  ["quarters", N_("Cuarteles")], ["sash", N_("Banda diagonal")], ["chevron", N_("Chevrón")], ["hoops", N_("Aros")],
  ["cross", N_("Cruz")], ["border", N_("Bordura")], ["chief", N_("Jefe")]
];
var KIT_PATS = [
  ["plain", N_("Lisa")], ["stripes", N_("Rayas")], ["pinstripes", N_("Rayas finas")], ["hoops", N_("Aros")],
  ["halves", N_("Mitades")], ["sash", N_("Banda diagonal")], ["diagonal", N_("Mitades en diagonal")],
  ["band", N_("Franja en el pecho")], ["quarters", N_("Cuarteles")], ["sleeves", N_("Mangas a contraste")],
  ["gradient", N_("Degradado")]
];

var crestSVG, crestAuto, kitSVG;
(function () {
  var uid = 0;
  var COL_RE = /^(#[0-9a-fA-F]{3,8}|hsl\(\d{1,3},\d{1,3}%,\d{1,3}%\))$/;
  var OUT = "rgba(0,0,0,.35)";
  function safeCol(c, d) { return typeof c === "string" && COL_RE.test(c) ? c : d; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* luminancia aproximada 0..1 de "#rgb", "#rrggbb" o "hsl(h,s%,l%)" */
  function lum(c) {
    var r, g, b, m;
    if (c.charAt(0) === "#") {
      var x = c.length < 6 ? c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3) : c.substr(1, 6);
      r = parseInt(x.substr(0, 2), 16); g = parseInt(x.substr(2, 2), 16); b = parseInt(x.substr(4, 2), 16);
    } else if ((m = /hsl\((\d+),(\d+)%,(\d+)%\)/.exec(c))) {
      var h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      var f = function (t) { t = t < 0 ? t + 1 : t > 1 ? t - 1 : t; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
      r = f(h + 1 / 3); g = f(h); b = f(h - 1 / 3);
    } else return 0.3;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function ink(c) { return lum(c) > 0.62 ? "#141414" : "#fff"; }
  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }

  /* Formas en viewBox 44×50. d: contorno (también recorte del patrón); ty/tw/fs: centro, ancho útil y cuerpo del texto;
     cy: centro vertical para los patrones; pre/post: adornos detrás/encima. */
  var SH = {
    shield:   {d: "M2 2H42V22Q42 40 22 48Q2 40 2 22Z", ty: 21, tw: 36, fs: 16},
    pointed:  {d: "M2 2H42V27L22 48L2 27Z", ty: 19, tw: 36, fs: 16},
    french:   {d: "M2 2H42V36Q42 43 35 43H29Q23 43 22 48Q21 43 15 43H9Q2 43 2 36Z", ty: 23, tw: 36, fs: 16},
    rounded:  {d: "M2 2H42V28A20 20 0 0 1 2 28Z", ty: 23, tw: 36, fs: 16},
    round:    {d: "M22 3A21 21 0 1 1 22 47A21 21 0 1 1 22 3Z", ty: 25, tw: 34, fs: 15},
    ring:     {d: "M22 8A16.5 16.5 0 1 1 22 41A16.5 16.5 0 1 1 22 8Z", ty: 24.5, tw: 29, fs: 13.5,
               pre: function (c) { return '<circle cx="22" cy="24.5" r="21" fill="' + c[1] + '" stroke="' + OUT + '" stroke-width="1.5"/><circle cx="22" cy="24.5" r="18.8" fill="none" stroke="' + c[0] + '" stroke-width=".9" stroke-dasharray="1.6 1.4"/>'; }},
    oval:     {d: "M22 2A18 23 0 1 1 22 48A18 23 0 1 1 22 2Z", ty: 25, tw: 32, fs: 15},
    diamond:  {d: "M22 1L43 25L22 49L1 25Z", ty: 25, tw: 30, fs: 13},
    hexagon:  {d: "M22 1L42 13V37L22 49L2 37V13Z", ty: 25, tw: 36, fs: 15},
    octagon:  {d: "M14 2H30L42 14V36L30 48H14L2 36V14Z", ty: 25, tw: 38, fs: 16},
    pennant:  {d: "M3 2H41V47L22 37L3 47Z", ty: 20, tw: 36, fs: 16},
    square:   {d: "M11 3H33Q42 3 42 12V38Q42 47 33 47H11Q2 47 2 38V12Q2 3 11 3Z", ty: 25, tw: 38, fs: 16},
    crown:    {d: "M3 15H41V29Q41 42 22 49Q3 42 3 29Z", ty: 29, tw: 34, fs: 15,
               pre: function (c) { return '<path d="M7 16L5 4L13 10L22 1L31 10L39 4L37 16Z" fill="' + c[1] + '" stroke="' + OUT + '" stroke-width="1.5" stroke-linejoin="round"/>'; }},
    quartered:{d: "M2 2H42V28A20 20 0 0 1 2 28Z", ty: 30, tw: 34, fs: 15,
               post: function (c) { return '<path d="M2 2H22V15H2Z" fill="' + c[1] + '"/><path d="M22 2H42V15H22Z" fill="' + c[0] + '"/><path d="M22 2V15M2 15H42" stroke="' + OUT + '" stroke-width="1.2"/>'; }},
    ball:     {d: "M22 3A21 21 0 1 1 22 47A21 21 0 1 1 22 3Z", ty: 25, tw: 30, fs: 14,
               post: function (c) { return '<path d="M22 3l5 5h-10zM5 34l6 1-3 6zM39 34l-6 1 3 6zM22 47l-4-4h8z" fill="' + c[1] + '" stroke="' + OUT + '" stroke-width=".8"/>'; }},
    star:     {d: "M3 13H41V27Q41 41 22 49Q3 41 3 27Z", ty: 27, tw: 34, fs: 15,
               pre: function (c) { return '<path d="M22 0L24.5 6.5H31L25.8 10.5L27.8 17L22 13L16.2 17L18.2 10.5L13 6.5H19.5Z" fill="' + c[1] + '" stroke="' + OUT + '" stroke-width="1.2" stroke-linejoin="round"/>'; }},
    tab:      {d: "M2 3Q12 7 22 2Q32 7 42 3V24Q42 40 22 48Q2 40 2 24Z", ty: 22, tw: 36, fs: 16}
  };
  /* Patrones: devuelven [svg, fondo bajo el texto: 0 | 1 | -1 (mezcla)] */
  function pat(p, c, ty, d) {
    var a = ty - 7, b = ty + 7, i, o = "";
    switch (p) {
      case "stripes": for (i = 0; i < 4; i++) o += '<rect x="' + (5.5 + i * 11) + '" width="5.5" height="50"/>'; return [o, -1];
      case "band": return ['<rect y="' + a + '" width="44" height="14"/>', 1];
      case "halves": return ['<rect x="22" width="22" height="50"/>', -1];
      case "quarters": return ['<path d="M22 0H44V' + ty + 'H22ZM0 ' + ty + 'H22V50H0Z"/>', -1];
      case "sash": return ['<path d="M0 6L6 0L44 38V50L38 50L0 12Z"/>', -1];
      case "chevron": return ['<path d="M0 ' + (b + 12) + 'L22 ' + (b + 1) + 'L44 ' + (b + 12) + 'V' + (b + 20) + 'L22 ' + (b + 9) + 'L0 ' + (b + 20) + 'Z"/>', 0];
      case "hoops": for (i = 0; i < 5; i++) o += '<rect y="' + (5 + i * 10) + '" width="44" height="5"/>'; return [o, -1];
      case "cross": return ['<path d="M17 0H27V' + a + 'H44V' + b + 'H27V50H17V' + b + 'H0V' + a + 'H17Z"/>', 1];
      case "border": return ['<path d="' + d + '" fill="none" stroke="' + c[1] + '" stroke-width="7"/>', 0];
      case "chief": return ['<rect width="44" height="' + (a - 1) + '"/>', 0];
    }
    return ["", 0];
  }
  var CREST_PATS_IDX = {};
  CREST_PATS.forEach(function (p) { CREST_PATS_IDX[p[0]] = 1; });
  var KEEPS_TOP = {crown: 1, quartered: 1, star: 1};

  crestSVG = function (o) {
    o = o || {};
    var s = SH[o.shape] || SH.shield, c = o.col || [];
    c = [safeCol(c[0], "#556066"), safeCol(c[1], "#f4f4f4")];
    var big = !!o.big, w = big ? 34 : 22, h = big ? 39 : 25, id = "cr" + (++uid).toString(36);
    var pr = pat(CREST_PATS_IDX[o.pat] ? o.pat : "plain", c, s.ty, s.d);
    if (o.pat === "chief" && KEEPS_TOP[o.shape]) pr = ["", 0];
    var ab = String(o.ab == null ? "" : o.ab).slice(0, 4), n = ab.length || 1;
    var fs = s.fs * (big ? 0.92 : 1) * (n > 3 ? 0.82 : 1);
    var est = n * fs * 0.64, tl = est > s.tw ? ' textLength="' + s.tw + '" lengthAdjust="spacingAndGlyphs"' : "";
    var t0 = ink(c[0]), t1 = ink(c[1]), bg = pr[1], fill = bg === 1 ? t1 : t0;
    /* fondo mixto: placa lisa detrás del texto en pequeño, halo en grande */
    var plate = bg === -1 && !big ? '<rect x="' + (22 - Math.min(est, s.tw) / 2 - 2).toFixed(1) + '" y="' + (s.ty - fs * 0.52).toFixed(1) + '" width="' + (Math.min(est, s.tw) + 4).toFixed(1) + '" height="' + (fs * 1.04).toFixed(1) + '" rx="2" fill="' + c[0] + '"/>' : "";
    var halo = bg === -1 && big && t0 !== t1;
    var st = halo ? ' stroke="' + (fill === "#fff" ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.6)") + '" stroke-width="' + (big ? 2.6 : 3) + '" paint-order="stroke" stroke-linejoin="round"' : "";
    return '<svg class="crest-svg" width="' + w + '" height="' + h + '" viewBox="0 0 44 50" aria-hidden="true" style="flex:none;display:inline-block;vertical-align:middle">' +
      (s.pre ? s.pre(c) : "") +
      (pr[0] ? '<clipPath id="' + id + '"><path d="' + s.d + '"/></clipPath>' : "") +
      '<path d="' + s.d + '" fill="' + c[0] + '"/>' +
      (pr[0] ? '<g clip-path="url(#' + id + ')" fill="' + c[1] + '">' + pr[0] + "</g>" : "") +
      (s.post ? s.post(c) : "") + plate +
      '<path d="' + s.d + '" fill="none" stroke="' + OUT + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      (ab ? '<text x="22" y="' + s.ty + '" dy=".36em" text-anchor="middle" fill="' + fill + '"' + st + tl +
        ' style="font:800 ' + fs.toFixed(1) + 'px var(--f-body,sans-serif);letter-spacing:-.02em">' + esc(ab) + "</text>" : "") +
      "</svg>";
  };

  /* Solo el tipo de silueta/patrón, nunca el escudo real */
  var OVR = {
    "FC Barcelona": ["quartered", "stripes"], "Real Madrid": ["round", "sash"], "Atlético de Madrid": ["pointed", "stripes"],
    "Bayern Múnich": ["ring", "quarters"], "Juventus": ["oval", "stripes"], "Inter": ["ring", "plain"],
    "Chelsea": ["round", "plain"], "Arsenal": ["shield", "chief"], "Manchester City": ["round", "border"],
    "Liverpool": ["shield", "plain"], "PSG": ["round", "plain"], "Paris Saint-Germain": ["round", "plain"],
    "Boca Juniors": ["round", "band"], "River Plate": ["shield", "sash"], "Ajax": ["round", "plain"],
    "AC Milan": ["oval", "halves"], "Borussia Dortmund": ["ring", "plain"], "Manchester United": ["shield", "chief"],
    "Athletic Club": ["rounded", "stripes"], "Real Betis": ["round", "stripes"], "Sevilla FC": ["rounded", "quarters"],
    "FC Porto": ["crown", "plain"], "SL Benfica": ["round", "plain"], "Celtic": ["ring", "plain"], "Napoli": ["ring", "plain"],
    "Tottenham Hotspur": ["shield", "plain"], "Valencia CF": ["crown", "plain"], "Real Sociedad": ["crown", "band"],
    "RCD Espanyol": ["rounded", "stripes"], "Olympique de Marsella": ["shield", "band"], "Flamengo": ["shield", "hoops"],
    "Corinthians": ["round", "plain"], "Peñarol": ["shield", "stripes"]
  };
  var SH_W = [["shield", 14], ["round", 12], ["rounded", 9], ["pointed", 8], ["ring", 8], ["french", 6], ["tab", 4],
    ["crown", 4], ["oval", 5], ["quartered", 3], ["star", 3], ["octagon", 3], ["hexagon", 3], ["square", 3],
    ["diamond", 2], ["pennant", 2], ["ball", 2]];
  var PT_W = [["plain", 14], ["band", 8], ["stripes", 8], ["border", 6], ["chief", 6], ["halves", 5], ["sash", 5],
    ["chevron", 4], ["hoops", 4], ["quarters", 3], ["cross", 3]];
  function pick(list, h) {
    var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][1];
    h = h % tot; for (i = 0; i < list.length; i++) { if (h < list[i][1]) return list[i][0]; h -= list[i][1]; }
    return list[0][0];
  }
  crestAuto = function (name, col, ab, big) {
    var nm = String(name || "").replace(/\s+(B|C|II)$/, ""), ov = OVR[nm], h = hash(nm), shape, p;
    if (ov) { shape = ov[0]; p = ov[1]; }
    else {
      shape = pick(SH_W, h); p = pick(PT_W, Math.floor(h / 131));
      if (/^Real |^Reial /.test(nm) && h % 5 < 3) shape = "crown";
      if (/Atl[eé]tic|Athletic/.test(nm) && h % 2) p = "stripes";
    }
    return crestSVG({shape: shape, pat: p, col: col, ab: ab, big: big});
  };

  /* Camisetas en viewBox 64×64 */
  var KD = "M21 6L26 4Q32 9 38 4L43 6L58 17L52 28L46 24V59H18V24L12 28L6 17Z";
  var KP = {
    stripes: function () { var o = "", i; for (i = 0; i < 5; i++) o += '<rect x="' + (14 + i * 8) + '" width="4" height="64"/>'; return o; },
    pinstripes: function () { var o = "", i; for (i = 0; i < 12; i++) o += '<rect x="' + (9.5 + i * 4) + '" width="1" height="64"/>'; return o; },
    hoops: function () { var o = "", i; for (i = 0; i < 6; i++) o += '<rect y="' + (12 + i * 9) + '" width="64" height="4.5"/>'; return o; },
    halves: function () { return '<rect x="32" width="32" height="64"/>'; },
    sash: function () { return '<path d="M20 4H30L52 62H42Z"/>'; },
    diagonal: function () { return '<path d="M64 0V64H0Z"/>'; },
    band: function () { return '<rect y="25" width="64" height="9"/>'; },
    quarters: function () { return '<path d="M0 0H32V31H0ZM32 31H64V64H32Z"/>'; },
    sleeves: function () { return '<path d="M0 0H18V64H0ZM46 0H64V64H46Z"/>'; }
  };
  kitSVG = function (o) {
    o = o || {};
    var c = o.col || [], big = !!o.big, w = big ? 64 : 32, id = "kt" + (++uid).toString(36);
    c = [safeCol(c[0], "#556066"), safeCol(c[1], "#f4f4f4"), safeCol(c[2], safeCol(c[1], "#f4f4f4"))];
    var inner = "", defs = "";
    if (o.pat === "gradient") {
      defs = '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>';
      inner = '<rect width="64" height="64" fill="url(#' + id + 'g)"/>';
    } else if (KP[o.pat]) inner = '<g fill="' + c[1] + '">' + KP[o.pat]() + "</g>";
    return '<svg class="kit-svg" width="' + w + '" height="' + w + '" viewBox="0 0 64 64" aria-hidden="true" style="flex:none;display:inline-block;vertical-align:middle">' +
      (inner ? "<defs>" + defs + '<clipPath id="' + id + '"><path d="' + KD + '"/></clipPath></defs>' : "") +
      '<path d="' + KD + '" fill="' + c[0] + '"/>' +
      (inner ? '<g clip-path="url(#' + id + ')">' + inner + "</g>" : "") +
      '<path d="M26 4Q32 10 38 4" fill="none" stroke="' + c[2] + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M7.5 18.5L13.5 29.5M56.5 18.5L50.5 29.5" stroke="' + c[2] + '" stroke-width="2.5"/>' +
      '<path d="M18 24V59M46 24V59" stroke="rgba(0,0,0,.18)" stroke-width="1"/>' +
      '<path d="' + KD + '" fill="none" stroke="' + OUT + '" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  };
})();
