/* 5.6: la mascota en el banquillo del partido 3D (se crea, se dibuja y reacciona a un gol sin errores) */
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 800, height: 500 } }); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => {
    document.body.innerHTML = '<div id="h" style="width:800px;height:450px"></div>';
    const pt = PetSim.fresh("dog", "Toby"); pt.age = 4; pt.eq = {n: "scarf"}; S = S || {}; 
    const ok = Pitch3D.mount(document.getElementById("h"), {cols: ["#c33", "#33c"], pet: pt, mySide: 0});
    await new Promise(r => setTimeout(r, 2500));
    const a = Pitch3D._pet();
    return {ok: !!ok, pet: !!a, parts: a ? Object.keys(a.W).length : 0};
  });
  console.log(JSON.stringify(r)); await p.screenshot({path: "/tmp/claude-0/match-pet.png"});
  console.log(errs.length ? "ERR " + errs.slice(0, 5).join("\n") : "no errors");
  await b.close(); process.exit(r.pet && !errs.length ? 0 : 1);
})();
