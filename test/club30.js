/* 3.0: modo presidente, finanzas, estadio e instalaciones.
   Uso: node test/club30.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots30";
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
  const shot = n => p.screenshot({ path: path.join(OUT, n + ".png") });
  const ov = async () => { await p.evaluate(() => { const w = document.getElementById("ntfs"); if (w) w.remove(); document.querySelectorAll("[data-a='lvclose'],[data-a='trclose'],[data-a='drawclose']").forEach(x => x.click()); }); await p.waitForTimeout(80); };
  const clickIf = async (s) => { await ov(); const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(80); return true; };
  const goTab = async (t) => { if (await p.$('nav [data-a="tab"][data-t="' + t + '"]')) return clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await clickIf('nav [data-a="tab"][data-t="mas"]'); return clickIf('.mrow[data-t="' + t + '"]'); };
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; } for (let j = 0; j < 8 && (await p.$('.sheet')); j++) { if (await clickIf('.sheet [data-a="choose"]')) continue; await clickIf('.sheet [data-a="close"]'); } };
  await clickIf('[data-a="setlang"][data-v="es"]');
  /* Crea tu club, solo presidente */
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", "Atlètic Prova"); await clickIf('[data-a="cnext"]');
  await p.selectOption("#clg", { index: 4 }); await p.waitForTimeout(150);
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cset"][data-k="role"][data-v="pres"]');
  await p.fill("#fn", "Carles"); await p.fill("#ln", "President");
  await shot("01-papel");
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="startclub"]');
  for (let k = 0; k < 6; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
  await goTab("club");
  notes.push("presidente: " + await p.evaluate(() => JSON.stringify({pres: !!S.m.pres, coach: S.m.pres && S.m.pres.coach, card: !!document.querySelector(".prescard.need"), week: !!document.querySelector(".wkcard")})));
  await shot("02-sin-entrenador");
  await clickIf('[data-a="presopen"]'); await shot("03-candidatos");
  await clickIf('[data-a="preshire"][data-v="2"]');
  notes.push("entrenador: " + await p.evaluate(() => S.m.pres.coach && S.m.pres.coach.ln + " q" + S.m.pres.coach.q));
  await p.evaluate(() => { const d = document.querySelector("details.fincard"); if (d) { d.open = true; d.scrollIntoView(); } });
  await shot("04-finanzas");
  await clickIf('[data-a="finprice"][data-v="0"]'); await p.evaluate(() => { const d = document.querySelector("details.fincard"); if (d) d.open = true; });
  await clickIf('[data-a="facbuild"][data-v="cap"]'); await p.evaluate(() => { const d = document.querySelector("details.fincard"); if (d) d.open = true; });
  await clickIf('[data-a="facbuild"][data-v="youth"]');
  notes.push("instalaciones: " + await p.evaluate(() => JSON.stringify(facOf())));
  await drain(16);
  notes.push("tras jugar: " + await p.evaluate(() => JSON.stringify({fin: Object.fromEntries(Object.entries(finOf()).map(([k, v]) => [k, Math.round(v)])), pend: S.pend.map(x => x.k)})));
  await goTab("club"); await p.evaluate(() => { const d = document.querySelector("details.fincard"); if (d) { d.open = true; d.scrollIntoView(); } });
  await shot("05-finanzas-jugadas");
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
