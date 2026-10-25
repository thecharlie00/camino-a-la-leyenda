/* 5.6 trofeos ampliados: aviso de vóxeles, pantalla de trofeos, vitrina y platino. Uso: node test/gx56.js [carpeta] */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/gx56"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, ...a) => p.evaluate(s, ...a);
  const click = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, s); await p.waitForTimeout(120); };
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Voxel");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  await p.waitForTimeout(500);
  const inGame = await js(() => !!(window.S && S.p)); console.log("en partida:", inGame);
  /* desbloqueo forzado de depuración: tres trofeos seguidos en cola */
  await js(() => { GX.debug.unlock("g_hat"); GX.debug.unlock("k_ultra"); GX.debug.unlock("c_pill"); UIX.render(false); });
  await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, "01-aviso.png") });
  const q = await js(() => ({ q: GX.st().q.length, banners: document.querySelectorAll(".gxb").length, money: S.p.money, t: GX.st().t.g_hat }));
  console.log("cola", JSON.stringify(q));
  await p.waitForTimeout(4200); await p.screenshot({ path: path.join(OUT, "02-aviso2.png") });
  await p.waitForTimeout(9500);
  /* pantalla de trofeos */
  await js(() => UIX.open("ach")); await p.waitForTimeout(1200); await p.screenshot({ path: path.join(OUT, "03-trofeos.png") });
  const scr = await js(() => ({ items: document.querySelectorAll(".gxi").length, on: document.querySelectorAll(".gxi.on").length, pct: document.querySelector(".gxs-pct b").textContent, hidden: [...document.querySelectorAll(".gxi b")].filter(b => b.textContent === "???").length, prog: document.querySelectorAll(".gxp").length }));
  console.log("pantalla", JSON.stringify(scr));
  await click('[data-a="gxcat"][data-v="goals"]'); await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, "04-goles.png") });
  console.log("goles visibles", await js(() => document.querySelectorAll(".gxi").length));
  await click('[data-a="gxrar"][data-v="g"]'); console.log("oro+goles", await js(() => document.querySelectorAll(".gxi").length));
  await click('[data-a="close"]');
  /* vitrina en Yo */
  await click('nav [data-a="tab"][data-t="jugador"]'); await p.waitForTimeout(600);
  await js(() => { const v = document.querySelector(".gxv"); if (v) v.scrollIntoView(); }); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, "05-vitrina.png") });
  console.log("vitrina", await js(() => document.querySelectorAll(".gxv-s:not(.empty)").length));
  /* platino */
  await js(() => { GX.debug.all("p"); GX.st().q = GX.st().q.filter(id => id === "plat_p"); achCheck(); UIX.render(false); });
  await p.waitForTimeout(2600); await p.screenshot({ path: path.join(OUT, "06-platino.png") });
  console.log("ceremonia", await js(() => !!document.querySelector(".gxc")), "platino", await js(() => !!S.ach.plat_p));
  await click('.gxc [data-gx="ok"]'); await p.waitForTimeout(600);
  /* retroactivo: partida antigua sin S.gx */
  const retro = await js(() => { delete S.gx; S.p.flags.captain = true; const before = Object.keys(S.ach).length; delete S.ach.w_cap; achCheck(); return { retro: GX.st().retro, q: GX.st().q.length }; });
  console.log("retro", JSON.stringify(retro));
  /* fps del aviso */
  const fps = await js(() => new Promise(res => { GX.debug.unlock("o_zero"); UIX.gxNotify(); let n = 0, t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(Math.round(n / 1.5)); })(); }));
  console.log("fps con aviso", fps);
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
})();
