/* 4.5 en el navegador: torneo de verano, día de cierre en directo (reloj, ofertas, gangas, cierre) y zona de play-off.
   Uso: node test/world45ui.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots45";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(90); return true; };
  await c('[data-a="setlang"][data-v="es"]');
  await p.evaluate(() => {
    buildWorld("m");
    const club = W.clubs.map((c, i) => i).filter(i => W.clubs[i].lg0 === W.lgIdx.ENG2)[3];
    newManagerCareer({fn: "Pep", ln: "Cierre", nat: "ES", age: 40, diff: 1, ev: 1, club: club, seed: 4545});
    UIX.ui().view = "game"; UIX.ui().tab = "club"; UIX.render(true);
  });
  /* decisiones de pretemporada hasta el día de cierre */
  await p.evaluate(() => { window.TAP_GAP = 0; });
  let dl = false, tour = false;
  for (let k = 0; k < 40 && !dl; k++) {
    if (await p.$(".dlcard")) { dl = true; break; }
    const k0 = await p.evaluate(() => S.pend[0] && S.pend[0].k);
    if (k0 === "mtour") { tour = true; await p.evaluate(() => document.querySelector(".card.decision").scrollIntoView()); await p.screenshot({ path: path.join(OUT, "01-torneo.png") }); }
    if (await c('.sheet [data-a="choose"]')) continue;
    if (await c('[data-a="choose"]')) continue;
    if (await c('[data-a="objok"]')) continue;
    if (!(await c('[data-a="advance"]'))) break;
  }
  if (!tour) fail.push("no salió el torneo de verano");
  const ptRes = await p.evaluate(() => (S.m.pt45 || []).length);
  notes.push("torneos de verano jugados: " + ptRes);
  if (!dl) fail.push("no apareció el día de cierre");
  else {
    await p.evaluate(() => document.querySelector(".dlcard").scrollIntoView());
    await p.screenshot({ path: path.join(OUT, "02-tarjeta.png") });
    await c('[data-a="dllive"]'); await p.waitForTimeout(200);
    if (!(await p.$(".dl45"))) fail.push("no se abre el directo");
    /* una ganga debe verse y comportarse como una oferta: tarjeta completa y botones pulsables */
    let acted = 0;
    const ganga = await p.evaluate(() => {
      const D = S.m.dl, e = D.ev.find(x => x.k === "bar");
      if (!e) return null;
      dlTick(Math.max(0, e.t - D.t));
      UIX.renderSheet();
      const el = document.querySelector(".dlev.ganga"), r = el && el.getBoundingClientRect();
      return {
        id: e.id,
        name: e.tg.fn + " " + e.tg.ln,
        h: r ? Math.round(r.height) : 0,
        text: el ? el.innerText : "",
        canSign: !!(el && el.querySelector('[data-a="dlyes"][data-v="' + e.id + '"]'))
      };
    });
    await p.waitForTimeout(80);
    if (!ganga) fail.push("no apareció ninguna ganga en el día de cierre");
    else {
      notes.push("ganga visible: " + ganga.name + " · " + ganga.h + " px");
      if (ganga.h < 100) fail.push("la tarjeta de ganga queda recortada (" + ganga.h + " px)");
      if (ganga.text.indexOf(ganga.name) < 0) fail.push("la ganga no muestra el nombre completo del jugador");
      if (!ganga.canSign) fail.push("la ganga no permite fichar");
      await p.screenshot({ path: path.join(OUT, "03-ganga.png") });
      await p.click('.dlev.ganga [data-a="dlyes"][data-v="' + ganga.id + '"]');
      await p.waitForTimeout(160);
      const after = await p.evaluate(id => {
        const e = S.m.dl.ev.find(x => x.id === id);
        return {done: e && e.done, button: !!document.querySelector('[data-a="dlyes"][data-v="' + id + '"]')};
      }, ganga.id);
      notes.push("ganga fichada: " + (after.done === "yes" ? "sí" : "no"));
      if (after.done !== "yes") fail.push("el botón Fichar de la ganga no responde");
      if (after.button) fail.push("la ganga sigue mostrando Fichar después de fichar");
      if (after.done === "yes") acted = 1;
    }
    for (let t = 0; t < 12; t++) {
      const yes = await p.$('.dl45 [data-a="dlyes"]:not([aria-disabled])');
      if (yes && acted < 2) { await yes.evaluate(x => x.click()); acted++; await p.waitForTimeout(120); }
      if (t === 4) await p.screenshot({ path: path.join(OUT, "03-directo.png") });
      if (!(await c('.dl45 [data-a="dlnext"]'))) break;
    }
    const clock = await p.evaluate(() => document.querySelector(".dlclock").textContent);
    await p.screenshot({ path: path.join(OUT, "04-cierre.png") });
    notes.push("reloj final " + clock + " · operaciones " + acted);
    if (clock !== "00:00") fail.push("el reloj no llega a medianoche");
    await c('[data-a="dlend"]'); await p.waitForTimeout(200);
    const st = await p.evaluate(() => ({pend: S.pend.map(x => x.k), open: S.m.mk.open, card: S.feed.some(f => f.title === tr("Día de cierre del mercado"))}));
    if (st.pend.indexOf("dlday") >= 0) fail.push("el día de cierre sigue pendiente");
    if (!st.card) fail.push("sin tarjeta de resumen del cierre");
    for (let k = 0; k < 10 && (await p.evaluate(() => S.ph === "pre")); k++) { if (!(await c('[data-a="choose"]'))) await c('[data-a="advance"]'); }
    const ph = await p.evaluate(() => [S.ph, S.m.mk.open]);
    notes.push("tras el cierre: fase " + ph[0] + ", mercado «" + ph[1] + "»");
    if (ph[0] !== "blk" && ph[0] !== "gap") fail.push("no empieza el tramo tras el cierre");
  }
  /* zona de play-off en la tabla */
  await p.evaluate(() => { UIX.closeSheet && UIX.closeSheet(); UIX.ui().tab = "comp"; UIX.render(true); });
  await p.waitForTimeout(200);
  const z = await p.evaluate(() => ({z4: document.querySelectorAll("td.z4").length, z2: document.querySelectorAll("td.z2").length, leg: /Play-off de ascenso/.test(document.body.textContent)}));
  notes.push("tabla: ascenso directo " + z.z2 + " · play-off " + z.z4);
  if (!z.z4 || z.z4 % 4 || z.z2 * 2 !== z.z4 || !z.leg) fail.push("la tabla no marca el play-off");
  await p.evaluate(() => { const t = document.querySelector("td.z4"); if (t) t.scrollIntoView({block: "center"}); });
  await p.screenshot({ path: path.join(OUT, "05-tabla.png") });
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
