/* ui-gxev.js — escenas de vóxeles para las decisiones nuevas (5.6): vestuario, sala de prensa, despacho,
   casa, fiesta, calle, hospital, aeropuerto, entrenamiento, estadio y campo, con los colores del club
   y tu jugador dentro. Se dibujan una vez, se guardan y entran con su animación. */
(function () {
  if (typeof UIX === "undefined" || typeof GXV === "undefined") return;
  var U = UIX;
  function cols() { try { var cc = clubColors(W.clubs[S.mode === "mgr" && S.m ? S.m.club : S.p.club].n); return [cc[0] || "#c8312f", cc[1] || "#f4f4f0"]; } catch (e) { return ["#c8312f", "#f4f4f0"]; } }
  /* 5.7: el mismo aspecto que en «Yo» (PLook); en modo míster, el míster */
  /* el míster va vestido según la escena: chándal en el entrenamiento, traje (sin abrigo) en sala de prensa y despacho, abrigo fuera si hace frío */
  var SCK = {training: "train", stadium: "match", street: "out", locker: "indoor", press: "indoor", office: "indoor", home: "indoor", hospital: "indoor", party: "indoor", plane: "indoor"};
  function look(sc) {
    var o = {skin: "#c18a5e", hair: "#1d1612"};
    try {
      if (S.mode === "mgr") { var c = PLook.coach({kind: SCK[sc] || "indoor", cold: PLook.cold(null)}); o.skin = c.skin; o.hair = c.hair; o.boots = c.shoes; o.shirt = c.coat || c.suit; o.legs = c.suit; o.tie = c.tie; o.scarf = c.scarf; }
      else { var p = PLook.player(); o.skin = p.skin; o.hair = p.hair; o.boots = p.boots; }
    } catch (e) {}
    return o;
  }
  function build(sc, C, lk) {
    var V = {};
    function box(x0, x1, y0, y1, z0, z1, c) { for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) V[x + "," + y + "," + z] = c; }
    function floor(c1, c2) { for (var x = -11; x <= 11; x++) for (var z = -6; z <= 6; z++) V[x + ",0," + z] = (x + z) % 2 === 0 ? c1 : c2 || c1; }
    function wall(c1, c2, h) { for (var x = -11; x <= 11; x++) for (var y = 1; y <= (h || 9); y++) V[x + "," + y + ",-6"] = (y % 3 === 0 && c2) ? c2 : c1; }
    function man(x, z, shirt, shorts) { box(x, x, 1, 1, z, z, lk.boots || "#1b1d1f"); box(x + 1, x + 1, 1, 1, z, z, lk.boots || "#1b1d1f"); box(x, x + 1, 2, 2, z, z, lk.legs || "#1b1d1f"); box(x, x + 1, 3, 3, z, z, lk.legs || shorts || "#f4f4f0"); box(x - 1, x + 2, 4, 6, z, z, lk.shirt || shirt);
      if (lk.tie) { box(x, x + 1, 6, 6, z, z, "#f4f4f0"); box(x, x, 4, 5, z, z, lk.tie); } if (lk.scarf) box(x - 1, x + 2, 6, 6, z, z, lk.scarf); box(x, x + 1, 7, 8, z, z, lk.skin); box(x, x + 1, 9, 9, z, z, lk.hair); box(x - 1, x - 1, 4, 5, z, z, lk.skin); box(x + 2, x + 2, 4, 5, z, z, lk.skin); }
    function ball(x, y, z) { V[x + "," + y + "," + z] = "#f4f4f0"; V[(x + 1) + "," + y + "," + z] = "#1b1d1f"; }
    switch (sc) {
      case "locker":
        floor("#8a6a44", "#7a5c3a"); wall("#2a4a5a", "#24404e", 9);
        for (var i = -10; i <= 8; i += 3) { box(i, i + 1, 1, 8, -5, -5, "#3a4b50"); box(i, i + 1, 6, 7, -4, -4, i % 2 ? C[0] : C[1]); V[i + ",4,-4"] = "#ffb21e"; }
        box(-8, 8, 2, 2, 0, 1, "#a8703a"); box(-8, -8, 1, 1, 0, 1, "#5a3a22"); box(8, 8, 1, 1, 0, 1, "#5a3a22");
        box(-3, 0, 3, 5, -4, -4, C[0]); man(3, 2, C[0]); break;
      case "training":
        floor("#3fa860", "#378f52"); [[-8, 2], [-4, -2], [0, 3], [4, -1], [8, 2]].forEach(function (c) { box(c[0], c[0], 1, 2, c[1], c[1], "#ff7a1a"); V[c[0] + ",3," + c[1]] = "#ffb21e"; });
        box(-10, -10, 1, 5, -5, -5, "#f4f4f0"); box(-4, -4, 1, 5, -5, -5, "#f4f4f0"); box(-10, -4, 5, 5, -5, -5, "#f4f4f0"); ball(5, 1, 3); ball(-2, 1, 4); man(0, 0, C[0]); break;
      case "party":
        floor("#1d1430", "#2a1a4a"); wall("#120c22", "#3a2a66", 10); [[-9, "#ff4fb1"], [-3, "#2de0ff"], [3, "#ffb21e"], [9, "#7a3ad8"]].forEach(function (l) { box(l[0], l[0] + 1, 1, 1, -3, 3, l[1]); });
        box(-1, 1, 11, 13, -1, 1, "#cfd8dc"); V["0,14,0"] = "#91a4a6"; box(-11, -9, 1, 5, -5, -4, "#1b1d1f"); box(9, 11, 1, 5, -5, -4, "#1b1d1f"); man(-2, 1, "#2a2a3a", "#1b1d1f"); man(3, 0, C[0]); break;
      case "home":
        floor("#b08a5a", "#a07a4a"); wall("#d8cdb8", "#cbbfa8", 9); box(-9, -2, 1, 2, -5, -3, "#3a5a7a"); box(-9, -2, 3, 5, -5, -5, "#2f4a66"); box(-9, -9, 3, 3, -5, -3, "#2f4a66"); box(-2, -2, 3, 3, -5, -3, "#2f4a66");
        box(3, 9, 4, 8, -5, -5, "#16191b"); box(4, 8, 5, 7, -5, -5, "#2de0ff"); box(5, 7, 1, 3, -5, -5, "#5a3a22"); box(9, 10, 1, 4, 3, 4, "#3fa860"); box(-6, 4, 0, 0, -1, 3, "#c8312f"); man(0, 1, C[0]); break;
      case "office":
        floor("#5a4a3a", "#4f4032"); wall("#e8e2d4", "#d8d0bf", 10); box(-8, -3, 4, 8, -6, -6, "#9fd8ff"); box(2, 9, 6, 6, -5, -5, "#5a3a22"); [3, 5, 7].forEach(function (x) { box(x, x, 7, 8, -5, -5, "#f6c83a"); });
        box(-6, 6, 4, 4, -1, 2, "#7a5a3a"); box(-6, -6, 1, 3, -1, -1, "#5a3a22"); box(6, 6, 1, 3, -1, -1, "#5a3a22"); box(-6, -6, 1, 3, 2, 2, "#5a3a22"); box(6, 6, 1, 3, 2, 2, "#5a3a22"); box(-2, 0, 5, 5, 0, 1, "#f4f4f0"); box(2, 3, 5, 5, 0, 0, "#16191b");
        man(0, 4, C[0]); break;
      case "press":
        floor("#1b2428", "#16202a"); for (var x2 = -11; x2 <= 11; x2++) for (var y2 = 1; y2 <= 10; y2++) V[x2 + "," + y2 + ",-6"] = ((x2 + 11) % 6 < 3) !== (y2 % 4 < 2) ? C[0] : "#24343a";
        box(-8, 8, 3, 3, -1, 1, "#3a4b50"); box(-8, 8, 1, 2, 1, 1, "#24343a"); [-5, 0, 5].forEach(function (x) { box(x, x, 4, 5, 0, 0, "#16191b"); V[x + ",6,0"] = "#91a4a6"; }); man(0, -2, C[0]);
        [-9, -6, 6, 9].forEach(function (x, i) { box(x, x + 1, 1, 3, 5, 5, "#2f4045"); box(x, x + 1, 4, 5, 5, 5, ["#e0ac85", "#8d5a3b", "#f3d2b3", "#c18a5e"][i]); }); break;
      case "stadium":
        floor("#3fa860", "#378f52"); for (var r = 0; r < 5; r++) for (var x3 = -11; x3 <= 11; x3++) { V[x3 + "," + (1 + r * 2) + "," + (-6 + r)] = "#2a3a40"; V[x3 + "," + (2 + r * 2) + "," + (-6 + r)] = (x3 * 7 + r * 3) % 5 === 0 ? C[1] : (x3 + r) % 3 === 0 ? C[0] : "#3a4b50"; }
        box(-11, -11, 1, 14, -6, -6, "#91a4a6"); box(-12, -10, 15, 15, -6, -6, "#fff6dc"); for (var x4 = -11; x4 <= 11; x4++) V[x4 + ",0,4"] = "#f4f4f0"; man(1, 3, C[0]); break;
      case "hospital":
        floor("#e8eef0", "#dfe7ea"); wall("#cfe6ef", "#c2dce6", 9); box(-9, -4, 4, 8, -6, -6, "#9fd8ff"); box(3, 9, 2, 3, -5, -1, "#f4f4f0"); box(3, 3, 1, 5, -5, -5, "#91a4a6"); box(3, 4, 4, 4, -4, -4, "#ffd6e0");
        box(-1, 1, 6, 8, -5, -5, "#e3262f"); box(-2, 2, 7, 7, -5, -5, "#e3262f"); box(-1, 1, 7, 7, -5, -5, "#e3262f"); box(10, 10, 1, 7, -3, -3, "#91a4a6"); box(9, 11, 7, 8, -3, -3, "#2a3a40"); V["10,8,-2"] = "#2ad15a"; man(-2, 1, C[0]); break;
      case "street":
        floor("#5f6b70", "#5a666b"); for (var x5 = -10; x5 <= 10; x5 += 4) box(x5, x5 + 1, 0, 0, 2, 2, "#f4f4f0"); box(-11, 11, 1, 1, -6, -4, "#9aa7aa");
        [[-11, -6, "#c87a52"], [-5, 1, "#d8cdb8"], [2, 7, "#7a8a9a"], [8, 11, "#b06a6a"]].forEach(function (b, i) { box(b[0], b[1], 2, 8 + i % 2 * 3, -6, -6, b[2]); for (var y = 4; y < 8 + i % 2 * 3; y += 3) for (var x = b[0] + 1; x < b[1]; x += 2) V[x + "," + y + ",-6"] = "#ffe58a"; });
        box(9, 9, 2, 9, -4, -4, "#2a3a40"); V["9,10,-3"] = "#fff6dc"; box(-9, -4, 1, 2, 3, 5, "#c8312f"); box(-8, -5, 3, 3, 3, 5, "#9fd8ff"); man(1, -2, C[0]); break;
      case "plane":
        floor("#7a868a", "#727e82"); for (var x6 = -10; x6 <= 10; x6 += 3) V[x6 + ",0,0"] = "#ffe58a"; box(-9, 9, 3, 6, -4, -2, "#f4f4f0"); box(-9, 9, 3, 3, -4, -2, "#cfd8dc"); box(9, 11, 4, 5, -4, -2, "#cfd8dc"); box(-11, -9, 5, 9, -3, -3, C[0]);
        box(-2, 3, 4, 4, -7, -5, "#cfd8dc"); box(-2, 3, 4, 4, 1, 3, "#cfd8dc"); for (var x7 = -7; x7 <= 7; x7 += 2) V[x7 + ",5,-1"] = "#2a4a6a"; man(0, 3, C[0]); break;
      default: /* campo */
        floor("#3fa860", "#378f52"); for (var x8 = -8; x8 <= 8; x8++) V[x8 + ",0,-1"] = "#f4f4f0"; box(-8, -8, 0, 0, -6, -1, "#f4f4f0"); box(8, 8, 0, 0, -6, -1, "#f4f4f0");
        box(-5, -5, 1, 6, -6, -6, "#f4f4f0"); box(5, 5, 1, 6, -6, -6, "#f4f4f0"); box(-5, 5, 6, 6, -6, -6, "#f4f4f0"); for (var x9 = -4; x9 <= 4; x9++) for (var y9 = 1; y9 <= 5; y9++) if ((x9 + y9) % 2 === 0) V[x9 + "," + y9 + ",-6"] = "#d8e2e6";
        ball(-2, 1, 2); man(1, 2, C[0]);
    }
    return V;
  }
  var IMG = {};
  function img(sc) {
    var C = cols(), lk = look(sc), k = sc + "|" + C.join("") + JSON.stringify(lk);
    if (IMG[k]) return IMG[k];
    var key = "sc:" + k; GXV.reg(key, function () { return build(sc, C, lk); });
    try { var cv = document.createElement("canvas"); cv.width = 720; cv.height = 300; GXV.draw(cv, key, -0.5, {fit: true, scale: 1.35, shadow: false, metal: 0.05}); IMG[k] = cv.toDataURL(); } catch (e) { IMG[k] = ""; }
    return IMG[k];
  }
  U.gxScene = function (sc) { var src = img(sc); return src ? '<div class="gxsc gxsc-' + sc + '" aria-hidden="true"><img src="' + src + '" alt="" width="360" height="150"><i class="gxsc-l"></i></div>' : ""; };
  U.gxSceneImg = img;
})();
