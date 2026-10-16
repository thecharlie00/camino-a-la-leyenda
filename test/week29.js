/* 2.9: «La semana de trabajo» (míster) y «Copas y torneos» en la clasificación.
   Uso: node test/week29.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots29";
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
  /* míster */
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Prueba");
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cset"][data-k="mmode"][data-v="pick"]');
  await p.selectOption("#clg", { index: 0 }); await p.waitForTimeout(150);
  await clickIf('[data-a="cclub"]'); await clickIf('[data-a="cnext"]');
  for (let k = 0; k < 6; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
  await goTab("club");
  await p.evaluate(() => { const d = document.querySelector("details.wkcard"); if (d) d.open = true; });
  notes.push("tarjeta semana: " + !!(await p.$("details.wkcard")) + " · rival: " + await p.evaluate(() => (document.querySelector(".wkopp b") || {}).textContent));
  await p.evaluate(() => document.querySelector("details.wkcard").scrollIntoView());
  await shot("01-semana");
  await clickIf('[data-a="wkload"][data-v="2"]'); await p.evaluate(() => { const d = document.querySelector("details.wkcard"); if (d) d.open = true; });
  await clickIf('[data-a="wkprep"][data-v="att"]'); await p.evaluate(() => { const d = document.querySelector("details.wkcard"); if (d) d.open = true; });
  await p.evaluate(() => { const c = document.querySelector('input[data-wk="low"]'); c.click(); });
  const bud0 = await p.evaluate(() => S.m.bud);
  await p.evaluate(() => { const d = document.querySelector("details.wkcard"); if (d) d.open = true; });
  await clickIf('[data-a="wkhire"][data-v="as"]');
  notes.push("semana: " + await p.evaluate(() => JSON.stringify(S.m.wk)) + " · presupuesto " + bud0 + " → " + await p.evaluate(() => S.m.bud));
  await drain(14);
  notes.push("partido con plan: " + await p.evaluate(() => { const f = (S.cur && S.cur.pm || [])[0]; return f ? JSON.stringify({prep: f.prep, ostyle: f.ostyle, wk: f.wk}) : "sin partido en curso"; }));
  /* copas y torneos */
  await goTab("comp");
  await clickIf('[data-a="compseg"][data-v="cup"]');
  notes.push("copas: " + await p.evaluate(() => [...document.querySelectorAll("#cupsel option")].length + " competiciones · " + (document.querySelector(".compseg + .card + .card h3") || {}).textContent));
  await shot("02-copas");
  await p.selectOption("#cupsel", "UCL"); await p.waitForTimeout(200);
  notes.push("UCL: " + await p.evaluate(() => document.querySelectorAll(".tablewrap tr").length + " filas"));
  await shot("03-ucl");
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
