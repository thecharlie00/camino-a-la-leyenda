/* Menú de inicio, idiomas, ranuras de partida, los tres modos, club propio y arrastrar jugadores.
   Uso: node test/ui3.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots3";
fs.mkdirSync(OUT, { recursive: true });
const OLD = process.env.OLD_SAVE || "";
(async () => {
  const notes0 = [];
  process.on("unhandledRejection", (e) => { console.log(notes0.join("\n")); console.log("FALLO:", e.message.split("\n")[0]); process.exit(1); });
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = notes0;
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  const url = "file://" + path.join(__dirname, "../dist/index.html");
  if (OLD) {
    /* partida de la versión anterior guardada en la ranura única */
    await p.goto(url); await p.waitForTimeout(200);
    await p.evaluate((j) => { localStorage.clear(); localStorage.setItem("camino.save", j); localStorage.setItem("camino.ts", String(Date.now())); }, fs.readFileSync(OLD, "utf8"));
  }
  await p.goto(url);
  await p.waitForTimeout(300);
  const shot = async (n) => { await p.screenshot({ path: path.join(OUT, n + ".png") }); };
  const overflow = async (label) => { const o = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (o) errs.push("desbordamiento horizontal en " + label); };
  const click = async (sel) => { await p.click(sel); await p.waitForTimeout(120); };
  /* 1. idioma */
  if (!OLD) {
    const langs = await p.$$eval('[data-a="setlang"]', l => l.map(x => x.getAttribute("data-v")));
    notes.push("idiomas: " + langs.join(","));
    await shot("01-idioma"); await overflow("idioma");
    await click('[data-a="setlang"][data-v="en"]');
    notes.push("lang tras elegir: " + await p.evaluate(() => LANG + " " + document.documentElement.lang));
    await click('[data-a="golang"]');
    await click('[data-a="setlang"][data-v="es"]');
  }
  if (OLD) { await click('[data-a="setlang"][data-v="es"]'); notes.push("migrada: ranuras " + await p.evaluate(() => JSON.parse(localStorage.getItem("camino.slots") || "[]").map(e => e.n + "/" + e.mode).join(",") + " · save viejo " + !!localStorage.getItem("camino.save"))); }
  await shot("02-portada"); await overflow("portada");
  /* 2. carrera de jugador */
  await click('[data-a="newgame"]');
  await shot("03-modos"); await overflow("modos");
  await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Prueba");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await shot("03b-ofertas"); await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  notes.push("jugador: " + await p.evaluate(() => S && S.p ? S.p.fn + " " + clubName(S.p.club) + " vista=" + document.querySelector(".top h1").textContent : "sin partida"));
  /* 3. menú principal y carrera de míster */
  await click('[data-a="menu"]'); await shot("04-menu"); await click('[data-a="home"]');
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Banquillo");
  await click('[data-a="cnext"]'); await shot("05-mgr-dificultad"); await overflow("dificultad");
  await click('[data-a="cset"][data-k="diff"][data-v="2"]');
  await click('[data-a="cnext"]');
  await shot("05b-mgr-ofertas");
  await click('[data-a="cset"][data-k="mmode"][data-v="pick"]');
  await p.selectOption("#clg", { index: 3 }); await p.waitForTimeout(150);
  await click('[data-a="cclub"]');
  await shot("06-mgr-club"); await overflow("elegir club");
  await click('[data-a="cnext"]');
  notes.push("míster: " + await p.evaluate(() => S.mode + " " + clubName(S.m.club) + " dif=" + S.m.diff + " sq=" + S.m.sq.length + " bench=" + (S.m.bench || []).length));
  /* cerrar decisiones pendientes que se abren en hoja */
  for (let k = 0; k < 6; k++) { const pend = await p.$('.sheet [data-a="choose"]'); if (!pend) break; await pend.click(); await p.waitForTimeout(150); }
  await click('[data-a="tab"][data-t="plantilla"]');
  await shot("07-plantilla"); await overflow("plantilla");
  /* 4. arrastrar con ratón: titular (hueco 9) encima del primer suplente */
  /* suplente compatible con el puesto (desde la 2.6 no se puede poner a nadie fuera de su línea) */
  const before = await p.evaluate(() => { const sp = (FORMATIONS[S.m.form] || [])[9], b = S.m.bench.filter(id => posOk(mPl(id).pos, sp))[0]; return { xi9: S.m.xi[9], b0: b }; });
  const box = async (sel) => { const e = await p.$(sel); if (!e) return null; await e.scrollIntoViewIfNeeded(); return e.boundingBox(); };
  await p.evaluate(() => { const w = document.getElementById("ntfs"); if (w) w.remove(); });
  let a = await box('.slot[data-i="9"]'), c = await box('.bchip[data-id="' + before.b0 + '"]');
  if (a && c) {
    a = await box('.slot[data-i="9"]'); c = await box('.bchip[data-id="' + before.b0 + '"]');
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
    await p.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, { steps: 3 });
    for (let k = 0; k < 4; k++) { await p.waitForTimeout(120); c = await (await p.$('.bchip[data-id="' + before.b0 + '"]')).boundingBox(); await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 4 }); }
    await p.waitForTimeout(80);
    notes.push("bajo el cursor: " + await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y), d = e && e.closest("[data-drop]"); return d ? d.getAttribute("data-drop") : (e ? e.className : "nada"); }, [c.x + c.width / 2, c.y + c.height / 2]) + " · origen " + await p.evaluate(() => { const d = document.querySelector(".dsrc"); return d ? d.getAttribute("data-drag") : "?"; }));
    await p.mouse.up(); await p.waitForTimeout(200);
    const after = await p.evaluate((o) => ({ xi9: S.m.xi[9], oldOnBench: S.m.bench.indexOf(o) >= 0, sheet: !!document.querySelector(".sheet"), us: UIX.ui().sheet && UIX.ui().sheet.k, toast: (document.querySelector(".toast") || {}).textContent }), before.xi9);
    notes.push("ratón: antes " + JSON.stringify(before) + " después " + JSON.stringify(after));
    if (!(after.xi9 === before.b0 && after.oldOnBench)) errs.push("el arrastre con ratón no intercambió titular y suplente");
    if (after.sheet) errs.push("tras arrastrar se abrió una hoja (clic no suprimido)");
  } else errs.push("no encuentro hueco o suplente para arrastrar");
  /* 5. arrastrar con el dedo: un no convocado al banquillo (pulsación larga) */
  const cdp = await ctx.newCDPSession(p);
  const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const nc0 = await p.evaluate(() => { const inXI = {}; S.m.xi.forEach(id => inXI[id] = 1); const onB = {}; S.m.bench.forEach(id => onB[id] = 1); const l = mActive().filter(q => !inXI[q.id] && !onB[q.id]); return l.length ? l[0].id : null; });
  if (nc0 != null) {
    let r = await box('.prow[data-id="' + nc0 + '"]');
    const bb0 = await p.evaluate(() => S.m.bench.length);
    await touch("touchStart", r.x + 40, r.y + r.height / 2);
    await p.waitForTimeout(420);
    await touch("touchMove", r.x + 44, r.y + r.height / 2 - 6);
    /* subir hasta el banquillo: el desplazamiento automático acerca la zona */
    const chipPos = () => p.evaluate(() => { const e = document.querySelector(".bchip"); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; });
    let tgt = null;
    for (let k = 0; k < 80; k++) {
      const st = await chipPos();
      if (st && st.y > 260) break;
      await touch("touchMove", r.x + 44, 60); await p.waitForTimeout(40);
    }
    /* dedo al centro para parar el desplazamiento y luego encima del suplente */
    await touch("touchMove", 200, 450); await p.waitForTimeout(120);
    tgt = await chipPos();
    if (tgt) { await touch("touchMove", tgt.x, tgt.y); await p.waitForTimeout(80); tgt = await chipPos(); await touch("touchMove", tgt.x, tgt.y); await p.waitForTimeout(60); }
    await shot("08-arrastrando");
    await touch("touchEnd", 0, 0); await p.waitForTimeout(250);
    const res = await p.evaluate((id) => ({ zone: mZoneOf(id)[0], bench: S.m.bench.length, sheet: !!document.querySelector(".sheet") }), nc0);
    notes.push("dedo: banquillo " + bb0 + " → " + res.bench + ", zona " + res.zone);
    if (res.zone !== "bench") errs.push("el arrastre táctil no llevó al no convocado al banquillo");
    if (res.sheet) errs.push("tras el arrastre táctil se abrió una hoja");
  } else notes.push("sin no convocados para probar el dedo");
  await shot("09-plantilla-despues");
  /* 6. ficha: cambiar nombre */
  await p.evaluate(() => { const m = document.getElementById("main"); m.scrollTop = 0; });
  const pid = await p.evaluate(() => S.m.bench[0]);
  await p.waitForTimeout(500);
  await p.evaluate((id) => { document.querySelector('.bchip[data-id="' + id + '"]').click(); }, pid);
  await p.waitForTimeout(150); await shot("10-ficha");
  await click('[data-a="renpl"]');
  await p.fill("#rfn", "Nuevo"); await p.fill("#rln", "Nombre Prueba");
  await click('[data-a="dorename"]');
  notes.push("renombrado: " + await p.evaluate((id) => plName(mPl(id)), pid));
  await click('[data-a="close"]');
  /* 7. crea tu club */
  await click('[data-a="menu"]'); await click('[data-a="home"]');
  await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", "Atlètic Vallès"); await p.fill("#ab", "atv");
  await click('[data-a="ccol"][data-k="0"][data-v="#0b5d3b"]'); await click('[data-a="ccol"][data-k="1"][data-v="#ffcd00"]');
  await shot("11-club-escudo"); await overflow("club escudo");
  await click('[data-a="cnext"]');
  await p.selectOption("#clg", { index: 4 }); await p.waitForTimeout(150);
  await shot("12-club-liga");
  await click('[data-a="cnext"]'); await click('[data-a="cset"][data-k="diff"][data-v="3"]');
  await click('[data-a="cnext"]');
  await p.fill("#fn", "Carles"); await p.fill("#ln", "Dueño");
  await click('[data-a="cnext"]');
  await shot("13-borrador"); await overflow("borrador");
  const first = await p.$("[data-rn]");
  await first.fill("Jugador Renombrado"); await first.press("Tab"); await p.waitForTimeout(100);
  notes.push("borrador: " + await p.evaluate(() => S.ph + " " + clubName(S.m.club) + " " + S.m.sq.length + " jugadores; primero=" + plName(S.m.sq.find(x => x.id === +document.querySelector("[data-rn]").getAttribute("data-rn")))));
  await click('[data-a="redraft"]');
  await click('[data-a="startclub"]');
  notes.push("club: " + await p.evaluate(() => S.ph + " " + clubName(S.m.club) + " owner=" + S.m.owner + " r=" + S.cr[S.m.club]));
  await shot("14-club-juego");
  /* 8. cargar partidas: 3 ranuras, recargar la página no entra sola en la partida */
  await click('[data-a="menu"]'); await click('[data-a="home"]');
  await click('[data-a="goload"]'); await p.waitForTimeout(150);
  const nslots = await p.$$eval(".slotc", l => l.length);
  notes.push("ranuras: " + nslots);
  await shot("15-cargar"); await overflow("cargar");
  await p.reload(); await p.waitForTimeout(400);
  notes.push("tras recargar: vista=" + await p.evaluate(() => document.querySelector(".hero") ? "portada" : "otra") + " lang=" + await p.evaluate(() => LANG));
  await click('[data-a="goload"]');
  const ids = await p.$$eval('[data-a="loadslot"]', l => l.map(x => x.getAttribute("data-v")));
  await click('[data-a="loadslot"][data-v="' + ids[ids.length - 1] + '"]'); await p.waitForTimeout(300);
  notes.push("cargada la más antigua: " + await p.evaluate(() => S ? (S.mode || "jugador") + " " + (S.p ? S.p.fn : S.m.fn) : "nada"));
  /* avanzar unas semanas para comprobar el guardado */
  for (let k = 0; k < 3; k++) { const go = await p.$('[data-a="advance"]'); if (!go) break; await go.click(); await p.waitForTimeout(150); const ch = await p.$('[data-a="choose"]'); if (ch) { await ch.click(); await p.waitForTimeout(120); } }
  /* 9. borrar una ranura */
  await click('[data-a="menu"]'); await click('[data-a="home"]'); await click('[data-a="goload"]');
  const n1 = await p.$$eval(".slotc", l => l.length);
  await click('[data-a="askdel"]'); await click('[data-a="dodel"]');
  const n2 = await p.$$eval(".slotc", l => l.length);
  notes.push("borrar: " + n1 + " → " + n2);
  if (n2 !== n1 - 1) errs.push("no se borró la ranura");
  const keys = await p.evaluate(() => Object.keys(localStorage).sort().join(", ") + " · bytes " + Object.keys(localStorage).reduce((s, k) => s + localStorage.getItem(k).length, 0));
  notes.push("localStorage: " + keys);
  console.log(notes.join("\n"));
  console.log("ERRORES:", errs.length ? errs.join("\n") : "ninguno");
  await b.close();
})();
