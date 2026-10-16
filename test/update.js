/* Aviso de actualización: la app llama a caminoUpdate(código, versión) o el juego pregunta al puente al arrancar.
   Sale una ventana una vez y un aviso fijo en el menú con botón para ir a Google Play. */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [], out = [];
  /* 1. aviso que llega después de cargar */
  let p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { window.__store = 0; window.AndroidBridge = { openStore: () => { window.__store++; }, copy: () => {} }; });
  await p.goto("file://" + path.join(__dirname, "../dist/index-noads.html")); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = document.querySelector('[data-a="setlang"][data-v="es"]'); if (b) b.click(); });
  await p.evaluate(() => window.caminoUpdate(19, "2.2")); await p.waitForTimeout(300);
  const t1 = await p.evaluate(() => (document.querySelector(".sheet") || {}).innerText || "");
  await p.screenshot({ path: "/tmp/update.png" });
  await p.click('.sheet [data-a="close"]'); await p.waitForTimeout(200);
  const banner = await p.evaluate(() => (document.querySelector(".updbar") || {}).innerText || "");
  await p.screenshot({ path: "/tmp/update-menu.png" });
  await p.click('.updbar [data-a="doupdate"]'); await p.waitForTimeout(200);
  await p.evaluate(() => window.caminoUpdate(19, "2.2")); await p.waitForTimeout(200);
  const again = await p.$('.sheet [data-a="doupdate"]');
  const r = await p.evaluate(() => window.__store);
  out.push("ventana: " + t1.replace(/\n+/g, " | ") + " · menú: " + banner.replace(/\n+/g, " | ") + " · tienda: " + r + " · ventana repetida: " + !!again);
  const ok1 = r === 1 && !again && /nueva versión/i.test(t1) && /2\.2/.test(banner);
  await p.close();
  /* 2. el puente ya sabe que hay versión nueva al arrancar */
  p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { window.AndroidBridge = { openStore: () => {}, copy: () => {}, updateAvailable: () => 20, updateName: () => "2.3" }; });
  await p.goto("file://" + path.join(__dirname, "../dist/index-noads.html")); await p.waitForTimeout(400);
  const boot = await p.evaluate(() => !!document.querySelector(".sheet [data-a='doupdate']") + " " + ((document.querySelector(".updbar") || {}).innerText || "").replace(/\n+/g, " | "));
  out.push("al arrancar: " + boot);
  const ok2 = /^true/.test(boot) && /2\.3/.test(boot);
  console.log(out.join("\n"), "\nerrores:", errs.length ? errs : "ninguno");
  console.log(ok1 && ok2 && !errs.length ? "OK" : "FALLO");
  await b.close();
})();
