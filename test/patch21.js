/* Parche 2.1: resultado tras el momento, avisos, minijuegos de portero, negociación con frustración, clausulazo y redes tras el directo.
   Uso: node test/patch21.js [carpeta] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/p21"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const clickIf = async (s) => { const e = await p.$(s); if (!e) return false; await e.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(60); return true; };
  const goTab = async (t) => { if (await p.$('nav [data-a="tab"][data-t="' + t + '"]')) return clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await clickIf('nav [data-a="tab"][data-t="mas"]'); return clickIf('.mrow[data-t="' + t + '"]'); };
  const shot = (n) => p.screenshot({ path: OUT + "/" + n + ".png" });
  await p.click('[data-a="setlang"][data-v="es"]');

  /* 1. jugador: momento → marcador final y aviso */
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Final");
  for (let i = 0; i < 3; i++) await p.click('[data-a="cnext"]');
  await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  let got = false;
  for (let k = 0; k < 260 && !got; k++) {
    const x = await p.evaluate(() => S.pend[0] && S.pend[0].k);
    if (x === "moment") { got = true; break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("momento: " + got);
  if (got) {
    await p.click('.opt[data-a="choose"]'); await p.waitForTimeout(250);
    notes.push("finbox: " + await p.$$eval(".finbox", l => l.length) + " · " + await p.evaluate(() => JSON.stringify(S.feed[0].fin)));
    notes.push("aviso: " + await p.$$eval(".ntf", l => l.map(x => x.textContent).join(" | ")));
    await shot("01-final-momento");
  }
  /* avisos de lesión y roja */
  await p.evaluate(() => { injure(6); notify("🟥 " + tr("Expulsado ante el {opp}: {n} partido de sanción.", {opp: "Real Madrid", n: 1}), "red"); });
  await goTab('jugador'); await p.waitForTimeout(250);
  notes.push("avisos rojos: " + await p.$$eval(".ntf.red", l => l.map(x => x.textContent).join(" | ")));
  await shot("02-avisos-rojos");
  /* resultados al simular un tramo */
  await goTab('carrera');
  for (let k = 0; k < 40; k++) { if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (await clickIf('[data-a="advance"]')) { await p.waitForTimeout(120); if (await p.$(".ntf.res")) break; } }
  notes.push("resultados: " + await p.$$eval(".ntf.res", l => l.map(x => x.textContent).join(" | ").slice(0, 200)));
  await shot("03-resultados");

  /* 2. portero: penalti en contra con minijuego */
  await p.evaluate(() => { S.p.pos = "POR"; S.p.inj = null; S.p.injT = 0; S.p.susp = 0; });
  got = false;
  for (let k = 0; k < 300 && !got; k++) {
    const x = await p.evaluate(() => S.pend[0] && S.pend[0].k);
    if (x === "moment") { await p.evaluate(() => { S.pend[0].id = "penalti_contra"; }); await goTab('jugador'); await goTab('carrera'); got = true; break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("penalti en contra: " + got + " · " + await p.evaluate(() => S.ph + " " + (S.pend[0] && S.pend[0].k) + " role? " + JSON.stringify(S.p.inj) + " " + S.p.injT + " tw " + S.tw));
  if (got) {
    await shot("04-penalti-contra-opciones");
    await p.click('[data-a="mini"]'); await p.waitForSelector(".mg-cell");
    await p.tap('.mg-cell[data-i="1"]'); await p.tap(".mg-btn.pri"); await p.waitForTimeout(400);
    await p.keyboard.press("Space");
    await p.waitForFunction(() => !document.querySelector(".mg-ov"), null, { timeout: 8000 });
    await p.waitForTimeout(300);
    notes.push("tras parar: " + await p.evaluate(() => S.feed[0].title + " → " + S.feed[0].good + " · " + (S.feed[0].fin ? S.feed[0].fin.gu + "-" + S.feed[0].fin.gt : "")));
    await shot("05-tras-penalti-contra");
  }
  /* falta en contra */
  got = false;
  for (let k = 0; k < 300 && !got; k++) {
    const x = await p.evaluate(() => S.pend[0] && S.pend[0].k);
    if (x === "moment") { await p.evaluate(() => { S.pend[0].id = "falta_contra_gk"; }); await goTab('jugador'); await goTab('carrera'); got = true; break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("falta en contra: " + got);
  if (got) {
    await p.click('[data-a="mini"]'); await p.waitForSelector(".mg-gkf");
    await p.tap(".mg-btn.pri"); await p.tap(".mg-btn.pri"); await p.waitForTimeout(400);
    await p.keyboard.press("Space");
    await p.waitForFunction(() => !document.querySelector(".mg-ov"), null, { timeout: 9000 });
    await p.waitForTimeout(300);
    notes.push("tras falta: " + await p.evaluate(() => S.feed[0].title + " → " + S.feed[0].good));
  }

  /* 3. míster: negociación con frustración */
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  await clickIf('[data-a="setlang"][data-v="es"]');
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Prueba");
  for (let i = 0; i < 2; i++) await p.click('[data-a="cnext"]');
  await clickIf('[data-a="cset"][data-k="mmode"][data-v="pick"]'); await clickIf('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(300);
  for (let k = 0; k < 8; k++) { if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; break; }
  const tid = await p.evaluate(() => { const t = S.m.mk.list.find(t => !t.done && t.club >= 0); S.m.bud = Math.max(S.m.bud, t.ask * 2); return t.id; });
  await goTab('mercado');
  const ok = await clickIf('[data-a="mbid"][data-id="' + tid + '"]'); await p.waitForTimeout(300);
  notes.push("negociación abierta: " + ok + " · " + await p.$$eval(".nego h3", l => l.map(x => x.textContent).join("")));
  await shot("06-nego-inicio");
  /* oferta ridícula: sube la frustración */
  await p.evaluate(() => { const i = document.getElementById("negov"); i.value = i.min; i.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click('[data-a="negooff"]'); await p.waitForTimeout(250);
  notes.push("tras oferta baja: frustración " + await p.evaluate(() => S.pend[0] && S.pend[0].k === "nego" ? Math.round(S.pend[0].fr) : "—") + " · " + await p.$$eval(".nlog li", l => l.slice(0, 1).map(x => x.textContent).join("")));
  await shot("07-nego-frustracion");
  /* pagar lo que piden: pasa a hablar con el jugador */
  await p.evaluate(() => { const x = S.pend[0]; const i = document.getElementById("negov"); i.value = Math.min(+i.max, x.ask); i.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click('[data-a="negooff"]'); await p.waitForTimeout(250);
  notes.push("fase: " + await p.evaluate(() => S.pend[0] && S.pend[0].k === "nego" ? S.pend[0].ph : "fin"));
  await shot("08-nego-jugador");
  await p.evaluate(() => { const x = S.pend[0]; const i = document.getElementById("negov"); i.value = x.ask; i.dispatchEvent(new Event("input", { bubbles: true })); });
  await clickIf('[data-a="negoprom"]');
  await clickIf('[data-a="negooff"]'); await p.waitForTimeout(300);
  notes.push("fichado: " + await p.evaluate((tid) => { const t = mgrTarget(tid); return t ? t.done : "?"; }, tid) + " · avisos: " + await p.$$eval(".ntf", l => l.map(x => x.textContent).join(" | ")));
  await shot("09-nego-fichado");
  /* hasta romper: muchas ofertas bajas */
  const tid2 = await p.evaluate(() => { const t = S.m.mk.list.find(t => !t.done && t.club >= 0); return t ? t.id : null; });
  if (tid2) {
    await goTab('club'); await goTab('mercado');
    await clickIf('[data-a="mbid"][data-id="' + tid2 + '"]'); await p.waitForTimeout(200);
    for (let k = 0; k < 12; k++) {
      if (!(await p.$('[data-a="negooff"]'))) break;
      await p.evaluate(() => { const i = document.getElementById("negov"); i.value = i.min; i.dispatchEvent(new Event("input", { bubbles: true })); });
      await p.click('[data-a="negooff"]'); await p.waitForTimeout(120);
    }
    notes.push("rota: " + await p.evaluate((t) => mgrTarget(t).done, tid2));
  }
  /* clausulazo forzado */
  await p.evaluate(() => { const pl = mActive().sort((a, b) => b.ovr - a.ovr)[0]; S.pend.unshift(mp("clausm", { pid: pl.id, club: S.m.club === 0 ? 1 : 0, fee: clauseOf(pl), ui: true })); });
  await goTab('club');
  await p.waitForTimeout(300); await shot("10-clausulazo");
  await clickIf('.sheet [data-a="choose"]'); await p.waitForTimeout(200);
  notes.push("clausulazo: " + await p.evaluate(() => S.m.tx[0] && S.m.tx[0].n + " · " + S.m.tx[0].fee));
  /* redes tras el directo */
  const posts0 = await p.evaluate(() => (S.soc && S.soc.posts.length) || 0);
  await p.evaluate(() => { const f = { liveDone: true, liveSubs: [], gu: 2, gt: 1, opp: S.m.club === 0 ? 1 : 0, ment: 2, forced: [] }; liveSocial(f, 2, 1); });
  notes.push("posts tras directo: " + (await p.evaluate(() => S.soc.posts.length) - posts0));
  console.log(notes.join("\n")); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "ERRORES: ninguno");
  await b.close();
})();
