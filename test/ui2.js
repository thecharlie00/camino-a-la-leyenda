/* Capturas de casos concretos: tanda del jugador, planteamiento, quinto penalti, oferta recibida, buscar banquillo, verano del míster. */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots2";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__seen = {}; });
  const shot = async (n) => { await p.evaluate(() => { const m = document.getElementById("main"); if (m) m.scrollTop = 0; }); await p.screenshot({ path: path.join(OUT, n + ".png") }); };
  const rer = async (t) => { await p.click('[data-a="tab"][data-t="' + t + '"]'); await p.waitForTimeout(100); };
  const overflow = async (label) => { const o = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (o) errs.push("desbordamiento horizontal en " + label); };
  await p.click('[data-a="newcareer"]'); await p.fill("#fn", "Test"); await p.fill("#ln", "Dos");
  for (let i = 0; i < 4; i++) await p.click('[data-a="cnext"]');
  // avanzar con el motor hasta una tanda de penaltis del jugador
  const gotSo = await p.evaluate(() => {
    for (let k = 0; k < 30000; k++) {
      cleanPend();
      if (S.pend.length) { const x = S.pend[0]; if (x.k === "so") return true; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") ch = playerDesc(x).opts.length - 1; resolvePending(ch); }
      else { if (S.ph === "ret") return false; advance(); }
    }
    return false;
  });
  await rer("carrera"); if (gotSo) { await shot("a_tanda_jugador"); await overflow("tanda"); }
  // terminar la carrera y pasar a entrenador
  await p.evaluate(() => { let k = 0; while (S.ph !== "ret" && k++ < 80000) { cleanPend(); if (S.pend.length) { const x = S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") ch = playerDesc(x).opts.length - 1; resolvePending(ch); } else advance(); } });
  await rer("carrera");
  await p.click('[data-a="startmgr"]'); await p.waitForTimeout(150);
  await p.click('[data-a="jobpick"]'); await p.waitForTimeout(150);
  await shot("b_buscar_banquillo"); await overflow("buscar banquillo");
  await p.click('.sheet [data-a="close"]'); await p.waitForTimeout(100);
  await p.click('[data-a="choose"][data-i="0"]'); await p.waitForTimeout(150);
  // oferta recibida inventada para la captura
  await p.evaluate(() => { const pl = S.m.sq.slice().sort((a, b) => b.ovr - a.ovr)[0]; S.pend.unshift(mp("inoffer", {pid: pl.id, club: mgrBuyers(pl, "t")[0].club, fee: pValue(pl) * 1.1})); });
  await rer("club"); await shot("c_oferta_recibida"); await overflow("oferta recibida");
  const seen = {};
  for (let round = 0; round < 400; round++) {
    const k = await p.evaluate(() => {
      for (let n = 0; n < 4000; n++) {
        cleanPend();
        if (S.pend.length) { const x = S.pend[0]; if ((x.k === "mplan" || x.k === "mso" || x.k === "mev") && !window.__seen[x.k + (x.id || "")]) { window.__seen[x.k + (x.id || "")] = 1; return x.k + (x.id ? ":" + x.id : ""); } resolvePending(x.k === "jobs" ? 0 : 0); }
        else { if (S.ph === "ret") return "ret"; if (S.m.seasons.length >= 3 && S.ph === "off") return "fin"; advance(); }
      }
      return "nada";
    }).catch(e => "err " + e.message);
    if (k === "fin" || k === "ret" || k === "nada" || k.startsWith("err")) { if (k.startsWith("err")) errs.push(k); break; }
    if (!seen[k]) { seen[k] = 1; await rer("club"); const nm = k.replace(/[^a-z_:]/gi, "").replace(":", "_"); if (["mplan", "mso"].indexOf(k) >= 0 || Object.keys(seen).length <= 8) { await shot("d_" + nm); await overflow(k); } }
  }
  await p.evaluate(() => { window.__seen = window.__seen || {}; });
  // verano del míster
  await rer("club"); await shot("e_club_final");
  console.log("vistos:", Object.keys(seen).join(", "));
  console.log("errores:", errs.length ? errs : "ninguno");
  await b.close();
})();
