/* Anuncios: con un AndroidBridge simulado comprueba en qué transiciones se piden y el mínimo entre ellos. */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })).newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => {
    window.__ads = []; window.__off = 0; window.__priv = 0;
    const real = Date.now.bind(Date); Date.now = () => real() + window.__off;
    window.AndroidBridge = { showAd: w => { window.__ads.push(w); return true; }, privacyOptionsRequired: () => true, showPrivacyOptions: () => { window.__priv++; }, copy: () => {} };
  });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const click = async (s) => { await p.click(s); await p.waitForTimeout(150); };
  const skip = () => p.evaluate(() => { window.__off += 61000; });
  await click('[data-a="setlang"][data-v="es"]');
  const homePriv = await p.$('[data-a="adprivacy"]');
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Prueba");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]');           // empezar → "start"
  await click('[data-a="menu"]'); await click('[data-a="home"]');             // < 60 s: no debe salir
  await skip(); await click('[data-a="goload"]'); await click('[data-a="loadslot"]'); // → "load"
  await skip(); await click('[data-a="menu"]');
  const menuPriv = await p.$('[data-a="adprivacy"]'); await click('[data-a="adprivacy"]');
  await click('[data-a="menu"]').catch(() => {}); await p.evaluate(() => document.querySelector('[data-a="home"]') && document.querySelector('[data-a="home"]').click()); await p.waitForTimeout(150); // → "menu"
  await skip(); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="club"]');
  await click('[data-a="cback"]'); if (await p.$('[data-a="gohome"]')) await click('[data-a="gohome"]');
  await skip(); await click('[data-a="goload"]'); await p.click('[data-a="loadslot"]'); await p.waitForTimeout(200);
  await p.evaluate(() => { retire(); }); await skip();
  await p.evaluate(() => { const x = document.createElement("button"); x.setAttribute("data-a", "startmgr"); x.id = "sm"; document.querySelector("main").appendChild(x); });
  await click("#sm");
  const mode = await p.evaluate(() => S.mode);
  const r = await p.evaluate(() => ({ ads: window.__ads, priv: window.__priv }));
  console.log("anuncios:", r.ads.join(", "), "· opciones privacidad:", !!homePriv, !!menuPriv, r.priv, "· errores:", errs.length ? errs : "ninguno");
  const ok = r.ads.join(",") === "start,load,menu,load,manager" && mode === "mgr" && homePriv && menuPriv && r.priv === 1 && !errs.length;
  console.log(ok ? "OK" : "FALLO"); await b.close(); process.exit(ok ? 0 : 1);
})();
