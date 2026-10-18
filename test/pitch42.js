/* 4.2: auditoría del campo 2D en un partido real — sin NaN ni salidas del campo, cono de error del pase,
   tácticas con contrapartida (línea, radio de presión, desgaste) y atributos que llegan a las bolitas.
   Uso: node test/pitch42.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots42";
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
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(80); return true; };
  await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Auditor"); await c('[data-a="cnext"]');
  await c('[data-a="cset"][data-k="ev"][data-v="2"]'); await c('[data-a="cnext"]'); await c('[data-a="cclub"]'); await c('[data-a="cnext"]');
  let live = false;
  for (let k = 0; k < 160 && !live; k++) {
    if (await p.$("#live")) { live = true; break; }
    if (await c('[data-a="drawspeed"][data-v="skip"]')) { await c('[data-a="drawclose"]'); continue; }
    const t = await p.evaluate(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(t)) { await c('.sheet [data-a="choose"][data-i="0"]'); continue; }
    if (await c('[data-a="objok"]')) continue; if (await c('.sheet [data-a="choose"]')) continue; if (await c('[data-a="choose"]')) continue;
    if (!(await c('[data-a="advance"]'))) break;
  }
  if (!live) fail.push("no se llegó al directo");
  else {
    await c('[data-a="lspeed"][data-v="1"]');
    const at = await p.evaluate(() => { const P = Pitch.debug(), a = []; P.T.forEach(t => t.forEach(q => { if (q) a.push({pos: q.pos, pas: q.pas, ent: q.ent, col: q.col, rt: q.rt, pace: q.pace}); })); return a; });
    const bad = at.filter(q => [q.pas, q.ent, q.col, q.rt, q.pace].some(v => typeof v !== "number" || !isFinite(v)));
    if (bad.length) fail.push("atributos sin calcular en " + bad.length + " bolitas");
    const dfc = at.filter(q => q.pos === "DFC"), dc = at.filter(q => q.pos === "DC");
    notes.push("entrada media DFC " + (dfc.reduce((s, q) => s + q.ent, 0) / dfc.length).toFixed(0) + " vs DC " + (dc.reduce((s, q) => s + q.ent, 0) / Math.max(1, dc.length)).toFixed(0));
    /* tácticas: medir la línea defensiva y quién presiona con bloque bajo y alto */
    const tacRun = async (ment, line) => {
      await p.evaluate(([m, l]) => { const P = Pitch.debug(); window.__tm = {line: [0, 0], n: [0, 0], far: 0, farN: 0}; P.tac = [ {blk: m, press: m === 2, ret: m === -2, width: 1, pass: 1, tempo: 1}, {blk: m, press: m === 2, ret: m === -2, width: 1, pass: 1, tempo: 1} ]; void l; }, [ment, line]);
      for (let i = 0; i < 80; i++) {
        await p.waitForTimeout(200);
        if (!(await p.$("#live"))) break;
        await p.evaluate(() => {
          const P = Pitch.debug(), b = P.ball, tm = window.__tm; if (!P || P.cele) return;
          for (let s = 0; s < 2; s++) { const att = (b.m === 0 ? b.hs : P.own) === s; if (!att) { tm.line[s] += P.line[s]; tm.n[s]++; } }
          /* con el balón controlado en el tercio central: a qué distancia está el defensor más cercano */
          if (b.m === 0 && b.x > 35 && b.x < 70 && !(P.ck < P.hardUntil || P.ck < P.softUntil)) {
            const d = 1 - b.hs; let best = 99; P.T[d].forEach(q => { if (q && !q.gone && !q.off && !q.gk) best = Math.min(best, Math.hypot(q.x - b.x, q.y - b.y)); });
            tm.far += best; tm.farN++;
          }
        });
      }
      return p.evaluate(() => { const tm = window.__tm, n = tm.n[0] + tm.n[1]; return {line: n ? (tm.line[0] + tm.line[1]) / n : 0, near: tm.farN ? tm.far / tm.farN : 0, n: tm.farN}; });
    };
    const low = await tacRun(-2), high = await tacRun(2);
    notes.push("bloque bajo: línea media " + low.line.toFixed(1) + " m, rival más cercano al balón " + low.near.toFixed(1) + " m · presión alta: línea " + high.line.toFixed(1) + " m, más cercano " + high.near.toFixed(1) + " m");
    notes.push("(muestras con el balón en el centro: " + low.n + " / " + high.n + ")");
    if (!(high.line > low.line + 6)) fail.push("la presión alta no adelanta la línea");
    if (!(high.near < low.near)) fail.push("la presión alta no acerca a nadie al balón");
    /* si el tramo medido tuvo poco juego abierto (muchas jugadas narradas), se mira un rato más */
    for (let k = 0; k < 40 && (await p.evaluate(() => Pitch.debug() && Pitch.debug().qa.pass < 3)) && (await p.$("#live")); k++) await p.waitForTimeout(500);
    const qa = await p.evaluate(() => { const q = Pitch.debug().qa; return {nan: q.nan, oob: q.oob, pass: q.pass, perr: q.pass ? q.perr / q.pass : 0}; });
    notes.push("auditoría: NaN reparados " + qa.nan + " · fuera de límites " + qa.oob + " · pases abiertos " + qa.pass + " con error medio " + qa.perr.toFixed(2) + " m");
    if (qa.nan || qa.oob) fail.push("NaN o salidas del campo durante el partido");
    if (qa.pass < 1) fail.push("no hay pases en juego abierto");
    if (!(qa.perr > 0.2 && qa.perr < 4)) fail.push("error de pase fuera de rango");
    /* desgaste: la presión alta cansa más que encerrarse (motor del partido) */
    const wear = await p.evaluate(() => {
      const L = S.live; if (!L) return null;
      const keep = JSON.stringify({fit: L.fit, ment: L.ment, ev: L.ev.length}), r = {};
      ["bus", "press"].forEach(m => { const f0 = JSON.parse(JSON.stringify(L.fit)); L.ment = m; let d = 0, n = 0; for (let k = 0; k < 400; k++) { L.xi.forEach((id, i) => { if (id == null || id === L.red) return; const v = mxDecay(L, mPl(id), (FORMATIONS[L.form] || [])[i]); if (typeof v === "number") { d += v; n++; } }); } r[m] = n ? d / n : 0; L.fit = f0; });
      const o = JSON.parse(keep); L.fit = o.fit; L.ment = o.ment; return r;
    });
    if (wear) { notes.push("desgaste por minuto: encerrarse " + wear.bus.toFixed(3) + " · presión alta " + wear.press.toFixed(3)); if (!(wear.press > wear.bus * 1.2)) fail.push("la presión alta no cansa más"); }
    await p.screenshot({ path: path.join(OUT, "01-campo.png") });
  }
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
