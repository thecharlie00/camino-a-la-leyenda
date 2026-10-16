/* 4.0: jugar los momentos en el campo (regate, pared y disparo).
   Uso: node test/play40.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots40";
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
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Juega");
  await clickIf('[data-a="cset"][data-k="ev"][data-v="2"]');
  for (let i = 0; i < 3; i++) await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cclub"]'); await clickIf('[data-a="cnext"]'); await clickIf('[data-a="objok"]');
  let found = false;
  for (let k = 0; k < 120 && !found; k++) {
    if (await p.$('[data-a="mplay"]')) { found = true; break; }
    if (await clickIf('[data-a="objok"]')) continue;
    if (await p.evaluate(() => S.pend[0] && S.pend[0].k === "moment")) { notes.push("momento: " + await p.evaluate(() => { const d = playerDesc(S.pend[0]); return S.pend[0].id + " shot=" + d.opts.map(o => o.shot ? 1 : 0).join("") + " playable=" + (UIX.playable ? UIX.playable(d) : "nofn") + " tab=" + UIX.ui().tab; })); await clickIf('[data-a="choose"]'); continue; }
    if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("botón jugarla: " + found);
  if (found) {
    await shot("01-momento");
    await clickIf('[data-a="mplay"]'); await p.waitForTimeout(900);
    const box = await (await p.$(".pm-cv")).boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8); await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45, { steps: 20 }); await p.waitForTimeout(900);
    await shot("02-jugada");
    notes.push("prob. tiro: " + await p.evaluate(() => document.querySelector(".pm-shot small").textContent));
    await p.mouse.up();
    await p.evaluate(() => document.querySelector('[data-pm="tir"]').click());
    await p.waitForTimeout(2600);
    notes.push("tras la jugada: overlay " + !!(await p.$(".pm-ov")) + " · pendiente " + await p.evaluate(() => S.pend[0] ? S.pend[0].k : "ninguna") + " · feed " + await p.evaluate(() => S.feed[0] && (S.feed[0].txt || S.feed[0].t)));
    await shot("03-resultado");
  }
  await clickIf('[data-a="menu"]'); notes.push("ajustes: " + !!(await p.$('[data-a="pset"][data-k="pdiff"]')));
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
