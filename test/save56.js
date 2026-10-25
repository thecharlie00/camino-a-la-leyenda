/* 5.6 guardado: versión y migraciones, escritura atómica y copia de seguridad. Uso: node test/save56.js */
const path = require("path"), { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 412, height: 915 } })).newPage();
  const errs = [], fail = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a); const c = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); }, s); await p.waitForTimeout(150); };
  await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Guardado"); for (let i = 0; i < 3; i++) await c('[data-a="cnext"]'); await c('[data-a="cclub"]'); await c('[data-a="cnext"]'); await p.waitForTimeout(400);
  const r = await js(async () => {
    const St = UIX.store, id = S.uid; GX.debug.unlock("g_hat"); S.p.money = 123456; UIX.persist(); await St.flush();
    const sv = JSON.parse(localStorage.getItem("camino.active")).sv;
    S.p.money = 222222; UIX.persist(); await St.flush();
    const hasBak = !!localStorage.getItem("camino.s." + id + ".bak"), tmpLeft = !!localStorage.getItem("camino.active.tmp");
    /* se estropea lo guardado: debe abrir la copia */
    localStorage.setItem("camino.active", "{roto"); localStorage.setItem("camino.s." + id, JSON.stringify({ ts: Date.now() + 9e9, z: false, d: "{roto" }));
    const j = await St.load(id); let money = null; try { money = JSON.parse(j).p.money; } catch (e) {}
    /* migración de una partida «antigua» sin versión ni trofeos nuevos */
    const old = JSON.parse(j); delete old.sv; old.gx = { v: 0 }; restore(old);
    return { sv, hasBak, tmpLeft, money, svAfter: S.sv, gx: !S.gx || S.gx.v === undefined ? "borrado" : S.gx.v, trophy: !!S.ach.g_hat };
  });
  console.log(JSON.stringify(r));
  if (r.sv !== 56) fail.push("versión"); if (!r.hasBak) fail.push("copia"); if (r.tmpLeft) fail.push("temporal"); if (r.money !== 123456) fail.push("recuperar copia"); if (r.svAfter !== 56) fail.push("migración");
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "save56 OK"); console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close();
})();
