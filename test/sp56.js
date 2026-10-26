/* 5.6: balón parado 3D — paridad del clásico (mismo consumo de azar), los cuatro modos nuevos sin errores,
   y la tarjeta/hoja de entrenamiento en una partida real. Uso: node test/sp56.js */
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 860 } }); const p = await ctx.newPage(); const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message + " " + (e.stack || "").split("\n")[1])); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  /* 1) paridad: el clásico de portero en 3D llama a rand exactamente igual que el 2D */
  const par = await p.evaluate(() => {
    const host = document.createElement("div"); host.style.cssText = "position:fixed;inset:0"; document.body.appendChild(host);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 360 300"); host.appendChild(svg);
    const ov = document.createElement("div"); document.body.appendChild(ov);
    const ui = {stage: host, press: 0, ov: ov, state: "aim"};
    const v3 = SpModes.stage3d(ui, svg, "gkpen", {pressure: 0.3}); if (!v3) return "no3d";
    const out = []; const hows = ["gol", "parada", "fuera", "palo"];
    for (const how of hows) for (let tz = 0; tz < 6; tz++) for (const d of [tz, (tz + 1) % 6]) {
      let n = 0; const base = SpPhys.rng(tz * 31 + d + how.length), rand = () => { n++; return base(); };
      const r = tz < 3 ? 0 : 1, col = tz % 3;
      const expect = 2 + (how === "gol" && tz === d && col === 1 ? 1 : 0) + (how === "fuera" && (r === 0 || col === 1) ? 1 : 0) + (how === "palo" && col !== 1 && r === 0 ? 1 : 0);
      v3.S3.onFrame = null; SpModes.gkPenDive(v3, how, d, tz, 0.5, {reach: 1, sameF: 1, sw: 0, late: 0}, rand, function () {});
      if (n !== expect) out.push(how + " tz" + tz + " d" + d + ": " + n + " vs " + expect);
    }
    v3.dispose(); host.remove(); ov.remove();
    return out.length ? out.join("; ") : "ok";
  });
  if (par !== "ok") fail.push("paridad del clásico: " + par);
  /* 2) los cuatro modos nuevos: abrir, jugar un gesto, cerrar con resultado */
  async function swipe(from, to, ms) { await p.mouse.move(from[0], from[1]); await p.mouse.down(); for (let i = 1; i <= 10; i++) { const k = i / 10; await p.mouse.move(from[0] + (to[0] - from[0]) * k + Math.sin(k * Math.PI) * 25, from[1] + (to[1] - from[1]) * k); await p.waitForTimeout(ms / 10); } await p.mouse.up(); }
  for (const mode of ["fkShoot", "penPro", "gkFk", "gkPenPro"]) {
    await p.evaluate((mode) => { window.RES = undefined; SpModes.setPref("skip", true); SpPlay[mode]({skill: 78, gk: 70, dist: 22, press: 0.3, rand: SpPhys.rng(5)}, r => { window.RES = r; }); }, mode);
    await p.waitForTimeout(2400);
    const camDone = async () => { for (let i = 0; i < 60; i++) { if (await p.evaluate(() => SP3.last && SP3.last.cam.k >= 1)) return; await p.waitForTimeout(250); } };
    for (let i = 0; i < 60 && !(await p.$('[data-sp="ready"], [data-sp="go"]')) && (mode === "fkShoot" || mode === "penPro" || mode === "gkFk"); i++) await p.waitForTimeout(250);
    if (mode === "fkShoot" || mode === "penPro") { await camDone(); await p.evaluate(() => document.querySelector('[data-sp="ready"]').click()); await p.waitForTimeout(300); await camDone(); const bp = await p.evaluate(() => { const S3 = SP3.last, q = S3.project(S3.ball.x, 0.11, S3.ball.z); return [q.x, q.y]; }); await swipe(bp, [bp[0] - 60, bp[1] - 240], 240); }
    else if (mode === "gkFk") { await p.evaluate(() => document.querySelector('[data-sp="go"]').click()); for (let i = 0; i < 80 && !(await p.evaluate(() => !!SP3.last.liveBall)); i++) await p.waitForTimeout(150); await swipe([206, 520], [90, 470], 120); }
    else { for (let i = 0; i < 80 && !(await p.evaluate(() => !!SP3.last.liveBall)); i++) await p.waitForTimeout(150); await swipe([206, 560], [320, 520], 120); }
    let ok = false; for (let i = 0; i < 120 && !ok; i++) { await p.waitForTimeout(400); ok = await p.evaluate(() => { const n = document.querySelector('[data-sp="next"]'); if (n && n.offsetParent) { n.click(); return true; } return false; }); }
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => window.RES);
    if (!ok || !res || typeof res.scored !== "boolean") fail.push(mode + ": sin resultado " + JSON.stringify(res));
    if (await p.$(".spo")) fail.push(mode + ": no se cierra");
  }
  /* 3) partida real: tarjeta de balón parado, hoja con pestañas y ajustes */
  const click = async (s) => { const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(90); return true; };
  await p.reload(); await p.waitForTimeout(300);
  await click('[data-a="setlang"][data-v="es"]'); await click('[data-a="newgame"]'); await click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Falta");
  for (let i = 0; i < 3; i++) await click('[data-a="cnext"]');
  await click('[data-a="cclub"]'); await click('[data-a="cnext"]');
  for (let i = 0; i < 6; i++) { if (!(await click('[data-a="objok"]')) && !(await click('.sheet [data-a="choose"]'))) break; }
  await click('[data-a="tab"][data-t="jugador"]');
  if (!(await click('.spcard'))) fail.push("sin tarjeta de balón parado");
  for (const tb of ["ch", "hist", "set", "train"]) { if (!(await click(`[data-a="sptab"][data-v="${tb}"]`))) fail.push("pestaña " + tb); }
  await click('[data-a="sptab"][data-v="set"]'); await click('[data-a="sppref"][data-v="ctrl:adv"]');
  const pref = await p.evaluate(() => SpModes.prefs().ctrl); if (pref !== "adv") fail.push("ajuste de control");
  await click('[data-a="sppref"][data-v="ctrl:classic"]'); await click('[data-a="sptab"][data-v="train"]');
  await click('[data-a="sptrain"][data-v="pen"]'); await p.waitForTimeout(1200);
  if (!(await p.$(".mg-ov .sp3-cv"))) fail.push("el penalti clásico no abre en 3D");
  console.log(fail.length ? "FALLOS:\n" + fail.join("\n") : "sp56 OK", errs.length ? "\nERRORES:\n" + errs.slice(0, 8).join("\n") : "");
  await b.close(); process.exit(fail.length || errs.length ? 1 : 0);
})();
