/* Fútbol femenino: los tres modos, textos en femenino, nombres inventados femeninos y ligas con su nombre femenino. */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/femshots"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })).newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const ov = async () => { for (let i = 0; i < 12; i++) { const st = await p.evaluate(() => { const lv = document.getElementById('live'); if (lv && !window.__keepLive) { const sm = lv.querySelector('[data-a="lsim"]'); if (sm) { sm.click(); return 2; } const en = lv.querySelector('[data-a="lend"]'); if (en) { en.click(); return 1; } } const t = document.querySelector('[data-a="troclose"]'); if (t) { t.click(); return 1; } const d = document.querySelector('.drw'); if (!d) return 0; const x = d.querySelector('[data-a="drawclose"]'); if (x) { x.click(); return 1; } const s = d.querySelector('[data-a="drawspeed"][data-v="skip"]'); if (s) s.click(); return 2; }); if (!st) return; await p.waitForTimeout(st === 2 ? 450 : 320); } };
  const clickIf = async (s) => { await ov(); let e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { await ov(); e = await p.$(s); if (!e) return false; await e.click({ timeout: 8000 }); } await p.waitForTimeout(60); return true; };
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await clickIf('[data-a=\"drawclose\"]')) continue; if (await clickIf('.ss-skip, [data-a=\"sskip\"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; } for (let j = 0; j < 8 && (await p.$('.sheet')); j++) { if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="drawclose"]')) continue; await clickIf('.sheet [data-a="close"]'); } };
  const text = () => p.evaluate(() => document.body.innerText);
  const realNames = await p.evaluate(() => { const s = new Set(); Object.values(REAL.c).forEach(c => { c.p.forEach(r => s.add(r[0] + " " + r[1])); }); return [...s].filter(n => n.length > 8); });
  const checkReal = (t, label) => { const hit = realNames.filter(n => t.includes(n)); if (hit.length) errs.push(label + ": nombres reales masculinos " + hit.slice(0, 3).join(", ")); };
  await p.click('[data-a="setlang"][data-v="es"]');
  /* jugadora */
  await p.click('[data-a="newgame"]'); await p.click('[data-a="gsel"][data-v="f"]');
  notes.push("modos: " + (await p.$$eval(".modec b", l => l.map(x => x.textContent))).join(" | "));
  await p.screenshot({ path: OUT + "/01-modos.png" });
  await p.click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Alexia"); await p.fill("#ln", "Prueba");
  await p.click('[data-a="cnext"]'); await p.screenshot({ path: OUT + "/02-pos.png" });
  notes.push("posiciones: " + (await text()).match(/Delanter\w+ centro|Portera|Portero/g));
  for (let i = 0; i < 2; i++) await p.click('[data-a="cnext"]');
  await p.screenshot({ path: OUT + "/03-ofertas.png" });
  await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  notes.push("S.g=" + await p.evaluate(() => S.g) + " FEM=" + await p.evaluate(() => FEM) + " liga: " + await p.evaluate(() => lgName(S.cl[S.p.club])) + " · ESP1: " + await p.evaluate(() => lgName(W.lgIdx.ESP1)) + " · ESP2: " + await p.evaluate(() => lgName(W.lgIdx.ESP2)) + " · ESP301: " + await p.evaluate(() => lgName(W.lgIdx.ESP301)) + " · ESP501: " + await p.evaluate(() => lgName(W.lgIdx.ESP501)));
  notes.push("comp: " + await p.evaluate(() => [trComp("Mundial 2030"), trComp("Champions League"), trComp("Copa del Rey"), trComp("Eurocopa"), trComp("Juegos Olímpicos")].join(" · ")));
  await drain(60); await p.screenshot({ path: OUT + "/04-jugadora.png" });
  let t = await text(); checkReal(t, "jugadora");
  notes.push("rivales: " + await p.evaluate(() => (S.rv || []).slice(0, 4).map(r => r.n).join(", ")));
  for (const tab of ["club", "carrera", "temporada", "liga"]) await clickIf('nav [data-a="tab"][data-t="' + tab + '"]');
  checkReal(await text(), "jugadora pestañas");
  /* entrenadora */
  await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="gsel"][data-v="f"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Sarina"); await p.fill("#ln", "Prueba");
  await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  notes.push("plantilla: " + await p.evaluate(() => S.m.sq.slice(0, 6).map(x => x.fn + " " + x.ln).join(", ")) + " · g=" + await p.evaluate(() => S.g));
  await drain(40); checkReal(await text(), "entrenadora"); await p.screenshot({ path: OUT + "/05-entrenadora.png" });
  /* club propio, en inglés */
  await p.click('[data-a="menu"]'); await p.click('[data-a="setlang"][data-v="en"]'); await p.click('.sheet [data-a="close"]');
  notes.push("EN liga: " + await p.evaluate(() => lgName(S.cl[S.m.club])) + " · " + await p.evaluate(() => [trComp("Mundial 2031"), tr("Carrera de míster"), posName("POR")].join(" · ")));
  await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="gsel"][data-v="f"]'); await p.click('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", "Club Prueba"); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]');
  await p.fill("#fn", "Owner"); await p.fill("#ln", "Test"); await p.click('[data-a="cnext"]');
  await p.click('[data-a="startclub"]'); await drain(30); checkReal(await text(), "club"); await p.screenshot({ path: OUT + "/06-club-en.png" });
  /* masculino sigue igual */
  await p.click('[data-a="menu"]'); await p.click('[data-a="setlang"][data-v="es"]'); await p.click('.sheet [data-a="close"]');
  await p.click('[data-a="menu"]'); await p.click('[data-a="home"]');
  notes.push("portada FEM=" + await p.evaluate(() => FEM) + " · tags: " + (await p.$$eval(".slotc .tag", l => l.map(x => x.textContent))).join(" | "));
  await p.click('[data-a="newgame"]'); await p.click('[data-a="gsel"][data-v="m"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Prueba"); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  notes.push("masc: g=" + await p.evaluate(() => S.g) + " FEM=" + await p.evaluate(() => FEM) + " ESP1: " + await p.evaluate(() => lgName(W.lgIdx.ESP1)) + " · " + tr0(await p.evaluate(() => tr("Carrera de míster"))));
  function tr0(x) { return x; }
  console.log(notes.join("\n")); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "ERRORES: ninguno");
  await b.close();
})();
