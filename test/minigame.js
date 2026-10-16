/* Minijuegos (penalti y falta directa, como tirador y como portero): abre todos en un móvil 412×915 táctil,
   simula toques, trazos y arrastres, comprueba que done recibe {p, scored} (y saved en los de portero) y que la
   superposición desaparece. Capturas en /tmp/minigame-*.png (portero: /tmp/minigame-gk-*.png).
   Uso: node test/minigame.js */
const path = require("path");
const assert = require("assert");
const {chromium} = require("playwright");
const URL = "file://" + path.join(__dirname, "minigame.html");
const shot = (p, name) => p.screenshot({path: "/tmp/minigame-" + name + ".png"});

async function waitBarIn(p, lo, hi) { /* espera a que la bola de la barra esté en [lo, hi] (fracción) */
  await p.waitForFunction(([lo, hi]) => { const m = document.querySelector(".mg-mark"); const f = parseFloat(m.style.left) / 100; return f >= lo && f <= hi; }, [lo, hi], {polling: "raf", timeout: 5000});
}
async function tapSvg(p, sel, x, y) { /* toque en coordenadas del viewBox */
  const q = await p.evaluate(([sel, x, y]) => { const s = document.querySelector(sel), m = s.getScreenCTM(); return {x: m.a * x + m.e, y: m.d * y + m.f}; }, [sel, x, y]);
  await p.touchscreen.tap(q.x, q.y);
}
async function touchDrag(cdp, p, pts) { /* trazo con eventos táctiles reales (CDP) a partir de puntos del viewBox */
  const sc = await p.evaluate((pts) => { const s = document.querySelector(".mg-fk svg"), m = s.getScreenCTM(); return pts.map(q => ({x: m.a * q.x + m.e, y: m.d * q.y + m.f})); }, pts);
  await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [sc[0]]});
  for (let i = 1; i < sc.length; i++) { await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [sc[i]]}); }
  await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
}
async function mouseDrag(p, pts) {
  const sc = await p.evaluate((pts) => { const s = document.querySelector(".mg-fk svg"), m = s.getScreenCTM(); return pts.map(q => ({x: m.a * q.x + m.e, y: m.d * q.y + m.f})); }, pts);
  await p.mouse.move(sc[0].x, sc[0].y); await p.mouse.down();
  for (let i = 1; i < sc.length; i++) await p.mouse.move(sc[i].x, sc[i].y);
  await p.mouse.up();
}
function bez(a, c, b, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push({x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y}); } return o; }
const probNum = (p) => p.$eval(".mg-prob b", b => { const m = b.textContent.match(/\d+/); return m ? m[0] : b.textContent.trim(); });
function checkRes(r, kind) {
  assert.strictEqual(r.kind, kind);
  assert.strictEqual(typeof r.res.p, "number"); assert.ok(r.res.p > 0 && r.res.p < 1, "p fuera de rango " + r.res.p);
  assert.strictEqual(typeof r.res.scored, "boolean");
}

(async () => {
  const b = await chromium.launch({executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
  const ctx = await b.newContext({viewport: {width: 412, height: 915}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(250);

  /* ---------- penalti ---------- */
  await p.evaluate(() => openPen());
  await p.waitForSelector(".mg-ov .mg-pen svg");
  await p.waitForTimeout(300);
  assert.strictEqual(await p.$eval(".mg-ov", e => getComputedStyle(e).zIndex), "2147483000");
  assert.ok(await p.$eval(".mg-btn.pri", e => e.disabled), "Lanzar debería estar desactivado sin casilla");
  await shot(p, "penalty-1-aim");
  assert.strictEqual((await p.$$(".mg-cell")).length, 15);
  await p.touchscreen.tap(...Object.values(await p.$eval('.mg-cell[data-i="0"]', e => { const r = e.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; })));
  await p.waitForTimeout(350);
  assert.ok(await p.$eval('.mg-cell[data-i="0"]', e => e.classList.contains("on")));
  const cellP = await probNum(p); assert.ok(/^\d+$/.test(cellP), "prob de casilla " + cellP);
  await shot(p, "penalty-2-cell");
  await p.tap(".mg-btn.pri");                                     /* paso 2: barra de potencia */
  await p.waitForTimeout(150);
  await shot(p, "penalty-3-power");
  await waitBarIn(p, 0.5, 0.6);
  await p.touchscreen.tap(206, 120);                               /* tocar en cualquier sitio */
  await p.waitForTimeout(200);
  assert.strictEqual(await p.$eval(".mg-powv", e => e.textContent), "Ideal");
  await shot(p, "penalty-4-final");
  await p.waitForSelector(".mg-res.on", {timeout: 4000});
  await p.waitForTimeout(250);
  await shot(p, "penalty-5-result");
  await p.waitForFunction(() => RESULTS.length === 1, null, {timeout: 4000});
  let r = (await p.evaluate(() => RESULTS))[0];
  checkRes(r, "penalty");
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0, "la superposición debe desaparecer");
  console.log("penalti →", JSON.stringify(r.res), "prob. casilla", cellP + "%");

  /* ---------- falta directa ---------- */
  const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => openFk());
  await p.waitForSelector(".mg-ov .mg-fk svg");
  await p.waitForTimeout(300);
  await shot(p, "freekick-1-aim");
  const geo = await p.$eval(".mg-fk svg", s => ({g: s.dataset.goal.split(",").map(Number), w: s.dataset.wall.split(",").map(Number)}));
  const [gx0, gy0, gx1, gy1] = geo.g, [wx0, wTop, wx1, wy] = geo.w;
  const BALL = {x: 180, y: 378};
  /* 1) trazo raso contra la barrera, con ratón */
  await mouseDrag(p, bez(BALL, {x: (wx0 + wx1) / 2, y: 300}, {x: (wx0 + wx1) / 2 - 10, y: gy1 - 8}, 24));
  await p.waitForTimeout(300);
  const pWall = +(await probNum(p));
  assert.ok(pWall <= 5, "un tiro contra la barrera debería tener muy poca probabilidad: " + pWall);
  await shot(p, "freekick-2-wall");
  /* 2) volver a dibujar */
  await p.tap(".mg-btn.sec");
  await p.waitForTimeout(100);
  assert.ok(/^–/.test(await probNum(p)));
  assert.ok(await p.$eval(".mg-btn.pri", e => e.disabled));
  /* 3) rosca por encima de la barrera a la escuadra izquierda, con el dedo */
  const corner = {x: gx0 + (gx1 - gx0) * 0.08, y: gy0 + (gy1 - gy0) * 0.15};
  await touchDrag(cdp, p, bez(BALL, {x: 330, y: 40}, corner, 30));
  await p.waitForTimeout(300);
  const pGood = +(await probNum(p));
  assert.ok(pGood > pWall + 15, "la rosca a la escuadra debería ser mucho mejor: " + pGood + " vs " + pWall);
  await shot(p, "freekick-3-drawn");
  await p.tap(".mg-btn.pri");
  await p.waitForTimeout(150);
  await waitBarIn(p, 0.85, 0.98);                                  /* demasiado fuerte */
  await p.touchscreen.tap(206, 880);
  await p.waitForTimeout(200);
  assert.strictEqual(await p.$eval(".mg-powv", e => e.textContent), "Demasiado fuerte");
  const pAfter = +(await probNum(p));
  assert.ok(pAfter < pGood, "potencia excesiva debe bajar la probabilidad: " + pAfter + " vs " + pGood);
  await shot(p, "freekick-4-power");
  await p.waitForTimeout(1100);
  await shot(p, "freekick-5-flight");
  await p.waitForSelector(".mg-res.on", {timeout: 4000});
  await p.waitForTimeout(250);
  await shot(p, "freekick-6-result");
  await p.waitForFunction(() => RESULTS.length === 2, null, {timeout: 4000});
  r = (await p.evaluate(() => RESULTS))[1];
  checkRes(r, "freekick");
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0);
  console.log("falta →", JSON.stringify(r.res), "· barrera", pWall + "%", "· rosca", pGood + "%", "· tras potencia", pAfter + "%");

  /* ---------- varias tandas con movimiento reducido: done siempre llega, el rand sembrado decide ---------- */
  await p.emulateMedia({reducedMotion: "reduce"});
  const t0 = Date.now();
  for (let i = 0; i < 4; i++) {
    await p.evaluate((i) => openPen({skill: 60 + i * 10, gk: 70, pressure: i / 3, rand: seeded(100 + i)}), i);
    await p.waitForSelector(".mg-cell");
    await p.tap('.mg-cell[data-i="' + [0, 4, 7, 11][i] + '"]');
    await p.tap(".mg-btn.pri"); await p.waitForTimeout(260);
    await p.keyboard.press("Space");
    await p.waitForFunction((n) => RESULTS.length === n, 3 + i, {timeout: 4000});
  }
  const all = await p.evaluate(() => RESULTS.slice(2));
  all.forEach(x => checkRes(x, "penalty"));
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0);
  console.log("tandas con movimiento reducido:", all.map(x => JSON.stringify(x.res)).join(" "), "en", Date.now() - t0, "ms");

  /* ---------- PORTERO: penalti ---------- */
  await p.emulateMedia({reducedMotion: "no-preference"});
  const gshot = (name) => p.screenshot({path: "/tmp/minigame-gk-" + name + ".png"});
  const nRes = async () => p.evaluate(() => RESULTS.length);
  let base = await nRes();
  await p.evaluate(() => openGkPen());
  await p.waitForSelector(".mg-ov .mg-pen svg");
  await p.waitForTimeout(300);
  assert.strictEqual((await p.$$(".mg-cell")).length, 6, "6 zonas");
  assert.ok((await p.$eval(".mg-scout", e => e.textContent)).length > 8, "informe del tirador");
  assert.ok(await p.$eval(".mg-btn.pri", e => e.disabled), "sin zona no se puede seguir");
  assert.strictEqual(await p.$eval(".mg-stepn", e => e.textContent), "Paso 1 de 2");
  await gshot("pen-1-aim");
  await p.touchscreen.tap(...Object.values(await p.$eval('.mg-cell[data-i="3"]', e => { const r = e.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; })));
  await p.waitForTimeout(350);
  assert.ok(await p.$eval('.mg-cell[data-i="3"]', e => e.classList.contains("on")));
  const zoneP = await probNum(p); assert.ok(/^\d+$/.test(zoneP), "prob de zona " + zoneP);
  assert.ok(/parada/.test(await p.$eval(".mg-prob", e => e.textContent)), "etiqueta de parada");
  await gshot("pen-2-zone");
  await p.tap(".mg-btn.pri");
  await p.waitForTimeout(150);
  assert.strictEqual(await p.$eval(".mg-btn.pri", e => e.textContent), "¡Tirarse!");
  assert.strictEqual(await p.$eval(".mg-powl span", e => e.textContent), "Reacción");
  await gshot("pen-3-timing");
  await waitBarIn(p, 0.5, 0.6);
  await p.touchscreen.tap(206, 120);
  await p.waitForTimeout(200);
  assert.strictEqual(await p.$eval(".mg-powv", e => e.textContent), "Justo");
  await gshot("pen-4-stopped");
  await p.waitForTimeout(820);
  await gshot("pen-5-dive");
  await p.waitForSelector(".mg-res.on", {timeout: 4000});
  await p.waitForTimeout(250);
  await gshot("pen-6-result");
  await p.waitForFunction((n) => RESULTS.length === n, base + 1, {timeout: 4000});
  const checkGk = (r, kind) => {
    assert.strictEqual(r.kind, kind);
    assert.strictEqual(typeof r.res.p, "number"); assert.ok(r.res.p > 0 && r.res.p < 1, "p fuera de rango " + r.res.p);
    assert.strictEqual(typeof r.res.saved, "boolean"); assert.strictEqual(typeof r.res.scored, "boolean");
    assert.ok(!(r.res.saved && r.res.scored), "no puede ser parada y gol a la vez");
  };
  r = (await p.evaluate(() => RESULTS)).slice(-1)[0];
  checkGk(r, "gkPenalty");
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0, "la superposición debe desaparecer");
  console.log("portero penalti →", JSON.stringify(r.res), "· prob. zona", zoneP + "%");

  /* ---------- PORTERO: falta directa ---------- */
  base = await nRes();
  await p.evaluate(() => openGkFk());
  await p.waitForSelector(".mg-ov .mg-gkf svg");
  await p.waitForTimeout(300);
  assert.strictEqual(await p.$eval(".mg-stepn", e => e.textContent), "Paso 1 de 3");
  assert.strictEqual(await p.$eval(".mg-sv", e => e.textContent), "4");
  const p4 = +(await probNum(p));
  await gshot("fk-1-wall");
  const sprayD = () => p.$eval(".mg-gkf svg", s => [...s.querySelectorAll("path")].find(x => x.getAttribute("stroke-dasharray") === "1 3").getAttribute("d"));
  const d0 = await sprayD();
  await p.tap(".mg-sb:last-child"); await p.tap(".mg-sb:last-child");   /* 4 → 6 (tope) */
  assert.strictEqual(await p.$eval(".mg-sv", e => e.textContent), "6");
  assert.ok(await p.$eval(".mg-sb:last-child", e => e.disabled), "+ desactivado con 6");
  const p6 = +(await probNum(p));
  for (let i = 0; i < 6; i++) await p.tap(".mg-sb:first-child");   /* 6 → 0 */
  assert.strictEqual(await p.$eval(".mg-sv", e => e.textContent), "0");
  const p0 = +(await probNum(p));
  assert.ok(await p.$eval(".mg-seg button", e => e.disabled), "sin barrera no hay posición");
  for (let i = 0; i < 4; i++) await p.tap(".mg-sb:last-child");
  await p.tap(".mg-seg button:nth-child(3)");                   /* palo derecho */
  assert.ok(await p.$eval(".mg-seg button:nth-child(3)", e => e.classList.contains("on")));
  const d1 = await sprayD(); assert.notStrictEqual(d0, d1, "la barrera se mueve");
  const fgeo = await p.$eval(".mg-gkf svg", s => s.dataset.goal.split(",").map(Number));
  const [fx0, fy0, fx1, fy1] = fgeo;
  {                                                             /* arrastrar la barrera con el dedo, despacio y soltando quieto */
    const sc = await p.evaluate(() => { const s = document.querySelector(".mg-gkf svg"), m = s.getScreenCTM(); return Array.from({length: 24}, (_, i) => ({x: m.a * (230 - i * 3) + m.e, y: m.d * 200 + m.f})); });
    await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: [sc[0]]});
    for (let i = 1; i < sc.length; i++) { await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: [sc[i]]}); await p.waitForTimeout(16); }
    await p.waitForTimeout(120);
    await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []});
    await p.waitForTimeout(150);
  }
  const d2 = await sprayD(); assert.notStrictEqual(d1, d2, "arrastrar mueve la barrera");
  assert.ok(!(await p.$$eval(".mg-seg button.on", e => e.length)), "posición libre: ningún botón marcado");
  await p.tap(".mg-seg button:nth-child(1)");                   /* vuelve al palo izquierdo */
  assert.ok(await p.$eval(".mg-seg button:nth-child(1)", e => e.classList.contains("on")), "palo izquierdo marcado");
  const pL = +(await probNum(p));
  assert.ok(p0 < pL && p0 < p6, "sin barrera debe ser peor: " + p0 + " vs " + pL + "/" + p6);
  console.log("barrera: 4 →", p4 + "%", "· 6 →", p6 + "%", "· 0 →", p0 + "%", "· 4 palo izq. →", pL + "%");
  await gshot("fk-2-wall-set");
  await p.tap(".mg-btn.pri");                                   /* paso 2: colocarse */
  await p.waitForTimeout(150);
  assert.strictEqual(await p.$eval(".mg-stepn", e => e.textContent), "Paso 2 de 3");
  await tapSvg(p, ".mg-gkf svg", fx0 + (fx1 - fx0) * 0.1, fy1 - 10);   /* mal: en el lado tapado */
  await p.waitForTimeout(150);
  const pBad = +(await probNum(p));
  await tapSvg(p, ".mg-gkf svg", fx0 + (fx1 - fx0) * 0.72, fy1 - 10);   /* bien: cubre el lado libre */
  await p.waitForTimeout(350);
  const pPos = +(await probNum(p));
  assert.ok(pPos > pBad, "cubrir el lado libre debe ser mejor: " + pPos + " vs " + pBad);
  console.log("posición: lado tapado", pBad + "%", "· lado libre", pPos + "%");
  await gshot("fk-3-position");
  await p.tap(".mg-btn.sec");                                   /* atrás y adelante */
  assert.strictEqual(await p.$eval(".mg-stepn", e => e.textContent), "Paso 1 de 3");
  await p.tap(".mg-btn.pri");
  await p.tap(".mg-btn.pri");                                   /* paso 3: reacción */
  await p.waitForTimeout(150);
  assert.strictEqual(await p.$eval(".mg-stepn", e => e.textContent), "Paso 3 de 3");
  assert.ok(await p.$eval(".mg-pow", e => getComputedStyle(e).display !== "none"));
  await gshot("fk-4-timing");
  await waitBarIn(p, 0.5, 0.6);
  await p.keyboard.press("Space");
  await p.waitForTimeout(200);
  assert.strictEqual(await p.$eval(".mg-powv", e => e.textContent), "Justo");
  await gshot("fk-5-stopped");
  await p.waitForTimeout(1300);
  await gshot("fk-6-flight");
  await p.waitForSelector(".mg-res.on", {timeout: 4000});
  await p.waitForTimeout(250);
  await gshot("fk-7-result");
  await p.waitForFunction((n) => RESULTS.length === n, base + 1, {timeout: 5000});
  r = (await p.evaluate(() => RESULTS)).slice(-1)[0];
  checkGk(r, "gkFreekick");
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0);
  console.log("portero falta →", JSON.stringify(r.res));

  /* ---------- PORTERO: el momento importa (misma semilla, misma zona) y tandas rápidas ---------- */
  await p.emulateMedia({reducedMotion: "reduce"});
  const timingP = {};
  for (const [name, lo, hi] of [["pronto", 0.04, 0.16], ["justo", 0.53, 0.57], ["tarde", 0.9, 0.99]]) {
    base = await nRes();
    await p.evaluate(() => openGkPen({gk: 70, skill: 75, pressure: 0.3, rand: seeded(99)}));
    await p.waitForSelector(".mg-cell");
    await p.tap('.mg-cell[data-i="4"]');
    await p.tap(".mg-btn.pri"); await p.waitForTimeout(220);
    await waitBarIn(p, lo, hi); await p.keyboard.press("Enter");
    await p.waitForFunction((n) => RESULTS.length === n, base + 1, {timeout: 4000});
    const x = (await p.evaluate(() => RESULTS)).slice(-1)[0]; checkGk(x, "gkPenalty");
    timingP[name] = x.res.p;
  }
  console.log("momento (penalti, zona centro-abajo):", JSON.stringify(timingP));
  assert.ok(timingP.justo > timingP.pronto && timingP.justo > timingP.tarde, "tirarse justo debe ser lo mejor");
  const outs = {};
  for (let i = 0; i < 8; i++) {
    base = await nRes();
    const fk = i % 2 === 1;
    await p.evaluate(([i, fk]) => fk ? openGkFk({gk: 55 + i * 5, skill: 85 - i * 4, dist: 18 + i * 2, rand: seeded(300 + i)}) : openGkPen({gk: 50 + i * 6, skill: 90 - i * 5, pressure: i / 7, rand: seeded(200 + i)}), [i, fk]);
    if (fk) { await p.waitForSelector(".mg-gkf"); await p.tap(".mg-btn.pri"); await p.tap(".mg-btn.pri"); }
    else { await p.waitForSelector(".mg-cell"); await p.tap('.mg-cell[data-i="' + (i % 6) + '"]'); await p.tap(".mg-btn.pri"); }
    await p.waitForTimeout(240 + i * 37);
    await p.keyboard.press("Space");
    await p.waitForFunction((n) => RESULTS.length === n, base + 1, {timeout: 5000});
    const x = (await p.evaluate(() => RESULTS)).slice(-1)[0]; checkGk(x, fk ? "gkFreekick" : "gkPenalty");
    const k = x.res.saved ? "parada" : x.res.scored ? "gol" : "fuera/barrera";
    outs[k] = (outs[k] || 0) + 1;
  }
  assert.strictEqual(await p.$$eval(".mg-ov", e => e.length), 0);
  console.log("tandas de portero:", JSON.stringify(outs));

  /* ---------- escritorio ---------- */
  await p.setViewportSize({width: 1280, height: 800});
  await p.emulateMedia({reducedMotion: "no-preference"});
  await p.evaluate(() => openFk({skill: 60, gk: 85, dist: 29, rand: seeded(3)}));
  await p.waitForSelector(".mg-fk svg"); await p.waitForTimeout(300);
  await shot(p, "freekick-desktop");
  await p.evaluate(() => document.querySelector(".mg-ov").remove());
  await p.evaluate(() => openGkFk({gk: 80, skill: 70, dist: 27, rand: seeded(8)}));
  await p.waitForSelector(".mg-gkf svg"); await p.waitForTimeout(300);
  await p.mouse.move(640, 400);
  await p.screenshot({path: "/tmp/minigame-gk-fk-desktop.png"});
  await p.evaluate(() => document.querySelector(".mg-ov").remove());

  assert.deepStrictEqual(errs, [], "errores en la página: " + errs.join(" | "));
  console.log("OK · capturas en /tmp/minigame-*.png");
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
