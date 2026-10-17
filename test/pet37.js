/* 3.7: mascota — formas de darle cariño, aviso de atención, color, fondo y accesorios (tienda y trofeos).
   Uso: node test/pet37.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots37";
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
  const click = async (s) => { const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(90); return true; };
  await click('[data-a="setlang"][data-v="es"]');
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Mascota");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  for (let i = 0; i < 6; i++) { if (!(await click('[data-a="objok"]')) && !(await click('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { S.p.money = 50000; UIX.render(false); });
  await click('[data-a="tab"][data-t="jugador"]');
  await click('[data-a="petopen"]'); await click('[data-a="petpick"][data-v="dog"]');
  await p.fill("#petnm", "Toby"); await click('[data-a="petadopt"]');
  const adopted = await p.evaluate(() => !!petOf() && petOf().nm);
  if (adopted !== "Toby") fail.push("no se adoptó: " + adopted);
  /* acciones de cariño: dos por tramo */
  const acts = await p.evaluate(() => petCareList(petOf()).map(c => c.k));
  notes.push("acciones perro: " + acts.join(","));
  if (acts.indexOf("walk") < 0 || acts.indexOf("home") >= 0) fail.push("acciones por especie mal: " + acts);
  const b0 = await p.evaluate(() => petOf().bond);
  await click('[data-a="petact"][data-v="walk"]'); await click('[data-a="petact"][data-v="play"]');
  const r3 = await p.evaluate(() => petAct("pat"));
  const b1 = await p.evaluate(() => petOf().bond);
  notes.push("vínculo " + b0 + " → " + b1 + " · tercera acción: " + JSON.stringify(r3));
  if (!(b1 > b0) || !r3.tired) fail.push("límite de acciones o vínculo");
  await p.screenshot({ path: path.join(OUT, "01-cuidar.png") });
  /* aviso: un tramo sin cuidarla */
  const need = await p.evaluate(() => { const pt = petOf(); pt.cared = false; pt.acts = {}; petBlock(); const f = S.feed.slice(0, 4).map(x => x.x || x.t || "").join(" | "); return {need: petNeeds(), ui: UIX.petNeed(), feed: f}; });
  notes.push("tras un tramo sin cuidarla: " + JSON.stringify(need).slice(0, 220));
  if (!need.need || !need.ui) fail.push("no avisa de que necesita atención");
  await click('[data-a="close"]'); await p.evaluate(() => UIX.render(false));
  const badge = await p.$('nav.tabs .nbadge.pet'); if (!badge) fail.push("sin aviso en la pestaña Yo");
  await click('[data-a="tab"][data-t="carrera"]');
  const alertCard = await p.$('.petalert'); if (!alertCard) fail.push("sin aviso en Inicio");
  await p.screenshot({ path: path.join(OUT, "02-aviso.png") });
  await click('.petalert');
  await click('[data-a="petact"][data-v="pat"]');
  if (await p.evaluate(() => petNeeds())) fail.push("el aviso no se quita al cuidarla");
  /* estilo: color, fondo, compra y accesorios de trofeo */
  await click('[data-a="petview"][data-v="style"]');
  await click('[data-a="petcol"][data-v="blue"]'); await click('[data-a="petbg"][data-v="club"]');
  await click('[data-a="petbuy"][data-v="sun"]'); await click('[data-a="petbuy"][data-v="cap"]');
  const st = await p.evaluate(() => ({col: petOf().col, bg: petOf().bg, eq: petOf().eq, own: lifeOf().petAcc.slice()}));
  notes.push("estilo: " + JSON.stringify(st));
  if (st.col !== "blue" || st.bg !== "club" || st.eq.f !== "sun" || st.eq.h !== "cap") fail.push("estilo no aplicado");
  const goldLocked = await p.evaluate(() => petSetCol("gold"));
  if (goldLocked) fail.push("color oro sin Balón de Oro");
  const un = await p.evaluate(() => {
    S.p.trophies.push({k: "UCL", n: "Champions", y: S.yr, s: "x", w: 20}, {k: "L:1", n: "Liga", y: S.yr, s: "x", w: 10});
    S.p.awards.push({k: "bdo", y: S.yr});
    const got = petAccSync(); return {got: got.map(a => a.n), own: lifeOf().petAcc.slice(), gold: petSetCol("gold")};
  });
  notes.push("desbloqueos: " + JSON.stringify(un));
  if (un.own.indexOf("crown") < 0 || un.own.indexOf("cup") < 0 || un.own.indexOf("star") < 0 || !un.gold) fail.push("desbloqueos por trofeo");
  await p.evaluate(() => UIX.renderSheet());
  await click('[data-a="petwear"][data-v="crown"]'); await click('[data-a="petwear"][data-v="cup"]');
  await p.evaluate(() => UIX.renderSheet());
  await p.screenshot({ path: path.join(OUT, "03-estilo.png") });
  const sheetEl = await p.$(".sheet"); if (sheetEl) await sheetEl.evaluate(e => { const sc = e.querySelector(".sheet-body") || e; sc.scrollTop = 99999; });
  await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(OUT, "04-accesorios.png") });
  /* modo edición: arrastrar, tamaño y giro */
  await p.evaluate(() => { UIX.ui().petView = "style"; UIX.renderSheet(); });
  await click('[data-a="petview"][data-v="edit"]');
  const g = await p.$('.petedit .pacc[data-sl="f"]');
  if (!g) fail.push("modo edición sin accesorios"); else {
    const bb = await g.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down();
    await p.mouse.move(bb.x + bb.width / 2 + 30, bb.y + bb.height / 2 + 20, { steps: 6 }); await p.mouse.up();
    await p.waitForTimeout(150);
    await click('[data-a="petsel"][data-v="f"]');
    await click('[data-a="petadj"][data-v="s+"]'); await click('[data-a="petadj"][data-v="r+"]'); await click('[data-a="petadj"][data-v="u"]');
    const adj = await p.evaluate(() => JSON.stringify(petOf().adj));
    notes.push("ajustes: " + adj);
    const j = JSON.parse(adj), a = j && Object.values(j)[0] && Object.values(j)[0].f;
    if (!a || !(a.x > 3) || !(a.s > 1) || a.r !== 10) fail.push("modo edición no guarda: " + adj);
    await p.screenshot({ path: path.join(OUT, "07-edicion.png") });
    await click('[data-a="petadj"][data-v="reset"]');
    if (await p.evaluate(() => { const A = petOf().adj; const v = A && Object.values(A)[0]; return !!(v && v.f); })) fail.push("recolocar no restablece");
    await click('[data-a="petview"][data-v="style"]');
  }
  /* foto con accesorios: más fama */
  const ph = await p.evaluate(() => { const pt = petOf(); pt.acts = {}; return petAct("photo"); });
  notes.push("foto: " + JSON.stringify(ph));
  if (!ph.ok || !(ph.bonus > 1.5)) fail.push("bonus de foto con accesorios");
  /* nueva mascota conserva los accesorios */
  const keep = await p.evaluate(() => { lifeOf().pet = null; S.p.money = 50000; petAdopt("cat", "Misi"); return {own: lifeOf().petAcc.length, wear: petWear("crown"), acts: petCareList(petOf()).map(c => c.k).join(",")}; });
  notes.push("nueva mascota: " + JSON.stringify(keep));
  if (!keep.wear) fail.push("los accesorios no pasan a la nueva mascota");
  /* recordatorio del móvil */
  await click('[data-a="close"]');
  await click('[data-a="tab"][data-t="jugador"]');
  await p.evaluate(() => { const pt = petOf(); pt.col = "gold"; pt.bg = "club"; pt.eq = {h: "crown", f: "sun", t: "cup"}; UIX.persist(); UIX.render(false); });
  await p.waitForTimeout(7000);
  await p.evaluate(() => { const c = document.querySelector(".petcard"); if (c) c.scrollIntoView({block: "center"}); });
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, "05-tarjeta.png") });
  await click('[data-a="petopen"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, "06-hoja.png") });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (ov) fail.push("desbordamiento horizontal");
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
