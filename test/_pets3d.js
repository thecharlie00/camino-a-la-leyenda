const { chromium } = require("playwright");
(async () => { const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const p = await b.newPage({viewport:{width:360,height:740},deviceScaleFactor:1.5}); p.on("pageerror", e => console.log("ERR", e.message)); p.on("console", m => { if (/view3d|Error/.test(m.text())) console.log("CON", m.text()); });
await p.goto("file:///home/claude/camino/dist/index.html"); await p.waitForTimeout(500);
await p.evaluate(() => { buildWorld("m"); newCareer({fn: "A", ln: "B", nat: "ES", pos: "MC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 9}); S.p.money = 1e7; });
const sp = (process.argv[2] || "dog,cat,rabbit,hamster,fish,turtle,macaw,iguana,python,hedgehog,fennec,capybara,tarantula").split(",");
for (const k of sp) {
  const r = await p.evaluate((k) => { const L = lifeOf(); L.pet = null; petAdopt(k, "Rex"); const pt = petOf(); pt.age = Math.round(pt.life * 0.4); pt.tricks = 4; petBuyAcc("cap"); petBuyAcc("scarf"); S.bi = (["dog","cat"].indexOf(k) >= 0 ? 0 : k.length) % 5; return View3D.pet({}); }, k);
  await p.waitForTimeout(2200);
  await p.screenshot({path: "/tmp/claude-0/p3d-" + k + ".png"});
  await p.evaluate(() => View3D.close()); await p.waitForTimeout(450);
  console.log(k, r);
}
await b.close(); })();
