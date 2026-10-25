/* 5.6 modelo vóxel 3D en «Yo» (jugador) y «Tu míster». Uso: node test/yo3d.js */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = "/tmp/yo3d"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const errs = [], fail = [];
  async function page() { const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage(); p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); }); await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400); return p; }
  const mk = p => ({ js: (s, a) => p.evaluate(s, a), c: async s => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, s); await p.waitForTimeout(150); } });
  /* jugador */
  let p = await page(), u = mk(p);
  await u.c('[data-a="setlang"][data-v="es"]'); await u.c('[data-a="newgame"]'); await u.c('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Tres"); for (let i = 0; i < 3; i++) await u.c('[data-a="cnext"]'); await u.c('[data-a="cclub"]'); await u.c('[data-a="cnext"]'); await p.waitForTimeout(400);
  await u.c('nav [data-a="tab"][data-t="jugador"]'); await p.waitForTimeout(4000);
  const r1 = await u.js(() => ({ cv: !!document.querySelector(".lfav .yo3d-cv"), svgHidden: getComputedStyle(document.querySelector(".lfav svg")).display === "none" }));
  console.log("jugador", JSON.stringify(r1)); if (!r1.cv) fail.push("jugador sin 3D");
  await (await p.$(".lfhub")).screenshot({ path: path.join(OUT, "jugador.png") });
  await u.js(() => UIX.render(false)); await p.waitForTimeout(1500);
  console.log("tras repintar", await u.js(() => !!document.querySelector(".lfav .yo3d-cv")));
  await u.c(".lfav .yo3d-cv"); await p.waitForTimeout(800); await (await p.$(".lfhub")).screenshot({ path: path.join(OUT, "jugador-celebra.png") });
  /* míster */
  p = await page(); u = mk(p);
  await u.c('[data-a="setlang"][data-v="es"]'); await u.c('[data-a="newgame"]'); await u.c('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Tres"); await u.c('[data-a="cnext"]'); await u.c('[data-a="cnext"]'); await u.c('[data-a="cclub"]'); await u.c('[data-a="cnext"]'); await p.waitForTimeout(400);
  await u.js(() => { UIX.ui().tab = "yo"; UIX.render(false); window.scrollTo(0, 0); }); await p.waitForTimeout(4000);
  const r2 = await u.js(() => !!document.querySelector(".myo-fig .yo3d-cv")); console.log("míster", r2); if (!r2) fail.push("míster sin 3D");
  await (await p.$(".myo-hero")).screenshot({ path: path.join(OUT, "mister.png") });
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "yo3d OK"); console.log(errs.length ? "ERRORES:\n" + errs.slice(0, 5).join("\n") : "SIN ERRORES");
  await b.close();
})();
