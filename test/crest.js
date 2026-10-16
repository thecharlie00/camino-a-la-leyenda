// Galería de escudos y camisetas: node test/crest.js [salida.png]  (por defecto /tmp/crest-gallery.png)
const path = require("path");
const { chromium } = require("playwright");
const out = process.argv[2] || "/tmp/crest-gallery.png";
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("file://" + path.join(__dirname, "crest.html"));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const n = await p.evaluate(() => ({ svgs: document.querySelectorAll("svg").length, ids: (function () { var s = {}, d = 0; document.querySelectorAll("[id]").forEach(function (e) { if (s[e.id]) d++; s[e.id] = 1; }); return d; })() }));
  await p.screenshot({ path: out, fullPage: true });
  console.log("svg:", n.svgs, "ids duplicados:", n.ids, "errores:", errs);
  await b.close();
  if (errs.length || n.ids) process.exit(1);
})();
