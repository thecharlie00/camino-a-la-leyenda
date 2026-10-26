/* 5.6 decisiones en datos: escena de vóxeles, sin números, consecuencias aplazadas. Uso: node test/ev56.js [carpeta] */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/ev56"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a);
  const click = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, s); await p.waitForTimeout(150); };
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Decide");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]'); await p.waitForTimeout(500);
  await js(() => { S.pend = [{ k: "ev", id: "gx_novato_consejo", s: 7 }]; S.ph = "gap"; S.p.age = 26; UIX.render(false); window.scrollTo(0, 0); });
  await p.waitForTimeout(1200); await p.screenshot({ path: path.join(OUT, "01-decision.png") });
  const d = await js(() => ({ sc: !!document.querySelector(".decision .gxsc img"), chips: document.querySelectorAll(".decision .opt .chip").length, pct: document.querySelectorAll(".decision .opt .pct").length, opts: document.querySelectorAll(".decision .opt").length }));
  console.log("tarjeta", JSON.stringify(d)); if (!d.sc || !d.pct) fail.push("tarjeta");
  const before = await js(() => (GX.st().later || []).length);
  await click('.decision .opt[data-i="0"]'); await p.waitForTimeout(800);
  const after = await js(() => ({ later: (GX.st().later || []).length, mentored: GX.cnt("mentored"), card: S.feed[0] && { t: S.feed[0].t, chips: (S.feed[0].chips || []).length, pct: S.feed[0].pct } }));
  console.log("tras elegir", JSON.stringify(after), "aplazadas antes", before); if (after.later !== before + 1) fail.push("resultado");
  await p.screenshot({ path: path.join(OUT, "02-resultado.png") });
  /* la consecuencia llega dos tramos después */
  const tick = await js(() => { const L = GX.st().later[0]; S.bi += 2; GXE.tick(); return { left: GX.st().later.length, news: S.bnews.slice(-1)[0] }; });
  console.log("aplazada", JSON.stringify(tick)); if (tick.left !== 0) fail.push("aplazada");
  /* todas las escenas */
  const n = await js(() => { const sc = ["locker", "training", "party", "home", "office", "press", "stadium", "hospital", "street", "plane", "pitch"]; const w = document.createElement("div"); w.id = "scs"; w.style.cssText = "position:fixed;inset:0;z-index:999;background:#0b1417;display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;overflow:auto"; sc.forEach(s => { const i = new Image(); i.src = UIX.gxSceneImg(s); i.style.width = "100%"; w.appendChild(i); }); document.body.appendChild(w); return sc.length; });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, "03-escenas.png") });
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "ev56 OK"); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
})();
