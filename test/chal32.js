/* 3.2: desafíos, crisis, rivalidades, récords y diario.
   Uso: node test/chal32.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots32";
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
  /* míster: desafío «salvar al colista» */
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Desafío");
  await clickIf('[data-a="cnext"]'); await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cset"][data-k="mmode"][data-v="chal"]');
  await clickIf('[data-a="cset"][data-k="chal"][data-v="save"]');
  await p.selectOption("#clg", { index: 0 }); await p.waitForTimeout(150);
  await shot("01-desafio");
  notes.push("club del desafío: " + await p.evaluate(() => UIX.ui().cr.club + " " + clubName(UIX.ui().cr.club)));
  await clickIf('[data-a="cnext"]');
  for (let k = 0; k < 6; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { S.noLiveAuto = true; S.m.xp = S.m.xp || {}; S.m.xp.live = 0; });
  await goTab("club");
  notes.push("desafío: " + await p.evaluate(() => JSON.stringify(S.ch) + " tarjeta " + !!document.querySelector(".chcard")));
  await shot("02-tarjeta");
  await drain(60);
  await p.evaluate(() => { S.m.crisis = 2; UIX.render(false); });
  await goTab("club"); await shot("03-crisis");
  await goTab("comp"); await p.evaluate(() => window.scrollTo(0, 0));
  notes.push("clasificación: rivalidades " + !!(await p.$("text=Tus rivalidades")) + " · récords " + await p.evaluate(() => !!(S.rec && Object.keys(S.rec).length)));
  await goTab("mas"); await clickIf('[data-a="diary"]'); await p.waitForTimeout(200);
  notes.push("diario: " + await p.evaluate(() => JSON.stringify(S.diary) + " · hoja " + ((document.querySelector(".sheet h2") || {}).textContent) + " · " + document.querySelectorAll(".dlist li").length + " líneas"));
  await shot("04-diario");
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
