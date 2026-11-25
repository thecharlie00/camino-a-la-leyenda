/* ===== TROFEOS =====
   Iconos originales: cada competición tiene un trofeo inventado (forma + metal + franja de color).
   No reproducen los trofeos reales, que son diseños protegidos. */
var TROPHY_METALS = {
  gold: ["#7a561a", "#d9a93c", "#fff4c4", "#f7dc7a", "#8a6420"],
  silver: ["#56626a", "#b6c2c8", "#ffffff", "#e3eaee", "#6c7980"],
  bronze: ["#5c371a", "#b67a45", "#f6cda3", "#d99a63", "#6b4220"],
  rose: ["#7a3f34", "#d98e7c", "#ffe3da", "#f0b3a2", "#8c4c40"],
  teal: ["#164a44", "#3fb59c", "#d2fff4", "#5fe0c4", "#1d5f55"],
  iron: ["#2c3437", "#6f7b7f", "#c3ccd0", "#8b979b", "#323b3e"]
};
/* [forma, metal] por competición */
var TROPHY_SPEC = {
  UCL: ["wing", "gold"], UEL: ["tallcup", "bronze"], UECL: ["diamond", "teal"], LIB: ["flame", "gold"], SUD: ["cone", "silver"],
  CCC: ["star", "silver"], ACL: ["spire", "rose"], CAF: ["cone", "gold"], CWC: ["obelisk", "gold"], ICC: ["wing", "silver"],
  USC: ["diamond", "silver"], REC: ["goblet", "bronze"],
  WC: ["star", "gold"], EURO: ["spire", "silver"], CA: ["ring", "silver"], AFCON: ["ring", "gold"], ASIAN: ["flame", "silver"],
  GOLD: ["diamond", "gold"], OFCN: ["obelisk", "silver"], NLF: ["wing", "teal"], OLY: ["medal", "gold"],
  /* premios individuales y de entrenador */
  bdo: ["ball", "gold"], bdo_pod: ["ball", "silver"], bdo_nom: ["ball", "iron"], best: ["wing", "rose"], goldenboy: ["star", "rose"],
  kopa: ["flame", "bronze"], yashin: ["glove", "gold"], boot: ["boot", "gold"], tboot: ["boot", "gold"], tball: ["ball", "rose"],
  pichichi: ["boot", "bronze"], asist: ["boot", "silver"], mvp: ["medal", "gold"], tots: ["laurel", "silver"], young: ["medal", "teal"],
  zamora: ["glove", "silver"], xi: ["laurel", "gold"], pom: ["medal", "bronze"],
  mgr_year: ["board", "gold"], mgr_lg: ["board", "silver"], mgr_month: ["board", "bronze"], mgr_cup: ["laurel", "bronze"]
};
function trophyHue(s) { return "hsl(" + (hashStr(String(s)) % 360) + ",62%,46%)"; }
function trophySpec(k) {
  k = String(k || "");
  if (TROPHY_SPEC[k]) return TROPHY_SPEC[k];
  if (k.indexOf("L:") === 0) { var id = k.slice(2), li = W.lgIdx ? W.lgIdx[id] : null, t = li != null && W.lg[li] ? W.lg[li].t : 1; return ["shield", t === 1 ? "gold" : "silver", trophyHue(id)]; }
  if (k.indexOf("CUP:") === 0) return ["goblet", "silver", trophyHue("c" + k.slice(4))];
  if (k.indexOf("SC:") === 0) return ["cone", "bronze", trophyHue("s" + k.slice(3))];
  return ["goblet", "gold"];
}
/* degradados compartidos: se insertan una sola vez en el documento */
function trophyDefs() {
  var s = '<svg width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs>';
  Object.keys(TROPHY_METALS).forEach(function (k) {
    var c = TROPHY_METALS[k];
    s += '<linearGradient id="tg-' + k + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c[4] + '"/><stop offset=".3" stop-color="' + c[3] + '"/>' +
      '<stop offset=".46" stop-color="' + c[2] + '"/><stop offset=".64" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient>';
  });
  s += '<linearGradient id="tg-plinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a545b"/><stop offset="1" stop-color="#16252a"/></linearGradient>';
  return s + "</defs></svg>";
}
function starPts(cx, cy, R, r, n) {
  var out = [];
  for (var i = 0; i < n * 2; i++) {
    var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
    out.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
  }
  return out.join(" ");
}
function trophySVG(key, size, label) {
  var sp = trophySpec(key), shape = sp[0], F = 'fill="url(#tg-' + sp[1] + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8" stroke-linejoin="round"', band = sp[2];
  var shine = function (d) { return '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>'; };
  var plinth = function () {
    var s = '<path d="M17 51h30l2.5 9h-35z" fill="url(#tg-plinth)"/><path d="M17 51h30v1.6H17z" fill="rgba(255,255,255,.18)"/>';
    if (band) s += '<path d="M15.4 55.4h33.2l.6 2.2H14.8z" fill="' + band + '"/>';
    return s;
  };
  var b = "";
  switch (shape) {
    case "goblet":
      b = plinth() + '<path d="M23 41.5h18l3 9.5H20z" ' + F + '/><path d="M29.5 31.5h5l1 10h-7z" ' + F + '/>' +
        '<path d="M15 9h34c0 15-7.5 23-17 23S15 24 15 9z" ' + F + '/><path d="M15 9h34v2.4H15z" fill="rgba(255,255,255,.3)"/>' + shine("M20 13c.6 7 3 11.5 6.5 14");
      break;
    case "wing":
      b = plinth() + '<path d="M24 41.5h16l3.5 9.5h-23z" ' + F + '/><path d="M29.5 28.5h5l1.2 13h-7.4z" ' + F + '/>' +
        '<path d="M23.5 11C15 10 9 14.5 5.5 23.5c4.6-2.6 10-3.3 18.8-1.8z" ' + F + '/><path d="M40.5 11C49 10 55 14.5 58.5 23.5c-4.6-2.6-10-3.3-18.8-1.8z" ' + F + '/>' +
        '<path d="M23 8h18c0 13-3.6 21-9 21s-9-8-9-21z" ' + F + '/>' + shine("M26.5 12c.3 6 1.6 10 3.6 12.5");
      break;
    case "cone":
      b = plinth() + '<path d="M22.5 41.5h19l3 9.5h-25z" ' + F + '/><path d="M29.5 35h5v7h-5z" ' + F + '/>' +
        '<path d="M13 8h38L35.5 36h-7z" ' + F + '/><ellipse cx="32" cy="8" rx="19" ry="2.6" fill="rgba(255,255,255,.35)"/>' + shine("M19 12l9 18");
      break;
    case "spire":
      b = plinth() + '<path d="M24 44h16l2 7H22z" ' + F + '/><path d="M27.5 20l-6 10 4.4 1.6zM36.5 20l6 10-4.4 1.6z" ' + F + '/>' +
        '<path d="M27.5 11h9l3 33.5h-15z" ' + F + '/><path d="M32 2l4.5 9h-9z" ' + F + '/>' + shine("M30 15l-.8 25");
      break;
    case "shield":
      b = plinth() + '<path d="M28.5 42h7v9h-7z" ' + F + '/><path d="M17 7h30v15c0 11.5-7 18.5-15 21.5C24 40.5 17 33.5 17 22z" ' + F + '/>' +
        (band ? '<path d="M29 7.4h6v34.2c-1 .5-2 .8-3 .9-1-.1-2-.4-3-.9z" fill="' + band + '"/>' : "") +
        '<path d="M20.5 10.5h23V22c0 9-5.2 14.6-11.5 17.4C25.7 36.6 20.5 31 20.5 22z" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>';
      break;
    case "star":
      b = plinth() + '<path d="M28 30h8l1.2 21H26.8z" ' + F + '/><polygon points="' + starPts(32, 17, 15, 6.4, 5) + '" ' + F + '/>' +
        '<polygon points="' + starPts(32, 17, 6.5, 2.8, 5) + '" fill="rgba(255,255,255,.4)"/>';
      break;
    case "flame":
      b = plinth() + '<path d="M23 46h18l2 5H21z" ' + F + '/><path d="M29.5 43h5v3.4h-5z" ' + F + '/>' +
        '<path d="M32 3c7 9 11.5 14.5 10.5 22-.7 5-4.4 8.5-10.5 8.5S22.2 30 21.5 25c-.8-6 3-10.5 6.5-15 .9 4 2.4 6.3 4.5 7.2C33.6 12.6 33.6 8 32 3z" ' + F + '/>' +
        '<path d="M32 14.5c3.4 4.8 5 8.3 4.4 11.6-.4 2.5-2.1 4.2-4.4 4.2s-4-1.7-4.4-4.2c-.5-3 1.3-6 3.1-8.3.4 1.8 1 2.8 1.9 3.2.3-2.2 0-4.3-.6-6.5z" fill="rgba(255,255,255,.45)"/>' +
        '<path d="M20 33h24c0 7-5.5 11-12 11s-12-4-12-11z" ' + F + '/>';
      break;
    case "diamond":
      b = plinth() + '<path d="M24 45h16l2.5 6h-21z" ' + F + '/><path d="M30 41h4v4.4h-4z" ' + F + '/>' +
        '<path d="M32 3l15 19-15 21-15-21z" ' + F + '/><path d="M32 3l-6 19 6 21 6-21z" fill="rgba(255,255,255,.28)"/><path d="M17 22h30" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>';
      break;
    case "tallcup":
      b = plinth() + '<path d="M24.5 43.5h15l3 7.5h-21z" ' + F + '/><path d="M30 37.5h4l.8 6.4h-5.6z" ' + F + '/>' +
        '<path d="M23.6 11 16 15.5v8.5l8.2 3.4.6-3-5.4-2.3v-5.2l4.6-2.8zM40.4 11 48 15.5v8.5l-8.2 3.4-.6-3 5.4-2.3v-5.2l-4.6-2.8z" ' + F + '/>' +
        '<path d="M23 6h18c0 19-2.4 28-9 32-6.6-4-9-13-9-32z" ' + F + '/>' + shine("M26.5 10c.3 9 1.6 15.5 4.2 20");
      break;
    case "ring":
      b = plinth() + '<path d="M23 43.5h18l3 7.5H20z" ' + F + '/><path d="M29.5 31.5h5l1.5 12h-8z" ' + F + '/>' +
        '<path fill-rule="evenodd" d="M32 4a14 14 0 1 1 0 28a14 14 0 1 1 0-28zM32 11a7 7 0 1 0 0 14a7 7 0 1 0 0-14z" ' + F + '/>' + shine("M21.5 13.5c-1.6 2.6-2 5.4-1.4 8");
      break;
    case "obelisk":
      b = plinth() + '<path d="M23 45h18l1.6 6H21.4z" ' + F + '/><path d="M27 11h10l2.4 34h-14.8z" ' + F + '/>' +
        '<path d="M31.2 14h1.6l.9 27h-3.4z" fill="rgba(0,0,0,.2)"/><path d="M27 11l5-8 5 8z" ' + F + '/>';
      break;
    case "medal":
      b = '<path d="M21 3h9l6 17h-9z" fill="' + (band || "#c43d4b") + '"/><path d="M43 3h-9l-6 17h9z" fill="#2f6fbf"/>' +
        '<circle cx="32" cy="22" r="2.6" ' + F + '/><circle cx="32" cy="39" r="15" ' + F + '/><circle cx="32" cy="39" r="10.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' +
        '<polygon points="' + starPts(32, 39.5, 6.4, 2.7, 5) + '" fill="rgba(0,0,0,.2)"/>' + shine("M22 34c-.9 2.6-.9 5.4 0 8");
      break;
    case "laurel":
      var lv = "";
      for (var i = 0; i < 8; i++) {
        var ad = 104 + i * 20, a = ad * Math.PI / 180, x = 32 + 18 * Math.cos(a), y = 28 + 18 * Math.sin(a), rot = ad + 62;
        lv += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5" ry="2.1" transform="rotate(' + rot.toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" ' + F + '/>';
        var x2 = 64 - x;
        lv += '<ellipse cx="' + x2.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5" ry="2.1" transform="rotate(' + (-rot).toFixed(0) + " " + x2.toFixed(1) + " " + y.toFixed(1) + ')" ' + F + '/>';
      }
      b = '<path d="M30 45.5C16 42 11 30 15.5 13M34 45.5C48 42 53 30 48.5 13" fill="none" stroke="url(#tg-' + sp[1] + ')" stroke-width="2"/>' + lv +
        '<path d="M27 47l5-3.4 5 3.4-2.4 6-2.6-2.6-2.6 2.6z" fill="' + (band || "#c43d4b") + '"/>';
      break;
    case "boot":
      b = plinth() + '<g transform="translate(0 4)"><path d="M12 38c0-5 4-7.5 8-9.5l4-12.5h11v11.5c6.5 1.6 15.5 3.4 18 8.6 1.4 3-.4 6-4.6 6H16c-2.6 0-4-1.6-4-4.1z" ' + F + '/>' +
        '<path d="M25 21h9M24.5 24.5h9.5M24 28h10" stroke="rgba(0,0,0,.3)" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M17 42.2h3v3h-3zM24 42.2h3v3h-3zM38 42.2h3v3h-3zM45 42.2h3v3h-3z" ' + F + '/></g>';
      break;
    case "glove":
      b = plinth() + '<path d="M22 44h20v7H22z" fill="url(#tg-plinth)" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>' +
        '<rect x="20" y="9" width="5.4" height="21" rx="2.7" ' + F + '/><rect x="26" y="5" width="5.4" height="24" rx="2.7" ' + F + '/>' +
        '<rect x="32" y="6" width="5.4" height="23" rx="2.7" ' + F + '/><rect x="38" y="10" width="5" height="19" rx="2.5" ' + F + '/>' +
        '<path d="M19.5 27c0-2.6 2-4 4-4h16c2.4 0 4 1.4 4 4v12c0 3.6-2.6 5.6-5.6 5.6H25c-3 0-5.5-2-5.5-5.6z" ' + F + '/>' +
        '<path d="M19.6 31c-3.4-1-6.4-3.6-7-7.6-.3-2.4 2.3-3.2 3.8-1.6l4.2 4.6z" ' + F + '/>' + shine("M23 30v8");
      break;
    case "ball":
      var pent = [], spokes = "";
      for (var j = 0; j < 5; j++) {
        var an = -Math.PI / 2 + j * 2 * Math.PI / 5, px = 32 + 6 * Math.cos(an), py = 25 + 6 * Math.sin(an);
        pent.push(px.toFixed(1) + "," + py.toFixed(1));
        spokes += "M" + px.toFixed(1) + " " + py.toFixed(1) + "L" + (32 + 16 * Math.cos(an)).toFixed(1) + " " + (25 + 16 * Math.sin(an)).toFixed(1);
      }
      b = plinth() + '<path d="M26 41.5h12l1.6 9.5H24.4z" ' + F + '/><circle cx="32" cy="25" r="16.5" ' + F + '/>' +
        '<polygon points="' + pent.join(" ") + '" fill="rgba(0,0,0,.28)"/><path d="' + spokes + '" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/>' + shine("M20.5 18.5c-1.6 3-2 6.4-1.2 9.6");
      break;
    case "board":
      b = plinth() + '<path d="M21 51l6-15M43 51l-6-15" stroke="url(#tg-' + sp[1] + ')" stroke-width="2.6" stroke-linecap="round"/>' +
        '<rect x="10" y="7" width="44" height="31" rx="3" ' + F + '/><rect x="13.5" y="10.5" width="37" height="24" rx="1.5" fill="#1f5a3a"/>' +
        '<path d="M32 10.5v24" stroke="rgba(255,255,255,.65)" stroke-width="1"/><circle cx="32" cy="22.5" r="4" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1"/>' +
        '<path d="M17.5 15l3 3m0-3l-3 3M42 26.5a2 2 0 1 0 .1 0" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
        '<path d="M21 27c4-6 9-8 16-8" stroke="url(#tg-' + sp[1] + ')" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M37 19l-2.6-2m2.6 2l-2.4 2.2" stroke="url(#tg-' + sp[1] + ')" stroke-width="1.6" stroke-linecap="round"/>';
      break;
  }
  return '<svg class="tro" viewBox="0 0 64 64" width="' + (size || 48) + '" height="' + (size || 48) + '"' + (label ? ' role="img" aria-label="' + String(label).replace(/"/g, "&quot;") + '"' : ' aria-hidden="true"') + ">" + b + "</svg>";
}
