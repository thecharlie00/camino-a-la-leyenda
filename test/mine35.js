/* 3.5: temas, carrera rápida, editor y copias de seguridad.
   Uso: node test/mine35.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots35";
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
  /* tema desde la portada */
  await clickIf('[data-a="a11y"]'); await clickIf('[data-a="theme"][data-v="day"]');
  notes.push("tema: " + await p.evaluate(() => document.documentElement.className));
  await clickIf('[data-a="close"]'); await shot("01-dia");
  await p.evaluate(() => { localStorage.setItem("camino.theme", "night"); document.documentElement.classList.remove("th-day"); });
  /* míster, carrera rápida */
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Rápido");
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cset"][data-k="quick"][data-v="1"]'); await shot("02-rapida");
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cclub"]'); await clickIf('[data-a="cnext"]');
  for (let k = 0; k < 6; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { S.noLiveAuto = true; S.m.xp = S.m.xp || {}; S.m.xp.live = 0; });
  await goTab("club");
  notes.push("rápida: " + await p.evaluate(() => JSON.stringify(S.quick) + " ev=" + S.set.ev + " chip=" + ((document.querySelector(".qchip") || {}).textContent)));
  /* editor */
  await goTab("mas"); await clickIf('[data-a="editor"]'); await p.waitForTimeout(200);
  await p.evaluate(() => { const li = document.querySelector(".edlist li[data-ed]"); li.querySelector(".edn").value = "Atlètic Editat"; li.querySelector(".edab").value = "ate"; });
  await shot("03-editor");
  await clickIf('[data-a="edsave"]');
  notes.push("editor: " + await p.evaluate(() => JSON.stringify(S.ed.cl) + " · " + clubName(+Object.keys(S.ed.cl)[0])));
  await clickIf('[data-a="edtab"][data-v="cp"]');
  await goTab("mas"); await clickIf('[data-a="editor"]'); await clickIf('[data-a="edtab"][data-v="cp"]');
  await p.evaluate(() => { const i = document.querySelector(".edlist .edcp"); i.value = "Liga Inventada"; });
  await clickIf('[data-a="edsave"]');
  notes.push("liga: " + await p.evaluate(() => lgName(S.cl[S.m.club])));
  /* copias */
  await drain(8); await p.waitForTimeout(800);
  notes.push("copias: " + await p.evaluate(() => (JSON.parse(localStorage.getItem("camino.bk." + S.uid) || "[]")).length));
  await clickIf('[data-a="menu"]'); await p.evaluate(() => { const d = document.querySelector("details.a11y35"); if (d) d.open = true; }); await shot("04-menu");
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
