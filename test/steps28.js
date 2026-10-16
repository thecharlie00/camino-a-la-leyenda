/* 2.8: guía de la primera temporada, logros (incluido el secreto de la rodilla) y accesibilidad.
   Uso: node test/steps28.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots28";
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
  const click = async s => { await p.click(s); await p.waitForTimeout(150); };
  const ov = async () => { for (let i = 0; i < 12; i++) { const st = await p.evaluate(() => { const lv = document.getElementById('live'); if (lv && !window.__keepLive) { const sm = lv.querySelector('[data-a="lsim"]'); if (sm) { sm.click(); return 2; } const en = lv.querySelector('[data-a="lend"]'); if (en) { en.click(); return 1; } } const t = document.querySelector('[data-a="troclose"]'); if (t) { t.click(); return 1; } const d = document.querySelector('.drw'); if (!d) return 0; const x = d.querySelector('[data-a="drawclose"]'); if (x) { x.click(); return 1; } const s = d.querySelector('[data-a="drawspeed"][data-v="skip"]'); if (s) s.click(); return 2; }); if (!st) return; await p.waitForTimeout(st === 2 ? 450 : 320); } };
  const clickIf = async (s) => { await ov(); let e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { await ov(); e = await p.$(s); if (!e) return false; await e.click({ timeout: 8000 }); } await p.waitForTimeout(60); return true; };
  const coach = () => p.evaluate(() => { const c = document.querySelector(".tut"); return c ? c.querySelector(".eyebrow").textContent + " | " + c.querySelector("b").textContent : "—"; });
  await click('[data-a="setlang"][data-v="es"]');
  /* accesibilidad desde la portada */
  await click('[data-a="a11y"]'); await click('[data-a="a11yfs"][data-v="2"]'); await click('[data-a="a11ycb"][data-v="1"]');
  notes.push("clases: " + await p.evaluate(() => document.documentElement.className));
  await click('[data-a="close"]'); await shot("01-portada-grande");
  notes.push("desborda (grande): " + await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
  /* nueva carrera */
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Prueba");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]'); await ov(); await clickIf('[data-a="objok"]');
  const tabs = await p.evaluate(() => { const t = document.querySelector(".tabs").getBoundingClientRect(); return [Math.round(t.top), Math.round(t.bottom), innerHeight]; });
  notes.push("pestañas (top,bottom,alto): " + tabs.join(","));
  notes.push("guía 1: " + await coach()); await shot("02-guia-1");
  await click('.tut [data-a="tab"]'); await click('[data-a="tab"][data-t="carrera"]');
  notes.push("guía 2: " + await coach());
  /* tamaño normal y colores estándar para el resto */
  await p.evaluate(() => camA11y.set({ fs: 0, cb: 0 }));
  for (let k = 0; k < 12; k++) { if (await clickIf('[data-a="drawclose"]')) continue; if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (await p.evaluate(() => S.bi >= 1)) break; if (!(await clickIf('[data-a="advance"]'))) break; }
  for (let j = 0; j < 8 && (await p.$('.sheet')); j++) { if (await clickIf('.sheet [data-a="choose"]')) continue; await clickIf('.sheet [data-a="close"]'); }
  await click('[data-a="tab"][data-t="carrera"]');
  notes.push("guía 3: " + await coach()); await shot("03-guia-3");
  await click('.tut [data-a="tutoff"]');
  notes.push("guía tras saltar: " + await coach());
  /* rodilla */
  await p.evaluate(() => { injure(12); UIX.render(false); });
  await p.waitForTimeout(700);
  notes.push("logro rodilla: " + await p.evaluate(() => JSON.stringify(S.ach.p_knee) + " toast=" + (document.querySelector(".toast") || {}).textContent));
  await shot("04-toast");
  await click('[data-a="tab"][data-t="mas"]'); await shot("05-mas");
  await click('[data-a="ach"]'); await p.waitForTimeout(200); await shot("06-logros");
  notes.push("logros: " + await p.evaluate(() => document.querySelector(".sheet .lbl").textContent));
  /* menú con accesibilidad */
  await click('[data-a="close"]'); await click('[data-a="menu"]');
  notes.push("menú accesibilidad: " + await p.evaluate(() => !!document.querySelector("details.a11y")));
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
