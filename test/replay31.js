/* 3.1: repeticiones en el campo 2D (botón ↺ y repetición automática tras los goles).
   Uso: node test/replay31.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots31";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const clickIf = async (s) => { const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(80); return true; };
  await clickIf('[data-a="setlang"][data-v="es"]');
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Repe"); await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cset"][data-k="ev"][data-v="2"]'); await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cclub"]'); await clickIf('[data-a="cnext"]');
  let live = false;
  for (let k = 0; k < 60 && !live; k++) {
    if (await p.$("#live")) { live = true; break; }
    const txt = await p.evaluate(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(txt)) { await clickIf('.sheet [data-a="choose"][data-i="0"]'); await p.waitForTimeout(300); live = !!(await p.$("#live")); break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("directo: " + live);
  if (live) {
    await p.waitForTimeout(9000);
    const ok = await p.evaluate(() => Pitch.replay());
    await p.waitForTimeout(900);
    notes.push("repetición manual: " + ok + " · activa " + await p.evaluate(() => !!Pitch.debug().rp) + " · busy " + Math.round(await p.evaluate(() => Pitch.busy())));
    await p.screenshot({ path: path.join(OUT, "01-repeticion.png") });
    await p.waitForTimeout(16000);
    notes.push("tras la repetición: activa " + await p.evaluate(() => !!Pitch.debug().rp));
    /* repetición automática: esperar a un gol */
    let auto = false;
    for (let i = 0; i < 160 && !auto; i++) { await p.waitForTimeout(500); auto = await p.evaluate(() => { const d = Pitch.debug(); return !!(d && (d.rp || d.rpAt)); }); if (!(await p.$("#live"))) break; }
    notes.push("repetición automática tras gol: " + auto);
    if (auto) { await p.waitForTimeout(3500); await p.screenshot({ path: path.join(OUT, "02-auto.png") }); }
  }
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
