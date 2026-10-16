/* Seguridad: nombres maliciosos escritos por el usuario o metidos en un código de partida no deben ejecutar código. */
const path = require("path");
const { chromium } = require("playwright");
const BAD = '<img src=x onerror="window.__x=(window.__x||0)+1">';
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(250);
  const ov = async () => { for (let i = 0; i < 12; i++) { const st = await p.evaluate(() => { const lv = document.getElementById('live'); if (lv && !window.__keepLive) { const sm = lv.querySelector('[data-a="lsim"]'); if (sm) { sm.click(); return 2; } const en = lv.querySelector('[data-a="lend"]'); if (en) { en.click(); return 1; } } const t = document.querySelector('[data-a="troclose"]'); if (t) { t.click(); return 1; } const d = document.querySelector('.drw'); if (!d) return 0; const x = d.querySelector('[data-a="drawclose"]'); if (x) { x.click(); return 1; } const s = d.querySelector('[data-a="drawspeed"][data-v="skip"]'); if (s) s.click(); return 2; }); if (!st) return; await p.waitForTimeout(st === 2 ? 450 : 320); } };
  const c = async (s) => { await ov(); let e = await p.$(s); if (e) { try { await e.click({ timeout: 4000 }); } catch (er) { await ov(); e = await p.$(s); if (!e) return false; await e.click({ timeout: 8000 }); } await p.waitForTimeout(60); return true; } return false; };
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await c('.sheet [data-a="choose"]')) continue; if (await c('[data-a="choose"]')) continue; if (!(await c('[data-a="advance"]'))) break; } };
  const tabs = async () => { for (let j = 0; j < 6 && (await p.$('.sheet')); j++) { if (await p.$('.sheet [data-a="negoquit"]')) { await p.evaluate(() => document.querySelector('.sheet [data-a="negoquit"]').click()); await p.waitForTimeout(80); continue; } await p.evaluate(() => { const b = document.querySelector('.sheet [data-a="close"]'); if (b) b.click(); }); await p.waitForTimeout(80); } const ts = await p.$$eval('nav [data-a="tab"]', l => l.map(x => x.getAttribute("data-t"))); for (const t of ts) await c('nav [data-a="tab"][data-t="' + t + '"]'); };
  await c('[data-a="setlang"][data-v="en"]');
  /* club con nombre malicioso, míster malicioso, jugador renombrado */
  await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", BAD); await p.fill("#ab", "<b>"); await c('[data-a="cnext"]'); await c('[data-a="cnext"]'); await c('[data-a="cnext"]');
  await p.fill("#fn", BAD); await p.fill("#ln", BAD); await c('[data-a="cnext"]');
  const inp = await p.$("[data-rn]"); await inp.fill(BAD + " " + BAD); await inp.press("Tab");
  await c('[data-a="startclub"]');
  await drain(40); await tabs();
  await c('nav [data-a="tab"][data-t="plantilla"]'); await c('.bchip'); await c('[data-a="renpl"]');
  if (await p.$("#rfn")) { await p.fill("#rfn", BAD); await p.fill("#rln", BAD); await c('[data-a="dorename"]'); await c('.sheet [data-a="close"]'); }
  await drain(60); await tabs();
  await c('[data-a="menu"]'); await c('[data-a="home"]'); await c('[data-a="goload"]'); await p.waitForTimeout(100);
  /* código de partida manipulado: cadenas maliciosas por todo el estado */
  const code = await p.evaluate((bad) => {
    const s = JSON.parse(serialize());
    const walk = (o, d) => { if (d > 6 || !o || typeof o !== "object") return; for (const k of Object.keys(o)) { if (typeof o[k] === "string" && !/^(ph|mode|kind|form|k|t|id|uid|pos|tr|role|ck|kind|typ|draw)$/.test(k) && o[k].length < 60) o[k] = bad; else walk(o[k], d + 1); } };
    walk(s.feed, 0); walk(s.m && s.m.sq, 0); if (s.m) { s.m.fn = bad; s.m.ln = bad; } s.custom.n = bad;
    return "CAMINO1:j:" + btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  }, BAD);
  await c('[data-a="import"]'); await p.fill("#incode", code); await c('[data-a="doImport"]'); await p.waitForTimeout(400);
  await tabs(); await c('[data-a="menu"]'); await c('[data-a="hof"]'); await p.waitForTimeout(200);
  const x = await p.evaluate(() => window.__x || 0);
  console.log("ejecuciones de código inyectado:", x, "· errores:", errs.length ? errs.slice(0, 5) : "ninguno");
  await b.close();
})();
