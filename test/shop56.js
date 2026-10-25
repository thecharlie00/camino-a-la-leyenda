/* 5.6 tienda: secciones, prueba, candados, compra y trofeos de tienda. Uso: node test/shop56.js [carpeta] */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shop56"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a);
  const click = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, s); await p.waitForTimeout(150); };
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Tienda");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]'); await p.waitForTimeout(500);
  await js(() => { S.p.money = 3e6; });
  await js(() => { UIX.ui().sh = { tab: "feat" }; UIX.open("shop"); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(OUT, "01-destacados.png") });
  const f = await js(() => ({ n: document.querySelectorAll(".shi").length, feat: GXI.featured(), off: GXI.offers(), stock: GXI.stock("p").length }));
  console.log("destacados", JSON.stringify(f)); if (f.n < 2) fail.push("destacados");
  await click('[data-a="shoptab"][data-v="p"]'); await p.waitForTimeout(600);
  const pl = await js(() => ({ n: document.querySelectorAll(".shi").length, lk: document.querySelectorAll(".shi.lk").length }));
  console.log("jugador", JSON.stringify(pl));
  /* seleccionar algo no bloqueado y probar */
  const sel = await js(() => { const e = [...document.querySelectorAll(".shi:not(.lk):not(.own)")][0]; if (e) e.click(); return e && e.getAttribute("data-v"); }); await p.waitForTimeout(300);
  await click('[data-a="shoptry"]'); await p.waitForTimeout(500);
  console.log("probar filas", await js(() => document.querySelectorAll(".shtr").length));
  await p.screenshot({ path: path.join(OUT, "02-probar.png") });
  /* candado */
  const lk = await js(() => { const e = document.querySelector(".shi.lk"); if (!e) return null; e.click(); return e.getAttribute("data-v"); }); await p.waitForTimeout(400);
  if (lk) { console.log("candado", lk, await js(() => document.querySelector(".shlock") && document.querySelector(".shlock").textContent)); await p.screenshot({ path: path.join(OUT, "03-candado.png") }); }
  /* comprar */
  await js(id => { UIX.ui().sh.sel = id; UIX.renderSheet(); }, sel); await p.waitForTimeout(300);
  const m0 = await js(() => S.p.money);
  await click('[data-a="shopbuy"]'); await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, "04-compra.png") }); await p.waitForTimeout(2200);
  const after = await js(id => ({ own: GXI.owned(id, "p"), money: S.p.money, buys: GX.stat("buys") }), sel);
  console.log("compra", sel, JSON.stringify(after), "gastado", m0 - after.money); if (!after.own) fail.push("compra");
  /* oferta → trofeo Ganga */
  const off = await js(() => { const o = GXI.offers()[0]; const r = GXI.buy(o); achCheck(); return { o, r, flag: GX.has("bargain"), t: !!S.ach.sh_deal }; });
  console.log("oferta", JSON.stringify(off)); if (!off.t) fail.push("ganga");
  await click('[data-a="shoptab"][data-v="pet"]'); await p.waitForTimeout(400);
  await click('[data-a="shoptab"][data-v="m"]'); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, "05-mister.png") });
  /* retos */
  await click('[data-a="close"]');
  const ch = await js(() => { S.p.motm = 6; GXC.check(true); UIX.render(false); return { q: GX.st().q.slice(), done: GXC.done("c_motm5"), lock: GXI.lock(GXI.item("x_ph_motm")) }; });
  console.log("reto", JSON.stringify(ch)); if (!ch.done || ch.lock) fail.push("reto");
  await p.waitForTimeout(1000); await p.screenshot({ path: path.join(OUT, "06-reto.png") }); await p.waitForTimeout(4500);
  await js(() => { UIX.ui().sh = { tab: "chal" }; UIX.open("shop"); }); await p.waitForTimeout(900);
  console.log("lista retos", await js(() => document.querySelectorAll(".chi").length)); await p.screenshot({ path: path.join(OUT, "07-retos.png") });
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "shop56 OK"); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
})();
