/* 3.7: caras, posiciones secundarias, media física (PHY) y etiqueta de versión.
   Uso: node test/squad37.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots38";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const click = async (s) => { const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(100); return true; };
  await click('[data-a="setlang"][data-v="es"]');
  /* etiqueta de versión en la portada */
  const vt = await p.$("#vtag"); const vtxt = vt ? await vt.textContent() : "";
  notes.push("etiqueta: " + vtxt);
  if (!/^v[\d.]+ \(\d+\) · (WEB|LIVE)$/.test(vtxt)) fail.push("etiqueta de versión: " + vtxt);
  await click("#vtag"); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(OUT, "01-version.png") });
  const vs = await p.evaluate(() => (document.querySelector(".sheet") || {}).textContent || "");
  if (!/Novedades/.test(vs) || !/Copiar información del sistema/.test(vs)) fail.push("hoja de versión incompleta");
  await click('[data-a="close"]');
  /* partida de míster */
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Álex"); await p.fill("#ln", "Prueba"); await click('[data-a="cnext"]');
  await click('[data-a="cnext"]'); await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  for (let i = 0; i < 6; i++) { if (!(await click('[data-a="objok"]')) && !(await click('.sheet [data-a="choose"]'))) break; }
  /* lógica */
  const lg = await p.evaluate(() => {
    const sq = S.m.sq, r = {};
    r.pos2 = sq.map(q => plPos2(q).length); r.gk2 = sq.filter(q => q.pos === "POR").every(q => plPos2(q).length === 0);
    const q = sq.find(x => plPos2(x).length), sp = q ? plPos2(q)[0] : null;
    r.sec = q ? [posLv(q, sp), posFit(q.pos, sp, q), posFit(q.pos, sp)] : null;
    const gk = sq.find(x => x.pos === "POR"); r.inc = [posLv(gk, "DC"), posFit(gk.pos, "DC", gk)];
    const out = sq.find(x => x.pos === "DC"); const far = ["LD", "DFC", "LI"].find(s => posLv(out, s) === 2); r.emg = far ? [posLv(out, far), posFit(out.pos, far, out)] : null;
    const ph = sq.map(plPhy); r.phy = [Math.min(...ph), Math.max(...ph)];
    r.det = JSON.stringify(faceOf(sq[0])) === JSON.stringify(faceOf(JSON.parse(JSON.stringify(sq[0]))));
    /* la resistencia modula el cansancio */
    const a = sq.find(x => x.pos !== "POR"); a.fit = 90; const res = plRes(a);
    r.res = res;
    return r;
  });
  notes.push("lógica: " + JSON.stringify(lg));
  if (!lg.gk2) fail.push("portero con secundarias");
  if (!lg.sec || lg.sec[0] !== 1 || lg.sec[1] !== 2) fail.push("secundaria mal: " + JSON.stringify(lg.sec));
  if (lg.inc[0] !== 3 || lg.inc[1] !== 25) fail.push("incompatible mal");
  if (lg.emg && (lg.emg[0] !== 2 || lg.emg[1] < 6)) fail.push("emergencia mal");
  if (lg.phy[0] < 1 || lg.phy[1] > 99) fail.push("PHY fuera de rango");
  if (!lg.det) fail.push("cara no determinista");
  /* plantilla */
  await click('[data-a="tab"][data-t="plantilla"]'); await p.waitForTimeout(250);
  const favN = await p.$$eval(".prow .fav", e => e.length);
  notes.push("caras en no convocados: " + favN);
  await p.screenshot({ path: path.join(OUT, "02-plantilla.png") });
  await p.evaluate(() => { const z = document.querySelector(".zone"); if (z) z.scrollIntoView(); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(OUT, "03-noconvocados.png") });
  if (!favN) fail.push("sin caras en la lista");
  /* consejo del segundo entrenador */
  await p.evaluate(() => { const id = S.m.xi.find(x => x != null && mPl(x).pos !== "POR"); mPl(id).fit = 15; window.__tired = id; UIX.render(true); });
  const ac = await p.$(".assist");
  if (!ac) fail.push("sin consejo del segundo entrenador"); else {
    await p.screenshot({ path: path.join(OUT, "04-consejo.png") });
    await click('.assist [data-a="phyrest"]');
    const sw = await p.evaluate(() => S.m.xi.indexOf(window.__tired) < 0);
    notes.push("descanso aplicado: " + sw);
    if (!sw) fail.push("no se cambia al cansado");
  }
  /* ficha */
  await p.evaluate(() => { UIX.render(true); });
  const row = await p.$(".prow"); if (row) await row.click(); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, "05-ficha.png") });
  const ps = await p.evaluate(() => ({ big: !!document.querySelector(".sheet .favbig svg"), phy: (document.querySelector(".sheet .psphy") || {}).textContent || "" }));
  notes.push("ficha: " + JSON.stringify(ps).slice(0, 160));
  if (!ps.big || !/Media física/.test(ps.phy)) fail.push("ficha sin cara grande o PHY");
  await click('[data-a="close"]');
  /* lista de un hueco */
  await p.evaluate(() => { document.querySelector(".mpitch").scrollIntoView(); });
  await click('.mpitch [data-a="slot"][data-i="9"]'); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(OUT, "06-hueco.png") });
  const lv = await p.$$eval(".sheet .lvtag", e => e.map(x => x.textContent));
  notes.push("niveles en la lista: " + lv.slice(0, 6).join(", "));
  await click('[data-a="close"]');
  /* menú con la versión */
  await click('[data-a="menu"]'); await p.waitForTimeout(200);
  if (!(await p.$('.sheet [data-a="vtag"], [data-a="vtag"].inmenu'))) fail.push("sin versión en el menú");
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (ov) fail.push("desbordamiento horizontal");
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
