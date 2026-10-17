/* 4.1: campo 2D — atributos de ritmo y agilidad, separación entre bolitas, intercepciones y paso fijo con interpolación.
   Uso: node test/pitch41.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots41p";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(80); return true; };
  await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Bolitas"); await c('[data-a="cnext"]');
  await c('[data-a="cset"][data-k="ev"][data-v="2"]'); await c('[data-a="cnext"]'); await c('[data-a="cclub"]'); await c('[data-a="cnext"]');
  let live = false;
  for (let k = 0; k < 160 && !live; k++) {
    if (await p.$("#live")) { live = true; break; }
    if (await c('[data-a="drawspeed"][data-v="skip"]')) { await c('[data-a="drawclose"]'); continue; }
    const t = await p.evaluate(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(t)) { await c('.sheet [data-a="choose"][data-i="0"]'); continue; }
    if (await c('[data-a="objok"]')) continue; if (await c('.sheet [data-a="choose"]')) continue; if (await c('[data-a="choose"]')) continue;
    if (!(await c('[data-a="advance"]'))) break;
  }
  if (!live) fail.push("no se llegó al directo");
  else {
    await p.evaluate(() => { window.__icons = 0; const P = Pitch.debug(); const push = P.icons.push.bind(P.icons); P.icons.push = function (x) { if (x && x.ic === "🦶") window.__icons++; return push(x); }; });
    await c('[data-a="lspeed"][data-v="1"]');
    const at = await p.evaluate(() => { const P = Pitch.debug(), a = []; for (let s = 0; s < 2; s++) P.T[s].forEach(q => { if (q) a.push([q.pace, q.agi]); }); return a; });
    const paces = at.map(x => x[0]), agis = at.map(x => x[1]);
    notes.push("ritmo " + Math.min(...paces).toFixed(2) + "–" + Math.max(...paces).toFixed(2) + " · agilidad " + Math.min(...agis).toFixed(2) + "–" + Math.max(...agis).toFixed(2));
    if (Math.max(...paces) - Math.min(...paces) < 0.05) fail.push("todos con el mismo ritmo");
    if (agis.some(v => v == null || isNaN(v))) fail.push("agilidad sin calcular");
    /* muestrear solapes durante el partido */
    let samples = 0, close = 0, pairs = 0;
    for (let i = 0; i < 120; i++) {
      await p.waitForTimeout(250);
      const r = await p.evaluate(() => {
        const P = Pitch.debug(); if (!P || P.cele) return null; let cl = 0, n = 0;
        for (let s = 0; s < 2; s++) { const t = P.T[s].filter(q => q && !q.gone && !q.off && !q.ov && !q.dive); for (let a = 0; a < t.length; a++) for (let bb = a + 1; bb < t.length; bb++) { n++; const dx = t[a].x - t[bb].x, dy = t[a].y - t[bb].y; if (dx * dx + dy * dy < 1.0) cl++; } }
        return { cl, n, acc: P.acc != null };
      });
      if (!r) continue; samples++; close += r.cl; pairs += r.n;
      if (!r.acc) { fail.push("sin paso fijo"); break; }
      if (!(await p.$("#live"))) break;
    }
    const icons = await p.evaluate(() => window.__icons + " (pases rasos en juego abierto " + (Pitch.debug().npass || 0) + ", rivales al alcance " + ((Pitch.debug().icpt || {}).n || 0) + ")");
    notes.push("muestras " + samples + " · compañeros a menos de 1 m: " + close + " de " + pairs + " parejas · intercepciones vistas: " + icons);
    if (pairs && close / pairs > 0.01) fail.push("demasiados solapes entre compañeros");
    await p.screenshot({ path: path.join(OUT, "01-campo.png") });
  }
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
