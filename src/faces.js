/* faces.js — caras procedurales por capas (versión 3.7).
   Cada jugador tiene una cara fija calculada con un hash de su id y su nombre: no se guarda ninguna imagen,
   solo se deriva un vector corto [piel, pelo, color, barba, ojos, nariz, boca] que siempre da el mismo resultado.
   Piel: 6 tonos · Pelo: 20 estilos y 6 colores · Barba: 8 estilos · Ojos: 4 · Nariz: 3 · Boca: 3. */
var FACE_SKIN = ["#f6d7c3", "#ecbf9e", "#d9a07a", "#b97a52", "#8d5a3b", "#5e3b27"];
var FACE_HAIRC = ["#1d1714", "#3b2619", "#6b4428", "#b98a4d", "#a8462a", "#9a9a9a"];
/* probabilidades de tono de piel por confederación (un reparto aproximado, solo para variar) */
var FACE_SKIN_W = {
  UEFA: [30, 30, 18, 10, 8, 4], CONMEBOL: [12, 22, 28, 20, 12, 6], CONCACAF: [10, 18, 26, 20, 16, 10],
  CAF: [2, 4, 10, 18, 30, 36], CAFN: [6, 22, 36, 24, 10, 2], AFC: [12, 30, 32, 16, 7, 3], OFC: [8, 16, 26, 26, 16, 8]
};
var FACE_NAFR = {MA: 1, DZ: 1, TN: 1, EG: 1, LY: 1};
/* estilos de pelo: [clave, peso hombres, peso mujeres] */
var FACE_HAIR = [["bald", 5, 0], ["buzz", 12, 1], ["short", 14, 3], ["crew", 10, 1], ["side", 9, 2], ["quiff", 7, 1], ["spiky", 5, 1],
  ["curly", 8, 4], ["afro", 4, 3], ["mohawk", 2, 1], ["long", 3, 16], ["bun", 2, 12], ["pony", 0, 18], ["braids", 2, 8], ["dreads", 3, 3],
  ["slick", 6, 2], ["fringe", 5, 4], ["wavy", 5, 8], ["recede", 4, 0], ["bob", 0, 12]];
var FACE_BEARD = ["none", "stubble", "short", "full", "goatee", "tache", "chin", "chops"];

function faceRnd(seed) { var s = seed >>> 0; return function () { s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909); s = (s ^ (s >>> 16)) >>> 0; return s / 4294967296; }; }
function facePickW(r, w) { var t = 0, i; for (i = 0; i < w.length; i++) t += w[i]; var x = r() * t; for (i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; }
function faceFem() { return !!(typeof S !== "undefined" && S && S.g === "f"); }
/* vector de rasgos de un jugador (determinista) */
function faceOf(p) {
  if (!p) return null;
  if (p.face && p.face.length === 7) return p.face;
  var key = (p.id != null ? p.id : "") + "|" + (p.fn || "") + "|" + (p.ln || "") + "|" + (p.nat != null ? p.nat : "");
  var r = faceRnd(typeof hashStr === "function" ? hashStr(key) : key.length * 2654435761);
  var c = (typeof W !== "undefined" && W && W.ctry && p.nat != null && W.ctry[p.nat]) ? W.ctry[p.nat] : null;
  var conf = c ? (c.conf === "CAF" && FACE_NAFR[c.code] ? "CAFN" : c.conf) : "UEFA";
  var skin = facePickW(r, FACE_SKIN_W[conf] || FACE_SKIN_W.UEFA);
  var fem = faceFem();
  var hair = facePickW(r, FACE_HAIR.map(function (x) { return fem ? x[2] : x[1]; }));
  var hk = FACE_HAIR[hair][0];
  /* color: pieles claras con más variedad; canas con la edad */
  var hcW = skin <= 1 ? [24, 30, 22, 16, 7, 1] : skin <= 3 ? [46, 34, 14, 4, 1, 1] : [80, 16, 3, 1, 0, 0];
  var hc = facePickW(r, hcW);
  if ((p.age || 25) >= 33 && r() < 0.35 + ((p.age || 25) - 33) * 0.08) hc = 5;
  if (!fem && (p.age || 25) >= 31 && hk !== "bald" && r() < 0.25) hair = 18;
  if ((hk === "afro" || hk === "dreads" || hk === "braids") && skin <= 1 && r() < 0.6) hair = 7;
  var beard = fem ? 0 : facePickW(r, (p.age || 25) <= 19 ? [70, 22, 4, 0, 2, 2, 0, 0] : [30, 22, 14, 10, 9, 5, 6, 4]);
  return [skin, hair, hc, beard, Math.floor(r() * 4), Math.floor(r() * 3), Math.floor(r() * 3)];
}
/* SVG de la cara; o = {c1, c2} colores de la camiseta */
function faceSVG(p, size, o) {
  var f = faceOf(p); if (!f) return "";
  o = o || {};
  var sk = FACE_SKIN[f[0]], hk = FACE_HAIR[f[1]][0], hc = FACE_HAIRC[f[2]], bd = FACE_BEARD[f[3]];
  var dark = f[0] >= 4, shade = dark ? "rgba(0,0,0,.22)" : "rgba(120,60,40,.18)";
  var c1 = o.c1 || "#2c6fb7", c2 = o.c2 || "#ffffff";
  var s = '<svg class="face" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">';
  /* pelo largo por detrás */
  if (hk === "long" || hk === "wavy" || hk === "braids" || hk === "dreads") {
    var lw = hk === "dreads" || hk === "braids" ? 25 : 22;
    s += '<path d="M' + (32 - lw) + ' 28 Q' + (32 - lw) + ' 8 32 8 Q' + (32 + lw) + ' 8 ' + (32 + lw) + ' 28 L' + (32 + lw - 1) + ' ' + (hk === "wavy" ? 46 : 52) + ' L' + (32 - lw + 1) + ' ' + (hk === "wavy" ? 46 : 52) + 'Z" fill="' + hc + '"/>';
    if (hk === "dreads" || hk === "braids") for (var di = 0; di < 6; di++) s += '<rect x="' + (9 + di * 8.4) + '" y="30" width="3.4" height="22" rx="1.7" fill="' + hc + '" opacity=".95"/>';
  }
  if (hk === "bob") s += '<path d="M15 30 Q14 9 32 9 Q50 9 49 30 L49 40 Q44 42 40 39 L24 39 Q20 42 15 40Z" fill="' + hc + '"/>';
  if (hk === "pony") s += '<path d="M44 16 Q56 22 52 42 Q49 34 45 28Z" fill="' + hc + '"/>';
  /* camiseta y cuello */
  s += '<path d="M6 64 Q8 50 22 47 L42 47 Q56 50 58 64Z" fill="' + c1 + '"/><path d="M25 47 L32 55 L39 47" fill="none" stroke="' + c2 + '" stroke-width="3" stroke-linejoin="round"/>';
  s += '<path d="M26 40 L26 49 Q32 53 38 49 L38 40Z" fill="' + sk + '"/><path d="M26 44 Q32 48 38 44 L38 40 L26 40Z" fill="' + shade + '"/>';
  /* orejas y cabeza */
  s += '<circle cx="17.6" cy="30" r="3.6" fill="' + sk + '"/><circle cx="46.4" cy="30" r="3.6" fill="' + sk + '"/>';
  s += '<ellipse cx="32" cy="28.5" rx="14.2" ry="16" fill="' + sk + '"/>';
  /* barba (debajo de la boca y la nariz) */
  var bc = hc;
  if (bd === "stubble") s += '<path d="M19.5 32 Q20 44 32 45 Q44 44 44.5 32 Q41 39 32 39.5 Q23 39 19.5 32Z" fill="' + bc + '" opacity=".28"/>';
  else if (bd === "short") s += '<path d="M18.6 29 Q19 45 32 45.5 Q45 45 45.4 29 Q43 37 38 37.5 L26 37.5 Q21 37 18.6 29Z" fill="' + bc + '" opacity=".88"/>';
  else if (bd === "full") s += '<path d="M18 27 Q17.6 49 32 49.5 Q46.4 49 46 27 Q44 37 38 37 L26 37 Q20 37 18 27Z" fill="' + bc + '"/>';
  else if (bd === "goatee") s += '<path d="M27 38.5 Q32 37 37 38.5 L36 44 Q32 46.5 28 44Z" fill="' + bc + '"/>';
  else if (bd === "chin") s += '<path d="M18.8 30 Q19.5 45 32 45.5 Q44.5 45 45.2 30 L44 30 Q43 42 32 42.5 Q21 42 20 30Z" fill="' + bc + '"/>';
  else if (bd === "chops") s += '<path d="M18.6 27 L21 27 L22 39 Q20 38 18.6 33Z M45.4 27 L43 27 L42 39 Q44 38 45.4 33Z" fill="' + bc + '"/>';
  /* ojos y cejas */
  var ey = 27.5, eb = '<path d="M21.5 22.6 Q25 21 28.5 22.6 M35.5 22.6 Q39 21 42.5 22.6" stroke="' + (f[2] === 5 ? "#7a7a7a" : hc) + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
  if (f[4] === 0) s += '<circle cx="25" cy="' + ey + '" r="1.7" fill="#1b1410"/><circle cx="39" cy="' + ey + '" r="1.7" fill="#1b1410"/>';
  else if (f[4] === 1) s += '<ellipse cx="25" cy="' + ey + '" rx="2.6" ry="1.5" fill="#fff"/><ellipse cx="39" cy="' + ey + '" rx="2.6" ry="1.5" fill="#fff"/><circle cx="25.3" cy="' + ey + '" r="1.2" fill="#2a1d14"/><circle cx="39.3" cy="' + ey + '" r="1.2" fill="#2a1d14"/>';
  else if (f[4] === 2) s += '<path d="M22.5 ' + ey + ' Q25 26 27.5 ' + ey + ' M36.5 ' + ey + ' Q39 26 41.5 ' + ey + '" stroke="#1b1410" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  else s += '<ellipse cx="25" cy="' + ey + '" rx="2.2" ry="2" fill="#fff"/><ellipse cx="39" cy="' + ey + '" rx="2.2" ry="2" fill="#fff"/><circle cx="25" cy="' + (ey + 0.2) + '" r="1.35" fill="#3a2a1c"/><circle cx="39" cy="' + (ey + 0.2) + '" r="1.35" fill="#3a2a1c"/>';
  s += eb;
  /* nariz */
  if (f[5] === 0) s += '<path d="M32 29 L30.6 34.4 Q32 35.2 33.6 34.4" stroke="' + shade.replace(/[\d.]+\)$/, ".55)") + '" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  else if (f[5] === 1) s += '<path d="M29.4 34.6 Q32 36.4 34.6 34.6" stroke="' + shade.replace(/[\d.]+\)$/, ".6)") + '" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="32" rx="2" ry="3" fill="' + shade + '"/>';
  else s += '<circle cx="32" cy="33.6" r="2.2" fill="' + shade + '"/>';
  /* bigote */
  if (bd === "tache" || bd === "full" || bd === "goatee" || bd === "short") s += '<path d="M26.5 37.6 Q32 35 37.5 37.6 Q32 37 26.5 37.6Z" fill="' + bc + '" stroke="' + bc + '" stroke-width="1.6" stroke-linejoin="round"/>';
  /* boca */
  if (f[6] === 0) s += '<path d="M28 39.6 Q32 42.4 36 39.6" stroke="#7a3a2c" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  else if (f[6] === 1) s += '<path d="M28.6 40 L35.4 40" stroke="#7a3a2c" stroke-width="1.5" stroke-linecap="round"/>';
  else s += '<path d="M27.6 39.2 Q32 44.6 36.4 39.2Z" fill="#fff" stroke="#7a3a2c" stroke-width="1.2" stroke-linejoin="round"/>';
  /* pelo por delante */
  var H = function (d) { s += '<path d="' + d + '" fill="' + hc + '"/>'; };
  switch (hk) {
    case "buzz": s += '<path d="M18 25 Q18 12 32 12 Q46 12 46 25 Q40 18 32 18 Q24 18 18 25Z" fill="' + hc + '" opacity=".7"/>'; break;
    case "short": H("M17.6 27 Q16 10 32 10 Q48 10 46.4 27 Q44 19 38 17.5 Q30 20 22 18 Q19 21 17.6 27Z"); break;
    case "crew": H("M18 25 Q17 10 32 10.5 Q47 10 46 25 Q43 17 32 16 Q21 17 18 25Z"); break;
    case "side": H("M17.4 28 Q15.5 9 33 9.5 Q49 10 46.6 27 Q45 18 40 16.5 Q30 15 25 20 Q20 22 17.4 28Z"); break;
    case "quiff": H("M17.8 26 Q17 13 26 11 Q30 4 40 7 Q48 10 46.2 26 Q43 17 36 16 Q27 17 22 19 Q19 22 17.8 26Z"); break;
    case "spiky": H("M17.6 26 L19 14 L23 17 L25 8 L29 14 L32 6 L35 14 L39 8 L41 17 L45 14 L46.4 26 Q41 18 32 18 Q23 18 17.6 26Z"); break;
    case "curly": for (var ci2 = 0; ci2 < 9; ci2++) s += '<circle cx="' + (18 + ci2 * 3.5) + '" cy="' + (16 + (ci2 % 2 ? -3 : 0) + Math.abs(ci2 - 4) * 1.2) + '" r="4.6" fill="' + hc + '"/>'; break;
    case "afro": s += '<ellipse cx="32" cy="15" rx="19" ry="10.6" fill="' + hc + '"/><path d="M14 30 Q12 20 17 16 L19 28Z M50 30 Q52 20 47 16 L45 28Z" fill="' + hc + '"/>'; break;
    case "mohawk": H("M28.5 18 Q28 4 32 3 Q36 4 35.5 18Z"); s += '<path d="M18 25 Q18 13 32 13 Q46 13 46 25 Q40 19 32 19 Q24 19 18 25Z" fill="' + hc + '" opacity=".35"/>'; break;
    case "long": case "wavy": H("M17 31 Q15 9 32 9 Q49 9 47 31 Q46 20 41 16 Q34 21 26 19 Q20 22 17 31Z"); break;
    case "bun": H("M17.6 26 Q16.5 10 32 10 Q47.5 10 46.4 26 Q44 17 32 16 Q20 17 17.6 26Z"); s += '<circle cx="32" cy="7" r="5.6" fill="' + hc + '"/>'; break;
    case "pony": H("M17.6 26 Q16.5 10 32 10 Q47.5 10 46.4 26 Q44 16 32 15.5 Q20 16 17.6 26Z"); break;
    case "braids": case "dreads": H("M17 29 Q15.5 9 32 9 Q48.5 9 47 29 Q44 17 32 16 Q20 17 17 29Z"); break;
    case "slick": H("M18 24 Q17 9 32 9.5 Q47 9 46 24 Q44 15 32 14.5 Q20 15 18 24Z"); s += '<path d="M23 13 Q32 10.5 41 13" stroke="rgba(255,255,255,.18)" stroke-width="1.2" fill="none"/>'; break;
    case "fringe": H("M17.4 27 Q15.5 9 32 9 Q48.5 9 46.6 27 L46 22 Q40 23 34 21 Q27 23 21 21.5 L17.4 27Z"); break;
    case "recede": H("M17.8 27 Q17 15 22 13 Q23 19 20 23Z M46.2 27 Q47 15 42 13 Q41 19 44 23Z"); s += '<path d="M24 14 Q32 11.5 40 14" stroke="' + hc + '" stroke-width="2" fill="none" opacity=".5"/>'; break;
    case "bob": H("M17 26 Q16 10 32 10 Q48 10 47 26 Q44 17 36 16 Q28 19 20 18 Q18 21 17 26Z"); break;
    default: break; /* calvo */
  }
  if (hk === "bald") s += '<ellipse cx="27" cy="17" rx="4.5" ry="2.4" fill="rgba(255,255,255,.18)"/>';
  return s + "</svg>";
}
