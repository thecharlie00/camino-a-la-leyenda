/* Parche 2.0: minijuego dentro del juego y portero (porterías a cero, goles encajados, premios). */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const clickIf = async (s) => { const e = await p.$(s); if (!e) return false; await e.click(); await p.waitForTimeout(60); return true; };
  const goTab = async (t) => { if (await p.$('nav [data-a="tab"][data-t="' + t + '"]')) return clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await clickIf('nav [data-a="tab"][data-t="mas"]'); return clickIf('.mrow[data-t="' + t + '"]'); };
  await p.click('[data-a="setlang"][data-v="es"]');
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Penalti");
  for (let i = 0; i < 3; i++) await p.click('[data-a="cnext"]');
  await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  let got = false;
  for (let k = 0; k < 200 && !got; k++) {
    const x = await p.evaluate(() => S.pend[0] && S.pend[0].k);
    if (x === "moment") { await p.evaluate(() => { S.pend[0].id = "penalti_favor"; }); await goTab('jugador'); await goTab('carrera'); got = true; break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("momento: " + got);
  if (got) {
    await p.screenshot({ path: "/tmp/p2/11-penalti-opciones.png" });
    await p.click('[data-a="mini"]'); await p.waitForTimeout(500);
    await p.screenshot({ path: "/tmp/p2/12-minijuego.png" });
    const cells = await p.$$(".mg-cell");
    notes.push("celdas: " + cells.length);
    await p.tap('.mg-cell[data-i="0"]'); await p.waitForTimeout(200);
    await p.tap(".mg-btn.pri"); await p.waitForTimeout(700);
    await p.touchscreen.tap(206, 120);
    await p.waitForTimeout(3500);
    notes.push("tras minijuego: overlay " + !!(await p.$(".mg-overlay, .mg")) + " · feed: " + await p.evaluate(() => S.feed[0] && (S.feed[0].title + " → " + S.feed[0].choice + " · " + S.feed[0].good)));
    await p.screenshot({ path: "/tmp/p2/13-tras-penalti.png" });
  }
  console.log(notes.join("\n")); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "ERRORES: ninguno");
  await b.close();
})();
