// Playwright: mundo de la mascota 5.6 (abrir, modos, toques, capturas, sin errores)
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 412, height: 860 } }); let errs = [];
  p.on("pageerror", e => errs.push(e.message + " " + (e.stack || "").split("\n")[1])); p.on("console", m => { if (m.type() === "error") errs.push("CON " + m.text()); });
  await p.goto("file:///home/claude/camino/dist/index.html"); await p.waitForTimeout(600);
  const kind = process.argv[2] || "dog";
  const ok = await p.evaluate((k) => {
    S = {yr: 2026, p: {money: 50000, mor: 50, fame: 10, life: {}, club: 0, trophies: [], awards: []}, feed: []};
    window.lifeOn = () => true; window.lifeOf = () => S.p.life;
    S.p.life.pet = PetSim.fresh(k, "Toby"); PetSim.inv(); S.p.life.petAcc = ["cap", "scarf", "jersey", "boots", "cape", "sun"]; S.p.life.pet.eq = {h: "cap", n: "scarf"};
    S.p.life.pet.age = 3; S.p.life.pet.dirt = 2;
    return PetWorld.open();
  }, kind);
  console.log("open", ok);
  const pc = async (s) => { await p.$eval(s, e => e.click()); await p.waitForTimeout(120); };
  const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: "/tmp/claude-0/pw-" + kind + "-" + n + ".png" }); };
  await shot("home");
  // toque y caricia
  await p.mouse.move(206, 520); await p.mouse.down(); for (let i = 0; i < 10; i++) await p.mouse.move(196 + (i % 2) * 30, 520); await p.mouse.up();
  const modes = ["care", "play", "train", "dress", "out"];
  for (const m of modes) { await p.click(`.pw-bar [data-v="${m}"]`); await shot(m); }
  await p.click('.pw-bar [data-v="care"]'); await pc('[data-pw="food"]'); await p.waitForTimeout(2500); await shot("eat");
  await pc('[data-pw="bath"]'); await p.waitForTimeout(300); await shot("bath");
  await p.click('.pw-bar [data-v="train"]'); await p.waitForTimeout(800); await pc('[data-pw="cmd"]'); await p.waitForTimeout(1500); await shot("trick");
  await p.click('.pw-bar [data-v="out"]'); if (await p.$('[data-pw="walk"]:not([disabled])')) { await pc('[data-pw="walk"]:not([disabled])'); await p.waitForTimeout(500);
  await p.dispatchEvent(".pw-hold", "pointerdown"); await p.waitForTimeout(2500); await shot("walk"); await p.dispatchEvent(".pw-hold", "pointerup");
  await pc('[data-pw="end"]'); } else await shot("walk");
  await p.click('.pw-bar [data-v="home"]'); await p.click('.pw-bar [data-v="out"]'); await pc('[data-pw="shop"]'); await shot("shop");
  const fps = await p.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); })(); }));
  console.log("fps(swiftshader)", fps);
  const th = await p.evaluate(() => { PetWorld.close(true); return (PetWorld.thumb(S.p.life.pet) || "").length; }); console.log("thumb", th);
  console.log(errs.length ? "ERRORS\n" + errs.slice(0, 10).join("\n") : "no errors");
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
