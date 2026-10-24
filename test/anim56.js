/* 5.6: zona Yo viva, mascota, vista 3D del jugador y de la mascota. Uso: node test/anim56.js [carpeta] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/anim56";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], fail = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(160); return true; };
  await p.evaluate(() => { window.TAP_GAP = 0; document.querySelector('[data-a="setlang"][data-v="es"]').click(); });
  await p.evaluate(() => {
    buildWorld("m");
    newCareer({fn: "Álex", ln: "Vivo", nat: "ES", pos: "MC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 9});
    S.pend = []; S.ntf = []; S.p.money = 5e6; petAdopt("dog", "Toby"); const pt = petOf(); pt.tricks = 3; petBuyAcc("cap"); petBuyAcc("scarf");
    UIX.ui().view = "game"; UIX.ui().tab = "jugador"; UIX.render(true); document.querySelectorAll(".ntf").forEach(n => n.remove());
  });
  await p.waitForTimeout(900);
  const st = await p.evaluate(() => ({rig: !!document.querySelector(".lfav svg.rig .pa-head"), live: !!(document.querySelector(".lfav svg.rig") || {}).__rig, pet: !!document.querySelector(".lfav .lfpet .petrig"), petCard: !!(document.querySelector(".petcard .petart") || {}).__rig}));
  notes.push("rigs: " + JSON.stringify(st));
  if (!st.rig || !st.live) fail.push("el avatar de la zona Yo no tiene rig");
  if (!st.pet) fail.push("la mascota no aparece a los pies del jugador");
  if (!st.petCard) fail.push("la mascota de la tarjeta no está animada");
  /* el idle cambia la pose con el tiempo */
  const t1 = await p.evaluate(() => document.querySelector(".lfav .pa-up").getAttribute("transform"));
  await p.waitForTimeout(700);
  const t2 = await p.evaluate(() => document.querySelector(".lfav .pa-up").getAttribute("transform"));
  if (t1 === t2) fail.push("el jugador no respira (pose idéntica)");
  await p.evaluate(() => document.querySelector(".lfhub").scrollIntoView({block: "start"}));
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(450); await (await p.$(".lfhub")).screenshot({ path: path.join(OUT, "yo-" + i + ".png") }); }
  await c(".lfav"); await p.waitForTimeout(380); await (await p.$(".lfhub")).screenshot({ path: path.join(OUT, "yo-tap.png") });
  /* subir la media: count-up y celebración */
  await p.evaluate(() => { Object.keys(S.p.att).forEach(k => S.p.att[k] += 3); UIX.render(true); });
  await p.waitForTimeout(250); await p.screenshot({ path: path.join(OUT, "levelup.png") });
  /* look: vista 3D al cambiar las botas */
  await c('[data-a="lfopen"][data-v="llook"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "look.png") });
  await c('[data-a="lfcos"][data-k="boots"][data-v="red"]'); await p.waitForTimeout(2500);
  const v3 = await p.evaluate(() => !!document.querySelector(".v3d canvas"));
  if (!v3) fail.push("cambiar las botas no abre la vista 3D");
  await p.screenshot({ path: path.join(OUT, "3d-player.png") });
  /* girar con el dedo */
  const box = await (await p.$(".v3d canvas")).boundingBox();
  await p.mouse.move(box.x + 100, box.y + 300); await p.mouse.down(); await p.mouse.move(box.x + 260, box.y + 300, {steps: 6}); await p.mouse.up();
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, "3d-player-rot.png") });
  await c('.v3d [data-v3d="cel"]'); await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, "3d-player-cel.png") });
  await c('.v3d [data-v3d="x"]'); await p.waitForTimeout(500);
  if (await p.$(".v3d")) fail.push("la vista 3D no se cierra");
  await p.evaluate(() => UIX.closeSheet && UIX.closeSheet()); await p.evaluate(() => { UIX.ui().sheet = null; UIX.render(true); });
  /* mascota: truco nuevo en 3D */
  await p.evaluate(() => { UIX.ui().tab = "jugador"; UIX.render(true); });
  await c('[data-a="petopen"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, "pet-sheet.png") });
  await p.evaluate(() => View3D.pet({trick: 2}));
  await p.waitForTimeout(1000); await p.screenshot({ path: path.join(OUT, "3d-pet-1.png") });
  await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, "3d-pet-2.png") });
  const btns = await p.evaluate(() => Array.from(document.querySelectorAll(".v3d [data-v3d]")).map(b => b.textContent).join(" | "));
  notes.push("botones 3D mascota: " + btns);
  if (!/Lanzar pelota/.test(btns)) fail.push("no hay botón para lanzar la pelota");
  await c('.v3d [data-v3d="x"]'); await p.waitForTimeout(400);
  await p.evaluate(() => View3D.pet({acc: "cap"})); await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, "3d-pet-acc.png") });
  await c('.v3d [data-v3d="x"]'); await p.waitForTimeout(400);
  /* animaciones reducidas: sin reflejo */
  await p.evaluate(() => { camA11y.set(Object.assign(camA11y.get(), {rm: 1})); });
  const red = await p.evaluate(() => Anim.reduced() && document.documentElement.classList.contains("rm"));
  if (!red) fail.push("el ajuste de animaciones reducidas no se aplica");
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
