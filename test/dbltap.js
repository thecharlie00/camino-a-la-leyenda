const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  for (const mode of ["p", "mgr"]) {
    const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })).newPage();
    await p.goto("file://" + path.join(__dirname, "../dist/index.html") + ""); await p.waitForTimeout(300);
    await p.evaluate(m => { document.querySelector('[data-a="setlang"][data-v="es"]').click(); buildWorld("m");
      if (m === "p") newCareer({fn: "Ana", ln: "Dbl", nat: "ES", pos: "DC", foot: "Diestro", age: 17, talent: "promesa", club: -1, ev: 1, seed: 3});
      else newManagerCareer({fn: "Pep", ln: "Dbl", nat: "ES", age: 40, diff: 1, ev: 1, club: W.clubs.findIndex(c => c.lg0 === 0), seed: 3});
      S.ntf = []; UIX.ui().view = "game"; UIX.render(true); const n = document.getElementById("ntfs"); if (n) n.remove(); }, mode);
    await p.waitForTimeout(400);
    const ch = await p.$('.card.decision [data-a="choose"]'); await ch.scrollIntoViewIfNeeded(); const box = await ch.boundingBox();
    const k0 = await p.evaluate(() => S.pend.map(x => x.k).join(","));
    await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(90); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(300);
    const k1 = await p.evaluate(() => S.pend.map(x => x.k).join(","));
    console.log(mode, "antes:", k0, "| tras doble toque:", k1);
  }
  await b.close();
})();
