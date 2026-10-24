/* 5.6: mascota en el juego real — adoptar, tarjeta con miniatura, abrir el mundo, tramo y temporada (sin muerte), migración v1.
   Uso: node test/pet56.js */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const click = async (s) => { const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(90); return true; };
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Mascota");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  for (let i = 0; i < 6; i++) { if (!(await click('[data-a="objok"]')) && !(await click('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { S.p.money = 50000; UIX.render(false); });
  await click('[data-a="tab"][data-t="jugador"]');
  await click('[data-a="petopen"]'); await click('[data-a="petpick"][data-v="cat"]');
  await p.fill("#petnm", "Misi"); await click('[data-a="petadopt"]');
  const st = await p.evaluate(() => { const pt = petOf(); return pt && {v: pt.v, nm: pt.nm, inv: PetSim.inv().food_basic}; });
  if (!st || st.v !== 2 || st.nm !== "Misi" || !st.inv) fail.push("adopción v2: " + JSON.stringify(st));
  await click('[data-a="close"]'); await p.evaluate(() => UIX.render(false));
  if (!(await p.$(".petcard .petthumb"))) fail.push("sin miniatura vóxel en la tarjeta");
  await click('.petcard'); await p.waitForTimeout(600);
  if (!(await p.$(".pw .pw-cv"))) fail.push("no abre el mundo de la mascota");
  await click('.pw-bar [data-v="care"]'); await click('[data-pw="food"]'); await p.waitForTimeout(400);
  await click('[data-pw="x"]'); await p.waitForTimeout(500);
  if (await p.$(".pw")) fail.push("no se cierra");
  /* sin bonificaciones visibles en atributos; tramo y temporadas: nunca muere */
  const r = await p.evaluate(() => {
    const a0 = JSON.stringify(attrs()); const pt = petOf(); pt.bond = 95; const m0 = S.p.mor;
    for (let i = 0; i < 3; i++) petBlock();
    for (let y = 0; y < 30; y++) petSeason();
    return {same: a0 === JSON.stringify(attrs()), alive: !!petOf(), age: petOf().age, st: petStage(petOf()), mor: S.p.mor >= m0 - 0.01};
  });
  if (!r.same) fail.push("atributos cambian por la mascota");
  if (!r.alive || r.age !== 30 || r.st !== 3) fail.push("crecimiento/sin muerte: " + JSON.stringify(r));
  /* migración de una partida antigua */
  const mg = await p.evaluate(() => { const L = lifeOf(); L.pet = {k: "dog", nm: "Rex", age: 2, life: 12, bond: 70, tricks: 2, eq: {h: "cap"}, acts: {}, col: "nat"}; const pt = petOf(); return {v: pt.v, nm: pt.nm, tr: Object.keys(pt.tr).length, eq: pt.eq.h}; });
  if (mg.v !== 2 || mg.nm !== "Rex" || mg.tr !== 2 || mg.eq !== "cap") fail.push("migración: " + JSON.stringify(mg));
  await p.evaluate(() => UIX.render(false));
  console.log(fail.length ? "FALLOS:\n" + fail.join("\n") : "pet56 OK", errs.length ? "\nERRORES:\n" + errs.slice(0, 8).join("\n") : "");
  await b.close(); process.exit(fail.length || errs.length ? 1 : 0);
})();
