const { chromium } = require("playwright");
(async () => { const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const p = await b.newPage({viewport:{width:360,height:740},deviceScaleFactor:1.5}); p.on("pageerror", e => console.log("ERR", e.message));
await p.goto("file:///home/claude/camino/dist/index.html"); await p.waitForTimeout(500);
await p.evaluate(() => { buildWorld("m"); newCareer({fn: "A", ln: "B", nat: "ES", pos: "MC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 9}); S.p.money = 1e7; petAdopt("dog", "Rex"); const pt = petOf(); pt.age = 5; pt.tricks = 5; petBuyAcc("bone"); S.bi = 1; View3D.pet({}); });
await p.waitForTimeout(1500);
// petting: drag over center of pet (center of screen roughly)
await p.mouse.move(180, 330); await p.mouse.down();
for (let i = 0; i < 20; i++) { await p.mouse.move(150 + (i % 2) * 60, 330 + (i % 3) * 8, {steps: 3}); await p.waitForTimeout(40); }
await p.screenshot({path: "/tmp/claude-0/play-pet.png"}); await p.mouse.up();
await p.waitForTimeout(600);
await p.mouse.click(90, 470); await p.waitForTimeout(1300); await p.screenshot({path: "/tmp/claude-0/play-call.png"});
await p.evaluate(() => document.querySelector('[data-v3d="ball"]').click());
await p.waitForTimeout(1200); await p.screenshot({path: "/tmp/claude-0/play-ball1.png"});
await p.waitForTimeout(1800); await p.screenshot({path: "/tmp/claude-0/play-ball2.png"});
await p.waitForTimeout(2200); await p.screenshot({path: "/tmp/claude-0/play-ball3.png"});
await p.evaluate(() => document.querySelector('[data-v3d="t2"]').click()); await p.waitForTimeout(600); await p.screenshot({path: "/tmp/claude-0/play-trick.png"});
await b.close(); })();
