#!/usr/bin/env node
/* Prueba rápida de la interfaz: node tools/smoke.js [carpeta src]  (por defecto, src/)
   Construye el juego, recorre portada, los tres modos y todas las pestañas en los cinco idiomas, y lista errores. */
const fs = require("fs"), path = require("path"), cp = require("child_process"), os = require("os");
const { chromium } = require("playwright");
const ROOT = path.join(__dirname, "..");
const src = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "src");
const dist = fs.mkdtempSync(path.join(os.tmpdir(), "camino-dist-"));
cp.execSync("python3 build.py", {cwd: ROOT, env: Object.assign({}, process.env, {CAMINO_SRC: src, CAMINO_DIST: dist}), stdio: "ignore"});
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(dist, "index.html"));
  await p.waitForTimeout(250);
  const step = async (label, fn) => { try { await fn(); } catch (e) { errs.push(label + ": " + e.message.split("\n")[0]); } };
  const clickIf = async (sel) => { const e = await p.$(sel); if (e) { await e.click(); await p.waitForTimeout(80); return true; } return false; };
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; } };
  const tabs = async () => { const ts = await p.$$eval('[data-a="tab"][data-t]', l => l.map(x => x.getAttribute("data-t"))); for (const t of ts) { await clickIf('nav [data-a="tab"][data-t="' + t + '"]'); } };
  const overflow = async (label) => { const o = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (o) errs.push("desbordamiento horizontal: " + label); };
  await step("idioma", async () => { await p.click('[data-a="setlang"][data-v="es"]'); });
  await step("jugador", async () => {
    await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="p"]');
    await p.fill("#fn", "Ana"); await p.fill("#ln", "Prueba");
    for (let i = 0; i < 3; i++) await p.click('[data-a="cnext"]');
    await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]');
    await drain(25); await tabs(); await overflow("jugador");
  });
  await step("míster", async () => {
    await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
    await p.fill("#fn", "Pep"); await p.fill("#ln", "Prueba");
    await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]');
    await drain(30); await tabs(); await overflow("míster");
  });
  await step("club", async () => {
    await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="club"]');
    await p.fill("#cn", "Club Prueba"); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]');
    await p.fill("#fn", "Dueño"); await p.fill("#ln", "Prueba"); await p.click('[data-a="cnext"]');
    await p.click('[data-a="redraft"]'); await p.click('[data-a="startclub"]');
    await drain(20); await tabs(); await overflow("club");
  });
  for (const l of ["en", "de", "it", "fr", "es"]) {
    await step("idioma " + l, async () => {
      await p.click('[data-a="menu"]'); await p.click('[data-a="setlang"][data-v="' + l + '"]'); await p.click('.sheet [data-a="close"]');
      await tabs(); await drain(6);
      const pl = await p.$('[data-a="pl"]'); if (pl) { await pl.click(); await p.waitForTimeout(80); await clickIf('.sheet [data-a="close"]'); }
      await overflow("idioma " + l);
    });
  }
  await step("cargar", async () => { await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="goload"]'); await p.waitForTimeout(100); const n = await p.$$eval(".slotc", x => x.length); if (n !== 3) errs.push("ranuras: " + n); });
  console.log("ERRORES: " + (errs.length ? "\n" + errs.join("\n") : "ninguno"));
  await b.close();
  fs.rmSync(dist, {recursive: true, force: true});
})();
