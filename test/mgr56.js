/* 5.6 zona del míster: retrato, estadísticas, ropa, efectos y míster vóxel en el directo. Uso: node test/mgr56.js [carpeta] */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/mgr56"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [], fail = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.evaluate(() => localStorage.setItem("camino.pitch3d", "1")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a);
  const c = async s => { const ok = await js(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, s); await p.waitForTimeout(120); return ok; };
  await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Voxel"); await c('[data-a="cnext"]');
  await c('[data-a="cset"][data-k="ev"][data-v="2"]'); await c('[data-a="cnext"]'); await c('[data-a="cclub"]'); await c('[data-a="cnext"]');
  await p.waitForTimeout(400);
  const st = await js(() => ({ mode: S.mode, stats: GXM.stats(), gear: GXI.gear("m").eq }));
  console.log("míster", JSON.stringify(st)); if (!st.stats || !st.gear.suit) fail.push("estadísticas o traje");
  /* efecto en el nivel */
  const fx = await js(() => { const b0 = mBuffs(); const g = GXI.gear("m"); ["m_gl_tac", "m_nb_tab", "m_wa_cls", "m_coat_long"].forEach(id => GXI.give(id, 3, "m")); ["m_gl_tac", "m_nb_tab", "m_wa_cls", "m_coat_long"].forEach(id => GXI.equip(id, "m")); return { b0, b1: mBuffs(), st: GXM.stats() }; });
  console.log("nivel por táctica", JSON.stringify(fx)); if (!(fx.b1 > fx.b0)) fail.push("la ropa no suma");
  await js(() => { UIX.ui().tab = "yo"; UIX.render(false); window.scrollTo(0, 0); }); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(OUT, "01-yo.png") });
  const yo = await js(() => ({ rows: document.querySelectorAll(".myo-r").length, fig: document.querySelectorAll(".myo-fig img").length, gear: !!document.querySelector(".gcard"), vit: !!document.querySelector(".gxv"), pet: !!document.querySelector(".petcta,.petcard") }));
  console.log("zona", JSON.stringify(yo)); if (yo.rows !== 8 || yo.fig !== 3) fail.push("zona");
  await js(() => { window.scrollTo(0, 700); }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, "02-yo-abajo.png") });
  await js(() => { UIX.ui().gr = { w: "m", s: "suit", tab: "eq" }; UIX.open("gear"); }); await p.waitForTimeout(800); await p.screenshot({ path: path.join(OUT, "03-ropa.png") });
  await c('[data-a="close"]');
  /* decisión de míster en datos */
  const mev = await js(() => { S.pend.unshift({ k: "mev", id: "gxm_pizarra", s: 3 }); S.ph = "gap"; S.pend = S.pend.filter(x => x.k !== "jobs"); UIX.ui().tab = "club"; UIX.render(false); const d = document.querySelector(".decision"); return { sc: !!(d && d.querySelector(".gxsc img")), chips: d ? d.querySelectorAll(".chip,.pct").length : -1 }; });
  console.log("decisión míster", JSON.stringify(mev)); if (!mev.sc || !mev.chips) fail.push("decisión míster");
  await p.waitForTimeout(900); await js(() => { const d = document.querySelector(".decision"); if (d) d.scrollIntoView(); }); await p.screenshot({ path: path.join(OUT, "05-decision.png") });
  await c('.decision .opt[data-i="1"]'); await p.waitForTimeout(400);
  console.log("tras elegir", await js(() => JSON.stringify({ chips: (S.feed[0].chips || []).length, pct: S.feed[0].pct })));
  /* al directo */
  await js(() => { UIX.ui().tab = "club"; UIX.render(false); });
  let live = false;
  for (let k = 0; k < 160 && !live; k++) {
    if (await p.$("#live")) { live = true; break; }
    if (await c('[data-a="drawspeed"][data-v="skip"]')) { await c('[data-a="drawclose"]'); continue; }
    const t = await js(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(t)) { await c('.sheet [data-a="choose"][data-i="0"]'); continue; }
    if (await c('[data-a="objok"]')) continue; if (await c('.sheet [data-a="choose"]')) continue; if (await c('[data-a="choose"]')) continue;
    if (!(await c('[data-a="advance"]'))) break;
  }
  console.log("directo", live);
  if (live) {
    await p.waitForTimeout(3000); await js(() => { const b = [...document.querySelectorAll("button")].find(x => /^Cara$/.test(x.textContent.trim())); if (b) b.click(); });
    for (let i = 0; i < 4; i++) { await p.waitForTimeout(5000); await p.screenshot({ path: path.join(OUT, "04-directo" + i + ".png") }); }
    const co = await js(() => { const d = Pitch.debug && Pitch.debug(); return d && d.coach; }); console.log("míster en el 3D", JSON.stringify(co)); if (!co) fail.push("míster vóxel");
  }
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "mgr56 OK"); console.log(errs.length ? "ERRORES:\n" + errs.slice(0, 5).join("\n") : "SIN ERRORES");
  await b.close();
})();
