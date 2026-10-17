/* 4.1: motor en directo — xG, duelos, cansancio por minuto, momentum, 18 zonas, clima y estados.
   Comprueba que la media de goles por tiro sigue en el rango del motor anterior y que la interfaz lo enseña.
   Uso: node test/match41.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots41";
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
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Motor"); await c('[data-a="cnext"]');
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
    await p.evaluate(() => { try { document.querySelector('[data-a="lspeed"][data-v="0"]').click(); } catch (e) {} });
    const st = await p.evaluate(() => {
      const L = S.live, seen = {}, f0 = {};
      L.xi.forEach(id => { f0[id] = mPl(id).fit; });
      for (let i = 0; i < 50; i++) liveStep().forEach(e => { seen[e.st] = 1; if ((e.t === "goal" || e.t === "save" || e.t === "miss" || e.t === "post") && (e.xg == null || e.xg <= 0 || e.xg >= 1)) seen.badxg = 1; });
      const drops = L.xi.filter(id => id !== L.red).map(id => f0[id] - L.fit[id]);
      UIX.openLive();
      return { min: L.min, xg: L.xg, mom: L.mom, zn: L.zn.reduce((a, b) => a + b, 0), wx: L.wx, st: L.st, seen: Object.keys(seen), drop: [Math.min(...drops), Math.max(...drops)] };
    });
    notes.push("a los 50': " + JSON.stringify(st));
    if (!(st.zn >= 50)) fail.push("zonas sin datos");
    if (st.seen.indexOf("badxg") >= 0) fail.push("tiro sin xG válido");
    if (!(st.drop[1] > 3)) fail.push("la resistencia no baja");
    if (Math.abs(st.mom) > 100) fail.push("momentum fuera de rango");
    await p.waitForTimeout(300);
    await p.evaluate(() => { const x = document.querySelector(".lx"); if (x) x.scrollIntoView({ block: "center" }); });
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(OUT, "01-directo.png") });
    const ui = await p.evaluate(() => ({ lx: !!document.querySelector(".lx"), zn: document.querySelectorAll(".lzn i").length, fit: document.querySelectorAll(".lpl .fit[class*='f-']").length }));
    notes.push("interfaz: " + JSON.stringify(ui));
    if (!ui.lx || ui.zn !== 18) fail.push("faltan xG/territorio en el directo");
    /* calibración: muchos partidos completos */
    const cal = await p.evaluate(() => {
      const fi = S.live.fi, keep = JSON.stringify(S.cur.pm[fi]), o = { g: 0, sh: 0, xg: 0, big: 0, n: 0, end: [] };
      S.live = null;
      for (let i = 0; i < 300; i++) {
        S.cur.pm[fi] = JSON.parse(keep); liveStart(fi); liveSimRest(); const L = S.live;
        o.g += L.gu + L.gt; o.sh += L.shots[0] + L.shots[1]; o.xg += L.xg[0] + L.xg[1]; o.big += L.big[0] + L.big[1]; o.n++;
        if (!o.st) o.st = L.st; S.live = null;
      }
      S.cur.pm[fi] = JSON.parse(keep);
      return { conv: o.g / o.sh, bigR: o.big / o.sh, xgPerGoal: o.xg / o.g, st: o.st };
    });
    notes.push("calibración: " + JSON.stringify(cal));
    if (cal.conv < 0.16 || cal.conv > 0.26) fail.push("conversión fuera de rango: " + cal.conv);
    if (cal.bigR < 0.3 || cal.bigR > 0.42) fail.push("ocasiones claras fuera de rango");
    if (cal.xgPerGoal < 0.85 || cal.xgPerGoal > 1.15) fail.push("xG descalibrado: " + cal.xgPerGoal);
    if (cal.st !== "FULL_TIME") fail.push("no termina en FULL_TIME");
  }
  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES");
  await b.close();
})();
