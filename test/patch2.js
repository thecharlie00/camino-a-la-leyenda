/* Parche 2.0: objetivos, red social, rueda de prensa, partido en directo, escudos, porteros y motes. */
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const OUT = process.argv[2] || "/tmp/p2"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  const errs = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(300);
  const ov = async () => { for (let i = 0; i < 12; i++) { const st = await p.evaluate(() => { const lv = document.getElementById('live'); if (lv && !window.__keepLive) { const sm = lv.querySelector('[data-a="lsim"]'); if (sm) { sm.click(); return 2; } const en = lv.querySelector('[data-a="lend"]'); if (en) { en.click(); return 1; } } const t = document.querySelector('[data-a="troclose"]'); if (t) { t.click(); return 1; } const d = document.querySelector('.drw'); if (!d) return 0; const x = d.querySelector('[data-a="drawclose"]'); if (x) { x.click(); return 1; } const s = d.querySelector('[data-a="drawspeed"][data-v="skip"]'); if (s) s.click(); return 2; }); if (!st) return; await p.waitForTimeout(st === 2 ? 450 : 320); } };
  const clickIf = async (s) => { await ov(); let e = await p.$(s); if (!e) return false; try { await e.click({ timeout: 4000 }); } catch (er) { await ov(); e = await p.$(s); if (!e) return false; await e.click({ timeout: 8000 }); } await p.waitForTimeout(60); return true; };
  const goTab = async (t) => { if (await p.$('nav [data-a="tab"][data-t="' + t + '"]')) return clickIf('nav [data-a="tab"][data-t="' + t + '"]'); await clickIf('nav [data-a="tab"][data-t="mas"]'); return clickIf('.mrow[data-t="' + t + '"]'); };
  const shot = (n) => p.screenshot({ path: OUT + "/" + n + ".png" });
  const drain = async (n) => { for (let k = 0; k < n; k++) { if (await clickIf('[data-a=\"drawclose\"]')) continue; if (await clickIf('.ss-skip, [data-a=\"sskip\"]')) continue; if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break; } for (let j = 0; j < 8 && (await p.$('.sheet')); j++) { if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="drawclose"]')) continue; await clickIf('.sheet [data-a="close"]'); } };
  await p.click('[data-a="setlang"][data-v="es"]');
  /* 1. portero: objetivos, estadísticas y red social */
  await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Iker"); await p.fill("#ln", "Prueba");
  
  await p.evaluate(() => { const b = document.querySelector('[data-a="cset"][data-k="pos"][data-v="POR"]'); if (b) b.click(); });
  await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]');
  notes.push("talento: " + (await p.$$eval('[data-k="talent"] small', l => l.map(x => x.textContent))).join(" | "));
  await p.click('[data-a="cnext"]'); await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  notes.push("pos=" + await p.evaluate(() => S.p.pos));
  for (let k = 0; k < 6 && !(await p.$('[data-a="objsel"]')); k++) { if (!(await clickIf('[data-a="choose"]'))) break; }
  const hasObj = !!(await p.$('[data-a="objsel"]'));
  notes.push("objetivos: " + hasObj + " " + (await p.$$eval(".objopt", l => l.map(x => x.textContent.trim()))).slice(0, 6).join(" | "));
  await shot("01-objetivos");
  if (hasObj) { await p.click('.objcat:nth-of-type(1) [data-a="objsel"][data-i="2"]').catch(() => {}); await p.click('[data-a="objok"]'); }
  notes.push("objs elegidos: " + await p.evaluate(() => S.p.objs.map(o => o.n + " (" + objLabel(o) + ")").join(" · ")));
  /* rueda de prensa forzada */
  await p.evaluate(() => { const ctx = ["controversy", "loss"]; S.pend.unshift({k: "ppress", ctx: ctx, qs: pressPick(false, ctx.concat(["any"])), tp: pressParams(), s: 1}); });
  await goTab('carrera');
  await shot("02-prensa-ir");
  await p.click('[data-a="choose"][data-i="0"]');
  await shot("03-prensa-pregunta");
  for (let q = 0; q < 3; q++) await clickIf('[data-a="choose"][data-i="' + (q % 4) + '"]');
  notes.push("prensa feed: " + await p.evaluate(() => S.feed.slice(0, 3).map(c => c.cat).join(", ")));
  await drain(140);
  await p.evaluate(() => { S.p.fame = 60; maybeNickPlayer(); });
  notes.push("mote: " + await p.evaluate(() => nickName(S.p)) + " · temporadas " + await p.evaluate(() => S.p.seasons.length) + " · última fila: " + await p.evaluate(() => { const r = S.p.seasons[S.p.seasons.length - 1]; return r ? "PC " + r.cs + " GE " + r.gc : "—"; }));
  notes.push("premios: " + await p.evaluate(() => S.p.awards.map(a => awardName(a)).join(" | ")));
  await goTab('hist'); await shot("04-historial");
  await goTab('red'); await shot("05-red");
  notes.push("posts: " + await p.evaluate(() => S.soc.posts.length) + " · ej.: " + (await p.$$eval(".stext", l => l.slice(0, 3).map(x => x.textContent))).join(" ‖ "));
  await p.click('[data-a="socedit"]'); await p.fill("#sbio", "Portero. Muro. Leyenda."); await p.click('[data-a="socav"][data-v="🧤"]'); await p.click('[data-a="socsave"]');
  notes.push("perfil: " + await p.evaluate(() => JSON.stringify(S.soc.prof)));
  /* 2. míster intenso: partido en directo */
  await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="mgr"]');
  await p.fill("#fn", "Pep"); await p.fill("#ln", "Directo"); await p.click('[data-a="cnext"]');
  await p.click('[data-a="cset"][data-k="ev"][data-v="2"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cclub"]'); await p.click('[data-a="cnext"]'); await p.waitForTimeout(200);
  let live = false;
  for (let k = 0; k < 60 && !live; k++) {
    const vb = await p.$$('.sheet [data-a="choose"]');
    const txt = await p.evaluate(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(txt)) { await p.click('.sheet [data-a="choose"][data-i="0"]'); await p.waitForTimeout(300); live = !!(await p.$("#live")); break; }
    if (await clickIf('[data-a="objok"]')) continue; if (await clickIf('.sheet [data-a="choose"]')) continue; if (await clickIf('[data-a="choose"]')) continue; if (!(await clickIf('[data-a="advance"]'))) break;
  }
  notes.push("directo abierto: " + live);
  await p.evaluate(() => { window.__keepLive = true; });
  if (live) {
    await p.waitForTimeout(1500); await p.evaluate(() => { const e = document.querySelector('[data-a="ltac"][data-k="line"][data-v="2"]'); if (e) e.click(); }); notes.push("táctica: " + await p.evaluate(() => JSON.stringify(S.live && S.live.tac))); await p.evaluate(() => { const c = document.getElementById("lvctl"); if (c) c.scrollIntoView(); }); await shot("06-directo");
    await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.click(); }, '[data-a="lment"][data-v="2"]');
    await p.evaluate(() => { const e = document.querySelector('[data-a="lout"]'); if (e) e.click(); }); await p.waitForTimeout(120); await p.evaluate(() => { const e = document.querySelector('[data-a="lin"]'); if (e) e.click(); }); await p.waitForTimeout(120); await shot("06b-cambio-previa"); await p.evaluate(() => { const e = document.querySelector('[data-a="lsubok"]'); if (e) e.click(); });
    await p.selectOption("#lform", "4-4-2").catch(() => {});
    await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.click(); }, '[data-a="lspeed"][data-v="3"]'); await p.waitForTimeout(1200);
    await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.click(); }, '[data-a="lsim"]'); await p.waitForTimeout(200); await shot("07-directo-final");
    const sc = await p.evaluate(() => S.live ? S.live.gu + "-" + S.live.gt + " cambios " + S.live.subs.length + " ment " + S.live.ment + " " + S.live.form : "sin live");
    await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.click(); }, '[data-a="lend"]'); await p.waitForTimeout(200);
    notes.push("directo: " + sc + " · fixture: " + await p.evaluate(() => { const f = S.cur && S.cur.pm.find(x => x.liveDone); return f ? f.gu + "-" + f.gt + " st " + f.st : "?"; }));
    await p.evaluate(() => { S.noLiveAuto = true; window.__keepLive = false; });
    await drain(30);
  }
  notes.push("mgr objs: " + await p.evaluate(() => S.m.objs.map(o => o.n + " (" + objLabel(o) + ")").join(" · ")));
  await goTab('red'); await shot("08-red-mister");
  /* 3. club propio con escudo y equipación */
  await p.click('[data-a="menu"]'); await p.click('[data-a="home"]'); await p.click('[data-a="newgame"]'); await p.click('[data-a="pickmode"][data-v="club"]');
  await p.fill("#cn", "Atlètic Prova"); await p.click('[data-a="ccrest"][data-k="shape"][data-v="round"]'); await p.click('[data-a="ccrest"][data-k="pat"][data-v="stripes"]'); await p.click('[data-a="ckit"][data-v="hoops"]');
  await shot("09-club-escudo");
  await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.click('[data-a="cnext"]'); await p.fill("#fn", "Dueño"); await p.fill("#ln", "Prueba"); await p.click('[data-a="cnext"]'); await p.waitForTimeout(400);
  notes.push("custom: " + await p.evaluate(() => JSON.stringify({crest: S.custom.crest, kit: S.custom.kit, cs: W.clubs[S.custom.id].cs})));
  await clickIf('[data-a="startclub"]'); await drain(40);
  await goTab('comp'); await shot("10-tabla-escudos");
  console.log(notes.join("\n")); console.log(errs.length ? "ERRORES:\n" + errs.slice(0, 10).join("\n") : "ERRORES: ninguno");
  await b.close();
})();
