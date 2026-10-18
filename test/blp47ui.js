/* 4.7 en el navegador: tarjeta de racha sin jugar, decisión de minutos, confianza en el minijuego,
   aviso de la directiva y ultimátum en el club. Uso: node test/blp47ui.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots47";
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
  await p.evaluate(() => { window.TAP_GAP = 0; document.querySelector('[data-a="setlang"][data-v="es"]').click(); });
  for (const g of ["m", "f"]) {
    await p.evaluate(g => {
      newCareer({fn: "Alex", ln: "Banquillo", nat: "ES", pos: "DC", foot: "Diestro", age: 19, talent: "normal", club: -1, ev: 1, seed: 47, g: g});
      S.pend = []; blpOf().bench = 5; blpOf().mg = 2;
      S.pend.push({k: "blpbench", n: 5});
      UIX.ui().view = "game"; UIX.ui().tab = "carrera"; UIX.render(true); const n = document.getElementById("ntfs"); if (n) n.remove();
    }, g);
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => ({card: (document.querySelector(".blpcard") || {}).textContent || "", chip: (document.querySelector(".blpchip") || {}).textContent || "", dec: (document.querySelector(".card.decision") || {}).textContent || ""}));
    notes.push(g + " · tarjeta: " + st.card.slice(0, 110) + " · chip: " + st.chip);
    if (!st.card || !/5 partidos sin jugar/.test(st.card)) fail.push(g + ": no se ve la racha sin jugar");
    if (!/\+8/.test(st.chip)) fail.push(g + ": no se ve la confianza del minijuego");
    if (!/Pedir explicaciones/.test(st.dec)) fail.push(g + ": no se ve la decisión de minutos");
    if (g === "f" && /míster/.test(st.card + st.dec)) fail.push("en femenino sigue diciendo «míster»");
    await p.evaluate(() => { const d = document.querySelector(".card.decision"); if (d) d.scrollIntoView({block: "center"}); });
    await p.screenshot({ path: path.join(OUT, "01-banquillo-" + g + ".png") });
    await p.evaluate(() => document.querySelector('.card.decision [data-a="choose"]').click());
    await p.waitForTimeout(250);
    const pr = await p.evaluate(() => ({promise: blpOf().promise, card: (document.querySelector(".blpcard") || {}).textContent || ""}));
    if (!pr.promise || !/prometido/.test(pr.card)) fail.push(g + ": la promesa no se refleja");
  }
  /* míster: aviso y ultimátum */
  await p.evaluate(() => {
    buildWorld("m");
    newManagerCareer({fn: "Pep", ln: "Banquillo", nat: "ES", age: 45, diff: 2, ev: 1, club: W.clubs.findIndex(c => c.lg0 === 0), seed: 470});
    S.pend = []; S.m.board = mSackT(0) + 4; S.ph = "gap"; S.bi = 2;
    UIX.ui().view = "game"; UIX.ui().tab = "club"; UIX.render(true); const n = document.getElementById("ntfs"); if (n) n.remove();
  });
  await p.waitForTimeout(250);
  const w = await p.evaluate(() => (document.querySelector(".blpcard") || {}).textContent || "");
  notes.push("aviso: " + w);
  if (!/impacienta/.test(w)) fail.push("no se avisa de la directiva");
  await p.screenshot({ path: path.join(OUT, "02-aviso.png") });
  await p.evaluate(() => { S.m.board = 1; blpUltimatum(0); UIX.render(true); });
  await p.waitForTimeout(250);
  const ul = await p.evaluate(() => ({card: (document.querySelector(".blpcard") || {}).textContent || "", dec: (document.querySelector(".card.decision") || {}).textContent || ""}));
  notes.push("ultimátum: " + ul.card.slice(0, 120));
  if (!/Ultimátum/.test(ul.card)) fail.push("no se ve el ultimátum");
  if (!/último tramo/.test(ul.dec)) fail.push("no se ve la decisión del ultimátum");
  await p.evaluate(() => { const d = document.querySelector(".card.decision"); if (d) d.scrollIntoView({block: "center"}); });
  await p.screenshot({ path: path.join(OUT, "03-ultimatum.png") });
  await p.evaluate(() => document.querySelector('.card.decision [data-a="choose"][data-i="1"]').click());
  await p.waitForTimeout(250);
  const after = await p.evaluate(() => ({pend: S.pend.map(x => x.k).join(","), buff: S.m.buffs.map(x => x.n).join(",")}));
  if (after.pend.indexOf("ult") >= 0 || !/Conjura/.test(after.buff)) fail.push("encerrarse con la plantilla no se aplica");
  /* en juego: la barra del ultimátum */
  await p.evaluate(() => { S.ph = "blk"; S.bst = {w: 2, d: 1, l: 1, gf: 5, ga: 4, n: 4, lgN: 4, lgPts: 7}; UIX.render(true); });
  await p.waitForTimeout(200);
  const live = await p.evaluate(() => (document.querySelector(".blpcard") || {}).textContent || "");
  notes.push("en juego: " + live);
  if (!/7 puntos en 4/.test(live) || !(await p.$(".blpbar"))) fail.push("no se ve el progreso del ultimátum");
  await p.screenshot({ path: path.join(OUT, "04-progreso.png") });
  /* el resto de idiomas pintan sin errores */
  for (const l of ["en", "de", "it", "fr"]) {
    await p.evaluate(l => { setLang(l); UIX.render(true); }, l);
    await p.waitForTimeout(120);
    const t = await p.evaluate(() => (document.querySelector(".blpcard") || {}).textContent || "");
    if (!t || /Llevas|puntos en/.test(t)) fail.push(l + ": la tarjeta no se traduce");
  }
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
