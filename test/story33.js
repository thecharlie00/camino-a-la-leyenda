/* 3.3: tu gente en el vestuario, despedida de leyenda y relaciones del míster.
   Uso: node test/story33.js [carpeta de capturas] */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/shots33";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html"));
  await p.waitForTimeout(300);
  const shot = n => p.screenshot({ path: path.join(OUT, n + ".png") });
  const ov = async () => { await p.evaluate(() => { const w = document.getElementById("ntfs"); if (w) w.remove(); document.querySelectorAll("[data-a='lvclose'],[data-a='trclose'],[data-a='drawclose']").forEach(x => x.click()); }); await p.waitForTimeout(80); };
  const clickIf = async (s) => { await ov(); const e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { return false; } await p.waitForTimeout(80); return true; };
  const goTab = async (t) => { if (await p.$('nav [data-a="tab"][data-t="' + t + '"]')) return clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await clickIf('nav [data-a="tab"][data-t="mas"]'); return clickIf('.mrow[data-t="' + t + '"]'); };
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; } for (let j = 0; j < 8 && (await p.$('.sheet')); j++) { if (await clickIf('.sheet [data-a="choose"]')) continue; await clickIf('.sheet [data-a="close"]'); } };
  await clickIf('[data-a="setlang"][data-v="es"]');
  /* jugador: despedida de leyenda */
  await clickIf('[data-a="newgame"]'); await clickIf('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Leyenda");
  for (let i = 0; i < 3; i++) await clickIf('[data-a="cnext"]');
  await clickIf('[data-a="cclub"]'); await clickIf('[data-a="cnext"]'); await clickIf('[data-a="objok"]');
  await p.evaluate(() => { S.p.flags.bff = {n: "Iker Amigo", c: S.p.club}; S.p.flags.feud = {n: "Raúl Pique", c: S.p.club}; UIX.render(false); });
  await goTab("jugador");
  notes.push("tu gente: " + await p.evaluate(() => (document.body.textContent.match(/Tu mejor amigo en el equipo: [^.]+/) || ["—"])[0]));
  await p.evaluate(() => { const r = S.p.seasons; for (let i = 0; i < 10; i++) r.push({y: S.yr - 10 + i, club: S.p.club, clubs: [S.p.club], lg: S.cl[S.p.club], pos: 3, apps: 30, st: 25, min: 2000, g: 8, a: 4, cs: 0, rt: 7, ovr0: 70, ovr1: 72, age: 20 + i, caps: 0, ig: 0, tro: [], aw: []}); S.pend = []; retire(); UIX.ui().tab = "carrera"; UIX.render(true); });
  notes.push("despedida: " + await p.evaluate(() => !!document.querySelector(".farewell")));
  await shot("01-despedida");
  await clickIf('[data-a="farewell"][data-v="humor"]');
  notes.push("discurso: " + await p.evaluate(() => (document.querySelector(".fwq") || {}).textContent));
  await shot("02-discurso");
  /* míster: relaciones */
  await p.evaluate(() => { localStorage.removeItem("camino.active"); });
  await clickIf('[data-a="startmgr"]');
  for (let k = 0; k < 8; k++) { if (!(await clickIf('.sheet [data-a="choose"]'))) break; }
  await p.evaluate(() => { if (S.m && S.m.club >= 0) { relAdd(S.m.xi[1], S.m.xi[2], "f"); relAdd(S.m.xi[3], S.m.xi[4], "e"); } UIX.render(false); });
  await goTab("plantilla");
  notes.push("relaciones: " + await p.evaluate(() => S.m && S.m.club >= 0 ? (relOf().length + " · bonus " + relBonus(S.m.xi)) : "sin club"));
  console.log(notes.join("\n"));
  console.log(errs.length ? "ERRORES:\n" + errs.join("\n") : "SIN ERRORES");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
