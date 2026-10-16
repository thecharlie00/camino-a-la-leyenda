const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SRC = path.join(__dirname, "../src");
const js = ["data.js", "engine-core.js", "trophies.js"].map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
const out = process.argv[2];
(async () => {
  const html = `<!doctype html><meta charset="utf-8"><body style="background:#0b1417;color:#edf1e8;font:12px sans-serif;margin:12px">
  <div id="g" style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px"></div><script>${js}
  buildWorld();
  document.body.insertAdjacentHTML("afterbegin", trophyDefs());
  var keys = Object.keys(TROPHY_SPEC).concat(["L:ESP1","L:ENG1","L:ESP2","L:ARG1","CUP:ES","CUP:ENG","SC:ES","SC:IT"]);
  document.getElementById("g").innerHTML = keys.map(function(k){ return '<div style="text-align:center;background:#18292f;border-radius:10px;padding:8px">' + trophySVG(k, 64) + '<div>' + k + '</div></div>'; }).join("");
  </script>`;
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1.5 });
  const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: out, fullPage: true });
  console.log("errores:", errs);
  await b.close();
})();
