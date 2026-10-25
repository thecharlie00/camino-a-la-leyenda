/* 5.6 equipamiento: migración, equipar, comparar, mejorar, tope y animación. Uso: node test/gear56.js [carpeta] */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/gear56"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a);
  const click = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, s); await p.waitForTimeout(150); };
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Botas");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]'); await p.waitForTimeout(500);
  const mig = await js(() => { const g = GXI.gear("p"); return { own: Object.keys(g.own), eq: g.eq }; });
  console.log("migración", JSON.stringify(mig)); if (!mig.own.includes("L_boots_blk") || mig.eq.boots !== "L_boots_blk") fail.push("migración");
  const a0 = await js(() => attrs());
  /* dar piezas y materiales, equipar */
  const r = await js(() => { ["b_ray", "sh_ray", "so_ray", "wa_chrono", "L_sleeve_tights", "b_can"].forEach(id => GXI.give(id, 0)); ["b_ray", "sh_ray", "so_ray", "wa_chrono", "L_sleeve_tights"].forEach(id => GXI.equip(id)); const g = GXI.gear("p"); g.mat = { cu: 200, fi: 100, es: 30 }; S.p.money = 5e7; return { raw: GXI.raw("p"), cap: GXI.capped(GXI.raw("p")), att: attrs() }; });
  console.log("raw", JSON.stringify(r.raw), "cap", JSON.stringify(r.cap));
  console.log("RIT antes/después", a0.RIT || a0.VEL, "→", r.att.RIT || r.att.VEL);
  if ((r.att.RIT || r.att.VEL) <= (a0.RIT || a0.VEL)) fail.push("atributos no suben");
  /* tope: todo a Leyenda */
  const capT = await js(() => { const g = GXI.gear("p"); Object.keys(g.own).forEach(k => g.own[k].t = 5); const c = GXI.capped(GXI.raw("p")); let tot = 0; Object.keys(c).forEach(k => { if (/^[A-Z]{3}$/.test(k) && c[k] > 0) tot += c[k]; }); Object.keys(g.own).forEach(k => g.own[k].t = 0); return { tot: tot, max: Math.max(...Object.keys(c).filter(k => /^[A-Z]{3}$/.test(k)).map(k => c[k])) }; });
  console.log("tope con todo en Leyenda", JSON.stringify(capT)); if (capT.tot > 10.01 || capT.max > 6.01) fail.push("tope");
  /* hoja */
  await js(() => { UIX.ui().gr = { w: "p", s: "boots", tab: "eq" }; UIX.open("gear"); }); await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(OUT, "01-equipo.png") });
  const sh = await js(() => ({ slots: document.querySelectorAll(".gsl").length, pieces: document.querySelectorAll(".gpc").length, cmp: document.querySelectorAll(".gpc-cmp").length, sets: document.querySelectorAll(".gset").length }));
  console.log("hoja", JSON.stringify(sh)); if (sh.slots !== 12 || sh.pieces < 3) fail.push("hoja");
  await js(() => document.querySelector('.gpc.on [data-a="gearup"]').click()); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, "02-mejora.png") });
  await p.waitForTimeout(2600);
  const t1 = await js(() => GXI.tier("b_ray")); console.log("tier tras mejorar", t1); if (t1 !== 1) fail.push("mejora");
  await p.screenshot({ path: path.join(OUT, "03-tras.png") });
  await click('[data-a="close"]'); await click('nav [data-a="tab"][data-t="jugador"]'); await p.waitForTimeout(500);
  await js(() => { const v = document.querySelector(".gcard"); if (v) v.scrollIntoView(); }); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "04-tarjeta.png") });
  /* trofeo de tienda */
  console.log("upgrades", await js(() => GX.cnt("upgrades")));
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "gear56 OK"); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
})();
