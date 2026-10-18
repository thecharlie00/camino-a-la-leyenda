/* 4.8 en el navegador: preparar la familia, tarjeta y hoja de la familia, fichar a tu hijo,
   relevo con hijo o hija. Uso: node test/fam48ui.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots48";
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
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(140); return true; };
  await p.evaluate(() => { window.TAP_GAP = 0; document.querySelector('[data-a="setlang"][data-v="es"]').click(); });
  await p.evaluate(() => {
    buildWorld("m");
    newManagerCareer({fn: "Pep", ln: "Familia", nat: "ES", age: 44, diff: 0, ev: 1, club: W.clubs.findIndex(c => c.lg0 === 0), seed: 48});
    S.pend = []; S.ntf = []; UIX.ui().view = "game"; UIX.ui().tab = "club"; UIX.render(true); const n = document.getElementById("ntfs"); if (n) n.remove();
  });
  await p.waitForTimeout(200);
  if (!(await c('[data-a="famset"]'))) fail.push("no se ofrece preparar la familia");
  await c('[data-a="fspt"][data-v="f"]');
  await p.fill("#fsptn", "Marta");
  await c('[data-a="fskadd"]'); await p.fill("#fsk0", "Leo"); await p.selectOption("#fska0", "15");
  await c('[data-a="fskadd"]'); await c('[data-a="fskg"][data-i="1"][data-v="f"]'); await p.fill("#fsk1", "Ana"); await p.selectOption("#fska1", "9");
  const kept = await p.evaluate(() => [document.getElementById("fsptn").value, document.getElementById("fsk0").value, document.getElementById("fsk1").value].join(","));
  if (kept !== "Marta,Leo,Ana") fail.push("el formulario pierde lo escrito: " + kept);
  await p.screenshot({ path: path.join(OUT, "01-preparar.png") });
  await c('[data-a="fsgo"]'); await p.waitForTimeout(200);
  const st = await p.evaluate(() => ({pt: S.m.fam.pt && S.m.fam.pt.fn, kids: S.m.fam.kids.map(k => k.fn + k.g + famAge(k)).join(","), card: (document.querySelector(".famcard") || {}).textContent || ""}));
  notes.push("familia: " + JSON.stringify(st));
  if (st.pt !== "Marta" || st.kids !== "Leom15,Anaf9") fail.push("la familia no se guarda como se eligió");
  if (!/Marta/.test(st.card)) fail.push("la tarjeta de la familia no aparece");
  /* Leo, futbolista en otro club y con el mercado abierto */
  await p.evaluate(() => { const k = S.m.fam.kids[0]; k.by -= 1; famStartFb(k, "DC"); S.m.mk.open = "verano"; S.m.bud = 5e7; UIX.render(true); });
  await c('.famcard[data-a="famsheet"]'); await p.waitForTimeout(200);
  const sh = await p.evaluate(() => (document.querySelector(".sheet") || {}).textContent || "");
  if (!/Leo/.test(sh) || !(await p.$('[data-a="famsign"]'))) fail.push("la hoja de la familia no ofrece fichar a tu hijo");
  await p.screenshot({ path: path.join(OUT, "02-familia.png") });
  await c('[data-a="famsign"]'); await p.waitForTimeout(200);
  const signed = await p.evaluate(() => { const k = S.m.fam.kids[0]; return k.fb.pid != null && !!mPl(k.fb.pid); });
  if (!signed) fail.push("fichar desde la hoja no funciona");
  await p.screenshot({ path: path.join(OUT, "03-fichado.png") });
  await p.evaluate(() => UIX.closeSheet());
  /* decisión de vida personal */
  await p.evaluate(() => { S.pend = [mp("fam", {id: "cena"})]; UIX.render(true); });
  await p.waitForTimeout(150);
  const dec = await p.evaluate(() => (document.querySelector(".card.decision") || {}).textContent || "");
  if (!/Aniversario/.test(dec) || !/Relación/.test(dec)) fail.push("la decisión de pareja no muestra el efecto en la relación");
  await p.evaluate(() => { const d = document.querySelector(".card.decision"); if (d) d.scrollIntoView({block: "start"}); });
  await p.screenshot({ path: path.join(OUT, "04-decision.png") });
  /* relevo al retirarte: botón para seguir con Leo y formulario con hijo o hija */
  await p.evaluate(() => { S.pend = []; mgrRetire(); UIX.ui().tab = "club"; UIX.render(true); });
  await p.waitForTimeout(250);
  const ret = await p.evaluate(() => ({kid: !!document.querySelector('[data-a="heirkid"]'), txt: (document.querySelector(".dynret") || {}).textContent || ""}));
  notes.push("retirada: " + ret.txt.slice(0, 140));
  if (!ret.kid) fail.push("al retirarte no se ofrece seguir con tu hijo futbolista");
  await p.evaluate(() => { const d = document.querySelector(".dynret"); if (d) d.scrollIntoView({block: "center"}); });
  await p.screenshot({ path: path.join(OUT, "05-retirada.png") });
  await c('[data-a="heir"]');
  await c('[data-a="heirg"][data-v="f"]');
  const hs = await p.evaluate(() => (document.querySelector(".sheet h2") || {}).textContent + " | " + (document.querySelector(".sheet .lead") || {}).textContent);
  notes.push("formulario: " + hs);
  if (!/hija/.test(hs) || !/femenino/.test(hs)) fail.push("el formulario no cambia a hija ni avisa del fútbol femenino");
  await p.screenshot({ path: path.join(OUT, "06-hija.png") });
  await p.fill("#heirfn", "Lucía");
  await c('[data-a="heirgo"]'); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({fn: S.p && S.p.fn, ln: S.p && S.p.ln, g: S.g, club: S.p && clubName(S.p.club), head: (document.querySelector(".top h1") || {}).textContent}));
  notes.push("nueva generación: " + JSON.stringify(after));
  if (after.fn !== "Lucía" || after.g !== "f" || after.ln !== "Familia") fail.push("la hija no empieza en el fútbol femenino");
  await p.screenshot({ path: path.join(OUT, "07-lucia.png") });
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
