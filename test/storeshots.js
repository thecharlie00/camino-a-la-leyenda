/* Capturas en inglés para la ficha de Google Play */
const path = require("path");
const { chromium } = require("playwright");
const O = path.join(__dirname, "../store/raw");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const c = async (s) => { const e = await p.$(s); if (e) { await e.click(); await p.waitForTimeout(150); return true; } return false; };
  const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: O + "/" + n + ".png" }); };
  await c('[data-a="setlang"][data-v="en"]'); await shot("1-home");
  await c('[data-a="newgame"]'); await shot("7-modes");
  /* carrera de jugador: decisión con porcentajes */
  await c('[data-a="pickmode"][data-v="p"]'); await p.fill("#fn", "Leo"); await p.fill("#ln", "Rivera");
  for (let i = 0; i < 3; i++) await c('[data-a="cnext"]');
  await c('[data-a="cclub"]'); await c('[data-a="cnext"]');
  for (let k = 0; k < 40; k++) {
    const opt = await p.$('.card.decision .opt, .card.decision [data-a="choose"]');
    const pend = await p.evaluate(() => S.pend[0] && S.pend[0].k === "ev" && playerDesc(S.pend[0]).opts.some(o => o.outs.length > 1));
    if (pend) break;
    if (!(await c('[data-a="choose"]'))) await c('[data-a="advance"]');
  }
  await p.waitForTimeout(1500); await p.evaluate(() => { document.getElementById("main").scrollTop = 0; }); await shot("2-decision");
  /* carrera larga simulada para tener vitrina */
  await p.evaluate(() => {
    for (let k = 0; k < 200000 && S.yr < 2034; k++) { cleanPend(); if (S.pend.length) { const x = S.pend[0]; resolvePending(x.k === "offers" ? (x.forced ? 0 : -1) : 0); } else advance(); }
  });
  await c('[data-a="menu"]'); await c('[data-a="home"]'); await c('[data-a="goload"]'); await c('[data-a="loadslot"]');
  const clear = async () => { await p.evaluate(() => { for (let k = 0; k < 20 && S.pend.length; k++) resolvePending(S.pend[0].k === "offers" ? -1 : 0); }); };
  await p.evaluate(() => { const y = S.yr; for (let k = 0; k < 400 && S.bi < 2; k++) { cleanPend(); if (S.pend.length) resolvePending(S.pend[0].k === "offers" ? -1 : 0); else advance(); } });
  await clear(); await p.waitForTimeout(1500);
  await c('nav [data-a="tab"][data-t="hist"]'); await shot("6-trophies");
  await c('nav [data-a="tab"][data-t="comp"]'); await shot("8-competition");
  /* míster en un grande */
  await c('[data-a="menu"]'); await c('[data-a="home"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Carlo"); await p.fill("#ln", "Bianchi"); await c('[data-a="cnext"]'); await c('[data-a="cnext"]');
  await c('[data-a="cset"][data-k="mmode"][data-v="pick"]'); await p.selectOption("#clg", { index: 3 }); await p.waitForTimeout(150);
  await c('[data-a="cclub"][data-v]'); await c('[data-a="cnext"]');
  for (let k = 0; k < 6; k++) { if (!(await c('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { for (let k = 0; k < 20 && S.pend.length; k++) resolvePending(0); });
  await c('nav [data-a="tab"][data-t="plantilla"]'); await shot("3-squad");
  await c('nav [data-a="tab"][data-t="mercado"]'); await p.evaluate(() => { document.getElementById("main").scrollTop = 330; }); await shot("4-market");
  /* crea tu club */
  await c('[data-a="menu"]'); await c('[data-a="home"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", "Vallès United"); await p.fill("#ab", "VLU");
  await c('[data-a="ccol"][data-k="0"][data-v="#0b2545"]'); await c('[data-a="ccol"][data-k="1"][data-v="#d4a017"]'); await shot("5-club");
  console.log("errores", errs);
  await b.close();
})();
