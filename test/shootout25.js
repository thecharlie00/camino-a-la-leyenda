/* Parche 2.5: tanda de penaltis completa — pizarra de lanzadores del míster, tanda penalti a penalti,
   jugador de campo (tu penalti con minijuego y presión) y portero (cada penalti rival).
   Uso: NODE_PATH=/opt/node-tools/node_modules node test/shootout25.js [carpeta] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shootout25"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  const errs = [], notes = [], fails = [];
  const check = (c, m) => { if (!c) fails.push(m); };
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  const clickIf = async (s) => { const e = await p.$(s); if (!e) return false; await e.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(60); return true; };
  const shot = (n) => p.screenshot({ path: OUT + "/" + n + ".png" });
  const st = () => p.evaluate(() => { const v = UIX.shootout.state(); return v ? { stage: v.stage, wait: !!v.wait, side: v.nk && v.nk.side, press: v.nk && v.nk.press, n: v.st ? v.st.log.length : 0 } : null; });
  async function kickMinigame(gk) {
    await p.waitForSelector(".mg-cell");
    await p.tap('.mg-cell[data-i="' + (gk ? 3 : 1) + '"]'); await p.tap(".mg-btn.pri"); await p.waitForTimeout(500);
    const press = await p.evaluate(() => { const o = document.querySelector(".mg-ov"); const z = document.querySelector(".mg-zone"); return { press: o.getAttribute("data-press"), tense: o.classList.contains("mg-tense"), zone: z.style.width }; });
    await p.keyboard.press("Space");
    await p.waitForFunction(() => !document.querySelector(".mg-ov"), null, { timeout: 9000 });
    return press;
  }
  async function newGame(mode) {
    await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
    await clickIf('[data-a="setlang"][data-v="es"]');
    await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="' + mode + '"]');
    if (mode === "mgr") {
      await p.fill("#fn", "Pep"); await p.fill("#ln", "Tanda");
      for (let i = 0; i < 2; i++) await p.click('[data-a="cnext"]');
      await clickIf('[data-a="cset"][data-k="mmode"][data-v="pick"]'); await clickIf('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(300);
    } else {
      await p.fill("#fn", "Leo"); await p.fill("#ln", "Penaltis");
      for (let i = 0; i < 3; i++) await p.click('[data-a="cnext"]');
      await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
    }
  }
  /* avanza (resolviendo decisiones con la opción 0, sin interfaz) hasta tener un partido jugado y deja una tanda pendiente */
  async function injectShootout(kind) {
    const ok = await p.evaluate((kind) => {
      S.noLiveAuto = true;
      for (let g = 0; g < 400; g++) {
        const fi = S.cur && S.cur.pm ? S.cur.pm.findIndex(f => f && f.opp != null && f.or && (kind === "mso" ? f.xi && f.xi.length >= 11 : f.us != null)) : -1;
        if (fi >= 0 && !S.pend.length) {
          const f = S.cur.pm[fi]; f.needPens = true; f.pens = null; f.etu = f.etu || 0; f.ett = f.ett || 0; f.gt = f.gu;
          S.pend.unshift(kind === "mso" ? mp("mso", { fi: fi }) : { k: "so", fi: fi });
          return true;
        }
        if (S.pend.length) { const x = S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "jobs") { mgrTakeJob(x.list[0].club, x.list[0].sal); continue; } resolvePending(ch); }
        else advance();
      }
      return false;
    }, kind);
    await p.evaluate((t) => { UIX.closeSheet && UIX.ui().sheet && UIX.closeSheet(); UIX.ui().tab = t; UIX.render(true); }, kind === "mso" ? "club" : "carrera");
    await p.waitForTimeout(250);
    return ok;
  }

  /* ===== 1. MÍSTER: pizarra + tanda ===== */
  await newGame("mgr");
  check(await injectShootout("mso"), "míster: no se pudo preparar la tanda");
  await p.evaluate(() => window.scrollTo(0, 0));
  const soBtn = await p.$('.opt[data-a="so"]');
  check(!!soBtn, "míster: falta la opción de tanda en directo");
  if (soBtn) await soBtn.scrollIntoViewIfNeeded().catch(() => {});
  await shot("01-mgr-opciones");
  await p.click('.opt[data-a="so"]'); await p.waitForSelector(".so-ord");
  notes.push("pizarra: " + await p.$$eval(".so-li", l => l.length) + " lanzadores · sugerido: " + await p.$$eval(".so-who b", l => l.slice(0, 5).map(x => x.textContent).join(", ")));
  await shot("02-mgr-pizarra");
  const before = await p.evaluate(() => UIX.shootout.state().ord.slice(0, 5));
  await p.tap('.so-row[data-k="0"]'); await p.waitForTimeout(80); await shot("03-mgr-seleccion");
  await p.tap('.so-row[data-k="4"]'); await p.waitForTimeout(80);
  await p.tap('[data-so="down"][data-k="1"]'); await p.waitForTimeout(80);
  const after = await p.evaluate(() => ({ ord: UIX.shootout.state().ord.slice(0, 5), saved: (S.pend[0].ord || []).slice(0, 5) }));
  check(after.ord[0] === before[4] && after.ord[4] === before[0] && after.ord[1] === before[2], "míster: el intercambio no reordena");
  check(JSON.stringify(after.ord) === JSON.stringify(after.saved), "míster: el orden no se guarda en la decisión");
  notes.push("orden: " + JSON.stringify(before) + " → " + JSON.stringify(after.ord));
  await p.click('[data-so="start"]'); await p.waitForSelector(".so-board");
  await p.waitForTimeout(150); await shot("04-mgr-sorteo");
  await p.waitForFunction(() => { const v = UIX.shootout.state(); return v && v.st && v.st.log.length >= 3; }, null, { timeout: 15000 });
  await p.waitForTimeout(300);
  await shot("05-mgr-tanda");
  const firstUs = await p.evaluate(() => { const v = UIX.shootout.state(); return v.st.log.filter(l => l.s === 0).map(l => l.n)[0]; });
  const ord0 = await p.evaluate(() => { const v = UIX.shootout.state(); return v.st.us[0].n; });
  check(firstUs === ord0, "míster: el primer lanzador no respeta el orden (" + firstUs + " vs " + ord0 + ")");
  await p.click('[data-so="sim"]'); await p.waitForSelector(".so-end");
  await shot("06-mgr-final");
  const sc = await p.evaluate(() => SO.score(UIX.shootout.state().st));
  await p.click('[data-so="end"]'); await p.waitForTimeout(300);
  const res = await p.evaluate(() => { const f = S.cur.pm.find(f => f.needPens); return { pens: f && f.pens, feed: S.feed[0] && S.feed[0].title + " · " + S.feed[0].txt, pend: S.pend[0] && S.pend[0].k }; });
  notes.push("míster resultado: " + JSON.stringify(sc) + " → " + JSON.stringify(res));
  check(res.pens && res.pens[0] === sc[0] && res.pens[1] === sc[1], "míster: f.pens no coincide con la tanda");
  check(res.pend !== "mso", "míster: la decisión sigue pendiente");
  await shot("07-mgr-tarjeta");

  /* ===== 2. JUGADOR DE CAMPO ===== */
  await newGame("p");
  await p.evaluate(() => { S.p.pos = "DC"; });
  check(await injectShootout("so"), "jugador: no se pudo preparar la tanda");
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot("08-jug-opciones");
  await p.click('.opt[data-a="so"]'); await p.waitForSelector(".so-board");
  /* que te toque tirar en esta tanda: te ponemos el primero del orden */
  await p.evaluate(() => { const us = UIX.shootout.state().st.us, i = us.findIndex(t => t.me); us.unshift(us.splice(i, 1)[0]); });
  await p.waitForFunction(() => { const v = UIX.shootout.state(); return v && (v.wait || v.stage === "end"); }, null, { timeout: 30000 });
  let s1 = await st();
  notes.push("jugador, tu turno: " + JSON.stringify(s1));
  await shot("09-jug-tu-turno");
  if (s1.wait) {
    await p.click('[data-so="mine"]');
    const mg = await kickMinigame(false);
    notes.push("minijuego con presión: " + JSON.stringify(mg));
    check(mg.press != null && +mg.press === s1.press, "jugador: el minijuego no recibe la presión");
    await p.waitForTimeout(200); await shot("10-jug-tras-penalti");
  }
  /* presión máxima: misma barra, zona estrecha y marcador temblando */
  await p.evaluate(() => { window.__mgP = Minigame.penalty({ skill: 80, gk: 70, pressure: 0.6, press: 1 }, function () {}); });
  await p.waitForSelector(".mg-cell"); await p.tap('.mg-cell[data-i="1"]'); await p.tap(".mg-btn.pri"); await p.waitForTimeout(450);
  const zone1 = await p.evaluate(() => document.querySelector(".mg-zone").style.width);
  await shot("11-presion-maxima");
  await p.evaluate(() => window.__mgP.close());
  await p.evaluate(() => { window.__mgP = Minigame.penalty({ skill: 80, gk: 70, pressure: 0.6 }, function () {}); });
  await p.waitForSelector(".mg-cell");
  const zone0 = await p.evaluate(() => ({ w: document.querySelector(".mg-zone").style.width, tense: document.querySelector(".mg-ov").classList.contains("mg-tense") }));
  await p.evaluate(() => window.__mgP.close());
  notes.push("zona ideal: sin presión " + zone0.w + " (tiembla " + zone0.tense + ") · presión máxima " + zone1);
  check(parseFloat(zone1) < parseFloat(zone0.w) && !zone0.tense, "minijuego: la presión no estrecha la zona");
  if ((await st()).stage !== "end") { await p.click('[data-so="sim"]'); }
  await p.waitForSelector(".so-end"); await shot("12-jug-final");
  const psc = await p.evaluate(() => SO.score(UIX.shootout.state().st));
  await p.click('[data-so="end"]'); await p.waitForTimeout(300);
  const pres = await p.evaluate(() => ({ pens: S.cur.pm.find(f => f.needPens).pens, feed: S.feed[0] && S.feed[0].txt, pend: S.pend[0] && S.pend[0].k }));
  notes.push("jugador resultado: " + JSON.stringify(psc) + " → " + JSON.stringify(pres));
  check(pres.pens && pres.pens[0] === psc[0] && pres.pens[1] === psc[1], "jugador: f.pens no coincide");
  await shot("13-jug-tarjeta");

  /* ===== 3. PORTERO ===== */
  await p.evaluate(() => { S.p.pos = "POR"; S.p.injT = 0; S.p.susp = 0; });
  check(await injectShootout("so"), "portero: no se pudo preparar la tanda");
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot("14-gk-opciones");
  await p.click('.opt[data-a="so"]'); await p.waitForSelector(".so-board");
  let faced = 0;
  for (let k = 0; k < 3; k++) {
    await p.waitForFunction(() => { const v = UIX.shootout.state(); return v && (v.wait || v.stage === "end"); }, null, { timeout: 30000 });
    const s = await st();
    if (s.stage === "end" || !s.wait) break;
    if (k === 0) await shot("15-gk-tu-turno");
    await p.click('[data-so="mine"]');
    if (k === 0) { await p.waitForSelector(".mg-cell"); await shot("16-gk-minijuego"); }
    await kickMinigame(true); faced++;
    await p.waitForTimeout(150);
  }
  notes.push("portero: penaltis afrontados " + faced);
  check(faced >= 1, "portero: no se enfrenta a ningún penalti");
  await shot("17-gk-tras-paradas");
  if ((await st()).stage !== "end") await p.click('[data-so="sim"]');
  await p.waitForSelector(".so-end"); await shot("18-gk-final");
  const gsc = await p.evaluate(() => ({ sc: SO.score(UIX.shootout.state().st), rival: UIX.shootout.state().st.log.filter(l => l.s === 1).length }));
  await p.click('[data-so="end"]'); await p.waitForTimeout(300);
  const gres = await p.evaluate(() => ({ pens: S.cur.pm.find(f => f.needPens).pens, feed: S.feed[0] && S.feed[0].txt, chips: JSON.stringify(S.feed[0] && S.feed[0].chips) }));
  notes.push("portero resultado: " + JSON.stringify(gsc) + " → " + JSON.stringify(gres));
  check(gres.pens && gres.pens[0] === gsc.sc[0], "portero: f.pens no coincide");
  await shot("19-gk-tarjeta");

  /* ===== 4. resolución sin interfaz (bots): opción 0 simula la tanda entera ===== */
  const headless = await p.evaluate(() => {
    const out = [];
    for (let r = 0; r < 3; r++) {
      const fi = S.cur.pm.findIndex(f => f && f.us != null && f.or); const f = S.cur.pm[fi]; f.pens = null;
      S.pend.unshift({ k: "so", fi: fi }); const c = resolvePending(0); out.push(c && f.pens ? f.pens.join("-") : "FALLO");
    }
    return out;
  });
  notes.push("sin interfaz: " + headless.join(", "));
  check(headless.every(x => x !== "FALLO"), "resolvePending(0) no resuelve la tanda");

  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "ERRORES: ninguno");
  console.log(fails.length ? "FALLOS:\n" + fails.join("\n") : "FALLOS: ninguno");
  await b.close();
  process.exit(errs.length || fails.length ? 1 : 0);
})();
