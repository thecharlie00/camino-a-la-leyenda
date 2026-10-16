const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2]; fs.mkdirSync(OUT, {recursive: true});
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  await p.click('[data-a="setlang"][data-v="en"]'); await p.screenshot({path: OUT + "/en-home.png"});
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Test"); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]');
  await p.selectOption("#clg", {index: 3}); await p.waitForTimeout(100);
  await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  await p.screenshot({path: OUT + "/en-club.png"});
  const c = await p.$('.sheet [data-a="close"]'); if (c) await c.click();
  await p.click('[data-a="tab"][data-t="plantilla"]'); await p.screenshot({path: OUT + "/en-squad.png"});
  for (const l of ["de", "fr", "it"]) { await p.click('[data-a="menu"]'); await p.click('[data-a="setlang"][data-v="' + l + '"]'); await p.click('.sheet [data-a="close"]'); await p.click('[data-a="tab"][data-t="mercado"]'); await p.screenshot({path: OUT + "/" + l + "-market.png"}); }
  console.log("errores", errs);
  await b.close();
})();
