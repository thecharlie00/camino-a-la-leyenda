/* Prueba de interfaz en móvil con Playwright: recorre jugador → retirada → entrenador y hace capturas. */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(400);
  const shot = async (n) => { await p.screenshot({ path: path.join(OUT, n + ".png") }); };
  const overflow = async (label) => { const o = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (o) errs.push("desbordamiento horizontal en " + label); };
  const click = async (sel) => { await p.click(sel); await p.waitForTimeout(120); };
  // crear jugador
  await click('[data-a="newcareer"]');
  await p.fill("#fn", "Álex"); await p.fill("#ln", "Prueba");
  await click('[data-a="cnext"]'); await click('[data-a="cnext"]'); await click('[data-a="cnext"]'); await click('[data-a="cnext"]');
  await shot("01_carrera"); await overflow("carrera");
  // jugar hasta encontrar una decisión con porcentajes
  let found = false;
  for (let i = 0; i < 80 && !found; i++) {
    const hasOpt = await p.$('.opt .pct:not(.sure)');
    if (hasOpt) { found = true; break; }
    const ch = await p.$('[data-a="choose"]');
    if (ch) { await ch.click(); await p.waitForTimeout(80); continue; }
    const adv = await p.$('[data-a="advance"]');
    if (adv) { await adv.click(); await p.waitForTimeout(80); }
  }
  await p.evaluate(() => document.getElementById("main").scrollTop = 0);
  await shot("02_decision_porcentajes"); await overflow("decision");
  // avanzar hasta ver un momento clave
  for (let i = 0; i < 200; i++) {
    const hot = await p.$('.decision.hotc');
    if (hot) break;
    const ch = await p.$('[data-a="choose"]');
    if (ch) { await ch.click(); await p.waitForTimeout(40); continue; }
    const adv = await p.$('[data-a="advance"]');
    if (adv) { await adv.click(); await p.waitForTimeout(40); } else break;
  }
  await p.evaluate(() => document.getElementById("main").scrollTop = 0);
  await shot("03_momento"); await overflow("momento");
  // simular el resto de la carrera con el motor y retirar
  await p.evaluate(() => {
    let k = 0;
    while (S.ph !== "ret" && k++ < 60000) {
      cleanPend();
      if (S.pend.length) { const x = S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") ch = playerDesc(x).opts.length - 1; resolvePending(ch); }
      else advance();
    }
  });
  await click('[data-a="tab"][data-t="hist"]');
  await shot("04_historial_vitrina"); await overflow("historial");
  await p.evaluate(() => document.getElementById("main").scrollTop = 700);
  await shot("05_vitrina_premios");
  await click('[data-a="tab"][data-t="carrera"]');
  await shot("06_retirada"); await overflow("retirada");
  // empezar como entrenador
  await click('[data-a="startmgr"]');
  await shot("07_ofertas_banquillo"); await overflow("ofertas");
  await click('[data-a="choose"][data-i="0"]');
  await shot("08_club"); await overflow("club");
  // resolver las decisiones iniciales (cantera, renovaciones, plan) mostrando una
  for (let i = 0; i < 12; i++) { const ch = await p.$('main [data-a="choose"]'); if (!ch) break; if (i === 0) await shot("09_decision_mister"); await ch.click(); await p.waitForTimeout(80); }
  await click('[data-a="tab"][data-t="plantilla"]');
  await shot("10_plantilla"); await overflow("plantilla");
  await p.evaluate(() => document.getElementById("main").scrollTop = 900);
  await shot("11_plantilla_lista");
  await click('.prow');
  await shot("12_ficha_jugador"); await overflow("ficha");
  await click('.sheet [data-a="close"]');
  await p.evaluate(() => document.getElementById("main").scrollTop = 0);
  await click('[data-a="slot"][data-i="9"]');
  await shot("13_cambiar_hueco");
  await click('.sheet [data-a="setslot"]');
  await click('[data-a="tab"][data-t="mercado"]');
  await shot("14_mercado"); await overflow("mercado");
  const bid = await p.$('[data-a="mbid"]:not([disabled])');
  if (bid) { await bid.click(); await p.waitForTimeout(150); await shot("15_oferta_fichaje"); await overflow("oferta"); await click('.sheet [data-a="choose"]'); await shot("16_tras_oferta"); }
  if (await p.$('.sheet')) { const c = await p.$('.sheet [data-a="choose"]'); if (c) { await c.click(); await p.waitForTimeout(150); } }
  if (await p.$('.sheet')) await click('.sheet [data-a="close"]');
  // jugar algunos tramos como entrenador
  await click('[data-a="tab"][data-t="club"]');
  let shotMom = false, shotBlk = false;
  for (let i = 0; i < 160; i++) {
    if (!shotMom && await p.$('.decision.hotc')) { await p.evaluate(() => document.getElementById("main").scrollTop = 0); await shot("17_momento_banda"); shotMom = true; }
    const sch = await p.$('.sheet [data-a="choose"]');
    if (sch) { await sch.click(); await p.waitForTimeout(40); continue; }
    const ch = await p.$('main [data-a="choose"]');
    if (ch) { await ch.click(); await p.waitForTimeout(40); continue; }
    const adv = await p.$('[data-a="advance"]');
    if (adv) { await adv.click(); await p.waitForTimeout(40); if (!shotBlk && await p.$('article.card .matches')) { await shot("18_tramo_mister"); shotBlk = true; } } else break;
    const s = await p.evaluate(() => S.m.seasons.length);
    if (s >= 1 && await p.evaluate(() => S.ph === "off")) break;
  }
  await click('[data-a="tab"][data-t="comp"]');
  await shot("19_competicion"); await overflow("competición");
  await click('[data-a="tab"][data-t="hist"]');
  await shot("20_historial_mister"); await overflow("historial míster");
  // recarga: la partida debe persistir
  await p.reload(); await p.waitForTimeout(500);
  const mode = await p.evaluate(() => S && S.mode);
  if (mode !== "mgr") errs.push("tras recargar no se recupera la partida de entrenador");
  await shot("21_tras_recargar");
  console.log("errores:", errs.length ? errs : "ninguno");
  await b.close();
})();
