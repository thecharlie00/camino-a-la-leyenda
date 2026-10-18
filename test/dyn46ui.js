/* 4.6 en el navegador: tarjeta de retirada con relevo, formulario del hijo, nueva carrera y árbol de la dinastía.
   Uso: node test/dyn46ui.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots46";
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
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(120); return true; };
  await c('[data-a="setlang"][data-v="es"]');
  /* una carrera que se retira enseguida */
  await p.evaluate(() => {
    newCareer({fn: "Paco", ln: "Leyenda", nat: "ES", pos: "DC", foot: "Diestro", age: 18, talent: "joya", club: -1, ev: 1, seed: 7});
    S.p.seasons.push({y: S.yr, club: S.p.club, clubs: [S.p.club], lg: S.cl[S.p.club], pos: 3, apps: 34, st: 30, min: 2800, g: 21, a: 6, cs: 0, gc: 0, rt: 7.4, tro: [], aw: [], comp: {}, ovr0: 70, ovr1: 74, age: 30});
    S.p.trophies.push({k: "L:ESP1", n: "LaLiga EA Sports", y: S.yr, team: S.p.club, w: 10, s: "2026/27"});
    S.ph = "off"; S.pend = []; retire();
    UIX.ui().view = "game"; UIX.ui().tab = "carrera"; UIX.render(true);
  });
  await p.waitForTimeout(200);
  const has = await p.$(".dynret");
  if (!has) fail.push("la tarjeta de retirada no ofrece el relevo");
  else { await p.evaluate(() => document.querySelector(".dynret").scrollIntoView({block: "center"})); await p.screenshot({ path: path.join(OUT, "01-retirada.png") }); }
  await c('[data-a="heir"]');
  if (!(await p.$("#heirfn"))) fail.push("no se abre el formulario del relevo");
  await p.fill("#heirfn", "Pablo");
  await c('[data-a="heirpos"][data-v="ED"]'); await c('[data-a="heirfoot"][data-v="Zurdo"]');
  const kept = await p.evaluate(() => document.getElementById("heirfn").value);
  if (kept !== "Pablo") fail.push("el nombre se pierde al elegir posición");
  await p.screenshot({ path: path.join(OUT, "02-formulario.png") });
  await c('[data-a="heirgo"]'); await p.waitForTimeout(300);
  const st = await p.evaluate(() => ({fn: S.p.fn, ln: S.p.ln, pos: S.p.pos, foot: S.p.foot, age: S.p.age, g: S.dyn.g, ph: S.ph, head: (document.querySelector(".top h1") || {}).textContent}));
  notes.push("nueva generación: " + JSON.stringify(st));
  if (st.fn !== "Pablo" || st.ln !== "Leyenda" || st.pos !== "ED" || st.g !== 2) fail.push("el hijo no se crea como se eligió");
  await p.screenshot({ path: path.join(OUT, "03-hijo.png") });
  /* árbol desde el historial */
  await p.evaluate(() => { UIX.closeSheet(); UIX.ui().tab = "hist"; UIX.render(true); });
  await p.waitForTimeout(200);
  if (!(await c('.dynhist [data-a="dyn"]'))) fail.push("el historial no enlaza con la dinastía");
  await p.waitForTimeout(200);
  const tree = await p.evaluate(() => ({gens: document.querySelectorAll(".dyngen").length, live: document.querySelectorAll(".dyngen.live").length, clubs: document.querySelectorAll(".dynclubrow").length, rec: document.querySelectorAll(".dynrec .stat").length}));
  notes.push("árbol: " + JSON.stringify(tree));
  if (tree.gens !== 2 || tree.live !== 1 || !tree.clubs) fail.push("el árbol no muestra las dos generaciones");
  await p.screenshot({ path: path.join(OUT, "04-arbol.png"), fullPage: false });
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
