/* Capturas del juego para la web (web/img/shot-*.webp) y la imagen para redes (web/img/og.png).
   Uso: python3 build.py && NODE_PATH=/opt/node-tools/node_modules node tools/web_shots.js */
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const ROOT = path.join(__dirname, ".."), IMG = path.join(ROOT, "web/img"), TMP = path.join(ROOT, "work/webshots");
fs.mkdirSync(TMP, { recursive: true });
const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const page = async () => {
    const ctx = await b.newContext({ viewport: { width: 412, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto("file://" + path.join(ROOT, "dist/index.html")); await p.waitForTimeout(300);
    p.c = async s => { const e = await p.$(s); if (!e) return false; await e.evaluate(x => x.click()); await p.waitForTimeout(90); return true; };
    p.clean = () => p.evaluate(() => { S.ntf = []; const n = document.getElementById("ntfs"); if (n) n.innerHTML = ""; });
    await p.c('[data-a="setlang"][data-v="es"]');
    return p;
  };
  const shot = async (p, name) => { await p.clean(); await p.waitForTimeout(350); await p.screenshot({ path: path.join(TMP, name + ".png") }); };

  /* 1 · míster: partido en directo y plantilla */
  const m = await page();
  await m.c('[data-a="newgame"]'); await m.c('[data-a="pickmode"][data-v="mgr"]');
  await m.fill("#fn", "Álex"); await m.fill("#ln", "Montero"); await m.c('[data-a="cnext"]');
  await m.c('[data-a="cset"][data-k="ev"][data-v="2"]'); await m.c('[data-a="cnext"]'); await m.c('[data-a="cclub"]'); await m.c('[data-a="cnext"]');
  for (let i = 0; i < 6; i++) { if (!(await m.c('[data-a="objok"]')) && !(await m.c('.sheet [data-a="choose"]'))) break; }
  await m.evaluate(() => { UIX.closeSheet && UIX.closeSheet(); UIX.ui().tab = "plantilla"; UIX.render(true); window.scrollTo(0, 0); });
  await shot(m, "plantilla");
  await m.evaluate(() => { UIX.ui().tab = "club"; UIX.render(true); });
  let live = false;
  for (let k = 0; k < 160 && !live; k++) {
    if (await m.$("#live")) { live = true; break; }
    if (await m.c('[data-a="drawspeed"][data-v="skip"]')) { await m.c('[data-a="drawclose"]'); continue; }
    const t = await m.evaluate(() => (document.querySelector(".sheet h3") || {}).textContent || "");
    if (/Ves el partido/.test(t)) { await m.c('.sheet [data-a="choose"][data-i="0"]'); continue; }
    if (await m.c('[data-a="objok"]')) continue; if (await m.c('.sheet [data-a="choose"]')) continue; if (await m.c('[data-a="choose"]')) continue;
    if (!(await m.c('[data-a="advance"]'))) break;
  }
  if (live) {
    await m.c('[data-a="lspeed"][data-v="2"]');
    await m.waitForTimeout(9000);
    await m.evaluate(() => window.scrollTo(0, 0));
    await shot(m, "directo");
  } else console.log("AVISO: no se llegó al directo");

  /* 2 · jugador: carrera y mascota */
  const j = await page();
  await j.c('[data-a="newgame"]'); await j.c('[data-a="pickmode"][data-v="p"]');
  await j.fill("#fn", "Dani"); await j.fill("#ln", "Román"); for (let i = 0; i < 3; i++) await j.c('[data-a="cnext"]');
  await j.c('[data-a="cclub"]'); await j.c('[data-a="cnext"]'); await j.c('[data-a="objok"]');
  for (let k = 0; k < 26; k++) { if (await j.c('[data-a="drawspeed"][data-v="skip"]')) { await j.c('[data-a="drawclose"]'); continue; } if (await j.c('[data-a="choose"]')) continue; if (!(await j.c('[data-a="advance"]'))) break; }
  for (let k = 0; k < 4 && (await j.$(".sheet")); k++) { if (!(await j.c('.sheet [data-a="choose"]'))) await j.evaluate(() => UIX.closeSheet()); }
  await j.evaluate(() => { UIX.ui().tab = "carrera"; UIX.render(true); window.scrollTo(0, 0); });
  await shot(j, "carrera");
  await j.evaluate(() => { S.p.money = 60000; UIX.ui().tab = "jugador"; UIX.render(true); const c = document.querySelector(".petcta"); if (c) c.click(); });
  await j.waitForTimeout(300);
  await j.c('[data-a="petpick"][data-v="dog"]'); await j.fill("#petnm", "Toby"); await j.c('[data-a="petadopt"]');
  await j.waitForTimeout(300);
  await j.evaluate(() => { petBuyAcc && petBuyAcc("cap"); petBuyAcc && petBuyAcc("scarf"); S.p.trophies.push({ k: "L:1", n: "Liga", y: S.yr, s: "x", w: 10 }); petAccSync(false); try { petWear("cap"); } catch (e) {} try { petSetCol("gold"); } catch (e) {} UIX.renderSheet(); });
  await j.c('[data-a="petview"][data-v="style"]'); await j.c('[data-a="petview"][data-v="care"]');
  await j.waitForTimeout(3200);
  await shot(j, "mascota");

  /* imagen para redes, 1200 × 630 */
  const og = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
  await og.goto("file://" + path.join(ROOT, "dist/site/index.html")); await og.waitForTimeout(600);
  await og.goto("file://" + path.join(ROOT, "dist/site/index.html")); await og.waitForTimeout(1600);
  const fig = await og.$(".match");
  await fig.screenshot({ path: path.join(TMP, "match.png") });
  await og.evaluate(src => {
    document.body.innerHTML = '<div style="width:1200px;height:630px;display:grid;grid-template-columns:1fr 590px;gap:44px;align-items:center;padding:0 56px;box-sizing:border-box;background:#0b1417">' +
      '<div><div style="display:flex;align-items:center;gap:14px;font:800 30px/1 var(--f-disp);color:#edf1e8;margin-bottom:28px"><img src="img/icon-192.png" style="width:56px;height:56px;border-radius:14px">Camino a la Leyenda</div>' +
      '<div style="font:900 70px/.92 var(--f-disp);color:#edf1e8">Crea a tu futbolista y llévalo hasta la leyenda.</div>' +
      '<div style="margin-top:26px;font:700 22px/1 var(--f-body);color:#ffb21e">Gratis en el navegador</div></div>' +
      '<img src="' + src + '" style="width:590px;border-radius:20px"></div>';
  }, "file://" + path.join(TMP, "match.png"));
  await og.waitForTimeout(500);
  await og.screenshot({ path: path.join(IMG, "og.png") });
  await b.close();
  /* a webp, 620 px de ancho */
  const py = "from PIL import Image\nimport sys\nfor n in sys.argv[2:]:\n  im=Image.open(sys.argv[1]+'/'+n+'.png').convert('RGB'); w=620; im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); im.save('" + IMG + "/shot-'+n+'.webp',quality=80,method=6)\nim=Image.open('" + IMG + "/og.png').convert('RGB'); im.quantize(200).save('" + IMG + "/og.png',optimize=True)";
  execFileSync("python3", ["-c", py, TMP, "directo", "carrera", "plantilla", "mascota"].filter(n => n !== "directo" || fs.existsSync(path.join(TMP, "directo.png"))), { stdio: "inherit" });
  console.log("listo");
})();
