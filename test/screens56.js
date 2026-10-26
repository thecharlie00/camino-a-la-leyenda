/* 5.6: recorrido de pantallas en un móvil pequeño (360 px) para revisar la tipografía nueva.
   Hace capturas y detecta texto recortado (desborda su caja sin puntos suspensivos) y
   desbordamiento horizontal. Uso: node test/screens56.js [carpeta] [lang] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots56";
const LANG = process.argv[3] || "es";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], clips = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(400);
  const c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(160); return true; };
  /* texto que no cabe: hojas con overflow oculto y sin elipsis, o que se salen de la pantalla */
  const check = async label => {
    const r = await p.evaluate(() => {
      const out = [], W = window.innerWidth;
      if (document.documentElement.scrollWidth > W + 1) out.push("scroll horizontal de página");
      document.querySelectorAll("body *").forEach(el => {
        if (!el.offsetParent && getComputedStyle(el).position !== "fixed") return;
        if (el.closest("svg, canvas, .mg-ov svg, [aria-hidden=true]")) return;
        const t = (el.childNodes.length && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim() : "";
        if (!t) return;
        const cs = getComputedStyle(el), rc = el.getBoundingClientRect();
        if (rc.width === 0) return;
        const hidden = cs.overflowX === "hidden" || cs.overflow === "hidden" || cs.overflowX === "clip";
        if (hidden && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== "ellipsis") out.push("recorte: «" + t.slice(0, 40) + "» (" + el.className + ")");
        if (rc.right > W + 2 && cs.position !== "absolute" && !el.closest("[style*=overflow], .hscroll, .seg, .tabs2, .chips, .scrollx, table, .tbl")) out.push("se sale: «" + t.slice(0, 40) + "» (" + el.className + ")");
        const fs = parseFloat(cs.fontSize);
        if (fs < 11 && !el.closest(".crest")) out.push("letra " + fs + "px: «" + t.slice(0, 30) + "» (" + el.className + ")");
      });
      return Array.from(new Set(out)).slice(0, 12);
    });
    r.forEach(x => clips.push(label + " → " + x));
  };
  const shot = async (n, full) => {
    await p.waitForTimeout(350);
    await check(n);
    await p.screenshot({ path: path.join(OUT, n + ".png"), fullPage: !!full });
  };
  const sheetShot = async n => {
    await p.waitForTimeout(350); await check(n);
    const pn = await p.$(".sheet .panel");
    if (pn) { await pn.screenshot({ path: path.join(OUT, n + ".png") }); } else await p.screenshot({ path: path.join(OUT, n + ".png") });
  };
  await p.evaluate(l => { window.TAP_GAP = 0; const b = document.querySelector('[data-a="setlang"][data-v="' + l + '"]'); if (b) b.click(); }, LANG);
  await shot("01-portada");
  /* jugador */
  await p.evaluate(() => {
    buildWorld("m");
    newCareer({fn: "Álex", ln: "Fernández-Villalobos", nat: "ES", pos: "MC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 56});
    S.pend = []; S.ntf = []; UIX.ui().view = "game"; UIX.ui().tab = "carrera"; UIX.render(true);
  });
  await p.waitForTimeout(300);
  await shot("02-carrera", true);
  for (let k = 0; k < 30; k++) { if (!(await c('[data-a="choose"]'))) await c('[data-a="advance"]'); }
  await p.evaluate(() => { document.querySelectorAll(".ntf").forEach(n => n.remove()); });
  await shot("03-carrera-avanzada", true);
  await c('nav [data-a="tab"][data-t="jugador"]'); await shot("04-yo", true);
  await c('nav [data-a="tab"][data-t="comp"]'); await shot("05-liga", true);
  await c('nav [data-a="tab"][data-t="mas"]'); await shot("06-mas", true);
  /* hojas del jugador */
  await p.evaluate(() => { petAdopt("dog", "Toby"); UIX.ui().tab = "jugador"; UIX.render(true); });
  await c('[data-a="petopen"]'); await sheetShot("07-mascota"); await p.evaluate(() => UIX.closeSheet && UIX.closeSheet());
  /* partido en directo (2D) */
  await p.evaluate(() => { UIX.ui().tab = "carrera"; UIX.render(true); });
  for (let k = 0; k < 60; k++) {
    const m = await p.$("#pitch, .pitchwrap, .lpitch");
    if (m) break;
    if (!(await c('[data-a="choose"]'))) await c('[data-a="advance"]');
  }
  await p.waitForTimeout(1500); await shot("08-partido");
  await p.evaluate(() => { const s = document.querySelector('[data-a="skipmatch"], [data-a="lskip"], [data-a="endlive"]'); if (s) s.click(); });
  await p.waitForTimeout(500);
  /* minijuegos */
  await p.evaluate(() => { Minigame.penalty({skill: 78, gk: 72, pressure: 0.5, rand: Math.random}, function () {}); });
  await p.waitForTimeout(600); await shot("09-penalti");
  await p.evaluate(() => document.querySelectorAll(".mg-ov").forEach(n => n.remove()));
  await p.evaluate(() => { Minigame.freekick({skill: 80, gk: 70, dist: 22, rand: Math.random}, function () {}); });
  await p.waitForTimeout(600); await shot("10-falta");
  await p.evaluate(() => document.querySelectorAll(".mg-ov").forEach(n => n.remove()));
  /* entrenador */
  await p.evaluate(() => {
    buildWorld("m");
    newManagerCareer({fn: "Pep", ln: "Guardiolo", nat: "ES", age: 44, diff: 0, ev: 1, club: W.clubs.findIndex(c => c.lg0 === 0), seed: 56});
    S.pend = []; S.ntf = []; UIX.ui().view = "game"; UIX.ui().tab = "club"; UIX.render(true);
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => { document.querySelectorAll(".ntf").forEach(n => n.remove()); });
  await shot("11-club", true);
  for (const t of ["plantilla", "mercado", "comp", "mas"]) { if (await c('nav [data-a="tab"][data-t="' + t + '"]')) await shot("12-m-" + t, true); }
  await p.evaluate(() => { for (let k = 0; k < 400 && S.m.wk < 6; k++) { cleanPend(); if (S.pend.length) resolvePending(0); else advance(); } UIX.ui().tab = "club"; UIX.render(true); document.querySelectorAll(".ntf").forEach(n => n.remove()); });
  await shot("13-m-temporada", true);
  /* ajustes */
  await c('[data-a="menu"]'); await shot("14-menu");
  console.log(clips.join("\n"));
  console.log(errs.length ? "ERRORES: " + errs.join(" | ") : "SIN ERRORES");
  await b.close();
})();
