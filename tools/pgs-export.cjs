/* Exporta los logros del juego para Google Play Juegos: lista (clave, nombre y descripción en 5 idiomas,
   rareza, oculto) e iconos 512x512 (trofeo voxel de su rareza con el emoji del logro).
   Uso: node tools/pgs-export.cjs <salida>  (necesita dist/android/jugar/juego.html y Playwright). */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const OUT = path.resolve(process.argv[2] || "build/pgs-export");
const GAME = "file://" + path.resolve(__dirname, "../dist/android/jugar/juego.html");
fs.mkdirSync(path.join(OUT, "icons"), {recursive: true});
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.addInitScript(() => { try { localStorage.setItem("camino.lang", "es"); } catch (e) {} });
  await p.goto(GAME); await p.waitForTimeout(2500);
  const list = await p.evaluate(async () => {
    const seen = {}, rows = [];
    const add = (l, mode) => l.forEach(a => { const id = a[0]; if (!id || seen[id]) return; seen[id] = 1; rows.push({id, emoji: a[1], es: [a[2], a[3]], modeHint: mode, era: ACH_ERA.indexOf(a) >= 0}); });
    add(ACH_P, "p"); add(ACH_M, "m");
    if (typeof achX === "function") { add(achX("p"), "p"); add(achX("m"), "m"); }
    add(ACH_ERA, "e");
    GX.rows("p").forEach(r => add([r], "p")); GX.rows("m").forEach(r => add([r], "m"));
    add([GX.platRow("p")], "p"); add([GX.platRow("m")], "m");
    rows.forEach(r => { const m = GX.meta(r.id) || {}; r.rar = m.rar || "b"; r.hide = !!m.hide; r.mode = m.mode || r.modeHint; });
    const tx = (s) => typeof achTranslate === "function" ? achTranslate(s) : tr(s);
    for (const lang of ["en", "de", "it", "fr"]) {
      LANG = lang; if (typeof ensureI18n === "function") { const r = ensureI18n(lang); if (r && r.then) await r; }
      rows.forEach(r => { r[lang] = [tx(r.es[0]), tx(r.es[1])]; });
    }
    LANG = "es";
    return rows;
  });
  fs.writeFileSync(path.join(OUT, "achievements.json"), JSON.stringify(list, null, 1));
  /* iconos: uno por combinación de rareza y emoji */
  const combos = {}; list.forEach(r => { r.icon = "ach_" + r.rar + "_" + Array.from(r.emoji).map(c => c.codePointAt(0).toString(16)).filter(h => h !== "fe0f").join("-") + ".png"; combos[r.icon] = [r.rar, r.emoji]; });
  fs.writeFileSync(path.join(OUT, "achievements.json"), JSON.stringify(list, null, 1));
  for (const [file, [rar, emoji]] of Object.entries(combos)) {
    const data = await p.evaluate(([rar, emoji]) => {
      const S2 = 512, cv = document.createElement("canvas"); cv.width = cv.height = S2; const c = cv.getContext("2d");
      const pal = {b: ["#3a2414", "#c98a4b"], s: ["#26313a", "#c9d4dc"], g: ["#3a2a06", "#ffcc3a"], p: ["#1d1640", "#9fe6ff"]}[rar] || ["#222", "#888"];
      const gr = c.createRadialGradient(S2 / 2, S2 * 0.42, 20, S2 / 2, S2 / 2, S2 * 0.72); gr.addColorStop(0, pal[1]); gr.addColorStop(0.55, pal[0]); gr.addColorStop(1, "#0b1417");
      c.fillStyle = gr; c.fillRect(0, 0, S2, S2);
      const tro = new Image(); tro.src = GXV.img(rar, 360);
      return new Promise(res => { tro.onload = () => {
        c.imageSmoothingEnabled = false; c.drawImage(tro, S2 * 0.14, S2 * 0.06, S2 * 0.72, S2 * 0.72);
        /* emoji del logro en una insignia abajo, dentro del círculo visible */
        c.beginPath(); c.arc(S2 / 2, S2 * 0.74, 82, 0, Math.PI * 2); c.fillStyle = "#0b1417"; c.fill(); c.lineWidth = 10; c.strokeStyle = pal[1]; c.stroke();
        c.font = "104px 'Noto Color Emoji'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(emoji, S2 / 2, S2 * 0.74 + 6);
        res(cv.toDataURL("image/png"));
      }; tro.onerror = () => res(null); });
    }, [rar, emoji]);
    if (data) fs.writeFileSync(path.join(OUT, "icons", file), Buffer.from(data.split(",")[1], "base64"));
  }
  console.log(list.length + " logros, " + Object.keys(combos).length + " iconos en " + OUT);
  await b.close();
})();
