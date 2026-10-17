/* Recorre las pantallas en cada idioma, guarda capturas y busca restos de castellano en el texto visible.
   Uso: node test/langqa.js [carpeta] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/langqa";
fs.mkdirSync(OUT, { recursive: true });
const ES_WORDS = /\b(años|temporada|partidos?|jugador(es)?|entrenador|plantilla|fichaje|directiva|afición|semanas?|goles|victorias|Siguiente|Atrás|Cerrar|Guardar|Elige|Nueva|Cargar|Liga de|Copa de|del|también|está|tienes|puedes|vuestro|nuestro)\b/;
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(250);
  const clickIf = async (sel) => { await p.evaluate(() => { if (window.S) { S.noLiveAuto = true; if (S.m) { S.m.xp = S.m.xp || {}; S.m.xp.live = 0; } } const lv = document.getElementById("live"); if (lv) { const b = lv.querySelector('[data-a="lsim"]') || lv.querySelector('[data-a="lvclose"]'); if (b) b.click(); } }); const e = await p.$(sel); if (e) { await e.click(); await p.waitForTimeout(70); return true; } return false; };
  const found = {};
  const scan = async (lang, label) => {
    const txt = await p.evaluate(() => document.body.innerText);
    txt.split("\n").forEach(l => { const m = ES_WORDS.exec(l); if (m && lang !== "es") { const k = lang + "|" + l.trim().slice(0, 110); if (!found[k]) found[k] = label; } });
    const o = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (o) errs.push(lang + ": desbordamiento en " + label);
  };
  const shot = async (n) => p.screenshot({ path: path.join(OUT, n + ".png") });
  await p.click('[data-a="setlang"][data-v="es"]');
  /* crear una partida de cada modo en castellano */
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Ana"); await p.fill("#ln", "Prueba"); for (let i = 0; i < 3; i++) await p.click('[data-a="cnext"]');
  await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await clickIf('[data-a="objok"]');
  for (let k = 0; k < 40; k++) { if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; }
  const langs = ["en", "de", "it", "fr"];
  for (const l of langs) {
    await p.click('[data-a="menu"]'); await p.click('[data-a="setlang"][data-v="' + l + '"]'); await p.click('.sheet [data-a="close"]');
    for (const t of ["carrera", "jugador", "comp", "hist", "mundo"]) { await clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await scan(l, "jugador/" + t); if (t === "carrera" || t === "jugador") await shot(l + "-jugador-" + t); }
    for (let k = 0; k < 8; k++) { if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; }
    await clickIf('nav [data-a="tab"][data-t="carrera"]'); await scan(l, "jugador/carrera2"); await shot(l + "-carrera2");
    await p.click('[data-a="menu"]'); await scan(l, "menú"); await p.click('[data-a="home"]'); await scan(l, "portada"); await shot(l + "-portada");
    await p.click('[data-a="newgame"]'); await scan(l, "modos"); await shot(l + "-modos");
    await p.click('[data-a="pickmode"][data-v="mgr"]'); await scan(l, "crear míster");
    await p.fill("#fn", "Pep"); await p.fill("#ln", "Test"); await p.click('[data-a="cnext"]'); await scan(l, "dificultad"); await p.click('[data-a="cnext"]');
    await p.click('[data-a="cclub"]'); await scan(l, "elegir club"); await p.click('[data-a="cnext"]');
    for (let k = 0; k < 4; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
    for (const t of ["club", "plantilla", "mercado", "comp", "hist"]) { await clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await scan(l, "míster/" + t); await shot(l + "-mister-" + t); }
    const pl = await p.$('.prow[data-a="pl"]'); if (pl) { await pl.click(); await p.waitForTimeout(80); await scan(l, "ficha"); await shot(l + "-ficha"); await clickIf('.sheet [data-a="close"]'); }
    for (let k = 0; k < 30; k++) { if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; }
    await clickIf('nav [data-a="tab"][data-t="club"]'); await scan(l, "míster/club2"); await shot(l + "-mister-club2");
    await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="club"]');
    await p.fill("#cn", "FC Test"); await scan(l, "crear club"); await p.click('[data-a="cnext"]'); await scan(l, "club liga"); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]');
    await p.fill("#fn", "A"); await p.fill("#ln", "B"); await p.click('[data-a="cnext"]'); await scan(l, "borrador"); await shot(l + "-borrador");
    await p.click('[data-a="startclub"]'); await scan(l, "club juego");
    /* volver a la carrera de jugador para el siguiente idioma */
    await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="goload"]'); await p.waitForTimeout(100); await scan(l, "cargar"); await shot(l + "-cargar");
    const ids = await p.$$eval('[data-a="loadslot"]', x => x.map(e => e.getAttribute("data-v")));
    await p.click('[data-a="loadslot"][data-v="' + ids[ids.length - 1] + '"]'); await p.waitForTimeout(200);
  }
  const rows = Object.keys(found);
  console.log("Líneas con posible castellano:", rows.length);
  rows.slice(0, 120).forEach(k => console.log(" ", k, "  ←", found[k]));
  console.log("ERRORES:", errs.length ? errs.join("\n") : "ninguno");
  await b.close();
})();
